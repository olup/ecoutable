import ffmpeg from "fluent-ffmpeg";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

const isLocal = process.env.isDev === "true";
console.group("isLocal", isLocal);

ffmpeg.setFfmpegPath(isLocal ? "/usr/local/bin/ffmpeg" : "/opt/bin/ffmpeg");
ffmpeg.setFfprobePath(isLocal ? "/usr/local/bin/ffprobe" : "/opt/bin/ffprobe");
ffmpeg.setFlvtoolPath(isLocal ? "/usr/local/bin/flvtool" : "/opt/bin/flvtool");

const bypass = (command: ffmpeg.FfmpegCommand) => {
  const bk = command.availableFormats;
  command.availableFormats = (cb: (err: any, data: any) => void) => {
    bk.bind(command)((err, data) => {
      const lavfi = {
        canDemux: true,
        canMux: true,
        description: "Lavfi",
      };
      cb(err, { ...data, lavfi });
    });
  };
};

const createSilenceFile = async (path: string) =>
  new Promise<void>((resolve, reject) => {
    const cmd = ffmpeg();
    bypass(cmd);
    cmd
      .input("anullsrc")
      .inputFormat("lavfi")
      .duration(0.5)
      .output(path)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

export const combineMp3Files = async (
  inputFilePaths: string[],
  outputFilePath: string
) =>
  new Promise<string>(async (resolve, reject) => {
    console.log("Merging MP3 files...");
    console.log(inputFilePaths);
    console.log(outputFilePath);

    const tempDir = join(outputFilePath, "..");

    // create a 0.5 second silence file
    const silenceFilePath = join(tempDir, "silence.mp3");
    console.log("silenceFilePath", silenceFilePath);
    await createSilenceFile(silenceFilePath);

    // create the file listing
    const tempListFile = join(tempDir, "file-list.txt");
    await writeFile(
      tempListFile,
      inputFilePaths
        .map((filePath) => `file '${filePath}'\nfile '${silenceFilePath}'`)
        .join("\n")
    );

    const cmd = ffmpeg();
    bypass(cmd);
    cmd
      .input(tempListFile)
      .inputOptions("-f concat") // Specify concatenation mode
      .inputOptions("-safe 0") // Allow unsafe file paths
      // .outputOptions("-c copy") // Avoid re-encoding
      .save(outputFilePath)
      .on("end", () => {
        console.log("MP3 files merged successfully!");
        resolve(outputFilePath);
      })
      .on("error", (err) => {
        console.error("Error during MP3 merge:", err);
        reject(err);
      });
  });
