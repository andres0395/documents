import Link from "next/link";
import { PageLayout } from "@/components/templates/PageLayout";
import { UsersExplorer } from "@/components/organisms/UsersExplorer";
import { userService } from "@/services/users";
import { toUserPublic } from "@/types/user";
import { requireRole } from "@/lib/auth/require-session";
import { Button } from "@/components/atoms/Button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 8;

export default async function AdminUsersPage() {
  const session = await requireRole("admin", "/admin/usuarios");
  const initial = await userService.listPaginated({}, 0, PAGE_SIZE);
  const total = initial.total;

  return (
    <PageLayout
      title="Usuarios"
      description={
        total === 0
          ? "Aún no creaste ningún usuario."
          : `Hay ${total} usuario${total === 1 ? "" : "s"} registrado${total === 1 ? "" : "s"}.`
      }
      userLabel={session.email}
      userRole={session.role}
      actions={
        <Link href="/admin/usuarios/nuevo">
          <Button variant="primary">+ Nuevo usuario</Button>
        </Link>
      }
    >
      <UsersExplorer
        initial={{
          data: initial.data.map(toUserPublic),
          total: initial.total,
        }}
        currentUserId={session.userId}
        pageSize={PAGE_SIZE}
      />
    </PageLayout>
  );
}
