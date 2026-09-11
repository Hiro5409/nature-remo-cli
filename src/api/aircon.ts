import { invalidArgument } from "../errors.ts";
import type { Client } from "../types/nature/client/index.ts";
import { post2AppliancesByApplianceidAirconSettings } from "../types/nature/sdk.gen.ts";
import type { RangeResponseMode } from "../types/nature/types.gen.ts";
import { listAppliances, type Appliance } from "./appliances.ts";
import { natureRemoRequest } from "./request.ts";
import { selectResource } from "./select.ts";

export type SetAirconOptions = {
  direction?: string;
  horizontalDirection?: string;
  mode?: string;
  power?: "off" | "on";
  target?: string;
  temperature?: string;
  volume?: string;
};

export async function listAircons(client: Client): Promise<Appliance[]> {
  return (await listAppliances(client)).filter((appliance) => appliance.type === "AC");
}

function supportedValue(label: string, value: string, supported: string[] | null): string {
  if (!supported || supported.includes(value)) return value;
  throw invalidArgument(
    `Unsupported ${label}: ${value}. Supported values: ${supported.join(", ")}`,
  );
}

function rangeForMode(appliance: Appliance, mode: string): RangeResponseMode {
  const range = appliance.aircon?.range.modes?.[mode];
  if (range) return range;
  const modes = Object.keys(appliance.aircon?.range.modes ?? {});
  throw invalidArgument(`Unsupported mode: ${mode}. Supported modes: ${modes.join(", ")}`);
}

export async function setAircon(client: Client, options: SetAirconOptions): Promise<Appliance> {
  const appliance = selectResource(await listAircons(client), options.target, {
    name: (candidate) => candidate.nickname,
    singular: "air conditioner",
  });
  const recordedSettings = appliance.settings;
  if (!recordedSettings || !appliance.aircon) {
    throw invalidArgument(`Air conditioner settings are unavailable: ${appliance.nickname}`);
  }

  const mode = options.mode ?? recordedSettings.mode;
  const range = options.power === "off" ? undefined : rangeForMode(appliance, mode);
  const temperature = range
    ? supportedValue("temperature", options.temperature ?? recordedSettings.temp, range.temp)
    : recordedSettings.temp;
  const volume = range
    ? supportedValue("air volume", options.volume ?? recordedSettings.vol, range.vol)
    : recordedSettings.vol;
  const direction = range
    ? supportedValue("air direction", options.direction ?? recordedSettings.dir, range.dir)
    : recordedSettings.dir;
  const horizontalDirection = range
    ? supportedValue(
        "horizontal air direction",
        options.horizontalDirection ?? recordedSettings.dirh,
        range.dirh,
      )
    : recordedSettings.dirh;

  const { data } = await natureRemoRequest(
    post2AppliancesByApplianceidAirconSettings({
      body: {
        air_direction: direction,
        air_direction_h: horizontalDirection,
        air_volume: volume,
        button: options.power === "off" ? "power-off" : "",
        operation_mode: mode,
        temperature,
        temperature_unit: recordedSettings.temp_unit || appliance.aircon.tempUnit,
      },
      client,
      path: { applianceid: appliance.id },
    }),
  );
  return data;
}
