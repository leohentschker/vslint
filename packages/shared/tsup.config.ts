import * as fs from "node:fs";
import path from "node:path";
import { defineConfig } from "tsup";
const packageDir = path.resolve(__dirname);
const srcDir = path.join(packageDir, "src");
const distDir = path.join(packageDir, "dist");

export default defineConfig({
  entry: [path.join(srcDir, "index.ts")],
  format: ["cjs", "esm"],
  dts: true,
  outDir: distDir,
  clean: true,
  onSuccess: async () => {
    const jsonFile = path.join(srcDir, "rules.json");
    const jsonDest = path.join(distDir, "rules.json");
    fs.copyFileSync(jsonFile, jsonDest);
  },
});
