import { PageLayout } from "@/components/templates/PageLayout";
import { AppointmentForm } from "@/components/organisms/AppointmentForm";

export default function NewCitaPage() {
  return (
    <PageLayout
      title="Nueva cita"
      description="Creá una nueva cita. Los campos marcados con * son obligatorios."
    >
      <div className="mx-auto max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        <AppointmentForm mode="create" />
      </div>
    </PageLayout>
  );
}
