export async function getMediaURL(url: string) {
  const inputURL = new URL(url);
  if (inputURL.hostname !== "twitter.com") {
    throw new Error("Not a twitter url")
  }

  const parsedURL = new URL(inputURL.pathname, globalThis.location.origin);
  parsedURL.pathname = "/api/twitter" + inputURL.pathname;
  parsedURL.search = inputURL.search;
  console.log(parsedURL.href)

  const response = await fetch(inputURL, {
    headers: {
      "User-Agent": "TelegramBot (like TwitterBot)",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch tweet: ${response.status}`)
  }

  const html = await response.text();

  const { parseFromString: parse } = new DOMParser();
  const $ = parse(html, "text/html").querySelector;

  const getMetaContent = (name: string) => {
    const value =
      $(`meta[name="twitter:${name}"]`)?.getAttribute("content") ||
      $(`meta[property="og:${name}"]`)?.getAttribute("content")
    return value
  }

  const video = getMetaContent("video");
  const image = getMetaContent("image");
  const media = video || image;

  const type = video ? "video" : "image";

  return { type, url: media };
}