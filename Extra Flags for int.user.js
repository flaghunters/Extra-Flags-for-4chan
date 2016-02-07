// ==UserScript==
// @name        Extra Flags for int
// @namespace   com.whatisthisimnotgoodwithcomputers.extraflagsforint
// @description Extra Flags for int
// @include     http*://boards.4chan.org/int/*
// @include     http*://boards.4chan.org/sp/*
// @include     http*://boards.4chan.org/pol/*
// @exclude     http*://boards.4chan.org/int/catalog
// @exclude     http*://boards.4chan.org/sp/catalog
// @exclude     http*://boards.4chan.org/pol/catalog
// @version     0.13
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @run-at      document-end
// @updateURL	https://github.com/flaghunters/Extra-Flags-for-int-/raw/master/Extra%20Flags%20for%20int.user.js
// @downloadURL	https://github.com/flaghunters/Extra-Flags-for-int-/raw/master/Extra%20Flags%20for%20int.user.js
// ==/UserScript==

var region = "";
var allPostsOnPage = new Array();
var postNrs = new Array();
var postRemoveCounter = 60;
var requestRetryInterval = 5000;
var flegsBaseUrl = 'https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-int-/master/flegs/';
var navigatorIsWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
var backendBaseUrl = 'https://whatisthisimnotgoodwithcomputers.com/';

/* region setup thing */
var setup = {
	namespace: 'com.whatisthisimnotgoodwithcomputers.extraflagsforint',
	id: "ExtraFlags-setup",
	html: function () {
		return '<div>Extra Flags for /int/</div><ul>Region: <li><input type="text" name="region" value="' + region + '"></li>Leave blank to use geolocation</ul><div><button name="save">Save settings</button></div></div>';
	},
	q: function(n) {
		return document.querySelector('#' + this.id + ' *[name="' + n + '"]');
	},
	show: function() {
		/* remove setup window if existing */
		var setup_el = document.getElementById(setup.id);
		if (setup_el) {
			setup_el.parentNode.removeChild(setup_el);
		}
		/* create new setup window */
		GM_addStyle('\
			#'+setup.id+' { position:fixed;z-index:10001;top:40px;right:40px;padding:20px 30px;background-color:white;width:auto;border:1px solid black }\
			#'+setup.id+' * { color:black;text-align:left;line-height:normal;font-size:12px }\
			#'+setup.id+' div { text-align:center;font-weight:bold;font-size:14px }\
			#'+setup.id+' ul { margin:15px 0 15px 0;padding:0;list-style:none }\
			#'+setup.id+' li { margin:0;padding:3px 0 3px 0;vertical-align:middle }'
		);
		setup_el = document.createElement('div');
		setup_el.id = setup.id;
		setup_el.innerHTML = setup.html();
		document.body.appendChild(setup_el);
		/* save listener */
		setup.q('save').addEventListener('click', function() {
			this.disabled = true;
			this.innerHTML = 'Saving...';
			region = setup.q('region').value.trim();
			if (!region) {
				getRegion();
			}
			setup.save('region', region);
			setup_el.parentNode.removeChild(setup_el);
		}, false);
	},
	save: function(k, v) {
		GM_setValue(setup.namespace + k, v);
	},
	load: function(k) {
		return GM_getValue(setup.namespace + k);
	},
	init: function() {
		GM_registerMenuCommand('Set up Extra Flags for /int/', setup.show);
	}
};

/* get geoip region if not set */
if (region == "") {
	region = setup.load('region');
	if (!region) {
		getRegion();
	}
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
				setup.save('region', region);
				setTimeout(function () {
					if (setup.load('firstrun') !== "true") {
						setup.save('firstrun', "true");
						if (window.confirm("Detected region: \"" + region + "\"\nDo you want to set it manually?\nIf you want to change it later you'll find the menu option by clicking on the Greasemonkey/Tampermonkey icon") === true) {
							setup.show();
						}
					}
				}, 3000);
			} else {
				//console.log("Location error: " + response.status);
				//console.log(response.statusText);
			}
		}
	});
}

/* fix flag alignment on chrome */
if (navigatorIsWebkit) {
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
		setTimeout(resolveRefFlags, requestRetryInterval);
		return;
	}
	
	//parse returned data
	//host22 sends crap about analytics which needs to be cut off
	var removeNonJsonSlug = response.responseText.split(']');
	var jsonData = JSON.parse(removeNonJsonSlug[0] + ']');
	
	jsonData.forEach(function (post) {
		var postToAddFlagTo = document.getElementById("pc" + post.post_nr);
		var postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0];
		var nameBlock = postInfo.getElementsByClassName('nameBlock')[0];
		var currentFlag = nameBlock.getElementsByClassName('flag')[0];

		var newFlag = document.createElement('a');
		nameBlock.appendChild(newFlag);
		newFlag.title = post.region;
		var newFlagImgOpts = 'onerror="(function () {var extraFlagsImgEl = document.getElementById(\'pc' + post.post_nr + '\').getElementsByClassName(\'extraFlag\')[0].firstElementChild; if (!/\\/empty\\.png$/.test(extraFlagsImgEl.src)) {extraFlagsImgEl.src = \'' + flegsBaseUrl + 'empty.png\';}})();"';
		newFlag.innerHTML = "<img src='" + flegsBaseUrl + currentFlag.title + "/" + post.region + ".png'" + newFlagImgOpts + ">";
		newFlag.className = "extraFlag";
		newFlag.href = "https://www.google.com/search?q=" + post.region + ", " + currentFlag.title;
		newFlag.target = '_blank';
		//padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
		newFlag.style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative; top: 1px;";

		console.log("resolved " + post.region);

		//remove flag from postNrs
		var index = postNrs.indexOf(post.post_nr);
		if (index > -1) {
			postNrs.splice(index, 1);
		}
	});
	
	//cleaning up the postNrs variable here
	//conditions are checked one plus resolved (removed above, return handler) or older than 60s (removed here), keeping it simple

	var timestampMinusFortyFive = Math.round(+new Date()/1000) - postRemoveCounter;

	postNrs.forEach(function (post_nr) {
		var postToAddFlagTo = document.getElementById("pc" + post_nr);
		var postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0];
		var dateTime = postInfo.getElementsByClassName('dateTime')[0];
		
		if (dateTime.getAttribute("data-utc") < timestampMinusFortyFive) {
			var index = postNrs.indexOf(post_nr);
			if (index > -1) {
				postNrs.splice(index, 1);
			}
		}
	});
}

/* fetch flags from db */
function resolveRefFlags() {
	
	var boardID = window.location.pathname.split('/')[1];
	if (boardID === "int" || boardID === "sp" || boardID === "pol") {
	
		GM_xmlhttpRequest({
			method:     "POST",
			url:        backendBaseUrl + "get_flags.php",
			data:       "post_nrs=" + encodeURIComponent (postNrs)
						+ "&" + "board=" + encodeURIComponent (boardID)
			,
			headers:    {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			onload: onFlagsLoad
		});
	}
}

/* send flag to system on 4chan x (v2, loadletter, v3 untested) post
 * handy comment to save by ccd0
 * console.log(e.detail.boardID);  // board name    (string)
 * console.log(e.detail.threadID); // thread number (integer in ccd0, string in loadletter)
 * console.log(e.detail.postID);   // post number   (integer in ccd0, string in loadletter) */
document.addEventListener('QRPostSuccessful', function(e) {
	//setTimeout to support greasemonkey 1.x
	setTimeout(function () {
		GM_xmlhttpRequest({
			method:     "POST",
			url:        backendBaseUrl + "post_flag.php",
			data:       "post_nr=" + encodeURIComponent (e.detail.postID)
						+ "&" + "board=" + encodeURIComponent (e.detail.boardID)
						+ "&" + "region=" + encodeURIComponent (region)
						,
			headers:    {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			onload:     function (response) {
				//hide spam, debug purposes only
				//console.log(response.responseText);
			}
		});
	}, 0);
}, false);

/* send flag to system on 4chan inline post */
document.addEventListener('4chanQRPostSuccess', function(e) {
	
	var boardID = window.location.pathname.split('/')[1];
	var evDetail = e.detail || e.wrappedJSObject.detail;
	//setTimeout to support greasemonkey 1.x
	setTimeout(function () {
		GM_xmlhttpRequest({
			method:     "POST",
			url:        backendBaseUrl + "post_flag.php",
			data:       "post_nr=" + encodeURIComponent (evDetail.postId)
						+ "&" + "board=" + encodeURIComponent (boardID)
						+ "&" + "region=" + encodeURIComponent (region)
						,
			headers:    {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			onload:     function (response) {
				//hide spam, debug only
				//console.log(response.responseText);
			}
		});
	}, 0);
}, false);

/* Listen to post updates from the thread updater for 4chan x v2 (loadletter) and v3 (ccd0 + ?) */
document.addEventListener('ThreadUpdate', function(e) {
	
	//console.log("ThreadUpdate");
	
	var evDetail = e.detail || e.wrappedJSObject.detail;
	
	var evDetailClone = typeof cloneInto === 'function' ? cloneInto(evDetail, unsafeWindow) : evDetail;
	//console.log(evDetailClone);
	
	//ignore if 404 event
	if (evDetail[404] === true) {
		return;
	}
	
	setTimeout(function() {
	
		//add to temp posts and the DOM element to allPostsOnPage
		evDetailClone.newPosts.forEach(function (post_board_nr) {
			var post_nr = post_board_nr.split('.')[1];
			postNrs.push(post_nr);
			var newPostDomElement = document.getElementById("pc" + post_nr);
			allPostsOnPage.push(newPostDomElement);
		});
	
	}, 0);
	//setTimeout to support greasemonkey 1.x
	setTimeout(resolveRefFlags, 0);
	
}, false);

//Listen to post updates from the thread updater for inline extension
document.addEventListener('4chanThreadUpdated', function(e) {
	var evDetail = e.detail || e.wrappedJSObject.detail;
	
	var threadID = window.location.pathname.split('/')[3]; //get thread ID
	var postsContainer = Array.prototype.slice.call(document.getElementById('t'  + threadID).childNodes); //get an array of postcontainers
	var lastPosts = postsContainer.slice(Math.max(postsContainer.length - evDetail.count, 1)); //get the last n elements (where n is evDetail.count)

	//add to temp posts and the DOM element to allPostsOnPage
	lastPosts.forEach(function (post_container) {
		var post_nr = post_container.id.replace("pc", "");
		postNrs.push(post_nr);
		allPostsOnPage.push(post_container);
	});
	//setTimeout to support greasemonkey 1.x
	setTimeout(resolveRefFlags, 0);
	
}, false);

setup.init();
