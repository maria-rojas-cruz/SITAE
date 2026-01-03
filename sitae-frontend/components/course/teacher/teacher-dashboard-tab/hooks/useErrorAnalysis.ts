import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import type { ErrorAnalysis, ErrorAnalysisList } from "../types";

export function useErrorAnalysis(courseId: string) {
  const [errorAnalysis, setErrorAnalysis] = useState<ErrorAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchErrorAnalysis = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<ErrorAnalysisList>(
          `api/statistics/courses/${courseId}/error-analysis`
        );
        setErrorAnalysis(data.errors || []);
      } catch (err) {
        console.error("Error loading error analysis:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchErrorAnalysis();
    }
  }, [courseId]);

  return { errorAnalysis, isLoading };
}