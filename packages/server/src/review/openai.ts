import {
  Failure,
  Ok,
  type ReviewRequest,
  type ReviewResponse,
  type Rule,
} from "@vslint/shared";
import OpenAI from "openai";
import { z } from "zod";
import { getLogger } from "../logger";
import { renderHtmlContent } from "../render";

const OpenaiResponseSchema = z.object({
  explanation: z.string().optional(),
  fail: z.boolean(),
});

export const getOpenaiClient = (modelConfig: ReviewRequest["model"]) => {
  if (!modelConfig.key) return Failure(new Error("OPENAI_API_KEY not set"));
  return Ok(new OpenAI({ apiKey: modelConfig.key }));
};

const BASE_OPENAI_SYSTEM_PROMPT = `
You are an AI assistant working as a senior designer to reviews website components and provide feedback on their design.

You take two inputs:
1. Rule: The rule to evaluate the component against.
2. Image: A screenshot of the component in Chrome.

You need to evaluate the component against the rule and provide feedback on the design to be run in a CI pipeline.

YOU ARE A SENIOR DESIGNER THAT CARES A LOT ABOUT DESIGN QUALITY AND DOES NOT MISS ANY DETAIL. WHEN YOU GIVE FEEDBACK IT SHOULD BE VERY DETAILED AND INCLUDE EXPLANATIONS IN THE CONTEXT OF THE SPECIFIC HTML PASSED IN.
`.trim();

export const getDesignReviewChatCompletion = async (
  reviewRequest: Pick<ReviewRequest, "model">,
  rule: Rule,
  openai: OpenAI,
  base64image: string,
  mimeType: string,
) => {
  let completion: OpenAI.Chat.ChatCompletion;
  try {
    let rulePrompt = `${BASE_OPENAI_SYSTEM_PROMPT}\n\nReturn in JSON format: { explanation: string; fail: boolean; }.\n\nHere is the rule you are evaluating:\n## ${rule.ruleid}\n${rule.description}`;
    getLogger().debug("Creating OpenAI chat completion");
    const failingExamples = rule.samples?.filter((sample) => sample.fail) || [];
    const passingExamples =
      rule.samples?.filter((sample) => !sample.fail) || [];

    if (failingExamples.length && passingExamples.length) {
      rulePrompt +=
        "\n\nThe user will also provide you with examples of designs that pass and fail the rule.";
    } else if (failingExamples.length) {
      rulePrompt +=
        "\n\nThe user will provide you with examples of designs that fail the rule.";
    } else if (passingExamples.length) {
      rulePrompt +=
        "\n\nThe user will provide you with examples of designs that pass the rule.";
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: rulePrompt,
          },
        ],
      },
    ];

    if (failingExamples.length) {
      const failingContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
        [
          {
            type: "text",
            text: "Here are examples of designs that when rendered fail the rule",
          },
        ];
      const failingImageSampleRenders = await Promise.all(
        failingExamples.map(async (sample) => {
          const { response: renderResponse, error: renderError } =
            await renderHtmlContent(sample.html, { viewport: sample.viewport });
          if (renderError) {
            getLogger().error(renderError);
            return Failure(renderError);
          }
          return Ok({
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${renderResponse?.toString("base64")}`,
            },
          } as OpenAI.Chat.Completions.ChatCompletionContentPart);
        }),
      );
      for (const failingImageSampleRender of failingImageSampleRenders) {
        if (failingImageSampleRender.error) {
          getLogger().error(failingImageSampleRender.error);
          return Failure(failingImageSampleRender.error);
        }
        failingContent.push(failingImageSampleRender.response);
      }
      messages.push({
        role: "user",
        content: failingContent,
      });
    }

    if (passingExamples.length) {
      const passingContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
        [
          {
            type: "text",
            text: "Here are examples of designs that when rendered pass the rule",
          },
        ];
      const passingImageSampleRenders = await Promise.all(
        passingExamples.map(async (sample) => {
          const { response: renderResponse, error: renderError } =
            await renderHtmlContent(sample.html, { viewport: sample.viewport });
          if (renderError) {
            getLogger().error(renderError);
            return Failure(renderError);
          }
          return Ok({
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${renderResponse?.toString("base64")}`,
            },
          } as OpenAI.Chat.Completions.ChatCompletionContentPart);
        }),
      );
      for (const passingImageSampleRender of passingImageSampleRenders) {
        if (passingImageSampleRender.error) {
          getLogger().error(passingImageSampleRender.error);
          return Failure(passingImageSampleRender.error);
        }
        passingContent.push(passingImageSampleRender.response);
      }
      messages.push({
        role: "user",
        content: passingContent,
      });
    }

    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: "Here is the design you are reviewing",
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64image}`,
          },
        },
      ],
    });

    completion = await openai.chat.completions.create({
      model: reviewRequest.model.modelName,
      response_format: {
        type: "json_object",
      },
      temperature: 0,
      seed: 42,
      messages,
    });
  } catch (error) {
    getLogger().error(error);
    return Failure(error);
  }
  const result = completion.choices[0]?.message.content;
  if (!result) return Failure(new Error("No result from OpenAI"));
  const parsedResult = OpenaiResponseSchema.safeParse(JSON.parse(result));
  if (!parsedResult.success) {
    getLogger().error(parsedResult.error);
    return Failure(new Error("Failed to parse OpenAI response"));
  }
  return Ok({
    ...parsedResult.data,
    rule,
  });
};

export const runOpenaiReview = async (
  renderRequest: Pick<ReviewRequest, "model" | "rules">,
  imageBuffer: Buffer,
  mimeType: "image/png",
) => {
  const base64Content = imageBuffer.toString("base64");
  const { response: openai, error: clientError } = getOpenaiClient(
    renderRequest.model,
  );
  if (clientError) return Failure(clientError);

  const completionResults = await Promise.all(
    renderRequest.rules.map(async (rule) => {
      const { response: result, error: openaiError } =
        await getDesignReviewChatCompletion(
          renderRequest,
          rule,
          openai,
          base64Content,
          mimeType,
        );
      if (openaiError) return Failure(openaiError);
      return Ok(result);
    }),
  );

  const violations: ReviewResponse["violations"] = {};
  const failedExplanations = [];
  for (const {
    response: completion,
    error: completionError,
  } of completionResults) {
    if (completionError) return Failure(completionError);
    const {
      explanation: failExplanation,
      fail,
      rule: { ruleid, description: rule },
    } = completion;
    if (fail && failExplanation) {
      failedExplanations.push(failExplanation);
    }
    violations[ruleid] = { fail, rule };
  }
  const explanation = failedExplanations.length
    ? failedExplanations.join("\n\n")
    : "Design review passed.";

  getLogger().debug(`OpenAI response: ${JSON.stringify(violations)}`);
  getLogger().debug(`OpenAI explanation: ${explanation}`);
  return Ok({ violations, explanation });
};
