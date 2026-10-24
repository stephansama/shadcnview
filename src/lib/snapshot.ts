import type { RegistryItem } from "#/registries";

/** what `scripts/snapshot.ts` writes to `public/data/registries.json` */
export type Snapshot = {
	builtAt: string;
	/** keyed by registry name */
	registries: Record<
		string,
		{
			error?: string;
			/** `/favicons/<registry>.<ext>`, missing when none could be fetched */
			favicon?: string;
			items: RegistryItem[];
		}
	>;
};

/**
 * the registry counts and favicons, small enough to bundle so the prerendered
 * page can show every group before the full snapshot loads
 */
export type SnapshotSummary = {
	builtAt: string;
	registries: Record<string, { count: number; favicon?: string }>;
	total: number;
};

export const SNAPSHOT_PATH = "/data/registries.json";
