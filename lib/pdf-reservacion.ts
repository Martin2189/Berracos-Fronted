
import jsPDF from "jspdf";

export type DatosPDFReservacion = {
  idReserva?: number | string;
  cliente: string;
  correo: string;
  tipoProducto: "SERVICIO" | "CORTE";
  producto: string;
  barbero: string;
  fecha: string;
  hora: string;
  precio: number;
  estado?: string;
};

export function descargarPDFReservacion(
  datos: DatosPDFReservacion
) {
  const pdf = new jsPDF();

  const azul = [47, 164, 255] as [number, number, number];
  const negro = [12, 18, 27] as [number, number, number];
  const gris = [110, 120, 130] as [number, number, number];

  const precio = Number(datos.precio).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  const folio = datos.idReserva
    ? String(datos.idReserva)
    : "Pendiente";

  pdf.setFillColor(...negro);
  pdf.rect(0, 0, 210, 48, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(23);
  pdf.text("BERRACOS BARBER", 105, 21, {
    align: "center",
  });

  pdf.setTextColor(...azul);
  pdf.setFontSize(10);
  pdf.text("COMPROBANTE DE RESERVACION", 105, 32, {
    align: "center",
  });

  pdf.setTextColor(...negro);
  pdf.setFontSize(15);
  pdf.text("Informacion de tu cita", 20, 65);

  pdf.setDrawColor(...azul);
  pdf.setLineWidth(0.8);
  pdf.line(20, 70, 190, 70);

  const campos = [
    ["Folio", folio],
    ["Cliente", datos.cliente],
    ["Correo", datos.correo],
    [
      "Tipo",
      datos.tipoProducto === "SERVICIO" ? "Servicio" : "Corte",
    ],
    ["Producto", datos.producto],
    ["Barbero", datos.barbero],
    ["Fecha", datos.fecha],
    ["Hora", datos.hora],
    ["Precio", precio],
    ["Estado", datos.estado || "PENDIENTE"],
  ];

  let posicionY = 84;

  campos.forEach(([etiqueta, valor]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...gris);
    pdf.text(`${etiqueta}:`, 22, posicionY);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...negro);

    const texto = pdf.splitTextToSize(String(valor), 115);
    pdf.text(texto, 75, posicionY);

    posicionY += Math.max(11, texto.length * 6);
  });

  pdf.setDrawColor(220, 225, 230);
  pdf.line(20, 250, 190, 250);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...azul);
  pdf.text("Gracias por reservar con BERRACOS BARBER", 105, 263, {
    align: "center",
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...gris);
  pdf.text("Conserva este comprobante para consultar tu cita.", 105, 271, {
    align: "center",
  });

  pdf.save(`Berracos-Barber-Reservacion-${folio}.pdf`);
}
