"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getClockColor, getLabelColor } from "@/lib/color";
import { cn } from "@/lib/utils";
import todoFetchRequest from "@/requests/todoFetchRequest";
import { Todo } from "@prisma/client";
import dayjs from "dayjs";
import { BarChart, CheckCircle, Circle, Clock } from "lucide-react";
import { useQuery } from "react-query";
import { Skeleton } from "../ui/skeleton";

//TODO: clock color

const DashboardComponent = () => {
  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => todoFetchRequest(),
  });

  const lastUpdatedDate =
    todos?.length === 0
      ? dayjs()
      : todos?.toSorted(
          (a, b) => dayjs(b.updatedAt).unix() - dayjs(a.updatedAt).unix(),
        )[0].updatedAt;

  const totalTasks = todos?.length;
  const numOfNewTask = todos?.filter((todo) =>
    dayjs(todo.createdAt).isAfter(dayjs().subtract(1, "week")),
  ).length;

  const completedTasks = todos?.filter((todo) => todo.state === "DONE").length;
  const lastCompletedTask = todos
    ?.toSorted((a, b) => dayjs(b.updatedAt).unix() - dayjs(a.updatedAt).unix())
    .find((todo) => todo.state === "DONE");

  const inProgressTasks = todos?.filter(
    (todo) => todo.state === "IN_PROGRESS" || todo.state === "REVIEW",
  ).length;
  const lastInProgressTask = todos
    ?.toSorted((a, b) => dayjs(b.updatedAt).unix() - dayjs(a.updatedAt).unix())
    .find((todo) => todo.state === "IN_PROGRESS" || todo.state === "REVIEW");

  const upcomingTasks = todos
    ?.filter((todo) => dayjs(todo.deadline).isAfter(dayjs()))
    .toSorted((a, b) => dayjs(a.deadline).unix() - dayjs(b.deadline).unix());
  const nextDueTask = upcomingTasks?.[0];

  const projectProgress =
    todos?.reduce(
      (acc, todo) => {
        for (const label of todo.label) {
          if (acc[label]) {
            acc[label].total += 1;
            if (todo.state === "DONE") {
              acc[label].completed += 1;
            }
          } else {
            acc[label] = { total: 1, completed: todo.state === "DONE" ? 1 : 0 };
          }
        }
        return acc;
      },
      {} as Record<string, { total: number; completed: number }>,
    ) || {};

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-sm text-muted-foreground mb-8">
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="h-96 lg:col-span-4" />
          <Skeleton className="h-96 lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Last updated: {dayjs(lastUpdatedDate).format("MMM D, h:mm A")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Tasks</h3>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            {numOfNewTask === 0 ? (
              <p className="text-xs text-muted-foreground">No new tasks</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                +{numOfNewTask} from this week
              </p>
            )}
            <Progress value={68} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Completed</h3>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {lastCompletedTask ? (
                <>
                  Last completed:{" "}
                  {dayjs(lastCompletedTask.updatedAt).format("MMM D, h:mm A")}
                </>
              ) : (
                "No completed tasks"
              )}
            </p>
            <Progress value={50} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">In Progress</h3>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
            {lastInProgressTask ? (
              <p className="text-xs text-muted-foreground">
                New in progress: {lastInProgressTask.title}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No in progress tasks
              </p>
            )}
            <Progress value={4.5} className="mt-3 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Upcoming Due</h3>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTasks?.length}</div>
            <p className="text-xs text-muted-foreground">
              {nextDueTask ? (
                <>
                  Next due:{" "}
                  {dayjs(nextDueTask.deadline).format("MMM D, h:mm A")}
                </>
              ) : (
                "No upcoming tasks"
              )}
            </p>
            <Progress value={75} className="mt-3 h-1" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <h3 className="text-base font-medium">Project Progress</h3>
            <p className="text-sm text-muted-foreground">
              Task completion by project category
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(projectProgress).map((projectName) => (
                <div key={projectName} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span
                        className={cn(
                          `h-3 w-3 rounded-full mr-2`,
                          getLabelColor(projectName).bg,
                        )}
                      ></span>
                      <span className="text-sm font-medium">{projectName}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {projectProgress[projectName].completed}/
                      {projectProgress[projectName].total} tasks
                    </span>
                  </div>
                  <Progress
                    value={
                      (projectProgress[projectName].completed /
                        projectProgress[projectName].total) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <h3 className="text-base font-medium">Upcoming Deadlines</h3>
            {nextDueTask ? (
              <p className="text-sm text-muted-foreground">
                Next due task : {nextDueTask.title}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tasks due in the next 30 days
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingTasks?.map((task) => (
                <div key={task.id} className="flex items-center mb-4">
                  <div
                    className={cn(
                      "mr-4 flex h-9 w-9 items-center justify-center rounded-full",
                      getClockColor(task.title).bg,
                    )}
                  >
                    <Clock
                      className={cn("h-5 w-5", getClockColor(task.title).badge)}
                    />
                  </div>
                  <div className="space-y-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    <p className="text-sm font-medium leading-none">
                      {task.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dayjs(task.deadline).format("MMM D, h:mm A")}
                    </p>
                  </div>
                  <div className="ml-auto xl:flex md:hidden gap-1">
                    {task.label.map((label) => (
                      <Badge variant="outline" key={label}>
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardComponent;
