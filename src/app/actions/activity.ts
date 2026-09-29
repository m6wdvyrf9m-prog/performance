"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { closeActivity, keepCard, returnCard, sendCard, startColourCardsActivity } from "@/lib/services/activity-service";

const cardSchema = z.object({
  cardInstanceId: z.string().min(1),
  sessionId: z.string().min(1),
});

export async function startActivityAction(formData: FormData) {
  const actor = await requireCurrentUser();
  const sessionId = z.string().min(1).parse(formData.get("sessionId"));
  const groupId = z.string().min(1).parse(formData.get("groupId"));
  await startColourCardsActivity(actor, sessionId);
  revalidatePath(`/facilitator/groups/${groupId}`);
  redirect(`/facilitator/groups/${groupId}`);
}

export async function closeActivityAction(formData: FormData) {
  const actor = await requireCurrentUser();
  const sessionId = z.string().min(1).parse(formData.get("sessionId"));
  const groupId = z.string().min(1).parse(formData.get("groupId"));
  await closeActivity(actor, sessionId);
  revalidatePath(`/facilitator/groups/${groupId}`);
  redirect(`/facilitator/groups/${groupId}`);
}

export async function keepCardAction(formData: FormData) {
  const actor = await requireCurrentUser();
  const parsed = cardSchema.parse({
    cardInstanceId: formData.get("cardInstanceId"),
    sessionId: formData.get("sessionId"),
  });
  await keepCard(actor, parsed.cardInstanceId);
  revalidatePath(`/activity/${parsed.sessionId}`);
}

export async function returnCardAction(formData: FormData) {
  const actor = await requireCurrentUser();
  const parsed = cardSchema.parse({
    cardInstanceId: formData.get("cardInstanceId"),
    sessionId: formData.get("sessionId"),
  });
  await returnCard(actor, parsed.cardInstanceId);
  revalidatePath(`/activity/${parsed.sessionId}`);
}

export async function sendCardAction(formData: FormData) {
  const actor = await requireCurrentUser();
  const parsed = cardSchema.extend({
    recipientId: z.string().min(1),
  }).parse({
    cardInstanceId: formData.get("cardInstanceId"),
    sessionId: formData.get("sessionId"),
    recipientId: formData.get("recipientId"),
  });

  await sendCard({
    actor,
    cardInstanceId: parsed.cardInstanceId,
    recipientId: parsed.recipientId,
    idempotencyKey: randomUUID(),
  });
  revalidatePath(`/activity/${parsed.sessionId}`);
}

export async function acceptReceivedCardAction(formData: FormData) {
  const actor = await requireCurrentUser();
  const parsed = cardSchema.parse({
    cardInstanceId: formData.get("cardInstanceId"),
    sessionId: formData.get("sessionId"),
  });
  await keepCard(actor, parsed.cardInstanceId);
  revalidatePath(`/activity/${parsed.sessionId}`);
}
