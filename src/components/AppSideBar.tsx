"use client";

import { getLabelColor } from "@/lib/color";
import { cn } from "@/lib/utils";
import { BarChart2, Clock, Menu, Tag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ForwardRefExoticComponent, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import useBreakpoint from "@/hooks/useBreakpoint";
import { useDispatch, useSelector } from "react-redux";
import { ReduxState } from "@/redux/store";
import {
  closeSidebar,
  openSidebar,
  toggleSidebar,
} from "@/redux/actions/sidebarAction";

type NavContent = {
  title: string;
  icon: ForwardRefExoticComponent<any>;
  link: string;
};

const NAV_CONTENT: NavContent[] = [
  {
    title: "Board",
    icon: Tag,
    link: "/",
  },
  {
    title: "Dashboard",
    icon: BarChart2,
    link: "/dashboard",
  },
  // {
  //   title: "List",
  //   icon: ListIcon,
  //   link: "/list",
  // },
  {
    title: "Timeline",
    icon: Clock,
    link: "/timeline",
  },
];

const AppSideBar = () => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const { md, lg } = useBreakpoint();
  const isSidebarOpen = useSelector<ReduxState, boolean>(
    (state) => state.sidebar.isSidebarOpen,
  );
  const dispatch = useDispatch();

  // const { data: labels } = useQuery({
  //   queryKey: ["labels"],
  //   queryFn: todoLabelFetchRequest,
  // });
  const labels = [];

  useEffect(() => {
    const handleResize = () => {
      if (lg && !isSidebarOpen) {
        dispatch(openSidebar());
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isSidebarOpen, lg, dispatch]);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleNavigate = () => {
    // TODO: closing animation when navigation
    if (md) return;
    dispatch(closeSidebar());
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleSidebar}
        className={cn(
          "fixed md:hidden z-10 left-4 top-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 w-10 h-10 flex items-center justify-center px-2 mr-2",
          isSidebarOpen && "hidden",
        )}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <div
        ref={sidebarRef}
        className={cn(
          "bg-white dark:bg-gray-900 h-full transition-all duration-300 border-r dark:border-gray-800 z-10 fixed md:relative inset-0",
          isSidebarOpen
            ? "md:w-64"
            : "-translate-x-full md:w-16 md:-translate-x-0",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
          {isSidebarOpen && (
            <Link href="/">
              <h1
                className={cn(
                  "font-bold text-xl text-teal-600 dark:text-teal-400 transition-opacity duration-300",
                  isSidebarOpen ? "opacity-100" : "opacity-0 absolute",
                )}
              >
                KTodo
              </h1>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleSidebar}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 w-8 h-8 flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4">
          <nav className="space-y-2">
            {NAV_CONTENT.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                className="block"
                onClick={handleNavigate}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                    pathname === item.link &&
                      "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white",
                    !isSidebarOpen && "justify-center p-0",
                  )}
                >
                  <item.icon
                    className={cn("h-5 w-5", isSidebarOpen && "mr-2")}
                  />
                  {isSidebarOpen && <span>{item.title}</span>}
                </Button>
              </Link>
            ))}
          </nav>

          {isSidebarOpen && (
            <div className="mt-8">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Projects
              </h3>
              <div className="space-y-1">
                {labels?.map((label) => (
                  <Link
                    key={label}
                    href={`/?filter=${label}`}
                    className="block"
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${getLabelColor(label).bg} mr-2`}
                      ></span>
                      <span>{label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AppSideBar;
