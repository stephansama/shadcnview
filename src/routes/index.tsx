import type { ExpandedState } from "@tanstack/react-table";

import { useHotkey } from "@tanstack/react-hotkeys";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { AboutPopover } from "#/components/about-popover";
import { DetailPane } from "#/components/detail-pane";
import { FiltersPopover } from "#/components/filters-popover";
import { HighlightsContext } from "#/components/highlight";
import { Icon } from "#/components/icon";
import {
	RegistryTable,
	useRegistryTable,
	useTableVirtualizer,
} from "#/components/registry-table";
import { Shell } from "#/components/shell";
import { StatusBar } from "#/components/status-bar";
import { ThemeToggle } from "#/components/theme-toggle";
import { Button } from "#/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "#/components/ui/drawer";
import { Input } from "#/components/ui/input";
import { Kbd } from "#/components/ui/kbd";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "#/components/ui/resizable";
import { useIsMobile } from "#/hooks/use-is-mobile";
import { copyInstall } from "#/lib/copy";
import {
	type Filters,
	type FilterSearch,
	filtersFromSearch,
	filtersToSearch,
	parseFilterSearch,
} from "#/lib/filters";
import {
	DEFAULT_PANE,
	readPreferences,
	writePreferences,
} from "#/lib/preferences";
import {
	buildRows,
	type ComponentRow,
	createDependencyResolver,
	rowLinks,
} from "#/lib/rows";
import { createSearch } from "#/lib/search";
import { cn } from "#/lib/utils";

// everything that changes what's shown lives in the url, so reloads, back and
// forward, and shared links all restore the same view
type Search = FilterSearch & { item?: string; q?: string };
import { type Snapshot, SNAPSHOT_PATH } from "#/lib/snapshot";

type SearchResults = Awaited<
	ReturnType<ReturnType<typeof createSearch>["search"]>
>;

export const Route = createFileRoute("/")({
	component: Viewer,
	// the snapshot is a static json file fetched in the browser, the prerendered
	// html only carries the shell
	loader: async () => {
		const response = await fetch(SNAPSHOT_PATH);
		if (!response.ok)
			throw new Error(`couldn't load ${SNAPSHOT_PATH}: ${response.status}`);
		const snapshot = (await response.json()) as Snapshot;
		return { builtAt: snapshot.builtAt, ...buildRows(snapshot) };
	},
	// the prerendered page, laid out like the table it turns into
	pendingComponent: Shell,
	ssr: false,
	validateSearch: (search: Record<string, unknown>): Search => ({
		...parseFilterSearch(search),
		item: typeof search.item === "string" ? search.item : undefined,
		q: typeof search.q === "string" && search.q ? search.q : undefined,
	}),
});

function Viewer() {
	const { builtAt, rows, statuses } = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: "/" });
	const setSearch = (next: Partial<Search>) =>
		void navigate({
			replace: true,
			search: (previous) => ({ ...previous, ...next }),
		});

	const [query, setQuery] = useState(search.q ?? "");

	const byId = useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);
	const openRow = search.item ? byId.get(search.item) : undefined;

	// derived from the url on every render, never copied into local state
	const filters = useMemo(
		() =>
			filtersFromSearch({
				fw: search.fw,
				reg: search.reg,
				type: search.type,
				zero: search.zero,
			}),
		[search.fw, search.reg, search.type, search.zero],
	);
	const setFilters = (next: Filters) => setSearch(filtersToSearch(next));
	const [filtersOpen, setFiltersOpen] = useState(false);
	const isMobile = useIsMobile();

	// fuse ranks the matches in web workers, the table then groups and
	// filters those. Results for an older query are dropped when they arrive late
	// workers start lazily on the first search, and come back after terminate
	const searcher = useMemo(() => createSearch(rows), [rows]);
	useEffect(() => () => searcher.terminate(), [searcher]);

	const trimmed = query.trim();
	const searching = trimmed.length > 0;
	const [results, setResults] = useState<SearchResults>();
	useEffect(() => {
		if (!searching) return;
		let current = true;
		searcher
			.search(trimmed)
			.then((next) => {
				if (current) setResults(next);
			})
			// a search still running when the workers are torn down rejects
			.catch(() => {});
		return () => {
			current = false;
		};
	}, [searcher, searching, trimmed]);
	// until the first result for a query lands, keep showing the previous one
	const shownResults = searching ? results : undefined;

	// what was open last visit, also read by the preload script before paint
	const [preferences] = useState(readPreferences);
	const paneSize = preferences.pane ?? DEFAULT_PANE;
	const table = useRegistryTable({
		filters,
		initialExpanded:
			preferences.expanded === "all"
				? true
				: Object.fromEntries(
						(preferences.expanded ?? []).map((name) => [
							`registry:${name}`,
							true,
						]),
					),
		initiallySearching: searching,
		initialOpen: openRow,
		rows: shownResults?.rows ?? rows,
	});

	// starting a search opens every group so the matches show, but only as a
	// starting point, groups can still be collapsed while searching. Clearing
	// the search puts back the groups that were open before
	const expandedBeforeSearch = useRef<ExpandedState>({});
	const changeQuery = (next: string) => {
		const wasSearching = query.trim().length > 0;
		const willSearch = next.trim().length > 0;
		if (willSearch && !wasSearching) {
			expandedBeforeSearch.current = table.state.expanded;
		}
		if (willSearch && next.trim() !== query.trim()) table.setExpanded(true);
		if (!willSearch && wasSearching) {
			table.setExpanded(expandedBeforeSearch.current);
		}
		setQuery(next);
		setSearch({ q: next || undefined });
	};
	// remember open groups for the next visit, not the all-open state a
	// search forces
	const expandedState = table.state.expanded;
	useEffect(() => {
		if (searching) return;
		writePreferences({
			expanded:
				expandedState === true
					? "all"
					: Object.entries(expandedState)
							.filter(([, open]) => open)
							.map(([id]) => id.replace("registry:", "")),
		});
	}, [expandedState, searching]);

	const scrollRef = useRef<HTMLDivElement>(null);
	const filterRef = useRef<HTMLInputElement>(null);
	const virtualizer = useTableVirtualizer(table, scrollRef, openRow?.id);
	const [cursor, setCursor] = useState(openRow?.id);

	const statusByName = useMemo(
		() => new Map(statuses.map((status) => [status.registry.name, status])),
		[statuses],
	);
	const visible = table.getRowModel().rows;

	const open = (id?: string) => setSearch({ item: id });

	// following a dependency link leaves a trail, so the pane can step back to
	// where it came from. Opening from the table or closing starts over
	const resolveDependency = useMemo(
		() => createDependencyResolver(rows),
		[rows],
	);
	const [trail, setTrail] = useState<string[]>([]);
	const pendingScroll = useRef<string>(undefined);
	const reveal = (row: ComponentRow) => {
		table.setExpanded((previous) =>
			previous === true
				? true
				: { ...previous, [`registry:${row.registry}`]: true },
		);
		setCursor(row.id);
		pendingScroll.current = row.id;
		open(row.id);
	};
	const openFresh = (id?: string) => {
		setTrail([]);
		open(id);
	};
	const openDependency = (row: ComponentRow) => {
		if (openRow) setTrail((previous) => [...previous, openRow.id]);
		reveal(row);
	};
	const backRow = trail.length > 0 ? byId.get(trail.at(-1) ?? "") : undefined;
	const back = backRow && {
		onBack: () => {
			setTrail((previous) => previous.slice(0, -1));
			reveal(backRow);
		},
		title: backRow.title,
	};
	// scroll a revealed row into view once its group has rendered open
	useEffect(() => {
		const id = pendingScroll.current;
		if (!id) return;
		const index = visible.findIndex((row) => row.id === id);
		if (index === -1) return;
		pendingScroll.current = undefined;
		// a frame later, scrolling in the same commit as the expand gets dropped
		requestAnimationFrame(() =>
			virtualizer.scrollToIndex(index, { align: "center" }),
		);
	});

	// j/k walk every visible row, group headers included
	const move = (step: number) => {
		if (visible.length === 0) return;
		const index = visible.findIndex((row) => row.id === cursor);
		const next =
			index === -1
				? 0
				: Math.min(Math.max(index + step, 0), visible.length - 1);
		setCursor(visible[next]?.id);
		virtualizer.scrollToIndex(next);
	};
	const cursorRow = visible.find((row) => row.id === cursor);
	// y and o act on the row under the cursor, falling back to the open one
	const target = (cursorRow && byId.get(cursorRow.id)) ?? openRow;

	// on phones search starts as a button, it opens into the input and folds
	// back up once it's left empty
	const [searchOpen, setSearchOpen] = useState(false);
	const searchExpanded = searchOpen || query.length > 0;
	useEffect(() => {
		if (searchOpen) filterRef.current?.focus();
	}, [searchOpen]);

	useHotkey("/", () => {
		setSearchOpen(true);
		filterRef.current?.focus();
	});
	useHotkey("J", () => move(1));
	useHotkey("K", () => move(-1));
	useHotkey("ArrowDown", () => move(1));
	useHotkey("ArrowUp", () => move(-1));
	useHotkey("Enter", () => {
		if (!cursorRow) return;
		if (cursorRow.getIsGrouped()) cursorRow.toggleExpanded();
		else openFresh(cursorRow.id);
	});
	useHotkey("Y", () => target && void copyInstall(target));
	useHotkey("O", () => target && window.open(rowLinks(target).page, "_blank"));
	// z flips every group open or closed
	useHotkey("Z", () => {
		table.toggleAllRowsExpanded(!table.getIsAllRowsExpanded());
	});
	useHotkey("Escape", () => {
		if (document.activeElement === filterRef.current) filterRef.current?.blur();
		else openFresh();
	});

	const expandedAll = table.getIsAllRowsExpanded();

	return (
		<div className="flex h-dvh flex-col">
			<header className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
				<span className="mr-2 flex shrink-0 items-center gap-2 text-sm font-semibold">
					<img
						alt=""
						className="size-6"
						height={24}
						src="/logo.svg"
						width={24}
					/>
					<span className="hidden sm:inline">shadcnview</span>
				</span>
				{!searchExpanded && (
					<Button
						aria-label="search"
						className="sm:hidden"
						onClick={() => setSearchOpen(true)}
						size="icon-sm"
						variant="outline"
					>
						<Icon name="search" />
					</Button>
				)}
				<div
					className={cn(
						"relative w-full max-w-md",
						!searchExpanded && "max-sm:hidden",
					)}
				>
					<Icon
						className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
						name="search"
					/>
					<Input
						className="h-8 pr-8 pl-8"
						onBlur={() => {
							if (!query) setSearchOpen(false);
						}}
						onChange={(event) => {
							changeQuery(event.target.value);
						}}
						onKeyDown={(event) => {
							// hand the keyboard back to the table
							if (event.key === "Enter" || event.key === "ArrowDown") {
								event.currentTarget.blur();
								move(1);
							}
						}}
						placeholder={`search ${rows.length.toLocaleString()} components, registries, descriptions…`}
						ref={filterRef}
						value={query}
					/>
					{query ? (
						// once there's a query the hint becomes a way to clear it
						<button
							aria-label="clear search"
							className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
							onClick={() => {
								changeQuery("");
								filterRef.current?.focus();
							}}
							type="button"
						>
							<Icon className="size-3.5" name="x" />
						</button>
					) : (
						<Kbd className="absolute top-1/2 right-2 -translate-y-1/2 max-sm:hidden">
							/
						</Kbd>
					)}
				</div>
				{/* pinned right, an open search gets the whole row on phones */}
				<div
					className={cn(
						"ml-auto flex items-center gap-2",
						searchExpanded && "max-sm:hidden",
					)}
				>
					<ThemeToggle />
					<Button
						aria-label={expandedAll ? "collapse all" : "expand all"}
						onClick={() => table.toggleAllRowsExpanded(!expandedAll)}
						size="icon-sm"
						title={expandedAll ? "collapse all (z)" : "expand all (z)"}
						variant="outline"
					>
						<Icon name={expandedAll ? "chevronsDownUp" : "chevronsUpDown"} />
					</Button>
					<FiltersPopover
						filters={filters}
						onChange={setFilters}
						onOpenChange={setFiltersOpen}
						open={filtersOpen}
						statuses={statuses}
						table={table}
					/>
					<AboutPopover
						builtAt={builtAt}
						componentCount={rows.length}
						registryCount={statuses.length}
					/>
				</div>
			</header>

			<HighlightsContext value={shownResults?.highlights}>
				<ResizablePanelGroup
					className="min-h-0 flex-1"
					// the preload script sizes the prerendered pane from this too
					onLayoutChanged={(layout) => {
						if (typeof layout.detail === "number") {
							writePreferences({ pane: Math.round(layout.detail * 10) / 10 });
						}
					}}
					orientation="horizontal"
				>
					<ResizablePanel
						defaultSize={String(100 - paneSize)}
						id="table"
						minSize="25"
					>
						<RegistryTable
							cursor={cursor}
							hideFramework={filters.frameworks.length === 1}
							onCursor={setCursor}
							onOpen={openFresh}
							openId={openRow?.id}
							scrollRef={scrollRef}
							statuses={statusByName}
							table={table}
							virtualizer={virtualizer}
						/>
					</ResizablePanel>
					{openRow && !isMobile && (
						<>
							<ResizableHandle />
							<ResizablePanel
								defaultSize={String(paneSize)}
								id="detail"
								minSize="25"
							>
								<DetailPane
									back={back}
									favicon={statusByName.get(openRow.registry)?.favicon}
									onClose={() => openFresh()}
									onOpenDependency={openDependency}
									resolveDependency={resolveDependency}
									row={openRow}
								/>
							</ResizablePanel>
						</>
					)}
				</ResizablePanelGroup>
			</HighlightsContext>

			{/* phones get the preview as a bottom sheet instead of a side panel */}
			{isMobile && (
				<Drawer
					// already open when it mounts (a shared link, where the shell drew it
					// before paint) means no slide in, later opens still animate
					defaultOpen={Boolean(openRow)}
					onOpenChange={(next) => {
						if (!next) openFresh();
					}}
					open={Boolean(openRow)}
				>
					<DrawerContent className="h-[88dvh] data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
						<DrawerTitle className="sr-only">
							{openRow?.title ?? "component"}
						</DrawerTitle>
						{openRow && (
							<DetailPane
								back={back}
								favicon={statusByName.get(openRow.registry)?.favicon}
								onClose={() => openFresh()}
								onOpenDependency={openDependency}
								resolveDependency={resolveDependency}
								row={openRow}
							/>
						)}
					</DrawerContent>
				</Drawer>
			)}

			<StatusBar
				builtAt={builtAt}
				shown={table.getFilteredRowModel().rows.length}
				total={rows.length}
			/>
		</div>
	);
}
