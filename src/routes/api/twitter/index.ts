import type { RequestHandler } from '@builder.io/qwik-city';
import { 
  extractAndFormatMedia, 
  fetchEmbeddedTweet,
} from "~/lib/get-tweet";

export const onGet: RequestHandler = async ({ json, url }) => {
  try {
    const _url = url?.searchParams?.get?.('url') ?? url?.searchParams?.get?.('q') ?? '';
    console.log({ _url })

    const tweet = await fetchEmbeddedTweet(_url);
    const media = extractAndFormatMedia(tweet);

    json(200, media);
  } catch (e) {
    json(400, { error: (e as Error).toString() });
  }
};