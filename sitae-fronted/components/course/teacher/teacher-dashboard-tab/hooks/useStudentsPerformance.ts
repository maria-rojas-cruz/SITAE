import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { StudentPerformance } from "../types";

export function useStudentsPerformance(courseId: string) {
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<{ students: StudentPerformance[] }>(
          `api/statistics/courses/${courseId}/students`
        );
        setStudents(data.students || []);
      } catch (err) {
        console.error("Error loading students:", err);
        toast.error("Error al cargar los estudiantes");
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchStudents();
    }
  }, [courseId]);

  return { students, isLoading };
}