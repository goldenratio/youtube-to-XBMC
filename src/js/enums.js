var Status = new function()
{
    this.SUCCESS = "success_status";
    this.FAIL = "fail_status";
    this.MISSING_DATA = "missing_data";
    this.CONNECTING = "conecting_data";
    this.UNAUTHORIZED = "unauthorized_data";
};

var SettingsData = new function()
{
    this.KODI_NAME = "kodiName";
    this.HOST = "host";
    this.PORT = "port";
    this.USERNAME = "username";
    this.PASSWORD = "pwd";
    this.DEBUG_MODE = "debugMode";
    this.SHOW_INPAGE_LINKS = "show_inpage_links";
};


var ButtonData = new function()
{
    this.CONNECT = "connectButton";
    this.CLEAR = "clearButton";
};

const ResultData = {
    OK: "OK",
    ERROR: "ERROR"
};