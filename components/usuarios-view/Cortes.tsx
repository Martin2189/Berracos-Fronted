
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Corte = {
  idCorte: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  activo: boolean;
};

type CortesProps = {
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

export default function Cortes({
  cambiarVista,
}: CortesProps) {
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarCortes() {
      try {
        setCargando(true);
        setError("");

        const datos = await api<Corte[]>("/api/cortes");

        if (!activo) return;

        setCortes(datos.filter((corte) => corte.activo));
      } catch (error) {
        if (!activo) return;

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los cortes"
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarCortes();

    return () => {
      activo = false;
    };
  }, []);

  return (
    <section className="seccion cortes">
      <div className="encabezado">
        <span>OUR STYLE</span>

        <h2>CORTES POPULARES</h2>

        <p>
          Elige tu estilo y agenda tu próxima visita.
        </p>
      </div>

      {cargando ? (
        <p className="mensaje-carga">
          Cargando cortes...
        </p>
      ) : error ? (
        <p className="mensaje-error">{error}</p>
      ) : cortes.length === 0 ? (
        <p className="mensaje-carga">
          No hay cortes disponibles.
        </p>
      ) : (
        <div className="cortes-grid">
          {cortes.map((corte, index) => (
            <article
              className="corte-card"
              key={corte.idCorte}
            >
              <div className="corte-numero">
                {String(index + 1).padStart(2, "0")}
              </div>

              <div className="corte-contenido">
                <h3>{corte.nombre}</h3>

                <p>{corte.descripcion}</p>

                {corte.imagen && (
                  <div className="corte-imagen-contenedor">
                    <img
                      src={urlImagen(corte.imagen)}
                      alt={`Imagen de ${corte.nombre}`}
                      className="corte-imagen"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div className="corte-footer">
                  <strong>
                    {Number(corte.precio).toLocaleString(
                      "es-MX",
                      {
                        style: "currency",
                        currency: "MXN",
                      }
                    )}
                  </strong>

                  <button
                    className="boton"
                    onClick={() => cambiarVista("reservar")}
                  >
                    ELEGIR
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
