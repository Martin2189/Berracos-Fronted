
export type Reserva = {
  id: string;
  correoCliente: string;
  nombre: string;
  telefono: string;
  servicio: string;
  barbero: string;
  fecha: string;
  hora: string;
  estado: "activa" | "cancelada";
};

const CLAVE_RESERVACIONES = "berracos-reservaciones";

export function obtenerReservaciones(): Reserva[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const datos = localStorage.getItem(CLAVE_RESERVACIONES);

    return datos ? (JSON.parse(datos) as Reserva[]) : [];
  } catch {
    return [];
  }
}

export function guardarReservaciones(reservaciones: Reserva[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CLAVE_RESERVACIONES,
    JSON.stringify(reservaciones)
  );
}

export function guardarReservacion(reserva: Reserva) {
  const reservaciones = obtenerReservaciones();

  reservaciones.push(reserva);

  guardarReservaciones(reservaciones);
}

export function cancelarReservacion(id: string) {
  const reservaciones = obtenerReservaciones();

  const actualizadas = reservaciones.map((reserva) =>
    reserva.id === id
      ? { ...reserva, estado: "cancelada" as const }
      : reserva
  );

  guardarReservaciones(actualizadas);
}
