import { AuthGuard } from "@/components/auth/auth-guard";
import { Header } from "@/components/layout/header";
import { StudentCourseView } from "@/components/course/student/student-course-view";

export default function StudentPreviewPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <StudentCourseView courseId={params.id} isPreview={true} />
        </main>
      </div>
    </AuthGuard>
  );
}