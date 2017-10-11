;(function(player)
{

    class DefaultSite extends AbstractSite
    {
        constructor(player)
        {
            super(player);
            console.log("DefaultSite");

            let customExtensions = [
                "/videoplayback?"
            ];

            let videoExtensions = [
                "mp4",
                "mov",
                "webm",
                "3gp",
                "flv",
                "avi",
                "ogv",
                "wmv",
                "asf",
                "mkv",
                "m4v"
            ];

            let audioExtensions = [
                "mp3",
                "ogg",
                "midi",
                "wav",
                "aiff",
                "aac",
                "flac",
                "ape",
                "wma",
                "m4a",
                "mka"
            ];

            let validExtensions = [... videoExtensions, ... audioExtensions];

            let contextMenuFilterList = [];
            let browserActionFilterList = [];

            for (let extension of validExtensions) {
                let contextItem = "*://*/*." + extension + "*";
                contextMenuFilterList.push(contextItem);

                let actionItem = ".*\\." + extension + ".*";
                browserActionFilterList.push(actionItem);
            }

            for (let extension of customExtensions) {
                let actionItem = ".*" + extension + ".*";
                browserActionFilterList.push(actionItem);
            }

            contextMenu.addSite("default", this, contextMenuFilterList);
            browserAction.addSite("default", this, browserActionFilterList);
        }

        getFileFromUrl(url)
        {
            return new Promise((resolve, reject) => {
                resolve(url);
            });
        }

    }

    new DefaultSite(player)
})(player);