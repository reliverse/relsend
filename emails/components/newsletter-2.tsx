import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  pixelBasedPreset,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export function AdvancedDetailsEmail() {
  return (
    <Html>
      <Body>
        <Preview>Relsend Advanced Features - TypeScript Templates & More</Preview>
        <Container>
          <Tailwind
            config={{
              presets: [pixelBasedPreset],
              theme: {
                extend: {
                  colors: {
                    relsend: "#3b82f6",
                    bun: "#fbf0da",
                    resend: "#00d4aa",
                    nodemailer: "#4f46e5",
                    tailwind: "#06b6d4",
                    typescript: "#3178c6",
                  },
                },
              },
            }}
          >
            <Head>
              <Font
                fallbackFontFamily="Verdana"
                fontFamily="Roboto"
                fontStyle="normal"
                fontWeight={400}
                webFont={{
                  url: "https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2",
                  format: "woff2",
                }}
              />
            </Head>
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8">
                {/* Header */}
                <Section className="text-center mb-8">
                  <Heading className="text-4xl font-bold text-relsend mb-4">
                    🚀 Relsend Advanced Features
                  </Heading>
                  <Text className="text-xl text-gray-700 mb-2">
                    Deep Dive into TypeScript Templates, Providers & Advanced Configuration
                  </Text>
                  <Text className="text-lg text-gray-600">
                    Everything you need to master Relsend for production email workflows
                  </Text>
                </Section>

                {/* Architecture Overview */}
                <div className="mb-8 rounded-xl bg-slate-100 p-6 border-2 border-slate-300">
                  <Heading className="mb-4 text-2xl font-bold text-slate-800 flex items-center">
                    🏗️ Architecture Overview
                  </Heading>
                  <Text className="mb-4 text-gray-700 text-lg">
                    Relsend is built with a modular architecture that separates concerns and
                    provides maximum flexibility:
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        title: "Template System",
                        desc: "TypeScript-based email templates with React Email components",
                        features: [
                          "TSX Renderer",
                          "Template Loader",
                          "Variable Injection",
                          "Multi-template Support",
                        ],
                      },
                      {
                        title: "Provider System",
                        desc: "Pluggable email providers with unified interface",
                        features: [
                          "Nodemailer (SMTP)",
                          "Resend API",
                          "Provider Factory",
                          "Configuration Management",
                        ],
                      },
                      {
                        title: "CLI Interface",
                        desc: "Modern command-line interface built for Bun",
                        features: [
                          "Send Commands",
                          "Template Management",
                          "Configuration Tools",
                          "Help System",
                        ],
                      },
                      {
                        title: "Styling System",
                        desc: "Multiple Tailwind CSS integration modes",
                        features: [
                          "React Email Tailwind",
                          "Manual CSS Compilation",
                          "Custom CSS Support",
                          "Email Client Compatibility",
                        ],
                      },
                    ].map((section) => (
                      <div
                        className="bg-white rounded-lg p-4 border border-slate-200"
                        key={section.title}
                      >
                        <Text className="font-bold text-slate-800 mb-2 text-lg">
                          {section.title}
                        </Text>
                        <Text className="text-gray-600 mb-3">{section.desc}</Text>
                        <ul className="text-sm text-gray-500">
                          {section.features.map((feature) => (
                            <li className="mb-1" key={feature}>
                              • {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template System Deep Dive */}
                <div className="mb-8 rounded-xl bg-typescript p-6 border-2 border-blue-300">
                  <Heading className="mb-4 text-2xl font-bold text-white flex items-center">
                    📝 TypeScript Template System
                  </Heading>
                  <Text className="mb-4 text-blue-100 text-lg">
                    Create type-safe, component-based email templates with full TypeScript support:
                  </Text>

                  <div className="mb-6">
                    <Text className="font-bold text-white mb-2">Template Structure</Text>
                    <div className="bg-gray-900 rounded-lg p-4 mb-2">
                      <Text className="text-green-400 font-mono text-sm">
                        {"// emails/welcome.ts"}
                        <br />
                        {'import { defineEmail } from "../src/templates/tsx-renderer";'}
                        <br />
                        {'import { WelcomeEmail } from "./components/welcome-email";'}
                        <br />
                        <br />
                        {"export default defineEmail({"}
                        <br />
                        {'  name: "welcome",'}
                        <br />
                        {'  subject: "Welcome {{userName}}!",'}
                        <br />
                        {"  component: WelcomeEmail,"}
                        <br />
                        {"});"}
                      </Text>
                    </div>
                  </div>

                  <div className="mb-6">
                    <Text className="font-bold text-white mb-2">Component Example</Text>
                    <div className="bg-gray-900 rounded-lg p-4 mb-2">
                      <Text className="text-green-400 font-mono text-sm">
                        {"// emails/components/welcome-email.tsx"}
                        <br />
                        {'import { Html, Body, Text, Button } from "@react-email/components";'}
                        <br />
                        <br />
                        {"interface Props {"}
                        <br />
                        {"  userName: string;"}
                        <br />
                        {"  companyName: string;"}
                        <br />
                        {"}"}
                        <br />
                        <br />
                        {"export function WelcomeEmail({ userName, companyName }: Props) {"}
                        <br />
                        {"  return ("}
                        <br />
                        {"    <Html>"}
                        <br />
                        {"      <Body>"}
                        <br />
                        {"        <Text>Hello {userName}!</Text>"}
                        <br />
                        {'        <Button href="https://example.com">Get Started</Button>'}
                        <br />
                        {"      </Body>"}
                        <br />
                        {"    </Html>"}
                        <br />
                        {"  );"}
                        <br />
                        {"}"}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Provider System */}
                <div className="mb-8 rounded-xl bg-nodemailer p-6 border-2 border-indigo-300">
                  <Heading className="mb-4 text-2xl font-bold text-white flex items-center">
                    🔌 Email Provider System
                  </Heading>
                  <Text className="mb-4 text-indigo-100 text-lg">
                    Relsend supports multiple email providers with a unified interface:
                  </Text>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg p-4">
                      <Text className="font-bold text-indigo-800 mb-2 text-lg">
                        Nodemailer (SMTP)
                      </Text>
                      <Text className="text-gray-600 mb-3">Traditional SMTP server support</Text>
                      <ul className="text-sm text-gray-500 mb-4">
                        <li>• Gmail, Outlook, custom SMTP</li>
                        <li>• OAuth2 & App Password auth</li>
                        <li>• SSL/TLS encryption</li>
                        <li>• Multiple account support</li>
                      </ul>
                      <div className="bg-gray-900 rounded p-2">
                        <Text className="text-green-400 font-mono text-xs">
                          {"RELSEND_HOST=smtp.gmail.com"}
                          <br />
                          {"RELSEND_PORT=587"}
                          <br />
                          {"RELSEND_USER_NAME_1=user@gmail.com"}
                        </Text>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <Text className="font-bold text-resend mb-2 text-lg">Resend API</Text>
                      <Text className="text-gray-600 mb-3">
                        Modern email API with excellent deliverability
                      </Text>
                      <ul className="text-sm text-gray-500 mb-4">
                        <li>• High deliverability rates</li>
                        <li>• Simple API key auth</li>
                        <li>• Built-in analytics</li>
                        <li>• Webhook support</li>
                      </ul>
                      <div className="bg-gray-900 rounded p-2">
                        <Text className="text-green-400 font-mono text-xs">
                          {"RELSEND_PROVIDER=resend"}
                          <br />
                          {"RELSEND_API_KEY=re_123456789"}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tailwind CSS Integration */}
                <div className="mb-8 rounded-xl bg-tailwind p-6 border-2 border-cyan-300">
                  <Heading className="mb-4 text-2xl font-bold text-white flex items-center">
                    🎨 Tailwind CSS Integration
                  </Heading>
                  <Text className="mb-4 text-cyan-100 text-lg">
                    Multiple Tailwind CSS modes for different use cases and email client
                    compatibility:
                  </Text>

                  <div className="space-y-4">
                    {[
                      {
                        mode: "v3 (Default)",
                        desc: "React Email Tailwind with automatic inline styles",
                        code: "--tailwind v3",
                        features: [
                          "Automatic inline styles",
                          "Email client compatibility",
                          "React Email components",
                        ],
                      },
                      {
                        mode: "v4",
                        desc: "Manual CSS compilation from styles/dist/output.css",
                        code: "--tailwind v4",
                        features: [
                          "Full control over CSS",
                          "Custom Tailwind builds",
                          "Advanced configurations",
                        ],
                      },
                      {
                        mode: "off",
                        desc: "No CSS processing for custom stylesheets",
                        code: "--tailwind off",
                        features: ["Custom CSS files", "External stylesheets", "Complete control"],
                      },
                    ].map((mode) => (
                      <div className="bg-white rounded-lg p-4" key={mode.mode}>
                        <div className="flex justify-between items-start mb-2">
                          <Text className="font-bold text-cyan-800">{mode.mode}</Text>
                          <Text className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                            {mode.code}
                          </Text>
                        </div>
                        <Text className="text-gray-600 mb-2">{mode.desc}</Text>
                        <ul className="text-sm text-gray-500">
                          {mode.features.map((feature) => (
                            <li className="mb-1" key={feature}>
                              • {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Configuration */}
                <div className="mb-8 rounded-xl bg-gray-100 p-6 border-2 border-gray-300">
                  <Heading className="mb-4 text-2xl font-bold text-gray-800 flex items-center">
                    ⚙️ Advanced Configuration
                  </Heading>
                  <Text className="mb-4 text-gray-700 text-lg">
                    Fine-tune Relsend for your specific needs with advanced configuration options:
                  </Text>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Text className="font-bold text-gray-800 mb-2">Environment Variables</Text>
                      <div className="bg-gray-900 rounded-lg p-4 mb-2">
                        <Text className="text-green-400 font-mono text-sm">
                          {"# Provider selection"}
                          <br />
                          {"RELSEND_PROVIDER=nodemailer|resend"}
                          <br />
                          <br />
                          {"# SMTP Configuration"}
                          <br />
                          {"RELSEND_HOST=smtp.gmail.com"}
                          <br />
                          {"RELSEND_PORT=587"}
                          <br />
                          {"RELSEND_SECURE=false"}
                          <br />
                          <br />
                          {"# Authentication"}
                          <br />
                          {"RELSEND_USER_NAME_1=user@example.com"}
                          <br />
                          {"RELSEND_USER_PASS_1=password"}
                        </Text>
                      </div>
                    </div>

                    <div>
                      <Text className="font-bold text-gray-800 mb-2">CLI Configuration</Text>
                      <div className="bg-gray-900 rounded-lg p-4 mb-2">
                        <Text className="text-green-400 font-mono text-sm">
                          {"# Set configuration"}
                          <br />
                          {"bun relsend config set host=smtp.gmail.com"}
                          <br />
                          {"bun relsend config set port=587"}
                          <br />
                          <br />
                          {"# View configuration"}
                          <br />
                          {"bun relsend config get"}
                          <br />
                          <br />
                          {"# List templates"}
                          <br />
                          {"bun relsend template list"}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Best Practices */}
                <div className="mb-8 rounded-xl bg-green-100 p-6 border-2 border-green-300">
                  <Heading className="mb-4 text-2xl font-bold text-green-800 flex items-center">
                    🏆 Production Best Practices
                  </Heading>
                  <Text className="mb-4 text-gray-700 text-lg">
                    Follow these best practices for production email workflows:
                  </Text>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      {
                        title: "Security",
                        practices: [
                          "Use environment variables for credentials",
                          "Enable OAuth2 for Gmail",
                          "Rotate API keys regularly",
                          "Use app passwords, not main passwords",
                        ],
                      },
                      {
                        title: "Performance",
                        practices: [
                          "Use Resend for high-volume sending",
                          "Implement email queuing for bulk sends",
                          "Cache template compilation",
                          "Use CDN for images and assets",
                        ],
                      },
                      {
                        title: "Deliverability",
                        practices: [
                          "Set up SPF, DKIM, DMARC records",
                          "Use dedicated IP addresses",
                          "Monitor bounce rates",
                          "Implement unsubscribe handling",
                        ],
                      },
                      {
                        title: "Monitoring",
                        practices: [
                          "Track email open rates",
                          "Monitor bounce rates",
                          "Set up error alerting",
                          "Log email sending events",
                        ],
                      },
                    ].map((category) => (
                      <div className="bg-white rounded-lg p-4" key={category.title}>
                        <Text className="font-bold text-green-800 mb-3">{category.title}</Text>
                        <ul className="text-sm text-gray-600">
                          {category.practices.map((practice) => (
                            <li className="mb-2" key={practice}>
                              ✓ {practice}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Section */}
                <div className="mb-8 rounded-xl bg-relsend p-6 border-2 border-blue-300 text-center">
                  <Heading className="mb-4 text-2xl font-bold text-white">
                    🚀 Ready to Master Relsend?
                  </Heading>
                  <Text className="mb-6 text-blue-100 text-lg">
                    Start building production-ready email workflows with TypeScript templates today.
                  </Text>
                  <div className="space-y-3">
                    <Button
                      className="bg-white text-relsend px-8 py-4 font-bold rounded-xl transition-all duration-300 shadow-lg"
                      href="https://github.com/blefnk/relsend"
                    >
                      View Documentation
                    </Button>
                    <br />
                    <Button
                      className="bg-green-600 text-white px-8 py-4 font-bold rounded-xl transition-all duration-300 shadow-lg"
                      href="https://www.npmjs.com/package/@reliverse/relsend"
                    >
                      Install Relsend
                    </Button>
                  </div>
                </div>

                {/* Footer */}
                <Hr className="border-gray-200 mt-8" />
                <Section className="text-center mt-6">
                  <Text className="text-gray-600 mb-2">Built with ❤️ by the Reliverse team</Text>
                  <Text className="text-sm text-gray-500">
                    Relsend • TypeScript Templates • Bun Native • Production Ready
                  </Text>
                </Section>
              </div>
            </div>
          </Tailwind>
        </Container>
      </Body>
    </Html>
  );
}

export default AdvancedDetailsEmail;
