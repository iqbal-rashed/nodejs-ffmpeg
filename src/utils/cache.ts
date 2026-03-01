import type { FFprobeResult } from "../types";

interface CacheEntry {
  result: FFprobeResult;
  timestamp: number;
}

/**
 * Cache for FFprobe results to avoid repeated metadata extraction
 */
class ProbeCacheImpl {
  private cache = new Map<string, CacheEntry>();
  private _enabled = true;
  private _maxAge = 5 * 60 * 1000; // 5 minutes default
  private _maxSize = 100; // Max entries

  /**
   * Enable or disable the cache
   */
  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    if (!value) {
      this.clear();
    }
  }

  /**
   * Set cache max age in milliseconds
   */
  set maxAge(ms: number) {
    this._maxAge = ms;
  }

  /**
   * Set maximum number of cached entries
   */
  set maxSize(size: number) {
    this._maxSize = size;
    this.evictIfNeeded();
  }

  /**
   * Get cached probe result for a file path
   */
  get(filePath: string): FFprobeResult | undefined {
    if (!this._enabled) return undefined;

    const entry = this.cache.get(filePath);
    if (!entry) return undefined;

    if (Date.now() - entry.timestamp > this._maxAge) {
      this.cache.delete(filePath);
      return undefined;
    }

    return entry.result;
  }

  /**
   * Cache a probe result
   */
  set(filePath: string, result: FFprobeResult): void {
    if (!this._enabled) return;

    this.evictIfNeeded();
    this.cache.set(filePath, {
      result,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if a path is cached
   */
  has(filePath: string): boolean {
    return this.get(filePath) !== undefined;
  }

  /**
   * Invalidate cache for a specific file
   */
  invalidate(filePath: string): void {
    this.cache.delete(filePath);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get number of cached entries
   */
  get size(): number {
    return this.cache.size;
  }

  private evictIfNeeded(): void {
    if (this.cache.size >= this._maxSize) {
      const oldest = [...this.cache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      );
      const toRemove = oldest.slice(0, Math.ceil(this._maxSize * 0.2));
      for (const [key] of toRemove) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Global probe cache instance
 */
export const probeCache = new ProbeCacheImpl();
