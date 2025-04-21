import { promises as fs } from "fs";
import { join } from "path"; // Added dirname
import { describe, it, expect, beforeEach, afterEach, beforeAll } from "vitest";

describe("Audio Utils", () => {
  let testDir: string;
  // Define a base directory for test outputs within the test directory
  const baseTestOutputDir = join(__dirname, ".tmp"); // Use .tmp within the __tests__ directory
  let generateSilence: (duration: number, outputPath: string) => Promise<void>;
  // Removed concatenateAudio import as the function was removed

  beforeAll(async () => {
    // Dynamically import only the functions that still exist and are exported
    const ttsModule = await import("../tts.js");
    if (
      "generateSilence" in ttsModule &&
      typeof ttsModule.generateSilence === "function"
    ) {
      generateSilence = ttsModule.generateSilence;
      // concatenateAudio = ttsModule.concatenateAudio; // Removed
    } else {
      // Adjust error message or logic if only generateSilence is expected now
      throw new Error("generateSilence function not found in tts module");
    }
    // Ensure the base output directory exists
    await fs.mkdir(baseTestOutputDir, { recursive: true });
  });

  beforeEach(async () => {
    // Create a unique temporary directory within the base output directory
    testDir = await fs.mkdtemp(join(baseTestOutputDir, "audio-test-"));
  });

  afterEach(async () => {
    // Clean up the specific test directory - COMMENTED OUT FOR INSPECTION
    // try {
    //   // Check if testDir was actually created before trying to remove it
    //   if (testDir) {
    //     await fs.rm(testDir, { recursive: true, force: true });
    //   }
    // } catch (error) {
    //   // Log error if cleanup fails, but don't fail the test run
    //   console.error(`Cleanup failed for ${testDir}:`, error);
    // }
  });

  function checkWavHeader(buffer: Buffer, expectedDuration: number): void {
    // Basic WAV header checks
    expect(buffer.toString("utf8", 0, 4)).toBe("RIFF");
    expect(buffer.toString("utf8", 8, 12)).toBe("WAVE");

    // Audio format checks
    expect(buffer.readUInt16LE(20)).toBe(1); // PCM format
    expect(buffer.readUInt16LE(22)).toBe(1); // Mono
    expect(buffer.readUInt32LE(24)).toBe(44100); // Sample rate
    expect(buffer.readUInt16LE(34)).toBe(16); // Bits per sample

    // Duration check (approximate)
    const dataSize = buffer.readUInt32LE(40);
    const bytesPerSecond = 44100 * 1 * 2; // sample rate * channels * bytes per sample
    const actualDuration = dataSize / bytesPerSecond;
    expect(Math.abs(actualDuration - expectedDuration)).toBeLessThan(0.1);
  }

  describe("generateSilence", () => {
    it("should generate a valid WAV file with correct duration", async () => {
      const silencePath = join(testDir, "silence.wav");
      const duration = 0.5;

      await generateSilence(duration, silencePath);

      // Read and verify the file
      const buffer = await fs.readFile(silencePath);
      checkWavHeader(buffer, duration);

      // Check that the audio data is all zeros
      const dataSize = buffer.readUInt32LE(40);
      const audioData = buffer.slice(44, 44 + dataSize);
      expect(audioData.every((byte) => byte === 0)).toBe(true);
    });

    it("should fail with zero duration", async () => {
      const silencePath = join(testDir, "silence.wav");
      await expect(generateSilence(0, silencePath)).rejects.toThrow();
    });

    it("should fail with negative duration", async () => {
      const silencePath = join(testDir, "silence.wav");
      await expect(generateSilence(-1, silencePath)).rejects.toThrow();
    });
  });

  // Removed describe("concatenateAudio", ...) block as the function was removed
  // and the new internal implementation is not directly tested here.
});
