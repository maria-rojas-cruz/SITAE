import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus, Edit } from "lucide-react";
import { LearningOutcomeCreateSheet } from "../../course-edit/sheets/learning-outcome-create-sheet";
import { LearningOutcomeEditSheet } from "../../course-edit/sheets/learning-outcome-edit-sheet";
import { ExpandableText } from "../components/expandable-text";

interface LearningOutcomesSectionProps {
  courseId: string;
  learningOutcomes: any[];
  nextOrder: number;
  onSuccess: () => void;
}

export function LearningOutcomesSection({
  courseId,
  learningOutcomes,
  nextOrder,
  onSuccess,
}: LearningOutcomesSectionProps) {
  if (learningOutcomes.length === 0) return null;

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <Target className="h-5 w-5 text-primary" />
            Resultados de Aprendizaje
          </CardTitle>
          <CardDescription className="mt-1">
            Objetivos que los estudiantes alcanzarán al completar este curso
          </CardDescription>
        </div>
        <LearningOutcomeCreateSheet
          courseId={courseId}
          nextOrder={nextOrder}
          onSuccess={onSuccess}
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Agregar RA
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {learningOutcomes.map((outcome, index) => (
            <li key={outcome.id} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-6 bg-primary/10 rounded-full flex items-center justify-center mt-.5 overflow-hidden">
                <span className="text-xs font-medium text-primary">
                  RA{index + 1}
                </span>
              </div>
              <p className="text-sm flex-1 leading-relaxed">
                <ExpandableText text={outcome.description} />
              </p>
              <LearningOutcomeEditSheet
                courseId={courseId}
                outcome={outcome}
                onSuccess={onSuccess}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}