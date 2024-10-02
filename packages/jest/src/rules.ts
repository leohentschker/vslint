import type { Rule } from "@vslint/shared";
export const DEFAULT_RULES: Rule[] = [
	{
		ruleid: "text-too-wide",
		description:
			"First write out how many characters are on each line of text. If a single line of text, as it appears between line breaks (aka newlines), contains more than 75 characters, excluding spaces and punctuation, mark it as true and explain which line is too long; otherwise, mark it as false.",
	},
	{
		ruleid: "bad-gray-text",
		description:
			"Gray text components should have the same color. This does not apply to placeholders or labels. If text components have different shades of gray, mark it as true; otherwise, mark it as false.",
	},
	{
		ruleid: "missing-placeholders",
		description:
			"Form components with text inputs should have placeholders on all items in their empty state. If there are no placeholders, mark it as true; otherwise, mark it as false",
	},
	{
		ruleid: "duplicative-copy",
		description:
			"Titles and subtitle should have meaningfully differentiated copy; subtitles shouldn't just restate the title with more words. If the subtitle restates the title with more words, mark it as true; otherwise mark it as false.",
	},
	{
		ruleid: "no-half-width-forms",
		description:
			"Look at the last row of forms and count the number of components. If there is only one component on the last row, it should take up the full width. However, if there are two or more components on the last row, they can be half-width or appropriately distributed. If there is just one component on the last row and it doesn't take up the full width, mark it as true; otherwise, mark it as false.",
	},
	{
		ruleid: "minimal-forms",
		description:
			"Forms should not use too many full width components and should instead collapse them into one row of two half-width components. If there are back to back full width components in your form, mark it as true; otherwise mark it as false.",
	},
	{
		ruleid: "no-bad-copy",
		description:
			"Copy should look professional, not be repetitive, and be at a high quality. It should have no typos or glaring errors. If the product copy is not good, mark it as true; otherwise mark it as false.",
	},
	{
		ruleid: "no-default-checkboxes",
		description:
			"Default checkboxes look bad. If you're using the default input html checkbox, use a radio group or a card instead. If there is a default checkbox, mark it as true; otherwise mark it as false.",
	},
	{
		ruleid: "no-unclear-labels",
		description:
			"Labels should use general language that is easy to understand and isn't specific to the product. If the label says things that are product-specific and wouldn't be clear to a general user, mark it as true; otherwise, mark it as false.",
	},
	{
		ruleid: "no-unconstrained-width",
		description:
			"Content should generally not be the full screen width at very large screen sizes and should instead be constrained on a max width. This only applies for full page layouts. If content in a full page layout stretches very wide on large screens, mark it as true; otherwise mark it as false.",
	},
];
