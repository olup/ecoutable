import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import ffmpeg from "fluent-ffmpeg";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

interface TTSOptions {
  text: string;
  voice: "am_eric" | "af_alloy";
}

export interface ContentChunk {
  type: "title" | "image" | "text";
  content: string;
}

async function cleanupTempDir(dir: string): Promise<void> {
  try {
    const files = await fs.readdir(dir);
    await Promise.all(files.map((file) => fs.unlink(join(dir, file))));
    await fs.rmdir(dir);
  } catch (error) {
    console.error("Failed to clean up temp directory:", dir, error);
  }
}

/**
 * Concatenates multiple audio files using FFmpeg and converts the result to MP3.
 * @param concatListPath Path to the text file listing input files for FFmpeg concat demuxer.
 * @param outputMp3Path Path where the final MP3 file will be saved.
 * @param tempDir Temporary directory used for the operation (will be cleaned up).
 */
async function concatenateAndConvertToMp3(
  concatListPath: string,
  outputMp3Path: string
): Promise<Buffer> {
  console.log(
    `Concatenating via ${concatListPath} and converting to MP3: ${outputMp3Path}`
  );
  return new Promise<Buffer>((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(["-f", "concat", "-safe", "0"]) // Use concat demuxer
      .outputOptions(["-c:a", "libmp3lame", "-b:a", "128k"]) // MP3 codec and bitrate
      .toFormat("mp3")
      .on("start", (cmd) => console.log(`Starting ffmpeg: ${cmd}`))
      .on("progress", (progress) => {
        if (progress.percent) {
          console.log(`Converting: ${Math.round(progress.percent)}% done`);
        }
      })
      .on("error", (err: Error, stdout, stderr) => {
        console.error("FFmpeg concat/conversion error:", err);
        console.error("FFmpeg stdout:", stdout);
        console.error("FFmpeg stderr:", stderr);
        reject(err);
      })
      .on("end", async () => {
        console.log("FFmpeg concat/conversion completed");
        try {
          const mp3Buffer = await fs.readFile(outputMp3Path);
          resolve(mp3Buffer);
        } catch (readError) {
          console.error("Error reading final MP3:", readError);
          reject(readError);
        }
      })
      .save(outputMp3Path);
  });
}

// Removed validateWavHeader - No longer needed as FFmpeg handles input validation.

// Removed createWavHeader - No longer needed as FFmpeg handles output generation.

export async function generateSilence(
  duration: number,
  outputPath: string
): Promise<void> {
  if (duration <= 0) {
    return Promise.reject(new Error("Duration must be greater than 0"));
  }

  // Reverting to manual WAV creation for silence as lavfi is unavailable.
  console.log(`Generating ${duration}s silence manually: ${outputPath}`);

  // Standard WAV parameters
  const sampleRate = 44100;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor(duration * sampleRate);
  const dataSize = numSamples * channels * bytesPerSample;
  const fileSize = dataSize + 44; // Standard WAV header size

  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize - 8, 4); // fileSize - "RIFF" - size field itself
  header.write("WAVE", 8);

  // fmt sub-chunk
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bytesPerSample, 28); // ByteRate
  header.writeUInt16LE(channels * bytesPerSample, 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  // Create buffer for silence data (all zeros)
  const silenceData = Buffer.alloc(dataSize);

  // Write the complete WAV file
  try {
    await fs.writeFile(outputPath, Buffer.concat([header, silenceData]));
    console.log("Manual silence generation completed.");
  } catch (error) {
    console.error("Error writing manual silence file:", error);
    throw error; // Re-throw the error
  }
}

// Removed concatenateAudio function - Replaced by concatenateAndConvertToMp3 using FFmpeg.

/**
 * Re-encodes a WAV buffer to a standard format (mono, 44100Hz, pcm_s16le) using FFmpeg.
 * @param inputBuffer The input WAV buffer.
 * @returns A Promise resolving to the re-encoded WAV buffer.
 */
async function reEncodeWavBuffer(inputBuffer: Buffer): Promise<Buffer> {
  const tempDir = await fs.mkdtemp(join(tmpdir(), "wav-reencode-"));
  const inputPath = join(tempDir, "input.wav");
  const outputPath = join(tempDir, "output.wav");

  try {
    await fs.writeFile(inputPath, inputBuffer);
    console.log(`Re-encoding WAV buffer in ${tempDir}...`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .audioChannels(1)
        .audioFrequency(44100)
        .audioCodec("pcm_s16le") // Ensure consistent encoding
        .toFormat("wav")
        .on("start", (cmd) => console.log(`Starting ffmpeg re-encode: ${cmd}`))
        .on("error", (err: Error, stdout, stderr) => {
          console.error("FFmpeg re-encoding error:", err);
          console.error("FFmpeg stdout:", stdout);
          console.error("FFmpeg stderr:", stderr);
          reject(err);
        })
        .on("end", () => {
          console.log("FFmpeg re-encoding completed.");
          resolve();
        })
        .save(outputPath);
    });

    const outputBuffer = await fs.readFile(outputPath);
    console.log(`Re-encoded buffer size: ${outputBuffer.length}`);
    return outputBuffer;
  } finally {
    await cleanupTempDir(tempDir); // Clean up temp files
  }
}

async function streamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

async function runSingleTts({ text, voice }: TTSOptions): Promise<Buffer> {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set");
  }

  try {
    console.log(`Initiating TTS generation for voice: ${voice}`);

    const response = await fetch(REPLICATE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version:
          "f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13",
        input: {
          text: text,
          voice: voice,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to start prediction: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    if (
      !data ||
      typeof data !== "object" ||
      !("id" in data) ||
      typeof data.id !== "string"
    ) {
      throw new Error("Invalid prediction response format");
    }
    const prediction = data as { id: string };

    while (true) {
      const statusResponse = await fetch(
        `${REPLICATE_API_URL}/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${REPLICATE_API_TOKEN}`,
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Failed to check prediction status");
      }

      const data = await statusResponse.json();
      if (!data || typeof data !== "object" || !("status" in data)) {
        throw new Error("Invalid status response format");
      }
      const status = data as {
        status: string;
        output?: string;
        error?: string;
      };

      if (status.status === "succeeded" && status.output) {
        console.log("TTS generated successfully");

        const audioResponse = await fetch(status.output);
        if (!audioResponse.ok) {
          throw new Error("Failed to fetch audio file");
        }

        const audioBuffer = await streamToBuffer(
          audioResponse.body as ReadableStream<Uint8Array>
        );

        // Basic check for non-empty buffer, actual validation done by ffmpeg later
        if (!audioBuffer || audioBuffer.length === 0) {
          throw new Error("Received empty audio buffer from TTS service");
        }
        // No need to validate WAV header here initially.
        // Re-encode to ensure consistent format before returning.
        console.log(
          `Re-encoding TTS chunk (size: ${audioBuffer.length}) to standard format...`
        );
        const reEncodedBuffer = await reEncodeWavBuffer(audioBuffer);
        return reEncodedBuffer;
      }

      if (status.status === "failed" && status.error) {
        throw new Error(`Prediction failed: ${status.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("Failed to generate TTS:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate TTS"
    );
  }
}

export const runTts = async (text: string): Promise<Buffer> => {
  const chunks = text.split("\n\n").map((content) => ({
    type: "text" as const,
    content,
  }));
  return await processContentToAudio(chunks);
};

export async function processContentToAudio(
  chunks: ContentChunk[]
): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(join(tmpdir(), "audio-"));

  try {
    console.log(`Processing ${chunks.length} content chunks in ${tmpDir}...`);
    const silenceDuration = 0.5; // seconds
    const silenceFile = join(tmpDir, "silence.wav");
    const concatListFile = join(tmpDir, "concat_list.txt");
    const finalOutputMp3 = join(tmpDir, "final.mp3");

    // Generate silence file once
    await generateSilence(silenceDuration, silenceFile);

    // Process TTS chunks and write WAV files in parallel
    const chunkFilePaths = await Promise.all(
      chunks.map(async (chunk, index) => {
        const voice =
          chunk.type === "title" || chunk.type === "image"
            ? "am_eric"
            : "af_alloy";
        console.log(`Generating TTS for chunk ${index} (voice: ${voice})...`);
        const audioBuffer = await runSingleTts({
          text: chunk.content,
          voice: voice,
        });

        const chunkFilePath = join(tmpDir, `chunk-${index}.wav`);
        await fs.writeFile(chunkFilePath, audioBuffer);
        console.log(`Wrote chunk ${index} to ${chunkFilePath}`);
        return chunkFilePath;
      })
    );

    // Create the FFmpeg concat list file content
    let concatFileContent = "";
    chunkFilePaths.forEach((filePath, index) => {
      if (index > 0) {
        // Add silence file before every chunk except the first
        concatFileContent += `file '${silenceFile}'\n`;
      }
      concatFileContent += `file '${filePath}'\n`;
    });

    // Write the concat list file
    await fs.writeFile(concatListFile, concatFileContent);
    console.log(`Wrote concat list to ${concatListFile}`);

    // Concatenate all files using FFmpeg and convert to MP3
    const finalMp3Buffer = await concatenateAndConvertToMp3(
      concatListFile,
      finalOutputMp3
    );

    console.log("Successfully generated final MP3 buffer.");
    return finalMp3Buffer;
  } finally {
    // Always attempt cleanup
    console.log(`Cleaning up temporary directory: ${tmpDir}`);
    await cleanupTempDir(tmpDir);
  }
}
