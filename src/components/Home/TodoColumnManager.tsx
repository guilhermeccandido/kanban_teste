"use client";

import { TASK_STATE_OPTIONS } from "@/lib/const";
import { TodoEditRequest } from "@/lib/validators/todo";
import todoEditRequest from "@/requests/todoEditRequest";
import { Todo } from "@prisma/client";
import { AxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "react-query";
import DndContextProvider, { OnDragEndEvent } from "../DnDContextProvider";
import { useToast } from "../ui/use-toast";
import TodoColumn from "./TodoColumn";
import todoFetchRequest from "@/requests/todoFetchRequest";
import SkeletonColumn from "./SkeletonColumn";
import ProjectSelector from "../ProjectSelector";
import ViewToggle from "../ViewToggle";
import ProjectForm from "../ProjectForm";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";

const TodoColumnManager = () => {
  const router = useRouter();
  const { axiosToast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q")?.toLowerCase() || "";
  const projectId = searchParams.get("projectId");
  const viewMode = searchParams.get("view");
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Modificar a query key para incluir projectId e viewMode
  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ["todos", projectId, viewMode],
    queryFn: () => todoFetchRequest(projectId, viewMode),
  });

  const { mutate: handleUpdateState } = useMutation({
    mutationFn: todoEditRequest,
    onMutate: async (payload: TodoEditRequest) => {
      await queryClient.cancelQueries({ queryKey: ["todos", projectId, viewMode] });

      const previousTodos = queryClient.getQueryData<Todo[]>(["todos", projectId, viewMode]);

      const originalTodo = previousTodos?.find(
        (todo) => todo.id === payload.id,
      );
      const originalState = originalTodo?.state!;
      const originalOrder = originalTodo?.order!;

      const newState = payload.state!;
      const updateTodoOrder = payload.order!;

      const newTodos =
        previousTodos?.map((todo) => {
          if (todo.id === payload.id) {
            return {
              ...todo,
              state: newState,
              order: updateTodoOrder,
            };
          }

          if (todo.state === originalState) {
            if (originalState === newState) {
              if (originalOrder < updateTodoOrder) {
                if (
                  todo.order > originalOrder &&
                  todo.order <= updateTodoOrder
                ) {
                  return { ...todo, order: todo.order - 1 };
                }
              } else if (originalOrder > updateTodoOrder) {
                if (
                  todo.order >= updateTodoOrder &&
                  todo.order < originalOrder
                ) {
                  return { ...todo, order: todo.order + 1 };
                }
              }
            } else {
              if (todo.order > originalOrder) {
                return { ...todo, order: todo.order - 1 };
              }
            }
          }

          if (todo.state === newState) {
            if (originalState !== newState) {
              if (todo.order >= updateTodoOrder) {
                return { ...todo, order: todo.order + 1 };
              }
            } else {
              return todo;
            }
          }

          return todo;
        }) ?? [];

      queryClient.setQueryData<Todo[]>(["todos", projectId, viewMode], newTodos);

      return { previousTodos };
    },

    onSuccess: () => {
      router.push("/");
    },
    onError: (error: AxiosError) => {
      axiosToast(error);
    },
  });

  const handleDragEnd = (dragEndEvent: OnDragEndEvent) => {
    const { over, from, item, order } = dragEndEvent;
    if (!over || !from || !item) return;

    const payload = {
      state: over as Todo["state"],
      id: item as string,
      order,
    };

    handleUpdateState(payload);
  };

  // Função para atualizar a lista de projetos após criar um novo
  const handleProjectCreated = () => {
    // Invalidar a query de projetos para forçar uma nova busca
    queryClient.invalidateQueries("projects");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center px-6 pt-6">
          <div className="w-64">
            <ProjectSelector />
          </div>
          <ViewToggle />
        </div>
        <div className="flex gap-2 overflow-x-scroll p-6">
          <SkeletonColumn state="TODO" />
          <SkeletonColumn state="IN_PROGRESS" />
          <SkeletonColumn state="REVIEW" />
          <SkeletonColumn state="DONE" />
        </div>
      </div>
    );
  }

  const filteredTodos =
    todos?.filter((todo) => {
      if (!searchTerm) return true;
      const inTitle = todo.title?.toLowerCase().includes(searchTerm);
      const inDescription = todo.description?.toLowerCase().includes(searchTerm);
      return inTitle || inDescription;
    }) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-6 pt-6">
        <div className="flex gap-2 items-end">
          <div className="w-64">
            <ProjectSelector 
              onCreateProject={() => setShowProjectForm(true)} 
            />
          </div>
        </div>
        <ViewToggle />
      </div>
      
      <DndContextProvider onDragEnd={handleDragEnd}>
        <div className="flex gap-2 overflow-x-scroll p-6">
          {TASK_STATE_OPTIONS.map(({ value, title }) => {
            return (
              <TodoColumn
                key={value}
                title={title}
                todos={filteredTodos.filter((todo) => todo.state === value)}
                state={value}
              />
            );
          })}
        </div>
      </DndContextProvider>
      
      {/* Formulário de criação de projeto */}
      <ProjectForm 
        onSuccess={handleProjectCreated}
        trigger={
          <Button 
            variant="ghost" 
            className="hidden"
            onClick={() => setShowProjectForm(true)}
          >
            Novo Projeto
          </Button>
        }
      />
    </div>
  );
};

export default TodoColumnManager;
