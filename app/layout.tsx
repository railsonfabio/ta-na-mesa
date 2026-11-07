import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#BD4D2D",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Tá na Mesa | Restaurantes e Delivery • A2i Solutions",
  description:
    "Uma experiência à mesa. Atendimento, pedidos e acompanhamento em tempo real para Restaurantes e Delivery. Plataforma desenvolvida pela A2i Solutions em parceria com o Alô Classificados.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/brand/png/icone-app-cliente.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tá na Mesa",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col antialiased bg-[#FBF6EF] text-[#231F1C]">
        {children}
      </body>
    </html>
  );
}
