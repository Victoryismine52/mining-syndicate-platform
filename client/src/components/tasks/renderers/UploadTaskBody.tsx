import * as React from "react";
import { Task } from "../../../../shared/schema";

export function UploadTaskBody({ task, onComplete }:{
  task: Task; onComplete?: (taskId: string, payload?: Record<string, any>) => Promise<void>
}) {
  const [file, setFile] = React.useState<File|null>(null);
  const [busy, setBusy] = React.useState(false);
  const accept = (task.config?.uploadFileTypes || []).join(",");

  async function submit() {
    if (!file) return;
    setBusy(true);
    try {
      await onComplete?.(task.id, { uploadedName: file.name });
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">{task.config?.instructions || "Upload required file."}</p>
      <input type="file" accept={accept} onChange={(e)=>setFile(e.target.files?.[0] ?? null)} />
      <div className="flex justify-end">
        <button disabled={!file || busy} onClick={submit}
          className="rounded-lg bg-black px-3 py-1 text-white disabled:opacity-50">
          {busy ? "Uploading…" : "Submit upload"}
        </button>
      </div>
    </div>
  );
}
