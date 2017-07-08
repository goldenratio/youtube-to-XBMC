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
                "*://*/*.ogv*",
                "*://*/*.mp3*"
            ]);

            browserAction.addSite("default", this, [
                ".*\\.mp4.*",
                ".*\\.mov.*",
                ".*\\.webm.*",
                ".*\\.ogg.*",
                ".*\\.flv.*",
                ".*\\.avi.*",
                ".*\\.mpeg.*",
                ".*\\.m4a.*",
                ".*\\.ogv.*",
                ".*\\.mp3.*"
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