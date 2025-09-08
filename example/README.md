# Email Templates

This directory contains email templates for the Relsend CLI tool. Templates can be written in two formats:

1. **String-based templates** (`.ts` files) - Traditional template strings with Handlebars-style syntax
2. **TSX templates** (`.tsx` files) - React components with full TypeScript support

## Template Types

### String-based Templates (.ts)

Traditional templates using string interpolation with `{{variable}}` syntax:

```typescript
const template: EmailTemplate = {
  name: "welcome",
  subject: "Welcome to {{companyName}}",
  text: "Hello {{userName}}, welcome!",
  html: "<h1>Welcome {{userName}}!</h1>",
  // ...
};
```

### TSX Templates (.tsx)

React components with full TypeScript support and modern JSX syntax:

```typescript
import { createTSXTemplate } from "../src/emails/tsx-renderer";

function WelcomeEmail(data: WelcomeData) {
  return (
    <div className="email-container p-5">
      <h1 className="text-3xl font-bold">
        Welcome to {data.companyName}, {data.userName}!
      </h1>
      {/* ... */}
    </div>
  );
}

const template = createTSXTemplate({
  name: "welcome",
  subject: "Welcome to {{companyName}}, {{userName}}!",
  text: "Hello {{userName}}, welcome!",
  component: WelcomeEmail,
  // ...
});
```

## TSX Template Benefits

- **Type Safety**: Full TypeScript support with proper type checking
- **Component Reusability**: Reusable React components and patterns
- **Modern Syntax**: JSX with Tailwind CSS classes
- **Better Developer Experience**: IDE support, autocomplete, and refactoring
- **Conditional Rendering**: Native React conditional rendering (`{condition && <div>}`)
- **Loops**: Native React mapping (`{items.map(item => <div key={item.id}>{item.name}</div>)}`)

## Template Loading Priority

When loading templates, the system will:

1. First try to load a `.tsx` file
2. If not found, fall back to a `.ts` file
3. This allows you to gradually migrate from string templates to TSX

## Available Templates

### notification.tsx

- **Purpose**: General notification emails
- **Features**: Priority levels, action required alerts, deadline reminders
- **Variables**: `notificationType`, `title`, `recipientName`, `message`, `actionRequired`, `actionText`, `deadline`, `link`, `senderName`, `senderTitle`, `companyName`, `priorityLevel`

### welcome.tsx

- **Purpose**: Welcome emails for new users
- **Features**: Account details, support contact
- **Variables**: `companyName`, `userName`, `userEmail`, `userRole`, `startDate`, `supportEmail`

### newsletter.tsx

- **Purpose**: Newsletter emails with dynamic content
- **Features**: Featured articles, article lists, categories
- **Variables**: `companyName`, `recipientName`, `month`, `year`, `articles`, `featuredArticle`, `unsubscribeLink`

## Styling

All templates use Tailwind CSS classes for styling. The compiled CSS is automatically included in the HTML output.

### Custom Classes Available

- `.email-container` - Main email wrapper
- `.priority-*` - Priority level colors (high, medium, low, info)
- `.email-button` - Styled action buttons
- `.alert-*` - Alert box styles (warning, info, success)

## Creating New TSX Templates

1. Create a new `.tsx` file in the `templates/` directory
2. Define your data interface extending `TemplateData`
3. Create a React component function
4. Use `createTSXTemplate()` to create the template object
5. Export as default

Example:

```typescript
import type { TemplateData } from "../src/emails/types";
import { createTSXTemplate } from "../src/emails/tsx-renderer";

interface MyTemplateData extends TemplateData {
  userName: string;
  message: string;
}

function MyTemplate(data: MyTemplateData) {
  return (
    <div className="email-container p-5">
      <h1>Hello {data.userName}!</h1>
      <p>{data.message}</p>
    </div>
  );
}

const template = createTSXTemplate({
  name: "my-template",
  subject: "Hello {{userName}}",
  text: "Hello {{userName}}, {{message}}",
  component: MyTemplate,
  description: "My custom template",
  variables: ["userName", "message"],
});

export default template;
```

## Migration from String Templates

To migrate an existing string template to TSX:

1. Copy the `.ts` file to `.tsx`
2. Define the data interface
3. Convert the HTML string to JSX
4. Replace `{{variable}}` with `{data.variable}`
5. Use `createTSXTemplate()` instead of the plain object
6. Remove the old `.ts` file

The system will automatically use the `.tsx` version when both exist.
