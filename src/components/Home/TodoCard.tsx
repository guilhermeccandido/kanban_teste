"use client";

import useDraggable from "@/hooks/useDraggable";
import { getLabelColor } from "@/lib/color";
import { cn } from "@/lib/utils";
import { openTodoEditor } from "@/redux/actions/todoEditorAction";
import { Todo } from "@prisma/client";
import dayjs from "dayjs";
import { Clock } from "lucide-react";
import { FC, useCallback } from "react";
import { useDispatch } from "react-redux";

type TodoProps = {
  todo: Todo;
};

const TodoCard: FC<TodoProps> = ({ todo }) => {
  const dispatch = useDispatch();

  const handleClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      dispatch(openTodoEditor(todo, "/", "edit"));
    },
    [dispatch, todo],
  );

  const { setNodeRef, attributes } = useDraggable({
    id: todo.id,
    handleClick,
  });

  return (
    <div
      className="border-zinc-100 hover:shadow-md rounded-md mb-2 mx-auto p-3 flex flex-col cursor-pointer bg-white dark:bg-gray-800"
      ref={setNodeRef}
      {...attributes}
    >
      <div className="px-2 py-1 ">
        <div className="pb-2 font-bold overflow-hidden whitespace-nowrap text-ellipsis text-card-foreground">
          {todo.title}
        </div>
        {todo.label && (
          <div className="flex gap-2 flex-wrap">
            {todo.label.map((label) => (
              <div
                key={label}
                className={cn(
                  "px-2 py-0.5 rounded-full leading-5 text-sm",
                  getLabelColor(label).bg,
                  getLabelColor(label).badge,
                )}
              >
                {label}
              </div>
            ))}
          </div>
        )}
        {todo.deadline && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {dayjs(todo.deadline).format("MMM-DD")}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoCard;
