"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { useCreateModule } from "./hooks/useCreateModule";
import { ObjectivesForm } from "./ObjectivesForm";
import { LearningOutcome } from "@/types/course-content";

interface CreateModuleSheetProps {
  courseId: string;
  outcomes: LearningOutcome[];
  onCreated: () => void;
}

export function CreateModuleSheet({ courseId, outcomes, onCreated }: CreateModuleSheetProps) {
  const { createModule, isLoading } = useCreateModule(courseId);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    objectives: [] as { description: string; learning_outcomes: string[] }[],
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) return alert("El nombre del módulo es obligatorio");
    if (formData.objectives.length === 0) return alert("Debe agregar al menos un objetivo");
    try {
      await createModule(formData);
      onCreated();
      setFormData({ name: "", description: "", objectives: [] });
      setOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Agregar módulo
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nuevo módulo</SheetTitle>
          <SheetDescription>
            Crea un módulo y define sus objetivos vinculados a los resultados de aprendizaje.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label>Nombre del módulo *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Módulo 1 - Fundamentos del cálculo"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <ObjectivesForm
            outcomes={outcomes}
            onChange={(objectives) => setFormData({ ...formData, objectives })}
          />
        </div>

        <SheetFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar módulo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
