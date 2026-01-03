// app/layout.tsx
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";
import "./globals.css";


const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SITAE - Tutor IA",
  description: "Plataforma educativa con IA para estudiantes y docentes universitarios",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster richColors position="top-right" />
        <Analytics />
      </body>
    </html>
  );
}