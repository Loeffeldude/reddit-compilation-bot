import axios from "axios";
import Ffmpeg, { FfmpegCommand } from "fluent-ffmpeg";
import fsPromise from "fs/promises";
import Snoowrap, { Submission } from "snoowrap";
import * as util from "./util/util";
import {
  areVideosLeft,
  downloadVideos,
  getVideoLinks,
} from "./video-downloader";
describe("areVideosLeft", () => {
  it("should return true if there are videos left", () => {
    const subreddits = ["gaming", "gamingcirclejerk"];
    const topPosts: Record<string, any[]> = {
      gaming: [
        {
          media: {
            reddit_video: {
              fallback_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              duration: 10,
            },
          },
        },
      ],
      gamingcirclejerk: [
        {
          media: {
            reddit_video: {
              fallback_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
              duration: 10,
            },
          },
        },
      ],
    };
    const result = areVideosLeft(subreddits, topPosts);
    expect(result).toBe(true);
  });
  it("should return false if there are no videos left", () => {
    const subreddits = ["gaming", "gamingcirclejerk"];
    const topPosts: Record<string, Submission[]> = {
      gaming: [],
      gamingcirclejerk: [],
    };
    const result = areVideosLeft(subreddits, topPosts);
    expect(result).toBe(false);
  });
});
describe("getVideoLinks", () => {
  const gamingPosts = [
    {
      media: {
        reddit_video: {
          fallback_url:
            "https://v.redd.it/gaming1/DASH_480.mp4?source=fallback",
          duration: 10,
        },
      },
      is_reddit_media_domain: true,
      is_video: true,
    },
    {
      media: {
        reddit_video: {
          fallback_url:
            "https://v.redd.it/gaming2/DASH_480.mp4?source=fallback",
          duration: 10,
        },
      },
      is_reddit_media_domain: true,
      is_video: true,
    },
  ];
  const gamingcirclejerkPosts = [
    {
      media: {
        reddit_video: {
          fallback_url:
            "https://v.redd.it/gamingcirclejerk1/DASH_480.mp4?source=fallback",
          duration: 10,
        },
      },
      is_reddit_media_domain: true,
      is_video: true,
    },
    {
      media: {
        reddit_video: {
          fallback_url:
            "https://v.redd.it/gamingcirclejerk2/DASH_480.mp4?source=fallback",
          duration: 10,
        },
      },
      is_reddit_media_domain: true,
      is_video: true,
    },
  ];

  // mock the snoowrap client
  const client = {
    getSubreddit: jest.fn((subreddit: string) => ({
      getTop: jest.fn(() => {
        switch (subreddit) {
          case "gaming":
            return gamingPosts;
          case "gamingcirclejerk":
            return gamingcirclejerkPosts;
          default:
            return [];
        }
      }),
    })),
  };
  beforeAll(() => {
    jest.spyOn(util, "randomIndex").mockReturnValue(0);
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  it("should return all links because of order of random index", async () => {
    const subreddits = ["gaming", "gamingcirclejerk"];
    const targetVideoLength = 20;
    const maxLength = 20;
    const minLength = 5;
    const hideUsed = false;

    const result = await getVideoLinks(
      subreddits,
      targetVideoLength,
      maxLength,
      minLength,
      hideUsed,
      client as unknown as Snoowrap
    );
    expect(util.randomIndex(2)).toBe(0);
    expect(result).toEqual([
      "https://v.redd.it/gaming1/DASH_480.mp4?source=fallback",
      "https://v.redd.it/gaming2/DASH_480.mp4?source=fallback",
    ]);
  });
  it("should only return links for duration of video", async () => {
    const subreddits = ["gaming", "gamingcirclejerk", "gamingtime"];
    const targetVideoLength = 10;
    const maxLength = 20;
    const minLength = 5;
    const hideUsed = false;

    const result = await getVideoLinks(
      subreddits,
      targetVideoLength,
      maxLength,
      minLength,
      hideUsed,
      client as unknown as Snoowrap
    );
    expect(util.randomIndex(2)).toBe(0);
    expect(result).toEqual([
      "https://v.redd.it/gaming1/DASH_480.mp4?source=fallback",
    ]);
  });
  it("should include no links because none fit length requirement", async () => {
    const subreddits = ["gaming", "gamingcirclejerk", "gamingtime"];
    const targetVideoLength = 20;
    const maxLength = 2;
    const minLength = 0;
    const hideUsed = false;

    const result = await getVideoLinks(
      subreddits,
      targetVideoLength,
      maxLength,
      minLength,
      hideUsed,
      client as unknown as Snoowrap
    );
    expect(result).toEqual([]);
  });
  it("should remove subreddit and move on to next one if no more videos", async () => {
    const subreddits = ["gaming", "gamingcirclejerk"];
    const targetVideoLength = 30;
    const maxLength = 30;
    const minLength = 5;
    const hideUsed = false;

    const result = await getVideoLinks(
      subreddits,
      targetVideoLength,
      maxLength,
      minLength,
      hideUsed,
      client as unknown as Snoowrap
    );
    expect(util.randomIndex(2)).toBe(0);
    expect(result).toEqual([
      "https://v.redd.it/gaming1/DASH_480.mp4?source=fallback",
      "https://v.redd.it/gaming2/DASH_480.mp4?source=fallback",
      "https://v.redd.it/gamingcirclejerk1/DASH_480.mp4?source=fallback",
    ]);
  });
});
describe("downloadVideos", () => {
  beforeEach(() => {
    jest.mock("./util/util");
    jest.mock("fs/promises");
    jest
      .spyOn(util, "runPromisifiedFfmpeg")
      .mockImplementation(() => Promise.resolve());
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should download videos and audio and merge them", async () => {
    const urls = [
      "https://v.redd.it/gaming1/DASH_480.mp4?source=fallback",
      "https://v.redd.it/gaming2/DASH_480.mp4?source=fallback",
    ];
    const axiosMock = jest
      .spyOn(axios, "get")
      .mockImplementation(async (url: string) =>
        Promise.resolve({ data: Buffer.from("") })
      );
    fsPromise.writeFile = jest.fn(() => Promise.resolve());
    fsPromise.rm = jest.fn(() => Promise.resolve());
    fsPromise.rename = jest.fn(() => Promise.resolve());

    const result = await downloadVideos(urls);

    expect(axiosMock).toBeCalled();
    expect(result).toEqual(["./tmp/gaming1.mp4", "./tmp/gaming2.mp4"]);
  });
  it("should download only video because audio gets rejected and merge them", async () => {
    const urls = [
      "https://v.redd.it/gaming1/DASH_480.mp4?source=fallback",
      "https://v.redd.it/gaming2/DASH_480.mp4?source=fallback",
    ];
    const axiosMock = jest
      .spyOn(axios, "get")
      .mockImplementation(async (url: string) => {
        if (!url.includes("audio"))
          return Promise.resolve({ data: Buffer.from("") });
        return Promise.reject();
      });

    fsPromise.writeFile = jest.fn(() => Promise.resolve());
    fsPromise.rm = jest.fn(() => Promise.resolve());
    fsPromise.rename = jest.fn(() => Promise.resolve());

    const runFfmpegMock = jest
      .spyOn(util, "runPromisifiedFfmpeg")
      .mockImplementation(() => Promise.resolve());

    const result = await downloadVideos(urls);

    expect(runFfmpegMock).not.toBeCalled();
    expect(axiosMock).toBeCalled();
    expect(result).toEqual(["./tmp/gaming1.mp4", "./tmp/gaming2.mp4"]);
  });
});
