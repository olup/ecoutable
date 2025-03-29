import { Readable } from "node:stream";

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

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

  // Combine all chunks into one Buffer
  return Buffer.concat(chunks);
}

export const runTts = async (text: string) => {
  if (!REPLICATE_API_TOKEN) {
    throw new Error("REPLICATE_API_TOKEN is not set");
  }

  try {
    console.log("Initiating TTS generation");

    // Start prediction
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
          voice: "af_alloy",
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to start prediction: ${JSON.stringify(error)}`);
    }

    const prediction = await response.json();

    // Poll for completion
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

        // Fetch the audio file as stream
        const audioResponse = await fetch(status.output);
        if (!audioResponse.ok) {
          throw new Error("Failed to fetch audio file");
        }

        // Convert response stream to buffer
        return await streamToBuffer(
          audioResponse.body as ReadableStream<Uint8Array>
        );
      }

      if (status.status === "failed") {
        throw new Error(`Prediction failed: ${status.error}`);
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("Failed to generate TTS:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate TTS"
    );
  }
};
