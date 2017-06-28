;(function()
{

    class Vimeo
    {
        constructor()
        {
            console.log("Vimeo");
            // https://vimeo.com/222111805
            contextMenu.addFilters("vimeo.com", this, ["*://vimeo.com/*"]);
            //contextMenu.addPlaylistFilters(["*://www.youtube.com/*list=*"]);
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