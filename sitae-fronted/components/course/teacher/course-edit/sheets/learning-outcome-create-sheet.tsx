"use client";

import { useState } from "react";
import { useSWRConfig } from "swr"; // ← AGREGAR
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
import { Plus, Loader2 } from "lucide-react";
import { learningOutcomeService } from "../services/learning-outcome-service";
import { api } from "@/lib/api-client";

interface LearningOutcomeCreateSheetProps {
  courseId: string;
  nextOrder: number;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function LearningOutcomeCreateSheet({
  courseId,
  nextOrder,
  onSuccess,
  trigger,
}: LearningOutcomeCreateSheetProps) {
  const { mutate } = useSWRConfig(); // ← AGREGAR
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [bloomLevel, setBloomLevel] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await learningOutcomeService.createLearningOutcome(courseId, {
        code,
        description,
        bloom_level: bloomLevel || null,
        order: nextOrder,
      });

      // Reset
      setCode("");
      setDescription("");
      setBloomLevel("");
      setOpen(false);

      
      
      api.clearCache(`courses/${courseId}`);
      await mutate(`/api/courses/${courseId}/edit-data`);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating learning outcome:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agregar RA
          </Button>
        )}
      </SheetTrigger>

      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nuevo Resultado de Aprendizaje</SheetTitle>
          <SheetDescription>
            Define un objetivo principal que los estudiantes deben alcanzar
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: RA1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Comprender los conceptos fundamentales del cálculo diferencial"
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
                "Crear Resultado"
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}