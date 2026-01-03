// app/page.tsx
"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCourses } from "@/hooks/course/useCourses";

export default function HomePage() {
  const { courses, isLoading, error, total } = useCourses();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="pb-4">
          <div className="container mx-auto p-4 max-w-6xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Bienvenido de vuelta
              </h1>
              <p className="text-slate-600">
                Continúa con tus cursos y mantente al día con tus tareas
              </p>
              {total > 0 && (
                <p className="text-sm text-slate-500 mt-1">
                  Tienes {total} {total === 1 ? "curso" : "cursos"}
                </p>
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center py-12">
                <p className="text-red-600">Error al cargar los cursos</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Reintentar
                </Button>
              </div>
            )}

            {/* Courses grid */}
            {!isLoading && !error && courses.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card
                    key={course.id}
                    className="hover:shadow-md transition-shadow border-slate-200"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-900 line-clamp-2">
                            {course.name}
                          </CardTitle>
                          {course.code && (
                            <p className="text-xs text-slate-500 mt-1">
                              {course.code}
                            </p>
                          )}
                          <CardDescription className="flex items-center gap-1 mt-1 text-slate-600">
                            <User className="h-3 w-3" />
                            {course.role === "teacher"
                              ? "Docente"
                              : "Estudiante"}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-[#4CAF50]/10 text-[#4CAF50]"
                        >
                          Activo
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/** <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600">Progreso</span>
                          <span className="font-medium text-slate-900">
                            {course.progress || 0}%
                          </span>
                        </div>
                        <Progress value={course.progress || 0} className="h-2" />
                      </div>*/}
                      {course.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      {/*<div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>Sin próximas fechas</span>
                      </div>*/}

                      <Link href={`/curso/${course.id}`}>
                        <Button className="w-full" size="sm">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Ir al curso
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && courses.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-12 w-12 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900">
                  Aún no tienes cursos
                </h3>
                <p className="text-slate-600 mb-4">
                  Comienza creando tu primer curso
                </p>
                <Link href="/crear-curso">
                  <Button>Crear curso</Button>
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
