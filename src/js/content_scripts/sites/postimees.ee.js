;(function()
{
    let videoId = getVideoId();

    const onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
    onMessage.addListener(function(data, sender, sendResponse)
    {
        data = data || {};
        sendResponse = sendResponse || function() {};

        const messageType = data.message;
        if(messageType == "getVideoId") {
            sendResponse({videoId: videoId});
        }
    });

    function getVideoId()
    {
        let tagList = [... document.getElementsByTagName("video-block")];

        for(let tag of tagList) {
            let videoValue = tag.getAttribute("video");
            if(videoValue) {
                return videoValue;
            }
        }

        return null;
    }

})();