/**
 * Template Header
 * Purpose: Vitest configuration — runs the unit tests under tests/ in a Node
 *   environment and maps the "@" import alias to the project root.
 * Feature Unit: Shared
 * Customize: Adjust the test environment, the include glob, or the path aliases.
 * Depends on: the Vitest test runner.
 */

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
});
