// components/course/student/quiz/quiz-view.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuizViewProps {
  quiz: any;
  attempt: any;
  questions: any[];
  answers: Record<string, string>;
  submitting: boolean;
  courseId: string;
  onSelectOption: (questionId: string, optionId: string) => void;
  onClearAnswer: (questionId: string) => void;
  onSubmit: () => void;
}

export default function QuizView({
  quiz,
  questions,
  answers,
  submitting,
  courseId,
  onSelectOption,
  onClearAnswer,
  onSubmit,
}: QuizViewProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleBackClick = () => {
    if (answeredCount > 0) {
      setShowExitDialog(true);
    } else {
      router.push(`/curso/${courseId}`);
    }
  };

  return (
    <>
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al curso
          </Button>

          <h1 className="text-2xl font-bold mt-4">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Pregunta {currentQuestion + 1} de {questions.length}
              </span>
              <span>
                {answeredCount}/{questions.length} respondidas
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Pregunta actual */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              Pregunta {currentQuestion + 1}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({currentQ.score} pts)
              </span>
            </CardTitle>
            <pre className="text-base whitespace-pre-wrap font-mono bg-muted p-3 rounded-md text-sm">
              {currentQ.text.replace(/\\n/g, "\n")}
            </pre>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[currentQ.id] || ""}
              onValueChange={(value) => onSelectOption(currentQ.id, value)}
            >
              {currentQ.options?.map((option: any, index: number) => (
                <div
                  key={option.id}
                  className={`flex items-center space-x-2 p-3 rounded-lg border ${
                    answers[currentQ.id] === option.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {answers[currentQ.id] && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClearAnswer(currentQ.id)}
                className="mt-4"
              >
                Limpiar respuesta
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Navegación */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0 || submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {currentQuestion === questions.length - 1 ? (
            <Button onClick={onSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                `Enviar Quiz (${answeredCount}/${questions.length})`
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion((prev) => prev + 1)}
              disabled={submitting}
            >
              Siguiente
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Navegador de preguntas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Navegador de Preguntas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => (
                <Button
                  key={q.id}
                  variant={currentQuestion === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentQuestion(index)}
                  className={answers[q.id] ? "border-green-500" : ""}
                >
                  {index + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de salida */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Abandonar el quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Perderás todo tu progreso. ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push(`/curso/${courseId}`)}
              className="bg-red-600"
            >
              Sí, abandonar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
