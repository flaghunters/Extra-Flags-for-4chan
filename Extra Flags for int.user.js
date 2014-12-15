// ==UserScript==
// @name        Extra Flags for int
// @namespace   com.whatisthisimnotgoodwithcomputers.extraflagsforint
// @description Extra Flags for int
// @include     http*://boards.4chan.org/int/*
// @exclude     http*://boards.4chan.org/int/catalog
// @version     0.4
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @updateURL	https://github.com/flaghunters/Extra-Flags-for-int-/raw/master/Extra%20Flags%20for%20int.user.js
// @downloadURL	https://github.com/flaghunters/Extra-Flags-for-int-/raw/master/Extra%20Flags%20for%20int.user.js
// ==/UserScript==

// ===============SETTINGS SECTION==================

//change this variable if you wish to override the GeoIP data

var region="";

//
//
//
//
//
//
//
//
//
//
//================END OF SETTINGS===================
//Don't edit below this line if you don't know what you're doing
//==================================================
//
//
//
//
//
//
//
//
//
//
//
var allPostsOnPage = new Array();
var postNrs = new Array();
var postRemoveCounter = 60;

/* get geoip region if not set */
if(region == "") {
	getRegion();
}

function getRegion() {
	GM_xmlhttpRequest({
		method:     "GET",
		url:        "http://ipinfo.io/region",
		headers: {
			"User-Agent" : "curl/7.9.8", // If not specified, navigator.userAgent will be used.
		},
		onload: function (response) {
			if (response.status == 200) {
				region=response.responseText.trim();
				console.log("Region: " + region);
			} else {
				console.log("Location error: " + response.status);
				console.log(response.statusText);
			}
		}
	});
}

/* fix flag alignment on chrome */
if(navigator.userAgent.toLowerCase().indexOf('chrome') > -1){
   addGlobalStyle('.flag{top: 0px !important;left: -1px !important}');
}

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

/* parse the posts already on the page before thread updater kicks in */
function parseOriginalPosts() {
	var tempAllPostsOnPage = document.getElementsByClassName('postContainer');
	allPostsOnPage = Array.prototype.slice.call(tempAllPostsOnPage); //convert from element list to javascript array
	postNrs = allPostsOnPage.map(function (p) {
		return p.id.replace("pc", "");
	});                                         //extract post numbers
}

parseOriginalPosts();
resolveRefFlags();

/* the function to get the flags from the db
 * uses postNrs
 * member variable might not be very nice but I'm gonna do it anyways! */
function onFlagsLoad(response) {
	//exit on error
	if(response.status !== 200) {
		console.log("Could not fetch flags, status: " + response.status);
		console.log(response.statusText);
		return;
	}
	
    //parse returned data
	var jsonData = JSON.parse(response.responseText);
	
	jsonData.forEach(function (post) {
		var postToAddFlagTo = document.getElementById("pc" + post.post_nr);
		var postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0];
		var nameBlock = postInfo.getElementsByClassName('nameBlock')[0];
		var currentFlag = nameBlock.getElementsByClassName('flag')[0];

		var newFlag = document.createElement('a');
		nameBlock.appendChild(newFlag);
		newFlag.title = post.region;
		newFlag.innerHTML = "<a href='https://www.google.com/?q="+post.region+"' target='_blank'><img src='https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-int-/master/flegs/" + currentFlag.title + "/" + post.region + ".png'></a>";
		newFlag.className = "extraFlag";
		//padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
		newFlag.style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative; top: 1px;"

		//remove flag from postNrs
		var index = postNrs.indexOf(post.post_nr);
		if (index > -1) {
			postNrs.splice(index, 1);
			console.log("resolved" + post.post_nr);
		}
	});
	
	//cleaning up the postNrs variable here
	//conditions are checked one plus resolved (removed above, return handler) or older than 60s (removed here), keeping it simple

	var timestampMinusFortyFive = Math.round(+new Date()/1000) - postRemoveCounter;

	postNrs.forEach(function (post_nr) {
		console.log("should I remove " + "pc" + post_nr);
		var postToAddFlagTo = document.getElementById("pc" + post_nr);
		var postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0];
		var dateTime = postInfo.getElementsByClassName('dateTime')[0];
		
		if (dateTime.getAttribute("data-utc") < timestampMinusFortyFive) {
			var index = postNrs.indexOf(post_nr);
			if (index > -1) {
				postNrs.splice(index, 1);
				console.log("removed " + post_nr);
			}
		}
	});
}

/* fetch flags from db */
function resolveRefFlags() {
	GM_xmlhttpRequest({
		method:     "POST",
		url:        "http://flaghunters.x10host.com/get_flags.php",
		data:       "post_nrs=" + encodeURIComponent (postNrs)
			        //+ "&" + "board=" + encodeURIComponent (e.detail.boardID)
			        //+ "&" + "region=" + encodeURIComponent (region)
		,
		headers:    {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		onload: onFlagsLoad
	});
}

/* send flag to system on 4chan x (v2, loadletter, v3 untested) post
 * handy comment to save by ccd0
 * console.log(e.detail.boardID);  // board name    (string)
 * console.log(e.detail.threadID); // thread number (integer in ccd0, string in loadletter)
 * console.log(e.detail.postID);   // post number   (integer in ccd0, string in loadletter) */
document.addEventListener('QRPostSuccessful', function(e) {
	GM_xmlhttpRequest({
		method:     "POST",
		url:        "http://flaghunters.x10host.com/post_flag.php",
		data:       "post_nr=" + encodeURIComponent (e.detail.postID)
					+ "&" + "board=" + encodeURIComponent (e.detail.boardID)
					+ "&" + "region=" + encodeURIComponent (region)
					,
		headers:    {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		onload:     function (response) {
			console.log(response.responseText);
		}
	});
}, false);

/* send flag to system on 4chan inline post */
document.addEventListener('4chanQRPostSuccess', function(e) {
	console.log("4chanQRPostSuccess");
	
	var boardID = window.location.pathname.split('/')[1];
	console.log(boardID);
	
	GM_xmlhttpRequest({
		method:     "POST",
		url:        "http://flaghunters.x10host.com/post_flag.php",
		data:       "post_nr=" + encodeURIComponent (e.detail.postId)
					+ "&" + "board=" + encodeURIComponent (boardID)
					+ "&" + "region=" + encodeURIComponent (region)
					,
		headers:    {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		onload:     function (response) {
			console.log(response.responseText);
		}
	});
}, false);

/* Listen to post updates from the thread updater for 4chan x v2 (loadletter) and v3 (ccd0 + ?) */
document.addEventListener('ThreadUpdate', function(e) {
	
    console.log("ThreadUpdate");
    console.log(e);
    
    //ignore if 404 event
    if (e.detail[404] === true) {
		return;
	}
    
    console.log(e.detail.newPosts);
    
    //add to temp posts and the DOM element to allPostsOnPage
	e.detail.newPosts.forEach(function (post_board_nr) {
		var post_nr = post_board_nr.split('.')[1];
		postNrs.push(post_nr);
		var newPostDomElement = document.getElementById("pc" + post_nr);
		console.log(newPostDomElement);
		allPostsOnPage.push(newPostDomElement);
		console.log("pushed " + post_nr);
	});
	
	//can't trigger here unfortunately
	//this triggers faster than the post can load.
	//OnDOMchange doesnt seem to be the answer either.
	resolveRefFlags();
	
}, false);

//Listen to post updates from the thread updater for inline extension
document.addEventListener('4chanThreadUpdated', function(e) {
	
    console.log("4chanThreadUpdated");
	console.log(e);
	console.log(e.detail.count);
	
	var threadID = window.location.pathname.split('/')[3]; //get thread ID
	var postsContainer = Array.prototype.slice.call(document.getElementById('t'  + threadID).childNodes); //get an array of postcontainers
	var lastPosts = postsContainer.slice(Math.max(postsContainer.length - e.detail.count, 1)); //get the last n elements (where n is e.detail.count)
	
	console.log(lastPosts);

    //add to temp posts and the DOM element to allPostsOnPage
	lastPosts.forEach(function (post_container) {
		var post_nr = post_container.id.replace("pc", "");
		postNrs.push(post_nr);
		console.log(post_container);
		allPostsOnPage.push(post_container);
		console.log("pushed " + post_nr);
	});
	
	//can't trigger here unfortunately
	//this triggers faster than the post can load.
	//OnDOMchange doesnt seem to be the answer either.
	resolveRefFlags();
	
}, false);
