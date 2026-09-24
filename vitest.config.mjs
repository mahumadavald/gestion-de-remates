import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/__tests__/**/*.test.{js,ts}", "app/**/*.test.{js,ts}"],
    exclude: ["node_modules", ".next", ".claude"],
  },
});
