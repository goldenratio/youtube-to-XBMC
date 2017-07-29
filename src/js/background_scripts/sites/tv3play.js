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
                ".*tv3play.tv3.ee/sisu/.*/\\d+.*$"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {
                let mainUrl = url.split("?")[0];
                let videoId = mainUrl.split("/").pop();
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
                    })
            });
        }

    }

    new TV3Play(player)
})(player);