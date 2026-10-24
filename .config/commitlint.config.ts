import type { UserConfig } from "@commitlint/types";

// conventional commits (`feat:`, `fix:`, `chore:` ...), auto reads them to pick
// each release's version bump
export default {
	extends: ["@commitlint/config-conventional"],
} satisfies UserConfig;
