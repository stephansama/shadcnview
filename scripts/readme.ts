// Regenerates the registry table in README.md from `src/registries.ts`,
// between the `registries:start` and `registries:end` markers.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { registries, type Registry } from "../src/registries";

const README = path.join(import.meta.dirname, "../README.md");
const START = "<!-- registries:start -->";
const END = "<!-- registries:end -->";

const cell = (value: string) => value.replaceAll("|", String.raw`\|`);

const counts = Object.groupBy(
	registries as readonly Registry[],
	(r) => r.framework,
);
const summary = Object.entries(counts)
	.map(([framework, list]) => `${list?.length} ${framework}`)
	.join(", ");

function installedBy(registry: Registry) {
	if (registry.builtin) return "built in";
	if (registry.namespace) return `\`${registry.namespace}\``;
	return "by url";
}

const table = [
	`${registries.length} registries (${summary}), all defined in [\`src/registries.ts\`](src/registries.ts).`,
	"",
	"| registry | framework | description | add |",
	"| --- | --- | --- | --- |",
	...(registries as readonly Registry[]).map(
		(r) =>
			`| [${cell(r.name)}](${r.homepage}) | ${r.framework} | ${cell(r.description)} | ${installedBy(r)} |`,
	),
].join("\n");

const readme = await readFile(README, "utf8");
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1)
	throw new Error(`README.md is missing ${START} / ${END}`);

await writeFile(
	README,
	`${readme.slice(0, start + START.length)}\n\n${table}\n\n${readme.slice(end)}`,
);
console.log(`wrote ${registries.length} registries to README.md`);
