import unsplash from "unsplash-js";

export const getRandomImages = async (count) => {
  const result = await unsplash.photos.getRandom({
    count: count || 10,
  });

  if (result.type !== "success") {
    console.error("unsplash failed", result);
  }

  return result;
};
