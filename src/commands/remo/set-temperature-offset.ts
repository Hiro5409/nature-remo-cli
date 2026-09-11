import { define } from "gunshi";

import { formatRemoConfiguration, outputFormat } from "../../output.ts";
import { outputArgs, remoArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const remoSetTemperatureOffsetCommand = define({
  name: "set-temperature-offset",
  description: "Set the calibration offset added to measured temperature",
  args: {
    ...remoArgs,
    offset: { type: "number", required: true, description: "Temperature offset" },
    ...outputArgs,
  } as const,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const remo = await client.remos.setTemperatureOffset({
      offset: ctx.values.offset,
      target: ctx.values.remo,
    });
    return formatRemoConfiguration(remo, outputFormat(ctx.values.format));
  },
});
