// Fetches every registry index into `public/data/registries.json`, and each
// registry's favicon into `public/favicons/`.
// Exits early when the snapshot already exists, pass `--force` to refetch
// (`build` always does). Runs before `dev` and `build`, so the
// browser never fetches an index itself, most of them don't send CORS headers,
// and visitors' browsers don't hit a third party favicon service.

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Snapshot, SnapshotSummary } from "../src/lib/snapshot";

import {
	HIDDEN_TYPES,
	itemUrl,
	registries,
	type Registry,
	type RegistryItem,
} from "../src/registries";
import { crawlPages } from "./crawl-pages";

const OUT = path.join(import.meta.dirname, "../public/data/registries.json");
const FAVICONS = path.join(import.meta.dirname, "../public/favicons");
// what the prerendered shell needs before the full snapshot has loaded
const SUMMARY = path.join(import.meta.dirname, "../src/generated/summary.json");
// served from the site instead of github so the about popover shows it at once,
// gitignored like the rest of what this writes
const AVATAR = path.join(import.meta.dirname, "../public/avatar.jpg");
const AVATAR_URL = "https://github.com/stephansama.png?size=112";
const MAX_FAVICON_BYTES = 256 * 1024;
const LINK_TAG = /<link\b[^>]*>/gi;
const REL = /\brel=["']([^"']+)["']/i;
const HREF = /\bhref=["']([^"']+)["']/i;
const ICON_REL = /(?:^|\s)(?:icon|apple-touch-icon)(?:\s|$)/i;
const FAVICON_EXTENSIONS: Record<string, string> = {
	"image/gif": "gif",
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/svg+xml": "svg",
	"image/vnd.microsoft.icon": "ico",
	"image/webp": "webp",
	"image/x-icon": "ico",
};
const CONCURRENCY = 12;
const TIMEOUT = 20_000;
// some indexes ship whole paragraphs, the table only ever shows a line
const MAX_DESCRIPTION = 280;

// only keep the fields the table shows, the full items carry file contents
const slim = (item: RegistryItem): RegistryItem => ({
	categories: item.categories?.length ? item.categories : undefined,
	dependencies: item.dependencies?.length ? item.dependencies : undefined,
	description: item.description?.slice(0, MAX_DESCRIPTION) || undefined,
	devDependencies: item.devDependencies?.length
		? item.devDependencies
		: undefined,
	name: item.name,
	page: item.page,
	registryDependencies: item.registryDependencies?.length
		? item.registryDependencies
		: undefined,
	title: item.title || undefined,
	type: item.type,
});

async function avatar() {
	try {
		const response = await fetch(AVATAR_URL, {
			signal: AbortSignal.timeout(TIMEOUT),
		});
		if (!response.ok) throw new Error(`${response.status}`);
		await writeFile(AVATAR, new Uint8Array(await response.arrayBuffer()));
		console.log("avatar → public/avatar.jpg");
	} catch (error) {
		// the popover falls back to loading it from github
		console.warn(`✗ avatar ${String(error)}`);
	}
}

/** a registry without an index: fetch every discovered item's own json */
async function discovered(registry: Registry): Promise<RegistryItem[]> {
	const names = (await registry.discover?.()) ?? [];
	if (names.length === 0) throw new Error("discover found no items");

	const items = await Promise.all(
		names.map(async (name) => {
			const response = await fetch(itemUrl(registry, { name, type: "" }), {
				signal: AbortSignal.timeout(TIMEOUT),
			});
			return response.ok
				? ((await response.json()) as RegistryItem)
				: undefined;
		}),
	);
	return items.filter((item) => item !== undefined);
}

/** downloads the registry's favicon and returns its public path */
async function favicon(registry: Registry) {
	const slug = registry.name.toLowerCase().replaceAll(/[^a-z\d]+/g, "-");
	for (const url of await faviconCandidates(registry)) {
		try {
			const response = await fetch(url, {
				signal: AbortSignal.timeout(TIMEOUT),
			});
			const type = response.headers.get("content-type")?.split(";")[0] ?? "";
			const extension = FAVICON_EXTENSIONS[type];
			if (!response.ok || !extension) continue;

			const bytes = new Uint8Array(await response.arrayBuffer());
			if (bytes.length === 0 || bytes.length > MAX_FAVICON_BYTES) continue;

			await writeFile(path.join(FAVICONS, `${slug}.${extension}`), bytes);
			return `/favicons/${slug}.${extension}`;
		} catch {
			// try the next candidate
		}
	}
}

// `<link rel="icon" href>` candidates from the homepage, svg first since they
// scale, then the conventional `/favicon.ico`
async function faviconCandidates(registry: Registry) {
	const candidates: string[] = [];
	try {
		const response = await fetch(registry.homepage, {
			signal: AbortSignal.timeout(TIMEOUT),
		});
		const html = await response.text();
		for (const [tag] of html.matchAll(LINK_TAG)) {
			const relation = REL.exec(tag)?.[1] ?? "";
			const href = HREF.exec(tag)?.[1];
			if (!href || href.startsWith("data:")) continue;
			if (!ICON_REL.test(relation)) continue;
			candidates.push(new URL(href, response.url).toString());
		}
	} catch {
		// an unreachable homepage still gets the `/favicon.ico` attempt
	}

	candidates.sort(
		(a, b) => Number(b.includes(".svg")) - Number(a.includes(".svg")),
	);
	candidates.push(new URL("/favicon.ico", registry.homepage).toString());
	return [...new Set(candidates)];
}

async function indexed(registry: Registry): Promise<RegistryItem[]> {
	const response = await fetch(registry.index, {
		headers: { accept: "application/json" },
		signal: AbortSignal.timeout(TIMEOUT),
	});
	if (!response.ok)
		throw new Error(`${response.status} ${response.statusText}`);

	// `index.json` is a bare array, `registry.json` wraps it in `{ items }`
	const json = (await response.json()) as
		RegistryItem[] | { items?: RegistryItem[] };
	const items = Array.isArray(json) ? json : json.items;
	if (!Array.isArray(items)) throw new Error("no items in index");
	return items;
}

async function load(registry: Registry): Promise<RegistryItem[]> {
	const items = registry.discover
		? await discovered(registry)
		: await indexed(registry);

	return items
		.filter((item) => item?.name && item.type && !HIDDEN_TYPES.has(item.type))
		.filter((item) => registry.filter?.(item) ?? true)
		.map((item) => slim(item));
}

/** fetches every registry and writes the snapshot */
async function run() {
	await mkdir(FAVICONS, { recursive: true });

	const snapshot: Snapshot = {
		builtAt: new Date().toISOString(),
		registries: {},
	};

	const queue: Registry[] = [...registries];
	await Promise.all(
		Array.from({ length: CONCURRENCY }, async () => {
			for (let registry = queue.shift(); registry; registry = queue.shift()) {
				const icon = favicon(registry);
				try {
					// one retry, a flaky host shouldn't drop a whole registry from a deploy
					let items = await load(registry).catch(() => load(registry));
					if (!registry.page) {
						const pages = await crawlPages(registry, items);
						items = items.map((item) => ({
							...item,
							page: pages.get(item.name),
						}));
					}
					snapshot.registries[registry.name] = { favicon: await icon, items };
					console.log(
						`  ${registry.name.padEnd(28)} ${String(items.length).padEnd(6)} ${(await icon) ? "" : "no favicon"}`,
					);
				} catch (error) {
					const message =
						error instanceof Error ? error.message : String(error);
					snapshot.registries[registry.name] = {
						error: message,
						favicon: await icon,
						items: [],
					};
					console.warn(`✗ ${registry.name.padEnd(28)} ${message}`);
				}
			}
		}),
	);

	const all = Object.values(snapshot.registries);
	const failed = all.filter((r) => r.error).length;
	const total = all.reduce((sum, r) => sum + r.items.length, 0);

	await mkdir(path.dirname(OUT), { recursive: true });
	await writeFile(OUT, JSON.stringify(snapshot));

	const summary: SnapshotSummary = {
		builtAt: snapshot.builtAt,
		registries: Object.fromEntries(
			Object.entries(snapshot.registries).map(([name, entry]) => [
				name,
				// unique names, the table drops the duplicates a few indexes list
				{
					count: new Set(entry.items.map((item) => item.name)).size,
					favicon: entry.favicon,
				},
			]),
		),
		total: 0,
	};
	summary.total = Object.values(summary.registries).reduce(
		(sum, { count }) => sum + count,
		0,
	);
	await mkdir(path.dirname(SUMMARY), { recursive: true });
	await writeFile(SUMMARY, JSON.stringify(summary));
	console.log(
		`\n${total} items from ${all.length - failed} registries (${failed} failed) → public/data/registries.json`,
	);
}

const force = process.argv.includes("--force");
if (force || !existsSync(OUT)) {
	await run();
} else {
	console.log(
		"public/data/registries.json already exists, `pnpm snapshot --force` refetches it",
	);
}
if (force || !existsSync(AVATAR)) await avatar();
