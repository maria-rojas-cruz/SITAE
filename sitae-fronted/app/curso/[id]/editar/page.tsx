// app/curso/[id]/editar/page.tsx
import { AuthGuard } from "@/components/auth/auth-guard";
import { Header } from "@/components/layout/header";
//import { CourseEdit } from "@/components/course-edit/course-edit";

interface CourseEditPageProps {
  params: {
    id: string;
  };
}

export default function CourseEditPage({ params }: CourseEditPageProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />{/** 
        <main className="container mx-auto">
          <CourseEdit courseId={params.id} />
        </main>*/}

        <h4>COMPONENTE PRUEBASAAAAAAAA</h4>
      </div>
    </AuthGuard>
  );
}