export const outputArgs = {
  format: {
    type: "enum",
    choices: ["json", "table"],
    short: "f",
    description: "Output format: json | table",
    default: "table",
  },
} as const;

export const applianceArgs = {
  appliance: {
    type: "string",
    description:
      "Appliance ID or case-insensitive exact nickname; optional when only one matching appliance exists",
  },
} as const;

export const remoArgs = {
  remo: {
    type: "string",
    description: "Remo ID or case-insensitive exact name; optional when only one Remo exists",
  },
} as const;

export const homeArgs = {
  home: {
    type: "string",
    description: "Home ID or case-insensitive exact name; optional when only one Home exists",
  },
} as const;
