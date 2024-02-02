// Based on `react-tweet` (https://github.com/vercel/react-tweet) and `download-twitter-video` (https://github.com/egoist/download-twitter-video)
import type { ImageValue, TwitterCard, UnifiedCardData } from '../types/card.ts';
import type { Tweet, MediaDetails, TweetParent, QuotedTweet, CardMediaEntity } from '../types/index.ts';
import "urlpattern-polyfill"

export const EMBED_API_URL = "https://cdn.syndication.twimg.com";


/**
 * Custom error class for handling Twitter API errors.
 */
export class TwitterApiError extends Error {
  status: number
  data: any

  constructor({
    message,
    status,
    data,
  }: {
    message: string
    status: number
    data: any
  }) {
    super(message)
    this.name = 'TwitterApiError'
    this.status = status
    this.data = data
  }
}

/**
 * Represents an item of media associated with a tweet, such as a photo or video.
 */
export interface MediaItem {
  type: string; // Type of the media item (e.g., photo, video)
  variants: MediaVariant[]; // Different variants of the media item
}

/**
 * Represents a variant of media included in a tweet, with details like URL and quality.
 * Think of a variant as a version of media, 
 * e.g. the various qualties of videos, 
 * e.g. a video variant of 360p and 720p, etc...
 */
export interface MediaVariant {
  url: string;
  quality: string; // Resolution quality (e.g., '720p', '1080p')
  aspectRatio: string; // Aspect ratio, important for display purposes
  mimeType: string; // MIME type, useful for rendering decisions
  fileSizeInBytes?: number; // Optional file size information
  altText?: string; // Optional alternative text for accessibility
}

/**
 * Approximates the resolution quality of a video based on its bitrate.
 * Higher bitrates generally indicate higher video quality.
 * @param bitrate - The bitrate of the video in bits per second.
 * @returns A string representing the approximated resolution (e.g., '720p', '1080p').
 */
export function approximateResolution(bitrate: number): string {
  // Resolution is approximated based on common bitrate thresholds
  // Add more thresholds if needed to handle different resolutions
  if (bitrate > 5000000) return '1080p';
  if (bitrate > 2000000) return '720p';
  if (bitrate > 1000000) return '480p';
  if (bitrate > 500000) return '360p';
  return '240p';
}

/**
 * Sorts media variants based on the type of media.
 * For photos, sorts by aspect ratio; for videos and GIFs, sorts by quality.
 * @param variants - Array of media variants to be sorted.
 * @param type - The type of media (photo, video, animated_gif).
 * @returns Sorted array of media variants.
 */
export const sortVariants = (variants: MediaVariant[], type: "photo" | "video" | "animated_gif" | (string & {})): MediaVariant[] => {
  // Sorting logic differs based on the media type
  // For example, photos might be sorted by aspect ratio for optimal display
  // Videos and GIFs are sorted by quality for best viewing experience
  switch (type) {
    case 'photo':
      // Sort by aspect ratio
      return variants.sort((a, b) => {
        const ratioA = aspectRatioToFloat(a.aspectRatio);
        const ratioB = aspectRatioToFloat(b.aspectRatio);
        return ratioB - ratioA; // Descending order
      });
    case 'video':
    case 'animated_gif':
      // Sort by quality (high to low)
      return variants.sort((a, b) => qualityToNumber(b.quality) - qualityToNumber(a.quality));
    default:
      return variants;
  }
};

// Utility functions for internal calculations
// aspectRatioToFloat and qualityToNumber help in sorting and comparing media variants
// Converts aspect ratio string to a float for comparison
export const aspectRatioToFloat = (aspectRatio: string): number => {
  const [width, height] = aspectRatio.split(':').map(Number);
  return width / height;
};

// Converts quality string to a number for comparison
export const qualityToNumber = (quality: string): number => {
  const qualityMap: { [key: string]: number } = {
    '1080p': 1080,
    '720p': 720,
    // Add more mappings as needed
    'default': 0,
  };
  return qualityMap[quality] || qualityMap['default'];
};

/**
 * Processes and extracts media variants from a given MediaDetails object.
 * This function handles different types of media (photo, video, animated_gif)
 * and extracts relevant information for each type.
 * @param media - The MediaDetails object containing media information.
 * @returns Array of extracted media variants.
 */
const extractVariants = (media: MediaDetails) => {
  // The function handles different media types distinctly
  // For photos, it extracts JPEG format data
  // For videos and GIFs, it processes each variant and sorts them
  const variants: MediaVariant[] = [];
  switch (media.type) {
    case 'photo':
      // For photos, we assume a JPEG format; adjust as needed
      variants.push({
        url: media.media_url_https,
        quality: 'original',
        aspectRatio: `${media.original_info.width}:${media.original_info.height}`,
        mimeType: 'image/jpeg',
        altText: media.ext_alt_text,
      });
      break;
    case 'video':
    case 'animated_gif':
      // For videos and animated GIFs, sort and process each variant
      media.video_info.variants
        .filter(variant => variant.content_type === 'video/mp4')
        .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))
        .forEach(variant => {
          variants.push({
            url: variant.url,
            quality: approximateResolution(variant.bitrate ?? 0),
            aspectRatio: media.video_info.aspect_ratio.join(':'),
            mimeType: variant.content_type,
            // Note: File size is not provided by the API
          });
        });
      break;
  }

  return sortVariants(variants, media.type)
};

/**
 * Extracts media items from a Twitter card object.
 * Cards are used for non-conventional features of a tweet, like carousel ads or YouTube embeds.
 * The function handles different types of cards, including default embeds and unified cards.
 * @param card - The TwitterCard object containing card information.
 * @returns Array of MediaItem objects extracted from the card.
 */
const extractCardMedia = (card: TwitterCard) => {
  // The function parses and extracts media from different card types
  // It handles unified cards that contain a carousel of items
  // Each media item is processed and added to the result
  const additionalItems: MediaItem[] = [];
  const cards = card.binding_values;
  for (const key in cards) {
    const value = cards?.[key];
    if (value && value?.image_value) {
      const image: ImageValue = value.image_value;
      const index = additionalItems.length;
      if (additionalItems.length <= 0) {
        additionalItems.push({ type: "photo", variants: [] })
      }

      additionalItems?.[index]?.variants.push({
        url: image.url,
        quality: 'original', // Twitter cards do not provide different qualities
        aspectRatio: `${image.width}:${image.height}`,
        mimeType: 'image/jpeg', // Assuming JPEG; adjust as needed
        // altText and fileSizeInBytes are not provided in the card
      });
    }

    if (key === "unified_card" && value && value?.string_value) {
      // Attempt to parse the unified_card data from the card's binding_values
      const unifiedCard = value;
      try {
        // Parsing the stringified JSON data of the unified_card
        const unifiedCardData: UnifiedCardData = JSON.parse(unifiedCard?.string_value!);

        // Extracting media_entities from the unified_card
        // These entities provide a mapping from media IDs to media details
        const mediaEntities = unifiedCardData?.media_entities ?? {};
        const componentObjects = unifiedCardData?.component_objects ?? {};

        // Iterating over component objects to extract media references
        Array.from(Object.entries(componentObjects) ?? [])?.forEach(([, component]) => {
          if (component.type === "media" && component.data && component.data.id) {
            // Finding the media details using the media ID in the component data
            const mediaId = component.data.id;
            const media = mediaEntities[mediaId] as unknown as (MediaDetails & CardMediaEntity);
            if (media) {
              additionalItems.push({
                type: media.type,
                variants: extractVariants(media)
              })
            }
          }
        });
      } catch (error) {
        console.error("Error parsing unified card data:", error);
      }
    }
  }

  // Sorting by width and height (larger images first as a proxy for higher quality)
  return additionalItems.map(({ type, variants }): MediaItem => {
    return { type, variants: sortVariants(variants, type) }
  });
};

/**
* Extracts and formats media details from a tweet object.
* This includes media from the main tweet, quoted tweets, parent tweets, and associated cards.
* @param tweet - The tweet object to extract media from.
* @returns An array of formatted MediaItem objects.
*/
export function extractAndFormatMedia(tweet: Tweet | TweetParent | QuotedTweet): MediaItem[] {
  // This function is a comprehensive handler for all media in a tweet
  // It ensures all media types (including from cards) are processed
  let mediaItems: MediaItem[] = [];

  // Process each media in the tweet
  // Extract media from the tweet, including quoted and parent tweets
  tweet?.mediaDetails?.forEach(media => {
    mediaItems.push({ 
      type: media.type, 
      variants: extractVariants(media) 
    });
  });

  // Just-in case there's an edge case when 
  const quoted_tweet = tweet?.quoted_tweet;
  const parent_tweet = tweet?.parent;
  quoted_tweet?.mediaDetails?.forEach(media => {
    mediaItems.push({
      type: media.type,
      variants: extractVariants(media)
    });
  });

  parent_tweet?.mediaDetails?.forEach(media => {
    mediaItems.push({
      type: media.type,
      variants: extractVariants(media)
    });
  });

  // Extract media from Twitter card if available
  if (tweet.card) {
    const cardMedia = extractCardMedia(tweet.card!);
    mediaItems = mediaItems.concat(cardMedia);
  }

  // Extract media from Twitter card if available
  if (quoted_tweet?.card) {
    const cardMedia = extractCardMedia(quoted_tweet.card!);
    mediaItems = mediaItems.concat(cardMedia);
  }

  // Extract media from Twitter card if available
  if (parent_tweet?.card) {
    const cardMedia = extractCardMedia(parent_tweet.card!);
    mediaItems = mediaItems.concat(cardMedia);
  }

  return mediaItems;
}

/**
 * Fetches tweet embed data from the provided URL.
 * Validates the URL and retrieves data using the Twitter syndication API.
 * @param url - The URL of the tweet to fetch embed data for.
 * @returns The embed data for the tweet, if available.
 */
export async function fetchEmbeddedTweet(url: string) {
  // This function interacts with the Twitter API to fetch embed data
  // It includes validations and error handling specific to Twitter's API
  const parsedURL = new URL(url);
  if (!/(ads-twitter\.com|periscope\.tv|pscp\.tv|t\.co|tweetdeck\.com|twimg\.com|twitpic\.com|twitter\.co|twitter\.com|twitterinc\.com|twitteroauth\.com|twitterstat\.us|twttr\.com|x\.com|fixupx\.com|fxtwitter\.com)/.test(parsedURL.hostname)) {
    throw new Error(`Invalid URL. "${url}" is not a twitter url`)
  }

  // Support all the various Twitter URLs 
  parsedURL.hostname = "twitter.com";

  const urlpattern = new URLPattern('http{s}?://twitter.com/:user/status/:id{/}??*');
  const exec = urlpattern.exec(parsedURL.href);

  if (exec) {
    const id = exec.pathname.groups.id;
    const url = new URL(`${EMBED_API_URL}/tweet-result`)

    url.searchParams.set('id', id!)
    url.searchParams.set('lang', 'en')
    url.searchParams.set('token', '5')
    url.searchParams.set(
      'features',
      [
        'tfw_timeline_list:',
        'tfw_follower_count_sunset:true',
        'tfw_tweet_edit_backend:on',
        'tfw_refsrc_session:on',
        'tfw_show_business_verified_badge:on',
        'tfw_duplicate_scribes_to_settings:on',
        'tfw_show_blue_verified_badge:on',
        'tfw_legacy_timeline_sunset:true',
        'tfw_show_gov_verified_badge:on',
        'tfw_show_business_affiliate_badge:on',
        'tfw_tweet_edit_frontend:on',
      ].join(';')
    )

    const res = await fetch(url);
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : undefined

    if (res.ok) return data
    if (res.status === 404) return

    throw new TwitterApiError({
      message: typeof data.error === 'string' ? data.error : 'Bad request.',
      status: res.status,
      data,
    })
  }
}