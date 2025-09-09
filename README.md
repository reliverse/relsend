# Relsend

A modern CLI for sending emails with TypeScript template support, built with Bun. Supports multiple email providers including Nodemailer (SMTP) and Resend. Optimized for Bun users.

## Installation

```bash
bun add -D @reliverse/relsend
# or globally: bun add -g @reliverse/relsend
```

## Usage

```bash
bun relsend <command> [options]
# or globally: relsend <command> [options]
```

## Quick Start

```bash
# 1. Setup configuration
cp .env.example .env
# Edit .env with your email settings

# 2. Send your first email
# Using Nodemailer (default)
bun relsend send --to "recipient@example.com" --subject "Hello" --text "This is a test email" --from 1

# Using Resend
bun relsend send --provider resend --apiKey re_123456789 --to "recipient@example.com" --subject "Hello" --text "This is a test email"
```

## Quick Setup

### 1. Choose Your Email Provider

Relsend supports two email providers:

- **Nodemailer** (default) - For SMTP servers like Gmail, Outlook, etc.
- **Resend** - Modern email API with excellent deliverability

### 2. Configure Environment Variables

#### Option A: Nodemailer (SMTP)

First, set up your Gmail App Password at <https://myaccount.google.com/apppasswords>, then configure Relsend:

```bash
# Relsend Configuration
# Copy the .env.example file to .env and fill in your values

# SMTP Server Configuration
RELSEND_HOST=smtp.gmail.com
# RELSEND_PROVIDER=nodemailer
# (465 & secure=true; 587 & secure=false)
RELSEND_PORT=587
RELSEND_SECURE=false
RELSEND_AUTH_TYPE=password

# [Auth Type]: Authentication
RELSEND_USER_NAME_1=your-email@gmail.com
RELSEND_USER_PASS_1=your-16-char-app-password
# RELSEND_USER_NAME_2=notifications@yourdomain.com
# RELSEND_USER_PASS_2=app-password-2

# [Auth Type]: OAuth2 Configuration
# RELSEND_AUTH_TYPE=oauth2
# RELSEND_CLIENT_ID=your-oauth-client-id
# RELSEND_CLIENT_SECRET=your-oauth-client-secret
# RELSEND_REFRESH_TOKEN=your-oauth-refresh-token
```

**Alternative:** Use the config command to set values programmatically (host/port/secure/auth only — accounts are set via env):

```bash
bun relsend config set host=smtp.gmail.com port=587 secure=false
bun relsend config get  # Verify configuration
```

#### Option B: Resend

Get your API key from <https://resend.com/api-keys>, then configure:

```bash
# Edit .env with your Resend settings
# RELSEND_PROVIDER=resend
# RELSEND_API_KEY=re_123456789
# (use RELSEND_USER_NAME_<index> and select via --from)
```

### 3. List Available Templates

```bash
# See all available templates
bun relsend template list

# Get template details and required variables
bun relsend template info welcome
bun relsend template info notification
bun relsend template info newsletter
bun relsend template info my-email
```

## Usage Examples

### Send Welcome Email

```bash
# Using Nodemailer (default)
bun relsend send --template welcome --templateData '{"userName":"John","companyName":"Acme Corp","userEmail":"hello-to@gmail.com","userRole":"Developer","startDate":"2025-01-15","supportEmail":"hello-from@gmail.com"}' --to "hello-to@gmail.com" --from random

# Using Resend
bun relsend send --provider resend --template welcome --templateData '{"userName":"John","companyName":"Acme Corp","userEmail":"hello-to@gmail.com","userRole":"Developer","startDate":"2025-01-15","supportEmail":"hello-from@gmail.com"}' --to "hello-to@gmail.com" --from 1
```

### Send Notification Email

```bash
# Using Nodemailer
bun relsend send --template notification --templateData '{"notificationType":"Alert","title":"System Maintenance","recipientName":"John","message":"Scheduled maintenance tonight at 2 AM","actionRequired":true,"actionText":"Please save your work","deadline":"Tonight at 11 PM","link":"https://status.acme.com","senderName":"IT Team","senderTitle":"System Administrator","companyName":"Acme Corp","priorityColor":"#dc3545"}' --to "hello-to@gmail.com" --from 2

# Using Resend
bun relsend send --provider resend --template notification --templateData '{"notificationType":"Alert","title":"System Maintenance","recipientName":"John","message":"Scheduled maintenance tonight at 2 AM","actionRequired":true,"actionText":"Please save your work","deadline":"Tonight at 11 PM","link":"https://status.acme.com","senderName":"IT Team","senderTitle":"System Administrator","companyName":"Acme Corp","priorityColor":"#dc3545"}' --to "hello-to@gmail.com" --from 2
```

### Send Email with Tailwind CSS

```bash
# Use react-email Tailwind (default - v3 mode) with Nodemailer
bun relsend send --template my-email --tailwind v3 --templateData '{"userName":"John","companyName":"Acme Corp","ctaUrl":"https://acme.com","ctaText":"Get Started"}' --to "hello-to@gmail.com"

# Use react-email Tailwind with Resend
bun relsend send --provider resend --template my-email --tailwind v3 --templateData '{"userName":"John","companyName":"Acme Corp","ctaUrl":"https://acme.com","ctaText":"Get Started"}' --to "hello-to@gmail.com"

# Use manual CSS compilation (v4 mode)
bun relsend send --template my-email --tailwind v4 --templateData '{"userName":"John","companyName":"Acme Corp"}' --to "hello-to@gmail.com"

# Use no CSS (off mode - for custom CSS files)
bun relsend send --template my-email --tailwind off --templateData '{"userName":"John","companyName":"Acme Corp"}' --to "hello-to@gmail.com"
```

## Relsend Newsletter Templates

Relsend includes built-in newsletter templates for onboarding and advanced features:

```bash
# Send onboarding email (randomly selects between onboard and advanced-details)
bun relsend send --template newsletter --to "user@example.com" --from 1

# Using Resend
bun relsend send --provider resend --template newsletter --to "user@example.com" --from 1
```

### Template Details

The newsletter template includes two variants:

- **Onboard Email**: Welcome new users with quick start guide, key features, and setup instructions
- **Advanced Details Email**: Comprehensive technical guide covering architecture, TypeScript templates, providers, and production best practices

Both templates feature modern design with Tailwind CSS, responsive layouts, and comprehensive Relsend documentation.

### Send Simple Email (No Template)

```bash
# Using Nodemailer (default)
bun relsend send --to "hello-to@gmail.com" --subject "Hello" --text "This is a test email"

# Using Resend
bun relsend send --provider resend --to "hello-to@gmail.com" --subject "Hello" --text "This is a test email"
```

### Override Configuration (Optional)

You can override any configuration from your `.env` file by passing flags:

```bash
# Override sender email for this specific email
bun relsend send --to "hello-to@gmail.com" --from "different-sender@gmail.com" --subject "Hello"

# Override provider and settings for this specific email
bun relsend send --provider resend --apiKey re_123456789 --to "hello-to@gmail.com" --subject "Hello"

# Override SMTP settings for this specific email
bun relsend send --to "hello-to@gmail.com" --host "smtp.outlook.com" --port 587 --user "outlook-user@outlook.com" --pass "outlook-password" --subject "Hello"
```

## Environment Variables

Relsend uses the following environment variables for configuration:

### Provider Selection

| Variable | Description | Example |
|----------|-------------|---------|
| `RELSEND_PROVIDER` | Email provider | `nodemailer` or `resend` |

### Nodemailer (SMTP) Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `RELSEND_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `RELSEND_PORT` | SMTP server port | `587` |
| `RELSEND_SECURE` | Use SSL/TLS connection | `false` |
| `RELSEND_USER_NAME_<i>` | Account email for index i (1..10) | `your-email@gmail.com` |
| `RELSEND_USER_PASS_<i>` | Account password/app password | `your-app-password` |
| `RELSEND_AUTH_TYPE` | Authentication type | `password` or `oauth2` |
| `RELSEND_CLIENT_ID` | OAuth2 client ID | `your-oauth-client-id` |
| `RELSEND_CLIENT_SECRET` | OAuth2 client secret | `your-oauth-client-secret` |
| `RELSEND_REFRESH_TOKEN` | OAuth2 refresh token | `your-oauth-refresh-token` |

### Resend Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `RELSEND_API_KEY` | Resend API key | `re_123456789` |

## Email Providers

Relsend supports two email providers, each with their own advantages:

### Nodemailer (Default)

- **Best for**: Traditional SMTP servers (Gmail, Outlook, custom SMTP)
- **Authentication**: App passwords, OAuth2
- **Configuration**: SMTP host, port, credentials
- **Use case**: When you have existing SMTP infrastructure

### Resend

- **Best for**: Modern applications requiring high deliverability
- **Authentication**: API key
- **Configuration**: Simple API key setup
- **Use case**: When you want excellent deliverability and simple setup

### Provider Selection Examples

```bash
# Use Nodemailer (default)
bun relsend send --to user@example.com --subject "Hello" --text "Hello World"

# Use Resend explicitly
bun relsend send --provider resend --apiKey re_123456789 --to user@example.com --subject "Hello" --text "Hello World"

# Set default provider in .env
echo "RELSEND_PROVIDER=resend" >> .env
echo "RELSEND_API_KEY=re_123456789" >> .env
```

## Commands

- `send` - Send emails with templates or raw content using Nodemailer or Resend
- `config get|set` - Manage email provider configuration (updates .env file)
- `template list|info` - List and inspect email templates
- `help` - Show detailed help with provider options

## Tailwind CSS Integration

Relsend supports multiple Tailwind CSS modes for flexible email styling:

### Tailwind Modes

- **`v3` (default)** - Uses react-email Tailwind component with inline styles
  - Best for: Modern email clients with full CSS support
  - Features: Automatic inline styles, email client compatibility
  - Requires: `@react-email/tailwind` package

- **`v4`** - Uses manual CSS compilation from `styles/dist/output.css`
  - Best for: Custom Tailwind builds and advanced configurations
  - Features: Full control over CSS compilation
  - Requires: Manual CSS build process

- **`off`** - No CSS link (for custom CSS files)
  - Best for: Custom CSS files or external stylesheets
  - Features: Complete control over styling
  - Requires: Manual CSS file management

### Usage Example

```bash
# Default mode (react-email Tailwind)
bun relsend send --template my-email --tailwind v3 --to user@example.com --from random

# Manual CSS mode
bun relsend send --template my-email --tailwind v4 --to user@example.com --from random

# No CSS mode
bun relsend send --template my-email --tailwind off --to user@example.com --from random
```

### Template Development

For templates using react-email Tailwind (v3 mode), use the `Tailwind` component:

```tsx
import { Button, Head, Html, Tailwind, pixelBasedPreset } from "@react-email/components";

function MyEmail() {
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
          <Button className="bg-brand px-6 py-3 text-white">
            Click me
          </Button>
        </div>
      </Tailwind>
    </Html>
  );
}
```

## Why Environment Variables?

Using `.env` files provides several advantages:

- ✅ **Security** - Keep sensitive credentials out of command history
- ✅ **Simplicity** - No need to pass SMTP flags with every command
- ✅ **Flexibility** - Override any setting with command-line flags when needed
- ✅ **Portability** - Share configuration across different environments
- ✅ **Bun Native** - Automatic loading without additional dependencies

## Features

- ✅ **Multiple Email Providers** - Nodemailer (SMTP) and Resend support
- ✅ **Gmail Support** - OAuth2 and App Password authentication via Nodemailer
- ✅ **Resend Integration** - Modern email API with excellent deliverability
- ✅ **TypeScript Templates** - Component-based email templates
- ✅ **React Email Support** - Built-in react-email components with Tailwind
- ✅ **Tailwind CSS Integration** - Multiple Tailwind modes (v3, v4, off)
- ✅ **Environment Variables** - Simple .env file configuration
- ✅ **Template Variables** - Dynamic content with `{{variable}}` syntax
- ✅ **HTML + Text** - Both formats supported
- ✅ **Modern CLI** - Built with Bun for speed
- ✅ **Zero Dependencies** - Uses Bun's native environment variable support
- ✅ **Visual Feedback** - Beautiful spinners for all operations
- ✅ **Provider Flexibility** - Switch between providers with `--provider` flag

## Nerd Details

### 🔍 What Nodemailer Receives (Your Input)

```json
{
  from: "sender@example.com",
  to: "recipient@example.com", 
  subject: "Test Email",
  text: "Plain text version",
  html: "<h1>HTML version</h1>"
}
```

### 📧 What Nodemailer Actually Sends (Raw Email)

```bash
MIME-Version: 1.0
From: sender@example.com
To: recipient@example.com
Subject: Test Email
Date: Sun, 07 Sep 2025 18:59:05 GMT
Message-ID: <unique-id@domain>
Content-Type: multipart/alternative; boundary="----=_NextPart_000_0000_01DA1234567890"

------=_NextPart_000_0000_01DA1234567890
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: 7bit

Plain text version

------=_NextPart_000_0000_01DA1234567890
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: 7bit

<h1>HTML version</h1>

------=_NextPart_000_0000_01DA1234567890--
```

### **Key Points:**

1. **MIME Multipart Structure**: Nodemailer creates a structured email with multiple parts separated by boundary markers
2. **Both Text & HTML**: When provided both, it includes both versions
3. **Email Headers**: Adds standard email headers (Date, Message-ID, Content-Type, etc.)
4. **Encoding**: Handles character encoding and transfer encoding
5. **Fallback Support**: Email clients can choose which version to display

### **Relsend CLI's Preview Shows:**

- **The content parts** that will be sent (text and HTML separately)
- **Not the raw MIME structure** (that's nodemailer's job)
- **React components rendered to HTML** before sending
- **Exactly what the recipient will see** in their email client

### **How Email Clients Handle It:**

- **Modern clients** (Gmail, Outlook, Apple Mail): Display the HTML version
- **Text-only clients** (some mobile apps, accessibility tools): Show the plain text
- **"Show Original"** in Gmail: Shows the raw MIME structure
- **Fallback behavior**: If HTML fails to load, falls back to plain text

## Contributors

We welcome contributions! 👋

**TODO**:

- [ ] Add [Panda CSS](https://panda-css.com) support

## License

This project is licensed under the Apache-2.0 License
Copyright (c) 2025 Nazar Kornienko (blefnk), Bleverse, Reliverse
See the [LICENSE](./LICENSE) and [NOTICE](./NOTICE) files for more information.
