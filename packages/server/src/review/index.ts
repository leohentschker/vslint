import type { ReviewRequest } from "@vslint/shared";
import { runGeminiReview } from "./gemini";
import { runOpenaiReview } from "./openai";

const GEMINI_MODELS = ["gemini-1.5-flash"];

export const runReview = async (
  renderRequest: ReviewRequest,
  imageBuffer: Buffer,
  mimeType: "image/png",
) => {
  if (GEMINI_MODELS.includes(renderRequest.model.modelName))
    return runGeminiReview(renderRequest, imageBuffer, mimeType);

  return runOpenaiReview(renderRequest, imageBuffer, mimeType);
};
