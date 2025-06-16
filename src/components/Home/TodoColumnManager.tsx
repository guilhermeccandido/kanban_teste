"use client";

import { TASK_STATE_OPTIONS } from "@/lib/const";
import { TodoEditRequest } from "@/lib/validators/todo";
import todoEditRequest from "@/requests/todoEditRequest";
import { Todo } from "@prisma/client";
import { AxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
// Update import from react-query to @tanstack/react-query
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"; 
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

// Define Project type if needed
type Project = {
  id: string;
  name: string;
};

const TodoColumnManager = () => {
  console.log("Rendering TodoColumnManager..."); // Added log
  const router = useRouter();
  const { axiosToast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q")?.toLowerCase() || "";
  const projectId = searchParams.get("projectId") || null; // Ensure projectId can be null
  const viewMode = searchParams.get("view"); // View mode might be relevant for fetching
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Update useQuery syntax for v4+
  const { data: todos, isLoading, error } = useQuery<Todo[], Error>({
    // Include projectId in the queryKey to refetch when it changes
    queryKey: ["todos", { projectId }], 
    queryFn: () => todoFetchRequest(projectId), // Pass projectId to fetch function
    onError: (err) => {
      console.error("Error fetching todos:", err);
      axiosToast(new AxiosError("Falha ao buscar tarefas.")); // Show toast on error
    }
  });

  // Update useMutation syntax for v4+
  const { mutate: handleUpdateState, isPending: isUpdateLoading } = useMutation<
    Todo[], // Return type from API (adjust if different)
    AxiosError, // Error type
    TodoEditRequest, // Variables type
    { previousTodos?: Todo[] } // Context type
  >({
    mutationFn: todoEditRequest,
    onMutate: async (payload: TodoEditRequest) => {
      console.log("onMutate handleUpdateState:", payload);
      const queryKey = ["todos", { projectId }];
      await queryClient.cancelQueries({ queryKey });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      console.log("Previous todos (update state):", previousTodos);

      if (!previousTodos) return { previousTodos: undefined };

      const originalTodo = previousTodos.find((todo) => todo.id === payload.id);
      if (!originalTodo) return { previousTodos }; // Should not happen if payload is valid

      const originalState = originalTodo.state;
      const originalOrder = originalTodo.order;
      const newState = payload.state!;
      const newOrder = payload.order!;

      // Optimistic update logic (complex, ensure correctness)
      const newTodos = previousTodos.map((todo) => {
        // Target todo being moved
        if (todo.id === payload.id) {
          return { ...todo, state: newState, order: newOrder };
        }

        // Adjust order in the original column
        if (todo.state === originalState && todo.order > originalOrder) {
          return { ...todo, order: todo.order - 1 };
        }

        // Adjust order in the destination column
        if (todo.state === newState && todo.order >= newOrder) {
           // Only adjust if it wasn't the moved item (already handled)
           if (todo.id !== payload.id) {
             return { ...todo, order: todo.order + 1 };
           }
        }

        return todo;
      });

      // Sort the updated list by order within each state
      const sortedNewTodos = TASK_STATE_OPTIONS.reduce((acc, stateOption) => {
        const stateTodos = newTodos
          .filter(todo => todo.state === stateOption.value)
          .sort((a, b) => a.order - b.order);
        return [...acc, ...stateTodos];
      }, [] as Todo[]);


      queryClient.setQueryData<Todo[]>(queryKey, sortedNewTodos);

      return { previousTodos };
    },
    onError: (error, variables, context) => {
      console.error("onError handleUpdateState:", error);
      // Rollback on error
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos", { projectId }], context.previousTodos);
      }
      axiosToast(error);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess handleUpdateState:", data);
      // Optionally invalidate or refetch, but optimistic update should suffice
      // queryClient.invalidateQueries({ queryKey: ["todos", { projectId }] });
      // router.push("/"); // Avoid unnecessary navigation if already on the page
    },
  });

  const handleDragEnd = (dragEndEvent: OnDragEndEvent) => {
    console.log("handleDragEnd event:", dragEndEvent);
    const { over, item, order } = dragEndEvent;
    // Ensure over (target column state) and item (todo id) are valid
    if (!over || !item || order === undefined || order === null) {
        console.warn("Invalid drag end event data:", dragEndEvent);
        return;
    }

    const payload: TodoEditRequest = {
      state: over as Todo["state"],
      id: item as string,
      order,
      // Include other fields if required by validator/API, even if undefined
      title: undefined,
      description: undefined,
      deadline: undefined,
      label: undefined,
    };

    console.log("Calling handleUpdateState with payload:", payload);
    handleUpdateState(payload);
  };

  // Callback for successful project creation
  const handleProjectCreated = () => {
    console.log("Project created, invalidating projects query...");
    queryClient.invalidateQueries({ queryKey: ["projects"] }); 
    setShowProjectForm(false); // Close form after creation
  };

  if (isLoading) {
    console.log("TodoColumnManager loading...");
    return (
      <div className="flex flex-col gap-4">
        {/* Keep header skeleton */}
        <div className="flex justify-between items-center px-6 pt-6">
           <Skeleton className="h-10 w-64" /> 
           <Skeleton className="h-10 w-32" />
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

  if (error) {
    console.error("TodoColumnManager render error:", error);
    return <div className="p-6 text-red-500">Erro ao carregar tarefas: {error.message}</div>;
  }

  const filteredTodos =
    todos?.filter((todo) => {
      if (!searchTerm) return true;
      const inTitle = todo.title?.toLowerCase().includes(searchTerm);
      // Description might be null/undefined, handle safely
      const inDescription = todo.description?.toLowerCase().includes(searchTerm) ?? false;
      return inTitle || inDescription;
    }) ?? [];
    
  console.log(`Filtered Todos (${filteredTodos.length}):`, filteredTodos);

  try {
    return (
      <div className="flex flex-col gap-4">
        {/* Header with Project Selector and View Toggle */}
        {/* Removed ProjectSelector and ViewToggle from here as they are now in AppHeader/AppSideBar */}
        
        {/* Dnd Context and Columns */}
        <DndContextProvider onDragEnd={handleDragEnd}>
          <div className="flex gap-2 overflow-x-auto p-6"> {/* Use overflow-x-auto */} 
            {TASK_STATE_OPTIONS.map(({ value, title }) => {
              const columnTodos = filteredTodos
                .filter((todo) => todo.state === value)
                .sort((a, b) => a.order - b.order); // Ensure sorted by order
              console.log(`Todos for column ${value} (${columnTodos.length}):`, columnTodos);
              return (
                <TodoColumn
                  key={value}
                  title={title}
                  todos={columnTodos}
                  state={value}
                />
              );
            })}
          </div>
        </DndContextProvider>
        
        {/* ProjectForm is likely triggered from AppSideBar now, remove if redundant */}
        {/* 
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
        */}
      </div>
    );
  } catch (renderError) {
      console.error("Error rendering TodoColumnManager content:", renderError);
      return <div className="p-6 text-red-500">Ocorreu um erro ao renderizar o quadro Kanban.</div>;
  }
};

export default TodoColumnManager;

