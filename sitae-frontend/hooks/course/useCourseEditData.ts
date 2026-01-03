// hooks/course/useCourseEditData.ts
import useSWR from 'swr';

export interface TopicObjectiveInfo {
  id: string;
  description: string;
  code?: string;
}

export interface ModuleObjectiveInfo {
  id: string;
  description: string;
  code?: string;
}

export interface ModuleObjectiveWithLinks {
  id: string;
  description: string;
  code?: string;
  order: number;
  linked_learning_outcome_ids: string[];
}

export interface TopicObjectiveWithLinks {
  id: string;
  description: string;
  code?: string;
  order: number;
  linked_module_objective_ids: string[];
}

export interface ResourceEditInfo {
  id: string;
  type: string;
  title: string;
  url: string;
  duration_minutes?: number;
  is_mandatory: boolean;
  order: number;
  topic_objective_id: string;
  difficulty: string; 
  
}

export interface QuizEditData {
  id: string;
  title: string;
  description?: string;
  time_minutes?: number;
  is_active: boolean;
  order: number;
}

export interface TopicEditData {
  id: string;
  title: string;
  description?: string;
  order: number;
  objectives: TopicObjectiveWithLinks[];
  resources: ResourceEditInfo[];
  quizzes: QuizEditData[];
  available_module_objectives: ModuleObjectiveInfo[];
}

export interface ModuleEditData {
  id: string;
  title: string;
  description?: string;
  order: number;
  objectives: ModuleObjectiveWithLinks[];
  topics: TopicEditData[];
}

export interface LearningOutcomeInfo {
  id: string;
  code: string;
  description: string;
  bloom_level?: string;
  order: number;
}

export interface CourseEditData {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  learning_outcomes: LearningOutcomeInfo[];
  modules: ModuleEditData[];
}

export function useCourseEditData(courseId: string) {
  const { data, error, mutate, isLoading } = useSWR<CourseEditData>(
    courseId ? `/api/courses/${courseId}/edit-data` : null
  );

  return {
    editData: data,
    isLoading,
    error,
    refresh: mutate,
  };
}