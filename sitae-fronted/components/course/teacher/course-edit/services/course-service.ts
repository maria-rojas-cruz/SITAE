import { api } from "@/lib/api-client";

interface UpdateCourseData {
  name: string;
  code?: string | null;
  description?: string | null;
}

export const courseService = {
  /**
   * Actualizar información general del curso
   */
  async updateCourse(courseId: string, data: UpdateCourseData) {
    return api.put(`api/courses/${courseId}`, data);
  },

  /**
   * Obtener curso (si lo usas en algún lado)
   */
  async getCourse(courseId: string) {
    return api.get(`api/courses/${courseId}`);
  },
};