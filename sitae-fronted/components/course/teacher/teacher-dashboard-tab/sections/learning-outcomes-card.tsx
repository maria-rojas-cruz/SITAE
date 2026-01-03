import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { LearningOutcomePerformance, StudentPerformance } from "../types";
import { getAchievementColor, calculateAchievementRate } from "../utils";

interface LearningOutcomesCardProps {
  learningOutcomes: LearningOutcomePerformance[];
  students: StudentPerformance[];
  availableTopics: (string | undefined)[];
  selectedTopic: string;
  selectedStudent: string;
  isLoading?: boolean; // ← AGREGAR
  onTopicChange: (value: string) => void;
  onStudentChange: (value: string) => void;
}

export function LearningOutcomesCard({
  learningOutcomes,
  students,
  availableTopics,
  selectedTopic,
  selectedStudent,
  isLoading = false, // ← AGREGAR
  onTopicChange,
  onStudentChange,
}: LearningOutcomesCardProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">
          Progreso por Objetivo de Aprendizaje
        </CardTitle>
        <CardDescription className="text-slate-600">
          Porcentaje de estudiantes que están alcanzado los objetivos de
          aprendizaje del curso
          <div className="flex gap-2 mt-2">
            {/* <Select
              value={selectedTopic}
              onValueChange={onTopicChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {availableTopics.map((topic) => (
                  <SelectItem key={topic} value={topic!}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select> */}

            <Select
              value={selectedStudent}
              onValueChange={onStudentChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estudiante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.user_id} value={student.user_id}>
                    {student.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Cargando datos...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {learningOutcomes.length > 0 ? (
              learningOutcomes.map((objective) => {
                const achievementRate =
                  objective.achievement_rate ||
                  calculateAchievementRate(
                    objective.students_above_70_percent,
                    objective.students_below_70_percent
                  );

                return (
                  <div
                    key={objective.learning_outcome_id}
                    className="space-y-2"
                  >
                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="font-medium text-slate-900">
                          {objective.learning_outcome_code}:{" "}
                          {objective.learning_outcome_description}
                        </span>
                        {objective.topic && (
                          <p className="text-xs text-slate-600">
                            Tema: {objective.topic}
                          </p>
                        )}
                      </div>
                      <span className="text-slate-700">
                        {achievementRate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getAchievementColor(
                          achievementRate
                        )}`}
                        style={{ width: `${achievementRate}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-600 text-center py-8">
                No hay objetivos de aprendizaje disponibles aún
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
