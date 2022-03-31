import { Options } from "../config";

//TODO: move to options
export const ConcurrentFfmpegProcesses = 3;

export const defaultOptions: Partial<Options> = {
  tempDir: "./tmp",
  logging: false,
  debug: false,
  minLength: 0,
  maxLength: 30,
  hideUsed: true,
  includeHidden: false,
};

export const resolutions: Record<string, string> = {
  "1080p": "1920x1080",
  "720p": "1280x720",
  "480p": "854x480",
  "360p": "640x360",
  "240p": "426x240",
};
