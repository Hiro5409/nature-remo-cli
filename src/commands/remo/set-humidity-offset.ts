import { define } from "gunshi";

import { formatRemoConfiguration, outputFormat } from "../../output.ts";
import { outputArgs, remoArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const remoSetHumidityOffsetCommand = define({
  name: "set-humidity-offset",
  description: "Set the calibration offset added to measured humidity",
  args: {
    ...remoArgs,
    offset: { type: "number", required: true, description: "Humidity offset" },
    ...outputArgs,
  } as const,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const remo = await client.remos.setHumidityOffset({
      offset: ctx.values.offset,
      target: ctx.values.remo,
    });
    return formatRemoConfiguration(remo, outputFormat(ctx.values.format));
  },
});
