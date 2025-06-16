"use client";

import { TASK_STATE_OPTIONS } from "@/lib/const";
import { TodoCreateRequest, TodoCreateValidator } from "@/lib/validators/todo";
import { TaskCreatorDefaultValues } from "@/redux/actions/todoEditorAction";
import todoCreateRequest from "@/requests/todoCreateRequest";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { FC } from "react";
import { useForm } from "react-hook-form";
// Ensure this import uses @tanstack/react-query
import { useMutation, useQueryClient } from "@tanstack/react-query"; 
import "react-quill/dist/quill.snow.css";
import TaskModificationForm from "./TaskModificationForm";
import { useToast } from "./ui/use-toast";
import { Todo } from "@prisma/client";

type TaskCreateFormProps = {
  handleOnSuccess: () => void;
  handleOnClose: () => void;
  task: TaskCreatorDefaultValues;
};

const TaskCreateFormController: FC<TaskCreateFormProps> = ({
  handleOnSuccess,
  handleOnClose,
  task,
}) => {
  console.log("Rendering TaskCreateFormController (Corrected)..."); 
  const queryClient = useQueryClient();
  const { axiosToast } = useToast();

  const form = useForm<TodoCreateRequest>({
    resolver: zodResolver(TodoCreateValidator),
    defaultValues: {
      state: TASK_STATE_OPTIONS[0].value,
      ...task,
    },
  });

  // Ensure useMutation uses v4+ syntax
  const createMutation = useMutation<Todo, AxiosError, TodoCreateRequest>({
    mutationFn: todoCreateRequest,
    onSuccess: (newTodo) => {
      console.log("onSuccess createMutation:", newTodo);
      // Update cache: Add the new todo to the list associated with its project or the general list
      const projectId = newTodo.projectId || null; // Get project ID from the newly created todo
      const queryKey = ["todos", { projectId }];
      
      queryClient.setQueryData<Todo[]>(queryKey, (oldTodos = []) => [
        ...oldTodos,
        newTodo,
      ]);
      
      // Also invalidate the general 'todos' query if it exists and might be used elsewhere
      queryClient.invalidateQueries({ queryKey: ["todos", { projectId: null }] });
      queryClient.invalidateQueries({ queryKey: ["todos"] }); // Invalidate base query key too

      handleOnSuccess(); // Close dialog on success
    },
    onError: (error) => {
      console.error("onError createMutation:", error);
      axiosToast(error);
    },
  });

  try {
    return (
      <TaskModificationForm
        handleOnClose={handleOnClose}
        task={task} // Pass default values for creation
        title="Create Task"
        editMutationFunctionReturn={createMutation} // Pass the creation mutation
        formFunctionReturn={form}
      />
    );
  } catch (error) {
    console.error("Error rendering TaskCreateFormController:", error);
    return <div>Ocorreu um erro ao carregar o formulário de criação.</div>;
  }
};

export default TaskCreateFormController;

