import { FfmpegCommand } from "fluent-ffmpeg";
import { FfmpegError } from "./errors";
import { logger } from "./logger";

export function randomIndex(length: number): number {
  return Math.round(Math.random() * (length - 1));
}

export function getVideoNameFromUrl(url: string) {
  const segments = url.slice(0, -1).split("/");
  return segments[segments.length - 2];
}
export function getAudioUrl(url: string) {
  const index = url.lastIndexOf("/");
  return `${url.slice(0, index)}/DASH_audio.mp4`;
}
export async function runPromisifiedFfmpeg(
  command: FfmpegCommand,
  options?: {
    ffmpegRunFunction?: (command: FfmpegCommand) => void;
    onProgress?: (progress: number) => void;
  }
) {
  return new Promise<void>((resolve, reject) => {
    command
      .on("end", () => {
        resolve();
      })
      .on("error", (err: unknown, stdout: string, stderr: string) => {
        logger.debug("stdout:");
        logger.debug(stdout);
        logger.debug("stderr:");
        logger.debug(stderr);
        reject(new FfmpegError(`A Ffmpeg command failed \n ${err}`, err));
      })
      .on("progress", (progress: { percentage: number }) => {
        if (options?.onProgress) {
          options.onProgress(progress.percentage);
        }
      });
    if (options?.ffmpegRunFunction) {
      options.ffmpegRunFunction(command);
    } else {
      command.run();
    }
  });
}
export function isReseloution(string: string) {
  return !!string.match(/^[0-9]+x[0-9]+$/gi);
}
