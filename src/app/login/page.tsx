import { LogIn } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const users = await db.user.findMany({
    include: { roles: true },
    orderBy: [{ name: "asc" }],
  });

  return (
    <main className="page-shell flex min-h-screen items-center justify-center py-10">
      <section className="glass-panel w-full max-w-xl rounded-2xl p-6 md:p-8">
        <p className="text-sm font-black uppercase tracking-wide text-tcw-berry">Development sign in</p>
        <h1 className="mt-3 text-3xl font-black text-tcw-plum md:text-4xl">Team Performance by The Colour Works</h1>
        <p className="mt-3 text-tcw-ink/75">
          Choose a seeded user to enter the Version 1 workshop experience. This development boundary can be replaced by
          production authentication later.
        </p>

        <form action={loginAction} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-tcw-ink/80" htmlFor="email">
            User
            <select id="email" name="email" required className="touch-target rounded-lg border border-tcw-line bg-white px-3 py-2">
              <option value="">Choose a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.email}>
                  {user.name} · {user.email} · {user.roles.map((role) => role.role).join(", ")}
                </option>
              ))}
            </select>
          </label>
          <Button className="w-full">
            <LogIn size={18} aria-hidden="true" />
            Sign in
          </Button>
        </form>
      </section>
    </main>
  );
}
