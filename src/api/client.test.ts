import { afterEach, expect, test, vi } from "vite-plus/test";

import { createNatureRemo } from "../index.ts";

afterEach(() => vi.restoreAllMocks());

test.each(["headers", "body"])("aborts a stalled response %s without retrying", async (stage) => {
  const controller = new AbortController();
  const timeoutError = new DOMException("Request timed out", "TimeoutError");
  const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
  const fetchMock: typeof fetch = vi.fn(async (input) => {
    const { signal } = new Request(input);
    if (stage === "headers") {
      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(timeoutError), { once: true });
        controller.abort(timeoutError);
      });
    }
    return new Response(
      new ReadableStream({
        start(stream) {
          signal.addEventListener("abort", () => stream.error(signal.reason), { once: true });
        },
        pull() {
          controller.abort(timeoutError);
        },
      }),
      { headers: { "content-type": "application/json" } },
    );
  });
  const remo = createNatureRemo({ accessToken: "test-token", fetch: fetchMock });

  await expect(remo.appliances.list()).rejects.toMatchObject({ code: "API_ERROR" });
  expect(timeout).toHaveBeenCalledExactlyOnceWith(30_000);
  expect(fetchMock).toHaveBeenCalledOnce();
});

test("starts a fresh deadline for each request", async () => {
  const first = new AbortController();
  const second = new AbortController();
  vi.spyOn(AbortSignal, "timeout")
    .mockReturnValueOnce(first.signal)
    .mockReturnValueOnce(second.signal);
  const remo = createNatureRemo({
    accessToken: "test-token",
    fetch: async (input) => {
      expect(new Request(input).signal.aborted).toBe(false);
      return Response.json([]);
    },
  });

  await remo.appliances.list();
  first.abort();
  await expect(remo.appliances.list()).resolves.toEqual([]);
});
