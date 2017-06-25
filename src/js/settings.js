/**
 * Handles settings page javascript
 * @author: Karthik VJ
 */

var console = console || {};
console.log = console.log || function() {};
console.logCopy = console.log.bind(console);

if (ENABLE_CONSOLE == false)
{
    console.log = function() {};
}

var Options = function()
{

    var thisObject = this;

    /**
     * Init
     * attach click event to connect, clear buttons
     */
    this.init = function()
    {
        var hostTextField = document.getElementById(SettingsData.HOST);
        var portTextField = document.getElementById(SettingsData.PORT);
        var userNameTextField = document.getElementById(SettingsData.USERNAME);
        var pwdTextField = document.getElementById(SettingsData.PASSWORD);
        var debugModeCheckbox = document.getElementById(SettingsData.DEBUG_MODE);

        var connectButton = document.getElementById(ButtonData.CONNECT);
        connectButton.addEventListener("click", thisObject.onConnectHandler);

        var clearButton = document.getElementById(ButtonData.CLEAR);
        clearButton.addEventListener("click", thisObject.onClearHandler);

        // check for local storage
        //chrome.storage.local.clear();
        chrome.storage.local.get(function(item)
        {
            if (item.host)
            {
                hostTextField.value = item.host;
            }

            if (item.port)
            {
                portTextField.value = item.port;
            }

            if (item.userName)
            {
                userNameTextField.value = item.userName;
            }

            if (item.password)
            {
                pwdTextField.value = item.password;
            }

            if (item.debugMode)
            {
                if (item.debugMode == true)
                {
                    debugModeCheckbox.checked = true;
                }
            }

            if (item.host && item.port)
            {
                thisObject.onConnectHandler();
            }

        });
    };


    /**
     * Invoked when connect button is clicked.
     */
    this.onConnectHandler = function()
    {

        if (connectionData.canConnect(thisObject) == false)
        {
            statusMessage.showDataMissing(true);
        }
        else
        {
            // disable buttons.. show connecting
            statusMessage.showConnecting(true);
        }

    };

    this.onConnectionSuccess = function()
    {
        statusMessage.showSuccess(true);
        this.updateLocalStorage();
    };

    this.onConnectionFail = function()
    {
        statusMessage.showFail(true);
    };

    this.onUnauthorized = function()
    {
        statusMessage.showUnauthorized(true);
    };

    /**
     * Invoked when clear button is clicked.
     */
    this.onClearHandler = function()
    {
        connectionData.clear();
        statusMessage.hideAll();

    };

    this.updateLocalStorage = function()
    {
        console.log("update local storage");
        chrome.storage.local.set({'host': connectionData.host, 'port': connectionData.port,
            'userName': connectionData.userName, 'password': connectionData.password,
            'xbmcURL': connectionData.url,
            'debugMode' : connectionData.debugMode}, function()
        {
            console.log("data saved");
        });
    };



};

/**
 * Contains status messages like "Success" and "Fail"
 */
var StatusMessage = function()
{
    var thisObject = this;

    this.showSuccess = function(state)
    {
        thisObject.hideAll();
        var status = document.getElementById(Status.SUCCESS);
        if (state == true)
            status.style.display = "block";
        else
            status.style.display = "none";

    };

    this.showFail = function(state)
    {
        thisObject.hideAll();
        var status = document.getElementById(Status.FAIL);

        if (state == true)
            status.style.display = "block";
        else
            status.style.display = "none";
    };

    this.showDataMissing = function(state)
    {
        thisObject.hideAll();
        var status = document.getElementById(Status.MISSING_DATA);

        if (state == true)
            status.style.display = "block";
        else
            status.style.display = "none";
    };

    this.showConnecting = function(state)
    {
        thisObject.hideAll();
        var status = document.getElementById(Status.CONNECTING);

        if (state == true)
            status.style.display = "block";
        else
            status.style.display = "none";
    };

    this.showUnauthorized = function(state)
    {
        thisObject.hideAll();
        var status = document.getElementById(Status.UNAUTHORIZED);

        if (state == true)
            status.style.display = "block";
        else
            status.style.display = "none";
    };


    this.hideAll = function()
    {
        var status = document.getElementById(Status.SUCCESS);
        status.style.display = "none";

        status = document.getElementById(Status.FAIL);
        status.style.display = "none";

        status = document.getElementById(Status.MISSING_DATA);
        status.style.display = "none";

        status = document.getElementById(Status.CONNECTING);
        status.style.display = "none";

        status = document.getElementById(Status.UNAUTHORIZED);
        status.style.display = "none";

    };

};

var ConnectionData = function()
{
    var thisObject = this;

    this.context;
    this.url;
    this.host;
    this.port;
    this.userName;
    this.password;
    this.debugMode;

    this.canConnect = function(context)
    {
        this.context = context;
        var hostData = document.getElementById(SettingsData.HOST).value;
        var portData = document.getElementById(SettingsData.PORT).value;
        var user = document.getElementById(SettingsData.USERNAME).value;
        var pwd = document.getElementById(SettingsData.PASSWORD).value;
        var debugChecked = document.getElementById(SettingsData.DEBUG_MODE).checked;

        if (portData == "")
        {
            // default port
            portData = "8080";
        }

        if(hostData == "")
            return false;


        var loginDetails = "";
        if(user != "" && pwd != "")
        {
            loginDetails = user + ":" + pwd + "@";
        }
        this.url = "http://" + loginDetails + hostData + ":" + portData + "/jsonrpc";

        //var params = '{ "item" : {"file" : "plugin://plugin.video.youtube/?action=play_video&videoid=iQOHRKKNNLQ"}}';
        //rpc.sendRequest(this, "Player.Open", params);

        this.host = hostData;
        this.port = portData;
        this.userName = user;
        this.password = pwd;
        this.debugMode = debugChecked;

        rpc.setURL(this.url);
        rpc.setDebugMode(this.debugMode);
        rpc.sendRequest(this, "JSONRPC.Ping", null);

        return true;
    };

    this.clear = function()
    {
        document.getElementById(SettingsData.HOST).value = "";
        document.getElementById(SettingsData.PORT).value = "";
        document.getElementById(SettingsData.USERNAME).value = "";
        document.getElementById(SettingsData.PASSWORD).value = "";
        document.getElementById(SettingsData.DEBUG_MODE).checked = false;
    };

    this.responseData = function(text)
    {
        var obj = JSON.parse(text);
        //console.log(text);
        console.log(JSON.stringify(obj));
        if (obj.error)
        {
            thisObject.context.onConnectionFail();
        }
        else
        {
            thisObject.context.onConnectionSuccess();

        }
    };

    this.updateResponseStatus = function(status)
    {
        if (status == 0)
        {
            thisObject.context.onConnectionFail();
        }
        else if(status == 401)
        {
            thisObject.context.onUnauthorized();
        }
    };


};

//////////////////////////////////////////////////////////////////////

var statusMessage = new StatusMessage();
var connectionData = new ConnectionData();
var rpc = chrome.extension.getBackgroundPage().rpc;
var options = new Options();

window.addEventListener("load", loadComplete, false);

function loadComplete()
{
    if (options)
    {
        options.init();
    }
}
