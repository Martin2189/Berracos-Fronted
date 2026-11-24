import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Berracos Barber",
  description: "Panel y sitio web de Berracos Barber",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}