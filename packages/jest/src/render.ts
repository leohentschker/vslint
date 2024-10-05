export const elementIsHTMLElement = (
  element: unknown,
): element is HTMLElement => {
  return typeof element === "object" && element !== null;
};
