import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { QuizWithMetadata } from "../types";

export function useQuizzes(courseId: string) {
  const [quizzes, setQuizzes] = useState<QuizWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<any>(`api/courses/${courseId}/content`);

        const allQuizzes: QuizWithMetadata[] = [];
        data.modules?.forEach((module: any) => {
          module.topics?.forEach((topic: any) => {
            topic.quizzes?.forEach((quiz: any) => {
              allQuizzes.push({
                ...quiz,
                topic_name: topic.title,
                module_name: module.title,
              });
            });
          });
        });
        setQuizzes(allQuizzes);
      } catch (err) {
        console.error("Error loading quizzes:", err);
        toast.error("Error al cargar los quizzes");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchQuizzes();
    }
  }, [courseId]);

  return { quizzes, isLoading };
}