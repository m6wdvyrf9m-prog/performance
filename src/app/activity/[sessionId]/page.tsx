import { ActivityStatus, CardInstanceStatus } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { InteractiveColourCard, ReadOnlyColourCard } from "@/components/activity/colour-card";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { requireCanAccessParticipantGroup } from "@/lib/auth/permissions";
import { requireSignedInPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AutoRefresh } from "@/lib/realtime/refresh";

export const dynamic = "force-dynamic";

export default async function ColourCardsActivityPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await requireSignedInPage();
  const { sessionId } = await params;

  const session = await db.activitySession.findUnique({
    where: { id: sessionId },
    include: {
      definition: true,
      group: {
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      cardInstances: {
        where: { currentOwnerId: user.id },
        include: {
          cardDefinition: true,
          sender: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    notFound();
  }

  await requireCanAccessParticipantGroup(user, session.groupId);

  const recipients = session.group.memberships
    .filter((membership) => membership.userId !== user.id)
    .map((membership) => ({
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
    }));

  const toExplore = session.cardInstances.filter((card) => card.status === CardInstanceStatus.ASSIGNED);
  const received = session.cardInstances.filter((card) => card.status === CardInstanceStatus.RECEIVED);
  const kept = session.cardInstances.filter((card) => card.status === CardInstanceStatus.KEPT);
  const decided = kept.length + received.length;
  const remaining = toExplore.length;

  return (
    <AppShell user={user}>
      <AutoRefresh intervalMs={4000} />
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">{session.group.name}</p>
          <h1 className="mt-2 text-3xl font-black text-tcw-plum">Colour Cards</h1>
          <p className="mt-2 text-tcw-ink/75">12 cards to explore · {decided} decided · {remaining} remaining</p>
        </div>
        <StatusPill status={session.status} />
      </div>

      {session.status === ActivityStatus.CLOSED ? (
        <section className="mt-8 glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-black text-tcw-plum">This activity is closed</h2>
          <p className="mt-2 text-tcw-ink/70">Your retained cards are saved in your My Discovery Learning Experience.</p>
          <div className="mt-5">
            <ButtonLink href={`/mdle/activity/${session.id}`}>Review completed activity</ButtonLink>
          </div>
        </section>
      ) : null}

      {session.status === ActivityStatus.NOT_STARTED ? (
        <section className="mt-8 glass-panel rounded-2xl p-6">
          <h2 className="text-xl font-black text-tcw-plum">Waiting for the facilitator</h2>
          <p className="mt-2 text-tcw-ink/70">Your cards will appear here once the activity is live.</p>
        </section>
      ) : null}

      {session.status === ActivityStatus.LIVE ? (
        <div className="mt-8 grid gap-6">
          {received.length > 0 ? (
            <section>
              <h2 className="text-xl font-black text-tcw-plum">Received Cards</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {received.map((card) => (
                  <InteractiveColourCard key={card.id} card={card} sessionId={session.id} recipients={recipients} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="text-xl font-black text-tcw-plum">To Explore</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {toExplore.map((card) => (
                <InteractiveColourCard key={card.id} card={card} sessionId={session.id} recipients={recipients} />
              ))}
            </div>
            {toExplore.length === 0 ? (
              <p className="rounded-xl bg-white/80 p-4 text-sm font-semibold text-tcw-ink/70">
                You have decided all cards currently in your hand.
              </p>
            ) : null}
          </section>

          <section>
            <h2 className="text-xl font-black text-tcw-plum">My Cards</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {kept.map((card) => (
                <ReadOnlyColourCard key={card.id} card={card} />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
