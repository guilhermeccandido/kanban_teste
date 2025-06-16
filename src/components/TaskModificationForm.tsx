"use client";

import useBreakpoint from "@/hooks/useBreakpoint";
import { TASK_STATE_OPTIONS } from "@/lib/const";
import { cn } from "@/lib/utils";
import todoLabelFetchRequest from "@/requests/todoLabelFetchRequest";
import { Todo } from "@prisma/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import { CalendarIcon, X } from "lucide-react";
import { FC, lazy } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
// Ensure this import uses @tanstack/react-query
import { UseMutationResult, useQuery } from "@tanstack/react-query"; 
import "react-quill/dist/quill.snow.css";
import CustomizedMultSelect from "./CustomizedMultSelect";
import CustomizedSelect from "./CustomizedSelect";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "./ui/use-toast";

// Define Label type if not already defined globally or imported
type LabelType = {
  id: string;
  name: string;
  color: string;
};

type TaskEditFormProps = {
  handleOnClose: () => void;
  task: Partial<Todo>; // Can be partial for creation form defaults
  title: string;
  enableDelete?: boolean;
  // Ensure UseMutationResult type matches @tanstack/react-query v4+
  deleteMutationFunctionReturn?: UseMutationResult<Todo[], AxiosError, { id: string }, any>; // Specify variable type for delete
  editMutationFunctionReturn: UseMutationResult<Todo | Todo[], AxiosError, any, any>; // Allow Todo or Todo[] based on mutation
  formFunctionReturn: UseFormReturn<any>;
};

const CustomizedReactQuill = lazy(() => import("./CustomizedReactQuill"));

type ErrorMessageProps = {
  msg?: string;
};

const TaskModificationForm: FC<TaskEditFormProps> = ({
  handleOnClose,
  task,
  title,
  enableDelete,
  deleteMutationFunctionReturn,
  editMutationFunctionReturn,
  formFunctionReturn,
}) => {
  console.log("Rendering TaskModificationForm (Corrected)..."); 
  const { md } = useBreakpoint();
  const { axiosToast } = useToast();
  const {
    handleSubmit,
    register,
    formState: { errors },
    control,
  } = formFunctionReturn;
  
  // Destructure mutation functions and loading states (use isPending for v4+)
  const { mutate: submitEditTodoTask, isPending: isEditLoading } = editMutationFunctionReturn;
  const { mutate: deleteFunc, isPending: isDeleteLoading } = 
    deleteMutationFunctionReturn ?? { mutate: () => {}, isPending: false };

  // Ensure useQuery uses v4+ syntax
  const { data: labels, isLoading: labelsLoading, error: labelsError } = useQuery<LabelType[], Error>({
    queryKey: ["labels"], 
    queryFn: todoLabelFetchRequest,
    onError: (err) => {
        console.error("Error fetching labels in TaskModificationForm:", err);
        // Optionally show a toast or message for label fetch error
    }
  });

  const ErrorMessage = ({ msg }: ErrorMessageProps) => {
    return msg ? <span className="text-red-500 text-xs">{msg}</span> : null;
  };

  const ExtraInfoField = () => {
    console.log("Rendering ExtraInfoField...");
    try {
      return (
        <>
          <div className="relative grid gap-1 pb-4">
            <Label className="text-sm font-medium" htmlFor="state">
              State
            </Label>
            <Controller
              control={control}
              name="state"
              defaultValue={task.state} // Use defaultValue from task prop
              render={({ field }) => (
                <CustomizedSelect
                  options={TASK_STATE_OPTIONS}
                  placeholder="Select the state"
                  onChange={field.onChange}
                  value={field.value}
                />
              )}
            />
            <ErrorMessage msg={errors.state?.message?.toString()} />
          </div>
          <div className="relative grid gap-1 pb-4">
            <Label className="text-sm font-medium" htmlFor="deadline">
              Deadline
            </Label>
            <Controller
              control={control}
              name="deadline"
              defaultValue={task.deadline} // Use defaultValue from task prop
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "justify-start text-left font-normal w-full h-9 px-3 py-2 text-sm", // Standardized size/padding
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? (
                        dayjs(field.value).format("YYYY-MM-DD")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-900 z-50 border rounded-md shadow-md">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => {
                        const timestamp = date instanceof Date ? date.getTime() : null;
                        field.onChange(timestamp);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <ErrorMessage msg={errors.deadline?.message?.toString()} />
          </div>
          <div className="relative grid gap-1 pb-4">
            <Label className="text-sm font-medium" htmlFor="label">
              Label
            </Label>
            <Controller
              control={control}
              name="label"
              defaultValue={task.label || []} // Use defaultValue from task prop
              render={({ field }) => (
                <CustomizedMultSelect
                  value={field.value || []} // Ensure value is always an array
                  onChange={field.onChange}
                  placeholder="Select labels"
                  options={labels || []} // Pass fetched labels, ensure it's an array
                  isLoading={labelsLoading} // Pass loading state
                />
              )}
            />
            {labelsError && <ErrorMessage msg="Erro ao carregar labels."/>}
            <ErrorMessage msg={errors.label?.message?.toString()} />
          </div>
        </>
      );
    } catch(error) {
        console.error("Error rendering ExtraInfoField:", error);
        return <div>Erro ao renderizar campos extras.</div>
    }
  };

  try {
    return (
      <form
        onSubmit={handleSubmit((data) => {
          console.log("Form submitted with data:", data);
          // Add the task ID for edit operations if it exists
          const payload = title === "Edit Task" && task.id ? { ...data, id: task.id } : data;
          submitEditTodoTask(payload);
        })}
      >
        <Card className="sm:max-h-[80vh] overflow-y-auto border-none shadow-none">
          <CardHeader className="p-4">
            <CardTitle className="flex justify-between items-center">
              <div className="text-lg font-semibold">{title}</div>
              <Button variant="ghost" size="icon" className="p-0 h-6 w-6" onClick={handleOnClose}>
                <X className="h-4 w-4"/>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Main content area */} 
              <div className="flex flex-col gap-4 flex-1">
                <div className="relative grid gap-1">
                  <Label className="text-sm font-medium" htmlFor="title">
                    Title
                  </Label>
                  <Input
                    id="title"
                    className="w-full h-9 px-3 py-2 text-sm" // Standardized size/padding
                    {...register("title")}
                  />
                  <ErrorMessage msg={errors.title?.message?.toString()} />
                </div>
                
                {/* Render ExtraInfoField on small screens here */} 
                {!md && <ExtraInfoField />}
                
                <div className="relative grid gap-1 h-80"> {/* Reduced height slightly */} 
                  <Label className="text-sm font-medium" htmlFor="description">
                    Description
                  </Label>
                  <Controller
                    control={control}
                    name="description"
                    defaultValue={task.description || ""} // Use defaultValue
                    render={({ field }) => (
                      <CustomizedReactQuill
                        theme="snow"
                        value={field.value || ""} // Ensure value is a string
                        onChange={field.onChange}
                        className="h-[calc(100%-1.75rem)]" // Adjusted height calculation
                      />
                    )}
                  />
                   <ErrorMessage msg={errors.description?.message?.toString()} />
                </div>
                <div className="relative flex gap-2 pt-4"> 
                  <Button type="submit" isLoading={isEditLoading}> 
                    {title === "Create Task" ? "Create Task" : "Save Changes"}
                  </Button>
                  {enableDelete && deleteFunc && (
                    <Button
                      type="button" 
                      variant="outline"
                      onClick={() => task.id && deleteFunc({ id: task.id })} 
                      isLoading={isDeleteLoading}
                      disabled={!task.id || isDeleteLoading} // Disable if no task id or already deleting
                    >
                      Delete Task
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Sidebar for extra info on larger screens */} 
              {md && (
                <div className="w-full md:w-64 flex flex-col border dark:border-gray-700 rounded-lg p-4 h-min space-y-4">
                  <ExtraInfoField />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    );
  } catch (error) {
      console.error("Error rendering TaskModificationForm:", error);
      return <div>Ocorreu um erro ao renderizar o formulário.</div>
  }
};

export default TaskModificationForm;

