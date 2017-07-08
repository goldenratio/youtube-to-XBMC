;(function(player)
{

    class Err extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("err.ee");
            this.contentApiUrl = "https://etv.err.ee/api/loader/GetTimeLineContent/%s";
            this.liveStreams = {
                "etv": "http://etvstream.err.ee/live/smil:etv/playlist.m3u8",
                "etv2": "http://etv2stream.err.ee/live/smil:etv2/playlist.m3u8",
                "etvpluss": "http://striimid.err.ee/live/smil:etvpluss/playlist.m3u8"
            };

            // alias
            this.liveStreams["etv+"] = this.liveStreams["etvpluss"];

            contextMenu.addSite("err.ee", this, ["*://*.err.ee/v/*/*-*-*-*-*/*"]);
            browserAction.addSite("err.ee", this, [
                ".*err.ee/v/.*/.*-.*-.*-.*-.*/.*",
                ".*otse.err.ee/.*"
            ]);
        }

        _getVideoIdFromUrl(url)
        {
            let parts = url.split("/");
            let lastChar = parts[parts.length - 1];
            if(!lastChar) {
                parts.pop();
            }
            let hasVOD = url.indexOf("/v/") >= 0;
            let starIndex = hasVOD ? parts.length - 2 : parts.length - 1;
            for (let i = starIndex; i >= 0; i--) {
                let text = parts[i];
                if(text) {
                    return text;
                }
            }
            return "";
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                let videoId = this._getVideoIdFromUrl(url);
                console.log("videoId " + videoId);

                const isLive = url.indexOf("otse.err.ee") >= 0;
                if(isLive) {
                    console.log("live video");
                    let mediaUrl = this.liveStreams[videoId];
                    if(mediaUrl) {
                        resolve(mediaUrl);
                        return;
                    }
                }

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

    new Err(player)
})(player);