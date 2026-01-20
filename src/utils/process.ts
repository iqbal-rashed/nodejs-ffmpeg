import {
  spawn,
  type ChildProcess,
  type SpawnOptions,
} from "node:child_process";
import { FFmpegTimeoutError } from "./errors";

export interface ProcessOptions {
  cwd?: string;
  timeout?: number;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
}

export interface ProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export function spawnProcess(
  command: string,
  args: string[],
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const spawnOptions: SpawnOptions = {
      cwd: options.cwd,
      windowsHide: true,
    };

    const child: ChildProcess = spawn(command, args, spawnOptions);

    let stdout = "";
    let stderr = "";
    let killed = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (options.timeout && options.timeout > 0) {
      timeoutId = setTimeout(() => {
        killed = true;
        child.kill("SIGKILL");
      }, options.timeout);
    }

    child.stdout?.on("data", (data: Buffer) => {
      const str = data.toString();
      stdout += str;
      options.onStdout?.(str);
    });

    child.stderr?.on("data", (data: Buffer) => {
      const str = data.toString();
      stderr += str;
      options.onStderr?.(str);
    });

    child.on("error", (error) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    });

    child.on("close", (code) => {
      if (timeoutId) clearTimeout(timeoutId);

      if (killed) {
        reject(
          new FFmpegTimeoutError(
            options.timeout ?? 0,
            `${command} ${args.join(" ")}`
          )
        );
        return;
      }

      const exitCode = code ?? 0;
      resolve({ exitCode, stdout, stderr });
    });
  });
}

export function spawnStreamingProcess(
  command: string,
  args: string[],
  options: SpawnOptions = {}
): ChildProcess {
  return spawn(command, args, {
    ...options,
    windowsHide: true,
  });
}

export async function killProcess(
  child: ChildProcess,
  gracefulTimeoutMs = 5000
): Promise<void> {
  return new Promise((resolve) => {
    if (!child.pid || child.killed) {
      resolve();
      return;
    }

    const forceKill = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, gracefulTimeoutMs);

    child.once("exit", () => {
      clearTimeout(forceKill);
      resolve();
    });

    child.kill("SIGTERM");
  });
}
