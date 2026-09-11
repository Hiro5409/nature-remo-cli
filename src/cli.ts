import { cli, define } from "gunshi";
import { renderHeader } from "gunshi/renderer";

import { airconCommand } from "./commands/aircon.ts";
import { applianceCommand } from "./commands/appliance.ts";
import { authCommand } from "./commands/auth.ts";
import { homeCommand } from "./commands/home.ts";
import { lightCommand } from "./commands/light.ts";
import { remoCommand } from "./commands/remo.ts";
import { signalCommand } from "./commands/signal.ts";
import { tvCommand } from "./commands/tv.ts";
import { userCommand } from "./commands/user.ts";
import { formatFromArgv, printError } from "./error-output.ts";

const rootCommand = define({
  name: "nature-remo",
  description: "Type-safe, agent-friendly access to the Nature Remo API",
  run: () => 'Run "nature-remo --help" for usage information.',
});

function normalizeOffsetArgument(argv: string[]): string[] {
  // Gunshi tokenizes a separate negative number as short options before validating its type.
  const normalized: string[] = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--offset" && value?.startsWith("-") && Number.isFinite(Number(value))) {
      normalized.push(`${argument}=${value}`);
      index += 1;
    } else if (argument !== undefined) {
      normalized.push(argument);
    }
  }
  return normalized;
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  try {
    const pkg = await import("../package.json", { with: { type: "json" } });

    await cli(normalizeOffsetArgument(argv), rootCommand, {
      name: "nature-remo",
      version: pkg.default.version,
      strict: true,
      subCommands: {
        aircon: airconCommand,
        appliance: applianceCommand,
        auth: authCommand,
        home: homeCommand,
        light: lightCommand,
        remo: remoCommand,
        signal: signalCommand,
        tv: tvCommand,
        user: userCommand,
      },
      renderHeader: (ctx) => {
        if (!ctx.values.help) return Promise.resolve("");
        return renderHeader(ctx);
      },
      renderValidationErrors: null,
      onAfterCommand: (ctx, result) => {
        if (ctx.values.help || ctx.values.version) return;
        if (result) console.log(result);
      },
    });
    return 0;
  } catch (error) {
    return printError(error, formatFromArgv(argv));
  }
}
