export function printHelp(): void {
  const text = `
relsend — modern CLI for sending emails (Bun)

Usage:
  bun relsend <command> [options]

Commands:
  help                      Show this help
  version                   Show CLI version
  send                      Send an email via SMTP
  config <get|set>          Read or update SQLite-based configuration
  template <list|info>      Manage email templates

Send options:
  --to <email>              Recipient
  --from <email|index|random> Sender. Must match RELSEND_USER_NAME_<i>, an index, or 'random'
  --subject <text>          Subject line
  --text <text>             Plain text body
  --html <html>             HTML body
  --provider <type>         Email provider: nodemailer (default) or resend (or RELSEND_PROVIDER)
  
  Nodemailer options:
  --host <host>             SMTP host (or RELSEND_HOST)
  --port <number>           SMTP port (or RELSEND_PORT)
  --secure                  Use TLS (or RELSEND_SECURE=true)
  --user <user>             SMTP username (overrides derived account)
  --pass <pass>             SMTP password (overrides derived account)
  --authType <type>         Auth type: password or oauth2 (or RELSEND_AUTH_TYPE)
  --clientId <id>           OAuth2 client ID (or RELSEND_CLIENT_ID)
  --clientSecret <secret>   OAuth2 client secret (or RELSEND_CLIENT_SECRET)
  --refreshToken <token>    OAuth2 refresh token (or RELSEND_REFRESH_TOKEN)
  
  Resend options:
  --apiKey <key>            Resend API key (or RELSEND_API_KEY)
  
  Multi-account (env):
  RELSEND_USER_NAME_<i>     SMTP username/email for account index i (1..10)
  RELSEND_USER_PASS_<i>     SMTP password/app password for account index i

  From selection:
  --from <email>            Must match one of RELSEND_USER_NAME_<i>
  --from <i>                Use account at index i (maps to RELSEND_USER_NAME_<i>)

  Template options:
  --template <name>         Use email template from ./emails/
  --templateData <json>     JSON data for template variables
  --tailwind <mode>         Tailwind mode: v3 (react-email, default), v4 (manual CSS), off (no CSS)
 

Examples:
  # Configure two accounts via env
  RELSEND_HOST=smtp.example.com RELSEND_PORT=587 \\
  RELSEND_USER_NAME_1=you@example.com RELSEND_USER_PASS_1=pass1 \\
  RELSEND_USER_NAME_2=sales@example.com RELSEND_USER_PASS_2=pass2 \\
    bun relsend send --from 1 --to me@example.com --subject "Hi" --text "Hello"
  
  # Nodemailer - Gmail with App Password (requires 2-Step Verification)
  bun relsend send --provider nodemailer --host smtp.gmail.com --port 587 --secure --user me@gmail.com --pass "app-password" \\
    --from me@gmail.com --to recipient@example.com --subject "Hi" --text "Hello"
  
  # Nodemailer - Gmail with OAuth2 (recommended)
  bun relsend send --provider nodemailer --authType oauth2 --user me@gmail.com --clientId xxx --clientSecret yyy --refreshToken zzz \\
    --from me@gmail.com --to recipient@example.com --subject "Hi" --text "Hello"
  
  # Resend
  bun relsend send --provider resend --apiKey re_123456789 --from you@example.com --to me@example.com --subject "Hi" --text "Hello"
  
  # Using templates
  bun relsend send --template welcome --templateData '{"userName":"John","companyName":"Acme Corp","userEmail":"john@acme.com"}' \\
    --to john@acme.com --from 2
  bun relsend send --template notification --templateData '{"notificationType":"Alert","title":"System Maintenance","recipientName":"John","message":"Scheduled maintenance tonight"}' \\
    --to john@acme.com --from admin@acme.com
  
  # Using different Tailwind modes
  bun relsend send --template my-email --tailwind v3 --to user@example.com --from sender@example.com
  bun relsend send --template my-email --tailwind v4 --to user@example.com --from sender@example.com
  bun relsend send --template my-email --tailwind off --to user@example.com --from sender@example.com
  
 

Template management:
  bun relsend template list
  bun relsend template info welcome
  bun relsend template info notification

Config (SQLite):
  bun relsend config get
  bun relsend config set host=smtp.example.com port=587 secure=false user=u pass=p from=you@example.com
  bun relsend config set authType=oauth2 user=me@gmail.com clientId=xxx clientSecret=yyy refreshToken=zzz from=me@gmail.com
`;
  console.log(text);
}
