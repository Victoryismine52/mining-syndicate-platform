import { CreateTaskInput } from "../../shared/schema";

export const tplFormTask: CreateTaskInput = {
  title: "Member Profile Form",
  taskType: "form",
  description: "Please complete your onboarding profile.",
  config: {
    instructions: "Fill all required fields.",
    formSchema: {
      title: "Onboarding Profile",
      fields: [
        { id: "fullName", label: "Full Name", type: "text", required: true },
        { id: "dob", label: "Date of Birth", type: "date", required: true },
        { id: "bio", label: "Short Bio", type: "textarea" },
        { id: "idPhoto", label: "ID Photo", type: "file", required: true, accept: ["image/*"], maxSizeMB: 10 },
      ],
    },
  },
};

export const tplDocSigningStarter: CreateTaskInput = {
  title: "Initiate Document Signing",
  taskType: "upload",
  description: "Brehon uploads the document to be signed.",
  config: {
    requiresUpload: true,
    uploadFileTypes: [".pdf"],
    maxFileSizeMB: 25,
    workflowId: "doc-sign-DEV",
    nextOnComplete: [
      {
        type: "form",
        title: "Sign Document",
        assignTo: "specific",
        specificUserId: "MEMBER_ID_HERE",
        config: {
          instructions: "Download the PDF, sign it, and re-upload.",
          formSchema: {
            title: "Sign & Upload",
            fields: [
              { id: "downloaded", label: "I have downloaded the document", type: "checkbox", required: true },
              { id: "signedUpload", label: "Upload signed PDF", type: "file", required: true, accept: [".pdf"], maxSizeMB: 25 },
            ],
          },
          nextOnComplete: [
            {
              type: "document_review",
              title: "Review Signed Document",
              assignTo: "brehon",
              config: { verificationSteps: ["Signature present", "All pages intact"], documentUrl: "{{payload.signedUpload}}" },
            },
          ],
        },
      },
    ],
  },
};
