// ==UserScript==
// @name        Extra Flags for int
// @namespace   com.whatisthisimnotgoodwithcomputers.extraflagsforint
// @include     http*://boards.4chan.org/int/*
// @include     http*://boards.4chan.org/sp/*
// @exclude     http*://boards.4chan.org/int/catalog
// @exclude     http*://boards.4chan.org/sp/catalog
// @version     1
// @grant       GM_xmlhttpRequest
// @run-at      document-end
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.js
// ==/UserScript==

// ===============SETTINGS SECTION==================

//configure your region here
//NOTE: this will be removed in next versions, we are implementing a database which will check for you're location.
var region = "Noord-Brabant";

//================END OF SETTINGS===================
//Don't edit below this line if you don't know what you're doing
//==================================================

var allPostsOnPage = document.getElementsByClassName('postContainer');
var postNrs = new Array();

for (var i=0, max=allPostsOnPage.length; i<max; i++) {
	
	var tempPostNr = allPostsOnPage[i].id;
	tempPostNr = tempPostNr.replace("pc","");
	postNrs.push(tempPostNr);
}	
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
		var nameBlock = postToAddFlagTo.getElementsByClassName('post reply')[0]
			.getElementsByClassName('postInfo desktop')[0].getElementsByClassName('nameBlock')[0];
		var name = nameBlock.getElementsByClassName('name')[0];
		
		//for some reason the clone() up ahead needs the first flag and
		//the title for the flag link needs to get it by class
		var currentFlag = $(name).first().next();
		var currentFlagForTitle = nameBlock.getElementsByClassName('flag')[0];

		var newFlag = currentFlag.clone().attr("title", post.region).appendTo(nameBlock);
		
		newFlag[0].innerHTML = "<img src='https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-int-/master/flegs/" + currentFlagForTitle.title + "/" + post.region + ".png'>";
		newFlag[0].className = newFlag[0].className = "noClass";
		//padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
		newFlag[0].style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative; top: 1px;"
	}
	}
} );

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

