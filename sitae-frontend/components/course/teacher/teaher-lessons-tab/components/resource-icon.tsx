import { Play, FileText, Code, BookOpen } from "lucide-react";

interface ResourceIconProps {
  type: string;
}

export function ResourceIcon({ type }: ResourceIconProps) {
  const iconClass = "h-4 w-4 text-slate-500";

  switch (type.toLowerCase()) {
    case "video":
      return <Play className={iconClass} />;
    case "lectura":
    case "documento":
      return <FileText className={iconClass} />;
    case "codigo":
      return <Code className={iconClass} />;
    case "ejercicio":
      return <Code className={iconClass} />;
    default:
      return <FileText className={iconClass} />;
  }
}