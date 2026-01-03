"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

import { useCourseStats } from "./hooks/useCourseStats";
import { useStudentsPerformance } from "./hooks/useStudentsPerformance";
import { useQuizzes } from "./hooks/useQuizzes";
import { useQuizResults } from "./hooks/useQuizResults";
import { useLearningOutcomes } from "./hooks/useLearningOutcomes";
import { useErrorAnalysis } from "./hooks/useErrorAnalysis";
import { useFilters } from "./hooks/useFilters";

import { DashboardHeader } from "./sections/dashboard-header";
import { KpiCards } from "./sections/kpi-cards";
import { PerformanceTab } from "./sections/performance-tab";
import { ObjectivesTab } from "./sections/objectives-tab";
import { RiskTab } from "./sections/risk-tab";

import { exportStudentsReport } from "./utils";
import type { TeacherDashboardTabProps } from "./types";

export function TeacherDashboardTab({ courseId }: TeacherDashboardTabProps) {
  // Hooks de datos
  const {
    courseStats,
    isLoading: loadingStats,
    quizParticipationRate,
    averageObjectivesAchievement,
  } = useCourseStats(courseId);

  const { students, isLoading: loadingStudents } =
    useStudentsPerformance(courseId);

  const { quizzes, isLoading: loadingQuizzes } = useQuizzes(courseId);

  const {
    allQuizResults,
    selectedQuizResults,
    fetchQuizResults,
    isLoading: loadingQuizResults,
  } = useQuizResults(quizzes);

  const { learningOutcomes, isLoading: loadingOutcomes } =
    useLearningOutcomes(courseId);

  const { errorAnalysis, isLoading: loadingErrors } =
    useErrorAnalysis(courseId);

  // Hook de filtros
  const {
    selectedQuiz,
    setSelectedQuiz,
    selectedQuizForDetails,
    setSelectedQuizForDetails,
    selectedTopic,
    setSelectedTopic,
    selectedStudent,
    setSelectedStudent,
    selectedQuizFilter,
    setSelectedQuizFilter,
    riskFilter,
    setRiskFilter,
    filteredStudents,
    filteredLearningOutcomes,
    filteredErrorAnalysis,
    availableTopics,
  } = useFilters(students, learningOutcomes, errorAnalysis);

  // Estados de carga
  const isLoading =
    loadingStats ||
    loadingStudents ||
    loadingQuizzes ||
    loadingOutcomes ||
    loadingErrors;

  // Handler para exportar
  const handleExport = () => {
    try {
      exportStudentsReport(students, courseId);
      toast.success("Reporte exportado exitosamente");
    } catch (err) {
      console.error("Error exporting report:", err);
      toast.error("Error al exportar el reporte");
    }
  };

  // Handler para toggle de quiz
  const handleQuizToggle = (quizId: string) => {
    setSelectedQuizForDetails(
      selectedQuizForDetails === quizId ? null : quizId
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-7xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8">
        <DashboardHeader onExport={handleExport} />
        <KpiCards
          courseStats={courseStats}
          quizParticipationRate={quizParticipationRate}
          averageObjectivesAchievement={averageObjectivesAchievement}
        />
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Desempeño</TabsTrigger>
          <TabsTrigger value="objectives">Objetivos</TabsTrigger>
          <TabsTrigger value="risk">Riesgo</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab
            quizzes={quizzes}
            allQuizResults={allQuizResults}
            courseStats={courseStats}
            students={students}
            selectedQuizForDetails={selectedQuizForDetails}
            onQuizToggle={handleQuizToggle}
            onFetchQuizResults={fetchQuizResults}
          />
        </TabsContent>

<TabsContent value="objectives" className="space-y-6">
  <ObjectivesTab
    courseId={courseId}
    errorAnalysis={errorAnalysis}
    quizzes={quizzes}
    students={students}
  />
</TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <RiskTab
            students={filteredStudents}
            riskFilter={riskFilter}
            onRiskFilterChange={setRiskFilter}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}