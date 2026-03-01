import { describe, it, expect, vi, beforeEach } from "vitest";
import { FFmpeg } from "../../src/core/ffmpeg";
import * as processUtils from "../../src/utils/process";
import { EventEmitter } from "node:events";

vi.mock("../../src/binary/paths", () => ({
  getFFmpegPath: () => "ffmpeg",
}));

vi.mock("../../src/utils/process", () => ({
  spawnStreamingProcess: vi.fn(),
  killProcess: vi.fn().mockResolvedValue(undefined),
}));

describe("FFmpeg Abort Support", () => {
  let mockProcess: any;

  beforeEach(() => {
    mockProcess = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    vi.spyOn(mockProcess, "on");
    vi.spyOn(mockProcess.stderr, "on");

    (processUtils.spawnStreamingProcess as any).mockReturnValue(mockProcess);
  });

  it("should throw FFmpegAbortError if signal is already aborted", async () => {
    const ffmpeg = new FFmpeg();
    const controller = new AbortController();
    controller.abort();

    await expect(ffmpeg.run(controller.signal)).rejects.toThrow(
      "FFmpeg operation aborted"
    );
  });

  it("should kill process and reject when signal is aborted during run", async () => {
    const ffmpeg = new FFmpeg();
    const controller = new AbortController();

    const runPromise = ffmpeg.run(controller.signal);

    // Simulate some time passes
    setTimeout(() => controller.abort(), 10);

    await expect(runPromise).rejects.toThrow("FFmpeg operation aborted");
    expect(processUtils.killProcess).toHaveBeenCalledWith(mockProcess);
  });

  it("should cleanup event listeners after successful run", async () => {
    const ffmpeg = new FFmpeg();
    const controller = new AbortController();
    const signal = controller.signal;
    const addSpy = vi.spyOn(signal, "addEventListener");
    const removeSpy = vi.spyOn(signal, "removeEventListener");

    const runPromise = ffmpeg.run(signal);

    // Simulate success
    mockProcess.emit("close", 0);

    await runPromise;

    expect(addSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it("should cleanup event listeners after error", async () => {
    const ffmpeg = new FFmpeg();
    const controller = new AbortController();
    const signal = controller.signal;
    const removeSpy = vi.spyOn(signal, "removeEventListener");

    const runPromise = ffmpeg.run(signal);

    // Prevent FFmpeg from throwing unhandled error
    ffmpeg.on("error", () => {});

    // Simulate error
    mockProcess.emit("error", new Error("Spawn error"));

    await expect(runPromise).rejects.toThrow("Spawn error");
    expect(removeSpy).toHaveBeenCalled();
  });
});
