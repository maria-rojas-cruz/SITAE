// types/course.ts
export interface Course {
  id: number; // Backend usa int, no string
  title: string;
  description: string | null;
  created_at: string;
  role_id: number;
  role_name: string; // "estudiante" o "docente"
  enrolled_at: string;
}

export interface Module {
  id: number;
  title: string;
  description: string | null;
  order: number | null;
  topics: Topic[];
}

export interface Topic {
  id: number;
  title: string;
  description: string | null;
  order: number | null;
  resources: Resource[];
}

export interface Resource {
  id: number;
  title: string;
  content: string | null;
  resource_type: string | null; // 'video', 'reading', 'code', 'exercise'
  url: string | null;
}

export interface CourseStructure {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  modules: Module[];
}

export interface UserRoleInCourse {
  course_id: number;
  user_id: string;
  role_id: number;
  role_name: string;
}