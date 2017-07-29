;(function(player)
{

    class CrunchyRoll extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("CrunchyRoll");

            this.pluginURL = "plugin://plugin.video.crunchyroll-takeout/?mode=videoplay&url=%s";

            contextMenu.addSite("crunchyroll.com", this, ["*://www.crunchyroll.com/*"]);
            browserAction.addSite("crunchyroll.com", this, [
                ".*crunchyroll.com/.*-\\d+"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                let mediaUrl = sprintf(this.pluginURL, url);
                console.log("mediaUrl " + mediaUrl);
                resolve(mediaUrl);
            });
        }

    }

    new CrunchyRoll(player)
})(player);