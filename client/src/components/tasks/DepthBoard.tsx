import * as React from "react";
import { motion } from "framer-motion";
import { Task, TaskStatus } from "../../../shared/schema";
import { TaskCard } from "./TaskCard";

type Dim = "workflowId" | "assigneeId" | "taskType";
const COLS: Array<{ key: TaskStatus; title: string }> = [
  { key: "unassigned",  title: "Unassigned" },
  { key: "assigned",    title: "Assigned" },
  { key: "in_progress", title: "In Progress" },
  { key: "completed",   title: "Completed" },
];

export function DepthBoard({
  tasks, canAssign, onAssign, onComplete,
  groupBy = "workflowId"
}: {
  tasks: Task[];
  canAssign: boolean;
  onAssign: (taskId: string) => void;
  onComplete: (taskId: string, payload?: Record<string, any>) => Promise<void>;
  groupBy?: Dim;
}) {
  const [mouse, setMouse] = React.useState({ x: 0.5, y: 0.5 });
  function onMove(e: React.MouseEvent) {
    const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  }

  return (
    <div
      onMouseMove={onMove}
      className="grid gap-4 md:grid-cols-4"
      style={{ perspective: 1100 }}
    >
      {COLS.map(col => {
        const inCol = tasks.filter(t => t.status === col.key);
        const stacks = groupIntoStacks(inCol, groupBy);
        return (
          <div key={col.key} className="rounded-2xl border bg-gray-50/60 p-3">
            <div className="mb-2 text-sm font-semibold">{col.title}</div>
            <div
              className="relative h-[560px] overflow-hidden rounded-xl border bg-white"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 p-3"
                style={{
                  transformStyle: "preserve-3d",
                  transform: parallax(mouse, 8),
                }}
              >
                <div className="grid grid-cols-1 gap-4">
                  {stacks.map((stack, idx) => (
                    <Stack3D
                      key={stack.key}
                      title={stack.label}
                      tasks={stack.items}
                      canAssign={canAssign}
                      onAssign={onAssign}
                      onComplete={onComplete}
                      mouse={mouse}
                      zBase={(stacks.length - idx) * -40}
                    />
                  ))}
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function parallax(mouse:{x:number;y:number}, tilt=10){
  const rx = (mouse.y - 0.5) * -tilt;
  const ry = (mouse.x - 0.5) *  tilt;
  return `rotateX(${rx}deg) rotateY(${ry}deg)`;
}

function groupIntoStacks(tasks: Task[], dim: "workflowId"|"assigneeId"|"taskType"){
  const by: Record<string, Task[]> = {};
  for (const t of tasks){
    const key =
      dim === "workflowId" ? (t.config?.workflowId ?? "no-workflow") :
      dim === "assigneeId" ? (t.assignee?.id ?? "unassigned") :
      t.taskType;
    (by[key] ||= []).push(t);
  }
  return Object.entries(by).map(([key, items]) => ({
    key,
    label: key,
    items: items.sort(prioritySort),
  }));
}

function prioritySort(a: Task, b: Task) {
  return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
}

function Stack3D({
  title, tasks, canAssign, onAssign, onComplete, zBase, mouse
}: {
  title: string;
  tasks: Task[];
  canAssign: boolean;
  onAssign: (taskId: string)=>void;
  onComplete: (taskId: string, payload?: Record<string, any>)=>Promise<void>;
  zBase: number;
  mouse:{x:number;y:number};
}) {
  return (
    <div className="relative" style={{ transformStyle: "preserve-3d" }}>
      <div className="mb-2 text-xs font-semibold text-gray-500">{title}</div>
      <div className="relative h-[220px]" style={{ transformStyle: "preserve-3d" }}>
        {tasks.map((t, i) => {
          const z = zBase + i * 12;
          const y = i * -4;
          const rot = (i % 2 ? -1 : 1) * Math.min(i, 3);
          return (
            <motion.div
              key={t.id}
              className="absolute inset-x-0"
              style={{
                transformStyle: "preserve-3d",
                transform: `translateY(${y}px) translateZ(${z}px) rotateZ(${rot}deg)`,
              }}
              whileHover={{ translateZ: z + 24, rotateZ: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
            >
              <TaskCard
                task={t}
                canAssign={canAssign}
                onAssign={onAssign}
                onOpen={()=>{}}
                onComplete={onComplete}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
