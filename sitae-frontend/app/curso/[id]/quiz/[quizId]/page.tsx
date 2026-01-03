// app/curso/[id]/quiz/[quizId]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useQuizAttempt } from "@/hooks/quiz/useQuizAttempt";
import QuizView from "@/components/course/student/quiz/quiz-view";
import ResultsView from "@/components/course/student/quiz/results-view";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function QuizPage() {
  const params = useParams();
  const courseId = params.id as string;

  const {
    viewMode,
    quiz,
    attempt,
    questions,
    answers,
    results,
    handleSelectOption,
    handleClearAnswer,
    handleSubmit,
    loading,
    submitting,
    error,
  } = useQuizAttempt();

  //Advertencia al salir 
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(answers).length > 0 && viewMode === "quiz" && !submitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers, viewMode, submitting]);

  // Loading
  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  //  Error
  if (error || !quiz || !attempt) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-lg font-semibold">Error al cargar el quiz</h3>
          <p className="text-muted-foreground text-center max-w-md">
            {error || "No se pudo cargar el quiz. Por favor intenta de nuevo."}
          </p>
          <Link href={`/curso/${courseId}`}>
            <Button>Volver al curso</Button>
          </Link>
        </div>
      </div>
    );
  }

  // RESULTADOS (después de enviar)
  if (viewMode === "results" && results) {
    return (
      <ResultsView
        results={results}
        quiz={quiz}
        courseId={courseId}
      />
    );
  }

  // 📝 PREGUNTAS (modo normal)
  return (
    <QuizView
      quiz={quiz}
      attempt={attempt}
      questions={questions}
      answers={answers}
      submitting={submitting}
      courseId={courseId}
      onSelectOption={handleSelectOption}
      onClearAnswer={handleClearAnswer}
      onSubmit={handleSubmit}
    />
  );
}