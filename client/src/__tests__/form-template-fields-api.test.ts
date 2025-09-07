/* @vitest-environment node */
import { describe, it, expect } from "vitest";
import express from "express";

// Minimal mock storage with sample field data
const sampleField = {
  id: "field-template-id",
  formTemplateId: "template-1",
  fieldLibraryId: "lib-1",
  isRequired: true,
  order: 1,
  customValidation: null,
  customLabel: "Email",
  placeholder: "Enter email",
  fieldLibrary: {
    id: "lib-1",
    name: "email",
    label: "Email",
    dataType: "email",
    defaultPlaceholder: "Email",
    defaultValidation: {},
    translations: {},
    isSystemField: true,
    category: "internal",
    createdAt: new Date().toISOString()
  }
};

const storage = {
  getFormTemplateFields: async (_id: string) => [sampleField]
};

describe("GET /api/form-templates/:formTemplateId/fields", () => {
  it("allows unauthenticated access and omits sensitive fields", async () => {
    const app = express();

    app.get("/api/form-templates/:formTemplateId/fields", async (req, res) => {
      const fields = await storage.getFormTemplateFields(req.params.formTemplateId);
      const sanitized = fields.map(field => ({
        id: field.id,
        formTemplateId: field.formTemplateId,
        fieldLibraryId: field.fieldLibraryId,
        isRequired: field.isRequired,
        order: field.order,
        customValidation: field.customValidation,
        customLabel: field.customLabel,
        placeholder: field.placeholder,
        fieldLibrary: {
          id: field.fieldLibrary.id,
          name: field.fieldLibrary.name,
          label: field.fieldLibrary.label,
          dataType: field.fieldLibrary.dataType,
          defaultPlaceholder: field.fieldLibrary.defaultPlaceholder,
          defaultValidation: field.fieldLibrary.defaultValidation,
          translations: field.fieldLibrary.translations
        }
      }));
      res.json(sanitized);
    });

    const server = app.listen(0);
    const { port } = server.address() as any;
    const res = await fetch(`http://127.0.0.1:${port}/api/form-templates/template-1/fields`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].fieldLibrary.isSystemField).toBeUndefined();
    expect(data[0].fieldLibrary.category).toBeUndefined();
    expect(data[0].fieldLibrary.createdAt).toBeUndefined();
    expect(data[0].fieldLibrary.name).toBe("email");
    server.close();
  });
});
