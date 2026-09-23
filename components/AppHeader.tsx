"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LEGAL_DISCLAIMER, APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Documents" },
  { href: "/compare", label: "Compare" },
  { href: "/assistant", label: "Assistant" },
  { href: "/checklist", label: "Checklist" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-stone-300 bg-[var(--paper)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-lg font-semibold tracking-tight text-stone-900">{APP_NAME}</p>
          <p className="text-sm text-stone-600">{APP_TAGLINE}</p>
        </div>
        <nav aria-label="Primary">
          <ul className="flex flex-wrap gap-2">
            {LINKS.map((link) => {
              const current = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={cn(
                      "inline-flex rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
                      current
                        ? "bg-navy text-white"
                        : "text-stone-800 hover:bg-stone-200",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
        {LEGAL_DISCLAIMER}
      </p>
    </header>
  );
}
