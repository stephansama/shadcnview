import {
	columnFacetingFeature,
	columnFilteringFeature,
	columnGroupingFeature,
	columnResizingFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	createColumnHelper,
	createExpandedRowModel,
	createFacetedRowModel,
	createFacetedUniqueValues,
	createFilteredRowModel,
	createGroupedRowModel,
	createSortedRowModel,
	type ExpandedState,
	type Row,
	rowExpandingFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_basic,
	sortFn_text,
	type SortingState,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { type RefObject, useEffect, useMemo, useState } from "react";

import { Icon } from "#/components/icon";
import { Badge } from "#/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { COLUMN_SIZE, gridFor, hiddenColumns } from "#/lib/columns";
import { copyInstall } from "#/lib/copy";
import { type Filters, toColumnFilters } from "#/lib/filters";
import { type ComponentRow, type RegistryStatus, rowLinks } from "#/lib/rows";
import { cn } from "#/lib/utils";

import { FrameworkBadge, FrameworkIcon } from "./framework-badge";
import { Highlight } from "./highlight";
import { RegistryFavicon } from "./registry-favicon";

export const ROW_HEIGHT = 36;

const SORT_ICONS = {
	asc: "chevronUp",
	desc: "chevronDown",
	none: "unfoldVertical",
} as const;

const features = tableFeatures({
	columnFacetingFeature,
	columnFilteringFeature,
	columnGroupingFeature,
	columnResizingFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	expandedRowModel: createExpandedRowModel(),
	// facet counts for the filters popover, each ignoring its own filter
	facetedRowModel: createFacetedRowModel(),
	facetedUniqueValues: createFacetedUniqueValues(),
	filteredRowModel: createFilteredRowModel(),
	groupedRowModel: createGroupedRowModel(),
	rowExpandingFeature,
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		basic: sortFn_basic,
		text: sortFn_text,
	},
});

export type TableRow = Row<typeof features, ComponentRow>;

/** a multi-select facet: the row's value is one of the picked ones */
const oneOf = (row: TableRow, columnId: string, values: string[]) =>
	values.includes(row.getValue<string>(columnId));

const helper = createColumnHelper<typeof features, ComponentRow>();

const columns = helper.columns([
	helper.accessor("registry", { filterFn: oneOf, header: "registry", size: 0 }),
	helper.accessor("name", {
		cell: ({ getValue, row }) => (
			<Highlight field="name" id={row.id} text={getValue()} />
		),
		header: "component",
		minSize: 120,
		size: COLUMN_SIZE.name,
		sortFn: "alphanumeric",
	}),
	helper.accessor("type", {
		cell: ({ getValue }) => (
			<Badge className="rounded-sm px-1.5 font-normal" variant="secondary">
				{getValue()}
			</Badge>
		),
		filterFn: oneOf,
		header: "type",
		minSize: 70,
		size: COLUMN_SIZE.type,
		sortFn: "alphanumeric",
	}),
	// empty descriptions read as undefined so they sort last either way
	helper.accessor((row) => row.description || undefined, {
		cell: ({ getValue, row }) => {
			const description = getValue();
			if (!description)
				return <span className="text-muted-foreground/50">—</span>;

			return (
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="block truncate text-muted-foreground">
							<Highlight field="description" id={row.id} text={description} />
						</span>
					</TooltipTrigger>
					<TooltipContent className="max-w-sm" side="bottom">
						{description}
					</TooltipContent>
				</Tooltip>
			);
		},
		header: "description",
		id: "description",
		minSize: 120,
		size: COLUMN_SIZE.description,
		// plain text order for prose, alphanumeric sends "3D carousel" past z
		sortFn: "text",
		sortUndefined: "last",
	}),
	helper.accessor("depCount", {
		cell: ({ getValue }) => (
			<span className="text-muted-foreground tabular-nums">{getValue()}</span>
		),
		filterFn: (row, columnId, zeroOnly: boolean) =>
			!zeroOnly || row.getValue<number>(columnId) === 0,
		header: "deps",
		minSize: 72,
		size: COLUMN_SIZE.depCount,
		sortFn: "basic",
	}),
	helper.accessor("framework", {
		cell: ({ getValue }) => <FrameworkBadge framework={getValue()} />,
		enableSorting: false,
		filterFn: oneOf,
		header: "framework",
		minSize: 80,
		size: COLUMN_SIZE.framework,
	}),
	helper.display({
		cell: ({ row }) => <RowActions row={row.original} />,
		header: "",
		id: "actions",
		size: COLUMN_SIZE.actions,
	}),
]);

export type RegistryTableModel = ReturnType<typeof useRegistryTable>;

export function RegistryTable({
	cursor,
	hideFramework,
	onCursor,
	onOpen,
	openId,
	scrollRef,
	statuses,
	table,
	virtualizer,
}: {
	cursor: string | undefined;
	/** every group is the same framework, so its icon says nothing */
	hideFramework: boolean;
	onCursor: (id: string) => void;
	onOpen: (id: string) => void;
	openId: string | undefined;
	scrollRef: RefObject<HTMLDivElement | null>;
	statuses: Map<string, RegistryStatus>;
	table: RegistryTableModel;
	virtualizer: ReturnType<typeof useTableVirtualizer>;
}) {
	const rows = table.getRowModel().rows;
	const { minWidth, template } = gridLayout(table);
	// group rows span the scrollable width, their content sticks to the
	// visible part so the end of the row stays in view
	const [viewportWidth, setViewportWidth] = useState<number>();
	useEffect(() => {
		const element = scrollRef.current;
		if (!element) return;
		const observer = new ResizeObserver(() =>
			setViewportWidth(element.clientWidth),
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [scrollRef]);

	return (
		<div
			className="relative h-full overflow-auto overscroll-contain"
			ref={scrollRef}
		>
			<div
				className="sticky top-0 z-10 grid border-b bg-background text-xs tracking-wider text-muted-foreground uppercase"
				role="row"
				style={{ gridTemplateColumns: template, minWidth }}
			>
				{table.getHeaderGroups()[0]?.headers.map((header) => {
					const sorted = header.column.getIsSorted();
					return (
						<div
							className="relative flex h-9 min-w-0 items-center overflow-hidden px-3 whitespace-nowrap select-none"
							key={header.id}
							role="columnheader"
						>
							{header.column.getCanSort() ? (
								<button
									className={cn(
										"group flex min-w-0 items-center gap-1 tracking-wider uppercase hover:text-foreground",
										sorted && "text-foreground",
									)}
									onClick={header.column.getToggleSortingHandler()}
									type="button"
								>
									<span className="truncate">
										<table.FlexRender header={header} />
									</span>
									{/* sortable columns hint with ↕, the sorted one shows its direction */}
									<Icon
										className={cn(
											"size-3",
											!sorted && "opacity-50 group-hover:opacity-100",
										)}
										name={SORT_ICONS[sorted || "none"]}
									/>
								</button>
							) : (
								<table.FlexRender header={header} />
							)}
							{header.column.getCanResize() && header.id !== "actions" && (
								<div
									className={cn(
										"absolute inset-y-2 right-0 w-1 cursor-col-resize border-r hover:border-foreground/50",
										header.column.getIsResizing() && "border-foreground",
									)}
									onDoubleClick={() => header.column.resetSize()}
									onMouseDown={header.getResizeHandler()}
									onTouchStart={header.getResizeHandler()}
								/>
							)}
						</div>
					);
				})}
			</div>

			<div
				className="relative"
				role="rowgroup"
				style={{ height: virtualizer.getTotalSize(), minWidth }}
			>
				{virtualizer.getVirtualItems().map((virtual) => {
					const row = rows[virtual.index];
					if (!row) return;

					const style = {
						gridTemplateColumns: template,
						height: ROW_HEIGHT,
						minWidth,
						transform: `translateY(${virtual.start - virtualizer.options.scrollMargin}px)`,
					};

					return row.getIsGrouped() ? (
						<GroupRow
							active={row.id === cursor}
							hideFramework={hideFramework}
							key={row.id}
							onClick={() => {
								onCursor(row.id);
								row.toggleExpanded();
							}}
							row={row}
							status={statuses.get(String(row.groupingValue))}
							style={{ ...style, minWidth }}
							viewportWidth={viewportWidth}
						/>
					) : (
						<div
							aria-selected={row.id === openId}
							className={cn(
								"absolute inset-x-0 grid cursor-default items-center border-b border-border/50 text-sm hover:bg-accent/50",
								row.id === openId && "bg-accent",
								row.id === cursor && "outline -outline-offset-1 outline-ring",
							)}
							key={row.id}
							onClick={() => {
								onCursor(row.id);
								onOpen(row.id);
							}}
							role="row"
							style={style}
						>
							{row.getVisibleCells().map((cell) => (
								<div
									className="min-w-0 truncate px-3"
									key={cell.id}
									role="cell"
								>
									<table.FlexRender cell={cell} />
								</div>
							))}
						</div>
					);
				})}
			</div>

			{rows.length === 0 && (
				<p className="p-6 text-sm text-muted-foreground">no components match</p>
			)}
		</div>
	);
}

/** the table model, kept in the page so the status bar can read counts from it */
export function useRegistryTable({
	filters,
	initialExpanded,
	initiallySearching,
	initialOpen,
	rows,
}: {
	filters: Filters;
	/** the groups that were open last visit */
	initialExpanded: ExpandedState;
	/** a shared `?q=` link opens every group, like typing a search does */
	initiallySearching: boolean;
	/** the row a shared `?item=` link points at, its group starts expanded */
	initialOpen: ComponentRow | undefined;
	/** every row, or the search results in rank order */
	rows: ComponentRow[];
}) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [expanded, setExpanded] = useState<ExpandedState>(() => {
		if (initiallySearching || initialExpanded === true) return true;
		return initialOpen
			? { ...initialExpanded, [`registry:${initialOpen.registry}`]: true }
			: initialExpanded;
	});
	const columnFilters = useMemo(() => toColumnFilters(filters), [filters]);
	// a column pinned to one value by its filter would repeat it on every row
	const columnVisibility = useMemo(
		() => Object.fromEntries(hiddenColumns(filters).map((id) => [id, false])),
		[filters],
	);

	return useTable({
		autoResetExpanded: false,
		columnResizeMode: "onChange",
		columns,
		data: rows,
		features,
		getRowId: (row) => row.id,
		groupedColumnMode: "remove",
		onExpandedChange: setExpanded,
		onSortingChange: setSorting,
		state: {
			columnFilters,
			columnVisibility,
			expanded,
			grouping: ["registry"],
			sorting,
		},
	});
}

export function useTableVirtualizer(
	table: RegistryTableModel,
	scrollRef: RefObject<HTMLDivElement | null>,
	/** a shared `?item=` row to start scrolled to, a few rows below the header */
	initialId: string | undefined,
) {
	const rows = table.getRowModel().rows;

	return useVirtualizer({
		count: rows.length,
		estimateSize: () => ROW_HEIGHT,
		getItemKey: (index) => rows[index]?.id ?? index,
		getScrollElement: () => scrollRef.current,
		// scrolling after mount races the virtualizer measuring its element,
		// starting at the offset doesn't
		initialOffset: () => {
			const index = initialId
				? rows.findIndex((row) => row.id === initialId)
				: -1;
			return Math.max(0, (index - 3) * ROW_HEIGHT);
		},
		overscan: 12,
		// the sticky header sits above the rows inside the scroller, so rows start
		// one header down and scrolling to a row has to clear the header
		scrollMargin: ROW_HEIGHT,
		scrollPaddingStart: ROW_HEIGHT,
	});
}

/**
 * the sizes as one grid template, the description column absorbs whatever
 * space is left or missing, and below the fixed widths the table scrolls sideways
 */
function gridLayout(table: RegistryTableModel) {
	return gridFor(
		table
			.getVisibleLeafColumns()
			.map((column) => ({ id: column.id, size: column.getSize() })),
	);
}

function GroupRow({
	active,
	hideFramework,
	onClick,
	row,
	status,
	style,
	viewportWidth,
}: {
	active: boolean;
	hideFramework: boolean;
	onClick: () => void;
	row: TableRow;
	status: RegistryStatus | undefined;
	style: React.CSSProperties;
	viewportWidth: number | undefined;
}) {
	return (
		<div
			aria-expanded={row.getIsExpanded()}
			className={cn(
				"absolute inset-x-0 border-b bg-card text-sm hover:bg-accent/50",
				active && "outline -outline-offset-1 outline-ring",
			)}
			onClick={onClick}
			role="row"
			style={style}
		>
			<div
				className="sticky left-0 flex h-full items-center gap-2 px-3"
				style={{ width: viewportWidth ?? "100%" }}
			>
				<Icon
					className="text-muted-foreground"
					name={row.getIsExpanded() ? "chevronDown" : "chevronRight"}
				/>
				<RegistryFavicon favicon={status?.favicon} />
				<span className="font-medium">
					{/* any row of the group carries the registry name's matches */}
					<Highlight
						field="registry"
						id={row.subRows[0]?.id ?? ""}
						text={String(row.groupingValue)}
					/>
				</span>
				<Badge
					className="rounded-sm px-1.5 font-normal tabular-nums"
					variant="outline"
				>
					{row.subRows.length}
				</Badge>
				{status && (
					<span className="min-w-0 truncate text-xs text-muted-foreground">
						- {status.registry.description}
					</span>
				)}
				{status?.error && (
					<span className="flex items-center gap-1 text-xs text-destructive-foreground">
						<Icon className="size-3" name="triangleAlert" /> {status.error}
					</span>
				)}
				{/* pinned to the row's end, hidden when the filter is a single framework */}
				{status && !hideFramework && (
					<FrameworkIcon
						className="ml-auto"
						framework={status.registry.framework}
					/>
				)}
			</div>
		</div>
	);
}

function RowActions({ row }: { row: ComponentRow }) {
	return (
		<div className="flex justify-end gap-1">
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						aria-label="copy add command"
						className="rounded-sm border p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
						onClick={(event) => {
							event.stopPropagation();
							void copyInstall(row);
						}}
						type="button"
					>
						<Icon className="size-3.5" name="squareTerminal" />
					</button>
				</TooltipTrigger>
				<TooltipContent>copy add command</TooltipContent>
			</Tooltip>
			<Tooltip>
				<TooltipTrigger asChild>
					<a
						aria-label="open original page"
						className="rounded-sm border p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
						href={rowLinks(row).page}
						onClick={(event) => event.stopPropagation()}
						rel="noreferrer"
						target="_blank"
					>
						<Icon className="size-3.5" name="externalLink" />
					</a>
				</TooltipTrigger>
				<TooltipContent>open original page</TooltipContent>
			</Tooltip>
		</div>
	);
}
