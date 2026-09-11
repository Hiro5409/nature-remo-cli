import { define } from "gunshi";

import { formatAuthenticatedUser, outputFormat } from "../../output.ts";
import { outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const userShowCommand = define({
  name: "show",
  description: "Show the authenticated Nature user",
  args: outputArgs,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    return formatAuthenticatedUser(await client.user.get(), outputFormat(ctx.values.format));
  },
});
