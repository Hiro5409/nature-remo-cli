import { define } from "gunshi";

import { formatHomes, outputFormat } from "../../output.ts";
import { outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const homeListCommand = define({
  name: "list",
  description: "List Nature Remo homes",
  args: outputArgs,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    return formatHomes(await client.homes.list(), outputFormat(ctx.values.format));
  },
});
