import * as React from "react";
import { z } from "zod";
import { ErrorBoundary } from "../components/dev/ErrorBoundary";
import { Task, CreateTaskInput } from "../../shared/schema";
import { TaskCard } from "../components/tasks/TaskCard";
import { simulateNext } from "../lib/simulateNext";
import { downloadText, genTaskConfigTS, genExpressStub, genSnowflakeCallProc } from "../lib/generators";
import { tplFormTask, tplDocSigningStarter } from "../lib/templates";

const STORAGE_KEY = "builder-lab-json";

export default function BuilderLab() {
  const [text, setText] = React.useState<string>(() =>
    localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(tplFormTask, null, 2)
  );
  const [parsed, setParsed] = React.useState<CreateTaskInput | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [previewTask, setPreviewTask] = React.useState<Task | null>(null);
  const [fanOut, setFanOut] = React.useState<any[]>([]);

  React.useEffect(() => {
    try {
      const obj = JSON.parse(text);
      setError(null);
      setParsed(obj);
      localStorage.setItem(STORAGE_KEY, text);

      const t: Task = {
        id: "DEV-TASK",
        title: obj.title || "Untitled",
        description: obj.description,
        taskType: obj.taskType as any,
        status: "assigned",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: { id: "brehon-1", role: "brehon", displayName: "Dev Brehon" },
        assignee: obj.assigneeUserId ? { id: obj.assigneeUserId, role: "member", displayName: "Dev Member" } : undefined,
        config: obj.config ?? {},
      };
      setPreviewTask(t);
    } catch (e: any) {
      setError(e.message);
      setParsed(null);
      setPreviewTask(null);
    }
  }, [text]);

  function validateWithZod() {
    try {
      z.any().parse(JSON.parse(text));
      setError(null);
      return true;
    } catch (e: any) {
      setError(String(e.message ?? e));
      return false;
    }
  }

  async function simulateComplete() {
    if (!previewTask) return;
    const fakePayload =
      previewTask.taskType === "form"
        ? { ok: true, signedUpload: "https://example.com/signed.pdf" }
        : { ok: true, uploadedName: "doc.pdf" };
    const next = simulateNext(previewTask, fakePayload);
    setFanOut(next);
  }

  function loadTemplate(kind: "form" | "sign") {
    const tpl = kind === "form" ? tplFormTask : tplDocSigningStarter;
    const s = JSON.stringify(tpl, null, 2);
    setText(s);
  }

  function exportTS() {
    if (!parsed) return;
    downloadText("taskConfig.generated.ts", genTaskConfigTS("GeneratedTask", parsed));
  }
  function exportExpress() {
    downloadText("tasks.generated.route.ts", genExpressStub("/api/tasks/generated"));
  }
  function exportSnowflake() {
    const params = ["TITLE", "DESC", "TYPE", "CREATED_BY", "ASSIGNEE_ID", "CONFIG"];
    downloadText("snowflake.generated.sql", genSnowflakeCallProc("AFRESHSTART.APP.CREATE_TASK", params));
  }

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-semibold">Builder Lab</div>
        <div className="flex gap-2">
          <button className="rounded-lg border px-3 py-1" onClick={()=>loadTemplate("form")}>Load Form Template</button>
          <button className="rounded-lg border px-3 py-1" onClick={()=>loadTemplate("sign")}>Load Doc Signing Template</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border">
          <div className="flex items-center justify-between border-b p-3">
            <div className="text-sm font-semibold">JSON Editor</div>
            <div className="flex gap-2">
              <button className="rounded-lg border px-3 py-1 text-sm" onClick={validateWithZod}>Validate</button>
              <button className="rounded-lg border px-3 py-1 text-sm" onClick={()=>navigator.clipboard.writeText(text)}>Copy</button>
            </div>
          </div>
          <textarea
            className="h-[520px] w-full resize-none p-3 outline-none"
            spellCheck={false}
            value={text}
            onChange={(e)=>setText(e.target.value)}
          />
          {error && <div className="border-t bg-red-50 p-3 text-sm text-red-700">Error: {error}</div>}
        </div>

        <div className="rounded-2xl border">
          <div className="flex items-center justify-between border-b p-3">
            <div className="text-sm font-semibold">Live Preview</div>
            <div className="flex gap-2">
              <button className="rounded-lg border px-3 py-1 text-sm" onClick={simulateComplete}>Simulate Complete</button>
            </div>
          </div>
          <div className="p-3">
            <ErrorBoundary>
              {previewTask ? (
                <TaskCard
                  task={previewTask}
                  canAssign={true}
                  onAssign={() => {}}
                  onOpen={() => {}}
                  onComplete={async () => simulateComplete()}
                />
              ) : (
                <div className="text-sm text-gray-500">Valid JSON required to render.</div>
              )}
            </ErrorBoundary>

            {fanOut.length > 0 && (
              <div className="mt-4 rounded-xl border bg-gray-50 p-3">
                <div className="mb-2 text-sm font-semibold">Next steps (simulated)</div>
                <ul className="list-inside list-disc text-sm">
                  {fanOut.map((n, i) => (
                    <li key={i}><span className="font-medium">{n.title}</span> — <code>{n.taskType}</code></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border">
          <div className="border-b p-3 text-sm font-semibold">Export & Utilities</div>
          <div className="space-y-3 p-3 text-sm">
            <p>When you like what you see, export ready-to-commit stubs:</p>
            <div className="flex flex-col gap-2">
              <button className="rounded-lg border px-3 py-2 text-left" onClick={exportTS}>
                Export TypeScript config (CreateTaskInput)
              </button>
              <button className="rounded-lg border px-3 py-2 text-left" onClick={exportExpress}>
                Export Express route stub
              </button>
              <button className="rounded-lg border px-3 py-2 text-left" onClick={exportSnowflake}>
                Export Snowflake CALL example
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-500">
              Tip: keep this page open while you build—your JSON is saved locally and the preview is crash-isolated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
