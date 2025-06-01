import { getAuthSession } from "@/lib/nextAuthOptions";
import { getLogger } from "@/logger";
import prisma from "@/lib/prismadb";
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const logger = getLogger("info");
  try {
    const session = await getAuthSession();

    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const view = url.searchParams.get("view");
    const projectId = url.searchParams.get("projectId"); // Get projectId from query params

    let whereClause: any = {
      isDeleted: false,
    };

    // Conditionally add ownerId filter if view=mine is requested
    if (view === "mine") {
      whereClause.ownerId = session.user.id;
    }

    // Conditionally add projectId filter if provided
    // If projectId is 'all' or null/undefined, don't filter by project
    if (projectId && projectId !== 'all') {
        whereClause.projectId = projectId;
    } else if (!projectId) {
        // Default behavior if no projectId is specified: maybe fetch only todos without a project?
        // Or fetch all? For now, let's fetch all if no specific project is requested.
        // If you want to fetch ONLY unassigned todos by default, use: whereClause.projectId = null;
    }

    const todos = await prisma.todo.findMany({
      where: whereClause,
      orderBy: {
        order: "asc",
      },
      include: {
        owner: {
          select: { id: true, name: true, image: true }
        },
        project: {
          select: { id: true, name: true } // Include project info
        }
        // Add other relations like assignee, labels here when implemented
      }
    });

    return new Response(JSON.stringify(todos), { status: 200 });
  } catch (error) {
    logger.error("Error fetching todos:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

