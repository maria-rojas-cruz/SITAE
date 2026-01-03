import { api } from "@/lib/api-client";

// ========== INTERFACES ==========

interface CreateResourceData {
  title: string;
  type: string;
  url: string;
  duration_minutes?: number | null;
  is_mandatory: boolean;
  order: number;
  topic_objective_id: string;
  difficulty: string
}

interface UpdateResourceData {
  title: string;
  type: string;
  url: string;
  duration_minutes?: number | null;
  is_mandatory: boolean;
  topic_objective_id: string;
  difficulty: string
}

// ========== SERVICE ==========

export const resourceService = {
  /**
   * Crear recurso
   */
  async createResource(topicId: string, data: CreateResourceData) {
    return api.post<{ id: string }>(`api/topics/${topicId}/resources`, data);
  },

  /**
   * Actualizar recurso
   */
  async updateResource(
    topicId: string,
    resourceId: string,
    data: UpdateResourceData
  ) {
    return api.put(`api/topics/${topicId}/resources/${resourceId}`, data);
  },

  /**
   * Eliminar recurso
   */
  async deleteResource(topicId: string, resourceId: string) {
    return api.delete(`api/topics/${topicId}/resources/${resourceId}`);
  },

  /**
   * Obtener recursos de un tema
   */
  async getResources(topicId: string) {
    return api.get(`api/topics/${topicId}/resources`);
  },
};