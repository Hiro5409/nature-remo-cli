import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, test, vi } from "vite-plus/test";

import { main } from "./cli.ts";
import { server } from "./test/server.ts";

const authMocks = vi.hoisted(() => ({
  cancelSymbol: Symbol("cancel"),
  password: vi.fn(),
  setPassword: vi.fn(),
}));

vi.mock("@clack/prompts", () => ({
  isCancel: (value: unknown) => value === authMocks.cancelSymbol,
  password: authMocks.password,
}));

vi.mock("@napi-rs/keyring", () => ({
  AsyncEntry: class {
    async deleteCredential() {
      return false;
    }

    async getPassword() {
      return undefined;
    }

    async setPassword(accessToken: string) {
      authMocks.setPassword(accessToken);
    }
  },
}));

afterEach(() => {
  authMocks.password.mockReset();
  authMocks.setPassword.mockReset();
  Reflect.deleteProperty(process.stdin, "isTTY");
  Reflect.deleteProperty(process.stdout, "isTTY");
  vi.unstubAllGlobals();
});

function setInteractiveTerminal(interactive: boolean): void {
  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: interactive });
  Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: interactive });
}

const remo = {
  created_at: "2026-09-02T00:00:00Z",
  firmware_version: "Nature-2W3/2.2.0",
  humidity_offset: 0,
  id: "device-1",
  mac_address: "00:00:00:00:00:00",
  name: "Remo Lapis",
  newest_events: {},
  online: true,
  serial_number: "serial",
  temperature_offset: 0,
  updated_at: "2026-09-02T00:00:00Z",
};

const signal = { id: "signal-1", image: "ico_io", name: "Power" };
const signalAppliance = {
  id: "appliance-1",
  image: "ico_io",
  model: null,
  nickname: "Living room",
  signals: [signal],
  type: "IR",
};
const airconAppliance = {
  aircon: {
    range: {
      fixedButtons: ["power-off"],
      modes: {
        cool: {
          dir: ["swing"],
          dirh: [""],
          temp: ["26", "26.5"],
          vol: ["auto"],
        },
      },
    },
    tempUnit: "c",
  },
  id: "aircon-1",
  image: "ico_ac_1",
  model: null,
  nickname: "Living room air conditioner",
  settings: {
    button: "",
    dir: "swing",
    dirh: "",
    mode: "cool",
    temp: "26",
    temp_unit: "c",
    updated_at: "2026-09-03T00:00:00Z",
    vol: "auto",
  },
  signals: [],
  type: "AC",
};

async function runCli(
  args: string[],
  accessToken = "",
): Promise<{ error?: unknown; exitCode?: number; stderr: string; stdout: string }> {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const log = vi.spyOn(console, "log").mockImplementation((value) => stdout.push(String(value)));
  const logError = vi
    .spyOn(console, "error")
    .mockImplementation((value) => stderr.push(String(value)));
  vi.stubEnv("NATURE_REMO_ACCESS_TOKEN", accessToken);

  try {
    const exitCode = await main(args);
    return { exitCode, stderr: stderr.join("\n"), stdout: stdout.join("\n") };
  } catch (error) {
    return { error, stderr: stderr.join("\n"), stdout: stdout.join("\n") };
  } finally {
    log.mockRestore();
    logError.mockRestore();
    vi.unstubAllEnvs();
  }
}

describe("nature-remo CLI", () => {
  test("sanitizes API-controlled text before writing it to the terminal", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json({ message: "bad\u001B[31m\nspoof" }, { status: 500 }),
      ),
    );

    const result = await runCli(["appliance", "list"], "test-token");

    expect(result).toMatchObject({ exitCode: 1, stdout: "" });
    expect(result.stderr).not.toContain("\u001B");
    expect(result.stderr).toContain("API_ERROR: bad spoof\nHint:");
  });

  test("maps a rejected access token to a stable CLI error", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
      ),
    );

    const result = await runCli(["appliance", "list", "--format", "json"], "invalid-token");

    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: {
        code: "UNAUTHORIZED",
        exitCode: 2,
        hint: expect.any(String),
      },
    });
  });

  test.each([
    { status: 403, code: "FORBIDDEN", exitCode: 3 },
    { status: 429, code: "RATE_LIMITED", exitCode: 4 },
  ])("reports HTTP $status as $code with exit $exitCode", async ({ status, code, exitCode }) => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json({ message: "Rejected" }, { status }),
      ),
    );
    const result = await runCli(["appliance", "list", "--format", "json"], "test-token");
    expect(result).toMatchObject({ exitCode, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({ error: { code, exitCode } });
  });

  test("does not suggest retrying an invalid API response", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json({ unexpected: true }),
      ),
    );

    const result = await runCli(["appliance", "list", "--format", "json"], "test-token");

    expect(result).toMatchObject({ exitCode: 1, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: {
        code: "INVALID_RESPONSE",
        hint: "Update nature-remo-cli. If the problem persists, report the response shape.",
      },
    });
  });

  test("leaves a failed infrared request unretried and explains its uncertain outcome", async () => {
    const send = vi.fn(() => HttpResponse.error());
    server.use(http.post("https://api.nature.global/1/signals/signal-1/send", send));

    const result = await runCli(
      ["signal", "send", "--signal-id", "signal-1", "--format", "json"],
      "test-token",
    );

    expect(result).toMatchObject({ exitCode: 1, stdout: "" });
    expect(send).toHaveBeenCalledOnce();
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: {
        code: "API_ERROR",
        hint: expect.stringContaining("inspect the appliance before retrying"),
      },
    });
  });

  test("advertises output format only on the list command", async () => {
    const root = await runCli(["--help"]);
    const list = await runCli(["appliance", "list", "--help"]);

    expect(root.exitCode).toBe(0);
    expect(root.stdout).not.toContain("--format");
    expect(list.exitCode).toBe(0);
    expect(list.stdout).toContain("--format");
  });

  test("reports an unknown command as a JSON argument error", async () => {
    const result = await runCli(["unknown", "--format", "json"]);

    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: { code: "INVALID_ARGUMENT", exitCode: 2 },
    });
  });

  test("uses the argument-error exit code for an unknown command", async () => {
    const result = await runCli(["unknown"]);

    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(result.stderr).toBe("INVALID_ARGUMENT: Command not found: unknown");
  });

  test("reports an invalid output format once on stderr", async () => {
    const result = await runCli(["appliance", "list", "--format", "xml"]);

    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(result.stderr).toContain("INVALID_ARGUMENT:");
    expect(result.stderr).toContain("--format");
  });

  test("shows the nested appliance command", async () => {
    const result = await runCli(["appliance", "--help"]);
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("list");
  });

  test("shows the air conditioner commands", async () => {
    const result = await runCli(["aircon", "--help"]);
    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
    expect(result.stdout).toContain("list");
    expect(result.stdout).toContain("off");
    expect(result.stdout).toContain("set");
  });

  test("rejects a missing option value before authentication", async () => {
    const result = await runCli(["aircon", "set", "--temperature"]);

    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(result.stderr).toContain("INVALID_ARGUMENT:");
    expect(result.stderr).toContain("--temperature");
  });

  test("reports an accepted air conditioner request without claiming confirmation", async () => {
    const updated = {
      ...airconAppliance,
      settings: { ...airconAppliance.settings, temp: "26.5" },
    };
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([airconAppliance]),
      ),
      http.post("https://api.nature.global/2/appliances/aircon-1/aircon_settings", () =>
        HttpResponse.json(updated),
      ),
    );

    const result = await runCli(
      ["aircon", "set", "--temperature", "26.5", "--format", "json"],
      "test-token",
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(result.stdout)).toEqual({
      accepted: true,
      appliance: updated,
      confirmed: false,
    });
  });

  test("shows the Remo read and configuration commands", async () => {
    const result = await runCli(["remo", "--help"]);
    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
    expect(result.stdout).toContain("appliances");
    expect(result.stdout).toContain("rename");
    expect(result.stdout).toContain("set-humidity-offset");
    expect(result.stdout).toContain("set-temperature-offset");
    expect(result.stdout).toContain("list");
  });

  test("accepts a space-separated negative temperature offset", async () => {
    const requestBodies: string[] = [];
    server.use(
      http.get("https://api.nature.global/1/devices", () => HttpResponse.json([remo])),
      http.post(
        "https://api.nature.global/1/devices/device-1/temperature_offset",
        async ({ request }) => {
          requestBodies.push(await request.text());
          return HttpResponse.json({ ...remo, temperature_offset: -0.5 });
        },
      ),
    );

    const result = await runCli(
      ["remo", "set-temperature-offset", "--offset", "-0.5", "--format", "json"],
      "test-token",
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(result.stdout)).toMatchObject({ temperature_offset: -0.5 });
    expect(new URLSearchParams(requestBodies[0]).get("offset")).toBe("-0.5");
  });

  test("shows the learned signal commands", async () => {
    const result = await runCli(["signal", "--help"]);
    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
    expect(result.stdout).toContain("list");
    expect(result.stdout).toContain("send");
  });

  test("rejects competing signal selectors before authentication", async () => {
    const result = await runCli([
      "signal",
      "send",
      "--signal-id",
      "signal-1",
      "--signal-name",
      "Power",
      "--format",
      "json",
    ]);

    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: {
        code: "INVALID_ARGUMENT",
        message: "Provide exactly one of --signal-id or --signal-name.",
      },
    });
  });

  test("rejects an appliance selector with a signal ID before authentication", async () => {
    const result = await runCli([
      "signal",
      "send",
      "--signal-id",
      "signal-1",
      "--appliance",
      "Living room",
      "--format",
      "json",
    ]);

    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: {
        code: "INVALID_ARGUMENT",
        message: "Use --appliance only with --signal-name.",
      },
    });
  });

  test("reports the resolved signal without claiming physical confirmation", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([signalAppliance]),
      ),
      http.post("https://api.nature.global/1/signals/signal-1/send", () => HttpResponse.json({})),
    );

    const result = await runCli(
      ["signal", "send", "--signal-name", "power", "--format", "json"],
      "test-token",
    );

    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(result.stdout)).toEqual({
      accepted: true,
      confirmed: false,
      signal_id: "signal-1",
      signal_name: "Power",
    });
  });

  test("shows the resolved signal in table output", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([signalAppliance]),
      ),
      http.post("https://api.nature.global/1/signals/signal-1/send", () => HttpResponse.json({})),
    );

    const result = await runCli(["signal", "send", "--signal-name", "power"], "test-token");

    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
    expect(result.stdout.split("\n").at(-1)).toMatch(/signal-1\s+Power\s*$/);
  });

  test("shows the TV and light commands", async () => {
    const tv = await runCli(["tv", "--help"]);
    const light = await runCli(["light", "--help"]);

    expect(tv).toMatchObject({ exitCode: 0, stderr: "" });
    expect(tv.stdout).toContain("list");
    expect(tv.stdout).toContain("press");
    expect(light).toMatchObject({ exitCode: 0, stderr: "" });
    expect(light.stdout).toContain("list");
    expect(light.stdout).toContain("press");
  });

  test("shows Home reads and the authenticated User command", async () => {
    const home = await runCli(["home", "--help"]);
    const user = await runCli(["user", "--help"]);

    expect(home).toMatchObject({ exitCode: 0, stderr: "" });
    expect(home.stdout).toContain("list");
    expect(home.stdout).toContain("members");
    expect(home.stdout).toContain("remos");
    expect(user).toMatchObject({ exitCode: 0, stderr: "" });
    expect(user.stdout).toContain("show");
  });

  test("shows the authentication commands", async () => {
    const result = await runCli(["auth", "--help"]);
    expect(result.error).toBeUndefined();
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("login");
    expect(result.stdout).toContain("logout");
    expect(result.stdout).toContain("status");
  });

  test("reports the configured environment token without printing it", async () => {
    const result = await runCli(["auth", "status"], "secret-token");
    expect(result).toMatchObject({
      exitCode: 0,
      stderr: "",
      stdout: "Access token configured via NATURE_REMO_ACCESS_TOKEN.",
    });
    expect(result.stdout).not.toContain("secret-token");
  });

  test("requires an environment token when login runs without a terminal", async () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    setInteractiveTerminal(false);

    const result = await runCli(["auth", "login"]);

    expect(result).toMatchObject({
      exitCode: 2,
      stderr: expect.stringContaining("AUTH_REQUIRED: Interactive login requires a terminal."),
      stdout: "",
    });
    expect(authMocks.password).not.toHaveBeenCalled();
  });

  test("prompts for an access token when login runs in a terminal", async () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    setInteractiveTerminal(true);
    authMocks.password.mockResolvedValue("prompted-token");

    const result = await runCli(["auth", "login"]);

    expect(result).toMatchObject({
      exitCode: 0,
      stderr: "",
      stdout: "Access token saved to macOS Keychain.",
    });
    expect(authMocks.password).toHaveBeenCalledOnce();
    expect(authMocks.setPassword).toHaveBeenCalledWith("prompted-token");
  });

  test("does not save a token when interactive login is cancelled", async () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    setInteractiveTerminal(true);
    authMocks.password.mockResolvedValue(authMocks.cancelSymbol);

    const result = await runCli(["auth", "login"]);

    expect(result).toMatchObject({
      exitCode: 0,
      stderr: "",
      stdout: "Authentication cancelled.",
    });
    expect(authMocks.setPassword).not.toHaveBeenCalled();
  });

  test("reports when logout leaves the environment token active", async () => {
    vi.stubGlobal("process", { ...process, platform: "darwin" });
    const result = await runCli(["auth", "logout"], "environment-token");
    expect(result).toMatchObject({ exitCode: 0, stderr: "" });
    expect(result.stdout).toContain("No Keychain token found.");
    expect(result.stdout).toContain("NATURE_REMO_ACCESS_TOKEN remains active");
  });

  test("directs Linux authentication to the environment without prompting", async () => {
    vi.stubGlobal("process", { ...process, platform: "linux" });
    setInteractiveTerminal(true);

    for (const command of ["login", "logout"]) {
      const result = await runCli(["auth", command]);
      expect(result).toMatchObject({ exitCode: 2, stdout: "" });
      expect(result.stderr).toContain("Set or unset NATURE_REMO_ACCESS_TOKEN");
    }
    expect(authMocks.password).not.toHaveBeenCalled();
    expect(authMocks.setPassword).not.toHaveBeenCalled();
  });

  test("emits a structured error when authentication is missing", async () => {
    const result = await runCli(["appliance", "list", "--format", "json"]);
    expect(result.error).toBeUndefined();
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr)).toMatchObject({
      error: {
        code: "AUTH_REQUIRED",
        exitCode: 2,
        hint: expect.stringContaining("NATURE_REMO_ACCESS_TOKEN"),
      },
    });
  });
});
