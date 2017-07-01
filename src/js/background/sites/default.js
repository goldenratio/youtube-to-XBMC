;(function()
{

    class DefaultSite extends AbstractSite
    {
        constructor()
        {
            super();
            console.log("DefaultSite");

            this.hello = "test";
            contextMenu.addFilters("default", this, ["http://*/*.mp4", "https://*/*.mp4"]);
        }

        getFileFromUrl(url)
        {
            console.log("brr " + url);
            return new Promise((resolve, reject) => {
                resolve(url);
            });
        }

    }

    new DefaultSite()
})();