// const json = await (await fetch("https://publish.twitter.com/oembed?url=https%3A%2F%2Ftwitter.com%2FCharlesPattson%2Fstatus%2F1697322795510759929&partner=&hide_thread=false")).json();

// https://cdn.syndication.twimg.com/tweet-result?features=tfw_timeline_list:;tfw_follower_count_sunset:true;tfw_tweet_edit_backend:on;tfw_refsrc_session:on;tfw_fosnr_soft_interventions_enabled:on;tfw_mixed_media_15897:treatment;tfw_experiments_cookie_expiration:1209600;tfw_show_birdwatch_pivots_enabled:on;tfw_duplicate_scribes_to_settings:on;tfw_use_profile_image_shape_enabled:on;tfw_video_hls_dynamic_manifests_15082:true_bitrate;tfw_legacy_timeline_sunset:true;tfw_tweet_edit_frontend:on&id=1697322795510759929&lang=en&token=444aooo9l2p&t8n1my=1aelk268vkd6&jn4oy2=8u9sk80svd23&wyo0fg=az18l82li41u&jtfsbw=ml8o7k16vky&it05xq=usii8m1tw0cd&35hnfy=80jor8y168vl&pplbo6=3qx25o8mtbgy&n8mica=p5a08ccc6lj

const json = await(await fetch("https://cdn.syndication.twimg.com/tweet-result?id=1697322795510759929&lang=en&token=5")).json();



/*

=1aelk268vkd6&jn4oy2=8u9sk80svd23&wyo0fg=az18l82li41u&jtfsbw=ml8o7k16vky&it05xq=usii8m1tw0cd&35hnfy=80jor8y168vl&pplbo6=3qx25o8mtbgy&n8mica=p5a08ccc6lj



*/
console.log({
  json
})