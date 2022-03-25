import axios from "axios";
import Ffmpeg from "fluent-ffmpeg";
import { createWriteStream } from "fs";
import { writeFile } from "fs/promises";
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

function areVideosLeft(
  subreddits: string[],
  topPosts: Record<string, Submission[]>
) {
  for (const subbredit of subreddits) {
    if (!(subbredit in topPosts)) return true;
    if (topPosts[subbredit].length > 0) return true;
  }
  return false;
}

async function getVideoTopVideoPosts(subreddit: string, client: Snoowrap) {
  return (await client.getSubreddit(subreddit).getTop()).filter(
    (post) => post.is_video && post.is_reddit_media_domain
  );
}

export async function downloadVideos(urls: string[]) {
  const promises: Promise<string>[] = [];

  for (const url of urls) {
    const promise = Promise.allSettled([
      axios.get<Buffer>(url),
      axios.get<Buffer>(getAudioUrl(url)),
    ]).then(async ([video, audio]) => {
      if (video.status == "rejected") {
        throw new VideoNotFoundError();
      }
      const fileName = getVideoNameFromUrl(url);
      const videoPath = `./tmp/${fileName}.mp4`;

      if (audio.status === "rejected") {
        await writeFile(videoPath, video.value.data);
        return videoPath;
      }
      const outputStream = createWriteStream(videoPath);
      const videoStream = Readable.from(video.value.data.toString());
      const audioStream = Readable.from(audio.value.data.toString());
      await runPromisifiedFfmpeg(
        Ffmpeg()
          .input(videoStream)
          .input(audioStream)
          .map("0:v")
          .map("1:a")
          .addOption("-c:v", "copy", "--shortest")
          .format("mp4")
          .output(outputStream)
      );
      return videoPath;
    });
    promises.push(promise);
  }
  return Promise.all(promises);
}
