import { define } from "gunshi";

import { formatAppliances, outputFormat } from "../../output.ts";
import { outputArgs, remoArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const remoAppliancesCommand = define({
  name: "appliances",
  description: "List appliances registered to a Remo",
  args: { ...remoArgs, ...outputArgs },
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const appliances = await client.remos.listAppliances({ target: ctx.values.remo });
    return formatAppliances(appliances, outputFormat(ctx.values.format));
  },
});
