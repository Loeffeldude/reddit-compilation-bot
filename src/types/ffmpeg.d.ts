export type ProgressEventData = {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percent: number;
};

export type FfmpegEventCallbacks = {
  onProgress?: (progress: ProgressEventData) => void;
  onComplete?: () => void;
  onError?: (err: string, stdout: string, stderr: string) => void;
};
