import type { Client } from "../types/nature/client/index.ts";
import { post1SignalsBySignalidSend } from "../types/nature/sdk.gen.ts";
import type { Signal as NatureSignal } from "../types/nature/types.gen.ts";
import { listAppliances } from "./appliances.ts";
import { natureRemoRequest } from "./request.ts";
import { selectResource } from "./select.ts";

export type Signal = NatureSignal;
export type SignalReference = Pick<Signal, "id"> & Partial<Pick<Signal, "name">>;

export type ListSignalsOptions = {
  appliance?: string;
};

export type SendSignalOptions =
  | { appliance?: never; id: string; name?: never }
  | { appliance?: string; id?: never; name: string };

async function signalsForAppliance(
  client: Client,
  selector: string | undefined,
): Promise<Signal[]> {
  const appliance = selectResource(await listAppliances(client), selector, {
    name: (candidate) => candidate.nickname,
    singular: "appliance",
  });
  return appliance.signals ?? [];
}

export function listSignals(client: Client, options: ListSignalsOptions = {}): Promise<Signal[]> {
  return signalsForAppliance(client, options.appliance);
}

export async function sendSignal(
  client: Client,
  options: SendSignalOptions,
): Promise<SignalReference> {
  let signal: SignalReference;
  if (options.id !== undefined) {
    signal = { id: options.id };
  } else {
    const selected = selectResource(
      await signalsForAppliance(client, options.appliance),
      options.name,
      {
        name: (candidate) => candidate.name,
        singular: "signal",
      },
    );
    signal = { id: selected.id, name: selected.name };
  }
  await natureRemoRequest(
    post1SignalsBySignalidSend({
      body: {},
      client,
      path: { signalid: signal.id },
    }),
  );
  return signal;
}
