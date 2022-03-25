export class InvalidConfigError extends Error {}
export class FileNotFoundError extends Error {}
export class InvalidOptionsError extends Error {}
export class FfmpegError extends Error {
  data: unknown;

  constructor(message: string | undefined, data: unknown) {
    super(message);
    this.data = data;
  }
}
export class VideoNotFoundError extends Error {}
