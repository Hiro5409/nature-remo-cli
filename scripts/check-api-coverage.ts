import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const schemaPath = fileURLToPath(new URL("../openapi/nature-api.json", import.meta.url));
const coveragePath = fileURLToPath(new URL("../openapi/coverage.json", import.meta.url));
const httpMethods = new Set(["delete", "get", "head", "options", "patch", "post", "put"]);

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
}

const schema: unknown = JSON.parse(await readFile(schemaPath, "utf8"));
assertObject(schema, "OpenAPI schema");
const paths = schema.paths;
assertObject(paths, "OpenAPI paths");
const operations = new Set<string>();
for (const [path, pathValue] of Object.entries(paths)) {
  assertObject(pathValue, `OpenAPI path ${path}`);
  for (const method of Object.keys(pathValue)) {
    if (httpMethods.has(method)) operations.add(`${method.toUpperCase()} ${path}`);
  }
}

const coverage: unknown = JSON.parse(await readFile(coveragePath, "utf8"));
assertObject(coverage, "API coverage");
const missing = [...operations].filter((operation) => !(operation in coverage));
const unknown = Object.keys(coverage).filter((operation) => !operations.has(operation));
const invalid = Object.entries(coverage).flatMap(([operation, entryValue]) => {
  assertObject(entryValue, `Coverage entry ${operation}`);
  const status = entryValue.status;
  if (status !== "implemented" && status !== "planned" && status !== "excluded") {
    return [`${operation} has invalid status: ${String(status)}`];
  }
  if (status === "excluded" && typeof entryValue.reason !== "string") {
    return [`${operation} is excluded without a reason`];
  }
  return [];
});

const problems = [
  ...missing.map((operation) => `Unclassified OpenAPI operation: ${operation}`),
  ...unknown.map((operation) => `Unknown coverage operation: ${operation}`),
  ...invalid,
];
if (problems.length > 0) throw new Error(problems.join("\n"));

const implemented = Object.values(coverage).filter((entry) => {
  assertObject(entry, "Coverage entry");
  return entry.status === "implemented";
}).length;
console.log(
  `OpenAPI coverage classified: ${operations.size} operations, ${implemented} implemented.`,
);
