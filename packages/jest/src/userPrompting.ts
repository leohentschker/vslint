/**
 * One of vslint's key assumptions is that automated design review is not perfect and
 * will have false positives. This file enables the user to inspect the test results
 * and override values as relevant.
 */
import type { ReviewResponse } from "@vslint/shared";
import { getLogger } from "./logging";
import { acceptYesNoInput, displayImg } from "./stdinUtils";

/**
 * Runs manual validation on a review response, allowing a user to override the test results
 * for any failed rules within the terminal if they are false positives.
 */
export const validateViolations = async (
  imageBuffer: Buffer,
  reviewResponse: ReviewResponse,
) => {
  try {
    await displayImg(imageBuffer);
  } catch (err) {
    getLogger().warn(`Error while displaying image: ${err}`);
  }

  const updatedReview = { ...reviewResponse };

  for (const [ruleid, violation] of Object.entries(reviewResponse.violations)) {
    if (!violation.fail) continue;
    const accepted = await acceptYesNoInput(
      `Automated review failed for rule: ${violation.rule}. Log violation and fail test?`,
    );
    if (updatedReview.violations[ruleid]) {
      updatedReview.violations[ruleid].fail = accepted;
    }
  }

  return updatedReview;
};
