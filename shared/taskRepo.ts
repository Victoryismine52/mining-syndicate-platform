import { CreateTaskInput } from "./schema";

export interface TaskRepo {
  create(input: CreateTaskInput): Promise<unknown>;
}

