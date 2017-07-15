;(function(player)
{

    class Youtube extends AbstractSite
    {
        constructor()
        {
            super(player);

            console.log("youtube");
            this.pluginURL = "plugin://plugin.video.youtube/?action=play_video&videoid=%s";
            this.gService = new GService();

            contextMenu.addSite("youtube.com", this, ["*://www.youtube.com/*v=*"], ["*://www.youtube.com/*list=*"]);

            contextMenu.addSite("youtu.be", this, ["*://youtu.be/*"], []);

            browserAction.addSite("youtube.com", this, [
                ".*youtube.com/watch.*",
                ".*youtube.com/embed/.*"
            ]);
        }


        getPlaylistFromUrl(url)
        {
            return new Promise((resolve, reject) => {

                const playListId = Utils.findPropertyFromString(url, "list");
                const selectedVideoId = Utils.findPropertyFromString(url, "v");
                if(playListId == "WL") {
                    reject();
                    return;
                }

                this.gService.loadFeed(playListId)
                    .then(response => {

                        if (selectedVideoId) {
                            let index = response.indexOf(selectedVideoId);
                            if(index > 0) {
                                response = response.splice(index, response.length);
                            }
                        }

                        let fileList = response.map(videoId => {

                            return videoId ? sprintf(this.pluginURL, videoId) : null;
                        }).filter((url) => {
                            return url != null;
                        });

                        if(fileList && fileList.length > 0) {
                            resolve(fileList);
                        }
                        else {
                            reject();
                        }

                    })
                    .catch(() => {
                        resolve(null);
                    });

            });
        }

        getFileFromUrl(url)
        {
            return new Promise((reslove, reject) => {

                let videoId = Utils.findPropertyFromString(url, "v");
                if(!videoId) {
                    let parts = url.split("/");
                    if(parts && parts.length > 1) {
                        videoId = parts[parts.length - 1];
                    }
                }

                console.log("videoId " + videoId);
                const fileUrl = videoId ? sprintf(this.pluginURL, videoId) : null;

                if(fileUrl) {
                    reslove(fileUrl);
                }
                else {
                    reject();
                }

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

        _handleRequest(playlistId, pageToken = "")
        {
            return new Promise((resolve, reject) => {

                let url = sprintf(this.feedPath, pageToken, playlistId, this.api_key);

                let urlRequest = new URLRequest(url);
                urlRequest.send().then((response) => {

                    let obj = JSON.parse(response);
                    let itemList = obj.items;

                    console.log("total entries, " + itemList.length);

                    for (let i = 0; i < itemList.length; i++) {
                        var videoId = itemList[i]["contentDetails"]["videoId"];
                        if (videoId)
                        {
                            this.videoIdList.push(videoId);
                        }
                    }

                    const nextPageToken = obj["nextPageToken"];
                    const hasMoreItemsInNextPage = (nextPageToken != null && typeof nextPageToken === "string");

                    if(hasMoreItemsInNextPage) {
                        this._handleRequest(playlistId, nextPageToken);
                        return;
                    }

                    resolve(this.videoIdList);


                }).catch(error => {
                    reject();
                });

            });
        }

        loadFeed(playlistId)
        {
            if(this.isPending) {
                console.log("gService is busy");
                return;
            }
            this.isPending = true;
            this.videoIdList = [];

            return new Promise((resolve, reject) => {

                this._handleRequest(playlistId)
                    .then(videoIdList => {
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

    new Youtube(player)
})(player);