import { http, HttpResponse } from "msw";
import { describe, expect, test, vi } from "vite-plus/test";

import { createNatureRemo } from "../index.ts";
import { server } from "../test/server.ts";

const signal = { id: "signal-1", image: "ico_io", name: "Power" };

const appliance = {
  id: "appliance-1",
  image: "ico_io",
  model: null,
  nickname: "Living room",
  signals: [signal],
  type: "IR",
};

describe("signal client", () => {
  test("lists learned signals for an appliance selected by name", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () => HttpResponse.json([appliance])),
    );

    const signals = await createNatureRemo({ accessToken: "test-token" }).signals.list({
      appliance: "living room",
    });

    expect(signals).toEqual([signal]);
  });

  test("returns an empty list when an appliance has no learned signals", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([{ ...appliance, signals: null }]),
      ),
    );

    const signals = await createNatureRemo({ accessToken: "test-token" }).signals.list();

    expect(signals).toEqual([]);
  });

  test("resolves a signal by name before sending it", async () => {
    const send = vi.fn(async ({ request }: { request: Request }) => {
      expect(await request.text()).toBe("");
      return HttpResponse.json({});
    });
    server.use(
      http.get("https://api.nature.global/1/appliances", () => HttpResponse.json([appliance])),
      http.post("https://api.nature.global/1/signals/signal-1/send", send),
    );

    const sentSignal = await createNatureRemo({ accessToken: "test-token" }).signals.send({
      appliance: "Living room",
      name: "power",
    });

    expect(sentSignal).toEqual({ id: "signal-1", name: "Power" });
    expect(send).toHaveBeenCalledOnce();
  });

  test("sends a signal ID directly without read access", async () => {
    const send = vi.fn(() => HttpResponse.json({}));
    server.use(http.post("https://api.nature.global/1/signals/signal-1/send", send));

    const sentSignal = await createNatureRemo({ accessToken: "send-only-token" }).signals.send({
      id: "signal-1",
    });

    expect(sentSignal).toEqual({ id: "signal-1" });
    expect(send).toHaveBeenCalledOnce();
  });

  test("does not send when a signal name is ambiguous", async () => {
    const send = vi.fn(() => HttpResponse.json({}));
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([{ ...appliance, signals: [signal, { ...signal, id: "signal-2" }] }]),
      ),
      http.post("https://api.nature.global/1/signals/:id/send", send),
    );

    await expect(
      createNatureRemo({ accessToken: "test-token" }).signals.send({ name: "Power" }),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(send).not.toHaveBeenCalled();
  });

  test("requires an appliance selector when more than one appliance exists", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([appliance, { ...appliance, id: "appliance-2", nickname: "Bedroom" }]),
      ),
    );

    await expect(
      createNatureRemo({ accessToken: "test-token" }).signals.list(),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
  });
});
