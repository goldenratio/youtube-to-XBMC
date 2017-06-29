;(function()
{

    class Youtube extends AbstractSite
    {
        constructor()
        {
            super();
            console.log("youtube");
            this.pluginURL = "plugin://plugin.video.youtube/?action=play_video&videoid=%s";

            const videoFilters = ["*://www.youtube.com/*v=*"];
            const playlistFilters = ["*://www.youtube.com/*list=*"];

            contextMenu.addFilters("youtube.com", this, videoFilters, playlistFilters);
        }

        getFileFromUrl(url)
        {
            return new Promise((reslove, reject) => {

                const videoId = Utils.findPropertyFromString(url, "v");
                const fileUrl = videoId ? sprintf(this.pluginURL, videoId) : null;

                reslove(fileUrl);
            });
        }
    }

    class GService
    {
        constructor()
        {
            this.api_key = "AIzaSyD_GFTv0BYK2UqbuEmFuAb1PkJ1wHSjpaA";
            this.feedPath = "https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails" +
                "&maxResults=50" +
                "&pageToken=%s" +
                "&playlistId=%s" +
                "&key=%s";

            this.videoIdList = [];
            this.isPending = false;
        }

        handleRequest(playlistId, pageToken = "")
        {

            return new Promise((resolve, reject) => {

                let url = sprintf(this.feedPath, pageToken, playlistId, this.api_key);

                let urlRequest = new URLRequest(url);
                urlRequest.send().then((response) => {

                    let obj = JSON.parse(this.response);
                    let itemList = obj.items;

                    console.log("total entries, " + itemList.length);

                    for (let i = 0; i < itemList.length; i++)
                    {
                        var videoId = itemList[i]["contentDetails"]["videoId"];
                        if (videoId)
                        {
                            this.videoIdList.push(videoId);
                        }
                    }

                    const nextPageToken = obj["nextPageToken"];
                    const hasMoreItemsInNextPage = (nextPageToken != null && typeof nextPageToken === "string");

                    if(hasMoreItemsInNextPage)
                    {
                        this.handleRequest(playlistId, nextPageToken);
                        return;
                    }

                    console.log(this.videoIdList);

                    this.isPending = false;
                    resolve(this.videoIdList);


                }).catch((error) => {

                    this.isPending = false;
                    reject();

                });

            });
        }

        loadFeed(playlistId)
        {
            this.isPending = true;
            this.videoIdList = [];

            return new Promise((resolve, reject) => {

                this.handleRequest(playlistId)
                    .then((videoIdList) => {
                        this.isPending = false;
                        resolve(videoIdList);
                    })
                    .catch(() => {
                        this.isPending = false;
                        reject();
                    });

            });

        }
    }

    new Youtube()
})();