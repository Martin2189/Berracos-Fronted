
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Servicio = {
  idServicio: number;
  nombre: string;
  descripcion: string;
  icono: string;
  precio: number;
  activo: boolean;
  imagen: string | null;
};

type ServiciosProps = {
  cambiarVista: (vista: string) => void;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function urlImagen(imagen: string | null) {
  if (!imagen) return "";

  return imagen.startsWith("http")
    ? imagen
    : `${API_URL}${imagen}`;
}

export default function Servicios({
  cambiarVista,
}: ServiciosProps) {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarServicios() {
      try {
        setCargando(true);
        setError("");

        const datos = await api<Servicio[]>("/api/servicios");

        if (!activo) return;

        setServicios(
          datos.filter((servicio) => servicio.activo)
        );
      } catch (error) {
        if (!activo) return;

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los servicios"
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarServicios();

    return () => {
      activo = false;
    };
  }, []);

  return (
    <section className="seccion servicios">
      <div className="encabezado">
        <span>SERVICES</span>
        <h2>NUESTROS SERVICIOS</h2>
        <p>
          Todo lo que necesitas para salir con un estilo
          diferente.
        </p>
      </div>

      {cargando ? (
        <p className="mensaje-carga">
          Cargando servicios...
        </p>
      ) : error ? (
        <p className="mensaje-error">{error}</p>
      ) : servicios.length === 0 ? (
        <p className="mensaje-carga">
          No hay servicios disponibles.
        </p>
      ) : (
        <div className="servicios-grid">
          {servicios.map((servicio) => (
            <article
              className="servicio-card"
              key={servicio.idServicio}
            >
              <div className="servicio-imagen-contenedor">
                {servicio.imagen ? (
                  <img
                    className="servicio-imagen"
                    src={urlImagen(servicio.imagen)}
                    alt={`Imagen de ${servicio.nombre}`}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="servicio-icono">
                    {servicio.icono}
                  </div>
                )}
              </div>

              <h3>{servicio.nombre}</h3>

              <p>{servicio.descripcion}</p>

              <strong className="servicio-precio">
                {Number(servicio.precio).toLocaleString("es-MX", {
                  style: "currency",
                  currency: "MXN",
                })}
              </strong>
            </article>
          ))}
        </div>
      )}

      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
        }}
      >
        <button
          className="boton"
          onClick={() => cambiarVista("reservar")}
        >
          RESERVAR CITA
        </button>
      </div>
    </section>
  );
}
