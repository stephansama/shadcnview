import type { IconName } from "#/lib/icons";

import { Button } from "#/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { cn } from "#/lib/utils";
import { AWESOME_LIST } from "#/registries";

import { Icon } from "./icon";

const PORTFOLIO = "https://stephansama.info";
const REPOSITORY = "https://github.com/stephansama/shadcnview";
// downloaded at build by `pnpm snapshot`, github's copy if that failed
const AVATAR = "/avatar.jpg";
const AVATAR_FALLBACK = "https://github.com/stephansama.png?size=112";
// everything else stephan has made
const DIRECTORY = "https://directory.stephansama.info";

// brand colors on hover. github's own is near black, so it follows the
// theme's text color instead, like its logo does
const SOCIALS: {
	hover: string;
	href: string;
	icon: IconName;
	label: string;
}[] = [
	{
		hover: "hover:text-foreground",
		href: "https://github.com/stephansama",
		icon: "github",
		label: "github",
	},
	{
		hover: "hover:text-[#1185fe]",
		href: "https://bsky.app/profile/stephansama.info",
		icon: "bluesky",
		label: "bluesky",
	},
	{
		hover: "hover:text-[#0a66c2]",
		href: "https://www.linkedin.com/in/stephan-randle-38a30319a/",
		icon: "linkedin",
		label: "linkedin",
	},
	{
		hover: "hover:text-[#ff0000]",
		href: "https://www.youtube.com/@stephansama",
		icon: "youtube",
		label: "youtube",
	},
];

/** who made this, where the data comes from, and how fresh it is */
export function AboutPopover({
	builtAt,
	componentCount,
	registryCount,
}: {
	builtAt: string;
	componentCount: number;
	registryCount: number;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					aria-label="about shadcnview"
					size="icon-sm"
					title="about"
					variant="outline"
				>
					<Icon name="help" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				align="end"
				className="w-[min(22rem,calc(100vw-1.5rem))] p-0 text-sm"
				collisionPadding={12}
			>
				<div className="space-y-4 p-4">
					<p className="text-xs font-medium tracking-widest text-primary uppercase">
						made by
					</p>

					<a
						className="group flex items-center gap-3"
						href={PORTFOLIO}
						rel="noreferrer"
						target="_blank"
					>
						<img
							alt=""
							className="size-14 rounded-full border-2 border-primary ring-4 ring-border"
							height={56}
							onError={(event) => {
								if (event.currentTarget.src !== AVATAR_FALLBACK) {
									event.currentTarget.src = AVATAR_FALLBACK;
								}
							}}
							src={AVATAR}
							width={56}
						/>
						<span className="min-w-0">
							<span className="block truncate text-lg font-semibold group-hover:underline">
								Stephan Randle
							</span>
							<span className="block text-muted-foreground">@stephansama</span>
						</span>
					</a>

					<div className="grid grid-cols-4 gap-2">
						{SOCIALS.map(({ hover, href, icon, label }) => (
							<a
								aria-label={label}
								className={cn(
									"flex h-11 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-accent",
									hover,
								)}
								href={href}
								key={label}
								rel="me noreferrer"
								target="_blank"
								title={label}
							>
								<Icon className="size-5" name={icon} />
							</a>
						))}
					</div>

					<Button asChild className="h-11 w-full">
						<a href={DIRECTORY} rel="noreferrer" target="_blank">
							more from stephan
							<Icon name="arrowUpRight" />
						</a>
					</Button>
				</div>

				<div className="space-y-2 border-t p-4">
					<p className="flex items-center gap-2 font-semibold">
						<img
							alt=""
							className="size-5"
							height={20}
							src="/logo.svg"
							width={20}
						/>
						shadcnview
						<a
							className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
							href={REPOSITORY}
							rel="noreferrer"
							target="_blank"
						>
							<Icon className="size-3.5" name="github" />
							source
						</a>
					</p>
					<p className="text-muted-foreground">
						{registryCount} shadcn registries in one searchable table. The
						registry list comes from{" "}
						<a
							className="inline-flex items-baseline gap-1 text-foreground"
							href={AWESOME_LIST}
							rel="noreferrer"
							target="_blank"
						>
							<Icon
								className="size-3.5 self-center text-[#fc60a8]"
								name="awesome"
							/>
							<span className="underline underline-offset-4">
								awesome-shadcn-ui
							</span>
						</a>
						.
					</p>
				</div>

				<div className="flex items-center justify-between border-t px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
					<span>{componentCount.toLocaleString()} components</span>
					<span>snapshot {new Date(builtAt).toLocaleDateString()}</span>
				</div>
			</PopoverContent>
		</Popover>
	);
}
