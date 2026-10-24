import { Button } from "#/components/ui/button";
import { toggleTheme } from "#/lib/theme";

import { Icon } from "./icon";

/**
 * sun in dark mode, moon in light. The icons follow the `.dark` class through
 * css, so the prerendered button is right before react loads
 */
export function ThemeToggle({ onClick }: { onClick?: () => void }) {
	return (
		<Button
			aria-label="toggle theme"
			onClick={onClick ?? toggleTheme}
			size="icon-sm"
			title="toggle theme"
			variant="outline"
		>
			<Icon className="hidden dark:block" name="sun" />
			<Icon className="dark:hidden" name="moon" />
		</Button>
	);
}
