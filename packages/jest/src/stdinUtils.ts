import process from "node:process";
import readline from "node:readline";

/**
 * Prompts the user to accept or reject a yes/no question and returns a boolean
 */
export const acceptYesNoInput = async (message: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  return new Promise((resolve, reject) => {
    let remainingFailures = 5;
    process.stdout.write(`\n\n${message} (Y/n): `);
    process.stdin.on("keypress", (_key: string, data) => {
      const acceptedKeys = ["y", "n", "return"];
      if (!acceptedKeys.includes(data.name)) {
        console.log(`\nUnaccepted key: ${data.name}`);
        return;
      }
      const accepted = ["return", "y"].includes(data.name.toLowerCase());
      const rejected = ["n"].includes(data.name.toLowerCase());
      if (accepted) {
        rl.close();
        resolve(true);
      } else if (rejected) {
        rl.close();
        resolve(false);
      } else {
        console.log(
          `\nUnknown key: ${data.name}. Press Enter or y to accept, n to reject.`,
        );
        remainingFailures--;
        if (remainingFailures <= 0) {
          reject(new Error("Invalid input too many times. Please try again."));
        }
      }
    });
  });
};

/**
 * Displays an image to the user
 */
export const displayImg = async (imageBuffer: Buffer) => {
  const terminalImage = await import("terminal-image");
  const img = await terminalImage.default.buffer(imageBuffer);
  console.log(img);
};
