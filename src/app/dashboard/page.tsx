"use client";

import DashboardComponent from "@/components/Dashboard/DashboardComponent";
import DashboardProjectSelector from "@/components/Dashboard/ProjectSelector";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do progresso e métricas do projeto.
          </p>
        </div>
        <div className="w-64">
          <DashboardProjectSelector />
        </div>
      </div>
      <Separator className="mb-2" />
      <DashboardComponent />
    </div>
  );
}

