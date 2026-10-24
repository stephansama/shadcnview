// The table's visible columns in order, with their starting widths. Kept apart
// from the table so the prerendered shell and the inline preload script can
// lay out the same header without pulling in the table itself.

import type { Filters } from "./filters";

export type ColumnId =
	"actions" | "depCount" | "description" | "framework" | "name" | "type";

export const COLUMNS: {
	header: string;
	id: ColumnId;
	size: number;
	sortable: boolean;
}[] = [
	{ header: "component", id: "name", size: 260, sortable: true },
	{ header: "type", id: "type", size: 110, sortable: true },
	{ header: "description", id: "description", size: 360, sortable: true },
	{ header: "deps", id: "depCount", size: 84, sortable: true },
	{ header: "framework", id: "framework", size: 124, sortable: false },
	{ header: "", id: "actions", size: 76, sortable: false },
];

export const COLUMN_SIZE = Object.fromEntries(
	COLUMNS.map(({ id, size }) => [id, size]),
) as Record<ColumnId, number>;

/** the description takes what's left, never less than this */
export const DESCRIPTION_MIN = 80;

/** the grid for the given columns, as the table and shell both lay it out */
export function gridFor(columns: { id: string; size: number }[]) {
	return {
		minWidth: columns.reduce(
			(sum, { id, size }) =>
				sum + (id === "description" ? DESCRIPTION_MIN : size),
			0,
		),
		template: columns
			.map(({ id, size }) =>
				id === "description"
					? `minmax(${DESCRIPTION_MIN}px, 1fr)`
					: `${size}px`,
			)
			.join(" "),
	};
}

/**
 * a column pinned to one value by its filter would repeat it on every row, so
 * it's hidden. The preload script repeats this rule for the url before paint
 */
export function hiddenColumns(filters: Filters): ColumnId[] {
	return [
		filters.types.length === 1 && ("type" as const),
		filters.zeroDeps && ("depCount" as const),
		filters.frameworks.length === 1 && ("framework" as const),
	].filter((id) => id !== false);
}
