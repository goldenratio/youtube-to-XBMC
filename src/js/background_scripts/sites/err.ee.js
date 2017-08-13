;(function(player)
{

    class Err extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("err.ee");
            this.contentApiUrl = "https://etv.err.ee/api/loader/GetTimeLineContent/%s";
            this.subtitleIdApiUrl = "http://etv.err.ee/services/api/subtitles/check?file=%s";

            this.subtitleContentUrl = "http://etv.err.ee/services/subtitles/file/%s/%s_%s";
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

        _getContentUrl(videoId) {
            return new Promise((resolve, reject) => {

                const apiUrl = sprintf(this.contentApiUrl, videoId);

                let urlRequest = new URLRequest(apiUrl);
                urlRequest.send().then(response => {

                    const responseData = JSON.parse(response);
                    let mediaSources = responseData.MediaSources;

                    const len = mediaSources.length;
                    for (let i = 0; i < len; i++)
                    {
                        let media = mediaSources[i];
                        const videoUrl = media.Content;
                        if(videoUrl)
                        {
                            resolve(videoUrl);
                            return;
                        }
                    }

                    throw new Error("Content url not found");

                }).catch(err => {
                    console.error(err);
                    reject();
                });

            });
        }

        getSubtitleFiles(url) {

            return new Promise((resolve, reject) => {

                const subtitleIdApiUrl = sprintf(this.subtitleIdApiUrl, url);

                new URLRequest(subtitleIdApiUrl)
                    .send()
                    .then(content => {
                        console.log(content);

                        let subtitleUrls = [];
                        let contentJSON = JSON.parse(content);
                        let subData = contentJSON["subtitles"];

                        if(subData) {
                            let langs = ["ET", "VA", "RU"];
                            langs.forEach((lang) => {
                                if(subData[lang] && subData[lang]["id"]) {
                                    const subId = subData[lang]["id"].toString();
                                    let sUrl = sprintf(this.subtitleContentUrl, subId, subId, lang);
                                    subtitleUrls.push(sUrl);
                                }
                            });
                        }

                        if(subtitleUrls.length > 0) {
                            return subtitleUrls;
                        }

                        throw new Error("subtitles not found!");
                    })
                    .then(subUrls => {
                        resolve(subUrls);
                    })
                    .catch(err => {
                        console.error(err);
                        reject();
                    });

            });
        }

        getFileFromUrl(url) {

            return new Promise((resolve, reject) => {

                let videoId = this._getVideoIdFromUrl(url);
                console.log("videoId " + videoId);

                const isLive = url.indexOf("otse.err.ee") >= 0;
                if(isLive) {
                    console.log("live video, videoId " + videoId);
                    let mediaUrl = this.liveStreams[videoId];
                    if(mediaUrl) {
                        resolve(mediaUrl);
                        return;
                    }
                }

                this._getContentUrl(videoId)
                    .then(rawVideoUrl => {
                        let mediaUrl = "rtmp" + rawVideoUrl.replace("@", "_definst_/");
                        resolve(mediaUrl);
                    })
                    .catch(err => {
                        reject();
                    });
            });
        }
    }

    new Err(player)
})(player);