import type { Configuration } from "lint-staged";

// staged files only, prettier first then eslint (lefthook's pre-commit runs this)
export default {
	"*.{css,md,yml,yaml}": "prettier --write --ignore-unknown",
	"*.{json,ts,tsx}": [
		"prettier --write --ignore-unknown",
		"eslint --fix --no-warn-ignored",
	],
} satisfies Configuration;
