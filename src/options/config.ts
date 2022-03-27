import path from "path";
import { open } from "fs/promises";
import { Config, Options } from "../types/config";
import { FileNotFoundError, InvalidConfigError } from "../util/errors";
import { validateOrReject } from "class-validator";

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
// Check if a field of config is set if it is of the correct type
export async function validate(config: Config): Promise<boolean> {
  try {
    await validateOrReject(config);
    return true;
  } catch (e) {
    return false;
  }
}

export function configParseNumbers(config: Options) {
  const clone = { ...config };

  if (clone.minLength) clone.minLength = Number(clone.minLength);
  if (clone.maxLength) clone.maxLength = Number(clone.maxLength);
  if (clone.targetVideoLength)
    clone.targetVideoLength = Number(clone.targetVideoLength);
  return clone;
}
