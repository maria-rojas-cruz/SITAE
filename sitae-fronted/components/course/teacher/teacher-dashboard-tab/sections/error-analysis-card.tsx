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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { ErrorAnalysis, QuizWithMetadata } from "../types";
interface ErrorAnalysisCardProps {
  errorAnalysis: ErrorAnalysis[];
  quizzes: QuizWithMetadata[];
  selectedQuizFilter: string;
  onQuizFilterChange: (value: string) => void;
}
export function ErrorAnalysisCard({
  errorAnalysis,
  quizzes,
  selectedQuizFilter,
  onQuizFilterChange,
}: ErrorAnalysisCardProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">
          Preguntas con Mayor % de Error
        </CardTitle>
        <CardDescription className="text-slate-600">
          Listado de preguntas de quizzes donde los estudiantes tuvieron más
          dificultades
          <Select value={selectedQuizFilter} onValueChange={onQuizFilterChange}>
            <SelectTrigger className="w-48 mt-2">
              <SelectValue placeholder="Filtrar por quiz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los quizzes</SelectItem>
              {quizzes.map((quiz) => (
                <SelectItem key={quiz.id} value={quiz.title}>
                  {quiz.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-3">
            {errorAnalysis.length > 0 ? (
              errorAnalysis.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border border-slate-200 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h4 className="font-medium text-slate-900 cursor-help hover:text-primary">
                          {item.question_text}
                        </h4>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{item.full_question_text}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge
                      className={`
                        ${
                          item.error_rate >= 60 ? "bg-red-100 text-red-700" : ""
                        }
                        ${
                          item.error_rate >= 30 && item.error_rate < 60
                            ? "bg-yellow-100 text-yellow-700"
                            : ""
                        }
                        ${
                          item.error_rate < 30
                            ? "bg-green-100 text-green-700"
                            : ""
                        }
                      `}
                    >
                      {item.error_rate.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">
                    {item.learning_objective_code}:{" "}
                    {item.learning_objective_description}
                  </p>
                  <p className="text-xs text-slate-500">{item.quiz_title}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-center py-8">
                No hay datos de análisis de errores disponibles aún
              </p>
            )}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
