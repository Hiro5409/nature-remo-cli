import { define } from "gunshi";

import { formatRemos, outputFormat } from "../../output.ts";
import { homeArgs, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const homeRemosCommand = define({
  name: "remos",
  description: "List Remos in a Home",
  args: { ...homeArgs, ...outputArgs },
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const remos = await client.homes.listRemos({ target: ctx.values.home });
    return formatRemos(remos, outputFormat(ctx.values.format));
  },
});
