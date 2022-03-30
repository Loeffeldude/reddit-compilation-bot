import {
  getAudioUrl,
  getVideoNameFromUrl,
  randomIndex,
  isReseloution,
} from "../../src/util/util";
describe("getAudioUrl", () => {
  test("should return right url for video", () => {
    expect(
      getAudioUrl("https://v.redd.it/testtest/DASH_480.mp4?source=fallback")
    ).toBe("https://v.redd.it/testtest/DASH_audio.mp4");
  });
});

describe("getVideoNameFromUrl", () => {
  test("should return the unique name of a video", () => {
    expect(
      getVideoNameFromUrl(
        "https://v.redd.it/testtest/DASH_480.mp4?source=fallback"
      )
    ).toBe("testtest");
  });
});

describe("rrandomIndex", () => {
  afterEach(() => {
    jest.spyOn(global.Math, "random").mockRestore();
  });

  test("should return a random index", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.425);

    expect(randomIndex(5)).toBe(2);
  });

  test("should return the last index for the given length", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.9);

    expect(randomIndex(5)).toBe(4);
  });

  test("should return the first index for the given length", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0);

    expect(randomIndex(5)).toBe(0);
  });

  test("should return zero", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0);

    expect(randomIndex(0)).toBe(-0);
  });
});
//Tests for isReseloution
describe("isReseloution", () => {
  test("should return true if string is a resolution", () => {
    expect(isReseloution("1920x1080")).toBe(true);
  });

  test("should return false if string is not a resolution", () => {
    expect(isReseloution("test")).toBe(false);
  });
});
