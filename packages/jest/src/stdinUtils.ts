import { confirm } from "@inquirer/prompts";

/**
 * Prompts the user to accept or reject a yes/no question and returns a boolean
 */
export const acceptYesNoInput = async (message: string): Promise<boolean> => {
  const answer = await confirm({
    message: "Accept review?",
    default: true,
    theme: {
      prefix: message,
    },
  });
  return answer;
};

/**
 * Displays an image to the user
 */
export const displayImg = async (imageBuffer: Buffer) => {
  const terminalImage = await import("terminal-image");
  const img = await terminalImage.default.buffer(imageBuffer);
  console.log(img);
};
