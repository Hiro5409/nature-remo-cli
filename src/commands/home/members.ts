import { define } from "gunshi";
import { merge } from "gunshi/combinators";

import { formatHomeMembers, outputFormat } from "../../output.ts";
import { homeArgs, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const homeMembersCommand = define({
  name: "members",
  description: "List Members in a Home",
  args: merge(homeArgs, outputArgs),
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const members = await client.homes.listMembers({ target: ctx.values.home });
    return formatHomeMembers(members, outputFormat(ctx.values.format));
  },
});
