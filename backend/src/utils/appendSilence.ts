import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import { join } from "path";
import os from "os";
import crypto from "crypto";

const isLocal = process.env.isDev === "true";

ffmpeg.setFfmpegPath(isLocal ? "/usr/local/bin/ffmpeg" : "/opt/bin/ffmpeg");
ffmpeg.setFfprobePath(isLocal ? "/usr/local/bin/ffprobe" : "/opt/bin/ffprobe");
ffmpeg.setFlvtoolPath(isLocal ? "/usr/local/bin/flvtool" : "/opt/bin/flvtool");

const bypass = (command: ffmpeg.FfmpegCommand) => {
  const bk = command.availableFormats;
  command.availableFormats = (cb: (err: any, data: any) => void) => {
    bk.bind(command)((err, data) => {
      const lavfi = {
        canDemux: true,
        canMux: true,
        description: "Lavfi",
      };
      cb(err, { ...data, lavfi });
    });
  };
};

// Path for the cached silence file
const CACHED_SILENCE_PATH = join(os.tmpdir(), "cached-silence-0.5s.mp3");

/**
 * Ensures the cached silence file exists
 * @throws Error if silence generation fails
 */
async function ensureSilenceCache(): Promise<void> {
  try {
    // Check if cache already exists
    await fs.access(CACHED_SILENCE_PATH);
  } catch {
    // Cache doesn't exist, generate it
    await new Promise<void>((resolve, reject) => {
      const cmd = ffmpeg();
      bypass(cmd);
      cmd
        .input("anullsrc")
        .inputFormat("lavfi")
        .duration(0.5)
        .output(CACHED_SILENCE_PATH)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });
  }
}

// Initialize the silence cache when the module loads
const silenceCachePromise = ensureSilenceCache();

/**
 * Appends 0.5 seconds of silence to the end of an MP3 file
 * @param inputBuffer - ArrayBuffer containing the original MP3 data
 * @returns Promise<ArrayBuffer> - ArrayBuffer containing the original audio followed by silence
 * @throws Error if audio processing fails
 */
async function appendSilenceToMp3(
  inputBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  // Ensure silence cache is ready
  await silenceCachePromise;

  // Generate unique ID for this processing job
  const jobId = crypto.randomUUID();

  // Create a unique temporary directory for this job
  const tempDir: string = await fs.mkdtemp(
    join(os.tmpdir(), `audio-${jobId}-`)
  );
  const inputPath: string = join(tempDir, `input-${jobId}.mp3`);
  const outputPath: string = join(tempDir, `output-${jobId}.mp3`);

  try {
    // Write input buffer to temporary file
    await fs.writeFile(inputPath, Buffer.from(inputBuffer));

    // Concatenate original audio with cached silence
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(inputPath)
        .input(CACHED_SILENCE_PATH)
        .complexFilter(["concat=n=2:v=0:a=1"])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    // Read the final output file
    const outputBuffer: Buffer = await fs.readFile(outputPath);

    // Clean up temporary files
    await Promise.all(
      [
        fs.unlink(inputPath).catch(() => {}),
        fs.unlink(outputPath).catch(() => {}),
        fs.rmdir(tempDir).catch(() => {}),
      ].map((p) => p.catch(() => {}))
    );

    return outputBuffer.buffer.slice(
      outputBuffer.byteOffset,
      outputBuffer.byteOffset + outputBuffer.byteLength
    );
  } catch (error) {
    // Clean up temporary files even if an error occurs
    try {
      await Promise.all(
        [
          fs.unlink(inputPath).catch(() => {}),
          fs.unlink(outputPath).catch(() => {}),
          fs.rmdir(tempDir).catch(() => {}),
        ].map((p) => p.catch(() => {}))
      );
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Rate limiter to control concurrent ffmpeg processes
 * @param maxConcurrent - Maximum number of concurrent processes
 */
class FfmpegRateLimiter {
  private queue: (() => Promise<void>)[] = [];
  private running = 0;

  constructor(private maxConcurrent: number) {}

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    if (this.running >= this.maxConcurrent) {
      await new Promise<void>((resolve) => {
        this.queue.push(async () => resolve());
      });
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next?.();
      }
    }
  }
}

// Create a rate limiter instance
const rateLimiter = new FfmpegRateLimiter(4);

/**
 * Wrapper function that uses rate limiting for parallel processing
 */
export default async function appendSilenceToMp3WithRateLimit(
  inputBuffer: ArrayBuffer
): Promise<ArrayBuffer> {
  return rateLimiter.enqueue(() => appendSilenceToMp3(inputBuffer));
}
