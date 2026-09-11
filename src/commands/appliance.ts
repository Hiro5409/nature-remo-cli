import { define } from "gunshi";

import { applianceListCommand } from "./appliance/list.ts";

export const applianceCommand = define({
  name: "appliance",
  description: "Read Nature Remo appliances",
  run: () => 'Run "nature-remo appliance --help" for usage information.',
  subCommands: {
    list: applianceListCommand,
  },
});
