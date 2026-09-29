import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-tcw-plum text-white hover:bg-tcw-purple",
  secondary: "bg-white text-tcw-plum ring-1 ring-tcw-line hover:bg-tcw-mist",
  soft: "bg-tcw-blush text-tcw-plum hover:bg-white",
  danger: "bg-red-700 text-white hover:bg-red-800",
  ghost: "bg-transparent text-tcw-plum hover:bg-white/70",
};

export function Button({
  children,
  variant = "primary",
  className,
  type = "submit",
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      className={cn(
        "touch-target inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "touch-target inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
        variants[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
