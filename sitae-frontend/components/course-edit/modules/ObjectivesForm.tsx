"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { LearningOutcome } from "@/types/course-content";

interface ObjectivesFormProps {
  outcomes: LearningOutcome[];
  onChange: (objectives: { description: string; learning_outcomes: string[] }[]) => void;
}

export function ObjectivesForm({ outcomes, onChange }: ObjectivesFormProps) {
  const [objectives, setObjectives] = useState<
    { description: string; learning_outcomes: string[] }[]
  >([{ description: "", learning_outcomes: [] }]);

  const updateObjective = (index: number, key: string, value: any) => {
    const updated = [...objectives];
    (updated[index] as any)[key] = value;
    setObjectives(updated);
    onChange(updated);
  };

  const addObjective = () => {
    const updated = [...objectives, { description: "", learning_outcomes: [] }];
    setObjectives(updated);
    onChange(updated);
  };

  const removeObjective = (index: number) => {
    const updated = objectives.filter((_, i) => i !== index);
    setObjectives(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {objectives.map((obj, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <div>
            <Label>Descripción del objetivo *</Label>
            <Input
              value={obj.description}
              onChange={(e) => updateObjective(index, "description", e.target.value)}
              placeholder="Ej: Analizar fundamentos del cálculo"
            />
          </div>

          <div>
            <Label>Resultados de aprendizaje asociados *</Label>
            <Select
              onValueChange={(val) => {
                const already = obj.learning_outcomes.includes(val);
                const updated = already
                  ? obj.learning_outcomes.filter((v) => v !== val)
                  : [...obj.learning_outcomes, val];
                updateObjective(index, "learning_outcomes", updated);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar resultados de aprendizaje" />
              </SelectTrigger>
              <SelectContent>
                {outcomes.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.code} — {o.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2 mt-2">
              {obj.learning_outcomes.map((loId) => {
                const lo = outcomes.find((o) => o.id === loId);
                return (
                  <Badge
                    key={loId}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      updateObjective(
                        index,
                        "learning_outcomes",
                        obj.learning_outcomes.filter((v) => v !== loId)
                      )
                    }
                  >
                    {lo?.code}
                  </Badge>
                );
              })}
            </div>
          </div>

          {objectives.length > 1 && (
            <div className="text-right">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => removeObjective(index)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar objetivo
              </Button>
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addObjective}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar otro objetivo
      </Button>
    </div>
  );
}
