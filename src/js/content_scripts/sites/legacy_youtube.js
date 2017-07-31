/**
 * Content Script
 * @author: Karthik VJ
 */
;(function() {

    "use strict";

    const sendMessage = chrome.extension.sendMessage || chrome.runtime.sendMessage || function(){};

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
                    listAnchor.setAttribute("href", "");
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
                    playAnchor.setAttribute("href", "");
                    playAnchor.setAttribute("rel", this.videoId);
                    playAnchor.setAttribute("title", "Play Now - Kassi Share");
                    playAnchor.setAttribute("onclick", "return false;");
                    playAnchor.className = "xbmc_playNow";
                    playAnchor.appendChild(document.createTextNode("Play Now"));

                    let queueAnchor = document.createElement("a");
                    queueAnchor.setAttribute("href", "");
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




    class ContentInjector
    {
        constructor()
        {
            this.timerId = -1;

            this.assignDOMChangeListener();

            if (window.location.pathname == "/watch")
            {
                this.addLinkToWatchPage();
            }

            this.injectLinks();
        }

        assignDOMChangeListener()
        {
            let contentDiv = document.getElementById("content");
            if(!contentDiv)
            {
                setTimeout(() => {
                    this.assignDOMChangeListener();
                }, 1000);
                return;
            }

            contentDiv.addEventListener("DOMNodeInserted", (event) => {
                this.injectLinksWithDelay();
            });
        }

        addListeners(el)
        {
            var thisObject = this;
            // click event listeners
            el.querySelectorAll(".xbmc_playlist").forEach(function(innerEl)
            {
                innerEl.addEventListener("click", (event) => {
                    let listId = innerEl.getAttribute("rel");

                    if (listId)
                    {
                        var listData = listId.split(" ");
                        console.log("playlist, " + listData);

                        let param = "";

                        const playlistId = listData[0];
                        if(playlistId) {
                            param += "list=" + playlistId;
                        }

                        const videoId = listData[1];
                        if(videoId) {
                            param += "&v=" + videoId;
                        }

                        sendMessage({
                            message: "playAllFromContent",
                            site: "youtube",
                            url: "https://www.youtube.com/watch?" + param
                        }, response => {});

                        event.preventDefault();
                    }
                });

            });

            el.querySelectorAll(".xbmc_playNow").forEach(function(innerEl)
            {
                innerEl.addEventListener("click", (event) => {
                    let videoId = innerEl.getAttribute("rel");

                    console.log("play single video, " + videoId);
                    sendMessage({
                        message: "playNowFromContent",
                        site: "youtube",
                        url: "https://www.youtube.com/watch?v=" + videoId
                    }, response => {});

                    event.preventDefault();
                });

            });

            el.querySelectorAll(".xbmc_queue").forEach(function(innerEl)
            {
                innerEl.addEventListener("click", (event) => {
                    let videoId = innerEl.getAttribute("rel");
                    console.log("queue single video, " + videoId);

                    sendMessage({
                        message: "queueFromContent",
                        site: "youtube",
                        url: "https://www.youtube.com/watch?v=" + videoId
                    }, response => {});

                    event.preventDefault();
                });

            });
        }

        injectLinks()
        {
            //console.log("injectLinks ", this);
            // (home / subscription on home page), search page, video manager, user page, user browse video, Popular on YouTube, Popular on youtube right side, video list (on video page), play list page
            let classes = ".feed-item-content, .yt-lockup2-content, .vm-video-info-container, " +
                ".yt-tile-visible, .channels-content-item, .lohp-category-shelf-item, " +
                ".lohp-large-shelf-container, .lohp-medium-shelf-content, .lohp-vertical-shelf-item-content, " +
                ".video-list-item, .playlist-video-item, .yt-lockup-content, .recent-activity-snippet, " +
                ".playlist-actions, .pl-video-title, ytd-thumbnail";

            let divList = document.querySelectorAll(classes) || [];
            const divListLen = divList.length;

            for(let i = 0; i < divListLen; i++)
            {
                let el = divList[i];
                //console.log(el);
                const tagName = el.tagName.toLowerCase();
                const addInParentNode = tagName == "ytd-thumbnail";
                const checkInParentNode = addInParentNode;

                const alreadyAdded = this.isControlAdded(el, checkInParentNode);
                if (alreadyAdded)
                {
                    //console.log("Already added - injectLinks");
                    continue;
                }

                // (home / subscription on home page), search page, video manager, (user page / user browse video / Popular on YouTube)
                let df = el.querySelectorAll(".feed-video-title, .yt-uix-tile-link, .vm-video-title-content, " +
                    ".yt-uix-sessionlink, a");
                let len = df.length;

                for (let j = 0; j < len; j++)
                {
                    let innerEl = df[j];
                    const result = this.insertDOMElement(el, innerEl, addInParentNode);
                    if(result)
                    {
                        break;
                    }
                }
            }

        }

        isControlAdded(el, checkParent = false)
        {
            if(!checkParent) {
                let list = el.querySelectorAll(".xbmc_control") || [];
                if(list.length > 0) {
                    return true;
                }
            }
            else if(checkParent) {
                let list = el.parentNode.querySelectorAll(".xbmc_control") || [];
                return list.length > 0;
            }

            return false;
        }

        insertDOMElement(el, innerEl, newDesign = false)
        {
            let thisObject = this;
            let videoPathString = innerEl.getAttribute("href");
            let listId;
            let videoId;
            let isSideBar = false;

            if (videoPathString)
            {
                //console.log("videoPathString, " + videoPathString);

                // just a single video
                videoId = Utils.findPropertyFromString(videoPathString, "v");
                if (!videoId)
                {
                    videoId = Utils.findPropertyFromString(videoPathString, "video_id");
                }

                if (!videoId)
                {
                    videoId = Utils.findPropertyFromString(videoPathString, "video_ids");
                    if(videoId)
                    {
                        videoId = decodeURIComponent(videoId);
                        var vIndexText = Utils.findPropertyFromString(videoPathString, "index");
                        var vIndex = vIndexText ? parseInt(vIndexText) : 0;
                        if (vIndex < videoId.length)
                        {
                            try {
                                videoId = videoId.split(",")[vIndex];
                            }
                            catch(err) {
                                videoId = null;
                            }
                        }
                    }

                }

                if (videoId)
                {
                    //console.log("videoId, " + videoId);
                    if (el.classList.contains("video-list-item") || el.classList.contains("playlist-video-item"))
                    {
                        isSideBar = true;
                    }
                }

                // find play list id
                listId = Utils.findPropertyFromString(videoPathString, "list");

                //////

                if (listId && videoId)
                {
                    listId = listId + " " + videoId;
                }

                if (listId || videoId)
                {
                    var divGen = new DivGenerator();
                    var div = divGen
                        .setVideo(videoId)
                        .setPlayList(listId)
                        .setSideBar(isSideBar)
                        .build();

                    thisObject.addListeners(div);
                    if(newDesign) {
                        el.parentNode.insertBefore(div, el.nextSibling);
                    }
                    else {
                        el.insertBefore(div, el.firstChild);
                    }
                    return true;
                }
            }

            return false;
        }

        injectLinksWithDelay(delay = 1000)
        {
            clearTimeout(this.timerId);
            this.timerId = setTimeout(() => {

                this.injectLinks();
                if (window.location.pathname == "/watch")
                {
                    //console.log("video ID change.. inject watch link!");
                    this.addLinkToWatchPage();
                }
            }, delay)
        }

        addLinkToWatchPage()
        {
            //console.log("addLinkToWatchPage, window.location, " + window.location);
            let thisObject = this;
            let headLineDiv = document.getElementById("watch7-headline")
                || document.getElementsByClassName("ytd-video-primary-info-renderer")[0];

            if(!headLineDiv)
            {
                return;
            }

            if(this.isControlAdded(headLineDiv))
            {
                //console.log("Already added - addLinkToWatchPage");
                return;
            }

            let loc = window.location.href.toString();
            var videoId = Utils.findPropertyFromString(loc, "v");
            let listId = Utils.findPropertyFromString(loc, "list");

            if (listId && videoId)
            {
                listId = listId + " " + videoId;
            }

            if (listId || videoId)
            {
                var divGen = new DivGenerator();
                var div = divGen
                    .setVideo(videoId)
                    .setPlayList(listId)
                    .build();

                thisObject.addListeners(div);
                headLineDiv.insertBefore(div, headLineDiv.firstChild);
            }

        }

    }


    chrome.storage.local.get(function(item)
    {
        if(typeof item.showInPage === "undefined" || item.showInPage == true)
        {
            sendMessage({
                message: "kodiOnline"
            }, response => {
                response = response || {};
                const online = response.success || false;
                if(online) {
                    new ContentInjector();
                }
            });
        }
    });


})();