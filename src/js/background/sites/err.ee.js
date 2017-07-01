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

            this.liveStreams = {
                "etv": "http://etvstream.err.ee/live/smil:etv/playlist.m3u8",
                "etv2": "http://etv2stream.err.ee/live/smil:etv2/playlist.m3u8",
                "etv+": "http://striimid.err.ee/live/smil:etvpluss/playlist.m3u8"
            };

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
                urlRequest.send().then(response => {

                    const responseData = JSON.parse(response);

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

                    if(mediaUrl) {
                        resolve(mediaUrl);
                    } else {
                        // check if we can play live video
                        const scheduleTimeString = responseData.Updated;

                        let scheduledDate = new Date(scheduleTimeString);
                        let scheduledDateUTC = scheduledDate.getTime();
                        let currentTimeUTC = new Date().getTime();

                        const diff = currentTimeUTC - scheduledDateUTC;
                        console.log(diff + " milliseconds");
                        if(diff >= 0) {
                            // probably it is a live video
                            let portalName = responseData.Portal.PortalName.toLowerCase();
                            resolve(this.liveStreams[portalName]);
                        }
                        else {
                            reject({message: "Video is scheduled for " + scheduledDate.toString()});
                        }
                    }

                }).catch(() => {
                    resolve(null);
                });
            });
        }
    }

    new Err()
})();