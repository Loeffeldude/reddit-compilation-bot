import { getSubreddits } from "../src/compilation-maker";

describe("getSubreddits", () => {
  it("should return the correct subreddits for the category", () => {
    const categories = {
      funny: ["funny", "dankmemes"],
      gaming: ["gaming", "gamingcirclejerk"],
      movies: ["movies", "movies"],
      music: ["music", "music"],
      news: ["news", "news"],
      science: ["science", "science"],
      sports: ["sports", "sports"],
      television: ["television", "television"],
      videos: ["videos", "videos"],
    };
    const category = "funny";
    const subreddits = ["gaming", "gamingcirclejerk"];
    const result = getSubreddits(categories, category, subreddits);
    expect(result).toEqual(["funny", "dankmemes"]);
  });
  it("should return the subbreddits without a category", () => {
    const categories = {
      funny: ["funny", "dankmemes"],
      gaming: ["gaming", "gamingcirclejerk"],
      movies: ["movies", "movies"],
      music: ["music", "music"],
      news: ["news", "news"],
      science: ["science", "science"],
      sports: ["sports", "sports"],
      television: ["television", "television"],
      videos: ["videos", "videos"],
    };
    const category = undefined;
    const subreddits = ["gaming", "gamingcirclejerk"];
    const result = getSubreddits(categories, category, subreddits);
    expect(result).toEqual(["gaming", "gamingcirclejerk"]);
  });
});
