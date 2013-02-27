/**
 * Content Script
 * @author: Karthik VJ
 */

var pathName = window.location.pathname;
console.log("pathName, " + pathName);
var template_main = '<div class="xbmc_control">YouTube to XBMC: $play_all $play_now</div>';
var template_playnow = '<a href="#" rel="$pid" class="playNow" onclick="return false;">Play Now</a> | <a href="#" rel="$qid" class="queue" onclick="return false;">[+] Add to Queue</a>';
var template_playnow_sidebar = '<span rel="$pid" class="playNow xbmc_link" onclick="return false;">Play Now</span> | <span rel="$qid" class="queue xbmc_link" onclick="return false;">[+] Add to Queue</span>';
var template_playall = '<a href="#" rel="$lid" class="playlist" onclick="return false;">Play All</a> |';
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
this.playListOnXBMC = function(listId)
{
	chrome.extension.sendMessage({message: "playList", videoId: listId}, function(response) {
		console.log("list sent!");
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
	// (home / subscription on home page), search page, video manager, user page, user browse video, Popular on YouTube, Popular on youtube right side, video list (on video page), play list page
	$(".feed-item-content, .yt-lockup2-content, .vm-video-info-container, .yt-tile-visible, .channels-content-item, .lohp-category-shelf-item, .lohp-large-shelf-container, .lohp-medium-shelf-content, .lohp-vertical-shelf-item-content, .video-list-item, .playlist-video-item, .yt-lockup-content").each(function(index) 
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
		var listId;
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
			listId = findPropertyFromString(videoPathString, "list");
			var mainTemplate = template_main;
			var listTemp;
			var listStr;
			if(listId)
			{
				// it is play list
				listTemp = template_playall;
				listTemp = listTemp.replace("$lid", listId);
				
				mainTemplate = mainTemplate.replace("$play_all", listTemp);				
				//$(this).prepend(copyTemp);
				
				listStr = "list_" + listId.toString();				
			}
			else
			{
				mainTemplate = mainTemplate.replace("$play_all", "");
			}
			
			// just a single video
			videoId = findPropertyFromString(videoPathString, "v");
			if(videoId == 0)
			{
				videoId = findPropertyFromString(videoPathString, "video_id");
			}
			
			var copyTemp = template_playnow;
			var playStr;
			var queueStr;
			if(videoId != 0)
			{
				console.log("videoId, "  +videoId);						
				if($(this).hasClass("video-list-item") || $(this).hasClass("playlist-video-item"))
				{
					copyTemp = template_playnow_sidebar;
				}						
				copyTemp = copyTemp.replace("$pid", videoId);
				copyTemp = copyTemp.replace("$qid", videoId);
				
				mainTemplate= mainTemplate.replace("$play_now", copyTemp);
				//$(this).prepend(copyTemp);
				  
				playStr = "play_" + videoId.toString();
				queueStr = "queue_" + videoId.toString();								  
			}
			else
			{
				mainTemplate= mainTemplate.replace("$play_now", "");
			}
			
			if(listId != 0 || videoId !=0)
			{
				$(this).prepend(mainTemplate);								
			}
			
			listId = 0;
			videoId = 0;
										
						
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

this.initListeners = function()
{
	// click event listeners			
	$(document).on('click', '.playlist', function(event)
	{
		console.log("playlist, " + $(this).attr("rel"));
		playListOnXBMC($(this).attr("rel"));		
	});
	
	$(document).on('click', '.playNow', function(event)	
	{
		console.log("play single video, " + $(this).attr("rel"));
		playVideoOnXBMC($(this).attr("rel"));	
		
	});
	
	$(document).on('click', '.queue', function(event)	
	{
		console.log("queue single video, " + $(this).attr("rel"));
		queueVideoToXBMC($(this).attr("rel"));
	});	
}

/////////////

initListeners();

if(pathName == "/watch")
{
	console.log("window.location, " + window.location);
	var loc = window.location.toString();
	var mainVideoId = findPropertyFromString(loc, "v");
	//alert("mainVideoId, " + mainVideoId);
	var mainTemplate = template_main;	
	if(mainVideoId != 0)
	{
		var copyTemp = template_playnow.replace("$pid", mainVideoId);
		copyTemp = copyTemp.replace("$qid", mainVideoId);
						
		mainTemplate = mainTemplate.replace("$play_now", copyTemp);
					
	}
	else
	{
		mainTemplate = mainTemplate.replace("$play_now", "");
	}
	
	var listId = findPropertyFromString(loc, "list");
	if(listId != 0)
	{
		copyTemp = template_playall.replace("$lid", mainVideoId);										
		mainTemplate = mainTemplate.replace("$play_all", copyTemp);
	}
	else
	{
		mainTemplate = mainTemplate.replace("$play_all", "");
	}
	
	if(listId != 0 || videoId !=0)
	{
		$("#watch7-headline").prepend(mainTemplate);		
	}
		
	injectLinks();
	
}
else if(pathName.indexOf("/embed") == 0)
{		
	var videoId = pathName.replace("/embed/", "");
	console.log("videoId, " + videoId);
	
	var copyTemp = template_playnow_sidebar.replace("$pid", videoId);
	copyTemp = copyTemp.replace("$qid", videoId);
		
	var mainTemplate = template_main;
	mainTemplate = mainTemplate.replace("$play_all", "");
	mainTemplate = mainTemplate.replace("$play_now", copyTemp);
		
	$(".player-actions-container").prepend(mainTemplate);
	
	
	
}
else
{
	injectLinks();
}



