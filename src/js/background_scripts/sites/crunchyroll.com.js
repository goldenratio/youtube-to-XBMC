;(function(player)
{

    class CrunchyRoll extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("CrunchyRoll");

            this.pluginURL = "plugin://plugin.video.crunchyroll-takeout/?mode=videoplay&id=%s&url=%s&name=%s&season=0&icon=None&duration=0";

            contextMenu.addSite("crunchyroll.com", this, ["*://www.crunchyroll.com/*-*"]);
            browserAction.addSite("crunchyroll.com", this, [
                ".*crunchyroll.com/.*-\\d+"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                let mediaId = url.split("-").pop();
                if(!mediaId) {
                    reject();
                    return;
                }
                let mediaName = url.split("/").pop() || "Video";
                let mediaUrl = sprintf(this.pluginURL, mediaId, url, mediaName);
                resolve(mediaUrl);
            });
        }

    }

    new CrunchyRoll(player)
})(player);