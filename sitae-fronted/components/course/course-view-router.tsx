"use client";

import { useCourseContent } from "@/hooks/course/useCourseContent";
import { StudentCourseView } from "./student/student-course-view";
import { TeacherCourseView } from "./teacher/teacher-course-view";
import { Loader2 } from "lucide-react";

interface CourseViewRouterProps {
  courseId: string;
}

export function CourseViewRouter({ courseId }: CourseViewRouterProps) {
  const { isLoading, isTeacher } = useCourseContent(courseId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return isTeacher ? (
    <TeacherCourseView courseId={courseId} />
  ) : (
    <StudentCourseView courseId={courseId} />
  );
}