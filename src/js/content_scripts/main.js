/**
 * Content Script
 */

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

    if(customMessage)
    {
        iziToast.info({
            message: customMessage,
            timeout: 5000,
            pauseOnHover: true
        });
    }
    else if(messageType == "playVideo")
    {
        ToastUtil.playVideo(isSuccess);
    }
    else if(messageType == "queueVideo")
    {
        ToastUtil.queueVideo(isSuccess);
    }
    else if(messageType == "playList")
    {
        ToastUtil.playList(isSuccess);
    }
    else if(messageType == "queuePlayList")
    {
        ToastUtil.queuePlayList(isSuccess);
    }
    else if(messageType == "invalidUrl")
    {
        ToastUtil.invalidUrl();
    }
    return true;
});