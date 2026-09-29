import { PlayCircle, SquareCheckBig } from "lucide-react";
import { notFound } from "next/navigation";
import { closeActivityAction, startActivityAction } from "@/app/actions/activity";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { ActivityStatus } from "@/generated/prisma/client";
import { requireCanManageGroup } from "@/lib/auth/permissions";
import { requireSignedInPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AutoRefresh } from "@/lib/realtime/refresh";

export const dynamic = "force-dynamic";

function countWhere<T>(items: T[], predicate: (item: T) => boolean) {
  return items.filter(predicate).length;
}

export default async function FacilitatorGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await requireSignedInPage();
  const { groupId } = await params;
  await requireCanManageGroup(user, groupId);

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: { where: { status: "ACTIVE" }, include: { user: true }, orderBy: { createdAt: "asc" } },
      facilitatorAssignments: { include: { facilitator: true } },
      activitySessions: {
        include: {
          definition: true,
          cardInstances: true,
          participations: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!group) {
    notFound();
  }

  const session = group.activitySessions[0];
  const cards = session?.cardInstances ?? [];
  const kept = countWhere(cards, (card) => card.status === "KEPT" || card.status === "FINALIZED");
  const given = countWhere(cards, (card) => Boolean(card.recipientId));
  const returned = countWhere(cards, (card) => card.status === "RETURNED");
  const undecided = countWhere(cards, (card) => card.status === "ASSIGNED");

  return (
    <AppShell user={user}>
      <AutoRefresh intervalMs={4500} />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Facilitator workspace</p>
          <h1 className="mt-2 text-3xl font-black text-tcw-plum">{group.name}</h1>
          <p className="mt-2 text-tcw-ink/70">{group.memberships.length} active participants</p>
        </div>
        {session ? <StatusPill status={session.status} /> : null}
      </div>

      {session ? (
        <section className="mt-8 glass-panel rounded-2xl p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-tcw-plum">{session.definition.name}</h2>
              <p className="mt-1 text-sm text-tcw-ink/70">{session.definition.description}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {session.status === ActivityStatus.NOT_STARTED ? (
                <form action={startActivityAction}>
                  <input type="hidden" name="sessionId" value={session.id} />
                  <input type="hidden" name="groupId" value={group.id} />
                  <Button>
                    <PlayCircle size={18} aria-hidden="true" />
                    Start Activity
                  </Button>
                </form>
              ) : null}

              {session.status === ActivityStatus.LIVE ? (
                <form action={closeActivityAction} className="grid gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
                  <input type="hidden" name="sessionId" value={session.id} />
                  <input type="hidden" name="groupId" value={group.id} />
                  <label className="text-sm font-semibold text-red-950">
                    <input className="mr-2" type="checkbox" required />
                    Confirm final close and save all retained cards
                  </label>
                  <Button variant="danger">
                    <SquareCheckBig size={18} aria-hidden="true" />
                    Close Activity
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-5 grid gap-3 md:grid-cols-4">
        {[
          ["Kept", kept],
          ["Given", given],
          ["Returned", returned],
          ["Still undecided", undecided],
        ].map(([label, value]) => (
          <div key={label} className="glass-panel rounded-2xl p-5">
            <p className="text-sm font-bold text-tcw-ink/60">{label}</p>
            <p className="mt-2 text-3xl font-black text-tcw-plum">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 glass-panel rounded-2xl p-5">
        <h2 className="text-lg font-black text-tcw-plum">Participants</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {group.memberships.map((membership) => {
            const owned = cards.filter((card) => card.currentOwnerId === membership.userId);
            return (
              <div key={membership.id} className="rounded-lg bg-white p-3">
                <p className="font-bold">{membership.user.name}</p>
                <p className="text-sm text-tcw-ink/65">{membership.user.email}</p>
                <p className="mt-2 text-xs font-bold uppercase text-tcw-berry">{owned.length} cards currently owned</p>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
