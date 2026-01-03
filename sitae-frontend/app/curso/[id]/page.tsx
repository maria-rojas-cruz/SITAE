import { AuthGuard } from "@/components/auth/auth-guard";
import { Header } from "@/components/layout/header";
import { CourseViewRouter } from "@/components/course/course-view-router";

interface CoursePageProps {
  params: {
    id: string;
  };
}

export default function CoursePage({ params }: CoursePageProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <CourseViewRouter courseId={params.id} />
        </main>
      </div>
    </AuthGuard>
  );
}