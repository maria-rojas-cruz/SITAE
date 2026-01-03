// components/course-edit/topics-manager.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/ui/use-toast";
import { api } from "@/lib/api-client";
import { Topic } from "@/types/course-content";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { CreateTopicSheet } from "./topics/CreateTopicSheet";

interface TopicsManagerProps {
  moduleId: string;
  topics: Topic[];
  onUpdate: () => void;
}

export function TopicsManager({
  moduleId,
  topics,
  onUpdate,
}: TopicsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: topics.length + 1,
  });
  const { toast } = useToast();

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const handleAdd = async () => {
    try {
      await api.post(`api/modules/${moduleId}/topics`, formData);
      toast({ title: "Tema agregado correctamente" });
      setIsAdding(false);
      setFormData({ title: "", description: "", order: topics.length + 2 });
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
      await api.put(`api/modules/${moduleId}/topics/${id}`, formData);
      toast({ title: "Tema actualizado" });
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
    if (!confirm("¿Eliminar este tema y todos sus recursos?")) return;

    try {
      await api.delete(`api/modules/${moduleId}/topics/${id}`);
      toast({ title: "Tema eliminado" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setFormData({
      title: topic.title,
      description: topic.description || "",
      order: topic.order,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm">Temas</h5>

        <CreateTopicSheet
          moduleId={module.id}
          moduleObjectives={[]}
          onCreated={onUpdate}
        />
      </div>

      <div className="space-y-2">
        {topics.map((topic) => (
          <div key={topic.id} className="border rounded-lg p-3 bg-muted/30">
            {editingId === topic.id ? (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Título *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEdit(topic.id)} size="sm">
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleTopic(topic.id)}
                        className="hover:bg-muted rounded p-1"
                      >
                        {expandedTopics.has(topic.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      <h6 className="font-medium text-sm">{topic.title}</h6>
                    </div>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground mt-1 ml-7">
                        {topic.description}
                      </p>
                    )}
                      {topic.objectives && (
                      <p className="text-xs text-muted-foreground mt-1 ml-7">
                        {topic.order}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => startEdit(topic)}
                      size="sm"
                      variant="ghost"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(topic.id)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {expandedTopics.has(topic.id) && (
                  <div className="ml-7 mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground mb-2">
                      Recursos: {topic.resources.length} | Quizzes:{" "}
                      {topic.quizzes.length}
                    </div>
                    <p className="text-xs text-muted-foreground italic">
                      (Gestión completa de recursos y quizzes próximamente)
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {topics.length === 0 && !isAdding && (
        <p className="text-xs text-center text-muted-foreground py-4">
          No hay temas. Agrega uno para empezar.
        </p>
      )}
    </div>
  );
}
