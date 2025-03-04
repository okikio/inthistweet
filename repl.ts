// const json = await (await fetch("https://publish.twitter.com/oembed?url=https%3A%2F%2Ftwitter.com%2FCharlesPattson%2Fstatus%2F1697322795510759929&partner=&hide_thread=false")).json();

import { extractAndFormatMedia } from "./src/lib/get-tweet"
import type { Tweet } from "./src/types/tweet"

// https://cdn.syndication.twimg.com/tweet-result?features=tfw_timeline_list:;tfw_follower_count_sunset:true;tfw_tweet_edit_backend:on;tfw_refsrc_session:on;tfw_fosnr_soft_interventions_enabled:on;tfw_mixed_media_15897:treatment;tfw_experiments_cookie_expiration:1209600;tfw_show_birdwatch_pivots_enabled:on;tfw_duplicate_scribes_to_settings:on;tfw_use_profile_image_shape_enabled:on;tfw_video_hls_dynamic_manifests_15082:true_bitrate;tfw_legacy_timeline_sunset:true;tfw_tweet_edit_frontend:on&id=1697322795510759929&lang=en&token=444aooo9l2p&t8n1my=1aelk268vkd6&jn4oy2=8u9sk80svd23&wyo0fg=az18l82li41u&jtfsbw=ml8o7k16vky&it05xq=usii8m1tw0cd&35hnfy=80jor8y168vl&pplbo6=3qx25o8mtbgy&n8mica=p5a08ccc6lj
const url = new URL("https://cdn.syndication.twimg.com/tweet-result")

url.searchParams.set('id', "1542854313378467840")
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
// "https://cdn.syndication.twimg.com/tweet-result?id=&lang=en&token=5"
const json = await (await fetch(url)).json();


// Example usage with a tweet object
const tweetData = json ?? {}; // your tweet JSON data here
const formattedMedia = extractAndFormatMedia(tweetData as Tweet);
console.log(json, formattedMedia);


/*

=1aelk268vkd6&jn4oy2=8u9sk80svd23&wyo0fg=az18l82li41u&jtfsbw=ml8o7k16vky&it05xq=usii8m1tw0cd&35hnfy=80jor8y168vl&pplbo6=3qx25o8mtbgy&n8mica=p5a08ccc6lj



*/
// console.log({
//   json
// })

import fs from "fs/promises";

await fs.writeFile("twitter.json", JSON.stringify(json))

// import { parseManifest, traverseM3U8Manifests } from "./src/lib/m3u8/traverse";

// /**
//  * Returns the difference between two arrays (unique elements in array1 that are not present in array2).
//  *
//  * @template T - The type of the elements in the input arrays.
//  * @param {T[]} arr1 - The first input array.
//  * @param {T[]} arr2 - The second input array.
//  * @returns {T[]} - An array containing the unique elements of array1 not present in array2.
//  */
// export function diff<T>(arr1: readonly T[], arr2: readonly T[]): T[] {
//   const a = new Set(arr1);
//   const b = new Set(arr2);

//   return Array.from([...a].filter(x => !b.has(x)));
// }

// const value = new URL("https://hls-uranus.sb-cd.com/hls/1/5/15192928-,240p,480p,720p,1080p,.mp4.urlset/master.m3u8?secure=_l0PlspnXZgqfRs36nc4ig,1700342897&m=49&d=1&_tid=15192928")
// const arrbuf = await fetch(value).then(x => x.arrayBuffer());
// console.log({ href: value?.href })

// if (/.(m3u8|m3u)$/.test(value.pathname)) {
//   try {
//     const map = await traverseM3U8Manifests(arrbuf, value);
//     const decoder = new TextDecoder();
    

//     console.log({
//       size: map?.size,
//       map: Array.from(map?.entries() ?? [], ([key, value]) => [key, decoder.decode(value)]).slice(0, 4),
//       keys: Array.from(map?.keys() ?? [])
//     })
//   } catch (e) {
//     console.warn(`Cannot parse "${value?.href}" as m3u8 playlist`)
//   }
// }