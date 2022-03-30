import Ffmpeg from "fluent-ffmpeg";
import { runPromisifiedFfmpeg } from "./util/util";
import { queue } from "async";
import { FfmpegEventCallbacks } from "./types/ffmpeg";
export async function saveMergedVideo(
  videoPaths: string[],
  resultPath: string,
  ffmpegEvents: FfmpegEventCallbacks
) {
  const command = Ffmpeg();
  let concatFilter = "";
  let i = 0;
  for (const videoPath of videoPaths) {
    command.input(videoPath).format("mp4");
    concatFilter += getMergeFilterSegment(i);
    i += 1;
  }

  concatFilter += "concat=unsafe=1:n=" + videoPaths.length + ":v=1:a=1 [v] [a]";

  command
    .complexFilter(concatFilter)
    .addOption("-map", "[v]")
    .addOption("-map", "[a]")
    .output(resultPath); // command.size(resolution).autoPad(true, "black");

  await runPromisifiedFfmpeg(command, ffmpegEvents);
}

export function getMergeFilterSegment(index: number) {
  return `[${index}:v] [${index}:a] `;
}
export async function normalizeVideos(
  videoPaths: string[],
  resolution: string,
  autoPadColor: string,
  ffmpegEvents?: FfmpegEventCallbacks
) {
  const result: string[] = [];

  const q = queue(async (path: string, callback) => {
    try {
      const resultPath = path + ".normal.mp4";

      const command = Ffmpeg()
        .input(path)
        .size(resolution)
        .autoPad(true, autoPadColor)
        .output(resultPath);

      await runPromisifiedFfmpeg(command, ffmpegEvents);

      result.push(resultPath);
      callback();
    } catch (e: any) {
      callback(e);
    }
  }, 3);

  q.push(videoPaths);

  await q.drain();

  return result;
}
