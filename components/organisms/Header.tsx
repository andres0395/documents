import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { LogoutButton } from "@/components/molecules/LogoutButton";
import { Badge } from "@/components/atoms/Badge";
import type { RoleName } from "@/types/user";
import { cn } from "@/lib/cn";

interface HeaderProps {
  /** Display label for the signed-in user. Falls back to email. */
  userLabel: string;
  /** User's role — drives the nav links and the role badge. */
  userRole: RoleName;
}

const NAV_LINKS: Array<{ href: string; label: string; roles: ReadonlySet<RoleName> }> = [
  { href: "/citas", label: "Mis citas", roles: new Set<RoleName>(["admin", "editor"]) },
  { href: "/admin/usuarios", label: "Usuarios", roles: new Set<RoleName>(["admin"]) },
];

export function Header({ userLabel, userRole }: HeaderProps) {
  const visibleLinks = NAV_LINKS.filter((link) => link.roles.has(userRole));

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/65">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-100"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-white"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </span>
          {APP_NAME}
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 sm:flex">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors",
                "hover:bg-zinc-800 hover:text-zinc-100",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge tone={userRole === "admin" ? "indigo" : "neutral"}>
            {userRole === "admin" ? "Admin" : "Editor"}
          </Badge>
          <span
            className="hidden truncate text-xs text-zinc-400 sm:inline"
            title={userLabel}
          >
            {userLabel}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
