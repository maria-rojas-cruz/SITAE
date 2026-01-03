import { api } from "@/lib/api-client";

interface CreateLearningOutcomeData {
  code: string;
  description: string;
  bloom_level?: string | null;
  order: number;
}

interface UpdateLearningOutcomeData {
  code: string;
  description: string;
  bloom_level?: string | null;
}

export const learningOutcomeService = {
  /**
   * Crear resultado de aprendizaje
   */
  async createLearningOutcome(
    courseId: string,
    data: CreateLearningOutcomeData
  ) {
    return api.post<{ id: string }>(
      `api/courses/${courseId}/learning-outcomes`,
      data
    );
  },

  /**
   * Actualizar resultado de aprendizaje
   */
  async updateLearningOutcome(
    courseId: string,
    outcomeId: string,
    data: UpdateLearningOutcomeData
  ) {
    return api.put(
      `api/courses/${courseId}/learning-outcomes/${outcomeId}`,
      data
    );
  },

  /**
   * Eliminar resultado de aprendizaje (si existe)
   */
  async deleteLearningOutcome(courseId: string, outcomeId: string) {
    return api.delete(`api/courses/${courseId}/learning-outcomes/${outcomeId}`);
  },

  /**
   * Obtener resultados de aprendizaje de un curso
   */
  async getLearningOutcomes(courseId: string) {
    return api.get(`api/courses/${courseId}/learning-outcomes`);
  },
};