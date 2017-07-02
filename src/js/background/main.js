/**
 * Background Script
 * Kassi Share
 */

var contextMenus = chrome.contextMenus || browser.contextMenus || {};
var onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};

function _sendMessageToContentScript(data, callbackSuccessFn = null, callbackErrorFn = null)
{
    callbackSuccessFn = callbackSuccessFn || function() {};
    callbackErrorFn = callbackErrorFn || function() {};

    chrome.tabs.query({active: true, currentWindow: true}, tabs => {

        const tabValid = tabs && tabs.length > 0;
        if(tabValid) {
            let selectedTab = tabs[0];
            const options = {
                frameId: 0
            };

            chrome.tabs.sendMessage(selectedTab.id, data, options, response => {
                // message sent to contentScript
                console.log("message send to tab ", selectedTab, " ", response);
                callbackSuccessFn(response);
            });
        }
        else {
            callbackErrorFn();
        }
    });
}

function sendMessageToContentScript(data)
{
    return new Promise((resolve, reject) => {
        _sendMessageToContentScript(data, response => {
            response = response || {};
            resolve(response);
        }, () => {
            reject();
        });
    });
}

function getCurrentTabUrl() {
    return new Promise((resolve, reject) => {

        chrome.tabs.query({active: true, lastFocusedWindow: true, windowType: "normal"}, tabs => {
            const url = tabs && tabs.length > 0 ? tabs[0].url : null;
            if(url) {
                resolve(url);
            }
            else {
                reject();
            }
        });

    });
}

function safeFn(fn, data)
{
    try {
        fn(data);
    } catch (err) {
        console.log(err);
    }
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

    addSite(siteName, site, videoFilters, playlistFilters = null)
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
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl(url) || this.siteFilters["default"].site;

        if(site && typeof site["onPlayClick"] === "function")
        {
            site.onPlayClick(url);
        }
    }

    _onQueueClick(info, tab)
    {
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl(url) || this.siteFilters["default"].site;
        if(site && typeof site["onQueueClick"] === "function")
        {
            site.onQueueClick(url);
        }
    }

    _onPlayAllClick(info, tab)
    {
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl(url) || this.siteFilters["default"].site;
        if(site && typeof site["onPlayAllClick"] === "function")
        {
            site.onPlayAllClick(url);
        }
    }

    _onQueueAllClick(info, tab)
    {
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl(url) || this.siteFilters["default"].site;
        if(site && typeof site["onQueueAllClick"] === "function")
        {
            site.onQueueAllClick(url);
        }
    }

    _getSiteFromLinkUrl(linkUrl)
    {
        console.log("linkUrl " + linkUrl);
        if(!linkUrl) {
            return null;
        }

        let site = null;
        linkUrl = linkUrl.toLowerCase();
        Object.entries(this.siteFilters).some((item, index) => {
            const key = item[0];
            const value = item[1];
            if(linkUrl.indexOf(key) >= 0)
            {
                site = value.site;
                return true;
            }
        });
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
        const success = status == ResultData.OK;
        const data = {message: "playVideo", success: success, customMessage: customMessage};
        sendMessageToContentScript(data);
    }

    _messageQueueVideo(status, customMessage = "")
    {
        const success = status == ResultData.OK;
        const data = {message: "queueVideo", success: success, customMessage: customMessage};
        sendMessageToContentScript(data);
    }

    _messagePlaylist(status, customMessage = "")
    {
        const success = status == ResultData.OK;
        const data = {message: "playList", success: success, customMessage: customMessage};
        sendMessageToContentScript(data);
    }

    _messageQueueAll(status, customMessage = "")
    {
        const success = status == ResultData.OK;
        const data = {message: "queuePlayList", success: success, customMessage: customMessage};
        sendMessageToContentScript(data);
    }

    onPlayClick(url)
    {
        console.log("play click " + url);

        return new Promise((resolve, reject) => {

            this.getFileFromUrl(url)
                .then(fileUrl => {
                    return player.playVideo(fileUrl);
                })
                .then(response => {
                    response = response || {};
                    this._messagePlayVideo(ResultData.OK, response.message);
                    resolve();
                }).catch(response => {
                    response = response || {};
                    console.log("err playing video ", response);
                    this._messagePlayVideo(ResultData.ERROR, response.message);
                    reject();
                });

        });

    }

    onQueueClick(url)
    {
        console.log("onQueueClick " + url);
        return new Promise((resolve, reject) => {

            this.getFileFromUrl(url)
                .then(fileUrl => {
                    return player.queueVideo(fileUrl);
                })
                .then(response => {
                    response = response || {};
                    this._messageQueueVideo(ResultData.OK, response.message);
                    resolve();
                })
                .catch(response => {
                    response = response || {};
                    this._messageQueueVideo(ResultData.ERROR, response.message);
                    reject();
                });

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

class BrowserAction
{
    constructor()
    {
        this.siteFilters = {};
    }

    addSite(siteName, site, urlPatterns)
    {
        this.siteFilters[siteName] = {
            urlPatterns: urlPatterns,
            site: site
        };
    }

    canEnable(tabUrl)
    {
        let site = this._getSiteFromTabUrl(tabUrl);
        return site != null;
    }

    play(tabUrl)
    {
        let site = this._getSiteFromTabUrl(tabUrl);
        console.log(site);

        if(site && typeof site["onPlayClick"] === "function") {
            return site.onPlayClick(tabUrl);
        }
        else {
            return Promise.reject();
        }
    }

    queue(tabUrl)
    {
        let site = this._getSiteFromTabUrl(tabUrl);
        console.log(site);
        if(site && typeof site["onQueueClick"] === "function") {
            return site.onQueueClick(tabUrl);
        }
        else {
            return Promise.reject();
        }
    }

    _getSiteFromTabUrl(tabUrl)
    {
        //console.log("_getSiteFromTabUrl " + tabUrl);
        if(!tabUrl) {
            return null;
        }

        let site = null;
        tabUrl = tabUrl.toLowerCase();
        Object.entries(this.siteFilters).some((item, index) => {
            const key = item[0];
            const value = item[1];
            const patterns = value.urlPatterns;

            const matches = Utils.urlMatchesOneOfPatterns(tabUrl, patterns);
            if(matches) {
                site = value.site;
                return true;
            }
        });
        return site;
    }
}

var kodiConf = new KodiConfig();

var contextMenu = new ContextMenu(kodiConf);
var browserAction = new BrowserAction();
var player = new Player(kodiConf);

onMessage.addListener(function(data, sender, sendResponse)
{
    //console.log(data);
    data = data || {};
    let message = data.message;

    if(message == "getButtonStatus")
    {
        getCurrentTabUrl().then(url => {
            const enable = browserAction.canEnable(url);
            safeFn(sendResponse, {success: enable});
        }).catch(response => {
            safeFn(sendResponse, {success: false});
        });
    }
    else if(message == "playNowFromPopup")
    {
        getCurrentTabUrl().then(url => {
            return browserAction.play(url);
        }).then(response => {
            safeFn(sendResponse, {success: true});
        }).catch(response => {
            safeFn(sendResponse, {success: false});
        });
    }
    else if(message == "queueFromPopup")
    {
        getCurrentTabUrl().then(url => {
            return browserAction.queue(url);
        }).then(response => {
            safeFn(sendResponse, {success: true});
        }).catch(response => {
            safeFn(sendResponse, {success: false});
        });
    }
    else if(message == "openSettings")
    {
        chrome.tabs.create({url: chrome.extension.getURL("settings.html")}, ()=> {});
    }

    return true;
});
