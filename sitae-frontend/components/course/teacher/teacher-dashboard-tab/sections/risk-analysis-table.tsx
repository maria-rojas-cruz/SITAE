import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StudentPerformance } from "../types";
import { RISK_THRESHOLDS } from "../constants";

interface RiskAnalysisTableProps {
  students: StudentPerformance[];
}

export function RiskAnalysisTable({ students }: RiskAnalysisTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-200">
            <TableHead className="text-left p-3 font-medium text-slate-900">
              Estudiante
            </TableHead>
            <TableHead className="text-left p-3 font-medium text-slate-900">
              Promedio de Nota en Quizzes
            </TableHead>
            <TableHead className="text-left p-3 font-medium text-slate-900">
              Cantidad de Quizzes Tomados
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => {
            const participationRate =
              student.quizzes_total > 0
                ? (student.quizzes_completed / student.quizzes_total) * 100
                : 0;

            return (
              <TableRow
                key={student.user_id}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <TableCell className="p-3">
                  <span className="font-medium text-slate-900">
                    {student.full_name}
                  </span>
                </TableCell>
                <TableCell className="p-3">
                  <span
                    className={`font-medium ${
                      (student.avg_score || 0) < RISK_THRESHOLDS.FAILED_SCORE
                        ? "text-white bg-red-500 px-2 py-1 rounded"
                        : "text-slate-900"
                    }`}
                  >
                    {student.avg_score?.toFixed(1) || "N/A"}
                  </span>
                </TableCell>
                <TableCell className="p-3">
                  <span
                    className={`font-medium ${
                      participationRate < RISK_THRESHOLDS.COMPLETION_LOW
                        ? "text-white bg-red-500 px-2 py-1 rounded"
                        : "text-slate-900"
                    }`}
                  >
                    {student.quizzes_completed}/{student.quizzes_total} (
                    {participationRate.toFixed(0)}% participación)
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}