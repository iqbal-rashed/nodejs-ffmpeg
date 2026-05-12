import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    treeshake: true,
    shims: true,
    minify: true,
    target: "node18",
    outDir: "dist",
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : ".cjs",
      };
    },
  },
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: true,
    treeshake: true,
    shims: true,
    minify: true,
    target: "node18",
    outDir: "dist",
    outExtension({ format }) {
      return {
        js: format === "esm" ? ".mjs" : ".cjs",
      };
    },
  },
]);
