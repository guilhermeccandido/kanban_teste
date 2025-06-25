"use client";

import { openTodoEditor } from "@/redux/actions/todoEditorAction";
import type { Project, Todo } from "@prisma/client"; // Import Project type
import { Plus, PlusCircle } from "lucide-react";
import { FC } from "react";
import { useDispatch } from "react-redux";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";

type HomeTaskCreatorProps = {
  state: Todo["state"];
};

const HomeTaskCreator: FC<HomeTaskCreatorProps> = ({ state }) => {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const currentProjectId = searchParams.get("projectId") || null; // Get projectId or null

  const handleOpenDialog = () => {
    dispatch(openTodoEditor({ state, projectId: currentProjectId }, "/", "create"));
  };

  return (
    <div className="p-2 border-t dark:border-gray-700 sticky bottom-0 bg-inherit rounded-b-lg">
      <Button
        variant="ghost"
        className="w-full justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        onClick={() => handleOpenDialog()}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Create Todo
      </Button>
    </div>
  );
};

export default HomeTaskCreator;
