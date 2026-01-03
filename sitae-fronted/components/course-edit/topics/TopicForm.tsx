/*"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/ui/use-toast";
import { Check, Loader2 } from "lucide-react";

interface TopicFormProps {
  mode: "create" | "edit";
  moduleId: string;
  moduleObjectives: { id: string; description: string }[];
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TopicForm({
  mode,
  moduleId,
  moduleObjectives,
  initialData,
  onSuccess,
  onCancel,
}: TopicFormProps) {
  const isEdit = mode === "edit";
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    order: initialData?.order || 1,
    objectives: initialData?.objectives?.map((o: any) => o.id) || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEdit) {
        await api.put(`/api/modules/${moduleId}/topics/${initialData.id}`, formData);
        toast({ title: "Tema actualizado correctamente" });
      } else {
        await api.post(`/api/modules/${moduleId}/topics`, formData);
        toast({ title: "Tema creado correctamente" });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el tema",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <Label htmlFor="name">Nombre del tema *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div>
        <Label>Orden</Label>
        <Input
          type="number"
          value={formData.order}
          onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
          min={1}
        />
      </div>

      <div>
        <Label>Asociar objetivos del módulo</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {moduleObjectives.map((obj) => {
            const selected = formData.objectives.includes(obj.id);
            return (
              <Button
                key={obj.id}
                type="button"
                size="sm"
                variant={selected ? "default" : "outline"}
                onClick={() => {
                  setFormData({
                    ...formData,
                    objectives: selected
                      ? formData.objectives.filter((id) => id !== obj.id)
                      : [...formData.objectives, obj.id],
                  });
                }}
              >
                {selected && <Check className="h-3 w-3 mr-1" />}
                {obj.description}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear tema"}
        </Button>
      </div>
    </form>
  );
}
*/