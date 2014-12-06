// ==UserScript==
// @name        Extra Flags for int
// @namespace   com.whatisthisimnotgoodwithcomputers.extraflagsforint
// @include     http*://boards.4chan.org/int/*
// @include     http*://boards.4chan.org/sp/*
// @exclude     http*://boards.4chan.org/int/catalog
// @exclude     http*://boards.4chan.org/sp/catalog
// @version     1
// @grant       GM_xmlhttpRequest
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.js
// ==/UserScript==

// ===============SETTINGS SECTION==================
//configure your region here
//NOTE: this will be removed in next versions, we are implementing a database which will check for you're location.
var region = "Noord-Brabant";

//================END OF SETTINGS===================
//Don't edit below this line if you don't know what you're doing
//==================================================


var allPostsOnPage = document.getElementsByClassName('post reply');

for (var i=0, max=allPostsOnPage.length; i<max; i++) {
  
  var nameBlock = allPostsOnPage[i].getElementsByClassName('postInfo desktop')[0].getElementsByClassName('nameBlock')[0];
  var name = nameBlock.getElementsByClassName('name')[0];
  
  if (name.innerHTML === 'Friesland') {
    var fleg = $(name).first().next();
    var newFleg = fleg.clone().attr("title", "Friesland").appendTo(nameBlock);
    newFleg[0].innerHTML = "<img src='https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-int-/master/flegs/Netherlands/Friesland.png'>";
    newFleg[0].className = newFleg[0].className = "noClass";
    //padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
    newFleg[0].style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative; top: 1px;"
  } else if (name.innerHTML === 'Noord-Brabant') {
    var fleg = $(name).first().next();
    var newFleg = fleg.clone().attr("title", "Noord-Brabant").appendTo(nameBlock);
    newFleg[0].innerHTML = "<img src='https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-int-/master/flegs/Netherlands/Noord-Brabant.png'>";
    newFleg[0].className = newFleg[0].className = "noClass";
    //padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
    newFleg[0].style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative; top: 1px;"
  }
}

//send flag to system
document.addEventListener('QRPostSuccessful', function(e) {
  console.log(e.detail.boardID);  // board name    (string)
  console.log(e.detail.threadID); // thread number (integer in ccd0, string in loadletter)
  console.log(e.detail.postID);   // post number   (integer in ccd0, string in loadletter)
  
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
        console.log (response.responseText);
    }
} );
  
}, false);
