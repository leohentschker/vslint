import * as fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_RULES,
  type ReviewRequest,
  type ReviewResponse,
  getViewportSize,
} from "@vslint/shared";
import { DEFAULT_REVIEW_ENDPOINT } from "@vslint/shared";
import { getContentHash } from "@vslint/shared";
import { getSnapshotIdentifier } from "@vslint/shared";
import { getLogger } from "@vslint/shared";
import { elementIsHTMLElement } from "@vslint/shared";
import {
  type DesignReviewMatcher,
  DesignReviewMatcherSchema,
  type DesignReviewRun,
  DesignReviewRunSchema,
  JestSnapshotDataSchema,
} from "@vslint/shared";
import axios, { type AxiosError, type AxiosResponse } from "axios";
import Json5 from "json5";

const getExistingSnapshot = (matcherContext: jest.MatcherContext) => {
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

const markSnapshotAsReviewed = (matcherContext: jest.MatcherContext) => {
  const snapshotState = matcherContext.snapshotState;
  const currentTestName = matcherContext.currentTestName;
  const count = snapshotState._counters.get(currentTestName) || 0;
  const snapshotKey = `${currentTestName} ${count + 1}`;
  snapshotState._counters.set(currentTestName, count + 1);
  snapshotState._uncheckedKeys.delete(snapshotKey);
};

global.setImmediate =
  global.setImmediate ||
  ((fn: TimerHandler, ...args: unknown[]) => global.setTimeout(fn, 0, ...args));

/**
 * Create a new jest matcher that exposes the `toPassDesignReview` method.
 * Expose this to your jest environment by running
 * expect.extend(extendExpectDesignReviewer({
 *   customStyles: ['./styles/globals.css'],
 *   model: {
 *     modelName: 'gpt-4o',
 *     key: process.env.OPENAI_API_KEY
 *   }
 * }));
 * @param {DesignReviewMatcher} args - Configuration for the design reviewer
 */
export const extendExpectDesignReviewer = (unsafeArgs: DesignReviewMatcher) => {
  const { data: args, error: extendValidationError } =
    DesignReviewMatcherSchema.safeParse(unsafeArgs);
  if (extendValidationError) {
    throw new Error(extendValidationError.message);
  }
  const {
    customStyles,
    reviewEndpoint,
    model,
    rules,
    strict: globalStrict,
  } = args;

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
      console.log("strict", strict);
      if (!elementIsHTMLElement(received)) {
        const errorMessage =
          "Received invalid value for element. Make sure that you pass a HTMLElement object into your expect call! This should look like:\nconst { container } = render(...);\nexpect(container).toPassDesignReview();";
        logger.error(errorMessage);
        return { pass: false, message: () => errorMessage };
      }

      const matcherContext = this as unknown as jest.MatcherContext;
      const existingSnapshot = getExistingSnapshot(matcherContext);

      const imageSnapshotFolder = path.join(
        path.dirname(matcherContext.snapshotState.snapshotPath),
        "vslint",
      );
      console.log("imageSnapshotFolder", imageSnapshotFolder);
      if (!fs.existsSync(imageSnapshotFolder)) {
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
