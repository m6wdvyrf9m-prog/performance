import { ActivityStatus } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";

const styles = {
  [ActivityStatus.NOT_STARTED]: "bg-slate-100 text-slate-700 ring-slate-200",
  [ActivityStatus.LIVE]: "bg-green-100 text-green-800 ring-green-200",
  [ActivityStatus.CLOSED]: "bg-tcw-blush text-tcw-plum ring-tcw-line",
};

export function StatusPill({ status }: { status: ActivityStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1", styles[status])}>
      {status.replace("_", " ")}
    </span>
  );
}
