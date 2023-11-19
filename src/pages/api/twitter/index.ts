import type { APIContext } from "astro";
import type { Tweet } from "../../../types/index";
import { extractAndFormatMedia, fetchEmbeddedTweet } from "../../../lib/get-tweet";

export async function GET({ url }: APIContext) {
  try {
    const _url = url?.searchParams?.get?.('url') ?? url?.searchParams?.get?.('q') ?? '';

    const tweet: Tweet = await fetchEmbeddedTweet(_url);
    const media = extractAndFormatMedia(tweet);

    return new Response(JSON.stringify(media), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        'Cache-Control': 'public, max-age=604800'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).toString() }), {
      status: 400
    })
  }
}