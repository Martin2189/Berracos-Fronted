
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type CalendarioProps = {
  cambiarVista: (vista: string) => void;
};

type Barbero = {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  imagen: string | null;
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

export default function Calendario({ cambiarVista }: CalendarioProps) {
  const hoy = new Date();

  const [mes, setMes] = useState(hoy.getMonth());
  const [anio, setAnio] = useState(hoy.getFullYear());

  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(null);
  const [barberoSeleccionado, setBarberoSeleccionado] =
    useState<Barbero | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);

  const [barberos, setBarberos] = useState<Barbero[]>([]);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);

  const [cargandoBarberos, setCargandoBarberos] = useState(true);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  const [error, setError] = useState("");

  const primerDia = new Date(anio, mes, 1).getDay();
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();

  const fechaISO = diaSeleccionado
    ? `${anio}-${String(mes + 1).padStart(2, "0")}-${String(
        diaSeleccionado
      ).padStart(2, "0")}`
    : "";

  const fechaSeleccionada = diaSeleccionado
    ? `${diaSeleccionado} de ${nombresMeses[mes]} de ${anio}`
    : "";

  // CARGAR BARBEROS ACTIVOS
  useEffect(() => {
    let activo = true;

    const cargarBarberos = async () => {
      try {
        setCargandoBarberos(true);
        setError("");

        const respuesta = await api<Barbero[]>("/api/usuarios/barberos");

        if (activo) {
          setBarberos(respuesta);
        }
      } catch (err) {
        if (activo) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los barberos."
          );
        }
      } finally {
        if (activo) {
          setCargandoBarberos(false);
        }
      }
    };

    cargarBarberos();

    return () => {
      activo = false;
    };
  }, []);

  // CONSULTAR HORARIOS OCUPADOS DEL BARBERO Y FECHA SELECCIONADOS
  useEffect(() => {
    let activo = true;

    const cargarDisponibilidad = async () => {
      if (!barberoSeleccionado || !fechaISO) {
        setHorariosOcupados([]);
        setCargandoHorarios(false);
        return;
      }

      try {
        setCargandoHorarios(true);
        setError("");
        setHoraSeleccionada(null);

        const respuesta = await api<string[]>(
          `/api/reservas/disponibilidad?idBarbero=${barberoSeleccionado.idUsuario}&fecha=${fechaISO}`
        );

        if (activo) {
          // Spring Boot puede devolver horas como 09:00:00.
          const horas = respuesta.map((hora) => hora.slice(0, 5));
          setHorariosOcupados(horas);
        }
      } catch (err) {
        if (activo) {
          setHorariosOcupados([]);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo consultar la disponibilidad."
          );
        }
      } finally {
        if (activo) {
          setCargandoHorarios(false);
        }
      }
    };

    cargarDisponibilidad();

    return () => {
      activo = false;
    };
  }, [barberoSeleccionado, fechaISO]);

  const cambiarMes = (direccion: number) => {
    const nuevaFecha = new Date(anio, mes + direccion, 1);

    const primerMesActual = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      1
    );

    if (nuevaFecha < primerMesActual) return;

    setMes(nuevaFecha.getMonth());
    setAnio(nuevaFecha.getFullYear());

    setDiaSeleccionado(null);
    setHoraSeleccionada(null);
    setHorariosOcupados([]);
    setBarberoSeleccionado(null);
  };

  const esDiaPasado = (dia: number) => {
    const fecha = new Date(anio, mes, dia);

    const fechaHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );

    return fecha < fechaHoy;
  };

  const esHoy = (dia: number) =>
    dia === hoy.getDate() &&
    mes === hoy.getMonth() &&
    anio === hoy.getFullYear();

  const horaYaPaso = (dia: number, hora: string) => {
    if (!esHoy(dia)) return false;

    const [horas, minutos] = hora.split(":").map(Number);
    const fechaHora = new Date(anio, mes, dia, horas, minutos);

    return fechaHora <= hoy;
  };

  const estaReservado = (hora: string) =>
    horariosOcupados.includes(hora);

  const horarioOcupado = (dia: number, hora: string) =>
    estaReservado(hora) || horaYaPaso(dia, hora);

  const horariosLibresDelDia = (dia: number) =>
    horarios.filter((hora) => !horarioOcupado(dia, hora)).length;

  const seleccionarDia = (dia: number) => {
    if (esDiaPasado(dia)) return;

    setDiaSeleccionado(dia);
    setHoraSeleccionada(null);
  };

  const seleccionarBarbero = (barbero: Barbero) => {
    setBarberoSeleccionado(barbero);
    setHoraSeleccionada(null);
    setHorariosOcupados([]);
  };

  const reservarHora = () => {
    if (
      !diaSeleccionado ||
      !barberoSeleccionado ||
      !horaSeleccionada
    ) {
      return;
    }

    // Comprobación local antes de continuar.
    if (
      horarioOcupado(diaSeleccionado, horaSeleccionada) ||
      cargandoHorarios
    ) {
      setHoraSeleccionada(null);
      return;
    }

    localStorage.setItem(
      "berracos-cita-seleccionada",
      JSON.stringify({
        fecha: fechaSeleccionada,
        fechaISO,
        barbero: barberoSeleccionado.nombre,
        idBarbero: barberoSeleccionado.idUsuario,
        hora: horaSeleccionada,
        dia: diaSeleccionado,
        mes,
        anio,
      })
    );

    cambiarVista("reservar");
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

    const libres =
      seleccionado && barberoSeleccionado && !cargandoHorarios
        ? horariosLibresDelDia(dia)
        : null;

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

        {!pasado && (
          <small>
            {libres === null
              ? "Consultar"
              : libres === 0
                ? "Completo"
                : libres <= 3
                  ? "Pocos"
                  : "Disponible"}
          </small>
        )}
      </button>
    );
  }

  return (
    <section className="calendario-seccion">
      <div className="calendario-encabezado">
        <span>AGENDA</span>
        <h1>Disponibilidad</h1>
        <p>
          Selecciona una fecha y consulta los horarios de cada barbero.
        </p>
      </div>

      <div className="calendario-contenedor">
        <div className="calendario-principal">
          <div className="calendario-navegacion">
            <button
              type="button"
              className="calendario-flecha"
              onClick={() => cambiarMes(-1)}
              disabled={
                anio === hoy.getFullYear() &&
                mes === hoy.getMonth()
              }
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
        </div>

        <div className="calendario-horarios">
          {!diaSeleccionado ? (
            <div className="calendario-sin-seleccion">
              <span>SELECCIONA UN DÍA</span>
              <h2>Elige una fecha</h2>
              <p>
                Selecciona un día en el calendario para consultar
                la disponibilidad de los barberos.
              </p>
            </div>
          ) : (
            <>
              <div className="horarios-encabezado">
                <span>FECHA SELECCIONADA</span>
                <h2>{fechaSeleccionada}</h2>
                <p>Ahora selecciona el barbero.</p>
              </div>

              {cargandoBarberos ? (
                <div className="calendario-sin-seleccion">
                  <h3>Cargando barberos...</h3>
                </div>
              ) : barberos.length === 0 ? (
                <div className="calendario-sin-seleccion">
                  <h3>No hay barberos disponibles</h3>
                  <p>Intenta nuevamente más tarde.</p>
                </div>
              ) : (
                <div className="barberos-disponibilidad">
                  {barberos.map((barbero) => (
                    <button
                      key={barbero.idUsuario}
                      type="button"
                      className={`barbero-disponibilidad-boton ${
                        barberoSeleccionado?.idUsuario ===
                        barbero.idUsuario
                          ? "barbero-disponibilidad-seleccionado"
                          : ""
                      }`}
                      onClick={() => seleccionarBarbero(barbero)}
                    >
                      {barbero.nombre}
                    </button>
                  ))}
                </div>
              )}

              {!barberoSeleccionado ? (
                <div className="calendario-sin-seleccion">
                  <span>SELECCIONA UN BARBERO</span>
                  <h2>Consulta sus horarios</h2>
                  <p>
                    Cada barbero tiene su propia disponibilidad.
                  </p>
                </div>
              ) : (
                <>
                  <div className="horarios-encabezado">
                    <span>
                      DISPONIBILIDAD DE{" "}
                      {barberoSeleccionado.nombre.toUpperCase()}
                    </span>
                    <h2>Selecciona un horario</h2>
                    <p>
                      Los horarios ocupados no se pueden seleccionar.
                    </p>
                  </div>

                  {cargandoHorarios ? (
                    <div className="calendario-sin-seleccion">
                      <h3>Consultando horarios...</h3>
                    </div>
                  ) : (
                    <div className="horarios-grid">
                      {horarios.map((hora) => {
                        const ocupado = horarioOcupado(
                          diaSeleccionado,
                          hora
                        );

                        return (
                          <button
                            key={hora}
                            type="button"
                            disabled={ocupado}
                            className={`horario-boton ${
                              ocupado ? "horario-ocupado" : ""
                            } ${
                              horaSeleccionada === hora
                                ? "horario-seleccionado"
                                : ""
                            }`}
                            onClick={() => setHoraSeleccionada(hora)}
                          >
                            {hora}
                            <small>
                              {ocupado ? "Ocupado" : "Disponible"}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {horaSeleccionada &&
                barberoSeleccionado &&
                !cargandoHorarios && (
                  <div className="horario-confirmado">
                    <span>HORARIO SELECCIONADO</span>
                    <strong>{horaSeleccionada}</strong>
                    <p>
                      {fechaSeleccionada} ·{" "}
                      {barberoSeleccionado.nombre}
                    </p>

                    <button
                      type="button"
                      onClick={reservarHora}
                    >
                      RESERVAR ESTA HORA
                    </button>
                  </div>
                )}
            </>
          )}

          {error && (
            <div className="panel-barbero-error">
              {error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
