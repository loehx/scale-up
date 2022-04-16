import unsplash from "./src/vendor/unsplash.js";

describe("scale-up", function () {
  it("get images from unsplash", async function () {
    const images = await unsplash.getRandomImages(10);

    console.log("images", images);

    expect(images.length).toBe(10);
  });
});
