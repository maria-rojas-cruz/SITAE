// components/course-edit/module-objective-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { LearningOutcomeInfo } from "@/hooks/course/useCourseEditData";

interface ModuleObjectiveFormProps {
  moduleId: string;
  availableLearningOutcomes: LearningOutcomeInfo[];
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
    selectedLOIds: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const toggleLO = (loId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedLOIds: prev.selectedLOIds.includes(loId)
        ? prev.selectedLOIds.filter(id => id !== loId)
        : [...prev.selectedLOIds, loId],
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
      const objective = await api.post(`api/modules/${moduleId}/objectives`, {
        description: formData.description,
        code: formData.code,
      });

      // 2. Vincular con learning outcomes
      for (const loId of formData.selectedLOIds) {
        await api.post(
          `api/modules/${moduleId}/objectives/${objective.id}/learning-outcomes`,
          { learning_outcome_id: loId, is_primary: false }
        );
      }

      toast({ title: "Objetivo agregado correctamente" });
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
    <Card className="border-2 border-primary">
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm">Código</Label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ej: OM1"
              className="h-9"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm">Descripción *</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe el objetivo del módulo"
            className="h-9"
          />
        </div>

        <div>
          <Label className="text-sm mb-2 block">
            Vincular con Resultados de Aprendizaje del Curso:
          </Label>
          <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2 bg-muted/20">
            {availableLearningOutcomes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                No hay resultados de aprendizaje. Crea algunos primero en la pestaña "Resultados".
              </p>
            ) : (
              availableLearningOutcomes.map((lo) => (
                <div key={lo.id} className="flex items-start gap-2 p-2 hover:bg-muted rounded">
                  <Checkbox
                    id={`lo-${lo.id}`}
                    checked={formData.selectedLOIds.includes(lo.id)}
                    onCheckedChange={() => toggleLO(lo.id)}
                  />
                  <label
                    htmlFor={`lo-${lo.id}`}
                    className="text-sm cursor-pointer flex-1 leading-tight"
                  >
                    <span className="font-semibold text-primary">{lo.code}:</span>{" "}
                    {lo.description}
                  </label>
                </div>
              ))
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Selecciona los resultados de aprendizaje que este objetivo ayuda a alcanzar
          </p>
        </div>

        <div className="flex gap-2 pt-2">
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