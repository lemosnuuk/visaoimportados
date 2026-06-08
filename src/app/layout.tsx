import type { Metadata } from "next";
import { Raleway, Montserrat } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["900"], // Raleway Black
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Visão Importados | Enxergando Além, Importando o Extraordinário",
  description: "Plataforma digital de catálogo inteligente para produtos importados exclusivos com atendimento humano personalizado.",
  keywords: ["importados", "luxo", "premium", "eletrônicos", "perfumes", "scooters", "exclusivos"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${raleway.variable} ${montserrat.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-foreground">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
