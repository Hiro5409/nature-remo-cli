import { createHash } from "node:crypto";

import { http, HttpResponse } from "msw";
import { expect, test } from "vite-plus/test";

import { server } from "../src/test/server.ts";
import { releaseState } from "./release-state.ts";

const input = {
  name: "nature-remo-cli",
  version: "0.1.0",
  repository: "Hiro5409/nature-remo-cli",
  filename: "nature-remo-cli-0.1.0.tgz",
  bytes: Buffer.from("tested artifact"),
  token: "test-token",
};
const published = {
  dist: { integrity: `sha512-${createHash("sha512").update(input.bytes).digest("base64")}` },
};
const asset = {
  name: input.filename,
  digest: `sha256:${createHash("sha256").update(input.bytes).digest("hex")}`,
};

const npmUrl = "https://registry.npmjs.org/nature-remo-cli/0.1.0";
const releaseUrl = "https://api.github.com/repos/Hiro5409/nature-remo-cli/releases/tags/v0.1.0";

test.each([
  { npm: false, release: false, asset: false },
  { npm: true, release: false, asset: false },
  { npm: true, release: true, asset: false },
  { npm: true, release: true, asset: true },
])("resumes npm=$npm release=$release asset=$asset", async (state) => {
  server.use(
    http.get(npmUrl, ({ request }) => {
      expect(request.headers.has("authorization")).toBe(false);
      return state.npm ? HttpResponse.json(published) : new HttpResponse(null, { status: 404 });
    }),
    http.get(releaseUrl, ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer test-token");
      return state.release
        ? HttpResponse.json({ draft: false, assets: state.asset ? [asset] : [] })
        : new HttpResponse(null, { status: 404 });
    }),
  );
  await expect(releaseState(input)).resolves.toEqual({
    npmPublished: state.npm,
    releaseExists: state.release,
    assetExists: state.asset,
  });
});

test.each([403, 429, 500])("does not interpret HTTP %i as unpublished", async (status) => {
  server.use(http.get(npmUrl, () => new HttpResponse(null, { status })));
  await expect(releaseState(input)).rejects.toThrow(`HTTP ${status}`);
});

test("stops when an existing npm version has different contents", async () => {
  server.use(http.get(npmUrl, () => HttpResponse.json({ dist: { integrity: "different" } })));
  await expect(releaseState(input)).rejects.toThrow("Published npm artifact differs");
});

test("stops when the GitHub lookup fails after npm publication", async () => {
  server.use(
    http.get(npmUrl, () => HttpResponse.json(published)),
    http.get(releaseUrl, () => new HttpResponse(null, { status: 503 })),
  );
  await expect(releaseState(input)).rejects.toThrow("HTTP 503");
});

test("does not overwrite a different existing release asset", async () => {
  server.use(
    http.get(npmUrl, () => HttpResponse.json(published)),
    http.get(releaseUrl, () =>
      HttpResponse.json({ draft: false, assets: [{ ...asset, digest: "different" }] }),
    ),
  );
  await expect(releaseState(input)).rejects.toThrow("Existing release asset differs");
});
