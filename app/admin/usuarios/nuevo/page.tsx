import { PageLayout } from "@/components/templates/PageLayout";
import { UserForm } from "@/components/organisms/UserForm";
import { requireRole } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const session = await requireRole("admin", "/admin/usuarios/nuevo");

  return (
    <PageLayout
      title="Nuevo usuario"
      description="Creá un nuevo usuario. Los campos marcados con * son obligatorios."
      userLabel={session.email}
      userRole={session.role}
    >
      <div className="mx-auto max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        <UserForm mode="create" sessionId={session.userId} />
      </div>
    </PageLayout>
  );
}
