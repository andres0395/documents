import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/get-current-session";
import { LoginForm } from "@/components/organisms/LoginForm";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Already signed in? Skip the form.
  const session = await getCurrentSession();
  if (session) {
    redirect("/citas");
  }

  const { next } = await searchParams;
  // Defensive: only allow relative paths that start with a single slash.
  // The Server Action re-validates this with Zod, but we keep it tight
  // here too so the hidden input never carries garbage.
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/citas";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12">
      {/* Subtle radial glow behind the card. Pure CSS, no extra deps. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_55%)]"
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
            aria-hidden="true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">
            {APP_NAME}
          </h1>
          <p className="text-sm text-zinc-400">Iniciá sesión para continuar</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl shadow-black/50 backdrop-blur">
          <LoginForm next={safeNext} />
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Acceso restringido · Las cuentas se crean por administrador
        </p>
      </div>
    </div>
  );
}
