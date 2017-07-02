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
            //this.clipPluginUrl = this._pluginUrl + "slug=%s&channel_id=%s";

            contextMenu.addSite("twitch.tv", this, ["*://*.twitch.tv/videos/*"]);
            browserAction.addSite("twitch.tv", this, ["^(https|http)://(www\.)?twitch.tv/([^&/#\?]+).+$"]);
        }

        _getVideoId(url)
        {
            let parts = url.split("/");
            let lastChar = parts[parts.length - 1];
            if(!lastChar) {
                parts.pop();
            }
            return parts[parts.length - 1];
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                const vod = url.indexOf("/videos/") >= 0;
                if(vod) {

                    let videoId = this._getVideoId(url);
                    let mediaUrl = videoId ? sprintf(this.videoPluginUrl, videoId) : null;
                    if(mediaUrl) {
                        resolve(mediaUrl);
                    }
                    else {
                        reject();
                    }

                }
                else {
                    // live channel ??
                    console.log("live stream");
                    sendMessageToContentScript({message: "getContentId"})
                        .then(response => {

                            let contentId = response.contentId;
                            let videoName = this._getVideoId(url);
                            console.log("contentId " + contentId + ", videoName " + videoName);

                            let mediaUrl = videoName && contentId ? sprintf(this.liveChannelsPluginUrl, videoName, contentId) : null;
                            if(mediaUrl) {
                                resolve(mediaUrl);
                            }
                            else {
                                reject();
                            }

                        })
                        .catch(err => {
                            reject();
                        });
                }
            });
        }

    }

    new TwitchTV()
})();