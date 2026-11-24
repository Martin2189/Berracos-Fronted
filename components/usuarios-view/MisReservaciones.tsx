
"use client";

import { useCallback, useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { api } from "@/lib/api";
import type { UsuarioSesion } from "@/lib/sesion";

type Reserva = {
  idReserva: number;
  servicio: string;
  tipoProducto: "SERVICIO" | "CORTE";
  barbero: string;
  fecha: string;
  hora: string;
  precio: number;
  estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";
};

type MisReservacionesProps = {
  usuario: UsuarioSesion;
};

function formatearFecha(fecha: string) {
  if (!fecha) return "";

  const [anio, mes, dia] = fecha.split("-").map(Number);

  const nombresMeses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  return `${dia} de ${nombresMeses[mes - 1]} de ${anio}`;
}

function formatearPrecio(precio: number) {
  return Number(precio).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatearHora(hora: string) {
  return hora ? hora.slice(0, 5) : "";
}

function obtenerEstado(estado: Reserva["estado"]) {
  switch (estado) {
    case "PENDIENTE":
      return "PENDIENTE";
    case "CONFIRMADA":
      return "CONFIRMADA";
    case "CANCELADA":
      return "CANCELADA";
    case "COMPLETADA":
      return "COMPLETADA";
    default:
      return estado;
  }
}

export default function MisReservaciones({
  usuario,
}: MisReservacionesProps) {
  const [reservaciones, setReservaciones] = useState<Reserva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [descargando, setDescargando] = useState<number | null>(null);
  const [mensajeError, setMensajeError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");

  const cargarReservaciones = useCallback(async () => {
    setCargando(true);
    setMensajeError("");

    try {
      const datos = await api<Reserva[]>(
        "/api/reservas/mis-reservas",
        {
          autenticado: true,
        }
      );

      setReservaciones(datos);
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar tus reservaciones."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarReservaciones();
  }, [cargarReservaciones, usuario.correo]);

  // Generar y descargar el comprobante individual.
  const descargarComprobante = async (reserva: Reserva) => {
    setDescargando(reserva.idReserva);
    setMensajeError("");

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const ancho = pdf.internal.pageSize.getWidth();
      const alto = pdf.internal.pageSize.getHeight();

      const colorAzul = [47, 164, 255] as const;
      const colorBlanco = [255, 255, 255] as const;
      const colorTexto = [190, 205, 220] as const;

      // Crear fondo con patrón de barbería.
      const crearFondo = async (): Promise<string> => {
        const canvas = document.createElement("canvas");

        canvas.width = 1240;
        canvas.height = 1754;

        const contexto = canvas.getContext("2d");

        if (!contexto) {
          throw new Error("No se pudo crear el fondo.");
        }

        contexto.fillStyle = "#02060b";
        contexto.fillRect(0, 0, canvas.width, canvas.height);

        try {
          const imagen = new Image();

          imagen.crossOrigin = "anonymous";

          await new Promise<void>((resolve, reject) => {
            imagen.onload = () => resolve();

            imagen.onerror = () =>
              reject(new Error("No se pudo cargar el patrón."));

            imagen.src =
              "https://img.magnific.com/vector-premium/patron-costura-industria-barbero-es-monocromatico_153969-8939.jpg?semt=ais_hybrid&w=740&q=80";
          });

          const escala = Math.max(
            canvas.width / imagen.width,
            canvas.height / imagen.height
          );

          const imagenAncho = imagen.width * escala;
          const imagenAlto = imagen.height * escala;

          contexto.globalAlpha = 0.20;

          contexto.drawImage(
            imagen,
            (canvas.width - imagenAncho) / 2,
            (canvas.height - imagenAlto) / 2,
            imagenAncho,
            imagenAlto
          );

          contexto.globalAlpha = 1;
        } catch {
          contexto.fillStyle = "#02060b";
          contexto.fillRect(0, 0, canvas.width, canvas.height);
        }

        const degradado = contexto.createLinearGradient(
          0,
          0,
          0,
          canvas.height
        );

        degradado.addColorStop(
          0,
          "rgba(2, 6, 11, 0.82)"
        );

        degradado.addColorStop(
          1,
          "rgba(2, 6, 11, 0.94)"
        );

        contexto.fillStyle = degradado;
        contexto.fillRect(0, 0, canvas.width, canvas.height);

        return canvas.toDataURL("image/jpeg", 0.90);
      };

      try {
        const fondo = await crearFondo();

        pdf.addImage(
          fondo,
          "JPEG",
          0,
          0,
          ancho,
          alto
        );
      } catch {
        pdf.setFillColor(2, 6, 11);
        pdf.rect(0, 0, ancho, alto, "F");
      }

      // Encabezado.
      pdf.setFillColor(2, 10, 20);

      pdf.roundedRect(
        15,
        15,
        ancho - 30,
        43,
        3,
        3,
        "F"
      );

      pdf.setDrawColor(...colorAzul);
      pdf.setLineWidth(0.5);

      pdf.roundedRect(
        15,
        15,
        ancho - 30,
        43,
        3,
        3,
        "S"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(23);
      pdf.setTextColor(...colorBlanco);

      pdf.text("BERRACOS", ancho / 2, 29, {
        align: "center",
      });

      pdf.setTextColor(...colorAzul);

      pdf.text("BARBER", ancho / 2, 38, {
        align: "center",
      });

      pdf.setFontSize(9);
      pdf.setTextColor(...colorTexto);

      pdf.text(
        "ESTILO  |  PRECISION  |  DISTINCION",
        ancho / 2,
        48,
        {
          align: "center",
        }
      );

      // Título.
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(...colorBlanco);

      pdf.text(
        "COMPROBANTE DE RESERVACION",
        ancho / 2,
        72,
        {
          align: "center",
        }
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...colorAzul);

      pdf.text(
        "CONFIRMACION DE TU CITA",
        ancho / 2,
        79,
        {
          align: "center",
        }
      );

      // Tarjeta principal.
      pdf.setFillColor(5, 15, 27);

      pdf.roundedRect(
        15,
        90,
        ancho - 30,
        151,
        3,
        3,
        "F"
      );

      pdf.setDrawColor(...colorAzul);
      pdf.setLineWidth(0.4);

      pdf.roundedRect(
        15,
        90,
        ancho - 30,
        151,
        3,
        3,
        "S"
      );

      // Información del cliente.
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...colorAzul);

      pdf.text("INFORMACION DEL CLIENTE", 23, 102);

      pdf.setDrawColor(...colorAzul);
      pdf.line(23, 107, ancho - 23, 107);

      const datosCliente: [string, string][] = [
        ["Folio", String(reserva.idReserva)],
        ["Cliente", usuario.nombre],
        ["Correo", usuario.correo],
      ];

      let posicionY = 118;

      datosCliente.forEach(([titulo, valor]) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...colorBlanco);

        pdf.text(`${titulo}:`, 23, posicionY);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...colorTexto);

        const lineas = pdf.splitTextToSize(
          valor || "No disponible",
          ancho - 85
        );

        pdf.text(lineas, 65, posicionY);

        posicionY += Math.max(9, lineas.length * 5);
      });

      // Separador.
      pdf.setDrawColor(...colorAzul);

      pdf.line(
        23,
        posicionY + 2,
        ancho - 23,
        posicionY + 2
      );

      posicionY += 13;

      // Detalles de la reservación.
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...colorAzul);

      pdf.text(
        "DETALLES DE LA RESERVACION",
        23,
        posicionY
      );

      posicionY += 12;

      const datosReserva: [string, string][] = [
        [
          "Tipo",
          reserva.tipoProducto === "SERVICIO"
            ? "Servicio"
            : "Corte",
        ],
        ["Producto", reserva.servicio],
        ["Barbero", reserva.barbero],
        ["Fecha", formatearFecha(reserva.fecha)],
        ["Hora", formatearHora(reserva.hora)],
        ["Estado", obtenerEstado(reserva.estado)],
      ];

      datosReserva.forEach(([titulo, valor]) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(...colorBlanco);

        pdf.text(`${titulo}:`, 23, posicionY);

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...colorTexto);

        const lineas = pdf.splitTextToSize(
          valor || "No disponible",
          ancho - 85
        );

        pdf.text(lineas, 65, posicionY);

        posicionY += Math.max(9, lineas.length * 5);
      });

      // Precio.
      posicionY += 3;

      pdf.setDrawColor(...colorAzul);

      pdf.line(
        23,
        posicionY,
        ancho - 23,
        posicionY
      );

      posicionY += 14;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...colorBlanco);

      pdf.text("TOTAL", 23, posicionY);

      pdf.setFontSize(17);
      pdf.setTextColor(...colorAzul);

      pdf.text(
        formatearPrecio(reserva.precio),
        ancho - 23,
        posicionY,
        {
          align: "right",
        }
      );

      // Pie de página.
      pdf.setDrawColor(...colorAzul);
      pdf.line(15, 260, ancho - 15, 260);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(...colorBlanco);

      pdf.text(
        "GRACIAS POR PREFERIR BERRACOS BARBER",
        ancho / 2,
        270,
        {
          align: "center",
        }
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...colorTexto);

      pdf.text(
        "Tu estilo, nuestra prioridad.",
        ancho / 2,
        277,
        {
          align: "center",
        }
      );

      pdf.save(
        `Comprobante-Berracos-${reserva.idReserva}.pdf`
      );
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el comprobante."
      );
    } finally {
      setDescargando(null);
    }
  };

  const cancelarCita = async (idReserva: number) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas cancelar esta reservación?"
    );

    if (!confirmar) return;

    setCancelando(idReserva);
    setMensajeError("");
    setMensajeExito("");

    try {
      await api(`/api/reservas/${idReserva}/cancelar`, {
        method: "PUT",
        autenticado: true,
      });

      setMensajeExito(
        "Tu reservación fue cancelada correctamente."
      );

      await cargarReservaciones();
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo cancelar la reservación."
      );
    } finally {
      setCancelando(null);
    }
  };

  return (
    <section className="mis-reservaciones-seccion">
      <div className="mis-reservaciones-encabezado">
        <span>BERRACOS BARBER</span>
        <h1>MIS RESERVACIONES</h1>
        <p>
          Hola, {usuario.nombre}. Aquí puedes consultar tus citas.
        </p>
      </div>

      <div className="mis-reservaciones-contenedor">
        {mensajeError && (
          <p className="mensaje-error" role="alert">
            {mensajeError}
          </p>
        )}

        {mensajeExito && (
          <p className="mensaje-exito" role="status">
            {mensajeExito}
          </p>
        )}

        {cargando ? (
          <div className="sin-reservaciones">
            <h2>Cargando reservaciones...</h2>
            <p>Estamos consultando tus citas.</p>
          </div>
        ) : reservaciones.length === 0 ? (
          <div className="sin-reservaciones">
            <h2>No tienes reservaciones todavía</h2>
            <p>
              Cuando reserves una cita, aparecerá aquí.
            </p>

            <button
              type="button"
              className="boton"
              onClick={cargarReservaciones}
            >
              ACTUALIZAR
            </button>
          </div>
        ) : (
          <div className="mis-reservaciones-lista">
            {reservaciones.map((reserva) => (
              <article
                className="reservacion-tarjeta"
                key={reserva.idReserva}
              >
                <div className="reservacion-tarjeta-encabezado">
                  <div>
                    <span className="tipo-reserva">
                      {reserva.tipoProducto === "CORTE"
                        ? "CORTE"
                        : "SERVICIO"}
                    </span>

                    <h2>{reserva.servicio}</h2>
                  </div>

                  <span
                    className={`estado-reserva ${reserva.estado.toLowerCase()}`}
                  >
                    {obtenerEstado(reserva.estado)}
                  </span>
                </div>

                <div className="reservacion-datos">
                  <p>
                    <strong>Barbero:</strong> {reserva.barbero}
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
                </div>

                <div
                  className="reservacion-acciones"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "14px",
                    marginTop: "22px",
                  }}
                >
                  <button
                    type="button"
                    className="boton"
                    disabled={descargando === reserva.idReserva}
                    onClick={() => descargarComprobante(reserva)}
                  >
                    {descargando === reserva.idReserva
                      ? "GENERANDO PDF..."
                      : "DESCARGAR COMPROBANTE"}
                  </button>

                  {(reserva.estado === "PENDIENTE" ||
                    reserva.estado === "CONFIRMADA") && (
                    <button
                      type="button"
                      className="cancelar-reserva-boton"
                      disabled={cancelando === reserva.idReserva}
                      onClick={() =>
                        cancelarCita(reserva.idReserva)
                      }
                    >
                      {cancelando === reserva.idReserva
                        ? "CANCELANDO..."
                        : "CANCELAR RESERVACIÓN"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
