class Player
{
    /**
     * @param kodiConf {KodiConfig}
     */
    constructor(kodiConf)
    {
        this.rpc = new RPCService(kodiConf);
    }

    _clearPlaylist()
    {
        const params = {
            playlistid: 1
        };

        return this.rpc.send("Playlist.Clear", params);
    }

    _addToPlaylist(file)
    {
        const params = {
            playlistid: 1,
            item : {
                file : file
            }
        };

        return this.rpc.send("Playlist.Add", params);
    }

    _playFromPlaylist(position = 0)
    {
        const params = {
            item : {
                playlistid: 1,
                position: position
            }
        };

        return this.rpc.send("Player.Open", params);
    }

    _getActivePlayers()
    {
        const params = {};
        return this.rpc.send("Player.GetActivePlayers", params);
    }

    _queue(file)
    {
        return new Promise((resolve, reject) => {

            if(!file)
            {
                reject();
                return;
            }

            this._addToPlaylist(file)
                .then(response => {

                    const result = response.result;
                    if(result == ResultData.OK) {
                        return this._getActivePlayers();
                    }
                    return reject();
                })
                .then(response => {

                    const result = response.result;
                    // check if no video is playing and start the first video in queue
                    if(result && result.length <= 0) {
                        return this._playFromPlaylist();
                    }
                })
                .then(response => {
                    resolve(response);
                })
                .catch(() => {
                    reject();
                });

        });

    }

    getPluginVersion(pluginId) {

        const params = {
            addonid: pluginId,
            "properties": ["version"]
        };

        return this.rpc.send("Addons.GetAddonDetails", params);
    }

    ping()
    {
        return this.rpc.send("JSONRPC.Ping");
    }

    /**
     * @param file {string}
     * @returns {Promise}
     */
    playVideo(file)
    {
        return new Promise((resolve, reject) => {

            console.log("play video, " + file);

            // 1. Clear play list
            // 2. Add to playlist
            // 3. Play first index

            this._clearPlaylist()
                .then(response => {
                    return this._addToPlaylist(file);
                })
                .then(response => {
                    return this._playFromPlaylist();
                })
                .then(response => {

                    resolve(response);

                }).catch(() => {
                    reject();
                });

        });
    }

    /**
     * @param file {string}
     * @returns {Promise}
     */
    queueVideo(file)
    {
        return new Promise((resolve, reject) => {

            console.log("queue file " + file);

            // Player.GetActivePlayers (if empty), Playlist.Clear, Playlist.Add(file), Player.GetActivePlayers (if empty), Player.Open(playlist)
            // Player.GetActivePlayers (if playing), Playlist.Add(file), Player.GetActivePlayers (if playing), do nothing

            this._getActivePlayers()
                .then(response => {

                    const result = response.result;
                    if(result && result.length <= 0)
                    {
                        return this._clearPlaylist();
                    }
                })
                .then(response => {
                    return this._queue(file);
                })
                .then(response => {

                    resolve(response);
                })
                .catch(() => {

                    reject();
                });

        });

    }

    /**
     * @param files {string[]}
     * @returns {*}
     */
    async playAll(files)
    {
        console.log("play all ", files);

        const len = files.length;
        let res;
        try {
            res = await this.playVideo(files[0]);
        } catch(err) {
            return reject(err);
        }

        for (let i = 1; i < len; i++)
        {
            try {
                res = await this.queueVideo(files[i]);
            } catch(err) {
                return reject(err);
            }
        }

        return res;
    }

    /**
     * @param files {string[]}
     * @returns {*}
     */
    async queueAll(files)
    {
        console.log("queue all ", files);

        let res;
        const len = files.length;
        for (let i = 0; i < len; i++)
        {
            try {
                res = await this.queueVideo(files[i]);
            } catch(err) {
                return reject(err);
            }
        }

        return res;
    }
}
