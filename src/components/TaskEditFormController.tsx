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
import { useMutation, useQueryClient } from "react-query";
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
  const queryClient = useQueryClient();

  const { axiosToast } = useToast();
  const form = useForm<TodoEditRequest>({
    resolver: zodResolver(TodoEditValidator),
    defaultValues: {
      ...task,
    },
  });

  const editMutation = useMutation({
    mutationFn: todoEditRequest,
    onMutate: async ({
      id,
      title,
      description,
      state,
      deadline,
      label,
      order,
    }: TodoEditRequest) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const prevTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData(
        ["todos"],
        prevTodos?.map((todo) => {
          if (todo.id === id) {
            return {
              ...todo,
              title,
              description,
              state,
              deadline,
              label,
              order,
            };
          }
          return todo;
        }) ?? [],
      );

      handleOnSuccess();

      return { prevTodos };
    },
    onError: (error: AxiosError, payload, context) => {
      queryClient.setQueryData(["todos"], context?.prevTodos);
      axiosToast(error);
    },
    onSuccess: (newTodos) => {
      queryClient.setQueryData(["todos"], newTodos);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: todoDeleteRequest,
    onMutate: async ({ id }: TodoDeleteRequest) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const prevTodos = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData(
        ["todos"],
        prevTodos?.filter((todo) => todo.id !== id) ?? [],
      );

      handleOnSuccess();

      return { prevTodos };
    },
    onError: (error: AxiosError, payload, context) => {
      queryClient.setQueryData(["todos"], context?.prevTodos);
      axiosToast(error);
    },
    onSuccess: (newTodos) => {
      queryClient.setQueryData(["todos"], newTodos);
    },
  });

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
};

export default TaskEditFormController;
