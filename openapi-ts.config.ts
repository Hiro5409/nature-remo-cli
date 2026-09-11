import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./openapi/nature-api.json",
  output: {
    path: "src/types/nature",
    postProcess: ["oxfmt"],
  },
  plugins: [
    "@hey-api/typescript",
    { name: "@hey-api/client-fetch", throwOnError: true },
    { name: "valibot", responses: true },
    { name: "@hey-api/sdk", validator: { request: false, response: true } },
  ],
});
