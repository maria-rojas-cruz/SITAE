// components/course-edit/modules/topics/ObjectivesTopicForm.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { ModuleObjective } from "@/types/course-content";

interface ObjectivesTopicFormProps {
  moduleObjectives: ModuleObjective[];
  onChange: (objectives: { description: string; module_objectives: string[] }[]) => void;
}

export function ObjectivesTopicForm({ moduleObjectives, onChange }: ObjectivesTopicFormProps) {
  const [objectives, setObjectives] = useState<
    { description: string; module_objectives: string[] }[]
  >([{ description: "", module_objectives: [] }]);

  const updateObjective = (index: number, key: string, value: any) => {
    const updated = [...objectives];
    (updated[index] as any)[key] = value;
    setObjectives(updated);
    onChange(updated);
  };

  const addObjective = () => {
    const updated = [...objectives, { description: "", module_objectives: [] }];
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
            <Label>Descripción del objetivo del tema *</Label>
            <Input
              value={obj.description}
              onChange={(e) => updateObjective(index, "description", e.target.value)}
              placeholder="Ej: Comprender los principios básicos de derivación"
            />
          </div>

          <div>
            <Label>Objetivos de módulo asociados *</Label>
            <Select
              onValueChange={(val) => {
                const already = obj.module_objectives.includes(val);
                const updated = already
                  ? obj.module_objectives.filter((v) => v !== val)
                  : [...obj.module_objectives, val];
                updateObjective(index, "module_objectives", updated);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar objetivos de módulo" />
              </SelectTrigger>
              <SelectContent>
                {moduleObjectives.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2 mt-2">
              {obj.module_objectives.map((id) => {
                const mo = moduleObjectives.find((o) => o.id === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      updateObjective(
                        index,
                        "module_objectives",
                        obj.module_objectives.filter((v) => v !== id)
                      )
                    }
                  >
                    {mo?.description?.slice(0, 25) || "Sin nombre"}
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
