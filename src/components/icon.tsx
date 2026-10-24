import type { SVGProps } from "react";

import { type IconName, icons } from "#/lib/icons";
import { cn } from "#/lib/utils";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
	/** accessible label, without it the icon is hidden from assistive tech */
	title?: string;
} & ({ href: string; name?: never } | { href?: never; name: IconName });

/** an icon from the vite-iconify-svgmap sprites, sized with `size-*` classes */
export function Icon({ className, href, name, title, ...props }: IconProps) {
	return (
		<svg
			aria-hidden={title ? undefined : true}
			className={cn("size-4 shrink-0", className)}
			role={title ? "img" : undefined}
			{...props}
		>
			{title && <title>{title}</title>}
			<use href={href ?? icons[name]} />
		</svg>
	);
}
