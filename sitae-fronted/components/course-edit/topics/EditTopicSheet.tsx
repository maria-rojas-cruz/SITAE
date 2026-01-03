// components/course-edit/modules/topics/EditTopicSheet.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useUpdateTopic } from "./hooks/useUpdateTopic";
import { useGetTopic } from "./hooks/useGetTopic";
import { ModuleObjective } from "@/types/course-content";
import { toast } from "sonner";

interface EditTopicSheetProps {
  topicId: string;
  moduleId: string;
  moduleObjectives: ModuleObjective[];
  onUpdated: () => void;
  onClose: () => void;
}

interface TopicObjectiveForm {
  description: string;
  code: string;
  order: number;
  module_objective_ids: string[];
}

export function EditTopicSheet({ 
  topicId,
  moduleId, 
  moduleObjectives, 
  onUpdated,
  onClose
}: EditTopicSheetProps) {
  const { updateTopic, isLoading: isUpdating } = useUpdateTopic(moduleId, topicId);
  const { topic, isLoading: isLoadingTopic } = useGetTopic(topicId);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 1,
  });

  const [objectives, setObjectives] = useState<TopicObjectiveForm[]>([]);

  // Cargar datos cuando el topic esté disponible
  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.title,
        description: topic.description || "",
        order: topic.order,
      });

      // Convertir objectives del topic a formato del form
      setObjectives(
        topic.objectives.map(obj => ({
          description: obj.description,
          code: obj.code || "",
          order: obj.order,
          module_objective_ids: obj.module_objectives.map(mo => mo.id)
        }))
      );
    }
  }, [topic]);

  const addObjective = () => {
    setObjectives([
      ...objectives,
      { 
        description: "", 
        code: "", 
        order: objectives.length + 1,
        module_objective_ids: [] 
      }
    ]);
  };

  const removeObjective = (index: number) => {
    if (objectives.length === 1) {
      toast.error("Debe haber al menos un objetivo");
      return;
    }
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (
    index: number,
    field: keyof TopicObjectiveForm,
    value: any
  ) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], [field]: value };
    setObjectives(updated);
  };

  const toggleModuleObjective = (objectiveIndex: number, moduleObjId: string) => {
    const updated = [...objectives];
    const current = updated[objectiveIndex].module_objective_ids;
    
    if (current.includes(moduleObjId)) {
      updated[objectiveIndex].module_objective_ids = current.filter(
        id => id !== moduleObjId
      );
    } else {
      updated[objectiveIndex].module_objective_ids = [...current, moduleObjId];
    }
    
    setObjectives(updated);
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.title.trim()) {
      toast.error("El nombre del tema es obligatorio");
      return;
    }

    if (objectives.length === 0 || !objectives[0].description.trim()) {
      toast.error("Debe agregar al menos un objetivo");
      return;
    }

    for (let i = 0; i < objectives.length; i++) {
      if (!objectives[i].description.trim()) {
        toast.error(`El objetivo ${i + 1} debe tener descripción`);
        return;
      }
    }

    try {
      await updateTopic({
        title: formData.title,
        description: formData.description,
        order: formData.order,
        objectives: objectives.map(obj => ({
          description: obj.description,
          code: obj.code || undefined,
          order: obj.order,
          module_objective_ids: obj.module_objective_ids
        }))
      });

      onUpdated();
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoadingTopic) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-2xl">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar tema</SheetTitle>
          <SheetDescription>
            Modifica los datos del tema y sus objetivos
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Datos básicos del tema */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Nombre del tema *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Derivadas básicas"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Breve descripción del tema..."
              />
            </div>

            <div>
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                min={1}
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Objetivos del tema */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Objetivos del tema *</Label>
              <Button type="button" size="sm" variant="outline" onClick={addObjective}>
                <Plus className="h-3 w-3 mr-1" />
                Agregar objetivo
              </Button>
            </div>

            {objectives.map((obj, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Objetivo {index + 1}
                  </span>
                  {objectives.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeObjective(index)}
                    >
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor={`obj-desc-${index}`} className="text-xs">
                      Descripción *
                    </Label>
                    <Input
                      id={`obj-desc-${index}`}
                      value={obj.description}
                      onChange={(e) => updateObjective(index, "description", e.target.value)}
                      placeholder="Ej: Aplicar reglas de derivación"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`obj-code-${index}`} className="text-xs">
                      Código
                    </Label>
                    <Input
                      id={`obj-code-${index}`}
                      value={obj.code}
                      onChange={(e) => updateObjective(index, "code", e.target.value)}
                      placeholder="Ej: OT1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`obj-order-${index}`} className="text-xs">
                      Orden
                    </Label>
                    <Input
                      id={`obj-order-${index}`}
                      type="number"
                      min={1}
                      value={obj.order}
                      onChange={(e) => updateObjective(index, "order", Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Relación con Module Objectives */}
                {moduleObjectives.length > 0 && (
                  <div>
                    <Label className="text-xs mb-2 block">
                      Objetivos del módulo relacionados
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2 bg-background">
                      {moduleObjectives.map((moduleObj) => (
                        <div key={moduleObj.id} className="flex items-start space-x-2">
                          <Checkbox
                            id={`mo-${index}-${moduleObj.id}`}
                            checked={obj.module_objective_ids.includes(moduleObj.id)}
                            onCheckedChange={() => toggleModuleObjective(index, moduleObj.id)}
                          />
                          <label
                            htmlFor={`mo-${index}-${moduleObj.id}`}
                            className="text-xs cursor-pointer leading-tight"
                          >
                            {moduleObj.code && (
                              <span className="font-medium">{moduleObj.code}: </span>
                            )}
                            {moduleObj.description}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {obj.module_objective_ids.length} seleccionado(s)
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <SheetFooter className="flex justify-end gap-2">
          <Button 
            type="button"
            variant="outline" 
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit} 
            disabled={isUpdating}
          >
            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar cambios
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}