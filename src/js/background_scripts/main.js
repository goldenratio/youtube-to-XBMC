/**
 * Background Script
 * Kassi Share
 */


var browserAction = new BrowserAction();

var kodiConf = new KodiConfig();
var player = new Player(kodiConf);
var contextMenu = new ContextMenu(kodiConf);


chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        console.log("extension installed");
        // open settings
        chrome.tabs.create({url: chrome.extension.getURL("settings.html")}, ()=> {

        });
    }
});


function updateConf()
{
    chrome.storage.local.get(conf => {

        if(conf) {
            console.log(conf);
            kodiConf.hostName = conf.host || kodiConf.hostName;
            kodiConf.port = conf.port || kodiConf.port;
            kodiConf.username = conf.username || kodiConf.username;
            kodiConf.password = conf.password || kodiConf.password;
            kodiConf.name = conf.name || kodiConf.name;

            contextMenu.setKodiName(kodiConf.name);
        }
    });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
    updateConf();
});

updateConf();