import { useState } from "react";

import type { RegistryStatus } from "#/lib/rows";

import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Switch } from "#/components/ui/switch";
import {
	activeFilters,
	type Filters,
	FRAMEWORKS,
	NO_FILTERS,
	toggle,
} from "#/lib/filters";
import { cn } from "#/lib/utils";

import type { RegistryTableModel } from "./registry-table";

import { FilterChips } from "./filter-chips";
import { FrameworkIcon } from "./framework-badge";
import { Icon } from "./icon";
import { RegistryFavicon } from "./registry-favicon";

/** facet counts from the table, each one ignoring its own filter */
const facet = (table: RegistryTableModel, columnId: string) =>
	(table.getColumn(columnId)?.getFacetedUniqueValues() ?? new Map()) as Map<
		string,
		number
	>;

export function FiltersPopover({
	filters,
	onChange,
	onOpenChange,
	open,
	statuses,
	table,
}: {
	filters: Filters;
	onChange: (filters: Filters) => void;
	onOpenChange: (open: boolean) => void;
	open: boolean;
	statuses: RegistryStatus[];
	table: RegistryTableModel;
}) {
	const active = activeFilters(filters).length;

	return (
		<Popover onOpenChange={onOpenChange} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-label={active > 0 ? `filters, ${active} active` : "filters"}
					className={cn("relative", active > 0 && "border-ring")}
					size="icon-sm"
					title="filters"
					variant="outline"
				>
					<Icon name="filter" />
					{active > 0 && (
						<span className="absolute -top-1.5 -right-1.5 min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground tabular-nums">
							{active}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-[min(40rem,calc(100vw-1.5rem))] p-0"
				collisionPadding={12}
			>
				{open && (
					<FiltersPanel
						filters={filters}
						onChange={onChange}
						onDone={() => onOpenChange(false)}
						statuses={statuses}
						table={table}
					/>
				)}
			</PopoverContent>
		</Popover>
	);
}

function FiltersPanel({
	filters,
	onChange,
	onDone,
	statuses,
	table,
}: {
	filters: Filters;
	onChange: (filters: Filters) => void;
	onDone: () => void;
	statuses: RegistryStatus[];
	table: RegistryTableModel;
}) {
	const frameworkCounts = facet(table, "framework");
	const typeCounts = facet(table, "type");
	const registryCounts = facet(table, "registry");
	// narrows the registry list so one can be found among 125 quickly
	const [registryQuery, setRegistryQuery] = useState("");
	const needle = registryQuery.trim().toLowerCase();
	const shownRegistries = needle
		? statuses.filter(({ registry }) =>
				registry.name.toLowerCase().includes(needle),
			)
		: statuses;
	// types come from the data, most common first
	const [types] = useState(() =>
		[
			...facet(table, "type").entries(),
			...filters.types.map((t) => [t, 0] as const),
		]
			.toSorted((a, b) => b[1] - a[1])
			.map(([type]) => type)
			.filter((type, index, all) => all.indexOf(type) === index),
	);
	const zeroDepsCount = table
		.getColumn("depCount")
		?.getFacetedRowModel()
		.rows.filter((row) => row.original.depCount === 0).length;

	return (
		<div className="text-sm">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<span className="font-medium">filters</span>
				<span className="text-xs text-muted-foreground tabular-nums">
					{table.getFilteredRowModel().rows.length.toLocaleString()} match
				</span>
			</div>

			<FilterChips filters={filters} onChange={onChange} />

			<div className="grid sm:grid-cols-2 sm:divide-x">
				<div className="space-y-4 p-3">
					<Section title="framework">
						{FRAMEWORKS.map((framework) => (
							<Option
								checked={filters.frameworks.includes(framework)}
								count={frameworkCounts.get(framework) ?? 0}
								key={framework}
								label={framework}
								leading={<FrameworkIcon framework={framework} />}
								onToggle={() =>
									onChange({
										...filters,
										frameworks: toggle(filters.frameworks, framework),
									})
								}
							/>
						))}
					</Section>

					<Section title="type">
						{types.map((type) => (
							<Option
								checked={filters.types.includes(type)}
								count={typeCounts.get(type) ?? 0}
								key={type}
								label={type}
								onToggle={() =>
									onChange({ ...filters, types: toggle(filters.types, type) })
								}
							/>
						))}
					</Section>

					<Section title="dependencies">
						<label className="flex cursor-pointer items-center justify-between gap-2 rounded-sm px-1.5 py-1 hover:bg-accent">
							<span>0 deps only</span>
							<span className="flex items-center gap-2">
								<span className="text-xs text-muted-foreground tabular-nums">
									{zeroDepsCount?.toLocaleString()}
								</span>
								<Switch
									checked={filters.zeroDeps}
									onCheckedChange={(zeroDeps) =>
										onChange({ ...filters, zeroDeps })
									}
								/>
							</span>
						</label>
					</Section>
				</div>

				<div className="flex min-h-0 flex-col p-3">
					<SectionTitle count={shownRegistries.length} title="registry" />
					<div className="relative mb-1.5">
						<Icon
							className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
							name="search"
						/>
						<Input
							aria-label="search registries"
							className="h-7 pr-7 pl-7 text-xs"
							onChange={(event) => setRegistryQuery(event.target.value)}
							placeholder="search registries"
							value={registryQuery}
						/>
						{registryQuery && (
							<button
								aria-label="clear registry search"
								className="absolute top-1/2 right-1 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
								onClick={() => setRegistryQuery("")}
								type="button"
							>
								<Icon className="size-3" name="x" />
							</button>
						)}
					</div>
					<div className="-mx-1 h-72 overflow-y-auto px-1">
						{shownRegistries.length === 0 && (
							<p className="px-1.5 py-1 text-xs text-muted-foreground">
								no registries match
							</p>
						)}
						{shownRegistries.map(({ favicon, registry }) => (
							<Option
								checked={filters.registries.includes(registry.name)}
								count={registryCounts.get(registry.name) ?? 0}
								key={registry.name}
								label={registry.name}
								leading={
									<RegistryFavicon className="size-3.5" favicon={favicon} />
								}
								onToggle={() =>
									onChange({
										...filters,
										registries: toggle(filters.registries, registry.name),
									})
								}
								trailing={
									<FrameworkIcon
										className="size-3"
										framework={registry.framework}
									/>
								}
							/>
						))}
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between border-t px-3 py-2">
				{activeFilters(filters).length > 0 ? (
					<button
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
						onClick={() => onChange(NO_FILTERS)}
						type="button"
					>
						<Icon className="size-3.5" name="x" />
						clear all
					</button>
				) : (
					<span />
				)}
				<Button onClick={onDone} size="sm" variant="outline">
					done
				</Button>
			</div>
		</div>
	);
}

function Option({
	checked,
	count,
	label,
	leading,
	onToggle,
	trailing,
}: {
	checked: boolean;
	count: number;
	label: string;
	leading?: React.ReactNode;
	onToggle: () => void;
	trailing?: React.ReactNode;
}) {
	return (
		<label
			className={cn(
				"flex cursor-pointer items-center gap-2 rounded-sm px-1.5 py-1 hover:bg-accent",
				// options that wouldn't match anything stay visible but recede
				count === 0 && !checked && "text-muted-foreground/60",
			)}
		>
			<Checkbox checked={checked} onCheckedChange={onToggle} />
			{leading}
			<span className="min-w-0 flex-1 truncate">{label}</span>
			<span className="text-xs text-muted-foreground tabular-nums">
				{count.toLocaleString()}
			</span>
			{trailing}
		</label>
	);
}

function Section({
	children,
	title,
}: {
	children: React.ReactNode;
	title: string;
}) {
	return (
		<div>
			<SectionTitle title={title} />
			{children}
		</div>
	);
}

function SectionTitle({ count, title }: { count?: number; title: string }) {
	return (
		<div className="mb-1.5 flex items-center justify-between px-1.5 text-[11px] tracking-wider text-muted-foreground uppercase">
			<span>{title}</span>
			{count !== undefined && <span className="tabular-nums">{count}</span>}
		</div>
	);
}
