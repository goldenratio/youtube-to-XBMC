;(function(browserAction)
{
    function safeFn(fn, data)
    {
        try {
            fn(data);
        } catch (err) {
            console.log(err);
        }
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

    function getPageMediaTagSrcUrl() {
        return new Promise((resolve, reject) => {
            sendMessageToContentScript({message: "getPageMediaTagSource"}).then(response => {
                response = response || {};
                const mediaUrl = response.mediaUrl;
                console.log("getPageMediaTagSrcUrl " + mediaUrl);
                const hasMedia = typeof mediaUrl === "string";
                hasMedia ? resolve(mediaUrl) : reject();
            });
        });
    }

    const onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
    onMessage.addListener(function(data, sender, sendResponse)
    {
        sendResponse = sendResponse || function() {};
        data = data || {};
        let message = data.message;

        console.log("message received " + message);
        if(message == "getButtonStatus")
        {
            getCurrentTabUrl()
                .then(url => {
                    const enable = browserAction.canEnable(url);
                    if(!enable) {
                        return getPageMediaTagSrcUrl();
                    }
                    safeFn(sendResponse, {success: enable});
                })
                .catch(response => {
                    return getPageMediaTagSrcUrl();
                })
                .then(url => {
                    safeFn(sendResponse, {success: true});
                })
                .catch(response => {
                    safeFn(sendResponse, {success: false});
                });
        }
        else if(message == "playNowFromPopup")
        {
            getCurrentTabUrl()
                .then(url => {
                    return browserAction.play(url);
                })
                .then(response => {
                    safeFn(sendResponse, {success: true});
                })
                .catch(response => {
                    return getPageMediaTagSrcUrl();
                })
                .then(url => {
                    return browserAction.play(url);
                })
                .then(response => {
                    safeFn(sendResponse, {success: true});
                })
                .catch(response => {
                    safeFn(sendResponse, {success: false});
                });
        }
        else if(message == "queueFromPopup")
        {
            getCurrentTabUrl()
                .then(url => {
                    return browserAction.queue(url);
                })
                .then(response => {
                    safeFn(sendResponse, {success: true});
                })
                .catch(response => {
                    return getPageMediaTagSrcUrl();
                })
                .then(url => {
                    return browserAction.queue(url);
                })
                .then(response => {
                    safeFn(sendResponse, {success: true});
                })
                .catch(response => {
                    safeFn(sendResponse, {success: false});
                });
        }
        else if(message == "openSettings")
        {
            chrome.tabs.create({url: chrome.extension.getURL("settings.html")}, ()=> {
                safeFn(sendResponse, {success: true});
            });
        }
        else
        {
            console.info("unknown message received " + message, data);
        }

        return true;
    });

})(browserAction);