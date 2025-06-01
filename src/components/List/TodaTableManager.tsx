"use client";

import { State, Todo } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import TableSortedIcon from "./TableSortedIcon";
import TodoTable from "./TodoTable";
import { useQuery } from "react-query";
import todoFetchRequest from "@/requests/todoFetchRequest";

const TodoTableManager = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: todos } = useQuery({
    queryKey: ["todos"],
    queryFn: () => todoFetchRequest(),
  });
  const order = useMemo(() => Object.values(State), []);

  const todoColumns: ColumnDef<Todo>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          <span className="mr-2">Title</span>
          <TableSortedIcon
            isSorted={!!column.getIsSorted()}
            isSortedDesc={column.getIsSorted() === "desc"}
          />
        </Button>
      ),
    },
    {
      accessorKey: "state",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          <span className="mr-2">State</span>
          <TableSortedIcon
            isSorted={!!column.getIsSorted()}
            isSortedDesc={column.getIsSorted() === "desc"}
          />
        </Button>
      ),
      sortingFn: (rowA, rowB) => {
        return (
          order.indexOf(rowA.original.state) -
          order.indexOf(rowB.original.state)
        );
      },
    },
    {
      accessorKey: "deadline",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          <span className="mr-2">Deadline</span>
          <TableSortedIcon
            isSorted={!!column.getIsSorted()}
            isSortedDesc={column.getIsSorted() === "desc"}
          />
        </Button>
      ),
      cell: ({ row }) => {
        if (!row.original.deadline) return null;

        return dayjs(row.original.deadline).format("YYYY/MM/DD");
      },
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => {
        if (!row.original.label) return null;

        return (
          <div className="flex gap-2 flex-wrap max-w-xs">
            {row.original.label.map((label) => {
              return (
                <span
                  key={label}
                  className="px-2 rounded-sm bg-gray-200 leading-5 max-w-[75px] flex-wrap overflow-hidden whitespace-nowrap text-ellipsis"
                >
                  {label}
                </span>
              );
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          <span className="mr-2">Created At</span>
          <TableSortedIcon
            isSorted={!!column.getIsSorted()}
            isSortedDesc={column.getIsSorted() === "desc"}
          />
        </Button>
      ),
      cell: ({ row }) => {
        return dayjs(row.original.createdAt).format("YYYY/MM/DD");
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="p-0"
        >
          <span className="mr-2">Updated At</span>
          <TableSortedIcon
            isSorted={!!column.getIsSorted()}
            isSortedDesc={column.getIsSorted() === "desc"}
          />
        </Button>
      ),
      cell: ({ row }) => {
        return dayjs(row.original.updatedAt).format("YYYY/MM/DD");
      },
    },
  ];

  if (!isMounted) return null;

  return (
    <>
      <TodoTable columns={todoColumns} data={todos || []} />
    </>
  );
};

export default TodoTableManager;
