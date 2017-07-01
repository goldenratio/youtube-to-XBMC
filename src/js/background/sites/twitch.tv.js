;(function()
{

    class TwitchTV extends AbstractSite
    {
        constructor()
        {
            super();
            console.log("twitch.tv");

            /*
                https://github.com/MrSprigster/Twitch-on-Kodi/issues/303#issuecomment-301305636
                the params for playing;
                videos are { mode: play, video_id: <video_id> }
                streams are { mode: play, name: <channel_name>, channel_id: <channel_id> }
                clips are { mode: play, slug: <clip_slug>, channel_id: <channel_id> }
                optional parameter for playback are { ask: true, player: true }, ask will force asking for quality,
                and player will use Kodi Player() instead of setResolvedUrl which can be useful from certain contexts.
             */

            this._pluginUrl = "plugin://plugin.video.twitch/?mode=play&ask=false&";
            this.videoPluginUrl = this._pluginUrl + "video_id=%s";
            this.liveChannelsPluginUrl = this._pluginUrl + "name=%s&channel_id=%s";
            this.clipPluginUrl = this._pluginUrl + "slug=%s&channel_id=%s";

            contextMenu.addFilters("twitch.tv", this, ["*://*.twitch.tv/videos/*"]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                let videoId;

                const vod = url.indexOf("/videos/") >= 0;
                if(vod) {
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