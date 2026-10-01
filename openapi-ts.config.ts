import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi/nature-api.json",
  output: {
    entryFile: false,
    path: "src/types/nature",
    postProcess: [{ command: "vp", args: ["fmt", "{{path}}"] }],
  },
  plugins: [
    "@hey-api/typescript",
    { name: "@hey-api/client-fetch", throwOnError: true },
    { name: "valibot", requests: false },
    { name: "@hey-api/sdk", validator: { request: false, response: true } },
    // Without baseUrl the handlers match any origin, so a request to the wrong host would pass.
    { name: "msw", baseUrl: "https://api.nature.global" },
  ],
});
