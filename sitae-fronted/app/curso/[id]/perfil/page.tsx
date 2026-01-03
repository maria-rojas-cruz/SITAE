"use client";

import { StudentProfile } from "@/components/course/student/profile/student-profile";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [key, setKey] = useState(0);

  // Forzar re-render del componente cada vez que la página se monta
  useEffect(() => {
    setKey((prev) => prev + 1);
  }, []);

  return (
    <StudentProfile
      key={key}
      courseId={params.id}
      courseName=""
      onBack={() => router.back()}
    />
  );
}