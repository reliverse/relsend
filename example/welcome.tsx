import { createTSXTemplate } from "../src/templates/tsx-renderer";
import type { TemplateData } from "../src/templates/types";

interface WelcomeData extends TemplateData {
  companyName: string;
  userName: string;
  userEmail: string;
  userRole: string;
  startDate: string;
  supportEmail: string;
}

function WelcomeEmail(data: WelcomeData) {
  return (
    <div className="email-container p-5">
      <h1 className="mb-6 font-bold text-3xl text-gray-800">
        Welcome to {data.companyName}, {data.userName}!
      </h1>

      <p className="mb-4 text-gray-700">Hi {data.userName},</p>

      <p className="mb-6 text-gray-700">
        Welcome to {data.companyName}! We're excited to have you on board.
      </p>

      <div className="my-6 rounded-lg bg-gray-100 p-4">
        <h3 className="mt-0 mb-3 font-semibold text-gray-700 text-lg">Your account details:</h3>
        <ul className="list-none space-y-2 p-0">
          <li className="text-gray-700">
            <strong className="text-gray-800">Email:</strong> {data.userEmail}
          </li>
          <li className="text-gray-700">
            <strong className="text-gray-800">Role:</strong> {data.userRole}
          </li>
          <li className="text-gray-700">
            <strong className="text-gray-800">Start Date:</strong> {data.startDate}
          </li>
        </ul>
      </div>

      <p className="mb-6 text-gray-700">
        If you have any questions, feel free to reach out to our support team at{" "}
        <a
          className="text-blue-600 underline hover:text-blue-800"
          href={`mailto:${data.supportEmail}`}
        >
          {data.supportEmail}
        </a>
        .
      </p>

      <p className="text-gray-600">
        Best regards,
        <br />
        The {data.companyName} Team
      </p>
    </div>
  );
}

const template = createTSXTemplate({
  name: "welcome",
  subject: "Welcome to {{companyName}}, {{userName}}!",
  text: `Hi {{userName}},

Welcome to {{companyName}}! We're excited to have you on board.

Your account details:
- Email: {{userEmail}}
- Role: {{userRole}}
- Start Date: {{startDate}}

If you have any questions, feel free to reach out to our support team at {{supportEmail}}.

Best regards,
The {{companyName}} Team`,
  component: WelcomeEmail,
  description: "Welcome email for new users with TSX support",
  variables: ["companyName", "userName", "userEmail", "userRole", "startDate", "supportEmail"],
});

export default template;
