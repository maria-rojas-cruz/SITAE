import { Badge } from "@/components/ui/badge";
import type { QuizResultsReport, StudentPerformance } from "../types";

interface QuizStudentDetailsProps {
  quiz: { id: string; title: string };
  quizResults: QuizResultsReport;
  allStudents: StudentPerformance[];
}

export function QuizStudentDetails({
  quiz,
  quizResults,
  allStudents,
}: QuizStudentDetailsProps) {
  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
      <h4 className="font-medium text-slate-900 mb-3">Estudiantes - {quiz.title}</h4>
      <div className="space-y-2">
        {/* Estudiantes que completaron */}
        {quizResults.student_results.map((result) => (
          <div
            key={result.attempt_id}
            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
          >
            <span className="font-medium text-slate-900">{result.full_name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900">
                {result.score.toFixed(1)} ({result.percent.toFixed(0)}%)
              </span>
            </div>
          </div>
        ))}

        {/* Estudiantes que no respondieron */}
        {allStudents
          .filter(
            (student) =>
              !quizResults.student_results.some(
                (result) => result.user_id === student.user_id
              )
          )
          .map((student) => (
            <div
              key={student.user_id}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
            >
              <span className="font-medium text-slate-900">{student.full_name}</span>
              <Badge variant="destructive" className="bg-red-100 text-red-700">
                No respondió
              </Badge>
            </div>
          ))}
      </div>
    </div>
  );
}