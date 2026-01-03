// components/course-edit/modules/topics/hooks/useGetTopic.ts
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";

interface ModuleObjectiveRef {
  id: string;
  description: string;
  code?: string;
}

interface TopicObjective {
  id: string;
  description: string;
  code?: string;
  order: number;
  module_objectives: ModuleObjectiveRef[]; // ← YA INCLUIDO
}

interface TopicDetail {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  order: number;
  objectives: TopicObjective[];
}

export function useGetTopic(topicId: string | null) {
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId) {
      setTopic(null);
      return;
    }

    const fetchTopic = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // GET ya retorna con relaciones anidadas
        const response = await api.get(`/api/topics/${topicId}`);
        setTopic(response);
      } catch (err: any) {
        setError(err.message || "Error al cargar tema");
        setTopic(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  const refetch = () => {
    if (topicId) {
      const fetchTopic = async () => {
        setIsLoading(true);
        try {
          const response = await api.get(`/api/topics/${topicId}`);
          setTopic(response);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchTopic();
    }
  };

  return { topic, isLoading, error, refetch };
}