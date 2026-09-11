import { isCancel, password } from "@clack/prompts";
import { define } from "gunshi";

import { deleteAccessToken, resolveAccessToken, saveAccessToken } from "../config/access-token.ts";
import { CliError } from "../errors.ts";

function requireKeychainPlatform(): void {
  if (process.platform !== "darwin") {
    throw new CliError("Keychain authentication requires macOS.", {
      code: "INVALID_ARGUMENT",
      exitCode: 2,
      hint: "Set or unset NATURE_REMO_ACCESS_TOKEN in your shell instead.",
    });
  }
}

const loginCommand = define({
  name: "login",
  description: "Save an access token to macOS Keychain",
  run: async () => {
    requireKeychainPlatform();
    let accessToken = process.env.NATURE_REMO_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        throw new CliError("Interactive login requires a terminal.", {
          code: "AUTH_REQUIRED",
          exitCode: 2,
          hint: "Set NATURE_REMO_ACCESS_TOKEN when running without a terminal.",
        });
      }

      const result = await password({
        message: "Nature Remo access token:",
        validate: (value) => (value?.trim() ? undefined : "Access token is required."),
      });
      if (isCancel(result)) return "Authentication cancelled.";
      accessToken = result;
    }

    await saveAccessToken(accessToken);
    return "Access token saved to macOS Keychain.";
  },
});

const statusCommand = define({
  name: "status",
  description: "Show the active authentication source",
  run: async () => {
    const { source } = await resolveAccessToken();
    return source === "environment"
      ? "Access token configured via NATURE_REMO_ACCESS_TOKEN."
      : "Access token configured via macOS Keychain.";
  },
});

const logoutCommand = define({
  name: "logout",
  description: "Remove the access token from macOS Keychain",
  run: async () => {
    requireKeychainPlatform();
    const deleted = await deleteAccessToken();
    const result = deleted
      ? "Access token removed from macOS Keychain."
      : "No Keychain token found.";
    return process.env.NATURE_REMO_ACCESS_TOKEN?.trim()
      ? `${result}\nNATURE_REMO_ACCESS_TOKEN remains active in the current shell.`
      : result;
  },
});

export const authCommand = define({
  name: "auth",
  description: "Manage Nature Remo authentication",
  run: () => 'Run "nature-remo auth --help" for usage information.',
  subCommands: {
    login: loginCommand,
    logout: logoutCommand,
    status: statusCommand,
  },
});
