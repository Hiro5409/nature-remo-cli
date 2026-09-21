import { define } from "gunshi";
import { args, merge, required } from "gunshi/combinators";

import { formatRemoConfiguration, outputFormat } from "../../output.ts";
import { nonEmptyStringArg, outputArgs, remoArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const remoRenameCommand = define({
  name: "rename",
  description: "Rename a Nature Remo controller",
  args: merge(
    remoArgs,
    args({ name: required(nonEmptyStringArg("name", "New Remo name")) }),
    outputArgs,
  ),
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const remo = await client.remos.rename({
      name: ctx.values.name,
      target: ctx.values.remo,
    });
    return formatRemoConfiguration(remo, outputFormat(ctx.values.format));
  },
});
