;(function()
{
    "use strict";

    function getSrcFromTag(tag) {
        const tagVisible = tag && tag.offsetWidth > 0 && tag.offsetHeight > 0;
        if(tagVisible) {
            let mediaType = tag.getAttribute("type") || "video";
            mediaType = mediaType.toLowerCase();
            const isMedia = mediaType.indexOf("video") >= 0 || mediaType.indexOf("audio") >= 0;

            const srcUrl = tag.getAttribute("data-hd-src") || tag.getAttribute("src");
            const validUrl = isMedia && srcUrl && srcUrl.indexOf("blob:") == -1;
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

            let sourceTags = [... media.getElementsByTagName("source")];
            sourceTags = sourceTags.reverse();
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