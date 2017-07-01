;(function()
{

    class DefaultSite extends AbstractSite
    {
        constructor()
        {
            super();
            console.log("DefaultSite");

            contextMenu.addFilters("default", this, [
                "*://*/*.mp4",
                "*://*/*.mov",
                "*://*/*.webm",
                "*://*/*.ogg",
                "*://*/*.3gp",
                "*://*/*.flv",
                "*://*/*.avi",
                "*://*/*.mpeg",
                "*://*/*.m4a",
                "*://*/*.ogv"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {
                resolve(url);
            });
        }

    }

    new DefaultSite()
})();