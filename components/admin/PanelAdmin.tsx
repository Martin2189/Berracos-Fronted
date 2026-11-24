
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import "./panel-admin.css";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type SeccionAdmin =
  | "inicio"
  | "reservaciones"
  | "clientes"
  | "barberos"
  | "servicios"
  | "cortes";

type UsuarioAdmin = {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: "ADMIN" | "BARBERO" | "CLIENTE";
  activo: boolean;
  imagen: string | null;
};

type Servicio = {
  idServicio: number;
  nombre: string;
  descripcion: string;
  icono: string;
  precio: number;
  activo: boolean;
  imagen: string | null;
};

type Corte = {
  idCorte: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string | null;
  activo: boolean;
};

type ReservaAdmin = {
  idReserva: number;
  nombre: string;
  correoCliente: string;
  servicio: string;
  tipoProducto: "SERVICIO" | "CORTE";
  barbero: string;
  fecha: string;
  hora: string;
  precio: number | string;
  estado: "PENDIENTE" | "CONFIRMADA" | "CANCELADA" | "COMPLETADA";
};

const servicioInicial = {
  nombre: "",
  descripcion: "",
  icono: "✂",
  precio: "",
};

const corteInicial = {
  nombre: "",
  descripcion: "",
  precio: "",
};

const barberoInicial = {
  nombre: "",
  correo: "",
  password: "",
};

const usuarioInicial = {
  nombre: "",
  correo: "",
  password: "",
};

function urlImagen(imagen: string | null) {
  if (!imagen) return "";

  return imagen.startsWith("http")
    ? imagen
    : `${API_URL}${imagen}`;
}

export default function PanelAdmin() {
  const [seccion, setSeccion] = useState<SeccionAdmin>("inicio");

  const [reservaciones, setReservaciones] = useState<ReservaAdmin[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [busquedaUsuarios, setBusquedaUsuarios] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  const [formServicio, setFormServicio] = useState(servicioInicial);
  const [formCorte, setFormCorte] = useState(corteInicial);
  const [formBarbero, setFormBarbero] = useState(barberoInicial);
  const [formUsuario, setFormUsuario] = useState(usuarioInicial);

  const [servicioEditando, setServicioEditando] =
    useState<Servicio | null>(null);

  const [corteEditando, setCorteEditando] =
    useState<Corte | null>(null);

  const [usuarioEditando, setUsuarioEditando] =
    useState<UsuarioAdmin | null>(null);

  const [imagenBarbero, setImagenBarbero] = useState<File | null>(null);
  const [imagenServicio, setImagenServicio] = useState<File | null>(null);
  const [imagenCorte, setImagenCorte] = useState<File | null>(null);

  const [cargando, setCargando] = useState(false);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [cargandoReservaciones, setCargandoReservaciones] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // SUBIR IMÁGENES
  const subirImagen = async (endpoint: string, archivo: File) => {
    const formulario = new FormData();

    formulario.append("imagen", archivo);

    return api(endpoint, {
      method: "POST",
      autenticado: true,
      body: formulario,
    });
  };

  // CARGAR RESERVACIONES DESDE EL BACKEND
  const cargarReservaciones = async () => {
    try {
      setCargandoReservaciones(true);
      setError("");

      const datos = await api<ReservaAdmin[]>("/api/reservas/admin", {
        autenticado: true,
      });

      setReservaciones(datos);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las reservaciones"
      );
    } finally {
      setCargandoReservaciones(false);
    }
  };

  // CARGAR USUARIOS
  const cargarUsuarios = async () => {
    try {
      setCargandoUsuarios(true);
      setError("");

      const datos = await api<UsuarioAdmin[]>("/api/usuarios", {
        autenticado: true,
      });

      setUsuarios(datos);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los usuarios"
      );
    } finally {
      setCargandoUsuarios(false);
    }
  };

  // CARGAR SERVICIOS
  const cargarServicios = async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await api<Servicio[]>("/api/servicios");

      setServicios(datos);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los servicios"
      );
    } finally {
      setCargando(false);
    }
  };

  // CARGAR CORTES
  const cargarCortes = async () => {
    try {
      setCargando(true);
      setError("");

      const datos = await api<Corte[]>("/api/cortes");

      setCortes(datos);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los cortes"
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReservaciones();
    cargarServicios();
    cargarCortes();
    cargarUsuarios();
  }, []);

  // REGISTRAR BARBERO
  const guardarBarbero = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const datos = {
        nombre: formBarbero.nombre.trim(),
        correo: formBarbero.correo.trim(),
        password: formBarbero.password,
      };

      const barbero = await api<UsuarioAdmin>(
        "/api/usuarios/barberos",
        {
          method: "POST",
          autenticado: true,
          body: JSON.stringify(datos),
        }
      );

      if (imagenBarbero) {
        await subirImagen(
          `/api/usuarios/barberos/${barbero.idUsuario}/imagen`,
          imagenBarbero
        );
      }

      setFormBarbero(barberoInicial);
      setImagenBarbero(null);

      setMensaje("Barbero registrado correctamente.");

      await cargarUsuarios();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo registrar el barbero"
      );
    } finally {
      setGuardando(false);
    }
  };

  // PREPARAR EDICIÓN DE CLIENTE O BARBERO
  const editarUsuario = (usuario: UsuarioAdmin) => {
    setUsuarioEditando(usuario);

    setFormUsuario({
      nombre: usuario.nombre,
      correo: usuario.correo,
      password: "",
    });

    setImagenBarbero(null);
    setMensaje("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // GUARDAR CAMBIOS DEL USUARIO
  const guardarUsuario = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!usuarioEditando) {
      setError("No hay ningún usuario seleccionado para editar.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const idUsuario = usuarioEditando.idUsuario;

      await api(`/api/usuarios/${idUsuario}`, {
        method: "PUT",
        autenticado: true,
        body: JSON.stringify({
          nombre: formUsuario.nombre.trim(),
          correo: formUsuario.correo.trim(),
          password: formUsuario.password,
        }),
      });

      if (usuarioEditando.rol === "BARBERO" && imagenBarbero) {
        await subirImagen(
          `/api/usuarios/barberos/${idUsuario}/imagen`,
          imagenBarbero
        );
      }

      setMensaje("Usuario actualizado correctamente.");

      setUsuarioEditando(null);
      setFormUsuario(usuarioInicial);
      setImagenBarbero(null);

      await cargarUsuarios();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el usuario"
      );
    } finally {
      setGuardando(false);
    }
  };

  // CANCELAR EDICIÓN DE USUARIO
  const cancelarEdicionUsuario = () => {
    setUsuarioEditando(null);
    setFormUsuario(usuarioInicial);
    setImagenBarbero(null);
    setMensaje("");
    setError("");
  };

  // ACTIVAR O DESACTIVAR USUARIO
  const cambiarEstadoUsuario = async (usuario: UsuarioAdmin) => {
    const nuevoEstado = !usuario.activo;

    const confirmacion = window.confirm(
      `¿Deseas ${nuevoEstado ? "activar" : "desactivar"} a ${usuario.nombre}?`
    );

    if (!confirmacion) return;

    try {
      setError("");
      setMensaje("");

      await api(
        `/api/usuarios/${usuario.idUsuario}/estado?activo=${nuevoEstado}`,
        {
          method: "PATCH",
          autenticado: true,
        }
      );

      setMensaje(
        `Usuario ${nuevoEstado ? "activado" : "desactivado"} correctamente.`
      );

      await cargarUsuarios();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar el estado del usuario"
      );
    }
  };

  // ELIMINAR USUARIO
  const eliminarUsuario = async (usuario: UsuarioAdmin) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      setError("");
      setMensaje("");

      await api(`/api/usuarios/${usuario.idUsuario}`, {
        method: "DELETE",
        autenticado: true,
      });

      setMensaje("Usuario eliminado correctamente.");

      if (usuarioEditando?.idUsuario === usuario.idUsuario) {
        cancelarEdicionUsuario();
      }

      await cargarUsuarios();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el usuario. Si tiene reservaciones, debes desactivarlo."
      );
    }
  };

  // REGISTRAR O EDITAR SERVICIO
  const guardarServicio = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const precio = Number(formServicio.precio);

    if (!Number.isFinite(precio) || precio <= 0) {
      setError("Ingresa un precio válido mayor que cero.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const datos = {
        nombre: formServicio.nombre.trim(),
        descripcion: formServicio.descripcion.trim(),
        icono: formServicio.icono.trim(),
        precio,
        activo: true,
      };

      let servicio: Servicio;

      if (servicioEditando) {
        servicio = await api<Servicio>(
          `/api/servicios/${servicioEditando.idServicio}`,
          {
            method: "PUT",
            autenticado: true,
            body: JSON.stringify(datos),
          }
        );
      } else {
        servicio = await api<Servicio>("/api/servicios", {
          method: "POST",
          autenticado: true,
          body: JSON.stringify(datos),
        });
      }

      if (imagenServicio) {
        await subirImagen(
          `/api/servicios/${servicio.idServicio}/imagen`,
          imagenServicio
        );
      }

      setFormServicio(servicioInicial);
      setServicioEditando(null);
      setImagenServicio(null);

      setMensaje(
        servicioEditando
          ? "Servicio actualizado correctamente."
          : "Servicio registrado correctamente."
      );

      await cargarServicios();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el servicio"
      );
    } finally {
      setGuardando(false);
    }
  };

  // PREPARAR EDICIÓN DE SERVICIO
  const editarServicio = (servicio: Servicio) => {
    setServicioEditando(servicio);

    setFormServicio({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      icono: servicio.icono,
      precio: String(servicio.precio),
    });

    setImagenServicio(null);
    setMensaje("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // DESACTIVAR SERVICIO
  const desactivarServicio = async (id: number) => {
    if (!window.confirm("¿Deseas desactivar este servicio?")) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      await api(`/api/servicios/${id}/estado?activo=false`, {
        method: "PATCH",
        autenticado: true,
      });

      setMensaje("Servicio desactivado correctamente.");

      await cargarServicios();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo desactivar el servicio"
      );
    }
  };

  // REGISTRAR O EDITAR CORTE
  const guardarCorte = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const precio = Number(formCorte.precio);

    if (!Number.isFinite(precio) || precio <= 0) {
      setError("Ingresa un precio válido mayor que cero.");
      return;
    }

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      const datos = {
        nombre: formCorte.nombre.trim(),
        descripcion: formCorte.descripcion.trim(),
        precio,
        activo: true,
      };

      let corte: Corte;

      if (corteEditando) {
        corte = await api<Corte>(
          `/api/cortes/${corteEditando.idCorte}`,
          {
            method: "PUT",
            autenticado: true,
            body: JSON.stringify(datos),
          }
        );
      } else {
        corte = await api<Corte>("/api/cortes", {
          method: "POST",
          autenticado: true,
          body: JSON.stringify(datos),
        });
      }

      if (imagenCorte) {
        await subirImagen(
          `/api/cortes/${corte.idCorte}/imagen`,
          imagenCorte
        );
      }

      setFormCorte(corteInicial);
      setCorteEditando(null);
      setImagenCorte(null);

      setMensaje(
        corteEditando
          ? "Corte actualizado correctamente."
          : "Corte registrado correctamente."
      );

      await cargarCortes();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el corte"
      );
    } finally {
      setGuardando(false);
    }
  };

  // PREPARAR EDICIÓN DE CORTE
  const editarCorte = (corte: Corte) => {
    setCorteEditando(corte);

    setFormCorte({
      nombre: corte.nombre,
      descripcion: corte.descripcion,
      precio: String(corte.precio),
    });

    setImagenCorte(null);
    setMensaje("");
    setError("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // DESACTIVAR CORTE
  const desactivarCorte = async (id: number) => {
    if (!window.confirm("¿Deseas desactivar este corte?")) {
      return;
    }

    try {
      setError("");
      setMensaje("");

      await api(`/api/cortes/${id}/estado?activo=false`, {
        method: "PATCH",
        autenticado: true,
      });

      setMensaje("Corte desactivado correctamente.");

      await cargarCortes();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo desactivar el corte"
      );
    }
  };

  // FILTRAR RESERVACIONES
  const reservacionesFiltradas = useMemo(() => {
    return reservaciones.filter((reserva) => {
      const texto = busqueda.toLowerCase();

      const coincideBusqueda =
        reserva.nombre.toLowerCase().includes(texto) ||
        reserva.correoCliente.toLowerCase().includes(texto) ||
        reserva.barbero.toLowerCase().includes(texto) ||
        reserva.servicio.toLowerCase().includes(texto);

      const coincideEstado =
        filtroEstado === "todas" ||
        reserva.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [reservaciones, busqueda, filtroEstado]);

  // OBTENER CLIENTES
  const clientes = useMemo(() => {
    return usuarios.filter((usuario) => usuario.rol === "CLIENTE");
  }, [usuarios]);

  // OBTENER BARBEROS
  const barberos = useMemo(() => {
    return usuarios.filter((usuario) => usuario.rol === "BARBERO");
  }, [usuarios]);

  // FILTRAR CLIENTES
  const clientesFiltrados = useMemo(() => {
    const texto = busquedaUsuarios.toLowerCase();

    return clientes.filter(
      (cliente) =>
        cliente.nombre.toLowerCase().includes(texto) ||
        cliente.correo.toLowerCase().includes(texto)
    );
  }, [clientes, busquedaUsuarios]);

  // FILTRAR BARBEROS
  const barberosFiltrados = useMemo(() => {
    const texto = busquedaUsuarios.toLowerCase();

    return barberos.filter(
      (barbero) =>
        barbero.nombre.toLowerCase().includes(texto) ||
        barbero.correo.toLowerCase().includes(texto)
    );
  }, [barberos, busquedaUsuarios]);

  // ESTADÍSTICAS
  const activas = reservaciones.filter(
    (reserva) =>
      reserva.estado === "PENDIENTE" ||
      reserva.estado === "CONFIRMADA"
  ).length;

  const canceladas = reservaciones.filter(
    (reserva) => reserva.estado === "CANCELADA"
  ).length;

  return (
    <main className="panel-admin">
      <header className="admin-encabezado">
        <div>
          <span className="admin-etiqueta">BERRACOS BARBER</span>
          <h1>Panel de administrador</h1>
          <p>
            Administra las reservaciones y consulta la información del negocio.
          </p>
        </div>
      </header>

      {/* MENÚ DE ADMINISTRACIÓN */}
      <nav className="admin-menu">
        <button
          className={seccion === "inicio" ? "seleccionado" : ""}
          onClick={() => setSeccion("inicio")}
        >
          <span>⌂</span> Resumen
        </button>

        <button
          className={seccion === "reservaciones" ? "seleccionado" : ""}
          onClick={() => {
            setSeccion("reservaciones");
            cargarReservaciones();
          }}
        >
          <span>▣</span> Reservaciones
        </button>

        <button
          className={seccion === "clientes" ? "seleccionado" : ""}
          onClick={() => {
            setSeccion("clientes");
            setBusquedaUsuarios("");
            cargarUsuarios();
          }}
        >
          <span>♙</span> Clientes
        </button>

        <button
          className={seccion === "barberos" ? "seleccionado" : ""}
          onClick={() => {
            setSeccion("barberos");
            setBusquedaUsuarios("");
            cargarUsuarios();
          }}
        >
          <span>✂</span> Barberos
        </button>

        <button
          className={seccion === "servicios" ? "seleccionado" : ""}
          onClick={() => {
            setSeccion("servicios");
            cargarServicios();
          }}
        >
          <span>✧</span> Servicios
        </button>

        <button
          className={seccion === "cortes" ? "seleccionado" : ""}
          onClick={() => {
            setSeccion("cortes");
            cargarCortes();
          }}
        >
          <span>◈</span> Cortes
        </button>
      </nav>

      {/* MENSAJES */}
      {error && (
        <div className="admin-mensaje admin-mensaje-error">
          {error}
        </div>
      )}

      {mensaje && (
        <div className="admin-mensaje admin-mensaje-exito">
          {mensaje}
        </div>
      )}

      {/* RESUMEN */}
      {seccion === "inicio" && (
        <section className="admin-contenido">
          <h2>Resumen general</h2>

          <div className="admin-estadisticas">
            <article className="admin-estadistica">
              <span>Total de reservaciones</span>
              <strong>{reservaciones.length}</strong>
            </article>

            <article className="admin-estadistica">
              <span>Reservaciones activas</span>
              <strong>{activas}</strong>
            </article>

            <article className="admin-estadistica">
              <span>Reservaciones canceladas</span>
              <strong>{canceladas}</strong>
            </article>

            <article className="admin-estadistica">
              <span>Clientes registrados</span>
              <strong>{clientes.length}</strong>
            </article>

            <article className="admin-estadistica">
              <span>Barberos registrados</span>
              <strong>{barberos.length}</strong>
            </article>

            <article className="admin-estadistica">
              <span>Servicios registrados</span>
              <strong>{servicios.filter((s) => s.activo).length}</strong>
            </article>

            <article className="admin-estadistica">
              <span>Cortes registrados</span>
              <strong>{cortes.filter((c) => c.activo).length}</strong>
            </article>
          </div>

          <div className="admin-resumen">
            <div>
              <h3>Reservaciones recientes</h3>
              <p>Consulta las últimas citas registradas.</p>
            </div>

            <button
              className="admin-boton-principal"
              onClick={() => {
                setSeccion("reservaciones");
                cargarReservaciones();
              }}
            >
              Ver todas
            </button>
          </div>

          <div className="admin-tabla-contenedor">
            {cargandoReservaciones ? (
              <p className="admin-vacio">
                Cargando reservaciones...
              </p>
            ) : reservaciones.length === 0 ? (
              <p className="admin-vacio">
                Todavía no hay reservaciones registradas.
              </p>
            ) : (
              <div className="admin-lista">
                {reservaciones.slice(0, 5).map((reserva) => (
                  <article
                    className="admin-reserva"
                    key={reserva.idReserva}
                  >
                    <div>
                      <strong>{reserva.nombre}</strong>

                      <span>
                        {reserva.servicio} · {reserva.barbero}
                      </span>

                      <small>
                        {reserva.fecha} · {reserva.hora.slice(0, 5)}
                      </small>
                    </div>

                    <span
                      className={`admin-estado ${reserva.estado.toLowerCase()}`}
                    >
                      {reserva.estado}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* RESERVACIONES */}
      {seccion === "reservaciones" && (
        <section className="admin-contenido">
          <h2>Administrar reservaciones</h2>

          <p className="admin-descripcion">
            Consulta todas las citas registradas en BERRACOS BARBER.
          </p>

          <div className="admin-resumen">
            <div>
              <h3>Reservaciones registradas</h3>
              <p>Total: {reservaciones.length}</p>
            </div>

            <button
              className="admin-boton-secundario"
              type="button"
              onClick={cargarReservaciones}
              disabled={cargandoReservaciones}
            >
              {cargandoReservaciones ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="admin-filtros">
            <input
              type="search"
              placeholder="Buscar cliente, correo, servicio o barbero..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todas">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="CANCELADA">Canceladas</option>
              <option value="COMPLETADA">Completadas</option>
            </select>
          </div>

          {cargandoReservaciones ? (
            <p className="admin-vacio">
              Cargando reservaciones...
            </p>
          ) : reservacionesFiltradas.length === 0 ? (
            <p className="admin-vacio">
              No se encontraron reservaciones.
            </p>
          ) : (
            <div className="admin-lista">
              {reservacionesFiltradas.map((reserva) => (
                <article
                  className="admin-reserva admin-reserva-completa"
                  key={reserva.idReserva}
                >
                  <div className="admin-reserva-informacion">
                    <strong>{reserva.nombre}</strong>

                    <span>{reserva.correoCliente}</span>

                    <span>
                      Tipo:{" "}
                      {reserva.tipoProducto === "CORTE"
                        ? "Corte"
                        : "Servicio"}
                    </span>

                    <span>
                      Producto: {reserva.servicio}
                    </span>

                    <span>
                      Barbero: {reserva.barbero}
                    </span>

                    <small>
                      Fecha: {reserva.fecha} · Hora:{" "}
                      {reserva.hora.slice(0, 5)}
                    </small>

                    <strong className="admin-precio">
                      {Number(reserva.precio).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })}
                    </strong>
                  </div>

                  <div className="admin-reserva-acciones">
                    <span
                      className={`admin-estado ${reserva.estado.toLowerCase()}`}
                    >
                      {reserva.estado}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CLIENTES */}
      {seccion === "clientes" && (
        <section className="admin-contenido">
          <h2>Administrar clientes</h2>

          <p className="admin-descripcion">
            Consulta, edita y administra los clientes registrados.
          </p>

          {usuarioEditando?.rol === "CLIENTE" && (
            <form className="admin-formulario" onSubmit={guardarUsuario}>
              <h3>Editar cliente</h3>

              <label>Nombre completo</label>

              <input
                type="text"
                required
                maxLength={100}
                value={formUsuario.nombre}
                onChange={(e) =>
                  setFormUsuario({
                    ...formUsuario,
                    nombre: e.target.value,
                  })
                }
              />

              <label>Correo electrónico</label>

              <input
                type="email"
                required
                value={formUsuario.correo}
                onChange={(e) =>
                  setFormUsuario({
                    ...formUsuario,
                    correo: e.target.value,
                  })
                }
              />

              <label>Nueva contraseña (opcional)</label>

              <input
                type="password"
                minLength={6}
                value={formUsuario.password}
                onChange={(e) =>
                  setFormUsuario({
                    ...formUsuario,
                    password: e.target.value,
                  })
                }
                placeholder="Dejar vacío para conservar la actual"
              />

              <div className="admin-formulario-acciones">
                <button
                  className="admin-boton-principal"
                  type="submit"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  className="admin-boton-secundario"
                  onClick={cancelarEdicionUsuario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          <div className="admin-filtros">
            <input
              type="search"
              placeholder="Buscar cliente por nombre o correo..."
              value={busquedaUsuarios}
              onChange={(e) => setBusquedaUsuarios(e.target.value)}
            />
          </div>

          {cargandoUsuarios ? (
            <p className="admin-vacio">Cargando clientes...</p>
          ) : clientesFiltrados.length === 0 ? (
            <p className="admin-vacio">
              No se encontraron clientes registrados.
            </p>
          ) : (
            <div className="admin-lista">
              {clientesFiltrados.map((cliente) => (
                <article
                  className="admin-reserva admin-reserva-completa"
                  key={cliente.idUsuario}
                >
                  <div className="admin-reserva-informacion">
                    <strong>{cliente.nombre}</strong>
                    <span>{cliente.correo}</span>
                    <small>ID de usuario: {cliente.idUsuario}</small>
                  </div>

                  <div className="admin-reserva-acciones">
                    <span
                      className={`admin-estado ${
                        cliente.activo ? "activa" : "cancelada"
                      }`}
                    >
                      {cliente.activo ? "Activo" : "Inactivo"}
                    </span>

                    <button
                      type="button"
                      className="admin-boton-editar"
                      onClick={() => editarUsuario(cliente)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className={
                        cliente.activo
                          ? "admin-boton-cancelar"
                          : "admin-boton-activar"
                      }
                      onClick={() => cambiarEstadoUsuario(cliente)}
                    >
                      {cliente.activo ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      type="button"
                      className="admin-boton-cancelar"
                      onClick={() => eliminarUsuario(cliente)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* BARBEROS */}
      {seccion === "barberos" && (
        <section className="admin-contenido">
          <h2>Administrar barberos</h2>

          <p className="admin-descripcion">
            Registra, consulta y administra los barberos de BERRACOS BARBER.
          </p>

          {usuarioEditando?.rol === "BARBERO" && (
            <form className="admin-formulario" onSubmit={guardarUsuario}>
              <h3>Editar barbero</h3>

              <label>Nombre completo</label>

              <input
                type="text"
                required
                maxLength={100}
                value={formUsuario.nombre}
                onChange={(e) =>
                  setFormUsuario({
                    ...formUsuario,
                    nombre: e.target.value,
                  })
                }
              />

              <label>Correo electrónico</label>

              <input
                type="email"
                required
                value={formUsuario.correo}
                onChange={(e) =>
                  setFormUsuario({
                    ...formUsuario,
                    correo: e.target.value,
                  })
                }
              />

              <label>Nueva contraseña (opcional)</label>

              <input
                type="password"
                minLength={6}
                value={formUsuario.password}
                onChange={(e) =>
                  setFormUsuario({
                    ...formUsuario,
                    password: e.target.value,
                  })
                }
                placeholder="Dejar vacío para conservar la actual"
              />

              <label>Fotografía del barbero</label>

              {usuarioEditando.imagen && (
                <img
                  src={urlImagen(usuarioEditando.imagen)}
                  alt={usuarioEditando.nombre}
                  className="admin-imagen-preview"
                />
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  setImagenBarbero(e.target.files?.[0] || null)
                }
              />

              {imagenBarbero && (
                <small>Archivo seleccionado: {imagenBarbero.name}</small>
              )}

              <div className="admin-formulario-acciones">
                <button
                  className="admin-boton-principal"
                  type="submit"
                  disabled={guardando}
                >
                  {guardando ? "Guardando..." : "Guardar cambios"}
                </button>

                <button
                  type="button"
                  className="admin-boton-secundario"
                  onClick={cancelarEdicionUsuario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {usuarioEditando?.rol !== "BARBERO" && (
            <form className="admin-formulario" onSubmit={guardarBarbero}>
              <h3>Registrar nuevo barbero</h3>

              <label>Nombre completo</label>

              <input
                type="text"
                required
                maxLength={100}
                value={formBarbero.nombre}
                onChange={(e) =>
                  setFormBarbero({
                    ...formBarbero,
                    nombre: e.target.value,
                  })
                }
                placeholder="Ej. Carlos Ramírez"
              />

              <label>Correo electrónico</label>

              <input
                type="email"
                required
                maxLength={150}
                value={formBarbero.correo}
                onChange={(e) =>
                  setFormBarbero({
                    ...formBarbero,
                    correo: e.target.value,
                  })
                }
                placeholder="barbero@berracos.com"
              />

              <label>Contraseña</label>

              <input
                type="password"
                required
                minLength={6}
                value={formBarbero.password}
                onChange={(e) =>
                  setFormBarbero({
                    ...formBarbero,
                    password: e.target.value,
                  })
                }
                placeholder="Ingresa una contraseña"
              />

              <label>Fotografía del barbero</label>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  setImagenBarbero(e.target.files?.[0] || null)
                }
              />

              {imagenBarbero && (
                <small>Archivo seleccionado: {imagenBarbero.name}</small>
              )}

              <div className="admin-formulario-acciones">
                <button
                  className="admin-boton-principal"
                  type="submit"
                  disabled={guardando}
                >
                  {guardando ? "Registrando..." : "Registrar barbero"}
                </button>
              </div>
            </form>
          )}

          <div className="admin-resumen">
            <div>
              <h3>Barberos registrados</h3>
              <p>Total de barberos: {barberos.length}</p>
            </div>

            <button
              className="admin-boton-secundario"
              type="button"
              onClick={cargarUsuarios}
              disabled={cargandoUsuarios}
            >
              {cargandoUsuarios ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          <div className="admin-filtros">
            <input
              type="search"
              placeholder="Buscar barbero por nombre o correo..."
              value={busquedaUsuarios}
              onChange={(e) => setBusquedaUsuarios(e.target.value)}
            />
          </div>

          {cargandoUsuarios ? (
            <p className="admin-vacio">Cargando barberos...</p>
          ) : barberosFiltrados.length === 0 ? (
            <p className="admin-vacio">No hay barberos registrados.</p>
          ) : (
            <div className="admin-lista">
              {barberosFiltrados.map((barbero) => (
                <article
                  className="admin-reserva admin-reserva-completa"
                  key={barbero.idUsuario}
                >
                  <div className="admin-reserva-informacion">
                    {barbero.imagen && (
                      <img
                        src={urlImagen(barbero.imagen)}
                        alt={barbero.nombre}
                        className="admin-imagen-catalogo"
                      />
                    )}

                    <strong>{barbero.nombre}</strong>
                    <span>{barbero.correo}</span>
                    <small>ID de usuario: {barbero.idUsuario}</small>
                  </div>

                  <div className="admin-reserva-acciones">
                    <span
                      className={`admin-estado ${
                        barbero.activo ? "activa" : "cancelada"
                      }`}
                    >
                      {barbero.activo ? "Activo" : "Inactivo"}
                    </span>

                    <button
                      type="button"
                      className="admin-boton-editar"
                      onClick={() => editarUsuario(barbero)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className={
                        barbero.activo
                          ? "admin-boton-cancelar"
                          : "admin-boton-activar"
                      }
                      onClick={() => cambiarEstadoUsuario(barbero)}
                    >
                      {barbero.activo ? "Desactivar" : "Activar"}
                    </button>

                    <button
                      type="button"
                      className="admin-boton-cancelar"
                      onClick={() => eliminarUsuario(barbero)}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SERVICIOS */}
      {seccion === "servicios" && (
        <section className="admin-contenido">
          <h2>Administrar servicios</h2>

          <p className="admin-descripcion">
            Registra y modifica los servicios disponibles en la barbería.
          </p>

          <form className="admin-formulario" onSubmit={guardarServicio}>
            <h3>
              {servicioEditando ? "Editar servicio" : "Registrar servicio"}
            </h3>

            <label>Nombre del servicio</label>

            <input
              required
              maxLength={100}
              value={formServicio.nombre}
              onChange={(e) =>
                setFormServicio({
                  ...formServicio,
                  nombre: e.target.value,
                })
              }
              placeholder="Ej. Corte de cabello"
            />

            <label>Descripción</label>

            <textarea
              required
              maxLength={500}
              value={formServicio.descripcion}
              onChange={(e) =>
                setFormServicio({
                  ...formServicio,
                  descripcion: e.target.value,
                })
              }
              placeholder="Describe el servicio..."
            />

            <label>Icono</label>

            <input
              required
              maxLength={20}
              value={formServicio.icono}
              onChange={(e) =>
                setFormServicio({
                  ...formServicio,
                  icono: e.target.value,
                })
              }
              placeholder="Ej. ✂"
            />

            <label>Precio (MXN)</label>

            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={formServicio.precio}
              onChange={(e) =>
                setFormServicio({
                  ...formServicio,
                  precio: e.target.value,
                })
              }
              placeholder="Ej. 150"
            />

            <label>Imagen del servicio</label>

            {servicioEditando?.imagen && (
              <img
                src={urlImagen(servicioEditando.imagen)}
                alt={servicioEditando.nombre}
                className="admin-imagen-preview"
              />
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setImagenServicio(e.target.files?.[0] || null)
              }
            />

            {imagenServicio && (
              <small>Archivo seleccionado: {imagenServicio.name}</small>
            )}

            <div className="admin-formulario-acciones">
              <button
                className="admin-boton-principal"
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : servicioEditando
                    ? "Guardar cambios"
                    : "Registrar servicio"}
              </button>

              {servicioEditando && (
                <button
                  type="button"
                  className="admin-boton-secundario"
                  onClick={() => {
                    setServicioEditando(null);
                    setFormServicio(servicioInicial);
                    setImagenServicio(null);
                    setError("");
                    setMensaje("");
                  }}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          <h3 className="admin-subtitulo">Servicios registrados</h3>

          {cargando ? (
            <p className="admin-vacio">Cargando servicios...</p>
          ) : servicios.length === 0 ? (
            <p className="admin-vacio">No hay servicios registrados.</p>
          ) : (
            <div className="admin-lista">
              {servicios.map((servicio) => (
                <article
                  className="admin-reserva"
                  key={servicio.idServicio}
                >
                  <div className="admin-catalogo-informacion">
                    {servicio.imagen && (
                      <img
                        src={urlImagen(servicio.imagen)}
                        alt={servicio.nombre}
                        className="admin-imagen-catalogo"
                      />
                    )}

                    <strong>
                      {servicio.icono} {servicio.nombre}
                    </strong>

                    <span>{servicio.descripcion}</span>

                    <strong className="admin-precio">
                      {Number(servicio.precio).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })}
                    </strong>

                    <small>
                      Estado: {servicio.activo ? "Activo" : "Inactivo"}
                    </small>
                  </div>

                  <div className="admin-catalogo-acciones">
                    <button
                      className="admin-boton-editar"
                      onClick={() => editarServicio(servicio)}
                      disabled={!servicio.activo}
                    >
                      Editar
                    </button>

                    {servicio.activo && (
                      <button
                        className="admin-boton-cancelar"
                        onClick={() =>
                          desactivarServicio(servicio.idServicio)
                        }
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* CORTES */}
      {seccion === "cortes" && (
        <section className="admin-contenido">
          <h2>Administrar cortes</h2>

          <p className="admin-descripcion">
            Registra y modifica los estilos de corte disponibles.
          </p>

          <form className="admin-formulario" onSubmit={guardarCorte}>
            <h3>
              {corteEditando ? "Editar corte" : "Registrar corte"}
            </h3>

            <label>Nombre del corte</label>

            <input
              required
              maxLength={100}
              value={formCorte.nombre}
              onChange={(e) =>
                setFormCorte({
                  ...formCorte,
                  nombre: e.target.value,
                })
              }
              placeholder="Ej. Low Fade"
            />

            <label>Descripción</label>

            <textarea
              required
              maxLength={500}
              value={formCorte.descripcion}
              onChange={(e) =>
                setFormCorte({
                  ...formCorte,
                  descripcion: e.target.value,
                })
              }
              placeholder="Describe el corte..."
            />

            <label>Precio (MXN)</label>

            <input
              required
              type="number"
              min="0.01"
              step="0.01"
              value={formCorte.precio}
              onChange={(e) =>
                setFormCorte({
                  ...formCorte,
                  precio: e.target.value,
                })
              }
              placeholder="Ej. 250"
            />

            <label>Imagen del corte</label>

            {corteEditando?.imagen && (
              <img
                src={urlImagen(corteEditando.imagen)}
                alt={corteEditando.nombre}
                className="admin-imagen-preview"
              />
            )}

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setImagenCorte(e.target.files?.[0] || null)
              }
            />

            {imagenCorte && (
              <small>Archivo seleccionado: {imagenCorte.name}</small>
            )}

            <div className="admin-formulario-acciones">
              <button
                className="admin-boton-principal"
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : corteEditando
                    ? "Guardar cambios"
                    : "Registrar corte"}
              </button>

              {corteEditando && (
                <button
                  type="button"
                  className="admin-boton-secundario"
                  onClick={() => {
                    setCorteEditando(null);
                    setFormCorte(corteInicial);
                    setImagenCorte(null);
                    setError("");
                    setMensaje("");
                  }}
                >
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          <h3 className="admin-subtitulo">Cortes registrados</h3>

          {cargando ? (
            <p className="admin-vacio">Cargando cortes...</p>
          ) : cortes.length === 0 ? (
            <p className="admin-vacio">No hay cortes registrados.</p>
          ) : (
            <div className="admin-lista">
              {cortes.map((corte) => (
                <article
                  className="admin-reserva"
                  key={corte.idCorte}
                >
                  <div className="admin-catalogo-informacion">
                    {corte.imagen && (
                      <img
                        src={urlImagen(corte.imagen)}
                        alt={corte.nombre}
                        className="admin-imagen-catalogo"
                      />
                    )}

                    <strong>{corte.nombre}</strong>

                    <span>{corte.descripcion}</span>

                    <strong className="admin-precio">
                      {Number(corte.precio).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                      })}
                    </strong>

                    <small>
                      Estado: {corte.activo ? "Activo" : "Inactivo"}
                    </small>
                  </div>

                  <div className="admin-catalogo-acciones">
                    <button
                      className="admin-boton-editar"
                      onClick={() => editarCorte(corte)}
                      disabled={!corte.activo}
                    >
                      Editar
                    </button>

                    {corte.activo && (
                      <button
                        className="admin-boton-cancelar"
                        onClick={() => desactivarCorte(corte.idCorte)}
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
