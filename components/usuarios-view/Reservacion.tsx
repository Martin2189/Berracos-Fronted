
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { jsPDF } from "jspdf";
import { api } from "@/lib/api";
import { obtenerSesion } from "@/lib/sesion";

type Servicio = {
  idServicio: number;
  nombre: string;
  descripcion: string;
  icono: string;
  precio: number;
  activo: boolean;
};

type Corte = {
  idCorte: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen?: string | null;
  activo: boolean;
};

type Barbero = {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  imagen?: string | null;
};

type TipoProducto = "SERVICIO" | "CORTE";

type ReservaFormulario = {
  nombre: string;
  servicio: string;
  tipoProducto: TipoProducto;
  barbero: string;
  barberoId: string;
  fecha: string;
  hora: string;
};

type RespuestaReserva = {
  idReserva?: number;
};

type ReservacionProps = {
  cambiarVista: (vista: string) => void;
};

const nombresMeses = [
  "Enero", "Febrero", "Marzo", "Abril",
  "Mayo", "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const nombresDias = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

const horarios = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00",
];

function crearFechaISO(anio: number, mes: number, dia: number) {
  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function formatearFecha(fecha: string) {
  if (!fecha) return "";

  const [anio, mes, dia] = fecha.split("-").map(Number);

  return `${dia} de ${nombresMeses[mes - 1]} de ${anio}`;
}

function formatearPrecio(precio: number) {
  return Number(precio).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

export default function Reservacion({
  cambiarVista,
}: ReservacionProps) {
  const hoy = new Date();

  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [cortes, setCortes] = useState<Corte[]>([]);
  const [barberos, setBarberos] = useState<Barbero[]>([]);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  const [diaSeleccionado, setDiaSeleccionado] =
    useState<number | null>(null);

  const [horaSeleccionada, setHoraSeleccionada] =
    useState<string | null>(null);

  const [horariosOcupados, setHorariosOcupados] =
    useState<string[]>([]);

  const [confirmado, setConfirmado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [mensajeError, setMensajeError] = useState("");

  const [idReservaRegistrada, setIdReservaRegistrada] =
    useState<number | null>(null);

  const [reserva, setReserva] = useState<ReservaFormulario>({
    nombre: "",
    servicio: "",
    tipoProducto: "SERVICIO",
    barbero: "",
    barberoId: "",
    fecha: "",
    hora: "",
  });

  const servicioSeleccionado = servicios.find(
    (servicio) => servicio.nombre === reserva.servicio
  );

  const corteSeleccionado = cortes.find(
    (corte) => corte.nombre === reserva.servicio
  );

  const productoSeleccionado =
    reserva.tipoProducto === "SERVICIO"
      ? servicioSeleccionado
      : corteSeleccionado;

  useEffect(() => {
    const usuario = obtenerSesion();

    if (!usuario) {
      cambiarVista("login");
      return;
    }

    setReserva((prev) => ({
      ...prev,
      nombre: usuario.nombre,
    }));

    async function cargarDatos() {
      try {
        const [
          datosServicios,
          datosCortes,
          datosBarberos,
        ] = await Promise.all([
          api<Servicio[]>("/api/servicios"),
          api<Corte[]>("/api/cortes"),
          api<Barbero[]>("/api/usuarios/barberos"),
        ]);

        const serviciosActivos = datosServicios.filter(
          (servicio) => servicio.activo
        );

        const cortesActivos = datosCortes.filter(
          (corte) => corte.activo
        );

        const barberosActivos = datosBarberos.filter(
          (barbero) =>
            barbero.rol === "BARBERO" &&
            barbero.activo
        );

        setServicios(serviciosActivos);
        setCortes(cortesActivos);
        setBarberos(barberosActivos);

        let barberoGuardado: Barbero | undefined;

        const seleccionBarbero = localStorage.getItem(
          "berracos-barbero-seleccionado"
        );

        if (seleccionBarbero) {
          try {
            const datos = JSON.parse(seleccionBarbero);

            barberoGuardado = barberosActivos.find(
              (barbero) =>
                Number(barbero.idUsuario) ===
                Number(datos.idUsuario)
            );
          } catch {
            localStorage.removeItem(
              "berracos-barbero-seleccionado"
            );
          }
        }

        const seleccionCita = localStorage.getItem(
          "berracos-cita-seleccionada"
        );

        if (seleccionCita) {
          try {
            const seleccion = JSON.parse(seleccionCita);

            const barberoCita = barberosActivos.find(
              (barbero) =>
                Number(barbero.idUsuario) ===
                  Number(seleccion.idBarbero) ||
                barbero.nombre.toLowerCase() ===
                  String(seleccion.barbero || "").toLowerCase()
            );

            if (barberoCita) {
              barberoGuardado = barberoCita;
            }

            if (
              Number.isInteger(seleccion.dia) &&
              Number.isInteger(seleccion.mes) &&
              Number.isInteger(seleccion.anio) &&
              seleccion.dia >= 1 &&
              seleccion.dia <= 31 &&
              seleccion.mes >= 0 &&
              seleccion.mes <= 11
            ) {
              const fecha = crearFechaISO(
                seleccion.anio,
                seleccion.mes,
                seleccion.dia
              );

              const fechaSeleccionada = new Date(
                seleccion.anio,
                seleccion.mes,
                seleccion.dia
              );

              const fechaValida =
                fechaSeleccionada.getFullYear() ===
                  seleccion.anio &&
                fechaSeleccionada.getMonth() ===
                  seleccion.mes &&
                fechaSeleccionada.getDate() ===
                  seleccion.dia;

              if (fechaValida) {
                setMes(seleccion.mes);
                setAnio(seleccion.anio);
                setDiaSeleccionado(seleccion.dia);

                setReserva((prev) => ({
                  ...prev,
                  fecha,
                }));
              }
            }

            localStorage.removeItem(
              "berracos-cita-seleccionada"
            );
          } catch {
            localStorage.removeItem(
              "berracos-cita-seleccionada"
            );
          }
        }

        if (barberoGuardado) {
          setReserva((prev) => ({
            ...prev,
            barbero: barberoGuardado.nombre,
            barberoId: String(barberoGuardado.idUsuario),
          }));
        }
      } catch (error) {
        setMensajeError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los servicios, cortes y barberos."
        );
      } finally {
        setCargandoDatos(false);
      }
    }

    cargarDatos();
  }, [cambiarVista]);

  useEffect(() => {
    if (!reserva.barberoId || !reserva.fecha) {
      setHorariosOcupados([]);
      return;
    }

    let cancelado = false;

    async function consultarDisponibilidad() {
      setCargandoHorarios(true);
      setHorariosOcupados([]);

      try {
        const parametros = new URLSearchParams({
          idBarbero: reserva.barberoId,
          fecha: reserva.fecha,
        });

        const datos = await api<string[]>(
          `/api/reservas/disponibilidad?${parametros.toString()}`,
          {
            autenticado: true,
          }
        );

        if (!cancelado) {
          setHorariosOcupados(
            datos.map((hora) => hora.slice(0, 5))
          );
        }
      } catch (error) {
        if (!cancelado) {
          setMensajeError(
            error instanceof Error
              ? error.message
              : "No se pudo consultar la disponibilidad."
          );
        }
      } finally {
        if (!cancelado) {
          setCargandoHorarios(false);
        }
      }
    }

    consultarDisponibilidad();

    return () => {
      cancelado = true;
    };
  }, [reserva.barberoId, reserva.fecha]);

  const primerDia = new Date(anio, mes, 1).getDay();
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();

  const cambiarMes = (direccion: number) => {
    setDiaSeleccionado(null);
    setHoraSeleccionada(null);
    setMensajeError("");

    setReserva((prev) => ({
      ...prev,
      fecha: "",
      hora: "",
    }));

    const nuevaFecha = new Date(anio, mes + direccion, 1);

    setMes(nuevaFecha.getMonth());
    setAnio(nuevaFecha.getFullYear());
  };

  const esDiaPasado = (dia: number) => {
    const fecha = new Date(anio, mes, dia);

    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);

    return fecha < fechaHoy;
  };

  const esHoy = (dia: number) =>
    dia === new Date().getDate() &&
    mes === new Date().getMonth() &&
    anio === new Date().getFullYear();

  const seleccionarDia = (dia: number) => {
    if (esDiaPasado(dia)) return;

    setDiaSeleccionado(dia);
    setHoraSeleccionada(null);
    setMensajeError("");

    setReserva((prev) => ({
      ...prev,
      fecha: crearFechaISO(anio, mes, dia),
      hora: "",
    }));
  };

  const seleccionarBarbero = (id: string) => {
    const barbero = barberos.find(
      (item) => Number(item.idUsuario) === Number(id)
    );

    if (!barbero) {
      setMensajeError(
        "No se pudo identificar al barbero seleccionado."
      );
      return;
    }

    setMensajeError("");
    setHoraSeleccionada(null);
    setHorariosOcupados([]);

    setReserva((prev) => ({
      ...prev,
      barbero: barbero.nombre,
      barberoId: String(barbero.idUsuario),
      hora: "",
    }));
  };

  const seleccionarTipoProducto = (tipo: TipoProducto) => {
    setMensajeError("");

    setReserva((prev) => ({
      ...prev,
      tipoProducto: tipo,
      servicio: "",
    }));
  };

  const seleccionarProducto = (nombre: string) => {
    setMensajeError("");

    setReserva((prev) => ({
      ...prev,
      servicio: nombre,
    }));
  };

  const estaReservado = (hora: string) =>
    horariosOcupados.includes(hora);

  const horaYaPaso = (hora: string) => {
    if (!diaSeleccionado || !esHoy(diaSeleccionado)) {
      return false;
    }

    const [horas, minutos] = hora.split(":").map(Number);

    const fechaHora = new Date(
      anio,
      mes,
      diaSeleccionado,
      horas,
      minutos
    );

    return fechaHora <= new Date();
  };

  const seleccionarHora = (hora: string) => {
    if (
      !reserva.barberoId ||
      estaReservado(hora) ||
      horaYaPaso(hora) ||
      cargandoHorarios
    ) {
      return;
    }

    setHoraSeleccionada(hora);
    setMensajeError("");

    setReserva((prev) => ({
      ...prev,
      hora,
    }));
  };

  const enviarReserva = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const usuario = obtenerSesion();

    if (!usuario) {
      cambiarVista("login");
      return;
    }

    if (
      !reserva.servicio ||
      !reserva.barberoId ||
      !reserva.fecha ||
      !reserva.hora ||
      !productoSeleccionado
    ) {
      setMensajeError(
        "Completa todos los campos y selecciona un horario."
      );
      return;
    }

    if (estaReservado(reserva.hora) || horaYaPaso(reserva.hora)) {
      setMensajeError(
        "Este horario ya no está disponible. Selecciona otro."
      );

      setHoraSeleccionada(null);

      setReserva((prev) => ({
        ...prev,
        hora: "",
      }));

      return;
    }

    setEnviando(true);
    setMensajeError("");

    try {
      const respuesta = await api<RespuestaReserva>("/api/reservas", {
        method: "POST",
        autenticado: true,
        body: JSON.stringify({
          servicio: productoSeleccionado.nombre,
          tipoProducto: reserva.tipoProducto,
          barbero: reserva.barbero,
          fecha: reserva.fecha,
          hora: `${reserva.hora}:00`,
          precio: productoSeleccionado.precio,
          barberoUsuario: {
            idUsuario: Number(reserva.barberoId),
          },
        }),
      });

      setIdReservaRegistrada(
        respuesta?.idReserva ?? null
      );

      setConfirmado(true);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setMensajeError(
        error instanceof Error
          ? error.message
          : "No se pudo realizar la reservación."
      );

      try {
        const parametros = new URLSearchParams({
          idBarbero: reserva.barberoId,
          fecha: reserva.fecha,
        });

        const datos = await api<string[]>(
          `/api/reservas/disponibilidad?${parametros.toString()}`,
          {
            autenticado: true,
          }
        );

        setHorariosOcupados(
          datos.map((hora) => hora.slice(0, 5))
        );
      } catch {
      }

      setHoraSeleccionada(null);

      setReserva((prev) => ({
        ...prev,
        hora: "",
      }));
    } finally {
      setEnviando(false);
    }
  };

  const descargarComprobante = async () => {
    const usuario = obtenerSesion();

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

    // Tarjeta de información.
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

    // Datos del cliente.
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...colorAzul);

    pdf.text("INFORMACION DEL CLIENTE", 23, 102);

    pdf.setDrawColor(...colorAzul);
    pdf.line(23, 107, ancho - 23, 107);

    const datosCliente: [string, string][] = [
      [
        "Folio",
        idReservaRegistrada
          ? String(idReservaRegistrada)
          : "No disponible",
      ],
      ["Cliente", reserva.nombre],
      ["Correo", usuario?.correo || "No disponible"],
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
      ["Hora", reserva.hora],
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
      formatearPrecio(productoSeleccionado?.precio || 0),
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
      `Comprobante-Berracos-${idReservaRegistrada || "reserva"}.pdf`
    );
  };

  const limpiarFormulario = () => {
    const usuario = obtenerSesion();

    setConfirmado(false);
    setIdReservaRegistrada(null);
    setDiaSeleccionado(null);
    setHoraSeleccionada(null);
    setHorariosOcupados([]);
    setMensajeError("");

    setReserva({
      nombre: usuario?.nombre || "",
      servicio: "",
      tipoProducto: "SERVICIO",
      barbero: "",
      barberoId: "",
      fecha: "",
      hora: "",
    });
  };

  const diasCalendario = [];

  for (let i = 0; i < primerDia; i++) {
    diasCalendario.push(
      <div
        key={`vacio-${i}`}
        className="calendario-dia calendario-dia-vacio"
      />
    );
  }

  for (let dia = 1; dia <= diasDelMes; dia++) {
    const pasado = esDiaPasado(dia);
    const seleccionado = dia === diaSeleccionado;

    diasCalendario.push(
      <button
        key={dia}
        type="button"
        className={`calendario-dia ${
          pasado
            ? "calendario-dia-pasado"
            : "calendario-dia-disponible"
        } ${esHoy(dia) ? "calendario-dia-hoy" : ""} ${
          seleccionado ? "calendario-dia-seleccionado" : ""
        }`}
        disabled={pasado}
        onClick={() => seleccionarDia(dia)}
      >
        <span>{dia}</span>
      </button>
    );
  }

  return (
    <section className="calendario-seccion" id="reservar">
      <div className="calendario-encabezado">
        <span>RESERVACIÓN</span>
        <h1>Agenda tu cita</h1>
        <p>
          Selecciona tu servicio o corte, barbero, fecha y horario.
        </p>
      </div>

      {!confirmado ? (
        <div className="calendario-contenedor">
          <div className="reservacion-formulario">
            <form className="formulario" onSubmit={enviarReserva}>
              <div className="campo">
                <label>CLIENTE</label>
                <input
                  type="text"
                  value={reserva.nombre}
                  readOnly
                />
              </div>

              <div className="campo">
                <label>TIPO DE PRODUCTO</label>
                <select
                  value={reserva.tipoProducto}
                  onChange={(e) =>
                    seleccionarTipoProducto(
                      e.target.value as TipoProducto
                    )
                  }
                  disabled={cargandoDatos}
                >
                  <option value="SERVICIO">Servicio</option>
                  <option value="CORTE">Corte</option>
                </select>
              </div>

              <div className="campo">
                <label>
                  {reserva.tipoProducto === "SERVICIO"
                    ? "SERVICIO"
                    : "CORTE"}
                </label>

                <select
                  value={reserva.servicio}
                  onChange={(e) =>
                    seleccionarProducto(e.target.value)
                  }
                  required
                  disabled={cargandoDatos}
                >
                  <option value="">
                    {reserva.tipoProducto === "SERVICIO"
                      ? "Selecciona un servicio"
                      : "Selecciona un corte"}
                  </option>

                  {reserva.tipoProducto === "SERVICIO"
                    ? servicios.map((servicio) => (
                        <option
                          key={servicio.idServicio}
                          value={servicio.nombre}
                        >
                          {servicio.nombre} -{" "}
                          {formatearPrecio(servicio.precio)}
                        </option>
                      ))
                    : cortes.map((corte) => (
                        <option
                          key={corte.idCorte}
                          value={corte.nombre}
                        >
                          {corte.nombre} -{" "}
                          {formatearPrecio(corte.precio)}
                        </option>
                      ))}
                </select>
              </div>

              {productoSeleccionado && (
                <div className="campo campo-full">
                  <div className="seleccion-cita">
                    <strong>
                      {reserva.tipoProducto === "SERVICIO"
                        ? "Servicio"
                        : "Corte"}: {productoSeleccionado.nombre}
                    </strong>

                    <strong>
                      Precio:{" "}
                      {formatearPrecio(productoSeleccionado.precio)}
                    </strong>

                    {productoSeleccionado.descripcion && (
                      <span>
                        {productoSeleccionado.descripcion}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="campo">
                <label>BARBERO</label>
                <select
                  value={String(reserva.barberoId)}
                  onChange={(e) =>
                    seleccionarBarbero(e.target.value)
                  }
                  required
                  disabled={cargandoDatos}
                >
                  <option value="">
                    Selecciona un barbero
                  </option>

                  {barberos.map((barbero) => (
                    <option
                      key={barbero.idUsuario}
                      value={String(barbero.idUsuario)}
                    >
                      {barbero.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo campo-full">
                <label>FECHA Y HORA</label>

                <div className="seleccion-cita">
                  {reserva.fecha ? (
                    <strong>
                      {formatearFecha(reserva.fecha)}
                      {reserva.hora
                        ? ` — ${reserva.hora}`
                        : ""}
                    </strong>
                  ) : (
                    <span>
                      Selecciona una fecha en el calendario.
                    </span>
                  )}
                </div>
              </div>

              {mensajeError && (
                <p className="mensaje-error" role="alert">
                  {mensajeError}
                </p>
              )}

              {cargandoDatos && (
                <p className="mensaje-carga">
                  Cargando servicios, cortes y barberos...
                </p>
              )}

              {!cargandoDatos &&
                reserva.tipoProducto === "SERVICIO" &&
                servicios.length === 0 && (
                  <p className="mensaje-error">
                    No hay servicios disponibles.
                  </p>
                )}

              {!cargandoDatos &&
                reserva.tipoProducto === "CORTE" &&
                cortes.length === 0 && (
                  <p className="mensaje-error">
                    No hay cortes disponibles.
                  </p>
                )}

              {!cargandoDatos && barberos.length === 0 && (
                <p className="mensaje-error">
                  No hay barberos disponibles.
                </p>
              )}

              <button
                type="submit"
                className="boton"
                disabled={
                  enviando ||
                  cargandoDatos ||
                  cargandoHorarios ||
                  !reserva.fecha ||
                  !reserva.hora ||
                  !reserva.servicio ||
                  !reserva.barberoId ||
                  !productoSeleccionado
                }
              >
                {enviando
                  ? "REGISTRANDO..."
                  : "CONFIRMAR RESERVACIÓN"}
              </button>
            </form>
          </div>

          <div className="calendario-principal">
            <div className="calendario-navegacion">
              <button
                type="button"
                className="calendario-flecha"
                onClick={() => cambiarMes(-1)}
              >
                ←
              </button>

              <div>
                <span>CALENDARIO</span>
                <h2>
                  {nombresMeses[mes]} de {anio}
                </h2>
              </div>

              <button
                type="button"
                className="calendario-flecha"
                onClick={() => cambiarMes(1)}
              >
                →
              </button>
            </div>

            <div className="calendario-semana">
              {nombresDias.map((dia) => (
                <span key={dia}>{dia}</span>
              ))}
            </div>

            <div className="calendario-grid">
              {diasCalendario}
            </div>

            <div className="calendario-leyenda">
              <div>
                <span className="leyenda-punto leyenda-disponible" />
                <span>Disponible</span>
              </div>

              <div>
                <span className="leyenda-punto leyenda-hoy" />
                <span>Hoy</span>
              </div>

              <div>
                <span className="leyenda-punto leyenda-pasado" />
                <span>No disponible</span>
              </div>
            </div>

            {!diaSeleccionado ? (
              <div className="calendario-sin-seleccion">
                <span>SELECCIONA UN DÍA</span>
                <h2>Elige una fecha</h2>
                <p>
                  Selecciona un día en el calendario para consultar
                  los horarios disponibles.
                </p>
              </div>
            ) : !reserva.barberoId ? (
              <div className="calendario-sin-seleccion">
                <span>SELECCIONA UN BARBERO</span>
                <h2>Elige primero a tu barbero</h2>
                <p>
                  Selecciona un barbero para consultar sus horarios.
                </p>
              </div>
            ) : (
              <>
                <div className="horarios-encabezado">
                  <span>FECHA Y BARBERO SELECCIONADOS</span>

                  <h2>
                    {diaSeleccionado} de{" "}
                    {nombresMeses[mes]} de {anio}
                  </h2>

                  <p>
                    Horarios de {reserva.barbero}. Los horarios
                    ocupados no se pueden seleccionar.
                  </p>
                </div>

                {cargandoHorarios ? (
                  <p className="mensaje-carga">
                    Consultando disponibilidad...
                  </p>
                ) : (
                  <div className="horarios-grid">
                    {horarios.map((hora) => {
                      const ocupado = estaReservado(hora);
                      const pasado = horaYaPaso(hora);
                      const deshabilitado = ocupado || pasado;

                      return (
                        <button
                          key={hora}
                          type="button"
                          disabled={deshabilitado}
                          className={`horario-boton ${
                            deshabilitado
                              ? "horario-ocupado"
                              : ""
                          } ${
                            horaSeleccionada === hora
                              ? "horario-seleccionado"
                              : ""
                          }`}
                          onClick={() =>
                            seleccionarHora(hora)
                          }
                        >
                          {hora}

                          <small>
                            {ocupado
                              ? "Ocupado"
                              : pasado
                                ? "Hora pasada"
                                : "Disponible"}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                )}

                {horaSeleccionada && (
                  <div className="horario-confirmado">
                    <span>HORARIO SELECCIONADO</span>

                    <strong>{horaSeleccionada}</strong>

                    <p>
                      {diaSeleccionado} de{" "}
                      {nombresMeses[mes]} de {anio} ·{" "}
                      {horaSeleccionada}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="calendario-horarios">
          <div className="confirmacion">
            <div className="confirmacion-icono">✓</div>

            <div className="horarios-encabezado">
              <span>RESERVACIÓN</span>
              <h2>¡Reservación realizada!</h2>
              <p>
                Tu cita se registró correctamente en el sistema.
              </p>
            </div>

            <div className="resumen-cita">
              <div>
                <span>CLIENTE</span>
                <strong>{reserva.nombre}</strong>
              </div>

              <div>
                <span>TIPO</span>
                <strong>
                  {reserva.tipoProducto === "SERVICIO"
                    ? "Servicio"
                    : "Corte"}
                </strong>
              </div>

              <div>
                <span>
                  {reserva.tipoProducto === "SERVICIO"
                    ? "SERVICIO"
                    : "CORTE"}
                </span>
                <strong>{reserva.servicio}</strong>
              </div>

              <div>
                <span>BARBERO</span>
                <strong>{reserva.barbero}</strong>
              </div>

              <div>
                <span>FECHA</span>
                <strong>{formatearFecha(reserva.fecha)}</strong>
              </div>

              <div>
                <span>HORA</span>
                <strong>{reserva.hora}</strong>
              </div>

              <div>
                <span>PRECIO</span>
                <strong>
                  {formatearPrecio(
                    productoSeleccionado?.precio || 0
                  )}
                </strong>
              </div>
            </div>

            <div className="seleccion-cita">
              <strong>
                ¿Deseas descargar tu comprobante?
              </strong>

              <span>
                Puedes guardar el PDF con toda la información
                de tu reservación.
              </span>

              <div
                className="confirmacion-botones"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "18px",
                  marginTop: "22px",
                }}
              >
                <button
                  type="button"
                  className="boton"
                  onClick={descargarComprobante}
                >
                  SÍ, DESCARGAR PDF
                </button>

                <button
                  type="button"
                  className="boton hero-boton-secundario"
                  onClick={() =>
                    cambiarVista("mis-reservaciones")
                  }
                >
                  NO, GRACIAS
                </button>
              </div>
            </div>

            <div
              className="confirmacion-botones"
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
                gap: "18px",
                marginTop: "28px",
              }}
            >
              <button
                type="button"
                className="boton hero-boton-secundario"
                onClick={() =>
                  cambiarVista("mis-reservaciones")
                }
              >
                VER MIS RESERVACIONES
              </button>

              <button
                type="button"
                className="boton hero-boton-secundario"
                onClick={limpiarFormulario}
              >
                NUEVA RESERVACIÓN
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
