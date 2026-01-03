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
import { ModuleObjectiveInfo } from "@/hooks/course/useCourseEditData";
import { topicService } from "../services/topic-service";
import { createTopicObjectiveWithLinks } from "../services/topic-helpers";
import { api } from "@/lib/api-client";
import { useSWRConfig } from "swr";
interface TopicCreateSheetProps {
  courseId: string;
  moduleId: string;
  moduleObjectives: ModuleObjectiveInfo[];
  nextOrder: number;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

interface TopicObjectiveData {
  description: string;
  code: string;
  linked_module_objective_ids: string[];
}

export function TopicCreateSheet({
  courseId,
  moduleId,
  moduleObjectives,
  nextOrder,
  onSuccess,
  trigger,
}: TopicCreateSheetProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objectives, setObjectives] = useState<TopicObjectiveData[]>([
    { description: "", code: "", linked_module_objective_ids: [] },
  ]);

  const addObjective = () => {
    setObjectives([
      ...objectives,
      { description: "", code: "", linked_module_objective_ids: [] },
    ]);
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (
    index: number,
    field: keyof TopicObjectiveData,
    value: any
  ) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], [field]: value };
    setObjectives(updated);
  };

  const toggleModuleObjective = (objectiveIndex: number, moId: string) => {
    const updated = [...objectives];
    const current = updated[objectiveIndex].linked_module_objective_ids;

    if (current.includes(moId)) {
      updated[objectiveIndex].linked_module_objective_ids = current.filter(
        (id) => id !== moId
      );
    } else {
      updated[objectiveIndex].linked_module_objective_ids = [...current, moId];
    }

    setObjectives(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Crear tema
      setLoadingStep("Creando tema...");
      const topicResponse = await topicService.createTopic(moduleId, {
        title,
        description: description || null,
        order: nextOrder,
      });

      const topicId = topicResponse.id;
      const validObjectives = objectives.filter(
        (obj) => obj.description.trim() !== ""
      );

      // 2. Crear objetivos con sus vínculos
      for (let i = 0; i < validObjectives.length; i++) {
        const objective = validObjectives[i];
        setLoadingStep(
          `Creando objetivo ${i + 1} de ${validObjectives.length}...`
        );

        await createTopicObjectiveWithLinks(
          topicId,
          {
            description: objective.description,
            code: objective.code || null,
            order: i + 1,
          },
          objective.linked_module_objective_ids
        );
      }

      // 3. Limpiar y cerrar
      setLoadingStep("Finalizando...");
      setTitle("");
      setDescription("");
      setObjectives([
        { description: "", code: "", linked_module_objective_ids: [] },
      ]);
      setLoadingStep("");
      setOpen(false);
      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating topic:", error);
      setLoadingStep("");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Validaciones
  const validObjectives = objectives.filter(
    (obj) => obj.description.trim() !== ""
  );
  const allObjectivesLinked = validObjectives.every(
    (obj) => obj.linked_module_objective_ids.length > 0
  );
  const isFormValid =
    title.trim() && validObjectives.length > 0 && allObjectivesLinked;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Tema
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crear Nuevo Tema</SheetTitle>
          <SheetDescription>
            Define el tema y sus objetivos vinculados a objetivos del módulo
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Topic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre del Tema *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Introducción a Límites"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción breve del tema"
                rows={3}
              />
            </div>
          </div>

          {/* Topic Objectives */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Objetivos del Tema
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
                        placeholder="Ej: Comprender el concepto de límite"
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
                        placeholder="Ej: OT1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">
                        Vinculado a Objetivos del Módulo: *
                      </Label>
                      {moduleObjectives.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto p-2 border rounded">
                          {moduleObjectives.map((mo) => (
                            <div
                              key={mo.id}
                              className="flex items-start space-x-2"
                            >
                              <Checkbox
                                id={`mo-${index}-${mo.id}`}
                                checked={objective.linked_module_objective_ids.includes(
                                  mo.id
                                )}
                                onCheckedChange={() =>
                                  toggleModuleObjective(index, mo.id)
                                }
                              />
                              <Label
                                htmlFor={`mo-${index}-${mo.id}`}
                                className="text-xs font-normal leading-tight cursor-pointer"
                              >
                                {mo.code ? `${mo.code}: ` : ""}
                                {mo.description}
                              </Label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Este módulo no tiene objetivos definidos
                        </p>
                      )}
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
                "Crear Tema"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
