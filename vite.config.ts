import iconifySvgmap from "@stephansama/vite-iconify-svgmap";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		// lucide, logos and simple-icons as hashed svg sprites, see src/lib/icons.ts
		iconifySvgmap(),
		// fully static, the registry data is a json file next to the html
		tanstackStart({ prerender: { crawlLinks: false, enabled: true } }),
		viteReact(),
	],
	resolve: { tsconfigPaths: true },
});
