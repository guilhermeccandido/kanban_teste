"use client";

import { Card, CardContent } from "@/components/ui/card";
import { categorizeDate, getTimeframeSortOrder } from "@/lib/date-util";
import todoFetchRequest from "@/requests/todoFetchRequest";
import { Todo } from "@prisma/client";
import dayjs from "dayjs";
import { useQuery } from "react-query";
import VerticalTimelineSection from "./VerticalTimelineSection";
import { VerticalTimelineSkeleton } from "./VerticalTimelineSkeleton";

const TimelineComponent = () => {
  const { data: todos, isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: () => todoFetchRequest(),
  });

  const groupedTasks =
    todos?.reduce((groups: Record<string, Todo[]>, task) => {
      const date = dayjs(task.createdAt);
      const timeframe = categorizeDate(date);

      if (!groups[timeframe]) {
        groups[timeframe] = [];
      }

      groups[timeframe].push(task);
      return groups;
    }, {}) ?? {};

  if (isLoading) {
    return (
      <div className="container py-8">
        <VerticalTimelineSkeleton />
      </div>
    );
  }

  const sortedTimeframes = Object.keys(groupedTasks).sort(
    (a, b) => getTimeframeSortOrder(a) - getTimeframeSortOrder(b),
  );

  return (
    <div className="container py-8 fade-in">
      {Object.keys(groupedTasks).length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <p className="text-muted-foreground">No tasks found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 text-card-foreground">
          {sortedTimeframes.map((timeframe) => (
            <VerticalTimelineSection
              key={timeframe}
              title={timeframe}
              todos={groupedTasks[timeframe]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TimelineComponent;
