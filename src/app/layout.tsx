import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prime Vendedores | Comprovante Anti-Fraude",
  description: "Gerador ágil de comprovantes de vendas presenciais com foto e assinatura anti-chargeback",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Anti-Fraude",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#090d16",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark bg-slate-950 text-slate-100">
      <body className="min-h-screen bg-slate-950 antialiased">{children}</body>
    </html>
  );
}
