// components/course-edit/resource-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { TopicObjectiveInfo } from "@/hooks/course/useCourseEditData";

interface ResourceFormProps {
  topicId: string;
  availableObjectives: TopicObjectiveInfo[];
  onSave: () => void;
  onCancel: () => void;
}

export function ResourceForm({
  topicId,
  availableObjectives,
  onSave,
  onCancel,
}: ResourceFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "link",
    url: "",
    duration_minutes: "",
    is_mandatory: true,
    topic_objective_id: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.url.trim() || !formData.topic_objective_id) {
      toast({
        title: "Error",
        description: "Completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`api/topics/${topicId}/resources`, {
        title: formData.title,
        type: formData.type,
        url: formData.url,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        is_mandatory: formData.is_mandatory,
        topic_objective_id: formData.topic_objective_id,
      });

      toast({ title: "Recurso agregado" });
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
    <Card className="border-2 border-green-500">
      <CardContent className="pt-4 space-y-3">
        <div>
          <Label className="text-xs">Título *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Nombre del recurso"
            className="h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Tipo *</Label>
            <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="link">Enlace</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="reading">Lectura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Duración (min)</Label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              placeholder="15"
              className="h-8 text-sm"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">URL *</Label>
          <Input
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://..."
            className="h-8 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">Objetivo del tema relacionado *</Label>
          <Select 
            value={formData.topic_objective_id} 
            onValueChange={(val) => setFormData({ ...formData, topic_objective_id: val })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selecciona un objetivo..." />
            </SelectTrigger>
            <SelectContent>
              {availableObjectives.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">
                  No hay objetivos. Crea uno primero.
                </div>
              ) : (
                availableObjectives.map((obj) => (
                  <SelectItem key={obj.id} value={obj.id} className="text-sm">
                    {obj.code ? `${obj.code}: ` : ""}{obj.description}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Indica qué objetivo de tema ayuda a cumplir este recurso
          </p>
        </div>

        <div className="flex items-center justify-between py-2">
          <Label className="text-xs">¿Es obligatorio?</Label>
          <Switch
            checked={formData.is_mandatory}
            onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
          />
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