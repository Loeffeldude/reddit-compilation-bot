import Ffmpeg from "fluent-ffmpeg";
import { runPromisifiedFfmpeg } from "./util/util";

export async function saveMergedVideo(
  videoPaths: string[],
  resultPath: string
) {
  // TODO: apsect ratio option
  // TODO: ffmpef adding command as option optionally
  const command = Ffmpeg().aspectRatio("16:9").autoPad(true, "black");
  for (const videoPath of videoPaths) {
    command.mergeAdd(videoPath);
  }
  command.mergeToFile(resultPath);
  await runPromisifiedFfmpeg(command);
}
