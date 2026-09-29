import { describe, expect, it } from "vitest";
import { colourCardSeeds } from "@/lib/cards/card-data";
import {
  canAccessGroupRule,
  canAccessMdleRule,
  canManageGroupRule,
  ensureTransferAllowed,
  finaliseRetainedCardsForMdle,
  selectFixedColourHand,
  summariseColourDistribution,
} from "./activity-rules";

const definitions = colourCardSeeds.map((card) => ({
  id: `${card.colour}-${card.sortOrder}`,
  colour: card.colour,
  statement: card.statement,
}));

describe("Colour Cards business rules", () => {
  it("seeds exactly 100 card definitions with 25 statements per colour", () => {
    expect(colourCardSeeds).toHaveLength(100);
    expect(colourCardSeeds.filter((card) => card.colour === "BLUE")).toHaveLength(25);
    expect(colourCardSeeds.filter((card) => card.colour === "RED")).toHaveLength(25);
    expect(colourCardSeeds.filter((card) => card.colour === "GREEN")).toHaveLength(25);
    expect(colourCardSeeds.filter((card) => card.colour === "YELLOW")).toHaveLength(25);
    expect(colourCardSeeds[0]?.statement).toBe("I like to understand the facts before I make a decision.");
    expect(colourCardSeeds.at(-1)?.statement).toBe("I like inspiring other people to get involved.");
  });

  it("assigns exactly 12 cards to each participant", () => {
    const assignments = selectFixedColourHand({
      participantIds: ["p1", "p2", "p3"],
      definitions,
      existingAssignmentCount: 0,
      random: () => 0.25,
    });

    expect(assignments.filter((assignment) => assignment.participantId === "p1")).toHaveLength(12);
    expect(assignments.filter((assignment) => assignment.participantId === "p2")).toHaveLength(12);
    expect(assignments.filter((assignment) => assignment.participantId === "p3")).toHaveLength(12);
  });

  it("assigns three Blue, Red, Green, and Yellow cards per participant", () => {
    const assignments = selectFixedColourHand({
      participantIds: ["p1", "p2"],
      definitions,
      existingAssignmentCount: 0,
      random: () => 0.75,
    });
    const distribution = summariseColourDistribution(assignments);

    for (const participantId of ["p1", "p2"]) {
      expect(distribution[`${participantId}:BLUE`]).toBe(3);
      expect(distribution[`${participantId}:RED`]).toBe(3);
      expect(distribution[`${participantId}:GREEN`]).toBe(3);
      expect(distribution[`${participantId}:YELLOW`]).toBe(3);
    }
  });

  it("does not generate new cards when start is replayed after assignments exist", () => {
    const assignments = selectFixedColourHand({
      participantIds: ["p1"],
      definitions,
      existingAssignmentCount: 12,
    });

    expect(assignments).toEqual([]);
  });

  it("allows HQ Admins to manage every group", () => {
    expect(canManageGroupRule({ id: "admin", roles: ["HQ_ADMIN"] }, "group-a")).toBe(true);
  });

  it("allows facilitators to manage only assigned groups", () => {
    const facilitator = { id: "facilitator", roles: ["FACILITATOR" as const], assignedGroupIds: ["group-a"] };

    expect(canManageGroupRule(facilitator, "group-a")).toBe(true);
    expect(canManageGroupRule(facilitator, "group-b")).toBe(false);
  });

  it("allows participants to access only their own group", () => {
    const participant = { id: "participant", roles: ["PARTICIPANT" as const], memberGroupIds: ["group-a"] };

    expect(canAccessGroupRule(participant, "group-a")).toBe(true);
    expect(canAccessGroupRule(participant, "group-b")).toBe(false);
  });

  it("keeps MDLE private to the signed-in participant", () => {
    expect(canAccessMdleRule("p1", "p1")).toBe(true);
    expect(canAccessMdleRule("p1", "p2")).toBe(false);
  });

  it("rejects sending a card to yourself", () => {
    expect(() =>
      ensureTransferAllowed({
        activityStatus: "LIVE",
        senderId: "p1",
        recipientId: "p1",
        senderGroupIds: ["group-a"],
        recipientGroupIds: ["group-a"],
        cardOwnerId: "p1",
      }),
    ).toThrow("themselves");
  });

  it("rejects sending a card outside the workshop group", () => {
    expect(() =>
      ensureTransferAllowed({
        activityStatus: "LIVE",
        senderId: "p1",
        recipientId: "p2",
        senderGroupIds: ["group-a"],
        recipientGroupIds: ["group-b"],
        cardOwnerId: "p1",
      }),
    ).toThrow("inside the workshop group");
  });

  it("rejects changing someone else's card", () => {
    expect(() =>
      ensureTransferAllowed({
        activityStatus: "LIVE",
        senderId: "p1",
        recipientId: "p2",
        senderGroupIds: ["group-a"],
        recipientGroupIds: ["group-a"],
        cardOwnerId: "p3",
      }),
    ).toThrow("own cards");
  });

  it("rejects card changes before an activity is live", () => {
    expect(() =>
      ensureTransferAllowed({
        activityStatus: "NOT_STARTED",
        senderId: "p1",
        recipientId: "p2",
        senderGroupIds: ["group-a"],
        recipientGroupIds: ["group-a"],
        cardOwnerId: "p1",
      }),
    ).toThrow("activity is live");
  });

  it("rejects card changes after close", () => {
    expect(() =>
      ensureTransferAllowed({
        activityStatus: "CLOSED",
        senderId: "p1",
        recipientId: "p2",
        senderGroupIds: ["group-a"],
        recipientGroupIds: ["group-a"],
        cardOwnerId: "p1",
      }),
    ).toThrow("activity is live");
  });

  it("treats duplicate transfer submissions with the same key as idempotent replays", () => {
    expect(
      ensureTransferAllowed({
        activityStatus: "LIVE",
        senderId: "p1",
        recipientId: "p2",
        senderGroupIds: ["group-a"],
        recipientGroupIds: ["group-a"],
        cardOwnerId: "p1",
        alreadyTransferredWithKey: true,
      }),
    ).toBe("IDEMPOTENT_REPLAY");
  });

  it("finalises kept and received cards into MDLE while excluding returned or undecided cards", () => {
    const savedCards = finaliseRetainedCardsForMdle([
      { id: "kept", status: "KEPT", currentOwnerId: "p1", senderId: null },
      { id: "received", status: "RECEIVED", currentOwnerId: "p2", senderId: "p1" },
      { id: "returned", status: "RETURNED", currentOwnerId: null, senderId: null },
      { id: "undecided", status: "ASSIGNED", currentOwnerId: "p3", senderId: null },
    ]);

    expect(savedCards).toEqual([
      { cardInstanceId: "kept", userId: "p1", source: "SELF_KEPT" },
      { cardInstanceId: "received", userId: "p2", source: "RECEIVED_FROM_PEER" },
    ]);
  });
});
