"use client";

import { FC, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Project } from "@prisma/client";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ChevronDown, Plus } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { useQuery } from "react-query";
import { useToast } from "./ui/use-toast";

// Função para buscar projetos da API
const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch("/api/projects");
  if (!response.ok) {
    throw new Error("Falha ao buscar projetos");
  }
  return response.json();
};

interface ProjectSelectorProps {
  onCreateProject?: () => void;
}

const ProjectSelector: FC<ProjectSelectorProps> = ({ onCreateProject }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Buscar projetos usando React Query
  const { data: projects, isLoading, error } = useQuery("projects", fetchProjects, {
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os projetos",
        variant: "destructive",
      });
    },
  });

  // Obter o projectId atual da URL
  const currentProjectId = searchParams.get("projectId") || "all";

  // Encontrar o nome do projeto atual
  const currentProjectName = currentProjectId === "all" 
    ? "Todos os Projetos" 
    : projects?.find(p => p.id === currentProjectId)?.name || "Carregando...";

  // Função para mudar o projeto selecionado
  const handleProjectChange = (projectId: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    
    if (projectId === "all") {
      params.delete("projectId");
    } else {
      params.set("projectId", projectId);
    }
    
    router.push(`/?${params.toString()}`);
    setOpen(false);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="project-selector">Projeto</Label>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {isLoading ? "Carregando..." : currentProjectName}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-white dark:bg-gray-900 shadow-lg rounded-md border border-gray-200 dark:border-gray-800">
            <div className="max-h-80 overflow-auto p-1">
              <Button
                variant={currentProjectId === "all" ? "default" : "ghost"}
                className="w-full justify-start font-normal"
                onClick={() => handleProjectChange("all")}
              >
                Todos os Projetos
              </Button>
              
              {projects?.map((project) => (
                <Button
                  key={project.id}
                  variant={currentProjectId === project.id ? "default" : "ghost"}
                  className="w-full justify-start font-normal"
                  onClick={() => handleProjectChange(project.id)}
                >
                  {project.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        
        {onCreateProject && (
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onCreateProject}
            title="Criar novo projeto"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProjectSelector;
