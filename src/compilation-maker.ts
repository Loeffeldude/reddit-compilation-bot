import { Presets, SingleBar } from "cli-progress";
import { setFfmpegPath } from "fluent-ffmpeg";
import { rm } from "fs/promises";
import Snoowrap from "snoowrap";
import { normalizeVideos, saveMergedVideo } from "./cutter";
import {
  loadConfig,
  extendOptions,
  resolutions,
  configSchema,
} from "./options/config";
import { Config, Options } from "./options/config";
import { InvalidOptionsError } from "./util/errors";
import { logger } from "./util/logger";
import { isReseloution } from "./util/util";
import { getVideoLinks, downloadVideos } from "./video-downloader";

export async function makeRedditCompilation(inputOptions: Options) {
  let options: Config & Options = inputOptions;

  if (options.input) {
    const inputConfig = await loadConfig(options.input);
    options = extendOptions(inputConfig, inputOptions);
  }
  const validResult = validateOptions(options);
  if (!validResult.valid)
    throw new InvalidOptionsError(
      "Invalid options. The following options are missing:\n" +
        validResult.missingKeys.join("\n")
    );

  logger.logging = !!options.verbose;
  logger.debugLogging = !!options.debug;

  const startTime = new Date();
  logger.info("Starting compilation");

  if (options.ffmpegPath) {
    logger.debug("Setting ffmpeg path to " + options.ffmpegPath);
    setFfmpegPath(options.ffmpegPath);
  }

  logger.debug("Running with config:");
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
  logger.info("Getting Video links...");

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
    const bar = logger.logging ? new SingleBar({}, Presets.legacy) : undefined;

    logger.info("Downloading videos...");

    bar?.start(links.length, 0);
    const videoPaths = await downloadVideos(links, options.tempDir, {
      onComplete: () => bar?.increment(),
      onError: () => bar?.increment(),
    });
    bar?.stop();

    logger.info("Encoding Videos...");

    bar?.start(videoPaths.length, 0);
    const normalVideoPaths = await normalizeVideos(
      videoPaths,
      getResolution(options.resolution),
      "black",
      { onComplete: () => bar?.increment() }
    );
    bar?.stop();

    logger.info("Rendering output...");

    bar?.start(options.targetVideoLength + options.maxLength, 0);
    await saveMergedVideo(normalVideoPaths, options.output, {
      onProgress: (progress) => {
        const timestamp = progress.timemark;

        const time = timestamp.split(":").map((string) => {
          return Number(string.split(".")[0]);
        });
        const seconds = time[0] * 3600 + time[1] * 60 + time[2];

        bar?.update(seconds);
      },
    });
    bar?.update(options.targetVideoLength + options.maxLength);
    bar?.stop();

    logger.info("Done!");
    logger.info(
      "Time taken: " + (new Date().getTime() - startTime.getTime()) / 1000 + "s"
    );
  } finally {
    logger.info("Cleaning up");
    await rm(options.tempDir, { recursive: true, force: true });
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

export function getResolution(resolution: string) {
  const result =
    resolution in resolutions ? resolutions[resolution] : resolution;

  if (!isReseloution(result)) {
    throw new InvalidOptionsError("Invalid resolution");
  }
  return result;
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
