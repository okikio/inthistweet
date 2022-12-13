import { load } from "cheerio";

/** 
 * The above is the recommended way to load the ESM module, as it only
 * loads it on demand, thus when not natively supported by the runtime or
 * already polyfilled.
 */
import "urlpattern-polyfill";

function getTweetDetails(res: object) {
  // @ts-ignore
  return (res.mediaDetails as Record<string, string>[]).map(({ type, media_url_https, video_info }) => {
    const vid_info = video_info as unknown as { variants: Array<{ bitrate?: number; url: string }> };
    if (type == "video") {
      const variants = vid_info.variants
        .filter(x => typeof x.bitrate == "number")
        .sort((a, b) => (b.bitrate as number) - (a.bitrate as number));

      return { type, url: variants[0].url };
    }

    return { type, url: media_url_https };
  })
}

function getCardDetails(res: object) {
  // @ts-ignore
  const card_binding_values = res.card.binding_values;
  const thumbnail_image_original = card_binding_values?.thumbnail_image_original?.image_value.url;
  if (!("thumbnail_image_original" in card_binding_values)) return [];

  return { type: "photo", url: thumbnail_image_original };
}

export async function getMediaURL(url: string) {
  const parsedURL = new URL(url);
  if (parsedURL.hostname !== "twitter.com") {
    throw new Error("Not a twitter url")
  }

  parsedURL.hostname = "vxtwitter.com";

  const urlpattern = new URLPattern('http{s}?://vxtwitter.com/:user/status/:id{/}??*');
  const exec = urlpattern.exec(parsedURL.href);

  if (exec) {
    const id = exec.pathname.groups.id;
    const res = await (await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=en`)).json();
    console.log(res)

    let obj = res;
    let arr: ReturnType<typeof getTweetDetails> = [];
    if ("mediaDetails" in obj) {
      arr = [...arr].concat(getTweetDetails(obj));
    }

    if ("card" in obj) {
      arr = [...arr].concat(getCardDetails(obj));
    }

    while ("quoted_tweet" in obj) {
      obj = obj.quoted_tweet;

      if ("mediaDetails" in obj) {
        arr = [...arr].concat( getTweetDetails(obj) );
      }

      if ("card" in obj) {
        arr = [...arr].concat(getCardDetails(obj));
      }
    }

    return arr;
  } else {

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

    const type = video ? "video" : "photo";
    if (typeof media !== "string") throw new Error("No media in tweet")

    return [{ type, url: media }];
  }
}