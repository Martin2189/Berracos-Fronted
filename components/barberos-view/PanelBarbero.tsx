
"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { UsuarioSesion } from "@/lib/sesion";

type Props = {
  usuario: UsuarioSesion;
};

type ReservaBarbero = {
  idReserva: number;
  nombre: string;
  correoCliente: string;
  servicio: string;
  tipoProducto: string;
  barbero: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: string;
  asistio: boolean | null;
};

export default function PanelBarbero({ usuario }: Props) {
  const [reservaciones, setReservaciones] = useState<ReservaBarbero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [error, setError] = useState("");

  const cargarReservaciones = useCallback(async () => {
    try {
      setError("");

      const respuesta = await api<ReservaBarbero[]>(
        "/api/reservas/barbero",
        { autenticado: true }
      );

      setReservaciones(respuesta);
    } catch (err) {
      console.error("Error al cargar reservaciones:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las reservaciones."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarReservaciones();
  }, [cargarReservaciones]);

  const aceptarCita = async (idReserva: number) => {
    if (!window.confirm("¿Deseas aceptar esta cita?")) return;

    try {
      setProcesando(idReserva);
      setError("");

      await api(`/api/reservas/${idReserva}/aceptar`, {
        method: "PUT",
        autenticado: true,
      });

      await cargarReservaciones();

      window.alert("La cita fue aceptada correctamente.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo aceptar la cita."
      );
    } finally {
      setProcesando(null);
    }
  };

  const cancelarCita = async (idReserva: number) => {
    if (!window.confirm("¿Estás seguro de cancelar esta reservación?")) {
      return;
    }

    try {
      setProcesando(idReserva);
      setError("");

      await api(`/api/reservas/${idReserva}/cancelar-barbero`, {
        method: "PUT",
        autenticado: true,
      });

      await cargarReservaciones();

      window.alert("La reservación fue cancelada correctamente.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cancelar la cita."
      );
    } finally {
      setProcesando(null);
    }
  };

  const registrarAsistencia = async (
    idReserva: number,
    asistio: boolean
  ) => {
    const mensaje = asistio
      ? "¿Confirmas que el cliente asistió a su cita?"
      : "¿Confirmas que el cliente no asistió a su cita?";

    if (!window.confirm(mensaje)) return;

    try {
      setProcesando(idReserva);
      setError("");

      await api(`/api/reservas/${idReserva}/asistencia`, {
        method: "PUT",
        autenticado: true,
        body: JSON.stringify({ asistio }),
      });

      await cargarReservaciones();

      window.alert(
        asistio
          ? "Asistencia registrada correctamente."
          : "Se registró que el cliente no asistió."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la asistencia."
      );
    } finally {
      setProcesando(null);
    }
  };

  const pendientes = reservaciones.filter(
    (reserva) => reserva.estado === "PENDIENTE"
  );

  const confirmadas = reservaciones.filter(
    (reserva) => reserva.estado === "CONFIRMADA"
  );

  const canceladas = reservaciones.filter(
    (reserva) => reserva.estado === "CANCELADA"
  );

  const completadas = reservaciones.filter(
    (reserva) => reserva.estado === "COMPLETADA"
  );

  const formatearFecha = (fecha: string) => {
    if (!fecha) return "Sin fecha";

    const [anio, mes, dia] = fecha.split("-");
    return `${dia}/${mes}/${anio}`;
  };

  const formatearHora = (hora: string) => {
    return hora ? hora.slice(0, 5) : "Sin hora";
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(precio ?? 0);
  };

  const obtenerEstado = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "Pendiente";
      case "CONFIRMADA":
        return "Confirmada";
      case "CANCELADA":
        return "Cancelada";
      case "COMPLETADA":
        return "Completada";
      default:
        return estado;
    }
  };

  return (
    <main className="panel-barbero">
      <section className="panel-barbero-encabezado">
        <span className="panel-barbero-etiqueta">
          PANEL DE CONTROL
        </span>

        <h1>Bienvenido, {usuario.nombre}</h1>

        <p>
          Consulta las reservaciones asignadas a tu cuenta
          y administra tus citas.
        </p>

        <div className="panel-barbero-perfil">
          <span>BARBERO</span>
          <span>ID: {usuario.idUsuario}</span>
          <span>{usuario.correo}</span>
        </div>
      </section>

      <section className="panel-barbero-estadisticas">
        <article className="panel-barbero-estadistica">
          <span>Total de citas</span>
          <strong>{reservaciones.length}</strong>
        </article>

        <article className="panel-barbero-estadistica">
          <span>Pendientes</span>
          <strong>{pendientes.length}</strong>
        </article>

        <article className="panel-barbero-estadistica">
          <span>Confirmadas</span>
          <strong>{confirmadas.length}</strong>
        </article>

        <article className="panel-barbero-estadistica">
          <span>Canceladas</span>
          <strong>{canceladas.length}</strong>
        </article>

        <article className="panel-barbero-estadistica">
          <span>Completadas</span>
          <strong>{completadas.length}</strong>
        </article>
      </section>

      <section className="panel-barbero-citas">
        <div className="panel-barbero-titulo">
          <div>
            <h2>Mis reservaciones</h2>
            <p>Reservaciones asignadas a tu cuenta.</p>
          </div>

          <button
            type="button"
            onClick={cargarReservaciones}
            disabled={cargando}
          >
            ACTUALIZAR
          </button>
        </div>

        {error && (
          <div className="panel-barbero-error">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="panel-barbero-vacio">
            <h3>Cargando reservaciones...</h3>
          </div>
        ) : reservaciones.length === 0 ? (
          <div className="panel-barbero-vacio">
            <h3>No tienes reservaciones</h3>
            <p>
              Cuando un cliente reserve una cita contigo,
              aparecerá en esta sección.
            </p>
          </div>
        ) : (
          <div className="panel-barbero-lista">
            {reservaciones.map((reserva) => (
              <article
                className="panel-barbero-tarjeta"
                key={reserva.idReserva}
              >
                <div className="panel-barbero-tarjeta-encabezado">
                  <div>
                    <h3>{reserva.nombre}</h3>
                    <span>{reserva.correoCliente}</span>
                  </div>

                  <span
                    className={`panel-barbero-estado ${reserva.estado.toLowerCase()}`}
                  >
                    {obtenerEstado(reserva.estado)}
                  </span>
                </div>

                <div className="panel-barbero-datos">
                  <p>
                    <strong>
                      {reserva.tipoProducto === "CORTE"
                        ? "Corte:"
                        : "Servicio:"}
                    </strong>{" "}
                    {reserva.servicio}
                  </p>

                  <p>
                    <strong>Fecha:</strong>{" "}
                    {formatearFecha(reserva.fecha)}
                  </p>

                  <p>
                    <strong>Hora:</strong>{" "}
                    {formatearHora(reserva.hora)}
                  </p>

                  <p>
                    <strong>Precio:</strong>{" "}
                    {formatearPrecio(reserva.precio)}
                  </p>

                  <p>
                    <strong>Barbero:</strong>{" "}
                    {reserva.barbero}
                  </p>

                  {reserva.estado === "COMPLETADA" && (
                    <p>
                      <strong>Asistencia:</strong>{" "}
                      {reserva.asistio === true
                        ? "El cliente asistió"
                        : reserva.asistio === false
                        ? "El cliente no asistió"
                        : "Sin registrar"}
                    </p>
                  )}
                </div>

                {reserva.estado === "PENDIENTE" && (
                  <div className="panel-barbero-acciones">
                    <button
                      type="button"
                      className="panel-barbero-aceptar"
                      onClick={() => aceptarCita(reserva.idReserva)}
                      disabled={procesando !== null}
                    >
                      {procesando === reserva.idReserva
                        ? "PROCESANDO..."
                        : "ACEPTAR CITA"}
                    </button>

                    <button
                      type="button"
                      className="panel-barbero-cancelar"
                      onClick={() => cancelarCita(reserva.idReserva)}
                      disabled={procesando !== null}
                    >
                      CANCELAR CITA
                    </button>
                  </div>
                )}

                {reserva.estado === "CONFIRMADA" && (
                  <div className="panel-barbero-acciones">
                    <button
                      type="button"
                      className="panel-barbero-asistencia"
                      onClick={() =>
                        registrarAsistencia(reserva.idReserva, true)
                      }
                      disabled={procesando !== null}
                    >
                      SÍ ASISTIÓ
                    </button>

                    <button
                      type="button"
                      className="panel-barbero-no-asistencia"
                      onClick={() =>
                        registrarAsistencia(reserva.idReserva, false)
                      }
                      disabled={procesando !== null}
                    >
                      NO ASISTIÓ
                    </button>

                    <button
                      type="button"
                      className="panel-barbero-cancelar"
                      onClick={() => cancelarCita(reserva.idReserva)}
                      disabled={procesando !== null}
                    >
                      CANCELAR CITA
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
