import { invalidArgument } from "../errors.ts";
import type { Client } from "../types/nature/client/index.ts";
import {
  get1Devices,
  get1DevicesByDeviceidAppliances,
  post1DevicesByDeviceid,
  post1DevicesByDeviceidHumidityOffset,
  post1DevicesByDeviceidTemperatureOffset,
} from "../types/nature/sdk.gen.ts";
import type { Device, DeviceResponse } from "../types/nature/types.gen.ts";
import type { Appliance } from "./appliances.ts";
import { natureRemoRequest } from "./request.ts";
import { selectResource } from "./select.ts";

export type Remo = DeviceResponse;
export type RemoMetadata = Device;

export type SelectRemoOptions = { id: string; target?: never } | { id?: never; target?: string };

export type RenameRemoOptions = SelectRemoOptions & {
  name: string;
};

export type SetSensorOffsetOptions = SelectRemoOptions & {
  offset: number;
};

export async function listRemos(client: Client): Promise<Remo[]> {
  const { data } = await natureRemoRequest(get1Devices({ client }));
  return data ?? [];
}

async function selectRemo(client: Client, target: string | undefined): Promise<Remo> {
  return selectResource(await listRemos(client), target, {
    name: (candidate) => candidate.name,
    singular: "Remo",
  });
}

async function resolveRemoId(client: Client, options: SelectRemoOptions): Promise<string> {
  if (options.id !== undefined) return options.id;
  return (await selectRemo(client, options.target)).id;
}

function requireName(name: string): string {
  if (name.trim()) return name.trim();
  throw invalidArgument("Remo name must not be empty.");
}

function requireOffset(offset: number): number {
  if (Number.isFinite(offset)) return offset;
  throw invalidArgument("Sensor offset must be a finite number.");
}

export async function renameRemo(
  client: Client,
  options: RenameRemoOptions,
): Promise<RemoMetadata> {
  const name = requireName(options.name);
  const remoId = await resolveRemoId(client, options);
  const { data } = await natureRemoRequest(
    post1DevicesByDeviceid({
      body: { name },
      client,
      path: { deviceid: remoId },
    }),
  );
  return data;
}

export async function setTemperatureOffset(
  client: Client,
  options: SetSensorOffsetOptions,
): Promise<Remo> {
  const offset = requireOffset(options.offset);
  const remoId = await resolveRemoId(client, options);
  const { data } = await natureRemoRequest(
    post1DevicesByDeviceidTemperatureOffset({
      body: { offset },
      client,
      path: { deviceid: remoId },
    }),
  );
  return data;
}

export async function setHumidityOffset(
  client: Client,
  options: SetSensorOffsetOptions,
): Promise<Remo> {
  const offset = requireOffset(options.offset);
  const remoId = await resolveRemoId(client, options);
  const { data } = await natureRemoRequest(
    post1DevicesByDeviceidHumidityOffset({
      body: { offset },
      client,
      path: { deviceid: remoId },
    }),
  );
  return data;
}

export async function listRemoAppliances(
  client: Client,
  options: SelectRemoOptions = {},
): Promise<Appliance[]> {
  const remoId = await resolveRemoId(client, options);
  const { data } = await natureRemoRequest(
    get1DevicesByDeviceidAppliances({
      client,
      path: { deviceid: remoId },
    }),
  );
  return data ?? [];
}
