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
  ],
});
