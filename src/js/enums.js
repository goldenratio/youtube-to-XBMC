/**
 * This file contains element ID
 * @author: Karthik VJ
 */

// enable / disable console log
/**
 * @deprecated currently used in inject script and settings.js, will be replaced with debugMode flag
 * @type {boolean}
 */
var ENABLE_CONSOLE = true;

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
    this.HOST = "host";
    this.PORT = "port";
    this.USERNAME = "username";
    this.PASSWORD = "pwd";
    this.DEBUG_MODE = "debugMode";
};


var ButtonData = new function()
{
    this.CONNECT = "connectButton";
    this.CLEAR = "clearButton";
};

var ResultData = new function()
{
    this.OK = "OK";
    this.ERROR = "ERROR";
};