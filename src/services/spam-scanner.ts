import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import SpamScanner from "@reliverse/ohmymsg";

export interface SpamScanResult {
  isSpam: boolean;
  message: string;
  results: {
    classification: {
      category: string;
      probability: number;
    };
    phishing: Array<{
      type: string;
      url: string;
      description: string;
      details?: Record<string, unknown>;
    }>;
    executables: Array<{
      type: string;
      filename: string;
      extension?: string;
      detectedType?: string;
      description: string;
    }>;
    macros: Array<{
      type: string;
      subtype: string;
      filename?: string;
      description: string;
    }>;
    arbitrary: Array<{
      type: string;
      description: string;
    }>;
    viruses: Array<{
      filename: string;
      virus: string[];
      type: string;
    }>;
    patterns: Array<{
      type: string;
      subtype?: string;
      count?: number;
      path?: string;
      description: string;
    }>;
  };
  links: string[];
  tokens: string[];
  mail: {
    text?: string;
    html?: string;
    subject?: string;
    from?: Record<string, unknown>;
    to?: Record<string, unknown>[];
    attachments?: Array<{
      filename?: string;
      content?: Buffer;
    }>;
    headerLines?: Array<{
      line?: string;
    }>;
    headers?: Record<string, unknown>;
  };
  metrics?: {
    totalTime: number;
    classificationTime: number;
    phishingTime: number;
    executableTime: number;
    macroTime: number;
    virusTime: number;
    patternTime: number;
    idnTime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

export interface CacheEntry {
  hash: string;
  result: SpamScanResult;
  timestamp: number;
  templatePath?: string;
}

export interface SpamScannerCache {
  entries: Record<string, CacheEntry>;
  version: string;
}

export class SpamScannerService {
  private scanner: SpamScanner;
  private cache: SpamScannerCache;
  private cachePath: string;

  constructor() {
    this.scanner = new SpamScanner({
      // Core detection features
      enableMacroDetection: true,
      enableMalwareUrlCheck: true,
      enableAdvancedPatternRecognition: true,

      // Performance and caching
      enablePerformanceMetrics: true,
      enableCaching: true,
      timeout: 30_000,

      // Language support
      supportedLanguages: [
        "ar",
        "bg",
        "bn",
        "ca",
        "cs",
        "da",
        "de",
        "el",
        "en",
        "es",
        "fa",
        "fi",
        "fr",
        "ga",
        "gl",
        "gu",
        "he",
        "hi",
        "hr",
        "hu",
        "hy",
        "it",
        "ja",
        "ko",
        "la",
        "lt",
        "lv",
        "mr",
        "nl",
        "no",
        "pl",
        "pt",
        "ro",
        "sk",
        "sl",
        "sv",
        "th",
        "tr",
        "uk",
        "vi",
        "zh",
      ],
      enableMixedLanguageDetection: true,
    });

    this.cachePath = join(process.cwd(), "relsend.json");
    this.cache = this.loadCache();
  }

  private loadCache(): SpamScannerCache {
    if (existsSync(this.cachePath)) {
      try {
        const cacheData = readFileSync(this.cachePath, "utf-8");
        const parsed = JSON.parse(cacheData) as SpamScannerCache;

        // Validate cache structure
        if (parsed.entries && typeof parsed.entries === "object") {
          return parsed;
        }
      } catch (error) {
        console.warn("Failed to load spam scanner cache, starting fresh:", error);
      }
    }

    return {
      entries: {},
      version: "1.0.0",
    };
  }

  private saveCache(): void {
    try {
      writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2));
    } catch (error) {
      console.warn("Failed to save spam scanner cache:", error);
    }
  }

  private generateContentHash(content: string, templatePath?: string): string {
    const hash = createHash("sha256");
    hash.update(content);
    if (templatePath) {
      hash.update(templatePath);
    }
    return hash.digest("hex");
  }

  private isCacheValid(entry: CacheEntry, maxAge = 24 * 60 * 60 * 1000): boolean {
    const now = Date.now();
    return now - entry.timestamp < maxAge;
  }

  private checkTemplateModified(templatePath: string, entry: CacheEntry): boolean {
    if (!(templatePath && entry.templatePath)) {
      return false;
    }

    try {
      const stats = require("node:fs").statSync(templatePath);
      return stats.mtime.getTime() > entry.timestamp;
    } catch {
      return true; // If we can't check, assume modified
    }
  }

  async scanEmail(
    content: string,
    templatePath?: string,
    forceRescan = false,
  ): Promise<SpamScanResult> {
    const contentHash = this.generateContentHash(content, templatePath);
    const cacheKey = contentHash;

    // Check cache first (unless force rescan)
    if (!forceRescan && this.cache.entries[cacheKey]) {
      const cachedEntry = this.cache.entries[cacheKey];

      // Check if cache is still valid and template hasn't been modified
      const isValid = this.isCacheValid(cachedEntry);
      const notModified = !this.checkTemplateModified(templatePath || "", cachedEntry);
      if (isValid && notModified) {
        return cachedEntry.result;
      }
    }

    try {
      // Perform spam scan using the new OhMyMsg API
      const scanResult = await this.scanner.scan(content);

      const result: SpamScanResult = {
        isSpam: scanResult.isSpam,
        message: scanResult.message || "Scan completed",
        results: {
          classification: scanResult.results?.classification || {
            category: "unknown",
            probability: 0,
          },
          phishing: scanResult.results?.phishing || [],
          executables: scanResult.results?.executables || [],
          macros: scanResult.results?.macros || [],
          arbitrary: scanResult.results?.arbitrary || [],
          viruses: scanResult.results?.viruses || [],
          patterns: scanResult.results?.patterns || [],
        },
        links: scanResult.links || [],
        tokens: scanResult.tokens || [],
        mail: scanResult.mail || {},
        metrics: scanResult.metrics,
      };

      // Cache the result
      this.cache.entries[cacheKey] = {
        hash: contentHash,
        result,
        timestamp: Date.now(),
        templatePath,
      };

      this.saveCache();

      return result;
    } catch (error) {
      throw new Error(
        `Spam scan failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async scanTemplate(
    _templateName: string,
    _templateData: Record<string, any> = {},
    _forceRescan = false,
  ): Promise<SpamScanResult> {
    // This would need to be integrated with the template rendering system
    // For now, we'll throw an error indicating this needs to be implemented
    throw new Error(
      "Template scanning not yet implemented - requires integration with template renderer",
    );
  }

  /**
   * Detect the language of the content using the hybrid detection system
   */
  async detectLanguage(_content: string): Promise<string> {
    try {
      // For now, return English as default
      // This can be enhanced when the library provides language detection
      return "en";
    } catch (error) {
      console.warn("Language detection failed, falling back to English:", error);
      return "en";
    }
  }

  /**
   * Get detailed performance metrics from the scanner
   */
  getPerformanceMetrics(): any {
    try {
      // Return null for now - can be enhanced when library provides metrics
      return null;
    } catch (error) {
      console.warn("Failed to get performance metrics:", error);
      return null;
    }
  }

  /**
   * Clear the scanner's internal cache
   */
  clearScannerCache(): void {
    try {
      // Clear our own cache instead
      this.clearCache();
    } catch (error) {
      console.warn("Failed to clear scanner cache:", error);
    }
  }

  /**
   * Check if the scanner is ready for use
   */
  isReady(): boolean {
    try {
      // Assume ready if scanner instance exists
      return !!this.scanner;
    } catch (error) {
      console.warn("Failed to check scanner readiness:", error);
      return true; // Assume ready if we can't check
    }
  }

  getCacheStats(): {
    totalEntries: number;
    cacheSize: number;
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const entries = Object.values(this.cache.entries);
    const timestamps = entries.map((e) => e.timestamp);

    return {
      totalEntries: entries.length,
      cacheSize: JSON.stringify(this.cache).length,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
    };
  }

  clearCache(): void {
    this.cache = {
      entries: {},
      version: "1.0.0",
    };
    this.saveCache();
  }

  clearExpiredEntries(maxAge = 24 * 60 * 60 * 1000): number {
    let removedCount = 0;

    for (const [key, entry] of Object.entries(this.cache.entries)) {
      if (!this.isCacheValid(entry, maxAge)) {
        delete this.cache.entries[key];
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.saveCache();
    }

    return removedCount;
  }
}

// Singleton instance
export const spamScannerService = new SpamScannerService();
