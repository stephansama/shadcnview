// Samples a few items per registry from the snapshot and checks that their
// docs page loads (and can be framed) and that the item json for the add
// command exists. Use it after adding a registry or changing a `page` function.
//
//   pnpm check-pages            every registry
//   pnpm check-pages kibo reui  only names containing these

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Snapshot } from "../src/lib/snapshot";

import {
	itemUrl,
	pageFor,
	registries,
	type Registry,
	type RegistryItem,
} from "../src/registries";

const SAMPLE = 3;
const TIMEOUT = 15_000;

const snapshot = JSON.parse(
	await readFile(
		path.join(import.meta.dirname, "../public/data/registries.json"),
		"utf8",
	),
) as Snapshot;
const only = process.argv.slice(2);

// spread across the index rather than the first few, which are often all one type
const sample = (items: RegistryItem[]) =>
	Array.from(
		new Set(
			Array.from({ length: SAMPLE }, (_, index) =>
				Math.floor((index * items.length) / SAMPLE),
			),
		),
		(index) => items[index],
	).filter(Boolean);

async function check(url: string) {
	try {
		const response = await fetch(url, {
			redirect: "follow",
			signal: AbortSignal.timeout(TIMEOUT),
		});
		const xfo = response.headers.get("x-frame-options");
		const csp = response.headers.get("content-security-policy") ?? "";
		const framing =
			xfo || (csp.includes("frame-ancestors") ? "frame-ancestors" : "");
		return { framing, status: response.status };
	} catch (error) {
		return { error: String(error), framing: "", status: 0 };
	}
}

let problems = 0;
for (const registry of registries as readonly Registry[]) {
	if (only.length > 0 && !only.some((o) => registry.name.includes(o))) continue;

	const items = snapshot.registries[registry.name]?.items ?? [];
	for (const item of sample(items)) {
		const page = pageFor(registry, item);
		const [pageResult, jsonResult] = await Promise.all([
			check(page),
			// builtin and namespaced registries install through the cli's own lookup
			registry.builtin || registry.namespace
				? undefined
				: check(itemUrl(registry, item)),
		]);

		const issues = [
			pageResult.status !== 200 && `page ${pageResult.status}`,
			registry.embed !== false &&
				pageResult.framing &&
				`framing: ${pageResult.framing}, set \`embed: false\``,
			jsonResult &&
				jsonResult.status !== 200 &&
				`item json ${jsonResult.status}`,
		].filter(Boolean);

		if (issues.length > 0) {
			problems++;
			console.log(
				`✗ ${registry.name.padEnd(26)} ${item.name.padEnd(30)} ${issues.join(", ")}  ${page}`,
			);
		}
	}
}

console.log(problems ? `\n${problems} problem(s)` : "all sampled pages ok");
