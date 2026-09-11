import type { Appliance } from "./api/appliances.ts";
import type { Home, HomeMember } from "./api/homes.ts";
import type { LightAppliance } from "./api/light.ts";
import type { Remo, RemoMetadata } from "./api/remos.ts";
import type { Signal } from "./api/signals.ts";
import type { TvAppliance } from "./api/tv.ts";
import type { AuthenticatedUser } from "./api/user.ts";
import { padTerminalEnd, terminalSafe, terminalWidth } from "./terminal.ts";

export type OutputFormat = "json" | "table";

export function outputFormat(value: unknown): OutputFormat {
  return value === "json" ? "json" : "table";
}

function modelName(appliance: Appliance): string {
  const model = appliance.model;
  if (!model) return "";
  const manufacturer = "manufacturer" in model ? model.manufacturer : "";
  return [manufacturer, model.name].filter(Boolean).join(" ");
}

function recordedSetting(appliance: Appliance): string {
  const settings = appliance.settings;
  if (!settings) return "";
  if (settings.button === "power-off") return "off";
  return [
    settings.mode,
    settings.temp && `${settings.temp}${settings.temp_unit === "f" ? "°F" : "°C"}`,
  ]
    .filter(Boolean)
    .join(" ");
}

function table(rows: Record<string, unknown>[], emptyMessage: string): string {
  const first = rows[0];
  if (!first) return emptyMessage;

  const keys = Object.keys(first);
  const values = rows.map((row) => keys.map((key) => terminalSafe(row[key])));
  const widths = keys.map((key, index) =>
    Math.max(terminalWidth(key), ...values.map((row) => terminalWidth(row[index] ?? ""))),
  );
  const render = (row: string[]) =>
    row.map((value, index) => padTerminalEnd(value, widths[index] ?? 0)).join("  ");

  return [
    render(keys),
    widths.map((width) => "─".repeat(width)).join("──"),
    ...values.map(render),
  ].join("\n");
}

export function formatAppliances(
  appliances: Appliance[],
  format: OutputFormat,
  emptyMessage = "No appliances found.",
): string {
  if (format === "json") return JSON.stringify(appliances, null, 2);
  return table(
    appliances.map((appliance) => ({
      id: appliance.id,
      nickname: appliance.nickname,
      type: appliance.type,
      model: modelName(appliance),
      recorded_setting: recordedSetting(appliance),
    })),
    emptyMessage,
  );
}

export function formatAirconControl(appliance: Appliance, format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({ accepted: true, appliance, confirmed: false }, null, 2);
  }
  return table(
    [
      {
        accepted: true,
        confirmed: false,
        appliance_id: appliance.id,
        appliance_nickname: appliance.nickname,
        recorded_setting: recordedSetting(appliance),
      },
    ],
    "",
  );
}

export function formatSignals(signals: Signal[], format: OutputFormat): string {
  if (format === "json") return JSON.stringify(signals, null, 2);
  return table(
    signals.map((signal) => ({ id: signal.id, name: signal.name, image: signal.image })),
    "No learned infrared signals found.",
  );
}

export function formatAcceptedControl(
  details: Record<string, unknown>,
  format: OutputFormat,
): string {
  const result = { accepted: true, confirmed: false, ...details };
  if (format === "json") return JSON.stringify(result, null, 2);
  return table([result], "");
}

export function formatTvRecordedState(state: { input: string }, format: OutputFormat): string {
  const result = {
    accepted: true,
    confirmed: false,
    recorded_state: { input: state.input },
  };
  if (format === "json") return JSON.stringify(result, null, 2);
  return table([{ accepted: true, confirmed: false, recorded_input: state.input }], "");
}

export function formatLightRecordedState(
  state: { brightness: string; last_button: string; power: string },
  format: OutputFormat,
): string {
  const result = {
    accepted: true,
    confirmed: false,
    recorded_state: state,
  };
  if (format === "json") return JSON.stringify(result, null, 2);
  return table(
    [
      {
        accepted: true,
        confirmed: false,
        recorded_power: state.power,
        recorded_brightness: state.brightness,
        recorded_last_button: state.last_button,
      },
    ],
    "",
  );
}

function buttonNames(buttons: { name: string }[] | null | undefined): string {
  return buttons?.map((button) => button.name).join(", ") ?? "";
}

export function formatTvs(tvs: TvAppliance[], format: OutputFormat): string {
  if (format === "json") return JSON.stringify(tvs, null, 2);
  return table(
    tvs.map((tv) => ({
      id: tv.id,
      nickname: tv.nickname,
      buttons: buttonNames(tv.tv.buttons),
      recorded_input: tv.tv.state?.input ?? "",
    })),
    "No TVs found.",
  );
}

export function formatLights(lights: LightAppliance[], format: OutputFormat): string {
  if (format === "json") return JSON.stringify(lights, null, 2);
  return table(
    lights.map((light) => ({
      id: light.id,
      nickname: light.nickname,
      buttons: buttonNames(light.light.buttons),
      recorded_power: light.light.state?.power ?? "",
      recorded_brightness: light.light.state?.brightness ?? "",
      recorded_last_button: light.light.state?.last_button ?? "",
    })),
    "No lights found.",
  );
}

export function formatRemos(remos: Remo[], format: OutputFormat): string {
  if (format === "json") return JSON.stringify(remos, null, 2);
  return table(
    remos.map((remo) => {
      const temperature = remo.newest_events?.te;
      const humidity = remo.newest_events?.hu;
      const updatedAt = [temperature?.created_at, humidity?.created_at]
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1);
      return {
        id: remo.id,
        name: remo.name,
        online: remo.online ?? "",
        temperature: temperature ? `${temperature.val}°C` : "",
        humidity: humidity ? `${humidity.val}%` : "",
        updated_at: updatedAt ?? "",
      };
    }),
    "No Nature Remo controllers found.",
  );
}

export function formatRemoConfiguration(remo: Remo | RemoMetadata, format: OutputFormat): string {
  if (format === "json") return JSON.stringify(remo, null, 2);
  return table(
    [
      {
        id: remo.id,
        name: remo.name,
        temperature_offset: remo.temperature_offset,
        humidity_offset: remo.humidity_offset,
      },
    ],
    "",
  );
}

export function formatHomes(homes: Home[], format: OutputFormat): string {
  if (format === "json") return JSON.stringify(homes, null, 2);
  return table(
    homes.map((home) => ({
      id: home.id,
      name: home.name,
      breaker_capacity: home.breaker_capacity ?? "",
      members: home.users ? home.users.length : "",
    })),
    "No homes found.",
  );
}

export function formatHomeMembers(members: HomeMember[], format: OutputFormat): string {
  if (format === "json") return JSON.stringify(members, null, 2);
  return table(
    members.map((member) => ({
      id: member.user.id,
      nickname: member.user.nickname,
      role: member.role,
    })),
    "No Home members found.",
  );
}

export function formatAuthenticatedUser(user: AuthenticatedUser, format: OutputFormat): string {
  if (format === "json") return JSON.stringify(user, null, 2);
  return table(
    [
      {
        id: user.id,
        nickname: user.nickname,
        country: user.country ?? "",
        temperature_unit: user.temp_unit ?? "",
        distance_unit: user.distance_unit ?? "",
      },
    ],
    "",
  );
}
