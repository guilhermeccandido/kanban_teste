import { getAuthSession } from "@/lib/nextAuthOptions";
import { getLogger } from "@/logger";
import prisma from "@/lib/prismadb";
import { NextRequest } from 'next/server';

// GET /api/projects - List all projects
export async function GET(req: NextRequest) {
  const logger = getLogger("info");
  try {
    const session = await getAuthSession();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "asc", // Or order by name: name: "asc"
      },
    });

    return new Response(JSON.stringify(projects), { status: 200 });
  } catch (error) {
    logger.error("Error fetching projects:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(req: NextRequest) {
  const logger = getLogger("info");
  try {
    const session = await getAuthSession();
    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return new Response("Project name is required", { status: 400 });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description: description || null,
      },
    });

    return new Response(JSON.stringify(newProject), { status: 201 }); // 201 Created
  } catch (error) {
    logger.error("Error creating project:", error);
    // Handle potential unique constraint errors if needed
    return new Response("Internal Server Error", { status: 500 });
  }
}

