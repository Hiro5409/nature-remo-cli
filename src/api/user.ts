import type { Client } from "../types/nature/client/index.ts";
import { get1UsersMe } from "../types/nature/sdk.gen.ts";
import type { UserResponse } from "../types/nature/types.gen.ts";
import { natureRemoRequest } from "./request.ts";

export type AuthenticatedUser = UserResponse;

export async function getAuthenticatedUser(client: Client): Promise<AuthenticatedUser> {
  const { data } = await natureRemoRequest(get1UsersMe({ client }));
  return data;
}
