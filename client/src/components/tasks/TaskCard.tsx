import * as React from "react";
import { Card } from "../cards/Card";
import { Task } from "../../../shared/schema";
import { FormTaskBody } from "./renderers/FormTaskBody";
import { UploadTaskBody } from "./renderers/UploadTaskBody";
import { ReviewTaskBody } from "./renderers/ReviewTaskBody";

export type TaskCardProps = {
  task: Task;
  canAssign: boolean;
  onAssign?: (taskId: string) => void;
  onOpen?: (task: Task) => void;
  onComplete?: (taskId: string, payload?: Record<string, any>) => Promise<void>;
};

const rendererByType: Record<Task["taskType"], React.FC<TaskCardProps>> = {
  general: BaseRenderer,
  document_review: ReviewRenderer,
  verification: ReviewRenderer,
  upload: UploadRenderer,
  form: FormRenderer,
  workflow_step: BaseRenderer,
};

export function TaskCard(props: TaskCardProps) {
  const Renderer = rendererByType[props.task.taskType] ?? BaseRenderer;
  return <Renderer {...props} />;
}

function BaseRenderer({ task, canAssign, onAssign, onOpen }: TaskCardProps) {
  return (
    <Card
      title={task.title}
      subtitle={`${task.taskType} • ${task.status}`}
      statusBadge={<span className="capitalize">{task.status}</span>}
      actions={
        <div className="flex gap-2">
          {canAssign && task.status === "unassigned" && (
            <button className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                    onClick={(e)=>{e.stopPropagation(); onAssign?.(task.id);}}>
              Assign
            </button>
          )}
          <button className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                  onClick={(e)=>{e.stopPropagation(); onOpen?.(task);}}>
            View
          </button>
        </div>
      }
      onClick={() => onOpen?.(task)}
    >
      {task.description && <p className="text-sm text-gray-600">{task.description}</p>}
    </Card>
  );
}

function FormRenderer(p: TaskCardProps) {
  return (
    <Card
      title={p.task.title}
      subtitle={`form • ${p.task.status}`}
      statusBadge={<span>form</span>}
      actions={<MiniActions {...p} />}
      onClick={() => p.onOpen?.(p.task)}
    >
      <FormTaskBody task={p.task} onComplete={p.onComplete} />
    </Card>
  );
}

function UploadRenderer(p: TaskCardProps) {
  return (
    <Card
      title={p.task.title}
      subtitle={`upload • ${p.task.status}`}
      statusBadge={<span>upload</span>}
      actions={<MiniActions {...p} />}
      onClick={() => p.onOpen?.(p.task)}
    >
      <UploadTaskBody task={p.task} onComplete={p.onComplete} />
    </Card>
  );
}

function ReviewRenderer(p: TaskCardProps) {
  return (
    <Card
      title={p.task.title}
      subtitle={`review • ${p.task.status}`}
      statusBadge={<span>review</span>}
      actions={<MiniActions {...p} />}
      onClick={() => p.onOpen?.(p.task)}
    >
      <ReviewTaskBody task={p.task} onComplete={p.onComplete} />
    </Card>
  );
}

function MiniActions({ task, canAssign, onAssign, onOpen }: TaskCardProps) {
  return (
    <div className="flex gap-2">
      {canAssign && task.status === "unassigned" && (
        <button className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
                onClick={(e)=>{e.stopPropagation(); onAssign?.(task.id);}}>
          Assign
        </button>
      )}
      <button className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
              onClick={(e)=>{e.stopPropagation(); onOpen?.(task);}}>
        View
      </button>
    </div>
  );
}
