"use client";

import { Icon } from "#/components/icon";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	// the app is dark only, so no next-themes provider
	return (
		<Sonner
			theme="dark"
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
