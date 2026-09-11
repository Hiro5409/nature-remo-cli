import { define } from "gunshi";

import { signalListCommand } from "./signal/list.ts";
import { signalSendCommand } from "./signal/send.ts";

export const signalCommand = define({
  name: "signal",
  description: "Read and send learned infrared signals",
  run: () => 'Run "nature-remo signal --help" for usage information.',
  subCommands: {
    list: signalListCommand,
    send: signalSendCommand,
  },
});
