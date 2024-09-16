import { expect, test } from "vitest";
import { kebabCase } from "./helpers";

test("kebabCase", () => {
	expect(kebabCase("helloWorld")).toBe("hello-world");
	expect(kebabCase("helloWorldAgain")).toBe("hello-world-again");
	expect(kebabCase("helloWorldAgainAndAgain")).toBe(
		"hello-world-again-and-again",
	);
});
