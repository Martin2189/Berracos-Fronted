
"use client";

import { useState, type FormEvent } from "react";
import { guardarSesion } from "@/lib/sesion";

type LoginProps = {
  cambiarVista: (vista: string) => void;
  actualizarUsuario: () => void;
};

type RespuestaLogin = {
  tipo: string;
  idUsuario: number;
  correo: string;
  mensaje: string;
  nombre: string;
  rol: "CLIENTE" | "BARBERO" | "ADMIN";
  token: string;
};

const API_URL = "http://localhost:8080/api/usuarios";
const AUTH_URL = "http://localhost:8080/api/auth";

export default function Login({
  cambiarVista,
  actualizarUsuario,
}: LoginProps) {
  const [modo, setModo] = useState<
    "login" | "registro" | "recuperar" | "restablecer"
  >("login");

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  // TOKEN DE RECUPERACIÓN
  const [token, setToken] = useState("");

  // MOSTRAR U OCULTAR CONTRASEÑAS
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const manejarSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje("");

    const correoNormalizado = correo.trim().toLowerCase();

    // SOLICITAR RECUPERACIÓN DE CONTRASEÑA
    if (modo === "recuperar") {
      try {
        setCargando(true);

        const respuesta = await fetch(`${AUTH_URL}/forgot-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo: correoNormalizado,
          }),
        });

        const datos = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          setMensaje(
            datos?.mensaje || "No se pudo solicitar la recuperación."
          );
          return;
        }

        // CAMBIAR AL FORMULARIO DE RESTABLECIMIENTO
        setModo("restablecer");
        setToken("");
        setContrasena("");
        setConfirmarContrasena("");
        setMensaje(
          "Si el correo está registrado, recibirás un enlace de recuperación. Revisa tu bandeja de entrada y copia el token del enlace."
        );

      } catch (error) {
        console.error("Error al solicitar recuperación:", error);

        setMensaje(
          "No se pudo conectar con el servidor. Verifica que Spring Boot esté funcionando."
        );
      } finally {
        setCargando(false);
      }

      return;
    }

    // RESTABLECER CONTRASEÑA
    if (modo === "restablecer") {
      if (!token.trim()) {
        setMensaje("Ingresa el token recibido en tu correo.");
        return;
      }

      if (contrasena.length < 8) {
        setMensaje("La nueva contraseña debe tener mínimo 8 caracteres.");
        return;
      }

      if (contrasena !== confirmarContrasena) {
        setMensaje("Las contraseñas no coinciden.");
        return;
      }

      try {
        setCargando(true);

        const respuesta = await fetch(`${AUTH_URL}/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token.trim(),
            nuevaPassword: contrasena,
          }),
        });

        const datos = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          setMensaje(
            datos?.mensaje || "No se pudo restablecer la contraseña."
          );
          return;
        }

        // REGRESAR AL LOGIN DESPUÉS DE CAMBIAR LA CONTRASEÑA
        setModo("login");
        setToken("");
        setContrasena("");
        setConfirmarContrasena("");
        setMostrarContrasena(false);
        setMostrarConfirmacion(false);

        setMensaje(
          datos?.mensaje ||
          "Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión."
        );

      } catch (error) {
        console.error("Error al restablecer contraseña:", error);

        setMensaje(
          "No se pudo conectar con el servidor. Verifica que Spring Boot esté funcionando."
        );
      } finally {
        setCargando(false);
      }

      return;
    }

    // COMPROBACIÓN DEL FORMULARIO
    console.log("COMPROBACIÓN DEL FORMULARIO:", {
      correoOriginal: JSON.stringify(correo),
      correoEnviado: JSON.stringify(correoNormalizado),
      longitudCorreo: correoNormalizado.length,
      longitudContrasena: contrasena.length,
      modo: modo,
    });

    // REGISTRO DE CLIENTES
    if (modo === "registro") {
      if (contrasena !== confirmarContrasena) {
        setMensaje("Las contraseñas no coinciden.");
        return;
      }

      if (nombre.trim().length < 3) {
        setMensaje("Ingresa tu nombre completo.");
        return;
      }

      if (contrasena.length < 6) {
        setMensaje("La contraseña debe tener mínimo 6 caracteres.");
        return;
      }

      try {
        setCargando(true);

        const respuesta = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre: nombre.trim(),
            correo: correoNormalizado,
            password: contrasena,
          }),
        });

        const datos = await respuesta.json().catch(() => null);

        if (!respuesta.ok) {
          setMensaje(
            datos?.mensaje || "No se pudo registrar el usuario."
          );
          return;
        }

        setMensaje(
          "¡Registro realizado correctamente! Ahora puedes iniciar sesión."
        );

        setNombre("");
        setCorreo(correoNormalizado);
        setContrasena("");
        setConfirmarContrasena("");
        setModo("login");

      } catch (error) {
        console.error("Error al registrar cliente:", error);

        setMensaje(
          "No se pudo conectar con el servidor. Verifica que Spring Boot esté funcionando."
        );
      } finally {
        setCargando(false);
      }

      return;
    }

    // INICIO DE SESIÓN
    try {
      setCargando(true);

      // DATOS QUE ENVÍA EL FRONTEND
      console.log("DATOS ENVIADOS AL LOGIN:", {
        correo: correoNormalizado,
        password: "[OCULTA]",
        longitudPassword: contrasena.length,
      });

      const respuesta = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: correoNormalizado,
          password: contrasena,
        }),
      });

      const datos = await respuesta.json().catch(() => null);

      // RESPUESTA DEL BACKEND
      console.log("RESPUESTA DEL BACKEND:", {
        status: respuesta.status,
        ok: respuesta.ok,
        datos: datos
          ? {
              ...datos,
              token: datos.token ? "[OCULTO]" : undefined,
            }
          : null,
      });

      if (!respuesta.ok) {
        setMensaje(
          datos?.mensaje || "Correo o contraseña incorrectos."
        );
        return;
      }

      if (!datos) {
        setMensaje("El backend no devolvió una respuesta válida.");
        return;
      }

      const usuario = datos as RespuestaLogin;

      if (
        !usuario.idUsuario ||
        !usuario.nombre ||
        !usuario.correo ||
        !usuario.rol ||
        !usuario.token
      ) {
        setMensaje("El backend devolvió una respuesta incompleta.");
        return;
      }

      const rolesPermitidos = ["CLIENTE", "BARBERO", "ADMIN"];

      if (!rolesPermitidos.includes(usuario.rol)) {
        setMensaje("El rol del usuario no es válido.");
        return;
      }

      // COMPROBAR INFORMACIÓN DEL JWT
      try {
        const partesToken = usuario.token.split(".");
        const payload = JSON.parse(atob(partesToken[1]));

        console.log("----- INFORMACIÓN DEL LOGIN -----");
        console.log("Rol de la respuesta:", usuario.rol);
        console.log("Rol dentro del token:", payload.rol);
        console.log("Correo dentro del token:", payload.sub);
        console.log(
          "Expiración:",
          new Date(payload.exp * 1000).toLocaleString()
        );
        console.log("---------------------------------");

      } catch (error) {
        console.error("No se pudo interpretar el JWT:", error);
      }

      // GUARDAR SESIÓN
      guardarSesion({
        idUsuario: usuario.idUsuario,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        token: usuario.token,
        tipo: usuario.tipo || "Bearer",
      });

      // ACTUALIZAR USUARIO
      actualizarUsuario();

      // NAVEGAR SEGÚN EL ROL
      if (usuario.rol === "BARBERO") {
        cambiarVista("panel-barbero");
      } else if (usuario.rol === "ADMIN") {
        cambiarVista("panel-admin");
      } else {
        cambiarVista("inicio");
      }

    } catch (error) {
      console.error("Error al iniciar sesión:", error);

      setMensaje(
        "No se pudo conectar con el servidor. Verifica que Spring Boot esté funcionando."
      );
    } finally {
      setCargando(false);
    }
  };

  const cambiarModo = (
    nuevoModo: "login" | "registro" | "recuperar" | "restablecer"
  ) => {
    setModo(nuevoModo);
    setMensaje("");
    setContrasena("");
    setConfirmarContrasena("");
    setToken("");
    setMostrarContrasena(false);
    setMostrarConfirmacion(false);
  };

  return (
    <section className="login-seccion">
      <div className="login-contenedor">

        <div className="login-encabezado">
          <span>BERRACOS BARBER</span>

          <h1>
            {modo === "login"
              ? "INICIAR SESIÓN"
              : modo === "registro"
                ? "CREAR CUENTA"
                : modo === "recuperar"
                  ? "RECUPERAR CONTRASEÑA"
                  : "RESTABLECER CONTRASEÑA"}
          </h1>

          <p>
            {modo === "login"
              ? "Accede a tu cuenta para reservar y consultar tus citas."
              : modo === "registro"
                ? "Regístrate como cliente y comienza a disfrutar de nuestros servicios."
                : modo === "recuperar"
                  ? "Ingresa el correo asociado a tu cuenta para recibir instrucciones de recuperación."
                  : "Ingresa el token recibido en tu correo y establece tu nueva contraseña."}
          </p>
        </div>

        <form className="login-formulario" onSubmit={manejarSubmit}>

          {modo === "registro" && (
            <div className="login-campo">
              <label htmlFor="registro-nombre">
                NOMBRE COMPLETO
              </label>

              <input
                id="registro-nombre"
                type="text"
                placeholder="Tu nombre completo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoComplete="name"
                required
                minLength={3}
              />
            </div>
          )}

          {(modo === "login" ||
            modo === "registro" ||
            modo === "recuperar") && (
            <div className="login-campo">
              <label htmlFor="login-correo">
                CORREO ELECTRÓNICO
              </label>

              <input
                id="login-correo"
                type="email"
                placeholder="correo@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          )}

          {modo === "restablecer" && (
            <div className="login-campo">
              <label htmlFor="recuperar-token">
                TOKEN DE RECUPERACIÓN
              </label>

              <input
                id="recuperar-token"
                type="text"
                placeholder="Pega aquí el token recibido"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
                required
              />
            </div>
          )}

          {(modo === "login" ||
            modo === "registro" ||
            modo === "restablecer") && (
            <div className="login-campo">
              <label htmlFor="login-password">
                {modo === "restablecer"
                  ? "NUEVA CONTRASEÑA"
                  : "CONTRASEÑA"}
              </label>

              <div className="login-password-contenedor">
                <input
                  id="login-password"
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder={
                    modo === "restablecer"
                      ? "Mínimo 8 caracteres"
                      : "Mínimo 6 caracteres"
                  }
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  autoComplete={
                    modo === "login"
                      ? "current-password"
                      : "new-password"
                  }
                  required
                  minLength={modo === "restablecer" ? 8 : 6}
                />

                <button
                  type="button"
                  className="login-mostrar-password"
                  onClick={() =>
                    setMostrarContrasena(!mostrarContrasena)
                  }
                  aria-label={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {mostrarContrasena ? "OCULTAR" : "MOSTRAR"}
                </button>
              </div>
            </div>
          )}

          {(modo === "registro" || modo === "restablecer") && (
            <div className="login-campo">
              <label htmlFor="confirmar-password">
                CONFIRMAR CONTRASEÑA
              </label>

              <div className="login-password-contenedor">
                <input
                  id="confirmar-password"
                  type={mostrarConfirmacion ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={confirmarContrasena}
                  onChange={(e) =>
                    setConfirmarContrasena(e.target.value)
                  }
                  autoComplete="new-password"
                  required
                  minLength={modo === "restablecer" ? 8 : 6}
                />

                <button
                  type="button"
                  className="login-mostrar-password"
                  onClick={() =>
                    setMostrarConfirmacion(!mostrarConfirmacion)
                  }
                  aria-label={
                    mostrarConfirmacion
                      ? "Ocultar confirmación"
                      : "Mostrar confirmación"
                  }
                >
                  {mostrarConfirmacion ? "OCULTAR" : "MOSTRAR"}
                </button>
              </div>
            </div>
          )}

          {modo === "login" && (
            <button
              type="button"
              className="login-recuperar"
              onClick={() => cambiarModo("recuperar")}
            >
              ¿OLVIDASTE TU CONTRASEÑA?
            </button>
          )}

          <button
            type="submit"
            className="login-boton"
            disabled={cargando}
          >
            {cargando
              ? "CONECTANDO..."
              : modo === "login"
                ? "INICIAR SESIÓN"
                : modo === "registro"
                  ? "CREAR CUENTA"
                  : modo === "recuperar"
                    ? "ENVIAR CORREO"
                    : "CAMBIAR CONTRASEÑA"}
          </button>

        </form>

        {mensaje && (
          <div className="login-mensaje" role="alert">
            {mensaje}
          </div>
        )}

        <div className="login-cambio">
          {modo === "login" ? (
            <>
              <span>¿NO TIENES UNA CUENTA?</span>

              <button
                type="button"
                onClick={() => cambiarModo("registro")}
              >
                REGISTRARME
              </button>
            </>
          ) : modo === "registro" ? (
            <>
              <span>¿YA TIENES UNA CUENTA?</span>

              <button
                type="button"
                onClick={() => cambiarModo("login")}
              >
                INICIAR SESIÓN
              </button>
            </>
          ) : modo === "restablecer" ? (
            <>
              <span>¿NO RECIBISTE EL CORREO?</span>

              <button
                type="button"
                onClick={() => cambiarModo("recuperar")}
              >
                REENVIAR SOLICITUD
              </button>
            </>
          ) : (
            <>
              <span>¿YA RECORDaste TU CONTRASEÑA?</span>

              <button
                type="button"
                onClick={() => cambiarModo("login")}
              >
                INICIAR SESIÓN
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="login-regresar"
          onClick={() => cambiarVista("inicio")}
        >
          ← REGRESAR AL INICIO
        </button>

      </div>
    </section>
  );
}
