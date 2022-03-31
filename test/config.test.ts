// A lot of these tests are checking if the options are set correctly.
// We have to violate a lot of types for these tests
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  loadConfig,
  validateOptions,
  extendOptions,
  configParseNumbers,
  Options,
} from "../src/config";
import {
  defaultOptions,
  FileNotFoundError,
  InvalidConfigError,
} from "../src/util";
import fsPromise from "fs/promises";
import { Mode, PathLike } from "fs";

describe("loadConfig", () => {
  beforeEach(() => {
    jest.mock("fs/promises");
  });
  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });
  it("should return the config", async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    fsPromise.open = jest
      .fn()
      .mockImplementation(
        (path: PathLike, flags: string | number, mode?: Mode) => {
          return Promise.resolve({
            close: () => {
              return Promise.resolve();
            },
            readFile: () => {
              return Promise.resolve(
                Buffer.from(
                  JSON.stringify({
                    categories: {
                      funny: ["funny", "dankmemes"],
                      gaming: ["gaming", "gamingcirclejerk"],
                      movies: ["movies", "movies"],
                      music: ["music", "music"],
                      news: ["news", "news"],
                      science: ["science", "science"],
                      sports: ["sports", "sports"],
                      television: ["television", "television"],
                      videos: ["videos", "videos"],
                    },
                    category: "funny",
                    subreddits: ["gaming", "gamingcirclejerk"],
                    minLength: 5,
                    maxLength: 30,
                    targetVideoLength: 60,
                  })
                )
              );
            },
          });
        }
      );

    const config = await loadConfig("./path/to/config");
    expect(config).toEqual({
      categories: {
        funny: ["funny", "dankmemes"],
        gaming: ["gaming", "gamingcirclejerk"],
        movies: ["movies", "movies"],
        music: ["music", "music"],
        news: ["news", "news"],
        science: ["science", "science"],
        sports: ["sports", "sports"],
        television: ["television", "television"],
        videos: ["videos", "videos"],
      },
      category: "funny",
      subreddits: ["gaming", "gamingcirclejerk"],
      minLength: 5,
      maxLength: 30,
      targetVideoLength: 60,
    });
  });
  it("should throw an error if the config file doesn't exist", async () => {
    fsPromise.open = jest.fn().mockImplementation(() => {
      throw {
        code: "ENOENT",
      };
    });
    await expect(loadConfig("/fake/path")).rejects.toThrow(FileNotFoundError);
  });
  it("should throw an error if the config file doesn't have a valid schema", async () => {
    fsPromise.open = jest
      .fn()
      .mockImplementation(
        (path: PathLike, flags: string | number, mode?: Mode) => {
          return Promise.resolve({
            close: () => {
              return Promise.resolve();
            },
            readFile: () => {
              return Promise.resolve(
                Buffer.from(
                  JSON.stringify({
                    categories: {
                      funny: ["funny", "dankmemes"],
                      gaming: ["gaming", "gamingcirclejerk"],
                      movies: ["movies", "movies"],
                      music: ["music", "music"],
                      news: ["news", "news"],
                      science: ["science", "science"],
                      sports: ["sports", "sports"],
                      television: ["television", "television"],
                      videos: ["videos", "videos"],
                    },
                    category: "funny",
                    subreddits: ["gaming", "gamingcirclejerk"],
                    minLength: 5,
                    maxLength: 30,
                    targetVideoLength: 60,
                    InvalidProerty: true,
                  })
                )
              );
            },
          });
        }
      );

    await expect(async () => {
      return loadConfig("./path/to/config");
    }).rejects.toThrow(InvalidConfigError);
  });
});
// Tests for validateOptions
describe("validateOptions", () => {
  const options: Options = {
    ffmpegPath: "ffmpeg",
    output: "./output",
    resolution: "1920x1080",
    category: "funny",
    subreddits: ["gaming", "gamingcirclejerk"],
    minLength: 5,
    maxLength: 30,
    targetVideoLength: 60,
    hideUsed: true,
    includeHidden: true,
    tempDir: "./temp",
    redditClientId: "clientId",
    redditClientSecret: "clientSecret",
    redditUsername: "username",
    redditPassword: "password",
    logging: true,
    debug: true,
  };

  it("should return true if the options are valid", () => {
    expect(validateOptions(options)).toStrictEqual({
      valid: true,
      missingKeys: [],
    });
  });
  it("should return true if the options not include optional fields", () => {
    const invalidOptions = {
      ...options,
      category: undefined,
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(validateOptions(invalidOptions as Options)).toStrictEqual({
      valid: true,
      missingKeys: [],
    });
  });
  it("should return false if the options are invalid", () => {
    const invalidOptions = {
      ...options,
      output: undefined,
    };
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    expect(validateOptions(invalidOptions as Options)).toStrictEqual({
      valid: false,
      missingKeys: ["output"],
    });
  });
});
describe("extendOptions", () => {
  const resultOptions: Options = {
    ffmpegPath: "ffmpeg",
    output: "./output",
    resolution: "1920x1080",
    category: "funny",
    subreddits: ["gaming", "gamingcirclejerk"],
    minLength: 5,
    maxLength: 30,
    targetVideoLength: 60,
    hideUsed: true,
    includeHidden: true,
    tempDir: "./temp",
    redditClientId: "clientId",
    redditClientSecret: "clientSecret",
    redditUsername: "username",
    redditPassword: "password",
    logging: true,
    debug: true,
  };
  it("should return the options if the config file doesn't exist", () => {
    const result = extendOptions(resultOptions, undefined);
    expect(result).toStrictEqual(resultOptions);
  });
  it("should return the options merged with the config file", () => {
    const config = {
      ffmpegPath: "ffmpeg",
      output: "./output",
      resolution: "1920x1080",
      category: "funny",
      subreddits: ["gaming", "gamingcirclejerk"],
      minLength: 5,
      maxLength: 30,
      targetVideoLength: 60,
      hideUsed: true,
      includeHidden: true,
    };
    const options = {
      tempDir: "./temp",
      redditClientId: "clientId",
      redditClientSecret: "clientSecret",
      redditUsername: "username",
      redditPassword: "password",
      logging: true,
      debug: true,
    };
    // @ts-ignore
    const result = extendOptions(options, config);
    expect(result).toStrictEqual(resultOptions);
  });
  it("should prefer settings that are in the options", () => {
    const config = {
      ffmpegPath: "ffmpeg",
      output: "./output",
      resolution: "1920x1080",
      category: "funny",
      subreddits: ["gaming", "gamingcirclejerk"],
      minLength: 5,
      maxLength: 30,
      targetVideoLength: 60,
      // We set this to false here
      hideUsed: false,
      includeHidden: true,
    };
    const options = {
      tempDir: "./temp",
      redditClientId: "clientId",
      redditClientSecret: "clientSecret",
      redditUsername: "username",
      redditPassword: "password",
      logging: true,
      debug: true,
      // True in options should return this
      hideUsed: true,
    };
    // @ts-ignore
    const result = extendOptions(options, config);
    expect(result).toStrictEqual(resultOptions);
  });
  it("should extend standard options", () => {
    const thisResult = {
      ...defaultOptions,
      ffmpegPath: "ffmpeg",
      output: "./output",
      resolution: "1920x1080",
      category: "funny",
      subreddits: ["gaming", "gamingcirclejerk"],
      targetVideoLength: 60,
      hideUsed: true,
      includeHidden: true,
      tempDir: "./temp",
      redditClientId: "clientId",
      redditClientSecret: "clientSecret",
      redditUsername: "username",
      redditPassword: "password",
      logging: true,
      debug: true,
    };

    const config = {
      ffmpegPath: "ffmpeg",
      output: "./output",
      resolution: "1920x1080",
      category: "funny",
      subreddits: ["gaming", "gamingcirclejerk"],
      targetVideoLength: 60,
      // We set this to false here
      hideUsed: false,
      includeHidden: true,
    };
    const options = {
      tempDir: "./temp",
      redditClientId: "clientId",
      redditClientSecret: "clientSecret",
      redditUsername: "username",
      redditPassword: "password",
      logging: true,
      debug: true,
      // True in options should return this
      hideUsed: true,
    };
    // @ts-ignore
    const result = extendOptions(options, config);
    expect(result).toStrictEqual(thisResult);
  });
});
describe("configParseNumbers", () => {
  test("should parse strings in config that should be numbers to numbers", () => {
    const resultOptions: Options = {
      ffmpegPath: "ffmpeg",
      output: "./output",
      resolution: "1920x1080",
      category: "funny",
      subreddits: ["gaming", "gamingcirclejerk"],
      minLength: 5,
      maxLength: 30,
      targetVideoLength: 60,
      hideUsed: true,
      includeHidden: true,
      tempDir: "./temp",
      redditClientId: "clientId",
      redditClientSecret: "clientSecret",
      redditUsername: "username",
      redditPassword: "password",
      logging: true,
      debug: true,
    };
    const options = {
      ...resultOptions,
      minLength: "5",
      maxLength: "30",
      targetVideoLength: "60",
    };
    // @ts-ignore
    const result = configParseNumbers(options);
    expect(result).toStrictEqual(resultOptions);
  });
});
