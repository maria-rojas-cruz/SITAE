// components/course/student/student-evaluations-tab.tsx
"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info } from "lucide-react";
import Link from "next/link";

interface StudentEvaluationsTabProps {
  courseId: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  time_minutes?: number;
  is_active: boolean;
  topic_id: string;
  topic_name?: string;
  completed: boolean; // ← AGREGAR
  last_attempt_id?: string; // ← AGREGAR
  last_attempt_percent?: number; // ← AGREGAR
}

export function StudentEvaluationsTab({
  courseId,
}: StudentEvaluationsTabProps) {
  const { data: contentData, error } = useSWR(
    `api/courses/${courseId}/content`
  );

  const quizzes: Quiz[] =
    contentData?.modules?.flatMap((module: any) =>
      module.topics.flatMap((topic: any) =>
        topic.quizzes
          .filter((quiz: any) => quiz.is_active)
          .map((quiz: any) => ({
            ...quiz,
            topic_name: topic.title,
          }))
      )
    ) || [];

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        Error al cargar evaluaciones
      </div>
    );
  }

  if (!contentData) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Evaluaciones</h3>
        </div>

        <div className="grid gap-4">
          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No hay evaluaciones disponibles
              </h3>
              <p className="text-muted-foreground">
                El docente aún no ha publicado evaluaciones para este curso
              </p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription>Tema: {quiz.topic_name}</CardDescription>
                    </div>
                    {/* CAMBIAR: badge según estado */}
                    <div className="flex gap-2">
                      <Badge variant={quiz.completed ? "default" : "outline"}>
                        {quiz.completed ? "Completado" : "Disponible"}
                      </Badge>
                      {quiz.completed &&
                        quiz.last_attempt_percent !== undefined && (
                          <Badge
                            variant={
                              quiz.last_attempt_percent >= 70
                                ? "default"
                                : "secondary"
                            }
                          >
                            {quiz.last_attempt_percent.toFixed(0)}%
                          </Badge>
                        )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {quiz.time_minutes && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Info className="h-4 w-4" />
                      <span>Tiempo límite: {quiz.time_minutes} minutos</span>
                    </div>
                  )}

               

                  {/* ← CAMBIAR BOTÓN SEGÚN completed */}
                  {quiz.completed && quiz.last_attempt_id ? (
                    <Link
                      href={`/curso/${courseId}/quiz/${quiz.id}/resultados`}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                      >
                        Ver Resultados
                      </Button>
                    </Link>
                  ) : (
                    <Link href={`/curso/${courseId}/quiz/${quiz.id}`}>
                      <Button size="sm" className="w-full">
                        Realizar Quiz
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
