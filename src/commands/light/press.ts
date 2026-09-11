import { define } from "gunshi";

import { formatLightRecordedState, outputFormat } from "../../output.ts";
import { applianceArgs, outputArgs } from "../args.ts";
import { authenticatedNatureRemo } from "../client.ts";

export const lightPressCommand = define({
  name: "press",
  description: "Press a button on a light remote",
  args: {
    ...applianceArgs,
    button: {
      type: "string",
      required: true,
      description: "Case-insensitive exact advertised button name",
    },
    ...outputArgs,
  } as const,
  run: async (ctx) => {
    const client = await authenticatedNatureRemo();
    const state = await client.lights.press({
      button: ctx.values.button,
      target: ctx.values.appliance,
    });
    return formatLightRecordedState(state, outputFormat(ctx.values.format));
  },
});
