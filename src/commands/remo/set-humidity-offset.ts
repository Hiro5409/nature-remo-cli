import { define } from "gunshi";
import { args, merge, number, required } from "gunshi/combinators";

import { formatRemoConfiguration, outputFormat } from "../../output.ts";
import { outputArgs, remoArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const remoSetHumidityOffsetCommand = define({
  name: "set-humidity-offset",
  description: "Set the calibration offset added to measured humidity",
  args: merge(
    remoArgs,
    args({ offset: required(number({ description: "Humidity offset" })) }),
    outputArgs,
  ),
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const remo = await client.remos.setHumidityOffset({
      offset: ctx.values.offset,
      target: ctx.values.remo,
    });
    return formatRemoConfiguration(remo, outputFormat(ctx.values.format));
  },
});
