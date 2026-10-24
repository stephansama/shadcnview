import type { IFuseOptions, RangeTuple } from "fuse.js";

import { FuseWorker } from "fuse.js/worker";
// vite pre-bundles fuse, which breaks its own `import.meta.url` worker lookup
import workerUrl from "fuse.js/worker-script?worker&url";

import type { ComponentRow } from "./rows";

/** the row fields search looks at, a name match counts most */
const KEYS = [
	{ name: "name", weight: 3 },
	{ name: "title", weight: 2 },
	{ name: "registry", weight: 1.5 },
	{ name: "description", weight: 1 },
] as const;

/** per row, the matched character ranges of each field */
export type Highlights = Map<
	string,
	Partial<Record<SearchKey, readonly RangeTuple[]>>
>;

export type SearchKey = (typeof KEYS)[number]["name"];

/** only what's searched crosses into the workers */
type SearchDocument = Pick<ComponentRow, "id" | SearchKey>;

const OPTIONS: IFuseOptions<SearchDocument> = {
	// matches anywhere in a description count, not just near the start
	ignoreLocation: true,
	includeMatches: true,
	includeScore: true,
	keys: KEYS.map((key) => ({ ...key })),
	// single letter runs inside a fuzzy match are noise to highlight
	minMatchCharLength: 2,
	threshold: 0.3,
};

/**
 * fuse over every row, sharded across web workers so a long query doesn't
 * block typing. Call `terminate` when the rows go away
 */
export function createSearch(rows: ComponentRow[]) {
	const byId = new Map(rows.map((row) => [row.id, row]));
	const fuse = new FuseWorker<SearchDocument>(
		rows.map(({ description, id, name, registry, title }) => ({
			description,
			id,
			name,
			registry,
			title,
		})),
		OPTIONS,
		{ workerUrl },
	);

	const search = async (query: string) => {
		const results = await fuse.search(query);
		const highlights: Highlights = new Map();
		const matched: ComponentRow[] = [];
		for (const { item, matches } of results) {
			const row = byId.get(item.id);
			if (!row) continue;
			matched.push(row);

			const fields: Partial<Record<SearchKey, readonly RangeTuple[]>> = {};
			for (const match of matches ?? []) {
				if (match.key) fields[match.key as SearchKey] = match.indices;
			}
			highlights.set(item.id, fields);
		}

		// best match first, the table groups keep that order so the registries
		// with the strongest hits come up top
		return { highlights, rows: matched };
	};

	return { search, terminate: () => fuse.terminate() };
}
