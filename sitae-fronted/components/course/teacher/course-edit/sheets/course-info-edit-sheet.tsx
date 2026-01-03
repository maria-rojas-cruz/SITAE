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
import { Loader2 } from "lucide-react";
import { courseService } from "../services/course-service";
import { useSWRConfig } from "swr";
import { api } from "@/lib/api-client";

interface CourseInfoEditSheetProps {
  courseId: string;
  courseName: string;
  courseCode?: string;
  courseDescription?: string;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export function CourseInfoEditSheet({
  courseId,
  courseName,
  courseCode,
  courseDescription,
  onSuccess,
  trigger,
}: CourseInfoEditSheetProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(courseName);
  const [code, setCode] = useState(courseCode || "");
  const [description, setDescription] = useState(courseDescription || "");

  useEffect(() => {
    if (open) {
      setName(courseName);
      setCode(courseCode || "");
      setDescription(courseDescription || "");
    }
  }, [open, courseName, courseCode, courseDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await courseService.updateCourse(courseId, {
        name,
        code: code || null,
        description: description || null,
      });

      setOpen(false);
      
     
      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating course info:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Información del Curso</SheetTitle>
          <SheetDescription>Modifica los datos generales del curso</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Curso *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Código del Curso</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: CS101"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe el contenido y objetivos del curso..."
              />
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
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}