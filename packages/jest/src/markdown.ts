import path from "node:path";
import type { ReviewResponse } from "@vslint/shared";

export const reviewResponseToMarkdown = (
	response: ReviewResponse,
	imageSnapshotPath: string,
) => {
	const passedRules = Object.entries(response.violations).filter(
		(v) => !v[1].fail,
	);
	const failedRules = Object.entries(response.violations).filter(
		(v) => v[1].fail,
	);
	return `
# ${response.name}
**Pass:** \`${response.pass}\`
**Content Hash:** \`${response.contentHash}\`
**Viewport:** \`${response.viewport.width}\`x\`${response.viewport.height}\`

![${response.name}](${path.basename(imageSnapshotPath)})

## Review
${response.explanation}

### Failed Rules
${failedRules.map(([rule, violation]) => `- ${rule} - ${violation.rule}`).join("\n")}

### Passed Rules
${passedRules.map(([rule, violation]) => `- ${rule} - ${violation.rule}`).join("\n")}
`.trim();
};

export const markdownToReviewResponse = (
	markdown: string,
): Omit<ReviewResponse, "content"> => {
	const lines = markdown.split("\n");
	const name = lines
		.find((line) => line.startsWith("# "))
		?.replace("# ", "")
		.trim();

	const contentHash = lines
		.find((line) => line.startsWith("**Content Hash:**"))
		?.replace("**Content Hash:** ", "")
		.replace(/\`/g, "")
		.trim();

	const failedRulesStartIndex = lines.findIndex((line) =>
		line.startsWith("### Failed Rules"),
	);
	const passedRulesStartIndex = lines.findIndex((line) =>
		line.startsWith("### Passed Rules"),
	);

	const failedRulesLines = lines
		.slice(failedRulesStartIndex + 1, passedRulesStartIndex)
		.filter((line) => line.trim());
	const passedRulesLines = lines
		.slice(passedRulesStartIndex + 1)
		.filter((line) => line.trim());

	const failedRules = failedRulesLines
		.map((line) => line.replace("- ", "").trim().split(" - "))
		.map(([ruleid, ...ruleInfo]) => ({
			ruleid: ruleid as string,
			rule: ruleInfo.join(" - "),
			pass: false,
		}));
	const passedRules = passedRulesLines
		.map((line) => line.replace("- ", "").trim().split(" - "))
		.map(([ruleid, ...ruleInfo]) => ({
			ruleid: ruleid as string,
			rule: ruleInfo.join(" - "),
			pass: true,
		}));

	const viewportString = lines
		.find((line) => line.startsWith("**Viewport:** "))
		?.replace("**Viewport:** ", "")
		.replace(/\`/g, "")
		.trim()
		.split("x")
		.map(Number);
	const viewport: ReviewResponse["viewport"] = viewportString
		? {
				width: viewportString[0] as number,
				height: viewportString[1] as number,
			}
		: { width: 0, height: 0 };
	const pass =
		lines
			.find((line) => line.startsWith("**Pass:**"))
			?.replace("**Pass:** ", "")
			.replace(/\`/g, "")
			.trim() === "true";
	const violations: ReviewResponse["violations"] = {};
	for (const rule of passedRules) {
		violations[rule.ruleid] = {
			...violations[rule.ruleid],
			fail: false,
			rule: rule.rule,
		};
	}
	for (const rule of failedRules) {
		violations[rule.ruleid] = {
			...violations[rule.ruleid],
			fail: true,
			rule: rule.rule,
		};
	}

	const reviewStartIndex = lines.findIndex((line) =>
		line.startsWith("## Review"),
	);
	const failedRulesStart = lines.findIndex((line) =>
		line.startsWith("### Failed Rules"),
	);
	const explanation = lines
		.slice(reviewStartIndex + 1, failedRulesStart)
		.join("\n")
		.trim();

	return {
		name: name ?? "",
		contentHash: contentHash ?? "",
		explanation: explanation ?? "",
		violations,
		viewport,
		pass,
	};
};
