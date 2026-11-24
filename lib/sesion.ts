export type UsuarioSesion = {
  idUsuario: number;
  nombre: string;
  correo: string;
  rol: "CLIENTE" | "BARBERO" | "ADMIN";
  token: string;
  tipo: string;
};

const CLAVE_SESION = "berracos-usuario-sesion";

export function obtenerSesion(): UsuarioSesion | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const datos = localStorage.getItem(CLAVE_SESION);

    return datos ? JSON.parse(datos) as UsuarioSesion : null;
  } catch {
    return null;
  }
}

export function guardarSesion(usuario: UsuarioSesion) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

export function cerrarSesion() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(CLAVE_SESION);
}