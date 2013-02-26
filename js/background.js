/**
 * Background Script
 * @author: Karthik VJ
 */

var Player = function()
{
	var thisObject = this;	
	this.pendingRequest = [];
	
	/*
	 * Invoked when content script sends some message
	 */
	this.onMessage = function(request, sender, sendResponse)
	{	
		if(sender)
		{
			console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");			
		}		
	    
	    if(!rpc.url)
	    {
	    	console.log("open settings");
	    	chrome.tabs.create({'url': chrome.extension.getURL("settings.html")}, function () {});
	    	return;
	    }
	    
	    if(rpc.isPending)
	    {
	    	thisObject.pendingRequest.push(request);
	    	console.log("request queued!");
	    	return;
	    }
	                 
	    var params;   
	    if (request.message == "playVideo")
	    {	    	
	    	console.log("play video, " + request.videoId);
	    	// Playlist.Clear, Playlist.Add(file), Player.Open(playlist)	    	
	    	thisObject.clearPlayList(function(clearResult)
	    	{
	    		console.log("clearPlayList, " + clearResult);	
	    		if(clearResult == "OK")
	    		{
	    			thisObject.addtoPlayList(request.videoId, function(listResult)
					{
						if(listResult == "OK")
						{
							thisObject.playCurrentVideoFromList(function(playResult)
			    			{	    				
			    				console.log("video play success!");	
			    						    				
			    				    				
			    			});	    
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
	    	// Player.GetActivePlayers (if empty), Playlist.Clear, Playlist.Add(file), Player.GetActivePlayers (if empty), Player.Open(playlist)
	    	// Player.GetActivePlayers (if playing), Playlist.Add(file), Player.GetActivePlayers (if playing), do nothing
	    	
	    	thisObject.getActivePlayers(function(result)
	    	{
	    		if(result.length <= 0)
	    		{
	    			// clear any previous pending play list
	    			thisObject.clearPlayList(function(clearResult) 
	    			{	    				
	    				thisObject.onQueue(request.videoId);	    				
	    			});
	    		}
	    		else
	    		{	    			
	    			thisObject.onQueue(request.videoId);	    			
	    		}
	    			    		
	    	});
	    	    	    	
	    }
	    else if (request.message == "playList")
	    {
	    	console.log("playList, " + request.videoId + ", path = " + request.path);
	    	gService.loadFeed(request.videoId);
	    }
	};
	
	this.onQueue = function(videoId)
	{
		// first add playlist, if no video is playing then play the video.
		thisObject.addtoPlayList(videoId, function(playListresult)
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
	    			else
	    			{
	    				console.log("play list item trace");
	    				// trace play list items
	    				thisObject.getPlayList(function(result)
	    				{
	    					console.log("play list items, " + result);
	    				});
	    			}
	    			  				    				    				    			
	    		});	    			
			}
			else
			{
				console.log("Error! Cannot add video to playlist");
			}
			
		});
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
	
	this.getPlayList = function(callback)
	{
		console.log("------ this.getPlayList ---------- ");
		var params = {  
    		playlistid: 1   		    		
    	};
    	    	    		
    	rpc.sendRequest(thisObject, "Playlist.GetItems", params, callback);
		
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
		
		// check for pending requests
		if(thisObject.pendingRequest.length > 0)
		{
			thisObject.onMessage(thisObject.pendingRequest[0]);
			thisObject.pendingRequest.shift();
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
			chrome.tabs.create({'url': chrome.extension.getURL("settings.html")}, function () {});
		}
		
	};
};
 
var RPCService = function()
{	
	this.url;
	this.youTubePath = "plugin://plugin.video.youtube/?action=play_video&videoid=";
	this.callback;
	this.context;	
	this.isPending = false;
	
	var thisObject = this;
	var xhr;
	
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
		thisObject.isPending = true;
		var strData = JSON.stringify(data);
		xhr = new XMLHttpRequest();
		xhr.onreadystatechange = thisObject.readResponse;
		xhr.open("POST", this.url, true);		
		xhr.setRequestHeader("Content-type", "application/json");
		xhr.onload = thisObject.onLoad;
		xhr.send(strData);
				
	};
			
	this.onLoad = function()
	{	
		console.log("load data complete");
		thisObject.isPending = false;	
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
			if(this.status == 0)
			{
				thisObject.isPending = fasle;
			}
			
			if(thisObject.context)
			{
				thisObject.context.updateResponseStatus(this.status);				
			}
						
		}
		
	};
};

var GdataService = function()
{
	this.feedPath = "http://gdata.youtube.com/feeds/api/playlists/$list_id/?alt=json";
	this.isPending = false;
	this.context;
	var xhr;
	var thisObject = this;
	
	this.loadFeed = function(playlistId)
	{
		var path = thisObject.feedPath.replace("$list_id", playlistId);		
		thisObject.isPending = true;
		
		xhr = new XMLHttpRequest();
		xhr.onreadystatechange = thisObject.readResponse;
		xhr.open("GET", path, true);		
		xhr.setRequestHeader("Content-type", "application/json");
		xhr.onload = thisObject.onLoad;
		xhr.send("");
	};
	
	this.findPropertyFromString = function(str, property)
	{
		//console.log("findPropertyFromString, str = " + str);
		//console.log("findPropertyFromString, property = " + property);
		property = property + "=";
		var index = str.indexOf('?');
		str = str.substring(index + 1);
		//console.log("index = " + index);
		//console.log("str = " + str);
		
		var list = str.split('&');
		//console.log("list.length, " + list.length);
		for(var i = 0; i < list.length; i++)
		{
			if(list[i].search(property) == 0)
			{
				return list[i].replace(property, "");
			}		
		}
		return 0;
	}

	
	this.onLoad = function()
	{	
		console.log("feed is loaded!");
		thisObject.isPending = false;	
		if(this.status == 200)
		{							
			// parse the feed	
			var videoList = [];		
			console.log("parse!");	
			var obj = JSON.parse(this.responseText);
			console.log(JSON.stringify(obj));				
			console.log("total entries, " + obj.feed.entry.length);
			var i;
			for(i = 0; i < obj.feed.entry.length; i++)
			{
				var link = obj.feed.entry[i].link;				
				for(var j = 0; j < link.length; j++)
				{
					if(link[j].type == "text/html")
					{
						console.log("link, " + link[j].href);
						var videoId = thisObject.findPropertyFromString(link[j].href, "v");
						console.log("video id, " + videoId);
						if(videoId != 0)
						{
							videoList.push(videoId);
						}
						break;
					}
					
				}
			}
			
			if(videoList.length > 0)
			{
				// send this video list
				console.log(videoList);
				//{message: "playList", videoId: listId, path: path}
				for(i = 0; i < videoList.length; i++)
				{
					var obj = {message: "queueVideo", videoId: videoList[i]};
					player.onMessage(obj); 
				}
			}
			
		}
		
	};
	
	this.readResponse = function()
	{		
		console.log("this.readyState, " + this.readyState);
		if(this.readyState == 4)
		{
			console.log("status, " + this.status);
			if(this.status == 0)
			{
				thisObject.isPending = fasle;
			}
							
		}
		
	};
};

//////////////////////////////////////////////////////////////////////

var player = new Player();
var gService = new GdataService();
var rpc = new RPCService();
rpc.init();

/**
 * Invoked when content script sends message
 */
chrome.extension.onMessage.addListener(function(request, sender, sendResponse)
{
	player.onMessage(request, sender, sendResponse); 
});
