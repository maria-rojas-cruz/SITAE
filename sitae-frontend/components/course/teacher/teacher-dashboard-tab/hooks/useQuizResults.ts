import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { QuizResultsReport, QuizWithMetadata } from "../types";

export function useQuizResults(quizzes: QuizWithMetadata[]) {
  const [allQuizResults, setAllQuizResults] = useState<Map<string, QuizResultsReport>>(
    new Map()
  );
  const [selectedQuizResults, setSelectedQuizResults] =
    useState<QuizResultsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuizResults = async (quizId: string) => {
    try {
      const data = await api.get<QuizResultsReport>(
        `api/statistics/quizzes/${quizId}/results`
      );
      setSelectedQuizResults(data);
      setAllQuizResults((prev) => new Map(prev).set(quizId, data));
    } catch (err) {
      console.error("Error loading quiz results:", err);
      toast.error("Error al cargar los resultados del quiz");
    }
  };

  const fetchAllQuizResults = async () => {
    try {
      setIsLoading(true);
      const resultsPromises = quizzes.map((quiz) =>
        api
          .get<QuizResultsReport>(`api/statistics/quizzes/${quiz.id}/results`)
          .catch((err) => {
            console.error(`Error loading quiz ${quiz.id}:`, err);
            return null;
          })
      );

      const results = await Promise.all(resultsPromises);
      const resultsMap = new Map<string, QuizResultsReport>();

      results.forEach((result, index) => {
        if (result) {
          resultsMap.set(quizzes[index].id, result);
        }
      });

      setAllQuizResults(resultsMap);
    } catch (err) {
      console.error("Error loading all quiz results:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quizzes.length > 0) {
      fetchAllQuizResults();
    }
  }, [quizzes]);

  return {
    allQuizResults,
    selectedQuizResults,
    fetchQuizResults,
    isLoading,
  };
}