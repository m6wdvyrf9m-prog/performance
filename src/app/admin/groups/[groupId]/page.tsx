import { notFound, redirect } from "next/navigation";
import { RoleName } from "@/generated/prisma/client";
import { assignFacilitatorAction, removeGroupMemberAction } from "@/app/actions/admin";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { requireSignedInPage } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { userDirectoryProvider } from "@/lib/user-directory";

export const dynamic = "force-dynamic";

export default async function AdminGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const user = await requireSignedInPage();
  if (!user.roles.includes(RoleName.HQ_ADMIN)) {
    redirect("/");
  }

  const { groupId } = await params;
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: "asc" } },
      facilitatorAssignments: { include: { facilitator: true } },
      activitySessions: { include: { definition: true, cardInstances: true }, orderBy: { createdAt: "asc" } },
      auditEvents: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!group) {
    notFound();
  }

  const session = group.activitySessions[0];
  const facilitators = await userDirectoryProvider.listFacilitators();

  return (
    <AppShell user={user}>
      <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Group overview</p>
      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-black text-tcw-plum">{group.name}</h1>
        {session ? <StatusPill status={session.status} /> : null}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg font-black text-tcw-plum">Facilitator</h2>
          <ul className="mt-4 grid gap-2">
            {group.facilitatorAssignments.map((assignment) => (
              <li key={assignment.id} className="rounded-lg bg-white p-3">
                <span className="font-bold">{assignment.facilitator.name}</span>
                <span className="block text-sm text-tcw-ink/65">{assignment.facilitator.email}</span>
              </li>
            ))}
          </ul>
          <form action={assignFacilitatorAction} className="mt-4 grid gap-2 rounded-xl bg-white p-3">
            <input type="hidden" name="groupId" value={group.id} />
            <label className="text-sm font-bold text-tcw-ink/80" htmlFor="facilitatorId">
              Assign another facilitator
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select
                id="facilitatorId"
                name="facilitatorId"
                required
                className="touch-target rounded-lg border border-tcw-line bg-white px-3 py-2 text-sm"
              >
                <option value="">Choose facilitator</option>
                {facilitators.map((facilitator) => (
                  <option key={facilitator.id} value={facilitator.id}>
                    {facilitator.name}
                  </option>
                ))}
              </select>
              <Button variant="secondary">Assign</Button>
            </div>
          </form>
        </section>
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg font-black text-tcw-plum">Activity</h2>
          {session ? (
            <div className="mt-4 rounded-lg bg-white p-3">
              <p className="font-bold">{session.definition.name}</p>
              <p className="mt-1 text-sm text-tcw-ink/65">{session.cardInstances.length} card instances created</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="mt-5 glass-panel rounded-2xl p-5">
        <h2 className="text-lg font-black text-tcw-plum">Participants</h2>
        <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {group.memberships.map((membership) => (
            <div key={membership.id} className="rounded-lg bg-white p-3">
              <p className="font-bold">{membership.user.name}</p>
              <p className="text-sm text-tcw-ink/65">{membership.user.email}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase text-tcw-berry">{membership.status}</p>
                {membership.status === "ACTIVE" ? (
                  <form action={removeGroupMemberAction}>
                    <input type="hidden" name="groupId" value={group.id} />
                    <input type="hidden" name="userId" value={membership.userId} />
                    <Button variant="ghost" className="min-h-0 px-3 py-1 text-xs">
                      Remove
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 glass-panel rounded-2xl p-5">
        <h2 className="text-lg font-black text-tcw-plum">Recent audit history</h2>
        <ul className="mt-4 grid gap-2 text-sm">
          {group.auditEvents.map((event) => (
            <li key={event.id} className="rounded-lg bg-white p-3">
              <span className="font-bold">{event.action}</span>
              <span className="ml-2 text-tcw-ink/60">{event.createdAt.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
