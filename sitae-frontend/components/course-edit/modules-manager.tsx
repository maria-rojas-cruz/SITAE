// components/course-edit/modules-manager.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { Module, Topic } from "@/types/course-content";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TopicsManager } from "./topics-manager";
import { CreateModuleSheet } from "./modules/CreateModuleSheet";

interface ModulesManagerProps {
  courseId: string;
  modules: Module[];
  onUpdate: () => void;
}

export function ModulesManager({
  courseId,
  modules,
  onUpdate,
}: ModulesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: modules.length + 1,
  });
  const { toast } = useToast();

  const handleAdd = async () => {
    try {
      await api.post(`api/courses/${courseId}/modules`, formData);
      toast({ title: "Módulo agregado correctamente" });
      setIsAdding(false);
      setFormData({ title: "", description: "", order: modules.length + 2 });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (id: string) => {
    try {
      await api.put(`api/courses/${courseId}/modules/${id}`, formData);
      toast({ title: "Módulo actualizado" });
      setEditingId(null);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar este módulo? Se eliminarán todos sus temas y recursos."
      )
    ) {
      return;
    }

    try {
      await api.delete(`api/courses/${courseId}/modules/${id}`);
      toast({ title: "Módulo eliminado" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (module: Module) => {
    setEditingId(module.id);
    setFormData({
      title: module.title,
      description: module.description || "",
      order: module.order,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Módulos del Curso</h3>
          <p className="text-sm text-muted-foreground">
            Organiza el contenido en módulos y temas
          </p>
        </div>
        <CreateModuleSheet
          courseId={courseId}
          outcomes={[]}
          onCreated={onUpdate}
        />
       {/* <Button onClick={() => setIsAdding(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Módulo
        </Button> */}
      </div>

      {/* Formulario para agregar */}
      {isAdding && (
        <Card className="border-2 border-primary">
          <CardContent className="pt-6 space-y-3">
            <div>
              <Label>Título del módulo *</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ej: Módulo 1: Introducción"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                placeholder="Descripción del módulo..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} size="sm">
                Guardar
              </Button>
              <Button
                onClick={() => {
                  setIsAdding(false);
                  setFormData({
                    title: "",
                    description: "",
                    order: modules.length + 1,
                  });
                }}
                size="sm"
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de módulos */}
      <Accordion type="single" collapsible className="space-y-4">
        {modules.map((module) => (
          <AccordionItem
            key={module.id}
            value={module.id}
            className="border rounded-lg"
          >
            <div className="p-4">
              {editingId === module.id ? (
                <div className="space-y-3">
                  <div>
                    <Label>Título del módulo *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEdit(module.id)} size="sm">
                      Guardar
                    </Button>
                    <Button
                      onClick={() => setEditingId(null)}
                      size="sm"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold">{module.title}</h4>
                      {module.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {module.topics.length} tema
                          {module.topics.length !== 1 ? "s" : ""}
                        </Badge>
                        <Badge variant="outline">
                          {module.objectives.length} objetivo
                          {module.objectives.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => startEdit(module)}
                        size="sm"
                        variant="ghost"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(module.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <AccordionTrigger className="hover:no-underline">
                    <span className="text-sm text-muted-foreground">
                      Ver temas y contenido
                    </span>
                    
                  </AccordionTrigger>
                </>
              )}
            </div>

            <AccordionContent>
              <div className="px-4 pb-4 border-t pt-4">
                <TopicsManager
                  moduleId={module.id}
                  topics={module.topics}
                  onUpdate={onUpdate}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {modules.length === 0 && !isAdding && (
        <p className="text-center text-muted-foreground py-8">
          No hay módulos. Haz clic en "Nuevo Módulo" para crear uno.
        </p>
      )}
    </div>
  );
}
