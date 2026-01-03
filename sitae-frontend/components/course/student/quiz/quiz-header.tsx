// app/curso/[id]/quiz/[quizId]/_components/QuizHeader.tsx
"use client";

import { Progress } from "@/components/ui/progress";

interface QuizHeaderProps {
  quiz: {
    title: string;
    description?: string;
    time_minutes?: number;
  };
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
}

export default function QuizHeader({
  quiz,
  currentQuestion,
  totalQuestions,
  answeredCount,
}: QuizHeaderProps) {
  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-muted-foreground mt-1">{quiz.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            Pregunta {currentQuestion} de {totalQuestions}
          </span>
          <span>
            {answeredCount}/{totalQuestions} respondidas ({Math.round((answeredCount / totalQuestions) * 100)}% completado)
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}