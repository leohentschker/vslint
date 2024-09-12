import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: ["packages/jest/src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  outDir: "packages/jest/dist",
  clean: true,
});
