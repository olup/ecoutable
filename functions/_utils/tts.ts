import Replicate from "replicate";
async function streamToArrayBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<ArrayBuffer> {
  const chunks: Uint8Array[] = [];

  const reader = stream.getReader();
  let result = await reader.read();

  while (!result.done) {
    chunks.push(result.value);
    result = await reader.read();
  }

  // Combine chunks into a single Uint8Array
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);

  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert to ArrayBuffer
  return combined.buffer;
}

export const runTts = async (text: string, apiKey: string) => {
  try {
    console.log("Generating TTS");

    const replicate = new Replicate({
      auth: apiKey,
    });

    const input = {
      text: text,
      voice: "af_alloy",
    };

    const output = await replicate.run(
      "jaaari/kokoro-82m:f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13",
      { input }
    );

    return streamToArrayBuffer(output as ReadableStream<Uint8Array>);
  } catch (error) {
    console.error("Failed to generate TTS", error);
    throw new Error("Failed to generate TTS");
  }
};
