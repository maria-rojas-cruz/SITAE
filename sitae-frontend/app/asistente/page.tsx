import { AuthGuard } from "@/components/auth/auth-guard";
import { Header } from "@/components/layout/header";
import { AIAssistant } from "@/components/ai/ai-assistant";

export default function AssistantPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto p-4 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Asistente IA
            </h1>
            <p className="text-muted-foreground">
              Tu tutor personal disponible 24/7 para ayudarte con todos tus
              cursos
            </p>
          </div>

          <AIAssistant courseId="general" courseName="Asistente General" />
        </main>
      </div>
    </AuthGuard>
  );
}
