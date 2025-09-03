import * as React from "react";
import { Task } from "../../../../shared/schema";

export function ReviewTaskBody({ task, onComplete }:{
  task: Task; onComplete?: (taskId: string, payload?: Record<string, any>) => Promise<void>
}) {
  const steps = task.config?.verificationSteps || [];
  const [checks, setChecks] = React.useState<boolean[]>(() => steps.map(()=>false));
  const [busy, setBusy] = React.useState(false);

  function toggle(i:number){ setChecks(a => a.map((v,idx)=> idx===i ? !v : v)); }
  const allOk = checks.every(Boolean) || steps.length === 0;

  async function submit() {
    setBusy(true);
    try {
      await onComplete?.(task.id, { verification: steps.map((s,i)=>({ step:s, ok:checks[i] })) });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-2">
      {task.config?.documentUrl && (
        <a href={task.config.documentUrl} target="_blank" className="text-sm underline">
          Open document
        </a>
      )}
      {steps.length > 0 ? (
        <ul className="space-y-2">
          {steps.map((s,i)=>(
            <li key={i} className="flex items-center gap-2">
              <input type="checkbox" checked={checks[i]} onChange={()=>toggle(i)} />
              <span className="text-sm">{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-600">No checklist provided.</p>
      )}
      <div className="flex justify-end">
        <button disabled={!allOk || busy} onClick={submit}
                className="rounded-lg bg-black px-3 py-1 text-white disabled:opacity-50">
          {busy ? "Completing…" : "Complete review"}
        </button>
      </div>
    </div>
  );
}
