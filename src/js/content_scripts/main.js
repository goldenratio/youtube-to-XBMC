/**
 * Content Script
 */
;(function()
{
    "use strict";

    iziToast.settings({
        timeout: 2000,
        resetOnHover: false,
        pauseOnHover: false,
        messageLineHeight: 30
    });

    class ToastUtil
    {
        static queueVideo(isSuccess)
        {
            if (isSuccess) {
                iziToast.success({
                    message: "Added to Queue"
                });
            }
            else {
                iziToast.error({
                    message: "Error! Unable to Add to Queue"
                });
            }
        }

        static playVideo(isSuccess)
        {
            if (isSuccess) {
                iziToast.success({
                    message: "Video Playing Now"
                });
            }
            else {
                iziToast.error({
                    message: "Error! Playing Video"
                });
            }
        }

        static playList(isSuccess)
        {
            if (isSuccess) {
                iziToast.success({
                    message: "Playlist Playing"
                });
            }
            else
            {
                iziToast.error({
                    message: "Error! Unable to Play Playlist"
                });
            }
        }

        static queuePlayList(isSuccess)
        {
            if (isSuccess) {
                iziToast.success({
                    message: "Playlist Added to Queue"
                });
            }
            else {
                iziToast.error({
                    message: "Error! Unable to Add Playlist to Queue"
                });
            }
        }

        static invalidUrl()
        {
            iziToast.error({
                message: "Error! Invalid URL"
            });
        }
    }


    const onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
    onMessage.addListener(function(data, sender, sendResponse)
    {
        const messageType = data.message;
        const isSuccess = data.success;
        const customMessage = data.customMessage;

        let valid = false;

        if(customMessage)
        {
            iziToast.info({
                message: customMessage,
                timeout: 5000,
                pauseOnHover: true
            });
            valid = true;
        }
        else if(messageType == "playVideo")
        {
            ToastUtil.playVideo(isSuccess);
            valid = true;
        }
        else if(messageType == "queueVideo")
        {
            ToastUtil.queueVideo(isSuccess);
            valid = true;
        }
        else if(messageType == "playList")
        {
            ToastUtil.playList(isSuccess);
            valid = true;
        }
        else if(messageType == "queuePlayList")
        {
            ToastUtil.queuePlayList(isSuccess);
            valid = true;
        }
        else if(messageType == "invalidUrl")
        {
            ToastUtil.invalidUrl();
            valid = true;
        }

        if(valid) {
            sendResponse({message: "roger that!"});
        }
    });

})();