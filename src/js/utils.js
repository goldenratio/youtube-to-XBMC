class Utils
{
    static findPropertyFromString(str, key)
    {
        let property = key + "=";
        var index = str.indexOf('?');
        str = str.substring(index + 1);

        var list = str.split('&');

        for (var i = 0; i < list.length; i++)
        {
            if (list[i].search(property) == 0)
            {
                return list[i].replace(property, "");
            }
        }
        return null;
    }
}