import { define } from "gunshi";

import { userShowCommand } from "./user/show.ts";

export const userCommand = define({
  name: "user",
  description: "Read the authenticated Nature user",
  run: () => 'Run "nature-remo user --help" for usage information.',
  subCommands: {
    show: userShowCommand,
  },
});
