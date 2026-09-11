import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vite-plus/test";

import { createNatureRemo, NatureRemoError } from "../index.ts";
import { server } from "../test/server.ts";

describe("Nature Remo client", () => {
  test("rejects a response missing required Nature Remo appliance fields", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json([
          { id: "appliance-1", model: null, nickname: "Living room", type: "AC" },
        ]),
      ),
    );

    const appliances = createNatureRemo({ accessToken: "test-token" }).appliances;

    await expect(appliances.list()).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  test("calls GET /1/appliances with bearer authentication", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer test-token");
        return HttpResponse.json([
          {
            id: "appliance-1",
            image: "ico_ac_1",
            model: null,
            nickname: "Living room",
            settings: {
              button: "",
              dir: "",
              dirh: "",
              mode: "cool",
              temp: "26",
              temp_unit: "c",
              updated_at: "2026-09-03T00:00:00Z",
              vol: "auto",
            },
            signals: [],
            type: "AC",
          },
        ]);
      }),
    );

    const appliances = await createNatureRemo({ accessToken: "test-token" }).appliances.list();

    expect(appliances).toHaveLength(1);
    expect(appliances[0]?.image).toBe("ico_ac_1");
    expect(appliances[0]?.nickname).toBe("Living room");
    expect(appliances[0]?.settings?.temp).toBe("26");
    expect(appliances[0]?.signals).toEqual([]);
  });

  test.each([
    { status: 403, code: "FORBIDDEN" },
    { status: 429, code: "RATE_LIMITED" },
  ])("preserves HTTP $status in the client error", async ({ status, code }) => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json({ message: "Rejected" }, { status }),
      ),
    );
    const remo = createNatureRemo({ accessToken: "test-token" });

    await expect(remo.appliances.list()).rejects.toMatchObject({ code, status });
  });

  test("classifies an invalid access token without exposing CLI concerns", async () => {
    server.use(
      http.get("https://api.nature.global/1/appliances", () =>
        HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
      ),
    );
    const appliances = createNatureRemo({ accessToken: "invalid-token" }).appliances;

    try {
      await appliances.list();
      throw new Error("Expected appliances.list() to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(NatureRemoError);
      expect(error).toMatchObject({ code: "UNAUTHORIZED", status: 401 });
      expect(error).not.toHaveProperty("exitCode");
      expect(error).not.toHaveProperty("hint");
    }
  });
});
