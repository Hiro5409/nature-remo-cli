import { define } from "gunshi";

import { homeListCommand } from "./home/list.ts";
import { homeMembersCommand } from "./home/members.ts";
import { homeRemosCommand } from "./home/remos.ts";

export const homeCommand = define({
  name: "home",
  description: "Read Nature Remo homes and membership",
  run: () => 'Run "nature-remo home --help" for usage information.',
  subCommands: {
    list: homeListCommand,
    members: homeMembersCommand,
    remos: homeRemosCommand,
  },
});
