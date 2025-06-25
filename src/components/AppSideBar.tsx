"use client";

// import { getLabelColor } from "@/lib/color"; // Removido
import { cn } from "@/lib/utils";
import { BarChart2, Clock, Folder, Menu, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ForwardRefExoticComponent, useEffect, useRef } from "react"; // Removido useState não utilizado
import { Button } from "./ui/button";
import useBreakpoint from "@/hooks/useBreakpoint";
import { useDispatch, useSelector } from "react-redux";
import { ReduxState } from "@/redux/store";
import {
  closeSidebar,
  openSidebar,
  toggleSidebar,
} from "@/redux/actions/sidebarAction";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Project } from "@prisma/client";
import { useToast } from "./ui/use-toast";
import { Skeleton } from "./ui/skeleton";
import ProjectForm from "./ProjectForm";
import ProjectEditForm from "./ProjectEditForm";

const fetchProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch("/api/projects");
    if (!response.ok) {
      throw new Error("Falha ao buscar projetos");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in fetchProjects:", error);
    throw error;
  }
};

type NavContent = {
  title: string;
  icon: ForwardRefExoticComponent<any>;
  link: string;
};

const NAV_CONTENT: NavContent[] = [
  { title: "Board", icon: Tag, link: "/" },
  { title: "Dashboard", icon: BarChart2, link: "/dashboard" },
  { title: "Timeline", icon: Clock, link: "/timeline" },
];

const AppSideBar = () => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { md, lg } = useBreakpoint();
  const isSidebarOpen = useSelector<ReduxState, boolean>(
    (state) => state.sidebar.isSidebarOpen
  );
  const dispatch = useDispatch();

  // CORREÇÃO 1: onError movido para useEffect
  const {
    data: projects,
    isLoading,
    error,
  } = useQuery<Project[], Error>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro ao carregar projetos",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const currentProjectId = searchParams.get("projectId");

  useEffect(() => {
    const handleResize = () => {
      if (lg && !isSidebarOpen) {
        dispatch(openSidebar());
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isSidebarOpen, lg, dispatch]);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const buildQueryString = (
    newParams: Record<string, string | null | undefined>
  ): string => {
    const currentParams = new URLSearchParams(
      Array.from(searchParams.entries())
    );
    for (const key in newParams) {
      const value = newParams[key];
      if (value === null || value === undefined) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    }
    return currentParams.toString();
  };

  const handleNavigate = (link: string) => {
    let queryString = "";
    if (link === "/dashboard" || link === "/timeline") {
      queryString = buildQueryString({
        projectId: null,
        view: searchParams.get("view"),
      });
    } else if (link === "/") {
      queryString = buildQueryString({
        projectId: searchParams.get("projectId"),
        view: searchParams.get("view"),
      });
    } else {
      queryString = searchParams.toString();
    }
    const targetUrl = `${link}${queryString ? `?${queryString}` : ""}`;
    router.push(targetUrl);
    if (!md) {
      dispatch(closeSidebar());
    }
  };

  const handleProjectSelect = (projectId: string | null) => {
    const queryString = buildQueryString({
      projectId: projectId,
      view: searchParams.get("view"),
    });
    router.push(`/?${queryString}`);
    if (!md) {
      dispatch(closeSidebar());
    }
  };

  const handleLogoClick = () => {
    const queryString = buildQueryString({
      projectId: null,
      view: searchParams.get("view"),
    });
    router.push(`/?${queryString}`);
    if (!md) {
      dispatch(closeSidebar());
    }
  };

  const handleProjectCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  try {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleSidebar}
          className={cn(
            "fixed md:hidden z-10 left-4 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 w-10 h-10 flex items-center justify-center px-2 mr-2",
            isSidebarOpen && "hidden"
          )}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div
          ref={sidebarRef}
          className={cn(
            "bg-white dark:bg-gray-900 h-full transition-all duration-300 border-r dark:border-gray-800 z-10 fixed md:relative inset-0 flex flex-col",
            isSidebarOpen
              ? "w-full md:w-64"
              : "-translate-x-full md:w-16 md:-translate-x-0"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-800 flex-shrink-0">
            {isSidebarOpen && (
              <Link
                href={`/?${buildQueryString({ projectId: null })}`}
                legacyBehavior
              >
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogoClick();
                  }}
                  className={cn(
                    "font-bold text-xl text-teal-600 dark:text-teal-400 transition-opacity duration-300 cursor-pointer",
                    isSidebarOpen ? "opacity-100" : "opacity-0 absolute"
                  )}
                >
                  Kanban
                </a>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 w-8 h-8 flex items-center justify-center"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-grow overflow-y-auto p-4">
            <nav className="space-y-2">
              {NAV_CONTENT.map((item) => (
                <Link
                  key={item.link}
                  href={`${item.link}?${buildQueryString({
                    projectId: item.link === "/" ? currentProjectId : null,
                  })}`}
                  className="block"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(item.link);
                  }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      pathname === item.link &&
                        "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white",
                      !isSidebarOpen && "justify-center p-0"
                    )}
                  >
                    <item.icon
                      className={cn("h-5 w-5", isSidebarOpen && "mr-2")}
                    />
                    {isSidebarOpen && <span>{item.title}</span>}
                  </Button>
                </Link>
              ))}
            </nav>
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                {isSidebarOpen && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Projetos
                  </h3>
                )}
                {isSidebarOpen && (
                  <ProjectForm
                    onSuccess={handleProjectCreated}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Criar novo projeto"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    }
                  />
                )}
              </div>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  onClick={() => handleProjectSelect(null)}
                  className={cn(
                    "w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    pathname === "/" &&
                      !currentProjectId &&
                      "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white",
                    !isSidebarOpen && "justify-center p-0"
                  )}
                >
                  <Folder className={cn("h-5 w-5", isSidebarOpen && "mr-2")} />
                  {isSidebarOpen && <span>Todos os Projetos</span>}
                </Button>
                {isLoading && isSidebarOpen && (
                  <>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </>
                )}

                {/* CORREÇÃO 2: Adicionado Array.isArray(projects) */}
                {!isLoading &&
                  Array.isArray(projects) &&
                  projects.map((project) => (
                    <div
                      key={project.id}
                      className={cn(
                        "flex items-center justify-between rounded-md",
                        currentProjectId === project.id &&
                          "bg-gray-100 dark:bg-gray-800"
                      )}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => handleProjectSelect(project.id)}
                        className={cn(
                          "flex-grow justify-start text-left text-gray-600 dark:text-gray-300 hover:bg-transparent dark:hover:bg-transparent",
                          currentProjectId === project.id &&
                            "text-gray-900 dark:text-white",
                          !isSidebarOpen && "justify-center p-0",
                          isSidebarOpen && "pl-3 pr-2 py-2 h-auto",
                          !isSidebarOpen && "w-full h-10"
                        )}
                        title={project.name}
                      >
                        <Folder
                          className={cn(
                            "h-5 w-5",
                            isSidebarOpen && "mr-2 flex-shrink-0"
                          )}
                        />
                        {isSidebarOpen && (
                          <span className="truncate">{project.name}</span>
                        )}
                      </Button>
                      {isSidebarOpen && currentProjectId === project.id && (
                        <div className="flex-shrink-0 pr-2">
                          <ProjectEditForm
                            project={project}
                            onSuccess={handleProjectCreated}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                {error && isSidebarOpen && (
                  <p className="text-xs text-red-500">
                    Erro ao carregar projetos: {error.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    return <div>Ocorreu um erro na barra lateral.</div>;
  }
};

export default AppSideBar;
