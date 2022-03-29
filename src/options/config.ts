import path from "path";
import { open } from "fs/promises";
import { FileNotFoundError, InvalidConfigError } from "../util/errors";
import { JSONSchemaType } from "ajv";
import Ajv from "ajv";

export type NonUndefined<T> = { [P in keyof T]-?: T[P] };

export interface Config {
  ffmpegPath: string;
  output: string;
  subreddits?: string[];
  categories?: Record<string, string[]>;
  category?: string;
  minLength: number;
  maxLength: number;
  targetVideoLength: number;
  resolution: string;
  hideUsed: boolean;
  includeHidden: boolean;
  tempDir: string;
  redditClientId: string;
  redditClientSecret: string;
  redditUsername: string;
  redditPassword: string;
  verbose: boolean;
}

export const configSchema: JSONSchemaType<NonUndefined<Config>> = {
  type: "object",
  properties: {
    ffmpegPath: { type: "string" },
    output: { type: "string" },
    subreddits: { type: "array", items: { type: "string" } },
    categories: {
      type: "object",
      additionalProperties: { type: "array", items: { type: "string" } },
      required: [],
    },
    category: { type: "string" },
    minLength: { type: "number" },
    maxLength: { type: "number" },
    targetVideoLength: { type: "number" },
    resolution: { type: "string" },
    hideUsed: { type: "boolean" },
    includeHidden: { type: "boolean" },
    tempDir: { type: "string" },
    redditClientId: { type: "string" },
    redditClientSecret: { type: "string" },
    redditUsername: { type: "string" },
    redditPassword: { type: "string" },
    verbose: { type: "boolean" },
  },
  required: [],
  additionalProperties: false,
};

export type Options = Omit<Config, "categories"> & { input?: string };

export const resolutions: Record<string, string> = {
  "1080p": "1920x1080",
  "720p": "1280x720",
  "480p": "854x480",
  "360p": "640x360",
  "240p": "426x240",
};

export async function loadConfig(configPath: string) {
  try {
    const file = await open(path.resolve(configPath), "r");

    const ajv = new Ajv();
    const validate = ajv.compile(configSchema);
    const config: Config = JSON.parse((await file.readFile()).toString());
    if (!validate(config)) {
      // TODO: message key
      let errorsString = "";
      validate.errors?.forEach((error) => {
        errorsString += `${error.propertyName} ${error.message}\n`;
      });
      throw new InvalidConfigError(
        "The provided config is invalid\n" + errorsString
      );
    }
    await file.close();
    return config;
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      throw new FileNotFoundError(
        "Couldn't find file at " + path.resolve(configPath)
      );
    }
    throw e;
  }
}

export function extendOptions(config: Config, options: Options): Config {
  return { ...config, ...options };
}

export function configParseNumbers(config: Options) {
  const clone = { ...config };

  if (clone.minLength) clone.minLength = Number(clone.minLength);
  if (clone.maxLength) clone.maxLength = Number(clone.maxLength);
  if (clone.targetVideoLength)
    clone.targetVideoLength = Number(clone.targetVideoLength);
  return clone;
}
