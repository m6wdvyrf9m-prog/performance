import type { CardColour } from "@/generated/prisma/client";

export type ColourCardDefinition = {
  id: string;
  colour: CardColour;
  statement: string;
};

export type GeneratedCardAssignment = {
  participantId: string;
  cardDefinitionId: string;
  colour: CardColour;
};

export type RuleUser = {
  id: string;
  roles: Array<"HQ_ADMIN" | "FACILITATOR" | "PARTICIPANT">;
  assignedGroupIds?: string[];
  memberGroupIds?: string[];
};

export function canManageGroupRule(user: RuleUser, groupId: string) {
  return user.roles.includes("HQ_ADMIN") || Boolean(user.assignedGroupIds?.includes(groupId));
}

export function canAccessGroupRule(user: RuleUser, groupId: string) {
  return canManageGroupRule(user, groupId) || Boolean(user.memberGroupIds?.includes(groupId));
}

export function canAccessMdleRule(currentUserId: string, targetUserId: string) {
  return currentUserId === targetUserId;
}

export function ensureTransferAllowed(input: {
  activityStatus: "NOT_STARTED" | "LIVE" | "CLOSED";
  senderId: string;
  recipientId: string;
  senderGroupIds: string[];
  recipientGroupIds: string[];
  cardOwnerId: string;
  alreadyTransferredWithKey?: boolean;
}) {
  if (input.alreadyTransferredWithKey) {
    return "IDEMPOTENT_REPLAY" as const;
  }

  if (input.activityStatus !== "LIVE") {
    throw new Error("Cards can only move while the activity is live");
  }

  if (input.senderId === input.recipientId) {
    throw new Error("Participants cannot send cards to themselves");
  }

  if (input.cardOwnerId !== input.senderId) {
    throw new Error("Participants can only move their own cards");
  }

  const sharedGroup = input.senderGroupIds.some((groupId) => input.recipientGroupIds.includes(groupId));
  if (!sharedGroup) {
    throw new Error("Cards can only be sent inside the workshop group");
  }

  return "ALLOWED" as const;
}

export function selectFixedColourHand(input: {
  participantIds: string[];
  definitions: ColourCardDefinition[];
  existingAssignmentCount: number;
  random?: () => number;
}) {
  if (input.existingAssignmentCount > 0) {
    return [];
  }

  const random = input.random ?? Math.random;
  const assignments: GeneratedCardAssignment[] = [];
  const colours: CardColour[] = ["BLUE", "RED", "GREEN", "YELLOW"];

  for (const participantId of input.participantIds) {
    for (const colour of colours) {
      const pool = input.definitions.filter((definition) => definition.colour === colour);
      const shuffled = [...pool].sort(() => random() - 0.5);
      const selected = shuffled.slice(0, 3);

      if (selected.length !== 3) {
        throw new Error(`Expected at least 3 ${colour} card definitions`);
      }

      for (const card of selected) {
        assignments.push({
          participantId,
          cardDefinitionId: card.id,
          colour,
        });
      }
    }
  }

  return assignments;
}

export function summariseColourDistribution(assignments: GeneratedCardAssignment[]) {
  return assignments.reduce<Record<string, number>>((accumulator, assignment) => {
    const key = `${assignment.participantId}:${assignment.colour}`;
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

export type FinalisableCard = {
  id: string;
  currentOwnerId: string | null;
  senderId: string | null;
  status: "ASSIGNED" | "KEPT" | "RECEIVED" | "RETURNED" | "FINALIZED";
};

export function finaliseRetainedCardsForMdle(cards: FinalisableCard[]) {
  return cards
    .filter((card) => card.currentOwnerId && (card.status === "KEPT" || card.status === "RECEIVED"))
    .map((card) => ({
      cardInstanceId: card.id,
      userId: card.currentOwnerId as string,
      source:
        card.senderId && card.senderId !== card.currentOwnerId
          ? ("RECEIVED_FROM_PEER" as const)
          : ("SELF_KEPT" as const),
    }));
}
