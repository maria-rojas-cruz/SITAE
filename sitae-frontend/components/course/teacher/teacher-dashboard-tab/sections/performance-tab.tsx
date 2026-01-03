import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizPerformanceItem } from "./quiz-performance-item";
import { QuizStudentDetails } from "./quiz-student-details";
import type {
  QuizWithMetadata,
  QuizResultsReport,
  CourseStatistics,
  StudentPerformance,
} from "../types";

interface PerformanceTabProps {
  quizzes: QuizWithMetadata[];
  allQuizResults: Map<string, QuizResultsReport>;
  courseStats: CourseStatistics | null;
  students: StudentPerformance[];
  selectedQuizForDetails: string | null;
  onQuizToggle: (quizId: string) => void;
  onFetchQuizResults: (quizId: string) => void;
}

export function PerformanceTab({
  quizzes,
  allQuizResults,
  courseStats,
  students,
  selectedQuizForDetails,
  onQuizToggle,
  onFetchQuizResults,
}: PerformanceTabProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Promedio por Evaluación</CardTitle>
        <CardDescription className="text-slate-600">
          Haz clic en cada evaluación para ver el detalle de estudiantes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quizzes.map((quiz) => {
            const quizResults = allQuizResults.get(quiz.id);
            const isExpanded = selectedQuizForDetails === quiz.id;

            return (
              <div key={quiz.id}>
                <QuizPerformanceItem
                  quiz={quiz}
                  quizResults={quizResults}
                  courseStats={courseStats}
                  isExpanded={isExpanded}
                  onToggle={() => {
                    onQuizToggle(quiz.id);
                    if (!isExpanded && !quizResults) {
                      onFetchQuizResults(quiz.id);
                    }
                  }}
                />

                {isExpanded && quizResults && (
                  <QuizStudentDetails
                    quiz={quiz}
                    quizResults={quizResults}
                    allStudents={students}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}