import { define } from "gunshi";
import { args, choice, merge } from "gunshi/combinators";

import { formatAirconControl, outputFormat } from "../../output.ts";
import { applianceArgs, nonEmptyStringArg, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const airconSetCommand = define({
  name: "set",
  description: "Send settings to an air conditioner and turn it on",
  args: merge(
    applianceArgs,
    args({
      temperature: nonEmptyStringArg(
        "temperature",
        "Temperature accepted by the selected mode, such as 26.5",
      ),
      mode: choice(["auto", "blow", "cool", "dry", "warm"], {
        description: "Operation mode",
      }),
      volume: nonEmptyStringArg("volume", "Air volume, such as auto or 1"),
      direction: nonEmptyStringArg("direction", "Vertical air direction, such as swing or 1"),
      "horizontal-direction": nonEmptyStringArg("horizontal-direction", "Horizontal air direction"),
    }),
    outputArgs,
  ),
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
