import { PageLayout } from "@/components/templates/PageLayout";
import { AppointmentForm } from "@/components/organisms/AppointmentForm";
import { requireSession } from "@/lib/auth/require-session";

export const dynamic = "force-dynamic";

export default async function NewCitaPage() {
  const session = await requireSession("/citas/nueva");

  return (
    <PageLayout
      title="Nueva cita"
      description="Creá una nueva cita. Los campos marcados con * son obligatorios."
      userLabel={session.email}
      userRole={session.role}
    >
      <div className="mx-auto max-w-2xl rounded-lg border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
        <AppointmentForm mode="create" />
      </div>
    </PageLayout>
  );
}
