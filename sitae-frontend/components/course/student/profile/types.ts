export interface StudentProfileProps {
  courseId: string;
  courseName: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export interface ProfileData {
  career: string;
  job_role: string;
  preferred_modalities: string[];
  prereq_level: string;
  weekly_time: string;
  goals: string[];
  interests: string[];
  interest_other: string;
  devices: string[];
}

export interface ProfileResponse {
  user_id: string;
  course_id: string;
  learning_profile: Partial<ProfileData>;
  course_profile: Partial<ProfileData>;
}