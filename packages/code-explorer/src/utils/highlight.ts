import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";

/**
 * Highlights code using Prism.
 * If the requested grammar is missing or Prism throws,
 * the original code is returned to avoid runtime errors.
 */
export function highlightCode(code: string, language = "tsx"): string {
  try {
    const grammar = Prism.languages[language] ?? Prism.languages.tsx;
    return Prism.highlight(code, grammar, language);
  } catch {
    return code;
  }
}
