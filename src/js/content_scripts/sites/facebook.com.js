;(function()
{

    const onMessage = chrome.extension.onMessage || chrome.runtime.onMessage || function(){};
    onMessage.addListener(function(data, sender, sendResponse)
    {
        data = data || {};
        sendResponse = sendResponse || function() {};

        const messageType = data.message;

        if(messageType == "getFacebookVideoSourceUrl") {
            let scriptList = [...document.scripts];

            for (let script of scriptList) {
                const scriptSource = script.innerText;
                if(scriptSource.indexOf("hd_src_no_ratelimit:") >= 0 || scriptSource.indexOf("sd_src_no_ratelimit:") >= 0)
                {
                    let url = _getUrl(scriptSource, "hd_src_no_ratelimit:");
                    if(!url) {
                        url = _getUrl(scriptSource, "sd_src_no_ratelimit:");
                    }

                    //console.log("videoUrl " + url);
                    sendResponse({videoUrl: url});
                    return;
                }
            }
        }
    });

    function _getUrl(scriptSource, keyString) {

        let parts = scriptSource.split(keyString);
        let first = parts && parts.length >= 2 ? parts[1] : null;
        let second = first.split('"');
        let url = second && second.length >= 2 ? second[1] : null;

        return url;
    }

})();