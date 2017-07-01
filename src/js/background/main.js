/**
 * Background Script
 * Kassi Share
 */

var contextMenus = chrome.contextMenus || browser.contextMenus || {};

function sendMessageToContentScript(data)
{
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const tabValid = tabs && tabs.length > 0;
        //console.log("tabValid " + tabValid + ", ", tabs);
        if(tabValid) {
            let selectedTab = tabs[0];
            chrome.tabs.sendMessage(selectedTab.id, data, function(response) {
                // message sent to contentScript
                console.log("message send to tab ", selectedTab, " " + response);
            });
        }
    });
}

// ---------------------

class KodiConfig
{
    constructor()
    {
        this.name = "kodi";
        this.hostName = "localhost";
        this.port = "8080";
        this.username = "";
        this.password = "";
    }

    get _hasCredentials()
    {
        return this.username && this.password;
    }

    get url()
    {
        const credentials = this._hasCredentials ? `${this.username}:${this.password}@` : "";
        return `http://${credentials}${this.hostName}:${this.port}/jsonrpc`;
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

            urlRequest.send(strData).then(response => {

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

            this._addToPlaylist(file)
                .then(response => {

                    const result = response.result;
                    if(result == ResultData.OK) {
                        return this._getActivePlayers();
                    }
                    return reject();
                })
                .then(response => {

                    const result = response.result;
                    // check if no video is playing and start the first video in queue
                    if(result && result.length <= 0) {
                        return this._playFromPlaylist();
                    }
                })
                .then(response => {
                    resolve(response);
                })
                .catch(() => {
                    reject();
                });

        });

    }

    getPluginVersion(pluginId) {

        const params = {
            addonid: pluginId,
            "properties": ["version"]
        };

        return this.rpc.send("Addons.GetAddonDetails", params);
    }

    playVideo(file)
    {
        return new Promise((resolve, reject) => {

            console.log("play video, " + file);

            // 1. Clear play list
            // 2. Add to playlist
            // 3. Play first index

            this._clearPlaylist()
                .then(response => {
                    return this._addToPlaylist(file);
                })
                .then(response => {
                    return this._playFromPlaylist();
                })
                .then(response => {

                    resolve(response);

                }).catch(() => {
                    reject();
                });

        });
    }

    queueVideo(file)
    {
        return new Promise((resolve, reject) => {

            console.log("queue file " + file);

            // Player.GetActivePlayers (if empty), Playlist.Clear, Playlist.Add(file), Player.GetActivePlayers (if empty), Player.Open(playlist)
            // Player.GetActivePlayers (if playing), Playlist.Add(file), Player.GetActivePlayers (if playing), do nothing

            this._getActivePlayers()
                .then(response => {

                    const result = response.result;
                    if(result && result.length <= 0)
                    {
                        return this._clearPlaylist();
                    }
                })
                .then(response => {
                    return this._queue(file);
                })
                .then(response => {

                    resolve(response);
                })
                .catch(() => {

                    reject();
                });

        });

    }

    async playAll(files)
    {
        console.log("play all ", files);

        const len = files.length;
        let res;
        try {
            res = await this.playVideo(files[0]);
        } catch(err) {
            return reject(err);
        }

        for (let i = 1; i < len; i++)
        {
            try {
                res = await this.queueVideo(files[i]);
            } catch(err) {
                return reject(err);
            }
        }

        return res;
    }

    async queueAll(files)
    {
        console.log("queue all ", files);

        let res;
        const len = files.length;
        for (let i = 0; i < len; i++)
        {
            try {
                res = await this.queueVideo(files[i]);
            } catch(err) {
                return reject(err);
            }
        }

        return res;
    }
}

class ContextMenu
{
    constructor(kodiConfig)
    {
        this.kodiConfig = kodiConfig;
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

        //console.log(site instanceof AbstractSite, site);
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

        let playListFilters = Object.entries(this.siteFilters)
            .map((item) => {
                return item[1].playlistFilters;
            })
            .filter((data) => {
                return data != null;
            });
        playListFilters = [].concat.apply([], playListFilters);

        const hasVideo = videoFilters && videoFilters.length > 0;
        const hasPlaylist = playListFilters && playListFilters.length > 0;

        if(hasVideo || hasPlaylist) {

            let filter = videoFilters.concat(playListFilters);
            const kodiName = {
                title: this.kodiConfig.name,
                type: "checkbox",
                checked: true,
                enabled: false,
                contexts:["link", "video"],
                targetUrlPatterns: filter
            };
            contextMenus.create(kodiName);

            const separator = {
                type: "separator",
                contexts:["link", "video"],
                targetUrlPatterns: filter
            };
            contextMenus.create(separator);
        }


        if(hasVideo) {
            const playNow = {
                title: "Play",
                contexts:["link", "video"],
                targetUrlPatterns: videoFilters,
                onclick: this._onPlayClick
            };

            const addToQueue = {
                title: "Queue",
                contexts:["link", "video"],
                targetUrlPatterns: videoFilters,
                onclick: this._onQueueClick
            };

            contextMenus.create(playNow);
            contextMenus.create(addToQueue);
        }

        if(hasPlaylist) {
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
        //console.log("info.srcUrl "  + info.srcUrl, info);
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl();
        //console.log("site ", site, typeof site["onPlayClick"]);
        if(site && typeof site["onPlayClick"] === "function")
        {
            site.onPlayClick(url);
        }
    }

    _onQueueClick(info, tab)
    {
        let site = this._getSiteFromLinkUrl(info.linkUrl);
        let url = info.linkUrl || info.srcUrl;
        if(site && typeof site["onQueueClick"] === "function")
        {
            site.onQueueClick(url);
        }
    }

    _onPlayAllClick(info, tab)
    {
        let site = this._getSiteFromLinkUrl(info.linkUrl);
        let url = info.linkUrl || info.srcUrl;
        if(site && typeof site["onPlayAllClick"] === "function")
        {
            site.onPlayAllClick(url);
        }
    }

    _onQueueAllClick(info, tab)
    {
        let site = this._getSiteFromLinkUrl(info.linkUrl);
        let url = info.linkUrl || info.srcUrl;
        if(site && typeof site["onQueueAllClick"] === "function")
        {
            site.onQueueAllClick(url);
        }
    }

    _getSiteFromLinkUrl(linkUrl)
    {
        let site = this.siteFilters["default"].site;
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


    _messagePlayVideo(status, customMessage = "")
    {
        const data = {message: "playVideo", status: status, customMessage: customMessage};
        sendMessageToContentScript(data);
    }

    _messageQueueVideo(status, customMessage = "")
    {
        const data = {message: "queueVideo", status: status, customMessage: customMessage};
        sendMessageToContentScript(data);
    }

    _messagePlaylist(status, customMessage = "")
    {
        const data = {message: "playList", status: status, customMessage: customMessage};
        sendMessageToContentScript(data);
    }

    _messageQueueAll(status, customMessage = "")
    {
        const data = {message: "queuePlayList", status: status, customMessage: customMessage};
        sendMessageToContentScript(data);
    }

    onPlayClick(url)
    {
        console.log("play click " + url);

        this.getFileFromUrl(url)
            .then(fileUrl => {
                return player.playVideo(fileUrl);
            })
            .then(response => {
                response = response || {};
                this._messagePlayVideo(ResultData.OK, response.message);
            }).catch(response => {
                response = response || {};
                console.log("err playing video ", response);
                this._messagePlayVideo(ResultData.ERROR, response.message);
            });
    }

    onQueueClick(url)
    {
        console.log("onQueueClick " + url);

        this.getFileFromUrl(url)
            .then(fileUrl => {
                return player.queueVideo(fileUrl);
            })
            .then(response => {
                response = response || {};
                this._messageQueueVideo(ResultData.OK, response.message);
            })
            .catch(response => {
                response = response || {};
                this._messageQueueVideo(ResultData.ERROR, response.message);
            });

    }

    onPlayAllClick(url)
    {
        console.log("play all click " + url);

        this.getPlaylistFromUrl(url)
            .then(fileList => {
                return player.playAll(fileList);
            })
            .then(response => {
                response = response || {};
                this._messagePlaylist(ResultData.OK, response.message);
            })
            .catch(response => {
                response = response || {};
                this._messagePlaylist(ResultData.ERROR, response.message);
            });

    }

    onQueueAllClick(url)
    {
        console.log("queue all click " + url);

        this.getPlaylistFromUrl(url)
            .then(fileList => {
                return player.queueAll(fileList);
            })
            .then(response => {
                response = response || {};
                this._messageQueueAll(ResultData.OK, response.message);
            })
            .catch(response => {
                response = response || {};
                this._messageQueueAll(ResultData.ERROR, response.message);
            });
    }

    getFileFromUrl(url)
    {
        return new Promise((resolve, reject) => {
            reject();
        });
    }

    getPlaylistFromUrl(url)
    {
        return new Promise((resolve, reject) => {
            reject();
        });
    }
}

let kodiConf = new KodiConfig();

let contextMenu = new ContextMenu(kodiConf);
let player = new Player(kodiConf);