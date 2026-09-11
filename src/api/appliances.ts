import type { Client } from "../types/nature/client/index.ts";
import { get1Appliances } from "../types/nature/sdk.gen.ts";
import type { ApplianceResponse } from "../types/nature/types.gen.ts";
import { natureRemoRequest } from "./request.ts";

export type Appliance = ApplianceResponse;

export async function listAppliances(client: Client): Promise<Appliance[]> {
  const { data } = await natureRemoRequest(get1Appliances({ client }));
  return data ?? [];
}
