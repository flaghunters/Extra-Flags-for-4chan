//console.log("rolling flaghunters code");

//Settings
var allPostsOnPage = new Array();
var postNrs = new Array();
var postRemoveCounter = 60;
//incompatible
//var requestRetryInterval = 5000;
var flegsBaseUrl = 'https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-int-/master/flegs/';
var navigatorIsWebkit = navigator.userAgent.toLowerCase().indexOf('webkit') > -1;
var backendBaseUrl = 'http://whatisthisimnotgoodwithcomputers.com/';

var region;
var antiLoop = 0;

//get region
//it's necessary to actively recheck for the region as it's not updated otherwise
self.on("message", function(newRegion) {
	if (newRegion == "ready2go_xyz_" && antiLoop == 0) {
		antiLoop = 1;
		self.postMessage("getRegion");
	} else {
		region = newRegion;
	}
});


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
	//check is incompatible
	/*
	if(response.status !== 200) {
		console.log("Could not fetch flags, status: " + response.status);
		console.log(response.statusText);
		setTimeout(resolveRefFlags, requestRetryInterval);
		return;
	}
	*/

	//parse returned data
	var jsonData = JSON.parse(response);
	for (var i = 0; i < jsonData.length; i++) {
		//get post
		var post = jsonData[i];
		var postToAddFlagTo = document.getElementById("pc" + post.post_nr);
		
		//add flag for deskop/tablet
		var postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0];
		var nameBlock = postInfo.getElementsByClassName('nameBlock')[0];
		var currentFlag = nameBlock.getElementsByClassName('flag')[0];
		var newFlag = document.createElement('a');
		
		nameBlock.appendChild(newFlag);
		newFlag.title = post.region;
		var newFlagImgOpts = (navigatorIsWebkit ? " style='padding-left: 5px;'" : "") + 'onerror="(function () {var extraFlagsImgEl = document.getElementById(\'pc' + post.post_nr + '\').getElementsByClassName(\'extraFlag\')[0].firstElementChild; if (!/\\/empty\\.png$/.test(extraFlagsImgEl.src)) {extraFlagsImgEl.src = \'' + flegsBaseUrl + 'empty.png\';}})();"';
		newFlag.innerHTML = "<img src='" + flegsBaseUrl + currentFlag.title + "/" + post.region + ".png'" + newFlagImgOpts + ">";
		newFlag.className = "extraFlag";
		newFlag.href = "https://www.google.com/search?q=" + post.region + ", " + currentFlag.title;
		newFlag.target = '_blank';
		//padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
		newFlag.style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative; top: 1px;";
		
		//console.log("resolved " + post.region);
		
		//add flag for mobile
		var mobilePostInfo = postToAddFlagTo.getElementsByClassName('postInfoM')[0];
		var mobileNameBlock = mobilePostInfo.getElementsByClassName('nameBlock')[0];
		var mobileCurrentFlag = mobileNameBlock.getElementsByClassName('flag')[0];
		var mobileNewFlag = document.createElement('a');
		
		//mobileNameBlock.appendChild(mobileNewFlag);
		insertAfter(mobileNewFlag, mobileCurrentFlag);
		mobileNewFlag.title = post.region;
		var mobileNewFlagImgOpts = (navigatorIsWebkit ? " style='padding-left: 5px;'" : "") + 'onerror="(function () {var extraFlagsImgEl = document.getElementById(\'pc' + post.post_nr + '\').getElementsByClassName(\'extraFlag\')[0].firstElementChild; if (!/\\/empty\\.png$/.test(extraFlagsImgEl.src)) {extraFlagsImgEl.src = \'' + flegsBaseUrl + 'empty.png\';}})();"';
		mobileNewFlag.innerHTML = "<img src='" + flegsBaseUrl + mobileCurrentFlag.title + "/" + post.region + ".png'" + mobileNewFlagImgOpts + ">";
		mobileNewFlag.href = "https://www.google.com/search?q=" + post.region + ", " + mobileCurrentFlag.title;
		mobileNewFlag.target = '_blank';
		//padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
		mobileNewFlag.style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative; top: 1px;";
		
		//remove flag from postNrs
		var index = postNrs.indexOf(post.post_nr);
		if (index > -1) {
			postNrs.splice(index, 1);
		}
    }
	
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

//Insert function to fix insertion for mobile
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

/* fetch flags from db */
function resolveRefFlags() {	
	var boardID = window.location.pathname.split('/')[1];
	if (boardID === "int" || boardID === "sp" || boardID === "pol") {
	
		$.ajax({
			type:     	"POST",
			url:        backendBaseUrl + "get_flags.php",
			data:       "post_nrs=" + encodeURIComponent (postNrs)
						+ "&" + "board=" + encodeURIComponent (boardID)
			,
			beforeSend:   function (request) {
				request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			},
			success: function(response) {
				//console.log(response);
				onFlagsLoad(response);
			}
		});
	}
}

/* send flag to system on 4chan inline post */
document.addEventListener('4chanQRPostSuccess', function(e) {	
	var boardID = window.location.pathname.split('/')[1];
	var evDetail = e.detail || e.wrappedJSObject.detail;
	
	$.ajax({
		type:     	"POST",
		url:        backendBaseUrl + "post_flag.php",
		data:       "post_nr=" + encodeURIComponent (evDetail.postId)
					+ "&" + "board=" + encodeURIComponent (boardID)
					+ "&" + "region=" + encodeURIComponent (region)
					,
		beforeSend:   function (request) {
			request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		},
		success:     function (response) {
			//hide spam, debug only
			//console.log(response);
		}
	});
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
	resolveRefFlags();
	
}, false);
