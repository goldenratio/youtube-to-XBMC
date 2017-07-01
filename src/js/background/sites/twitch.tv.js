;(function()
{

    class TwitchTV extends AbstractSite
    {
        constructor()
        {
            super();
            console.log("twitch.tv");
            contextMenu.addFilters("twitch.tv", this, ["*://www.twitch.tv/videos/*"]);
        }

    }

    new TwitchTV()
})();