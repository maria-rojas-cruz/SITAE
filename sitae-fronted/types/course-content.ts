// types/course-content.ts
export interface TeacherInfo {
  id: string;
  full_name: string;
  email: string;
}

export interface LearningOutcome {
  id: string;
  code: string;
  description: string;
  bloom_level?: string;
  order: number;
}

export interface TopicObjective {
  id: string;
  description: string;
  code?: string;
}

export interface Resource {
  id: string;
  type: string;
  title: string;
  url: string;
  duration_minutes?: number;
  is_mandatory: boolean;
  order: number;
  topic_objective_id: string;
  topic_objective_code?: string;
}

export interface QuizSummary {
  id: string;
  type: "quiz";
  title: string;
  description?: string;
  time_minutes?: number;
  is_active: boolean;
  order: number;
}

export interface Quiz {
  id: string;
  type: "quiz";
  title: string;
  description?: string;
  time_minutes?: number;
  is_active: boolean;
  order: number;
  completed: boolean;  // ← AGREGAR
  last_attempt_id?: string;  // ← AGREGAR
  last_attempt_percent?: number;  // ← AGREGAR
}

export interface Topic {
  id: string;
  title: string;
  description?: string;
  order: number;
  objectives: TopicObjective[];
  resources: Resource[];
  quizzes: Quiz[];
}

export interface ModuleObjective {
  id: string;
  description: string;
  code?: string;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  order: number;
  objectives: ModuleObjective[];
  topics: Topic[];
}

export interface Evaluation {
  id: string;
  title: string;
  topic: string;
  status: "pending" | "completed" | "in_progress";
  score?: number;
  total_questions: number;
  correct_answers?: number;
  due_date?: string;
  attempt_id?: string;
}

export interface CourseContent {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  role: "student" | "teacher" | "admin";
  teachers: TeacherInfo[];
  learning_outcomes: LearningOutcome[];
  modules: Module[];
  evaluations: Evaluation[];
}