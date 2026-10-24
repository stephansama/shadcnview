import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import { writePreferences } from "./preferences";

export type Theme = "dark" | "light";

const current = (): Theme =>
	document.documentElement.classList.contains("dark") ? "dark" : "light";

// the preload script sets the class before paint, the hook just follows it
const subscribe = (onChange: () => void) => {
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, {
		attributeFilter: ["class"],
		attributes: true,
	});
	return () => observer.disconnect();
};

/**
 * switches themes with the new one wiped in from the top (the view transition
 * styles in src/styles.css), or straight away without view transitions or
 * when motion is reduced
 */
export function toggleTheme() {
	const next: Theme = current() === "dark" ? "light" : "dark";
	const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduced || !document.startViewTransition) {
		apply(next);
		return;
	}
	// flushSync so react's theme-dependent bits (the toaster) land in the same frame
	document.startViewTransition(() => flushSync(() => apply(next)));
}

/** the theme on the page, light while prerendering */
export function useTheme() {
	return useSyncExternalStore(subscribe, current, () => "light" as const);
}

function apply(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	// the svg's own media query follows the os, not this toggle, so swap files
	document
		.querySelector('link[rel="icon"]')
		?.setAttribute(
			"href",
			theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg",
		);
	writePreferences({ theme });
}
