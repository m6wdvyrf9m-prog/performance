import { redirect } from "next/navigation";
import { RoleName } from "@/generated/prisma/client";
import { AppShell } from "@/components/shell/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { requireSignedInPage } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function FacilitatorDashboardPage() {
  const user = await requireSignedInPage();
  if (!user.roles.includes(RoleName.FACILITATOR) && !user.roles.includes(RoleName.HQ_ADMIN)) {
    redirect("/");
  }

  const where = user.roles.includes(RoleName.HQ_ADMIN) ? {} : { facilitatorAssignments: { some: { facilitatorId: user.id } } };
  const groups = await db.group.findMany({
    where,
    include: {
      memberships: { where: { status: "ACTIVE" } },
      activitySessions: { include: { definition: true }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell user={user}>
      <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Facilitator Dashboard</p>
      <h1 className="mt-2 text-3xl font-black text-tcw-plum">Assigned workshop groups</h1>
      <div className="mt-8 grid gap-4">
        {groups.map((group) => {
          const session = group.activitySessions[0];
          return (
            <article key={group.id} className="glass-panel rounded-2xl p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-black text-tcw-plum">{group.name}</h2>
                  <p className="mt-1 text-sm text-tcw-ink/70">{group.memberships.length} participants</p>
                </div>
                <div className="flex items-center gap-3">
                  {session ? <StatusPill status={session.status} /> : null}
                  <ButtonLink href={`/facilitator/groups/${group.id}`} variant="secondary">
                    Open
                  </ButtonLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
