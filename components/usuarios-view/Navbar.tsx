
"use client";

import { useState } from "react";
import type { UsuarioSesion } from "@/lib/sesion";

type NavbarProps = {
  cambiarVista: (vista: string) => void;
  usuario: UsuarioSesion | null;
  cerrarSesion: () => void;
};

export default function Navbar({
  cambiarVista,
  usuario,
  cerrarSesion,
}: NavbarProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const navegar = (vista: string) => {
    cambiarVista(vista);
    setMenuAbierto(false);
  };

  const salir = () => {
    setMenuAbierto(false);
    cerrarSesion();
  };

  return (
    <nav className="navbar">
      <div
        className="navbar-logo"
        onClick={() => navegar("inicio")}
        style={{ cursor: "pointer" }}
      >
        BERRACOS<span>BARBER</span>
      </div>

      <button
        type="button"
        className={`navbar-menu-boton ${menuAbierto ? "activo" : ""}`}
        onClick={() => setMenuAbierto((actual) => !actual)}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuAbierto}
        aria-controls="navbar-menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        id="navbar-menu"
        className={`navbar-menu-contenido ${
          menuAbierto ? "menu-abierto" : ""
        }`}
      >
        <ul className="navbar-links">
          <li>
            <button onClick={() => navegar("inicio")}>INICIO</button>
          </li>

          <li>
            <button onClick={() => navegar("servicios")}>SERVICIOS</button>
          </li>

          <li>
            <button onClick={() => navegar("barberos")}>BARBEROS</button>
          </li>

          <li>
            <button onClick={() => navegar("cortes")}>CORTES</button>
          </li>

          <li>
            <button onClick={() => navegar("calendario")}>
              DISPONIBILIDAD
            </button>
          </li>

          <li>
            <button onClick={() => navegar("ubicacion")}>UBICACIÓN</button>
          </li>

          {usuario?.rol === "CLIENTE" && (
            <>
              <li>
                <button onClick={() => navegar("reservar")}>
                  RESERVAR CITA
                </button>
              </li>

              <li>
                <button onClick={() => navegar("mis-reservaciones")}>
                  MIS RESERVACIONES
                </button>
              </li>
            </>
          )}

          {usuario?.rol === "BARBERO" && (
            <li>
              <button onClick={() => navegar("panel-barbero")}>
                MI PANEL
              </button>
            </li>
          )}

          {usuario?.rol === "ADMIN" && (
            <li>
              <button onClick={() => navegar("panel-admin")}>
                ADMINISTRACIÓN
              </button>
            </li>
          )}

          {!usuario && (
            <li>
              <button onClick={() => navegar("reservar")}>
                RESERVAR CITA
              </button>
            </li>
          )}
        </ul>

        <div className="navbar-usuario">
          {usuario ? (
            <>
              <span>HOLA, {usuario.nombre.toUpperCase()}</span>

              <button
                type="button"
                className="navbar-login navbar-cerrar"
                onClick={salir}
              >
                CERRAR SESIÓN
              </button>
            </>
          ) : (
            <button
              type="button"
              className="navbar-login"
              onClick={() => navegar("login")}
            >
              INICIAR SESIÓN
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
