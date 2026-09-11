import type { Client } from "../types/nature/client/index.ts";
import { post1AppliancesByApplianceidLight } from "../types/nature/sdk.gen.ts";
import type { LightState } from "../types/nature/types.gen.ts";
import { listAppliances, type Appliance } from "./appliances.ts";
import { requireControlButton } from "./control-buttons.ts";
import { natureRemoRequest } from "./request.ts";
import { selectResource } from "./select.ts";

export type LightRecordedState = LightState;
export type LightAppliance = Appliance & { light: NonNullable<Appliance["light"]> };

export type PressLightButtonOptions = {
  button: string;
  target?: string;
};

function isLight(appliance: Appliance): appliance is LightAppliance {
  return appliance.light !== undefined && appliance.light !== null;
}

export async function listLights(client: Client): Promise<LightAppliance[]> {
  return (await listAppliances(client)).filter(isLight);
}

export async function pressLightButton(
  client: Client,
  options: PressLightButtonOptions,
): Promise<LightRecordedState> {
  const appliance = selectResource(await listLights(client), options.target, {
    name: (candidate) => candidate.nickname,
    singular: "light",
  });
  const button = requireControlButton(appliance.light.buttons, options.button);
  const { data } = await natureRemoRequest(
    post1AppliancesByApplianceidLight({
      body: { button },
      client,
      path: { applianceid: appliance.id },
    }),
  );
  return data;
}
