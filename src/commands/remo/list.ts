import { define } from "gunshi";

import { formatRemos, outputFormat } from "../../output.ts";
import { outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const remoListCommand = define({
  name: "list",
  description: "List Nature Remo controllers, sensor readings, and connectivity",
  args: outputArgs,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const remos = await client.remos.list();
    return formatRemos(remos, outputFormat(ctx.values.format));
  },
});
