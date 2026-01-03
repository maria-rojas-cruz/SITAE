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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useSWRConfig } from "swr";

interface QuizCreateWizardWithSelectorProps {
  courseId: string;
  modules: any[];
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

interface OptionData {
  text: string;
  is_correct: boolean;
  feedback: string;
}

interface QuestionData {
  text: string;
  score: string;
  correct_explanation: string;
  topic_objective_id: string;
  options: OptionData[];
}

type Step = "selector" | "quiz-info" | "questions" | "summary";

export function QuizCreateWizardWithSelector({
  courseId,
  modules,
  onSuccess,
  trigger,
}: QuizCreateWizardWithSelectorProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("selector");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // Selector state
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");

  // Quiz info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Questions
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData>({
    text: "",
    score: "1",
    correct_explanation: "",
    topic_objective_id: "",
    options: [
      { text: "", is_correct: false, feedback: "" },
      { text: "", is_correct: false, feedback: "" },
    ],
  });

  const selectedModule = modules.find((m: any) => m.id === selectedModuleId);
  const topics = selectedModule?.topics || [];
  const selectedTopic = topics.find((t: any) => t.id === selectedTopicId);
  const topicObjectives = selectedTopic?.objectives || [];

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [
        ...currentQuestion.options,
        { text: "", is_correct: false, feedback: "" },
      ],
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

    if (field === "is_correct" && value === true) {
      updated.forEach((opt, i) => {
        if (i !== index) opt.is_correct = false;
      });
    }

    updated[index] = { ...updated[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, options: updated });
  };

  const saveCurrentQuestion = () => {
    const hasCorrectOption = currentQuestion.options.some(
      (opt) => opt.is_correct
    );
    if (!hasCorrectOption) {
      alert("Debes marcar al menos una opción como correcta");
      return false;
    }

    const validOptions = currentQuestion.options.filter(
      (opt) => opt.text.trim() !== ""
    );
    if (validOptions.length < 2) {
      alert("Debes tener al menos 2 opciones con texto");
      return false;
    }

    if (!currentQuestion.text.trim() || !currentQuestion.topic_objective_id) {
      alert("Completa el texto de la pregunta y selecciona un objetivo");
      return false;
    }

    setQuestions([...questions, { ...currentQuestion, options: validOptions }]);

    setCurrentQuestion({
      text: "",
      score: "1",
      correct_explanation: "",
      topic_objective_id: "",
      options: [
        { text: "", is_correct: false, feedback: "" },
        { text: "", is_correct: false, feedback: "" },
      ],
    });

    return true;
  };

  const handleNextFromSelector = () => {
    if (!selectedTopicId) {
      alert("Debes seleccionar un tema");
      return;
    }
    setStep("quiz-info");
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

    if (questions.length === 0) {
      alert("Debes agregar al menos una pregunta");
      return;
    }

    setStep("summary");
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      setLoadingStep("Creando quiz...");
      const quizResponse = await api.post<{ id: string }>(
        `api/topics/${selectedTopicId}/quizzes`,
        {
          title,
          description: description || null,
          time_minutes: timeMinutes ? parseInt(timeMinutes) : null,
          is_active: isActive,
        }
      );

      const quizId = quizResponse.id;
      const validQuestions = questions.filter(
        (obj) => obj.text.trim() !== ""
      );

      for (let i = 0; i < validQuestions.length; i++) {
        const question = validQuestions[i];
        setLoadingStep(
          `Creando pregunta ${i + 1} de ${validQuestions.length}...`
        );

        const questionResponse = await api.post<{ id: string }>(
          `api/quizzes/${quizId}/questions`,
          {
            text: question.text,
            score: parseFloat(question.score),
            correct_explanation: question.correct_explanation || null,
            topic_objective_id: question.topic_objective_id,
          }
        );

        const questionId = questionResponse.id;

        for (const option of question.options) {
          await api.post(`api/questions/${questionId}/options`, {
            text: option.text,
            is_correct: option.is_correct,
            feedback: option.feedback || null,
          });
        }
      }

      setLoadingStep("Finalizando...");

      // Limpiar cache y revalidar
      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);

      // Reset todo
      setTitle("");
      setDescription("");
      setTimeMinutes("");
      setIsActive(true);
      setQuestions([]);
      setCurrentQuestion({
        text: "",
        score: "1",
        correct_explanation: "",
        topic_objective_id: "",
        options: [
          { text: "", is_correct: false, feedback: "" },
          { text: "", is_correct: false, feedback: "" },
        ],
      });
      setSelectedModuleId("");
      setSelectedTopicId("");
      setStep("selector");
      setLoadingStep("");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      setLoadingStep("");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const getObjectiveName = (objectiveId: string) => {
    const objective = topicObjectives.find((o: any) => o.id === objectiveId);
    return objective
      ? objective.code
        ? `${objective.code}: ${objective.description}`
        : objective.description
      : "";
  };

  const isQuizInfoValid = title.trim();
  const validQuestions = questions.filter((obj) => obj.text.trim() !== "");
  const hasCorrectOption = currentQuestion.options.some(
    (opt) => opt.is_correct
  );
  const validOptions = currentQuestion.options.filter(
    (opt) => opt.text.trim() !== ""
  );
  const canGoToSummary = questions.length > 0 && !currentQuestion.text.trim();
  const isSummaryValid = questions.length > 0 && !isLoading;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Crear Quiz
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {step === "selector" && "Crear Quiz - Seleccionar Ubicación"}
            {step === "quiz-info" && "Crear Quiz - Paso 1: Información"}
            {step === "questions" && "Crear Quiz - Paso 2: Preguntas"}
            {step === "summary" && "Crear Quiz - Paso 3: Resumen"}
          </SheetTitle>
          <SheetDescription>
            {step === "selector" &&
              "Elige el módulo y tema donde se ubicará el quiz"}
            {step === "quiz-info" && "Define la información básica del quiz"}
            {step === "questions" && "Agrega las preguntas del quiz"}
            {step === "summary" && "Revisa y confirma antes de crear"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* STEP 0: Selector */}
          {step === "selector" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="module">Módulo *</Label>
                  <Select
                    value={selectedModuleId}
                    onValueChange={setSelectedModuleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {modules.map((module: any) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedModuleId && (
                  <div className="space-y-2">
                    <Label htmlFor="topic">Tema *</Label>
                    <Select
                      value={selectedTopicId}
                      onValueChange={setSelectedTopicId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map((topic: any) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleNextFromSelector}
                  disabled={!selectedTopicId}
                >
                  Siguiente: Información del Quiz
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

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
                    placeholder="Ej: Quiz: Conceptos Básicos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descripción del quiz"
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
                    placeholder="30"
                    min="1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="active"
                    checked={isActive}
                    onCheckedChange={(checked) =>
                      setIsActive(checked as boolean)
                    }
                  />
                  <Label htmlFor="active" className="text-sm cursor-pointer">
                    Quiz activo (visible para estudiantes)
                  </Label>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("selector")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={handleNextFromQuizInfo}
                  disabled={!isQuizInfoValid}
                >
                  Siguiente: Agregar Preguntas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Questions */}
          {step === "questions" && (
            <div className="space-y-6">
              {questions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Preguntas agregadas ({questions.length})
                  </Label>
                  <div className="space-y-2">
                    {questions.map((q, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            Pregunta {index + 1}: {q.text}
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

              {/* Pregunta actual */}
              <div className="space-y-6 p-6 border-2 border-dashed rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">
                    Nueva Pregunta{" "}
                    {questions.length > 0 && (
                      <Badge variant="outline" className="ml-2">
                        #{questions.length + 1}
                      </Badge>
                    )}
                  </Label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="text" className="text-sm font-medium">
                      Pregunta *
                    </Label>
                    <Textarea
                      id="text"
                      value={currentQuestion.text}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          text: e.target.value,
                        })
                      }
                      placeholder="Escribe la pregunta aquí..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="score" className="text-sm font-medium">
                        Puntos *
                      </Label>
                      <Input
                        id="score"
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={currentQuestion.score}
                        onChange={(e) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            score: e.target.value,
                          })
                        }
                        className="w-24"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="objective"
                        className="text-sm font-medium"
                      >
                        Vinculado a objetivo *
                      </Label>
                      <Select
                        value={currentQuestion.topic_objective_id}
                        onValueChange={(value) =>
                          setCurrentQuestion({
                            ...currentQuestion,
                            topic_objective_id: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona objetivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {topicObjectives.map((obj: any) => (
                            <SelectItem key={obj.id} value={obj.id}>
                              {obj.code ? `${obj.code}: ` : ""}
                              {obj.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="explanation"
                      className="text-sm font-medium"
                    >
                      Explicación (opcional)
                    </Label>
                    <Textarea
                      id="explanation"
                      value={currentQuestion.correct_explanation}
                      onChange={(e) =>
                        setCurrentQuestion({
                          ...currentQuestion,
                          correct_explanation: e.target.value,
                        })
                      }
                      placeholder="Explicación que se muestra tras responder"
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>

                {/* Opciones */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <Label className="text-base font-semibold">
                      Opciones de Respuesta
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg bg-background space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono">
                            {String.fromCharCode(65 + index)}
                          </Badge>
                          {currentQuestion.options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>

                        <Input
                          value={option.text}
                          onChange={(e) =>
                            updateOption(index, "text", e.target.value)
                          }
                          placeholder="Texto de la opción"
                          className="font-medium"
                        />

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`correct-${index}`}
                            checked={option.is_correct}
                            onCheckedChange={(checked) =>
                              updateOption(index, "is_correct", checked)
                            }
                          />
                          <Label
                            htmlFor={`correct-${index}`}
                            className="text-sm cursor-pointer font-medium"
                          >
                            ✓ Respuesta correcta
                          </Label>
                        </div>

                        <Input
                          value={option.feedback}
                          onChange={(e) =>
                            updateOption(index, "feedback", e.target.value)
                          }
                          placeholder="Retroalimentación opcional al seleccionar esta opción"
                          className="text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    💡 Solo puedes marcar una opción como correcta
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={saveCurrentQuestion}
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Guardar esta pregunta
                </Button>
              </div>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("quiz-info")}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={handleNextFromQuestions}
                  disabled={!canGoToSummary}
                >
                  Ver Resumen
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Summary */}
          {step === "summary" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded">
                  <h4 className="font-semibold mb-2">{title}</h4>
                  {description && (
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    {timeMinutes && <span>⏱️ {timeMinutes} min</span>}
                    <span>📝 {questions.length} preguntas</span>
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
                        </p>
                        <p className="text-xs text-muted-foreground mb-2">
                          Objetivo: {getObjectiveName(q.topic_objective_id)}
                        </p>
                        <div className="space-y-1">
                          {q.options.map((opt, optIndex) => (
                            <div
                              key={optIndex}
                              className="text-xs flex items-center gap-2"
                            >
                              <Badge
                                variant={opt.is_correct ? "default" : "outline"}
                                className="text-xs"
                              >
                                {String.fromCharCode(65 + optIndex)}
                              </Badge>
                              <span>{opt.text}</span>
                              {opt.is_correct && (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("questions")}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button onClick={handleSubmit} disabled={!isSummaryValid}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {loadingStep || "Guardando..."}
                    </span>
                  ) : (
                    "Crear Quiz Completo"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}