import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RoleName } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { AuthProvider, CurrentUser } from "./types";

const cookieName = process.env.DEV_AUTH_COOKIE_NAME ?? "tcw-dev-user";

export class DevCookieAuthProvider implements AuthProvider {
  async getCurrentUser(): Promise<CurrentUser | null> {
    const cookieStore = await cookies();
    const email = cookieStore.get(cookieName)?.value;

    if (!email) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((role) => role.role),
    };
  }
}

export const authProvider: AuthProvider = new DevCookieAuthProvider();

export async function getCurrentUser() {
  return authProvider.getCurrentUser();
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new AppError("Please sign in to continue", "UNAUTHENTICATED");
  }
  return user;
}

export async function requireSignedInPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export function hasRole(user: CurrentUser, role: RoleName) {
  return user.roles.includes(role);
}

export { cookieName };
