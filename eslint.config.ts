import { config, presets } from "@stephansama/eslint-config";
import reactHooks from "eslint-plugin-react-hooks";

export default config({
	...presets.base,
	// clipboard, AbortSignal.timeout and Object.groupBy are all "newly" available
	baseline: { available: "newly" },
	ignore: ["src/routeTree.gen.ts", "src/components/ui/**", "**/*.md"],
	// vite-iconify-svgmap icons only exist inside vite
	imports: { ignore: [String.raw`^virtual:iconify-svgmap/`] },
	overrides: [
		reactHooks.configs.flat.recommended,
		// the app runs in the browser, node's builtin support table doesn't apply
		{
			files: ["src/**"],
			rules: { "n/no-unsupported-features/node-builtins": "off" },
		},
		// build scripts report progress on stdout
		{ files: ["scripts/**"], rules: { "no-console": "off" } },
		// `#/lib/utils` is the path shadcn components import `cn` from
		{
			files: ["src/lib/utils.ts"],
			rules: { "unicorn/prevent-abbreviations": "off" },
		},
	],
});
