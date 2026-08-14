"use client";

import { AppointmentCard } from "@/components/organisms/AppointmentCard";
import { EmptyCitas } from "@/components/organisms/EmptyCitas";
import type { CitaView } from "@/types/cita";

interface AppointmentListProps {
  citas: CitaView[];
  /** Forwarded to each card so deletions can be optimistic. */
  onDeleted?: (citaId: string) => void;
}

export function AppointmentList({ citas, onDeleted }: AppointmentListProps) {
  if (citas.length === 0) {
    return <EmptyCitas />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {citas.map((cita) => (
        <AppointmentCard key={cita.id} cita={cita} onDeleted={onDeleted} />
      ))}
    </div>
  );
}
