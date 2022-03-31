import path from "path";
import { open } from "fs/promises";
import { FileNotFoundError, InvalidConfigError } from "./util/errors";
import { JSONSchemaType } from "ajv";
import Ajv from "ajv";
import { defaultOptions } from "./util/constants";
import { mergeWith } from "lodash";
import { NonUndefined } from "./types";

// It being a class insures keys are always given
export class Config {
  ffmpegPath!: string;
  output!: string;
  subreddits?: string[];
  categories?: Record<string, string[]>;
  category?: string;
  minLength!: number;
  maxLength!: number;
  targetVideoLength!: number;
  resolution!: string;
  hideUsed!: boolean;
  includeHidden!: boolean;
  tempDir!: string;
  redditClientId!: string;
  redditClientSecret!: string;
  redditUsername!: string;
  redditPassword!: string;
  logging!: boolean;
  debug!: boolean;
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
    logging: { type: "boolean" },
    debug: { type: "boolean" },
  },
  required: [],
  additionalProperties: false,
};

export type Options = Omit<Config, "categories"> & { input?: string };

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

export function validateOptions(options: Options) {
  const undefinedKeys = ["categories", "category", "subreddits"];
  const missingKeys: string[] = [];

  for (const key of Object.keys(configSchema.properties)) {
    if (
      !(key in options) ||
      (options as Record<string, unknown>)[key] === undefined
    ) {
      if (undefinedKeys.includes(key)) {
        continue;
      }
      missingKeys.push(key);
    }
  }
  return { valid: missingKeys.length === 0, missingKeys };
}

export function extendOptions(options: Options, config?: Config): Config {
  return mergeWith(
    options,
    config,
    defaultOptions,
    (value: unknown, src: unknown) => {
      if (value === undefined) {
        return src;
      }
      return value;
    }
  ) as Config;
}

export function configParseNumbers(config: Options) {
  const clone = { ...config };

  if (clone.minLength) clone.minLength = Number(clone.minLength);
  if (clone.maxLength) clone.maxLength = Number(clone.maxLength);
  if (clone.targetVideoLength)
    clone.targetVideoLength = Number(clone.targetVideoLength);
  return clone;
}
