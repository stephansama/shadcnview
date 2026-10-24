import { useSyncExternalStore } from "react";

/** below tailwind's `md`, where the detail pane moves into a bottom drawer */
const QUERY = "(max-width: 767px)";

const subscribe = (onChange: () => void) => {
	const media = globalThis.matchMedia(QUERY);
	media.addEventListener("change", onChange);
	return () => media.removeEventListener("change", onChange);
};

export function useIsMobile() {
	return useSyncExternalStore(
		subscribe,
		() => globalThis.matchMedia(QUERY).matches,
		// the prerendered shell is the desktop layout
		() => false,
	);
}
