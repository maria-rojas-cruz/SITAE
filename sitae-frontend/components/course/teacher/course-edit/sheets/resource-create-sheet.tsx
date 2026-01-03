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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { TopicObjectiveInfo } from "@/hooks/course/useCourseEditData";
import { resourceService } from "../services/resource-service";
import { api } from "@/lib/api-client";
import { useSWRConfig } from "swr";
interface ResourceCreateSheetProps {
  courseId: string;
  topicId: string;
  topicObjectives: TopicObjectiveInfo[];
  nextOrder: number;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

const RESOURCE_TYPES = [
  { value: "video", label: "Video" },
  { value: "lectura", label: "Lectura o Documento" },
  { value: "ejercicio", label: "Ejercicio o Código" },
  // { value: "lectura", label: "Documento" },
  // { value: "codigo", label: "Código" },
];

const DIFFICULTY_LEVELS = [
  { value: "basico", label: "Básico" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
];

export function ResourceCreateSheet({
  courseId,
  topicId,
  topicObjectives,
  nextOrder,
  onSuccess,
  trigger,
}: ResourceCreateSheetProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [url, setUrl] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [isMandatory, setIsMandatory] = useState(true);
  const [topicObjectiveId, setTopicObjectiveId] = useState("");

  const [difficulty, setDifficulty] = useState("");
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resourceService.createResource(topicId, {
        title,
        type,
        url,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
        is_mandatory: isMandatory,
        order: nextOrder,
        topic_objective_id: topicObjectiveId,
        difficulty: difficulty,
      });

      // Reset
      setTitle("");
      setType("");
      setUrl("");
      setDurationMinutes("");
      setIsMandatory(true);
      setTopicObjectiveId("");
      setOpen(false);
      setDifficulty("");
      
      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);

      onSuccess();
    } catch (error: any) {
      console.error("Error creating resource:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Recurso
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Agregar Recurso</SheetTitle>
          <SheetDescription>
            Agrega material educativo vinculado a un objetivo del tema
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Recurso *</Label>
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Introducción a Límites"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duración estimada (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="15"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificultad *</Label>
              <Select value={difficulty} onValueChange={setDifficulty} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la dificultad" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective">Vinculado a Objetivo del Tema *</Label>
              <Select
                value={topicObjectiveId}
                onValueChange={setTopicObjectiveId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un objetivo" />
                </SelectTrigger>
                <SelectContent>
                  {topicObjectives.map((obj) => (
                    <SelectItem key={obj.id} value={obj.id}>
                      {obj.code ? `${obj.code}: ` : ""}
                      {obj.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mandatory"
                checked={isMandatory}
                onCheckedChange={(checked) =>
                  setIsMandatory(checked as boolean)
                }
              />
              <Label htmlFor="mandatory" className="text-sm cursor-pointer">
                Recurso obligatorio
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                !title.trim() ||
                !type ||
                !url ||
                !topicObjectiveId ||
                !difficulty
              }
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar Recurso"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
