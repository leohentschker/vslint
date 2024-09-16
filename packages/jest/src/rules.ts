import type { Rule } from "./types";

export const DEFAULT_RULES: Rule[] = [
	{
		ruleid: "text-too-wide",
		description:
			"If any line of text contains more than 75 characters, mark it as true; otherwise, mark it as false.",
	},
	{
		ruleid: "text-has-typos",
		description:
			"If there are any spelling or grammatical errors, or content is in the wrong tense, mark it as true; otherwise, mark it as false. Be very harsh.",
	},
	{
		ruleid: "text-is-coherent",
		description:
			"If text for grouped elements isn't following the same grammatical style or structure, mark it as true; otherwise, mark it as false",
	},
	{
		ruleid: "text-too-small",
		description:
			"Check if the text is easily readable. If the text size is too small, mark it as true; otherwise, mark it as false.",
	},
	{
		ruleid: "hierarchy-through-font-weight",
		description:
			"Check to see if hierarchy is managed via font weight not via font size. ",
	},
];
