// hooks/useLearningOutcomes.ts
import useSWR from 'swr';
import { api } from '@/lib/api-client';
import type { LearningOutcome, CreateLearningOutcome, UpdateLearningOutcome } from '@/types/learning-outcome';

interface LearningOutcomesResponse {
  outcomes: LearningOutcome[];
  total: number;
}

export function useLearningOutcomes(courseId: string) {
  const { data, error, mutate, isLoading } = useSWR<LearningOutcomesResponse>(
    courseId ? `api/courses/${courseId}/learning-outcomes` : null
  );

  const createOutcome = async (outcomeData: CreateLearningOutcome) => {
    const newOutcome = await api.post(
      `api/courses/${courseId}/learning-outcomes`,
      outcomeData
    );
    mutate();
    return newOutcome;
  };

  const updateOutcome = async (
    outcomeId: string,
    outcomeData: UpdateLearningOutcome
  ) => {
    const updated = await api.put(
      `api/courses/${courseId}/learning-outcomes/${outcomeId}`,
      outcomeData
    );
    mutate();
    return updated;
  };

  const deleteOutcome = async (outcomeId: string) => {
    await api.delete(
      `api/courses/${courseId}/learning-outcomes/${outcomeId}`
    );
    mutate();
  };

  return {
    outcomes: data?.outcomes || [],
    total: data?.total || 0,
    isLoading,
    error,
    createOutcome,
    updateOutcome,
    deleteOutcome,
    refresh: mutate,
  };
}