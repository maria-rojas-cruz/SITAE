/*"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CreateTopicSheet } from "./CreateTopicSheet";
import { EditTopicSheet } from "./EditTopicSheet";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/ui/use-toast";

interface Topic {
  id: string;
  name: string;
  description?: string;
  order?: number;
  objectives?: { id: string; description: string }[];
}

interface TopicsManagerProps {
  moduleId: string;
  topics: Topic[];
  moduleObjectives: { id: string; description: string }[];
  onUpdate: () => void;
}

export function TopicsManager({ moduleId, topics, moduleObjectives, onUpdate }: TopicsManagerProps) {
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/modules/${moduleId}/topics/${id}`);
      toast({ title: "Tema eliminado correctamente" });
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-slate-900">Temas del módulo</h4>
        <CreateTopicSheet
          moduleId={moduleId}
          moduleObjectives={moduleObjectives}
          onCreated={onUpdate}
        />
      </div>

      {topics.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No hay temas registrados. Agrega uno nuevo para comenzar.
        </p>
      )}

      {topics.map((topic) => (
        <Card
          key={topic.id}
          className="border border-slate-200 hover:shadow-sm transition-shadow"
        >
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-slate-900">{topic.name}</p>
                {topic.description && (
                  <p className="text-sm text-slate-600 mt-1">{topic.description}</p>
                )}
                {topic.order && (
                  <p className="text-xs text-slate-500 mt-1">Orden: {topic.order}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingTopic(topic)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeletingId(topic.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>

            {topic.objectives?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {topic.objectives.map((obj) => (
                  <Badge key={obj.id} variant="secondary">
                    🎯 {obj.description}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Sheet de edición 
      {editingTopic && (
        <EditTopicSheet
          topic={editingTopic}
          moduleId={moduleId}
          moduleObjectives={moduleObjectives}
          onUpdated={() => {
            setEditingTopic(null);
            onUpdate();
          }}
          onClose={() => setEditingTopic(null)}
        />
      )}
    </div>
  );
}
*/