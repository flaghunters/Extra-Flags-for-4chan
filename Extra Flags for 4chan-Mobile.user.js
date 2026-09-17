// ==UserScript==
//  This has been deprecated in favor of the main script revised to supports both desktop and mobile starting from 0.46.
// name and namespace cannot be changed - it would break the update mechanism, that's why we will leave the name at Extra Flags for int
// @name        Extra Flags for int
// @namespace   com.whatisthisimnotgoodwithcomputers.extraflagsforint
// @description Extra Flags for 4chan v2 "City flags were a mistake" edition - Mobile version.
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
// @version     0.60
// @connect     api.flagtism.com
// @connect     github.com
// @connect     raw.githubusercontent.com
// @grant       GM_xmlhttpRequest
// @grant       GM_registerMenuCommand
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// @run-at      document-end
// @updateURL   https://gitlab.com/flagtism/Extra-Flags-for-4chan/raw/master/Extra%20Flags%20for%20int.user.js
// @downloadURL https://gitlab.com/flagtism/Extra-Flags-for-4chan/raw/master/Extra%20Flags%20for%20int.user.js
// ==/UserScript==

// DO NOT EDIT ANYTHING IN THIS SCRIPT DIRECTLY - YOUR REGION SHOULD BE CONFIGURED BY USING THE CONFIGURATION BOXES (see install webms for help)

// must wait for replacement for GM_addStyle and GM_registerMenuCommand

/** JSLint excludes */
/*jslint browser: true*/
/*global document, console, GM_addStyle, GM_setValue, GM_getValue, GM_registerMenuCommand, GM_xmlhttpRequest*/

/* WebStorm JSLint ticked:
 - uncapitalized constructors
 - missing 'use strict' pragma
 - many var statements
 */

/* Right margin: 160 */

// DO NOT EDIT ANYTHING IN THIS SCRIPT DIRECTLY - YOUR REGION SHOULD BE CONFIGURED BY USING THE CONFIGURATION BOXES (see install webms for help)
var regions = [];
var regionVariable = 'regionVariableAPI2';
var panelPosVariable = 'panelPosVariableAPI2';
var postNrs = [];
var knownRegions = {};
var postRemoveCounter = 60;
var requestRetryInterval = 5000;
var requestRetryMax = 300000;
var requestTimeout = 15000;
var retryDelay = requestRetryInterval;
var retryTimer = null;
var flegsBaseUrl = 'https://raw.githubusercontent.com/flaghunters/Extra-Flags-for-4chan/master/flags/';
var flagListFile = 'flag_list.txt';
var emptyFlagUrl = flegsBaseUrl + 'empty.png';
var backendBaseUrl = 'https://api.flagtism.com/';//var backendBaseUrl = 'https://nun.wtf/';
var postUrl = 'int/post_flag_api2.php';
var getUrl = 'int/get_flags_api2.php';
var regionDivider = "||";
var issuesUrl = 'https://gitlab.com/flagtism/Extra-Flags-for-4chan/issues';

/** ids for the pieces we inject into 4chan's own UI */
var qrRowId = 'extraflags-qr-row';
var shortcutId = 'shortcut-extraflags';
var navLinkIdPrefix = 'extraflags-nav-';
var mobileNavLinkId = 'extraflags-nav-mobile';
var noticeStackId = 'extraflags-notices';

/** show a message. It clears itself after a few seconds, or on the close cross. */
function notify(text) {
    var stack = document.getElementById(noticeStackId);
    if (!stack) {
        stack = document.createElement('div');
        stack.id = noticeStackId;
        document.body.appendChild(stack);
    }

    var notice = document.createElement('div');
    notice.className = 'reply extraflags-notice';

    var message = document.createElement('span');
    message.className = 'extraflags-notice-text';
    message.textContent = text;
    notice.appendChild(message);

    function dismiss() {
        if (notice.parentNode) {
            notice.parentNode.removeChild(notice);
        }
    }

    var close = document.createElement('span');
    close.className = 'extraflags-notice-close';
    close.textContent = '✖';
    close.addEventListener('click', dismiss, false);
    notice.appendChild(close);

    stack.appendChild(notice);
    setTimeout(dismiss, 6000);
}

var foldPairs = {
    'đ': 'd', 'ħ': 'h', 'ı': 'i', 'ł': 'l', 'ø': 'o', 'ŧ': 't',
    'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'ð': 'd', 'þ': 'th', 'ə': 'e',
    '–': '-', '—': '-', '‘': "'", '’': "'", '´': "'"
};

function fold(text) {
    var folded = text.toLowerCase().replace(/[đħıłøŧßæœðþə–—‘’´]/g, function (ch) {
        return foldPairs[ch];
    });

    if (folded.normalize) {
        folded = folded.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    }
    return folded;
}

function foldReadings(text) {
    var lower = text.toLowerCase(),
        readings = [fold(lower)];

    if (lower.indexOf('ə') > -1) {
        readings.push(fold(lower.replace(/ə/g, 'a')));
    }
    return readings;
}

/** ------------------------------------------------------------------
 *  Setup panel
 *  ------------------------------------------------------------------ */

var setup = {
    namespace: 'com.whatisthisimnotgoodwithcomputers.extraflagsforint.',
    id: "ExtraFlags-setup",

    root: null,
    els: {},

    draft: [],

    levelCache: {},

    levelToken: 0,
    preselect: "",
    names: [],

    save: function (k, v) {
        GM_setValue(setup.namespace + k, v);
    },
    load: function (k) {
        return GM_getValue(setup.namespace + k);
    },
    init: function () {
        GM_registerMenuCommand('Extra Flags setup', setup.open);
    },

    /** url of the directory listing one level below `parts` */
    levelUrl: function (parts) {
        return flegsBaseUrl + (parts.length > 0 ? parts.join('/') + '/' : '');
    },

    /** ---------------- construction ---------------- */

    build: function () {
        if (setup.root) {
            return;
        }

        // stylesheets theme .reply and .postblock
        var root = document.createElement('div');
        root.id = setup.id;
        root.className = 'reply';

        var titleBar = document.createElement('div');
        titleBar.className = 'postblock extraflags-titlebar';

        var title = document.createElement('span');
        title.textContent = 'Extra Flags';
        titleBar.appendChild(title);

        var close = document.createElement('span');
        close.className = 'extraflags-close';
        close.textContent = '✖';
        close.title = 'Close without saving';
        close.addEventListener('click', setup.close, false);
        titleBar.appendChild(close);

        root.appendChild(titleBar);

        var body = document.createElement('div');
        body.className = 'extraflags-body';

        var breadcrumb = document.createElement('div');
        breadcrumb.className = 'extraflags-breadcrumb';
        body.appendChild(breadcrumb);

        var filter = document.createElement('input');
        filter.type = 'text';
        filter.className = 'extraflags-filter';
        filter.placeholder = 'Search…';
        filter.addEventListener('input', function () {
            setup.renderList();
        }, false);
        filter.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                setup.descend();
                return;
            }
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                setup.moveSelection(e.key === 'ArrowDown' ? 1 : -1);
                return;
            }
            if (e.key === 'PageDown' || e.key === 'PageUp') {
                e.preventDefault();
                setup.moveSelection(e.key === 'PageDown' ? list.size : -list.size);
                return;
            }
            if (e.key === 'Backspace' && filter.value === '') {
                e.preventDefault();
                setup.ascend();
            }
        }, false);
        body.appendChild(filter);

        var list = document.createElement('select');
        list.className = 'extraflags-list';
        list.size = 10;
        list.addEventListener('dblclick', function () {
            setup.descend();
        }, false);
        list.addEventListener('keydown', function (e) {
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                filter.focus();
                filter.value += e.key;
                setup.renderList();
                return;
            }
            if (e.key === 'Backspace') {
                e.preventDefault();
                filter.focus();
                if (filter.value === '') {
                    setup.ascend();
                    return;
                }
                filter.value = filter.value.slice(0, -1);
                setup.renderList();
                return;
            }
            if (e.key === 'Enter') {
                e.preventDefault();
                setup.descend();
            }
        }, false);
        body.appendChild(list);

        var status = document.createElement('div');
        status.className = 'extraflags-status';
        body.appendChild(status);

        var current = document.createElement('div');
        current.className = 'extraflags-current';
        body.appendChild(current);

        var buttons = document.createElement('div');
        buttons.className = 'extraflags-buttons';

        var back = document.createElement('button');
        back.textContent = 'Back';
        back.addEventListener('click', function () {
            setup.ascend();
        }, false);
        buttons.appendChild(back);

        var next = document.createElement('button');
        next.textContent = 'Next';
        next.addEventListener('click', function () {
            setup.descend();
        }, false);
        buttons.appendChild(next);

        var saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', setup.commit, false);
        buttons.appendChild(saveButton);

        body.appendChild(buttons);

        var help = document.createElement('div');
        help.className = 'extraflags-help';
        help.appendChild(document.createTextNode('Flag missing? '));
        var helpLink = document.createElement('a');
        helpLink.href = issuesUrl;
        helpLink.target = '_blank';
        helpLink.textContent = 'Open an issue';
        help.appendChild(helpLink);
        help.appendChild(document.createTextNode('.'));
        body.appendChild(help);

        root.appendChild(body);
        document.body.appendChild(root);

        setup.root = root;
        setup.els = {
            titleBar: titleBar,
            breadcrumb: breadcrumb,
            filter: filter,
            list: list,
            status: status,
            back: back,
            next: next,
            current: current
        };

        root.style.display = 'none';

        setup.initDrag(titleBar);
    },

    /** ---------------- position ---------------- */

    /** keep the panel on screen **/
    place: function (left, top) {
        var width = setup.root.offsetWidth,
            height = setup.root.offsetHeight;

        left = Math.max(0, Math.min(left, window.innerWidth - width));
        top = Math.max(0, Math.min(top, window.innerHeight - height));

        setup.root.style.left = left + 'px';
        setup.root.style.top = top + 'px';
        setup.root.style.right = 'auto';
    },

    restorePosition: function () {
        var saved = setup.load(panelPosVariable);
        if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
            setup.place(saved.left, saved.top);
        }
    },

    initDrag: function (handle) {
        var dragging = false,
            startX = 0,
            startY = 0,
            originLeft = 0,
            originTop = 0;

        handle.addEventListener('mousedown', function (e) {
            if (e.button !== 0 || e.target.className.indexOf('extraflags-close') > -1) {
                return;
            }
            var rect = setup.root.getBoundingClientRect();
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            originLeft = rect.left;
            originTop = rect.top;
            e.preventDefault();
        }, false);

        document.addEventListener('mousemove', function (e) {
            if (!dragging) {
                return;
            }
            setup.place(originLeft + (e.clientX - startX), originTop + (e.clientY - startY));
        }, false);

        document.addEventListener('mouseup', function () {
            if (!dragging) {
                return;
            }
            dragging = false;
            setup.save(panelPosVariable, {
                left: parseInt(setup.root.style.left, 10) || 0,
                top: parseInt(setup.root.style.top, 10) || 0
            });
        }, false);
    },

    /** ---------------- open / close ---------------- */

    isOpen: function () {
        return setup.root !== null && setup.root.style.display !== 'none';
    },

    open: function () {
        setup.build();

        setup.draft = regions.slice();
        setup.preselect = "";
        setup.root.style.display = 'block';
        setup.restorePosition();

        setup.render();
        setup.loadLevel();
        setup.focusFilter();
    },

    close: function () {
        if (setup.root) {
            setup.root.style.display = 'none';
        }
    },

    /** ---------------- navigation ---------------- */

    /** move to the level below the currently selected entry */
    descend: function () {
        var selected = setup.selectedName();
        if (selected === "") {
            return;
        }
        setup.draft.push(selected);
        setup.preselect = "";
        setup.render();
        setup.loadLevel();
    },

    /** step back up one level, reselecting the entry we came from */
    ascend: function () {
        if (setup.draft.length === 0) {
            return;
        }
        setup.preselect = setup.draft.pop();
        setup.render();
        setup.loadLevel();
    },

    /** jump straight to a depth */
    goTo: function (depth) {
        if (depth >= setup.draft.length) {
            return;
        }
        setup.preselect = setup.draft[depth];
        setup.draft = setup.draft.slice(0, depth);
        setup.render();
        setup.loadLevel();
    },

    selectedName: function () {
        var list = setup.els.list;
        // -1 while a level is still loading or when a filter matches nothing.
        if (list.disabled || list.selectedIndex < 0) {
            return "";
        }
        return list.options[list.selectedIndex].value;
    },

    moveSelection: function (delta) {
        var list = setup.els.list,
            count = list.options.length,
            index;

        if (list.disabled || count === 0) {
            return;
        }

        index = list.selectedIndex < 0 ? 0 : list.selectedIndex + delta;
        index = Math.max(0, Math.min(index, count - 1));
        list.selectedIndex = index;

        if (list.options[index].scrollIntoView) {
            list.options[index].scrollIntoView({block: 'nearest'});
        }
    },

    focusFilter: function () {
        if (setup.isOpen() && !setup.els.filter.disabled) {
            setup.els.filter.focus();
        }
    },

    /** ---------------- level loading ---------------- */

    loadLevel: function () {
        var url = setup.levelUrl(setup.draft) + flagListFile,
            token = ++setup.levelToken;

        setup.els.filter.value = '';

        if (Object.prototype.hasOwnProperty.call(setup.levelCache, url)) {
            setup.showLevel(token, setup.levelCache[url]);
            return;
        }

        setup.setStatus('Loading…', true);

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            timeout: requestTimeout,
            onload: function (response) {
                // 404 means there is no listing here, i.e. nothing below this
                // region -- the original signal for the end of a folder line.
                if (response.status === 404) {
                    setup.levelCache[url] = null;
                    setup.showLevel(token, null);
                    return;
                }
                if (response.status !== 200) {
                    setup.showLevelError(token);
                    return;
                }

                var names = response.responseText.split('\n').map(function (name) {
                    return name.trim();
                }).filter(function (name) {
                    return name !== "";
                });

                var level = names.length > 0 ? names : null;
                setup.levelCache[url] = level;
                setup.showLevel(token, level);
            },
            onerror: function () {
                setup.showLevelError(token);
            },
            ontimeout: function () {
                setup.showLevelError(token);
            }
        });
    },

    showLevel: function (token, names) {
        if (token !== setup.levelToken) {
            return;
        }

        setup.names = names || [];
        setup.els.list.disabled = false;
        setup.els.filter.disabled = false;

        if (!names) {
            setup.setStatus('No further subdivisions - press Save to use this.', false);
        } else {
            setup.setStatus('', false);
        }

        setup.renderList();
        setup.render();
        setup.focusFilter();
    },

    showLevelError: function (token) {
        if (token !== setup.levelToken) {
            return;
        }
        setup.names = [];
        setup.renderList();
        setup.setStatus('Could not load this level.', true);

        var retry = document.createElement('a');
        retry.className = 'extraflags-retry';
        retry.textContent = 'Retry';
        retry.addEventListener('click', function () {
            setup.loadLevel();
        }, false);
        setup.els.status.appendChild(retry);

        setup.render();
        setup.focusFilter();
    },

    setStatus: function (text, busy) {
        setup.els.status.textContent = text;
        setup.els.list.disabled = !!busy;
        if (busy) {
            setup.names = [];
            setup.renderList();
        }
    },

    /** ---------------- rendering ---------------- */

    render: function () {
        setup.renderBreadcrumb();
        setup.renderCurrent();
        setup.els.back.disabled = setup.draft.length === 0;
    },

    renderBreadcrumb: function () {
        var breadcrumb = setup.els.breadcrumb;
        breadcrumb.textContent = '';

        var root = document.createElement('a');
        root.className = 'extraflags-crumb';
        root.textContent = 'All';
        root.addEventListener('click', function () {
            setup.goTo(0);
        }, false);
        breadcrumb.appendChild(root);

        setup.draft.forEach(function (name, i) {
            breadcrumb.appendChild(document.createTextNode(' › '));

            if (i === setup.draft.length - 1) {
                var here = document.createElement('span');
                here.className = 'extraflags-crumb-current';
                here.textContent = name;
                breadcrumb.appendChild(here);
                return;
            }

            var crumb = document.createElement('a');
            crumb.className = 'extraflags-crumb';
            crumb.textContent = name;
            crumb.addEventListener('click', function () {
                setup.goTo(i + 1);
            }, false);
            breadcrumb.appendChild(crumb);
        });
    },

    renderList: function () {
        var list = setup.els.list,
            needle = fold(setup.els.filter.value.trim()),
            names = setup.names || [];

        var matches = needle === "" ? names : names.filter(function (name) {
            return foldReadings(name).some(function (reading) {
                return reading.indexOf(needle) > -1;
            });
        });

        list.textContent = '';
        matches.forEach(function (name) {
            var opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            if (name === setup.preselect) {
                opt.selected = true;
            }
            list.appendChild(opt);
        });

        if (list.selectedIndex < 0 && list.options.length > 0) {
            list.selectedIndex = 0;
        }
        setup.els.next.disabled = list.options.length === 0;
    },

    renderCurrent: function () {
        var current = setup.els.current;
        current.textContent = '';

        var label = document.createElement('span');
        label.textContent = 'Posting as: ';
        current.appendChild(label);

        // draft[0] is the country
        if (setup.draft.length < 2) {
            var none = document.createElement('span');
            none.className = 'extraflags-none';
            none.textContent = setup.draft.length === 1 ? 'country only, no extra flag' : 'nothing selected';
            current.appendChild(none);
            return;
        }

        appendFlagChain(current, setup.draft);
    },

    /** ---------------- saving ---------------- */

    commit: function () {
        regions = setup.draft.slice();

        setup.save(regionVariable, regions);

        setup.close();
        refreshQrIndicator();
    }
};

/** the images for a chain, appended to container **/
function appendFlagChain(container, parts, linkify) {
    for (var i = 1; i < parts.length; i++) {
        var chain = parts.slice(0, i + 1),
            imgSrc = flegsBaseUrl + chain.join('/') + '.png',
            searchQuery = linkify ? chain.reverse().join(', ') : "";

        container.appendChild(buildFlagElement(imgSrc, parts[i], searchQuery));
    }
}

/** a link that opens the panel **/
function buildOpenLink(text) {
    var link = document.createElement('a');
    link.className = 'extraflags-open';
    link.textContent = text;
    link.title = 'Extra Flags setup';
    link.addEventListener('click', setup.open, false);
    return link;
}

function installEntryPoints() {
    // 4chan X
    var shortcuts = document.getElementById('shortcuts');
    if (shortcuts && !document.getElementById(shortcutId)) {
        var shortcut = document.createElement('span');
        shortcut.id = shortcutId;
        shortcut.className = 'shortcut brackets-wrap';
        shortcut.appendChild(buildOpenLink('Flags'));
        shortcuts.appendChild(shortcut);
    }

    // Vanilla 4chan
    ['navtopright', 'navbotright'].forEach(function (navId) {
        var nav = document.getElementById(navId);
        if (!nav || document.getElementById(navLinkIdPrefix + navId)) {
            return;
        }
        var holder = document.createElement('span');
        holder.id = navLinkIdPrefix + navId;
        holder.appendChild(document.createTextNode(' ['));
        holder.appendChild(buildOpenLink('Extra Flags'));
        holder.appendChild(document.createTextNode('] '));
        nav.appendChild(holder);
    });

    // mobile
    var pageJump = document.querySelector('#boardNavMobile .pageJump');
    if (pageJump && !document.getElementById(mobileNavLinkId)) {
        var mobileHolder = document.createElement('span');
        mobileHolder.id = mobileNavLinkId;
        mobileHolder.appendChild(document.createTextNode(' '));
        mobileHolder.appendChild(buildOpenLink('Flags'));
        pageJump.appendChild(mobileHolder);
    }
}

/** ------------------------------------------------------------------
 *  Quick reply indicator
 *  ------------------------------------------------------------------ */

/** quick reply, 4chan X #qr, 4chan #quickReply */
function findQrRoot() {
    return document.getElementById('qr') || document.getElementById('quickReply');
}

function qrInsertTarget(root) {
    if (root.id === 'qr') {
        // #qr > form is the scrolling body of the 4chan X quick reply.
        return root.querySelector('form') || root;
    }
    return root.querySelector('.qrForm') || root;
}

function buildQrRow() {
    var row = document.createElement('div');
    row.id = qrRowId;
    fillQrRow(row);
    return row;
}

function fillQrRow(row) {
    row.textContent = '';

    var label = document.createElement('span');
    label.textContent = 'Flags: ';
    row.appendChild(label);

    if (regions.length > 1) {
        appendFlagChain(row, regions);
    } else {
        var none = document.createElement('span');
        none.className = 'extraflags-none';
        none.textContent = 'none set';
        row.appendChild(none);
    }

    row.appendChild(document.createTextNode(' ['));
    row.appendChild(buildOpenLink('change'));
    row.appendChild(document.createTextNode(']'));
}

function installQrIndicator() {
    var root = findQrRoot();
    if (!root) {
        return;
    }

    var target = qrInsertTarget(root),
        existing = document.getElementById(qrRowId);

    if (existing && target.contains(existing)) {
        return;
    }
    if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
    }

    target.appendChild(buildQrRow());
}

function refreshQrIndicator() {
    var row = document.getElementById(qrRowId);
    if (row) {
        fillQrRow(row);
    }
}

var uiScanQueued = false;

function scanForUiHooks() {
    if (uiScanQueued) {
        return;
    }
    uiScanQueued = true;
    setTimeout(function () {
        uiScanQueued = false;
        installEntryPoints();
        installQrIndicator();
        redrawKnownFlags();
    }, 0);
}

/** ------------------------------------------------------------------
 *  Flags on posts
 *  ------------------------------------------------------------------ */

/** parse the posts already on the page before thread updater kicks in */
var maxParseAttempts = 20;

function parseOriginalPosts(attempt) {
    var tempAllPostsOnPage = document.getElementsByClassName('postContainer');

    // If no posts found, retry after a short delay (needed for index to work with 4chan X).
    if (tempAllPostsOnPage.length === 0) {
        var nextAttempt = (attempt || 0) + 1;
        if (nextAttempt < maxParseAttempts) {
            setTimeout(function () {
                parseOriginalPosts(nextAttempt);
            }, 250);
        }
        return;
    }

    postNrs = [];
    Array.prototype.forEach.call(tempAllPostsOnPage, function (p) {
        addPostNr(p.id.replace("pc", ""));
    });

    resolveRefFlags();
}

/** whether the backend has already answered for a post */
function isKnown(post_nr) {
    return Object.prototype.hasOwnProperty.call(knownRegions, post_nr);
}

/** queue a post for lookup, unless it is already queued or already answered for */
function addPostNr(post_nr) {
    if (!post_nr || postNrs.indexOf(post_nr) > -1) {
        return;
    }

    // Already answered
    if (isKnown(post_nr)) {
        renderFlags(post_nr);
        return;
    }

    postNrs.push(post_nr);
}

/** build one region flag **/
function buildFlagElement(imgSrc, regionName, searchQuery) {
    var newFlag = document.createElement(searchQuery ? 'a' : 'span');
    newFlag.className = "extraFlag";
    newFlag.title = regionName;

    if (searchQuery) {
        newFlag.href = "https://www.google.com/search?q=" + encodeURIComponent(searchQuery);
        newFlag.target = '_blank';
        newFlag.rel = 'noopener noreferrer';
    }

    var img = document.createElement('img');
    img.src = imgSrc;
    img.addEventListener('error', function () {
        if (img.src !== emptyFlagUrl) {
            img.src = emptyFlagUrl;
        }
    }, false);

    newFlag.appendChild(img);
    return newFlag;
}

/** draw a post's flags*/
function renderFlags(post_nr) {
    var postToAddFlagTo = document.getElementById("pc" + post_nr);

    if (!postToAddFlagTo) {
        return;
    }

    var postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0],
        nameBlock = postInfo?.getElementsByClassName('nameBlock')[0],
        postInfoM = postToAddFlagTo.getElementsByClassName('postInfoM')[0],
        nameBlockM = postInfoM?.getElementsByClassName('nameBlock')[0];

    var currentFlag = nameBlock?.getElementsByClassName('flag')[0] || nameBlockM?.getElementsByClassName('flag')[0];
    if (!currentFlag) {
        return;
    }

    var postedRegions = String(knownRegions[post_nr] || "").split(regionDivider).map(function (region) {
        return region.trim();
    }).filter(function (region) {
        return region !== "";
    });
    if (postedRegions.length === 0) {
        return;
    }

    var chain = [currentFlag.title].concat(postedRegions);
    [nameBlock, nameBlockM].forEach(function (block) {
        if (block && block.getElementsByClassName('extraFlag').length === 0) {
            appendFlagChain(block, chain, true);
        }
    });
}

/** redraw every post the backend has already responded for **/
function redrawKnownFlags() {
    Object.keys(knownRegions).forEach(function (post_nr) {
        renderFlags(post_nr);
    });
}

/** drop post numbers that are answered or too old **/
function prunePostNrs() {
    var timestampMinusPostRemoveCounter = Math.round(+new Date() / 1000) - postRemoveCounter;

    postNrs = postNrs.filter(function (post_nr) {
        if (isKnown(post_nr)) {
            return false;
        }

        var postToAddFlagTo = document.getElementById("pc" + post_nr);
        if (!postToAddFlagTo) {
            return false;
        }

        var postInfo = postToAddFlagTo.getElementsByClassName('postInfo')[0] ||
                postToAddFlagTo.getElementsByClassName('postInfoM')[0],
            dateTime = postInfo?.getElementsByClassName('dateTime')[0];

        if (!dateTime) {
            return false;
        }

        return Number(dateTime.getAttribute("data-utc")) >= timestampMinusPostRemoveCounter;
    });
}

function onFlagsLoad(response) {
    //exit on error
    if (response.status !== 200) {
        onFlagsFailed("status " + response.status + " " + response.statusText);
        return;
    }

    var jsonData;
    try {
        jsonData = JSON.parse(response.responseText);
    } catch (parseError) {
        onFlagsFailed("unreadable response");
        return;
    }
    if (!Array.isArray(jsonData)) {
        onFlagsFailed("unexpected response shape");
        return;
    }

    retryDelay = requestRetryInterval;

    jsonData.forEach(function (post) {
        knownRegions[post.post_nr] = String(post.region || "");
        renderFlags(post.post_nr);
    });

    prunePostNrs();
}

function onFlagsFailed(reason) {
    console.log("Extra Flags: could not fetch flags (" + reason + ")");
    scheduleRetry();
}

function scheduleRetry() {
    if (retryTimer !== null) {
        return;
    }

    // Jittered
    var delay = retryDelay + Math.floor(Math.random() * 1000);
    retryTimer = setTimeout(function () {
        retryTimer = null;
        resolveRefFlags();
    }, delay);

    retryDelay = Math.min(retryDelay * 2, requestRetryMax);
}

/** fetch flags from db */
function resolveRefFlags() {
    var boardID = window.location.pathname.split('/')[1];
    if (!(boardID === "int" || boardID === "sp" || boardID === "pol" || boardID === "bant")) {
        return;
    }

    // Check if postNrs is empty before making request
    if (postNrs.length === 0) {
        return;
    }

    // Already backing off from a failure; that timer will send the whole queue,
    // including whatever was added since.
    if (retryTimer !== null) {
        return;
    }

    GM_xmlhttpRequest({
        method: "POST",
        url: backendBaseUrl + getUrl,
        data: "post_nrs=" + encodeURIComponent(postNrs.join(',')) + "&" + "board=" + encodeURIComponent(boardID),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: requestTimeout,
        onload: onFlagsLoad,
        onerror: function () {
            onFlagsFailed("network error");
        },
        ontimeout: function () {
            onFlagsFailed("timeout");
        },
        onabort: function () {
            onFlagsFailed("aborted");
        }
    });
}

/** record the regions this user claims for a post they just made */
function submitFlag(postId, boardID) {
    var claimedRegions = regions.slice(1).join(regionDivider);

    // dont send empty requests
    if (!postId || !boardID || claimedRegions === "") {
        return;
    }

    GM_xmlhttpRequest({
        method: "POST",
        url: backendBaseUrl + postUrl,
        data: "post_nr=" + encodeURIComponent(postId) + "&" + "board=" + encodeURIComponent(boardID) + "&" + "regions=" +
        encodeURIComponent(claimedRegions),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: requestTimeout,
        onload: function (response) {
            if (response.status !== 200) {
                console.log("Extra Flags: flag not recorded, status " + response.status + ": " + response.responseText);
                notify('Your flag was not recorded (server said ' + response.status + '). It cannot be added later.');
            }
        },
        onerror: function () {
            console.log("Extra Flags: flag not recorded (network error)");
            notify('Your flag was not recorded (network error). It cannot be added later.');
        },
        ontimeout: function () {
            console.log("Extra Flags: flag not recorded (timeout)");
            notify('Your flag was not recorded (timed out). It cannot be added later.');
        }
    });
}

/** send flag to system on 4chan x **/
document.addEventListener('QRPostSuccessful', function (e) {
    setTimeout(function () {
        submitFlag(e.detail.postID, e.detail.boardID);
    }, 0);
}, false);

/** send flag to system on 4chan inline post **/
document.addEventListener('4chanQRPostSuccess', function (e) {
    var boardID = window.location.pathname.split('/')[1];
    var evDetail = e.detail || e.wrappedJSObject.detail;
    setTimeout(function () {
        submitFlag(evDetail.postId, boardID);
    }, 0);
}, false);

/** Listen to post updates from the thread updater for 4chan x **/
document.addEventListener('ThreadUpdate', function (e) {
    var evDetail = e.detail || e.wrappedJSObject.detail;

    //ignore if 404 event
    if (evDetail[404] === true) {
        return;
    }

    setTimeout(function () {
        //queue the new posts, then look them all up in one request
        if (evDetail.newPosts) {
            evDetail.newPosts.forEach(function (post_board_nr) {
                addPostNr(post_board_nr.split('.')[1]);
            });
        }

        resolveRefFlags();
    }, 0);
}, false);

/** Listen to post updates from the thread updater for inline extension */
document.addEventListener('4chanThreadUpdated', function (e) {
    var evDetail = e.detail || e.wrappedJSObject.detail;

    // Outside a thread there is no t<threadID> container.
    var threadID = window.location.pathname.split('/')[3];
    var threadContainer = threadID ? document.getElementById('t' + threadID) : null;
    if (!threadContainer) {
        return;
    }

    var postsContainer = Array.prototype.slice.call(threadContainer.childNodes);
    var newPostCount = (evDetail && evDetail.count) || 0;
    var lastPosts = postsContainer.slice(Math.max(postsContainer.length - newPostCount, 1)); //get the last n elements (where n is evDetail.count)

    //queue the new posts; childNodes includes text nodes, which have no id
    lastPosts.forEach(function (post_container) {
        if (post_container.id) {
            addPostNr(post_container.id.replace("pc", ""));
        }
    });
    setTimeout(resolveRefFlags, 0);
}, false);

/** Detect index page navigation when using 4chan X */
(function () {
    var originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(history, arguments);
        setTimeout(parseOriginalPosts, 0);
    };

    // Back and forward do not go through pushState.
    window.addEventListener('popstate', function () {
        setTimeout(parseOriginalPosts, 0);
    }, false);
})();

/** ------------------------------------------------------------------
 *  Styles
 *  ------------------------------------------------------------------ */
GM_addStyle([
    '#' + setup.id + ' {',
    '  position: fixed; z-index: 10001; top: 40px; right: 40px;',
    '  display: none; width: 290px; padding: 0;',
    '  border-style: solid; border-width: 1px; text-align: left;',
    '  border-color: currentColor;',
    '  font-size: 12px; line-height: normal;',
    '}',
    '#' + setup.id + ' .extraflags-titlebar {',
    '  display: flex; justify-content: space-between; align-items: center;',
    '  cursor: move; user-select: none; padding: 2px 5px;',
    '  border-bottom: 1px solid;',
    '}',
    '#' + setup.id + ' .extraflags-close { cursor: pointer; padding-left: 8px; }',
    '#' + setup.id + ' .extraflags-body { padding: 6px 8px 8px; }',
    '#' + setup.id + ' .extraflags-breadcrumb { margin-bottom: 4px; word-wrap: break-word; }',
    '#' + setup.id + ' .extraflags-crumb { cursor: pointer; text-decoration: underline; }',
    '#' + setup.id + ' .extraflags-crumb-current { font-weight: bold; }',
    '#' + setup.id + ' .extraflags-filter { width: 100%; box-sizing: border-box; margin-bottom: 3px; }',
    '#' + setup.id + ' .extraflags-list { width: 100%; box-sizing: border-box; }',
    '#' + setup.id + ' .extraflags-status { min-height: 1.4em; padding: 2px 0; font-style: italic; }',
    '#' + setup.id + ' .extraflags-retry { cursor: pointer; text-decoration: underline; padding-left: 5px; }',
    '#' + setup.id + ' .extraflags-buttons { display: flex; gap: 4px; margin: 3px 0 6px; }',
    '#' + setup.id + ' .extraflags-buttons button { flex: 1; }',
    '#' + setup.id + ' .extraflags-current { margin-bottom: 6px; word-wrap: break-word; }',
    '#' + setup.id + ' .extraflags-help { font-size: 11px; opacity: 0.85; word-wrap: break-word; }',
    '.extraflags-none { font-style: italic; opacity: 0.8; }',
    '.extraflags-open { cursor: pointer; }',

    /* notices */
    '#' + noticeStackId + ' {',
    '  position: fixed; z-index: 10002; top: 0; left: 50%; transform: translateX(-50%);',
    '  display: flex; flex-direction: column; align-items: center;',
    '}',
    '#' + noticeStackId + ' .extraflags-notice {',
    '  display: flex; align-items: center; gap: 8px;',
    '  max-width: 90vw; margin-top: 4px; padding: 5px 8px;',
    '  border-style: solid; border-width: 1px;',
    '  border-color: currentColor;',
    '  border-left-width: 4px; border-left-color: #c33;',
    '  font-size: 12px; text-align: left;',
    '}',
    '#' + noticeStackId + ' .extraflags-notice-close { cursor: pointer; opacity: 0.7; }',

    /* Quick reply row. */
    '#' + qrRowId + ' {',
    '  width: 0; min-width: 100%; box-sizing: border-box;',
    '  padding: 2px 3px; font-size: 12px; overflow-wrap: anywhere;',
    '}',

    /* the flags */
    '.extraFlag {',
    '  padding: 0 0 0 5px; display: inline-block; line-height: 0;',
    '  width: 16px; height: 11px;',
    '}',
    '.extraFlag img {',
    '  display: block; width: 100%; height: 100%;',
    '}'
].join('\n'));

/** fix flag alignment */
GM_addStyle('.flag{top: 0px !important;left: -1px !important}');

/** ------------------------------------------------------------------
 *  Start up
 *  ------------------------------------------------------------------ */

/** Load preferences **/
regions = setup.load(regionVariable);
if (typeof regions === 'string') {
    regions = regions.split(',').filter(function (region) {
        return region !== "";
    });
}
if (!Array.isArray(regions)) {
    regions = [];
}

/** Escape closes the panel **/
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && setup.isOpen()) {
        setup.close();
    }
}, false);

/** 4chan X builds its header and quick reply after this script runs **/
if (document.body) {
    new MutationObserver(scanForUiHooks).observe(document.body, {childList: true, subtree: true});
}

setup.init();
scanForUiHooks();
parseOriginalPosts();
