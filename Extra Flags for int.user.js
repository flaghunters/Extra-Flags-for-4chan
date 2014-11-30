// ==UserScript==
// @name        Extra Flags for int
// @namespace   com.whatisthisimnotgoodwithcomputers.extraflagsforint
// @include     http*://boards.4chan.org/int/*
// @include     http*://boards.4chan.org/sp/*
// @exclude     http*://boards.4chan.org/int/catalog
// @exclude     http*://boards.4chan.org/sp/catalog
// @version     1
// @grant       none
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.js
// ==/UserScript==

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
/*
var post_form = $('form');

$("Submit").click(function(){
  $("p").hide("slow",function(){
    alert("The paragraph is now hidden");
  });
});
*/
