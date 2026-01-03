// hooks/useCourseContent.ts
import useSWR from 'swr';
import { CourseContent } from '@/types/course-content';

export function useCourseContent(courseId: string) {
  const { data, error, mutate, isLoading } = useSWR<CourseContent>(
    courseId ? `api/courses/${courseId}/content` : null
  );

  return {
    course: data,
    isLoading,
    error,
    isTeacher: data?.role === 'teacher',
    isStudent: data?.role === 'student',
    refresh: mutate,
  };
}