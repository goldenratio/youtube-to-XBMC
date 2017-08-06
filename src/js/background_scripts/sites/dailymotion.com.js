;(function(player)
{

    class DailyMotion extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("DailyMotion");

            this.pluginURL = "plugin://plugin.video.dailymotion_com/?url=%s&mode=playVideo";

            contextMenu.addSite("dailymotion.com", this, ["*://www.dailymotion.com/video/*"]);
            browserAction.addSite("dailymotion.com", this, [
                ".*dailymotion.com/video/.*"
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
                let mediaUrl = sprintf(this.pluginURL, videoId);
                resolve(mediaUrl);
            });
        }

    }

    new DailyMotion(player)
})(player);