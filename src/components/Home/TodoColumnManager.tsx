import { Skeleton } from "../ui/skeleton";
import { TASK_STATE_OPTIONS } from "@/lib/const";
import { TodoEditRequest } from "@/lib/validators/todo";
import todoEditRequest from "@/requests/todoEditRequest";
import { Todo, State } from "@prisma/client";
import { AxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
// Update import from react-query to @tanstack/react-query
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"; 
import DndContextProvider, { OnDragEndEvent } from "../DnDContextProvider";
import { useToast } from "../ui/use-toast";
import TodoColumn from "./TodoColumn";
import todoFetchRequest from "@/requests/todoFetchRequest";
import SkeletonColumn from "./SkeletonColumn";
import ViewToggle from "../ViewToggle";
import { Button } from "../ui/button";

const TodoColumnManager = () => {
  console.log("Rendering TodoColumnManager..."); // Added log
  const router = useRouter();
  const { axiosToast } = useToast();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get("q")?.toLowerCase() || "";
  const projectId = searchParams.get("projectId") || null;
  const viewMode = searchParams.get("view") || null;

  const { data: todos, isLoading, error } = useQuery<Todo[], Error>({
    queryKey: ["todos", { projectId, viewMode }], 
    queryFn: () => todoFetchRequest(projectId, viewMode),
    onError: (err) => {
      console.error("Error fetching todos:", err);
      axiosToast(new AxiosError("Falha ao buscar tarefas."));
    }
  });

  const { mutate: handleUpdateState, isPending: isUpdateLoading } = useMutation<
    Todo[],
    AxiosError,
    TodoEditRequest, 
    { previousTodos?: Todo[] } 
  >({
    mutationFn: todoEditRequest,
    onMutate: async (payload: TodoEditRequest) => {
      console.log("onMutate handleUpdateState:", payload);
      const queryKey = ["todos", { projectId, viewMode }];
      await queryClient.cancelQueries({ queryKey });

      const previousTodos = queryClient.getQueryData<Todo[]>(queryKey);
      console.log("Previous todos (update state):", previousTodos);

      if (!previousTodos) return { previousTodos: undefined };

      const originalTodo = previousTodos.find((todo) => todo.id === payload.id);
      if (!originalTodo) return { previousTodos };

      const originalState = originalTodo.state;
      const originalOrder = originalTodo.order;
      const newState = payload.state!;
      const newOrder = payload.order!;

      const newTodos = previousTodos.map((todo) => {
        if (todo.id === payload.id) {
          return { ...todo, state: newState, order: newOrder };
        }

        if (todo.state === originalState && todo.order > originalOrder) {
          return { ...todo, order: todo.order - 1 };
        }

        if (todo.state === newState && todo.order >= newOrder) {
           if (todo.id !== payload.id) {
             return { ...todo, order: todo.order + 1 };
           }
        }

        return todo;
      });

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
      if (context?.previousTodos) {
        queryClient.setQueryData(["todos", { projectId, viewMode }], context.previousTodos);
      }
      axiosToast(error);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess handleUpdateState:", data);
      queryClient.invalidateQueries({ queryKey: ["todos", { projectId }] });
    },
  });

  const handleDragEnd = (dragEndEvent: OnDragEndEvent) => {
    console.log("handleDragEnd event:", dragEndEvent);
    const { over, item, order } = dragEndEvent;
    if (!over || !item || order === undefined || order === null) {
        console.warn("Invalid drag end event data:", dragEndEvent);
        return;
    }

    const payload: TodoEditRequest = {
      state: State[over as keyof typeof State],
      id: item as string,
      order,
      projectId: undefined, // Não alterar o projeto ao mover entre colunas
      // Include other fields if required by validator/API, even if undefined
      title: undefined,
      description: undefined,
      deadline: undefined,
      label: undefined,
    };

    console.log("Calling handleUpdateState with payload:", payload);
    handleUpdateState(payload);
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
    (Array.isArray(todos) ? todos : []).filter((todo) => {
      if (!searchTerm) return true;
      const inTitle = todo.title?.toLowerCase().includes(searchTerm);
      const inDescription = todo.description?.toLowerCase().includes(searchTerm) ?? false;
      return inTitle || inDescription;
    });
    
  console.log(`Filtered Todos (${filteredTodos.length}):`, filteredTodos);

  let projectName = "Todos os Projetos";
  if (projectId && projectId !== "all") {
    const projectTodo = filteredTodos.find(todo => todo.project?.id === projectId);
    if (projectTodo?.project?.name) {
      projectName = projectTodo.project.name;
    }
  }

  try {
    return (
      <div className="flex flex-col gap-4">
        {/* Header com título do projeto e ViewToggle */}
        <div className="flex justify-between items-center px-6 pt-6">
          <h1 className="text-2xl font-bold">
            {projectId && projectId !== "all" ? projectName : "Todos os Projetos"}
          </h1>
          <div className="flex items-center gap-2">
            <ViewToggle />
          </div>
        </div>
        
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
      </div>
    );
  } catch (renderError) {
      console.error("Error rendering TodoColumnManager content:", renderError);
      return <div className="p-6 text-red-500">Ocorreu um erro ao renderizar o quadro Kanban.</div>;
  }
};

export default TodoColumnManager;

