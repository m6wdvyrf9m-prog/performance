import {
  ActivityStatus,
  ActivityType,
  GroupMembershipRole,
  GroupMembershipStatus,
  PrismaClient,
  RoleName,
} from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { colourCardSeeds } from "../src/lib/cards/card-data";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/team_performance_tcw?schema=public";
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const facilitators = [
  { name: "Andy Dowling", email: "andy.dowling@tcw.example" },
  { name: "Luke Wiltshire", email: "luke.wiltshire@tcw.example" },
  { name: "Matthew Cook", email: "matthew.cook@tcw.example" },
];

const participants = [
  "Amara Patel",
  "Ben Carter",
  "Chloe Morgan",
  "Daniel Hughes",
  "Ella Thompson",
  "Freya Bennett",
  "George Wilson",
  "Hannah Clarke",
  "Isaac Turner",
  "Jasmine Reed",
  "Kai Robinson",
  "Leah Scott",
  "Maya Evans",
  "Noah Phillips",
  "Olivia Price",
  "Priya Shah",
  "Sam Walker",
  "Zoe Mitchell",
].map((name) => ({
  name,
  email: `${name.toLowerCase().replaceAll(" ", ".")}@participant.example`,
}));

async function upsertUser(input: { name: string; email: string }, role: RoleName) {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: { name: input.name },
    create: {
      name: input.name,
      email: input.email,
      learningProfile: { create: {} },
    },
  });

  await prisma.userRole.upsert({
    where: { userId_role: { userId: user.id, role } },
    update: {},
    create: { userId: user.id, role },
  });

  return user;
}

async function main() {
  const admin = await upsertUser(
    { name: "TCW HQ Admin", email: "admin@tcw.example" },
    RoleName.HQ_ADMIN,
  );

  const facilitatorUsers = [];
  for (const facilitator of facilitators) {
    facilitatorUsers.push(await upsertUser(facilitator, RoleName.FACILITATOR));
  }

  const participantUsers = [];
  for (const participant of participants) {
    participantUsers.push(await upsertUser(participant, RoleName.PARTICIPANT));
  }

  const definition = await prisma.activityDefinition.upsert({
    where: { key: "colour-cards" },
    update: {
      name: "Colour Cards",
      type: ActivityType.COLOUR_CARDS,
      description: "A tactile Insights Discovery workshop activity for exploring behavioural statements.",
    },
    create: {
      key: "colour-cards",
      name: "Colour Cards",
      type: ActivityType.COLOUR_CARDS,
      description: "A tactile Insights Discovery workshop activity for exploring behavioural statements.",
    },
  });

  for (const card of colourCardSeeds) {
    await prisma.cardDefinition.upsert({
      where: { colour_sortOrder: { colour: card.colour, sortOrder: card.sortOrder } },
      update: { statement: card.statement },
      create: card,
    });
  }

  const group = await prisma.group.upsert({
    where: { id: "demo-tcw-discovery-workshop" },
    update: { name: "TCW Discovery Workshop Demo" },
    create: {
      id: "demo-tcw-discovery-workshop",
      name: "TCW Discovery Workshop Demo",
    },
  });

  const assignedFacilitator = facilitatorUsers[0];
  await prisma.facilitatorAssignment.upsert({
    where: {
      groupId_facilitatorId: {
        groupId: group.id,
        facilitatorId: assignedFacilitator.id,
      },
    },
    update: {},
    create: {
      groupId: group.id,
      facilitatorId: assignedFacilitator.id,
    },
  });

  for (const participant of participantUsers.slice(0, 10)) {
    await prisma.groupMembership.upsert({
      where: { groupId_userId: { groupId: group.id, userId: participant.id } },
      update: {
        status: GroupMembershipStatus.ACTIVE,
        removedAt: null,
      },
      create: {
        groupId: group.id,
        userId: participant.id,
        role: GroupMembershipRole.PARTICIPANT,
        status: GroupMembershipStatus.ACTIVE,
      },
    });
  }

  await prisma.activitySession.upsert({
    where: { id: "demo-colour-cards-session" },
    update: {
      status: ActivityStatus.NOT_STARTED,
      startedAt: null,
      closedAt: null,
    },
    create: {
      id: "demo-colour-cards-session",
      groupId: group.id,
      definitionId: definition.id,
      status: ActivityStatus.NOT_STARTED,
    },
  });

  await prisma.auditEvent.create({
    data: {
      actorUserId: admin.id,
      action: "SEED_DEMO_DATA",
      entityType: "Group",
      entityId: group.id,
      groupId: group.id,
      metadata: {
        participantCount: 10,
        facilitator: assignedFacilitator.email,
        cardDefinitions: colourCardSeeds.length,
      },
    },
  });

  console.log("Seeded Team Performance by The Colour Works demo data");
  console.log("Admin: admin@tcw.example");
  console.log("Facilitator: andy.dowling@tcw.example");
  console.log("Demo participant: amara.patel@participant.example");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
