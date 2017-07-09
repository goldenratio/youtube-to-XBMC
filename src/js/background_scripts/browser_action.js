class BrowserAction
{
    constructor()
    {
        this.siteFilters = {};
    }

    addSite(siteName, site, urlPatterns)
    {
        this.siteFilters[siteName] = {
            urlPatterns: urlPatterns,
            site: site
        };
    }

    canEnable(tabUrl)
    {
        let site = this._getSiteFromTabUrl(tabUrl);
        return site != null;
    }

    play(tabUrl)
    {
        const site = this._getSiteFromTabUrl(tabUrl);
        if(site && typeof site["onPlayClick"] === "function") {
            return site.onPlayClick(tabUrl);
        }
        else {
            return Promise.reject();
        }
    }

    queue(tabUrl)
    {
        let site = this._getSiteFromTabUrl(tabUrl);
        console.log(site);
        if(site && typeof site["onQueueClick"] === "function") {
            return site.onQueueClick(tabUrl);
        }
        else {
            return Promise.reject();
        }
    }

    _getSiteFromTabUrl(tabUrl)
    {
        let site = null;
        if(tabUrl) {
            tabUrl = tabUrl.toLowerCase();
            Object.entries(this.siteFilters).some((item, index) => {
                const key = item[0];
                const value = item[1];
                const patterns = value.urlPatterns;

                const matches = Utils.urlMatchesOneOfPatterns(tabUrl, patterns);
                if(matches) {
                    site = value.site;
                    return true;
                }
            });
        }
        return site;
    }
}
