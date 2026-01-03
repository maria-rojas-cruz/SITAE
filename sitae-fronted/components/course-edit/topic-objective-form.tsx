// components/course-edit/topic-objective-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { ModuleObjectiveInfo } from "@/hooks/course/useCourseEditData";

interface TopicObjectiveFormProps {
  topicId: string;
  availableModuleObjectives: ModuleObjectiveInfo[];
  onSave: () => void;
  onCancel: () => void;
}

export function TopicObjectiveForm({
  topicId,
  availableModuleObjectives,
  onSave,
  onCancel,
}: TopicObjectiveFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    code: "",
    selectedMOIds: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const toggleMO = (moId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMOIds: prev.selectedMOIds.includes(moId)
        ? prev.selectedMOIds.filter(id => id !== moId)
        : [...prev.selectedMOIds, moId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "La descripción es obligatoria",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Crear objective
      const objective = await api.post(`api/topics/${topicId}/objectives`, {
        description: formData.description,
        code: formData.code,
      });

      // 2. Vincular con module objectives
      for (const moId of formData.selectedMOIds) {
        await api.post(
          `api/topics/${topicId}/objectives/${objective.id}/module-objectives`,
          { module_objective_id: moId, is_primary: false }
        );
      }

      toast({ title: "Objetivo de tema agregado" });
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-2 border-blue-500">
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Código</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ej: OT1"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Descripción *</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe el objetivo del tema"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">
            Vincular con Objetivos del Módulo:
          </Label>
          <div className="border rounded p-2 max-h-32 overflow-y-auto space-y-1 bg-muted/10">
            {availableModuleObjectives.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-2">
                No hay objetivos de módulo. Crea algunos primero.
              </p>
            ) : (
              availableModuleObjectives.map((mo) => (
                <div key={mo.id} className="flex items-start gap-1.5 p-1 hover:bg-muted rounded text-xs">
                  <Checkbox
                    id={`mo-${mo.id}`}
                    checked={formData.selectedMOIds.includes(mo.id)}
                    onCheckedChange={() => toggleMO(mo.id)}
                    className="mt-0.5"
                  />
                  <label htmlFor={`mo-${mo.id}`} className="cursor-pointer flex-1 leading-tight">
                    {mo.code && <span className="font-semibold">{mo.code}: </span>}
                    {mo.description}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={isSubmitting} size="sm">
            {isSubmitting ? "Guardando..." : "Guardar"}
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline" disabled={isSubmitting}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}