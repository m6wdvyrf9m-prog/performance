import { RoleName } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import type { DirectoryUser, UserDirectoryProvider } from "./types";

function toDirectoryUser(user: {
  id: string;
  name: string;
  email: string;
  roles: { role: RoleName }[];
}): DirectoryUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((role) => role.role),
  };
}

export class MockUserDirectoryProvider implements UserDirectoryProvider {
  async searchUsers(query = "") {
    const normalized = query.trim();
    const users = await db.user.findMany({
      where: normalized
        ? {
            OR: [
              { name: { contains: normalized, mode: "insensitive" } },
              { email: { contains: normalized, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: { roles: true },
      orderBy: [{ name: "asc" }],
      take: 50,
    });

    return users.map(toDirectoryUser);
  }

  async listFacilitators() {
    const users = await db.user.findMany({
      where: { roles: { some: { role: RoleName.FACILITATOR } } },
      include: { roles: true },
      orderBy: [{ name: "asc" }],
    });

    return users.map(toDirectoryUser);
  }

  async listParticipants() {
    const users = await db.user.findMany({
      where: { roles: { some: { role: RoleName.PARTICIPANT } } },
      include: { roles: true },
      orderBy: [{ name: "asc" }],
    });

    return users.map(toDirectoryUser);
  }
}
