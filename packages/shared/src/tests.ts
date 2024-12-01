import fs from "node:fs";
import path from "node:path";
import axios, { type AxiosError, type AxiosResponse } from "axios";
import Json5 from "json5";
import { z } from "zod";
import { getContentHash, kebabCase } from "./crypto";
import { getLogger } from "./logging";
import { ModelSchema } from "./models";
import {
  DEFAULT_REVIEW_ENDPOINT,
  type DesignReviewRun,
  DesignReviewRunSchema,
  getViewportSize,
} from "./render";
import type { ReviewRequest, ReviewResponse } from "./requests";
import { DEFAULT_RULES, RuleSchema } from "./rules";

export const DesignReviewMatcherSchema = z.object({
  reviewEndpoint: z.string().optional(),
  customStyles: z.array(z.string()),
  rules: z.array(RuleSchema).optional(),
  strict: z.boolean().default(true),
  model: ModelSchema,
});
export type DesignReviewMatcher = z.input<typeof DesignReviewMatcherSchema>;
export const DEFAULT_REVIEW_TIMEOUT = 50000;

export const elementIsHTMLElement = (
  element: unknown,
): element is HTMLElement => {
  return typeof element === "object" && element !== null;
};

export const JestSnapshotDataSchema = z.object({
  contentHash: z.string(),
  failedRules: z.array(z.string()),
  pass: z.boolean(),
});

export const getSnapshotIdentifier = (
  jestState: jest.MatcherState,
  params: DesignReviewRun | undefined,
) => {
  const { currentTestName, testPath } = jestState;
  let sizeSuffix = "";
  if (params?.atSize) {
    sizeSuffix =
      typeof params.atSize === "string"
        ? params.atSize
        : `${params.atSize.width}x${params.atSize.height}`;
  }
  return kebabCase(
    `${path.basename(testPath || "")}-${currentTestName}${sizeSuffix ? `-${sizeSuffix}` : ""}`,
  );
};

export const getExistingSnapshot = (matcherContext: jest.MatcherContext) => {
  const snapshotState = matcherContext.snapshotState; // Jest's snapshot state
  const currentTestName = matcherContext.currentTestName; // Current test name
  const count = snapshotState._counters.get(currentTestName) || 0;
  const snapshotKey = `${currentTestName} ${count + 1}`;
  let snapshotData = snapshotState._snapshotData[snapshotKey];
  if (!snapshotData) {
    return null;
  }
  snapshotData = snapshotData.replace(/^\\n/, "").trim();

  let parsedJson: unknown;
  try {
    parsedJson = Json5.parse(snapshotData);
  } catch (err) {
    return null;
  }

  const { data: parsedSnapshotData, error: parseError } =
    JestSnapshotDataSchema.safeParse(parsedJson);
  if (parseError) {
    return null;
  }
  return parsedSnapshotData;
};

export const markSnapshotAsReviewed = (matcherContext: jest.MatcherContext) => {
  const snapshotState = matcherContext.snapshotState;
  const currentTestName = matcherContext.currentTestName;
  const count = snapshotState._counters.get(currentTestName) || 0;
  const snapshotKey = `${currentTestName} ${count + 1}`;
  snapshotState._counters.set(currentTestName, count + 1);
  snapshotState._uncheckedKeys.delete(snapshotKey);
};

export const parseCustomMatcherArgs = (unsafeArgs: DesignReviewMatcher) => {
  const { data: args, error: extendValidationError } =
    DesignReviewMatcherSchema.safeParse(unsafeArgs);
  if (extendValidationError) {
    throw new Error(extendValidationError.message);
  }
  const { customStyles } = args;

  for (const cssPath of customStyles) {
    if (!fs.existsSync(cssPath)) {
      throw new Error(
        `Could not find CSS file at path ${cssPath}. This file is required to correctly render your snapshots with your custom files.`,
      );
    }
  }

  const stylesheets = customStyles.map((cssPath) =>
    fs.readFileSync(cssPath, "utf8"),
  );
  return { args, stylesheets };
};

/**
 * Create a new jest-compatible matcher that exposes the `toPassDesignReview` method.
 * Different frameworks have different ways of handling snapshots, so this function
 * takes the snapshot path as an argument to make sure the snapshot is created in the
 * correct location.
 * @param {DesignReviewMatcher} args - Configuration for the design reviewer
 */
export const extendExpectDesignReviewer = (
  getSnapshotPath: (matcherContext: jest.MatcherContext) => string,
  unsafeArgs: DesignReviewMatcher,
) => {
  const { args, stylesheets } = parseCustomMatcherArgs(unsafeArgs);
  const { model, rules, reviewEndpoint, strict: globalStrict } = args;

  return {
    /**
     * Make sure that the received element in `expect(...)` is an HTMLElement
     * Run at different viewport sizes by using the `atSize` parameter
     * Debug what's happening by using the `log` parameter to set different log levels
     */
    async toPassDesignReview(
      received: unknown,
      unsafeParams?: DesignReviewRun,
    ): Promise<jest.CustomMatcherResult> {
      const { data: params, error: runValidationError } =
        DesignReviewRunSchema.safeParse(unsafeParams || {});

      if (runValidationError) {
        return {
          pass: false,
          message: () =>
            runValidationError.errors.map((e) => e.message).join("\n"),
        };
      }

      const logger = getLogger(params?.log);

      const strict = params?.strict ?? globalStrict;

      if (!elementIsHTMLElement(received)) {
        const errorMessage =
          "Received invalid value for element. Make sure that you pass a HTMLElement object into your expect call! This should look like:\nconst { container } = render(...);\nexpect(container).toPassDesignReview();";
        logger.error(errorMessage);
        return { pass: false, message: () => errorMessage };
      }

      const matcherContext = this as unknown as jest.MatcherContext;
      const existingSnapshot = getExistingSnapshot(matcherContext);

      const imageSnapshotFolder = path.join(
        path.dirname(getSnapshotPath(matcherContext)),
        "vslint",
      );

      if (!fs.existsSync(imageSnapshotFolder)) {
        logger.debug(
          `Creating image snapshot folder at ${imageSnapshotFolder}`,
        );
        fs.mkdirSync(imageSnapshotFolder, { recursive: true });
      }
      const imageSnapshotPath = path.join(
        imageSnapshotFolder,
        `${getSnapshotIdentifier(matcherContext, params)}.png`,
      );

      // skip review if the snapshot already exists and the content hash matches
      if (existingSnapshot) {
        if (
          existingSnapshot.contentHash === getContentHash(received.outerHTML)
        ) {
          markSnapshotAsReviewed(matcherContext);
          let message: string;
          if (existingSnapshot.pass) {
            message =
              "Snapshot already exists, content hash matches, and the previous review passed";
          } else if (!strict) {
            message =
              "Snapshot already exists, content hash matches, previous review failed, but strict mode is disabled";
          } else {
            message = `Review failed and strict mode is enabled. Test failed rules: ${existingSnapshot.failedRules.join(", ")}. Set strict: false to skip review for this test. You can delete the snapshot file at ${matcherContext.snapshotState._snapshotPath} to force a new review. Review the snapshot at ${imageSnapshotPath} to see what failed.`;
          }
          return {
            pass: existingSnapshot.pass || !strict,
            message: () => message,
          };
        }
      }

      if (!args.model.key) {
        throw new Error(
          "No model key provided. Make sure to set the OPENAI_API_KEY environment variable via export OPENAI_API_KEY=<your-key>.",
        );
      }

      const viewport = getViewportSize(params);
      logger.debug(`Viewport: ${JSON.stringify(viewport)}`);

      let response: AxiosResponse<ReviewResponse, ReviewRequest>;

      try {
        logger.debug("Sending request to review endpoint");
        const requestData: ReviewRequest = {
          content: received.outerHTML,
          stylesheets,
          rules: rules || DEFAULT_RULES,
          model,
          options: {
            viewport,
          },
          testDetails: {
            name: expect.getState().currentTestName || "",
          },
        };
        response = await axios.post(
          reviewEndpoint || DEFAULT_REVIEW_ENDPOINT,
          requestData,
        );
      } catch (err) {
        const axiosError = err as AxiosError;
        logger.error(
          `Error while sending request to review endpoint: ${axiosError.message}`,
        );
        console.log("axiosError", axiosError);
        return {
          pass: false,
          message: () =>
            `Error while sending request to review endpoint: ${axiosError.message}`,
        };
      }
      const { explanation, pass, violations } = response.data;
      logger.debug(
        `Review result: ${JSON.stringify(violations, null, 2)}. Explanation: ${explanation}`,
      );

      const snapshotData = {
        contentHash: getContentHash(received.outerHTML),
        pass,
        failedRules: Object.entries(violations)
          .filter(([_, rule]) => rule.fail)
          .map(([ruleName]) => ruleName),
      };

      // Use Jest's built-in snapshot functionality and directly return
      expect(snapshotData).toMatchSnapshot();
      if (!pass) {
        getLogger().error(explanation);
      }

      const imageBuffer = Buffer.from(response.data.content, "base64");
      fs.writeFileSync(imageSnapshotPath, imageBuffer);
      console.log(imageSnapshotPath);
      console.log(matcherContext.snapshotState._snapshotPath);

      return { pass: pass || !strict, message: () => explanation || "" };
    },
  };
};
