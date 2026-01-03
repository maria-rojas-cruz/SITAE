// app/curso/[id]/quiz/[quizId]/resultados/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ResultsView from "@/components/course/student/quiz/results-view";

export default function QuizResultsHistoryPage() {
  const params = useParams();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  const [results, setResults] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreviousResults();
  }, [quizId]);

  const loadPreviousResults = async () => {
    try {
      setLoading(true);

      // 1. Buscar el último intento completado
      const { attempts } = await api.get(`api/quizzes/${quizId}/attempts`);

      const completedAttempt = attempts
        .filter((a: any) => a.state === "CALIFICADO")
        .sort((a: any, b: any) => 
          new Date(b.date_end).getTime() - new Date(a.date_end).getTime()
        )[0];

      if (!completedAttempt) {
        setError("No hay resultados previos para este quiz");
        return;
      }

      // 2. Obtener resultados del attempt
      const resultsData = await api.get(
        `api/attempts/${completedAttempt.id}/result`
      );

      setResults(resultsData);

      // 3. Cargar info del quiz
      const contentRes = await api.get(`api/courses/${courseId}/content`);

      let foundQuiz = null;
      for (const module of contentRes.modules) {
        for (const topic of module.topics) {
          const q = topic.quizzes.find((quiz: any) => quiz.id === quizId);
          if (q) {
            foundQuiz = { ...q, topic_id: topic.id };
            break;
          }
        }
        if (foundQuiz) break;
      }

      setQuiz(foundQuiz);

    } catch (err: any) {
      setError("Error al cargar los resultados");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (error || !results || !quiz) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">
            {error || "No se pudieron cargar los resultados"}
          </h3>
          <Link href={`/curso/${courseId}`}>
            <Button>Volver al curso</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ResultsView
      results={results}
      quiz={quiz}
      courseId={courseId}
    />
  );
}