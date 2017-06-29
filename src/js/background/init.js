/**
 * Background Script
 * Kassi Share
 */

var contextMenus = chrome.contextMenus || browser.contextMenus || {};

function sendMessageToContentScript(data)
{
    return new Promise((resolve, reject) => {

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tabValid = tabs && tabs.length > 0;
            if(tabValid)
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

            let data = {
                jsonrpc: "2.0",
                method: method,
                id: 1
            };

            if(params)
            {
                data.params = params;
            }

            console.log("<< " + method, data);
            thisObject.isPending = true;

            let strData = JSON.stringify(data);

            let urlRequest = new URLRequest(thisObject.kodiConf.url);
            urlRequest.method = "POST";

            urlRequest.send(strData).then((response) => {

                thisObject.isPending = false;

                const data = JSON.parse(response);
                console.log(">> " + method, data);
                if(data.error) {
                    reject(data);
                }
                else {
                    resolve(data);
                }

            }).catch(() => {
                thisObject.isPending = false;
                reject();
            });


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
                            this._playFromPlaylist().then((response) => {
                                resolve(response);
                            }).catch(() => {
                                reject();
                            });
                        }
                        else
                        {
                            resolve(response);
                        }
                    }).catch(() => {
                        reject();
                    });
                }
                else
                {
                    reject();
                }
            }).catch(() => {
                reject();
            });

        });

    }

    _errorPlayingVideo()
    {
        console.log("error playing video");
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
        console.log("play video, " + file);

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

        this._clearPlaylist().then((response) => {
            this._addToPlaylist(file).then((response) => {
                this._playFromPlaylist().then((response) => {

                    console.log("video playing, ", response);
                    const data = {message: "playVideo", status: ResultData.OK};
                    sendMessageToContentScript(data);

                }).catch(this._errorPlayingVideo);
            }).catch(this._errorPlayingVideo);
        }).catch(this._errorPlayingVideo);
    }

    queueVideo(file)
    {
        console.log("queue file " + file);

        if(!file)
        {
            const data = {message: "invalidUrl"};
            sendMessageToContentScript(data);
            return;
        }

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
        console.log("play all ", files);
        if(!files || files.length == 0)
        {
            const data = {message: "invalidUrl"};
            sendMessageToContentScript(data);
            return;
        }

        //this.playVideo()

    }

    queueAll(files)
    {
        console.log("queue all ", files);
        if(!files || files.length == 0)
        {
            const data = {message: "invalidUrl"};
            sendMessageToContentScript(data);
            return;
        }


    }
}

class ContextMenu
{
    constructor()
    {
        this.siteFilters = {};
        this._onPlayClick = this._onPlayClick.bind(this);
        this._onQueueClick = this._onQueueClick.bind(this);
        this._onPlayAllClick = this._onPlayAllClick.bind(this);
        this._onQueueAllClick = this._onQueueAllClick.bind(this);
    }

    addFilters(siteName, site, videoFilters, playlistFilters = null)
    {
        this.siteFilters[siteName] = {
            videoFilters: videoFilters,
            playlistFilters: playlistFilters,
            site: site
        };

        this._updateMenuEntries();
    }

    _updateMenuEntries()
    {
        contextMenus.removeAll(() => {
            // callback
        });


        let videoFilters = Object.entries(this.siteFilters)
            .map((item) => {
                return item[1].videoFilters;
            })
            .filter((data) => {
                return data != null;
            });
        videoFilters = [].concat.apply([], videoFilters);

        if(videoFilters && videoFilters.length > 0)
        {
            const playNow = {
                title: "Play",
                contexts:["link"],
                targetUrlPatterns: videoFilters,
                onclick: this._onPlayClick
            };

            const addToQueue = {
                title: "Queue",
                contexts:["link"],
                targetUrlPatterns: videoFilters,
                onclick: this._onQueueClick
            };

            contextMenus.create(playNow);
            contextMenus.create(addToQueue);
        }

        let playListFilters = Object.entries(this.siteFilters)
            .map((item) => {
                return item[1].playlistFilters;
            })
            .filter((data) => {
                return data != null;
            });
        playListFilters = [].concat.apply([], playListFilters);

        if(playListFilters && playListFilters.length > 0)
        {
            const playAll = {
                title: "Play All",
                contexts:["link"],
                targetUrlPatterns: playListFilters,
                onclick: this._onPlayAllClick
            };

            const queueAll = {
                title: "Queue All",
                contexts:["link"],
                targetUrlPatterns: playListFilters,
                onclick: this._onQueueAllClick
            };

            contextMenus.create(playAll);
            contextMenus.create(queueAll);
        }
    }

    _onPlayClick(info, tab)
    {
        let site = this._getSiteFromLinkUrl(info.linkUrl);
        if(site && typeof site["onPlayClick"] === "function")
        {
            site.onPlayClick(info.linkUrl);
        }
    }

    _onQueueClick(info, tab)
    {
        let site = this._getSiteFromLinkUrl(info.linkUrl);
        if(site && typeof site["onQueueClick"] === "function")
        {
            site.onQueueClick(info.linkUrl);
        }
    }

    _onPlayAllClick(info, tab)
    {
        let site = this._getSiteFromLinkUrl(info.linkUrl);
        if(site && typeof site["onPlayAllClick"] === "function")
        {
            site.onPlayAllClick(info.linkUrl);
        }
    }

    _onQueueAllClick(info, tab)
    {
        let site = this._getSiteFromLinkUrl(info.linkUrl);
        if(site && typeof site["onQueueAllClick"] === "function")
        {
            site.onQueueAllClick(info.linkUrl);
        }
    }

    _getSiteFromLinkUrl(linkUrl)
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

class URLRequest
{
    constructor(url)
    {
        this._url = url;
        this._contentType = "application/json";
        this._method = "GET";
    }

    set contentType(value)
    {
        this._contentType = value;
    }

    set method(value)
    {
        this._method = value;
    }

    send(data = "")
    {
        //console.log("send url request " + this._url);
        return new Promise((reslove, reject) => {

            let xhr = new XMLHttpRequest();
            xhr.open(this._method, this._url, true);
            xhr.setRequestHeader("Content-type", this._contentType);

            xhr.onreadystatechange = function() {
                //console.log("this.readyState, " + this.readyState + ", " + this.status);
            };

            xhr.onerror = function() {
                reject();
            };

            xhr.onload = function () {
                const isSuccess = (this.status == 200);
                if(isSuccess)
                {
                    reslove(this.responseText);
                }
                else
                {
                    reject();
                }
            };

            xhr.send(data);
        });
    }
}

class AbstractSite
{
    constructor()
    {

    }

    onPlayClick(url)
    {
        console.log("play click " + url);

        this.getFileFromUrl(url).then((fileUrl) => {
            player.playVideo(fileUrl);
        });
    }

    onQueueClick(url)
    {
        console.log("onQueueClick " + url);

        this.getFileFromUrl(url).then((fileUrl) => {
            player.queueVideo(fileUrl);
        });

    }

    onPlayAllClick(url)
    {
        console.log("play all click " + url);

        this.getPlaylistFromUrl(url).then((fileList) => {
            player.playAll(fileList);
        });

    }

    onQueueAllClick(url)
    {
        console.log("queue all click " + url);

        this.getPlaylistFromUrl(url).then((fileList) => {
            player.queueAll(fileList);
        });
    }

    getFileFromUrl(url)
    {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    getPlaylistFromUrl(url)
    {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }
}

let contextMenu = new ContextMenu();
let kodiConf = new KodiConfig();

let player = new Player(kodiConf);