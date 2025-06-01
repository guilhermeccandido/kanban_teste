import { TIMEFRAMECOLOR } from "@/lib/const";
import { cn } from "@/lib/utils";
import { Todo } from "@prisma/client";
import { FC } from "react";
import TimelineItem from "./TimelineItem";
import dayjs from "dayjs";

type VerticalTimelineSectionProps = {
  title: string;
  todos: Todo[];
};

const VerticalTimelineSection: FC<VerticalTimelineSectionProps> = ({
  title,
  todos,
}) => {
  if (todos.length === 0) return null;

  const sortedTodos = todos.toSorted(
    (a, b) => dayjs(b.createdAt).unix() - dayjs(a.createdAt).unix(),
  );

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div
          className={cn(
            "text-xs px-2 py-1 rounded-full border",
            TIMEFRAMECOLOR[title],
          )}
        >
          {todos.length} task{todos.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="space-y-0">
        {sortedTodos.map((todo, index) => (
          <TimelineItem
            key={todo.id}
            todo={todo}
            isLast={index === todos.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default VerticalTimelineSection;
