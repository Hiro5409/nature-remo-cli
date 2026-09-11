import { http, HttpResponse } from "msw";
import { describe, expect, test, vi } from "vite-plus/test";

import { createNatureRemo } from "../index.ts";
import { server } from "../test/server.ts";

const remo = {
  created_at: "2026-09-02T00:00:00Z",
  firmware_version: "Nature-2W3/2.2.0",
  humidity_offset: 0,
  id: "device-1",
  mac_address: "00:00:00:00:00:00",
  name: "Remo Lapis",
  newest_events: {
    hu: { created_at: "2026-09-03T00:00:00Z", val: 67 },
    te: { created_at: "2026-09-03T00:01:00Z", val: 25.9 },
  },
  online: true,
  serial_number: "serial",
  temperature_offset: 0,
  updated_at: "2026-09-02T00:00:00Z",
};

const remoMetadata = {
  created_at: remo.created_at,
  firmware_version: remo.firmware_version,
  humidity_offset: remo.humidity_offset,
  id: remo.id,
  mac_address: remo.mac_address,
  name: remo.name,
  serial_number: remo.serial_number,
  temperature_offset: remo.temperature_offset,
  updated_at: remo.updated_at,
};

describe("Remo client", () => {
  test("returns validated sensor readings", async () => {
    server.use(
      http.get("https://api.nature.global/1/devices", ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer test-token");
        return HttpResponse.json([remo]);
      }),
    );

    const remos = await createNatureRemo({ accessToken: "test-token" }).remos.list();

    expect(remos[0]).toMatchObject({
      name: "Remo Lapis",
      newest_events: { hu: { val: 67 }, te: { val: 25.9 } },
      online: true,
    });
  });

  test("renames a selected Remo", async () => {
    server.use(
      http.get("https://api.nature.global/1/devices", () =>
        HttpResponse.json([{ ...remo, id: "device-2", name: "Bedroom" }, remo]),
      ),
      http.post("https://api.nature.global/1/devices/device-1", async ({ request }) => {
        expect(new URLSearchParams(await request.text()).get("name")).toBe("Living room Remo");
        return HttpResponse.json({ ...remoMetadata, name: "Living room Remo" });
      }),
    );

    const renamed = await createNatureRemo({ accessToken: "test-token" }).remos.rename({
      name: "  Living room Remo  ",
      target: "remo lapis",
    });

    expect(renamed).toEqual({ ...remoMetadata, name: "Living room Remo" });
  });

  test("rejects an empty Remo name before a request", async () => {
    const request = vi.fn(() => HttpResponse.json(remoMetadata));
    server.use(http.all("https://api.nature.global/*", request));

    await expect(
      createNatureRemo({ accessToken: "test-token" }).remos.rename({
        id: "device-1",
        name: "   ",
      }),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(request).not.toHaveBeenCalled();
  });

  test("sets the temperature sensor offset", async () => {
    server.use(
      http.get("https://api.nature.global/1/devices", () => HttpResponse.json([remo])),
      http.post(
        "https://api.nature.global/1/devices/device-1/temperature_offset",
        async ({ request }) => {
          expect(new URLSearchParams(await request.text()).get("offset")).toBe("-0.5");
          return HttpResponse.json({ ...remo, temperature_offset: -0.5 });
        },
      ),
    );

    const updated = await createNatureRemo({
      accessToken: "test-token",
    }).remos.setTemperatureOffset({ offset: -0.5 });

    expect(updated.temperature_offset).toBe(-0.5);
  });

  test("sets the humidity sensor offset", async () => {
    server.use(
      http.get("https://api.nature.global/1/devices", () => HttpResponse.json([remo])),
      http.post(
        "https://api.nature.global/1/devices/device-1/humidity_offset",
        async ({ request }) => {
          expect(new URLSearchParams(await request.text()).get("offset")).toBe("2");
          return HttpResponse.json({ ...remo, humidity_offset: 2 });
        },
      ),
    );

    const updated = await createNatureRemo({ accessToken: "test-token" }).remos.setHumidityOffset({
      offset: 2,
    });

    expect(updated.humidity_offset).toBe(2);
  });

  test("lists appliances registered to the selected Remo", async () => {
    const appliance = {
      id: "appliance-1",
      image: "ico_ac",
      model: null,
      nickname: "Air conditioner",
      signals: [],
      type: "AC",
    };
    server.use(
      http.get("https://api.nature.global/1/devices/device-1/appliances", () =>
        HttpResponse.json([appliance]),
      ),
    );

    const appliances = await createNatureRemo({ accessToken: "test-token" }).remos.listAppliances({
      id: "device-1",
    });

    expect(appliances).toEqual([appliance]);
  });

  test("rejects a non-finite sensor offset before a request", async () => {
    const request = vi.fn(() => HttpResponse.json(remo));
    server.use(http.all("https://api.nature.global/*", request));

    await expect(
      createNatureRemo({ accessToken: "test-token" }).remos.setHumidityOffset({
        offset: Number.NaN,
      }),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(request).not.toHaveBeenCalled();
  });
});
