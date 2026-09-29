import {
  ActivityStatus,
  CardInstanceStatus,
  CardTransferType,
  LearningArtifactKind,
  Prisma,
  SavedCardSource,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { AppError, assertAllowed } from "@/lib/errors";
import { requireCanManageGroup } from "@/lib/auth/permissions";
import type { CurrentUser } from "@/lib/auth/types";
import { selectFixedColourHand } from "./activity-rules";

type Tx = Prisma.TransactionClient;

async function getSessionOrThrow(tx: Tx, sessionId: string) {
  const session = await tx.activitySession.findUnique({
    where: { id: sessionId },
    include: { group: true, definition: true },
  });

  if (!session) {
    throw new AppError("Activity session not found", "NOT_FOUND");
  }

  return session;
}

async function activeGroupParticipantIds(tx: Tx, groupId: string) {
  const memberships = await tx.groupMembership.findMany({
    where: { groupId, status: "ACTIVE" },
    select: { userId: true },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((membership) => membership.userId);
}

async function createAudit(
  tx: Tx,
  input: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    groupId?: string;
    activitySessionId?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  await tx.auditEvent.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      groupId: input.groupId,
      activitySessionId: input.activitySessionId,
      metadata: input.metadata ?? {},
    },
  });
}

export async function startColourCardsActivity(actor: CurrentUser, sessionId: string) {
  return db.$transaction(async (tx) => {
    const session = await getSessionOrThrow(tx, sessionId);
    await requireCanManageGroup(actor, session.groupId);

    if (session.status === ActivityStatus.CLOSED) {
      throw new AppError("Closed activities cannot be restarted", "CONFLICT");
    }

    const existingAssignmentCount = await tx.activityCardInstance.count({
      where: { activitySessionId: sessionId },
    });

    if (session.status === ActivityStatus.LIVE || existingAssignmentCount > 0) {
      return tx.activitySession.findUniqueOrThrow({
        where: { id: sessionId },
        include: { cardInstances: true },
      });
    }

    const participantIds = await activeGroupParticipantIds(tx, session.groupId);
    const definitions = await tx.cardDefinition.findMany();
    const selected = selectFixedColourHand({
      participantIds,
      definitions,
      existingAssignmentCount,
    });

    await tx.activitySession.update({
      where: { id: sessionId },
      data: {
        status: ActivityStatus.LIVE,
        startedAt: new Date(),
      },
    });

    await tx.activityParticipation.createMany({
      data: participantIds.map((userId) => ({
        activitySessionId: sessionId,
        userId,
        status: "ACTIVE",
        startedAt: new Date(),
      })),
      skipDuplicates: true,
    });

    await tx.activityCardInstance.createMany({
      data: selected.map((assignment) => ({
        activitySessionId: sessionId,
        cardDefinitionId: assignment.cardDefinitionId,
        originalAssignedUserId: assignment.participantId,
        currentOwnerId: assignment.participantId,
        status: CardInstanceStatus.ASSIGNED,
      })),
    });

    await createAudit(tx, {
      actorUserId: actor.id,
      action: "ACTIVITY_STARTED",
      entityType: "ActivitySession",
      entityId: sessionId,
      groupId: session.groupId,
      activitySessionId: sessionId,
      metadata: { participantCount: participantIds.length, cardCount: selected.length },
    });

    return tx.activitySession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { cardInstances: true },
    });
  });
}

async function getOwnedLiveCard(tx: Tx, actor: CurrentUser, cardInstanceId: string) {
  const card = await tx.activityCardInstance.findUnique({
    where: { id: cardInstanceId },
    include: {
      activitySession: true,
      cardDefinition: true,
    },
  });

  if (!card) {
    throw new AppError("Card not found", "NOT_FOUND");
  }

  if (card.activitySession.status !== ActivityStatus.LIVE) {
    throw new AppError("Cards can only be changed while the activity is live", "CONFLICT");
  }

  assertAllowed(card.currentOwnerId === actor.id, "You can only change your own cards");
  assertAllowed(card.status !== CardInstanceStatus.RETURNED, "Returned cards cannot be changed");
  assertAllowed(card.status !== CardInstanceStatus.FINALIZED, "Finalized cards cannot be changed");

  return card;
}

export async function keepCard(actor: CurrentUser, cardInstanceId: string) {
  return db.$transaction(async (tx) => {
    const card = await getOwnedLiveCard(tx, actor, cardInstanceId);

    if (card.status === CardInstanceStatus.KEPT) {
      return card;
    }

    assertAllowed(
      card.status === CardInstanceStatus.ASSIGNED || card.status === CardInstanceStatus.RECEIVED,
      "Only assigned or received cards can be kept",
    );

    const updated = await tx.activityCardInstance.update({
      where: { id: cardInstanceId },
      data: {
        status: CardInstanceStatus.KEPT,
        decidedAt: new Date(),
      },
    });

    await tx.cardTransfer.create({
      data: {
        cardInstanceId,
        fromUserId: actor.id,
        toUserId: actor.id,
        type: card.senderId ? CardTransferType.ACCEPTED : CardTransferType.KEPT,
      },
    });

    await createAudit(tx, {
      actorUserId: actor.id,
      action: card.senderId ? "CARD_ACCEPTED" : "CARD_KEPT",
      entityType: "ActivityCardInstance",
      entityId: cardInstanceId,
      groupId: card.activitySession.groupId,
      activitySessionId: card.activitySessionId,
      metadata: { cardDefinitionId: card.cardDefinitionId },
    });

    return updated;
  });
}

export async function returnCard(actor: CurrentUser, cardInstanceId: string) {
  return db.$transaction(async (tx) => {
    const card = await getOwnedLiveCard(tx, actor, cardInstanceId);
    assertAllowed(card.status === CardInstanceStatus.ASSIGNED, "Only undecided assigned cards can be returned");

    const updated = await tx.activityCardInstance.update({
      where: { id: cardInstanceId },
      data: {
        status: CardInstanceStatus.RETURNED,
        currentOwnerId: null,
        decidedAt: new Date(),
      },
    });

    await tx.cardTransfer.create({
      data: {
        cardInstanceId,
        fromUserId: actor.id,
        type: CardTransferType.RETURNED,
      },
    });

    await createAudit(tx, {
      actorUserId: actor.id,
      action: "CARD_RETURNED",
      entityType: "ActivityCardInstance",
      entityId: cardInstanceId,
      groupId: card.activitySession.groupId,
      activitySessionId: card.activitySessionId,
      metadata: { cardDefinitionId: card.cardDefinitionId },
    });

    return updated;
  });
}

export async function sendCard(input: {
  actor: CurrentUser;
  cardInstanceId: string;
  recipientId: string;
  idempotencyKey: string;
}) {
  return db.$transaction(async (tx) => {
    const existingTransfer = await tx.cardTransfer.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { cardInstance: true },
    });

    if (existingTransfer) {
      return existingTransfer.cardInstance;
    }

    const card = await getOwnedLiveCard(tx, input.actor, input.cardInstanceId);
    assertAllowed(card.status === CardInstanceStatus.ASSIGNED, "Only undecided assigned cards can be sent");
    assertAllowed(input.recipientId !== input.actor.id, "You cannot send a card to yourself");

    const senderMembership = await tx.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: card.activitySession.groupId,
          userId: input.actor.id,
        },
      },
    });
    const recipientMembership = await tx.groupMembership.findUnique({
      where: {
        groupId_userId: {
          groupId: card.activitySession.groupId,
          userId: input.recipientId,
        },
      },
    });

    assertAllowed(senderMembership?.status === "ACTIVE", "Only active group members can send cards");
    assertAllowed(recipientMembership?.status === "ACTIVE", "Cards can only be sent to people in this workshop group");

    const updated = await tx.activityCardInstance.update({
      where: { id: input.cardInstanceId },
      data: {
        status: CardInstanceStatus.RECEIVED,
        currentOwnerId: input.recipientId,
        senderId: input.actor.id,
        recipientId: input.recipientId,
        decidedAt: new Date(),
      },
    });

    await tx.cardTransfer.create({
      data: {
        cardInstanceId: input.cardInstanceId,
        fromUserId: input.actor.id,
        toUserId: input.recipientId,
        type: CardTransferType.SENT,
        idempotencyKey: input.idempotencyKey,
      },
    });

    await createAudit(tx, {
      actorUserId: input.actor.id,
      action: "CARD_SENT",
      entityType: "ActivityCardInstance",
      entityId: input.cardInstanceId,
      groupId: card.activitySession.groupId,
      activitySessionId: card.activitySessionId,
      metadata: {
        cardDefinitionId: card.cardDefinitionId,
        recipientId: input.recipientId,
      },
    });

    return updated;
  });
}

export async function closeActivity(actor: CurrentUser, sessionId: string) {
  return db.$transaction(async (tx) => {
    const session = await getSessionOrThrow(tx, sessionId);
    await requireCanManageGroup(actor, session.groupId);

    if (session.status === ActivityStatus.NOT_STARTED) {
      throw new AppError("Activities must be started before they can be closed", "CONFLICT");
    }

    if (session.status === ActivityStatus.CLOSED) {
      return session;
    }

    const retainedCards = await tx.activityCardInstance.findMany({
      where: {
        activitySessionId: sessionId,
        status: { in: [CardInstanceStatus.KEPT, CardInstanceStatus.RECEIVED] },
        currentOwnerId: { not: null },
      },
      include: { cardDefinition: true },
    });

    for (const card of retainedCards) {
      const ownerId = card.currentOwnerId;
      if (!ownerId) {
        continue;
      }

      const source =
        card.senderId && card.senderId !== ownerId
          ? SavedCardSource.RECEIVED_FROM_PEER
          : SavedCardSource.SELF_KEPT;

      await tx.savedCard.upsert({
        where: {
          userId_activitySessionId_cardInstanceId: {
            userId: ownerId,
            activitySessionId: sessionId,
            cardInstanceId: card.id,
          },
        },
        update: {},
        create: {
          userId: ownerId,
          activitySessionId: sessionId,
          cardInstanceId: card.id,
          cardDefinitionId: card.cardDefinitionId,
          source,
          senderId: card.senderId,
          colourSnapshot: card.cardDefinition.colour,
          statementSnapshot: card.cardDefinition.statement,
        },
      });
    }

    const participantIds = await activeGroupParticipantIds(tx, session.groupId);
    for (const userId of participantIds) {
      const cards = retainedCards.filter((card) => card.currentOwnerId === userId);
      const returnedCount = await tx.activityCardInstance.count({
        where: {
          activitySessionId: sessionId,
          originalAssignedUserId: userId,
          status: CardInstanceStatus.RETURNED,
        },
      });
      const givenCount = await tx.activityCardInstance.count({
        where: {
          activitySessionId: sessionId,
          originalAssignedUserId: userId,
          recipientId: { not: null },
        },
      });

      await tx.learningArtifact.create({
        data: {
          userId,
          kind: LearningArtifactKind.ACTIVITY_COMPLETION,
          title: "Colour Cards completed",
          activitySessionId: sessionId,
          data: {
            retainedCards: cards.length,
            receivedCards: cards.filter((card) => card.senderId && card.senderId !== userId).length,
            givenCards: givenCount,
            returnedCards: returnedCount,
            originallyAssigned: 12,
          },
        },
      });

      await tx.activityParticipation.upsert({
        where: {
          activitySessionId_userId: {
            activitySessionId: sessionId,
            userId,
          },
        },
        update: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        create: {
          activitySessionId: sessionId,
          userId,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }

    await tx.activityCardInstance.updateMany({
      where: {
        activitySessionId: sessionId,
        status: { in: [CardInstanceStatus.KEPT, CardInstanceStatus.RECEIVED] },
      },
      data: { status: CardInstanceStatus.FINALIZED },
    });

    const updated = await tx.activitySession.update({
      where: { id: sessionId },
      data: {
        status: ActivityStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    await createAudit(tx, {
      actorUserId: actor.id,
      action: "ACTIVITY_CLOSED",
      entityType: "ActivitySession",
      entityId: sessionId,
      groupId: session.groupId,
      activitySessionId: sessionId,
      metadata: { savedCards: retainedCards.length },
    });

    return updated;
  });
}
