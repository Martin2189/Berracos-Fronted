
"use client";

import { useEffect, useState } from "react";

import Navbar from "../components/usuarios-view/Navbar";
import Hero from "../components/usuarios-view/Hero";
import Servicios from "../components/usuarios-view/Servicios";
import Barberos from "@/components/usuarios-view/Barberos";
import Cortes from "../components/usuarios-view/Cortes";
import Reservacion from "../components/usuarios-view/Reservacion";
import Ubicacion from "@/components/usuarios-view/Ubicacion";
import Calendario from "../components/usuarios-view/Calendario";
import Login from "@/components/usuarios-view/login";
import Footer from "../components/usuarios-view/Footer";
import MisReservaciones from "@/components/usuarios-view/MisReservaciones";

// Paneles de usuarios
import PanelBarbero from "@/components/barberos-view/PanelBarbero";
import PanelAdmin from "@/components/admin/PanelAdmin";

import {
  obtenerSesion,
  cerrarSesion,
  type UsuarioSesion,
} from "@/lib/sesion";

export default function Page() {
  const [vista, setVista] = useState("inicio");
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  // Consultar la sesión al cargar la página
  useEffect(() => {
    setUsuario(obtenerSesion());
    setCargando(false);
  }, []);

  // Actualizar el usuario y el Navbar
  const actualizarUsuario = () => {
    const sesionActual = obtenerSesion();
    setUsuario(sesionActual);
  };

  // Navegación de todas las páginas
  const cambiarVista = (nuevaVista: string) => {
    const sesionActual = obtenerSesion();

    setUsuario(sesionActual);

    // Proteger las reservaciones
    if (nuevaVista === "reservar" && !sesionActual) {
      setVista("login");
    }
    // Proteger el panel de barbero
    else if (
      nuevaVista === "panel-barbero" &&
      sesionActual?.rol !== "BARBERO"
    ) {
      setVista("inicio");
    }
    // Proteger el panel de administrador
    else if (
      nuevaVista === "panel-admin" &&
      sesionActual?.rol !== "ADMIN"
    ) {
      setVista("inicio");
    }
    else {
      setVista(nuevaVista);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Cerrar sesión
  const salir = () => {
    cerrarSesion();
    setUsuario(null);
    setVista("inicio");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (cargando) {
    return null;
  }

  return (
    <>
      <Navbar
        cambiarVista={cambiarVista}
        usuario={usuario}
        cerrarSesion={salir}
      />

      {/* INICIO */}
      {vista === "inicio" && (
        <main className="inicio">
          <Hero cambiarVista={cambiarVista} />

          <div className="inicio-accesos">
            <div className="inicio-accesos-contenido">
              <span>ACCESO RÁPIDO</span>

              <h2>¿Qué deseas hacer?</h2>

              <p>
                Explora nuestros servicios, conoce a nuestros barberos o
                reserva tu cita.
              </p>

              <div className="inicio-accesos-botones">
                <button
                  className="inicio-acceso"
                  onClick={() => cambiarVista("servicios")}
                >
                  SERVICIOS
                </button>

                <button
                  className="inicio-acceso"
                  onClick={() => cambiarVista("barberos")}
                >
                  BARBEROS
                </button>

                <button
                  className="inicio-acceso"
                  onClick={() => cambiarVista("cortes")}
                >
                  CORTES
                </button>

                <button
                  className="inicio-acceso inicio-acceso-principal"
                  onClick={() => cambiarVista("reservar")}
                >
                  RESERVAR CITA
                </button>

                <button
                  className="inicio-acceso"
                  onClick={() => cambiarVista("ubicacion")}
                >
                  UBICACIÓN
                </button>
              </div>
            </div>
          </div>

          <Servicios cambiarVista={cambiarVista} />
          <Barberos cambiarVista={cambiarVista} />
          <Cortes cambiarVista={cambiarVista} />
          <Ubicacion cambiarVista={cambiarVista} />
        </main>
      )}

      {/* SERVICIOS */}
      {vista === "servicios" && (
        <Servicios cambiarVista={cambiarVista} />
      )}

      {/* BARBEROS */}
      {vista === "barberos" && (
        <Barberos cambiarVista={cambiarVista} />
      )}

      {/* CORTES */}
      {vista === "cortes" && (
        <Cortes cambiarVista={cambiarVista} />
      )}

      {/* CALENDARIO */}
      {vista === "calendario" && (
        <Calendario cambiarVista={cambiarVista} />
      )}

      {/* RESERVACIONES */}
      {vista === "reservar" && usuario && (
        <Reservacion cambiarVista={cambiarVista} />
      )}

      {/* UBICACIÓN */}
      {vista === "ubicacion" && (
        <Ubicacion cambiarVista={cambiarVista} />
      )}

      {/* LOGIN */}
      {vista === "login" && (
        <Login
          cambiarVista={cambiarVista}
          actualizarUsuario={actualizarUsuario}
        />
      )}

      {/* MIS RESERVACIONES DEL CLIENTE */}
      {vista === "mis-reservaciones" &&
        usuario?.rol === "CLIENTE" && (
          <MisReservaciones usuario={usuario} />
        )}

      {/* PANEL DEL BARBERO */}
      {vista === "panel-barbero" &&
        usuario?.rol === "BARBERO" && (
          <PanelBarbero usuario={usuario} />
        )}

      {/* PANEL DEL ADMINISTRADOR */}
      {vista === "panel-admin" &&
        usuario?.rol === "ADMIN" && (
          <PanelAdmin />
        )}

      <Footer cambiarVista={cambiarVista} />
    </>
  );
}
