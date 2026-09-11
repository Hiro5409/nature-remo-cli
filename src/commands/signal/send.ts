import { define } from "gunshi";

import type { SendSignalOptions } from "../../api/signals.ts";
import { invalidArgument } from "../../errors.ts";
import { formatAcceptedControl, outputFormat } from "../../output.ts";
import { applianceArgs, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const signalSendCommand = define({
  name: "send",
  description: "Send a learned infrared signal",
  args: {
    ...applianceArgs,
    "signal-id": {
      type: "string",
      description: "Signal ID; sends directly without read access",
    },
    "signal-name": {
      type: "string",
      description: "Case-insensitive exact signal name; resolved within the appliance",
    },
    ...outputArgs,
  } as const,
  run: async (ctx) => {
    const id = ctx.values["signal-id"];
    const name = ctx.values["signal-name"];
    if (id && ctx.values.appliance) {
      throw invalidArgument("Use --appliance only with --signal-name.");
    }
    let selection: SendSignalOptions;
    if (id && !name) {
      selection = { id };
    } else if (name && !id) {
      selection = { appliance: ctx.values.appliance, name };
    } else {
      throw invalidArgument("Provide exactly one of --signal-id or --signal-name.");
    }

    const client = await authenticatedNatureRemo();
    const signal = await client.signals.send(selection);
    return formatAcceptedControl(
      { signal_id: signal.id, signal_name: signal.name },
      outputFormat(ctx.values.format),
    );
  },
});
