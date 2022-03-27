import { program } from "commander";
import { rm } from "fs/promises";
import Snoowrap from "snoowrap";
import { saveMergedVideo } from "./cutter";
import { loadConfig, extendOptions } from "./options/config";
import { Config, Options } from "./types/config";
import {
  InvalidOptionsError,
  FileNotFoundError,
  InvalidConfigError,
} from "./util/errors";
import { getVideoLinks, downloadVideos } from "./video-downloader";

export async function makeRedditCompilation(inputOptions: Options) {
  let options: Config & Options = inputOptions;
  if (options.input) {
    const inputConfig = await loadConfig(options.input);
    options = extendOptions(inputConfig, inputOptions);
  }

  const redditClient = new Snoowrap({
    userAgent: "reddit-video-maker",
    clientId: options.redditClientId,
    clientSecret: options.redditClientSecret,
    username: options.redditUsername,
    password: options.redditPassword,
  });

  const subreddits = getSubreddits(
    options.categories,
    options.category,
    options.subreddits
  );

  const links = await getVideoLinks(
    subreddits,
    options.targetVideoLength,
    options.maxLength,
    options.minLength,
    options.hideUsed,
    redditClient
  );
  try {
    const videoPaths = await downloadVideos(links);
    await saveMergedVideo(videoPaths, options.output);
  } finally {
    await rm(options.tempDir, { recursive: true });
  }
}

export function getSubreddits(
  categories?: Record<string, string[]>,
  category?: string,
  subreddits?: string[]
) {
  let result = subreddits;

  if (categories && category) {
    if (category in categories) {
      result = categories[category];
    }
  }

  if (!result) throw new InvalidOptionsError();

  return result;
}

export function handleError(error: Error) {
  if (error instanceof FileNotFoundError) {
    program.error(error.message);
  }
  if (error instanceof InvalidConfigError) {
    program.error(error.message);
  }
}
