import { define } from "gunshi";

import { remoAppliancesCommand } from "./remo/appliances.ts";
import { remoListCommand } from "./remo/list.ts";
import { remoRenameCommand } from "./remo/rename.ts";
import { remoSetHumidityOffsetCommand } from "./remo/set-humidity-offset.ts";
import { remoSetTemperatureOffsetCommand } from "./remo/set-temperature-offset.ts";

export const remoCommand = define({
  name: "remo",
  description: "Inspect and configure Nature Remo controllers",
  run: () => 'Run "nature-remo remo --help" for usage information.',
  subCommands: {
    appliances: remoAppliancesCommand,
    list: remoListCommand,
    rename: remoRenameCommand,
    "set-humidity-offset": remoSetHumidityOffsetCommand,
    "set-temperature-offset": remoSetTemperatureOffsetCommand,
  },
});
