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

    var onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
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
            chrome.tabs.create({url: chrome.extension.getURL("settings.html")}, ()=> {
                safeFn(sendResponse, {success: true});
            });
        }
        /*else if(message == "settingsChanged")
        {
            console.log("settings changed");
            let conf = data.kodiConf;
            updateConf(conf);

            safeFn(sendResponse, {success: true});
        }*/

        return true;
    });

})(browserAction);