import { State } from "@prisma/client";
import { z } from "zod";

export const TodoCreateValidator = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  state: z.nativeEnum(State),
  deadline: z.number().int().positive().optional(),
  label: z.array(z.string().max(100)).optional(),
});

export const TodoEditValidator = z.object({
  id: z.string().length(24),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  state: z.nativeEnum(State).optional(),
  deadline: z.number().int().positive().nullable().optional(),
  label: z.array(z.string().max(100)).optional(),
  order: z.number().int().min(0).optional(),
});

export const TodoDeleteValidator = z.object({
  id: z.string().length(24),
});

export type TodoCreateRequest = z.infer<typeof TodoCreateValidator>;
export type TodoEditRequest = z.infer<typeof TodoEditValidator>;
export type TodoDeleteRequest = z.infer<typeof TodoDeleteValidator>;
