import axios, { type AxiosError, type AxiosResponse } from "axios";
import { Logger } from "winston";
import { z } from "zod";
import { getLogger } from "./logging";
import type { ReviewRequest, ReviewResponse, Viewport } from "./requests";

export const RenderSizeSchema = z.union([
  z.enum([
    "full-screen",
    "mobile",
    "tablet",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "fit",
  ]),
  z.object({
    width: z.number(),
    height: z.number(),
  }),
]);

export const DesignReviewRunSchema = z.object({
  strict: z.boolean().default(true),
  atSize: RenderSizeSchema.optional().default("fit"),
  log: z
    .union([
      z.enum(["debug", "info", "warning", "error"]),
      z.instanceof(Logger),
    ])
    .optional(),
});
export type DesignReviewRun = z.input<typeof DesignReviewRunSchema>;

export const getViewportSize = (params: DesignReviewRun): Viewport => {
  if (params.atSize === "fit" || !params.atSize) {
    return "fit";
  }
  if (params.atSize === "full-screen") {
    return {
      width: 1920,
      height: 1080,
    };
  }
  if (params.atSize === "mobile") {
    return {
      width: 375,
      height: 812,
    };
  }
  if (params.atSize === "tablet") {
    return {
      width: 768,
      height: 1024,
    };
  }
  if (params.atSize === "xs") {
    return {
      width: 320,
      height: 568,
    };
  }
  if (params.atSize === "sm") {
    return {
      width: 640,
      height: 480,
    };
  }
  if (params.atSize === "md") {
    return {
      width: 768,
      height: 1024,
    };
  }
  if (params.atSize === "lg") {
    return {
      width: 1024,
      height: 768,
    };
  }
  if (params.atSize === "xl") {
    return {
      width: 1280,
      height: 1024,
    };
  }
  if (params.atSize === "2xl") {
    return {
      width: 1536,
      height: 1024,
    };
  }
  if (params.atSize === "3xl") {
    return {
      width: 1920,
      height: 1080,
    };
  }
  return params.atSize;
};
export const DEFAULT_REVIEW_ENDPOINT =
  "https://vslint-644118703752.us-central1.run.app/api/v1/design-review";
export const DEFAULT_LOCAL_REVIEW_ENDPOINT =
  "http://localhost:8080/api/v1/design-review";

export type Renderer = (
  reviewEndpoint: string,
  requestData: ReviewRequest,
) => Promise<ReviewResponse>;
export const defaultRenderer: Renderer = async (
  reviewEndpoint: string,
  requestData: ReviewRequest,
): Promise<ReviewResponse> => {
  let response: AxiosResponse<ReviewResponse, ReviewRequest>;

  try {
    getLogger().debug("Sending request to review endpoint");
    response = await axios.post(
      reviewEndpoint || DEFAULT_REVIEW_ENDPOINT,
      requestData,
    );
    return response.data;
  } catch (err) {
    const axiosError = err as AxiosError;
    getLogger().error(
      `Error while sending request to review endpoint: ${axiosError.message}`,
    );
    throw new Error(
      `Error while sending request to review endpoint: ${axiosError.message}`,
    );
  }
};
