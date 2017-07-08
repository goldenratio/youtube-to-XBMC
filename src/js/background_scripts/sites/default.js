;(function(player)
{

    class DefaultSite extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("DefaultSite");

            contextMenu.addSite("default", this, [
                "*://*/*.mp4*",
                "*://*/*.mov*",
                "*://*/*.webm*",
                "*://*/*.ogg*",
                "*://*/*.3gp*",
                "*://*/*.flv*",
                "*://*/*.avi*",
                "*://*/*.mpeg*",
                "*://*/*.m4a*",
                "*://*/*.ogv*"
            ]);

            browserAction.addSite("youtube.com", this, [
                ".*.mp4.*",
                ".*.mov.*",
                ".*.webm.*",
                ".*.ogg.*",
                ".*.flv.*",
                ".*.avi.*",
                ".*.mpeg.*",
                ".*.m4a.*",
                ".*.ogv.*"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {
                resolve(url);
            });
        }

    }

    new DefaultSite(player)
})(player);