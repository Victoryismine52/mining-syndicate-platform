import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";

/**
{
  "friendlyName": "highlight code",
  "description": "Highlights source code using Prism based on file extension, with graceful fallback.",
  "editCount": 1,
  "tags": ["utility", "syntax"],
  "location": "src/utils/highlight",
  "notes": "Supports ts, tsx, js, jsx; returns raw code for unsupported types or on failure."
}
*/
export function highlightCode(code: string, ext: string): string {
  try {
    const langMap: Record<string, string> = {
      ts: "typescript",
      tsx: "tsx",
      js: "javascript",
      jsx: "jsx",
    };
    const lang = langMap[ext];
    if (!lang) return code;
    const grammar = Prism.languages[lang];
    if (!grammar) return code;
    return Prism.highlight(code, grammar, lang);
  } catch {
    return code;
  }
}
