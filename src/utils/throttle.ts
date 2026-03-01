import type { ProgressInfo, ThrottledProgressOptions } from "../types";

/**
 * Create a throttled progress callback
 * Prevents progress callback spam by limiting callback frequency
 */
export function createThrottledProgress(
  options: ThrottledProgressOptions
): (progress: ProgressInfo) => void {
  const { onProgress, throttleMs = 100 } = options;

  let lastCallTime = 0;

  return (progress: ProgressInfo) => {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    // Store latest progress
    // lastProgress = progress;

    // Always call if:
    // 1. This is the first call
    // 2. Enough time has passed
    // 3. Progress is complete (100%)
    if (
      lastCallTime === 0 ||
      elapsed >= throttleMs ||
      progress.percent === 100
    ) {
      lastCallTime = now;
      onProgress(progress);
    }
  };
}

/**
 * Create a progress callback that only fires at specific percentage intervals
 */
export function createIntervalProgress(
  onProgress: (progress: ProgressInfo) => void,
  interval = 5 // Fire every 5% progress
): (progress: ProgressInfo) => void {
  let lastFiredPercent = -interval;

  return (progress: ProgressInfo) => {
    if (progress.percent === undefined) {
      onProgress(progress);
      return;
    }

    const shouldFire =
      progress.percent >= lastFiredPercent + interval ||
      progress.percent === 100;

    if (shouldFire) {
      lastFiredPercent = Math.floor(progress.percent / interval) * interval;
      onProgress(progress);
    }
  };
}

/**
 * Create a progress callback that aggregates multiple progress updates
 */
export class ProgressAggregator {
  private callbacks: ((progress: ProgressInfo) => void)[] = [];

  add(callback: (progress: ProgressInfo) => void): void {
    this.callbacks.push(callback);
  }

  remove(callback: (progress: ProgressInfo) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  notify(progress: ProgressInfo): void {
    for (const callback of this.callbacks) {
      try {
        callback(progress);
      } catch (error) {
        console.error("Progress callback error:", error);
      }
    }
  }

  clear(): void {
    this.callbacks = [];
  }

  get size(): number {
    return this.callbacks.length;
  }
}
