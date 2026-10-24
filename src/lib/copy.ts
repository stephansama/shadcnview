import { toast } from "sonner";

import { type ComponentRow, rowLinks } from "./rows";

export async function copyInstall(row: ComponentRow) {
	const { install } = rowLinks(row);
	try {
		await navigator.clipboard.writeText(install);
		toast.success("copied add command", { description: install });
	} catch {
		toast.error("couldn't copy to the clipboard", { description: install });
	}
}
