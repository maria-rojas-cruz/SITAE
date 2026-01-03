import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface DashboardHeaderProps {
  onExport: () => void;
}

export function DashboardHeader({ onExport }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard del Curso</h1>
        <p className="text-slate-600">
          Resumen general y análisis detallado del progreso estudiantil
        </p>
      </div>
      <Button variant="outline" onClick={onExport}>
        <Download className="h-4 w-4 mr-2" />
        Exportar Reporte
      </Button>
    </div>
  );
}