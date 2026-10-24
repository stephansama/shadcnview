import {
	type ActiveFilter,
	activeFilters,
	type Filters,
	removeFilter,
} from "#/lib/filters";

import { FrameworkIcon } from "./framework-badge";
import { Icon } from "./icon";

const LABELS: Record<ActiveFilter["facet"], string> = {
	frameworks: "framework",
	registries: "registry",
	types: "type",
	zeroDeps: "deps",
};

/** the active filters as removable chips, at the top of the filters popover */
export function FilterChips({
	filters,
	onChange,
}: {
	filters: Filters;
	onChange: (filters: Filters) => void;
}) {
	const active = activeFilters(filters);
	if (active.length === 0) return;

	return (
		<div className="flex max-h-24 shrink-0 flex-wrap items-center gap-1.5 overflow-y-auto border-b px-3 py-2 text-xs">
			{active.map((filter) => (
				<span
					className="inline-flex h-6 items-center gap-1 rounded-sm border bg-card pr-0.5 pl-2"
					key={`${filter.facet}:${filter.value}`}
				>
					<span className="text-muted-foreground">{LABELS[filter.facet]}</span>
					{filter.facet === "frameworks" && (
						<FrameworkIcon className="size-3" framework={filter.value} />
					)}
					{filter.value}
					<button
						aria-label={`remove ${LABELS[filter.facet]} ${filter.value}`}
						className="rounded-sm p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
						onClick={() => onChange(removeFilter(filters, filter))}
						type="button"
					>
						<Icon className="size-3" name="x" />
					</button>
				</span>
			))}
		</div>
	);
}
