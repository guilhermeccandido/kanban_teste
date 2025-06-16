"use client";

import {
  TodoDeleteRequest,
  TodoEditRequest,
  TodoEditValidator,
} from "@/lib/validators/todo";
import { useTypedDispatch } from "@/redux/store";
import todoEditRequest from "@/requests/todoEditRequest";
import { zodResolver } from "@hookform/resolvers/zod";
import { Todo } from "@prisma/client";
import axios, { AxiosError } from "axios";
import { FC } from "react";
import { useForm } from "react-hook-form";
// Update import from react-query to @tanstack/react-query
import { useMutation, useQueryClient } from "@tanstack/react-query"; 
import "react-quill/dist/quill.snow.css";
import TaskModificationForm from "./TaskModificationForm";
import { useToast } from "./ui/use-toast";
import todoDeleteRequest from "@/requests/todoDeleteRequest";

type TaskEditFormProps = {
  handleOnSuccess: () => void;
  handleOnClose: () => void;
  task: Todo;
};

const TaskEditFormController: FC<TaskEditFormProps> = ({
  handleOnSuccess,
  handleOnClose,
  task,
}) => {
  console.log("Rendering TaskEditFormController..."); // Added log
  const queryClient = useQueryClient();

  const { axiosToast } = useToast();
  const form = useForm<TodoEditRequest>({
    resolver: zodResolver(TodoEditValidator),
    defaultValues: {
      ...task,
    },
  });

  // Update useMutation syntax for v4+
  const editMutation = useMutation<Todo[], AxiosError, TodoEditRequest, { prevTodos: Todo[] | undefined }>({
    mutationFn: todoEditRequest,
    onMutate: async (variables: TodoEditRequest) => {
      console.log("onMutate editMutation:", variables);
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const prevTodos = queryClient.getQueryData<Todo[]>(["todos"]);
      console.log("Previous todos (edit):", prevTodos);

      // Optimistically update the cache
      queryClient.setQueryData<Todo[]>(
        ["todos"],
        (oldTodos = []) => 
          oldTodos.map((todo) =>
            todo.id === variables.id ? { ...todo, ...variables } : todo
          )
      );

      handleOnSuccess(); // Close dialog immediately on optimistic update
      return { prevTodos };
    },
    onError: (error, variables, context) => {
      console.error("onError editMutation:", error);
      // Rollback on error
      if (context?.prevTodos) {
        queryClient.setQueryData(["todos"], context.prevTodos);
      }
      axiosToast(error);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess editMutation:", data);
      // Invalidate and refetch on success (or just rely on optimistic update if preferred)
      // queryClient.invalidateQueries({ queryKey: ["todos"] });
      // If server returns updated list, set it directly (less common with optimistic updates)
      // queryClient.setQueryData(["todos"], data);
    },
  });

  // Update useMutation syntax for v4+
  const deleteMutation = useMutation<Todo[], AxiosError, TodoDeleteRequest, { prevTodos: Todo[] | undefined }>({
    mutationFn: todoDeleteRequest,
    onMutate: async (variables: TodoDeleteRequest) => {
      console.log("onMutate deleteMutation:", variables);
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const prevTodos = queryClient.getQueryData<Todo[]>(["todos"]);
      console.log("Previous todos (delete):", prevTodos);

      // Optimistically update the cache
      queryClient.setQueryData<Todo[]>(
        ["todos"],
        (oldTodos = []) => oldTodos.filter((todo) => todo.id !== variables.id)
      );

      handleOnSuccess(); // Close dialog immediately
      return { prevTodos };
    },
    onError: (error, variables, context) => {
      console.error("onError deleteMutation:", error);
      // Rollback on error
      if (context?.prevTodos) {
        queryClient.setQueryData(["todos"], context.prevTodos);
      }
      axiosToast(error);
    },
    onSuccess: (data, variables, context) => {
      console.log("onSuccess deleteMutation:", data);
      // Invalidate and refetch on success (or just rely on optimistic update)
      // queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  try {
    return (
      <TaskModificationForm
        handleOnClose={handleOnClose}
        task={task}
        title="Edit Task"
        enableDelete
        deleteMutationFunctionReturn={deleteMutation}
        editMutationFunctionReturn={editMutation}
        formFunctionReturn={form}
      />
    );
  } catch (error) {
    console.error("Error rendering TaskEditFormController:", error);
    return <div>Ocorreu um erro ao editar a tarefa.</div>;
  }
};

export default TaskEditFormController;

