import { define } from "gunshi";

import { formatAirconControl, outputFormat } from "../../output.ts";
import { applianceArgs, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const airconSetCommand = define({
  name: "set",
  description: "Send settings to an air conditioner and turn it on",
  args: {
    ...applianceArgs,
    temperature: {
      type: "string",
      description: "Temperature accepted by the selected mode, such as 26.5",
    },
    mode: {
      type: "enum",
      choices: ["auto", "blow", "cool", "dry", "warm"],
      description: "Operation mode",
    },
    volume: {
      type: "string",
      description: "Air volume, such as auto or 1",
    },
    direction: {
      type: "string",
      description: "Vertical air direction, such as swing or 1",
    },
    "horizontal-direction": {
      type: "string",
      description: "Horizontal air direction",
    },
    ...outputArgs,
  } as const,
  run: async (ctx) => {
    const remo = await authenticatedNatureRemo();
    const appliance = await remo.aircons.set({
      direction: ctx.values.direction,
      horizontalDirection: ctx.values["horizontal-direction"],
      mode: ctx.values.mode,
      power: "on",
      target: ctx.values.appliance,
      temperature: ctx.values.temperature,
      volume: ctx.values.volume,
    });
    return formatAirconControl(appliance, outputFormat(ctx.values.format));
  },
});
