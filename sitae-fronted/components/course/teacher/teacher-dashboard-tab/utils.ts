import type { StudentPerformance, RiskLevel } from "./types";
import { RISK_THRESHOLDS, COLORS } from "./constants";

export function getStudentRiskLevel(student: StudentPerformance): RiskLevel {
  const completionRate =
    student.quizzes_total > 0
      ? (student.quizzes_completed / student.quizzes_total) * 100
      : 0;
  const avgScore = student.avg_score || 0;

  if (
    completionRate < RISK_THRESHOLDS.COMPLETION_LOW ||
    avgScore < RISK_THRESHOLDS.SCORE_LOW
  ) {
    return "high";
  }
  if (
    completionRate < RISK_THRESHOLDS.COMPLETION_MEDIUM ||
    avgScore < RISK_THRESHOLDS.SCORE_MEDIUM
  ) {
    return "medium";
  }
  return "low";
}

export function getAchievementColor(rate: number): string {
  if (rate >= RISK_THRESHOLDS.ACHIEVEMENT_HIGH) return COLORS.SUCCESS;
  if (rate >= RISK_THRESHOLDS.ACHIEVEMENT_MEDIUM) return COLORS.WARNING;
  return COLORS.DANGER;
}

export function calculateAchievementRate(
  studentsAbove: number,
  studentsBelow: number
): number {
  const total = studentsAbove + studentsBelow;
  return total > 0 ? (studentsAbove / total) * 100 : 0;
}

export function exportStudentsReport(
  students: StudentPerformance[],
  courseId: string
): void {
  const csvContent = [
    ["Estudiante", "Email", "Quizzes Completados", "Promedio", "Nivel de Riesgo"],
    ...students.map((s) => [
      s.full_name,
      s.email,
      `${s.quizzes_completed}/${s.quizzes_total}`,
      s.avg_score?.toFixed(2) || "N/A",
      getStudentRiskLevel(s),
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-curso-${courseId}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}