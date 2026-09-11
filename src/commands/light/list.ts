import { define } from "gunshi";

import { formatLights, outputFormat } from "../../output.ts";
import { outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const lightListCommand = define({
  name: "list",
  description: "List lights, available buttons, and recorded state",
  args: outputArgs,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    return formatLights(await client.lights.list(), outputFormat(ctx.values.format));
  },
});
