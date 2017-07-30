;(function()
{

    const onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
    onMessage.addListener(function(data, sender, sendResponse)
    {
        data = data || {};
        sendResponse = sendResponse || function() {};

        const messageType = data.message;

        if(messageType == "getVideoUrl") {
            let scriptList = [...document.scripts];
            let videoUrl;

            for (let script of scriptList) {
                let scriptSource = script.textContent;
                if(scriptSource.indexOf("talkPage.init") >= 0 && scriptSource.indexOf(".mp4") >= 0)
                {
                    scriptSource = scriptSource.replace('q("talkPage.init", ', '');
                    scriptSource = scriptSource.slice(0, -1);

                    let parsedData;
                    try {
                        parsedData = JSON.parse(scriptSource);
                    } catch (err) {
                        continue;
                    }

                    let initialData = parsedData["__INITIAL_DATA__"] || {};
                    let internalData = initialData["media"] ? initialData["media"]["internal"] : {};
                    let media = internalData["1500k"] ||
                        internalData["950k"] ||
                        internalData["600k"] ||
                        internalData["450k"] ||
                        internalData["320k"] ||
                        internalData["180k"] ||
                        internalData["64k"] || {};

                    videoUrl = media["uri"] || null;
                    if(videoUrl) {
                        break;
                    }
                }
            }

            sendResponse({videoUrl: videoUrl});
        }
    });

})();