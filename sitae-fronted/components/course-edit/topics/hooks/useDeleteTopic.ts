// components/course-edit/modules/topics/hooks/useDeleteTopic.ts
"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function useDeleteTopic(moduleId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const deleteTopic = async (topicId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/api/modules/${moduleId}/topics/${topicId}`);
      toast.success("Tema eliminado correctamente");
    } catch (error: any) {
      toast.error(error.message || "No se pudo eliminar el tema");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteTopic, isLoading };
}