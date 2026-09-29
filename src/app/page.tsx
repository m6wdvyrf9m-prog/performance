import { redirect } from "next/navigation";
import { RoleName } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.roles.includes(RoleName.HQ_ADMIN)) {
    redirect("/admin");
  }

  if (user.roles.includes(RoleName.FACILITATOR)) {
    redirect("/facilitator");
  }

  redirect("/participant");
}
