import { notFound } from "next/navigation";
import { PageLayout } from "@/components/templates/PageLayout";
import { UserForm } from "@/components/organisms/UserForm";
import { userService } from "@/services/users";
import { requireRole } from "@/lib/auth/require-session";
import { prismaRoleToName } from "@/types/user";

export const dynamic = "force-dynamic";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("admin");
  const { id } = await params;
  const user = await userService.findById(id);
  if (!user) {
    notFound();
  }

  return (
    <PageLayout
      title="Editar usuario"
      description={user.name || user.email}
      userLabel={session.email}
      userRole={session.role}
    >
      <div className="mx-auto max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        <UserForm
          mode="edit"
          userId={user.id}
          defaults={{
            email: user.email,
            name: user.name,
            role: prismaRoleToName(user.role),
          }}
        />
      </div>
    </PageLayout>
  );
}
