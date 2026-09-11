import { define } from "gunshi";

import { formatAppliances, outputFormat } from "../../output.ts";
import { outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const airconListCommand = define({
  name: "list",
  description: "List air conditioners and their recorded settings",
  args: outputArgs,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const aircons = await client.aircons.list();
    return formatAppliances(aircons, outputFormat(ctx.values.format), "No air conditioners found.");
  },
});
