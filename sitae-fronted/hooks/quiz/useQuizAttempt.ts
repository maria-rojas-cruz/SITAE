// hooks/quiz/useQuizAttempt.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
// useRef evita que loadQuizAttempt se ejecute dos veces
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

type ViewMode = "quiz" | "results";

export function useQuizAttempt() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const quizId = params.quizId as string;

  // Estados
  const [viewMode, setViewMode] = useState<ViewMode>("quiz");
  const [quiz, setQuiz] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard para evitar ejecutar loadQuizAttempt dos veces
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Solo ejecutar una vez
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadQuizAttempt();
  }, [quizId]);

  const loadQuizAttempt = async () => {
    try {
      setLoading(true);

      // 1. Verificar intentos existentes
      const { attempts } = await api.get(`api/quizzes/${quizId}/attempts`);

      const completedAttempt = attempts.find(
        (a: any) => a.state === "CALIFICADO"
      );
      if (completedAttempt) {
        toast.info("Ya completaste este quiz");
        router.push(`/curso/${courseId}/quiz/${quizId}/resultados`);
        return;
      }

      const inProgressAttempt = attempts.find(
        (a: any) => a.state === "EN_PROGRESO"
      );

      // 2. Cargar quiz info
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

      if (!foundQuiz) {
        setError("Quiz no encontrado");
        return;
      }

      setQuiz(foundQuiz);

      // 3. Cargar preguntas
      const { questions: quizQuestions } = await api.get(
        `api/quizzes/${quizId}/questions`
      );

      if (!quizQuestions || quizQuestions.length === 0) {
        setError("Este quiz no tiene preguntas");
        return;
      }

      // 4. Cargar opciones para cada pregunta
      const questionsWithOptions = await Promise.all(
        quizQuestions.map(async (q: any) => {
          try {
            const { options } = await api.get(`api/questions/${q.id}/options`);
            return { ...q, options };
          } catch (err) {
            console.error(`Error loading options for question ${q.id}:`, err);
            return { ...q, options: [] };
          }
        })
      );

      setQuestions(questionsWithOptions);

      // 5. Usar attempt existente o crear nuevo
      let currentAttempt;
      if (inProgressAttempt) {
        // Si hay intento en progreso, usarlo directamente
        currentAttempt = inProgressAttempt;
      } else {
        // Solo crear nuevo si no existe
        currentAttempt = await api.post(
          `api/quizzes/${quizId}/attempts/start`,
          {}
        );
      }

      setAttempt(currentAttempt);
    } catch (err: any) {
      console.error("Error loading quiz:", err);
      setError(err.message || "Error al cargar el quiz");
      toast.error("Error al cargar el quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = useCallback(
    (questionId: string, optionId: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    },
    []
  );

  const handleClearAnswer = useCallback((questionId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!attempt || submitting) return;

    const unanswered = questions.filter((q) => !answers[q.id]);

    if (unanswered.length > 0) {
      const confirmed = window.confirm(
        `⚠️ Tienes ${unanswered.length} pregunta(s) sin responder.\n\n` +
          `Recibirás 0 puntos en ellas. ¿Deseas enviar de todos modos?`
      );
      if (!confirmed) return;
    }

    try {
      setSubmitting(true);

      const payload = {
        answers: questions.map((q) => ({
          question_id: q.id,
          option_id: answers[q.id] || null,
          time_seconds: null,
        })),
      };


      const result = await api.post(
        `api/quizzes/${quizId}/attempts/${attempt.id}/finish-personalized`,
        payload
      );


      setResults(result);
      setViewMode("results");

      toast.success("Quiz completado");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Error submitting quiz:", err);
      toast.error(err.message || "Error al enviar el quiz");
    } finally {
      setSubmitting(false);
    }
  }, [attempt, questions, answers, quizId, submitting]);

  return {
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
  };
}
