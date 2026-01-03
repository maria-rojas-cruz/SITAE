import { api } from "@/lib/api-client";

// ========== INTERFACES ==========

interface CreateModuleData {
  title: string;
  description?: string | null;
  order: number;
}

interface UpdateModuleData {
  title: string;
  description?: string | null;
}

interface CreateModuleObjectiveData {
  description: string;
  code?: string | null;
  order: number;
}

interface UpdateModuleObjectiveData {
  description: string;
  code?: string | null;
  order: number;
}

interface LinkLearningOutcomeData {
  learning_outcome_id: string;
  is_primary: boolean;
}

// ========== SERVICE ==========

export const moduleService = {
  // ==================== MÓDULOS ====================

  /**
   * Crear módulo
   */
  async createModule(courseId: string, data: CreateModuleData) {
    return api.post<{ id: string }>(`api/courses/${courseId}/modules`, data);
  },

  /**
   * Actualizar módulo
   */
  async updateModule(
    courseId: string,
    moduleId: string,
    data: UpdateModuleData
  ) {
    return api.put(`api/courses/${courseId}/modules/${moduleId}`, data);
  },

  /**
   * Eliminar módulo
   */
  async deleteModule(courseId: string, moduleId: string) {
    return api.delete(`api/courses/${courseId}/modules/${moduleId}`);
  },

  // ==================== OBJETIVOS DE MÓDULO ====================

  /**
   * Crear objetivo de módulo
   */
  async createObjective(moduleId: string, data: CreateModuleObjectiveData) {
    return api.post<{ id: string }>(`api/modules/${moduleId}/objectives`, data);
  },

  /**
   * Actualizar objetivo de módulo
   */
  async updateObjective(
    moduleId: string,
    objectiveId: string,
    data: UpdateModuleObjectiveData
  ) {
    return api.put(`api/modules/${moduleId}/objectives/${objectiveId}`, data);
  },

  /**
   * Eliminar objetivo de módulo
   */
  async deleteObjective(moduleId: string, objectiveId: string) {
    return api.delete(`api/modules/${moduleId}/objectives/${objectiveId}`);
  },

  // ==================== VÍNCULOS LEARNING OUTCOMES ====================

  /**
   * Obtener learning outcomes vinculados a un objetivo
   */
  async getLinkedLearningOutcomes(moduleId: string, objectiveId: string) {
    return api.get<Array<{ id: string }>>(
      `api/modules/${moduleId}/objectives/${objectiveId}/learning-outcomes`
    );
  },

  /**
   * Vincular learning outcome a objetivo
   */
  async linkLearningOutcome(
    moduleId: string,
    objectiveId: string,
    data: LinkLearningOutcomeData
  ) {
    return api.post(
      `api/modules/${moduleId}/objectives/${objectiveId}/learning-outcomes`,
      data
    );
  },

  /**
   * Desvincular learning outcome de objetivo
   */
  async unlinkLearningOutcome(
    moduleId: string,
    objectiveId: string,
    learningOutcomeId: string
  ) {
    return api.delete(
      `api/modules/${moduleId}/objectives/${objectiveId}/learning-outcomes/${learningOutcomeId}`
    );
  },
};