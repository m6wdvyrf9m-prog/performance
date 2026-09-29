import { ActivityStatus, LearningArtifactKind, SavedCardSource } from "@/generated/prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { ReadOnlyColourCard } from "@/components/activity/colour-card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireCanAccessMdle } from "@/lib/auth/permissions";
import { requireSignedInPage } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MdlePage() {
  const user = await requireSignedInPage();
  requireCanAccessMdle(user, user.id);

  const [savedCards, completions, activeMemberships] = await Promise.all([
    db.savedCard.findMany({
      where: { userId: user.id },
      include: {
        cardDefinition: true,
        activitySession: { include: { definition: true, group: true } },
      },
      orderBy: { finalizedAt: "desc" },
    }),
    db.learningArtifact.findMany({
      where: { userId: user.id, kind: LearningArtifactKind.ACTIVITY_COMPLETION },
      include: { activitySession: { include: { definition: true, group: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.groupMembership.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: {
        group: {
          include: {
            activitySessions: {
              where: { status: ActivityStatus.LIVE },
              include: { definition: true },
            },
          },
        },
      },
    }),
  ]);

  return (
    <AppShell user={user}>
      <section className="glass-panel rounded-2xl p-6 md:p-8">
        <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">MDLE</p>
        <h1 className="mt-2 text-3xl font-black text-tcw-plum">My Discovery Learning Experience</h1>
        <p className="mt-2 max-w-3xl text-tcw-ink/75">
          Your retained workshop cards, completed activities, and future personal learning modules are collected here.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["My Insights Discovery", "My Team Performance", "My Leadership 360", "My Resources"].map((title) => (
          <div key={title} className="rounded-2xl border border-tcw-line bg-white/75 p-5">
            <p className="font-black text-tcw-plum">{title}</p>
            <p className="mt-2 text-sm font-semibold text-tcw-ink/55">Coming soon</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black text-tcw-plum">My Cards</h2>
        {savedCards.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No saved cards yet">
              Cards you keep or receive during a closed activity will be saved here permanently.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {savedCards.slice(0, 8).map((savedCard) => (
              <div key={savedCard.id}>
                <ReadOnlyColourCard
                  card={{
                    id: savedCard.cardInstanceId,
                    status: "FINALIZED",
                    cardDefinition: {
                      colour: savedCard.colourSnapshot,
                      statement: savedCard.statementSnapshot,
                    },
                  }}
                />
                <p className="mt-2 text-sm font-semibold text-tcw-ink/65">
                  {savedCard.source === SavedCardSource.RECEIVED_FROM_PEER ? "Given by someone in your workshop" : "Kept by you"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black text-tcw-plum">My Activities</h2>
        <div className="mt-4 grid gap-4">
          {activeMemberships.flatMap((membership) =>
            membership.group.activitySessions.map((session) => (
              <article key={session.id} className="glass-panel rounded-2xl p-5">
                <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Current workshop/activity</p>
                <h3 className="mt-2 text-xl font-black text-tcw-plum">{session.definition.name}</h3>
                <p className="mt-1 text-sm text-tcw-ink/70">{membership.group.name}</p>
                <div className="mt-4">
                  <ButtonLink href={`/activity/${session.id}`}>Open Activity</ButtonLink>
                </div>
              </article>
            )),
          )}

          {completions.map((artifact) => (
            <article key={artifact.id} className="glass-panel rounded-2xl p-5">
              <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Completed activity</p>
              <h3 className="mt-2 text-xl font-black text-tcw-plum">{artifact.activitySession?.definition.name ?? artifact.title}</h3>
              <p className="mt-1 text-sm text-tcw-ink/70">
                Completed: {artifact.createdAt.toLocaleDateString()} · {artifact.activitySession?.group.name}
              </p>
              <div className="mt-4">
                {artifact.activitySessionId ? (
                  <ButtonLink href={`/mdle/activity/${artifact.activitySessionId}`} variant="secondary">
                    Open read-only view
                  </ButtonLink>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
