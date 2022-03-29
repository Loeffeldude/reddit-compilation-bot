import axios from "axios";
import Ffmpeg from "fluent-ffmpeg";
import { rename, rm, writeFile, mkdir } from "fs/promises";
import path from "path";
import Snoowrap, { Submission } from "snoowrap";
import { Readable } from "stream";
import { VideoNotFoundError } from "./util/errors";
import { logger } from "./util/logger";
import {
  getAudioUrl,
  getVideoNameFromUrl,
  randomIndex,
  runPromisifiedFfmpeg,
} from "./util/util";

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
  return (await client.getSubreddit(subreddit).getTop()).filter(
    (post) => post.is_video && post.is_reddit_media_domain
  );
}

export async function downloadVideos(urls: string[], tmpPath: string) {
  const promises: Promise<string>[] = [];

  await mkdir(tmpPath, { recursive: true });

  for (const url of urls) {
    const promise = Promise.allSettled([
      axios.get<Buffer>(url, { responseType: "arraybuffer" }),
      axios.get<Buffer>(getAudioUrl(url), { responseType: "arraybuffer" }),
    ]).then(async ([video, audio]) => {
      if (video.status == "rejected") {
        throw new VideoNotFoundError(`The video at ${url} was not found`);
      }
      const fileName = getVideoNameFromUrl(url);
      const tmpVideoPath = path.join(tmpPath, `${fileName}_tmp.mp4`);
      const tmpAudioPath = path.join(tmpPath, `${fileName}_tmp_audio.mp4`);

      const videoPath = path.join(tmpPath, `${fileName}.mp4`);

      await writeFile(tmpVideoPath, video.value.data);

      if (audio.status === "rejected") {
        await rename(tmpVideoPath, videoPath);
        return videoPath;
      }

      await writeFile(tmpAudioPath, audio.value.data);

      await runPromisifiedFfmpeg(
        Ffmpeg()
          .input(tmpVideoPath)
          .addInput(tmpAudioPath)
          .addOption("-map", "0:v")
          .addOption("-map", "1:a?")
          .addOption("-c:v", "copy")
          .addOption("-shortest")
          .output(videoPath)
      );

      await rm(tmpVideoPath);

      return videoPath;
    });
    promises.push(promise);
  }
  return Promise.all(promises);
}
