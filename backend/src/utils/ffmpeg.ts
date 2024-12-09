import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import { unlink, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";

// /**
//  * Trims silence from an MP3 audio file.
//  * @param inputBuffer - The input MP3 audio as an ArrayBuffer.
//  * @returns A Promise that resolves with the trimmed audio as an ArrayBuffer.
//  */
// export async function trimEndingSilence(
//   inputBuffer: ArrayBuffer
// ): Promise<ArrayBuffer> {
//   return new Promise(async (resolve, reject) => {
//     const fileId = Date.now();
//     // Temporary file paths
//     const inputFilePath = path.join(__dirname, fileId + "tempInput.mp3");
//     const outputFilePath = path.join(__dirname, fileId + "tempOutput.mp3");

//     // Write the input ArrayBuffer to a temporary input file
//     await writeFile(inputFilePath, Buffer.from(inputBuffer));

//     // Use fluent-ffmpeg to process the audio
//     ffmpeg(inputFilePath)
//       .inputFormat("mp3") // Specify input format for MP3
//       .outputOptions([
//         `-af silenceremove=start_periods=1:start_duration=0.01:start_threshold=-40dB:detection=peak,aformat=dblp,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-40dB:detection=peak,aformat=dblp,areverse`,
//       ])
//       .format("mp3") // Output as MP3
//       .on("error", async (err) => {
//         console.error("Error trimming silence:", err);
//         // Clean up the temporary file
//         await unlink(inputFilePath);
//         resolve(new ArrayBuffer(0));
//       })
//       .on("end", async () => {
//         // Read the trimmed audio from the output file
//         const trimmedBuffer = fs.readFileSync(outputFilePath);

//         // Clean up temporary files
//         await unlink(inputFilePath);
//         await unlink(outputFilePath);

//         // Convert Buffer back to ArrayBuffer and resolve
//         resolve(
//           trimmedBuffer.buffer.slice(
//             trimmedBuffer.byteOffset,
//             trimmedBuffer.byteOffset + trimmedBuffer.byteLength
//           )
//         );
//       })
//       .save(outputFilePath); // Save the output to the temporary file
//   });
// }
