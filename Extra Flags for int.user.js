// ==UserScript==
// @name        Extra Flags for int
// @namespace   com.whatisthisimnotgoodwithcomputers.extraflagsforint
// @description Extra Flags for int
// @include     http*://boards.4chan.org/int/*
// @exclude     http*://boards.4chan.org/int/catalog
// @version     0.4
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @updateURL	https://github.com/stallmaninterjector/Extra-Flags-for-int-/raw/master/Extra%20Flags%20for%20int.user.js
// @downloadURL	https://github.com/stallmaninterjector/Extra-Flags-for-int-/raw/master/Extra%20Flags%20for%20int.user.js
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.js
// ==/UserScript==

// ===============SETTINGS SECTION==================

//change this variable if you wish to override the GeoIP data
var region="";
//================END OF SETTINGS===================
//Don't edit below this line if you don't know what you're doing
//==================================================
if(region!=""){
	getRegion();
}
function getRegion() {

	GM_xmlhttpRequest ( {
	method:     "GET",
	url:        "http://ipinfo.io/region",
	headers: {
    "User-Agent": "curl/7.9.8",    // If not specified, navigator.userAgent will be used.
  },	
	onload:     function (response) {		
			region=response.response;			
	}
	} );
}
var allPostsOnPage = new Array();
var postNrs = new Array();
var postRemoveCounter = 60;

var tempAllPostsOnPage = document.getElementsByClassName('postContainer');

//fix to make JS understand allPostsOnPage is actually an Array
for (var i=0, max=tempAllPostsOnPage.length; i<max; i++) {
	allPostsOnPage.push(tempAllPostsOnPage[i]);
}

for (var i=0, max=allPostsOnPage.length; i<max; i++) {
	var tempPostNr = allPostsOnPage[i].id;
	tempPostNr = tempPostNr.replace("pc","");
	postNrs.push(tempPostNr);
}	

resolveRefFlags();

//the function to get the flags from the db
//uses postNrs
//member variable might not be very nice but I'm gonna do it anyways!
function resolveRefFlags() {
	
//greasemonkey http request
GM_xmlhttpRequest ( {
method:     "POST",
url:        "http://flaghunters.x10host.com/get_flags.php",
data:       "post_nrs=" + encodeURIComponent (postNrs)
            //+ "&" + "board=" + encodeURIComponent (e.detail.boardID)
            //+ "&" + "region=" + encodeURIComponent (region)
            ,
headers:    {
    "Content-Type": "application/x-www-form-urlencoded"
	},
	onload:     function (response) {
    //parse returned data
	var jsonData = JSON.parse(response.responseText);

	for (var i = 0; i < jsonData.length; i++) {
		var post = jsonData[i];
		var postToAddFlagTo = document.getElementById("pc" + post.post_nr);
		var nameBlock = postToAddFlagTo.getElementsByClassName('post')[0]
			.getElementsByClassName('postInfo')[0].getElementsByClassName('nameBlock')[0];
		var name = nameBlock.getElementsByClassName('name')[0];
		
		//for some reason the clone() up ahead needs the first flag and
		//the title for the flag link needs to get it by class
		var currentFlag = $(name).first().next();
		var currentFlagForTitle = nameBlock.getElementsByClassName('flag')[0];

		var newFlag = currentFlag.clone().attr("title", post.region).appendTo(nameBlock);
		
		newFlag[0].innerHTML = "<img src='https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-int-/master/flegs/" + currentFlagForTitle.title + "/" + post.region + ".png'>";
		newFlag[0].className = "noClass";
		//padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
		newFlag[0].style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative; top: 1px;"

		//remove flag from postNrs
		var index = postNrs.indexOf(post.post_nr);
		if (index > -1) {
			postNrs.splice(index, 1);
			console.log("resolved" + post.post_nr);
		}
	}
	
	//cleaning up the postNrs variable here
//conditions are checked one plus resolved (removed above, return handler) or older than 60s (removed here), keeping it simple

var timestampMinusFortyFive = Math.round(+new Date()/1000) - postRemoveCounter;

//copy postNrs to avoid concurrent modifications
var tempPostsArray = postNrs.slice();

for (var i=0, max=tempPostsArray.length; i<max; i++) {
	console.log("should I remove " + "pc" + tempPostsArray[i]);
	var mightDeleteThisPost = document.getElementById("pc" + tempPostsArray[i]).getElementsByClassName('post')[0]
		.getElementsByClassName('postInfo')[0].getElementsByClassName('dateTime')[0];
	if (mightDeleteThisPost.getAttribute("data-utc") < timestampMinusFortyFive) {
		var index = postNrs.indexOf(tempPostsArray[i]);
		if (index > -1) {
			postNrs.splice(index, 1);
			console.log("removed " + tempPostsArray[i]);
		}
	}
}
	}
} );
}

//send flag to system on 4chan x (v2, loadletter, v3 untested) post
document.addEventListener('QRPostSuccessful', function(e) {

	//handy comment to save by ccd0
  //console.log(e.detail.boardID);  // board name    (string)
  //console.log(e.detail.threadID); // thread number (integer in ccd0, string in loadletter)
  //console.log(e.detail.postID);   // post number   (integer in ccd0, string in loadletter)

	//greasemonkey http request
	GM_xmlhttpRequest ( {
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
	} );
}, false);

//send flag to system on 4chan inline post
//TODO
//only works on int for now! need to parse board from somewhere
document.addEventListener('4chanQRPostSuccess', function(e) {
    console.log("4chanQRPostSuccess");
	  
	//greasemonkey http request
	GM_xmlhttpRequest ( {
		method:     "POST",
		url:        "http://flaghunters.x10host.com/post_flag.php",
		data:       "post_nr=" + encodeURIComponent (e.detail.postId)
					+ "&" + "board=" + encodeURIComponent ("int")
					+ "&" + "region=" + encodeURIComponent (region)
					,
		headers:    {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		onload:     function (response) {
			console.log(response.responseText);
		}
	} );
}, false);

//Listen to post updates from the thread updater for 4chan x v2 (loadletter) and v3 (ccd0 + ?)
document.addEventListener('ThreadUpdate', function(e) {
	
    console.log("ThreadUpdate");
    console.log(e);
    console.log(e.detail.newPosts);
    
    //add to temp posts and the DOM element to allPostsOnPage
    for (var i=0, max=e.detail.newPosts.length; i<max; i++) {
		var tempPostNr = e.detail.newPosts[i].replace("int.",""); 
		postNrs.push(tempPostNr);
		var newPostDomElement = document.getElementById("pc" + tempPostNr);
		console.log(newPostDomElement);
		allPostsOnPage.push(newPostDomElement);
		console.log("pushed " + tempPostNr);
	}
	
	//can't trigger here unfortunately
	//this triggers faster than the post can load.
	//OnDOMchange doesnt seem to be the answer either.
	resolveRefFlags();
	
	  
}, false);

//Listen to post updates from the thread updater for inline extension
document.addEventListener('4chanThreadUpdated', function(e) {
	
    console.log("4chanThreadUpdated");

}, false);
