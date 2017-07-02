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
