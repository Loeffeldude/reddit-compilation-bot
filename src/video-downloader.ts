import axios from "axios";
import Ffmpeg from "fluent-ffmpeg";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import Snoowrap, { Submission } from "snoowrap";
import { logger } from "./util/logger";
import {
  getAudioUrl,
  getVideoNameFromUrl,
  randomIndex,
  runPromisifiedFfmpeg,
} from "./util/util";
import { queue } from "async";
import { FfmpegEventCallbacks } from "./types/ffmpeg";

// TODO: Turn into generator
export async function getVideoLinks(
  subreddits: string[],
  targetVideoLength: number,
  maxLength: number,
  minLength: number,
  hideUsed: boolean,
  client: Snoowrap
) {
  let videoLength = 0;
  let leftSubreddits = [...subreddits];
  const topPosts: Record<string, Submission[]> = {};
  const links: string[] = [];
  while (videoLength < targetVideoLength) {
    const i = randomIndex(leftSubreddits.length);
    const subreddit = leftSubreddits[i];

    if (!(subreddit in topPosts)) {
      topPosts[subreddit] = await getVideoTopVideoPosts(subreddit, client);
    }

    if (!areVideosLeft(leftSubreddits, topPosts)) {
      logger.warning("Not enough videos in subreddits to meet target time");
      break;
    }

    const submission = topPosts[subreddit].shift();

    if (!submission) {
      // Remove subreddit becuase ít is empty
      leftSubreddits = leftSubreddits.filter((item) => item !== subreddit);
      continue;
    }

    const redditVideo = submission.media?.reddit_video;

    if (!redditVideo) continue;

    if (
      redditVideo.duration <= maxLength &&
      redditVideo.duration >= minLength
    ) {
      if (hideUsed) submission.hide();
      links.push(redditVideo.fallback_url);
      videoLength += redditVideo.duration;
    }
  }
  return links;
}

export function areVideosLeft(
  subreddits: string[],
  topPosts: Record<string, Submission[]>
) {
  for (const subbredit of subreddits) {
    if (!(subbredit in topPosts)) return true;
    if (topPosts[subbredit].length > 0) return true;
  }
  return false;
}

export async function getVideoTopVideoPosts(
  subreddit: string,
  client: Snoowrap
) {
  return (
    await client
      .getSubreddit(subreddit)
      .getTop({ time: "week", limit: 500, show: undefined })
  ).filter(
    (post) => post.is_video && post.is_reddit_media_domain && !post.hidden
  );
}

export async function downloadVideos(
  urls: string[],
  tmpPath: string,
  ffmpegEvents?: FfmpegEventCallbacks
) {
  const result: string[] = [];

  await mkdir(tmpPath, { recursive: true });

  const q = queue(async (url: string, callback) => {
    try {
      const downloaded = await downloadVideo(url, tmpPath, ffmpegEvents);
      if (downloaded) result.push(downloaded);
      callback();
    } catch (e: any) {
      callback(e);
    }
  }, 3);

  q.push(urls);
  await q.drain();
  return result;
}

export async function downloadVideo(
  url: string,
  tmpPath: string,
  ffmpegEvents?: FfmpegEventCallbacks
) {
  const [video, audio] = await Promise.allSettled([
    axios.get<Buffer>(url, { responseType: "arraybuffer" }),
    axios.get<Buffer>(getAudioUrl(url), { responseType: "arraybuffer" }),
  ]);

  if (video.status == "rejected") {
    logger.warning(`Video not found for url: ${url}`);
    return;
    //throw new VideoNotFoundError(`The video at ${url} was not found`);
  }
  const fileName = getVideoNameFromUrl(url);

  const tmpVideoPath = path.resolve(path.join(tmpPath, `${fileName}_tmp.mp4`));
  const tmpAudioPath = path.resolve(
    path.join(tmpPath, `${fileName}_tmp_audio.mp4`)
  );

  const videoPath = path.resolve(path.join(tmpPath, `${fileName}.mp4`));

  await writeFile(tmpVideoPath, video.value.data);
  if (audio.status === "fulfilled")
    await writeFile(tmpAudioPath, audio.value.data);

  const command = Ffmpeg().input(tmpVideoPath);

  if (audio.status === "fulfilled") {
    command.addInput(tmpAudioPath);
  } else {
    command.addInput("anullsrc=n=1").inputOption("-f", "lavfi");
  }

  command
    .addOption("-map", "0:v")
    .addOption("-map", "1:a?")
    .addOption("-c:v", "copy")
    .addOption("-shortest")
    .output(videoPath);
  await runPromisifiedFfmpeg(command, ffmpegEvents);
  // await rm(tmpVideoPath);
  // if (audio.status === "fulfilled") await rm(tmpAudioPath);
  return videoPath;
}
