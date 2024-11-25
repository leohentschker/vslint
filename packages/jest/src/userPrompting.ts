import process from "node:process";
import readline from "node:readline";
import type { ReviewResponse } from "@vslint/shared";
import { getLogger } from "./logging";

/**
 * Dumps an image to the terminal.
 */
const dumpImage = async (imageBuffer: Buffer) => {
  const terminalImage = await import("terminal-image");
  const img = await terminalImage.default.buffer(imageBuffer);
  console.log(img);
};

/**
 * Runs manual validation on a review response, allowing a user to override the test results
 * for any failed rules within the terminal if they are false positives.
 */
export const validateViolations = async (
  imageBuffer: Buffer,
  reviewResponse: ReviewResponse,
) => {
  try {
    await dumpImage(imageBuffer);
  } catch (err) {
    getLogger().warn(`Error while displaying image: ${err}`);
  }

  const acceptInput = async (rule: {
    ruleid: string;
    rule: string;
  }): Promise<boolean> => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    return new Promise((resolve, reject) => {
      let remainingFailures = 5;
      process.stdout.write(
        `\n\nAutomated review failed for rule: ${rule.ruleid}. ${rule.rule} Log violation and fail test? (Y/n): `,
      );
      process.stdin.on("keypress", (_key: string, data) => {
        const acceptedKeys = ["y", "n", "return"];
        if (!acceptedKeys.includes(data.name)) {
          console.log(`\nUnaccepted key: ${data.name}`);
          return;
        }
        const accepted = ["return", "y"].includes(data.name.toLowerCase());
        const rejected = ["n"].includes(data.name.toLowerCase());
        if (accepted) {
          rl.close();
          resolve(true);
        } else if (rejected) {
          rl.close();
          resolve(false);
        } else {
          console.log(
            `\nUnknown key: ${data.name}. Press Enter or y to accept, n to reject.`,
          );
          remainingFailures--;
          if (remainingFailures <= 0) {
            reject(
              new Error("Invalid input too many times. Please try again."),
            );
          }
        }
      });
    });
  };

  const updatedReview = { ...reviewResponse };

  for (const [ruleid, violation] of Object.entries(reviewResponse.violations)) {
    if (!violation.fail) continue;
    const accepted = await acceptInput({ ruleid, rule: violation.rule });
    if (updatedReview.violations[ruleid]) {
      updatedReview.violations[ruleid].fail = accepted;
    }
  }

  return updatedReview;
};
