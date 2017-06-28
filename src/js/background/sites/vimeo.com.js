;(function()
{

    class Vimeo
    {
        constructor()
        {
            console.log("Vimeo");
            this.pluginURL = "plugin://plugin.video.vimeo/play/?video_id=";
            contextMenu.addFilters("vimeo.com", this, ["*://vimeo.com/*"]);
        }

        onPlayClick(url)
        {
            console.log("play click " + url);

            const fileUrl = this._getFileFromUrl(url);
            player.playVideo(fileUrl);
        }

        onQueueClick(url)
        {
            console.log("onQueueClick " + url);

            const fileUrl = this._getFileFromUrl(url);
            player.queueVideo(fileUrl);

        }

        _getFileFromUrl(url)
        {
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

            const fileUrl = videoId ? this.pluginURL + videoId : null;
            return fileUrl;
        }
    }

    new Vimeo()
})();