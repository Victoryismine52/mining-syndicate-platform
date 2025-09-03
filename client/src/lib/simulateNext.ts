import { Task } from "../../shared/schema";

/** Very small interpolation for {{payload.*}} paths */
function interp(str: any, payload: any) {
  if (typeof str !== "string") return str;
  return str.replace(/\{\{\s*payload\.([a-zA-Z0-9_\.]+)\s*\}\}/g, (_m, path) => {
    const parts = path.split(".");
    let cur: any = payload;
    for (const p of parts) { if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p]; else return ""; }
    return String(cur ?? "");
  });
}
function deepInterp<T = any>(obj: T, payload: any): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return interp(obj, payload) as any;
  if (Array.isArray(obj)) return obj.map(v => deepInterp(v, payload)) as any;
  if (typeof obj === "object") {
    const out: any = {};
    for (const k of Object.keys(obj as any)) out[k] = deepInterp((obj as any)[k], payload);
    return out;
  }
  return obj;
}

/** Simulate server behavior: given a completed task + payload, produce the follow-ups */
export function simulateNext(task: Task, payload: Record<string, any>) {
  const next = task.config?.nextOnComplete ?? [];
  return next.map(n => ({
    title: n.title ?? `Next: ${n.type}`,
    taskType: n.type,
    assignee: n.assignTo ?? "unassigned",
    config: deepInterp(n.config ?? {}, payload),
  }));
}
