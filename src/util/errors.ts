export class InvalidConfigError extends Error {}
export class FileNotFoundError extends Error {}
export class InvalidOptionsError extends Error {}
export class FfmpegError extends Error {
  stderr: unknown;
  stdout: unknown;
  constructor(message: string | undefined, stderr: string, stdout: string) {
    super(message);
    this.stderr = stderr;
    this.stdout = stdout;
  }
}
export class VideoNotFoundError extends Error {}
