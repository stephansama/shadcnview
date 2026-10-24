// The page as it looks before the snapshot has loaded: the real header, every
// registry group (from the bundled summary) and the status bar, with the same
// markup and sizes as the live table. It's what gets prerendered, so a refresh
// paints the finished layout straight away instead of a skeleton. The inline
// preload script (`src/lib/preferences.ts`) has already opened the detail pane
// and pointed the chevrons of remembered groups by the time this paints.

import { useSyncExternalStore } from "react";

import type { SnapshotSummary } from "#/lib/snapshot";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Kbd } from "#/components/ui/kbd";
import { COLUMNS, gridFor } from "#/lib/columns";
import { registries, type Registry } from "#/registries";

import { FrameworkIcon } from "./framework-badge";
import { Icon } from "./icon";
import { RegistryFavicon } from "./registry-favicon";
import { ROW_HEIGHT } from "./registry-table";
import { StatusBar } from "./status-bar";
import { ThemeToggle } from "./theme-toggle";

// written by `pnpm snapshot`, a glob so a checkout without one still builds
const summary = Object.values(
	import.meta.glob<SnapshotSummary>("../generated/summary.json", {
		eager: true,
		import: "default",
	}),
)[0];

// every column, the preload script swaps in a narrower grid through
// `--shell-columns` when the url's filters hide some
const { minWidth, template } = gridFor(COLUMNS);

// the shared item's name for the pane title, empty while prerendering
// the url doesn't change while the shell is up, so there's nothing to listen to
const unsubscribe = () => {};
const subscribe = () => unsubscribe;
const itemName = () =>
	(new URLSearchParams(location.search).get("item") ?? "").split("/").pop() ??
	"";

export function Shell() {
	const total = summary?.total ?? 0;
	const title = useSyncExternalStore(subscribe, itemName, () => "");

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
				<Button
					aria-label="search"
					className="sm:hidden"
					size="icon-sm"
					variant="outline"
				>
					<Icon name="search" />
				</Button>
				<div className="relative w-full max-w-md max-sm:hidden">
					<Icon
						className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
						name="search"
					/>
					<Input
						className="h-8 pr-8 pl-8"
						placeholder={`search ${total.toLocaleString()} components, registries, descriptions…`}
						readOnly
					/>
					<Kbd className="absolute top-1/2 right-2 -translate-y-1/2 max-sm:hidden">
						/
					</Kbd>
				</div>
				<div className="ml-auto flex items-center gap-2">
					<ThemeToggle />
					<Button aria-label="expand all" size="icon-sm" variant="outline">
						<Icon name="chevronsUpDown" />
					</Button>
					<Button
						aria-label="filters"
						className="relative"
						size="icon-sm"
						variant="outline"
					>
						<Icon name="filter" />
						{/* the count comes from the url, filled in by the preload script */}
						<span
							className="absolute -top-1.5 -right-1.5 hidden min-w-4 rounded-full bg-primary px-1 text-[10px] leading-4 text-primary-foreground tabular-nums"
							data-shell-filter-count
						/>
					</Button>
					<Button
						aria-label="about shadcnview"
						size="icon-sm"
						variant="outline"
					>
						<Icon name="help" />
					</Button>
				</div>
			</header>

			<div className="flex min-h-0 flex-1">
				<div className="relative h-full min-w-0 flex-1 overflow-hidden">
					<div
						className="grid border-b bg-background text-xs tracking-wider text-muted-foreground uppercase"
						style={{
							gridTemplateColumns: `var(--shell-columns, ${template})`,
							minWidth: `var(--shell-min-width, ${minWidth}px)`,
						}}
					>
						{COLUMNS.map((column) => (
							<div
								className="relative flex h-9 min-w-0 items-center overflow-hidden px-3 whitespace-nowrap select-none"
								data-column={column.id}
								key={column.id}
							>
								<span className="flex min-w-0 items-center gap-1 tracking-wider uppercase">
									<span className="truncate">{column.header}</span>
									{column.sortable && (
										<Icon className="size-3 opacity-50" name="unfoldVertical" />
									)}
								</span>
								{column.id !== "actions" && (
									<div className="absolute inset-y-2 right-0 w-1 border-r" />
								)}
							</div>
						))}
					</div>
					{(registries as readonly Registry[]).map((registry) => (
						<div
							className="border-b bg-card text-sm"
							data-framework={registry.framework}
							data-shell-group={registry.name}
							key={registry.name}
							style={{ height: ROW_HEIGHT }}
						>
							<div className="flex h-full items-center gap-2 px-3">
								<span className="text-muted-foreground" data-chevron>
									<Icon name="chevronRight" />
								</span>
								<RegistryFavicon
									favicon={summary?.registries[registry.name]?.favicon}
								/>
								<span className="font-medium">{registry.name}</span>
								<Badge
									className="rounded-sm px-1.5 font-normal tabular-nums"
									variant="outline"
								>
									{summary?.registries[registry.name]?.count ?? 0}
								</Badge>
								<span className="min-w-0 truncate text-xs text-muted-foreground">
									- {registry.description}
								</span>
								<span className="ml-auto flex" data-group-framework>
									<FrameworkIcon framework={registry.framework} />
								</span>
							</div>
						</div>
					))}
				</div>

				{/* shown by the preload script when the url has `?item=`, at the remembered width */}
				<div className="shell-pane min-w-0 flex-col border-l">
					<div className="flex items-start gap-3 border-b px-4 py-3">
						<div className="min-w-0 flex-1">
							<h2 className="truncate text-base font-medium">{title}</h2>
							<p className="text-sm text-muted-foreground">&nbsp;</p>
						</div>
					</div>
					<div className="flex-1 bg-background" />
				</div>
			</div>

			<StatusBar
				builtAt={summary?.builtAt ?? new Date(0).toISOString()}
				shown={total}
				total={total}
			/>
		</div>
	);
}
