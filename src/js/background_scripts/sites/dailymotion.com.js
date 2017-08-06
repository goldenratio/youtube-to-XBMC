;(function(player)
{

    class DailyMotion extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("DailyMotion");

            this.pluginVodUrl = "plugin://plugin.video.dailymotion_com/?url=%s&mode=playVideo";
            this.pluginLiveUrl = "plugin://plugin.video.dailymotion_com/?url=%s&mode=playLiveVideo";

            contextMenu.addSite("dailymotion.com", this, [
                "*://www.dailymotion.com/video/*",
                "*://www.dailymotion.com/live/*"
            ]);

            browserAction.addSite("dailymotion.com", this, [
                ".*dailymotion.com/video/.*",
                ".*dailymotion.com/live/.*"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                let videoId = url.split("/").pop();
                if(!videoId) {
                    reject();
                    return;
                }
                const isLive = url.indexOf("/live/") >= 0;
                const pluginUrl = isLive ? this.pluginLiveUrl : this.pluginVodUrl;
                let mediaUrl = sprintf(pluginUrl, videoId);
                resolve(mediaUrl);
            });
        }

    }

    new DailyMotion(player)
})(player);