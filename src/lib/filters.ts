import type { Framework } from "#/registries";

/** the facets the filters popover sets, empty lists mean "any" */
export type Filters = {
	frameworks: Framework[];
	registries: string[];
	types: string[];
	zeroDeps: boolean;
};

/** how filters live in the url, comma lists so links stay readable */
export type FilterSearch = {
	fw?: string;
	reg?: string;
	type?: string;
	zero?: boolean;
};

export const FRAMEWORKS = [
	"react",
	"react-native",
	"svelte",
	"vue",
	"templ",
] as const;

const list = (value: unknown) =>
	typeof value === "string" && value ? value.split(",") : [];

export function filtersFromSearch(search: FilterSearch): Filters {
	return {
		frameworks: list(search.fw) as Framework[],
		registries: list(search.reg),
		types: list(search.type),
		zeroDeps: search.zero === true,
	};
}

export function filtersToSearch(filters: Filters): FilterSearch {
	return {
		fw: filters.frameworks.join(",") || undefined,
		reg: filters.registries.join(",") || undefined,
		type: filters.types.join(",") || undefined,
		zero: filters.zeroDeps || undefined,
	};
}

export function parseFilterSearch(
	search: Record<string, unknown>,
): FilterSearch {
	const frameworks = list(search.fw).filter((fw) =>
		(FRAMEWORKS as readonly string[]).includes(fw),
	);

	return {
		fw: frameworks.join(",") || undefined,
		reg: list(search.reg).join(",") || undefined,
		type: list(search.type).join(",") || undefined,
		zero: search.zero === true || search.zero === "true" ? true : undefined,
	};
}

export const NO_FILTERS: Filters = {
	frameworks: [],
	registries: [],
	types: [],
	zeroDeps: false,
};

export type ActiveFilter = ReturnType<typeof activeFilters>[number];

/** each set value as its own removable chip */
export function activeFilters(filters: Filters) {
	return [
		...filters.frameworks.map(
			(value) => ({ facet: "frameworks", value }) as const,
		),
		...filters.types.map((value) => ({ facet: "types", value }) as const),
		...filters.registries.map(
			(value) => ({ facet: "registries", value }) as const,
		),
		...(filters.zeroDeps ? [{ facet: "zeroDeps", value: "0" } as const] : []),
	];
}

export function removeFilter(filters: Filters, active: ActiveFilter): Filters {
	if (active.facet === "zeroDeps") return { ...filters, zeroDeps: false };

	return {
		...filters,
		[active.facet]: (filters[active.facet] as string[]).filter(
			(value) => value !== active.value,
		),
	};
}

/** table column filters, one per facet that's set */
export function toColumnFilters(filters: Filters) {
	return [
		filters.frameworks.length > 0 && {
			id: "framework",
			value: filters.frameworks,
		},
		filters.types.length > 0 && { id: "type", value: filters.types },
		filters.registries.length > 0 && {
			id: "registry",
			value: filters.registries,
		},
		filters.zeroDeps && { id: "depCount", value: true },
	].filter((filter) => filter !== false);
}

export function toggle<T extends string>(values: T[], value: T): T[] {
	return values.includes(value)
		? values.filter((existing) => existing !== value)
		: [...values, value];
}
