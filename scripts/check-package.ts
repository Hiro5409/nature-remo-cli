import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const tarball = process.argv[2];
if (!tarball) throw new Error("Usage: node scripts/check-package.ts <package.tgz>");
const directory = mkdtempSync(join(tmpdir(), "nature-remo-package-"));
console.log(`Checking installed package in ${directory}`);
writeFileSync(join(directory, "package.json"), '{"private":true,"type":"module"}\n');

function run(command: string, args: string[], expectedStatus = 0) {
  const result = spawnSync(command, args, {
    cwd: directory,
    encoding: "utf8",
    env: { ...process.env, NATURE_REMO_ACCESS_TOKEN: "package-smoke-token" },
    timeout: 120_000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
  return result;
}

const sourcePackage: unknown = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
assert.ok(sourcePackage && typeof sourcePackage === "object" && "devDependencies" in sourcePackage);
const dependencies = sourcePackage.devDependencies;
assert.ok(dependencies && typeof dependencies === "object" && "typescript" in dependencies);
assert.equal(typeof dependencies.typescript, "string");
run("npm", [
  "install",
  "--no-audit",
  "--no-fund",
  resolve(tarball),
  `typescript@${dependencies.typescript}`,
]);
writeFileSync(
  join(directory, "consumer.mts"),
  `
import { createNatureRemo, NatureRemoError, type Appliance, type SetAirconOptions } from "nature-remo-cli";
const remo = createNatureRemo({ accessToken: "typecheck-token" });
const appliances: Appliance[] = await remo.appliances.list();
const settings: SetAirconOptions = { target: appliances[0]?.id, temperature: "26", power: "on" };
const controlled: Appliance = await remo.aircons.set(settings);
const error = new NatureRemoError("example", { code: "API_ERROR" });
const status: number | undefined = error.status;
void controlled;
void status;
`,
);
run(join(directory, "node_modules/.bin/tsc"), [
  "--noEmit",
  "--strict",
  "--module",
  "NodeNext",
  "--target",
  "ES2024",
  "consumer.mts",
]);
const cli = join(directory, "node_modules/.bin/nature-remo");
const manifest: unknown = JSON.parse(
  readFileSync(join(directory, "node_modules/nature-remo-cli/package.json"), "utf8"),
);
assert.ok(manifest && typeof manifest === "object" && "version" in manifest);
assert.equal(run(cli, ["--version"]).stdout.trim(), manifest.version);
assert.match(run(cli, ["--help"]).stdout, /aircon/);
assert.match(run(cli, ["auth", "status"]).stdout, /NATURE_REMO_ACCESS_TOKEN/);
const invalid = run(cli, ["unknown", "--format", "json"], 2);
assert.equal(invalid.stdout, "");
assert.match(invalid.stderr, /"code": "INVALID_ARGUMENT"/);

run(process.execPath, [
  "--input-type=module",
  "-e",
  `import assert from "node:assert/strict";
   import { createNatureRemo, NatureRemoError } from "nature-remo-cli";
   const remo = createNatureRemo({
     accessToken: "package-smoke-token",
     fetch: async (input) => {
       assert.equal(input.headers.get("authorization"), "Bearer package-smoke-token");
       return Response.json([]);
     },
   });
   assert.deepEqual(await remo.appliances.list(), []);
   assert.equal(new NatureRemoError("test", {code: "API_ERROR"}).code, "API_ERROR");`,
]);

// Use an isolated credential so package checks never touch the user's Nature Remo token.
if (process.platform === "darwin") {
  run(process.execPath, [
    "--input-type=module",
    "-e",
    `import assert from "node:assert/strict";
     import { randomUUID } from "node:crypto";
     import { createRequire } from "node:module";
     const require = createRequire(import.meta.resolve("nature-remo-cli"));
     const { AsyncEntry } = require("@napi-rs/keyring");
     const entry = new AsyncEntry("io.github.Hiro5409.nature-remo-cli.package-check", randomUUID());
     try {
       await entry.setPassword("package-smoke-token");
       assert.equal(await entry.getPassword(), "package-smoke-token");
     } finally {
       await entry.deleteCredential();
     }
     assert.equal((await entry.getPassword()) ?? null, null);`,
  ]);
}

console.log("Installed CLI, client exports, and platform checks passed.");
