import { load } from "cheerio";

export async function getMediaURL(url: string) {
  const parsedURL = new URL(url);
  if (parsedURL.hostname !== "twitter.com") {
    throw new Error("Not a twitter url")
  }

  parsedURL.hostname = "vxtwitter.com";

  const response = await fetch(parsedURL, {
    headers: {
      "User-Agent": "TelegramBot (like TwitterBot)",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch tweet: ${response.status}`)
  }

  const html = await response.text();
  const $ = load(html);

  const getMetaContent = (name: string) => {
    const value =
      $(`meta[name="twitter:${name}"]`)?.attr("content") ||
      $(`meta[property="og:${name}"]`)?.attr("content")
    return value
  }

  const video = getMetaContent("video");
  const image = getMetaContent("image");
  const media = video || image;

  const type = video ? "video" : "image";
  if (typeof media !== "string") throw new Error("No media in tweet")

  return { type, url: media };
}