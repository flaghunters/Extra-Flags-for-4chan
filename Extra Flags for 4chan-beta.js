// ==UserScript==
// name and namespace cannot be changed - it would break the update mechanism, that's why we will leave the name at Extra Flags for int
// @name        Extra Flags for int
// @namespace   com.whatisthisimnotgoodwithcomputers.extraflagsforint
// @description Extra Flags for 4chan v2 "City flags were a mistake" edition
// @include     http*://boards.4chan.org/int/*
// @include     http*://boards.4chan.org/sp/*
// @include     http*://boards.4chan.org/pol/*
// @include     http*://boards.4chan.org/bant/*
// @include     http*://boards.4channel.org/int/*
// @include     http*://boards.4channel.org/sp/*
// @include     http*://boards.4channel.org/pol/*
// @include     http*://boards.4channel.org/bant/*
// @exclude     http*://boards.4chan.org/int/catalog
// @exclude     http*://boards.4chan.org/sp/catalog
// @exclude     http*://boards.4chan.org/pol/catalog
// @exclude     http*://boards.4chan.org/bant/catalog
// @exclude     http*://boards.4channel.org/int/catalog
// @exclude     http*://boards.4channel.org/sp/catalog
// @exclude     http*://boards.4channel.org/pol/catalog
// @exclude     http*://boards.4channel.org/bant/catalog
// @version     0.50
// @connect     api.flagtism.com
// @connect	github.com
// @connect	raw.githubusercontent.com
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @run-at      document-end
// @updateURL   https://gitlab.com/flagtism/Extra-Flags-for-4chan/raw/master/Extra%20Flags%20for%204chan-beta.js
// @downloadURL https://gitlab.com/flagtism/Extra-Flags-for-4chan/raw/master/Extra%20Flags%20for%204chan-beta.js
// ==/UserScript==

// DO NOT EDIT ANYTHING IN THIS SCRIPT DIRECTLY - YOUR REGION SHOULD BE CONFIGURED BY USING THE CONFIGURATION BOXES (see install webms for help)

// must wait for replacement for GM_addStyle and GM_registerMenuCommand

/** JSLint excludes */
/*jslint browser: true*/
/*global document, console, GM_addStyle, GM_setValue, GM_getValue, GM_registerMenuCommand, GM_xmlhttpRequest, cloneInto, unsafeWindow*/

/* WebStorm JSLint ticked:
 - uncapitalized constructors
 - missing 'use strict' pragma
 - many var statements
 */

/* Right margin: 160 */

// DO NOT EDIT ANYTHING IN THIS SCRIPT DIRECTLY - YOUR REGION SHOULD BE CONFIGURED BY USING THE CONFIGURATION BOXES (see install webms for help)
var regions = [];
var radio = "all";
var lastRegion = ""; //used for back button
var regionVariable = 'regionVariableAPI2';
var radioVariable = 'radioVariableAPI2';
var dumpVariable = 'dumpVariableAPI2';
var panelStatusVariable = 'panelStatusVariableAPI2';
var allPostsOnPage = [];
var postNrs = [];
var postRemoveCounter = 60;
var requestRetryInterval = 5000;
var flegsBaseUrl = 'https://github.com/flaghunters/Extra-Flags-for-4chan/raw/master/flags/';
// remove comment and change link to add country flag icons into selection menu var countryFlegsBaseUrl = 'https://raw.githubusercontent.com/flagzzzz/Extra-Flags-for-4chan/master/flags/';
var flagListFile = 'flag_list.txt';
var backendBaseUrl = 'https://api.flagtism.com/';//var backendBaseUrl = 'https://nun.wtf/';
var postUrl = 'int/post_flag_api2.php';
var getUrl = 'int/get_flags_api2.php';
var shortId = 'witingwc.ef.';
var nextupID = "nextupID";
var panelStatus = false;
var buttonID = "toggleList";
var saveListID = "saveList";
var clearListID = "clearList";
var closeID = "closeDump";
var textListID = "textList";
var regionDivider = "||";
var dumpArray = [];

/** Setup, preferences */
var setup = {
    namespace: 'com.whatisthisimnotgoodwithcomputers.extraflagsforint.',
    id: "ExtraFlags-setup",
    html: function () {

        var htmlFixedStart = '<div>Extra Flags for 4chan v2</div><br/>';
        var htmlBackButton = '<button name="back">Back</button>';
        var htmlNextButton = '<button name="forward">Next</button>';
        var htmlBackNextButtons = '<div>' + htmlBackButton + htmlNextButton + '</div>';
        var htmlSaveButton = '<button class="commit" name="save" title="Pressing &#34;Save Regions&#34; will set your regions to the ones current displayed below.">' +
            'Save Regions</button>';
        var htmlAddToListButton = '<button class="commit" name="addtolist" title="Pressing &#34;Add to List&#34; will add the regions to the region dumping list below.">' +
            'Add to List</button>';
        var htmlHelpText = '<label name="' + shortId + 'label"> You can go as deep as you like, regions stack.<br/>' +
            'For example; United States, California, Los Angeles<br/></label>' +
            '<label>Country must match your flag! Your flag not here? Open issue here:<br/>' +
            '<a href="https://gitlab.com/flagtism/Extra-Flags-for-4chan/issues" style="color:blue">' +
            'https://gitlab.com/flagtism/Extra-Flags-for-4chan/issues</a></label>';
        var filterRadio = '<br/><br/><form id="filterRadio">' +
            '<input type="radio" name="filterRadio" id="filterRadioall" style="display: inline !important;" value="all"><label>Show country + ALL regions.</label>' +
            '<br/><input type="radio" name="filterRadio" id="filterRadiofirst" style="display: inline !important;" value="first"><label>Only show country + FIRST region.</label>' +
            '<br/><input type="radio" name="filterRadio" id="filterRadiolast" style="display: inline !important;" value="last"><label>Only show country + LAST region. (v1/old format)</label>' +
            '</form>';

        var htmlDumpButtons = '<button class="dump" id="' + saveListID + '" name="savelist">Save List</button>' +
            '<button class="dump" id="' + clearListID + '" name="clearlist">Clear List</button>' +
            '<button class="dump" id="' + buttonID + '" name="togglelist">&#x25b2;</button>' +
            '<button class="dump" id="' + closeID + '" name="close">X</button>';
    
        var htmlDumpStart = '<br/><div>' +
            '<div>Flag Dumper config</div><br/><br/>' +
            '<div>'+ htmlDumpButtons + '</div></div>';
    
        var htmlList = '<div id="textDiv"><br/>' +
            '<textarea id="' + textListID + '" name="textArea" style="height:150px;width:400px"></textarea><br/>' +
            '<label for="' + nextupID + '">Next up:</label>' +
            '<p id="' + nextupID + '"></p>';
    
        var htmlDumpPortion = htmlDumpStart + htmlList;

        if (regions.length > 1) {
            var selectMenuFlags = "Regional flags selected: ";
            var path = flegsBaseUrl + "/" + regions[0];
            for (var i = 1; i < regions.length; i++) {
                path += "/" + regions[i];
                selectMenuFlags += "<img src=\"" + path + ".png\"" + " title=\"" + regions[i] + "\"> ";
            }
            selectMenuFlags += "<br/>";
            return htmlFixedStart + '<div>Region: <br/><select id="' + shortId + 'countrySelect">' +
                '</select></div><br/>' + htmlBackNextButtons +
                '<br/><div>' + htmlSaveButton + htmlAddToListButton + '</div><br/></div>' + selectMenuFlags + htmlHelpText + filterRadio + htmlDumpPortion;
        }

        if (regions.length == 1) {
            var selectMenuFlags = "<br/>";
            return htmlFixedStart + '<div>Region: <br/><select id="' + shortId + 'countrySelect">' +
                '</select></div><br/>' + htmlBackNextButtons +
                '<br/>' + '</div><br/><br/>' + selectMenuFlags + htmlHelpText + filterRadio + htmlDumpPortion;
       }

        return htmlFixedStart + '<div>Country: <br/><select id="' + shortId + 'countrySelect">' +
            '</select></div><br/>' + htmlBackNextButtons + '<br/>' + htmlHelpText + filterRadio + htmlDumpPortion;

    },
    fillHtml: function (path1) {
        var textDiv = document.getElementById(textListID);
        var textDump = dumpArray.join('\n');
        textDiv.value = textDump;

        if (path1 === "") { //normal call
            var path = flegsBaseUrl + "/";
            var oldPath = path;
            if (regions.length > 0) {
                for (var i = 0; i < regions.length; i++) {
                    oldPath = path;
                    path += regions[i] + "/";
                }
            }
            var pathNoFlagList = path;
        } else { // end of folder line call
            path = path1;
            oldPath = "";
            var pathNoFlagList = path;
        }

        /* resolve countries which we support */
        GM_xmlhttpRequest({
            method: "GET",
            url: path + flagListFile,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: function (response) {
                if (response.status == 404) { // detect if there are no more folders
                    setup.fillHtml(oldPath);
                    setup.q('forward').disabled = true; // disable next button
                } else {
                    //hide spam, debug purposes only
                    //console.log(response.responseText);
                    var countrySelect = document.getElementById(shortId + 'countrySelect'),
                        countriesAvailable = response.responseText.split('\n');

                    if (countriesAvailable.length==0) {
                        setup.fillHtml(oldPath);
                        setup.q('forward').disabled = true; // disable next button
                        return;
                    }
                    countrySelect.innerHTML = "";

                    for (var countriesCounter = 0; countriesCounter < countriesAvailable.length; countriesCounter++) {
                        var country = countriesAvailable[countriesCounter].trim();
                        if (country === "") { continue; }

                        var opt = document.createElement('option');
                        opt.value = country;
                        opt.innerHTML = country;

                        if (lastRegion != "" && country === lastRegion) { // automatically select last selected when going up a folder
                            opt.selected = "selected";
                        } else if (oldPath == "" && country === regions[regions.length - 1]) { // show final selected when no more
                            // folders detected
                            opt.selected = "selected";
                        }
                        countrySelect.appendChild(opt);
                    }
                }

            }
        });
    },
    setRadio: function() {
        var radioStatus = setup.load(radioVariable);
        if (!radioStatus || radioStatus === "" || radioStatus === "undefined") {
            radioStatus = "all";
        }
        var radioButton = document.getElementById("filterRadio" + radioStatus);
        radioButton.checked = true;
    },
    loadToggle: function() {
        var toggleStatus = setup.load(panelStatusVariable);
        if (toggleStatus === "" || toggleStatus === "undefined" || (toggleStatus!==false && toggleStatus!==true)) {
            panelStatus = true;
        }
        setup.setToggleVisibility();
    },
    setToggleVisibility: function () {
        var textDiv = document.getElementById(textListID);
        var toggleButton = document.getElementById(buttonID);
        if (panelStatus === true) {
            textDiv.style.display = "unset";
            toggleButton.innerHTML = "&#x25b2;";
            toggleButton.title = "Hide list";
        }
        if (panelStatus === false) {
            textDiv.style.display = "none";
            toggleButton.innerHTML = "&#x25bc;";
            toggleButton.title = "Show list";
        }
    },
    q: function (n) {
        return document.querySelector('#' + this.id + ' *[name="' + n + '"]');
    },
    show: function () {
        /* remove setup window if existing */
        var setup_el = document.getElementById(setup.id);
        if (setup_el) {
            setup_el.parentNode.removeChild(setup_el);
        }
        /* create new setup window */
        setup_el = document.createElement('div');
        setup_el.id = setup.id;
        setup_el.innerHTML = setup.html();
        
        document.body.appendChild(setup_el);
        setup.fillHtml("", "");

        setup.setRadio();

        setup.loadToggle();

        var nextup = document.getElementById(nextupID);
        if (dumpArray && dumpArray.length>0) {
          nextup.innerHTML = dumpArray[0];
        } else {
          nextup.innerHTML = '--';
        }

        /* button listeners */
        setup.q('back').addEventListener('click', function () {
            if (regions.length > 0) {
                if (setup.q('forward').disabled == true) {
                    setup.q('forward').disabled = false; // reenable next button
                }
                lastRegion = regions[regions.length - 1];
                regions.pop();
                setup.show();
            }
        }, false);

        setup.q('forward').addEventListener('click', function () {
            var e = document.getElementById(shortId + "countrySelect");
            var temp = e.options[e.selectedIndex].value;
            lastRegion = "";
            if (temp != "") {
                this.disabled = true;
                this.innerHTML = 'Saving...';

                lastRegion = regions[regions.length - 1];
                regions.push(temp);
                setup.show();
            }

        }, false);

        setup.q('save').addEventListener('click', function () {
            var e = document.getElementById(shortId + "countrySelect");

            if (regions[regions.length - 1] === "") { //prevent last spot from being blank
                regions.pop();
            }
            lastRegion = "";

            radio = document.querySelector('input[name="filterRadio"]:checked').value;
            setup.save(radioVariable, radio);

            alert('Flags set: ' + regions + '\n\n' + 'Be sure to post using the quick reply window!');

            this.disabled = true;
            this.innerHTML = 'Saving...';
            setup_el.parentNode.removeChild(setup_el);
            setup.save(regionVariable, regions);

        }, false);

        setup.q('addtolist').addEventListener('click', function () {
            if (regions[regions.length - 1] === "") { //prevent last spot from being blank
                regions.pop();
            }
            var dumpString = regions.join(regionDivider);
            var textarea = document.getElementById(textListID);
            var textDump = textarea.value;
            var tempvar = textDump.split('\n');
            if (tempvar.length == 1 && tempvar[0].trim() == "") {
                textarea.value = dumpString;
            } else {
                textarea.value = textDump + '\n' + dumpString;
            }
            document.getElementById(saveListID).click();
        })
   
        setup.q('savelist').addEventListener('click', function () {
            var textDump = document.getElementById(textListID).value;
            var tempvar = textDump.split('\n');
            dumpArray = [""];
            var x=0;
            for (var i = 0; i < tempvar.length; i++) {
                    if (tempvar[i].trim() != "") {
                      dumpArray[x] = tempvar[i];
                      x++;
                    }
                  }
            setup.save(dumpVariable,dumpArray);
            setup.show();
        }, false);
   
        setup.q('togglelist').addEventListener('click', function () {
            toggleButton();
            setup.setToggleVisibility();
        }, false);
   
        setup.q('close').addEventListener('click', function () {
            setup_el.parentNode.removeChild(setup_el);
        }, false);
   
        setup.q('clearlist').addEventListener('click', function () {
            document.getElementById(textListID).value='';
            document.getElementById(saveListID).click();
        }, false);
    },
    save: function (k, v) {
        GM_setValue(setup.namespace + k, v);
    },
    load: function (k) {
        return GM_getValue(setup.namespace + k);
    },
    init: function () {
        GM_registerMenuCommand('Extra Flags setup', setup.show);
    }
};


/** Prompt to set region if regionVariable is empty  */
regions = setup.load(regionVariable);
radio = setup.load(radioVariable);
if (!regions) {
    regions = [];
    setTimeout(function () {
        if (window.confirm("Extra Flags: No region detected, set it up now?") === true) {
            setup.show();
        }
    }, 2000);
}
if (!radio || radio === "" || radio === "undefined") {
    radio = "all";
}
panelStatus = setup.load(panelStatusVariable);
if (panelStatus === "" || panelStatus === "undefined" || (panelStatus!==false && panelStatus!==true)) {
    panelStatus = true;
}
dumpArray = setup.load(dumpVariable);
if (!dumpArray) {
    dumpArray = [];
}

function openReplyBox() {
  var setup_el = document.getElementById(setup.id);
  if (setup_el) {
      setup_el.parentNode.removeChild(setup_el);
  }
  var btn = document.getElementsByClassName("qr-link-bottom")[0];
  if (!!btn) { // 4chanx
      btn.click();
      setTimeout(() => {
          var comment=document.getElementById("char-count").previousSibling;
          if (dumpArray[0]) {
              comment.value=dumpArray[0];
              var submitBtn = document.getElementById("qr-filename-container").nextSibling;
              submitBtn.click(); // autoreply
          }
      }, 200);
      return;
  }
  btn = document.getElementsByClassName("open-qr-link")[0];
  if (!!btn) { // vanilla 4chan
      btn.click();
      setTimeout(() => {
          var comment=document.getElementById("qrCaptchaContainer").previousSibling.firstChild;
          if (dumpArray[0]) {
              comment.value=dumpArray[0];
              var submitBtn = document.getElementById("qrFile").nextSibling;
              submitBtn.click(); // autoreply
          }
      }, 200);
      return;
  }
}

function toggleButton() {
    panelStatus= !panelStatus;
    setup.save(panelStatusVariable, panelStatus);
}

/** parse the posts already on the page before thread updater kicks in */
function parseOriginalPosts() {
    var tempAllPostsOnPage = document.getElementsByClassName('postContainer');
    
    // If no posts found, retry after a short delay (needed for index to work with 4chan X)
    if (tempAllPostsOnPage.length === 0) {
        setTimeout(parseOriginalPosts, 250);
        return;
    }
    
    allPostsOnPage = Array.prototype.slice.call(tempAllPostsOnPage); //convert from element list to javascript array
    postNrs = allPostsOnPage.map(function (p) {
        return p.id.replace("pc", "");
    });
    
    resolveRefFlags();
}

/** the function to get the flags from the db uses postNrs
 *  member variable might not be very nice but it's the easiest approach here */
function onFlagsLoad(response) {
    //exit on error
    if (response.status !== 200) {
        console.log("Could not fetch flags, status: " + response.status);
        console.log(response.statusText);
        setTimeout(resolveRefFlags, requestRetryInterval);
        return;
    }

    var jsonData = JSON.parse(response.responseText);

    jsonData.forEach(function (post) {
        var postedRegions = post.region.split(regionDivider),
            postToAddFlagTo = document.getElementById("pc" + post.post_nr),
            postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0],
            nameBlock = postInfo?.getElementsByClassName('nameBlock')[0],
            postInfoM = postToAddFlagTo.getElementsByClassName('postInfoM')[0],
            nameBlockM = postInfoM?.getElementsByClassName('nameBlock')[0];

        var currentFlag = nameBlock?.getElementsByClassName('flag')[0] || nameBlockM.getElementsByClassName('flag')[0];

        if (postedRegions.length > 0 && !(currentFlag === undefined)) {
            var path = currentFlag.title;
            for (var i = 0; i < postedRegions.length; i++) {
                path += "/" + postedRegions[i];

                // this is probably quite a dirty fix, but it's fast
                if ((radio === "all") || (radio === "first" && i === 0) || (radio === "last" && i === (postedRegions.length - 1))) {
                    var newFlag = document.createElement('a');

                    var lastI = i;
                    if (radio === 'last') {
                        lastI = 0;
                    }

                    var newFlagImgOpts = 'onerror="(function () {var extraFlagsImgEl = document.getElementById(\'pc' + post.post_nr +
                        '\').getElementsByClassName(\'extraFlag\')[' + lastI +
                        '].firstElementChild; if (!/\\/empty\\.png$/.test(extraFlagsImgEl.src)) {extraFlagsImgEl.src = \'' +
                        flegsBaseUrl + 'empty.png\';}})();"';

                    newFlag.innerHTML = "<img src=\"" + flegsBaseUrl + path + ".png\"" + newFlagImgOpts + " title=\"" + postedRegions[i] + "\">";
                    newFlag.className = "extraFlag";

                    if (i > 0) {
                        newFlag.href = "https://www.google.com/search?q=" + postedRegions[i] + ", " + postedRegions[i - 1];
                    } else {
                        newFlag.href = "https://www.google.com/search?q=" + postedRegions[i] + ", " + currentFlag.title;
                    }

                    newFlag.target = '_blank';
                    //padding format: TOP x RIGHT_OF x BOTTOM x LEFT_OF
                    newFlag.style = "padding: 0px 0px 0px 5px; vertical-align:;display: inline-block; width: 16px; height: 11px; position: relative;";

                    nameBlock?.appendChild(newFlag);
                    nameBlockM?.appendChild(newFlag.cloneNode(true));

                    console.log("resolved " + postedRegions[i]);
                }
            }
        }

        //postNrs are resolved and should be removed from this variable
        var index = postNrs.indexOf(post.post_nr);
        if (index > -1) {
            postNrs.splice(index, 1);
        }
    });

    //removing posts older than the time limit (they likely won't resolve)
    var timestampMinusPostRemoveCounter = Math.round(+new Date() / 1000) - postRemoveCounter;

    postNrs.forEach(function (post_nr) {
        var postToAddFlagTo = document.getElementById("pc" + post_nr),
            postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0],
            dateTime = postInfo.getElementsByClassName('dateTime')[0];

        if (dateTime.getAttribute("data-utc") < timestampMinusPostRemoveCounter) {
            var index = postNrs.indexOf(post_nr);
            if (index > -1) {
                postNrs.splice(index, 1);
            }
        }
    });
}

/** fetch flags from db */
function resolveRefFlags() {
    var boardID = window.location.pathname.split('/')[1];
    if (boardID === "int" || boardID === "sp" || boardID === "pol" || boardID === "bant") {

        // Check if postNrs is empty before making request
        if (postNrs.length === 0) {
            console.log("No posts to resolve, skipping request");
            return;
        }

        GM_xmlhttpRequest({
            method: "POST",
            url: backendBaseUrl + getUrl,
            data: "post_nrs=" + encodeURIComponent(postNrs) + "&" + "board=" + encodeURIComponent(boardID),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            onload: onFlagsLoad
        });
    }
}

/** send flag to system on 4chan x (v2, loadletter, v3 untested) post
 *  handy comment to save by ccd0
 *  console.log(e.detail.boardID);  // board name    (string)
 *  console.log(e.detail.threadID); // thread number (integer in ccd0, string in loadletter)
 *  console.log(e.detail.postID);   // post number   (integer in ccd0, string in loadletter) */
document.addEventListener('QRPostSuccessful', function (e) {
    //setTimeout to support greasemonkey 1.x
  if (dumpArray.length>0 && dumpArray[0]!=''){
    console.log(dumpArray[0]);
    setTimeout(function () {
      GM_xmlhttpRequest({
        method: "POST",
        url: backendBaseUrl + postUrl,
        data: "post_nr=" + encodeURIComponent(e.detail.postID) + "&" + "board=" + encodeURIComponent(e.detail.boardID) + "&" + "regions=" +
        encodeURIComponent(dumpArray[0].split(regionDivider).slice(1).join(regionDivider)),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function (response) {
          dumpArray.splice(0,1); // delete the first element
          setup.save(dumpVariable, dumpArray);
          //setup.show();
          openReplyBox();
        }
      });
    }, 0);
  } else {
    setTimeout(function () {
      GM_xmlhttpRequest({
        method: "POST",
        url: backendBaseUrl + postUrl,
        data: "post_nr=" + encodeURIComponent(e.detail.postID) + "&" + "board=" + encodeURIComponent(e.detail.boardID) + "&" + "regions=" +
        encodeURIComponent(regions.slice(1).join(regionDivider)),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function (response) {
          //hide spam, debug purposes only
          console.log(response.responseText);
        }
      });
    }, 0);
  }
}, false);

/** send flag to system on 4chan inline post */
document.addEventListener('4chanQRPostSuccess', function (e) {
    var boardID = window.location.pathname.split('/')[1];
    var evDetail = e.detail || e.wrappedJSObject.detail;
    //setTimeout to support greasemonkey 1.x
  if (dumpArray.length>0 && dumpArray[0]!=''){
    console.log(dumpArray[0]);
    setTimeout(function () {
      GM_xmlhttpRequest({
        method: "POST",
        url: backendBaseUrl + postUrl,
        data: "post_nr=" + encodeURIComponent(evDetail.postId) + "&" + "board=" + encodeURIComponent(boardID) + "&" + "regions=" +
        encodeURIComponent(dumpArray[0].split(regionDivider).slice(1).join(regionDivider)),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function (response) {
          dumpArray.splice(0,1); // delete the first element
          setup.save(dumpVariable, dumpArray);
          //setup.show();
          openReplyBox();
        }
      });
    }, 0);
  } else {
    setTimeout(function () {
      GM_xmlhttpRequest({
        method: "POST",
        url: backendBaseUrl + postUrl,
        data: "post_nr=" + encodeURIComponent(evDetail.postId) + "&" + "board=" + encodeURIComponent(boardID) + "&" + "regions=" +
        encodeURIComponent(regions.slice(1).join(regionDivider)),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        onload: function (response) {
          //hide spam, debug only
          //console.log(response.responseText);
        }
      });
    }, 0);
  }
}, false);

/** Listen to post updates from the thread updater for 4chan x v2 (loadletter) and v3 (ccd0 + ?) */
document.addEventListener('ThreadUpdate', function (e) {
    var evDetail = e.detail || e.wrappedJSObject.detail;
    var evDetailClone = typeof cloneInto === 'function' ? cloneInto(evDetail, unsafeWindow) : evDetail;

    //ignore if 404 event
    if (evDetail[404] === true) {
        return;
    }

    setTimeout(function () {
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

/** Listen to post updates from the thread updater for inline extension */
document.addEventListener('4chanThreadUpdated', function (e) {
    var evDetail = e.detail || e.wrappedJSObject.detail;

    var threadID = window.location.pathname.split('/')[3];
    var postsContainer = Array.prototype.slice.call(document.getElementById('t' + threadID).childNodes);
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

/** Detect index page navigation when using 4chan X */
(function() {
    var originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(history, arguments);
        //setTimeout to support greasemonkey 1.x
        setTimeout(parseOriginalPosts, 0);
    };
})();

/** START fix flag alignment on chrome */
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

if (navigator.userAgent.toLowerCase().indexOf('webkit') > -1) {
    addGlobalStyle('.flag{top: 0px !important;left: -1px !important}');
}
/** END fix flag alignment on chrome */

// add styles only once and not each time we call .show()
GM_addStyle('\
    #' + setup.id + ' { position:fixed;z-index:10001;top:40px;right:40px;padding:20px 30px;background-color:white;width:auto;border:1px solid black }\
    #' + setup.id + ' * { color:black;text-align:left;line-height:normal;font-size:12px }\
    #' + setup.id + ' button.commit { width:100px;text-align:center; } }\
    #' + setup.id + ' button.dump { vertical-align:top;height:2em }\
    #' + setup.id + ' textarea { resize:none;white-space:pre;overflow-x:auto;text-align:left;line-height:normal;font-size:12px }\
    #' + setup.id + ' div { text-align:center;font-weight:bold;font-size:14px }'
);

/** setup init and start first calls */
setup.init();
parseOriginalPosts();