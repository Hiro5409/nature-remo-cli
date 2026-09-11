import { define } from "gunshi";

import { formatAppliances, outputFormat } from "../../output.ts";
import { outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const applianceListCommand = define({
  name: "list",
  description: "List appliances and their latest settings",
  args: outputArgs,
  run: async (ctx) => {
    const remo = await authenticatedNatureRemo();
    const appliances = await remo.appliances.list();
    return formatAppliances(appliances, outputFormat(ctx.values.format));
  },
});
