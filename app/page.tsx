import { redirect } from "next/navigation";

export default function HomePage() {
  // The proxy already redirects unauthenticated users to /login. An
  // authenticated user lands on /dashboard, which then routes to the
  // right home based on role.
  redirect("/dashboard");
}
