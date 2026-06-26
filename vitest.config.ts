import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The "server-only"/"client-only" marker packages only exist inside the
      // Next.js bundler. Stub them so node-based unit tests can import modules
      // that use them as a build-time guard (e.g. src/lib/supabase/admin.ts).
      "server-only": fileURLToPath(new URL("./src/test/empty-module.ts", import.meta.url)),
      "client-only": fileURLToPath(new URL("./src/test/empty-module.ts", import.meta.url)),
    },
  },
  test: {
    // Only the pure-logic unit tests. These import no-DB core modules, so they
    // never touch Supabase / next/headers — they run in plain node.
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
