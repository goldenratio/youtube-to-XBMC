/**
 * Content Script
 * @author: Karthik VJ
 */

var pathName = window.location.pathname;
var template = '<div class="xbmc_control">YouTube to XBMC: <a href="#" id="play_$pid" onclick="return false;">Play Now</a> | <a href="#" id="queue_$qid" onclick="return false;">[+] Add to Queue</a></div>';
var template_list = '<div class="xbmc_control">YouTube to XBMC: <span id="play_$pid" class="xbmc_link" onclick="return false;">Play Now</span> | <span id="queue_$qid" class="xbmc_link" onclick="return false;">[+] Add to Queue</span></div>';
var timer;

this.playVideoOnXBMC = function(vId)
{
	chrome.extension.sendMessage({message: "playVideo", videoId: vId}, function(response) {
		console.log("video sent!");
	});
};

this.queueVideoToXBMC = function(vId)
{
	chrome.extension.sendMessage({message: "queueVideo", videoId: vId}, function(response) {
		console.log("video sent!");
	});
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

this.injectLinks = function()
{	
	console.log("injectLinks");
	// (home / subscription on home page), search page, video manager, user page, user browse video, Popular on YouTube, Popular on youtube right side, video list (on video page)
	$(".feed-item-content, .yt-lockup2-content, .vm-video-info-container, .yt-tile-visible, .channels-content-item, .lohp-category-shelf-item, .lohp-large-shelf-container, .lohp-medium-shelf-content, .lohp-vertical-shelf-item-content, .video-list-item").each(function(index) 
	{	
		var alreadyAdded = false;
		$(this).find(".xbmc_control").each(function(xIndex)
		{
			alreadyAdded = true;
			return false;
			
		});			
		
		if(alreadyAdded)
		{
			return; // continue
		}
		
		console.log(index);
		var videoPathString;
		var videoId;
		// (home / subscription on home page), search page, video manager, (user page / user browse video / Popular on YouTube) 
		$(this).find(".feed-video-title, .yt-uix-tile-link, .vm-video-title-content, .yt-uix-sessionlink").each(function(vIndex)
		{
			//console.log("video link, " + vIndex + ", " + $(this).attr("href"));
			videoPathString = $(this).attr("href");
			return false;	  	
		});
		  
		if(videoPathString)
		{			  
			console.log("videoPathString, " + videoPathString);				
			videoId = findPropertyFromString(videoPathString, "v");
			if(videoId == 0)
			{
				videoId = findPropertyFromString(videoPathString, "video_id");
			}
			
			if(videoId != 0)
			{
				console.log("videoId, "  +videoId);
				var copyTemp = template;		
				if($(this).attr("class") == "video-list-item")
				{
					copyTemp = template_list;
				}						
				copyTemp = copyTemp.replace("$pid", videoId);
				copyTemp = copyTemp.replace("$qid", videoId);
				$(this).prepend(copyTemp);
				  
				var playStr = "play_" + videoId.toString();
				var playVideo = document.getElementById(playStr);
				if(playVideo)
				{
					console.log("playStr, " + playStr);
					playVideo.addEventListener("click", function() {
						console.log("video link clicked");
						playVideoOnXBMC(videoId.toString());					
					}, false);			  	
				}
				
				var queueStr = "queue_" + videoId.toString();
				var queueVideo = document.getElementById(queueStr);
				if(queueVideo)
				{
					console.log("queueStr, " + queueStr);
					queueVideo.addEventListener("click", function() {
						console.log("queue video");
						queueVideoToXBMC(videoId.toString());					
					}, false);			  	
				}
				  
			}			
		}	  
		  
	});
	
	
	$("#content").bind('DOMNodeInserted', function(event)
	{
		console.log("DOM updated!");
		var element = event.target;
		console.log("element, " + element.tagName);
		
		clearInterval(timer);		
		timer = setInterval(function(){			
			clearInterval(timer);			
			$("#content").unbind('DOMNodeInserted');
			injectLinks();			
		}, 2000)				
	});
	

};

this.getURLParameter = function(url, name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(url.search)||[,null])[1]
    );
};

/////////////

if(pathName == "/watch")
{
	var mainVideoId = getURLParameter(window.location, "v");
	//alert("mainVideoId, " + mainVideoId);
	
	if(mainVideoId)
	{
		var copyTemp = template.replace("$pid", mainVideoId);
		copyTemp = copyTemp.replace("$qid", mainVideoId);
		$("#watch7-headline").prepend(copyTemp);
		
		var playStr = "play_" + mainVideoId.toString();
		var playVideo = document.getElementById(playStr);
		if(playVideo)
		{
			console.log("playStr, " + playStr);
			playVideo.addEventListener("click", function() {
				console.log("video link clicked");
				playVideoOnXBMC(mainVideoId.toString());					
			}, false);			  	
		}
		
		var queueStr = "queue_" + mainVideoId.toString();
		var queueVideo = document.getElementById(queueStr);
		if(queueVideo)
		{
			console.log("queueStr, " + queueStr);
			queueVideo.addEventListener("click", function() {
				console.log("queue video");
				queueVideoToXBMC(mainVideoId.toString());					
			}, false);			  	
		}		
	}
}
 
injectLinks();



