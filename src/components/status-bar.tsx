import { Kbd } from "#/components/ui/kbd";

const HINTS = [
	["/", "filter"],
	["j k", "nav"],
	["⏎", "open"],
	["y", "copy add cmd"],
	["o", "full page"],
	["z", "collapse"],
	["esc", "close"],
] as const;

export function StatusBar({
	builtAt,
	shown,
	total,
}: {
	builtAt: string;
	shown: number;
	total: number;
}) {
	return (
		<footer className="flex h-9 shrink-0 items-center gap-4 border-t px-3 text-xs text-muted-foreground">
			<div className="hidden items-center gap-4 md:flex">
				{HINTS.map(([keys, label]) => (
					<span className="flex items-center gap-1.5" key={label}>
						<Kbd>{keys}</Kbd>
						{label}
					</span>
				))}
			</div>
			<span className="ml-auto tabular-nums">
				{shown.toLocaleString()} of {total.toLocaleString()} components
			</span>
			<span className="hidden lg:inline">
				· snapshot {new Date(builtAt).toLocaleDateString()}
			</span>
		</footer>
	);
}
