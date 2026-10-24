import type { RangeTuple } from "fuse.js";

import { createContext, useContext } from "react";

import type { Highlights, SearchKey } from "#/lib/search";

export const HighlightsContext = createContext<Highlights | undefined>(
	undefined,
);

/** a field of a row with its search matches marked */
export function Highlight({
	field,
	id,
	text,
}: {
	field: SearchKey;
	id: string;
	text: string;
}) {
	const ranges = useContext(HighlightsContext)?.get(id)?.[field];
	if (!ranges?.length) return text;

	return <Marked ranges={ranges} text={text} />;
}

function Marked({
	ranges,
	text,
}: {
	ranges: readonly RangeTuple[];
	text: string;
}) {
	const parts: React.ReactNode[] = [];
	let cursor = 0;
	for (const [start, end] of ranges) {
		if (start > cursor) parts.push(text.slice(cursor, start));
		parts.push(
			<mark className="rounded-[2px] bg-yellow-400/25 text-inherit" key={start}>
				{text.slice(start, end + 1)}
			</mark>,
		);
		cursor = end + 1;
	}
	if (cursor < text.length) parts.push(text.slice(cursor));

	return parts;
}
