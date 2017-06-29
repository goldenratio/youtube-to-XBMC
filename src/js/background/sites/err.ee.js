;(function()
{

    class Err extends AbstractSite
    {
        constructor()
        {
            super();
            console.log("err.ee");
            this.contentApiUrl = "https://etv.err.ee/api/loader/GetTimeLineContent/%s";
            contextMenu.addFilters("err.ee", this, ["*://*.err.ee/v/*/*-*-*-*-*/*"]);
        }

        _getVideoIdFromUrl(url)
        {
            url = url.slice(0, -1);
            let parts = url.split("/");
            return parts[parts.length - 2];
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                let videoId = this._getVideoIdFromUrl(url);
                const apiUrl = sprintf(this.contentApiUrl, videoId);

                let urlRequest = new URLRequest(apiUrl);
                urlRequest.send().then((response) => {

                    const responseData = JSON.parse(response);
                    //console.log(responseData);

                    let mediaSources = responseData.MediaSources;
                    const len = mediaSources.length;

                    let mediaUrl = null;
                    for (let i = 0; i < len; i++)
                    {
                        let media = mediaSources[i];
                        const videoUrl = media.Content;
                        if(videoUrl)
                        {
                            mediaUrl = "rtmp" + videoUrl.replace("@", "_definst_/");
                            break;
                        }
                    }

                    resolve(mediaUrl);

                }).catch(() => {

                    resolve(null);

                });
            });
        }
    }

    new Err()
})();