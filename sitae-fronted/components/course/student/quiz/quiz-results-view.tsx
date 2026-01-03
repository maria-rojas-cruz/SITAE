"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  XCircle,
  ArrowLeft,
  BookOpen,
  Play,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface ResultsViewProps {
  attemptId: string;
  quizId: string;
  courseId?: string;
  onBackToQuiz?: () => void;
}

export default function QuizResultsView({
  attemptId,
  quizId,
  courseId,
  onBackToQuiz,
}: ResultsViewProps) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);

  // Cargar datos cuando el componente se monta
  useEffect(() => {
    loadData();
  }, [attemptId, quizId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar resultados del intento y datos del quiz en paralelo
      const [resultsData, quizData] = await Promise.all([
        api.get(`api/attempts/${attemptId}/results`),
        api.get(`api/quizzes/${quizId}`),
      ]);

      setResults(resultsData);
      setQuiz(quizData);
    } catch (error) {
      console.error("Error loading results:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!results || !quiz) {
    return (
      <div className="text-center py-12 text-red-600">
        Error al cargar resultados
      </div>
    );
  }

  const { attempt, questions } = results;

  const correctCount = questions.filter((q: any) => q.correct).length;
  const totalQuestions = questions.length;
  const incorrectCount = totalQuestions - correctCount;

  const getScoreColor = (percent: number) => {
    if (percent >= 80) return "text-green-600";
    if (percent >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (percent: number) => {
    if (percent >= 80)
      return { text: "Excelente", className: "bg-green-100 text-green-800" };
    if (percent >= 60)
      return { text: "Bueno", className: "bg-yellow-100 text-yellow-800" };
    return { text: "Necesita mejorar", className: "bg-red-100 text-red-800" };
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "video":
        return <Play className="h-4 w-4" />;
      case "lectura":
      case "reading":
        return <FileText className="h-4 w-4" />;
      case "ejercicio":
      case "exercise":
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const scoreBadge = getScoreBadge(attempt.percent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        {(courseId || onBackToQuiz) && (
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={onBackToQuiz}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
        )}

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Resultados del Quiz
        </h1>
        <p className="text-muted-foreground">{quiz.title}</p>
      </div>

      {/* Results Summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Resumen de Resultados</CardTitle>
            <Badge className={scoreBadge.className}>{scoreBadge.text}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div
              className={`text-4xl font-bold ${getScoreColor(
                attempt.percent
              )} mb-2`}
            >
              {attempt.percent.toFixed(1)}%
            </div>
            <p className="text-muted-foreground">
              {correctCount} de {totalQuestions} respuestas correctas
            </p>
          </div>

          <Progress value={attempt.percent} className="h-3" />

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-semibold text-green-600">
                {correctCount}
              </div>
              <div className="text-sm text-muted-foreground">Correctas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">
                {incorrectCount}
              </div>
              <div className="text-sm text-muted-foreground">Incorrectas</div>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <div className="text-lg font-medium text-muted-foreground">
              Puntaje:{" "}
              <span className="text-foreground font-bold">
                {attempt.total_score.toFixed(1)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Review */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Revisión de Preguntas</h2>

        {questions.map((q: any, index: number) => (
          <Card
            key={q.question_id}
            className={`border-l-4 ${
              q.correct ? "border-l-green-500" : "border-l-red-500"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {q.correct ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  Pregunta {index + 1}
                </CardTitle>
                <Badge variant={q.correct ? "secondary" : "destructive"}>
                  {q.correct ? "Correcta" : "Incorrecta"}
                </Badge>
              </div>
              <p className="text-base mt-2">{q.text}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {q.selected_option && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm text-muted-foreground">
                      Tu respuesta:
                    </span>
                    <span
                      className={`font-medium text-right flex-1 ${
                        q.correct ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {q.selected_option.text}
                    </span>
                  </div>
                )}

                {!q.correct && q.correct_option && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm text-muted-foreground">
                      Respuesta correcta:
                    </span>
                    <span className="font-medium text-green-600 text-right flex-1">
                      {q.correct_option.text}
                    </span>
                  </div>
                )}

                {!q.selected_option && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-sm text-muted-foreground">
                      Tu respuesta:
                    </span>
                    <span className="font-medium text-red-600 text-right flex-1">
                      No respondiste
                    </span>
                  </div>
                )}
              </div>

              {q.correct_explanation && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <strong>Explicación Docente:</strong>{" "}
                    {q.correct_explanation}
                  </p>
                </div>
              )}

              {q.comment && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <strong>Explicación Sistema:</strong> {q.comment}
                  </p>
                </div>
              )}

              {q.recommendations && q.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    📚 Recursos recomendados para repasar:
                  </h4>
                  <div className="space-y-2">
                    {q.recommendations.map((rec: any) => (
                      <div
                        key={rec.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-shrink-0">
                            {getResourceIcon(rec.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">
                                {rec.title}
                              </span>
                              {rec.duration_min && (
                                <span className="text-xs text-muted-foreground">
                                  ({rec.duration_min} min)
                                </span>
                              )}
                              {rec.mandatory && (
                                <Badge variant="outline" className="text-xs">
                                  Obligatorio
                                </Badge>
                              )}
                            </div>
                            {rec.why_text && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {rec.why_text}
                              </p>
                            )}
                          </div>
                        </div>
                        <a
                          href={rec.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="ml-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Revisar
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
