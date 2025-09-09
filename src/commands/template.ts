import { getTemplateInfo, listTemplates } from "../templates/loader";
import { createSpinner } from "../utils/spinner/mod";

export async function templateCommand(args: string[]): Promise<void> {
  const sub = args[0];

  if (!sub || sub === "help" || sub === "--help" || sub === "-h") {
    printTemplateHelp();
    return;
  }

  if (sub === "list") {
    const spinner = createSpinner({
      text: "Loading templates...",
      color: "green",
      spinner: "dots",
    });

    try {
      spinner.start();
      const templates = await listTemplates();

      if (templates.length === 0) {
        spinner.succeed("No templates found in ./emails/ directory");
        return;
      }

      spinner.succeed(`Found ${templates.length} template(s)`);
      console.log("Available templates:");
      for (const template of templates) {
        const info = await getTemplateInfo(template);
        if (info) {
          console.log(`  ${template}: ${info.template.description || "No description"}`);
          console.log(`    Variables: ${info.variables.join(", ")}`);
        } else {
          console.log(`  ${template}: (error loading template)`);
        }
      }
    } catch (error) {
      spinner.fail(
        `Failed to load templates: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
    return;
  }

  if (sub === "info") {
    const templateName = args[1];
    if (!templateName) {
      console.error("Missing template name. Usage: bun relsend template info <template-name>");
      return;
    }

    const spinner = createSpinner({
      text: `Loading template info for '${templateName}'...`,
      color: "blue",
      spinner: "dots",
    });

    try {
      spinner.start();
      const info = await getTemplateInfo(templateName);

      if (!info) {
        spinner.fail(`Template '${templateName}' not found`);
        return;
      }

      spinner.succeed(`Template '${templateName}' loaded successfully`);
      console.log(
        JSON.stringify(
          {
            name: info.template.name,
            description: info.template.description,
            variables: info.variables,
            example: {
              subject: info.template.subject,
              text: info.template.text
                ? info.template.text.substring(0, 200) +
                  (info.template.text.length > 200 ? "..." : "")
                : undefined,
            },
          },
          null,
          2,
        ),
      );
    } catch (error) {
      spinner.fail(
        `Failed to load template info: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
    return;
  }

  console.error(`Unknown subcommand: ${sub}`);
  printTemplateHelp();
}

function printTemplateHelp(): void {
  const text = `
Template management commands:

Usage: bun relsend template <command> [options]

Commands:
  list                      List all available templates
  info <template-name>      Show template details and variables
  help                      Show this help

Examples:
  bun relsend template list
  bun relsend template info welcome
  bun relsend template info notification
`;
  console.log(text);
}
