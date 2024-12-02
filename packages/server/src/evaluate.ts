#!/usr/bin/env node
import * as fs from "node:fs";
import path from "node:path";
import { type Rule, RuleSchema, getLogger } from "@vslint/shared";
import arg from "arg";
import type OpenAI from "openai";
import { z } from "zod";
import { setLogLevel } from "./logger";
import { renderHtmlContent } from "./render";
import {
  getDesignReviewChatCompletion,
  getOpenaiClient,
} from "./review/openai";

const EVAL_ARGS = arg({
  "--help": Boolean,
  "--input": String,
  "--rules": String,
  "--model": String,
  "--rule": String,
  "-h": "--help",
  "--debug": Boolean,
});

const EvalSchema = z.object({
  "--input": z
    .string({
      required_error: "Directory with your design evals",
    })
    .refine((val) => fs.existsSync(val), "Directory does not exist"),
  "--rules": z
    .string({
      required_error: "Path to rules file",
    })
    .refine((val) => fs.existsSync(val), "Rules file does not exist"),
  "--rule": z.string().optional(),
  "--model": z.enum(["gpt-4o"]).optional().default("gpt-4o"),
  "--debug": z.boolean().optional().default(false),
});
type EvalArgs = z.infer<typeof EvalSchema>;

const getRenderArgs = () => {
  if (EVAL_ARGS["--help"]) {
    console.log("Usage: npx @vslint/server evaluate [options]");
    console.log("Options:");
    console.log("  --help, -h      Show help");
    console.log(
      "  --model, -m     Model to use for rendering (default: gpt-4o, can be any openai multimodal model)",
    );
    console.log("  --debug         Enable debug logging");
    console.log("  --rule          Rule ID to evaluate");
    console.log("Examples:");
    console.log(
      "  npx @vslint/server eval --input evals --model gpt-4o --rule my-rule",
    );
    process.exit(0);
  }
  const { data: evalArgs, error: parseError } = EvalSchema.safeParse(EVAL_ARGS);
  if (parseError) {
    console.error(`Failed to parse arguments: ${parseError.message} `);
    process.exit(1);
  }
  if (evalArgs["--debug"]) {
    setLogLevel("debug");
  }
  return evalArgs;
};

const loadRules = (rulesPath: string) => {
  const rules = fs.readFileSync(rulesPath, "utf8");
  try {
    return z.array(RuleSchema).parse(JSON.parse(rules));
  } catch (e) {
    console.error(`Failed to parse rules: ${e} in file ${rulesPath}`);
    process.exit(1);
  }
};

type Eval = {
  html: string;
  ruleid: string;
  pass: boolean;
  file: string;
  path: string;
  viewport: {
    width: number;
    height: number;
  };
};

type EvalMap = Record<string, { pass: Eval[]; fail: Eval[] }>;

const loadEvals = (inputDir: string, rules: Rule[]) => {
  const evals: EvalMap = {};
  for (const rule of rules) {
    const ruleDir = path.join(inputDir, rule.ruleid);
    if (!fs.existsSync(ruleDir)) {
      continue;
    }

    const ruleEvals: { pass: Eval[]; fail: Eval[] } = { pass: [], fail: [] };

    for (const evalDir of ["pass", "fail"]) {
      if (!fs.existsSync(path.join(ruleDir, evalDir))) {
        continue;
      }
      const evalFiles = fs.readdirSync(path.join(ruleDir, evalDir));
      for (const evalFile of evalFiles) {
        if (!evalFile.endsWith(".json")) {
          continue;
        }
        try {
          const evalData = JSON.parse(
            fs.readFileSync(path.join(ruleDir, evalDir, evalFile), "utf8"),
          );
          ruleEvals[evalDir as "pass" | "fail"].push({
            html: evalData.html,
            viewport: evalData.viewport,
            ruleid: rule.ruleid,
            pass: evalDir === "pass",
            file: evalFile,
            path: path.join(ruleDir, evalDir, evalFile),
          });
        } catch (e) {
          console.error(
            `Failed to parse eval: ${e} in file ${path.join(ruleDir, evalDir, evalFile)}`,
          );
          process.exit(1);
        }
      }
    }
    evals[rule.ruleid] = ruleEvals;
  }
  return evals;
};

const getChatCompletionForEval = async (
  openai: OpenAI,
  model: EvalArgs["--model"],
  rule: Rule,
  reviewEval: Eval,
) => {
  const { response: encodedImage, error: renderError } =
    await renderHtmlContent(reviewEval.html, { viewport: reviewEval.viewport });
  if (renderError) {
    console.error(`Failed to render HTML: ${renderError}`);
    process.exit(1);
  }
  const { response: reviewResponse, error: reviewError } =
    await getDesignReviewChatCompletion(
      { model: { modelName: model, key: process.env.OPENAI_API_KEY } },
      rule,
      openai,
      encodedImage.toString("base64"),
      "image/png",
    );
  if (reviewError) {
    console.error(`Failed to review HTML: ${reviewError}`);
    process.exit(1);
  }
  getLogger().debug(
    `Rule ${rule.ruleid} review. Fail: ${!reviewResponse.fail}. Eval: ${reviewEval.file}`,
  );
  return { reviewResponse, encodedImage };
};

export const runDesignEvals = async () => {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY environment variable");
    process.exit(1);
  }
  const evalArgs = getRenderArgs();

  const rules = loadRules(evalArgs["--rules"]);
  let evals = loadEvals(evalArgs["--input"], rules);

  if (evalArgs["--rule"]) {
    const rule = rules.find((r) => r.ruleid === evalArgs["--rule"]);
    if (!rule) {
      console.error(`Rule ${evalArgs["--rule"]} not found`);
      process.exit(1);
    }
    const ruleEvals = evals[rule.ruleid];
    if (!ruleEvals) {
      console.error(`Evals not found for rule ${rule.ruleid}`);
      process.exit(1);
    }
    if (!ruleEvals.pass.length && !ruleEvals.fail.length) {
      console.error(`No evals found for rule ${rule.ruleid}`);
      process.exit(1);
    }
    evals = { [rule.ruleid]: ruleEvals };
  }

  const passingEvals = [];
  const failingEvals = [];
  const { response: openai, error: openaiError } = getOpenaiClient({
    modelName: evalArgs["--model"],
    key: process.env.OPENAI_API_KEY,
  });
  if (openaiError) {
    console.error(`Failed to create OpenAI client: ${openaiError.message}`);
    process.exit(1);
  }

  for (const rule of rules) {
    const ruleEvals = evals[rule.ruleid];
    if (!ruleEvals) {
      continue;
    }
    console.log(rule.description);
    for (const passingEval of ruleEvals.pass) {
      const { reviewResponse, encodedImage } = await getChatCompletionForEval(
        openai,
        evalArgs["--model"],
        rule,
        passingEval,
      );
      if (reviewResponse.fail) {
        failingEvals.push(passingEval);
        console.log(
          `Rule ${rule.ruleid} failed: ${passingEval.file} failed when it should have passed`,
        );
        console.log(reviewResponse.explanation);
      } else {
        passingEvals.push(passingEval);
      }
    }

    for (const failingEval of ruleEvals.fail) {
      const { reviewResponse, encodedImage } = await getChatCompletionForEval(
        openai,
        evalArgs["--model"],
        rule,
        failingEval,
      );
      if (reviewResponse.fail) {
        passingEvals.push(failingEval);
      } else {
        console.log(
          `Rule ${rule.ruleid} passed: ${failingEval.file} when it should have failed`,
        );
        console.log(reviewResponse.explanation);
        failingEvals.push(failingEval);
      }
    }
  }

  console.log(
    `${passingEvals.length} passing evals: ${passingEvals.map((e) => e.file).join(", ")}`,
  );
  console.log(
    `${failingEvals.length} failing evals: ${failingEvals.map((e) => e.file).join(", ")}`,
  );
  console.log(
    `Accuracy: ${(passingEvals.length / (passingEvals.length + failingEvals.length)) * 100}%`,
  );
  process.exit(0);
};
