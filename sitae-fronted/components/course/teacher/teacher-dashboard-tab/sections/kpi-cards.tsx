import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, CheckCircle, GraduationCap, Users } from "lucide-react";
import type { CourseStatistics } from "../types";

interface KpiCardsProps {
  courseStats: CourseStatistics | null;
  quizParticipationRate: number;
  averageObjectivesAchievement: number;
}

export function KpiCards({
  courseStats,
  quizParticipationRate,
  averageObjectivesAchievement,
}: KpiCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Avance Promedio del Grupo */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            Avance Promedio del Grupo
          </CardTitle>
          <Target className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {averageObjectivesAchievement.toFixed(0)}%
          </div>
          <p className="text-xs text-slate-600">Objetivos alcanzados</p>
        </CardContent>
      </Card>

      {/* Participación en Quizzes */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            Participación en Quizzes
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {quizParticipationRate.toFixed(0)}%
          </div>
          <p className="text-xs text-slate-600">Estudiantes participando</p>
        </CardContent>
      </Card>

      {/* Promedio General */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            Promedio General
          </CardTitle>
          <GraduationCap className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {courseStats?.avg_quiz_score.toFixed(1) || "0"}
          </div>
          <p className="text-xs text-slate-600">Calificaciones</p>
        </CardContent>
      </Card>

      {/* Total Estudiantes */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">
            Total Estudiantes
          </CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            {courseStats?.total_students || 0}
          </div>
          <p className="text-xs text-slate-600">Inscritos activos</p>
        </CardContent>
      </Card>
    </div>
  );
}