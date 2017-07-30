;(function()
{

    const onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
    onMessage.addListener(function(data, sender, sendResponse)
    {
        data = data || {};
        sendResponse = sendResponse || function() {};

        const messageType = data.message;

        if(messageType == "getContentId") {
            let div = document.querySelectorAll("figure[data-id]")[0];
            let contentId = div ? div.getAttribute("data-id") : null;
            sendResponse({contentId: contentId});
        }
    });

})();