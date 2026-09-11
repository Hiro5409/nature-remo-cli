import { define } from "gunshi";

import { formatRemoConfiguration, outputFormat } from "../../output.ts";
import { outputArgs, remoArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const remoRenameCommand = define({
  name: "rename",
  description: "Rename a Nature Remo controller",
  args: {
    ...remoArgs,
    name: { type: "string", required: true, description: "New Remo name" },
    ...outputArgs,
  } as const,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const remo = await client.remos.rename({
      name: ctx.values.name,
      target: ctx.values.remo,
    });
    return formatRemoConfiguration(remo, outputFormat(ctx.values.format));
  },
});
