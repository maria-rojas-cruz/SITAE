export interface TeacherDashboardTabProps {
  courseId: string;
}

export interface CourseStatistics {
  total_students: number;
  total_quizzes: number;
  avg_quiz_score: number;
  quizzes_completed_count: number;
  quizzes_pending_count: number;
  active_students_last_week: number;
  quiz_participation_rate?: number;
  average_objectives_achievement?: number;
}

export interface StudentPerformance {
  user_id: string;
  full_name: string;
  email: string;
  quizzes_completed: number;
  quizzes_total: number;
  avg_score: number | null;
  last_activity: string | null;
}

export interface QuizResultsReport {
  quiz_id: string;
  quiz_title: string;
  topic_name: string;
  total_attempts: number;
  completed_attempts: number;
  avg_score: number;
  avg_percent: number;
  question_analysis: QuestionAnalysis[];
  student_results: StudentQuizResult[];
}

export interface QuestionAnalysis {
  question_id: string;
  question_text: string;
  correct_rate: number;
  total_responses: number;
  avg_time_seconds: number | null;
}

export interface StudentQuizResult {
  user_id: string;
  full_name: string;
  attempt_id: string;
  score: number;
  percent: number;
  date_completed: string;
  time_taken_minutes: number | null;
}

export interface LearningOutcomePerformance {
  learning_outcome_id: string;
  learning_outcome_code: string;
  learning_outcome_description: string;
  related_quizzes_count: number;
  avg_score_across_quizzes: number;
  students_above_70_percent: number;
  students_below_70_percent: number;
  achievement_rate?: number;
  topic?: string;
}

export interface LearningOutcomePerformanceList {
  learning_outcomes: LearningOutcomePerformance[];
  total: number;
}

export interface ErrorAnalysis {
  question_id: string;
  question_text: string;
  full_question_text: string;
  error_rate: number;
  learning_objective_code: string;
  learning_objective_description: string;
  quiz_title: string;
  topic_name: string;
}

export interface ErrorAnalysisList {
  errors: ErrorAnalysis[];
  total: number;
}

export interface QuizWithMetadata {
  id: string;
  title: string;
  topic_name: string;
  module_name: string;
}

export type RiskLevel = "high" | "medium" | "low";
export type RiskFilter = "all" | "desaprobados" | "no_participan";