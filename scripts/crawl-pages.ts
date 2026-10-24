// Finds each item's real docs page for registries without a `page` function.
// Sites rarely follow one url pattern (`/components/button/<name>`,
// `/block/<name>` next to `/animated-components/<name>`), so instead of
// guessing, read the urls the site itself publishes in its sitemap and docs
// navigation and match them to item names.

import type { Registry, RegistryItem } from "../src/registries";

const TIMEOUT = 15_000;
const LOC = /<loc>([^<]+)<\/loc>/g;
const SITEMAP_LOC = /<loc>([^<]+\.xml)<\/loc>/g;
// hrefs, and quoted paths in serialized payloads (next puts its nav there)
const PATH = /(?:href=["']|["'])(\/[a-z\d][\w./-]*)["']/gi;
const TRAILING_SLASH = /\/$/;
const ASSET = /\.(?:json|xml|png|jpe?g|svg|webp|ico|css|js|mjs|txt|woff2?)$/i;

async function get(url: string) {
	try {
		const response = await fetch(url, {
			headers: { "user-agent": "Mozilla/5.0 shadcnview" },
			signal: AbortSignal.timeout(TIMEOUT),
		});
		return response.ok
			? { body: await response.text(), url: response.url }
			: undefined;
	} catch {
		return;
	}
}

/** every page url on the registry's host from its sitemaps and docs index pages */
async function siteUrls(registry: Registry) {
	const home = new URL(registry.homepage);
	const urls = new Set<string>();
	const add = (body: string, base: string) => {
		for (const [, loc] of body.matchAll(LOC)) urls.add(loc?.trim() ?? "");
		for (const [, path] of body.matchAll(PATH)) {
			try {
				urls.add(new URL(path ?? "", base).toString());
			} catch {
				// not a url
			}
		}
	};

	for (const sitemap of ["sitemap.xml", "sitemap-0.xml", "sitemap_index.xml"]) {
		const response = await get(new URL(`/${sitemap}`, home.origin).toString());
		if (!response?.body.includes("<loc>")) continue;
		add(response.body, home.origin);
		// sitemap indexes point at more sitemaps
		for (const [, nested] of response.body.matchAll(SITEMAP_LOC)) {
			const child = await get(nested ?? "");
			if (child) add(child.body, home.origin);
		}
	}

	const base = registry.homepage.replace(TRAILING_SLASH, "");
	const indexPages = new Set([
		`${base}/docs`,
		`${home.origin}/blocks`,
		`${home.origin}/components`,
		`${home.origin}/docs/components`,
		`${home.origin}/docs`,
		base,
	]);
	for (const page of indexPages) {
		const response = await get(page);
		if (response) add(response.body, response.url);
	}

	return [...urls].flatMap((url) => {
		try {
			const parsed = new URL(url);
			if (parsed.host !== home.host || ASSET.test(parsed.pathname)) return [];
			return [`${parsed.origin}${parsed.pathname.replace(TRAILING_SLASH, "")}`];
		} catch {
			return [];
		}
	});
}

/** the url with the item's own segment swapped for a placeholder */
const templateOf = (url: string, leaf: string) =>
	url.slice(0, url.length - leaf.length);

/**
 * item name → docs page. A name can match several urls (`button` under
 * `/components/button/` and `/components/badge/`), the one following the
 * registry's most common pattern wins, and a pattern needs two hits before
 * it's trusted so one-off links like a blog post don't count
 */
export async function crawlPages(registry: Registry, items: RegistryItem[]) {
	const byLeaf = new Map<string, string[]>();
	for (const url of await siteUrls(registry)) {
		const leaf = url.split("/").pop() ?? "";
		byLeaf.set(leaf, [...(byLeaf.get(leaf) ?? []), url]);
	}

	const leafOf = (item: RegistryItem) => item.name.split("/").pop() ?? "";
	const counts = new Map<string, number>();
	for (const item of items) {
		const leaf = leafOf(item);
		for (const template of new Set(
			(byLeaf.get(leaf) ?? []).map((url) => templateOf(url, leaf)),
		)) {
			counts.set(template, (counts.get(template) ?? 0) + 1);
		}
	}

	const pages = new Map<string, string>();
	for (const item of items) {
		const leaf = leafOf(item);
		const best = (byLeaf.get(leaf) ?? [])
			.map((url) => ({ count: counts.get(templateOf(url, leaf)) ?? 0, url }))
			.filter(({ count }) => count >= 2 || items.length <= 2)
			.toSorted((a, b) => b.count - a.count || a.url.length - b.url.length)[0];
		if (best) pages.set(item.name, best.url);
	}
	return pages;
}
