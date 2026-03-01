import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    treeshake: true,
    shims: true,
    minify: true,
    target: "node18",
    outDir: "dist",
  },
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: true,
    treeshake: true,
    shims: true,
    minify: true,
    target: "node18",
    outDir: "dist",
  },
]);
