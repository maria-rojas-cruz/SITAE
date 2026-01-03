// components/course-edit/modules/topics/hooks/useCreateTopic.ts
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

interface CreateTopicData {
  title: string;
  description?: string;
  order?: number;
  objectives: TopicObjectiveData[];
}

export function useCreateTopic(moduleId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const createTopic = async (data: CreateTopicData) => {
    setIsLoading(true);
    try {
      // Llamada única con todo anidado
      const response = await api.post(
        `/api/modules/${moduleId}/topics`,
        data
      );
      
      toast.success("Tema creado correctamente");
      return response; // Ya incluye objectives con module_objectives
    } catch (error: any) {
      toast.error(error.message || "No se pudo crear el tema");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createTopic, isLoading };
}