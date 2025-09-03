import * as React from "react";
import { Task, FormSchema } from "../../../../shared/schema";

export function FormTaskBody({
  task,
  onComplete
}: { task: Task; onComplete?: (taskId: string, payload?: Record<string, any>) => Promise<void> }) {
  const schema = task.config?.formSchema as FormSchema | undefined;
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [errs, setErrs]     = React.useState<Record<string, string>>({});
  const [busy, setBusy]     = React.useState(false);

  if (!schema) return <div className="text-sm text-red-500">Missing form config.</div>;

  function set<K extends string>(k: K, v: any) { setValues(s => ({...s, [k]: v})); }
  function validate() {
    const e: Record<string,string> = {};
    for (const f of schema.fields) {
      const v = values[f.id];
      if (f.required && (v === undefined || v === null || v === "")) e[f.id] = "Required";
    }
    setErrs(e); return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      await onComplete?.(task.id, values);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {task.config?.instructions && <p className="text-sm text-gray-600">{task.config.instructions}</p>}
      {schema.fields.map(f => (
        <div key={f.id}>
          <label className="text-sm font-medium">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>
          <Field field={f} value={values[f.id]} onChange={(v)=>set(f.id, v)} />
          {errs[f.id] && <div className="text-xs text-red-600">{errs[f.id]}</div>}
        </div>
      ))}
      <div className="flex justify-end">
        <button disabled={busy} onClick={submit}
                className="rounded-lg bg-black px-3 py-1 text-white disabled:opacity-50">
          {busy ? "Submitting…" : "Submit"}
        </button>
      </div>
    </div>
  );
}

function Field({ field, value, onChange }:{
  field: FormSchema["fields"][number]; value: any; onChange: (v:any)=>void;
}) {
  switch (field.type) {
    case "text":
    case "number":
    case "date":
      return <input type={field.type==="text" ? "text" : field.type}
                    className="mt-1 w-full rounded-lg border p-2"
                    value={value ?? ""} onChange={(e)=>onChange(field.type==="number" ? Number(e.target.value) : e.target.value)} />;
    case "textarea":
      return <textarea className="mt-1 w-full rounded-lg border p-2" rows={4} value={value ?? ""} onChange={(e)=>onChange(e.target.value)} />;
    case "select":
      return <select className="mt-1 w-full rounded-lg border p-2" value={value ?? ""} onChange={(e)=>onChange(e.target.value)}>
        <option value="">Select…</option>
        {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
      </select>;
    case "checkbox":
      return <input className="mt-1 h-4 w-4" type="checkbox" checked={!!value} onChange={(e)=>onChange(e.target.checked)} />;
    case "file":
      return <input className="mt-1 w-full" type="file" accept={field.accept?.join(",")} onChange={(e)=>onChange(e.target.files?.[0] ?? null)} />;
    default: return null;
  }
}
