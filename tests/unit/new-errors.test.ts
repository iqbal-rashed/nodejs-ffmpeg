import { describe, it, expect } from "vitest";
import {
  FFmpegAbortError,
  InvalidInputError,
  CodecNotFoundError,
  FileExistsError,
} from "../../src/utils/errors";

describe("New Error Types", () => {
  it("FFmpegAbortError should have correct properties", () => {
    const error = new FFmpegAbortError("ffmpeg -i in.mp4 out.mp4");
    expect(error.name).toBe("FFmpegAbortError");
    expect(error.command).toBe("ffmpeg -i in.mp4 out.mp4");
    expect(error.message).toContain("operation aborted");
  });

  it("InvalidInputError should have correct properties", () => {
    const error = new InvalidInputError("missing.mp4");
    expect(error.name).toBe("InvalidInputError");
    expect(error.path).toBe("missing.mp4");
    expect(error.message).toContain("missing.mp4");
  });

  it("CodecNotFoundError should have correct properties", () => {
    const error = new CodecNotFoundError("fake_codec");
    expect(error.name).toBe("CodecNotFoundError");
    expect(error.codec).toBe("fake_codec");
    expect(error.message).toContain("fake_codec");
  });

  it("FileExistsError should have correct properties", () => {
    const error = new FileExistsError("existing.mp4");
    expect(error.name).toBe("FileExistsError");
    expect(error.path).toBe("existing.mp4");
    expect(error.message).toContain("already exists");
  });
});
