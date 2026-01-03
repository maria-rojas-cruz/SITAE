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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { quizService } from "../services/quiz-service";
import { api } from "@/lib/api-client";
import { useSWRConfig } from "swr"; 
interface QuizCreateSheetProps {
  courseId: string;
  topicId: string;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function QuizCreateSheet({
  courseId,
  topicId,
  onSuccess,
  trigger,
}: QuizCreateSheetProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await quizService.createQuiz(topicId, {
        title,
        description: description || null,
        time_minutes: timeMinutes ? parseInt(timeMinutes) : null,
        is_active: isActive,
      });

      // Reset
      setTitle("");
      setDescription("");
      setTimeMinutes("");
      setIsActive(true);
      setOpen(false);
      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating quiz:", error);
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
            Crear Quiz
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Crear Quiz</SheetTitle>
          <SheetDescription>
            Crea un quiz. Podrás agregar preguntas después.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Quiz *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Quiz: Conceptos Básicos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción del quiz"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Tiempo límite (minutos)</Label>
              <Input
                id="time"
                type="number"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked as boolean)}
              />
              <Label htmlFor="active" className="text-sm cursor-pointer">
                Quiz activo (visible para estudiantes)
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
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </span>
              ) : (
                "Crear Quiz"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}