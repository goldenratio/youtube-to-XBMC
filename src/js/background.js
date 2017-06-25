/**
 * Background Script
 * @author: Karthik VJ
 */

// --- polyfills ----- /////

var console = console || {};
console.log = console.log || function() {};
console.logCopy = console.log.bind(console);

var messageFromContent = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};

// --------------------

console.log = function(data)
{
    var currentDate = new Date();

    var timeString = '[' + currentDate.getHours() + ':' + currentDate.getMinutes() + ':' + currentDate.getSeconds() + '] ';
    this.logCopy(timeString, data);
};

var enableConsole = { 'log': console.log };

function updateConsole(state)
{
    if (state == false)
    {
        console.log("debugMode, " + state);
        console.log = function() {};
    }
    else
    {
        console.log = enableConsole.log;
        console.log("debugMode, " + state);
    }
}

//updateConsole(false);


/////////////////////////////////////

var Player = function()
{
    var thisObject = this;
    this.pendingRequest = [];

    /*
     * Invoked when content script sends some message
     */
    this.onMessage = function(request, sender, sendResponse)
    {
        if (sender)
        {
            console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
        }

        if(!rpc.url)
        {
            console.log("open settings");
            chrome.tabs.create({'url': chrome.extension.getURL("settings.html")}, function () {});
            return;
        }

        if (rpc.isPending || gService.isPending)
        {
            var requestData = {request: request, callback: sendResponse};
            thisObject.pendingRequest.push(requestData);
            console.log("request queued!");
            return;
        }

        if (request.message == "playVideo")
        {
            console.log("play video, " + request.videoId);
            // Playlist.Clear, Playlist.Add(file), Player.Open(playlist)
            thisObject.clearPlayList(function(clearResult)
            {
                console.log("clearPlayList, " + clearResult);
                if(clearResult == ResultData.OK)
                {
                    thisObject.addtoPlayList(request.videoId, function(listResult)
                    {
                        if(listResult == ResultData.OK)
                        {
                            thisObject.playCurrentVideoFromList(function(playResult)
                            {
                                console.log("video play success!");

                                if(sendResponse)
                                    sendResponse(ResultData.OK);

                            });
                        }
                    });

                }
                else
                {
                    console.log("Error! Cannot clear play list");

                    if(sendResponse)
                        sendResponse(ResultData.ERROR);

                }

            });
        }
        else if (request.message == "queueVideo")
        {
            console.log("queueVideo video, " + request.videoId);
            // Player.GetActivePlayers (if empty), Playlist.Clear, Playlist.Add(file), Player.GetActivePlayers (if empty), Player.Open(playlist)
            // Player.GetActivePlayers (if playing), Playlist.Add(file), Player.GetActivePlayers (if playing), do nothing

            thisObject.getActivePlayers(function(result)
            {
                if (result.length <= 0)
                {
                    // clear any previous pending play list
                    thisObject.clearPlayList(function(clearResult)
                    {
                        thisObject.onQueue(request.videoId, function(response)
                        {
                            if(sendResponse)
                                sendResponse(response);
                        });
                    });
                }
                else
                {
                    thisObject.onQueue(request.videoId, function(response)
                    {
                        if(sendResponse)
                            sendResponse(response);
                    });
                }

            });

        }
        else if (request.message == "playList")
        {
            console.log("playList, " + request.listId + ", videoId = " + request.videoId);
            gService.loadFeed(request.listId, request.videoId, "");
        }
    };

    this.onQueue = function(videoId, callback)
    {
        // first add playlist, if no video is playing then play the video.
        thisObject.addtoPlayList(videoId, function(playListResult)
        {
            console.log("addtoPlayList, " + playListResult);
            if (playListResult == ResultData.OK)
            {
                if (callback)
                {
                    callback(ResultData.OK);
                }


                thisObject.getActivePlayers(function(activeResult)
                {
                    console.log("active player is found!");
                    // check if no video is playing and start the first video in queue
                    if(activeResult.length <= 0)
                    {
                        console.log("playing queue");
                        thisObject.playCurrentVideoFromList(function(playResult)
                        {
                            console.log("video play success!");

                        });

                    }
                    else
                    {
                        console.log("play list item trace");
                        // trace play list items
                        thisObject.getPlayList(function(result)
                        {
                            console.log("play list items, " + result);
                        });
                    }

                });
            }
            else
            {
                console.log("Error! Cannot add video to playlist");
                if(callback)
                {
                    callback(ResultData.ERROR);
                }
            }

        });
    };

    this.getActivePlayers = function(callback)
    {
        console.log("------ this.getActivePlayers ----------");
        var params = {};
        rpc.sendRequest(thisObject, "Player.GetActivePlayers", params, callback);
    };

    this.addtoPlayList = function(videoId, callback)
    {
        console.log("------ this.addtoPlayList ---------- " + videoId);
        var params = {
            playlistid: 1,
            item : {
                file : videoId
            }
        };

        rpc.sendRequest(thisObject, "Playlist.Add", params, callback);
    };

    this.getPlayList = function(callback)
    {
        console.log("------ this.getPlayList ---------- ");
        var params = {
            playlistid: 1
        };

        rpc.sendRequest(thisObject, "Playlist.GetItems", params, callback);

    };

    this.playCurrentVideoFromList = function(callback)
    {
        console.log("------ this.playCurrentVideoFromList ----------");
        var params = {
            item : {
                playlistid: 1,
                position: 0
            }
        };

        rpc.sendRequest(thisObject, "Player.Open", params, callback);
    };

    this.clearPlayList = function(callback)
    {
        console.log("------ this.clearPlayList ----------");
        var params = {
            playlistid: 1
        };

        rpc.sendRequest(thisObject, "Playlist.Clear", params, callback);
    };

    this.playCurrentFile = function(videoId, callback)
    {
        console.log("------ this.playCurrentFile ---------- " + videoId);
        var params = {
            item : {
                file : videoId
            }
        };

        rpc.sendRequest(thisObject, "Player.Open", params, callback);
    };

    /**
     * Response data from json-rpc request
     */
    this.responseData = function(text, callback)
    {
        var obj = JSON.parse(text);
        //console.log(text);
        console.log(JSON.stringify(obj));

        console.log("success");
        if (callback)
        {
            console.log("sending.. " + obj.result);
            callback(obj.result);
        }

        // check for pending requests
        if (thisObject.pendingRequest.length > 0)
        {
            thisObject.onMessage(thisObject.pendingRequest[0].request, thisObject.pendingRequest[0].callback);
            thisObject.pendingRequest.shift();
        }

    };

    /**
     * Response status from json-rpc request
     */
    this.updateResponseStatus = function(status)
    {
        if (status == 0)
        {
            console.log("Error! Cannot connect to XBMC");
            chrome.tabs.create({'url': chrome.extension.getURL("settings.html")}, function () {});
        }

    };
};

var RPCService = function()
{
    this.url;
    this.debugMode;
    this.youTubePath = "plugin://plugin.video.youtube/?action=play_video&videoid=";
    this.callback;
    this.context;
    this.isPending = false;

    var thisObject = this;
    var xhr;

    this.init = function()
    {
        thisObject.debugMode = false;
        chrome.storage.local.get(function(item)
        {
            if (item.xbmcURL)
            {
                console.log("found xbmc URL, " + item.xbmcURL);
                thisObject.url = item.xbmcURL;
            }

            if (item.debugMode)
            {
                if(item.debugMode == true)
                {
                    thisObject.debugMode = true;
                }
            }

            updateConsole(thisObject.debugMode);
        });

    };

    /**
     * Set from settings.js when data is changed.
     * @param xbmcURL
     */
    this.setURL = function(xbmcURL)
    {
        //console.log("xbmc URL, " + xbmcURL);
        thisObject.url = xbmcURL;
    };

    /**
     * Set from settings.js when data is changed.
     * @param state @{Boolean}
     */
    this.setDebugMode = function(state)
    {
        //console.log("data from settings debug, " + state);
        if (thisObject.debugMode != state)
        {
            thisObject.debugMode = state;
            updateConsole(thisObject.debugMode);
        }
    };

    this.sendRequest = function(context, method, params, callback)
    {
        console.log("send request");
        thisObject.callback = callback;
        thisObject.context = context;
        var data = { jsonrpc: "2.0", method: method, id: 1 };

        if (params)
        {
            if(params.item)
            {
                if(params.item.file)
                {
                    params.item.file = thisObject.youTubePath + params.item.file;
                }
            }

            data.params = params;
        }

        thisObject.isPending = true;
        var strData = JSON.stringify(data);
        console.log(">> " + strData);

        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = thisObject.readResponse;
        xhr.open("POST", this.url, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onload = thisObject.onLoad;
        xhr.send(strData);

    };

    this.onLoad = function()
    {
        console.log("<< " + this.responseText);
        thisObject.isPending = false;
        if (this.status == 200)
        {
            if (thisObject.context)
            {
                thisObject.context.responseData(this.responseText, thisObject.callback);
            }

        }

    };

    this.readResponse = function()
    {
        console.log("this.readyState, " + this.readyState);
        if (this.readyState == 4)
        {
            console.log("status, " + this.status);
            if(this.status == 0)
            {
                thisObject.isPending = false;
            }

            if (thisObject.context)
            {
                thisObject.context.updateResponseStatus(this.status);
            }

        }

    };
};

var GDataService = function()
{
    this.api_key = "AIzaSyD_GFTv0BYK2UqbuEmFuAb1PkJ1wHSjpaA";
    this.feedPath = "https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails" +
        "&maxResults=$max_results" +
        "&pageToken=$next_page_token" +
        "&playlistId=$list_id" +
        "&key=$api_key";

    this.isPending = false;
    this.selectedVideoId;
    this.playlistId;
    this.context;
    var videoList = [];
    var xhr;
    var thisObject = this;

    this.loadFeed = function(playlistId, defaultVideoId, nextPageToken)
    {
        if (!playlistId)
        {
            console.log("playlist id can not be null");
            return;
        }
        if (defaultVideoId)
        {
            thisObject.selectedVideoId = defaultVideoId;
        }

        thisObject.playlistId = playlistId;

        if (videoList)
        {
            videoList.length = 0;
        }
        else
        {
            videoList = [];
        }

        thisObject.isPending = true;
        sendPlayListRequest(nextPageToken);

    };

    var sendPlayListRequest = function(nextPageToken)
    {
        var path = thisObject.feedPath.replace("$list_id", thisObject.playlistId);
        path = path.replace("$api_key", thisObject.api_key);
        path = path.replace("$max_results", "50");
        path = path.replace("$next_page_token", nextPageToken);

        xhr = new XMLHttpRequest();
        xhr.onreadystatechange = thisObject.readResponse;
        xhr.open("GET", path, true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.onload = thisObject.onLoad;
        xhr.send("");
    };

    this.findPropertyFromString = function(str, property)
    {
        property = property + "=";
        var index = str.indexOf('?');
        str = str.substring(index + 1);

        var list = str.split('&');
        //console.log("list.length, " + list.length);
        for (var i = 0; i < list.length; i++)
        {
            if (list[i].search(property) == 0)
            {
                return list[i].replace(property, "");
            }
        }
        return 0;
    };


    this.onLoad = function()
    {
        console.log("feed is loaded!");
        thisObject.isPending = false;
        if (this.status == 200)
        {
            // parse the feed
            console.log("parse!");
            var obj = JSON.parse(this.responseText);
            var itemList = obj.items;

            //console.log(JSON.stringify(obj));
            console.log("total entries, " + itemList.length);
            var i;
            for (i = 0; i < itemList.length; i++)
            {
                var videoId = itemList[i]["contentDetails"]["videoId"];
                console.log(videoId);

                if (videoId)
                {
                    videoList.push(videoId);
                }
            }

            var nextPageToken = obj["nextPageToken"];

            if (nextPageToken != null && typeof nextPageToken === "string")
            {
                sendPlayListRequest(nextPageToken);
                return;
            }

            if (videoList.length > 0)
            {
                // send this video list
                console.log(videoList);
                console.log("thisObject.selectedVideoId, " + thisObject.selectedVideoId);
                if (thisObject.selectedVideoId)
                {
                    var index = videoList.indexOf(thisObject.selectedVideoId);
                    console.log("index, " + index);
                    if (index >= 0)
                    {
                        console.log("videoList = " + videoList);
                        console.log("---------------------------------------");
                        console.log("found first video, " + thisObject.selectedVideoId);
                        var copyList = videoList.splice(index, videoList.length);
                        console.log("copy = " + copyList);
                        console.log("videoList = " + videoList);
                        videoList = copyList.concat(videoList);
                        console.log("---------------------------------------");
                        console.log("videoList = " + videoList);
                    }
                }
                //{message: "playList", videoId: listId, path: path}
                for (i = 0; i < videoList.length; i++)
                {
                    var objData = {message: "queueVideo", videoId: videoList[i]};
                    if (i == 0)
                    {
                        objData.message = "playVideo";
                    }
                    player.onMessage(objData);
                }
            }

        }

    };

    this.readResponse = function()
    {
        console.log("this.readyState, " + this.readyState);
        if (this.readyState == 4)
        {
            console.log("status, " + this.status);
            if (this.status == 0)
            {
                thisObject.isPending = false;
                alert("Error getting playlist data from Google Data!");
            }

        }

    };
};

//////////////////////////////////////////////////////////////////////

var player = new Player();
var gService = new GDataService();
var rpc = new RPCService();
rpc.init();

/**
 * Invoked when content script sends message
 */
messageFromContent.addListener(function(request, sender, sendResponse)
{
    if (player)
    {
        player.onMessage(request, sender, sendResponse);

    }

    return true;

});


/**
 * Listen for any changes to the URL of any tab.
 */
/*chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab)
{
    if (tab.url.indexOf('youtube.com') > -1)
    {
        chrome.pageAction.show(tabId);
    }

});*/
