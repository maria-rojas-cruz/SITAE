// components/course-edit/modules/topics/hooks/useUpdateTopic.ts
"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface TopicObjectiveData {
  description: string;
  code?: string;
  order?: number;
  module_objective_ids: string[];
}

interface UpdateTopicData {
  title?: string;
  description?: string;
  order?: number;
  objectives?: TopicObjectiveData[]; // Opcional: si se envía, reemplaza todos
}

export function useUpdateTopic(moduleId: string, topicId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const updateTopic = async (data: UpdateTopicData) => {
    setIsLoading(true);
    try {
      // Llamada única - el backend maneja la lógica de reemplazo
      const response = await api.put(
        `/api/modules/${moduleId}/topics/${topicId}`,
        data
      );
      
      toast.success("Tema actualizado correctamente");
      return response;
    } catch (error: any) {
      toast.error(error.message || "No se pudo actualizar el tema");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateTopic, isLoading };
}
