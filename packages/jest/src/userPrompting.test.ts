import { validateViolations } from "./userPrompting";
import { acceptYesNoInput } from "./stdinUtils";
import { vi, describe, beforeEach, test, expect, Mock } from "vitest";
import type { ReviewResponse } from "@vslint/shared";

// Mocking acceptYesNoInput from inputUtils to simulate user input
vi.mock("./stdinUtils", () => ({
  acceptYesNoInput: vi.fn(),
  displayImg: vi.fn(),
}));

describe("validateViolations", () => {
  let reviewResponse: ReviewResponse;
  beforeEach(() => {
    reviewResponse = {
      violations: {
        rule1: { rule: "Rule 1 Description", fail: true },
        rule2: { rule: "Rule 2 Description", fail: false },
      },
    } as Partial<ReviewResponse> as ReviewResponse;
  });

  test("Overriding failing tests: turns a failing result into a passing result", async () => {
    (acceptYesNoInput as Mock).mockResolvedValueOnce(true);

    const result = await validateViolations(Buffer.from(""), reviewResponse);

    expect(result.violations.rule1?.fail).toBe(true);
  });

  test('Preserving failing tests: keeps a failing result when input is "n"', async () => {
    (acceptYesNoInput as Mock).mockResolvedValueOnce(false);

    const result = await validateViolations(Buffer.from(""), reviewResponse);

    expect(result.violations.rule1?.fail).toBe(false);
  });

  test("Key wrong inputs: Throws an error after 5+ invalid inputs", async () => {
    (acceptYesNoInput as Mock).mockImplementation(() => {
      throw new Error("Invalid input too many times. Please try again.");
    });

    await expect(
      validateViolations(Buffer.from(""), reviewResponse),
    ).rejects.toThrow("Invalid input too many times. Please try again.");
  });
});
