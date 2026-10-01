import { HttpResponse } from "msw/http";
import { describe, expect, test, vi } from "vite-plus/test";

import { createNatureRemo, type LightRecordedState } from "../index.ts";
import { server } from "../test/server.ts";
import {
  handleGet1Appliances,
  handlePost1AppliancesByApplianceidLight,
} from "../types/nature/msw.gen.ts";

const light = {
  id: "light-1",
  image: "ico_light",
  light: {
    buttons: [{ image: "ico_on", label: "On", name: "on" }],
    state: { brightness: "100", last_button: "on", power: "on" },
  },
  model: null,
  nickname: "Living room light",
  signals: [],
  type: "LIGHT",
};

describe("light client", () => {
  test("lists only appliances with light capability", async () => {
    server.use(
      handleGet1Appliances({
        body: [light, { ...light, id: "other-1", light: null, type: "IR" }],
      }),
    );

    const result = await createNatureRemo({ accessToken: "test-token" }).lights.list();

    expect(result).toEqual([light]);
  });

  test("presses an advertised button and returns recorded state", async () => {
    const send = vi.fn(async ({ request }: { request: Request }) => {
      expect(new URLSearchParams(await request.text()).get("button")).toBe("on");
      return HttpResponse.json<LightRecordedState>({
        brightness: "100",
        last_button: "on",
        power: "on",
      });
    });
    server.use(
      handleGet1Appliances({ body: [light] }),
      handlePost1AppliancesByApplianceidLight(send),
    );

    const state = await createNatureRemo({ accessToken: "test-token" }).lights.press({
      button: "on",
    });

    expect(state).toEqual({ brightness: "100", last_button: "on", power: "on" });
    expect(send).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ params: { applianceid: light.id } }),
    );
  });

  test("rejects a button when controls are unavailable", async () => {
    const press = vi.fn(() => HttpResponse.json(light.light.state));
    server.use(
      handleGet1Appliances({ body: [{ ...light, light: { ...light.light, buttons: null } }] }),
      handlePost1AppliancesByApplianceidLight(press),
    );

    await expect(
      createNatureRemo({ accessToken: "test-token" }).lights.press({ button: "on" }),
    ).rejects.toMatchObject({ code: "INVALID_ARGUMENT" });
    expect(press).not.toHaveBeenCalled();
  });
});
