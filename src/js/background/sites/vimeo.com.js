;(function()
{

    class Vimeo
    {
        constructor()
        {
            console.log("Vimeo");
            this.pluginURL = "plugin://plugin.video.vimeo/?action=play_video&videoid=";
            contextMenu.addFilters("vimeo.com", this, ["*://vimeo.com/*"]);
        }

        onPlayClick(url)
        {
            console.log("play click " + url);
        }

        onQueueClick(url)
        {
            console.log("onQueueClick " + url);
        }
    }

    new Vimeo()
})();