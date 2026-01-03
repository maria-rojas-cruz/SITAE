// types/learning-outcome.ts
export interface LearningOutcome {
  id: string;
  course_id: string;
  code: string;
  description: string;
  bloom_level?: string;
  order: number;
}

export interface CreateLearningOutcome {
  code: string;
  description: string;
  bloom_level?: string;
  order?: number;
}

export interface UpdateLearningOutcome {
  code?: string;
  description?: string;
  bloom_level?: string;
  order?: number;
}