// hooks/use-chat.ts
import { useState, useCallback } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export interface Source {
  document_id: string;
  document_title: string;
  document_type: string;
  chunk_text: string;
  relevance_score: number;
}

export interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Source[];
  isLoading?: boolean;
}

interface ChatHistoryResponse {
  course_id: string;
  conversations: Array<{
    id: string;
    message: string;
    response: string;
    created_at: string;
    sources: Source[];
  }>;
  total: number;
}

interface ChatMessageResponse {
  conversation_id: string;
  message: string;
  response: string;
  sources: Source[];
  created_at: string;
  tokens_used: number;
}

export function useChat(courseId: string, courseName: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Load chat history from server
  const loadHistory = useCallback(async () => {
    if (isHistoryLoaded) return;

    try {
      setIsLoadingHistory(true);
      const response = await api.get<ChatHistoryResponse>(
        `api/chat/${courseId}/history?limit=50`
      );

      if (response.conversations && response.conversations.length > 0) {
        const historyMessages: Message[] = [];
        response.conversations.reverse().forEach((conv) => {
          historyMessages.push({
            id: `user-${conv.id}`,
            type: "user",
            content: conv.message,
            timestamp: new Date(conv.created_at),
          });
          historyMessages.push({
            id: `assistant-${conv.id}`,
            type: "assistant",
            content: conv.response,
            timestamp: new Date(conv.created_at),
            sources: conv.sources || [],
          });
        });

        setMessages(historyMessages);
      } else {
        setMessages([
          {
            id: "welcome",
            type: "assistant",
            content: `¡Hola! Soy tu asistente para el curso de ${courseName}. Puedo ayudarte con explicaciones de conceptos, resolución de ejercicios, recomendaciones de recursos y preparación para evaluaciones. ¿En qué te puedo ayudar hoy?`,
            timestamp: new Date(),
          },
        ]);
      }
      setIsHistoryLoaded(true);
    } catch (err) {
      console.error("Error cargando historial:", err);
      setMessages([
        {
          id: "welcome",
          type: "assistant",
          content: `¡Hola! Soy tu asistente para el curso de ${courseName}. ¿En qué te puedo ayudar hoy?`,
          timestamp: new Date(),
        },
      ]);
      setIsHistoryLoaded(true);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [courseId, courseName, isHistoryLoaded]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      const loadingMessage: Message = {
        id: `loading-${Date.now()}`,
        type: "assistant",
        content: "",
        timestamp: new Date(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, loadingMessage]);

      try {
        const response = await api.post<ChatMessageResponse>(
          `api/chat/${courseId}/message`,
          {
            message: content.trim(),
            include_history: true,
          }
        );

        const assistantMessage: Message = {
          id: response.conversation_id,
          type: "assistant",
          content: response.response,
          timestamp: new Date(response.created_at),
          sources: response.sources || [],
        };

        setMessages((prev) =>
          prev.filter((msg) => !msg.isLoading).concat([assistantMessage])
        );
      } catch (err: any) {
        const errorMessage =
          err.message ||
          "No pude responder en este momento. Por favor, intenta reformular tu pregunta.";
        setError(errorMessage);
        setMessages((prev) => prev.filter((msg) => !msg.isLoading));
        toast.error("Error", {
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [courseId, isLoading]
  );

  const clearHistory = useCallback(async () => {
    try {
      await api.delete(`api/chat/${courseId}/history`);
      setMessages([
        {
          id: "welcome",
          type: "assistant",
          content: `Historial borrado. ¿En qué te puedo ayudar?`,
          timestamp: new Date(),
        },
      ]);
      setIsHistoryLoaded(false);
      toast.success("Historial borrado exitosamente");
    } catch (err) {
      toast.error("Error al borrar el historial");
    }
  }, [courseId]);

  const retry = useCallback(() => {
    setError(null);
    const lastUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.type === "user");
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearHistory,
    retry,
    loadHistory,
  };
}
