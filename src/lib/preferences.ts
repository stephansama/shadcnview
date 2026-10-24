// What the page remembers between visits: which registry groups were open and
// how wide the detail pane was. It's read twice, by an inline script before
// first paint so the prerendered shell already has that layout, and by the
// table once it renders, so nothing jumps when one replaces the other.

import { COLUMNS } from "./columns";

export const PREFERENCES_KEY = "shadcnview:preferences";

export type Preferences = {
	/** expanded registry groups, or every group */
	expanded?: "all" | string[];
	/** detail pane width as a percentage of the page */
	pane?: number;
};

export const DEFAULT_PANE = 50;

export function readPreferences(): Preferences {
	try {
		return JSON.parse(
			globalThis.localStorage?.getItem(PREFERENCES_KEY) ?? "{}",
		) as Preferences;
	} catch {
		return {};
	}
}

export function writePreferences(patch: Preferences) {
	try {
		globalThis.localStorage?.setItem(
			PREFERENCES_KEY,
			JSON.stringify({ ...readPreferences(), ...patch }),
		);
	} catch {
		// private mode or storage full, the page just forgets
	}
}

/**
 * Runs inline in `<head>` before anything paints, like a dark mode script.
 * Serialized with `toString`, so it can't use anything from outside itself.
 */
function preload(key: string, columns: { id: string; size: number }[]) {
	const root = document.documentElement;
	const parameters = new URLSearchParams(location.search);
	let preferences: Preferences = {};
	try {
		preferences = JSON.parse(localStorage.getItem(key) ?? "{}") as Preferences;
	} catch {
		// unreadable preferences, start from the defaults
	}

	// a shared `?item=` link opens with the detail pane
	if (parameters.get("item")) {
		root.dataset.pane = "open";
	}
	if (typeof preferences.pane === "number") {
		root.style.setProperty("--pane", `${preferences.pane}%`);
	}

	// hide the columns the url's filters pin to one value, same rule as
	// `hiddenColumns` in src/lib/columns.ts, and lay the header out without them
	const single = (name: string) => {
		const value = parameters.get(name);
		return Boolean(value) && !value?.includes(",");
	};
	const hidden = [
		single("type") && "type",
		parameters.get("zero") === "true" && "depCount",
		single("fw") && "framework",
	].filter(Boolean);
	if (hidden.length > 0) {
		root.dataset.hidden = hidden.join(" ");
		const visible = columns.filter(({ id }) => !hidden.includes(id));
		root.style.setProperty(
			"--shell-columns",
			visible
				.map(({ id, size }) =>
					id === "description" ? "minmax(80px, 1fr)" : `${size}px`,
				)
				.join(" "),
		);
		root.style.setProperty(
			"--shell-min-width",
			`${visible.reduce((sum, { id, size }) => sum + (id === "description" ? 80 : size), 0)}px`,
		);
	}

	// filters known from the url: hide groups of other frameworks or registries
	// and show the active count on the filters button. Type and dependency
	// filters can only narrow the groups once the data is in
	const list = (name: string) =>
		parameters.get(name)?.split(",").filter(Boolean) ?? [];
	const frameworks = list("fw");
	const picked = list("reg");
	const active =
		frameworks.length +
		picked.length +
		list("type").length +
		(parameters.get("zero") === "true" ? 1 : 0);
	const rules: string[] = [];
	if (frameworks.length > 0) {
		rules.push(
			`[data-shell-group]${frameworks.map((fw) => `:not([data-framework="${CSS.escape(fw)}"])`).join("")}{display:none}`,
		);
	}
	if (picked.length > 0) {
		rules.push(
			`[data-shell-group]${picked.map((name) => `:not([data-shell-group="${CSS.escape(name)}"])`).join("")}{display:none}`,
		);
	}
	if (active > 0) {
		root.dataset.filtered = "";
		rules.push(`[data-shell-filter-count]::after{content:"${active}"}`);
	}

	// point the chevrons of groups that were open, their rows follow with the data
	if (preferences.expanded === "all") {
		root.dataset.expanded = "all";
	} else if (Array.isArray(preferences.expanded)) {
		for (const name of preferences.expanded) {
			rules.push(
				`[data-shell-group="${CSS.escape(name)}"] [data-chevron]{rotate:90deg}`,
			);
		}
	}

	if (rules.length > 0) {
		const style = document.createElement("style");
		style.textContent = rules.join("");
		document.head.append(style);
	}
}

export const PRELOAD_SCRIPT = `(${preload.toString()})(${JSON.stringify(PREFERENCES_KEY)}, ${JSON.stringify(COLUMNS.map(({ id, size }) => ({ id, size })))})`;
