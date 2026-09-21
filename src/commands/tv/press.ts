import { define } from "gunshi";
import { args, merge, required } from "gunshi/combinators";

import { formatTvRecordedState, outputFormat } from "../../output.ts";
import { applianceArgs, nonEmptyStringArg, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const tvPressCommand = define({
  name: "press",
  description: "Press a button on a TV remote",
  args: merge(
    applianceArgs,
    args({
      button: required(
        nonEmptyStringArg("button", "Case-insensitive exact advertised button name"),
      ),
    }),
    outputArgs,
  ),
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const state = await client.tvs.press({
      button: ctx.values.button,
      target: ctx.values.appliance,
    });
    return formatTvRecordedState(state, outputFormat(ctx.values.format));
  },
});
