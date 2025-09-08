import { createTSXTemplate } from "../src/templates/tsx-renderer";
import type { TemplateData } from "../src/templates/types";

interface NotificationData extends TemplateData {
  notificationType: string;
  title: string;
  recipientName: string;
  message: string;
  actionRequired?: boolean;
  actionText?: string;
  deadline?: string;
  link?: string;
  senderName: string;
  senderTitle: string;
  companyName: string;
  priorityColor?: string;
  priorityLevel?: "high" | "medium" | "low" | "info";
}

function NotificationEmail(data: NotificationData) {
  const priorityClass = data.priorityLevel ? `priority-${data.priorityLevel}` : "priority-info";

  return (
    <div className="email-container p-5">
      <div className={`${priorityClass} mb-5 rounded-lg p-3 text-white`}>
        <h2 className="m-0 font-semibold text-xl">
          {data.notificationType}: {data.title}
        </h2>
      </div>

      <p className="mb-4 text-gray-700">Hello {data.recipientName},</p>

      <div className="my-5 rounded-lg bg-gray-100 p-4">
        <p className="m-0 text-gray-800">{data.message}</p>
      </div>

      {data.actionRequired && data.actionText && (
        <div className="alert-warning my-5 rounded-lg p-4">
          <h4 className="mt-0 mb-2 font-medium text-lg">⚠️ Action Required</h4>
          <p className="m-0">{data.actionText}</p>
        </div>
      )}

      {data.deadline && (
        <div className="alert-info my-5 rounded-lg p-4">
          <h4 className="mt-0 mb-2 font-medium text-lg">📅 Deadline</h4>
          <p className="m-0">{data.deadline}</p>
        </div>
      )}

      {data.link && (
        <div className="my-8 text-center">
          <a className="email-button" href={data.link}>
            View Details
          </a>
        </div>
      )}

      <hr className="my-8 border-gray-200" />

      <p className="text-gray-600">
        Best regards,
        <br />
        <strong className="text-gray-800">{data.senderName}</strong>
        <br />
        {data.senderTitle}
        <br />
        {data.companyName}
      </p>
    </div>
  );
}

const template = createTSXTemplate({
  name: "notification",
  subject: "{{notificationType}}: {{title}}",
  text: `Hello {{recipientName}},

{{message}}

{{#if actionRequired}}
Action Required: {{actionText}}
{{/if}}

{{#if deadline}}
Deadline: {{deadline}}
{{/if}}

{{#if link}}
More details: {{link}}
{{/if}}

Best regards,
{{senderName}}
{{senderTitle}}
{{companyName}}`,
  component: NotificationEmail,
  description: "General notification email template with TSX support",
  variables: [
    "notificationType",
    "title",
    "recipientName",
    "message",
    "actionRequired",
    "actionText",
    "deadline",
    "link",
    "senderName",
    "senderTitle",
    "companyName",
    "priorityColor",
    "priorityLevel",
  ],
});

export default template;
