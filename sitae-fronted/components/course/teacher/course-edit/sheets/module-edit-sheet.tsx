"use client";

import { useState, useEffect } from "react";
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
import { Trash2, Loader2, Plus } from "lucide-react";
import {
  LearningOutcomeInfo,
  ModuleEditData,
} from "@/hooks/course/useCourseEditData";
import { moduleService } from "../services/module-service";
import { syncLearningOutcomeLinks } from "../services/module-helpers";
import { api } from "@/lib/api-client";
import { useSWRConfig } from "swr";

interface ModuleEditSheetProps {
  courseId: string;
  module: ModuleEditData;
  learningOutcomes: LearningOutcomeInfo[];
  onSuccess: () => void;
  trigger: React.ReactNode;
}

interface ObjectiveData {
  id?: string;
  description: string;
  code: string;
  linked_learning_outcome_ids: string[];
  isNew?: boolean;
}

export function ModuleEditSheet({
  courseId,
  module,
  learningOutcomes,
  onSuccess,
  trigger,
}: ModuleEditSheetProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description || "");
  const [objectives, setObjectives] = useState<ObjectiveData[]>([]);

  useEffect(() => {
    if (open) {
      setTitle(module.title);
      setDescription(module.description || "");
      setObjectives(
        module.objectives.map((obj) => ({
          id: obj.id,
          description: obj.description,
          code: obj.code || "",
          linked_learning_outcome_ids: obj.linked_learning_outcome_ids,
          isNew: false,
        }))
      );
    }
  }, [open, module]);

  const addObjective = () => {
    setObjectives([
      ...objectives,
      {
        description: "",
        code: "",
        linked_learning_outcome_ids: [],
        isNew: true,
      },
    ]);
  };

  const removeObjective = async (index: number) => {
    const objective = objectives[index];

    if (objective.id && !objective.isNew) {
      // Eliminar del backend
      try {
        await moduleService.deleteObjective(module.id, objective.id);
      } catch (error) {
        console.error("Error deleting objective:", error);
        return;
      }
    }

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
      // 1. Actualizar módulo
      setLoadingStep("Actualizando módulo...");
      await moduleService.updateModule(courseId, module.id, {
        title,
        description: description || null,
      });

      // 2. Procesar objetivos
      const validObjectives = objectives.filter(
        (obj) => obj.description.trim() !== ""
      );

      for (let i = 0; i < validObjectives.length; i++) {
        const objective = validObjectives[i];
        setLoadingStep(
          `Procesando objetivo ${i + 1} de ${validObjectives.length}...`
        );

        let objectiveId = objective.id;

        if (objective.isNew) {
          // Crear nuevo objetivo
          const response = await moduleService.createObjective(module.id, {
            description: objective.description,
            code: objective.code || null,
            order: i + 1,
          });
          objectiveId = response.id;
        } else if (objectiveId) {
          // Actualizar objetivo existente
          await moduleService.updateObjective(module.id, objectiveId, {
            description: objective.description,
            code: objective.code || null,
            order: i + 1,
          });
        }

        // 3. Sincronizar learning outcomes vinculados
        if (objectiveId) {
          await syncLearningOutcomeLinks(
            module.id,
            objectiveId,
            objective.linked_learning_outcome_ids
          );
        }
      }

      setLoadingStep("Finalizando...");
      setOpen(false);

      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);

      onSuccess();
    } catch (error: any) {
      console.error("Error updating module:", error);
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
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Módulo</SheetTitle>
          <SheetDescription>
            Modifica el módulo y sus objetivos
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre del Módulo *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
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
          </div>

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
                      Objetivo {index + 1} {objective.isNew && "(Nuevo)"}
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeObjective(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
                  {loadingStep}
                </span>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
