import { type ChildProcess, exec, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const GIT_DIFF_PREFIX_LINES = 5;
const TMP_FILE_1 = "temp1";
const TMP_FILE_2 = "temp2";

/**
 * Uses the native git diff command to compare two HTML strings.
 */
export const diffChanges = async (
  file1: string,
  file2: string,
): Promise<string | null> => {
  const tmpDirectory = os.tmpdir();
  const tempFilePath1 = path.join(tmpDirectory, TMP_FILE_1);
  const tempFilePath2 = path.join(tmpDirectory, TMP_FILE_2);

  fs.writeFileSync(tempFilePath1, `${file1}\n`);
  fs.writeFileSync(tempFilePath2, `${file2}\n`);

  await new Promise((resolve, reject) => {
    exec("git --version", (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });

  let gitDiff: ChildProcess;
  try {
    gitDiff = spawn("git", [
      "diff",
      "--no-index",
      "--color",
      tempFilePath1,
      tempFilePath2,
    ]);
  } catch (error) {
    return null;
  }

  return new Promise((resolve, reject) => {
    let output = "";
    let errorOutput = "";

    gitDiff.stdout?.on("data", (data) => {
      output += data.toString();
    });

    gitDiff.stderr?.on("data", (data) => {
      errorOutput += data.toString();
    });

    gitDiff.on("close", (code) => {
      try {
        fs.unlinkSync(tempFilePath1);
        fs.unlinkSync(tempFilePath2);
      } catch (error) {
        console.error("Error deleting temporary files:", error);
      }
      if (code === 1) {
        resolve(output.split("\n").slice(GIT_DIFF_PREFIX_LINES).join("\n"));
      } else if (code === 0) {
        resolve(null);
      } else {
        reject(`git diff exited with code ${code}: ${errorOutput}`);
      }
    });
  });
};
