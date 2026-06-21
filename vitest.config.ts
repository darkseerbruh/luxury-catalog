import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Only the pure-logic unit tests. These import no-DB core modules, so they
    // never touch Supabase / next/headers — they run in plain node.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
