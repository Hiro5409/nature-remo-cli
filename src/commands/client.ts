import { resolveAccessToken } from "../config/access-token.ts";
import { createNatureRemo, type NatureRemo } from "../index.ts";

export async function authenticatedNatureRemo(): Promise<NatureRemo> {
  const { token } = await resolveAccessToken();
  return createNatureRemo({ accessToken: token });
}
