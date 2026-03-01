import { describe, it, expect, vi } from "vitest";
import {
  batchProcess,
  getSuccessfulResults,
  getFailedResults,
} from "../../src/utils/batch";

describe("batchProcess", () => {
  it("should process all items and return results", async () => {
    const items = [1, 2, 3];
    const processor = async (item: number) => item * 2;

    const results = await batchProcess({ items }, processor);

    expect(results).toHaveLength(3);
    expect(results[0].success).toBe(true);
    expect(results[0].result).toBe(2);
  });

  it("should respect concurrency", async () => {
    const items = [1, 2, 3, 4];
    let activeCount = 0;
    let maxActive = 0;

    const processor = async () => {
      activeCount++;
      maxActive = Math.max(maxActive, activeCount);
      await new Promise((r) => setTimeout(r, 50));
      activeCount--;
    };

    await batchProcess({ items, concurrency: 2 }, processor);
    expect(maxActive).toBe(2);
  });

  it("should handle mixed success and failure", async () => {
    const items = [1, 2, 3];
    const processor = async (item: number) => {
      if (item === 2) throw new Error("Failed");
      return item;
    };

    const results = await batchProcess({ items }, processor);

    const success = getSuccessfulResults(results);
    const failed = getFailedResults(results);

    expect(success).toHaveLength(2);
    expect(failed).toHaveLength(1);
    expect(failed[0].error.message).toBe("Failed");
  });

  it("should respect AbortSignal", async () => {
    const controller = new AbortController();
    const items = [1, 2, 3, 4];

    const processor = async (item: number) => {
      if (item === 3) controller.abort();
      await new Promise((r) => setTimeout(r, 10));
      return item;
    };

    const promise = batchProcess(
      { items, concurrency: 1, signal: controller.signal },
      processor
    );

    await expect(promise).rejects.toThrow();
  });

  it("should trigger onItemComplete callback", async () => {
    const items = [1, 2];
    const onComplete = vi.fn();

    await batchProcess({ items, onItemComplete: onComplete }, async (i) => i);

    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledWith(1, 0, 2);
  });
});
