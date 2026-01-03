// components/course/student/quiz/quiz-attempts-history.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import { QuizAttemptResponse } from "@/types/quiz-attempt";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface QuizAttemptsHistoryProps {
  attempts: QuizAttemptResponse[];
  onViewAttempt: (attemptId: string) => void;
}

export function QuizAttemptsHistory({ attempts, onViewAttempt }: QuizAttemptsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Intentos Anteriores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {attempts.map((attempt, index) => (
            <div
              key={attempt.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Intento {attempts.length - index}</Badge>
                  <Badge variant={attempt.percent && attempt.percent >= 70 ? "default" : "secondary"}>
                    {attempt.percent?.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(attempt.date_start), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewAttempt(attempt.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Resultados
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}