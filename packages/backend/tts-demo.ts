import "dotenv/config";
import { runTts } from "./src/utils/tts.js";

runTts("Hello, this is a test of the TTS system.").then((audioBlob) => {
  console.log("Audio Blob:", audioBlob);
  // Here you can save the audioBlob to a file or process it further
});
