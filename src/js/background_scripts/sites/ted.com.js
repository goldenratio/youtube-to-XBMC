;(function(player)
{

    class Ted extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("ted.com");

            browserAction.addSite("ted.com", this, [
                ".*ted.com/talks/.*"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                sendMessageToContentScript({message: "getVideoUrl"})
                    .then(response => {
                        let videoUrl = response.videoUrl;
                        if(!videoUrl) {
                            throw new Error("");
                        }
                        else {
                            resolve(videoUrl);
                        }
                    })
                    .catch(err => {
                        reject();
                    });

            });
        }

    }

    new Ted(player)
})(player);