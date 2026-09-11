import { define } from "gunshi";

import { formatSignals, outputFormat } from "../../output.ts";
import { applianceArgs, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const signalListCommand = define({
  name: "list",
  description: "List learned infrared signals for an appliance",
  args: { ...applianceArgs, ...outputArgs },
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const signals = await client.signals.list({ appliance: ctx.values.appliance });
    return formatSignals(signals, outputFormat(ctx.values.format));
  },
});
