# Tailwind CSS v4 Setup

This directory contains the Tailwind CSS v4 configuration and compiled output for the relsend CLI tool.

## Files

- `globals.css` - Tailwind CSS v4 configuration file (replaces `tailwind.config.ts`)
- `dist/output.css` - Compiled CSS output file
- `README.md` - This file

## Usage

### Building CSS

```bash
# Build CSS once
bun run build:css

# Build CSS and watch for changes
bun run build:css:watch
```

### Custom Classes

The following custom classes are available for email templates:

#### Email Container

- `.email-container` - Main email container with max-width, centering, and shadow

#### Priority Colors

- `.priority-high` - Red background for high priority notifications
- `.priority-medium` - Orange background for medium priority notifications  
- `.priority-low` - Green background for low priority notifications
- `.priority-info` - Blue background for info notifications

#### Email Components

- `.email-button` - Styled button for email actions
- `.alert-warning` - Warning alert box styling
- `.alert-info` - Info alert box styling
- `.alert-success` - Success alert box styling

## Email Client Compatibility

The styles are designed to be compatible with major email clients while leveraging Tailwind's utility classes. Custom components use inline-compatible styles for better email client support.

## Tailwind v4 Changes

- Configuration is done in `globals.css` instead of `tailwind.config.ts`
- Uses `@import "tailwindcss";` instead of separate directives
- Custom styles are defined using `@layer` directives
