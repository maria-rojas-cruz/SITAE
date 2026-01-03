// components/course-edit/modules/hooks/useCreateModule.ts
"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

interface ModuleObjective {
  description: string;
  learning_outcomes: string[];
}

interface CreateModuleData {
  name: string;
  description: string;
  objectives: ModuleObjective[];
}

export function useCreateModule(courseId: string) {
  const [isLoading, setIsLoading] = useState(false);

  const createModule = async (data: CreateModuleData) => {
    setIsLoading(true);
    try {
      const response = await api.post(`api/courses/${courseId}/modules`, data);
      toast.success("Módulo creado correctamente");
      return response;
    } catch (error: any) {
      toast.error(error.message || "No se pudo crear el módulo");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { createModule, isLoading };
}
