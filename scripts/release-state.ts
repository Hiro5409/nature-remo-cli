import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { basename } from "node:path";

function record(value: unknown): asserts value is Record<string, unknown> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), "Invalid metadata");
}

async function metadata(url: string, token?: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(30_000),
  });
  if (response.status === 404) return undefined;
  assert.ok(response.ok, `Metadata lookup failed: HTTP ${response.status} from ${url}`);
  return response.json();
}

export async function releaseState(input: {
  name: string;
  version: string;
  repository: string;
  filename: string;
  bytes: Uint8Array;
  token: string;
}): Promise<{ npmPublished: boolean; releaseExists: boolean; assetExists: boolean }> {
  const published = await metadata(
    `https://registry.npmjs.org/${encodeURIComponent(input.name)}/${encodeURIComponent(input.version)}`,
  );
  if (published !== undefined) {
    record(published);
    record(published.dist);
    const integrity = `sha512-${createHash("sha512").update(input.bytes).digest("base64")}`;
    assert.equal(
      published.dist.integrity,
      integrity,
      "Published npm artifact differs from the tested artifact",
    );
  }

  const release = await metadata(
    `https://api.github.com/repos/${input.repository}/releases/tags/v${encodeURIComponent(input.version)}`,
    input.token,
  );
  let assetExists = false;
  if (release !== undefined) {
    record(release);
    assert.equal(release.draft, false, "The existing release is a draft");
    assert.ok(Array.isArray(release.assets), "Invalid release assets");
    for (const asset of release.assets) {
      record(asset);
      if (asset.name !== input.filename) continue;
      const digest = `sha256:${createHash("sha256").update(input.bytes).digest("hex")}`;
      assert.equal(asset.digest, digest, "Existing release asset differs from the tested artifact");
      assetExists = true;
    }
  }
  return {
    npmPublished: published !== undefined,
    releaseExists: release !== undefined,
    assetExists,
  };
}

if (import.meta.main) {
  const tarball = process.argv[2];
  assert.ok(tarball, "Usage: node scripts/release-state.ts <package.tgz>");
  const pkg: unknown = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8"),
  );
  record(pkg);
  assert.ok(typeof pkg.name === "string" && typeof pkg.version === "string");
  assert.equal(
    process.env.GITHUB_REF_NAME,
    `v${pkg.version}`,
    "Tag does not match package version",
  );
  const { GITHUB_REPOSITORY: repository, GH_TOKEN: token, GITHUB_OUTPUT: output } = process.env;
  assert.ok(repository && token && output, "GitHub release environment is required");
  const state = await releaseState({
    name: pkg.name,
    version: pkg.version,
    repository,
    filename: basename(tarball),
    bytes: readFileSync(tarball),
    token,
  });
  for (const [key, value] of Object.entries(state)) appendFileSync(output, `${key}=${value}\n`);
}
