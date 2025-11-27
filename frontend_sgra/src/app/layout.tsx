import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers";
import Sidebar from "@/components/Sidebar"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SGRA",
  description: "Sistema de gestión de requisitos ágiles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          {/* Contenedor Flex Principal */}
          <div className="flex min-h-screen">
            
            {/* 1. El Sidebar (Izquierda) */}
            <Sidebar />
            
            {/* 2. El Contenido Principal (Derecha) */}
            <main className="flex-1 overflow-auto bg-background">
              {children}
            </main>
            
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}