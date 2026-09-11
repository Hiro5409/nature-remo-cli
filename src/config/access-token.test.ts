import { describe, expect, test, vi } from "vite-plus/test";

import { CliError } from "../errors.ts";
import { deleteAccessToken, resolveAccessToken, saveAccessToken } from "./access-token.ts";

function tokenStore(accessToken?: string) {
  return {
    delete: vi.fn(async () => accessToken !== undefined),
    get: vi.fn(async () => accessToken),
    set: vi.fn(async (_value: string) => undefined),
  };
}

describe("access token", () => {
  test("prefers the environment without reading Keychain", async () => {
    const store = tokenStore("keychain-token");

    await expect(
      resolveAccessToken({
        env: { NATURE_REMO_ACCESS_TOKEN: " environment-token " },
        store,
      }),
    ).resolves.toEqual({ source: "environment", token: "environment-token" });
    expect(store.get).not.toHaveBeenCalled();
  });

  test("uses Keychain when the environment is empty", async () => {
    const store = tokenStore(" keychain-token ");

    await expect(resolveAccessToken({ env: {}, store })).resolves.toEqual({
      source: "keychain",
      token: "keychain-token",
    });
  });

  test("reports missing authentication without exposing storage details", async () => {
    const store = tokenStore();

    await expect(resolveAccessToken({ env: {}, store })).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
      exitCode: 2,
    });
  });

  test("does not silently treat a Keychain failure as a missing token", async () => {
    const store = tokenStore();
    store.get.mockRejectedValue(new Error("locked"));

    await expect(resolveAccessToken({ env: {}, store })).rejects.toMatchObject({
      code: "CREDENTIAL_STORE_ERROR",
      cause: expect.any(Error),
    });
  });

  test("normalizes a token before saving it", async () => {
    const store = tokenStore();

    await saveAccessToken(" saved-token ", store);

    expect(store.set).toHaveBeenCalledWith("saved-token");
  });

  test("rejects an empty token before touching Keychain", async () => {
    const store = tokenStore();

    await expect(saveAccessToken("  ", store)).rejects.toBeInstanceOf(CliError);
    expect(store.set).not.toHaveBeenCalled();
  });

  test("returns whether a stored token was removed", async () => {
    const store = tokenStore("stored-token");

    await expect(deleteAccessToken(store)).resolves.toBe(true);
  });
});
