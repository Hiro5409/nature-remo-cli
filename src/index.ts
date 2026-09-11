import { listAircons, setAircon, type SetAirconOptions } from "./api/aircon.ts";
import { listAppliances, type Appliance } from "./api/appliances.ts";
import { createNatureClient } from "./api/client.ts";
import {
  type Home,
  type HomeMember,
  listHomeMembers,
  listHomeRemos,
  listHomes,
  type SelectHomeOptions,
} from "./api/homes.ts";
import {
  type LightAppliance,
  type LightRecordedState,
  listLights,
  type PressLightButtonOptions,
  pressLightButton,
} from "./api/light.ts";
import {
  listRemoAppliances,
  listRemos,
  type Remo,
  type RemoMetadata,
  type RenameRemoOptions,
  renameRemo,
  type SelectRemoOptions,
  type SetSensorOffsetOptions,
  setHumidityOffset,
  setTemperatureOffset,
} from "./api/remos.ts";
import {
  type ListSignalsOptions,
  listSignals,
  type SendSignalOptions,
  sendSignal,
  type Signal,
  type SignalReference,
} from "./api/signals.ts";
import {
  listTvs,
  type PressTvButtonOptions,
  pressTvButton,
  type TvAppliance,
  type TvRecordedState,
} from "./api/tv.ts";
import { type AuthenticatedUser, getAuthenticatedUser } from "./api/user.ts";

export type NatureRemoOptions = {
  accessToken: string;
  fetch?: typeof fetch;
};

export type NatureRemo = {
  aircons: {
    list: () => Promise<Appliance[]>;
    set: (options: SetAirconOptions) => Promise<Appliance>;
  };
  appliances: {
    list: () => Promise<Appliance[]>;
  };
  homes: {
    list: () => Promise<Home[]>;
    listMembers: (options?: SelectHomeOptions) => Promise<HomeMember[]>;
    listRemos: (options?: SelectHomeOptions) => Promise<Remo[]>;
  };
  lights: {
    list: () => Promise<LightAppliance[]>;
    press: (options: PressLightButtonOptions) => Promise<LightRecordedState>;
  };
  remos: {
    list: () => Promise<Remo[]>;
    listAppliances: (options?: SelectRemoOptions) => Promise<Appliance[]>;
    rename: (options: RenameRemoOptions) => Promise<RemoMetadata>;
    setHumidityOffset: (options: SetSensorOffsetOptions) => Promise<Remo>;
    setTemperatureOffset: (options: SetSensorOffsetOptions) => Promise<Remo>;
  };
  signals: {
    list: (options?: ListSignalsOptions) => Promise<Signal[]>;
    send: (options: SendSignalOptions) => Promise<SignalReference>;
  };
  tvs: {
    list: () => Promise<TvAppliance[]>;
    press: (options: PressTvButtonOptions) => Promise<TvRecordedState>;
  };
  user: {
    get: () => Promise<AuthenticatedUser>;
  };
};

export function createNatureRemo(options: NatureRemoOptions): NatureRemo {
  const client = createNatureClient(options.accessToken, { fetch: options.fetch });
  return {
    aircons: {
      list: () => listAircons(client),
      set: (input) => setAircon(client, input),
    },
    appliances: {
      list: () => listAppliances(client),
    },
    homes: {
      list: () => listHomes(client),
      listMembers: (input) => listHomeMembers(client, input),
      listRemos: (input) => listHomeRemos(client, input),
    },
    lights: {
      list: () => listLights(client),
      press: (input) => pressLightButton(client, input),
    },
    remos: {
      list: () => listRemos(client),
      listAppliances: (input) => listRemoAppliances(client, input),
      rename: (input) => renameRemo(client, input),
      setHumidityOffset: (input) => setHumidityOffset(client, input),
      setTemperatureOffset: (input) => setTemperatureOffset(client, input),
    },
    signals: {
      list: (input) => listSignals(client, input),
      send: (input) => sendSignal(client, input),
    },
    tvs: {
      list: () => listTvs(client),
      press: (input) => pressTvButton(client, input),
    },
    user: {
      get: () => getAuthenticatedUser(client),
    },
  };
}

export type { SetAirconOptions } from "./api/aircon.ts";
export type { Appliance } from "./api/appliances.ts";
export type { Home, HomeMember, SelectHomeOptions } from "./api/homes.ts";
export type { LightAppliance, LightRecordedState, PressLightButtonOptions } from "./api/light.ts";
export type {
  Remo,
  RemoMetadata,
  RenameRemoOptions,
  SelectRemoOptions,
  SetSensorOffsetOptions,
} from "./api/remos.ts";
export type {
  ListSignalsOptions,
  SendSignalOptions,
  Signal,
  SignalReference,
} from "./api/signals.ts";
export type { PressTvButtonOptions, TvAppliance, TvRecordedState } from "./api/tv.ts";
export type { AuthenticatedUser } from "./api/user.ts";
export { NatureRemoError, type NatureRemoErrorCode } from "./errors.ts";
