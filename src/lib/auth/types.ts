import type { RoleName, User } from "@/generated/prisma/client";

export type CurrentUser = Pick<User, "id" | "email" | "name"> & {
  roles: RoleName[];
};

export type AuthProvider = {
  getCurrentUser(): Promise<CurrentUser | null>;
};
