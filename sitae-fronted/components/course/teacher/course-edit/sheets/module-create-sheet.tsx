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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { LearningOutcomeInfo } from "@/hooks/course/useCourseEditData";
import { moduleService } from "../services/module-service";
import { createObjectiveWithLinks } from "../services/module-helpers";
import { api } from "@/lib/api-client";
import { useSWRConfig } from "swr";
interface ModuleCreateSheetProps {
  courseId: string;
  learningOutcomes: LearningOutcomeInfo[];
  nextOrder: number;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

interface ObjectiveData {
  description: string;
  code: string;
  linked_learning_outcome_ids: string[];
}

export function ModuleCreateSheet({
  courseId,
  learningOutcomes,
  onSuccess,
  nextOrder,
  trigger,
}: ModuleCreateSheetProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState<ObjectiveData[]>([
    { description: "", code: "", linked_learning_outcome_ids: [] },
  ]);
  const [loadingStep, setLoadingStep] = useState<string>("");

  const addObjective = () => {
    setObjectives([
      ...objectives,
      { description: "", code: "", linked_learning_outcome_ids: [] },
    ]);
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (
    index: number,
    field: keyof ObjectiveData,
    value: any
  ) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], [field]: value };
    setObjectives(updated);
  };

  const toggleLearningOutcome = (objectiveIndex: number, loId: string) => {
    const updated = [...objectives];
    const current = updated[objectiveIndex].linked_learning_outcome_ids;

    if (current.includes(loId)) {
      updated[objectiveIndex].linked_learning_outcome_ids = current.filter(
        (id) => id !== loId
      );
    } else {
      updated[objectiveIndex].linked_learning_outcome_ids = [...current, loId];
    }

    setObjectives(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Crear módulo
      setLoadingStep("Creando módulo...");
      const moduleResponse = await moduleService.createModule(courseId, {
        title,
        description: description || null,
        order: nextOrder,
      });

      const moduleId = moduleResponse.id;
      const validObjectives = objectives.filter(
        (obj) => obj.description.trim() !== ""
      );

      // 2. Crear objetivos con sus vínculos
      for (let i = 0; i < validObjectives.length; i++) {
        const objective = validObjectives[i];

        setLoadingStep(
          `Creando objetivo ${i + 1} de ${validObjectives.length}...`
        );

        await createObjectiveWithLinks(
          moduleId,
          {
            description: objective.description,
            code: objective.code || null,
            order: i + 1,
          },
          objective.linked_learning_outcome_ids
        );
      }

      // 3. Limpiar y cerrar
      setLoadingStep("Finalizando...");
      setTitle("");
      setDescription("");
      setObjectives([
        { description: "", code: "", linked_learning_outcome_ids: [] },
      ]);
      setLoadingStep("");
      setOpen(false);
      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);

      onSuccess();
    } catch (error: any) {
      console.error("Error creating module:", error);
      setLoadingStep("");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Validaciones de formulario
  const validObjectives = objectives.filter(
    (obj) => obj.description.trim() !== ""
  );
  const allObjectivesLinked = validObjectives.every(
    (obj) => obj.linked_learning_outcome_ids.length > 0
  );
  const isFormValid =
    title.trim() && validObjectives.length > 0 && allObjectivesLinked;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Módulo
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crear Nuevo Módulo</SheetTitle>
          <SheetDescription>
            Define el módulo y sus objetivos vinculados a resultados de
            aprendizaje
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Module Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre del Módulo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Límites y Continuidad"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve del módulo"
                rows={3}
              />
            </div>
          </div>

          {/* Module Objectives */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Objetivos del Módulo
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addObjective}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Objetivo
              </Button>
            </div>

            <div className="space-y-4">
              {objectives.map((objective, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Objetivo {index + 1}
                    </Label>
                    {objectives.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObjective(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <Label htmlFor={`obj-desc-${index}`} className="text-xs">
                        Descripción *
                      </Label>
                      <Input
                        id={`obj-desc-${index}`}
                        value={objective.description}
                        onChange={(e) =>
                          updateObjective(index, "description", e.target.value)
                        }
                        placeholder="Ej: Calcular límites básicos"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`obj-code-${index}`} className="text-xs">
                        Código (opcional)
                      </Label>
                      <Input
                        id={`obj-code-${index}`}
                        value={objective.code}
                        onChange={(e) =>
                          updateObjective(index, "code", e.target.value)
                        }
                        placeholder="Ej: OA1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">
                        Vinculado a Resultados de Aprendizaje: *
                      </Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded">
                        {learningOutcomes.map((lo) => (
                          <div
                            key={lo.id}
                            className="flex items-start space-x-2"
                          >
                            <Checkbox
                              id={`lo-${index}-${lo.id}`}
                              checked={objective.linked_learning_outcome_ids.includes(
                                lo.id
                              )}
                              onCheckedChange={() =>
                                toggleLearningOutcome(index, lo.id)
                              }
                            />
                            <Label
                              htmlFor={`lo-${index}-${lo.id}`}
                              className="text-xs font-normal leading-tight cursor-pointer"
                            >
                              {lo.code}: {lo.description}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={isLoading || !isFormValid}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingStep || "Guardando..."}
                </span>
              ) : (
                "Crear Módulo"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
