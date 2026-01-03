// components/course-edit/modules/topics/CreateTopicSheet.tsx
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCreateTopic } from "./hooks/useCreateTopic";
import { ModuleObjective } from "@/types/course-content";
import { toast } from "sonner";

interface CreateTopicSheetProps {
  moduleId: string;
  moduleObjectives: ModuleObjective[];
  onCreated: () => void;
}

interface TopicObjectiveForm {
  description: string;
  code: string;
  order: number;
  module_objective_ids: string[];
}

export function CreateTopicSheet({ 
  moduleId, 
  moduleObjectives, 
  onCreated 
}: CreateTopicSheetProps) {
  const { createTopic, isLoading } = useCreateTopic(moduleId);
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 1,
  });

  const [objectives, setObjectives] = useState<TopicObjectiveForm[]>([
    { description: "", code: "", order: 1, module_objective_ids: [] }
  ]);

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

    // Validar que todos los objectives tengan description
    for (let i = 0; i < objectives.length; i++) {
      if (!objectives[i].description.trim()) {
        toast.error(`El objetivo ${i + 1} debe tener descripción`);
        return;
      }
    }

    try {
      await createTopic({
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

      // Reset y cerrar
      setFormData({ title: "", description: "", order: 1 });
      setObjectives([{ 
        description: "", 
        code: "", 
        order: 1, 
        module_objective_ids: [] 
      }]);
      setOpen(false);
      onCreated();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo tema
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nuevo tema</SheetTitle>
          <SheetDescription>
            Crea un tema dentro del módulo y define sus objetivos asociados.
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
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit} 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear tema
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}