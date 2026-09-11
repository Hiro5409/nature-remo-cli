import { http, HttpResponse } from "msw";
import { describe, expect, test, vi } from "vite-plus/test";

import { createNatureRemo } from "../index.ts";
import { server } from "../test/server.ts";
import type { Appliance } from "./appliances.ts";

const appliance: Appliance = {
  aircon: {
    range: {
      fixedButtons: ["power-off"],
      modes: {
        cool: {
          dir: ["1", "swing"],
          dirh: [""],
          temp: ["26", "26.5", "27"],
          vol: ["1", "auto"],
        },
      },
    },
    tempUnit: "c",
  },
  id: "appliance-1",
  image: "ico_ac_1",
  model: null,
  nickname: "エアコン",
  settings: {
    button: "power-off",
    dir: "swing",
    dirh: "",
    mode: "cool",
    temp: "26",
    temp_unit: "c",
    updated_at: "2026-09-03T00:00:00Z",
    vol: "auto",
  },
  signals: [],
  type: "AC",
};

describe("air conditioner client", () => {
  test("merges requested settings with recorded settings and uses the v2 endpoint", async () => {
    const send = vi.fn(async ({ request }: { request: Request }) => {
      const body = new URLSearchParams(await request.text());
      expect(Object.fromEntries(body)).toEqual({
        air_direction: "swing",
        air_direction_h: "",
        air_volume: "auto",
        button: "",
        operation_mode: "cool",
        temperature: "26.5",
        temperature_unit: "c",
      });
      return HttpResponse.json({
        ...appliance,
        settings: { ...appliance.settings, button: "", temp: "26.5" },
      });
    });
    server.use(
      http.get("https://api.nature.global/1/appliances", () => HttpResponse.json([appliance])),
      http.post("https://api.nature.global/2/appliances/appliance-1/aircon_settings", send),
    );

    const result = await createNatureRemo({ accessToken: "test-token" }).aircons.set({
      power: "on",
      target: "エアコン",
      temperature: "26.5",
    });

    expect(result.settings).toMatchObject({ button: "", mode: "cool", temp: "26.5" });
    expect(send).toHaveBeenCalledOnce();
  });

  test("rejects settings outside the range before sending infrared", async () => {
    const send = vi.fn(() => HttpResponse.json(appliance));
    server.use(
      http.get("https://api.nature.global/1/appliances", () => HttpResponse.json([appliance])),
      http.post("https://api.nature.global/2/appliances/appliance-1/aircon_settings", send),
    );
    const aircons = createNatureRemo({ accessToken: "test-token" }).aircons;

    await expect(aircons.set({ temperature: "18" })).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
    });
    expect(send).not.toHaveBeenCalled();
  });

  test("can turn off using recorded settings when ranges are unavailable", async () => {
    const withoutRanges = {
      ...appliance,
      aircon: { ...appliance.aircon, range: { fixedButtons: ["power-off"], modes: null } },
    };
    const send = vi.fn(async ({ request }: { request: Request }) => {
      expect(new URLSearchParams(await request.text()).get("button")).toBe("power-off");
      return HttpResponse.json({
        ...withoutRanges,
        settings: { ...withoutRanges.settings, button: "power-off" },
      });
    });
    server.use(
      http.get("https://api.nature.global/1/appliances", () => HttpResponse.json([withoutRanges])),
      http.post("https://api.nature.global/2/appliances/appliance-1/aircon_settings", send),
    );

    const result = await createNatureRemo({ accessToken: "test-token" }).aircons.set({
      power: "off",
    });

    expect(result.settings?.button).toBe("power-off");
    expect(send).toHaveBeenCalledOnce();
  });

  test("requires a selector when multiple air conditioners exist", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([appliance, { ...appliance, id: "appliance-2", nickname: "寝室" }]),
      ),
    );
    const aircons = createNatureRemo({ accessToken: "test-token" }).aircons;

    await expect(aircons.set({ power: "off" })).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
      name: "NatureRemoError",
    });
  });

  test("selects an air conditioner by ID when multiple are configured", async () => {
    const send = vi.fn(() => HttpResponse.json(appliance));
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([{ ...appliance, id: "appliance-2", nickname: "寝室" }, appliance]),
      ),
      http.post("https://api.nature.global/2/appliances/appliance-1/aircon_settings", send),
    );

    await createNatureRemo({ accessToken: "test-token" }).aircons.set({
      power: "off",
      target: "appliance-1",
    });

    expect(send).toHaveBeenCalledOnce();
  });
});
