import {
	type Framework,
	installCommand,
	itemUrl,
	pageFor,
	registries,
	type Registry,
	type RegistryItem,
} from "#/registries";

import type { Snapshot } from "./snapshot";

export type ComponentRow = {
	depCount: number;
	dependencies: readonly string[];
	description: string;
	framework: Framework;
	/** `<registry>/<name>`, also the `?item=` search param */
	id: string;
	item: RegistryItem;
	name: string;
	registry: string;
	registryDependencies: readonly string[];
	title: string;
	/** `registry:ui` → `ui` */
	type: string;
};

export type RegistryStatus = {
	count: number;
	error?: string;
	favicon?: string;
	registry: Registry;
};

const byName = new Map<string, Registry>(registries.map((r) => [r.name, r]));

export const getRegistry = (name: string) => byName.get(name);

export function buildRows(snapshot: Snapshot) {
	const rows: ComponentRow[] = [];
	const statuses: RegistryStatus[] = [];

	for (const registry of registries as readonly Registry[]) {
		const entry = snapshot.registries[registry.name];
		statuses.push({
			count: entry?.items.length ?? 0,
			error: entry ? entry.error : "missing from snapshot",
			favicon: entry?.favicon,
			registry,
		});

		const seen = new Set<string>();
		for (const item of entry?.items ?? []) {
			// a few indexes list the same name twice
			if (seen.has(item.name)) continue;
			seen.add(item.name);

			const dependencies = [
				...(item.dependencies ?? []),
				...(item.devDependencies ?? []),
			];
			const registryDependencies = item.registryDependencies ?? [];
			const title = item.title ?? item.name;
			const description = item.description ?? "";
			rows.push({
				depCount: dependencies.length + registryDependencies.length,
				dependencies,
				description,
				framework: registry.framework,
				id: `${registry.name}/${item.name}`,
				item,
				name: item.name,
				registry: registry.name,
				registryDependencies,
				title,
				type: item.type.replace("registry:", ""),
			});
		}
	}

	return { rows, statuses };
}

/** docs page and add command, worked out when a row is used rather than for all of them up front */
export function rowLinks(row: ComponentRow) {
	const registry = byName.get(row.registry);
	if (!registry) return { install: "", page: "" };

	return {
		install: installCommand(registry, row.item),
		page: pageFor(registry, row.item),
	};
}

// a bare registry dependency comes from the framework's own base registry
// when the item's registry doesn't have it, the way the add commands resolve it
const BASE_REGISTRY: Record<Framework, string> = {
	react: "shadcn",
	"react-native": "react native reusables",
	svelte: "shadcn-svelte",
	templ: "shadcn-templ",
	vue: "shadcn-vue",
};

const NAMESPACED = /^(@[^/]+)\/(.+)$/;

export type DependencyResolver = ReturnType<typeof createDependencyResolver>;

/**
 * finds the listed component a registry dependency points at: a bare name
 * (`separator`), a namespaced one (`@magicui/marquee`) or an item json url
 */
export function createDependencyResolver(rows: ComponentRow[]) {
	const byId = new Map(rows.map((row) => [row.id, row]));
	const byItemUrl = new Map<string, ComponentRow>();
	for (const row of rows) {
		const registry = byName.get(row.registry);
		if (registry) byItemUrl.set(itemUrl(registry, row.item), row);
	}
	const byNamespace = new Map(
		(registries as readonly Registry[]).flatMap((registry) =>
			registry.namespace ? [[registry.namespace, registry.name] as const] : [],
		),
	);

	return (from: ComponentRow, dependency: string) => {
		if (URL.canParse(dependency)) return byItemUrl.get(dependency);

		const [, namespace, name] = NAMESPACED.exec(dependency) ?? [];
		if (namespace && name) {
			const registry = byNamespace.get(namespace);
			return registry ? byId.get(`${registry}/${name}`) : undefined;
		}

		return (
			byId.get(`${from.registry}/${dependency}`) ??
			byId.get(`${BASE_REGISTRY[from.framework]}/${dependency}`)
		);
	};
}
