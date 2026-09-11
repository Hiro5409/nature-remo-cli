import type { Client } from "../types/nature/client/index.ts";
import { post1AppliancesByApplianceidTv } from "../types/nature/sdk.gen.ts";
import type { TvState } from "../types/nature/types.gen.ts";
import { listAppliances, type Appliance } from "./appliances.ts";
import { requireControlButton } from "./control-buttons.ts";
import { natureRemoRequest } from "./request.ts";
import { selectResource } from "./select.ts";

export type TvRecordedState = TvState;
export type TvAppliance = Appliance & { tv: NonNullable<Appliance["tv"]> };

export type PressTvButtonOptions = {
  button: string;
  target?: string;
};

function isTv(appliance: Appliance): appliance is TvAppliance {
  return appliance.tv !== undefined && appliance.tv !== null;
}

export async function listTvs(client: Client): Promise<TvAppliance[]> {
  return (await listAppliances(client)).filter(isTv);
}

export async function pressTvButton(
  client: Client,
  options: PressTvButtonOptions,
): Promise<TvRecordedState> {
  const appliance = selectResource(await listTvs(client), options.target, {
    name: (candidate) => candidate.nickname,
    singular: "TV",
  });
  const button = requireControlButton(appliance.tv.buttons, options.button);
  const { data } = await natureRemoRequest(
    post1AppliancesByApplianceidTv({
      body: { button },
      client,
      path: { applianceid: appliance.id },
    }),
  );
  return data;
}
