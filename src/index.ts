import { Command } from "commander";
import { makeRedditCompilation } from "./compilation-maker";
import { configParseNumbers, Options } from "./options/config";
import { InvalidOptionsError } from "./util/errors";
import { logger } from "./util/logger";

const program = new Command();
program
  .option("-o,--output <path>", "required: path to store video")
  .option("-i,--input <path>", "required: path to config file")
  .option("-ffmpeg-path <path>", "required: path to ffmpeg executable")
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
    "required: Directory where temporary video files should be saved"
  )
  .option(
    "--minLength <length>",
    "required: minimum length of videos to include in seconds"
  )
  .option("--resolution <resolution>", "required: resolution of finally video")
  .option(
    "--targetVideoLength <length>",
    "required: target length of videos in seconds"
  )
  .option(
    "--maxLength <length>",
    "required: minimum length of videos to include in seconds"
  )
  .option(
    "-h,--hideUsed",
    "required: call reddit api to hide found videos so they won't be reused again",
    undefined
  )
  .option(
    "--includeHidden",
    "required: include hidden files in search for videos",
    undefined
  )
  .option("--verbose", "verbose logging", undefined)
  .option("--debug", "debug logging", undefined)
  .action(async (options: Options) => {
    try {
      await makeRedditCompilation(configParseNumbers(options));
    } catch (e) {
      if (e instanceof Error) handleError(e);
      else program.error("An error occured \n" + JSON.stringify(e));
    }
  });

program.parse();

export { makeRedditCompilation } from "./compilation-maker";

export function handleError(error: Error) {
  if (error instanceof InvalidOptionsError) {
    program.showHelpAfterError();
  }
  logger.error(error.message);
  process.exit(1);
}
