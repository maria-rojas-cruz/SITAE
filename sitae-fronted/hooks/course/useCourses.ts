// hooks/useCourses.ts
import useSWR from 'swr';
import { api } from '@/lib/api-client';

interface Course {
  id: string; 
  name: string;  
  code?: string;  
  description?: string;  
  progress?: number;  
  role?: string; 
  created_at?: string;
}

interface CoursesResponse {
  courses: Course[];
  total: number;
}

export function useCourses() {
  const { data, error, mutate, isLoading } = useSWR<CoursesResponse>(
    'api/courses/my-courses'
  );

  const createCourse = async (courseData: Partial<Course>) => {
    const newCourse = await api.post('api/courses', courseData);
    mutate();
    return newCourse;
  };

  const updateCourse = async (id: string, courseData: Partial<Course>) => {
    const updated = await api.put(`api/courses/${id}`, courseData);
    mutate();
    return updated;
  };

  const deleteCourse = async (id: string) => {
    await api.delete(`api/courses/${id}`);
    mutate();
  };

  return {
    courses: data?.courses || [],  
    total: data?.total || 0,  
    isLoading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    refresh: mutate,
  };
}