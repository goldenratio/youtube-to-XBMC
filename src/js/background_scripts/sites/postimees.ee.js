;(function(player)
{

    class Postimees extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("Postimees.ee");

            this.videoUrl = "http://www.postimees.ee/video/hls/%s.m3u8";
            browserAction.addSite("postimees.ee", this, [
                ".*postimees.ee/.*"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                sendMessageToContentScript({message: "getVideoId"})
                    .then(response => {
                        response = response || {};
                        let videoId = response.videoId;
                        if(videoId) {
                            const mediaUrl = sprintf(this.videoUrl, videoId);
                            resolve(mediaUrl);
                        } else {
                            reject();
                        }
                    });
            });
        }

    }

    new Postimees(player)
})(player);