import type { BatchOptions, BatchResult } from "../types";
import { FFmpegAbortError } from "./errors";

/**
 * Process multiple items with concurrency control
 *
 * @example
 * ```typescript
 * import { batchProcess, convert } from 'nodejs-ffmpeg';
 *
 * const files = ['video1.mp4', 'video2.mp4', 'video3.mp4'];
 *
 * const results = await batchProcess(
 *   {
 *     items: files,
 *     concurrency: 2,
 *     onItemComplete: (file, index, total) => {
 *       console.log(`Completed ${index + 1}/${total}: ${file}`);
 *     },
 *   },
 *   async (file) => {
 *     return convert({
 *       input: file,
 *       output: file.replace('.mp4', '.webm'),
 *       videoCodec: 'libvpx-vp9',
 *     });
 *   }
 * );
 * ```
 */
export async function batchProcess<T, R>(
  options: BatchOptions<T>,
  processor: (item: T, index: number) => Promise<R>
): Promise<BatchResult<R>[]> {
  const {
    items,
    concurrency = 4,
    signal,
    onItemComplete,
    onItemError,
  } = options;

  if (items.length === 0) {
    return [];
  }

  const results: BatchResult<R>[] = [];
  const total = items.length;
  let currentIndex = 0;

  const processItem = async (): Promise<void> => {
    while (currentIndex < total) {
      if (signal?.aborted) {
        throw new FFmpegAbortError("Batch process aborted");
      }

      const index = currentIndex++;
      const item = items[index];

      if (item === undefined) {
        break;
      }

      try {
        const result = await processor(item, index);
        results.push({
          success: true,
          result,
          index,
        });
        onItemComplete?.(item, index, total);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        results.push({
          success: false,
          error: err,
          index,
        });
        onItemError?.(err, item, index);
      }
    }
  };

  const workers = Array(Math.min(concurrency, total))
    .fill(null)
    .map(() => processItem());

  await Promise.all(workers);

  return results.sort((a, b) => a.index - b.index);
}

/**
 * Get successful results from batch processing
 */
export function getSuccessfulResults<R>(results: BatchResult<R>[]): R[] {
  return results
    .filter(
      (r): r is BatchResult<R> & { success: true; result: R } => r.success
    )
    .map((r) => r.result);
}

/**
 * Get failed results from batch processing
 */
export function getFailedResults<R>(
  results: BatchResult<R>[]
): { index: number; error: Error }[] {
  return results
    .filter(
      (r): r is BatchResult<R> & { success: false; error: Error } => !r.success
    )
    .map((r) => ({ index: r.index, error: r.error }));
}
