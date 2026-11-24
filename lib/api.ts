import { obtenerSesion } from "@/lib/sesion";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type OpcionesAPI = RequestInit & {
  autenticado?: boolean;
};

export async function api<T>(
  endpoint: string,
  opciones: OpcionesAPI = {}
): Promise<T> {
  const { autenticado = false, headers, ...config } = opciones;

  const sesion = obtenerSesion();

  const encabezados: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (config.body && !(config.body instanceof FormData)) {
    encabezados["Content-Type"] = "application/json";
  }

  if (autenticado) {
    if (!sesion?.token) {
      throw new Error("Debes iniciar sesión para realizar esta acción");
    }

    console.log("Rol:", sesion.rol);
    console.log("Tipo:", sesion.tipo);
    console.log("Token existe:", !!sesion.token);

    encabezados.Authorization = `${sesion.tipo || "Bearer"} ${sesion.token}`;
  }

  const respuesta = await fetch(`${API_URL}${endpoint}`, {
    ...config,
    headers: encabezados,
    cache: "no-store",
  });

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new Error(
      datos?.mensaje || `Error del servidor: ${respuesta.status}`
    );
  }

  return datos as T;
}