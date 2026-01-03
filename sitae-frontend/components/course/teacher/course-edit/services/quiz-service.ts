import { api } from "@/lib/api-client";

// ========== INTERFACES ==========

interface CreateQuizData {
  title: string;
  description?: string | null;
  time_minutes?: number | null;
  is_active: boolean;
}

interface UpdateQuizData {
  title: string;
  description?: string | null;
  time_minutes?: number | null;
  is_active: boolean;
}

// ========== SERVICE ==========

export const quizService = {
  /**
   * Crear quiz
   */
  async createQuiz(topicId: string, data: CreateQuizData) {
    return api.post<{ id: string }>(`api/topics/${topicId}/quizzes`, data);
  },

  /**
   * Actualizar quiz
   */
  async updateQuiz(topicId: string, quizId: string, data: UpdateQuizData) {
    return api.put(`api/topics/${topicId}/quizzes/${quizId}`, data);
  },

  /**
   * Eliminar quiz
   */
  async deleteQuiz(topicId: string, quizId: string) {
    return api.delete(`api/topics/${topicId}/quizzes/${quizId}`);
  },

  /**
   * Obtener quizzes de un tema
   */
  async getQuizzes(topicId: string) {
    return api.get(`api/topics/${topicId}/quizzes`);
  },
};