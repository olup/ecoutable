import "dotenv/config";
import { promises as fs } from "fs";
import path, { join } from "path"; // Import 'path' itself
import url from "url"; // Import 'url'
import { runTts } from "./src/utils/tts"; // Adjust path if necessary

// --- Fix for __dirname in ES Modules ---
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- End fix ---

const sampleText = `
Hello world! This is a test of the text-to-speech system.

This is a second paragraph, slightly longer to test chunking and concatenation. We are using different voices potentially, and ensuring the final MP3 has the correct speed.

[image](https://www.netplume.net/wp-content/uploads/2021/01/clavier_0.jpg)

Let's add a third paragraph with some numbers like 1, 2, 3, and maybe a question? How does this sound? We hope it sounds great!
`;

const outputFileName = "demo_output.mp3";
const outputPath = join(__dirname, outputFileName); // Save in the same directory as the script (now correctly determined)

async function main() {
  console.log("Starting TTS demo...");
  console.log(`Sample text:\n---\n${sampleText}\n---`);

  if (!process.env.REPLICATE_API_TOKEN) {
    console.error(
      "Error: REPLICATE_API_TOKEN is not set in the environment variables."
    );
    console.error("Please ensure it is defined in your .env file.");
    process.exit(1);
  }

  try {
    console.log("Generating audio, this may take a while...");
    const mp3Buffer = await runTts(sampleText);

    console.log(`Audio generated successfully (${mp3Buffer.length} bytes).`);
    await fs.writeFile(outputPath, mp3Buffer);
    console.log(`MP3 file saved to: ${outputPath}`);
  } catch (error) {
    console.error("Error during TTS generation or file saving:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
