import crypto from "node:crypto";

export const kebabCase = (str: string) =>
  str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
export const getContentHash = (content: string) => {
  return crypto.createHash("md5").update(content).digest("hex");
};
