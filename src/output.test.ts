import { describe, expect, test } from "vite-plus/test";

import type { Appliance } from "./api/appliances.ts";
import type { Remo } from "./api/remos.ts";
import type { Signal } from "./api/signals.ts";
import {
  formatAppliances,
  formatAuthenticatedUser,
  formatHomeMembers,
  formatHomes,
  formatLightRecordedState,
  formatRemoConfiguration,
  formatRemos,
  formatSignals,
  formatTvRecordedState,
} from "./output.ts";

const appliance: Appliance = {
  id: "appliance-1",
  image: "ico_ac_1",
  model: {
    country: "JP",
    id: "daikin-ac",
    image: "ico_ac_1",
    manufacturer: "Daikin",
    name: "Air conditioner",
    remote_name: "Daikin AC",
    series: "",
  },
  nickname: "Living room",
  settings: {
    button: "",
    dir: "",
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

describe("formatAppliances", () => {
  test("preserves the API shape as JSON", () => {
    expect(JSON.parse(formatAppliances([appliance], "json"))).toEqual([appliance]);
  });

  test("summarizes appliances as a table", () => {
    const output = formatAppliances([appliance], "table");
    expect(output).toContain("Living room");
    expect(output).toContain("Daikin Air conditioner");
    expect(output).toContain("cool 26°C");
  });

  test("aligns table columns for Japanese appliance names", () => {
    const output = formatAppliances(
      [
        { ...appliance, nickname: "Living" },
        { ...appliance, id: "appliance-2", nickname: "リビング" },
      ],
      "table",
    );

    expect(output).toContain("Living    AC");
    expect(output).toContain("リビング  AC");
  });

  test("describes an empty result", () => {
    expect(formatAppliances([], "table")).toBe("No appliances found.");
  });
});

describe("formatRemos", () => {
  test("summarizes sensor readings without dropping raw JSON fields", () => {
    const remo: Remo = {
      created_at: "2026-09-02T00:00:00Z",
      firmware_version: "Nature-2W3/2.2.0",
      humidity_offset: 0,
      id: "device-1",
      mac_address: "00:00:00:00:00:00",
      name: "Remo Lapis",
      newest_events: {
        hu: { created_at: "2026-09-03T00:00:00Z", val: 67 },
        te: { created_at: "2026-09-03T00:01:00Z", val: 25.9 },
      },
      online: true,
      serial_number: "serial",
      temperature_offset: 0,
      updated_at: "2026-09-02T00:00:00Z",
    };

    const table = formatRemos([remo], "table");
    expect(table).toContain("25.9°C");
    expect(table).toContain("67%");
    expect(JSON.parse(formatRemos([remo], "json"))).toEqual([remo]);
  });
});

describe("formatRemoConfiguration", () => {
  test("shows both sensor offsets", () => {
    const output = formatRemoConfiguration(
      {
        created_at: "2026-09-02T00:00:00Z",
        firmware_version: "Nature-2W3/2.2.0",
        humidity_offset: 2,
        id: "device-1",
        mac_address: "00:00:00:00:00:00",
        name: "Remo Lapis",
        serial_number: "serial",
        temperature_offset: -0.5,
        updated_at: "2026-09-02T00:00:00Z",
      },
      "table",
    );

    expect(output).toContain("temperature_offset");
    expect(output).toContain("humidity_offset");
    expect(output.split("\n").at(-1)).toMatch(/-0\.5\s+2\s*$/);
  });
});

describe("formatSignals", () => {
  test("formats learned infrared signals", () => {
    const signal: Signal = { id: "signal-1", image: "ico_io", name: "Power" };

    expect(formatSignals([signal], "table")).toContain("Power");
    expect(JSON.parse(formatSignals([signal], "json"))).toEqual([signal]);
  });
});

describe("recorded infrared state output", () => {
  test("does not present TV state as physically confirmed", () => {
    const output = JSON.parse(formatTvRecordedState({ input: "t" }, "json"));

    expect(output).toEqual({
      accepted: true,
      confirmed: false,
      recorded_state: { input: "t" },
    });
  });

  test("qualifies every light field as recorded in table output", () => {
    const output = formatLightRecordedState(
      { brightness: "100", last_button: "on", power: "on" },
      "table",
    );

    expect(output).toContain("confirmed");
    expect(output).toContain("recorded_power");
    expect(output).toContain("recorded_brightness");
    expect(output).toContain("recorded_last_button");
  });
});

describe("Home and User output", () => {
  test("summarizes Homes, Members, and the authenticated User", () => {
    const homeOutput = formatHomes(
      [{ breaker_capacity: 30, id: "home-1", name: "Home", users: [] }],
      "table",
    );
    const memberOutput = formatHomeMembers(
      [{ role: "owner", user: { id: "user-1", nickname: "Owner" } }],
      "table",
    );
    const userOutput = formatAuthenticatedUser(
      { country: "JP", id: "user-1", nickname: "Owner", temp_unit: "c" },
      "json",
    );

    expect(homeOutput).toContain("breaker_capacity");
    expect(memberOutput).toContain("owner");
    expect(JSON.parse(userOutput)).toMatchObject({ id: "user-1", nickname: "Owner" });
  });

  test("does not report an unknown Home member count as zero", () => {
    const output = formatHomes(
      [{ breaker_capacity: null, id: "home-1", name: "Home", users: null }],
      "table",
    );
    const [header, , row] = output.split("\n");
    const membersColumn = header?.indexOf("members") ?? -1;

    expect(row).toBeDefined();
    expect(membersColumn).toBeGreaterThanOrEqual(0);
    expect(row?.slice(membersColumn).trim()).toBe("");
  });
});
