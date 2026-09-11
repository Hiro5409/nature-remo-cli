import { define } from "gunshi";

import { tvListCommand } from "./tv/list.ts";
import { tvPressCommand } from "./tv/press.ts";

export const tvCommand = define({
  name: "tv",
  description: "Read and control TVs",
  run: () => 'Run "nature-remo tv --help" for usage information.',
  subCommands: {
    list: tvListCommand,
    press: tvPressCommand,
  },
});
