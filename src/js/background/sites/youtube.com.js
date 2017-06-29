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
            let path = sprintf(this.feedPath, pageToken, playlistId, this.api_key);
            let thisObject = this;

            return new Promise((resolve, reject) => {

                let xhr = new XMLHttpRequest();
                xhr.open("GET", path, true);
                xhr.setRequestHeader("Content-type", "application/json");

                xhr.onreadystatechange = function() {
                    //console.log("this.readyState, " + this.readyState + ", " + this.status);
                };

                xhr.onerror = function() {
                    reject();
                };

                xhr.onload = function () {
                    console.log("request done " + this.status);
                    const isSuccess = (this.status == 200);
                    if(isSuccess)
                    {
                        let obj = JSON.parse(this.responseText);
                        let itemList = obj.items;

                        //console.log(JSON.stringify(obj));
                        console.log("total entries, " + itemList.length);

                        for (let i = 0; i < itemList.length; i++)
                        {
                            var videoId = itemList[i]["contentDetails"]["videoId"];
                            if (videoId)
                            {
                                thisObject.videoIdList.push(videoId);
                            }
                        }

                        const nextPageToken = obj["nextPageToken"];
                        const hasMoreItemsInNextPage = (nextPageToken != null && typeof nextPageToken === "string");

                        if(hasMoreItemsInNextPage)
                        {
                            thisObject.handleRequest(playlistId, nextPageToken);
                            return;
                        }

                        console.log(thisObject.videoIdList);
                        resolve(thisObject.videoIdList);
                    }

                    reject();
                };

                xhr.send("");
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