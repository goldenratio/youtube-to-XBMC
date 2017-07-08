;(function(player)
{

    class Facebook extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("Facebook");

            browserAction.addSite("facebook.com", this, [
                ".*facebook.com/.*/videos/.*"
            ]);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                sendMessageToContentScript({message: "getFacebookVideoSourceUrl"})
                    .then(response => {
                        response = response || {};
                        let videoUrl = response.videoUrl;
                        videoUrl ? resolve(videoUrl) : reject();
                    });
            });
        }

    }

    new Facebook(player)
})(player);