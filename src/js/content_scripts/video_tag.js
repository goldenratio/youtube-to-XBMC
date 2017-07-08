;(function()
{
    "use strict";

    function getSrcFromTag(tag) {
        if(tag) {
            const srcUrl = tag.getAttribute("data-hd-src") || tag.getAttribute("src");
            const validUrl = srcUrl && srcUrl.indexOf("blob:") < 0;
            if(validUrl) {
                return srcUrl;
            }
        }
        return null;
    }


    function getVideoSrcUrl() {
        let videoTagCollection = document.getElementsByTagName("video");
        for(let video of videoTagCollection) {

            const srcUrl = getSrcFromTag(video);
            if(srcUrl) {
                return srcUrl;
            }

            let sourceTags = video.getElementsByTagName("source");
            for (let source of sourceTags) {
                const srcUrl = getSrcFromTag(source);
                if(srcUrl) {
                    return srcUrl;
                }
            }
        }
        return null;
    }

    var onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
    onMessage.addListener(function(data, sender, sendResponse) {

        //console.log(data , sender);
        sendResponse = sendResponse || function() {};
        data = data || {};
        let message = data.message;

        if(message == "getPageVideoTagSource") {

            const videoUrl = getVideoSrcUrl();
            //console.log("got getPageVideoTagSource ", videoUrl);
            sendResponse({videoUrl: videoUrl})
        }

    });


})();