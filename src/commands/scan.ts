import { spamScannerService } from "../services/spam-scanner";
import { loadTemplate } from "../templates/loader";
import { renderTemplate } from "../templates/renderer";
import type { TemplateData } from "../templates/types";
import { createSpinner } from "../utils/spinner/mod";

type ScanOptions = {
  template?: string;
  templateData?: string;
  content?: string;
  subject?: string;
  tailwind?: "v3" | "v4" | "off";
  forceRescan?: boolean;
  clearCache?: boolean;
  cacheStats?: boolean;
};

export async function scanCommand(args: string[]): Promise<void> {
  const options = parseArgs(args);

  // Handle cache management commands
  if (options.clearCache) {
    spamScannerService.clearCache();
    console.log("✅ Spam scanner cache cleared");
    return;
  }

  if (options.cacheStats) {
    const stats = spamScannerService.getCacheStats();
    console.log("📊 Spam Scanner Cache Statistics:");
    console.log(`  Total entries: ${stats.totalEntries}`);
    console.log(`  Cache size: ${(stats.cacheSize / 1024).toFixed(2)} KB`);
    if (stats.oldestEntry) {
      console.log(`  Oldest entry: ${new Date(stats.oldestEntry).toISOString()}`);
    }
    if (stats.newestEntry) {
      console.log(`  Newest entry: ${new Date(stats.newestEntry).toISOString()}`);
    }
    return;
  }

  let content: string;
  let templatePath: string | undefined;

  if (options.template) {
    // Scan a template
    const spinner = createSpinner({
      text: `Loading and rendering template '${options.template}'...`,
      color: "blue",
      spinner: "dots",
    });

    try {
      spinner.start();

      const template = await loadTemplate(options.template);
      if (!template) {
        spinner.fail(`Template '${options.template}' not found`);
        return;
      }

      let templateData: TemplateData = {};
      if (options.templateData) {
        try {
          templateData = JSON.parse(options.templateData);
        } catch {
          spinner.fail("Invalid JSON in --templateData");
          return;
        }
      }

      // Merge defaults with provided data
      const defaultData = (template as unknown as { defaultData?: TemplateData }).defaultData ?? {};
      const mergedData: TemplateData = { ...defaultData, ...templateData };

      const rendered = await renderTemplate(template, mergedData, options.tailwind);

      // Create email content for scanning
      content = createEmailContent(rendered.subject, rendered.text, rendered.html);
      templatePath = `./emails/${options.template}.tsx`; // Assume TSX for now

      spinner.succeed(`Template '${options.template}' loaded and rendered`);
    } catch (error) {
      spinner.fail(
        `Failed to load template: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw error;
    }
  } else if (options.content) {
    // Scan provided content
    content = options.content;
  } else {
    console.error("Missing required option: --template or --content");
    console.log(
      "Usage: bun relsend scan --template <name> [--templateData <json>] [--force-rescan]",
    );
    console.log("       bun relsend scan --content <email-content> [--force-rescan]");
    return;
  }

  // Perform spam scan
  const scanSpinner = createSpinner({
    text: "Scanning content for spam...",
    color: "yellow",
    spinner: "dots",
  });

  try {
    scanSpinner.start();

    const result = await spamScannerService.scanEmail(content, templatePath, options.forceRescan);

    scanSpinner.succeed("Spam scan completed");

    // Display results
    console.log("\n🔍 SPAM SCAN RESULTS");
    console.log("=".repeat(50));

    if (result.isSpam) {
      console.log("❌ SPAM DETECTED");
      console.log(`Reason: ${result.message}`);
    } else {
      console.log("✅ Content appears clean");
    }

    // Show detailed results
    console.log("\n📊 DETAILED RESULTS:");
    console.log("-".repeat(30));

    if (result.results.classification) {
      console.log(
        `Classification: ${result.results.classification.category} (${(result.results.classification.probability * 100).toFixed(1)}% confidence)`,
      );
    }

    if (result.results.phishing.length > 0) {
      console.log(`Phishing threats: ${result.results.phishing.length}`);
      result.results.phishing.forEach((threat, i) => {
        console.log(`  ${i + 1}. ${threat.type}: ${threat.description}`);
        if (threat.url) console.log(`      URL: ${threat.url}`);
      });
    }

    if (result.results.executables.length > 0) {
      console.log(`Executable files: ${result.results.executables.length}`);
      result.results.executables.forEach((exe, i) => {
        console.log(`  ${i + 1}. ${exe.type}: ${exe.description}`);
        if (exe.filename) console.log(`      File: ${exe.filename}`);
        if (exe.extension) console.log(`      Extension: ${exe.extension}`);
      });
    }

    if (result.results.macros.length > 0) {
      console.log(`Macros detected: ${result.results.macros.length}`);
      result.results.macros.forEach((macro, i) => {
        console.log(`  ${i + 1}. ${macro.type}: ${macro.description}`);
        if (macro.subtype) console.log(`      Subtype: ${macro.subtype}`);
        if (macro.filename) console.log(`      File: ${macro.filename}`);
      });
    }

    if (result.results.viruses.length > 0) {
      console.log(`Viruses detected: ${result.results.viruses.length}`);
      result.results.viruses.forEach((virus, i) => {
        console.log(`  ${i + 1}. ${virus.type}: ${virus.filename}`);
        if (virus.virus.length > 0) {
          console.log(`      Viruses: ${virus.virus.join(", ")}`);
        }
      });
    }

    if (result.results.arbitrary.length > 0) {
      console.log(`Arbitrary threats: ${result.results.arbitrary.length}`);
      result.results.arbitrary.forEach((threat, i) => {
        console.log(`  ${i + 1}. ${threat.type}: ${threat.description}`);
      });
    }

    if (result.results.patterns.length > 0) {
      console.log(`Suspicious patterns: ${result.results.patterns.length}`);
      result.results.patterns.forEach((pattern, i) => {
        console.log(`  ${i + 1}. ${pattern.type}: ${pattern.description}`);
        if (pattern.subtype) console.log(`      Subtype: ${pattern.subtype}`);
        if (pattern.count) console.log(`      Count: ${pattern.count}`);
        if (pattern.path) console.log(`      Path: ${pattern.path}`);
      });
    }

    if (result.links.length > 0) {
      console.log(`\n🔗 Links found: ${result.links.length}`);
      result.links.forEach((link, i) => {
        console.log(`  ${i + 1}. ${link}`);
      });
    }

    if (result.metrics) {
      console.log("\n⏱ Performance Metrics:");
      console.log(`  Total time: ${result.metrics.totalTime}ms`);
      if (result.metrics.classificationTime) {
        console.log(`  Classification time: ${result.metrics.classificationTime}ms`);
      }
      if (result.metrics.phishingTime) {
        console.log(`  Phishing detection time: ${result.metrics.phishingTime}ms`);
      }
      if (result.metrics.executableTime) {
        console.log(`  Executable detection time: ${result.metrics.executableTime}ms`);
      }
      if (result.metrics.macroTime) {
        console.log(`  Macro detection time: ${result.metrics.macroTime}ms`);
      }
      if (result.metrics.virusTime) {
        console.log(`  Virus scan time: ${result.metrics.virusTime}ms`);
      }
      if (result.metrics.patternTime) {
        console.log(`  Pattern analysis time: ${result.metrics.patternTime}ms`);
      }
      if (result.metrics.idnTime) {
        console.log(`  IDN analysis time: ${result.metrics.idnTime}ms`);
      }
      if (result.metrics.memoryUsage) {
        console.log(
          `  Memory usage: ${(result.metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        );
      }
    }

    console.log("\n" + "=".repeat(50));

    if (result.isSpam) {
      process.exit(1); // Exit with error code if spam detected
    }
  } catch (error) {
    scanSpinner.fail(
      `Spam scan failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    throw error;
  }
}

function parseArgs(args: string[]): ScanOptions {
  const out: ScanOptions = {};

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--template" && args[i + 1]) out.template = args[++i];
    else if (a === "--templateData" && args[i + 1]) out.templateData = args[++i];
    else if (a === "--content" && args[i + 1]) out.content = args[++i];
    else if (a === "--subject" && args[i + 1]) out.subject = args[++i];
    else if (a === "--tailwind" && args[i + 1]) {
      const mode = args[++i] as "v3" | "v4" | "off";
      if (["v3", "v4", "off"].includes(mode)) {
        out.tailwind = mode;
      } else {
        console.error(`Invalid tailwind mode: ${mode}. Must be one of: v3, v4, off`);
        process.exit(1);
      }
    } else if (a === "--force-rescan") out.forceRescan = true;
    else if (a === "--clear-cache") out.clearCache = true;
    else if (a === "--cache-stats") out.cacheStats = true;
  }

  return out;
}

function createEmailContent(subject?: string, text?: string, html?: string): string {
  const headers = [
    `Subject: ${subject || "No Subject"}`,
    "From: sender@example.com",
    "To: recipient@example.com",
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
  ];

  let body = "";

  if (text && html) {
    headers.push('Content-Type: multipart/alternative; boundary="boundary123"');
    body = `--boundary123
Content-Type: text/plain; charset=utf-8

${text}

--boundary123
Content-Type: text/html; charset=utf-8

${html}

--boundary123--`;
  } else if (html) {
    headers.push("Content-Type: text/html; charset=utf-8");
    body = html;
  } else if (text) {
    headers.push("Content-Type: text/plain; charset=utf-8");
    body = text;
  } else {
    headers.push("Content-Type: text/plain; charset=utf-8");
    body = "No content";
  }

  return headers.join("\r\n") + "\r\n\r\n" + body;
}
