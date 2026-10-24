// Every icon the app uses, as static imports so vite-iconify-svgmap only puts
// these in the per-pack sprites. Each default export is the sprite href.

import go from "virtual:iconify-svgmap/logos/go";
import react from "virtual:iconify-svgmap/logos/react";
import svelte from "virtual:iconify-svgmap/logos/svelte-icon";
import vue from "virtual:iconify-svgmap/logos/vue";
import arrowLeft from "virtual:iconify-svgmap/lucide/arrow-left";
import arrowUpRight from "virtual:iconify-svgmap/lucide/arrow-up-right";
import check from "virtual:iconify-svgmap/lucide/check";
import chevronDown from "virtual:iconify-svgmap/lucide/chevron-down";
import chevronRight from "virtual:iconify-svgmap/lucide/chevron-right";
import chevronUp from "virtual:iconify-svgmap/lucide/chevron-up";
import chevronsDownUp from "virtual:iconify-svgmap/lucide/chevrons-down-up";
import chevronsUpDown from "virtual:iconify-svgmap/lucide/chevrons-up-down";
import circleCheck from "virtual:iconify-svgmap/lucide/circle-check";
import help from "virtual:iconify-svgmap/lucide/circle-question-mark";
import externalLink from "virtual:iconify-svgmap/lucide/external-link";
import frame from "virtual:iconify-svgmap/lucide/frame";
import globe from "virtual:iconify-svgmap/lucide/globe";
import gripVertical from "virtual:iconify-svgmap/lucide/grip-vertical";
import house from "virtual:iconify-svgmap/lucide/house";
import info from "virtual:iconify-svgmap/lucide/info";
import filter from "virtual:iconify-svgmap/lucide/list-filter";
import loaderCircle from "virtual:iconify-svgmap/lucide/loader-circle";
import octagonX from "virtual:iconify-svgmap/lucide/octagon-x";
import search from "virtual:iconify-svgmap/lucide/search";
import squareTerminal from "virtual:iconify-svgmap/lucide/square-terminal";
import triangleAlert from "virtual:iconify-svgmap/lucide/triangle-alert";
import unfoldVertical from "virtual:iconify-svgmap/lucide/unfold-vertical";
import x from "virtual:iconify-svgmap/lucide/x";
import awesome from "virtual:iconify-svgmap/simple-icons/awesomelists";
import bluesky from "virtual:iconify-svgmap/simple-icons/bluesky";
import github from "virtual:iconify-svgmap/simple-icons/github";
import linkedin from "virtual:iconify-svgmap/simple-icons/linkedin";
import youtube from "virtual:iconify-svgmap/simple-icons/youtube";

import type { Framework } from "#/registries";

export const icons = {
	arrowLeft,
	arrowUpRight,
	awesome,
	bluesky,
	check,
	chevronDown,
	chevronRight,
	chevronsDownUp,
	chevronsUpDown,
	chevronUp,
	circleCheck,
	externalLink,
	filter,
	frame,
	github,
	globe,
	gripVertical,
	help,
	house,
	info,
	linkedin,
	loaderCircle,
	octagonX,
	search,
	squareTerminal,
	triangleAlert,
	unfoldVertical,
	x,
	youtube,
} as const;

export type IconName = keyof typeof icons;

export const frameworkIcons: Record<Framework, string> = {
	react,
	// react native uses react's logo, templ is go
	"react-native": react,
	svelte,
	templ: go,
	vue,
};
