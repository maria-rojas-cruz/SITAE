// hooks/useCourse.ts
import useSWR from 'swr';
import { api } from '@/lib/api-client';

interface Module {
  id: number;
  name: string;
  objectives: string[];
  topics: Topic[];
}

interface Topic {
  id: number;
  name: string;
  objective: string;
  resources: Resource[];
}

interface Resource {
  id: number;
  type: 'video' | 'reading' | 'code' | 'exercise';
  title: string;
  duration: string;
  completed: boolean;
}

interface Evaluation {
  id: number;
  topic: string;
  title: string;
  status: 'completed' | 'pending';
  score?: number;
  totalQuestions: number;
  correctAnswers?: number;
  dueDate: string;
  duration: number;
}

interface Course {
  id: string;
  name: string;
  code?: string;
  description?: string;
  teacher?: string;
  credits?: number;
  duration?: string;
  modality?: string;
  progress: number;
  learningOutcomes: string[];
  activeTopics: string[];
  modules: Module[];
  evaluations: Evaluation[];
}

export function useCourseDetail(id: string) {
  const { data, error, mutate, isLoading } = useSWR<Course>(
    id ? `api/courses/${id}` : null
  );

  const updateProgress = async (progress: number) => {
    await api.patch(`api/courses/${id}`, { progress });
    mutate();
  };

  return {
    course: data,
    isLoading,
    error,
    updateProgress,
    refresh: mutate,
  };
}