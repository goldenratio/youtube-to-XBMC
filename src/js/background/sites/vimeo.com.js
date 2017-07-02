;(function()
{

    class Vimeo extends AbstractSite
    {
        constructor()
        {
            super();
            console.log("Vimeo");
            this.pluginURL = "plugin://plugin.video.vimeo/play/?video_id=%s";
            contextMenu.addSite("vimeo.com", this, ["*://vimeo.com/*"]);
            browserAction.addSite("vimeo.com", this, ["^.*vimeo.com[^/]*/\\d+.*$"]);
        }

        getFileFromUrl(url)
        {
            return new Promise((reslove, reject) => {

                let parts = url.split("/");
                let videoId = (parts && parts.length > 0) ? parts[parts.length - 1] : null;
                if(videoId)
                {
                    videoId = videoId.split("?")[0];
                    let firstDigit = parseInt(videoId.charAt(0));
                    if(isNaN(firstDigit))
                    {
                        videoId = null;
                    }
                }

                const fileUrl = videoId ? sprintf(this.pluginURL, videoId) : null;
                if(fileUrl) {
                    reslove(fileUrl);
                } else {
                    reject();
                }

            });
        }
    }

    new Vimeo()
})();