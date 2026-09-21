import { args, combinator, short, withDefault } from "gunshi/combinators";

export function nonEmptyStringArg(name: string, description: string) {
  return combinator({
    description,
    parse: (value) => {
      if (!value) throw new Error(`--${name} requires a value.`);
      return value;
    },
  });
}

const outputFormat = combinator({
  description: "Output format: json | table",
  parse: (value) => {
    if (value === "json" || value === "table") return value;
    throw new Error("--format must be one of: json, table");
  },
});

export const outputArgs = args({
  format: short(withDefault(outputFormat, "table"), "f"),
});

export const applianceArgs = args({
  appliance: nonEmptyStringArg(
    "appliance",
    "Appliance ID or case-insensitive exact nickname; optional when only one matching appliance exists",
  ),
});

export const remoArgs = args({
  remo: nonEmptyStringArg(
    "remo",
    "Remo ID or case-insensitive exact name; optional when only one Remo exists",
  ),
});

export const homeArgs = args({
  home: nonEmptyStringArg(
    "home",
    "Home ID or case-insensitive exact name; optional when only one Home exists",
  ),
});
