;(function()
{
    "use strict";

    function getSrcFromTag(tag) {
        if(tag) {
            const srcUrl = tag.getAttribute("data-hd-src") || tag.getAttribute("src");
            const validUrl = srcUrl && srcUrl.indexOf("blob:") == -1;
            if(validUrl) {
                return srcUrl;
            }
        }
        return null;
    }


    function geMediaSrcUrl() {
        let videoTagCollection = document.getElementsByTagName("video");
        let audioTagCollection = document.getElementsByTagName("audio");

        let mediaTags = [...videoTagCollection, ...audioTagCollection];
        for(let media of mediaTags) {

            const srcUrl = getSrcFromTag(media);
            if(srcUrl) {
                return srcUrl;
            }

            let sourceTags = media.getElementsByTagName("source");
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

        if(message == "getPageMediaTagSource") {

            let mediaUrl = geMediaSrcUrl();
            if(mediaUrl && mediaUrl.indexOf("//") == 0) {
                mediaUrl = window.location.protocol + mediaUrl;
            }

            let timeOutVal = mediaUrl ? 0 : 50;
            setTimeout(() => {
                //console.log("got " + message, mediaUrl + ", tabURL " + window.location.href);
                sendResponse({mediaUrl: mediaUrl});
            }, timeOutVal);

            return true;
        }

    });


})();