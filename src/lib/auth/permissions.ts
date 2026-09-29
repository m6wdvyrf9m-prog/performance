import { RoleName } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { assertAllowed } from "@/lib/errors";
import type { CurrentUser } from "./types";

export function isHqAdmin(user: CurrentUser) {
  return user.roles.includes(RoleName.HQ_ADMIN);
}

export function isFacilitator(user: CurrentUser) {
  return user.roles.includes(RoleName.FACILITATOR);
}

export function isParticipant(user: CurrentUser) {
  return user.roles.includes(RoleName.PARTICIPANT);
}

export async function canManageGroup(user: CurrentUser, groupId: string) {
  if (isHqAdmin(user)) {
    return true;
  }

  if (!isFacilitator(user)) {
    return false;
  }

  const assignment = await db.facilitatorAssignment.findUnique({
    where: {
      groupId_facilitatorId: {
        groupId,
        facilitatorId: user.id,
      },
    },
  });

  return Boolean(assignment);
}

export async function requireCanManageGroup(user: CurrentUser, groupId: string) {
  assertAllowed(await canManageGroup(user, groupId), "You can only manage groups assigned to you");
}

export async function canAccessParticipantGroup(user: CurrentUser, groupId: string) {
  if (isHqAdmin(user) || (await canManageGroup(user, groupId))) {
    return true;
  }

  const membership = await db.groupMembership.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  return membership?.status === "ACTIVE";
}

export async function requireCanAccessParticipantGroup(user: CurrentUser, groupId: string) {
  assertAllowed(await canAccessParticipantGroup(user, groupId), "You can only access your own workshop group");
}

export function requireCanAccessMdle(user: CurrentUser, targetUserId: string) {
  assertAllowed(user.id === targetUserId, "A participant's My Discovery Learning Experience is private");
}
