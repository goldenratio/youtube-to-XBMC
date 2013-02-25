/**
 * Background Script
 * @author: Karthik VJ
 */

var Player = function()
{
	var thisObject = this;	
	
	/*
	 * Invoked when content script sends some message
	 */
	this.onMessage = function(request, sender, sendResponse)
	{			
	    console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
	    if(!rpc.url)
	    {
	    	console.log("open settings");
	    	chrome.tabs.create({'url': chrome.extension.getURL("settings.html")}, function () {});
	    	return;
	    }
	                 
	    var params;   
	    if (request.message == "playVideo")
	    {	    	
	    	console.log("play video, " + request.videoId);	    	
	    	thisObject.clearPlayList(function(clearResult)
	    	{
	    		console.log("clearPlayList, " + clearResult);	
	    		if(clearResult == "OK")
	    		{
					thisObject.playCurrentFile(request.videoId, function(playResult)
			    	{
			    		if(playResult == "OK")
			    		{							
			    			console.log("video play success!");			    			
			    		}
			    		else
			    		{
			    			console.log("Error! Cannot play video");
			    		}
			    		
			    	});	    			
	    		}  
	    		else
	    		{
	    			console.log("Error! Cannot clear play list");
	    		} 			    	
	    		
	    	});
	    }
	    else if (request.message == "queueVideo")
	    {	    	
	    	console.log("queueVideo video, " + request.videoId);	    	    	    			    
	    	
	    	thisObject.addtoPlayList(request.videoId, function(playListresult)
	    	{
	    		console.log("addtoPlayList, " + playListresult);
	    		if(playListresult == "OK")
	    		{
	    			thisObject.getActivePlayers(function(activeResult)
		    		{
		    			console.log("active player is found!");
		    			// check if no video is playing and start the first video in queue
		    			if(activeResult.length <= 0)
		    			{							
		    				console.log("playing queue");
							thisObject.playCurrentVideoFromList(function(playResult)
			    			{	    				
			    				console.log("video play success!");	
			    				    				
			    			});	    				
			    					    				
		    			}
		    			  				    				    				    			
		    		});	    			
	    		}
	    		else
	    		{
	    			console.log("Error! Cannot add video to playlist");
	    		}
	    		
	    	});    	    	
	    }
	};
	
	this.getActivePlayers = function(callback)
	{						
		console.log("------ this.getActivePlayers ----------");
		var params = {};
		rpc.sendRequest(thisObject, "Player.GetActivePlayers", params, callback);
	};
	
	this.addtoPlayList = function(videoId, callback)
	{
		console.log("------ this.addtoPlayList ---------- " + videoId);
		var params = {  
    		playlistid: 1,   		
    		item : {
    			file : videoId 
    		}
    	};
    	    	    		
    	rpc.sendRequest(thisObject, "Playlist.Add", params, callback);
	};
	
	
	this.playCurrentVideoFromList = function(callback)
	{
		console.log("------ this.playCurrentVideoFromList ----------");		
		var params = {     		    		
    		item : {    			
    			playlistid: 1,
    			position: 0 
    		}
    	};
    	    	
    	rpc.sendRequest(thisObject, "Player.Open", params, callback);
	}
	
	this.clearPlayList = function(callback)
	{
		console.log("------ this.clearPlayList ----------");
		var params = {
			playlistid: 1     		    		    		
    	};		
    	    	
		rpc.sendRequest(thisObject, "Playlist.Clear", params, callback);		
	};
	
	this.playCurrentFile = function(videoId, callback)
	{
		console.log("------ this.playCurrentFile ---------- " + videoId);
		var params = {     		    		
    		item : {    			
    			file : videoId 
    		}
    	};
    	
    	rpc.sendRequest(thisObject, "Player.Open", params, callback);
	};
	
	/**
	 * Response data from json-rpc request
	 */
	this.responseData = function(text, callback)
	{
		var obj = JSON.parse(text);
		//console.log(text);
		console.log(JSON.stringify(obj));
				
		console.log("success");
		if(callback)
		{
			console.log("sending.. " + obj.result);
			callback(obj.result);
		}
										
	};
	
	/**
	 * Response status from json-rpc request
	 */
	this.updateResponseStatus = function(status)
	{
		if(status == 0)
		{
			console.log("Error! Cannot connect to XBMC");
		}
		
	};
};
 
var RPCService = function()
{
	this.xhr;
	this.url;
	this.youTubePath = "plugin://plugin.video.youtube/?action=play_video&videoid=";
	this.callback;
	this.context;	
	
	var thisObject = this;
	
	this.init = function()
	{
		chrome.storage.local.get(function(item)
		{			
			if(item.xbmcURL)
			{				
				console.log("found xbmc URL, " + item.xbmcURL);
				thisObject.url = item.xbmcURL; 
			}					
			
		});
		
	};
	
	this.setURL = function(xbmcURL)
	{
		//console.log("xbmc URL, " + xbmcURL);
		this.url = xbmcURL;				
	};
	
	this.sendRequest = function(context, method, params, callback)
	{		
		console.log("send request");		
		this.callback = callback;
		this.context = context;
		var data = { jsonrpc: "2.0", method: method, id: 1 };
		
		if(params)
		{
			if(params.item)
			{
				if(params.item.file)
				{
					params.item.file = thisObject.youTubePath + params.item.file;
				}				
			}
							 
			data.params = params;
		}
				
		console.log(data);
		var strData = JSON.stringify(data);
		this.xhr = new XMLHttpRequest();
		this.xhr.onreadystatechange = thisObject.readResponse;
		this.xhr.open("POST", this.url, true);		
		this.xhr.setRequestHeader("Content-type", "application/json");
		this.xhr.onload = thisObject.onLoad;
		this.xhr.send(strData);
				
	};
			
	this.onLoad = function()
	{		
		if(this.status == 200)
		{							
			if(thisObject.context)
			{				
				thisObject.context.responseData(this.responseText, thisObject.callback);
			}					
			
		}
		
	};
	
	this.readResponse = function()
	{		
		console.log("this.readyState, " + this.readyState);
		if(this.readyState == 4)
		{
			console.log("status, " + this.status);
			if(thisObject.context)
			{
				thisObject.context.updateResponseStatus(this.status);				
			}
						
		}
		
	};
};

//////////////////////////////////////////////////////////////////////

var player = new Player();
var rpc = new RPCService();
rpc.init();

/**
 * Invoked when content script sends message
 */
chrome.extension.onMessage.addListener(function(request, sender, sendResponse)
{
	player.onMessage(request, sender, sendResponse); 
});
