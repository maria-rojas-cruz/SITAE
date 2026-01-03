// components/course-edit/option-manager.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { ArrowLeft, Plus, Trash2, Check, X } from "lucide-react";

interface Option {
  id: string;
  text: string;
  is_correct: boolean;
  feedback?: string;
}

interface OptionManagerProps {
  questionId: string;
  onBack: () => void;
}

export function OptionManager({ questionId, onBack }: OptionManagerProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    text: "",
    is_correct: false,
    feedback: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOptions();
  }, [questionId]);

  const loadOptions = async () => {
    try {
      const response = await api.get(`api/questions/${questionId}/options`);
      setOptions(response.options || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las opciones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.text.trim()) {
      toast({
        title: "Error",
        description: "El texto de la opción es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.post(`api/questions/${questionId}/options`, {
        text: formData.text,
        is_correct: formData.is_correct,
        feedback: formData.feedback || null,
      });

      toast({ title: "Opción agregada" });
      setIsAdding(false);
      setFormData({ text: "", is_correct: false, feedback: "" });
      loadOptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (optionId: string) => {
    try {
      await api.delete(`api/questions/${questionId}/options/${optionId}`);
      toast({ title: "Opción eliminada" });
      loadOptions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const correctCount = options.filter(o => o.is_correct).length;

  return (
    <div className="space-y-4">
      <Button onClick={onBack} size="sm" variant="ghost">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver a preguntas
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Opciones de respuesta</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {correctCount > 0 ? (
                  <Badge variant="default" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    {correctCount} correcta(s)
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Sin respuesta correcta
                  </Badge>
                )}
              </p>
            </div>
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Opción
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isAdding && (
            <Card className="border-2 border-green-500">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label className="text-sm">Texto de la opción *</Label>
                  <Textarea
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    rows={2}
                    placeholder="Escribe la opción de respuesta"
                  />
                </div>

                <div>
                  <Label className="text-sm">Retroalimentación (opcional)</Label>
                  <Input
                    value={formData.feedback}
                    onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                    placeholder="Mensaje al seleccionar esta opción"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t">
                  <Label className="text-sm font-semibold">¿Es la respuesta correcta?</Label>
                  <Switch
                    checked={formData.is_correct}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_correct: checked })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAdd} size="sm">Guardar</Button>
                  <Button onClick={() => setIsAdding(false)} size="sm" variant="outline">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay opciones. Agrega al menos 2 opciones (1 correcta).
            </p>
          ) : (
            options.map((option, index) => (
              <div
                key={option.id}
                className={`border rounded-lg p-3 ${
                  option.is_correct ? "bg-green-50 border-green-300" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">
                        {String.fromCharCode(65 + index)}
                      </Badge>
                      {option.is_correct && (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Correcta
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{option.text}</p>
                    {option.feedback && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        Feedback: {option.feedback}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDelete(option.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}