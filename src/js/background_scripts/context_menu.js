var chromeContextMenus = chrome.contextMenus || browser.contextMenus || {};

class ContextMenu
{
    constructor(kodiConfig)
    {
        this.kodiConfig = kodiConfig;
        this.siteFilters = {};
        this.kodiNameId = NaN;
        this._onPlayClick = this._onPlayClick.bind(this);
        this._onQueueClick = this._onQueueClick.bind(this);
        this._onPlayAllClick = this._onPlayAllClick.bind(this);
        this._onQueueAllClick = this._onQueueAllClick.bind(this);
    }

    addSite(siteName, site, videoFilters, playlistFilters = null)
    {
        this.siteFilters[siteName] = {
            videoFilters: videoFilters,
            playlistFilters: playlistFilters,
            site: site
        };

        this._updateMenuEntries();
    }

    setKodiName(name)
    {
        if(!isNaN(this.kodiNameId)) {

            const kodiName = {
                title: this.kodiConfig.name
            };

            chromeContextMenus.update(this.kodiNameId, kodiName);
        }
    }

    _updateMenuEntries()
    {
        chromeContextMenus.removeAll(() => {
            // callback
        });


        let videoFilters = Object.entries(this.siteFilters)
            .map((item) => {
                return item[1].videoFilters;
            })
            .filter((data) => {
                return data != null;
            });
        videoFilters = [].concat.apply([], videoFilters);

        let playListFilters = Object.entries(this.siteFilters)
            .map((item) => {
                return item[1].playlistFilters;
            })
            .filter((data) => {
                return data != null;
            });
        playListFilters = [].concat.apply([], playListFilters);

        const hasVideo = videoFilters && videoFilters.length > 0;
        const hasPlaylist = playListFilters && playListFilters.length > 0;

        if(hasVideo || hasPlaylist) {

            let filter = videoFilters.concat(playListFilters);
            const kodiName = {
                title: this.kodiConfig.name || "Kodi",
                type: "checkbox",
                checked: true,
                enabled: false,
                contexts:["link", "video"],
                targetUrlPatterns: filter
            };
            this.kodiNameId = chromeContextMenus.create(kodiName);

            const separator = {
                type: "separator",
                contexts:["link", "video"],
                targetUrlPatterns: filter
            };
            chromeContextMenus.create(separator);
        }


        if(hasVideo) {
            const playNow = {
                title: "Play",
                contexts:["link", "video"],
                targetUrlPatterns: videoFilters,
                onclick: this._onPlayClick
            };

            const addToQueue = {
                title: "Add to Queue",
                contexts:["link", "video"],
                targetUrlPatterns: videoFilters,
                onclick: this._onQueueClick
            };

            chromeContextMenus.create(playNow);
            chromeContextMenus.create(addToQueue);
        }

        if(hasPlaylist) {
            const playAll = {
                title: "Play All",
                contexts:["link"],
                targetUrlPatterns: playListFilters,
                onclick: this._onPlayAllClick
            };

            const queueAll = {
                title: "Add All to Queue",
                contexts:["link"],
                targetUrlPatterns: playListFilters,
                onclick: this._onQueueAllClick
            };

            chromeContextMenus.create(playAll);
            chromeContextMenus.create(queueAll);
        }
    }

    _onPlayClick(info, tab)
    {
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl(url) || this.siteFilters["default"].site;

        if(site && typeof site["onPlayClick"] === "function")
        {
            site.onPlayClick(url);
        }
    }

    _onQueueClick(info, tab)
    {
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl(url) || this.siteFilters["default"].site;
        if(site && typeof site["onQueueClick"] === "function")
        {
            site.onQueueClick(url);
        }
    }

    _onPlayAllClick(info, tab)
    {
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl(url) || this.siteFilters["default"].site;
        if(site && typeof site["onPlayAllClick"] === "function")
        {
            site.onPlayAllClick(url);
        }
    }

    _onQueueAllClick(info, tab)
    {
        let url = info.linkUrl || info.srcUrl;
        let site = this._getSiteFromLinkUrl(url) || this.siteFilters["default"].site;
        if(site && typeof site["onQueueAllClick"] === "function")
        {
            site.onQueueAllClick(url);
        }
    }

    _getSiteFromLinkUrl(linkUrl)
    {
        console.log("linkUrl " + linkUrl);
        if(!linkUrl) {
            return null;
        }

        let site = null;
        linkUrl = linkUrl.toLowerCase();
        Object.entries(this.siteFilters).some((item, index) => {
            const key = item[0];
            const value = item[1];
            if(linkUrl.indexOf(key) >= 0)
            {
                site = value.site;
                return true;
            }
        });
        return site;
    }
}
