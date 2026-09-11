import type { Client } from "../types/nature/client/index.ts";
import {
  get1Homes,
  get1HomesByHomeidDevices,
  get1HomesByHomeidUsers,
} from "../types/nature/sdk.gen.ts";
import type { HomeResponse, UserAndRole } from "../types/nature/types.gen.ts";
import type { Remo } from "./remos.ts";
import { natureRemoRequest } from "./request.ts";
import { selectResource } from "./select.ts";

export type Home = HomeResponse;
export type HomeMember = UserAndRole;

export type SelectHomeOptions = { id: string; target?: never } | { id?: never; target?: string };

export async function listHomes(client: Client): Promise<Home[]> {
  const { data } = await natureRemoRequest(get1Homes({ client }));
  return data ?? [];
}

async function resolveHomeId(client: Client, options: SelectHomeOptions): Promise<string> {
  if (options.id !== undefined) return options.id;
  return selectResource(await listHomes(client), options.target, {
    name: (candidate) => candidate.name,
    singular: "home",
  }).id;
}

export async function listHomeRemos(
  client: Client,
  options: SelectHomeOptions = {},
): Promise<Remo[]> {
  const homeId = await resolveHomeId(client, options);
  const { data } = await natureRemoRequest(
    get1HomesByHomeidDevices({ client, path: { homeid: homeId } }),
  );
  return data ?? [];
}

export async function listHomeMembers(
  client: Client,
  options: SelectHomeOptions = {},
): Promise<HomeMember[]> {
  const homeId = await resolveHomeId(client, options);
  const { data } = await natureRemoRequest(
    get1HomesByHomeidUsers({ client, path: { homeid: homeId } }),
  );
  return data ?? [];
}
