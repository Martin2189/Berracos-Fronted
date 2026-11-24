
"use client";

import { useEffect, useState } from "react";

export default function RecuperarPasswordPage() {
    const [token, setToken] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [confirmarContrasena, setConfirmarContrasena] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);
    const [exito, setExito] = useState(false);

    // Estados para mostrar u ocultar las contraseñas
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

    // Obtener el token que viene en el enlace del correo
    useEffect(() => {
        const parametros = new URLSearchParams(window.location.search);
        const tokenURL = parametros.get("token");

        if (tokenURL) {
            setToken(tokenURL);
        } else {
            setMensaje("El enlace no contiene un token de recuperación válido.");
        }
    }, []);

    const manejarSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMensaje("");

        if (!token) {
            setMensaje("No se encontró el token de recuperación.");
            return;
        }

        if (contrasena.length < 8) {
            setMensaje("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        if (contrasena !== confirmarContrasena) {
            setMensaje("Las contraseñas no coinciden.");
            return;
        }

        try {
            setCargando(true);

            const respuesta = await fetch(
                "http://localhost:8080/api/auth/reset-password",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        token: token,
                        nuevaPassword: contrasena,
                    }),
                }
            );

            const datos = await respuesta.json().catch(() => null);

            if (!respuesta.ok) {
                throw new Error(
                    datos?.mensaje ||
                    datos?.message ||
                    "No se pudo restablecer la contraseña. El token puede haber expirado."
                );
            }

            setExito(true);
            setMensaje(
                datos?.mensaje ||
                "Tu contraseña se restableció correctamente."
            );

            setContrasena("");
            setConfirmarContrasena("");

        } catch (error) {
            setMensaje(
                error instanceof Error
                    ? error.message
                    : "Ocurrió un error al restablecer la contraseña."
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <section className="login-seccion">
            <div className="login-contenedor">

                <div className="login-encabezado">
                    <h1>Restablecer contraseña</h1>
                    <p>
                        Ingresa tu nueva contraseña para recuperar el acceso
                        a tu cuenta.
                    </p>
                </div>

                {exito ? (
                    <div className="login-formulario">

                        <p className="login-mensaje">
                            {mensaje}
                        </p>

                        <a href="/" className="login-boton">
                            Volver al inicio
                        </a>

                    </div>
                ) : (
                    <form
                        className="login-formulario"
                        onSubmit={manejarSubmit}
                    >

                        {/* Nueva contraseña */}
                        <div className="login-campo">
                            <label htmlFor="nueva-contrasena">
                                Nueva contraseña
                            </label>

                            <div className="login-password-contenedor">
                                <input
                                    id="nueva-contrasena"
                                    type={mostrarContrasena ? "text" : "password"}
                                    placeholder="Ingresa tu nueva contraseña"
                                    value={contrasena}
                                    onChange={(e) =>
                                        setContrasena(e.target.value)
                                    }
                                    required
                                    minLength={8}
                                />

                                <button
                                    type="button"
                                    className="login-mostrar-password"
                                    onClick={() =>
                                        setMostrarContrasena(!mostrarContrasena)
                                    }
                                >
                                    {mostrarContrasena ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar contraseña */}
                        <div className="login-campo">
                            <label htmlFor="confirmar-contrasena">
                                Confirmar contraseña
                            </label>

                            <div className="login-password-contenedor">
                                <input
                                    id="confirmar-contrasena"
                                    type={mostrarConfirmacion ? "text" : "password"}
                                    placeholder="Confirma tu nueva contraseña"
                                    value={confirmarContrasena}
                                    onChange={(e) =>
                                        setConfirmarContrasena(e.target.value)
                                    }
                                    required
                                    minLength={8}
                                />

                                <button
                                    type="button"
                                    className="login-mostrar-password"
                                    onClick={() =>
                                        setMostrarConfirmacion(!mostrarConfirmacion)
                                    }
                                >
                                    {mostrarConfirmacion ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>

                        {/* Mensajes */}
                        {mensaje && (
                            <p className="login-mensaje">
                                {mensaje}
                            </p>
                        )}

                        {/* Botón para guardar */}
                        <button
                            type="submit"
                            className="login-boton"
                            disabled={cargando || !token}
                        >
                            {cargando
                                ? "Restableciendo..."
                                : "Guardar nueva contraseña"}
                        </button>

                    </form>
                )}

            </div>
        </section>
    );
}
