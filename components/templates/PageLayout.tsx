import type { ReactNode } from "react";
import { Header } from "@/components/organisms/Header";
import type { RoleName } from "@/types/user";

interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  userLabel: string;
  userRole: RoleName;
  children: ReactNode;
}

export function PageLayout({
  title,
  description,
  actions,
  userLabel,
  userRole,
  children,
}: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <Header userLabel={userLabel} userRole={userRole} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 text-sm text-zinc-400">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children}
      </main>
      <footer className="border-t border-zinc-900 px-4 py-4 text-center text-xs text-zinc-500 sm:px-6">
        {`© ${new Date().getFullYear()} Citas`}
      </footer>
    </div>
  );
}
