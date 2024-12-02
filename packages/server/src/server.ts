import crypto from "node:crypto";
import { ReviewRequestSchema, type ReviewResponse } from "@vslint/shared";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { getLogger, setLogLevel } from "./logger";
import { getHtmlAndRender } from "./render";
import { runReview } from "./review";

const port = process.env.PORT || 8080;
const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

app.post("/api/v1/design-review", async (req, res) => {
  setLogLevel("debug");
  getLogger().info("Initiating request...");
  const {
    success: parseSuccess,
    data: reviewRequest,
    error: parseError,
  } = ReviewRequestSchema.safeParse(req.body);
  if (!parseSuccess) {
    getLogger().error(`Failed to parse request: ${parseError.message}`);
    return res.status(400).json({
      error: "Invalid request",
      message: parseError.message,
    });
  }
  const { response: renderResponse, error: renderError } =
    await getHtmlAndRender(reviewRequest);
  if (renderError) {
    getLogger().error(`Failed to render container ${renderError}`);
    return res.status(500).json({
      error: "Failed to render",
      message: renderError.message,
    });
  }

  const { response: reviewResponse, error: reviewError } = await runReview(
    reviewRequest,
    renderResponse,
    "image/png",
  );
  if (reviewError) {
    getLogger().error(`Failed to run automated design review: ${reviewError}`);
    return res.status(500).json({
      error: "Failed to review",
      message: reviewError.message,
    });
  }
  const content = Buffer.from(renderResponse).toString("base64");
  const pass = Object.values(reviewResponse.violations).every(
    (violation) => !violation.fail,
  );
  const response: ReviewResponse = {
    ...reviewResponse,
    content,
    viewport: reviewRequest.options.viewport,
    name: reviewRequest.testDetails.name,
    contentHash: crypto
      .createHash("md5")
      .update(reviewRequest.content)
      .digest("hex"),
    pass,
  };
  res.json(response);
});

const startServer = () => {
  return app.listen(port, () => {
    getLogger().info(`Listening on port ${port}`);
  });
};

export { startServer };
