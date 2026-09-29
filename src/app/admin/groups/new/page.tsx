import { createGroupAction } from "@/app/actions/admin";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { RoleName } from "@/generated/prisma/client";
import { requireSignedInPage } from "@/lib/auth/session";
import { userDirectoryProvider } from "@/lib/user-directory";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const user = await requireSignedInPage();
  if (!user.roles.includes(RoleName.HQ_ADMIN)) {
    redirect("/");
  }

  const [facilitators, participants] = await Promise.all([
    userDirectoryProvider.listFacilitators(),
    userDirectoryProvider.listParticipants(),
  ]);

  return (
    <AppShell user={user}>
      <div className="max-w-5xl">
        <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Group creation wizard</p>
        <h1 className="mt-2 text-3xl font-black text-tcw-plum">Prepare a workshop group</h1>
      </div>

      <form action={createGroupAction} className="mt-8 grid gap-6">
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg font-black text-tcw-plum">1. Group details</h2>
          <label className="mt-4 grid gap-2 text-sm font-bold text-tcw-ink/80" htmlFor="name">
            Group name
            <input
              id="name"
              name="name"
              required
              minLength={3}
              className="touch-target rounded-lg border border-tcw-line bg-white px-3 py-2"
              placeholder="TCW Discovery Workshop Demo"
            />
          </label>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg font-black text-tcw-plum">2. Assign facilitator</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {facilitators.map((facilitator) => (
              <label key={facilitator.id} className="rounded-xl border border-tcw-line bg-white p-4 font-semibold">
                <input className="mr-2" required type="radio" name="facilitatorId" value={facilitator.id} />
                {facilitator.name}
                <span className="mt-1 block text-xs font-normal text-tcw-ink/60">{facilitator.email}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg font-black text-tcw-plum">3. Add participants</h2>
          <p className="mt-1 text-sm text-tcw-ink/70">
            The current list comes from MockUserDirectoryProvider and is shaped so an Insights API adapter can replace it.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {participants.map((participant) => (
              <label key={participant.id} className="rounded-xl border border-tcw-line bg-white p-4 font-semibold">
                <input className="mr-2" type="checkbox" name="participantIds" value={participant.id} />
                {participant.name}
                <span className="mt-1 block text-xs font-normal text-tcw-ink/60">{participant.email}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button>Create group</Button>
        </div>
      </form>
    </AppShell>
  );
}
