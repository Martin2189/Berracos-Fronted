
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { obtenerSesion } from "@/lib/sesion";

type BarberosProps = {
  cambiarVista: (vista: string) => void;
};

type Barbero = {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: "BARBERO";
  activo: boolean;
  imagen: string | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Barberos({
  cambiarVista,
}: BarberosProps) {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarBarberos = async () => {
      try {
        setCargando(true);
        setError("");

        const usuarios = await api<Barbero[]>(
          "/api/usuarios/barberos"
        );

        if (!activo) return;

        const barberosActivos = usuarios.filter(
          (usuario) =>
            usuario.rol === "BARBERO" && usuario.activo
        );

        setBarberos(barberosActivos);
      } catch (error) {
        if (!activo) return;

        setError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los barberos."
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    };

    cargarBarberos();

    return () => {
      activo = false;
    };
  }, []);

  const seleccionarBarbero = (barbero: Barbero) => {
    localStorage.setItem(
      "berracos-barbero-seleccionado",
      JSON.stringify({
        idUsuario: barbero.idUsuario,
        nombre: barbero.nombre,
      })
    );

    const usuario = obtenerSesion();

    if (!usuario) {
      cambiarVista("login");
      return;
    }

    if (usuario.rol === "CLIENTE") {
      cambiarVista("reservar");
      return;
    }

    if (
      usuario.rol === "BARBERO" ||
      usuario.rol === "ADMIN"
    ) {
      cambiarVista("login");
    }
  };

  return (
    <main className="barberos-pagina">
      <header className="barberos-hero">
        <span className="barberos-etiqueta">
          BERRACOS BARBER
        </span>

        <h1>NUESTROS BARBEROS</h1>

        <p>
          Conoce a nuestro equipo de profesionales.
          Encuentra tu estilo y elige quién realizará tu próximo corte.
        </p>
      </header>

      <section className="barberos-contenedor">
        {cargando && (
          <p className="barberos-mensaje">
            Cargando nuestros barberos...
          </p>
        )}

        {error && (
          <p className="barberos-mensaje barberos-error">
            {error}
          </p>
        )}

        {!cargando && !error && barberos.length === 0 && (
          <p className="barberos-mensaje">
            Actualmente no hay barberos disponibles.
          </p>
        )}

        {!cargando && !error && barberos.length > 0 && (
          <div className="barberos-grid">
            {barberos.map((barbero) => (
              <article
                className="barbero-card"
                key={barbero.idUsuario}
              >
                <div className="barbero-foto">
                  {barbero.imagen ? (
                    <img
                      src={`${API_URL}${barbero.imagen}`}
                      alt={`Fotografía de ${barbero.nombre}`}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>
                      {barbero.nombre
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="barbero-informacion">
                  <span className="barbero-etiqueta">
                    NUESTRO EQUIPO
                  </span>

                  <h2>{barbero.nombre}</h2>

                  <h3>Barbero profesional</h3>

                  <p>
                    Profesional de BERRACOS BARBER.
                    Agenda tu cita y encuentra tu próximo estilo.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      seleccionarBarbero(barbero)
                    }
                    className="barbero-boton"
                  >
                    RESERVAR CITA
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
