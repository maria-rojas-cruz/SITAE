import { api } from "@/lib/api-client";

// ========== INTERFACES ==========

interface CreateTopicData {
  title: string;
  description?: string | null;
  order: number;
}

interface UpdateTopicData {
  title: string;
  description?: string | null;
}

interface CreateTopicObjectiveData {
  description: string;
  code?: string | null;
  order: number;
}

interface UpdateTopicObjectiveData {
  description: string;
  code?: string | null;
  order: number;
}

interface LinkModuleObjectiveData {
  module_objective_id: string;
  is_primary: boolean;
}

// ========== SERVICE ==========

export const topicService = {
  // ==================== TEMAS ====================

  /**
   * Crear tema
   */
  async createTopic(moduleId: string, data: CreateTopicData) {
    return api.post<{ id: string }>(`api/modules/${moduleId}/topics`, data);
  },

  /**
   * Actualizar tema
   */
  async updateTopic(moduleId: string, topicId: string, data: UpdateTopicData) {
    return api.put(`api/modules/${moduleId}/topics/${topicId}`, data);
  },

  /**
   * Eliminar tema
   */
  async deleteTopic(moduleId: string, topicId: string) {
    return api.delete(`api/modules/${moduleId}/topics/${topicId}`);
  },

  // ==================== OBJETIVOS DE TEMA ====================

  /**
   * Crear objetivo de tema
   */
  async createObjective(topicId: string, data: CreateTopicObjectiveData) {
    return api.post<{ id: string }>(`api/topics/${topicId}/objectives`, data);
  },

  /**
   * Actualizar objetivo de tema
   */
  async updateObjective(
    topicId: string,
    objectiveId: string,
    data: UpdateTopicObjectiveData
  ) {
    return api.put(`api/topics/${topicId}/objectives/${objectiveId}`, data);
  },

  /**
   * Eliminar objetivo de tema
   */
  async deleteObjective(topicId: string, objectiveId: string) {
    return api.delete(`api/topics/${topicId}/objectives/${objectiveId}`);
  },

  // ==================== VÍNCULOS MODULE OBJECTIVES ====================

  /**
   * Obtener module objectives vinculados a un objetivo de tema
   */
  async getLinkedModuleObjectives(topicId: string, objectiveId: string) {
    return api.get<Array<{ id: string }>>(
      `api/topics/${topicId}/objectives/${objectiveId}/module-objectives`
    );
  },

  /**
   * Vincular module objective a objetivo de tema
   */
  async linkModuleObjective(
    topicId: string,
    objectiveId: string,
    data: LinkModuleObjectiveData
  ) {
    return api.post(
      `api/topics/${topicId}/objectives/${objectiveId}/module-objectives`,
      data
    );
  },

  /**
   * Desvincular module objective de objetivo de tema
   */
  async unlinkModuleObjective(
    topicId: string,
    objectiveId: string,
    moduleObjectiveId: string
  ) {
    return api.delete(
      `api/topics/${topicId}/objectives/${objectiveId}/module-objectives/${moduleObjectiveId}`
    );
  },
};