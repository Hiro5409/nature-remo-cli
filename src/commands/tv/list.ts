import { define } from "gunshi";

import { formatTvs, outputFormat } from "../../output.ts";
import { outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const tvListCommand = define({
  name: "list",
  description: "List TVs, available buttons, and recorded state",
  args: outputArgs,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    return formatTvs(await client.tvs.list(), outputFormat(ctx.values.format));
  },
});
