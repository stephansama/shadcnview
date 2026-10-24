import { useState } from "react";

import { cn } from "#/lib/utils";

import { Icon } from "./icon";

/** the favicon the snapshot downloaded, or a globe when there isn't one */
export function RegistryFavicon({
	className,
	favicon,
}: {
	className?: string;
	favicon: string | undefined;
}) {
	const [broken, setBroken] = useState(false);

	if (!favicon || broken) {
		return (
			<Icon className={cn("text-muted-foreground", className)} name="globe" />
		);
	}

	return (
		<img
			alt=""
			className={cn("size-4 shrink-0 rounded-sm object-contain", className)}
			decoding="async"
			loading="lazy"
			onError={() => setBroken(true)}
			src={favicon}
		/>
	);
}
