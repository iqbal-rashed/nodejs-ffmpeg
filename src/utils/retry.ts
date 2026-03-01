import type { RetryOptions } from "../types";
import { FFmpegExitError } from "./errors";

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    retryDelay = 1000,
    retryOnExitCode = [1, 255],
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this is the last attempt
      if (attempt >= maxAttempts) {
        break;
      }

      // Check if we should retry based on exit code
      const shouldRetry =
        error instanceof FFmpegExitError &&
        retryOnExitCode.includes(error.exitCode);

      // Also retry on generic errors
      const shouldRetryGeneric = !(error instanceof FFmpegExitError);

      if (!shouldRetry && !shouldRetryGeneric) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);

      console.warn(
        `Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`,
        error instanceof FFmpegExitError
          ? `Exit code: ${error.exitCode}`
          : lastError.message
      );

      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Retry failed");
}

/**
 * Convert with retry support
 */
export async function convertWithRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  return withRetry(fn, options);
}
