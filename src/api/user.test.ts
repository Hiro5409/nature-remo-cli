import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vite-plus/test";

import { createNatureRemo } from "../index.ts";
import { server } from "../test/server.ts";

describe("authenticated User client", () => {
  test("returns the validated authenticated User", async () => {
    server.use(
      http.get("https://api.nature.global/1/users/me", () =>
        HttpResponse.json({
          country: "JP",
          distance_unit: "km",
          id: "user-1",
          nickname: "Owner",
          temp_unit: "c",
        }),
      ),
    );

    const user = await createNatureRemo({ accessToken: "test-token" }).user.get();

    expect(user).toEqual({
      country: "JP",
      distance_unit: "km",
      id: "user-1",
      nickname: "Owner",
      temp_unit: "c",
    });
  });
});
