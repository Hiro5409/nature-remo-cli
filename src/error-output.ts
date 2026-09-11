import { CliError, type CliErrorCode, NatureRemoError } from "./errors.ts";
import type { OutputFormat } from "./output.ts";
import { terminalSafe } from "./terminal.ts";

function details(error: unknown): {
  code: CliErrorCode;
  exitCode: number;
  hint?: string;
  message: string;
} {
  if (error instanceof AggregateError) {
    const message = error.errors
      .map((item) => (item instanceof Error ? item.message : String(item)))
      .filter(Boolean)
      .join("; ");
    return {
      code: "INVALID_ARGUMENT",
      exitCode: 2,
      message: message || "Invalid command arguments.",
    };
  }
  if (error instanceof NatureRemoError) {
    switch (error.code) {
      case "INVALID_ARGUMENT":
        return {
          code: error.code,
          exitCode: 2,
          message: error.message,
        };
      case "UNAUTHORIZED":
        return {
          code: error.code,
          exitCode: 2,
          hint: "Set NATURE_REMO_ACCESS_TOKEN to a new token. On macOS, run nature-remo auth login to save it to Keychain.",
          message: error.message,
        };
      case "FORBIDDEN":
        return {
          code: error.code,
          exitCode: 3,
          hint: "Use a token with the scope required by this command.",
          message: error.message,
        };
      case "RATE_LIMITED":
        return {
          code: error.code,
          exitCode: 4,
          hint: "Wait before retrying the same command.",
          message: error.message,
        };
      case "INVALID_RESPONSE":
        return {
          code: error.code,
          exitCode: 1,
          hint: "Update nature-remo-cli. If the problem persists, report the response shape.",
          message: error.message,
        };
      case "API_ERROR":
        return {
          code: error.code,
          exitCode: 1,
          hint: "Check the network and Nature Remo service status. A control request may have taken effect; inspect the appliance before retrying.",
          message: error.message,
        };
    }
  }
  if (error instanceof CliError) {
    return {
      code: error.code,
      exitCode: error.exitCode,
      hint: error.hint,
      message: error.message,
    };
  }
  return {
    code: "UNEXPECTED",
    exitCode: 1,
    message: error instanceof Error ? error.message : String(error),
  };
}

export function formatFromArgv(argv: string[]): OutputFormat {
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--format" || arg === "-f") return argv[index + 1] === "json" ? "json" : "table";
    if (arg?.startsWith("--format="))
      return arg.slice("--format=".length) === "json" ? "json" : "table";
  }
  return "table";
}

export function printError(error: unknown, format: OutputFormat): number {
  const value = details(error);
  if (format === "json") {
    console.error(JSON.stringify({ error: value }, null, 2));
  } else {
    console.error(`${value.code}: ${terminalSafe(value.message)}`);
    if (value.hint) console.error(`Hint: ${terminalSafe(value.hint)}`);
  }
  return value.exitCode;
}
