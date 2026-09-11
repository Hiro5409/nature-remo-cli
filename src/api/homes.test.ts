import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vite-plus/test";

import { createNatureRemo } from "../index.ts";
import { server } from "../test/server.ts";

const home = {
  breaker_capacity: 30,
  id: "home-1",
  name: "Home",
  users: [
    {
      id: "user-1",
      joined_at: "2026-09-01T00:00:00Z",
      location_state: "home",
      nickname: "Owner",
      role: "owner",
    },
  ],
};

const remo = {
  created_at: "2026-09-02T00:00:00Z",
  firmware_version: "Nature-2W3/2.2.0",
  humidity_offset: 0,
  id: "device-1",
  mac_address: "00:00:00:00:00:00",
  name: "Remo Lapis",
  newest_events: null,
  online: true,
  serial_number: "serial",
  temperature_offset: 0,
  updated_at: "2026-09-02T00:00:00Z",
};

describe("Home client", () => {
  test("lists homes and normalizes a null collection", async () => {
    server.use(http.get("https://api.nature.global/1/homes", () => HttpResponse.json(null)));
    const homes = await createNatureRemo({ accessToken: "test-token" }).homes.list();

    expect(homes).toEqual([]);
  });

  test("resolves a Home name before listing its Remos", async () => {
    server.use(
      http.get("https://api.nature.global/1/homes", () =>
        HttpResponse.json([{ ...home, id: "home-2", name: "Office" }, home]),
      ),
      http.get("https://api.nature.global/1/homes/home-1/devices", () => HttpResponse.json([remo])),
    );

    const remos = await createNatureRemo({ accessToken: "test-token" }).homes.listRemos({
      target: "home",
    });

    expect(remos).toEqual([remo]);
  });

  test("lists Home Members directly by Home ID", async () => {
    const member = { role: "owner", user: { id: "user-1", nickname: "Owner" } };
    server.use(
      http.get("https://api.nature.global/1/homes/home-1/users", () => HttpResponse.json([member])),
    );

    const members = await createNatureRemo({ accessToken: "test-token" }).homes.listMembers({
      id: "home-1",
    });

    expect(members).toEqual([member]);
  });
});
