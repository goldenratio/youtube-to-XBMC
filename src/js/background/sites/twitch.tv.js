;(function()
{

    class TwitchTV extends AbstractSite
    {
        constructor()
        {
            super();
            console.log("twitch.tv");
            /*
                the params for playing;
                videos are { mode: play, video_id: <video_id> }
                streams are { mode: play, name: <channel_name>, channel_id: <channel_id> }
                clips are { mode: play, slug: <clip_slug>, channel_id: <channel_id> }
                optional parameter for playback are { ask: true, player: true }, ask will force asking for quality,
                and player will use Kodi Player() instead of setResolvedUrl which can be useful from certain contexts.
             */

            this.videoPluginUrl = "plugin://plugin.video.twitch/?mode=play&ask=false&video_id=%s";
            this.liveChannelsPluginUrl = "plugin://plugin.video.twitch/?mode=play&ask=false&name=%s&channel_id=%s";
            this.clipPluginUrl = "plugin://plugin.video.twitch/?mode=play&ask=false&slug=%s&channel_id=%s";

            contextMenu.addFilters("twitch.tv", this, ["*://*.twitch.tv/videos/*"]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                let videoId;

                if(url.indexOf("/videos/") >= 0) {
                    let parts = url.split("/");
                    videoId = parts[parts.length - 1];
                }
                else {
                    // live channel ??
                }

                let mediaUrl = videoId ? sprintf(this.videoPluginUrl, videoId) : null;

                //mediaUrl = "plugin://plugin.video.twitch/?mode=play&name=eulcs1&channel_id=124422593";
                //console.log("mediaUrl " + mediaUrl);

                if(mediaUrl) {
                    resolve(mediaUrl);
                }
                else {
                    reject();
                }
            });
        }

    }

    new TwitchTV()
})();