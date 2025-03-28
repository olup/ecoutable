import { Readable } from "node:stream";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY,
});

const streamToBuffer = (stream: Readable): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on("data", (chunk) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    );
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", (err) => reject(err));
  });
};

export const runTts = async (text: string): Promise<Buffer> => {
  try {
    console.log("Generating TTS");

    const input = {
      text: text,
      voice: "af_alloy",
    };

    const output = (await replicate.run(
      "jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13",
      { input }
    )) as Readable;

    // In Node.js, we'll get the audio data as a Buffer
    return streamToBuffer(output);
  } catch (error) {
    console.error("Failed to generate TTS", error);
    throw new Error("Failed to generate TTS");
  }
};
