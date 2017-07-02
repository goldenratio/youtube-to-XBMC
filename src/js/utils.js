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