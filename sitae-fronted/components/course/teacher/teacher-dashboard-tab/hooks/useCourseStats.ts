import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import type { CourseStatistics } from "../types";

export function useCourseStats(courseId: string) {
  const [courseStats, setCourseStats] = useState<CourseStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCourseStats = async () => {
      try {
        setIsLoading(true);
        const data = await api.get<CourseStatistics>(
          `api/statistics/courses/${courseId}`
        );
        setCourseStats(data);
      } catch (err) {
        console.error("Error loading course statistics:", err);
        toast.error("Error al cargar las estadísticas del curso");
        throw err;
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourseStats();
    }
  }, [courseId]);

  const quizParticipationRate =
    courseStats?.quiz_participation_rate ||
    (courseStats && courseStats.total_students > 0
      ? (courseStats.active_students_last_week / courseStats.total_students) * 100
      : 0);

  const averageObjectivesAchievement =
    courseStats?.average_objectives_achievement || 0;

  return {
    courseStats,
    isLoading,
    quizParticipationRate,
    averageObjectivesAchievement,
  };
}