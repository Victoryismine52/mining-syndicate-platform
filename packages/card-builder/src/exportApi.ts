import type { CardConfig } from "./Editor";

// Convert a CardConfig into an OpenAPI 3.0 YAML document.
// Each interactive element gets a minimal POST endpoint so consumers
// can wire up server handlers for buttons and input fields.
export function generateOpenApi(config: CardConfig): string {
  const paths: Record<string, any> = {};

  for (const el of config.elements) {
    // Button elements -> POST endpoint to handle click
    if (el.elementId === "button") {
      paths[`/element/${el.id}`] = {
        post: {
          summary: `Handle ${el.props.label || "button"} click`,
          responses: {
            "200": { description: "Success" },
          },
        },
      };
    }

    // Input display mode -> POST endpoint to submit value
    if (el.displayMode === "input") {
      paths[`/element/${el.id}`] = {
        post: {
          summary: `Submit value for ${el.props.label || "input"}`,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Success" },
          },
        },
      };
    }
  }

  const doc = {
    openapi: "3.0.0",
    info: {
      title: config.name || "Card API",
      version: "1.0.0",
    },
    paths,
  };

  return toYaml(doc);
}

// Minimal YAML serializer for our simple document structure
function toYaml(value: any, indent = 0): string {
  const spacing = "  ".repeat(indent);
  if (Array.isArray(value)) {
    return value
      .map((v) => `${spacing}- ${toYaml(v, indent + 1).trimStart()}`)
      .join("\n");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => {
        const child = toYaml(v, indent + 1);
        if (typeof v === "object" && v !== null && !Array.isArray(v)) {
          return `${spacing}${k}:\n${child}`;
        }
        return `${spacing}${k}: ${child.trim()}`;
      })
      .join("\n");
  }
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

export default generateOpenApi;
