import { useMemo } from "react";
import type { ProfileData } from "../types";

export function useProfileCompleteness(profileData: ProfileData) {
  const completeness = useMemo(() => {
    const checks = [
      profileData.career,
      profileData.job_role,
      profileData.preferred_modalities.length > 0,
      profileData.prereq_level,
      profileData.weekly_time,
      profileData.goals.length > 0,
      profileData.interests.length > 0,
      profileData.devices.length > 0,
    ];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [profileData]);

  const courseProgress = useMemo(() => {
    return [
      profileData.prereq_level,
      profileData.weekly_time,
      profileData.goals.length > 0,
    ].filter(Boolean).length;
  }, [profileData]);

  const academicProgress = useMemo(() => {
    return [
      profileData.career,
      profileData.job_role,
      profileData.preferred_modalities.length > 0,
      profileData.interests.length > 0,
      profileData.devices.length > 0,
    ].filter(Boolean).length;
  }, [profileData]);

  return { completeness, courseProgress, academicProgress };
}