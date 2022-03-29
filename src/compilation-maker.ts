import { program } from "commander";
import { setFfmpegPath } from "fluent-ffmpeg";
import { rm } from "fs/promises";
import Snoowrap from "snoowrap";
import { saveMergedVideo } from "./cutter";
import { loadConfig, extendOptions } from "./options/config";
import { Config, Options } from "./options/config";
import {
  InvalidOptionsError,
  FileNotFoundError,
  InvalidConfigError,
  FfmpegError,
} from "./util/errors";
import { logger } from "./util/logger";
import { getVideoLinks, downloadVideos } from "./video-downloader";

export async function makeRedditCompilation(inputOptions: Options) {
  let options: Config & Options = inputOptions;

  if (options.input) {
    const inputConfig = await loadConfig(options.input);
    options = extendOptions(inputConfig, inputOptions);
  }

  logger.logging = !!options.verbose;
  logger.info("Starting compilation");

  if (options.ffmpegPath) {
    logger.debug("Setting ffmpeg path to " + options.ffmpegPath);
    setFfmpegPath(options.ffmpegPath);
  }

  logger.debug(JSON.stringify(options, null, 2));

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

  logger.debug("Getting Video links from subbreddits:");
  logger.debug(JSON.stringify(subreddits, null, 2));

  const links = await getVideoLinks(
    subreddits,
    options.targetVideoLength,
    options.maxLength,
    options.minLength,
    options.hideUsed,
    redditClient
  );

  logger.debug("Got Video links:");
  logger.debug(JSON.stringify(links, null, 2));

  try {
    logger.info("Downloading videos...");
    const videoPaths = await downloadVideos(links, options.tempDir);
    logger.info("Rendering output...");
    await saveMergedVideo(videoPaths, options.output);
  } catch (e) {
    logger.error(e);
    throw e;
  } finally {
    logger.info("Cleaning up");
    await rm(options.tempDir, { recursive: true, force: true });
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
  if (error instanceof InvalidOptionsError) {
    program.error(error.message);
  }
  if (error instanceof FfmpegError) {
    program.error(`${error.message} \n${error.data}`);
  }
  program.error(error.message);
}
