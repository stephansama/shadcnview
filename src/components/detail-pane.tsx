import { useState } from "react";

import { Icon } from "#/components/icon";
import { Button } from "#/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "#/components/ui/collapsible";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "#/components/ui/tooltip";
import { copyInstall } from "#/lib/copy";
import {
	type ComponentRow,
	type DependencyResolver,
	getRegistry,
	rowLinks,
} from "#/lib/rows";
import { cn } from "#/lib/utils";

import { FrameworkBadge } from "./framework-badge";
import { RegistryFavicon } from "./registry-favicon";

export function DetailPane({
	back,
	favicon,
	onClose,
	onOpenDependency,
	resolveDependency,
	row,
}: {
	/** the component this one was opened from through a dependency link */
	back: undefined | { onBack: () => void; title: string };
	favicon: string | undefined;
	onClose: () => void;
	onOpenDependency: (row: ComponentRow) => void;
	resolveDependency: DependencyResolver;
	row: ComponentRow;
}) {
	const registry = getRegistry(row.registry);
	const { page } = rowLinks(row);
	const embed = registry?.embed !== false;

	return (
		<div className="flex h-full min-w-0 flex-col">
			<header className="flex items-start gap-3 border-b px-4 py-3">
				{back && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								aria-label={`back to ${back.title}`}
								onClick={back.onBack}
								size="icon-sm"
								variant="outline"
							>
								<Icon name="arrowLeft" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>back to {back.title}</TooltipContent>
					</Tooltip>
				)}
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-base font-medium">{row.title}</h2>
					<p className="flex items-center gap-2 text-sm text-muted-foreground">
						<RegistryFavicon className="size-3.5" favicon={favicon} />
						<span className="truncate">
							{row.registry} · {row.type}
						</span>
						<FrameworkBadge framework={row.framework} />
					</p>
				</div>
				{/* one joined group, labels live in the tooltips */}
				<div className="flex [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								aria-label="copy add command"
								onClick={() => void copyInstall(row)}
								size="icon-sm"
								variant="outline"
							>
								<Icon name="squareTerminal" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>copy add command</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button asChild size="icon-sm" variant="outline">
								<a
									aria-label="open full page"
									href={page}
									rel="noreferrer"
									target="_blank"
								>
									<Icon name="externalLink" />
								</a>
							</Button>
						</TooltipTrigger>
						<TooltipContent>open full page</TooltipContent>
					</Tooltip>
				</div>
				<Button
					aria-label="close"
					onClick={onClose}
					size="icon-sm"
					variant="ghost"
				>
					<Icon name="x" />
				</Button>
			</header>

			<Dependencies
				onOpenDependency={onOpenDependency}
				resolveDependency={resolveDependency}
				row={row}
			/>

			{embed ? (
				// keyed so switching rows starts a fresh page, and a fresh loading state
				<PreviewFrame
					key={row.id}
					src={page}
					title={`${row.title} on ${row.registry}`}
				/>
			) : (
				<div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm text-muted-foreground">
					<Icon className="size-6" name="frame" />
					<p>
						{row.registry} doesn&apos;t allow its pages to be embedded, so this
						one opens in a new tab.
					</p>
					<Button asChild size="sm" variant="outline">
						<a href={page} rel="noreferrer" target="_blank">
							<Icon name="externalLink" /> open {new URL(page).host}
						</a>
					</Button>
				</div>
			)}

			{embed && registry && (
				<footer className="flex items-center gap-2 border-t px-4 py-1.5 text-xs text-muted-foreground">
					<span className="flex-1 truncate">{page}</span>
					<a
						className="flex items-center gap-1 hover:text-foreground"
						href={registry.homepage}
						rel="noreferrer"
						target="_blank"
					>
						<Icon className="size-3" name="house" /> homepage
					</a>
				</footer>
			)}
		</div>
	);
}

function Dependencies({
	onOpenDependency,
	resolveDependency,
	row,
}: {
	onOpenDependency: (row: ComponentRow) => void;
	resolveDependency: DependencyResolver;
	row: ComponentRow;
}) {
	const [open, setOpen] = useState(false);
	if (row.depCount === 0) return;

	return (
		<Collapsible className="border-b" onOpenChange={setOpen} open={open}>
			<CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
				<Icon
					className="transition-transform data-[open=true]:rotate-90"
					data-open={open}
					name="chevronRight"
				/>
				({row.depCount}) dependencies
			</CollapsibleTrigger>
			<CollapsibleContent className="grid gap-3 px-4 pb-3 text-sm sm:grid-cols-2">
				<DependencyList href={npmxUrl} items={row.dependencies} label="npm" />
				<DependencyList
					href={registryDependencyUrl}
					items={row.registryDependencies}
					label="registry"
					onOpen={onOpenDependency}
					resolve={(dependency) => resolveDependency(row, dependency)}
				/>
			</CollapsibleContent>
		</Collapsible>
	);
}

// a version suffix (`react@^18`, `@radix-ui/react-slot@1.2`) isn't part of the name
const VERSION_SUFFIX = /(?<=.)@[^/]*$/;

/** the package's page on npmx */
const npmxUrl = (dependency: string) =>
	`https://npmx.dev/package/${dependency.replace(VERSION_SUFFIX, "")}`;

/** registry dependencies are names or full item urls, only urls can be linked */
const registryDependencyUrl = (dependency: string) =>
	URL.canParse(dependency) ? dependency : undefined;

/** a listed component opens here, anything else links out or stays text */
function DependencyItem({
	item,
	onOpen,
	target,
	url,
}: {
	item: string;
	onOpen: ((row: ComponentRow) => void) | undefined;
	target: ComponentRow | undefined;
	url: string | undefined;
}) {
	if (target && onOpen) {
		return (
			<button
				className="text-left underline decoration-muted-foreground/50 underline-offset-2 hover:text-foreground hover:decoration-foreground"
				onClick={() => onOpen(target)}
				title={`open ${target.title} from ${target.registry}`}
				type="button"
			>
				{item}
			</button>
		);
	}
	if (!url) return item;

	return (
		<a
			className="underline-offset-2 hover:text-foreground hover:underline"
			href={url}
			rel="noreferrer"
			target="_blank"
		>
			{item}
		</a>
	);
}

function DependencyList({
	href,
	items,
	label,
	onOpen,
	resolve,
}: {
	href: (item: string) => string | undefined;
	items: readonly string[];
	label: string;
	/** listed components open here instead of linking out */
	onOpen?: (row: ComponentRow) => void;
	resolve?: (item: string) => ComponentRow | undefined;
}) {
	if (items.length === 0) return;

	return (
		<div>
			<p className="mb-1 text-xs tracking-wider text-muted-foreground uppercase">
				{label}
			</p>
			<ul className="space-y-0.5">
				{items.map((item) => (
					<li className="truncate" key={item}>
						<DependencyItem
							item={item}
							onOpen={onOpen}
							target={resolve?.(item)}
							url={href(item)}
						/>
					</li>
				))}
			</ul>
		</div>
	);
}

/** the docs page, with a loading state until the frame's first load */
function PreviewFrame({ src, title }: { src: string; title: string }) {
	const [loading, setLoading] = useState(true);

	return (
		<div className="relative min-h-0 flex-1">
			<iframe
				className="absolute inset-0 size-full bg-background"
				onLoad={() => setLoading(false)}
				referrerPolicy="no-referrer"
				src={src}
				title={title}
			/>
			<div
				aria-hidden={!loading}
				className={cn(
					"pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground transition-opacity duration-300",
					loading ? "opacity-100" : "opacity-0",
				)}
				role="status"
			>
				{/* an indeterminate bar along the top edge */}
				<div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-border">
					<div className="h-full w-1/3 animate-[preview-progress_1.2s_ease-in-out_infinite] bg-primary" />
				</div>
				<Icon className="size-5 animate-spin" name="loaderCircle" />
				<span>loading {new URL(src).host}…</span>
			</div>
		</div>
	);
}
