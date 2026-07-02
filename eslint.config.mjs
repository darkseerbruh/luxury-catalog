import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone Remotion project with its own package.json/tsconfig; its deps
    // aren't installed in every checkout, so root lint/tsc both skip it
    // (tsconfig.json excludes it for the same reason).
    "tools/video-pipeline/**",
  ]),
  // Seed/import scripts ingest untyped CSV and JSON, where pinpoint `any` is
  // pragmatic. These are build-time Node scripts, not shipped app code.
  {
    files: ["supabase/seed/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
