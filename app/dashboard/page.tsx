import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";

/**
 * Server-side router. The proxy already ensures we're authenticated by
 * the time we get here, but `requireSession()` also gives us a typed
 * session for the role check.
 */
export default async function DashboardPage() {
  const session = await requireSession("/dashboard");
  if (session.role === "admin") {
    redirect("/admin/usuarios");
  }
  redirect("/citas");
}
