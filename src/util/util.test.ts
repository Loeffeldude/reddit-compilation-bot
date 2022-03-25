import { getAudioUrl, getVideoNameFromUrl, randomIndex } from "./util";

test("should return right url for video", () => {
  expect(
    getAudioUrl("https://v.redd.it/testtest/DASH_480.mp4?source=fallback")
  ).toBe("https://v.redd.it/testtest/DASH_audio.mp4");
});

test("should return the unique name of a video", () => {
  expect(
    getVideoNameFromUrl(
      "https://v.redd.it/testtest/DASH_480.mp4?source=fallback"
    )
  ).toBe("testtest");
});

describe("random index for a given length", () => {
  afterEach(() => {
    jest.spyOn(global.Math, "random").mockRestore();
  });

  test("should return a random index of the function", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(0.425);

    expect(randomIndex(5)).toBe(2);
  });

  test("should return the last index for the given length", () => {
    jest.spyOn(global.Math, "random").mockReturnValue(1);

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
