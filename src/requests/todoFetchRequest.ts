import { axiosInstance } from "@/lib/axios";
import { Todo } from "@prisma/client";
import { AxiosError } from "axios";

/**
 * Busca os cards do Kanban com opções de filtro por projeto e modo de visualização
 * @param projectId - ID do projeto para filtrar, ou "all" para todos os projetos
 * @param viewMode - Modo de visualização ("mine" para ver apenas cards do usuário atual)
 * @returns Promise com array de cards filtrados
 */
const todoFetchRequest = async (projectId?: string | null, viewMode?: string | null) => {
  try {
    // Construir URL com parâmetros de query
    let url = "/todo";
    const params = new URLSearchParams();
    
    // Adicionar filtro de projeto se especificado e não for "all"
    if (projectId && projectId !== "all") {
      params.append("projectId", projectId);
    }
    
    // Adicionar filtro de visualização se for "mine"
    if (viewMode === "mine") {
      params.append("view", "mine");
    }
    
    // Adicionar parâmetros à URL se houver algum
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const result = await axiosInstance.get(url);
    return result.data as Promise<Todo[]>;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      return [];
    }
    throw error;
  }
};

export default todoFetchRequest;
