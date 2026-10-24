import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import { Toaster } from "#/components/ui/sonner";
import { TooltipProvider } from "#/components/ui/tooltip";
import { PRELOAD_SCRIPT } from "#/lib/preferences";
import { SNAPSHOT_PATH } from "#/lib/snapshot";

import appCss from "../styles.css?url";

const TITLE = "shadcnview";
const DESCRIPTION =
	"Every shadcn registry in one table. Search, filter and copy-add components across React, Svelte, Vue and more.";
// social cards need an absolute image url, set VITE_SITE_URL to the deployed origin
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "").replace(/\/$/, "");
const IMAGE = `${SITE_URL}/og.png`;

export const Route = createRootRoute({
	head: () => ({
		links: [
			{ href: appCss, rel: "stylesheet" },
			{ href: "/logo.svg", rel: "icon", type: "image/svg+xml" },
			// rendered from the logo by `pnpm og`, ios doesn't take svg icons
			{ href: "/apple-touch-icon.png", rel: "apple-touch-icon" },
			// the about popover's avatar, fetched while idle so it's there on open
			{ as: "image", href: "/avatar.jpg", rel: "prefetch" },
			// start the big download while the scripts load, not after
			{
				as: "fetch",
				crossOrigin: "anonymous",
				href: SNAPSHOT_PATH,
				rel: "preload",
			},
		],
		meta: [
			{ charSet: "utf8" },
			{ content: "width=device-width, initial-scale=1", name: "viewport" },
			{ title: TITLE },
			{ content: DESCRIPTION, name: "description" },
			{ content: "website", property: "og:type" },
			{ content: TITLE, property: "og:title" },
			{ content: DESCRIPTION, property: "og:description" },
			{ content: IMAGE, property: "og:image" },
			{ content: "1200", property: "og:image:width" },
			{ content: "630", property: "og:image:height" },
			{ content: "summary_large_image", name: "twitter:card" },
			{ content: TITLE, name: "twitter:title" },
			{ content: DESCRIPTION, name: "twitter:description" },
			{ content: IMAGE, name: "twitter:image" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		// the preload script sets attributes here before react hydrates
		<html className="dark" lang="en" suppressHydrationWarning>
			<head>
				{/* first, so the remembered layout is in place before anything paints */}
				<script dangerouslySetInnerHTML={{ __html: PRELOAD_SCRIPT }} />
				<HeadContent />
			</head>
			<body>
				<TooltipProvider delayDuration={400}>{children}</TooltipProvider>
				<Toaster position="bottom-right" />
				<Scripts />
			</body>
		</html>
	);
}
