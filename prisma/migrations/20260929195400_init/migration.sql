-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('HQ_ADMIN', 'FACILITATOR', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "GroupMembershipRole" AS ENUM ('PARTICIPANT');

-- CreateEnum
CREATE TYPE "GroupMembershipStatus" AS ENUM ('ACTIVE', 'REMOVED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('COLOUR_CARDS');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('NOT_STARTED', 'LIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('NOT_STARTED', 'ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CardColour" AS ENUM ('BLUE', 'RED', 'GREEN', 'YELLOW');

-- CreateEnum
CREATE TYPE "CardInstanceStatus" AS ENUM ('ASSIGNED', 'KEPT', 'RECEIVED', 'RETURNED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "CardTransferType" AS ENUM ('KEPT', 'SENT', 'ACCEPTED', 'RETURNED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "SavedCardSource" AS ENUM ('SELF_KEPT', 'RECEIVED_FROM_PEER');

-- CreateEnum
CREATE TYPE "LearningArtifactKind" AS ENUM ('SAVED_CARD', 'ACTIVITY_COMPLETION', 'REFLECTION', 'RESOURCE', 'INSIGHTS_PROFILE', 'TPI_RESULT', 'LEADERSHIP_360_RESULT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoleName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "GroupMembershipRole" NOT NULL DEFAULT 'PARTICIPANT',
    "status" "GroupMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilitatorAssignment" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "facilitatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacilitatorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityDefinition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitySession" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivitySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityParticipation" (
    "id" TEXT NOT NULL,
    "activitySessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ActivityParticipation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardDefinition" (
    "id" TEXT NOT NULL,
    "colour" "CardColour" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "statement" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityCardInstance" (
    "id" TEXT NOT NULL,
    "activitySessionId" TEXT NOT NULL,
    "cardDefinitionId" TEXT NOT NULL,
    "originalAssignedUserId" TEXT NOT NULL,
    "currentOwnerId" TEXT,
    "senderId" TEXT,
    "recipientId" TEXT,
    "status" "CardInstanceStatus" NOT NULL DEFAULT 'ASSIGNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ActivityCardInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardTransfer" (
    "id" TEXT NOT NULL,
    "cardInstanceId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "type" "CardTransferType" NOT NULL,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activitySessionId" TEXT NOT NULL,
    "cardInstanceId" TEXT NOT NULL,
    "cardDefinitionId" TEXT NOT NULL,
    "source" "SavedCardSource" NOT NULL,
    "senderId" TEXT,
    "colourSnapshot" "CardColour" NOT NULL,
    "statementSnapshot" TEXT NOT NULL,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningArtifact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "LearningArtifactKind" NOT NULL,
    "title" TEXT NOT NULL,
    "activitySessionId" TEXT,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningArtifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "groupId" TEXT,
    "activitySessionId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightsProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalProfileId" TEXT,
    "profileDate" TIMESTAMP(3),
    "colourScores" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightsProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TPIAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalResultId" TEXT,
    "completedAt" TIMESTAMP(3),
    "resultSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TPIAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leadership360Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "externalResultId" TEXT,
    "completedAt" TIMESTAMP(3),
    "resultSummary" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leadership360Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_role_key" ON "UserRole"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProfile_userId_key" ON "LearningProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_groupId_userId_key" ON "GroupMembership"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "FacilitatorAssignment_groupId_facilitatorId_key" ON "FacilitatorAssignment"("groupId", "facilitatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityDefinition_key_key" ON "ActivityDefinition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityParticipation_activitySessionId_userId_key" ON "ActivityParticipation"("activitySessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CardDefinition_colour_sortOrder_key" ON "CardDefinition"("colour", "sortOrder");

-- CreateIndex
CREATE INDEX "ActivityCardInstance_activitySessionId_originalAssignedUser_idx" ON "ActivityCardInstance"("activitySessionId", "originalAssignedUserId");

-- CreateIndex
CREATE INDEX "ActivityCardInstance_activitySessionId_currentOwnerId_idx" ON "ActivityCardInstance"("activitySessionId", "currentOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "CardTransfer_idempotencyKey_key" ON "CardTransfer"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCard_userId_activitySessionId_cardInstanceId_key" ON "SavedCard"("userId", "activitySessionId", "cardInstanceId");

-- CreateIndex
CREATE INDEX "AuditEvent_groupId_createdAt_idx" ON "AuditEvent"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_activitySessionId_createdAt_idx" ON "AuditEvent"("activitySessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningProfile" ADD CONSTRAINT "LearningProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilitatorAssignment" ADD CONSTRAINT "FacilitatorAssignment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilitatorAssignment" ADD CONSTRAINT "FacilitatorAssignment_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "ActivityDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipation" ADD CONSTRAINT "ActivityParticipation_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "ActivitySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityParticipation" ADD CONSTRAINT "ActivityParticipation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCardInstance" ADD CONSTRAINT "ActivityCardInstance_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "ActivitySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCardInstance" ADD CONSTRAINT "ActivityCardInstance_cardDefinitionId_fkey" FOREIGN KEY ("cardDefinitionId") REFERENCES "CardDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCardInstance" ADD CONSTRAINT "ActivityCardInstance_originalAssignedUserId_fkey" FOREIGN KEY ("originalAssignedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCardInstance" ADD CONSTRAINT "ActivityCardInstance_currentOwnerId_fkey" FOREIGN KEY ("currentOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCardInstance" ADD CONSTRAINT "ActivityCardInstance_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityCardInstance" ADD CONSTRAINT "ActivityCardInstance_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTransfer" ADD CONSTRAINT "CardTransfer_cardInstanceId_fkey" FOREIGN KEY ("cardInstanceId") REFERENCES "ActivityCardInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTransfer" ADD CONSTRAINT "CardTransfer_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardTransfer" ADD CONSTRAINT "CardTransfer_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCard" ADD CONSTRAINT "SavedCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCard" ADD CONSTRAINT "SavedCard_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "ActivitySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCard" ADD CONSTRAINT "SavedCard_cardInstanceId_fkey" FOREIGN KEY ("cardInstanceId") REFERENCES "ActivityCardInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCard" ADD CONSTRAINT "SavedCard_cardDefinitionId_fkey" FOREIGN KEY ("cardDefinitionId") REFERENCES "CardDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningArtifact" ADD CONSTRAINT "LearningArtifact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningArtifact" ADD CONSTRAINT "LearningArtifact_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "ActivitySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_activitySessionId_fkey" FOREIGN KEY ("activitySessionId") REFERENCES "ActivitySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightsProfile" ADD CONSTRAINT "InsightsProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TPIAssessment" ADD CONSTRAINT "TPIAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leadership360Assessment" ADD CONSTRAINT "Leadership360Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
