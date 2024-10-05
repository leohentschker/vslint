#!/usr/bin/env node
import {
  DEFAULT_RULES,
  RenderSizeSchema,
  getViewportSize,
} from "@vslint/shared";
import arg from "arg";
import chalk from "chalk";
import { z } from "zod";
import { getLogger, setLogLevel } from "./logger";
import { getHtmlFromURL, renderHtmlContent } from "./render";
import { runReview } from "./review";

const EVAL_ARGS = arg({
  "--help": Boolean,
  "--input": String,
  "--format": String,
  "--viewport": String,
  "--model": String,
  "--debug": Boolean,
  "-h": "--help",
  "-i": "--input",
  "-v": "--viewport",
});

const EvalSchema = z.object({
  "--input": z
    .string({
      required_error:
        "Specify a URL to evaluate. For example to evaluate Kayak.com add --input https://www.kayak.com to your command.",
    })
    .refine((val) => val.startsWith("http")),
  "--viewport": RenderSizeSchema.optional().default("full-screen"),
  "--model": z.enum(["gpt-4o"]).optional().default("gpt-4o"),
  "--debug": z.boolean().optional().default(false),
});

const getRenderArgs = () => {
  if (EVAL_ARGS["--help"]) {
    console.log(chalk.green("Usage: npx @vslint/server evaluate [options]"));
    console.log(chalk.green("Options:"));
    console.log(chalk.green("  --help, -h      Show help"));
    console.log(chalk.green("  --input, -i     Input HTML string or URL"));
    console.log(chalk.green("  --viewport, -v  Viewport for rendering"));
    console.log(
      chalk.green(
        "  --model, -m     Model to use for rendering (default: gpt-4o, can be any openai multimodal model)",
      ),
    );
    console.log(chalk.green("  --debug         Enable debug logging"));
    console.log(chalk.green("Examples:"));
    console.log(
      chalk.green(
        "  npx @vslint/server evaluate --input https://www.expedia.com --format markdown",
      ),
    );
    console.log(
      chalk.green(
        "  npx @vslint/server evaluate --input https://www.kayak.com --format json",
      ),
    );
    process.exit(0);
  }
  const { data: evalArgs, error: parseError } = EvalSchema.safeParse(EVAL_ARGS);
  if (parseError) {
    console.error(chalk.red("Failed to parse arguments: ${parseError.message"));
    process.exit(1);
  }
  if (evalArgs["--debug"]) {
    setLogLevel("debug");
  }
  return evalArgs;
};

const runEval = async () => {
  getLogger().warn(
    "This command is experimental, does not really work, and may change in the future.",
  );

  if (!process.env.OPENAI_API_KEY) {
    console.error(chalk.red("Missing OPENAI_API_KEY environment variable"));
    process.exit(1);
  }
  const evalArgs = getRenderArgs();

  getLogger().info(`Evaluating URL: ${evalArgs["--input"]}`);
  const { response: html, error: scrapeError } = await getHtmlFromURL(
    evalArgs["--input"],
  );
  if (scrapeError) {
    console.error(chalk.red("Failed to scrape URL: ${scrapeError.message}"));
    process.exit(1);
  }
  const { response: imageBuffer, error: renderError } = await renderHtmlContent(
    html,
    {
      viewport: getViewportSize({ atSize: evalArgs["--viewport"] }),
    },
  );
  if (renderError) {
    console.error(chalk.red("Failed to render content: ${renderError.message"));
    process.exit(1);
  }

  getLogger().info("Running automated design review...");
  const { response: reviewResponse, error: reviewError } = await runReview(
    {
      model: {
        modelName: evalArgs["--model"],
        key: process.env.OPENAI_API_KEY,
      },
      rules: DEFAULT_RULES,
    },
    imageBuffer,
    "image/png",
  );
  if (reviewError) {
    console.error(
      chalk.red(
        `Failed to run automated design review: ${reviewError.message}`,
      ),
    );
    process.exit(1);
  }
  process.stdout.write("\n");
  process.stdout.write(reviewResponse.explanation);
  process.stdout.write("\n");
  process.exit(0);
};

runEval();
