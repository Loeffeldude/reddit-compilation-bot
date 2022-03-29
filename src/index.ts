import { Command } from "commander";
import { handleError, makeRedditCompilation } from "./compilation-maker";
import { configParseNumbers, Options } from "./options/config";

const program = new Command();
program
  .requiredOption("-o,--output <path>", "required: path to store video")
  .option("-i,--input <path>", "path to config file")
  .option("-ffmpeg-path <path>", "path to ffmpeg executable")
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
  .option("--verbose", "verbose logging", true)
  .action((options: Options) => {
    try {
      makeRedditCompilation(configParseNumbers(options));
    } catch (e) {
      if (e instanceof Error) handleError(e);
      else program.error("An error occured \n" + JSON.stringify(e));
    }
  });

program.parse();

export { makeRedditCompilation } from "./compilation-maker";
