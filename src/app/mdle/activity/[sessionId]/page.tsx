import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { ReadOnlyColourCard } from "@/components/activity/colour-card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireCanAccessMdle } from "@/lib/auth/permissions";
import { requireSignedInPage } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type CompletionData = {
  originallyAssigned?: number;
  retainedCards?: number;
  receivedCards?: number;
  givenCards?: number;
  returnedCards?: number;
};

export default async function CompletedActivityPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await requireSignedInPage();
  requireCanAccessMdle(user, user.id);
  const { sessionId } = await params;

  const session = await db.activitySession.findUnique({
    where: { id: sessionId },
    include: { definition: true, group: true },
  });

  if (!session) {
    notFound();
  }

  const [savedCards, completion] = await Promise.all([
    db.savedCard.findMany({
      where: { userId: user.id, activitySessionId: sessionId },
      include: { cardDefinition: true },
      orderBy: { finalizedAt: "asc" },
    }),
    db.learningArtifact.findFirst({
      where: { userId: user.id, activitySessionId: sessionId, kind: "ACTIVITY_COMPLETION" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data = (completion?.data ?? {}) as CompletionData;

  return (
    <AppShell user={user}>
      <section className="glass-panel rounded-2xl p-6 md:p-8">
        <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Read-only history</p>
        <h1 className="mt-2 text-3xl font-black text-tcw-plum">{session.definition.name}</h1>
        <p className="mt-2 text-tcw-ink/70">
          {session.group.name} · Completed {session.closedAt?.toLocaleDateString() ?? "recently"}
        </p>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-5">
        {[
          ["Originally assigned", data.originallyAssigned ?? 12],
          ["Retained", data.retainedCards ?? savedCards.length],
          ["Received", data.receivedCards ?? 0],
          ["Given", data.givenCards ?? 0],
          ["Returned", data.returnedCards ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="glass-panel rounded-2xl p-4">
            <p className="text-xs font-bold uppercase text-tcw-ink/60">{label}</p>
            <p className="mt-2 text-2xl font-black text-tcw-plum">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black text-tcw-plum">Cards retained in My Discovery Learning Experience</h2>
        {savedCards.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No retained cards saved">
              This can happen if the activity was closed before you kept or received cards.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {savedCards.map((savedCard) => (
              <ReadOnlyColourCard
                key={savedCard.id}
                card={{
                  id: savedCard.cardInstanceId,
                  status: "FINALIZED",
                  cardDefinition: {
                    colour: savedCard.colourSnapshot,
                    statement: savedCard.statementSnapshot,
                  },
                }}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
