import { Options } from "../options/config";

//TODO: move to options
export const ConcurrentFfmpegProcesses = 3;

export const defaultOptions: Partial<Options> = {
  tempDir: "./tmp",
  verbose: false,
  debug: false,
  minLength: 0,
  maxLength: 30,
};
