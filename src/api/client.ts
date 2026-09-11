import { isValiError } from "valibot";

import { ApiError } from "../errors.ts";
import { createClient, type Client } from "../types/nature/client/index.ts";

const baseUrl = "https://api.nature.global";

function describeApiError(error: unknown, status?: number): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.length > 0) return message;
  }
  if (typeof error === "string" && error.length > 0) return error;
  return status ? `Nature Remo API returned HTTP ${status}.` : "Nature Remo API request failed.";
}

export function createNatureClient(
  accessToken: string,
  options: { fetch?: typeof fetch } = {},
): Client {
  const client = createClient({
    auth: accessToken,
    baseUrl,
    fetch: options.fetch,
    throwOnError: true,
  });

  client.interceptors.request.use(
    (request) =>
      new Request(request, {
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
      }),
  );

  client.interceptors.error.use((error, response) => {
    if (error instanceof ApiError || isValiError(error)) return error;
    return new ApiError(describeApiError(error, response?.status), {
      cause: error,
      status: response?.status,
    });
  });

  return client;
}
