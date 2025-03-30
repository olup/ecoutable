import { Readable } from "node:stream";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawn } from "child_process";

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

// Function to generate silence using ffmpeg
async function generateSilence(
  duration: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=44100:cl=mono",
      "-t",
      duration.toString(),
      "-acodec",
      "pcm_s16le",
      "-ar",
      "44100",
      "-ac",
      "1",
      outputPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", reject);
  });
}

// Function to concatenate audio files with silence gaps
async function concatenateAudio(
  files: string[],
  outputFile: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Create a concat file
    const inputs = files.map((file) => `file '${file}'`).join("\n");
    const concatFile = join(tmpdir(), "concat.txt");

    fs.writeFile(concatFile, inputs)
      .then(() => {
        const ffmpeg = spawn("ffmpeg", [
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          concatFile,
          "-acodec",
          "libmp3lame",
          "-ar",
          "44100",
          "-ac",
          "1",
          "-b:a",
          "128k",
          outputFile,
        ]);

        ffmpeg.on("close", async (code) => {
          await fs.unlink(concatFile);
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`ffmpeg exited with code ${code}`));
          }
        });

        ffmpeg.on("error", reject);
      })
      .catch(reject);
  });
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

    const prediction = await response.json();

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

      const status = await statusResponse.json();

      if (status.status === "succeeded") {
        console.log("TTS generated successfully");

        const audioResponse = await fetch(status.output);
        if (!audioResponse.ok) {
          throw new Error("Failed to fetch audio file");
        }

        return await streamToBuffer(
          audioResponse.body as ReadableStream<Uint8Array>
        );
      }

      if (status.status === "failed") {
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

// Maintain backwards compatibility while adding new functionality
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
  try {
    const tmpDir = await fs.mkdtemp(join(tmpdir(), "audio-"));
    const audioFiles: string[] = [];
    const silenceFile = join(tmpDir, "silence.wav");
    const finalOutput = join(tmpDir, "final.mp3");

    try {
      // Generate silence file for gaps
      await generateSilence(0.5, silenceFile);

      // Process all chunks in parallel
      const processes = chunks.map(async (chunk, index) => {
        const voice =
          chunk.type === "title" || chunk.type === "image"
            ? "am_eric"
            : "af_alloy";
        const audioBuffer = await runSingleTts({
          text: chunk.content,
          voice: voice,
        });

        const chunkFile = join(tmpDir, `chunk-${index}.wav`);
        await fs.writeFile(chunkFile, audioBuffer);
        return chunkFile;
      });

      const chunkFiles = await Promise.all(processes);

      // Create array with silence gaps
      const filesWithGaps: string[] = [];
      chunkFiles.forEach((file, index) => {
        if (index > 0) {
          filesWithGaps.push(silenceFile);
        }
        filesWithGaps.push(file);
      });

      // Concatenate all files with silence gaps and convert to MP3
      await concatenateAudio(filesWithGaps, finalOutput);

      // Read the final MP3 file
      const finalBuffer = await fs.readFile(finalOutput);

      return finalBuffer;
    } finally {
      // Cleanup temp files
      const files = await fs.readdir(tmpDir);
      await Promise.all(files.map((file) => fs.unlink(join(tmpDir, file))));
      await fs.rmdir(tmpDir);
    }
  } catch (error) {
    console.error("Failed to process content to audio:", error);
    throw error;
  }
}
