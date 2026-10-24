import { useEffect, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import {
	PREFERENCES_KEY,
	readPreferences,
	writePreferences,
} from "./preferences";

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
 * switches to `theme` with the new one wiped in from the top (the view
 * transition styles in src/styles.css), or straight away without view
 * transitions, when motion is reduced, or in a tab nobody is looking at
 */
export function setTheme(theme: Theme, { save = true } = {}) {
	if (theme === current()) return;
	const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduced || document.hidden || !document.startViewTransition) {
		apply(theme, save);
		return;
	}
	// flushSync so react's theme-dependent bits (the toaster) land in the same frame
	document.startViewTransition(() => flushSync(() => apply(theme, save)));
}

export function toggleTheme() {
	setTheme(current() === "dark" ? "light" : "dark");
}

/** the theme on the page, light while prerendering */
export function useTheme() {
	return useSyncExternalStore(subscribe, current, () => "light" as const);
}

/**
 * follows theme changes made outside the toggle: the os switching appearance
 * (the latest change wins, so it overrides an earlier toggle) and the toggle
 * being used in another tab. Called once, from the root document
 */
export function useThemeSync() {
	useEffect(() => {
		const media = matchMedia("(prefers-color-scheme: dark)");
		const onSystem = () => setTheme(media.matches ? "dark" : "light");

		// another tab already saved its choice, this one only has to show it
		const onStorage = (event: StorageEvent) => {
			if (event.key !== PREFERENCES_KEY) return;
			const { theme } = readPreferences();
			if (theme) setTheme(theme, { save: false });
		};

		media.addEventListener("change", onSystem);
		globalThis.addEventListener("storage", onStorage);
		return () => {
			media.removeEventListener("change", onSystem);
			globalThis.removeEventListener("storage", onStorage);
		};
	}, []);
}

function apply(theme: Theme, save: boolean) {
	document.documentElement.classList.toggle("dark", theme === "dark");
	// the svg's own media query follows the os, not this toggle, so swap files
	document
		.querySelector('link[rel="icon"]')
		?.setAttribute(
			"href",
			theme === "dark" ? "/logo-dark.svg" : "/logo-light.svg",
		);
	if (save) writePreferences({ theme });
}
