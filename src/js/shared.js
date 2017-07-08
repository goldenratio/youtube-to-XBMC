class URLRequest
{
    constructor(url)
    {
        this._url = url;
        this._contentType = "application/json";
        this._method = "GET";
    }

    set contentType(value)
    {
        this._contentType = value;
    }

    set method(value)
    {
        this._method = value;
    }

    send(data = "")
    {
        return new Promise((reslove, reject) => {

            let xhr = new XMLHttpRequest();
            xhr.open(this._method, this._url, true);
            xhr.setRequestHeader("Content-type", this._contentType);

            xhr.onreadystatechange = function() {};

            xhr.onerror = function() {
                reject();
            };

            xhr.onload = function () {
                const isSuccess = (this.status == 200);
                if(isSuccess)
                {
                    reslove(this.responseText);
                }
                else
                {
                    reject();
                }
            };

            xhr.send(data);
        });
    }
}

class RPCService
{
    constructor(kodiConf)
    {
        this.kodiConf = kodiConf;
        this.isPending = false;
    }

    send(method, params = null)
    {
        return new Promise((resolve, reject) => {

            let data = {
                jsonrpc: "2.0",
                method: method,
                id: 1
            };

            if(params)
            {
                data.params = params;
            }

            console.log("<< " + method, data);
            this.isPending = true;

            let strData = JSON.stringify(data);

            console.log("this.kodiConf.url " + this.kodiConf.url);
            let urlRequest = new URLRequest(this.kodiConf.url);
            urlRequest.method = "POST";

            urlRequest.send(strData).then(response => {

                this.isPending = false;

                const data = JSON.parse(response);
                console.log(">> " + method, data);
                if(data.error) {
                    reject(data);
                }
                else {
                    resolve(data);
                }

            }).catch(() => {
                this.isPending = false;
                reject();
            });


        });
    }
}

class KodiConfig
{
    constructor()
    {
        this.name = "Kodi";
        this.hostName = "";
        this.port = "";
        this.username = "";
        this.password = "";
    }

    get _hasCredentials()
    {
        return this.username && this.password;
    }

    get url()
    {
        const credentials = this._hasCredentials ? `${this.username}:${this.password}@` : "";
        return `http://${credentials}${this.hostName}:${this.port}/jsonrpc`;
    }

}


class Utils
{
    static findPropertyFromString(str, key) {
        if(!str || !key) {
            return null;
        }
        let property = key + "=";
        var index = str.indexOf('?');
        str = str.substring(index + 1);

        var list = str.split('&');

        for (var i = 0; i < list.length; i++) {
            if (list[i].search(property) == 0)
            {
                return list[i].replace(property, "");
            }
        }
        return null;
    }

    static urlMatchesOneOfPatterns(url, patterns) {
        const len = patterns.length;
        for (var i = 0; i < len; i++) {
            var pattern = patterns[i];
            if (url.match(pattern)) {
                return true;
            }
        }

        return false;
    }

}
