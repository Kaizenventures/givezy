import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/** Returns true when the caller has a valid admin session. */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session;
}
