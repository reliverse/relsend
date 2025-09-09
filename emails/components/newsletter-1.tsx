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

export function OnboardEmail() {
  return (
    <Html>
      <Body>
        <Preview>Welcome to Relsend - Your Modern Email CLI</Preview>
        <Container>
          <Tailwind config={{ presets: [pixelBasedPreset] }}>
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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
              <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-8">
                {/* Header */}
                <Section className="text-center mb-8">
                  <Heading className="text-4xl font-bold text-blue-600 mb-4">
                    🚀 Welcome to Relsend
                  </Heading>
                  <Text className="text-xl text-gray-700 mb-2">
                    Your Modern Email CLI for TypeScript Templates
                  </Text>
                  <Text className="text-lg text-gray-600">
                    Built with Bun • Supports Nodemailer & Resend • Zero Mental Overhead
                  </Text>
                </Section>

                {/* Quick Start */}
                <div className="mb-8 rounded-xl bg-green-100 p-6 border-2 border-green-300">
                  <Heading className="mb-4 text-2xl font-bold text-green-800 flex items-center">
                    ⚡ Quick Start
                  </Heading>
                  <Text className="mb-4 text-gray-700 text-lg">
                    Get up and running with Relsend in under 2 minutes:
                  </Text>
                  <div className="bg-gray-900 rounded-lg p-4 mb-4">
                    <Text className="text-green-400 font-mono text-sm">
                      # Install Relsend
                      <br />
                      bun add -D @reliverse/relsend
                      <br />
                      <br /># Send your first email
                      <br />
                      bun relsend send --to "user@example.com" --subject "Hello" --text "Hello
                      World"
                    </Text>
                  </div>
                  <Text className="text-gray-700">
                    That's it! Relsend handles the rest with beautiful TypeScript templates and
                    multiple email providers.
                  </Text>
                </div>

                {/* Key Features */}
                <div className="mb-8 rounded-xl bg-blue-100 p-6 border-2 border-blue-300">
                  <Heading className="mb-4 text-2xl font-bold text-blue-800 flex items-center">
                    ✨ Key Features
                  </Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        icon: "🔧",
                        title: "Multiple Providers",
                        desc: "Nodemailer (SMTP) & Resend",
                      },
                      { icon: "⚡", title: "Built for Bun", desc: "Native Bun support & speed" },
                      {
                        icon: "🎨",
                        title: "TypeScript Templates",
                        desc: "Component-based email design",
                      },
                      { icon: "🎯", title: "Tailwind CSS", desc: "Multiple Tailwind modes" },
                      {
                        icon: "🔒",
                        title: "Secure by Default",
                        desc: "Environment variable config",
                      },
                      { icon: "📱", title: "React Email", desc: "Built-in react-email components" },
                    ].map((feature) => (
                      <div className="bg-white rounded-lg p-4" key={feature.title}>
                        <Text className="text-2xl mb-2">{feature.icon}</Text>
                        <Text className="font-bold text-gray-800 mb-1">{feature.title}</Text>
                        <Text className="text-sm text-gray-600">{feature.desc}</Text>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Installation & Setup */}
                <div className="mb-8 rounded-xl bg-purple-100 p-6 border-2 border-purple-300">
                  <Heading className="mb-4 text-2xl font-bold text-purple-800 flex items-center">
                    🛠️ Installation & Setup
                  </Heading>
                  <Text className="mb-4 text-gray-700 text-lg">
                    Choose your email provider and configure Relsend:
                  </Text>

                  <div className="mb-6">
                    <Text className="font-bold text-purple-700 mb-2">
                      Option 1: Nodemailer (SMTP)
                    </Text>
                    <div className="bg-gray-900 rounded-lg p-4 mb-2">
                      <Text className="text-green-400 font-mono text-sm">
                        # Gmail setup
                        <br />
                        RELSEND_HOST=smtp.gmail.com
                        <br />
                        RELSEND_PORT=587
                        <br />
                        RELSEND_USER_NAME_1=your-email@gmail.com
                        <br />
                        RELSEND_USER_PASS_1=your-app-password
                      </Text>
                    </div>
                  </div>

                  <div className="mb-6">
                    <Text className="font-bold text-purple-700 mb-2">
                      Option 2: Resend (Recommended)
                    </Text>
                    <div className="bg-gray-900 rounded-lg p-4 mb-2">
                      <Text className="text-green-400 font-mono text-sm">
                        # Resend setup
                        <br />
                        RELSEND_PROVIDER=resend
                        <br />
                        RELSEND_API_KEY=re_123456789
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Usage Examples */}
                <div className="mb-8 rounded-xl bg-orange-100 p-6 border-2 border-orange-300">
                  <Heading className="mb-4 text-2xl font-bold text-orange-800 flex items-center">
                    📧 Usage Examples
                  </Heading>

                  <div className="mb-4">
                    <Text className="font-bold text-orange-700 mb-2">Simple Email</Text>
                    <div className="bg-gray-900 rounded-lg p-4 mb-2">
                      <Text className="text-green-400 font-mono text-sm">
                        bun relsend send --to "user@example.com" --subject "Hello" --text "Hello
                        World"
                      </Text>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Text className="font-bold text-orange-700 mb-2">With Template</Text>
                    <div className="bg-gray-900 rounded-lg p-4 mb-2">
                      <Text className="text-green-400 font-mono text-sm">
                        {
                          'bun relsend send --template welcome --templateData \'{"userName":"John"}\' --to "user@example.com"'
                        }
                      </Text>
                    </div>
                  </div>

                  <div className="mb-4">
                    <Text className="font-bold text-orange-700 mb-2">Using Resend</Text>
                    <div className="bg-gray-900 rounded-lg p-4 mb-2">
                      <Text className="text-green-400 font-mono text-sm">
                        bun relsend send --provider resend --apiKey re_123456789 --to
                        "user@example.com" --subject "Hello"
                      </Text>
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="mb-8 rounded-xl bg-indigo-100 p-6 border-2 border-indigo-300 text-center">
                  <Heading className="mb-4 text-2xl font-bold text-indigo-800">
                    🎯 Ready to Get Started?
                  </Heading>
                  <Text className="mb-6 text-gray-700 text-lg">
                    Join thousands of developers who are already using Relsend for their email
                    needs.
                  </Text>
                  <div className="space-y-3">
                    <Button
                      className="bg-indigo-600 px-8 py-4 font-bold text-white rounded-xl transition-all duration-300 shadow-lg"
                      href="https://github.com/blefnk/relsend"
                    >
                      View on GitHub
                    </Button>
                    <br />
                    <Button
                      className="bg-green-600 px-8 py-4 font-bold text-white rounded-xl transition-all duration-300 shadow-lg"
                      href="https://www.npmjs.com/package/@reliverse/relsend"
                    >
                      Install from NPM
                    </Button>
                  </div>
                </div>

                {/* Footer */}
                <Hr className="border-gray-200 mt-8" />
                <Section className="text-center mt-6">
                  <Text className="text-gray-600 mb-2">Built with ❤️ by the Reliverse team</Text>
                  <Text className="text-sm text-gray-500">
                    Relsend • Modern Email CLI • TypeScript Templates • Bun Native
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

export default OnboardEmail;
