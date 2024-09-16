import crypto from "node:crypto";

export const kebabCase = (str: string) =>
	str
		.replace(/([a-z])([A-Z])/g, "$1-$2")
		.replace(/[\s_]+/g, "-")
		.toLowerCase();
export const getContentHash = (content: string) => {
	return crypto.createHash("sha256").update(content).digest("hex");
};
