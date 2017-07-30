;(function(player)
{

    class TV3Play extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("tv3play.tv3.ee");

            this.apiUrl = "http://playapi.mtgx.tv/v3/videos/stream/%s";

            contextMenu.addSite("tv3play.tv3.ee", this, ["*://tv3play.tv3.ee/sisu/*/*"]);
            browserAction.addSite("tv3play.tv3.ee", this, [
                ".*tv3play.tv3.ee/sisu/.*"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {
                this._getVideoId(url)
                    .then(videoId => {
                        console.log("videoId " + videoId);
                        return this._getMediaUrl(videoId);
                    })
                    .then(mediaUrl => {
                        resolve(mediaUrl);
                    })
                    .catch(err => {
                        reject();
                    });
            });
        }

        _getVideoId(url) {
            return new Promise((resolve, reject) => {
                const mainUrl = url.split("?")[0];
                const parts = mainUrl.split("/");


                if(parts.length <= 5) {
                    sendMessageToContentScript({message: "getVideoId"})
                        .then(response => {
                            response = response || {};
                            let videoId = response.videoId;
                            videoId ? resolve(videoId) : reject();
                        });
                }
                else {
                    let videoId = parts[parts.length - 1];
                    videoId ? resolve(videoId) : reject();
                }
            });
        }

        _getMediaUrl(videoId) {
            return new Promise((resolve, reject) => {
                if(!videoId) {
                    reject();
                    return;
                }
                let apiUrlWithVideoId = sprintf(this.apiUrl, videoId);
                let urlRequest = new URLRequest(apiUrlWithVideoId);
                urlRequest.send()
                    .then(response => {
                        let mediaUrl;
                        try {
                            const data = JSON.parse(response);
                            const streams = data["streams"] || {};
                            console.log(streams);
                            mediaUrl = streams["high"] || streams["medium"] || streams["hls"] || streams["low"];
                        }
                        catch(err) {}

                        if(mediaUrl) {
                            resolve(mediaUrl);
                        }
                        else {
                            reject();
                        }

                    })
                    .catch(err => {
                        reject();
                    });

            });
        }

    }

    new TV3Play(player)
})(player);