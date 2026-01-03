// hooks/useQuizTaking.ts
import { useState } from "react";
import { api } from "@/lib/api-client";

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  date_start: string;
  date_end?: string;
  state: "EN_PROGRESO" | "COMPLETADO" | "ABANDONADO";
  score_total?: number;
  percent?: number;
}

export interface QuizQuestion {
  id: string;
  text: string;
  score: number;
  correct_explanation?: string;
  topic_objective_id: string;
}

export interface QuizOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  feedback?: string;
}

export function useQuizTaking(quizId: string) {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [optionsByQuestion, setOptionsByQuestion] = useState<
    Record<string, QuizOption[]>
  >({});
  const [responses, setResponses] = useState<Record<string, string>>({}); // question_id -> option_id
  const [isLoading, setIsLoading] = useState(false);

  const startAttempt = async () => {
    setIsLoading(true);
    try {
      const attemptData = await api.post(
        `api/quizzes/${quizId}/attempts/start`,
        {}
      );
      setAttempt(attemptData);

      // Cargar preguntas
      const questionsData = await api.get(`api/quizzes/${quizId}/questions`);
      setQuestions(questionsData.questions || []);

      // Cargar opciones para cada pregunta
      const optionsMap: Record<string, QuizOption[]> = {};
      for (const question of questionsData.questions || []) {
        const optionsData = await api.get(
          `api/questions/${question.id}/options`
        );
        optionsMap[question.id] = optionsData.options || [];
      }
      setOptionsByQuestion(optionsMap);

      return attemptData;
    } catch (error: any) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const submitResponse = async (questionId: string, optionId: string) => {
    if (!attempt) return;

    try {
      await api.post(`api/attempts/${attempt.id}/responses`, {
        question_id: questionId,
        option_id: optionId,
        time_seconds: null, // Opcional: podrías trackear tiempo por pregunta
      });

      // Actualizar respuestas locales
      setResponses((prev) => ({ ...prev, [questionId]: optionId }));
    } catch (error: any) {
      throw error;
    }
  };

  const finishAttempt = async () => {
    if (!attempt) return;

    try {
      const result = await api.post(
        `api/quizzes/${quizId}/attempts/${attempt.id}/finish-personalized`,
        {}
      );
      setAttempt(result);
      return result;
    } catch (error: any) {
      throw error;
    }
  };

  const abandonAttempt = async () => {
    if (!attempt) return;

    try {
      await api.post(
        `api/quizzes/${quizId}/attempts/${attempt.id}/abandon`,
        {}
      );
    } catch (error: any) {
      throw error;
    }
  };

  return {
    attempt,
    questions,
    optionsByQuestion,
    responses,
    isLoading,
    startAttempt,
    submitResponse,
    finishAttempt,
    abandonAttempt,
    hasAnswered: (questionId: string) => questionId in responses,
    allQuestionsAnswered:
      questions.length > 0 && questions.every((q) => q.id in responses),
  };
}
