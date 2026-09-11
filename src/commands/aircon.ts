import { define } from "gunshi";

import { airconListCommand } from "./aircon/list.ts";
import { airconOffCommand } from "./aircon/off.ts";
import { airconSetCommand } from "./aircon/set.ts";

export const airconCommand = define({
  name: "aircon",
  description: "Read and control air conditioners",
  run: () => 'Run "nature-remo aircon --help" for usage information.',
  subCommands: {
    list: airconListCommand,
    off: airconOffCommand,
    set: airconSetCommand,
  },
});
