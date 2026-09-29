import { ActivityStatus } from "@/generated/prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { requireSignedInPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { AutoRefresh } from "@/lib/realtime/refresh";

export const dynamic = "force-dynamic";

export default async function ParticipantDashboardPage() {
  const user = await requireSignedInPage();

  const memberships = await db.groupMembership.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    include: {
      group: {
        include: {
          activitySessions: {
            include: { definition: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const liveSession = memberships
    .flatMap((membership) => membership.group.activitySessions.map((session) => ({ session, group: membership.group })))
    .find(({ session }) => session.status === ActivityStatus.LIVE);

  return (
    <AppShell user={user}>
      <AutoRefresh intervalMs={5000} />
      <section className="glass-panel rounded-2xl p-6 md:p-8">
        <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Participant Dashboard</p>
        <h1 className="mt-2 text-3xl font-black text-tcw-plum">Welcome, {user.name}</h1>
        <p className="mt-2 max-w-2xl text-tcw-ink/75">
          Your workshop activities and personal learning records live here as part of your My Discovery Learning
          Experience.
        </p>

        {liveSession ? (
          <div className="mt-8 rounded-2xl border border-tcw-pink/40 bg-white p-5 shadow-soft">
            <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Your workshop activity is live</p>
            <h2 className="mt-2 text-2xl font-black text-tcw-plum">{liveSession.session.definition.name}</h2>
            <p className="mt-1 text-tcw-ink/70">{liveSession.group.name}</p>
            <div className="mt-5">
              <ButtonLink href={`/activity/${liveSession.session.id}`}>Open Activity</ButtonLink>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState title="No live activity right now">
              When your facilitator starts Colour Cards, it will appear here automatically.
            </EmptyState>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4">
        {memberships.map((membership) => (
          <article key={membership.id} className="glass-panel rounded-2xl p-5">
            <h2 className="text-xl font-black text-tcw-plum">{membership.group.name}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {membership.group.activitySessions.map((session) => (
                <div key={session.id} className="rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{session.definition.name}</p>
                    <StatusPill status={session.status} />
                  </div>
                  <div className="mt-4">
                    {session.status === ActivityStatus.LIVE ? (
                      <ButtonLink href={`/activity/${session.id}`} variant="secondary">
                        Open Activity
                      </ButtonLink>
                    ) : session.status === ActivityStatus.CLOSED ? (
                      <ButtonLink href={`/mdle/activity/${session.id}`} variant="secondary">
                        Review in MDLE
                      </ButtonLink>
                    ) : (
                      <span className="text-sm font-semibold text-tcw-ink/60">Waiting for facilitator</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
