import path from "path";
import { open } from "fs/promises";
import { FileNotFoundError, InvalidConfigError } from "../util/errors";

export interface Config {
  ffmpegPath: string;
  output: string;
  subreddits?: string[];
  categories?: Record<string, string[]>;
  category?: string;
  minLength: number;
  maxLength: number;
  targetVideoLength: number;
  hideUsed: boolean;
  includeHidden: boolean;
  tempDir: string;
  redditClientId: string;
  redditClientSecret: string;
  redditUsername: string;
  redditPassword: string;
  verbose: boolean;
}
export type Options = Omit<Config, "categories"> & { input?: string };

export async function loadConfig(configPath: string) {
  try {
    const file = await open(path.resolve(configPath), "r");
    const config: Config = JSON.parse((await file.readFile()).toString());
    if (!(await validate(config))) {
      // TODO: message key
      throw new InvalidConfigError("The provided config is invalid");
    }
    await file.close();
    return config;
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      throw new FileNotFoundError("Couldn't find file at");
    }
    throw e;
  }
}

export function extendOptions(config: Config, options: Options): Config {
  return { ...config, ...options };
}

export function validate(config: Config): boolean {
  // TODO: implement
  return true;
}

export function configParseNumbers(config: Options) {
  const clone = { ...config };

  if (clone.minLength) clone.minLength = Number(clone.minLength);
  if (clone.maxLength) clone.maxLength = Number(clone.maxLength);
  if (clone.targetVideoLength)
    clone.targetVideoLength = Number(clone.targetVideoLength);
  return clone;
}
