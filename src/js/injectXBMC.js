/**
 * Content Script
 * @author: Karthik VJ
 */

// ---- polyfills ---
var console = console || {};
console.log = console.log || function() {};
console.logCopy = console.log.bind(console);

// --------------
if (ENABLE_CONSOLE == false)
{
    console.log = function() {};
}

class RpcService
{
    constructor()
    {
        this.sendMessageToBackground = chrome.extension.sendMessage || chrome.runtime.sendMessage || function(){};
    }

    playVideoOnXBMC(vId)
    {
        console.log("sending message to background");
        this.sendMessageToBackground({message: "playVideo", videoId: vId}, function(response) {});
    }

    queueVideoToXBMC(vId)
    {
        this.sendMessageToBackground({message: "queueVideo", videoId: vId}, function(response) {
            console.log("inject script >> video sent! " + response);
            if (response == ResultData.OK)
            {
                toastr.success("Added to Queue!");
            }
            else
            {
                toastr.error("Error! Can't Add to Queue!");
            }
        });
    };

    playListOnXBMC(listId, videoId)
    {
        this.sendMessageToBackground({message: "playList", listId: listId, videoId: videoId}, function(response) {
            console.log("list sent! " + response);
        });
    };

}

class DivGenerator
{
    constructor()
    {
        this.playListId = null;
        this.videoId = null;
        this.isSideBar = false;
    }

    setSideBar(flag)
    {
        this.isSideBar = flag;
        return this;
    }

    setPlayList(pId)
    {
        this.playListId = pId;
        return this;
    }

    setVideo(vId)
    {
        this.videoId = vId;
        return this;
    }

    build()
    {
        let domEl = document.createElement("div");
        domEl.className = "xbmc_control";

        if(this.isSideBar)
        {
            if(this.playListId)
            {
                let playListSpan = document.createElement("span");
                playListSpan.setAttribute("rel", this.playListId);
                playListSpan.setAttribute("class", "xbmc_playlist xbmc_link");
                playListSpan.setAttribute("title", "Play All - Kassi Share");
                playListSpan.setAttribute("onclick", "return false;");
                playListSpan.appendChild(document.createTextNode("Play All"));

                domEl.appendChild(playListSpan);
                domEl.appendChild(document.createTextNode(" | "));
            }

            if(this.videoId)
            {
                let playSpan = document.createElement("span");
                playSpan.setAttribute("rel", this.videoId);
                playSpan.setAttribute("style", "padding-left: 180px;");
                playSpan.setAttribute("class", "xbmc_playNow xbmc_link");
                playSpan.setAttribute("title", "Play Now - Kassi Share");
                playSpan.setAttribute("onclick", "return false;");
                playSpan.appendChild(document.createTextNode("Play Now"));

                let queueSpan = document.createElement("span");
                queueSpan.setAttribute("rel", this.videoId);
                queueSpan.setAttribute("class", "xbmc_queue xbmc_link");
                queueSpan.setAttribute("title", "Add to Queue - Kassi Share");
                queueSpan.setAttribute("onclick", "return false;");
                queueSpan.appendChild(document.createTextNode("[+] Add to Queue"));

                domEl.appendChild(playSpan);
                domEl.appendChild(document.createTextNode(" | "));
                domEl.appendChild(queueSpan);
            }
        }
        else
        {
            if(this.playListId)
            {
                let listAnchor = document.createElement("a");
                listAnchor.setAttribute("href", "#");
                listAnchor.setAttribute("rel", this.playListId);
                listAnchor.setAttribute("title", "Play All - Kassi Share");
                listAnchor.setAttribute("onclick", "return false;");
                listAnchor.className = "xbmc_playlist";
                let listText = document.createTextNode("Play All");
                listAnchor.appendChild(listText);

                domEl.appendChild(listAnchor);
                domEl.appendChild(document.createTextNode(" | "));
            }

            if(this.videoId)
            {
                let playAnchor = document.createElement("a");
                playAnchor.setAttribute("href", "#");
                playAnchor.setAttribute("rel", this.videoId);
                playAnchor.setAttribute("title", "Play Now - Kassi Share");
                playAnchor.setAttribute("onclick", "return false;");
                playAnchor.className = "xbmc_playNow";
                playAnchor.appendChild(document.createTextNode("Play Now"));

                let queueAnchor = document.createElement("a");
                queueAnchor.setAttribute("href", "#");
                queueAnchor.setAttribute("rel", this.videoId);
                queueAnchor.setAttribute("title", "Add to Queue - Kassi Share");
                queueAnchor.setAttribute("onclick", "return false;");
                queueAnchor.className = "xbmc_queue";
                queueAnchor.appendChild(document.createTextNode("[+] Add to Queue"));

                domEl.appendChild(playAnchor);
                domEl.appendChild(document.createTextNode(" | "));
                domEl.appendChild(queueAnchor);
            }
        }

        return domEl;
    }
}

class Utils
{
    static findPropertyFromString(str, key)
    {
        let property = key + "=";
        var index = str.indexOf('?');
        str = str.substring(index + 1);

        var list = str.split('&');

        for (var i = 0; i < list.length; i++)
        {
            if (list[i].search(property) == 0)
            {
                return list[i].replace(property, "");
            }
        }
        return null;
    }
}

;(function() {

    var timer;

    this.injectLinks = function()
    {
        console.log("injectLinks");
        // (home / subscription on home page), search page, video manager, user page, user browse video, Popular on YouTube, Popular on youtube right side, video list (on video page), play list page
        $(".feed-item-content, .yt-lockup2-content, .vm-video-info-container, .yt-tile-visible, .channels-content-item, .lohp-category-shelf-item, .lohp-large-shelf-container, .lohp-medium-shelf-content, .lohp-vertical-shelf-item-content, .video-list-item, .playlist-video-item, .yt-lockup-content, .recent-activity-snippet, .playlist-actions, .pl-video-title").each(function(index)
        {
            var alreadyAdded = false;
            $(this).find(".xbmc_control").each(function(xIndex)
            {
                alreadyAdded = true;
                return false;

            });

            if (alreadyAdded)
            {
                console.log("Already added - injectLinks");
                return; // continue
            }

            console.log(index);
            let videoPathString;
            let listId = null;
            let videoId = null;
            let isSideBar = false;

            // (home / subscription on home page), search page, video manager, (user page / user browse video / Popular on YouTube)
            $(this).find(".feed-video-title, .yt-uix-tile-link, .vm-video-title-content, .yt-uix-sessionlink, a").each(function(vIndex)
            {
                //console.log("video link, " + vIndex + ", " + $(this).attr("href"));
                videoPathString = $(this).attr("href");
                return false;
            });

            if (videoPathString)
            {
                console.log("videoPathString, " + videoPathString);

                // just a single video
                videoId = Utils.findPropertyFromString(videoPathString, "v");
                if (!videoId)
                {
                    videoId = Utils.findPropertyFromString(videoPathString, "video_id");
                }

                if (!videoId)
                {
                    videoId = Utils.findPropertyFromString(videoPathString, "video_ids");
                    videoId = decodeURIComponent(videoId);
                    var vIndexText = Utils.findPropertyFromString(videoPathString, "index");
                    var vIndex = vIndexText ? parseInt(vIndexText) : 0;
                    if (vIndex < videoId.length)
                    {
                        try
                        {
                            videoId = videoId.split(",")[vIndex];
                        } catch(err) {}
                    }

                }

                if (videoId)
                {
                    console.log("videoId, "  +videoId);
                    if ($(this).hasClass("video-list-item") || $(this).hasClass("playlist-video-item"))
                    {
                        isSideBar = true;
                    }

                }

                // find play list id
                listId = Utils.findPropertyFromString(videoPathString, "list");

                //////
                if (listId || videoId)
                {
                    var divGen = new DivGenerator();
                    var div = divGen
                        .setVideo(videoId)
                        .setPlayList(listId)
                        .setSideBar(isSideBar)
                        .build();

                    $(this).prepend(div);
                }

                listId = null;
                videoId = null;
            }
        });

        $("#content").bind("DOMNodeInserted", function(event)
        {
            injectLinksWithDelay();
        });
    };

    this.injectLinksWithDelay = function()
    {
        clearTimeout(timer);
        timer = setTimeout(function(){

            injectLinks();
            if (window.location.pathname == "/watch")
            {
                console.log("video ID change.. inject watch link!");
                addLinkToWatchPage();
            }
        }, 1000)
    };


    this.initListeners = function()
    {
        // click event listeners
        $(document).on('click', '.xbmc_playlist', function(event)
        {
            console.log("playlist, " + $(this).attr("rel"));
            var listId = $(this).attr("rel");

            if (listId)
            {
                var listData = listId.split(" ");
                rpc.playListOnXBMC(listData[0], listData[1]);
                event.preventDefault();
            }

        });

        $(document).on('click', '.xbmc_playNow', function(event)
        {
            console.log("play single video, " + $(this).attr("rel"));
            rpc.playVideoOnXBMC($(this).attr("rel"));
            event.preventDefault();

        });

        $(document).on('click', '.xbmc_queue', function(event)
        {
            console.log("queue single video, " + $(this).attr("rel"));
            rpc.queueVideoToXBMC($(this).attr("rel"));
            event.preventDefault();
        });
    };


    this.addLinkToWatchPage = function()
    {
        console.log("addLinkToWatchPage, window.location, " + window.location);

        let alreadyAdded = false;
        $("#watch7-headline").find(".xbmc_control").each(function(xIndex)
        {
            alreadyAdded = true;
            return false;
        });

        if (alreadyAdded)
        {
            console.log("Already added - addLinkToWatchPage");
            return;
        }

        let loc = window.location.toString();
        var videoId = Utils.findPropertyFromString(loc, "v");
        let listId = Utils.findPropertyFromString(loc, "list");

        currentWatchPageVideoID = videoId;

        // TODO: old had this. Check why?
        /*if (listId && videoId)
        {
            listId = listId + " " + videoId;
        }*/

        if (listId || videoId)
        {
            var divGen = new DivGenerator();
            var div = divGen
                .setVideo(videoId)
                .setPlayList(listId)
                .build();

            $("#watch7-headline").prepend(div);
        }

    };

    // MAIN /////////////////////////////

    var currentWatchPageVideoID = "";
    var rpc = new RpcService();
    this.initListeners();


    if (window.location.pathname == "/watch")
    {
        addLinkToWatchPage();
    }
    injectLinks();

}());
