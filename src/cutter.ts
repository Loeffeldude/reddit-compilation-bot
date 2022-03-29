import { SingleBar, Presets } from "cli-progress";
import Ffmpeg from "fluent-ffmpeg";
import { runPromisifiedFfmpeg } from "./util/util";

export async function saveMergedVideo(
  videoPaths: string[],
  resultPath: string
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

  command.complexFilter(concatFilter);
  command.addOption("-map", "[v]");
  command.addOption("-map", "[a]");
  command.output(resultPath);
  // command.size(resolution).autoPad(true, "black");

  const bar = new SingleBar({}, Presets.legacy);
  bar.start(100, 0);

  await runPromisifiedFfmpeg(command, {
    onProgress: (progress: number) => {
      bar.update(progress);
    },
  });
  bar.stop();
}

export function getMergeFilterSegment(index: number) {
  return `[${index}:v] [${index}:a] `;
}
export async function normalizeVideos(
  videoPaths: string[],
  resolution: string,
  autoPadColor: string
) {
  const bar = new SingleBar({}, Presets.legacy);

  bar.start(videoPaths.length, 0);

  const result = await Promise.all(
    videoPaths.map(async (videoPath) => {
      const command = Ffmpeg(videoPath)
        .input(videoPath)
        .size(resolution)
        .autoPad(true, autoPadColor)
        .output(videoPath + ".normal.mp4");
      await runPromisifiedFfmpeg(command);
      bar.increment();
      return videoPath + ".normal.mp4";
    })
  );

  bar.stop();

  return result;
}
