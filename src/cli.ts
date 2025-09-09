import { printHelp } from "./utils/help";

export async function run(args: string[]): Promise<void> {
  const [command, ...rest] = args;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  if (command === "version" || command === "--version" || command === "-v") {
    console.log("Relsend CLI v1.0.0");
    return;
  }

  switch (command) {
    case "send": {
      const { sendCommand } = await import("./commands/send");
      await sendCommand(rest);
      return;
    }
    case "config": {
      const { configCommand } = await import("./commands/config");
      await configCommand(rest);
      return;
    }
    case "template": {
      const { templateCommand } = await import("./commands/template");
      await templateCommand(rest);
      return;
    }
    case "scan": {
      const { scanCommand } = await import("./commands/scan");
      await scanCommand(rest);
      return;
    }
    default: {
      console.error(`Unknown command: ${command}`);
      printHelp();
    }
  }
}

run(Bun.argv.slice(2)).catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
