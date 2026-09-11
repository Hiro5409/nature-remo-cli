import { http, HttpResponse } from "msw";
import { describe, expect, test, vi } from "vite-plus/test";

import { createNatureRemo } from "../index.ts";
import { server } from "../test/server.ts";

const tv = {
  id: "tv-1",
  image: "ico_tv",
  model: null,
  nickname: "Living room TV",
  signals: [],
  tv: {
    buttons: [{ image: "ico_power", label: "Power", name: "power" }],
    layout: null,
    state: { input: "t" },
  },
  type: "TV",
};

describe("TV client", () => {
  test("lists only appliances with TV capability", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([tv, { ...tv, id: "other-1", tv: null, type: "IR" }]),
      ),
    );

    const result = await createNatureRemo({ accessToken: "test-token" }).tvs.list();

    expect(result).toEqual([tv]);
  });

  test.each(["power", "POWER"])(
    "sends the canonical button for %s and returns recorded state",
    async (button) => {
      const send = vi.fn(async ({ request }: { request: Request }) => {
        expect(new URLSearchParams(await request.text()).get("button")).toBe("power");
        return HttpResponse.json({ input: "t" });
      });
      server.use(
        http.get("https://api.nature.global/1/appliances", () => HttpResponse.json([tv])),
        http.post("https://api.nature.global/1/appliances/tv-1/tv", send),
      );

      const state = await createNatureRemo({ accessToken: "test-token" }).tvs.press({ button });

      expect(state).toEqual({ input: "t" });
      expect(send).toHaveBeenCalledOnce();
    },
  );

  test("rejects a button not advertised by the TV", async () => {
    const press = vi.fn(() => HttpResponse.json(tv.tv.state));
    server.use(
      http.get("https://api.nature.global/1/appliances", () => HttpResponse.json([tv])),
      http.post("https://api.nature.global/1/appliances/tv-1/tv", press),
    );

    await expect(
      createNatureRemo({ accessToken: "test-token" }).tvs.press({ button: "mute" }),
    ).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
      message: expect.stringContaining("Supported buttons: power"),
    });
    expect(press).not.toHaveBeenCalled();
  });
});
