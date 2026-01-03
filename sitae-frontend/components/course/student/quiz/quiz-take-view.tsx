// components/course/student/quiz/quiz-take-view.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Clock, Send, Loader2 } from "lucide-react";
import { QuizQuestionCard } from "./quiz-question-card";
import QuizResultsView from "./quiz-results-view";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
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

interface QuizTakeViewProps {
  quizId: string;
  quizTitle: string;
  quizDescription?: string;
  timeMinutes?: number;
  totalQuestions: number;
  onClose: () => void;
}

interface Question {
  id: string;
  text: string;
  score: number;
  options: Array<{
    id: string;
    text: string;
  }>;
}

interface Attempt {
  id: string;
  state: "EN_PROGRESO" | "COMPLETADO" | "ABANDONADO";
  score_total?: number;
  percent?: number;
}

export function QuizTakeView({
  quizId,
  quizTitle,
  quizDescription,
  timeMinutes,
  totalQuestions,
  onClose,
}: QuizTakeViewProps) {
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadQuizData();
  }, [quizId]);

  // Timer
  useEffect(() => {
    if (timeMinutes && timeLeft !== null && timeLeft > 0 && !showResults) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, showResults, timeMinutes]);

  const loadQuizData = async () => {
    try {
      setLoading(true);

      // 1. Verificar si ya existe un intento completado
      const attemptsRes = await api.get<{ attempts: Attempt[] }>(
        `api/quizzes/${quizId}/attempts`
      );

      const completedAttempt = attemptsRes.attempts.find(
        (a) => a.state === "COMPLETADO"
      );

      if (completedAttempt) {
        // Ya completó el quiz, mostrar resultados
        setAttempt(completedAttempt);
        setShowResults(true);
        await loadQuestionsForReview();
        return;
      }

      // 2. Cargar preguntas
      const questionsRes = await api.get<{ questions: Question[] }>(
        `api/quizzes/${quizId}/questions`
      );
      setQuestions(questionsRes.questions);

      // 3. Crear nuevo intento
      const newAttempt = await api.post<Attempt>(
        `api/quizzes/${quizId}/attempts/start`,
        {}
      );
      setAttempt(newAttempt);

      // 4. Iniciar timer si hay límite de tiempo
      if (timeMinutes) {
        setTimeLeft(timeMinutes * 60);
      }
    } catch (error: any) {
      console.error("Error loading quiz:", error);
      toast.error(error.response?.data?.detail || "Error al cargar el quiz");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsForReview = async () => {
    try {
      const questionsRes = await api.get<{ questions: Question[] }>(
        `api/quizzes/${quizId}/questions`
      );
      setQuestions(questionsRes.questions);
    } catch (error) {
      console.error("Error loading questions for review:", error);
    }
  };

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleSubmit = async () => {
    if (!attempt) return;

    // Validar que todas las preguntas estén respondidas
    const unansweredCount = questions.length - Object.keys(answers).length;
    if (unansweredCount > 0) {
      toast.error(`Faltan ${unansweredCount} pregunta(s) por responder`);
      return;
    }

    try {
      setSubmitting(true);

      // Enviar todas las respuestas
      for (const [questionId, optionId] of Object.entries(answers)) {
        await api.post(`api/attempts/${attempt.id}/responses`, {
          question_id: questionId,
          option_id: optionId,
        });
      }

      // Finalizar intento
      const completedAttempt = await api.post<Attempt>(
        `api/quizzes/${quizId}/attempts/${attempt.id}/finish-personalized`,
        {}
      );

      setAttempt(completedAttempt);
      setShowResults(true);
      toast.success("Quiz enviado exitosamente");
    } catch (error: any) {
      console.error("Error submitting quiz:", error);
      toast.error(error.response?.data?.detail || "Error al enviar el quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!showResults && attempt?.state === "EN_PROGRESO") {
      setShowExitDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmExit = async () => {
    if (attempt && attempt.state === "EN_PROGRESO") {
      try {
        // Abandonar intento
        await api.post(
          `api/quizzes/${quizId}/attempts/${attempt.id}/abandon`,
          {}
        );
      } catch (error) {
        console.error("Error abandoning attempt:", error);
      }
    }
    onClose();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (showResults && attempt) {
    return (
      <QuizResultsView
        attemptId={attempt.id}
        quizId={quizId}
        onBackToQuiz={onClose}
      />
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{quizTitle}</h2>
            {quizDescription && (
              <p className="text-muted-foreground">{quizDescription}</p>
            )}
          </div>
          {timeLeft !== null && (
            <Badge
              variant={timeLeft < 300 ? "destructive" : "secondary"}
              className="text-lg px-4 py-2"
            >
              <Clock className="h-4 w-4 mr-2" />
              {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progreso</span>
                <span className="font-medium">
                  {answeredCount}/{questions.length} respondidas
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 mb-1">Instrucciones</p>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>Debes responder todas las preguntas antes de enviar</li>
                <li>Solo tienes un intento para este quiz</li>
                {timeMinutes && <li>Tiempo límite: {timeMinutes} minutos</li>}
              </ul>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuizQuestionCard
              key={question.id}
              question={question}
              questionNumber={index + 1}
              totalQuestions={questions.length}
              selectedOptionId={answers[question.id] || null}
              onSelectOption={(optionId) =>
                handleAnswerChange(question.id, optionId)
              }
              isAnswered={!!answers[question.id]}
            />
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || answeredCount < questions.length}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Quiz ({answeredCount}/{questions.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Abandonar el quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Si sales ahora, perderás tu progreso y no podrás volver a
              intentarlo. ¿Estás seguro de que deseas salir?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar con el quiz</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExit}
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
