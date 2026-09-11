import { CliError } from "../errors.ts";

const KEYCHAIN_SERVICE = "io.github.Hiro5409.nature-remo-cli";
const KEYCHAIN_ACCOUNT = "default";

type AccessTokenStore = {
  delete: () => Promise<boolean>;
  get: () => Promise<string | undefined>;
  set: (accessToken: string) => Promise<void>;
};

type AccessTokenOptions = {
  env?: Record<string, string | undefined>;
  store?: AccessTokenStore;
};

type ResolvedAccessToken = {
  source: "environment" | "keychain";
  token: string;
};

async function keychainEntry() {
  if (process.platform !== "darwin") {
    throw new Error("The system credential store is only supported on macOS.");
  }
  const { AsyncEntry } = await import("@napi-rs/keyring");
  return new AsyncEntry(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
}

const systemStore: AccessTokenStore = {
  delete: async () => (await keychainEntry()).deleteCredential(),
  get: async () => (await keychainEntry()).getPassword(),
  set: async (accessToken) => (await keychainEntry()).setPassword(accessToken),
};

function credentialStoreError(operation: string, cause: unknown): CliError {
  return new CliError(`Could not ${operation} the access token in macOS Keychain.`, {
    cause,
    code: "CREDENTIAL_STORE_ERROR",
    hint: "Unlock macOS Keychain and retry, or use NATURE_REMO_ACCESS_TOKEN.",
  });
}

export async function resolveAccessToken(
  options: AccessTokenOptions = {},
): Promise<ResolvedAccessToken> {
  const env = options.env ?? process.env;
  const environmentToken = env.NATURE_REMO_ACCESS_TOKEN?.trim();
  if (environmentToken) return { source: "environment", token: environmentToken };

  if (process.platform === "darwin" || options.store) {
    try {
      const keychainToken = (await (options.store ?? systemStore).get())?.trim();
      if (keychainToken) return { source: "keychain", token: keychainToken };
    } catch (error) {
      throw credentialStoreError("read", error);
    }
  }

  throw new CliError("No Nature Remo access token is configured.", {
    code: "AUTH_REQUIRED",
    exitCode: 2,
    hint: "Set NATURE_REMO_ACCESS_TOKEN. On macOS, run nature-remo auth login to save it to Keychain.",
  });
}

export async function saveAccessToken(
  accessToken: string,
  store: AccessTokenStore = systemStore,
): Promise<void> {
  const normalized = accessToken.trim();
  if (!normalized) {
    throw new CliError("NATURE_REMO_ACCESS_TOKEN is not set.", {
      code: "AUTH_REQUIRED",
      exitCode: 2,
      hint: "Set NATURE_REMO_ACCESS_TOKEN for this command, then retry.",
    });
  }

  try {
    await store.set(normalized);
  } catch (error) {
    throw credentialStoreError("save", error);
  }
}

export async function deleteAccessToken(store: AccessTokenStore = systemStore): Promise<boolean> {
  try {
    return await store.delete();
  } catch (error) {
    throw credentialStoreError("delete", error);
  }
}
