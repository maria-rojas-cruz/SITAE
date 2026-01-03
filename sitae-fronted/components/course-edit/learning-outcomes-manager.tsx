// components/course-edit/learning-outcomes-manager.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { LearningOutcome } from "@/types/course-content";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface LearningOutcomesManagerProps {
  courseId: string;
  outcomes: LearningOutcome[];
  onUpdate: () => void;
}

export function LearningOutcomesManager({ courseId, outcomes, onUpdate }: LearningOutcomesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    bloom_level: "",
    order: outcomes.length + 1,
  });
  const { toast } = useToast();

  const handleAdd = async () => {
    try {
      await api.post(`api/courses/${courseId}/learning-outcomes`, formData);
      toast({ title: "Resultado agregado correctamente" });
      setIsAdding(false);
      setFormData({ code: "", description: "", bloom_level: "", order: outcomes.length + 2 });
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
      await api.put(`api/courses/${courseId}/learning-outcomes/${id}`, formData);
      toast({ title: "Resultado actualizado" });
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

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await api.delete(`api/courses/${courseId}/learning-outcomes/${deleteId}`);
      toast({ title: "Resultado eliminado" });
      setDeleteId(null);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (outcome: LearningOutcome) => {
    setEditingId(outcome.id);
    setFormData({
      code: outcome.code,
      description: outcome.description,
      bloom_level: outcome.bloom_level || "",
      order: outcome.order,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Resultados de Aprendizaje</CardTitle>
            <CardDescription>
              Define los objetivos que los estudiantes alcanzarán
            </CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulario para agregar */}
        {isAdding && (
          <Card className="border-2 border-primary">
            <CardContent className="pt-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Código *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ej: RA1"
                  />
                </div>
                <div>
                  <Label>Nivel Bloom</Label>
                  <Input
                    value={formData.bloom_level}
                    onChange={(e) => setFormData({ ...formData, bloom_level: e.target.value })}
                    placeholder="Ej: Aplicar"
                  />
                </div>
              </div>
              <div>
                <Label>Descripción *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button
                  onClick={() => {
                    setIsAdding(false);
                    setFormData({ code: "", description: "", bloom_level: "", order: outcomes.length + 1 });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de outcomes */}
        <div className="space-y-2">
          {outcomes.map((outcome) => (
            <div key={outcome.id}>
              {editingId === outcome.id ? (
                <Card className="border-2 border-primary">
                  <CardContent className="pt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Código *</Label>
                        <Input
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Nivel Bloom</Label>
                        <Input
                          value={formData.bloom_level}
                          onChange={(e) => setFormData({ ...formData, bloom_level: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Descripción *</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleEdit(outcome.id)} size="sm">
                        <Check className="h-4 w-4 mr-2" />
                        Guardar
                      </Button>
                      <Button onClick={() => setEditingId(null)} size="sm" variant="outline">
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-start gap-3 flex-1">
                    <Badge variant="secondary">{outcome.code}</Badge>
                    <div className="flex-1">
                      <p className="text-sm">{outcome.description}</p>
                      {outcome.bloom_level && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {outcome.bloom_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => startEdit(outcome)}
                      size="sm"
                      variant="ghost"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setDeleteId(outcome.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {outcomes.length === 0 && !isAdding && (
          <p className="text-center text-muted-foreground py-8">
            No hay resultados de aprendizaje. Haz clic en "Agregar" para crear uno.
          </p>
        )}
      </CardContent>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar resultado de aprendizaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El resultado será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}