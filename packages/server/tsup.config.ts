import path from "node:path";
import { defineConfig } from "tsup";

const packageDir = path.resolve(__dirname);
const srcDir = path.join(packageDir, "src");
const distDir = path.join(packageDir, "dist");

export default defineConfig({
  entry: [
    path.join(srcDir, "index.ts"),
    path.join(srcDir, "app.ts"),
    path.join(srcDir, "evaluate.ts"),
  ],
  format: ["cjs", "esm"],
  dts: true,
  outDir: distDir,
  clean: true,
});
