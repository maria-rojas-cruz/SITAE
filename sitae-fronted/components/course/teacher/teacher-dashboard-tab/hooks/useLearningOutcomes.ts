// hooks/useLearningOutcomes.ts
import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import type { LearningOutcomePerformance, LearningOutcomePerformanceList } from "../types";

export function useLearningOutcomes(courseId: string, studentId?: string) {
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcomePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllLearningOutcomes = async () => {
      try {
        setIsLoading(true);
        
        // build URL with optional student filter
        let url = `api/statistics/courses/${courseId}/learning-outcomes`;
        if (studentId && studentId !== 'all') {
          url += `?student_id=${studentId}`;
        }
        
        const data = await api.get<LearningOutcomePerformanceList>(url);
        setLearningOutcomes(data.learning_outcomes || []);
      } catch (err) {
        console.error("Error loading learning outcomes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchAllLearningOutcomes();
    }
  }, [courseId, studentId]); // add studentId as dependency

  return { learningOutcomes, isLoading };
}