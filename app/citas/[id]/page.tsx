import { notFound } from "next/navigation";
import { PageLayout } from "@/components/templates/PageLayout";
import { AppointmentForm } from "@/components/organisms/AppointmentForm";
import { citaService } from "@/services/citas";

export const dynamic = "force-dynamic";

export default async function EditCitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cita = await citaService.findById(id);
  if (!cita) {
    notFound();
  }

  return (
    <PageLayout
      title="Editar cita"
      description={cita.nombre}
    >
      <div className="mx-auto max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        <AppointmentForm
          mode="edit"
          citaId={cita.id}
          defaults={{
            nombre: cita.nombre,
            fecha: cita.fecha,
            hora: cita.hora,
            lugar: cita.lugar,
            archivoNombre: cita.archivoNombre,
            archivoUrl: cita.archivoUrl,
          }}
        />
      </div>
    </PageLayout>
  );
}
