// components/course/teacher/course-edit/quiz/quiz-questions-manager.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Edit, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { QuestionCreateSheet } from "./question-create-sheet";
import { QuestionEditSheet } from "./question-edit-sheet";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TopicObjectiveInfo {
  id: string;
  description: string;
  code?: string;
}

interface QuizQuestionsManagerProps {
  quizId: string;
  topicObjectives: TopicObjectiveInfo[];
}

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
  feedback?: string;
}

interface Question {
  id: string;
  text: string;
  score: number;
  correct_explanation?: string;
  topic_objective_id: string;
  options?: Option[];
}

export function QuizQuestionsManager({ quizId, topicObjectives }: QuizQuestionsManagerProps) {
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: questionsData, error, mutate } = useSWR<{ questions: Question[]; total: number }>(
    `api/quizzes/${quizId}/questions`
  );

  const questions = questionsData?.questions || [];
  const isLoading = !questionsData && !error;

  const handleDeleteQuestion = async (questionId: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`api/quizzes/${quizId}/questions/${questionId}`);
      toast.success("Pregunta eliminada");
      mutate();
      setDeleteQuestionId(null);
    } catch (error) {
      toast.error("Error al eliminar pregunta");
    } finally {
      setIsDeleting(false);
    }
  };

  const getObjectiveName = (objectiveId: string) => {
    const objective = topicObjectives.find(o => o.id === objectiveId);
    return objective ? (objective.code ? `${objective.code}: ${objective.description}` : objective.description) : "Sin objetivo";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Preguntas del Quiz</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {questions.length} pregunta{questions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <QuestionCreateSheet
            quizId={quizId}
            topicObjectives={topicObjectives}
            onSuccess={() => {
              toast.success("Pregunta creada");
              mutate();
            }}
          />
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay preguntas creadas aún.</p>
              <p className="text-sm mt-1">Agrega la primera pregunta para comenzar.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-3">
              {questions.map((question, index) => (
                <AccordionItem
                  key={question.id}
                  value={`question-${question.id}`}
                  className="border rounded-lg"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-start justify-between w-full mr-4">
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">Pregunta {index + 1}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.score} pts
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{question.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Objetivo: {getObjectiveName(question.topic_objective_id)}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {/* Opciones */}
                      <div>
                        <h5 className="text-sm font-medium mb-2">Opciones de respuesta:</h5>
                        <div className="space-y-2">
                          {question.options?.map((option, optIndex) => (
                            <div
                              key={option.id}
                              className={`flex items-start gap-2 p-2 border rounded ${
                                option.is_correct ? "bg-green-50 border-green-200" : ""
                              }`}
                            >
                              {option.is_correct ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-sm">
                                  <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>{" "}
                                  {option.text}
                                </p>
                                {option.feedback && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Retroalimentación: {option.feedback}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Explicación correcta */}
                      {question.correct_explanation && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <h5 className="text-sm font-medium mb-1">Explicación:</h5>
                          <p className="text-sm text-muted-foreground">
                            {question.correct_explanation}
                          </p>
                        </div>
                      )}

                      {/* Acciones 
                      <div className="flex gap-2 pt-2 border-t">
                        <QuestionEditSheet
                          quizId={quizId}
                          question={question}
                          topicObjectives={topicObjectives}
                          onSuccess={() => {
                            toast.success("Pregunta actualizada");
                            mutate();
                          }}
                          trigger={
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-2" />
                              Editar pregunta
                            </Button>
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteQuestionId(question.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
*/}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La pregunta y todas sus opciones serán eliminadas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuestionId && handleDeleteQuestion(deleteQuestionId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}