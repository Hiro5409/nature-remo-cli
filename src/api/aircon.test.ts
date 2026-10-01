import { HttpResponse } from "msw/http";
import { describe, expect, test, vi } from "vite-plus/test";

import { createNatureRemo } from "../index.ts";
import { server } from "../test/server.ts";
import {
  handleGet1Appliances,
  handlePost2AppliancesByApplianceidAirconSettings,
} from "../types/nature/msw.gen.ts";
import type { Appliance } from "./appliances.ts";

const appliance = {
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
} satisfies Appliance;

describe("air conditioner client", () => {
  test("merges requested settings with recorded settings and uses the v2 endpoint", async () => {
    const send = vi.fn(async ({ request }: { request: Request }) => {
      expect(new URL(request.url).pathname).toBe("/2/appliances/appliance-1/aircon_settings");
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
      return HttpResponse.json<Appliance>({
        ...appliance,
        settings: { ...appliance.settings, button: "", temp: "26.5" },
      });
    });
    server.use(
      handleGet1Appliances({ body: [appliance] }),
      handlePost2AppliancesByApplianceidAirconSettings(send),
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
      handleGet1Appliances({ body: [appliance] }),
      handlePost2AppliancesByApplianceidAirconSettings(send),
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
      return HttpResponse.json<Appliance>({
        ...withoutRanges,
        settings: { ...withoutRanges.settings, button: "power-off" },
      });
    });
    server.use(
      handleGet1Appliances({ body: [withoutRanges] }),
      handlePost2AppliancesByApplianceidAirconSettings(send),
    );

    const result = await createNatureRemo({ accessToken: "test-token" }).aircons.set({
      power: "off",
    });

    expect(result.settings?.button).toBe("power-off");
    expect(send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ params: { applianceid: withoutRanges.id } }),
    );
  });

  test("requires a selector when multiple air conditioners exist", async () => {
    server.use(
      handleGet1Appliances({
        body: [appliance, { ...appliance, id: "appliance-2", nickname: "寝室" }],
      }),
    );
    const aircons = createNatureRemo({ accessToken: "test-token" }).aircons;

    await expect(aircons.set({ power: "off" })).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
      name: "NatureRemoError",
    });
  });

  test("selects an air conditioner by ID when multiple are configured", async () => {
    const send = vi.fn(() => HttpResponse.json<Appliance>(appliance));
    server.use(
      handleGet1Appliances({
        body: [{ ...appliance, id: "appliance-2", nickname: "寝室" }, appliance],
      }),
      handlePost2AppliancesByApplianceidAirconSettings(send),
    );

    await createNatureRemo({ accessToken: "test-token" }).aircons.set({
      power: "off",
      target: "appliance-1",
    });

    expect(send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ params: { applianceid: "appliance-1" } }),
    );
  });
});
