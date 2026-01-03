"use client";

import { useState, useEffect } from "react";
import { useSWRConfig } from "swr"; 
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
import { LearningOutcomeInfo } from "@/hooks/course/useCourseEditData";
import { learningOutcomeService } from "../services/learning-outcome-service";
import { api } from "@/lib/api-client";

interface LearningOutcomeEditSheetProps {
  courseId: string;
  outcome: LearningOutcomeInfo;
  onSuccess: () => void;
  trigger: React.ReactNode;
}

export function LearningOutcomeEditSheet({
  courseId,
  outcome,
  onSuccess,
  trigger,
}: LearningOutcomeEditSheetProps) {
  const { mutate } = useSWRConfig(); // ← AGREGAR
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState(outcome.code);
  const [description, setDescription] = useState(outcome.description);
  const [bloomLevel, setBloomLevel] = useState(outcome.bloom_level || "");

  useEffect(() => {
    if (open) {
      setCode(outcome.code);
      setDescription(outcome.description);
      setBloomLevel(outcome.bloom_level || "");
    }
  }, [open, outcome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await learningOutcomeService.updateLearningOutcome(
        courseId,
        outcome.id,
        {
          code,
          description,
          bloom_level: bloomLevel || null,
        }
      );

      setOpen(false);

      api.clearCache(`courses/${courseId}`);
      // Invalidar cache de SWR
      await mutate(`/api/courses/${courseId}/edit-data`); // ← AGREGAR
      
      onSuccess();
    } catch (error: any) {
      console.error("Error updating learning outcome:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Resultado de Aprendizaje</SheetTitle>
          <SheetDescription>Modifica el resultado de aprendizaje</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
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
            <Button
              type="submit"
              disabled={isLoading || !code.trim() || !description.trim()}
            >
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