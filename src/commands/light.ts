import { define } from "gunshi";

import { lightListCommand } from "./light/list.ts";
import { lightPressCommand } from "./light/press.ts";

export const lightCommand = define({
  name: "light",
  description: "Read and control lights",
  run: () => 'Run "nature-remo light --help" for usage information.',
  subCommands: {
    list: lightListCommand,
    press: lightPressCommand,
  },
});
