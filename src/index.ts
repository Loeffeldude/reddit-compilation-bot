import { Command } from "commander";
import { Config, Options } from "./types/config";
import {
  FileNotFoundError,
  InvalidConfigError,
  InvalidOptionsError,
} from "./util/errors";
import { extendOptions, loadConfig } from "./options/config";
import { downloadVideos, getVideoLinks } from "./video-downloader";
import { saveMergedVideo } from "./cutter";
import { rm } from "fs/promises";
import Snoowrap from "snoowrap";

const program = new Command();
program
  .requiredOption("-o,--output <path>", "required: path to store video")
  .option("-i,--input <path>", "path to config file")
  .option(
    "-r,--subreddits <subreddits...>",
    "subreddits to get videos from. If set will ignore categories and subreddits in config"
  )
  .option(
    "--category",
    "category of subreddits to use from config. Chooses randomly by default"
  )
  .option(
    "--tempDir",
    "Directory where temporary video files should be saved",
    "./tmp/"
  )
  .option(
    "--minLength <length>",
    "minimum length of videos to include in seconds",
    "0"
  )
  .option("--targetVideoLength <length>", "target length of videos in seconds")
  .option(
    "--maxLength <length>",
    "minimum length of videos to include in seconds",
    "30"
  )
  .option(
    "-h,--hideUsed",
    "call reddit api to hide found videos so they won't be reused again",
    false
  )
  .option("--includeHidden", "include hidden files in search for videos", false)
  .action((options: Options) => {
    try {
      makeRedditVideo(options);
    } catch (e) {
      if (e instanceof Error) handleError(e);
      else program.error("An error occured \n" + JSON.stringify(e));
    }
  });

program.parse();

export async function makeRedditVideo(inputOptions: Options) {
  let options: Config & Options = inputOptions;
  if (options.input) {
    const inputConfig = await loadConfig(options.input);
    options = extendOptions(inputConfig, inputOptions);
  }

  configParseNumbers(options);

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

function configParseNumbers(config: Options) {
  if (config.minLength) config.minLength = Number(config.minLength);
  if (config.maxLength) config.maxLength = Number(config.maxLength);
  if (config.targetVideoLength)
    config.targetVideoLength = Number(config.targetVideoLength);
}
function getSubreddits(
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

function handleError(error: Error) {
  if (error instanceof FileNotFoundError) {
    program.error(error.message);
    return;
  }
  if (error instanceof InvalidConfigError) {
    program.error(error.message);
    return;
  }
}
