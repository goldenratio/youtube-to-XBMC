/**
 * Background Script
 * Kassi Share
 */

var contextMenus = chrome.contextMenus || browser.contextMenus || {};

function sendMessageToContentScript(data)
{
    return new Promise((resolve, reject) => {

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if(tabs && tabs.length > 0)
            {
                chrome.tabs.sendMessage(tabs[0].id, data, function(response) {
                    // message sent to contentScript
                    resolve(response);
                });
            }
        });

    });
}

// ---------------------

class KodiConfig
{
    constructor()
    {
        this.url = "http://openelec:8080/jsonrpc";
    }
}

class RPCService
{
    constructor(kodiConf)
    {
        this.kodiConf = kodiConf;
        this.isPending = false;
    }

    send(method, params = null)
    {
        var thisObject = this;
        return new Promise((resolve, reject) => {

            console.log("send request >> " + method + ", params ", params);

            let data = {
                jsonrpc: "2.0",
                method: method,
                id: 1
            };

            if(params)
            {
                data.params = params;
            }

            thisObject.isPending = true;

            let strData = JSON.stringify(data);
            let url = thisObject.kodiConf.url;

            let xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-type", "application/json");

            xhr.onreadystatechange = function() {};

            xhr.onerror = function() {
                thisObject.isPending = false;
                reject();
            };

            xhr.onload = function() {

                console.log("<< " + this.responseText);
                thisObject.isPending = false;

                if (this.status == 200) {
                    const data = JSON.parse(this.responseText);
                    resolve(data);
                }
                else {
                    reject();
                }

            };

            xhr.send(strData);
        });
    }
}

class Player
{
    constructor(kodiConf)
    {
        this.rpc = new RPCService(kodiConf);
    }

    _clearPlaylist()
    {
        const params = {
            playlistid: 1
        };

        return this.rpc.send("Playlist.Clear", params);
    }

    _addToPlaylist(file)
    {
        const params = {
            playlistid: 1,
            item : {
                file : file
            }
        };

        return this.rpc.send("Playlist.Add", params);
    }

    _playFromPlaylist(position = 0)
    {
        const params = {
            item : {
                playlistid: 1,
                position: position
            }
        };

        return this.rpc.send("Player.Open", params);
    }

    _getActivePlayers()
    {
        const params = {};
        return this.rpc.send("Player.GetActivePlayers", params);
    }

    _queue(file)
    {
        return new Promise((resolve, reject) => {

            if(!file)
            {
                reject();
                return;
            }

            this._addToPlaylist(file).then((response) => {

                const result = response.result;
                if(result == ResultData.OK)
                {
                    this._getActivePlayers().then((response) => {

                        const result = response.result;
                        // check if no video is playing and start the first video in queue
                        if(result && result.length <= 0)
                        {
                            this._playFromPlaylist();
                        }
                    });

                    resolve(response);
                }
                else
                {
                    reject();
                }
            });

        });

    }

    _errorPlayingVideo()
    {
        const data = {message: "playVideo", status: ResultData.ERROR};
        sendMessageToContentScript(data);
    }

    _errorQueueVideo()
    {
        const data = {message: "queueVideo", status: ResultData.ERROR};
        sendMessageToContentScript(data);
    }

    playVideo(file)
    {
        // 1. Clear play list
        // 2. Add to playlist
        // 3. Play first index

        if(!file)
        {
            // error
            const data = {message: "invalidUrl"};
            sendMessageToContentScript(data);
            return;
        }

        console.log("play video, " + file);

        this._clearPlaylist().then((response) => {
            this._addToPlaylist(file).then((response) => {
                this._playFromPlaylist().then((response) => {

                    console.log("video play success " + response);
                    const data = {message: "playVideo", status: ResultData.OK};
                    sendMessageToContentScript(data);

                }).catch(this._errorPlayingVideo);
            }).catch(this._errorPlayingVideo);
        }).catch(this._errorPlayingVideo);
    }

    queueVideo(file)
    {
        if(!file)
        {
            const data = {message: "invalidUrl"};
            sendMessageToContentScript(data);
            return;
        }

        console.log("queue file " + file);

        // Player.GetActivePlayers (if empty), Playlist.Clear, Playlist.Add(file), Player.GetActivePlayers (if empty), Player.Open(playlist)
        // Player.GetActivePlayers (if playing), Playlist.Add(file), Player.GetActivePlayers (if playing), do nothing

        this._getActivePlayers().then((response) => {

            const result = response.result;
            if(result && result.length <= 0)
            {
                this._clearPlaylist().then((response) => {
                    this._queue(file).then((reponse) => {

                        const data = {message: "queueVideo", status: ResultData.OK};
                        sendMessageToContentScript(data);

                    }).catch(this._errorQueueVideo);
                }).catch(this._errorQueueVideo);
            }
            else
            {
                // add to queue
                this._queue(file).then((reponse) => {

                    const data = {message: "queueVideo", status: ResultData.OK};
                    sendMessageToContentScript(data);

                }).catch(this._errorQueueVideo);
            }
        }).catch(this._errorQueueVideo);
    }

    playAll(files)
    {

    }

    queueAll(files)
    {

    }
}

class ContextMenu
{
    constructor()
    {
        this.siteFilters = {};
    }

    addFilters(siteName, site, videoFilters, playlistFilters = null)
    {
        this.siteFilters[siteName] = {
            videoFilters: videoFilters,
            playlistFilters: playlistFilters,
            site: site
        };

        this.updateMenuEntries();
        this.onPlayClick = this.onPlayClick.bind(this);
        this.onQueueClick = this.onQueueClick.bind(this);
    }

    updateMenuEntries()
    {
        console.log("update menu entries ");

        contextMenus.removeAll(() => {
            // callback
        });

        let playListFilters = Object.entries(this.siteFilters)
            .map((item) => {
                return item[1].playlistFilters;
            })
            .filter((data) => {
                return data != null;
            });
        playListFilters = [].concat.apply([], playListFilters);

        let videoFilters = Object.entries(this.siteFilters)
            .map((item) => {
                return item[1].videoFilters;
            })
            .filter((data) => {
                return data != null;
            });
        videoFilters = [].concat.apply([], videoFilters);

        if(playListFilters && playListFilters.length > 0)
        {
            const playAll = {
                title: "Play All",
                contexts:["link"],
                targetUrlPatterns: playListFilters
            };

            const queueAll = {
                title: "Queue All",
                contexts:["link"],
                targetUrlPatterns: playListFilters
            };

            contextMenus.create(playAll);
            contextMenus.create(queueAll);

            const separator = {
                type: "separator",
                contexts:["link"],
                targetUrlPatterns: playListFilters
            };

            contextMenus.create(separator);
        }

        if(videoFilters && videoFilters.length > 0)
        {
            const playNow = {
                title: "Play",
                contexts:["link"],
                targetUrlPatterns: videoFilters,
                onclick: this.onPlayClick
            };

            const addToQueue = {
                title: "Queue",
                contexts:["link"],
                targetUrlPatterns: videoFilters,
                onclick: this.onQueueClick
            };

            contextMenus.create(playNow);
            contextMenus.create(addToQueue);
        }
    }

    onPlayClick(info, tab)
    {
        let site = this.getSiteFromLinkUrl(info.linkUrl);
        if(site && typeof site["onPlayClick"] === "function")
        {
            site.onPlayClick(info.linkUrl);
        }
    }

    onQueueClick(info, tab)
    {
        let site = this.getSiteFromLinkUrl(info.linkUrl);
        if(site && typeof site["onQueueClick"] === "function")
        {
            site.onQueueClick(info.linkUrl);
        }
    }

    getSiteFromLinkUrl(linkUrl)
    {
        let site = null;
        if(linkUrl)
        {
            linkUrl = linkUrl.toLowerCase();
            Object.entries(this.siteFilters).some((item, index) =>
            {
                const key = item[0];
                const value = item[1];
                if(linkUrl.indexOf(key) >= 0)
                {
                    site = value.site;
                    return true;
                }
            });
        }
        return site;
    }
}

let contextMenu = new ContextMenu();
let kodiConf = new KodiConfig();

let player = new Player(kodiConf);