class AbstractSite
{
    /**
     * @param player {Player}
     */
    constructor(player)
    {
        this.player = player;
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
        console.log("play click " + url, this.player);

        return new Promise((resolve, reject) => {

            this.getFileFromUrl(url)
                .then(fileUrl => {
                    return this.player.playVideo(fileUrl);
                })
                .then(response => {
                    response = response || {};
                    this._messagePlayVideo(ResultData.OK, response.message);
                    resolve();
                })
                .catch(response => {
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
                    return this.player.queueVideo(fileUrl);
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
                return this.player.playAll(fileList);
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
                return this.player.queueAll(fileList);
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

    getSubtitleFiles(url)
    {
        return new Promise((resolve, reject) => {
            reject();
        });
    }
}


// ------------

function _sendMessageToContentScript(data, callbackSuccessFn = null, callbackErrorFn = null)
{
    callbackSuccessFn = callbackSuccessFn || function() {};
    callbackErrorFn = callbackErrorFn || function() {};

    chrome.tabs.query({active: true, currentWindow: true}, tabs => {

        const tabValid = tabs && tabs.length > 0;
        if(tabValid) {
            let selectedTab = tabs[0];
            const options = {};
            console.log("sending data ", data, ", selected tab ", selectedTab);
            let sendMessage = chrome.tabs.sendMessage || function(){};
            sendMessage(selectedTab.id, data, options, response => {
                // response back from Tab
                console.log("response from content tab << ", response, ", typeof " + typeof response);
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
