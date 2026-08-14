import Link from "next/link";
import { PageLayout } from "@/components/templates/PageLayout";
import { CitasExplorer } from "@/components/organisms/CitasExplorer";
import { citaService } from "@/services/citas";
import { toCitaDTO } from "@/types/cita";
import { Button } from "@/components/atoms/Button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 6;

export default async function CitasPage() {
  const initial = await citaService.listPaginated({}, 0, PAGE_SIZE);
  const total = initial.total;

  return (
    <PageLayout
      title="Mis citas"
      description={
        total === 0
          ? "Aún no registraste ninguna cita."
          : `Tenés ${total} cita${total === 1 ? "" : "s"} registrada${total === 1 ? "" : "s"}.`
      }
      actions={
        <Link href="/citas/nueva">
          <Button variant="primary">+ Nueva cita</Button>
        </Link>
      }
    >
      <CitasExplorer
        initial={{
          data: initial.data.map(toCitaDTO),
          total: initial.total,
        }}
        pageSize={PAGE_SIZE}
      />
    </PageLayout>
  );
}
