// Renders the open graph card into `public/og.png` with takumi, from the
// snapshot so the counts and rows match what the site shows. Runs after the
// snapshot before `build`.

import type { IconifyJSON } from "@iconify/types";
import type { CSSProperties, ReactNode } from "react";

import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { render } from "takumi-js";

import type { Snapshot } from "../src/lib/snapshot";

import { type Framework, registries, type Registry } from "../src/registries";

const require = createRequire(import.meta.url);
const ROOT = path.join(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/og.png");
const WIDTH = 1200;
const HEIGHT = 630;

// the dark theme tokens from `src/styles.css`, as hex for the renderer
const COLOR = {
	background: "#121419",
	border: "#2a2d36",
	card: "#181a20",
	foreground: "#e6e8ee",
	muted: "#9a9ea9",
	primary: "#e6e8ee",
	row: "#1f2229",
};
const MONO = "JetBrains Mono";

const snapshot = JSON.parse(
	await readFile(path.join(ROOT, "public/data/registries.json"), "utf8"),
) as Snapshot;
const all = registries as readonly Registry[];
// unique names per registry, like the table, which drops duplicate entries
const componentCount = Object.values(snapshot.registries).reduce(
	(sum, registry) =>
		sum + new Set(registry.items.map((item) => item.name)).size,
	0,
);

async function dataUri(file: string, type: string) {
	try {
		const bytes = await readFile(file);
		return `data:${type};base64,${bytes.toString("base64")}`;
	} catch {
		return;
	}
}

/** an iconify icon as an svg data uri, `currentColor` swapped for `color` */
async function icon(pack: string, name: string, color = COLOR.muted) {
	const json = JSON.parse(
		await readFile(require.resolve(`@iconify-json/${pack}/icons.json`), "utf8"),
	) as IconifyJSON;
	const data = json.icons[name];
	if (!data) throw new Error(`no ${pack}:${name}`);
	const width = data.width ?? json.width ?? 16;
	const height = data.height ?? json.height ?? 16;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${data.body.replaceAll("currentColor", color)}</svg>`;
	return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const FRAMEWORK_ICONS: Record<Framework, [string, string]> = {
	react: ["logos", "react"],
	"react-native": ["logos", "react"],
	svelte: ["logos", "svelte-icon"],
	templ: ["logos", "go"],
	vue: ["logos", "vue"],
};
const frameworkIcon = (framework: Framework) =>
	icon(...FRAMEWORK_ICONS[framework]);

// the site's own mark, `public/logo.svg`
const logo = await dataUri(path.join(ROOT, "public/logo.svg"), "image/svg+xml");
// downloaded by `pnpm snapshot`, which runs first
const avatar = await dataUri(
	path.join(ROOT, "public/avatar.jpg"),
	"image/jpeg",
);
const search = await icon("lucide", "search");

// the preview card: a few real groups with their first two components
const PREVIEW = ["animate ui", "more shadcn", "shadcn-vue"];
const groups = await Promise.all(
	PREVIEW.flatMap((name) => {
		const registry = all.find((r) => r.name === name);
		const items = snapshot.registries[name]?.items ?? [];
		if (!registry || items.length === 0) return [];
		return [
			frameworkIcon(registry.framework).then((source) => ({
				count: items.length,
				icon: source,
				items: items.slice(0, 2),
				name,
			})),
		];
	}),
);

const pill = (children: ReactNode, style?: CSSProperties) => (
	<div
		style={{
			alignItems: "center",
			border: `1px solid ${COLOR.border}`,
			borderRadius: 10,
			display: "flex",
			gap: 10,
			...style,
		}}
	>
		{children}
	</div>
);

const frameworks: Framework[] = ["react", "svelte", "vue"];
const frameworkPills = await Promise.all(
	frameworks.map(async (framework) => ({
		framework,
		src: await frameworkIcon(framework),
	})),
);
const otherFrameworks =
	new Set(all.map((r) => r.framework)).size - frameworks.length;

const card = (
	<div
		style={{
			backgroundColor: COLOR.background,
			// a faint dot grid behind everything
			backgroundImage: `radial-gradient(circle, ${COLOR.border} 1px, transparent 1px)`,
			backgroundSize: "24px 24px",
			color: COLOR.foreground,
			display: "flex",
			fontFamily: MONO,
			height: "100%",
			position: "relative",
			width: "100%",
		}}
	>
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				padding: "56px 0 56px 64px",
				width: 640,
			}}
		>
			<div style={{ alignItems: "center", display: "flex", gap: 16 }}>
				{logo && (
					<img
						alt=""
						height={44}
						src={logo}
						style={{ borderRadius: 10 }}
						width={44}
					/>
				)}
				<span style={{ fontSize: 30, fontWeight: 700 }}>shadcnview</span>
			</div>

			<div style={{ display: "flex", flexDirection: "column" }}>
				<span
					style={{
						fontFamily: "Geist",
						fontSize: 72,
						fontWeight: 700,
						letterSpacing: -3,
						lineHeight: 1,
					}}
				>
					Every shadcn
				</span>
				<span
					style={{
						fontFamily: "Geist",
						fontSize: 72,
						fontWeight: 700,
						letterSpacing: -3,
						lineHeight: 1.05,
					}}
				>
					registry.
				</span>
				<span
					style={{
						color: COLOR.primary,
						fontFamily: "Geist",
						fontSize: 72,
						fontWeight: 700,
						letterSpacing: -3,
						lineHeight: 1.05,
					}}
				>
					One table.
				</span>
				<span
					style={{
						color: COLOR.muted,
						fontSize: 22,
						lineHeight: 1.5,
						marginTop: 28,
					}}
				>
					{`Search, filter and copy-add components from ${all.length} registries.`}
				</span>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
				<div style={{ display: "flex", gap: 12 }}>
					{frameworkPills.map(({ framework, src }) =>
						pill(
							<>
								<img alt="" height={24} src={src} width={24} />
								<span style={{ fontSize: 22 }}>{framework}</span>
							</>,
							{ padding: "10px 16px" },
						),
					)}
					{otherFrameworks > 0 &&
						pill(
							<span style={{ color: COLOR.muted, fontSize: 22 }}>
								{`+${otherFrameworks}`}
							</span>,
							{ padding: "10px 16px" },
						)}
				</div>
				<div style={{ alignItems: "center", display: "flex", gap: 14 }}>
					{avatar && (
						<img
							alt=""
							height={44}
							src={avatar}
							style={{
								border: `2px solid ${COLOR.primary}`,
								borderRadius: 999,
							}}
							width={44}
						/>
					)}
					<span style={{ color: COLOR.muted, fontSize: 22 }}>built by</span>
					<span style={{ fontSize: 22, fontWeight: 700 }}>@stephansama</span>
				</div>
			</div>
		</div>

		{/* a slice of the table, running off the right edge */}
		<div
			style={{
				backgroundColor: COLOR.card,
				border: `1px solid ${COLOR.border}`,
				borderBottomLeftRadius: 18,
				borderRight: "none",
				borderTopLeftRadius: 18,
				display: "flex",
				flexDirection: "column",
				left: 700,
				overflow: "hidden",
				position: "absolute",
				right: 0,
				top: 72,
			}}
		>
			<div
				style={{
					alignItems: "center",
					borderBottom: `1px solid ${COLOR.border}`,
					color: COLOR.muted,
					display: "flex",
					fontSize: 18,
					gap: 12,
					padding: "20px 22px",
				}}
			>
				<img alt="" height={20} src={search} width={20} />
				{`search ${componentCount.toLocaleString("en-US")} components…`}
			</div>
			{groups.map((group) => (
				<div
					key={group.name}
					style={{ display: "flex", flexDirection: "column" }}
				>
					<div
						style={{
							alignItems: "center",
							borderBottom: `1px solid ${COLOR.border}`,
							display: "flex",
							fontSize: 18,
							fontWeight: 700,
							gap: 12,
							padding: "14px 22px",
						}}
					>
						{group.name}
						{pill(
							<span
								style={{ color: COLOR.muted, fontSize: 14, fontWeight: 400 }}
							>
								{String(group.count)}
							</span>,
							{ borderRadius: 6, padding: "1px 8px" },
						)}
						<img alt="" height={20} src={group.icon} width={20} />
					</div>
					{group.items.map((item, index) => {
						const type = item.type.replace("registry:", "");
						const highlighted = group === groups[0] && index === 0;
						return (
							<div
								key={item.name}
								style={{
									alignItems: "center",
									backgroundColor: highlighted ? COLOR.row : "transparent",
									borderBottom: `1px solid ${COLOR.border}`,
									display: "flex",
									fontSize: 18,
									justifyContent: "space-between",
									padding: "13px 22px 13px 44px",
								}}
							>
								<span style={{ fontWeight: highlighted ? 700 : 400 }}>
									{item.name}
								</span>
								{pill(
									<span
										style={{
											color: type === "block" ? COLOR.primary : COLOR.muted,
											fontSize: 14,
										}}
									>
										{type}
									</span>,
									{
										borderColor:
											type === "block" ? COLOR.primary : COLOR.border,
										borderRadius: 6,
										padding: "1px 8px",
									},
								)}
							</div>
						);
					})}
				</div>
			))}
		</div>

		<div
			style={{
				backgroundColor: COLOR.primary,
				bottom: 0,
				height: 8,
				left: 0,
				position: "absolute",
				right: 0,
			}}
		/>
	</div>
);

const fontDirectory = path.dirname(
	require.resolve("@fontsource-variable/jetbrains-mono/package.json"),
);
const png = await render(card, {
	fonts: [
		{
			data: await readFile(
				path.join(
					fontDirectory,
					"files/jetbrains-mono-latin-wght-normal.woff2",
				),
			),
			name: MONO,
		},
	],
	height: HEIGHT,
	width: WIDTH,
});

await writeFile(OUT, png);

// the logo as a png for ios home screens, which ignore svg icons
await writeFile(
	path.join(ROOT, "public/apple-touch-icon.png"),
	await render(
		<img
			alt=""
			height={180}
			src={logo}
			style={{ display: "block" }}
			width={180}
		/>,
		{ height: 180, width: 180 },
	),
);
console.log(
	`wrote public/og.png (${WIDTH}x${HEIGHT}, ${componentCount} components) and public/apple-touch-icon.png`,
);
