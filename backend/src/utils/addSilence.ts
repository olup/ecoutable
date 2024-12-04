import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import { Writable } from "stream";

/**
 * Adds silence to the end of an audio file.
 * @param inputBuffer - The input audio as a Buffer.
 * @param duration - Duration of silence to add (in seconds).
 * @param format - The audio format (e.g., 'mp3', 'wav').
 * @returns A Promise that resolves with the audio with added silence as a Buffer.
 */
async function addSilence(
  inputBuffer: Buffer,
  duration: number,
  format: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // Convert the input buffer into a readable stream
    const inputStream = new Readable();
    inputStream.push(inputBuffer);
    inputStream.push(null); // Signal end of the stream

    // Create a writable stream to store the output
    const outputChunks: Buffer[] = [];
    const outputStream = new Writable({
      write(chunk, encoding, callback) {
        outputChunks.push(chunk);
        callback();
      },
    });

    // Use fluent-ffmpeg to process the audio
    ffmpeg(inputStream)
      .inputFormat(format) // Specify input format
      .outputOptions([
        `-af apad=pad_dur=${duration}`, // Add silence for the specified duration
        "-shortest", // Ensure the output file matches the length of the input + silence
      ])
      .format(format) // Output format
      .on("error", (err) => reject(err))
      .on("end", () => {
        // Concatenate all output chunks into a single Buffer
        resolve(Buffer.concat(outputChunks));
      })
      .pipe(outputStream, { end: true }); // Pipe the output to the writable stream
  });
}

// Example usage
(async () => {
  const fs = require("fs");

  // Load an MP3 file into a Buffer (replace with your actual Blob/Buffer source)
  const inputAudioBuffer = fs.readFileSync("input-audio.mp3");

  try {
    const silenceDuration = 5; // Add 5 seconds of silence
    const format = "mp3"; // Specify the format of your audio
    const outputAudio = await addSilence(
      inputAudioBuffer,
      silenceDuration,
      format
    );
    fs.writeFileSync("output-audio-with-silence.mp3", outputAudio); // Save the output audio
    console.log("Silence added successfully!");
  } catch (error) {
    console.error("Error adding silence:", error);
  }
})();
