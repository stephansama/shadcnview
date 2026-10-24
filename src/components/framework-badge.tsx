import type { Framework } from "#/registries";

import { frameworkIcons } from "#/lib/icons";
import { cn } from "#/lib/utils";

import { Icon } from "./icon";

export function FrameworkBadge({ framework }: { framework: Framework }) {
	return (
		<span className="inline-flex h-5 shrink-0 items-center gap-1 rounded-sm border px-1.5 text-xs whitespace-nowrap text-muted-foreground">
			<FrameworkIcon className="size-3" framework={framework} />
			{framework}
		</span>
	);
}

export function FrameworkIcon({
	className,
	framework,
}: {
	className?: string;
	framework: Framework;
}) {
	return (
		<Icon
			className={cn("size-3.5", className)}
			href={frameworkIcons[framework]}
			title={framework}
		/>
	);
}
