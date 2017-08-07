;(function()
{
    "use strict";

    function getSrcFromTag(tag) {
        if(tag) {
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

    function nodeVisible(node) {
        return node && node.offsetWidth > 0 && node.offsetHeight > 0;
    }


    function geMediaSrcUrl() {

        let noscripts = [... document.getElementsByTagName("noscript")]
            .map(function(node) {

                function htmlDecode(input){
                    var e = document.createElement("div");
                    e.innerHTML = input;
                    return e.childNodes[0].nodeValue;
                }

                let htmlText = htmlDecode(node.innerText.trim());
                let frag = document.createRange().createContextualFragment(htmlText);
                let media = frag.firstElementChild;
                return media;
            })
            .filter(function(htmlTag) {
                let tagName;
                try {
                    tagName = htmlTag.tagName ? htmlTag.tagName.toLowerCase() : null;
                } catch (err) {}

                return tagName && (tagName == "video" || tagName == "audio");
            });

        let videoTagCollection = [... document.getElementsByTagName("video")]
            .filter(nodeVisible);

        let audioTagCollection = [... document.getElementsByTagName("audio")]
            .filter(nodeVisible);

        let mediaTags = [... videoTagCollection, ... audioTagCollection, ... noscripts];
        for(let media of mediaTags) {

            const srcUrl = getSrcFromTag(media);
            if(srcUrl) {
                return srcUrl;
            }

            let sourceTags = [... media.getElementsByTagName("source")];
            sourceTags = sourceTags.reverse();
            for (let source of sourceTags) {
                const srcTagUrl = getSrcFromTag(source);
                if(srcTagUrl) {
                    return srcTagUrl;
                }
            }
        }

        const player = document.getElementById("player");
        if(player) {
            const playerId = player.getAttribute("data-video-id");
            if(playerId) {
                const varName = "flashvars_" + playerId;
                const flashVar = window[varName];
                if(flashVar) {
                    return flashVar["quality_720p"] || flashVar["quality_480p"] || flashVar["quality_240p"];
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