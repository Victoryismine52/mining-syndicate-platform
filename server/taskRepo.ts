import { CreateTaskInput } from "../shared/schema";
import { TaskRepo } from "../shared/taskRepo";

export class SnowflakeTaskRepo implements TaskRepo {
  constructor(private conn: any, private procName: string) {}

  async create(input: CreateTaskInput): Promise<unknown> {
    return await new Promise((resolve, reject) => {
      this.conn.execute({
        sqlText: `call ${this.procName}(?)`,
        binds: [JSON.stringify(input)],
        complete(err: any, _stmt: any, rows: unknown[]) {
          if (err) reject(err);
          else resolve(rows);
        },
      });
    });
  }
}

export class InMemoryTaskRepo implements TaskRepo {
  private data: CreateTaskInput[] = [];

  async create(input: CreateTaskInput): Promise<unknown> {
    this.data.push(input);
    return input;
  }
}

