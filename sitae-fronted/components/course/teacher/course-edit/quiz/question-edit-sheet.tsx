// components/course/teacher/course-edit/quiz/question-create-sheet.tsx
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

interface QuestionEditSheetProps {
  courseId: string;
  quizId: string;
  topicObjectives: Array<{ id: string; description: string; code?: string }>;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

interface OptionData {
  text: string;
  is_correct: boolean;
  feedback: string;
}

export function QuestionEditSheet({ 
  quizId, 
  topicObjectives,
  onSuccess, 
  trigger 
}: QuestionEditSheetProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [text, setText] = useState("");
  const [score, setScore] = useState("1");
  const [correctExplanation, setCorrectExplanation] = useState("");
  const [topicObjectiveId, setTopicObjectiveId] = useState("");
  const [options, setOptions] = useState<OptionData[]>([
    { text: "", is_correct: false, feedback: "" },
    { text: "", is_correct: false, feedback: "" },
  ]);

  const addOption = () => {
    setOptions([...options, { text: "", is_correct: false, feedback: "" }]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, field: keyof OptionData, value: any) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    const hasCorrectOption = options.some(opt => opt.is_correct);
    if (!hasCorrectOption) {
      alert("Debes marcar al menos una opción como correcta");
      return;
    }

    const validOptions = options.filter(opt => opt.text.trim() !== "");
    if (validOptions.length < 2) {
      alert("Debes tener al menos 2 opciones con texto");
      return;
    }

    setIsLoading(true);

    try {
      setLoadingStep("Creando pregunta...");
      const questionResponse = await api.post<{ id: string }>(
        `api/quizzes/${quizId}/questions`,
        {
          text,
          score: parseFloat(score),
          correct_explanation: correctExplanation || null,
          topic_objective_id: topicObjectiveId,
        }
      );

      const questionId = questionResponse.id;

      setLoadingStep("Agregando opciones...");
      for (const option of validOptions) {
        await api.post(`api/questions/${questionId}/options`, {
          text: option.text,
          is_correct: option.is_correct,
          feedback: option.feedback || null,
        });
      }

      // Reset
      setText("");
      setScore("1");
      setCorrectExplanation("");
      setTopicObjectiveId("");
      setOptions([
        { text: "", is_correct: false, feedback: "" },
        { text: "", is_correct: false, feedback: "" },
      ]);
      setLoadingStep("");
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating question:", error);
      setLoadingStep("");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Pregunta
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crear Nueva Pregunta</SheetTitle>
          <SheetDescription>Agrega una pregunta de opción múltiple al quiz</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Pregunta */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text">Pregunta *</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escribe la pregunta aquí..."
                rows={3}
                required
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
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objective">Objetivo del Tema *</Label>
                <Select value={topicObjectiveId} onValueChange={setTopicObjectiveId} required>
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
                value={correctExplanation}
                onChange={(e) => setCorrectExplanation(e.target.value)}
                placeholder="Explicación que se muestra al responder correctamente"
                rows={2}
              />
            </div>
          </div>

          {/* Opciones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Opciones de Respuesta</Label>
              <Button type="button" variant="outline" size="sm" onClick={addOption}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Opción
              </Button>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Opción {String.fromCharCode(65 + index)}
                    </Label>
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Input
                      value={option.text}
                      onChange={(e) => updateOption(index, "text", e.target.value)}
                      placeholder="Texto de la opción"
                      required
                    />

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`correct-${index}`}
                        checked={option.is_correct}
                        onCheckedChange={(checked) =>
                          updateOption(index, "is_correct", checked)
                        }
                      />
                      <Label htmlFor={`correct-${index}`} className="text-sm cursor-pointer">
                        Respuesta correcta
                      </Label>
                    </div>

                    <Input
                      value={option.feedback}
                      onChange={(e) => updateOption(index, "feedback", e.target.value)}
                      placeholder="Retroalimentación (opcional)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !text.trim() || !topicObjectiveId}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingStep}
                </span>
              ) : (
                "Crear Pregunta"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}