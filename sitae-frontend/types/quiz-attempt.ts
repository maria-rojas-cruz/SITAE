// types/quiz-attempt.ts
export interface QuizAttemptResponse {
  id: string;
  quiz_id: string;
  user_id: string;
  date_start: string;
  date_end: string | null;
  state: "EN_PROGRESO" | "COMPLETADO" | "ABANDONADO";
  score_total: number | null;
  percent: number | null;
}

export interface QuestionResponseDetail {
  id: string;
  attempt_quiz_id: string;
  question_id: string;
  option_id: string | null;
  is_correct: boolean | null;
  score: number | null;
  comment: string | null;
  time_seconds: number | null;
}

export interface QuizQuestion {
  id: string;
  text: string;
  score: number;
  correct_explanation?: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  is_correct: boolean;
  feedback?: string;
}

export interface QuizAttemptWithDetails extends QuizAttemptResponse {
  quiz_title: string;
  total_questions: number;
  answered_questions: number;
}