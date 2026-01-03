import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Zap } from "lucide-react";
import { QuizCreateSheet } from "../../course-edit/sheets/quiz-create-sheet";
import { QuizCreateWizard } from "../../course-edit/quiz/quiz-create-wizard";
import { QuizQuickEditSheet } from "../../course-edit/quiz/quiz-quick-edit-sheet";
import { QuizEditWizard } from "../../course-edit/quiz/quiz-edit-wizard";

interface QuizzesSectionProps {
    courseId: string;
  topicId: string;
  quizzes: any[];
  topicObjectives: any[];
  onSuccess: () => void;
}

export function QuizzesSection({
    courseId,
  topicId,
  quizzes,
  topicObjectives,
  onSuccess,
}: QuizzesSectionProps) {
  return (
    <div className="bg-blue-50/50 rounded-lg border border-blue-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h6 className="text-sm font-semibold text-slate-900">
          Evaluaciones ({quizzes.length})
        </h6>
        <div className="flex gap-1">
          <QuizCreateSheet
          courseId={courseId}
            topicId={topicId}
            onSuccess={onSuccess}
            trigger={
              <Button size="sm" variant="outline" className="bg-white">
                <Plus className="h-4 w-4 mr-2" />
                Creador Rápido
              </Button>
            }
          />
          <QuizCreateWizard
          courseId={courseId}
            topicId={topicId}
            topicObjectives={topicObjectives}
            onSuccess={onSuccess}
            trigger={
              <Button size="sm" variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Creador Completo
              </Button>
            }
          />
        </div>
      </div>

      {quizzes.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4 bg-white/60 rounded-lg">
          No hay quizzes creados
        </p>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-medium text-sm text-slate-900 truncate">
                  {quiz.title}
                </span>
                {quiz.time_minutes && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-slate-50 flex-shrink-0"
                  >
                    {quiz.time_minutes} min
                  </Badge>
                )}
                {!quiz.is_active ? (
                  <Badge
                    variant="outline"
                    className="text-xs bg-red-50 text-red-700 border-red-200 flex-shrink-0"
                  >
                    Inactivo
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200 flex-shrink-0"
                  >
                    Publicado
                  </Badge>
                )}
              </div>
              <div className="flex gap-1 ml-2">
                <QuizQuickEditSheet
                courseId={courseId}
                  topicId={topicId}
                  quiz={quiz}
                  onSuccess={onSuccess}
                  trigger={
                    <Button variant="ghost" size="sm" title="Edición rápida">
                      <Zap className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <QuizEditWizard
                courseId={courseId}
                  topicId={topicId}
                  quiz={quiz}
                  topicObjectives={topicObjectives}
                  onSuccess={onSuccess}
                  trigger={
                    <Button variant="ghost" size="sm" title="Edicion completa">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                {/*<Button variant="ghost" size="sm">
                  <Trash2 className="h-3.5 w-3.5 text-slate-400 hover:text-red-600" />
                </Button>*/}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}