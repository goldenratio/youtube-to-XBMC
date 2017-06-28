;(function()
{

    class Err
    {
        constructor()
        {
            console.log("err.ee");
            this.pluginURL = "plugin://plugin.video.vimeo/play/?video_id=";
            contextMenu.addFilters("err.ee", this, ["*://*.err.ee/v/*/*-*-*-*-*/*"]);
        }

        onPlayClick(url)
        {
            console.log("play click " + url);

            //const fileUrl = this._getFileFromUrl(url);
            //player.playVideo(fileUrl);
        }

        onQueueClick(url)
        {
            console.log("onQueueClick " + url);

            //const fileUrl = this._getFileFromUrl(url);
            //player.queueVideo(fileUrl);

        }

        _getFileFromUrl(url)
        {
            return null;
        }
    }

    new Err()
})();