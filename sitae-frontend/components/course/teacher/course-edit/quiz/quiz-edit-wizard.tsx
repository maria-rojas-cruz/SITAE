// components/course/teacher/course-edit/quiz/quiz-edit-wizard.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, ArrowLeft, ArrowRight, CheckCircle, Plus } from "lucide-react";
import { QuizEditData } from "@/hooks/course/useCourseEditData";
import { api } from "@/lib/api-client";
import { useSWRConfig } from "swr"; 
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

interface QuizEditWizardProps {
  courseId: string;
  topicId: string;
  quiz: QuizEditData;
  topicObjectives: Array<{ id: string; description: string; code?: string }>;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

interface OptionData {
  id?: string;
  text: string;
  is_correct: boolean;
  feedback: string;
  isNew?: boolean;
}

interface QuestionData {
  id?: string;
  text: string;
  score: string;
  correct_explanation: string;
  topic_objective_id: string;
  options: OptionData[];
  isNew?: boolean;
}

interface ExistingQuestion {
  id: string;
  text: string;
  score: number;
  correct_explanation?: string;
  topic_objective_id: string;
}

interface ExistingOption {
  id: string;
  text: string;
  is_correct: boolean;
  feedback?: string;
}

type Step = "quiz-info" | "questions" | "summary";

export function QuizEditWizard({ 
   courseId,
  topicId,
  quiz, 
  topicObjectives,
  onSuccess, 
  trigger 
}: QuizEditWizardProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("quiz-info");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);

  // Quiz info
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description || "");
  const [timeMinutes, setTimeMinutes] = useState(quiz.time_minutes?.toString() || "");
  const [isActive, setIsActive] = useState(quiz.is_active);

  // Questions
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData>({
    text: "",
    score: "1",
    correct_explanation: "",
    topic_objective_id: "",
    options: [
      { text: "", is_correct: false, feedback: "", isNew: true },
      { text: "", is_correct: false, feedback: "", isNew: true },
    ],
    isNew: true,
  });

  // Fetch existing questions
  const { data: questionsData } = useSWR<{ questions: ExistingQuestion[]; total: number }>(
    open ? `api/quizzes/${quiz.id}/questions` : null
  );

  // Fetch options for each question when opening
  useEffect(() => {
    if (open && questionsData?.questions) {
      const loadQuestionsWithOptions = async () => {
        const questionsWithOptions: QuestionData[] = [];
        
        for (const q of questionsData.questions) {
          const optionsResponse = await api.get<{ options: ExistingOption[] }>(
            `api/questions/${q.id}/options`
          );
          
          questionsWithOptions.push({
            id: q.id,
            text: q.text,
            score: q.score.toString(),
            correct_explanation: q.correct_explanation || "",
            topic_objective_id: q.topic_objective_id,
            options: optionsResponse.options.map(opt => ({
              id: opt.id,
              text: opt.text,
              is_correct: opt.is_correct,
              feedback: opt.feedback || "",
              isNew: false,
            })),
            isNew: false,
          });
        }
        
        setQuestions(questionsWithOptions);
      };
      
      loadQuestionsWithOptions();
    }
  }, [open, questionsData, quiz.id]);

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { text: "", is_correct: false, feedback: "", isNew: true }],
    });
  };

  const removeOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      setCurrentQuestion({
        ...currentQuestion,
        options: currentQuestion.options.filter((_, i) => i !== index),
      });
    }
  };

  const updateOption = (index: number, field: keyof OptionData, value: any) => {
    const updated = [...currentQuestion.options];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, options: updated });
  };

  const saveCurrentQuestion = () => {
    const hasCorrectOption = currentQuestion.options.some(opt => opt.is_correct);
    if (!hasCorrectOption) {
      alert("Debes marcar al menos una opción como correcta");
      return false;
    }

    const validOptions = currentQuestion.options.filter(opt => opt.text.trim() !== "");
    if (validOptions.length < 2) {
      alert("Debes tener al menos 2 opciones con texto");
      return false;
    }

    if (!currentQuestion.text.trim() || !currentQuestion.topic_objective_id) {
      alert("Completa el texto de la pregunta y selecciona un objetivo");
      return false;
    }

    setQuestions([...questions, { ...currentQuestion, options: validOptions }]);
    
    // Reset
    setCurrentQuestion({
      text: "",
      score: "1",
      correct_explanation: "",
      topic_objective_id: "",
      options: [
        { text: "", is_correct: false, feedback: "", isNew: true },
        { text: "", is_correct: false, feedback: "", isNew: true },
      ],
      isNew: true,
    });

    return true;
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await api.delete(`api/quizzes/${quiz.id}/questions/${questionId}`);
      setQuestions(questions.filter(q => q.id !== questionId));
      setDeleteQuestionId(null);
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const removeQuestion = (index: number) => {
    const question = questions[index];
    if (question.id && !question.isNew) {
      setDeleteQuestionId(question.id);
    } else {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleNextFromQuizInfo = () => {
    if (!title.trim()) {
      alert("El título del quiz es obligatorio");
      return;
    }
    setStep("questions");
  };

  const handleNextFromQuestions = () => {
    if (currentQuestion.text.trim()) {
      alert("Guarda la pregunta actual antes de continuar");
      return;
    }
    
    setStep("summary");
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // 1. Actualizar quiz
      setLoadingStep("Actualizando quiz...");
      await api.put(`api/topics/${topicId}/quizzes/${quiz.id}`, {
        title,
        description: description || null,
        time_minutes: timeMinutes ? parseInt(timeMinutes) : null,
        is_active: isActive,
      });

      // 2. Procesar preguntas
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        setLoadingStep(`Procesando pregunta ${i + 1} de ${questions.length}...`);

        let questionId = question.id;

        if (question.isNew) {
          // Crear nueva pregunta
          const response = await api.post<{ id: string }>(
            `api/quizzes/${quiz.id}/questions`,
            {
              text: question.text,
              score: parseFloat(question.score),
              correct_explanation: question.correct_explanation || null,
              topic_objective_id: question.topic_objective_id,
            }
          );
          questionId = response.id;
        } else if (questionId) {
          // Actualizar pregunta existente
          await api.put(`api/quizzes/${quiz.id}/questions/${questionId}`, {
            text: question.text,
            score: parseFloat(question.score),
            correct_explanation: question.correct_explanation || null,
            topic_objective_id: question.topic_objective_id,
          });
        }

        // 3. Procesar opciones
        if (questionId) {
          const existingOptions = question.options.filter(opt => opt.id && !opt.isNew);
          const newOptions = question.options.filter(opt => opt.isNew);

          // Actualizar opciones existentes
          for (const option of existingOptions) {
            if (option.id) {
              await api.put(`api/questions/${questionId}/options/${option.id}`, {
                text: option.text,
                is_correct: option.is_correct,
                feedback: option.feedback || null,
              });
            }
          }

          // Crear opciones nuevas
          for (const option of newOptions) {
            await api.post(`api/questions/${questionId}/options`, {
              text: option.text,
              is_correct: option.is_correct,
              feedback: option.feedback || null,
            });
          }
        }
      }

      setLoadingStep("Finalizando...");
      api.clearCache(`courses/${courseId}`);        
      await mutate(`/api/courses/${courseId}/edit-data`); 
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating quiz:", error);
      setLoadingStep("");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getObjectiveName = (objectiveId: string) => {
    const objective = topicObjectives.find(o => o.id === objectiveId);
    return objective ? (objective.code ? `${objective.code}: ${objective.description}` : objective.description) : "";
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>

        <SheetContent className="sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {step === "quiz-info" && "Editar Quiz - Paso 1: Información"}
              {step === "questions" && "Editar Quiz - Paso 2: Preguntas"}
              {step === "summary" && "Editar Quiz - Paso 3: Resumen"}
            </SheetTitle>
            <SheetDescription>
              {step === "quiz-info" && "Modifica la información del quiz"}
              {step === "questions" && "Edita o agrega preguntas"}
              {step === "summary" && "Revisa los cambios antes de guardar"}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {/* STEP 1: Quiz Info */}
            {step === "quiz-info" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del Quiz *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Tiempo límite (minutos)</Label>
                    <Input
                      id="time"
                      type="number"
                      value={timeMinutes}
                      onChange={(e) => setTimeMinutes(e.target.value)}
                      min="1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={isActive}
                      onCheckedChange={(checked) => setIsActive(checked as boolean)}
                    />
                    <Label htmlFor="active" className="text-sm cursor-pointer">
                      Quiz activo (visible para estudiantes)
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleNextFromQuizInfo}>
                    Siguiente: Preguntas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Questions (mismo contenido que create) */}
            {step === "questions" && (
              <div className="space-y-6">
                {questions.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Preguntas ({questions.length})
                    </Label>
                    <div className="space-y-2">
                      {questions.map((q, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded bg-muted/50">
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Pregunta {index + 1}: {q.text}
                              {q.isNew && <Badge variant="secondary" className="ml-2 text-xs">Nuevo</Badge>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {q.options.length} opciones • {q.score} pts
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nueva pregunta (igual que create) */}
                <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
                  <Label className="text-base font-semibold">
                    Nueva Pregunta {questions.length > 0 && `(${questions.length + 1})`}
                  </Label>

                  <div className="space-y-2">
                    <Label htmlFor="text">Pregunta *</Label>
                    <Textarea
                      id="text"
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                      placeholder="Escribe la pregunta aquí..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="score">Puntos *</Label>
                      <Input
                        id="score"
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={currentQuestion.score}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, score: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="objective">Objetivo del Tema *</Label>
                      <Select 
                        value={currentQuestion.topic_objective_id} 
                        onValueChange={(value) => setCurrentQuestion({ ...currentQuestion, topic_objective_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          {topicObjectives.map((obj) => (
                            <SelectItem key={obj.id} value={obj.id}>
                              {obj.code ? `${obj.code}: ` : ""}{obj.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="explanation">Explicación (opcional)</Label>
                    <Textarea
                      id="explanation"
                      value={currentQuestion.correct_explanation}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correct_explanation: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Opciones de Respuesta</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addOption}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Opción
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {currentQuestion.options.map((option, index) => (
                        <div key={index} className="p-3 border rounded space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">
                              Opción {String.fromCharCode(65 + index)}
                            </Label>
                            {currentQuestion.options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOption(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>

                          <Input
                            value={option.text}
                            onChange={(e) => updateOption(index, "text", e.target.value)}
                            placeholder="Texto de la opción"
                          />

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`correct-${index}`}
                              checked={option.is_correct}
                              onCheckedChange={(checked) =>
                                updateOption(index, "is_correct", checked)
                              }
                            />
                            <Label htmlFor={`correct-${index}`} className="text-xs cursor-pointer">
                              Respuesta correcta
                            </Label>
                          </div>

                          <Input
                            value={option.feedback}
                            onChange={(e) => updateOption(index, "feedback", e.target.value)}
                            placeholder="Retroalimentación (opcional)"
                            className="text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={saveCurrentQuestion}
                    className="w-full"
                    variant="secondary"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Guardar Pregunta
                  </Button>
                </div>

                <div className="flex justify-between gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setStep("quiz-info")}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Atrás
                  </Button>
                  <Button onClick={handleNextFromQuestions}>
                    Ver Resumen
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Summary (igual que create) */}
            {step === "summary" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded">
                    <h4 className="font-semibold mb-2">{title}</h4>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    <div className="flex gap-4 mt-2 text-sm">
                      {timeMinutes && <span>{timeMinutes} min</span>}
                      <span>{questions.length} preguntas</span>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Preguntas:</h4>
                    <div className="space-y-3">
                      {questions.map((q, index) => (
                        <div key={index} className="p-3 border rounded">
                          <p className="font-medium text-sm mb-2">
                            {index + 1}. {q.text} ({q.score} pts)
                            {q.isNew && <Badge variant="secondary" className="ml-2 text-xs">Nuevo</Badge>}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            Objetivo: {getObjectiveName(q.topic_objective_id)}
                          </p>
                          <div className="space-y-1">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="text-xs flex items-center gap-2">
                                <Badge variant={opt.is_correct ? "default" : "outline"} className="text-xs">
                                  {String.fromCharCode(65 + optIndex)}
                                </Badge>
                                <span>{opt.text}</span>
                                {opt.is_correct && <CheckCircle className="h-3 w-3 text-green-600" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setStep("questions")} disabled={isLoading}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Atrás
                  </Button>
                  <Button onClick={handleSubmit} disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {loadingStep}
                      </span>
                    ) : (
                      "Guardar Cambios"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteQuestionId} onOpenChange={() => setDeleteQuestionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pregunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la pregunta y todas sus opciones permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteQuestionId && handleDeleteQuestion(deleteQuestionId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}