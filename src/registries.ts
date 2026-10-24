export type Framework = "react" | "react-native" | "svelte" | "templ" | "vue";

export type Registry = {
	/** the framework's own registry, installs by bare name */
	builtin?: true;
	/** its own add command when it isn't the framework's shadcn cli */
	cli?: string;
	description: string;
	/**
	 * item names for a registry that serves item json but no index. The
	 * snapshot fetches each one through `item` (or next to `index`), so `index`
	 * is then only the base those urls resolve against
	 */
	discover?: () => Promise<string[]>;
	/** the site sends `X-Frame-Options` or `frame-ancestors`, so open it in a tab instead */
	embed?: false;
	/** drop items that aren't worth listing */
	filter?: (item: RegistryItem) => boolean;
	framework: Framework;
	homepage: string;
	/** url of the registry's `registry.json` or `index.json` */
	index: string;
	/** an item's json when it isn't next to the index, used by url installs */
	item?: (item: RegistryItem) => string;
	name: string;
	/** namespace in the official shadcn directory, installs as `@ns/name` */
	namespace?: string;
	/**
	 * docs page for an item. Without one the snapshot looks for each item's page
	 * in the site's sitemap and docs links, and failing that it's the homepage
	 */
	page?: (item: RegistryItem) => string;
};

/** An item as it appears in a registry's index, all fields but name and type are optional. */
export type RegistryItem = {
	categories?: readonly string[];
	dependencies?: readonly string[];
	description?: string;
	devDependencies?: readonly string[];
	name: string;
	/** docs page the snapshot found on the site, for registries without `page` */
	page?: string;
	registryDependencies?: readonly string[];
	title?: string;
	type: string;
};

/** item types that are plumbing rather than something you'd browse */
export const HIDDEN_TYPES = new Set([
	"registry:base",
	"registry:example",
	"registry:file",
	"registry:font",
	"registry:item",
	"registry:lib",
	"registry:style",
	"registry:theme",
]);

export const AWESOME_LIST = "https://github.com/birobirobiro/awesome-shadcn-ui";

const DEMO_SUFFIX = /-demo$/;

// every `/docs/components/<name>` path on a docs page, for `discover`. Next
// sites only have them in the serialized payload, not as `href=` attributes
const DOCS_COMPONENT_LINK = /\/docs\/components\/([a-z\d-]+)/g;

const componentsInNav = (url: string) => async () => {
	const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
	if (!response.ok) throw new Error(`${response.status} ${url}`);
	const html = await response.text();
	return [
		...new Set(
			Array.from(html.matchAll(DOCS_COMPONENT_LINK), ([, name]) => name ?? ""),
		),
	].filter(Boolean);
};

const componentPage =
	(base: string) =>
	({ name }: Pick<RegistryItem, "name">) =>
		`${base}/docs/components/${name}`;

/** `pageAt("https://kibo-ui.com/components/{name}")` */
const pageAt =
	(template: string) =>
	({ name }: Pick<RegistryItem, "name">) =>
		template.replace("{name}", name);

export const registries = [
	{
		builtin: true,
		description: "the original, radix primitives",
		framework: "react",
		homepage: "https://ui.shadcn.com",
		index: "https://ui.shadcn.com/r/index.json",
		name: "shadcn",
		page: componentPage("https://ui.shadcn.com"),
	},
	{
		builtin: true,
		description: "the svelte port of shadcn/ui",
		framework: "svelte",
		homepage: "https://shadcn-svelte.com",
		index: "https://shadcn-svelte.com/registry/index.json",
		name: "shadcn-svelte",
		page: (item) =>
			item.type === "registry:block"
				? "https://shadcn-svelte.com/blocks"
				: componentPage("https://shadcn-svelte.com")(item),
	},
	{
		builtin: true,
		description: "the vue port of shadcn/ui",
		framework: "vue",
		homepage: "https://www.shadcn-vue.com",
		index: "https://www.shadcn-vue.com/r/index.json",
		name: "shadcn-vue",
		page: componentPage("https://www.shadcn-vue.com"),
	},
	{
		description: "animated components and effects",
		framework: "react",
		homepage: "https://magicui.design",
		index: "https://magicui.design/r/registry.json",
		name: "magic ui",
		namespace: "@magicui",
		page: componentPage("https://magicui.design"),
	},
	{
		description: "origin ui's successor, components and blocks",
		framework: "react",
		homepage: "https://coss.com/ui",
		index: "https://coss.com/ui/r/registry.json",
		name: "coss ui",
		namespace: "@coss",
		// blocks are coss "particles", listed on one page
		page: (item) =>
			item.type === "registry:block"
				? "https://coss.com/ui/particles"
				: componentPage("https://coss.com/ui")(item),
	},
	{
		description: "motion heavy components and sections",
		framework: "react",
		homepage: "https://ui.aceternity.com",
		index: "https://ui.aceternity.com/registry/registry.json",
		name: "aceternity",
		namespace: "@aceternity",
		page: ({ name, type }) =>
			type === "registry:block"
				? "https://ui.aceternity.com/blocks"
				: `https://ui.aceternity.com/components/${name}`,
	},
	{
		description: "animated radix and base ui primitives",
		// the icon set is hundreds of items, skip it like the other icon registries
		filter: ({ name }) => !name.startsWith("icons-"),
		framework: "react",
		homepage: "https://animate-ui.com",
		index: "https://animate-ui.com/r/registry.json",
		name: "animate ui",
		namespace: "@animate-ui",
		// `backgrounds-bubble` → `docs/backgrounds/bubble`,
		// `buttons-flip` → `docs/components/buttons/flip`
		page: ({ name }) => {
			const [kind, ...rest] = name.split("-");
			if (kind === "backgrounds") {
				return `https://animate-ui.com/docs/backgrounds/${rest.join("-")}`;
			}
			if (kind === "buttons") {
				return `https://animate-ui.com/docs/components/buttons/${rest.join("-")}`;
			}

			return "https://animate-ui.com/docs";
		},
	},
	{
		description: "design engineer components",
		framework: "react",
		homepage: "https://www.cult-ui.com",
		index: "https://cult-ui.com/r/registry.json",
		name: "cult ui",
		namespace: "@cult-ui",
		// `<name>-demo` items are the demos of `<name>`
		page: ({ name }) =>
			componentPage("https://www.cult-ui.com")({
				name: name.replace(DEMO_SUFFIX, ""),
			}),
	},
	{
		description: "small motion building blocks",
		framework: "react",
		homepage: "https://motion-primitives.com",
		index: "https://motion-primitives.com/c/registry.json",
		name: "motion primitives",
		namespace: "@motion-primitives",
		page: ({ name }) => `https://motion-primitives.com/docs/${name}`,
	},
	{
		description: "8-bit retro components",
		framework: "react",
		homepage: "https://www.8bitcn.com",
		index: "https://www.8bitcn.com/r/registry.json",
		name: "8bitcn",
		namespace: "@8bitcn",
		// blocks live under their index category, `docs/blocks/hero/hero3`
		page: (item) => {
			if (item.type !== "registry:block") {
				return componentPage("https://www.8bitcn.com")(item);
			}

			const [category] = item.categories ?? [];
			return category
				? `https://www.8bitcn.com/docs/blocks/${category}/${item.name}`
				: "https://www.8bitcn.com/blocks";
		},
	},
	{
		description: "animated landing page components",
		framework: "react",
		homepage: "https://eldoraui.site",
		index: "https://eldoraui.site/r/registry.json",
		name: "eldora ui",
		namespace: "@eldoraui",
		// blocks are listed per index category, `blocks/logo-cloud`
		page: (item) => {
			if (item.type !== "registry:block") {
				return componentPage("https://eldoraui.site")(item);
			}

			const [category] = item.categories ?? [];
			return `https://eldoraui.site/blocks${category ? `/${category}` : ""}`;
		},
	},
	{
		description: "components and blocks for app ui",
		framework: "react",
		homepage: "https://kokonutui.com",
		index: "https://kokonutui.com/r/registry.json",
		name: "kokonut ui",
		namespace: "@kokonutui",
		page: componentPage("https://kokonutui.com"),
	},
	{
		description: "copy-paste components for svelte 5",
		framework: "svelte",
		homepage: "https://more-shadcn.noair.fun",
		index: "https://more-shadcn.noair.fun/r/index.json",
		name: "more shadcn",
		page: componentPage("https://more-shadcn.noair.fun"),
	},

	// ports from awesome-shadcn-ui that serve a shadcn-format registry. The
	// list links them to github, their registries live on the docs sites
	{
		description: "react aria components in the shadcn style",
		framework: "react",
		homepage: "https://jollyui.dev",
		index: "https://jollyui.dev/r/index.json",
		// items are per style, the docs install the default one
		item: ({ name }) => `https://jollyui.dev/r/styles/default/${name}.json`,
		name: "jolly ui",
		page: componentPage("https://jollyui.dev"),
	},
	{
		description: "react native components in the shadcn style",
		framework: "react-native",
		homepage: "https://tetra-ui.com",
		index: "https://tetra-ui.com/r/registry.json",
		name: "tetra ui",
		namespace: "@tetra-ui",
		page: componentPage("https://tetra-ui.com"),
	},
	{
		// no index, but every component in the docs nav has item json. Its cli
		// picks nativewind or uniwind per project, the nativewind files are listed
		builtin: true,
		cli: "npx @react-native-reusables/cli@latest add",
		description: "the react native port of shadcn/ui",
		discover: componentsInNav(
			"https://reactnativereusables.com/docs/components/button",
		),
		framework: "react-native",
		homepage: "https://reactnativereusables.com",
		index: "https://reactnativereusables.com/r/nativewind/",
		name: "react native reusables",
		page: componentPage("https://reactnativereusables.com"),
	},
	{
		// its own go cli reads this registry, so names install bare
		builtin: true,
		description: "the go and templ port of shadcn/ui",
		framework: "templ",
		homepage: "https://shadcn-templ.com",
		index: "https://shadcn-templ.com/r/registry.json",
		name: "shadcn-templ",
		// blocks share one page
		page: (item) =>
			item.type === "registry:block"
				? "https://shadcn-templ.com/blocks"
				: componentPage("https://shadcn-templ.com")(item),
	},

	// from awesome-shadcn-ui
	{
		description: "organic shapes and adjustable motion",
		embed: false,
		framework: "react",
		homepage: "https://cojeev.com/ui",
		index: "https://cojeev.com/ui/r/registry.json",
		name: "000h",
	},
	{
		description: "claymorphism components and blocks",
		framework: "react",
		homepage: "https://1st-pouf.worksonmy.dev",
		index: "https://1st-pouf.worksonmy.dev/r/registry.json",
		name: "1st pouf",
		namespace: "@1st-pouf",
	},
	{
		description: "registry of agent ui primitives",
		framework: "react",
		homepage: "https://agent-elements.21st.dev",
		index: "https://agent-elements.21st.dev/r/index.json",
		name: "21st dev agent elements",
		page: pageAt("https://agent-elements.21st.dev/docs/{name}"),
	},
	{
		description: "blocks and page templates on base ui",
		embed: false,
		framework: "react",
		homepage: "https://7ovr.com",
		index: "https://7ovr.com/r/registry.json",
		name: "7ovr",
		namespace: "@7ovr",
		page: pageAt("https://7ovr.com/preview/{name}"),
	},
	{
		description: "niche, high-utility components",
		framework: "react",
		homepage: "https://ui.8starlabs.com",
		index: "https://ui.8starlabs.com/r/registry.json",
		name: "8starlabs ui",
		namespace: "@8starlabs-ui",
		page: componentPage("https://ui.8starlabs.com"),
	},
	{
		description: "production-ready agents, made simple",
		framework: "react",
		homepage: "https://agentcn.vercel.app",
		index: "https://agentcn.vercel.app/r/registry.json",
		name: "agentcn",
		namespace: "@agentcn",
	},
	{
		description: "livekit's voice and video agent components",
		embed: false,
		framework: "react",
		homepage: "https://livekit.io/ui",
		index: "https://livekit.io/ui/r/registry.json",
		name: "agents ui",
	},
	{
		description: "animated react and tailwind components and blocks",
		embed: false,
		framework: "react",
		homepage: "https://aicanvas.me",
		index: "https://aicanvas.me/r/registry.json",
		name: "aicanvas",
		namespace: "@aicanvas",
		page: pageAt("https://aicanvas.me/components/{name}"),
	},
	{
		description: "approval workflows for react flow",
		framework: "react",
		homepage: "https://approvals-ui.vercel.app",
		index: "https://approvals-ui.vercel.app/r/registry.json",
		name: "approvals ui",
		namespace: "@approvals-ui",
	},
	{
		description: "components and blocks with motion built in",
		framework: "react",
		homepage: "https://uiarc.dev",
		index: "https://uiarc.dev/r/registry.json",
		name: "arc ui",
		namespace: "@uiarc",
		page: pageAt("https://uiarc.dev/components/{name}"),
	},
	{
		description: "audio components for react",
		framework: "react",
		homepage: "https://audiocn.dev",
		index: "https://audiocn.dev/r/registry.json",
		name: "audiocn",
		namespace: "@audiocn",
	},
	{
		description: "dashboard components and saas blocks",
		framework: "react",
		homepage: "https://aureformui.com",
		index: "https://aureformui.com/r/registry.json",
		name: "aureform ui",
	},
	{
		description: "localization components",
		framework: "react",
		homepage: "https://elements.babelize.co",
		index: "https://elements.babelize.co/r/registry.json",
		name: "babelize elements",
		namespace: "@babelize",
	},
	{
		description: "blocks, pieces and components",
		framework: "react",
		homepage: "https://ui.beste.co",
		index: "https://ui.beste.co/r/registry.json",
		name: "beste ui",
		namespace: "@beste-ui",
	},
	{
		description: "copy-paste animated components",
		framework: "react",
		homepage: "https://beui.dev",
		index: "https://beui.dev/r/registry.json",
		name: "beui",
		namespace: "@beui",
		page: pageAt("https://beui.dev/components/motion/{name}"),
	},
	{
		description: "billing and subscription components",
		framework: "react",
		homepage: "https://billingsdk.com",
		index: "https://billingsdk.com/r/registry.json",
		name: "billingsdk",
		namespace: "@billingsdk",
		page: componentPage("https://billingsdk.com"),
	},
	{
		description: "registry of accessible react components",
		embed: false,
		framework: "react",
		homepage: "https://blode.co/ui",
		index: "https://blode.co/ui/r/registry.json",
		name: "blode ui",
		namespace: "@blode",
		page: componentPage("https://blode.co/ui"),
	},
	{
		description: "collection of reusable animated components",
		framework: "react",
		homepage: "https://bundui.io",
		index: "https://bundui.io/r/registry.json",
		name: "bundui",
		namespace: "@bundui",
	},
	{
		description: "collection of reusable components",
		framework: "react",
		homepage: "https://chanhdai.com/components",
		index: "https://chanhdai.com/r/registry.json",
		name: "chanhdai components",
		namespace: "@ncdai",
		page: pageAt("https://chanhdai.com/components/{name}"),
	},
	{
		description: "animated components for shadcn/ui",
		framework: "react",
		homepage: "https://chewypixel.io/components",
		index: "https://chewypixel.io/r/registry.json",
		name: "chewypixel",
		namespace: "@chewypixel",
		page: pageAt("https://chewypixel.io/components/{name}"),
	},
	{
		description: "auth components on clerk's apis",
		embed: false,
		framework: "react",
		homepage: "https://clerk.com/docs/elements/examples/shadcn-ui",
		index: "https://clerk.com/r/registry.json",
		name: "clerk elements",
		namespace: "@clerk",
	},
	{
		description: "color and gradient picker",
		framework: "react",
		homepage: "https://orshot.com/open-source/colorshot",
		index: "https://orshot.com/r/registry.json",
		name: "colorshot",
		namespace: "@colorshot",
	},
	{
		description: "motion and interaction components for react and tailwind",
		framework: "react",
		homepage: "https://crafterui.com",
		index: "https://crafterui.com/r/registry.json",
		name: "crafterui",
		namespace: "@crafterui",
		page: pageAt("https://crafterui.com/components/{name}"),
	},
	{
		description: "components for supervising ai agents",
		framework: "react",
		homepage: "https://creance.pages.dev",
		index: "https://creance.pages.dev/r/registry.json",
		name: "creance",
		namespace: "@creance",
	},
	{
		description: "date-time range picker with timezones and presets",
		framework: "react",
		homepage: "https://date-time-range-picker.vercel.app",
		index: "https://date-time-range-picker.vercel.app/r/index.json",
		name: "date time range picker",
	},
	{
		description: "datetime picker with timezone support",
		framework: "react",
		homepage: "https://shadcn-datetime-picker-xi.vercel.app",
		index: "https://shadcn-datetime-picker-xi.vercel.app/r/registry.json",
		name: "datetime picker",
		page: pageAt("https://shadcn-datetime-picker-xi.vercel.app/{name}"),
	},
	{
		description: "ui blocks and templates",
		embed: false,
		framework: "react",
		homepage: "https://www.diarmuradi.com",
		index: "https://www.diarmuradi.com/r/registry.json",
		name: "diarmuradi",
		namespace: "@diarmuradi",
		page: pageAt("https://www.diarmuradi.com/components/{name}"),
	},
	{
		description:
			"opinionated components and tools for building modern websites and ai interfaces",
		framework: "react",
		homepage: "https://dominikkoch.dev/ui",
		index: "https://dominikkoch.dev/r/registry.json",
		name: "dominik ui",
		namespace: "@dominik-ui",
		page: pageAt("https://dominikkoch.dev/ui/{name}"),
	},
	{
		description: "dot matrix loaders",
		framework: "react",
		homepage: "https://dotmatrix.zzzzshawn.cloud",
		index: "https://dotmatrix.zzzzshawn.cloud/r/registry.json",
		name: "dotmatrix",
		namespace: "@dotmatrix",
	},
	{
		description: "motion-first react components and page blocks for shadcn",
		embed: false,
		framework: "react",
		homepage: "https://eased.dev",
		index: "https://eased.dev/r/registry.json",
		name: "eased",
		namespace: "@eased",
		page: pageAt("https://eased.dev/components/{name}"),
	},
	{
		description: "ready-to-use shadcn blocks that just work",
		framework: "react",
		homepage: "http://efferd.com",
		index: "http://efferd.com/r/registry.json",
		name: "efferd",
		namespace: "@efferd",
		page: pageAt("https://efferd.com/view/{name}"),
	},
	{
		description:
			"registry of accessible sections and page templates for marketing websites",
		framework: "react",
		homepage: "https://facadeui.dev",
		index: "https://facadeui.dev/r/registry.json",
		name: "facade ui",
		namespace: "@facade",
		page: pageAt("https://facadeui.dev/components/{name}"),
	},
	{
		description: "flight route visualizations for mapcn",
		framework: "react",
		homepage: "https://flightcn.yencheng.dev",
		index: "https://flightcn.yencheng.dev/r/registry.json",
		name: "flightcn",
		namespace: "@flightcn",
	},
	{
		description: "spring physics components",
		framework: "react",
		homepage: "https://fluid-functionalism.vercel.app",
		index: "https://fluid-functionalism.vercel.app/r/registry.json",
		name: "fluid functionalism",
		page: pageAt("https://fluid-functionalism.vercel.app/docs/{name}"),
	},
	{
		description: "glass components",
		framework: "react",
		homepage: "https://glassyui.com",
		index: "https://glassyui.com/r/registry.json",
		name: "glassy ui",
		namespace: "@glassyui",
		page: pageAt("https://glassyui.com/components/{name}"),
	},
	{
		description: "morphing toast notifications for react",
		framework: "react",
		homepage: "https://goey-toast.vercel.app",
		index: "https://goey-toast.vercel.app/r/index.json",
		name: "goey toast",
	},
	{
		description:
			"react components, hooks and ai blocks for shadcn/ui on base ui",
		framework: "react",
		homepage: "https://hextaui.com",
		index: "https://hextaui.com/r/registry.json",
		name: "hextaui",
		namespace: "@hextaui",
		page: pageAt("https://hextaui.com/docs/{name}"),
	},
	{
		description: "animated svg illustrations",
		embed: false,
		framework: "react",
		homepage: "https://illos.dev",
		index: "https://illos.dev/r/registry.json",
		name: "illos",
	},
	{
		description: "design system for docs sites",
		embed: false,
		framework: "react",
		homepage: "https://ds.interlace.tools",
		index: "https://ds.interlace.tools/r/registry.json",
		name: "interlace ui",
		page: pageAt("https://ds.interlace.tools/c/{name}"),
	},
	{
		description: "kanban board",
		framework: "react",
		homepage: "https://shadcn-kanban-board.com",
		index: "https://shadcn-kanban-board.com/r/registry.json",
		name: "kanban board",
	},
	{
		description: "comprehensive components for complex apps",
		framework: "react",
		homepage: "https://www.kibo-ui.com/overview",
		index: "https://www.kibo-ui.com/r/registry.json",
		name: "kibo ui",
		namespace: "@kibo-ui",
		page: pageAt("https://www.kibo-ui.com/components/{name}"),
	},
	{
		description: "landing page components with react, shadcn/ui and tailwind",
		framework: "react",
		homepage: "https://www.launchuicomponents.com",
		index: "https://www.launchuicomponents.com/r/registry.json",
		name: "launch ui",
		namespace: "@launchui",
		page: pageAt("https://www.launchuicomponents.com/docs/sections/{name}"),
	},
	{
		description: "liquid glass components",
		framework: "react",
		homepage: "https://liquikit.dev",
		index: "https://liquikit.dev/r/registry.json",
		name: "liquikit",
		namespace: "@liquikit",
		page: componentPage("https://liquikit.dev"),
	},
	{
		description: "spinners, loaders and loading states",
		framework: "react",
		homepage: "https://loading-ui.com",
		index: "https://loading-ui.com/r/registry.json",
		name: "loading ui",
		namespace: "@loading-ui",
		page: componentPage("https://loading-ui.com"),
	},
	{
		description: "local-first ai ui primitives and blocks",
		framework: "react",
		homepage: "https://localmode.ai",
		index: "https://localmode.ai/r/registry.json",
		name: "localmode",
		namespace: "@localmode",
	},
	{
		description: "components for chatgpt and mcp apps",
		framework: "react",
		homepage: "https://ui.manifest.build",
		index: "https://ui.manifest.build/r/registry.json",
		name: "manifest ui",
		namespace: "@manifest",
		// blocks live under their index category, `blocks/form/date-time-picker`.
		// The site answers 200 for any path, so a wrong guess wouldn't 404
		page: (item) => {
			const [category] = item.categories ?? [];
			return category
				? `https://ui.manifest.build/blocks/${category}/${item.name}`
				: "https://ui.manifest.build/blocks";
		},
	},
	{
		description: "copy-paste microinteractions",
		framework: "react",
		homepage: "https://microkit.co",
		index: "https://microkit.co/r/registry.json",
		name: "microkit",
		namespace: "@microkit",
		page: pageAt("https://microkit.co/components/{name}"),
	},
	{
		description: "document viewers, agent chat and playful utilities",
		framework: "react",
		homepage: "https://ui.tinkererslabs.com",
		index: "https://ui.tinkererslabs.com/r/registry.json",
		name: "mischief ui",
		namespace: "@mischief",
		page: componentPage("https://ui.tinkererslabs.com"),
	},
	{
		description: "animated react components",
		framework: "react",
		homepage: "https://mizzle.saddy.me",
		index: "https://mizzle.saddy.me/r/registry.json",
		name: "mizzle",
		namespace: "@mizzle",
	},
	{
		description: "animated components, blocks and motion primitives",
		embed: false,
		framework: "react",
		homepage: "https://motion-lexicon.pages.dev/en",
		index: "https://motion-lexicon.pages.dev/r/registry.json",
		name: "motion lexicon",
		namespace: "@motion-lexicon",
		page: pageAt("https://motion-lexicon.pages.dev/en/components/{name}"),
	},
	{
		description: "animated ui components",
		embed: false,
		framework: "react",
		homepage: "https://movin.design/components",
		index: "https://movin.design/r/registry.json",
		name: "movin design",
		namespace: "@movin",
	},
	{
		description: "ui kit for react",
		framework: "react",
		homepage: "https://mynaui.com",
		index: "https://mynaui.com/registry.json",
		name: "mynaui",
	},
	{
		description:
			"component library of composable, copy-paste primitives for building ai interfaces",
		framework: "react",
		homepage: "https://nexus-ui.dev",
		index: "https://nexus-ui.dev/r/registry.json",
		name: "nexus ui",
		namespace: "@nexus-ui",
		page: componentPage("https://nexus-ui.dev"),
	},
	{
		description: "composable data table for shadcn/ui",
		embed: false,
		framework: "react",
		homepage: "https://niko-table.com",
		index: "https://niko-table.com/r/registry.json",
		name: "niko table",
		namespace: "@niko-table",
	},
	{
		description: "single-interaction components",
		framework: "react",
		homepage: "https://design.helpmarq.com",
		index: "https://design.helpmarq.com/r/registry.json",
		name: "ns ui",
		namespace: "@ns-ui",
		page: pageAt("https://design.helpmarq.com/components/{name}"),
	},
	{
		description: "animated vue 3 components for shadcn-vue projects",
		embed: false,
		framework: "vue",
		homepage: "https://nxui.geoql.in/docs",
		index: "https://nxui.geoql.in/r/registry.json",
		name: "nxui",
		page: componentPage("https://nxui.geoql.in"),
	},
	{
		description: "blocks, motion components and templates",
		framework: "react",
		homepage: "https://paceui.com",
		index: "https://paceui.com/r/registry.json",
		name: "paceui",
		namespace: "@paceui",
	},
	{
		description: "ai and agent interface components",
		framework: "react",
		homepage: "https://pastaui.com",
		index: "https://pastaui.com/r/registry.json",
		name: "pastaui",
		namespace: "@pastaui",
		page: pageAt("https://pastaui.com/components/{name}"),
	},
	{
		description: "payload cms blocks",
		embed: false,
		framework: "react",
		homepage: "https://www.payload-components.xyz",
		index: "https://www.payload-components.xyz/r/registry.json",
		name: "payload components",
		namespace: "@payload-components",
		page: componentPage("https://www.payload-components.xyz"),
	},
	{
		description: "radial pie menu component for shadcn/ui",
		framework: "react",
		homepage: "https://piemenu.jpmarqu.es",
		index: "https://piemenu.jpmarqu.es/r/registry.json",
		name: "pie menu",
		namespace: "@jpmarques",
	},
	{
		description: "registry of animated react components",
		embed: false,
		framework: "react",
		homepage: "https://useplanes.com",
		index: "https://useplanes.com/r/registry.json",
		name: "planes",
		page: pageAt("https://useplanes.com/components/{name}"),
	},
	{
		description: "rich multi-select editor",
		framework: "react",
		homepage: "https://platejs.org/docs/multi-select",
		index: "https://platejs.org/r/registry.json",
		name: "plate",
		namespace: "@plate",
		page: componentPage("https://platejs.org"),
	},
	{
		description: "collection of ui components and animated effects",
		embed: false,
		framework: "react",
		homepage: "https://reui.io",
		index: "https://reui.io/r/registry.json",
		name: "reui",
		namespace: "@reui",
	},
	{
		description: "animated react components, blocks and page sections",
		framework: "react",
		homepage: "https://reactframe.com",
		index: "https://reactframe.com/r/registry.json",
		name: "reactframe",
		namespace: "@reactframe",
		page: pageAt("https://reactframe.com/components/{name}"),
	},
	{
		description: "remotion components for product videos",
		framework: "react",
		homepage: "https://www.remocn.dev",
		index: "https://www.remocn.dev/r/registry.json",
		name: "remocn",
		namespace: "@remocn",
	},
	{
		description: "neo brutalism components",
		framework: "react",
		homepage: "https://retroui.dev",
		index: "https://retroui.dev/r/registry.json",
		name: "retroui",
		namespace: "@retroui",
		page: componentPage("https://retroui.dev"),
	},
	{
		description: "huge library of blocks and component variants",
		framework: "react",
		homepage: "https://www.shadcnblocks.com",
		index: "https://www.shadcnblocks.com/r/registry.json",
		name: "shadcnblocks",
		namespace: "@shadcnblocks",
		page: pageAt("https://www.shadcnblocks.com/block/{name}"),
	},
	{
		description: "customizable chatbot components",
		framework: "react",
		homepage: "https://shadcn-chatbot-kit.vercel.app",
		index: "https://shadcn-chatbot-kit.vercel.app/r/index.json",
		name: "shadcn chatbot kit",
		page: componentPage("https://shadcn-chatbot-kit.vercel.app"),
	},
	{
		description: "advanced date picker with various features",
		framework: "react",
		homepage: "https://date-picker.luca-felix.com",
		index: "https://date-picker.luca-felix.com/r/registry.json",
		name: "shadcn date picker",
	},
	{
		description: "dozens of advanced shadcn/ui examples",
		framework: "react",
		homepage: "https://shadcnexamples.com",
		index: "https://shadcnexamples.com/r/registry.json",
		name: "shadcn examples",
		page: pageAt("https://shadcnexamples.com/{name}"),
	},
	{
		description: "google places address autocomplete",
		framework: "react",
		homepage: "https://shadcn-google-maps.vercel.app",
		index: "https://shadcn-google-maps.vercel.app/r/registry.json",
		name: "shadcn google maps",
	},
	{
		description: "comprehensive react hooks collection",
		framework: "react",
		homepage: "https://shadcn-hooks.com",
		index: "https://shadcn-hooks.com/r/registry.json",
		name: "shadcn hooks",
		namespace: "@shadcnhooks",
		page: pageAt("https://shadcn-hooks.com/docs/hooks/{name}"),
	},
	{
		description:
			"map component built for shadcn/ui using leaflet and react leaflet",
		framework: "react",
		homepage: "https://shadcn-map.vercel.app",
		index: "https://shadcn-map.vercel.app/r/registry.json",
		name: "shadcn map",
		namespace: "@shadcn-map",
	},
	{
		description: "json schema forms and a visual form builder",
		framework: "react",
		homepage: "https://shadcn-rjsf-form-builder.noowah.dev",
		index: "https://shadcn-rjsf-form-builder.noowah.dev/r/registry.json",
		name: "shadcn rjsf form builder",
	},
	{
		description: "components, blocks and templates on base ui",
		embed: false,
		framework: "react",
		homepage: "https://shadcnstore.com",
		index: "https://shadcnstore.com/r/registry.json",
		name: "shadcn store",
		namespace: "@shadcnstore",
	},
	{
		description: "seamless shadcn tanstack form component set",
		framework: "react",
		homepage: "https://shadcn-tanstack-form.felipestanzani.com",
		index: "https://shadcn-tanstack-form.felipestanzani.com/r/registry.json",
		name: "shadcn tanstack form",
	},
	{
		description: "collection of responsive ui blocks",
		framework: "react",
		homepage: "https://shadcn-ui-blocks.vercel.app",
		index: "https://shadcn-ui-blocks.vercel.app/r/registry.json",
		name: "shadcn ui blocks",
	},
	{
		description: "production-ready design system",
		framework: "react",
		homepage: "https://shadcncraft.com/components?filter=free",
		index: "https://shadcncraft.com/r/registry.json",
		name: "shadcncraft",
		namespace: "@shadcncraft",
	},
	{
		description: "agent change review and approvals",
		embed: false,
		framework: "react",
		homepage: "https://signoff-ui.vercel.app",
		index: "https://signoff-ui.vercel.app/r/registry.json",
		name: "signoff ui",
		page: componentPage("https://signoff-ui.vercel.app"),
	},
	{
		description: "components and blocks to easily build ai apps",
		framework: "react",
		homepage: "https://simple-ai.dev",
		index: "https://simple-ai.dev/r/registry.json",
		name: "simple ai",
		namespace: "@simple-ai",
	},
	{
		description: "token-driven design system",
		framework: "react",
		homepage: "https://skrewww.com",
		index: "https://skrewww.com/r/registry.json",
		name: "skrewww",
		namespace: "@skrewww",
		page: pageAt("https://skrewww.com/components/{name}"),
	},
	{
		description: "customizable animated ui blocks",
		framework: "react",
		homepage: "https://smoothui.dev",
		index: "https://smoothui.dev/r/registry.json",
		name: "smoothui",
		namespace: "@smoothui",
		page: pageAt("https://smoothui.dev/blocks/preview/{name}"),
	},
	{
		description: "remotion video components that look like software",
		framework: "react",
		homepage: "https://snapcn.dev",
		index: "https://snapcn.dev/r/registry.json",
		name: "snapcn",
		namespace: "@snapcn",
	},
	{
		description: "components and page templates from openlmis",
		embed: false,
		framework: "react",
		homepage: "https://registry.soldevelo.com",
		index: "https://registry.soldevelo.com/r/registry.json",
		name: "soldevelo",
		namespace: "@soldevelo",
	},
	{
		description: "motion-first react component registry on the shadcn model",
		embed: false,
		framework: "react",
		homepage: "https://ui.soralabs.studio",
		index: "https://ui.soralabs.studio/r/registry.json",
		name: "sora ui",
		namespace: "@soralabs",
	},
	{
		description: "components, patterns and charts in nine styles",
		embed: false,
		framework: "react",
		homepage: "https://suiss.app/ui",
		index: "https://suiss.app/ui/r/registry.json",
		name: "suiss ui",
		namespace: "@esuiss",
		// items live under their index category, `docs/patterns/<name>`
		page: ({ categories, name }) =>
			`https://suiss.app/ui/docs/${categories?.[0] ?? "components"}/${name}`,
	},
	{
		description: "shadcn registry of confirmation components",
		framework: "react",
		homepage: "https://sureui.com",
		index: "https://sureui.com/r/registry.json",
		name: "sureui",
		namespace: "@sureui",
		page: pageAt("https://sureui.com/docs/{name}"),
	},
	{
		description: "shadcn blocks for building modern marketing websites",
		embed: false,
		framework: "react",
		homepage: "https://tailark.com",
		index: "https://tailark.com/r/registry.json",
		name: "tailark",
		namespace: "@tailark",
	},
	{
		description: "beautiful terminal uis, made simple",
		framework: "react",
		homepage: "https://termcn.vercel.app",
		index: "https://termcn.vercel.app/r/registry.json",
		name: "termcn",
		namespace: "@termcn",
	},
	{
		description: "component for building onboarding tours",
		framework: "react",
		homepage: "https://onboarding-tour.vercel.app",
		index: "https://onboarding-tour.vercel.app/r/registry.json",
		name: "tour",
		namespace: "@tour",
	},
	{
		description: "gamification components",
		framework: "react",
		homepage: "https://ui.trophy.so",
		index: "https://ui.trophy.so/r/registry.json",
		name: "trophy ui",
		namespace: "@trophy-ui",
		page: componentPage("https://ui.trophy.so"),
	},
	{
		description: "compound components and blocks with motion",
		framework: "react",
		homepage: "https://uaiblocks.dev",
		index: "https://uaiblocks.dev/r/registry.json",
		name: "uai",
		namespace: "@uai",
		page: pageAt("https://uaiblocks.dev/components/{name}"),
	},
	{
		description: "animated react components",
		embed: false,
		framework: "react",
		homepage: "https://uibeats.com",
		index: "https://uibeats.com/r/registry.json",
		name: "ui beats",
	},
	{
		description:
			"collection of customizable ui blocks with interactive live previews",
		framework: "react",
		homepage: "https://ui.flexnative.com",
		index: "https://ui.flexnative.com/r/registry.json",
		name: "flexnative ui",
		namespace: "@flx",
	},
	{
		description: "layouts, components and effects",
		framework: "react",
		homepage: "https://www.ui-layouts.com",
		index: "https://www.ui-layouts.com/r/registry.json",
		name: "ui layouts",
		namespace: "@ui-layouts",
	},
	{
		description: "animated components and landing pages",
		embed: false,
		framework: "react",
		homepage: "https://upfork.dev",
		index: "https://upfork.dev/r/registry.json",
		name: "upfork",
		namespace: "@upfork",
		page: pageAt("https://upfork.dev/products/{name}"),
	},
	{
		description: "file upload components and blocks",
		framework: "react",
		homepage: "https://uploadcn.dev",
		index: "https://uploadcn.dev/r/registry.json",
		name: "uploadcn",
		namespace: "@uploadcn",
		page: componentPage("https://uploadcn.dev"),
	},
	{
		description: "premium animated react components and micro-interactions",
		framework: "react",
		homepage: "https://uselayouts.com",
		index: "https://uselayouts.com/r/registry.json",
		name: "uselayouts",
		namespace: "@uselayouts",
		page: componentPage("https://uselayouts.com"),
	},
	{
		description: "base ui components in three themes",
		embed: false,
		framework: "react",
		homepage: "https://usva.build",
		index: "https://usva.build/r/registry.json",
		name: "usva",
		namespace: "@usva",
		page: componentPage("https://usva.build"),
	},
	{
		description: "animated landing page components",
		framework: "react",
		homepage: "https://www.vengenceui.com",
		index: "https://www.vengenceui.com/r/registry.json",
		name: "vengence ui",
	},
	{
		description: "registry of whatsapp web chat components",
		framework: "react",
		homepage: "https://ui.meta-cloud-api.site",
		index: "https://ui.meta-cloud-api.site/r/registry.json",
		name: "wa ui",
		namespace: "@wa-ui",
	},
	{
		description:
			"set of components inspired by classic warcraft iii rts ui aesthetics",
		framework: "react",
		homepage: "https://www.warcraftcn.com",
		index: "https://www.warcraftcn.com/r/registry.json",
		name: "warcraftcn",
		page: componentPage("https://www.warcraftcn.com"),
	},
	{
		description: "data-dense ops dashboard components",
		embed: false,
		framework: "react",
		homepage: "https://warren.eduard3v.com",
		index: "https://warren.eduard3v.com/r/registry.json",
		name: "warren ui",
		page: componentPage("https://warren.eduard3v.com"),
	},
	{
		description: "components, blocks and dashboards",
		embed: false,
		framework: "react",
		homepage: "https://ui.watermelon.sh",
		index: "https://ui.watermelon.sh/r/registry.json",
		name: "watermelon ui",
		namespace: "@watermelon",
	},
	{
		description:
			"collection of components that you can use to build your own component library",
		framework: "react",
		homepage: "https://wds-shadcn-registry.netlify.app",
		index: "https://wds-shadcn-registry.netlify.app/r/registry.json",
		name: "wds registry",
		namespace: "@wds",
		page: pageAt("https://wds-shadcn-registry.netlify.app/components/{name}"),
	},
	{
		description: "components and page sections in 35 categories",
		embed: false,
		framework: "react",
		homepage: "https://we.inc/components",
		index: "https://we.inc/r/registry.json",
		name: "we.inc components",
	},
	{
		description: "primitives, components and motion",
		embed: false,
		framework: "react",
		homepage: "https://ui.wensity.com",
		index: "https://ui.wensity.com/r/registry.json",
		name: "wensity",
		namespace: "@wensity",
		page: pageAt("https://ui.wensity.com/components/{name}"),
	},
	{
		description: "realtime canvas charts",
		framework: "react",
		homepage: "https://wick-charts.eeff.io/integrations/shadcn",
		index: "https://wick-charts.eeff.io/r/registry.json",
		name: "wick charts",
		namespace: "@wick-charts",
	},
] as const satisfies readonly Registry[];

/** the docs page to show for an item */
export function pageFor(registry: Registry, item: RegistryItem) {
	return registry.page?.(item) ?? item.page ?? registry.homepage;
}

const CLI: Record<Framework, string> = {
	react: "npx shadcn@latest add",
	"react-native": "npx shadcn@latest add",
	svelte: "npx shadcn-svelte@latest add",
	// installed with `go install github.com/axadrn/shadcn-templ/v2/cmd/shadcn-templ@latest`
	templ: "shadcn-templ add",
	vue: "npx shadcn-vue@latest add",
};

/** the add command, by namespace when the registry is in the official directory */
export function installCommand(registry: Registry, item: RegistryItem) {
	return `${registry.cli ?? CLI[registry.framework]} ${installTarget(registry, item)}`;
}

/** the item's json, next to the index: `.../r/registry.json` → `.../r/<name>.json` */
export function itemUrl(registry: Registry, item: RegistryItem) {
	return (
		registry.item?.(item) ??
		new URL(`${item.name}.json`, registry.index).toString()
	);
}

function installTarget(registry: Registry, item: RegistryItem) {
	if (registry.builtin) return item.name;
	if (registry.namespace) return `${registry.namespace}/${item.name}`;
	return itemUrl(registry, item);
}
