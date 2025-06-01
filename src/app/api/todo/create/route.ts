import { getAuthSession } from "@/lib/nextAuthOptions";
import prisma from "@/lib/prismadb";
import { TodoCreateValidator } from "@/lib/validators/todo";
import { getLogger } from "@/logger";

export async function POST(req) {
  const logger = getLogger("info");
  try {
    const session = await getAuthSession();

    if (!session?.user) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();

    const {
      title,
      description = "",
      state,
      deadline,
      label,
    } = TodoCreateValidator.parse(body);

    const todoWithMaxOrderInSameState = await prisma.todo.findFirst({
      where: {
        ownerId: session.user.id,
        state,
        isDeleted: false,
      },
      orderBy: {
        order: "desc",
      },
    });
    const order = !todoWithMaxOrderInSameState
      ? 1
      : todoWithMaxOrderInSameState.order + 1;

    const result = await prisma.todo.create({
      data: {
        title,
        description,
        state,
        label,
        deadline,
        order,
        owner: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    logger.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
