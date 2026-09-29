import Link from "next/link";
import { LogOut, Shield, Sparkles, UsersRound } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { RoleName } from "@/generated/prisma/client";
import type { CurrentUser } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";

function roleLabel(role: RoleName) {
  return role.replace("_", " ");
}

export function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const isAdmin = user.roles.includes(RoleName.HQ_ADMIN);
  const isFacilitator = user.roles.includes(RoleName.FACILITATOR);

  return (
    <div>
      <header className="border-b border-white/60 bg-white/65 backdrop-blur">
        <div className="page-shell flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-tcw-plum text-white shadow-soft">
              <Sparkles size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-black text-tcw-plum">Team Performance</span>
              <span className="block text-xs font-semibold text-tcw-ink/65">by The Colour Works</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-tcw-plum" aria-label="Main navigation">
            {isAdmin ? (
              <Link className="rounded-lg px-3 py-2 hover:bg-white" href="/admin">
                <Shield className="mr-1 inline" size={16} aria-hidden="true" />
                Admin
              </Link>
            ) : null}
            {isFacilitator ? (
              <Link className="rounded-lg px-3 py-2 hover:bg-white" href="/facilitator">
                <UsersRound className="mr-1 inline" size={16} aria-hidden="true" />
                Facilitator
              </Link>
            ) : null}
            <Link className="rounded-lg px-3 py-2 hover:bg-white" href="/participant">
              Dashboard
            </Link>
            <Link className="rounded-lg px-3 py-2 hover:bg-white" href="/mdle">
              My Discovery Learning Experience
            </Link>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right text-xs text-tcw-ink/70">
              <p className="font-bold text-tcw-ink">{user.name}</p>
              <p>{user.roles.map(roleLabel).join(" · ")}</p>
            </div>
            <form action={logoutAction}>
              <Button variant="ghost" className="px-3" aria-label="Sign out">
                <LogOut size={17} aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="page-shell py-8 md:py-10">{children}</main>
    </div>
  );
}
