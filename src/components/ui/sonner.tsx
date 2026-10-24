"use client";

import { Icon } from "#/components/icon";
import { useTheme } from "#/lib/theme";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	// follows the page's theme class, no next-themes provider needed
	const theme = useTheme();
	return (
		<Sonner
			theme={theme}
			className="toaster group"
			icons={{
				success: <Icon name="circleCheck" />,
				info: <Icon name="info" />,
				warning: <Icon name="triangleAlert" />,
				error: <Icon name="octagonX" />,
				loading: <Icon className="animate-spin" name="loaderCircle" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
