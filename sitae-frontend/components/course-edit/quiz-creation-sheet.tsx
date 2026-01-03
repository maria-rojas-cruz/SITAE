// components/course-edit/quiz-creation-sheet.tsx
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { Plus, Trash2, X } from "lucide-react";
import { TopicObjectiveInfo } from "@/hooks/course/useCourseEditData";

interface QuizQuestion {
  text: string;
  topic_objective_id: string;
  score: number;
  correct_explanation: string;
  options: QuizOption[];
}

interface QuizOption {
  text: string;
  is_correct: boolean;
  feedback: string;
}

interface QuizCreationSheetProps {
  topicId: string;
  topicName: string;
  availableObjectives: TopicObjectiveInfo[];
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function QuizCreationSheet({
  topicId,
  topicName,
  availableObjectives,
  onSuccess,
  trigger,
}: QuizCreationSheetProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Datos del quiz
  const [quizData, setQuizData] = useState({
    title: "",
    description: "",
    time_minutes: "",
    attempt_max: "",
    due_date: "",
    is_active: false,
  });

  // Preguntas del quiz
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      text: "",
      topic_objective_id: "",
      score: 1,
      correct_explanation: "",
      options: [
        { text: "", is_correct: false, feedback: "" },
        { text: "", is_correct: false, feedback: "" },
      ],
    },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: "",
        topic_objective_id: "",
        score: 1,
        correct_explanation: "",
        options: [
          { text: "", is_correct: false, feedback: "" },
          { text: "", is_correct: false, feedback: "" },
        ],
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push({
      text: "",
      is_correct: false,
      feedback: "",
    });
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options = updated[questionIndex].options.filter(
      (_, i) => i !== optionIndex
    );
    setQuestions(updated);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: keyof QuizOption,
    value: any
  ) => {
    const updated = [...questions];
    
    // Si marca como correcta, desmarcar las demás (solo una correcta)
    if (field === "is_correct" && value === true) {
      updated[questionIndex].options.forEach((opt, i) => {
        opt.is_correct = i === optionIndex;
      });
    } else {
      updated[questionIndex].options[optionIndex] = {
        ...updated[questionIndex].options[optionIndex],
        [field]: value,
      };
    }
    
    setQuestions(updated);
  };

  const validateForm = (): boolean => {
    if (!quizData.title.trim()) {
      toast({
        title: "Error",
        description: "El título del quiz es obligatorio",
        variant: "destructive",
      });
      return false;
    }

    if (questions.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos una pregunta",
        variant: "destructive",
      });
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      if (!q.text.trim()) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} no tiene texto`,
          variant: "destructive",
        });
        return false;
      }

      if (!q.topic_objective_id) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} no tiene objetivo asignado`,
          variant: "destructive",
        });
        return false;
      }

      if (q.options.length < 2) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} necesita al menos 2 opciones`,
          variant: "destructive",
        });
        return false;
      }

      const correctCount = q.options.filter(opt => opt.is_correct).length;
      if (correctCount === 0) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} debe tener una respuesta correcta`,
          variant: "destructive",
        });
        return false;
      }

      if (q.options.some(opt => !opt.text.trim())) {
        toast({
          title: "Error",
          description: `La pregunta ${i + 1} tiene opciones vacías`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 1. Crear el quiz
      const quiz = await api.post(`api/topics/${topicId}/quizzes`, {
        title: quizData.title,
        description: quizData.description || null,
        time_minutes: quizData.time_minutes ? parseInt(quizData.time_minutes) : null,
        attempt_max: quizData.attempt_max ? parseInt(quizData.attempt_max) : null,
        due_date: quizData.due_date || null,
        is_active: quizData.is_active,
      });

      // 2. Crear cada pregunta
      for (const question of questions) {
        const createdQuestion = await api.post(
          `api/quizzes/${quiz.id}/questions`,
          {
            text: question.text,
            score: question.score,
            correct_explanation: question.correct_explanation || null,
            topic_objective_id: question.topic_objective_id,
          }
        );

        // 3. Crear las opciones de cada pregunta
        for (const option of question.options) {
          await api.post(
            `api/questions/${createdQuestion.id}/options`,
            {
              text: option.text,
              is_correct: option.is_correct,
              feedback: option.feedback || null,
            }
          );
        }
      }

      toast({
        title: "¡Quiz creado!",
        description: quizData.is_active
          ? "El quiz ha sido publicado y está visible para los estudiantes"
          : "El quiz se guardó como borrador",
      });

      setOpen(false);
      onSuccess();
      
      // Reset form
      setQuizData({
        title: "",
        description: "",
        time_minutes: "",
        attempt_max: "",
        due_date: "",
        is_active: false,
      });
      setQuestions([
        {
          text: "",
          topic_objective_id: "",
          score: 1,
          correct_explanation: "",
          options: [
            { text: "", is_correct: false, feedback: "" },
            { text: "", is_correct: false, feedback: "" },
          ],
        },
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el quiz",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Crear Quiz
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crear Evaluación</SheetTitle>
          <SheetDescription>
            Tema: <span className="font-medium">{topicName}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Datos del Quiz */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información del Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={quizData.title}
                  onChange={(e) => setQuizData({ ...quizData, title: e.target.value })}
                  placeholder="Quiz: Conceptos Básicos"
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={quizData.description}
                  onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                  rows={2}
                  placeholder="Breve descripción del quiz..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Tiempo (min)</Label>
                  <Input
                    type="number"
                    value={quizData.time_minutes}
                    onChange={(e) => setQuizData({ ...quizData, time_minutes: e.target.value })}
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label>Intentos máx.</Label>
                  <Input
                    type="number"
                    value={quizData.attempt_max}
                    onChange={(e) => setQuizData({ ...quizData, attempt_max: e.target.value })}
                    placeholder="3"
                  />
                </div>

                <div>
                  <Label>Fecha límite</Label>
                  <Input
                    type="date"
                    value={quizData.due_date}
                    onChange={(e) => setQuizData({ ...quizData, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 border-t">
                <Label>Publicar ahora (visible para estudiantes)</Label>
                <Switch
                  checked={quizData.is_active}
                  onCheckedChange={(checked) => setQuizData({ ...quizData, is_active: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preguntas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Preguntas ({questions.length})
              </Label>
              <Button onClick={addQuestion} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Pregunta
              </Button>
            </div>

            {questions.map((question, qIndex) => (
              <Card key={qIndex} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">P{qIndex + 1}</Badge>
                      <span className="text-sm font-medium">
                        Pregunta {qIndex + 1}
                      </span>
                    </div>
                    {questions.length > 1 && (
                      <Button
                        onClick={() => removeQuestion(qIndex)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">Texto de la pregunta *</Label>
                    <Textarea
                      value={question.text}
                      onChange={(e) => updateQuestion(qIndex, "text", e.target.value)}
                      rows={2}
                      placeholder="Escribe la pregunta aquí..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Objetivo relacionado *</Label>
                      <Select
                        value={question.topic_objective_id}
                        onValueChange={(val) =>
                          updateQuestion(qIndex, "topic_objective_id", val)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableObjectives.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">
                              No hay objetivos de tema
                            </div>
                          ) : (
                            availableObjectives.map((obj) => (
                              <SelectItem key={obj.id} value={obj.id} className="text-sm">
                                {obj.code ? `${obj.code}: ` : ""}
                                {obj.description}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Puntaje</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={question.score}
                        onChange={(e) =>
                          updateQuestion(qIndex, "score", parseFloat(e.target.value) || 1)
                        }
                        className="h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Explicación (opcional)</Label>
                    <Textarea
                      value={question.correct_explanation}
                      onChange={(e) =>
                        updateQuestion(qIndex, "correct_explanation", e.target.value)
                      }
                      rows={2}
                      placeholder="Explica por qué esta es la respuesta correcta..."
                      className="text-sm"
                    />
                  </div>

                  {/* Opciones */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Opciones de respuesta *
                      </Label>
                      <Button
                        onClick={() => addOption(qIndex)}
                        size="sm"
                        variant="ghost"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Opción
                      </Button>
                    </div>

                    {question.options.map((option, oIndex) => (
                      <div
                        key={oIndex}
                        className={`border rounded-lg p-2 ${
                          option.is_correct ? "bg-green-50 border-green-300" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-1">
                            {String.fromCharCode(65 + oIndex)}
                          </Badge>
                          <div className="flex-1 space-y-2">
                            <Input
                              value={option.text}
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, "text", e.target.value)
                              }
                              placeholder={`Opción ${String.fromCharCode(65 + oIndex)}`}
                              className="h-8 text-sm"
                            />
                            <Input
                              value={option.feedback}
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, "feedback", e.target.value)
                              }
                              placeholder="Retroalimentación (opcional)"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="flex flex-col gap-1 items-center">
                            <Switch
                              checked={option.is_correct}
                              onCheckedChange={(checked) =>
                                updateOption(qIndex, oIndex, "is_correct", checked)
                              }
                            />
                            <Label className="text-xs">Correcta</Label>
                            {question.options.length > 2 && (
                              <Button
                                onClick={() => removeOption(qIndex, oIndex)}
                                size="sm"
                                variant="ghost"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Botones finales */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? "Guardando..."
                : quizData.is_active
                ? "Publicar Quiz"
                : "Guardar Borrador"}
            </Button>
            <Button
              onClick={() => setOpen(false)}
              variant="outline"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}