// components/course-edit/module-objectives-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { LearningOutcome } from "@/types/course-content";

interface ModuleObjectiveFormProps {
  moduleId: string;
  availableLearningOutcomes: LearningOutcome[]; // Para seleccionar
  onSave: () => void;
  onCancel: () => void;
}

export function ModuleObjectiveForm({
  moduleId,
  availableLearningOutcomes,
  onSave,
  onCancel,
}: ModuleObjectiveFormProps) {
  const [formData, setFormData] = useState({
    description: "",
    code: "",
    learning_outcome_ids: [] as string[], // IDs seleccionados
  });
  const { toast } = useToast();

  const handleSubmit = async () => {
    try {
      // 1. Crear el objective
      const objective = await api.post(
        `api/modules/${moduleId}/objectives`,
        {
          description: formData.description,
          code: formData.code,
        }
      );

      // 2. Vincular con learning outcomes
      for (const loId of formData.learning_outcome_ids) {
        await api.post(
          `api/modules/${moduleId}/objectives/${objective.id}/learning-outcomes`,
          { learning_outcome_id: loId }
        );
      }

      toast({ title: "Objetivo agregado correctamente" });
      onSave();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleLearningOutcome = (loId: string) => {
    setFormData((prev) => ({
      ...prev,
      learning_outcome_ids: prev.learning_outcome_ids.includes(loId)
        ? prev.learning_outcome_ids.filter((id) => id !== loId)
        : [...prev.learning_outcome_ids, loId],
    }));
  };

  return (
    <Card className="border-primary">
      <CardContent className="pt-4 space-y-3">
        <div>
          <Label className="text-xs">Código</Label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="Ej: OM1"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs">Descripción *</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe el objetivo del módulo"
            className="h-8 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs mb-2 block">
            Vincular con Resultados de Aprendizaje:
          </Label>
          <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
            {availableLearningOutcomes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Primero agrega resultados de aprendizaje al curso
              </p>
            ) : (
              availableLearningOutcomes.map((lo) => (
                <div key={lo.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`lo-${lo.id}`}
                    checked={formData.learning_outcome_ids.includes(lo.id)}
                    onCheckedChange={() => toggleLearningOutcome(lo.id)}
                  />
                  <label
                    htmlFor={`lo-${lo.id}`}
                    className="text-xs cursor-pointer flex-1"
                  >
                    <span className="font-medium">{lo.code}:</span> {lo.description}
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} size="sm">
            Guardar
          </Button>
          <Button onClick={onCancel} size="sm" variant="outline">
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}