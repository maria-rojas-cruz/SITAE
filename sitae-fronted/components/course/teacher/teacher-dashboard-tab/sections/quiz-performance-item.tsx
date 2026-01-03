import { Progress } from "@/components/ui/progress";
import type { QuizWithMetadata, QuizResultsReport, CourseStatistics } from "../types";

interface QuizPerformanceItemProps {
  quiz: QuizWithMetadata;
  quizResults: QuizResultsReport | undefined;
  courseStats: CourseStatistics | null;
  isExpanded: boolean;
  onToggle: () => void;
}

export function QuizPerformanceItem({
  quiz,
  quizResults,
  courseStats,
  isExpanded,
  onToggle,
}: QuizPerformanceItemProps) {
  const completionRate =
    quizResults && courseStats
      ? (quizResults.completed_attempts / courseStats.total_students) * 100
      : 0;
  const avgScore = quizResults?.avg_score || 0;

  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="w-full text-left hover:bg-slate-50 p-2 rounded-lg transition-colors"
      >
        <div className="flex justify-between text-sm">
          <span className="font-medium text-slate-900">
            {quiz.title} ({quiz.topic_name})
          </span>
          <span className="text-slate-700">Promedio: {avgScore.toFixed(1)}</span>
        </div>
        <Progress value={completionRate} className="h-2 mt-2" />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>{quizResults?.completed_attempts || 0} estudiantes completaron</span>
          <span>{completionRate.toFixed(0)}% participación</span>
        </div>
      </button>
    </div>
  );
}