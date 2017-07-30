;(function()
{

    const onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
    onMessage.addListener(function(data, sender, sendResponse)
    {
        data = data || {};
        sendResponse = sendResponse || function() {};

        const messageType = data.message;

        if(messageType == "getVideoId") {
            let playerDiv = document.getElementById("video-player");
            let videoId = playerDiv ? playerDiv.getAttribute("data-video-id") : null;
            sendResponse({videoId: videoId});
        }
    });

})();