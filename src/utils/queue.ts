import type { ProgressInfo } from "../types";

interface QueuedTask<T> {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: ProgressInfo) => void;
}

/**
 * Conversion queue for better concurrency control
 * Allows pausing, resuming, and managing concurrent conversions
 */
export class ConversionQueue {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private queue: QueuedTask<any>[] = [];
  /* eslint-enable @typescript-eslint/no-explicit-any */
  private activeCount = 0;
  private concurrency: number;
  private paused = false;
  private signal?: AbortSignal;

  constructor(concurrency = 4) {
    if (concurrency < 1) {
      throw new Error("Concurrency must be at least 1");
    }
    this.concurrency = concurrency;
  }

  /**
   * Add a task to the queue
   */
  add<T>(
    task: () => Promise<T>,
    options?: {
      onProgress?: (progress: ProgressInfo) => void;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task,
        resolve,
        reject,
        ...(options?.onProgress ? { onProgress: options.onProgress } : {}),
      });

      void this.processNext();
    });
  }

  /**
   * Start processing the queue
   */
  start(): void {
    if (this.paused) {
      this.paused = false;
      void this.processNext();
    }
  }

  /**
   * Pause processing (doesn't cancel active tasks)
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Clear all pending tasks (doesn't cancel active tasks)
   */
  clear(): void {
    // Reject all pending tasks
    for (const item of this.queue) {
      item.reject(new Error("Queue cleared"));
    }
    this.queue = [];
  }

  /**
   * Cancel all tasks including active ones
   */
  cancel(): void {
    this.abort();
    this.clear();
  }

  /**
   * Abort using AbortSignal
   */
  abort(signal?: AbortSignal): void {
    if (signal) {
      this.signal = signal;
    } else if (!this.signal?.aborted) {
      // Create a new aborted controller
      const controller = new AbortController();
      controller.abort();
      this.signal = controller.signal;
    }
  }

  /**
   * Get queue statistics
   */
  get stats(): {
    pending: number;
    active: number;
    total: number;
    paused: boolean;
  } {
    return {
      pending: this.queue.length,
      active: this.activeCount,
      total: this.queue.length + this.activeCount,
      paused: this.paused,
    };
  }

  /**
   * Set concurrency limit
   */
  setConcurrency(concurrency: number): void {
    if (concurrency < 1) {
      throw new Error("Concurrency must be at least 1");
    }
    this.concurrency = concurrency;
    void this.processNext();
  }

  /**
   * Process next task in queue
   */
  private async processNext(): Promise<void> {
    if (this.paused) return;

    if (this.signal?.aborted) {
      this.clear();
      return;
    }

    // If we've hit the concurrency limit or queue is empty, stop
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.activeCount++;

    try {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      const result = await item.task();
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      item.resolve(result);
    } catch (error) {
      item.reject(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.activeCount--;
      void this.processNext();
    }
  }

  /**
   * Wait for all tasks to complete
   */
  async wait(): Promise<void> {
    while (this.activeCount > 0 || this.queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

/**
 * Create a conversion queue with specified concurrency
 */
export function createQueue(concurrency = 4): ConversionQueue {
  return new ConversionQueue(concurrency);
}
