import { z } from "zod";

export const RuleSchema = z.object({
  ruleid: z.string().min(1).max(100),
  description: z
    .string()
    .min(10)
    .max(1000)
    .refine((val) => {
      if (!val.includes("mark it as true")) return false;
      if (!val.includes("mark it as false")) return false;
      return true;
    }, 'Rule must contain the phrase "mark it as true" as well as the phrase "mark it as false"'),
});
export type Rule = z.infer<typeof RuleSchema>;

export const DEFAULT_RULES: Rule[] = [
  {
    ruleid: "text-too-wide",
    description:
      "First write out how many words are on each line of text. If a single line of text, as it appears between line breaks (aka newlines), contains more than 30 words, excluding spaces and punctuation, mark it as true and explain which line is too long; otherwise, mark it as false.",
  },
  {
    ruleid: "bad-gray-colors",
    description:
      "First note the font weights of each line of text outside of an input element. This rule does not apply to fonts with different weights and it does not apply to text inside of input elements. IGNORE INPUT PLACEHOLDERS AND OTHER INPUT ELEMENTS. Gray text with the same font weight should have the same color. THIS ONLY APPLIES IF THE COLORS ARE REALLY REALLY DIFFERENT. If text components have really different shades of gray for the same font weight, mark it as true; otherwise, mark it as false.",
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
      "This rule only applies to forms with >1 rows. If there is one row return false. Look at the last row of forms and count the number of components. If there is only one component on the last row, it should take up the full width. However, if there are two or more components on the last row, they can be half-width or appropriately distributed. If there is just one component on the last row and it doesn't take up the full width, mark it as true; otherwise, mark it as false.",
  },
  {
    ruleid: "minimal-forms",
    description:
      "This rule only applies to forms with >2 elements. Forms should not use too many full width components and should instead collapse them into one row of two half-width components. If there are back to back full width components in your form, mark it as true; otherwise mark it as false.",
  },
  {
    ruleid: "no-bad-copy",
    description:
      "Copy should look generally professional, not be repetitive, and should have no typos and no glaring errors. If the product copy is not good, mark it as true; otherwise mark it as false.",
  },
  {
    ruleid: "no-default-checkboxes",
    description:
      "Default checkboxes look bad. If you're using the default input html checkbox, use a radio group or a card instead. If there is a default checkbox, mark it as true; otherwise mark it as false.",
  },
  {
    ruleid: "no-unclear-labels",
    description:
      "This rule is only applicable to forms. Form labels should use general language that is easy to understand and isn't specific to the product. If the label says things that are product-specific and wouldn't be clear to a general user, mark it as true; otherwise, mark it as false.",
  },
  {
    ruleid: "no-unconstrained-width",
    description:
      "First note how many pixels wide the screen is, assuming a DPI of 72. If the screen is less than 1440px wide, this rule does not apply and return false. Otherwise, content should generally not be the full screen width at very large screen sizes and should instead be constrained on a max width. If content in a full page layout stretches very wide on large screens, mark it as true; otherwise mark it as false.",
  },
];
