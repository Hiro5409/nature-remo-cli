import { HttpResponse } from "msw/http";
import { describe, expect, test, vi } from "vite-plus/test";

import { createNatureRemo, type TvRecordedState } from "../index.ts";
import { server } from "../test/server.ts";
import {
  handleGet1Appliances,
  handlePost1AppliancesByApplianceidTv,
} from "../types/nature/msw.gen.ts";

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
      handleGet1Appliances({ body: [tv, { ...tv, id: "other-1", tv: null, type: "IR" }] }),
    );

    const result = await createNatureRemo({ accessToken: "test-token" }).tvs.list();

    expect(result).toEqual([tv]);
  });

  test.each(["power", "POWER"])(
    "sends the canonical button for %s and returns recorded state",
    async (button) => {
      const send = vi.fn(async ({ request }: { request: Request }) => {
        expect(new URLSearchParams(await request.text()).get("button")).toBe("power");
        return HttpResponse.json<TvRecordedState>({ input: "t" });
      });
      server.use(handleGet1Appliances({ body: [tv] }), handlePost1AppliancesByApplianceidTv(send));

      const state = await createNatureRemo({ accessToken: "test-token" }).tvs.press({ button });

      expect(state).toEqual({ input: "t" });
      expect(send).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ params: { applianceid: tv.id } }),
      );
    },
  );

  test("rejects a button not advertised by the TV", async () => {
    const press = vi.fn(() => HttpResponse.json(tv.tv.state));
    server.use(handleGet1Appliances({ body: [tv] }), handlePost1AppliancesByApplianceidTv(press));

    await expect(
      createNatureRemo({ accessToken: "test-token" }).tvs.press({ button: "mute" }),
    ).rejects.toMatchObject({
      code: "INVALID_ARGUMENT",
      message: expect.stringContaining("Supported buttons: power"),
    });
    expect(press).not.toHaveBeenCalled();
  });
});
