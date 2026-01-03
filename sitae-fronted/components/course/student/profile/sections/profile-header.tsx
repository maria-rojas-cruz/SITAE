import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface ProfileHeaderProps {
  onBack: () => void;
}

export function ProfileHeader({ onBack }: ProfileHeaderProps) {
  return (
    <div className="mb-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al curso
      </Button>
      <h1 className="text-2xl font-bold mb-2">Mi perfil de aprendizaje</h1>
      <p className="text-muted-foreground">
        Completa tu información para personalizar tu experiencia en este curso
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        Tus respuestas nos ayudarán a adaptar el contenido a tu estilo de
        aprendizaje
      </p>
    </div>
  );
}