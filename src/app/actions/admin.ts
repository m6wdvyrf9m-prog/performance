"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ActivityStatus, ActivityType, GroupMembershipRole, GroupMembershipStatus } from "@/generated/prisma/client";
import { requireCurrentUser } from "@/lib/auth/session";
import { isHqAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { assertAllowed } from "@/lib/errors";

const createGroupSchema = z.object({
  name: z.string().min(3).max(120),
  facilitatorId: z.string().min(1),
  participantIds: z.array(z.string()).min(1),
});

function selectedValues(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

export async function createGroupAction(formData: FormData) {
  const actor = await requireCurrentUser();
  assertAllowed(isHqAdmin(actor), "Only HQ Admins can create groups");

  const parsed = createGroupSchema.parse({
    name: formData.get("name"),
    facilitatorId: formData.get("facilitatorId"),
    participantIds: selectedValues(formData, "participantIds"),
  });

  const group = await db.$transaction(async (tx) => {
    const activityDefinition = await tx.activityDefinition.findUniqueOrThrow({
      where: { key: "colour-cards" },
    });

    const createdGroup = await tx.group.create({
      data: {
        name: parsed.name,
        memberships: {
          create: parsed.participantIds.map((userId) => ({
            userId,
            role: GroupMembershipRole.PARTICIPANT,
            status: GroupMembershipStatus.ACTIVE,
          })),
        },
        facilitatorAssignments: {
          create: {
            facilitatorId: parsed.facilitatorId,
          },
        },
        activitySessions: {
          create: {
            definitionId: activityDefinition.id,
            status: ActivityStatus.NOT_STARTED,
          },
        },
      },
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: actor.id,
        action: "GROUP_CREATED",
        entityType: "Group",
        entityId: createdGroup.id,
        groupId: createdGroup.id,
        metadata: {
          participantCount: parsed.participantIds.length,
          facilitatorId: parsed.facilitatorId,
          activityType: ActivityType.COLOUR_CARDS,
        },
      },
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: actor.id,
        action: "FACILITATOR_ASSIGNED",
        entityType: "FacilitatorAssignment",
        groupId: createdGroup.id,
        metadata: { facilitatorId: parsed.facilitatorId },
      },
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: actor.id,
        action: "MEMBERSHIP_ADDED",
        entityType: "GroupMembership",
        groupId: createdGroup.id,
        metadata: { participantIds: parsed.participantIds },
      },
    });

    return createdGroup;
  });

  revalidatePath("/admin");
  redirect(`/admin/groups/${group.id}`);
}

export async function removeGroupMemberAction(formData: FormData) {
  const actor = await requireCurrentUser();
  assertAllowed(isHqAdmin(actor), "Only HQ Admins can remove group members");

  const parsed = z.object({
    groupId: z.string().min(1),
    userId: z.string().min(1),
  }).parse({
    groupId: formData.get("groupId"),
    userId: formData.get("userId"),
  });

  await db.$transaction(async (tx) => {
    await tx.groupMembership.update({
      where: {
        groupId_userId: {
          groupId: parsed.groupId,
          userId: parsed.userId,
        },
      },
      data: {
        status: GroupMembershipStatus.REMOVED,
        removedAt: new Date(),
      },
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: actor.id,
        action: "MEMBERSHIP_REMOVED",
        entityType: "GroupMembership",
        groupId: parsed.groupId,
        metadata: { userId: parsed.userId },
      },
    });
  });

  revalidatePath(`/admin/groups/${parsed.groupId}`);
}

export async function assignFacilitatorAction(formData: FormData) {
  const actor = await requireCurrentUser();
  assertAllowed(isHqAdmin(actor), "Only HQ Admins can assign facilitators");

  const parsed = z.object({
    groupId: z.string().min(1),
    facilitatorId: z.string().min(1),
  }).parse({
    groupId: formData.get("groupId"),
    facilitatorId: formData.get("facilitatorId"),
  });

  await db.$transaction(async (tx) => {
    await tx.facilitatorAssignment.upsert({
      where: {
        groupId_facilitatorId: {
          groupId: parsed.groupId,
          facilitatorId: parsed.facilitatorId,
        },
      },
      update: {},
      create: parsed,
    });

    await tx.auditEvent.create({
      data: {
        actorUserId: actor.id,
        action: "FACILITATOR_ASSIGNED",
        entityType: "FacilitatorAssignment",
        groupId: parsed.groupId,
        metadata: { facilitatorId: parsed.facilitatorId },
      },
    });
  });

  revalidatePath(`/admin/groups/${parsed.groupId}`);
}
