import { define } from "gunshi";

import { formatAirconControl, outputFormat } from "../../output.ts";
import { applianceArgs, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const airconOffCommand = define({
  name: "off",
  description: "Turn off an air conditioner",
  args: { ...applianceArgs, ...outputArgs },
  run: async (ctx) => {
    const remo = await authenticatedNatureRemo();
    const appliance = await remo.aircons.set({
      power: "off",
      target: ctx.values.appliance,
    });
    return formatAirconControl(appliance, outputFormat(ctx.values.format));
  },
});
