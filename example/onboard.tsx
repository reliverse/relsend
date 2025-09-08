import { Button, Head, Html, pixelBasedPreset, Tailwind } from "@react-email/components";
import { createTSXTemplate } from "../src/templates/tsx-renderer";
import type { TemplateData } from "../src/templates/types";

interface MyEmailData extends TemplateData {
  userName?: string;
  companyName?: string;
  ctaUrl?: string;
  ctaText?: string;
}

function MyEmail(data: MyEmailData) {
  return (
    <Html>
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brand: "#007291",
              },
            },
          },
        }}
      >
        <Head />
        <div className="bg-gray-50 p-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to {data.companyName || "Our Service"}, {data.userName || "there"}!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for joining us! We're excited to have you on board.
            </p>
            <Button
              className="bg-brand px-6 py-3 font-medium leading-4 text-white rounded-md hover:bg-blue-700 transition-colors"
              href={data.ctaUrl || "https://example.com"}
            >
              {data.ctaText || "Get Started"}
            </Button>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>
          </div>
        </div>
      </Tailwind>
    </Html>
  );
}

const template = createTSXTemplate({
  name: "my-email",
  subject: "Welcome to {{companyName}}, {{userName}}!",
  text: `Hi {{userName}},

Welcome to {{companyName}}! We're excited to have you on board.

Thank you for joining us! We're excited to have you on board.

If you have any questions, feel free to reach out to our support team.

Best regards,
The {{companyName}} Team`,
  component: MyEmail,
  description: "Modern email template with react-email Tailwind support",
  variables: ["userName", "companyName", "ctaUrl", "ctaText"],
});

export default template;
