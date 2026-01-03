"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCourseEditData } from "@/hooks/course/useCourseEditData";
import { CourseInfoSection } from "./sections/course-info-section";
import { LearningOutcomesSection } from "./sections/learning-outcomes-section";
import { ModulesSection } from "./sections/modules-section";
import type { CourseContent } from "@/types/course-content";

interface TeacherLessonsTabProps {
  course: CourseContent;
  courseId: string;
}

export function TeacherLessonsTab({ course, courseId }: TeacherLessonsTabProps) {
  const { editData, isLoading, error, refresh } = useCourseEditData(courseId);

  const getNextLearningOutcomeOrder = () => {
    if (!editData?.learning_outcomes || editData.learning_outcomes.length === 0)
      return 1;
    return Math.max(...editData.learning_outcomes.map((lo) => lo.order)) + 1;
  };

  const getNextModuleOrder = () => {
    if (!editData?.modules || editData.modules.length === 0) return 1;
    return Math.max(...editData.modules.map((m) => m.order)) + 1;
  };

  const getNextTopicOrder = (moduleId: string) => {
    const module = editData?.modules.find((m) => m.id === moduleId);
    if (!module?.topics || module.topics.length === 0) return 1;
    return Math.max(...module.topics.map((t) => t.order)) + 1;
  };

  const getNextResourceOrder = (topicId: string) => {
    const topic = editData?.modules
      .flatMap((m) => m.topics)
      .find((t) => t.id === topicId);
    if (!topic?.resources || topic.resources.length === 0) return 1;
    return Math.max(...topic.resources.map((r) => r.order)) + 1;
  };

  const handleSuccess = (message: string) => {
    toast.success(message);
    refresh();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !editData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Error al cargar datos de edición</p>
        <Button onClick={() => refresh()} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CourseInfoSection
        courseId={courseId}
        courseName={editData.name}
        courseCode={editData.code}
        courseDescription={editData.description}
        teachers={course.teachers}
        onSuccess={() => handleSuccess("Información del curso actualizada")}
      />

      <LearningOutcomesSection
        courseId={courseId}
        learningOutcomes={editData.learning_outcomes}
        nextOrder={getNextLearningOutcomeOrder()}
        onSuccess={() => handleSuccess("Resultado de aprendizaje actualizado")}
      />

      <ModulesSection
        courseId={courseId}
        modules={editData.modules}
        learningOutcomes={editData.learning_outcomes}
        getNextModuleOrder={getNextModuleOrder}
        getNextTopicOrder={getNextTopicOrder}
        getNextResourceOrder={getNextResourceOrder}
        onSuccess={() => handleSuccess("Cambios guardados exitosamente")}
      />
    </div>
  );
}