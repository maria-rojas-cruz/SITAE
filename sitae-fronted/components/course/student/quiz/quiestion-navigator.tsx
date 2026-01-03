// app/curso/[id]/quiz/[quizId]/_components/QuestionNavigator.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface QuestionNavigatorProps {
  questions: any[];
  answers: Map<string, string | null>;
  currentIndex: number;
  onNavigate: (index: number) => void;
  disabled?: boolean;
}

export default function QuestionNavigator({
  questions,
  answers,
  currentIndex,
  onNavigate,
  disabled = false,
}: QuestionNavigatorProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Navegador de Preguntas</h3>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, index) => {
          const isAnswered = answers.has(q.id) && answers.get(q.id) !== null;
          const isCurrent = currentIndex === index;

          return (
            <Button
              key={q.id}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              onClick={() => onNavigate(index)}
              disabled={disabled}
              className={`
                relative w-10 h-10 
                ${isAnswered && !isCurrent ? "border-green-500 bg-green-50 hover:bg-green-100 text-green-700" : ""}
                ${isCurrent && isAnswered ? "bg-primary" : ""}
              `}
            >
              {index + 1}
              {isAnswered && !isCurrent && (
                <Check className="absolute -top-1 -right-1 h-4 w-4 text-green-600" />
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}