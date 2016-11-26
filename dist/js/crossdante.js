(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

// appdata.js
//
// basic appdata – there's also a translationdata array (metadata) and textdata (texts)
// is it worth folding this into app? Is there a value in keeping this separate?
//
// this probably needs some reworking?

var translationdata = require("./bookdata").translationdata;
var cantotitles = require("./bookdata").cantotitles;

var appdata = {
	currenttranslationlist: [], // list of ids of translations we're currently using
	currenttranslation: 0,
	translationcount: translationdata.length,
	currentcanto: 0,
	cantocount: cantotitles.length,
	lineheight: 24,
	lenswidth: window.innerWidth,
	lensheight: window.innerHeight - 40,
	windowwidth: window.innerWidth,
	windowheight: window.innerHeight,
	textwidth: window.innerWidth,
	currentpage: "lens",
	nightmode: false,
	currentpercentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
	currentlines: 0, // this is the number of lines calculated to be on the page
	elements: {},
	textdata: {},
	translationdata: translationdata,
	cantotitles: cantotitles
};

module.exports = appdata;

},{"./bookdata":2}],2:[function(require,module,exports){
"use strict";

var cantotitles = ["Title page", "Canto 1", "Canto 2", "Canto 3"];

var translationdata = [{ "translationid": "dante",
	"translationshortname": "Dante",
	"translationfullname": "Dante Alighieri",
	"translationclass": "poetry original",
	"order": 0 }, { "translationid": "longfellow",
	"translationshortname": "Longfellow",
	"translationfullname": "Henry Wordsworth Longfellow",
	"translationclass": "poetry longfellow",
	"order": 1 }, { "translationid": "norton",
	"translationshortname": "Norton",
	"translationfullname": "Charles Eliot Norton",
	"translationclass": "norton prose",
	"order": 2 }, { "translationid": "wright",
	"translationshortname": "Wright",
	"translationfullname": "S. Fowler Wright",
	"translationclass": "poetry wright",
	"order": 3 }, { "translationid": "carlyle",
	"translationshortname": "Carlyle",
	"translationfullname": "Carlyle/Okey/Wiksteed",
	"translationclass": "prose carlyle",
	"order": 4 }];

module.exports.cantotitles = cantotitles;
module.exports.translationdata = translationdata;

},{}],3:[function(require,module,exports){
"use strict";

// version 4: now going to ES6

//
//// polyfills
//

// for each, from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
// do we need this?
/*
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function(callback, thisArg) {
		var T, k;
		if (this === null) {
			throw new TypeError(' this is null or not defined');
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (typeof callback !== "function") {
			throw new TypeError(callback + ' is not a function');
		}
		if (arguments.length > 1) {
			T = thisArg;
		}
		k = 0;
		while (k < len) {
			var kValue;
			if (k in O) {
				kValue = O[k];
				callback.call(T, kValue, k, O);
			}
			k++;
		}
	};
}
*/

var Hammer = require("hammerjs");
var Fastclick = require("fastclick"); // why is this not working?

var dom = require("./dom");
var appdata = require("./appdata");

var app = {
	initialize: function initialize() {
		// could set this to choose translations?
		console.log("initializing!");
		this.bindEvents();

		// basic doc setup

		appdata.textdata[0] = require("./translations/italian.js");
		appdata.textdata[1] = require("./translations/longfellow.js");
		appdata.textdata[2] = require("./translations/norton.js");
		appdata.textdata[3] = require("./translations/wright.js");
		appdata.textdata[4] = require("./translations/carlyle.js");

		appdata.elements.lens = document.getElementById("lens");
		appdata.elements.main = document.getElementById("main");
		appdata.elements.content = document.getElementById("content");
		appdata.elements.text = document.getElementById("text");

		// set up current translation list (initially use all of them)

		for (var i in appdata.translationdata) {
			appdata.currenttranslationlist.push(appdata.translationdata[i].translationid);
		}

		// check to see if there are saved localstorage, if so, take those values
	},
	bindEvents: function bindEvents() {
		console.log("binding events!");
		document.addEventListener('deviceready', this.onDeviceReady, false);
		window.addEventListener("resize", this.resize, false);

		// start fastclick

		if ('addEventListener' in document) {
			document.addEventListener('DOMContentLoaded', function () {
				Fastclick.attach(document.body);
			}, false);
		}
	},
	helpers: {
		gosettings: function gosettings(element) {
			element.onclick = function () {
				app.setpage("settings");
			};
		},
		setupnote: function setupnote(el) {
			el.onclick = function (e) {
				e.stopPropagation();
				var thisnote = this.getAttribute("data-notenumber");
				var notetext = document.querySelector(".notetext[data-notenumber=\"" + thisnote + "\"]").innerHTML;
				app.hidenotes();
				var insert = dom.create("<div class=\"notewindow\" id=\"notewindow\">" + notetext + "</div>");
				appdata.elements.main.appendChild(insert);
				document.getElementById("notewindow").onclick = function () {
					app.hidenotes();
				};
			};
		},
		checkboxgo: function checkboxgo(el) {
			el.onclick = function () {
				app.changetranslation(this.id.replace("check-", ""), document.getElementById(this.id).checked);
			};
		},
		checkboxspango: function checkboxspango(el) {
			el.onclick = function () {
				document.getElementById("check-" + this.id).checked = !document.getElementById("check-" + this.id).checked;
				app.changetranslation(this.id, document.getElementById("check-" + this.id).checked);
			};
		}
	},
	setupcontrols: function setupcontrols() {
		var hammertime;

		// button controls
		document.getElementById("navprev").onclick = function () {
			app.setlens(appdata.currenttranslation - 1, appdata.currentcanto);
		};
		document.getElementById("navnext").onclick = function () {
			app.setlens(appdata.currenttranslation + 1, appdata.currentcanto);
		};
		document.getElementById("navup").onclick = function () {
			app.setlens(appdata.currenttranslation, appdata.currentcanto - 1, 0);
		};
		document.getElementById("navdown").onclick = function () {
			app.setlens(appdata.currenttranslation, appdata.currentcanto + 1, 0);
		};
		// initial settings

		document.getElementById("aboutlink").onclick = function () {
			app.setpage("about");
		};
		document.getElementById("helplink").onclick = function () {
			app.setpage("help");
		};
		document.getElementById("daymode").onclick = function () {
			dom.removeclass("body", "nightmode");
			dom.addclass("#nightmode", "off");
			dom.removeclass("#daymode", "off");
			appdata.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = function () {
			dom.addclass("body", "nightmode");
			dom.removeclass("#nightmode", "off");
			dom.addclass("#daymode", "off");
			appdata.nightmode = true;
		};

		document.querySelectorAll(".backtosettings").forEach(app.helpers.gosettings);
		// ES6: can we changed this to a for ... in loop?

		// swipe controls

		hammertime = new Hammer(appdata.elements.lens);
		hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		hammertime.on('swipeleft', function () {
			app.setlens(appdata.currenttranslation + 1, appdata.currentcanto);
		}).on('swiperight', function () {
			app.setlens(appdata.currenttranslation - 1, appdata.currentcanto);
		});

		hammertime.on('swipedown', function () {
			if (appdata.elements.text.scollTop === 0) {
				app.setlens(appdata.currenttranslation, appdata.currentcanto - 1, 1); // this needs to be at the bottom!
			}
		}).on('swipeup', function () {
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one

			if (Math.abs(appdata.elements.text.scrollTop + appdata.elements.text.clientHeight - appdata.elements.text.scrollHeight) < 8) {
				app.setlens(appdata.currenttranslation, appdata.currentcanto + 1);
			}
		});

		// key controls

		document.body.onkeydown = function (e) {
			e.preventDefault();
			if ((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev", "on");
				app.setlens(appdata.currenttranslation - 1, appdata.currentcanto);
			}
			if ((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext", "on");
				app.setlens(appdata.currenttranslation + 1, appdata.currentcanto);
			}
			if ((e.keyCode || e.which) === 38) {
				dom.addclass("#navup", "on");
				app.setlens(appdata.currenttranslation, appdata.currentcanto - 1);
			}
			if ((e.keyCode || e.which) === 40) {
				dom.addclass("#navdown", "on");
				app.setlens(appdata.currenttranslation, appdata.currentcanto + 1, 0);
			}
		};
		document.body.onkeyup = function (e) {
			e.preventDefault();
			dom.removeclass(".button", "on");
		};

		// page controls

		document.querySelector("#navtitle").onclick = function () {
			app.setpage("lens");
		};
		document.querySelector("#navsettings").onclick = function () {
			if (appdata.currentpage == "settings") {
				//      if(appdata.currenttranslationlist.indexOf(appdata.translationdata[appdata.currenttranslation].translationid) > -1 ) {}
				app.setpage("lens");
			} else {
				app.updatesettings();
				app.setpage("settings");
			}
		};
		appdata.elements.main.onclick = function () {
			app.hidenotes();
		};
	},
	setupnotes: function setupnotes() {
		var count = 0;
		var notes = document.querySelectorAll(".note");

		for (var i = 0; i < notes.length; i++) {
			var children = notes[i].children;
			for (var j = 0; j < children.length; j++) {
				if (dom.hasclass(children[j], "notetext")) {
					console.log("notetext " + count);
					children[j].setAttribute("data-notenumber", count);
				}
				if (dom.hasclass(children[j], "noteno")) {
					console.log("noteno " + count);
					children[j].setAttribute("data-notenumber", count);
					app.helpers.setupnote(children[j]);
				}
			}
			count++;
		}
	},
	resize: function resize() {
		appdata.windowwidth = window.innerWidth;
		appdata.windowheight = window.innerHeight;
		console.log("The window has been resized! New width: " + appdata.windowwidth + "," + appdata.windowheight);
		appdata.lenswidth = appdata.windowwidth;
		appdata.lensheight = appdata.windowheight - document.getElementById("navbar").clientHeight;

		dom.addclass(".page", appdata.lenswidth > appdata.lensheight ? "landscape" : "portrait");
		dom.removeclass(".page", appdata.lenswidth > appdata.lensheight ? "portrait" : "landscape");

		appdata.elements.main.style.width = appdata.lenswidth + "px";
		appdata.elements.main.style.height = appdata.windowheight + "px";
		appdata.elements.content.style.width = appdata.lenswidth + "px";
		appdata.elements.content.style.height = appdata.lensheight + "px";

		appdata.lineheight = appdata.windowwidth / 25;
		appdata.textwidth = appdata.windowwidth;
		app.setlens(appdata.currenttranslation, appdata.currentcanto);
	},
	setlens: function setlens(newtrans, newcanto, percentage) {
		console.log("Setlens called for " + newtrans + ", canto " + newcanto);
		var changetrans = false;

		// if page isn't set to "lens" this doesn't do anything

		if (appdata.currentpage == "lens") {
			if (newtrans - appdata.currenttranslation !== 0) {
				changetrans = true;
				percentage = appdata.elements.text.scrollTop /*+ appdata.elements.text.clientHeight*/ / appdata.elements.text.scrollHeight;
				console.log(percentage);
			}

			if (newtrans >= appdata.translationcount) {
				newtrans = 0;
			}
			if (newtrans < 0) {
				newtrans = appdata.translationcount - 1;
			}
			if (newcanto >= appdata.cantocount) {
				newcanto = 0;
			}
			if (newcanto < 0) {
				newcanto = appdata.cantocount - 1;
			}

			// figure out which translation is the current translation

			for (var i = 0; i < appdata.translationdata.length; i++) {
				if (appdata.currenttranslationlist[newtrans] == appdata.translationdata[i].translationid) {
					newtrans = i;
				}
			}
			appdata.elements.text.innerHTML = app.textdata[newtrans][newcanto];
			dom.removeclass("#text", appdata.translationdata[appdata.currenttranslation].translationclass);
			dom.addclass("#text", appdata.translationdata[newtrans].translationclass);
			app.setupnotes();
			appdata.currenttranslation = newtrans;
			appdata.currentcanto = newcanto;

			if (appdata.currentcanto > 0) {
				document.getElementById("navtitle").innerHTML = appdata.translationdata[appdata.currenttranslation].translationshortname + (" \xB7 <strong>Canto " + appdata.currentcanto + "</strong>");
			} else {
				document.getElementById("navtitle").innerHTML = "&nbsp;";
			}

			app.fixpadding();

			// set percentage: this is terrible! fix this!
			// first: try to figure out how many lines we have? Can we do that?

			if (changetrans) {

				// this method still isn't great! it tries to round to current lineheight
				// to avoid cutting off lines

				var scrollto = app.rounded(percentage * appdata.elements.text.scrollHeight);
				appdata.elements.text.scrollTop = scrollto;
			} else {
				if (percentage > 0) {
					appdata.elements.text.scrollTop = appdata.elements.text.scrollHeight;
				} else {
					appdata.elements.text.scrollTop = 0;
				}
			}
		}
		app.savecurrentdata();
	},
	rounded: function rounded(pixels) {

		// this is still a mess, fix this

		return appdata.lineheight * Math.floor(pixels / appdata.lineheight);
	},
	fixpadding: function fixpadding() {
		var divs = document.querySelectorAll("#text p");
		var i, div, padding, desiredwidth;
		var maxwidth = 0;

		if (dom.hasclass(appdata.elements.text, "poetry")) {

			// this is poetry, figure out longest line

			appdata.elements.text.style.paddingLeft = 0;
			for (i = 0; i < divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";
				if (div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			console.log("text width: " + appdata.textwidth);
			console.log("max width: " + maxwidth);

			appdata.elements.text.style.paddingLeft = (appdata.textwidth - maxwidth) / 2 + "px";
			appdata.elements.text.style.paddingRight = (appdata.textwidth - maxwidth) / 2 + "px";
		} else {

			// this is prose, standardized padding

			desiredwidth = 75; // this is in vw

			console.log("text width: " + appdata.textwidth);
			console.log("desired width: " + desiredwidth);
			console.log("lineheight: " + appdata.lineheight);

			//		console.log(lenswidth + " "+desiredwidth);
			//		var padding = (lenswidth - desiredwidth)/2;

			padding = (100 - desiredwidth) / 2;
			/*
   		if((desiredwidth + 2) > lenswidth) {
   			appdata.elements.text.style.paddingLeft = "1vw";
   			appdata.elements.text.style.paddingRight = "1vw";
   		} else {
   			*/
			appdata.elements.text.style.paddingLeft = padding + "vw";
			appdata.elements.text.style.paddingRight = padding + "vw";
			//		}
		}
	},
	hidenotes: function hidenotes() {
		dom.removebyselector(".notewindow");
	},
	updatesettings: function updatesettings() {
		var insert, i, j, translatorlist;

		// add in translation chooser

		dom.removebyselector("#translatorlist");
		insert = dom.create('<ul id="translatorlist"></ul>');
		document.getElementById("translationchoose").appendChild(insert);
		translatorlist = document.querySelector("#translatorlist");
		for (i in appdata.translationdata) {
			insert = dom.create("<li><input type=\"checkbox\" id=\"check-" + appdata.translationdata[i].translationid + "\" /><span id=\"" + appdata.translationdata[i].translationid + "\" >" + appdata.translationdata[i].translationfullname + "</span></li>");
			translatorlist.appendChild(insert);
			document.getElementById("check-" + appdata.translationdata[i].translationid).checked = appdata.currenttranslationlist.indexOf(appdata.translationdata[i].translationid) > -1;
		}

		document.querySelectorAll("#translatorlist input[type=checkbox]").forEach(app.helpers.checkboxgo);
		// ES6: can we changed this to a for ... in loop?
		document.querySelectorAll("#translatorlist span").forEach(app.helpers.checkboxspango);
		// ES6: can we changed this to a for ... in loop?

		// add in toc

		dom.removebyselector("#selectors");
		insert = dom.create('<div id="selectors"><p>Canto: <select id="selectcanto"></select></p><p>Translation: <select id="selecttranslator"></select></p><p><span id="selectgo">Go</span></p></div>');
		document.getElementById("translationgo").appendChild(insert);
		for (i = 0; i < appdata.cantocount; i++) {
			insert = dom.create("<option id=\"canto" + i + "\" " + (appdata.currentcanto == i ? "selected" : "") + ">" + appdata.cantotitles[i] + "</option>");
			document.getElementById("selectcanto").appendChild(insert);
		}
		for (i in appdata.currenttranslationlist) {
			for (j = 0; j < appdata.translationdata.length; j++) {
				if (appdata.translationdata[j].translationid == appdata.currenttranslationlist[i]) {
					insert = dom.create("<option id=\"tr_" + appdata.translationdata[j].translationid + "\" " + (appdata.currenttranslation == i ? "selected" : "") + ">" + appdata.translationdata[j].translationfullname + "</option>");
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = function () {
			var selected = document.getElementById("selecttranslator");
			var thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			var thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for (j = 0; j < appdata.translationdata.length; j++) {
				if (appdata.currenttranslationlist[j] == thistrans) {
					app.setpage("lens");
					app.setlens(j, thiscanto, 0);
				}
			}
		};
	},
	savecurrentdata: function savecurrentdata() {
		// this should store appdate on localstorage (does that work for mobile?)
		console.log("Storing preferences! TK");
	},
	changetranslation: function changetranslation(thisid, isset) {
		console.log("changetranslation fired!");
		for (var i in appdata.translationdata) {
			if (thisid == appdata.translationdata[i].translationid) {
				if (isset) {
					appdata.currenttranslationlist.push(thisid);
					appdata.translationcount++;
				} else {
					if (appdata.translationcount > 1) {
						var j = appdata.currenttranslationlist.indexOf(thisid);
						if (j > -1) {
							appdata.currenttranslationlist.splice(j, 1);
						}
						appdata.translationcount--;
					} else {
						// there's only one translation in the list, do not delete last
						document.getElementById("check-" + thisid.toLowerCase()).checked = true;
					}
				}
			}
			app.savecurrentdata();
		}

		var newlist = [];
		for (i in appdata.translationdata) {
			if (appdata.currenttranslationlist.indexOf(appdata.translationdata[i].translationid) > -1) {
				newlist.push(appdata.translationdata[i].translationid);
			}
		}
		appdata.currenttranslationlist = newlist.slice();
		// also what do we do when one is deleted?
		app.updatesettings();
	},
	setpage: function setpage(newpage) {
		dom.removeclass(".page", "on");
		dom.addclass(".page#" + newpage, "on");
		appdata.currentpage = newpage;
		app.resize();
	},
	onDeviceReady: function onDeviceReady() {
		console.log("device ready!");
		app.setup();
	},
	setup: function setup() {
		app.setupnotes();
		app.setupcontrols();
		app.setpage("lens");
	}
};

app.initialize();
if (!('onDeviceReady' in document)) {
	console.log("Running non-Cordova code!");
	app.setup(); // (hopefully this doesn't fire in real version?)
}

},{"./appdata":1,"./dom":4,"./translations/carlyle.js":5,"./translations/italian.js":6,"./translations/longfellow.js":7,"./translations/norton.js":8,"./translations/wright.js":9,"fastclick":10,"hammerjs":11}],4:[function(require,module,exports){
"use strict";

// dom.js

var dom = {
	create: function create(htmlStr) {
		var frag = document.createDocumentFragment();
		var temp = document.createElement('div');
		temp.innerHTML = htmlStr;
		while (temp.firstChild) {
			frag.appendChild(temp.firstChild);
		}
		return frag;
	},
	removebyselector: function removebyselector(selectorstring) {
		var selector = document.querySelector(selectorstring);
		if (selector !== null) {
			selector.parentNode.removeChild(selector);
		}
	},
	addclass: function addclass(selectorstring, myclass) {
		var myelement = document.querySelectorAll(selectorstring);
		if (myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for (var j = 0; j < classes.length; j++) {
				dom.addclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelement.length; i++) {
				myelement[i].classList.add(myclass);
			}
		}
	},
	removeclass: function removeclass(selectorstring, myclass) {
		var myelement = document.querySelectorAll(selectorstring);
		if (myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for (var j = 0; j < classes.length; j++) {
				dom.removeclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelement.length; i++) {
				myelement[i].classList.remove(myclass);
			}
		}
	},
	hasclass: function hasclass(element, cls) {
		return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
	}
};

module.exports = dom;

},{}],5:[function(require,module,exports){
'use strict';

// carlyle.js

var carlyle = ['<p class="title">Inferno</p><p class="author">John Aitken Carlyle, Thomas Okey &amp; P. H. Wiksteed</p>', '<p class="cantohead">CANTO I</p><p class="summary">Dante finds himself astray in a dark Wood, where he spends a night of great misery. He says that death is hardly more bitter, than it is to recall what he suffered there; but that he will tell the fearful things he saw, in order that he may also tell how he found guidance, and first began to discern the real causes of all misery. He comes to a Hill; and seeing its summit already bright with the rays of the Sun, he begins to ascend it. The way to it looks quite deserted. He is met by a beautiful Leopard, which keeps distracting his attention from the Hill, and makes him turn back several times. The hour of the morning, the season, and the gay outward aspect of that animal, give him good hopes at first; but he is driven down and terrified by a Lion and a She-wolf. Virgil comes to his aid, and tells him that the Wolf lets none pass her way, but entangles and slays every one that tries to get up the mountain by the road on which she stands. He says a time will come when a swift and strong Greyhound shall clear the earth of her, and chase her into Hell. And he offers to conduct Dante by another road; to show him the eternal roots of misery and of joy, and leave him with a higher guide that will lead him up to Heaven.</p><p>In the middle of the journey of our life<span class="note"><span class="noteno">1</span><span class="notetext">The Vision takes place at Eastertide of the year 1300, that is to say, when Dante was thirty-five years old. <em>Cf.</em> <em>Psalms</em> xc. 10: &ldquo;The days of our years are threescore years and ten.&rdquo; See also <em>Convito</em> iv: &ldquo;Where the top of this arch of life may be, it is difficult to know.&nbsp;.&nbsp;.&nbsp;. I believe that in the perfectly natural man, it is at the thirty-fifth year.&rdquo;</span></span> I came to myself in a dark wood<span class="note"><span class="noteno">2</span><span class="notetext"><em>Cf.</em> <em>Convito</em> iv: &ldquo;.&nbsp;.&nbsp;.&nbsp;the adolescent who wenters into the Wood of Error of this life would not know how to keep to the good path if it were not pointed out to him by his elders.&rdquo; <em>Politically</em>: the <em>wood</em> stands for the troubled state of Italy in Dante&rsquo;s time.</span></span> where the straight way was lost.</p><p>Ah! how hard a thing it is to tell what a wild, and rough, and stubborn wood this was, which in my thought renews the fear!</p><p>So bitter is it, that scarsely more is death: but to treat of the good that there I found, I will relate the other things that I discerned.</p><p>I cannot rightly tell how I entered it, so full of sleep was I about the moment that I left the true way.</p><p>But after I had reached the foot of a Hill<span class="note"><span class="noteno">3</span><span class="notetext">The &ldquo;holy Hill&rdquo; of the Bible; Bunyan&rsquo;s &ldquo;Delectable Mountains.&rdquo;</span></span> there, where that valley ended, which had pierced my heart with fear,</p><p>I looked up and saw its shoulders already clothed with the rays of the Planet<span class="note"><span class="noteno">4</span><span class="notetext"><em>Planet</em>, the sun, which was a planet according to the Ptolemaic system. Dante speaks elsewhere (<em>Conv.</em> iv) of the &ldquo;spiritual Sun, which is God.&rdquo;</span></span> that leads men straight on every road.</p><p>Then the fear was somewhat calmed, which had continued in the lake of my heart the night that I passed so piteously.</p><p>And as he, who with panting breath has escaped from the deep sea to the shore, turns to the dangerous water and gazes:</p><p>so my mind, which still was fleeing, turned back to see the pass that no one ever left alive.</p><p>After I had rested my wearied body a short while, I took the way again along the desert strand, so that the right foot always was the lower.<span class="note"><span class="noteno">5</span><span class="notetext">Any one who is ascending a hill, and whose left foot is always the lower, must be bearing to the <em>right</em>.</span></span></p><p>And behold, almost at the commencement of the steep, a Leopard,<span class="note"><span class="noteno">6</span><span class="notetext">Worldly Pleasure; <em>politically</em>: Florence.</span></span> light and very nimble, which was covered with spotted hair.</p><p>And it went not from before my face; nay, so impeded my way, that I had often turned to go back.</p><p>The time was at the beginning of the morning; and the sun was mounting up with those stars,<span class="note"><span class="noteno">7</span><span class="notetext">According to tradition, the sun was in Aries at the time of the Creation.</span></span> which were with him when Divine Love</p><p>first moved those fair things: so that the hour of time and the sweet season caused me to have good hope</p><p>of that animal with the gay skin; yet not so, but that I feared at the sight, which appeared to me, of a Lion.<span class="note"><span class="noteno">8</span><span class="notetext">Ambition; <em>politically</em>: the Royal House of France.</span></span></p><p>He seemed coming upon me with head erect, and furious hunger; so that the air seemed to have fear thereat;</p><p>and a She-wolf,<span class="note"><span class="noteno">9</span><span class="notetext"><em>Avarice</em>; <em>politically</em>: the Papal See. The three beasts are obviously taken from <em>Jeremiah</em> v.&nbsp;6.</span></span> that looked full of all cravings in her leanness; and has ere now made many live in sorrow.</p><p>She brought such heaviness upon me with the terror of her aspect, that I lost the hope of ascending.</p><p>And as one who is eager in gaining, and, when the time arrives that makes him lose, weeps and afflicts himself in all his thoughts:</p><p>such that restless beast made me, which coming against me, by little and little drove me back to where the Sun is silent.</p><p>Whilst I was rushing downwards, there appeared before my eyes one<span class="note"><span class="noteno">10</span><span class="notetext">Virgil, who stands for Worldly Wisdom, and is Dante&rsquo;s guide through Hell and Purgatory (see Gardner, pp. 87, 88).<br /><br /><em>hoarse</em>, perhaps because the study of Virgil had been long neglected</span></span> who seemed hoarse from long silence.</p><p>When I saw him in the great desert, I cried: &ldquo;Have pity on me, whate&rsquo;er thou be, whether shade or veritable man!&rdquo;</p><p>He answered me: &ldquo;Not man, a man I once was; and my parents were Lombards, and both of Mantua by country.</p><p>TK!</p>', '<p class="cantohead">CANTO II</p><p class="summary">End of the first day. Brief Invocation. Danet is discouraged at the outset, when he begins seriously to reflect upon what he has undertaken. That very day, his own strength had miserably failed before the Lion and the She-Wolf. He bids Virgil consider well whether there be sufficient virtue in him, before committing him to so dreadful a passage. He recalls the great errands of &AElig;neas and of Paul, and the great results of their going to the immortal world; and comparing himself with them, he feels his heart quail, and is ready to turn back. Virgil discerns the fear that has come over him; and in order to remove it, tells him how a blessed Spirit has descended from Heaven expressly to command the journey. On hearing this, Dante immediately casts off pusillanimity, and at once accepts the Freedom and the Mission that are given him.</p><p>TK!</p>', '<p class="cantohead">CANTO III</p><p class="summary">Inscription over the Gate of Hell, and the impression it produces upon Dante. Virgil takes him by the hand, and leads him in. The dismal sounds make him burst into tears. His head is quite bewildered. Upon a Dark Plain, which goes around the confines, he sees a vast multitude of spirits running behind a flag in great haste and confusion, urged on by furious wasps and hornets. These are the unhappy people, who never were alive&mdash;never awakened to take any part in either good or evil, to care for anything but themselves. They are mixed with a similar class of fallen angels. After passing through the crowd of them, the Poets come to a great River, which flows round the brim of Hell; and then descends to form the other rivers, the marshes, and the ice that we shall meet with. It is the river Acheron; and on its Shore all that die under the wrath of God assemble from every country to be ferried over by the demon Charon. He makes them enter his boat by glaring on them with his burning eyes. Having seen these, and being refused a passage by Charon, Dante is suddenly stunned by a violent trembling of the ground, accompanied with wind and lightning, and falls down in a state of insensibility.</p><p>TK!</p>'];

module.exports = carlyle;

},{}],6:[function(require,module,exports){
'use strict';

// italian.js

var italian = ['<p class="title">Inferno</p><p class="author">Dante Alighieri</p>', '<p class="cantohead">1</p><div class="stanza"><p>Nel mezzo del cammin di nostra vita</p><p>mi ritrovai per una selva oscura,</p><p>ch&eacute; la diritta via era smarrita.</p></div><div class="stanza"><p>Ahi quanto a dir qual era &egrave; cosa dura</p><p>esta selva selvaggia e aspra e forte</p><p>che nel pensier rinova la paura!</p></div><div class="stanza"><p>Tant&rsquo; &egrave; amara che poco &egrave; pi&ugrave; morte;</p><p>ma per trattar del ben ch&rsquo;i&rsquo; vi trovai,</p><p>dir&ograve; de l&rsquo;altre cose ch&rsquo;i&rsquo; v&rsquo;ho scorte.</p></div><div class="stanza"><p>Io non so ben ridir com&rsquo; i&rsquo; v&rsquo;intrai,</p><p>tant&rsquo; era pien di sonno a quel punto</p><p>che la verace via abbandonai.</p></div><div class="stanza"><p>Ma poi ch&rsquo;i&rsquo; fui al pi&egrave; d&rsquo;un colle giunto,</p><p>l&agrave; dove terminava quella valle</p><p>che m&rsquo;avea di paura il cor compunto,</p></div><div class="stanza"><p>guardai in alto e vidi le sue spalle</p><p>vestite gi&agrave; de&rsquo; raggi del pianeta</p><p>che mena dritto altrui per ogne calle.</p></div><div class="stanza"><p>Allor fu la paura un poco queta,</p><p>che nel lago del cor m&rsquo;era durata</p><p>la notte ch&rsquo;i&rsquo; passai con tanta pieta.</p></div><div class="stanza"><p>E come quei che con lena affannata,</p><p>uscito fuor del pelago a la riva,</p><p>si volge a l&rsquo;acqua perigliosa e guata,</p></div><div class="stanza"><p>cos&igrave; l&rsquo;animo mio, ch&rsquo;ancor fuggiva,</p><p>si volse a retro a rimirar lo passo</p><p>che non lasci&ograve; gi&agrave; mai persona viva.</p></div><div class="stanza"><p>Poi ch&rsquo;&egrave;i posato un poco il corpo lasso,</p><p>ripresi via per la piaggia diserta,</p><p>s&igrave; che &rsquo;l pi&egrave; fermo sempre era &rsquo;l pi&ugrave; basso.</p></div><div class="stanza"><p>Ed ecco, quasi al cominciar de l&rsquo;erta,</p><p>una lonza leggera e presta molto,</p><p>che di pel macolato era coverta;</p></div><div class="stanza"><p>e non mi si partia dinanzi al volto,</p><p>anzi &rsquo;mpediva tanto il mio cammino,</p><p>ch&rsquo;i&rsquo; fui per ritornar pi&ugrave; volte v&ograve;lto.</p></div><div class="stanza"><p>Temp&rsquo; era dal principio del mattino,</p><p>e &rsquo;l sol montava &rsquo;n s&ugrave; con quelle stelle</p><p>ch&rsquo;eran con lui quando l&rsquo;amor divino</p></div><div class="stanza"><p>mosse di prima quelle cose belle;</p><p>s&igrave; ch&rsquo;a bene sperar m&rsquo;era cagione</p><p>di quella fiera a la gaetta pelle</p></div><div class="stanza"><p>l&rsquo;ora del tempo e la dolce stagione;</p><p>ma non s&igrave; che paura non mi desse</p><p>la vista che m&rsquo;apparve d&rsquo;un leone.</p></div><div class="stanza"><p>Questi parea che contra me venisse</p><p>con la test&rsquo; alta e con rabbiosa fame,</p><p>s&igrave; che parea che l&rsquo;aere ne tremesse.</p></div><div class="stanza"><p>Ed una lupa, che di tutte brame</p><p>sembiava carca ne la sua magrezza,</p><p>e molte genti f&eacute; gi&agrave; viver grame,</p></div><div class="stanza"><p>questa mi porse tanto di gravezza</p><p>con la paura ch&rsquo;uscia di sua vista,</p><p>ch&rsquo;io perdei la speranza de l&rsquo;altezza.</p></div><div class="stanza"><p>E qual &egrave; quei che volontieri acquista,</p><p>e giugne &rsquo;l tempo che perder lo face,</p><p>che &rsquo;n tutti suoi pensier piange e s&rsquo;attrista;</p></div><div class="stanza"><p>tal mi fece la bestia sanza pace,</p><p>che, venendomi &rsquo;ncontro, a poco a poco</p><p>mi ripigneva l&agrave; dove &rsquo;l sol tace.</p></div><div class="stanza"><p>Mentre ch&rsquo;i&rsquo; rovinava in basso loco,</p><p>dinanzi a li occhi mi si fu offerto</p><p>chi per lungo silenzio parea fioco.</p></div><div class="stanza"><p>Quando vidi costui nel gran diserto,</p><p>&laquo;Miserere di me&raquo;, gridai a lui,</p><p>&laquo;qual che tu sii, od ombra od omo certo!&raquo;.</p></div><div class="stanza"><p>Rispuosemi: &laquo;Non omo, omo gi&agrave; fui,</p><p>e li parenti miei furon lombardi,</p><p>mantoani per patr&iuml;a ambedui.</p></div><div class="stanza"><p>Nacqui sub Iulio, ancor che fosse tardi,</p><p>e vissi a Roma sotto &rsquo;l buono Augusto</p><p>nel tempo de li d&egrave;i falsi e bugiardi.</p></div><div class="stanza"><p>Poeta fui, e cantai di quel giusto</p><p>figliuol d&rsquo;Anchise che venne di Troia,</p><p>poi che &rsquo;l superbo Il&iuml;&oacute;n fu combusto.</p></div><div class="stanza"><p>Ma tu perch&eacute; ritorni a tanta noia?</p><p>perch&eacute; non sali il dilettoso monte</p><p>ch&rsquo;&egrave; principio e cagion di tutta gioia?&raquo;.</p></div><div class="stanza"><p>&laquo;Or se&rsquo; tu quel Virgilio e quella fonte</p><p>che spandi di parlar s&igrave; largo fiume?&raquo;,</p><p>rispuos&rsquo; io lui con vergognosa fronte.</p></div><div class="stanza"><p>&laquo;O de li altri poeti onore e lume,</p><p>vagliami &rsquo;l lungo studio e &rsquo;l grande amore</p><p>che m&rsquo;ha fatto cercar lo tuo volume.</p></div><div class="stanza"><p>Tu se&rsquo; lo mio maestro e &rsquo;l mio autore,</p><p>tu se&rsquo; solo colui da cu&rsquo; io tolsi</p><p>lo bello stilo che m&rsquo;ha fatto onore.</p></div><div class="stanza"><p>Vedi la bestia per cu&rsquo; io mi volsi;</p><p>aiutami da lei, famoso saggio,</p><p>ch&rsquo;ella mi fa tremar le vene e i polsi&raquo;.</p></div><div class="stanza"><p>&laquo;A te convien tenere altro v&iuml;aggio&raquo;,</p><p>rispuose, poi che lagrimar mi vide,</p><p>&laquo;se vuo&rsquo; campar d&rsquo;esto loco selvaggio;</p></div><div class="stanza"><p>ch&eacute; questa bestia, per la qual tu gride,</p><p>non lascia altrui passar per la sua via,</p><p>ma tanto lo &rsquo;mpedisce che l&rsquo;uccide;</p></div><div class="stanza"><p>e ha natura s&igrave; malvagia e ria,</p><p>che mai non empie la bramosa voglia,</p><p>e dopo &rsquo;l pasto ha pi&ugrave; fame che pria.</p></div><div class="stanza"><p>Molti son li animali a cui s&rsquo;ammoglia,</p><p>e pi&ugrave; saranno ancora, infin che &rsquo;l veltro</p><p>verr&agrave;, che la far&agrave; morir con doglia.</p></div><div class="stanza"><p>Questi non ciber&agrave; terra n&eacute; peltro,</p><p>ma sap&iuml;enza, amore e virtute,</p><p>e sua nazion sar&agrave; tra feltro e feltro.</p></div><div class="stanza"><p>Di quella umile Italia fia salute</p><p>per cui mor&igrave; la vergine Cammilla,</p><p>Eurialo e Turno e Niso di ferute.</p></div><div class="stanza"><p>Questi la caccer&agrave; per ogne villa,</p><p>fin che l&rsquo;avr&agrave; rimessa ne lo &rsquo;nferno,</p><p>l&agrave; onde &rsquo;nvidia prima dipartilla.</p></div><div class="stanza"><p>Ond&rsquo; io per lo tuo me&rsquo; penso e discerno</p><p>che tu mi segui, e io sar&ograve; tua guida,</p><p>e trarrotti di qui per loco etterno;</p></div><div class="stanza"><p>ove udirai le disperate strida,</p><p>vedrai li antichi spiriti dolenti,</p><p>ch&rsquo;a la seconda morte ciascun grida;</p></div><div class="stanza"><p>e vederai color che son contenti</p><p>nel foco, perch&eacute; speran di venire</p><p>quando che sia a le beate genti.</p></div><div class="stanza"><p>A le quai poi se tu vorrai salire,</p><p>anima fia a ci&ograve; pi&ugrave; di me degna:</p><p>con lei ti lascer&ograve; nel mio partire;</p></div><div class="stanza"><p>ch&eacute; quello imperador che l&agrave; s&ugrave; regna,</p><p>perch&rsquo; i&rsquo; fu&rsquo; ribellante a la sua legge,</p><p>non vuol che &rsquo;n sua citt&agrave; per me si vegna.</p></div><div class="stanza"><p>In tutte parti impera e quivi regge;</p><p>quivi &egrave; la sua citt&agrave; e l&rsquo;alto seggio:</p><p>oh felice colui cu&rsquo; ivi elegge!&raquo;.</p></div><div class="stanza"><p>E io a lui: &laquo;Poeta, io ti richeggio</p><p>per quello Dio che tu non conoscesti,</p><p>acci&ograve; ch&rsquo;io fugga questo male e peggio,</p></div><div class="stanza"><p>che tu mi meni l&agrave; dov&rsquo; or dicesti,</p><p>s&igrave; ch&rsquo;io veggia la porta di san Pietro</p><p>e color cui tu fai cotanto mesti&raquo;.</p></div><div class="stanza"><p>Allor si mosse, e io li tenni dietro.</p></div>', '<p class="cantohead">2</p>	<div class="stanza"><p>Lo giorno se n&rsquo;andava, e l&rsquo;aere bruno</p><p>toglieva li animai che sono in terra</p><p>da le fatiche loro; e io sol uno</p></div><div class="stanza"><p>m&rsquo;apparecchiava a sostener la guerra</p><p>s&igrave; del cammino e s&igrave; de la pietate,</p><p>che ritrarr&agrave; la mente che non erra.</p></div><div class="stanza"><p>O muse, o alto ingegno, or m&rsquo;aiutate;</p><p>o mente che scrivesti ci&ograve; ch&rsquo;io vidi,</p><p>qui si parr&agrave; la tua nobilitate.</p></div><div class="stanza"><p>Io cominciai: &laquo;Poeta che mi guidi,</p><p>guarda la mia virt&ugrave; s&rsquo;ell&rsquo; &egrave; possente,</p><p>prima ch&rsquo;a l&rsquo;alto passo tu mi fidi.</p></div><div class="stanza"><p>Tu dici che di Silv&iuml;o il parente,</p><p>corruttibile ancora, ad immortale</p><p>secolo and&ograve;, e fu sensibilmente.</p></div><div class="stanza"><p>Per&ograve;, se l&rsquo;avversario d&rsquo;ogne male</p><p>cortese i fu, pensando l&rsquo;alto effetto</p><p>ch&rsquo;uscir dovea di lui, e &rsquo;l chi e &rsquo;l quale</p></div><div class="stanza"><p>non pare indegno ad omo d&rsquo;intelletto;</p><p>ch&rsquo;e&rsquo; fu de l&rsquo;alma Roma e di suo impero</p><p>ne l&rsquo;empireo ciel per padre eletto:</p></div><div class="stanza"><p>la quale e &rsquo;l quale, a voler dir lo vero,</p><p>fu stabilita per lo loco santo</p><p>u&rsquo; siede il successor del maggior Piero.</p></div><div class="stanza"><p>Per quest&rsquo; andata onde li dai tu vanto,</p><p>intese cose che furon cagione</p><p>di sua vittoria e del papale ammanto.</p></div><div class="stanza"><p>Andovvi poi lo Vas d&rsquo;elez&iuml;one,</p><p>per recarne conforto a quella fede</p><p>ch&rsquo;&egrave; principio a la via di salvazione.</p></div><div class="stanza"><p>Ma io, perch&eacute; venirvi? o chi &rsquo;l concede?</p><p>Io non Enëa, io non Paulo sono;</p><p>me degno a ci&ograve; n&eacute; io n&eacute; altri &rsquo;l crede.</p></div><div class="stanza"><p>Per che, se del venire io m&rsquo;abbandono,</p><p>temo che la venuta non sia folle.</p><p>Se&rsquo; savio; intendi me&rsquo; ch&rsquo;i&rsquo; non ragiono&raquo;.</p></div><div class="stanza"><p>E qual &egrave; quei che disvuol ci&ograve; che volle</p><p>e per novi pensier cangia proposta,</p><p>s&igrave; che dal cominciar tutto si tolle,</p></div><div class="stanza"><p>tal mi fec&rsquo; &iuml;o &rsquo;n quella oscura costa,</p><p>perch&eacute;, pensando, consumai la &rsquo;mpresa</p><p>che fu nel cominciar cotanto tosta.</p></div><div class="stanza"><p>&laquo;S&rsquo;i&rsquo; ho ben la parola tua intesa&raquo;,</p><p>rispuose del magnanimo quell&rsquo; ombra,</p><p>&laquo;l&rsquo;anima tua &egrave; da viltade offesa;</p></div><div class="stanza"><p>la qual molte f&iuml;ate l&rsquo;omo ingombra</p><p>s&igrave; che d&rsquo;onrata impresa lo rivolve,</p><p>come falso veder bestia quand&rsquo; ombra.</p></div><div class="stanza"><p>Da questa tema acci&ograve; che tu ti solve,</p><p>dirotti perch&rsquo; io venni e quel ch&rsquo;io &rsquo;ntesi</p><p>nel primo punto che di te mi dolve.</p></div><div class="stanza"><p>Io era tra color che son sospesi,</p><p>e donna mi chiam&ograve; beata e bella,</p><p>tal che di comandare io la richiesi.</p></div><div class="stanza"><p>Lucevan li occhi suoi pi&ugrave; che la stella;</p><p>e cominciommi a dir soave e piana,</p><p>con angelica voce, in sua favella:</p></div><div class="stanza"><p>“O anima cortese mantoana,</p><p>di cui la fama ancor nel mondo dura,</p><p>e durer&agrave; quanto &rsquo;l mondo lontana,</p></div><div class="stanza"><p>l&rsquo;amico mio, e non de la ventura,</p><p>ne la diserta piaggia &egrave; impedito</p><p>s&igrave; nel cammin, che v&ograve;lt&rsquo; &egrave; per paura;</p></div><div class="stanza"><p>e temo che non sia gi&agrave; s&igrave; smarrito,</p><p>ch&rsquo;io mi sia tardi al soccorso levata,</p><p>per quel ch&rsquo;i&rsquo; ho di lui nel cielo udito.</p></div><div class="stanza"><p>Or movi, e con la tua parola ornata</p><p>e con ci&ograve; c&rsquo;ha mestieri al suo campare,</p><p>l&rsquo;aiuta s&igrave; ch&rsquo;i&rsquo; ne sia consolata.</p></div><div class="stanza"><p>I&rsquo; son Beatrice che ti faccio andare;</p><p>vegno del loco ove tornar disio;</p><p>amor mi mosse, che mi fa parlare.</p></div><div class="stanza"><p>Quando sar&ograve; dinanzi al segnor mio,</p><p>di te mi loder&ograve; sovente a lui”.</p><p>Tacette allora, e poi comincia&rsquo; io:</p></div><div class="stanza"><p>“O donna di virt&ugrave; sola per cui</p><p>l&rsquo;umana spezie eccede ogne contento</p><p>di quel ciel c&rsquo;ha minor li cerchi sui,</p></div><div class="stanza"><p>tanto m&rsquo;aggrada il tuo comandamento,</p><p>che l&rsquo;ubidir, se gi&agrave; fosse, m&rsquo;&egrave; tardi;</p><p>pi&ugrave; non t&rsquo;&egrave; uo&rsquo; ch&rsquo;aprirmi il tuo talento.</p></div><div class="stanza"><p>Ma dimmi la cagion che non ti guardi</p><p>de lo scender qua giuso in questo centro</p><p>de l&rsquo;ampio loco ove tornar tu ardi”.</p></div><div class="stanza"><p>“Da che tu vuo&rsquo; saver cotanto a dentro,</p><p>dirotti brievemente”, mi rispuose,</p><p>“perch&rsquo; i&rsquo; non temo di venir qua entro.</p></div><div class="stanza"><p>Temer si dee di sole quelle cose</p><p>c&rsquo;hanno potenza di fare altrui male;</p><p>de l&rsquo;altre no, ch&eacute; non son paurose.</p></div><div class="stanza"><p>I&rsquo; son fatta da Dio, sua merc&eacute;, tale,</p><p>che la vostra miseria non mi tange,</p><p>n&eacute; fiamma d&rsquo;esto &rsquo;ncendio non m&rsquo;assale.</p></div><div class="stanza"><p>Donna &egrave; gentil nel ciel che si compiange</p><p>di questo &rsquo;mpedimento ov&rsquo; io ti mando,</p><p>s&igrave; che duro giudicio l&agrave; s&ugrave; frange.</p></div><div class="stanza"><p>Questa chiese Lucia in suo dimando</p><p>e disse:—Or ha bisogno il tuo fedele</p><p>di te, e io a te lo raccomando—.</p></div><div class="stanza"><p>Lucia, nimica di ciascun crudele,</p><p>si mosse, e venne al loco dov&rsquo; i&rsquo; era,</p><p>che mi sedea con l&rsquo;antica Rachele.</p></div><div class="stanza"><p>Disse:—Beatrice, loda di Dio vera,</p><p>ch&eacute; non soccorri quei che t&rsquo;am&ograve; tanto,</p><p>ch&rsquo;usc&igrave; per te de la volgare schiera?</p></div><div class="stanza"><p>Non odi tu la pieta del suo pianto,</p><p>non vedi tu la morte che &rsquo;l combatte</p><p>su la fiumana ove &rsquo;l mar non ha vanto?—.</p></div><div class="stanza"><p>Al mondo non fur mai persone ratte</p><p>a far lor pro o a fuggir lor danno,</p><p>com&rsquo; io, dopo cotai parole fatte,</p></div><div class="stanza"><p>venni qua gi&ugrave; del mio beato scanno,</p><p>fidandomi del tuo parlare onesto,</p><p>ch&rsquo;onora te e quei ch&rsquo;udito l&rsquo;hanno”.</p></div><div class="stanza"><p>Poscia che m&rsquo;ebbe ragionato questo,</p><p>li occhi lucenti lagrimando volse,</p><p>per che mi fece del venir pi&ugrave; presto.</p></div><div class="stanza"><p>E venni a te cos&igrave; com&rsquo; ella volse:</p><p>d&rsquo;inanzi a quella fiera ti levai</p><p>che del bel monte il corto andar ti tolse.</p></div><div class="stanza"><p>Dunque: che &egrave;? perch&eacute;, perch&eacute; restai,</p><p>perch&eacute; tanta vilt&agrave; nel core allette,</p><p>perch&eacute; ardire e franchezza non hai,</p></div><div class="stanza"><p>poscia che tai tre donne benedette</p><p>curan di te ne la corte del cielo,</p><p>e &rsquo;l mio parlar tanto ben ti promette?&raquo;.</p></div><div class="stanza"><p>Quali fioretti dal notturno gelo</p><p>chinati e chiusi, poi che &rsquo;l sol li &rsquo;mbianca,</p><p>si drizzan tutti aperti in loro stelo,</p></div><div class="stanza"><p>tal mi fec&rsquo; io di mia virtude stanca,</p><p>e tanto buono ardire al cor mi corse,</p><p>ch&rsquo;i&rsquo; cominciai come persona franca:</p></div><div class="stanza"><p>&laquo;Oh pietosa colei che mi soccorse!</p><p>e te cortese ch&rsquo;ubidisti tosto</p><p>a le vere parole che ti porse!</p></div><div class="stanza"><p>Tu m&rsquo;hai con disiderio il cor disposto</p><p>s&igrave; al venir con le parole tue,</p><p>ch&rsquo;i&rsquo; son tornato nel primo proposto.</p></div><div class="stanza"><p>Or va, ch&rsquo;un sol volere &egrave; d&rsquo;ambedue:</p><p>tu duca, tu segnore e tu maestro&raquo;.</p><p>Cos&igrave; li dissi; e poi che mosso fue,</p></div><div class="stanza"><p>intrai per lo cammino alto e silvestro.</p></div>', '<p class="cantohead">3</p><div class="stanza"><p>‘&lsquo;Per me si va ne la citt&agrave; dolente,</p><p>per me si va ne l&rsquo;etterno dolore,</p><p>per me si va tra la perduta gente.</p></div><div class="stanza"><p>Giustizia mosse il mio alto fattore;</p><p>fecemi la divina podestate,</p><p>la somma sap&iuml;enza e &rsquo;l primo amore.</p></div><div class="stanza"><p>Dinanzi a me non fuor cose create</p><p>se non etterne, e io etterno duro.</p><p>Lasciate ogne speranza, voi ch&rsquo;intrate&rsquo;.</p></div><div class="stanza"><p>Queste parole di colore oscuro</p><p>vid&rsquo; &iuml;o scritte al sommo d&rsquo;una porta;</p><p>per ch&rsquo;io: &laquo;Maestro, il senso lor m&rsquo;&egrave; duro&raquo;.</p></div><div class="stanza"><p>Ed elli a me, come persona accorta:</p><p>&laquo;Qui si convien lasciare ogne sospetto;</p><p>ogne vilt&agrave; convien che qui sia morta.</p></div><div class="stanza"><p>Noi siam venuti al loco ov&rsquo; i&rsquo; t&rsquo;ho detto</p><p>che tu vedrai le genti dolorose</p><p>c&rsquo;hanno perduto il ben de l&rsquo;intelletto&raquo;.</p></div><div class="stanza"><p>E poi che la sua mano a la mia puose</p><p>con lieto volto, ond&rsquo; io mi confortai,</p><p>mi mise dentro a le segrete cose.</p></div><div class="stanza"><p>Quivi sospiri, pianti e alti guai</p><p>risonavan per l&rsquo;aere sanza stelle,</p><p>per ch&rsquo;io al cominciar ne lagrimai.</p></div><div class="stanza"><p>Diverse lingue, orribili favelle,</p><p>parole di dolore, accenti d&rsquo;ira,</p><p>voci alte e fioche, e suon di man con elle</p></div><div class="stanza"><p>facevano un tumulto, il qual s&rsquo;aggira</p><p>sempre in quell&rsquo; aura sanza tempo tinta,</p><p>come la rena quando turbo spira.</p></div><div class="stanza"><p>E io ch&rsquo;avea d&rsquo;error la testa cinta,</p><p>dissi: &laquo;Maestro, che &egrave; quel ch&rsquo;i&rsquo; odo?</p><p>e che gent&rsquo; &egrave; che par nel duol s&igrave; vinta?&raquo;.</p></div><div class="stanza"><p>Ed elli a me: &laquo;Questo misero modo</p><p>tegnon l&rsquo;anime triste di coloro</p><p>che visser sanza &rsquo;nfamia e sanza lodo.</p></div><div class="stanza"><p>Mischiate sono a quel cattivo coro</p><p>de li angeli che non furon ribelli</p><p>n&eacute; fur fedeli a Dio, ma per s&eacute; fuoro.</p></div><div class="stanza"><p>Caccianli i ciel per non esser men belli,</p><p>n&eacute; lo profondo inferno li riceve,</p><p>ch&rsquo;alcuna gloria i rei avrebber d&rsquo;elli&raquo;.</p></div><div class="stanza"><p>E io: &laquo;Maestro, che &egrave; tanto greve</p><p>a lor che lamentar li fa s&igrave; forte?&raquo;.</p><p>Rispuose: &laquo;Dicerolti molto breve.</p></div><div class="stanza"><p>Questi non hanno speranza di morte,</p><p>e la lor cieca vita &egrave; tanto bassa,</p><p>che &rsquo;nvid&iuml;osi son d&rsquo;ogne altra sorte.</p></div><div class="stanza"><p>Fama di loro il mondo esser non lassa;</p><p>misericordia e giustizia li sdegna:</p><p>non ragioniam di lor, ma guarda e passa&raquo;.</p></div><div class="stanza"><p>E io, che riguardai, vidi una &rsquo;nsegna</p><p>che girando correva tanto ratta,</p><p>che d&rsquo;ogne posa mi parea indegna;</p></div><div class="stanza"><p>e dietro le ven&igrave;a s&igrave; lunga tratta</p><p>di gente, ch&rsquo;i&rsquo; non averei creduto</p><p>che morte tanta n&rsquo;avesse disfatta.</p></div><div class="stanza"><p>Poscia ch&rsquo;io v&rsquo;ebbi alcun riconosciuto,</p><p>vidi e conobbi l&rsquo;ombra di colui</p><p>che fece per viltade il gran rifiuto.</p></div><div class="stanza"><p>Incontanente intesi e certo fui</p><p>che questa era la setta d&rsquo;i cattivi,</p><p>a Dio spiacenti e a&rsquo; nemici sui.</p></div><div class="stanza"><p>Questi sciaurati, che mai non fur vivi,</p><p>erano ignudi e stimolati molto</p><p>da mosconi e da vespe ch&rsquo;eran ivi.</p></div><div class="stanza"><p>Elle rigavan lor di sangue il volto,</p><p>che, mischiato di lagrime, a&rsquo; lor piedi</p><p>da fastidiosi vermi era ricolto.</p></div><div class="stanza"><p>E poi ch&rsquo;a riguardar oltre mi diedi,</p><p>vidi genti a la riva d&rsquo;un gran fiume;</p><p>per ch&rsquo;io dissi: &laquo;Maestro, or mi concedi</p></div><div class="stanza"><p>ch&rsquo;i&rsquo; sappia quali sono, e qual costume</p><p>le fa di trapassar parer s&igrave; pronte,</p><p>com&rsquo; i&rsquo; discerno per lo fioco lume&raquo;.</p></div><div class="stanza"><p>Ed elli a me: &laquo;Le cose ti fier conte</p><p>quando noi fermerem li nostri passi</p><p>su la trista riviera d&rsquo;Acheronte&raquo;.</p></div><div class="stanza"><p>Allor con li occhi vergognosi e bassi,</p><p>temendo no &rsquo;l mio dir li fosse grave,</p><p>infino al fiume del parlar mi trassi.</p></div><div class="stanza"><p>Ed ecco verso noi venir per nave</p><p>un vecchio, bianco per antico pelo,</p><p>gridando: &laquo;Guai a voi, anime prave!</p></div><div class="stanza"><p>Non isperate mai veder lo cielo:</p><p>i&rsquo; vegno per menarvi a l&rsquo;altra riva</p><p>ne le tenebre etterne, in caldo e &rsquo;n gelo.</p></div><div class="stanza"><p>E tu che se&rsquo; cost&igrave;, anima viva,</p><p>p&agrave;rtiti da cotesti che son morti&raquo;.</p><p>Ma poi che vide ch&rsquo;io non mi partiva,</p></div><div class="stanza"><p>disse: &laquo;Per altra via, per altri porti</p><p>verrai a piaggia, non qui, per passare:</p><p>pi&ugrave; lieve legno convien che ti porti&raquo;.</p></div><div class="stanza"><p>E &rsquo;l duca lui: &laquo;Caron, non ti crucciare:</p><p>vuolsi cos&igrave; col&agrave; dove si puote</p><p>ci&ograve; che si vuole, e pi&ugrave; non dimandare&raquo;.</p></div><div class="stanza"><p>Quinci fuor quete le lanose gote</p><p>al nocchier de la livida palude,</p><p>che &rsquo;ntorno a li occhi avea di fiamme rote.</p></div><div class="stanza"><p>Ma quell&rsquo; anime, ch&rsquo;eran lasse e nude,</p><p>cangiar colore e dibattero i denti,</p><p>ratto che &rsquo;nteser le parole crude.</p></div><div class="stanza"><p>Bestemmiavano Dio e lor parenti,</p><p>l&rsquo;umana spezie e &rsquo;l loco e &rsquo;l tempo e &rsquo;l seme</p><p>di lor semenza e di lor nascimenti.</p></div><div class="stanza"><p>Poi si ritrasser tutte quante insieme,</p><p>forte piangendo, a la riva malvagia</p><p>ch&rsquo;attende ciascun uom che Dio non teme.</p></div><div class="stanza"><p>Caron dimonio, con occhi di bragia</p><p>loro accennando, tutte le raccoglie;</p><p>batte col remo qualunque s&rsquo;adagia.</p></div><div class="stanza"><p>Come d&rsquo;autunno si levan le foglie</p><p>l&rsquo;una appresso de l&rsquo;altra, fin che &rsquo;l ramo</p><p>vede a la terra tutte le sue spoglie,</p></div><div class="stanza"><p>similemente il mal seme d&rsquo;Adamo</p><p>gittansi di quel lito ad una ad una,</p><p>per cenni come augel per suo richiamo.</p></div><div class="stanza"><p>Cos&igrave; sen vanno su per l&rsquo;onda bruna,</p><p>e avanti che sien di l&agrave; discese,</p><p>anche di qua nuova schiera s&rsquo;auna.</p></div><div class="stanza"><p>&laquo;Figliuol mio&raquo;, disse &rsquo;l maestro cortese,</p><p>&laquo;quelli che muoion ne l&rsquo;ira di Dio</p><p>tutti convegnon qui d&rsquo;ogne paese;</p></div><div class="stanza"><p>e pronti sono a trapassar lo rio,</p><p>ch&eacute; la divina giustizia li sprona,</p><p>s&igrave; che la tema si volve in disio.</p></div><div class="stanza"><p>Quinci non passa mai anima buona;</p><p>e per&ograve;, se Caron di te si lagna,</p><p>ben puoi sapere omai che &rsquo;l suo dir suona&raquo;.</p></div><div class="stanza"><p>Finito questo, la buia campagna</p><p>trem&ograve; s&igrave; forte, che de lo spavento</p><p>la mente di sudore ancor mi bagna.</p></div><div class="stanza"><p>La terra lagrimosa diede vento,</p><p>che balen&ograve; una luce vermiglia</p><p>la qual mi vinse ciascun sentimento;</p></div><div class="stanza"><p>e caddi come l&rsquo;uom cui sonno piglia.</p></div>'];

module.exports = italian;

},{}],7:[function(require,module,exports){
'use strict';

// longfellow.js

var longfellow = ['<p class="title">Inferno</p><p class="author">Henry Wadsworth Longfellow</p>', '<p class="cantohead">Inferno: Canto I</p><div class="stanza"><p>Midway upon the journey of our life</p><p class="slindent">I found myself within a forest dark,</p><p class="slindent">For the straightforward pathway had been lost.</p></div><div class="stanza"><p>Ah me! how hard a thing it is to say</p><p class="slindent">What was this forest savage, rough, and stern,</p><p class="slindent">Which in the very thought renews the fear.</p></div><div class="stanza"><p>So bitter is it, death is little more;</p><p class="slindent">But of the good to treat, which there I found,</p><p class="slindent">Speak will I of the other things I saw there.</p></div><div class="stanza"><p>I cannot well repeat how there I entered,</p><p class="slindent">So full was I of slumber at the moment</p><p class="slindent">In which I had abandoned the true way.</p></div><div class="stanza"><p>But after I had reached a mountain&rsquo;s foot,</p><p class="slindent">At that point where the valley terminated,</p><p class="slindent">Which had with consternation pierced my heart,</p></div><div class="stanza"><p>Upward I looked, and I beheld its shoulders,</p><p class="slindent">Vested already with that planet&rsquo;s rays</p><p class="slindent">Which leadeth others right by every road.</p></div><div class="stanza"><p>Then was the fear a little quieted</p><p class="slindent">That in my heart&rsquo;s lake had endured throughout</p><p class="slindent">The night, which I had passed so piteously.</p></div><div class="stanza"><p>And even as he, who, with distressful breath,</p><p class="slindent">Forth issued from the sea upon the shore,</p><p class="slindent">Turns to the water perilous and gazes;</p></div><div class="stanza"><p>So did my soul, that still was fleeing onward,</p><p class="slindent">Turn itself back to re-behold the pass</p><p class="slindent">Which never yet a living person left.</p></div><div class="stanza"><p>After my weary body I had rested,</p><p class="slindent">The way resumed I on the desert slope,</p><p class="slindent">So that the firm foot ever was the lower.</p></div><div class="stanza"><p>And lo! almost where the ascent began,</p><p class="slindent">A panther light and swift exceedingly,</p><p class="slindent">Which with a spotted skin was covered o&rsquo;er!</p></div><div class="stanza"><p>And never moved she from before my face,</p><p class="slindent">Nay, rather did impede so much my way,</p><p class="slindent">That many times I to return had turned.</p></div><div class="stanza"><p>The time was the beginning of the morning,</p><p class="slindent">And up the sun was mounting with those stars</p><p class="slindent">That with him were, what time the Love Divine</p></div><div class="stanza"><p>At first in motion set those beauteous things;</p><p class="slindent">So were to me occasion of good hope,</p><p class="slindent">The variegated skin of that wild beast,</p></div><div class="stanza"><p>The hour of time, and the delicious season;</p><p class="slindent">But not so much, that did not give me fear</p><p class="slindent">A lion&rsquo;s aspect which appeared to me.</p></div><div class="stanza"><p>He seemed as if against me he were coming</p><p class="slindent">With head uplifted, and with ravenous hunger,</p><p class="slindent">So that it seemed the air was afraid of him;</p></div><div class="stanza"><p>And a she-wolf, that with all hungerings</p><p class="slindent">Seemed to be laden in her meagreness,</p><p class="slindent">And many folk has caused to live forlorn!</p></div><div class="stanza"><p>She brought upon me so much heaviness,</p><p class="slindent">With the affright that from her aspect came,</p><p class="slindent">That I the hope relinquished of the height.</p></div><div class="stanza"><p>And as he is who willingly acquires,</p><p class="slindent">And the time comes that causes him to lose,</p><p class="slindent">Who weeps in all his thoughts and is despondent,</p></div><div class="stanza"><p>E&rsquo;en such made me that beast withouten peace,</p><p class="slindent">Which, coming on against me by degrees</p><p class="slindent">Thrust me back thither where the sun is silent.</p></div><div class="stanza"><p>While I was rushing downward to the lowland,</p><p class="slindent">Before mine eyes did one present himself,</p><p class="slindent">Who seemed from long-continued silence hoarse.</p></div><div class="stanza"><p>When I beheld him in the desert vast,</p><p class="slindent">&ldquo;Have pity on me,&rdquo; unto him I cried,</p><p class="slindent">&ldquo;Whiche&rsquo;er thou art, or shade or real man!&rdquo;</p></div><div class="stanza"><p>He answered me: &ldquo;Not man; man once I was,</p><p class="slindent">And both my parents were of Lombardy,</p><p class="slindent">And Mantuans by country both of them.</p></div><div class="stanza"><p>&lsquo;Sub Julio&rsquo; was I born, though it was late,</p><p class="slindent">And lived at Rome under the good Augustus,</p><p class="slindent">During the time of false and lying gods.</p></div><div class="stanza"><p>A poet was I, and I sang that just</p><p class="slindent">Son of Anchises, who came forth from Troy,</p><p class="slindent">After that Ilion the superb was burned.</p></div><div class="stanza"><p>But thou, why goest thou back to such annoyance?</p><p class="slindent">Why climb&rsquo;st thou not the Mount Delectable,</p><p class="slindent">Which is the source and cause of every joy?&rdquo;</p></div><div class="stanza"><p>&ldquo;Now, art thou that Virgilius and that fountain</p><p class="slindent">Which spreads abroad so wide a river of speech?&rdquo;</p><p class="slindent">I made response to him with bashful forehead.</p></div><div class="stanza"><p>&ldquo;O, of the other poets honour and light,</p><p class="slindent">Avail me the long study and great love</p><p class="slindent">That have impelled me to explore thy volume!</p></div><div class="stanza"><p>Thou art my master, and my author thou,</p><p class="slindent">Thou art alone the one from whom I took</p><p class="slindent">The beautiful style that has done honour to me.</p></div><div class="stanza"><p>Behold the beast, for which I have turned back;</p><p class="slindent">Do thou protect me from her, famous Sage,</p><p class="slindent">For she doth make my veins and pulses tremble.&rdquo;</p></div><div class="stanza"><p>&ldquo;Thee it behoves to take another road,&rdquo;</p><p class="slindent">Responded he, when he beheld me weeping,</p><p class="slindent">&ldquo;If from this savage place thou wouldst escape;</p></div><div class="stanza"><p>Because this beast, at which thou criest out,</p><p class="slindent">Suffers not any one to pass her way,</p><p class="slindent">But so doth harass him, that she destroys him;</p></div><div class="stanza"><p>And has a nature so malign and ruthless,</p><p class="slindent">That never doth she glut her greedy will,</p><p class="slindent">And after food is hungrier than before.</p></div><div class="stanza"><p>Many the animals with whom she weds,</p><p class="slindent">And more they shall be still, until the Greyhound</p><p class="slindent">Comes, who shall make her perish in her pain.</p></div><div class="stanza"><p>He shall not feed on either earth or pelf,</p><p class="slindent">But upon wisdom, and on love and virtue;</p><p class="slindent">&rsquo;Twixt Feltro and Feltro shall his nation be;</p></div><div class="stanza"><p>Of that low Italy shall he be the saviour,</p><p class="slindent">On whose account the maid Camilla died,</p><p class="slindent">Euryalus, Turnus, Nisus, of their wounds;</p></div><div class="stanza"><p>Through every city shall he hunt her down,</p><p class="slindent">Until he shall have driven her back to Hell,</p><p class="slindent">There from whence envy first did let her loose.</p></div><div class="stanza"><p>Therefore I think and judge it for thy best</p><p class="slindent">Thou follow me, and I will be thy guide,</p><p class="slindent">And lead thee hence through the eternal place,</p></div><div class="stanza"><p>Where thou shalt hear the desperate lamentations,</p><p class="slindent">Shalt see the ancient spirits disconsolate,</p><p class="slindent">Who cry out each one for the second death;</p></div><div class="stanza"><p>And thou shalt see those who contented are</p><p class="slindent">Within the fire, because they hope to come,</p><p class="slindent">Whene&rsquo;er it may be, to the blessed people;</p></div><div class="stanza"><p>To whom, then, if thou wishest to ascend,</p><p class="slindent">A soul shall be for that than I more worthy;</p><p class="slindent">With her at my departure I will leave thee;</p></div><div class="stanza"><p>Because that Emperor, who reigns above,</p><p class="slindent">In that I was rebellious to his law,</p><p class="slindent">Wills that through me none come into his city.</p></div><div class="stanza"><p>He governs everywhere, and there he reigns;</p><p class="slindent">There is his city and his lofty throne;</p><p class="slindent">O happy he whom thereto he elects!&rdquo;</p></div><div class="stanza"><p>And I to him: &ldquo;Poet, I thee entreat,</p><p class="slindent">By that same God whom thou didst never know,</p><p class="slindent">So that I may escape this woe and worse,</p></div><div class="stanza"><p>Thou wouldst conduct me there where thou hast said,</p><p class="slindent">That I may see the portal of Saint Peter,</p><p class="slindent">And those thou makest so disconsolate.&rdquo;</p></div><div class="stanza"><p>Then he moved on, and I behind him followed.</p></div>', '<p class="cantohead">Inferno: Canto II</p><div class="stanza"><p>Day was departing, and the embrowned air</p><p class="slindent">Released the animals that are on earth</p><p class="slindent">From their fatigues; and I the only one</p></div><div class="stanza"><p>Made myself ready to sustain the war,</p><p class="slindent">Both of the way and likewise of the woe,</p><p class="slindent">Which memory that errs not shall retrace.</p></div><div class="stanza"><p>O Muses, O high genius, now assist me!</p><p class="slindent">O memory, that didst write down what I saw,</p><p class="slindent">Here thy nobility shall be manifest!</p></div><div class="stanza"><p>And I began: &ldquo;Poet, who guidest me,</p><p class="slindent">Regard my manhood, if it be sufficient,</p><p class="slindent">Ere to the arduous pass thou dost confide me.</p></div><div class="stanza"><p>Thou sayest, that of Silvius the parent,</p><p class="slindent">While yet corruptible, unto the world</p><p class="slindent">Immortal went, and was there bodily.</p></div><div class="stanza"><p>But if the adversary of all evil</p><p class="slindent">Was courteous, thinking of the high effect</p><p class="slindent">That issue would from him, and who, and what,</p></div><div class="stanza"><p>To men of intellect unmeet it seems not;</p><p class="slindent">For he was of great Rome, and of her empire</p><p class="slindent">In the empyreal heaven as father chosen;</p></div><div class="stanza"><p>The which and what, wishing to speak the truth,</p><p class="slindent">Were stablished as the holy place, wherein</p><p class="slindent">Sits the successor of the greatest Peter.</p></div><div class="stanza"><p>Upon this journey, whence thou givest him vaunt,</p><p class="slindent">Things did he hear, which the occasion were</p><p class="slindent">Both of his victory and the papal mantle.</p></div><div class="stanza"><p>Thither went afterwards the Chosen Vessel,</p><p class="slindent">To bring back comfort thence unto that Faith,</p><p class="slindent">Which of salvation&rsquo;s way is the beginning.</p></div><div class="stanza"><p>But I, why thither come, or who concedes it?</p><p class="slindent">I not Aeneas am, I am not Paul,</p><p class="slindent">Nor I, nor others, think me worthy of it.</p></div><div class="stanza"><p>Therefore, if I resign myself to come,</p><p class="slindent">I fear the coming may be ill-advised;</p><p class="slindent">Thou&rsquo;rt wise, and knowest better than I speak.&rdquo;</p></div><div class="stanza"><p>And as he is, who unwills what he willed,</p><p class="slindent">And by new thoughts doth his intention change,</p><p class="slindent">So that from his design he quite withdraws,</p></div><div class="stanza"><p>Such I became, upon that dark hillside,</p><p class="slindent">Because, in thinking, I consumed the emprise,</p><p class="slindent">Which was so very prompt in the beginning.</p></div><div class="stanza"><p>&ldquo;If I have well thy language understood,&rdquo;</p><p class="slindent">Replied that shade of the Magnanimous,</p><p class="slindent">&ldquo;Thy soul attainted is with cowardice,</p></div><div class="stanza"><p>Which many times a man encumbers so,</p><p class="slindent">It turns him back from honoured enterprise,</p><p class="slindent">As false sight doth a beast, when he is shy.</p></div><div class="stanza"><p>That thou mayst free thee from this apprehension,</p><p class="slindent">I&rsquo;ll tell thee why I came, and what I heard</p><p class="slindent">At the first moment when I grieved for thee.</p></div><div class="stanza"><p>Among those was I who are in suspense,</p><p class="slindent">And a fair, saintly Lady called to me</p><p class="slindent">In such wise, I besought her to command me.</p></div><div class="stanza"><p>Her eyes where shining brighter than the Star;</p><p class="slindent">And she began to say, gentle and low,</p><p class="slindent">With voice angelical, in her own language:</p></div><div class="stanza"><p>&lsquo;O spirit courteous of Mantua,</p><p class="slindent">Of whom the fame still in the world endures,</p><p class="slindent">And shall endure, long-lasting as the world;</p></div><div class="stanza"><p>A friend of mine, and not the friend of fortune,</p><p class="slindent">Upon the desert slope is so impeded</p><p class="slindent">Upon his way, that he has turned through terror,</p></div><div class="stanza"><p>And may, I fear, already be so lost,</p><p class="slindent">That I too late have risen to his succour,</p><p class="slindent">From that which I have heard of him in Heaven.</p></div><div class="stanza"><p>Bestir thee now, and with thy speech ornate,</p><p class="slindent">And with what needful is for his release,</p><p class="slindent">Assist him so, that I may be consoled.</p></div><div class="stanza"><p>Beatrice am I, who do bid thee go;</p><p class="slindent">I come from there, where I would fain return;</p><p class="slindent">Love moved me, which compelleth me to speak.</p></div><div class="stanza"><p>When I shall be in presence of my Lord,</p><p class="slindent">Full often will I praise thee unto him.&rsquo;</p><p class="slindent">Then paused she, and thereafter I began:</p></div><div class="stanza"><p>&lsquo;O Lady of virtue, thou alone through whom</p><p class="slindent">The human race exceedeth all contained</p><p class="slindent">Within the heaven that has the lesser circles,</p></div><div class="stanza"><p>So grateful unto me is thy commandment,</p><p class="slindent">To obey, if &lsquo;twere already done, were late;</p><p class="slindent">No farther need&lsquo;st thou ope to me thy wish.</p></div><div class="stanza"><p>But the cause tell me why thou dost not shun</p><p class="slindent">The here descending down into this centre,</p><p class="slindent">From the vast place thou burnest to return to.&rsquo;</p></div><div class="stanza"><p>&lsquo;Since thou wouldst fain so inwardly discern,</p><p class="slindent">Briefly will I relate,&rsquo; she answered me,</p><p class="slindent">&lsquo;Why I am not afraid to enter here.</p></div><div class="stanza"><p>Of those things only should one be afraid</p><p class="slindent">Which have the power of doing others harm;</p><p class="slindent">Of the rest, no; because they are not fearful.</p></div><div class="stanza"><p>God in his mercy such created me</p><p class="slindent">That misery of yours attains me not,</p><p class="slindent">Nor any flame assails me of this burning.</p></div><div class="stanza"><p>A gentle Lady is in Heaven, who grieves</p><p class="slindent">At this impediment, to which I send thee,</p><p class="slindent">So that stern judgment there above is broken.</p></div><div class="stanza"><p>In her entreaty she besought Lucia,</p><p class="slindent">And said, &ldquo;Thy faithful one now stands in need</p><p class="slindent">Of thee, and unto thee I recommend him.&rdquo;</p></div><div class="stanza"><p>Lucia, foe of all that cruel is,</p><p class="slindent">Hastened away, and came unto the place</p><p class="slindent">Where I was sitting with the ancient Rachel.</p></div><div class="stanza"><p>&ldquo;Beatrice&rdquo; said she, &ldquo;the true praise of God,</p><p class="slindent">Why succourest thou not him, who loved thee so,</p><p class="slindent">For thee he issued from the vulgar herd?</p></div><div class="stanza"><p>Dost thou not hear the pity of his plaint?</p><p class="slindent">Dost thou not see the death that combats him</p><p class="slindent">Beside that flood, where ocean has no vaunt?&rdquo;</p></div><div class="stanza"><p>Never were persons in the world so swift</p><p class="slindent">To work their weal and to escape their woe,</p><p class="slindent">As I, after such words as these were uttered,</p></div><div class="stanza"><p>Came hither downward from my blessed seat,</p><p class="slindent">Confiding in thy dignified discourse,</p><p class="slindent">Which honours thee, and those who&rsquo;ve listened to it.&rsquo;</p></div><div class="stanza"><p>After she thus had spoken unto me,</p><p class="slindent">Weeping, her shining eyes she turned away;</p><p class="slindent">Whereby she made me swifter in my coming;</p></div><div class="stanza"><p>And unto thee I came, as she desired;</p><p class="slindent">I have delivered thee from that wild beast,</p><p class="slindent">Which barred the beautiful mountain&rsquo;s short ascent.</p></div><div class="stanza"><p>What is it, then?  Why, why dost thou delay?</p><p class="slindent">Why is such baseness bedded in thy heart?</p><p class="slindent">Daring and hardihood why hast thou not,</p></div><div class="stanza"><p>Seeing that three such Ladies benedight</p><p class="slindent">Are caring for thee in the court of Heaven,</p><p class="slindent">And so much good my speech doth promise thee?&rdquo;</p></div><div class="stanza"><p>Even as the flowerets, by nocturnal chill,</p><p class="slindent">Bowed down and closed, when the sun whitens them,</p><p class="slindent">Uplift themselves all open on their stems;</p></div><div class="stanza"><p>Such I became with my exhausted strength,</p><p class="slindent">And such good courage to my heart there coursed,</p><p class="slindent">That I began, like an intrepid person:</p></div><div class="stanza"><p>&ldquo;O she compassionate, who succoured me,</p><p class="slindent">And courteous thou, who hast obeyed so soon</p><p class="slindent">The words of truth which she addressed to thee!</p></div><div class="stanza"><p>Thou hast my heart so with desire disposed</p><p class="slindent">To the adventure, with these words of thine,</p><p class="slindent">That to my first intent I have returned.</p></div><div class="stanza"><p>Now go, for one sole will is in us both,</p><p class="slindent">Thou Leader, and thou Lord, and Master thou.&rdquo;</p><p class="slindent">Thus said I to him; and when he had moved,</p></div><div class="stanza"><p>I entered on the deep and savage way.</p></div>', '<p class="cantohead">Inferno: Canto III</p><div class="stanza"><p>&ldquo;Through me the way is to the city dolent;</p><p class="slindent">Through me the way is to eternal dole;</p><p class="slindent">Through me the way among the people lost.</p></div><div class="stanza"><p>Justice incited my sublime Creator;</p><p class="slindent">Created me divine Omnipotence,</p><p class="slindent">The highest Wisdom and the primal Love.</p></div><div class="stanza"><p>Before me there were no created things,</p><p class="slindent">Only eterne, and I eternal last.</p><p class="slindent">All hope abandon, ye who enter in!&rdquo;</p></div><div class="stanza"><p>These words in sombre colour I beheld</p><p class="slindent">Written upon the summit of a gate;</p><p class="slindent">Whence I: &ldquo;Their sense is, Master, hard to me!&rdquo;</p></div><div class="stanza"><p>And he to me, as one experienced:</p><p class="slindent">&ldquo;Here all suspicion needs must be abandoned,</p><p class="slindent">All cowardice must needs be here extinct.</p></div><div class="stanza"><p>We to the place have come, where I have told thee</p><p class="slindent">Thou shalt behold the people dolorous</p><p class="slindent">Who have foregone the good of intellect.&rdquo;</p></div><div class="stanza"><p>And after he had laid his hand on mine</p><p class="slindent">With joyful mien, whence I was comforted,</p><p class="slindent">He led me in among the secret things.</p></div><div class="stanza"><p>There sighs, complaints, and ululations loud</p><p class="slindent">Resounded through the air without a star,</p><p class="slindent">Whence I, at the beginning, wept thereat.</p></div><div class="stanza"><p>Languages diverse, horrible dialects,</p><p class="slindent">Accents of anger, words of agony,</p><p class="slindent">And voices high and hoarse, with sound of hands,</p></div><div class="stanza"><p>Made up a tumult that goes whirling on</p><p class="slindent">For ever in that air for ever black,</p><p class="slindent">Even as the sand doth, when the whirlwind breathes.</p></div><div class="stanza"><p>And I, who had my head with horror bound,</p><p class="slindent">Said: &ldquo;Master, what is this which now I hear?</p><p class="slindent">What folk is this, which seems by pain so vanquished?&rdquo;</p></div><div class="stanza"><p>And he to me: &ldquo;This miserable mode</p><p class="slindent">Maintain the melancholy souls of those</p><p class="slindent">Who lived withouten infamy or praise.</p></div><div class="stanza"><p>Commingled are they with that caitiff choir</p><p class="slindent">Of Angels, who have not rebellious been,</p><p class="slindent">Nor faithful were to God, but were for self.</p></div><div class="stanza"><p>The heavens expelled them, not to be less fair;</p><p class="slindent">Nor them the nethermore abyss receives,</p><p class="slindent">For glory none the damned would have from them.&rdquo;</p></div><div class="stanza"><p>And I: &ldquo;O Master, what so grievous is</p><p class="slindent">To these, that maketh them lament so sore?&rdquo;</p><p class="slindent">He answered: &ldquo;I will tell thee very briefly.</p></div><div class="stanza"><p>These have no longer any hope of death;</p><p class="slindent">And this blind life of theirs is so debased,</p><p class="slindent">They envious are of every other fate.</p></div><div class="stanza"><p>No fame of them the world permits to be;</p><p class="slindent">Misericord and Justice both disdain them.</p><p class="slindent">Let us not speak of them, but look, and pass.&rdquo;</p></div><div class="stanza"><p>And I, who looked again, beheld a banner,</p><p class="slindent">Which, whirling round, ran on so rapidly,</p><p class="slindent">That of all pause it seemed to me indignant;</p></div><div class="stanza"><p>And after it there came so long a train</p><p class="slindent">Of people, that I ne&rsquo;er would have believed</p><p class="slindent">That ever Death so many had undone.</p></div><div class="stanza"><p>When some among them I had recognised,</p><p class="slindent">I looked, and I beheld the shade of him</p><p class="slindent">Who made through cowardice the great refusal.</p></div><div class="stanza"><p>Forthwith I comprehended, and was certain,</p><p class="slindent">That this the sect was of the caitiff wretches</p><p class="slindent">Hateful to God and to his enemies.</p></div><div class="stanza"><p>These miscreants, who never were alive,</p><p class="slindent">Were naked, and were stung exceedingly</p><p class="slindent">By gadflies and by hornets that were there.</p></div><div class="stanza"><p>These did their faces irrigate with blood,</p><p class="slindent">Which, with their tears commingled, at their feet</p><p class="slindent">By the disgusting worms was gathered up.</p></div><div class="stanza"><p>And when to gazing farther I betook me.</p><p class="slindent">People I saw on a great river&rsquo;s bank;</p><p class="slindent">Whence said I: &ldquo;Master, now vouchsafe to me,</p></div><div class="stanza"><p>That I may know who these are, and what law</p><p class="slindent">Makes them appear so ready to pass over,</p><p class="slindent">As I discern athwart the dusky light.&rdquo;</p></div><div class="stanza"><p>And he to me: &ldquo;These things shall all be known</p><p class="slindent">To thee, as soon as we our footsteps stay</p><p class="slindent">Upon the dismal shore of Acheron.&rdquo;</p></div><div class="stanza"><p>Then with mine eyes ashamed and downward cast,</p><p class="slindent">Fearing my words might irksome be to him,</p><p class="slindent">From speech refrained I till we reached the river.</p></div><div class="stanza"><p>And lo! towards us coming in a boat</p><p class="slindent">An old man, hoary with the hair of eld,</p><p class="slindent">Crying: &ldquo;Woe unto you, ye souls depraved!</p></div><div class="stanza"><p>Hope nevermore to look upon the heavens;</p><p class="slindent">I come to lead you to the other shore,</p><p class="slindent">To the eternal shades in heat and frost.</p></div><div class="stanza"><p>And thou, that yonder standest, living soul,</p><p class="slindent">Withdraw thee from these people, who are dead!&rdquo;</p><p class="slindent">But when he saw that I did not withdraw,</p></div><div class="stanza"><p>He said: &ldquo;By other ways, by other ports</p><p class="slindent">Thou to the shore shalt come, not here, for passage;</p><p class="slindent">A lighter vessel needs must carry thee.&rdquo;</p></div><div class="stanza"><p>And unto him the Guide: &ldquo;Vex thee not, Charon;</p><p class="slindent">It is so willed there where is power to do</p><p class="slindent">That which is willed; and farther question not.&rdquo;</p></div><div class="stanza"><p>Thereat were quieted the fleecy cheeks</p><p class="slindent">Of him the ferryman of the livid fen,</p><p class="slindent">Who round about his eyes had wheels of flame.</p></div><div class="stanza"><p>But all those souls who weary were and naked</p><p class="slindent">Their colour changed and gnashed their teeth together,</p><p class="slindent">As soon as they had heard those cruel words.</p></div><div class="stanza"><p>God they blasphemed and their progenitors,</p><p class="slindent">The human race, the place, the time, the seed</p><p class="slindent">Of their engendering and of their birth!</p></div><div class="stanza"><p>Thereafter all together they drew back,</p><p class="slindent">Bitterly weeping, to the accursed shore,</p><p class="slindent">Which waiteth every man who fears not God.</p></div><div class="stanza"><p>Charon the demon, with the eyes of glede,</p><p class="slindent">Beckoning to them, collects them all together,</p><p class="slindent">Beats with his oar whoever lags behind.</p></div><div class="stanza"><p>As in the autumn-time the leaves fall off,</p><p class="slindent">First one and then another, till the branch</p><p class="slindent">Unto the earth surrenders all its spoils;</p></div><div class="stanza"><p>In similar wise the evil seed of Adam</p><p class="slindent">Throw themselves from that margin one by one,</p><p class="slindent">At signals, as a bird unto its lure.</p></div><div class="stanza"><p>So they depart across the dusky wave,</p><p class="slindent">And ere upon the other side they land,</p><p class="slindent">Again on this side a new troop assembles.</p></div><div class="stanza"><p>&ldquo;My son,&rdquo; the courteous Master said to me,</p><p class="slindent">&ldquo;All those who perish in the wrath of God</p><p class="slindent">Here meet together out of every land;</p></div><div class="stanza"><p>And ready are they to pass o&rsquo;er the river,</p><p class="slindent">Because celestial Justice spurs them on,</p><p class="slindent">So that their fear is turned into desire.</p></div><div class="stanza"><p>This way there never passes a good soul;</p><p class="slindent">And hence if Charon doth complain of thee,</p><p class="slindent">Well mayst thou know now what his speech imports.&rdquo;</p></div><div class="stanza"><p>This being finished, all the dusk champaign</p><p class="slindent">Trembled so violently, that of that terror</p><p class="slindent">The recollection bathes me still with sweat.</p></div><div class="stanza"><p>The land of tears gave forth a blast of wind,</p><p class="slindent">And fulminated a vermilion light,</p><p class="slindent">Which overmastered in me every sense,</p></div><div class="stanza"><p>And as a man whom sleep hath seized I fell.</p></div>'];

module.exports = longfellow;

},{}],8:[function(require,module,exports){
'use strict';

// norton.js

var norton = ['<p class="title">Hell</p><p class="author">Charles Eliot Norton</p>', '<p class="cantohead">CANTO I</p><p class="summary">Dante, astray in a wood, reaches the foot of a hill which he begins to ascend; he is hindered by three beasts; he turns back and is met by Virgil, who proposes to guide him into the eternal world.</p><p>Midway upon the road of our life I found myself within a dark wood, for the right way had been missed. Ah! how hard a thing it is to tell what this wild and rough and dense wood was, which in thought renews the fear! So bitter is it that death is little more. But in order to treat of the good that there I found, I will tell of the other things that I have seen there. I cannot well recount how I entered it, so full was I of slumber at that point where I abandoned the true way. But after I had arrived at the foot of a hill, where that valley ended which had pierced my heart with fear, I looked on high, and saw its shoulders clothed already with the rays of the planet<span class="note"><span class="noteno">1</span><span class="notetext">The sun, a planet according to the Ptolemaic system.</span></span> that leadeth men aright along every path. Then was the fear a little quieted which in the lake of my heart had lasted through the night that I passed so piteously. And even as one who with spent breath, issued out of the sea upon the shore, turns to the perilous water and gazes, so did my soul, which still was flying, turn back to look again upon the pass which never had a living person left.</p><p>After I had rested a little my weary body I took my way again along the desert slope, so that the firm foot was always the lower. And ho! almost at the beginning of the steep a she-leopard, light and very nimble, which was covered with a spotted coat. And she did not move from before my face, nay, rather hindered so my road that to return I oftentimes had turned.</p><p>The time was at the beginning of the morning, and the Sun was mounting upward with those stars that were with him when Love Divine first set in motion those beautiful things;<span class="note"><span class="noteno">1</span><span class="notetext">According to old tradition the spring was the season of the creation.</span></span> so that the hour of the time and the sweet season were occasion of good hope to me concerning that wild beast with the dappled skin. But not so that the sight which appeared to me of a lion did not give me fear. He seemed to be coming against me, with head high and with ravening hunger, so that it seemed that the air was affrighted at him. And a she-wolf,<span class="note"><span class="noteno">2</span><span class="notetext">These three beasts correspond to the triple division of sins into those of incontinence, of violence, and of fraud. See Canto XI.</span></span> who with all cravings seemed laden in her meagreness, and already had made many folk to live forlorn,&mdash;she caused me so much heaviness, with the fear that came from sight of her, that I lost hope of the height. And such as he is who gaineth willingly, and the time arrives that makes him lose, who in all his thoughts weeps and is sad,&mdash;such made me the beast without repose that, coming on against me, little by little was pushing me back thither where the Sun is silent.</p><p>While I was falling back to the low place, before mine eyes appeared one who through long silence seemed hoarse. When I saw him in the great desert, &ldquo;Have pity on me!&rdquo; I cried to him, &ldquo;whatso thou art, or shade or real man.&rdquo; He answered me: &ldquo;Not man; man once I was, and my parents were Lombards, and Mantuans by country both. I was born sub Julio, though late, and I lived at Rome under the good Augustus, in the time of the false and lying gods. Poet was I, and sang of that just son of Anchises who came from Troy after proud Ilion had been burned. But thou, why returnest thou to so great annoy? Why dost thou not ascend the delectable mountain which is the source and cause of every joy?&rdquo;</p><p>&ldquo;Art thou then that Virgil and that fount which poureth forth so large a stream of speech?&rdquo; replied I to him with bashful front: &ldquo;O honor and light of the other poem I may the long seal avail me, and the great love, which have made me search thy volume! Thou art my master and my author; thou alone art he from whom I took the fair style that hath done me honor. Behold the beast because of which I turned; help me against her, famous sage, for she makes any veins and pulses tremble.&rdquo; &ldquo;Thee it behoves to hold another course,&rdquo; he replied, when he saw me weeping, &ldquo;if thou wishest to escape from this savage place; for this beast, because of which thou criest out, lets not any one pass along her way, but so hinders him that she kills him! and she has a nature so malign and evil that she never sates her greedy will, and after food is hungrier than before. Many are the animals with which she wives, and there shall be more yet, till the hound<span class="note"><span class="noteno">1</span><span class="notetext">Of whom the hound is the symbol, and to whom Dante looked for the deliverance of Italy from the discorda and misrule that made her wretched, is still matter of doubt, after centuries of controversy.</span></span> shall come that will make her die of grief. He shall not feed on land or goods, but wisdom and love and valor, and his birthplace shall be between Feltro and Feltro. Of that humble<span class="note"><span class="noteno">2</span><span class="notetext">Fallen, humiliated.</span></span> Italy shall he be the salvation, for which the virgin Camilla died, and Euryalus, Turnus and Nisus of their wounds. He shall hunt her through every town till he shall have set her back in hell, there whence envy first sent her forth. Wherefore I think and deem it for thy best that thou follow me, and I will be thy guide, and will lead thee hence through the eternal place where thou shalt hear the despairing shrieks, shalt see the ancient spirits woeful who each proclaim the second death. And then thou shalt see those who are contented in the fire, because they hope to come, whenever it may be, to the blessed folk; to whom if thou wilt thereafter ascend, them shall be a soul more worthy than I for that. With her I will leave thee at my departure; for that Emperor who reigneth them above, because I was rebellious to His law, wills not that into His city any one should come through me. In all parts He governs and them He reigns: there in His city and His lofty seat. O happy he whom thereto He elects!&rdquo; And I to him, &ldquo;Poet, I beseech thee by that God whom thou didst not know, in order that I may escape this ill and worse, that thou lead me thither whom thou now hest said, so that I may see the gate of St. Peter, and those whom thou makest so afflicted.&rdquo;</p><p>Then he moved on, and I behind him kept.</p>', '<p class="cantohead">CANTO II</p><p class="summary">Dante, doubtful of his own powers, is discouraged at the outset.&mdash;Virgil cheers him by telling him that he has been sent to his aid by a blessed Spirit from Heaven.&mdash;Dante casts off fear, and the poets proceed.</p><p>The day was going, and the dusky air was taking the living things that are on earth from their fatigues, and I alone was preparing to sustain the war alike of the road, and of the woe which the mind that erreth not shall retrace. O Muses, O lofty genius, now assist me! O mind that didst inscribe that which I saw, here shall thy nobility appear! I began:&mdash;&ldquo;Poet, that guidest me, consider my virtue, if it is sufficient, ere to the deep pass thou trustest me. Thou sayest that the parent of Silvius while still corruptible went to the immortal world and was there in the body. Wherefore if the Adversary of every ill was then courteous, thinking on the high effect that should proceed from him, and on the Who and the What,<span class="note"><span class="noteno">1</span><span class="notetext">Who he was, and what should result.</span></span> it seemeth not unmeet to the man of understanding; for in the empyreal heaven he had been chosen for father of revered Rome and of her empire; both which (to say truth indeed) were ordained for the holy place where the successor of the greater Peter hath his seat. Through this going, whereof thou givest him vaunt, he learned things which were the cause of his victory and of the papal mantle. Afterward the Chosen Vessel went thither to bring thence comfort to that faith which is the beginning of the way of salvation. But I, why go I thither? or who concedes it? I am not Aeneas, I am not Paul; me worthy of this, neither I nor others think; wherefore if I give myself up to go, I fear lest the going may be mad. Thou art wise, thou understandest better than I speak.&rdquo;</p><p>And as is he who unwills what he willed, and because of new thoughts changes his design, so that he quite withdraws from beginning, such I became on that dark hillside: wherefore in my thought I abandoned the enterprise which had been so hasty in the beginning.</p><p>&ldquo;If I have rightly understood thy speech,&rdquo; replied that shade of the magnanimous one, &ldquo;thy soul is hurt by cowardice, which oftentimes encumbereth a man so that it turns him back from honorable enterprise, as false seeing does a beast when it is startled. In order that thou loose thee from this fear I will tell thee wherefore I have come, and what I heard at the first moment that I grieved for thee. I was among those who are suspended,<span class="note"><span class="noteno">1</span><span class="notetext">In Limbo, neither in Hell nor Heaven.</span></span> and a Lady called me, so blessed and beautiful that I besought her to command. Her eyes were more lucent than the star, and she began to speak to me sweet and low, with angelic voice, in her own tongue: &lsquo;O courteous Mantuan soul, of whom the fame yet lasteth in the world, and shall last so long as the world endureth! a friend of mine and not of fortune upon the desert hillside is so hindered on his road that he has turned for fear, and I am afraid, through that which I have heard of him in heaven, lest already he be so astray that I may have risen late to his succor. Now do thou move, and with thy speech ornate, and with whatever is needful for his deliverance, assist him so that I may be consoled for him. I am Beatrice who make thee go. I come from a place whither I desire to return. Love moved me, and makes me speak. When I shall be before my Lord, I will commend thee often unto Him.&rsquo; Then she was silent, and thereon I began: &lsquo;O Lady of Virtue, thou alone through whom the human race surpasseth all contained within that heaven which hath the smallest circles!<span class="note"><span class="noteno">2</span><span class="notetext">The heaven of the moon, nearest to the earth.</span></span> so pleasing unto me is thy command that to obey it, were it already done, were slow to me. Thou hast no need further to open unto me thy will; but tell me the cause why thou guardest not thyself from descending down here into this centre, from the ample place whither thou burnest to return.&lsquo; &rsquo;Since thou wishest to know so inwardly, I will tell thee briefly,&rsquo; she replied to me, &lsquo;wherefore I fear not to come here within. One ought to fear those things only that have power of doing harm, the others not, for they are not dreadful. I am made by God, thanks be to Him, such that your misery toucheth me not, nor doth the flame of this burning assail me. A gentle Lady<span class="note"><span class="noteno">3</span><span class="notetext">The Virgin.</span></span> is in heaven who hath pity for this hindrance whereto I send thee, so that stern judgment there above she breaketh. She summoned Lucia in her request, and said, &ldquo;Thy faithful one now hath need of thee, and unto thee I commend him.&rdquo; Lucia, the foe of every cruel one, rose and came to the place where I was, seated with the ancient Rachel. She said, &ldquo;Beatrice, true praise of God, why dost thou not succor him who so loved thee that for thee he came forth from the vulgar throng? Dost thou not hear the pity of his plaint? Dost thou not see the death that combats him beside the stream whereof the sea hath no vaunt?&rdquo; In the world never were persons swift to seek their good, and to fly their harm, as I, after these words were uttered, came here below, from my blessed seat, putting my trust in thy upright speech, which honors thee and them who have heard it.&rsquo; After she had said this to me, weeping she turned her lucent eyes, whereby she made me more speedy in coming. And I came to thee as she willed. Thee have I delivered from that wild beast that took from thee the short ascent of the beautiful mountain. What is it then? Why, why dost thou hold back? why dost thou harbor such cowardice in thy heart? why hast thou not daring and boldness, since three blessed Ladies care for thee in the court of Heaven, and my speech pledges thee such good?&rdquo;</p><p>As flowerets, bent and closed by the chill of night, after the sun shines on them straighten themselves all open on their stem, so I became with my weak virtue, and such good daring hastened to my heart that I began like one enfranchised: &ldquo;Oh compassionate she who succored me! and thou courteous who didst speedily obey the true words that she addressed to thee! Thou by thy words hast so disposed my heart with desire of going, that I have returned unto my first intent. Go on now, for one sole will is in us both: Thou Leader, thou Lord, and thou Master.&rdquo; Thus I said to him; and when he had moved on, I entered along the deep and savage road.</p>', '<p class="cantohead">CANTO III</p><p class="summary">The gate of Hell.&mdash;Virgil lends Dante in.&mdash;The punishment of the neither good nor bad.&mdash;Acheron, and the sinners on its bank.&mdash;Charon.&mdash;Earthquake.&mdash;Dante swoons.</p><p>&ldquo;Through me is the way into the woeful city; through me is the way into eternal woe; through me is the way among the lost people. Justice moved my lofty maker: the divine Power, the supreme Wisdom and the primal Love made me. Before me were no things created, unless eternal, and I eternal last. Leave every hope, ye who enter!&rdquo;</p><p>These words of color obscure I saw written at the top of a gate; whereat I, &ldquo;Master, their meaning is dire to me.&rdquo;</p><p>And he to me, like one who knew, &ldquo;Here it behoves to leave every fear; it behoves that all cowardice should here be dead. We have come to the place where I have told thee that thou shalt see the woeful people, who have lost the good of the understanding.&rdquo;</p><p>And when he had put his hand on mine, with a glad countenance, wherefrom I took courage, he brought me within the secret things. Here sighs, laments, and deep wailings were resounding though the starless air; wherefore at first I wept thereat. Strange tongues, horrible cries, words of woe, accents of anger, voices high and hoarse, and sounds of hands with them, were making a tumult which whirls forever in that air dark without change, like the sand when the whirlwind breathes.</p><p>And I, who had my head girt with horror, said, &ldquo;Master, what is it that I hear? and what folk are they who seem in woe so vanquished?&rdquo;</p><p>And he to me, &ldquo;This miserable measure the wretched souls maintain of those who lived without infamy and without praise. Mingled are they with that caitiff choir of the angels, who were not rebels, nor were faithful to God, but were for themselves. The heavens chased them out in order to be not less beautiful, nor doth the depth of Hell receive them, because the damned would have some glory from them.&rdquo;</p><p>And I, &ldquo;Master, what is so grievous to them, that makes them lament so bitterly?&rdquo;</p><p>He answered, &ldquo;I will tell thee very briefly. These have no hope of death; and their blind life is so debased, that they are envious of every other lot. Fame of them the world permitteth not to be; mercy and justice disdain them. Let us not speak of them, but do thou look and pass on.&rdquo;</p><p>And I, who was gazing, saw a banner, that whirling ran so swiftly that it seemed to me to scorn all repose, and behind it came so long a train of folk, that I could never have believed death had undone so many. After I had distinguished some among them, I saw and knew the shade of him who made, through cowardice, the great refusal. <span class="note"><span class="noteno">1</span><span class="notetext">Who is intended by these words is uncertain.</span></span> At once I understood and was certain, that this was the sect of the caitiffs displeasing unto God, and unto his enemies. These wretches, who never were alive, were naked, and much stung by gad-flies and by wasps that were there. These streaked their faces with blood, which, mingled with tears, was harvested at their feet by loathsome worms.</p><p>And when I gave myself to looking onward, I saw people on the bank of a great river; wherefore I said, &ldquo;Master, now grant to me that I may know who these are, and what rule makes them appear so ready to pass over, as I discern through the faint light.&rdquo; And he to me, &ldquo;The things will be clear to thee, when we shall set our steps on the sad marge of Acheron.&rdquo; Then with eyes bashful and cast down, fearing lest my speech had been irksome to him, far as to the river I refrained from speaking.</p><p>And lo! coming toward us in a boat, an old man, white with ancient hair, crying, &ldquo;Woe to you, wicked souls! hope not ever to see Heaven! I come to carry you to the other bank, into eternal darkness, to heat and frost. And thou who art there, living soul, depart from these that are dead.&rdquo; But when he saw that I did not depart, he said, &ldquo;By another way, by other ports thou shalt come to the shore, not here, for passage; it behoves that a lighter bark bear thee.&rdquo;<span class="note"><span class="noteno">1</span><span class="notetext">The boat that bears the souls to Purgatory. Charon recognizes that Dante is not among the damned.</span></span></p><p>And my Leader to him, &ldquo;Charon, vex not thyself, it is thus willed there where is power to do that which is willed; and farther ask not.&rdquo; Then the fleecy cheeks were quiet of the pilot of the livid marsh, who round about his eyes had wheels of flame.</p><p>But those souls, who were weary and naked, changed color, and gnashed their teeth soon as they heard his cruel words. They blasphemed God and their parents, the human race, the place, the time and the seed of their sowing and of their birth. Then, bitterly weeping, they drew back all of them together to the evil bank, that waits for every man who fears not God. Charon the demon, with eyes of glowing coal, beckoning them, collects them all; he beats with his oar whoever lingers.</p><p>As in autumn the leaves fall off one after the other, till the bough sees all its spoils upon the earth, in like wise the evil seed of Adam throw themselves from that shore one by one at signals, as the bird at his call. Thus they go over the dusky wave, and before they have landed on the farther side, already on this a new throng is gathered.</p><p>&ldquo;My son,&rdquo; said the courteous Master, &ldquo;those who die in the wrath of God, all meet together here from every land. And they are eager to pass over the stream, for the divine justice spurs them, so that fear is turned to desire. This way a good soul never passes; and therefore if Charon snarleth at thee, thou now mayest well know what his speech signifies.&rdquo; This ended, the dark plain trembled so mightily, that the memory of the terror even now bathes me with sweat. The tearful land gave forth a wind that flashed a vermilion light which vanquished every sense of mine, and I fell as a man whom slumber seizes.</p>'];

module.exports = norton;

},{}],9:[function(require,module,exports){
'use strict';

// wright.js

var wright = ['<p class="title">Inferno</p><p class="author">S. Fowler Wright</p>', '<p class="cantohead">Canto I</p><div class="stanza"><p>ONE night, when half my life behind me lay,</p><p>I wandered from the straight lost path afar.</p><p>Through the great dark was no releasing way;</p><p>Above that dark was no relieving star.</p><p>If yet that terrored night I think or say,</p><p>As death&rsquo;s cold hands its fears resuming are.</p></div><div class="stanza"><p>Gladly the dreads I felt, too dire to tell,</p><p>The hopeless, pathless, lightless hours forgot,</p><p>I turn my tale to that which next befell,</p><p>When the dawn opened, and the night was not.</p><p>The hollowed blackness of that waste, God wot,</p><p>Shrank, thinned, and ceased. A blinding splendour hot</p><p>Flushed the great height toward which my footsteps fell,</p><p>And though it kindled from the nether hell,</p><p>Or from the Star that all men leads, alike</p><p>It showed me where the great dawn-glories strike</p><p>The wide east, and the utmost peaks of snow.</p></div><div class="stanza"><p>How first I entered on that path astray,</p><p>Beset with sleep, I know not. This I know.</p><p>When gained my feet the upward, lighted way,</p><p>I backward gazed, as one the drowning sea,</p><p>The deep strong tides, has baffled, and panting lies,</p><p>On the shelved shore, and turns his eyes to see</p><p>The league-wide wastes that held him. So mine eyes</p><p>Surveyed that fear, the while my wearied frame</p><p>Rested, and ever my heart&rsquo;s tossed lake became</p><p>More quiet.</p><p>Then from that pass released, which yet</p><p>With living feet had no man left, I set</p><p>My forward steps aslant the steep, that so,</p><p>My right foot still the lower, I climbed.</p><p class="slindent8em">Below</p><p>No more I gazed. Around, a slope of sand</p><p>Was sterile of all growth on either hand,</p><p>Or moving life, a spotted pard except,</p><p>That yawning rose, and stretched, and purred and leapt</p><p>So closely round my feet, that scarce I kept</p><p>The course I would.</p><p class="slindent4em">That sleek and lovely thing,</p><p>The broadening light, the breath of morn and spring,</p><p>The sun, that with his stars in Aries lay,</p><p>As when Divine Love on Creation&rsquo;s day</p><p>First gave these fair things motion, all at one</p><p>Made lightsome hope; but lightsome hope was none</p><p>When down the slope there came with lifted head</p><p>And back-blown mane and caverned mouth and red,</p><p>A lion, roaring, all the air ashake</p><p>That heard his hunger. Upward flight to take</p><p>No heart was mine, for where the further way</p><p>Mine anxious eyes explored, a she-wolf lay,</p><p>That licked lean flanks, and waited. Such was she</p><p>In aspect ruthless that I quaked to see,</p><p>And where she lay among her bones had brought</p><p>So many to grief before, that all my thought</p><p>Aghast turned backward to the sunless night</p><p>I left. But while I plunged in headlong flight</p><p>To that most feared before, a shade, or man</p><p>(Either he seemed), obstructing where I ran,</p><p>Called to me with a voice that few should know,</p><p>Faint from forgetful silence, &ldquo;Where ye go,</p><p>Take heed. Why turn ye from the upward way?&rdquo;</p></div><div class="stanza"><p>I cried, &ldquo;Or come ye from warm earth, or they</p><p>The grave hath taken, in my mortal need</p><p>Have mercy thou!&rdquo;</p><p class="slindent4em">He answered, &ldquo;Shade am I,</p><p>That once was man; beneath the Lombard sky,</p><p>In the late years of Julius born, and bred</p><p>In Mantua, till my youthful steps were led</p><p>To Rome, where yet the false gods lied to man;</p><p>And when the great Augustan age began,</p><p>I wrote the tale of Ilium burnt, and how</p><p>Anchises&rsquo; son forth-pushed a venturous prow,</p><p>Seeking unknown seas. But in what mood art thou</p><p>To thus return to all the ills ye fled,</p><p>The while the mountain of thy hope ahead</p><p>Lifts into light, the source and cause of all</p><p>Delectable things that may to man befall?&rdquo;</p></div><div class="stanza"><p>I answered, &ldquo;Art thou then that Virgil, he</p><p>From whom all grace of measured speech in me</p><p>Derived? O glorious and far-guiding star!</p><p>Now may the love-led studious hours and long</p><p>In which I learnt how rich thy wonders are,</p><p>Master and Author mine of Light and Song,</p><p>Befriend me now, who knew thy voice, that few</p><p>Yet hearken. All the name my work hath won</p><p>Is thine of right, from whom I learned. To thee,</p><p>Abashed, I grant it. . . Why the mounting sun</p><p>No more I seek, ye scarce should ask, who see</p><p>The beast that turned me, nor faint hope have I</p><p>To force that passage if thine aid deny.&ldquo;</p><p>He answered, &ldquo;Would ye leave this wild and live,</p><p>Strange road is ours, for where the she-wolf lies</p><p>Shall no man pass, except the path he tries</p><p>Her craft entangle. No way fugitive</p><p>Avoids the seeking of her greeds, that give</p><p>Insatiate hunger, and such vice perverse</p><p>As makes her leaner while she feeds, and worse</p><p>Her craving. And the beasts with which she breed</p><p>The noisome numerous beasts her lusts require,</p><p>Bare all the desirable lands in which she feeds;</p><p>Nor shall lewd feasts and lewder matings tire</p><p>Until she woos, in evil hour for her,</p><p>The wolfhound that shall rend her. His desire</p><p>Is not for rapine, as the promptings stir</p><p>Of her base heart; but wisdoms, and devoirs</p><p>Of manhood, and love&rsquo;s rule, his thoughts prefer.</p><p>The Italian lowlands he shall reach and save,</p><p>For which Camilla of old, the virgin brave,</p><p>Turnus and Nisus died in strife. His chase</p><p>He shall not cease, nor any cowering-place</p><p>Her fear shall find her, till he drive her back,</p><p>From city to city exiled, from wrack to wrack</p><p>Slain out of life, to find the native hell</p><p>Whence envy loosed her.</p><p class="slindent6em">For thyself were well</p><p>To follow where I lead, and thou shalt see</p><p>The spirits in pain, and hear the hopeless woe,</p><p>The unending cries, of those whose only plea</p><p>Is judgment, that the second death to be</p><p>Fall quickly. Further shalt thou climb, and go</p><p>To those who burn, but in their pain content</p><p>With hope of pardon; still beyond, more high,</p><p>Holier than opens to such souls as I,</p><p>The Heavens uprear; but if thou wilt, is one</p><p>Worthier, and she shall guide thee there, where none</p><p>Who did the Lord of those fair realms deny</p><p>May enter. There in his city He dwells, and there</p><p>Rules and pervades in every part, and calls</p><p>His chosen ever within the sacred walls.</p><p>O happiest, they!&rdquo;</p><p class="slindent4em">I answered, &ldquo;By that God</p><p>Thou didst not know, I do thine aid entreat,</p><p>And guidance, that beyond the ills I meet</p><p>I safety find, within the Sacred Gate</p><p>That Peter guards, and those sad souls to see</p><p>Who look with longing for their end to be.&rdquo;</p></div><div class="stanza"><p>Then he moved forward, and behind I trod.</p></div>', '<div class="canto"><p class="cantohead">Canto II</p></p><p><div class="stanza">THE day was falling, and the darkening air</p><p>Released earth&rsquo;s creatures from their toils, while I,</p><p>I only, faced the bitter road and bare</p><p>My Master led. I only, must defy</p><p>The powers of pity, and the night to be.</p><p>So thought I, but the things I came to see,</p><p>Which memory holds, could never thought forecast.</p><p>O Muses high! O Genius, first and last!</p><p>Memories intense! Your utmost powers combine</p><p>To meet this need. For never theme as mine</p><p>Strained vainly, where your loftiest nobleness</p><p>Must fail to be sufficient.</p><p class="slindent10em">First I said,</p><p>Fearing, to him who through the darkness led,</p><p>&ldquo;O poet, ere the arduous path ye press</p><p>Too far, look in me, if the worth there be</p><p>To make this transit. &AElig;neas once, I know,</p><p>Went down in life, and crossed the infernal sea;</p><p>And if the Lord of All Things Lost Below</p><p>Allowed it, reason seems, to those who see</p><p>The enduring greatness of his destiny,</p><p>Who in the Empyrean Heaven elect was called</p><p>Sire of the Eternal City, that throned and walled</p><p>Made Empire of the world beyond, to be</p><p>The Holy Place at last, by God&rsquo;s decree,</p><p>Where the great Peter&rsquo;s follower rules. For he</p><p>Learned there the causes of his victory.</p></div><div class="stanza"><p>&ldquo;And later to the third great Heaven was caught</p><p>The last Apostle, and thence returning brought</p><p>The proofs of our salvation. But, for me,</p><p>I am not &AElig;neas, nay, nor Paul, to see</p><p>Unspeakable things that depths or heights can show,</p><p>And if this road for no sure end I go</p><p>What folly is mine? But any words are weak.</p><p>Thy wisdom further than the things I speak</p><p>Can search the event that would be.&rdquo;</p><p class="slindent10em">Here I stayed</p><p>My steps amid the darkness, and the Shade</p><p>That led me heard and turned, magnanimous,</p><p>And saw me drained of purpose halting thus,</p><p>And answered, &ldquo;If thy coward-born thoughts be clear,</p><p>And all thy once intent, infirmed of fear,</p><p>Broken, then art thou as scared beasts that shy</p><p>From shadows, surely that they know not why</p><p>Nor wherefore. . . Hearken, to confound thy fear,</p><p>The things which first I heard, and brought me here.</p><p>One came where, in the Outer Place, I dwell,</p><p>Suspense from hope of Heaven or fear of Hell,</p><p>Radiant in light that native round her clung,</p><p>And cast her eyes our hopeless Shades among</p><p>(Eyes with no earthly like but heaven&rsquo;s own blue),</p><p>And called me to her in such voice as few</p><p>In that grim place had heard, so low, so clear,</p><p>So toned and cadenced from the Utmost Sphere,</p><p>The Unattainable Heaven from which she came.</p><p>&lsquo;O Mantuan Spirit,&rsquo; she said, &lsquo;whose lasting fame</p><p>Continues on the earth ye left, and still</p><p>With Time shall stand, an earthly friend to me,</p><p>- My friend, not fortune&rsquo;s&nbsp;&ndash; climbs a path so ill</p><p>That all the night-bred fears he hastes to flee</p><p>Were kindly to the thing he nears. The tale</p><p>Moved through the peace of I leaven, and swift I sped</p><p>Downward, to aid my friend in love&rsquo;s avail,</p><p>With scanty time therefor, that half I dread</p><p>Too late I came. But thou shalt haste, and go</p><p>With golden wisdom of thy speech, that so</p><p>For me be consolation. Thou shalt say,</p><p>&ldquo;I come from Beatricë.&rdquo; Downward far,</p><p>From Heaven to I leaven I sank, from star to star,</p><p>To find thee, and to point his rescuing way.</p><p>Fain would I to my place of light return;</p><p>Love moved me from it, and gave me power to learn</p><p>Thy speech. When next before my Lord I stand</p><p>I very oft shall praise thee.&rsquo;</p><p class="slindent10em">Here she ceased,</p><p>And I gave answer to that dear command,</p><p>&lsquo;Lady, alone through whom the whole race of those</p><p>The smallest Heaven the moon&rsquo;s short orbits hold</p><p>Excels in its creation, not thy least,</p><p>Thy lightest wish in this dark realm were told</p><p>Vainly. But show me why the Heavens unclose</p><p>To loose thee from them, and thyself content</p><p>Couldst thus continue in such strange descent</p><p>From that most Spacious Place for which ye burn,</p><p>And while ye further left, would fain return.&rsquo;</p></div><div class="stanza"><p>&ldquo; &lsquo;That which thou wouldst,&rsquo; she said, &lsquo;I briefly tell.</p><p>There is no fear nor any hurt in Hell,</p><p>Except that it be powerful. God in me</p><p>Is gracious, that the piteous sights I see</p><p>I share not, nor myself can shrink to feel</p><p>The flame of all this burning. One there is</p><p>In height among the Holiest placed, and she</p><p>- Mercy her name&nbsp;&ndash; among God&rsquo;s mysteries</p><p>Dwells in the midst, and hath the power to see</p><p>His judgments, and to break them. This sharp</p><p>I tell thee, when she saw, she called, that so</p><p>Leaned Lucia toward her while she spake&nbsp;&ndash; and said,</p><p>&ldquo;One that is faithful to thy name is sped,</p><p>Except that now ye aid him.&rdquo; She thereat,</p><p>- Lucia, to all men&rsquo;s wrongs inimical -</p><p>Left her High Place, and crossed to where I sat</p><p>In speech with Rachel (of the first of all</p><p>God saved). &ldquo;O Beatrice, Praise of God,&rdquo;</p><p>- So said she to me&nbsp;&ndash; &ldquo;sitt&rsquo;st thou here so slow</p><p>To aid him, once on earth that loved thee so</p><p>That all he left to serve thee? Hear&rsquo;st thou not</p><p>The anguish of his plaint? and dost not see,</p><p>By that dark stream that never seeks a sea,</p><p>The death that threats him?&rdquo;</p><p class="slindent8em">None, as thus she said,</p><p>None ever was swift on earth his good to chase,</p><p>None ever on earth was swift to leave his dread,</p><p>As came I downward from that sacred place</p><p>To find thee and invoke thee, confident</p><p>Not vainly for his need the gold were spent</p><p>Of thy word-wisdom.&rsquo; Here she turned away,</p><p>Her bright eyes clouded with their tears, and I,</p><p>Who saw them, therefore made more haste to reach</p><p>The place she told, and found thee. Canst thou say</p><p>I failed thy rescue? Is the beast anigh</p><p>From which ye quailed? When such dear saints beseech</p><p>- Three from the Highest&nbsp;&ndash; that Heaven thy course allow</p><p>Why halt ye fearful? In such guards as thou</p><p>The faintest-hearted might be bold.&rdquo;</p><p class="slindent14em">As flowers,</p><p>Close-folded through the cold and lightless hours,</p><p>Their bended stems erect, and opening fair</p><p>Accept the white light and the warmer air</p><p>Of morning, so my fainting heart anew</p><p>Lifted, that heard his comfort. Swift I spake,</p><p>&ldquo;O courteous thou, and she compassionate!</p><p>Thy haste that saved me, and her warning true,</p><p>Beyond my worth exalt me. Thine I make</p><p>My will. In concord of one mind from now,</p><p>O Master and my Guide, where leadest thou</p><p>I follow.&rdquo;</p><p class="slindent2em">And we, with no more words&rsquo; delay,</p><p>Went forward on that hard and dreadful way.</p></div>', '<p class="cantohead">Canto III</p></p><p><div class="stanza">THE gateway to the city of Doom. Through me</p><p>The entrance to the Everlasting Pain.</p><p>The Gateway of the Lost. The Eternal Three</p><p>Justice impelled to build me. Here ye see</p><p>Wisdom Supreme at work, and Primal Power,</p><p>And Love Supernal in their dawnless day.</p><p>Ere from their thought creation rose in flower</p><p>Eternal first were all things fixed as they.</p><p>Of Increate Power infinite formed am I</p><p>That deathless as themselves I do not die.</p><p>Justice divine has weighed: the doom is clear.</p><p>All hope renounce, ye lost, who enter here.</p><p>This scroll in gloom above the gate I read,</p><p>And found it fearful. &ldquo;Master, hard,&rdquo; I said,</p><p>&ldquo;This saying to me." And he, as one that long</p><p>Was customed, answered, &ldquo;No distrust must wrong</p><p>Its Maker, nor thy cowarder mood resume</p><p>If here ye enter. This the place of doom</p><p>I told thee, where the lost in darkness dwell.</p><p>Here, by themselves divorced from light, they fell,</p><p>And are as ye shall see them.&rdquo; Here he lent</p><p>A hand to draw me through the gate, and bent</p><p>A glance upon my fear so confident</p><p>That I, too nearly to my former dread</p><p>Returned, through all my heart was comforted,</p><p>And downward to the secret things we went.</p></div><div class="stanza"><p>Downward to night, but not of moon and cloud,</p><p>Not night with all its stars, as night we know,</p><p>But burdened with an ocean-weight of woe</p><p>The darkness closed us.</p><p class="slindent6em">Sighs, and wailings loud,</p><p>Outcries perpetual of recruited pain,</p><p>Sounds of strange tongues, and angers that remain</p><p>Vengeless for ever, the thick and clamorous crowd</p><p>Of discords pressed, that needs I wept to hear,</p><p>First hearing. There, with reach of hands anear,</p><p>And voices passion-hoarse, or shrilled with fright,</p><p>The tumult of the everlasting night,</p><p>As sand that dances in continual wind,</p><p>Turns on itself for ever.</p><p class="slindent8em">And I, my head</p><p>Begirt with movements, and my ears bedinned</p><p>With outcries round me, to my leader said,</p><p>&ldquo;Master, what hear I? Who so overborne</p><p>With woes are these?&rdquo;</p><p class="slindent6em">He answered, &ldquo;These be they</p><p>That praiseless lived and blameless. Now the scorn</p><p>Of Height and Depth alike, abortions drear;</p><p>Cast with those abject angels whose delay</p><p>To join rebellion, or their Lord defend,</p><p>Waiting their proved advantage, flung them here. -</p><p>Chased forth from Heaven, lest else its beauties end</p><p>The pure perfection of their stainless claim,</p><p>Out-herded from the shining gate they came,</p><p>Where the deep hells refused them, lest the lost</p><p>Boast something baser than themselves.&rdquo;</p><p class="slindent14em">And I,</p><p>&ldquo;Master, what grievance hath their failure cost,</p><p>That through the lamentable dark they cry?&rdquo;</p></div><div class="stanza"><p>He answered, &ldquo;Briefly at a thing not worth</p><p>We glance, and pass forgetful. Hope in death</p><p>They have not. Memory of them on the earth</p><p>Where once they lived remains not. Nor the breath</p><p>Of Justice shall condemn, nor Mercy plead,</p><p>But all alike disdain them. That they know</p><p>Themselves so mean beneath aught else constrains</p><p>The envious outcries that too long ye heed.</p><p>Move past, but speak not.&rdquo;</p><p class="slindent8em">Then I looked, and lo,</p><p>Were souls in ceaseless and unnumbered trains</p><p>That past me whirled unending, vainly led</p><p>Nowhither, in useless and unpausing haste.</p><p>A fluttering ensign all their guide, they chased</p><p>Themselves for ever. I had not thought the dead,</p><p>The whole world&rsquo;s dead, so many as these. I saw</p><p>The shadow of him elect to Peter&rsquo;s seat</p><p>Who made the great refusal, and the law,</p><p>The unswerving law that left them this retreat</p><p>To seal the abortion of their lives, became</p><p>Illumined to me, and themselves I knew,</p><p>To God and all his foes the futile crew</p><p>How hateful in their everlasting shame.</p></div><div class="stanza"><p>I saw these victims of continued death</p><p>- For lived they never&nbsp;&ndash; were naked all, and loud</p><p>Around them closed a never-ceasing cloud</p><p>Of hornets and great wasps, that buzzed and clung,</p><p>- Weak pain for weaklings meet,&nbsp;&ndash; and where they stung,</p><p>Blood from their faces streamed, with sobbing breath,</p><p>And all the ground beneath with tears and blood</p><p>Was drenched, and crawling in that loathsome mud</p><p>There were great worms that drank it.</p><p class="slindent10em">Gladly thence</p><p>I gazed far forward. Dark and wide the flood</p><p>That flowed before us. On the nearer shore</p><p>Were people waiting. &ldquo;Master, show me whence</p><p>These came, and who they be, and passing hence</p><p>Where go they? Wherefore wait they there content,</p><p>- The faint light shows it,&nbsp;&ndash; for their transit o&rsquo;er</p><p>The unbridged abyss?&rdquo;</p><p class="slindent6em">He answered, &ldquo;When we stand</p><p>Together, waiting on the joyless strand,</p><p>In all it shall be told thee.&rdquo; If he meant</p><p>Reproof I know not, but with shame I bent</p><p>My downward eyes, and no more spake until</p><p>The bank we reached, and on the stream beheld</p><p>A bark ply toward us.</p><p class="slindent8em">Of exceeding eld,</p><p>And hoary showed the steersman, screaming shrill,</p><p>With horrid glee the while he neared us, &ldquo;Woe</p><p>To ye, depraved!&nbsp;&ndash; Is here no Heaven, but ill</p><p>The place where I shall herd ye. Ice and fire</p><p>And darkness are the wages of their hire</p><p>Who serve unceasing here&nbsp;&ndash; But thou that there</p><p>Dost wait though live, depart ye. Yea, forbear!</p><p>A different passage and a lighter fare</p><p>Is destined thine.&rdquo;</p><p class="slindent6em">But here my guide replied,</p><p>&ldquo;Nay, Charon, cease; or to thy grief ye chide.</p><p>It There is willed, where that is willed shall be,</p><p>That ye shall pass him to the further side,</p><p>Nor question more.&rdquo;</p><p class="slindent6em">The fleecy cheeks thereat,</p><p>Blown with fierce speech before, were drawn and flat,</p><p>And his flame-circled eyes subdued, to hear</p><p>That mandate given. But those of whom he spake</p><p>In bitter glee, with naked limbs ashake,</p><p>And chattering teeth received it. Seemed that then</p><p>They first were conscious where they came, and fear</p><p>Abject and frightful shook them; curses burst</p><p>In clamorous discords forth; the race of men,</p><p>Their parents, and their God, the place, the time,</p><p>Of their conceptions and their births, accursed</p><p>Alike they called, blaspheming Heaven. But yet</p><p>Slow steps toward the waiting bark they set,</p><p>With terrible wailing while they moved. And so</p><p>They came reluctant to the shore of woe</p><p>That waits for all who fear not God, and not</p><p>Them only.</p><p class="slindent4em">Then the demon Charon rose</p><p>To herd them in, with eyes that furnace-hot</p><p>Glowed at the task, and lifted oar to smite</p><p>Who lingered.</p><p class="slindent4em">As the leaves, when autumn shows,</p><p>One after one descending, leave the bough,</p><p>Or doves come downward to the call, so now</p><p>The evil seed of Adam to endless night,</p><p>As Charon signalled, from the shore&rsquo;s bleak height,</p><p>Cast themselves downward to the bark. The brown</p><p>And bitter flood received them, and while they passed</p><p>Were others gathering, patient as the last,</p><p>Not conscious of their nearing doom.</p><p class="slindent14em">&ldquo;My son,&rdquo;</p><p>- Replied my guide the unspoken thought&nbsp;&ndash; &ldquo;is none</p><p>Beneath God&rsquo;s wrath who dies in field or town,</p><p>Or earth&rsquo;s wide space, or whom the waters drown,</p><p>But here he cometh at last, and that so spurred</p><p>By Justice, that his fear, as those ye heard,</p><p>Impels him forward like desire. Is not</p><p>One spirit of all to reach the fatal spot</p><p>That God&rsquo;s love holdeth, and hence, if Char</p><p>chide,</p><p>Ye well may take it.&nbsp;&ndash; Raise thy heart, for now,</p><p>Constrained of Heaven, he must thy course allow."</p></div><div class="stanza"><p>Yet how I passed I know not. For the ground</p><p>Trembled that heard him, and a fearful sound</p><p>Of issuing wind arose, and blood-red light</p><p>Broke from beneath our feet, and sense and sight</p><p>Left me. The memory with cold sweat once more</p><p>Reminds me of the sudden-crimsoned night,</p><p>As sank I senseless by the dreadful shore.</p></div>'];

module.exports = wright;

},{}],10:[function(require,module,exports){
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

},{}],11:[function(require,module,exports){
/*! Hammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
(function(window, document, exportName, undefined) {
  'use strict';

var VENDOR_PREFIXES = ['', 'webkit', 'Moz', 'MS', 'ms', 'o'];
var TEST_ELEMENT = document.createElement('div');

var TYPE_FUNCTION = 'function';

var round = Math.round;
var abs = Math.abs;
var now = Date.now;

/**
 * set a timeout with a given scope
 * @param {Function} fn
 * @param {Number} timeout
 * @param {Object} context
 * @returns {number}
 */
function setTimeoutContext(fn, timeout, context) {
    return setTimeout(bindFn(fn, context), timeout);
}

/**
 * if the argument is an array, we want to execute the fn on each entry
 * if it aint an array we don't want to do a thing.
 * this is used by all the methods that accept a single and array argument.
 * @param {*|Array} arg
 * @param {String} fn
 * @param {Object} [context]
 * @returns {Boolean}
 */
function invokeArrayArg(arg, fn, context) {
    if (Array.isArray(arg)) {
        each(arg, context[fn], context);
        return true;
    }
    return false;
}

/**
 * walk objects and arrays
 * @param {Object} obj
 * @param {Function} iterator
 * @param {Object} context
 */
function each(obj, iterator, context) {
    var i;

    if (!obj) {
        return;
    }

    if (obj.forEach) {
        obj.forEach(iterator, context);
    } else if (obj.length !== undefined) {
        i = 0;
        while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
        }
    } else {
        for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
        }
    }
}

/**
 * wrap a method with a deprecation warning and stack trace
 * @param {Function} method
 * @param {String} name
 * @param {String} message
 * @returns {Function} A new function wrapping the supplied method.
 */
function deprecate(method, name, message) {
    var deprecationMessage = 'DEPRECATED METHOD: ' + name + '\n' + message + ' AT \n';
    return function() {
        var e = new Error('get-stack-trace');
        var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@') : 'Unknown Stack Trace';

        var log = window.console && (window.console.warn || window.console.log);
        if (log) {
            log.call(window.console, deprecationMessage, stack);
        }
        return method.apply(this, arguments);
    };
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} target
 * @param {...Object} objects_to_assign
 * @returns {Object} target
 */
var assign;
if (typeof Object.assign !== 'function') {
    assign = function assign(target) {
        if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined && source !== null) {
                for (var nextKey in source) {
                    if (source.hasOwnProperty(nextKey)) {
                        output[nextKey] = source[nextKey];
                    }
                }
            }
        }
        return output;
    };
} else {
    assign = Object.assign;
}

/**
 * extend object.
 * means that properties in dest will be overwritten by the ones in src.
 * @param {Object} dest
 * @param {Object} src
 * @param {Boolean} [merge=false]
 * @returns {Object} dest
 */
var extend = deprecate(function extend(dest, src, merge) {
    var keys = Object.keys(src);
    var i = 0;
    while (i < keys.length) {
        if (!merge || (merge && dest[keys[i]] === undefined)) {
            dest[keys[i]] = src[keys[i]];
        }
        i++;
    }
    return dest;
}, 'extend', 'Use `assign`.');

/**
 * merge the values from src in the dest.
 * means that properties that exist in dest will not be overwritten by src
 * @param {Object} dest
 * @param {Object} src
 * @returns {Object} dest
 */
var merge = deprecate(function merge(dest, src) {
    return extend(dest, src, true);
}, 'merge', 'Use `assign`.');

/**
 * simple class inheritance
 * @param {Function} child
 * @param {Function} base
 * @param {Object} [properties]
 */
function inherit(child, base, properties) {
    var baseP = base.prototype,
        childP;

    childP = child.prototype = Object.create(baseP);
    childP.constructor = child;
    childP._super = baseP;

    if (properties) {
        assign(childP, properties);
    }
}

/**
 * simple function bind
 * @param {Function} fn
 * @param {Object} context
 * @returns {Function}
 */
function bindFn(fn, context) {
    return function boundFn() {
        return fn.apply(context, arguments);
    };
}

/**
 * let a boolean value also be a function that must return a boolean
 * this first item in args will be used as the context
 * @param {Boolean|Function} val
 * @param {Array} [args]
 * @returns {Boolean}
 */
function boolOrFn(val, args) {
    if (typeof val == TYPE_FUNCTION) {
        return val.apply(args ? args[0] || undefined : undefined, args);
    }
    return val;
}

/**
 * use the val2 when val1 is undefined
 * @param {*} val1
 * @param {*} val2
 * @returns {*}
 */
function ifUndefined(val1, val2) {
    return (val1 === undefined) ? val2 : val1;
}

/**
 * addEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function addEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.addEventListener(type, handler, false);
    });
}

/**
 * removeEventListener with multiple events at once
 * @param {EventTarget} target
 * @param {String} types
 * @param {Function} handler
 */
function removeEventListeners(target, types, handler) {
    each(splitStr(types), function(type) {
        target.removeEventListener(type, handler, false);
    });
}

/**
 * find if a node is in the given parent
 * @method hasParent
 * @param {HTMLElement} node
 * @param {HTMLElement} parent
 * @return {Boolean} found
 */
function hasParent(node, parent) {
    while (node) {
        if (node == parent) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
}

/**
 * small indexOf wrapper
 * @param {String} str
 * @param {String} find
 * @returns {Boolean} found
 */
function inStr(str, find) {
    return str.indexOf(find) > -1;
}

/**
 * split string on whitespace
 * @param {String} str
 * @returns {Array} words
 */
function splitStr(str) {
    return str.trim().split(/\s+/g);
}

/**
 * find if a array contains the object using indexOf or a simple polyFill
 * @param {Array} src
 * @param {String} find
 * @param {String} [findByKey]
 * @return {Boolean|Number} false when not found, or the index
 */
function inArray(src, find, findByKey) {
    if (src.indexOf && !findByKey) {
        return src.indexOf(find);
    } else {
        var i = 0;
        while (i < src.length) {
            if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
                return i;
            }
            i++;
        }
        return -1;
    }
}

/**
 * convert array-like objects to real arrays
 * @param {Object} obj
 * @returns {Array}
 */
function toArray(obj) {
    return Array.prototype.slice.call(obj, 0);
}

/**
 * unique array with objects based on a key (like 'id') or just by the array's value
 * @param {Array} src [{id:1},{id:2},{id:1}]
 * @param {String} [key]
 * @param {Boolean} [sort=False]
 * @returns {Array} [{id:1},{id:2}]
 */
function uniqueArray(src, key, sort) {
    var results = [];
    var values = [];
    var i = 0;

    while (i < src.length) {
        var val = key ? src[i][key] : src[i];
        if (inArray(values, val) < 0) {
            results.push(src[i]);
        }
        values[i] = val;
        i++;
    }

    if (sort) {
        if (!key) {
            results = results.sort();
        } else {
            results = results.sort(function sortUniqueArray(a, b) {
                return a[key] > b[key];
            });
        }
    }

    return results;
}

/**
 * get the prefixed property
 * @param {Object} obj
 * @param {String} property
 * @returns {String|Undefined} prefixed
 */
function prefixed(obj, property) {
    var prefix, prop;
    var camelProp = property[0].toUpperCase() + property.slice(1);

    var i = 0;
    while (i < VENDOR_PREFIXES.length) {
        prefix = VENDOR_PREFIXES[i];
        prop = (prefix) ? prefix + camelProp : property;

        if (prop in obj) {
            return prop;
        }
        i++;
    }
    return undefined;
}

/**
 * get a unique id
 * @returns {number} uniqueId
 */
var _uniqueId = 1;
function uniqueId() {
    return _uniqueId++;
}

/**
 * get the window object of an element
 * @param {HTMLElement} element
 * @returns {DocumentView|Window}
 */
function getWindowForElement(element) {
    var doc = element.ownerDocument || element;
    return (doc.defaultView || doc.parentWindow || window);
}

var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;

var SUPPORT_TOUCH = ('ontouchstart' in window);
var SUPPORT_POINTER_EVENTS = prefixed(window, 'PointerEvent') !== undefined;
var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);

var INPUT_TYPE_TOUCH = 'touch';
var INPUT_TYPE_PEN = 'pen';
var INPUT_TYPE_MOUSE = 'mouse';
var INPUT_TYPE_KINECT = 'kinect';

var COMPUTE_INTERVAL = 25;

var INPUT_START = 1;
var INPUT_MOVE = 2;
var INPUT_END = 4;
var INPUT_CANCEL = 8;

var DIRECTION_NONE = 1;
var DIRECTION_LEFT = 2;
var DIRECTION_RIGHT = 4;
var DIRECTION_UP = 8;
var DIRECTION_DOWN = 16;

var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;

var PROPS_XY = ['x', 'y'];
var PROPS_CLIENT_XY = ['clientX', 'clientY'];

/**
 * create new input type manager
 * @param {Manager} manager
 * @param {Function} callback
 * @returns {Input}
 * @constructor
 */
function Input(manager, callback) {
    var self = this;
    this.manager = manager;
    this.callback = callback;
    this.element = manager.element;
    this.target = manager.options.inputTarget;

    // smaller wrapper around the handler, for the scope and the enabled state of the manager,
    // so when disabled the input events are completely bypassed.
    this.domHandler = function(ev) {
        if (boolOrFn(manager.options.enable, [manager])) {
            self.handler(ev);
        }
    };

    this.init();

}

Input.prototype = {
    /**
     * should handle the inputEvent data and trigger the callback
     * @virtual
     */
    handler: function() { },

    /**
     * bind the events
     */
    init: function() {
        this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    },

    /**
     * unbind the events
     */
    destroy: function() {
        this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
        this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
        this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
    }
};

/**
 * create new input type manager
 * called by the Manager constructor
 * @param {Hammer} manager
 * @returns {Input}
 */
function createInputInstance(manager) {
    var Type;
    var inputClass = manager.options.inputClass;

    if (inputClass) {
        Type = inputClass;
    } else if (SUPPORT_POINTER_EVENTS) {
        Type = PointerEventInput;
    } else if (SUPPORT_ONLY_TOUCH) {
        Type = TouchInput;
    } else if (!SUPPORT_TOUCH) {
        Type = MouseInput;
    } else {
        Type = TouchMouseInput;
    }
    return new (Type)(manager, inputHandler);
}

/**
 * handle input events
 * @param {Manager} manager
 * @param {String} eventType
 * @param {Object} input
 */
function inputHandler(manager, eventType, input) {
    var pointersLen = input.pointers.length;
    var changedPointersLen = input.changedPointers.length;
    var isFirst = (eventType & INPUT_START && (pointersLen - changedPointersLen === 0));
    var isFinal = (eventType & (INPUT_END | INPUT_CANCEL) && (pointersLen - changedPointersLen === 0));

    input.isFirst = !!isFirst;
    input.isFinal = !!isFinal;

    if (isFirst) {
        manager.session = {};
    }

    // source event is the normalized value of the domEvents
    // like 'touchstart, mouseup, pointerdown'
    input.eventType = eventType;

    // compute scale, rotation etc
    computeInputData(manager, input);

    // emit secret event
    manager.emit('hammer.input', input);

    manager.recognize(input);
    manager.session.prevInput = input;
}

/**
 * extend the data with some usable properties like scale, rotate, velocity etc
 * @param {Object} manager
 * @param {Object} input
 */
function computeInputData(manager, input) {
    var session = manager.session;
    var pointers = input.pointers;
    var pointersLength = pointers.length;

    // store the first input to calculate the distance and direction
    if (!session.firstInput) {
        session.firstInput = simpleCloneInputData(input);
    }

    // to compute scale and rotation we need to store the multiple touches
    if (pointersLength > 1 && !session.firstMultiple) {
        session.firstMultiple = simpleCloneInputData(input);
    } else if (pointersLength === 1) {
        session.firstMultiple = false;
    }

    var firstInput = session.firstInput;
    var firstMultiple = session.firstMultiple;
    var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;

    var center = input.center = getCenter(pointers);
    input.timeStamp = now();
    input.deltaTime = input.timeStamp - firstInput.timeStamp;

    input.angle = getAngle(offsetCenter, center);
    input.distance = getDistance(offsetCenter, center);

    computeDeltaXY(session, input);
    input.offsetDirection = getDirection(input.deltaX, input.deltaY);

    var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
    input.overallVelocityX = overallVelocity.x;
    input.overallVelocityY = overallVelocity.y;
    input.overallVelocity = (abs(overallVelocity.x) > abs(overallVelocity.y)) ? overallVelocity.x : overallVelocity.y;

    input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
    input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;

    input.maxPointers = !session.prevInput ? input.pointers.length : ((input.pointers.length >
        session.prevInput.maxPointers) ? input.pointers.length : session.prevInput.maxPointers);

    computeIntervalInputData(session, input);

    // find the correct target
    var target = manager.element;
    if (hasParent(input.srcEvent.target, target)) {
        target = input.srcEvent.target;
    }
    input.target = target;
}

function computeDeltaXY(session, input) {
    var center = input.center;
    var offset = session.offsetDelta || {};
    var prevDelta = session.prevDelta || {};
    var prevInput = session.prevInput || {};

    if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
        prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
        };

        offset = session.offsetDelta = {
            x: center.x,
            y: center.y
        };
    }

    input.deltaX = prevDelta.x + (center.x - offset.x);
    input.deltaY = prevDelta.y + (center.y - offset.y);
}

/**
 * velocity is calculated every x ms
 * @param {Object} session
 * @param {Object} input
 */
function computeIntervalInputData(session, input) {
    var last = session.lastInterval || input,
        deltaTime = input.timeStamp - last.timeStamp,
        velocity, velocityX, velocityY, direction;

    if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined)) {
        var deltaX = input.deltaX - last.deltaX;
        var deltaY = input.deltaY - last.deltaY;

        var v = getVelocity(deltaTime, deltaX, deltaY);
        velocityX = v.x;
        velocityY = v.y;
        velocity = (abs(v.x) > abs(v.y)) ? v.x : v.y;
        direction = getDirection(deltaX, deltaY);

        session.lastInterval = input;
    } else {
        // use latest velocity info if it doesn't overtake a minimum period
        velocity = last.velocity;
        velocityX = last.velocityX;
        velocityY = last.velocityY;
        direction = last.direction;
    }

    input.velocity = velocity;
    input.velocityX = velocityX;
    input.velocityY = velocityY;
    input.direction = direction;
}

/**
 * create a simple clone from the input used for storage of firstInput and firstMultiple
 * @param {Object} input
 * @returns {Object} clonedInputData
 */
function simpleCloneInputData(input) {
    // make a simple copy of the pointers because we will get a reference if we don't
    // we only need clientXY for the calculations
    var pointers = [];
    var i = 0;
    while (i < input.pointers.length) {
        pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
        };
        i++;
    }

    return {
        timeStamp: now(),
        pointers: pointers,
        center: getCenter(pointers),
        deltaX: input.deltaX,
        deltaY: input.deltaY
    };
}

/**
 * get the center of all the pointers
 * @param {Array} pointers
 * @return {Object} center contains `x` and `y` properties
 */
function getCenter(pointers) {
    var pointersLength = pointers.length;

    // no need to loop when only one touch
    if (pointersLength === 1) {
        return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
        };
    }

    var x = 0, y = 0, i = 0;
    while (i < pointersLength) {
        x += pointers[i].clientX;
        y += pointers[i].clientY;
        i++;
    }

    return {
        x: round(x / pointersLength),
        y: round(y / pointersLength)
    };
}

/**
 * calculate the velocity between two points. unit is in px per ms.
 * @param {Number} deltaTime
 * @param {Number} x
 * @param {Number} y
 * @return {Object} velocity `x` and `y`
 */
function getVelocity(deltaTime, x, y) {
    return {
        x: x / deltaTime || 0,
        y: y / deltaTime || 0
    };
}

/**
 * get the direction between two points
 * @param {Number} x
 * @param {Number} y
 * @return {Number} direction
 */
function getDirection(x, y) {
    if (x === y) {
        return DIRECTION_NONE;
    }

    if (abs(x) >= abs(y)) {
        return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
    }
    return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
}

/**
 * calculate the absolute distance between two points
 * @param {Object} p1 {x, y}
 * @param {Object} p2 {x, y}
 * @param {Array} [props] containing x and y keys
 * @return {Number} distance
 */
function getDistance(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];

    return Math.sqrt((x * x) + (y * y));
}

/**
 * calculate the angle between two coordinates
 * @param {Object} p1
 * @param {Object} p2
 * @param {Array} [props] containing x and y keys
 * @return {Number} angle
 */
function getAngle(p1, p2, props) {
    if (!props) {
        props = PROPS_XY;
    }
    var x = p2[props[0]] - p1[props[0]],
        y = p2[props[1]] - p1[props[1]];
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * calculate the rotation degrees between two pointersets
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} rotation
 */
function getRotation(start, end) {
    return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
}

/**
 * calculate the scale factor between two pointersets
 * no scale is 1, and goes down to 0 when pinched together, and bigger when pinched out
 * @param {Array} start array of pointers
 * @param {Array} end array of pointers
 * @return {Number} scale
 */
function getScale(start, end) {
    return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
}

var MOUSE_INPUT_MAP = {
    mousedown: INPUT_START,
    mousemove: INPUT_MOVE,
    mouseup: INPUT_END
};

var MOUSE_ELEMENT_EVENTS = 'mousedown';
var MOUSE_WINDOW_EVENTS = 'mousemove mouseup';

/**
 * Mouse events input
 * @constructor
 * @extends Input
 */
function MouseInput() {
    this.evEl = MOUSE_ELEMENT_EVENTS;
    this.evWin = MOUSE_WINDOW_EVENTS;

    this.pressed = false; // mousedown state

    Input.apply(this, arguments);
}

inherit(MouseInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function MEhandler(ev) {
        var eventType = MOUSE_INPUT_MAP[ev.type];

        // on start we want to have the left mouse button down
        if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
        }

        if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
        }

        // mouse must be down
        if (!this.pressed) {
            return;
        }

        if (eventType & INPUT_END) {
            this.pressed = false;
        }

        this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
        });
    }
});

var POINTER_INPUT_MAP = {
    pointerdown: INPUT_START,
    pointermove: INPUT_MOVE,
    pointerup: INPUT_END,
    pointercancel: INPUT_CANCEL,
    pointerout: INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
var IE10_POINTER_TYPE_ENUM = {
    2: INPUT_TYPE_TOUCH,
    3: INPUT_TYPE_PEN,
    4: INPUT_TYPE_MOUSE,
    5: INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

var POINTER_ELEMENT_EVENTS = 'pointerdown';
var POINTER_WINDOW_EVENTS = 'pointermove pointerup pointercancel';

// IE10 has prefixed support, and case-sensitive
if (window.MSPointerEvent && !window.PointerEvent) {
    POINTER_ELEMENT_EVENTS = 'MSPointerDown';
    POINTER_WINDOW_EVENTS = 'MSPointerMove MSPointerUp MSPointerCancel';
}

/**
 * Pointer events input
 * @constructor
 * @extends Input
 */
function PointerEventInput() {
    this.evEl = POINTER_ELEMENT_EVENTS;
    this.evWin = POINTER_WINDOW_EVENTS;

    Input.apply(this, arguments);

    this.store = (this.manager.session.pointerEvents = []);
}

inherit(PointerEventInput, Input, {
    /**
     * handle mouse events
     * @param {Object} ev
     */
    handler: function PEhandler(ev) {
        var store = this.store;
        var removePointer = false;

        var eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
        var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
        var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

        var isTouch = (pointerType == INPUT_TYPE_TOUCH);

        // get index of the event in the store
        var storeIndex = inArray(store, ev.pointerId, 'pointerId');

        // start and mouse must be down
        if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
                store.push(ev);
                storeIndex = store.length - 1;
            }
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
        }

        // it not found, so the pointer hasn't been down (so it's probably a hover)
        if (storeIndex < 0) {
            return;
        }

        // update the event in the store
        store[storeIndex] = ev;

        this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType: pointerType,
            srcEvent: ev
        });

        if (removePointer) {
            // remove from the store
            store.splice(storeIndex, 1);
        }
    }
});

var SINGLE_TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var SINGLE_TOUCH_TARGET_EVENTS = 'touchstart';
var SINGLE_TOUCH_WINDOW_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Touch events input
 * @constructor
 * @extends Input
 */
function SingleTouchInput() {
    this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
    this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
    this.started = false;

    Input.apply(this, arguments);
}

inherit(SingleTouchInput, Input, {
    handler: function TEhandler(ev) {
        var type = SINGLE_TOUCH_INPUT_MAP[ev.type];

        // should we handle the touch events?
        if (type === INPUT_START) {
            this.started = true;
        }

        if (!this.started) {
            return;
        }

        var touches = normalizeSingleTouches.call(this, ev, type);

        // when done, reset the started state
        if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function normalizeSingleTouches(ev, type) {
    var all = toArray(ev.touches);
    var changed = toArray(ev.changedTouches);

    if (type & (INPUT_END | INPUT_CANCEL)) {
        all = uniqueArray(all.concat(changed), 'identifier', true);
    }

    return [all, changed];
}

var TOUCH_INPUT_MAP = {
    touchstart: INPUT_START,
    touchmove: INPUT_MOVE,
    touchend: INPUT_END,
    touchcancel: INPUT_CANCEL
};

var TOUCH_TARGET_EVENTS = 'touchstart touchmove touchend touchcancel';

/**
 * Multi-user touch events input
 * @constructor
 * @extends Input
 */
function TouchInput() {
    this.evTarget = TOUCH_TARGET_EVENTS;
    this.targetIds = {};

    Input.apply(this, arguments);
}

inherit(TouchInput, Input, {
    handler: function MTEhandler(ev) {
        var type = TOUCH_INPUT_MAP[ev.type];
        var touches = getTouches.call(this, ev, type);
        if (!touches) {
            return;
        }

        this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
        });
    }
});

/**
 * @this {TouchInput}
 * @param {Object} ev
 * @param {Number} type flag
 * @returns {undefined|Array} [all, changed]
 */
function getTouches(ev, type) {
    var allTouches = toArray(ev.touches);
    var targetIds = this.targetIds;

    // when there is only one touch, the process can be simplified
    if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
        targetIds[allTouches[0].identifier] = true;
        return [allTouches, allTouches];
    }

    var i,
        targetTouches,
        changedTouches = toArray(ev.changedTouches),
        changedTargetTouches = [],
        target = this.target;

    // get target touches from touches
    targetTouches = allTouches.filter(function(touch) {
        return hasParent(touch.target, target);
    });

    // collect touches
    if (type === INPUT_START) {
        i = 0;
        while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
        }
    }

    // filter changed touches to only contain touches that exist in the collected target ids
    i = 0;
    while (i < changedTouches.length) {
        if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
        }

        // cleanup removed touches
        if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
        }
        i++;
    }

    if (!changedTargetTouches.length) {
        return;
    }

    return [
        // merge targetTouches with changedTargetTouches so it contains ALL touches, including 'end' and 'cancel'
        uniqueArray(targetTouches.concat(changedTargetTouches), 'identifier', true),
        changedTargetTouches
    ];
}

/**
 * Combined touch and mouse input
 *
 * Touch has a higher priority then mouse, and while touching no mouse events are allowed.
 * This because touch devices also emit mouse events while doing a touch.
 *
 * @constructor
 * @extends Input
 */

var DEDUP_TIMEOUT = 2500;
var DEDUP_DISTANCE = 25;

function TouchMouseInput() {
    Input.apply(this, arguments);

    var handler = bindFn(this.handler, this);
    this.touch = new TouchInput(this.manager, handler);
    this.mouse = new MouseInput(this.manager, handler);

    this.primaryTouch = null;
    this.lastTouches = [];
}

inherit(TouchMouseInput, Input, {
    /**
     * handle mouse and touch events
     * @param {Hammer} manager
     * @param {String} inputEvent
     * @param {Object} inputData
     */
    handler: function TMEhandler(manager, inputEvent, inputData) {
        var isTouch = (inputData.pointerType == INPUT_TYPE_TOUCH),
            isMouse = (inputData.pointerType == INPUT_TYPE_MOUSE);

        if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
        }

        // when we're in a touch event, record touches to  de-dupe synthetic mouse event
        if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
        } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
        }

        this.callback(manager, inputEvent, inputData);
    },

    /**
     * remove the event listeners
     */
    destroy: function destroy() {
        this.touch.destroy();
        this.mouse.destroy();
    }
});

function recordTouches(eventType, eventData) {
    if (eventType & INPUT_START) {
        this.primaryTouch = eventData.changedPointers[0].identifier;
        setLastTouch.call(this, eventData);
    } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
        setLastTouch.call(this, eventData);
    }
}

function setLastTouch(eventData) {
    var touch = eventData.changedPointers[0];

    if (touch.identifier === this.primaryTouch) {
        var lastTouch = {x: touch.clientX, y: touch.clientY};
        this.lastTouches.push(lastTouch);
        var lts = this.lastTouches;
        var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
                lts.splice(i, 1);
            }
        };
        setTimeout(removeLastTouch, DEDUP_TIMEOUT);
    }
}

function isSyntheticEvent(eventData) {
    var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
    for (var i = 0; i < this.lastTouches.length; i++) {
        var t = this.lastTouches[i];
        var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
        if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
        }
    }
    return false;
}

var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, 'touchAction');
var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined;

// magical touchAction value
var TOUCH_ACTION_COMPUTE = 'compute';
var TOUCH_ACTION_AUTO = 'auto';
var TOUCH_ACTION_MANIPULATION = 'manipulation'; // not implemented
var TOUCH_ACTION_NONE = 'none';
var TOUCH_ACTION_PAN_X = 'pan-x';
var TOUCH_ACTION_PAN_Y = 'pan-y';
var TOUCH_ACTION_MAP = getTouchActionProps();

/**
 * Touch Action
 * sets the touchAction property or uses the js alternative
 * @param {Manager} manager
 * @param {String} value
 * @constructor
 */
function TouchAction(manager, value) {
    this.manager = manager;
    this.set(value);
}

TouchAction.prototype = {
    /**
     * set the touchAction value on the element or enable the polyfill
     * @param {String} value
     */
    set: function(value) {
        // find out the touch-action by the event handlers
        if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
        }

        if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
        }
        this.actions = value.toLowerCase().trim();
    },

    /**
     * just re-set the touchAction value
     */
    update: function() {
        this.set(this.manager.options.touchAction);
    },

    /**
     * compute the value for the touchAction property based on the recognizer's settings
     * @returns {String} value
     */
    compute: function() {
        var actions = [];
        each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
                actions = actions.concat(recognizer.getTouchAction());
            }
        });
        return cleanTouchActions(actions.join(' '));
    },

    /**
     * this method is called on each input cycle and provides the preventing of the browser behavior
     * @param {Object} input
     */
    preventDefaults: function(input) {
        var srcEvent = input.srcEvent;
        var direction = input.offsetDirection;

        // if the touch action did prevented once this session
        if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
        }

        var actions = this.actions;
        var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];

        if (hasNone) {
            //do not prevent defaults if this is a tap gesture

            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;

            if (isTapPointer && isTapMovement && isTapTouchTime) {
                return;
            }
        }

        if (hasPanX && hasPanY) {
            // `pan-x pan-y` means browser handles all scrolling/panning, do not prevent
            return;
        }

        if (hasNone ||
            (hasPanY && direction & DIRECTION_HORIZONTAL) ||
            (hasPanX && direction & DIRECTION_VERTICAL)) {
            return this.preventSrc(srcEvent);
        }
    },

    /**
     * call preventDefault to prevent the browser's default behavior (scrolling in most cases)
     * @param {Object} srcEvent
     */
    preventSrc: function(srcEvent) {
        this.manager.session.prevented = true;
        srcEvent.preventDefault();
    }
};

/**
 * when the touchActions are collected they are not a valid value, so we need to clean things up. *
 * @param {String} actions
 * @returns {*}
 */
function cleanTouchActions(actions) {
    // none
    if (inStr(actions, TOUCH_ACTION_NONE)) {
        return TOUCH_ACTION_NONE;
    }

    var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
    var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);

    // if both pan-x and pan-y are set (different recognizers
    // for different directions, e.g. horizontal pan but vertical swipe?)
    // we need none (as otherwise with pan-x pan-y combined none of these
    // recognizers will work, since the browser would handle all panning
    if (hasPanX && hasPanY) {
        return TOUCH_ACTION_NONE;
    }

    // pan-x OR pan-y
    if (hasPanX || hasPanY) {
        return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
    }

    // manipulation
    if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
        return TOUCH_ACTION_MANIPULATION;
    }

    return TOUCH_ACTION_AUTO;
}

function getTouchActionProps() {
    if (!NATIVE_TOUCH_ACTION) {
        return false;
    }
    var touchMap = {};
    var cssSupports = window.CSS && window.CSS.supports;
    ['auto', 'manipulation', 'pan-y', 'pan-x', 'pan-x pan-y', 'none'].forEach(function(val) {

        // If css.supports is not supported but there is native touch-action assume it supports
        // all values. This is the case for IE 10 and 11.
        touchMap[val] = cssSupports ? window.CSS.supports('touch-action', val) : true;
    });
    return touchMap;
}

/**
 * Recognizer flow explained; *
 * All recognizers have the initial state of POSSIBLE when a input session starts.
 * The definition of a input session is from the first input until the last input, with all it's movement in it. *
 * Example session for mouse-input: mousedown -> mousemove -> mouseup
 *
 * On each recognizing cycle (see Manager.recognize) the .recognize() method is executed
 * which determines with state it should be.
 *
 * If the recognizer has the state FAILED, CANCELLED or RECOGNIZED (equals ENDED), it is reset to
 * POSSIBLE to give it another change on the next cycle.
 *
 *               Possible
 *                  |
 *            +-----+---------------+
 *            |                     |
 *      +-----+-----+               |
 *      |           |               |
 *   Failed      Cancelled          |
 *                          +-------+------+
 *                          |              |
 *                      Recognized       Began
 *                                         |
 *                                      Changed
 *                                         |
 *                                  Ended/Recognized
 */
var STATE_POSSIBLE = 1;
var STATE_BEGAN = 2;
var STATE_CHANGED = 4;
var STATE_ENDED = 8;
var STATE_RECOGNIZED = STATE_ENDED;
var STATE_CANCELLED = 16;
var STATE_FAILED = 32;

/**
 * Recognizer
 * Every recognizer needs to extend from this class.
 * @constructor
 * @param {Object} options
 */
function Recognizer(options) {
    this.options = assign({}, this.defaults, options || {});

    this.id = uniqueId();

    this.manager = null;

    // default is enable true
    this.options.enable = ifUndefined(this.options.enable, true);

    this.state = STATE_POSSIBLE;

    this.simultaneous = {};
    this.requireFail = [];
}

Recognizer.prototype = {
    /**
     * @virtual
     * @type {Object}
     */
    defaults: {},

    /**
     * set options
     * @param {Object} options
     * @return {Recognizer}
     */
    set: function(options) {
        assign(this.options, options);

        // also update the touchAction, in case something changed about the directions/enabled state
        this.manager && this.manager.touchAction.update();
        return this;
    },

    /**
     * recognize simultaneous with an other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    recognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'recognizeWith', this)) {
            return this;
        }

        var simultaneous = this.simultaneous;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
        }
        return this;
    },

    /**
     * drop the simultaneous link. it doesnt remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRecognizeWith: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRecognizeWith', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        delete this.simultaneous[otherRecognizer.id];
        return this;
    },

    /**
     * recognizer can only run when an other is failing
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    requireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'requireFailure', this)) {
            return this;
        }

        var requireFail = this.requireFail;
        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
        }
        return this;
    },

    /**
     * drop the requireFailure link. it does not remove the link on the other recognizer.
     * @param {Recognizer} otherRecognizer
     * @returns {Recognizer} this
     */
    dropRequireFailure: function(otherRecognizer) {
        if (invokeArrayArg(otherRecognizer, 'dropRequireFailure', this)) {
            return this;
        }

        otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
        var index = inArray(this.requireFail, otherRecognizer);
        if (index > -1) {
            this.requireFail.splice(index, 1);
        }
        return this;
    },

    /**
     * has require failures boolean
     * @returns {boolean}
     */
    hasRequireFailures: function() {
        return this.requireFail.length > 0;
    },

    /**
     * if the recognizer can recognize simultaneous with an other recognizer
     * @param {Recognizer} otherRecognizer
     * @returns {Boolean}
     */
    canRecognizeWith: function(otherRecognizer) {
        return !!this.simultaneous[otherRecognizer.id];
    },

    /**
     * You should use `tryEmit` instead of `emit` directly to check
     * that all the needed recognizers has failed before emitting.
     * @param {Object} input
     */
    emit: function(input) {
        var self = this;
        var state = this.state;

        function emit(event) {
            self.manager.emit(event, input);
        }

        // 'panstart' and 'panmove'
        if (state < STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }

        emit(self.options.event); // simple 'eventName' events

        if (input.additionalEvent) { // additional event(panleft, panright, pinchin, pinchout...)
            emit(input.additionalEvent);
        }

        // panend and pancancel
        if (state >= STATE_ENDED) {
            emit(self.options.event + stateStr(state));
        }
    },

    /**
     * Check that all the require failure recognizers has failed,
     * if true, it emits a gesture event,
     * otherwise, setup the state to FAILED.
     * @param {Object} input
     */
    tryEmit: function(input) {
        if (this.canEmit()) {
            return this.emit(input);
        }
        // it's failing anyway
        this.state = STATE_FAILED;
    },

    /**
     * can we emit?
     * @returns {boolean}
     */
    canEmit: function() {
        var i = 0;
        while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
                return false;
            }
            i++;
        }
        return true;
    },

    /**
     * update the recognizer
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        // make a new copy of the inputData
        // so we can change the inputData without messing up the other recognizers
        var inputDataClone = assign({}, inputData);

        // is is enabled and allow recognizing?
        if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
        }

        // reset when we've reached the end
        if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
        }

        this.state = this.process(inputDataClone);

        // the recognizer has recognized a gesture
        // so trigger an event
        if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
        }
    },

    /**
     * return the state of the recognizer
     * the actual recognizing happens in this method
     * @virtual
     * @param {Object} inputData
     * @returns {Const} STATE
     */
    process: function(inputData) { }, // jshint ignore:line

    /**
     * return the preferred touch-action
     * @virtual
     * @returns {Array}
     */
    getTouchAction: function() { },

    /**
     * called when the gesture isn't allowed to recognize
     * like when another is being recognized or it is disabled
     * @virtual
     */
    reset: function() { }
};

/**
 * get a usable string, used as event postfix
 * @param {Const} state
 * @returns {String} state
 */
function stateStr(state) {
    if (state & STATE_CANCELLED) {
        return 'cancel';
    } else if (state & STATE_ENDED) {
        return 'end';
    } else if (state & STATE_CHANGED) {
        return 'move';
    } else if (state & STATE_BEGAN) {
        return 'start';
    }
    return '';
}

/**
 * direction cons to string
 * @param {Const} direction
 * @returns {String}
 */
function directionStr(direction) {
    if (direction == DIRECTION_DOWN) {
        return 'down';
    } else if (direction == DIRECTION_UP) {
        return 'up';
    } else if (direction == DIRECTION_LEFT) {
        return 'left';
    } else if (direction == DIRECTION_RIGHT) {
        return 'right';
    }
    return '';
}

/**
 * get a recognizer by name if it is bound to a manager
 * @param {Recognizer|String} otherRecognizer
 * @param {Recognizer} recognizer
 * @returns {Recognizer}
 */
function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
    var manager = recognizer.manager;
    if (manager) {
        return manager.get(otherRecognizer);
    }
    return otherRecognizer;
}

/**
 * This recognizer is just used as a base for the simple attribute recognizers.
 * @constructor
 * @extends Recognizer
 */
function AttrRecognizer() {
    Recognizer.apply(this, arguments);
}

inherit(AttrRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof AttrRecognizer
     */
    defaults: {
        /**
         * @type {Number}
         * @default 1
         */
        pointers: 1
    },

    /**
     * Used to check if it the recognizer receives valid input, like input.distance > 10.
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {Boolean} recognized
     */
    attrTest: function(input) {
        var optionPointers = this.options.pointers;
        return optionPointers === 0 || input.pointers.length === optionPointers;
    },

    /**
     * Process the input and return the state for the recognizer
     * @memberof AttrRecognizer
     * @param {Object} input
     * @returns {*} State
     */
    process: function(input) {
        var state = this.state;
        var eventType = input.eventType;

        var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
        var isValid = this.attrTest(input);

        // on cancel input and we've recognized before, return STATE_CANCELLED
        if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
        } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
                return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
                return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
        }
        return STATE_FAILED;
    }
});

/**
 * Pan
 * Recognized when the pointer is down and moved in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function PanRecognizer() {
    AttrRecognizer.apply(this, arguments);

    this.pX = null;
    this.pY = null;
}

inherit(PanRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PanRecognizer
     */
    defaults: {
        event: 'pan',
        threshold: 10,
        pointers: 1,
        direction: DIRECTION_ALL
    },

    getTouchAction: function() {
        var direction = this.options.direction;
        var actions = [];
        if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
        }
        if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
        }
        return actions;
    },

    directionTest: function(input) {
        var options = this.options;
        var hasMoved = true;
        var distance = input.distance;
        var direction = input.direction;
        var x = input.deltaX;
        var y = input.deltaY;

        // lock to axis?
        if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
                direction = (x === 0) ? DIRECTION_NONE : (x < 0) ? DIRECTION_LEFT : DIRECTION_RIGHT;
                hasMoved = x != this.pX;
                distance = Math.abs(input.deltaX);
            } else {
                direction = (y === 0) ? DIRECTION_NONE : (y < 0) ? DIRECTION_UP : DIRECTION_DOWN;
                hasMoved = y != this.pY;
                distance = Math.abs(input.deltaY);
            }
        }
        input.direction = direction;
        return hasMoved && distance > options.threshold && direction & options.direction;
    },

    attrTest: function(input) {
        return AttrRecognizer.prototype.attrTest.call(this, input) &&
            (this.state & STATE_BEGAN || (!(this.state & STATE_BEGAN) && this.directionTest(input)));
    },

    emit: function(input) {

        this.pX = input.deltaX;
        this.pY = input.deltaY;

        var direction = directionStr(input.direction);

        if (direction) {
            input.additionalEvent = this.options.event + direction;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Pinch
 * Recognized when two or more pointers are moving toward (zoom-in) or away from each other (zoom-out).
 * @constructor
 * @extends AttrRecognizer
 */
function PinchRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(PinchRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'pinch',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
    },

    emit: function(input) {
        if (input.scale !== 1) {
            var inOut = input.scale < 1 ? 'in' : 'out';
            input.additionalEvent = this.options.event + inOut;
        }
        this._super.emit.call(this, input);
    }
});

/**
 * Press
 * Recognized when the pointer is down for x ms without any movement.
 * @constructor
 * @extends Recognizer
 */
function PressRecognizer() {
    Recognizer.apply(this, arguments);

    this._timer = null;
    this._input = null;
}

inherit(PressRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PressRecognizer
     */
    defaults: {
        event: 'press',
        pointers: 1,
        time: 251, // minimal time of the pointer to be pressed
        threshold: 9 // a minimal movement is ok, but keep it low
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_AUTO];
    },

    process: function(input) {
        var options = this.options;
        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTime = input.deltaTime > options.time;

        this._input = input;

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (!validMovement || !validPointers || (input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime)) {
            this.reset();
        } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
                this.state = STATE_RECOGNIZED;
                this.tryEmit();
            }, options.time, this);
        } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
        }
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function(input) {
        if (this.state !== STATE_RECOGNIZED) {
            return;
        }

        if (input && (input.eventType & INPUT_END)) {
            this.manager.emit(this.options.event + 'up', input);
        } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Rotate
 * Recognized when two or more pointer are moving in a circular motion.
 * @constructor
 * @extends AttrRecognizer
 */
function RotateRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(RotateRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof RotateRecognizer
     */
    defaults: {
        event: 'rotate',
        threshold: 0,
        pointers: 2
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_NONE];
    },

    attrTest: function(input) {
        return this._super.attrTest.call(this, input) &&
            (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
    }
});

/**
 * Swipe
 * Recognized when the pointer is moving fast (velocity), with enough distance in the allowed direction.
 * @constructor
 * @extends AttrRecognizer
 */
function SwipeRecognizer() {
    AttrRecognizer.apply(this, arguments);
}

inherit(SwipeRecognizer, AttrRecognizer, {
    /**
     * @namespace
     * @memberof SwipeRecognizer
     */
    defaults: {
        event: 'swipe',
        threshold: 10,
        velocity: 0.3,
        direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
        pointers: 1
    },

    getTouchAction: function() {
        return PanRecognizer.prototype.getTouchAction.call(this);
    },

    attrTest: function(input) {
        var direction = this.options.direction;
        var velocity;

        if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
        } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
        } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
        }

        return this._super.attrTest.call(this, input) &&
            direction & input.offsetDirection &&
            input.distance > this.options.threshold &&
            input.maxPointers == this.options.pointers &&
            abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
    },

    emit: function(input) {
        var direction = directionStr(input.offsetDirection);
        if (direction) {
            this.manager.emit(this.options.event + direction, input);
        }

        this.manager.emit(this.options.event, input);
    }
});

/**
 * A tap is ecognized when the pointer is doing a small tap/click. Multiple taps are recognized if they occur
 * between the given interval and position. The delay option can be used to recognize multi-taps without firing
 * a single tap.
 *
 * The eventData from the emitted event contains the property `tapCount`, which contains the amount of
 * multi-taps being recognized.
 * @constructor
 * @extends Recognizer
 */
function TapRecognizer() {
    Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
}

inherit(TapRecognizer, Recognizer, {
    /**
     * @namespace
     * @memberof PinchRecognizer
     */
    defaults: {
        event: 'tap',
        pointers: 1,
        taps: 1,
        interval: 300, // max time between the multi-tap taps
        time: 250, // max time of the pointer to be down (like finger on the screen)
        threshold: 9, // a minimal movement is ok, but keep it low
        posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    getTouchAction: function() {
        return [TOUCH_ACTION_MANIPULATION];
    },

    process: function(input) {
        var options = this.options;

        var validPointers = input.pointers.length === options.pointers;
        var validMovement = input.distance < options.threshold;
        var validTouchTime = input.deltaTime < options.time;

        this.reset();

        if ((input.eventType & INPUT_START) && (this.count === 0)) {
            return this.failTimeout();
        }

        // we only allow little movement
        // and we've reached an end event, so a tap is possible
        if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
                return this.failTimeout();
            }

            var validInterval = this.pTime ? (input.timeStamp - this.pTime < options.interval) : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

            this.pTime = input.timeStamp;
            this.pCenter = input.center;

            if (!validMultiTap || !validInterval) {
                this.count = 1;
            } else {
                this.count += 1;
            }

            this._input = input;

            // if tap count matches we have recognized it,
            // else it has began recognizing...
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
                // no failing requirements, immediately trigger the tap event
                // or wait as long as the multitap interval to trigger
                if (!this.hasRequireFailures()) {
                    return STATE_RECOGNIZED;
                } else {
                    this._timer = setTimeoutContext(function() {
                        this.state = STATE_RECOGNIZED;
                        this.tryEmit();
                    }, options.interval, this);
                    return STATE_BEGAN;
                }
            }
        }
        return STATE_FAILED;
    },

    failTimeout: function() {
        this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
        }, this.options.interval, this);
        return STATE_FAILED;
    },

    reset: function() {
        clearTimeout(this._timer);
    },

    emit: function() {
        if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
        }
    }
});

/**
 * Simple way to create a manager with a default set of recognizers.
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Hammer(element, options) {
    options = options || {};
    options.recognizers = ifUndefined(options.recognizers, Hammer.defaults.preset);
    return new Manager(element, options);
}

/**
 * @const {string}
 */
Hammer.VERSION = '2.0.7';

/**
 * default settings
 * @namespace
 */
Hammer.defaults = {
    /**
     * set if DOM events are being triggered.
     * But this is slower and unused by simple implementations, so disabled by default.
     * @type {Boolean}
     * @default false
     */
    domEvents: false,

    /**
     * The value for the touchAction property/fallback.
     * When set to `compute` it will magically set the correct value based on the added recognizers.
     * @type {String}
     * @default compute
     */
    touchAction: TOUCH_ACTION_COMPUTE,

    /**
     * @type {Boolean}
     * @default true
     */
    enable: true,

    /**
     * EXPERIMENTAL FEATURE -- can be removed/changed
     * Change the parent input target element.
     * If Null, then it is being set the to main element.
     * @type {Null|EventTarget}
     * @default null
     */
    inputTarget: null,

    /**
     * force an input class
     * @type {Null|Function}
     * @default null
     */
    inputClass: null,

    /**
     * Default recognizer setup when calling `Hammer()`
     * When creating a new Manager these will be skipped.
     * @type {Array}
     */
    preset: [
        // RecognizerClass, options, [recognizeWith, ...], [requireFailure, ...]
        [RotateRecognizer, {enable: false}],
        [PinchRecognizer, {enable: false}, ['rotate']],
        [SwipeRecognizer, {direction: DIRECTION_HORIZONTAL}],
        [PanRecognizer, {direction: DIRECTION_HORIZONTAL}, ['swipe']],
        [TapRecognizer],
        [TapRecognizer, {event: 'doubletap', taps: 2}, ['tap']],
        [PressRecognizer]
    ],

    /**
     * Some CSS properties can be used to improve the working of Hammer.
     * Add them to this method and they will be set when creating a new Manager.
     * @namespace
     */
    cssProps: {
        /**
         * Disables text selection to improve the dragging gesture. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userSelect: 'none',

        /**
         * Disable the Windows Phone grippers when pressing an element.
         * @type {String}
         * @default 'none'
         */
        touchSelect: 'none',

        /**
         * Disables the default callout shown when you touch and hold a touch target.
         * On iOS, when you touch and hold a touch target such as a link, Safari displays
         * a callout containing information about the link. This property allows you to disable that callout.
         * @type {String}
         * @default 'none'
         */
        touchCallout: 'none',

        /**
         * Specifies whether zooming is enabled. Used by IE10>
         * @type {String}
         * @default 'none'
         */
        contentZooming: 'none',

        /**
         * Specifies that an entire element should be draggable instead of its contents. Mainly for desktop browsers.
         * @type {String}
         * @default 'none'
         */
        userDrag: 'none',

        /**
         * Overrides the highlight color shown when the user taps a link or a JavaScript
         * clickable element in iOS. This property obeys the alpha value, if specified.
         * @type {String}
         * @default 'rgba(0,0,0,0)'
         */
        tapHighlightColor: 'rgba(0,0,0,0)'
    }
};

var STOP = 1;
var FORCED_STOP = 2;

/**
 * Manager
 * @param {HTMLElement} element
 * @param {Object} [options]
 * @constructor
 */
function Manager(element, options) {
    this.options = assign({}, Hammer.defaults, options || {});

    this.options.inputTarget = this.options.inputTarget || element;

    this.handlers = {};
    this.session = {};
    this.recognizers = [];
    this.oldCssProps = {};

    this.element = element;
    this.input = createInputInstance(this);
    this.touchAction = new TouchAction(this, this.options.touchAction);

    toggleCssProps(this, true);

    each(this.options.recognizers, function(item) {
        var recognizer = this.add(new (item[0])(item[1]));
        item[2] && recognizer.recognizeWith(item[2]);
        item[3] && recognizer.requireFailure(item[3]);
    }, this);
}

Manager.prototype = {
    /**
     * set options
     * @param {Object} options
     * @returns {Manager}
     */
    set: function(options) {
        assign(this.options, options);

        // Options that need a little more setup
        if (options.touchAction) {
            this.touchAction.update();
        }
        if (options.inputTarget) {
            // Clean up existing event listeners and reinitialize
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
        }
        return this;
    },

    /**
     * stop recognizing for this session.
     * This session will be discarded, when a new [input]start event is fired.
     * When forced, the recognizer cycle is stopped immediately.
     * @param {Boolean} [force]
     */
    stop: function(force) {
        this.session.stopped = force ? FORCED_STOP : STOP;
    },

    /**
     * run the recognizers!
     * called by the inputHandler function on every movement of the pointers (touches)
     * it walks through all the recognizers and tries to detect the gesture that is being made
     * @param {Object} inputData
     */
    recognize: function(inputData) {
        var session = this.session;
        if (session.stopped) {
            return;
        }

        // run the touch-action polyfill
        this.touchAction.preventDefaults(inputData);

        var recognizer;
        var recognizers = this.recognizers;

        // this holds the recognizer that is being recognized.
        // so the recognizer's state needs to be BEGAN, CHANGED, ENDED or RECOGNIZED
        // if no recognizer is detecting a thing, it is set to `null`
        var curRecognizer = session.curRecognizer;

        // reset when the last recognizer is recognized
        // or when we're in a new session
        if (!curRecognizer || (curRecognizer && curRecognizer.state & STATE_RECOGNIZED)) {
            curRecognizer = session.curRecognizer = null;
        }

        var i = 0;
        while (i < recognizers.length) {
            recognizer = recognizers[i];

            // find out if we are allowed try to recognize the input for this one.
            // 1.   allow if the session is NOT forced stopped (see the .stop() method)
            // 2.   allow if we still haven't recognized a gesture in this session, or the this recognizer is the one
            //      that is being recognized.
            // 3.   allow if the recognizer is allowed to run simultaneous with the current recognized recognizer.
            //      this can be setup with the `recognizeWith()` method on the recognizer.
            if (session.stopped !== FORCED_STOP && ( // 1
                    !curRecognizer || recognizer == curRecognizer || // 2
                    recognizer.canRecognizeWith(curRecognizer))) { // 3
                recognizer.recognize(inputData);
            } else {
                recognizer.reset();
            }

            // if the recognizer has been recognizing the input as a valid gesture, we want to store this one as the
            // current active recognizer. but only if we don't already have an active recognizer
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
                curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
        }
    },

    /**
     * get a recognizer by its event name.
     * @param {Recognizer|String} recognizer
     * @returns {Recognizer|Null}
     */
    get: function(recognizer) {
        if (recognizer instanceof Recognizer) {
            return recognizer;
        }

        var recognizers = this.recognizers;
        for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
                return recognizers[i];
            }
        }
        return null;
    },

    /**
     * add a recognizer to the manager
     * existing recognizers with the same event name will be removed
     * @param {Recognizer} recognizer
     * @returns {Recognizer|Manager}
     */
    add: function(recognizer) {
        if (invokeArrayArg(recognizer, 'add', this)) {
            return this;
        }

        // remove existing
        var existing = this.get(recognizer.options.event);
        if (existing) {
            this.remove(existing);
        }

        this.recognizers.push(recognizer);
        recognizer.manager = this;

        this.touchAction.update();
        return recognizer;
    },

    /**
     * remove a recognizer by name or instance
     * @param {Recognizer|String} recognizer
     * @returns {Manager}
     */
    remove: function(recognizer) {
        if (invokeArrayArg(recognizer, 'remove', this)) {
            return this;
        }

        recognizer = this.get(recognizer);

        // let's make sure this recognizer exists
        if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);

            if (index !== -1) {
                recognizers.splice(index, 1);
                this.touchAction.update();
            }
        }

        return this;
    },

    /**
     * bind event
     * @param {String} events
     * @param {Function} handler
     * @returns {EventEmitter} this
     */
    on: function(events, handler) {
        if (events === undefined) {
            return;
        }
        if (handler === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
        });
        return this;
    },

    /**
     * unbind event, leave emit blank to remove all handlers
     * @param {String} events
     * @param {Function} [handler]
     * @returns {EventEmitter} this
     */
    off: function(events, handler) {
        if (events === undefined) {
            return;
        }

        var handlers = this.handlers;
        each(splitStr(events), function(event) {
            if (!handler) {
                delete handlers[event];
            } else {
                handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
        });
        return this;
    },

    /**
     * emit event to the listeners
     * @param {String} event
     * @param {Object} data
     */
    emit: function(event, data) {
        // we also want to trigger dom events
        if (this.options.domEvents) {
            triggerDomEvent(event, data);
        }

        // no handlers, so skip it all
        var handlers = this.handlers[event] && this.handlers[event].slice();
        if (!handlers || !handlers.length) {
            return;
        }

        data.type = event;
        data.preventDefault = function() {
            data.srcEvent.preventDefault();
        };

        var i = 0;
        while (i < handlers.length) {
            handlers[i](data);
            i++;
        }
    },

    /**
     * destroy the manager and unbinds all events
     * it doesn't unbind dom events, that is the user own responsibility
     */
    destroy: function() {
        this.element && toggleCssProps(this, false);

        this.handlers = {};
        this.session = {};
        this.input.destroy();
        this.element = null;
    }
};

/**
 * add/remove the css properties as defined in manager.options.cssProps
 * @param {Manager} manager
 * @param {Boolean} add
 */
function toggleCssProps(manager, add) {
    var element = manager.element;
    if (!element.style) {
        return;
    }
    var prop;
    each(manager.options.cssProps, function(value, name) {
        prop = prefixed(element.style, name);
        if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
        } else {
            element.style[prop] = manager.oldCssProps[prop] || '';
        }
    });
    if (!add) {
        manager.oldCssProps = {};
    }
}

/**
 * trigger dom event
 * @param {String} event
 * @param {Object} data
 */
function triggerDomEvent(event, data) {
    var gestureEvent = document.createEvent('Event');
    gestureEvent.initEvent(event, true, true);
    gestureEvent.gesture = data;
    data.target.dispatchEvent(gestureEvent);
}

assign(Hammer, {
    INPUT_START: INPUT_START,
    INPUT_MOVE: INPUT_MOVE,
    INPUT_END: INPUT_END,
    INPUT_CANCEL: INPUT_CANCEL,

    STATE_POSSIBLE: STATE_POSSIBLE,
    STATE_BEGAN: STATE_BEGAN,
    STATE_CHANGED: STATE_CHANGED,
    STATE_ENDED: STATE_ENDED,
    STATE_RECOGNIZED: STATE_RECOGNIZED,
    STATE_CANCELLED: STATE_CANCELLED,
    STATE_FAILED: STATE_FAILED,

    DIRECTION_NONE: DIRECTION_NONE,
    DIRECTION_LEFT: DIRECTION_LEFT,
    DIRECTION_RIGHT: DIRECTION_RIGHT,
    DIRECTION_UP: DIRECTION_UP,
    DIRECTION_DOWN: DIRECTION_DOWN,
    DIRECTION_HORIZONTAL: DIRECTION_HORIZONTAL,
    DIRECTION_VERTICAL: DIRECTION_VERTICAL,
    DIRECTION_ALL: DIRECTION_ALL,

    Manager: Manager,
    Input: Input,
    TouchAction: TouchAction,

    TouchInput: TouchInput,
    MouseInput: MouseInput,
    PointerEventInput: PointerEventInput,
    TouchMouseInput: TouchMouseInput,
    SingleTouchInput: SingleTouchInput,

    Recognizer: Recognizer,
    AttrRecognizer: AttrRecognizer,
    Tap: TapRecognizer,
    Pan: PanRecognizer,
    Swipe: SwipeRecognizer,
    Pinch: PinchRecognizer,
    Rotate: RotateRecognizer,
    Press: PressRecognizer,

    on: addEventListeners,
    off: removeEventListeners,
    each: each,
    merge: merge,
    extend: extend,
    assign: assign,
    inherit: inherit,
    bindFn: bindFn,
    prefixed: prefixed
});

// this prevents errors when Hammer is loaded in the presence of an AMD
//  style loader but by script tag, not by the loader.
var freeGlobal = (typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : {})); // jshint ignore:line
freeGlobal.Hammer = Hammer;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return Hammer;
    });
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvYXBwZGF0YS5qcyIsImFwcC9qcy9ib29rZGF0YS5qcyIsImFwcC9qcy9jcm9zc2RhbnRlLmpzIiwiYXBwL2pzL2RvbS5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvY2FybHlsZS5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvaXRhbGlhbi5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvbG9uZ2ZlbGxvdy5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvbm9ydG9uLmpzIiwiYXBwL2pzL3RyYW5zbGF0aW9ucy93cmlnaHQuanMiLCJub2RlX21vZHVsZXMvZmFzdGNsaWNrL2xpYi9mYXN0Y2xpY2suanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBSSxrQkFBa0IsUUFBUSxZQUFSLEVBQXNCLGVBQTVDO0FBQ0EsSUFBSSxjQUFjLFFBQVEsWUFBUixFQUFzQixXQUF4Qzs7QUFFQSxJQUFJLFVBQVU7QUFDYix5QkFBd0IsRUFEWCxFQUNrQjtBQUMvQixxQkFBb0IsQ0FGUDtBQUdiLG1CQUFrQixnQkFBZ0IsTUFIckI7QUFJYixlQUFjLENBSkQ7QUFLYixhQUFZLFlBQVksTUFMWDtBQU1iLGFBQVksRUFOQztBQU9iLFlBQVcsT0FBTyxVQVBMO0FBUWIsYUFBWSxPQUFPLFdBQVAsR0FBcUIsRUFScEI7QUFTYixjQUFhLE9BQU8sVUFUUDtBQVViLGVBQWMsT0FBTyxXQVZSO0FBV2IsWUFBVyxPQUFPLFVBWEw7QUFZYixjQUFhLE1BWkE7QUFhYixZQUFXLEtBYkU7QUFjYixvQkFBbUIsQ0FkTixFQWNTO0FBQ3RCLGVBQWMsQ0FmRCxFQWVVO0FBQ3ZCLFdBQVUsRUFoQkc7QUFpQmIsV0FBVSxFQWpCRztBQWtCYixrQkFBaUIsZUFsQko7QUFtQmIsY0FBYTtBQW5CQSxDQUFkOztBQXNCQSxPQUFPLE9BQVAsR0FBaUIsT0FBakI7Ozs7O0FDaENBLElBQUksY0FBYyxDQUFDLFlBQUQsRUFBYyxTQUFkLEVBQXdCLFNBQXhCLEVBQWtDLFNBQWxDLENBQWxCOztBQUVBLElBQUksa0JBQWtCLENBQ3JCLEVBQUMsaUJBQWdCLE9BQWpCO0FBQ0MseUJBQXVCLE9BRHhCO0FBRUMsd0JBQXNCLGlCQUZ2QjtBQUdDLHFCQUFtQixpQkFIcEI7QUFJQyxVQUFRLENBSlQsRUFEcUIsRUFNckIsRUFBQyxpQkFBZ0IsWUFBakI7QUFDQyx5QkFBdUIsWUFEeEI7QUFFQyx3QkFBc0IsNkJBRnZCO0FBR0MscUJBQW1CLG1CQUhwQjtBQUlDLFVBQVEsQ0FKVCxFQU5xQixFQVdyQixFQUFDLGlCQUFnQixRQUFqQjtBQUNDLHlCQUF1QixRQUR4QjtBQUVDLHdCQUFzQixzQkFGdkI7QUFHQyxxQkFBbUIsY0FIcEI7QUFJQyxVQUFRLENBSlQsRUFYcUIsRUFnQnJCLEVBQUMsaUJBQWdCLFFBQWpCO0FBQ0MseUJBQXVCLFFBRHhCO0FBRUMsd0JBQXNCLGtCQUZ2QjtBQUdDLHFCQUFtQixlQUhwQjtBQUlDLFVBQVEsQ0FKVCxFQWhCcUIsRUFxQnJCLEVBQUMsaUJBQWdCLFNBQWpCO0FBQ0MseUJBQXVCLFNBRHhCO0FBRUMsd0JBQXNCLHVCQUZ2QjtBQUdDLHFCQUFtQixlQUhwQjtBQUlDLFVBQVEsQ0FKVCxFQXJCcUIsQ0FBdEI7O0FBNEJBLE9BQU8sT0FBUCxDQUFlLFdBQWYsR0FBNkIsV0FBN0I7QUFDQSxPQUFPLE9BQVAsQ0FBZSxlQUFmLEdBQWlDLGVBQWpDOzs7QUMvQkE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxJQUFJLFNBQVMsUUFBUSxVQUFSLENBQWI7QUFDQSxJQUFJLFlBQVksUUFBUSxXQUFSLENBQWhCLEMsQ0FBc0M7O0FBRXRDLElBQUksTUFBTSxRQUFRLE9BQVIsQ0FBVjtBQUNBLElBQUksVUFBVSxRQUFRLFdBQVIsQ0FBZDs7QUFHQSxJQUFJLE1BQU07QUFDVCxhQUFZLHNCQUFXO0FBQUU7QUFDeEIsVUFBUSxHQUFSLENBQVksZUFBWjtBQUNBLE9BQUssVUFBTDs7QUFFQTs7QUFFQSxVQUFRLFFBQVIsQ0FBaUIsQ0FBakIsSUFBc0IsUUFBUSwyQkFBUixDQUF0QjtBQUNBLFVBQVEsUUFBUixDQUFpQixDQUFqQixJQUFzQixRQUFRLDhCQUFSLENBQXRCO0FBQ0EsVUFBUSxRQUFSLENBQWlCLENBQWpCLElBQXNCLFFBQVEsMEJBQVIsQ0FBdEI7QUFDQSxVQUFRLFFBQVIsQ0FBaUIsQ0FBakIsSUFBc0IsUUFBUSwwQkFBUixDQUF0QjtBQUNBLFVBQVEsUUFBUixDQUFpQixDQUFqQixJQUFzQixRQUFRLDJCQUFSLENBQXRCOztBQUVBLFVBQVEsUUFBUixDQUFpQixJQUFqQixHQUF3QixTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsQ0FBeEI7QUFDQSxVQUFRLFFBQVIsQ0FBaUIsSUFBakIsR0FBd0IsU0FBUyxjQUFULENBQXdCLE1BQXhCLENBQXhCO0FBQ0EsVUFBUSxRQUFSLENBQWlCLE9BQWpCLEdBQTJCLFNBQVMsY0FBVCxDQUF3QixTQUF4QixDQUEzQjtBQUNBLFVBQVEsUUFBUixDQUFpQixJQUFqQixHQUF3QixTQUFTLGNBQVQsQ0FBd0IsTUFBeEIsQ0FBeEI7O0FBRUE7O0FBRUEsT0FBSSxJQUFJLENBQVIsSUFBYSxRQUFRLGVBQXJCLEVBQXNDO0FBQ3JDLFdBQVEsc0JBQVIsQ0FBK0IsSUFBL0IsQ0FBb0MsUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGFBQS9EO0FBQ0E7O0FBRUQ7QUFFQSxFQTFCUTtBQTJCVCxhQUFZLHNCQUFXO0FBQ3RCLFVBQVEsR0FBUixDQUFZLGlCQUFaO0FBQ0EsV0FBUyxnQkFBVCxDQUEwQixhQUExQixFQUF5QyxLQUFLLGFBQTlDLEVBQTZELEtBQTdEO0FBQ0EsU0FBTyxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxLQUFLLE1BQXZDLEVBQStDLEtBQS9DOztBQUVBOztBQUVBLE1BQUksc0JBQXNCLFFBQTFCLEVBQW9DO0FBQ25DLFlBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQVc7QUFDeEQsY0FBVSxNQUFWLENBQWlCLFNBQVMsSUFBMUI7QUFDQSxJQUZELEVBRUcsS0FGSDtBQUdBO0FBQ0QsRUF2Q1E7QUF3Q1QsVUFBUztBQUNSLGNBQVksb0JBQVMsT0FBVCxFQUFrQjtBQUM3QixXQUFRLE9BQVIsR0FBa0IsWUFBVztBQUM1QixRQUFJLE9BQUosQ0FBWSxVQUFaO0FBQ0EsSUFGRDtBQUdBLEdBTE87QUFNUixhQUFXLG1CQUFTLEVBQVQsRUFBYTtBQUN2QixNQUFHLE9BQUgsR0FBYSxVQUFTLENBQVQsRUFBWTtBQUN4QixNQUFFLGVBQUY7QUFDQSxRQUFJLFdBQVcsS0FBSyxZQUFMLENBQWtCLGlCQUFsQixDQUFmO0FBQ0EsUUFBSSxXQUFXLFNBQVMsYUFBVCxrQ0FBcUQsUUFBckQsVUFBbUUsU0FBbEY7QUFDQSxRQUFJLFNBQUo7QUFDQSxRQUFJLFNBQVMsSUFBSSxNQUFKLGtEQUFzRCxRQUF0RCxZQUFiO0FBQ0EsWUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFdBQXRCLENBQWtDLE1BQWxDO0FBQ0EsYUFBUyxjQUFULENBQXdCLFlBQXhCLEVBQXNDLE9BQXRDLEdBQWdELFlBQVc7QUFDMUQsU0FBSSxTQUFKO0FBQ0EsS0FGRDtBQUdBLElBVkQ7QUFXQSxHQWxCTztBQW1CUixjQUFZLG9CQUFTLEVBQVQsRUFBYTtBQUN4QixNQUFHLE9BQUgsR0FBYSxZQUFXO0FBQ3ZCLFFBQUksaUJBQUosQ0FBc0IsS0FBSyxFQUFMLENBQVEsT0FBUixDQUFnQixRQUFoQixFQUF5QixFQUF6QixDQUF0QixFQUFtRCxTQUFTLGNBQVQsQ0FBd0IsS0FBSyxFQUE3QixFQUFpQyxPQUFwRjtBQUNBLElBRkQ7QUFHQSxHQXZCTztBQXdCUixrQkFBZ0Isd0JBQVMsRUFBVCxFQUFhO0FBQzVCLE1BQUcsT0FBSCxHQUFhLFlBQVc7QUFDdkIsYUFBUyxjQUFULFlBQWlDLEtBQUssRUFBdEMsRUFBNEMsT0FBNUMsR0FBc0QsQ0FBQyxTQUFTLGNBQVQsWUFBaUMsS0FBSyxFQUF0QyxFQUE0QyxPQUFuRztBQUNBLFFBQUksaUJBQUosQ0FBc0IsS0FBSyxFQUEzQixFQUE4QixTQUFTLGNBQVQsWUFBaUMsS0FBSyxFQUF0QyxFQUE0QyxPQUExRTtBQUNBLElBSEQ7QUFJQTtBQTdCTyxFQXhDQTtBQXVFVCxnQkFBZSx5QkFBVztBQUN6QixNQUFJLFVBQUo7O0FBRUE7QUFDQSxXQUFTLGNBQVQsQ0FBd0IsU0FBeEIsRUFBbUMsT0FBbkMsR0FBNkMsWUFBWTtBQUN4RCxPQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFSLEdBQTJCLENBQXZDLEVBQXlDLFFBQVEsWUFBakQ7QUFDQSxHQUZEO0FBR0EsV0FBUyxjQUFULENBQXdCLFNBQXhCLEVBQW1DLE9BQW5DLEdBQTZDLFlBQVk7QUFDeEQsT0FBSSxPQUFKLENBQVksUUFBUSxrQkFBUixHQUEyQixDQUF2QyxFQUF5QyxRQUFRLFlBQWpEO0FBQ0EsR0FGRDtBQUdBLFdBQVMsY0FBVCxDQUF3QixPQUF4QixFQUFpQyxPQUFqQyxHQUEyQyxZQUFZO0FBQ3RELE9BQUksT0FBSixDQUFZLFFBQVEsa0JBQXBCLEVBQXVDLFFBQVEsWUFBUixHQUFxQixDQUE1RCxFQUE4RCxDQUE5RDtBQUNBLEdBRkQ7QUFHQSxXQUFTLGNBQVQsQ0FBd0IsU0FBeEIsRUFBbUMsT0FBbkMsR0FBNkMsWUFBWTtBQUN4RCxPQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFwQixFQUF1QyxRQUFRLFlBQVIsR0FBcUIsQ0FBNUQsRUFBOEQsQ0FBOUQ7QUFDQSxHQUZEO0FBR0E7O0FBRUEsV0FBUyxjQUFULENBQXdCLFdBQXhCLEVBQXFDLE9BQXJDLEdBQStDLFlBQVc7QUFDekQsT0FBSSxPQUFKLENBQVksT0FBWjtBQUNBLEdBRkQ7QUFHQSxXQUFTLGNBQVQsQ0FBd0IsVUFBeEIsRUFBb0MsT0FBcEMsR0FBOEMsWUFBVztBQUN4RCxPQUFJLE9BQUosQ0FBWSxNQUFaO0FBQ0EsR0FGRDtBQUdBLFdBQVMsY0FBVCxDQUF3QixTQUF4QixFQUFtQyxPQUFuQyxHQUE2QyxZQUFXO0FBQ3ZELE9BQUksV0FBSixDQUFnQixNQUFoQixFQUF1QixXQUF2QjtBQUNBLE9BQUksUUFBSixDQUFhLFlBQWIsRUFBMEIsS0FBMUI7QUFDQSxPQUFJLFdBQUosQ0FBZ0IsVUFBaEIsRUFBMkIsS0FBM0I7QUFDQSxXQUFRLFNBQVIsR0FBb0IsS0FBcEI7QUFDQSxHQUxEO0FBTUEsV0FBUyxhQUFULENBQXVCLFlBQXZCLEVBQXFDLE9BQXJDLEdBQStDLFlBQVc7QUFDekQsT0FBSSxRQUFKLENBQWEsTUFBYixFQUFvQixXQUFwQjtBQUNBLE9BQUksV0FBSixDQUFnQixZQUFoQixFQUE2QixLQUE3QjtBQUNBLE9BQUksUUFBSixDQUFhLFVBQWIsRUFBd0IsS0FBeEI7QUFDQSxXQUFRLFNBQVIsR0FBb0IsSUFBcEI7QUFDQSxHQUxEOztBQU9BLFdBQVMsZ0JBQVQsQ0FBMEIsaUJBQTFCLEVBQTZDLE9BQTdDLENBQXFELElBQUksT0FBSixDQUFZLFVBQWpFO0FBQ0Y7O0FBRUM7O0FBRUMsZUFBYSxJQUFJLE1BQUosQ0FBVyxRQUFRLFFBQVIsQ0FBaUIsSUFBNUIsQ0FBYjtBQUNBLGFBQVcsR0FBWCxDQUFlLE9BQWYsRUFBd0IsR0FBeEIsQ0FBNEIsRUFBRSxXQUFXLE9BQU8sYUFBcEIsRUFBNUI7QUFDQSxhQUFXLEVBQVgsQ0FBYyxXQUFkLEVBQTBCLFlBQVc7QUFDcEMsT0FBSSxPQUFKLENBQVksUUFBUSxrQkFBUixHQUEyQixDQUF2QyxFQUF5QyxRQUFRLFlBQWpEO0FBQ0EsR0FGRCxFQUVHLEVBRkgsQ0FFTSxZQUZOLEVBRW1CLFlBQVc7QUFDN0IsT0FBSSxPQUFKLENBQVksUUFBUSxrQkFBUixHQUEyQixDQUF2QyxFQUF5QyxRQUFRLFlBQWpEO0FBQ0EsR0FKRDs7QUFNQSxhQUFXLEVBQVgsQ0FBYyxXQUFkLEVBQTBCLFlBQVc7QUFDcEMsT0FBRyxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsUUFBdEIsS0FBbUMsQ0FBdEMsRUFBeUM7QUFDeEMsUUFBSSxPQUFKLENBQVksUUFBUSxrQkFBcEIsRUFBdUMsUUFBUSxZQUFSLEdBQXFCLENBQTVELEVBQThELENBQTlELEVBRHdDLENBQzJCO0FBQ25FO0FBQ0QsR0FKRCxFQUlHLEVBSkgsQ0FJTSxTQUpOLEVBSWdCLFlBQVc7QUFDN0I7QUFDQTs7QUFFRyxPQUFHLEtBQUssR0FBTCxDQUFTLFFBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixTQUF0QixHQUFrQyxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsWUFBeEQsR0FBdUUsUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFlBQXRHLElBQXNILENBQXpILEVBQTRIO0FBQzNILFFBQUksT0FBSixDQUFZLFFBQVEsa0JBQXBCLEVBQXVDLFFBQVEsWUFBUixHQUFxQixDQUE1RDtBQUNBO0FBQ0QsR0FYRDs7QUFhRDs7QUFFQyxXQUFTLElBQVQsQ0FBYyxTQUFkLEdBQTBCLFVBQVMsQ0FBVCxFQUFZO0FBQ3JDLEtBQUUsY0FBRjtBQUNBLE9BQUcsQ0FBQyxFQUFFLE9BQUYsSUFBYSxFQUFFLEtBQWhCLE1BQTJCLEVBQTlCLEVBQWtDO0FBQ2pDLFFBQUksUUFBSixDQUFhLFVBQWIsRUFBd0IsSUFBeEI7QUFDQSxRQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFSLEdBQTJCLENBQXZDLEVBQXlDLFFBQVEsWUFBakQ7QUFDQTtBQUNELE9BQUcsQ0FBQyxFQUFFLE9BQUYsSUFBYSxFQUFFLEtBQWhCLE1BQTJCLEVBQTlCLEVBQWtDO0FBQ2pDLFFBQUksUUFBSixDQUFhLFVBQWIsRUFBd0IsSUFBeEI7QUFDQSxRQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFSLEdBQTJCLENBQXZDLEVBQXlDLFFBQVEsWUFBakQ7QUFDQTtBQUNELE9BQUcsQ0FBQyxFQUFFLE9BQUYsSUFBYSxFQUFFLEtBQWhCLE1BQTJCLEVBQTlCLEVBQWtDO0FBQ2pDLFFBQUksUUFBSixDQUFhLFFBQWIsRUFBc0IsSUFBdEI7QUFDQSxRQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFwQixFQUF1QyxRQUFRLFlBQVIsR0FBcUIsQ0FBNUQ7QUFDQTtBQUNELE9BQUcsQ0FBQyxFQUFFLE9BQUYsSUFBYSxFQUFFLEtBQWhCLE1BQTJCLEVBQTlCLEVBQWtDO0FBQ2pDLFFBQUksUUFBSixDQUFhLFVBQWIsRUFBd0IsSUFBeEI7QUFDQSxRQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFwQixFQUF1QyxRQUFRLFlBQVIsR0FBcUIsQ0FBNUQsRUFBOEQsQ0FBOUQ7QUFDQTtBQUNELEdBbEJEO0FBbUJBLFdBQVMsSUFBVCxDQUFjLE9BQWQsR0FBd0IsVUFBUyxDQUFULEVBQVk7QUFDbkMsS0FBRSxjQUFGO0FBQ0EsT0FBSSxXQUFKLENBQWdCLFNBQWhCLEVBQTBCLElBQTFCO0FBQ0EsR0FIRDs7QUFLRDs7QUFFQyxXQUFTLGFBQVQsQ0FBdUIsV0FBdkIsRUFBb0MsT0FBcEMsR0FBOEMsWUFBWTtBQUN6RCxPQUFJLE9BQUosQ0FBWSxNQUFaO0FBQ0EsR0FGRDtBQUdBLFdBQVMsYUFBVCxDQUF1QixjQUF2QixFQUF1QyxPQUF2QyxHQUFpRCxZQUFZO0FBQzVELE9BQUcsUUFBUSxXQUFSLElBQXVCLFVBQTFCLEVBQXNDO0FBQ3pDO0FBQ0ksUUFBSSxPQUFKLENBQVksTUFBWjtBQUNBLElBSEQsTUFHTztBQUNOLFFBQUksY0FBSjtBQUNBLFFBQUksT0FBSixDQUFZLFVBQVo7QUFDQTtBQUNELEdBUkQ7QUFTQSxVQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsT0FBdEIsR0FBZ0MsWUFBWTtBQUMzQyxPQUFJLFNBQUo7QUFDQSxHQUZEO0FBR0EsRUFqTFE7QUFrTFQsYUFBWSxzQkFBVztBQUN0QixNQUFJLFFBQVEsQ0FBWjtBQUNBLE1BQUksUUFBUSxTQUFTLGdCQUFULENBQTBCLE9BQTFCLENBQVo7O0FBRUEsT0FBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksTUFBTSxNQUF6QixFQUFpQyxHQUFqQyxFQUFzQztBQUNyQyxPQUFJLFdBQVcsTUFBTSxDQUFOLEVBQVMsUUFBeEI7QUFDQSxRQUFJLElBQUksSUFBRSxDQUFWLEVBQWEsSUFBSSxTQUFTLE1BQTFCLEVBQWtDLEdBQWxDLEVBQXVDO0FBQ3RDLFFBQUcsSUFBSSxRQUFKLENBQWEsU0FBUyxDQUFULENBQWIsRUFBeUIsVUFBekIsQ0FBSCxFQUF5QztBQUN4QyxhQUFRLEdBQVIsQ0FBWSxjQUFZLEtBQXhCO0FBQ0EsY0FBUyxDQUFULEVBQVksWUFBWixDQUF5QixpQkFBekIsRUFBNEMsS0FBNUM7QUFDQTtBQUNELFFBQUcsSUFBSSxRQUFKLENBQWEsU0FBUyxDQUFULENBQWIsRUFBeUIsUUFBekIsQ0FBSCxFQUF1QztBQUN0QyxhQUFRLEdBQVIsQ0FBWSxZQUFVLEtBQXRCO0FBQ0EsY0FBUyxDQUFULEVBQVksWUFBWixDQUF5QixpQkFBekIsRUFBNEMsS0FBNUM7QUFDQSxTQUFJLE9BQUosQ0FBWSxTQUFaLENBQXNCLFNBQVMsQ0FBVCxDQUF0QjtBQUNBO0FBQ0Q7QUFDRDtBQUNBO0FBQ0QsRUFyTVE7QUFzTVQsU0FBUSxrQkFBVztBQUNsQixVQUFRLFdBQVIsR0FBc0IsT0FBTyxVQUE3QjtBQUNBLFVBQVEsWUFBUixHQUF1QixPQUFPLFdBQTlCO0FBQ0EsVUFBUSxHQUFSLDhDQUF1RCxRQUFRLFdBQS9ELFNBQThFLFFBQVEsWUFBdEY7QUFDQSxVQUFRLFNBQVIsR0FBb0IsUUFBUSxXQUE1QjtBQUNBLFVBQVEsVUFBUixHQUFxQixRQUFRLFlBQVIsR0FBdUIsU0FBUyxjQUFULENBQXdCLFFBQXhCLEVBQWtDLFlBQTlFOztBQUVBLE1BQUksUUFBSixDQUFhLE9BQWIsRUFBcUIsUUFBUSxTQUFSLEdBQW9CLFFBQVEsVUFBNUIsR0FBeUMsV0FBekMsR0FBdUQsVUFBNUU7QUFDQSxNQUFJLFdBQUosQ0FBZ0IsT0FBaEIsRUFBd0IsUUFBUSxTQUFSLEdBQW9CLFFBQVEsVUFBNUIsR0FBeUMsVUFBekMsR0FBc0QsV0FBOUU7O0FBRUEsVUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLEtBQXRCLENBQTRCLEtBQTVCLEdBQW9DLFFBQVEsU0FBUixHQUFrQixJQUF0RDtBQUNBLFVBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixLQUF0QixDQUE0QixNQUE1QixHQUFxQyxRQUFRLFlBQVIsR0FBcUIsSUFBMUQ7QUFDQSxVQUFRLFFBQVIsQ0FBaUIsT0FBakIsQ0FBeUIsS0FBekIsQ0FBK0IsS0FBL0IsR0FBdUMsUUFBUSxTQUFSLEdBQWtCLElBQXpEO0FBQ0EsVUFBUSxRQUFSLENBQWlCLE9BQWpCLENBQXlCLEtBQXpCLENBQStCLE1BQS9CLEdBQXdDLFFBQVEsVUFBUixHQUFtQixJQUEzRDs7QUFFQSxVQUFRLFVBQVIsR0FBcUIsUUFBUSxXQUFSLEdBQW9CLEVBQXpDO0FBQ0EsVUFBUSxTQUFSLEdBQW9CLFFBQVEsV0FBNUI7QUFDQSxNQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFwQixFQUF1QyxRQUFRLFlBQS9DO0FBQ0EsRUF4TlE7QUF5TlQsVUFBUyxpQkFBUyxRQUFULEVBQW1CLFFBQW5CLEVBQTZCLFVBQTdCLEVBQXlDO0FBQ2pELFVBQVEsR0FBUix5QkFBa0MsUUFBbEMsZ0JBQXFELFFBQXJEO0FBQ0EsTUFBSSxjQUFjLEtBQWxCOztBQUVEOztBQUVDLE1BQUcsUUFBUSxXQUFSLElBQXVCLE1BQTFCLEVBQWtDO0FBQ2pDLE9BQUcsV0FBVyxRQUFRLGtCQUFuQixLQUEwQyxDQUE3QyxFQUFnRDtBQUMvQyxrQkFBYyxJQUFkO0FBQ0EsaUJBQWMsUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFNBQXZCLENBQWlDLHdDQUFqQyxHQUEyRSxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsWUFBOUc7QUFDQSxZQUFRLEdBQVIsQ0FBWSxVQUFaO0FBQ0E7O0FBRUQsT0FBRyxZQUFZLFFBQVEsZ0JBQXZCLEVBQXlDO0FBQ3hDLGVBQVcsQ0FBWDtBQUNBO0FBQ0QsT0FBRyxXQUFXLENBQWQsRUFBaUI7QUFDaEIsZUFBVyxRQUFRLGdCQUFSLEdBQXlCLENBQXBDO0FBQ0E7QUFDRCxPQUFHLFlBQVksUUFBUSxVQUF2QixFQUFtQztBQUNsQyxlQUFXLENBQVg7QUFDQTtBQUNELE9BQUcsV0FBVyxDQUFkLEVBQWlCO0FBQ2hCLGVBQVcsUUFBUSxVQUFSLEdBQW1CLENBQTlCO0FBQ0E7O0FBRUg7O0FBRUUsUUFBSSxJQUFJLElBQUUsQ0FBVixFQUFhLElBQUksUUFBUSxlQUFSLENBQXdCLE1BQXpDLEVBQWlELEdBQWpELEVBQXNEO0FBQ3JELFFBQUcsUUFBUSxzQkFBUixDQUErQixRQUEvQixLQUE0QyxRQUFRLGVBQVIsQ0FBd0IsQ0FBeEIsRUFBMkIsYUFBMUUsRUFBeUY7QUFDeEYsZ0JBQVcsQ0FBWDtBQUNBO0FBQ0Q7QUFDRCxXQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsU0FBdEIsR0FBa0MsSUFBSSxRQUFKLENBQWEsUUFBYixFQUF1QixRQUF2QixDQUFsQztBQUNBLE9BQUksV0FBSixDQUFnQixPQUFoQixFQUF3QixRQUFRLGVBQVIsQ0FBd0IsUUFBUSxrQkFBaEMsRUFBb0QsZ0JBQTVFO0FBQ0EsT0FBSSxRQUFKLENBQWEsT0FBYixFQUFxQixRQUFRLGVBQVIsQ0FBd0IsUUFBeEIsRUFBa0MsZ0JBQXZEO0FBQ0EsT0FBSSxVQUFKO0FBQ0EsV0FBUSxrQkFBUixHQUE2QixRQUE3QjtBQUNBLFdBQVEsWUFBUixHQUF1QixRQUF2Qjs7QUFFQSxPQUFHLFFBQVEsWUFBUixHQUF1QixDQUExQixFQUE2QjtBQUM1QixhQUFTLGNBQVQsQ0FBd0IsVUFBeEIsRUFBb0MsU0FBcEMsR0FBZ0QsUUFBUSxlQUFSLENBQXdCLFFBQVEsa0JBQWhDLEVBQW9ELG9CQUFwRCw2QkFBNkYsUUFBUSxZQUFyRyxlQUFoRDtBQUNBLElBRkQsTUFFTztBQUNOLGFBQVMsY0FBVCxDQUF3QixVQUF4QixFQUFvQyxTQUFwQyxHQUFnRCxRQUFoRDtBQUNBOztBQUVELE9BQUksVUFBSjs7QUFFSDtBQUNBOztBQUVHLE9BQUcsV0FBSCxFQUFnQjs7QUFFakI7QUFDQTs7QUFFRSxRQUFJLFdBQVcsSUFBSSxPQUFKLENBQVksYUFBYSxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsWUFBL0MsQ0FBZjtBQUNBLFlBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixTQUF0QixHQUFrQyxRQUFsQztBQUNBLElBUEQsTUFPTztBQUNOLFFBQUcsYUFBYSxDQUFoQixFQUFtQjtBQUNsQixhQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsU0FBdEIsR0FBa0MsUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFlBQXhEO0FBQ0EsS0FGRCxNQUVPO0FBQ04sYUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFNBQXRCLEdBQWtDLENBQWxDO0FBQ0E7QUFDRDtBQUNEO0FBQ0QsTUFBSSxlQUFKO0FBQ0EsRUE1UlE7QUE2UlQsVUFBUyxpQkFBUyxNQUFULEVBQWlCOztBQUV6Qjs7QUFFQSxTQUFPLFFBQVEsVUFBUixHQUFxQixLQUFLLEtBQUwsQ0FBVyxTQUFTLFFBQVEsVUFBNUIsQ0FBNUI7QUFFQSxFQW5TUTtBQW9TVCxhQUFZLHNCQUFXO0FBQ3RCLE1BQUksT0FBTyxTQUFTLGdCQUFULENBQTBCLFNBQTFCLENBQVg7QUFDQSxNQUFJLENBQUosRUFBTyxHQUFQLEVBQVksT0FBWixFQUFxQixZQUFyQjtBQUNBLE1BQUksV0FBVyxDQUFmOztBQUVBLE1BQUcsSUFBSSxRQUFKLENBQWEsUUFBUSxRQUFSLENBQWlCLElBQTlCLEVBQW1DLFFBQW5DLENBQUgsRUFBaUQ7O0FBRW5EOztBQUVHLFdBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixLQUF0QixDQUE0QixXQUE1QixHQUEwQyxDQUExQztBQUNBLFFBQUksSUFBRSxDQUFOLEVBQVMsSUFBRSxLQUFLLE1BQWhCLEVBQXdCLEdBQXhCLEVBQTZCO0FBQzVCLFVBQU0sS0FBSyxDQUFMLENBQU47QUFDQSxRQUFJLEtBQUosQ0FBVSxPQUFWLEdBQW9CLGNBQXBCO0FBQ0EsUUFBRyxJQUFJLFdBQUosR0FBa0IsUUFBckIsRUFBK0I7QUFDOUIsZ0JBQVcsSUFBSSxXQUFKLEdBQWtCLEVBQTdCO0FBQ0E7QUFDRCxRQUFJLEtBQUosQ0FBVSxPQUFWLEdBQW9CLE9BQXBCO0FBQ0E7O0FBRUQsV0FBUSxHQUFSLENBQVksaUJBQWlCLFFBQVEsU0FBckM7QUFDQSxXQUFRLEdBQVIsQ0FBWSxnQkFBZ0IsUUFBNUI7O0FBRUEsV0FBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLEtBQXRCLENBQTRCLFdBQTVCLEdBQTBDLENBQUMsUUFBUSxTQUFSLEdBQW9CLFFBQXJCLElBQStCLENBQS9CLEdBQWlDLElBQTNFO0FBQ0EsV0FBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLEtBQXRCLENBQTRCLFlBQTVCLEdBQTJDLENBQUMsUUFBUSxTQUFSLEdBQW9CLFFBQXJCLElBQStCLENBQS9CLEdBQWlDLElBQTVFO0FBQ0EsR0FuQkQsTUFtQk87O0FBRVI7O0FBRUUsa0JBQWUsRUFBZixDQUpNLENBSWE7O0FBRW5CLFdBQVEsR0FBUixDQUFZLGlCQUFpQixRQUFRLFNBQXJDO0FBQ0EsV0FBUSxHQUFSLENBQVksb0JBQW9CLFlBQWhDO0FBQ0EsV0FBUSxHQUFSLENBQVksaUJBQWlCLFFBQVEsVUFBckM7O0FBRUY7QUFDQTs7QUFFRSxhQUFVLENBQUMsTUFBTSxZQUFQLElBQXFCLENBQS9CO0FBQ0Y7Ozs7OztBQU1FLFdBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixLQUF0QixDQUE0QixXQUE1QixHQUEwQyxVQUFRLElBQWxEO0FBQ0EsV0FBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLEtBQXRCLENBQTRCLFlBQTVCLEdBQTJDLFVBQVEsSUFBbkQ7QUFDRjtBQUNFO0FBRUQsRUFyVlE7QUFzVlQsWUFBVyxxQkFBVztBQUNyQixNQUFJLGdCQUFKLENBQXFCLGFBQXJCO0FBQ0EsRUF4VlE7QUF5VlQsaUJBQWdCLDBCQUFXO0FBQzFCLE1BQUksTUFBSixFQUFZLENBQVosRUFBZSxDQUFmLEVBQWtCLGNBQWxCOztBQUVEOztBQUVDLE1BQUksZ0JBQUosQ0FBcUIsaUJBQXJCO0FBQ0EsV0FBUyxJQUFJLE1BQUosQ0FBVywrQkFBWCxDQUFUO0FBQ0EsV0FBUyxjQUFULENBQXdCLG1CQUF4QixFQUE2QyxXQUE3QyxDQUF5RCxNQUF6RDtBQUNBLG1CQUFpQixTQUFTLGFBQVQsQ0FBdUIsaUJBQXZCLENBQWpCO0FBQ0EsT0FBSSxDQUFKLElBQVMsUUFBUSxlQUFqQixFQUFrQztBQUNqQyxZQUFTLElBQUksTUFBSiw4Q0FBbUQsUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGFBQTlFLHdCQUE0RyxRQUFRLGVBQVIsQ0FBd0IsQ0FBeEIsRUFBMkIsYUFBdkksWUFBMEosUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLG1CQUFyTCxrQkFBVDtBQUNBLGtCQUFlLFdBQWYsQ0FBMkIsTUFBM0I7QUFDQSxZQUFTLGNBQVQsQ0FBd0IsV0FBUyxRQUFRLGVBQVIsQ0FBd0IsQ0FBeEIsRUFBMkIsYUFBNUQsRUFBMkUsT0FBM0UsR0FBc0YsUUFBUSxzQkFBUixDQUErQixPQUEvQixDQUF1QyxRQUFRLGVBQVIsQ0FBd0IsQ0FBeEIsRUFBMkIsYUFBbEUsSUFBbUYsQ0FBQyxDQUExSztBQUNBOztBQUVELFdBQVMsZ0JBQVQsQ0FBMEIsc0NBQTFCLEVBQWtFLE9BQWxFLENBQTBFLElBQUksT0FBSixDQUFZLFVBQXRGO0FBQ0E7QUFDQSxXQUFTLGdCQUFULENBQTBCLHNCQUExQixFQUFrRCxPQUFsRCxDQUEwRCxJQUFJLE9BQUosQ0FBWSxjQUF0RTtBQUNBOztBQUVEOztBQUVDLE1BQUksZ0JBQUosQ0FBcUIsWUFBckI7QUFDQSxXQUFTLElBQUksTUFBSixDQUFXLDJLQUFYLENBQVQ7QUFDQSxXQUFTLGNBQVQsQ0FBd0IsZUFBeEIsRUFBeUMsV0FBekMsQ0FBcUQsTUFBckQ7QUFDQSxPQUFJLElBQUksQ0FBUixFQUFXLElBQUksUUFBUSxVQUF2QixFQUFtQyxHQUFuQyxFQUF3QztBQUN2QyxZQUFTLElBQUksTUFBSix3QkFBK0IsQ0FBL0IsWUFBdUMsUUFBUSxZQUFSLElBQXdCLENBQXpCLEdBQThCLFVBQTlCLEdBQTJDLEVBQWpGLFVBQXdGLFFBQVEsV0FBUixDQUFvQixDQUFwQixDQUF4RixlQUFUO0FBQ0EsWUFBUyxjQUFULENBQXdCLGFBQXhCLEVBQXVDLFdBQXZDLENBQW1ELE1BQW5EO0FBQ0E7QUFDRCxPQUFJLENBQUosSUFBUyxRQUFRLHNCQUFqQixFQUF5QztBQUN4QyxRQUFJLElBQUksQ0FBUixFQUFXLElBQUksUUFBUSxlQUFSLENBQXdCLE1BQXZDLEVBQStDLEdBQS9DLEVBQW9EO0FBQ25ELFFBQUcsUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGFBQTNCLElBQTRDLFFBQVEsc0JBQVIsQ0FBK0IsQ0FBL0IsQ0FBL0MsRUFBa0Y7QUFDakYsY0FBUyxJQUFJLE1BQUosc0JBQTZCLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUF4RCxZQUE0RSxRQUFRLGtCQUFSLElBQThCLENBQS9CLEdBQW9DLFVBQXBDLEdBQWlELEVBQTVILFVBQW1JLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixtQkFBOUosZUFBVDtBQUNBLGNBQVMsY0FBVCxDQUF3QixrQkFBeEIsRUFBNEMsV0FBNUMsQ0FBd0QsTUFBeEQ7QUFDQTtBQUNEO0FBQ0Q7O0FBRUQsV0FBUyxhQUFULENBQXVCLFdBQXZCLEVBQW9DLE9BQXBDLEdBQThDLFlBQVk7QUFDekQsT0FBSSxXQUFXLFNBQVMsY0FBVCxDQUF3QixrQkFBeEIsQ0FBZjtBQUNBLE9BQUksWUFBWSxTQUFTLE9BQVQsQ0FBaUIsU0FBUyxhQUExQixFQUF5QyxFQUF6QyxDQUE0QyxNQUE1QyxDQUFtRCxDQUFuRCxDQUFoQjtBQUNBLGNBQVcsU0FBUyxjQUFULENBQXdCLGFBQXhCLENBQVg7QUFDQSxPQUFJLFlBQVksU0FBUyxPQUFULENBQWlCLFNBQVMsYUFBMUIsRUFBeUMsRUFBekMsQ0FBNEMsTUFBNUMsQ0FBbUQsQ0FBbkQsQ0FBaEI7QUFDQSxRQUFJLElBQUksQ0FBUixFQUFXLElBQUksUUFBUSxlQUFSLENBQXdCLE1BQXZDLEVBQStDLEdBQS9DLEVBQW9EO0FBQ25ELFFBQUcsUUFBUSxzQkFBUixDQUErQixDQUEvQixLQUFxQyxTQUF4QyxFQUFtRDtBQUNsRCxTQUFJLE9BQUosQ0FBWSxNQUFaO0FBQ0EsU0FBSSxPQUFKLENBQVksQ0FBWixFQUFjLFNBQWQsRUFBd0IsQ0FBeEI7QUFDQTtBQUNEO0FBQ0QsR0FYRDtBQVlBLEVBM1lRO0FBNFlULGtCQUFpQiwyQkFBVztBQUM3QjtBQUNFLFVBQVEsR0FBUixDQUFZLHlCQUFaO0FBQ0EsRUEvWVE7QUFnWlQsb0JBQW1CLDJCQUFTLE1BQVQsRUFBaUIsS0FBakIsRUFBd0I7QUFDMUMsVUFBUSxHQUFSLENBQVksMEJBQVo7QUFDQSxPQUFJLElBQUksQ0FBUixJQUFhLFFBQVEsZUFBckIsRUFBc0M7QUFDckMsT0FBRyxVQUFVLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUF4QyxFQUF1RDtBQUN0RCxRQUFHLEtBQUgsRUFBVTtBQUNULGFBQVEsc0JBQVIsQ0FBK0IsSUFBL0IsQ0FBb0MsTUFBcEM7QUFDQSxhQUFRLGdCQUFSO0FBQ0EsS0FIRCxNQUdPO0FBQ04sU0FBRyxRQUFRLGdCQUFSLEdBQTJCLENBQTlCLEVBQWlDO0FBQ2hDLFVBQUksSUFBSSxRQUFRLHNCQUFSLENBQStCLE9BQS9CLENBQXVDLE1BQXZDLENBQVI7QUFDQSxVQUFJLElBQUksQ0FBQyxDQUFULEVBQVk7QUFDWCxlQUFRLHNCQUFSLENBQStCLE1BQS9CLENBQXNDLENBQXRDLEVBQXlDLENBQXpDO0FBQ0E7QUFDRCxjQUFRLGdCQUFSO0FBQ0EsTUFORCxNQU1PO0FBQ047QUFDQSxlQUFTLGNBQVQsQ0FBd0IsV0FBUyxPQUFPLFdBQVAsRUFBakMsRUFBdUQsT0FBdkQsR0FBaUUsSUFBakU7QUFDQTtBQUNEO0FBQ0Q7QUFDRCxPQUFJLGVBQUo7QUFDQTs7QUFFRCxNQUFJLFVBQVUsRUFBZDtBQUNBLE9BQUksQ0FBSixJQUFTLFFBQVEsZUFBakIsRUFBa0M7QUFDakMsT0FBRyxRQUFRLHNCQUFSLENBQStCLE9BQS9CLENBQXVDLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUFsRSxJQUFtRixDQUFDLENBQXZGLEVBQTBGO0FBQ3pGLFlBQVEsSUFBUixDQUFhLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUF4QztBQUNBO0FBQ0Q7QUFDRCxVQUFRLHNCQUFSLEdBQWlDLFFBQVEsS0FBUixFQUFqQztBQUNBO0FBQ0EsTUFBSSxjQUFKO0FBQ0EsRUFoYlE7QUFpYlQsVUFBUyxpQkFBUyxPQUFULEVBQWtCO0FBQzFCLE1BQUksV0FBSixDQUFnQixPQUFoQixFQUF3QixJQUF4QjtBQUNBLE1BQUksUUFBSixDQUFhLFdBQVMsT0FBdEIsRUFBOEIsSUFBOUI7QUFDQSxVQUFRLFdBQVIsR0FBc0IsT0FBdEI7QUFDQSxNQUFJLE1BQUo7QUFDQSxFQXRiUTtBQXViVCxnQkFBZSx5QkFBVztBQUN6QixVQUFRLEdBQVIsQ0FBWSxlQUFaO0FBQ0EsTUFBSSxLQUFKO0FBQ0EsRUExYlE7QUEyYlQsUUFBTyxpQkFBVztBQUNqQixNQUFJLFVBQUo7QUFDQSxNQUFJLGFBQUo7QUFDQSxNQUFJLE9BQUosQ0FBWSxNQUFaO0FBQ0E7QUEvYlEsQ0FBVjs7QUFrY0EsSUFBSSxVQUFKO0FBQ0EsSUFBSSxFQUFFLG1CQUFtQixRQUFyQixDQUFKLEVBQW9DO0FBQ25DLFNBQVEsR0FBUixDQUFZLDJCQUFaO0FBQ0EsS0FBSSxLQUFKLEdBRm1DLENBRXRCO0FBQ2I7Ozs7O0FDbGZEOztBQUVBLElBQUksTUFBTTtBQUNULFNBQVEsZ0JBQVMsT0FBVCxFQUFrQjtBQUN6QixNQUFJLE9BQU8sU0FBUyxzQkFBVCxFQUFYO0FBQ0EsTUFBSSxPQUFPLFNBQVMsYUFBVCxDQUF1QixLQUF2QixDQUFYO0FBQ0EsT0FBSyxTQUFMLEdBQWlCLE9BQWpCO0FBQ0EsU0FBTyxLQUFLLFVBQVosRUFBd0I7QUFDdkIsUUFBSyxXQUFMLENBQWlCLEtBQUssVUFBdEI7QUFDQTtBQUNELFNBQU8sSUFBUDtBQUNBLEVBVFE7QUFVVCxtQkFBa0IsMEJBQVMsY0FBVCxFQUF5QjtBQUMxQyxNQUFJLFdBQVcsU0FBUyxhQUFULENBQXVCLGNBQXZCLENBQWY7QUFDQSxNQUFHLGFBQWEsSUFBaEIsRUFBc0I7QUFDckIsWUFBUyxVQUFULENBQW9CLFdBQXBCLENBQWdDLFFBQWhDO0FBQ0E7QUFDRCxFQWZRO0FBZ0JULFdBQVUsa0JBQVMsY0FBVCxFQUF5QixPQUF6QixFQUFrQztBQUMzQyxNQUFJLFlBQVksU0FBUyxnQkFBVCxDQUEwQixjQUExQixDQUFoQjtBQUNBLE1BQUcsUUFBUSxPQUFSLENBQWdCLEdBQWhCLElBQXVCLENBQUMsQ0FBM0IsRUFBOEI7QUFDN0IsT0FBSSxVQUFVLFFBQVEsS0FBUixDQUFjLEdBQWQsQ0FBZDtBQUNBLFFBQUksSUFBSSxJQUFJLENBQVosRUFBZSxJQUFJLFFBQVEsTUFBM0IsRUFBbUMsR0FBbkMsRUFBd0M7QUFDdkMsUUFBSSxRQUFKLENBQWEsY0FBYixFQUE2QixRQUFRLENBQVIsQ0FBN0I7QUFDQTtBQUNELEdBTEQsTUFLTztBQUNOLFFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxVQUFVLE1BQTlCLEVBQXNDLEdBQXRDLEVBQTJDO0FBQzFDLGNBQVUsQ0FBVixFQUFhLFNBQWIsQ0FBdUIsR0FBdkIsQ0FBMkIsT0FBM0I7QUFDQTtBQUNEO0FBQ0QsRUE1QlE7QUE2QlQsY0FBYSxxQkFBUyxjQUFULEVBQXlCLE9BQXpCLEVBQWtDO0FBQzlDLE1BQUksWUFBWSxTQUFTLGdCQUFULENBQTBCLGNBQTFCLENBQWhCO0FBQ0EsTUFBRyxRQUFRLE9BQVIsQ0FBZ0IsR0FBaEIsSUFBdUIsQ0FBQyxDQUEzQixFQUE4QjtBQUM3QixPQUFJLFVBQVUsUUFBUSxLQUFSLENBQWMsR0FBZCxDQUFkO0FBQ0EsUUFBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksUUFBUSxNQUEzQixFQUFtQyxHQUFuQyxFQUF3QztBQUN2QyxRQUFJLFdBQUosQ0FBZ0IsY0FBaEIsRUFBZ0MsUUFBUSxDQUFSLENBQWhDO0FBQ0E7QUFDRCxHQUxELE1BS087QUFDTixRQUFLLElBQUksSUFBSSxDQUFiLEVBQWdCLElBQUksVUFBVSxNQUE5QixFQUFzQyxHQUF0QyxFQUEyQztBQUMxQyxjQUFVLENBQVYsRUFBYSxTQUFiLENBQXVCLE1BQXZCLENBQThCLE9BQTlCO0FBQ0E7QUFDRDtBQUNELEVBekNRO0FBMENULFdBQVUsa0JBQVMsT0FBVCxFQUFrQixHQUFsQixFQUF1QjtBQUNoQyxTQUFPLENBQUMsTUFBTSxRQUFRLFNBQWQsR0FBMEIsR0FBM0IsRUFBZ0MsT0FBaEMsQ0FBd0MsTUFBTSxHQUFOLEdBQVksR0FBcEQsSUFBMkQsQ0FBQyxDQUFuRTtBQUNBO0FBNUNRLENBQVY7O0FBK0NBLE9BQU8sT0FBUCxHQUFpQixHQUFqQjs7Ozs7QUNqREE7O0FBRUEsSUFBSSxVQUFVLENBQUMseUdBQUQsRUFFYixxN01BRmEsRUFJYixpNUJBSmEsRUFNYiwydkNBTmEsQ0FBZDs7QUFRQSxPQUFPLE9BQVAsR0FBaUIsT0FBakI7Ozs7O0FDVkE7O0FBRUEsSUFBSSxVQUFVLENBQUMsbUVBQUQsRUFFYiw4NVBBRmEsRUFJYiw0dlFBSmEsRUFNYiwwclBBTmEsQ0FBZDs7QUFRQSxPQUFPLE9BQVAsR0FBaUIsT0FBakI7Ozs7O0FDVkE7O0FBRUEsSUFBSSxhQUFhLENBQUMsOEVBQUQsRUFFaEIsdzBTQUZnQixFQUloQiwwc1RBSmdCLEVBTWhCLHV4U0FOZ0IsQ0FBakI7O0FBUUEsT0FBTyxPQUFQLEdBQWlCLFVBQWpCOzs7OztBQ1ZBOztBQUVBLElBQUksU0FBUyxDQUFDLHFFQUFELEVBRVosNHNOQUZZLEVBSVosd3JOQUpZLEVBTVosNmxNQU5ZLENBQWI7O0FBUUEsT0FBTyxPQUFQLEdBQWlCLE1BQWpCOzs7OztBQ1ZBOztBQUVBLElBQUksU0FBUyxDQUFDLG9FQUFELEVBRVosbThOQUZZLEVBSVosb3FPQUpZLEVBTVosMG1SQU5ZLENBQWI7O0FBUUEsT0FBTyxPQUFQLEdBQWlCLE1BQWpCOzs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3owQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gYXBwZGF0YS5qc1xuLy9cbi8vIGJhc2ljIGFwcGRhdGEg4oCTIHRoZXJlJ3MgYWxzbyBhIHRyYW5zbGF0aW9uZGF0YSBhcnJheSAobWV0YWRhdGEpIGFuZCB0ZXh0ZGF0YSAodGV4dHMpXG4vLyBpcyBpdCB3b3J0aCBmb2xkaW5nIHRoaXMgaW50byBhcHA/IElzIHRoZXJlIGEgdmFsdWUgaW4ga2VlcGluZyB0aGlzIHNlcGFyYXRlP1xuLy9cbi8vIHRoaXMgcHJvYmFibHkgbmVlZHMgc29tZSByZXdvcmtpbmc/XG5cbnZhciB0cmFuc2xhdGlvbmRhdGEgPSByZXF1aXJlKFwiLi9ib29rZGF0YVwiKS50cmFuc2xhdGlvbmRhdGE7XG52YXIgY2FudG90aXRsZXMgPSByZXF1aXJlKFwiLi9ib29rZGF0YVwiKS5jYW50b3RpdGxlcztcblxudmFyIGFwcGRhdGEgPSB7XG5cdGN1cnJlbnR0cmFuc2xhdGlvbmxpc3Q6IFtdLCAgICAvLyBsaXN0IG9mIGlkcyBvZiB0cmFuc2xhdGlvbnMgd2UncmUgY3VycmVudGx5IHVzaW5nXG5cdGN1cnJlbnR0cmFuc2xhdGlvbjogMCxcblx0dHJhbnNsYXRpb25jb3VudDogdHJhbnNsYXRpb25kYXRhLmxlbmd0aCxcblx0Y3VycmVudGNhbnRvOiAwLFxuXHRjYW50b2NvdW50OiBjYW50b3RpdGxlcy5sZW5ndGgsXG5cdGxpbmVoZWlnaHQ6IDI0LFxuXHRsZW5zd2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLFxuXHRsZW5zaGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQgLSA0MCxcblx0d2luZG93d2lkdGg6IHdpbmRvdy5pbm5lcldpZHRoLFxuXHR3aW5kb3doZWlnaHQ6IHdpbmRvdy5pbm5lckhlaWdodCxcblx0dGV4dHdpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCxcblx0Y3VycmVudHBhZ2U6IFwibGVuc1wiLFxuXHRuaWdodG1vZGU6IGZhbHNlLFxuXHRjdXJyZW50cGVyY2VudGFnZTogMCwgLy8gdGhpcyBpcyBjdXJyZW50IHBlcmNlbnRhZ2Ugb2YgcGFnZSAobWF5YmUgdGhpcyBzaG91bGQgYmUgaW4gdGVybXMgb2YgbGluZXMgb24gcGFnZT8pXG5cdGN1cnJlbnRsaW5lczogMCwgICAgICAgLy8gdGhpcyBpcyB0aGUgbnVtYmVyIG9mIGxpbmVzIGNhbGN1bGF0ZWQgdG8gYmUgb24gdGhlIHBhZ2Vcblx0ZWxlbWVudHM6IHt9LFxuXHR0ZXh0ZGF0YToge30sXG5cdHRyYW5zbGF0aW9uZGF0YTogdHJhbnNsYXRpb25kYXRhLFxuXHRjYW50b3RpdGxlczogY2FudG90aXRsZXNcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gYXBwZGF0YTtcbiIsInZhciBjYW50b3RpdGxlcyA9IFtcIlRpdGxlIHBhZ2VcIixcIkNhbnRvIDFcIixcIkNhbnRvIDJcIixcIkNhbnRvIDNcIl07XG5cbnZhciB0cmFuc2xhdGlvbmRhdGEgPSBbXG5cdHtcInRyYW5zbGF0aW9uaWRcIjpcImRhbnRlXCIsXG5cdFx0XCJ0cmFuc2xhdGlvbnNob3J0bmFtZVwiOlwiRGFudGVcIixcblx0XHRcInRyYW5zbGF0aW9uZnVsbG5hbWVcIjpcIkRhbnRlIEFsaWdoaWVyaVwiLFxuXHRcdFwidHJhbnNsYXRpb25jbGFzc1wiOlwicG9ldHJ5IG9yaWdpbmFsXCIsXG5cdFx0XCJvcmRlclwiOjB9LFxuXHR7XCJ0cmFuc2xhdGlvbmlkXCI6XCJsb25nZmVsbG93XCIsXG5cdFx0XCJ0cmFuc2xhdGlvbnNob3J0bmFtZVwiOlwiTG9uZ2ZlbGxvd1wiLFxuXHRcdFwidHJhbnNsYXRpb25mdWxsbmFtZVwiOlwiSGVucnkgV29yZHN3b3J0aCBMb25nZmVsbG93XCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmNsYXNzXCI6XCJwb2V0cnkgbG9uZ2ZlbGxvd1wiLFxuXHRcdFwib3JkZXJcIjoxfSxcblx0e1widHJhbnNsYXRpb25pZFwiOlwibm9ydG9uXCIsXG5cdFx0XCJ0cmFuc2xhdGlvbnNob3J0bmFtZVwiOlwiTm9ydG9uXCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmZ1bGxuYW1lXCI6XCJDaGFybGVzIEVsaW90IE5vcnRvblwiLFxuXHRcdFwidHJhbnNsYXRpb25jbGFzc1wiOlwibm9ydG9uIHByb3NlXCIsXG5cdFx0XCJvcmRlclwiOjJ9LFxuXHR7XCJ0cmFuc2xhdGlvbmlkXCI6XCJ3cmlnaHRcIixcblx0XHRcInRyYW5zbGF0aW9uc2hvcnRuYW1lXCI6XCJXcmlnaHRcIixcblx0XHRcInRyYW5zbGF0aW9uZnVsbG5hbWVcIjpcIlMuIEZvd2xlciBXcmlnaHRcIixcblx0XHRcInRyYW5zbGF0aW9uY2xhc3NcIjpcInBvZXRyeSB3cmlnaHRcIixcblx0XHRcIm9yZGVyXCI6M30sXG5cdHtcInRyYW5zbGF0aW9uaWRcIjpcImNhcmx5bGVcIixcblx0XHRcInRyYW5zbGF0aW9uc2hvcnRuYW1lXCI6XCJDYXJseWxlXCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmZ1bGxuYW1lXCI6XCJDYXJseWxlL09rZXkvV2lrc3RlZWRcIixcblx0XHRcInRyYW5zbGF0aW9uY2xhc3NcIjpcInByb3NlIGNhcmx5bGVcIixcblx0XHRcIm9yZGVyXCI6NH1cbl07XG5cbm1vZHVsZS5leHBvcnRzLmNhbnRvdGl0bGVzID0gY2FudG90aXRsZXM7XG5tb2R1bGUuZXhwb3J0cy50cmFuc2xhdGlvbmRhdGEgPSB0cmFuc2xhdGlvbmRhdGE7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuLy8gdmVyc2lvbiA0OiBub3cgZ29pbmcgdG8gRVM2XG5cbi8vXG4vLy8vIHBvbHlmaWxsc1xuLy9cblxuLy8gZm9yIGVhY2gsIGZyb20gaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvQXJyYXkvZm9yRWFjaFxuLy8gZG8gd2UgbmVlZCB0aGlzP1xuLypcbmlmICghQXJyYXkucHJvdG90eXBlLmZvckVhY2gpIHtcblx0QXJyYXkucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuXHRcdHZhciBULCBrO1xuXHRcdGlmICh0aGlzID09PSBudWxsKSB7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCcgdGhpcyBpcyBudWxsIG9yIG5vdCBkZWZpbmVkJyk7XG5cdFx0fVxuXHRcdHZhciBPID0gT2JqZWN0KHRoaXMpO1xuXHRcdHZhciBsZW4gPSBPLmxlbmd0aCA+Pj4gMDtcblx0XHRpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoY2FsbGJhY2sgKyAnIGlzIG5vdCBhIGZ1bmN0aW9uJyk7XG5cdFx0fVxuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuXHRcdFx0VCA9IHRoaXNBcmc7XG5cdFx0fVxuXHRcdGsgPSAwO1xuXHRcdHdoaWxlIChrIDwgbGVuKSB7XG5cdFx0XHR2YXIga1ZhbHVlO1xuXHRcdFx0aWYgKGsgaW4gTykge1xuXHRcdFx0XHRrVmFsdWUgPSBPW2tdO1xuXHRcdFx0XHRjYWxsYmFjay5jYWxsKFQsIGtWYWx1ZSwgaywgTyk7XG5cdFx0XHR9XG5cdFx0XHRrKys7XG5cdFx0fVxuXHR9O1xufVxuKi9cbnZhciBIYW1tZXIgPSByZXF1aXJlKFwiaGFtbWVyanNcIik7XG52YXIgRmFzdGNsaWNrID0gcmVxdWlyZShcImZhc3RjbGlja1wiKTtcdC8vIHdoeSBpcyB0aGlzIG5vdCB3b3JraW5nP1xuXG52YXIgZG9tID0gcmVxdWlyZShcIi4vZG9tXCIpO1xudmFyIGFwcGRhdGEgPSByZXF1aXJlKFwiLi9hcHBkYXRhXCIpO1xuXG5cbnZhciBhcHAgPSB7XG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uKCkgeyAvLyBjb3VsZCBzZXQgdGhpcyB0byBjaG9vc2UgdHJhbnNsYXRpb25zP1xuXHRcdGNvbnNvbGUubG9nKFwiaW5pdGlhbGl6aW5nIVwiKTtcblx0XHR0aGlzLmJpbmRFdmVudHMoKTtcblxuXHRcdC8vIGJhc2ljIGRvYyBzZXR1cFxuXG5cdFx0YXBwZGF0YS50ZXh0ZGF0YVswXSA9IHJlcXVpcmUoXCIuL3RyYW5zbGF0aW9ucy9pdGFsaWFuLmpzXCIpO1xuXHRcdGFwcGRhdGEudGV4dGRhdGFbMV0gPSByZXF1aXJlKFwiLi90cmFuc2xhdGlvbnMvbG9uZ2ZlbGxvdy5qc1wiKTtcblx0XHRhcHBkYXRhLnRleHRkYXRhWzJdID0gcmVxdWlyZShcIi4vdHJhbnNsYXRpb25zL25vcnRvbi5qc1wiKTtcblx0XHRhcHBkYXRhLnRleHRkYXRhWzNdID0gcmVxdWlyZShcIi4vdHJhbnNsYXRpb25zL3dyaWdodC5qc1wiKTtcblx0XHRhcHBkYXRhLnRleHRkYXRhWzRdID0gcmVxdWlyZShcIi4vdHJhbnNsYXRpb25zL2Nhcmx5bGUuanNcIik7XG5cblx0XHRhcHBkYXRhLmVsZW1lbnRzLmxlbnMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImxlbnNcIik7XG5cdFx0YXBwZGF0YS5lbGVtZW50cy5tYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpO1xuXHRcdGFwcGRhdGEuZWxlbWVudHMuY29udGVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY29udGVudFwiKTtcblx0XHRhcHBkYXRhLmVsZW1lbnRzLnRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRleHRcIik7XG5cblx0XHQvLyBzZXQgdXAgY3VycmVudCB0cmFuc2xhdGlvbiBsaXN0IChpbml0aWFsbHkgdXNlIGFsbCBvZiB0aGVtKVxuXG5cdFx0Zm9yKHZhciBpIGluIGFwcGRhdGEudHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0XHRhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QucHVzaChhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKTtcblx0XHR9XG5cblx0XHQvLyBjaGVjayB0byBzZWUgaWYgdGhlcmUgYXJlIHNhdmVkIGxvY2Fsc3RvcmFnZSwgaWYgc28sIHRha2UgdGhvc2UgdmFsdWVzXG5cblx0fSxcblx0YmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS5sb2coXCJiaW5kaW5nIGV2ZW50cyFcIik7XG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZGV2aWNlcmVhZHknLCB0aGlzLm9uRGV2aWNlUmVhZHksIGZhbHNlKTtcblx0XHR3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInJlc2l6ZVwiLCB0aGlzLnJlc2l6ZSwgZmFsc2UpO1xuXG5cdFx0Ly8gc3RhcnQgZmFzdGNsaWNrXG5cblx0XHRpZiAoJ2FkZEV2ZW50TGlzdGVuZXInIGluIGRvY3VtZW50KSB7XG5cdFx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEZhc3RjbGljay5hdHRhY2goZG9jdW1lbnQuYm9keSk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cdFx0fVxuXHR9LFxuXHRoZWxwZXJzOiB7XG5cdFx0Z29zZXR0aW5nczogZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdFx0ZWxlbWVudC5vbmNsaWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGFwcC5zZXRwYWdlKFwic2V0dGluZ3NcIik7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0c2V0dXBub3RlOiBmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwub25jbGljayA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdFx0dmFyIHRoaXNub3RlID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGVudW1iZXJcIik7XG5cdFx0XHRcdHZhciBub3RldGV4dCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoYC5ub3RldGV4dFtkYXRhLW5vdGVudW1iZXI9XCIke3RoaXNub3RlfVwiXWApLmlubmVySFRNTDtcblx0XHRcdFx0YXBwLmhpZGVub3RlcygpO1xuXHRcdFx0XHR2YXIgaW5zZXJ0ID0gZG9tLmNyZWF0ZShgPGRpdiBjbGFzcz1cIm5vdGV3aW5kb3dcIiBpZD1cIm5vdGV3aW5kb3dcIj4ke25vdGV0ZXh0fTwvZGl2PmApO1xuXHRcdFx0XHRhcHBkYXRhLmVsZW1lbnRzLm1haW4uYXBwZW5kQ2hpbGQoaW5zZXJ0KTtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJub3Rld2luZG93XCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRhcHAuaGlkZW5vdGVzKCk7XG5cdFx0XHRcdH07XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0Y2hlY2tib3hnbzogZnVuY3Rpb24oZWwpIHtcblx0XHRcdGVsLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0YXBwLmNoYW5nZXRyYW5zbGF0aW9uKHRoaXMuaWQucmVwbGFjZShcImNoZWNrLVwiLFwiXCIpLGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuaWQpLmNoZWNrZWQpO1xuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGNoZWNrYm94c3BhbmdvOiBmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgY2hlY2stJHt0aGlzLmlkfWApLmNoZWNrZWQgPSAhZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGNoZWNrLSR7dGhpcy5pZH1gKS5jaGVja2VkO1xuXHRcdFx0XHRhcHAuY2hhbmdldHJhbnNsYXRpb24odGhpcy5pZCxkb2N1bWVudC5nZXRFbGVtZW50QnlJZChgY2hlY2stJHt0aGlzLmlkfWApLmNoZWNrZWQpO1xuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cdHNldHVwY29udHJvbHM6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBoYW1tZXJ0aW1lO1xuXG5cdFx0Ly8gYnV0dG9uIGNvbnRyb2xzXG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZwcmV2XCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbi0xLGFwcGRhdGEuY3VycmVudGNhbnRvKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2bmV4dFwiKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24rMSxhcHBkYXRhLmN1cnJlbnRjYW50byk7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdnVwXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbixhcHBkYXRhLmN1cnJlbnRjYW50by0xLDApO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZkb3duXCIpLm9uY2xpY2sgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbixhcHBkYXRhLmN1cnJlbnRjYW50bysxLDApO1xuXHRcdH07XG5cdFx0Ly8gaW5pdGlhbCBzZXR0aW5nc1xuXG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhYm91dGxpbmtcIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0YXBwLnNldHBhZ2UoXCJhYm91dFwiKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVscGxpbmtcIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0YXBwLnNldHBhZ2UoXCJoZWxwXCIpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXltb2RlXCIpLm9uY2xpY2sgPSBmdW5jdGlvbigpIHtcblx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcImJvZHlcIixcIm5pZ2h0bW9kZVwiKTtcblx0XHRcdGRvbS5hZGRjbGFzcyhcIiNuaWdodG1vZGVcIixcIm9mZlwiKTtcblx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiNkYXltb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRhcHBkYXRhLm5pZ2h0bW9kZSA9IGZhbHNlO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuaWdodG1vZGVcIikub25jbGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0ZG9tLmFkZGNsYXNzKFwiYm9keVwiLFwibmlnaHRtb2RlXCIpO1xuXHRcdFx0ZG9tLnJlbW92ZWNsYXNzKFwiI25pZ2h0bW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0ZG9tLmFkZGNsYXNzKFwiI2RheW1vZGVcIixcIm9mZlwiKTtcblx0XHRcdGFwcGRhdGEubmlnaHRtb2RlID0gdHJ1ZTtcblx0XHR9O1xuXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5iYWNrdG9zZXR0aW5nc1wiKS5mb3JFYWNoKGFwcC5oZWxwZXJzLmdvc2V0dGluZ3MpO1xuLy8gRVM2OiBjYW4gd2UgY2hhbmdlZCB0aGlzIHRvIGEgZm9yIC4uLiBpbiBsb29wP1xuXG5cdC8vIHN3aXBlIGNvbnRyb2xzXG5cblx0XHRoYW1tZXJ0aW1lID0gbmV3IEhhbW1lcihhcHBkYXRhLmVsZW1lbnRzLmxlbnMpO1xuXHRcdGhhbW1lcnRpbWUuZ2V0KCdzd2lwZScpLnNldCh7IGRpcmVjdGlvbjogSGFtbWVyLkRJUkVDVElPTl9BTEwgfSk7XG5cdFx0aGFtbWVydGltZS5vbignc3dpcGVsZWZ0JyxmdW5jdGlvbigpIHtcblx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uKzEsYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHRcdH0pLm9uKCdzd2lwZXJpZ2h0JyxmdW5jdGlvbigpIHtcblx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLTEsYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHRcdH0pO1xuXG5cdFx0aGFtbWVydGltZS5vbignc3dpcGVkb3duJyxmdW5jdGlvbigpIHtcblx0XHRcdGlmKGFwcGRhdGEuZWxlbWVudHMudGV4dC5zY29sbFRvcCA9PT0gMCkge1xuXHRcdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbixhcHBkYXRhLmN1cnJlbnRjYW50by0xLDEpOyAgLy8gdGhpcyBuZWVkcyB0byBiZSBhdCB0aGUgYm90dG9tIVxuXHRcdFx0fVxuXHRcdH0pLm9uKCdzd2lwZXVwJyxmdW5jdGlvbigpIHtcbi8vIGlmIGRpZmZlcmVuY2UgYmV0d2VlbiBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiArIGhlaWdodCBvZiBmcmFtZSAmIGNvbXBsZXRlIGhlaWdodFxuLy8gb2YgY29sdW1uIGlzIGxlc3MgdGhhbiA4LCBnbyB0byB0aGUgbmV4dCBvbmVcblxuXHRcdFx0aWYoTWF0aC5hYnMoYXBwZGF0YS5lbGVtZW50cy50ZXh0LnNjcm9sbFRvcCArIGFwcGRhdGEuZWxlbWVudHMudGV4dC5jbGllbnRIZWlnaHQgLSBhcHBkYXRhLmVsZW1lbnRzLnRleHQuc2Nyb2xsSGVpZ2h0KSA8IDgpIHtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24sYXBwZGF0YS5jdXJyZW50Y2FudG8rMSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0Ly8ga2V5IGNvbnRyb2xzXG5cblx0XHRkb2N1bWVudC5ib2R5Lm9ua2V5ZG93biA9IGZ1bmN0aW9uKGUpIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGlmKChlLmtleUNvZGUgfHwgZS53aGljaCkgPT09IDM3KSB7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNuYXZwcmV2XCIsXCJvblwiKTtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24tMSxhcHBkYXRhLmN1cnJlbnRjYW50byk7XG5cdFx0XHR9XG5cdFx0XHRpZigoZS5rZXlDb2RlIHx8IGUud2hpY2gpID09PSAzOSkge1xuXHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmF2bmV4dFwiLFwib25cIik7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uKzEsYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHRcdFx0fVxuXHRcdFx0aWYoKGUua2V5Q29kZSB8fCBlLndoaWNoKSA9PT0gMzgpIHtcblx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI25hdnVwXCIsXCJvblwiKTtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24sYXBwZGF0YS5jdXJyZW50Y2FudG8tMSk7XG5cdFx0XHR9XG5cdFx0XHRpZigoZS5rZXlDb2RlIHx8IGUud2hpY2gpID09PSA0MCkge1xuXHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmF2ZG93blwiLFwib25cIik7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLGFwcGRhdGEuY3VycmVudGNhbnRvKzEsMCk7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRkb2N1bWVudC5ib2R5Lm9ua2V5dXAgPSBmdW5jdGlvbihlKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIuYnV0dG9uXCIsXCJvblwiKTtcblx0XHR9O1xuXG5cdC8vIHBhZ2UgY29udHJvbHNcblxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2dGl0bGVcIikub25jbGljayA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGFwcC5zZXRwYWdlKFwibGVuc1wiKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmF2c2V0dGluZ3NcIikub25jbGljayA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmKGFwcGRhdGEuY3VycmVudHBhZ2UgPT0gXCJzZXR0aW5nc1wiKSB7XG4vLyAgICAgIGlmKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5pbmRleE9mKGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2FwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uXS50cmFuc2xhdGlvbmlkKSA+IC0xICkge31cblx0XHRcdFx0YXBwLnNldHBhZ2UoXCJsZW5zXCIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0YXBwLnVwZGF0ZXNldHRpbmdzKCk7XG5cdFx0XHRcdGFwcC5zZXRwYWdlKFwic2V0dGluZ3NcIik7XG5cdFx0XHR9XG5cdFx0fTtcblx0XHRhcHBkYXRhLmVsZW1lbnRzLm1haW4ub25jbGljayA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGFwcC5oaWRlbm90ZXMoKTtcblx0XHR9O1xuXHR9LFxuXHRzZXR1cG5vdGVzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY291bnQgPSAwO1xuXHRcdHZhciBub3RlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIubm90ZVwiKTtcblxuXHRcdGZvcih2YXIgaSA9IDA7IGkgPCBub3Rlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGNoaWxkcmVuID0gbm90ZXNbaV0uY2hpbGRyZW47XG5cdFx0XHRmb3IodmFyIGo9MDsgaiA8IGNoaWxkcmVuLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKGRvbS5oYXNjbGFzcyhjaGlsZHJlbltqXSxcIm5vdGV0ZXh0XCIpKSB7XG5cdFx0XHRcdFx0Y29uc29sZS5sb2coXCJub3RldGV4dCBcIitjb3VudCk7XG5cdFx0XHRcdFx0Y2hpbGRyZW5bal0uc2V0QXR0cmlidXRlKFwiZGF0YS1ub3RlbnVtYmVyXCIsIGNvdW50KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZihkb20uaGFzY2xhc3MoY2hpbGRyZW5bal0sXCJub3Rlbm9cIikpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIm5vdGVubyBcIitjb3VudCk7XG5cdFx0XHRcdFx0Y2hpbGRyZW5bal0uc2V0QXR0cmlidXRlKFwiZGF0YS1ub3RlbnVtYmVyXCIsIGNvdW50KTtcblx0XHRcdFx0XHRhcHAuaGVscGVycy5zZXR1cG5vdGUoY2hpbGRyZW5bal0pO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjb3VudCsrO1xuXHRcdH1cblx0fSxcblx0cmVzaXplOiBmdW5jdGlvbigpIHtcblx0XHRhcHBkYXRhLndpbmRvd3dpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG5cdFx0YXBwZGF0YS53aW5kb3doZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG5cdFx0Y29uc29sZS5sb2coYFRoZSB3aW5kb3cgaGFzIGJlZW4gcmVzaXplZCEgTmV3IHdpZHRoOiAke2FwcGRhdGEud2luZG93d2lkdGh9LCR7YXBwZGF0YS53aW5kb3doZWlnaHR9YCk7XG5cdFx0YXBwZGF0YS5sZW5zd2lkdGggPSBhcHBkYXRhLndpbmRvd3dpZHRoO1xuXHRcdGFwcGRhdGEubGVuc2hlaWdodCA9IGFwcGRhdGEud2luZG93aGVpZ2h0IC0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZiYXJcIikuY2xpZW50SGVpZ2h0O1xuXG5cdFx0ZG9tLmFkZGNsYXNzKFwiLnBhZ2VcIixhcHBkYXRhLmxlbnN3aWR0aCA+IGFwcGRhdGEubGVuc2hlaWdodCA/IFwibGFuZHNjYXBlXCIgOiBcInBvcnRyYWl0XCIpO1xuXHRcdGRvbS5yZW1vdmVjbGFzcyhcIi5wYWdlXCIsYXBwZGF0YS5sZW5zd2lkdGggPiBhcHBkYXRhLmxlbnNoZWlnaHQgPyBcInBvcnRyYWl0XCIgOiBcImxhbmRzY2FwZVwiKTtcblxuXHRcdGFwcGRhdGEuZWxlbWVudHMubWFpbi5zdHlsZS53aWR0aCA9IGFwcGRhdGEubGVuc3dpZHRoK1wicHhcIjtcblx0XHRhcHBkYXRhLmVsZW1lbnRzLm1haW4uc3R5bGUuaGVpZ2h0ID0gYXBwZGF0YS53aW5kb3doZWlnaHQrXCJweFwiO1xuXHRcdGFwcGRhdGEuZWxlbWVudHMuY29udGVudC5zdHlsZS53aWR0aCA9IGFwcGRhdGEubGVuc3dpZHRoK1wicHhcIjtcblx0XHRhcHBkYXRhLmVsZW1lbnRzLmNvbnRlbnQuc3R5bGUuaGVpZ2h0ID0gYXBwZGF0YS5sZW5zaGVpZ2h0K1wicHhcIjtcblxuXHRcdGFwcGRhdGEubGluZWhlaWdodCA9IGFwcGRhdGEud2luZG93d2lkdGgvMjU7XG5cdFx0YXBwZGF0YS50ZXh0d2lkdGggPSBhcHBkYXRhLndpbmRvd3dpZHRoO1xuXHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLGFwcGRhdGEuY3VycmVudGNhbnRvKTtcblx0fSxcblx0c2V0bGVuczogZnVuY3Rpb24obmV3dHJhbnMsIG5ld2NhbnRvLCBwZXJjZW50YWdlKSB7XG5cdFx0Y29uc29sZS5sb2coYFNldGxlbnMgY2FsbGVkIGZvciAke25ld3RyYW5zfSwgY2FudG8gJHtuZXdjYW50b31gKTtcblx0XHR2YXIgY2hhbmdldHJhbnMgPSBmYWxzZTtcblxuXHQvLyBpZiBwYWdlIGlzbid0IHNldCB0byBcImxlbnNcIiB0aGlzIGRvZXNuJ3QgZG8gYW55dGhpbmdcblxuXHRcdGlmKGFwcGRhdGEuY3VycmVudHBhZ2UgPT0gXCJsZW5zXCIpIHtcblx0XHRcdGlmKG5ld3RyYW5zIC0gYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24gIT09IDApIHtcblx0XHRcdFx0Y2hhbmdldHJhbnMgPSB0cnVlO1xuXHRcdFx0XHRwZXJjZW50YWdlID0gKGFwcGRhdGEuZWxlbWVudHMudGV4dC5zY3JvbGxUb3AgLyorIGFwcGRhdGEuZWxlbWVudHMudGV4dC5jbGllbnRIZWlnaHQqLykvYXBwZGF0YS5lbGVtZW50cy50ZXh0LnNjcm9sbEhlaWdodDtcblx0XHRcdFx0Y29uc29sZS5sb2cocGVyY2VudGFnZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmKG5ld3RyYW5zID49IGFwcGRhdGEudHJhbnNsYXRpb25jb3VudCkge1xuXHRcdFx0XHRuZXd0cmFucyA9IDA7XG5cdFx0XHR9XG5cdFx0XHRpZihuZXd0cmFucyA8IDApIHtcblx0XHRcdFx0bmV3dHJhbnMgPSBhcHBkYXRhLnRyYW5zbGF0aW9uY291bnQtMTtcblx0XHRcdH1cblx0XHRcdGlmKG5ld2NhbnRvID49IGFwcGRhdGEuY2FudG9jb3VudCkge1xuXHRcdFx0XHRuZXdjYW50byA9IDA7XG5cdFx0XHR9XG5cdFx0XHRpZihuZXdjYW50byA8IDApIHtcblx0XHRcdFx0bmV3Y2FudG8gPSBhcHBkYXRhLmNhbnRvY291bnQtMTtcblx0XHRcdH1cblxuXHQvLyBmaWd1cmUgb3V0IHdoaWNoIHRyYW5zbGF0aW9uIGlzIHRoZSBjdXJyZW50IHRyYW5zbGF0aW9uXG5cblx0XHRcdGZvcih2YXIgaT0wOyBpIDwgYXBwZGF0YS50cmFuc2xhdGlvbmRhdGEubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0W25ld3RyYW5zXSA9PSBhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKSB7XG5cdFx0XHRcdFx0bmV3dHJhbnMgPSBpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRhcHBkYXRhLmVsZW1lbnRzLnRleHQuaW5uZXJIVE1MID0gYXBwLnRleHRkYXRhW25ld3RyYW5zXVtuZXdjYW50b107XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjdGV4dFwiLGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2FwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uXS50cmFuc2xhdGlvbmNsYXNzKTtcblx0XHRcdGRvbS5hZGRjbGFzcyhcIiN0ZXh0XCIsYXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbbmV3dHJhbnNdLnRyYW5zbGF0aW9uY2xhc3MpO1xuXHRcdFx0YXBwLnNldHVwbm90ZXMoKTtcblx0XHRcdGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uID0gbmV3dHJhbnM7XG5cdFx0XHRhcHBkYXRhLmN1cnJlbnRjYW50byA9IG5ld2NhbnRvO1xuXG5cdFx0XHRpZihhcHBkYXRhLmN1cnJlbnRjYW50byA+IDApIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZ0aXRsZVwiKS5pbm5lckhUTUwgPSBhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVthcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbl0udHJhbnNsYXRpb25zaG9ydG5hbWUrYCDCtyA8c3Ryb25nPkNhbnRvICR7YXBwZGF0YS5jdXJyZW50Y2FudG99PC9zdHJvbmc+YDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2dGl0bGVcIikuaW5uZXJIVE1MID0gXCImbmJzcDtcIjtcblx0XHRcdH1cblxuXHRcdFx0YXBwLmZpeHBhZGRpbmcoKTtcblxuLy8gc2V0IHBlcmNlbnRhZ2U6IHRoaXMgaXMgdGVycmlibGUhIGZpeCB0aGlzIVxuLy8gZmlyc3Q6IHRyeSB0byBmaWd1cmUgb3V0IGhvdyBtYW55IGxpbmVzIHdlIGhhdmU/IENhbiB3ZSBkbyB0aGF0P1xuXG5cdFx0XHRpZihjaGFuZ2V0cmFucykge1xuXG5cdFx0Ly8gdGhpcyBtZXRob2Qgc3RpbGwgaXNuJ3QgZ3JlYXQhIGl0IHRyaWVzIHRvIHJvdW5kIHRvIGN1cnJlbnQgbGluZWhlaWdodFxuXHRcdC8vIHRvIGF2b2lkIGN1dHRpbmcgb2ZmIGxpbmVzXG5cblx0XHRcdFx0dmFyIHNjcm9sbHRvID0gYXBwLnJvdW5kZWQocGVyY2VudGFnZSAqIGFwcGRhdGEuZWxlbWVudHMudGV4dC5zY3JvbGxIZWlnaHQpO1xuXHRcdFx0XHRhcHBkYXRhLmVsZW1lbnRzLnRleHQuc2Nyb2xsVG9wID0gc2Nyb2xsdG87XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZihwZXJjZW50YWdlID4gMCkge1xuXHRcdFx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zY3JvbGxUb3AgPSBhcHBkYXRhLmVsZW1lbnRzLnRleHQuc2Nyb2xsSGVpZ2h0O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zY3JvbGxUb3AgPSAwO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGFwcC5zYXZlY3VycmVudGRhdGEoKTtcblx0fSxcblx0cm91bmRlZDogZnVuY3Rpb24ocGl4ZWxzKSB7XG5cblx0XHQvLyB0aGlzIGlzIHN0aWxsIGEgbWVzcywgZml4IHRoaXNcblxuXHRcdHJldHVybiBhcHBkYXRhLmxpbmVoZWlnaHQgKiBNYXRoLmZsb29yKHBpeGVscyAvIGFwcGRhdGEubGluZWhlaWdodCk7XG5cblx0fSxcblx0Zml4cGFkZGluZzogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGRpdnMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiI3RleHQgcFwiKTtcblx0XHR2YXIgaSwgZGl2LCBwYWRkaW5nLCBkZXNpcmVkd2lkdGg7XG5cdFx0dmFyIG1heHdpZHRoID0gMDtcblxuXHRcdGlmKGRvbS5oYXNjbGFzcyhhcHBkYXRhLmVsZW1lbnRzLnRleHQsXCJwb2V0cnlcIikpIHtcblxuLy8gdGhpcyBpcyBwb2V0cnksIGZpZ3VyZSBvdXQgbG9uZ2VzdCBsaW5lXG5cblx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zdHlsZS5wYWRkaW5nTGVmdCA9IDA7XG5cdFx0XHRmb3IoaT0wOyBpPGRpdnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0ZGl2ID0gZGl2c1tpXTtcblx0XHRcdFx0ZGl2LnN0eWxlLmRpc3BsYXkgPSBcImlubGluZS1ibG9ja1wiO1xuXHRcdFx0XHRpZihkaXYuY2xpZW50V2lkdGggPiBtYXh3aWR0aCkge1xuXHRcdFx0XHRcdG1heHdpZHRoID0gZGl2LmNsaWVudFdpZHRoICsgOTA7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZGl2LnN0eWxlLmRpc3BsYXkgPSBcImJsb2NrXCI7XG5cdFx0XHR9XG5cblx0XHRcdGNvbnNvbGUubG9nKFwidGV4dCB3aWR0aDogXCIgKyBhcHBkYXRhLnRleHR3aWR0aCk7XG5cdFx0XHRjb25zb2xlLmxvZyhcIm1heCB3aWR0aDogXCIgKyBtYXh3aWR0aCk7XG5cblx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zdHlsZS5wYWRkaW5nTGVmdCA9IChhcHBkYXRhLnRleHR3aWR0aCAtIG1heHdpZHRoKS8yK1wicHhcIjtcblx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zdHlsZS5wYWRkaW5nUmlnaHQgPSAoYXBwZGF0YS50ZXh0d2lkdGggLSBtYXh3aWR0aCkvMitcInB4XCI7XG5cdFx0fSBlbHNlIHtcblxuXHQvLyB0aGlzIGlzIHByb3NlLCBzdGFuZGFyZGl6ZWQgcGFkZGluZ1xuXG5cdFx0XHRkZXNpcmVkd2lkdGggPSA3NTsgLy8gdGhpcyBpcyBpbiB2d1xuXG5cdFx0XHRjb25zb2xlLmxvZyhcInRleHQgd2lkdGg6IFwiICsgYXBwZGF0YS50ZXh0d2lkdGgpO1xuXHRcdFx0Y29uc29sZS5sb2coXCJkZXNpcmVkIHdpZHRoOiBcIiArIGRlc2lyZWR3aWR0aCk7XG5cdFx0XHRjb25zb2xlLmxvZyhcImxpbmVoZWlnaHQ6IFwiICsgYXBwZGF0YS5saW5laGVpZ2h0KTtcblxuXHQvL1x0XHRjb25zb2xlLmxvZyhsZW5zd2lkdGggKyBcIiBcIitkZXNpcmVkd2lkdGgpO1xuXHQvL1x0XHR2YXIgcGFkZGluZyA9IChsZW5zd2lkdGggLSBkZXNpcmVkd2lkdGgpLzI7XG5cblx0XHRcdHBhZGRpbmcgPSAoMTAwIC0gZGVzaXJlZHdpZHRoKS8yO1xuXHQvKlxuXHRcdFx0aWYoKGRlc2lyZWR3aWR0aCArIDIpID4gbGVuc3dpZHRoKSB7XG5cdFx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zdHlsZS5wYWRkaW5nTGVmdCA9IFwiMXZ3XCI7XG5cdFx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zdHlsZS5wYWRkaW5nUmlnaHQgPSBcIjF2d1wiO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ki9cblx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zdHlsZS5wYWRkaW5nTGVmdCA9IHBhZGRpbmcrXCJ2d1wiO1xuXHRcdFx0YXBwZGF0YS5lbGVtZW50cy50ZXh0LnN0eWxlLnBhZGRpbmdSaWdodCA9IHBhZGRpbmcrXCJ2d1wiO1xuXHQvL1x0XHR9XG5cdFx0fVxuXG5cdH0sXG5cdGhpZGVub3RlczogZnVuY3Rpb24oKSB7XG5cdFx0ZG9tLnJlbW92ZWJ5c2VsZWN0b3IoXCIubm90ZXdpbmRvd1wiKTtcblx0fSxcblx0dXBkYXRlc2V0dGluZ3M6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBpbnNlcnQsIGksIGosIHRyYW5zbGF0b3JsaXN0O1xuXG5cdC8vIGFkZCBpbiB0cmFuc2xhdGlvbiBjaG9vc2VyXG5cblx0XHRkb20ucmVtb3ZlYnlzZWxlY3RvcihcIiN0cmFuc2xhdG9ybGlzdFwiKTtcblx0XHRpbnNlcnQgPSBkb20uY3JlYXRlKCc8dWwgaWQ9XCJ0cmFuc2xhdG9ybGlzdFwiPjwvdWw+Jyk7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0cmFuc2xhdGlvbmNob29zZVwiKS5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdHRyYW5zbGF0b3JsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0cmFuc2xhdG9ybGlzdFwiKTtcblx0XHRmb3IoaSBpbiBhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YSkge1xuXHRcdFx0aW5zZXJ0ID0gZG9tLmNyZWF0ZShgPGxpPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBpZD1cImNoZWNrLSR7YXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZH1cIiAvPjxzcGFuIGlkPVwiJHthcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkfVwiID4ke2FwcGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uZnVsbG5hbWV9PC9zcGFuPjwvbGk+YCk7XG5cdFx0XHR0cmFuc2xhdG9ybGlzdC5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjaGVjay1cIithcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKS5jaGVja2VkID0gKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5pbmRleE9mKGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpID4gLTEpO1xuXHRcdH1cblxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIjdHJhbnNsYXRvcmxpc3QgaW5wdXRbdHlwZT1jaGVja2JveF1cIikuZm9yRWFjaChhcHAuaGVscGVycy5jaGVja2JveGdvKTtcblx0XHQvLyBFUzY6IGNhbiB3ZSBjaGFuZ2VkIHRoaXMgdG8gYSBmb3IgLi4uIGluIGxvb3A/XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIiN0cmFuc2xhdG9ybGlzdCBzcGFuXCIpLmZvckVhY2goYXBwLmhlbHBlcnMuY2hlY2tib3hzcGFuZ28pO1xuXHRcdC8vIEVTNjogY2FuIHdlIGNoYW5nZWQgdGhpcyB0byBhIGZvciAuLi4gaW4gbG9vcD9cblxuXHQvLyBhZGQgaW4gdG9jXG5cblx0XHRkb20ucmVtb3ZlYnlzZWxlY3RvcihcIiNzZWxlY3RvcnNcIik7XG5cdFx0aW5zZXJ0ID0gZG9tLmNyZWF0ZSgnPGRpdiBpZD1cInNlbGVjdG9yc1wiPjxwPkNhbnRvOiA8c2VsZWN0IGlkPVwic2VsZWN0Y2FudG9cIj48L3NlbGVjdD48L3A+PHA+VHJhbnNsYXRpb246IDxzZWxlY3QgaWQ9XCJzZWxlY3R0cmFuc2xhdG9yXCI+PC9zZWxlY3Q+PC9wPjxwPjxzcGFuIGlkPVwic2VsZWN0Z29cIj5Hbzwvc3Bhbj48L3A+PC9kaXY+Jyk7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0cmFuc2xhdGlvbmdvXCIpLmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0Zm9yKGkgPSAwOyBpIDwgYXBwZGF0YS5jYW50b2NvdW50OyBpKyspIHtcblx0XHRcdGluc2VydCA9IGRvbS5jcmVhdGUoYDxvcHRpb24gaWQ9XCJjYW50byR7aX1cIiAkeygoYXBwZGF0YS5jdXJyZW50Y2FudG8gPT0gaSkgPyBcInNlbGVjdGVkXCIgOiBcIlwiKX0+JHthcHBkYXRhLmNhbnRvdGl0bGVzW2ldfTwvb3B0aW9uPmApO1xuXHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RjYW50b1wiKS5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdH1cblx0XHRmb3IoaSBpbiBhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QpIHtcblx0XHRcdGZvcihqID0gMDsgaiA8IGFwcGRhdGEudHJhbnNsYXRpb25kYXRhLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdGlmKGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2pdLnRyYW5zbGF0aW9uaWQgPT0gYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0W2ldKSB7XG5cdFx0XHRcdFx0aW5zZXJ0ID0gZG9tLmNyZWF0ZShgPG9wdGlvbiBpZD1cInRyXyR7YXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbal0udHJhbnNsYXRpb25pZH1cIiAkeygoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24gPT0gaSkgPyBcInNlbGVjdGVkXCIgOiBcIlwiKX0+JHthcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtqXS50cmFuc2xhdGlvbmZ1bGxuYW1lfTwvb3B0aW9uPmApO1xuXHRcdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0dHJhbnNsYXRvclwiKS5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNzZWxlY3Rnb1wiKS5vbmNsaWNrID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0dmFyIHNlbGVjdGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3R0cmFuc2xhdG9yXCIpO1xuXHRcdFx0dmFyIHRoaXN0cmFucyA9IHNlbGVjdGVkLm9wdGlvbnNbc2VsZWN0ZWQuc2VsZWN0ZWRJbmRleF0uaWQuc3Vic3RyKDMpO1xuXHRcdFx0c2VsZWN0ZWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdGNhbnRvXCIpO1xuXHRcdFx0dmFyIHRoaXNjYW50byA9IHNlbGVjdGVkLm9wdGlvbnNbc2VsZWN0ZWQuc2VsZWN0ZWRJbmRleF0uaWQuc3Vic3RyKDUpO1xuXHRcdFx0Zm9yKGogPSAwOyBqIDwgYXBwZGF0YS50cmFuc2xhdGlvbmRhdGEubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0W2pdID09IHRoaXN0cmFucykge1xuXHRcdFx0XHRcdGFwcC5zZXRwYWdlKFwibGVuc1wiKTtcblx0XHRcdFx0XHRhcHAuc2V0bGVucyhqLHRoaXNjYW50bywwKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cdHNhdmVjdXJyZW50ZGF0YTogZnVuY3Rpb24oKSB7XG4vLyB0aGlzIHNob3VsZCBzdG9yZSBhcHBkYXRlIG9uIGxvY2Fsc3RvcmFnZSAoZG9lcyB0aGF0IHdvcmsgZm9yIG1vYmlsZT8pXG5cdFx0Y29uc29sZS5sb2coXCJTdG9yaW5nIHByZWZlcmVuY2VzISBUS1wiKTtcblx0fSxcblx0Y2hhbmdldHJhbnNsYXRpb246IGZ1bmN0aW9uKHRoaXNpZCwgaXNzZXQpIHtcblx0XHRjb25zb2xlLmxvZyhcImNoYW5nZXRyYW5zbGF0aW9uIGZpcmVkIVwiKTtcblx0XHRmb3IodmFyIGkgaW4gYXBwZGF0YS50cmFuc2xhdGlvbmRhdGEpIHtcblx0XHRcdGlmKHRoaXNpZCA9PSBhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKSB7XG5cdFx0XHRcdGlmKGlzc2V0KSB7XG5cdFx0XHRcdFx0YXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LnB1c2godGhpc2lkKTtcblx0XHRcdFx0XHRhcHBkYXRhLnRyYW5zbGF0aW9uY291bnQrKztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRpZihhcHBkYXRhLnRyYW5zbGF0aW9uY291bnQgPiAxKSB7XG5cdFx0XHRcdFx0XHR2YXIgaiA9IGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5pbmRleE9mKHRoaXNpZCk7XG5cdFx0XHRcdFx0XHRpZiAoaiA+IC0xKSB7XG5cdFx0XHRcdFx0XHRcdGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5zcGxpY2UoaiwgMSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRhcHBkYXRhLnRyYW5zbGF0aW9uY291bnQtLTtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gdGhlcmUncyBvbmx5IG9uZSB0cmFuc2xhdGlvbiBpbiB0aGUgbGlzdCwgZG8gbm90IGRlbGV0ZSBsYXN0XG5cdFx0XHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNoZWNrLVwiK3RoaXNpZC50b0xvd2VyQ2FzZSgpKS5jaGVja2VkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGFwcC5zYXZlY3VycmVudGRhdGEoKTtcblx0XHR9XG5cblx0XHR2YXIgbmV3bGlzdCA9IFtdO1xuXHRcdGZvcihpIGluIGFwcGRhdGEudHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0XHRpZihhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QuaW5kZXhPZihhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKSA+IC0xKSB7XG5cdFx0XHRcdG5ld2xpc3QucHVzaChhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0YXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0ID0gbmV3bGlzdC5zbGljZSgpO1xuXHRcdC8vIGFsc28gd2hhdCBkbyB3ZSBkbyB3aGVuIG9uZSBpcyBkZWxldGVkP1xuXHRcdGFwcC51cGRhdGVzZXR0aW5ncygpO1xuXHR9LFxuXHRzZXRwYWdlOiBmdW5jdGlvbihuZXdwYWdlKSB7XG5cdFx0ZG9tLnJlbW92ZWNsYXNzKFwiLnBhZ2VcIixcIm9uXCIpO1xuXHRcdGRvbS5hZGRjbGFzcyhcIi5wYWdlI1wiK25ld3BhZ2UsXCJvblwiKTtcblx0XHRhcHBkYXRhLmN1cnJlbnRwYWdlID0gbmV3cGFnZTtcblx0XHRhcHAucmVzaXplKCk7XG5cdH0sXG5cdG9uRGV2aWNlUmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKFwiZGV2aWNlIHJlYWR5IVwiKTtcblx0XHRhcHAuc2V0dXAoKTtcblx0fSxcblx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC5zZXR1cG5vdGVzKCk7XG5cdFx0YXBwLnNldHVwY29udHJvbHMoKTtcblx0XHRhcHAuc2V0cGFnZShcImxlbnNcIik7XG5cdH1cbn07XG5cbmFwcC5pbml0aWFsaXplKCk7XG5pZiAoISgnb25EZXZpY2VSZWFkeScgaW4gZG9jdW1lbnQpKSB7XG5cdGNvbnNvbGUubG9nKFwiUnVubmluZyBub24tQ29yZG92YSBjb2RlIVwiKTtcblx0YXBwLnNldHVwKCk7IC8vIChob3BlZnVsbHkgdGhpcyBkb2Vzbid0IGZpcmUgaW4gcmVhbCB2ZXJzaW9uPylcbn1cbiIsIi8vIGRvbS5qc1xuXG52YXIgZG9tID0ge1xuXHRjcmVhdGU6IGZ1bmN0aW9uKGh0bWxTdHIpIHtcblx0XHR2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHR2YXIgdGVtcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHRlbXAuaW5uZXJIVE1MID0gaHRtbFN0cjtcblx0XHR3aGlsZSAodGVtcC5maXJzdENoaWxkKSB7XG5cdFx0XHRmcmFnLmFwcGVuZENoaWxkKHRlbXAuZmlyc3RDaGlsZCk7XG5cdFx0fVxuXHRcdHJldHVybiBmcmFnO1xuXHR9LFxuXHRyZW1vdmVieXNlbGVjdG9yOiBmdW5jdGlvbihzZWxlY3RvcnN0cmluZykge1xuXHRcdHZhciBzZWxlY3RvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3JzdHJpbmcpO1xuXHRcdGlmKHNlbGVjdG9yICE9PSBudWxsKSB7XG5cdFx0XHRzZWxlY3Rvci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNlbGVjdG9yKTtcblx0XHR9XG5cdH0sXG5cdGFkZGNsYXNzOiBmdW5jdGlvbihzZWxlY3RvcnN0cmluZywgbXljbGFzcykge1xuXHRcdHZhciBteWVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yc3RyaW5nKTtcblx0XHRpZihteWNsYXNzLmluZGV4T2YoXCIgXCIpID4gLTEpIHtcblx0XHRcdHZhciBjbGFzc2VzID0gbXljbGFzcy5zcGxpdChcIiBcIik7XG5cdFx0XHRmb3IodmFyIGogPSAwOyBqIDwgY2xhc3Nlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRkb20uYWRkY2xhc3Moc2VsZWN0b3JzdHJpbmcsIGNsYXNzZXNbal0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG15ZWxlbWVudC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRteWVsZW1lbnRbaV0uY2xhc3NMaXN0LmFkZChteWNsYXNzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdHJlbW92ZWNsYXNzOiBmdW5jdGlvbihzZWxlY3RvcnN0cmluZywgbXljbGFzcykge1xuXHRcdHZhciBteWVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yc3RyaW5nKTtcblx0XHRpZihteWNsYXNzLmluZGV4T2YoXCIgXCIpID4gLTEpIHtcblx0XHRcdHZhciBjbGFzc2VzID0gbXljbGFzcy5zcGxpdChcIiBcIik7XG5cdFx0XHRmb3IodmFyIGogPSAwOyBqIDwgY2xhc3Nlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRkb20ucmVtb3ZlY2xhc3Moc2VsZWN0b3JzdHJpbmcsIGNsYXNzZXNbal0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG15ZWxlbWVudC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRteWVsZW1lbnRbaV0uY2xhc3NMaXN0LnJlbW92ZShteWNsYXNzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGhhc2NsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbHMpIHtcblx0XHRyZXR1cm4gKCcgJyArIGVsZW1lbnQuY2xhc3NOYW1lICsgJyAnKS5pbmRleE9mKCcgJyArIGNscyArICcgJykgPiAtMTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkb207XG4iLCIvLyBjYXJseWxlLmpzXG5cbnZhciBjYXJseWxlID0gWyc8cCBjbGFzcz1cInRpdGxlXCI+SW5mZXJubzwvcD48cCBjbGFzcz1cImF1dGhvclwiPkpvaG4gQWl0a2VuIENhcmx5bGUsIFRob21hcyBPa2V5ICZhbXA7IFAuIEguIFdpa3N0ZWVkPC9wPicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q0FOVE8gSTwvcD48cCBjbGFzcz1cInN1bW1hcnlcIj5EYW50ZSBmaW5kcyBoaW1zZWxmIGFzdHJheSBpbiBhIGRhcmsgV29vZCwgd2hlcmUgaGUgc3BlbmRzIGEgbmlnaHQgb2YgZ3JlYXQgbWlzZXJ5LiBIZSBzYXlzIHRoYXQgZGVhdGggaXMgaGFyZGx5IG1vcmUgYml0dGVyLCB0aGFuIGl0IGlzIHRvIHJlY2FsbCB3aGF0IGhlIHN1ZmZlcmVkIHRoZXJlOyBidXQgdGhhdCBoZSB3aWxsIHRlbGwgdGhlIGZlYXJmdWwgdGhpbmdzIGhlIHNhdywgaW4gb3JkZXIgdGhhdCBoZSBtYXkgYWxzbyB0ZWxsIGhvdyBoZSBmb3VuZCBndWlkYW5jZSwgYW5kIGZpcnN0IGJlZ2FuIHRvIGRpc2Nlcm4gdGhlIHJlYWwgY2F1c2VzIG9mIGFsbCBtaXNlcnkuIEhlIGNvbWVzIHRvIGEgSGlsbDsgYW5kIHNlZWluZyBpdHMgc3VtbWl0IGFscmVhZHkgYnJpZ2h0IHdpdGggdGhlIHJheXMgb2YgdGhlIFN1biwgaGUgYmVnaW5zIHRvIGFzY2VuZCBpdC4gVGhlIHdheSB0byBpdCBsb29rcyBxdWl0ZSBkZXNlcnRlZC4gSGUgaXMgbWV0IGJ5IGEgYmVhdXRpZnVsIExlb3BhcmQsIHdoaWNoIGtlZXBzIGRpc3RyYWN0aW5nIGhpcyBhdHRlbnRpb24gZnJvbSB0aGUgSGlsbCwgYW5kIG1ha2VzIGhpbSB0dXJuIGJhY2sgc2V2ZXJhbCB0aW1lcy4gVGhlIGhvdXIgb2YgdGhlIG1vcm5pbmcsIHRoZSBzZWFzb24sIGFuZCB0aGUgZ2F5IG91dHdhcmQgYXNwZWN0IG9mIHRoYXQgYW5pbWFsLCBnaXZlIGhpbSBnb29kIGhvcGVzIGF0IGZpcnN0OyBidXQgaGUgaXMgZHJpdmVuIGRvd24gYW5kIHRlcnJpZmllZCBieSBhIExpb24gYW5kIGEgU2hlLXdvbGYuIFZpcmdpbCBjb21lcyB0byBoaXMgYWlkLCBhbmQgdGVsbHMgaGltIHRoYXQgdGhlIFdvbGYgbGV0cyBub25lIHBhc3MgaGVyIHdheSwgYnV0IGVudGFuZ2xlcyBhbmQgc2xheXMgZXZlcnkgb25lIHRoYXQgdHJpZXMgdG8gZ2V0IHVwIHRoZSBtb3VudGFpbiBieSB0aGUgcm9hZCBvbiB3aGljaCBzaGUgc3RhbmRzLiBIZSBzYXlzIGEgdGltZSB3aWxsIGNvbWUgd2hlbiBhIHN3aWZ0IGFuZCBzdHJvbmcgR3JleWhvdW5kIHNoYWxsIGNsZWFyIHRoZSBlYXJ0aCBvZiBoZXIsIGFuZCBjaGFzZSBoZXIgaW50byBIZWxsLiBBbmQgaGUgb2ZmZXJzIHRvIGNvbmR1Y3QgRGFudGUgYnkgYW5vdGhlciByb2FkOyB0byBzaG93IGhpbSB0aGUgZXRlcm5hbCByb290cyBvZiBtaXNlcnkgYW5kIG9mIGpveSwgYW5kIGxlYXZlIGhpbSB3aXRoIGEgaGlnaGVyIGd1aWRlIHRoYXQgd2lsbCBsZWFkIGhpbSB1cCB0byBIZWF2ZW4uPC9wPjxwPkluIHRoZSBtaWRkbGUgb2YgdGhlIGpvdXJuZXkgb2Ygb3VyIGxpZmU8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZSBWaXNpb24gdGFrZXMgcGxhY2UgYXQgRWFzdGVydGlkZSBvZiB0aGUgeWVhciAxMzAwLCB0aGF0IGlzIHRvIHNheSwgd2hlbiBEYW50ZSB3YXMgdGhpcnR5LWZpdmUgeWVhcnMgb2xkLiA8ZW0+Q2YuPC9lbT4gPGVtPlBzYWxtczwvZW0+IHhjLiAxMDogJmxkcXVvO1RoZSBkYXlzIG9mIG91ciB5ZWFycyBhcmUgdGhyZWVzY29yZSB5ZWFycyBhbmQgdGVuLiZyZHF1bzsgU2VlIGFsc28gPGVtPkNvbnZpdG88L2VtPiBpdjogJmxkcXVvO1doZXJlIHRoZSB0b3Agb2YgdGhpcyBhcmNoIG9mIGxpZmUgbWF5IGJlLCBpdCBpcyBkaWZmaWN1bHQgdG8ga25vdy4mbmJzcDsuJm5ic3A7LiZuYnNwOy4gSSBiZWxpZXZlIHRoYXQgaW4gdGhlIHBlcmZlY3RseSBuYXR1cmFsIG1hbiwgaXQgaXMgYXQgdGhlIHRoaXJ0eS1maWZ0aCB5ZWFyLiZyZHF1bzs8L3NwYW4+PC9zcGFuPiBJIGNhbWUgdG8gbXlzZWxmIGluIGEgZGFyayB3b29kPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4yPC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj48ZW0+Q2YuPC9lbT4gPGVtPkNvbnZpdG88L2VtPiBpdjogJmxkcXVvOy4mbmJzcDsuJm5ic3A7LiZuYnNwO3RoZSBhZG9sZXNjZW50IHdobyB3ZW50ZXJzIGludG8gdGhlIFdvb2Qgb2YgRXJyb3Igb2YgdGhpcyBsaWZlIHdvdWxkIG5vdCBrbm93IGhvdyB0byBrZWVwIHRvIHRoZSBnb29kIHBhdGggaWYgaXQgd2VyZSBub3QgcG9pbnRlZCBvdXQgdG8gaGltIGJ5IGhpcyBlbGRlcnMuJnJkcXVvOyA8ZW0+UG9saXRpY2FsbHk8L2VtPjogdGhlIDxlbT53b29kPC9lbT4gc3RhbmRzIGZvciB0aGUgdHJvdWJsZWQgc3RhdGUgb2YgSXRhbHkgaW4gRGFudGUmcnNxdW87cyB0aW1lLjwvc3Bhbj48L3NwYW4+IHdoZXJlIHRoZSBzdHJhaWdodCB3YXkgd2FzIGxvc3QuPC9wPjxwPkFoISBob3cgaGFyZCBhIHRoaW5nIGl0IGlzIHRvIHRlbGwgd2hhdCBhIHdpbGQsIGFuZCByb3VnaCwgYW5kIHN0dWJib3JuIHdvb2QgdGhpcyB3YXMsIHdoaWNoIGluIG15IHRob3VnaHQgcmVuZXdzIHRoZSBmZWFyITwvcD48cD5TbyBiaXR0ZXIgaXMgaXQsIHRoYXQgc2NhcnNlbHkgbW9yZSBpcyBkZWF0aDogYnV0IHRvIHRyZWF0IG9mIHRoZSBnb29kIHRoYXQgdGhlcmUgSSBmb3VuZCwgSSB3aWxsIHJlbGF0ZSB0aGUgb3RoZXIgdGhpbmdzIHRoYXQgSSBkaXNjZXJuZWQuPC9wPjxwPkkgY2Fubm90IHJpZ2h0bHkgdGVsbCBob3cgSSBlbnRlcmVkIGl0LCBzbyBmdWxsIG9mIHNsZWVwIHdhcyBJIGFib3V0IHRoZSBtb21lbnQgdGhhdCBJIGxlZnQgdGhlIHRydWUgd2F5LjwvcD48cD5CdXQgYWZ0ZXIgSSBoYWQgcmVhY2hlZCB0aGUgZm9vdCBvZiBhIEhpbGw8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjM8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZSAmbGRxdW87aG9seSBIaWxsJnJkcXVvOyBvZiB0aGUgQmlibGU7IEJ1bnlhbiZyc3F1bztzICZsZHF1bztEZWxlY3RhYmxlIE1vdW50YWlucy4mcmRxdW87PC9zcGFuPjwvc3Bhbj4gdGhlcmUsIHdoZXJlIHRoYXQgdmFsbGV5IGVuZGVkLCB3aGljaCBoYWQgcGllcmNlZCBteSBoZWFydCB3aXRoIGZlYXIsPC9wPjxwPkkgbG9va2VkIHVwIGFuZCBzYXcgaXRzIHNob3VsZGVycyBhbHJlYWR5IGNsb3RoZWQgd2l0aCB0aGUgcmF5cyBvZiB0aGUgUGxhbmV0PHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj40PC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj48ZW0+UGxhbmV0PC9lbT4sIHRoZSBzdW4sIHdoaWNoIHdhcyBhIHBsYW5ldCBhY2NvcmRpbmcgdG8gdGhlIFB0b2xlbWFpYyBzeXN0ZW0uIERhbnRlIHNwZWFrcyBlbHNld2hlcmUgKDxlbT5Db252LjwvZW0+IGl2KSBvZiB0aGUgJmxkcXVvO3NwaXJpdHVhbCBTdW4sIHdoaWNoIGlzIEdvZC4mcmRxdW87PC9zcGFuPjwvc3Bhbj4gdGhhdCBsZWFkcyBtZW4gc3RyYWlnaHQgb24gZXZlcnkgcm9hZC48L3A+PHA+VGhlbiB0aGUgZmVhciB3YXMgc29tZXdoYXQgY2FsbWVkLCB3aGljaCBoYWQgY29udGludWVkIGluIHRoZSBsYWtlIG9mIG15IGhlYXJ0IHRoZSBuaWdodCB0aGF0IEkgcGFzc2VkIHNvIHBpdGVvdXNseS48L3A+PHA+QW5kIGFzIGhlLCB3aG8gd2l0aCBwYW50aW5nIGJyZWF0aCBoYXMgZXNjYXBlZCBmcm9tIHRoZSBkZWVwIHNlYSB0byB0aGUgc2hvcmUsIHR1cm5zIHRvIHRoZSBkYW5nZXJvdXMgd2F0ZXIgYW5kIGdhemVzOjwvcD48cD5zbyBteSBtaW5kLCB3aGljaCBzdGlsbCB3YXMgZmxlZWluZywgdHVybmVkIGJhY2sgdG8gc2VlIHRoZSBwYXNzIHRoYXQgbm8gb25lIGV2ZXIgbGVmdCBhbGl2ZS48L3A+PHA+QWZ0ZXIgSSBoYWQgcmVzdGVkIG15IHdlYXJpZWQgYm9keSBhIHNob3J0IHdoaWxlLCBJIHRvb2sgdGhlIHdheSBhZ2FpbiBhbG9uZyB0aGUgZGVzZXJ0IHN0cmFuZCwgc28gdGhhdCB0aGUgcmlnaHQgZm9vdCBhbHdheXMgd2FzIHRoZSBsb3dlci48c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjU8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPkFueSBvbmUgd2hvIGlzIGFzY2VuZGluZyBhIGhpbGwsIGFuZCB3aG9zZSBsZWZ0IGZvb3QgaXMgYWx3YXlzIHRoZSBsb3dlciwgbXVzdCBiZSBiZWFyaW5nIHRvIHRoZSA8ZW0+cmlnaHQ8L2VtPi48L3NwYW4+PC9zcGFuPjwvcD48cD5BbmQgYmVob2xkLCBhbG1vc3QgYXQgdGhlIGNvbW1lbmNlbWVudCBvZiB0aGUgc3RlZXAsIGEgTGVvcGFyZCw8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjY8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPldvcmxkbHkgUGxlYXN1cmU7IDxlbT5wb2xpdGljYWxseTwvZW0+OiBGbG9yZW5jZS48L3NwYW4+PC9zcGFuPiBsaWdodCBhbmQgdmVyeSBuaW1ibGUsIHdoaWNoIHdhcyBjb3ZlcmVkIHdpdGggc3BvdHRlZCBoYWlyLjwvcD48cD5BbmQgaXQgd2VudCBub3QgZnJvbSBiZWZvcmUgbXkgZmFjZTsgbmF5LCBzbyBpbXBlZGVkIG15IHdheSwgdGhhdCBJIGhhZCBvZnRlbiB0dXJuZWQgdG8gZ28gYmFjay48L3A+PHA+VGhlIHRpbWUgd2FzIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1vcm5pbmc7IGFuZCB0aGUgc3VuIHdhcyBtb3VudGluZyB1cCB3aXRoIHRob3NlIHN0YXJzLDxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Nzwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+QWNjb3JkaW5nIHRvIHRyYWRpdGlvbiwgdGhlIHN1biB3YXMgaW4gQXJpZXMgYXQgdGhlIHRpbWUgb2YgdGhlIENyZWF0aW9uLjwvc3Bhbj48L3NwYW4+IHdoaWNoIHdlcmUgd2l0aCBoaW0gd2hlbiBEaXZpbmUgTG92ZTwvcD48cD5maXJzdCBtb3ZlZCB0aG9zZSBmYWlyIHRoaW5nczogc28gdGhhdCB0aGUgaG91ciBvZiB0aW1lIGFuZCB0aGUgc3dlZXQgc2Vhc29uIGNhdXNlZCBtZSB0byBoYXZlIGdvb2QgaG9wZTwvcD48cD5vZiB0aGF0IGFuaW1hbCB3aXRoIHRoZSBnYXkgc2tpbjsgeWV0IG5vdCBzbywgYnV0IHRoYXQgSSBmZWFyZWQgYXQgdGhlIHNpZ2h0LCB3aGljaCBhcHBlYXJlZCB0byBtZSwgb2YgYSBMaW9uLjxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+ODwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+QW1iaXRpb247IDxlbT5wb2xpdGljYWxseTwvZW0+OiB0aGUgUm95YWwgSG91c2Ugb2YgRnJhbmNlLjwvc3Bhbj48L3NwYW4+PC9wPjxwPkhlIHNlZW1lZCBjb21pbmcgdXBvbiBtZSB3aXRoIGhlYWQgZXJlY3QsIGFuZCBmdXJpb3VzIGh1bmdlcjsgc28gdGhhdCB0aGUgYWlyIHNlZW1lZCB0byBoYXZlIGZlYXIgdGhlcmVhdDs8L3A+PHA+YW5kIGEgU2hlLXdvbGYsPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj45PC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj48ZW0+QXZhcmljZTwvZW0+OyA8ZW0+cG9saXRpY2FsbHk8L2VtPjogdGhlIFBhcGFsIFNlZS4gVGhlIHRocmVlIGJlYXN0cyBhcmUgb2J2aW91c2x5IHRha2VuIGZyb20gPGVtPkplcmVtaWFoPC9lbT4gdi4mbmJzcDs2Ljwvc3Bhbj48L3NwYW4+IHRoYXQgbG9va2VkIGZ1bGwgb2YgYWxsIGNyYXZpbmdzIGluIGhlciBsZWFubmVzczsgYW5kIGhhcyBlcmUgbm93IG1hZGUgbWFueSBsaXZlIGluIHNvcnJvdy48L3A+PHA+U2hlIGJyb3VnaHQgc3VjaCBoZWF2aW5lc3MgdXBvbiBtZSB3aXRoIHRoZSB0ZXJyb3Igb2YgaGVyIGFzcGVjdCwgdGhhdCBJIGxvc3QgdGhlIGhvcGUgb2YgYXNjZW5kaW5nLjwvcD48cD5BbmQgYXMgb25lIHdobyBpcyBlYWdlciBpbiBnYWluaW5nLCBhbmQsIHdoZW4gdGhlIHRpbWUgYXJyaXZlcyB0aGF0IG1ha2VzIGhpbSBsb3NlLCB3ZWVwcyBhbmQgYWZmbGljdHMgaGltc2VsZiBpbiBhbGwgaGlzIHRob3VnaHRzOjwvcD48cD5zdWNoIHRoYXQgcmVzdGxlc3MgYmVhc3QgbWFkZSBtZSwgd2hpY2ggY29taW5nIGFnYWluc3QgbWUsIGJ5IGxpdHRsZSBhbmQgbGl0dGxlIGRyb3ZlIG1lIGJhY2sgdG8gd2hlcmUgdGhlIFN1biBpcyBzaWxlbnQuPC9wPjxwPldoaWxzdCBJIHdhcyBydXNoaW5nIGRvd253YXJkcywgdGhlcmUgYXBwZWFyZWQgYmVmb3JlIG15IGV5ZXMgb25lPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4xMDwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VmlyZ2lsLCB3aG8gc3RhbmRzIGZvciBXb3JsZGx5IFdpc2RvbSwgYW5kIGlzIERhbnRlJnJzcXVvO3MgZ3VpZGUgdGhyb3VnaCBIZWxsIGFuZCBQdXJnYXRvcnkgKHNlZSBHYXJkbmVyLCBwcC4gODcsIDg4KS48YnIgLz48YnIgLz48ZW0+aG9hcnNlPC9lbT4sIHBlcmhhcHMgYmVjYXVzZSB0aGUgc3R1ZHkgb2YgVmlyZ2lsIGhhZCBiZWVuIGxvbmcgbmVnbGVjdGVkPC9zcGFuPjwvc3Bhbj4gd2hvIHNlZW1lZCBob2Fyc2UgZnJvbSBsb25nIHNpbGVuY2UuPC9wPjxwPldoZW4gSSBzYXcgaGltIGluIHRoZSBncmVhdCBkZXNlcnQsIEkgY3JpZWQ6ICZsZHF1bztIYXZlIHBpdHkgb24gbWUsIHdoYXRlJnJzcXVvO2VyIHRob3UgYmUsIHdoZXRoZXIgc2hhZGUgb3IgdmVyaXRhYmxlIG1hbiEmcmRxdW87PC9wPjxwPkhlIGFuc3dlcmVkIG1lOiAmbGRxdW87Tm90IG1hbiwgYSBtYW4gSSBvbmNlIHdhczsgYW5kIG15IHBhcmVudHMgd2VyZSBMb21iYXJkcywgYW5kIGJvdGggb2YgTWFudHVhIGJ5IGNvdW50cnkuPC9wPjxwPlRLITwvcD4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNBTlRPIElJPC9wPjxwIGNsYXNzPVwic3VtbWFyeVwiPkVuZCBvZiB0aGUgZmlyc3QgZGF5LiBCcmllZiBJbnZvY2F0aW9uLiBEYW5ldCBpcyBkaXNjb3VyYWdlZCBhdCB0aGUgb3V0c2V0LCB3aGVuIGhlIGJlZ2lucyBzZXJpb3VzbHkgdG8gcmVmbGVjdCB1cG9uIHdoYXQgaGUgaGFzIHVuZGVydGFrZW4uIFRoYXQgdmVyeSBkYXksIGhpcyBvd24gc3RyZW5ndGggaGFkIG1pc2VyYWJseSBmYWlsZWQgYmVmb3JlIHRoZSBMaW9uIGFuZCB0aGUgU2hlLVdvbGYuIEhlIGJpZHMgVmlyZ2lsIGNvbnNpZGVyIHdlbGwgd2hldGhlciB0aGVyZSBiZSBzdWZmaWNpZW50IHZpcnR1ZSBpbiBoaW0sIGJlZm9yZSBjb21taXR0aW5nIGhpbSB0byBzbyBkcmVhZGZ1bCBhIHBhc3NhZ2UuIEhlIHJlY2FsbHMgdGhlIGdyZWF0IGVycmFuZHMgb2YgJkFFbGlnO25lYXMgYW5kIG9mIFBhdWwsIGFuZCB0aGUgZ3JlYXQgcmVzdWx0cyBvZiB0aGVpciBnb2luZyB0byB0aGUgaW1tb3J0YWwgd29ybGQ7IGFuZCBjb21wYXJpbmcgaGltc2VsZiB3aXRoIHRoZW0sIGhlIGZlZWxzIGhpcyBoZWFydCBxdWFpbCwgYW5kIGlzIHJlYWR5IHRvIHR1cm4gYmFjay4gVmlyZ2lsIGRpc2Nlcm5zIHRoZSBmZWFyIHRoYXQgaGFzIGNvbWUgb3ZlciBoaW07IGFuZCBpbiBvcmRlciB0byByZW1vdmUgaXQsIHRlbGxzIGhpbSBob3cgYSBibGVzc2VkIFNwaXJpdCBoYXMgZGVzY2VuZGVkIGZyb20gSGVhdmVuIGV4cHJlc3NseSB0byBjb21tYW5kIHRoZSBqb3VybmV5LiBPbiBoZWFyaW5nIHRoaXMsIERhbnRlIGltbWVkaWF0ZWx5IGNhc3RzIG9mZiBwdXNpbGxhbmltaXR5LCBhbmQgYXQgb25jZSBhY2NlcHRzIHRoZSBGcmVlZG9tIGFuZCB0aGUgTWlzc2lvbiB0aGF0IGFyZSBnaXZlbiBoaW0uPC9wPjxwPlRLITwvcD4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNBTlRPIElJSTwvcD48cCBjbGFzcz1cInN1bW1hcnlcIj5JbnNjcmlwdGlvbiBvdmVyIHRoZSBHYXRlIG9mIEhlbGwsIGFuZCB0aGUgaW1wcmVzc2lvbiBpdCBwcm9kdWNlcyB1cG9uIERhbnRlLiBWaXJnaWwgdGFrZXMgaGltIGJ5IHRoZSBoYW5kLCBhbmQgbGVhZHMgaGltIGluLiBUaGUgZGlzbWFsIHNvdW5kcyBtYWtlIGhpbSBidXJzdCBpbnRvIHRlYXJzLiBIaXMgaGVhZCBpcyBxdWl0ZSBiZXdpbGRlcmVkLiBVcG9uIGEgRGFyayBQbGFpbiwgd2hpY2ggZ29lcyBhcm91bmQgdGhlIGNvbmZpbmVzLCBoZSBzZWVzIGEgdmFzdCBtdWx0aXR1ZGUgb2Ygc3Bpcml0cyBydW5uaW5nIGJlaGluZCBhIGZsYWcgaW4gZ3JlYXQgaGFzdGUgYW5kIGNvbmZ1c2lvbiwgdXJnZWQgb24gYnkgZnVyaW91cyB3YXNwcyBhbmQgaG9ybmV0cy4gVGhlc2UgYXJlIHRoZSB1bmhhcHB5IHBlb3BsZSwgd2hvIG5ldmVyIHdlcmUgYWxpdmUmbWRhc2g7bmV2ZXIgYXdha2VuZWQgdG8gdGFrZSBhbnkgcGFydCBpbiBlaXRoZXIgZ29vZCBvciBldmlsLCB0byBjYXJlIGZvciBhbnl0aGluZyBidXQgdGhlbXNlbHZlcy4gVGhleSBhcmUgbWl4ZWQgd2l0aCBhIHNpbWlsYXIgY2xhc3Mgb2YgZmFsbGVuIGFuZ2Vscy4gQWZ0ZXIgcGFzc2luZyB0aHJvdWdoIHRoZSBjcm93ZCBvZiB0aGVtLCB0aGUgUG9ldHMgY29tZSB0byBhIGdyZWF0IFJpdmVyLCB3aGljaCBmbG93cyByb3VuZCB0aGUgYnJpbSBvZiBIZWxsOyBhbmQgdGhlbiBkZXNjZW5kcyB0byBmb3JtIHRoZSBvdGhlciByaXZlcnMsIHRoZSBtYXJzaGVzLCBhbmQgdGhlIGljZSB0aGF0IHdlIHNoYWxsIG1lZXQgd2l0aC4gSXQgaXMgdGhlIHJpdmVyIEFjaGVyb247IGFuZCBvbiBpdHMgU2hvcmUgYWxsIHRoYXQgZGllIHVuZGVyIHRoZSB3cmF0aCBvZiBHb2QgYXNzZW1ibGUgZnJvbSBldmVyeSBjb3VudHJ5IHRvIGJlIGZlcnJpZWQgb3ZlciBieSB0aGUgZGVtb24gQ2hhcm9uLiBIZSBtYWtlcyB0aGVtIGVudGVyIGhpcyBib2F0IGJ5IGdsYXJpbmcgb24gdGhlbSB3aXRoIGhpcyBidXJuaW5nIGV5ZXMuIEhhdmluZyBzZWVuIHRoZXNlLCBhbmQgYmVpbmcgcmVmdXNlZCBhIHBhc3NhZ2UgYnkgQ2hhcm9uLCBEYW50ZSBpcyBzdWRkZW5seSBzdHVubmVkIGJ5IGEgdmlvbGVudCB0cmVtYmxpbmcgb2YgdGhlIGdyb3VuZCwgYWNjb21wYW5pZWQgd2l0aCB3aW5kIGFuZCBsaWdodG5pbmcsIGFuZCBmYWxscyBkb3duIGluIGEgc3RhdGUgb2YgaW5zZW5zaWJpbGl0eS48L3A+PHA+VEshPC9wPiddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNhcmx5bGU7XG4iLCIvLyBpdGFsaWFuLmpzXG5cbnZhciBpdGFsaWFuID0gWyc8cCBjbGFzcz1cInRpdGxlXCI+SW5mZXJubzwvcD48cCBjbGFzcz1cImF1dGhvclwiPkRhbnRlIEFsaWdoaWVyaTwvcD4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPjE8L3A+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk5lbCBtZXp6byBkZWwgY2FtbWluIGRpIG5vc3RyYSB2aXRhPC9wPjxwPm1pIHJpdHJvdmFpIHBlciB1bmEgc2VsdmEgb3NjdXJhLDwvcD48cD5jaCZlYWN1dGU7IGxhIGRpcml0dGEgdmlhIGVyYSBzbWFycml0YS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFoaSBxdWFudG8gYSBkaXIgcXVhbCBlcmEgJmVncmF2ZTsgY29zYSBkdXJhPC9wPjxwPmVzdGEgc2VsdmEgc2VsdmFnZ2lhIGUgYXNwcmEgZSBmb3J0ZTwvcD48cD5jaGUgbmVsIHBlbnNpZXIgcmlub3ZhIGxhIHBhdXJhITwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGFudCZyc3F1bzsgJmVncmF2ZTsgYW1hcmEgY2hlIHBvY28gJmVncmF2ZTsgcGkmdWdyYXZlOyBtb3J0ZTs8L3A+PHA+bWEgcGVyIHRyYXR0YXIgZGVsIGJlbiBjaCZyc3F1bztpJnJzcXVvOyB2aSB0cm92YWksPC9wPjxwPmRpciZvZ3JhdmU7IGRlIGwmcnNxdW87YWx0cmUgY29zZSBjaCZyc3F1bztpJnJzcXVvOyB2JnJzcXVvO2hvIHNjb3J0ZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPklvIG5vbiBzbyBiZW4gcmlkaXIgY29tJnJzcXVvOyBpJnJzcXVvOyB2JnJzcXVvO2ludHJhaSw8L3A+PHA+dGFudCZyc3F1bzsgZXJhIHBpZW4gZGkgc29ubm8gYSBxdWVsIHB1bnRvPC9wPjxwPmNoZSBsYSB2ZXJhY2UgdmlhIGFiYmFuZG9uYWkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5NYSBwb2kgY2gmcnNxdW87aSZyc3F1bzsgZnVpIGFsIHBpJmVncmF2ZTsgZCZyc3F1bzt1biBjb2xsZSBnaXVudG8sPC9wPjxwPmwmYWdyYXZlOyBkb3ZlIHRlcm1pbmF2YSBxdWVsbGEgdmFsbGU8L3A+PHA+Y2hlIG0mcnNxdW87YXZlYSBkaSBwYXVyYSBpbCBjb3IgY29tcHVudG8sPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5ndWFyZGFpIGluIGFsdG8gZSB2aWRpIGxlIHN1ZSBzcGFsbGU8L3A+PHA+dmVzdGl0ZSBnaSZhZ3JhdmU7IGRlJnJzcXVvOyByYWdnaSBkZWwgcGlhbmV0YTwvcD48cD5jaGUgbWVuYSBkcml0dG8gYWx0cnVpIHBlciBvZ25lIGNhbGxlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QWxsb3IgZnUgbGEgcGF1cmEgdW4gcG9jbyBxdWV0YSw8L3A+PHA+Y2hlIG5lbCBsYWdvIGRlbCBjb3IgbSZyc3F1bztlcmEgZHVyYXRhPC9wPjxwPmxhIG5vdHRlIGNoJnJzcXVvO2kmcnNxdW87IHBhc3NhaSBjb24gdGFudGEgcGlldGEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIGNvbWUgcXVlaSBjaGUgY29uIGxlbmEgYWZmYW5uYXRhLDwvcD48cD51c2NpdG8gZnVvciBkZWwgcGVsYWdvIGEgbGEgcml2YSw8L3A+PHA+c2kgdm9sZ2UgYSBsJnJzcXVvO2FjcXVhIHBlcmlnbGlvc2EgZSBndWF0YSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmNvcyZpZ3JhdmU7IGwmcnNxdW87YW5pbW8gbWlvLCBjaCZyc3F1bzthbmNvciBmdWdnaXZhLDwvcD48cD5zaSB2b2xzZSBhIHJldHJvIGEgcmltaXJhciBsbyBwYXNzbzwvcD48cD5jaGUgbm9uIGxhc2NpJm9ncmF2ZTsgZ2kmYWdyYXZlOyBtYWkgcGVyc29uYSB2aXZhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UG9pIGNoJnJzcXVvOyZlZ3JhdmU7aSBwb3NhdG8gdW4gcG9jbyBpbCBjb3JwbyBsYXNzbyw8L3A+PHA+cmlwcmVzaSB2aWEgcGVyIGxhIHBpYWdnaWEgZGlzZXJ0YSw8L3A+PHA+cyZpZ3JhdmU7IGNoZSAmcnNxdW87bCBwaSZlZ3JhdmU7IGZlcm1vIHNlbXByZSBlcmEgJnJzcXVvO2wgcGkmdWdyYXZlOyBiYXNzby48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkVkIGVjY28sIHF1YXNpIGFsIGNvbWluY2lhciBkZSBsJnJzcXVvO2VydGEsPC9wPjxwPnVuYSBsb256YSBsZWdnZXJhIGUgcHJlc3RhIG1vbHRvLDwvcD48cD5jaGUgZGkgcGVsIG1hY29sYXRvIGVyYSBjb3ZlcnRhOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+ZSBub24gbWkgc2kgcGFydGlhIGRpbmFuemkgYWwgdm9sdG8sPC9wPjxwPmFuemkgJnJzcXVvO21wZWRpdmEgdGFudG8gaWwgbWlvIGNhbW1pbm8sPC9wPjxwPmNoJnJzcXVvO2kmcnNxdW87IGZ1aSBwZXIgcml0b3JuYXIgcGkmdWdyYXZlOyB2b2x0ZSB2Jm9ncmF2ZTtsdG8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UZW1wJnJzcXVvOyBlcmEgZGFsIHByaW5jaXBpbyBkZWwgbWF0dGlubyw8L3A+PHA+ZSAmcnNxdW87bCBzb2wgbW9udGF2YSAmcnNxdW87biBzJnVncmF2ZTsgY29uIHF1ZWxsZSBzdGVsbGU8L3A+PHA+Y2gmcnNxdW87ZXJhbiBjb24gbHVpIHF1YW5kbyBsJnJzcXVvO2Ftb3IgZGl2aW5vPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5tb3NzZSBkaSBwcmltYSBxdWVsbGUgY29zZSBiZWxsZTs8L3A+PHA+cyZpZ3JhdmU7IGNoJnJzcXVvO2EgYmVuZSBzcGVyYXIgbSZyc3F1bztlcmEgY2FnaW9uZTwvcD48cD5kaSBxdWVsbGEgZmllcmEgYSBsYSBnYWV0dGEgcGVsbGU8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmwmcnNxdW87b3JhIGRlbCB0ZW1wbyBlIGxhIGRvbGNlIHN0YWdpb25lOzwvcD48cD5tYSBub24gcyZpZ3JhdmU7IGNoZSBwYXVyYSBub24gbWkgZGVzc2U8L3A+PHA+bGEgdmlzdGEgY2hlIG0mcnNxdW87YXBwYXJ2ZSBkJnJzcXVvO3VuIGxlb25lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVlc3RpIHBhcmVhIGNoZSBjb250cmEgbWUgdmVuaXNzZTwvcD48cD5jb24gbGEgdGVzdCZyc3F1bzsgYWx0YSBlIGNvbiByYWJiaW9zYSBmYW1lLDwvcD48cD5zJmlncmF2ZTsgY2hlIHBhcmVhIGNoZSBsJnJzcXVvO2FlcmUgbmUgdHJlbWVzc2UuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FZCB1bmEgbHVwYSwgY2hlIGRpIHR1dHRlIGJyYW1lPC9wPjxwPnNlbWJpYXZhIGNhcmNhIG5lIGxhIHN1YSBtYWdyZXp6YSw8L3A+PHA+ZSBtb2x0ZSBnZW50aSBmJmVhY3V0ZTsgZ2kmYWdyYXZlOyB2aXZlciBncmFtZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPnF1ZXN0YSBtaSBwb3JzZSB0YW50byBkaSBncmF2ZXp6YTwvcD48cD5jb24gbGEgcGF1cmEgY2gmcnNxdW87dXNjaWEgZGkgc3VhIHZpc3RhLDwvcD48cD5jaCZyc3F1bztpbyBwZXJkZWkgbGEgc3BlcmFuemEgZGUgbCZyc3F1bzthbHRlenphLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSBxdWFsICZlZ3JhdmU7IHF1ZWkgY2hlIHZvbG9udGllcmkgYWNxdWlzdGEsPC9wPjxwPmUgZ2l1Z25lICZyc3F1bztsIHRlbXBvIGNoZSBwZXJkZXIgbG8gZmFjZSw8L3A+PHA+Y2hlICZyc3F1bztuIHR1dHRpIHN1b2kgcGVuc2llciBwaWFuZ2UgZSBzJnJzcXVvO2F0dHJpc3RhOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+dGFsIG1pIGZlY2UgbGEgYmVzdGlhIHNhbnphIHBhY2UsPC9wPjxwPmNoZSwgdmVuZW5kb21pICZyc3F1bztuY29udHJvLCBhIHBvY28gYSBwb2NvPC9wPjxwPm1pIHJpcGlnbmV2YSBsJmFncmF2ZTsgZG92ZSAmcnNxdW87bCBzb2wgdGFjZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1lbnRyZSBjaCZyc3F1bztpJnJzcXVvOyByb3ZpbmF2YSBpbiBiYXNzbyBsb2NvLDwvcD48cD5kaW5hbnppIGEgbGkgb2NjaGkgbWkgc2kgZnUgb2ZmZXJ0bzwvcD48cD5jaGkgcGVyIGx1bmdvIHNpbGVuemlvIHBhcmVhIGZpb2NvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVhbmRvIHZpZGkgY29zdHVpIG5lbCBncmFuIGRpc2VydG8sPC9wPjxwPiZsYXF1bztNaXNlcmVyZSBkaSBtZSZyYXF1bzssIGdyaWRhaSBhIGx1aSw8L3A+PHA+JmxhcXVvO3F1YWwgY2hlIHR1IHNpaSwgb2Qgb21icmEgb2Qgb21vIGNlcnRvISZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5SaXNwdW9zZW1pOiAmbGFxdW87Tm9uIG9tbywgb21vIGdpJmFncmF2ZTsgZnVpLDwvcD48cD5lIGxpIHBhcmVudGkgbWllaSBmdXJvbiBsb21iYXJkaSw8L3A+PHA+bWFudG9hbmkgcGVyIHBhdHImaXVtbDthIGFtYmVkdWkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5OYWNxdWkgc3ViIEl1bGlvLCBhbmNvciBjaGUgZm9zc2UgdGFyZGksPC9wPjxwPmUgdmlzc2kgYSBSb21hIHNvdHRvICZyc3F1bztsIGJ1b25vIEF1Z3VzdG88L3A+PHA+bmVsIHRlbXBvIGRlIGxpIGQmZWdyYXZlO2kgZmFsc2kgZSBidWdpYXJkaS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlBvZXRhIGZ1aSwgZSBjYW50YWkgZGkgcXVlbCBnaXVzdG88L3A+PHA+ZmlnbGl1b2wgZCZyc3F1bztBbmNoaXNlIGNoZSB2ZW5uZSBkaSBUcm9pYSw8L3A+PHA+cG9pIGNoZSAmcnNxdW87bCBzdXBlcmJvIElsJml1bWw7Jm9hY3V0ZTtuIGZ1IGNvbWJ1c3RvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWEgdHUgcGVyY2gmZWFjdXRlOyByaXRvcm5pIGEgdGFudGEgbm9pYT88L3A+PHA+cGVyY2gmZWFjdXRlOyBub24gc2FsaSBpbCBkaWxldHRvc28gbW9udGU8L3A+PHA+Y2gmcnNxdW87JmVncmF2ZTsgcHJpbmNpcGlvIGUgY2FnaW9uIGRpIHR1dHRhIGdpb2lhPyZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGFxdW87T3Igc2UmcnNxdW87IHR1IHF1ZWwgVmlyZ2lsaW8gZSBxdWVsbGEgZm9udGU8L3A+PHA+Y2hlIHNwYW5kaSBkaSBwYXJsYXIgcyZpZ3JhdmU7IGxhcmdvIGZpdW1lPyZyYXF1bzssPC9wPjxwPnJpc3B1b3MmcnNxdW87IGlvIGx1aSBjb24gdmVyZ29nbm9zYSBmcm9udGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGFxdW87TyBkZSBsaSBhbHRyaSBwb2V0aSBvbm9yZSBlIGx1bWUsPC9wPjxwPnZhZ2xpYW1pICZyc3F1bztsIGx1bmdvIHN0dWRpbyBlICZyc3F1bztsIGdyYW5kZSBhbW9yZTwvcD48cD5jaGUgbSZyc3F1bztoYSBmYXR0byBjZXJjYXIgbG8gdHVvIHZvbHVtZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlR1IHNlJnJzcXVvOyBsbyBtaW8gbWFlc3RybyBlICZyc3F1bztsIG1pbyBhdXRvcmUsPC9wPjxwPnR1IHNlJnJzcXVvOyBzb2xvIGNvbHVpIGRhIGN1JnJzcXVvOyBpbyB0b2xzaTwvcD48cD5sbyBiZWxsbyBzdGlsbyBjaGUgbSZyc3F1bztoYSBmYXR0byBvbm9yZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlZlZGkgbGEgYmVzdGlhIHBlciBjdSZyc3F1bzsgaW8gbWkgdm9sc2k7PC9wPjxwPmFpdXRhbWkgZGEgbGVpLCBmYW1vc28gc2FnZ2lvLDwvcD48cD5jaCZyc3F1bztlbGxhIG1pIGZhIHRyZW1hciBsZSB2ZW5lIGUgaSBwb2xzaSZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGFxdW87QSB0ZSBjb252aWVuIHRlbmVyZSBhbHRybyB2Jml1bWw7YWdnaW8mcmFxdW87LDwvcD48cD5yaXNwdW9zZSwgcG9pIGNoZSBsYWdyaW1hciBtaSB2aWRlLDwvcD48cD4mbGFxdW87c2UgdnVvJnJzcXVvOyBjYW1wYXIgZCZyc3F1bztlc3RvIGxvY28gc2VsdmFnZ2lvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Y2gmZWFjdXRlOyBxdWVzdGEgYmVzdGlhLCBwZXIgbGEgcXVhbCB0dSBncmlkZSw8L3A+PHA+bm9uIGxhc2NpYSBhbHRydWkgcGFzc2FyIHBlciBsYSBzdWEgdmlhLDwvcD48cD5tYSB0YW50byBsbyAmcnNxdW87bXBlZGlzY2UgY2hlIGwmcnNxdW87dWNjaWRlOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+ZSBoYSBuYXR1cmEgcyZpZ3JhdmU7IG1hbHZhZ2lhIGUgcmlhLDwvcD48cD5jaGUgbWFpIG5vbiBlbXBpZSBsYSBicmFtb3NhIHZvZ2xpYSw8L3A+PHA+ZSBkb3BvICZyc3F1bztsIHBhc3RvIGhhIHBpJnVncmF2ZTsgZmFtZSBjaGUgcHJpYS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1vbHRpIHNvbiBsaSBhbmltYWxpIGEgY3VpIHMmcnNxdW87YW1tb2dsaWEsPC9wPjxwPmUgcGkmdWdyYXZlOyBzYXJhbm5vIGFuY29yYSwgaW5maW4gY2hlICZyc3F1bztsIHZlbHRybzwvcD48cD52ZXJyJmFncmF2ZTssIGNoZSBsYSBmYXImYWdyYXZlOyBtb3JpciBjb24gZG9nbGlhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVlc3RpIG5vbiBjaWJlciZhZ3JhdmU7IHRlcnJhIG4mZWFjdXRlOyBwZWx0cm8sPC9wPjxwPm1hIHNhcCZpdW1sO2VuemEsIGFtb3JlIGUgdmlydHV0ZSw8L3A+PHA+ZSBzdWEgbmF6aW9uIHNhciZhZ3JhdmU7IHRyYSBmZWx0cm8gZSBmZWx0cm8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5EaSBxdWVsbGEgdW1pbGUgSXRhbGlhIGZpYSBzYWx1dGU8L3A+PHA+cGVyIGN1aSBtb3ImaWdyYXZlOyBsYSB2ZXJnaW5lIENhbW1pbGxhLDwvcD48cD5FdXJpYWxvIGUgVHVybm8gZSBOaXNvIGRpIGZlcnV0ZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlF1ZXN0aSBsYSBjYWNjZXImYWdyYXZlOyBwZXIgb2duZSB2aWxsYSw8L3A+PHA+ZmluIGNoZSBsJnJzcXVvO2F2ciZhZ3JhdmU7IHJpbWVzc2EgbmUgbG8gJnJzcXVvO25mZXJubyw8L3A+PHA+bCZhZ3JhdmU7IG9uZGUgJnJzcXVvO252aWRpYSBwcmltYSBkaXBhcnRpbGxhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+T25kJnJzcXVvOyBpbyBwZXIgbG8gdHVvIG1lJnJzcXVvOyBwZW5zbyBlIGRpc2Nlcm5vPC9wPjxwPmNoZSB0dSBtaSBzZWd1aSwgZSBpbyBzYXImb2dyYXZlOyB0dWEgZ3VpZGEsPC9wPjxwPmUgdHJhcnJvdHRpIGRpIHF1aSBwZXIgbG9jbyBldHRlcm5vOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+b3ZlIHVkaXJhaSBsZSBkaXNwZXJhdGUgc3RyaWRhLDwvcD48cD52ZWRyYWkgbGkgYW50aWNoaSBzcGlyaXRpIGRvbGVudGksPC9wPjxwPmNoJnJzcXVvO2EgbGEgc2Vjb25kYSBtb3J0ZSBjaWFzY3VuIGdyaWRhOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+ZSB2ZWRlcmFpIGNvbG9yIGNoZSBzb24gY29udGVudGk8L3A+PHA+bmVsIGZvY28sIHBlcmNoJmVhY3V0ZTsgc3BlcmFuIGRpIHZlbmlyZTwvcD48cD5xdWFuZG8gY2hlIHNpYSBhIGxlIGJlYXRlIGdlbnRpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QSBsZSBxdWFpIHBvaSBzZSB0dSB2b3JyYWkgc2FsaXJlLDwvcD48cD5hbmltYSBmaWEgYSBjaSZvZ3JhdmU7IHBpJnVncmF2ZTsgZGkgbWUgZGVnbmE6PC9wPjxwPmNvbiBsZWkgdGkgbGFzY2VyJm9ncmF2ZTsgbmVsIG1pbyBwYXJ0aXJlOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Y2gmZWFjdXRlOyBxdWVsbG8gaW1wZXJhZG9yIGNoZSBsJmFncmF2ZTsgcyZ1Z3JhdmU7IHJlZ25hLDwvcD48cD5wZXJjaCZyc3F1bzsgaSZyc3F1bzsgZnUmcnNxdW87IHJpYmVsbGFudGUgYSBsYSBzdWEgbGVnZ2UsPC9wPjxwPm5vbiB2dW9sIGNoZSAmcnNxdW87biBzdWEgY2l0dCZhZ3JhdmU7IHBlciBtZSBzaSB2ZWduYS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkluIHR1dHRlIHBhcnRpIGltcGVyYSBlIHF1aXZpIHJlZ2dlOzwvcD48cD5xdWl2aSAmZWdyYXZlOyBsYSBzdWEgY2l0dCZhZ3JhdmU7IGUgbCZyc3F1bzthbHRvIHNlZ2dpbzo8L3A+PHA+b2ggZmVsaWNlIGNvbHVpIGN1JnJzcXVvOyBpdmkgZWxlZ2dlISZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FIGlvIGEgbHVpOiAmbGFxdW87UG9ldGEsIGlvIHRpIHJpY2hlZ2dpbzwvcD48cD5wZXIgcXVlbGxvIERpbyBjaGUgdHUgbm9uIGNvbm9zY2VzdGksPC9wPjxwPmFjY2kmb2dyYXZlOyBjaCZyc3F1bztpbyBmdWdnYSBxdWVzdG8gbWFsZSBlIHBlZ2dpbyw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmNoZSB0dSBtaSBtZW5pIGwmYWdyYXZlOyBkb3YmcnNxdW87IG9yIGRpY2VzdGksPC9wPjxwPnMmaWdyYXZlOyBjaCZyc3F1bztpbyB2ZWdnaWEgbGEgcG9ydGEgZGkgc2FuIFBpZXRybzwvcD48cD5lIGNvbG9yIGN1aSB0dSBmYWkgY290YW50byBtZXN0aSZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbGxvciBzaSBtb3NzZSwgZSBpbyBsaSB0ZW5uaSBkaWV0cm8uPC9wPjwvZGl2PicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+MjwvcD5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5MbyBnaW9ybm8gc2UgbiZyc3F1bzthbmRhdmEsIGUgbCZyc3F1bzthZXJlIGJydW5vPC9wPjxwPnRvZ2xpZXZhIGxpIGFuaW1haSBjaGUgc29ubyBpbiB0ZXJyYTwvcD48cD5kYSBsZSBmYXRpY2hlIGxvcm87IGUgaW8gc29sIHVubzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+bSZyc3F1bzthcHBhcmVjY2hpYXZhIGEgc29zdGVuZXIgbGEgZ3VlcnJhPC9wPjxwPnMmaWdyYXZlOyBkZWwgY2FtbWlubyBlIHMmaWdyYXZlOyBkZSBsYSBwaWV0YXRlLDwvcD48cD5jaGUgcml0cmFyciZhZ3JhdmU7IGxhIG1lbnRlIGNoZSBub24gZXJyYS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk8gbXVzZSwgbyBhbHRvIGluZ2Vnbm8sIG9yIG0mcnNxdW87YWl1dGF0ZTs8L3A+PHA+byBtZW50ZSBjaGUgc2NyaXZlc3RpIGNpJm9ncmF2ZTsgY2gmcnNxdW87aW8gdmlkaSw8L3A+PHA+cXVpIHNpIHBhcnImYWdyYXZlOyBsYSB0dWEgbm9iaWxpdGF0ZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPklvIGNvbWluY2lhaTogJmxhcXVvO1BvZXRhIGNoZSBtaSBndWlkaSw8L3A+PHA+Z3VhcmRhIGxhIG1pYSB2aXJ0JnVncmF2ZTsgcyZyc3F1bztlbGwmcnNxdW87ICZlZ3JhdmU7IHBvc3NlbnRlLDwvcD48cD5wcmltYSBjaCZyc3F1bzthIGwmcnNxdW87YWx0byBwYXNzbyB0dSBtaSBmaWRpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VHUgZGljaSBjaGUgZGkgU2lsdiZpdW1sO28gaWwgcGFyZW50ZSw8L3A+PHA+Y29ycnV0dGliaWxlIGFuY29yYSwgYWQgaW1tb3J0YWxlPC9wPjxwPnNlY29sbyBhbmQmb2dyYXZlOywgZSBmdSBzZW5zaWJpbG1lbnRlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UGVyJm9ncmF2ZTssIHNlIGwmcnNxdW87YXZ2ZXJzYXJpbyBkJnJzcXVvO29nbmUgbWFsZTwvcD48cD5jb3J0ZXNlIGkgZnUsIHBlbnNhbmRvIGwmcnNxdW87YWx0byBlZmZldHRvPC9wPjxwPmNoJnJzcXVvO3VzY2lyIGRvdmVhIGRpIGx1aSwgZSAmcnNxdW87bCBjaGkgZSAmcnNxdW87bCBxdWFsZTwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+bm9uIHBhcmUgaW5kZWdubyBhZCBvbW8gZCZyc3F1bztpbnRlbGxldHRvOzwvcD48cD5jaCZyc3F1bztlJnJzcXVvOyBmdSBkZSBsJnJzcXVvO2FsbWEgUm9tYSBlIGRpIHN1byBpbXBlcm88L3A+PHA+bmUgbCZyc3F1bztlbXBpcmVvIGNpZWwgcGVyIHBhZHJlIGVsZXR0bzo8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmxhIHF1YWxlIGUgJnJzcXVvO2wgcXVhbGUsIGEgdm9sZXIgZGlyIGxvIHZlcm8sPC9wPjxwPmZ1IHN0YWJpbGl0YSBwZXIgbG8gbG9jbyBzYW50bzwvcD48cD51JnJzcXVvOyBzaWVkZSBpbCBzdWNjZXNzb3IgZGVsIG1hZ2dpb3IgUGllcm8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5QZXIgcXVlc3QmcnNxdW87IGFuZGF0YSBvbmRlIGxpIGRhaSB0dSB2YW50byw8L3A+PHA+aW50ZXNlIGNvc2UgY2hlIGZ1cm9uIGNhZ2lvbmU8L3A+PHA+ZGkgc3VhIHZpdHRvcmlhIGUgZGVsIHBhcGFsZSBhbW1hbnRvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kb3Z2aSBwb2kgbG8gVmFzIGQmcnNxdW87ZWxleiZpdW1sO29uZSw8L3A+PHA+cGVyIHJlY2FybmUgY29uZm9ydG8gYSBxdWVsbGEgZmVkZTwvcD48cD5jaCZyc3F1bzsmZWdyYXZlOyBwcmluY2lwaW8gYSBsYSB2aWEgZGkgc2FsdmF6aW9uZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1hIGlvLCBwZXJjaCZlYWN1dGU7IHZlbmlydmk/IG8gY2hpICZyc3F1bztsIGNvbmNlZGU/PC9wPjxwPklvIG5vbiBFbsOrYSwgaW8gbm9uIFBhdWxvIHNvbm87PC9wPjxwPm1lIGRlZ25vIGEgY2kmb2dyYXZlOyBuJmVhY3V0ZTsgaW8gbiZlYWN1dGU7IGFsdHJpICZyc3F1bztsIGNyZWRlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UGVyIGNoZSwgc2UgZGVsIHZlbmlyZSBpbyBtJnJzcXVvO2FiYmFuZG9ubyw8L3A+PHA+dGVtbyBjaGUgbGEgdmVudXRhIG5vbiBzaWEgZm9sbGUuPC9wPjxwPlNlJnJzcXVvOyBzYXZpbzsgaW50ZW5kaSBtZSZyc3F1bzsgY2gmcnNxdW87aSZyc3F1bzsgbm9uIHJhZ2lvbm8mcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSBxdWFsICZlZ3JhdmU7IHF1ZWkgY2hlIGRpc3Z1b2wgY2kmb2dyYXZlOyBjaGUgdm9sbGU8L3A+PHA+ZSBwZXIgbm92aSBwZW5zaWVyIGNhbmdpYSBwcm9wb3N0YSw8L3A+PHA+cyZpZ3JhdmU7IGNoZSBkYWwgY29taW5jaWFyIHR1dHRvIHNpIHRvbGxlLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+dGFsIG1pIGZlYyZyc3F1bzsgJml1bWw7byAmcnNxdW87biBxdWVsbGEgb3NjdXJhIGNvc3RhLDwvcD48cD5wZXJjaCZlYWN1dGU7LCBwZW5zYW5kbywgY29uc3VtYWkgbGEgJnJzcXVvO21wcmVzYTwvcD48cD5jaGUgZnUgbmVsIGNvbWluY2lhciBjb3RhbnRvIHRvc3RhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxhcXVvO1MmcnNxdW87aSZyc3F1bzsgaG8gYmVuIGxhIHBhcm9sYSB0dWEgaW50ZXNhJnJhcXVvOyw8L3A+PHA+cmlzcHVvc2UgZGVsIG1hZ25hbmltbyBxdWVsbCZyc3F1bzsgb21icmEsPC9wPjxwPiZsYXF1bztsJnJzcXVvO2FuaW1hIHR1YSAmZWdyYXZlOyBkYSB2aWx0YWRlIG9mZmVzYTs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmxhIHF1YWwgbW9sdGUgZiZpdW1sO2F0ZSBsJnJzcXVvO29tbyBpbmdvbWJyYTwvcD48cD5zJmlncmF2ZTsgY2hlIGQmcnNxdW87b25yYXRhIGltcHJlc2EgbG8gcml2b2x2ZSw8L3A+PHA+Y29tZSBmYWxzbyB2ZWRlciBiZXN0aWEgcXVhbmQmcnNxdW87IG9tYnJhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RGEgcXVlc3RhIHRlbWEgYWNjaSZvZ3JhdmU7IGNoZSB0dSB0aSBzb2x2ZSw8L3A+PHA+ZGlyb3R0aSBwZXJjaCZyc3F1bzsgaW8gdmVubmkgZSBxdWVsIGNoJnJzcXVvO2lvICZyc3F1bztudGVzaTwvcD48cD5uZWwgcHJpbW8gcHVudG8gY2hlIGRpIHRlIG1pIGRvbHZlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SW8gZXJhIHRyYSBjb2xvciBjaGUgc29uIHNvc3Blc2ksPC9wPjxwPmUgZG9ubmEgbWkgY2hpYW0mb2dyYXZlOyBiZWF0YSBlIGJlbGxhLDwvcD48cD50YWwgY2hlIGRpIGNvbWFuZGFyZSBpbyBsYSByaWNoaWVzaS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkx1Y2V2YW4gbGkgb2NjaGkgc3VvaSBwaSZ1Z3JhdmU7IGNoZSBsYSBzdGVsbGE7PC9wPjxwPmUgY29taW5jaW9tbWkgYSBkaXIgc29hdmUgZSBwaWFuYSw8L3A+PHA+Y29uIGFuZ2VsaWNhIHZvY2UsIGluIHN1YSBmYXZlbGxhOjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+4oCcTyBhbmltYSBjb3J0ZXNlIG1hbnRvYW5hLDwvcD48cD5kaSBjdWkgbGEgZmFtYSBhbmNvciBuZWwgbW9uZG8gZHVyYSw8L3A+PHA+ZSBkdXJlciZhZ3JhdmU7IHF1YW50byAmcnNxdW87bCBtb25kbyBsb250YW5hLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+bCZyc3F1bzthbWljbyBtaW8sIGUgbm9uIGRlIGxhIHZlbnR1cmEsPC9wPjxwPm5lIGxhIGRpc2VydGEgcGlhZ2dpYSAmZWdyYXZlOyBpbXBlZGl0bzwvcD48cD5zJmlncmF2ZTsgbmVsIGNhbW1pbiwgY2hlIHYmb2dyYXZlO2x0JnJzcXVvOyAmZWdyYXZlOyBwZXIgcGF1cmE7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5lIHRlbW8gY2hlIG5vbiBzaWEgZ2kmYWdyYXZlOyBzJmlncmF2ZTsgc21hcnJpdG8sPC9wPjxwPmNoJnJzcXVvO2lvIG1pIHNpYSB0YXJkaSBhbCBzb2Njb3JzbyBsZXZhdGEsPC9wPjxwPnBlciBxdWVsIGNoJnJzcXVvO2kmcnNxdW87IGhvIGRpIGx1aSBuZWwgY2llbG8gdWRpdG8uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5PciBtb3ZpLCBlIGNvbiBsYSB0dWEgcGFyb2xhIG9ybmF0YTwvcD48cD5lIGNvbiBjaSZvZ3JhdmU7IGMmcnNxdW87aGEgbWVzdGllcmkgYWwgc3VvIGNhbXBhcmUsPC9wPjxwPmwmcnNxdW87YWl1dGEgcyZpZ3JhdmU7IGNoJnJzcXVvO2kmcnNxdW87IG5lIHNpYSBjb25zb2xhdGEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JJnJzcXVvOyBzb24gQmVhdHJpY2UgY2hlIHRpIGZhY2NpbyBhbmRhcmU7PC9wPjxwPnZlZ25vIGRlbCBsb2NvIG92ZSB0b3JuYXIgZGlzaW87PC9wPjxwPmFtb3IgbWkgbW9zc2UsIGNoZSBtaSBmYSBwYXJsYXJlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVhbmRvIHNhciZvZ3JhdmU7IGRpbmFuemkgYWwgc2Vnbm9yIG1pbyw8L3A+PHA+ZGkgdGUgbWkgbG9kZXImb2dyYXZlOyBzb3ZlbnRlIGEgbHVp4oCdLjwvcD48cD5UYWNldHRlIGFsbG9yYSwgZSBwb2kgY29taW5jaWEmcnNxdW87IGlvOjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+4oCcTyBkb25uYSBkaSB2aXJ0JnVncmF2ZTsgc29sYSBwZXIgY3VpPC9wPjxwPmwmcnNxdW87dW1hbmEgc3BlemllIGVjY2VkZSBvZ25lIGNvbnRlbnRvPC9wPjxwPmRpIHF1ZWwgY2llbCBjJnJzcXVvO2hhIG1pbm9yIGxpIGNlcmNoaSBzdWksPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD50YW50byBtJnJzcXVvO2FnZ3JhZGEgaWwgdHVvIGNvbWFuZGFtZW50byw8L3A+PHA+Y2hlIGwmcnNxdW87dWJpZGlyLCBzZSBnaSZhZ3JhdmU7IGZvc3NlLCBtJnJzcXVvOyZlZ3JhdmU7IHRhcmRpOzwvcD48cD5waSZ1Z3JhdmU7IG5vbiB0JnJzcXVvOyZlZ3JhdmU7IHVvJnJzcXVvOyBjaCZyc3F1bzthcHJpcm1pIGlsIHR1byB0YWxlbnRvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWEgZGltbWkgbGEgY2FnaW9uIGNoZSBub24gdGkgZ3VhcmRpPC9wPjxwPmRlIGxvIHNjZW5kZXIgcXVhIGdpdXNvIGluIHF1ZXN0byBjZW50cm88L3A+PHA+ZGUgbCZyc3F1bzthbXBpbyBsb2NvIG92ZSB0b3JuYXIgdHUgYXJkaeKAnS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPuKAnERhIGNoZSB0dSB2dW8mcnNxdW87IHNhdmVyIGNvdGFudG8gYSBkZW50cm8sPC9wPjxwPmRpcm90dGkgYnJpZXZlbWVudGXigJ0sIG1pIHJpc3B1b3NlLDwvcD48cD7igJxwZXJjaCZyc3F1bzsgaSZyc3F1bzsgbm9uIHRlbW8gZGkgdmVuaXIgcXVhIGVudHJvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGVtZXIgc2kgZGVlIGRpIHNvbGUgcXVlbGxlIGNvc2U8L3A+PHA+YyZyc3F1bztoYW5ubyBwb3RlbnphIGRpIGZhcmUgYWx0cnVpIG1hbGU7PC9wPjxwPmRlIGwmcnNxdW87YWx0cmUgbm8sIGNoJmVhY3V0ZTsgbm9uIHNvbiBwYXVyb3NlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SSZyc3F1bzsgc29uIGZhdHRhIGRhIERpbywgc3VhIG1lcmMmZWFjdXRlOywgdGFsZSw8L3A+PHA+Y2hlIGxhIHZvc3RyYSBtaXNlcmlhIG5vbiBtaSB0YW5nZSw8L3A+PHA+biZlYWN1dGU7IGZpYW1tYSBkJnJzcXVvO2VzdG8gJnJzcXVvO25jZW5kaW8gbm9uIG0mcnNxdW87YXNzYWxlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RG9ubmEgJmVncmF2ZTsgZ2VudGlsIG5lbCBjaWVsIGNoZSBzaSBjb21waWFuZ2U8L3A+PHA+ZGkgcXVlc3RvICZyc3F1bzttcGVkaW1lbnRvIG92JnJzcXVvOyBpbyB0aSBtYW5kbyw8L3A+PHA+cyZpZ3JhdmU7IGNoZSBkdXJvIGdpdWRpY2lvIGwmYWdyYXZlOyBzJnVncmF2ZTsgZnJhbmdlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVlc3RhIGNoaWVzZSBMdWNpYSBpbiBzdW8gZGltYW5kbzwvcD48cD5lIGRpc3NlOuKAlE9yIGhhIGJpc29nbm8gaWwgdHVvIGZlZGVsZTwvcD48cD5kaSB0ZSwgZSBpbyBhIHRlIGxvIHJhY2NvbWFuZG/igJQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5MdWNpYSwgbmltaWNhIGRpIGNpYXNjdW4gY3J1ZGVsZSw8L3A+PHA+c2kgbW9zc2UsIGUgdmVubmUgYWwgbG9jbyBkb3YmcnNxdW87IGkmcnNxdW87IGVyYSw8L3A+PHA+Y2hlIG1pIHNlZGVhIGNvbiBsJnJzcXVvO2FudGljYSBSYWNoZWxlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RGlzc2U64oCUQmVhdHJpY2UsIGxvZGEgZGkgRGlvIHZlcmEsPC9wPjxwPmNoJmVhY3V0ZTsgbm9uIHNvY2NvcnJpIHF1ZWkgY2hlIHQmcnNxdW87YW0mb2dyYXZlOyB0YW50byw8L3A+PHA+Y2gmcnNxdW87dXNjJmlncmF2ZTsgcGVyIHRlIGRlIGxhIHZvbGdhcmUgc2NoaWVyYT88L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk5vbiBvZGkgdHUgbGEgcGlldGEgZGVsIHN1byBwaWFudG8sPC9wPjxwPm5vbiB2ZWRpIHR1IGxhIG1vcnRlIGNoZSAmcnNxdW87bCBjb21iYXR0ZTwvcD48cD5zdSBsYSBmaXVtYW5hIG92ZSAmcnNxdW87bCBtYXIgbm9uIGhhIHZhbnRvP+KAlC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFsIG1vbmRvIG5vbiBmdXIgbWFpIHBlcnNvbmUgcmF0dGU8L3A+PHA+YSBmYXIgbG9yIHBybyBvIGEgZnVnZ2lyIGxvciBkYW5ubyw8L3A+PHA+Y29tJnJzcXVvOyBpbywgZG9wbyBjb3RhaSBwYXJvbGUgZmF0dGUsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD52ZW5uaSBxdWEgZ2kmdWdyYXZlOyBkZWwgbWlvIGJlYXRvIHNjYW5ubyw8L3A+PHA+ZmlkYW5kb21pIGRlbCB0dW8gcGFybGFyZSBvbmVzdG8sPC9wPjxwPmNoJnJzcXVvO29ub3JhIHRlIGUgcXVlaSBjaCZyc3F1bzt1ZGl0byBsJnJzcXVvO2hhbm5v4oCdLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UG9zY2lhIGNoZSBtJnJzcXVvO2ViYmUgcmFnaW9uYXRvIHF1ZXN0byw8L3A+PHA+bGkgb2NjaGkgbHVjZW50aSBsYWdyaW1hbmRvIHZvbHNlLDwvcD48cD5wZXIgY2hlIG1pIGZlY2UgZGVsIHZlbmlyIHBpJnVncmF2ZTsgcHJlc3RvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSB2ZW5uaSBhIHRlIGNvcyZpZ3JhdmU7IGNvbSZyc3F1bzsgZWxsYSB2b2xzZTo8L3A+PHA+ZCZyc3F1bztpbmFuemkgYSBxdWVsbGEgZmllcmEgdGkgbGV2YWk8L3A+PHA+Y2hlIGRlbCBiZWwgbW9udGUgaWwgY29ydG8gYW5kYXIgdGkgdG9sc2UuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5EdW5xdWU6IGNoZSAmZWdyYXZlOz8gcGVyY2gmZWFjdXRlOywgcGVyY2gmZWFjdXRlOyByZXN0YWksPC9wPjxwPnBlcmNoJmVhY3V0ZTsgdGFudGEgdmlsdCZhZ3JhdmU7IG5lbCBjb3JlIGFsbGV0dGUsPC9wPjxwPnBlcmNoJmVhY3V0ZTsgYXJkaXJlIGUgZnJhbmNoZXp6YSBub24gaGFpLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+cG9zY2lhIGNoZSB0YWkgdHJlIGRvbm5lIGJlbmVkZXR0ZTwvcD48cD5jdXJhbiBkaSB0ZSBuZSBsYSBjb3J0ZSBkZWwgY2llbG8sPC9wPjxwPmUgJnJzcXVvO2wgbWlvIHBhcmxhciB0YW50byBiZW4gdGkgcHJvbWV0dGU/JnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlF1YWxpIGZpb3JldHRpIGRhbCBub3R0dXJubyBnZWxvPC9wPjxwPmNoaW5hdGkgZSBjaGl1c2ksIHBvaSBjaGUgJnJzcXVvO2wgc29sIGxpICZyc3F1bzttYmlhbmNhLDwvcD48cD5zaSBkcml6emFuIHR1dHRpIGFwZXJ0aSBpbiBsb3JvIHN0ZWxvLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+dGFsIG1pIGZlYyZyc3F1bzsgaW8gZGkgbWlhIHZpcnR1ZGUgc3RhbmNhLDwvcD48cD5lIHRhbnRvIGJ1b25vIGFyZGlyZSBhbCBjb3IgbWkgY29yc2UsPC9wPjxwPmNoJnJzcXVvO2kmcnNxdW87IGNvbWluY2lhaSBjb21lIHBlcnNvbmEgZnJhbmNhOjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxhcXVvO09oIHBpZXRvc2EgY29sZWkgY2hlIG1pIHNvY2NvcnNlITwvcD48cD5lIHRlIGNvcnRlc2UgY2gmcnNxdW87dWJpZGlzdGkgdG9zdG88L3A+PHA+YSBsZSB2ZXJlIHBhcm9sZSBjaGUgdGkgcG9yc2UhPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UdSBtJnJzcXVvO2hhaSBjb24gZGlzaWRlcmlvIGlsIGNvciBkaXNwb3N0bzwvcD48cD5zJmlncmF2ZTsgYWwgdmVuaXIgY29uIGxlIHBhcm9sZSB0dWUsPC9wPjxwPmNoJnJzcXVvO2kmcnNxdW87IHNvbiB0b3JuYXRvIG5lbCBwcmltbyBwcm9wb3N0by48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk9yIHZhLCBjaCZyc3F1bzt1biBzb2wgdm9sZXJlICZlZ3JhdmU7IGQmcnNxdW87YW1iZWR1ZTo8L3A+PHA+dHUgZHVjYSwgdHUgc2Vnbm9yZSBlIHR1IG1hZXN0cm8mcmFxdW87LjwvcD48cD5Db3MmaWdyYXZlOyBsaSBkaXNzaTsgZSBwb2kgY2hlIG1vc3NvIGZ1ZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmludHJhaSBwZXIgbG8gY2FtbWlubyBhbHRvIGUgc2lsdmVzdHJvLjwvcD48L2Rpdj4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPjM8L3A+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPuKAmCZsc3F1bztQZXIgbWUgc2kgdmEgbmUgbGEgY2l0dCZhZ3JhdmU7IGRvbGVudGUsPC9wPjxwPnBlciBtZSBzaSB2YSBuZSBsJnJzcXVvO2V0dGVybm8gZG9sb3JlLDwvcD48cD5wZXIgbWUgc2kgdmEgdHJhIGxhIHBlcmR1dGEgZ2VudGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5HaXVzdGl6aWEgbW9zc2UgaWwgbWlvIGFsdG8gZmF0dG9yZTs8L3A+PHA+ZmVjZW1pIGxhIGRpdmluYSBwb2Rlc3RhdGUsPC9wPjxwPmxhIHNvbW1hIHNhcCZpdW1sO2VuemEgZSAmcnNxdW87bCBwcmltbyBhbW9yZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkRpbmFuemkgYSBtZSBub24gZnVvciBjb3NlIGNyZWF0ZTwvcD48cD5zZSBub24gZXR0ZXJuZSwgZSBpbyBldHRlcm5vIGR1cm8uPC9wPjxwPkxhc2NpYXRlIG9nbmUgc3BlcmFuemEsIHZvaSBjaCZyc3F1bztpbnRyYXRlJnJzcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlF1ZXN0ZSBwYXJvbGUgZGkgY29sb3JlIG9zY3VybzwvcD48cD52aWQmcnNxdW87ICZpdW1sO28gc2NyaXR0ZSBhbCBzb21tbyBkJnJzcXVvO3VuYSBwb3J0YTs8L3A+PHA+cGVyIGNoJnJzcXVvO2lvOiAmbGFxdW87TWFlc3RybywgaWwgc2Vuc28gbG9yIG0mcnNxdW87JmVncmF2ZTsgZHVybyZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5FZCBlbGxpIGEgbWUsIGNvbWUgcGVyc29uYSBhY2NvcnRhOjwvcD48cD4mbGFxdW87UXVpIHNpIGNvbnZpZW4gbGFzY2lhcmUgb2duZSBzb3NwZXR0bzs8L3A+PHA+b2duZSB2aWx0JmFncmF2ZTsgY29udmllbiBjaGUgcXVpIHNpYSBtb3J0YS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk5vaSBzaWFtIHZlbnV0aSBhbCBsb2NvIG92JnJzcXVvOyBpJnJzcXVvOyB0JnJzcXVvO2hvIGRldHRvPC9wPjxwPmNoZSB0dSB2ZWRyYWkgbGUgZ2VudGkgZG9sb3Jvc2U8L3A+PHA+YyZyc3F1bztoYW5ubyBwZXJkdXRvIGlsIGJlbiBkZSBsJnJzcXVvO2ludGVsbGV0dG8mcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSBwb2kgY2hlIGxhIHN1YSBtYW5vIGEgbGEgbWlhIHB1b3NlPC9wPjxwPmNvbiBsaWV0byB2b2x0bywgb25kJnJzcXVvOyBpbyBtaSBjb25mb3J0YWksPC9wPjxwPm1pIG1pc2UgZGVudHJvIGEgbGUgc2VncmV0ZSBjb3NlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVpdmkgc29zcGlyaSwgcGlhbnRpIGUgYWx0aSBndWFpPC9wPjxwPnJpc29uYXZhbiBwZXIgbCZyc3F1bzthZXJlIHNhbnphIHN0ZWxsZSw8L3A+PHA+cGVyIGNoJnJzcXVvO2lvIGFsIGNvbWluY2lhciBuZSBsYWdyaW1haS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkRpdmVyc2UgbGluZ3VlLCBvcnJpYmlsaSBmYXZlbGxlLDwvcD48cD5wYXJvbGUgZGkgZG9sb3JlLCBhY2NlbnRpIGQmcnNxdW87aXJhLDwvcD48cD52b2NpIGFsdGUgZSBmaW9jaGUsIGUgc3VvbiBkaSBtYW4gY29uIGVsbGU8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmZhY2V2YW5vIHVuIHR1bXVsdG8sIGlsIHF1YWwgcyZyc3F1bzthZ2dpcmE8L3A+PHA+c2VtcHJlIGluIHF1ZWxsJnJzcXVvOyBhdXJhIHNhbnphIHRlbXBvIHRpbnRhLDwvcD48cD5jb21lIGxhIHJlbmEgcXVhbmRvIHR1cmJvIHNwaXJhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSBpbyBjaCZyc3F1bzthdmVhIGQmcnNxdW87ZXJyb3IgbGEgdGVzdGEgY2ludGEsPC9wPjxwPmRpc3NpOiAmbGFxdW87TWFlc3RybywgY2hlICZlZ3JhdmU7IHF1ZWwgY2gmcnNxdW87aSZyc3F1bzsgb2RvPzwvcD48cD5lIGNoZSBnZW50JnJzcXVvOyAmZWdyYXZlOyBjaGUgcGFyIG5lbCBkdW9sIHMmaWdyYXZlOyB2aW50YT8mcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RWQgZWxsaSBhIG1lOiAmbGFxdW87UXVlc3RvIG1pc2VybyBtb2RvPC9wPjxwPnRlZ25vbiBsJnJzcXVvO2FuaW1lIHRyaXN0ZSBkaSBjb2xvcm88L3A+PHA+Y2hlIHZpc3NlciBzYW56YSAmcnNxdW87bmZhbWlhIGUgc2FuemEgbG9kby48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1pc2NoaWF0ZSBzb25vIGEgcXVlbCBjYXR0aXZvIGNvcm88L3A+PHA+ZGUgbGkgYW5nZWxpIGNoZSBub24gZnVyb24gcmliZWxsaTwvcD48cD5uJmVhY3V0ZTsgZnVyIGZlZGVsaSBhIERpbywgbWEgcGVyIHMmZWFjdXRlOyBmdW9yby48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkNhY2NpYW5saSBpIGNpZWwgcGVyIG5vbiBlc3NlciBtZW4gYmVsbGksPC9wPjxwPm4mZWFjdXRlOyBsbyBwcm9mb25kbyBpbmZlcm5vIGxpIHJpY2V2ZSw8L3A+PHA+Y2gmcnNxdW87YWxjdW5hIGdsb3JpYSBpIHJlaSBhdnJlYmJlciBkJnJzcXVvO2VsbGkmcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSBpbzogJmxhcXVvO01hZXN0cm8sIGNoZSAmZWdyYXZlOyB0YW50byBncmV2ZTwvcD48cD5hIGxvciBjaGUgbGFtZW50YXIgbGkgZmEgcyZpZ3JhdmU7IGZvcnRlPyZyYXF1bzsuPC9wPjxwPlJpc3B1b3NlOiAmbGFxdW87RGljZXJvbHRpIG1vbHRvIGJyZXZlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UXVlc3RpIG5vbiBoYW5ubyBzcGVyYW56YSBkaSBtb3J0ZSw8L3A+PHA+ZSBsYSBsb3IgY2llY2Egdml0YSAmZWdyYXZlOyB0YW50byBiYXNzYSw8L3A+PHA+Y2hlICZyc3F1bztudmlkJml1bWw7b3NpIHNvbiBkJnJzcXVvO29nbmUgYWx0cmEgc29ydGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5GYW1hIGRpIGxvcm8gaWwgbW9uZG8gZXNzZXIgbm9uIGxhc3NhOzwvcD48cD5taXNlcmljb3JkaWEgZSBnaXVzdGl6aWEgbGkgc2RlZ25hOjwvcD48cD5ub24gcmFnaW9uaWFtIGRpIGxvciwgbWEgZ3VhcmRhIGUgcGFzc2EmcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSBpbywgY2hlIHJpZ3VhcmRhaSwgdmlkaSB1bmEgJnJzcXVvO25zZWduYTwvcD48cD5jaGUgZ2lyYW5kbyBjb3JyZXZhIHRhbnRvIHJhdHRhLDwvcD48cD5jaGUgZCZyc3F1bztvZ25lIHBvc2EgbWkgcGFyZWEgaW5kZWduYTs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmUgZGlldHJvIGxlIHZlbiZpZ3JhdmU7YSBzJmlncmF2ZTsgbHVuZ2EgdHJhdHRhPC9wPjxwPmRpIGdlbnRlLCBjaCZyc3F1bztpJnJzcXVvOyBub24gYXZlcmVpIGNyZWR1dG88L3A+PHA+Y2hlIG1vcnRlIHRhbnRhIG4mcnNxdW87YXZlc3NlIGRpc2ZhdHRhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UG9zY2lhIGNoJnJzcXVvO2lvIHYmcnNxdW87ZWJiaSBhbGN1biByaWNvbm9zY2l1dG8sPC9wPjxwPnZpZGkgZSBjb25vYmJpIGwmcnNxdW87b21icmEgZGkgY29sdWk8L3A+PHA+Y2hlIGZlY2UgcGVyIHZpbHRhZGUgaWwgZ3JhbiByaWZpdXRvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SW5jb250YW5lbnRlIGludGVzaSBlIGNlcnRvIGZ1aTwvcD48cD5jaGUgcXVlc3RhIGVyYSBsYSBzZXR0YSBkJnJzcXVvO2kgY2F0dGl2aSw8L3A+PHA+YSBEaW8gc3BpYWNlbnRpIGUgYSZyc3F1bzsgbmVtaWNpIHN1aS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlF1ZXN0aSBzY2lhdXJhdGksIGNoZSBtYWkgbm9uIGZ1ciB2aXZpLDwvcD48cD5lcmFubyBpZ251ZGkgZSBzdGltb2xhdGkgbW9sdG88L3A+PHA+ZGEgbW9zY29uaSBlIGRhIHZlc3BlIGNoJnJzcXVvO2VyYW4gaXZpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RWxsZSByaWdhdmFuIGxvciBkaSBzYW5ndWUgaWwgdm9sdG8sPC9wPjxwPmNoZSwgbWlzY2hpYXRvIGRpIGxhZ3JpbWUsIGEmcnNxdW87IGxvciBwaWVkaTwvcD48cD5kYSBmYXN0aWRpb3NpIHZlcm1pIGVyYSByaWNvbHRvLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RSBwb2kgY2gmcnNxdW87YSByaWd1YXJkYXIgb2x0cmUgbWkgZGllZGksPC9wPjxwPnZpZGkgZ2VudGkgYSBsYSByaXZhIGQmcnNxdW87dW4gZ3JhbiBmaXVtZTs8L3A+PHA+cGVyIGNoJnJzcXVvO2lvIGRpc3NpOiAmbGFxdW87TWFlc3Rybywgb3IgbWkgY29uY2VkaTwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Y2gmcnNxdW87aSZyc3F1bzsgc2FwcGlhIHF1YWxpIHNvbm8sIGUgcXVhbCBjb3N0dW1lPC9wPjxwPmxlIGZhIGRpIHRyYXBhc3NhciBwYXJlciBzJmlncmF2ZTsgcHJvbnRlLDwvcD48cD5jb20mcnNxdW87IGkmcnNxdW87IGRpc2Nlcm5vIHBlciBsbyBmaW9jbyBsdW1lJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkVkIGVsbGkgYSBtZTogJmxhcXVvO0xlIGNvc2UgdGkgZmllciBjb250ZTwvcD48cD5xdWFuZG8gbm9pIGZlcm1lcmVtIGxpIG5vc3RyaSBwYXNzaTwvcD48cD5zdSBsYSB0cmlzdGEgcml2aWVyYSBkJnJzcXVvO0FjaGVyb250ZSZyYXF1bzsuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbGxvciBjb24gbGkgb2NjaGkgdmVyZ29nbm9zaSBlIGJhc3NpLDwvcD48cD50ZW1lbmRvIG5vICZyc3F1bztsIG1pbyBkaXIgbGkgZm9zc2UgZ3JhdmUsPC9wPjxwPmluZmlubyBhbCBmaXVtZSBkZWwgcGFybGFyIG1pIHRyYXNzaS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkVkIGVjY28gdmVyc28gbm9pIHZlbmlyIHBlciBuYXZlPC9wPjxwPnVuIHZlY2NoaW8sIGJpYW5jbyBwZXIgYW50aWNvIHBlbG8sPC9wPjxwPmdyaWRhbmRvOiAmbGFxdW87R3VhaSBhIHZvaSwgYW5pbWUgcHJhdmUhPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Ob24gaXNwZXJhdGUgbWFpIHZlZGVyIGxvIGNpZWxvOjwvcD48cD5pJnJzcXVvOyB2ZWdubyBwZXIgbWVuYXJ2aSBhIGwmcnNxdW87YWx0cmEgcml2YTwvcD48cD5uZSBsZSB0ZW5lYnJlIGV0dGVybmUsIGluIGNhbGRvIGUgJnJzcXVvO24gZ2Vsby48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkUgdHUgY2hlIHNlJnJzcXVvOyBjb3N0JmlncmF2ZTssIGFuaW1hIHZpdmEsPC9wPjxwPnAmYWdyYXZlO3J0aXRpIGRhIGNvdGVzdGkgY2hlIHNvbiBtb3J0aSZyYXF1bzsuPC9wPjxwPk1hIHBvaSBjaGUgdmlkZSBjaCZyc3F1bztpbyBub24gbWkgcGFydGl2YSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPmRpc3NlOiAmbGFxdW87UGVyIGFsdHJhIHZpYSwgcGVyIGFsdHJpIHBvcnRpPC9wPjxwPnZlcnJhaSBhIHBpYWdnaWEsIG5vbiBxdWksIHBlciBwYXNzYXJlOjwvcD48cD5waSZ1Z3JhdmU7IGxpZXZlIGxlZ25vIGNvbnZpZW4gY2hlIHRpIHBvcnRpJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkUgJnJzcXVvO2wgZHVjYSBsdWk6ICZsYXF1bztDYXJvbiwgbm9uIHRpIGNydWNjaWFyZTo8L3A+PHA+dnVvbHNpIGNvcyZpZ3JhdmU7IGNvbCZhZ3JhdmU7IGRvdmUgc2kgcHVvdGU8L3A+PHA+Y2kmb2dyYXZlOyBjaGUgc2kgdnVvbGUsIGUgcGkmdWdyYXZlOyBub24gZGltYW5kYXJlJnJhcXVvOy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlF1aW5jaSBmdW9yIHF1ZXRlIGxlIGxhbm9zZSBnb3RlPC9wPjxwPmFsIG5vY2NoaWVyIGRlIGxhIGxpdmlkYSBwYWx1ZGUsPC9wPjxwPmNoZSAmcnNxdW87bnRvcm5vIGEgbGkgb2NjaGkgYXZlYSBkaSBmaWFtbWUgcm90ZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1hIHF1ZWxsJnJzcXVvOyBhbmltZSwgY2gmcnNxdW87ZXJhbiBsYXNzZSBlIG51ZGUsPC9wPjxwPmNhbmdpYXIgY29sb3JlIGUgZGliYXR0ZXJvIGkgZGVudGksPC9wPjxwPnJhdHRvIGNoZSAmcnNxdW87bnRlc2VyIGxlIHBhcm9sZSBjcnVkZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkJlc3RlbW1pYXZhbm8gRGlvIGUgbG9yIHBhcmVudGksPC9wPjxwPmwmcnNxdW87dW1hbmEgc3BlemllIGUgJnJzcXVvO2wgbG9jbyBlICZyc3F1bztsIHRlbXBvIGUgJnJzcXVvO2wgc2VtZTwvcD48cD5kaSBsb3Igc2VtZW56YSBlIGRpIGxvciBuYXNjaW1lbnRpLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+UG9pIHNpIHJpdHJhc3NlciB0dXR0ZSBxdWFudGUgaW5zaWVtZSw8L3A+PHA+Zm9ydGUgcGlhbmdlbmRvLCBhIGxhIHJpdmEgbWFsdmFnaWE8L3A+PHA+Y2gmcnNxdW87YXR0ZW5kZSBjaWFzY3VuIHVvbSBjaGUgRGlvIG5vbiB0ZW1lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Q2Fyb24gZGltb25pbywgY29uIG9jY2hpIGRpIGJyYWdpYTwvcD48cD5sb3JvIGFjY2VubmFuZG8sIHR1dHRlIGxlIHJhY2NvZ2xpZTs8L3A+PHA+YmF0dGUgY29sIHJlbW8gcXVhbHVucXVlIHMmcnNxdW87YWRhZ2lhLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Q29tZSBkJnJzcXVvO2F1dHVubm8gc2kgbGV2YW4gbGUgZm9nbGllPC9wPjxwPmwmcnNxdW87dW5hIGFwcHJlc3NvIGRlIGwmcnNxdW87YWx0cmEsIGZpbiBjaGUgJnJzcXVvO2wgcmFtbzwvcD48cD52ZWRlIGEgbGEgdGVycmEgdHV0dGUgbGUgc3VlIHNwb2dsaWUsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5zaW1pbGVtZW50ZSBpbCBtYWwgc2VtZSBkJnJzcXVvO0FkYW1vPC9wPjxwPmdpdHRhbnNpIGRpIHF1ZWwgbGl0byBhZCB1bmEgYWQgdW5hLDwvcD48cD5wZXIgY2VubmkgY29tZSBhdWdlbCBwZXIgc3VvIHJpY2hpYW1vLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Q29zJmlncmF2ZTsgc2VuIHZhbm5vIHN1IHBlciBsJnJzcXVvO29uZGEgYnJ1bmEsPC9wPjxwPmUgYXZhbnRpIGNoZSBzaWVuIGRpIGwmYWdyYXZlOyBkaXNjZXNlLDwvcD48cD5hbmNoZSBkaSBxdWEgbnVvdmEgc2NoaWVyYSBzJnJzcXVvO2F1bmEuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGFxdW87RmlnbGl1b2wgbWlvJnJhcXVvOywgZGlzc2UgJnJzcXVvO2wgbWFlc3RybyBjb3J0ZXNlLDwvcD48cD4mbGFxdW87cXVlbGxpIGNoZSBtdW9pb24gbmUgbCZyc3F1bztpcmEgZGkgRGlvPC9wPjxwPnR1dHRpIGNvbnZlZ25vbiBxdWkgZCZyc3F1bztvZ25lIHBhZXNlOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+ZSBwcm9udGkgc29ubyBhIHRyYXBhc3NhciBsbyByaW8sPC9wPjxwPmNoJmVhY3V0ZTsgbGEgZGl2aW5hIGdpdXN0aXppYSBsaSBzcHJvbmEsPC9wPjxwPnMmaWdyYXZlOyBjaGUgbGEgdGVtYSBzaSB2b2x2ZSBpbiBkaXNpby48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlF1aW5jaSBub24gcGFzc2EgbWFpIGFuaW1hIGJ1b25hOzwvcD48cD5lIHBlciZvZ3JhdmU7LCBzZSBDYXJvbiBkaSB0ZSBzaSBsYWduYSw8L3A+PHA+YmVuIHB1b2kgc2FwZXJlIG9tYWkgY2hlICZyc3F1bztsIHN1byBkaXIgc3VvbmEmcmFxdW87LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RmluaXRvIHF1ZXN0bywgbGEgYnVpYSBjYW1wYWduYTwvcD48cD50cmVtJm9ncmF2ZTsgcyZpZ3JhdmU7IGZvcnRlLCBjaGUgZGUgbG8gc3BhdmVudG88L3A+PHA+bGEgbWVudGUgZGkgc3Vkb3JlIGFuY29yIG1pIGJhZ25hLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TGEgdGVycmEgbGFncmltb3NhIGRpZWRlIHZlbnRvLDwvcD48cD5jaGUgYmFsZW4mb2dyYXZlOyB1bmEgbHVjZSB2ZXJtaWdsaWE8L3A+PHA+bGEgcXVhbCBtaSB2aW5zZSBjaWFzY3VuIHNlbnRpbWVudG87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5lIGNhZGRpIGNvbWUgbCZyc3F1bzt1b20gY3VpIHNvbm5vIHBpZ2xpYS48L3A+PC9kaXY+J107XG5cbm1vZHVsZS5leHBvcnRzID0gaXRhbGlhbjtcbiIsIi8vIGxvbmdmZWxsb3cuanNcblxudmFyIGxvbmdmZWxsb3cgPSBbJzxwIGNsYXNzPVwidGl0bGVcIj5JbmZlcm5vPC9wPjxwIGNsYXNzPVwiYXV0aG9yXCI+SGVucnkgV2Fkc3dvcnRoIExvbmdmZWxsb3c8L3A+JyxcblxuXHQnPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5JbmZlcm5vOiBDYW50byBJPC9wPjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5NaWR3YXkgdXBvbiB0aGUgam91cm5leSBvZiBvdXIgbGlmZTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SSBmb3VuZCBteXNlbGYgd2l0aGluIGEgZm9yZXN0IGRhcmssPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gb3IgdGhlIHN0cmFpZ2h0Zm9yd2FyZCBwYXRod2F5IGhhZCBiZWVuIGxvc3QuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BaCBtZSEgaG93IGhhcmQgYSB0aGluZyBpdCBpcyB0byBzYXk8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoYXQgd2FzIHRoaXMgZm9yZXN0IHNhdmFnZSwgcm91Z2gsIGFuZCBzdGVybiw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIGluIHRoZSB2ZXJ5IHRob3VnaHQgcmVuZXdzIHRoZSBmZWFyLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+U28gYml0dGVyIGlzIGl0LCBkZWF0aCBpcyBsaXR0bGUgbW9yZTs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJ1dCBvZiB0aGUgZ29vZCB0byB0cmVhdCwgd2hpY2ggdGhlcmUgSSBmb3VuZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNwZWFrIHdpbGwgSSBvZiB0aGUgb3RoZXIgdGhpbmdzIEkgc2F3IHRoZXJlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SSBjYW5ub3Qgd2VsbCByZXBlYXQgaG93IHRoZXJlIEkgZW50ZXJlZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvIGZ1bGwgd2FzIEkgb2Ygc2x1bWJlciBhdCB0aGUgbW9tZW50PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JbiB3aGljaCBJIGhhZCBhYmFuZG9uZWQgdGhlIHRydWUgd2F5LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QnV0IGFmdGVyIEkgaGFkIHJlYWNoZWQgYSBtb3VudGFpbiZyc3F1bztzIGZvb3QsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BdCB0aGF0IHBvaW50IHdoZXJlIHRoZSB2YWxsZXkgdGVybWluYXRlZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIGhhZCB3aXRoIGNvbnN0ZXJuYXRpb24gcGllcmNlZCBteSBoZWFydCw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlVwd2FyZCBJIGxvb2tlZCwgYW5kIEkgYmVoZWxkIGl0cyBzaG91bGRlcnMsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5WZXN0ZWQgYWxyZWFkeSB3aXRoIHRoYXQgcGxhbmV0JnJzcXVvO3MgcmF5czwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggbGVhZGV0aCBvdGhlcnMgcmlnaHQgYnkgZXZlcnkgcm9hZC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZW4gd2FzIHRoZSBmZWFyIGEgbGl0dGxlIHF1aWV0ZWQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgaW4gbXkgaGVhcnQmcnNxdW87cyBsYWtlIGhhZCBlbmR1cmVkIHRocm91Z2hvdXQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSBuaWdodCwgd2hpY2ggSSBoYWQgcGFzc2VkIHNvIHBpdGVvdXNseS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBldmVuIGFzIGhlLCB3aG8sIHdpdGggZGlzdHJlc3NmdWwgYnJlYXRoLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Rm9ydGggaXNzdWVkIGZyb20gdGhlIHNlYSB1cG9uIHRoZSBzaG9yZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlR1cm5zIHRvIHRoZSB3YXRlciBwZXJpbG91cyBhbmQgZ2F6ZXM7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5TbyBkaWQgbXkgc291bCwgdGhhdCBzdGlsbCB3YXMgZmxlZWluZyBvbndhcmQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UdXJuIGl0c2VsZiBiYWNrIHRvIHJlLWJlaG9sZCB0aGUgcGFzczwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggbmV2ZXIgeWV0IGEgbGl2aW5nIHBlcnNvbiBsZWZ0LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QWZ0ZXIgbXkgd2VhcnkgYm9keSBJIGhhZCByZXN0ZWQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGUgd2F5IHJlc3VtZWQgSSBvbiB0aGUgZGVzZXJ0IHNsb3BlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U28gdGhhdCB0aGUgZmlybSBmb290IGV2ZXIgd2FzIHRoZSBsb3dlci48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBsbyEgYWxtb3N0IHdoZXJlIHRoZSBhc2NlbnQgYmVnYW4sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BIHBhbnRoZXIgbGlnaHQgYW5kIHN3aWZ0IGV4Y2VlZGluZ2x5LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggd2l0aCBhIHNwb3R0ZWQgc2tpbiB3YXMgY292ZXJlZCBvJnJzcXVvO2VyITwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIG5ldmVyIG1vdmVkIHNoZSBmcm9tIGJlZm9yZSBteSBmYWNlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+TmF5LCByYXRoZXIgZGlkIGltcGVkZSBzbyBtdWNoIG15IHdheSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgbWFueSB0aW1lcyBJIHRvIHJldHVybiBoYWQgdHVybmVkLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlIHRpbWUgd2FzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1vcm5pbmcsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgdXAgdGhlIHN1biB3YXMgbW91bnRpbmcgd2l0aCB0aG9zZSBzdGFyczwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCB3aXRoIGhpbSB3ZXJlLCB3aGF0IHRpbWUgdGhlIExvdmUgRGl2aW5lPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BdCBmaXJzdCBpbiBtb3Rpb24gc2V0IHRob3NlIGJlYXV0ZW91cyB0aGluZ3M7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5TbyB3ZXJlIHRvIG1lIG9jY2FzaW9uIG9mIGdvb2QgaG9wZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSB2YXJpZWdhdGVkIHNraW4gb2YgdGhhdCB3aWxkIGJlYXN0LDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlIGhvdXIgb2YgdGltZSwgYW5kIHRoZSBkZWxpY2lvdXMgc2Vhc29uOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QnV0IG5vdCBzbyBtdWNoLCB0aGF0IGRpZCBub3QgZ2l2ZSBtZSBmZWFyPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BIGxpb24mcnNxdW87cyBhc3BlY3Qgd2hpY2ggYXBwZWFyZWQgdG8gbWUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5IZSBzZWVtZWQgYXMgaWYgYWdhaW5zdCBtZSBoZSB3ZXJlIGNvbWluZzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2l0aCBoZWFkIHVwbGlmdGVkLCBhbmQgd2l0aCByYXZlbm91cyBodW5nZXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5TbyB0aGF0IGl0IHNlZW1lZCB0aGUgYWlyIHdhcyBhZnJhaWQgb2YgaGltOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIGEgc2hlLXdvbGYsIHRoYXQgd2l0aCBhbGwgaHVuZ2VyaW5nczwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U2VlbWVkIHRvIGJlIGxhZGVuIGluIGhlciBtZWFncmVuZXNzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIG1hbnkgZm9sayBoYXMgY2F1c2VkIHRvIGxpdmUgZm9ybG9ybiE8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlNoZSBicm91Z2h0IHVwb24gbWUgc28gbXVjaCBoZWF2aW5lc3MsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoIHRoZSBhZmZyaWdodCB0aGF0IGZyb20gaGVyIGFzcGVjdCBjYW1lLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBJIHRoZSBob3BlIHJlbGlucXVpc2hlZCBvZiB0aGUgaGVpZ2h0LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIGFzIGhlIGlzIHdobyB3aWxsaW5nbHkgYWNxdWlyZXMsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgdGhlIHRpbWUgY29tZXMgdGhhdCBjYXVzZXMgaGltIHRvIGxvc2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaG8gd2VlcHMgaW4gYWxsIGhpcyB0aG91Z2h0cyBhbmQgaXMgZGVzcG9uZGVudCw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkUmcnNxdW87ZW4gc3VjaCBtYWRlIG1lIHRoYXQgYmVhc3Qgd2l0aG91dGVuIHBlYWNlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2gsIGNvbWluZyBvbiBhZ2FpbnN0IG1lIGJ5IGRlZ3JlZXM8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRocnVzdCBtZSBiYWNrIHRoaXRoZXIgd2hlcmUgdGhlIHN1biBpcyBzaWxlbnQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5XaGlsZSBJIHdhcyBydXNoaW5nIGRvd253YXJkIHRvIHRoZSBsb3dsYW5kLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QmVmb3JlIG1pbmUgZXllcyBkaWQgb25lIHByZXNlbnQgaGltc2VsZiw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldobyBzZWVtZWQgZnJvbSBsb25nLWNvbnRpbnVlZCBzaWxlbmNlIGhvYXJzZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPldoZW4gSSBiZWhlbGQgaGltIGluIHRoZSBkZXNlcnQgdmFzdCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPiZsZHF1bztIYXZlIHBpdHkgb24gbWUsJnJkcXVvOyB1bnRvIGhpbSBJIGNyaWVkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+JmxkcXVvO1doaWNoZSZyc3F1bztlciB0aG91IGFydCwgb3Igc2hhZGUgb3IgcmVhbCBtYW4hJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SGUgYW5zd2VyZWQgbWU6ICZsZHF1bztOb3QgbWFuOyBtYW4gb25jZSBJIHdhcyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBib3RoIG15IHBhcmVudHMgd2VyZSBvZiBMb21iYXJkeSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBNYW50dWFucyBieSBjb3VudHJ5IGJvdGggb2YgdGhlbS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsc3F1bztTdWIgSnVsaW8mcnNxdW87IHdhcyBJIGJvcm4sIHRob3VnaCBpdCB3YXMgbGF0ZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBsaXZlZCBhdCBSb21lIHVuZGVyIHRoZSBnb29kIEF1Z3VzdHVzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+RHVyaW5nIHRoZSB0aW1lIG9mIGZhbHNlIGFuZCBseWluZyBnb2RzLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QSBwb2V0IHdhcyBJLCBhbmQgSSBzYW5nIHRoYXQganVzdDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U29uIG9mIEFuY2hpc2VzLCB3aG8gY2FtZSBmb3J0aCBmcm9tIFRyb3ksPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BZnRlciB0aGF0IElsaW9uIHRoZSBzdXBlcmIgd2FzIGJ1cm5lZC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkJ1dCB0aG91LCB3aHkgZ29lc3QgdGhvdSBiYWNrIHRvIHN1Y2ggYW5ub3lhbmNlPzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2h5IGNsaW1iJnJzcXVvO3N0IHRob3Ugbm90IHRoZSBNb3VudCBEZWxlY3RhYmxlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggaXMgdGhlIHNvdXJjZSBhbmQgY2F1c2Ugb2YgZXZlcnkgam95PyZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsZHF1bztOb3csIGFydCB0aG91IHRoYXQgVmlyZ2lsaXVzIGFuZCB0aGF0IGZvdW50YWluPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBzcHJlYWRzIGFicm9hZCBzbyB3aWRlIGEgcml2ZXIgb2Ygc3BlZWNoPyZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkkgbWFkZSByZXNwb25zZSB0byBoaW0gd2l0aCBiYXNoZnVsIGZvcmVoZWFkLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxkcXVvO08sIG9mIHRoZSBvdGhlciBwb2V0cyBob25vdXIgYW5kIGxpZ2h0LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QXZhaWwgbWUgdGhlIGxvbmcgc3R1ZHkgYW5kIGdyZWF0IGxvdmU8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgaGF2ZSBpbXBlbGxlZCBtZSB0byBleHBsb3JlIHRoeSB2b2x1bWUhPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaG91IGFydCBteSBtYXN0ZXIsIGFuZCBteSBhdXRob3IgdGhvdSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRob3UgYXJ0IGFsb25lIHRoZSBvbmUgZnJvbSB3aG9tIEkgdG9vazwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIGJlYXV0aWZ1bCBzdHlsZSB0aGF0IGhhcyBkb25lIGhvbm91ciB0byBtZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkJlaG9sZCB0aGUgYmVhc3QsIGZvciB3aGljaCBJIGhhdmUgdHVybmVkIGJhY2s7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5EbyB0aG91IHByb3RlY3QgbWUgZnJvbSBoZXIsIGZhbW91cyBTYWdlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Rm9yIHNoZSBkb3RoIG1ha2UgbXkgdmVpbnMgYW5kIHB1bHNlcyB0cmVtYmxlLiZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsZHF1bztUaGVlIGl0IGJlaG92ZXMgdG8gdGFrZSBhbm90aGVyIHJvYWQsJnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+UmVzcG9uZGVkIGhlLCB3aGVuIGhlIGJlaGVsZCBtZSB3ZWVwaW5nLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+JmxkcXVvO0lmIGZyb20gdGhpcyBzYXZhZ2UgcGxhY2UgdGhvdSB3b3VsZHN0IGVzY2FwZTs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkJlY2F1c2UgdGhpcyBiZWFzdCwgYXQgd2hpY2ggdGhvdSBjcmllc3Qgb3V0LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U3VmZmVycyBub3QgYW55IG9uZSB0byBwYXNzIGhlciB3YXksPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CdXQgc28gZG90aCBoYXJhc3MgaGltLCB0aGF0IHNoZSBkZXN0cm95cyBoaW07PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgaGFzIGEgbmF0dXJlIHNvIG1hbGlnbiBhbmQgcnV0aGxlc3MsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IG5ldmVyIGRvdGggc2hlIGdsdXQgaGVyIGdyZWVkeSB3aWxsLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGFmdGVyIGZvb2QgaXMgaHVuZ3JpZXIgdGhhbiBiZWZvcmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5NYW55IHRoZSBhbmltYWxzIHdpdGggd2hvbSBzaGUgd2Vkcyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBtb3JlIHRoZXkgc2hhbGwgYmUgc3RpbGwsIHVudGlsIHRoZSBHcmV5aG91bmQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkNvbWVzLCB3aG8gc2hhbGwgbWFrZSBoZXIgcGVyaXNoIGluIGhlciBwYWluLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SGUgc2hhbGwgbm90IGZlZWQgb24gZWl0aGVyIGVhcnRoIG9yIHBlbGYsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CdXQgdXBvbiB3aXNkb20sIGFuZCBvbiBsb3ZlIGFuZCB2aXJ0dWU7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj4mcnNxdW87VHdpeHQgRmVsdHJvIGFuZCBGZWx0cm8gc2hhbGwgaGlzIG5hdGlvbiBiZTs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk9mIHRoYXQgbG93IEl0YWx5IHNoYWxsIGhlIGJlIHRoZSBzYXZpb3VyLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+T24gd2hvc2UgYWNjb3VudCB0aGUgbWFpZCBDYW1pbGxhIGRpZWQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5FdXJ5YWx1cywgVHVybnVzLCBOaXN1cywgb2YgdGhlaXIgd291bmRzOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhyb3VnaCBldmVyeSBjaXR5IHNoYWxsIGhlIGh1bnQgaGVyIGRvd24sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5VbnRpbCBoZSBzaGFsbCBoYXZlIGRyaXZlbiBoZXIgYmFjayB0byBIZWxsLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlcmUgZnJvbSB3aGVuY2UgZW52eSBmaXJzdCBkaWQgbGV0IGhlciBsb29zZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZXJlZm9yZSBJIHRoaW5rIGFuZCBqdWRnZSBpdCBmb3IgdGh5IGJlc3Q8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRob3UgZm9sbG93IG1lLCBhbmQgSSB3aWxsIGJlIHRoeSBndWlkZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBsZWFkIHRoZWUgaGVuY2UgdGhyb3VnaCB0aGUgZXRlcm5hbCBwbGFjZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPldoZXJlIHRob3Ugc2hhbHQgaGVhciB0aGUgZGVzcGVyYXRlIGxhbWVudGF0aW9ucyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNoYWx0IHNlZSB0aGUgYW5jaWVudCBzcGlyaXRzIGRpc2NvbnNvbGF0ZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldobyBjcnkgb3V0IGVhY2ggb25lIGZvciB0aGUgc2Vjb25kIGRlYXRoOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIHRob3Ugc2hhbHQgc2VlIHRob3NlIHdobyBjb250ZW50ZWQgYXJlPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoaW4gdGhlIGZpcmUsIGJlY2F1c2UgdGhleSBob3BlIHRvIGNvbWUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGVuZSZyc3F1bztlciBpdCBtYXkgYmUsIHRvIHRoZSBibGVzc2VkIHBlb3BsZTs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRvIHdob20sIHRoZW4sIGlmIHRob3Ugd2lzaGVzdCB0byBhc2NlbmQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BIHNvdWwgc2hhbGwgYmUgZm9yIHRoYXQgdGhhbiBJIG1vcmUgd29ydGh5OzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2l0aCBoZXIgYXQgbXkgZGVwYXJ0dXJlIEkgd2lsbCBsZWF2ZSB0aGVlOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QmVjYXVzZSB0aGF0IEVtcGVyb3IsIHdobyByZWlnbnMgYWJvdmUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JbiB0aGF0IEkgd2FzIHJlYmVsbGlvdXMgdG8gaGlzIGxhdyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldpbGxzIHRoYXQgdGhyb3VnaCBtZSBub25lIGNvbWUgaW50byBoaXMgY2l0eS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkhlIGdvdmVybnMgZXZlcnl3aGVyZSwgYW5kIHRoZXJlIGhlIHJlaWduczs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZXJlIGlzIGhpcyBjaXR5IGFuZCBoaXMgbG9mdHkgdGhyb25lOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+TyBoYXBweSBoZSB3aG9tIHRoZXJldG8gaGUgZWxlY3RzISZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBJIHRvIGhpbTogJmxkcXVvO1BvZXQsIEkgdGhlZSBlbnRyZWF0LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QnkgdGhhdCBzYW1lIEdvZCB3aG9tIHRob3UgZGlkc3QgbmV2ZXIga25vdyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvIHRoYXQgSSBtYXkgZXNjYXBlIHRoaXMgd29lIGFuZCB3b3JzZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRob3Ugd291bGRzdCBjb25kdWN0IG1lIHRoZXJlIHdoZXJlIHRob3UgaGFzdCBzYWlkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBJIG1heSBzZWUgdGhlIHBvcnRhbCBvZiBTYWludCBQZXRlciw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCB0aG9zZSB0aG91IG1ha2VzdCBzbyBkaXNjb25zb2xhdGUuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlbiBoZSBtb3ZlZCBvbiwgYW5kIEkgYmVoaW5kIGhpbSBmb2xsb3dlZC48L3A+PC9kaXY+JyxcblxuXHQnPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5JbmZlcm5vOiBDYW50byBJSTwvcD48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RGF5IHdhcyBkZXBhcnRpbmcsIGFuZCB0aGUgZW1icm93bmVkIGFpcjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+UmVsZWFzZWQgdGhlIGFuaW1hbHMgdGhhdCBhcmUgb24gZWFydGg8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZyb20gdGhlaXIgZmF0aWd1ZXM7IGFuZCBJIHRoZSBvbmx5IG9uZTwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TWFkZSBteXNlbGYgcmVhZHkgdG8gc3VzdGFpbiB0aGUgd2FyLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Qm90aCBvZiB0aGUgd2F5IGFuZCBsaWtld2lzZSBvZiB0aGUgd29lLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggbWVtb3J5IHRoYXQgZXJycyBub3Qgc2hhbGwgcmV0cmFjZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk8gTXVzZXMsIE8gaGlnaCBnZW5pdXMsIG5vdyBhc3Npc3QgbWUhPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5PIG1lbW9yeSwgdGhhdCBkaWRzdCB3cml0ZSBkb3duIHdoYXQgSSBzYXcsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5IZXJlIHRoeSBub2JpbGl0eSBzaGFsbCBiZSBtYW5pZmVzdCE8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBJIGJlZ2FuOiAmbGRxdW87UG9ldCwgd2hvIGd1aWRlc3QgbWUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5SZWdhcmQgbXkgbWFuaG9vZCwgaWYgaXQgYmUgc3VmZmljaWVudCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkVyZSB0byB0aGUgYXJkdW91cyBwYXNzIHRob3UgZG9zdCBjb25maWRlIG1lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhvdSBzYXllc3QsIHRoYXQgb2YgU2lsdml1cyB0aGUgcGFyZW50LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpbGUgeWV0IGNvcnJ1cHRpYmxlLCB1bnRvIHRoZSB3b3JsZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SW1tb3J0YWwgd2VudCwgYW5kIHdhcyB0aGVyZSBib2RpbHkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5CdXQgaWYgdGhlIGFkdmVyc2FyeSBvZiBhbGwgZXZpbDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2FzIGNvdXJ0ZW91cywgdGhpbmtpbmcgb2YgdGhlIGhpZ2ggZWZmZWN0PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IGlzc3VlIHdvdWxkIGZyb20gaGltLCBhbmQgd2hvLCBhbmQgd2hhdCw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRvIG1lbiBvZiBpbnRlbGxlY3QgdW5tZWV0IGl0IHNlZW1zIG5vdDs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZvciBoZSB3YXMgb2YgZ3JlYXQgUm9tZSwgYW5kIG9mIGhlciBlbXBpcmU8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkluIHRoZSBlbXB5cmVhbCBoZWF2ZW4gYXMgZmF0aGVyIGNob3Nlbjs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZSB3aGljaCBhbmQgd2hhdCwgd2lzaGluZyB0byBzcGVhayB0aGUgdHJ1dGgsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XZXJlIHN0YWJsaXNoZWQgYXMgdGhlIGhvbHkgcGxhY2UsIHdoZXJlaW48L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNpdHMgdGhlIHN1Y2Nlc3NvciBvZiB0aGUgZ3JlYXRlc3QgUGV0ZXIuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5VcG9uIHRoaXMgam91cm5leSwgd2hlbmNlIHRob3UgZ2l2ZXN0IGhpbSB2YXVudCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoaW5ncyBkaWQgaGUgaGVhciwgd2hpY2ggdGhlIG9jY2FzaW9uIHdlcmU8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJvdGggb2YgaGlzIHZpY3RvcnkgYW5kIHRoZSBwYXBhbCBtYW50bGUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGl0aGVyIHdlbnQgYWZ0ZXJ3YXJkcyB0aGUgQ2hvc2VuIFZlc3NlbCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRvIGJyaW5nIGJhY2sgY29tZm9ydCB0aGVuY2UgdW50byB0aGF0IEZhaXRoLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggb2Ygc2FsdmF0aW9uJnJzcXVvO3Mgd2F5IGlzIHRoZSBiZWdpbm5pbmcuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5CdXQgSSwgd2h5IHRoaXRoZXIgY29tZSwgb3Igd2hvIGNvbmNlZGVzIGl0PzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SSBub3QgQWVuZWFzIGFtLCBJIGFtIG5vdCBQYXVsLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Tm9yIEksIG5vciBvdGhlcnMsIHRoaW5rIG1lIHdvcnRoeSBvZiBpdC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZXJlZm9yZSwgaWYgSSByZXNpZ24gbXlzZWxmIHRvIGNvbWUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5JIGZlYXIgdGhlIGNvbWluZyBtYXkgYmUgaWxsLWFkdmlzZWQ7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaG91JnJzcXVvO3J0IHdpc2UsIGFuZCBrbm93ZXN0IGJldHRlciB0aGFuIEkgc3BlYWsuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIGFzIGhlIGlzLCB3aG8gdW53aWxscyB3aGF0IGhlIHdpbGxlZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBieSBuZXcgdGhvdWdodHMgZG90aCBoaXMgaW50ZW50aW9uIGNoYW5nZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvIHRoYXQgZnJvbSBoaXMgZGVzaWduIGhlIHF1aXRlIHdpdGhkcmF3cyw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlN1Y2ggSSBiZWNhbWUsIHVwb24gdGhhdCBkYXJrIGhpbGxzaWRlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QmVjYXVzZSwgaW4gdGhpbmtpbmcsIEkgY29uc3VtZWQgdGhlIGVtcHJpc2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCB3YXMgc28gdmVyeSBwcm9tcHQgaW4gdGhlIGJlZ2lubmluZy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsZHF1bztJZiBJIGhhdmUgd2VsbCB0aHkgbGFuZ3VhZ2UgdW5kZXJzdG9vZCwmcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5SZXBsaWVkIHRoYXQgc2hhZGUgb2YgdGhlIE1hZ25hbmltb3VzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+JmxkcXVvO1RoeSBzb3VsIGF0dGFpbnRlZCBpcyB3aXRoIGNvd2FyZGljZSw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPldoaWNoIG1hbnkgdGltZXMgYSBtYW4gZW5jdW1iZXJzIHNvLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SXQgdHVybnMgaGltIGJhY2sgZnJvbSBob25vdXJlZCBlbnRlcnByaXNlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QXMgZmFsc2Ugc2lnaHQgZG90aCBhIGJlYXN0LCB3aGVuIGhlIGlzIHNoeS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoYXQgdGhvdSBtYXlzdCBmcmVlIHRoZWUgZnJvbSB0aGlzIGFwcHJlaGVuc2lvbiw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkkmcnNxdW87bGwgdGVsbCB0aGVlIHdoeSBJIGNhbWUsIGFuZCB3aGF0IEkgaGVhcmQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkF0IHRoZSBmaXJzdCBtb21lbnQgd2hlbiBJIGdyaWV2ZWQgZm9yIHRoZWUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbW9uZyB0aG9zZSB3YXMgSSB3aG8gYXJlIGluIHN1c3BlbnNlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGEgZmFpciwgc2FpbnRseSBMYWR5IGNhbGxlZCB0byBtZTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SW4gc3VjaCB3aXNlLCBJIGJlc291Z2h0IGhlciB0byBjb21tYW5kIG1lLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SGVyIGV5ZXMgd2hlcmUgc2hpbmluZyBicmlnaHRlciB0aGFuIHRoZSBTdGFyOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHNoZSBiZWdhbiB0byBzYXksIGdlbnRsZSBhbmQgbG93LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2l0aCB2b2ljZSBhbmdlbGljYWwsIGluIGhlciBvd24gbGFuZ3VhZ2U6PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbHNxdW87TyBzcGlyaXQgY291cnRlb3VzIG9mIE1hbnR1YSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk9mIHdob20gdGhlIGZhbWUgc3RpbGwgaW4gdGhlIHdvcmxkIGVuZHVyZXMsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgc2hhbGwgZW5kdXJlLCBsb25nLWxhc3RpbmcgYXMgdGhlIHdvcmxkOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QSBmcmllbmQgb2YgbWluZSwgYW5kIG5vdCB0aGUgZnJpZW5kIG9mIGZvcnR1bmUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5VcG9uIHRoZSBkZXNlcnQgc2xvcGUgaXMgc28gaW1wZWRlZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VXBvbiBoaXMgd2F5LCB0aGF0IGhlIGhhcyB0dXJuZWQgdGhyb3VnaCB0ZXJyb3IsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgbWF5LCBJIGZlYXIsIGFscmVhZHkgYmUgc28gbG9zdCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgSSB0b28gbGF0ZSBoYXZlIHJpc2VuIHRvIGhpcyBzdWNjb3VyLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+RnJvbSB0aGF0IHdoaWNoIEkgaGF2ZSBoZWFyZCBvZiBoaW0gaW4gSGVhdmVuLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QmVzdGlyIHRoZWUgbm93LCBhbmQgd2l0aCB0aHkgc3BlZWNoIG9ybmF0ZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCB3aXRoIHdoYXQgbmVlZGZ1bCBpcyBmb3IgaGlzIHJlbGVhc2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Bc3Npc3QgaGltIHNvLCB0aGF0IEkgbWF5IGJlIGNvbnNvbGVkLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QmVhdHJpY2UgYW0gSSwgd2hvIGRvIGJpZCB0aGVlIGdvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SSBjb21lIGZyb20gdGhlcmUsIHdoZXJlIEkgd291bGQgZmFpbiByZXR1cm47PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Mb3ZlIG1vdmVkIG1lLCB3aGljaCBjb21wZWxsZXRoIG1lIHRvIHNwZWFrLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+V2hlbiBJIHNoYWxsIGJlIGluIHByZXNlbmNlIG9mIG15IExvcmQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5GdWxsIG9mdGVuIHdpbGwgSSBwcmFpc2UgdGhlZSB1bnRvIGhpbS4mcnNxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGVuIHBhdXNlZCBzaGUsIGFuZCB0aGVyZWFmdGVyIEkgYmVnYW46PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbHNxdW87TyBMYWR5IG9mIHZpcnR1ZSwgdGhvdSBhbG9uZSB0aHJvdWdoIHdob208L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSBodW1hbiByYWNlIGV4Y2VlZGV0aCBhbGwgY29udGFpbmVkPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoaW4gdGhlIGhlYXZlbiB0aGF0IGhhcyB0aGUgbGVzc2VyIGNpcmNsZXMsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5TbyBncmF0ZWZ1bCB1bnRvIG1lIGlzIHRoeSBjb21tYW5kbWVudCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRvIG9iZXksIGlmICZsc3F1bzt0d2VyZSBhbHJlYWR5IGRvbmUsIHdlcmUgbGF0ZTs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk5vIGZhcnRoZXIgbmVlZCZsc3F1bztzdCB0aG91IG9wZSB0byBtZSB0aHkgd2lzaC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkJ1dCB0aGUgY2F1c2UgdGVsbCBtZSB3aHkgdGhvdSBkb3N0IG5vdCBzaHVuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGUgaGVyZSBkZXNjZW5kaW5nIGRvd24gaW50byB0aGlzIGNlbnRyZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZyb20gdGhlIHZhc3QgcGxhY2UgdGhvdSBidXJuZXN0IHRvIHJldHVybiB0by4mcnNxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbHNxdW87U2luY2UgdGhvdSB3b3VsZHN0IGZhaW4gc28gaW53YXJkbHkgZGlzY2Vybiw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJyaWVmbHkgd2lsbCBJIHJlbGF0ZSwmcnNxdW87IHNoZSBhbnN3ZXJlZCBtZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPiZsc3F1bztXaHkgSSBhbSBub3QgYWZyYWlkIHRvIGVudGVyIGhlcmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5PZiB0aG9zZSB0aGluZ3Mgb25seSBzaG91bGQgb25lIGJlIGFmcmFpZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggaGF2ZSB0aGUgcG93ZXIgb2YgZG9pbmcgb3RoZXJzIGhhcm07PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5PZiB0aGUgcmVzdCwgbm87IGJlY2F1c2UgdGhleSBhcmUgbm90IGZlYXJmdWwuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Hb2QgaW4gaGlzIG1lcmN5IHN1Y2ggY3JlYXRlZCBtZTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBtaXNlcnkgb2YgeW91cnMgYXR0YWlucyBtZSBub3QsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Ob3IgYW55IGZsYW1lIGFzc2FpbHMgbWUgb2YgdGhpcyBidXJuaW5nLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QSBnZW50bGUgTGFkeSBpcyBpbiBIZWF2ZW4sIHdobyBncmlldmVzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BdCB0aGlzIGltcGVkaW1lbnQsIHRvIHdoaWNoIEkgc2VuZCB0aGVlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U28gdGhhdCBzdGVybiBqdWRnbWVudCB0aGVyZSBhYm92ZSBpcyBicm9rZW4uPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JbiBoZXIgZW50cmVhdHkgc2hlIGJlc291Z2h0IEx1Y2lhLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHNhaWQsICZsZHF1bztUaHkgZmFpdGhmdWwgb25lIG5vdyBzdGFuZHMgaW4gbmVlZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+T2YgdGhlZSwgYW5kIHVudG8gdGhlZSBJIHJlY29tbWVuZCBoaW0uJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+THVjaWEsIGZvZSBvZiBhbGwgdGhhdCBjcnVlbCBpcyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkhhc3RlbmVkIGF3YXksIGFuZCBjYW1lIHVudG8gdGhlIHBsYWNlPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGVyZSBJIHdhcyBzaXR0aW5nIHdpdGggdGhlIGFuY2llbnQgUmFjaGVsLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxkcXVvO0JlYXRyaWNlJnJkcXVvOyBzYWlkIHNoZSwgJmxkcXVvO3RoZSB0cnVlIHByYWlzZSBvZiBHb2QsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaHkgc3VjY291cmVzdCB0aG91IG5vdCBoaW0sIHdobyBsb3ZlZCB0aGVlIHNvLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Rm9yIHRoZWUgaGUgaXNzdWVkIGZyb20gdGhlIHZ1bGdhciBoZXJkPzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RG9zdCB0aG91IG5vdCBoZWFyIHRoZSBwaXR5IG9mIGhpcyBwbGFpbnQ/PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Eb3N0IHRob3Ugbm90IHNlZSB0aGUgZGVhdGggdGhhdCBjb21iYXRzIGhpbTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QmVzaWRlIHRoYXQgZmxvb2QsIHdoZXJlIG9jZWFuIGhhcyBubyB2YXVudD8mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5OZXZlciB3ZXJlIHBlcnNvbnMgaW4gdGhlIHdvcmxkIHNvIHN3aWZ0PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UbyB3b3JrIHRoZWlyIHdlYWwgYW5kIHRvIGVzY2FwZSB0aGVpciB3b2UsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BcyBJLCBhZnRlciBzdWNoIHdvcmRzIGFzIHRoZXNlIHdlcmUgdXR0ZXJlZCw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkNhbWUgaGl0aGVyIGRvd253YXJkIGZyb20gbXkgYmxlc3NlZCBzZWF0LDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Q29uZmlkaW5nIGluIHRoeSBkaWduaWZpZWQgZGlzY291cnNlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggaG9ub3VycyB0aGVlLCBhbmQgdGhvc2Ugd2hvJnJzcXVvO3ZlIGxpc3RlbmVkIHRvIGl0LiZyc3F1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFmdGVyIHNoZSB0aHVzIGhhZCBzcG9rZW4gdW50byBtZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldlZXBpbmcsIGhlciBzaGluaW5nIGV5ZXMgc2hlIHR1cm5lZCBhd2F5OzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hlcmVieSBzaGUgbWFkZSBtZSBzd2lmdGVyIGluIG15IGNvbWluZzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCB1bnRvIHRoZWUgSSBjYW1lLCBhcyBzaGUgZGVzaXJlZDs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkkgaGF2ZSBkZWxpdmVyZWQgdGhlZSBmcm9tIHRoYXQgd2lsZCBiZWFzdCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIGJhcnJlZCB0aGUgYmVhdXRpZnVsIG1vdW50YWluJnJzcXVvO3Mgc2hvcnQgYXNjZW50LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+V2hhdCBpcyBpdCwgdGhlbj8gIFdoeSwgd2h5IGRvc3QgdGhvdSBkZWxheT88L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoeSBpcyBzdWNoIGJhc2VuZXNzIGJlZGRlZCBpbiB0aHkgaGVhcnQ/PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5EYXJpbmcgYW5kIGhhcmRpaG9vZCB3aHkgaGFzdCB0aG91IG5vdCw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlNlZWluZyB0aGF0IHRocmVlIHN1Y2ggTGFkaWVzIGJlbmVkaWdodDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QXJlIGNhcmluZyBmb3IgdGhlZSBpbiB0aGUgY291cnQgb2YgSGVhdmVuLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHNvIG11Y2ggZ29vZCBteSBzcGVlY2ggZG90aCBwcm9taXNlIHRoZWU/JnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+RXZlbiBhcyB0aGUgZmxvd2VyZXRzLCBieSBub2N0dXJuYWwgY2hpbGwsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Cb3dlZCBkb3duIGFuZCBjbG9zZWQsIHdoZW4gdGhlIHN1biB3aGl0ZW5zIHRoZW0sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5VcGxpZnQgdGhlbXNlbHZlcyBhbGwgb3BlbiBvbiB0aGVpciBzdGVtczs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlN1Y2ggSSBiZWNhbWUgd2l0aCBteSBleGhhdXN0ZWQgc3RyZW5ndGgsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgc3VjaCBnb29kIGNvdXJhZ2UgdG8gbXkgaGVhcnQgdGhlcmUgY291cnNlZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgSSBiZWdhbiwgbGlrZSBhbiBpbnRyZXBpZCBwZXJzb246PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGRxdW87TyBzaGUgY29tcGFzc2lvbmF0ZSwgd2hvIHN1Y2NvdXJlZCBtZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBjb3VydGVvdXMgdGhvdSwgd2hvIGhhc3Qgb2JleWVkIHNvIHNvb248L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSB3b3JkcyBvZiB0cnV0aCB3aGljaCBzaGUgYWRkcmVzc2VkIHRvIHRoZWUhPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaG91IGhhc3QgbXkgaGVhcnQgc28gd2l0aCBkZXNpcmUgZGlzcG9zZWQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRvIHRoZSBhZHZlbnR1cmUsIHdpdGggdGhlc2Ugd29yZHMgb2YgdGhpbmUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IHRvIG15IGZpcnN0IGludGVudCBJIGhhdmUgcmV0dXJuZWQuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Ob3cgZ28sIGZvciBvbmUgc29sZSB3aWxsIGlzIGluIHVzIGJvdGgsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaG91IExlYWRlciwgYW5kIHRob3UgTG9yZCwgYW5kIE1hc3RlciB0aG91LiZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRodXMgc2FpZCBJIHRvIGhpbTsgYW5kIHdoZW4gaGUgaGFkIG1vdmVkLDwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SSBlbnRlcmVkIG9uIHRoZSBkZWVwIGFuZCBzYXZhZ2Ugd2F5LjwvcD48L2Rpdj4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkluZmVybm86IENhbnRvIElJSTwvcD48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+JmxkcXVvO1Rocm91Z2ggbWUgdGhlIHdheSBpcyB0byB0aGUgY2l0eSBkb2xlbnQ7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaHJvdWdoIG1lIHRoZSB3YXkgaXMgdG8gZXRlcm5hbCBkb2xlOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhyb3VnaCBtZSB0aGUgd2F5IGFtb25nIHRoZSBwZW9wbGUgbG9zdC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkp1c3RpY2UgaW5jaXRlZCBteSBzdWJsaW1lIENyZWF0b3I7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5DcmVhdGVkIG1lIGRpdmluZSBPbW5pcG90ZW5jZSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSBoaWdoZXN0IFdpc2RvbSBhbmQgdGhlIHByaW1hbCBMb3ZlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QmVmb3JlIG1lIHRoZXJlIHdlcmUgbm8gY3JlYXRlZCB0aGluZ3MsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Pbmx5IGV0ZXJuZSwgYW5kIEkgZXRlcm5hbCBsYXN0LjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QWxsIGhvcGUgYWJhbmRvbiwgeWUgd2hvIGVudGVyIGluISZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZXNlIHdvcmRzIGluIHNvbWJyZSBjb2xvdXIgSSBiZWhlbGQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldyaXR0ZW4gdXBvbiB0aGUgc3VtbWl0IG9mIGEgZ2F0ZTs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoZW5jZSBJOiAmbGRxdW87VGhlaXIgc2Vuc2UgaXMsIE1hc3RlciwgaGFyZCB0byBtZSEmcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgaGUgdG8gbWUsIGFzIG9uZSBleHBlcmllbmNlZDo8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPiZsZHF1bztIZXJlIGFsbCBzdXNwaWNpb24gbmVlZHMgbXVzdCBiZSBhYmFuZG9uZWQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbGwgY293YXJkaWNlIG11c3QgbmVlZHMgYmUgaGVyZSBleHRpbmN0LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+V2UgdG8gdGhlIHBsYWNlIGhhdmUgY29tZSwgd2hlcmUgSSBoYXZlIHRvbGQgdGhlZTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhvdSBzaGFsdCBiZWhvbGQgdGhlIHBlb3BsZSBkb2xvcm91czwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hvIGhhdmUgZm9yZWdvbmUgdGhlIGdvb2Qgb2YgaW50ZWxsZWN0LiZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCBhZnRlciBoZSBoYWQgbGFpZCBoaXMgaGFuZCBvbiBtaW5lPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoIGpveWZ1bCBtaWVuLCB3aGVuY2UgSSB3YXMgY29tZm9ydGVkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SGUgbGVkIG1lIGluIGFtb25nIHRoZSBzZWNyZXQgdGhpbmdzLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlcmUgc2lnaHMsIGNvbXBsYWludHMsIGFuZCB1bHVsYXRpb25zIGxvdWQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlJlc291bmRlZCB0aHJvdWdoIHRoZSBhaXIgd2l0aG91dCBhIHN0YXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGVuY2UgSSwgYXQgdGhlIGJlZ2lubmluZywgd2VwdCB0aGVyZWF0LjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+TGFuZ3VhZ2VzIGRpdmVyc2UsIGhvcnJpYmxlIGRpYWxlY3RzLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QWNjZW50cyBvZiBhbmdlciwgd29yZHMgb2YgYWdvbnksPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgdm9pY2VzIGhpZ2ggYW5kIGhvYXJzZSwgd2l0aCBzb3VuZCBvZiBoYW5kcyw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk1hZGUgdXAgYSB0dW11bHQgdGhhdCBnb2VzIHdoaXJsaW5nIG9uPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gb3IgZXZlciBpbiB0aGF0IGFpciBmb3IgZXZlciBibGFjayw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkV2ZW4gYXMgdGhlIHNhbmQgZG90aCwgd2hlbiB0aGUgd2hpcmx3aW5kIGJyZWF0aGVzLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIEksIHdobyBoYWQgbXkgaGVhZCB3aXRoIGhvcnJvciBib3VuZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlNhaWQ6ICZsZHF1bztNYXN0ZXIsIHdoYXQgaXMgdGhpcyB3aGljaCBub3cgSSBoZWFyPzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hhdCBmb2xrIGlzIHRoaXMsIHdoaWNoIHNlZW1zIGJ5IHBhaW4gc28gdmFucXVpc2hlZD8mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgaGUgdG8gbWU6ICZsZHF1bztUaGlzIG1pc2VyYWJsZSBtb2RlPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5NYWludGFpbiB0aGUgbWVsYW5jaG9seSBzb3VscyBvZiB0aG9zZTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hvIGxpdmVkIHdpdGhvdXRlbiBpbmZhbXkgb3IgcHJhaXNlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+Q29tbWluZ2xlZCBhcmUgdGhleSB3aXRoIHRoYXQgY2FpdGlmZiBjaG9pcjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+T2YgQW5nZWxzLCB3aG8gaGF2ZSBub3QgcmViZWxsaW91cyBiZWVuLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Tm9yIGZhaXRoZnVsIHdlcmUgdG8gR29kLCBidXQgd2VyZSBmb3Igc2VsZi48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZSBoZWF2ZW5zIGV4cGVsbGVkIHRoZW0sIG5vdCB0byBiZSBsZXNzIGZhaXI7PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Ob3IgdGhlbSB0aGUgbmV0aGVybW9yZSBhYnlzcyByZWNlaXZlcyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZvciBnbG9yeSBub25lIHRoZSBkYW1uZWQgd291bGQgaGF2ZSBmcm9tIHRoZW0uJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIEk6ICZsZHF1bztPIE1hc3Rlciwgd2hhdCBzbyBncmlldm91cyBpczwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VG8gdGhlc2UsIHRoYXQgbWFrZXRoIHRoZW0gbGFtZW50IHNvIHNvcmU/JnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SGUgYW5zd2VyZWQ6ICZsZHF1bztJIHdpbGwgdGVsbCB0aGVlIHZlcnkgYnJpZWZseS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZXNlIGhhdmUgbm8gbG9uZ2VyIGFueSBob3BlIG9mIGRlYXRoOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHRoaXMgYmxpbmQgbGlmZSBvZiB0aGVpcnMgaXMgc28gZGViYXNlZCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZXkgZW52aW91cyBhcmUgb2YgZXZlcnkgb3RoZXIgZmF0ZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPk5vIGZhbWUgb2YgdGhlbSB0aGUgd29ybGQgcGVybWl0cyB0byBiZTs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk1pc2VyaWNvcmQgYW5kIEp1c3RpY2UgYm90aCBkaXNkYWluIHRoZW0uPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5MZXQgdXMgbm90IHNwZWFrIG9mIHRoZW0sIGJ1dCBsb29rLCBhbmQgcGFzcy4mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgSSwgd2hvIGxvb2tlZCBhZ2FpbiwgYmVoZWxkIGEgYmFubmVyLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2gsIHdoaXJsaW5nIHJvdW5kLCByYW4gb24gc28gcmFwaWRseSw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgb2YgYWxsIHBhdXNlIGl0IHNlZW1lZCB0byBtZSBpbmRpZ25hbnQ7PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgYWZ0ZXIgaXQgdGhlcmUgY2FtZSBzbyBsb25nIGEgdHJhaW48L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPk9mIHBlb3BsZSwgdGhhdCBJIG5lJnJzcXVvO2VyIHdvdWxkIGhhdmUgYmVsaWV2ZWQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgZXZlciBEZWF0aCBzbyBtYW55IGhhZCB1bmRvbmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5XaGVuIHNvbWUgYW1vbmcgdGhlbSBJIGhhZCByZWNvZ25pc2VkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SSBsb29rZWQsIGFuZCBJIGJlaGVsZCB0aGUgc2hhZGUgb2YgaGltPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaG8gbWFkZSB0aHJvdWdoIGNvd2FyZGljZSB0aGUgZ3JlYXQgcmVmdXNhbC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkZvcnRod2l0aCBJIGNvbXByZWhlbmRlZCwgYW5kIHdhcyBjZXJ0YWluLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCB0aGlzIHRoZSBzZWN0IHdhcyBvZiB0aGUgY2FpdGlmZiB3cmV0Y2hlczwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SGF0ZWZ1bCB0byBHb2QgYW5kIHRvIGhpcyBlbmVtaWVzLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlc2UgbWlzY3JlYW50cywgd2hvIG5ldmVyIHdlcmUgYWxpdmUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XZXJlIG5ha2VkLCBhbmQgd2VyZSBzdHVuZyBleGNlZWRpbmdseTwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QnkgZ2FkZmxpZXMgYW5kIGJ5IGhvcm5ldHMgdGhhdCB3ZXJlIHRoZXJlLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlc2UgZGlkIHRoZWlyIGZhY2VzIGlycmlnYXRlIHdpdGggYmxvb2QsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCwgd2l0aCB0aGVpciB0ZWFycyBjb21taW5nbGVkLCBhdCB0aGVpciBmZWV0PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CeSB0aGUgZGlzZ3VzdGluZyB3b3JtcyB3YXMgZ2F0aGVyZWQgdXAuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgd2hlbiB0byBnYXppbmcgZmFydGhlciBJIGJldG9vayBtZS48L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlBlb3BsZSBJIHNhdyBvbiBhIGdyZWF0IHJpdmVyJnJzcXVvO3MgYmFuazs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPldoZW5jZSBzYWlkIEk6ICZsZHF1bztNYXN0ZXIsIG5vdyB2b3VjaHNhZmUgdG8gbWUsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5UaGF0IEkgbWF5IGtub3cgd2hvIHRoZXNlIGFyZSwgYW5kIHdoYXQgbGF3PC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5NYWtlcyB0aGVtIGFwcGVhciBzbyByZWFkeSB0byBwYXNzIG92ZXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BcyBJIGRpc2Nlcm4gYXRod2FydCB0aGUgZHVza3kgbGlnaHQuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIGhlIHRvIG1lOiAmbGRxdW87VGhlc2UgdGhpbmdzIHNoYWxsIGFsbCBiZSBrbm93bjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VG8gdGhlZSwgYXMgc29vbiBhcyB3ZSBvdXIgZm9vdHN0ZXBzIHN0YXk8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlVwb24gdGhlIGRpc21hbCBzaG9yZSBvZiBBY2hlcm9uLiZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZW4gd2l0aCBtaW5lIGV5ZXMgYXNoYW1lZCBhbmQgZG93bndhcmQgY2FzdCw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkZlYXJpbmcgbXkgd29yZHMgbWlnaHQgaXJrc29tZSBiZSB0byBoaW0sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gcm9tIHNwZWVjaCByZWZyYWluZWQgSSB0aWxsIHdlIHJlYWNoZWQgdGhlIHJpdmVyLjwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIGxvISB0b3dhcmRzIHVzIGNvbWluZyBpbiBhIGJvYXQ8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuIG9sZCBtYW4sIGhvYXJ5IHdpdGggdGhlIGhhaXIgb2YgZWxkLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Q3J5aW5nOiAmbGRxdW87V29lIHVudG8geW91LCB5ZSBzb3VscyBkZXByYXZlZCE8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkhvcGUgbmV2ZXJtb3JlIHRvIGxvb2sgdXBvbiB0aGUgaGVhdmVuczs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkkgY29tZSB0byBsZWFkIHlvdSB0byB0aGUgb3RoZXIgc2hvcmUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UbyB0aGUgZXRlcm5hbCBzaGFkZXMgaW4gaGVhdCBhbmQgZnJvc3QuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgdGhvdSwgdGhhdCB5b25kZXIgc3RhbmRlc3QsIGxpdmluZyBzb3VsLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2l0aGRyYXcgdGhlZSBmcm9tIHRoZXNlIHBlb3BsZSwgd2hvIGFyZSBkZWFkISZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkJ1dCB3aGVuIGhlIHNhdyB0aGF0IEkgZGlkIG5vdCB3aXRoZHJhdyw8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkhlIHNhaWQ6ICZsZHF1bztCeSBvdGhlciB3YXlzLCBieSBvdGhlciBwb3J0czwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhvdSB0byB0aGUgc2hvcmUgc2hhbHQgY29tZSwgbm90IGhlcmUsIGZvciBwYXNzYWdlOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QSBsaWdodGVyIHZlc3NlbCBuZWVkcyBtdXN0IGNhcnJ5IHRoZWUuJnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+QW5kIHVudG8gaGltIHRoZSBHdWlkZTogJmxkcXVvO1ZleCB0aGVlIG5vdCwgQ2hhcm9uOzwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+SXQgaXMgc28gd2lsbGVkIHRoZXJlIHdoZXJlIGlzIHBvd2VyIHRvIGRvPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IHdoaWNoIGlzIHdpbGxlZDsgYW5kIGZhcnRoZXIgcXVlc3Rpb24gbm90LiZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZXJlYXQgd2VyZSBxdWlldGVkIHRoZSBmbGVlY3kgY2hlZWtzPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5PZiBoaW0gdGhlIGZlcnJ5bWFuIG9mIHRoZSBsaXZpZCBmZW4sPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaG8gcm91bmQgYWJvdXQgaGlzIGV5ZXMgaGFkIHdoZWVscyBvZiBmbGFtZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkJ1dCBhbGwgdGhvc2Ugc291bHMgd2hvIHdlYXJ5IHdlcmUgYW5kIG5ha2VkPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGVpciBjb2xvdXIgY2hhbmdlZCBhbmQgZ25hc2hlZCB0aGVpciB0ZWV0aCB0b2dldGhlciw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFzIHNvb24gYXMgdGhleSBoYWQgaGVhcmQgdGhvc2UgY3J1ZWwgd29yZHMuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5Hb2QgdGhleSBibGFzcGhlbWVkIGFuZCB0aGVpciBwcm9nZW5pdG9ycyw8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSBodW1hbiByYWNlLCB0aGUgcGxhY2UsIHRoZSB0aW1lLCB0aGUgc2VlZDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+T2YgdGhlaXIgZW5nZW5kZXJpbmcgYW5kIG9mIHRoZWlyIGJpcnRoITwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+VGhlcmVhZnRlciBhbGwgdG9nZXRoZXIgdGhleSBkcmV3IGJhY2ssPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CaXR0ZXJseSB3ZWVwaW5nLCB0byB0aGUgYWNjdXJzZWQgc2hvcmUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCB3YWl0ZXRoIGV2ZXJ5IG1hbiB3aG8gZmVhcnMgbm90IEdvZC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkNoYXJvbiB0aGUgZGVtb24sIHdpdGggdGhlIGV5ZXMgb2YgZ2xlZGUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CZWNrb25pbmcgdG8gdGhlbSwgY29sbGVjdHMgdGhlbSBhbGwgdG9nZXRoZXIsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5CZWF0cyB3aXRoIGhpcyBvYXIgd2hvZXZlciBsYWdzIGJlaGluZC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFzIGluIHRoZSBhdXR1bW4tdGltZSB0aGUgbGVhdmVzIGZhbGwgb2ZmLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+Rmlyc3Qgb25lIGFuZCB0aGVuIGFub3RoZXIsIHRpbGwgdGhlIGJyYW5jaDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VW50byB0aGUgZWFydGggc3VycmVuZGVycyBhbGwgaXRzIHNwb2lsczs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkluIHNpbWlsYXIgd2lzZSB0aGUgZXZpbCBzZWVkIG9mIEFkYW08L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRocm93IHRoZW1zZWx2ZXMgZnJvbSB0aGF0IG1hcmdpbiBvbmUgYnkgb25lLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QXQgc2lnbmFscywgYXMgYSBiaXJkIHVudG8gaXRzIGx1cmUuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5TbyB0aGV5IGRlcGFydCBhY3Jvc3MgdGhlIGR1c2t5IHdhdmUsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgZXJlIHVwb24gdGhlIG90aGVyIHNpZGUgdGhleSBsYW5kLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QWdhaW4gb24gdGhpcyBzaWRlIGEgbmV3IHRyb29wIGFzc2VtYmxlcy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPiZsZHF1bztNeSBzb24sJnJkcXVvOyB0aGUgY291cnRlb3VzIE1hc3RlciBzYWlkIHRvIG1lLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+JmxkcXVvO0FsbCB0aG9zZSB3aG8gcGVyaXNoIGluIHRoZSB3cmF0aCBvZiBHb2Q8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkhlcmUgbWVldCB0b2dldGhlciBvdXQgb2YgZXZlcnkgbGFuZDs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkFuZCByZWFkeSBhcmUgdGhleSB0byBwYXNzIG8mcnNxdW87ZXIgdGhlIHJpdmVyLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QmVjYXVzZSBjZWxlc3RpYWwgSnVzdGljZSBzcHVycyB0aGVtIG9uLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+U28gdGhhdCB0aGVpciBmZWFyIGlzIHR1cm5lZCBpbnRvIGRlc2lyZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoaXMgd2F5IHRoZXJlIG5ldmVyIHBhc3NlcyBhIGdvb2Qgc291bDs8L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBoZW5jZSBpZiBDaGFyb24gZG90aCBjb21wbGFpbiBvZiB0aGVlLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+V2VsbCBtYXlzdCB0aG91IGtub3cgbm93IHdoYXQgaGlzIHNwZWVjaCBpbXBvcnRzLiZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoaXMgYmVpbmcgZmluaXNoZWQsIGFsbCB0aGUgZHVzayBjaGFtcGFpZ248L3A+PHAgY2xhc3M9XCJzbGluZGVudFwiPlRyZW1ibGVkIHNvIHZpb2xlbnRseSwgdGhhdCBvZiB0aGF0IHRlcnJvcjwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIHJlY29sbGVjdGlvbiBiYXRoZXMgbWUgc3RpbGwgd2l0aCBzd2VhdC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZSBsYW5kIG9mIHRlYXJzIGdhdmUgZm9ydGggYSBibGFzdCBvZiB3aW5kLDwvcD48cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGZ1bG1pbmF0ZWQgYSB2ZXJtaWxpb24gbGlnaHQsPC9wPjxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBvdmVybWFzdGVyZWQgaW4gbWUgZXZlcnkgc2Vuc2UsPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5BbmQgYXMgYSBtYW4gd2hvbSBzbGVlcCBoYXRoIHNlaXplZCBJIGZlbGwuPC9wPjwvZGl2PiddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxvbmdmZWxsb3c7XG4iLCIvLyBub3J0b24uanNcblxudmFyIG5vcnRvbiA9IFsnPHAgY2xhc3M9XCJ0aXRsZVwiPkhlbGw8L3A+PHAgY2xhc3M9XCJhdXRob3JcIj5DaGFybGVzIEVsaW90IE5vcnRvbjwvcD4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNBTlRPIEk8L3A+PHAgY2xhc3M9XCJzdW1tYXJ5XCI+RGFudGUsIGFzdHJheSBpbiBhIHdvb2QsIHJlYWNoZXMgdGhlIGZvb3Qgb2YgYSBoaWxsIHdoaWNoIGhlIGJlZ2lucyB0byBhc2NlbmQ7IGhlIGlzIGhpbmRlcmVkIGJ5IHRocmVlIGJlYXN0czsgaGUgdHVybnMgYmFjayBhbmQgaXMgbWV0IGJ5IFZpcmdpbCwgd2hvIHByb3Bvc2VzIHRvIGd1aWRlIGhpbSBpbnRvIHRoZSBldGVybmFsIHdvcmxkLjwvcD48cD5NaWR3YXkgdXBvbiB0aGUgcm9hZCBvZiBvdXIgbGlmZSBJIGZvdW5kIG15c2VsZiB3aXRoaW4gYSBkYXJrIHdvb2QsIGZvciB0aGUgcmlnaHQgd2F5IGhhZCBiZWVuIG1pc3NlZC4gQWghIGhvdyBoYXJkIGEgdGhpbmcgaXQgaXMgdG8gdGVsbCB3aGF0IHRoaXMgd2lsZCBhbmQgcm91Z2ggYW5kIGRlbnNlIHdvb2Qgd2FzLCB3aGljaCBpbiB0aG91Z2h0IHJlbmV3cyB0aGUgZmVhciEgU28gYml0dGVyIGlzIGl0IHRoYXQgZGVhdGggaXMgbGl0dGxlIG1vcmUuIEJ1dCBpbiBvcmRlciB0byB0cmVhdCBvZiB0aGUgZ29vZCB0aGF0IHRoZXJlIEkgZm91bmQsIEkgd2lsbCB0ZWxsIG9mIHRoZSBvdGhlciB0aGluZ3MgdGhhdCBJIGhhdmUgc2VlbiB0aGVyZS4gSSBjYW5ub3Qgd2VsbCByZWNvdW50IGhvdyBJIGVudGVyZWQgaXQsIHNvIGZ1bGwgd2FzIEkgb2Ygc2x1bWJlciBhdCB0aGF0IHBvaW50IHdoZXJlIEkgYWJhbmRvbmVkIHRoZSB0cnVlIHdheS4gQnV0IGFmdGVyIEkgaGFkIGFycml2ZWQgYXQgdGhlIGZvb3Qgb2YgYSBoaWxsLCB3aGVyZSB0aGF0IHZhbGxleSBlbmRlZCB3aGljaCBoYWQgcGllcmNlZCBteSBoZWFydCB3aXRoIGZlYXIsIEkgbG9va2VkIG9uIGhpZ2gsIGFuZCBzYXcgaXRzIHNob3VsZGVycyBjbG90aGVkIGFscmVhZHkgd2l0aCB0aGUgcmF5cyBvZiB0aGUgcGxhbmV0PHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4xPC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5UaGUgc3VuLCBhIHBsYW5ldCBhY2NvcmRpbmcgdG8gdGhlIFB0b2xlbWFpYyBzeXN0ZW0uPC9zcGFuPjwvc3Bhbj4gdGhhdCBsZWFkZXRoIG1lbiBhcmlnaHQgYWxvbmcgZXZlcnkgcGF0aC4gVGhlbiB3YXMgdGhlIGZlYXIgYSBsaXR0bGUgcXVpZXRlZCB3aGljaCBpbiB0aGUgbGFrZSBvZiBteSBoZWFydCBoYWQgbGFzdGVkIHRocm91Z2ggdGhlIG5pZ2h0IHRoYXQgSSBwYXNzZWQgc28gcGl0ZW91c2x5LiBBbmQgZXZlbiBhcyBvbmUgd2hvIHdpdGggc3BlbnQgYnJlYXRoLCBpc3N1ZWQgb3V0IG9mIHRoZSBzZWEgdXBvbiB0aGUgc2hvcmUsIHR1cm5zIHRvIHRoZSBwZXJpbG91cyB3YXRlciBhbmQgZ2F6ZXMsIHNvIGRpZCBteSBzb3VsLCB3aGljaCBzdGlsbCB3YXMgZmx5aW5nLCB0dXJuIGJhY2sgdG8gbG9vayBhZ2FpbiB1cG9uIHRoZSBwYXNzIHdoaWNoIG5ldmVyIGhhZCBhIGxpdmluZyBwZXJzb24gbGVmdC48L3A+PHA+QWZ0ZXIgSSBoYWQgcmVzdGVkIGEgbGl0dGxlIG15IHdlYXJ5IGJvZHkgSSB0b29rIG15IHdheSBhZ2FpbiBhbG9uZyB0aGUgZGVzZXJ0IHNsb3BlLCBzbyB0aGF0IHRoZSBmaXJtIGZvb3Qgd2FzIGFsd2F5cyB0aGUgbG93ZXIuIEFuZCBobyEgYWxtb3N0IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0ZWVwIGEgc2hlLWxlb3BhcmQsIGxpZ2h0IGFuZCB2ZXJ5IG5pbWJsZSwgd2hpY2ggd2FzIGNvdmVyZWQgd2l0aCBhIHNwb3R0ZWQgY29hdC4gQW5kIHNoZSBkaWQgbm90IG1vdmUgZnJvbSBiZWZvcmUgbXkgZmFjZSwgbmF5LCByYXRoZXIgaGluZGVyZWQgc28gbXkgcm9hZCB0aGF0IHRvIHJldHVybiBJIG9mdGVudGltZXMgaGFkIHR1cm5lZC48L3A+PHA+VGhlIHRpbWUgd2FzIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1vcm5pbmcsIGFuZCB0aGUgU3VuIHdhcyBtb3VudGluZyB1cHdhcmQgd2l0aCB0aG9zZSBzdGFycyB0aGF0IHdlcmUgd2l0aCBoaW0gd2hlbiBMb3ZlIERpdmluZSBmaXJzdCBzZXQgaW4gbW90aW9uIHRob3NlIGJlYXV0aWZ1bCB0aGluZ3M7PHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4xPC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5BY2NvcmRpbmcgdG8gb2xkIHRyYWRpdGlvbiB0aGUgc3ByaW5nIHdhcyB0aGUgc2Vhc29uIG9mIHRoZSBjcmVhdGlvbi48L3NwYW4+PC9zcGFuPiBzbyB0aGF0IHRoZSBob3VyIG9mIHRoZSB0aW1lIGFuZCB0aGUgc3dlZXQgc2Vhc29uIHdlcmUgb2NjYXNpb24gb2YgZ29vZCBob3BlIHRvIG1lIGNvbmNlcm5pbmcgdGhhdCB3aWxkIGJlYXN0IHdpdGggdGhlIGRhcHBsZWQgc2tpbi4gQnV0IG5vdCBzbyB0aGF0IHRoZSBzaWdodCB3aGljaCBhcHBlYXJlZCB0byBtZSBvZiBhIGxpb24gZGlkIG5vdCBnaXZlIG1lIGZlYXIuIEhlIHNlZW1lZCB0byBiZSBjb21pbmcgYWdhaW5zdCBtZSwgd2l0aCBoZWFkIGhpZ2ggYW5kIHdpdGggcmF2ZW5pbmcgaHVuZ2VyLCBzbyB0aGF0IGl0IHNlZW1lZCB0aGF0IHRoZSBhaXIgd2FzIGFmZnJpZ2h0ZWQgYXQgaGltLiBBbmQgYSBzaGUtd29sZiw8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjI8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZXNlIHRocmVlIGJlYXN0cyBjb3JyZXNwb25kIHRvIHRoZSB0cmlwbGUgZGl2aXNpb24gb2Ygc2lucyBpbnRvIHRob3NlIG9mIGluY29udGluZW5jZSwgb2YgdmlvbGVuY2UsIGFuZCBvZiBmcmF1ZC4gU2VlIENhbnRvIFhJLjwvc3Bhbj48L3NwYW4+IHdobyB3aXRoIGFsbCBjcmF2aW5ncyBzZWVtZWQgbGFkZW4gaW4gaGVyIG1lYWdyZW5lc3MsIGFuZCBhbHJlYWR5IGhhZCBtYWRlIG1hbnkgZm9sayB0byBsaXZlIGZvcmxvcm4sJm1kYXNoO3NoZSBjYXVzZWQgbWUgc28gbXVjaCBoZWF2aW5lc3MsIHdpdGggdGhlIGZlYXIgdGhhdCBjYW1lIGZyb20gc2lnaHQgb2YgaGVyLCB0aGF0IEkgbG9zdCBob3BlIG9mIHRoZSBoZWlnaHQuIEFuZCBzdWNoIGFzIGhlIGlzIHdobyBnYWluZXRoIHdpbGxpbmdseSwgYW5kIHRoZSB0aW1lIGFycml2ZXMgdGhhdCBtYWtlcyBoaW0gbG9zZSwgd2hvIGluIGFsbCBoaXMgdGhvdWdodHMgd2VlcHMgYW5kIGlzIHNhZCwmbWRhc2g7c3VjaCBtYWRlIG1lIHRoZSBiZWFzdCB3aXRob3V0IHJlcG9zZSB0aGF0LCBjb21pbmcgb24gYWdhaW5zdCBtZSwgbGl0dGxlIGJ5IGxpdHRsZSB3YXMgcHVzaGluZyBtZSBiYWNrIHRoaXRoZXIgd2hlcmUgdGhlIFN1biBpcyBzaWxlbnQuPC9wPjxwPldoaWxlIEkgd2FzIGZhbGxpbmcgYmFjayB0byB0aGUgbG93IHBsYWNlLCBiZWZvcmUgbWluZSBleWVzIGFwcGVhcmVkIG9uZSB3aG8gdGhyb3VnaCBsb25nIHNpbGVuY2Ugc2VlbWVkIGhvYXJzZS4gV2hlbiBJIHNhdyBoaW0gaW4gdGhlIGdyZWF0IGRlc2VydCwgJmxkcXVvO0hhdmUgcGl0eSBvbiBtZSEmcmRxdW87IEkgY3JpZWQgdG8gaGltLCAmbGRxdW87d2hhdHNvIHRob3UgYXJ0LCBvciBzaGFkZSBvciByZWFsIG1hbi4mcmRxdW87IEhlIGFuc3dlcmVkIG1lOiAmbGRxdW87Tm90IG1hbjsgbWFuIG9uY2UgSSB3YXMsIGFuZCBteSBwYXJlbnRzIHdlcmUgTG9tYmFyZHMsIGFuZCBNYW50dWFucyBieSBjb3VudHJ5IGJvdGguIEkgd2FzIGJvcm4gc3ViIEp1bGlvLCB0aG91Z2ggbGF0ZSwgYW5kIEkgbGl2ZWQgYXQgUm9tZSB1bmRlciB0aGUgZ29vZCBBdWd1c3R1cywgaW4gdGhlIHRpbWUgb2YgdGhlIGZhbHNlIGFuZCBseWluZyBnb2RzLiBQb2V0IHdhcyBJLCBhbmQgc2FuZyBvZiB0aGF0IGp1c3Qgc29uIG9mIEFuY2hpc2VzIHdobyBjYW1lIGZyb20gVHJveSBhZnRlciBwcm91ZCBJbGlvbiBoYWQgYmVlbiBidXJuZWQuIEJ1dCB0aG91LCB3aHkgcmV0dXJuZXN0IHRob3UgdG8gc28gZ3JlYXQgYW5ub3k/IFdoeSBkb3N0IHRob3Ugbm90IGFzY2VuZCB0aGUgZGVsZWN0YWJsZSBtb3VudGFpbiB3aGljaCBpcyB0aGUgc291cmNlIGFuZCBjYXVzZSBvZiBldmVyeSBqb3k/JnJkcXVvOzwvcD48cD4mbGRxdW87QXJ0IHRob3UgdGhlbiB0aGF0IFZpcmdpbCBhbmQgdGhhdCBmb3VudCB3aGljaCBwb3VyZXRoIGZvcnRoIHNvIGxhcmdlIGEgc3RyZWFtIG9mIHNwZWVjaD8mcmRxdW87IHJlcGxpZWQgSSB0byBoaW0gd2l0aCBiYXNoZnVsIGZyb250OiAmbGRxdW87TyBob25vciBhbmQgbGlnaHQgb2YgdGhlIG90aGVyIHBvZW0gSSBtYXkgdGhlIGxvbmcgc2VhbCBhdmFpbCBtZSwgYW5kIHRoZSBncmVhdCBsb3ZlLCB3aGljaCBoYXZlIG1hZGUgbWUgc2VhcmNoIHRoeSB2b2x1bWUhIFRob3UgYXJ0IG15IG1hc3RlciBhbmQgbXkgYXV0aG9yOyB0aG91IGFsb25lIGFydCBoZSBmcm9tIHdob20gSSB0b29rIHRoZSBmYWlyIHN0eWxlIHRoYXQgaGF0aCBkb25lIG1lIGhvbm9yLiBCZWhvbGQgdGhlIGJlYXN0IGJlY2F1c2Ugb2Ygd2hpY2ggSSB0dXJuZWQ7IGhlbHAgbWUgYWdhaW5zdCBoZXIsIGZhbW91cyBzYWdlLCBmb3Igc2hlIG1ha2VzIGFueSB2ZWlucyBhbmQgcHVsc2VzIHRyZW1ibGUuJnJkcXVvOyAmbGRxdW87VGhlZSBpdCBiZWhvdmVzIHRvIGhvbGQgYW5vdGhlciBjb3Vyc2UsJnJkcXVvOyBoZSByZXBsaWVkLCB3aGVuIGhlIHNhdyBtZSB3ZWVwaW5nLCAmbGRxdW87aWYgdGhvdSB3aXNoZXN0IHRvIGVzY2FwZSBmcm9tIHRoaXMgc2F2YWdlIHBsYWNlOyBmb3IgdGhpcyBiZWFzdCwgYmVjYXVzZSBvZiB3aGljaCB0aG91IGNyaWVzdCBvdXQsIGxldHMgbm90IGFueSBvbmUgcGFzcyBhbG9uZyBoZXIgd2F5LCBidXQgc28gaGluZGVycyBoaW0gdGhhdCBzaGUga2lsbHMgaGltISBhbmQgc2hlIGhhcyBhIG5hdHVyZSBzbyBtYWxpZ24gYW5kIGV2aWwgdGhhdCBzaGUgbmV2ZXIgc2F0ZXMgaGVyIGdyZWVkeSB3aWxsLCBhbmQgYWZ0ZXIgZm9vZCBpcyBodW5ncmllciB0aGFuIGJlZm9yZS4gTWFueSBhcmUgdGhlIGFuaW1hbHMgd2l0aCB3aGljaCBzaGUgd2l2ZXMsIGFuZCB0aGVyZSBzaGFsbCBiZSBtb3JlIHlldCwgdGlsbCB0aGUgaG91bmQ8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPk9mIHdob20gdGhlIGhvdW5kIGlzIHRoZSBzeW1ib2wsIGFuZCB0byB3aG9tIERhbnRlIGxvb2tlZCBmb3IgdGhlIGRlbGl2ZXJhbmNlIG9mIEl0YWx5IGZyb20gdGhlIGRpc2NvcmRhIGFuZCBtaXNydWxlIHRoYXQgbWFkZSBoZXIgd3JldGNoZWQsIGlzIHN0aWxsIG1hdHRlciBvZiBkb3VidCwgYWZ0ZXIgY2VudHVyaWVzIG9mIGNvbnRyb3ZlcnN5Ljwvc3Bhbj48L3NwYW4+IHNoYWxsIGNvbWUgdGhhdCB3aWxsIG1ha2UgaGVyIGRpZSBvZiBncmllZi4gSGUgc2hhbGwgbm90IGZlZWQgb24gbGFuZCBvciBnb29kcywgYnV0IHdpc2RvbSBhbmQgbG92ZSBhbmQgdmFsb3IsIGFuZCBoaXMgYmlydGhwbGFjZSBzaGFsbCBiZSBiZXR3ZWVuIEZlbHRybyBhbmQgRmVsdHJvLiBPZiB0aGF0IGh1bWJsZTxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Mjwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+RmFsbGVuLCBodW1pbGlhdGVkLjwvc3Bhbj48L3NwYW4+IEl0YWx5IHNoYWxsIGhlIGJlIHRoZSBzYWx2YXRpb24sIGZvciB3aGljaCB0aGUgdmlyZ2luIENhbWlsbGEgZGllZCwgYW5kIEV1cnlhbHVzLCBUdXJudXMgYW5kIE5pc3VzIG9mIHRoZWlyIHdvdW5kcy4gSGUgc2hhbGwgaHVudCBoZXIgdGhyb3VnaCBldmVyeSB0b3duIHRpbGwgaGUgc2hhbGwgaGF2ZSBzZXQgaGVyIGJhY2sgaW4gaGVsbCwgdGhlcmUgd2hlbmNlIGVudnkgZmlyc3Qgc2VudCBoZXIgZm9ydGguIFdoZXJlZm9yZSBJIHRoaW5rIGFuZCBkZWVtIGl0IGZvciB0aHkgYmVzdCB0aGF0IHRob3UgZm9sbG93IG1lLCBhbmQgSSB3aWxsIGJlIHRoeSBndWlkZSwgYW5kIHdpbGwgbGVhZCB0aGVlIGhlbmNlIHRocm91Z2ggdGhlIGV0ZXJuYWwgcGxhY2Ugd2hlcmUgdGhvdSBzaGFsdCBoZWFyIHRoZSBkZXNwYWlyaW5nIHNocmlla3MsIHNoYWx0IHNlZSB0aGUgYW5jaWVudCBzcGlyaXRzIHdvZWZ1bCB3aG8gZWFjaCBwcm9jbGFpbSB0aGUgc2Vjb25kIGRlYXRoLiBBbmQgdGhlbiB0aG91IHNoYWx0IHNlZSB0aG9zZSB3aG8gYXJlIGNvbnRlbnRlZCBpbiB0aGUgZmlyZSwgYmVjYXVzZSB0aGV5IGhvcGUgdG8gY29tZSwgd2hlbmV2ZXIgaXQgbWF5IGJlLCB0byB0aGUgYmxlc3NlZCBmb2xrOyB0byB3aG9tIGlmIHRob3Ugd2lsdCB0aGVyZWFmdGVyIGFzY2VuZCwgdGhlbSBzaGFsbCBiZSBhIHNvdWwgbW9yZSB3b3J0aHkgdGhhbiBJIGZvciB0aGF0LiBXaXRoIGhlciBJIHdpbGwgbGVhdmUgdGhlZSBhdCBteSBkZXBhcnR1cmU7IGZvciB0aGF0IEVtcGVyb3Igd2hvIHJlaWduZXRoIHRoZW0gYWJvdmUsIGJlY2F1c2UgSSB3YXMgcmViZWxsaW91cyB0byBIaXMgbGF3LCB3aWxscyBub3QgdGhhdCBpbnRvIEhpcyBjaXR5IGFueSBvbmUgc2hvdWxkIGNvbWUgdGhyb3VnaCBtZS4gSW4gYWxsIHBhcnRzIEhlIGdvdmVybnMgYW5kIHRoZW0gSGUgcmVpZ25zOiB0aGVyZSBpbiBIaXMgY2l0eSBhbmQgSGlzIGxvZnR5IHNlYXQuIE8gaGFwcHkgaGUgd2hvbSB0aGVyZXRvIEhlIGVsZWN0cyEmcmRxdW87IEFuZCBJIHRvIGhpbSwgJmxkcXVvO1BvZXQsIEkgYmVzZWVjaCB0aGVlIGJ5IHRoYXQgR29kIHdob20gdGhvdSBkaWRzdCBub3Qga25vdywgaW4gb3JkZXIgdGhhdCBJIG1heSBlc2NhcGUgdGhpcyBpbGwgYW5kIHdvcnNlLCB0aGF0IHRob3UgbGVhZCBtZSB0aGl0aGVyIHdob20gdGhvdSBub3cgaGVzdCBzYWlkLCBzbyB0aGF0IEkgbWF5IHNlZSB0aGUgZ2F0ZSBvZiBTdC4gUGV0ZXIsIGFuZCB0aG9zZSB3aG9tIHRob3UgbWFrZXN0IHNvIGFmZmxpY3RlZC4mcmRxdW87PC9wPjxwPlRoZW4gaGUgbW92ZWQgb24sIGFuZCBJIGJlaGluZCBoaW0ga2VwdC48L3A+JyxcblxuXHQnPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DQU5UTyBJSTwvcD48cCBjbGFzcz1cInN1bW1hcnlcIj5EYW50ZSwgZG91YnRmdWwgb2YgaGlzIG93biBwb3dlcnMsIGlzIGRpc2NvdXJhZ2VkIGF0IHRoZSBvdXRzZXQuJm1kYXNoO1ZpcmdpbCBjaGVlcnMgaGltIGJ5IHRlbGxpbmcgaGltIHRoYXQgaGUgaGFzIGJlZW4gc2VudCB0byBoaXMgYWlkIGJ5IGEgYmxlc3NlZCBTcGlyaXQgZnJvbSBIZWF2ZW4uJm1kYXNoO0RhbnRlIGNhc3RzIG9mZiBmZWFyLCBhbmQgdGhlIHBvZXRzIHByb2NlZWQuPC9wPjxwPlRoZSBkYXkgd2FzIGdvaW5nLCBhbmQgdGhlIGR1c2t5IGFpciB3YXMgdGFraW5nIHRoZSBsaXZpbmcgdGhpbmdzIHRoYXQgYXJlIG9uIGVhcnRoIGZyb20gdGhlaXIgZmF0aWd1ZXMsIGFuZCBJIGFsb25lIHdhcyBwcmVwYXJpbmcgdG8gc3VzdGFpbiB0aGUgd2FyIGFsaWtlIG9mIHRoZSByb2FkLCBhbmQgb2YgdGhlIHdvZSB3aGljaCB0aGUgbWluZCB0aGF0IGVycmV0aCBub3Qgc2hhbGwgcmV0cmFjZS4gTyBNdXNlcywgTyBsb2Z0eSBnZW5pdXMsIG5vdyBhc3Npc3QgbWUhIE8gbWluZCB0aGF0IGRpZHN0IGluc2NyaWJlIHRoYXQgd2hpY2ggSSBzYXcsIGhlcmUgc2hhbGwgdGh5IG5vYmlsaXR5IGFwcGVhciEgSSBiZWdhbjombWRhc2g7JmxkcXVvO1BvZXQsIHRoYXQgZ3VpZGVzdCBtZSwgY29uc2lkZXIgbXkgdmlydHVlLCBpZiBpdCBpcyBzdWZmaWNpZW50LCBlcmUgdG8gdGhlIGRlZXAgcGFzcyB0aG91IHRydXN0ZXN0IG1lLiBUaG91IHNheWVzdCB0aGF0IHRoZSBwYXJlbnQgb2YgU2lsdml1cyB3aGlsZSBzdGlsbCBjb3JydXB0aWJsZSB3ZW50IHRvIHRoZSBpbW1vcnRhbCB3b3JsZCBhbmQgd2FzIHRoZXJlIGluIHRoZSBib2R5LiBXaGVyZWZvcmUgaWYgdGhlIEFkdmVyc2FyeSBvZiBldmVyeSBpbGwgd2FzIHRoZW4gY291cnRlb3VzLCB0aGlua2luZyBvbiB0aGUgaGlnaCBlZmZlY3QgdGhhdCBzaG91bGQgcHJvY2VlZCBmcm9tIGhpbSwgYW5kIG9uIHRoZSBXaG8gYW5kIHRoZSBXaGF0LDxzcGFuIGNsYXNzPVwibm90ZVwiPjxzcGFuIGNsYXNzPVwibm90ZW5vXCI+MTwvc3Bhbj48c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+V2hvIGhlIHdhcywgYW5kIHdoYXQgc2hvdWxkIHJlc3VsdC48L3NwYW4+PC9zcGFuPiBpdCBzZWVtZXRoIG5vdCB1bm1lZXQgdG8gdGhlIG1hbiBvZiB1bmRlcnN0YW5kaW5nOyBmb3IgaW4gdGhlIGVtcHlyZWFsIGhlYXZlbiBoZSBoYWQgYmVlbiBjaG9zZW4gZm9yIGZhdGhlciBvZiByZXZlcmVkIFJvbWUgYW5kIG9mIGhlciBlbXBpcmU7IGJvdGggd2hpY2ggKHRvIHNheSB0cnV0aCBpbmRlZWQpIHdlcmUgb3JkYWluZWQgZm9yIHRoZSBob2x5IHBsYWNlIHdoZXJlIHRoZSBzdWNjZXNzb3Igb2YgdGhlIGdyZWF0ZXIgUGV0ZXIgaGF0aCBoaXMgc2VhdC4gVGhyb3VnaCB0aGlzIGdvaW5nLCB3aGVyZW9mIHRob3UgZ2l2ZXN0IGhpbSB2YXVudCwgaGUgbGVhcm5lZCB0aGluZ3Mgd2hpY2ggd2VyZSB0aGUgY2F1c2Ugb2YgaGlzIHZpY3RvcnkgYW5kIG9mIHRoZSBwYXBhbCBtYW50bGUuIEFmdGVyd2FyZCB0aGUgQ2hvc2VuIFZlc3NlbCB3ZW50IHRoaXRoZXIgdG8gYnJpbmcgdGhlbmNlIGNvbWZvcnQgdG8gdGhhdCBmYWl0aCB3aGljaCBpcyB0aGUgYmVnaW5uaW5nIG9mIHRoZSB3YXkgb2Ygc2FsdmF0aW9uLiBCdXQgSSwgd2h5IGdvIEkgdGhpdGhlcj8gb3Igd2hvIGNvbmNlZGVzIGl0PyBJIGFtIG5vdCBBZW5lYXMsIEkgYW0gbm90IFBhdWw7IG1lIHdvcnRoeSBvZiB0aGlzLCBuZWl0aGVyIEkgbm9yIG90aGVycyB0aGluazsgd2hlcmVmb3JlIGlmIEkgZ2l2ZSBteXNlbGYgdXAgdG8gZ28sIEkgZmVhciBsZXN0IHRoZSBnb2luZyBtYXkgYmUgbWFkLiBUaG91IGFydCB3aXNlLCB0aG91IHVuZGVyc3RhbmRlc3QgYmV0dGVyIHRoYW4gSSBzcGVhay4mcmRxdW87PC9wPjxwPkFuZCBhcyBpcyBoZSB3aG8gdW53aWxscyB3aGF0IGhlIHdpbGxlZCwgYW5kIGJlY2F1c2Ugb2YgbmV3IHRob3VnaHRzIGNoYW5nZXMgaGlzIGRlc2lnbiwgc28gdGhhdCBoZSBxdWl0ZSB3aXRoZHJhd3MgZnJvbSBiZWdpbm5pbmcsIHN1Y2ggSSBiZWNhbWUgb24gdGhhdCBkYXJrIGhpbGxzaWRlOiB3aGVyZWZvcmUgaW4gbXkgdGhvdWdodCBJIGFiYW5kb25lZCB0aGUgZW50ZXJwcmlzZSB3aGljaCBoYWQgYmVlbiBzbyBoYXN0eSBpbiB0aGUgYmVnaW5uaW5nLjwvcD48cD4mbGRxdW87SWYgSSBoYXZlIHJpZ2h0bHkgdW5kZXJzdG9vZCB0aHkgc3BlZWNoLCZyZHF1bzsgcmVwbGllZCB0aGF0IHNoYWRlIG9mIHRoZSBtYWduYW5pbW91cyBvbmUsICZsZHF1bzt0aHkgc291bCBpcyBodXJ0IGJ5IGNvd2FyZGljZSwgd2hpY2ggb2Z0ZW50aW1lcyBlbmN1bWJlcmV0aCBhIG1hbiBzbyB0aGF0IGl0IHR1cm5zIGhpbSBiYWNrIGZyb20gaG9ub3JhYmxlIGVudGVycHJpc2UsIGFzIGZhbHNlIHNlZWluZyBkb2VzIGEgYmVhc3Qgd2hlbiBpdCBpcyBzdGFydGxlZC4gSW4gb3JkZXIgdGhhdCB0aG91IGxvb3NlIHRoZWUgZnJvbSB0aGlzIGZlYXIgSSB3aWxsIHRlbGwgdGhlZSB3aGVyZWZvcmUgSSBoYXZlIGNvbWUsIGFuZCB3aGF0IEkgaGVhcmQgYXQgdGhlIGZpcnN0IG1vbWVudCB0aGF0IEkgZ3JpZXZlZCBmb3IgdGhlZS4gSSB3YXMgYW1vbmcgdGhvc2Ugd2hvIGFyZSBzdXNwZW5kZWQsPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4xPC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5JbiBMaW1ibywgbmVpdGhlciBpbiBIZWxsIG5vciBIZWF2ZW4uPC9zcGFuPjwvc3Bhbj4gYW5kIGEgTGFkeSBjYWxsZWQgbWUsIHNvIGJsZXNzZWQgYW5kIGJlYXV0aWZ1bCB0aGF0IEkgYmVzb3VnaHQgaGVyIHRvIGNvbW1hbmQuIEhlciBleWVzIHdlcmUgbW9yZSBsdWNlbnQgdGhhbiB0aGUgc3RhciwgYW5kIHNoZSBiZWdhbiB0byBzcGVhayB0byBtZSBzd2VldCBhbmQgbG93LCB3aXRoIGFuZ2VsaWMgdm9pY2UsIGluIGhlciBvd24gdG9uZ3VlOiAmbHNxdW87TyBjb3VydGVvdXMgTWFudHVhbiBzb3VsLCBvZiB3aG9tIHRoZSBmYW1lIHlldCBsYXN0ZXRoIGluIHRoZSB3b3JsZCwgYW5kIHNoYWxsIGxhc3Qgc28gbG9uZyBhcyB0aGUgd29ybGQgZW5kdXJldGghIGEgZnJpZW5kIG9mIG1pbmUgYW5kIG5vdCBvZiBmb3J0dW5lIHVwb24gdGhlIGRlc2VydCBoaWxsc2lkZSBpcyBzbyBoaW5kZXJlZCBvbiBoaXMgcm9hZCB0aGF0IGhlIGhhcyB0dXJuZWQgZm9yIGZlYXIsIGFuZCBJIGFtIGFmcmFpZCwgdGhyb3VnaCB0aGF0IHdoaWNoIEkgaGF2ZSBoZWFyZCBvZiBoaW0gaW4gaGVhdmVuLCBsZXN0IGFscmVhZHkgaGUgYmUgc28gYXN0cmF5IHRoYXQgSSBtYXkgaGF2ZSByaXNlbiBsYXRlIHRvIGhpcyBzdWNjb3IuIE5vdyBkbyB0aG91IG1vdmUsIGFuZCB3aXRoIHRoeSBzcGVlY2ggb3JuYXRlLCBhbmQgd2l0aCB3aGF0ZXZlciBpcyBuZWVkZnVsIGZvciBoaXMgZGVsaXZlcmFuY2UsIGFzc2lzdCBoaW0gc28gdGhhdCBJIG1heSBiZSBjb25zb2xlZCBmb3IgaGltLiBJIGFtIEJlYXRyaWNlIHdobyBtYWtlIHRoZWUgZ28uIEkgY29tZSBmcm9tIGEgcGxhY2Ugd2hpdGhlciBJIGRlc2lyZSB0byByZXR1cm4uIExvdmUgbW92ZWQgbWUsIGFuZCBtYWtlcyBtZSBzcGVhay4gV2hlbiBJIHNoYWxsIGJlIGJlZm9yZSBteSBMb3JkLCBJIHdpbGwgY29tbWVuZCB0aGVlIG9mdGVuIHVudG8gSGltLiZyc3F1bzsgVGhlbiBzaGUgd2FzIHNpbGVudCwgYW5kIHRoZXJlb24gSSBiZWdhbjogJmxzcXVvO08gTGFkeSBvZiBWaXJ0dWUsIHRob3UgYWxvbmUgdGhyb3VnaCB3aG9tIHRoZSBodW1hbiByYWNlIHN1cnBhc3NldGggYWxsIGNvbnRhaW5lZCB3aXRoaW4gdGhhdCBoZWF2ZW4gd2hpY2ggaGF0aCB0aGUgc21hbGxlc3QgY2lyY2xlcyE8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjI8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZSBoZWF2ZW4gb2YgdGhlIG1vb24sIG5lYXJlc3QgdG8gdGhlIGVhcnRoLjwvc3Bhbj48L3NwYW4+IHNvIHBsZWFzaW5nIHVudG8gbWUgaXMgdGh5IGNvbW1hbmQgdGhhdCB0byBvYmV5IGl0LCB3ZXJlIGl0IGFscmVhZHkgZG9uZSwgd2VyZSBzbG93IHRvIG1lLiBUaG91IGhhc3Qgbm8gbmVlZCBmdXJ0aGVyIHRvIG9wZW4gdW50byBtZSB0aHkgd2lsbDsgYnV0IHRlbGwgbWUgdGhlIGNhdXNlIHdoeSB0aG91IGd1YXJkZXN0IG5vdCB0aHlzZWxmIGZyb20gZGVzY2VuZGluZyBkb3duIGhlcmUgaW50byB0aGlzIGNlbnRyZSwgZnJvbSB0aGUgYW1wbGUgcGxhY2Ugd2hpdGhlciB0aG91IGJ1cm5lc3QgdG8gcmV0dXJuLiZsc3F1bzsgJnJzcXVvO1NpbmNlIHRob3Ugd2lzaGVzdCB0byBrbm93IHNvIGlud2FyZGx5LCBJIHdpbGwgdGVsbCB0aGVlIGJyaWVmbHksJnJzcXVvOyBzaGUgcmVwbGllZCB0byBtZSwgJmxzcXVvO3doZXJlZm9yZSBJIGZlYXIgbm90IHRvIGNvbWUgaGVyZSB3aXRoaW4uIE9uZSBvdWdodCB0byBmZWFyIHRob3NlIHRoaW5ncyBvbmx5IHRoYXQgaGF2ZSBwb3dlciBvZiBkb2luZyBoYXJtLCB0aGUgb3RoZXJzIG5vdCwgZm9yIHRoZXkgYXJlIG5vdCBkcmVhZGZ1bC4gSSBhbSBtYWRlIGJ5IEdvZCwgdGhhbmtzIGJlIHRvIEhpbSwgc3VjaCB0aGF0IHlvdXIgbWlzZXJ5IHRvdWNoZXRoIG1lIG5vdCwgbm9yIGRvdGggdGhlIGZsYW1lIG9mIHRoaXMgYnVybmluZyBhc3NhaWwgbWUuIEEgZ2VudGxlIExhZHk8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjM8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZSBWaXJnaW4uPC9zcGFuPjwvc3Bhbj4gaXMgaW4gaGVhdmVuIHdobyBoYXRoIHBpdHkgZm9yIHRoaXMgaGluZHJhbmNlIHdoZXJldG8gSSBzZW5kIHRoZWUsIHNvIHRoYXQgc3Rlcm4ganVkZ21lbnQgdGhlcmUgYWJvdmUgc2hlIGJyZWFrZXRoLiBTaGUgc3VtbW9uZWQgTHVjaWEgaW4gaGVyIHJlcXVlc3QsIGFuZCBzYWlkLCAmbGRxdW87VGh5IGZhaXRoZnVsIG9uZSBub3cgaGF0aCBuZWVkIG9mIHRoZWUsIGFuZCB1bnRvIHRoZWUgSSBjb21tZW5kIGhpbS4mcmRxdW87IEx1Y2lhLCB0aGUgZm9lIG9mIGV2ZXJ5IGNydWVsIG9uZSwgcm9zZSBhbmQgY2FtZSB0byB0aGUgcGxhY2Ugd2hlcmUgSSB3YXMsIHNlYXRlZCB3aXRoIHRoZSBhbmNpZW50IFJhY2hlbC4gU2hlIHNhaWQsICZsZHF1bztCZWF0cmljZSwgdHJ1ZSBwcmFpc2Ugb2YgR29kLCB3aHkgZG9zdCB0aG91IG5vdCBzdWNjb3IgaGltIHdobyBzbyBsb3ZlZCB0aGVlIHRoYXQgZm9yIHRoZWUgaGUgY2FtZSBmb3J0aCBmcm9tIHRoZSB2dWxnYXIgdGhyb25nPyBEb3N0IHRob3Ugbm90IGhlYXIgdGhlIHBpdHkgb2YgaGlzIHBsYWludD8gRG9zdCB0aG91IG5vdCBzZWUgdGhlIGRlYXRoIHRoYXQgY29tYmF0cyBoaW0gYmVzaWRlIHRoZSBzdHJlYW0gd2hlcmVvZiB0aGUgc2VhIGhhdGggbm8gdmF1bnQ/JnJkcXVvOyBJbiB0aGUgd29ybGQgbmV2ZXIgd2VyZSBwZXJzb25zIHN3aWZ0IHRvIHNlZWsgdGhlaXIgZ29vZCwgYW5kIHRvIGZseSB0aGVpciBoYXJtLCBhcyBJLCBhZnRlciB0aGVzZSB3b3JkcyB3ZXJlIHV0dGVyZWQsIGNhbWUgaGVyZSBiZWxvdywgZnJvbSBteSBibGVzc2VkIHNlYXQsIHB1dHRpbmcgbXkgdHJ1c3QgaW4gdGh5IHVwcmlnaHQgc3BlZWNoLCB3aGljaCBob25vcnMgdGhlZSBhbmQgdGhlbSB3aG8gaGF2ZSBoZWFyZCBpdC4mcnNxdW87IEFmdGVyIHNoZSBoYWQgc2FpZCB0aGlzIHRvIG1lLCB3ZWVwaW5nIHNoZSB0dXJuZWQgaGVyIGx1Y2VudCBleWVzLCB3aGVyZWJ5IHNoZSBtYWRlIG1lIG1vcmUgc3BlZWR5IGluIGNvbWluZy4gQW5kIEkgY2FtZSB0byB0aGVlIGFzIHNoZSB3aWxsZWQuIFRoZWUgaGF2ZSBJIGRlbGl2ZXJlZCBmcm9tIHRoYXQgd2lsZCBiZWFzdCB0aGF0IHRvb2sgZnJvbSB0aGVlIHRoZSBzaG9ydCBhc2NlbnQgb2YgdGhlIGJlYXV0aWZ1bCBtb3VudGFpbi4gV2hhdCBpcyBpdCB0aGVuPyBXaHksIHdoeSBkb3N0IHRob3UgaG9sZCBiYWNrPyB3aHkgZG9zdCB0aG91IGhhcmJvciBzdWNoIGNvd2FyZGljZSBpbiB0aHkgaGVhcnQ/IHdoeSBoYXN0IHRob3Ugbm90IGRhcmluZyBhbmQgYm9sZG5lc3MsIHNpbmNlIHRocmVlIGJsZXNzZWQgTGFkaWVzIGNhcmUgZm9yIHRoZWUgaW4gdGhlIGNvdXJ0IG9mIEhlYXZlbiwgYW5kIG15IHNwZWVjaCBwbGVkZ2VzIHRoZWUgc3VjaCBnb29kPyZyZHF1bzs8L3A+PHA+QXMgZmxvd2VyZXRzLCBiZW50IGFuZCBjbG9zZWQgYnkgdGhlIGNoaWxsIG9mIG5pZ2h0LCBhZnRlciB0aGUgc3VuIHNoaW5lcyBvbiB0aGVtIHN0cmFpZ2h0ZW4gdGhlbXNlbHZlcyBhbGwgb3BlbiBvbiB0aGVpciBzdGVtLCBzbyBJIGJlY2FtZSB3aXRoIG15IHdlYWsgdmlydHVlLCBhbmQgc3VjaCBnb29kIGRhcmluZyBoYXN0ZW5lZCB0byBteSBoZWFydCB0aGF0IEkgYmVnYW4gbGlrZSBvbmUgZW5mcmFuY2hpc2VkOiAmbGRxdW87T2ggY29tcGFzc2lvbmF0ZSBzaGUgd2hvIHN1Y2NvcmVkIG1lISBhbmQgdGhvdSBjb3VydGVvdXMgd2hvIGRpZHN0IHNwZWVkaWx5IG9iZXkgdGhlIHRydWUgd29yZHMgdGhhdCBzaGUgYWRkcmVzc2VkIHRvIHRoZWUhIFRob3UgYnkgdGh5IHdvcmRzIGhhc3Qgc28gZGlzcG9zZWQgbXkgaGVhcnQgd2l0aCBkZXNpcmUgb2YgZ29pbmcsIHRoYXQgSSBoYXZlIHJldHVybmVkIHVudG8gbXkgZmlyc3QgaW50ZW50LiBHbyBvbiBub3csIGZvciBvbmUgc29sZSB3aWxsIGlzIGluIHVzIGJvdGg6IFRob3UgTGVhZGVyLCB0aG91IExvcmQsIGFuZCB0aG91IE1hc3Rlci4mcmRxdW87IFRodXMgSSBzYWlkIHRvIGhpbTsgYW5kIHdoZW4gaGUgaGFkIG1vdmVkIG9uLCBJIGVudGVyZWQgYWxvbmcgdGhlIGRlZXAgYW5kIHNhdmFnZSByb2FkLjwvcD4nLFxuXG5cdCc8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNBTlRPIElJSTwvcD48cCBjbGFzcz1cInN1bW1hcnlcIj5UaGUgZ2F0ZSBvZiBIZWxsLiZtZGFzaDtWaXJnaWwgbGVuZHMgRGFudGUgaW4uJm1kYXNoO1RoZSBwdW5pc2htZW50IG9mIHRoZSBuZWl0aGVyIGdvb2Qgbm9yIGJhZC4mbWRhc2g7QWNoZXJvbiwgYW5kIHRoZSBzaW5uZXJzIG9uIGl0cyBiYW5rLiZtZGFzaDtDaGFyb24uJm1kYXNoO0VhcnRocXVha2UuJm1kYXNoO0RhbnRlIHN3b29ucy48L3A+PHA+JmxkcXVvO1Rocm91Z2ggbWUgaXMgdGhlIHdheSBpbnRvIHRoZSB3b2VmdWwgY2l0eTsgdGhyb3VnaCBtZSBpcyB0aGUgd2F5IGludG8gZXRlcm5hbCB3b2U7IHRocm91Z2ggbWUgaXMgdGhlIHdheSBhbW9uZyB0aGUgbG9zdCBwZW9wbGUuIEp1c3RpY2UgbW92ZWQgbXkgbG9mdHkgbWFrZXI6IHRoZSBkaXZpbmUgUG93ZXIsIHRoZSBzdXByZW1lIFdpc2RvbSBhbmQgdGhlIHByaW1hbCBMb3ZlIG1hZGUgbWUuIEJlZm9yZSBtZSB3ZXJlIG5vIHRoaW5ncyBjcmVhdGVkLCB1bmxlc3MgZXRlcm5hbCwgYW5kIEkgZXRlcm5hbCBsYXN0LiBMZWF2ZSBldmVyeSBob3BlLCB5ZSB3aG8gZW50ZXIhJnJkcXVvOzwvcD48cD5UaGVzZSB3b3JkcyBvZiBjb2xvciBvYnNjdXJlIEkgc2F3IHdyaXR0ZW4gYXQgdGhlIHRvcCBvZiBhIGdhdGU7IHdoZXJlYXQgSSwgJmxkcXVvO01hc3RlciwgdGhlaXIgbWVhbmluZyBpcyBkaXJlIHRvIG1lLiZyZHF1bzs8L3A+PHA+QW5kIGhlIHRvIG1lLCBsaWtlIG9uZSB3aG8ga25ldywgJmxkcXVvO0hlcmUgaXQgYmVob3ZlcyB0byBsZWF2ZSBldmVyeSBmZWFyOyBpdCBiZWhvdmVzIHRoYXQgYWxsIGNvd2FyZGljZSBzaG91bGQgaGVyZSBiZSBkZWFkLiBXZSBoYXZlIGNvbWUgdG8gdGhlIHBsYWNlIHdoZXJlIEkgaGF2ZSB0b2xkIHRoZWUgdGhhdCB0aG91IHNoYWx0IHNlZSB0aGUgd29lZnVsIHBlb3BsZSwgd2hvIGhhdmUgbG9zdCB0aGUgZ29vZCBvZiB0aGUgdW5kZXJzdGFuZGluZy4mcmRxdW87PC9wPjxwPkFuZCB3aGVuIGhlIGhhZCBwdXQgaGlzIGhhbmQgb24gbWluZSwgd2l0aCBhIGdsYWQgY291bnRlbmFuY2UsIHdoZXJlZnJvbSBJIHRvb2sgY291cmFnZSwgaGUgYnJvdWdodCBtZSB3aXRoaW4gdGhlIHNlY3JldCB0aGluZ3MuIEhlcmUgc2lnaHMsIGxhbWVudHMsIGFuZCBkZWVwIHdhaWxpbmdzIHdlcmUgcmVzb3VuZGluZyB0aG91Z2ggdGhlIHN0YXJsZXNzIGFpcjsgd2hlcmVmb3JlIGF0IGZpcnN0IEkgd2VwdCB0aGVyZWF0LiBTdHJhbmdlIHRvbmd1ZXMsIGhvcnJpYmxlIGNyaWVzLCB3b3JkcyBvZiB3b2UsIGFjY2VudHMgb2YgYW5nZXIsIHZvaWNlcyBoaWdoIGFuZCBob2Fyc2UsIGFuZCBzb3VuZHMgb2YgaGFuZHMgd2l0aCB0aGVtLCB3ZXJlIG1ha2luZyBhIHR1bXVsdCB3aGljaCB3aGlybHMgZm9yZXZlciBpbiB0aGF0IGFpciBkYXJrIHdpdGhvdXQgY2hhbmdlLCBsaWtlIHRoZSBzYW5kIHdoZW4gdGhlIHdoaXJsd2luZCBicmVhdGhlcy48L3A+PHA+QW5kIEksIHdobyBoYWQgbXkgaGVhZCBnaXJ0IHdpdGggaG9ycm9yLCBzYWlkLCAmbGRxdW87TWFzdGVyLCB3aGF0IGlzIGl0IHRoYXQgSSBoZWFyPyBhbmQgd2hhdCBmb2xrIGFyZSB0aGV5IHdobyBzZWVtIGluIHdvZSBzbyB2YW5xdWlzaGVkPyZyZHF1bzs8L3A+PHA+QW5kIGhlIHRvIG1lLCAmbGRxdW87VGhpcyBtaXNlcmFibGUgbWVhc3VyZSB0aGUgd3JldGNoZWQgc291bHMgbWFpbnRhaW4gb2YgdGhvc2Ugd2hvIGxpdmVkIHdpdGhvdXQgaW5mYW15IGFuZCB3aXRob3V0IHByYWlzZS4gTWluZ2xlZCBhcmUgdGhleSB3aXRoIHRoYXQgY2FpdGlmZiBjaG9pciBvZiB0aGUgYW5nZWxzLCB3aG8gd2VyZSBub3QgcmViZWxzLCBub3Igd2VyZSBmYWl0aGZ1bCB0byBHb2QsIGJ1dCB3ZXJlIGZvciB0aGVtc2VsdmVzLiBUaGUgaGVhdmVucyBjaGFzZWQgdGhlbSBvdXQgaW4gb3JkZXIgdG8gYmUgbm90IGxlc3MgYmVhdXRpZnVsLCBub3IgZG90aCB0aGUgZGVwdGggb2YgSGVsbCByZWNlaXZlIHRoZW0sIGJlY2F1c2UgdGhlIGRhbW5lZCB3b3VsZCBoYXZlIHNvbWUgZ2xvcnkgZnJvbSB0aGVtLiZyZHF1bzs8L3A+PHA+QW5kIEksICZsZHF1bztNYXN0ZXIsIHdoYXQgaXMgc28gZ3JpZXZvdXMgdG8gdGhlbSwgdGhhdCBtYWtlcyB0aGVtIGxhbWVudCBzbyBiaXR0ZXJseT8mcmRxdW87PC9wPjxwPkhlIGFuc3dlcmVkLCAmbGRxdW87SSB3aWxsIHRlbGwgdGhlZSB2ZXJ5IGJyaWVmbHkuIFRoZXNlIGhhdmUgbm8gaG9wZSBvZiBkZWF0aDsgYW5kIHRoZWlyIGJsaW5kIGxpZmUgaXMgc28gZGViYXNlZCwgdGhhdCB0aGV5IGFyZSBlbnZpb3VzIG9mIGV2ZXJ5IG90aGVyIGxvdC4gRmFtZSBvZiB0aGVtIHRoZSB3b3JsZCBwZXJtaXR0ZXRoIG5vdCB0byBiZTsgbWVyY3kgYW5kIGp1c3RpY2UgZGlzZGFpbiB0aGVtLiBMZXQgdXMgbm90IHNwZWFrIG9mIHRoZW0sIGJ1dCBkbyB0aG91IGxvb2sgYW5kIHBhc3Mgb24uJnJkcXVvOzwvcD48cD5BbmQgSSwgd2hvIHdhcyBnYXppbmcsIHNhdyBhIGJhbm5lciwgdGhhdCB3aGlybGluZyByYW4gc28gc3dpZnRseSB0aGF0IGl0IHNlZW1lZCB0byBtZSB0byBzY29ybiBhbGwgcmVwb3NlLCBhbmQgYmVoaW5kIGl0IGNhbWUgc28gbG9uZyBhIHRyYWluIG9mIGZvbGssIHRoYXQgSSBjb3VsZCBuZXZlciBoYXZlIGJlbGlldmVkIGRlYXRoIGhhZCB1bmRvbmUgc28gbWFueS4gQWZ0ZXIgSSBoYWQgZGlzdGluZ3Vpc2hlZCBzb21lIGFtb25nIHRoZW0sIEkgc2F3IGFuZCBrbmV3IHRoZSBzaGFkZSBvZiBoaW0gd2hvIG1hZGUsIHRocm91Z2ggY293YXJkaWNlLCB0aGUgZ3JlYXQgcmVmdXNhbC4gPHNwYW4gY2xhc3M9XCJub3RlXCI+PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4xPC9zcGFuPjxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5XaG8gaXMgaW50ZW5kZWQgYnkgdGhlc2Ugd29yZHMgaXMgdW5jZXJ0YWluLjwvc3Bhbj48L3NwYW4+IEF0IG9uY2UgSSB1bmRlcnN0b29kIGFuZCB3YXMgY2VydGFpbiwgdGhhdCB0aGlzIHdhcyB0aGUgc2VjdCBvZiB0aGUgY2FpdGlmZnMgZGlzcGxlYXNpbmcgdW50byBHb2QsIGFuZCB1bnRvIGhpcyBlbmVtaWVzLiBUaGVzZSB3cmV0Y2hlcywgd2hvIG5ldmVyIHdlcmUgYWxpdmUsIHdlcmUgbmFrZWQsIGFuZCBtdWNoIHN0dW5nIGJ5IGdhZC1mbGllcyBhbmQgYnkgd2FzcHMgdGhhdCB3ZXJlIHRoZXJlLiBUaGVzZSBzdHJlYWtlZCB0aGVpciBmYWNlcyB3aXRoIGJsb29kLCB3aGljaCwgbWluZ2xlZCB3aXRoIHRlYXJzLCB3YXMgaGFydmVzdGVkIGF0IHRoZWlyIGZlZXQgYnkgbG9hdGhzb21lIHdvcm1zLjwvcD48cD5BbmQgd2hlbiBJIGdhdmUgbXlzZWxmIHRvIGxvb2tpbmcgb253YXJkLCBJIHNhdyBwZW9wbGUgb24gdGhlIGJhbmsgb2YgYSBncmVhdCByaXZlcjsgd2hlcmVmb3JlIEkgc2FpZCwgJmxkcXVvO01hc3Rlciwgbm93IGdyYW50IHRvIG1lIHRoYXQgSSBtYXkga25vdyB3aG8gdGhlc2UgYXJlLCBhbmQgd2hhdCBydWxlIG1ha2VzIHRoZW0gYXBwZWFyIHNvIHJlYWR5IHRvIHBhc3Mgb3ZlciwgYXMgSSBkaXNjZXJuIHRocm91Z2ggdGhlIGZhaW50IGxpZ2h0LiZyZHF1bzsgQW5kIGhlIHRvIG1lLCAmbGRxdW87VGhlIHRoaW5ncyB3aWxsIGJlIGNsZWFyIHRvIHRoZWUsIHdoZW4gd2Ugc2hhbGwgc2V0IG91ciBzdGVwcyBvbiB0aGUgc2FkIG1hcmdlIG9mIEFjaGVyb24uJnJkcXVvOyBUaGVuIHdpdGggZXllcyBiYXNoZnVsIGFuZCBjYXN0IGRvd24sIGZlYXJpbmcgbGVzdCBteSBzcGVlY2ggaGFkIGJlZW4gaXJrc29tZSB0byBoaW0sIGZhciBhcyB0byB0aGUgcml2ZXIgSSByZWZyYWluZWQgZnJvbSBzcGVha2luZy48L3A+PHA+QW5kIGxvISBjb21pbmcgdG93YXJkIHVzIGluIGEgYm9hdCwgYW4gb2xkIG1hbiwgd2hpdGUgd2l0aCBhbmNpZW50IGhhaXIsIGNyeWluZywgJmxkcXVvO1dvZSB0byB5b3UsIHdpY2tlZCBzb3VscyEgaG9wZSBub3QgZXZlciB0byBzZWUgSGVhdmVuISBJIGNvbWUgdG8gY2FycnkgeW91IHRvIHRoZSBvdGhlciBiYW5rLCBpbnRvIGV0ZXJuYWwgZGFya25lc3MsIHRvIGhlYXQgYW5kIGZyb3N0LiBBbmQgdGhvdSB3aG8gYXJ0IHRoZXJlLCBsaXZpbmcgc291bCwgZGVwYXJ0IGZyb20gdGhlc2UgdGhhdCBhcmUgZGVhZC4mcmRxdW87IEJ1dCB3aGVuIGhlIHNhdyB0aGF0IEkgZGlkIG5vdCBkZXBhcnQsIGhlIHNhaWQsICZsZHF1bztCeSBhbm90aGVyIHdheSwgYnkgb3RoZXIgcG9ydHMgdGhvdSBzaGFsdCBjb21lIHRvIHRoZSBzaG9yZSwgbm90IGhlcmUsIGZvciBwYXNzYWdlOyBpdCBiZWhvdmVzIHRoYXQgYSBsaWdodGVyIGJhcmsgYmVhciB0aGVlLiZyZHF1bzs8c3BhbiBjbGFzcz1cIm5vdGVcIj48c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZSBib2F0IHRoYXQgYmVhcnMgdGhlIHNvdWxzIHRvIFB1cmdhdG9yeS4gQ2hhcm9uIHJlY29nbml6ZXMgdGhhdCBEYW50ZSBpcyBub3QgYW1vbmcgdGhlIGRhbW5lZC48L3NwYW4+PC9zcGFuPjwvcD48cD5BbmQgbXkgTGVhZGVyIHRvIGhpbSwgJmxkcXVvO0NoYXJvbiwgdmV4IG5vdCB0aHlzZWxmLCBpdCBpcyB0aHVzIHdpbGxlZCB0aGVyZSB3aGVyZSBpcyBwb3dlciB0byBkbyB0aGF0IHdoaWNoIGlzIHdpbGxlZDsgYW5kIGZhcnRoZXIgYXNrIG5vdC4mcmRxdW87IFRoZW4gdGhlIGZsZWVjeSBjaGVla3Mgd2VyZSBxdWlldCBvZiB0aGUgcGlsb3Qgb2YgdGhlIGxpdmlkIG1hcnNoLCB3aG8gcm91bmQgYWJvdXQgaGlzIGV5ZXMgaGFkIHdoZWVscyBvZiBmbGFtZS48L3A+PHA+QnV0IHRob3NlIHNvdWxzLCB3aG8gd2VyZSB3ZWFyeSBhbmQgbmFrZWQsIGNoYW5nZWQgY29sb3IsIGFuZCBnbmFzaGVkIHRoZWlyIHRlZXRoIHNvb24gYXMgdGhleSBoZWFyZCBoaXMgY3J1ZWwgd29yZHMuIFRoZXkgYmxhc3BoZW1lZCBHb2QgYW5kIHRoZWlyIHBhcmVudHMsIHRoZSBodW1hbiByYWNlLCB0aGUgcGxhY2UsIHRoZSB0aW1lIGFuZCB0aGUgc2VlZCBvZiB0aGVpciBzb3dpbmcgYW5kIG9mIHRoZWlyIGJpcnRoLiBUaGVuLCBiaXR0ZXJseSB3ZWVwaW5nLCB0aGV5IGRyZXcgYmFjayBhbGwgb2YgdGhlbSB0b2dldGhlciB0byB0aGUgZXZpbCBiYW5rLCB0aGF0IHdhaXRzIGZvciBldmVyeSBtYW4gd2hvIGZlYXJzIG5vdCBHb2QuIENoYXJvbiB0aGUgZGVtb24sIHdpdGggZXllcyBvZiBnbG93aW5nIGNvYWwsIGJlY2tvbmluZyB0aGVtLCBjb2xsZWN0cyB0aGVtIGFsbDsgaGUgYmVhdHMgd2l0aCBoaXMgb2FyIHdob2V2ZXIgbGluZ2Vycy48L3A+PHA+QXMgaW4gYXV0dW1uIHRoZSBsZWF2ZXMgZmFsbCBvZmYgb25lIGFmdGVyIHRoZSBvdGhlciwgdGlsbCB0aGUgYm91Z2ggc2VlcyBhbGwgaXRzIHNwb2lscyB1cG9uIHRoZSBlYXJ0aCwgaW4gbGlrZSB3aXNlIHRoZSBldmlsIHNlZWQgb2YgQWRhbSB0aHJvdyB0aGVtc2VsdmVzIGZyb20gdGhhdCBzaG9yZSBvbmUgYnkgb25lIGF0IHNpZ25hbHMsIGFzIHRoZSBiaXJkIGF0IGhpcyBjYWxsLiBUaHVzIHRoZXkgZ28gb3ZlciB0aGUgZHVza3kgd2F2ZSwgYW5kIGJlZm9yZSB0aGV5IGhhdmUgbGFuZGVkIG9uIHRoZSBmYXJ0aGVyIHNpZGUsIGFscmVhZHkgb24gdGhpcyBhIG5ldyB0aHJvbmcgaXMgZ2F0aGVyZWQuPC9wPjxwPiZsZHF1bztNeSBzb24sJnJkcXVvOyBzYWlkIHRoZSBjb3VydGVvdXMgTWFzdGVyLCAmbGRxdW87dGhvc2Ugd2hvIGRpZSBpbiB0aGUgd3JhdGggb2YgR29kLCBhbGwgbWVldCB0b2dldGhlciBoZXJlIGZyb20gZXZlcnkgbGFuZC4gQW5kIHRoZXkgYXJlIGVhZ2VyIHRvIHBhc3Mgb3ZlciB0aGUgc3RyZWFtLCBmb3IgdGhlIGRpdmluZSBqdXN0aWNlIHNwdXJzIHRoZW0sIHNvIHRoYXQgZmVhciBpcyB0dXJuZWQgdG8gZGVzaXJlLiBUaGlzIHdheSBhIGdvb2Qgc291bCBuZXZlciBwYXNzZXM7IGFuZCB0aGVyZWZvcmUgaWYgQ2hhcm9uIHNuYXJsZXRoIGF0IHRoZWUsIHRob3Ugbm93IG1heWVzdCB3ZWxsIGtub3cgd2hhdCBoaXMgc3BlZWNoIHNpZ25pZmllcy4mcmRxdW87IFRoaXMgZW5kZWQsIHRoZSBkYXJrIHBsYWluIHRyZW1ibGVkIHNvIG1pZ2h0aWx5LCB0aGF0IHRoZSBtZW1vcnkgb2YgdGhlIHRlcnJvciBldmVuIG5vdyBiYXRoZXMgbWUgd2l0aCBzd2VhdC4gVGhlIHRlYXJmdWwgbGFuZCBnYXZlIGZvcnRoIGEgd2luZCB0aGF0IGZsYXNoZWQgYSB2ZXJtaWxpb24gbGlnaHQgd2hpY2ggdmFucXVpc2hlZCBldmVyeSBzZW5zZSBvZiBtaW5lLCBhbmQgSSBmZWxsIGFzIGEgbWFuIHdob20gc2x1bWJlciBzZWl6ZXMuPC9wPiddO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vcnRvbjtcbiIsIi8vIHdyaWdodC5qc1xuXG52YXIgd3JpZ2h0ID0gWyc8cCBjbGFzcz1cInRpdGxlXCI+SW5mZXJubzwvcD48cCBjbGFzcz1cImF1dGhvclwiPlMuIEZvd2xlciBXcmlnaHQ8L3A+JyxcblxuXHQnPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DYW50byBJPC9wPjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5PTkUgbmlnaHQsIHdoZW4gaGFsZiBteSBsaWZlIGJlaGluZCBtZSBsYXksPC9wPjxwPkkgd2FuZGVyZWQgZnJvbSB0aGUgc3RyYWlnaHQgbG9zdCBwYXRoIGFmYXIuPC9wPjxwPlRocm91Z2ggdGhlIGdyZWF0IGRhcmsgd2FzIG5vIHJlbGVhc2luZyB3YXk7PC9wPjxwPkFib3ZlIHRoYXQgZGFyayB3YXMgbm8gcmVsaWV2aW5nIHN0YXIuPC9wPjxwPklmIHlldCB0aGF0IHRlcnJvcmVkIG5pZ2h0IEkgdGhpbmsgb3Igc2F5LDwvcD48cD5BcyBkZWF0aCZyc3F1bztzIGNvbGQgaGFuZHMgaXRzIGZlYXJzIHJlc3VtaW5nIGFyZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkdsYWRseSB0aGUgZHJlYWRzIEkgZmVsdCwgdG9vIGRpcmUgdG8gdGVsbCw8L3A+PHA+VGhlIGhvcGVsZXNzLCBwYXRobGVzcywgbGlnaHRsZXNzIGhvdXJzIGZvcmdvdCw8L3A+PHA+SSB0dXJuIG15IHRhbGUgdG8gdGhhdCB3aGljaCBuZXh0IGJlZmVsbCw8L3A+PHA+V2hlbiB0aGUgZGF3biBvcGVuZWQsIGFuZCB0aGUgbmlnaHQgd2FzIG5vdC48L3A+PHA+VGhlIGhvbGxvd2VkIGJsYWNrbmVzcyBvZiB0aGF0IHdhc3RlLCBHb2Qgd290LDwvcD48cD5TaHJhbmssIHRoaW5uZWQsIGFuZCBjZWFzZWQuIEEgYmxpbmRpbmcgc3BsZW5kb3VyIGhvdDwvcD48cD5GbHVzaGVkIHRoZSBncmVhdCBoZWlnaHQgdG93YXJkIHdoaWNoIG15IGZvb3RzdGVwcyBmZWxsLDwvcD48cD5BbmQgdGhvdWdoIGl0IGtpbmRsZWQgZnJvbSB0aGUgbmV0aGVyIGhlbGwsPC9wPjxwPk9yIGZyb20gdGhlIFN0YXIgdGhhdCBhbGwgbWVuIGxlYWRzLCBhbGlrZTwvcD48cD5JdCBzaG93ZWQgbWUgd2hlcmUgdGhlIGdyZWF0IGRhd24tZ2xvcmllcyBzdHJpa2U8L3A+PHA+VGhlIHdpZGUgZWFzdCwgYW5kIHRoZSB1dG1vc3QgcGVha3Mgb2Ygc25vdy48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkhvdyBmaXJzdCBJIGVudGVyZWQgb24gdGhhdCBwYXRoIGFzdHJheSw8L3A+PHA+QmVzZXQgd2l0aCBzbGVlcCwgSSBrbm93IG5vdC4gVGhpcyBJIGtub3cuPC9wPjxwPldoZW4gZ2FpbmVkIG15IGZlZXQgdGhlIHVwd2FyZCwgbGlnaHRlZCB3YXksPC9wPjxwPkkgYmFja3dhcmQgZ2F6ZWQsIGFzIG9uZSB0aGUgZHJvd25pbmcgc2VhLDwvcD48cD5UaGUgZGVlcCBzdHJvbmcgdGlkZXMsIGhhcyBiYWZmbGVkLCBhbmQgcGFudGluZyBsaWVzLDwvcD48cD5PbiB0aGUgc2hlbHZlZCBzaG9yZSwgYW5kIHR1cm5zIGhpcyBleWVzIHRvIHNlZTwvcD48cD5UaGUgbGVhZ3VlLXdpZGUgd2FzdGVzIHRoYXQgaGVsZCBoaW0uIFNvIG1pbmUgZXllczwvcD48cD5TdXJ2ZXllZCB0aGF0IGZlYXIsIHRoZSB3aGlsZSBteSB3ZWFyaWVkIGZyYW1lPC9wPjxwPlJlc3RlZCwgYW5kIGV2ZXIgbXkgaGVhcnQmcnNxdW87cyB0b3NzZWQgbGFrZSBiZWNhbWU8L3A+PHA+TW9yZSBxdWlldC48L3A+PHA+VGhlbiBmcm9tIHRoYXQgcGFzcyByZWxlYXNlZCwgd2hpY2ggeWV0PC9wPjxwPldpdGggbGl2aW5nIGZlZXQgaGFkIG5vIG1hbiBsZWZ0LCBJIHNldDwvcD48cD5NeSBmb3J3YXJkIHN0ZXBzIGFzbGFudCB0aGUgc3RlZXAsIHRoYXQgc28sPC9wPjxwPk15IHJpZ2h0IGZvb3Qgc3RpbGwgdGhlIGxvd2VyLCBJIGNsaW1iZWQuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ4ZW1cIj5CZWxvdzwvcD48cD5ObyBtb3JlIEkgZ2F6ZWQuIEFyb3VuZCwgYSBzbG9wZSBvZiBzYW5kPC9wPjxwPldhcyBzdGVyaWxlIG9mIGFsbCBncm93dGggb24gZWl0aGVyIGhhbmQsPC9wPjxwPk9yIG1vdmluZyBsaWZlLCBhIHNwb3R0ZWQgcGFyZCBleGNlcHQsPC9wPjxwPlRoYXQgeWF3bmluZyByb3NlLCBhbmQgc3RyZXRjaGVkLCBhbmQgcHVycmVkIGFuZCBsZWFwdDwvcD48cD5TbyBjbG9zZWx5IHJvdW5kIG15IGZlZXQsIHRoYXQgc2NhcmNlIEkga2VwdDwvcD48cD5UaGUgY291cnNlIEkgd291bGQuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ0ZW1cIj5UaGF0IHNsZWVrIGFuZCBsb3ZlbHkgdGhpbmcsPC9wPjxwPlRoZSBicm9hZGVuaW5nIGxpZ2h0LCB0aGUgYnJlYXRoIG9mIG1vcm4gYW5kIHNwcmluZyw8L3A+PHA+VGhlIHN1biwgdGhhdCB3aXRoIGhpcyBzdGFycyBpbiBBcmllcyBsYXksPC9wPjxwPkFzIHdoZW4gRGl2aW5lIExvdmUgb24gQ3JlYXRpb24mcnNxdW87cyBkYXk8L3A+PHA+Rmlyc3QgZ2F2ZSB0aGVzZSBmYWlyIHRoaW5ncyBtb3Rpb24sIGFsbCBhdCBvbmU8L3A+PHA+TWFkZSBsaWdodHNvbWUgaG9wZTsgYnV0IGxpZ2h0c29tZSBob3BlIHdhcyBub25lPC9wPjxwPldoZW4gZG93biB0aGUgc2xvcGUgdGhlcmUgY2FtZSB3aXRoIGxpZnRlZCBoZWFkPC9wPjxwPkFuZCBiYWNrLWJsb3duIG1hbmUgYW5kIGNhdmVybmVkIG1vdXRoIGFuZCByZWQsPC9wPjxwPkEgbGlvbiwgcm9hcmluZywgYWxsIHRoZSBhaXIgYXNoYWtlPC9wPjxwPlRoYXQgaGVhcmQgaGlzIGh1bmdlci4gVXB3YXJkIGZsaWdodCB0byB0YWtlPC9wPjxwPk5vIGhlYXJ0IHdhcyBtaW5lLCBmb3Igd2hlcmUgdGhlIGZ1cnRoZXIgd2F5PC9wPjxwPk1pbmUgYW54aW91cyBleWVzIGV4cGxvcmVkLCBhIHNoZS13b2xmIGxheSw8L3A+PHA+VGhhdCBsaWNrZWQgbGVhbiBmbGFua3MsIGFuZCB3YWl0ZWQuIFN1Y2ggd2FzIHNoZTwvcD48cD5JbiBhc3BlY3QgcnV0aGxlc3MgdGhhdCBJIHF1YWtlZCB0byBzZWUsPC9wPjxwPkFuZCB3aGVyZSBzaGUgbGF5IGFtb25nIGhlciBib25lcyBoYWQgYnJvdWdodDwvcD48cD5TbyBtYW55IHRvIGdyaWVmIGJlZm9yZSwgdGhhdCBhbGwgbXkgdGhvdWdodDwvcD48cD5BZ2hhc3QgdHVybmVkIGJhY2t3YXJkIHRvIHRoZSBzdW5sZXNzIG5pZ2h0PC9wPjxwPkkgbGVmdC4gQnV0IHdoaWxlIEkgcGx1bmdlZCBpbiBoZWFkbG9uZyBmbGlnaHQ8L3A+PHA+VG8gdGhhdCBtb3N0IGZlYXJlZCBiZWZvcmUsIGEgc2hhZGUsIG9yIG1hbjwvcD48cD4oRWl0aGVyIGhlIHNlZW1lZCksIG9ic3RydWN0aW5nIHdoZXJlIEkgcmFuLDwvcD48cD5DYWxsZWQgdG8gbWUgd2l0aCBhIHZvaWNlIHRoYXQgZmV3IHNob3VsZCBrbm93LDwvcD48cD5GYWludCBmcm9tIGZvcmdldGZ1bCBzaWxlbmNlLCAmbGRxdW87V2hlcmUgeWUgZ28sPC9wPjxwPlRha2UgaGVlZC4gV2h5IHR1cm4geWUgZnJvbSB0aGUgdXB3YXJkIHdheT8mcmRxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5JIGNyaWVkLCAmbGRxdW87T3IgY29tZSB5ZSBmcm9tIHdhcm0gZWFydGgsIG9yIHRoZXk8L3A+PHA+VGhlIGdyYXZlIGhhdGggdGFrZW4sIGluIG15IG1vcnRhbCBuZWVkPC9wPjxwPkhhdmUgbWVyY3kgdGhvdSEmcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ0ZW1cIj5IZSBhbnN3ZXJlZCwgJmxkcXVvO1NoYWRlIGFtIEksPC9wPjxwPlRoYXQgb25jZSB3YXMgbWFuOyBiZW5lYXRoIHRoZSBMb21iYXJkIHNreSw8L3A+PHA+SW4gdGhlIGxhdGUgeWVhcnMgb2YgSnVsaXVzIGJvcm4sIGFuZCBicmVkPC9wPjxwPkluIE1hbnR1YSwgdGlsbCBteSB5b3V0aGZ1bCBzdGVwcyB3ZXJlIGxlZDwvcD48cD5UbyBSb21lLCB3aGVyZSB5ZXQgdGhlIGZhbHNlIGdvZHMgbGllZCB0byBtYW47PC9wPjxwPkFuZCB3aGVuIHRoZSBncmVhdCBBdWd1c3RhbiBhZ2UgYmVnYW4sPC9wPjxwPkkgd3JvdGUgdGhlIHRhbGUgb2YgSWxpdW0gYnVybnQsIGFuZCBob3c8L3A+PHA+QW5jaGlzZXMmcnNxdW87IHNvbiBmb3J0aC1wdXNoZWQgYSB2ZW50dXJvdXMgcHJvdyw8L3A+PHA+U2Vla2luZyB1bmtub3duIHNlYXMuIEJ1dCBpbiB3aGF0IG1vb2QgYXJ0IHRob3U8L3A+PHA+VG8gdGh1cyByZXR1cm4gdG8gYWxsIHRoZSBpbGxzIHllIGZsZWQsPC9wPjxwPlRoZSB3aGlsZSB0aGUgbW91bnRhaW4gb2YgdGh5IGhvcGUgYWhlYWQ8L3A+PHA+TGlmdHMgaW50byBsaWdodCwgdGhlIHNvdXJjZSBhbmQgY2F1c2Ugb2YgYWxsPC9wPjxwPkRlbGVjdGFibGUgdGhpbmdzIHRoYXQgbWF5IHRvIG1hbiBiZWZhbGw/JnJkcXVvOzwvcD48L2Rpdj48ZGl2IGNsYXNzPVwic3RhbnphXCI+PHA+SSBhbnN3ZXJlZCwgJmxkcXVvO0FydCB0aG91IHRoZW4gdGhhdCBWaXJnaWwsIGhlPC9wPjxwPkZyb20gd2hvbSBhbGwgZ3JhY2Ugb2YgbWVhc3VyZWQgc3BlZWNoIGluIG1lPC9wPjxwPkRlcml2ZWQ/IE8gZ2xvcmlvdXMgYW5kIGZhci1ndWlkaW5nIHN0YXIhPC9wPjxwPk5vdyBtYXkgdGhlIGxvdmUtbGVkIHN0dWRpb3VzIGhvdXJzIGFuZCBsb25nPC9wPjxwPkluIHdoaWNoIEkgbGVhcm50IGhvdyByaWNoIHRoeSB3b25kZXJzIGFyZSw8L3A+PHA+TWFzdGVyIGFuZCBBdXRob3IgbWluZSBvZiBMaWdodCBhbmQgU29uZyw8L3A+PHA+QmVmcmllbmQgbWUgbm93LCB3aG8ga25ldyB0aHkgdm9pY2UsIHRoYXQgZmV3PC9wPjxwPllldCBoZWFya2VuLiBBbGwgdGhlIG5hbWUgbXkgd29yayBoYXRoIHdvbjwvcD48cD5JcyB0aGluZSBvZiByaWdodCwgZnJvbSB3aG9tIEkgbGVhcm5lZC4gVG8gdGhlZSw8L3A+PHA+QWJhc2hlZCwgSSBncmFudCBpdC4gLiAuIFdoeSB0aGUgbW91bnRpbmcgc3VuPC9wPjxwPk5vIG1vcmUgSSBzZWVrLCB5ZSBzY2FyY2Ugc2hvdWxkIGFzaywgd2hvIHNlZTwvcD48cD5UaGUgYmVhc3QgdGhhdCB0dXJuZWQgbWUsIG5vciBmYWludCBob3BlIGhhdmUgSTwvcD48cD5UbyBmb3JjZSB0aGF0IHBhc3NhZ2UgaWYgdGhpbmUgYWlkIGRlbnkuJmxkcXVvOzwvcD48cD5IZSBhbnN3ZXJlZCwgJmxkcXVvO1dvdWxkIHllIGxlYXZlIHRoaXMgd2lsZCBhbmQgbGl2ZSw8L3A+PHA+U3RyYW5nZSByb2FkIGlzIG91cnMsIGZvciB3aGVyZSB0aGUgc2hlLXdvbGYgbGllczwvcD48cD5TaGFsbCBubyBtYW4gcGFzcywgZXhjZXB0IHRoZSBwYXRoIGhlIHRyaWVzPC9wPjxwPkhlciBjcmFmdCBlbnRhbmdsZS4gTm8gd2F5IGZ1Z2l0aXZlPC9wPjxwPkF2b2lkcyB0aGUgc2Vla2luZyBvZiBoZXIgZ3JlZWRzLCB0aGF0IGdpdmU8L3A+PHA+SW5zYXRpYXRlIGh1bmdlciwgYW5kIHN1Y2ggdmljZSBwZXJ2ZXJzZTwvcD48cD5BcyBtYWtlcyBoZXIgbGVhbmVyIHdoaWxlIHNoZSBmZWVkcywgYW5kIHdvcnNlPC9wPjxwPkhlciBjcmF2aW5nLiBBbmQgdGhlIGJlYXN0cyB3aXRoIHdoaWNoIHNoZSBicmVlZDwvcD48cD5UaGUgbm9pc29tZSBudW1lcm91cyBiZWFzdHMgaGVyIGx1c3RzIHJlcXVpcmUsPC9wPjxwPkJhcmUgYWxsIHRoZSBkZXNpcmFibGUgbGFuZHMgaW4gd2hpY2ggc2hlIGZlZWRzOzwvcD48cD5Ob3Igc2hhbGwgbGV3ZCBmZWFzdHMgYW5kIGxld2RlciBtYXRpbmdzIHRpcmU8L3A+PHA+VW50aWwgc2hlIHdvb3MsIGluIGV2aWwgaG91ciBmb3IgaGVyLDwvcD48cD5UaGUgd29sZmhvdW5kIHRoYXQgc2hhbGwgcmVuZCBoZXIuIEhpcyBkZXNpcmU8L3A+PHA+SXMgbm90IGZvciByYXBpbmUsIGFzIHRoZSBwcm9tcHRpbmdzIHN0aXI8L3A+PHA+T2YgaGVyIGJhc2UgaGVhcnQ7IGJ1dCB3aXNkb21zLCBhbmQgZGV2b2lyczwvcD48cD5PZiBtYW5ob29kLCBhbmQgbG92ZSZyc3F1bztzIHJ1bGUsIGhpcyB0aG91Z2h0cyBwcmVmZXIuPC9wPjxwPlRoZSBJdGFsaWFuIGxvd2xhbmRzIGhlIHNoYWxsIHJlYWNoIGFuZCBzYXZlLDwvcD48cD5Gb3Igd2hpY2ggQ2FtaWxsYSBvZiBvbGQsIHRoZSB2aXJnaW4gYnJhdmUsPC9wPjxwPlR1cm51cyBhbmQgTmlzdXMgZGllZCBpbiBzdHJpZmUuIEhpcyBjaGFzZTwvcD48cD5IZSBzaGFsbCBub3QgY2Vhc2UsIG5vciBhbnkgY293ZXJpbmctcGxhY2U8L3A+PHA+SGVyIGZlYXIgc2hhbGwgZmluZCBoZXIsIHRpbGwgaGUgZHJpdmUgaGVyIGJhY2ssPC9wPjxwPkZyb20gY2l0eSB0byBjaXR5IGV4aWxlZCwgZnJvbSB3cmFjayB0byB3cmFjazwvcD48cD5TbGFpbiBvdXQgb2YgbGlmZSwgdG8gZmluZCB0aGUgbmF0aXZlIGhlbGw8L3A+PHA+V2hlbmNlIGVudnkgbG9vc2VkIGhlci48L3A+PHAgY2xhc3M9XCJzbGluZGVudDZlbVwiPkZvciB0aHlzZWxmIHdlcmUgd2VsbDwvcD48cD5UbyBmb2xsb3cgd2hlcmUgSSBsZWFkLCBhbmQgdGhvdSBzaGFsdCBzZWU8L3A+PHA+VGhlIHNwaXJpdHMgaW4gcGFpbiwgYW5kIGhlYXIgdGhlIGhvcGVsZXNzIHdvZSw8L3A+PHA+VGhlIHVuZW5kaW5nIGNyaWVzLCBvZiB0aG9zZSB3aG9zZSBvbmx5IHBsZWE8L3A+PHA+SXMganVkZ21lbnQsIHRoYXQgdGhlIHNlY29uZCBkZWF0aCB0byBiZTwvcD48cD5GYWxsIHF1aWNrbHkuIEZ1cnRoZXIgc2hhbHQgdGhvdSBjbGltYiwgYW5kIGdvPC9wPjxwPlRvIHRob3NlIHdobyBidXJuLCBidXQgaW4gdGhlaXIgcGFpbiBjb250ZW50PC9wPjxwPldpdGggaG9wZSBvZiBwYXJkb247IHN0aWxsIGJleW9uZCwgbW9yZSBoaWdoLDwvcD48cD5Ib2xpZXIgdGhhbiBvcGVucyB0byBzdWNoIHNvdWxzIGFzIEksPC9wPjxwPlRoZSBIZWF2ZW5zIHVwcmVhcjsgYnV0IGlmIHRob3Ugd2lsdCwgaXMgb25lPC9wPjxwPldvcnRoaWVyLCBhbmQgc2hlIHNoYWxsIGd1aWRlIHRoZWUgdGhlcmUsIHdoZXJlIG5vbmU8L3A+PHA+V2hvIGRpZCB0aGUgTG9yZCBvZiB0aG9zZSBmYWlyIHJlYWxtcyBkZW55PC9wPjxwPk1heSBlbnRlci4gVGhlcmUgaW4gaGlzIGNpdHkgSGUgZHdlbGxzLCBhbmQgdGhlcmU8L3A+PHA+UnVsZXMgYW5kIHBlcnZhZGVzIGluIGV2ZXJ5IHBhcnQsIGFuZCBjYWxsczwvcD48cD5IaXMgY2hvc2VuIGV2ZXIgd2l0aGluIHRoZSBzYWNyZWQgd2FsbHMuPC9wPjxwPk8gaGFwcGllc3QsIHRoZXkhJnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50NGVtXCI+SSBhbnN3ZXJlZCwgJmxkcXVvO0J5IHRoYXQgR29kPC9wPjxwPlRob3UgZGlkc3Qgbm90IGtub3csIEkgZG8gdGhpbmUgYWlkIGVudHJlYXQsPC9wPjxwPkFuZCBndWlkYW5jZSwgdGhhdCBiZXlvbmQgdGhlIGlsbHMgSSBtZWV0PC9wPjxwPkkgc2FmZXR5IGZpbmQsIHdpdGhpbiB0aGUgU2FjcmVkIEdhdGU8L3A+PHA+VGhhdCBQZXRlciBndWFyZHMsIGFuZCB0aG9zZSBzYWQgc291bHMgdG8gc2VlPC9wPjxwPldobyBsb29rIHdpdGggbG9uZ2luZyBmb3IgdGhlaXIgZW5kIHRvIGJlLiZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPlRoZW4gaGUgbW92ZWQgZm9yd2FyZCwgYW5kIGJlaGluZCBJIHRyb2QuPC9wPjwvZGl2PicsXG5cblx0JzxkaXYgY2xhc3M9XCJjYW50b1wiPjxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q2FudG8gSUk8L3A+PC9wPjxwPjxkaXYgY2xhc3M9XCJzdGFuemFcIj5USEUgZGF5IHdhcyBmYWxsaW5nLCBhbmQgdGhlIGRhcmtlbmluZyBhaXI8L3A+PHA+UmVsZWFzZWQgZWFydGgmcnNxdW87cyBjcmVhdHVyZXMgZnJvbSB0aGVpciB0b2lscywgd2hpbGUgSSw8L3A+PHA+SSBvbmx5LCBmYWNlZCB0aGUgYml0dGVyIHJvYWQgYW5kIGJhcmU8L3A+PHA+TXkgTWFzdGVyIGxlZC4gSSBvbmx5LCBtdXN0IGRlZnk8L3A+PHA+VGhlIHBvd2VycyBvZiBwaXR5LCBhbmQgdGhlIG5pZ2h0IHRvIGJlLjwvcD48cD5TbyB0aG91Z2h0IEksIGJ1dCB0aGUgdGhpbmdzIEkgY2FtZSB0byBzZWUsPC9wPjxwPldoaWNoIG1lbW9yeSBob2xkcywgY291bGQgbmV2ZXIgdGhvdWdodCBmb3JlY2FzdC48L3A+PHA+TyBNdXNlcyBoaWdoISBPIEdlbml1cywgZmlyc3QgYW5kIGxhc3QhPC9wPjxwPk1lbW9yaWVzIGludGVuc2UhIFlvdXIgdXRtb3N0IHBvd2VycyBjb21iaW5lPC9wPjxwPlRvIG1lZXQgdGhpcyBuZWVkLiBGb3IgbmV2ZXIgdGhlbWUgYXMgbWluZTwvcD48cD5TdHJhaW5lZCB2YWlubHksIHdoZXJlIHlvdXIgbG9mdGllc3Qgbm9ibGVuZXNzPC9wPjxwPk11c3QgZmFpbCB0byBiZSBzdWZmaWNpZW50LjwvcD48cCBjbGFzcz1cInNsaW5kZW50MTBlbVwiPkZpcnN0IEkgc2FpZCw8L3A+PHA+RmVhcmluZywgdG8gaGltIHdobyB0aHJvdWdoIHRoZSBkYXJrbmVzcyBsZWQsPC9wPjxwPiZsZHF1bztPIHBvZXQsIGVyZSB0aGUgYXJkdW91cyBwYXRoIHllIHByZXNzPC9wPjxwPlRvbyBmYXIsIGxvb2sgaW4gbWUsIGlmIHRoZSB3b3J0aCB0aGVyZSBiZTwvcD48cD5UbyBtYWtlIHRoaXMgdHJhbnNpdC4gJkFFbGlnO25lYXMgb25jZSwgSSBrbm93LDwvcD48cD5XZW50IGRvd24gaW4gbGlmZSwgYW5kIGNyb3NzZWQgdGhlIGluZmVybmFsIHNlYTs8L3A+PHA+QW5kIGlmIHRoZSBMb3JkIG9mIEFsbCBUaGluZ3MgTG9zdCBCZWxvdzwvcD48cD5BbGxvd2VkIGl0LCByZWFzb24gc2VlbXMsIHRvIHRob3NlIHdobyBzZWU8L3A+PHA+VGhlIGVuZHVyaW5nIGdyZWF0bmVzcyBvZiBoaXMgZGVzdGlueSw8L3A+PHA+V2hvIGluIHRoZSBFbXB5cmVhbiBIZWF2ZW4gZWxlY3Qgd2FzIGNhbGxlZDwvcD48cD5TaXJlIG9mIHRoZSBFdGVybmFsIENpdHksIHRoYXQgdGhyb25lZCBhbmQgd2FsbGVkPC9wPjxwPk1hZGUgRW1waXJlIG9mIHRoZSB3b3JsZCBiZXlvbmQsIHRvIGJlPC9wPjxwPlRoZSBIb2x5IFBsYWNlIGF0IGxhc3QsIGJ5IEdvZCZyc3F1bztzIGRlY3JlZSw8L3A+PHA+V2hlcmUgdGhlIGdyZWF0IFBldGVyJnJzcXVvO3MgZm9sbG93ZXIgcnVsZXMuIEZvciBoZTwvcD48cD5MZWFybmVkIHRoZXJlIHRoZSBjYXVzZXMgb2YgaGlzIHZpY3RvcnkuPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGRxdW87QW5kIGxhdGVyIHRvIHRoZSB0aGlyZCBncmVhdCBIZWF2ZW4gd2FzIGNhdWdodDwvcD48cD5UaGUgbGFzdCBBcG9zdGxlLCBhbmQgdGhlbmNlIHJldHVybmluZyBicm91Z2h0PC9wPjxwPlRoZSBwcm9vZnMgb2Ygb3VyIHNhbHZhdGlvbi4gQnV0LCBmb3IgbWUsPC9wPjxwPkkgYW0gbm90ICZBRWxpZztuZWFzLCBuYXksIG5vciBQYXVsLCB0byBzZWU8L3A+PHA+VW5zcGVha2FibGUgdGhpbmdzIHRoYXQgZGVwdGhzIG9yIGhlaWdodHMgY2FuIHNob3csPC9wPjxwPkFuZCBpZiB0aGlzIHJvYWQgZm9yIG5vIHN1cmUgZW5kIEkgZ288L3A+PHA+V2hhdCBmb2xseSBpcyBtaW5lPyBCdXQgYW55IHdvcmRzIGFyZSB3ZWFrLjwvcD48cD5UaHkgd2lzZG9tIGZ1cnRoZXIgdGhhbiB0aGUgdGhpbmdzIEkgc3BlYWs8L3A+PHA+Q2FuIHNlYXJjaCB0aGUgZXZlbnQgdGhhdCB3b3VsZCBiZS4mcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnQxMGVtXCI+SGVyZSBJIHN0YXllZDwvcD48cD5NeSBzdGVwcyBhbWlkIHRoZSBkYXJrbmVzcywgYW5kIHRoZSBTaGFkZTwvcD48cD5UaGF0IGxlZCBtZSBoZWFyZCBhbmQgdHVybmVkLCBtYWduYW5pbW91cyw8L3A+PHA+QW5kIHNhdyBtZSBkcmFpbmVkIG9mIHB1cnBvc2UgaGFsdGluZyB0aHVzLDwvcD48cD5BbmQgYW5zd2VyZWQsICZsZHF1bztJZiB0aHkgY293YXJkLWJvcm4gdGhvdWdodHMgYmUgY2xlYXIsPC9wPjxwPkFuZCBhbGwgdGh5IG9uY2UgaW50ZW50LCBpbmZpcm1lZCBvZiBmZWFyLDwvcD48cD5Ccm9rZW4sIHRoZW4gYXJ0IHRob3UgYXMgc2NhcmVkIGJlYXN0cyB0aGF0IHNoeTwvcD48cD5Gcm9tIHNoYWRvd3MsIHN1cmVseSB0aGF0IHRoZXkga25vdyBub3Qgd2h5PC9wPjxwPk5vciB3aGVyZWZvcmUuIC4gLiBIZWFya2VuLCB0byBjb25mb3VuZCB0aHkgZmVhciw8L3A+PHA+VGhlIHRoaW5ncyB3aGljaCBmaXJzdCBJIGhlYXJkLCBhbmQgYnJvdWdodCBtZSBoZXJlLjwvcD48cD5PbmUgY2FtZSB3aGVyZSwgaW4gdGhlIE91dGVyIFBsYWNlLCBJIGR3ZWxsLDwvcD48cD5TdXNwZW5zZSBmcm9tIGhvcGUgb2YgSGVhdmVuIG9yIGZlYXIgb2YgSGVsbCw8L3A+PHA+UmFkaWFudCBpbiBsaWdodCB0aGF0IG5hdGl2ZSByb3VuZCBoZXIgY2x1bmcsPC9wPjxwPkFuZCBjYXN0IGhlciBleWVzIG91ciBob3BlbGVzcyBTaGFkZXMgYW1vbmc8L3A+PHA+KEV5ZXMgd2l0aCBubyBlYXJ0aGx5IGxpa2UgYnV0IGhlYXZlbiZyc3F1bztzIG93biBibHVlKSw8L3A+PHA+QW5kIGNhbGxlZCBtZSB0byBoZXIgaW4gc3VjaCB2b2ljZSBhcyBmZXc8L3A+PHA+SW4gdGhhdCBncmltIHBsYWNlIGhhZCBoZWFyZCwgc28gbG93LCBzbyBjbGVhciw8L3A+PHA+U28gdG9uZWQgYW5kIGNhZGVuY2VkIGZyb20gdGhlIFV0bW9zdCBTcGhlcmUsPC9wPjxwPlRoZSBVbmF0dGFpbmFibGUgSGVhdmVuIGZyb20gd2hpY2ggc2hlIGNhbWUuPC9wPjxwPiZsc3F1bztPIE1hbnR1YW4gU3Bpcml0LCZyc3F1bzsgc2hlIHNhaWQsICZsc3F1bzt3aG9zZSBsYXN0aW5nIGZhbWU8L3A+PHA+Q29udGludWVzIG9uIHRoZSBlYXJ0aCB5ZSBsZWZ0LCBhbmQgc3RpbGw8L3A+PHA+V2l0aCBUaW1lIHNoYWxsIHN0YW5kLCBhbiBlYXJ0aGx5IGZyaWVuZCB0byBtZSw8L3A+PHA+LSBNeSBmcmllbmQsIG5vdCBmb3J0dW5lJnJzcXVvO3MmbmJzcDsmbmRhc2g7IGNsaW1icyBhIHBhdGggc28gaWxsPC9wPjxwPlRoYXQgYWxsIHRoZSBuaWdodC1icmVkIGZlYXJzIGhlIGhhc3RlcyB0byBmbGVlPC9wPjxwPldlcmUga2luZGx5IHRvIHRoZSB0aGluZyBoZSBuZWFycy4gVGhlIHRhbGU8L3A+PHA+TW92ZWQgdGhyb3VnaCB0aGUgcGVhY2Ugb2YgSSBsZWF2ZW4sIGFuZCBzd2lmdCBJIHNwZWQ8L3A+PHA+RG93bndhcmQsIHRvIGFpZCBteSBmcmllbmQgaW4gbG92ZSZyc3F1bztzIGF2YWlsLDwvcD48cD5XaXRoIHNjYW50eSB0aW1lIHRoZXJlZm9yLCB0aGF0IGhhbGYgSSBkcmVhZDwvcD48cD5Ub28gbGF0ZSBJIGNhbWUuIEJ1dCB0aG91IHNoYWx0IGhhc3RlLCBhbmQgZ288L3A+PHA+V2l0aCBnb2xkZW4gd2lzZG9tIG9mIHRoeSBzcGVlY2gsIHRoYXQgc288L3A+PHA+Rm9yIG1lIGJlIGNvbnNvbGF0aW9uLiBUaG91IHNoYWx0IHNheSw8L3A+PHA+JmxkcXVvO0kgY29tZSBmcm9tIEJlYXRyaWPDqy4mcmRxdW87IERvd253YXJkIGZhciw8L3A+PHA+RnJvbSBIZWF2ZW4gdG8gSSBsZWF2ZW4gSSBzYW5rLCBmcm9tIHN0YXIgdG8gc3Rhciw8L3A+PHA+VG8gZmluZCB0aGVlLCBhbmQgdG8gcG9pbnQgaGlzIHJlc2N1aW5nIHdheS48L3A+PHA+RmFpbiB3b3VsZCBJIHRvIG15IHBsYWNlIG9mIGxpZ2h0IHJldHVybjs8L3A+PHA+TG92ZSBtb3ZlZCBtZSBmcm9tIGl0LCBhbmQgZ2F2ZSBtZSBwb3dlciB0byBsZWFybjwvcD48cD5UaHkgc3BlZWNoLiBXaGVuIG5leHQgYmVmb3JlIG15IExvcmQgSSBzdGFuZDwvcD48cD5JIHZlcnkgb2Z0IHNoYWxsIHByYWlzZSB0aGVlLiZyc3F1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDEwZW1cIj5IZXJlIHNoZSBjZWFzZWQsPC9wPjxwPkFuZCBJIGdhdmUgYW5zd2VyIHRvIHRoYXQgZGVhciBjb21tYW5kLDwvcD48cD4mbHNxdW87TGFkeSwgYWxvbmUgdGhyb3VnaCB3aG9tIHRoZSB3aG9sZSByYWNlIG9mIHRob3NlPC9wPjxwPlRoZSBzbWFsbGVzdCBIZWF2ZW4gdGhlIG1vb24mcnNxdW87cyBzaG9ydCBvcmJpdHMgaG9sZDwvcD48cD5FeGNlbHMgaW4gaXRzIGNyZWF0aW9uLCBub3QgdGh5IGxlYXN0LDwvcD48cD5UaHkgbGlnaHRlc3Qgd2lzaCBpbiB0aGlzIGRhcmsgcmVhbG0gd2VyZSB0b2xkPC9wPjxwPlZhaW5seS4gQnV0IHNob3cgbWUgd2h5IHRoZSBIZWF2ZW5zIHVuY2xvc2U8L3A+PHA+VG8gbG9vc2UgdGhlZSBmcm9tIHRoZW0sIGFuZCB0aHlzZWxmIGNvbnRlbnQ8L3A+PHA+Q291bGRzdCB0aHVzIGNvbnRpbnVlIGluIHN1Y2ggc3RyYW5nZSBkZXNjZW50PC9wPjxwPkZyb20gdGhhdCBtb3N0IFNwYWNpb3VzIFBsYWNlIGZvciB3aGljaCB5ZSBidXJuLDwvcD48cD5BbmQgd2hpbGUgeWUgZnVydGhlciBsZWZ0LCB3b3VsZCBmYWluIHJldHVybi4mcnNxdW87PC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD4mbGRxdW87ICZsc3F1bztUaGF0IHdoaWNoIHRob3Ugd291bGRzdCwmcnNxdW87IHNoZSBzYWlkLCAmbHNxdW87SSBicmllZmx5IHRlbGwuPC9wPjxwPlRoZXJlIGlzIG5vIGZlYXIgbm9yIGFueSBodXJ0IGluIEhlbGwsPC9wPjxwPkV4Y2VwdCB0aGF0IGl0IGJlIHBvd2VyZnVsLiBHb2QgaW4gbWU8L3A+PHA+SXMgZ3JhY2lvdXMsIHRoYXQgdGhlIHBpdGVvdXMgc2lnaHRzIEkgc2VlPC9wPjxwPkkgc2hhcmUgbm90LCBub3IgbXlzZWxmIGNhbiBzaHJpbmsgdG8gZmVlbDwvcD48cD5UaGUgZmxhbWUgb2YgYWxsIHRoaXMgYnVybmluZy4gT25lIHRoZXJlIGlzPC9wPjxwPkluIGhlaWdodCBhbW9uZyB0aGUgSG9saWVzdCBwbGFjZWQsIGFuZCBzaGU8L3A+PHA+LSBNZXJjeSBoZXIgbmFtZSZuYnNwOyZuZGFzaDsgYW1vbmcgR29kJnJzcXVvO3MgbXlzdGVyaWVzPC9wPjxwPkR3ZWxscyBpbiB0aGUgbWlkc3QsIGFuZCBoYXRoIHRoZSBwb3dlciB0byBzZWU8L3A+PHA+SGlzIGp1ZGdtZW50cywgYW5kIHRvIGJyZWFrIHRoZW0uIFRoaXMgc2hhcnA8L3A+PHA+SSB0ZWxsIHRoZWUsIHdoZW4gc2hlIHNhdywgc2hlIGNhbGxlZCwgdGhhdCBzbzwvcD48cD5MZWFuZWQgTHVjaWEgdG93YXJkIGhlciB3aGlsZSBzaGUgc3Bha2UmbmJzcDsmbmRhc2g7IGFuZCBzYWlkLDwvcD48cD4mbGRxdW87T25lIHRoYXQgaXMgZmFpdGhmdWwgdG8gdGh5IG5hbWUgaXMgc3BlZCw8L3A+PHA+RXhjZXB0IHRoYXQgbm93IHllIGFpZCBoaW0uJnJkcXVvOyBTaGUgdGhlcmVhdCw8L3A+PHA+LSBMdWNpYSwgdG8gYWxsIG1lbiZyc3F1bztzIHdyb25ncyBpbmltaWNhbCAtPC9wPjxwPkxlZnQgaGVyIEhpZ2ggUGxhY2UsIGFuZCBjcm9zc2VkIHRvIHdoZXJlIEkgc2F0PC9wPjxwPkluIHNwZWVjaCB3aXRoIFJhY2hlbCAob2YgdGhlIGZpcnN0IG9mIGFsbDwvcD48cD5Hb2Qgc2F2ZWQpLiAmbGRxdW87TyBCZWF0cmljZSwgUHJhaXNlIG9mIEdvZCwmcmRxdW87PC9wPjxwPi0gU28gc2FpZCBzaGUgdG8gbWUmbmJzcDsmbmRhc2g7ICZsZHF1bztzaXR0JnJzcXVvO3N0IHRob3UgaGVyZSBzbyBzbG93PC9wPjxwPlRvIGFpZCBoaW0sIG9uY2Ugb24gZWFydGggdGhhdCBsb3ZlZCB0aGVlIHNvPC9wPjxwPlRoYXQgYWxsIGhlIGxlZnQgdG8gc2VydmUgdGhlZT8gSGVhciZyc3F1bztzdCB0aG91IG5vdDwvcD48cD5UaGUgYW5ndWlzaCBvZiBoaXMgcGxhaW50PyBhbmQgZG9zdCBub3Qgc2VlLDwvcD48cD5CeSB0aGF0IGRhcmsgc3RyZWFtIHRoYXQgbmV2ZXIgc2Vla3MgYSBzZWEsPC9wPjxwPlRoZSBkZWF0aCB0aGF0IHRocmVhdHMgaGltPyZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDhlbVwiPk5vbmUsIGFzIHRodXMgc2hlIHNhaWQsPC9wPjxwPk5vbmUgZXZlciB3YXMgc3dpZnQgb24gZWFydGggaGlzIGdvb2QgdG8gY2hhc2UsPC9wPjxwPk5vbmUgZXZlciBvbiBlYXJ0aCB3YXMgc3dpZnQgdG8gbGVhdmUgaGlzIGRyZWFkLDwvcD48cD5BcyBjYW1lIEkgZG93bndhcmQgZnJvbSB0aGF0IHNhY3JlZCBwbGFjZTwvcD48cD5UbyBmaW5kIHRoZWUgYW5kIGludm9rZSB0aGVlLCBjb25maWRlbnQ8L3A+PHA+Tm90IHZhaW5seSBmb3IgaGlzIG5lZWQgdGhlIGdvbGQgd2VyZSBzcGVudDwvcD48cD5PZiB0aHkgd29yZC13aXNkb20uJnJzcXVvOyBIZXJlIHNoZSB0dXJuZWQgYXdheSw8L3A+PHA+SGVyIGJyaWdodCBleWVzIGNsb3VkZWQgd2l0aCB0aGVpciB0ZWFycywgYW5kIEksPC9wPjxwPldobyBzYXcgdGhlbSwgdGhlcmVmb3JlIG1hZGUgbW9yZSBoYXN0ZSB0byByZWFjaDwvcD48cD5UaGUgcGxhY2Ugc2hlIHRvbGQsIGFuZCBmb3VuZCB0aGVlLiBDYW5zdCB0aG91IHNheTwvcD48cD5JIGZhaWxlZCB0aHkgcmVzY3VlPyBJcyB0aGUgYmVhc3QgYW5pZ2g8L3A+PHA+RnJvbSB3aGljaCB5ZSBxdWFpbGVkPyBXaGVuIHN1Y2ggZGVhciBzYWludHMgYmVzZWVjaDwvcD48cD4tIFRocmVlIGZyb20gdGhlIEhpZ2hlc3QmbmJzcDsmbmRhc2g7IHRoYXQgSGVhdmVuIHRoeSBjb3Vyc2UgYWxsb3c8L3A+PHA+V2h5IGhhbHQgeWUgZmVhcmZ1bD8gSW4gc3VjaCBndWFyZHMgYXMgdGhvdTwvcD48cD5UaGUgZmFpbnRlc3QtaGVhcnRlZCBtaWdodCBiZSBib2xkLiZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDE0ZW1cIj5BcyBmbG93ZXJzLDwvcD48cD5DbG9zZS1mb2xkZWQgdGhyb3VnaCB0aGUgY29sZCBhbmQgbGlnaHRsZXNzIGhvdXJzLDwvcD48cD5UaGVpciBiZW5kZWQgc3RlbXMgZXJlY3QsIGFuZCBvcGVuaW5nIGZhaXI8L3A+PHA+QWNjZXB0IHRoZSB3aGl0ZSBsaWdodCBhbmQgdGhlIHdhcm1lciBhaXI8L3A+PHA+T2YgbW9ybmluZywgc28gbXkgZmFpbnRpbmcgaGVhcnQgYW5ldzwvcD48cD5MaWZ0ZWQsIHRoYXQgaGVhcmQgaGlzIGNvbWZvcnQuIFN3aWZ0IEkgc3Bha2UsPC9wPjxwPiZsZHF1bztPIGNvdXJ0ZW91cyB0aG91LCBhbmQgc2hlIGNvbXBhc3Npb25hdGUhPC9wPjxwPlRoeSBoYXN0ZSB0aGF0IHNhdmVkIG1lLCBhbmQgaGVyIHdhcm5pbmcgdHJ1ZSw8L3A+PHA+QmV5b25kIG15IHdvcnRoIGV4YWx0IG1lLiBUaGluZSBJIG1ha2U8L3A+PHA+TXkgd2lsbC4gSW4gY29uY29yZCBvZiBvbmUgbWluZCBmcm9tIG5vdyw8L3A+PHA+TyBNYXN0ZXIgYW5kIG15IEd1aWRlLCB3aGVyZSBsZWFkZXN0IHRob3U8L3A+PHA+SSBmb2xsb3cuJnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50MmVtXCI+QW5kIHdlLCB3aXRoIG5vIG1vcmUgd29yZHMmcnNxdW87IGRlbGF5LDwvcD48cD5XZW50IGZvcndhcmQgb24gdGhhdCBoYXJkIGFuZCBkcmVhZGZ1bCB3YXkuPC9wPjwvZGl2PicsXG5cblx0JzxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q2FudG8gSUlJPC9wPjwvcD48cD48ZGl2IGNsYXNzPVwic3RhbnphXCI+VEhFIGdhdGV3YXkgdG8gdGhlIGNpdHkgb2YgRG9vbS4gVGhyb3VnaCBtZTwvcD48cD5UaGUgZW50cmFuY2UgdG8gdGhlIEV2ZXJsYXN0aW5nIFBhaW4uPC9wPjxwPlRoZSBHYXRld2F5IG9mIHRoZSBMb3N0LiBUaGUgRXRlcm5hbCBUaHJlZTwvcD48cD5KdXN0aWNlIGltcGVsbGVkIHRvIGJ1aWxkIG1lLiBIZXJlIHllIHNlZTwvcD48cD5XaXNkb20gU3VwcmVtZSBhdCB3b3JrLCBhbmQgUHJpbWFsIFBvd2VyLDwvcD48cD5BbmQgTG92ZSBTdXBlcm5hbCBpbiB0aGVpciBkYXdubGVzcyBkYXkuPC9wPjxwPkVyZSBmcm9tIHRoZWlyIHRob3VnaHQgY3JlYXRpb24gcm9zZSBpbiBmbG93ZXI8L3A+PHA+RXRlcm5hbCBmaXJzdCB3ZXJlIGFsbCB0aGluZ3MgZml4ZWQgYXMgdGhleS48L3A+PHA+T2YgSW5jcmVhdGUgUG93ZXIgaW5maW5pdGUgZm9ybWVkIGFtIEk8L3A+PHA+VGhhdCBkZWF0aGxlc3MgYXMgdGhlbXNlbHZlcyBJIGRvIG5vdCBkaWUuPC9wPjxwPkp1c3RpY2UgZGl2aW5lIGhhcyB3ZWlnaGVkOiB0aGUgZG9vbSBpcyBjbGVhci48L3A+PHA+QWxsIGhvcGUgcmVub3VuY2UsIHllIGxvc3QsIHdobyBlbnRlciBoZXJlLjwvcD48cD5UaGlzIHNjcm9sbCBpbiBnbG9vbSBhYm92ZSB0aGUgZ2F0ZSBJIHJlYWQsPC9wPjxwPkFuZCBmb3VuZCBpdCBmZWFyZnVsLiAmbGRxdW87TWFzdGVyLCBoYXJkLCZyZHF1bzsgSSBzYWlkLDwvcD48cD4mbGRxdW87VGhpcyBzYXlpbmcgdG8gbWUuXCIgQW5kIGhlLCBhcyBvbmUgdGhhdCBsb25nPC9wPjxwPldhcyBjdXN0b21lZCwgYW5zd2VyZWQsICZsZHF1bztObyBkaXN0cnVzdCBtdXN0IHdyb25nPC9wPjxwPkl0cyBNYWtlciwgbm9yIHRoeSBjb3dhcmRlciBtb29kIHJlc3VtZTwvcD48cD5JZiBoZXJlIHllIGVudGVyLiBUaGlzIHRoZSBwbGFjZSBvZiBkb29tPC9wPjxwPkkgdG9sZCB0aGVlLCB3aGVyZSB0aGUgbG9zdCBpbiBkYXJrbmVzcyBkd2VsbC48L3A+PHA+SGVyZSwgYnkgdGhlbXNlbHZlcyBkaXZvcmNlZCBmcm9tIGxpZ2h0LCB0aGV5IGZlbGwsPC9wPjxwPkFuZCBhcmUgYXMgeWUgc2hhbGwgc2VlIHRoZW0uJnJkcXVvOyBIZXJlIGhlIGxlbnQ8L3A+PHA+QSBoYW5kIHRvIGRyYXcgbWUgdGhyb3VnaCB0aGUgZ2F0ZSwgYW5kIGJlbnQ8L3A+PHA+QSBnbGFuY2UgdXBvbiBteSBmZWFyIHNvIGNvbmZpZGVudDwvcD48cD5UaGF0IEksIHRvbyBuZWFybHkgdG8gbXkgZm9ybWVyIGRyZWFkPC9wPjxwPlJldHVybmVkLCB0aHJvdWdoIGFsbCBteSBoZWFydCB3YXMgY29tZm9ydGVkLDwvcD48cD5BbmQgZG93bndhcmQgdG8gdGhlIHNlY3JldCB0aGluZ3Mgd2Ugd2VudC48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkRvd253YXJkIHRvIG5pZ2h0LCBidXQgbm90IG9mIG1vb24gYW5kIGNsb3VkLDwvcD48cD5Ob3QgbmlnaHQgd2l0aCBhbGwgaXRzIHN0YXJzLCBhcyBuaWdodCB3ZSBrbm93LDwvcD48cD5CdXQgYnVyZGVuZWQgd2l0aCBhbiBvY2Vhbi13ZWlnaHQgb2Ygd29lPC9wPjxwPlRoZSBkYXJrbmVzcyBjbG9zZWQgdXMuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ2ZW1cIj5TaWdocywgYW5kIHdhaWxpbmdzIGxvdWQsPC9wPjxwPk91dGNyaWVzIHBlcnBldHVhbCBvZiByZWNydWl0ZWQgcGFpbiw8L3A+PHA+U291bmRzIG9mIHN0cmFuZ2UgdG9uZ3VlcywgYW5kIGFuZ2VycyB0aGF0IHJlbWFpbjwvcD48cD5WZW5nZWxlc3MgZm9yIGV2ZXIsIHRoZSB0aGljayBhbmQgY2xhbW9yb3VzIGNyb3dkPC9wPjxwPk9mIGRpc2NvcmRzIHByZXNzZWQsIHRoYXQgbmVlZHMgSSB3ZXB0IHRvIGhlYXIsPC9wPjxwPkZpcnN0IGhlYXJpbmcuIFRoZXJlLCB3aXRoIHJlYWNoIG9mIGhhbmRzIGFuZWFyLDwvcD48cD5BbmQgdm9pY2VzIHBhc3Npb24taG9hcnNlLCBvciBzaHJpbGxlZCB3aXRoIGZyaWdodCw8L3A+PHA+VGhlIHR1bXVsdCBvZiB0aGUgZXZlcmxhc3RpbmcgbmlnaHQsPC9wPjxwPkFzIHNhbmQgdGhhdCBkYW5jZXMgaW4gY29udGludWFsIHdpbmQsPC9wPjxwPlR1cm5zIG9uIGl0c2VsZiBmb3IgZXZlci48L3A+PHAgY2xhc3M9XCJzbGluZGVudDhlbVwiPkFuZCBJLCBteSBoZWFkPC9wPjxwPkJlZ2lydCB3aXRoIG1vdmVtZW50cywgYW5kIG15IGVhcnMgYmVkaW5uZWQ8L3A+PHA+V2l0aCBvdXRjcmllcyByb3VuZCBtZSwgdG8gbXkgbGVhZGVyIHNhaWQsPC9wPjxwPiZsZHF1bztNYXN0ZXIsIHdoYXQgaGVhciBJPyBXaG8gc28gb3ZlcmJvcm5lPC9wPjxwPldpdGggd29lcyBhcmUgdGhlc2U/JnJkcXVvOzwvcD48cCBjbGFzcz1cInNsaW5kZW50NmVtXCI+SGUgYW5zd2VyZWQsICZsZHF1bztUaGVzZSBiZSB0aGV5PC9wPjxwPlRoYXQgcHJhaXNlbGVzcyBsaXZlZCBhbmQgYmxhbWVsZXNzLiBOb3cgdGhlIHNjb3JuPC9wPjxwPk9mIEhlaWdodCBhbmQgRGVwdGggYWxpa2UsIGFib3J0aW9ucyBkcmVhcjs8L3A+PHA+Q2FzdCB3aXRoIHRob3NlIGFiamVjdCBhbmdlbHMgd2hvc2UgZGVsYXk8L3A+PHA+VG8gam9pbiByZWJlbGxpb24sIG9yIHRoZWlyIExvcmQgZGVmZW5kLDwvcD48cD5XYWl0aW5nIHRoZWlyIHByb3ZlZCBhZHZhbnRhZ2UsIGZsdW5nIHRoZW0gaGVyZS4gLTwvcD48cD5DaGFzZWQgZm9ydGggZnJvbSBIZWF2ZW4sIGxlc3QgZWxzZSBpdHMgYmVhdXRpZXMgZW5kPC9wPjxwPlRoZSBwdXJlIHBlcmZlY3Rpb24gb2YgdGhlaXIgc3RhaW5sZXNzIGNsYWltLDwvcD48cD5PdXQtaGVyZGVkIGZyb20gdGhlIHNoaW5pbmcgZ2F0ZSB0aGV5IGNhbWUsPC9wPjxwPldoZXJlIHRoZSBkZWVwIGhlbGxzIHJlZnVzZWQgdGhlbSwgbGVzdCB0aGUgbG9zdDwvcD48cD5Cb2FzdCBzb21ldGhpbmcgYmFzZXIgdGhhbiB0aGVtc2VsdmVzLiZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDE0ZW1cIj5BbmQgSSw8L3A+PHA+JmxkcXVvO01hc3Rlciwgd2hhdCBncmlldmFuY2UgaGF0aCB0aGVpciBmYWlsdXJlIGNvc3QsPC9wPjxwPlRoYXQgdGhyb3VnaCB0aGUgbGFtZW50YWJsZSBkYXJrIHRoZXkgY3J5PyZyZHF1bzs8L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkhlIGFuc3dlcmVkLCAmbGRxdW87QnJpZWZseSBhdCBhIHRoaW5nIG5vdCB3b3J0aDwvcD48cD5XZSBnbGFuY2UsIGFuZCBwYXNzIGZvcmdldGZ1bC4gSG9wZSBpbiBkZWF0aDwvcD48cD5UaGV5IGhhdmUgbm90LiBNZW1vcnkgb2YgdGhlbSBvbiB0aGUgZWFydGg8L3A+PHA+V2hlcmUgb25jZSB0aGV5IGxpdmVkIHJlbWFpbnMgbm90LiBOb3IgdGhlIGJyZWF0aDwvcD48cD5PZiBKdXN0aWNlIHNoYWxsIGNvbmRlbW4sIG5vciBNZXJjeSBwbGVhZCw8L3A+PHA+QnV0IGFsbCBhbGlrZSBkaXNkYWluIHRoZW0uIFRoYXQgdGhleSBrbm93PC9wPjxwPlRoZW1zZWx2ZXMgc28gbWVhbiBiZW5lYXRoIGF1Z2h0IGVsc2UgY29uc3RyYWluczwvcD48cD5UaGUgZW52aW91cyBvdXRjcmllcyB0aGF0IHRvbyBsb25nIHllIGhlZWQuPC9wPjxwPk1vdmUgcGFzdCwgYnV0IHNwZWFrIG5vdC4mcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ4ZW1cIj5UaGVuIEkgbG9va2VkLCBhbmQgbG8sPC9wPjxwPldlcmUgc291bHMgaW4gY2Vhc2VsZXNzIGFuZCB1bm51bWJlcmVkIHRyYWluczwvcD48cD5UaGF0IHBhc3QgbWUgd2hpcmxlZCB1bmVuZGluZywgdmFpbmx5IGxlZDwvcD48cD5Ob3doaXRoZXIsIGluIHVzZWxlc3MgYW5kIHVucGF1c2luZyBoYXN0ZS48L3A+PHA+QSBmbHV0dGVyaW5nIGVuc2lnbiBhbGwgdGhlaXIgZ3VpZGUsIHRoZXkgY2hhc2VkPC9wPjxwPlRoZW1zZWx2ZXMgZm9yIGV2ZXIuIEkgaGFkIG5vdCB0aG91Z2h0IHRoZSBkZWFkLDwvcD48cD5UaGUgd2hvbGUgd29ybGQmcnNxdW87cyBkZWFkLCBzbyBtYW55IGFzIHRoZXNlLiBJIHNhdzwvcD48cD5UaGUgc2hhZG93IG9mIGhpbSBlbGVjdCB0byBQZXRlciZyc3F1bztzIHNlYXQ8L3A+PHA+V2hvIG1hZGUgdGhlIGdyZWF0IHJlZnVzYWwsIGFuZCB0aGUgbGF3LDwvcD48cD5UaGUgdW5zd2VydmluZyBsYXcgdGhhdCBsZWZ0IHRoZW0gdGhpcyByZXRyZWF0PC9wPjxwPlRvIHNlYWwgdGhlIGFib3J0aW9uIG9mIHRoZWlyIGxpdmVzLCBiZWNhbWU8L3A+PHA+SWxsdW1pbmVkIHRvIG1lLCBhbmQgdGhlbXNlbHZlcyBJIGtuZXcsPC9wPjxwPlRvIEdvZCBhbmQgYWxsIGhpcyBmb2VzIHRoZSBmdXRpbGUgY3JldzwvcD48cD5Ib3cgaGF0ZWZ1bCBpbiB0aGVpciBldmVybGFzdGluZyBzaGFtZS48L3A+PC9kaXY+PGRpdiBjbGFzcz1cInN0YW56YVwiPjxwPkkgc2F3IHRoZXNlIHZpY3RpbXMgb2YgY29udGludWVkIGRlYXRoPC9wPjxwPi0gRm9yIGxpdmVkIHRoZXkgbmV2ZXImbmJzcDsmbmRhc2g7IHdlcmUgbmFrZWQgYWxsLCBhbmQgbG91ZDwvcD48cD5Bcm91bmQgdGhlbSBjbG9zZWQgYSBuZXZlci1jZWFzaW5nIGNsb3VkPC9wPjxwPk9mIGhvcm5ldHMgYW5kIGdyZWF0IHdhc3BzLCB0aGF0IGJ1enplZCBhbmQgY2x1bmcsPC9wPjxwPi0gV2VhayBwYWluIGZvciB3ZWFrbGluZ3MgbWVldCwmbmJzcDsmbmRhc2g7IGFuZCB3aGVyZSB0aGV5IHN0dW5nLDwvcD48cD5CbG9vZCBmcm9tIHRoZWlyIGZhY2VzIHN0cmVhbWVkLCB3aXRoIHNvYmJpbmcgYnJlYXRoLDwvcD48cD5BbmQgYWxsIHRoZSBncm91bmQgYmVuZWF0aCB3aXRoIHRlYXJzIGFuZCBibG9vZDwvcD48cD5XYXMgZHJlbmNoZWQsIGFuZCBjcmF3bGluZyBpbiB0aGF0IGxvYXRoc29tZSBtdWQ8L3A+PHA+VGhlcmUgd2VyZSBncmVhdCB3b3JtcyB0aGF0IGRyYW5rIGl0LjwvcD48cCBjbGFzcz1cInNsaW5kZW50MTBlbVwiPkdsYWRseSB0aGVuY2U8L3A+PHA+SSBnYXplZCBmYXIgZm9yd2FyZC4gRGFyayBhbmQgd2lkZSB0aGUgZmxvb2Q8L3A+PHA+VGhhdCBmbG93ZWQgYmVmb3JlIHVzLiBPbiB0aGUgbmVhcmVyIHNob3JlPC9wPjxwPldlcmUgcGVvcGxlIHdhaXRpbmcuICZsZHF1bztNYXN0ZXIsIHNob3cgbWUgd2hlbmNlPC9wPjxwPlRoZXNlIGNhbWUsIGFuZCB3aG8gdGhleSBiZSwgYW5kIHBhc3NpbmcgaGVuY2U8L3A+PHA+V2hlcmUgZ28gdGhleT8gV2hlcmVmb3JlIHdhaXQgdGhleSB0aGVyZSBjb250ZW50LDwvcD48cD4tIFRoZSBmYWludCBsaWdodCBzaG93cyBpdCwmbmJzcDsmbmRhc2g7IGZvciB0aGVpciB0cmFuc2l0IG8mcnNxdW87ZXI8L3A+PHA+VGhlIHVuYnJpZGdlZCBhYnlzcz8mcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ2ZW1cIj5IZSBhbnN3ZXJlZCwgJmxkcXVvO1doZW4gd2Ugc3RhbmQ8L3A+PHA+VG9nZXRoZXIsIHdhaXRpbmcgb24gdGhlIGpveWxlc3Mgc3RyYW5kLDwvcD48cD5JbiBhbGwgaXQgc2hhbGwgYmUgdG9sZCB0aGVlLiZyZHF1bzsgSWYgaGUgbWVhbnQ8L3A+PHA+UmVwcm9vZiBJIGtub3cgbm90LCBidXQgd2l0aCBzaGFtZSBJIGJlbnQ8L3A+PHA+TXkgZG93bndhcmQgZXllcywgYW5kIG5vIG1vcmUgc3Bha2UgdW50aWw8L3A+PHA+VGhlIGJhbmsgd2UgcmVhY2hlZCwgYW5kIG9uIHRoZSBzdHJlYW0gYmVoZWxkPC9wPjxwPkEgYmFyayBwbHkgdG93YXJkIHVzLjwvcD48cCBjbGFzcz1cInNsaW5kZW50OGVtXCI+T2YgZXhjZWVkaW5nIGVsZCw8L3A+PHA+QW5kIGhvYXJ5IHNob3dlZCB0aGUgc3RlZXJzbWFuLCBzY3JlYW1pbmcgc2hyaWxsLDwvcD48cD5XaXRoIGhvcnJpZCBnbGVlIHRoZSB3aGlsZSBoZSBuZWFyZWQgdXMsICZsZHF1bztXb2U8L3A+PHA+VG8geWUsIGRlcHJhdmVkISZuYnNwOyZuZGFzaDsgSXMgaGVyZSBubyBIZWF2ZW4sIGJ1dCBpbGw8L3A+PHA+VGhlIHBsYWNlIHdoZXJlIEkgc2hhbGwgaGVyZCB5ZS4gSWNlIGFuZCBmaXJlPC9wPjxwPkFuZCBkYXJrbmVzcyBhcmUgdGhlIHdhZ2VzIG9mIHRoZWlyIGhpcmU8L3A+PHA+V2hvIHNlcnZlIHVuY2Vhc2luZyBoZXJlJm5ic3A7Jm5kYXNoOyBCdXQgdGhvdSB0aGF0IHRoZXJlPC9wPjxwPkRvc3Qgd2FpdCB0aG91Z2ggbGl2ZSwgZGVwYXJ0IHllLiBZZWEsIGZvcmJlYXIhPC9wPjxwPkEgZGlmZmVyZW50IHBhc3NhZ2UgYW5kIGEgbGlnaHRlciBmYXJlPC9wPjxwPklzIGRlc3RpbmVkIHRoaW5lLiZyZHF1bzs8L3A+PHAgY2xhc3M9XCJzbGluZGVudDZlbVwiPkJ1dCBoZXJlIG15IGd1aWRlIHJlcGxpZWQsPC9wPjxwPiZsZHF1bztOYXksIENoYXJvbiwgY2Vhc2U7IG9yIHRvIHRoeSBncmllZiB5ZSBjaGlkZS48L3A+PHA+SXQgVGhlcmUgaXMgd2lsbGVkLCB3aGVyZSB0aGF0IGlzIHdpbGxlZCBzaGFsbCBiZSw8L3A+PHA+VGhhdCB5ZSBzaGFsbCBwYXNzIGhpbSB0byB0aGUgZnVydGhlciBzaWRlLDwvcD48cD5Ob3IgcXVlc3Rpb24gbW9yZS4mcmRxdW87PC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ2ZW1cIj5UaGUgZmxlZWN5IGNoZWVrcyB0aGVyZWF0LDwvcD48cD5CbG93biB3aXRoIGZpZXJjZSBzcGVlY2ggYmVmb3JlLCB3ZXJlIGRyYXduIGFuZCBmbGF0LDwvcD48cD5BbmQgaGlzIGZsYW1lLWNpcmNsZWQgZXllcyBzdWJkdWVkLCB0byBoZWFyPC9wPjxwPlRoYXQgbWFuZGF0ZSBnaXZlbi4gQnV0IHRob3NlIG9mIHdob20gaGUgc3Bha2U8L3A+PHA+SW4gYml0dGVyIGdsZWUsIHdpdGggbmFrZWQgbGltYnMgYXNoYWtlLDwvcD48cD5BbmQgY2hhdHRlcmluZyB0ZWV0aCByZWNlaXZlZCBpdC4gU2VlbWVkIHRoYXQgdGhlbjwvcD48cD5UaGV5IGZpcnN0IHdlcmUgY29uc2Npb3VzIHdoZXJlIHRoZXkgY2FtZSwgYW5kIGZlYXI8L3A+PHA+QWJqZWN0IGFuZCBmcmlnaHRmdWwgc2hvb2sgdGhlbTsgY3Vyc2VzIGJ1cnN0PC9wPjxwPkluIGNsYW1vcm91cyBkaXNjb3JkcyBmb3J0aDsgdGhlIHJhY2Ugb2YgbWVuLDwvcD48cD5UaGVpciBwYXJlbnRzLCBhbmQgdGhlaXIgR29kLCB0aGUgcGxhY2UsIHRoZSB0aW1lLDwvcD48cD5PZiB0aGVpciBjb25jZXB0aW9ucyBhbmQgdGhlaXIgYmlydGhzLCBhY2N1cnNlZDwvcD48cD5BbGlrZSB0aGV5IGNhbGxlZCwgYmxhc3BoZW1pbmcgSGVhdmVuLiBCdXQgeWV0PC9wPjxwPlNsb3cgc3RlcHMgdG93YXJkIHRoZSB3YWl0aW5nIGJhcmsgdGhleSBzZXQsPC9wPjxwPldpdGggdGVycmlibGUgd2FpbGluZyB3aGlsZSB0aGV5IG1vdmVkLiBBbmQgc288L3A+PHA+VGhleSBjYW1lIHJlbHVjdGFudCB0byB0aGUgc2hvcmUgb2Ygd29lPC9wPjxwPlRoYXQgd2FpdHMgZm9yIGFsbCB3aG8gZmVhciBub3QgR29kLCBhbmQgbm90PC9wPjxwPlRoZW0gb25seS48L3A+PHAgY2xhc3M9XCJzbGluZGVudDRlbVwiPlRoZW4gdGhlIGRlbW9uIENoYXJvbiByb3NlPC9wPjxwPlRvIGhlcmQgdGhlbSBpbiwgd2l0aCBleWVzIHRoYXQgZnVybmFjZS1ob3Q8L3A+PHA+R2xvd2VkIGF0IHRoZSB0YXNrLCBhbmQgbGlmdGVkIG9hciB0byBzbWl0ZTwvcD48cD5XaG8gbGluZ2VyZWQuPC9wPjxwIGNsYXNzPVwic2xpbmRlbnQ0ZW1cIj5BcyB0aGUgbGVhdmVzLCB3aGVuIGF1dHVtbiBzaG93cyw8L3A+PHA+T25lIGFmdGVyIG9uZSBkZXNjZW5kaW5nLCBsZWF2ZSB0aGUgYm91Z2gsPC9wPjxwPk9yIGRvdmVzIGNvbWUgZG93bndhcmQgdG8gdGhlIGNhbGwsIHNvIG5vdzwvcD48cD5UaGUgZXZpbCBzZWVkIG9mIEFkYW0gdG8gZW5kbGVzcyBuaWdodCw8L3A+PHA+QXMgQ2hhcm9uIHNpZ25hbGxlZCwgZnJvbSB0aGUgc2hvcmUmcnNxdW87cyBibGVhayBoZWlnaHQsPC9wPjxwPkNhc3QgdGhlbXNlbHZlcyBkb3dud2FyZCB0byB0aGUgYmFyay4gVGhlIGJyb3duPC9wPjxwPkFuZCBiaXR0ZXIgZmxvb2QgcmVjZWl2ZWQgdGhlbSwgYW5kIHdoaWxlIHRoZXkgcGFzc2VkPC9wPjxwPldlcmUgb3RoZXJzIGdhdGhlcmluZywgcGF0aWVudCBhcyB0aGUgbGFzdCw8L3A+PHA+Tm90IGNvbnNjaW91cyBvZiB0aGVpciBuZWFyaW5nIGRvb20uPC9wPjxwIGNsYXNzPVwic2xpbmRlbnQxNGVtXCI+JmxkcXVvO015IHNvbiwmcmRxdW87PC9wPjxwPi0gUmVwbGllZCBteSBndWlkZSB0aGUgdW5zcG9rZW4gdGhvdWdodCZuYnNwOyZuZGFzaDsgJmxkcXVvO2lzIG5vbmU8L3A+PHA+QmVuZWF0aCBHb2QmcnNxdW87cyB3cmF0aCB3aG8gZGllcyBpbiBmaWVsZCBvciB0b3duLDwvcD48cD5PciBlYXJ0aCZyc3F1bztzIHdpZGUgc3BhY2UsIG9yIHdob20gdGhlIHdhdGVycyBkcm93biw8L3A+PHA+QnV0IGhlcmUgaGUgY29tZXRoIGF0IGxhc3QsIGFuZCB0aGF0IHNvIHNwdXJyZWQ8L3A+PHA+QnkgSnVzdGljZSwgdGhhdCBoaXMgZmVhciwgYXMgdGhvc2UgeWUgaGVhcmQsPC9wPjxwPkltcGVscyBoaW0gZm9yd2FyZCBsaWtlIGRlc2lyZS4gSXMgbm90PC9wPjxwPk9uZSBzcGlyaXQgb2YgYWxsIHRvIHJlYWNoIHRoZSBmYXRhbCBzcG90PC9wPjxwPlRoYXQgR29kJnJzcXVvO3MgbG92ZSBob2xkZXRoLCBhbmQgaGVuY2UsIGlmIENoYXI8L3A+PHA+Y2hpZGUsPC9wPjxwPlllIHdlbGwgbWF5IHRha2UgaXQuJm5ic3A7Jm5kYXNoOyBSYWlzZSB0aHkgaGVhcnQsIGZvciBub3csPC9wPjxwPkNvbnN0cmFpbmVkIG9mIEhlYXZlbiwgaGUgbXVzdCB0aHkgY291cnNlIGFsbG93LlwiPC9wPjwvZGl2PjxkaXYgY2xhc3M9XCJzdGFuemFcIj48cD5ZZXQgaG93IEkgcGFzc2VkIEkga25vdyBub3QuIEZvciB0aGUgZ3JvdW5kPC9wPjxwPlRyZW1ibGVkIHRoYXQgaGVhcmQgaGltLCBhbmQgYSBmZWFyZnVsIHNvdW5kPC9wPjxwPk9mIGlzc3Vpbmcgd2luZCBhcm9zZSwgYW5kIGJsb29kLXJlZCBsaWdodDwvcD48cD5Ccm9rZSBmcm9tIGJlbmVhdGggb3VyIGZlZXQsIGFuZCBzZW5zZSBhbmQgc2lnaHQ8L3A+PHA+TGVmdCBtZS4gVGhlIG1lbW9yeSB3aXRoIGNvbGQgc3dlYXQgb25jZSBtb3JlPC9wPjxwPlJlbWluZHMgbWUgb2YgdGhlIHN1ZGRlbi1jcmltc29uZWQgbmlnaHQsPC9wPjxwPkFzIHNhbmsgSSBzZW5zZWxlc3MgYnkgdGhlIGRyZWFkZnVsIHNob3JlLjwvcD48L2Rpdj4nXTtcblxubW9kdWxlLmV4cG9ydHMgPSB3cmlnaHQ7XG4iLCI7KGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBAcHJlc2VydmUgRmFzdENsaWNrOiBwb2x5ZmlsbCB0byByZW1vdmUgY2xpY2sgZGVsYXlzIG9uIGJyb3dzZXJzIHdpdGggdG91Y2ggVUlzLlxuXHQgKlxuXHQgKiBAY29kaW5nc3RhbmRhcmQgZnRsYWJzLWpzdjJcblx0ICogQGNvcHlyaWdodCBUaGUgRmluYW5jaWFsIFRpbWVzIExpbWl0ZWQgW0FsbCBSaWdodHMgUmVzZXJ2ZWRdXG5cdCAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChzZWUgTElDRU5TRS50eHQpXG5cdCAqL1xuXG5cdC8qanNsaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblx0LypnbG9iYWwgZGVmaW5lLCBFdmVudCwgTm9kZSovXG5cblxuXHQvKipcblx0ICogSW5zdGFudGlhdGUgZmFzdC1jbGlja2luZyBsaXN0ZW5lcnMgb24gdGhlIHNwZWNpZmllZCBsYXllci5cblx0ICpcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuXHQgKi9cblx0ZnVuY3Rpb24gRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKSB7XG5cdFx0dmFyIG9sZE9uQ2xpY2s7XG5cblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdC8qKlxuXHRcdCAqIFdoZXRoZXIgYSBjbGljayBpcyBjdXJyZW50bHkgYmVpbmcgdHJhY2tlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIGJvb2xlYW5cblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGltZXN0YW1wIGZvciB3aGVuIGNsaWNrIHRyYWNraW5nIHN0YXJ0ZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBlbGVtZW50IGJlaW5nIHRyYWNrZWQgZm9yIGEgY2xpY2suXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBFdmVudFRhcmdldFxuXHRcdCAqL1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFgtY29vcmRpbmF0ZSBvZiB0b3VjaCBzdGFydCBldmVudC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hTdGFydFggPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBZLWNvb3JkaW5hdGUgb2YgdG91Y2ggc3RhcnQgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoU3RhcnRZID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogSUQgb2YgdGhlIGxhc3QgdG91Y2gsIHJldHJpZXZlZCBmcm9tIFRvdWNoLmlkZW50aWZpZXIuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUb3VjaG1vdmUgYm91bmRhcnksIGJleW9uZCB3aGljaCBhIGNsaWNrIHdpbGwgYmUgY2FuY2VsbGVkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaEJvdW5kYXJ5ID0gb3B0aW9ucy50b3VjaEJvdW5kYXJ5IHx8IDEwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaGUgRmFzdENsaWNrIGxheWVyLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgRWxlbWVudFxuXHRcdCAqL1xuXHRcdHRoaXMubGF5ZXIgPSBsYXllcjtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtaW5pbXVtIHRpbWUgYmV0d2VlbiB0YXAodG91Y2hzdGFydCBhbmQgdG91Y2hlbmQpIGV2ZW50c1xuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50YXBEZWxheSA9IG9wdGlvbnMudGFwRGVsYXkgfHwgMjAwO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIG1heGltdW0gdGltZSBmb3IgYSB0YXBcblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudGFwVGltZW91dCA9IG9wdGlvbnMudGFwVGltZW91dCB8fCA3MDA7XG5cblx0XHRpZiAoRmFzdENsaWNrLm5vdE5lZWRlZChsYXllcikpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBTb21lIG9sZCB2ZXJzaW9ucyBvZiBBbmRyb2lkIGRvbid0IGhhdmUgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmRcblx0XHRmdW5jdGlvbiBiaW5kKG1ldGhvZCwgY29udGV4dCkge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gbWV0aG9kLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7IH07XG5cdFx0fVxuXG5cblx0XHR2YXIgbWV0aG9kcyA9IFsnb25Nb3VzZScsICdvbkNsaWNrJywgJ29uVG91Y2hTdGFydCcsICdvblRvdWNoTW92ZScsICdvblRvdWNoRW5kJywgJ29uVG91Y2hDYW5jZWwnXTtcblx0XHR2YXIgY29udGV4dCA9IHRoaXM7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtZXRob2RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0Y29udGV4dFttZXRob2RzW2ldXSA9IGJpbmQoY29udGV4dFttZXRob2RzW2ldXSwgY29udGV4dCk7XG5cdFx0fVxuXG5cdFx0Ly8gU2V0IHVwIGV2ZW50IGhhbmRsZXJzIGFzIHJlcXVpcmVkXG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHR9XG5cblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljaywgdHJ1ZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZSwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kLCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLm9uVG91Y2hDYW5jZWwsIGZhbHNlKTtcblxuXHRcdC8vIEhhY2sgaXMgcmVxdWlyZWQgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBFdmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKGUuZy4gQW5kcm9pZCAyKVxuXHRcdC8vIHdoaWNoIGlzIGhvdyBGYXN0Q2xpY2sgbm9ybWFsbHkgc3RvcHMgY2xpY2sgZXZlbnRzIGJ1YmJsaW5nIHRvIGNhbGxiYWNrcyByZWdpc3RlcmVkIG9uIHRoZSBGYXN0Q2xpY2tcblx0XHQvLyBsYXllciB3aGVuIHRoZXkgYXJlIGNhbmNlbGxlZC5cblx0XHRpZiAoIUV2ZW50LnByb3RvdHlwZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgcm12ID0gTm9kZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRybXYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJtdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgYWR2ID0gTm9kZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRhZHYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgKGNhbGxiYWNrLmhpamFja2VkID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdGlmICghZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkKSB7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKGV2ZW50KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSwgY2FwdHVyZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YWR2LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyBJZiBhIGhhbmRsZXIgaXMgYWxyZWFkeSBkZWNsYXJlZCBpbiB0aGUgZWxlbWVudCdzIG9uY2xpY2sgYXR0cmlidXRlLCBpdCB3aWxsIGJlIGZpcmVkIGJlZm9yZVxuXHRcdC8vIEZhc3RDbGljaydzIG9uQ2xpY2sgaGFuZGxlci4gRml4IHRoaXMgYnkgcHVsbGluZyBvdXQgdGhlIHVzZXItZGVmaW5lZCBoYW5kbGVyIGZ1bmN0aW9uIGFuZFxuXHRcdC8vIGFkZGluZyBpdCBhcyBsaXN0ZW5lci5cblx0XHRpZiAodHlwZW9mIGxheWVyLm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcblxuXHRcdFx0Ly8gQW5kcm9pZCBicm93c2VyIG9uIGF0IGxlYXN0IDMuMiByZXF1aXJlcyBhIG5ldyByZWZlcmVuY2UgdG8gdGhlIGZ1bmN0aW9uIGluIGxheWVyLm9uY2xpY2tcblx0XHRcdC8vIC0gdGhlIG9sZCBvbmUgd29uJ3Qgd29yayBpZiBwYXNzZWQgdG8gYWRkRXZlbnRMaXN0ZW5lciBkaXJlY3RseS5cblx0XHRcdG9sZE9uQ2xpY2sgPSBsYXllci5vbmNsaWNrO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRvbGRPbkNsaWNrKGV2ZW50KTtcblx0XHRcdH0sIGZhbHNlKTtcblx0XHRcdGxheWVyLm9uY2xpY2sgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQqIFdpbmRvd3MgUGhvbmUgOC4xIGZha2VzIHVzZXIgYWdlbnQgc3RyaW5nIHRvIGxvb2sgbGlrZSBBbmRyb2lkIGFuZCBpUGhvbmUuXG5cdCpcblx0KiBAdHlwZSBib29sZWFuXG5cdCovXG5cdHZhciBkZXZpY2VJc1dpbmRvd3NQaG9uZSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIldpbmRvd3MgUGhvbmVcIikgPj0gMDtcblxuXHQvKipcblx0ICogQW5kcm9pZCByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgPiAwICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TID0gL2lQKGFkfGhvbmV8b2QpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNCByZXF1aXJlcyBhbiBleGNlcHRpb24gZm9yIHNlbGVjdCBlbGVtZW50cy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TNCA9IGRldmljZUlzSU9TICYmICgvT1MgNF9cXGQoX1xcZCk/LykudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNi4wLTcuKiByZXF1aXJlcyB0aGUgdGFyZ2V0IGVsZW1lbnQgdG8gYmUgbWFudWFsbHkgZGVyaXZlZFxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1NXaXRoQmFkVGFyZ2V0ID0gZGV2aWNlSXNJT1MgJiYgKC9PUyBbNi03XV9cXGQvKS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cdC8qKlxuXHQgKiBCbGFja0JlcnJ5IHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0JsYWNrQmVycnkxMCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQkIxMCcpID4gMDtcblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBlbGVtZW50IHJlcXVpcmVzIGEgbmF0aXZlIGNsaWNrLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBuZWVkcyBhIG5hdGl2ZSBjbGlja1xuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0NsaWNrID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXG5cdFx0Ly8gRG9uJ3Qgc2VuZCBhIHN5bnRoZXRpYyBjbGljayB0byBkaXNhYmxlZCBpbnB1dHMgKGlzc3VlICM2Milcblx0XHRjYXNlICdidXR0b24nOlxuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0Y2FzZSAndGV4dGFyZWEnOlxuXHRcdFx0aWYgKHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnaW5wdXQnOlxuXG5cdFx0XHQvLyBGaWxlIGlucHV0cyBuZWVkIHJlYWwgY2xpY2tzIG9uIGlPUyA2IGR1ZSB0byBhIGJyb3dzZXIgYnVnIChpc3N1ZSAjNjgpXG5cdFx0XHRpZiAoKGRldmljZUlzSU9TICYmIHRhcmdldC50eXBlID09PSAnZmlsZScpIHx8IHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnbGFiZWwnOlxuXHRcdGNhc2UgJ2lmcmFtZSc6IC8vIGlPUzggaG9tZXNjcmVlbiBhcHBzIGNhbiBwcmV2ZW50IGV2ZW50cyBidWJibGluZyBpbnRvIGZyYW1lc1xuXHRcdGNhc2UgJ3ZpZGVvJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiAoL1xcYm5lZWRzY2xpY2tcXGIvKS50ZXN0KHRhcmdldC5jbGFzc05hbWUpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGV0aGVyIGEgZ2l2ZW4gZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgY2xpY2sgaW50byBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgbmF0aXZlIGNsaWNrLlxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0ZvY3VzID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXHRcdGNhc2UgJ3RleHRhcmVhJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0XHRyZXR1cm4gIWRldmljZUlzQW5kcm9pZDtcblx0XHRjYXNlICdpbnB1dCc6XG5cdFx0XHRzd2l0Y2ggKHRhcmdldC50eXBlKSB7XG5cdFx0XHRjYXNlICdidXR0b24nOlxuXHRcdFx0Y2FzZSAnY2hlY2tib3gnOlxuXHRcdFx0Y2FzZSAnZmlsZSc6XG5cdFx0XHRjYXNlICdpbWFnZSc6XG5cdFx0XHRjYXNlICdyYWRpbyc6XG5cdFx0XHRjYXNlICdzdWJtaXQnOlxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE5vIHBvaW50IGluIGF0dGVtcHRpbmcgdG8gZm9jdXMgZGlzYWJsZWQgaW5wdXRzXG5cdFx0XHRyZXR1cm4gIXRhcmdldC5kaXNhYmxlZCAmJiAhdGFyZ2V0LnJlYWRPbmx5O1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gKC9cXGJuZWVkc2ZvY3VzXFxiLykudGVzdCh0YXJnZXQuY2xhc3NOYW1lKTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogU2VuZCBhIGNsaWNrIGV2ZW50IHRvIHRoZSBzcGVjaWZpZWQgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnNlbmRDbGljayA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQsIGV2ZW50KSB7XG5cdFx0dmFyIGNsaWNrRXZlbnQsIHRvdWNoO1xuXG5cdFx0Ly8gT24gc29tZSBBbmRyb2lkIGRldmljZXMgYWN0aXZlRWxlbWVudCBuZWVkcyB0byBiZSBibHVycmVkIG90aGVyd2lzZSB0aGUgc3ludGhldGljIGNsaWNrIHdpbGwgaGF2ZSBubyBlZmZlY3QgKCMyNClcblx0XHRpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblx0XHR9XG5cblx0XHR0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0Ly8gU3ludGhlc2lzZSBhIGNsaWNrIGV2ZW50LCB3aXRoIGFuIGV4dHJhIGF0dHJpYnV0ZSBzbyBpdCBjYW4gYmUgdHJhY2tlZFxuXHRcdGNsaWNrRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudHMnKTtcblx0XHRjbGlja0V2ZW50LmluaXRNb3VzZUV2ZW50KHRoaXMuZGV0ZXJtaW5lRXZlbnRUeXBlKHRhcmdldEVsZW1lbnQpLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIHRvdWNoLnNjcmVlblgsIHRvdWNoLnNjcmVlblksIHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLCBudWxsKTtcblx0XHRjbGlja0V2ZW50LmZvcndhcmRlZFRvdWNoRXZlbnQgPSB0cnVlO1xuXHRcdHRhcmdldEVsZW1lbnQuZGlzcGF0Y2hFdmVudChjbGlja0V2ZW50KTtcblx0fTtcblxuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmRldGVybWluZUV2ZW50VHlwZSA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblxuXHRcdC8vSXNzdWUgIzE1OTogQW5kcm9pZCBDaHJvbWUgU2VsZWN0IEJveCBkb2VzIG5vdCBvcGVuIHdpdGggYSBzeW50aGV0aWMgY2xpY2sgZXZlbnRcblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkICYmIHRhcmdldEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc2VsZWN0Jykge1xuXHRcdFx0cmV0dXJuICdtb3VzZWRvd24nO1xuXHRcdH1cblxuXHRcdHJldHVybiAnY2xpY2snO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5mb2N1cyA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblx0XHR2YXIgbGVuZ3RoO1xuXG5cdFx0Ly8gSXNzdWUgIzE2MDogb24gaU9TIDcsIHNvbWUgaW5wdXQgZWxlbWVudHMgKGUuZy4gZGF0ZSBkYXRldGltZSBtb250aCkgdGhyb3cgYSB2YWd1ZSBUeXBlRXJyb3Igb24gc2V0U2VsZWN0aW9uUmFuZ2UuIFRoZXNlIGVsZW1lbnRzIGRvbid0IGhhdmUgYW4gaW50ZWdlciB2YWx1ZSBmb3IgdGhlIHNlbGVjdGlvblN0YXJ0IGFuZCBzZWxlY3Rpb25FbmQgcHJvcGVydGllcywgYnV0IHVuZm9ydHVuYXRlbHkgdGhhdCBjYW4ndCBiZSB1c2VkIGZvciBkZXRlY3Rpb24gYmVjYXVzZSBhY2Nlc3NpbmcgdGhlIHByb3BlcnRpZXMgYWxzbyB0aHJvd3MgYSBUeXBlRXJyb3IuIEp1c3QgY2hlY2sgdGhlIHR5cGUgaW5zdGVhZC4gRmlsZWQgYXMgQXBwbGUgYnVnICMxNTEyMjcyNC5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgdGFyZ2V0RWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZSAmJiB0YXJnZXRFbGVtZW50LnR5cGUuaW5kZXhPZignZGF0ZScpICE9PSAwICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ3RpbWUnICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ21vbnRoJykge1xuXHRcdFx0bGVuZ3RoID0gdGFyZ2V0RWxlbWVudC52YWx1ZS5sZW5ndGg7XG5cdFx0XHR0YXJnZXRFbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKGxlbmd0aCwgbGVuZ3RoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5mb2N1cygpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIGEgc2Nyb2xsYWJsZSBsYXllciBhbmQgaWYgc28sIHNldCBhIGZsYWcgb24gaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS51cGRhdGVTY3JvbGxQYXJlbnQgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cdFx0dmFyIHNjcm9sbFBhcmVudCwgcGFyZW50RWxlbWVudDtcblxuXHRcdHNjcm9sbFBhcmVudCA9IHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXG5cdFx0Ly8gQXR0ZW1wdCB0byBkaXNjb3ZlciB3aGV0aGVyIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgc2Nyb2xsYWJsZSBsYXllci4gUmUtY2hlY2sgaWYgdGhlXG5cdFx0Ly8gdGFyZ2V0IGVsZW1lbnQgd2FzIG1vdmVkIHRvIGFub3RoZXIgcGFyZW50LlxuXHRcdGlmICghc2Nyb2xsUGFyZW50IHx8ICFzY3JvbGxQYXJlbnQuY29udGFpbnModGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdHBhcmVudEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAocGFyZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgPiBwYXJlbnRFbGVtZW50Lm9mZnNldEhlaWdodCkge1xuXHRcdFx0XHRcdHNjcm9sbFBhcmVudCA9IHBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0dGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQgPSBwYXJlbnRFbGVtZW50O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcblx0XHRcdH0gd2hpbGUgKHBhcmVudEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdC8vIEFsd2F5cyB1cGRhdGUgdGhlIHNjcm9sbCB0b3AgdHJhY2tlciBpZiBwb3NzaWJsZS5cblx0XHRpZiAoc2Nyb2xsUGFyZW50KSB7XG5cdFx0XHRzY3JvbGxQYXJlbnQuZmFzdENsaWNrTGFzdFNjcm9sbFRvcCA9IHNjcm9sbFBhcmVudC5zY3JvbGxUb3A7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8RXZlbnRUYXJnZXR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQgPSBmdW5jdGlvbihldmVudFRhcmdldCkge1xuXG5cdFx0Ly8gT24gc29tZSBvbGRlciBicm93c2VycyAobm90YWJseSBTYWZhcmkgb24gaU9TIDQuMSAtIHNlZSBpc3N1ZSAjNTYpIHRoZSBldmVudCB0YXJnZXQgbWF5IGJlIGEgdGV4dCBub2RlLlxuXHRcdGlmIChldmVudFRhcmdldC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdHJldHVybiBldmVudFRhcmdldC5wYXJlbnROb2RlO1xuXHRcdH1cblxuXHRcdHJldHVybiBldmVudFRhcmdldDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBzdGFydCwgcmVjb3JkIHRoZSBwb3NpdGlvbiBhbmQgc2Nyb2xsIG9mZnNldC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRhcmdldEVsZW1lbnQsIHRvdWNoLCBzZWxlY3Rpb247XG5cblx0XHQvLyBJZ25vcmUgbXVsdGlwbGUgdG91Y2hlcywgb3RoZXJ3aXNlIHBpbmNoLXRvLXpvb20gaXMgcHJldmVudGVkIGlmIGJvdGggZmluZ2VycyBhcmUgb24gdGhlIEZhc3RDbGljayBlbGVtZW50IChpc3N1ZSAjMTExKS5cblx0XHRpZiAoZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHR0YXJnZXRFbGVtZW50ID0gdGhpcy5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0KGV2ZW50LnRhcmdldCk7XG5cdFx0dG91Y2ggPSBldmVudC50YXJnZXRUb3VjaGVzWzBdO1xuXG5cdFx0aWYgKGRldmljZUlzSU9TKSB7XG5cblx0XHRcdC8vIE9ubHkgdHJ1c3RlZCBldmVudHMgd2lsbCBkZXNlbGVjdCB0ZXh0IG9uIGlPUyAoaXNzdWUgIzQ5KVxuXHRcdFx0c2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuXHRcdFx0aWYgKHNlbGVjdGlvbi5yYW5nZUNvdW50ICYmICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghZGV2aWNlSXNJT1M0KSB7XG5cblx0XHRcdFx0Ly8gV2VpcmQgdGhpbmdzIGhhcHBlbiBvbiBpT1Mgd2hlbiBhbiBhbGVydCBvciBjb25maXJtIGRpYWxvZyBpcyBvcGVuZWQgZnJvbSBhIGNsaWNrIGV2ZW50IGNhbGxiYWNrIChpc3N1ZSAjMjMpOlxuXHRcdFx0XHQvLyB3aGVuIHRoZSB1c2VyIG5leHQgdGFwcyBhbnl3aGVyZSBlbHNlIG9uIHRoZSBwYWdlLCBuZXcgdG91Y2hzdGFydCBhbmQgdG91Y2hlbmQgZXZlbnRzIGFyZSBkaXNwYXRjaGVkXG5cdFx0XHRcdC8vIHdpdGggdGhlIHNhbWUgaWRlbnRpZmllciBhcyB0aGUgdG91Y2ggZXZlbnQgdGhhdCBwcmV2aW91c2x5IHRyaWdnZXJlZCB0aGUgY2xpY2sgdGhhdCB0cmlnZ2VyZWQgdGhlIGFsZXJ0LlxuXHRcdFx0XHQvLyBTYWRseSwgdGhlcmUgaXMgYW4gaXNzdWUgb24gaU9TIDQgdGhhdCBjYXVzZXMgc29tZSBub3JtYWwgdG91Y2ggZXZlbnRzIHRvIGhhdmUgdGhlIHNhbWUgaWRlbnRpZmllciBhcyBhblxuXHRcdFx0XHQvLyBpbW1lZGlhdGVseSBwcmVjZWVkaW5nIHRvdWNoIGV2ZW50IChpc3N1ZSAjNTIpLCBzbyB0aGlzIGZpeCBpcyB1bmF2YWlsYWJsZSBvbiB0aGF0IHBsYXRmb3JtLlxuXHRcdFx0XHQvLyBJc3N1ZSAxMjA6IHRvdWNoLmlkZW50aWZpZXIgaXMgMCB3aGVuIENocm9tZSBkZXYgdG9vbHMgJ0VtdWxhdGUgdG91Y2ggZXZlbnRzJyBpcyBzZXQgd2l0aCBhbiBpT1MgZGV2aWNlIFVBIHN0cmluZyxcblx0XHRcdFx0Ly8gd2hpY2ggY2F1c2VzIGFsbCB0b3VjaCBldmVudHMgdG8gYmUgaWdub3JlZC4gQXMgdGhpcyBibG9jayBvbmx5IGFwcGxpZXMgdG8gaU9TLCBhbmQgaU9TIGlkZW50aWZpZXJzIGFyZSBhbHdheXMgbG9uZyxcblx0XHRcdFx0Ly8gcmFuZG9tIGludGVnZXJzLCBpdCdzIHNhZmUgdG8gdG8gY29udGludWUgaWYgdGhlIGlkZW50aWZpZXIgaXMgMCBoZXJlLlxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAmJiB0b3VjaC5pZGVudGlmaWVyID09PSB0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIpIHtcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMubGFzdFRvdWNoSWRlbnRpZmllciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgYSBzY3JvbGxhYmxlIGxheWVyICh1c2luZyAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2gpIGFuZDpcblx0XHRcdFx0Ly8gMSkgdGhlIHVzZXIgZG9lcyBhIGZsaW5nIHNjcm9sbCBvbiB0aGUgc2Nyb2xsYWJsZSBsYXllclxuXHRcdFx0XHQvLyAyKSB0aGUgdXNlciBzdG9wcyB0aGUgZmxpbmcgc2Nyb2xsIHdpdGggYW5vdGhlciB0YXBcblx0XHRcdFx0Ly8gdGhlbiB0aGUgZXZlbnQudGFyZ2V0IG9mIHRoZSBsYXN0ICd0b3VjaGVuZCcgZXZlbnQgd2lsbCBiZSB0aGUgZWxlbWVudCB0aGF0IHdhcyB1bmRlciB0aGUgdXNlcidzIGZpbmdlclxuXHRcdFx0XHQvLyB3aGVuIHRoZSBmbGluZyBzY3JvbGwgd2FzIHN0YXJ0ZWQsIGNhdXNpbmcgRmFzdENsaWNrIHRvIHNlbmQgYSBjbGljayBldmVudCB0byB0aGF0IGxheWVyIC0gdW5sZXNzIGEgY2hlY2tcblx0XHRcdFx0Ly8gaXMgbWFkZSB0byBlbnN1cmUgdGhhdCBhIHBhcmVudCBsYXllciB3YXMgbm90IHNjcm9sbGVkIGJlZm9yZSBzZW5kaW5nIGEgc3ludGhldGljIGNsaWNrIChpc3N1ZSAjNDIpLlxuXHRcdFx0XHR0aGlzLnVwZGF0ZVNjcm9sbFBhcmVudCh0YXJnZXRFbGVtZW50KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSB0cnVlO1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gZXZlbnQudGltZVN0YW1wO1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cblx0XHR0aGlzLnRvdWNoU3RhcnRYID0gdG91Y2gucGFnZVg7XG5cdFx0dGhpcy50b3VjaFN0YXJ0WSA9IHRvdWNoLnBhZ2VZO1xuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEJhc2VkIG9uIGEgdG91Y2htb3ZlIGV2ZW50IG9iamVjdCwgY2hlY2sgd2hldGhlciB0aGUgdG91Y2ggaGFzIG1vdmVkIHBhc3QgYSBib3VuZGFyeSBzaW5jZSBpdCBzdGFydGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUudG91Y2hIYXNNb3ZlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0sIGJvdW5kYXJ5ID0gdGhpcy50b3VjaEJvdW5kYXJ5O1xuXG5cdFx0aWYgKE1hdGguYWJzKHRvdWNoLnBhZ2VYIC0gdGhpcy50b3VjaFN0YXJ0WCkgPiBib3VuZGFyeSB8fCBNYXRoLmFicyh0b3VjaC5wYWdlWSAtIHRoaXMudG91Y2hTdGFydFkpID4gYm91bmRhcnkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGxhc3QgcG9zaXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoTW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKCF0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSB0b3VjaCBoYXMgbW92ZWQsIGNhbmNlbCB0aGUgY2xpY2sgdHJhY2tpbmdcblx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50ICE9PSB0aGlzLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQoZXZlbnQudGFyZ2V0KSB8fCB0aGlzLnRvdWNoSGFzTW92ZWQoZXZlbnQpKSB7XG5cdFx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogQXR0ZW1wdCB0byBmaW5kIHRoZSBsYWJlbGxlZCBjb250cm9sIGZvciB0aGUgZ2l2ZW4gbGFiZWwgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxIVE1MTGFiZWxFbGVtZW50fSBsYWJlbEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8bnVsbH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZmluZENvbnRyb2wgPSBmdW5jdGlvbihsYWJlbEVsZW1lbnQpIHtcblxuXHRcdC8vIEZhc3QgcGF0aCBmb3IgbmV3ZXIgYnJvd3NlcnMgc3VwcG9ydGluZyB0aGUgSFRNTDUgY29udHJvbCBhdHRyaWJ1dGVcblx0XHRpZiAobGFiZWxFbGVtZW50LmNvbnRyb2wgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIGxhYmVsRWxlbWVudC5jb250cm9sO1xuXHRcdH1cblxuXHRcdC8vIEFsbCBicm93c2VycyB1bmRlciB0ZXN0IHRoYXQgc3VwcG9ydCB0b3VjaCBldmVudHMgYWxzbyBzdXBwb3J0IHRoZSBIVE1MNSBodG1sRm9yIGF0dHJpYnV0ZVxuXHRcdGlmIChsYWJlbEVsZW1lbnQuaHRtbEZvcikge1xuXHRcdFx0cmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGxhYmVsRWxlbWVudC5odG1sRm9yKTtcblx0XHR9XG5cblx0XHQvLyBJZiBubyBmb3IgYXR0cmlidXRlIGV4aXN0cywgYXR0ZW1wdCB0byByZXRyaWV2ZSB0aGUgZmlyc3QgbGFiZWxsYWJsZSBkZXNjZW5kYW50IGVsZW1lbnRcblx0XHQvLyB0aGUgbGlzdCBvZiB3aGljaCBpcyBkZWZpbmVkIGhlcmU6IGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjY2F0ZWdvcnktbGFiZWxcblx0XHRyZXR1cm4gbGFiZWxFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbiwgaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pLCBrZXlnZW4sIG1ldGVyLCBvdXRwdXQsIHByb2dyZXNzLCBzZWxlY3QsIHRleHRhcmVhJyk7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggZW5kLCBkZXRlcm1pbmUgd2hldGhlciB0byBzZW5kIGEgY2xpY2sgZXZlbnQgYXQgb25jZS5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hFbmQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBmb3JFbGVtZW50LCB0cmFja2luZ0NsaWNrU3RhcnQsIHRhcmdldFRhZ05hbWUsIHNjcm9sbFBhcmVudCwgdG91Y2gsIHRhcmdldEVsZW1lbnQgPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cblx0XHRpZiAoIXRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHR0aGlzLmNhbmNlbE5leHRDbGljayA9IHRydWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0KSA+IHRoaXMudGFwVGltZW91dCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUmVzZXQgdG8gcHJldmVudCB3cm9uZyBjbGljayBjYW5jZWwgb24gaW5wdXQgKGlzc3VlICMxNTYpLlxuXHRcdHRoaXMuY2FuY2VsTmV4dENsaWNrID0gZmFsc2U7XG5cblx0XHR0aGlzLmxhc3RDbGlja1RpbWUgPSBldmVudC50aW1lU3RhbXA7XG5cblx0XHR0cmFja2luZ0NsaWNrU3RhcnQgPSB0aGlzLnRyYWNraW5nQ2xpY2tTdGFydDtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblx0XHQvLyBPbiBzb21lIGlPUyBkZXZpY2VzLCB0aGUgdGFyZ2V0RWxlbWVudCBzdXBwbGllZCB3aXRoIHRoZSBldmVudCBpcyBpbnZhbGlkIGlmIHRoZSBsYXllclxuXHRcdC8vIGlzIHBlcmZvcm1pbmcgYSB0cmFuc2l0aW9uIG9yIHNjcm9sbCwgYW5kIGhhcyB0byBiZSByZS1kZXRlY3RlZCBtYW51YWxseS4gTm90ZSB0aGF0XG5cdFx0Ly8gZm9yIHRoaXMgdG8gZnVuY3Rpb24gY29ycmVjdGx5LCBpdCBtdXN0IGJlIGNhbGxlZCAqYWZ0ZXIqIHRoZSBldmVudCB0YXJnZXQgaXMgY2hlY2tlZCFcblx0XHQvLyBTZWUgaXNzdWUgIzU3OyBhbHNvIGZpbGVkIGFzIHJkYXI6Ly8xMzA0ODU4OSAuXG5cdFx0aWYgKGRldmljZUlzSU9TV2l0aEJhZFRhcmdldCkge1xuXHRcdFx0dG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0Ly8gSW4gY2VydGFpbiBjYXNlcyBhcmd1bWVudHMgb2YgZWxlbWVudEZyb21Qb2ludCBjYW4gYmUgbmVnYXRpdmUsIHNvIHByZXZlbnQgc2V0dGluZyB0YXJnZXRFbGVtZW50IHRvIG51bGxcblx0XHRcdHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLnBhZ2VYIC0gd2luZG93LnBhZ2VYT2Zmc2V0LCB0b3VjaC5wYWdlWSAtIHdpbmRvdy5wYWdlWU9mZnNldCkgfHwgdGFyZ2V0RWxlbWVudDtcblx0XHRcdHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50ID0gdGhpcy50YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblx0XHR9XG5cblx0XHR0YXJnZXRUYWdOYW1lID0gdGFyZ2V0RWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHRhcmdldFRhZ05hbWUgPT09ICdsYWJlbCcpIHtcblx0XHRcdGZvckVsZW1lbnQgPSB0aGlzLmZpbmRDb250cm9sKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0aWYgKGZvckVsZW1lbnQpIHtcblx0XHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRhcmdldEVsZW1lbnQgPSBmb3JFbGVtZW50O1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGhpcy5uZWVkc0ZvY3VzKHRhcmdldEVsZW1lbnQpKSB7XG5cblx0XHRcdC8vIENhc2UgMTogSWYgdGhlIHRvdWNoIHN0YXJ0ZWQgYSB3aGlsZSBhZ28gKGJlc3QgZ3Vlc3MgaXMgMTAwbXMgYmFzZWQgb24gdGVzdHMgZm9yIGlzc3VlICMzNikgdGhlbiBmb2N1cyB3aWxsIGJlIHRyaWdnZXJlZCBhbnl3YXkuIFJldHVybiBlYXJseSBhbmQgdW5zZXQgdGhlIHRhcmdldCBlbGVtZW50IHJlZmVyZW5jZSBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IGNsaWNrIHdpbGwgYmUgYWxsb3dlZCB0aHJvdWdoLlxuXHRcdFx0Ly8gQ2FzZSAyOiBXaXRob3V0IHRoaXMgZXhjZXB0aW9uIGZvciBpbnB1dCBlbGVtZW50cyB0YXBwZWQgd2hlbiB0aGUgZG9jdW1lbnQgaXMgY29udGFpbmVkIGluIGFuIGlmcmFtZSwgdGhlbiBhbnkgaW5wdXR0ZWQgdGV4dCB3b24ndCBiZSB2aXNpYmxlIGV2ZW4gdGhvdWdoIHRoZSB2YWx1ZSBhdHRyaWJ1dGUgaXMgdXBkYXRlZCBhcyB0aGUgdXNlciB0eXBlcyAoaXNzdWUgIzM3KS5cblx0XHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdHJhY2tpbmdDbGlja1N0YXJ0KSA+IDEwMCB8fCAoZGV2aWNlSXNJT1MgJiYgd2luZG93LnRvcCAhPT0gd2luZG93ICYmIHRhcmdldFRhZ05hbWUgPT09ICdpbnB1dCcpKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdHRoaXMuc2VuZENsaWNrKHRhcmdldEVsZW1lbnQsIGV2ZW50KTtcblxuXHRcdFx0Ly8gU2VsZWN0IGVsZW1lbnRzIG5lZWQgdGhlIGV2ZW50IHRvIGdvIHRocm91Z2ggb24gaU9TIDQsIG90aGVyd2lzZSB0aGUgc2VsZWN0b3IgbWVudSB3b24ndCBvcGVuLlxuXHRcdFx0Ly8gQWxzbyB0aGlzIGJyZWFrcyBvcGVuaW5nIHNlbGVjdHMgd2hlbiBWb2ljZU92ZXIgaXMgYWN0aXZlIG9uIGlPUzYsIGlPUzcgKGFuZCBwb3NzaWJseSBvdGhlcnMpXG5cdFx0XHRpZiAoIWRldmljZUlzSU9TIHx8IHRhcmdldFRhZ05hbWUgIT09ICdzZWxlY3QnKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgIWRldmljZUlzSU9TNCkge1xuXG5cdFx0XHQvLyBEb24ndCBzZW5kIGEgc3ludGhldGljIGNsaWNrIGV2ZW50IGlmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgcGFyZW50IGxheWVyIHRoYXQgd2FzIHNjcm9sbGVkXG5cdFx0XHQvLyBhbmQgdGhpcyB0YXAgaXMgYmVpbmcgdXNlZCB0byBzdG9wIHRoZSBzY3JvbGxpbmcgKHVzdWFsbHkgaW5pdGlhdGVkIGJ5IGEgZmxpbmcgLSBpc3N1ZSAjNDIpLlxuXHRcdFx0c2Nyb2xsUGFyZW50ID0gdGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cdFx0XHRpZiAoc2Nyb2xsUGFyZW50ICYmIHNjcm9sbFBhcmVudC5mYXN0Q2xpY2tMYXN0U2Nyb2xsVG9wICE9PSBzY3JvbGxQYXJlbnQuc2Nyb2xsVG9wKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFByZXZlbnQgdGhlIGFjdHVhbCBjbGljayBmcm9tIGdvaW5nIHRob3VnaCAtIHVubGVzcyB0aGUgdGFyZ2V0IG5vZGUgaXMgbWFya2VkIGFzIHJlcXVpcmluZ1xuXHRcdC8vIHJlYWwgY2xpY2tzIG9yIGlmIGl0IGlzIGluIHRoZSB3aGl0ZWxpc3QgaW4gd2hpY2ggY2FzZSBvbmx5IG5vbi1wcm9ncmFtbWF0aWMgY2xpY2tzIGFyZSBwZXJtaXR0ZWQuXG5cdFx0aWYgKCF0aGlzLm5lZWRzQ2xpY2sodGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNlbmRDbGljayh0YXJnZXRFbGVtZW50LCBldmVudCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIGNhbmNlbCwgc3RvcCB0cmFja2luZyB0aGUgY2xpY2suXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoQ2FuY2VsID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgbW91c2UgZXZlbnRzIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbk1vdXNlID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuXHRcdC8vIElmIGEgdGFyZ2V0IGVsZW1lbnQgd2FzIG5ldmVyIHNldCAoYmVjYXVzZSBhIHRvdWNoIGV2ZW50IHdhcyBuZXZlciBmaXJlZCkgYWxsb3cgdGhlIGV2ZW50XG5cdFx0aWYgKCF0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChldmVudC5mb3J3YXJkZWRUb3VjaEV2ZW50KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBQcm9ncmFtbWF0aWNhbGx5IGdlbmVyYXRlZCBldmVudHMgdGFyZ2V0aW5nIGEgc3BlY2lmaWMgZWxlbWVudCBzaG91bGQgYmUgcGVybWl0dGVkXG5cdFx0aWYgKCFldmVudC5jYW5jZWxhYmxlKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBEZXJpdmUgYW5kIGNoZWNrIHRoZSB0YXJnZXQgZWxlbWVudCB0byBzZWUgd2hldGhlciB0aGUgbW91c2UgZXZlbnQgbmVlZHMgdG8gYmUgcGVybWl0dGVkO1xuXHRcdC8vIHVubGVzcyBleHBsaWNpdGx5IGVuYWJsZWQsIHByZXZlbnQgbm9uLXRvdWNoIGNsaWNrIGV2ZW50cyBmcm9tIHRyaWdnZXJpbmcgYWN0aW9ucyxcblx0XHQvLyB0byBwcmV2ZW50IGdob3N0L2RvdWJsZWNsaWNrcy5cblx0XHRpZiAoIXRoaXMubmVlZHNDbGljayh0aGlzLnRhcmdldEVsZW1lbnQpIHx8IHRoaXMuY2FuY2VsTmV4dENsaWNrKSB7XG5cblx0XHRcdC8vIFByZXZlbnQgYW55IHVzZXItYWRkZWQgbGlzdGVuZXJzIGRlY2xhcmVkIG9uIEZhc3RDbGljayBlbGVtZW50IGZyb20gYmVpbmcgZmlyZWQuXG5cdFx0XHRpZiAoZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKSB7XG5cdFx0XHRcdGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBQYXJ0IG9mIHRoZSBoYWNrIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgRXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIChlLmcuIEFuZHJvaWQgMilcblx0XHRcdFx0ZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FuY2VsIHRoZSBldmVudFxuXHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIG1vdXNlIGV2ZW50IGlzIHBlcm1pdHRlZCwgcmV0dXJuIHRydWUgZm9yIHRoZSBhY3Rpb24gdG8gZ28gdGhyb3VnaC5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiBhY3R1YWwgY2xpY2tzLCBkZXRlcm1pbmUgd2hldGhlciB0aGlzIGlzIGEgdG91Y2gtZ2VuZXJhdGVkIGNsaWNrLCBhIGNsaWNrIGFjdGlvbiBvY2N1cnJpbmdcblx0ICogbmF0dXJhbGx5IGFmdGVyIGEgZGVsYXkgYWZ0ZXIgYSB0b3VjaCAod2hpY2ggbmVlZHMgdG8gYmUgY2FuY2VsbGVkIHRvIGF2b2lkIGR1cGxpY2F0aW9uKSwgb3Jcblx0ICogYW4gYWN0dWFsIGNsaWNrIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgcGVybWl0dGVkO1xuXG5cdFx0Ly8gSXQncyBwb3NzaWJsZSBmb3IgYW5vdGhlciBGYXN0Q2xpY2stbGlrZSBsaWJyYXJ5IGRlbGl2ZXJlZCB3aXRoIHRoaXJkLXBhcnR5IGNvZGUgdG8gZmlyZSBhIGNsaWNrIGV2ZW50IGJlZm9yZSBGYXN0Q2xpY2sgZG9lcyAoaXNzdWUgIzQ0KS4gSW4gdGhhdCBjYXNlLCBzZXQgdGhlIGNsaWNrLXRyYWNraW5nIGZsYWcgYmFjayB0byBmYWxzZSBhbmQgcmV0dXJuIGVhcmx5LiBUaGlzIHdpbGwgY2F1c2Ugb25Ub3VjaEVuZCB0byByZXR1cm4gZWFybHkuXG5cdFx0aWYgKHRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gVmVyeSBvZGQgYmVoYXZpb3VyIG9uIGlPUyAoaXNzdWUgIzE4KTogaWYgYSBzdWJtaXQgZWxlbWVudCBpcyBwcmVzZW50IGluc2lkZSBhIGZvcm0gYW5kIHRoZSB1c2VyIGhpdHMgZW50ZXIgaW4gdGhlIGlPUyBzaW11bGF0b3Igb3IgY2xpY2tzIHRoZSBHbyBidXR0b24gb24gdGhlIHBvcC11cCBPUyBrZXlib2FyZCB0aGUgYSBraW5kIG9mICdmYWtlJyBjbGljayBldmVudCB3aWxsIGJlIHRyaWdnZXJlZCB3aXRoIHRoZSBzdWJtaXQtdHlwZSBpbnB1dCBlbGVtZW50IGFzIHRoZSB0YXJnZXQuXG5cdFx0aWYgKGV2ZW50LnRhcmdldC50eXBlID09PSAnc3VibWl0JyAmJiBldmVudC5kZXRhaWwgPT09IDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHBlcm1pdHRlZCA9IHRoaXMub25Nb3VzZShldmVudCk7XG5cblx0XHQvLyBPbmx5IHVuc2V0IHRhcmdldEVsZW1lbnQgaWYgdGhlIGNsaWNrIGlzIG5vdCBwZXJtaXR0ZWQuIFRoaXMgd2lsbCBlbnN1cmUgdGhhdCB0aGUgY2hlY2sgZm9yICF0YXJnZXRFbGVtZW50IGluIG9uTW91c2UgZmFpbHMgYW5kIHRoZSBicm93c2VyJ3MgY2xpY2sgZG9lc24ndCBnbyB0aHJvdWdoLlxuXHRcdGlmICghcGVybWl0dGVkKSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIElmIGNsaWNrcyBhcmUgcGVybWl0dGVkLCByZXR1cm4gdHJ1ZSBmb3IgdGhlIGFjdGlvbiB0byBnbyB0aHJvdWdoLlxuXHRcdHJldHVybiBwZXJtaXR0ZWQ7XG5cdH07XG5cblxuXHQvKipcblx0ICogUmVtb3ZlIGFsbCBGYXN0Q2xpY2sncyBldmVudCBsaXN0ZW5lcnMuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxheWVyID0gdGhpcy5sYXllcjtcblxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRydWUpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmUsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5vblRvdWNoQ2FuY2VsLCBmYWxzZSk7XG5cdH07XG5cblxuXHQvKipcblx0ICogQ2hlY2sgd2hldGhlciBGYXN0Q2xpY2sgaXMgbmVlZGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICovXG5cdEZhc3RDbGljay5ub3ROZWVkZWQgPSBmdW5jdGlvbihsYXllcikge1xuXHRcdHZhciBtZXRhVmlld3BvcnQ7XG5cdFx0dmFyIGNocm9tZVZlcnNpb247XG5cdFx0dmFyIGJsYWNrYmVycnlWZXJzaW9uO1xuXHRcdHZhciBmaXJlZm94VmVyc2lvbjtcblxuXHRcdC8vIERldmljZXMgdGhhdCBkb24ndCBzdXBwb3J0IHRvdWNoIGRvbid0IG5lZWQgRmFzdENsaWNrXG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gQ2hyb21lIHZlcnNpb24gLSB6ZXJvIGZvciBvdGhlciBicm93c2Vyc1xuXHRcdGNocm9tZVZlcnNpb24gPSArKC9DaHJvbWVcXC8oWzAtOV0rKS8uZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBbLDBdKVsxXTtcblxuXHRcdGlmIChjaHJvbWVWZXJzaW9uKSB7XG5cblx0XHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXG5cdFx0XHRcdGlmIChtZXRhVmlld3BvcnQpIHtcblx0XHRcdFx0XHQvLyBDaHJvbWUgb24gQW5kcm9pZCB3aXRoIHVzZXItc2NhbGFibGU9XCJub1wiIGRvZXNuJ3QgbmVlZCBGYXN0Q2xpY2sgKGlzc3VlICM4OSlcblx0XHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIENocm9tZSAzMiBhbmQgYWJvdmUgd2l0aCB3aWR0aD1kZXZpY2Utd2lkdGggb3IgbGVzcyBkb24ndCBuZWVkIEZhc3RDbGlja1xuXHRcdFx0XHRcdGlmIChjaHJvbWVWZXJzaW9uID4gMzEgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hyb21lIGRlc2t0b3AgZG9lc24ndCBuZWVkIEZhc3RDbGljayAoaXNzdWUgIzE1KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGRldmljZUlzQmxhY2tCZXJyeTEwKSB7XG5cdFx0XHRibGFja2JlcnJ5VmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1ZlcnNpb25cXC8oWzAtOV0qKVxcLihbMC05XSopLyk7XG5cblx0XHRcdC8vIEJsYWNrQmVycnkgMTAuMysgZG9lcyBub3QgcmVxdWlyZSBGYXN0Y2xpY2sgbGlicmFyeS5cblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mdGxhYnMvZmFzdGNsaWNrL2lzc3Vlcy8yNTFcblx0XHRcdGlmIChibGFja2JlcnJ5VmVyc2lvblsxXSA+PSAxMCAmJiBibGFja2JlcnJ5VmVyc2lvblsyXSA+PSAzKSB7XG5cdFx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblxuXHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0Ly8gdXNlci1zY2FsYWJsZT1ubyBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gd2lkdGg9ZGV2aWNlLXdpZHRoIChvciBsZXNzIHRoYW4gZGV2aWNlLXdpZHRoKSBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElFMTAgd2l0aCAtbXMtdG91Y2gtYWN0aW9uOiBub25lIG9yIG1hbmlwdWxhdGlvbiwgd2hpY2ggZGlzYWJsZXMgZG91YmxlLXRhcC10by16b29tIChpc3N1ZSAjOTcpXG5cdFx0aWYgKGxheWVyLnN0eWxlLm1zVG91Y2hBY3Rpb24gPT09ICdub25lJyB8fCBsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ21hbmlwdWxhdGlvbicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIEZpcmVmb3ggdmVyc2lvbiAtIHplcm8gZm9yIG90aGVyIGJyb3dzZXJzXG5cdFx0ZmlyZWZveFZlcnNpb24gPSArKC9GaXJlZm94XFwvKFswLTldKykvLmV4ZWMobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgWywwXSlbMV07XG5cblx0XHRpZiAoZmlyZWZveFZlcnNpb24gPj0gMjcpIHtcblx0XHRcdC8vIEZpcmVmb3ggMjcrIGRvZXMgbm90IGhhdmUgdGFwIGRlbGF5IGlmIHRoZSBjb250ZW50IGlzIG5vdCB6b29tYWJsZSAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkyMjg5NlxuXG5cdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cdFx0XHRpZiAobWV0YVZpZXdwb3J0ICYmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSUUxMTogcHJlZml4ZWQgLW1zLXRvdWNoLWFjdGlvbiBpcyBubyBsb25nZXIgc3VwcG9ydGVkIGFuZCBpdCdzIHJlY29tZW5kZWQgdG8gdXNlIG5vbi1wcmVmaXhlZCB2ZXJzaW9uXG5cdFx0Ly8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L3dpbmRvd3MvYXBwcy9IaDc2NzMxMy5hc3B4XG5cdFx0aWYgKGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbm9uZScgfHwgbGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdtYW5pcHVsYXRpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgZm9yIGNyZWF0aW5nIGEgRmFzdENsaWNrIG9iamVjdFxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcblx0ICovXG5cdEZhc3RDbGljay5hdHRhY2ggPSBmdW5jdGlvbihsYXllciwgb3B0aW9ucykge1xuXHRcdHJldHVybiBuZXcgRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKTtcblx0fTtcblxuXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIEZhc3RDbGljaztcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRmFzdENsaWNrLmF0dGFjaDtcblx0XHRtb2R1bGUuZXhwb3J0cy5GYXN0Q2xpY2sgPSBGYXN0Q2xpY2s7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LkZhc3RDbGljayA9IEZhc3RDbGljaztcblx0fVxufSgpKTtcbiIsIi8qISBIYW1tZXIuSlMgLSB2Mi4wLjcgLSAyMDE2LTA0LTIyXG4gKiBodHRwOi8vaGFtbWVyanMuZ2l0aHViLmlvL1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBKb3JpayBUYW5nZWxkZXI7XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgKi9cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCBleHBvcnROYW1lLCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG52YXIgVkVORE9SX1BSRUZJWEVTID0gWycnLCAnd2Via2l0JywgJ01veicsICdNUycsICdtcycsICdvJ107XG52YXIgVEVTVF9FTEVNRU5UID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciBUWVBFX0ZVTkNUSU9OID0gJ2Z1bmN0aW9uJztcblxudmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcbnZhciBhYnMgPSBNYXRoLmFicztcbnZhciBub3cgPSBEYXRlLm5vdztcblxuLyoqXG4gKiBzZXQgYSB0aW1lb3V0IHdpdGggYSBnaXZlbiBzY29wZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0XG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gc2V0VGltZW91dENvbnRleHQoZm4sIHRpbWVvdXQsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChiaW5kRm4oZm4sIGNvbnRleHQpLCB0aW1lb3V0KTtcbn1cblxuLyoqXG4gKiBpZiB0aGUgYXJndW1lbnQgaXMgYW4gYXJyYXksIHdlIHdhbnQgdG8gZXhlY3V0ZSB0aGUgZm4gb24gZWFjaCBlbnRyeVxuICogaWYgaXQgYWludCBhbiBhcnJheSB3ZSBkb24ndCB3YW50IHRvIGRvIGEgdGhpbmcuXG4gKiB0aGlzIGlzIHVzZWQgYnkgYWxsIHRoZSBtZXRob2RzIHRoYXQgYWNjZXB0IGEgc2luZ2xlIGFuZCBhcnJheSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7KnxBcnJheX0gYXJnXG4gKiBAcGFyYW0ge1N0cmluZ30gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF1cbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBpbnZva2VBcnJheUFyZyhhcmcsIGZuLCBjb250ZXh0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBlYWNoKGFyZywgY29udGV4dFtmbl0sIGNvbnRleHQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIHdhbGsgb2JqZWN0cyBhbmQgYXJyYXlzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRvclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gZWFjaChvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGk7XG5cbiAgICBpZiAoIW9iaikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9iai5mb3JFYWNoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgICAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eShpKSAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiB3cmFwIGEgbWV0aG9kIHdpdGggYSBkZXByZWNhdGlvbiB3YXJuaW5nIGFuZCBzdGFjayB0cmFjZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gd3JhcHBpbmcgdGhlIHN1cHBsaWVkIG1ldGhvZC5cbiAqL1xuZnVuY3Rpb24gZGVwcmVjYXRlKG1ldGhvZCwgbmFtZSwgbWVzc2FnZSkge1xuICAgIHZhciBkZXByZWNhdGlvbk1lc3NhZ2UgPSAnREVQUkVDQVRFRCBNRVRIT0Q6ICcgKyBuYW1lICsgJ1xcbicgKyBtZXNzYWdlICsgJyBBVCBcXG4nO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoJ2dldC1zdGFjay10cmFjZScpO1xuICAgICAgICB2YXIgc3RhY2sgPSBlICYmIGUuc3RhY2sgPyBlLnN0YWNrLnJlcGxhY2UoL15bXlxcKF0rP1tcXG4kXS9nbSwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXlxccythdFxccysvZ20sICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL15PYmplY3QuPGFub255bW91cz5cXHMqXFwoL2dtLCAne2Fub255bW91c30oKUAnKSA6ICdVbmtub3duIFN0YWNrIFRyYWNlJztcblxuICAgICAgICB2YXIgbG9nID0gd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLndhcm4gfHwgd2luZG93LmNvbnNvbGUubG9nKTtcbiAgICAgICAgaWYgKGxvZykge1xuICAgICAgICAgICAgbG9nLmNhbGwod2luZG93LmNvbnNvbGUsIGRlcHJlY2F0aW9uTWVzc2FnZSwgc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIGV4dGVuZCBvYmplY3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgaW4gZGVzdCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSBvbmVzIGluIHNyYy5cbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBvYmplY3RzX3RvX2Fzc2lnblxuICogQHJldHVybnMge09iamVjdH0gdGFyZ2V0XG4gKi9cbnZhciBhc3NpZ247XG5pZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT09ICdmdW5jdGlvbicpIHtcbiAgICBhc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0KSB7XG4gICAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCB8fCB0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG91dHB1dCA9IE9iamVjdCh0YXJnZXQpO1xuICAgICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShuZXh0S2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgYXNzaWduID0gT2JqZWN0LmFzc2lnbjtcbn1cblxuLyoqXG4gKiBleHRlbmQgb2JqZWN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIGluIGRlc3Qgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGUgb25lcyBpbiBzcmMuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHBhcmFtIHtCb29sZWFufSBbbWVyZ2U9ZmFsc2VdXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBkZXN0XG4gKi9cbnZhciBleHRlbmQgPSBkZXByZWNhdGUoZnVuY3Rpb24gZXh0ZW5kKGRlc3QsIHNyYywgbWVyZ2UpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFtZXJnZSB8fCAobWVyZ2UgJiYgZGVzdFtrZXlzW2ldXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgZGVzdFtrZXlzW2ldXSA9IHNyY1trZXlzW2ldXTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufSwgJ2V4dGVuZCcsICdVc2UgYGFzc2lnbmAuJyk7XG5cbi8qKlxuICogbWVyZ2UgdGhlIHZhbHVlcyBmcm9tIHNyYyBpbiB0aGUgZGVzdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyB0aGF0IGV4aXN0IGluIGRlc3Qgd2lsbCBub3QgYmUgb3ZlcndyaXR0ZW4gYnkgc3JjXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHJldHVybnMge09iamVjdH0gZGVzdFxuICovXG52YXIgbWVyZ2UgPSBkZXByZWNhdGUoZnVuY3Rpb24gbWVyZ2UoZGVzdCwgc3JjKSB7XG4gICAgcmV0dXJuIGV4dGVuZChkZXN0LCBzcmMsIHRydWUpO1xufSwgJ21lcmdlJywgJ1VzZSBgYXNzaWduYC4nKTtcblxuLyoqXG4gKiBzaW1wbGUgY2xhc3MgaW5oZXJpdGFuY2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNoaWxkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBiYXNlXG4gKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXNdXG4gKi9cbmZ1bmN0aW9uIGluaGVyaXQoY2hpbGQsIGJhc2UsIHByb3BlcnRpZXMpIHtcbiAgICB2YXIgYmFzZVAgPSBiYXNlLnByb3RvdHlwZSxcbiAgICAgICAgY2hpbGRQO1xuXG4gICAgY2hpbGRQID0gY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShiYXNlUCk7XG4gICAgY2hpbGRQLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgY2hpbGRQLl9zdXBlciA9IGJhc2VQO1xuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgYXNzaWduKGNoaWxkUCwgcHJvcGVydGllcyk7XG4gICAgfVxufVxuXG4vKipcbiAqIHNpbXBsZSBmdW5jdGlvbiBiaW5kXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gYmluZEZuKGZuLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGJvdW5kRm4oKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8qKlxuICogbGV0IGEgYm9vbGVhbiB2YWx1ZSBhbHNvIGJlIGEgZnVuY3Rpb24gdGhhdCBtdXN0IHJldHVybiBhIGJvb2xlYW5cbiAqIHRoaXMgZmlyc3QgaXRlbSBpbiBhcmdzIHdpbGwgYmUgdXNlZCBhcyB0aGUgY29udGV4dFxuICogQHBhcmFtIHtCb29sZWFufEZ1bmN0aW9ufSB2YWxcbiAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGJvb2xPckZuKHZhbCwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsID09IFRZUEVfRlVOQ1RJT04pIHtcbiAgICAgICAgcmV0dXJuIHZhbC5hcHBseShhcmdzID8gYXJnc1swXSB8fCB1bmRlZmluZWQgOiB1bmRlZmluZWQsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIHVzZSB0aGUgdmFsMiB3aGVuIHZhbDEgaXMgdW5kZWZpbmVkXG4gKiBAcGFyYW0geyp9IHZhbDFcbiAqIEBwYXJhbSB7Kn0gdmFsMlxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGlmVW5kZWZpbmVkKHZhbDEsIHZhbDIpIHtcbiAgICByZXR1cm4gKHZhbDEgPT09IHVuZGVmaW5lZCkgPyB2YWwyIDogdmFsMTtcbn1cblxuLyoqXG4gKiBhZGRFdmVudExpc3RlbmVyIHdpdGggbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2VcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKHRhcmdldCwgdHlwZXMsIGhhbmRsZXIpIHtcbiAgICBlYWNoKHNwbGl0U3RyKHR5cGVzKSwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogcmVtb3ZlRXZlbnRMaXN0ZW5lciB3aXRoIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICovXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyh0YXJnZXQsIHR5cGVzLCBoYW5kbGVyKSB7XG4gICAgZWFjaChzcGxpdFN0cih0eXBlcyksIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIGZpbmQgaWYgYSBub2RlIGlzIGluIHRoZSBnaXZlbiBwYXJlbnRcbiAqIEBtZXRob2QgaGFzUGFyZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBwYXJlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIGhhc1BhcmVudChub2RlLCBwYXJlbnQpIHtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBzbWFsbCBpbmRleE9mIHdyYXBwZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaW5kXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gZm91bmRcbiAqL1xuZnVuY3Rpb24gaW5TdHIoc3RyLCBmaW5kKSB7XG4gICAgcmV0dXJuIHN0ci5pbmRleE9mKGZpbmQpID4gLTE7XG59XG5cbi8qKlxuICogc3BsaXQgc3RyaW5nIG9uIHdoaXRlc3BhY2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtBcnJheX0gd29yZHNcbiAqL1xuZnVuY3Rpb24gc3BsaXRTdHIoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XG59XG5cbi8qKlxuICogZmluZCBpZiBhIGFycmF5IGNvbnRhaW5zIHRoZSBvYmplY3QgdXNpbmcgaW5kZXhPZiBvciBhIHNpbXBsZSBwb2x5RmlsbFxuICogQHBhcmFtIHtBcnJheX0gc3JjXG4gKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICogQHBhcmFtIHtTdHJpbmd9IFtmaW5kQnlLZXldXG4gKiBAcmV0dXJuIHtCb29sZWFufE51bWJlcn0gZmFsc2Ugd2hlbiBub3QgZm91bmQsIG9yIHRoZSBpbmRleFxuICovXG5mdW5jdGlvbiBpbkFycmF5KHNyYywgZmluZCwgZmluZEJ5S2V5KSB7XG4gICAgaWYgKHNyYy5pbmRleE9mICYmICFmaW5kQnlLZXkpIHtcbiAgICAgICAgcmV0dXJuIHNyYy5pbmRleE9mKGZpbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoKGZpbmRCeUtleSAmJiBzcmNbaV1bZmluZEJ5S2V5XSA9PSBmaW5kKSB8fCAoIWZpbmRCeUtleSAmJiBzcmNbaV0gPT09IGZpbmQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbn1cblxuLyoqXG4gKiBjb252ZXJ0IGFycmF5LWxpa2Ugb2JqZWN0cyB0byByZWFsIGFycmF5c1xuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybnMge0FycmF5fVxuICovXG5mdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmosIDApO1xufVxuXG4vKipcbiAqIHVuaXF1ZSBhcnJheSB3aXRoIG9iamVjdHMgYmFzZWQgb24gYSBrZXkgKGxpa2UgJ2lkJykgb3IganVzdCBieSB0aGUgYXJyYXkncyB2YWx1ZVxuICogQHBhcmFtIHtBcnJheX0gc3JjIFt7aWQ6MX0se2lkOjJ9LHtpZDoxfV1cbiAqIEBwYXJhbSB7U3RyaW5nfSBba2V5XVxuICogQHBhcmFtIHtCb29sZWFufSBbc29ydD1GYWxzZV1cbiAqIEByZXR1cm5zIHtBcnJheX0gW3tpZDoxfSx7aWQ6Mn1dXG4gKi9cbmZ1bmN0aW9uIHVuaXF1ZUFycmF5KHNyYywga2V5LCBzb3J0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgdmFsdWVzID0gW107XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWwgPSBrZXkgPyBzcmNbaV1ba2V5XSA6IHNyY1tpXTtcbiAgICAgICAgaWYgKGluQXJyYXkodmFsdWVzLCB2YWwpIDwgMCkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHNyY1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzW2ldID0gdmFsO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoZnVuY3Rpb24gc29ydFVuaXF1ZUFycmF5KGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYVtrZXldID4gYltrZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBnZXQgdGhlIHByZWZpeGVkIHByb3BlcnR5XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAqIEByZXR1cm5zIHtTdHJpbmd8VW5kZWZpbmVkfSBwcmVmaXhlZFxuICovXG5mdW5jdGlvbiBwcmVmaXhlZChvYmosIHByb3BlcnR5KSB7XG4gICAgdmFyIHByZWZpeCwgcHJvcDtcbiAgICB2YXIgY2FtZWxQcm9wID0gcHJvcGVydHlbMF0udG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnNsaWNlKDEpO1xuXG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgVkVORE9SX1BSRUZJWEVTLmxlbmd0aCkge1xuICAgICAgICBwcmVmaXggPSBWRU5ET1JfUFJFRklYRVNbaV07XG4gICAgICAgIHByb3AgPSAocHJlZml4KSA/IHByZWZpeCArIGNhbWVsUHJvcCA6IHByb3BlcnR5O1xuXG4gICAgICAgIGlmIChwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIGdldCBhIHVuaXF1ZSBpZFxuICogQHJldHVybnMge251bWJlcn0gdW5pcXVlSWRcbiAqL1xudmFyIF91bmlxdWVJZCA9IDE7XG5mdW5jdGlvbiB1bmlxdWVJZCgpIHtcbiAgICByZXR1cm4gX3VuaXF1ZUlkKys7XG59XG5cbi8qKlxuICogZ2V0IHRoZSB3aW5kb3cgb2JqZWN0IG9mIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEByZXR1cm5zIHtEb2N1bWVudFZpZXd8V2luZG93fVxuICovXG5mdW5jdGlvbiBnZXRXaW5kb3dGb3JFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB2YXIgZG9jID0gZWxlbWVudC5vd25lckRvY3VtZW50IHx8IGVsZW1lbnQ7XG4gICAgcmV0dXJuIChkb2MuZGVmYXVsdFZpZXcgfHwgZG9jLnBhcmVudFdpbmRvdyB8fCB3aW5kb3cpO1xufVxuXG52YXIgTU9CSUxFX1JFR0VYID0gL21vYmlsZXx0YWJsZXR8aXAoYWR8aG9uZXxvZCl8YW5kcm9pZC9pO1xuXG52YXIgU1VQUE9SVF9UT1VDSCA9ICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpO1xudmFyIFNVUFBPUlRfUE9JTlRFUl9FVkVOVFMgPSBwcmVmaXhlZCh3aW5kb3csICdQb2ludGVyRXZlbnQnKSAhPT0gdW5kZWZpbmVkO1xudmFyIFNVUFBPUlRfT05MWV9UT1VDSCA9IFNVUFBPUlRfVE9VQ0ggJiYgTU9CSUxFX1JFR0VYLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbnZhciBJTlBVVF9UWVBFX1RPVUNIID0gJ3RvdWNoJztcbnZhciBJTlBVVF9UWVBFX1BFTiA9ICdwZW4nO1xudmFyIElOUFVUX1RZUEVfTU9VU0UgPSAnbW91c2UnO1xudmFyIElOUFVUX1RZUEVfS0lORUNUID0gJ2tpbmVjdCc7XG5cbnZhciBDT01QVVRFX0lOVEVSVkFMID0gMjU7XG5cbnZhciBJTlBVVF9TVEFSVCA9IDE7XG52YXIgSU5QVVRfTU9WRSA9IDI7XG52YXIgSU5QVVRfRU5EID0gNDtcbnZhciBJTlBVVF9DQU5DRUwgPSA4O1xuXG52YXIgRElSRUNUSU9OX05PTkUgPSAxO1xudmFyIERJUkVDVElPTl9MRUZUID0gMjtcbnZhciBESVJFQ1RJT05fUklHSFQgPSA0O1xudmFyIERJUkVDVElPTl9VUCA9IDg7XG52YXIgRElSRUNUSU9OX0RPV04gPSAxNjtcblxudmFyIERJUkVDVElPTl9IT1JJWk9OVEFMID0gRElSRUNUSU9OX0xFRlQgfCBESVJFQ1RJT05fUklHSFQ7XG52YXIgRElSRUNUSU9OX1ZFUlRJQ0FMID0gRElSRUNUSU9OX1VQIHwgRElSRUNUSU9OX0RPV047XG52YXIgRElSRUNUSU9OX0FMTCA9IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMO1xuXG52YXIgUFJPUFNfWFkgPSBbJ3gnLCAneSddO1xudmFyIFBST1BTX0NMSUVOVF9YWSA9IFsnY2xpZW50WCcsICdjbGllbnRZJ107XG5cbi8qKlxuICogY3JlYXRlIG5ldyBpbnB1dCB0eXBlIG1hbmFnZXJcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtJbnB1dH1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnB1dChtYW5hZ2VyLCBjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICB0aGlzLmVsZW1lbnQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgdGhpcy50YXJnZXQgPSBtYW5hZ2VyLm9wdGlvbnMuaW5wdXRUYXJnZXQ7XG5cbiAgICAvLyBzbWFsbGVyIHdyYXBwZXIgYXJvdW5kIHRoZSBoYW5kbGVyLCBmb3IgdGhlIHNjb3BlIGFuZCB0aGUgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgbWFuYWdlcixcbiAgICAvLyBzbyB3aGVuIGRpc2FibGVkIHRoZSBpbnB1dCBldmVudHMgYXJlIGNvbXBsZXRlbHkgYnlwYXNzZWQuXG4gICAgdGhpcy5kb21IYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKGJvb2xPckZuKG1hbmFnZXIub3B0aW9ucy5lbmFibGUsIFttYW5hZ2VyXSkpIHtcbiAgICAgICAgICAgIHNlbGYuaGFuZGxlcihldik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5pbml0KCk7XG5cbn1cblxuSW5wdXQucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNob3VsZCBoYW5kbGUgdGhlIGlucHV0RXZlbnQgZGF0YSBhbmQgdHJpZ2dlciB0aGUgY2FsbGJhY2tcbiAgICAgKiBAdmlydHVhbFxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiBhZGRFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVuYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiByZW1vdmVFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBjcmVhdGUgbmV3IGlucHV0IHR5cGUgbWFuYWdlclxuICogY2FsbGVkIGJ5IHRoZSBNYW5hZ2VyIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0hhbW1lcn0gbWFuYWdlclxuICogQHJldHVybnMge0lucHV0fVxuICovXG5mdW5jdGlvbiBjcmVhdGVJbnB1dEluc3RhbmNlKG1hbmFnZXIpIHtcbiAgICB2YXIgVHlwZTtcbiAgICB2YXIgaW5wdXRDbGFzcyA9IG1hbmFnZXIub3B0aW9ucy5pbnB1dENsYXNzO1xuXG4gICAgaWYgKGlucHV0Q2xhc3MpIHtcbiAgICAgICAgVHlwZSA9IGlucHV0Q2xhc3M7XG4gICAgfSBlbHNlIGlmIChTVVBQT1JUX1BPSU5URVJfRVZFTlRTKSB7XG4gICAgICAgIFR5cGUgPSBQb2ludGVyRXZlbnRJbnB1dDtcbiAgICB9IGVsc2UgaWYgKFNVUFBPUlRfT05MWV9UT1VDSCkge1xuICAgICAgICBUeXBlID0gVG91Y2hJbnB1dDtcbiAgICB9IGVsc2UgaWYgKCFTVVBQT1JUX1RPVUNIKSB7XG4gICAgICAgIFR5cGUgPSBNb3VzZUlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIFR5cGUgPSBUb3VjaE1vdXNlSW5wdXQ7XG4gICAgfVxuICAgIHJldHVybiBuZXcgKFR5cGUpKG1hbmFnZXIsIGlucHV0SGFuZGxlcik7XG59XG5cbi8qKlxuICogaGFuZGxlIGlucHV0IGV2ZW50c1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRUeXBlXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gaW5wdXRIYW5kbGVyKG1hbmFnZXIsIGV2ZW50VHlwZSwgaW5wdXQpIHtcbiAgICB2YXIgcG9pbnRlcnNMZW4gPSBpbnB1dC5wb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGNoYW5nZWRQb2ludGVyc0xlbiA9IGlucHV0LmNoYW5nZWRQb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGlzRmlyc3QgPSAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG4gICAgdmFyIGlzRmluYWwgPSAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG5cbiAgICBpbnB1dC5pc0ZpcnN0ID0gISFpc0ZpcnN0O1xuICAgIGlucHV0LmlzRmluYWwgPSAhIWlzRmluYWw7XG5cbiAgICBpZiAoaXNGaXJzdCkge1xuICAgICAgICBtYW5hZ2VyLnNlc3Npb24gPSB7fTtcbiAgICB9XG5cbiAgICAvLyBzb3VyY2UgZXZlbnQgaXMgdGhlIG5vcm1hbGl6ZWQgdmFsdWUgb2YgdGhlIGRvbUV2ZW50c1xuICAgIC8vIGxpa2UgJ3RvdWNoc3RhcnQsIG1vdXNldXAsIHBvaW50ZXJkb3duJ1xuICAgIGlucHV0LmV2ZW50VHlwZSA9IGV2ZW50VHlwZTtcblxuICAgIC8vIGNvbXB1dGUgc2NhbGUsIHJvdGF0aW9uIGV0Y1xuICAgIGNvbXB1dGVJbnB1dERhdGEobWFuYWdlciwgaW5wdXQpO1xuXG4gICAgLy8gZW1pdCBzZWNyZXQgZXZlbnRcbiAgICBtYW5hZ2VyLmVtaXQoJ2hhbW1lci5pbnB1dCcsIGlucHV0KTtcblxuICAgIG1hbmFnZXIucmVjb2duaXplKGlucHV0KTtcbiAgICBtYW5hZ2VyLnNlc3Npb24ucHJldklucHV0ID0gaW5wdXQ7XG59XG5cbi8qKlxuICogZXh0ZW5kIHRoZSBkYXRhIHdpdGggc29tZSB1c2FibGUgcHJvcGVydGllcyBsaWtlIHNjYWxlLCByb3RhdGUsIHZlbG9jaXR5IGV0Y1xuICogQHBhcmFtIHtPYmplY3R9IG1hbmFnZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBjb21wdXRlSW5wdXREYXRhKG1hbmFnZXIsIGlucHV0KSB7XG4gICAgdmFyIHNlc3Npb24gPSBtYW5hZ2VyLnNlc3Npb247XG4gICAgdmFyIHBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnM7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gc3RvcmUgdGhlIGZpcnN0IGlucHV0IHRvIGNhbGN1bGF0ZSB0aGUgZGlzdGFuY2UgYW5kIGRpcmVjdGlvblxuICAgIGlmICghc2Vzc2lvbi5maXJzdElucHV0KSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RJbnB1dCA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9XG5cbiAgICAvLyB0byBjb21wdXRlIHNjYWxlIGFuZCByb3RhdGlvbiB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBtdWx0aXBsZSB0b3VjaGVzXG4gICAgaWYgKHBvaW50ZXJzTGVuZ3RoID4gMSAmJiAhc2Vzc2lvbi5maXJzdE11bHRpcGxlKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXJzTGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaXJzdElucHV0ID0gc2Vzc2lvbi5maXJzdElucHV0O1xuICAgIHZhciBmaXJzdE11bHRpcGxlID0gc2Vzc2lvbi5maXJzdE11bHRpcGxlO1xuICAgIHZhciBvZmZzZXRDZW50ZXIgPSBmaXJzdE11bHRpcGxlID8gZmlyc3RNdWx0aXBsZS5jZW50ZXIgOiBmaXJzdElucHV0LmNlbnRlcjtcblxuICAgIHZhciBjZW50ZXIgPSBpbnB1dC5jZW50ZXIgPSBnZXRDZW50ZXIocG9pbnRlcnMpO1xuICAgIGlucHV0LnRpbWVTdGFtcCA9IG5vdygpO1xuICAgIGlucHV0LmRlbHRhVGltZSA9IGlucHV0LnRpbWVTdGFtcCAtIGZpcnN0SW5wdXQudGltZVN0YW1wO1xuXG4gICAgaW5wdXQuYW5nbGUgPSBnZXRBbmdsZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG4gICAgaW5wdXQuZGlzdGFuY2UgPSBnZXREaXN0YW5jZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG5cbiAgICBjb21wdXRlRGVsdGFYWShzZXNzaW9uLCBpbnB1dCk7XG4gICAgaW5wdXQub2Zmc2V0RGlyZWN0aW9uID0gZ2V0RGlyZWN0aW9uKGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcblxuICAgIHZhciBvdmVyYWxsVmVsb2NpdHkgPSBnZXRWZWxvY2l0eShpbnB1dC5kZWx0YVRpbWUsIGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHlYID0gb3ZlcmFsbFZlbG9jaXR5Lng7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5WSA9IG92ZXJhbGxWZWxvY2l0eS55O1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eSA9IChhYnMob3ZlcmFsbFZlbG9jaXR5LngpID4gYWJzKG92ZXJhbGxWZWxvY2l0eS55KSkgPyBvdmVyYWxsVmVsb2NpdHkueCA6IG92ZXJhbGxWZWxvY2l0eS55O1xuXG4gICAgaW5wdXQuc2NhbGUgPSBmaXJzdE11bHRpcGxlID8gZ2V0U2NhbGUoZmlyc3RNdWx0aXBsZS5wb2ludGVycywgcG9pbnRlcnMpIDogMTtcbiAgICBpbnB1dC5yb3RhdGlvbiA9IGZpcnN0TXVsdGlwbGUgPyBnZXRSb3RhdGlvbihmaXJzdE11bHRpcGxlLnBvaW50ZXJzLCBwb2ludGVycykgOiAwO1xuXG4gICAgaW5wdXQubWF4UG9pbnRlcnMgPSAhc2Vzc2lvbi5wcmV2SW5wdXQgPyBpbnB1dC5wb2ludGVycy5sZW5ndGggOiAoKGlucHV0LnBvaW50ZXJzLmxlbmd0aCA+XG4gICAgICAgIHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKSA/IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA6IHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKTtcblxuICAgIGNvbXB1dGVJbnRlcnZhbElucHV0RGF0YShzZXNzaW9uLCBpbnB1dCk7XG5cbiAgICAvLyBmaW5kIHRoZSBjb3JyZWN0IHRhcmdldFxuICAgIHZhciB0YXJnZXQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgaWYgKGhhc1BhcmVudChpbnB1dC5zcmNFdmVudC50YXJnZXQsIHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0ID0gaW5wdXQuc3JjRXZlbnQudGFyZ2V0O1xuICAgIH1cbiAgICBpbnB1dC50YXJnZXQgPSB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZWx0YVhZKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGNlbnRlciA9IGlucHV0LmNlbnRlcjtcbiAgICB2YXIgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSB8fCB7fTtcbiAgICB2YXIgcHJldkRlbHRhID0gc2Vzc2lvbi5wcmV2RGVsdGEgfHwge307XG4gICAgdmFyIHByZXZJbnB1dCA9IHNlc3Npb24ucHJldklucHV0IHx8IHt9O1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfU1RBUlQgfHwgcHJldklucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfRU5EKSB7XG4gICAgICAgIHByZXZEZWx0YSA9IHNlc3Npb24ucHJldkRlbHRhID0ge1xuICAgICAgICAgICAgeDogcHJldklucHV0LmRlbHRhWCB8fCAwLFxuICAgICAgICAgICAgeTogcHJldklucHV0LmRlbHRhWSB8fCAwXG4gICAgICAgIH07XG5cbiAgICAgICAgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSA9IHtcbiAgICAgICAgICAgIHg6IGNlbnRlci54LFxuICAgICAgICAgICAgeTogY2VudGVyLnlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpbnB1dC5kZWx0YVggPSBwcmV2RGVsdGEueCArIChjZW50ZXIueCAtIG9mZnNldC54KTtcbiAgICBpbnB1dC5kZWx0YVkgPSBwcmV2RGVsdGEueSArIChjZW50ZXIueSAtIG9mZnNldC55KTtcbn1cblxuLyoqXG4gKiB2ZWxvY2l0eSBpcyBjYWxjdWxhdGVkIGV2ZXJ5IHggbXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBzZXNzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUludGVydmFsSW5wdXREYXRhKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGxhc3QgPSBzZXNzaW9uLmxhc3RJbnRlcnZhbCB8fCBpbnB1dCxcbiAgICAgICAgZGVsdGFUaW1lID0gaW5wdXQudGltZVN0YW1wIC0gbGFzdC50aW1lU3RhbXAsXG4gICAgICAgIHZlbG9jaXR5LCB2ZWxvY2l0eVgsIHZlbG9jaXR5WSwgZGlyZWN0aW9uO1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9DQU5DRUwgJiYgKGRlbHRhVGltZSA+IENPTVBVVEVfSU5URVJWQUwgfHwgbGFzdC52ZWxvY2l0eSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICB2YXIgZGVsdGFYID0gaW5wdXQuZGVsdGFYIC0gbGFzdC5kZWx0YVg7XG4gICAgICAgIHZhciBkZWx0YVkgPSBpbnB1dC5kZWx0YVkgLSBsYXN0LmRlbHRhWTtcblxuICAgICAgICB2YXIgdiA9IGdldFZlbG9jaXR5KGRlbHRhVGltZSwgZGVsdGFYLCBkZWx0YVkpO1xuICAgICAgICB2ZWxvY2l0eVggPSB2Lng7XG4gICAgICAgIHZlbG9jaXR5WSA9IHYueTtcbiAgICAgICAgdmVsb2NpdHkgPSAoYWJzKHYueCkgPiBhYnModi55KSkgPyB2LnggOiB2Lnk7XG4gICAgICAgIGRpcmVjdGlvbiA9IGdldERpcmVjdGlvbihkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgc2Vzc2lvbi5sYXN0SW50ZXJ2YWwgPSBpbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1c2UgbGF0ZXN0IHZlbG9jaXR5IGluZm8gaWYgaXQgZG9lc24ndCBvdmVydGFrZSBhIG1pbmltdW0gcGVyaW9kXG4gICAgICAgIHZlbG9jaXR5ID0gbGFzdC52ZWxvY2l0eTtcbiAgICAgICAgdmVsb2NpdHlYID0gbGFzdC52ZWxvY2l0eVg7XG4gICAgICAgIHZlbG9jaXR5WSA9IGxhc3QudmVsb2NpdHlZO1xuICAgICAgICBkaXJlY3Rpb24gPSBsYXN0LmRpcmVjdGlvbjtcbiAgICB9XG5cbiAgICBpbnB1dC52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgIGlucHV0LnZlbG9jaXR5WCA9IHZlbG9jaXR5WDtcbiAgICBpbnB1dC52ZWxvY2l0eVkgPSB2ZWxvY2l0eVk7XG4gICAgaW5wdXQuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xufVxuXG4vKipcbiAqIGNyZWF0ZSBhIHNpbXBsZSBjbG9uZSBmcm9tIHRoZSBpbnB1dCB1c2VkIGZvciBzdG9yYWdlIG9mIGZpcnN0SW5wdXQgYW5kIGZpcnN0TXVsdGlwbGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICogQHJldHVybnMge09iamVjdH0gY2xvbmVkSW5wdXREYXRhXG4gKi9cbmZ1bmN0aW9uIHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KSB7XG4gICAgLy8gbWFrZSBhIHNpbXBsZSBjb3B5IG9mIHRoZSBwb2ludGVycyBiZWNhdXNlIHdlIHdpbGwgZ2V0IGEgcmVmZXJlbmNlIGlmIHdlIGRvbid0XG4gICAgLy8gd2Ugb25seSBuZWVkIGNsaWVudFhZIGZvciB0aGUgY2FsY3VsYXRpb25zXG4gICAgdmFyIHBvaW50ZXJzID0gW107XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgaW5wdXQucG9pbnRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHBvaW50ZXJzW2ldID0ge1xuICAgICAgICAgICAgY2xpZW50WDogcm91bmQoaW5wdXQucG9pbnRlcnNbaV0uY2xpZW50WCksXG4gICAgICAgICAgICBjbGllbnRZOiByb3VuZChpbnB1dC5wb2ludGVyc1tpXS5jbGllbnRZKVxuICAgICAgICB9O1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGltZVN0YW1wOiBub3coKSxcbiAgICAgICAgcG9pbnRlcnM6IHBvaW50ZXJzLFxuICAgICAgICBjZW50ZXI6IGdldENlbnRlcihwb2ludGVycyksXG4gICAgICAgIGRlbHRhWDogaW5wdXQuZGVsdGFYLFxuICAgICAgICBkZWx0YVk6IGlucHV0LmRlbHRhWVxuICAgIH07XG59XG5cbi8qKlxuICogZ2V0IHRoZSBjZW50ZXIgb2YgYWxsIHRoZSBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gcG9pbnRlcnNcbiAqIEByZXR1cm4ge09iamVjdH0gY2VudGVyIGNvbnRhaW5zIGB4YCBhbmQgYHlgIHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gZ2V0Q2VudGVyKHBvaW50ZXJzKSB7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gbm8gbmVlZCB0byBsb29wIHdoZW4gb25seSBvbmUgdG91Y2hcbiAgICBpZiAocG9pbnRlcnNMZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHJvdW5kKHBvaW50ZXJzWzBdLmNsaWVudFgpLFxuICAgICAgICAgICAgeTogcm91bmQocG9pbnRlcnNbMF0uY2xpZW50WSlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgeCA9IDAsIHkgPSAwLCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IHBvaW50ZXJzTGVuZ3RoKSB7XG4gICAgICAgIHggKz0gcG9pbnRlcnNbaV0uY2xpZW50WDtcbiAgICAgICAgeSArPSBwb2ludGVyc1tpXS5jbGllbnRZO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogcm91bmQoeCAvIHBvaW50ZXJzTGVuZ3RoKSxcbiAgICAgICAgeTogcm91bmQoeSAvIHBvaW50ZXJzTGVuZ3RoKVxuICAgIH07XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSB2ZWxvY2l0eSBiZXR3ZWVuIHR3byBwb2ludHMuIHVuaXQgaXMgaW4gcHggcGVyIG1zLlxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhVGltZVxuICogQHBhcmFtIHtOdW1iZXJ9IHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5XG4gKiBAcmV0dXJuIHtPYmplY3R9IHZlbG9jaXR5IGB4YCBhbmQgYHlgXG4gKi9cbmZ1bmN0aW9uIGdldFZlbG9jaXR5KGRlbHRhVGltZSwgeCwgeSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHggLyBkZWx0YVRpbWUgfHwgMCxcbiAgICAgICAgeTogeSAvIGRlbHRhVGltZSB8fCAwXG4gICAgfTtcbn1cblxuLyoqXG4gKiBnZXQgdGhlIGRpcmVjdGlvbiBiZXR3ZWVuIHR3byBwb2ludHNcbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiBAcGFyYW0ge051bWJlcn0geVxuICogQHJldHVybiB7TnVtYmVyfSBkaXJlY3Rpb25cbiAqL1xuZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKHgsIHkpIHtcbiAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICByZXR1cm4gRElSRUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgaWYgKGFicyh4KSA+PSBhYnMoeSkpIHtcbiAgICAgICAgcmV0dXJuIHggPCAwID8gRElSRUNUSU9OX0xFRlQgOiBESVJFQ1RJT05fUklHSFQ7XG4gICAgfVxuICAgIHJldHVybiB5IDwgMCA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgYWJzb2x1dGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gcDEge3gsIHl9XG4gKiBAcGFyYW0ge09iamVjdH0gcDIge3gsIHl9XG4gKiBAcGFyYW0ge0FycmF5fSBbcHJvcHNdIGNvbnRhaW5pbmcgeCBhbmQgeSBrZXlzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGRpc3RhbmNlXG4gKi9cbmZ1bmN0aW9uIGdldERpc3RhbmNlKHAxLCBwMiwgcHJvcHMpIHtcbiAgICBpZiAoIXByb3BzKSB7XG4gICAgICAgIHByb3BzID0gUFJPUFNfWFk7XG4gICAgfVxuICAgIHZhciB4ID0gcDJbcHJvcHNbMF1dIC0gcDFbcHJvcHNbMF1dLFxuICAgICAgICB5ID0gcDJbcHJvcHNbMV1dIC0gcDFbcHJvcHNbMV1dO1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCgoeCAqIHgpICsgKHkgKiB5KSk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byBjb29yZGluYXRlc1xuICogQHBhcmFtIHtPYmplY3R9IHAxXG4gKiBAcGFyYW0ge09iamVjdH0gcDJcbiAqIEBwYXJhbSB7QXJyYXl9IFtwcm9wc10gY29udGFpbmluZyB4IGFuZCB5IGtleXNcbiAqIEByZXR1cm4ge051bWJlcn0gYW5nbGVcbiAqL1xuZnVuY3Rpb24gZ2V0QW5nbGUocDEsIHAyLCBwcm9wcykge1xuICAgIGlmICghcHJvcHMpIHtcbiAgICAgICAgcHJvcHMgPSBQUk9QU19YWTtcbiAgICB9XG4gICAgdmFyIHggPSBwMltwcm9wc1swXV0gLSBwMVtwcm9wc1swXV0sXG4gICAgICAgIHkgPSBwMltwcm9wc1sxXV0gLSBwMVtwcm9wc1sxXV07XG4gICAgcmV0dXJuIE1hdGguYXRhbjIoeSwgeCkgKiAxODAgLyBNYXRoLlBJO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgcm90YXRpb24gZGVncmVlcyBiZXR3ZWVuIHR3byBwb2ludGVyc2V0c1xuICogQHBhcmFtIHtBcnJheX0gc3RhcnQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGVuZCBhcnJheSBvZiBwb2ludGVyc1xuICogQHJldHVybiB7TnVtYmVyfSByb3RhdGlvblxuICovXG5mdW5jdGlvbiBnZXRSb3RhdGlvbihzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGdldEFuZ2xlKGVuZFsxXSwgZW5kWzBdLCBQUk9QU19DTElFTlRfWFkpICsgZ2V0QW5nbGUoc3RhcnRbMV0sIHN0YXJ0WzBdLCBQUk9QU19DTElFTlRfWFkpO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgc2NhbGUgZmFjdG9yIGJldHdlZW4gdHdvIHBvaW50ZXJzZXRzXG4gKiBubyBzY2FsZSBpcyAxLCBhbmQgZ29lcyBkb3duIHRvIDAgd2hlbiBwaW5jaGVkIHRvZ2V0aGVyLCBhbmQgYmlnZ2VyIHdoZW4gcGluY2hlZCBvdXRcbiAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEByZXR1cm4ge051bWJlcn0gc2NhbGVcbiAqL1xuZnVuY3Rpb24gZ2V0U2NhbGUoc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBnZXREaXN0YW5jZShlbmRbMF0sIGVuZFsxXSwgUFJPUFNfQ0xJRU5UX1hZKSAvIGdldERpc3RhbmNlKHN0YXJ0WzBdLCBzdGFydFsxXSwgUFJPUFNfQ0xJRU5UX1hZKTtcbn1cblxudmFyIE1PVVNFX0lOUFVUX01BUCA9IHtcbiAgICBtb3VzZWRvd246IElOUFVUX1NUQVJULFxuICAgIG1vdXNlbW92ZTogSU5QVVRfTU9WRSxcbiAgICBtb3VzZXVwOiBJTlBVVF9FTkRcbn07XG5cbnZhciBNT1VTRV9FTEVNRU5UX0VWRU5UUyA9ICdtb3VzZWRvd24nO1xudmFyIE1PVVNFX1dJTkRPV19FVkVOVFMgPSAnbW91c2Vtb3ZlIG1vdXNldXAnO1xuXG4vKipcbiAqIE1vdXNlIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBNb3VzZUlucHV0KCkge1xuICAgIHRoaXMuZXZFbCA9IE1PVVNFX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBNT1VTRV9XSU5ET1dfRVZFTlRTO1xuXG4gICAgdGhpcy5wcmVzc2VkID0gZmFsc2U7IC8vIG1vdXNlZG93biBzdGF0ZVxuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChNb3VzZUlucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBldmVudHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBNRWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IE1PVVNFX0lOUFVUX01BUFtldi50eXBlXTtcblxuICAgICAgICAvLyBvbiBzdGFydCB3ZSB3YW50IHRvIGhhdmUgdGhlIGxlZnQgbW91c2UgYnV0dG9uIGRvd25cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIGV2LmJ1dHRvbiA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9NT1ZFICYmIGV2LndoaWNoICE9PSAxKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBJTlBVVF9FTkQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtb3VzZSBtdXN0IGJlIGRvd25cbiAgICAgICAgaWYgKCF0aGlzLnByZXNzZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIGV2ZW50VHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9NT1VTRSxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxudmFyIFBPSU5URVJfSU5QVVRfTUFQID0ge1xuICAgIHBvaW50ZXJkb3duOiBJTlBVVF9TVEFSVCxcbiAgICBwb2ludGVybW92ZTogSU5QVVRfTU9WRSxcbiAgICBwb2ludGVydXA6IElOUFVUX0VORCxcbiAgICBwb2ludGVyY2FuY2VsOiBJTlBVVF9DQU5DRUwsXG4gICAgcG9pbnRlcm91dDogSU5QVVRfQ0FOQ0VMXG59O1xuXG4vLyBpbiBJRTEwIHRoZSBwb2ludGVyIHR5cGVzIGlzIGRlZmluZWQgYXMgYW4gZW51bVxudmFyIElFMTBfUE9JTlRFUl9UWVBFX0VOVU0gPSB7XG4gICAgMjogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAzOiBJTlBVVF9UWVBFX1BFTixcbiAgICA0OiBJTlBVVF9UWVBFX01PVVNFLFxuICAgIDU6IElOUFVUX1RZUEVfS0lORUNUIC8vIHNlZSBodHRwczovL3R3aXR0ZXIuY29tL2phY29icm9zc2kvc3RhdHVzLzQ4MDU5NjQzODQ4OTg5MDgxNlxufTtcblxudmFyIFBPSU5URVJfRUxFTUVOVF9FVkVOVFMgPSAncG9pbnRlcmRvd24nO1xudmFyIFBPSU5URVJfV0lORE9XX0VWRU5UUyA9ICdwb2ludGVybW92ZSBwb2ludGVydXAgcG9pbnRlcmNhbmNlbCc7XG5cbi8vIElFMTAgaGFzIHByZWZpeGVkIHN1cHBvcnQsIGFuZCBjYXNlLXNlbnNpdGl2ZVxuaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCAmJiAhd2luZG93LlBvaW50ZXJFdmVudCkge1xuICAgIFBPSU5URVJfRUxFTUVOVF9FVkVOVFMgPSAnTVNQb2ludGVyRG93bic7XG4gICAgUE9JTlRFUl9XSU5ET1dfRVZFTlRTID0gJ01TUG9pbnRlck1vdmUgTVNQb2ludGVyVXAgTVNQb2ludGVyQ2FuY2VsJztcbn1cblxuLyoqXG4gKiBQb2ludGVyIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBQb2ludGVyRXZlbnRJbnB1dCgpIHtcbiAgICB0aGlzLmV2RWwgPSBQT0lOVEVSX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBQT0lOVEVSX1dJTkRPV19FVkVOVFM7XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5zdG9yZSA9ICh0aGlzLm1hbmFnZXIuc2Vzc2lvbi5wb2ludGVyRXZlbnRzID0gW10pO1xufVxuXG5pbmhlcml0KFBvaW50ZXJFdmVudElucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBldmVudHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBQRWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHN0b3JlID0gdGhpcy5zdG9yZTtcbiAgICAgICAgdmFyIHJlbW92ZVBvaW50ZXIgPSBmYWxzZTtcblxuICAgICAgICB2YXIgZXZlbnRUeXBlTm9ybWFsaXplZCA9IGV2LnR5cGUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdtcycsICcnKTtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IFBPSU5URVJfSU5QVVRfTUFQW2V2ZW50VHlwZU5vcm1hbGl6ZWRdO1xuICAgICAgICB2YXIgcG9pbnRlclR5cGUgPSBJRTEwX1BPSU5URVJfVFlQRV9FTlVNW2V2LnBvaW50ZXJUeXBlXSB8fCBldi5wb2ludGVyVHlwZTtcblxuICAgICAgICB2YXIgaXNUb3VjaCA9IChwb2ludGVyVHlwZSA9PSBJTlBVVF9UWVBFX1RPVUNIKTtcblxuICAgICAgICAvLyBnZXQgaW5kZXggb2YgdGhlIGV2ZW50IGluIHRoZSBzdG9yZVxuICAgICAgICB2YXIgc3RvcmVJbmRleCA9IGluQXJyYXkoc3RvcmUsIGV2LnBvaW50ZXJJZCwgJ3BvaW50ZXJJZCcpO1xuXG4gICAgICAgIC8vIHN0YXJ0IGFuZCBtb3VzZSBtdXN0IGJlIGRvd25cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIChldi5idXR0b24gPT09IDAgfHwgaXNUb3VjaCkpIHtcbiAgICAgICAgICAgIGlmIChzdG9yZUluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgIHN0b3JlLnB1c2goZXYpO1xuICAgICAgICAgICAgICAgIHN0b3JlSW5kZXggPSBzdG9yZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgICAgICByZW1vdmVQb2ludGVyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGl0IG5vdCBmb3VuZCwgc28gdGhlIHBvaW50ZXIgaGFzbid0IGJlZW4gZG93biAoc28gaXQncyBwcm9iYWJseSBhIGhvdmVyKVxuICAgICAgICBpZiAoc3RvcmVJbmRleCA8IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZXZlbnQgaW4gdGhlIHN0b3JlXG4gICAgICAgIHN0b3JlW3N0b3JlSW5kZXhdID0gZXY7XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIGV2ZW50VHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHN0b3JlLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiBbZXZdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IHBvaW50ZXJUeXBlLFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZW1vdmVQb2ludGVyKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgZnJvbSB0aGUgc3RvcmVcbiAgICAgICAgICAgIHN0b3JlLnNwbGljZShzdG9yZUluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG52YXIgU0lOR0xFX1RPVUNIX0lOUFVUX01BUCA9IHtcbiAgICB0b3VjaHN0YXJ0OiBJTlBVVF9TVEFSVCxcbiAgICB0b3VjaG1vdmU6IElOUFVUX01PVkUsXG4gICAgdG91Y2hlbmQ6IElOUFVUX0VORCxcbiAgICB0b3VjaGNhbmNlbDogSU5QVVRfQ0FOQ0VMXG59O1xuXG52YXIgU0lOR0xFX1RPVUNIX1RBUkdFVF9FVkVOVFMgPSAndG91Y2hzdGFydCc7XG52YXIgU0lOR0xFX1RPVUNIX1dJTkRPV19FVkVOVFMgPSAndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnO1xuXG4vKipcbiAqIFRvdWNoIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBTaW5nbGVUb3VjaElucHV0KCkge1xuICAgIHRoaXMuZXZUYXJnZXQgPSBTSU5HTEVfVE9VQ0hfVEFSR0VUX0VWRU5UUztcbiAgICB0aGlzLmV2V2luID0gU0lOR0xFX1RPVUNIX1dJTkRPV19FVkVOVFM7XG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFNpbmdsZVRvdWNoSW5wdXQsIElucHV0LCB7XG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVEVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciB0eXBlID0gU0lOR0xFX1RPVUNIX0lOUFVUX01BUFtldi50eXBlXTtcblxuICAgICAgICAvLyBzaG91bGQgd2UgaGFuZGxlIHRoZSB0b3VjaCBldmVudHM/XG4gICAgICAgIGlmICh0eXBlID09PSBJTlBVVF9TVEFSVCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG91Y2hlcyA9IG5vcm1hbGl6ZVNpbmdsZVRvdWNoZXMuY2FsbCh0aGlzLCBldiwgdHlwZSk7XG5cbiAgICAgICAgLy8gd2hlbiBkb25lLCByZXNldCB0aGUgc3RhcnRlZCBzdGF0ZVxuICAgICAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpICYmIHRvdWNoZXNbMF0ubGVuZ3RoIC0gdG91Y2hlc1sxXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIHR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiB0b3VjaGVzWzBdLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiB0b3VjaGVzWzFdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IElOUFVUX1RZUEVfVE9VQ0gsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogQHRoaXMge1RvdWNoSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqIEBwYXJhbSB7TnVtYmVyfSB0eXBlIGZsYWdcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8QXJyYXl9IFthbGwsIGNoYW5nZWRdXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNpbmdsZVRvdWNoZXMoZXYsIHR5cGUpIHtcbiAgICB2YXIgYWxsID0gdG9BcnJheShldi50b3VjaGVzKTtcbiAgICB2YXIgY2hhbmdlZCA9IHRvQXJyYXkoZXYuY2hhbmdlZFRvdWNoZXMpO1xuXG4gICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICBhbGwgPSB1bmlxdWVBcnJheShhbGwuY29uY2F0KGNoYW5nZWQpLCAnaWRlbnRpZmllcicsIHRydWUpO1xuICAgIH1cblxuICAgIHJldHVybiBbYWxsLCBjaGFuZ2VkXTtcbn1cblxudmFyIFRPVUNIX0lOUFVUX01BUCA9IHtcbiAgICB0b3VjaHN0YXJ0OiBJTlBVVF9TVEFSVCxcbiAgICB0b3VjaG1vdmU6IElOUFVUX01PVkUsXG4gICAgdG91Y2hlbmQ6IElOUFVUX0VORCxcbiAgICB0b3VjaGNhbmNlbDogSU5QVVRfQ0FOQ0VMXG59O1xuXG52YXIgVE9VQ0hfVEFSR0VUX0VWRU5UUyA9ICd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCc7XG5cbi8qKlxuICogTXVsdGktdXNlciB0b3VjaCBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gVG91Y2hJbnB1dCgpIHtcbiAgICB0aGlzLmV2VGFyZ2V0ID0gVE9VQ0hfVEFSR0VUX0VWRU5UUztcbiAgICB0aGlzLnRhcmdldElkcyA9IHt9O1xuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChUb3VjaElucHV0LCBJbnB1dCwge1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIE1URWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBUT1VDSF9JTlBVVF9NQVBbZXYudHlwZV07XG4gICAgICAgIHZhciB0b3VjaGVzID0gZ2V0VG91Y2hlcy5jYWxsKHRoaXMsIGV2LCB0eXBlKTtcbiAgICAgICAgaWYgKCF0b3VjaGVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgdHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHRvdWNoZXNbMF0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IHRvdWNoZXNbMV0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBAdGhpcyB7VG91Y2hJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGUgZmxhZ1xuICogQHJldHVybnMge3VuZGVmaW5lZHxBcnJheX0gW2FsbCwgY2hhbmdlZF1cbiAqL1xuZnVuY3Rpb24gZ2V0VG91Y2hlcyhldiwgdHlwZSkge1xuICAgIHZhciBhbGxUb3VjaGVzID0gdG9BcnJheShldi50b3VjaGVzKTtcbiAgICB2YXIgdGFyZ2V0SWRzID0gdGhpcy50YXJnZXRJZHM7XG5cbiAgICAvLyB3aGVuIHRoZXJlIGlzIG9ubHkgb25lIHRvdWNoLCB0aGUgcHJvY2VzcyBjYW4gYmUgc2ltcGxpZmllZFxuICAgIGlmICh0eXBlICYgKElOUFVUX1NUQVJUIHwgSU5QVVRfTU9WRSkgJiYgYWxsVG91Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGFyZ2V0SWRzW2FsbFRvdWNoZXNbMF0uaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gW2FsbFRvdWNoZXMsIGFsbFRvdWNoZXNdO1xuICAgIH1cblxuICAgIHZhciBpLFxuICAgICAgICB0YXJnZXRUb3VjaGVzLFxuICAgICAgICBjaGFuZ2VkVG91Y2hlcyA9IHRvQXJyYXkoZXYuY2hhbmdlZFRvdWNoZXMpLFxuICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlcyA9IFtdLFxuICAgICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldDtcblxuICAgIC8vIGdldCB0YXJnZXQgdG91Y2hlcyBmcm9tIHRvdWNoZXNcbiAgICB0YXJnZXRUb3VjaGVzID0gYWxsVG91Y2hlcy5maWx0ZXIoZnVuY3Rpb24odG91Y2gpIHtcbiAgICAgICAgcmV0dXJuIGhhc1BhcmVudCh0b3VjaC50YXJnZXQsIHRhcmdldCk7XG4gICAgfSk7XG5cbiAgICAvLyBjb2xsZWN0IHRvdWNoZXNcbiAgICBpZiAodHlwZSA9PT0gSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhcmdldElkc1t0YXJnZXRUb3VjaGVzW2ldLmlkZW50aWZpZXJdID0gdHJ1ZTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGZpbHRlciBjaGFuZ2VkIHRvdWNoZXMgdG8gb25seSBjb250YWluIHRvdWNoZXMgdGhhdCBleGlzdCBpbiB0aGUgY29sbGVjdGVkIHRhcmdldCBpZHNcbiAgICBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICBpZiAodGFyZ2V0SWRzW2NoYW5nZWRUb3VjaGVzW2ldLmlkZW50aWZpZXJdKSB7XG4gICAgICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlcy5wdXNoKGNoYW5nZWRUb3VjaGVzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFudXAgcmVtb3ZlZCB0b3VjaGVzXG4gICAgICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0YXJnZXRJZHNbY2hhbmdlZFRvdWNoZXNbaV0uaWRlbnRpZmllcl07XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmICghY2hhbmdlZFRhcmdldFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgICAvLyBtZXJnZSB0YXJnZXRUb3VjaGVzIHdpdGggY2hhbmdlZFRhcmdldFRvdWNoZXMgc28gaXQgY29udGFpbnMgQUxMIHRvdWNoZXMsIGluY2x1ZGluZyAnZW5kJyBhbmQgJ2NhbmNlbCdcbiAgICAgICAgdW5pcXVlQXJyYXkodGFyZ2V0VG91Y2hlcy5jb25jYXQoY2hhbmdlZFRhcmdldFRvdWNoZXMpLCAnaWRlbnRpZmllcicsIHRydWUpLFxuICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlc1xuICAgIF07XG59XG5cbi8qKlxuICogQ29tYmluZWQgdG91Y2ggYW5kIG1vdXNlIGlucHV0XG4gKlxuICogVG91Y2ggaGFzIGEgaGlnaGVyIHByaW9yaXR5IHRoZW4gbW91c2UsIGFuZCB3aGlsZSB0b3VjaGluZyBubyBtb3VzZSBldmVudHMgYXJlIGFsbG93ZWQuXG4gKiBUaGlzIGJlY2F1c2UgdG91Y2ggZGV2aWNlcyBhbHNvIGVtaXQgbW91c2UgZXZlbnRzIHdoaWxlIGRvaW5nIGEgdG91Y2guXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5cbnZhciBERURVUF9USU1FT1VUID0gMjUwMDtcbnZhciBERURVUF9ESVNUQU5DRSA9IDI1O1xuXG5mdW5jdGlvbiBUb3VjaE1vdXNlSW5wdXQoKSB7XG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHZhciBoYW5kbGVyID0gYmluZEZuKHRoaXMuaGFuZGxlciwgdGhpcyk7XG4gICAgdGhpcy50b3VjaCA9IG5ldyBUb3VjaElucHV0KHRoaXMubWFuYWdlciwgaGFuZGxlcik7XG4gICAgdGhpcy5tb3VzZSA9IG5ldyBNb3VzZUlucHV0KHRoaXMubWFuYWdlciwgaGFuZGxlcik7XG5cbiAgICB0aGlzLnByaW1hcnlUb3VjaCA9IG51bGw7XG4gICAgdGhpcy5sYXN0VG91Y2hlcyA9IFtdO1xufVxuXG5pbmhlcml0KFRvdWNoTW91c2VJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgYW5kIHRvdWNoIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7SGFtbWVyfSBtYW5hZ2VyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlucHV0RXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVE1FaGFuZGxlcihtYW5hZ2VyLCBpbnB1dEV2ZW50LCBpbnB1dERhdGEpIHtcbiAgICAgICAgdmFyIGlzVG91Y2ggPSAoaW5wdXREYXRhLnBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfVE9VQ0gpLFxuICAgICAgICAgICAgaXNNb3VzZSA9IChpbnB1dERhdGEucG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9NT1VTRSk7XG5cbiAgICAgICAgaWYgKGlzTW91c2UgJiYgaW5wdXREYXRhLnNvdXJjZUNhcGFiaWxpdGllcyAmJiBpbnB1dERhdGEuc291cmNlQ2FwYWJpbGl0aWVzLmZpcmVzVG91Y2hFdmVudHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoZW4gd2UncmUgaW4gYSB0b3VjaCBldmVudCwgcmVjb3JkIHRvdWNoZXMgdG8gIGRlLWR1cGUgc3ludGhldGljIG1vdXNlIGV2ZW50XG4gICAgICAgIGlmIChpc1RvdWNoKSB7XG4gICAgICAgICAgICByZWNvcmRUb3VjaGVzLmNhbGwodGhpcywgaW5wdXRFdmVudCwgaW5wdXREYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc01vdXNlICYmIGlzU3ludGhldGljRXZlbnQuY2FsbCh0aGlzLCBpbnB1dERhdGEpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKG1hbmFnZXIsIGlucHV0RXZlbnQsIGlucHV0RGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy50b3VjaC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMubW91c2UuZGVzdHJveSgpO1xuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiByZWNvcmRUb3VjaGVzKGV2ZW50VHlwZSwgZXZlbnREYXRhKSB7XG4gICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSB7XG4gICAgICAgIHRoaXMucHJpbWFyeVRvdWNoID0gZXZlbnREYXRhLmNoYW5nZWRQb2ludGVyc1swXS5pZGVudGlmaWVyO1xuICAgICAgICBzZXRMYXN0VG91Y2guY2FsbCh0aGlzLCBldmVudERhdGEpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgc2V0TGFzdFRvdWNoLmNhbGwodGhpcywgZXZlbnREYXRhKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldExhc3RUb3VjaChldmVudERhdGEpIHtcbiAgICB2YXIgdG91Y2ggPSBldmVudERhdGEuY2hhbmdlZFBvaW50ZXJzWzBdO1xuXG4gICAgaWYgKHRvdWNoLmlkZW50aWZpZXIgPT09IHRoaXMucHJpbWFyeVRvdWNoKSB7XG4gICAgICAgIHZhciBsYXN0VG91Y2ggPSB7eDogdG91Y2guY2xpZW50WCwgeTogdG91Y2guY2xpZW50WX07XG4gICAgICAgIHRoaXMubGFzdFRvdWNoZXMucHVzaChsYXN0VG91Y2gpO1xuICAgICAgICB2YXIgbHRzID0gdGhpcy5sYXN0VG91Y2hlcztcbiAgICAgICAgdmFyIHJlbW92ZUxhc3RUb3VjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGkgPSBsdHMuaW5kZXhPZihsYXN0VG91Y2gpO1xuICAgICAgICAgICAgaWYgKGkgPiAtMSkge1xuICAgICAgICAgICAgICAgIGx0cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNldFRpbWVvdXQocmVtb3ZlTGFzdFRvdWNoLCBERURVUF9USU1FT1VUKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzU3ludGhldGljRXZlbnQoZXZlbnREYXRhKSB7XG4gICAgdmFyIHggPSBldmVudERhdGEuc3JjRXZlbnQuY2xpZW50WCwgeSA9IGV2ZW50RGF0YS5zcmNFdmVudC5jbGllbnRZO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXN0VG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdCA9IHRoaXMubGFzdFRvdWNoZXNbaV07XG4gICAgICAgIHZhciBkeCA9IE1hdGguYWJzKHggLSB0LngpLCBkeSA9IE1hdGguYWJzKHkgLSB0LnkpO1xuICAgICAgICBpZiAoZHggPD0gREVEVVBfRElTVEFOQ0UgJiYgZHkgPD0gREVEVVBfRElTVEFOQ0UpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxudmFyIFBSRUZJWEVEX1RPVUNIX0FDVElPTiA9IHByZWZpeGVkKFRFU1RfRUxFTUVOVC5zdHlsZSwgJ3RvdWNoQWN0aW9uJyk7XG52YXIgTkFUSVZFX1RPVUNIX0FDVElPTiA9IFBSRUZJWEVEX1RPVUNIX0FDVElPTiAhPT0gdW5kZWZpbmVkO1xuXG4vLyBtYWdpY2FsIHRvdWNoQWN0aW9uIHZhbHVlXG52YXIgVE9VQ0hfQUNUSU9OX0NPTVBVVEUgPSAnY29tcHV0ZSc7XG52YXIgVE9VQ0hfQUNUSU9OX0FVVE8gPSAnYXV0byc7XG52YXIgVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTiA9ICdtYW5pcHVsYXRpb24nOyAvLyBub3QgaW1wbGVtZW50ZWRcbnZhciBUT1VDSF9BQ1RJT05fTk9ORSA9ICdub25lJztcbnZhciBUT1VDSF9BQ1RJT05fUEFOX1ggPSAncGFuLXgnO1xudmFyIFRPVUNIX0FDVElPTl9QQU5fWSA9ICdwYW4teSc7XG52YXIgVE9VQ0hfQUNUSU9OX01BUCA9IGdldFRvdWNoQWN0aW9uUHJvcHMoKTtcblxuLyoqXG4gKiBUb3VjaCBBY3Rpb25cbiAqIHNldHMgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5IG9yIHVzZXMgdGhlIGpzIGFsdGVybmF0aXZlXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRvdWNoQWN0aW9uKG1hbmFnZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNldCh2YWx1ZSk7XG59XG5cblRvdWNoQWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHRvdWNoQWN0aW9uIHZhbHVlIG9uIHRoZSBlbGVtZW50IG9yIGVuYWJsZSB0aGUgcG9seWZpbGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIC8vIGZpbmQgb3V0IHRoZSB0b3VjaC1hY3Rpb24gYnkgdGhlIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIGlmICh2YWx1ZSA9PSBUT1VDSF9BQ1RJT05fQ09NUFVURSkge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmNvbXB1dGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChOQVRJVkVfVE9VQ0hfQUNUSU9OICYmIHRoaXMubWFuYWdlci5lbGVtZW50LnN0eWxlICYmIFRPVUNIX0FDVElPTl9NQVBbdmFsdWVdKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZWxlbWVudC5zdHlsZVtQUkVGSVhFRF9UT1VDSF9BQ1RJT05dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hY3Rpb25zID0gdmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGp1c3QgcmUtc2V0IHRoZSB0b3VjaEFjdGlvbiB2YWx1ZVxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0KHRoaXMubWFuYWdlci5vcHRpb25zLnRvdWNoQWN0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY29tcHV0ZSB0aGUgdmFsdWUgZm9yIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eSBiYXNlZCBvbiB0aGUgcmVjb2duaXplcidzIHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBjb21wdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXTtcbiAgICAgICAgZWFjaCh0aGlzLm1hbmFnZXIucmVjb2duaXplcnMsIGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIGlmIChib29sT3JGbihyZWNvZ25pemVyLm9wdGlvbnMuZW5hYmxlLCBbcmVjb2duaXplcl0pKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KHJlY29nbml6ZXIuZ2V0VG91Y2hBY3Rpb24oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucy5qb2luKCcgJykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgb24gZWFjaCBpbnB1dCBjeWNsZSBhbmQgcHJvdmlkZXMgdGhlIHByZXZlbnRpbmcgb2YgdGhlIGJyb3dzZXIgYmVoYXZpb3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdHM6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzcmNFdmVudCA9IGlucHV0LnNyY0V2ZW50O1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gaW5wdXQub2Zmc2V0RGlyZWN0aW9uO1xuXG4gICAgICAgIC8vIGlmIHRoZSB0b3VjaCBhY3Rpb24gZGlkIHByZXZlbnRlZCBvbmNlIHRoaXMgc2Vzc2lvblxuICAgICAgICBpZiAodGhpcy5tYW5hZ2VyLnNlc3Npb24ucHJldmVudGVkKSB7XG4gICAgICAgICAgICBzcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XG4gICAgICAgIHZhciBoYXNOb25lID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpICYmICFUT1VDSF9BQ1RJT05fTUFQW1RPVUNIX0FDVElPTl9OT05FXTtcbiAgICAgICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpICYmICFUT1VDSF9BQ1RJT05fTUFQW1RPVUNIX0FDVElPTl9QQU5fWV07XG4gICAgICAgIHZhciBoYXNQYW5YID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9YKSAmJiAhVE9VQ0hfQUNUSU9OX01BUFtUT1VDSF9BQ1RJT05fUEFOX1hdO1xuXG4gICAgICAgIGlmIChoYXNOb25lKSB7XG4gICAgICAgICAgICAvL2RvIG5vdCBwcmV2ZW50IGRlZmF1bHRzIGlmIHRoaXMgaXMgYSB0YXAgZ2VzdHVyZVxuXG4gICAgICAgICAgICB2YXIgaXNUYXBQb2ludGVyID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSAxO1xuICAgICAgICAgICAgdmFyIGlzVGFwTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IDI7XG4gICAgICAgICAgICB2YXIgaXNUYXBUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCAyNTA7XG5cbiAgICAgICAgICAgIGlmIChpc1RhcFBvaW50ZXIgJiYgaXNUYXBNb3ZlbWVudCAmJiBpc1RhcFRvdWNoVGltZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNQYW5YICYmIGhhc1BhblkpIHtcbiAgICAgICAgICAgIC8vIGBwYW4teCBwYW4teWAgbWVhbnMgYnJvd3NlciBoYW5kbGVzIGFsbCBzY3JvbGxpbmcvcGFubmluZywgZG8gbm90IHByZXZlbnRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNOb25lIHx8XG4gICAgICAgICAgICAoaGFzUGFuWSAmJiBkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkgfHxcbiAgICAgICAgICAgIChoYXNQYW5YICYmIGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZlbnRTcmMoc3JjRXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGwgcHJldmVudERlZmF1bHQgdG8gcHJldmVudCB0aGUgYnJvd3NlcidzIGRlZmF1bHQgYmVoYXZpb3IgKHNjcm9sbGluZyBpbiBtb3N0IGNhc2VzKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNFdmVudFxuICAgICAqL1xuICAgIHByZXZlbnRTcmM6IGZ1bmN0aW9uKHNyY0V2ZW50KSB7XG4gICAgICAgIHRoaXMubWFuYWdlci5zZXNzaW9uLnByZXZlbnRlZCA9IHRydWU7XG4gICAgICAgIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiB3aGVuIHRoZSB0b3VjaEFjdGlvbnMgYXJlIGNvbGxlY3RlZCB0aGV5IGFyZSBub3QgYSB2YWxpZCB2YWx1ZSwgc28gd2UgbmVlZCB0byBjbGVhbiB0aGluZ3MgdXAuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25zXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucykge1xuICAgIC8vIG5vbmVcbiAgICBpZiAoaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICB2YXIgaGFzUGFuWCA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpO1xuXG4gICAgLy8gaWYgYm90aCBwYW4teCBhbmQgcGFuLXkgYXJlIHNldCAoZGlmZmVyZW50IHJlY29nbml6ZXJzXG4gICAgLy8gZm9yIGRpZmZlcmVudCBkaXJlY3Rpb25zLCBlLmcuIGhvcml6b250YWwgcGFuIGJ1dCB2ZXJ0aWNhbCBzd2lwZT8pXG4gICAgLy8gd2UgbmVlZCBub25lIChhcyBvdGhlcndpc2Ugd2l0aCBwYW4teCBwYW4teSBjb21iaW5lZCBub25lIG9mIHRoZXNlXG4gICAgLy8gcmVjb2duaXplcnMgd2lsbCB3b3JrLCBzaW5jZSB0aGUgYnJvd3NlciB3b3VsZCBoYW5kbGUgYWxsIHBhbm5pbmdcbiAgICBpZiAoaGFzUGFuWCAmJiBoYXNQYW5ZKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICAvLyBwYW4teCBPUiBwYW4teVxuICAgIGlmIChoYXNQYW5YIHx8IGhhc1BhblkpIHtcbiAgICAgICAgcmV0dXJuIGhhc1BhblggPyBUT1VDSF9BQ1RJT05fUEFOX1ggOiBUT1VDSF9BQ1RJT05fUEFOX1k7XG4gICAgfVxuXG4gICAgLy8gbWFuaXB1bGF0aW9uXG4gICAgaWYgKGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT04pKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OO1xuICAgIH1cblxuICAgIHJldHVybiBUT1VDSF9BQ1RJT05fQVVUTztcbn1cblxuZnVuY3Rpb24gZ2V0VG91Y2hBY3Rpb25Qcm9wcygpIHtcbiAgICBpZiAoIU5BVElWRV9UT1VDSF9BQ1RJT04pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgdG91Y2hNYXAgPSB7fTtcbiAgICB2YXIgY3NzU3VwcG9ydHMgPSB3aW5kb3cuQ1NTICYmIHdpbmRvdy5DU1Muc3VwcG9ydHM7XG4gICAgWydhdXRvJywgJ21hbmlwdWxhdGlvbicsICdwYW4teScsICdwYW4teCcsICdwYW4teCBwYW4teScsICdub25lJ10uZm9yRWFjaChmdW5jdGlvbih2YWwpIHtcblxuICAgICAgICAvLyBJZiBjc3Muc3VwcG9ydHMgaXMgbm90IHN1cHBvcnRlZCBidXQgdGhlcmUgaXMgbmF0aXZlIHRvdWNoLWFjdGlvbiBhc3N1bWUgaXQgc3VwcG9ydHNcbiAgICAgICAgLy8gYWxsIHZhbHVlcy4gVGhpcyBpcyB0aGUgY2FzZSBmb3IgSUUgMTAgYW5kIDExLlxuICAgICAgICB0b3VjaE1hcFt2YWxdID0gY3NzU3VwcG9ydHMgPyB3aW5kb3cuQ1NTLnN1cHBvcnRzKCd0b3VjaC1hY3Rpb24nLCB2YWwpIDogdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gdG91Y2hNYXA7XG59XG5cbi8qKlxuICogUmVjb2duaXplciBmbG93IGV4cGxhaW5lZDsgKlxuICogQWxsIHJlY29nbml6ZXJzIGhhdmUgdGhlIGluaXRpYWwgc3RhdGUgb2YgUE9TU0lCTEUgd2hlbiBhIGlucHV0IHNlc3Npb24gc3RhcnRzLlxuICogVGhlIGRlZmluaXRpb24gb2YgYSBpbnB1dCBzZXNzaW9uIGlzIGZyb20gdGhlIGZpcnN0IGlucHV0IHVudGlsIHRoZSBsYXN0IGlucHV0LCB3aXRoIGFsbCBpdCdzIG1vdmVtZW50IGluIGl0LiAqXG4gKiBFeGFtcGxlIHNlc3Npb24gZm9yIG1vdXNlLWlucHV0OiBtb3VzZWRvd24gLT4gbW91c2Vtb3ZlIC0+IG1vdXNldXBcbiAqXG4gKiBPbiBlYWNoIHJlY29nbml6aW5nIGN5Y2xlIChzZWUgTWFuYWdlci5yZWNvZ25pemUpIHRoZSAucmVjb2duaXplKCkgbWV0aG9kIGlzIGV4ZWN1dGVkXG4gKiB3aGljaCBkZXRlcm1pbmVzIHdpdGggc3RhdGUgaXQgc2hvdWxkIGJlLlxuICpcbiAqIElmIHRoZSByZWNvZ25pemVyIGhhcyB0aGUgc3RhdGUgRkFJTEVELCBDQU5DRUxMRUQgb3IgUkVDT0dOSVpFRCAoZXF1YWxzIEVOREVEKSwgaXQgaXMgcmVzZXQgdG9cbiAqIFBPU1NJQkxFIHRvIGdpdmUgaXQgYW5vdGhlciBjaGFuZ2Ugb24gdGhlIG5leHQgY3ljbGUuXG4gKlxuICogICAgICAgICAgICAgICBQb3NzaWJsZVxuICogICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICstLS0tLSstLS0tLS0tLS0tLS0tLS0rXG4gKiAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICstLS0tLSstLS0tLSsgICAgICAgICAgICAgICB8XG4gKiAgICAgIHwgICAgICAgICAgIHwgICAgICAgICAgICAgICB8XG4gKiAgIEZhaWxlZCAgICAgIENhbmNlbGxlZCAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgKy0tLS0tLS0rLS0tLS0tK1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgIFJlY29nbml6ZWQgICAgICAgQmVnYW5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2hhbmdlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVuZGVkL1JlY29nbml6ZWRcbiAqL1xudmFyIFNUQVRFX1BPU1NJQkxFID0gMTtcbnZhciBTVEFURV9CRUdBTiA9IDI7XG52YXIgU1RBVEVfQ0hBTkdFRCA9IDQ7XG52YXIgU1RBVEVfRU5ERUQgPSA4O1xudmFyIFNUQVRFX1JFQ09HTklaRUQgPSBTVEFURV9FTkRFRDtcbnZhciBTVEFURV9DQU5DRUxMRUQgPSAxNjtcbnZhciBTVEFURV9GQUlMRUQgPSAzMjtcblxuLyoqXG4gKiBSZWNvZ25pemVyXG4gKiBFdmVyeSByZWNvZ25pemVyIG5lZWRzIHRvIGV4dGVuZCBmcm9tIHRoaXMgY2xhc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFJlY29nbml6ZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgdGhpcy5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLmlkID0gdW5pcXVlSWQoKTtcblxuICAgIHRoaXMubWFuYWdlciA9IG51bGw7XG5cbiAgICAvLyBkZWZhdWx0IGlzIGVuYWJsZSB0cnVlXG4gICAgdGhpcy5vcHRpb25zLmVuYWJsZSA9IGlmVW5kZWZpbmVkKHRoaXMub3B0aW9ucy5lbmFibGUsIHRydWUpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuXG4gICAgdGhpcy5zaW11bHRhbmVvdXMgPSB7fTtcbiAgICB0aGlzLnJlcXVpcmVGYWlsID0gW107XG59XG5cblJlY29nbml6ZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBkZWZhdWx0czoge30sXG5cbiAgICAvKipcbiAgICAgKiBzZXQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICogQHJldHVybiB7UmVjb2duaXplcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gYWxzbyB1cGRhdGUgdGhlIHRvdWNoQWN0aW9uLCBpbiBjYXNlIHNvbWV0aGluZyBjaGFuZ2VkIGFib3V0IHRoZSBkaXJlY3Rpb25zL2VuYWJsZWQgc3RhdGVcbiAgICAgICAgdGhpcy5tYW5hZ2VyICYmIHRoaXMubWFuYWdlci50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ3JlY29nbml6ZVdpdGgnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2ltdWx0YW5lb3VzID0gdGhpcy5zaW11bHRhbmVvdXM7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKCFzaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXSkge1xuICAgICAgICAgICAgc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF0gPSBvdGhlclJlY29nbml6ZXI7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVjb2duaXplV2l0aCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZHJvcCB0aGUgc2ltdWx0YW5lb3VzIGxpbmsuIGl0IGRvZXNudCByZW1vdmUgdGhlIGxpbmsgb24gdGhlIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIGRyb3BSZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZWNvZ25pemVXaXRoJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBkZWxldGUgdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZXIgY2FuIG9ubHkgcnVuIHdoZW4gYW4gb3RoZXIgaXMgZmFpbGluZ1xuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZXF1aXJlRmFpbHVyZTogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdyZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1aXJlRmFpbCA9IHRoaXMucmVxdWlyZUZhaWw7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKGluQXJyYXkocmVxdWlyZUZhaWwsIG90aGVyUmVjb2duaXplcikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXF1aXJlRmFpbC5wdXNoKG90aGVyUmVjb2duaXplcik7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRyb3AgdGhlIHJlcXVpcmVGYWlsdXJlIGxpbmsuIGl0IGRvZXMgbm90IHJlbW92ZSB0aGUgbGluayBvbiB0aGUgb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgZHJvcFJlcXVpcmVGYWlsdXJlOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheSh0aGlzLnJlcXVpcmVGYWlsLCBvdGhlclJlY29nbml6ZXIpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5yZXF1aXJlRmFpbC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBoYXMgcmVxdWlyZSBmYWlsdXJlcyBib29sZWFuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaGFzUmVxdWlyZUZhaWx1cmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogaWYgdGhlIHJlY29nbml6ZXIgY2FuIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5SZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogWW91IHNob3VsZCB1c2UgYHRyeUVtaXRgIGluc3RlYWQgb2YgYGVtaXRgIGRpcmVjdGx5IHRvIGNoZWNrXG4gICAgICogdGhhdCBhbGwgdGhlIG5lZWRlZCByZWNvZ25pemVycyBoYXMgZmFpbGVkIGJlZm9yZSBlbWl0dGluZy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cbiAgICAgICAgZnVuY3Rpb24gZW1pdChldmVudCkge1xuICAgICAgICAgICAgc2VsZi5tYW5hZ2VyLmVtaXQoZXZlbnQsIGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vICdwYW5zdGFydCcgYW5kICdwYW5tb3ZlJ1xuICAgICAgICBpZiAoc3RhdGUgPCBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQpOyAvLyBzaW1wbGUgJ2V2ZW50TmFtZScgZXZlbnRzXG5cbiAgICAgICAgaWYgKGlucHV0LmFkZGl0aW9uYWxFdmVudCkgeyAvLyBhZGRpdGlvbmFsIGV2ZW50KHBhbmxlZnQsIHBhbnJpZ2h0LCBwaW5jaGluLCBwaW5jaG91dC4uLilcbiAgICAgICAgICAgIGVtaXQoaW5wdXQuYWRkaXRpb25hbEV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBhbmVuZCBhbmQgcGFuY2FuY2VsXG4gICAgICAgIGlmIChzdGF0ZSA+PSBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoYXQgYWxsIHRoZSByZXF1aXJlIGZhaWx1cmUgcmVjb2duaXplcnMgaGFzIGZhaWxlZCxcbiAgICAgKiBpZiB0cnVlLCBpdCBlbWl0cyBhIGdlc3R1cmUgZXZlbnQsXG4gICAgICogb3RoZXJ3aXNlLCBzZXR1cCB0aGUgc3RhdGUgdG8gRkFJTEVELlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIHRyeUVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmICh0aGlzLmNhbkVtaXQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW1pdChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaXQncyBmYWlsaW5nIGFueXdheVxuICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYW4gd2UgZW1pdD9cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5FbWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoISh0aGlzLnJlcXVpcmVGYWlsW2ldLnN0YXRlICYgKFNUQVRFX0ZBSUxFRCB8IFNUQVRFX1BPU1NJQkxFKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgcmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICAvLyBtYWtlIGEgbmV3IGNvcHkgb2YgdGhlIGlucHV0RGF0YVxuICAgICAgICAvLyBzbyB3ZSBjYW4gY2hhbmdlIHRoZSBpbnB1dERhdGEgd2l0aG91dCBtZXNzaW5nIHVwIHRoZSBvdGhlciByZWNvZ25pemVyc1xuICAgICAgICB2YXIgaW5wdXREYXRhQ2xvbmUgPSBhc3NpZ24oe30sIGlucHV0RGF0YSk7XG5cbiAgICAgICAgLy8gaXMgaXMgZW5hYmxlZCBhbmQgYWxsb3cgcmVjb2duaXppbmc/XG4gICAgICAgIGlmICghYm9vbE9yRm4odGhpcy5vcHRpb25zLmVuYWJsZSwgW3RoaXMsIGlucHV0RGF0YUNsb25lXSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB3aGVuIHdlJ3ZlIHJlYWNoZWQgdGhlIGVuZFxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAmIChTVEFURV9SRUNPR05JWkVEIHwgU1RBVEVfQ0FOQ0VMTEVEIHwgU1RBVEVfRkFJTEVEKSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMucHJvY2VzcyhpbnB1dERhdGFDbG9uZSk7XG5cbiAgICAgICAgLy8gdGhlIHJlY29nbml6ZXIgaGFzIHJlY29nbml6ZWQgYSBnZXN0dXJlXG4gICAgICAgIC8vIHNvIHRyaWdnZXIgYW4gZXZlbnRcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEIHwgU1RBVEVfRU5ERUQgfCBTVEFURV9DQU5DRUxMRUQpKSB7XG4gICAgICAgICAgICB0aGlzLnRyeUVtaXQoaW5wdXREYXRhQ2xvbmUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJldHVybiB0aGUgc3RhdGUgb2YgdGhlIHJlY29nbml6ZXJcbiAgICAgKiB0aGUgYWN0dWFsIHJlY29nbml6aW5nIGhhcHBlbnMgaW4gdGhpcyBtZXRob2RcbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKiBAcmV0dXJucyB7Q29uc3R9IFNUQVRFXG4gICAgICovXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXREYXRhKSB7IH0sIC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJuIHRoZSBwcmVmZXJyZWQgdG91Y2gtYWN0aW9uXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICovXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbGVkIHdoZW4gdGhlIGdlc3R1cmUgaXNuJ3QgYWxsb3dlZCB0byByZWNvZ25pemVcbiAgICAgKiBsaWtlIHdoZW4gYW5vdGhlciBpcyBiZWluZyByZWNvZ25pemVkIG9yIGl0IGlzIGRpc2FibGVkXG4gICAgICogQHZpcnR1YWxcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24oKSB7IH1cbn07XG5cbi8qKlxuICogZ2V0IGEgdXNhYmxlIHN0cmluZywgdXNlZCBhcyBldmVudCBwb3N0Zml4XG4gKiBAcGFyYW0ge0NvbnN0fSBzdGF0ZVxuICogQHJldHVybnMge1N0cmluZ30gc3RhdGVcbiAqL1xuZnVuY3Rpb24gc3RhdGVTdHIoc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUgJiBTVEFURV9DQU5DRUxMRUQpIHtcbiAgICAgICAgcmV0dXJuICdjYW5jZWwnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9FTkRFRCkge1xuICAgICAgICByZXR1cm4gJ2VuZCc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0NIQU5HRUQpIHtcbiAgICAgICAgcmV0dXJuICdtb3ZlJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfQkVHQU4pIHtcbiAgICAgICAgcmV0dXJuICdzdGFydCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBkaXJlY3Rpb24gY29ucyB0byBzdHJpbmdcbiAqIEBwYXJhbSB7Q29uc3R9IGRpcmVjdGlvblxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZGlyZWN0aW9uU3RyKGRpcmVjdGlvbikge1xuICAgIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0RPV04pIHtcbiAgICAgICAgcmV0dXJuICdkb3duJztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fVVApIHtcbiAgICAgICAgcmV0dXJuICd1cCc7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0xFRlQpIHtcbiAgICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fUklHSFQpIHtcbiAgICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBnZXQgYSByZWNvZ25pemVyIGJ5IG5hbWUgaWYgaXQgaXMgYm91bmQgdG8gYSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSBvdGhlclJlY29nbml6ZXJcbiAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICogQHJldHVybnMge1JlY29nbml6ZXJ9XG4gKi9cbmZ1bmN0aW9uIGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCByZWNvZ25pemVyKSB7XG4gICAgdmFyIG1hbmFnZXIgPSByZWNvZ25pemVyLm1hbmFnZXI7XG4gICAgaWYgKG1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIuZ2V0KG90aGVyUmVjb2duaXplcik7XG4gICAgfVxuICAgIHJldHVybiBvdGhlclJlY29nbml6ZXI7XG59XG5cbi8qKlxuICogVGhpcyByZWNvZ25pemVyIGlzIGp1c3QgdXNlZCBhcyBhIGJhc2UgZm9yIHRoZSBzaW1wbGUgYXR0cmlidXRlIHJlY29nbml6ZXJzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIEF0dHJSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChBdHRyUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgKi9cbiAgICAgICAgcG9pbnRlcnM6IDFcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBjaGVjayBpZiBpdCB0aGUgcmVjb2duaXplciByZWNlaXZlcyB2YWxpZCBpbnB1dCwgbGlrZSBpbnB1dC5kaXN0YW5jZSA+IDEwLlxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSByZWNvZ25pemVkXG4gICAgICovXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25Qb2ludGVycyA9IHRoaXMub3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgcmV0dXJuIG9wdGlvblBvaW50ZXJzID09PSAwIHx8IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9uUG9pbnRlcnM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3MgdGhlIGlucHV0IGFuZCByZXR1cm4gdGhlIHN0YXRlIGZvciB0aGUgcmVjb2duaXplclxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHsqfSBTdGF0ZVxuICAgICAqL1xuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBpbnB1dC5ldmVudFR5cGU7XG5cbiAgICAgICAgdmFyIGlzUmVjb2duaXplZCA9IHN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCk7XG4gICAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy5hdHRyVGVzdChpbnB1dCk7XG5cbiAgICAgICAgLy8gb24gY2FuY2VsIGlucHV0IGFuZCB3ZSd2ZSByZWNvZ25pemVkIGJlZm9yZSwgcmV0dXJuIFNUQVRFX0NBTkNFTExFRFxuICAgICAgICBpZiAoaXNSZWNvZ25pemVkICYmIChldmVudFR5cGUgJiBJTlBVVF9DQU5DRUwgfHwgIWlzVmFsaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9DQU5DRUxMRUQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNSZWNvZ25pemVkIHx8IGlzVmFsaWQpIHtcbiAgICAgICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9FTkRFRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIShzdGF0ZSAmIFNUQVRFX0JFR0FOKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9CRUdBTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0NIQU5HRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQYW5cbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGFuZCBtb3ZlZCBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBhblJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMucFggPSBudWxsO1xuICAgIHRoaXMucFkgPSBudWxsO1xufVxuXG5pbmhlcml0KFBhblJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQYW5SZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwYW4nLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgZGlyZWN0aW9uOiBESVJFQ1RJT05fQUxMXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciBhY3Rpb25zID0gW107XG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGlvbnM7XG4gICAgfSxcblxuICAgIGRpcmVjdGlvblRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICB2YXIgaGFzTW92ZWQgPSB0cnVlO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBpbnB1dC5kaXN0YW5jZTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGlucHV0LmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIHggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHZhciB5ID0gaW5wdXQuZGVsdGFZO1xuXG4gICAgICAgIC8vIGxvY2sgdG8gYXhpcz9cbiAgICAgICAgaWYgKCEoZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9ICh4ID09PSAwKSA/IERJUkVDVElPTl9OT05FIDogKHggPCAwKSA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgICAgICAgICAgICAgIGhhc01vdmVkID0geCAhPSB0aGlzLnBYO1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5hYnMoaW5wdXQuZGVsdGFYKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gKHkgPT09IDApID8gRElSRUNUSU9OX05PTkUgOiAoeSA8IDApID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSB5ICE9IHRoaXMucFk7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBNYXRoLmFicyhpbnB1dC5kZWx0YVkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlucHV0LmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgcmV0dXJuIGhhc01vdmVkICYmIGRpc3RhbmNlID4gb3B0aW9ucy50aHJlc2hvbGQgJiYgZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb247XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gQXR0clJlY29nbml6ZXIucHJvdG90eXBlLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAodGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOIHx8ICghKHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTikgJiYgdGhpcy5kaXJlY3Rpb25UZXN0KGlucHV0KSkpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuXG4gICAgICAgIHRoaXMucFggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHRoaXMucFkgPSBpbnB1dC5kZWx0YVk7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGRpcmVjdGlvblN0cihpbnB1dC5kaXJlY3Rpb24pO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGRpcmVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdXBlci5lbWl0LmNhbGwodGhpcywgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFBpbmNoXG4gKiBSZWNvZ25pemVkIHdoZW4gdHdvIG9yIG1vcmUgcG9pbnRlcnMgYXJlIG1vdmluZyB0b3dhcmQgKHpvb20taW4pIG9yIGF3YXkgZnJvbSBlYWNoIG90aGVyICh6b29tLW91dCkuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBpbmNoUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFBpbmNoUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncGluY2gnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5zY2FsZSAtIDEpID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCB8fCB0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQuc2NhbGUgIT09IDEpIHtcbiAgICAgICAgICAgIHZhciBpbk91dCA9IGlucHV0LnNjYWxlIDwgMSA/ICdpbicgOiAnb3V0JztcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGluT3V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N1cGVyLmVtaXQuY2FsbCh0aGlzLCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUHJlc3NcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGZvciB4IG1zIHdpdGhvdXQgYW55IG1vdmVtZW50LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFByZXNzUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xufVxuXG5pbmhlcml0KFByZXNzUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUHJlc3NSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwcmVzcycsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICB0aW1lOiAyNTEsIC8vIG1pbmltYWwgdGltZSBvZiB0aGUgcG9pbnRlciB0byBiZSBwcmVzc2VkXG4gICAgICAgIHRocmVzaG9sZDogOSAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX0FVVE9dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdmFyIHZhbGlkUG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHZhciB2YWxpZE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCBvcHRpb25zLnRocmVzaG9sZDtcbiAgICAgICAgdmFyIHZhbGlkVGltZSA9IGlucHV0LmRlbHRhVGltZSA+IG9wdGlvbnMudGltZTtcblxuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKCF2YWxpZE1vdmVtZW50IHx8ICF2YWxpZFBvaW50ZXJzIHx8IChpbnB1dC5ldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiAhdmFsaWRUaW1lKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgfSwgb3B0aW9ucy50aW1lLCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFNUQVRFX1JFQ09HTklaRUQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnB1dCAmJiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EKSkge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgJ3VwJywgaW5wdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQudGltZVN0YW1wID0gbm93KCk7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFJvdGF0ZVxuICogUmVjb2duaXplZCB3aGVuIHR3byBvciBtb3JlIHBvaW50ZXIgYXJlIG1vdmluZyBpbiBhIGNpcmN1bGFyIG1vdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUm90YXRlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFJvdGF0ZVJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBSb3RhdGVSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdyb3RhdGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5yb3RhdGlvbikgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkIHx8IHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTik7XG4gICAgfVxufSk7XG5cbi8qKlxuICogU3dpcGVcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgZmFzdCAodmVsb2NpdHkpLCB3aXRoIGVub3VnaCBkaXN0YW5jZSBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFN3aXBlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFN3aXBlUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFN3aXBlUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAnc3dpcGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICB2ZWxvY2l0eTogMC4zLFxuICAgICAgICBkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgICAgICBwb2ludGVyczogMVxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBQYW5SZWNvZ25pemVyLnByb3RvdHlwZS5nZXRUb3VjaEFjdGlvbi5jYWxsKHRoaXMpO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciB2ZWxvY2l0eTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uICYgKERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMKSkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WDtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgZGlyZWN0aW9uICYgaW5wdXQub2Zmc2V0RGlyZWN0aW9uICYmXG4gICAgICAgICAgICBpbnB1dC5kaXN0YW5jZSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgJiZcbiAgICAgICAgICAgIGlucHV0Lm1heFBvaW50ZXJzID09IHRoaXMub3B0aW9ucy5wb2ludGVycyAmJlxuICAgICAgICAgICAgYWJzKHZlbG9jaXR5KSA+IHRoaXMub3B0aW9ucy52ZWxvY2l0eSAmJiBpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQ7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBkaXJlY3Rpb25TdHIoaW5wdXQub2Zmc2V0RGlyZWN0aW9uKTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgZGlyZWN0aW9uLCBpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBBIHRhcCBpcyBlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb2luZyBhIHNtYWxsIHRhcC9jbGljay4gTXVsdGlwbGUgdGFwcyBhcmUgcmVjb2duaXplZCBpZiB0aGV5IG9jY3VyXG4gKiBiZXR3ZWVuIHRoZSBnaXZlbiBpbnRlcnZhbCBhbmQgcG9zaXRpb24uIFRoZSBkZWxheSBvcHRpb24gY2FuIGJlIHVzZWQgdG8gcmVjb2duaXplIG11bHRpLXRhcHMgd2l0aG91dCBmaXJpbmdcbiAqIGEgc2luZ2xlIHRhcC5cbiAqXG4gKiBUaGUgZXZlbnREYXRhIGZyb20gdGhlIGVtaXR0ZWQgZXZlbnQgY29udGFpbnMgdGhlIHByb3BlcnR5IGB0YXBDb3VudGAsIHdoaWNoIGNvbnRhaW5zIHRoZSBhbW91bnQgb2ZcbiAqIG11bHRpLXRhcHMgYmVpbmcgcmVjb2duaXplZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBUYXBSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIC8vIHByZXZpb3VzIHRpbWUgYW5kIGNlbnRlcixcbiAgICAvLyB1c2VkIGZvciB0YXAgY291bnRpbmdcbiAgICB0aGlzLnBUaW1lID0gZmFsc2U7XG4gICAgdGhpcy5wQ2VudGVyID0gZmFsc2U7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgIHRoaXMuY291bnQgPSAwO1xufVxuXG5pbmhlcml0KFRhcFJlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAndGFwJyxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIHRhcHM6IDEsXG4gICAgICAgIGludGVydmFsOiAzMDAsIC8vIG1heCB0aW1lIGJldHdlZW4gdGhlIG11bHRpLXRhcCB0YXBzXG4gICAgICAgIHRpbWU6IDI1MCwgLy8gbWF4IHRpbWUgb2YgdGhlIHBvaW50ZXIgdG8gYmUgZG93biAobGlrZSBmaW5nZXIgb24gdGhlIHNjcmVlbilcbiAgICAgICAgdGhyZXNob2xkOiA5LCAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgICAgICBwb3NUaHJlc2hvbGQ6IDEwIC8vIGEgbXVsdGktdGFwIGNhbiBiZSBhIGJpdCBvZmYgdGhlIGluaXRpYWwgcG9zaXRpb25cbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9NQU5JUFVMQVRJT05dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgICAgICB2YXIgdmFsaWRQb2ludGVycyA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgdmFyIHZhbGlkTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IG9wdGlvbnMudGhyZXNob2xkO1xuICAgICAgICB2YXIgdmFsaWRUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCBvcHRpb25zLnRpbWU7XG5cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuXG4gICAgICAgIGlmICgoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQpICYmICh0aGlzLmNvdW50ID09PSAwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFpbFRpbWVvdXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKHZhbGlkTW92ZW1lbnQgJiYgdmFsaWRUb3VjaFRpbWUgJiYgdmFsaWRQb2ludGVycykge1xuICAgICAgICAgICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWlsVGltZW91dCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdmFsaWRJbnRlcnZhbCA9IHRoaXMucFRpbWUgPyAoaW5wdXQudGltZVN0YW1wIC0gdGhpcy5wVGltZSA8IG9wdGlvbnMuaW50ZXJ2YWwpIDogdHJ1ZTtcbiAgICAgICAgICAgIHZhciB2YWxpZE11bHRpVGFwID0gIXRoaXMucENlbnRlciB8fCBnZXREaXN0YW5jZSh0aGlzLnBDZW50ZXIsIGlucHV0LmNlbnRlcikgPCBvcHRpb25zLnBvc1RocmVzaG9sZDtcblxuICAgICAgICAgICAgdGhpcy5wVGltZSA9IGlucHV0LnRpbWVTdGFtcDtcbiAgICAgICAgICAgIHRoaXMucENlbnRlciA9IGlucHV0LmNlbnRlcjtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZE11bHRpVGFwIHx8ICF2YWxpZEludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcblxuICAgICAgICAgICAgLy8gaWYgdGFwIGNvdW50IG1hdGNoZXMgd2UgaGF2ZSByZWNvZ25pemVkIGl0LFxuICAgICAgICAgICAgLy8gZWxzZSBpdCBoYXMgYmVnYW4gcmVjb2duaXppbmcuLi5cbiAgICAgICAgICAgIHZhciB0YXBDb3VudCA9IHRoaXMuY291bnQgJSBvcHRpb25zLnRhcHM7XG4gICAgICAgICAgICBpZiAodGFwQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBubyBmYWlsaW5nIHJlcXVpcmVtZW50cywgaW1tZWRpYXRlbHkgdHJpZ2dlciB0aGUgdGFwIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gb3Igd2FpdCBhcyBsb25nIGFzIHRoZSBtdWx0aXRhcCBpbnRlcnZhbCB0byB0cmlnZ2VyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc1JlcXVpcmVGYWlsdXJlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmludGVydmFsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX0JFR0FOO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICBmYWlsVGltZW91dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgICAgICB9LCB0aGlzLm9wdGlvbnMuaW50ZXJ2YWwsIHRoaXMpO1xuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBTVEFURV9SRUNPR05JWkVEKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC50YXBDb3VudCA9IHRoaXMuY291bnQ7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFNpbXBsZSB3YXkgdG8gY3JlYXRlIGEgbWFuYWdlciB3aXRoIGEgZGVmYXVsdCBzZXQgb2YgcmVjb2duaXplcnMuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSGFtbWVyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLnJlY29nbml6ZXJzID0gaWZVbmRlZmluZWQob3B0aW9ucy5yZWNvZ25pemVycywgSGFtbWVyLmRlZmF1bHRzLnByZXNldCk7XG4gICAgcmV0dXJuIG5ldyBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEBjb25zdCB7c3RyaW5nfVxuICovXG5IYW1tZXIuVkVSU0lPTiA9ICcyLjAuNyc7XG5cbi8qKlxuICogZGVmYXVsdCBzZXR0aW5nc1xuICogQG5hbWVzcGFjZVxuICovXG5IYW1tZXIuZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IGlmIERPTSBldmVudHMgYXJlIGJlaW5nIHRyaWdnZXJlZC5cbiAgICAgKiBCdXQgdGhpcyBpcyBzbG93ZXIgYW5kIHVudXNlZCBieSBzaW1wbGUgaW1wbGVtZW50YXRpb25zLCBzbyBkaXNhYmxlZCBieSBkZWZhdWx0LlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgZG9tRXZlbnRzOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIFRoZSB2YWx1ZSBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5L2ZhbGxiYWNrLlxuICAgICAqIFdoZW4gc2V0IHRvIGBjb21wdXRlYCBpdCB3aWxsIG1hZ2ljYWxseSBzZXQgdGhlIGNvcnJlY3QgdmFsdWUgYmFzZWQgb24gdGhlIGFkZGVkIHJlY29nbml6ZXJzLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICogQGRlZmF1bHQgY29tcHV0ZVxuICAgICAqL1xuICAgIHRvdWNoQWN0aW9uOiBUT1VDSF9BQ1RJT05fQ09NUFVURSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IHRydWVcbiAgICAgKi9cbiAgICBlbmFibGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBFWFBFUklNRU5UQUwgRkVBVFVSRSAtLSBjYW4gYmUgcmVtb3ZlZC9jaGFuZ2VkXG4gICAgICogQ2hhbmdlIHRoZSBwYXJlbnQgaW5wdXQgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICogSWYgTnVsbCwgdGhlbiBpdCBpcyBiZWluZyBzZXQgdGhlIHRvIG1haW4gZWxlbWVudC5cbiAgICAgKiBAdHlwZSB7TnVsbHxFdmVudFRhcmdldH1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgaW5wdXRUYXJnZXQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBmb3JjZSBhbiBpbnB1dCBjbGFzc1xuICAgICAqIEB0eXBlIHtOdWxsfEZ1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICBpbnB1dENsYXNzOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCByZWNvZ25pemVyIHNldHVwIHdoZW4gY2FsbGluZyBgSGFtbWVyKClgXG4gICAgICogV2hlbiBjcmVhdGluZyBhIG5ldyBNYW5hZ2VyIHRoZXNlIHdpbGwgYmUgc2tpcHBlZC5cbiAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICovXG4gICAgcHJlc2V0OiBbXG4gICAgICAgIC8vIFJlY29nbml6ZXJDbGFzcywgb3B0aW9ucywgW3JlY29nbml6ZVdpdGgsIC4uLl0sIFtyZXF1aXJlRmFpbHVyZSwgLi4uXVxuICAgICAgICBbUm90YXRlUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9XSxcbiAgICAgICAgW1BpbmNoUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9LCBbJ3JvdGF0ZSddXSxcbiAgICAgICAgW1N3aXBlUmVjb2duaXplciwge2RpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUx9XSxcbiAgICAgICAgW1BhblJlY29nbml6ZXIsIHtkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMfSwgWydzd2lwZSddXSxcbiAgICAgICAgW1RhcFJlY29nbml6ZXJdLFxuICAgICAgICBbVGFwUmVjb2duaXplciwge2V2ZW50OiAnZG91YmxldGFwJywgdGFwczogMn0sIFsndGFwJ11dLFxuICAgICAgICBbUHJlc3NSZWNvZ25pemVyXVxuICAgIF0sXG5cbiAgICAvKipcbiAgICAgKiBTb21lIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSB1c2VkIHRvIGltcHJvdmUgdGhlIHdvcmtpbmcgb2YgSGFtbWVyLlxuICAgICAqIEFkZCB0aGVtIHRvIHRoaXMgbWV0aG9kIGFuZCB0aGV5IHdpbGwgYmUgc2V0IHdoZW4gY3JlYXRpbmcgYSBuZXcgTWFuYWdlci5cbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICovXG4gICAgY3NzUHJvcHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRleHQgc2VsZWN0aW9uIHRvIGltcHJvdmUgdGhlIGRyYWdnaW5nIGdlc3R1cmUuIE1haW5seSBmb3IgZGVza3RvcCBicm93c2Vycy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGUgdGhlIFdpbmRvd3MgUGhvbmUgZ3JpcHBlcnMgd2hlbiBwcmVzc2luZyBhbiBlbGVtZW50LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRoZSBkZWZhdWx0IGNhbGxvdXQgc2hvd24gd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQuXG4gICAgICAgICAqIE9uIGlPUywgd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQgc3VjaCBhcyBhIGxpbmssIFNhZmFyaSBkaXNwbGF5c1xuICAgICAgICAgKiBhIGNhbGxvdXQgY29udGFpbmluZyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGluay4gVGhpcyBwcm9wZXJ0eSBhbGxvd3MgeW91IHRvIGRpc2FibGUgdGhhdCBjYWxsb3V0LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgd2hldGhlciB6b29taW5nIGlzIGVuYWJsZWQuIFVzZWQgYnkgSUUxMD5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICBjb250ZW50Wm9vbWluZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgdGhhdCBhbiBlbnRpcmUgZWxlbWVudCBzaG91bGQgYmUgZHJhZ2dhYmxlIGluc3RlYWQgb2YgaXRzIGNvbnRlbnRzLiBNYWlubHkgZm9yIGRlc2t0b3AgYnJvd3NlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdXNlckRyYWc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3ZlcnJpZGVzIHRoZSBoaWdobGlnaHQgY29sb3Igc2hvd24gd2hlbiB0aGUgdXNlciB0YXBzIGEgbGluayBvciBhIEphdmFTY3JpcHRcbiAgICAgICAgICogY2xpY2thYmxlIGVsZW1lbnQgaW4gaU9TLiBUaGlzIHByb3BlcnR5IG9iZXlzIHRoZSBhbHBoYSB2YWx1ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAncmdiYSgwLDAsMCwwKSdcbiAgICAgICAgICovXG4gICAgICAgIHRhcEhpZ2hsaWdodENvbG9yOiAncmdiYSgwLDAsMCwwKSdcbiAgICB9XG59O1xuXG52YXIgU1RPUCA9IDE7XG52YXIgRk9SQ0VEX1NUT1AgPSAyO1xuXG4vKipcbiAqIE1hbmFnZXJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIEhhbW1lci5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgPSB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgfHwgZWxlbWVudDtcblxuICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICB0aGlzLnJlY29nbml6ZXJzID0gW107XG4gICAgdGhpcy5vbGRDc3NQcm9wcyA9IHt9O1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmlucHV0ID0gY3JlYXRlSW5wdXRJbnN0YW5jZSh0aGlzKTtcbiAgICB0aGlzLnRvdWNoQWN0aW9uID0gbmV3IFRvdWNoQWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucy50b3VjaEFjdGlvbik7XG5cbiAgICB0b2dnbGVDc3NQcm9wcyh0aGlzLCB0cnVlKTtcblxuICAgIGVhY2godGhpcy5vcHRpb25zLnJlY29nbml6ZXJzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciByZWNvZ25pemVyID0gdGhpcy5hZGQobmV3IChpdGVtWzBdKShpdGVtWzFdKSk7XG4gICAgICAgIGl0ZW1bMl0gJiYgcmVjb2duaXplci5yZWNvZ25pemVXaXRoKGl0ZW1bMl0pO1xuICAgICAgICBpdGVtWzNdICYmIHJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUoaXRlbVszXSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbk1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNldCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7TWFuYWdlcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gT3B0aW9ucyB0aGF0IG5lZWQgYSBsaXR0bGUgbW9yZSBzZXR1cFxuICAgICAgICBpZiAob3B0aW9ucy50b3VjaEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnB1dFRhcmdldCkge1xuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgZXhpc3RpbmcgZXZlbnQgbGlzdGVuZXJzIGFuZCByZWluaXRpYWxpemVcbiAgICAgICAgICAgIHRoaXMuaW5wdXQuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC50YXJnZXQgPSBvcHRpb25zLmlucHV0VGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5pbml0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHN0b3AgcmVjb2duaXppbmcgZm9yIHRoaXMgc2Vzc2lvbi5cbiAgICAgKiBUaGlzIHNlc3Npb24gd2lsbCBiZSBkaXNjYXJkZWQsIHdoZW4gYSBuZXcgW2lucHV0XXN0YXJ0IGV2ZW50IGlzIGZpcmVkLlxuICAgICAqIFdoZW4gZm9yY2VkLCB0aGUgcmVjb2duaXplciBjeWNsZSBpcyBzdG9wcGVkIGltbWVkaWF0ZWx5LlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZvcmNlXVxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uKGZvcmNlKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvbi5zdG9wcGVkID0gZm9yY2UgPyBGT1JDRURfU1RPUCA6IFNUT1A7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJ1biB0aGUgcmVjb2duaXplcnMhXG4gICAgICogY2FsbGVkIGJ5IHRoZSBpbnB1dEhhbmRsZXIgZnVuY3Rpb24gb24gZXZlcnkgbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXJzICh0b3VjaGVzKVxuICAgICAqIGl0IHdhbGtzIHRocm91Z2ggYWxsIHRoZSByZWNvZ25pemVycyBhbmQgdHJpZXMgdG8gZGV0ZWN0IHRoZSBnZXN0dXJlIHRoYXQgaXMgYmVpbmcgbWFkZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbjtcbiAgICAgICAgaWYgKHNlc3Npb24uc3RvcHBlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIHRoZSB0b3VjaC1hY3Rpb24gcG9seWZpbGxcbiAgICAgICAgdGhpcy50b3VjaEFjdGlvbi5wcmV2ZW50RGVmYXVsdHMoaW5wdXREYXRhKTtcblxuICAgICAgICB2YXIgcmVjb2duaXplcjtcbiAgICAgICAgdmFyIHJlY29nbml6ZXJzID0gdGhpcy5yZWNvZ25pemVycztcblxuICAgICAgICAvLyB0aGlzIGhvbGRzIHRoZSByZWNvZ25pemVyIHRoYXQgaXMgYmVpbmcgcmVjb2duaXplZC5cbiAgICAgICAgLy8gc28gdGhlIHJlY29nbml6ZXIncyBzdGF0ZSBuZWVkcyB0byBiZSBCRUdBTiwgQ0hBTkdFRCwgRU5ERUQgb3IgUkVDT0dOSVpFRFxuICAgICAgICAvLyBpZiBubyByZWNvZ25pemVyIGlzIGRldGVjdGluZyBhIHRoaW5nLCBpdCBpcyBzZXQgdG8gYG51bGxgXG4gICAgICAgIHZhciBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyO1xuXG4gICAgICAgIC8vIHJlc2V0IHdoZW4gdGhlIGxhc3QgcmVjb2duaXplciBpcyByZWNvZ25pemVkXG4gICAgICAgIC8vIG9yIHdoZW4gd2UncmUgaW4gYSBuZXcgc2Vzc2lvblxuICAgICAgICBpZiAoIWN1clJlY29nbml6ZXIgfHwgKGN1clJlY29nbml6ZXIgJiYgY3VyUmVjb2duaXplci5zdGF0ZSAmIFNUQVRFX1JFQ09HTklaRUQpKSB7XG4gICAgICAgICAgICBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCByZWNvZ25pemVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlY29nbml6ZXIgPSByZWNvZ25pemVyc1tpXTtcblxuICAgICAgICAgICAgLy8gZmluZCBvdXQgaWYgd2UgYXJlIGFsbG93ZWQgdHJ5IHRvIHJlY29nbml6ZSB0aGUgaW5wdXQgZm9yIHRoaXMgb25lLlxuICAgICAgICAgICAgLy8gMS4gICBhbGxvdyBpZiB0aGUgc2Vzc2lvbiBpcyBOT1QgZm9yY2VkIHN0b3BwZWQgKHNlZSB0aGUgLnN0b3AoKSBtZXRob2QpXG4gICAgICAgICAgICAvLyAyLiAgIGFsbG93IGlmIHdlIHN0aWxsIGhhdmVuJ3QgcmVjb2duaXplZCBhIGdlc3R1cmUgaW4gdGhpcyBzZXNzaW9uLCBvciB0aGUgdGhpcyByZWNvZ25pemVyIGlzIHRoZSBvbmVcbiAgICAgICAgICAgIC8vICAgICAgdGhhdCBpcyBiZWluZyByZWNvZ25pemVkLlxuICAgICAgICAgICAgLy8gMy4gICBhbGxvdyBpZiB0aGUgcmVjb2duaXplciBpcyBhbGxvd2VkIHRvIHJ1biBzaW11bHRhbmVvdXMgd2l0aCB0aGUgY3VycmVudCByZWNvZ25pemVkIHJlY29nbml6ZXIuXG4gICAgICAgICAgICAvLyAgICAgIHRoaXMgY2FuIGJlIHNldHVwIHdpdGggdGhlIGByZWNvZ25pemVXaXRoKClgIG1ldGhvZCBvbiB0aGUgcmVjb2duaXplci5cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLnN0b3BwZWQgIT09IEZPUkNFRF9TVE9QICYmICggLy8gMVxuICAgICAgICAgICAgICAgICAgICAhY3VyUmVjb2duaXplciB8fCByZWNvZ25pemVyID09IGN1clJlY29nbml6ZXIgfHwgLy8gMlxuICAgICAgICAgICAgICAgICAgICByZWNvZ25pemVyLmNhblJlY29nbml6ZVdpdGgoY3VyUmVjb2duaXplcikpKSB7IC8vIDNcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlY29nbml6ZShpbnB1dERhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlc2V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSByZWNvZ25pemVyIGhhcyBiZWVuIHJlY29nbml6aW5nIHRoZSBpbnB1dCBhcyBhIHZhbGlkIGdlc3R1cmUsIHdlIHdhbnQgdG8gc3RvcmUgdGhpcyBvbmUgYXMgdGhlXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFjdGl2ZSByZWNvZ25pemVyLiBidXQgb25seSBpZiB3ZSBkb24ndCBhbHJlYWR5IGhhdmUgYW4gYWN0aXZlIHJlY29nbml6ZXJcbiAgICAgICAgICAgIGlmICghY3VyUmVjb2duaXplciAmJiByZWNvZ25pemVyLnN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCB8IFNUQVRFX0VOREVEKSkge1xuICAgICAgICAgICAgICAgIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXIgPSByZWNvZ25pemVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGdldCBhIHJlY29nbml6ZXIgYnkgaXRzIGV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfFN0cmluZ30gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE51bGx9XG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChyZWNvZ25pemVyIGluc3RhbmNlb2YgUmVjb2duaXplcikge1xuICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlY29nbml6ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocmVjb2duaXplcnNbaV0ub3B0aW9ucy5ldmVudCA9PSByZWNvZ25pemVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBhZGQgYSByZWNvZ25pemVyIHRvIHRoZSBtYW5hZ2VyXG4gICAgICogZXhpc3RpbmcgcmVjb2duaXplcnMgd2l0aCB0aGUgc2FtZSBldmVudCBuYW1lIHdpbGwgYmUgcmVtb3ZlZFxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE1hbmFnZXJ9XG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAnYWRkJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVtb3ZlIGV4aXN0aW5nXG4gICAgICAgIHZhciBleGlzdGluZyA9IHRoaXMuZ2V0KHJlY29nbml6ZXIub3B0aW9ucy5ldmVudCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZXhpc3RpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWNvZ25pemVycy5wdXNoKHJlY29nbml6ZXIpO1xuICAgICAgICByZWNvZ25pemVyLm1hbmFnZXIgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgIHJldHVybiByZWNvZ25pemVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgYSByZWNvZ25pemVyIGJ5IG5hbWUgb3IgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge01hbmFnZXJ9XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAncmVtb3ZlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjb2duaXplciA9IHRoaXMuZ2V0KHJlY29nbml6ZXIpO1xuXG4gICAgICAgIC8vIGxldCdzIG1ha2Ugc3VyZSB0aGlzIHJlY29nbml6ZXIgZXhpc3RzXG4gICAgICAgIGlmIChyZWNvZ25pemVyKSB7XG4gICAgICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheShyZWNvZ25pemVycywgcmVjb2duaXplcik7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCBldmVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihldmVudHMsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlcnNbZXZlbnRdIHx8IFtdO1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdW5iaW5kIGV2ZW50LCBsZWF2ZSBlbWl0IGJsYW5rIHRvIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2hhbmRsZXJdXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24oZXZlbnRzLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChldmVudHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGhhbmRsZXJzW2V2ZW50XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdICYmIGhhbmRsZXJzW2V2ZW50XS5zcGxpY2UoaW5BcnJheShoYW5kbGVyc1tldmVudF0sIGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBlbWl0IGV2ZW50IHRvIHRoZSBsaXN0ZW5lcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqL1xuICAgIGVtaXQ6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgIC8vIHdlIGFsc28gd2FudCB0byB0cmlnZ2VyIGRvbSBldmVudHNcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kb21FdmVudHMpIHtcbiAgICAgICAgICAgIHRyaWdnZXJEb21FdmVudChldmVudCwgZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBubyBoYW5kbGVycywgc28gc2tpcCBpdCBhbGxcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1tldmVudF0gJiYgdGhpcy5oYW5kbGVyc1tldmVudF0uc2xpY2UoKTtcbiAgICAgICAgaWYgKCFoYW5kbGVycyB8fCAhaGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnR5cGUgPSBldmVudDtcbiAgICAgICAgZGF0YS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGF0YS5zcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBoYW5kbGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldKGRhdGEpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRlc3Ryb3kgdGhlIG1hbmFnZXIgYW5kIHVuYmluZHMgYWxsIGV2ZW50c1xuICAgICAqIGl0IGRvZXNuJ3QgdW5iaW5kIGRvbSBldmVudHMsIHRoYXQgaXMgdGhlIHVzZXIgb3duIHJlc3BvbnNpYmlsaXR5XG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCAmJiB0b2dnbGVDc3NQcm9wcyh0aGlzLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICAgICAgdGhpcy5pbnB1dC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxufTtcblxuLyoqXG4gKiBhZGQvcmVtb3ZlIHRoZSBjc3MgcHJvcGVydGllcyBhcyBkZWZpbmVkIGluIG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wc1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGFkZFxuICovXG5mdW5jdGlvbiB0b2dnbGVDc3NQcm9wcyhtYW5hZ2VyLCBhZGQpIHtcbiAgICB2YXIgZWxlbWVudCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICBpZiAoIWVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcHJvcDtcbiAgICBlYWNoKG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wcywgZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgcHJvcCA9IHByZWZpeGVkKGVsZW1lbnQuc3R5bGUsIG5hbWUpO1xuICAgICAgICBpZiAoYWRkKSB7XG4gICAgICAgICAgICBtYW5hZ2VyLm9sZENzc1Byb3BzW3Byb3BdID0gZWxlbWVudC5zdHlsZVtwcm9wXTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcF0gPSBtYW5hZ2VyLm9sZENzc1Byb3BzW3Byb3BdIHx8ICcnO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFhZGQpIHtcbiAgICAgICAgbWFuYWdlci5vbGRDc3NQcm9wcyA9IHt9O1xuICAgIH1cbn1cblxuLyoqXG4gKiB0cmlnZ2VyIGRvbSBldmVudFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRG9tRXZlbnQoZXZlbnQsIGRhdGEpIHtcbiAgICB2YXIgZ2VzdHVyZUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZ2VzdHVyZUV2ZW50LmluaXRFdmVudChldmVudCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZ2VzdHVyZUV2ZW50Lmdlc3R1cmUgPSBkYXRhO1xuICAgIGRhdGEudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VzdHVyZUV2ZW50KTtcbn1cblxuYXNzaWduKEhhbW1lciwge1xuICAgIElOUFVUX1NUQVJUOiBJTlBVVF9TVEFSVCxcbiAgICBJTlBVVF9NT1ZFOiBJTlBVVF9NT1ZFLFxuICAgIElOUFVUX0VORDogSU5QVVRfRU5ELFxuICAgIElOUFVUX0NBTkNFTDogSU5QVVRfQ0FOQ0VMLFxuXG4gICAgU1RBVEVfUE9TU0lCTEU6IFNUQVRFX1BPU1NJQkxFLFxuICAgIFNUQVRFX0JFR0FOOiBTVEFURV9CRUdBTixcbiAgICBTVEFURV9DSEFOR0VEOiBTVEFURV9DSEFOR0VELFxuICAgIFNUQVRFX0VOREVEOiBTVEFURV9FTkRFRCxcbiAgICBTVEFURV9SRUNPR05JWkVEOiBTVEFURV9SRUNPR05JWkVELFxuICAgIFNUQVRFX0NBTkNFTExFRDogU1RBVEVfQ0FOQ0VMTEVELFxuICAgIFNUQVRFX0ZBSUxFRDogU1RBVEVfRkFJTEVELFxuXG4gICAgRElSRUNUSU9OX05PTkU6IERJUkVDVElPTl9OT05FLFxuICAgIERJUkVDVElPTl9MRUZUOiBESVJFQ1RJT05fTEVGVCxcbiAgICBESVJFQ1RJT05fUklHSFQ6IERJUkVDVElPTl9SSUdIVCxcbiAgICBESVJFQ1RJT05fVVA6IERJUkVDVElPTl9VUCxcbiAgICBESVJFQ1RJT05fRE9XTjogRElSRUNUSU9OX0RPV04sXG4gICAgRElSRUNUSU9OX0hPUklaT05UQUw6IERJUkVDVElPTl9IT1JJWk9OVEFMLFxuICAgIERJUkVDVElPTl9WRVJUSUNBTDogRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgIERJUkVDVElPTl9BTEw6IERJUkVDVElPTl9BTEwsXG5cbiAgICBNYW5hZ2VyOiBNYW5hZ2VyLFxuICAgIElucHV0OiBJbnB1dCxcbiAgICBUb3VjaEFjdGlvbjogVG91Y2hBY3Rpb24sXG5cbiAgICBUb3VjaElucHV0OiBUb3VjaElucHV0LFxuICAgIE1vdXNlSW5wdXQ6IE1vdXNlSW5wdXQsXG4gICAgUG9pbnRlckV2ZW50SW5wdXQ6IFBvaW50ZXJFdmVudElucHV0LFxuICAgIFRvdWNoTW91c2VJbnB1dDogVG91Y2hNb3VzZUlucHV0LFxuICAgIFNpbmdsZVRvdWNoSW5wdXQ6IFNpbmdsZVRvdWNoSW5wdXQsXG5cbiAgICBSZWNvZ25pemVyOiBSZWNvZ25pemVyLFxuICAgIEF0dHJSZWNvZ25pemVyOiBBdHRyUmVjb2duaXplcixcbiAgICBUYXA6IFRhcFJlY29nbml6ZXIsXG4gICAgUGFuOiBQYW5SZWNvZ25pemVyLFxuICAgIFN3aXBlOiBTd2lwZVJlY29nbml6ZXIsXG4gICAgUGluY2g6IFBpbmNoUmVjb2duaXplcixcbiAgICBSb3RhdGU6IFJvdGF0ZVJlY29nbml6ZXIsXG4gICAgUHJlc3M6IFByZXNzUmVjb2duaXplcixcblxuICAgIG9uOiBhZGRFdmVudExpc3RlbmVycyxcbiAgICBvZmY6IHJlbW92ZUV2ZW50TGlzdGVuZXJzLFxuICAgIGVhY2g6IGVhY2gsXG4gICAgbWVyZ2U6IG1lcmdlLFxuICAgIGV4dGVuZDogZXh0ZW5kLFxuICAgIGFzc2lnbjogYXNzaWduLFxuICAgIGluaGVyaXQ6IGluaGVyaXQsXG4gICAgYmluZEZuOiBiaW5kRm4sXG4gICAgcHJlZml4ZWQ6IHByZWZpeGVkXG59KTtcblxuLy8gdGhpcyBwcmV2ZW50cyBlcnJvcnMgd2hlbiBIYW1tZXIgaXMgbG9hZGVkIGluIHRoZSBwcmVzZW5jZSBvZiBhbiBBTURcbi8vICBzdHlsZSBsb2FkZXIgYnV0IGJ5IHNjcmlwdCB0YWcsIG5vdCBieSB0aGUgbG9hZGVyLlxudmFyIGZyZWVHbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9KSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuZnJlZUdsb2JhbC5IYW1tZXIgPSBIYW1tZXI7XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBIYW1tZXI7XG4gICAgfSk7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhhbW1lcjtcbn0gZWxzZSB7XG4gICAgd2luZG93W2V4cG9ydE5hbWVdID0gSGFtbWVyO1xufVxuXG59KSh3aW5kb3csIGRvY3VtZW50LCAnSGFtbWVyJyk7XG4iXX0=
