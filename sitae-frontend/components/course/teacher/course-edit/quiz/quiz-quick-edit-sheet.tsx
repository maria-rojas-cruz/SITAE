// components/course/teacher/course-edit/quiz/quiz-quick-edit-sheet.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Zap } from "lucide-react";
import { QuizEditData } from "@/hooks/course/useCourseEditData";
import { api } from "@/lib/api-client";
import { useSWRConfig } from "swr";
interface QuizQuickEditSheetProps {
  courseId: string;
  topicId: string;
  quiz: QuizEditData;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function QuizQuickEditSheet({
  courseId,
  topicId,
  quiz,
  onSuccess,
  trigger,
}: QuizQuickEditSheetProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState(quiz.title);
  const [description, setDescription] = useState(quiz.description || "");
  const [timeMinutes, setTimeMinutes] = useState(
    quiz.time_minutes?.toString() || ""
  );
  const [isActive, setIsActive] = useState(quiz.is_active);

  useEffect(() => {
    if (open) {
      setTitle(quiz.title);
      setDescription(quiz.description || "");
      setTimeMinutes(quiz.time_minutes?.toString() || "");
      setIsActive(quiz.is_active);
    }
  }, [open, quiz]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.put(`api/topics/${topicId}/quizzes/${quiz.id}`, {
        title,
        description: description || null,
        time_minutes: timeMinutes ? parseInt(timeMinutes) : null,
        is_active: isActive,
      });

      setOpen(false);
      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating quiz:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Zap className="h-3 w-3" />
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Edición Rápida</SheetTitle>
          <SheetDescription>
            Actualiza la información básica del quiz
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
