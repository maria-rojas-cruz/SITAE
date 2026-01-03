import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { ProfileData, ProfileResponse } from "../types";

export function useStudentProfile(courseId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    career: "",
    job_role: "",
    preferred_modalities: [],
    prereq_level: "",
    weekly_time: "",
    goals: [],
    interests: [],
    interest_other: "",
    devices: [],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const data = await api.get<ProfileResponse>(
          `api/profile/course/${courseId}`
        );

        if (data.learning_profile) {
          setProfileData((prev) => ({
            ...prev,
            career: data.learning_profile.career || "",
            job_role: data.learning_profile.job_role || "",
            preferred_modalities: data.learning_profile.preferred_modalities || [],
            interests: data.learning_profile.interests || [],
            interest_other: data.learning_profile.interest_other || "",
            devices: data.learning_profile.devices || [],
          }));
        }

        if (data.course_profile) {
          setProfileData((prev) => ({
            ...prev,
            goals: data.course_profile.goals || [],
            prereq_level: data.course_profile.prereq_level || "",
            weekly_time: data.course_profile.weekly_time || "",
          }));
        }
      } catch (error) {
        toast.error("Error al cargar el perfil");
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (courseId) {
      fetchProfile();
    }
  }, [courseId]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.post(`api/profile/course/${courseId}`, profileData);
      toast.success("Perfil actualizado exitosamente");
    } catch (error) {
      toast.error("Error al guardar el perfil");
    } finally {

      setIsLoading(false);
      
    }
  };

  const handleCheckboxChange = (
    field: keyof ProfileData,
    value: string,
    checked: boolean
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter((item) => item !== value),
    }));
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    profileData,
    isLoading,
    isLoadingProfile,
    handleSave,
    handleCheckboxChange,
    updateField,
  };
}