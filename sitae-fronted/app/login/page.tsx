"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  TrendingUp,
  Mail,
  ExternalLink,
} from "lucide-react";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<"student" | "teacher">("student");
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("google", {
        redirec: false,
        callbackUrl: userType === "teacher" ? "/doc" : "/",
      });
      if (result?.error) {
        throw new Error("Error en la autenticación con Google");
      }

      if (result?.ok) {
        const redirectPath = userType === "teacher" ? "/doc" : "/";
        router.push(redirectPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Beta Testing Banner */}
      <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <strong>Versión Beta</strong>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="text-[10px] sm:text-sm">
            Proyecto de Fin de Carrera - Ingeniería Informática
          </span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 w-full px-4 py-6 sm:py-8 lg:py-12 flex items-center overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto">
          {/* Desktop: Grid 2 columnas, Mobile: Stack vertical */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12 items-start lg:items-center bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl shadow-xl border border-slate-200/50 p-4 sm:p-6 lg:p-12">
            {/* Left Side - Value Proposition (visible solo en desktop) */}
            <div className="hidden lg:block space-y-6">
              {/* Logo & Title */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <svg
                    className="h-10 lg:h-12 w-auto text-slate-900"
                    viewBox="0 0 695 254"
                    preserveAspectRatio="xMidYMid meet"
                    xmlns="http://www.w3.org/2000/svg"
                    role="img"
                    aria-label="SITAE Logo"
                  >
                    <g
                      transform="translate(0,254) scale(0.1,-0.1)"
                      fill="currentColor"
                      stroke="none"
                    >
                      <path d="M915 2117 c-116 -62 -317 -168 -448 -237 -205 -109 -237 -129 -242 -152 -4 -15 -4 -36 0 -47 4 -13 155 -99 455 -260 247 -133 454 -241 459 -241 5 0 165 83 355 185 190 102 348 185 351 185 3 0 5 -45 5 -100 0 -92 -2 -101 -25 -124 -22 -22 -25 -33 -25 -101 0 -84 7 -91 51 -49 l26 25 32 -27 c43 -36 54 -21 48 64 -4 52 -10 69 -31 91 -26 27 -27 30 -24 142 l3 114 73 38 73 39 -3 46 -3 47 -95 50 c-52 28 -253 135 -447 238 -193 103 -358 187 -365 187 -7 -1 -108 -51 -223 -113z" />
                      <path d="M2690 1873 c-104 -36 -175 -116 -186 -209 -9 -73 10 -129 63 -185 38 -40 65 -56 170 -101 133 -55 156 -75 134 -116 -24 -45 -119 -41 -219 9 -36 19 -66 28 -70 23 -88 -105 -103 -127 -98 -139 8 -22 84 -66 146 -86 249 -77 470 34 470 237 0 60 -18 111 -52 150 -36 41 -68 58 -198 109 -103 41 -130 58 -130 86 0 52 114 66 195 24 26 -14 51 -25 55 -23 4 2 29 29 56 62 55 68 54 75 -25 123 -88 53 -219 68 -311 36z" />
                      <path d="M3487 1874 c-4 -4 -7 -189 -7 -411 l0 -403 110 0 110 0 -2 408 -3 407 -101 3 c-55 1 -103 0 -107 -4z" />
                      <path d="M4077 1873 c-4 -3 -7 -44 -7 -90 l0 -83 28 -1 c15 0 63 -1 107 -2 l80 -2 3 -317 2 -318 110 0 110 0 2 318 3 317 103 3 102 3 0 83 c0 67 -3 85 -16 90 -21 8 -619 8 -627 -1z" />
                      <path d="M5242 1868 c-5 -7 -53 -155 -106 -328 -52 -173 -107 -351 -121 -395 -13 -44 -25 -81 -25 -83 0 -1 50 -1 112 0 l112 3 19 83 19 82 113 0 114 0 10 -37 c5 -21 13 -54 16 -74 11 -60 11 -60 132 -57 l110 3 -119 395 c-66 217 -125 401 -130 408 -7 8 -46 12 -128 12 -82 0 -121 -4 -128 -12z m163 -318 c15 -68 29 -130 32 -137 4 -10 -13 -13 -72 -13 -42 0 -74 3 -72 8 3 4 17 61 31 127 15 66 29 131 32 145 8 37 17 13 49 -130z" />
                      <path d="M6087 1873 c-4 -3 -7 -188 -7 -410 l0 -403 270 0 271 0 -3 88 -3 87 -162 3 -163 2 0 70 0 69 133 3 132 3 0 90 0 90 -132 3 -133 3 0 59 c0 71 2 72 138 70 53 -1 116 -1 140 -1 l42 1 0 84 c0 67 -3 85 -16 90 -21 8 -499 8 -507 -1z" />
                      <path d="M678 1182 c-2 -65 -1 -159 2 -210 l5 -91 95 -48 c126 -64 195 -111 285 -195 l75 -70 74 70 c103 98 252 194 354 230 l32 11 0 212 0 211 -27 -7 c-78 -18 -279 -124 -374 -195 -29 -22 -56 -40 -60 -40 -3 0 -28 17 -55 38 -84 66 -190 124 -340 187 -63 26 -63 27 -66 -103z m842 -24 c0 -19 -18 -32 -95 -71 -52 -27 -122 -69 -155 -93 -33 -24 -62 -44 -65 -44 -3 0 -5 13 -5 28 0 24 12 36 93 89 88 58 187 110 215 112 6 1 12 -9 12 -21z m-100 -151 c0 -19 -21 -38 -102 -93 -57 -38 -106 -70 -110 -72 -5 -2 -8 9 -8 25 0 21 10 35 42 58 55 39 161 104 171 105 4 0 7 -11 7 -23z m-100 -172 c0 -18 -14 -35 -53 -65 -30 -22 -57 -40 -60 -40 -4 0 -7 11 -7 25 0 18 14 36 51 65 59 47 69 49 69 15z" />
                      <path d="M568 1242 l-28 -17 0 -236 0 -235 95 -44 c135 -61 277 -151 399 -253 l105 -87 97 81 c128 108 244 182 386 249 l118 55 0 235 0 236 -29 17 c-16 9 -32 17 -35 17 -3 0 -6 -99 -6 -219 l0 -220 -94 -44 c-112 -53 -261 -148 -360 -229 -39 -32 -75 -58 -79 -58 -4 0 -37 25 -74 56 -92 78 -229 167 -350 226 l-103 50 0 219 c0 120 -3 219 -7 219 -5 0 -20 -8 -35 -18z" />
                      <path d="M4443 775 c-40 -17 -63 -61 -63 -120 0 -109 82 -166 171 -119 81 42 76 205 -7 240 -41 17 -60 17 -101 -1z m87 -64 c16 -31 12 -102 -7 -123 -20 -22 -31 -23 -55 -1 -21 19 -26 111 -6 131 18 18 56 14 68 -7z" />
                      <path d="M3240 755 c0 -22 4 -25 40 -25 l40 0 0 -105 0 -105 30 0 30 0 0 105 0 105 40 0 c36 0 40 3 40 25 l0 25 -110 0 -110 0 0 -25z" />
                      <path d="M3630 679 c0 -98 1 -101 29 -130 39 -39 106 -41 148 -5 27 23 28 28 31 130 l4 106 -36 0 -36 0 0 -94 c0 -73 -3 -96 -16 -107 -11 -9 -20 -10 -32 -2 -14 8 -18 30 -20 107 l-3 96 -34 0 -35 0 0 -101z" />
                      <path d="M4010 755 c0 -22 4 -25 35 -25 l34 0 3 -102 3 -103 33 -3 32 -3 0 105 0 106 40 0 c36 0 40 3 40 25 l0 25 -110 0 -110 0 0 -25z" />
                      <path d="M4782 653 l3 -128 33 -3 c32 -3 32 -3 32 42 0 60 20 61 52 4 19 -35 29 -44 56 -46 38 -4 39 3 10 62 l-21 44 21 27 c29 36 28 70 -3 100 -22 22 -32 25 -105 25 l-81 0 3 -127z m136 50 c2 -14 -4 -26 -18 -33 -31 -17 -50 -5 -50 30 0 29 2 31 33 28 24 -2 33 -8 35 -25z" />
                      <path d="M5410 650 l0 -130 30 0 30 0 0 130 0 130 -30 0 -30 0 0 -130z" />
                      <path d="M5692 663 c-23 -65 -42 -124 -42 -130 0 -8 13 -13 30 -13 23 0 33 6 40 25 8 20 16 25 45 25 26 0 39 -6 51 -25 17 -27 75 -36 73 -12 0 6 -19 64 -43 127 -43 115 -43 115 -78 118 l-35 3 -41 -118z m93 -15 c6 -24 4 -28 -14 -28 -22 0 -25 10 -15 48 8 27 20 19 29 -20z" />
                    </g>
                  </svg>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                  Sistema Inteligente de Tutoría y Acompañamiento Estudiantil
                </h1>

                <p className="text-lg text-slate-700">
                  Tu tutor personalizado impulsado por inteligencia artificial
                  que acompaña tu progreso académico
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  ¿Qué hace SITAE por ti?
                </h2>

                <div className="space-y-3">
                  <FeatureItem
                    icon={<Sparkles className="h-5 w-5" />}
                    title="Recomendaciones Personalizadas"
                    description="Recursos y contenidos adaptados a tu perfil de aprendizaje y necesidades específicas"
                  />

                  <FeatureItem
                    icon={<MessageSquare className="h-5 w-5" />}
                    title="Asistente IA 24/7"
                    description="Resuelve tus dudas académicas en cualquier momento con respuestas contextualizadas"
                  />

                  <FeatureItem
                    icon={<TrendingUp className="h-5 w-5" />}
                    title="Seguimiento de Progreso Docente"
                    description="Monitorea el rendimiento de tus estudiantes e identifica áreas de mejora en tiempo real"
                  />
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-slate-100 rounded-xl p-6 border border-slate-200">
                <p className="text-sm text-slate-700 italic">
                  "Una herramienta innovadora que combina pedagogía y tecnología
                  para potenciar el aprendizaje universitario."
                </p>
              </div>
            </div>

            {/* Right Side - Login Card */}
            <div className="w-full">
              {/* Mobile: Logo compacto arriba */}
              <div className="lg:hidden mb-6 text-center">
                <svg
                  className="h-8 w-auto mx-auto text-slate-900 mb-3"
                  viewBox="0 0 695 254"
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="SITAE Logo"
                >
                  <g
                    transform="translate(0,254) scale(0.1,-0.1)"
                    fill="currentColor"
                    stroke="none"
                  >
                    <path d="M915 2117 c-116 -62 -317 -168 -448 -237 -205 -109 -237 -129 -242 -152 -4 -15 -4 -36 0 -47 4 -13 155 -99 455 -260 247 -133 454 -241 459 -241 5 0 165 83 355 185 190 102 348 185 351 185 3 0 5 -45 5 -100 0 -92 -2 -101 -25 -124 -22 -22 -25 -33 -25 -101 0 -84 7 -91 51 -49 l26 25 32 -27 c43 -36 54 -21 48 64 -4 52 -10 69 -31 91 -26 27 -27 30 -24 142 l3 114 73 38 73 39 -3 46 -3 47 -95 50 c-52 28 -253 135 -447 238 -193 103 -358 187 -365 187 -7 -1 -108 -51 -223 -113z" />
                    <path d="M2690 1873 c-104 -36 -175 -116 -186 -209 -9 -73 10 -129 63 -185 38 -40 65 -56 170 -101 133 -55 156 -75 134 -116 -24 -45 -119 -41 -219 9 -36 19 -66 28 -70 23 -88 -105 -103 -127 -98 -139 8 -22 84 -66 146 -86 249 -77 470 34 470 237 0 60 -18 111 -52 150 -36 41 -68 58 -198 109 -103 41 -130 58 -130 86 0 52 114 66 195 24 26 -14 51 -25 55 -23 4 2 29 29 56 62 55 68 54 75 -25 123 -88 53 -219 68 -311 36z" />
                    <path d="M3487 1874 c-4 -4 -7 -189 -7 -411 l0 -403 110 0 110 0 -2 408 -3 407 -101 3 c-55 1 -103 0 -107 -4z" />
                    <path d="M4077 1873 c-4 -3 -7 -44 -7 -90 l0 -83 28 -1 c15 0 63 -1 107 -2 l80 -2 3 -317 2 -318 110 0 110 0 2 318 3 317 103 3 102 3 0 83 c0 67 -3 85 -16 90 -21 8 -619 8 -627 -1z" />
                    <path d="M5242 1868 c-5 -7 -53 -155 -106 -328 -52 -173 -107 -351 -121 -395 -13 -44 -25 -81 -25 -83 0 -1 50 -1 112 0 l112 3 19 83 19 82 113 0 114 0 10 -37 c5 -21 13 -54 16 -74 11 -60 11 -60 132 -57 l110 3 -119 395 c-66 217 -125 401 -130 408 -7 8 -46 12 -128 12 -82 0 -121 -4 -128 -12z m163 -318 c15 -68 29 -130 32 -137 4 -10 -13 -13 -72 -13 -42 0 -74 3 -72 8 3 4 17 61 31 127 15 66 29 131 32 145 8 37 17 13 49 -130z" />
                    <path d="M6087 1873 c-4 -3 -7 -188 -7 -410 l0 -403 270 0 271 0 -3 88 -3 87 -162 3 -163 2 0 70 0 69 133 3 132 3 0 90 0 90 -132 3 -133 3 0 59 c0 71 2 72 138 70 53 -1 116 -1 140 -1 l42 1 0 84 c0 67 -3 85 -16 90 -21 8 -499 8 -507 -1z" />
                    <path d="M678 1182 c-2 -65 -1 -159 2 -210 l5 -91 95 -48 c126 -64 195 -111 285 -195 l75 -70 74 70 c103 98 252 194 354 230 l32 11 0 212 0 211 -27 -7 c-78 -18 -279 -124 -374 -195 -29 -22 -56 -40 -60 -40 -3 0 -28 17 -55 38 -84 66 -190 124 -340 187 -63 26 -63 27 -66 -103z m842 -24 c0 -19 -18 -32 -95 -71 -52 -27 -122 -69 -155 -93 -33 -24 -62 -44 -65 -44 -3 0 -5 13 -5 28 0 24 12 36 93 89 88 58 187 110 215 112 6 1 12 -9 12 -21z m-100 -151 c0 -19 -21 -38 -102 -93 -57 -38 -106 -70 -110 -72 -5 -2 -8 9 -8 25 0 21 10 35 42 58 55 39 161 104 171 105 4 0 7 -11 7 -23z m-100 -172 c0 -18 -14 -35 -53 -65 -30 -22 -57 -40 -60 -40 -4 0 -7 11 -7 25 0 18 14 36 51 65 59 47 69 49 69 15z" />
                    <path d="M568 1242 l-28 -17 0 -236 0 -235 95 -44 c135 -61 277 -151 399 -253 l105 -87 97 81 c128 108 244 182 386 249 l118 55 0 235 0 236 -29 17 c-16 9 -32 17 -35 17 -3 0 -6 -99 -6 -219 l0 -220 -94 -44 c-112 -53 -261 -148 -360 -229 -39 -32 -75 -58 -79 -58 -4 0 -37 25 -74 56 -92 78 -229 167 -350 226 l-103 50 0 219 c0 120 -3 219 -7 219 -5 0 -20 -8 -35 -18z" />
                    <path d="M4443 775 c-40 -17 -63 -61 -63 -120 0 -109 82 -166 171 -119 81 42 76 205 -7 240 -41 17 -60 17 -101 -1z m87 -64 c16 -31 12 -102 -7 -123 -20 -22 -31 -23 -55 -1 -21 19 -26 111 -6 131 18 18 56 14 68 -7z" />
                    <path d="M3240 755 c0 -22 4 -25 40 -25 l40 0 0 -105 0 -105 30 0 30 0 0 105 0 105 40 0 c36 0 40 3 40 25 l0 25 -110 0 -110 0 0 -25z" />
                    <path d="M3630 679 c0 -98 1 -101 29 -130 39 -39 106 -41 148 -5 27 23 28 28 31 130 l4 106 -36 0 -36 0 0 -94 c0 -73 -3 -96 -16 -107 -11 -9 -20 -10 -32 -2 -14 8 -18 30 -20 107 l-3 96 -34 0 -35 0 0 -101z" />
                    <path d="M4010 755 c0 -22 4 -25 35 -25 l34 0 3 -102 3 -103 33 -3 32 -3 0 105 0 106 40 0 c36 0 40 3 40 25 l0 25 -110 0 -110 0 0 -25z" />
                    <path d="M4782 653 l3 -128 33 -3 c32 -3 32 -3 32 42 0 60 20 61 52 4 19 -35 29 -44 56 -46 38 -4 39 3 10 62 l-21 44 21 27 c29 36 28 70 -3 100 -22 22 -32 25 -105 25 l-81 0 3 -127z m136 50 c2 -14 -4 -26 -18 -33 -31 -17 -50 -5 -50 30 0 29 2 31 33 28 24 -2 33 -8 35 -25z" />
                    <path d="M5410 650 l0 -130 30 0 30 0 0 130 0 130 -30 0 -30 0 0 -130z" />
                    <path d="M5692 663 c-23 -65 -42 -124 -42 -130 0 -8 13 -13 30 -13 23 0 33 6 40 25 8 20 16 25 45 25 26 0 39 -6 51 -25 17 -27 75 -36 73 -12 0 6 -19 64 -43 127 -43 115 -43 115 -78 118 l-35 3 -41 -118z m93 -15 c6 -24 4 -28 -14 -28 -22 0 -25 10 -15 48 8 27 20 19 29 -20z" />
                  </g>
                </svg>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-2">
                  Sistema Inteligente de Tutoría y Acompañamiento Estudiantil
                </h1>
                <p className="text-sm text-slate-600">
                  Tu tutor personalizado con IA
                </p>
              </div>

              {/* Login Card */}
              <div className="bg-white rounded-2xl lg:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 space-y-6 border border-slate-200">
                {/* Header */}
                <div className="space-y-2 text-center">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">
                    Iniciar Sesión
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base">
                    Accede con tu correo institucional PUCP
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <Alert
                    variant="destructive"
                    className="animate-in fade-in slide-in-from-top-2"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Google Login Button */}
                <div className="space-y-4">
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full h-14 sm:h-16 text-base sm:text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 bg-slate-900 hover:bg-slate-800 rounded-xl sm:rounded-2xl"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                        <span className="text-sm sm:text-base">
                          Iniciando sesión...
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="mr-2 sm:mr-3 h-5 w-5 sm:h-7 sm:w-7"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span className="text-sm sm:text-base">
                          Continuar con Google
                        </span>
                      </>
                    )}
                  </Button>

                  {/* Helper text */}
                  <p className="text-center text-xs sm:text-sm text-slate-500">
                    Usa tu correo institucional{" "}
                    <strong className="text-slate-700">@pucp.edu.pe</strong>
                  </p>

                  {/* Privacy Notice */}
                  <p className="text-center text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                    Al continuar, aceptas nuestros{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs sm:text-sm font-semibold hover:text-blue-600 text-slate-700"
                    >
                      términos de servicio
                    </Button>{" "}
                    y{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs sm:text-sm font-semibold hover:text-blue-600 text-slate-700"
                    >
                      política de privacidad
                    </Button>
                  </p>
                </div>

                {/* Support Link */}
                <div className="pt-4 sm:pt-6 border-t border-slate-200 space-y-3 sm:space-y-4 text-center">
                  <p className="text-xs sm:text-sm text-slate-600">
                    ¿Problemas para acceder o tienes feedback?
                  </p>
                  <Button
                    variant="outline"
                    size="lg"
                    className="group hover:bg-blue-600 hover:text-white transition-all duration-200 border-2 w-full rounded-xl h-12 sm:h-14 text-xs sm:text-sm"
                    asChild
                  >
                    <a
                      href="mailto:maria.rojasc@pucp.edu.pe?subject=SITAE - Soporte/Feedback"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="truncate">maria.rojasc@pucp.edu.pe</span>
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Mobile: Features compactas */}
              <div className="lg:hidden mt-6 space-y-3 px-2">
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm">
                    Recomendaciones personalizadas de recursos
                  </p>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm">Asistente IA disponible 24/7</p>
                </div>
                <div className="flex items-center gap-3 text-slate-700">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm">
                    Seguimiento de progreso en tiempo real
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 py-4 px-4 bg-white/50">
        <p className="text-center text-[10px] sm:text-xs text-slate-600">
          © 2025 SITAE - Pontificia Universidad Católica del Perú
        </p>
      </div>
    </div>
  );
}

// Feature Item Component
function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 items-start group">
      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
        <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
