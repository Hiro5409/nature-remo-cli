import { define } from "gunshi";
import { args, merge } from "gunshi/combinators";

import type { SendSignalOptions } from "../../api/signals.ts";
import { invalidArgument } from "../../errors.ts";
import { formatAcceptedControl, outputFormat } from "../../output.ts";
import { applianceArgs, nonEmptyStringArg, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const signalSendCommand = define({
  name: "send",
  description: "Send a learned infrared signal",
  args: merge(
    applianceArgs,
    args({
      "signal-id": nonEmptyStringArg("signal-id", "Signal ID; sends directly without read access"),
      "signal-name": nonEmptyStringArg(
        "signal-name",
        "Case-insensitive exact signal name; resolved within the appliance",
      ),
    }),
    outputArgs,
  ),
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
