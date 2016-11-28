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
// version 4: now going to ES6 & Babel

"use strict";

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
			var _this = this;

			el.onclick = function (e) {
				e.stopPropagation();
				var thisnote = _this.getAttribute("data-notenumber");
				var notetext = document.querySelector(".notetext[data-notenumber=\"" + thisnote + "\"]").innerHTML;
				app.hidenotes();
				var insert = dom.create("<div class=\"notewindow\" id=\"notewindow\">\n\t\t\t\t\t\t" + notetext + "\n\t\t\t\t\t</div>");
				appdata.elements.main.appendChild(insert);
				document.getElementById("notewindow").onclick = function () {
					app.hidenotes();
				};
			};
		},
		checkboxgo: function checkboxgo(el) {
			var _this2 = this;

			el.onclick = function () {
				app.changetranslation(_this2.id.replace("check-", ""), document.getElementById(_this2.id).checked);
			};
		},
		checkboxspango: function checkboxspango(el) {
			var _this3 = this;

			el.onclick = function () {
				document.getElementById("check-" + _this3.id).checked = !document.getElementById("check-" + _this3.id).checked;
				app.changetranslation(_this3.id, document.getElementById("check-" + _this3.id).checked);
			};
		}
	},
	setupcontrols: function setupcontrols() {

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

		// document.querySelectorAll(".backtosettings").forEach(app.helpers.gosettings);
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = document.querySelectorAll(".backtosettings")[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var i = _step.value;

				app.helpers.gosettings(i);
			}

			// swipe controls
		} catch (err) {
			_didIteratorError = true;
			_iteratorError = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion && _iterator.return) {
					_iterator.return();
				}
			} finally {
				if (_didIteratorError) {
					throw _iteratorError;
				}
			}
		}

		var hammertime = new Hammer(appdata.elements.lens); // does this need to be a global?
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
		var div, padding, desiredwidth;
		var maxwidth = 0;

		if (dom.hasclass(appdata.elements.text, "poetry")) {

			// this is poetry, figure out longest line

			appdata.elements.text.style.paddingLeft = 0;
			for (var i = 0; i < divs.length; i++) {
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

		// add in translation chooser

		dom.removebyselector("#translatorlist");
		var insert = dom.create('<ul id="translatorlist"></ul>');
		document.getElementById("translationchoose").appendChild(insert);
		var translatorlist = document.querySelector("#translatorlist");
		for (var i in appdata.translationdata) {
			insert = dom.create("<li>\n\t\t\t\t\t<input type=\"checkbox\" id=\"check-" + appdata.translationdata[i].translationid + "\" />\n\t\t\t\t\t<span id=\"" + appdata.translationdata[i].translationid + "\" >" + appdata.translationdata[i].translationfullname + "</span>\n\t\t\t\t</li>");
			translatorlist.appendChild(insert);
			document.getElementById("check-" + appdata.translationdata[i].translationid).checked = appdata.currenttranslationlist.indexOf(appdata.translationdata[i].translationid) > -1;
		}

		// document.querySelectorAll("#translatorlist input[type=checkbox]").forEach(app.helpers.checkboxgo);
		var _iteratorNormalCompletion2 = true;
		var _didIteratorError2 = false;
		var _iteratorError2 = undefined;

		try {
			for (var _iterator2 = document.querySelectorAll("#translatorlist input[type=checkbox]")[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
				var _i3 = _step2.value;

				app.helpers.checkboxgo(_i3);
			}
			// document.querySelectorAll("#translatorlist span").forEach(app.helpers.checkboxspango);
		} catch (err) {
			_didIteratorError2 = true;
			_iteratorError2 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion2 && _iterator2.return) {
					_iterator2.return();
				}
			} finally {
				if (_didIteratorError2) {
					throw _iteratorError2;
				}
			}
		}

		var _iteratorNormalCompletion3 = true;
		var _didIteratorError3 = false;
		var _iteratorError3 = undefined;

		try {
			for (var _iterator3 = document.querySelectorAll("#translatorlist span")[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
				var _i4 = _step3.value;

				app.helpers.checkboxspango(_i4);
			}

			// add in toc
		} catch (err) {
			_didIteratorError3 = true;
			_iteratorError3 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion3 && _iterator3.return) {
					_iterator3.return();
				}
			} finally {
				if (_didIteratorError3) {
					throw _iteratorError3;
				}
			}
		}

		dom.removebyselector("#selectors");
		insert = dom.create("<div id=\"selectors\">\n\t\t\t\t<p>Canto: <select id=\"selectcanto\"></select></p>\n\t\t\t\t<p>Translation: <select id=\"selecttranslator\"></select></p>\n\t\t\t\t<p><span id=\"selectgo\">Go</span></p>\n\t\t\t</div>");
		document.getElementById("translationgo").appendChild(insert);
		for (var _i = 0; _i < appdata.cantocount; _i++) {
			insert = dom.create("<option id=\"canto" + _i + "\" " + (appdata.currentcanto == _i ? "selected" : "") + ">" + appdata.cantotitles[_i] + "</option>");
			document.getElementById("selectcanto").appendChild(insert);
		}
		for (var _i2 in appdata.currenttranslationlist) {
			for (var j = 0; j < appdata.translationdata.length; j++) {
				if (appdata.translationdata[j].translationid == appdata.currenttranslationlist[_i2]) {
					insert = dom.create("<option id=\"tr_" + appdata.translationdata[j].translationid + "\" " + (appdata.currenttranslation == _i2 ? "selected" : "") + ">" + appdata.translationdata[j].translationfullname + "</option>");
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = function () {
			var selected = document.getElementById("selecttranslator");
			var thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			var thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for (var _j = 0; _j < appdata.translationdata.length; _j++) {
				if (appdata.currenttranslationlist[_j] == thistrans) {
					app.setpage("lens");
					app.setlens(_j, thiscanto, 0);
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
		for (var _i5 in appdata.translationdata) {
			if (appdata.currenttranslationlist.indexOf(appdata.translationdata[_i5].translationid) > -1) {
				newlist.push(appdata.translationdata[_i5].translationid);
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
// dom.js

"use strict";

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
// carlyle.js

"use strict";

var carlyle = ["<p class=\"title\">Inferno</p>\n\t<p class=\"author\">John Aitken Carlyle, Thomas Okey &amp; P. H. Wiksteed</p>", "<p class=\"cantohead\">CANTO I</p>\n\t\t<p class=\"summary\">Dante finds himself astray in a dark Wood, where he spends a night of great misery. He says that death is hardly more bitter, than it is to recall what he suffered there; but that he will tell the fearful things he saw, in order that he may also tell how he found guidance, and first began to discern the real causes of all misery. He comes to a Hill; and seeing its summit already bright with the rays of the Sun, he begins to ascend it. The way to it looks quite deserted. He is met by a beautiful Leopard, which keeps distracting his attention from the Hill, and makes him turn back several times. The hour of the morning, the season, and the gay outward aspect of that animal, give him good hopes at first; but he is driven down and terrified by a Lion and a She-wolf. Virgil comes to his aid, and tells him that the Wolf lets none pass her way, but entangles and slays every one that tries to get up the mountain by the road on which she stands. He says a time will come when a swift and strong Greyhound shall clear the earth of her, and chase her into Hell. And he offers to conduct Dante by another road; to show him the eternal roots of misery and of joy, and leave him with a higher guide that will lead him up to Heaven.</p>\n\t\t<p>In the middle of the journey of our life\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">1</span>\n\t\t\t\t<span class=\"notetext\">The Vision takes place at Eastertide of the year 1300, that is to say, when Dante was thirty-five years old. <em>Cf.</em> <em>Psalms</em> xc. 10: &ldquo;The days of our years are threescore years and ten.&rdquo; See also <em>Convito</em> iv: &ldquo;Where the top of this arch of life may be, it is difficult to know.&nbsp;.&nbsp;.&nbsp;. I believe that in the perfectly natural man, it is at the thirty-fifth year.&rdquo;</span>\n\t\t</span>\n\t\tI came to myself in a dark wood\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">2</span>\n\t\t\t\t<span class=\"notetext\"><em>Cf.</em> <em>Convito</em> iv: &ldquo;.&nbsp;.&nbsp;.&nbsp;the adolescent who wenters into the Wood of Error of this life would not know how to keep to the good path if it were not pointed out to him by his elders.&rdquo; <em>Politically</em>: the <em>wood</em> stands for the troubled state of Italy in Dante&rsquo;s time.</span>\n\t\t\t</span>\n\t\twhere the straight way was lost.</p>\n\t\t<p>Ah! how hard a thing it is to tell what a wild, and rough, and stubborn wood this was, which in my thought renews the fear!</p>\n\t\t<p>So bitter is it, that scarsely more is death: but to treat of the good that there I found, I will relate the other things that I discerned.</p>\n\t\t<p>I cannot rightly tell how I entered it, so full of sleep was I about the moment that I left the true way.</p>\n\t\t<p>But after I had reached the foot of a Hill\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">3</span>\n\t\t\t\t<span class=\"notetext\">The &ldquo;holy Hill&rdquo; of the Bible; Bunyan&rsquo;s &ldquo;Delectable Mountains.&rdquo;</span>\n\t\t\t</span>\n\t\tthere, where that valley ended, which had pierced my heart with fear,</p>\n\t\t<p>I looked up and saw its shoulders already clothed with the rays of the Planet\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">4</span>\n\t\t\t\t<span class=\"notetext\"><em>Planet</em>, the sun, which was a planet according to the Ptolemaic system. Dante speaks elsewhere (<em>Conv.</em> iv) of the &ldquo;spiritual Sun, which is God.&rdquo;</span>\n\t\t\t</span>\n\t\tthat leads men straight on every road.</p>\n\t\t<p>Then the fear was somewhat calmed, which had continued in the lake of my heart the night that I passed so piteously.</p>\n\t\t<p>And as he, who with panting breath has escaped from the deep sea to the shore, turns to the dangerous water and gazes:</p>\n\t\t<p>so my mind, which still was fleeing, turned back to see the pass that no one ever left alive.</p>\n\t\t<p>After I had rested my wearied body a short while, I took the way again along the desert strand, so that the right foot always was the lower.\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">5</span>\n\t\t\t\t<span class=\"notetext\">Any one who is ascending a hill, and whose left foot is always the lower, must be bearing to the <em>right</em>.</span>\n\t\t\t</span>\n\t\t</p>\n\t\t<p>And behold, almost at the commencement of the steep, a Leopard,\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">6</span>\n\t\t\t\t<span class=\"notetext\">Worldly Pleasure; <em>politically</em>: Florence.</span>\n\t\t\t</span>\n\t\tlight and very nimble, which was covered with spotted hair.</p>\n\t\t<p>And it went not from before my face; nay, so impeded my way, that I had often turned to go back.</p>\n\t\t<p>The time was at the beginning of the morning; and the sun was mounting up with those stars,\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">7</span>\n\t\t\t\t<span class=\"notetext\">According to tradition, the sun was in Aries at the time of the Creation.</span>\n\t\t\t</span>\n\t\twhich were with him when Divine Love</p>\n\t\t<p>first moved those fair things: so that the hour of time and the sweet season caused me to have good hope</p>\n\t\t<p>of that animal with the gay skin; yet not so, but that I feared at the sight, which appeared to me, of a Lion.\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">8</span>\n\t\t\t\t<span class=\"notetext\">Ambition; <em>politically</em>: the Royal House of France.</span>\n\t\t\t</span>\n\t\t</p>\n\t\t<p>He seemed coming upon me with head erect, and furious hunger; so that the air seemed to have fear thereat;</p>\n\t\t<p>and a She-wolf,\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">9</span>\n\t\t\t\t<span class=\"notetext\"><em>Avarice</em>; <em>politically</em>: the Papal See. The three beasts are obviously taken from <em>Jeremiah</em> v.&nbsp;6.</span>\n\t\t\t</span>\n\t\tthat looked full of all cravings in her leanness; and has ere now made many live in sorrow.</p>\n\t\t<p>She brought such heaviness upon me with the terror of her aspect, that I lost the hope of ascending.</p>\n\t\t<p>And as one who is eager in gaining, and, when the time arrives that makes him lose, weeps and afflicts himself in all his thoughts:</p>\n\t\t<p>such that restless beast made me, which coming against me, by little and little drove me back to where the Sun is silent.</p>\n\t\t<p>Whilst I was rushing downwards, there appeared before my eyes one\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">10</span>\n\t\t\t\t<span class=\"notetext\">Virgil, who stands for Worldly Wisdom, and is Dante&rsquo;s guide through Hell and Purgatory (see Gardner, pp. 87, 88).<br /><br /><em>hoarse</em>, perhaps because the study of Virgil had been long neglected</span>\n\t\t\t</span>\n\t\twho seemed hoarse from long silence.</p>\n\t\t<p>When I saw him in the great desert, I cried: &ldquo;Have pity on me, whate&rsquo;er thou be, whether shade or veritable man!&rdquo;</p>\n\t\t<p>He answered me: &ldquo;Not man, a man I once was; and my parents were Lombards, and both of Mantua by country.</p>\n\t\t<p>TK!</p>", "<p class=\"cantohead\">CANTO II</p>\n\t\t<p class=\"summary\">End of the first day. Brief Invocation. Danet is discouraged at the outset, when he begins seriously to reflect upon what he has undertaken. That very day, his own strength had miserably failed before the Lion and the She-Wolf. He bids Virgil consider well whether there be sufficient virtue in him, before committing him to so dreadful a passage. He recalls the great errands of &AElig;neas and of Paul, and the great results of their going to the immortal world; and comparing himself with them, he feels his heart quail, and is ready to turn back. Virgil discerns the fear that has come over him; and in order to remove it, tells him how a blessed Spirit has descended from Heaven expressly to command the journey. On hearing this, Dante immediately casts off pusillanimity, and at once accepts the Freedom and the Mission that are given him.</p>\n\t\t<p>TK!</p>", "<p class=\"cantohead\">CANTO III</p>\n\t\t<p class=\"summary\">Inscription over the Gate of Hell, and the impression it produces upon Dante. Virgil takes him by the hand, and leads him in. The dismal sounds make him burst into tears. His head is quite bewildered. Upon a Dark Plain, which goes around the confines, he sees a vast multitude of spirits running behind a flag in great haste and confusion, urged on by furious wasps and hornets. These are the unhappy people, who never were alive&mdash;never awakened to take any part in either good or evil, to care for anything but themselves. They are mixed with a similar class of fallen angels. After passing through the crowd of them, the Poets come to a great River, which flows round the brim of Hell; and then descends to form the other rivers, the marshes, and the ice that we shall meet with. It is the river Acheron; and on its Shore all that die under the wrath of God assemble from every country to be ferried over by the demon Charon. He makes them enter his boat by glaring on them with his burning eyes. Having seen these, and being refused a passage by Charon, Dante is suddenly stunned by a violent trembling of the ground, accompanied with wind and lightning, and falls down in a state of insensibility.</p>\n\t\t<p>TK!</p>"];

module.exports = carlyle;

},{}],6:[function(require,module,exports){
// italian.js

"use strict";

var italian = ["<p class=\"title\">Inferno</p>\n\t<p class=\"author\">Dante Alighieri</p>", "<p class=\"cantohead\">1</p>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Nel mezzo del cammin di nostra vita</p>\n\t\t\t<p>mi ritrovai per una selva oscura,</p>\n\t\t\t<p>ch&eacute; la diritta via era smarrita.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ahi quanto a dir qual era &egrave; cosa dura</p>\n\t\t\t<p>esta selva selvaggia e aspra e forte</p>\n\t\t\t<p>che nel pensier rinova la paura!</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Tant&rsquo; &egrave; amara che poco &egrave; pi&ugrave; morte;</p>\n\t\t\t<p>ma per trattar del ben ch&rsquo;i&rsquo; vi trovai,</p>\n\t\t\t<p>dir&ograve; de l&rsquo;altre cose ch&rsquo;i&rsquo; v&rsquo;ho scorte.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Io non so ben ridir com&rsquo; i&rsquo; v&rsquo;intrai,</p>\n\t\t\t<p>tant&rsquo; era pien di sonno a quel punto</p>\n\t\t\t<p>che la verace via abbandonai.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ma poi ch&rsquo;i&rsquo; fui al pi&egrave; d&rsquo;un colle giunto,</p>\n\t\t\t<p>l&agrave; dove terminava quella valle</p>\n\t\t\t<p>che m&rsquo;avea di paura il cor compunto,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>guardai in alto e vidi le sue spalle</p>\n\t\t\t<p>vestite gi&agrave; de&rsquo; raggi del pianeta</p>\n\t\t\t<p>che mena dritto altrui per ogne calle.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Allor fu la paura un poco queta,</p>\n\t\t\t<p>che nel lago del cor m&rsquo;era durata</p>\n\t\t\t<p>la notte ch&rsquo;i&rsquo; passai con tanta pieta.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E come quei che con lena affannata,</p>\n\t\t\t<p>uscito fuor del pelago a la riva,</p>\n\t\t\t<p>si volge a l&rsquo;acqua perigliosa e guata,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>cos&igrave; l&rsquo;animo mio, ch&rsquo;ancor fuggiva,</p>\n\t\t\t<p>si volse a retro a rimirar lo passo</p>\n\t\t\t<p>che non lasci&ograve; gi&agrave; mai persona viva.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Poi ch&rsquo;&egrave;i posato un poco il corpo lasso,</p>\n\t\t\t<p>ripresi via per la piaggia diserta,</p>\n\t\t\t<p>s&igrave; che &rsquo;l pi&egrave; fermo sempre era &rsquo;l pi&ugrave; basso.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ed ecco, quasi al cominciar de l&rsquo;erta,</p>\n\t\t\t<p>una lonza leggera e presta molto,</p>\n\t\t\t<p>che di pel macolato era coverta;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>e non mi si partia dinanzi al volto,</p>\n\t\t\t<p>anzi &rsquo;mpediva tanto il mio cammino,</p>\n\t\t\t<p>ch&rsquo;i&rsquo; fui per ritornar pi&ugrave; volte v&ograve;lto.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Temp&rsquo; era dal principio del mattino,</p>\n\t\t\t<p>e &rsquo;l sol montava &rsquo;n s&ugrave; con quelle stelle</p>\n\t\t\t<p>ch&rsquo;eran con lui quando l&rsquo;amor divino</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>mosse di prima quelle cose belle;</p>\n\t\t\t<p>s&igrave; ch&rsquo;a bene sperar m&rsquo;era cagione</p>\n\t\t\t<p>di quella fiera a la gaetta pelle</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>l&rsquo;ora del tempo e la dolce stagione;</p>\n\t\t\t<p>ma non s&igrave; che paura non mi desse</p>\n\t\t\t<p>la vista che m&rsquo;apparve d&rsquo;un leone.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Questi parea che contra me venisse</p>\n\t\t\t<p>con la test&rsquo; alta e con rabbiosa fame,</p>\n\t\t\t<p>s&igrave; che parea che l&rsquo;aere ne tremesse.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ed una lupa, che di tutte brame</p>\n\t\t\t<p>sembiava carca ne la sua magrezza,</p>\n\t\t\t<p>e molte genti f&eacute; gi&agrave; viver grame,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>questa mi porse tanto di gravezza</p>\n\t\t\t<p>con la paura ch&rsquo;uscia di sua vista,</p>\n\t\t\t<p>ch&rsquo;io perdei la speranza de l&rsquo;altezza.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E qual &egrave; quei che volontieri acquista,</p>\n\t\t\t<p>e giugne &rsquo;l tempo che perder lo face,</p>\n\t\t\t<p>che &rsquo;n tutti suoi pensier piange e s&rsquo;attrista;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>tal mi fece la bestia sanza pace,</p>\n\t\t\t<p>che, venendomi &rsquo;ncontro, a poco a poco</p>\n\t\t\t<p>mi ripigneva l&agrave; dove &rsquo;l sol tace.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Mentre ch&rsquo;i&rsquo; rovinava in basso loco,</p>\n\t\t\t<p>dinanzi a li occhi mi si fu offerto</p>\n\t\t\t<p>chi per lungo silenzio parea fioco.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Quando vidi costui nel gran diserto,</p>\n\t\t\t<p>&laquo;Miserere di me&raquo;, gridai a lui,</p>\n\t\t\t<p>&laquo;qual che tu sii, od ombra od omo certo!&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Rispuosemi: &laquo;Non omo, omo gi&agrave; fui,</p>\n\t\t\t<p>e li parenti miei furon lombardi,</p>\n\t\t\t<p>mantoani per patr&iuml;a ambedui.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Nacqui sub Iulio, ancor che fosse tardi,</p>\n\t\t\t<p>e vissi a Roma sotto &rsquo;l buono Augusto</p>\n\t\t\t<p>nel tempo de li d&egrave;i falsi e bugiardi.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Poeta fui, e cantai di quel giusto</p>\n\t\t\t<p>figliuol d&rsquo;Anchise che venne di Troia,</p>\n\t\t\t<p>poi che &rsquo;l superbo Il&iuml;&oacute;n fu combusto.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ma tu perch&eacute; ritorni a tanta noia?</p>\n\t\t\t<p>perch&eacute; non sali il dilettoso monte</p>\n\t\t\t<p>ch&rsquo;&egrave; principio e cagion di tutta gioia?&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>&laquo;Or se&rsquo; tu quel Virgilio e quella fonte</p>\n\t\t\t<p>che spandi di parlar s&igrave; largo fiume?&raquo;,</p>\n\t\t\t<p>rispuos&rsquo; io lui con vergognosa fronte.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>&laquo;O de li altri poeti onore e lume,</p>\n\t\t\t<p>vagliami &rsquo;l lungo studio e &rsquo;l grande amore</p>\n\t\t\t<p>che m&rsquo;ha fatto cercar lo tuo volume.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Tu se&rsquo; lo mio maestro e &rsquo;l mio autore,</p>\n\t\t\t<p>tu se&rsquo; solo colui da cu&rsquo; io tolsi</p>\n\t\t\t<p>lo bello stilo che m&rsquo;ha fatto onore.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Vedi la bestia per cu&rsquo; io mi volsi;</p>\n\t\t\t<p>aiutami da lei, famoso saggio,</p>\n\t\t\t<p>ch&rsquo;ella mi fa tremar le vene e i polsi&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>&laquo;A te convien tenere altro v&iuml;aggio&raquo;,</p>\n\t\t\t<p>rispuose, poi che lagrimar mi vide,</p>\n\t\t\t<p>&laquo;se vuo&rsquo; campar d&rsquo;esto loco selvaggio;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>ch&eacute; questa bestia, per la qual tu gride,</p>\n\t\t\t<p>non lascia altrui passar per la sua via,</p>\n\t\t\t<p>ma tanto lo &rsquo;mpedisce che l&rsquo;uccide;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>e ha natura s&igrave; malvagia e ria,</p>\n\t\t\t<p>che mai non empie la bramosa voglia,</p>\n\t\t\t<p>e dopo &rsquo;l pasto ha pi&ugrave; fame che pria.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Molti son li animali a cui s&rsquo;ammoglia,</p>\n\t\t\t<p>e pi&ugrave; saranno ancora, infin che &rsquo;l veltro</p>\n\t\t\t<p>verr&agrave;, che la far&agrave; morir con doglia.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Questi non ciber&agrave; terra n&eacute; peltro,</p>\n\t\t\t<p>ma sap&iuml;enza, amore e virtute,</p>\n\t\t\t<p>e sua nazion sar&agrave; tra feltro e feltro.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Di quella umile Italia fia salute</p>\n\t\t\t<p>per cui mor&igrave; la vergine Cammilla,</p>\n\t\t\t<p>Eurialo e Turno e Niso di ferute.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Questi la caccer&agrave; per ogne villa,</p>\n\t\t\t<p>fin che l&rsquo;avr&agrave; rimessa ne lo &rsquo;nferno,</p>\n\t\t\t<p>l&agrave; onde &rsquo;nvidia prima dipartilla.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ond&rsquo; io per lo tuo me&rsquo; penso e discerno</p>\n\t\t\t<p>che tu mi segui, e io sar&ograve; tua guida,</p>\n\t\t\t<p>e trarrotti di qui per loco etterno;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>ove udirai le disperate strida,</p>\n\t\t\t<p>vedrai li antichi spiriti dolenti,</p>\n\t\t\t<p>ch&rsquo;a la seconda morte ciascun grida;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>e vederai color che son contenti</p>\n\t\t\t<p>nel foco, perch&eacute; speran di venire</p>\n\t\t\t<p>quando che sia a le beate genti.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>A le quai poi se tu vorrai salire,</p>\n\t\t\t<p>anima fia a ci&ograve; pi&ugrave; di me degna:</p>\n\t\t\t<p>con lei ti lascer&ograve; nel mio partire;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>ch&eacute; quello imperador che l&agrave; s&ugrave; regna,</p>\n\t\t\t<p>perch&rsquo; i&rsquo; fu&rsquo; ribellante a la sua legge,</p>\n\t\t\t<p>non vuol che &rsquo;n sua citt&agrave; per me si vegna.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>In tutte parti impera e quivi regge;</p>\n\t\t\t<p>quivi &egrave; la sua citt&agrave; e l&rsquo;alto seggio:</p>\n\t\t\t<p>oh felice colui cu&rsquo; ivi elegge!&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E io a lui: &laquo;Poeta, io ti richeggio</p>\n\t\t\t<p>per quello Dio che tu non conoscesti,</p>\n\t\t\t<p>acci&ograve; ch&rsquo;io fugga questo male e peggio,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>che tu mi meni l&agrave; dov&rsquo; or dicesti,</p>\n\t\t\t<p>s&igrave; ch&rsquo;io veggia la porta di san Pietro</p>\n\t\t\t<p>e color cui tu fai cotanto mesti&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Allor si mosse, e io li tenni dietro.</p>\n\t\t</div>", "<p class=\"cantohead\">2</p>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Lo giorno se n&rsquo;andava, e l&rsquo;aere bruno</p>\n\t\t\t<p>toglieva li animai che sono in terra</p>\n\t\t\t<p>da le fatiche loro; e io sol uno</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>m&rsquo;apparecchiava a sostener la guerra</p>\n\t\t\t<p>s&igrave; del cammino e s&igrave; de la pietate,</p>\n\t\t\t<p>che ritrarr&agrave; la mente che non erra.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>O muse, o alto ingegno, or m&rsquo;aiutate;</p>\n\t\t\t<p>o mente che scrivesti ci&ograve; ch&rsquo;io vidi,</p>\n\t\t\t<p>qui si parr&agrave; la tua nobilitate.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Io cominciai: &laquo;Poeta che mi guidi,</p>\n\t\t\t<p>guarda la mia virt&ugrave; s&rsquo;ell&rsquo; &egrave; possente,</p>\n\t\t\t<p>prima ch&rsquo;a l&rsquo;alto passo tu mi fidi.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Tu dici che di Silv&iuml;o il parente,</p>\n\t\t\t<p>corruttibile ancora, ad immortale</p>\n\t\t\t<p>secolo and&ograve;, e fu sensibilmente.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Per&ograve;, se l&rsquo;avversario d&rsquo;ogne male</p>\n\t\t\t<p>cortese i fu, pensando l&rsquo;alto effetto</p>\n\t\t\t<p>ch&rsquo;uscir dovea di lui, e &rsquo;l chi e &rsquo;l quale</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>non pare indegno ad omo d&rsquo;intelletto;</p>\n\t\t\t<p>ch&rsquo;e&rsquo; fu de l&rsquo;alma Roma e di suo impero</p>\n\t\t\t<p>ne l&rsquo;empireo ciel per padre eletto:</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>la quale e &rsquo;l quale, a voler dir lo vero,</p>\n\t\t\t<p>fu stabilita per lo loco santo</p>\n\t\t\t<p>u&rsquo; siede il successor del maggior Piero.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Per quest&rsquo; andata onde li dai tu vanto,</p>\n\t\t\t<p>intese cose che furon cagione</p>\n\t\t\t<p>di sua vittoria e del papale ammanto.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Andovvi poi lo Vas d&rsquo;elez&iuml;one,</p>\n\t\t\t<p>per recarne conforto a quella fede</p>\n\t\t\t<p>ch&rsquo;&egrave; principio a la via di salvazione.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ma io, perch&eacute; venirvi? o chi &rsquo;l concede?</p>\n\t\t\t<p>Io non En\xEBa, io non Paulo sono;</p>\n\t\t\t<p>me degno a ci&ograve; n&eacute; io n&eacute; altri &rsquo;l crede.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Per che, se del venire io m&rsquo;abbandono,</p>\n\t\t\t<p>temo che la venuta non sia folle.</p>\n\t\t\t<p>Se&rsquo; savio; intendi me&rsquo; ch&rsquo;i&rsquo; non ragiono&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E qual &egrave; quei che disvuol ci&ograve; che volle</p>\n\t\t\t<p>e per novi pensier cangia proposta,</p>\n\t\t\t<p>s&igrave; che dal cominciar tutto si tolle,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>tal mi fec&rsquo; &iuml;o &rsquo;n quella oscura costa,</p>\n\t\t\t<p>perch&eacute;, pensando, consumai la &rsquo;mpresa</p>\n\t\t\t<p>che fu nel cominciar cotanto tosta.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>&laquo;S&rsquo;i&rsquo; ho ben la parola tua intesa&raquo;,</p>\n\t\t\t<p>rispuose del magnanimo quell&rsquo; ombra,</p>\n\t\t\t<p>&laquo;l&rsquo;anima tua &egrave; da viltade offesa;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>la qual molte f&iuml;ate l&rsquo;omo ingombra</p>\n\t\t\t<p>s&igrave; che d&rsquo;onrata impresa lo rivolve,</p>\n\t\t\t<p>come falso veder bestia quand&rsquo; ombra.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Da questa tema acci&ograve; che tu ti solve,</p>\n\t\t\t<p>dirotti perch&rsquo; io venni e quel ch&rsquo;io &rsquo;ntesi</p>\n\t\t\t<p>nel primo punto che di te mi dolve.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Io era tra color che son sospesi,</p>\n\t\t\t<p>e donna mi chiam&ograve; beata e bella,</p>\n\t\t\t<p>tal che di comandare io la richiesi.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Lucevan li occhi suoi pi&ugrave; che la stella;</p>\n\t\t\t<p>e cominciommi a dir soave e piana,</p>\n\t\t\t<p>con angelica voce, in sua favella:</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>\u201CO anima cortese mantoana,</p>\n\t\t\t<p>di cui la fama ancor nel mondo dura,</p>\n\t\t\t<p>e durer&agrave; quanto &rsquo;l mondo lontana,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>l&rsquo;amico mio, e non de la ventura,</p>\n\t\t\t<p>ne la diserta piaggia &egrave; impedito</p>\n\t\t\t<p>s&igrave; nel cammin, che v&ograve;lt&rsquo; &egrave; per paura;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>e temo che non sia gi&agrave; s&igrave; smarrito,</p>\n\t\t\t<p>ch&rsquo;io mi sia tardi al soccorso levata,</p>\n\t\t\t<p>per quel ch&rsquo;i&rsquo; ho di lui nel cielo udito.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Or movi, e con la tua parola ornata</p>\n\t\t\t<p>e con ci&ograve; c&rsquo;ha mestieri al suo campare,</p>\n\t\t\t<p>l&rsquo;aiuta s&igrave; ch&rsquo;i&rsquo; ne sia consolata.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>I&rsquo; son Beatrice che ti faccio andare;</p>\n\t\t\t<p>vegno del loco ove tornar disio;</p>\n\t\t\t<p>amor mi mosse, che mi fa parlare.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Quando sar&ograve; dinanzi al segnor mio,</p>\n\t\t\t<p>di te mi loder&ograve; sovente a lui\u201D.</p>\n\t\t\t<p>Tacette allora, e poi comincia&rsquo; io:</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>\u201CO donna di virt&ugrave; sola per cui</p>\n\t\t\t<p>l&rsquo;umana spezie eccede ogne contento</p>\n\t\t\t<p>di quel ciel c&rsquo;ha minor li cerchi sui,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>tanto m&rsquo;aggrada il tuo comandamento,</p>\n\t\t\t<p>che l&rsquo;ubidir, se gi&agrave; fosse, m&rsquo;&egrave; tardi;</p>\n\t\t\t<p>pi&ugrave; non t&rsquo;&egrave; uo&rsquo; ch&rsquo;aprirmi il tuo talento.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ma dimmi la cagion che non ti guardi</p>\n\t\t\t<p>de lo scender qua giuso in questo centro</p>\n\t\t\t<p>de l&rsquo;ampio loco ove tornar tu ardi\u201D.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>\u201CDa che tu vuo&rsquo; saver cotanto a dentro,</p>\n\t\t\t<p>dirotti brievemente\u201D, mi rispuose,</p>\n\t\t\t<p>\u201Cperch&rsquo; i&rsquo; non temo di venir qua entro.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Temer si dee di sole quelle cose</p>\n\t\t\t<p>c&rsquo;hanno potenza di fare altrui male;</p>\n\t\t\t<p>de l&rsquo;altre no, ch&eacute; non son paurose.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>I&rsquo; son fatta da Dio, sua merc&eacute;, tale,</p>\n\t\t\t<p>che la vostra miseria non mi tange,</p>\n\t\t\t<p>n&eacute; fiamma d&rsquo;esto &rsquo;ncendio non m&rsquo;assale.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Donna &egrave; gentil nel ciel che si compiange</p>\n\t\t\t<p>di questo &rsquo;mpedimento ov&rsquo; io ti mando,</p>\n\t\t\t<p>s&igrave; che duro giudicio l&agrave; s&ugrave; frange.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Questa chiese Lucia in suo dimando</p>\n\t\t\t<p>e disse:\u2014Or ha bisogno il tuo fedele</p>\n\t\t\t<p>di te, e io a te lo raccomando\u2014.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Lucia, nimica di ciascun crudele,</p>\n\t\t\t<p>si mosse, e venne al loco dov&rsquo; i&rsquo; era,</p>\n\t\t\t<p>che mi sedea con l&rsquo;antica Rachele.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Disse:\u2014Beatrice, loda di Dio vera,</p>\n\t\t\t<p>ch&eacute; non soccorri quei che t&rsquo;am&ograve; tanto,</p>\n\t\t\t<p>ch&rsquo;usc&igrave; per te de la volgare schiera?</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Non odi tu la pieta del suo pianto,</p>\n\t\t\t<p>non vedi tu la morte che &rsquo;l combatte</p>\n\t\t\t<p>su la fiumana ove &rsquo;l mar non ha vanto?\u2014.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Al mondo non fur mai persone ratte</p>\n\t\t\t<p>a far lor pro o a fuggir lor danno,</p>\n\t\t\t<p>com&rsquo; io, dopo cotai parole fatte,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>venni qua gi&ugrave; del mio beato scanno,</p>\n\t\t\t<p>fidandomi del tuo parlare onesto,</p>\n\t\t\t<p>ch&rsquo;onora te e quei ch&rsquo;udito l&rsquo;hanno\u201D.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Poscia che m&rsquo;ebbe ragionato questo,</p>\n\t\t\t<p>li occhi lucenti lagrimando volse,</p>\n\t\t\t<p>per che mi fece del venir pi&ugrave; presto.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E venni a te cos&igrave; com&rsquo; ella volse:</p>\n\t\t\t<p>d&rsquo;inanzi a quella fiera ti levai</p>\n\t\t\t<p>che del bel monte il corto andar ti tolse.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Dunque: che &egrave;? perch&eacute;, perch&eacute; restai,</p>\n\t\t\t<p>perch&eacute; tanta vilt&agrave; nel core allette,</p>\n\t\t\t<p>perch&eacute; ardire e franchezza non hai,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>poscia che tai tre donne benedette</p>\n\t\t\t<p>curan di te ne la corte del cielo,</p>\n\t\t\t<p>e &rsquo;l mio parlar tanto ben ti promette?&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Quali fioretti dal notturno gelo</p>\n\t\t\t<p>chinati e chiusi, poi che &rsquo;l sol li &rsquo;mbianca,</p>\n\t\t\t<p>si drizzan tutti aperti in loro stelo,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>tal mi fec&rsquo; io di mia virtude stanca,</p>\n\t\t\t<p>e tanto buono ardire al cor mi corse,</p>\n\t\t\t<p>ch&rsquo;i&rsquo; cominciai come persona franca:</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>&laquo;Oh pietosa colei che mi soccorse!</p>\n\t\t\t<p>e te cortese ch&rsquo;ubidisti tosto</p>\n\t\t\t<p>a le vere parole che ti porse!</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Tu m&rsquo;hai con disiderio il cor disposto</p>\n\t\t\t<p>s&igrave; al venir con le parole tue,</p>\n\t\t\t<p>ch&rsquo;i&rsquo; son tornato nel primo proposto.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Or va, ch&rsquo;un sol volere &egrave; d&rsquo;ambedue:</p>\n\t\t\t<p>tu duca, tu segnore e tu maestro&raquo;.</p>\n\t\t\t<p>Cos&igrave; li dissi; e poi che mosso fue,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>intrai per lo cammino alto e silvestro.</p>\n\t\t</div>", "<p class=\"cantohead\">3</p>\n\t\t<div class=\"stanza\">\n\t\t\t<p>\u2018&lsquo;Per me si va ne la citt&agrave; dolente,</p>\n\t\t\t<p>per me si va ne l&rsquo;etterno dolore,</p>\n\t\t\t<p>per me si va tra la perduta gente.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Giustizia mosse il mio alto fattore;</p>\n\t\t\t<p>fecemi la divina podestate,</p>\n\t\t\t<p>la somma sap&iuml;enza e &rsquo;l primo amore.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Dinanzi a me non fuor cose create</p>\n\t\t\t<p>se non etterne, e io etterno duro.</p>\n\t\t\t<p>Lasciate ogne speranza, voi ch&rsquo;intrate&rsquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Queste parole di colore oscuro</p>\n\t\t\t<p>vid&rsquo; &iuml;o scritte al sommo d&rsquo;una porta;</p>\n\t\t\t<p>per ch&rsquo;io: &laquo;Maestro, il senso lor m&rsquo;&egrave; duro&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ed elli a me, come persona accorta:</p>\n\t\t\t<p>&laquo;Qui si convien lasciare ogne sospetto;</p>\n\t\t\t<p>ogne vilt&agrave; convien che qui sia morta.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Noi siam venuti al loco ov&rsquo; i&rsquo; t&rsquo;ho detto</p>\n\t\t\t<p>che tu vedrai le genti dolorose</p>\n\t\t\t<p>c&rsquo;hanno perduto il ben de l&rsquo;intelletto&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E poi che la sua mano a la mia puose</p>\n\t\t\t<p>con lieto volto, ond&rsquo; io mi confortai,</p>\n\t\t\t<p>mi mise dentro a le segrete cose.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Quivi sospiri, pianti e alti guai</p>\n\t\t\t<p>risonavan per l&rsquo;aere sanza stelle,</p>\n\t\t\t<p>per ch&rsquo;io al cominciar ne lagrimai.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Diverse lingue, orribili favelle,</p>\n\t\t\t<p>parole di dolore, accenti d&rsquo;ira,</p>\n\t\t\t<p>voci alte e fioche, e suon di man con elle</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>facevano un tumulto, il qual s&rsquo;aggira</p>\n\t\t\t<p>sempre in quell&rsquo; aura sanza tempo tinta,</p>\n\t\t\t<p>come la rena quando turbo spira.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E io ch&rsquo;avea d&rsquo;error la testa cinta,</p>\n\t\t\t<p>dissi: &laquo;Maestro, che &egrave; quel ch&rsquo;i&rsquo; odo?</p>\n\t\t\t<p>e che gent&rsquo; &egrave; che par nel duol s&igrave; vinta?&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ed elli a me: &laquo;Questo misero modo</p>\n\t\t\t<p>tegnon l&rsquo;anime triste di coloro</p>\n\t\t\t<p>che visser sanza &rsquo;nfamia e sanza lodo.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Mischiate sono a quel cattivo coro</p>\n\t\t\t<p>de li angeli che non furon ribelli</p>\n\t\t\t<p>n&eacute; fur fedeli a Dio, ma per s&eacute; fuoro.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Caccianli i ciel per non esser men belli,</p>\n\t\t\t<p>n&eacute; lo profondo inferno li riceve,</p>\n\t\t\t<p>ch&rsquo;alcuna gloria i rei avrebber d&rsquo;elli&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E io: &laquo;Maestro, che &egrave; tanto greve</p>\n\t\t\t<p>a lor che lamentar li fa s&igrave; forte?&raquo;.</p>\n\t\t\t<p>Rispuose: &laquo;Dicerolti molto breve.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Questi non hanno speranza di morte,</p>\n\t\t\t<p>e la lor cieca vita &egrave; tanto bassa,</p>\n\t\t\t<p>che &rsquo;nvid&iuml;osi son d&rsquo;ogne altra sorte.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Fama di loro il mondo esser non lassa;</p>\n\t\t\t<p>misericordia e giustizia li sdegna:</p>\n\t\t\t<p>non ragioniam di lor, ma guarda e passa&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E io, che riguardai, vidi una &rsquo;nsegna</p>\n\t\t\t<p>che girando correva tanto ratta,</p>\n\t\t\t<p>che d&rsquo;ogne posa mi parea indegna;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>e dietro le ven&igrave;a s&igrave; lunga tratta</p>\n\t\t\t<p>di gente, ch&rsquo;i&rsquo; non averei creduto</p>\n\t\t\t<p>che morte tanta n&rsquo;avesse disfatta.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Poscia ch&rsquo;io v&rsquo;ebbi alcun riconosciuto,</p>\n\t\t\t<p>vidi e conobbi l&rsquo;ombra di colui</p>\n\t\t\t<p>che fece per viltade il gran rifiuto.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Incontanente intesi e certo fui</p>\n\t\t\t<p>che questa era la setta d&rsquo;i cattivi,</p>\n\t\t\t<p>a Dio spiacenti e a&rsquo; nemici sui.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Questi sciaurati, che mai non fur vivi,</p>\n\t\t\t<p>erano ignudi e stimolati molto</p>\n\t\t\t<p>da mosconi e da vespe ch&rsquo;eran ivi.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Elle rigavan lor di sangue il volto,</p>\n\t\t\t<p>che, mischiato di lagrime, a&rsquo; lor piedi</p>\n\t\t\t<p>da fastidiosi vermi era ricolto.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E poi ch&rsquo;a riguardar oltre mi diedi,</p>\n\t\t\t<p>vidi genti a la riva d&rsquo;un gran fiume;</p>\n\t\t\t<p>per ch&rsquo;io dissi: &laquo;Maestro, or mi concedi</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>ch&rsquo;i&rsquo; sappia quali sono, e qual costume</p>\n\t\t\t<p>le fa di trapassar parer s&igrave; pronte,</p>\n\t\t\t<p>com&rsquo; i&rsquo; discerno per lo fioco lume&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ed elli a me: &laquo;Le cose ti fier conte</p>\n\t\t\t<p>quando noi fermerem li nostri passi</p>\n\t\t\t<p>su la trista riviera d&rsquo;Acheronte&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Allor con li occhi vergognosi e bassi,</p>\n\t\t\t<p>temendo no &rsquo;l mio dir li fosse grave,</p>\n\t\t\t<p>infino al fiume del parlar mi trassi.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ed ecco verso noi venir per nave</p>\n\t\t\t<p>un vecchio, bianco per antico pelo,</p>\n\t\t\t<p>gridando: &laquo;Guai a voi, anime prave!</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Non isperate mai veder lo cielo:</p>\n\t\t\t<p>i&rsquo; vegno per menarvi a l&rsquo;altra riva</p>\n\t\t\t<p>ne le tenebre etterne, in caldo e &rsquo;n gelo.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E tu che se&rsquo; cost&igrave;, anima viva,</p>\n\t\t\t<p>p&agrave;rtiti da cotesti che son morti&raquo;.</p>\n\t\t\t<p>Ma poi che vide ch&rsquo;io non mi partiva,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>disse: &laquo;Per altra via, per altri porti</p>\n\t\t\t<p>verrai a piaggia, non qui, per passare:</p>\n\t\t\t<p>pi&ugrave; lieve legno convien che ti porti&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>E &rsquo;l duca lui: &laquo;Caron, non ti crucciare:</p>\n\t\t\t<p>vuolsi cos&igrave; col&agrave; dove si puote</p>\n\t\t\t<p>ci&ograve; che si vuole, e pi&ugrave; non dimandare&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Quinci fuor quete le lanose gote</p>\n\t\t\t<p>al nocchier de la livida palude,</p>\n\t\t\t<p>che &rsquo;ntorno a li occhi avea di fiamme rote.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Ma quell&rsquo; anime, ch&rsquo;eran lasse e nude,</p>\n\t\t\t<p>cangiar colore e dibattero i denti,</p>\n\t\t\t<p>ratto che &rsquo;nteser le parole crude.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Bestemmiavano Dio e lor parenti,</p>\n\t\t\t<p>l&rsquo;umana spezie e &rsquo;l loco e &rsquo;l tempo e &rsquo;l seme</p>\n\t\t\t<p>di lor semenza e di lor nascimenti.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Poi si ritrasser tutte quante insieme,</p>\n\t\t\t<p>forte piangendo, a la riva malvagia</p>\n\t\t\t<p>ch&rsquo;attende ciascun uom che Dio non teme.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Caron dimonio, con occhi di bragia</p>\n\t\t\t<p>loro accennando, tutte le raccoglie;</p>\n\t\t\t<p>batte col remo qualunque s&rsquo;adagia.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Come d&rsquo;autunno si levan le foglie</p>\n\t\t\t<p>l&rsquo;una appresso de l&rsquo;altra, fin che &rsquo;l ramo</p>\n\t\t\t<p>vede a la terra tutte le sue spoglie,</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>similemente il mal seme d&rsquo;Adamo</p>\n\t\t\t<p>gittansi di quel lito ad una ad una,</p>\n\t\t\t<p>per cenni come augel per suo richiamo.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Cos&igrave; sen vanno su per l&rsquo;onda bruna,</p>\n\t\t\t<p>e avanti che sien di l&agrave; discese,</p>\n\t\t\t<p>anche di qua nuova schiera s&rsquo;auna.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>&laquo;Figliuol mio&raquo;, disse &rsquo;l maestro cortese,</p>\n\t\t\t<p>&laquo;quelli che muoion ne l&rsquo;ira di Dio</p>\n\t\t\t<p>tutti convegnon qui d&rsquo;ogne paese;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>e pronti sono a trapassar lo rio,</p>\n\t\t\t<p>ch&eacute; la divina giustizia li sprona,</p>\n\t\t\t<p>s&igrave; che la tema si volve in disio.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Quinci non passa mai anima buona;</p>\n\t\t\t<p>e per&ograve;, se Caron di te si lagna,</p>\n\t\t\t<p>ben puoi sapere omai che &rsquo;l suo dir suona&raquo;.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Finito questo, la buia campagna</p>\n\t\t\t<p>trem&ograve; s&igrave; forte, che de lo spavento</p>\n\t\t\t<p>la mente di sudore ancor mi bagna.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>La terra lagrimosa diede vento,</p>\n\t\t\t<p>che balen&ograve; una luce vermiglia</p>\n\t\t\t<p>la qual mi vinse ciascun sentimento;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>e caddi come l&rsquo;uom cui sonno piglia.</p>\n\t\t</div>"];

module.exports = italian;

},{}],7:[function(require,module,exports){
// longfellow.js

"use strict";

var longfellow = ["<p class=\"title\">Inferno</p>\n\t<p class=\"author\">Henry Wadsworth Longfellow</p>", "<p class=\"cantohead\">Inferno: Canto I</p>\n\t<div class=\"stanza\">\n\t\t<p>Midway upon the journey of our life</p>\n\t\t<p class=\"slindent\">I found myself within a forest dark,</p>\n\t\t<p class=\"slindent\">For the straightforward pathway had been lost.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Ah me! how hard a thing it is to say</p>\n\t\t<p class=\"slindent\">What was this forest savage, rough, and stern,</p>\n\t\t<p class=\"slindent\">Which in the very thought renews the fear.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>So bitter is it, death is little more;</p>\n\t\t<p class=\"slindent\">But of the good to treat, which there I found,</p>\n\t\t<p class=\"slindent\">Speak will I of the other things I saw there.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>I cannot well repeat how there I entered,</p>\n\t\t<p class=\"slindent\">So full was I of slumber at the moment</p>\n\t\t<p class=\"slindent\">In which I had abandoned the true way.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>But after I had reached a mountain&rsquo;s foot,</p>\n\t\t<p class=\"slindent\">At that point where the valley terminated,</p>\n\t\t<p class=\"slindent\">Which had with consternation pierced my heart,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Upward I looked, and I beheld its shoulders,</p>\n\t\t<p class=\"slindent\">Vested already with that planet&rsquo;s rays</p>\n\t\t<p class=\"slindent\">Which leadeth others right by every road.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Then was the fear a little quieted</p>\n\t\t<p class=\"slindent\">That in my heart&rsquo;s lake had endured throughout</p>\n\t\t<p class=\"slindent\">The night, which I had passed so piteously.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And even as he, who, with distressful breath,</p>\n\t\t<p class=\"slindent\">Forth issued from the sea upon the shore,</p>\n\t\t<p class=\"slindent\">Turns to the water perilous and gazes;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>So did my soul, that still was fleeing onward,</p>\n\t\t<p class=\"slindent\">Turn itself back to re-behold the pass</p>\n\t\t<p class=\"slindent\">Which never yet a living person left.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>After my weary body I had rested,</p>\n\t\t<p class=\"slindent\">The way resumed I on the desert slope,</p>\n\t\t<p class=\"slindent\">So that the firm foot ever was the lower.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And lo! almost where the ascent began,</p>\n\t\t<p class=\"slindent\">A panther light and swift exceedingly,</p>\n\t\t<p class=\"slindent\">Which with a spotted skin was covered o&rsquo;er!</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And never moved she from before my face,</p>\n\t\t<p class=\"slindent\">Nay, rather did impede so much my way,</p>\n\t\t<p class=\"slindent\">That many times I to return had turned.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>The time was the beginning of the morning,</p>\n\t\t<p class=\"slindent\">And up the sun was mounting with those stars</p>\n\t\t<p class=\"slindent\">That with him were, what time the Love Divine</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>At first in motion set those beauteous things;</p>\n\t\t<p class=\"slindent\">So were to me occasion of good hope,</p>\n\t\t<p class=\"slindent\">The variegated skin of that wild beast,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>The hour of time, and the delicious season;</p>\n\t\t<p class=\"slindent\">But not so much, that did not give me fear</p>\n\t\t<p class=\"slindent\">A lion&rsquo;s aspect which appeared to me.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>He seemed as if against me he were coming</p>\n\t\t<p class=\"slindent\">With head uplifted, and with ravenous hunger,</p>\n\t\t<p class=\"slindent\">So that it seemed the air was afraid of him;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And a she-wolf, that with all hungerings</p>\n\t\t<p class=\"slindent\">Seemed to be laden in her meagreness,</p>\n\t\t<p class=\"slindent\">And many folk has caused to live forlorn!</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>She brought upon me so much heaviness,</p>\n\t\t<p class=\"slindent\">With the affright that from her aspect came,</p>\n\t\t<p class=\"slindent\">That I the hope relinquished of the height.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And as he is who willingly acquires,</p>\n\t\t<p class=\"slindent\">And the time comes that causes him to lose,</p>\n\t\t<p class=\"slindent\">Who weeps in all his thoughts and is despondent,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>E&rsquo;en such made me that beast withouten peace,</p>\n\t\t<p class=\"slindent\">Which, coming on against me by degrees</p>\n\t\t<p class=\"slindent\">Thrust me back thither where the sun is silent.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>While I was rushing downward to the lowland,</p>\n\t\t<p class=\"slindent\">Before mine eyes did one present himself,</p>\n\t\t<p class=\"slindent\">Who seemed from long-continued silence hoarse.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>When I beheld him in the desert vast,</p>\n\t\t<p class=\"slindent\">&ldquo;Have pity on me,&rdquo; unto him I cried,</p>\n\t\t<p class=\"slindent\">&ldquo;Whiche&rsquo;er thou art, or shade or real man!&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>He answered me: &ldquo;Not man; man once I was,</p>\n\t\t<p class=\"slindent\">And both my parents were of Lombardy,</p>\n\t\t<p class=\"slindent\">And Mantuans by country both of them.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&lsquo;Sub Julio&rsquo; was I born, though it was late,</p>\n\t\t<p class=\"slindent\">And lived at Rome under the good Augustus,</p>\n\t\t<p class=\"slindent\">During the time of false and lying gods.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>A poet was I, and I sang that just</p>\n\t\t<p class=\"slindent\">Son of Anchises, who came forth from Troy,</p>\n\t\t<p class=\"slindent\">After that Ilion the superb was burned.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>But thou, why goest thou back to such annoyance?</p>\n\t\t<p class=\"slindent\">Why climb&rsquo;st thou not the Mount Delectable,</p>\n\t\t<p class=\"slindent\">Which is the source and cause of every joy?&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&ldquo;Now, art thou that Virgilius and that fountain</p>\n\t\t<p class=\"slindent\">Which spreads abroad so wide a river of speech?&rdquo;</p>\n\t\t<p class=\"slindent\">I made response to him with bashful forehead.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&ldquo;O, of the other poets honour and light,</p>\n\t\t<p class=\"slindent\">Avail me the long study and great love</p>\n\t\t<p class=\"slindent\">That have impelled me to explore thy volume!</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Thou art my master, and my author thou,</p>\n\t\t<p class=\"slindent\">Thou art alone the one from whom I took</p>\n\t\t<p class=\"slindent\">The beautiful style that has done honour to me.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Behold the beast, for which I have turned back;</p>\n\t\t<p class=\"slindent\">Do thou protect me from her, famous Sage,</p>\n\t\t<p class=\"slindent\">For she doth make my veins and pulses tremble.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&ldquo;Thee it behoves to take another road,&rdquo;</p>\n\t\t<p class=\"slindent\">Responded he, when he beheld me weeping,</p>\n\t\t<p class=\"slindent\">&ldquo;If from this savage place thou wouldst escape;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Because this beast, at which thou criest out,</p>\n\t\t<p class=\"slindent\">Suffers not any one to pass her way,</p>\n\t\t<p class=\"slindent\">But so doth harass him, that she destroys him;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And has a nature so malign and ruthless,</p>\n\t\t<p class=\"slindent\">That never doth she glut her greedy will,</p>\n\t\t<p class=\"slindent\">And after food is hungrier than before.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Many the animals with whom she weds,</p>\n\t\t<p class=\"slindent\">And more they shall be still, until the Greyhound</p>\n\t\t<p class=\"slindent\">Comes, who shall make her perish in her pain.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>He shall not feed on either earth or pelf,</p>\n\t\t<p class=\"slindent\">But upon wisdom, and on love and virtue;</p>\n\t\t<p class=\"slindent\">&rsquo;Twixt Feltro and Feltro shall his nation be;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Of that low Italy shall he be the saviour,</p>\n\t\t<p class=\"slindent\">On whose account the maid Camilla died,</p>\n\t\t<p class=\"slindent\">Euryalus, Turnus, Nisus, of their wounds;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Through every city shall he hunt her down,</p>\n\t\t<p class=\"slindent\">Until he shall have driven her back to Hell,</p>\n\t\t<p class=\"slindent\">There from whence envy first did let her loose.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Therefore I think and judge it for thy best</p>\n\t\t<p class=\"slindent\">Thou follow me, and I will be thy guide,</p>\n\t\t<p class=\"slindent\">And lead thee hence through the eternal place,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Where thou shalt hear the desperate lamentations,</p>\n\t\t<p class=\"slindent\">Shalt see the ancient spirits disconsolate,</p>\n\t\t<p class=\"slindent\">Who cry out each one for the second death;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And thou shalt see those who contented are</p>\n\t\t<p class=\"slindent\">Within the fire, because they hope to come,</p>\n\t\t<p class=\"slindent\">Whene&rsquo;er it may be, to the blessed people;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>To whom, then, if thou wishest to ascend,</p>\n\t\t<p class=\"slindent\">A soul shall be for that than I more worthy;</p>\n\t\t<p class=\"slindent\">With her at my departure I will leave thee;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Because that Emperor, who reigns above,</p>\n\t\t<p class=\"slindent\">In that I was rebellious to his law,</p>\n\t\t<p class=\"slindent\">Wills that through me none come into his city.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>He governs everywhere, and there he reigns;</p>\n\t\t<p class=\"slindent\">There is his city and his lofty throne;</p>\n\t\t<p class=\"slindent\">O happy he whom thereto he elects!&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And I to him: &ldquo;Poet, I thee entreat,</p>\n\t\t<p class=\"slindent\">By that same God whom thou didst never know,</p>\n\t\t<p class=\"slindent\">So that I may escape this woe and worse,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Thou wouldst conduct me there where thou hast said,</p>\n\t\t<p class=\"slindent\">That I may see the portal of Saint Peter,</p>\n\t\t<p class=\"slindent\">And those thou makest so disconsolate.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Then he moved on, and I behind him followed.</p>\n\t</div>", "<p class=\"cantohead\">Inferno: Canto II</p>\n\t<div class=\"stanza\">\n\t\t<p>Day was departing, and the embrowned air</p>\n\t\t<p class=\"slindent\">Released the animals that are on earth</p>\n\t\t<p class=\"slindent\">From their fatigues; and I the only one</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Made myself ready to sustain the war,</p>\n\t\t<p class=\"slindent\">Both of the way and likewise of the woe,</p>\n\t\t<p class=\"slindent\">Which memory that errs not shall retrace.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>O Muses, O high genius, now assist me!</p>\n\t\t<p class=\"slindent\">O memory, that didst write down what I saw,</p>\n\t\t<p class=\"slindent\">Here thy nobility shall be manifest!</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And I began: &ldquo;Poet, who guidest me,</p>\n\t\t<p class=\"slindent\">Regard my manhood, if it be sufficient,</p>\n\t\t<p class=\"slindent\">Ere to the arduous pass thou dost confide me.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Thou sayest, that of Silvius the parent,</p>\n\t\t<p class=\"slindent\">While yet corruptible, unto the world</p>\n\t\t<p class=\"slindent\">Immortal went, and was there bodily.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>But if the adversary of all evil</p>\n\t\t<p class=\"slindent\">Was courteous, thinking of the high effect</p>\n\t\t<p class=\"slindent\">That issue would from him, and who, and what,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>To men of intellect unmeet it seems not;</p>\n\t\t<p class=\"slindent\">For he was of great Rome, and of her empire</p>\n\t\t<p class=\"slindent\">In the empyreal heaven as father chosen;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>The which and what, wishing to speak the truth,</p>\n\t\t<p class=\"slindent\">Were stablished as the holy place, wherein</p>\n\t\t<p class=\"slindent\">Sits the successor of the greatest Peter.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Upon this journey, whence thou givest him vaunt,</p>\n\t\t<p class=\"slindent\">Things did he hear, which the occasion were</p>\n\t\t<p class=\"slindent\">Both of his victory and the papal mantle.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Thither went afterwards the Chosen Vessel,</p>\n\t\t<p class=\"slindent\">To bring back comfort thence unto that Faith,</p>\n\t\t<p class=\"slindent\">Which of salvation&rsquo;s way is the beginning.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>But I, why thither come, or who concedes it?</p>\n\t\t<p class=\"slindent\">I not Aeneas am, I am not Paul,</p>\n\t\t<p class=\"slindent\">Nor I, nor others, think me worthy of it.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Therefore, if I resign myself to come,</p>\n\t\t<p class=\"slindent\">I fear the coming may be ill-advised;</p>\n\t\t<p class=\"slindent\">Thou&rsquo;rt wise, and knowest better than I speak.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And as he is, who unwills what he willed,</p>\n\t\t<p class=\"slindent\">And by new thoughts doth his intention change,</p>\n\t\t<p class=\"slindent\">So that from his design he quite withdraws,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Such I became, upon that dark hillside,</p>\n\t\t<p class=\"slindent\">Because, in thinking, I consumed the emprise,</p>\n\t\t<p class=\"slindent\">Which was so very prompt in the beginning.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&ldquo;If I have well thy language understood,&rdquo;</p>\n\t\t<p class=\"slindent\">Replied that shade of the Magnanimous,</p>\n\t\t<p class=\"slindent\">&ldquo;Thy soul attainted is with cowardice,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Which many times a man encumbers so,</p>\n\t\t<p class=\"slindent\">It turns him back from honoured enterprise,</p>\n\t\t<p class=\"slindent\">As false sight doth a beast, when he is shy.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>That thou mayst free thee from this apprehension,</p>\n\t\t<p class=\"slindent\">I&rsquo;ll tell thee why I came, and what I heard</p>\n\t\t<p class=\"slindent\">At the first moment when I grieved for thee.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Among those was I who are in suspense,</p>\n\t\t<p class=\"slindent\">And a fair, saintly Lady called to me</p>\n\t\t<p class=\"slindent\">In such wise, I besought her to command me.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Her eyes where shining brighter than the Star;</p>\n\t\t<p class=\"slindent\">And she began to say, gentle and low,</p>\n\t\t<p class=\"slindent\">With voice angelical, in her own language:</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&lsquo;O spirit courteous of Mantua,</p>\n\t\t<p class=\"slindent\">Of whom the fame still in the world endures,</p>\n\t\t<p class=\"slindent\">And shall endure, long-lasting as the world;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>A friend of mine, and not the friend of fortune,</p>\n\t\t<p class=\"slindent\">Upon the desert slope is so impeded</p>\n\t\t<p class=\"slindent\">Upon his way, that he has turned through terror,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And may, I fear, already be so lost,</p>\n\t\t<p class=\"slindent\">That I too late have risen to his succour,</p>\n\t\t<p class=\"slindent\">From that which I have heard of him in Heaven.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Bestir thee now, and with thy speech ornate,</p>\n\t\t<p class=\"slindent\">And with what needful is for his release,</p>\n\t\t<p class=\"slindent\">Assist him so, that I may be consoled.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Beatrice am I, who do bid thee go;</p>\n\t\t<p class=\"slindent\">I come from there, where I would fain return;</p>\n\t\t<p class=\"slindent\">Love moved me, which compelleth me to speak.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>When I shall be in presence of my Lord,</p>\n\t\t<p class=\"slindent\">Full often will I praise thee unto him.&rsquo;</p>\n\t\t<p class=\"slindent\">Then paused she, and thereafter I began:</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&lsquo;O Lady of virtue, thou alone through whom</p>\n\t\t<p class=\"slindent\">The human race exceedeth all contained</p>\n\t\t<p class=\"slindent\">Within the heaven that has the lesser circles,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>So grateful unto me is thy commandment,</p>\n\t\t<p class=\"slindent\">To obey, if &lsquo;twere already done, were late;</p>\n\t\t<p class=\"slindent\">No farther need&lsquo;st thou ope to me thy wish.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>But the cause tell me why thou dost not shun</p>\n\t\t<p class=\"slindent\">The here descending down into this centre,</p>\n\t\t<p class=\"slindent\">From the vast place thou burnest to return to.&rsquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&lsquo;Since thou wouldst fain so inwardly discern,</p>\n\t\t<p class=\"slindent\">Briefly will I relate,&rsquo; she answered me,</p>\n\t\t<p class=\"slindent\">&lsquo;Why I am not afraid to enter here.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Of those things only should one be afraid</p>\n\t\t<p class=\"slindent\">Which have the power of doing others harm;</p>\n\t\t<p class=\"slindent\">Of the rest, no; because they are not fearful.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>God in his mercy such created me</p>\n\t\t<p class=\"slindent\">That misery of yours attains me not,</p>\n\t\t<p class=\"slindent\">Nor any flame assails me of this burning.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>A gentle Lady is in Heaven, who grieves</p>\n\t\t<p class=\"slindent\">At this impediment, to which I send thee,</p>\n\t\t<p class=\"slindent\">So that stern judgment there above is broken.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>In her entreaty she besought Lucia,</p>\n\t\t<p class=\"slindent\">And said, &ldquo;Thy faithful one now stands in need</p>\n\t\t<p class=\"slindent\">Of thee, and unto thee I recommend him.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Lucia, foe of all that cruel is,</p>\n\t\t<p class=\"slindent\">Hastened away, and came unto the place</p>\n\t\t<p class=\"slindent\">Where I was sitting with the ancient Rachel.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&ldquo;Beatrice&rdquo; said she, &ldquo;the true praise of God,</p>\n\t\t<p class=\"slindent\">Why succourest thou not him, who loved thee so,</p>\n\t\t<p class=\"slindent\">For thee he issued from the vulgar herd?</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Dost thou not hear the pity of his plaint?</p>\n\t\t<p class=\"slindent\">Dost thou not see the death that combats him</p>\n\t\t<p class=\"slindent\">Beside that flood, where ocean has no vaunt?&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Never were persons in the world so swift</p>\n\t\t<p class=\"slindent\">To work their weal and to escape their woe,</p>\n\t\t<p class=\"slindent\">As I, after such words as these were uttered,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Came hither downward from my blessed seat,</p>\n\t\t<p class=\"slindent\">Confiding in thy dignified discourse,</p>\n\t\t<p class=\"slindent\">Which honours thee, and those who&rsquo;ve listened to it.&rsquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>After she thus had spoken unto me,</p>\n\t\t<p class=\"slindent\">Weeping, her shining eyes she turned away;</p>\n\t\t<p class=\"slindent\">Whereby she made me swifter in my coming;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And unto thee I came, as she desired;</p>\n\t\t<p class=\"slindent\">I have delivered thee from that wild beast,</p>\n\t\t<p class=\"slindent\">Which barred the beautiful mountain&rsquo;s short ascent.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>What is it, then?  Why, why dost thou delay?</p>\n\t\t<p class=\"slindent\">Why is such baseness bedded in thy heart?</p>\n\t\t<p class=\"slindent\">Daring and hardihood why hast thou not,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Seeing that three such Ladies benedight</p>\n\t\t<p class=\"slindent\">Are caring for thee in the court of Heaven,</p>\n\t\t<p class=\"slindent\">And so much good my speech doth promise thee?&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Even as the flowerets, by nocturnal chill,</p>\n\t\t<p class=\"slindent\">Bowed down and closed, when the sun whitens them,</p>\n\t\t<p class=\"slindent\">Uplift themselves all open on their stems;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Such I became with my exhausted strength,</p>\n\t\t<p class=\"slindent\">And such good courage to my heart there coursed,</p>\n\t\t<p class=\"slindent\">That I began, like an intrepid person:</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&ldquo;O she compassionate, who succoured me,</p>\n\t\t<p class=\"slindent\">And courteous thou, who hast obeyed so soon</p>\n\t\t<p class=\"slindent\">The words of truth which she addressed to thee!</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Thou hast my heart so with desire disposed</p>\n\t\t<p class=\"slindent\">To the adventure, with these words of thine,</p>\n\t\t<p class=\"slindent\">That to my first intent I have returned.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Now go, for one sole will is in us both,</p>\n\t\t<p class=\"slindent\">Thou Leader, and thou Lord, and Master thou.&rdquo;</p>\n\t\t<p class=\"slindent\">Thus said I to him; and when he had moved,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>I entered on the deep and savage way.</p>\n\t</div>", "<p class=\"cantohead\">Inferno: Canto III</p>\n\t<div class=\"stanza\">\n\t\t<p>&ldquo;Through me the way is to the city dolent;</p>\n\t\t<p class=\"slindent\">Through me the way is to eternal dole;</p>\n\t\t<p class=\"slindent\">Through me the way among the people lost.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Justice incited my sublime Creator;</p>\n\t\t<p class=\"slindent\">Created me divine Omnipotence,</p>\n\t\t<p class=\"slindent\">The highest Wisdom and the primal Love.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Before me there were no created things,</p>\n\t\t<p class=\"slindent\">Only eterne, and I eternal last.</p>\n\t\t<p class=\"slindent\">All hope abandon, ye who enter in!&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>These words in sombre colour I beheld</p>\n\t\t<p class=\"slindent\">Written upon the summit of a gate;</p>\n\t\t<p class=\"slindent\">Whence I: &ldquo;Their sense is, Master, hard to me!&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And he to me, as one experienced:</p>\n\t\t<p class=\"slindent\">&ldquo;Here all suspicion needs must be abandoned,</p>\n\t\t<p class=\"slindent\">All cowardice must needs be here extinct.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>We to the place have come, where I have told thee</p>\n\t\t<p class=\"slindent\">Thou shalt behold the people dolorous</p>\n\t\t<p class=\"slindent\">Who have foregone the good of intellect.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And after he had laid his hand on mine</p>\n\t\t<p class=\"slindent\">With joyful mien, whence I was comforted,</p>\n\t\t<p class=\"slindent\">He led me in among the secret things.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>There sighs, complaints, and ululations loud</p>\n\t\t<p class=\"slindent\">Resounded through the air without a star,</p>\n\t\t<p class=\"slindent\">Whence I, at the beginning, wept thereat.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Languages diverse, horrible dialects,</p>\n\t\t<p class=\"slindent\">Accents of anger, words of agony,</p>\n\t\t<p class=\"slindent\">And voices high and hoarse, with sound of hands,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Made up a tumult that goes whirling on</p>\n\t\t<p class=\"slindent\">For ever in that air for ever black,</p>\n\t\t<p class=\"slindent\">Even as the sand doth, when the whirlwind breathes.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And I, who had my head with horror bound,</p>\n\t\t<p class=\"slindent\">Said: &ldquo;Master, what is this which now I hear?</p>\n\t\t<p class=\"slindent\">What folk is this, which seems by pain so vanquished?&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And he to me: &ldquo;This miserable mode</p>\n\t\t<p class=\"slindent\">Maintain the melancholy souls of those</p>\n\t\t<p class=\"slindent\">Who lived withouten infamy or praise.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Commingled are they with that caitiff choir</p>\n\t\t<p class=\"slindent\">Of Angels, who have not rebellious been,</p>\n\t\t<p class=\"slindent\">Nor faithful were to God, but were for self.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>The heavens expelled them, not to be less fair;</p>\n\t\t<p class=\"slindent\">Nor them the nethermore abyss receives,</p>\n\t\t<p class=\"slindent\">For glory none the damned would have from them.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And I: &ldquo;O Master, what so grievous is</p>\n\t\t<p class=\"slindent\">To these, that maketh them lament so sore?&rdquo;</p>\n\t\t<p class=\"slindent\">He answered: &ldquo;I will tell thee very briefly.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>These have no longer any hope of death;</p>\n\t\t<p class=\"slindent\">And this blind life of theirs is so debased,</p>\n\t\t<p class=\"slindent\">They envious are of every other fate.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>No fame of them the world permits to be;</p>\n\t\t<p class=\"slindent\">Misericord and Justice both disdain them.</p>\n\t\t<p class=\"slindent\">Let us not speak of them, but look, and pass.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And I, who looked again, beheld a banner,</p>\n\t\t<p class=\"slindent\">Which, whirling round, ran on so rapidly,</p>\n\t\t<p class=\"slindent\">That of all pause it seemed to me indignant;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And after it there came so long a train</p>\n\t\t<p class=\"slindent\">Of people, that I ne&rsquo;er would have believed</p>\n\t\t<p class=\"slindent\">That ever Death so many had undone.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>When some among them I had recognised,</p>\n\t\t<p class=\"slindent\">I looked, and I beheld the shade of him</p>\n\t\t<p class=\"slindent\">Who made through cowardice the great refusal.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Forthwith I comprehended, and was certain,</p>\n\t\t<p class=\"slindent\">That this the sect was of the caitiff wretches</p>\n\t\t<p class=\"slindent\">Hateful to God and to his enemies.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>These miscreants, who never were alive,</p>\n\t\t<p class=\"slindent\">Were naked, and were stung exceedingly</p>\n\t\t<p class=\"slindent\">By gadflies and by hornets that were there.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>These did their faces irrigate with blood,</p>\n\t\t<p class=\"slindent\">Which, with their tears commingled, at their feet</p>\n\t\t<p class=\"slindent\">By the disgusting worms was gathered up.</p>\n</div>\n\t<div class=\"stanza\">\n\t\t<p>And when to gazing farther I betook me.</p>\n\t\t<p class=\"slindent\">People I saw on a great river&rsquo;s bank;</p>\n\t\t<p class=\"slindent\">Whence said I: &ldquo;Master, now vouchsafe to me,</p>\n</div>\n\t<div class=\"stanza\">\n\t\t<p>That I may know who these are, and what law</p>\n\t\t<p class=\"slindent\">Makes them appear so ready to pass over,</p>\n\t\t<p class=\"slindent\">As I discern athwart the dusky light.&rdquo;</p>\n</div>\n\t<div class=\"stanza\">\n\t\t<p>And he to me: &ldquo;These things shall all be known</p>\n\t\t<p class=\"slindent\">To thee, as soon as we our footsteps stay</p>\n\t\t<p class=\"slindent\">Upon the dismal shore of Acheron.&rdquo;</p>\n</div>\n\t<div class=\"stanza\">\n\t\t<p>Then with mine eyes ashamed and downward cast,</p>\n\t\t<p class=\"slindent\">Fearing my words might irksome be to him,</p>\n\t\t<p class=\"slindent\">From speech refrained I till we reached the river.</p>\n</div>\n\t<div class=\"stanza\">\n\t\t<p>And lo! towards us coming in a boat</p>\n\t\t<p class=\"slindent\">An old man, hoary with the hair of eld,</p>\n\t\t<p class=\"slindent\">Crying: &ldquo;Woe unto you, ye souls depraved!</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Hope nevermore to look upon the heavens;</p>\n\t\t<p class=\"slindent\">I come to lead you to the other shore,</p>\n\t\t<p class=\"slindent\">To the eternal shades in heat and frost.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And thou, that yonder standest, living soul,</p>\n\t\t<p class=\"slindent\">Withdraw thee from these people, who are dead!&rdquo;</p>\n\t\t<p class=\"slindent\">But when he saw that I did not withdraw,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>He said: &ldquo;By other ways, by other ports</p>\n\t\t<p class=\"slindent\">Thou to the shore shalt come, not here, for passage;</p>\n\t\t<p class=\"slindent\">A lighter vessel needs must carry thee.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And unto him the Guide: &ldquo;Vex thee not, Charon;</p>\n\t\t<p class=\"slindent\">It is so willed there where is power to do</p>\n\t\t<p class=\"slindent\">That which is willed; and farther question not.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Thereat were quieted the fleecy cheeks</p>\n\t\t<p class=\"slindent\">Of him the ferryman of the livid fen,</p>\n\t\t<p class=\"slindent\">Who round about his eyes had wheels of flame.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>But all those souls who weary were and naked</p>\n\t\t<p class=\"slindent\">Their colour changed and gnashed their teeth together,</p>\n\t\t<p class=\"slindent\">As soon as they had heard those cruel words.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>God they blasphemed and their progenitors,</p>\n\t\t<p class=\"slindent\">The human race, the place, the time, the seed</p>\n\t\t<p class=\"slindent\">Of their engendering and of their birth!</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Thereafter all together they drew back,</p>\n\t\t<p class=\"slindent\">Bitterly weeping, to the accursed shore,</p>\n\t\t<p class=\"slindent\">Which waiteth every man who fears not God.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>Charon the demon, with the eyes of glede,</p>\n\t\t<p class=\"slindent\">Beckoning to them, collects them all together,</p>\n\t\t<p class=\"slindent\">Beats with his oar whoever lags behind.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>As in the autumn-time the leaves fall off,</p>\n\t\t<p class=\"slindent\">First one and then another, till the branch</p>\n\t\t<p class=\"slindent\">Unto the earth surrenders all its spoils;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>In similar wise the evil seed of Adam</p>\n\t\t<p class=\"slindent\">Throw themselves from that margin one by one,</p>\n\t\t<p class=\"slindent\">At signals, as a bird unto its lure.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>So they depart across the dusky wave,</p>\n\t\t<p class=\"slindent\">And ere upon the other side they land,</p>\n\t\t<p class=\"slindent\">Again on this side a new troop assembles.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>&ldquo;My son,&rdquo; the courteous Master said to me,</p>\n\t\t<p class=\"slindent\">&ldquo;All those who perish in the wrath of God</p>\n\t\t<p class=\"slindent\">Here meet together out of every land;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And ready are they to pass o&rsquo;er the river,</p>\n\t\t<p class=\"slindent\">Because celestial Justice spurs them on,</p>\n\t\t<p class=\"slindent\">So that their fear is turned into desire.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>This way there never passes a good soul;</p>\n\t\t<p class=\"slindent\">And hence if Charon doth complain of thee,</p>\n\t\t<p class=\"slindent\">Well mayst thou know now what his speech imports.&rdquo;</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>This being finished, all the dusk champaign</p>\n\t\t<p class=\"slindent\">Trembled so violently, that of that terror</p>\n\t\t<p class=\"slindent\">The recollection bathes me still with sweat.</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>The land of tears gave forth a blast of wind,</p>\n\t\t<p class=\"slindent\">And fulminated a vermilion light,</p>\n\t\t<p class=\"slindent\">Which overmastered in me every sense,</p>\n\t</div>\n\t<div class=\"stanza\">\n\t\t<p>And as a man whom sleep hath seized I fell.</p>\n\t</div>"];

module.exports = longfellow;

},{}],8:[function(require,module,exports){
// norton.js

"use strict";

var norton = ["<p class=\"title\">Hell</p>\n\t<p class=\"author\">Charles Eliot Norton</p>", "<p class=\"cantohead\">CANTO I</p>\n\t\t<p class=\"summary\">Dante, astray in a wood, reaches the foot of a hill which he begins to ascend; he is hindered by three beasts; he turns back and is met by Virgil, who proposes to guide him into the eternal world.</p>\n\t\t<p>Midway upon the road of our life I found myself within a dark wood, for the right way had been missed. Ah! how hard a thing it is to tell what this wild and rough and dense wood was, which in thought renews the fear! So bitter is it that death is little more. But in order to treat of the good that there I found, I will tell of the other things that I have seen there. I cannot well recount how I entered it, so full was I of slumber at that point where I abandoned the true way. But after I had arrived at the foot of a hill, where that valley ended which had pierced my heart with fear, I looked on high, and saw its shoulders clothed already with the rays of the planet\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">1</span>\n\t\t\t\t<span class=\"notetext\">The sun, a planet according to the Ptolemaic system.</span>\n\t\t\t</span>\n\t\tthat leadeth men aright along every path. Then was the fear a little quieted which in the lake of my heart had lasted through the night that I passed so piteously. And even as one who with spent breath, issued out of the sea upon the shore, turns to the perilous water and gazes, so did my soul, which still was flying, turn back to look again upon the pass which never had a living person left.</p>\n\t\t<p>After I had rested a little my weary body I took my way again along the desert slope, so that the firm foot was always the lower. And ho! almost at the beginning of the steep a she-leopard, light and very nimble, which was covered with a spotted coat. And she did not move from before my face, nay, rather hindered so my road that to return I oftentimes had turned.</p>\n\t\t<p>The time was at the beginning of the morning, and the Sun was mounting upward with those stars that were with him when Love Divine first set in motion those beautiful things;\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">2</span>\n\t\t\t\t<span class=\"notetext\">According to old tradition the spring was the season of the creation.</span>\n\t\t\t</span>\n\t\tso that the hour of the time and the sweet season were occasion of good hope to me concerning that wild beast with the dappled skin. But not so that the sight which appeared to me of a lion did not give me fear. He seemed to be coming against me, with head high and with ravening hunger, so that it seemed that the air was affrighted at him. And a she-wolf,\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">2</span>\n\t\t\t\t<span class=\"notetext\">These three beasts correspond to the triple division of sins into those of incontinence, of violence, and of fraud. See Canto XI.</span>\n\t\t\t</span>\n\t\twho with all cravings seemed laden in her meagreness, and already had made many folk to live forlorn,&mdash;she caused me so much heaviness, with the fear that came from sight of her, that I lost hope of the height. And such as he is who gaineth willingly, and the time arrives that makes him lose, who in all his thoughts weeps and is sad,&mdash;such made me the beast without repose that, coming on against me, little by little was pushing me back thither where the Sun is silent.</p>\n\t\t<p>While I was falling back to the low place, before mine eyes appeared one who through long silence seemed hoarse. When I saw him in the great desert, &ldquo;Have pity on me!&rdquo; I cried to him, &ldquo;whatso thou art, or shade or real man.&rdquo; He answered me: &ldquo;Not man; man once I was, and my parents were Lombards, and Mantuans by country both. I was born sub Julio, though late, and I lived at Rome under the good Augustus, in the time of the false and lying gods. Poet was I, and sang of that just son of Anchises who came from Troy after proud Ilion had been burned. But thou, why returnest thou to so great annoy? Why dost thou not ascend the delectable mountain which is the source and cause of every joy?&rdquo;</p>\n\t\t<p>&ldquo;Art thou then that Virgil and that fount which poureth forth so large a stream of speech?&rdquo; replied I to him with bashful front: &ldquo;O honor and light of the other poem I may the long seal avail me, and the great love, which have made me search thy volume! Thou art my master and my author; thou alone art he from whom I took the fair style that hath done me honor. Behold the beast because of which I turned; help me against her, famous sage, for she makes any veins and pulses tremble.&rdquo; &ldquo;Thee it behoves to hold another course,&rdquo; he replied, when he saw me weeping, &ldquo;if thou wishest to escape from this savage place; for this beast, because of which thou criest out, lets not any one pass along her way, but so hinders him that she kills him! and she has a nature so malign and evil that she never sates her greedy will, and after food is hungrier than before. Many are the animals with which she wives, and there shall be more yet, till the hound\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">1</span>\n\t\t\t\t<span class=\"notetext\">Of whom the hound is the symbol, and to whom Dante looked for the deliverance of Italy from the discorda and misrule that made her wretched, is still matter of doubt, after centuries of controversy.</span>\n\t\t</span>\n\t\tshall come that will make her die of grief. He shall not feed on land or goods, but wisdom and love and valor, and his birthplace shall be between Feltro and Feltro. Of that humble\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">2</span>\n\t\t\t\t<span class=\"notetext\">Fallen, humiliated.</span>\n\t\t\t</span>\n\t\tItaly shall he be the salvation, for which the virgin Camilla died, and Euryalus, Turnus and Nisus of their wounds. He shall hunt her through every town till he shall have set her back in hell, there whence envy first sent her forth. Wherefore I think and deem it for thy best that thou follow me, and I will be thy guide, and will lead thee hence through the eternal place where thou shalt hear the despairing shrieks, shalt see the ancient spirits woeful who each proclaim the second death. And then thou shalt see those who are contented in the fire, because they hope to come, whenever it may be, to the blessed folk; to whom if thou wilt thereafter ascend, them shall be a soul more worthy than I for that. With her I will leave thee at my departure; for that Emperor who reigneth them above, because I was rebellious to His law, wills not that into His city any one should come through me. In all parts He governs and them He reigns: there in His city and His lofty seat. O happy he whom thereto He elects!&rdquo; And I to him, &ldquo;Poet, I beseech thee by that God whom thou didst not know, in order that I may escape this ill and worse, that thou lead me thither whom thou now hest said, so that I may see the gate of St. Peter, and those whom thou makest so afflicted.&rdquo;</p>\n\t\t<p>Then he moved on, and I behind him kept.</p>", "<p class=\"cantohead\">CANTO II</p>\n\t\t<p class=\"summary\">Dante, doubtful of his own powers, is discouraged at the outset.&mdash;Virgil cheers him by telling him that he has been sent to his aid by a blessed Spirit from Heaven.&mdash;Dante casts off fear, and the poets proceed.</p>\n\t\t<p>The day was going, and the dusky air was taking the living things that are on earth from their fatigues, and I alone was preparing to sustain the war alike of the road, and of the woe which the mind that erreth not shall retrace. O Muses, O lofty genius, now assist me! O mind that didst inscribe that which I saw, here shall thy nobility appear! I began:&mdash;&ldquo;Poet, that guidest me, consider my virtue, if it is sufficient, ere to the deep pass thou trustest me. Thou sayest that the parent of Silvius while still corruptible went to the immortal world and was there in the body. Wherefore if the Adversary of every ill was then courteous, thinking on the high effect that should proceed from him, and on the Who and the What,\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">1</span>\n\t\t\t\t<span class=\"notetext\">Who he was, and what should result.</span>\n\t\t\t</span>\n\t\tit seemeth not unmeet to the man of understanding; for in the empyreal heaven he had been chosen for father of revered Rome and of her empire; both which (to say truth indeed) were ordained for the holy place where the successor of the greater Peter hath his seat. Through this going, whereof thou givest him vaunt, he learned things which were the cause of his victory and of the papal mantle. Afterward the Chosen Vessel went thither to bring thence comfort to that faith which is the beginning of the way of salvation. But I, why go I thither? or who concedes it? I am not Aeneas, I am not Paul; me worthy of this, neither I nor others think; wherefore if I give myself up to go, I fear lest the going may be mad. Thou art wise, thou understandest better than I speak.&rdquo;</p>\n\t\t<p>And as is he who unwills what he willed, and because of new thoughts changes his design, so that he quite withdraws from beginning, such I became on that dark hillside: wherefore in my thought I abandoned the enterprise which had been so hasty in the beginning.</p>\n\t\t<p>&ldquo;If I have rightly understood thy speech,&rdquo; replied that shade of the magnanimous one, &ldquo;thy soul is hurt by cowardice, which oftentimes encumbereth a man so that it turns him back from honorable enterprise, as false seeing does a beast when it is startled. In order that thou loose thee from this fear I will tell thee wherefore I have come, and what I heard at the first moment that I grieved for thee. I was among those who are suspended,\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">1</span>\n\t\t\t\t<span class=\"notetext\">In Limbo, neither in Hell nor Heaven.</span>\n\t\t\t</span>\n\t\tand a Lady called me, so blessed and beautiful that I besought her to command. Her eyes were more lucent than the star, and she began to speak to me sweet and low, with angelic voice, in her own tongue: &lsquo;O courteous Mantuan soul, of whom the fame yet lasteth in the world, and shall last so long as the world endureth! a friend of mine and not of fortune upon the desert hillside is so hindered on his road that he has turned for fear, and I am afraid, through that which I have heard of him in heaven, lest already he be so astray that I may have risen late to his succor. Now do thou move, and with thy speech ornate, and with whatever is needful for his deliverance, assist him so that I may be consoled for him. I am Beatrice who make thee go. I come from a place whither I desire to return. Love moved me, and makes me speak. When I shall be before my Lord, I will commend thee often unto Him.&rsquo; Then she was silent, and thereon I began: &lsquo;O Lady of Virtue, thou alone through whom the human race surpasseth all contained within that heaven which hath the smallest circles!\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">2</span>\n\t\t\t\t<span class=\"notetext\">The heaven of the moon, nearest to the earth.</span>\n\t\t\t</span>\n\t\tso pleasing unto me is thy command that to obey it, were it already done, were slow to me. Thou hast no need further to open unto me thy will; but tell me the cause why thou guardest not thyself from descending down here into this centre, from the ample place whither thou burnest to return.&lsquo; &rsquo;Since thou wishest to know so inwardly, I will tell thee briefly,&rsquo; she replied to me, &lsquo;wherefore I fear not to come here within. One ought to fear those things only that have power of doing harm, the others not, for they are not dreadful. I am made by God, thanks be to Him, such that your misery toucheth me not, nor doth the flame of this burning assail me. A gentle Lady\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">3</span>\n\t\t\t\t<span class=\"notetext\">The Virgin.</span>\n\t\t\t</span>\n\t\tis in heaven who hath pity for this hindrance whereto I send thee, so that stern judgment there above she breaketh. She summoned Lucia in her request, and said, &ldquo;Thy faithful one now hath need of thee, and unto thee I commend him.&rdquo; Lucia, the foe of every cruel one, rose and came to the place where I was, seated with the ancient Rachel. She said, &ldquo;Beatrice, true praise of God, why dost thou not succor him who so loved thee that for thee he came forth from the vulgar throng? Dost thou not hear the pity of his plaint? Dost thou not see the death that combats him beside the stream whereof the sea hath no vaunt?&rdquo; In the world never were persons swift to seek their good, and to fly their harm, as I, after these words were uttered, came here below, from my blessed seat, putting my trust in thy upright speech, which honors thee and them who have heard it.&rsquo; After she had said this to me, weeping she turned her lucent eyes, whereby she made me more speedy in coming. And I came to thee as she willed. Thee have I delivered from that wild beast that took from thee the short ascent of the beautiful mountain. What is it then? Why, why dost thou hold back? why dost thou harbor such cowardice in thy heart? why hast thou not daring and boldness, since three blessed Ladies care for thee in the court of Heaven, and my speech pledges thee such good?&rdquo;</p>\n\t\t<p>As flowerets, bent and closed by the chill of night, after the sun shines on them straighten themselves all open on their stem, so I became with my weak virtue, and such good daring hastened to my heart that I began like one enfranchised: &ldquo;Oh compassionate she who succored me! and thou courteous who didst speedily obey the true words that she addressed to thee! Thou by thy words hast so disposed my heart with desire of going, that I have returned unto my first intent. Go on now, for one sole will is in us both: Thou Leader, thou Lord, and thou Master.&rdquo; Thus I said to him; and when he had moved on, I entered along the deep and savage road.</p>", "<p class=\"cantohead\">CANTO III</p>\n\t\t<p class=\"summary\">The gate of Hell.&mdash;Virgil lends Dante in.&mdash;The punishment of the neither good nor bad.&mdash;Acheron, and the sinners on its bank.&mdash;Charon.&mdash;Earthquake.&mdash;Dante swoons.</p>\n\t\t<p>&ldquo;Through me is the way into the woeful city; through me is the way into eternal woe; through me is the way among the lost people. Justice moved my lofty maker: the divine Power, the supreme Wisdom and the primal Love made me. Before me were no things created, unless eternal, and I eternal last. Leave every hope, ye who enter!&rdquo;</p>\n\t\t<p>These words of color obscure I saw written at the top of a gate; whereat I, &ldquo;Master, their meaning is dire to me.&rdquo;</p>\n\t\t<p>And he to me, like one who knew, &ldquo;Here it behoves to leave every fear; it behoves that all cowardice should here be dead. We have come to the place where I have told thee that thou shalt see the woeful people, who have lost the good of the understanding.&rdquo;</p>\n\t\t<p>And when he had put his hand on mine, with a glad countenance, wherefrom I took courage, he brought me within the secret things. Here sighs, laments, and deep wailings were resounding though the starless air; wherefore at first I wept thereat. Strange tongues, horrible cries, words of woe, accents of anger, voices high and hoarse, and sounds of hands with them, were making a tumult which whirls forever in that air dark without change, like the sand when the whirlwind breathes.</p>\n\t\t<p>And I, who had my head girt with horror, said, &ldquo;Master, what is it that I hear? and what folk are they who seem in woe so vanquished?&rdquo;</p>\n\t\t<p>And he to me, &ldquo;This miserable measure the wretched souls maintain of those who lived without infamy and without praise. Mingled are they with that caitiff choir of the angels, who were not rebels, nor were faithful to God, but were for themselves. The heavens chased them out in order to be not less beautiful, nor doth the depth of Hell receive them, because the damned would have some glory from them.&rdquo;</p>\n\t\t<p>And I, &ldquo;Master, what is so grievous to them, that makes them lament so bitterly?&rdquo;</p>\n\t\t<p>He answered, &ldquo;I will tell thee very briefly. These have no hope of death; and their blind life is so debased, that they are envious of every other lot. Fame of them the world permitteth not to be; mercy and justice disdain them. Let us not speak of them, but do thou look and pass on.&rdquo;</p>\n\t\t<p>And I, who was gazing, saw a banner, that whirling ran so swiftly that it seemed to me to scorn all repose, and behind it came so long a train of folk, that I could never have believed death had undone so many. After I had distinguished some among them, I saw and knew the shade of him who made, through cowardice, the great refusal.\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">1</span>\n\t\t\t\t<span class=\"notetext\">Who is intended by these words is uncertain.</span>\n\t\t\t</span>\n\t\tAt once I understood and was certain, that this was the sect of the caitiffs displeasing unto God, and unto his enemies. These wretches, who never were alive, were naked, and much stung by gad-flies and by wasps that were there. These streaked their faces with blood, which, mingled with tears, was harvested at their feet by loathsome worms.</p>\n\t\t<p>And when I gave myself to looking onward, I saw people on the bank of a great river; wherefore I said, &ldquo;Master, now grant to me that I may know who these are, and what rule makes them appear so ready to pass over, as I discern through the faint light.&rdquo; And he to me, &ldquo;The things will be clear to thee, when we shall set our steps on the sad marge of Acheron.&rdquo; Then with eyes bashful and cast down, fearing lest my speech had been irksome to him, far as to the river I refrained from speaking.</p>\n\t\t<p>And lo! coming toward us in a boat, an old man, white with ancient hair, crying, &ldquo;Woe to you, wicked souls! hope not ever to see Heaven! I come to carry you to the other bank, into eternal darkness, to heat and frost. And thou who art there, living soul, depart from these that are dead.&rdquo; But when he saw that I did not depart, he said, &ldquo;By another way, by other ports thou shalt come to the shore, not here, for passage; it behoves that a lighter bark bear thee.&rdquo;\n\t\t\t<span class=\"note\">\n\t\t\t\t<span class=\"noteno\">1</span>\n\t\t\t\t<span class=\"notetext\">The boat that bears the souls to Purgatory. Charon recognizes that Dante is not among the damned.</span>\n\t\t\t</span>\n\t\t</p>\n\t\t<p>And my Leader to him, &ldquo;Charon, vex not thyself, it is thus willed there where is power to do that which is willed; and farther ask not.&rdquo; Then the fleecy cheeks were quiet of the pilot of the livid marsh, who round about his eyes had wheels of flame.</p>\n\t\t<p>But those souls, who were weary and naked, changed color, and gnashed their teeth soon as they heard his cruel words. They blasphemed God and their parents, the human race, the place, the time and the seed of their sowing and of their birth. Then, bitterly weeping, they drew back all of them together to the evil bank, that waits for every man who fears not God. Charon the demon, with eyes of glowing coal, beckoning them, collects them all; he beats with his oar whoever lingers.</p>\n\t\t<p>As in autumn the leaves fall off one after the other, till the bough sees all its spoils upon the earth, in like wise the evil seed of Adam throw themselves from that shore one by one at signals, as the bird at his call. Thus they go over the dusky wave, and before they have landed on the farther side, already on this a new throng is gathered.</p>\n\t\t<p>&ldquo;My son,&rdquo; said the courteous Master, &ldquo;those who die in the wrath of God, all meet together here from every land. And they are eager to pass over the stream, for the divine justice spurs them, so that fear is turned to desire. This way a good soul never passes; and therefore if Charon snarleth at thee, thou now mayest well know what his speech signifies.&rdquo; This ended, the dark plain trembled so mightily, that the memory of the terror even now bathes me with sweat. The tearful land gave forth a wind that flashed a vermilion light which vanquished every sense of mine, and I fell as a man whom slumber seizes.</p>"];

module.exports = norton;

},{}],9:[function(require,module,exports){
// wright.js

"use strict";

var wright = ["<p class=\"title\">Inferno</p>\n\t<p class=\"author\">S. Fowler Wright</p>", "<p class=\"cantohead\">Canto I</p>\n\t\t<div class=\"stanza\">\n\t\t\t<p>ONE night, when half my life behind me lay,</p>\n\t\t\t<p>I wandered from the straight lost path afar.</p>\n\t\t\t<p>Through the great dark was no releasing way;</p>\n\t\t\t<p>Above that dark was no relieving star.</p>\n\t\t\t<p>If yet that terrored night I think or say,</p>\n\t\t\t<p>As death&rsquo;s cold hands its fears resuming are.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Gladly the dreads I felt, too dire to tell,</p>\n\t\t\t<p>The hopeless, pathless, lightless hours forgot,</p>\n\t\t\t<p>I turn my tale to that which next befell,</p>\n\t\t\t<p>When the dawn opened, and the night was not.</p>\n\t\t\t<p>The hollowed blackness of that waste, God wot,</p>\n\t\t\t<p>Shrank, thinned, and ceased. A blinding splendour hot</p>\n\t\t\t<p>Flushed the great height toward which my footsteps fell,</p>\n\t\t\t<p>And though it kindled from the nether hell,</p>\n\t\t\t<p>Or from the Star that all men leads, alike</p>\n\t\t\t<p>It showed me where the great dawn-glories strike</p>\n\t\t\t<p>The wide east, and the utmost peaks of snow.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>How first I entered on that path astray,</p>\n\t\t\t<p>Beset with sleep, I know not. This I know.</p>\n\t\t\t<p>When gained my feet the upward, lighted way,</p>\n\t\t\t<p>I backward gazed, as one the drowning sea,</p>\n\t\t\t<p>The deep strong tides, has baffled, and panting lies,</p>\n\t\t\t<p>On the shelved shore, and turns his eyes to see</p>\n\t\t\t<p>The league-wide wastes that held him. So mine eyes</p>\n\t\t\t<p>Surveyed that fear, the while my wearied frame</p>\n\t\t\t<p>Rested, and ever my heart&rsquo;s tossed lake became</p>\n\t\t\t<p>More quiet.</p>\n\t\t\t<p>Then from that pass released, which yet</p>\n\t\t\t<p>With living feet had no man left, I set</p>\n\t\t\t<p>My forward steps aslant the steep, that so,</p>\n\t\t\t<p>My right foot still the lower, I climbed.</p>\n\t\t\t<p class=\"slindent8em\">Below</p>\n\t\t\t<p>No more I gazed. Around, a slope of sand</p>\n\t\t\t<p>Was sterile of all growth on either hand,</p>\n\t\t\t<p>Or moving life, a spotted pard except,</p>\n\t\t\t<p>That yawning rose, and stretched, and purred and leapt</p>\n\t\t\t<p>So closely round my feet, that scarce I kept</p>\n\t\t\t<p>The course I would.</p>\n\t\t\t<p class=\"slindent4em\">That sleek and lovely thing,</p>\n\t\t\t<p>The broadening light, the breath of morn and spring,</p>\n\t\t\t<p>The sun, that with his stars in Aries lay,</p>\n\t\t\t<p>As when Divine Love on Creation&rsquo;s day</p>\n\t\t\t<p>First gave these fair things motion, all at one</p>\n\t\t\t<p>Made lightsome hope; but lightsome hope was none</p>\n\t\t\t<p>When down the slope there came with lifted head</p>\n\t\t\t<p>And back-blown mane and caverned mouth and red,</p>\n\t\t\t<p>A lion, roaring, all the air ashake</p>\n\t\t\t<p>That heard his hunger. Upward flight to take</p>\n\t\t\t<p>No heart was mine, for where the further way</p>\n\t\t\t<p>Mine anxious eyes explored, a she-wolf lay,</p>\n\t\t\t<p>That licked lean flanks, and waited. Such was she</p>\n\t\t\t<p>In aspect ruthless that I quaked to see,</p>\n\t\t\t<p>And where she lay among her bones had brought</p>\n\t\t\t<p>So many to grief before, that all my thought</p>\n\t\t\t<p>Aghast turned backward to the sunless night</p>\n\t\t\t<p>I left. But while I plunged in headlong flight</p>\n\t\t\t<p>To that most feared before, a shade, or man</p>\n\t\t\t<p>(Either he seemed), obstructing where I ran,</p>\n\t\t\t<p>Called to me with a voice that few should know,</p>\n\t\t\t<p>Faint from forgetful silence, &ldquo;Where ye go,</p>\n\t\t\t<p>Take heed. Why turn ye from the upward way?&rdquo;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>I cried, &ldquo;Or come ye from warm earth, or they</p>\n\t\t\t<p>The grave hath taken, in my mortal need</p>\n\t\t\t<p>Have mercy thou!&rdquo;</p>\n\t\t\t<p class=\"slindent4em\">He answered, &ldquo;Shade am I,</p>\n\t\t\t<p>That once was man; beneath the Lombard sky,</p>\n\t\t\t<p>In the late years of Julius born, and bred</p>\n\t\t\t<p>In Mantua, till my youthful steps were led</p>\n\t\t\t<p>To Rome, where yet the false gods lied to man;</p>\n\t\t\t<p>And when the great Augustan age began,</p>\n\t\t\t<p>I wrote the tale of Ilium burnt, and how</p>\n\t\t\t<p>Anchises&rsquo; son forth-pushed a venturous prow,</p>\n\t\t\t<p>Seeking unknown seas. But in what mood art thou</p>\n\t\t\t<p>To thus return to all the ills ye fled,</p>\n\t\t\t<p>The while the mountain of thy hope ahead</p>\n\t\t\t<p>Lifts into light, the source and cause of all</p>\n\t\t\t<p>Delectable things that may to man befall?&rdquo;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>I answered, &ldquo;Art thou then that Virgil, he</p>\n\t\t\t<p>From whom all grace of measured speech in me</p>\n\t\t\t<p>Derived? O glorious and far-guiding star!</p>\n\t\t\t<p>Now may the love-led studious hours and long</p>\n\t\t\t<p>In which I learnt how rich thy wonders are,</p>\n\t\t\t<p>Master and Author mine of Light and Song,</p>\n\t\t\t<p>Befriend me now, who knew thy voice, that few</p>\n\t\t\t<p>Yet hearken. All the name my work hath won</p>\n\t\t\t<p>Is thine of right, from whom I learned. To thee,</p>\n\t\t\t<p>Abashed, I grant it. . . Why the mounting sun</p>\n\t\t\t<p>No more I seek, ye scarce should ask, who see</p>\n\t\t\t<p>The beast that turned me, nor faint hope have I</p>\n\t\t\t<p>To force that passage if thine aid deny.&ldquo;</p>\n\t\t\t<p>He answered, &ldquo;Would ye leave this wild and live,</p>\n\t\t\t<p>Strange road is ours, for where the she-wolf lies</p>\n\t\t\t<p>Shall no man pass, except the path he tries</p>\n\t\t\t<p>Her craft entangle. No way fugitive</p>\n\t\t\t<p>Avoids the seeking of her greeds, that give</p>\n\t\t\t<p>Insatiate hunger, and such vice perverse</p>\n\t\t\t<p>As makes her leaner while she feeds, and worse</p>\n\t\t\t<p>Her craving. And the beasts with which she breed</p>\n\t\t\t<p>The noisome numerous beasts her lusts require,</p>\n\t\t\t<p>Bare all the desirable lands in which she feeds;</p>\n\t\t\t<p>Nor shall lewd feasts and lewder matings tire</p>\n\t\t\t<p>Until she woos, in evil hour for her,</p>\n\t\t\t<p>The wolfhound that shall rend her. His desire</p>\n\t\t\t<p>Is not for rapine, as the promptings stir</p>\n\t\t\t<p>Of her base heart; but wisdoms, and devoirs</p>\n\t\t\t<p>Of manhood, and love&rsquo;s rule, his thoughts prefer.</p>\n\t\t\t<p>The Italian lowlands he shall reach and save,</p>\n\t\t\t<p>For which Camilla of old, the virgin brave,</p>\n\t\t\t<p>Turnus and Nisus died in strife. His chase</p>\n\t\t\t<p>He shall not cease, nor any cowering-place</p>\n\t\t\t<p>Her fear shall find her, till he drive her back,</p>\n\t\t\t<p>From city to city exiled, from wrack to wrack</p>\n\t\t\t<p>Slain out of life, to find the native hell</p>\n\t\t\t<p>Whence envy loosed her.</p>\n\t\t\t<p class=\"slindent6em\">For thyself were well</p>\n\t\t\t<p>To follow where I lead, and thou shalt see</p>\n\t\t\t<p>The spirits in pain, and hear the hopeless woe,</p>\n\t\t\t<p>The unending cries, of those whose only plea</p>\n\t\t\t<p>Is judgment, that the second death to be</p>\n\t\t\t<p>Fall quickly. Further shalt thou climb, and go</p>\n\t\t\t<p>To those who burn, but in their pain content</p>\n\t\t\t<p>With hope of pardon; still beyond, more high,</p>\n\t\t\t<p>Holier than opens to such souls as I,</p>\n\t\t\t<p>The Heavens uprear; but if thou wilt, is one</p>\n\t\t\t<p>Worthier, and she shall guide thee there, where none</p>\n\t\t\t<p>Who did the Lord of those fair realms deny</p>\n\t\t\t<p>May enter. There in his city He dwells, and there</p>\n\t\t\t<p>Rules and pervades in every part, and calls</p>\n\t\t\t<p>His chosen ever within the sacred walls.</p>\n\t\t\t<p>O happiest, they!&rdquo;</p>\n\t\t\t<p class=\"slindent4em\">I answered, &ldquo;By that God</p>\n\t\t\t<p>Thou didst not know, I do thine aid entreat,</p>\n\t\t\t<p>And guidance, that beyond the ills I meet</p>\n\t\t\t<p>I safety find, within the Sacred Gate</p>\n\t\t\t<p>That Peter guards, and those sad souls to see</p>\n\t\t\t<p>Who look with longing for their end to be.&rdquo;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Then he moved forward, and behind I trod.</p>\n\t\t</div>", "<p class=\"cantohead\">Canto II</p>\n\t\t<div class=\"stanza\">\n\t\t\t<p>THE day was falling, and the darkening air</p>\n\t\t\t<p>Released earth&rsquo;s creatures from their toils, while I,</p>\n\t\t\t<p>I only, faced the bitter road and bare</p>\n\t\t\t<p>My Master led. I only, must defy</p>\n\t\t\t<p>The powers of pity, and the night to be.</p>\n\t\t\t<p>So thought I, but the things I came to see,</p>\n\t\t\t<p>Which memory holds, could never thought forecast.</p>\n\t\t\t<p>O Muses high! O Genius, first and last!</p>\n\t\t\t<p>Memories intense! Your utmost powers combine</p>\n\t\t\t<p>To meet this need. For never theme as mine</p>\n\t\t\t<p>Strained vainly, where your loftiest nobleness</p>\n\t\t\t<p>Must fail to be sufficient.</p>\n\t\t\t<p class=\"slindent10em\">First I said,</p>\n\t\t\t<p>Fearing, to him who through the darkness led,</p>\n\t\t\t<p>&ldquo;O poet, ere the arduous path ye press</p>\n\t\t\t<p>Too far, look in me, if the worth there be</p>\n\t\t\t<p>To make this transit. &AElig;neas once, I know,</p>\n\t\t\t<p>Went down in life, and crossed the infernal sea;</p>\n\t\t\t<p>And if the Lord of All Things Lost Below</p>\n\t\t\t<p>Allowed it, reason seems, to those who see</p>\n\t\t\t<p>The enduring greatness of his destiny,</p>\n\t\t\t<p>Who in the Empyrean Heaven elect was called</p>\n\t\t\t<p>Sire of the Eternal City, that throned and walled</p>\n\t\t\t<p>Made Empire of the world beyond, to be</p>\n\t\t\t<p>The Holy Place at last, by God&rsquo;s decree,</p>\n\t\t\t<p>Where the great Peter&rsquo;s follower rules. For he</p>\n\t\t\t<p>Learned there the causes of his victory.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>&ldquo;And later to the third great Heaven was caught</p>\n\t\t\t<p>The last Apostle, and thence returning brought</p>\n\t\t\t<p>The proofs of our salvation. But, for me,</p>\n\t\t\t<p>I am not &AElig;neas, nay, nor Paul, to see</p>\n\t\t\t<p>Unspeakable things that depths or heights can show,</p>\n\t\t\t<p>And if this road for no sure end I go</p>\n\t\t\t<p>What folly is mine? But any words are weak.</p>\n\t\t\t<p>Thy wisdom further than the things I speak</p>\n\t\t\t<p>Can search the event that would be.&rdquo;</p>\n\t\t\t<p class=\"slindent10em\">Here I stayed</p>\n\t\t\t<p>My steps amid the darkness, and the Shade</p>\n\t\t\t<p>That led me heard and turned, magnanimous,</p>\n\t\t\t<p>And saw me drained of purpose halting thus,</p>\n\t\t\t<p>And answered, &ldquo;If thy coward-born thoughts be clear,</p>\n\t\t\t<p>And all thy once intent, infirmed of fear,</p>\n\t\t\t<p>Broken, then art thou as scared beasts that shy</p>\n\t\t\t<p>From shadows, surely that they know not why</p>\n\t\t\t<p>Nor wherefore. . . Hearken, to confound thy fear,</p>\n\t\t\t<p>The things which first I heard, and brought me here.</p>\n\t\t\t<p>One came where, in the Outer Place, I dwell,</p>\n\t\t\t<p>Suspense from hope of Heaven or fear of Hell,</p>\n\t\t\t<p>Radiant in light that native round her clung,</p>\n\t\t\t<p>And cast her eyes our hopeless Shades among</p>\n\t\t\t<p>(Eyes with no earthly like but heaven&rsquo;s own blue),</p>\n\t\t\t<p>And called me to her in such voice as few</p>\n\t\t\t<p>In that grim place had heard, so low, so clear,</p>\n\t\t\t<p>So toned and cadenced from the Utmost Sphere,</p>\n\t\t\t<p>The Unattainable Heaven from which she came.</p>\n\t\t\t<p>&lsquo;O Mantuan Spirit,&rsquo; she said, &lsquo;whose lasting fame</p>\n\t\t\t<p>Continues on the earth ye left, and still</p>\n\t\t\t<p>With Time shall stand, an earthly friend to me,</p>\n\t\t\t<p>- My friend, not fortune&rsquo;s&nbsp;&ndash; climbs a path so ill</p>\n\t\t\t<p>That all the night-bred fears he hastes to flee</p>\n\t\t\t<p>Were kindly to the thing he nears. The tale</p>\n\t\t\t<p>Moved through the peace of I leaven, and swift I sped</p>\n\t\t\t<p>Downward, to aid my friend in love&rsquo;s avail,</p>\n\t\t\t<p>With scanty time therefor, that half I dread</p>\n\t\t\t<p>Too late I came. But thou shalt haste, and go</p>\n\t\t\t<p>With golden wisdom of thy speech, that so</p>\n\t\t\t<p>For me be consolation. Thou shalt say,</p>\n\t\t\t<p>&ldquo;I come from Beatric\xEB.&rdquo; Downward far,</p>\n\t\t\t<p>From Heaven to I leaven I sank, from star to star,</p>\n\t\t\t<p>To find thee, and to point his rescuing way.</p>\n\t\t\t<p>Fain would I to my place of light return;</p>\n\t\t\t<p>Love moved me from it, and gave me power to learn</p>\n\t\t\t<p>Thy speech. When next before my Lord I stand</p>\n\t\t\t<p>I very oft shall praise thee.&rsquo;</p>\n\t\t\t<p class=\"slindent10em\">Here she ceased,</p>\n\t\t\t<p>And I gave answer to that dear command,</p>\n\t\t\t<p>&lsquo;Lady, alone through whom the whole race of those</p>\n\t\t\t<p>The smallest Heaven the moon&rsquo;s short orbits hold</p>\n\t\t\t<p>Excels in its creation, not thy least,</p>\n\t\t\t<p>Thy lightest wish in this dark realm were told</p>\n\t\t\t<p>Vainly. But show me why the Heavens unclose</p>\n\t\t\t<p>To loose thee from them, and thyself content</p>\n\t\t\t<p>Couldst thus continue in such strange descent</p>\n\t\t\t<p>From that most Spacious Place for which ye burn,</p>\n\t\t\t<p>And while ye further left, would fain return.&rsquo;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>&ldquo; &lsquo;That which thou wouldst,&rsquo; she said, &lsquo;I briefly tell.</p>\n\t\t\t<p>There is no fear nor any hurt in Hell,</p>\n\t\t\t<p>Except that it be powerful. God in me</p>\n\t\t\t<p>Is gracious, that the piteous sights I see</p>\n\t\t\t<p>I share not, nor myself can shrink to feel</p>\n\t\t\t<p>The flame of all this burning. One there is</p>\n\t\t\t<p>In height among the Holiest placed, and she</p>\n\t\t\t<p>- Mercy her name&nbsp;&ndash; among God&rsquo;s mysteries</p>\n\t\t\t<p>Dwells in the midst, and hath the power to see</p>\n\t\t\t<p>His judgments, and to break them. This sharp</p>\n\t\t\t<p>I tell thee, when she saw, she called, that so</p>\n\t\t\t<p>Leaned Lucia toward her while she spake&nbsp;&ndash; and said,</p>\n\t\t\t<p>&ldquo;One that is faithful to thy name is sped,</p>\n\t\t\t<p>Except that now ye aid him.&rdquo; She thereat,</p>\n\t\t\t<p>&ndash;&nbsp;Lucia, to all men&rsquo;s wrongs inimical -</p>\n\t\t\t<p>Left her High Place, and crossed to where I sat</p>\n\t\t\t<p>In speech with Rachel (of the first of all</p>\n\t\t\t<p>God saved). &ldquo;O Beatrice, Praise of God,&rdquo;</p>\n\t\t\t<p>- So said she to me&nbsp;&ndash; &ldquo;sitt&rsquo;st thou here so slow</p>\n\t\t\t<p>To aid him, once on earth that loved thee so</p>\n\t\t\t<p>That all he left to serve thee? Hear&rsquo;st thou not</p>\n\t\t\t<p>The anguish of his plaint? and dost not see,</p>\n\t\t\t<p>By that dark stream that never seeks a sea,</p>\n\t\t\t<p>The death that threats him?&rdquo;</p>\n\t\t\t<p class=\"slindent8em\">None, as thus she said,</p>\n\t\t\t<p>None ever was swift on earth his good to chase,</p>\n\t\t\t<p>None ever on earth was swift to leave his dread,</p>\n\t\t\t<p>As came I downward from that sacred place</p>\n\t\t\t<p>To find thee and invoke thee, confident</p>\n\t\t\t<p>Not vainly for his need the gold were spent</p>\n\t\t\t<p>Of thy word-wisdom.&rsquo; Here she turned away,</p>\n\t\t\t<p>Her bright eyes clouded with their tears, and I,</p>\n\t\t\t<p>Who saw them, therefore made more haste to reach</p>\n\t\t\t<p>The place she told, and found thee. Canst thou say</p>\n\t\t\t<p>I failed thy rescue? Is the beast anigh</p>\n\t\t\t<p>From which ye quailed? When such dear saints beseech</p>\n\t\t\t<p>&ndash;&nbsp;Three from the Highest&nbsp;&ndash; that Heaven thy course allow</p>\n\t\t\t<p>Why halt ye fearful? In such guards as thou</p>\n\t\t\t<p>The faintest-hearted might be bold.&rdquo;</p>\n\t\t\t<p class=\"slindent14em\">As flowers,</p>\n\t\t\t<p>Close-folded through the cold and lightless hours,</p>\n\t\t\t<p>Their bended stems erect, and opening fair</p>\n\t\t\t<p>Accept the white light and the warmer air</p>\n\t\t\t<p>Of morning, so my fainting heart anew</p>\n\t\t\t<p>Lifted, that heard his comfort. Swift I spake,</p>\n\t\t\t<p>&ldquo;O courteous thou, and she compassionate!</p>\n\t\t\t<p>Thy haste that saved me, and her warning true,</p>\n\t\t\t<p>Beyond my worth exalt me. Thine I make</p>\n\t\t\t<p>My will. In concord of one mind from now,</p>\n\t\t\t<p>O Master and my Guide, where leadest thou</p>\n\t\t\t<p>I follow.&rdquo;</p>\n\t\t\t<p class=\"slindent2em\">And we, with no more words&rsquo; delay,</p>\n\t\t\t<p>Went forward on that hard and dreadful way.</p>\n\t\t</div>", "<p class=\"cantohead\">Canto III</p>\n\t\t<div class=\"stanza\">\n\t\t\t<p>THE gateway to the city of Doom. Through me</p>\n\t\t\t<p>The entrance to the Everlasting Pain.</p>\n\t\t\t<p>The Gateway of the Lost. The Eternal Three</p>\n\t\t\t<p>Justice impelled to build me. Here ye see</p>\n\t\t\t<p>Wisdom Supreme at work, and Primal Power,</p>\n\t\t\t<p>And Love Supernal in their dawnless day.</p>\n\t\t\t<p>Ere from their thought creation rose in flower</p>\n\t\t\t<p>Eternal first were all things fixed as they.</p>\n\t\t\t<p>Of Increate Power infinite formed am I</p>\n\t\t\t<p>That deathless as themselves I do not die.</p>\n\t\t\t<p>Justice divine has weighed: the doom is clear.</p>\n\t\t\t<p>All hope renounce, ye lost, who enter here.</p>\n\t\t\t<p>This scroll in gloom above the gate I read,</p>\n\t\t\t<p>And found it fearful. &ldquo;Master, hard,&rdquo; I said,</p>\n\t\t\t<p>&ldquo;This saying to me.\" And he, as one that long</p>\n\t\t\t<p>Was customed, answered, &ldquo;No distrust must wrong</p>\n\t\t\t<p>Its Maker, nor thy cowarder mood resume</p>\n\t\t\t<p>If here ye enter. This the place of doom</p>\n\t\t\t<p>I told thee, where the lost in darkness dwell.</p>\n\t\t\t<p>Here, by themselves divorced from light, they fell,</p>\n\t\t\t<p>And are as ye shall see them.&rdquo; Here he lent</p>\n\t\t\t<p>A hand to draw me through the gate, and bent</p>\n\t\t\t<p>A glance upon my fear so confident</p>\n\t\t\t<p>That I, too nearly to my former dread</p>\n\t\t\t<p>Returned, through all my heart was comforted,</p>\n\t\t\t<p>And downward to the secret things we went.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Downward to night, but not of moon and cloud,</p>\n\t\t\t<p>Not night with all its stars, as night we know,</p>\n\t\t\t<p>But burdened with an ocean-weight of woe</p>\n\t\t\t<p>The darkness closed us.</p>\n\t\t\t<p class=\"slindent6em\">Sighs, and wailings loud,</p>\n\t\t\t<p>Outcries perpetual of recruited pain,</p>\n\t\t\t<p>Sounds of strange tongues, and angers that remain</p>\n\t\t\t<p>Vengeless for ever, the thick and clamorous crowd</p>\n\t\t\t<p>Of discords pressed, that needs I wept to hear,</p>\n\t\t\t<p>First hearing. There, with reach of hands anear,</p>\n\t\t\t<p>And voices passion-hoarse, or shrilled with fright,</p>\n\t\t\t<p>The tumult of the everlasting night,</p>\n\t\t\t<p>As sand that dances in continual wind,</p>\n\t\t\t<p>Turns on itself for ever.</p>\n\t\t\t<p class=\"slindent8em\">And I, my head</p>\n\t\t\t<p>Begirt with movements, and my ears bedinned</p>\n\t\t\t<p>With outcries round me, to my leader said,</p>\n\t\t\t<p>&ldquo;Master, what hear I? Who so overborne</p>\n\t\t\t<p>With woes are these?&rdquo;</p>\n\t\t\t<p class=\"slindent6em\">He answered, &ldquo;These be they</p>\n\t\t\t<p>That praiseless lived and blameless. Now the scorn</p>\n\t\t\t<p>Of Height and Depth alike, abortions drear;</p>\n\t\t\t<p>Cast with those abject angels whose delay</p>\n\t\t\t<p>To join rebellion, or their Lord defend,</p>\n\t\t\t<p>Waiting their proved advantage, flung them here. -</p>\n\t\t\t<p>Chased forth from Heaven, lest else its beauties end</p>\n\t\t\t<p>The pure perfection of their stainless claim,</p>\n\t\t\t<p>Out-herded from the shining gate they came,</p>\n\t\t\t<p>Where the deep hells refused them, lest the lost</p>\n\t\t\t<p>Boast something baser than themselves.&rdquo;</p>\n\t\t\t<p class=\"slindent14em\">And I,</p>\n\t\t\t<p>&ldquo;Master, what grievance hath their failure cost,</p>\n\t\t\t<p>That through the lamentable dark they cry?&rdquo;</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>He answered, &ldquo;Briefly at a thing not worth</p>\n\t\t\t<p>We glance, and pass forgetful. Hope in death</p>\n\t\t\t<p>They have not. Memory of them on the earth</p>\n\t\t\t<p>Where once they lived remains not. Nor the breath</p>\n\t\t\t<p>Of Justice shall condemn, nor Mercy plead,</p>\n\t\t\t<p>But all alike disdain them. That they know</p>\n\t\t\t<p>Themselves so mean beneath aught else constrains</p>\n\t\t\t<p>The envious outcries that too long ye heed.</p>\n\t\t\t<p>Move past, but speak not.&rdquo;</p>\n\t\t\t<p class=\"slindent8em\">Then I looked, and lo,</p>\n\t\t\t<p>Were souls in ceaseless and unnumbered trains</p>\n\t\t\t<p>That past me whirled unending, vainly led</p>\n\t\t\t<p>Nowhither, in useless and unpausing haste.</p>\n\t\t\t<p>A fluttering ensign all their guide, they chased</p>\n\t\t\t<p>Themselves for ever. I had not thought the dead,</p>\n\t\t\t<p>The whole world&rsquo;s dead, so many as these. I saw</p>\n\t\t\t<p>The shadow of him elect to Peter&rsquo;s seat</p>\n\t\t\t<p>Who made the great refusal, and the law,</p>\n\t\t\t<p>The unswerving law that left them this retreat</p>\n\t\t\t<p>To seal the abortion of their lives, became</p>\n\t\t\t<p>Illumined to me, and themselves I knew,</p>\n\t\t\t<p>To God and all his foes the futile crew</p>\n\t\t\t<p>How hateful in their everlasting shame.</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>I saw these victims of continued death</p>\n\t\t\t<p>- For lived they never&nbsp;&ndash; were naked all, and loud</p>\n\t\t\t<p>Around them closed a never-ceasing cloud</p>\n\t\t\t<p>Of hornets and great wasps, that buzzed and clung,</p>\n\t\t\t<p>- Weak pain for weaklings meet,&nbsp;&ndash; and where they stung,</p>\n\t\t\t<p>Blood from their faces streamed, with sobbing breath,</p>\n\t\t\t<p>And all the ground beneath with tears and blood</p>\n\t\t\t<p>Was drenched, and crawling in that loathsome mud</p>\n\t\t\t<p>There were great worms that drank it.</p>\n\t\t\t<p class=\"slindent10em\">Gladly thence</p>\n\t\t\t<p>I gazed far forward. Dark and wide the flood</p>\n\t\t\t<p>That flowed before us. On the nearer shore</p>\n\t\t\t<p>Were people waiting. &ldquo;Master, show me whence</p>\n\t\t\t<p>These came, and who they be, and passing hence</p>\n\t\t\t<p>Where go they? Wherefore wait they there content,</p>\n\t\t\t<p>&ndash;&nbsp;The faint light shows it,&nbsp;&ndash; for their transit o&rsquo;er</p>\n\t\t\t<p>The unbridged abyss?&rdquo;</p>\n\t\t\t<p class=\"slindent6em\">He answered, &ldquo;When we stand</p>\n\t\t\t<p>Together, waiting on the joyless strand,</p>\n\t\t\t<p>In all it shall be told thee.&rdquo; If he meant</p>\n\t\t\t<p>Reproof I know not, but with shame I bent</p>\n\t\t\t<p>My downward eyes, and no more spake until</p>\n\t\t\t<p>The bank we reached, and on the stream beheld</p>\n\t\t\t<p>A bark ply toward us.</p>\n\t\t\t<p class=\"slindent8em\">Of exceeding eld,</p>\n\t\t\t<p>And hoary showed the steersman, screaming shrill,</p>\n\t\t\t<p>With horrid glee the while he neared us, &ldquo;Woe</p>\n\t\t\t<p>To ye, depraved!&nbsp;&ndash; Is here no Heaven, but ill</p>\n\t\t\t<p>The place where I shall herd ye. Ice and fire</p>\n\t\t\t<p>And darkness are the wages of their hire</p>\n\t\t\t<p>Who serve unceasing here&nbsp;&ndash; But thou that there</p>\n\t\t\t<p>Dost wait though live, depart ye. Yea, forbear!</p>\n\t\t\t<p>A different passage and a lighter fare</p>\n\t\t\t<p>Is destined thine.&rdquo;</p>\n\t\t\t<p class=\"slindent6em\">But here my guide replied,</p>\n\t\t\t<p>&ldquo;Nay, Charon, cease; or to thy grief ye chide.</p>\n\t\t\t<p>It There is willed, where that is willed shall be,</p>\n\t\t\t<p>That ye shall pass him to the further side,</p>\n\t\t\t<p>Nor question more.&rdquo;</p>\n\t\t\t<p class=\"slindent6em\">The fleecy cheeks thereat,</p>\n\t\t\t<p>Blown with fierce speech before, were drawn and flat,</p>\n\t\t\t<p>And his flame-circled eyes subdued, to hear</p>\n\t\t\t<p>That mandate given. But those of whom he spake</p>\n\t\t\t<p>In bitter glee, with naked limbs ashake,</p>\n\t\t\t<p>And chattering teeth received it. Seemed that then</p>\n\t\t\t<p>They first were conscious where they came, and fear</p>\n\t\t\t<p>Abject and frightful shook them; curses burst</p>\n\t\t\t<p>In clamorous discords forth; the race of men,</p>\n\t\t\t<p>Their parents, and their God, the place, the time,</p>\n\t\t\t<p>Of their conceptions and their births, accursed</p>\n\t\t\t<p>Alike they called, blaspheming Heaven. But yet</p>\n\t\t\t<p>Slow steps toward the waiting bark they set,</p>\n\t\t\t<p>With terrible wailing while they moved. And so</p>\n\t\t\t<p>They came reluctant to the shore of woe</p>\n\t\t\t<p>That waits for all who fear not God, and not</p>\n\t\t\t<p>Them only.</p>\n\t\t\t<p class=\"slindent4em\">Then the demon Charon rose</p>\n\t\t\t<p>To herd them in, with eyes that furnace-hot</p>\n\t\t\t<p>Glowed at the task, and lifted oar to smite</p>\n\t\t\t<p>Who lingered.</p>\n\t\t\t<p class=\"slindent4em\">As the leaves, when autumn shows,</p>\n\t\t\t<p>One after one descending, leave the bough,</p>\n\t\t\t<p>Or doves come downward to the call, so now</p>\n\t\t\t<p>The evil seed of Adam to endless night,</p>\n\t\t\t<p>As Charon signalled, from the shore&rsquo;s bleak height,</p>\n\t\t\t<p>Cast themselves downward to the bark. The brown</p>\n\t\t\t<p>And bitter flood received them, and while they passed</p>\n\t\t\t<p>Were others gathering, patient as the last,</p>\n\t\t\t<p>Not conscious of their nearing doom.</p>\n\t\t\t<p class=\"slindent14em\">&ldquo;My son,&rdquo;</p>\n\t\t\t<p>&ndash;&nbsp;Replied my guide the unspoken thought&nbsp;&ndash; &ldquo;is none</p>\n\t\t\t<p>Beneath God&rsquo;s wrath who dies in field or town,</p>\n\t\t\t<p>Or earth&rsquo;s wide space, or whom the waters drown,</p>\n\t\t\t<p>But here he cometh at last, and that so spurred</p>\n\t\t\t<p>By Justice, that his fear, as those ye heard,</p>\n\t\t\t<p>Impels him forward like desire. Is not</p>\n\t\t\t<p>One spirit of all to reach the fatal spot</p>\n\t\t\t<p>That God&rsquo;s love holdeth, and hence, if Char</p>\n\t\t\t<p>chide,</p>\n\t\t\t<p>Ye well may take it.&nbsp;&ndash; Raise thy heart, for now,</p>\n\t\t\t<p>Constrained of Heaven, he must thy course allow.\"</p>\n\t\t</div>\n\t\t<div class=\"stanza\">\n\t\t\t<p>Yet how I passed I know not. For the ground</p>\n\t\t\t<p>Trembled that heard him, and a fearful sound</p>\n\t\t\t<p>Of issuing wind arose, and blood-red light</p>\n\t\t\t<p>Broke from beneath our feet, and sense and sight</p>\n\t\t\t<p>Left me. The memory with cold sweat once more</p>\n\t\t\t<p>Reminds me of the sudden-crimsoned night,</p>\n\t\t\t<p>As sank I senseless by the dreadful shore.</p>\n\t\t</div>"];

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvanMvYXBwZGF0YS5qcyIsImFwcC9qcy9ib29rZGF0YS5qcyIsImFwcC9qcy9jcm9zc2RhbnRlLmpzIiwiYXBwL2pzL2RvbS5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvY2FybHlsZS5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvaXRhbGlhbi5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvbG9uZ2ZlbGxvdy5qcyIsImFwcC9qcy90cmFuc2xhdGlvbnMvbm9ydG9uLmpzIiwiYXBwL2pzL3RyYW5zbGF0aW9ucy93cmlnaHQuanMiLCJub2RlX21vZHVsZXMvZmFzdGNsaWNrL2xpYi9mYXN0Y2xpY2suanMiLCJub2RlX21vZHVsZXMvaGFtbWVyanMvaGFtbWVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsSUFBTSxrQkFBa0IsUUFBUSxZQUFSLEVBQXNCLGVBQTlDO0FBQ0EsSUFBTSxjQUFjLFFBQVEsWUFBUixFQUFzQixXQUExQzs7QUFFQSxJQUFJLFVBQVU7QUFDYix5QkFBd0IsRUFEWCxFQUNrQjtBQUMvQixxQkFBb0IsQ0FGUDtBQUdiLG1CQUFrQixnQkFBZ0IsTUFIckI7QUFJYixlQUFjLENBSkQ7QUFLYixhQUFZLFlBQVksTUFMWDtBQU1iLGFBQVksRUFOQztBQU9iLFlBQVcsT0FBTyxVQVBMO0FBUWIsYUFBWSxPQUFPLFdBQVAsR0FBcUIsRUFScEI7QUFTYixjQUFhLE9BQU8sVUFUUDtBQVViLGVBQWMsT0FBTyxXQVZSO0FBV2IsWUFBVyxPQUFPLFVBWEw7QUFZYixjQUFhLE1BWkE7QUFhYixZQUFXLEtBYkU7QUFjYixvQkFBbUIsQ0FkTixFQWNTO0FBQ3RCLGVBQWMsQ0FmRCxFQWVVO0FBQ3ZCLFdBQVUsRUFoQkc7QUFpQmIsV0FBVSxFQWpCRztBQWtCYixrQkFBaUIsZUFsQko7QUFtQmIsY0FBYTtBQW5CQSxDQUFkOztBQXNCQSxPQUFPLE9BQVAsR0FBaUIsT0FBakI7Ozs7O0FDaENBLElBQU0sY0FBYyxDQUFDLFlBQUQsRUFBYyxTQUFkLEVBQXdCLFNBQXhCLEVBQWtDLFNBQWxDLENBQXBCOztBQUVBLElBQU0sa0JBQWtCLENBQ3ZCLEVBQUMsaUJBQWdCLE9BQWpCO0FBQ0MseUJBQXVCLE9BRHhCO0FBRUMsd0JBQXNCLGlCQUZ2QjtBQUdDLHFCQUFtQixpQkFIcEI7QUFJQyxVQUFRLENBSlQsRUFEdUIsRUFNdkIsRUFBQyxpQkFBZ0IsWUFBakI7QUFDQyx5QkFBdUIsWUFEeEI7QUFFQyx3QkFBc0IsNkJBRnZCO0FBR0MscUJBQW1CLG1CQUhwQjtBQUlDLFVBQVEsQ0FKVCxFQU51QixFQVd2QixFQUFDLGlCQUFnQixRQUFqQjtBQUNDLHlCQUF1QixRQUR4QjtBQUVDLHdCQUFzQixzQkFGdkI7QUFHQyxxQkFBbUIsY0FIcEI7QUFJQyxVQUFRLENBSlQsRUFYdUIsRUFnQnZCLEVBQUMsaUJBQWdCLFFBQWpCO0FBQ0MseUJBQXVCLFFBRHhCO0FBRUMsd0JBQXNCLGtCQUZ2QjtBQUdDLHFCQUFtQixlQUhwQjtBQUlDLFVBQVEsQ0FKVCxFQWhCdUIsRUFxQnZCLEVBQUMsaUJBQWdCLFNBQWpCO0FBQ0MseUJBQXVCLFNBRHhCO0FBRUMsd0JBQXNCLHVCQUZ2QjtBQUdDLHFCQUFtQixlQUhwQjtBQUlDLFVBQVEsQ0FKVCxFQXJCdUIsQ0FBeEI7O0FBNEJBLE9BQU8sT0FBUCxDQUFlLFdBQWYsR0FBNkIsV0FBN0I7QUFDQSxPQUFPLE9BQVAsQ0FBZSxlQUFmLEdBQWlDLGVBQWpDOzs7QUMvQkE7O0FBRUE7O0FBRUEsSUFBTSxTQUFTLFFBQVEsVUFBUixDQUFmO0FBQ0EsSUFBTSxZQUFZLFFBQVEsV0FBUixDQUFsQixDLENBQXdDOztBQUV4QyxJQUFNLE1BQU0sUUFBUSxPQUFSLENBQVo7QUFDQSxJQUFJLFVBQVUsUUFBUSxXQUFSLENBQWQ7O0FBRUEsSUFBSSxNQUFNO0FBQ1QsYUFBWSxzQkFBVztBQUFFO0FBQ3hCLFVBQVEsR0FBUixDQUFZLGVBQVo7QUFDQSxPQUFLLFVBQUw7O0FBRUE7O0FBRUEsVUFBUSxRQUFSLENBQWlCLENBQWpCLElBQXNCLFFBQVEsMkJBQVIsQ0FBdEI7QUFDQSxVQUFRLFFBQVIsQ0FBaUIsQ0FBakIsSUFBc0IsUUFBUSw4QkFBUixDQUF0QjtBQUNBLFVBQVEsUUFBUixDQUFpQixDQUFqQixJQUFzQixRQUFRLDBCQUFSLENBQXRCO0FBQ0EsVUFBUSxRQUFSLENBQWlCLENBQWpCLElBQXNCLFFBQVEsMEJBQVIsQ0FBdEI7QUFDQSxVQUFRLFFBQVIsQ0FBaUIsQ0FBakIsSUFBc0IsUUFBUSwyQkFBUixDQUF0Qjs7QUFFQSxVQUFRLFFBQVIsQ0FBaUIsSUFBakIsR0FBd0IsU0FBUyxjQUFULENBQXdCLE1BQXhCLENBQXhCO0FBQ0EsVUFBUSxRQUFSLENBQWlCLElBQWpCLEdBQXdCLFNBQVMsY0FBVCxDQUF3QixNQUF4QixDQUF4QjtBQUNBLFVBQVEsUUFBUixDQUFpQixPQUFqQixHQUEyQixTQUFTLGNBQVQsQ0FBd0IsU0FBeEIsQ0FBM0I7QUFDQSxVQUFRLFFBQVIsQ0FBaUIsSUFBakIsR0FBd0IsU0FBUyxjQUFULENBQXdCLE1BQXhCLENBQXhCOztBQUVBOztBQUVBLE9BQUksSUFBSSxDQUFSLElBQWEsUUFBUSxlQUFyQixFQUFzQztBQUNyQyxXQUFRLHNCQUFSLENBQStCLElBQS9CLENBQW9DLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUEvRDtBQUNBOztBQUVEO0FBRUEsRUExQlE7QUEyQlQsYUFBWSxzQkFBVztBQUN0QixVQUFRLEdBQVIsQ0FBWSxpQkFBWjtBQUNBLFdBQVMsZ0JBQVQsQ0FBMEIsYUFBMUIsRUFBeUMsS0FBSyxhQUE5QyxFQUE2RCxLQUE3RDtBQUNBLFNBQU8sZ0JBQVAsQ0FBd0IsUUFBeEIsRUFBa0MsS0FBSyxNQUF2QyxFQUErQyxLQUEvQzs7QUFFQTs7QUFFQSxNQUFJLHNCQUFzQixRQUExQixFQUFvQztBQUNuQyxZQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxZQUFNO0FBQ25ELGNBQVUsTUFBVixDQUFpQixTQUFTLElBQTFCO0FBQ0EsSUFGRCxFQUVHLEtBRkg7QUFHQTtBQUNELEVBdkNRO0FBd0NULFVBQVM7QUFDUixjQUFZLG9CQUFTLE9BQVQsRUFBa0I7QUFDN0IsV0FBUSxPQUFSLEdBQWtCLFlBQU07QUFDdkIsUUFBSSxPQUFKLENBQVksVUFBWjtBQUNBLElBRkQ7QUFHQSxHQUxPO0FBTVIsYUFBVyxtQkFBUyxFQUFULEVBQWE7QUFBQTs7QUFDdkIsTUFBRyxPQUFILEdBQWEsVUFBQyxDQUFELEVBQU87QUFDbkIsTUFBRSxlQUFGO0FBQ0EsUUFBSSxXQUFXLE1BQUssWUFBTCxDQUFrQixpQkFBbEIsQ0FBZjtBQUNBLFFBQUksV0FBVyxTQUFTLGFBQVQsa0NBQXFELFFBQXJELFVBQW1FLFNBQWxGO0FBQ0EsUUFBSSxTQUFKO0FBQ0EsUUFBSSxTQUFTLElBQUksTUFBSixnRUFDVCxRQURTLHdCQUFiO0FBR0EsWUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFdBQXRCLENBQWtDLE1BQWxDO0FBQ0EsYUFBUyxjQUFULENBQXdCLFlBQXhCLEVBQXNDLE9BQXRDLEdBQWdELFlBQU07QUFDckQsU0FBSSxTQUFKO0FBQ0EsS0FGRDtBQUdBLElBWkQ7QUFhQSxHQXBCTztBQXFCUixjQUFZLG9CQUFTLEVBQVQsRUFBYTtBQUFBOztBQUN4QixNQUFHLE9BQUgsR0FBYSxZQUFNO0FBQ2xCLFFBQUksaUJBQUosQ0FBc0IsT0FBSyxFQUFMLENBQVEsT0FBUixDQUFnQixRQUFoQixFQUF5QixFQUF6QixDQUF0QixFQUFtRCxTQUFTLGNBQVQsQ0FBd0IsT0FBSyxFQUE3QixFQUFpQyxPQUFwRjtBQUNBLElBRkQ7QUFHQSxHQXpCTztBQTBCUixrQkFBZ0Isd0JBQVMsRUFBVCxFQUFhO0FBQUE7O0FBQzVCLE1BQUcsT0FBSCxHQUFhLFlBQU07QUFDbEIsYUFBUyxjQUFULFlBQWlDLE9BQUssRUFBdEMsRUFBNEMsT0FBNUMsR0FBc0QsQ0FBQyxTQUFTLGNBQVQsWUFBaUMsT0FBSyxFQUF0QyxFQUE0QyxPQUFuRztBQUNBLFFBQUksaUJBQUosQ0FBc0IsT0FBSyxFQUEzQixFQUE4QixTQUFTLGNBQVQsWUFBaUMsT0FBSyxFQUF0QyxFQUE0QyxPQUExRTtBQUNBLElBSEQ7QUFJQTtBQS9CTyxFQXhDQTtBQXlFVCxnQkFBZSx5QkFBVzs7QUFFekI7QUFDQSxXQUFTLGNBQVQsQ0FBd0IsU0FBeEIsRUFBbUMsT0FBbkMsR0FBNkMsWUFBTTtBQUNsRCxPQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFSLEdBQTJCLENBQXZDLEVBQXlDLFFBQVEsWUFBakQ7QUFDQSxHQUZEO0FBR0EsV0FBUyxjQUFULENBQXdCLFNBQXhCLEVBQW1DLE9BQW5DLEdBQTZDLFlBQU07QUFDbEQsT0FBSSxPQUFKLENBQVksUUFBUSxrQkFBUixHQUEyQixDQUF2QyxFQUF5QyxRQUFRLFlBQWpEO0FBQ0EsR0FGRDtBQUdBLFdBQVMsY0FBVCxDQUF3QixPQUF4QixFQUFpQyxPQUFqQyxHQUEyQyxZQUFNO0FBQ2hELE9BQUksT0FBSixDQUFZLFFBQVEsa0JBQXBCLEVBQXVDLFFBQVEsWUFBUixHQUFxQixDQUE1RCxFQUE4RCxDQUE5RDtBQUNBLEdBRkQ7QUFHQSxXQUFTLGNBQVQsQ0FBd0IsU0FBeEIsRUFBbUMsT0FBbkMsR0FBNkMsWUFBTTtBQUNsRCxPQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFwQixFQUF1QyxRQUFRLFlBQVIsR0FBcUIsQ0FBNUQsRUFBOEQsQ0FBOUQ7QUFDQSxHQUZEO0FBR0E7O0FBRUEsV0FBUyxjQUFULENBQXdCLFdBQXhCLEVBQXFDLE9BQXJDLEdBQStDLFlBQU07QUFDcEQsT0FBSSxPQUFKLENBQVksT0FBWjtBQUNBLEdBRkQ7QUFHQSxXQUFTLGNBQVQsQ0FBd0IsVUFBeEIsRUFBb0MsT0FBcEMsR0FBOEMsWUFBTTtBQUNuRCxPQUFJLE9BQUosQ0FBWSxNQUFaO0FBQ0EsR0FGRDtBQUdBLFdBQVMsY0FBVCxDQUF3QixTQUF4QixFQUFtQyxPQUFuQyxHQUE2QyxZQUFNO0FBQ2xELE9BQUksV0FBSixDQUFnQixNQUFoQixFQUF1QixXQUF2QjtBQUNBLE9BQUksUUFBSixDQUFhLFlBQWIsRUFBMEIsS0FBMUI7QUFDQSxPQUFJLFdBQUosQ0FBZ0IsVUFBaEIsRUFBMkIsS0FBM0I7QUFDQSxXQUFRLFNBQVIsR0FBb0IsS0FBcEI7QUFDQSxHQUxEO0FBTUEsV0FBUyxhQUFULENBQXVCLFlBQXZCLEVBQXFDLE9BQXJDLEdBQStDLFlBQU07QUFDcEQsT0FBSSxRQUFKLENBQWEsTUFBYixFQUFvQixXQUFwQjtBQUNBLE9BQUksV0FBSixDQUFnQixZQUFoQixFQUE2QixLQUE3QjtBQUNBLE9BQUksUUFBSixDQUFhLFVBQWIsRUFBd0IsS0FBeEI7QUFDQSxXQUFRLFNBQVIsR0FBb0IsSUFBcEI7QUFDQSxHQUxEOztBQU9BO0FBcEN5QjtBQUFBO0FBQUE7O0FBQUE7QUFxQ3pCLHdCQUFhLFNBQVMsZ0JBQVQsQ0FBMEIsaUJBQTFCLENBQWIsOEhBQTJEO0FBQUEsUUFBbkQsQ0FBbUQ7O0FBQzFELFFBQUksT0FBSixDQUFZLFVBQVosQ0FBdUIsQ0FBdkI7QUFDQTs7QUFFRjtBQXpDMEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUEyQ3pCLE1BQUksYUFBYSxJQUFJLE1BQUosQ0FBVyxRQUFRLFFBQVIsQ0FBaUIsSUFBNUIsQ0FBakIsQ0EzQ3lCLENBMkMyQjtBQUNwRCxhQUFXLEdBQVgsQ0FBZSxPQUFmLEVBQXdCLEdBQXhCLENBQTRCLEVBQUUsV0FBVyxPQUFPLGFBQXBCLEVBQTVCO0FBQ0EsYUFBVyxFQUFYLENBQWMsV0FBZCxFQUEwQixZQUFNO0FBQy9CLE9BQUksT0FBSixDQUFZLFFBQVEsa0JBQVIsR0FBMkIsQ0FBdkMsRUFBeUMsUUFBUSxZQUFqRDtBQUNBLEdBRkQsRUFFRyxFQUZILENBRU0sWUFGTixFQUVtQixZQUFNO0FBQ3hCLE9BQUksT0FBSixDQUFZLFFBQVEsa0JBQVIsR0FBMkIsQ0FBdkMsRUFBeUMsUUFBUSxZQUFqRDtBQUNBLEdBSkQ7O0FBTUEsYUFBVyxFQUFYLENBQWMsV0FBZCxFQUEwQixZQUFNO0FBQy9CLE9BQUcsUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFFBQXRCLEtBQW1DLENBQXRDLEVBQXlDO0FBQ3hDLFFBQUksT0FBSixDQUFZLFFBQVEsa0JBQXBCLEVBQXVDLFFBQVEsWUFBUixHQUFxQixDQUE1RCxFQUE4RCxDQUE5RCxFQUR3QyxDQUMyQjtBQUNuRTtBQUNELEdBSkQsRUFJRyxFQUpILENBSU0sU0FKTixFQUlnQixZQUFNO0FBQ3hCO0FBQ0E7O0FBRUcsT0FBRyxLQUFLLEdBQUwsQ0FBUyxRQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsU0FBdEIsR0FBa0MsUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFlBQXhELEdBQXVFLFFBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixZQUF0RyxJQUFzSCxDQUF6SCxFQUE0SDtBQUMzSCxRQUFJLE9BQUosQ0FBWSxRQUFRLGtCQUFwQixFQUF1QyxRQUFRLFlBQVIsR0FBcUIsQ0FBNUQ7QUFDQTtBQUNELEdBWEQ7O0FBYUQ7O0FBRUMsV0FBUyxJQUFULENBQWMsU0FBZCxHQUEwQixVQUFDLENBQUQsRUFBTztBQUNoQyxLQUFFLGNBQUY7QUFDQSxPQUFHLENBQUMsRUFBRSxPQUFGLElBQWEsRUFBRSxLQUFoQixNQUEyQixFQUE5QixFQUFrQztBQUNqQyxRQUFJLFFBQUosQ0FBYSxVQUFiLEVBQXdCLElBQXhCO0FBQ0EsUUFBSSxPQUFKLENBQVksUUFBUSxrQkFBUixHQUEyQixDQUF2QyxFQUF5QyxRQUFRLFlBQWpEO0FBQ0E7QUFDRCxPQUFHLENBQUMsRUFBRSxPQUFGLElBQWEsRUFBRSxLQUFoQixNQUEyQixFQUE5QixFQUFrQztBQUNqQyxRQUFJLFFBQUosQ0FBYSxVQUFiLEVBQXdCLElBQXhCO0FBQ0EsUUFBSSxPQUFKLENBQVksUUFBUSxrQkFBUixHQUEyQixDQUF2QyxFQUF5QyxRQUFRLFlBQWpEO0FBQ0E7QUFDRCxPQUFHLENBQUMsRUFBRSxPQUFGLElBQWEsRUFBRSxLQUFoQixNQUEyQixFQUE5QixFQUFrQztBQUNqQyxRQUFJLFFBQUosQ0FBYSxRQUFiLEVBQXNCLElBQXRCO0FBQ0EsUUFBSSxPQUFKLENBQVksUUFBUSxrQkFBcEIsRUFBdUMsUUFBUSxZQUFSLEdBQXFCLENBQTVEO0FBQ0E7QUFDRCxPQUFHLENBQUMsRUFBRSxPQUFGLElBQWEsRUFBRSxLQUFoQixNQUEyQixFQUE5QixFQUFrQztBQUNqQyxRQUFJLFFBQUosQ0FBYSxVQUFiLEVBQXdCLElBQXhCO0FBQ0EsUUFBSSxPQUFKLENBQVksUUFBUSxrQkFBcEIsRUFBdUMsUUFBUSxZQUFSLEdBQXFCLENBQTVELEVBQThELENBQTlEO0FBQ0E7QUFDRCxHQWxCRDtBQW1CQSxXQUFTLElBQVQsQ0FBYyxPQUFkLEdBQXdCLFVBQUMsQ0FBRCxFQUFPO0FBQzlCLEtBQUUsY0FBRjtBQUNBLE9BQUksV0FBSixDQUFnQixTQUFoQixFQUEwQixJQUExQjtBQUNBLEdBSEQ7O0FBS0Q7O0FBRUMsV0FBUyxhQUFULENBQXVCLFdBQXZCLEVBQW9DLE9BQXBDLEdBQThDLFlBQU07QUFDbkQsT0FBSSxPQUFKLENBQVksTUFBWjtBQUNBLEdBRkQ7QUFHQSxXQUFTLGFBQVQsQ0FBdUIsY0FBdkIsRUFBdUMsT0FBdkMsR0FBaUQsWUFBTTtBQUN0RCxPQUFHLFFBQVEsV0FBUixJQUF1QixVQUExQixFQUFzQztBQUN6QztBQUNJLFFBQUksT0FBSixDQUFZLE1BQVo7QUFDQSxJQUhELE1BR087QUFDTixRQUFJLGNBQUo7QUFDQSxRQUFJLE9BQUosQ0FBWSxVQUFaO0FBQ0E7QUFDRCxHQVJEO0FBU0EsVUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLE9BQXRCLEdBQWdDLFlBQU07QUFDckMsT0FBSSxTQUFKO0FBQ0EsR0FGRDtBQUdBLEVBcExRO0FBcUxULGFBQVksc0JBQVc7QUFDdEIsTUFBSSxRQUFRLENBQVo7QUFDQSxNQUFJLFFBQVEsU0FBUyxnQkFBVCxDQUEwQixPQUExQixDQUFaOztBQUVBLE9BQUksSUFBSSxJQUFJLENBQVosRUFBZSxJQUFJLE1BQU0sTUFBekIsRUFBaUMsR0FBakMsRUFBc0M7QUFDckMsT0FBSSxXQUFXLE1BQU0sQ0FBTixFQUFTLFFBQXhCO0FBQ0EsUUFBSSxJQUFJLElBQUUsQ0FBVixFQUFhLElBQUksU0FBUyxNQUExQixFQUFrQyxHQUFsQyxFQUF1QztBQUN0QyxRQUFHLElBQUksUUFBSixDQUFhLFNBQVMsQ0FBVCxDQUFiLEVBQXlCLFVBQXpCLENBQUgsRUFBeUM7QUFDeEMsYUFBUSxHQUFSLENBQVksY0FBWSxLQUF4QjtBQUNBLGNBQVMsQ0FBVCxFQUFZLFlBQVosQ0FBeUIsaUJBQXpCLEVBQTRDLEtBQTVDO0FBQ0E7QUFDRCxRQUFHLElBQUksUUFBSixDQUFhLFNBQVMsQ0FBVCxDQUFiLEVBQXlCLFFBQXpCLENBQUgsRUFBdUM7QUFDdEMsYUFBUSxHQUFSLENBQVksWUFBVSxLQUF0QjtBQUNBLGNBQVMsQ0FBVCxFQUFZLFlBQVosQ0FBeUIsaUJBQXpCLEVBQTRDLEtBQTVDO0FBQ0EsU0FBSSxPQUFKLENBQVksU0FBWixDQUFzQixTQUFTLENBQVQsQ0FBdEI7QUFDQTtBQUNEO0FBQ0Q7QUFDQTtBQUNELEVBeE1RO0FBeU1ULFNBQVEsa0JBQVc7QUFDbEIsVUFBUSxXQUFSLEdBQXNCLE9BQU8sVUFBN0I7QUFDQSxVQUFRLFlBQVIsR0FBdUIsT0FBTyxXQUE5QjtBQUNBLFVBQVEsR0FBUiw4Q0FBdUQsUUFBUSxXQUEvRCxTQUE4RSxRQUFRLFlBQXRGO0FBQ0EsVUFBUSxTQUFSLEdBQW9CLFFBQVEsV0FBNUI7QUFDQSxVQUFRLFVBQVIsR0FBcUIsUUFBUSxZQUFSLEdBQXVCLFNBQVMsY0FBVCxDQUF3QixRQUF4QixFQUFrQyxZQUE5RTs7QUFFQSxNQUFJLFFBQUosQ0FBYSxPQUFiLEVBQXFCLFFBQVEsU0FBUixHQUFvQixRQUFRLFVBQTVCLEdBQXlDLFdBQXpDLEdBQXVELFVBQTVFO0FBQ0EsTUFBSSxXQUFKLENBQWdCLE9BQWhCLEVBQXdCLFFBQVEsU0FBUixHQUFvQixRQUFRLFVBQTVCLEdBQXlDLFVBQXpDLEdBQXNELFdBQTlFOztBQUVBLFVBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixLQUF0QixDQUE0QixLQUE1QixHQUFvQyxRQUFRLFNBQVIsR0FBa0IsSUFBdEQ7QUFDQSxVQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsS0FBdEIsQ0FBNEIsTUFBNUIsR0FBcUMsUUFBUSxZQUFSLEdBQXFCLElBQTFEO0FBQ0EsVUFBUSxRQUFSLENBQWlCLE9BQWpCLENBQXlCLEtBQXpCLENBQStCLEtBQS9CLEdBQXVDLFFBQVEsU0FBUixHQUFrQixJQUF6RDtBQUNBLFVBQVEsUUFBUixDQUFpQixPQUFqQixDQUF5QixLQUF6QixDQUErQixNQUEvQixHQUF3QyxRQUFRLFVBQVIsR0FBbUIsSUFBM0Q7O0FBRUEsVUFBUSxVQUFSLEdBQXFCLFFBQVEsV0FBUixHQUFvQixFQUF6QztBQUNBLFVBQVEsU0FBUixHQUFvQixRQUFRLFdBQTVCO0FBQ0EsTUFBSSxPQUFKLENBQVksUUFBUSxrQkFBcEIsRUFBdUMsUUFBUSxZQUEvQztBQUNBLEVBM05RO0FBNE5ULFVBQVMsaUJBQVMsUUFBVCxFQUFtQixRQUFuQixFQUE2QixVQUE3QixFQUF5QztBQUNqRCxVQUFRLEdBQVIseUJBQWtDLFFBQWxDLGdCQUFxRCxRQUFyRDtBQUNBLE1BQUksY0FBYyxLQUFsQjs7QUFFRDs7QUFFQyxNQUFHLFFBQVEsV0FBUixJQUF1QixNQUExQixFQUFrQztBQUNqQyxPQUFHLFdBQVcsUUFBUSxrQkFBbkIsS0FBMEMsQ0FBN0MsRUFBZ0Q7QUFDL0Msa0JBQWMsSUFBZDtBQUNBLGlCQUFjLFFBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixTQUF2QixDQUFpQyx3Q0FBakMsR0FBMkUsUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFlBQTlHO0FBQ0EsWUFBUSxHQUFSLENBQVksVUFBWjtBQUNBOztBQUVELE9BQUcsWUFBWSxRQUFRLGdCQUF2QixFQUF5QztBQUN4QyxlQUFXLENBQVg7QUFDQTtBQUNELE9BQUcsV0FBVyxDQUFkLEVBQWlCO0FBQ2hCLGVBQVcsUUFBUSxnQkFBUixHQUF5QixDQUFwQztBQUNBO0FBQ0QsT0FBRyxZQUFZLFFBQVEsVUFBdkIsRUFBbUM7QUFDbEMsZUFBVyxDQUFYO0FBQ0E7QUFDRCxPQUFHLFdBQVcsQ0FBZCxFQUFpQjtBQUNoQixlQUFXLFFBQVEsVUFBUixHQUFtQixDQUE5QjtBQUNBOztBQUVIOztBQUVFLFFBQUksSUFBSSxJQUFFLENBQVYsRUFBYSxJQUFJLFFBQVEsZUFBUixDQUF3QixNQUF6QyxFQUFpRCxHQUFqRCxFQUFzRDtBQUNyRCxRQUFHLFFBQVEsc0JBQVIsQ0FBK0IsUUFBL0IsS0FBNEMsUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGFBQTFFLEVBQXlGO0FBQ3hGLGdCQUFXLENBQVg7QUFDQTtBQUNEO0FBQ0QsV0FBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFNBQXRCLEdBQWtDLElBQUksUUFBSixDQUFhLFFBQWIsRUFBdUIsUUFBdkIsQ0FBbEM7QUFDQSxPQUFJLFdBQUosQ0FBZ0IsT0FBaEIsRUFBd0IsUUFBUSxlQUFSLENBQXdCLFFBQVEsa0JBQWhDLEVBQW9ELGdCQUE1RTtBQUNBLE9BQUksUUFBSixDQUFhLE9BQWIsRUFBcUIsUUFBUSxlQUFSLENBQXdCLFFBQXhCLEVBQWtDLGdCQUF2RDtBQUNBLE9BQUksVUFBSjtBQUNBLFdBQVEsa0JBQVIsR0FBNkIsUUFBN0I7QUFDQSxXQUFRLFlBQVIsR0FBdUIsUUFBdkI7O0FBRUEsT0FBRyxRQUFRLFlBQVIsR0FBdUIsQ0FBMUIsRUFBNkI7QUFDNUIsYUFBUyxjQUFULENBQXdCLFVBQXhCLEVBQW9DLFNBQXBDLEdBQWdELFFBQVEsZUFBUixDQUF3QixRQUFRLGtCQUFoQyxFQUFvRCxvQkFBcEQsNkJBQTZGLFFBQVEsWUFBckcsZUFBaEQ7QUFDQSxJQUZELE1BRU87QUFDTixhQUFTLGNBQVQsQ0FBd0IsVUFBeEIsRUFBb0MsU0FBcEMsR0FBZ0QsUUFBaEQ7QUFDQTs7QUFFRCxPQUFJLFVBQUo7O0FBRUg7QUFDQTs7QUFFRyxPQUFHLFdBQUgsRUFBZ0I7O0FBRWpCO0FBQ0E7O0FBRUUsUUFBSSxXQUFXLElBQUksT0FBSixDQUFZLGFBQWEsUUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFlBQS9DLENBQWY7QUFDQSxZQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsU0FBdEIsR0FBa0MsUUFBbEM7QUFDQSxJQVBELE1BT087QUFDTixRQUFHLGFBQWEsQ0FBaEIsRUFBbUI7QUFDbEIsYUFBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLFNBQXRCLEdBQWtDLFFBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixZQUF4RDtBQUNBLEtBRkQsTUFFTztBQUNOLGFBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixTQUF0QixHQUFrQyxDQUFsQztBQUNBO0FBQ0Q7QUFDRDtBQUNELE1BQUksZUFBSjtBQUNBLEVBL1JRO0FBZ1NULFVBQVMsaUJBQVMsTUFBVCxFQUFpQjs7QUFFekI7O0FBRUEsU0FBTyxRQUFRLFVBQVIsR0FBcUIsS0FBSyxLQUFMLENBQVcsU0FBUyxRQUFRLFVBQTVCLENBQTVCO0FBRUEsRUF0U1E7QUF1U1QsYUFBWSxzQkFBVztBQUN0QixNQUFNLE9BQU8sU0FBUyxnQkFBVCxDQUEwQixTQUExQixDQUFiO0FBQ0EsTUFBSSxHQUFKLEVBQVMsT0FBVCxFQUFrQixZQUFsQjtBQUNBLE1BQUksV0FBVyxDQUFmOztBQUVBLE1BQUcsSUFBSSxRQUFKLENBQWEsUUFBUSxRQUFSLENBQWlCLElBQTlCLEVBQW1DLFFBQW5DLENBQUgsRUFBaUQ7O0FBRW5EOztBQUVHLFdBQVEsUUFBUixDQUFpQixJQUFqQixDQUFzQixLQUF0QixDQUE0QixXQUE1QixHQUEwQyxDQUExQztBQUNBLFFBQUksSUFBSSxJQUFFLENBQVYsRUFBYSxJQUFFLEtBQUssTUFBcEIsRUFBNEIsR0FBNUIsRUFBaUM7QUFDaEMsVUFBTSxLQUFLLENBQUwsQ0FBTjtBQUNBLFFBQUksS0FBSixDQUFVLE9BQVYsR0FBb0IsY0FBcEI7QUFDQSxRQUFHLElBQUksV0FBSixHQUFrQixRQUFyQixFQUErQjtBQUM5QixnQkFBVyxJQUFJLFdBQUosR0FBa0IsRUFBN0I7QUFDQTtBQUNELFFBQUksS0FBSixDQUFVLE9BQVYsR0FBb0IsT0FBcEI7QUFDQTs7QUFFRCxXQUFRLEdBQVIsQ0FBWSxpQkFBaUIsUUFBUSxTQUFyQztBQUNBLFdBQVEsR0FBUixDQUFZLGdCQUFnQixRQUE1Qjs7QUFFQSxXQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsS0FBdEIsQ0FBNEIsV0FBNUIsR0FBMEMsQ0FBQyxRQUFRLFNBQVIsR0FBb0IsUUFBckIsSUFBK0IsQ0FBL0IsR0FBaUMsSUFBM0U7QUFDQSxXQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsS0FBdEIsQ0FBNEIsWUFBNUIsR0FBMkMsQ0FBQyxRQUFRLFNBQVIsR0FBb0IsUUFBckIsSUFBK0IsQ0FBL0IsR0FBaUMsSUFBNUU7QUFDQSxHQW5CRCxNQW1CTzs7QUFFUjs7QUFFRSxrQkFBZSxFQUFmLENBSk0sQ0FJYTs7QUFFbkIsV0FBUSxHQUFSLENBQVksaUJBQWlCLFFBQVEsU0FBckM7QUFDQSxXQUFRLEdBQVIsQ0FBWSxvQkFBb0IsWUFBaEM7QUFDQSxXQUFRLEdBQVIsQ0FBWSxpQkFBaUIsUUFBUSxVQUFyQzs7QUFFRjtBQUNBOztBQUVFLGFBQVUsQ0FBQyxNQUFNLFlBQVAsSUFBcUIsQ0FBL0I7QUFDRjs7Ozs7O0FBTUUsV0FBUSxRQUFSLENBQWlCLElBQWpCLENBQXNCLEtBQXRCLENBQTRCLFdBQTVCLEdBQTBDLFVBQVEsSUFBbEQ7QUFDQSxXQUFRLFFBQVIsQ0FBaUIsSUFBakIsQ0FBc0IsS0FBdEIsQ0FBNEIsWUFBNUIsR0FBMkMsVUFBUSxJQUFuRDtBQUNGO0FBQ0U7QUFFRCxFQXhWUTtBQXlWVCxZQUFXLHFCQUFXO0FBQ3JCLE1BQUksZ0JBQUosQ0FBcUIsYUFBckI7QUFDQSxFQTNWUTtBQTRWVCxpQkFBZ0IsMEJBQVc7O0FBRTNCOztBQUVDLE1BQUksZ0JBQUosQ0FBcUIsaUJBQXJCO0FBQ0EsTUFBSSxTQUFTLElBQUksTUFBSixDQUFXLCtCQUFYLENBQWI7QUFDQSxXQUFTLGNBQVQsQ0FBd0IsbUJBQXhCLEVBQTZDLFdBQTdDLENBQXlELE1BQXpEO0FBQ0EsTUFBTSxpQkFBaUIsU0FBUyxhQUFULENBQXVCLGlCQUF2QixDQUF2QjtBQUNBLE9BQUksSUFBSSxDQUFSLElBQWEsUUFBUSxlQUFyQixFQUFzQztBQUNyQyxZQUFTLElBQUksTUFBSiwwREFDNEIsUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGFBRHZELG9DQUVLLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUZoQyxZQUVtRCxRQUFRLGVBQVIsQ0FBd0IsQ0FBeEIsRUFBMkIsbUJBRjlFLDRCQUFUO0FBSUEsa0JBQWUsV0FBZixDQUEyQixNQUEzQjtBQUNBLFlBQVMsY0FBVCxDQUF3QixXQUFTLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUE1RCxFQUEyRSxPQUEzRSxHQUFzRixRQUFRLHNCQUFSLENBQStCLE9BQS9CLENBQXVDLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUFsRSxJQUFtRixDQUFDLENBQTFLO0FBQ0E7O0FBRUQ7QUFqQjBCO0FBQUE7QUFBQTs7QUFBQTtBQWtCMUIseUJBQWEsU0FBUyxnQkFBVCxDQUEwQixzQ0FBMUIsQ0FBYixtSUFBZ0Y7QUFBQSxRQUF4RSxHQUF3RTs7QUFDL0UsUUFBSSxPQUFKLENBQVksVUFBWixDQUF1QixHQUF2QjtBQUNBO0FBQ0Q7QUFyQjBCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUE7QUFBQTtBQUFBOztBQUFBO0FBc0IxQix5QkFBYSxTQUFTLGdCQUFULENBQTBCLHNCQUExQixDQUFiLG1JQUFnRTtBQUFBLFFBQXhELEdBQXdEOztBQUMvRCxRQUFJLE9BQUosQ0FBWSxjQUFaLENBQTJCLEdBQTNCO0FBQ0E7O0FBRUY7QUExQjJCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBNEIxQixNQUFJLGdCQUFKLENBQXFCLFlBQXJCO0FBQ0EsV0FBUyxJQUFJLE1BQUosMk5BQVQ7QUFLQSxXQUFTLGNBQVQsQ0FBd0IsZUFBeEIsRUFBeUMsV0FBekMsQ0FBcUQsTUFBckQ7QUFDQSxPQUFJLElBQUksS0FBSSxDQUFaLEVBQWUsS0FBSSxRQUFRLFVBQTNCLEVBQXVDLElBQXZDLEVBQTRDO0FBQzNDLFlBQVMsSUFBSSxNQUFKLHdCQUErQixFQUEvQixZQUF1QyxRQUFRLFlBQVIsSUFBd0IsRUFBekIsR0FBOEIsVUFBOUIsR0FBMkMsRUFBakYsVUFBd0YsUUFBUSxXQUFSLENBQW9CLEVBQXBCLENBQXhGLGVBQVQ7QUFDQSxZQUFTLGNBQVQsQ0FBd0IsYUFBeEIsRUFBdUMsV0FBdkMsQ0FBbUQsTUFBbkQ7QUFDQTtBQUNELE9BQUksSUFBSSxHQUFSLElBQWEsUUFBUSxzQkFBckIsRUFBNkM7QUFDNUMsUUFBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksUUFBUSxlQUFSLENBQXdCLE1BQTNDLEVBQW1ELEdBQW5ELEVBQXdEO0FBQ3ZELFFBQUcsUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGFBQTNCLElBQTRDLFFBQVEsc0JBQVIsQ0FBK0IsR0FBL0IsQ0FBL0MsRUFBa0Y7QUFDakYsY0FBUyxJQUFJLE1BQUosc0JBQTZCLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixhQUF4RCxZQUE0RSxRQUFRLGtCQUFSLElBQThCLEdBQS9CLEdBQW9DLFVBQXBDLEdBQWlELEVBQTVILFVBQW1JLFFBQVEsZUFBUixDQUF3QixDQUF4QixFQUEyQixtQkFBOUosZUFBVDtBQUNBLGNBQVMsY0FBVCxDQUF3QixrQkFBeEIsRUFBNEMsV0FBNUMsQ0FBd0QsTUFBeEQ7QUFDQTtBQUNEO0FBQ0Q7O0FBRUQsV0FBUyxhQUFULENBQXVCLFdBQXZCLEVBQW9DLE9BQXBDLEdBQThDLFlBQU07QUFDbkQsT0FBSSxXQUFXLFNBQVMsY0FBVCxDQUF3QixrQkFBeEIsQ0FBZjtBQUNBLE9BQUksWUFBWSxTQUFTLE9BQVQsQ0FBaUIsU0FBUyxhQUExQixFQUF5QyxFQUF6QyxDQUE0QyxNQUE1QyxDQUFtRCxDQUFuRCxDQUFoQjtBQUNBLGNBQVcsU0FBUyxjQUFULENBQXdCLGFBQXhCLENBQVg7QUFDQSxPQUFJLFlBQVksU0FBUyxPQUFULENBQWlCLFNBQVMsYUFBMUIsRUFBeUMsRUFBekMsQ0FBNEMsTUFBNUMsQ0FBbUQsQ0FBbkQsQ0FBaEI7QUFDQSxRQUFJLElBQUksS0FBSSxDQUFaLEVBQWUsS0FBSSxRQUFRLGVBQVIsQ0FBd0IsTUFBM0MsRUFBbUQsSUFBbkQsRUFBd0Q7QUFDdkQsUUFBRyxRQUFRLHNCQUFSLENBQStCLEVBQS9CLEtBQXFDLFNBQXhDLEVBQW1EO0FBQ2xELFNBQUksT0FBSixDQUFZLE1BQVo7QUFDQSxTQUFJLE9BQUosQ0FBWSxFQUFaLEVBQWMsU0FBZCxFQUF3QixDQUF4QjtBQUNBO0FBQ0Q7QUFDRCxHQVhEO0FBWUEsRUF4WlE7QUF5WlQsa0JBQWlCLDJCQUFXO0FBQzdCO0FBQ0UsVUFBUSxHQUFSLENBQVkseUJBQVo7QUFDQSxFQTVaUTtBQTZaVCxvQkFBbUIsMkJBQVMsTUFBVCxFQUFpQixLQUFqQixFQUF3QjtBQUMxQyxVQUFRLEdBQVIsQ0FBWSwwQkFBWjtBQUNBLE9BQUksSUFBSSxDQUFSLElBQWEsUUFBUSxlQUFyQixFQUFzQztBQUNyQyxPQUFHLFVBQVUsUUFBUSxlQUFSLENBQXdCLENBQXhCLEVBQTJCLGFBQXhDLEVBQXVEO0FBQ3RELFFBQUcsS0FBSCxFQUFVO0FBQ1QsYUFBUSxzQkFBUixDQUErQixJQUEvQixDQUFvQyxNQUFwQztBQUNBLGFBQVEsZ0JBQVI7QUFDQSxLQUhELE1BR087QUFDTixTQUFHLFFBQVEsZ0JBQVIsR0FBMkIsQ0FBOUIsRUFBaUM7QUFDaEMsVUFBSSxJQUFJLFFBQVEsc0JBQVIsQ0FBK0IsT0FBL0IsQ0FBdUMsTUFBdkMsQ0FBUjtBQUNBLFVBQUksSUFBSSxDQUFDLENBQVQsRUFBWTtBQUNYLGVBQVEsc0JBQVIsQ0FBK0IsTUFBL0IsQ0FBc0MsQ0FBdEMsRUFBeUMsQ0FBekM7QUFDQTtBQUNELGNBQVEsZ0JBQVI7QUFDQSxNQU5ELE1BTU87QUFDTjtBQUNBLGVBQVMsY0FBVCxDQUF3QixXQUFTLE9BQU8sV0FBUCxFQUFqQyxFQUF1RCxPQUF2RCxHQUFpRSxJQUFqRTtBQUNBO0FBQ0Q7QUFDRDtBQUNELE9BQUksZUFBSjtBQUNBOztBQUVELE1BQUksVUFBVSxFQUFkO0FBQ0EsT0FBSSxJQUFJLEdBQVIsSUFBYSxRQUFRLGVBQXJCLEVBQXNDO0FBQ3JDLE9BQUcsUUFBUSxzQkFBUixDQUErQixPQUEvQixDQUF1QyxRQUFRLGVBQVIsQ0FBd0IsR0FBeEIsRUFBMkIsYUFBbEUsSUFBbUYsQ0FBQyxDQUF2RixFQUEwRjtBQUN6RixZQUFRLElBQVIsQ0FBYSxRQUFRLGVBQVIsQ0FBd0IsR0FBeEIsRUFBMkIsYUFBeEM7QUFDQTtBQUNEO0FBQ0QsVUFBUSxzQkFBUixHQUFpQyxRQUFRLEtBQVIsRUFBakM7QUFDQTtBQUNBLE1BQUksY0FBSjtBQUNBLEVBN2JRO0FBOGJULFVBQVMsaUJBQVMsT0FBVCxFQUFrQjtBQUMxQixNQUFJLFdBQUosQ0FBZ0IsT0FBaEIsRUFBd0IsSUFBeEI7QUFDQSxNQUFJLFFBQUosQ0FBYSxXQUFTLE9BQXRCLEVBQThCLElBQTlCO0FBQ0EsVUFBUSxXQUFSLEdBQXNCLE9BQXRCO0FBQ0EsTUFBSSxNQUFKO0FBQ0EsRUFuY1E7QUFvY1QsZ0JBQWUseUJBQVc7QUFDekIsVUFBUSxHQUFSLENBQVksZUFBWjtBQUNBLE1BQUksS0FBSjtBQUNBLEVBdmNRO0FBd2NULFFBQU8saUJBQVc7QUFDakIsTUFBSSxVQUFKO0FBQ0EsTUFBSSxhQUFKO0FBQ0EsTUFBSSxPQUFKLENBQVksTUFBWjtBQUNBO0FBNWNRLENBQVY7O0FBK2NBLElBQUksVUFBSjtBQUNBLElBQUksRUFBRSxtQkFBbUIsUUFBckIsQ0FBSixFQUFvQztBQUNuQyxTQUFRLEdBQVIsQ0FBWSwyQkFBWjtBQUNBLEtBQUksS0FBSixHQUZtQyxDQUV0QjtBQUNiOzs7QUM3ZEQ7O0FBRUE7O0FBRUEsSUFBTSxNQUFNO0FBQ1gsU0FBUSxnQkFBUyxPQUFULEVBQWtCO0FBQ3pCLE1BQUksT0FBTyxTQUFTLHNCQUFULEVBQVg7QUFDQSxNQUFJLE9BQU8sU0FBUyxhQUFULENBQXVCLEtBQXZCLENBQVg7QUFDQSxPQUFLLFNBQUwsR0FBaUIsT0FBakI7QUFDQSxTQUFPLEtBQUssVUFBWixFQUF3QjtBQUN2QixRQUFLLFdBQUwsQ0FBaUIsS0FBSyxVQUF0QjtBQUNBO0FBQ0QsU0FBTyxJQUFQO0FBQ0EsRUFUVTtBQVVYLG1CQUFrQiwwQkFBUyxjQUFULEVBQXlCO0FBQzFDLE1BQUksV0FBVyxTQUFTLGFBQVQsQ0FBdUIsY0FBdkIsQ0FBZjtBQUNBLE1BQUcsYUFBYSxJQUFoQixFQUFzQjtBQUNyQixZQUFTLFVBQVQsQ0FBb0IsV0FBcEIsQ0FBZ0MsUUFBaEM7QUFDQTtBQUNELEVBZlU7QUFnQlgsV0FBVSxrQkFBUyxjQUFULEVBQXlCLE9BQXpCLEVBQWtDO0FBQzNDLE1BQUksWUFBWSxTQUFTLGdCQUFULENBQTBCLGNBQTFCLENBQWhCO0FBQ0EsTUFBRyxRQUFRLE9BQVIsQ0FBZ0IsR0FBaEIsSUFBdUIsQ0FBQyxDQUEzQixFQUE4QjtBQUM3QixPQUFJLFVBQVUsUUFBUSxLQUFSLENBQWMsR0FBZCxDQUFkO0FBQ0EsUUFBSSxJQUFJLElBQUksQ0FBWixFQUFlLElBQUksUUFBUSxNQUEzQixFQUFtQyxHQUFuQyxFQUF3QztBQUN2QyxRQUFJLFFBQUosQ0FBYSxjQUFiLEVBQTZCLFFBQVEsQ0FBUixDQUE3QjtBQUNBO0FBQ0QsR0FMRCxNQUtPO0FBQ04sUUFBSyxJQUFJLElBQUksQ0FBYixFQUFnQixJQUFJLFVBQVUsTUFBOUIsRUFBc0MsR0FBdEMsRUFBMkM7QUFDMUMsY0FBVSxDQUFWLEVBQWEsU0FBYixDQUF1QixHQUF2QixDQUEyQixPQUEzQjtBQUNBO0FBQ0Q7QUFDRCxFQTVCVTtBQTZCWCxjQUFhLHFCQUFTLGNBQVQsRUFBeUIsT0FBekIsRUFBa0M7QUFDOUMsTUFBSSxZQUFZLFNBQVMsZ0JBQVQsQ0FBMEIsY0FBMUIsQ0FBaEI7QUFDQSxNQUFHLFFBQVEsT0FBUixDQUFnQixHQUFoQixJQUF1QixDQUFDLENBQTNCLEVBQThCO0FBQzdCLE9BQUksVUFBVSxRQUFRLEtBQVIsQ0FBYyxHQUFkLENBQWQ7QUFDQSxRQUFJLElBQUksSUFBSSxDQUFaLEVBQWUsSUFBSSxRQUFRLE1BQTNCLEVBQW1DLEdBQW5DLEVBQXdDO0FBQ3ZDLFFBQUksV0FBSixDQUFnQixjQUFoQixFQUFnQyxRQUFRLENBQVIsQ0FBaEM7QUFDQTtBQUNELEdBTEQsTUFLTztBQUNOLFFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxVQUFVLE1BQTlCLEVBQXNDLEdBQXRDLEVBQTJDO0FBQzFDLGNBQVUsQ0FBVixFQUFhLFNBQWIsQ0FBdUIsTUFBdkIsQ0FBOEIsT0FBOUI7QUFDQTtBQUNEO0FBQ0QsRUF6Q1U7QUEwQ1gsV0FBVSxrQkFBUyxPQUFULEVBQWtCLEdBQWxCLEVBQXVCO0FBQ2hDLFNBQU8sQ0FBQyxNQUFNLFFBQVEsU0FBZCxHQUEwQixHQUEzQixFQUFnQyxPQUFoQyxDQUF3QyxNQUFNLEdBQU4sR0FBWSxHQUFwRCxJQUEyRCxDQUFDLENBQW5FO0FBQ0E7QUE1Q1UsQ0FBWjs7QUErQ0EsT0FBTyxPQUFQLEdBQWlCLEdBQWpCOzs7QUNuREE7O0FBRUE7O0FBRUEsSUFBTSxVQUFVLDAwU0FBaEI7O0FBd0ZBLE9BQU8sT0FBUCxHQUFpQixPQUFqQjs7O0FDNUZBOztBQUVBOztBQUVBLElBQU0sVUFBVSx3bzZCQUFoQjs7QUErckJBLE9BQU8sT0FBUCxHQUFpQixPQUFqQjs7O0FDbnNCQTs7QUFFQTs7QUFFQSxJQUFNLGFBQWEsbXRoQ0FBbkI7O0FBK3JCQSxPQUFPLE9BQVAsR0FBaUIsVUFBakI7OztBQ25zQkE7O0FBRUE7O0FBRUEsSUFBTSxTQUFTLDZ1b0JBQWY7O0FBNEZBLE9BQU8sT0FBUCxHQUFpQixNQUFqQjs7O0FDaEdBOztBQUVBOztBQUVBLElBQU0sU0FBUyw2aDFCQUFmOztBQWtlQSxPQUFPLE9BQVAsR0FBaUIsTUFBakI7OztBQ3RlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3owQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gYXBwZGF0YS5qc1xuLy9cbi8vIGJhc2ljIGFwcGRhdGEg4oCTIHRoZXJlJ3MgYWxzbyBhIHRyYW5zbGF0aW9uZGF0YSBhcnJheSAobWV0YWRhdGEpIGFuZCB0ZXh0ZGF0YSAodGV4dHMpXG4vLyBpcyBpdCB3b3J0aCBmb2xkaW5nIHRoaXMgaW50byBhcHA/IElzIHRoZXJlIGEgdmFsdWUgaW4ga2VlcGluZyB0aGlzIHNlcGFyYXRlP1xuLy9cbi8vIHRoaXMgcHJvYmFibHkgbmVlZHMgc29tZSByZXdvcmtpbmc/XG5cbmNvbnN0IHRyYW5zbGF0aW9uZGF0YSA9IHJlcXVpcmUoXCIuL2Jvb2tkYXRhXCIpLnRyYW5zbGF0aW9uZGF0YTtcbmNvbnN0IGNhbnRvdGl0bGVzID0gcmVxdWlyZShcIi4vYm9va2RhdGFcIikuY2FudG90aXRsZXM7XG5cbnZhciBhcHBkYXRhID0ge1xuXHRjdXJyZW50dHJhbnNsYXRpb25saXN0OiBbXSwgICAgLy8gbGlzdCBvZiBpZHMgb2YgdHJhbnNsYXRpb25zIHdlJ3JlIGN1cnJlbnRseSB1c2luZ1xuXHRjdXJyZW50dHJhbnNsYXRpb246IDAsXG5cdHRyYW5zbGF0aW9uY291bnQ6IHRyYW5zbGF0aW9uZGF0YS5sZW5ndGgsXG5cdGN1cnJlbnRjYW50bzogMCxcblx0Y2FudG9jb3VudDogY2FudG90aXRsZXMubGVuZ3RoLFxuXHRsaW5laGVpZ2h0OiAyNCxcblx0bGVuc3dpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCxcblx0bGVuc2hlaWdodDogd2luZG93LmlubmVySGVpZ2h0IC0gNDAsXG5cdHdpbmRvd3dpZHRoOiB3aW5kb3cuaW5uZXJXaWR0aCxcblx0d2luZG93aGVpZ2h0OiB3aW5kb3cuaW5uZXJIZWlnaHQsXG5cdHRleHR3aWR0aDogd2luZG93LmlubmVyV2lkdGgsXG5cdGN1cnJlbnRwYWdlOiBcImxlbnNcIixcblx0bmlnaHRtb2RlOiBmYWxzZSxcblx0Y3VycmVudHBlcmNlbnRhZ2U6IDAsIC8vIHRoaXMgaXMgY3VycmVudCBwZXJjZW50YWdlIG9mIHBhZ2UgKG1heWJlIHRoaXMgc2hvdWxkIGJlIGluIHRlcm1zIG9mIGxpbmVzIG9uIHBhZ2U/KVxuXHRjdXJyZW50bGluZXM6IDAsICAgICAgIC8vIHRoaXMgaXMgdGhlIG51bWJlciBvZiBsaW5lcyBjYWxjdWxhdGVkIHRvIGJlIG9uIHRoZSBwYWdlXG5cdGVsZW1lbnRzOiB7fSxcblx0dGV4dGRhdGE6IHt9LFxuXHR0cmFuc2xhdGlvbmRhdGE6IHRyYW5zbGF0aW9uZGF0YSxcblx0Y2FudG90aXRsZXM6IGNhbnRvdGl0bGVzXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFwcGRhdGE7XG4iLCJjb25zdCBjYW50b3RpdGxlcyA9IFtcIlRpdGxlIHBhZ2VcIixcIkNhbnRvIDFcIixcIkNhbnRvIDJcIixcIkNhbnRvIDNcIl07XG5cbmNvbnN0IHRyYW5zbGF0aW9uZGF0YSA9IFtcblx0e1widHJhbnNsYXRpb25pZFwiOlwiZGFudGVcIixcblx0XHRcInRyYW5zbGF0aW9uc2hvcnRuYW1lXCI6XCJEYW50ZVwiLFxuXHRcdFwidHJhbnNsYXRpb25mdWxsbmFtZVwiOlwiRGFudGUgQWxpZ2hpZXJpXCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmNsYXNzXCI6XCJwb2V0cnkgb3JpZ2luYWxcIixcblx0XHRcIm9yZGVyXCI6MH0sXG5cdHtcInRyYW5zbGF0aW9uaWRcIjpcImxvbmdmZWxsb3dcIixcblx0XHRcInRyYW5zbGF0aW9uc2hvcnRuYW1lXCI6XCJMb25nZmVsbG93XCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmZ1bGxuYW1lXCI6XCJIZW5yeSBXb3Jkc3dvcnRoIExvbmdmZWxsb3dcIixcblx0XHRcInRyYW5zbGF0aW9uY2xhc3NcIjpcInBvZXRyeSBsb25nZmVsbG93XCIsXG5cdFx0XCJvcmRlclwiOjF9LFxuXHR7XCJ0cmFuc2xhdGlvbmlkXCI6XCJub3J0b25cIixcblx0XHRcInRyYW5zbGF0aW9uc2hvcnRuYW1lXCI6XCJOb3J0b25cIixcblx0XHRcInRyYW5zbGF0aW9uZnVsbG5hbWVcIjpcIkNoYXJsZXMgRWxpb3QgTm9ydG9uXCIsXG5cdFx0XCJ0cmFuc2xhdGlvbmNsYXNzXCI6XCJub3J0b24gcHJvc2VcIixcblx0XHRcIm9yZGVyXCI6Mn0sXG5cdHtcInRyYW5zbGF0aW9uaWRcIjpcIndyaWdodFwiLFxuXHRcdFwidHJhbnNsYXRpb25zaG9ydG5hbWVcIjpcIldyaWdodFwiLFxuXHRcdFwidHJhbnNsYXRpb25mdWxsbmFtZVwiOlwiUy4gRm93bGVyIFdyaWdodFwiLFxuXHRcdFwidHJhbnNsYXRpb25jbGFzc1wiOlwicG9ldHJ5IHdyaWdodFwiLFxuXHRcdFwib3JkZXJcIjozfSxcblx0e1widHJhbnNsYXRpb25pZFwiOlwiY2FybHlsZVwiLFxuXHRcdFwidHJhbnNsYXRpb25zaG9ydG5hbWVcIjpcIkNhcmx5bGVcIixcblx0XHRcInRyYW5zbGF0aW9uZnVsbG5hbWVcIjpcIkNhcmx5bGUvT2tleS9XaWtzdGVlZFwiLFxuXHRcdFwidHJhbnNsYXRpb25jbGFzc1wiOlwicHJvc2UgY2FybHlsZVwiLFxuXHRcdFwib3JkZXJcIjo0fVxuXTtcblxubW9kdWxlLmV4cG9ydHMuY2FudG90aXRsZXMgPSBjYW50b3RpdGxlcztcbm1vZHVsZS5leHBvcnRzLnRyYW5zbGF0aW9uZGF0YSA9IHRyYW5zbGF0aW9uZGF0YTtcbiIsIi8vIHZlcnNpb24gNDogbm93IGdvaW5nIHRvIEVTNiAmIEJhYmVsXG5cblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBIYW1tZXIgPSByZXF1aXJlKFwiaGFtbWVyanNcIik7XG5jb25zdCBGYXN0Y2xpY2sgPSByZXF1aXJlKFwiZmFzdGNsaWNrXCIpO1x0Ly8gd2h5IGlzIHRoaXMgbm90IHdvcmtpbmc/XG5cbmNvbnN0IGRvbSA9IHJlcXVpcmUoXCIuL2RvbVwiKTtcbmxldCBhcHBkYXRhID0gcmVxdWlyZShcIi4vYXBwZGF0YVwiKTtcblxudmFyIGFwcCA9IHtcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKSB7IC8vIGNvdWxkIHNldCB0aGlzIHRvIGNob29zZSB0cmFuc2xhdGlvbnM/XG5cdFx0Y29uc29sZS5sb2coXCJpbml0aWFsaXppbmchXCIpO1xuXHRcdHRoaXMuYmluZEV2ZW50cygpO1xuXG5cdFx0Ly8gYmFzaWMgZG9jIHNldHVwXG5cblx0XHRhcHBkYXRhLnRleHRkYXRhWzBdID0gcmVxdWlyZShcIi4vdHJhbnNsYXRpb25zL2l0YWxpYW4uanNcIik7XG5cdFx0YXBwZGF0YS50ZXh0ZGF0YVsxXSA9IHJlcXVpcmUoXCIuL3RyYW5zbGF0aW9ucy9sb25nZmVsbG93LmpzXCIpO1xuXHRcdGFwcGRhdGEudGV4dGRhdGFbMl0gPSByZXF1aXJlKFwiLi90cmFuc2xhdGlvbnMvbm9ydG9uLmpzXCIpO1xuXHRcdGFwcGRhdGEudGV4dGRhdGFbM10gPSByZXF1aXJlKFwiLi90cmFuc2xhdGlvbnMvd3JpZ2h0LmpzXCIpO1xuXHRcdGFwcGRhdGEudGV4dGRhdGFbNF0gPSByZXF1aXJlKFwiLi90cmFuc2xhdGlvbnMvY2FybHlsZS5qc1wiKTtcblxuXHRcdGFwcGRhdGEuZWxlbWVudHMubGVucyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibGVuc1wiKTtcblx0XHRhcHBkYXRhLmVsZW1lbnRzLm1haW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5cIik7XG5cdFx0YXBwZGF0YS5lbGVtZW50cy5jb250ZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjb250ZW50XCIpO1xuXHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGV4dFwiKTtcblxuXHRcdC8vIHNldCB1cCBjdXJyZW50IHRyYW5zbGF0aW9uIGxpc3QgKGluaXRpYWxseSB1c2UgYWxsIG9mIHRoZW0pXG5cblx0XHRmb3IobGV0IGkgaW4gYXBwZGF0YS50cmFuc2xhdGlvbmRhdGEpIHtcblx0XHRcdGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdC5wdXNoKGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpO1xuXHRcdH1cblxuXHRcdC8vIGNoZWNrIHRvIHNlZSBpZiB0aGVyZSBhcmUgc2F2ZWQgbG9jYWxzdG9yYWdlLCBpZiBzbywgdGFrZSB0aG9zZSB2YWx1ZXNcblxuXHR9LFxuXHRiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLmxvZyhcImJpbmRpbmcgZXZlbnRzIVwiKTtcblx0XHRkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2VyZWFkeScsIHRoaXMub25EZXZpY2VSZWFkeSwgZmFsc2UpO1xuXHRcdHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwicmVzaXplXCIsIHRoaXMucmVzaXplLCBmYWxzZSk7XG5cblx0XHQvLyBzdGFydCBmYXN0Y2xpY2tcblxuXHRcdGlmICgnYWRkRXZlbnRMaXN0ZW5lcicgaW4gZG9jdW1lbnQpIHtcblx0XHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XG5cdFx0XHRcdEZhc3RjbGljay5hdHRhY2goZG9jdW1lbnQuYm9keSk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cdFx0fVxuXHR9LFxuXHRoZWxwZXJzOiB7XG5cdFx0Z29zZXR0aW5nczogZnVuY3Rpb24oZWxlbWVudCkge1xuXHRcdFx0ZWxlbWVudC5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0XHRhcHAuc2V0cGFnZShcInNldHRpbmdzXCIpO1xuXHRcdFx0fTtcblx0XHR9LFxuXHRcdHNldHVwbm90ZTogZnVuY3Rpb24oZWwpIHtcblx0XHRcdGVsLm9uY2xpY2sgPSAoZSkgPT4ge1xuXHRcdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0XHRsZXQgdGhpc25vdGUgPSB0aGlzLmdldEF0dHJpYnV0ZShcImRhdGEtbm90ZW51bWJlclwiKTtcblx0XHRcdFx0bGV0IG5vdGV0ZXh0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihgLm5vdGV0ZXh0W2RhdGEtbm90ZW51bWJlcj1cIiR7dGhpc25vdGV9XCJdYCkuaW5uZXJIVE1MO1xuXHRcdFx0XHRhcHAuaGlkZW5vdGVzKCk7XG5cdFx0XHRcdGxldCBpbnNlcnQgPSBkb20uY3JlYXRlKGA8ZGl2IGNsYXNzPVwibm90ZXdpbmRvd1wiIGlkPVwibm90ZXdpbmRvd1wiPlxuXHRcdFx0XHRcdFx0JHtub3RldGV4dH1cblx0XHRcdFx0XHQ8L2Rpdj5gKTtcblx0XHRcdFx0YXBwZGF0YS5lbGVtZW50cy5tYWluLmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibm90ZXdpbmRvd1wiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0XHRcdGFwcC5oaWRlbm90ZXMoKTtcblx0XHRcdFx0fTtcblx0XHRcdH07XG5cdFx0fSxcblx0XHRjaGVja2JveGdvOiBmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0YXBwLmNoYW5nZXRyYW5zbGF0aW9uKHRoaXMuaWQucmVwbGFjZShcImNoZWNrLVwiLFwiXCIpLGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuaWQpLmNoZWNrZWQpO1xuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGNoZWNrYm94c3BhbmdvOiBmdW5jdGlvbihlbCkge1xuXHRcdFx0ZWwub25jbGljayA9ICgpID0+IHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGNoZWNrLSR7dGhpcy5pZH1gKS5jaGVja2VkID0gIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGBjaGVjay0ke3RoaXMuaWR9YCkuY2hlY2tlZDtcblx0XHRcdFx0YXBwLmNoYW5nZXRyYW5zbGF0aW9uKHRoaXMuaWQsZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYGNoZWNrLSR7dGhpcy5pZH1gKS5jaGVja2VkKTtcblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXHRzZXR1cGNvbnRyb2xzOiBmdW5jdGlvbigpIHtcblxuXHRcdC8vIGJ1dHRvbiBjb250cm9sc1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2cHJldlwiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24tMSxhcHBkYXRhLmN1cnJlbnRjYW50byk7XG5cdFx0fTtcblx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdm5leHRcIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uKzEsYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZ1cFwiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24sYXBwZGF0YS5jdXJyZW50Y2FudG8tMSwwKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwibmF2ZG93blwiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24sYXBwZGF0YS5jdXJyZW50Y2FudG8rMSwwKTtcblx0XHR9O1xuXHRcdC8vIGluaXRpYWwgc2V0dGluZ3NcblxuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYWJvdXRsaW5rXCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRhcHAuc2V0cGFnZShcImFib3V0XCIpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJoZWxwbGlua1wiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0YXBwLnNldHBhZ2UoXCJoZWxwXCIpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkYXltb2RlXCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCJib2R5XCIsXCJuaWdodG1vZGVcIik7XG5cdFx0XHRkb20uYWRkY2xhc3MoXCIjbmlnaHRtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjZGF5bW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0YXBwZGF0YS5uaWdodG1vZGUgPSBmYWxzZTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjbmlnaHRtb2RlXCIpLm9uY2xpY2sgPSAoKSA9PiB7XG5cdFx0XHRkb20uYWRkY2xhc3MoXCJib2R5XCIsXCJuaWdodG1vZGVcIik7XG5cdFx0XHRkb20ucmVtb3ZlY2xhc3MoXCIjbmlnaHRtb2RlXCIsXCJvZmZcIik7XG5cdFx0XHRkb20uYWRkY2xhc3MoXCIjZGF5bW9kZVwiLFwib2ZmXCIpO1xuXHRcdFx0YXBwZGF0YS5uaWdodG1vZGUgPSB0cnVlO1xuXHRcdH07XG5cblx0XHQvLyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmJhY2t0b3NldHRpbmdzXCIpLmZvckVhY2goYXBwLmhlbHBlcnMuZ29zZXR0aW5ncyk7XG5cdFx0Zm9yKGxldCBpIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuYmFja3Rvc2V0dGluZ3NcIikpIHtcblx0XHRcdGFwcC5oZWxwZXJzLmdvc2V0dGluZ3MoaSk7XG5cdFx0fVxuXG5cdC8vIHN3aXBlIGNvbnRyb2xzXG5cblx0XHRsZXQgaGFtbWVydGltZSA9IG5ldyBIYW1tZXIoYXBwZGF0YS5lbGVtZW50cy5sZW5zKTsgLy8gZG9lcyB0aGlzIG5lZWQgdG8gYmUgYSBnbG9iYWw/XG5cdFx0aGFtbWVydGltZS5nZXQoJ3N3aXBlJykuc2V0KHsgZGlyZWN0aW9uOiBIYW1tZXIuRElSRUNUSU9OX0FMTCB9KTtcblx0XHRoYW1tZXJ0aW1lLm9uKCdzd2lwZWxlZnQnLCgpID0+IHtcblx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uKzEsYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHRcdH0pLm9uKCdzd2lwZXJpZ2h0JywoKSA9PiB7XG5cdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbi0xLGFwcGRhdGEuY3VycmVudGNhbnRvKTtcblx0XHR9KTtcblxuXHRcdGhhbW1lcnRpbWUub24oJ3N3aXBlZG93bicsKCkgPT4ge1xuXHRcdFx0aWYoYXBwZGF0YS5lbGVtZW50cy50ZXh0LnNjb2xsVG9wID09PSAwKSB7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLGFwcGRhdGEuY3VycmVudGNhbnRvLTEsMSk7ICAvLyB0aGlzIG5lZWRzIHRvIGJlIGF0IHRoZSBib3R0b20hXG5cdFx0XHR9XG5cdFx0fSkub24oJ3N3aXBldXAnLCgpID0+IHtcbi8vIGlmIGRpZmZlcmVuY2UgYmV0d2VlbiBjdXJyZW50IHNjcm9sbCBwb3NpdGlvbiArIGhlaWdodCBvZiBmcmFtZSAmIGNvbXBsZXRlIGhlaWdodFxuLy8gb2YgY29sdW1uIGlzIGxlc3MgdGhhbiA4LCBnbyB0byB0aGUgbmV4dCBvbmVcblxuXHRcdFx0aWYoTWF0aC5hYnMoYXBwZGF0YS5lbGVtZW50cy50ZXh0LnNjcm9sbFRvcCArIGFwcGRhdGEuZWxlbWVudHMudGV4dC5jbGllbnRIZWlnaHQgLSBhcHBkYXRhLmVsZW1lbnRzLnRleHQuc2Nyb2xsSGVpZ2h0KSA8IDgpIHtcblx0XHRcdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24sYXBwZGF0YS5jdXJyZW50Y2FudG8rMSk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0Ly8ga2V5IGNvbnRyb2xzXG5cblx0XHRkb2N1bWVudC5ib2R5Lm9ua2V5ZG93biA9IChlKSA9PiB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRpZigoZS5rZXlDb2RlIHx8IGUud2hpY2gpID09PSAzNykge1xuXHRcdFx0XHRkb20uYWRkY2xhc3MoXCIjbmF2cHJldlwiLFwib25cIik7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLTEsYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHRcdFx0fVxuXHRcdFx0aWYoKGUua2V5Q29kZSB8fCBlLndoaWNoKSA9PT0gMzkpIHtcblx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI25hdm5leHRcIixcIm9uXCIpO1xuXHRcdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbisxLGFwcGRhdGEuY3VycmVudGNhbnRvKTtcblx0XHRcdH1cblx0XHRcdGlmKChlLmtleUNvZGUgfHwgZS53aGljaCkgPT09IDM4KSB7XG5cdFx0XHRcdGRvbS5hZGRjbGFzcyhcIiNuYXZ1cFwiLFwib25cIik7XG5cdFx0XHRcdGFwcC5zZXRsZW5zKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uLGFwcGRhdGEuY3VycmVudGNhbnRvLTEpO1xuXHRcdFx0fVxuXHRcdFx0aWYoKGUua2V5Q29kZSB8fCBlLndoaWNoKSA9PT0gNDApIHtcblx0XHRcdFx0ZG9tLmFkZGNsYXNzKFwiI25hdmRvd25cIixcIm9uXCIpO1xuXHRcdFx0XHRhcHAuc2V0bGVucyhhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbixhcHBkYXRhLmN1cnJlbnRjYW50bysxLDApO1xuXHRcdFx0fVxuXHRcdH07XG5cdFx0ZG9jdW1lbnQuYm9keS5vbmtleXVwID0gKGUpID0+IHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIi5idXR0b25cIixcIm9uXCIpO1xuXHRcdH07XG5cblx0Ly8gcGFnZSBjb250cm9sc1xuXG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuYXZ0aXRsZVwiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0YXBwLnNldHBhZ2UoXCJsZW5zXCIpO1xuXHRcdH07XG5cdFx0ZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNuYXZzZXR0aW5nc1wiKS5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0aWYoYXBwZGF0YS5jdXJyZW50cGFnZSA9PSBcInNldHRpbmdzXCIpIHtcbi8vICAgICAgaWYoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YoYXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25dLnRyYW5zbGF0aW9uaWQpID4gLTEgKSB7fVxuXHRcdFx0XHRhcHAuc2V0cGFnZShcImxlbnNcIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRhcHAudXBkYXRlc2V0dGluZ3MoKTtcblx0XHRcdFx0YXBwLnNldHBhZ2UoXCJzZXR0aW5nc1wiKTtcblx0XHRcdH1cblx0XHR9O1xuXHRcdGFwcGRhdGEuZWxlbWVudHMubWFpbi5vbmNsaWNrID0gKCkgPT4ge1xuXHRcdFx0YXBwLmhpZGVub3RlcygpO1xuXHRcdH07XG5cdH0sXG5cdHNldHVwbm90ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdGxldCBjb3VudCA9IDA7XG5cdFx0bGV0IG5vdGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5ub3RlXCIpO1xuXG5cdFx0Zm9yKGxldCBpID0gMDsgaSA8IG5vdGVzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRsZXQgY2hpbGRyZW4gPSBub3Rlc1tpXS5jaGlsZHJlbjtcblx0XHRcdGZvcihsZXQgaj0wOyBqIDwgY2hpbGRyZW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0aWYoZG9tLmhhc2NsYXNzKGNoaWxkcmVuW2pdLFwibm90ZXRleHRcIikpIHtcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhcIm5vdGV0ZXh0IFwiK2NvdW50KTtcblx0XHRcdFx0XHRjaGlsZHJlbltqXS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGVudW1iZXJcIiwgY291bnQpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmKGRvbS5oYXNjbGFzcyhjaGlsZHJlbltqXSxcIm5vdGVub1wiKSkge1xuXHRcdFx0XHRcdGNvbnNvbGUubG9nKFwibm90ZW5vIFwiK2NvdW50KTtcblx0XHRcdFx0XHRjaGlsZHJlbltqXS5zZXRBdHRyaWJ1dGUoXCJkYXRhLW5vdGVudW1iZXJcIiwgY291bnQpO1xuXHRcdFx0XHRcdGFwcC5oZWxwZXJzLnNldHVwbm90ZShjaGlsZHJlbltqXSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNvdW50Kys7XG5cdFx0fVxuXHR9LFxuXHRyZXNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdGFwcGRhdGEud2luZG93d2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcblx0XHRhcHBkYXRhLndpbmRvd2hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcblx0XHRjb25zb2xlLmxvZyhgVGhlIHdpbmRvdyBoYXMgYmVlbiByZXNpemVkISBOZXcgd2lkdGg6ICR7YXBwZGF0YS53aW5kb3d3aWR0aH0sJHthcHBkYXRhLndpbmRvd2hlaWdodH1gKTtcblx0XHRhcHBkYXRhLmxlbnN3aWR0aCA9IGFwcGRhdGEud2luZG93d2lkdGg7XG5cdFx0YXBwZGF0YS5sZW5zaGVpZ2h0ID0gYXBwZGF0YS53aW5kb3doZWlnaHQgLSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdmJhclwiKS5jbGllbnRIZWlnaHQ7XG5cblx0XHRkb20uYWRkY2xhc3MoXCIucGFnZVwiLGFwcGRhdGEubGVuc3dpZHRoID4gYXBwZGF0YS5sZW5zaGVpZ2h0ID8gXCJsYW5kc2NhcGVcIiA6IFwicG9ydHJhaXRcIik7XG5cdFx0ZG9tLnJlbW92ZWNsYXNzKFwiLnBhZ2VcIixhcHBkYXRhLmxlbnN3aWR0aCA+IGFwcGRhdGEubGVuc2hlaWdodCA/IFwicG9ydHJhaXRcIiA6IFwibGFuZHNjYXBlXCIpO1xuXG5cdFx0YXBwZGF0YS5lbGVtZW50cy5tYWluLnN0eWxlLndpZHRoID0gYXBwZGF0YS5sZW5zd2lkdGgrXCJweFwiO1xuXHRcdGFwcGRhdGEuZWxlbWVudHMubWFpbi5zdHlsZS5oZWlnaHQgPSBhcHBkYXRhLndpbmRvd2hlaWdodCtcInB4XCI7XG5cdFx0YXBwZGF0YS5lbGVtZW50cy5jb250ZW50LnN0eWxlLndpZHRoID0gYXBwZGF0YS5sZW5zd2lkdGgrXCJweFwiO1xuXHRcdGFwcGRhdGEuZWxlbWVudHMuY29udGVudC5zdHlsZS5oZWlnaHQgPSBhcHBkYXRhLmxlbnNoZWlnaHQrXCJweFwiO1xuXG5cdFx0YXBwZGF0YS5saW5laGVpZ2h0ID0gYXBwZGF0YS53aW5kb3d3aWR0aC8yNTtcblx0XHRhcHBkYXRhLnRleHR3aWR0aCA9IGFwcGRhdGEud2luZG93d2lkdGg7XG5cdFx0YXBwLnNldGxlbnMoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24sYXBwZGF0YS5jdXJyZW50Y2FudG8pO1xuXHR9LFxuXHRzZXRsZW5zOiBmdW5jdGlvbihuZXd0cmFucywgbmV3Y2FudG8sIHBlcmNlbnRhZ2UpIHtcblx0XHRjb25zb2xlLmxvZyhgU2V0bGVucyBjYWxsZWQgZm9yICR7bmV3dHJhbnN9LCBjYW50byAke25ld2NhbnRvfWApO1xuXHRcdGxldCBjaGFuZ2V0cmFucyA9IGZhbHNlO1xuXG5cdC8vIGlmIHBhZ2UgaXNuJ3Qgc2V0IHRvIFwibGVuc1wiIHRoaXMgZG9lc24ndCBkbyBhbnl0aGluZ1xuXG5cdFx0aWYoYXBwZGF0YS5jdXJyZW50cGFnZSA9PSBcImxlbnNcIikge1xuXHRcdFx0aWYobmV3dHJhbnMgLSBhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbiAhPT0gMCkge1xuXHRcdFx0XHRjaGFuZ2V0cmFucyA9IHRydWU7XG5cdFx0XHRcdHBlcmNlbnRhZ2UgPSAoYXBwZGF0YS5lbGVtZW50cy50ZXh0LnNjcm9sbFRvcCAvKisgYXBwZGF0YS5lbGVtZW50cy50ZXh0LmNsaWVudEhlaWdodCovKS9hcHBkYXRhLmVsZW1lbnRzLnRleHQuc2Nyb2xsSGVpZ2h0O1xuXHRcdFx0XHRjb25zb2xlLmxvZyhwZXJjZW50YWdlKTtcblx0XHRcdH1cblxuXHRcdFx0aWYobmV3dHJhbnMgPj0gYXBwZGF0YS50cmFuc2xhdGlvbmNvdW50KSB7XG5cdFx0XHRcdG5ld3RyYW5zID0gMDtcblx0XHRcdH1cblx0XHRcdGlmKG5ld3RyYW5zIDwgMCkge1xuXHRcdFx0XHRuZXd0cmFucyA9IGFwcGRhdGEudHJhbnNsYXRpb25jb3VudC0xO1xuXHRcdFx0fVxuXHRcdFx0aWYobmV3Y2FudG8gPj0gYXBwZGF0YS5jYW50b2NvdW50KSB7XG5cdFx0XHRcdG5ld2NhbnRvID0gMDtcblx0XHRcdH1cblx0XHRcdGlmKG5ld2NhbnRvIDwgMCkge1xuXHRcdFx0XHRuZXdjYW50byA9IGFwcGRhdGEuY2FudG9jb3VudC0xO1xuXHRcdFx0fVxuXG5cdC8vIGZpZ3VyZSBvdXQgd2hpY2ggdHJhbnNsYXRpb24gaXMgdGhlIGN1cnJlbnQgdHJhbnNsYXRpb25cblxuXHRcdFx0Zm9yKGxldCBpPTA7IGkgPCBhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YS5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRpZihhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3RbbmV3dHJhbnNdID09IGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpIHtcblx0XHRcdFx0XHRuZXd0cmFucyA9IGk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5pbm5lckhUTUwgPSBhcHAudGV4dGRhdGFbbmV3dHJhbnNdW25ld2NhbnRvXTtcblx0XHRcdGRvbS5yZW1vdmVjbGFzcyhcIiN0ZXh0XCIsYXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25dLnRyYW5zbGF0aW9uY2xhc3MpO1xuXHRcdFx0ZG9tLmFkZGNsYXNzKFwiI3RleHRcIixhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtuZXd0cmFuc10udHJhbnNsYXRpb25jbGFzcyk7XG5cdFx0XHRhcHAuc2V0dXBub3RlcygpO1xuXHRcdFx0YXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb24gPSBuZXd0cmFucztcblx0XHRcdGFwcGRhdGEuY3VycmVudGNhbnRvID0gbmV3Y2FudG87XG5cblx0XHRcdGlmKGFwcGRhdGEuY3VycmVudGNhbnRvID4gMCkge1xuXHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm5hdnRpdGxlXCIpLmlubmVySFRNTCA9IGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2FwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uXS50cmFuc2xhdGlvbnNob3J0bmFtZStgIMK3IDxzdHJvbmc+Q2FudG8gJHthcHBkYXRhLmN1cnJlbnRjYW50b308L3N0cm9uZz5gO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJuYXZ0aXRsZVwiKS5pbm5lckhUTUwgPSBcIiZuYnNwO1wiO1xuXHRcdFx0fVxuXG5cdFx0XHRhcHAuZml4cGFkZGluZygpO1xuXG4vLyBzZXQgcGVyY2VudGFnZTogdGhpcyBpcyB0ZXJyaWJsZSEgZml4IHRoaXMhXG4vLyBmaXJzdDogdHJ5IHRvIGZpZ3VyZSBvdXQgaG93IG1hbnkgbGluZXMgd2UgaGF2ZT8gQ2FuIHdlIGRvIHRoYXQ/XG5cblx0XHRcdGlmKGNoYW5nZXRyYW5zKSB7XG5cblx0XHQvLyB0aGlzIG1ldGhvZCBzdGlsbCBpc24ndCBncmVhdCEgaXQgdHJpZXMgdG8gcm91bmQgdG8gY3VycmVudCBsaW5laGVpZ2h0XG5cdFx0Ly8gdG8gYXZvaWQgY3V0dGluZyBvZmYgbGluZXNcblxuXHRcdFx0XHRsZXQgc2Nyb2xsdG8gPSBhcHAucm91bmRlZChwZXJjZW50YWdlICogYXBwZGF0YS5lbGVtZW50cy50ZXh0LnNjcm9sbEhlaWdodCk7XG5cdFx0XHRcdGFwcGRhdGEuZWxlbWVudHMudGV4dC5zY3JvbGxUb3AgPSBzY3JvbGx0bztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmKHBlcmNlbnRhZ2UgPiAwKSB7XG5cdFx0XHRcdFx0YXBwZGF0YS5lbGVtZW50cy50ZXh0LnNjcm9sbFRvcCA9IGFwcGRhdGEuZWxlbWVudHMudGV4dC5zY3JvbGxIZWlnaHQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXBwZGF0YS5lbGVtZW50cy50ZXh0LnNjcm9sbFRvcCA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0YXBwLnNhdmVjdXJyZW50ZGF0YSgpO1xuXHR9LFxuXHRyb3VuZGVkOiBmdW5jdGlvbihwaXhlbHMpIHtcblxuXHRcdC8vIHRoaXMgaXMgc3RpbGwgYSBtZXNzLCBmaXggdGhpc1xuXG5cdFx0cmV0dXJuIGFwcGRhdGEubGluZWhlaWdodCAqIE1hdGguZmxvb3IocGl4ZWxzIC8gYXBwZGF0YS5saW5laGVpZ2h0KTtcblxuXHR9LFxuXHRmaXhwYWRkaW5nOiBmdW5jdGlvbigpIHtcblx0XHRjb25zdCBkaXZzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIiN0ZXh0IHBcIik7XG5cdFx0dmFyIGRpdiwgcGFkZGluZywgZGVzaXJlZHdpZHRoO1xuXHRcdGxldCBtYXh3aWR0aCA9IDA7XG5cblx0XHRpZihkb20uaGFzY2xhc3MoYXBwZGF0YS5lbGVtZW50cy50ZXh0LFwicG9ldHJ5XCIpKSB7XG5cbi8vIHRoaXMgaXMgcG9ldHJ5LCBmaWd1cmUgb3V0IGxvbmdlc3QgbGluZVxuXG5cdFx0XHRhcHBkYXRhLmVsZW1lbnRzLnRleHQuc3R5bGUucGFkZGluZ0xlZnQgPSAwO1xuXHRcdFx0Zm9yKGxldCBpPTA7IGk8ZGl2cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRkaXYgPSBkaXZzW2ldO1xuXHRcdFx0XHRkaXYuc3R5bGUuZGlzcGxheSA9IFwiaW5saW5lLWJsb2NrXCI7XG5cdFx0XHRcdGlmKGRpdi5jbGllbnRXaWR0aCA+IG1heHdpZHRoKSB7XG5cdFx0XHRcdFx0bWF4d2lkdGggPSBkaXYuY2xpZW50V2lkdGggKyA5MDtcblx0XHRcdFx0fVxuXHRcdFx0XHRkaXYuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcblx0XHRcdH1cblxuXHRcdFx0Y29uc29sZS5sb2coXCJ0ZXh0IHdpZHRoOiBcIiArIGFwcGRhdGEudGV4dHdpZHRoKTtcblx0XHRcdGNvbnNvbGUubG9nKFwibWF4IHdpZHRoOiBcIiArIG1heHdpZHRoKTtcblxuXHRcdFx0YXBwZGF0YS5lbGVtZW50cy50ZXh0LnN0eWxlLnBhZGRpbmdMZWZ0ID0gKGFwcGRhdGEudGV4dHdpZHRoIC0gbWF4d2lkdGgpLzIrXCJweFwiO1xuXHRcdFx0YXBwZGF0YS5lbGVtZW50cy50ZXh0LnN0eWxlLnBhZGRpbmdSaWdodCA9IChhcHBkYXRhLnRleHR3aWR0aCAtIG1heHdpZHRoKS8yK1wicHhcIjtcblx0XHR9IGVsc2Uge1xuXG5cdC8vIHRoaXMgaXMgcHJvc2UsIHN0YW5kYXJkaXplZCBwYWRkaW5nXG5cblx0XHRcdGRlc2lyZWR3aWR0aCA9IDc1OyAvLyB0aGlzIGlzIGluIHZ3XG5cblx0XHRcdGNvbnNvbGUubG9nKFwidGV4dCB3aWR0aDogXCIgKyBhcHBkYXRhLnRleHR3aWR0aCk7XG5cdFx0XHRjb25zb2xlLmxvZyhcImRlc2lyZWQgd2lkdGg6IFwiICsgZGVzaXJlZHdpZHRoKTtcblx0XHRcdGNvbnNvbGUubG9nKFwibGluZWhlaWdodDogXCIgKyBhcHBkYXRhLmxpbmVoZWlnaHQpO1xuXG5cdC8vXHRcdGNvbnNvbGUubG9nKGxlbnN3aWR0aCArIFwiIFwiK2Rlc2lyZWR3aWR0aCk7XG5cdC8vXHRcdHZhciBwYWRkaW5nID0gKGxlbnN3aWR0aCAtIGRlc2lyZWR3aWR0aCkvMjtcblxuXHRcdFx0cGFkZGluZyA9ICgxMDAgLSBkZXNpcmVkd2lkdGgpLzI7XG5cdC8qXG5cdFx0XHRpZigoZGVzaXJlZHdpZHRoICsgMikgPiBsZW5zd2lkdGgpIHtcblx0XHRcdFx0YXBwZGF0YS5lbGVtZW50cy50ZXh0LnN0eWxlLnBhZGRpbmdMZWZ0ID0gXCIxdndcIjtcblx0XHRcdFx0YXBwZGF0YS5lbGVtZW50cy50ZXh0LnN0eWxlLnBhZGRpbmdSaWdodCA9IFwiMXZ3XCI7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQqL1xuXHRcdFx0YXBwZGF0YS5lbGVtZW50cy50ZXh0LnN0eWxlLnBhZGRpbmdMZWZ0ID0gcGFkZGluZytcInZ3XCI7XG5cdFx0XHRhcHBkYXRhLmVsZW1lbnRzLnRleHQuc3R5bGUucGFkZGluZ1JpZ2h0ID0gcGFkZGluZytcInZ3XCI7XG5cdC8vXHRcdH1cblx0XHR9XG5cblx0fSxcblx0aGlkZW5vdGVzOiBmdW5jdGlvbigpIHtcblx0XHRkb20ucmVtb3ZlYnlzZWxlY3RvcihcIi5ub3Rld2luZG93XCIpO1xuXHR9LFxuXHR1cGRhdGVzZXR0aW5nczogZnVuY3Rpb24oKSB7XG5cblx0Ly8gYWRkIGluIHRyYW5zbGF0aW9uIGNob29zZXJcblxuXHRcdGRvbS5yZW1vdmVieXNlbGVjdG9yKFwiI3RyYW5zbGF0b3JsaXN0XCIpO1xuXHRcdGxldCBpbnNlcnQgPSBkb20uY3JlYXRlKCc8dWwgaWQ9XCJ0cmFuc2xhdG9ybGlzdFwiPjwvdWw+Jyk7XG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0cmFuc2xhdGlvbmNob29zZVwiKS5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdGNvbnN0IHRyYW5zbGF0b3JsaXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiN0cmFuc2xhdG9ybGlzdFwiKTtcblx0XHRmb3IobGV0IGkgaW4gYXBwZGF0YS50cmFuc2xhdGlvbmRhdGEpIHtcblx0XHRcdGluc2VydCA9IGRvbS5jcmVhdGUoYDxsaT5cblx0XHRcdFx0XHQ8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJjaGVjay0ke2FwcGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWR9XCIgLz5cblx0XHRcdFx0XHQ8c3BhbiBpZD1cIiR7YXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZH1cIiA+JHthcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmZ1bGxuYW1lfTwvc3Bhbj5cblx0XHRcdFx0PC9saT5gKTtcblx0XHRcdHRyYW5zbGF0b3JsaXN0LmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNoZWNrLVwiK2FwcGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpLmNoZWNrZWQgPSAoYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YoYXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbaV0udHJhbnNsYXRpb25pZCkgPiAtMSk7XG5cdFx0fVxuXG5cdFx0Ly8gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIiN0cmFuc2xhdG9ybGlzdCBpbnB1dFt0eXBlPWNoZWNrYm94XVwiKS5mb3JFYWNoKGFwcC5oZWxwZXJzLmNoZWNrYm94Z28pO1xuXHRcdGZvcihsZXQgaSBvZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiI3RyYW5zbGF0b3JsaXN0IGlucHV0W3R5cGU9Y2hlY2tib3hdXCIpKSB7XG5cdFx0XHRhcHAuaGVscGVycy5jaGVja2JveGdvKGkpO1xuXHRcdH1cblx0XHQvLyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiI3RyYW5zbGF0b3JsaXN0IHNwYW5cIikuZm9yRWFjaChhcHAuaGVscGVycy5jaGVja2JveHNwYW5nbyk7XG5cdFx0Zm9yKGxldCBpIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIjdHJhbnNsYXRvcmxpc3Qgc3BhblwiKSkge1xuXHRcdFx0YXBwLmhlbHBlcnMuY2hlY2tib3hzcGFuZ28oaSk7XG5cdFx0fVxuXG5cdC8vIGFkZCBpbiB0b2NcblxuXHRcdGRvbS5yZW1vdmVieXNlbGVjdG9yKFwiI3NlbGVjdG9yc1wiKTtcblx0XHRpbnNlcnQgPSBkb20uY3JlYXRlKGA8ZGl2IGlkPVwic2VsZWN0b3JzXCI+XG5cdFx0XHRcdDxwPkNhbnRvOiA8c2VsZWN0IGlkPVwic2VsZWN0Y2FudG9cIj48L3NlbGVjdD48L3A+XG5cdFx0XHRcdDxwPlRyYW5zbGF0aW9uOiA8c2VsZWN0IGlkPVwic2VsZWN0dHJhbnNsYXRvclwiPjwvc2VsZWN0PjwvcD5cblx0XHRcdFx0PHA+PHNwYW4gaWQ9XCJzZWxlY3Rnb1wiPkdvPC9zcGFuPjwvcD5cblx0XHRcdDwvZGl2PmApO1xuXHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHJhbnNsYXRpb25nb1wiKS5hcHBlbmRDaGlsZChpbnNlcnQpO1xuXHRcdGZvcihsZXQgaSA9IDA7IGkgPCBhcHBkYXRhLmNhbnRvY291bnQ7IGkrKykge1xuXHRcdFx0aW5zZXJ0ID0gZG9tLmNyZWF0ZShgPG9wdGlvbiBpZD1cImNhbnRvJHtpfVwiICR7KChhcHBkYXRhLmN1cnJlbnRjYW50byA9PSBpKSA/IFwic2VsZWN0ZWRcIiA6IFwiXCIpfT4ke2FwcGRhdGEuY2FudG90aXRsZXNbaV19PC9vcHRpb24+YCk7XG5cdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdGNhbnRvXCIpLmFwcGVuZENoaWxkKGluc2VydCk7XG5cdFx0fVxuXHRcdGZvcihsZXQgaSBpbiBhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QpIHtcblx0XHRcdGZvcihsZXQgaiA9IDA7IGogPCBhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRpZihhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtqXS50cmFuc2xhdGlvbmlkID09IGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9ubGlzdFtpXSkge1xuXHRcdFx0XHRcdGluc2VydCA9IGRvbS5jcmVhdGUoYDxvcHRpb24gaWQ9XCJ0cl8ke2FwcGRhdGEudHJhbnNsYXRpb25kYXRhW2pdLnRyYW5zbGF0aW9uaWR9XCIgJHsoKGFwcGRhdGEuY3VycmVudHRyYW5zbGF0aW9uID09IGkpID8gXCJzZWxlY3RlZFwiIDogXCJcIil9PiR7YXBwZGF0YS50cmFuc2xhdGlvbmRhdGFbal0udHJhbnNsYXRpb25mdWxsbmFtZX08L29wdGlvbj5gKTtcblx0XHRcdFx0XHRkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNlbGVjdHRyYW5zbGF0b3JcIikuYXBwZW5kQ2hpbGQoaW5zZXJ0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjc2VsZWN0Z29cIikub25jbGljayA9ICgpID0+IHtcblx0XHRcdGxldCBzZWxlY3RlZCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0dHJhbnNsYXRvclwiKTtcblx0XHRcdGxldCB0aGlzdHJhbnMgPSBzZWxlY3RlZC5vcHRpb25zW3NlbGVjdGVkLnNlbGVjdGVkSW5kZXhdLmlkLnN1YnN0cigzKTtcblx0XHRcdHNlbGVjdGVkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZWxlY3RjYW50b1wiKTtcblx0XHRcdGxldCB0aGlzY2FudG8gPSBzZWxlY3RlZC5vcHRpb25zW3NlbGVjdGVkLnNlbGVjdGVkSW5kZXhdLmlkLnN1YnN0cig1KTtcblx0XHRcdGZvcihsZXQgaiA9IDA7IGogPCBhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YS5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRpZihhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3Rbal0gPT0gdGhpc3RyYW5zKSB7XG5cdFx0XHRcdFx0YXBwLnNldHBhZ2UoXCJsZW5zXCIpO1xuXHRcdFx0XHRcdGFwcC5zZXRsZW5zKGosdGhpc2NhbnRvLDApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblx0c2F2ZWN1cnJlbnRkYXRhOiBmdW5jdGlvbigpIHtcbi8vIHRoaXMgc2hvdWxkIHN0b3JlIGFwcGRhdGUgb24gbG9jYWxzdG9yYWdlIChkb2VzIHRoYXQgd29yayBmb3IgbW9iaWxlPylcblx0XHRjb25zb2xlLmxvZyhcIlN0b3JpbmcgcHJlZmVyZW5jZXMhIFRLXCIpO1xuXHR9LFxuXHRjaGFuZ2V0cmFuc2xhdGlvbjogZnVuY3Rpb24odGhpc2lkLCBpc3NldCkge1xuXHRcdGNvbnNvbGUubG9nKFwiY2hhbmdldHJhbnNsYXRpb24gZmlyZWQhXCIpO1xuXHRcdGZvcihsZXQgaSBpbiBhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YSkge1xuXHRcdFx0aWYodGhpc2lkID09IGFwcGRhdGEudHJhbnNsYXRpb25kYXRhW2ldLnRyYW5zbGF0aW9uaWQpIHtcblx0XHRcdFx0aWYoaXNzZXQpIHtcblx0XHRcdFx0XHRhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QucHVzaCh0aGlzaWQpO1xuXHRcdFx0XHRcdGFwcGRhdGEudHJhbnNsYXRpb25jb3VudCsrO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmKGFwcGRhdGEudHJhbnNsYXRpb25jb3VudCA+IDEpIHtcblx0XHRcdFx0XHRcdGxldCBqID0gYXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LmluZGV4T2YodGhpc2lkKTtcblx0XHRcdFx0XHRcdGlmIChqID4gLTEpIHtcblx0XHRcdFx0XHRcdFx0YXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0LnNwbGljZShqLCAxKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGFwcGRhdGEudHJhbnNsYXRpb25jb3VudC0tO1xuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHQvLyB0aGVyZSdzIG9ubHkgb25lIHRyYW5zbGF0aW9uIGluIHRoZSBsaXN0LCBkbyBub3QgZGVsZXRlIGxhc3Rcblx0XHRcdFx0XHRcdGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiY2hlY2stXCIrdGhpc2lkLnRvTG93ZXJDYXNlKCkpLmNoZWNrZWQgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0YXBwLnNhdmVjdXJyZW50ZGF0YSgpO1xuXHRcdH1cblxuXHRcdGxldCBuZXdsaXN0ID0gW107XG5cdFx0Zm9yKGxldCBpIGluIGFwcGRhdGEudHJhbnNsYXRpb25kYXRhKSB7XG5cdFx0XHRpZihhcHBkYXRhLmN1cnJlbnR0cmFuc2xhdGlvbmxpc3QuaW5kZXhPZihhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKSA+IC0xKSB7XG5cdFx0XHRcdG5ld2xpc3QucHVzaChhcHBkYXRhLnRyYW5zbGF0aW9uZGF0YVtpXS50cmFuc2xhdGlvbmlkKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0YXBwZGF0YS5jdXJyZW50dHJhbnNsYXRpb25saXN0ID0gbmV3bGlzdC5zbGljZSgpO1xuXHRcdC8vIGFsc28gd2hhdCBkbyB3ZSBkbyB3aGVuIG9uZSBpcyBkZWxldGVkP1xuXHRcdGFwcC51cGRhdGVzZXR0aW5ncygpO1xuXHR9LFxuXHRzZXRwYWdlOiBmdW5jdGlvbihuZXdwYWdlKSB7XG5cdFx0ZG9tLnJlbW92ZWNsYXNzKFwiLnBhZ2VcIixcIm9uXCIpO1xuXHRcdGRvbS5hZGRjbGFzcyhcIi5wYWdlI1wiK25ld3BhZ2UsXCJvblwiKTtcblx0XHRhcHBkYXRhLmN1cnJlbnRwYWdlID0gbmV3cGFnZTtcblx0XHRhcHAucmVzaXplKCk7XG5cdH0sXG5cdG9uRGV2aWNlUmVhZHk6IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUubG9nKFwiZGV2aWNlIHJlYWR5IVwiKTtcblx0XHRhcHAuc2V0dXAoKTtcblx0fSxcblx0c2V0dXA6IGZ1bmN0aW9uKCkge1xuXHRcdGFwcC5zZXR1cG5vdGVzKCk7XG5cdFx0YXBwLnNldHVwY29udHJvbHMoKTtcblx0XHRhcHAuc2V0cGFnZShcImxlbnNcIik7XG5cdH1cbn07XG5cbmFwcC5pbml0aWFsaXplKCk7XG5pZiAoISgnb25EZXZpY2VSZWFkeScgaW4gZG9jdW1lbnQpKSB7XG5cdGNvbnNvbGUubG9nKFwiUnVubmluZyBub24tQ29yZG92YSBjb2RlIVwiKTtcblx0YXBwLnNldHVwKCk7IC8vIChob3BlZnVsbHkgdGhpcyBkb2Vzbid0IGZpcmUgaW4gcmVhbCB2ZXJzaW9uPylcbn1cbiIsIi8vIGRvbS5qc1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgZG9tID0ge1xuXHRjcmVhdGU6IGZ1bmN0aW9uKGh0bWxTdHIpIHtcblx0XHR2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcblx0XHR2YXIgdGVtcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXHRcdHRlbXAuaW5uZXJIVE1MID0gaHRtbFN0cjtcblx0XHR3aGlsZSAodGVtcC5maXJzdENoaWxkKSB7XG5cdFx0XHRmcmFnLmFwcGVuZENoaWxkKHRlbXAuZmlyc3RDaGlsZCk7XG5cdFx0fVxuXHRcdHJldHVybiBmcmFnO1xuXHR9LFxuXHRyZW1vdmVieXNlbGVjdG9yOiBmdW5jdGlvbihzZWxlY3RvcnN0cmluZykge1xuXHRcdHZhciBzZWxlY3RvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3JzdHJpbmcpO1xuXHRcdGlmKHNlbGVjdG9yICE9PSBudWxsKSB7XG5cdFx0XHRzZWxlY3Rvci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHNlbGVjdG9yKTtcblx0XHR9XG5cdH0sXG5cdGFkZGNsYXNzOiBmdW5jdGlvbihzZWxlY3RvcnN0cmluZywgbXljbGFzcykge1xuXHRcdHZhciBteWVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yc3RyaW5nKTtcblx0XHRpZihteWNsYXNzLmluZGV4T2YoXCIgXCIpID4gLTEpIHtcblx0XHRcdHZhciBjbGFzc2VzID0gbXljbGFzcy5zcGxpdChcIiBcIik7XG5cdFx0XHRmb3IodmFyIGogPSAwOyBqIDwgY2xhc3Nlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRkb20uYWRkY2xhc3Moc2VsZWN0b3JzdHJpbmcsIGNsYXNzZXNbal0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG15ZWxlbWVudC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRteWVsZW1lbnRbaV0uY2xhc3NMaXN0LmFkZChteWNsYXNzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdHJlbW92ZWNsYXNzOiBmdW5jdGlvbihzZWxlY3RvcnN0cmluZywgbXljbGFzcykge1xuXHRcdHZhciBteWVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yc3RyaW5nKTtcblx0XHRpZihteWNsYXNzLmluZGV4T2YoXCIgXCIpID4gLTEpIHtcblx0XHRcdHZhciBjbGFzc2VzID0gbXljbGFzcy5zcGxpdChcIiBcIik7XG5cdFx0XHRmb3IodmFyIGogPSAwOyBqIDwgY2xhc3Nlcy5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRkb20ucmVtb3ZlY2xhc3Moc2VsZWN0b3JzdHJpbmcsIGNsYXNzZXNbal0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG15ZWxlbWVudC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHRteWVsZW1lbnRbaV0uY2xhc3NMaXN0LnJlbW92ZShteWNsYXNzKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cdGhhc2NsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbHMpIHtcblx0XHRyZXR1cm4gKCcgJyArIGVsZW1lbnQuY2xhc3NOYW1lICsgJyAnKS5pbmRleE9mKCcgJyArIGNscyArICcgJykgPiAtMTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBkb207XG4iLCIvLyBjYXJseWxlLmpzXG5cblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBjYXJseWxlID0gW2A8cCBjbGFzcz1cInRpdGxlXCI+SW5mZXJubzwvcD5cblx0PHAgY2xhc3M9XCJhdXRob3JcIj5Kb2huIEFpdGtlbiBDYXJseWxlLCBUaG9tYXMgT2tleSAmYW1wOyBQLiBILiBXaWtzdGVlZDwvcD5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNBTlRPIEk8L3A+XG5cdFx0PHAgY2xhc3M9XCJzdW1tYXJ5XCI+RGFudGUgZmluZHMgaGltc2VsZiBhc3RyYXkgaW4gYSBkYXJrIFdvb2QsIHdoZXJlIGhlIHNwZW5kcyBhIG5pZ2h0IG9mIGdyZWF0IG1pc2VyeS4gSGUgc2F5cyB0aGF0IGRlYXRoIGlzIGhhcmRseSBtb3JlIGJpdHRlciwgdGhhbiBpdCBpcyB0byByZWNhbGwgd2hhdCBoZSBzdWZmZXJlZCB0aGVyZTsgYnV0IHRoYXQgaGUgd2lsbCB0ZWxsIHRoZSBmZWFyZnVsIHRoaW5ncyBoZSBzYXcsIGluIG9yZGVyIHRoYXQgaGUgbWF5IGFsc28gdGVsbCBob3cgaGUgZm91bmQgZ3VpZGFuY2UsIGFuZCBmaXJzdCBiZWdhbiB0byBkaXNjZXJuIHRoZSByZWFsIGNhdXNlcyBvZiBhbGwgbWlzZXJ5LiBIZSBjb21lcyB0byBhIEhpbGw7IGFuZCBzZWVpbmcgaXRzIHN1bW1pdCBhbHJlYWR5IGJyaWdodCB3aXRoIHRoZSByYXlzIG9mIHRoZSBTdW4sIGhlIGJlZ2lucyB0byBhc2NlbmQgaXQuIFRoZSB3YXkgdG8gaXQgbG9va3MgcXVpdGUgZGVzZXJ0ZWQuIEhlIGlzIG1ldCBieSBhIGJlYXV0aWZ1bCBMZW9wYXJkLCB3aGljaCBrZWVwcyBkaXN0cmFjdGluZyBoaXMgYXR0ZW50aW9uIGZyb20gdGhlIEhpbGwsIGFuZCBtYWtlcyBoaW0gdHVybiBiYWNrIHNldmVyYWwgdGltZXMuIFRoZSBob3VyIG9mIHRoZSBtb3JuaW5nLCB0aGUgc2Vhc29uLCBhbmQgdGhlIGdheSBvdXR3YXJkIGFzcGVjdCBvZiB0aGF0IGFuaW1hbCwgZ2l2ZSBoaW0gZ29vZCBob3BlcyBhdCBmaXJzdDsgYnV0IGhlIGlzIGRyaXZlbiBkb3duIGFuZCB0ZXJyaWZpZWQgYnkgYSBMaW9uIGFuZCBhIFNoZS13b2xmLiBWaXJnaWwgY29tZXMgdG8gaGlzIGFpZCwgYW5kIHRlbGxzIGhpbSB0aGF0IHRoZSBXb2xmIGxldHMgbm9uZSBwYXNzIGhlciB3YXksIGJ1dCBlbnRhbmdsZXMgYW5kIHNsYXlzIGV2ZXJ5IG9uZSB0aGF0IHRyaWVzIHRvIGdldCB1cCB0aGUgbW91bnRhaW4gYnkgdGhlIHJvYWQgb24gd2hpY2ggc2hlIHN0YW5kcy4gSGUgc2F5cyBhIHRpbWUgd2lsbCBjb21lIHdoZW4gYSBzd2lmdCBhbmQgc3Ryb25nIEdyZXlob3VuZCBzaGFsbCBjbGVhciB0aGUgZWFydGggb2YgaGVyLCBhbmQgY2hhc2UgaGVyIGludG8gSGVsbC4gQW5kIGhlIG9mZmVycyB0byBjb25kdWN0IERhbnRlIGJ5IGFub3RoZXIgcm9hZDsgdG8gc2hvdyBoaW0gdGhlIGV0ZXJuYWwgcm9vdHMgb2YgbWlzZXJ5IGFuZCBvZiBqb3ksIGFuZCBsZWF2ZSBoaW0gd2l0aCBhIGhpZ2hlciBndWlkZSB0aGF0IHdpbGwgbGVhZCBoaW0gdXAgdG8gSGVhdmVuLjwvcD5cblx0XHQ8cD5JbiB0aGUgbWlkZGxlIG9mIHRoZSBqb3VybmV5IG9mIG91ciBsaWZlXG5cdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVcIj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4xPC9zcGFuPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VGhlIFZpc2lvbiB0YWtlcyBwbGFjZSBhdCBFYXN0ZXJ0aWRlIG9mIHRoZSB5ZWFyIDEzMDAsIHRoYXQgaXMgdG8gc2F5LCB3aGVuIERhbnRlIHdhcyB0aGlydHktZml2ZSB5ZWFycyBvbGQuIDxlbT5DZi48L2VtPiA8ZW0+UHNhbG1zPC9lbT4geGMuIDEwOiAmbGRxdW87VGhlIGRheXMgb2Ygb3VyIHllYXJzIGFyZSB0aHJlZXNjb3JlIHllYXJzIGFuZCB0ZW4uJnJkcXVvOyBTZWUgYWxzbyA8ZW0+Q29udml0bzwvZW0+IGl2OiAmbGRxdW87V2hlcmUgdGhlIHRvcCBvZiB0aGlzIGFyY2ggb2YgbGlmZSBtYXkgYmUsIGl0IGlzIGRpZmZpY3VsdCB0byBrbm93LiZuYnNwOy4mbmJzcDsuJm5ic3A7LiBJIGJlbGlldmUgdGhhdCBpbiB0aGUgcGVyZmVjdGx5IG5hdHVyYWwgbWFuLCBpdCBpcyBhdCB0aGUgdGhpcnR5LWZpZnRoIHllYXIuJnJkcXVvOzwvc3Bhbj5cblx0XHQ8L3NwYW4+XG5cdFx0SSBjYW1lIHRvIG15c2VsZiBpbiBhIGRhcmsgd29vZFxuXHRcdFx0PHNwYW4gY2xhc3M9XCJub3RlXCI+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Mjwvc3Bhbj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPjxlbT5DZi48L2VtPiA8ZW0+Q29udml0bzwvZW0+IGl2OiAmbGRxdW87LiZuYnNwOy4mbmJzcDsuJm5ic3A7dGhlIGFkb2xlc2NlbnQgd2hvIHdlbnRlcnMgaW50byB0aGUgV29vZCBvZiBFcnJvciBvZiB0aGlzIGxpZmUgd291bGQgbm90IGtub3cgaG93IHRvIGtlZXAgdG8gdGhlIGdvb2QgcGF0aCBpZiBpdCB3ZXJlIG5vdCBwb2ludGVkIG91dCB0byBoaW0gYnkgaGlzIGVsZGVycy4mcmRxdW87IDxlbT5Qb2xpdGljYWxseTwvZW0+OiB0aGUgPGVtPndvb2Q8L2VtPiBzdGFuZHMgZm9yIHRoZSB0cm91YmxlZCBzdGF0ZSBvZiBJdGFseSBpbiBEYW50ZSZyc3F1bztzIHRpbWUuPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdHdoZXJlIHRoZSBzdHJhaWdodCB3YXkgd2FzIGxvc3QuPC9wPlxuXHRcdDxwPkFoISBob3cgaGFyZCBhIHRoaW5nIGl0IGlzIHRvIHRlbGwgd2hhdCBhIHdpbGQsIGFuZCByb3VnaCwgYW5kIHN0dWJib3JuIHdvb2QgdGhpcyB3YXMsIHdoaWNoIGluIG15IHRob3VnaHQgcmVuZXdzIHRoZSBmZWFyITwvcD5cblx0XHQ8cD5TbyBiaXR0ZXIgaXMgaXQsIHRoYXQgc2NhcnNlbHkgbW9yZSBpcyBkZWF0aDogYnV0IHRvIHRyZWF0IG9mIHRoZSBnb29kIHRoYXQgdGhlcmUgSSBmb3VuZCwgSSB3aWxsIHJlbGF0ZSB0aGUgb3RoZXIgdGhpbmdzIHRoYXQgSSBkaXNjZXJuZWQuPC9wPlxuXHRcdDxwPkkgY2Fubm90IHJpZ2h0bHkgdGVsbCBob3cgSSBlbnRlcmVkIGl0LCBzbyBmdWxsIG9mIHNsZWVwIHdhcyBJIGFib3V0IHRoZSBtb21lbnQgdGhhdCBJIGxlZnQgdGhlIHRydWUgd2F5LjwvcD5cblx0XHQ8cD5CdXQgYWZ0ZXIgSSBoYWQgcmVhY2hlZCB0aGUgZm9vdCBvZiBhIEhpbGxcblx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZVwiPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVub1wiPjM8L3NwYW4+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5UaGUgJmxkcXVvO2hvbHkgSGlsbCZyZHF1bzsgb2YgdGhlIEJpYmxlOyBCdW55YW4mcnNxdW87cyAmbGRxdW87RGVsZWN0YWJsZSBNb3VudGFpbnMuJnJkcXVvOzwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHR0aGVyZSwgd2hlcmUgdGhhdCB2YWxsZXkgZW5kZWQsIHdoaWNoIGhhZCBwaWVyY2VkIG15IGhlYXJ0IHdpdGggZmVhciw8L3A+XG5cdFx0PHA+SSBsb29rZWQgdXAgYW5kIHNhdyBpdHMgc2hvdWxkZXJzIGFscmVhZHkgY2xvdGhlZCB3aXRoIHRoZSByYXlzIG9mIHRoZSBQbGFuZXRcblx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZVwiPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVub1wiPjQ8L3NwYW4+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj48ZW0+UGxhbmV0PC9lbT4sIHRoZSBzdW4sIHdoaWNoIHdhcyBhIHBsYW5ldCBhY2NvcmRpbmcgdG8gdGhlIFB0b2xlbWFpYyBzeXN0ZW0uIERhbnRlIHNwZWFrcyBlbHNld2hlcmUgKDxlbT5Db252LjwvZW0+IGl2KSBvZiB0aGUgJmxkcXVvO3NwaXJpdHVhbCBTdW4sIHdoaWNoIGlzIEdvZC4mcmRxdW87PC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdHRoYXQgbGVhZHMgbWVuIHN0cmFpZ2h0IG9uIGV2ZXJ5IHJvYWQuPC9wPlxuXHRcdDxwPlRoZW4gdGhlIGZlYXIgd2FzIHNvbWV3aGF0IGNhbG1lZCwgd2hpY2ggaGFkIGNvbnRpbnVlZCBpbiB0aGUgbGFrZSBvZiBteSBoZWFydCB0aGUgbmlnaHQgdGhhdCBJIHBhc3NlZCBzbyBwaXRlb3VzbHkuPC9wPlxuXHRcdDxwPkFuZCBhcyBoZSwgd2hvIHdpdGggcGFudGluZyBicmVhdGggaGFzIGVzY2FwZWQgZnJvbSB0aGUgZGVlcCBzZWEgdG8gdGhlIHNob3JlLCB0dXJucyB0byB0aGUgZGFuZ2Vyb3VzIHdhdGVyIGFuZCBnYXplczo8L3A+XG5cdFx0PHA+c28gbXkgbWluZCwgd2hpY2ggc3RpbGwgd2FzIGZsZWVpbmcsIHR1cm5lZCBiYWNrIHRvIHNlZSB0aGUgcGFzcyB0aGF0IG5vIG9uZSBldmVyIGxlZnQgYWxpdmUuPC9wPlxuXHRcdDxwPkFmdGVyIEkgaGFkIHJlc3RlZCBteSB3ZWFyaWVkIGJvZHkgYSBzaG9ydCB3aGlsZSwgSSB0b29rIHRoZSB3YXkgYWdhaW4gYWxvbmcgdGhlIGRlc2VydCBzdHJhbmQsIHNvIHRoYXQgdGhlIHJpZ2h0IGZvb3QgYWx3YXlzIHdhcyB0aGUgbG93ZXIuXG5cdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVcIj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj41PC9zcGFuPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+QW55IG9uZSB3aG8gaXMgYXNjZW5kaW5nIGEgaGlsbCwgYW5kIHdob3NlIGxlZnQgZm9vdCBpcyBhbHdheXMgdGhlIGxvd2VyLCBtdXN0IGJlIGJlYXJpbmcgdG8gdGhlIDxlbT5yaWdodDwvZW0+Ljwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHQ8L3A+XG5cdFx0PHA+QW5kIGJlaG9sZCwgYWxtb3N0IGF0IHRoZSBjb21tZW5jZW1lbnQgb2YgdGhlIHN0ZWVwLCBhIExlb3BhcmQsXG5cdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVcIj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj42PC9zcGFuPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+V29ybGRseSBQbGVhc3VyZTsgPGVtPnBvbGl0aWNhbGx5PC9lbT46IEZsb3JlbmNlLjwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHRsaWdodCBhbmQgdmVyeSBuaW1ibGUsIHdoaWNoIHdhcyBjb3ZlcmVkIHdpdGggc3BvdHRlZCBoYWlyLjwvcD5cblx0XHQ8cD5BbmQgaXQgd2VudCBub3QgZnJvbSBiZWZvcmUgbXkgZmFjZTsgbmF5LCBzbyBpbXBlZGVkIG15IHdheSwgdGhhdCBJIGhhZCBvZnRlbiB0dXJuZWQgdG8gZ28gYmFjay48L3A+XG5cdFx0PHA+VGhlIHRpbWUgd2FzIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1vcm5pbmc7IGFuZCB0aGUgc3VuIHdhcyBtb3VudGluZyB1cCB3aXRoIHRob3NlIHN0YXJzLFxuXHRcdFx0PHNwYW4gY2xhc3M9XCJub3RlXCI+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Nzwvc3Bhbj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPkFjY29yZGluZyB0byB0cmFkaXRpb24sIHRoZSBzdW4gd2FzIGluIEFyaWVzIGF0IHRoZSB0aW1lIG9mIHRoZSBDcmVhdGlvbi48L3NwYW4+XG5cdFx0XHQ8L3NwYW4+XG5cdFx0d2hpY2ggd2VyZSB3aXRoIGhpbSB3aGVuIERpdmluZSBMb3ZlPC9wPlxuXHRcdDxwPmZpcnN0IG1vdmVkIHRob3NlIGZhaXIgdGhpbmdzOiBzbyB0aGF0IHRoZSBob3VyIG9mIHRpbWUgYW5kIHRoZSBzd2VldCBzZWFzb24gY2F1c2VkIG1lIHRvIGhhdmUgZ29vZCBob3BlPC9wPlxuXHRcdDxwPm9mIHRoYXQgYW5pbWFsIHdpdGggdGhlIGdheSBza2luOyB5ZXQgbm90IHNvLCBidXQgdGhhdCBJIGZlYXJlZCBhdCB0aGUgc2lnaHQsIHdoaWNoIGFwcGVhcmVkIHRvIG1lLCBvZiBhIExpb24uXG5cdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVcIj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj44PC9zcGFuPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+QW1iaXRpb247IDxlbT5wb2xpdGljYWxseTwvZW0+OiB0aGUgUm95YWwgSG91c2Ugb2YgRnJhbmNlLjwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHQ8L3A+XG5cdFx0PHA+SGUgc2VlbWVkIGNvbWluZyB1cG9uIG1lIHdpdGggaGVhZCBlcmVjdCwgYW5kIGZ1cmlvdXMgaHVuZ2VyOyBzbyB0aGF0IHRoZSBhaXIgc2VlbWVkIHRvIGhhdmUgZmVhciB0aGVyZWF0OzwvcD5cblx0XHQ8cD5hbmQgYSBTaGUtd29sZixcblx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZVwiPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVub1wiPjk8L3NwYW4+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj48ZW0+QXZhcmljZTwvZW0+OyA8ZW0+cG9saXRpY2FsbHk8L2VtPjogdGhlIFBhcGFsIFNlZS4gVGhlIHRocmVlIGJlYXN0cyBhcmUgb2J2aW91c2x5IHRha2VuIGZyb20gPGVtPkplcmVtaWFoPC9lbT4gdi4mbmJzcDs2Ljwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHR0aGF0IGxvb2tlZCBmdWxsIG9mIGFsbCBjcmF2aW5ncyBpbiBoZXIgbGVhbm5lc3M7IGFuZCBoYXMgZXJlIG5vdyBtYWRlIG1hbnkgbGl2ZSBpbiBzb3Jyb3cuPC9wPlxuXHRcdDxwPlNoZSBicm91Z2h0IHN1Y2ggaGVhdmluZXNzIHVwb24gbWUgd2l0aCB0aGUgdGVycm9yIG9mIGhlciBhc3BlY3QsIHRoYXQgSSBsb3N0IHRoZSBob3BlIG9mIGFzY2VuZGluZy48L3A+XG5cdFx0PHA+QW5kIGFzIG9uZSB3aG8gaXMgZWFnZXIgaW4gZ2FpbmluZywgYW5kLCB3aGVuIHRoZSB0aW1lIGFycml2ZXMgdGhhdCBtYWtlcyBoaW0gbG9zZSwgd2VlcHMgYW5kIGFmZmxpY3RzIGhpbXNlbGYgaW4gYWxsIGhpcyB0aG91Z2h0czo8L3A+XG5cdFx0PHA+c3VjaCB0aGF0IHJlc3RsZXNzIGJlYXN0IG1hZGUgbWUsIHdoaWNoIGNvbWluZyBhZ2FpbnN0IG1lLCBieSBsaXR0bGUgYW5kIGxpdHRsZSBkcm92ZSBtZSBiYWNrIHRvIHdoZXJlIHRoZSBTdW4gaXMgc2lsZW50LjwvcD5cblx0XHQ8cD5XaGlsc3QgSSB3YXMgcnVzaGluZyBkb3dud2FyZHMsIHRoZXJlIGFwcGVhcmVkIGJlZm9yZSBteSBleWVzIG9uZVxuXHRcdFx0PHNwYW4gY2xhc3M9XCJub3RlXCI+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZW5vXCI+MTA8L3NwYW4+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5WaXJnaWwsIHdobyBzdGFuZHMgZm9yIFdvcmxkbHkgV2lzZG9tLCBhbmQgaXMgRGFudGUmcnNxdW87cyBndWlkZSB0aHJvdWdoIEhlbGwgYW5kIFB1cmdhdG9yeSAoc2VlIEdhcmRuZXIsIHBwLiA4NywgODgpLjxiciAvPjxiciAvPjxlbT5ob2Fyc2U8L2VtPiwgcGVyaGFwcyBiZWNhdXNlIHRoZSBzdHVkeSBvZiBWaXJnaWwgaGFkIGJlZW4gbG9uZyBuZWdsZWN0ZWQ8L3NwYW4+XG5cdFx0XHQ8L3NwYW4+XG5cdFx0d2hvIHNlZW1lZCBob2Fyc2UgZnJvbSBsb25nIHNpbGVuY2UuPC9wPlxuXHRcdDxwPldoZW4gSSBzYXcgaGltIGluIHRoZSBncmVhdCBkZXNlcnQsIEkgY3JpZWQ6ICZsZHF1bztIYXZlIHBpdHkgb24gbWUsIHdoYXRlJnJzcXVvO2VyIHRob3UgYmUsIHdoZXRoZXIgc2hhZGUgb3IgdmVyaXRhYmxlIG1hbiEmcmRxdW87PC9wPlxuXHRcdDxwPkhlIGFuc3dlcmVkIG1lOiAmbGRxdW87Tm90IG1hbiwgYSBtYW4gSSBvbmNlIHdhczsgYW5kIG15IHBhcmVudHMgd2VyZSBMb21iYXJkcywgYW5kIGJvdGggb2YgTWFudHVhIGJ5IGNvdW50cnkuPC9wPlxuXHRcdDxwPlRLITwvcD5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNBTlRPIElJPC9wPlxuXHRcdDxwIGNsYXNzPVwic3VtbWFyeVwiPkVuZCBvZiB0aGUgZmlyc3QgZGF5LiBCcmllZiBJbnZvY2F0aW9uLiBEYW5ldCBpcyBkaXNjb3VyYWdlZCBhdCB0aGUgb3V0c2V0LCB3aGVuIGhlIGJlZ2lucyBzZXJpb3VzbHkgdG8gcmVmbGVjdCB1cG9uIHdoYXQgaGUgaGFzIHVuZGVydGFrZW4uIFRoYXQgdmVyeSBkYXksIGhpcyBvd24gc3RyZW5ndGggaGFkIG1pc2VyYWJseSBmYWlsZWQgYmVmb3JlIHRoZSBMaW9uIGFuZCB0aGUgU2hlLVdvbGYuIEhlIGJpZHMgVmlyZ2lsIGNvbnNpZGVyIHdlbGwgd2hldGhlciB0aGVyZSBiZSBzdWZmaWNpZW50IHZpcnR1ZSBpbiBoaW0sIGJlZm9yZSBjb21taXR0aW5nIGhpbSB0byBzbyBkcmVhZGZ1bCBhIHBhc3NhZ2UuIEhlIHJlY2FsbHMgdGhlIGdyZWF0IGVycmFuZHMgb2YgJkFFbGlnO25lYXMgYW5kIG9mIFBhdWwsIGFuZCB0aGUgZ3JlYXQgcmVzdWx0cyBvZiB0aGVpciBnb2luZyB0byB0aGUgaW1tb3J0YWwgd29ybGQ7IGFuZCBjb21wYXJpbmcgaGltc2VsZiB3aXRoIHRoZW0sIGhlIGZlZWxzIGhpcyBoZWFydCBxdWFpbCwgYW5kIGlzIHJlYWR5IHRvIHR1cm4gYmFjay4gVmlyZ2lsIGRpc2Nlcm5zIHRoZSBmZWFyIHRoYXQgaGFzIGNvbWUgb3ZlciBoaW07IGFuZCBpbiBvcmRlciB0byByZW1vdmUgaXQsIHRlbGxzIGhpbSBob3cgYSBibGVzc2VkIFNwaXJpdCBoYXMgZGVzY2VuZGVkIGZyb20gSGVhdmVuIGV4cHJlc3NseSB0byBjb21tYW5kIHRoZSBqb3VybmV5LiBPbiBoZWFyaW5nIHRoaXMsIERhbnRlIGltbWVkaWF0ZWx5IGNhc3RzIG9mZiBwdXNpbGxhbmltaXR5LCBhbmQgYXQgb25jZSBhY2NlcHRzIHRoZSBGcmVlZG9tIGFuZCB0aGUgTWlzc2lvbiB0aGF0IGFyZSBnaXZlbiBoaW0uPC9wPlxuXHRcdDxwPlRLITwvcD5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkNBTlRPIElJSTwvcD5cblx0XHQ8cCBjbGFzcz1cInN1bW1hcnlcIj5JbnNjcmlwdGlvbiBvdmVyIHRoZSBHYXRlIG9mIEhlbGwsIGFuZCB0aGUgaW1wcmVzc2lvbiBpdCBwcm9kdWNlcyB1cG9uIERhbnRlLiBWaXJnaWwgdGFrZXMgaGltIGJ5IHRoZSBoYW5kLCBhbmQgbGVhZHMgaGltIGluLiBUaGUgZGlzbWFsIHNvdW5kcyBtYWtlIGhpbSBidXJzdCBpbnRvIHRlYXJzLiBIaXMgaGVhZCBpcyBxdWl0ZSBiZXdpbGRlcmVkLiBVcG9uIGEgRGFyayBQbGFpbiwgd2hpY2ggZ29lcyBhcm91bmQgdGhlIGNvbmZpbmVzLCBoZSBzZWVzIGEgdmFzdCBtdWx0aXR1ZGUgb2Ygc3Bpcml0cyBydW5uaW5nIGJlaGluZCBhIGZsYWcgaW4gZ3JlYXQgaGFzdGUgYW5kIGNvbmZ1c2lvbiwgdXJnZWQgb24gYnkgZnVyaW91cyB3YXNwcyBhbmQgaG9ybmV0cy4gVGhlc2UgYXJlIHRoZSB1bmhhcHB5IHBlb3BsZSwgd2hvIG5ldmVyIHdlcmUgYWxpdmUmbWRhc2g7bmV2ZXIgYXdha2VuZWQgdG8gdGFrZSBhbnkgcGFydCBpbiBlaXRoZXIgZ29vZCBvciBldmlsLCB0byBjYXJlIGZvciBhbnl0aGluZyBidXQgdGhlbXNlbHZlcy4gVGhleSBhcmUgbWl4ZWQgd2l0aCBhIHNpbWlsYXIgY2xhc3Mgb2YgZmFsbGVuIGFuZ2Vscy4gQWZ0ZXIgcGFzc2luZyB0aHJvdWdoIHRoZSBjcm93ZCBvZiB0aGVtLCB0aGUgUG9ldHMgY29tZSB0byBhIGdyZWF0IFJpdmVyLCB3aGljaCBmbG93cyByb3VuZCB0aGUgYnJpbSBvZiBIZWxsOyBhbmQgdGhlbiBkZXNjZW5kcyB0byBmb3JtIHRoZSBvdGhlciByaXZlcnMsIHRoZSBtYXJzaGVzLCBhbmQgdGhlIGljZSB0aGF0IHdlIHNoYWxsIG1lZXQgd2l0aC4gSXQgaXMgdGhlIHJpdmVyIEFjaGVyb247IGFuZCBvbiBpdHMgU2hvcmUgYWxsIHRoYXQgZGllIHVuZGVyIHRoZSB3cmF0aCBvZiBHb2QgYXNzZW1ibGUgZnJvbSBldmVyeSBjb3VudHJ5IHRvIGJlIGZlcnJpZWQgb3ZlciBieSB0aGUgZGVtb24gQ2hhcm9uLiBIZSBtYWtlcyB0aGVtIGVudGVyIGhpcyBib2F0IGJ5IGdsYXJpbmcgb24gdGhlbSB3aXRoIGhpcyBidXJuaW5nIGV5ZXMuIEhhdmluZyBzZWVuIHRoZXNlLCBhbmQgYmVpbmcgcmVmdXNlZCBhIHBhc3NhZ2UgYnkgQ2hhcm9uLCBEYW50ZSBpcyBzdWRkZW5seSBzdHVubmVkIGJ5IGEgdmlvbGVudCB0cmVtYmxpbmcgb2YgdGhlIGdyb3VuZCwgYWNjb21wYW5pZWQgd2l0aCB3aW5kIGFuZCBsaWdodG5pbmcsIGFuZCBmYWxscyBkb3duIGluIGEgc3RhdGUgb2YgaW5zZW5zaWJpbGl0eS48L3A+XG5cdFx0PHA+VEshPC9wPmBdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNhcmx5bGU7XG4iLCIvLyBpdGFsaWFuLmpzXG5cblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBpdGFsaWFuID0gW2A8cCBjbGFzcz1cInRpdGxlXCI+SW5mZXJubzwvcD5cblx0PHAgY2xhc3M9XCJhdXRob3JcIj5EYW50ZSBBbGlnaGllcmk8L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj4xPC9wPlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPk5lbCBtZXp6byBkZWwgY2FtbWluIGRpIG5vc3RyYSB2aXRhPC9wPlxuXHRcdFx0PHA+bWkgcml0cm92YWkgcGVyIHVuYSBzZWx2YSBvc2N1cmEsPC9wPlxuXHRcdFx0PHA+Y2gmZWFjdXRlOyBsYSBkaXJpdHRhIHZpYSBlcmEgc21hcnJpdGEuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkFoaSBxdWFudG8gYSBkaXIgcXVhbCBlcmEgJmVncmF2ZTsgY29zYSBkdXJhPC9wPlxuXHRcdFx0PHA+ZXN0YSBzZWx2YSBzZWx2YWdnaWEgZSBhc3ByYSBlIGZvcnRlPC9wPlxuXHRcdFx0PHA+Y2hlIG5lbCBwZW5zaWVyIHJpbm92YSBsYSBwYXVyYSE8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+VGFudCZyc3F1bzsgJmVncmF2ZTsgYW1hcmEgY2hlIHBvY28gJmVncmF2ZTsgcGkmdWdyYXZlOyBtb3J0ZTs8L3A+XG5cdFx0XHQ8cD5tYSBwZXIgdHJhdHRhciBkZWwgYmVuIGNoJnJzcXVvO2kmcnNxdW87IHZpIHRyb3ZhaSw8L3A+XG5cdFx0XHQ8cD5kaXImb2dyYXZlOyBkZSBsJnJzcXVvO2FsdHJlIGNvc2UgY2gmcnNxdW87aSZyc3F1bzsgdiZyc3F1bztobyBzY29ydGUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPklvIG5vbiBzbyBiZW4gcmlkaXIgY29tJnJzcXVvOyBpJnJzcXVvOyB2JnJzcXVvO2ludHJhaSw8L3A+XG5cdFx0XHQ8cD50YW50JnJzcXVvOyBlcmEgcGllbiBkaSBzb25ubyBhIHF1ZWwgcHVudG88L3A+XG5cdFx0XHQ8cD5jaGUgbGEgdmVyYWNlIHZpYSBhYmJhbmRvbmFpLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5NYSBwb2kgY2gmcnNxdW87aSZyc3F1bzsgZnVpIGFsIHBpJmVncmF2ZTsgZCZyc3F1bzt1biBjb2xsZSBnaXVudG8sPC9wPlxuXHRcdFx0PHA+bCZhZ3JhdmU7IGRvdmUgdGVybWluYXZhIHF1ZWxsYSB2YWxsZTwvcD5cblx0XHRcdDxwPmNoZSBtJnJzcXVvO2F2ZWEgZGkgcGF1cmEgaWwgY29yIGNvbXB1bnRvLDwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5ndWFyZGFpIGluIGFsdG8gZSB2aWRpIGxlIHN1ZSBzcGFsbGU8L3A+XG5cdFx0XHQ8cD52ZXN0aXRlIGdpJmFncmF2ZTsgZGUmcnNxdW87IHJhZ2dpIGRlbCBwaWFuZXRhPC9wPlxuXHRcdFx0PHA+Y2hlIG1lbmEgZHJpdHRvIGFsdHJ1aSBwZXIgb2duZSBjYWxsZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+QWxsb3IgZnUgbGEgcGF1cmEgdW4gcG9jbyBxdWV0YSw8L3A+XG5cdFx0XHQ8cD5jaGUgbmVsIGxhZ28gZGVsIGNvciBtJnJzcXVvO2VyYSBkdXJhdGE8L3A+XG5cdFx0XHQ8cD5sYSBub3R0ZSBjaCZyc3F1bztpJnJzcXVvOyBwYXNzYWkgY29uIHRhbnRhIHBpZXRhLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FIGNvbWUgcXVlaSBjaGUgY29uIGxlbmEgYWZmYW5uYXRhLDwvcD5cblx0XHRcdDxwPnVzY2l0byBmdW9yIGRlbCBwZWxhZ28gYSBsYSByaXZhLDwvcD5cblx0XHRcdDxwPnNpIHZvbGdlIGEgbCZyc3F1bzthY3F1YSBwZXJpZ2xpb3NhIGUgZ3VhdGEsPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPmNvcyZpZ3JhdmU7IGwmcnNxdW87YW5pbW8gbWlvLCBjaCZyc3F1bzthbmNvciBmdWdnaXZhLDwvcD5cblx0XHRcdDxwPnNpIHZvbHNlIGEgcmV0cm8gYSByaW1pcmFyIGxvIHBhc3NvPC9wPlxuXHRcdFx0PHA+Y2hlIG5vbiBsYXNjaSZvZ3JhdmU7IGdpJmFncmF2ZTsgbWFpIHBlcnNvbmEgdml2YS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UG9pIGNoJnJzcXVvOyZlZ3JhdmU7aSBwb3NhdG8gdW4gcG9jbyBpbCBjb3JwbyBsYXNzbyw8L3A+XG5cdFx0XHQ8cD5yaXByZXNpIHZpYSBwZXIgbGEgcGlhZ2dpYSBkaXNlcnRhLDwvcD5cblx0XHRcdDxwPnMmaWdyYXZlOyBjaGUgJnJzcXVvO2wgcGkmZWdyYXZlOyBmZXJtbyBzZW1wcmUgZXJhICZyc3F1bztsIHBpJnVncmF2ZTsgYmFzc28uPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkVkIGVjY28sIHF1YXNpIGFsIGNvbWluY2lhciBkZSBsJnJzcXVvO2VydGEsPC9wPlxuXHRcdFx0PHA+dW5hIGxvbnphIGxlZ2dlcmEgZSBwcmVzdGEgbW9sdG8sPC9wPlxuXHRcdFx0PHA+Y2hlIGRpIHBlbCBtYWNvbGF0byBlcmEgY292ZXJ0YTs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+ZSBub24gbWkgc2kgcGFydGlhIGRpbmFuemkgYWwgdm9sdG8sPC9wPlxuXHRcdFx0PHA+YW56aSAmcnNxdW87bXBlZGl2YSB0YW50byBpbCBtaW8gY2FtbWlubyw8L3A+XG5cdFx0XHQ8cD5jaCZyc3F1bztpJnJzcXVvOyBmdWkgcGVyIHJpdG9ybmFyIHBpJnVncmF2ZTsgdm9sdGUgdiZvZ3JhdmU7bHRvLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5UZW1wJnJzcXVvOyBlcmEgZGFsIHByaW5jaXBpbyBkZWwgbWF0dGlubyw8L3A+XG5cdFx0XHQ8cD5lICZyc3F1bztsIHNvbCBtb250YXZhICZyc3F1bztuIHMmdWdyYXZlOyBjb24gcXVlbGxlIHN0ZWxsZTwvcD5cblx0XHRcdDxwPmNoJnJzcXVvO2VyYW4gY29uIGx1aSBxdWFuZG8gbCZyc3F1bzthbW9yIGRpdmlubzwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5tb3NzZSBkaSBwcmltYSBxdWVsbGUgY29zZSBiZWxsZTs8L3A+XG5cdFx0XHQ8cD5zJmlncmF2ZTsgY2gmcnNxdW87YSBiZW5lIHNwZXJhciBtJnJzcXVvO2VyYSBjYWdpb25lPC9wPlxuXHRcdFx0PHA+ZGkgcXVlbGxhIGZpZXJhIGEgbGEgZ2FldHRhIHBlbGxlPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPmwmcnNxdW87b3JhIGRlbCB0ZW1wbyBlIGxhIGRvbGNlIHN0YWdpb25lOzwvcD5cblx0XHRcdDxwPm1hIG5vbiBzJmlncmF2ZTsgY2hlIHBhdXJhIG5vbiBtaSBkZXNzZTwvcD5cblx0XHRcdDxwPmxhIHZpc3RhIGNoZSBtJnJzcXVvO2FwcGFydmUgZCZyc3F1bzt1biBsZW9uZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVlc3RpIHBhcmVhIGNoZSBjb250cmEgbWUgdmVuaXNzZTwvcD5cblx0XHRcdDxwPmNvbiBsYSB0ZXN0JnJzcXVvOyBhbHRhIGUgY29uIHJhYmJpb3NhIGZhbWUsPC9wPlxuXHRcdFx0PHA+cyZpZ3JhdmU7IGNoZSBwYXJlYSBjaGUgbCZyc3F1bzthZXJlIG5lIHRyZW1lc3NlLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FZCB1bmEgbHVwYSwgY2hlIGRpIHR1dHRlIGJyYW1lPC9wPlxuXHRcdFx0PHA+c2VtYmlhdmEgY2FyY2EgbmUgbGEgc3VhIG1hZ3JlenphLDwvcD5cblx0XHRcdDxwPmUgbW9sdGUgZ2VudGkgZiZlYWN1dGU7IGdpJmFncmF2ZTsgdml2ZXIgZ3JhbWUsPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPnF1ZXN0YSBtaSBwb3JzZSB0YW50byBkaSBncmF2ZXp6YTwvcD5cblx0XHRcdDxwPmNvbiBsYSBwYXVyYSBjaCZyc3F1bzt1c2NpYSBkaSBzdWEgdmlzdGEsPC9wPlxuXHRcdFx0PHA+Y2gmcnNxdW87aW8gcGVyZGVpIGxhIHNwZXJhbnphIGRlIGwmcnNxdW87YWx0ZXp6YS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RSBxdWFsICZlZ3JhdmU7IHF1ZWkgY2hlIHZvbG9udGllcmkgYWNxdWlzdGEsPC9wPlxuXHRcdFx0PHA+ZSBnaXVnbmUgJnJzcXVvO2wgdGVtcG8gY2hlIHBlcmRlciBsbyBmYWNlLDwvcD5cblx0XHRcdDxwPmNoZSAmcnNxdW87biB0dXR0aSBzdW9pIHBlbnNpZXIgcGlhbmdlIGUgcyZyc3F1bzthdHRyaXN0YTs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+dGFsIG1pIGZlY2UgbGEgYmVzdGlhIHNhbnphIHBhY2UsPC9wPlxuXHRcdFx0PHA+Y2hlLCB2ZW5lbmRvbWkgJnJzcXVvO25jb250cm8sIGEgcG9jbyBhIHBvY288L3A+XG5cdFx0XHQ8cD5taSByaXBpZ25ldmEgbCZhZ3JhdmU7IGRvdmUgJnJzcXVvO2wgc29sIHRhY2UuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPk1lbnRyZSBjaCZyc3F1bztpJnJzcXVvOyByb3ZpbmF2YSBpbiBiYXNzbyBsb2NvLDwvcD5cblx0XHRcdDxwPmRpbmFuemkgYSBsaSBvY2NoaSBtaSBzaSBmdSBvZmZlcnRvPC9wPlxuXHRcdFx0PHA+Y2hpIHBlciBsdW5nbyBzaWxlbnppbyBwYXJlYSBmaW9jby48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVhbmRvIHZpZGkgY29zdHVpIG5lbCBncmFuIGRpc2VydG8sPC9wPlxuXHRcdFx0PHA+JmxhcXVvO01pc2VyZXJlIGRpIG1lJnJhcXVvOywgZ3JpZGFpIGEgbHVpLDwvcD5cblx0XHRcdDxwPiZsYXF1bztxdWFsIGNoZSB0dSBzaWksIG9kIG9tYnJhIG9kIG9tbyBjZXJ0byEmcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5SaXNwdW9zZW1pOiAmbGFxdW87Tm9uIG9tbywgb21vIGdpJmFncmF2ZTsgZnVpLDwvcD5cblx0XHRcdDxwPmUgbGkgcGFyZW50aSBtaWVpIGZ1cm9uIGxvbWJhcmRpLDwvcD5cblx0XHRcdDxwPm1hbnRvYW5pIHBlciBwYXRyJml1bWw7YSBhbWJlZHVpLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5OYWNxdWkgc3ViIEl1bGlvLCBhbmNvciBjaGUgZm9zc2UgdGFyZGksPC9wPlxuXHRcdFx0PHA+ZSB2aXNzaSBhIFJvbWEgc290dG8gJnJzcXVvO2wgYnVvbm8gQXVndXN0bzwvcD5cblx0XHRcdDxwPm5lbCB0ZW1wbyBkZSBsaSBkJmVncmF2ZTtpIGZhbHNpIGUgYnVnaWFyZGkuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPlBvZXRhIGZ1aSwgZSBjYW50YWkgZGkgcXVlbCBnaXVzdG88L3A+XG5cdFx0XHQ8cD5maWdsaXVvbCBkJnJzcXVvO0FuY2hpc2UgY2hlIHZlbm5lIGRpIFRyb2lhLDwvcD5cblx0XHRcdDxwPnBvaSBjaGUgJnJzcXVvO2wgc3VwZXJibyBJbCZpdW1sOyZvYWN1dGU7biBmdSBjb21idXN0by48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+TWEgdHUgcGVyY2gmZWFjdXRlOyByaXRvcm5pIGEgdGFudGEgbm9pYT88L3A+XG5cdFx0XHQ8cD5wZXJjaCZlYWN1dGU7IG5vbiBzYWxpIGlsIGRpbGV0dG9zbyBtb250ZTwvcD5cblx0XHRcdDxwPmNoJnJzcXVvOyZlZ3JhdmU7IHByaW5jaXBpbyBlIGNhZ2lvbiBkaSB0dXR0YSBnaW9pYT8mcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD4mbGFxdW87T3Igc2UmcnNxdW87IHR1IHF1ZWwgVmlyZ2lsaW8gZSBxdWVsbGEgZm9udGU8L3A+XG5cdFx0XHQ8cD5jaGUgc3BhbmRpIGRpIHBhcmxhciBzJmlncmF2ZTsgbGFyZ28gZml1bWU/JnJhcXVvOyw8L3A+XG5cdFx0XHQ8cD5yaXNwdW9zJnJzcXVvOyBpbyBsdWkgY29uIHZlcmdvZ25vc2EgZnJvbnRlLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD4mbGFxdW87TyBkZSBsaSBhbHRyaSBwb2V0aSBvbm9yZSBlIGx1bWUsPC9wPlxuXHRcdFx0PHA+dmFnbGlhbWkgJnJzcXVvO2wgbHVuZ28gc3R1ZGlvIGUgJnJzcXVvO2wgZ3JhbmRlIGFtb3JlPC9wPlxuXHRcdFx0PHA+Y2hlIG0mcnNxdW87aGEgZmF0dG8gY2VyY2FyIGxvIHR1byB2b2x1bWUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPlR1IHNlJnJzcXVvOyBsbyBtaW8gbWFlc3RybyBlICZyc3F1bztsIG1pbyBhdXRvcmUsPC9wPlxuXHRcdFx0PHA+dHUgc2UmcnNxdW87IHNvbG8gY29sdWkgZGEgY3UmcnNxdW87IGlvIHRvbHNpPC9wPlxuXHRcdFx0PHA+bG8gYmVsbG8gc3RpbG8gY2hlIG0mcnNxdW87aGEgZmF0dG8gb25vcmUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPlZlZGkgbGEgYmVzdGlhIHBlciBjdSZyc3F1bzsgaW8gbWkgdm9sc2k7PC9wPlxuXHRcdFx0PHA+YWl1dGFtaSBkYSBsZWksIGZhbW9zbyBzYWdnaW8sPC9wPlxuXHRcdFx0PHA+Y2gmcnNxdW87ZWxsYSBtaSBmYSB0cmVtYXIgbGUgdmVuZSBlIGkgcG9sc2kmcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD4mbGFxdW87QSB0ZSBjb252aWVuIHRlbmVyZSBhbHRybyB2Jml1bWw7YWdnaW8mcmFxdW87LDwvcD5cblx0XHRcdDxwPnJpc3B1b3NlLCBwb2kgY2hlIGxhZ3JpbWFyIG1pIHZpZGUsPC9wPlxuXHRcdFx0PHA+JmxhcXVvO3NlIHZ1byZyc3F1bzsgY2FtcGFyIGQmcnNxdW87ZXN0byBsb2NvIHNlbHZhZ2dpbzs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+Y2gmZWFjdXRlOyBxdWVzdGEgYmVzdGlhLCBwZXIgbGEgcXVhbCB0dSBncmlkZSw8L3A+XG5cdFx0XHQ8cD5ub24gbGFzY2lhIGFsdHJ1aSBwYXNzYXIgcGVyIGxhIHN1YSB2aWEsPC9wPlxuXHRcdFx0PHA+bWEgdGFudG8gbG8gJnJzcXVvO21wZWRpc2NlIGNoZSBsJnJzcXVvO3VjY2lkZTs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+ZSBoYSBuYXR1cmEgcyZpZ3JhdmU7IG1hbHZhZ2lhIGUgcmlhLDwvcD5cblx0XHRcdDxwPmNoZSBtYWkgbm9uIGVtcGllIGxhIGJyYW1vc2Egdm9nbGlhLDwvcD5cblx0XHRcdDxwPmUgZG9wbyAmcnNxdW87bCBwYXN0byBoYSBwaSZ1Z3JhdmU7IGZhbWUgY2hlIHByaWEuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPk1vbHRpIHNvbiBsaSBhbmltYWxpIGEgY3VpIHMmcnNxdW87YW1tb2dsaWEsPC9wPlxuXHRcdFx0PHA+ZSBwaSZ1Z3JhdmU7IHNhcmFubm8gYW5jb3JhLCBpbmZpbiBjaGUgJnJzcXVvO2wgdmVsdHJvPC9wPlxuXHRcdFx0PHA+dmVyciZhZ3JhdmU7LCBjaGUgbGEgZmFyJmFncmF2ZTsgbW9yaXIgY29uIGRvZ2xpYS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVlc3RpIG5vbiBjaWJlciZhZ3JhdmU7IHRlcnJhIG4mZWFjdXRlOyBwZWx0cm8sPC9wPlxuXHRcdFx0PHA+bWEgc2FwJml1bWw7ZW56YSwgYW1vcmUgZSB2aXJ0dXRlLDwvcD5cblx0XHRcdDxwPmUgc3VhIG5hemlvbiBzYXImYWdyYXZlOyB0cmEgZmVsdHJvIGUgZmVsdHJvLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5EaSBxdWVsbGEgdW1pbGUgSXRhbGlhIGZpYSBzYWx1dGU8L3A+XG5cdFx0XHQ8cD5wZXIgY3VpIG1vciZpZ3JhdmU7IGxhIHZlcmdpbmUgQ2FtbWlsbGEsPC9wPlxuXHRcdFx0PHA+RXVyaWFsbyBlIFR1cm5vIGUgTmlzbyBkaSBmZXJ1dGUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPlF1ZXN0aSBsYSBjYWNjZXImYWdyYXZlOyBwZXIgb2duZSB2aWxsYSw8L3A+XG5cdFx0XHQ8cD5maW4gY2hlIGwmcnNxdW87YXZyJmFncmF2ZTsgcmltZXNzYSBuZSBsbyAmcnNxdW87bmZlcm5vLDwvcD5cblx0XHRcdDxwPmwmYWdyYXZlOyBvbmRlICZyc3F1bztudmlkaWEgcHJpbWEgZGlwYXJ0aWxsYS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+T25kJnJzcXVvOyBpbyBwZXIgbG8gdHVvIG1lJnJzcXVvOyBwZW5zbyBlIGRpc2Nlcm5vPC9wPlxuXHRcdFx0PHA+Y2hlIHR1IG1pIHNlZ3VpLCBlIGlvIHNhciZvZ3JhdmU7IHR1YSBndWlkYSw8L3A+XG5cdFx0XHQ8cD5lIHRyYXJyb3R0aSBkaSBxdWkgcGVyIGxvY28gZXR0ZXJubzs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+b3ZlIHVkaXJhaSBsZSBkaXNwZXJhdGUgc3RyaWRhLDwvcD5cblx0XHRcdDxwPnZlZHJhaSBsaSBhbnRpY2hpIHNwaXJpdGkgZG9sZW50aSw8L3A+XG5cdFx0XHQ8cD5jaCZyc3F1bzthIGxhIHNlY29uZGEgbW9ydGUgY2lhc2N1biBncmlkYTs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+ZSB2ZWRlcmFpIGNvbG9yIGNoZSBzb24gY29udGVudGk8L3A+XG5cdFx0XHQ8cD5uZWwgZm9jbywgcGVyY2gmZWFjdXRlOyBzcGVyYW4gZGkgdmVuaXJlPC9wPlxuXHRcdFx0PHA+cXVhbmRvIGNoZSBzaWEgYSBsZSBiZWF0ZSBnZW50aS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+QSBsZSBxdWFpIHBvaSBzZSB0dSB2b3JyYWkgc2FsaXJlLDwvcD5cblx0XHRcdDxwPmFuaW1hIGZpYSBhIGNpJm9ncmF2ZTsgcGkmdWdyYXZlOyBkaSBtZSBkZWduYTo8L3A+XG5cdFx0XHQ8cD5jb24gbGVpIHRpIGxhc2NlciZvZ3JhdmU7IG5lbCBtaW8gcGFydGlyZTs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+Y2gmZWFjdXRlOyBxdWVsbG8gaW1wZXJhZG9yIGNoZSBsJmFncmF2ZTsgcyZ1Z3JhdmU7IHJlZ25hLDwvcD5cblx0XHRcdDxwPnBlcmNoJnJzcXVvOyBpJnJzcXVvOyBmdSZyc3F1bzsgcmliZWxsYW50ZSBhIGxhIHN1YSBsZWdnZSw8L3A+XG5cdFx0XHQ8cD5ub24gdnVvbCBjaGUgJnJzcXVvO24gc3VhIGNpdHQmYWdyYXZlOyBwZXIgbWUgc2kgdmVnbmEuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkluIHR1dHRlIHBhcnRpIGltcGVyYSBlIHF1aXZpIHJlZ2dlOzwvcD5cblx0XHRcdDxwPnF1aXZpICZlZ3JhdmU7IGxhIHN1YSBjaXR0JmFncmF2ZTsgZSBsJnJzcXVvO2FsdG8gc2VnZ2lvOjwvcD5cblx0XHRcdDxwPm9oIGZlbGljZSBjb2x1aSBjdSZyc3F1bzsgaXZpIGVsZWdnZSEmcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FIGlvIGEgbHVpOiAmbGFxdW87UG9ldGEsIGlvIHRpIHJpY2hlZ2dpbzwvcD5cblx0XHRcdDxwPnBlciBxdWVsbG8gRGlvIGNoZSB0dSBub24gY29ub3NjZXN0aSw8L3A+XG5cdFx0XHQ8cD5hY2NpJm9ncmF2ZTsgY2gmcnNxdW87aW8gZnVnZ2EgcXVlc3RvIG1hbGUgZSBwZWdnaW8sPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPmNoZSB0dSBtaSBtZW5pIGwmYWdyYXZlOyBkb3YmcnNxdW87IG9yIGRpY2VzdGksPC9wPlxuXHRcdFx0PHA+cyZpZ3JhdmU7IGNoJnJzcXVvO2lvIHZlZ2dpYSBsYSBwb3J0YSBkaSBzYW4gUGlldHJvPC9wPlxuXHRcdFx0PHA+ZSBjb2xvciBjdWkgdHUgZmFpIGNvdGFudG8gbWVzdGkmcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5BbGxvciBzaSBtb3NzZSwgZSBpbyBsaSB0ZW5uaSBkaWV0cm8uPC9wPlxuXHRcdDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+MjwvcD5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5MbyBnaW9ybm8gc2UgbiZyc3F1bzthbmRhdmEsIGUgbCZyc3F1bzthZXJlIGJydW5vPC9wPlxuXHRcdFx0PHA+dG9nbGlldmEgbGkgYW5pbWFpIGNoZSBzb25vIGluIHRlcnJhPC9wPlxuXHRcdFx0PHA+ZGEgbGUgZmF0aWNoZSBsb3JvOyBlIGlvIHNvbCB1bm88L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+bSZyc3F1bzthcHBhcmVjY2hpYXZhIGEgc29zdGVuZXIgbGEgZ3VlcnJhPC9wPlxuXHRcdFx0PHA+cyZpZ3JhdmU7IGRlbCBjYW1taW5vIGUgcyZpZ3JhdmU7IGRlIGxhIHBpZXRhdGUsPC9wPlxuXHRcdFx0PHA+Y2hlIHJpdHJhcnImYWdyYXZlOyBsYSBtZW50ZSBjaGUgbm9uIGVycmEuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPk8gbXVzZSwgbyBhbHRvIGluZ2Vnbm8sIG9yIG0mcnNxdW87YWl1dGF0ZTs8L3A+XG5cdFx0XHQ8cD5vIG1lbnRlIGNoZSBzY3JpdmVzdGkgY2kmb2dyYXZlOyBjaCZyc3F1bztpbyB2aWRpLDwvcD5cblx0XHRcdDxwPnF1aSBzaSBwYXJyJmFncmF2ZTsgbGEgdHVhIG5vYmlsaXRhdGUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPklvIGNvbWluY2lhaTogJmxhcXVvO1BvZXRhIGNoZSBtaSBndWlkaSw8L3A+XG5cdFx0XHQ8cD5ndWFyZGEgbGEgbWlhIHZpcnQmdWdyYXZlOyBzJnJzcXVvO2VsbCZyc3F1bzsgJmVncmF2ZTsgcG9zc2VudGUsPC9wPlxuXHRcdFx0PHA+cHJpbWEgY2gmcnNxdW87YSBsJnJzcXVvO2FsdG8gcGFzc28gdHUgbWkgZmlkaS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+VHUgZGljaSBjaGUgZGkgU2lsdiZpdW1sO28gaWwgcGFyZW50ZSw8L3A+XG5cdFx0XHQ8cD5jb3JydXR0aWJpbGUgYW5jb3JhLCBhZCBpbW1vcnRhbGU8L3A+XG5cdFx0XHQ8cD5zZWNvbG8gYW5kJm9ncmF2ZTssIGUgZnUgc2Vuc2liaWxtZW50ZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UGVyJm9ncmF2ZTssIHNlIGwmcnNxdW87YXZ2ZXJzYXJpbyBkJnJzcXVvO29nbmUgbWFsZTwvcD5cblx0XHRcdDxwPmNvcnRlc2UgaSBmdSwgcGVuc2FuZG8gbCZyc3F1bzthbHRvIGVmZmV0dG88L3A+XG5cdFx0XHQ8cD5jaCZyc3F1bzt1c2NpciBkb3ZlYSBkaSBsdWksIGUgJnJzcXVvO2wgY2hpIGUgJnJzcXVvO2wgcXVhbGU8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+bm9uIHBhcmUgaW5kZWdubyBhZCBvbW8gZCZyc3F1bztpbnRlbGxldHRvOzwvcD5cblx0XHRcdDxwPmNoJnJzcXVvO2UmcnNxdW87IGZ1IGRlIGwmcnNxdW87YWxtYSBSb21hIGUgZGkgc3VvIGltcGVybzwvcD5cblx0XHRcdDxwPm5lIGwmcnNxdW87ZW1waXJlbyBjaWVsIHBlciBwYWRyZSBlbGV0dG86PC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPmxhIHF1YWxlIGUgJnJzcXVvO2wgcXVhbGUsIGEgdm9sZXIgZGlyIGxvIHZlcm8sPC9wPlxuXHRcdFx0PHA+ZnUgc3RhYmlsaXRhIHBlciBsbyBsb2NvIHNhbnRvPC9wPlxuXHRcdFx0PHA+dSZyc3F1bzsgc2llZGUgaWwgc3VjY2Vzc29yIGRlbCBtYWdnaW9yIFBpZXJvLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5QZXIgcXVlc3QmcnNxdW87IGFuZGF0YSBvbmRlIGxpIGRhaSB0dSB2YW50byw8L3A+XG5cdFx0XHQ8cD5pbnRlc2UgY29zZSBjaGUgZnVyb24gY2FnaW9uZTwvcD5cblx0XHRcdDxwPmRpIHN1YSB2aXR0b3JpYSBlIGRlbCBwYXBhbGUgYW1tYW50by48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+QW5kb3Z2aSBwb2kgbG8gVmFzIGQmcnNxdW87ZWxleiZpdW1sO29uZSw8L3A+XG5cdFx0XHQ8cD5wZXIgcmVjYXJuZSBjb25mb3J0byBhIHF1ZWxsYSBmZWRlPC9wPlxuXHRcdFx0PHA+Y2gmcnNxdW87JmVncmF2ZTsgcHJpbmNpcGlvIGEgbGEgdmlhIGRpIHNhbHZhemlvbmUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPk1hIGlvLCBwZXJjaCZlYWN1dGU7IHZlbmlydmk/IG8gY2hpICZyc3F1bztsIGNvbmNlZGU/PC9wPlxuXHRcdFx0PHA+SW8gbm9uIEVuw6thLCBpbyBub24gUGF1bG8gc29ubzs8L3A+XG5cdFx0XHQ8cD5tZSBkZWdubyBhIGNpJm9ncmF2ZTsgbiZlYWN1dGU7IGlvIG4mZWFjdXRlOyBhbHRyaSAmcnNxdW87bCBjcmVkZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UGVyIGNoZSwgc2UgZGVsIHZlbmlyZSBpbyBtJnJzcXVvO2FiYmFuZG9ubyw8L3A+XG5cdFx0XHQ8cD50ZW1vIGNoZSBsYSB2ZW51dGEgbm9uIHNpYSBmb2xsZS48L3A+XG5cdFx0XHQ8cD5TZSZyc3F1bzsgc2F2aW87IGludGVuZGkgbWUmcnNxdW87IGNoJnJzcXVvO2kmcnNxdW87IG5vbiByYWdpb25vJnJhcXVvOy48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RSBxdWFsICZlZ3JhdmU7IHF1ZWkgY2hlIGRpc3Z1b2wgY2kmb2dyYXZlOyBjaGUgdm9sbGU8L3A+XG5cdFx0XHQ8cD5lIHBlciBub3ZpIHBlbnNpZXIgY2FuZ2lhIHByb3Bvc3RhLDwvcD5cblx0XHRcdDxwPnMmaWdyYXZlOyBjaGUgZGFsIGNvbWluY2lhciB0dXR0byBzaSB0b2xsZSw8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+dGFsIG1pIGZlYyZyc3F1bzsgJml1bWw7byAmcnNxdW87biBxdWVsbGEgb3NjdXJhIGNvc3RhLDwvcD5cblx0XHRcdDxwPnBlcmNoJmVhY3V0ZTssIHBlbnNhbmRvLCBjb25zdW1haSBsYSAmcnNxdW87bXByZXNhPC9wPlxuXHRcdFx0PHA+Y2hlIGZ1IG5lbCBjb21pbmNpYXIgY290YW50byB0b3N0YS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+JmxhcXVvO1MmcnNxdW87aSZyc3F1bzsgaG8gYmVuIGxhIHBhcm9sYSB0dWEgaW50ZXNhJnJhcXVvOyw8L3A+XG5cdFx0XHQ8cD5yaXNwdW9zZSBkZWwgbWFnbmFuaW1vIHF1ZWxsJnJzcXVvOyBvbWJyYSw8L3A+XG5cdFx0XHQ8cD4mbGFxdW87bCZyc3F1bzthbmltYSB0dWEgJmVncmF2ZTsgZGEgdmlsdGFkZSBvZmZlc2E7PC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPmxhIHF1YWwgbW9sdGUgZiZpdW1sO2F0ZSBsJnJzcXVvO29tbyBpbmdvbWJyYTwvcD5cblx0XHRcdDxwPnMmaWdyYXZlOyBjaGUgZCZyc3F1bztvbnJhdGEgaW1wcmVzYSBsbyByaXZvbHZlLDwvcD5cblx0XHRcdDxwPmNvbWUgZmFsc28gdmVkZXIgYmVzdGlhIHF1YW5kJnJzcXVvOyBvbWJyYS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RGEgcXVlc3RhIHRlbWEgYWNjaSZvZ3JhdmU7IGNoZSB0dSB0aSBzb2x2ZSw8L3A+XG5cdFx0XHQ8cD5kaXJvdHRpIHBlcmNoJnJzcXVvOyBpbyB2ZW5uaSBlIHF1ZWwgY2gmcnNxdW87aW8gJnJzcXVvO250ZXNpPC9wPlxuXHRcdFx0PHA+bmVsIHByaW1vIHB1bnRvIGNoZSBkaSB0ZSBtaSBkb2x2ZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+SW8gZXJhIHRyYSBjb2xvciBjaGUgc29uIHNvc3Blc2ksPC9wPlxuXHRcdFx0PHA+ZSBkb25uYSBtaSBjaGlhbSZvZ3JhdmU7IGJlYXRhIGUgYmVsbGEsPC9wPlxuXHRcdFx0PHA+dGFsIGNoZSBkaSBjb21hbmRhcmUgaW8gbGEgcmljaGllc2kuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkx1Y2V2YW4gbGkgb2NjaGkgc3VvaSBwaSZ1Z3JhdmU7IGNoZSBsYSBzdGVsbGE7PC9wPlxuXHRcdFx0PHA+ZSBjb21pbmNpb21taSBhIGRpciBzb2F2ZSBlIHBpYW5hLDwvcD5cblx0XHRcdDxwPmNvbiBhbmdlbGljYSB2b2NlLCBpbiBzdWEgZmF2ZWxsYTo8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+4oCcTyBhbmltYSBjb3J0ZXNlIG1hbnRvYW5hLDwvcD5cblx0XHRcdDxwPmRpIGN1aSBsYSBmYW1hIGFuY29yIG5lbCBtb25kbyBkdXJhLDwvcD5cblx0XHRcdDxwPmUgZHVyZXImYWdyYXZlOyBxdWFudG8gJnJzcXVvO2wgbW9uZG8gbG9udGFuYSw8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+bCZyc3F1bzthbWljbyBtaW8sIGUgbm9uIGRlIGxhIHZlbnR1cmEsPC9wPlxuXHRcdFx0PHA+bmUgbGEgZGlzZXJ0YSBwaWFnZ2lhICZlZ3JhdmU7IGltcGVkaXRvPC9wPlxuXHRcdFx0PHA+cyZpZ3JhdmU7IG5lbCBjYW1taW4sIGNoZSB2Jm9ncmF2ZTtsdCZyc3F1bzsgJmVncmF2ZTsgcGVyIHBhdXJhOzwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5lIHRlbW8gY2hlIG5vbiBzaWEgZ2kmYWdyYXZlOyBzJmlncmF2ZTsgc21hcnJpdG8sPC9wPlxuXHRcdFx0PHA+Y2gmcnNxdW87aW8gbWkgc2lhIHRhcmRpIGFsIHNvY2NvcnNvIGxldmF0YSw8L3A+XG5cdFx0XHQ8cD5wZXIgcXVlbCBjaCZyc3F1bztpJnJzcXVvOyBobyBkaSBsdWkgbmVsIGNpZWxvIHVkaXRvLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5PciBtb3ZpLCBlIGNvbiBsYSB0dWEgcGFyb2xhIG9ybmF0YTwvcD5cblx0XHRcdDxwPmUgY29uIGNpJm9ncmF2ZTsgYyZyc3F1bztoYSBtZXN0aWVyaSBhbCBzdW8gY2FtcGFyZSw8L3A+XG5cdFx0XHQ8cD5sJnJzcXVvO2FpdXRhIHMmaWdyYXZlOyBjaCZyc3F1bztpJnJzcXVvOyBuZSBzaWEgY29uc29sYXRhLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5JJnJzcXVvOyBzb24gQmVhdHJpY2UgY2hlIHRpIGZhY2NpbyBhbmRhcmU7PC9wPlxuXHRcdFx0PHA+dmVnbm8gZGVsIGxvY28gb3ZlIHRvcm5hciBkaXNpbzs8L3A+XG5cdFx0XHQ8cD5hbW9yIG1pIG1vc3NlLCBjaGUgbWkgZmEgcGFybGFyZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVhbmRvIHNhciZvZ3JhdmU7IGRpbmFuemkgYWwgc2Vnbm9yIG1pbyw8L3A+XG5cdFx0XHQ8cD5kaSB0ZSBtaSBsb2RlciZvZ3JhdmU7IHNvdmVudGUgYSBsdWnigJ0uPC9wPlxuXHRcdFx0PHA+VGFjZXR0ZSBhbGxvcmEsIGUgcG9pIGNvbWluY2lhJnJzcXVvOyBpbzo8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+4oCcTyBkb25uYSBkaSB2aXJ0JnVncmF2ZTsgc29sYSBwZXIgY3VpPC9wPlxuXHRcdFx0PHA+bCZyc3F1bzt1bWFuYSBzcGV6aWUgZWNjZWRlIG9nbmUgY29udGVudG88L3A+XG5cdFx0XHQ8cD5kaSBxdWVsIGNpZWwgYyZyc3F1bztoYSBtaW5vciBsaSBjZXJjaGkgc3VpLDwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD50YW50byBtJnJzcXVvO2FnZ3JhZGEgaWwgdHVvIGNvbWFuZGFtZW50byw8L3A+XG5cdFx0XHQ8cD5jaGUgbCZyc3F1bzt1YmlkaXIsIHNlIGdpJmFncmF2ZTsgZm9zc2UsIG0mcnNxdW87JmVncmF2ZTsgdGFyZGk7PC9wPlxuXHRcdFx0PHA+cGkmdWdyYXZlOyBub24gdCZyc3F1bzsmZWdyYXZlOyB1byZyc3F1bzsgY2gmcnNxdW87YXByaXJtaSBpbCB0dW8gdGFsZW50by48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+TWEgZGltbWkgbGEgY2FnaW9uIGNoZSBub24gdGkgZ3VhcmRpPC9wPlxuXHRcdFx0PHA+ZGUgbG8gc2NlbmRlciBxdWEgZ2l1c28gaW4gcXVlc3RvIGNlbnRybzwvcD5cblx0XHRcdDxwPmRlIGwmcnNxdW87YW1waW8gbG9jbyBvdmUgdG9ybmFyIHR1IGFyZGnigJ0uPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPuKAnERhIGNoZSB0dSB2dW8mcnNxdW87IHNhdmVyIGNvdGFudG8gYSBkZW50cm8sPC9wPlxuXHRcdFx0PHA+ZGlyb3R0aSBicmlldmVtZW50ZeKAnSwgbWkgcmlzcHVvc2UsPC9wPlxuXHRcdFx0PHA+4oCccGVyY2gmcnNxdW87IGkmcnNxdW87IG5vbiB0ZW1vIGRpIHZlbmlyIHF1YSBlbnRyby48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+VGVtZXIgc2kgZGVlIGRpIHNvbGUgcXVlbGxlIGNvc2U8L3A+XG5cdFx0XHQ8cD5jJnJzcXVvO2hhbm5vIHBvdGVuemEgZGkgZmFyZSBhbHRydWkgbWFsZTs8L3A+XG5cdFx0XHQ8cD5kZSBsJnJzcXVvO2FsdHJlIG5vLCBjaCZlYWN1dGU7IG5vbiBzb24gcGF1cm9zZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+SSZyc3F1bzsgc29uIGZhdHRhIGRhIERpbywgc3VhIG1lcmMmZWFjdXRlOywgdGFsZSw8L3A+XG5cdFx0XHQ8cD5jaGUgbGEgdm9zdHJhIG1pc2VyaWEgbm9uIG1pIHRhbmdlLDwvcD5cblx0XHRcdDxwPm4mZWFjdXRlOyBmaWFtbWEgZCZyc3F1bztlc3RvICZyc3F1bztuY2VuZGlvIG5vbiBtJnJzcXVvO2Fzc2FsZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RG9ubmEgJmVncmF2ZTsgZ2VudGlsIG5lbCBjaWVsIGNoZSBzaSBjb21waWFuZ2U8L3A+XG5cdFx0XHQ8cD5kaSBxdWVzdG8gJnJzcXVvO21wZWRpbWVudG8gb3YmcnNxdW87IGlvIHRpIG1hbmRvLDwvcD5cblx0XHRcdDxwPnMmaWdyYXZlOyBjaGUgZHVybyBnaXVkaWNpbyBsJmFncmF2ZTsgcyZ1Z3JhdmU7IGZyYW5nZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVlc3RhIGNoaWVzZSBMdWNpYSBpbiBzdW8gZGltYW5kbzwvcD5cblx0XHRcdDxwPmUgZGlzc2U64oCUT3IgaGEgYmlzb2dubyBpbCB0dW8gZmVkZWxlPC9wPlxuXHRcdFx0PHA+ZGkgdGUsIGUgaW8gYSB0ZSBsbyByYWNjb21hbmRv4oCULjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5MdWNpYSwgbmltaWNhIGRpIGNpYXNjdW4gY3J1ZGVsZSw8L3A+XG5cdFx0XHQ8cD5zaSBtb3NzZSwgZSB2ZW5uZSBhbCBsb2NvIGRvdiZyc3F1bzsgaSZyc3F1bzsgZXJhLDwvcD5cblx0XHRcdDxwPmNoZSBtaSBzZWRlYSBjb24gbCZyc3F1bzthbnRpY2EgUmFjaGVsZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RGlzc2U64oCUQmVhdHJpY2UsIGxvZGEgZGkgRGlvIHZlcmEsPC9wPlxuXHRcdFx0PHA+Y2gmZWFjdXRlOyBub24gc29jY29ycmkgcXVlaSBjaGUgdCZyc3F1bzthbSZvZ3JhdmU7IHRhbnRvLDwvcD5cblx0XHRcdDxwPmNoJnJzcXVvO3VzYyZpZ3JhdmU7IHBlciB0ZSBkZSBsYSB2b2xnYXJlIHNjaGllcmE/PC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPk5vbiBvZGkgdHUgbGEgcGlldGEgZGVsIHN1byBwaWFudG8sPC9wPlxuXHRcdFx0PHA+bm9uIHZlZGkgdHUgbGEgbW9ydGUgY2hlICZyc3F1bztsIGNvbWJhdHRlPC9wPlxuXHRcdFx0PHA+c3UgbGEgZml1bWFuYSBvdmUgJnJzcXVvO2wgbWFyIG5vbiBoYSB2YW50bz/igJQuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkFsIG1vbmRvIG5vbiBmdXIgbWFpIHBlcnNvbmUgcmF0dGU8L3A+XG5cdFx0XHQ8cD5hIGZhciBsb3IgcHJvIG8gYSBmdWdnaXIgbG9yIGRhbm5vLDwvcD5cblx0XHRcdDxwPmNvbSZyc3F1bzsgaW8sIGRvcG8gY290YWkgcGFyb2xlIGZhdHRlLDwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD52ZW5uaSBxdWEgZ2kmdWdyYXZlOyBkZWwgbWlvIGJlYXRvIHNjYW5ubyw8L3A+XG5cdFx0XHQ8cD5maWRhbmRvbWkgZGVsIHR1byBwYXJsYXJlIG9uZXN0byw8L3A+XG5cdFx0XHQ8cD5jaCZyc3F1bztvbm9yYSB0ZSBlIHF1ZWkgY2gmcnNxdW87dWRpdG8gbCZyc3F1bztoYW5ub+KAnS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UG9zY2lhIGNoZSBtJnJzcXVvO2ViYmUgcmFnaW9uYXRvIHF1ZXN0byw8L3A+XG5cdFx0XHQ8cD5saSBvY2NoaSBsdWNlbnRpIGxhZ3JpbWFuZG8gdm9sc2UsPC9wPlxuXHRcdFx0PHA+cGVyIGNoZSBtaSBmZWNlIGRlbCB2ZW5pciBwaSZ1Z3JhdmU7IHByZXN0by48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RSB2ZW5uaSBhIHRlIGNvcyZpZ3JhdmU7IGNvbSZyc3F1bzsgZWxsYSB2b2xzZTo8L3A+XG5cdFx0XHQ8cD5kJnJzcXVvO2luYW56aSBhIHF1ZWxsYSBmaWVyYSB0aSBsZXZhaTwvcD5cblx0XHRcdDxwPmNoZSBkZWwgYmVsIG1vbnRlIGlsIGNvcnRvIGFuZGFyIHRpIHRvbHNlLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5EdW5xdWU6IGNoZSAmZWdyYXZlOz8gcGVyY2gmZWFjdXRlOywgcGVyY2gmZWFjdXRlOyByZXN0YWksPC9wPlxuXHRcdFx0PHA+cGVyY2gmZWFjdXRlOyB0YW50YSB2aWx0JmFncmF2ZTsgbmVsIGNvcmUgYWxsZXR0ZSw8L3A+XG5cdFx0XHQ8cD5wZXJjaCZlYWN1dGU7IGFyZGlyZSBlIGZyYW5jaGV6emEgbm9uIGhhaSw8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+cG9zY2lhIGNoZSB0YWkgdHJlIGRvbm5lIGJlbmVkZXR0ZTwvcD5cblx0XHRcdDxwPmN1cmFuIGRpIHRlIG5lIGxhIGNvcnRlIGRlbCBjaWVsbyw8L3A+XG5cdFx0XHQ8cD5lICZyc3F1bztsIG1pbyBwYXJsYXIgdGFudG8gYmVuIHRpIHByb21ldHRlPyZyYXF1bzsuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPlF1YWxpIGZpb3JldHRpIGRhbCBub3R0dXJubyBnZWxvPC9wPlxuXHRcdFx0PHA+Y2hpbmF0aSBlIGNoaXVzaSwgcG9pIGNoZSAmcnNxdW87bCBzb2wgbGkgJnJzcXVvO21iaWFuY2EsPC9wPlxuXHRcdFx0PHA+c2kgZHJpenphbiB0dXR0aSBhcGVydGkgaW4gbG9ybyBzdGVsbyw8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+dGFsIG1pIGZlYyZyc3F1bzsgaW8gZGkgbWlhIHZpcnR1ZGUgc3RhbmNhLDwvcD5cblx0XHRcdDxwPmUgdGFudG8gYnVvbm8gYXJkaXJlIGFsIGNvciBtaSBjb3JzZSw8L3A+XG5cdFx0XHQ8cD5jaCZyc3F1bztpJnJzcXVvOyBjb21pbmNpYWkgY29tZSBwZXJzb25hIGZyYW5jYTo8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+JmxhcXVvO09oIHBpZXRvc2EgY29sZWkgY2hlIG1pIHNvY2NvcnNlITwvcD5cblx0XHRcdDxwPmUgdGUgY29ydGVzZSBjaCZyc3F1bzt1YmlkaXN0aSB0b3N0bzwvcD5cblx0XHRcdDxwPmEgbGUgdmVyZSBwYXJvbGUgY2hlIHRpIHBvcnNlITwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5UdSBtJnJzcXVvO2hhaSBjb24gZGlzaWRlcmlvIGlsIGNvciBkaXNwb3N0bzwvcD5cblx0XHRcdDxwPnMmaWdyYXZlOyBhbCB2ZW5pciBjb24gbGUgcGFyb2xlIHR1ZSw8L3A+XG5cdFx0XHQ8cD5jaCZyc3F1bztpJnJzcXVvOyBzb24gdG9ybmF0byBuZWwgcHJpbW8gcHJvcG9zdG8uPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPk9yIHZhLCBjaCZyc3F1bzt1biBzb2wgdm9sZXJlICZlZ3JhdmU7IGQmcnNxdW87YW1iZWR1ZTo8L3A+XG5cdFx0XHQ8cD50dSBkdWNhLCB0dSBzZWdub3JlIGUgdHUgbWFlc3RybyZyYXF1bzsuPC9wPlxuXHRcdFx0PHA+Q29zJmlncmF2ZTsgbGkgZGlzc2k7IGUgcG9pIGNoZSBtb3NzbyBmdWUsPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPmludHJhaSBwZXIgbG8gY2FtbWlubyBhbHRvIGUgc2lsdmVzdHJvLjwvcD5cblx0XHQ8L2Rpdj5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPjM8L3A+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+4oCYJmxzcXVvO1BlciBtZSBzaSB2YSBuZSBsYSBjaXR0JmFncmF2ZTsgZG9sZW50ZSw8L3A+XG5cdFx0XHQ8cD5wZXIgbWUgc2kgdmEgbmUgbCZyc3F1bztldHRlcm5vIGRvbG9yZSw8L3A+XG5cdFx0XHQ8cD5wZXIgbWUgc2kgdmEgdHJhIGxhIHBlcmR1dGEgZ2VudGUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkdpdXN0aXppYSBtb3NzZSBpbCBtaW8gYWx0byBmYXR0b3JlOzwvcD5cblx0XHRcdDxwPmZlY2VtaSBsYSBkaXZpbmEgcG9kZXN0YXRlLDwvcD5cblx0XHRcdDxwPmxhIHNvbW1hIHNhcCZpdW1sO2VuemEgZSAmcnNxdW87bCBwcmltbyBhbW9yZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RGluYW56aSBhIG1lIG5vbiBmdW9yIGNvc2UgY3JlYXRlPC9wPlxuXHRcdFx0PHA+c2Ugbm9uIGV0dGVybmUsIGUgaW8gZXR0ZXJubyBkdXJvLjwvcD5cblx0XHRcdDxwPkxhc2NpYXRlIG9nbmUgc3BlcmFuemEsIHZvaSBjaCZyc3F1bztpbnRyYXRlJnJzcXVvOy48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVlc3RlIHBhcm9sZSBkaSBjb2xvcmUgb3NjdXJvPC9wPlxuXHRcdFx0PHA+dmlkJnJzcXVvOyAmaXVtbDtvIHNjcml0dGUgYWwgc29tbW8gZCZyc3F1bzt1bmEgcG9ydGE7PC9wPlxuXHRcdFx0PHA+cGVyIGNoJnJzcXVvO2lvOiAmbGFxdW87TWFlc3RybywgaWwgc2Vuc28gbG9yIG0mcnNxdW87JmVncmF2ZTsgZHVybyZyYXF1bzsuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkVkIGVsbGkgYSBtZSwgY29tZSBwZXJzb25hIGFjY29ydGE6PC9wPlxuXHRcdFx0PHA+JmxhcXVvO1F1aSBzaSBjb252aWVuIGxhc2NpYXJlIG9nbmUgc29zcGV0dG87PC9wPlxuXHRcdFx0PHA+b2duZSB2aWx0JmFncmF2ZTsgY29udmllbiBjaGUgcXVpIHNpYSBtb3J0YS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+Tm9pIHNpYW0gdmVudXRpIGFsIGxvY28gb3YmcnNxdW87IGkmcnNxdW87IHQmcnNxdW87aG8gZGV0dG88L3A+XG5cdFx0XHQ8cD5jaGUgdHUgdmVkcmFpIGxlIGdlbnRpIGRvbG9yb3NlPC9wPlxuXHRcdFx0PHA+YyZyc3F1bztoYW5ubyBwZXJkdXRvIGlsIGJlbiBkZSBsJnJzcXVvO2ludGVsbGV0dG8mcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FIHBvaSBjaGUgbGEgc3VhIG1hbm8gYSBsYSBtaWEgcHVvc2U8L3A+XG5cdFx0XHQ8cD5jb24gbGlldG8gdm9sdG8sIG9uZCZyc3F1bzsgaW8gbWkgY29uZm9ydGFpLDwvcD5cblx0XHRcdDxwPm1pIG1pc2UgZGVudHJvIGEgbGUgc2VncmV0ZSBjb3NlLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5RdWl2aSBzb3NwaXJpLCBwaWFudGkgZSBhbHRpIGd1YWk8L3A+XG5cdFx0XHQ8cD5yaXNvbmF2YW4gcGVyIGwmcnNxdW87YWVyZSBzYW56YSBzdGVsbGUsPC9wPlxuXHRcdFx0PHA+cGVyIGNoJnJzcXVvO2lvIGFsIGNvbWluY2lhciBuZSBsYWdyaW1haS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RGl2ZXJzZSBsaW5ndWUsIG9ycmliaWxpIGZhdmVsbGUsPC9wPlxuXHRcdFx0PHA+cGFyb2xlIGRpIGRvbG9yZSwgYWNjZW50aSBkJnJzcXVvO2lyYSw8L3A+XG5cdFx0XHQ8cD52b2NpIGFsdGUgZSBmaW9jaGUsIGUgc3VvbiBkaSBtYW4gY29uIGVsbGU8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+ZmFjZXZhbm8gdW4gdHVtdWx0bywgaWwgcXVhbCBzJnJzcXVvO2FnZ2lyYTwvcD5cblx0XHRcdDxwPnNlbXByZSBpbiBxdWVsbCZyc3F1bzsgYXVyYSBzYW56YSB0ZW1wbyB0aW50YSw8L3A+XG5cdFx0XHQ8cD5jb21lIGxhIHJlbmEgcXVhbmRvIHR1cmJvIHNwaXJhLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FIGlvIGNoJnJzcXVvO2F2ZWEgZCZyc3F1bztlcnJvciBsYSB0ZXN0YSBjaW50YSw8L3A+XG5cdFx0XHQ8cD5kaXNzaTogJmxhcXVvO01hZXN0cm8sIGNoZSAmZWdyYXZlOyBxdWVsIGNoJnJzcXVvO2kmcnNxdW87IG9kbz88L3A+XG5cdFx0XHQ8cD5lIGNoZSBnZW50JnJzcXVvOyAmZWdyYXZlOyBjaGUgcGFyIG5lbCBkdW9sIHMmaWdyYXZlOyB2aW50YT8mcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FZCBlbGxpIGEgbWU6ICZsYXF1bztRdWVzdG8gbWlzZXJvIG1vZG88L3A+XG5cdFx0XHQ8cD50ZWdub24gbCZyc3F1bzthbmltZSB0cmlzdGUgZGkgY29sb3JvPC9wPlxuXHRcdFx0PHA+Y2hlIHZpc3NlciBzYW56YSAmcnNxdW87bmZhbWlhIGUgc2FuemEgbG9kby48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+TWlzY2hpYXRlIHNvbm8gYSBxdWVsIGNhdHRpdm8gY29ybzwvcD5cblx0XHRcdDxwPmRlIGxpIGFuZ2VsaSBjaGUgbm9uIGZ1cm9uIHJpYmVsbGk8L3A+XG5cdFx0XHQ8cD5uJmVhY3V0ZTsgZnVyIGZlZGVsaSBhIERpbywgbWEgcGVyIHMmZWFjdXRlOyBmdW9yby48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+Q2FjY2lhbmxpIGkgY2llbCBwZXIgbm9uIGVzc2VyIG1lbiBiZWxsaSw8L3A+XG5cdFx0XHQ8cD5uJmVhY3V0ZTsgbG8gcHJvZm9uZG8gaW5mZXJubyBsaSByaWNldmUsPC9wPlxuXHRcdFx0PHA+Y2gmcnNxdW87YWxjdW5hIGdsb3JpYSBpIHJlaSBhdnJlYmJlciBkJnJzcXVvO2VsbGkmcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FIGlvOiAmbGFxdW87TWFlc3RybywgY2hlICZlZ3JhdmU7IHRhbnRvIGdyZXZlPC9wPlxuXHRcdFx0PHA+YSBsb3IgY2hlIGxhbWVudGFyIGxpIGZhIHMmaWdyYXZlOyBmb3J0ZT8mcmFxdW87LjwvcD5cblx0XHRcdDxwPlJpc3B1b3NlOiAmbGFxdW87RGljZXJvbHRpIG1vbHRvIGJyZXZlLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5RdWVzdGkgbm9uIGhhbm5vIHNwZXJhbnphIGRpIG1vcnRlLDwvcD5cblx0XHRcdDxwPmUgbGEgbG9yIGNpZWNhIHZpdGEgJmVncmF2ZTsgdGFudG8gYmFzc2EsPC9wPlxuXHRcdFx0PHA+Y2hlICZyc3F1bztudmlkJml1bWw7b3NpIHNvbiBkJnJzcXVvO29nbmUgYWx0cmEgc29ydGUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkZhbWEgZGkgbG9ybyBpbCBtb25kbyBlc3NlciBub24gbGFzc2E7PC9wPlxuXHRcdFx0PHA+bWlzZXJpY29yZGlhIGUgZ2l1c3RpemlhIGxpIHNkZWduYTo8L3A+XG5cdFx0XHQ8cD5ub24gcmFnaW9uaWFtIGRpIGxvciwgbWEgZ3VhcmRhIGUgcGFzc2EmcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FIGlvLCBjaGUgcmlndWFyZGFpLCB2aWRpIHVuYSAmcnNxdW87bnNlZ25hPC9wPlxuXHRcdFx0PHA+Y2hlIGdpcmFuZG8gY29ycmV2YSB0YW50byByYXR0YSw8L3A+XG5cdFx0XHQ8cD5jaGUgZCZyc3F1bztvZ25lIHBvc2EgbWkgcGFyZWEgaW5kZWduYTs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+ZSBkaWV0cm8gbGUgdmVuJmlncmF2ZTthIHMmaWdyYXZlOyBsdW5nYSB0cmF0dGE8L3A+XG5cdFx0XHQ8cD5kaSBnZW50ZSwgY2gmcnNxdW87aSZyc3F1bzsgbm9uIGF2ZXJlaSBjcmVkdXRvPC9wPlxuXHRcdFx0PHA+Y2hlIG1vcnRlIHRhbnRhIG4mcnNxdW87YXZlc3NlIGRpc2ZhdHRhLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5Qb3NjaWEgY2gmcnNxdW87aW8gdiZyc3F1bztlYmJpIGFsY3VuIHJpY29ub3NjaXV0byw8L3A+XG5cdFx0XHQ8cD52aWRpIGUgY29ub2JiaSBsJnJzcXVvO29tYnJhIGRpIGNvbHVpPC9wPlxuXHRcdFx0PHA+Y2hlIGZlY2UgcGVyIHZpbHRhZGUgaWwgZ3JhbiByaWZpdXRvLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5JbmNvbnRhbmVudGUgaW50ZXNpIGUgY2VydG8gZnVpPC9wPlxuXHRcdFx0PHA+Y2hlIHF1ZXN0YSBlcmEgbGEgc2V0dGEgZCZyc3F1bztpIGNhdHRpdmksPC9wPlxuXHRcdFx0PHA+YSBEaW8gc3BpYWNlbnRpIGUgYSZyc3F1bzsgbmVtaWNpIHN1aS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVlc3RpIHNjaWF1cmF0aSwgY2hlIG1haSBub24gZnVyIHZpdmksPC9wPlxuXHRcdFx0PHA+ZXJhbm8gaWdudWRpIGUgc3RpbW9sYXRpIG1vbHRvPC9wPlxuXHRcdFx0PHA+ZGEgbW9zY29uaSBlIGRhIHZlc3BlIGNoJnJzcXVvO2VyYW4gaXZpLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FbGxlIHJpZ2F2YW4gbG9yIGRpIHNhbmd1ZSBpbCB2b2x0byw8L3A+XG5cdFx0XHQ8cD5jaGUsIG1pc2NoaWF0byBkaSBsYWdyaW1lLCBhJnJzcXVvOyBsb3IgcGllZGk8L3A+XG5cdFx0XHQ8cD5kYSBmYXN0aWRpb3NpIHZlcm1pIGVyYSByaWNvbHRvLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5FIHBvaSBjaCZyc3F1bzthIHJpZ3VhcmRhciBvbHRyZSBtaSBkaWVkaSw8L3A+XG5cdFx0XHQ8cD52aWRpIGdlbnRpIGEgbGEgcml2YSBkJnJzcXVvO3VuIGdyYW4gZml1bWU7PC9wPlxuXHRcdFx0PHA+cGVyIGNoJnJzcXVvO2lvIGRpc3NpOiAmbGFxdW87TWFlc3Rybywgb3IgbWkgY29uY2VkaTwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5jaCZyc3F1bztpJnJzcXVvOyBzYXBwaWEgcXVhbGkgc29ubywgZSBxdWFsIGNvc3R1bWU8L3A+XG5cdFx0XHQ8cD5sZSBmYSBkaSB0cmFwYXNzYXIgcGFyZXIgcyZpZ3JhdmU7IHByb250ZSw8L3A+XG5cdFx0XHQ8cD5jb20mcnNxdW87IGkmcnNxdW87IGRpc2Nlcm5vIHBlciBsbyBmaW9jbyBsdW1lJnJhcXVvOy48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RWQgZWxsaSBhIG1lOiAmbGFxdW87TGUgY29zZSB0aSBmaWVyIGNvbnRlPC9wPlxuXHRcdFx0PHA+cXVhbmRvIG5vaSBmZXJtZXJlbSBsaSBub3N0cmkgcGFzc2k8L3A+XG5cdFx0XHQ8cD5zdSBsYSB0cmlzdGEgcml2aWVyYSBkJnJzcXVvO0FjaGVyb250ZSZyYXF1bzsuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkFsbG9yIGNvbiBsaSBvY2NoaSB2ZXJnb2dub3NpIGUgYmFzc2ksPC9wPlxuXHRcdFx0PHA+dGVtZW5kbyBubyAmcnNxdW87bCBtaW8gZGlyIGxpIGZvc3NlIGdyYXZlLDwvcD5cblx0XHRcdDxwPmluZmlubyBhbCBmaXVtZSBkZWwgcGFybGFyIG1pIHRyYXNzaS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RWQgZWNjbyB2ZXJzbyBub2kgdmVuaXIgcGVyIG5hdmU8L3A+XG5cdFx0XHQ8cD51biB2ZWNjaGlvLCBiaWFuY28gcGVyIGFudGljbyBwZWxvLDwvcD5cblx0XHRcdDxwPmdyaWRhbmRvOiAmbGFxdW87R3VhaSBhIHZvaSwgYW5pbWUgcHJhdmUhPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPk5vbiBpc3BlcmF0ZSBtYWkgdmVkZXIgbG8gY2llbG86PC9wPlxuXHRcdFx0PHA+aSZyc3F1bzsgdmVnbm8gcGVyIG1lbmFydmkgYSBsJnJzcXVvO2FsdHJhIHJpdmE8L3A+XG5cdFx0XHQ8cD5uZSBsZSB0ZW5lYnJlIGV0dGVybmUsIGluIGNhbGRvIGUgJnJzcXVvO24gZ2Vsby48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RSB0dSBjaGUgc2UmcnNxdW87IGNvc3QmaWdyYXZlOywgYW5pbWEgdml2YSw8L3A+XG5cdFx0XHQ8cD5wJmFncmF2ZTtydGl0aSBkYSBjb3Rlc3RpIGNoZSBzb24gbW9ydGkmcmFxdW87LjwvcD5cblx0XHRcdDxwPk1hIHBvaSBjaGUgdmlkZSBjaCZyc3F1bztpbyBub24gbWkgcGFydGl2YSw8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+ZGlzc2U6ICZsYXF1bztQZXIgYWx0cmEgdmlhLCBwZXIgYWx0cmkgcG9ydGk8L3A+XG5cdFx0XHQ8cD52ZXJyYWkgYSBwaWFnZ2lhLCBub24gcXVpLCBwZXIgcGFzc2FyZTo8L3A+XG5cdFx0XHQ8cD5waSZ1Z3JhdmU7IGxpZXZlIGxlZ25vIGNvbnZpZW4gY2hlIHRpIHBvcnRpJnJhcXVvOy48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+RSAmcnNxdW87bCBkdWNhIGx1aTogJmxhcXVvO0Nhcm9uLCBub24gdGkgY3J1Y2NpYXJlOjwvcD5cblx0XHRcdDxwPnZ1b2xzaSBjb3MmaWdyYXZlOyBjb2wmYWdyYXZlOyBkb3ZlIHNpIHB1b3RlPC9wPlxuXHRcdFx0PHA+Y2kmb2dyYXZlOyBjaGUgc2kgdnVvbGUsIGUgcGkmdWdyYXZlOyBub24gZGltYW5kYXJlJnJhcXVvOy48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVpbmNpIGZ1b3IgcXVldGUgbGUgbGFub3NlIGdvdGU8L3A+XG5cdFx0XHQ8cD5hbCBub2NjaGllciBkZSBsYSBsaXZpZGEgcGFsdWRlLDwvcD5cblx0XHRcdDxwPmNoZSAmcnNxdW87bnRvcm5vIGEgbGkgb2NjaGkgYXZlYSBkaSBmaWFtbWUgcm90ZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+TWEgcXVlbGwmcnNxdW87IGFuaW1lLCBjaCZyc3F1bztlcmFuIGxhc3NlIGUgbnVkZSw8L3A+XG5cdFx0XHQ8cD5jYW5naWFyIGNvbG9yZSBlIGRpYmF0dGVybyBpIGRlbnRpLDwvcD5cblx0XHRcdDxwPnJhdHRvIGNoZSAmcnNxdW87bnRlc2VyIGxlIHBhcm9sZSBjcnVkZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+QmVzdGVtbWlhdmFubyBEaW8gZSBsb3IgcGFyZW50aSw8L3A+XG5cdFx0XHQ8cD5sJnJzcXVvO3VtYW5hIHNwZXppZSBlICZyc3F1bztsIGxvY28gZSAmcnNxdW87bCB0ZW1wbyBlICZyc3F1bztsIHNlbWU8L3A+XG5cdFx0XHQ8cD5kaSBsb3Igc2VtZW56YSBlIGRpIGxvciBuYXNjaW1lbnRpLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5Qb2kgc2kgcml0cmFzc2VyIHR1dHRlIHF1YW50ZSBpbnNpZW1lLDwvcD5cblx0XHRcdDxwPmZvcnRlIHBpYW5nZW5kbywgYSBsYSByaXZhIG1hbHZhZ2lhPC9wPlxuXHRcdFx0PHA+Y2gmcnNxdW87YXR0ZW5kZSBjaWFzY3VuIHVvbSBjaGUgRGlvIG5vbiB0ZW1lLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5DYXJvbiBkaW1vbmlvLCBjb24gb2NjaGkgZGkgYnJhZ2lhPC9wPlxuXHRcdFx0PHA+bG9ybyBhY2Nlbm5hbmRvLCB0dXR0ZSBsZSByYWNjb2dsaWU7PC9wPlxuXHRcdFx0PHA+YmF0dGUgY29sIHJlbW8gcXVhbHVucXVlIHMmcnNxdW87YWRhZ2lhLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5Db21lIGQmcnNxdW87YXV0dW5ubyBzaSBsZXZhbiBsZSBmb2dsaWU8L3A+XG5cdFx0XHQ8cD5sJnJzcXVvO3VuYSBhcHByZXNzbyBkZSBsJnJzcXVvO2FsdHJhLCBmaW4gY2hlICZyc3F1bztsIHJhbW88L3A+XG5cdFx0XHQ8cD52ZWRlIGEgbGEgdGVycmEgdHV0dGUgbGUgc3VlIHNwb2dsaWUsPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPnNpbWlsZW1lbnRlIGlsIG1hbCBzZW1lIGQmcnNxdW87QWRhbW88L3A+XG5cdFx0XHQ8cD5naXR0YW5zaSBkaSBxdWVsIGxpdG8gYWQgdW5hIGFkIHVuYSw8L3A+XG5cdFx0XHQ8cD5wZXIgY2VubmkgY29tZSBhdWdlbCBwZXIgc3VvIHJpY2hpYW1vLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5Db3MmaWdyYXZlOyBzZW4gdmFubm8gc3UgcGVyIGwmcnNxdW87b25kYSBicnVuYSw8L3A+XG5cdFx0XHQ8cD5lIGF2YW50aSBjaGUgc2llbiBkaSBsJmFncmF2ZTsgZGlzY2VzZSw8L3A+XG5cdFx0XHQ8cD5hbmNoZSBkaSBxdWEgbnVvdmEgc2NoaWVyYSBzJnJzcXVvO2F1bmEuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPiZsYXF1bztGaWdsaXVvbCBtaW8mcmFxdW87LCBkaXNzZSAmcnNxdW87bCBtYWVzdHJvIGNvcnRlc2UsPC9wPlxuXHRcdFx0PHA+JmxhcXVvO3F1ZWxsaSBjaGUgbXVvaW9uIG5lIGwmcnNxdW87aXJhIGRpIERpbzwvcD5cblx0XHRcdDxwPnR1dHRpIGNvbnZlZ25vbiBxdWkgZCZyc3F1bztvZ25lIHBhZXNlOzwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5lIHByb250aSBzb25vIGEgdHJhcGFzc2FyIGxvIHJpbyw8L3A+XG5cdFx0XHQ8cD5jaCZlYWN1dGU7IGxhIGRpdmluYSBnaXVzdGl6aWEgbGkgc3Byb25hLDwvcD5cblx0XHRcdDxwPnMmaWdyYXZlOyBjaGUgbGEgdGVtYSBzaSB2b2x2ZSBpbiBkaXNpby48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+UXVpbmNpIG5vbiBwYXNzYSBtYWkgYW5pbWEgYnVvbmE7PC9wPlxuXHRcdFx0PHA+ZSBwZXImb2dyYXZlOywgc2UgQ2Fyb24gZGkgdGUgc2kgbGFnbmEsPC9wPlxuXHRcdFx0PHA+YmVuIHB1b2kgc2FwZXJlIG9tYWkgY2hlICZyc3F1bztsIHN1byBkaXIgc3VvbmEmcmFxdW87LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5GaW5pdG8gcXVlc3RvLCBsYSBidWlhIGNhbXBhZ25hPC9wPlxuXHRcdFx0PHA+dHJlbSZvZ3JhdmU7IHMmaWdyYXZlOyBmb3J0ZSwgY2hlIGRlIGxvIHNwYXZlbnRvPC9wPlxuXHRcdFx0PHA+bGEgbWVudGUgZGkgc3Vkb3JlIGFuY29yIG1pIGJhZ25hLjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5MYSB0ZXJyYSBsYWdyaW1vc2EgZGllZGUgdmVudG8sPC9wPlxuXHRcdFx0PHA+Y2hlIGJhbGVuJm9ncmF2ZTsgdW5hIGx1Y2UgdmVybWlnbGlhPC9wPlxuXHRcdFx0PHA+bGEgcXVhbCBtaSB2aW5zZSBjaWFzY3VuIHNlbnRpbWVudG87PC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPmUgY2FkZGkgY29tZSBsJnJzcXVvO3VvbSBjdWkgc29ubm8gcGlnbGlhLjwvcD5cblx0XHQ8L2Rpdj5gXTtcblxubW9kdWxlLmV4cG9ydHMgPSBpdGFsaWFuO1xuIiwiLy8gbG9uZ2ZlbGxvdy5qc1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgbG9uZ2ZlbGxvdyA9IFtgPHAgY2xhc3M9XCJ0aXRsZVwiPkluZmVybm88L3A+XG5cdDxwIGNsYXNzPVwiYXV0aG9yXCI+SGVucnkgV2Fkc3dvcnRoIExvbmdmZWxsb3c8L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5JbmZlcm5vOiBDYW50byBJPC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+TWlkd2F5IHVwb24gdGhlIGpvdXJuZXkgb2Ygb3VyIGxpZmU8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkkgZm91bmQgbXlzZWxmIHdpdGhpbiBhIGZvcmVzdCBkYXJrLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+Rm9yIHRoZSBzdHJhaWdodGZvcndhcmQgcGF0aHdheSBoYWQgYmVlbiBsb3N0LjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BaCBtZSEgaG93IGhhcmQgYSB0aGluZyBpdCBpcyB0byBzYXk8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoYXQgd2FzIHRoaXMgZm9yZXN0IHNhdmFnZSwgcm91Z2gsIGFuZCBzdGVybiw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIGluIHRoZSB2ZXJ5IHRob3VnaHQgcmVuZXdzIHRoZSBmZWFyLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5TbyBiaXR0ZXIgaXMgaXQsIGRlYXRoIGlzIGxpdHRsZSBtb3JlOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QnV0IG9mIHRoZSBnb29kIHRvIHRyZWF0LCB3aGljaCB0aGVyZSBJIGZvdW5kLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+U3BlYWsgd2lsbCBJIG9mIHRoZSBvdGhlciB0aGluZ3MgSSBzYXcgdGhlcmUuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkkgY2Fubm90IHdlbGwgcmVwZWF0IGhvdyB0aGVyZSBJIGVudGVyZWQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5TbyBmdWxsIHdhcyBJIG9mIHNsdW1iZXIgYXQgdGhlIG1vbWVudDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+SW4gd2hpY2ggSSBoYWQgYWJhbmRvbmVkIHRoZSB0cnVlIHdheS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QnV0IGFmdGVyIEkgaGFkIHJlYWNoZWQgYSBtb3VudGFpbiZyc3F1bztzIGZvb3QsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BdCB0aGF0IHBvaW50IHdoZXJlIHRoZSB2YWxsZXkgdGVybWluYXRlZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIGhhZCB3aXRoIGNvbnN0ZXJuYXRpb24gcGllcmNlZCBteSBoZWFydCw8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VXB3YXJkIEkgbG9va2VkLCBhbmQgSSBiZWhlbGQgaXRzIHNob3VsZGVycyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlZlc3RlZCBhbHJlYWR5IHdpdGggdGhhdCBwbGFuZXQmcnNxdW87cyByYXlzPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBsZWFkZXRoIG90aGVycyByaWdodCBieSBldmVyeSByb2FkLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaGVuIHdhcyB0aGUgZmVhciBhIGxpdHRsZSBxdWlldGVkPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IGluIG15IGhlYXJ0JnJzcXVvO3MgbGFrZSBoYWQgZW5kdXJlZCB0aHJvdWdob3V0PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGUgbmlnaHQsIHdoaWNoIEkgaGFkIHBhc3NlZCBzbyBwaXRlb3VzbHkuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBldmVuIGFzIGhlLCB3aG8sIHdpdGggZGlzdHJlc3NmdWwgYnJlYXRoLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+Rm9ydGggaXNzdWVkIGZyb20gdGhlIHNlYSB1cG9uIHRoZSBzaG9yZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlR1cm5zIHRvIHRoZSB3YXRlciBwZXJpbG91cyBhbmQgZ2F6ZXM7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlNvIGRpZCBteSBzb3VsLCB0aGF0IHN0aWxsIHdhcyBmbGVlaW5nIG9ud2FyZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlR1cm4gaXRzZWxmIGJhY2sgdG8gcmUtYmVob2xkIHRoZSBwYXNzPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBuZXZlciB5ZXQgYSBsaXZpbmcgcGVyc29uIGxlZnQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFmdGVyIG15IHdlYXJ5IGJvZHkgSSBoYWQgcmVzdGVkLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIHdheSByZXN1bWVkIEkgb24gdGhlIGRlc2VydCBzbG9wZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvIHRoYXQgdGhlIGZpcm0gZm9vdCBldmVyIHdhcyB0aGUgbG93ZXIuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBsbyEgYWxtb3N0IHdoZXJlIHRoZSBhc2NlbnQgYmVnYW4sPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BIHBhbnRoZXIgbGlnaHQgYW5kIHN3aWZ0IGV4Y2VlZGluZ2x5LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggd2l0aCBhIHNwb3R0ZWQgc2tpbiB3YXMgY292ZXJlZCBvJnJzcXVvO2VyITwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BbmQgbmV2ZXIgbW92ZWQgc2hlIGZyb20gYmVmb3JlIG15IGZhY2UsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5OYXksIHJhdGhlciBkaWQgaW1wZWRlIHNvIG11Y2ggbXkgd2F5LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBtYW55IHRpbWVzIEkgdG8gcmV0dXJuIGhhZCB0dXJuZWQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoZSB0aW1lIHdhcyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBtb3JuaW5nLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHVwIHRoZSBzdW4gd2FzIG1vdW50aW5nIHdpdGggdGhvc2Ugc3RhcnM8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgd2l0aCBoaW0gd2VyZSwgd2hhdCB0aW1lIHRoZSBMb3ZlIERpdmluZTwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BdCBmaXJzdCBpbiBtb3Rpb24gc2V0IHRob3NlIGJlYXV0ZW91cyB0aGluZ3M7PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5TbyB3ZXJlIHRvIG1lIG9jY2FzaW9uIG9mIGdvb2QgaG9wZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSB2YXJpZWdhdGVkIHNraW4gb2YgdGhhdCB3aWxkIGJlYXN0LDwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaGUgaG91ciBvZiB0aW1lLCBhbmQgdGhlIGRlbGljaW91cyBzZWFzb247PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5CdXQgbm90IHNvIG11Y2gsIHRoYXQgZGlkIG5vdCBnaXZlIG1lIGZlYXI8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkEgbGlvbiZyc3F1bztzIGFzcGVjdCB3aGljaCBhcHBlYXJlZCB0byBtZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+SGUgc2VlbWVkIGFzIGlmIGFnYWluc3QgbWUgaGUgd2VyZSBjb21pbmc8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldpdGggaGVhZCB1cGxpZnRlZCwgYW5kIHdpdGggcmF2ZW5vdXMgaHVuZ2VyLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+U28gdGhhdCBpdCBzZWVtZWQgdGhlIGFpciB3YXMgYWZyYWlkIG9mIGhpbTs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QW5kIGEgc2hlLXdvbGYsIHRoYXQgd2l0aCBhbGwgaHVuZ2VyaW5nczwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+U2VlbWVkIHRvIGJlIGxhZGVuIGluIGhlciBtZWFncmVuZXNzLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIG1hbnkgZm9sayBoYXMgY2F1c2VkIHRvIGxpdmUgZm9ybG9ybiE8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+U2hlIGJyb3VnaHQgdXBvbiBtZSBzbyBtdWNoIGhlYXZpbmVzcyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldpdGggdGhlIGFmZnJpZ2h0IHRoYXQgZnJvbSBoZXIgYXNwZWN0IGNhbWUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IEkgdGhlIGhvcGUgcmVsaW5xdWlzaGVkIG9mIHRoZSBoZWlnaHQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBhcyBoZSBpcyB3aG8gd2lsbGluZ2x5IGFjcXVpcmVzLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHRoZSB0aW1lIGNvbWVzIHRoYXQgY2F1c2VzIGhpbSB0byBsb3NlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hvIHdlZXBzIGluIGFsbCBoaXMgdGhvdWdodHMgYW5kIGlzIGRlc3BvbmRlbnQsPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkUmcnNxdW87ZW4gc3VjaCBtYWRlIG1lIHRoYXQgYmVhc3Qgd2l0aG91dGVuIHBlYWNlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2gsIGNvbWluZyBvbiBhZ2FpbnN0IG1lIGJ5IGRlZ3JlZXM8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRocnVzdCBtZSBiYWNrIHRoaXRoZXIgd2hlcmUgdGhlIHN1biBpcyBzaWxlbnQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPldoaWxlIEkgd2FzIHJ1c2hpbmcgZG93bndhcmQgdG8gdGhlIGxvd2xhbmQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5CZWZvcmUgbWluZSBleWVzIGRpZCBvbmUgcHJlc2VudCBoaW1zZWxmLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hvIHNlZW1lZCBmcm9tIGxvbmctY29udGludWVkIHNpbGVuY2UgaG9hcnNlLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5XaGVuIEkgYmVoZWxkIGhpbSBpbiB0aGUgZGVzZXJ0IHZhc3QsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj4mbGRxdW87SGF2ZSBwaXR5IG9uIG1lLCZyZHF1bzsgdW50byBoaW0gSSBjcmllZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPiZsZHF1bztXaGljaGUmcnNxdW87ZXIgdGhvdSBhcnQsIG9yIHNoYWRlIG9yIHJlYWwgbWFuISZyZHF1bzs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+SGUgYW5zd2VyZWQgbWU6ICZsZHF1bztOb3QgbWFuOyBtYW4gb25jZSBJIHdhcyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBib3RoIG15IHBhcmVudHMgd2VyZSBvZiBMb21iYXJkeSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBNYW50dWFucyBieSBjb3VudHJ5IGJvdGggb2YgdGhlbS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+JmxzcXVvO1N1YiBKdWxpbyZyc3F1bzsgd2FzIEkgYm9ybiwgdGhvdWdoIGl0IHdhcyBsYXRlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGxpdmVkIGF0IFJvbWUgdW5kZXIgdGhlIGdvb2QgQXVndXN0dXMsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5EdXJpbmcgdGhlIHRpbWUgb2YgZmFsc2UgYW5kIGx5aW5nIGdvZHMuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkEgcG9ldCB3YXMgSSwgYW5kIEkgc2FuZyB0aGF0IGp1c3Q8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvbiBvZiBBbmNoaXNlcywgd2hvIGNhbWUgZm9ydGggZnJvbSBUcm95LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QWZ0ZXIgdGhhdCBJbGlvbiB0aGUgc3VwZXJiIHdhcyBidXJuZWQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkJ1dCB0aG91LCB3aHkgZ29lc3QgdGhvdSBiYWNrIHRvIHN1Y2ggYW5ub3lhbmNlPzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2h5IGNsaW1iJnJzcXVvO3N0IHRob3Ugbm90IHRoZSBNb3VudCBEZWxlY3RhYmxlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggaXMgdGhlIHNvdXJjZSBhbmQgY2F1c2Ugb2YgZXZlcnkgam95PyZyZHF1bzs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+JmxkcXVvO05vdywgYXJ0IHRob3UgdGhhdCBWaXJnaWxpdXMgYW5kIHRoYXQgZm91bnRhaW48L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIHNwcmVhZHMgYWJyb2FkIHNvIHdpZGUgYSByaXZlciBvZiBzcGVlY2g/JnJkcXVvOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+SSBtYWRlIHJlc3BvbnNlIHRvIGhpbSB3aXRoIGJhc2hmdWwgZm9yZWhlYWQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPiZsZHF1bztPLCBvZiB0aGUgb3RoZXIgcG9ldHMgaG9ub3VyIGFuZCBsaWdodCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkF2YWlsIG1lIHRoZSBsb25nIHN0dWR5IGFuZCBncmVhdCBsb3ZlPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IGhhdmUgaW1wZWxsZWQgbWUgdG8gZXhwbG9yZSB0aHkgdm9sdW1lITwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaG91IGFydCBteSBtYXN0ZXIsIGFuZCBteSBhdXRob3IgdGhvdSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRob3UgYXJ0IGFsb25lIHRoZSBvbmUgZnJvbSB3aG9tIEkgdG9vazwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIGJlYXV0aWZ1bCBzdHlsZSB0aGF0IGhhcyBkb25lIGhvbm91ciB0byBtZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QmVob2xkIHRoZSBiZWFzdCwgZm9yIHdoaWNoIEkgaGF2ZSB0dXJuZWQgYmFjazs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkRvIHRob3UgcHJvdGVjdCBtZSBmcm9tIGhlciwgZmFtb3VzIFNhZ2UsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gb3Igc2hlIGRvdGggbWFrZSBteSB2ZWlucyBhbmQgcHVsc2VzIHRyZW1ibGUuJnJkcXVvOzwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD4mbGRxdW87VGhlZSBpdCBiZWhvdmVzIHRvIHRha2UgYW5vdGhlciByb2FkLCZyZHF1bzs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlJlc3BvbmRlZCBoZSwgd2hlbiBoZSBiZWhlbGQgbWUgd2VlcGluZyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPiZsZHF1bztJZiBmcm9tIHRoaXMgc2F2YWdlIHBsYWNlIHRob3Ugd291bGRzdCBlc2NhcGU7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkJlY2F1c2UgdGhpcyBiZWFzdCwgYXQgd2hpY2ggdGhvdSBjcmllc3Qgb3V0LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+U3VmZmVycyBub3QgYW55IG9uZSB0byBwYXNzIGhlciB3YXksPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5CdXQgc28gZG90aCBoYXJhc3MgaGltLCB0aGF0IHNoZSBkZXN0cm95cyBoaW07PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBoYXMgYSBuYXR1cmUgc28gbWFsaWduIGFuZCBydXRobGVzcyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgbmV2ZXIgZG90aCBzaGUgZ2x1dCBoZXIgZ3JlZWR5IHdpbGwsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgYWZ0ZXIgZm9vZCBpcyBodW5ncmllciB0aGFuIGJlZm9yZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+TWFueSB0aGUgYW5pbWFscyB3aXRoIHdob20gc2hlIHdlZHMsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgbW9yZSB0aGV5IHNoYWxsIGJlIHN0aWxsLCB1bnRpbCB0aGUgR3JleWhvdW5kPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Db21lcywgd2hvIHNoYWxsIG1ha2UgaGVyIHBlcmlzaCBpbiBoZXIgcGFpbi48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+SGUgc2hhbGwgbm90IGZlZWQgb24gZWl0aGVyIGVhcnRoIG9yIHBlbGYsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5CdXQgdXBvbiB3aXNkb20sIGFuZCBvbiBsb3ZlIGFuZCB2aXJ0dWU7PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj4mcnNxdW87VHdpeHQgRmVsdHJvIGFuZCBGZWx0cm8gc2hhbGwgaGlzIG5hdGlvbiBiZTs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+T2YgdGhhdCBsb3cgSXRhbHkgc2hhbGwgaGUgYmUgdGhlIHNhdmlvdXIsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5PbiB3aG9zZSBhY2NvdW50IHRoZSBtYWlkIENhbWlsbGEgZGllZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkV1cnlhbHVzLCBUdXJudXMsIE5pc3VzLCBvZiB0aGVpciB3b3VuZHM7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRocm91Z2ggZXZlcnkgY2l0eSBzaGFsbCBoZSBodW50IGhlciBkb3duLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VW50aWwgaGUgc2hhbGwgaGF2ZSBkcml2ZW4gaGVyIGJhY2sgdG8gSGVsbCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZXJlIGZyb20gd2hlbmNlIGVudnkgZmlyc3QgZGlkIGxldCBoZXIgbG9vc2UuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoZXJlZm9yZSBJIHRoaW5rIGFuZCBqdWRnZSBpdCBmb3IgdGh5IGJlc3Q8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRob3UgZm9sbG93IG1lLCBhbmQgSSB3aWxsIGJlIHRoeSBndWlkZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBsZWFkIHRoZWUgaGVuY2UgdGhyb3VnaCB0aGUgZXRlcm5hbCBwbGFjZSw8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+V2hlcmUgdGhvdSBzaGFsdCBoZWFyIHRoZSBkZXNwZXJhdGUgbGFtZW50YXRpb25zLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+U2hhbHQgc2VlIHRoZSBhbmNpZW50IHNwaXJpdHMgZGlzY29uc29sYXRlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hvIGNyeSBvdXQgZWFjaCBvbmUgZm9yIHRoZSBzZWNvbmQgZGVhdGg7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCB0aG91IHNoYWx0IHNlZSB0aG9zZSB3aG8gY29udGVudGVkIGFyZTwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2l0aGluIHRoZSBmaXJlLCBiZWNhdXNlIHRoZXkgaG9wZSB0byBjb21lLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hlbmUmcnNxdW87ZXIgaXQgbWF5IGJlLCB0byB0aGUgYmxlc3NlZCBwZW9wbGU7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRvIHdob20sIHRoZW4sIGlmIHRob3Ugd2lzaGVzdCB0byBhc2NlbmQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BIHNvdWwgc2hhbGwgYmUgZm9yIHRoYXQgdGhhbiBJIG1vcmUgd29ydGh5OzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2l0aCBoZXIgYXQgbXkgZGVwYXJ0dXJlIEkgd2lsbCBsZWF2ZSB0aGVlOzwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5CZWNhdXNlIHRoYXQgRW1wZXJvciwgd2hvIHJlaWducyBhYm92ZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkluIHRoYXQgSSB3YXMgcmViZWxsaW91cyB0byBoaXMgbGF3LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2lsbHMgdGhhdCB0aHJvdWdoIG1lIG5vbmUgY29tZSBpbnRvIGhpcyBjaXR5LjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5IZSBnb3Zlcm5zIGV2ZXJ5d2hlcmUsIGFuZCB0aGVyZSBoZSByZWlnbnM7PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGVyZSBpcyBoaXMgY2l0eSBhbmQgaGlzIGxvZnR5IHRocm9uZTs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPk8gaGFwcHkgaGUgd2hvbSB0aGVyZXRvIGhlIGVsZWN0cyEmcmRxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBJIHRvIGhpbTogJmxkcXVvO1BvZXQsIEkgdGhlZSBlbnRyZWF0LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QnkgdGhhdCBzYW1lIEdvZCB3aG9tIHRob3UgZGlkc3QgbmV2ZXIga25vdyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvIHRoYXQgSSBtYXkgZXNjYXBlIHRoaXMgd29lIGFuZCB3b3JzZSw8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VGhvdSB3b3VsZHN0IGNvbmR1Y3QgbWUgdGhlcmUgd2hlcmUgdGhvdSBoYXN0IHNhaWQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IEkgbWF5IHNlZSB0aGUgcG9ydGFsIG9mIFNhaW50IFBldGVyLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHRob3NlIHRob3UgbWFrZXN0IHNvIGRpc2NvbnNvbGF0ZS4mcmRxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoZW4gaGUgbW92ZWQgb24sIGFuZCBJIGJlaGluZCBoaW0gZm9sbG93ZWQuPC9wPlxuXHQ8L2Rpdj5gLFxuXG5cdGA8cCBjbGFzcz1cImNhbnRvaGVhZFwiPkluZmVybm86IENhbnRvIElJPC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+RGF5IHdhcyBkZXBhcnRpbmcsIGFuZCB0aGUgZW1icm93bmVkIGFpcjwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+UmVsZWFzZWQgdGhlIGFuaW1hbHMgdGhhdCBhcmUgb24gZWFydGg8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkZyb20gdGhlaXIgZmF0aWd1ZXM7IGFuZCBJIHRoZSBvbmx5IG9uZTwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5NYWRlIG15c2VsZiByZWFkeSB0byBzdXN0YWluIHRoZSB3YXIsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Cb3RoIG9mIHRoZSB3YXkgYW5kIGxpa2V3aXNlIG9mIHRoZSB3b2UsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBtZW1vcnkgdGhhdCBlcnJzIG5vdCBzaGFsbCByZXRyYWNlLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5PIE11c2VzLCBPIGhpZ2ggZ2VuaXVzLCBub3cgYXNzaXN0IG1lITwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+TyBtZW1vcnksIHRoYXQgZGlkc3Qgd3JpdGUgZG93biB3aGF0IEkgc2F3LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+SGVyZSB0aHkgbm9iaWxpdHkgc2hhbGwgYmUgbWFuaWZlc3QhPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBJIGJlZ2FuOiAmbGRxdW87UG9ldCwgd2hvIGd1aWRlc3QgbWUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5SZWdhcmQgbXkgbWFuaG9vZCwgaWYgaXQgYmUgc3VmZmljaWVudCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkVyZSB0byB0aGUgYXJkdW91cyBwYXNzIHRob3UgZG9zdCBjb25maWRlIG1lLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaG91IHNheWVzdCwgdGhhdCBvZiBTaWx2aXVzIHRoZSBwYXJlbnQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGlsZSB5ZXQgY29ycnVwdGlibGUsIHVudG8gdGhlIHdvcmxkPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5JbW1vcnRhbCB3ZW50LCBhbmQgd2FzIHRoZXJlIGJvZGlseS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QnV0IGlmIHRoZSBhZHZlcnNhcnkgb2YgYWxsIGV2aWw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldhcyBjb3VydGVvdXMsIHRoaW5raW5nIG9mIHRoZSBoaWdoIGVmZmVjdDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBpc3N1ZSB3b3VsZCBmcm9tIGhpbSwgYW5kIHdobywgYW5kIHdoYXQsPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRvIG1lbiBvZiBpbnRlbGxlY3QgdW5tZWV0IGl0IHNlZW1zIG5vdDs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkZvciBoZSB3YXMgb2YgZ3JlYXQgUm9tZSwgYW5kIG9mIGhlciBlbXBpcmU8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkluIHRoZSBlbXB5cmVhbCBoZWF2ZW4gYXMgZmF0aGVyIGNob3Nlbjs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VGhlIHdoaWNoIGFuZCB3aGF0LCB3aXNoaW5nIHRvIHNwZWFrIHRoZSB0cnV0aCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldlcmUgc3RhYmxpc2hlZCBhcyB0aGUgaG9seSBwbGFjZSwgd2hlcmVpbjwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+U2l0cyB0aGUgc3VjY2Vzc29yIG9mIHRoZSBncmVhdGVzdCBQZXRlci48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VXBvbiB0aGlzIGpvdXJuZXksIHdoZW5jZSB0aG91IGdpdmVzdCBoaW0gdmF1bnQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGluZ3MgZGlkIGhlIGhlYXIsIHdoaWNoIHRoZSBvY2Nhc2lvbiB3ZXJlPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Cb3RoIG9mIGhpcyB2aWN0b3J5IGFuZCB0aGUgcGFwYWwgbWFudGxlLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaGl0aGVyIHdlbnQgYWZ0ZXJ3YXJkcyB0aGUgQ2hvc2VuIFZlc3NlbCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRvIGJyaW5nIGJhY2sgY29tZm9ydCB0aGVuY2UgdW50byB0aGF0IEZhaXRoLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hpY2ggb2Ygc2FsdmF0aW9uJnJzcXVvO3Mgd2F5IGlzIHRoZSBiZWdpbm5pbmcuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkJ1dCBJLCB3aHkgdGhpdGhlciBjb21lLCBvciB3aG8gY29uY2VkZXMgaXQ/PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5JIG5vdCBBZW5lYXMgYW0sIEkgYW0gbm90IFBhdWwsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Ob3IgSSwgbm9yIG90aGVycywgdGhpbmsgbWUgd29ydGh5IG9mIGl0LjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaGVyZWZvcmUsIGlmIEkgcmVzaWduIG15c2VsZiB0byBjb21lLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+SSBmZWFyIHRoZSBjb21pbmcgbWF5IGJlIGlsbC1hZHZpc2VkOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhvdSZyc3F1bztydCB3aXNlLCBhbmQga25vd2VzdCBiZXR0ZXIgdGhhbiBJIHNwZWFrLiZyZHF1bzs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QW5kIGFzIGhlIGlzLCB3aG8gdW53aWxscyB3aGF0IGhlIHdpbGxlZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBieSBuZXcgdGhvdWdodHMgZG90aCBoaXMgaW50ZW50aW9uIGNoYW5nZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlNvIHRoYXQgZnJvbSBoaXMgZGVzaWduIGhlIHF1aXRlIHdpdGhkcmF3cyw8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+U3VjaCBJIGJlY2FtZSwgdXBvbiB0aGF0IGRhcmsgaGlsbHNpZGUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5CZWNhdXNlLCBpbiB0aGlua2luZywgSSBjb25zdW1lZCB0aGUgZW1wcmlzZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIHdhcyBzbyB2ZXJ5IHByb21wdCBpbiB0aGUgYmVnaW5uaW5nLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD4mbGRxdW87SWYgSSBoYXZlIHdlbGwgdGh5IGxhbmd1YWdlIHVuZGVyc3Rvb2QsJnJkcXVvOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+UmVwbGllZCB0aGF0IHNoYWRlIG9mIHRoZSBNYWduYW5pbW91cyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPiZsZHF1bztUaHkgc291bCBhdHRhaW50ZWQgaXMgd2l0aCBjb3dhcmRpY2UsPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPldoaWNoIG1hbnkgdGltZXMgYSBtYW4gZW5jdW1iZXJzIHNvLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+SXQgdHVybnMgaGltIGJhY2sgZnJvbSBob25vdXJlZCBlbnRlcnByaXNlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QXMgZmFsc2Ugc2lnaHQgZG90aCBhIGJlYXN0LCB3aGVuIGhlIGlzIHNoeS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VGhhdCB0aG91IG1heXN0IGZyZWUgdGhlZSBmcm9tIHRoaXMgYXBwcmVoZW5zaW9uLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+SSZyc3F1bztsbCB0ZWxsIHRoZWUgd2h5IEkgY2FtZSwgYW5kIHdoYXQgSSBoZWFyZDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QXQgdGhlIGZpcnN0IG1vbWVudCB3aGVuIEkgZ3JpZXZlZCBmb3IgdGhlZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QW1vbmcgdGhvc2Ugd2FzIEkgd2hvIGFyZSBpbiBzdXNwZW5zZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBhIGZhaXIsIHNhaW50bHkgTGFkeSBjYWxsZWQgdG8gbWU8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkluIHN1Y2ggd2lzZSwgSSBiZXNvdWdodCBoZXIgdG8gY29tbWFuZCBtZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+SGVyIGV5ZXMgd2hlcmUgc2hpbmluZyBicmlnaHRlciB0aGFuIHRoZSBTdGFyOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHNoZSBiZWdhbiB0byBzYXksIGdlbnRsZSBhbmQgbG93LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2l0aCB2b2ljZSBhbmdlbGljYWwsIGluIGhlciBvd24gbGFuZ3VhZ2U6PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPiZsc3F1bztPIHNwaXJpdCBjb3VydGVvdXMgb2YgTWFudHVhLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+T2Ygd2hvbSB0aGUgZmFtZSBzdGlsbCBpbiB0aGUgd29ybGQgZW5kdXJlcyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBzaGFsbCBlbmR1cmUsIGxvbmctbGFzdGluZyBhcyB0aGUgd29ybGQ7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkEgZnJpZW5kIG9mIG1pbmUsIGFuZCBub3QgdGhlIGZyaWVuZCBvZiBmb3J0dW5lLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VXBvbiB0aGUgZGVzZXJ0IHNsb3BlIGlzIHNvIGltcGVkZWQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlVwb24gaGlzIHdheSwgdGhhdCBoZSBoYXMgdHVybmVkIHRocm91Z2ggdGVycm9yLDwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BbmQgbWF5LCBJIGZlYXIsIGFscmVhZHkgYmUgc28gbG9zdCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgSSB0b28gbGF0ZSBoYXZlIHJpc2VuIHRvIGhpcyBzdWNjb3VyLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+RnJvbSB0aGF0IHdoaWNoIEkgaGF2ZSBoZWFyZCBvZiBoaW0gaW4gSGVhdmVuLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5CZXN0aXIgdGhlZSBub3csIGFuZCB3aXRoIHRoeSBzcGVlY2ggb3JuYXRlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHdpdGggd2hhdCBuZWVkZnVsIGlzIGZvciBoaXMgcmVsZWFzZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFzc2lzdCBoaW0gc28sIHRoYXQgSSBtYXkgYmUgY29uc29sZWQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkJlYXRyaWNlIGFtIEksIHdobyBkbyBiaWQgdGhlZSBnbzs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkkgY29tZSBmcm9tIHRoZXJlLCB3aGVyZSBJIHdvdWxkIGZhaW4gcmV0dXJuOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+TG92ZSBtb3ZlZCBtZSwgd2hpY2ggY29tcGVsbGV0aCBtZSB0byBzcGVhay48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+V2hlbiBJIHNoYWxsIGJlIGluIHByZXNlbmNlIG9mIG15IExvcmQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5GdWxsIG9mdGVuIHdpbGwgSSBwcmFpc2UgdGhlZSB1bnRvIGhpbS4mcnNxdW87PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGVuIHBhdXNlZCBzaGUsIGFuZCB0aGVyZWFmdGVyIEkgYmVnYW46PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPiZsc3F1bztPIExhZHkgb2YgdmlydHVlLCB0aG91IGFsb25lIHRocm91Z2ggd2hvbTwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIGh1bWFuIHJhY2UgZXhjZWVkZXRoIGFsbCBjb250YWluZWQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldpdGhpbiB0aGUgaGVhdmVuIHRoYXQgaGFzIHRoZSBsZXNzZXIgY2lyY2xlcyw8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+U28gZ3JhdGVmdWwgdW50byBtZSBpcyB0aHkgY29tbWFuZG1lbnQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UbyBvYmV5LCBpZiAmbHNxdW87dHdlcmUgYWxyZWFkeSBkb25lLCB3ZXJlIGxhdGU7PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5ObyBmYXJ0aGVyIG5lZWQmbHNxdW87c3QgdGhvdSBvcGUgdG8gbWUgdGh5IHdpc2guPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkJ1dCB0aGUgY2F1c2UgdGVsbCBtZSB3aHkgdGhvdSBkb3N0IG5vdCBzaHVuPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGUgaGVyZSBkZXNjZW5kaW5nIGRvd24gaW50byB0aGlzIGNlbnRyZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkZyb20gdGhlIHZhc3QgcGxhY2UgdGhvdSBidXJuZXN0IHRvIHJldHVybiB0by4mcnNxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPiZsc3F1bztTaW5jZSB0aG91IHdvdWxkc3QgZmFpbiBzbyBpbndhcmRseSBkaXNjZXJuLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QnJpZWZseSB3aWxsIEkgcmVsYXRlLCZyc3F1bzsgc2hlIGFuc3dlcmVkIG1lLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+JmxzcXVvO1doeSBJIGFtIG5vdCBhZnJhaWQgdG8gZW50ZXIgaGVyZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+T2YgdGhvc2UgdGhpbmdzIG9ubHkgc2hvdWxkIG9uZSBiZSBhZnJhaWQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIGhhdmUgdGhlIHBvd2VyIG9mIGRvaW5nIG90aGVycyBoYXJtOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+T2YgdGhlIHJlc3QsIG5vOyBiZWNhdXNlIHRoZXkgYXJlIG5vdCBmZWFyZnVsLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5Hb2QgaW4gaGlzIG1lcmN5IHN1Y2ggY3JlYXRlZCBtZTwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBtaXNlcnkgb2YgeW91cnMgYXR0YWlucyBtZSBub3QsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Ob3IgYW55IGZsYW1lIGFzc2FpbHMgbWUgb2YgdGhpcyBidXJuaW5nLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BIGdlbnRsZSBMYWR5IGlzIGluIEhlYXZlbiwgd2hvIGdyaWV2ZXM8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkF0IHRoaXMgaW1wZWRpbWVudCwgdG8gd2hpY2ggSSBzZW5kIHRoZWUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5TbyB0aGF0IHN0ZXJuIGp1ZGdtZW50IHRoZXJlIGFib3ZlIGlzIGJyb2tlbi48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+SW4gaGVyIGVudHJlYXR5IHNoZSBiZXNvdWdodCBMdWNpYSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBzYWlkLCAmbGRxdW87VGh5IGZhaXRoZnVsIG9uZSBub3cgc3RhbmRzIGluIG5lZWQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPk9mIHRoZWUsIGFuZCB1bnRvIHRoZWUgSSByZWNvbW1lbmQgaGltLiZyZHF1bzs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+THVjaWEsIGZvZSBvZiBhbGwgdGhhdCBjcnVlbCBpcyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkhhc3RlbmVkIGF3YXksIGFuZCBjYW1lIHVudG8gdGhlIHBsYWNlPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGVyZSBJIHdhcyBzaXR0aW5nIHdpdGggdGhlIGFuY2llbnQgUmFjaGVsLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD4mbGRxdW87QmVhdHJpY2UmcmRxdW87IHNhaWQgc2hlLCAmbGRxdW87dGhlIHRydWUgcHJhaXNlIG9mIEdvZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoeSBzdWNjb3VyZXN0IHRob3Ugbm90IGhpbSwgd2hvIGxvdmVkIHRoZWUgc28sPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gb3IgdGhlZSBoZSBpc3N1ZWQgZnJvbSB0aGUgdnVsZ2FyIGhlcmQ/PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkRvc3QgdGhvdSBub3QgaGVhciB0aGUgcGl0eSBvZiBoaXMgcGxhaW50PzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+RG9zdCB0aG91IG5vdCBzZWUgdGhlIGRlYXRoIHRoYXQgY29tYmF0cyBoaW08L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkJlc2lkZSB0aGF0IGZsb29kLCB3aGVyZSBvY2VhbiBoYXMgbm8gdmF1bnQ/JnJkcXVvOzwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5OZXZlciB3ZXJlIHBlcnNvbnMgaW4gdGhlIHdvcmxkIHNvIHN3aWZ0PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UbyB3b3JrIHRoZWlyIHdlYWwgYW5kIHRvIGVzY2FwZSB0aGVpciB3b2UsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BcyBJLCBhZnRlciBzdWNoIHdvcmRzIGFzIHRoZXNlIHdlcmUgdXR0ZXJlZCw8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+Q2FtZSBoaXRoZXIgZG93bndhcmQgZnJvbSBteSBibGVzc2VkIHNlYXQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Db25maWRpbmcgaW4gdGh5IGRpZ25pZmllZCBkaXNjb3Vyc2UsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBob25vdXJzIHRoZWUsIGFuZCB0aG9zZSB3aG8mcnNxdW87dmUgbGlzdGVuZWQgdG8gaXQuJnJzcXVvOzwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BZnRlciBzaGUgdGh1cyBoYWQgc3Bva2VuIHVudG8gbWUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XZWVwaW5nLCBoZXIgc2hpbmluZyBleWVzIHNoZSB0dXJuZWQgYXdheTs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoZXJlYnkgc2hlIG1hZGUgbWUgc3dpZnRlciBpbiBteSBjb21pbmc7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCB1bnRvIHRoZWUgSSBjYW1lLCBhcyBzaGUgZGVzaXJlZDs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkkgaGF2ZSBkZWxpdmVyZWQgdGhlZSBmcm9tIHRoYXQgd2lsZCBiZWFzdCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoIGJhcnJlZCB0aGUgYmVhdXRpZnVsIG1vdW50YWluJnJzcXVvO3Mgc2hvcnQgYXNjZW50LjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5XaGF0IGlzIGl0LCB0aGVuPyAgV2h5LCB3aHkgZG9zdCB0aG91IGRlbGF5PzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2h5IGlzIHN1Y2ggYmFzZW5lc3MgYmVkZGVkIGluIHRoeSBoZWFydD88L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkRhcmluZyBhbmQgaGFyZGlob29kIHdoeSBoYXN0IHRob3Ugbm90LDwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5TZWVpbmcgdGhhdCB0aHJlZSBzdWNoIExhZGllcyBiZW5lZGlnaHQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFyZSBjYXJpbmcgZm9yIHRoZWUgaW4gdGhlIGNvdXJ0IG9mIEhlYXZlbiw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBzbyBtdWNoIGdvb2QgbXkgc3BlZWNoIGRvdGggcHJvbWlzZSB0aGVlPyZyZHF1bzs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+RXZlbiBhcyB0aGUgZmxvd2VyZXRzLCBieSBub2N0dXJuYWwgY2hpbGwsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Cb3dlZCBkb3duIGFuZCBjbG9zZWQsIHdoZW4gdGhlIHN1biB3aGl0ZW5zIHRoZW0sPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5VcGxpZnQgdGhlbXNlbHZlcyBhbGwgb3BlbiBvbiB0aGVpciBzdGVtczs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+U3VjaCBJIGJlY2FtZSB3aXRoIG15IGV4aGF1c3RlZCBzdHJlbmd0aCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBzdWNoIGdvb2QgY291cmFnZSB0byBteSBoZWFydCB0aGVyZSBjb3Vyc2VkLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCBJIGJlZ2FuLCBsaWtlIGFuIGludHJlcGlkIHBlcnNvbjo8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+JmxkcXVvO08gc2hlIGNvbXBhc3Npb25hdGUsIHdobyBzdWNjb3VyZWQgbWUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BbmQgY291cnRlb3VzIHRob3UsIHdobyBoYXN0IG9iZXllZCBzbyBzb29uPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGUgd29yZHMgb2YgdHJ1dGggd2hpY2ggc2hlIGFkZHJlc3NlZCB0byB0aGVlITwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaG91IGhhc3QgbXkgaGVhcnQgc28gd2l0aCBkZXNpcmUgZGlzcG9zZWQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRvIHRoZSBhZHZlbnR1cmUsIHdpdGggdGhlc2Ugd29yZHMgb2YgdGhpbmUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IHRvIG15IGZpcnN0IGludGVudCBJIGhhdmUgcmV0dXJuZWQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPk5vdyBnbywgZm9yIG9uZSBzb2xlIHdpbGwgaXMgaW4gdXMgYm90aCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRob3UgTGVhZGVyLCBhbmQgdGhvdSBMb3JkLCBhbmQgTWFzdGVyIHRob3UuJnJkcXVvOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGh1cyBzYWlkIEkgdG8gaGltOyBhbmQgd2hlbiBoZSBoYWQgbW92ZWQsPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkkgZW50ZXJlZCBvbiB0aGUgZGVlcCBhbmQgc2F2YWdlIHdheS48L3A+XG5cdDwvZGl2PmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+SW5mZXJubzogQ2FudG8gSUlJPC9wPlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+JmxkcXVvO1Rocm91Z2ggbWUgdGhlIHdheSBpcyB0byB0aGUgY2l0eSBkb2xlbnQ7PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaHJvdWdoIG1lIHRoZSB3YXkgaXMgdG8gZXRlcm5hbCBkb2xlOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhyb3VnaCBtZSB0aGUgd2F5IGFtb25nIHRoZSBwZW9wbGUgbG9zdC48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+SnVzdGljZSBpbmNpdGVkIG15IHN1YmxpbWUgQ3JlYXRvcjs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkNyZWF0ZWQgbWUgZGl2aW5lIE9tbmlwb3RlbmNlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhlIGhpZ2hlc3QgV2lzZG9tIGFuZCB0aGUgcHJpbWFsIExvdmUuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkJlZm9yZSBtZSB0aGVyZSB3ZXJlIG5vIGNyZWF0ZWQgdGhpbmdzLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+T25seSBldGVybmUsIGFuZCBJIGV0ZXJuYWwgbGFzdC48L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFsbCBob3BlIGFiYW5kb24sIHllIHdobyBlbnRlciBpbiEmcmRxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoZXNlIHdvcmRzIGluIHNvbWJyZSBjb2xvdXIgSSBiZWhlbGQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldyaXR0ZW4gdXBvbiB0aGUgc3VtbWl0IG9mIGEgZ2F0ZTs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoZW5jZSBJOiAmbGRxdW87VGhlaXIgc2Vuc2UgaXMsIE1hc3RlciwgaGFyZCB0byBtZSEmcmRxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBoZSB0byBtZSwgYXMgb25lIGV4cGVyaWVuY2VkOjwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+JmxkcXVvO0hlcmUgYWxsIHN1c3BpY2lvbiBuZWVkcyBtdXN0IGJlIGFiYW5kb25lZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFsbCBjb3dhcmRpY2UgbXVzdCBuZWVkcyBiZSBoZXJlIGV4dGluY3QuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPldlIHRvIHRoZSBwbGFjZSBoYXZlIGNvbWUsIHdoZXJlIEkgaGF2ZSB0b2xkIHRoZWU8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRob3Ugc2hhbHQgYmVob2xkIHRoZSBwZW9wbGUgZG9sb3JvdXM8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldobyBoYXZlIGZvcmVnb25lIHRoZSBnb29kIG9mIGludGVsbGVjdC4mcmRxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBhZnRlciBoZSBoYWQgbGFpZCBoaXMgaGFuZCBvbiBtaW5lPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaXRoIGpveWZ1bCBtaWVuLCB3aGVuY2UgSSB3YXMgY29tZm9ydGVkLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+SGUgbGVkIG1lIGluIGFtb25nIHRoZSBzZWNyZXQgdGhpbmdzLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaGVyZSBzaWdocywgY29tcGxhaW50cywgYW5kIHVsdWxhdGlvbnMgbG91ZDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+UmVzb3VuZGVkIHRocm91Z2ggdGhlIGFpciB3aXRob3V0IGEgc3Rhciw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoZW5jZSBJLCBhdCB0aGUgYmVnaW5uaW5nLCB3ZXB0IHRoZXJlYXQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkxhbmd1YWdlcyBkaXZlcnNlLCBob3JyaWJsZSBkaWFsZWN0cyw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFjY2VudHMgb2YgYW5nZXIsIHdvcmRzIG9mIGFnb255LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHZvaWNlcyBoaWdoIGFuZCBob2Fyc2UsIHdpdGggc291bmQgb2YgaGFuZHMsPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPk1hZGUgdXAgYSB0dW11bHQgdGhhdCBnb2VzIHdoaXJsaW5nIG9uPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Gb3IgZXZlciBpbiB0aGF0IGFpciBmb3IgZXZlciBibGFjayw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkV2ZW4gYXMgdGhlIHNhbmQgZG90aCwgd2hlbiB0aGUgd2hpcmx3aW5kIGJyZWF0aGVzLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BbmQgSSwgd2hvIGhhZCBteSBoZWFkIHdpdGggaG9ycm9yIGJvdW5kLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+U2FpZDogJmxkcXVvO01hc3Rlciwgd2hhdCBpcyB0aGlzIHdoaWNoIG5vdyBJIGhlYXI/PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGF0IGZvbGsgaXMgdGhpcywgd2hpY2ggc2VlbXMgYnkgcGFpbiBzbyB2YW5xdWlzaGVkPyZyZHF1bzs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QW5kIGhlIHRvIG1lOiAmbGRxdW87VGhpcyBtaXNlcmFibGUgbW9kZTwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+TWFpbnRhaW4gdGhlIG1lbGFuY2hvbHkgc291bHMgb2YgdGhvc2U8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldobyBsaXZlZCB3aXRob3V0ZW4gaW5mYW15IG9yIHByYWlzZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+Q29tbWluZ2xlZCBhcmUgdGhleSB3aXRoIHRoYXQgY2FpdGlmZiBjaG9pcjwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+T2YgQW5nZWxzLCB3aG8gaGF2ZSBub3QgcmViZWxsaW91cyBiZWVuLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+Tm9yIGZhaXRoZnVsIHdlcmUgdG8gR29kLCBidXQgd2VyZSBmb3Igc2VsZi48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VGhlIGhlYXZlbnMgZXhwZWxsZWQgdGhlbSwgbm90IHRvIGJlIGxlc3MgZmFpcjs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPk5vciB0aGVtIHRoZSBuZXRoZXJtb3JlIGFieXNzIHJlY2VpdmVzLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+Rm9yIGdsb3J5IG5vbmUgdGhlIGRhbW5lZCB3b3VsZCBoYXZlIGZyb20gdGhlbS4mcmRxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBJOiAmbGRxdW87TyBNYXN0ZXIsIHdoYXQgc28gZ3JpZXZvdXMgaXM8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRvIHRoZXNlLCB0aGF0IG1ha2V0aCB0aGVtIGxhbWVudCBzbyBzb3JlPyZyZHF1bzs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkhlIGFuc3dlcmVkOiAmbGRxdW87SSB3aWxsIHRlbGwgdGhlZSB2ZXJ5IGJyaWVmbHkuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoZXNlIGhhdmUgbm8gbG9uZ2VyIGFueSBob3BlIG9mIGRlYXRoOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIHRoaXMgYmxpbmQgbGlmZSBvZiB0aGVpcnMgaXMgc28gZGViYXNlZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZXkgZW52aW91cyBhcmUgb2YgZXZlcnkgb3RoZXIgZmF0ZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+Tm8gZmFtZSBvZiB0aGVtIHRoZSB3b3JsZCBwZXJtaXRzIHRvIGJlOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+TWlzZXJpY29yZCBhbmQgSnVzdGljZSBib3RoIGRpc2RhaW4gdGhlbS48L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkxldCB1cyBub3Qgc3BlYWsgb2YgdGhlbSwgYnV0IGxvb2ssIGFuZCBwYXNzLiZyZHF1bzs8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QW5kIEksIHdobyBsb29rZWQgYWdhaW4sIGJlaGVsZCBhIGJhbm5lciw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoLCB3aGlybGluZyByb3VuZCwgcmFuIG9uIHNvIHJhcGlkbHksPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGF0IG9mIGFsbCBwYXVzZSBpdCBzZWVtZWQgdG8gbWUgaW5kaWduYW50OzwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BbmQgYWZ0ZXIgaXQgdGhlcmUgY2FtZSBzbyBsb25nIGEgdHJhaW48L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPk9mIHBlb3BsZSwgdGhhdCBJIG5lJnJzcXVvO2VyIHdvdWxkIGhhdmUgYmVsaWV2ZWQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgZXZlciBEZWF0aCBzbyBtYW55IGhhZCB1bmRvbmUuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPldoZW4gc29tZSBhbW9uZyB0aGVtIEkgaGFkIHJlY29nbmlzZWQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5JIGxvb2tlZCwgYW5kIEkgYmVoZWxkIHRoZSBzaGFkZSBvZiBoaW08L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldobyBtYWRlIHRocm91Z2ggY293YXJkaWNlIHRoZSBncmVhdCByZWZ1c2FsLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5Gb3J0aHdpdGggSSBjb21wcmVoZW5kZWQsIGFuZCB3YXMgY2VydGFpbiw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoYXQgdGhpcyB0aGUgc2VjdCB3YXMgb2YgdGhlIGNhaXRpZmYgd3JldGNoZXM8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkhhdGVmdWwgdG8gR29kIGFuZCB0byBoaXMgZW5lbWllcy48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VGhlc2UgbWlzY3JlYW50cywgd2hvIG5ldmVyIHdlcmUgYWxpdmUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XZXJlIG5ha2VkLCBhbmQgd2VyZSBzdHVuZyBleGNlZWRpbmdseTwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QnkgZ2FkZmxpZXMgYW5kIGJ5IGhvcm5ldHMgdGhhdCB3ZXJlIHRoZXJlLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaGVzZSBkaWQgdGhlaXIgZmFjZXMgaXJyaWdhdGUgd2l0aCBibG9vZCw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPldoaWNoLCB3aXRoIHRoZWlyIHRlYXJzIGNvbW1pbmdsZWQsIGF0IHRoZWlyIGZlZXQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkJ5IHRoZSBkaXNndXN0aW5nIHdvcm1zIHdhcyBnYXRoZXJlZCB1cC48L3A+XG48L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCB3aGVuIHRvIGdhemluZyBmYXJ0aGVyIEkgYmV0b29rIG1lLjwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+UGVvcGxlIEkgc2F3IG9uIGEgZ3JlYXQgcml2ZXImcnNxdW87cyBiYW5rOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2hlbmNlIHNhaWQgSTogJmxkcXVvO01hc3Rlciwgbm93IHZvdWNoc2FmZSB0byBtZSw8L3A+XG48L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoYXQgSSBtYXkga25vdyB3aG8gdGhlc2UgYXJlLCBhbmQgd2hhdCBsYXc8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPk1ha2VzIHRoZW0gYXBwZWFyIHNvIHJlYWR5IHRvIHBhc3Mgb3Zlciw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFzIEkgZGlzY2VybiBhdGh3YXJ0IHRoZSBkdXNreSBsaWdodC4mcmRxdW87PC9wPlxuPC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BbmQgaGUgdG8gbWU6ICZsZHF1bztUaGVzZSB0aGluZ3Mgc2hhbGwgYWxsIGJlIGtub3duPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UbyB0aGVlLCBhcyBzb29uIGFzIHdlIG91ciBmb290c3RlcHMgc3RheTwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VXBvbiB0aGUgZGlzbWFsIHNob3JlIG9mIEFjaGVyb24uJnJkcXVvOzwvcD5cbjwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VGhlbiB3aXRoIG1pbmUgZXllcyBhc2hhbWVkIGFuZCBkb3dud2FyZCBjYXN0LDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+RmVhcmluZyBteSB3b3JkcyBtaWdodCBpcmtzb21lIGJlIHRvIGhpbSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkZyb20gc3BlZWNoIHJlZnJhaW5lZCBJIHRpbGwgd2UgcmVhY2hlZCB0aGUgcml2ZXIuPC9wPlxuPC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BbmQgbG8hIHRvd2FyZHMgdXMgY29taW5nIGluIGEgYm9hdDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW4gb2xkIG1hbiwgaG9hcnkgd2l0aCB0aGUgaGFpciBvZiBlbGQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5Dcnlpbmc6ICZsZHF1bztXb2UgdW50byB5b3UsIHllIHNvdWxzIGRlcHJhdmVkITwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5Ib3BlIG5ldmVybW9yZSB0byBsb29rIHVwb24gdGhlIGhlYXZlbnM7PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5JIGNvbWUgdG8gbGVhZCB5b3UgdG8gdGhlIG90aGVyIHNob3JlLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VG8gdGhlIGV0ZXJuYWwgc2hhZGVzIGluIGhlYXQgYW5kIGZyb3N0LjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BbmQgdGhvdSwgdGhhdCB5b25kZXIgc3RhbmRlc3QsIGxpdmluZyBzb3VsLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+V2l0aGRyYXcgdGhlZSBmcm9tIHRoZXNlIHBlb3BsZSwgd2hvIGFyZSBkZWFkISZyZHF1bzs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkJ1dCB3aGVuIGhlIHNhdyB0aGF0IEkgZGlkIG5vdCB3aXRoZHJhdyw8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+SGUgc2FpZDogJmxkcXVvO0J5IG90aGVyIHdheXMsIGJ5IG90aGVyIHBvcnRzPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaG91IHRvIHRoZSBzaG9yZSBzaGFsdCBjb21lLCBub3QgaGVyZSwgZm9yIHBhc3NhZ2U7PC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BIGxpZ2h0ZXIgdmVzc2VsIG5lZWRzIG11c3QgY2FycnkgdGhlZS4mcmRxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCB1bnRvIGhpbSB0aGUgR3VpZGU6ICZsZHF1bztWZXggdGhlZSBub3QsIENoYXJvbjs8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkl0IGlzIHNvIHdpbGxlZCB0aGVyZSB3aGVyZSBpcyBwb3dlciB0byBkbzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+VGhhdCB3aGljaCBpcyB3aWxsZWQ7IGFuZCBmYXJ0aGVyIHF1ZXN0aW9uIG5vdC4mcmRxdW87PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoZXJlYXQgd2VyZSBxdWlldGVkIHRoZSBmbGVlY3kgY2hlZWtzPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5PZiBoaW0gdGhlIGZlcnJ5bWFuIG9mIHRoZSBsaXZpZCBmZW4sPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaG8gcm91bmQgYWJvdXQgaGlzIGV5ZXMgaGFkIHdoZWVscyBvZiBmbGFtZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+QnV0IGFsbCB0aG9zZSBzb3VscyB3aG8gd2Vhcnkgd2VyZSBhbmQgbmFrZWQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZWlyIGNvbG91ciBjaGFuZ2VkIGFuZCBnbmFzaGVkIHRoZWlyIHRlZXRoIHRvZ2V0aGVyLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QXMgc29vbiBhcyB0aGV5IGhhZCBoZWFyZCB0aG9zZSBjcnVlbCB3b3Jkcy48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+R29kIHRoZXkgYmxhc3BoZW1lZCBhbmQgdGhlaXIgcHJvZ2VuaXRvcnMsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UaGUgaHVtYW4gcmFjZSwgdGhlIHBsYWNlLCB0aGUgdGltZSwgdGhlIHNlZWQ8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPk9mIHRoZWlyIGVuZ2VuZGVyaW5nIGFuZCBvZiB0aGVpciBiaXJ0aCE8L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VGhlcmVhZnRlciBhbGwgdG9nZXRoZXIgdGhleSBkcmV3IGJhY2ssPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5CaXR0ZXJseSB3ZWVwaW5nLCB0byB0aGUgYWNjdXJzZWQgc2hvcmUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCB3YWl0ZXRoIGV2ZXJ5IG1hbiB3aG8gZmVhcnMgbm90IEdvZC48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+Q2hhcm9uIHRoZSBkZW1vbiwgd2l0aCB0aGUgZXllcyBvZiBnbGVkZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkJlY2tvbmluZyB0byB0aGVtLCBjb2xsZWN0cyB0aGVtIGFsbCB0b2dldGhlciw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkJlYXRzIHdpdGggaGlzIG9hciB3aG9ldmVyIGxhZ3MgYmVoaW5kLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5BcyBpbiB0aGUgYXV0dW1uLXRpbWUgdGhlIGxlYXZlcyBmYWxsIG9mZiw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkZpcnN0IG9uZSBhbmQgdGhlbiBhbm90aGVyLCB0aWxsIHRoZSBicmFuY2g8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlVudG8gdGhlIGVhcnRoIHN1cnJlbmRlcnMgYWxsIGl0cyBzcG9pbHM7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkluIHNpbWlsYXIgd2lzZSB0aGUgZXZpbCBzZWVkIG9mIEFkYW08L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRocm93IHRoZW1zZWx2ZXMgZnJvbSB0aGF0IG1hcmdpbiBvbmUgYnkgb25lLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QXQgc2lnbmFscywgYXMgYSBiaXJkIHVudG8gaXRzIGx1cmUuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlNvIHRoZXkgZGVwYXJ0IGFjcm9zcyB0aGUgZHVza3kgd2F2ZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPkFuZCBlcmUgdXBvbiB0aGUgb3RoZXIgc2lkZSB0aGV5IGxhbmQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5BZ2FpbiBvbiB0aGlzIHNpZGUgYSBuZXcgdHJvb3AgYXNzZW1ibGVzLjwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD4mbGRxdW87TXkgc29uLCZyZHF1bzsgdGhlIGNvdXJ0ZW91cyBNYXN0ZXIgc2FpZCB0byBtZSw8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPiZsZHF1bztBbGwgdGhvc2Ugd2hvIHBlcmlzaCBpbiB0aGUgd3JhdGggb2YgR29kPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5IZXJlIG1lZXQgdG9nZXRoZXIgb3V0IG9mIGV2ZXJ5IGxhbmQ7PC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCByZWFkeSBhcmUgdGhleSB0byBwYXNzIG8mcnNxdW87ZXIgdGhlIHJpdmVyLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QmVjYXVzZSBjZWxlc3RpYWwgSnVzdGljZSBzcHVycyB0aGVtIG9uLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+U28gdGhhdCB0aGVpciBmZWFyIGlzIHR1cm5lZCBpbnRvIGRlc2lyZS48L3A+XG5cdDwvZGl2PlxuXHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0PHA+VGhpcyB3YXkgdGhlcmUgbmV2ZXIgcGFzc2VzIGEgZ29vZCBzb3VsOzwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGhlbmNlIGlmIENoYXJvbiBkb3RoIGNvbXBsYWluIG9mIHRoZWUsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XZWxsIG1heXN0IHRob3Uga25vdyBub3cgd2hhdCBoaXMgc3BlZWNoIGltcG9ydHMuJnJkcXVvOzwvcD5cblx0PC9kaXY+XG5cdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHQ8cD5UaGlzIGJlaW5nIGZpbmlzaGVkLCBhbGwgdGhlIGR1c2sgY2hhbXBhaWduPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5UcmVtYmxlZCBzbyB2aW9sZW50bHksIHRoYXQgb2YgdGhhdCB0ZXJyb3I8L3A+XG5cdFx0PHAgY2xhc3M9XCJzbGluZGVudFwiPlRoZSByZWNvbGxlY3Rpb24gYmF0aGVzIG1lIHN0aWxsIHdpdGggc3dlYXQuPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPlRoZSBsYW5kIG9mIHRlYXJzIGdhdmUgZm9ydGggYSBibGFzdCBvZiB3aW5kLDwvcD5cblx0XHQ8cCBjbGFzcz1cInNsaW5kZW50XCI+QW5kIGZ1bG1pbmF0ZWQgYSB2ZXJtaWxpb24gbGlnaHQsPC9wPlxuXHRcdDxwIGNsYXNzPVwic2xpbmRlbnRcIj5XaGljaCBvdmVybWFzdGVyZWQgaW4gbWUgZXZlcnkgc2Vuc2UsPC9wPlxuXHQ8L2Rpdj5cblx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdDxwPkFuZCBhcyBhIG1hbiB3aG9tIHNsZWVwIGhhdGggc2VpemVkIEkgZmVsbC48L3A+XG5cdDwvZGl2PmBdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGxvbmdmZWxsb3c7XG4iLCIvLyBub3J0b24uanNcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IG5vcnRvbiA9IFtgPHAgY2xhc3M9XCJ0aXRsZVwiPkhlbGw8L3A+XG5cdDxwIGNsYXNzPVwiYXV0aG9yXCI+Q2hhcmxlcyBFbGlvdCBOb3J0b248L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DQU5UTyBJPC9wPlxuXHRcdDxwIGNsYXNzPVwic3VtbWFyeVwiPkRhbnRlLCBhc3RyYXkgaW4gYSB3b29kLCByZWFjaGVzIHRoZSBmb290IG9mIGEgaGlsbCB3aGljaCBoZSBiZWdpbnMgdG8gYXNjZW5kOyBoZSBpcyBoaW5kZXJlZCBieSB0aHJlZSBiZWFzdHM7IGhlIHR1cm5zIGJhY2sgYW5kIGlzIG1ldCBieSBWaXJnaWwsIHdobyBwcm9wb3NlcyB0byBndWlkZSBoaW0gaW50byB0aGUgZXRlcm5hbCB3b3JsZC48L3A+XG5cdFx0PHA+TWlkd2F5IHVwb24gdGhlIHJvYWQgb2Ygb3VyIGxpZmUgSSBmb3VuZCBteXNlbGYgd2l0aGluIGEgZGFyayB3b29kLCBmb3IgdGhlIHJpZ2h0IHdheSBoYWQgYmVlbiBtaXNzZWQuIEFoISBob3cgaGFyZCBhIHRoaW5nIGl0IGlzIHRvIHRlbGwgd2hhdCB0aGlzIHdpbGQgYW5kIHJvdWdoIGFuZCBkZW5zZSB3b29kIHdhcywgd2hpY2ggaW4gdGhvdWdodCByZW5ld3MgdGhlIGZlYXIhIFNvIGJpdHRlciBpcyBpdCB0aGF0IGRlYXRoIGlzIGxpdHRsZSBtb3JlLiBCdXQgaW4gb3JkZXIgdG8gdHJlYXQgb2YgdGhlIGdvb2QgdGhhdCB0aGVyZSBJIGZvdW5kLCBJIHdpbGwgdGVsbCBvZiB0aGUgb3RoZXIgdGhpbmdzIHRoYXQgSSBoYXZlIHNlZW4gdGhlcmUuIEkgY2Fubm90IHdlbGwgcmVjb3VudCBob3cgSSBlbnRlcmVkIGl0LCBzbyBmdWxsIHdhcyBJIG9mIHNsdW1iZXIgYXQgdGhhdCBwb2ludCB3aGVyZSBJIGFiYW5kb25lZCB0aGUgdHJ1ZSB3YXkuIEJ1dCBhZnRlciBJIGhhZCBhcnJpdmVkIGF0IHRoZSBmb290IG9mIGEgaGlsbCwgd2hlcmUgdGhhdCB2YWxsZXkgZW5kZWQgd2hpY2ggaGFkIHBpZXJjZWQgbXkgaGVhcnQgd2l0aCBmZWFyLCBJIGxvb2tlZCBvbiBoaWdoLCBhbmQgc2F3IGl0cyBzaG91bGRlcnMgY2xvdGhlZCBhbHJlYWR5IHdpdGggdGhlIHJheXMgb2YgdGhlIHBsYW5ldFxuXHRcdFx0PHNwYW4gY2xhc3M9XCJub3RlXCI+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZW5vXCI+MTwvc3Bhbj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZSBzdW4sIGEgcGxhbmV0IGFjY29yZGluZyB0byB0aGUgUHRvbGVtYWljIHN5c3RlbS48L3NwYW4+XG5cdFx0XHQ8L3NwYW4+XG5cdFx0dGhhdCBsZWFkZXRoIG1lbiBhcmlnaHQgYWxvbmcgZXZlcnkgcGF0aC4gVGhlbiB3YXMgdGhlIGZlYXIgYSBsaXR0bGUgcXVpZXRlZCB3aGljaCBpbiB0aGUgbGFrZSBvZiBteSBoZWFydCBoYWQgbGFzdGVkIHRocm91Z2ggdGhlIG5pZ2h0IHRoYXQgSSBwYXNzZWQgc28gcGl0ZW91c2x5LiBBbmQgZXZlbiBhcyBvbmUgd2hvIHdpdGggc3BlbnQgYnJlYXRoLCBpc3N1ZWQgb3V0IG9mIHRoZSBzZWEgdXBvbiB0aGUgc2hvcmUsIHR1cm5zIHRvIHRoZSBwZXJpbG91cyB3YXRlciBhbmQgZ2F6ZXMsIHNvIGRpZCBteSBzb3VsLCB3aGljaCBzdGlsbCB3YXMgZmx5aW5nLCB0dXJuIGJhY2sgdG8gbG9vayBhZ2FpbiB1cG9uIHRoZSBwYXNzIHdoaWNoIG5ldmVyIGhhZCBhIGxpdmluZyBwZXJzb24gbGVmdC48L3A+XG5cdFx0PHA+QWZ0ZXIgSSBoYWQgcmVzdGVkIGEgbGl0dGxlIG15IHdlYXJ5IGJvZHkgSSB0b29rIG15IHdheSBhZ2FpbiBhbG9uZyB0aGUgZGVzZXJ0IHNsb3BlLCBzbyB0aGF0IHRoZSBmaXJtIGZvb3Qgd2FzIGFsd2F5cyB0aGUgbG93ZXIuIEFuZCBobyEgYWxtb3N0IGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0ZWVwIGEgc2hlLWxlb3BhcmQsIGxpZ2h0IGFuZCB2ZXJ5IG5pbWJsZSwgd2hpY2ggd2FzIGNvdmVyZWQgd2l0aCBhIHNwb3R0ZWQgY29hdC4gQW5kIHNoZSBkaWQgbm90IG1vdmUgZnJvbSBiZWZvcmUgbXkgZmFjZSwgbmF5LCByYXRoZXIgaGluZGVyZWQgc28gbXkgcm9hZCB0aGF0IHRvIHJldHVybiBJIG9mdGVudGltZXMgaGFkIHR1cm5lZC48L3A+XG5cdFx0PHA+VGhlIHRpbWUgd2FzIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1vcm5pbmcsIGFuZCB0aGUgU3VuIHdhcyBtb3VudGluZyB1cHdhcmQgd2l0aCB0aG9zZSBzdGFycyB0aGF0IHdlcmUgd2l0aCBoaW0gd2hlbiBMb3ZlIERpdmluZSBmaXJzdCBzZXQgaW4gbW90aW9uIHRob3NlIGJlYXV0aWZ1bCB0aGluZ3M7XG5cdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVcIj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4yPC9zcGFuPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+QWNjb3JkaW5nIHRvIG9sZCB0cmFkaXRpb24gdGhlIHNwcmluZyB3YXMgdGhlIHNlYXNvbiBvZiB0aGUgY3JlYXRpb24uPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdHNvIHRoYXQgdGhlIGhvdXIgb2YgdGhlIHRpbWUgYW5kIHRoZSBzd2VldCBzZWFzb24gd2VyZSBvY2Nhc2lvbiBvZiBnb29kIGhvcGUgdG8gbWUgY29uY2VybmluZyB0aGF0IHdpbGQgYmVhc3Qgd2l0aCB0aGUgZGFwcGxlZCBza2luLiBCdXQgbm90IHNvIHRoYXQgdGhlIHNpZ2h0IHdoaWNoIGFwcGVhcmVkIHRvIG1lIG9mIGEgbGlvbiBkaWQgbm90IGdpdmUgbWUgZmVhci4gSGUgc2VlbWVkIHRvIGJlIGNvbWluZyBhZ2FpbnN0IG1lLCB3aXRoIGhlYWQgaGlnaCBhbmQgd2l0aCByYXZlbmluZyBodW5nZXIsIHNvIHRoYXQgaXQgc2VlbWVkIHRoYXQgdGhlIGFpciB3YXMgYWZmcmlnaHRlZCBhdCBoaW0uIEFuZCBhIHNoZS13b2xmLFxuXHRcdFx0PHNwYW4gY2xhc3M9XCJub3RlXCI+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZW5vXCI+Mjwvc3Bhbj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPlRoZXNlIHRocmVlIGJlYXN0cyBjb3JyZXNwb25kIHRvIHRoZSB0cmlwbGUgZGl2aXNpb24gb2Ygc2lucyBpbnRvIHRob3NlIG9mIGluY29udGluZW5jZSwgb2YgdmlvbGVuY2UsIGFuZCBvZiBmcmF1ZC4gU2VlIENhbnRvIFhJLjwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHR3aG8gd2l0aCBhbGwgY3JhdmluZ3Mgc2VlbWVkIGxhZGVuIGluIGhlciBtZWFncmVuZXNzLCBhbmQgYWxyZWFkeSBoYWQgbWFkZSBtYW55IGZvbGsgdG8gbGl2ZSBmb3Jsb3JuLCZtZGFzaDtzaGUgY2F1c2VkIG1lIHNvIG11Y2ggaGVhdmluZXNzLCB3aXRoIHRoZSBmZWFyIHRoYXQgY2FtZSBmcm9tIHNpZ2h0IG9mIGhlciwgdGhhdCBJIGxvc3QgaG9wZSBvZiB0aGUgaGVpZ2h0LiBBbmQgc3VjaCBhcyBoZSBpcyB3aG8gZ2FpbmV0aCB3aWxsaW5nbHksIGFuZCB0aGUgdGltZSBhcnJpdmVzIHRoYXQgbWFrZXMgaGltIGxvc2UsIHdobyBpbiBhbGwgaGlzIHRob3VnaHRzIHdlZXBzIGFuZCBpcyBzYWQsJm1kYXNoO3N1Y2ggbWFkZSBtZSB0aGUgYmVhc3Qgd2l0aG91dCByZXBvc2UgdGhhdCwgY29taW5nIG9uIGFnYWluc3QgbWUsIGxpdHRsZSBieSBsaXR0bGUgd2FzIHB1c2hpbmcgbWUgYmFjayB0aGl0aGVyIHdoZXJlIHRoZSBTdW4gaXMgc2lsZW50LjwvcD5cblx0XHQ8cD5XaGlsZSBJIHdhcyBmYWxsaW5nIGJhY2sgdG8gdGhlIGxvdyBwbGFjZSwgYmVmb3JlIG1pbmUgZXllcyBhcHBlYXJlZCBvbmUgd2hvIHRocm91Z2ggbG9uZyBzaWxlbmNlIHNlZW1lZCBob2Fyc2UuIFdoZW4gSSBzYXcgaGltIGluIHRoZSBncmVhdCBkZXNlcnQsICZsZHF1bztIYXZlIHBpdHkgb24gbWUhJnJkcXVvOyBJIGNyaWVkIHRvIGhpbSwgJmxkcXVvO3doYXRzbyB0aG91IGFydCwgb3Igc2hhZGUgb3IgcmVhbCBtYW4uJnJkcXVvOyBIZSBhbnN3ZXJlZCBtZTogJmxkcXVvO05vdCBtYW47IG1hbiBvbmNlIEkgd2FzLCBhbmQgbXkgcGFyZW50cyB3ZXJlIExvbWJhcmRzLCBhbmQgTWFudHVhbnMgYnkgY291bnRyeSBib3RoLiBJIHdhcyBib3JuIHN1YiBKdWxpbywgdGhvdWdoIGxhdGUsIGFuZCBJIGxpdmVkIGF0IFJvbWUgdW5kZXIgdGhlIGdvb2QgQXVndXN0dXMsIGluIHRoZSB0aW1lIG9mIHRoZSBmYWxzZSBhbmQgbHlpbmcgZ29kcy4gUG9ldCB3YXMgSSwgYW5kIHNhbmcgb2YgdGhhdCBqdXN0IHNvbiBvZiBBbmNoaXNlcyB3aG8gY2FtZSBmcm9tIFRyb3kgYWZ0ZXIgcHJvdWQgSWxpb24gaGFkIGJlZW4gYnVybmVkLiBCdXQgdGhvdSwgd2h5IHJldHVybmVzdCB0aG91IHRvIHNvIGdyZWF0IGFubm95PyBXaHkgZG9zdCB0aG91IG5vdCBhc2NlbmQgdGhlIGRlbGVjdGFibGUgbW91bnRhaW4gd2hpY2ggaXMgdGhlIHNvdXJjZSBhbmQgY2F1c2Ugb2YgZXZlcnkgam95PyZyZHF1bzs8L3A+XG5cdFx0PHA+JmxkcXVvO0FydCB0aG91IHRoZW4gdGhhdCBWaXJnaWwgYW5kIHRoYXQgZm91bnQgd2hpY2ggcG91cmV0aCBmb3J0aCBzbyBsYXJnZSBhIHN0cmVhbSBvZiBzcGVlY2g/JnJkcXVvOyByZXBsaWVkIEkgdG8gaGltIHdpdGggYmFzaGZ1bCBmcm9udDogJmxkcXVvO08gaG9ub3IgYW5kIGxpZ2h0IG9mIHRoZSBvdGhlciBwb2VtIEkgbWF5IHRoZSBsb25nIHNlYWwgYXZhaWwgbWUsIGFuZCB0aGUgZ3JlYXQgbG92ZSwgd2hpY2ggaGF2ZSBtYWRlIG1lIHNlYXJjaCB0aHkgdm9sdW1lISBUaG91IGFydCBteSBtYXN0ZXIgYW5kIG15IGF1dGhvcjsgdGhvdSBhbG9uZSBhcnQgaGUgZnJvbSB3aG9tIEkgdG9vayB0aGUgZmFpciBzdHlsZSB0aGF0IGhhdGggZG9uZSBtZSBob25vci4gQmVob2xkIHRoZSBiZWFzdCBiZWNhdXNlIG9mIHdoaWNoIEkgdHVybmVkOyBoZWxwIG1lIGFnYWluc3QgaGVyLCBmYW1vdXMgc2FnZSwgZm9yIHNoZSBtYWtlcyBhbnkgdmVpbnMgYW5kIHB1bHNlcyB0cmVtYmxlLiZyZHF1bzsgJmxkcXVvO1RoZWUgaXQgYmVob3ZlcyB0byBob2xkIGFub3RoZXIgY291cnNlLCZyZHF1bzsgaGUgcmVwbGllZCwgd2hlbiBoZSBzYXcgbWUgd2VlcGluZywgJmxkcXVvO2lmIHRob3Ugd2lzaGVzdCB0byBlc2NhcGUgZnJvbSB0aGlzIHNhdmFnZSBwbGFjZTsgZm9yIHRoaXMgYmVhc3QsIGJlY2F1c2Ugb2Ygd2hpY2ggdGhvdSBjcmllc3Qgb3V0LCBsZXRzIG5vdCBhbnkgb25lIHBhc3MgYWxvbmcgaGVyIHdheSwgYnV0IHNvIGhpbmRlcnMgaGltIHRoYXQgc2hlIGtpbGxzIGhpbSEgYW5kIHNoZSBoYXMgYSBuYXR1cmUgc28gbWFsaWduIGFuZCBldmlsIHRoYXQgc2hlIG5ldmVyIHNhdGVzIGhlciBncmVlZHkgd2lsbCwgYW5kIGFmdGVyIGZvb2QgaXMgaHVuZ3JpZXIgdGhhbiBiZWZvcmUuIE1hbnkgYXJlIHRoZSBhbmltYWxzIHdpdGggd2hpY2ggc2hlIHdpdmVzLCBhbmQgdGhlcmUgc2hhbGwgYmUgbW9yZSB5ZXQsIHRpbGwgdGhlIGhvdW5kXG5cdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVcIj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4xPC9zcGFuPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+T2Ygd2hvbSB0aGUgaG91bmQgaXMgdGhlIHN5bWJvbCwgYW5kIHRvIHdob20gRGFudGUgbG9va2VkIGZvciB0aGUgZGVsaXZlcmFuY2Ugb2YgSXRhbHkgZnJvbSB0aGUgZGlzY29yZGEgYW5kIG1pc3J1bGUgdGhhdCBtYWRlIGhlciB3cmV0Y2hlZCwgaXMgc3RpbGwgbWF0dGVyIG9mIGRvdWJ0LCBhZnRlciBjZW50dXJpZXMgb2YgY29udHJvdmVyc3kuPC9zcGFuPlxuXHRcdDwvc3Bhbj5cblx0XHRzaGFsbCBjb21lIHRoYXQgd2lsbCBtYWtlIGhlciBkaWUgb2YgZ3JpZWYuIEhlIHNoYWxsIG5vdCBmZWVkIG9uIGxhbmQgb3IgZ29vZHMsIGJ1dCB3aXNkb20gYW5kIGxvdmUgYW5kIHZhbG9yLCBhbmQgaGlzIGJpcnRocGxhY2Ugc2hhbGwgYmUgYmV0d2VlbiBGZWx0cm8gYW5kIEZlbHRyby4gT2YgdGhhdCBodW1ibGVcblx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZVwiPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVub1wiPjI8L3NwYW4+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5GYWxsZW4sIGh1bWlsaWF0ZWQuPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdEl0YWx5IHNoYWxsIGhlIGJlIHRoZSBzYWx2YXRpb24sIGZvciB3aGljaCB0aGUgdmlyZ2luIENhbWlsbGEgZGllZCwgYW5kIEV1cnlhbHVzLCBUdXJudXMgYW5kIE5pc3VzIG9mIHRoZWlyIHdvdW5kcy4gSGUgc2hhbGwgaHVudCBoZXIgdGhyb3VnaCBldmVyeSB0b3duIHRpbGwgaGUgc2hhbGwgaGF2ZSBzZXQgaGVyIGJhY2sgaW4gaGVsbCwgdGhlcmUgd2hlbmNlIGVudnkgZmlyc3Qgc2VudCBoZXIgZm9ydGguIFdoZXJlZm9yZSBJIHRoaW5rIGFuZCBkZWVtIGl0IGZvciB0aHkgYmVzdCB0aGF0IHRob3UgZm9sbG93IG1lLCBhbmQgSSB3aWxsIGJlIHRoeSBndWlkZSwgYW5kIHdpbGwgbGVhZCB0aGVlIGhlbmNlIHRocm91Z2ggdGhlIGV0ZXJuYWwgcGxhY2Ugd2hlcmUgdGhvdSBzaGFsdCBoZWFyIHRoZSBkZXNwYWlyaW5nIHNocmlla3MsIHNoYWx0IHNlZSB0aGUgYW5jaWVudCBzcGlyaXRzIHdvZWZ1bCB3aG8gZWFjaCBwcm9jbGFpbSB0aGUgc2Vjb25kIGRlYXRoLiBBbmQgdGhlbiB0aG91IHNoYWx0IHNlZSB0aG9zZSB3aG8gYXJlIGNvbnRlbnRlZCBpbiB0aGUgZmlyZSwgYmVjYXVzZSB0aGV5IGhvcGUgdG8gY29tZSwgd2hlbmV2ZXIgaXQgbWF5IGJlLCB0byB0aGUgYmxlc3NlZCBmb2xrOyB0byB3aG9tIGlmIHRob3Ugd2lsdCB0aGVyZWFmdGVyIGFzY2VuZCwgdGhlbSBzaGFsbCBiZSBhIHNvdWwgbW9yZSB3b3J0aHkgdGhhbiBJIGZvciB0aGF0LiBXaXRoIGhlciBJIHdpbGwgbGVhdmUgdGhlZSBhdCBteSBkZXBhcnR1cmU7IGZvciB0aGF0IEVtcGVyb3Igd2hvIHJlaWduZXRoIHRoZW0gYWJvdmUsIGJlY2F1c2UgSSB3YXMgcmViZWxsaW91cyB0byBIaXMgbGF3LCB3aWxscyBub3QgdGhhdCBpbnRvIEhpcyBjaXR5IGFueSBvbmUgc2hvdWxkIGNvbWUgdGhyb3VnaCBtZS4gSW4gYWxsIHBhcnRzIEhlIGdvdmVybnMgYW5kIHRoZW0gSGUgcmVpZ25zOiB0aGVyZSBpbiBIaXMgY2l0eSBhbmQgSGlzIGxvZnR5IHNlYXQuIE8gaGFwcHkgaGUgd2hvbSB0aGVyZXRvIEhlIGVsZWN0cyEmcmRxdW87IEFuZCBJIHRvIGhpbSwgJmxkcXVvO1BvZXQsIEkgYmVzZWVjaCB0aGVlIGJ5IHRoYXQgR29kIHdob20gdGhvdSBkaWRzdCBub3Qga25vdywgaW4gb3JkZXIgdGhhdCBJIG1heSBlc2NhcGUgdGhpcyBpbGwgYW5kIHdvcnNlLCB0aGF0IHRob3UgbGVhZCBtZSB0aGl0aGVyIHdob20gdGhvdSBub3cgaGVzdCBzYWlkLCBzbyB0aGF0IEkgbWF5IHNlZSB0aGUgZ2F0ZSBvZiBTdC4gUGV0ZXIsIGFuZCB0aG9zZSB3aG9tIHRob3UgbWFrZXN0IHNvIGFmZmxpY3RlZC4mcmRxdW87PC9wPlxuXHRcdDxwPlRoZW4gaGUgbW92ZWQgb24sIGFuZCBJIGJlaGluZCBoaW0ga2VwdC48L3A+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DQU5UTyBJSTwvcD5cblx0XHQ8cCBjbGFzcz1cInN1bW1hcnlcIj5EYW50ZSwgZG91YnRmdWwgb2YgaGlzIG93biBwb3dlcnMsIGlzIGRpc2NvdXJhZ2VkIGF0IHRoZSBvdXRzZXQuJm1kYXNoO1ZpcmdpbCBjaGVlcnMgaGltIGJ5IHRlbGxpbmcgaGltIHRoYXQgaGUgaGFzIGJlZW4gc2VudCB0byBoaXMgYWlkIGJ5IGEgYmxlc3NlZCBTcGlyaXQgZnJvbSBIZWF2ZW4uJm1kYXNoO0RhbnRlIGNhc3RzIG9mZiBmZWFyLCBhbmQgdGhlIHBvZXRzIHByb2NlZWQuPC9wPlxuXHRcdDxwPlRoZSBkYXkgd2FzIGdvaW5nLCBhbmQgdGhlIGR1c2t5IGFpciB3YXMgdGFraW5nIHRoZSBsaXZpbmcgdGhpbmdzIHRoYXQgYXJlIG9uIGVhcnRoIGZyb20gdGhlaXIgZmF0aWd1ZXMsIGFuZCBJIGFsb25lIHdhcyBwcmVwYXJpbmcgdG8gc3VzdGFpbiB0aGUgd2FyIGFsaWtlIG9mIHRoZSByb2FkLCBhbmQgb2YgdGhlIHdvZSB3aGljaCB0aGUgbWluZCB0aGF0IGVycmV0aCBub3Qgc2hhbGwgcmV0cmFjZS4gTyBNdXNlcywgTyBsb2Z0eSBnZW5pdXMsIG5vdyBhc3Npc3QgbWUhIE8gbWluZCB0aGF0IGRpZHN0IGluc2NyaWJlIHRoYXQgd2hpY2ggSSBzYXcsIGhlcmUgc2hhbGwgdGh5IG5vYmlsaXR5IGFwcGVhciEgSSBiZWdhbjombWRhc2g7JmxkcXVvO1BvZXQsIHRoYXQgZ3VpZGVzdCBtZSwgY29uc2lkZXIgbXkgdmlydHVlLCBpZiBpdCBpcyBzdWZmaWNpZW50LCBlcmUgdG8gdGhlIGRlZXAgcGFzcyB0aG91IHRydXN0ZXN0IG1lLiBUaG91IHNheWVzdCB0aGF0IHRoZSBwYXJlbnQgb2YgU2lsdml1cyB3aGlsZSBzdGlsbCBjb3JydXB0aWJsZSB3ZW50IHRvIHRoZSBpbW1vcnRhbCB3b3JsZCBhbmQgd2FzIHRoZXJlIGluIHRoZSBib2R5LiBXaGVyZWZvcmUgaWYgdGhlIEFkdmVyc2FyeSBvZiBldmVyeSBpbGwgd2FzIHRoZW4gY291cnRlb3VzLCB0aGlua2luZyBvbiB0aGUgaGlnaCBlZmZlY3QgdGhhdCBzaG91bGQgcHJvY2VlZCBmcm9tIGhpbSwgYW5kIG9uIHRoZSBXaG8gYW5kIHRoZSBXaGF0LFxuXHRcdFx0PHNwYW4gY2xhc3M9XCJub3RlXCI+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZW5vXCI+MTwvc3Bhbj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPldobyBoZSB3YXMsIGFuZCB3aGF0IHNob3VsZCByZXN1bHQuPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdGl0IHNlZW1ldGggbm90IHVubWVldCB0byB0aGUgbWFuIG9mIHVuZGVyc3RhbmRpbmc7IGZvciBpbiB0aGUgZW1weXJlYWwgaGVhdmVuIGhlIGhhZCBiZWVuIGNob3NlbiBmb3IgZmF0aGVyIG9mIHJldmVyZWQgUm9tZSBhbmQgb2YgaGVyIGVtcGlyZTsgYm90aCB3aGljaCAodG8gc2F5IHRydXRoIGluZGVlZCkgd2VyZSBvcmRhaW5lZCBmb3IgdGhlIGhvbHkgcGxhY2Ugd2hlcmUgdGhlIHN1Y2Nlc3NvciBvZiB0aGUgZ3JlYXRlciBQZXRlciBoYXRoIGhpcyBzZWF0LiBUaHJvdWdoIHRoaXMgZ29pbmcsIHdoZXJlb2YgdGhvdSBnaXZlc3QgaGltIHZhdW50LCBoZSBsZWFybmVkIHRoaW5ncyB3aGljaCB3ZXJlIHRoZSBjYXVzZSBvZiBoaXMgdmljdG9yeSBhbmQgb2YgdGhlIHBhcGFsIG1hbnRsZS4gQWZ0ZXJ3YXJkIHRoZSBDaG9zZW4gVmVzc2VsIHdlbnQgdGhpdGhlciB0byBicmluZyB0aGVuY2UgY29tZm9ydCB0byB0aGF0IGZhaXRoIHdoaWNoIGlzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIHdheSBvZiBzYWx2YXRpb24uIEJ1dCBJLCB3aHkgZ28gSSB0aGl0aGVyPyBvciB3aG8gY29uY2VkZXMgaXQ/IEkgYW0gbm90IEFlbmVhcywgSSBhbSBub3QgUGF1bDsgbWUgd29ydGh5IG9mIHRoaXMsIG5laXRoZXIgSSBub3Igb3RoZXJzIHRoaW5rOyB3aGVyZWZvcmUgaWYgSSBnaXZlIG15c2VsZiB1cCB0byBnbywgSSBmZWFyIGxlc3QgdGhlIGdvaW5nIG1heSBiZSBtYWQuIFRob3UgYXJ0IHdpc2UsIHRob3UgdW5kZXJzdGFuZGVzdCBiZXR0ZXIgdGhhbiBJIHNwZWFrLiZyZHF1bzs8L3A+XG5cdFx0PHA+QW5kIGFzIGlzIGhlIHdobyB1bndpbGxzIHdoYXQgaGUgd2lsbGVkLCBhbmQgYmVjYXVzZSBvZiBuZXcgdGhvdWdodHMgY2hhbmdlcyBoaXMgZGVzaWduLCBzbyB0aGF0IGhlIHF1aXRlIHdpdGhkcmF3cyBmcm9tIGJlZ2lubmluZywgc3VjaCBJIGJlY2FtZSBvbiB0aGF0IGRhcmsgaGlsbHNpZGU6IHdoZXJlZm9yZSBpbiBteSB0aG91Z2h0IEkgYWJhbmRvbmVkIHRoZSBlbnRlcnByaXNlIHdoaWNoIGhhZCBiZWVuIHNvIGhhc3R5IGluIHRoZSBiZWdpbm5pbmcuPC9wPlxuXHRcdDxwPiZsZHF1bztJZiBJIGhhdmUgcmlnaHRseSB1bmRlcnN0b29kIHRoeSBzcGVlY2gsJnJkcXVvOyByZXBsaWVkIHRoYXQgc2hhZGUgb2YgdGhlIG1hZ25hbmltb3VzIG9uZSwgJmxkcXVvO3RoeSBzb3VsIGlzIGh1cnQgYnkgY293YXJkaWNlLCB3aGljaCBvZnRlbnRpbWVzIGVuY3VtYmVyZXRoIGEgbWFuIHNvIHRoYXQgaXQgdHVybnMgaGltIGJhY2sgZnJvbSBob25vcmFibGUgZW50ZXJwcmlzZSwgYXMgZmFsc2Ugc2VlaW5nIGRvZXMgYSBiZWFzdCB3aGVuIGl0IGlzIHN0YXJ0bGVkLiBJbiBvcmRlciB0aGF0IHRob3UgbG9vc2UgdGhlZSBmcm9tIHRoaXMgZmVhciBJIHdpbGwgdGVsbCB0aGVlIHdoZXJlZm9yZSBJIGhhdmUgY29tZSwgYW5kIHdoYXQgSSBoZWFyZCBhdCB0aGUgZmlyc3QgbW9tZW50IHRoYXQgSSBncmlldmVkIGZvciB0aGVlLiBJIHdhcyBhbW9uZyB0aG9zZSB3aG8gYXJlIHN1c3BlbmRlZCxcblx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZVwiPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5JbiBMaW1ibywgbmVpdGhlciBpbiBIZWxsIG5vciBIZWF2ZW4uPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdGFuZCBhIExhZHkgY2FsbGVkIG1lLCBzbyBibGVzc2VkIGFuZCBiZWF1dGlmdWwgdGhhdCBJIGJlc291Z2h0IGhlciB0byBjb21tYW5kLiBIZXIgZXllcyB3ZXJlIG1vcmUgbHVjZW50IHRoYW4gdGhlIHN0YXIsIGFuZCBzaGUgYmVnYW4gdG8gc3BlYWsgdG8gbWUgc3dlZXQgYW5kIGxvdywgd2l0aCBhbmdlbGljIHZvaWNlLCBpbiBoZXIgb3duIHRvbmd1ZTogJmxzcXVvO08gY291cnRlb3VzIE1hbnR1YW4gc291bCwgb2Ygd2hvbSB0aGUgZmFtZSB5ZXQgbGFzdGV0aCBpbiB0aGUgd29ybGQsIGFuZCBzaGFsbCBsYXN0IHNvIGxvbmcgYXMgdGhlIHdvcmxkIGVuZHVyZXRoISBhIGZyaWVuZCBvZiBtaW5lIGFuZCBub3Qgb2YgZm9ydHVuZSB1cG9uIHRoZSBkZXNlcnQgaGlsbHNpZGUgaXMgc28gaGluZGVyZWQgb24gaGlzIHJvYWQgdGhhdCBoZSBoYXMgdHVybmVkIGZvciBmZWFyLCBhbmQgSSBhbSBhZnJhaWQsIHRocm91Z2ggdGhhdCB3aGljaCBJIGhhdmUgaGVhcmQgb2YgaGltIGluIGhlYXZlbiwgbGVzdCBhbHJlYWR5IGhlIGJlIHNvIGFzdHJheSB0aGF0IEkgbWF5IGhhdmUgcmlzZW4gbGF0ZSB0byBoaXMgc3VjY29yLiBOb3cgZG8gdGhvdSBtb3ZlLCBhbmQgd2l0aCB0aHkgc3BlZWNoIG9ybmF0ZSwgYW5kIHdpdGggd2hhdGV2ZXIgaXMgbmVlZGZ1bCBmb3IgaGlzIGRlbGl2ZXJhbmNlLCBhc3Npc3QgaGltIHNvIHRoYXQgSSBtYXkgYmUgY29uc29sZWQgZm9yIGhpbS4gSSBhbSBCZWF0cmljZSB3aG8gbWFrZSB0aGVlIGdvLiBJIGNvbWUgZnJvbSBhIHBsYWNlIHdoaXRoZXIgSSBkZXNpcmUgdG8gcmV0dXJuLiBMb3ZlIG1vdmVkIG1lLCBhbmQgbWFrZXMgbWUgc3BlYWsuIFdoZW4gSSBzaGFsbCBiZSBiZWZvcmUgbXkgTG9yZCwgSSB3aWxsIGNvbW1lbmQgdGhlZSBvZnRlbiB1bnRvIEhpbS4mcnNxdW87IFRoZW4gc2hlIHdhcyBzaWxlbnQsIGFuZCB0aGVyZW9uIEkgYmVnYW46ICZsc3F1bztPIExhZHkgb2YgVmlydHVlLCB0aG91IGFsb25lIHRocm91Z2ggd2hvbSB0aGUgaHVtYW4gcmFjZSBzdXJwYXNzZXRoIGFsbCBjb250YWluZWQgd2l0aGluIHRoYXQgaGVhdmVuIHdoaWNoIGhhdGggdGhlIHNtYWxsZXN0IGNpcmNsZXMhXG5cdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVcIj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3Rlbm9cIj4yPC9zcGFuPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGV0ZXh0XCI+VGhlIGhlYXZlbiBvZiB0aGUgbW9vbiwgbmVhcmVzdCB0byB0aGUgZWFydGguPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdHNvIHBsZWFzaW5nIHVudG8gbWUgaXMgdGh5IGNvbW1hbmQgdGhhdCB0byBvYmV5IGl0LCB3ZXJlIGl0IGFscmVhZHkgZG9uZSwgd2VyZSBzbG93IHRvIG1lLiBUaG91IGhhc3Qgbm8gbmVlZCBmdXJ0aGVyIHRvIG9wZW4gdW50byBtZSB0aHkgd2lsbDsgYnV0IHRlbGwgbWUgdGhlIGNhdXNlIHdoeSB0aG91IGd1YXJkZXN0IG5vdCB0aHlzZWxmIGZyb20gZGVzY2VuZGluZyBkb3duIGhlcmUgaW50byB0aGlzIGNlbnRyZSwgZnJvbSB0aGUgYW1wbGUgcGxhY2Ugd2hpdGhlciB0aG91IGJ1cm5lc3QgdG8gcmV0dXJuLiZsc3F1bzsgJnJzcXVvO1NpbmNlIHRob3Ugd2lzaGVzdCB0byBrbm93IHNvIGlud2FyZGx5LCBJIHdpbGwgdGVsbCB0aGVlIGJyaWVmbHksJnJzcXVvOyBzaGUgcmVwbGllZCB0byBtZSwgJmxzcXVvO3doZXJlZm9yZSBJIGZlYXIgbm90IHRvIGNvbWUgaGVyZSB3aXRoaW4uIE9uZSBvdWdodCB0byBmZWFyIHRob3NlIHRoaW5ncyBvbmx5IHRoYXQgaGF2ZSBwb3dlciBvZiBkb2luZyBoYXJtLCB0aGUgb3RoZXJzIG5vdCwgZm9yIHRoZXkgYXJlIG5vdCBkcmVhZGZ1bC4gSSBhbSBtYWRlIGJ5IEdvZCwgdGhhbmtzIGJlIHRvIEhpbSwgc3VjaCB0aGF0IHlvdXIgbWlzZXJ5IHRvdWNoZXRoIG1lIG5vdCwgbm9yIGRvdGggdGhlIGZsYW1lIG9mIHRoaXMgYnVybmluZyBhc3NhaWwgbWUuIEEgZ2VudGxlIExhZHlcblx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZVwiPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVub1wiPjM8L3NwYW4+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5UaGUgVmlyZ2luLjwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHRpcyBpbiBoZWF2ZW4gd2hvIGhhdGggcGl0eSBmb3IgdGhpcyBoaW5kcmFuY2Ugd2hlcmV0byBJIHNlbmQgdGhlZSwgc28gdGhhdCBzdGVybiBqdWRnbWVudCB0aGVyZSBhYm92ZSBzaGUgYnJlYWtldGguIFNoZSBzdW1tb25lZCBMdWNpYSBpbiBoZXIgcmVxdWVzdCwgYW5kIHNhaWQsICZsZHF1bztUaHkgZmFpdGhmdWwgb25lIG5vdyBoYXRoIG5lZWQgb2YgdGhlZSwgYW5kIHVudG8gdGhlZSBJIGNvbW1lbmQgaGltLiZyZHF1bzsgTHVjaWEsIHRoZSBmb2Ugb2YgZXZlcnkgY3J1ZWwgb25lLCByb3NlIGFuZCBjYW1lIHRvIHRoZSBwbGFjZSB3aGVyZSBJIHdhcywgc2VhdGVkIHdpdGggdGhlIGFuY2llbnQgUmFjaGVsLiBTaGUgc2FpZCwgJmxkcXVvO0JlYXRyaWNlLCB0cnVlIHByYWlzZSBvZiBHb2QsIHdoeSBkb3N0IHRob3Ugbm90IHN1Y2NvciBoaW0gd2hvIHNvIGxvdmVkIHRoZWUgdGhhdCBmb3IgdGhlZSBoZSBjYW1lIGZvcnRoIGZyb20gdGhlIHZ1bGdhciB0aHJvbmc/IERvc3QgdGhvdSBub3QgaGVhciB0aGUgcGl0eSBvZiBoaXMgcGxhaW50PyBEb3N0IHRob3Ugbm90IHNlZSB0aGUgZGVhdGggdGhhdCBjb21iYXRzIGhpbSBiZXNpZGUgdGhlIHN0cmVhbSB3aGVyZW9mIHRoZSBzZWEgaGF0aCBubyB2YXVudD8mcmRxdW87IEluIHRoZSB3b3JsZCBuZXZlciB3ZXJlIHBlcnNvbnMgc3dpZnQgdG8gc2VlayB0aGVpciBnb29kLCBhbmQgdG8gZmx5IHRoZWlyIGhhcm0sIGFzIEksIGFmdGVyIHRoZXNlIHdvcmRzIHdlcmUgdXR0ZXJlZCwgY2FtZSBoZXJlIGJlbG93LCBmcm9tIG15IGJsZXNzZWQgc2VhdCwgcHV0dGluZyBteSB0cnVzdCBpbiB0aHkgdXByaWdodCBzcGVlY2gsIHdoaWNoIGhvbm9ycyB0aGVlIGFuZCB0aGVtIHdobyBoYXZlIGhlYXJkIGl0LiZyc3F1bzsgQWZ0ZXIgc2hlIGhhZCBzYWlkIHRoaXMgdG8gbWUsIHdlZXBpbmcgc2hlIHR1cm5lZCBoZXIgbHVjZW50IGV5ZXMsIHdoZXJlYnkgc2hlIG1hZGUgbWUgbW9yZSBzcGVlZHkgaW4gY29taW5nLiBBbmQgSSBjYW1lIHRvIHRoZWUgYXMgc2hlIHdpbGxlZC4gVGhlZSBoYXZlIEkgZGVsaXZlcmVkIGZyb20gdGhhdCB3aWxkIGJlYXN0IHRoYXQgdG9vayBmcm9tIHRoZWUgdGhlIHNob3J0IGFzY2VudCBvZiB0aGUgYmVhdXRpZnVsIG1vdW50YWluLiBXaGF0IGlzIGl0IHRoZW4/IFdoeSwgd2h5IGRvc3QgdGhvdSBob2xkIGJhY2s/IHdoeSBkb3N0IHRob3UgaGFyYm9yIHN1Y2ggY293YXJkaWNlIGluIHRoeSBoZWFydD8gd2h5IGhhc3QgdGhvdSBub3QgZGFyaW5nIGFuZCBib2xkbmVzcywgc2luY2UgdGhyZWUgYmxlc3NlZCBMYWRpZXMgY2FyZSBmb3IgdGhlZSBpbiB0aGUgY291cnQgb2YgSGVhdmVuLCBhbmQgbXkgc3BlZWNoIHBsZWRnZXMgdGhlZSBzdWNoIGdvb2Q/JnJkcXVvOzwvcD5cblx0XHQ8cD5BcyBmbG93ZXJldHMsIGJlbnQgYW5kIGNsb3NlZCBieSB0aGUgY2hpbGwgb2YgbmlnaHQsIGFmdGVyIHRoZSBzdW4gc2hpbmVzIG9uIHRoZW0gc3RyYWlnaHRlbiB0aGVtc2VsdmVzIGFsbCBvcGVuIG9uIHRoZWlyIHN0ZW0sIHNvIEkgYmVjYW1lIHdpdGggbXkgd2VhayB2aXJ0dWUsIGFuZCBzdWNoIGdvb2QgZGFyaW5nIGhhc3RlbmVkIHRvIG15IGhlYXJ0IHRoYXQgSSBiZWdhbiBsaWtlIG9uZSBlbmZyYW5jaGlzZWQ6ICZsZHF1bztPaCBjb21wYXNzaW9uYXRlIHNoZSB3aG8gc3VjY29yZWQgbWUhIGFuZCB0aG91IGNvdXJ0ZW91cyB3aG8gZGlkc3Qgc3BlZWRpbHkgb2JleSB0aGUgdHJ1ZSB3b3JkcyB0aGF0IHNoZSBhZGRyZXNzZWQgdG8gdGhlZSEgVGhvdSBieSB0aHkgd29yZHMgaGFzdCBzbyBkaXNwb3NlZCBteSBoZWFydCB3aXRoIGRlc2lyZSBvZiBnb2luZywgdGhhdCBJIGhhdmUgcmV0dXJuZWQgdW50byBteSBmaXJzdCBpbnRlbnQuIEdvIG9uIG5vdywgZm9yIG9uZSBzb2xlIHdpbGwgaXMgaW4gdXMgYm90aDogVGhvdSBMZWFkZXIsIHRob3UgTG9yZCwgYW5kIHRob3UgTWFzdGVyLiZyZHF1bzsgVGh1cyBJIHNhaWQgdG8gaGltOyBhbmQgd2hlbiBoZSBoYWQgbW92ZWQgb24sIEkgZW50ZXJlZCBhbG9uZyB0aGUgZGVlcCBhbmQgc2F2YWdlIHJvYWQuPC9wPmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q0FOVE8gSUlJPC9wPlxuXHRcdDxwIGNsYXNzPVwic3VtbWFyeVwiPlRoZSBnYXRlIG9mIEhlbGwuJm1kYXNoO1ZpcmdpbCBsZW5kcyBEYW50ZSBpbi4mbWRhc2g7VGhlIHB1bmlzaG1lbnQgb2YgdGhlIG5laXRoZXIgZ29vZCBub3IgYmFkLiZtZGFzaDtBY2hlcm9uLCBhbmQgdGhlIHNpbm5lcnMgb24gaXRzIGJhbmsuJm1kYXNoO0NoYXJvbi4mbWRhc2g7RWFydGhxdWFrZS4mbWRhc2g7RGFudGUgc3dvb25zLjwvcD5cblx0XHQ8cD4mbGRxdW87VGhyb3VnaCBtZSBpcyB0aGUgd2F5IGludG8gdGhlIHdvZWZ1bCBjaXR5OyB0aHJvdWdoIG1lIGlzIHRoZSB3YXkgaW50byBldGVybmFsIHdvZTsgdGhyb3VnaCBtZSBpcyB0aGUgd2F5IGFtb25nIHRoZSBsb3N0IHBlb3BsZS4gSnVzdGljZSBtb3ZlZCBteSBsb2Z0eSBtYWtlcjogdGhlIGRpdmluZSBQb3dlciwgdGhlIHN1cHJlbWUgV2lzZG9tIGFuZCB0aGUgcHJpbWFsIExvdmUgbWFkZSBtZS4gQmVmb3JlIG1lIHdlcmUgbm8gdGhpbmdzIGNyZWF0ZWQsIHVubGVzcyBldGVybmFsLCBhbmQgSSBldGVybmFsIGxhc3QuIExlYXZlIGV2ZXJ5IGhvcGUsIHllIHdobyBlbnRlciEmcmRxdW87PC9wPlxuXHRcdDxwPlRoZXNlIHdvcmRzIG9mIGNvbG9yIG9ic2N1cmUgSSBzYXcgd3JpdHRlbiBhdCB0aGUgdG9wIG9mIGEgZ2F0ZTsgd2hlcmVhdCBJLCAmbGRxdW87TWFzdGVyLCB0aGVpciBtZWFuaW5nIGlzIGRpcmUgdG8gbWUuJnJkcXVvOzwvcD5cblx0XHQ8cD5BbmQgaGUgdG8gbWUsIGxpa2Ugb25lIHdobyBrbmV3LCAmbGRxdW87SGVyZSBpdCBiZWhvdmVzIHRvIGxlYXZlIGV2ZXJ5IGZlYXI7IGl0IGJlaG92ZXMgdGhhdCBhbGwgY293YXJkaWNlIHNob3VsZCBoZXJlIGJlIGRlYWQuIFdlIGhhdmUgY29tZSB0byB0aGUgcGxhY2Ugd2hlcmUgSSBoYXZlIHRvbGQgdGhlZSB0aGF0IHRob3Ugc2hhbHQgc2VlIHRoZSB3b2VmdWwgcGVvcGxlLCB3aG8gaGF2ZSBsb3N0IHRoZSBnb29kIG9mIHRoZSB1bmRlcnN0YW5kaW5nLiZyZHF1bzs8L3A+XG5cdFx0PHA+QW5kIHdoZW4gaGUgaGFkIHB1dCBoaXMgaGFuZCBvbiBtaW5lLCB3aXRoIGEgZ2xhZCBjb3VudGVuYW5jZSwgd2hlcmVmcm9tIEkgdG9vayBjb3VyYWdlLCBoZSBicm91Z2h0IG1lIHdpdGhpbiB0aGUgc2VjcmV0IHRoaW5ncy4gSGVyZSBzaWdocywgbGFtZW50cywgYW5kIGRlZXAgd2FpbGluZ3Mgd2VyZSByZXNvdW5kaW5nIHRob3VnaCB0aGUgc3Rhcmxlc3MgYWlyOyB3aGVyZWZvcmUgYXQgZmlyc3QgSSB3ZXB0IHRoZXJlYXQuIFN0cmFuZ2UgdG9uZ3VlcywgaG9ycmlibGUgY3JpZXMsIHdvcmRzIG9mIHdvZSwgYWNjZW50cyBvZiBhbmdlciwgdm9pY2VzIGhpZ2ggYW5kIGhvYXJzZSwgYW5kIHNvdW5kcyBvZiBoYW5kcyB3aXRoIHRoZW0sIHdlcmUgbWFraW5nIGEgdHVtdWx0IHdoaWNoIHdoaXJscyBmb3JldmVyIGluIHRoYXQgYWlyIGRhcmsgd2l0aG91dCBjaGFuZ2UsIGxpa2UgdGhlIHNhbmQgd2hlbiB0aGUgd2hpcmx3aW5kIGJyZWF0aGVzLjwvcD5cblx0XHQ8cD5BbmQgSSwgd2hvIGhhZCBteSBoZWFkIGdpcnQgd2l0aCBob3Jyb3IsIHNhaWQsICZsZHF1bztNYXN0ZXIsIHdoYXQgaXMgaXQgdGhhdCBJIGhlYXI/IGFuZCB3aGF0IGZvbGsgYXJlIHRoZXkgd2hvIHNlZW0gaW4gd29lIHNvIHZhbnF1aXNoZWQ/JnJkcXVvOzwvcD5cblx0XHQ8cD5BbmQgaGUgdG8gbWUsICZsZHF1bztUaGlzIG1pc2VyYWJsZSBtZWFzdXJlIHRoZSB3cmV0Y2hlZCBzb3VscyBtYWludGFpbiBvZiB0aG9zZSB3aG8gbGl2ZWQgd2l0aG91dCBpbmZhbXkgYW5kIHdpdGhvdXQgcHJhaXNlLiBNaW5nbGVkIGFyZSB0aGV5IHdpdGggdGhhdCBjYWl0aWZmIGNob2lyIG9mIHRoZSBhbmdlbHMsIHdobyB3ZXJlIG5vdCByZWJlbHMsIG5vciB3ZXJlIGZhaXRoZnVsIHRvIEdvZCwgYnV0IHdlcmUgZm9yIHRoZW1zZWx2ZXMuIFRoZSBoZWF2ZW5zIGNoYXNlZCB0aGVtIG91dCBpbiBvcmRlciB0byBiZSBub3QgbGVzcyBiZWF1dGlmdWwsIG5vciBkb3RoIHRoZSBkZXB0aCBvZiBIZWxsIHJlY2VpdmUgdGhlbSwgYmVjYXVzZSB0aGUgZGFtbmVkIHdvdWxkIGhhdmUgc29tZSBnbG9yeSBmcm9tIHRoZW0uJnJkcXVvOzwvcD5cblx0XHQ8cD5BbmQgSSwgJmxkcXVvO01hc3Rlciwgd2hhdCBpcyBzbyBncmlldm91cyB0byB0aGVtLCB0aGF0IG1ha2VzIHRoZW0gbGFtZW50IHNvIGJpdHRlcmx5PyZyZHF1bzs8L3A+XG5cdFx0PHA+SGUgYW5zd2VyZWQsICZsZHF1bztJIHdpbGwgdGVsbCB0aGVlIHZlcnkgYnJpZWZseS4gVGhlc2UgaGF2ZSBubyBob3BlIG9mIGRlYXRoOyBhbmQgdGhlaXIgYmxpbmQgbGlmZSBpcyBzbyBkZWJhc2VkLCB0aGF0IHRoZXkgYXJlIGVudmlvdXMgb2YgZXZlcnkgb3RoZXIgbG90LiBGYW1lIG9mIHRoZW0gdGhlIHdvcmxkIHBlcm1pdHRldGggbm90IHRvIGJlOyBtZXJjeSBhbmQganVzdGljZSBkaXNkYWluIHRoZW0uIExldCB1cyBub3Qgc3BlYWsgb2YgdGhlbSwgYnV0IGRvIHRob3UgbG9vayBhbmQgcGFzcyBvbi4mcmRxdW87PC9wPlxuXHRcdDxwPkFuZCBJLCB3aG8gd2FzIGdhemluZywgc2F3IGEgYmFubmVyLCB0aGF0IHdoaXJsaW5nIHJhbiBzbyBzd2lmdGx5IHRoYXQgaXQgc2VlbWVkIHRvIG1lIHRvIHNjb3JuIGFsbCByZXBvc2UsIGFuZCBiZWhpbmQgaXQgY2FtZSBzbyBsb25nIGEgdHJhaW4gb2YgZm9saywgdGhhdCBJIGNvdWxkIG5ldmVyIGhhdmUgYmVsaWV2ZWQgZGVhdGggaGFkIHVuZG9uZSBzbyBtYW55LiBBZnRlciBJIGhhZCBkaXN0aW5ndWlzaGVkIHNvbWUgYW1vbmcgdGhlbSwgSSBzYXcgYW5kIGtuZXcgdGhlIHNoYWRlIG9mIGhpbSB3aG8gbWFkZSwgdGhyb3VnaCBjb3dhcmRpY2UsIHRoZSBncmVhdCByZWZ1c2FsLlxuXHRcdFx0PHNwYW4gY2xhc3M9XCJub3RlXCI+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZW5vXCI+MTwvc3Bhbj5cblx0XHRcdFx0PHNwYW4gY2xhc3M9XCJub3RldGV4dFwiPldobyBpcyBpbnRlbmRlZCBieSB0aGVzZSB3b3JkcyBpcyB1bmNlcnRhaW4uPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdEF0IG9uY2UgSSB1bmRlcnN0b29kIGFuZCB3YXMgY2VydGFpbiwgdGhhdCB0aGlzIHdhcyB0aGUgc2VjdCBvZiB0aGUgY2FpdGlmZnMgZGlzcGxlYXNpbmcgdW50byBHb2QsIGFuZCB1bnRvIGhpcyBlbmVtaWVzLiBUaGVzZSB3cmV0Y2hlcywgd2hvIG5ldmVyIHdlcmUgYWxpdmUsIHdlcmUgbmFrZWQsIGFuZCBtdWNoIHN0dW5nIGJ5IGdhZC1mbGllcyBhbmQgYnkgd2FzcHMgdGhhdCB3ZXJlIHRoZXJlLiBUaGVzZSBzdHJlYWtlZCB0aGVpciBmYWNlcyB3aXRoIGJsb29kLCB3aGljaCwgbWluZ2xlZCB3aXRoIHRlYXJzLCB3YXMgaGFydmVzdGVkIGF0IHRoZWlyIGZlZXQgYnkgbG9hdGhzb21lIHdvcm1zLjwvcD5cblx0XHQ8cD5BbmQgd2hlbiBJIGdhdmUgbXlzZWxmIHRvIGxvb2tpbmcgb253YXJkLCBJIHNhdyBwZW9wbGUgb24gdGhlIGJhbmsgb2YgYSBncmVhdCByaXZlcjsgd2hlcmVmb3JlIEkgc2FpZCwgJmxkcXVvO01hc3Rlciwgbm93IGdyYW50IHRvIG1lIHRoYXQgSSBtYXkga25vdyB3aG8gdGhlc2UgYXJlLCBhbmQgd2hhdCBydWxlIG1ha2VzIHRoZW0gYXBwZWFyIHNvIHJlYWR5IHRvIHBhc3Mgb3ZlciwgYXMgSSBkaXNjZXJuIHRocm91Z2ggdGhlIGZhaW50IGxpZ2h0LiZyZHF1bzsgQW5kIGhlIHRvIG1lLCAmbGRxdW87VGhlIHRoaW5ncyB3aWxsIGJlIGNsZWFyIHRvIHRoZWUsIHdoZW4gd2Ugc2hhbGwgc2V0IG91ciBzdGVwcyBvbiB0aGUgc2FkIG1hcmdlIG9mIEFjaGVyb24uJnJkcXVvOyBUaGVuIHdpdGggZXllcyBiYXNoZnVsIGFuZCBjYXN0IGRvd24sIGZlYXJpbmcgbGVzdCBteSBzcGVlY2ggaGFkIGJlZW4gaXJrc29tZSB0byBoaW0sIGZhciBhcyB0byB0aGUgcml2ZXIgSSByZWZyYWluZWQgZnJvbSBzcGVha2luZy48L3A+XG5cdFx0PHA+QW5kIGxvISBjb21pbmcgdG93YXJkIHVzIGluIGEgYm9hdCwgYW4gb2xkIG1hbiwgd2hpdGUgd2l0aCBhbmNpZW50IGhhaXIsIGNyeWluZywgJmxkcXVvO1dvZSB0byB5b3UsIHdpY2tlZCBzb3VscyEgaG9wZSBub3QgZXZlciB0byBzZWUgSGVhdmVuISBJIGNvbWUgdG8gY2FycnkgeW91IHRvIHRoZSBvdGhlciBiYW5rLCBpbnRvIGV0ZXJuYWwgZGFya25lc3MsIHRvIGhlYXQgYW5kIGZyb3N0LiBBbmQgdGhvdSB3aG8gYXJ0IHRoZXJlLCBsaXZpbmcgc291bCwgZGVwYXJ0IGZyb20gdGhlc2UgdGhhdCBhcmUgZGVhZC4mcmRxdW87IEJ1dCB3aGVuIGhlIHNhdyB0aGF0IEkgZGlkIG5vdCBkZXBhcnQsIGhlIHNhaWQsICZsZHF1bztCeSBhbm90aGVyIHdheSwgYnkgb3RoZXIgcG9ydHMgdGhvdSBzaGFsdCBjb21lIHRvIHRoZSBzaG9yZSwgbm90IGhlcmUsIGZvciBwYXNzYWdlOyBpdCBiZWhvdmVzIHRoYXQgYSBsaWdodGVyIGJhcmsgYmVhciB0aGVlLiZyZHF1bztcblx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZVwiPlxuXHRcdFx0XHQ8c3BhbiBjbGFzcz1cIm5vdGVub1wiPjE8L3NwYW4+XG5cdFx0XHRcdDxzcGFuIGNsYXNzPVwibm90ZXRleHRcIj5UaGUgYm9hdCB0aGF0IGJlYXJzIHRoZSBzb3VscyB0byBQdXJnYXRvcnkuIENoYXJvbiByZWNvZ25pemVzIHRoYXQgRGFudGUgaXMgbm90IGFtb25nIHRoZSBkYW1uZWQuPC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdDwvcD5cblx0XHQ8cD5BbmQgbXkgTGVhZGVyIHRvIGhpbSwgJmxkcXVvO0NoYXJvbiwgdmV4IG5vdCB0aHlzZWxmLCBpdCBpcyB0aHVzIHdpbGxlZCB0aGVyZSB3aGVyZSBpcyBwb3dlciB0byBkbyB0aGF0IHdoaWNoIGlzIHdpbGxlZDsgYW5kIGZhcnRoZXIgYXNrIG5vdC4mcmRxdW87IFRoZW4gdGhlIGZsZWVjeSBjaGVla3Mgd2VyZSBxdWlldCBvZiB0aGUgcGlsb3Qgb2YgdGhlIGxpdmlkIG1hcnNoLCB3aG8gcm91bmQgYWJvdXQgaGlzIGV5ZXMgaGFkIHdoZWVscyBvZiBmbGFtZS48L3A+XG5cdFx0PHA+QnV0IHRob3NlIHNvdWxzLCB3aG8gd2VyZSB3ZWFyeSBhbmQgbmFrZWQsIGNoYW5nZWQgY29sb3IsIGFuZCBnbmFzaGVkIHRoZWlyIHRlZXRoIHNvb24gYXMgdGhleSBoZWFyZCBoaXMgY3J1ZWwgd29yZHMuIFRoZXkgYmxhc3BoZW1lZCBHb2QgYW5kIHRoZWlyIHBhcmVudHMsIHRoZSBodW1hbiByYWNlLCB0aGUgcGxhY2UsIHRoZSB0aW1lIGFuZCB0aGUgc2VlZCBvZiB0aGVpciBzb3dpbmcgYW5kIG9mIHRoZWlyIGJpcnRoLiBUaGVuLCBiaXR0ZXJseSB3ZWVwaW5nLCB0aGV5IGRyZXcgYmFjayBhbGwgb2YgdGhlbSB0b2dldGhlciB0byB0aGUgZXZpbCBiYW5rLCB0aGF0IHdhaXRzIGZvciBldmVyeSBtYW4gd2hvIGZlYXJzIG5vdCBHb2QuIENoYXJvbiB0aGUgZGVtb24sIHdpdGggZXllcyBvZiBnbG93aW5nIGNvYWwsIGJlY2tvbmluZyB0aGVtLCBjb2xsZWN0cyB0aGVtIGFsbDsgaGUgYmVhdHMgd2l0aCBoaXMgb2FyIHdob2V2ZXIgbGluZ2Vycy48L3A+XG5cdFx0PHA+QXMgaW4gYXV0dW1uIHRoZSBsZWF2ZXMgZmFsbCBvZmYgb25lIGFmdGVyIHRoZSBvdGhlciwgdGlsbCB0aGUgYm91Z2ggc2VlcyBhbGwgaXRzIHNwb2lscyB1cG9uIHRoZSBlYXJ0aCwgaW4gbGlrZSB3aXNlIHRoZSBldmlsIHNlZWQgb2YgQWRhbSB0aHJvdyB0aGVtc2VsdmVzIGZyb20gdGhhdCBzaG9yZSBvbmUgYnkgb25lIGF0IHNpZ25hbHMsIGFzIHRoZSBiaXJkIGF0IGhpcyBjYWxsLiBUaHVzIHRoZXkgZ28gb3ZlciB0aGUgZHVza3kgd2F2ZSwgYW5kIGJlZm9yZSB0aGV5IGhhdmUgbGFuZGVkIG9uIHRoZSBmYXJ0aGVyIHNpZGUsIGFscmVhZHkgb24gdGhpcyBhIG5ldyB0aHJvbmcgaXMgZ2F0aGVyZWQuPC9wPlxuXHRcdDxwPiZsZHF1bztNeSBzb24sJnJkcXVvOyBzYWlkIHRoZSBjb3VydGVvdXMgTWFzdGVyLCAmbGRxdW87dGhvc2Ugd2hvIGRpZSBpbiB0aGUgd3JhdGggb2YgR29kLCBhbGwgbWVldCB0b2dldGhlciBoZXJlIGZyb20gZXZlcnkgbGFuZC4gQW5kIHRoZXkgYXJlIGVhZ2VyIHRvIHBhc3Mgb3ZlciB0aGUgc3RyZWFtLCBmb3IgdGhlIGRpdmluZSBqdXN0aWNlIHNwdXJzIHRoZW0sIHNvIHRoYXQgZmVhciBpcyB0dXJuZWQgdG8gZGVzaXJlLiBUaGlzIHdheSBhIGdvb2Qgc291bCBuZXZlciBwYXNzZXM7IGFuZCB0aGVyZWZvcmUgaWYgQ2hhcm9uIHNuYXJsZXRoIGF0IHRoZWUsIHRob3Ugbm93IG1heWVzdCB3ZWxsIGtub3cgd2hhdCBoaXMgc3BlZWNoIHNpZ25pZmllcy4mcmRxdW87IFRoaXMgZW5kZWQsIHRoZSBkYXJrIHBsYWluIHRyZW1ibGVkIHNvIG1pZ2h0aWx5LCB0aGF0IHRoZSBtZW1vcnkgb2YgdGhlIHRlcnJvciBldmVuIG5vdyBiYXRoZXMgbWUgd2l0aCBzd2VhdC4gVGhlIHRlYXJmdWwgbGFuZCBnYXZlIGZvcnRoIGEgd2luZCB0aGF0IGZsYXNoZWQgYSB2ZXJtaWxpb24gbGlnaHQgd2hpY2ggdmFucXVpc2hlZCBldmVyeSBzZW5zZSBvZiBtaW5lLCBhbmQgSSBmZWxsIGFzIGEgbWFuIHdob20gc2x1bWJlciBzZWl6ZXMuPC9wPmBdO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5vcnRvbjtcbiIsIi8vIHdyaWdodC5qc1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3Qgd3JpZ2h0ID0gW2A8cCBjbGFzcz1cInRpdGxlXCI+SW5mZXJubzwvcD5cblx0PHAgY2xhc3M9XCJhdXRob3JcIj5TLiBGb3dsZXIgV3JpZ2h0PC9wPmAsXG5cblx0YDxwIGNsYXNzPVwiY2FudG9oZWFkXCI+Q2FudG8gSTwvcD5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5PTkUgbmlnaHQsIHdoZW4gaGFsZiBteSBsaWZlIGJlaGluZCBtZSBsYXksPC9wPlxuXHRcdFx0PHA+SSB3YW5kZXJlZCBmcm9tIHRoZSBzdHJhaWdodCBsb3N0IHBhdGggYWZhci48L3A+XG5cdFx0XHQ8cD5UaHJvdWdoIHRoZSBncmVhdCBkYXJrIHdhcyBubyByZWxlYXNpbmcgd2F5OzwvcD5cblx0XHRcdDxwPkFib3ZlIHRoYXQgZGFyayB3YXMgbm8gcmVsaWV2aW5nIHN0YXIuPC9wPlxuXHRcdFx0PHA+SWYgeWV0IHRoYXQgdGVycm9yZWQgbmlnaHQgSSB0aGluayBvciBzYXksPC9wPlxuXHRcdFx0PHA+QXMgZGVhdGgmcnNxdW87cyBjb2xkIGhhbmRzIGl0cyBmZWFycyByZXN1bWluZyBhcmUuPC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkdsYWRseSB0aGUgZHJlYWRzIEkgZmVsdCwgdG9vIGRpcmUgdG8gdGVsbCw8L3A+XG5cdFx0XHQ8cD5UaGUgaG9wZWxlc3MsIHBhdGhsZXNzLCBsaWdodGxlc3MgaG91cnMgZm9yZ290LDwvcD5cblx0XHRcdDxwPkkgdHVybiBteSB0YWxlIHRvIHRoYXQgd2hpY2ggbmV4dCBiZWZlbGwsPC9wPlxuXHRcdFx0PHA+V2hlbiB0aGUgZGF3biBvcGVuZWQsIGFuZCB0aGUgbmlnaHQgd2FzIG5vdC48L3A+XG5cdFx0XHQ8cD5UaGUgaG9sbG93ZWQgYmxhY2tuZXNzIG9mIHRoYXQgd2FzdGUsIEdvZCB3b3QsPC9wPlxuXHRcdFx0PHA+U2hyYW5rLCB0aGlubmVkLCBhbmQgY2Vhc2VkLiBBIGJsaW5kaW5nIHNwbGVuZG91ciBob3Q8L3A+XG5cdFx0XHQ8cD5GbHVzaGVkIHRoZSBncmVhdCBoZWlnaHQgdG93YXJkIHdoaWNoIG15IGZvb3RzdGVwcyBmZWxsLDwvcD5cblx0XHRcdDxwPkFuZCB0aG91Z2ggaXQga2luZGxlZCBmcm9tIHRoZSBuZXRoZXIgaGVsbCw8L3A+XG5cdFx0XHQ8cD5PciBmcm9tIHRoZSBTdGFyIHRoYXQgYWxsIG1lbiBsZWFkcywgYWxpa2U8L3A+XG5cdFx0XHQ8cD5JdCBzaG93ZWQgbWUgd2hlcmUgdGhlIGdyZWF0IGRhd24tZ2xvcmllcyBzdHJpa2U8L3A+XG5cdFx0XHQ8cD5UaGUgd2lkZSBlYXN0LCBhbmQgdGhlIHV0bW9zdCBwZWFrcyBvZiBzbm93LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5Ib3cgZmlyc3QgSSBlbnRlcmVkIG9uIHRoYXQgcGF0aCBhc3RyYXksPC9wPlxuXHRcdFx0PHA+QmVzZXQgd2l0aCBzbGVlcCwgSSBrbm93IG5vdC4gVGhpcyBJIGtub3cuPC9wPlxuXHRcdFx0PHA+V2hlbiBnYWluZWQgbXkgZmVldCB0aGUgdXB3YXJkLCBsaWdodGVkIHdheSw8L3A+XG5cdFx0XHQ8cD5JIGJhY2t3YXJkIGdhemVkLCBhcyBvbmUgdGhlIGRyb3duaW5nIHNlYSw8L3A+XG5cdFx0XHQ8cD5UaGUgZGVlcCBzdHJvbmcgdGlkZXMsIGhhcyBiYWZmbGVkLCBhbmQgcGFudGluZyBsaWVzLDwvcD5cblx0XHRcdDxwPk9uIHRoZSBzaGVsdmVkIHNob3JlLCBhbmQgdHVybnMgaGlzIGV5ZXMgdG8gc2VlPC9wPlxuXHRcdFx0PHA+VGhlIGxlYWd1ZS13aWRlIHdhc3RlcyB0aGF0IGhlbGQgaGltLiBTbyBtaW5lIGV5ZXM8L3A+XG5cdFx0XHQ8cD5TdXJ2ZXllZCB0aGF0IGZlYXIsIHRoZSB3aGlsZSBteSB3ZWFyaWVkIGZyYW1lPC9wPlxuXHRcdFx0PHA+UmVzdGVkLCBhbmQgZXZlciBteSBoZWFydCZyc3F1bztzIHRvc3NlZCBsYWtlIGJlY2FtZTwvcD5cblx0XHRcdDxwPk1vcmUgcXVpZXQuPC9wPlxuXHRcdFx0PHA+VGhlbiBmcm9tIHRoYXQgcGFzcyByZWxlYXNlZCwgd2hpY2ggeWV0PC9wPlxuXHRcdFx0PHA+V2l0aCBsaXZpbmcgZmVldCBoYWQgbm8gbWFuIGxlZnQsIEkgc2V0PC9wPlxuXHRcdFx0PHA+TXkgZm9yd2FyZCBzdGVwcyBhc2xhbnQgdGhlIHN0ZWVwLCB0aGF0IHNvLDwvcD5cblx0XHRcdDxwPk15IHJpZ2h0IGZvb3Qgc3RpbGwgdGhlIGxvd2VyLCBJIGNsaW1iZWQuPC9wPlxuXHRcdFx0PHAgY2xhc3M9XCJzbGluZGVudDhlbVwiPkJlbG93PC9wPlxuXHRcdFx0PHA+Tm8gbW9yZSBJIGdhemVkLiBBcm91bmQsIGEgc2xvcGUgb2Ygc2FuZDwvcD5cblx0XHRcdDxwPldhcyBzdGVyaWxlIG9mIGFsbCBncm93dGggb24gZWl0aGVyIGhhbmQsPC9wPlxuXHRcdFx0PHA+T3IgbW92aW5nIGxpZmUsIGEgc3BvdHRlZCBwYXJkIGV4Y2VwdCw8L3A+XG5cdFx0XHQ8cD5UaGF0IHlhd25pbmcgcm9zZSwgYW5kIHN0cmV0Y2hlZCwgYW5kIHB1cnJlZCBhbmQgbGVhcHQ8L3A+XG5cdFx0XHQ8cD5TbyBjbG9zZWx5IHJvdW5kIG15IGZlZXQsIHRoYXQgc2NhcmNlIEkga2VwdDwvcD5cblx0XHRcdDxwPlRoZSBjb3Vyc2UgSSB3b3VsZC48L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50NGVtXCI+VGhhdCBzbGVlayBhbmQgbG92ZWx5IHRoaW5nLDwvcD5cblx0XHRcdDxwPlRoZSBicm9hZGVuaW5nIGxpZ2h0LCB0aGUgYnJlYXRoIG9mIG1vcm4gYW5kIHNwcmluZyw8L3A+XG5cdFx0XHQ8cD5UaGUgc3VuLCB0aGF0IHdpdGggaGlzIHN0YXJzIGluIEFyaWVzIGxheSw8L3A+XG5cdFx0XHQ8cD5BcyB3aGVuIERpdmluZSBMb3ZlIG9uIENyZWF0aW9uJnJzcXVvO3MgZGF5PC9wPlxuXHRcdFx0PHA+Rmlyc3QgZ2F2ZSB0aGVzZSBmYWlyIHRoaW5ncyBtb3Rpb24sIGFsbCBhdCBvbmU8L3A+XG5cdFx0XHQ8cD5NYWRlIGxpZ2h0c29tZSBob3BlOyBidXQgbGlnaHRzb21lIGhvcGUgd2FzIG5vbmU8L3A+XG5cdFx0XHQ8cD5XaGVuIGRvd24gdGhlIHNsb3BlIHRoZXJlIGNhbWUgd2l0aCBsaWZ0ZWQgaGVhZDwvcD5cblx0XHRcdDxwPkFuZCBiYWNrLWJsb3duIG1hbmUgYW5kIGNhdmVybmVkIG1vdXRoIGFuZCByZWQsPC9wPlxuXHRcdFx0PHA+QSBsaW9uLCByb2FyaW5nLCBhbGwgdGhlIGFpciBhc2hha2U8L3A+XG5cdFx0XHQ8cD5UaGF0IGhlYXJkIGhpcyBodW5nZXIuIFVwd2FyZCBmbGlnaHQgdG8gdGFrZTwvcD5cblx0XHRcdDxwPk5vIGhlYXJ0IHdhcyBtaW5lLCBmb3Igd2hlcmUgdGhlIGZ1cnRoZXIgd2F5PC9wPlxuXHRcdFx0PHA+TWluZSBhbnhpb3VzIGV5ZXMgZXhwbG9yZWQsIGEgc2hlLXdvbGYgbGF5LDwvcD5cblx0XHRcdDxwPlRoYXQgbGlja2VkIGxlYW4gZmxhbmtzLCBhbmQgd2FpdGVkLiBTdWNoIHdhcyBzaGU8L3A+XG5cdFx0XHQ8cD5JbiBhc3BlY3QgcnV0aGxlc3MgdGhhdCBJIHF1YWtlZCB0byBzZWUsPC9wPlxuXHRcdFx0PHA+QW5kIHdoZXJlIHNoZSBsYXkgYW1vbmcgaGVyIGJvbmVzIGhhZCBicm91Z2h0PC9wPlxuXHRcdFx0PHA+U28gbWFueSB0byBncmllZiBiZWZvcmUsIHRoYXQgYWxsIG15IHRob3VnaHQ8L3A+XG5cdFx0XHQ8cD5BZ2hhc3QgdHVybmVkIGJhY2t3YXJkIHRvIHRoZSBzdW5sZXNzIG5pZ2h0PC9wPlxuXHRcdFx0PHA+SSBsZWZ0LiBCdXQgd2hpbGUgSSBwbHVuZ2VkIGluIGhlYWRsb25nIGZsaWdodDwvcD5cblx0XHRcdDxwPlRvIHRoYXQgbW9zdCBmZWFyZWQgYmVmb3JlLCBhIHNoYWRlLCBvciBtYW48L3A+XG5cdFx0XHQ8cD4oRWl0aGVyIGhlIHNlZW1lZCksIG9ic3RydWN0aW5nIHdoZXJlIEkgcmFuLDwvcD5cblx0XHRcdDxwPkNhbGxlZCB0byBtZSB3aXRoIGEgdm9pY2UgdGhhdCBmZXcgc2hvdWxkIGtub3csPC9wPlxuXHRcdFx0PHA+RmFpbnQgZnJvbSBmb3JnZXRmdWwgc2lsZW5jZSwgJmxkcXVvO1doZXJlIHllIGdvLDwvcD5cblx0XHRcdDxwPlRha2UgaGVlZC4gV2h5IHR1cm4geWUgZnJvbSB0aGUgdXB3YXJkIHdheT8mcmRxdW87PC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkkgY3JpZWQsICZsZHF1bztPciBjb21lIHllIGZyb20gd2FybSBlYXJ0aCwgb3IgdGhleTwvcD5cblx0XHRcdDxwPlRoZSBncmF2ZSBoYXRoIHRha2VuLCBpbiBteSBtb3J0YWwgbmVlZDwvcD5cblx0XHRcdDxwPkhhdmUgbWVyY3kgdGhvdSEmcmRxdW87PC9wPlxuXHRcdFx0PHAgY2xhc3M9XCJzbGluZGVudDRlbVwiPkhlIGFuc3dlcmVkLCAmbGRxdW87U2hhZGUgYW0gSSw8L3A+XG5cdFx0XHQ8cD5UaGF0IG9uY2Ugd2FzIG1hbjsgYmVuZWF0aCB0aGUgTG9tYmFyZCBza3ksPC9wPlxuXHRcdFx0PHA+SW4gdGhlIGxhdGUgeWVhcnMgb2YgSnVsaXVzIGJvcm4sIGFuZCBicmVkPC9wPlxuXHRcdFx0PHA+SW4gTWFudHVhLCB0aWxsIG15IHlvdXRoZnVsIHN0ZXBzIHdlcmUgbGVkPC9wPlxuXHRcdFx0PHA+VG8gUm9tZSwgd2hlcmUgeWV0IHRoZSBmYWxzZSBnb2RzIGxpZWQgdG8gbWFuOzwvcD5cblx0XHRcdDxwPkFuZCB3aGVuIHRoZSBncmVhdCBBdWd1c3RhbiBhZ2UgYmVnYW4sPC9wPlxuXHRcdFx0PHA+SSB3cm90ZSB0aGUgdGFsZSBvZiBJbGl1bSBidXJudCwgYW5kIGhvdzwvcD5cblx0XHRcdDxwPkFuY2hpc2VzJnJzcXVvOyBzb24gZm9ydGgtcHVzaGVkIGEgdmVudHVyb3VzIHByb3csPC9wPlxuXHRcdFx0PHA+U2Vla2luZyB1bmtub3duIHNlYXMuIEJ1dCBpbiB3aGF0IG1vb2QgYXJ0IHRob3U8L3A+XG5cdFx0XHQ8cD5UbyB0aHVzIHJldHVybiB0byBhbGwgdGhlIGlsbHMgeWUgZmxlZCw8L3A+XG5cdFx0XHQ8cD5UaGUgd2hpbGUgdGhlIG1vdW50YWluIG9mIHRoeSBob3BlIGFoZWFkPC9wPlxuXHRcdFx0PHA+TGlmdHMgaW50byBsaWdodCwgdGhlIHNvdXJjZSBhbmQgY2F1c2Ugb2YgYWxsPC9wPlxuXHRcdFx0PHA+RGVsZWN0YWJsZSB0aGluZ3MgdGhhdCBtYXkgdG8gbWFuIGJlZmFsbD8mcmRxdW87PC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPkkgYW5zd2VyZWQsICZsZHF1bztBcnQgdGhvdSB0aGVuIHRoYXQgVmlyZ2lsLCBoZTwvcD5cblx0XHRcdDxwPkZyb20gd2hvbSBhbGwgZ3JhY2Ugb2YgbWVhc3VyZWQgc3BlZWNoIGluIG1lPC9wPlxuXHRcdFx0PHA+RGVyaXZlZD8gTyBnbG9yaW91cyBhbmQgZmFyLWd1aWRpbmcgc3RhciE8L3A+XG5cdFx0XHQ8cD5Ob3cgbWF5IHRoZSBsb3ZlLWxlZCBzdHVkaW91cyBob3VycyBhbmQgbG9uZzwvcD5cblx0XHRcdDxwPkluIHdoaWNoIEkgbGVhcm50IGhvdyByaWNoIHRoeSB3b25kZXJzIGFyZSw8L3A+XG5cdFx0XHQ8cD5NYXN0ZXIgYW5kIEF1dGhvciBtaW5lIG9mIExpZ2h0IGFuZCBTb25nLDwvcD5cblx0XHRcdDxwPkJlZnJpZW5kIG1lIG5vdywgd2hvIGtuZXcgdGh5IHZvaWNlLCB0aGF0IGZldzwvcD5cblx0XHRcdDxwPllldCBoZWFya2VuLiBBbGwgdGhlIG5hbWUgbXkgd29yayBoYXRoIHdvbjwvcD5cblx0XHRcdDxwPklzIHRoaW5lIG9mIHJpZ2h0LCBmcm9tIHdob20gSSBsZWFybmVkLiBUbyB0aGVlLDwvcD5cblx0XHRcdDxwPkFiYXNoZWQsIEkgZ3JhbnQgaXQuIC4gLiBXaHkgdGhlIG1vdW50aW5nIHN1bjwvcD5cblx0XHRcdDxwPk5vIG1vcmUgSSBzZWVrLCB5ZSBzY2FyY2Ugc2hvdWxkIGFzaywgd2hvIHNlZTwvcD5cblx0XHRcdDxwPlRoZSBiZWFzdCB0aGF0IHR1cm5lZCBtZSwgbm9yIGZhaW50IGhvcGUgaGF2ZSBJPC9wPlxuXHRcdFx0PHA+VG8gZm9yY2UgdGhhdCBwYXNzYWdlIGlmIHRoaW5lIGFpZCBkZW55LiZsZHF1bzs8L3A+XG5cdFx0XHQ8cD5IZSBhbnN3ZXJlZCwgJmxkcXVvO1dvdWxkIHllIGxlYXZlIHRoaXMgd2lsZCBhbmQgbGl2ZSw8L3A+XG5cdFx0XHQ8cD5TdHJhbmdlIHJvYWQgaXMgb3VycywgZm9yIHdoZXJlIHRoZSBzaGUtd29sZiBsaWVzPC9wPlxuXHRcdFx0PHA+U2hhbGwgbm8gbWFuIHBhc3MsIGV4Y2VwdCB0aGUgcGF0aCBoZSB0cmllczwvcD5cblx0XHRcdDxwPkhlciBjcmFmdCBlbnRhbmdsZS4gTm8gd2F5IGZ1Z2l0aXZlPC9wPlxuXHRcdFx0PHA+QXZvaWRzIHRoZSBzZWVraW5nIG9mIGhlciBncmVlZHMsIHRoYXQgZ2l2ZTwvcD5cblx0XHRcdDxwPkluc2F0aWF0ZSBodW5nZXIsIGFuZCBzdWNoIHZpY2UgcGVydmVyc2U8L3A+XG5cdFx0XHQ8cD5BcyBtYWtlcyBoZXIgbGVhbmVyIHdoaWxlIHNoZSBmZWVkcywgYW5kIHdvcnNlPC9wPlxuXHRcdFx0PHA+SGVyIGNyYXZpbmcuIEFuZCB0aGUgYmVhc3RzIHdpdGggd2hpY2ggc2hlIGJyZWVkPC9wPlxuXHRcdFx0PHA+VGhlIG5vaXNvbWUgbnVtZXJvdXMgYmVhc3RzIGhlciBsdXN0cyByZXF1aXJlLDwvcD5cblx0XHRcdDxwPkJhcmUgYWxsIHRoZSBkZXNpcmFibGUgbGFuZHMgaW4gd2hpY2ggc2hlIGZlZWRzOzwvcD5cblx0XHRcdDxwPk5vciBzaGFsbCBsZXdkIGZlYXN0cyBhbmQgbGV3ZGVyIG1hdGluZ3MgdGlyZTwvcD5cblx0XHRcdDxwPlVudGlsIHNoZSB3b29zLCBpbiBldmlsIGhvdXIgZm9yIGhlciw8L3A+XG5cdFx0XHQ8cD5UaGUgd29sZmhvdW5kIHRoYXQgc2hhbGwgcmVuZCBoZXIuIEhpcyBkZXNpcmU8L3A+XG5cdFx0XHQ8cD5JcyBub3QgZm9yIHJhcGluZSwgYXMgdGhlIHByb21wdGluZ3Mgc3RpcjwvcD5cblx0XHRcdDxwPk9mIGhlciBiYXNlIGhlYXJ0OyBidXQgd2lzZG9tcywgYW5kIGRldm9pcnM8L3A+XG5cdFx0XHQ8cD5PZiBtYW5ob29kLCBhbmQgbG92ZSZyc3F1bztzIHJ1bGUsIGhpcyB0aG91Z2h0cyBwcmVmZXIuPC9wPlxuXHRcdFx0PHA+VGhlIEl0YWxpYW4gbG93bGFuZHMgaGUgc2hhbGwgcmVhY2ggYW5kIHNhdmUsPC9wPlxuXHRcdFx0PHA+Rm9yIHdoaWNoIENhbWlsbGEgb2Ygb2xkLCB0aGUgdmlyZ2luIGJyYXZlLDwvcD5cblx0XHRcdDxwPlR1cm51cyBhbmQgTmlzdXMgZGllZCBpbiBzdHJpZmUuIEhpcyBjaGFzZTwvcD5cblx0XHRcdDxwPkhlIHNoYWxsIG5vdCBjZWFzZSwgbm9yIGFueSBjb3dlcmluZy1wbGFjZTwvcD5cblx0XHRcdDxwPkhlciBmZWFyIHNoYWxsIGZpbmQgaGVyLCB0aWxsIGhlIGRyaXZlIGhlciBiYWNrLDwvcD5cblx0XHRcdDxwPkZyb20gY2l0eSB0byBjaXR5IGV4aWxlZCwgZnJvbSB3cmFjayB0byB3cmFjazwvcD5cblx0XHRcdDxwPlNsYWluIG91dCBvZiBsaWZlLCB0byBmaW5kIHRoZSBuYXRpdmUgaGVsbDwvcD5cblx0XHRcdDxwPldoZW5jZSBlbnZ5IGxvb3NlZCBoZXIuPC9wPlxuXHRcdFx0PHAgY2xhc3M9XCJzbGluZGVudDZlbVwiPkZvciB0aHlzZWxmIHdlcmUgd2VsbDwvcD5cblx0XHRcdDxwPlRvIGZvbGxvdyB3aGVyZSBJIGxlYWQsIGFuZCB0aG91IHNoYWx0IHNlZTwvcD5cblx0XHRcdDxwPlRoZSBzcGlyaXRzIGluIHBhaW4sIGFuZCBoZWFyIHRoZSBob3BlbGVzcyB3b2UsPC9wPlxuXHRcdFx0PHA+VGhlIHVuZW5kaW5nIGNyaWVzLCBvZiB0aG9zZSB3aG9zZSBvbmx5IHBsZWE8L3A+XG5cdFx0XHQ8cD5JcyBqdWRnbWVudCwgdGhhdCB0aGUgc2Vjb25kIGRlYXRoIHRvIGJlPC9wPlxuXHRcdFx0PHA+RmFsbCBxdWlja2x5LiBGdXJ0aGVyIHNoYWx0IHRob3UgY2xpbWIsIGFuZCBnbzwvcD5cblx0XHRcdDxwPlRvIHRob3NlIHdobyBidXJuLCBidXQgaW4gdGhlaXIgcGFpbiBjb250ZW50PC9wPlxuXHRcdFx0PHA+V2l0aCBob3BlIG9mIHBhcmRvbjsgc3RpbGwgYmV5b25kLCBtb3JlIGhpZ2gsPC9wPlxuXHRcdFx0PHA+SG9saWVyIHRoYW4gb3BlbnMgdG8gc3VjaCBzb3VscyBhcyBJLDwvcD5cblx0XHRcdDxwPlRoZSBIZWF2ZW5zIHVwcmVhcjsgYnV0IGlmIHRob3Ugd2lsdCwgaXMgb25lPC9wPlxuXHRcdFx0PHA+V29ydGhpZXIsIGFuZCBzaGUgc2hhbGwgZ3VpZGUgdGhlZSB0aGVyZSwgd2hlcmUgbm9uZTwvcD5cblx0XHRcdDxwPldobyBkaWQgdGhlIExvcmQgb2YgdGhvc2UgZmFpciByZWFsbXMgZGVueTwvcD5cblx0XHRcdDxwPk1heSBlbnRlci4gVGhlcmUgaW4gaGlzIGNpdHkgSGUgZHdlbGxzLCBhbmQgdGhlcmU8L3A+XG5cdFx0XHQ8cD5SdWxlcyBhbmQgcGVydmFkZXMgaW4gZXZlcnkgcGFydCwgYW5kIGNhbGxzPC9wPlxuXHRcdFx0PHA+SGlzIGNob3NlbiBldmVyIHdpdGhpbiB0aGUgc2FjcmVkIHdhbGxzLjwvcD5cblx0XHRcdDxwPk8gaGFwcGllc3QsIHRoZXkhJnJkcXVvOzwvcD5cblx0XHRcdDxwIGNsYXNzPVwic2xpbmRlbnQ0ZW1cIj5JIGFuc3dlcmVkLCAmbGRxdW87QnkgdGhhdCBHb2Q8L3A+XG5cdFx0XHQ8cD5UaG91IGRpZHN0IG5vdCBrbm93LCBJIGRvIHRoaW5lIGFpZCBlbnRyZWF0LDwvcD5cblx0XHRcdDxwPkFuZCBndWlkYW5jZSwgdGhhdCBiZXlvbmQgdGhlIGlsbHMgSSBtZWV0PC9wPlxuXHRcdFx0PHA+SSBzYWZldHkgZmluZCwgd2l0aGluIHRoZSBTYWNyZWQgR2F0ZTwvcD5cblx0XHRcdDxwPlRoYXQgUGV0ZXIgZ3VhcmRzLCBhbmQgdGhvc2Ugc2FkIHNvdWxzIHRvIHNlZTwvcD5cblx0XHRcdDxwPldobyBsb29rIHdpdGggbG9uZ2luZyBmb3IgdGhlaXIgZW5kIHRvIGJlLiZyZHF1bzs8L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+VGhlbiBoZSBtb3ZlZCBmb3J3YXJkLCBhbmQgYmVoaW5kIEkgdHJvZC48L3A+XG5cdFx0PC9kaXY+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DYW50byBJSTwvcD5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5USEUgZGF5IHdhcyBmYWxsaW5nLCBhbmQgdGhlIGRhcmtlbmluZyBhaXI8L3A+XG5cdFx0XHQ8cD5SZWxlYXNlZCBlYXJ0aCZyc3F1bztzIGNyZWF0dXJlcyBmcm9tIHRoZWlyIHRvaWxzLCB3aGlsZSBJLDwvcD5cblx0XHRcdDxwPkkgb25seSwgZmFjZWQgdGhlIGJpdHRlciByb2FkIGFuZCBiYXJlPC9wPlxuXHRcdFx0PHA+TXkgTWFzdGVyIGxlZC4gSSBvbmx5LCBtdXN0IGRlZnk8L3A+XG5cdFx0XHQ8cD5UaGUgcG93ZXJzIG9mIHBpdHksIGFuZCB0aGUgbmlnaHQgdG8gYmUuPC9wPlxuXHRcdFx0PHA+U28gdGhvdWdodCBJLCBidXQgdGhlIHRoaW5ncyBJIGNhbWUgdG8gc2VlLDwvcD5cblx0XHRcdDxwPldoaWNoIG1lbW9yeSBob2xkcywgY291bGQgbmV2ZXIgdGhvdWdodCBmb3JlY2FzdC48L3A+XG5cdFx0XHQ8cD5PIE11c2VzIGhpZ2ghIE8gR2VuaXVzLCBmaXJzdCBhbmQgbGFzdCE8L3A+XG5cdFx0XHQ8cD5NZW1vcmllcyBpbnRlbnNlISBZb3VyIHV0bW9zdCBwb3dlcnMgY29tYmluZTwvcD5cblx0XHRcdDxwPlRvIG1lZXQgdGhpcyBuZWVkLiBGb3IgbmV2ZXIgdGhlbWUgYXMgbWluZTwvcD5cblx0XHRcdDxwPlN0cmFpbmVkIHZhaW5seSwgd2hlcmUgeW91ciBsb2Z0aWVzdCBub2JsZW5lc3M8L3A+XG5cdFx0XHQ8cD5NdXN0IGZhaWwgdG8gYmUgc3VmZmljaWVudC48L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50MTBlbVwiPkZpcnN0IEkgc2FpZCw8L3A+XG5cdFx0XHQ8cD5GZWFyaW5nLCB0byBoaW0gd2hvIHRocm91Z2ggdGhlIGRhcmtuZXNzIGxlZCw8L3A+XG5cdFx0XHQ8cD4mbGRxdW87TyBwb2V0LCBlcmUgdGhlIGFyZHVvdXMgcGF0aCB5ZSBwcmVzczwvcD5cblx0XHRcdDxwPlRvbyBmYXIsIGxvb2sgaW4gbWUsIGlmIHRoZSB3b3J0aCB0aGVyZSBiZTwvcD5cblx0XHRcdDxwPlRvIG1ha2UgdGhpcyB0cmFuc2l0LiAmQUVsaWc7bmVhcyBvbmNlLCBJIGtub3csPC9wPlxuXHRcdFx0PHA+V2VudCBkb3duIGluIGxpZmUsIGFuZCBjcm9zc2VkIHRoZSBpbmZlcm5hbCBzZWE7PC9wPlxuXHRcdFx0PHA+QW5kIGlmIHRoZSBMb3JkIG9mIEFsbCBUaGluZ3MgTG9zdCBCZWxvdzwvcD5cblx0XHRcdDxwPkFsbG93ZWQgaXQsIHJlYXNvbiBzZWVtcywgdG8gdGhvc2Ugd2hvIHNlZTwvcD5cblx0XHRcdDxwPlRoZSBlbmR1cmluZyBncmVhdG5lc3Mgb2YgaGlzIGRlc3RpbnksPC9wPlxuXHRcdFx0PHA+V2hvIGluIHRoZSBFbXB5cmVhbiBIZWF2ZW4gZWxlY3Qgd2FzIGNhbGxlZDwvcD5cblx0XHRcdDxwPlNpcmUgb2YgdGhlIEV0ZXJuYWwgQ2l0eSwgdGhhdCB0aHJvbmVkIGFuZCB3YWxsZWQ8L3A+XG5cdFx0XHQ8cD5NYWRlIEVtcGlyZSBvZiB0aGUgd29ybGQgYmV5b25kLCB0byBiZTwvcD5cblx0XHRcdDxwPlRoZSBIb2x5IFBsYWNlIGF0IGxhc3QsIGJ5IEdvZCZyc3F1bztzIGRlY3JlZSw8L3A+XG5cdFx0XHQ8cD5XaGVyZSB0aGUgZ3JlYXQgUGV0ZXImcnNxdW87cyBmb2xsb3dlciBydWxlcy4gRm9yIGhlPC9wPlxuXHRcdFx0PHA+TGVhcm5lZCB0aGVyZSB0aGUgY2F1c2VzIG9mIGhpcyB2aWN0b3J5LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD4mbGRxdW87QW5kIGxhdGVyIHRvIHRoZSB0aGlyZCBncmVhdCBIZWF2ZW4gd2FzIGNhdWdodDwvcD5cblx0XHRcdDxwPlRoZSBsYXN0IEFwb3N0bGUsIGFuZCB0aGVuY2UgcmV0dXJuaW5nIGJyb3VnaHQ8L3A+XG5cdFx0XHQ8cD5UaGUgcHJvb2ZzIG9mIG91ciBzYWx2YXRpb24uIEJ1dCwgZm9yIG1lLDwvcD5cblx0XHRcdDxwPkkgYW0gbm90ICZBRWxpZztuZWFzLCBuYXksIG5vciBQYXVsLCB0byBzZWU8L3A+XG5cdFx0XHQ8cD5VbnNwZWFrYWJsZSB0aGluZ3MgdGhhdCBkZXB0aHMgb3IgaGVpZ2h0cyBjYW4gc2hvdyw8L3A+XG5cdFx0XHQ8cD5BbmQgaWYgdGhpcyByb2FkIGZvciBubyBzdXJlIGVuZCBJIGdvPC9wPlxuXHRcdFx0PHA+V2hhdCBmb2xseSBpcyBtaW5lPyBCdXQgYW55IHdvcmRzIGFyZSB3ZWFrLjwvcD5cblx0XHRcdDxwPlRoeSB3aXNkb20gZnVydGhlciB0aGFuIHRoZSB0aGluZ3MgSSBzcGVhazwvcD5cblx0XHRcdDxwPkNhbiBzZWFyY2ggdGhlIGV2ZW50IHRoYXQgd291bGQgYmUuJnJkcXVvOzwvcD5cblx0XHRcdDxwIGNsYXNzPVwic2xpbmRlbnQxMGVtXCI+SGVyZSBJIHN0YXllZDwvcD5cblx0XHRcdDxwPk15IHN0ZXBzIGFtaWQgdGhlIGRhcmtuZXNzLCBhbmQgdGhlIFNoYWRlPC9wPlxuXHRcdFx0PHA+VGhhdCBsZWQgbWUgaGVhcmQgYW5kIHR1cm5lZCwgbWFnbmFuaW1vdXMsPC9wPlxuXHRcdFx0PHA+QW5kIHNhdyBtZSBkcmFpbmVkIG9mIHB1cnBvc2UgaGFsdGluZyB0aHVzLDwvcD5cblx0XHRcdDxwPkFuZCBhbnN3ZXJlZCwgJmxkcXVvO0lmIHRoeSBjb3dhcmQtYm9ybiB0aG91Z2h0cyBiZSBjbGVhciw8L3A+XG5cdFx0XHQ8cD5BbmQgYWxsIHRoeSBvbmNlIGludGVudCwgaW5maXJtZWQgb2YgZmVhciw8L3A+XG5cdFx0XHQ8cD5Ccm9rZW4sIHRoZW4gYXJ0IHRob3UgYXMgc2NhcmVkIGJlYXN0cyB0aGF0IHNoeTwvcD5cblx0XHRcdDxwPkZyb20gc2hhZG93cywgc3VyZWx5IHRoYXQgdGhleSBrbm93IG5vdCB3aHk8L3A+XG5cdFx0XHQ8cD5Ob3Igd2hlcmVmb3JlLiAuIC4gSGVhcmtlbiwgdG8gY29uZm91bmQgdGh5IGZlYXIsPC9wPlxuXHRcdFx0PHA+VGhlIHRoaW5ncyB3aGljaCBmaXJzdCBJIGhlYXJkLCBhbmQgYnJvdWdodCBtZSBoZXJlLjwvcD5cblx0XHRcdDxwPk9uZSBjYW1lIHdoZXJlLCBpbiB0aGUgT3V0ZXIgUGxhY2UsIEkgZHdlbGwsPC9wPlxuXHRcdFx0PHA+U3VzcGVuc2UgZnJvbSBob3BlIG9mIEhlYXZlbiBvciBmZWFyIG9mIEhlbGwsPC9wPlxuXHRcdFx0PHA+UmFkaWFudCBpbiBsaWdodCB0aGF0IG5hdGl2ZSByb3VuZCBoZXIgY2x1bmcsPC9wPlxuXHRcdFx0PHA+QW5kIGNhc3QgaGVyIGV5ZXMgb3VyIGhvcGVsZXNzIFNoYWRlcyBhbW9uZzwvcD5cblx0XHRcdDxwPihFeWVzIHdpdGggbm8gZWFydGhseSBsaWtlIGJ1dCBoZWF2ZW4mcnNxdW87cyBvd24gYmx1ZSksPC9wPlxuXHRcdFx0PHA+QW5kIGNhbGxlZCBtZSB0byBoZXIgaW4gc3VjaCB2b2ljZSBhcyBmZXc8L3A+XG5cdFx0XHQ8cD5JbiB0aGF0IGdyaW0gcGxhY2UgaGFkIGhlYXJkLCBzbyBsb3csIHNvIGNsZWFyLDwvcD5cblx0XHRcdDxwPlNvIHRvbmVkIGFuZCBjYWRlbmNlZCBmcm9tIHRoZSBVdG1vc3QgU3BoZXJlLDwvcD5cblx0XHRcdDxwPlRoZSBVbmF0dGFpbmFibGUgSGVhdmVuIGZyb20gd2hpY2ggc2hlIGNhbWUuPC9wPlxuXHRcdFx0PHA+JmxzcXVvO08gTWFudHVhbiBTcGlyaXQsJnJzcXVvOyBzaGUgc2FpZCwgJmxzcXVvO3dob3NlIGxhc3RpbmcgZmFtZTwvcD5cblx0XHRcdDxwPkNvbnRpbnVlcyBvbiB0aGUgZWFydGggeWUgbGVmdCwgYW5kIHN0aWxsPC9wPlxuXHRcdFx0PHA+V2l0aCBUaW1lIHNoYWxsIHN0YW5kLCBhbiBlYXJ0aGx5IGZyaWVuZCB0byBtZSw8L3A+XG5cdFx0XHQ8cD4tIE15IGZyaWVuZCwgbm90IGZvcnR1bmUmcnNxdW87cyZuYnNwOyZuZGFzaDsgY2xpbWJzIGEgcGF0aCBzbyBpbGw8L3A+XG5cdFx0XHQ8cD5UaGF0IGFsbCB0aGUgbmlnaHQtYnJlZCBmZWFycyBoZSBoYXN0ZXMgdG8gZmxlZTwvcD5cblx0XHRcdDxwPldlcmUga2luZGx5IHRvIHRoZSB0aGluZyBoZSBuZWFycy4gVGhlIHRhbGU8L3A+XG5cdFx0XHQ8cD5Nb3ZlZCB0aHJvdWdoIHRoZSBwZWFjZSBvZiBJIGxlYXZlbiwgYW5kIHN3aWZ0IEkgc3BlZDwvcD5cblx0XHRcdDxwPkRvd253YXJkLCB0byBhaWQgbXkgZnJpZW5kIGluIGxvdmUmcnNxdW87cyBhdmFpbCw8L3A+XG5cdFx0XHQ8cD5XaXRoIHNjYW50eSB0aW1lIHRoZXJlZm9yLCB0aGF0IGhhbGYgSSBkcmVhZDwvcD5cblx0XHRcdDxwPlRvbyBsYXRlIEkgY2FtZS4gQnV0IHRob3Ugc2hhbHQgaGFzdGUsIGFuZCBnbzwvcD5cblx0XHRcdDxwPldpdGggZ29sZGVuIHdpc2RvbSBvZiB0aHkgc3BlZWNoLCB0aGF0IHNvPC9wPlxuXHRcdFx0PHA+Rm9yIG1lIGJlIGNvbnNvbGF0aW9uLiBUaG91IHNoYWx0IHNheSw8L3A+XG5cdFx0XHQ8cD4mbGRxdW87SSBjb21lIGZyb20gQmVhdHJpY8OrLiZyZHF1bzsgRG93bndhcmQgZmFyLDwvcD5cblx0XHRcdDxwPkZyb20gSGVhdmVuIHRvIEkgbGVhdmVuIEkgc2FuaywgZnJvbSBzdGFyIHRvIHN0YXIsPC9wPlxuXHRcdFx0PHA+VG8gZmluZCB0aGVlLCBhbmQgdG8gcG9pbnQgaGlzIHJlc2N1aW5nIHdheS48L3A+XG5cdFx0XHQ8cD5GYWluIHdvdWxkIEkgdG8gbXkgcGxhY2Ugb2YgbGlnaHQgcmV0dXJuOzwvcD5cblx0XHRcdDxwPkxvdmUgbW92ZWQgbWUgZnJvbSBpdCwgYW5kIGdhdmUgbWUgcG93ZXIgdG8gbGVhcm48L3A+XG5cdFx0XHQ8cD5UaHkgc3BlZWNoLiBXaGVuIG5leHQgYmVmb3JlIG15IExvcmQgSSBzdGFuZDwvcD5cblx0XHRcdDxwPkkgdmVyeSBvZnQgc2hhbGwgcHJhaXNlIHRoZWUuJnJzcXVvOzwvcD5cblx0XHRcdDxwIGNsYXNzPVwic2xpbmRlbnQxMGVtXCI+SGVyZSBzaGUgY2Vhc2VkLDwvcD5cblx0XHRcdDxwPkFuZCBJIGdhdmUgYW5zd2VyIHRvIHRoYXQgZGVhciBjb21tYW5kLDwvcD5cblx0XHRcdDxwPiZsc3F1bztMYWR5LCBhbG9uZSB0aHJvdWdoIHdob20gdGhlIHdob2xlIHJhY2Ugb2YgdGhvc2U8L3A+XG5cdFx0XHQ8cD5UaGUgc21hbGxlc3QgSGVhdmVuIHRoZSBtb29uJnJzcXVvO3Mgc2hvcnQgb3JiaXRzIGhvbGQ8L3A+XG5cdFx0XHQ8cD5FeGNlbHMgaW4gaXRzIGNyZWF0aW9uLCBub3QgdGh5IGxlYXN0LDwvcD5cblx0XHRcdDxwPlRoeSBsaWdodGVzdCB3aXNoIGluIHRoaXMgZGFyayByZWFsbSB3ZXJlIHRvbGQ8L3A+XG5cdFx0XHQ8cD5WYWlubHkuIEJ1dCBzaG93IG1lIHdoeSB0aGUgSGVhdmVucyB1bmNsb3NlPC9wPlxuXHRcdFx0PHA+VG8gbG9vc2UgdGhlZSBmcm9tIHRoZW0sIGFuZCB0aHlzZWxmIGNvbnRlbnQ8L3A+XG5cdFx0XHQ8cD5Db3VsZHN0IHRodXMgY29udGludWUgaW4gc3VjaCBzdHJhbmdlIGRlc2NlbnQ8L3A+XG5cdFx0XHQ8cD5Gcm9tIHRoYXQgbW9zdCBTcGFjaW91cyBQbGFjZSBmb3Igd2hpY2ggeWUgYnVybiw8L3A+XG5cdFx0XHQ8cD5BbmQgd2hpbGUgeWUgZnVydGhlciBsZWZ0LCB3b3VsZCBmYWluIHJldHVybi4mcnNxdW87PC9wPlxuXHRcdDwvZGl2PlxuXHRcdDxkaXYgY2xhc3M9XCJzdGFuemFcIj5cblx0XHRcdDxwPiZsZHF1bzsgJmxzcXVvO1RoYXQgd2hpY2ggdGhvdSB3b3VsZHN0LCZyc3F1bzsgc2hlIHNhaWQsICZsc3F1bztJIGJyaWVmbHkgdGVsbC48L3A+XG5cdFx0XHQ8cD5UaGVyZSBpcyBubyBmZWFyIG5vciBhbnkgaHVydCBpbiBIZWxsLDwvcD5cblx0XHRcdDxwPkV4Y2VwdCB0aGF0IGl0IGJlIHBvd2VyZnVsLiBHb2QgaW4gbWU8L3A+XG5cdFx0XHQ8cD5JcyBncmFjaW91cywgdGhhdCB0aGUgcGl0ZW91cyBzaWdodHMgSSBzZWU8L3A+XG5cdFx0XHQ8cD5JIHNoYXJlIG5vdCwgbm9yIG15c2VsZiBjYW4gc2hyaW5rIHRvIGZlZWw8L3A+XG5cdFx0XHQ8cD5UaGUgZmxhbWUgb2YgYWxsIHRoaXMgYnVybmluZy4gT25lIHRoZXJlIGlzPC9wPlxuXHRcdFx0PHA+SW4gaGVpZ2h0IGFtb25nIHRoZSBIb2xpZXN0IHBsYWNlZCwgYW5kIHNoZTwvcD5cblx0XHRcdDxwPi0gTWVyY3kgaGVyIG5hbWUmbmJzcDsmbmRhc2g7IGFtb25nIEdvZCZyc3F1bztzIG15c3RlcmllczwvcD5cblx0XHRcdDxwPkR3ZWxscyBpbiB0aGUgbWlkc3QsIGFuZCBoYXRoIHRoZSBwb3dlciB0byBzZWU8L3A+XG5cdFx0XHQ8cD5IaXMganVkZ21lbnRzLCBhbmQgdG8gYnJlYWsgdGhlbS4gVGhpcyBzaGFycDwvcD5cblx0XHRcdDxwPkkgdGVsbCB0aGVlLCB3aGVuIHNoZSBzYXcsIHNoZSBjYWxsZWQsIHRoYXQgc288L3A+XG5cdFx0XHQ8cD5MZWFuZWQgTHVjaWEgdG93YXJkIGhlciB3aGlsZSBzaGUgc3Bha2UmbmJzcDsmbmRhc2g7IGFuZCBzYWlkLDwvcD5cblx0XHRcdDxwPiZsZHF1bztPbmUgdGhhdCBpcyBmYWl0aGZ1bCB0byB0aHkgbmFtZSBpcyBzcGVkLDwvcD5cblx0XHRcdDxwPkV4Y2VwdCB0aGF0IG5vdyB5ZSBhaWQgaGltLiZyZHF1bzsgU2hlIHRoZXJlYXQsPC9wPlxuXHRcdFx0PHA+Jm5kYXNoOyZuYnNwO0x1Y2lhLCB0byBhbGwgbWVuJnJzcXVvO3Mgd3JvbmdzIGluaW1pY2FsIC08L3A+XG5cdFx0XHQ8cD5MZWZ0IGhlciBIaWdoIFBsYWNlLCBhbmQgY3Jvc3NlZCB0byB3aGVyZSBJIHNhdDwvcD5cblx0XHRcdDxwPkluIHNwZWVjaCB3aXRoIFJhY2hlbCAob2YgdGhlIGZpcnN0IG9mIGFsbDwvcD5cblx0XHRcdDxwPkdvZCBzYXZlZCkuICZsZHF1bztPIEJlYXRyaWNlLCBQcmFpc2Ugb2YgR29kLCZyZHF1bzs8L3A+XG5cdFx0XHQ8cD4tIFNvIHNhaWQgc2hlIHRvIG1lJm5ic3A7Jm5kYXNoOyAmbGRxdW87c2l0dCZyc3F1bztzdCB0aG91IGhlcmUgc28gc2xvdzwvcD5cblx0XHRcdDxwPlRvIGFpZCBoaW0sIG9uY2Ugb24gZWFydGggdGhhdCBsb3ZlZCB0aGVlIHNvPC9wPlxuXHRcdFx0PHA+VGhhdCBhbGwgaGUgbGVmdCB0byBzZXJ2ZSB0aGVlPyBIZWFyJnJzcXVvO3N0IHRob3Ugbm90PC9wPlxuXHRcdFx0PHA+VGhlIGFuZ3Vpc2ggb2YgaGlzIHBsYWludD8gYW5kIGRvc3Qgbm90IHNlZSw8L3A+XG5cdFx0XHQ8cD5CeSB0aGF0IGRhcmsgc3RyZWFtIHRoYXQgbmV2ZXIgc2Vla3MgYSBzZWEsPC9wPlxuXHRcdFx0PHA+VGhlIGRlYXRoIHRoYXQgdGhyZWF0cyBoaW0/JnJkcXVvOzwvcD5cblx0XHRcdDxwIGNsYXNzPVwic2xpbmRlbnQ4ZW1cIj5Ob25lLCBhcyB0aHVzIHNoZSBzYWlkLDwvcD5cblx0XHRcdDxwPk5vbmUgZXZlciB3YXMgc3dpZnQgb24gZWFydGggaGlzIGdvb2QgdG8gY2hhc2UsPC9wPlxuXHRcdFx0PHA+Tm9uZSBldmVyIG9uIGVhcnRoIHdhcyBzd2lmdCB0byBsZWF2ZSBoaXMgZHJlYWQsPC9wPlxuXHRcdFx0PHA+QXMgY2FtZSBJIGRvd253YXJkIGZyb20gdGhhdCBzYWNyZWQgcGxhY2U8L3A+XG5cdFx0XHQ8cD5UbyBmaW5kIHRoZWUgYW5kIGludm9rZSB0aGVlLCBjb25maWRlbnQ8L3A+XG5cdFx0XHQ8cD5Ob3QgdmFpbmx5IGZvciBoaXMgbmVlZCB0aGUgZ29sZCB3ZXJlIHNwZW50PC9wPlxuXHRcdFx0PHA+T2YgdGh5IHdvcmQtd2lzZG9tLiZyc3F1bzsgSGVyZSBzaGUgdHVybmVkIGF3YXksPC9wPlxuXHRcdFx0PHA+SGVyIGJyaWdodCBleWVzIGNsb3VkZWQgd2l0aCB0aGVpciB0ZWFycywgYW5kIEksPC9wPlxuXHRcdFx0PHA+V2hvIHNhdyB0aGVtLCB0aGVyZWZvcmUgbWFkZSBtb3JlIGhhc3RlIHRvIHJlYWNoPC9wPlxuXHRcdFx0PHA+VGhlIHBsYWNlIHNoZSB0b2xkLCBhbmQgZm91bmQgdGhlZS4gQ2Fuc3QgdGhvdSBzYXk8L3A+XG5cdFx0XHQ8cD5JIGZhaWxlZCB0aHkgcmVzY3VlPyBJcyB0aGUgYmVhc3QgYW5pZ2g8L3A+XG5cdFx0XHQ8cD5Gcm9tIHdoaWNoIHllIHF1YWlsZWQ/IFdoZW4gc3VjaCBkZWFyIHNhaW50cyBiZXNlZWNoPC9wPlxuXHRcdFx0PHA+Jm5kYXNoOyZuYnNwO1RocmVlIGZyb20gdGhlIEhpZ2hlc3QmbmJzcDsmbmRhc2g7IHRoYXQgSGVhdmVuIHRoeSBjb3Vyc2UgYWxsb3c8L3A+XG5cdFx0XHQ8cD5XaHkgaGFsdCB5ZSBmZWFyZnVsPyBJbiBzdWNoIGd1YXJkcyBhcyB0aG91PC9wPlxuXHRcdFx0PHA+VGhlIGZhaW50ZXN0LWhlYXJ0ZWQgbWlnaHQgYmUgYm9sZC4mcmRxdW87PC9wPlxuXHRcdFx0PHAgY2xhc3M9XCJzbGluZGVudDE0ZW1cIj5BcyBmbG93ZXJzLDwvcD5cblx0XHRcdDxwPkNsb3NlLWZvbGRlZCB0aHJvdWdoIHRoZSBjb2xkIGFuZCBsaWdodGxlc3MgaG91cnMsPC9wPlxuXHRcdFx0PHA+VGhlaXIgYmVuZGVkIHN0ZW1zIGVyZWN0LCBhbmQgb3BlbmluZyBmYWlyPC9wPlxuXHRcdFx0PHA+QWNjZXB0IHRoZSB3aGl0ZSBsaWdodCBhbmQgdGhlIHdhcm1lciBhaXI8L3A+XG5cdFx0XHQ8cD5PZiBtb3JuaW5nLCBzbyBteSBmYWludGluZyBoZWFydCBhbmV3PC9wPlxuXHRcdFx0PHA+TGlmdGVkLCB0aGF0IGhlYXJkIGhpcyBjb21mb3J0LiBTd2lmdCBJIHNwYWtlLDwvcD5cblx0XHRcdDxwPiZsZHF1bztPIGNvdXJ0ZW91cyB0aG91LCBhbmQgc2hlIGNvbXBhc3Npb25hdGUhPC9wPlxuXHRcdFx0PHA+VGh5IGhhc3RlIHRoYXQgc2F2ZWQgbWUsIGFuZCBoZXIgd2FybmluZyB0cnVlLDwvcD5cblx0XHRcdDxwPkJleW9uZCBteSB3b3J0aCBleGFsdCBtZS4gVGhpbmUgSSBtYWtlPC9wPlxuXHRcdFx0PHA+TXkgd2lsbC4gSW4gY29uY29yZCBvZiBvbmUgbWluZCBmcm9tIG5vdyw8L3A+XG5cdFx0XHQ8cD5PIE1hc3RlciBhbmQgbXkgR3VpZGUsIHdoZXJlIGxlYWRlc3QgdGhvdTwvcD5cblx0XHRcdDxwPkkgZm9sbG93LiZyZHF1bzs8L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50MmVtXCI+QW5kIHdlLCB3aXRoIG5vIG1vcmUgd29yZHMmcnNxdW87IGRlbGF5LDwvcD5cblx0XHRcdDxwPldlbnQgZm9yd2FyZCBvbiB0aGF0IGhhcmQgYW5kIGRyZWFkZnVsIHdheS48L3A+XG5cdFx0PC9kaXY+YCxcblxuXHRgPHAgY2xhc3M9XCJjYW50b2hlYWRcIj5DYW50byBJSUk8L3A+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+VEhFIGdhdGV3YXkgdG8gdGhlIGNpdHkgb2YgRG9vbS4gVGhyb3VnaCBtZTwvcD5cblx0XHRcdDxwPlRoZSBlbnRyYW5jZSB0byB0aGUgRXZlcmxhc3RpbmcgUGFpbi48L3A+XG5cdFx0XHQ8cD5UaGUgR2F0ZXdheSBvZiB0aGUgTG9zdC4gVGhlIEV0ZXJuYWwgVGhyZWU8L3A+XG5cdFx0XHQ8cD5KdXN0aWNlIGltcGVsbGVkIHRvIGJ1aWxkIG1lLiBIZXJlIHllIHNlZTwvcD5cblx0XHRcdDxwPldpc2RvbSBTdXByZW1lIGF0IHdvcmssIGFuZCBQcmltYWwgUG93ZXIsPC9wPlxuXHRcdFx0PHA+QW5kIExvdmUgU3VwZXJuYWwgaW4gdGhlaXIgZGF3bmxlc3MgZGF5LjwvcD5cblx0XHRcdDxwPkVyZSBmcm9tIHRoZWlyIHRob3VnaHQgY3JlYXRpb24gcm9zZSBpbiBmbG93ZXI8L3A+XG5cdFx0XHQ8cD5FdGVybmFsIGZpcnN0IHdlcmUgYWxsIHRoaW5ncyBmaXhlZCBhcyB0aGV5LjwvcD5cblx0XHRcdDxwPk9mIEluY3JlYXRlIFBvd2VyIGluZmluaXRlIGZvcm1lZCBhbSBJPC9wPlxuXHRcdFx0PHA+VGhhdCBkZWF0aGxlc3MgYXMgdGhlbXNlbHZlcyBJIGRvIG5vdCBkaWUuPC9wPlxuXHRcdFx0PHA+SnVzdGljZSBkaXZpbmUgaGFzIHdlaWdoZWQ6IHRoZSBkb29tIGlzIGNsZWFyLjwvcD5cblx0XHRcdDxwPkFsbCBob3BlIHJlbm91bmNlLCB5ZSBsb3N0LCB3aG8gZW50ZXIgaGVyZS48L3A+XG5cdFx0XHQ8cD5UaGlzIHNjcm9sbCBpbiBnbG9vbSBhYm92ZSB0aGUgZ2F0ZSBJIHJlYWQsPC9wPlxuXHRcdFx0PHA+QW5kIGZvdW5kIGl0IGZlYXJmdWwuICZsZHF1bztNYXN0ZXIsIGhhcmQsJnJkcXVvOyBJIHNhaWQsPC9wPlxuXHRcdFx0PHA+JmxkcXVvO1RoaXMgc2F5aW5nIHRvIG1lLlwiIEFuZCBoZSwgYXMgb25lIHRoYXQgbG9uZzwvcD5cblx0XHRcdDxwPldhcyBjdXN0b21lZCwgYW5zd2VyZWQsICZsZHF1bztObyBkaXN0cnVzdCBtdXN0IHdyb25nPC9wPlxuXHRcdFx0PHA+SXRzIE1ha2VyLCBub3IgdGh5IGNvd2FyZGVyIG1vb2QgcmVzdW1lPC9wPlxuXHRcdFx0PHA+SWYgaGVyZSB5ZSBlbnRlci4gVGhpcyB0aGUgcGxhY2Ugb2YgZG9vbTwvcD5cblx0XHRcdDxwPkkgdG9sZCB0aGVlLCB3aGVyZSB0aGUgbG9zdCBpbiBkYXJrbmVzcyBkd2VsbC48L3A+XG5cdFx0XHQ8cD5IZXJlLCBieSB0aGVtc2VsdmVzIGRpdm9yY2VkIGZyb20gbGlnaHQsIHRoZXkgZmVsbCw8L3A+XG5cdFx0XHQ8cD5BbmQgYXJlIGFzIHllIHNoYWxsIHNlZSB0aGVtLiZyZHF1bzsgSGVyZSBoZSBsZW50PC9wPlxuXHRcdFx0PHA+QSBoYW5kIHRvIGRyYXcgbWUgdGhyb3VnaCB0aGUgZ2F0ZSwgYW5kIGJlbnQ8L3A+XG5cdFx0XHQ8cD5BIGdsYW5jZSB1cG9uIG15IGZlYXIgc28gY29uZmlkZW50PC9wPlxuXHRcdFx0PHA+VGhhdCBJLCB0b28gbmVhcmx5IHRvIG15IGZvcm1lciBkcmVhZDwvcD5cblx0XHRcdDxwPlJldHVybmVkLCB0aHJvdWdoIGFsbCBteSBoZWFydCB3YXMgY29tZm9ydGVkLDwvcD5cblx0XHRcdDxwPkFuZCBkb3dud2FyZCB0byB0aGUgc2VjcmV0IHRoaW5ncyB3ZSB3ZW50LjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5Eb3dud2FyZCB0byBuaWdodCwgYnV0IG5vdCBvZiBtb29uIGFuZCBjbG91ZCw8L3A+XG5cdFx0XHQ8cD5Ob3QgbmlnaHQgd2l0aCBhbGwgaXRzIHN0YXJzLCBhcyBuaWdodCB3ZSBrbm93LDwvcD5cblx0XHRcdDxwPkJ1dCBidXJkZW5lZCB3aXRoIGFuIG9jZWFuLXdlaWdodCBvZiB3b2U8L3A+XG5cdFx0XHQ8cD5UaGUgZGFya25lc3MgY2xvc2VkIHVzLjwvcD5cblx0XHRcdDxwIGNsYXNzPVwic2xpbmRlbnQ2ZW1cIj5TaWdocywgYW5kIHdhaWxpbmdzIGxvdWQsPC9wPlxuXHRcdFx0PHA+T3V0Y3JpZXMgcGVycGV0dWFsIG9mIHJlY3J1aXRlZCBwYWluLDwvcD5cblx0XHRcdDxwPlNvdW5kcyBvZiBzdHJhbmdlIHRvbmd1ZXMsIGFuZCBhbmdlcnMgdGhhdCByZW1haW48L3A+XG5cdFx0XHQ8cD5WZW5nZWxlc3MgZm9yIGV2ZXIsIHRoZSB0aGljayBhbmQgY2xhbW9yb3VzIGNyb3dkPC9wPlxuXHRcdFx0PHA+T2YgZGlzY29yZHMgcHJlc3NlZCwgdGhhdCBuZWVkcyBJIHdlcHQgdG8gaGVhciw8L3A+XG5cdFx0XHQ8cD5GaXJzdCBoZWFyaW5nLiBUaGVyZSwgd2l0aCByZWFjaCBvZiBoYW5kcyBhbmVhciw8L3A+XG5cdFx0XHQ8cD5BbmQgdm9pY2VzIHBhc3Npb24taG9hcnNlLCBvciBzaHJpbGxlZCB3aXRoIGZyaWdodCw8L3A+XG5cdFx0XHQ8cD5UaGUgdHVtdWx0IG9mIHRoZSBldmVybGFzdGluZyBuaWdodCw8L3A+XG5cdFx0XHQ8cD5BcyBzYW5kIHRoYXQgZGFuY2VzIGluIGNvbnRpbnVhbCB3aW5kLDwvcD5cblx0XHRcdDxwPlR1cm5zIG9uIGl0c2VsZiBmb3IgZXZlci48L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50OGVtXCI+QW5kIEksIG15IGhlYWQ8L3A+XG5cdFx0XHQ8cD5CZWdpcnQgd2l0aCBtb3ZlbWVudHMsIGFuZCBteSBlYXJzIGJlZGlubmVkPC9wPlxuXHRcdFx0PHA+V2l0aCBvdXRjcmllcyByb3VuZCBtZSwgdG8gbXkgbGVhZGVyIHNhaWQsPC9wPlxuXHRcdFx0PHA+JmxkcXVvO01hc3Rlciwgd2hhdCBoZWFyIEk/IFdobyBzbyBvdmVyYm9ybmU8L3A+XG5cdFx0XHQ8cD5XaXRoIHdvZXMgYXJlIHRoZXNlPyZyZHF1bzs8L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50NmVtXCI+SGUgYW5zd2VyZWQsICZsZHF1bztUaGVzZSBiZSB0aGV5PC9wPlxuXHRcdFx0PHA+VGhhdCBwcmFpc2VsZXNzIGxpdmVkIGFuZCBibGFtZWxlc3MuIE5vdyB0aGUgc2Nvcm48L3A+XG5cdFx0XHQ8cD5PZiBIZWlnaHQgYW5kIERlcHRoIGFsaWtlLCBhYm9ydGlvbnMgZHJlYXI7PC9wPlxuXHRcdFx0PHA+Q2FzdCB3aXRoIHRob3NlIGFiamVjdCBhbmdlbHMgd2hvc2UgZGVsYXk8L3A+XG5cdFx0XHQ8cD5UbyBqb2luIHJlYmVsbGlvbiwgb3IgdGhlaXIgTG9yZCBkZWZlbmQsPC9wPlxuXHRcdFx0PHA+V2FpdGluZyB0aGVpciBwcm92ZWQgYWR2YW50YWdlLCBmbHVuZyB0aGVtIGhlcmUuIC08L3A+XG5cdFx0XHQ8cD5DaGFzZWQgZm9ydGggZnJvbSBIZWF2ZW4sIGxlc3QgZWxzZSBpdHMgYmVhdXRpZXMgZW5kPC9wPlxuXHRcdFx0PHA+VGhlIHB1cmUgcGVyZmVjdGlvbiBvZiB0aGVpciBzdGFpbmxlc3MgY2xhaW0sPC9wPlxuXHRcdFx0PHA+T3V0LWhlcmRlZCBmcm9tIHRoZSBzaGluaW5nIGdhdGUgdGhleSBjYW1lLDwvcD5cblx0XHRcdDxwPldoZXJlIHRoZSBkZWVwIGhlbGxzIHJlZnVzZWQgdGhlbSwgbGVzdCB0aGUgbG9zdDwvcD5cblx0XHRcdDxwPkJvYXN0IHNvbWV0aGluZyBiYXNlciB0aGFuIHRoZW1zZWx2ZXMuJnJkcXVvOzwvcD5cblx0XHRcdDxwIGNsYXNzPVwic2xpbmRlbnQxNGVtXCI+QW5kIEksPC9wPlxuXHRcdFx0PHA+JmxkcXVvO01hc3Rlciwgd2hhdCBncmlldmFuY2UgaGF0aCB0aGVpciBmYWlsdXJlIGNvc3QsPC9wPlxuXHRcdFx0PHA+VGhhdCB0aHJvdWdoIHRoZSBsYW1lbnRhYmxlIGRhcmsgdGhleSBjcnk/JnJkcXVvOzwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5IZSBhbnN3ZXJlZCwgJmxkcXVvO0JyaWVmbHkgYXQgYSB0aGluZyBub3Qgd29ydGg8L3A+XG5cdFx0XHQ8cD5XZSBnbGFuY2UsIGFuZCBwYXNzIGZvcmdldGZ1bC4gSG9wZSBpbiBkZWF0aDwvcD5cblx0XHRcdDxwPlRoZXkgaGF2ZSBub3QuIE1lbW9yeSBvZiB0aGVtIG9uIHRoZSBlYXJ0aDwvcD5cblx0XHRcdDxwPldoZXJlIG9uY2UgdGhleSBsaXZlZCByZW1haW5zIG5vdC4gTm9yIHRoZSBicmVhdGg8L3A+XG5cdFx0XHQ8cD5PZiBKdXN0aWNlIHNoYWxsIGNvbmRlbW4sIG5vciBNZXJjeSBwbGVhZCw8L3A+XG5cdFx0XHQ8cD5CdXQgYWxsIGFsaWtlIGRpc2RhaW4gdGhlbS4gVGhhdCB0aGV5IGtub3c8L3A+XG5cdFx0XHQ8cD5UaGVtc2VsdmVzIHNvIG1lYW4gYmVuZWF0aCBhdWdodCBlbHNlIGNvbnN0cmFpbnM8L3A+XG5cdFx0XHQ8cD5UaGUgZW52aW91cyBvdXRjcmllcyB0aGF0IHRvbyBsb25nIHllIGhlZWQuPC9wPlxuXHRcdFx0PHA+TW92ZSBwYXN0LCBidXQgc3BlYWsgbm90LiZyZHF1bzs8L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50OGVtXCI+VGhlbiBJIGxvb2tlZCwgYW5kIGxvLDwvcD5cblx0XHRcdDxwPldlcmUgc291bHMgaW4gY2Vhc2VsZXNzIGFuZCB1bm51bWJlcmVkIHRyYWluczwvcD5cblx0XHRcdDxwPlRoYXQgcGFzdCBtZSB3aGlybGVkIHVuZW5kaW5nLCB2YWlubHkgbGVkPC9wPlxuXHRcdFx0PHA+Tm93aGl0aGVyLCBpbiB1c2VsZXNzIGFuZCB1bnBhdXNpbmcgaGFzdGUuPC9wPlxuXHRcdFx0PHA+QSBmbHV0dGVyaW5nIGVuc2lnbiBhbGwgdGhlaXIgZ3VpZGUsIHRoZXkgY2hhc2VkPC9wPlxuXHRcdFx0PHA+VGhlbXNlbHZlcyBmb3IgZXZlci4gSSBoYWQgbm90IHRob3VnaHQgdGhlIGRlYWQsPC9wPlxuXHRcdFx0PHA+VGhlIHdob2xlIHdvcmxkJnJzcXVvO3MgZGVhZCwgc28gbWFueSBhcyB0aGVzZS4gSSBzYXc8L3A+XG5cdFx0XHQ8cD5UaGUgc2hhZG93IG9mIGhpbSBlbGVjdCB0byBQZXRlciZyc3F1bztzIHNlYXQ8L3A+XG5cdFx0XHQ8cD5XaG8gbWFkZSB0aGUgZ3JlYXQgcmVmdXNhbCwgYW5kIHRoZSBsYXcsPC9wPlxuXHRcdFx0PHA+VGhlIHVuc3dlcnZpbmcgbGF3IHRoYXQgbGVmdCB0aGVtIHRoaXMgcmV0cmVhdDwvcD5cblx0XHRcdDxwPlRvIHNlYWwgdGhlIGFib3J0aW9uIG9mIHRoZWlyIGxpdmVzLCBiZWNhbWU8L3A+XG5cdFx0XHQ8cD5JbGx1bWluZWQgdG8gbWUsIGFuZCB0aGVtc2VsdmVzIEkga25ldyw8L3A+XG5cdFx0XHQ8cD5UbyBHb2QgYW5kIGFsbCBoaXMgZm9lcyB0aGUgZnV0aWxlIGNyZXc8L3A+XG5cdFx0XHQ8cD5Ib3cgaGF0ZWZ1bCBpbiB0aGVpciBldmVybGFzdGluZyBzaGFtZS48L3A+XG5cdFx0PC9kaXY+XG5cdFx0PGRpdiBjbGFzcz1cInN0YW56YVwiPlxuXHRcdFx0PHA+SSBzYXcgdGhlc2UgdmljdGltcyBvZiBjb250aW51ZWQgZGVhdGg8L3A+XG5cdFx0XHQ8cD4tIEZvciBsaXZlZCB0aGV5IG5ldmVyJm5ic3A7Jm5kYXNoOyB3ZXJlIG5ha2VkIGFsbCwgYW5kIGxvdWQ8L3A+XG5cdFx0XHQ8cD5Bcm91bmQgdGhlbSBjbG9zZWQgYSBuZXZlci1jZWFzaW5nIGNsb3VkPC9wPlxuXHRcdFx0PHA+T2YgaG9ybmV0cyBhbmQgZ3JlYXQgd2FzcHMsIHRoYXQgYnV6emVkIGFuZCBjbHVuZyw8L3A+XG5cdFx0XHQ8cD4tIFdlYWsgcGFpbiBmb3Igd2Vha2xpbmdzIG1lZXQsJm5ic3A7Jm5kYXNoOyBhbmQgd2hlcmUgdGhleSBzdHVuZyw8L3A+XG5cdFx0XHQ8cD5CbG9vZCBmcm9tIHRoZWlyIGZhY2VzIHN0cmVhbWVkLCB3aXRoIHNvYmJpbmcgYnJlYXRoLDwvcD5cblx0XHRcdDxwPkFuZCBhbGwgdGhlIGdyb3VuZCBiZW5lYXRoIHdpdGggdGVhcnMgYW5kIGJsb29kPC9wPlxuXHRcdFx0PHA+V2FzIGRyZW5jaGVkLCBhbmQgY3Jhd2xpbmcgaW4gdGhhdCBsb2F0aHNvbWUgbXVkPC9wPlxuXHRcdFx0PHA+VGhlcmUgd2VyZSBncmVhdCB3b3JtcyB0aGF0IGRyYW5rIGl0LjwvcD5cblx0XHRcdDxwIGNsYXNzPVwic2xpbmRlbnQxMGVtXCI+R2xhZGx5IHRoZW5jZTwvcD5cblx0XHRcdDxwPkkgZ2F6ZWQgZmFyIGZvcndhcmQuIERhcmsgYW5kIHdpZGUgdGhlIGZsb29kPC9wPlxuXHRcdFx0PHA+VGhhdCBmbG93ZWQgYmVmb3JlIHVzLiBPbiB0aGUgbmVhcmVyIHNob3JlPC9wPlxuXHRcdFx0PHA+V2VyZSBwZW9wbGUgd2FpdGluZy4gJmxkcXVvO01hc3Rlciwgc2hvdyBtZSB3aGVuY2U8L3A+XG5cdFx0XHQ8cD5UaGVzZSBjYW1lLCBhbmQgd2hvIHRoZXkgYmUsIGFuZCBwYXNzaW5nIGhlbmNlPC9wPlxuXHRcdFx0PHA+V2hlcmUgZ28gdGhleT8gV2hlcmVmb3JlIHdhaXQgdGhleSB0aGVyZSBjb250ZW50LDwvcD5cblx0XHRcdDxwPiZuZGFzaDsmbmJzcDtUaGUgZmFpbnQgbGlnaHQgc2hvd3MgaXQsJm5ic3A7Jm5kYXNoOyBmb3IgdGhlaXIgdHJhbnNpdCBvJnJzcXVvO2VyPC9wPlxuXHRcdFx0PHA+VGhlIHVuYnJpZGdlZCBhYnlzcz8mcmRxdW87PC9wPlxuXHRcdFx0PHAgY2xhc3M9XCJzbGluZGVudDZlbVwiPkhlIGFuc3dlcmVkLCAmbGRxdW87V2hlbiB3ZSBzdGFuZDwvcD5cblx0XHRcdDxwPlRvZ2V0aGVyLCB3YWl0aW5nIG9uIHRoZSBqb3lsZXNzIHN0cmFuZCw8L3A+XG5cdFx0XHQ8cD5JbiBhbGwgaXQgc2hhbGwgYmUgdG9sZCB0aGVlLiZyZHF1bzsgSWYgaGUgbWVhbnQ8L3A+XG5cdFx0XHQ8cD5SZXByb29mIEkga25vdyBub3QsIGJ1dCB3aXRoIHNoYW1lIEkgYmVudDwvcD5cblx0XHRcdDxwPk15IGRvd253YXJkIGV5ZXMsIGFuZCBubyBtb3JlIHNwYWtlIHVudGlsPC9wPlxuXHRcdFx0PHA+VGhlIGJhbmsgd2UgcmVhY2hlZCwgYW5kIG9uIHRoZSBzdHJlYW0gYmVoZWxkPC9wPlxuXHRcdFx0PHA+QSBiYXJrIHBseSB0b3dhcmQgdXMuPC9wPlxuXHRcdFx0PHAgY2xhc3M9XCJzbGluZGVudDhlbVwiPk9mIGV4Y2VlZGluZyBlbGQsPC9wPlxuXHRcdFx0PHA+QW5kIGhvYXJ5IHNob3dlZCB0aGUgc3RlZXJzbWFuLCBzY3JlYW1pbmcgc2hyaWxsLDwvcD5cblx0XHRcdDxwPldpdGggaG9ycmlkIGdsZWUgdGhlIHdoaWxlIGhlIG5lYXJlZCB1cywgJmxkcXVvO1dvZTwvcD5cblx0XHRcdDxwPlRvIHllLCBkZXByYXZlZCEmbmJzcDsmbmRhc2g7IElzIGhlcmUgbm8gSGVhdmVuLCBidXQgaWxsPC9wPlxuXHRcdFx0PHA+VGhlIHBsYWNlIHdoZXJlIEkgc2hhbGwgaGVyZCB5ZS4gSWNlIGFuZCBmaXJlPC9wPlxuXHRcdFx0PHA+QW5kIGRhcmtuZXNzIGFyZSB0aGUgd2FnZXMgb2YgdGhlaXIgaGlyZTwvcD5cblx0XHRcdDxwPldobyBzZXJ2ZSB1bmNlYXNpbmcgaGVyZSZuYnNwOyZuZGFzaDsgQnV0IHRob3UgdGhhdCB0aGVyZTwvcD5cblx0XHRcdDxwPkRvc3Qgd2FpdCB0aG91Z2ggbGl2ZSwgZGVwYXJ0IHllLiBZZWEsIGZvcmJlYXIhPC9wPlxuXHRcdFx0PHA+QSBkaWZmZXJlbnQgcGFzc2FnZSBhbmQgYSBsaWdodGVyIGZhcmU8L3A+XG5cdFx0XHQ8cD5JcyBkZXN0aW5lZCB0aGluZS4mcmRxdW87PC9wPlxuXHRcdFx0PHAgY2xhc3M9XCJzbGluZGVudDZlbVwiPkJ1dCBoZXJlIG15IGd1aWRlIHJlcGxpZWQsPC9wPlxuXHRcdFx0PHA+JmxkcXVvO05heSwgQ2hhcm9uLCBjZWFzZTsgb3IgdG8gdGh5IGdyaWVmIHllIGNoaWRlLjwvcD5cblx0XHRcdDxwPkl0IFRoZXJlIGlzIHdpbGxlZCwgd2hlcmUgdGhhdCBpcyB3aWxsZWQgc2hhbGwgYmUsPC9wPlxuXHRcdFx0PHA+VGhhdCB5ZSBzaGFsbCBwYXNzIGhpbSB0byB0aGUgZnVydGhlciBzaWRlLDwvcD5cblx0XHRcdDxwPk5vciBxdWVzdGlvbiBtb3JlLiZyZHF1bzs8L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50NmVtXCI+VGhlIGZsZWVjeSBjaGVla3MgdGhlcmVhdCw8L3A+XG5cdFx0XHQ8cD5CbG93biB3aXRoIGZpZXJjZSBzcGVlY2ggYmVmb3JlLCB3ZXJlIGRyYXduIGFuZCBmbGF0LDwvcD5cblx0XHRcdDxwPkFuZCBoaXMgZmxhbWUtY2lyY2xlZCBleWVzIHN1YmR1ZWQsIHRvIGhlYXI8L3A+XG5cdFx0XHQ8cD5UaGF0IG1hbmRhdGUgZ2l2ZW4uIEJ1dCB0aG9zZSBvZiB3aG9tIGhlIHNwYWtlPC9wPlxuXHRcdFx0PHA+SW4gYml0dGVyIGdsZWUsIHdpdGggbmFrZWQgbGltYnMgYXNoYWtlLDwvcD5cblx0XHRcdDxwPkFuZCBjaGF0dGVyaW5nIHRlZXRoIHJlY2VpdmVkIGl0LiBTZWVtZWQgdGhhdCB0aGVuPC9wPlxuXHRcdFx0PHA+VGhleSBmaXJzdCB3ZXJlIGNvbnNjaW91cyB3aGVyZSB0aGV5IGNhbWUsIGFuZCBmZWFyPC9wPlxuXHRcdFx0PHA+QWJqZWN0IGFuZCBmcmlnaHRmdWwgc2hvb2sgdGhlbTsgY3Vyc2VzIGJ1cnN0PC9wPlxuXHRcdFx0PHA+SW4gY2xhbW9yb3VzIGRpc2NvcmRzIGZvcnRoOyB0aGUgcmFjZSBvZiBtZW4sPC9wPlxuXHRcdFx0PHA+VGhlaXIgcGFyZW50cywgYW5kIHRoZWlyIEdvZCwgdGhlIHBsYWNlLCB0aGUgdGltZSw8L3A+XG5cdFx0XHQ8cD5PZiB0aGVpciBjb25jZXB0aW9ucyBhbmQgdGhlaXIgYmlydGhzLCBhY2N1cnNlZDwvcD5cblx0XHRcdDxwPkFsaWtlIHRoZXkgY2FsbGVkLCBibGFzcGhlbWluZyBIZWF2ZW4uIEJ1dCB5ZXQ8L3A+XG5cdFx0XHQ8cD5TbG93IHN0ZXBzIHRvd2FyZCB0aGUgd2FpdGluZyBiYXJrIHRoZXkgc2V0LDwvcD5cblx0XHRcdDxwPldpdGggdGVycmlibGUgd2FpbGluZyB3aGlsZSB0aGV5IG1vdmVkLiBBbmQgc288L3A+XG5cdFx0XHQ8cD5UaGV5IGNhbWUgcmVsdWN0YW50IHRvIHRoZSBzaG9yZSBvZiB3b2U8L3A+XG5cdFx0XHQ8cD5UaGF0IHdhaXRzIGZvciBhbGwgd2hvIGZlYXIgbm90IEdvZCwgYW5kIG5vdDwvcD5cblx0XHRcdDxwPlRoZW0gb25seS48L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50NGVtXCI+VGhlbiB0aGUgZGVtb24gQ2hhcm9uIHJvc2U8L3A+XG5cdFx0XHQ8cD5UbyBoZXJkIHRoZW0gaW4sIHdpdGggZXllcyB0aGF0IGZ1cm5hY2UtaG90PC9wPlxuXHRcdFx0PHA+R2xvd2VkIGF0IHRoZSB0YXNrLCBhbmQgbGlmdGVkIG9hciB0byBzbWl0ZTwvcD5cblx0XHRcdDxwPldobyBsaW5nZXJlZC48L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50NGVtXCI+QXMgdGhlIGxlYXZlcywgd2hlbiBhdXR1bW4gc2hvd3MsPC9wPlxuXHRcdFx0PHA+T25lIGFmdGVyIG9uZSBkZXNjZW5kaW5nLCBsZWF2ZSB0aGUgYm91Z2gsPC9wPlxuXHRcdFx0PHA+T3IgZG92ZXMgY29tZSBkb3dud2FyZCB0byB0aGUgY2FsbCwgc28gbm93PC9wPlxuXHRcdFx0PHA+VGhlIGV2aWwgc2VlZCBvZiBBZGFtIHRvIGVuZGxlc3MgbmlnaHQsPC9wPlxuXHRcdFx0PHA+QXMgQ2hhcm9uIHNpZ25hbGxlZCwgZnJvbSB0aGUgc2hvcmUmcnNxdW87cyBibGVhayBoZWlnaHQsPC9wPlxuXHRcdFx0PHA+Q2FzdCB0aGVtc2VsdmVzIGRvd253YXJkIHRvIHRoZSBiYXJrLiBUaGUgYnJvd248L3A+XG5cdFx0XHQ8cD5BbmQgYml0dGVyIGZsb29kIHJlY2VpdmVkIHRoZW0sIGFuZCB3aGlsZSB0aGV5IHBhc3NlZDwvcD5cblx0XHRcdDxwPldlcmUgb3RoZXJzIGdhdGhlcmluZywgcGF0aWVudCBhcyB0aGUgbGFzdCw8L3A+XG5cdFx0XHQ8cD5Ob3QgY29uc2Npb3VzIG9mIHRoZWlyIG5lYXJpbmcgZG9vbS48L3A+XG5cdFx0XHQ8cCBjbGFzcz1cInNsaW5kZW50MTRlbVwiPiZsZHF1bztNeSBzb24sJnJkcXVvOzwvcD5cblx0XHRcdDxwPiZuZGFzaDsmbmJzcDtSZXBsaWVkIG15IGd1aWRlIHRoZSB1bnNwb2tlbiB0aG91Z2h0Jm5ic3A7Jm5kYXNoOyAmbGRxdW87aXMgbm9uZTwvcD5cblx0XHRcdDxwPkJlbmVhdGggR29kJnJzcXVvO3Mgd3JhdGggd2hvIGRpZXMgaW4gZmllbGQgb3IgdG93biw8L3A+XG5cdFx0XHQ8cD5PciBlYXJ0aCZyc3F1bztzIHdpZGUgc3BhY2UsIG9yIHdob20gdGhlIHdhdGVycyBkcm93biw8L3A+XG5cdFx0XHQ8cD5CdXQgaGVyZSBoZSBjb21ldGggYXQgbGFzdCwgYW5kIHRoYXQgc28gc3B1cnJlZDwvcD5cblx0XHRcdDxwPkJ5IEp1c3RpY2UsIHRoYXQgaGlzIGZlYXIsIGFzIHRob3NlIHllIGhlYXJkLDwvcD5cblx0XHRcdDxwPkltcGVscyBoaW0gZm9yd2FyZCBsaWtlIGRlc2lyZS4gSXMgbm90PC9wPlxuXHRcdFx0PHA+T25lIHNwaXJpdCBvZiBhbGwgdG8gcmVhY2ggdGhlIGZhdGFsIHNwb3Q8L3A+XG5cdFx0XHQ8cD5UaGF0IEdvZCZyc3F1bztzIGxvdmUgaG9sZGV0aCwgYW5kIGhlbmNlLCBpZiBDaGFyPC9wPlxuXHRcdFx0PHA+Y2hpZGUsPC9wPlxuXHRcdFx0PHA+WWUgd2VsbCBtYXkgdGFrZSBpdC4mbmJzcDsmbmRhc2g7IFJhaXNlIHRoeSBoZWFydCwgZm9yIG5vdyw8L3A+XG5cdFx0XHQ8cD5Db25zdHJhaW5lZCBvZiBIZWF2ZW4sIGhlIG11c3QgdGh5IGNvdXJzZSBhbGxvdy5cIjwvcD5cblx0XHQ8L2Rpdj5cblx0XHQ8ZGl2IGNsYXNzPVwic3RhbnphXCI+XG5cdFx0XHQ8cD5ZZXQgaG93IEkgcGFzc2VkIEkga25vdyBub3QuIEZvciB0aGUgZ3JvdW5kPC9wPlxuXHRcdFx0PHA+VHJlbWJsZWQgdGhhdCBoZWFyZCBoaW0sIGFuZCBhIGZlYXJmdWwgc291bmQ8L3A+XG5cdFx0XHQ8cD5PZiBpc3N1aW5nIHdpbmQgYXJvc2UsIGFuZCBibG9vZC1yZWQgbGlnaHQ8L3A+XG5cdFx0XHQ8cD5Ccm9rZSBmcm9tIGJlbmVhdGggb3VyIGZlZXQsIGFuZCBzZW5zZSBhbmQgc2lnaHQ8L3A+XG5cdFx0XHQ8cD5MZWZ0IG1lLiBUaGUgbWVtb3J5IHdpdGggY29sZCBzd2VhdCBvbmNlIG1vcmU8L3A+XG5cdFx0XHQ8cD5SZW1pbmRzIG1lIG9mIHRoZSBzdWRkZW4tY3JpbXNvbmVkIG5pZ2h0LDwvcD5cblx0XHRcdDxwPkFzIHNhbmsgSSBzZW5zZWxlc3MgYnkgdGhlIGRyZWFkZnVsIHNob3JlLjwvcD5cblx0XHQ8L2Rpdj5gXTtcblxubW9kdWxlLmV4cG9ydHMgPSB3cmlnaHQ7XG4iLCI7KGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBAcHJlc2VydmUgRmFzdENsaWNrOiBwb2x5ZmlsbCB0byByZW1vdmUgY2xpY2sgZGVsYXlzIG9uIGJyb3dzZXJzIHdpdGggdG91Y2ggVUlzLlxuXHQgKlxuXHQgKiBAY29kaW5nc3RhbmRhcmQgZnRsYWJzLWpzdjJcblx0ICogQGNvcHlyaWdodCBUaGUgRmluYW5jaWFsIFRpbWVzIExpbWl0ZWQgW0FsbCBSaWdodHMgUmVzZXJ2ZWRdXG5cdCAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChzZWUgTElDRU5TRS50eHQpXG5cdCAqL1xuXG5cdC8qanNsaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblx0LypnbG9iYWwgZGVmaW5lLCBFdmVudCwgTm9kZSovXG5cblxuXHQvKipcblx0ICogSW5zdGFudGlhdGUgZmFzdC1jbGlja2luZyBsaXN0ZW5lcnMgb24gdGhlIHNwZWNpZmllZCBsYXllci5cblx0ICpcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuXHQgKi9cblx0ZnVuY3Rpb24gRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKSB7XG5cdFx0dmFyIG9sZE9uQ2xpY2s7XG5cblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdC8qKlxuXHRcdCAqIFdoZXRoZXIgYSBjbGljayBpcyBjdXJyZW50bHkgYmVpbmcgdHJhY2tlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIGJvb2xlYW5cblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGltZXN0YW1wIGZvciB3aGVuIGNsaWNrIHRyYWNraW5nIHN0YXJ0ZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBlbGVtZW50IGJlaW5nIHRyYWNrZWQgZm9yIGEgY2xpY2suXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBFdmVudFRhcmdldFxuXHRcdCAqL1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFgtY29vcmRpbmF0ZSBvZiB0b3VjaCBzdGFydCBldmVudC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hTdGFydFggPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBZLWNvb3JkaW5hdGUgb2YgdG91Y2ggc3RhcnQgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoU3RhcnRZID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogSUQgb2YgdGhlIGxhc3QgdG91Y2gsIHJldHJpZXZlZCBmcm9tIFRvdWNoLmlkZW50aWZpZXIuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUb3VjaG1vdmUgYm91bmRhcnksIGJleW9uZCB3aGljaCBhIGNsaWNrIHdpbGwgYmUgY2FuY2VsbGVkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaEJvdW5kYXJ5ID0gb3B0aW9ucy50b3VjaEJvdW5kYXJ5IHx8IDEwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaGUgRmFzdENsaWNrIGxheWVyLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgRWxlbWVudFxuXHRcdCAqL1xuXHRcdHRoaXMubGF5ZXIgPSBsYXllcjtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtaW5pbXVtIHRpbWUgYmV0d2VlbiB0YXAodG91Y2hzdGFydCBhbmQgdG91Y2hlbmQpIGV2ZW50c1xuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50YXBEZWxheSA9IG9wdGlvbnMudGFwRGVsYXkgfHwgMjAwO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIG1heGltdW0gdGltZSBmb3IgYSB0YXBcblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudGFwVGltZW91dCA9IG9wdGlvbnMudGFwVGltZW91dCB8fCA3MDA7XG5cblx0XHRpZiAoRmFzdENsaWNrLm5vdE5lZWRlZChsYXllcikpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBTb21lIG9sZCB2ZXJzaW9ucyBvZiBBbmRyb2lkIGRvbid0IGhhdmUgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmRcblx0XHRmdW5jdGlvbiBiaW5kKG1ldGhvZCwgY29udGV4dCkge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gbWV0aG9kLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7IH07XG5cdFx0fVxuXG5cblx0XHR2YXIgbWV0aG9kcyA9IFsnb25Nb3VzZScsICdvbkNsaWNrJywgJ29uVG91Y2hTdGFydCcsICdvblRvdWNoTW92ZScsICdvblRvdWNoRW5kJywgJ29uVG91Y2hDYW5jZWwnXTtcblx0XHR2YXIgY29udGV4dCA9IHRoaXM7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtZXRob2RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0Y29udGV4dFttZXRob2RzW2ldXSA9IGJpbmQoY29udGV4dFttZXRob2RzW2ldXSwgY29udGV4dCk7XG5cdFx0fVxuXG5cdFx0Ly8gU2V0IHVwIGV2ZW50IGhhbmRsZXJzIGFzIHJlcXVpcmVkXG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHR9XG5cblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljaywgdHJ1ZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZSwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kLCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLm9uVG91Y2hDYW5jZWwsIGZhbHNlKTtcblxuXHRcdC8vIEhhY2sgaXMgcmVxdWlyZWQgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBFdmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKGUuZy4gQW5kcm9pZCAyKVxuXHRcdC8vIHdoaWNoIGlzIGhvdyBGYXN0Q2xpY2sgbm9ybWFsbHkgc3RvcHMgY2xpY2sgZXZlbnRzIGJ1YmJsaW5nIHRvIGNhbGxiYWNrcyByZWdpc3RlcmVkIG9uIHRoZSBGYXN0Q2xpY2tcblx0XHQvLyBsYXllciB3aGVuIHRoZXkgYXJlIGNhbmNlbGxlZC5cblx0XHRpZiAoIUV2ZW50LnByb3RvdHlwZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgcm12ID0gTm9kZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRybXYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJtdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgYWR2ID0gTm9kZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRhZHYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgKGNhbGxiYWNrLmhpamFja2VkID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdGlmICghZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkKSB7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKGV2ZW50KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSwgY2FwdHVyZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YWR2LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyBJZiBhIGhhbmRsZXIgaXMgYWxyZWFkeSBkZWNsYXJlZCBpbiB0aGUgZWxlbWVudCdzIG9uY2xpY2sgYXR0cmlidXRlLCBpdCB3aWxsIGJlIGZpcmVkIGJlZm9yZVxuXHRcdC8vIEZhc3RDbGljaydzIG9uQ2xpY2sgaGFuZGxlci4gRml4IHRoaXMgYnkgcHVsbGluZyBvdXQgdGhlIHVzZXItZGVmaW5lZCBoYW5kbGVyIGZ1bmN0aW9uIGFuZFxuXHRcdC8vIGFkZGluZyBpdCBhcyBsaXN0ZW5lci5cblx0XHRpZiAodHlwZW9mIGxheWVyLm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcblxuXHRcdFx0Ly8gQW5kcm9pZCBicm93c2VyIG9uIGF0IGxlYXN0IDMuMiByZXF1aXJlcyBhIG5ldyByZWZlcmVuY2UgdG8gdGhlIGZ1bmN0aW9uIGluIGxheWVyLm9uY2xpY2tcblx0XHRcdC8vIC0gdGhlIG9sZCBvbmUgd29uJ3Qgd29yayBpZiBwYXNzZWQgdG8gYWRkRXZlbnRMaXN0ZW5lciBkaXJlY3RseS5cblx0XHRcdG9sZE9uQ2xpY2sgPSBsYXllci5vbmNsaWNrO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRvbGRPbkNsaWNrKGV2ZW50KTtcblx0XHRcdH0sIGZhbHNlKTtcblx0XHRcdGxheWVyLm9uY2xpY2sgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQqIFdpbmRvd3MgUGhvbmUgOC4xIGZha2VzIHVzZXIgYWdlbnQgc3RyaW5nIHRvIGxvb2sgbGlrZSBBbmRyb2lkIGFuZCBpUGhvbmUuXG5cdCpcblx0KiBAdHlwZSBib29sZWFuXG5cdCovXG5cdHZhciBkZXZpY2VJc1dpbmRvd3NQaG9uZSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIldpbmRvd3MgUGhvbmVcIikgPj0gMDtcblxuXHQvKipcblx0ICogQW5kcm9pZCByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgPiAwICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TID0gL2lQKGFkfGhvbmV8b2QpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNCByZXF1aXJlcyBhbiBleGNlcHRpb24gZm9yIHNlbGVjdCBlbGVtZW50cy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TNCA9IGRldmljZUlzSU9TICYmICgvT1MgNF9cXGQoX1xcZCk/LykudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNi4wLTcuKiByZXF1aXJlcyB0aGUgdGFyZ2V0IGVsZW1lbnQgdG8gYmUgbWFudWFsbHkgZGVyaXZlZFxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1NXaXRoQmFkVGFyZ2V0ID0gZGV2aWNlSXNJT1MgJiYgKC9PUyBbNi03XV9cXGQvKS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cdC8qKlxuXHQgKiBCbGFja0JlcnJ5IHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0JsYWNrQmVycnkxMCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQkIxMCcpID4gMDtcblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBlbGVtZW50IHJlcXVpcmVzIGEgbmF0aXZlIGNsaWNrLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBuZWVkcyBhIG5hdGl2ZSBjbGlja1xuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0NsaWNrID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXG5cdFx0Ly8gRG9uJ3Qgc2VuZCBhIHN5bnRoZXRpYyBjbGljayB0byBkaXNhYmxlZCBpbnB1dHMgKGlzc3VlICM2Milcblx0XHRjYXNlICdidXR0b24nOlxuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0Y2FzZSAndGV4dGFyZWEnOlxuXHRcdFx0aWYgKHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnaW5wdXQnOlxuXG5cdFx0XHQvLyBGaWxlIGlucHV0cyBuZWVkIHJlYWwgY2xpY2tzIG9uIGlPUyA2IGR1ZSB0byBhIGJyb3dzZXIgYnVnIChpc3N1ZSAjNjgpXG5cdFx0XHRpZiAoKGRldmljZUlzSU9TICYmIHRhcmdldC50eXBlID09PSAnZmlsZScpIHx8IHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnbGFiZWwnOlxuXHRcdGNhc2UgJ2lmcmFtZSc6IC8vIGlPUzggaG9tZXNjcmVlbiBhcHBzIGNhbiBwcmV2ZW50IGV2ZW50cyBidWJibGluZyBpbnRvIGZyYW1lc1xuXHRcdGNhc2UgJ3ZpZGVvJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiAoL1xcYm5lZWRzY2xpY2tcXGIvKS50ZXN0KHRhcmdldC5jbGFzc05hbWUpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGV0aGVyIGEgZ2l2ZW4gZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgY2xpY2sgaW50byBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgbmF0aXZlIGNsaWNrLlxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0ZvY3VzID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXHRcdGNhc2UgJ3RleHRhcmVhJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0XHRyZXR1cm4gIWRldmljZUlzQW5kcm9pZDtcblx0XHRjYXNlICdpbnB1dCc6XG5cdFx0XHRzd2l0Y2ggKHRhcmdldC50eXBlKSB7XG5cdFx0XHRjYXNlICdidXR0b24nOlxuXHRcdFx0Y2FzZSAnY2hlY2tib3gnOlxuXHRcdFx0Y2FzZSAnZmlsZSc6XG5cdFx0XHRjYXNlICdpbWFnZSc6XG5cdFx0XHRjYXNlICdyYWRpbyc6XG5cdFx0XHRjYXNlICdzdWJtaXQnOlxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE5vIHBvaW50IGluIGF0dGVtcHRpbmcgdG8gZm9jdXMgZGlzYWJsZWQgaW5wdXRzXG5cdFx0XHRyZXR1cm4gIXRhcmdldC5kaXNhYmxlZCAmJiAhdGFyZ2V0LnJlYWRPbmx5O1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gKC9cXGJuZWVkc2ZvY3VzXFxiLykudGVzdCh0YXJnZXQuY2xhc3NOYW1lKTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogU2VuZCBhIGNsaWNrIGV2ZW50IHRvIHRoZSBzcGVjaWZpZWQgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnNlbmRDbGljayA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQsIGV2ZW50KSB7XG5cdFx0dmFyIGNsaWNrRXZlbnQsIHRvdWNoO1xuXG5cdFx0Ly8gT24gc29tZSBBbmRyb2lkIGRldmljZXMgYWN0aXZlRWxlbWVudCBuZWVkcyB0byBiZSBibHVycmVkIG90aGVyd2lzZSB0aGUgc3ludGhldGljIGNsaWNrIHdpbGwgaGF2ZSBubyBlZmZlY3QgKCMyNClcblx0XHRpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblx0XHR9XG5cblx0XHR0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0Ly8gU3ludGhlc2lzZSBhIGNsaWNrIGV2ZW50LCB3aXRoIGFuIGV4dHJhIGF0dHJpYnV0ZSBzbyBpdCBjYW4gYmUgdHJhY2tlZFxuXHRcdGNsaWNrRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudHMnKTtcblx0XHRjbGlja0V2ZW50LmluaXRNb3VzZUV2ZW50KHRoaXMuZGV0ZXJtaW5lRXZlbnRUeXBlKHRhcmdldEVsZW1lbnQpLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIHRvdWNoLnNjcmVlblgsIHRvdWNoLnNjcmVlblksIHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLCBudWxsKTtcblx0XHRjbGlja0V2ZW50LmZvcndhcmRlZFRvdWNoRXZlbnQgPSB0cnVlO1xuXHRcdHRhcmdldEVsZW1lbnQuZGlzcGF0Y2hFdmVudChjbGlja0V2ZW50KTtcblx0fTtcblxuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmRldGVybWluZUV2ZW50VHlwZSA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblxuXHRcdC8vSXNzdWUgIzE1OTogQW5kcm9pZCBDaHJvbWUgU2VsZWN0IEJveCBkb2VzIG5vdCBvcGVuIHdpdGggYSBzeW50aGV0aWMgY2xpY2sgZXZlbnRcblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkICYmIHRhcmdldEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc2VsZWN0Jykge1xuXHRcdFx0cmV0dXJuICdtb3VzZWRvd24nO1xuXHRcdH1cblxuXHRcdHJldHVybiAnY2xpY2snO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5mb2N1cyA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblx0XHR2YXIgbGVuZ3RoO1xuXG5cdFx0Ly8gSXNzdWUgIzE2MDogb24gaU9TIDcsIHNvbWUgaW5wdXQgZWxlbWVudHMgKGUuZy4gZGF0ZSBkYXRldGltZSBtb250aCkgdGhyb3cgYSB2YWd1ZSBUeXBlRXJyb3Igb24gc2V0U2VsZWN0aW9uUmFuZ2UuIFRoZXNlIGVsZW1lbnRzIGRvbid0IGhhdmUgYW4gaW50ZWdlciB2YWx1ZSBmb3IgdGhlIHNlbGVjdGlvblN0YXJ0IGFuZCBzZWxlY3Rpb25FbmQgcHJvcGVydGllcywgYnV0IHVuZm9ydHVuYXRlbHkgdGhhdCBjYW4ndCBiZSB1c2VkIGZvciBkZXRlY3Rpb24gYmVjYXVzZSBhY2Nlc3NpbmcgdGhlIHByb3BlcnRpZXMgYWxzbyB0aHJvd3MgYSBUeXBlRXJyb3IuIEp1c3QgY2hlY2sgdGhlIHR5cGUgaW5zdGVhZC4gRmlsZWQgYXMgQXBwbGUgYnVnICMxNTEyMjcyNC5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgdGFyZ2V0RWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZSAmJiB0YXJnZXRFbGVtZW50LnR5cGUuaW5kZXhPZignZGF0ZScpICE9PSAwICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ3RpbWUnICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ21vbnRoJykge1xuXHRcdFx0bGVuZ3RoID0gdGFyZ2V0RWxlbWVudC52YWx1ZS5sZW5ndGg7XG5cdFx0XHR0YXJnZXRFbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKGxlbmd0aCwgbGVuZ3RoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5mb2N1cygpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIGEgc2Nyb2xsYWJsZSBsYXllciBhbmQgaWYgc28sIHNldCBhIGZsYWcgb24gaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS51cGRhdGVTY3JvbGxQYXJlbnQgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cdFx0dmFyIHNjcm9sbFBhcmVudCwgcGFyZW50RWxlbWVudDtcblxuXHRcdHNjcm9sbFBhcmVudCA9IHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXG5cdFx0Ly8gQXR0ZW1wdCB0byBkaXNjb3ZlciB3aGV0aGVyIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgc2Nyb2xsYWJsZSBsYXllci4gUmUtY2hlY2sgaWYgdGhlXG5cdFx0Ly8gdGFyZ2V0IGVsZW1lbnQgd2FzIG1vdmVkIHRvIGFub3RoZXIgcGFyZW50LlxuXHRcdGlmICghc2Nyb2xsUGFyZW50IHx8ICFzY3JvbGxQYXJlbnQuY29udGFpbnModGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdHBhcmVudEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAocGFyZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgPiBwYXJlbnRFbGVtZW50Lm9mZnNldEhlaWdodCkge1xuXHRcdFx0XHRcdHNjcm9sbFBhcmVudCA9IHBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0dGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQgPSBwYXJlbnRFbGVtZW50O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcblx0XHRcdH0gd2hpbGUgKHBhcmVudEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdC8vIEFsd2F5cyB1cGRhdGUgdGhlIHNjcm9sbCB0b3AgdHJhY2tlciBpZiBwb3NzaWJsZS5cblx0XHRpZiAoc2Nyb2xsUGFyZW50KSB7XG5cdFx0XHRzY3JvbGxQYXJlbnQuZmFzdENsaWNrTGFzdFNjcm9sbFRvcCA9IHNjcm9sbFBhcmVudC5zY3JvbGxUb3A7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8RXZlbnRUYXJnZXR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQgPSBmdW5jdGlvbihldmVudFRhcmdldCkge1xuXG5cdFx0Ly8gT24gc29tZSBvbGRlciBicm93c2VycyAobm90YWJseSBTYWZhcmkgb24gaU9TIDQuMSAtIHNlZSBpc3N1ZSAjNTYpIHRoZSBldmVudCB0YXJnZXQgbWF5IGJlIGEgdGV4dCBub2RlLlxuXHRcdGlmIChldmVudFRhcmdldC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdHJldHVybiBldmVudFRhcmdldC5wYXJlbnROb2RlO1xuXHRcdH1cblxuXHRcdHJldHVybiBldmVudFRhcmdldDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBzdGFydCwgcmVjb3JkIHRoZSBwb3NpdGlvbiBhbmQgc2Nyb2xsIG9mZnNldC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRhcmdldEVsZW1lbnQsIHRvdWNoLCBzZWxlY3Rpb247XG5cblx0XHQvLyBJZ25vcmUgbXVsdGlwbGUgdG91Y2hlcywgb3RoZXJ3aXNlIHBpbmNoLXRvLXpvb20gaXMgcHJldmVudGVkIGlmIGJvdGggZmluZ2VycyBhcmUgb24gdGhlIEZhc3RDbGljayBlbGVtZW50IChpc3N1ZSAjMTExKS5cblx0XHRpZiAoZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHR0YXJnZXRFbGVtZW50ID0gdGhpcy5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0KGV2ZW50LnRhcmdldCk7XG5cdFx0dG91Y2ggPSBldmVudC50YXJnZXRUb3VjaGVzWzBdO1xuXG5cdFx0aWYgKGRldmljZUlzSU9TKSB7XG5cblx0XHRcdC8vIE9ubHkgdHJ1c3RlZCBldmVudHMgd2lsbCBkZXNlbGVjdCB0ZXh0IG9uIGlPUyAoaXNzdWUgIzQ5KVxuXHRcdFx0c2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuXHRcdFx0aWYgKHNlbGVjdGlvbi5yYW5nZUNvdW50ICYmICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghZGV2aWNlSXNJT1M0KSB7XG5cblx0XHRcdFx0Ly8gV2VpcmQgdGhpbmdzIGhhcHBlbiBvbiBpT1Mgd2hlbiBhbiBhbGVydCBvciBjb25maXJtIGRpYWxvZyBpcyBvcGVuZWQgZnJvbSBhIGNsaWNrIGV2ZW50IGNhbGxiYWNrIChpc3N1ZSAjMjMpOlxuXHRcdFx0XHQvLyB3aGVuIHRoZSB1c2VyIG5leHQgdGFwcyBhbnl3aGVyZSBlbHNlIG9uIHRoZSBwYWdlLCBuZXcgdG91Y2hzdGFydCBhbmQgdG91Y2hlbmQgZXZlbnRzIGFyZSBkaXNwYXRjaGVkXG5cdFx0XHRcdC8vIHdpdGggdGhlIHNhbWUgaWRlbnRpZmllciBhcyB0aGUgdG91Y2ggZXZlbnQgdGhhdCBwcmV2aW91c2x5IHRyaWdnZXJlZCB0aGUgY2xpY2sgdGhhdCB0cmlnZ2VyZWQgdGhlIGFsZXJ0LlxuXHRcdFx0XHQvLyBTYWRseSwgdGhlcmUgaXMgYW4gaXNzdWUgb24gaU9TIDQgdGhhdCBjYXVzZXMgc29tZSBub3JtYWwgdG91Y2ggZXZlbnRzIHRvIGhhdmUgdGhlIHNhbWUgaWRlbnRpZmllciBhcyBhblxuXHRcdFx0XHQvLyBpbW1lZGlhdGVseSBwcmVjZWVkaW5nIHRvdWNoIGV2ZW50IChpc3N1ZSAjNTIpLCBzbyB0aGlzIGZpeCBpcyB1bmF2YWlsYWJsZSBvbiB0aGF0IHBsYXRmb3JtLlxuXHRcdFx0XHQvLyBJc3N1ZSAxMjA6IHRvdWNoLmlkZW50aWZpZXIgaXMgMCB3aGVuIENocm9tZSBkZXYgdG9vbHMgJ0VtdWxhdGUgdG91Y2ggZXZlbnRzJyBpcyBzZXQgd2l0aCBhbiBpT1MgZGV2aWNlIFVBIHN0cmluZyxcblx0XHRcdFx0Ly8gd2hpY2ggY2F1c2VzIGFsbCB0b3VjaCBldmVudHMgdG8gYmUgaWdub3JlZC4gQXMgdGhpcyBibG9jayBvbmx5IGFwcGxpZXMgdG8gaU9TLCBhbmQgaU9TIGlkZW50aWZpZXJzIGFyZSBhbHdheXMgbG9uZyxcblx0XHRcdFx0Ly8gcmFuZG9tIGludGVnZXJzLCBpdCdzIHNhZmUgdG8gdG8gY29udGludWUgaWYgdGhlIGlkZW50aWZpZXIgaXMgMCBoZXJlLlxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAmJiB0b3VjaC5pZGVudGlmaWVyID09PSB0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIpIHtcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMubGFzdFRvdWNoSWRlbnRpZmllciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgYSBzY3JvbGxhYmxlIGxheWVyICh1c2luZyAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2gpIGFuZDpcblx0XHRcdFx0Ly8gMSkgdGhlIHVzZXIgZG9lcyBhIGZsaW5nIHNjcm9sbCBvbiB0aGUgc2Nyb2xsYWJsZSBsYXllclxuXHRcdFx0XHQvLyAyKSB0aGUgdXNlciBzdG9wcyB0aGUgZmxpbmcgc2Nyb2xsIHdpdGggYW5vdGhlciB0YXBcblx0XHRcdFx0Ly8gdGhlbiB0aGUgZXZlbnQudGFyZ2V0IG9mIHRoZSBsYXN0ICd0b3VjaGVuZCcgZXZlbnQgd2lsbCBiZSB0aGUgZWxlbWVudCB0aGF0IHdhcyB1bmRlciB0aGUgdXNlcidzIGZpbmdlclxuXHRcdFx0XHQvLyB3aGVuIHRoZSBmbGluZyBzY3JvbGwgd2FzIHN0YXJ0ZWQsIGNhdXNpbmcgRmFzdENsaWNrIHRvIHNlbmQgYSBjbGljayBldmVudCB0byB0aGF0IGxheWVyIC0gdW5sZXNzIGEgY2hlY2tcblx0XHRcdFx0Ly8gaXMgbWFkZSB0byBlbnN1cmUgdGhhdCBhIHBhcmVudCBsYXllciB3YXMgbm90IHNjcm9sbGVkIGJlZm9yZSBzZW5kaW5nIGEgc3ludGhldGljIGNsaWNrIChpc3N1ZSAjNDIpLlxuXHRcdFx0XHR0aGlzLnVwZGF0ZVNjcm9sbFBhcmVudCh0YXJnZXRFbGVtZW50KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSB0cnVlO1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gZXZlbnQudGltZVN0YW1wO1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cblx0XHR0aGlzLnRvdWNoU3RhcnRYID0gdG91Y2gucGFnZVg7XG5cdFx0dGhpcy50b3VjaFN0YXJ0WSA9IHRvdWNoLnBhZ2VZO1xuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEJhc2VkIG9uIGEgdG91Y2htb3ZlIGV2ZW50IG9iamVjdCwgY2hlY2sgd2hldGhlciB0aGUgdG91Y2ggaGFzIG1vdmVkIHBhc3QgYSBib3VuZGFyeSBzaW5jZSBpdCBzdGFydGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUudG91Y2hIYXNNb3ZlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0sIGJvdW5kYXJ5ID0gdGhpcy50b3VjaEJvdW5kYXJ5O1xuXG5cdFx0aWYgKE1hdGguYWJzKHRvdWNoLnBhZ2VYIC0gdGhpcy50b3VjaFN0YXJ0WCkgPiBib3VuZGFyeSB8fCBNYXRoLmFicyh0b3VjaC5wYWdlWSAtIHRoaXMudG91Y2hTdGFydFkpID4gYm91bmRhcnkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGxhc3QgcG9zaXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoTW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKCF0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSB0b3VjaCBoYXMgbW92ZWQsIGNhbmNlbCB0aGUgY2xpY2sgdHJhY2tpbmdcblx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50ICE9PSB0aGlzLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQoZXZlbnQudGFyZ2V0KSB8fCB0aGlzLnRvdWNoSGFzTW92ZWQoZXZlbnQpKSB7XG5cdFx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogQXR0ZW1wdCB0byBmaW5kIHRoZSBsYWJlbGxlZCBjb250cm9sIGZvciB0aGUgZ2l2ZW4gbGFiZWwgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxIVE1MTGFiZWxFbGVtZW50fSBsYWJlbEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8bnVsbH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZmluZENvbnRyb2wgPSBmdW5jdGlvbihsYWJlbEVsZW1lbnQpIHtcblxuXHRcdC8vIEZhc3QgcGF0aCBmb3IgbmV3ZXIgYnJvd3NlcnMgc3VwcG9ydGluZyB0aGUgSFRNTDUgY29udHJvbCBhdHRyaWJ1dGVcblx0XHRpZiAobGFiZWxFbGVtZW50LmNvbnRyb2wgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIGxhYmVsRWxlbWVudC5jb250cm9sO1xuXHRcdH1cblxuXHRcdC8vIEFsbCBicm93c2VycyB1bmRlciB0ZXN0IHRoYXQgc3VwcG9ydCB0b3VjaCBldmVudHMgYWxzbyBzdXBwb3J0IHRoZSBIVE1MNSBodG1sRm9yIGF0dHJpYnV0ZVxuXHRcdGlmIChsYWJlbEVsZW1lbnQuaHRtbEZvcikge1xuXHRcdFx0cmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGxhYmVsRWxlbWVudC5odG1sRm9yKTtcblx0XHR9XG5cblx0XHQvLyBJZiBubyBmb3IgYXR0cmlidXRlIGV4aXN0cywgYXR0ZW1wdCB0byByZXRyaWV2ZSB0aGUgZmlyc3QgbGFiZWxsYWJsZSBkZXNjZW5kYW50IGVsZW1lbnRcblx0XHQvLyB0aGUgbGlzdCBvZiB3aGljaCBpcyBkZWZpbmVkIGhlcmU6IGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjY2F0ZWdvcnktbGFiZWxcblx0XHRyZXR1cm4gbGFiZWxFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbiwgaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pLCBrZXlnZW4sIG1ldGVyLCBvdXRwdXQsIHByb2dyZXNzLCBzZWxlY3QsIHRleHRhcmVhJyk7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggZW5kLCBkZXRlcm1pbmUgd2hldGhlciB0byBzZW5kIGEgY2xpY2sgZXZlbnQgYXQgb25jZS5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hFbmQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBmb3JFbGVtZW50LCB0cmFja2luZ0NsaWNrU3RhcnQsIHRhcmdldFRhZ05hbWUsIHNjcm9sbFBhcmVudCwgdG91Y2gsIHRhcmdldEVsZW1lbnQgPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cblx0XHRpZiAoIXRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHR0aGlzLmNhbmNlbE5leHRDbGljayA9IHRydWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0KSA+IHRoaXMudGFwVGltZW91dCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUmVzZXQgdG8gcHJldmVudCB3cm9uZyBjbGljayBjYW5jZWwgb24gaW5wdXQgKGlzc3VlICMxNTYpLlxuXHRcdHRoaXMuY2FuY2VsTmV4dENsaWNrID0gZmFsc2U7XG5cblx0XHR0aGlzLmxhc3RDbGlja1RpbWUgPSBldmVudC50aW1lU3RhbXA7XG5cblx0XHR0cmFja2luZ0NsaWNrU3RhcnQgPSB0aGlzLnRyYWNraW5nQ2xpY2tTdGFydDtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblx0XHQvLyBPbiBzb21lIGlPUyBkZXZpY2VzLCB0aGUgdGFyZ2V0RWxlbWVudCBzdXBwbGllZCB3aXRoIHRoZSBldmVudCBpcyBpbnZhbGlkIGlmIHRoZSBsYXllclxuXHRcdC8vIGlzIHBlcmZvcm1pbmcgYSB0cmFuc2l0aW9uIG9yIHNjcm9sbCwgYW5kIGhhcyB0byBiZSByZS1kZXRlY3RlZCBtYW51YWxseS4gTm90ZSB0aGF0XG5cdFx0Ly8gZm9yIHRoaXMgdG8gZnVuY3Rpb24gY29ycmVjdGx5LCBpdCBtdXN0IGJlIGNhbGxlZCAqYWZ0ZXIqIHRoZSBldmVudCB0YXJnZXQgaXMgY2hlY2tlZCFcblx0XHQvLyBTZWUgaXNzdWUgIzU3OyBhbHNvIGZpbGVkIGFzIHJkYXI6Ly8xMzA0ODU4OSAuXG5cdFx0aWYgKGRldmljZUlzSU9TV2l0aEJhZFRhcmdldCkge1xuXHRcdFx0dG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0Ly8gSW4gY2VydGFpbiBjYXNlcyBhcmd1bWVudHMgb2YgZWxlbWVudEZyb21Qb2ludCBjYW4gYmUgbmVnYXRpdmUsIHNvIHByZXZlbnQgc2V0dGluZyB0YXJnZXRFbGVtZW50IHRvIG51bGxcblx0XHRcdHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLnBhZ2VYIC0gd2luZG93LnBhZ2VYT2Zmc2V0LCB0b3VjaC5wYWdlWSAtIHdpbmRvdy5wYWdlWU9mZnNldCkgfHwgdGFyZ2V0RWxlbWVudDtcblx0XHRcdHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50ID0gdGhpcy50YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblx0XHR9XG5cblx0XHR0YXJnZXRUYWdOYW1lID0gdGFyZ2V0RWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHRhcmdldFRhZ05hbWUgPT09ICdsYWJlbCcpIHtcblx0XHRcdGZvckVsZW1lbnQgPSB0aGlzLmZpbmRDb250cm9sKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0aWYgKGZvckVsZW1lbnQpIHtcblx0XHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRhcmdldEVsZW1lbnQgPSBmb3JFbGVtZW50O1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGhpcy5uZWVkc0ZvY3VzKHRhcmdldEVsZW1lbnQpKSB7XG5cblx0XHRcdC8vIENhc2UgMTogSWYgdGhlIHRvdWNoIHN0YXJ0ZWQgYSB3aGlsZSBhZ28gKGJlc3QgZ3Vlc3MgaXMgMTAwbXMgYmFzZWQgb24gdGVzdHMgZm9yIGlzc3VlICMzNikgdGhlbiBmb2N1cyB3aWxsIGJlIHRyaWdnZXJlZCBhbnl3YXkuIFJldHVybiBlYXJseSBhbmQgdW5zZXQgdGhlIHRhcmdldCBlbGVtZW50IHJlZmVyZW5jZSBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IGNsaWNrIHdpbGwgYmUgYWxsb3dlZCB0aHJvdWdoLlxuXHRcdFx0Ly8gQ2FzZSAyOiBXaXRob3V0IHRoaXMgZXhjZXB0aW9uIGZvciBpbnB1dCBlbGVtZW50cyB0YXBwZWQgd2hlbiB0aGUgZG9jdW1lbnQgaXMgY29udGFpbmVkIGluIGFuIGlmcmFtZSwgdGhlbiBhbnkgaW5wdXR0ZWQgdGV4dCB3b24ndCBiZSB2aXNpYmxlIGV2ZW4gdGhvdWdoIHRoZSB2YWx1ZSBhdHRyaWJ1dGUgaXMgdXBkYXRlZCBhcyB0aGUgdXNlciB0eXBlcyAoaXNzdWUgIzM3KS5cblx0XHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdHJhY2tpbmdDbGlja1N0YXJ0KSA+IDEwMCB8fCAoZGV2aWNlSXNJT1MgJiYgd2luZG93LnRvcCAhPT0gd2luZG93ICYmIHRhcmdldFRhZ05hbWUgPT09ICdpbnB1dCcpKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdHRoaXMuc2VuZENsaWNrKHRhcmdldEVsZW1lbnQsIGV2ZW50KTtcblxuXHRcdFx0Ly8gU2VsZWN0IGVsZW1lbnRzIG5lZWQgdGhlIGV2ZW50IHRvIGdvIHRocm91Z2ggb24gaU9TIDQsIG90aGVyd2lzZSB0aGUgc2VsZWN0b3IgbWVudSB3b24ndCBvcGVuLlxuXHRcdFx0Ly8gQWxzbyB0aGlzIGJyZWFrcyBvcGVuaW5nIHNlbGVjdHMgd2hlbiBWb2ljZU92ZXIgaXMgYWN0aXZlIG9uIGlPUzYsIGlPUzcgKGFuZCBwb3NzaWJseSBvdGhlcnMpXG5cdFx0XHRpZiAoIWRldmljZUlzSU9TIHx8IHRhcmdldFRhZ05hbWUgIT09ICdzZWxlY3QnKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgIWRldmljZUlzSU9TNCkge1xuXG5cdFx0XHQvLyBEb24ndCBzZW5kIGEgc3ludGhldGljIGNsaWNrIGV2ZW50IGlmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgcGFyZW50IGxheWVyIHRoYXQgd2FzIHNjcm9sbGVkXG5cdFx0XHQvLyBhbmQgdGhpcyB0YXAgaXMgYmVpbmcgdXNlZCB0byBzdG9wIHRoZSBzY3JvbGxpbmcgKHVzdWFsbHkgaW5pdGlhdGVkIGJ5IGEgZmxpbmcgLSBpc3N1ZSAjNDIpLlxuXHRcdFx0c2Nyb2xsUGFyZW50ID0gdGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cdFx0XHRpZiAoc2Nyb2xsUGFyZW50ICYmIHNjcm9sbFBhcmVudC5mYXN0Q2xpY2tMYXN0U2Nyb2xsVG9wICE9PSBzY3JvbGxQYXJlbnQuc2Nyb2xsVG9wKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFByZXZlbnQgdGhlIGFjdHVhbCBjbGljayBmcm9tIGdvaW5nIHRob3VnaCAtIHVubGVzcyB0aGUgdGFyZ2V0IG5vZGUgaXMgbWFya2VkIGFzIHJlcXVpcmluZ1xuXHRcdC8vIHJlYWwgY2xpY2tzIG9yIGlmIGl0IGlzIGluIHRoZSB3aGl0ZWxpc3QgaW4gd2hpY2ggY2FzZSBvbmx5IG5vbi1wcm9ncmFtbWF0aWMgY2xpY2tzIGFyZSBwZXJtaXR0ZWQuXG5cdFx0aWYgKCF0aGlzLm5lZWRzQ2xpY2sodGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNlbmRDbGljayh0YXJnZXRFbGVtZW50LCBldmVudCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIGNhbmNlbCwgc3RvcCB0cmFja2luZyB0aGUgY2xpY2suXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoQ2FuY2VsID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgbW91c2UgZXZlbnRzIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbk1vdXNlID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuXHRcdC8vIElmIGEgdGFyZ2V0IGVsZW1lbnQgd2FzIG5ldmVyIHNldCAoYmVjYXVzZSBhIHRvdWNoIGV2ZW50IHdhcyBuZXZlciBmaXJlZCkgYWxsb3cgdGhlIGV2ZW50XG5cdFx0aWYgKCF0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChldmVudC5mb3J3YXJkZWRUb3VjaEV2ZW50KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBQcm9ncmFtbWF0aWNhbGx5IGdlbmVyYXRlZCBldmVudHMgdGFyZ2V0aW5nIGEgc3BlY2lmaWMgZWxlbWVudCBzaG91bGQgYmUgcGVybWl0dGVkXG5cdFx0aWYgKCFldmVudC5jYW5jZWxhYmxlKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBEZXJpdmUgYW5kIGNoZWNrIHRoZSB0YXJnZXQgZWxlbWVudCB0byBzZWUgd2hldGhlciB0aGUgbW91c2UgZXZlbnQgbmVlZHMgdG8gYmUgcGVybWl0dGVkO1xuXHRcdC8vIHVubGVzcyBleHBsaWNpdGx5IGVuYWJsZWQsIHByZXZlbnQgbm9uLXRvdWNoIGNsaWNrIGV2ZW50cyBmcm9tIHRyaWdnZXJpbmcgYWN0aW9ucyxcblx0XHQvLyB0byBwcmV2ZW50IGdob3N0L2RvdWJsZWNsaWNrcy5cblx0XHRpZiAoIXRoaXMubmVlZHNDbGljayh0aGlzLnRhcmdldEVsZW1lbnQpIHx8IHRoaXMuY2FuY2VsTmV4dENsaWNrKSB7XG5cblx0XHRcdC8vIFByZXZlbnQgYW55IHVzZXItYWRkZWQgbGlzdGVuZXJzIGRlY2xhcmVkIG9uIEZhc3RDbGljayBlbGVtZW50IGZyb20gYmVpbmcgZmlyZWQuXG5cdFx0XHRpZiAoZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKSB7XG5cdFx0XHRcdGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBQYXJ0IG9mIHRoZSBoYWNrIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgRXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIChlLmcuIEFuZHJvaWQgMilcblx0XHRcdFx0ZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FuY2VsIHRoZSBldmVudFxuXHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIG1vdXNlIGV2ZW50IGlzIHBlcm1pdHRlZCwgcmV0dXJuIHRydWUgZm9yIHRoZSBhY3Rpb24gdG8gZ28gdGhyb3VnaC5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiBhY3R1YWwgY2xpY2tzLCBkZXRlcm1pbmUgd2hldGhlciB0aGlzIGlzIGEgdG91Y2gtZ2VuZXJhdGVkIGNsaWNrLCBhIGNsaWNrIGFjdGlvbiBvY2N1cnJpbmdcblx0ICogbmF0dXJhbGx5IGFmdGVyIGEgZGVsYXkgYWZ0ZXIgYSB0b3VjaCAod2hpY2ggbmVlZHMgdG8gYmUgY2FuY2VsbGVkIHRvIGF2b2lkIGR1cGxpY2F0aW9uKSwgb3Jcblx0ICogYW4gYWN0dWFsIGNsaWNrIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgcGVybWl0dGVkO1xuXG5cdFx0Ly8gSXQncyBwb3NzaWJsZSBmb3IgYW5vdGhlciBGYXN0Q2xpY2stbGlrZSBsaWJyYXJ5IGRlbGl2ZXJlZCB3aXRoIHRoaXJkLXBhcnR5IGNvZGUgdG8gZmlyZSBhIGNsaWNrIGV2ZW50IGJlZm9yZSBGYXN0Q2xpY2sgZG9lcyAoaXNzdWUgIzQ0KS4gSW4gdGhhdCBjYXNlLCBzZXQgdGhlIGNsaWNrLXRyYWNraW5nIGZsYWcgYmFjayB0byBmYWxzZSBhbmQgcmV0dXJuIGVhcmx5LiBUaGlzIHdpbGwgY2F1c2Ugb25Ub3VjaEVuZCB0byByZXR1cm4gZWFybHkuXG5cdFx0aWYgKHRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gVmVyeSBvZGQgYmVoYXZpb3VyIG9uIGlPUyAoaXNzdWUgIzE4KTogaWYgYSBzdWJtaXQgZWxlbWVudCBpcyBwcmVzZW50IGluc2lkZSBhIGZvcm0gYW5kIHRoZSB1c2VyIGhpdHMgZW50ZXIgaW4gdGhlIGlPUyBzaW11bGF0b3Igb3IgY2xpY2tzIHRoZSBHbyBidXR0b24gb24gdGhlIHBvcC11cCBPUyBrZXlib2FyZCB0aGUgYSBraW5kIG9mICdmYWtlJyBjbGljayBldmVudCB3aWxsIGJlIHRyaWdnZXJlZCB3aXRoIHRoZSBzdWJtaXQtdHlwZSBpbnB1dCBlbGVtZW50IGFzIHRoZSB0YXJnZXQuXG5cdFx0aWYgKGV2ZW50LnRhcmdldC50eXBlID09PSAnc3VibWl0JyAmJiBldmVudC5kZXRhaWwgPT09IDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHBlcm1pdHRlZCA9IHRoaXMub25Nb3VzZShldmVudCk7XG5cblx0XHQvLyBPbmx5IHVuc2V0IHRhcmdldEVsZW1lbnQgaWYgdGhlIGNsaWNrIGlzIG5vdCBwZXJtaXR0ZWQuIFRoaXMgd2lsbCBlbnN1cmUgdGhhdCB0aGUgY2hlY2sgZm9yICF0YXJnZXRFbGVtZW50IGluIG9uTW91c2UgZmFpbHMgYW5kIHRoZSBicm93c2VyJ3MgY2xpY2sgZG9lc24ndCBnbyB0aHJvdWdoLlxuXHRcdGlmICghcGVybWl0dGVkKSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIElmIGNsaWNrcyBhcmUgcGVybWl0dGVkLCByZXR1cm4gdHJ1ZSBmb3IgdGhlIGFjdGlvbiB0byBnbyB0aHJvdWdoLlxuXHRcdHJldHVybiBwZXJtaXR0ZWQ7XG5cdH07XG5cblxuXHQvKipcblx0ICogUmVtb3ZlIGFsbCBGYXN0Q2xpY2sncyBldmVudCBsaXN0ZW5lcnMuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxheWVyID0gdGhpcy5sYXllcjtcblxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRydWUpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmUsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5vblRvdWNoQ2FuY2VsLCBmYWxzZSk7XG5cdH07XG5cblxuXHQvKipcblx0ICogQ2hlY2sgd2hldGhlciBGYXN0Q2xpY2sgaXMgbmVlZGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICovXG5cdEZhc3RDbGljay5ub3ROZWVkZWQgPSBmdW5jdGlvbihsYXllcikge1xuXHRcdHZhciBtZXRhVmlld3BvcnQ7XG5cdFx0dmFyIGNocm9tZVZlcnNpb247XG5cdFx0dmFyIGJsYWNrYmVycnlWZXJzaW9uO1xuXHRcdHZhciBmaXJlZm94VmVyc2lvbjtcblxuXHRcdC8vIERldmljZXMgdGhhdCBkb24ndCBzdXBwb3J0IHRvdWNoIGRvbid0IG5lZWQgRmFzdENsaWNrXG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gQ2hyb21lIHZlcnNpb24gLSB6ZXJvIGZvciBvdGhlciBicm93c2Vyc1xuXHRcdGNocm9tZVZlcnNpb24gPSArKC9DaHJvbWVcXC8oWzAtOV0rKS8uZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBbLDBdKVsxXTtcblxuXHRcdGlmIChjaHJvbWVWZXJzaW9uKSB7XG5cblx0XHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXG5cdFx0XHRcdGlmIChtZXRhVmlld3BvcnQpIHtcblx0XHRcdFx0XHQvLyBDaHJvbWUgb24gQW5kcm9pZCB3aXRoIHVzZXItc2NhbGFibGU9XCJub1wiIGRvZXNuJ3QgbmVlZCBGYXN0Q2xpY2sgKGlzc3VlICM4OSlcblx0XHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIENocm9tZSAzMiBhbmQgYWJvdmUgd2l0aCB3aWR0aD1kZXZpY2Utd2lkdGggb3IgbGVzcyBkb24ndCBuZWVkIEZhc3RDbGlja1xuXHRcdFx0XHRcdGlmIChjaHJvbWVWZXJzaW9uID4gMzEgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hyb21lIGRlc2t0b3AgZG9lc24ndCBuZWVkIEZhc3RDbGljayAoaXNzdWUgIzE1KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGRldmljZUlzQmxhY2tCZXJyeTEwKSB7XG5cdFx0XHRibGFja2JlcnJ5VmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1ZlcnNpb25cXC8oWzAtOV0qKVxcLihbMC05XSopLyk7XG5cblx0XHRcdC8vIEJsYWNrQmVycnkgMTAuMysgZG9lcyBub3QgcmVxdWlyZSBGYXN0Y2xpY2sgbGlicmFyeS5cblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mdGxhYnMvZmFzdGNsaWNrL2lzc3Vlcy8yNTFcblx0XHRcdGlmIChibGFja2JlcnJ5VmVyc2lvblsxXSA+PSAxMCAmJiBibGFja2JlcnJ5VmVyc2lvblsyXSA+PSAzKSB7XG5cdFx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblxuXHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0Ly8gdXNlci1zY2FsYWJsZT1ubyBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gd2lkdGg9ZGV2aWNlLXdpZHRoIChvciBsZXNzIHRoYW4gZGV2aWNlLXdpZHRoKSBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElFMTAgd2l0aCAtbXMtdG91Y2gtYWN0aW9uOiBub25lIG9yIG1hbmlwdWxhdGlvbiwgd2hpY2ggZGlzYWJsZXMgZG91YmxlLXRhcC10by16b29tIChpc3N1ZSAjOTcpXG5cdFx0aWYgKGxheWVyLnN0eWxlLm1zVG91Y2hBY3Rpb24gPT09ICdub25lJyB8fCBsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ21hbmlwdWxhdGlvbicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIEZpcmVmb3ggdmVyc2lvbiAtIHplcm8gZm9yIG90aGVyIGJyb3dzZXJzXG5cdFx0ZmlyZWZveFZlcnNpb24gPSArKC9GaXJlZm94XFwvKFswLTldKykvLmV4ZWMobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgWywwXSlbMV07XG5cblx0XHRpZiAoZmlyZWZveFZlcnNpb24gPj0gMjcpIHtcblx0XHRcdC8vIEZpcmVmb3ggMjcrIGRvZXMgbm90IGhhdmUgdGFwIGRlbGF5IGlmIHRoZSBjb250ZW50IGlzIG5vdCB6b29tYWJsZSAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkyMjg5NlxuXG5cdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cdFx0XHRpZiAobWV0YVZpZXdwb3J0ICYmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSUUxMTogcHJlZml4ZWQgLW1zLXRvdWNoLWFjdGlvbiBpcyBubyBsb25nZXIgc3VwcG9ydGVkIGFuZCBpdCdzIHJlY29tZW5kZWQgdG8gdXNlIG5vbi1wcmVmaXhlZCB2ZXJzaW9uXG5cdFx0Ly8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L3dpbmRvd3MvYXBwcy9IaDc2NzMxMy5hc3B4XG5cdFx0aWYgKGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbm9uZScgfHwgbGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdtYW5pcHVsYXRpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgZm9yIGNyZWF0aW5nIGEgRmFzdENsaWNrIG9iamVjdFxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcblx0ICovXG5cdEZhc3RDbGljay5hdHRhY2ggPSBmdW5jdGlvbihsYXllciwgb3B0aW9ucykge1xuXHRcdHJldHVybiBuZXcgRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKTtcblx0fTtcblxuXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIEZhc3RDbGljaztcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRmFzdENsaWNrLmF0dGFjaDtcblx0XHRtb2R1bGUuZXhwb3J0cy5GYXN0Q2xpY2sgPSBGYXN0Q2xpY2s7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LkZhc3RDbGljayA9IEZhc3RDbGljaztcblx0fVxufSgpKTtcbiIsIi8qISBIYW1tZXIuSlMgLSB2Mi4wLjcgLSAyMDE2LTA0LTIyXG4gKiBodHRwOi8vaGFtbWVyanMuZ2l0aHViLmlvL1xuICpcbiAqIENvcHlyaWdodCAoYykgMjAxNiBKb3JpayBUYW5nZWxkZXI7XG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgKi9cbihmdW5jdGlvbih3aW5kb3csIGRvY3VtZW50LCBleHBvcnROYW1lLCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG52YXIgVkVORE9SX1BSRUZJWEVTID0gWycnLCAnd2Via2l0JywgJ01veicsICdNUycsICdtcycsICdvJ107XG52YXIgVEVTVF9FTEVNRU5UID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG5cbnZhciBUWVBFX0ZVTkNUSU9OID0gJ2Z1bmN0aW9uJztcblxudmFyIHJvdW5kID0gTWF0aC5yb3VuZDtcbnZhciBhYnMgPSBNYXRoLmFicztcbnZhciBub3cgPSBEYXRlLm5vdztcblxuLyoqXG4gKiBzZXQgYSB0aW1lb3V0IHdpdGggYSBnaXZlbiBzY29wZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0aW1lb3V0XG4gKiBAcGFyYW0ge09iamVjdH0gY29udGV4dFxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gc2V0VGltZW91dENvbnRleHQoZm4sIHRpbWVvdXQsIGNvbnRleHQpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChiaW5kRm4oZm4sIGNvbnRleHQpLCB0aW1lb3V0KTtcbn1cblxuLyoqXG4gKiBpZiB0aGUgYXJndW1lbnQgaXMgYW4gYXJyYXksIHdlIHdhbnQgdG8gZXhlY3V0ZSB0aGUgZm4gb24gZWFjaCBlbnRyeVxuICogaWYgaXQgYWludCBhbiBhcnJheSB3ZSBkb24ndCB3YW50IHRvIGRvIGEgdGhpbmcuXG4gKiB0aGlzIGlzIHVzZWQgYnkgYWxsIHRoZSBtZXRob2RzIHRoYXQgYWNjZXB0IGEgc2luZ2xlIGFuZCBhcnJheSBhcmd1bWVudC5cbiAqIEBwYXJhbSB7KnxBcnJheX0gYXJnXG4gKiBAcGFyYW0ge1N0cmluZ30gZm5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dF1cbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5mdW5jdGlvbiBpbnZva2VBcnJheUFyZyhhcmcsIGZuLCBjb250ZXh0KSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuICAgICAgICBlYWNoKGFyZywgY29udGV4dFtmbl0sIGNvbnRleHQpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIHdhbGsgb2JqZWN0cyBhbmQgYXJyYXlzXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpdGVyYXRvclxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqL1xuZnVuY3Rpb24gZWFjaChvYmosIGl0ZXJhdG9yLCBjb250ZXh0KSB7XG4gICAgdmFyIGk7XG5cbiAgICBpZiAoIW9iaikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG9iai5mb3JFYWNoKSB7XG4gICAgICAgIG9iai5mb3JFYWNoKGl0ZXJhdG9yLCBjb250ZXh0KTtcbiAgICB9IGVsc2UgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBvYmoubGVuZ3RoKSB7XG4gICAgICAgICAgICBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSBpbiBvYmopIHtcbiAgICAgICAgICAgIG9iai5oYXNPd25Qcm9wZXJ0eShpKSAmJiBpdGVyYXRvci5jYWxsKGNvbnRleHQsIG9ialtpXSwgaSwgb2JqKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiB3cmFwIGEgbWV0aG9kIHdpdGggYSBkZXByZWNhdGlvbiB3YXJuaW5nIGFuZCBzdGFjayB0cmFjZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IG1lc3NhZ2VcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gQSBuZXcgZnVuY3Rpb24gd3JhcHBpbmcgdGhlIHN1cHBsaWVkIG1ldGhvZC5cbiAqL1xuZnVuY3Rpb24gZGVwcmVjYXRlKG1ldGhvZCwgbmFtZSwgbWVzc2FnZSkge1xuICAgIHZhciBkZXByZWNhdGlvbk1lc3NhZ2UgPSAnREVQUkVDQVRFRCBNRVRIT0Q6ICcgKyBuYW1lICsgJ1xcbicgKyBtZXNzYWdlICsgJyBBVCBcXG4nO1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGUgPSBuZXcgRXJyb3IoJ2dldC1zdGFjay10cmFjZScpO1xuICAgICAgICB2YXIgc3RhY2sgPSBlICYmIGUuc3RhY2sgPyBlLnN0YWNrLnJlcGxhY2UoL15bXlxcKF0rP1tcXG4kXS9nbSwgJycpXG4gICAgICAgICAgICAucmVwbGFjZSgvXlxccythdFxccysvZ20sICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL15PYmplY3QuPGFub255bW91cz5cXHMqXFwoL2dtLCAne2Fub255bW91c30oKUAnKSA6ICdVbmtub3duIFN0YWNrIFRyYWNlJztcblxuICAgICAgICB2YXIgbG9nID0gd2luZG93LmNvbnNvbGUgJiYgKHdpbmRvdy5jb25zb2xlLndhcm4gfHwgd2luZG93LmNvbnNvbGUubG9nKTtcbiAgICAgICAgaWYgKGxvZykge1xuICAgICAgICAgICAgbG9nLmNhbGwod2luZG93LmNvbnNvbGUsIGRlcHJlY2F0aW9uTWVzc2FnZSwgc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtZXRob2QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIGV4dGVuZCBvYmplY3QuXG4gKiBtZWFucyB0aGF0IHByb3BlcnRpZXMgaW4gZGVzdCB3aWxsIGJlIG92ZXJ3cml0dGVuIGJ5IHRoZSBvbmVzIGluIHNyYy5cbiAqIEBwYXJhbSB7T2JqZWN0fSB0YXJnZXRcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBvYmplY3RzX3RvX2Fzc2lnblxuICogQHJldHVybnMge09iamVjdH0gdGFyZ2V0XG4gKi9cbnZhciBhc3NpZ247XG5pZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT09ICdmdW5jdGlvbicpIHtcbiAgICBhc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0KSB7XG4gICAgICAgIGlmICh0YXJnZXQgPT09IHVuZGVmaW5lZCB8fCB0YXJnZXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG91dHB1dCA9IE9iamVjdCh0YXJnZXQpO1xuICAgICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgICBpZiAoc291cmNlICE9PSB1bmRlZmluZWQgJiYgc291cmNlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShuZXh0S2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcbn0gZWxzZSB7XG4gICAgYXNzaWduID0gT2JqZWN0LmFzc2lnbjtcbn1cblxuLyoqXG4gKiBleHRlbmQgb2JqZWN0LlxuICogbWVhbnMgdGhhdCBwcm9wZXJ0aWVzIGluIGRlc3Qgd2lsbCBiZSBvdmVyd3JpdHRlbiBieSB0aGUgb25lcyBpbiBzcmMuXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHBhcmFtIHtCb29sZWFufSBbbWVyZ2U9ZmFsc2VdXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBkZXN0XG4gKi9cbnZhciBleHRlbmQgPSBkZXByZWNhdGUoZnVuY3Rpb24gZXh0ZW5kKGRlc3QsIHNyYywgbWVyZ2UpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHNyYyk7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwga2V5cy5sZW5ndGgpIHtcbiAgICAgICAgaWYgKCFtZXJnZSB8fCAobWVyZ2UgJiYgZGVzdFtrZXlzW2ldXSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAgICAgZGVzdFtrZXlzW2ldXSA9IHNyY1trZXlzW2ldXTtcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgfVxuICAgIHJldHVybiBkZXN0O1xufSwgJ2V4dGVuZCcsICdVc2UgYGFzc2lnbmAuJyk7XG5cbi8qKlxuICogbWVyZ2UgdGhlIHZhbHVlcyBmcm9tIHNyYyBpbiB0aGUgZGVzdC5cbiAqIG1lYW5zIHRoYXQgcHJvcGVydGllcyB0aGF0IGV4aXN0IGluIGRlc3Qgd2lsbCBub3QgYmUgb3ZlcndyaXR0ZW4gYnkgc3JjXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzdFxuICogQHBhcmFtIHtPYmplY3R9IHNyY1xuICogQHJldHVybnMge09iamVjdH0gZGVzdFxuICovXG52YXIgbWVyZ2UgPSBkZXByZWNhdGUoZnVuY3Rpb24gbWVyZ2UoZGVzdCwgc3JjKSB7XG4gICAgcmV0dXJuIGV4dGVuZChkZXN0LCBzcmMsIHRydWUpO1xufSwgJ21lcmdlJywgJ1VzZSBgYXNzaWduYC4nKTtcblxuLyoqXG4gKiBzaW1wbGUgY2xhc3MgaW5oZXJpdGFuY2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNoaWxkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBiYXNlXG4gKiBAcGFyYW0ge09iamVjdH0gW3Byb3BlcnRpZXNdXG4gKi9cbmZ1bmN0aW9uIGluaGVyaXQoY2hpbGQsIGJhc2UsIHByb3BlcnRpZXMpIHtcbiAgICB2YXIgYmFzZVAgPSBiYXNlLnByb3RvdHlwZSxcbiAgICAgICAgY2hpbGRQO1xuXG4gICAgY2hpbGRQID0gY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShiYXNlUCk7XG4gICAgY2hpbGRQLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gICAgY2hpbGRQLl9zdXBlciA9IGJhc2VQO1xuXG4gICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgYXNzaWduKGNoaWxkUCwgcHJvcGVydGllcyk7XG4gICAgfVxufVxuXG4vKipcbiAqIHNpbXBsZSBmdW5jdGlvbiBiaW5kXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHBhcmFtIHtPYmplY3R9IGNvbnRleHRcbiAqIEByZXR1cm5zIHtGdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gYmluZEZuKGZuLCBjb250ZXh0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGJvdW5kRm4oKSB7XG4gICAgICAgIHJldHVybiBmbi5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8qKlxuICogbGV0IGEgYm9vbGVhbiB2YWx1ZSBhbHNvIGJlIGEgZnVuY3Rpb24gdGhhdCBtdXN0IHJldHVybiBhIGJvb2xlYW5cbiAqIHRoaXMgZmlyc3QgaXRlbSBpbiBhcmdzIHdpbGwgYmUgdXNlZCBhcyB0aGUgY29udGV4dFxuICogQHBhcmFtIHtCb29sZWFufEZ1bmN0aW9ufSB2YWxcbiAqIEBwYXJhbSB7QXJyYXl9IFthcmdzXVxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGJvb2xPckZuKHZhbCwgYXJncykge1xuICAgIGlmICh0eXBlb2YgdmFsID09IFRZUEVfRlVOQ1RJT04pIHtcbiAgICAgICAgcmV0dXJuIHZhbC5hcHBseShhcmdzID8gYXJnc1swXSB8fCB1bmRlZmluZWQgOiB1bmRlZmluZWQsIGFyZ3MpO1xuICAgIH1cbiAgICByZXR1cm4gdmFsO1xufVxuXG4vKipcbiAqIHVzZSB0aGUgdmFsMiB3aGVuIHZhbDEgaXMgdW5kZWZpbmVkXG4gKiBAcGFyYW0geyp9IHZhbDFcbiAqIEBwYXJhbSB7Kn0gdmFsMlxuICogQHJldHVybnMgeyp9XG4gKi9cbmZ1bmN0aW9uIGlmVW5kZWZpbmVkKHZhbDEsIHZhbDIpIHtcbiAgICByZXR1cm4gKHZhbDEgPT09IHVuZGVmaW5lZCkgPyB2YWwyIDogdmFsMTtcbn1cblxuLyoqXG4gKiBhZGRFdmVudExpc3RlbmVyIHdpdGggbXVsdGlwbGUgZXZlbnRzIGF0IG9uY2VcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldFxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVzXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gKi9cbmZ1bmN0aW9uIGFkZEV2ZW50TGlzdGVuZXJzKHRhcmdldCwgdHlwZXMsIGhhbmRsZXIpIHtcbiAgICBlYWNoKHNwbGl0U3RyKHR5cGVzKSwgZnVuY3Rpb24odHlwZSkge1xuICAgICAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogcmVtb3ZlRXZlbnRMaXN0ZW5lciB3aXRoIG11bHRpcGxlIGV2ZW50cyBhdCBvbmNlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlclxuICovXG5mdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyh0YXJnZXQsIHR5cGVzLCBoYW5kbGVyKSB7XG4gICAgZWFjaChzcGxpdFN0cih0eXBlcyksIGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgdGFyZ2V0LnJlbW92ZUV2ZW50TGlzdGVuZXIodHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIGZpbmQgaWYgYSBub2RlIGlzIGluIHRoZSBnaXZlbiBwYXJlbnRcbiAqIEBtZXRob2QgaGFzUGFyZW50XG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBub2RlXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBwYXJlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIGhhc1BhcmVudChub2RlLCBwYXJlbnQpIHtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAobm9kZSA9PSBwYXJlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBzbWFsbCBpbmRleE9mIHdyYXBwZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaW5kXG4gKiBAcmV0dXJucyB7Qm9vbGVhbn0gZm91bmRcbiAqL1xuZnVuY3Rpb24gaW5TdHIoc3RyLCBmaW5kKSB7XG4gICAgcmV0dXJuIHN0ci5pbmRleE9mKGZpbmQpID4gLTE7XG59XG5cbi8qKlxuICogc3BsaXQgc3RyaW5nIG9uIHdoaXRlc3BhY2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm5zIHtBcnJheX0gd29yZHNcbiAqL1xuZnVuY3Rpb24gc3BsaXRTdHIoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50cmltKCkuc3BsaXQoL1xccysvZyk7XG59XG5cbi8qKlxuICogZmluZCBpZiBhIGFycmF5IGNvbnRhaW5zIHRoZSBvYmplY3QgdXNpbmcgaW5kZXhPZiBvciBhIHNpbXBsZSBwb2x5RmlsbFxuICogQHBhcmFtIHtBcnJheX0gc3JjXG4gKiBAcGFyYW0ge1N0cmluZ30gZmluZFxuICogQHBhcmFtIHtTdHJpbmd9IFtmaW5kQnlLZXldXG4gKiBAcmV0dXJuIHtCb29sZWFufE51bWJlcn0gZmFsc2Ugd2hlbiBub3QgZm91bmQsIG9yIHRoZSBpbmRleFxuICovXG5mdW5jdGlvbiBpbkFycmF5KHNyYywgZmluZCwgZmluZEJ5S2V5KSB7XG4gICAgaWYgKHNyYy5pbmRleE9mICYmICFmaW5kQnlLZXkpIHtcbiAgICAgICAgcmV0dXJuIHNyYy5pbmRleE9mKGZpbmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoKGZpbmRCeUtleSAmJiBzcmNbaV1bZmluZEJ5S2V5XSA9PSBmaW5kKSB8fCAoIWZpbmRCeUtleSAmJiBzcmNbaV0gPT09IGZpbmQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbn1cblxuLyoqXG4gKiBjb252ZXJ0IGFycmF5LWxpa2Ugb2JqZWN0cyB0byByZWFsIGFycmF5c1xuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybnMge0FycmF5fVxuICovXG5mdW5jdGlvbiB0b0FycmF5KG9iaikge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChvYmosIDApO1xufVxuXG4vKipcbiAqIHVuaXF1ZSBhcnJheSB3aXRoIG9iamVjdHMgYmFzZWQgb24gYSBrZXkgKGxpa2UgJ2lkJykgb3IganVzdCBieSB0aGUgYXJyYXkncyB2YWx1ZVxuICogQHBhcmFtIHtBcnJheX0gc3JjIFt7aWQ6MX0se2lkOjJ9LHtpZDoxfV1cbiAqIEBwYXJhbSB7U3RyaW5nfSBba2V5XVxuICogQHBhcmFtIHtCb29sZWFufSBbc29ydD1GYWxzZV1cbiAqIEByZXR1cm5zIHtBcnJheX0gW3tpZDoxfSx7aWQ6Mn1dXG4gKi9cbmZ1bmN0aW9uIHVuaXF1ZUFycmF5KHNyYywga2V5LCBzb3J0KSB7XG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICB2YXIgdmFsdWVzID0gW107XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgd2hpbGUgKGkgPCBzcmMubGVuZ3RoKSB7XG4gICAgICAgIHZhciB2YWwgPSBrZXkgPyBzcmNbaV1ba2V5XSA6IHNyY1tpXTtcbiAgICAgICAgaWYgKGluQXJyYXkodmFsdWVzLCB2YWwpIDwgMCkge1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHNyY1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWVzW2ldID0gdmFsO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHNvcnQpIHtcbiAgICAgICAgaWYgKCFrZXkpIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzLnNvcnQoZnVuY3Rpb24gc29ydFVuaXF1ZUFycmF5KGEsIGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYVtrZXldID4gYltrZXldO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbn1cblxuLyoqXG4gKiBnZXQgdGhlIHByZWZpeGVkIHByb3BlcnR5XG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge1N0cmluZ30gcHJvcGVydHlcbiAqIEByZXR1cm5zIHtTdHJpbmd8VW5kZWZpbmVkfSBwcmVmaXhlZFxuICovXG5mdW5jdGlvbiBwcmVmaXhlZChvYmosIHByb3BlcnR5KSB7XG4gICAgdmFyIHByZWZpeCwgcHJvcDtcbiAgICB2YXIgY2FtZWxQcm9wID0gcHJvcGVydHlbMF0udG9VcHBlckNhc2UoKSArIHByb3BlcnR5LnNsaWNlKDEpO1xuXG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgVkVORE9SX1BSRUZJWEVTLmxlbmd0aCkge1xuICAgICAgICBwcmVmaXggPSBWRU5ET1JfUFJFRklYRVNbaV07XG4gICAgICAgIHByb3AgPSAocHJlZml4KSA/IHByZWZpeCArIGNhbWVsUHJvcCA6IHByb3BlcnR5O1xuXG4gICAgICAgIGlmIChwcm9wIGluIG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIGdldCBhIHVuaXF1ZSBpZFxuICogQHJldHVybnMge251bWJlcn0gdW5pcXVlSWRcbiAqL1xudmFyIF91bmlxdWVJZCA9IDE7XG5mdW5jdGlvbiB1bmlxdWVJZCgpIHtcbiAgICByZXR1cm4gX3VuaXF1ZUlkKys7XG59XG5cbi8qKlxuICogZ2V0IHRoZSB3aW5kb3cgb2JqZWN0IG9mIGFuIGVsZW1lbnRcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEByZXR1cm5zIHtEb2N1bWVudFZpZXd8V2luZG93fVxuICovXG5mdW5jdGlvbiBnZXRXaW5kb3dGb3JFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB2YXIgZG9jID0gZWxlbWVudC5vd25lckRvY3VtZW50IHx8IGVsZW1lbnQ7XG4gICAgcmV0dXJuIChkb2MuZGVmYXVsdFZpZXcgfHwgZG9jLnBhcmVudFdpbmRvdyB8fCB3aW5kb3cpO1xufVxuXG52YXIgTU9CSUxFX1JFR0VYID0gL21vYmlsZXx0YWJsZXR8aXAoYWR8aG9uZXxvZCl8YW5kcm9pZC9pO1xuXG52YXIgU1VQUE9SVF9UT1VDSCA9ICgnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cpO1xudmFyIFNVUFBPUlRfUE9JTlRFUl9FVkVOVFMgPSBwcmVmaXhlZCh3aW5kb3csICdQb2ludGVyRXZlbnQnKSAhPT0gdW5kZWZpbmVkO1xudmFyIFNVUFBPUlRfT05MWV9UT1VDSCA9IFNVUFBPUlRfVE9VQ0ggJiYgTU9CSUxFX1JFR0VYLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cbnZhciBJTlBVVF9UWVBFX1RPVUNIID0gJ3RvdWNoJztcbnZhciBJTlBVVF9UWVBFX1BFTiA9ICdwZW4nO1xudmFyIElOUFVUX1RZUEVfTU9VU0UgPSAnbW91c2UnO1xudmFyIElOUFVUX1RZUEVfS0lORUNUID0gJ2tpbmVjdCc7XG5cbnZhciBDT01QVVRFX0lOVEVSVkFMID0gMjU7XG5cbnZhciBJTlBVVF9TVEFSVCA9IDE7XG52YXIgSU5QVVRfTU9WRSA9IDI7XG52YXIgSU5QVVRfRU5EID0gNDtcbnZhciBJTlBVVF9DQU5DRUwgPSA4O1xuXG52YXIgRElSRUNUSU9OX05PTkUgPSAxO1xudmFyIERJUkVDVElPTl9MRUZUID0gMjtcbnZhciBESVJFQ1RJT05fUklHSFQgPSA0O1xudmFyIERJUkVDVElPTl9VUCA9IDg7XG52YXIgRElSRUNUSU9OX0RPV04gPSAxNjtcblxudmFyIERJUkVDVElPTl9IT1JJWk9OVEFMID0gRElSRUNUSU9OX0xFRlQgfCBESVJFQ1RJT05fUklHSFQ7XG52YXIgRElSRUNUSU9OX1ZFUlRJQ0FMID0gRElSRUNUSU9OX1VQIHwgRElSRUNUSU9OX0RPV047XG52YXIgRElSRUNUSU9OX0FMTCA9IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMO1xuXG52YXIgUFJPUFNfWFkgPSBbJ3gnLCAneSddO1xudmFyIFBST1BTX0NMSUVOVF9YWSA9IFsnY2xpZW50WCcsICdjbGllbnRZJ107XG5cbi8qKlxuICogY3JlYXRlIG5ldyBpbnB1dCB0eXBlIG1hbmFnZXJcbiAqIEBwYXJhbSB7TWFuYWdlcn0gbWFuYWdlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtJbnB1dH1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBJbnB1dChtYW5hZ2VyLCBjYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLm1hbmFnZXIgPSBtYW5hZ2VyO1xuICAgIHRoaXMuY2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICB0aGlzLmVsZW1lbnQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgdGhpcy50YXJnZXQgPSBtYW5hZ2VyLm9wdGlvbnMuaW5wdXRUYXJnZXQ7XG5cbiAgICAvLyBzbWFsbGVyIHdyYXBwZXIgYXJvdW5kIHRoZSBoYW5kbGVyLCBmb3IgdGhlIHNjb3BlIGFuZCB0aGUgZW5hYmxlZCBzdGF0ZSBvZiB0aGUgbWFuYWdlcixcbiAgICAvLyBzbyB3aGVuIGRpc2FibGVkIHRoZSBpbnB1dCBldmVudHMgYXJlIGNvbXBsZXRlbHkgYnlwYXNzZWQuXG4gICAgdGhpcy5kb21IYW5kbGVyID0gZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgaWYgKGJvb2xPckZuKG1hbmFnZXIub3B0aW9ucy5lbmFibGUsIFttYW5hZ2VyXSkpIHtcbiAgICAgICAgICAgIHNlbGYuaGFuZGxlcihldik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5pbml0KCk7XG5cbn1cblxuSW5wdXQucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNob3VsZCBoYW5kbGUgdGhlIGlucHV0RXZlbnQgZGF0YSBhbmQgdHJpZ2dlciB0aGUgY2FsbGJhY2tcbiAgICAgKiBAdmlydHVhbFxuICAgICAqL1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiBhZGRFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiBhZGRFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVuYmluZCB0aGUgZXZlbnRzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZXZFbCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLmVsZW1lbnQsIHRoaXMuZXZFbCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldlRhcmdldCAmJiByZW1vdmVFdmVudExpc3RlbmVycyh0aGlzLnRhcmdldCwgdGhpcy5ldlRhcmdldCwgdGhpcy5kb21IYW5kbGVyKTtcbiAgICAgICAgdGhpcy5ldldpbiAmJiByZW1vdmVFdmVudExpc3RlbmVycyhnZXRXaW5kb3dGb3JFbGVtZW50KHRoaXMuZWxlbWVudCksIHRoaXMuZXZXaW4sIHRoaXMuZG9tSGFuZGxlcik7XG4gICAgfVxufTtcblxuLyoqXG4gKiBjcmVhdGUgbmV3IGlucHV0IHR5cGUgbWFuYWdlclxuICogY2FsbGVkIGJ5IHRoZSBNYW5hZ2VyIGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0hhbW1lcn0gbWFuYWdlclxuICogQHJldHVybnMge0lucHV0fVxuICovXG5mdW5jdGlvbiBjcmVhdGVJbnB1dEluc3RhbmNlKG1hbmFnZXIpIHtcbiAgICB2YXIgVHlwZTtcbiAgICB2YXIgaW5wdXRDbGFzcyA9IG1hbmFnZXIub3B0aW9ucy5pbnB1dENsYXNzO1xuXG4gICAgaWYgKGlucHV0Q2xhc3MpIHtcbiAgICAgICAgVHlwZSA9IGlucHV0Q2xhc3M7XG4gICAgfSBlbHNlIGlmIChTVVBQT1JUX1BPSU5URVJfRVZFTlRTKSB7XG4gICAgICAgIFR5cGUgPSBQb2ludGVyRXZlbnRJbnB1dDtcbiAgICB9IGVsc2UgaWYgKFNVUFBPUlRfT05MWV9UT1VDSCkge1xuICAgICAgICBUeXBlID0gVG91Y2hJbnB1dDtcbiAgICB9IGVsc2UgaWYgKCFTVVBQT1JUX1RPVUNIKSB7XG4gICAgICAgIFR5cGUgPSBNb3VzZUlucHV0O1xuICAgIH0gZWxzZSB7XG4gICAgICAgIFR5cGUgPSBUb3VjaE1vdXNlSW5wdXQ7XG4gICAgfVxuICAgIHJldHVybiBuZXcgKFR5cGUpKG1hbmFnZXIsIGlucHV0SGFuZGxlcik7XG59XG5cbi8qKlxuICogaGFuZGxlIGlucHV0IGV2ZW50c1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRUeXBlXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gaW5wdXRIYW5kbGVyKG1hbmFnZXIsIGV2ZW50VHlwZSwgaW5wdXQpIHtcbiAgICB2YXIgcG9pbnRlcnNMZW4gPSBpbnB1dC5wb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGNoYW5nZWRQb2ludGVyc0xlbiA9IGlucHV0LmNoYW5nZWRQb2ludGVycy5sZW5ndGg7XG4gICAgdmFyIGlzRmlyc3QgPSAoZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG4gICAgdmFyIGlzRmluYWwgPSAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkgJiYgKHBvaW50ZXJzTGVuIC0gY2hhbmdlZFBvaW50ZXJzTGVuID09PSAwKSk7XG5cbiAgICBpbnB1dC5pc0ZpcnN0ID0gISFpc0ZpcnN0O1xuICAgIGlucHV0LmlzRmluYWwgPSAhIWlzRmluYWw7XG5cbiAgICBpZiAoaXNGaXJzdCkge1xuICAgICAgICBtYW5hZ2VyLnNlc3Npb24gPSB7fTtcbiAgICB9XG5cbiAgICAvLyBzb3VyY2UgZXZlbnQgaXMgdGhlIG5vcm1hbGl6ZWQgdmFsdWUgb2YgdGhlIGRvbUV2ZW50c1xuICAgIC8vIGxpa2UgJ3RvdWNoc3RhcnQsIG1vdXNldXAsIHBvaW50ZXJkb3duJ1xuICAgIGlucHV0LmV2ZW50VHlwZSA9IGV2ZW50VHlwZTtcblxuICAgIC8vIGNvbXB1dGUgc2NhbGUsIHJvdGF0aW9uIGV0Y1xuICAgIGNvbXB1dGVJbnB1dERhdGEobWFuYWdlciwgaW5wdXQpO1xuXG4gICAgLy8gZW1pdCBzZWNyZXQgZXZlbnRcbiAgICBtYW5hZ2VyLmVtaXQoJ2hhbW1lci5pbnB1dCcsIGlucHV0KTtcblxuICAgIG1hbmFnZXIucmVjb2duaXplKGlucHV0KTtcbiAgICBtYW5hZ2VyLnNlc3Npb24ucHJldklucHV0ID0gaW5wdXQ7XG59XG5cbi8qKlxuICogZXh0ZW5kIHRoZSBkYXRhIHdpdGggc29tZSB1c2FibGUgcHJvcGVydGllcyBsaWtlIHNjYWxlLCByb3RhdGUsIHZlbG9jaXR5IGV0Y1xuICogQHBhcmFtIHtPYmplY3R9IG1hbmFnZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICovXG5mdW5jdGlvbiBjb21wdXRlSW5wdXREYXRhKG1hbmFnZXIsIGlucHV0KSB7XG4gICAgdmFyIHNlc3Npb24gPSBtYW5hZ2VyLnNlc3Npb247XG4gICAgdmFyIHBvaW50ZXJzID0gaW5wdXQucG9pbnRlcnM7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gc3RvcmUgdGhlIGZpcnN0IGlucHV0IHRvIGNhbGN1bGF0ZSB0aGUgZGlzdGFuY2UgYW5kIGRpcmVjdGlvblxuICAgIGlmICghc2Vzc2lvbi5maXJzdElucHV0KSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RJbnB1dCA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9XG5cbiAgICAvLyB0byBjb21wdXRlIHNjYWxlIGFuZCByb3RhdGlvbiB3ZSBuZWVkIHRvIHN0b3JlIHRoZSBtdWx0aXBsZSB0b3VjaGVzXG4gICAgaWYgKHBvaW50ZXJzTGVuZ3RoID4gMSAmJiAhc2Vzc2lvbi5maXJzdE11bHRpcGxlKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KTtcbiAgICB9IGVsc2UgaWYgKHBvaW50ZXJzTGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHNlc3Npb24uZmlyc3RNdWx0aXBsZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaXJzdElucHV0ID0gc2Vzc2lvbi5maXJzdElucHV0O1xuICAgIHZhciBmaXJzdE11bHRpcGxlID0gc2Vzc2lvbi5maXJzdE11bHRpcGxlO1xuICAgIHZhciBvZmZzZXRDZW50ZXIgPSBmaXJzdE11bHRpcGxlID8gZmlyc3RNdWx0aXBsZS5jZW50ZXIgOiBmaXJzdElucHV0LmNlbnRlcjtcblxuICAgIHZhciBjZW50ZXIgPSBpbnB1dC5jZW50ZXIgPSBnZXRDZW50ZXIocG9pbnRlcnMpO1xuICAgIGlucHV0LnRpbWVTdGFtcCA9IG5vdygpO1xuICAgIGlucHV0LmRlbHRhVGltZSA9IGlucHV0LnRpbWVTdGFtcCAtIGZpcnN0SW5wdXQudGltZVN0YW1wO1xuXG4gICAgaW5wdXQuYW5nbGUgPSBnZXRBbmdsZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG4gICAgaW5wdXQuZGlzdGFuY2UgPSBnZXREaXN0YW5jZShvZmZzZXRDZW50ZXIsIGNlbnRlcik7XG5cbiAgICBjb21wdXRlRGVsdGFYWShzZXNzaW9uLCBpbnB1dCk7XG4gICAgaW5wdXQub2Zmc2V0RGlyZWN0aW9uID0gZ2V0RGlyZWN0aW9uKGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcblxuICAgIHZhciBvdmVyYWxsVmVsb2NpdHkgPSBnZXRWZWxvY2l0eShpbnB1dC5kZWx0YVRpbWUsIGlucHV0LmRlbHRhWCwgaW5wdXQuZGVsdGFZKTtcbiAgICBpbnB1dC5vdmVyYWxsVmVsb2NpdHlYID0gb3ZlcmFsbFZlbG9jaXR5Lng7XG4gICAgaW5wdXQub3ZlcmFsbFZlbG9jaXR5WSA9IG92ZXJhbGxWZWxvY2l0eS55O1xuICAgIGlucHV0Lm92ZXJhbGxWZWxvY2l0eSA9IChhYnMob3ZlcmFsbFZlbG9jaXR5LngpID4gYWJzKG92ZXJhbGxWZWxvY2l0eS55KSkgPyBvdmVyYWxsVmVsb2NpdHkueCA6IG92ZXJhbGxWZWxvY2l0eS55O1xuXG4gICAgaW5wdXQuc2NhbGUgPSBmaXJzdE11bHRpcGxlID8gZ2V0U2NhbGUoZmlyc3RNdWx0aXBsZS5wb2ludGVycywgcG9pbnRlcnMpIDogMTtcbiAgICBpbnB1dC5yb3RhdGlvbiA9IGZpcnN0TXVsdGlwbGUgPyBnZXRSb3RhdGlvbihmaXJzdE11bHRpcGxlLnBvaW50ZXJzLCBwb2ludGVycykgOiAwO1xuXG4gICAgaW5wdXQubWF4UG9pbnRlcnMgPSAhc2Vzc2lvbi5wcmV2SW5wdXQgPyBpbnB1dC5wb2ludGVycy5sZW5ndGggOiAoKGlucHV0LnBvaW50ZXJzLmxlbmd0aCA+XG4gICAgICAgIHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKSA/IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA6IHNlc3Npb24ucHJldklucHV0Lm1heFBvaW50ZXJzKTtcblxuICAgIGNvbXB1dGVJbnRlcnZhbElucHV0RGF0YShzZXNzaW9uLCBpbnB1dCk7XG5cbiAgICAvLyBmaW5kIHRoZSBjb3JyZWN0IHRhcmdldFxuICAgIHZhciB0YXJnZXQgPSBtYW5hZ2VyLmVsZW1lbnQ7XG4gICAgaWYgKGhhc1BhcmVudChpbnB1dC5zcmNFdmVudC50YXJnZXQsIHRhcmdldCkpIHtcbiAgICAgICAgdGFyZ2V0ID0gaW5wdXQuc3JjRXZlbnQudGFyZ2V0O1xuICAgIH1cbiAgICBpbnB1dC50YXJnZXQgPSB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIGNvbXB1dGVEZWx0YVhZKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGNlbnRlciA9IGlucHV0LmNlbnRlcjtcbiAgICB2YXIgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSB8fCB7fTtcbiAgICB2YXIgcHJldkRlbHRhID0gc2Vzc2lvbi5wcmV2RGVsdGEgfHwge307XG4gICAgdmFyIHByZXZJbnB1dCA9IHNlc3Npb24ucHJldklucHV0IHx8IHt9O1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfU1RBUlQgfHwgcHJldklucHV0LmV2ZW50VHlwZSA9PT0gSU5QVVRfRU5EKSB7XG4gICAgICAgIHByZXZEZWx0YSA9IHNlc3Npb24ucHJldkRlbHRhID0ge1xuICAgICAgICAgICAgeDogcHJldklucHV0LmRlbHRhWCB8fCAwLFxuICAgICAgICAgICAgeTogcHJldklucHV0LmRlbHRhWSB8fCAwXG4gICAgICAgIH07XG5cbiAgICAgICAgb2Zmc2V0ID0gc2Vzc2lvbi5vZmZzZXREZWx0YSA9IHtcbiAgICAgICAgICAgIHg6IGNlbnRlci54LFxuICAgICAgICAgICAgeTogY2VudGVyLnlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpbnB1dC5kZWx0YVggPSBwcmV2RGVsdGEueCArIChjZW50ZXIueCAtIG9mZnNldC54KTtcbiAgICBpbnB1dC5kZWx0YVkgPSBwcmV2RGVsdGEueSArIChjZW50ZXIueSAtIG9mZnNldC55KTtcbn1cblxuLyoqXG4gKiB2ZWxvY2l0eSBpcyBjYWxjdWxhdGVkIGV2ZXJ5IHggbXNcbiAqIEBwYXJhbSB7T2JqZWN0fSBzZXNzaW9uXG4gKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUludGVydmFsSW5wdXREYXRhKHNlc3Npb24sIGlucHV0KSB7XG4gICAgdmFyIGxhc3QgPSBzZXNzaW9uLmxhc3RJbnRlcnZhbCB8fCBpbnB1dCxcbiAgICAgICAgZGVsdGFUaW1lID0gaW5wdXQudGltZVN0YW1wIC0gbGFzdC50aW1lU3RhbXAsXG4gICAgICAgIHZlbG9jaXR5LCB2ZWxvY2l0eVgsIHZlbG9jaXR5WSwgZGlyZWN0aW9uO1xuXG4gICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9DQU5DRUwgJiYgKGRlbHRhVGltZSA+IENPTVBVVEVfSU5URVJWQUwgfHwgbGFzdC52ZWxvY2l0eSA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICB2YXIgZGVsdGFYID0gaW5wdXQuZGVsdGFYIC0gbGFzdC5kZWx0YVg7XG4gICAgICAgIHZhciBkZWx0YVkgPSBpbnB1dC5kZWx0YVkgLSBsYXN0LmRlbHRhWTtcblxuICAgICAgICB2YXIgdiA9IGdldFZlbG9jaXR5KGRlbHRhVGltZSwgZGVsdGFYLCBkZWx0YVkpO1xuICAgICAgICB2ZWxvY2l0eVggPSB2Lng7XG4gICAgICAgIHZlbG9jaXR5WSA9IHYueTtcbiAgICAgICAgdmVsb2NpdHkgPSAoYWJzKHYueCkgPiBhYnModi55KSkgPyB2LnggOiB2Lnk7XG4gICAgICAgIGRpcmVjdGlvbiA9IGdldERpcmVjdGlvbihkZWx0YVgsIGRlbHRhWSk7XG5cbiAgICAgICAgc2Vzc2lvbi5sYXN0SW50ZXJ2YWwgPSBpbnB1dDtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyB1c2UgbGF0ZXN0IHZlbG9jaXR5IGluZm8gaWYgaXQgZG9lc24ndCBvdmVydGFrZSBhIG1pbmltdW0gcGVyaW9kXG4gICAgICAgIHZlbG9jaXR5ID0gbGFzdC52ZWxvY2l0eTtcbiAgICAgICAgdmVsb2NpdHlYID0gbGFzdC52ZWxvY2l0eVg7XG4gICAgICAgIHZlbG9jaXR5WSA9IGxhc3QudmVsb2NpdHlZO1xuICAgICAgICBkaXJlY3Rpb24gPSBsYXN0LmRpcmVjdGlvbjtcbiAgICB9XG5cbiAgICBpbnB1dC52ZWxvY2l0eSA9IHZlbG9jaXR5O1xuICAgIGlucHV0LnZlbG9jaXR5WCA9IHZlbG9jaXR5WDtcbiAgICBpbnB1dC52ZWxvY2l0eVkgPSB2ZWxvY2l0eVk7XG4gICAgaW5wdXQuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xufVxuXG4vKipcbiAqIGNyZWF0ZSBhIHNpbXBsZSBjbG9uZSBmcm9tIHRoZSBpbnB1dCB1c2VkIGZvciBzdG9yYWdlIG9mIGZpcnN0SW5wdXQgYW5kIGZpcnN0TXVsdGlwbGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICogQHJldHVybnMge09iamVjdH0gY2xvbmVkSW5wdXREYXRhXG4gKi9cbmZ1bmN0aW9uIHNpbXBsZUNsb25lSW5wdXREYXRhKGlucHV0KSB7XG4gICAgLy8gbWFrZSBhIHNpbXBsZSBjb3B5IG9mIHRoZSBwb2ludGVycyBiZWNhdXNlIHdlIHdpbGwgZ2V0IGEgcmVmZXJlbmNlIGlmIHdlIGRvbid0XG4gICAgLy8gd2Ugb25seSBuZWVkIGNsaWVudFhZIGZvciB0aGUgY2FsY3VsYXRpb25zXG4gICAgdmFyIHBvaW50ZXJzID0gW107XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpIDwgaW5wdXQucG9pbnRlcnMubGVuZ3RoKSB7XG4gICAgICAgIHBvaW50ZXJzW2ldID0ge1xuICAgICAgICAgICAgY2xpZW50WDogcm91bmQoaW5wdXQucG9pbnRlcnNbaV0uY2xpZW50WCksXG4gICAgICAgICAgICBjbGllbnRZOiByb3VuZChpbnB1dC5wb2ludGVyc1tpXS5jbGllbnRZKVxuICAgICAgICB9O1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGltZVN0YW1wOiBub3coKSxcbiAgICAgICAgcG9pbnRlcnM6IHBvaW50ZXJzLFxuICAgICAgICBjZW50ZXI6IGdldENlbnRlcihwb2ludGVycyksXG4gICAgICAgIGRlbHRhWDogaW5wdXQuZGVsdGFYLFxuICAgICAgICBkZWx0YVk6IGlucHV0LmRlbHRhWVxuICAgIH07XG59XG5cbi8qKlxuICogZ2V0IHRoZSBjZW50ZXIgb2YgYWxsIHRoZSBwb2ludGVyc1xuICogQHBhcmFtIHtBcnJheX0gcG9pbnRlcnNcbiAqIEByZXR1cm4ge09iamVjdH0gY2VudGVyIGNvbnRhaW5zIGB4YCBhbmQgYHlgIHByb3BlcnRpZXNcbiAqL1xuZnVuY3Rpb24gZ2V0Q2VudGVyKHBvaW50ZXJzKSB7XG4gICAgdmFyIHBvaW50ZXJzTGVuZ3RoID0gcG9pbnRlcnMubGVuZ3RoO1xuXG4gICAgLy8gbm8gbmVlZCB0byBsb29wIHdoZW4gb25seSBvbmUgdG91Y2hcbiAgICBpZiAocG9pbnRlcnNMZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHJvdW5kKHBvaW50ZXJzWzBdLmNsaWVudFgpLFxuICAgICAgICAgICAgeTogcm91bmQocG9pbnRlcnNbMF0uY2xpZW50WSlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgeCA9IDAsIHkgPSAwLCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IHBvaW50ZXJzTGVuZ3RoKSB7XG4gICAgICAgIHggKz0gcG9pbnRlcnNbaV0uY2xpZW50WDtcbiAgICAgICAgeSArPSBwb2ludGVyc1tpXS5jbGllbnRZO1xuICAgICAgICBpKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgeDogcm91bmQoeCAvIHBvaW50ZXJzTGVuZ3RoKSxcbiAgICAgICAgeTogcm91bmQoeSAvIHBvaW50ZXJzTGVuZ3RoKVxuICAgIH07XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSB2ZWxvY2l0eSBiZXR3ZWVuIHR3byBwb2ludHMuIHVuaXQgaXMgaW4gcHggcGVyIG1zLlxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbHRhVGltZVxuICogQHBhcmFtIHtOdW1iZXJ9IHhcbiAqIEBwYXJhbSB7TnVtYmVyfSB5XG4gKiBAcmV0dXJuIHtPYmplY3R9IHZlbG9jaXR5IGB4YCBhbmQgYHlgXG4gKi9cbmZ1bmN0aW9uIGdldFZlbG9jaXR5KGRlbHRhVGltZSwgeCwgeSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHg6IHggLyBkZWx0YVRpbWUgfHwgMCxcbiAgICAgICAgeTogeSAvIGRlbHRhVGltZSB8fCAwXG4gICAgfTtcbn1cblxuLyoqXG4gKiBnZXQgdGhlIGRpcmVjdGlvbiBiZXR3ZWVuIHR3byBwb2ludHNcbiAqIEBwYXJhbSB7TnVtYmVyfSB4XG4gKiBAcGFyYW0ge051bWJlcn0geVxuICogQHJldHVybiB7TnVtYmVyfSBkaXJlY3Rpb25cbiAqL1xuZnVuY3Rpb24gZ2V0RGlyZWN0aW9uKHgsIHkpIHtcbiAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICByZXR1cm4gRElSRUNUSU9OX05PTkU7XG4gICAgfVxuXG4gICAgaWYgKGFicyh4KSA+PSBhYnMoeSkpIHtcbiAgICAgICAgcmV0dXJuIHggPCAwID8gRElSRUNUSU9OX0xFRlQgOiBESVJFQ1RJT05fUklHSFQ7XG4gICAgfVxuICAgIHJldHVybiB5IDwgMCA/IERJUkVDVElPTl9VUCA6IERJUkVDVElPTl9ET1dOO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgYWJzb2x1dGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gcG9pbnRzXG4gKiBAcGFyYW0ge09iamVjdH0gcDEge3gsIHl9XG4gKiBAcGFyYW0ge09iamVjdH0gcDIge3gsIHl9XG4gKiBAcGFyYW0ge0FycmF5fSBbcHJvcHNdIGNvbnRhaW5pbmcgeCBhbmQgeSBrZXlzXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IGRpc3RhbmNlXG4gKi9cbmZ1bmN0aW9uIGdldERpc3RhbmNlKHAxLCBwMiwgcHJvcHMpIHtcbiAgICBpZiAoIXByb3BzKSB7XG4gICAgICAgIHByb3BzID0gUFJPUFNfWFk7XG4gICAgfVxuICAgIHZhciB4ID0gcDJbcHJvcHNbMF1dIC0gcDFbcHJvcHNbMF1dLFxuICAgICAgICB5ID0gcDJbcHJvcHNbMV1dIC0gcDFbcHJvcHNbMV1dO1xuXG4gICAgcmV0dXJuIE1hdGguc3FydCgoeCAqIHgpICsgKHkgKiB5KSk7XG59XG5cbi8qKlxuICogY2FsY3VsYXRlIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byBjb29yZGluYXRlc1xuICogQHBhcmFtIHtPYmplY3R9IHAxXG4gKiBAcGFyYW0ge09iamVjdH0gcDJcbiAqIEBwYXJhbSB7QXJyYXl9IFtwcm9wc10gY29udGFpbmluZyB4IGFuZCB5IGtleXNcbiAqIEByZXR1cm4ge051bWJlcn0gYW5nbGVcbiAqL1xuZnVuY3Rpb24gZ2V0QW5nbGUocDEsIHAyLCBwcm9wcykge1xuICAgIGlmICghcHJvcHMpIHtcbiAgICAgICAgcHJvcHMgPSBQUk9QU19YWTtcbiAgICB9XG4gICAgdmFyIHggPSBwMltwcm9wc1swXV0gLSBwMVtwcm9wc1swXV0sXG4gICAgICAgIHkgPSBwMltwcm9wc1sxXV0gLSBwMVtwcm9wc1sxXV07XG4gICAgcmV0dXJuIE1hdGguYXRhbjIoeSwgeCkgKiAxODAgLyBNYXRoLlBJO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgcm90YXRpb24gZGVncmVlcyBiZXR3ZWVuIHR3byBwb2ludGVyc2V0c1xuICogQHBhcmFtIHtBcnJheX0gc3RhcnQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEBwYXJhbSB7QXJyYXl9IGVuZCBhcnJheSBvZiBwb2ludGVyc1xuICogQHJldHVybiB7TnVtYmVyfSByb3RhdGlvblxuICovXG5mdW5jdGlvbiBnZXRSb3RhdGlvbihzdGFydCwgZW5kKSB7XG4gICAgcmV0dXJuIGdldEFuZ2xlKGVuZFsxXSwgZW5kWzBdLCBQUk9QU19DTElFTlRfWFkpICsgZ2V0QW5nbGUoc3RhcnRbMV0sIHN0YXJ0WzBdLCBQUk9QU19DTElFTlRfWFkpO1xufVxuXG4vKipcbiAqIGNhbGN1bGF0ZSB0aGUgc2NhbGUgZmFjdG9yIGJldHdlZW4gdHdvIHBvaW50ZXJzZXRzXG4gKiBubyBzY2FsZSBpcyAxLCBhbmQgZ29lcyBkb3duIHRvIDAgd2hlbiBwaW5jaGVkIHRvZ2V0aGVyLCBhbmQgYmlnZ2VyIHdoZW4gcGluY2hlZCBvdXRcbiAqIEBwYXJhbSB7QXJyYXl9IHN0YXJ0IGFycmF5IG9mIHBvaW50ZXJzXG4gKiBAcGFyYW0ge0FycmF5fSBlbmQgYXJyYXkgb2YgcG9pbnRlcnNcbiAqIEByZXR1cm4ge051bWJlcn0gc2NhbGVcbiAqL1xuZnVuY3Rpb24gZ2V0U2NhbGUoc3RhcnQsIGVuZCkge1xuICAgIHJldHVybiBnZXREaXN0YW5jZShlbmRbMF0sIGVuZFsxXSwgUFJPUFNfQ0xJRU5UX1hZKSAvIGdldERpc3RhbmNlKHN0YXJ0WzBdLCBzdGFydFsxXSwgUFJPUFNfQ0xJRU5UX1hZKTtcbn1cblxudmFyIE1PVVNFX0lOUFVUX01BUCA9IHtcbiAgICBtb3VzZWRvd246IElOUFVUX1NUQVJULFxuICAgIG1vdXNlbW92ZTogSU5QVVRfTU9WRSxcbiAgICBtb3VzZXVwOiBJTlBVVF9FTkRcbn07XG5cbnZhciBNT1VTRV9FTEVNRU5UX0VWRU5UUyA9ICdtb3VzZWRvd24nO1xudmFyIE1PVVNFX1dJTkRPV19FVkVOVFMgPSAnbW91c2Vtb3ZlIG1vdXNldXAnO1xuXG4vKipcbiAqIE1vdXNlIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBNb3VzZUlucHV0KCkge1xuICAgIHRoaXMuZXZFbCA9IE1PVVNFX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBNT1VTRV9XSU5ET1dfRVZFTlRTO1xuXG4gICAgdGhpcy5wcmVzc2VkID0gZmFsc2U7IC8vIG1vdXNlZG93biBzdGF0ZVxuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChNb3VzZUlucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBldmVudHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBNRWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IE1PVVNFX0lOUFVUX01BUFtldi50eXBlXTtcblxuICAgICAgICAvLyBvbiBzdGFydCB3ZSB3YW50IHRvIGhhdmUgdGhlIGxlZnQgbW91c2UgYnV0dG9uIGRvd25cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIGV2LmJ1dHRvbiA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9NT1ZFICYmIGV2LndoaWNoICE9PSAxKSB7XG4gICAgICAgICAgICBldmVudFR5cGUgPSBJTlBVVF9FTkQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtb3VzZSBtdXN0IGJlIGRvd25cbiAgICAgICAgaWYgKCF0aGlzLnByZXNzZWQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc3NlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIGV2ZW50VHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IFtldl0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9NT1VTRSxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxudmFyIFBPSU5URVJfSU5QVVRfTUFQID0ge1xuICAgIHBvaW50ZXJkb3duOiBJTlBVVF9TVEFSVCxcbiAgICBwb2ludGVybW92ZTogSU5QVVRfTU9WRSxcbiAgICBwb2ludGVydXA6IElOUFVUX0VORCxcbiAgICBwb2ludGVyY2FuY2VsOiBJTlBVVF9DQU5DRUwsXG4gICAgcG9pbnRlcm91dDogSU5QVVRfQ0FOQ0VMXG59O1xuXG4vLyBpbiBJRTEwIHRoZSBwb2ludGVyIHR5cGVzIGlzIGRlZmluZWQgYXMgYW4gZW51bVxudmFyIElFMTBfUE9JTlRFUl9UWVBFX0VOVU0gPSB7XG4gICAgMjogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAzOiBJTlBVVF9UWVBFX1BFTixcbiAgICA0OiBJTlBVVF9UWVBFX01PVVNFLFxuICAgIDU6IElOUFVUX1RZUEVfS0lORUNUIC8vIHNlZSBodHRwczovL3R3aXR0ZXIuY29tL2phY29icm9zc2kvc3RhdHVzLzQ4MDU5NjQzODQ4OTg5MDgxNlxufTtcblxudmFyIFBPSU5URVJfRUxFTUVOVF9FVkVOVFMgPSAncG9pbnRlcmRvd24nO1xudmFyIFBPSU5URVJfV0lORE9XX0VWRU5UUyA9ICdwb2ludGVybW92ZSBwb2ludGVydXAgcG9pbnRlcmNhbmNlbCc7XG5cbi8vIElFMTAgaGFzIHByZWZpeGVkIHN1cHBvcnQsIGFuZCBjYXNlLXNlbnNpdGl2ZVxuaWYgKHdpbmRvdy5NU1BvaW50ZXJFdmVudCAmJiAhd2luZG93LlBvaW50ZXJFdmVudCkge1xuICAgIFBPSU5URVJfRUxFTUVOVF9FVkVOVFMgPSAnTVNQb2ludGVyRG93bic7XG4gICAgUE9JTlRFUl9XSU5ET1dfRVZFTlRTID0gJ01TUG9pbnRlck1vdmUgTVNQb2ludGVyVXAgTVNQb2ludGVyQ2FuY2VsJztcbn1cblxuLyoqXG4gKiBQb2ludGVyIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBQb2ludGVyRXZlbnRJbnB1dCgpIHtcbiAgICB0aGlzLmV2RWwgPSBQT0lOVEVSX0VMRU1FTlRfRVZFTlRTO1xuICAgIHRoaXMuZXZXaW4gPSBQT0lOVEVSX1dJTkRPV19FVkVOVFM7XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgdGhpcy5zdG9yZSA9ICh0aGlzLm1hbmFnZXIuc2Vzc2lvbi5wb2ludGVyRXZlbnRzID0gW10pO1xufVxuXG5pbmhlcml0KFBvaW50ZXJFdmVudElucHV0LCBJbnB1dCwge1xuICAgIC8qKlxuICAgICAqIGhhbmRsZSBtb3VzZSBldmVudHNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZXZcbiAgICAgKi9cbiAgICBoYW5kbGVyOiBmdW5jdGlvbiBQRWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHN0b3JlID0gdGhpcy5zdG9yZTtcbiAgICAgICAgdmFyIHJlbW92ZVBvaW50ZXIgPSBmYWxzZTtcblxuICAgICAgICB2YXIgZXZlbnRUeXBlTm9ybWFsaXplZCA9IGV2LnR5cGUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCdtcycsICcnKTtcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IFBPSU5URVJfSU5QVVRfTUFQW2V2ZW50VHlwZU5vcm1hbGl6ZWRdO1xuICAgICAgICB2YXIgcG9pbnRlclR5cGUgPSBJRTEwX1BPSU5URVJfVFlQRV9FTlVNW2V2LnBvaW50ZXJUeXBlXSB8fCBldi5wb2ludGVyVHlwZTtcblxuICAgICAgICB2YXIgaXNUb3VjaCA9IChwb2ludGVyVHlwZSA9PSBJTlBVVF9UWVBFX1RPVUNIKTtcblxuICAgICAgICAvLyBnZXQgaW5kZXggb2YgdGhlIGV2ZW50IGluIHRoZSBzdG9yZVxuICAgICAgICB2YXIgc3RvcmVJbmRleCA9IGluQXJyYXkoc3RvcmUsIGV2LnBvaW50ZXJJZCwgJ3BvaW50ZXJJZCcpO1xuXG4gICAgICAgIC8vIHN0YXJ0IGFuZCBtb3VzZSBtdXN0IGJlIGRvd25cbiAgICAgICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUICYmIChldi5idXR0b24gPT09IDAgfHwgaXNUb3VjaCkpIHtcbiAgICAgICAgICAgIGlmIChzdG9yZUluZGV4IDwgMCkge1xuICAgICAgICAgICAgICAgIHN0b3JlLnB1c2goZXYpO1xuICAgICAgICAgICAgICAgIHN0b3JlSW5kZXggPSBzdG9yZS5sZW5ndGggLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpKSB7XG4gICAgICAgICAgICByZW1vdmVQb2ludGVyID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGl0IG5vdCBmb3VuZCwgc28gdGhlIHBvaW50ZXIgaGFzbid0IGJlZW4gZG93biAoc28gaXQncyBwcm9iYWJseSBhIGhvdmVyKVxuICAgICAgICBpZiAoc3RvcmVJbmRleCA8IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZXZlbnQgaW4gdGhlIHN0b3JlXG4gICAgICAgIHN0b3JlW3N0b3JlSW5kZXhdID0gZXY7XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIGV2ZW50VHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHN0b3JlLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiBbZXZdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IHBvaW50ZXJUeXBlLFxuICAgICAgICAgICAgc3JjRXZlbnQ6IGV2XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChyZW1vdmVQb2ludGVyKSB7XG4gICAgICAgICAgICAvLyByZW1vdmUgZnJvbSB0aGUgc3RvcmVcbiAgICAgICAgICAgIHN0b3JlLnNwbGljZShzdG9yZUluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG52YXIgU0lOR0xFX1RPVUNIX0lOUFVUX01BUCA9IHtcbiAgICB0b3VjaHN0YXJ0OiBJTlBVVF9TVEFSVCxcbiAgICB0b3VjaG1vdmU6IElOUFVUX01PVkUsXG4gICAgdG91Y2hlbmQ6IElOUFVUX0VORCxcbiAgICB0b3VjaGNhbmNlbDogSU5QVVRfQ0FOQ0VMXG59O1xuXG52YXIgU0lOR0xFX1RPVUNIX1RBUkdFVF9FVkVOVFMgPSAndG91Y2hzdGFydCc7XG52YXIgU0lOR0xFX1RPVUNIX1dJTkRPV19FVkVOVFMgPSAndG91Y2hzdGFydCB0b3VjaG1vdmUgdG91Y2hlbmQgdG91Y2hjYW5jZWwnO1xuXG4vKipcbiAqIFRvdWNoIGV2ZW50cyBpbnB1dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5mdW5jdGlvbiBTaW5nbGVUb3VjaElucHV0KCkge1xuICAgIHRoaXMuZXZUYXJnZXQgPSBTSU5HTEVfVE9VQ0hfVEFSR0VUX0VWRU5UUztcbiAgICB0aGlzLmV2V2luID0gU0lOR0xFX1RPVUNIX1dJTkRPV19FVkVOVFM7XG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG5cbiAgICBJbnB1dC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFNpbmdsZVRvdWNoSW5wdXQsIElucHV0LCB7XG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVEVoYW5kbGVyKGV2KSB7XG4gICAgICAgIHZhciB0eXBlID0gU0lOR0xFX1RPVUNIX0lOUFVUX01BUFtldi50eXBlXTtcblxuICAgICAgICAvLyBzaG91bGQgd2UgaGFuZGxlIHRoZSB0b3VjaCBldmVudHM/XG4gICAgICAgIGlmICh0eXBlID09PSBJTlBVVF9TVEFSVCkge1xuICAgICAgICAgICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG91Y2hlcyA9IG5vcm1hbGl6ZVNpbmdsZVRvdWNoZXMuY2FsbCh0aGlzLCBldiwgdHlwZSk7XG5cbiAgICAgICAgLy8gd2hlbiBkb25lLCByZXNldCB0aGUgc3RhcnRlZCBzdGF0ZVxuICAgICAgICBpZiAodHlwZSAmIChJTlBVVF9FTkQgfCBJTlBVVF9DQU5DRUwpICYmIHRvdWNoZXNbMF0ubGVuZ3RoIC0gdG91Y2hlc1sxXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1hbmFnZXIsIHR5cGUsIHtcbiAgICAgICAgICAgIHBvaW50ZXJzOiB0b3VjaGVzWzBdLFxuICAgICAgICAgICAgY2hhbmdlZFBvaW50ZXJzOiB0b3VjaGVzWzFdLFxuICAgICAgICAgICAgcG9pbnRlclR5cGU6IElOUFVUX1RZUEVfVE9VQ0gsXG4gICAgICAgICAgICBzcmNFdmVudDogZXZcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogQHRoaXMge1RvdWNoSW5wdXR9XG4gKiBAcGFyYW0ge09iamVjdH0gZXZcbiAqIEBwYXJhbSB7TnVtYmVyfSB0eXBlIGZsYWdcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR8QXJyYXl9IFthbGwsIGNoYW5nZWRdXG4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNpbmdsZVRvdWNoZXMoZXYsIHR5cGUpIHtcbiAgICB2YXIgYWxsID0gdG9BcnJheShldi50b3VjaGVzKTtcbiAgICB2YXIgY2hhbmdlZCA9IHRvQXJyYXkoZXYuY2hhbmdlZFRvdWNoZXMpO1xuXG4gICAgaWYgKHR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSkge1xuICAgICAgICBhbGwgPSB1bmlxdWVBcnJheShhbGwuY29uY2F0KGNoYW5nZWQpLCAnaWRlbnRpZmllcicsIHRydWUpO1xuICAgIH1cblxuICAgIHJldHVybiBbYWxsLCBjaGFuZ2VkXTtcbn1cblxudmFyIFRPVUNIX0lOUFVUX01BUCA9IHtcbiAgICB0b3VjaHN0YXJ0OiBJTlBVVF9TVEFSVCxcbiAgICB0b3VjaG1vdmU6IElOUFVUX01PVkUsXG4gICAgdG91Y2hlbmQ6IElOUFVUX0VORCxcbiAgICB0b3VjaGNhbmNlbDogSU5QVVRfQ0FOQ0VMXG59O1xuXG52YXIgVE9VQ0hfVEFSR0VUX0VWRU5UUyA9ICd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCc7XG5cbi8qKlxuICogTXVsdGktdXNlciB0b3VjaCBldmVudHMgaW5wdXRcbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgSW5wdXRcbiAqL1xuZnVuY3Rpb24gVG91Y2hJbnB1dCgpIHtcbiAgICB0aGlzLmV2VGFyZ2V0ID0gVE9VQ0hfVEFSR0VUX0VWRU5UUztcbiAgICB0aGlzLnRhcmdldElkcyA9IHt9O1xuXG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChUb3VjaElucHV0LCBJbnB1dCwge1xuICAgIGhhbmRsZXI6IGZ1bmN0aW9uIE1URWhhbmRsZXIoZXYpIHtcbiAgICAgICAgdmFyIHR5cGUgPSBUT1VDSF9JTlBVVF9NQVBbZXYudHlwZV07XG4gICAgICAgIHZhciB0b3VjaGVzID0gZ2V0VG91Y2hlcy5jYWxsKHRoaXMsIGV2LCB0eXBlKTtcbiAgICAgICAgaWYgKCF0b3VjaGVzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKHRoaXMubWFuYWdlciwgdHlwZSwge1xuICAgICAgICAgICAgcG9pbnRlcnM6IHRvdWNoZXNbMF0sXG4gICAgICAgICAgICBjaGFuZ2VkUG9pbnRlcnM6IHRvdWNoZXNbMV0sXG4gICAgICAgICAgICBwb2ludGVyVHlwZTogSU5QVVRfVFlQRV9UT1VDSCxcbiAgICAgICAgICAgIHNyY0V2ZW50OiBldlxuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBAdGhpcyB7VG91Y2hJbnB1dH1cbiAqIEBwYXJhbSB7T2JqZWN0fSBldlxuICogQHBhcmFtIHtOdW1iZXJ9IHR5cGUgZmxhZ1xuICogQHJldHVybnMge3VuZGVmaW5lZHxBcnJheX0gW2FsbCwgY2hhbmdlZF1cbiAqL1xuZnVuY3Rpb24gZ2V0VG91Y2hlcyhldiwgdHlwZSkge1xuICAgIHZhciBhbGxUb3VjaGVzID0gdG9BcnJheShldi50b3VjaGVzKTtcbiAgICB2YXIgdGFyZ2V0SWRzID0gdGhpcy50YXJnZXRJZHM7XG5cbiAgICAvLyB3aGVuIHRoZXJlIGlzIG9ubHkgb25lIHRvdWNoLCB0aGUgcHJvY2VzcyBjYW4gYmUgc2ltcGxpZmllZFxuICAgIGlmICh0eXBlICYgKElOUFVUX1NUQVJUIHwgSU5QVVRfTU9WRSkgJiYgYWxsVG91Y2hlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGFyZ2V0SWRzW2FsbFRvdWNoZXNbMF0uaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gW2FsbFRvdWNoZXMsIGFsbFRvdWNoZXNdO1xuICAgIH1cblxuICAgIHZhciBpLFxuICAgICAgICB0YXJnZXRUb3VjaGVzLFxuICAgICAgICBjaGFuZ2VkVG91Y2hlcyA9IHRvQXJyYXkoZXYuY2hhbmdlZFRvdWNoZXMpLFxuICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlcyA9IFtdLFxuICAgICAgICB0YXJnZXQgPSB0aGlzLnRhcmdldDtcblxuICAgIC8vIGdldCB0YXJnZXQgdG91Y2hlcyBmcm9tIHRvdWNoZXNcbiAgICB0YXJnZXRUb3VjaGVzID0gYWxsVG91Y2hlcy5maWx0ZXIoZnVuY3Rpb24odG91Y2gpIHtcbiAgICAgICAgcmV0dXJuIGhhc1BhcmVudCh0b3VjaC50YXJnZXQsIHRhcmdldCk7XG4gICAgfSk7XG5cbiAgICAvLyBjb2xsZWN0IHRvdWNoZXNcbiAgICBpZiAodHlwZSA9PT0gSU5QVVRfU1RBUlQpIHtcbiAgICAgICAgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGFyZ2V0VG91Y2hlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhcmdldElkc1t0YXJnZXRUb3VjaGVzW2ldLmlkZW50aWZpZXJdID0gdHJ1ZTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIGZpbHRlciBjaGFuZ2VkIHRvdWNoZXMgdG8gb25seSBjb250YWluIHRvdWNoZXMgdGhhdCBleGlzdCBpbiB0aGUgY29sbGVjdGVkIHRhcmdldCBpZHNcbiAgICBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGNoYW5nZWRUb3VjaGVzLmxlbmd0aCkge1xuICAgICAgICBpZiAodGFyZ2V0SWRzW2NoYW5nZWRUb3VjaGVzW2ldLmlkZW50aWZpZXJdKSB7XG4gICAgICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlcy5wdXNoKGNoYW5nZWRUb3VjaGVzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFudXAgcmVtb3ZlZCB0b3VjaGVzXG4gICAgICAgIGlmICh0eXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0YXJnZXRJZHNbY2hhbmdlZFRvdWNoZXNbaV0uaWRlbnRpZmllcl07XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgIH1cblxuICAgIGlmICghY2hhbmdlZFRhcmdldFRvdWNoZXMubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gW1xuICAgICAgICAvLyBtZXJnZSB0YXJnZXRUb3VjaGVzIHdpdGggY2hhbmdlZFRhcmdldFRvdWNoZXMgc28gaXQgY29udGFpbnMgQUxMIHRvdWNoZXMsIGluY2x1ZGluZyAnZW5kJyBhbmQgJ2NhbmNlbCdcbiAgICAgICAgdW5pcXVlQXJyYXkodGFyZ2V0VG91Y2hlcy5jb25jYXQoY2hhbmdlZFRhcmdldFRvdWNoZXMpLCAnaWRlbnRpZmllcicsIHRydWUpLFxuICAgICAgICBjaGFuZ2VkVGFyZ2V0VG91Y2hlc1xuICAgIF07XG59XG5cbi8qKlxuICogQ29tYmluZWQgdG91Y2ggYW5kIG1vdXNlIGlucHV0XG4gKlxuICogVG91Y2ggaGFzIGEgaGlnaGVyIHByaW9yaXR5IHRoZW4gbW91c2UsIGFuZCB3aGlsZSB0b3VjaGluZyBubyBtb3VzZSBldmVudHMgYXJlIGFsbG93ZWQuXG4gKiBUaGlzIGJlY2F1c2UgdG91Y2ggZGV2aWNlcyBhbHNvIGVtaXQgbW91c2UgZXZlbnRzIHdoaWxlIGRvaW5nIGEgdG91Y2guXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBJbnB1dFxuICovXG5cbnZhciBERURVUF9USU1FT1VUID0gMjUwMDtcbnZhciBERURVUF9ESVNUQU5DRSA9IDI1O1xuXG5mdW5jdGlvbiBUb3VjaE1vdXNlSW5wdXQoKSB7XG4gICAgSW5wdXQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHZhciBoYW5kbGVyID0gYmluZEZuKHRoaXMuaGFuZGxlciwgdGhpcyk7XG4gICAgdGhpcy50b3VjaCA9IG5ldyBUb3VjaElucHV0KHRoaXMubWFuYWdlciwgaGFuZGxlcik7XG4gICAgdGhpcy5tb3VzZSA9IG5ldyBNb3VzZUlucHV0KHRoaXMubWFuYWdlciwgaGFuZGxlcik7XG5cbiAgICB0aGlzLnByaW1hcnlUb3VjaCA9IG51bGw7XG4gICAgdGhpcy5sYXN0VG91Y2hlcyA9IFtdO1xufVxuXG5pbmhlcml0KFRvdWNoTW91c2VJbnB1dCwgSW5wdXQsIHtcbiAgICAvKipcbiAgICAgKiBoYW5kbGUgbW91c2UgYW5kIHRvdWNoIGV2ZW50c1xuICAgICAqIEBwYXJhbSB7SGFtbWVyfSBtYW5hZ2VyXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGlucHV0RXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXREYXRhXG4gICAgICovXG4gICAgaGFuZGxlcjogZnVuY3Rpb24gVE1FaGFuZGxlcihtYW5hZ2VyLCBpbnB1dEV2ZW50LCBpbnB1dERhdGEpIHtcbiAgICAgICAgdmFyIGlzVG91Y2ggPSAoaW5wdXREYXRhLnBvaW50ZXJUeXBlID09IElOUFVUX1RZUEVfVE9VQ0gpLFxuICAgICAgICAgICAgaXNNb3VzZSA9IChpbnB1dERhdGEucG9pbnRlclR5cGUgPT0gSU5QVVRfVFlQRV9NT1VTRSk7XG5cbiAgICAgICAgaWYgKGlzTW91c2UgJiYgaW5wdXREYXRhLnNvdXJjZUNhcGFiaWxpdGllcyAmJiBpbnB1dERhdGEuc291cmNlQ2FwYWJpbGl0aWVzLmZpcmVzVG91Y2hFdmVudHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdoZW4gd2UncmUgaW4gYSB0b3VjaCBldmVudCwgcmVjb3JkIHRvdWNoZXMgdG8gIGRlLWR1cGUgc3ludGhldGljIG1vdXNlIGV2ZW50XG4gICAgICAgIGlmIChpc1RvdWNoKSB7XG4gICAgICAgICAgICByZWNvcmRUb3VjaGVzLmNhbGwodGhpcywgaW5wdXRFdmVudCwgaW5wdXREYXRhKTtcbiAgICAgICAgfSBlbHNlIGlmIChpc01vdXNlICYmIGlzU3ludGhldGljRXZlbnQuY2FsbCh0aGlzLCBpbnB1dERhdGEpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNhbGxiYWNrKG1hbmFnZXIsIGlucHV0RXZlbnQsIGlucHV0RGF0YSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVuZXJzXG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24gZGVzdHJveSgpIHtcbiAgICAgICAgdGhpcy50b3VjaC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMubW91c2UuZGVzdHJveSgpO1xuICAgIH1cbn0pO1xuXG5mdW5jdGlvbiByZWNvcmRUb3VjaGVzKGV2ZW50VHlwZSwgZXZlbnREYXRhKSB7XG4gICAgaWYgKGV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSB7XG4gICAgICAgIHRoaXMucHJpbWFyeVRvdWNoID0gZXZlbnREYXRhLmNoYW5nZWRQb2ludGVyc1swXS5pZGVudGlmaWVyO1xuICAgICAgICBzZXRMYXN0VG91Y2guY2FsbCh0aGlzLCBldmVudERhdGEpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnRUeXBlICYgKElOUFVUX0VORCB8IElOUFVUX0NBTkNFTCkpIHtcbiAgICAgICAgc2V0TGFzdFRvdWNoLmNhbGwodGhpcywgZXZlbnREYXRhKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNldExhc3RUb3VjaChldmVudERhdGEpIHtcbiAgICB2YXIgdG91Y2ggPSBldmVudERhdGEuY2hhbmdlZFBvaW50ZXJzWzBdO1xuXG4gICAgaWYgKHRvdWNoLmlkZW50aWZpZXIgPT09IHRoaXMucHJpbWFyeVRvdWNoKSB7XG4gICAgICAgIHZhciBsYXN0VG91Y2ggPSB7eDogdG91Y2guY2xpZW50WCwgeTogdG91Y2guY2xpZW50WX07XG4gICAgICAgIHRoaXMubGFzdFRvdWNoZXMucHVzaChsYXN0VG91Y2gpO1xuICAgICAgICB2YXIgbHRzID0gdGhpcy5sYXN0VG91Y2hlcztcbiAgICAgICAgdmFyIHJlbW92ZUxhc3RUb3VjaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGkgPSBsdHMuaW5kZXhPZihsYXN0VG91Y2gpO1xuICAgICAgICAgICAgaWYgKGkgPiAtMSkge1xuICAgICAgICAgICAgICAgIGx0cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNldFRpbWVvdXQocmVtb3ZlTGFzdFRvdWNoLCBERURVUF9USU1FT1VUKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzU3ludGhldGljRXZlbnQoZXZlbnREYXRhKSB7XG4gICAgdmFyIHggPSBldmVudERhdGEuc3JjRXZlbnQuY2xpZW50WCwgeSA9IGV2ZW50RGF0YS5zcmNFdmVudC5jbGllbnRZO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXN0VG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgdCA9IHRoaXMubGFzdFRvdWNoZXNbaV07XG4gICAgICAgIHZhciBkeCA9IE1hdGguYWJzKHggLSB0LngpLCBkeSA9IE1hdGguYWJzKHkgLSB0LnkpO1xuICAgICAgICBpZiAoZHggPD0gREVEVVBfRElTVEFOQ0UgJiYgZHkgPD0gREVEVVBfRElTVEFOQ0UpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn1cblxudmFyIFBSRUZJWEVEX1RPVUNIX0FDVElPTiA9IHByZWZpeGVkKFRFU1RfRUxFTUVOVC5zdHlsZSwgJ3RvdWNoQWN0aW9uJyk7XG52YXIgTkFUSVZFX1RPVUNIX0FDVElPTiA9IFBSRUZJWEVEX1RPVUNIX0FDVElPTiAhPT0gdW5kZWZpbmVkO1xuXG4vLyBtYWdpY2FsIHRvdWNoQWN0aW9uIHZhbHVlXG52YXIgVE9VQ0hfQUNUSU9OX0NPTVBVVEUgPSAnY29tcHV0ZSc7XG52YXIgVE9VQ0hfQUNUSU9OX0FVVE8gPSAnYXV0byc7XG52YXIgVE9VQ0hfQUNUSU9OX01BTklQVUxBVElPTiA9ICdtYW5pcHVsYXRpb24nOyAvLyBub3QgaW1wbGVtZW50ZWRcbnZhciBUT1VDSF9BQ1RJT05fTk9ORSA9ICdub25lJztcbnZhciBUT1VDSF9BQ1RJT05fUEFOX1ggPSAncGFuLXgnO1xudmFyIFRPVUNIX0FDVElPTl9QQU5fWSA9ICdwYW4teSc7XG52YXIgVE9VQ0hfQUNUSU9OX01BUCA9IGdldFRvdWNoQWN0aW9uUHJvcHMoKTtcblxuLyoqXG4gKiBUb3VjaCBBY3Rpb25cbiAqIHNldHMgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5IG9yIHVzZXMgdGhlIGpzIGFsdGVybmF0aXZlXG4gKiBAcGFyYW0ge01hbmFnZXJ9IG1hbmFnZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFRvdWNoQWN0aW9uKG1hbmFnZXIsIHZhbHVlKSB7XG4gICAgdGhpcy5tYW5hZ2VyID0gbWFuYWdlcjtcbiAgICB0aGlzLnNldCh2YWx1ZSk7XG59XG5cblRvdWNoQWN0aW9uLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBzZXQgdGhlIHRvdWNoQWN0aW9uIHZhbHVlIG9uIHRoZSBlbGVtZW50IG9yIGVuYWJsZSB0aGUgcG9seWZpbGxcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIC8vIGZpbmQgb3V0IHRoZSB0b3VjaC1hY3Rpb24gYnkgdGhlIGV2ZW50IGhhbmRsZXJzXG4gICAgICAgIGlmICh2YWx1ZSA9PSBUT1VDSF9BQ1RJT05fQ09NUFVURSkge1xuICAgICAgICAgICAgdmFsdWUgPSB0aGlzLmNvbXB1dGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChOQVRJVkVfVE9VQ0hfQUNUSU9OICYmIHRoaXMubWFuYWdlci5lbGVtZW50LnN0eWxlICYmIFRPVUNIX0FDVElPTl9NQVBbdmFsdWVdKSB7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZWxlbWVudC5zdHlsZVtQUkVGSVhFRF9UT1VDSF9BQ1RJT05dID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hY3Rpb25zID0gdmFsdWUudG9Mb3dlckNhc2UoKS50cmltKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGp1c3QgcmUtc2V0IHRoZSB0b3VjaEFjdGlvbiB2YWx1ZVxuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuc2V0KHRoaXMubWFuYWdlci5vcHRpb25zLnRvdWNoQWN0aW9uKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogY29tcHV0ZSB0aGUgdmFsdWUgZm9yIHRoZSB0b3VjaEFjdGlvbiBwcm9wZXJ0eSBiYXNlZCBvbiB0aGUgcmVjb2duaXplcidzIHNldHRpbmdzXG4gICAgICogQHJldHVybnMge1N0cmluZ30gdmFsdWVcbiAgICAgKi9cbiAgICBjb21wdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGFjdGlvbnMgPSBbXTtcbiAgICAgICAgZWFjaCh0aGlzLm1hbmFnZXIucmVjb2duaXplcnMsIGZ1bmN0aW9uKHJlY29nbml6ZXIpIHtcbiAgICAgICAgICAgIGlmIChib29sT3JGbihyZWNvZ25pemVyLm9wdGlvbnMuZW5hYmxlLCBbcmVjb2duaXplcl0pKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IGFjdGlvbnMuY29uY2F0KHJlY29nbml6ZXIuZ2V0VG91Y2hBY3Rpb24oKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucy5qb2luKCcgJykpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgb24gZWFjaCBpbnB1dCBjeWNsZSBhbmQgcHJvdmlkZXMgdGhlIHByZXZlbnRpbmcgb2YgdGhlIGJyb3dzZXIgYmVoYXZpb3JcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBwcmV2ZW50RGVmYXVsdHM6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzcmNFdmVudCA9IGlucHV0LnNyY0V2ZW50O1xuICAgICAgICB2YXIgZGlyZWN0aW9uID0gaW5wdXQub2Zmc2V0RGlyZWN0aW9uO1xuXG4gICAgICAgIC8vIGlmIHRoZSB0b3VjaCBhY3Rpb24gZGlkIHByZXZlbnRlZCBvbmNlIHRoaXMgc2Vzc2lvblxuICAgICAgICBpZiAodGhpcy5tYW5hZ2VyLnNlc3Npb24ucHJldmVudGVkKSB7XG4gICAgICAgICAgICBzcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XG4gICAgICAgIHZhciBoYXNOb25lID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpICYmICFUT1VDSF9BQ1RJT05fTUFQW1RPVUNIX0FDVElPTl9OT05FXTtcbiAgICAgICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpICYmICFUT1VDSF9BQ1RJT05fTUFQW1RPVUNIX0FDVElPTl9QQU5fWV07XG4gICAgICAgIHZhciBoYXNQYW5YID0gaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX1BBTl9YKSAmJiAhVE9VQ0hfQUNUSU9OX01BUFtUT1VDSF9BQ1RJT05fUEFOX1hdO1xuXG4gICAgICAgIGlmIChoYXNOb25lKSB7XG4gICAgICAgICAgICAvL2RvIG5vdCBwcmV2ZW50IGRlZmF1bHRzIGlmIHRoaXMgaXMgYSB0YXAgZ2VzdHVyZVxuXG4gICAgICAgICAgICB2YXIgaXNUYXBQb2ludGVyID0gaW5wdXQucG9pbnRlcnMubGVuZ3RoID09PSAxO1xuICAgICAgICAgICAgdmFyIGlzVGFwTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IDI7XG4gICAgICAgICAgICB2YXIgaXNUYXBUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCAyNTA7XG5cbiAgICAgICAgICAgIGlmIChpc1RhcFBvaW50ZXIgJiYgaXNUYXBNb3ZlbWVudCAmJiBpc1RhcFRvdWNoVGltZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNQYW5YICYmIGhhc1BhblkpIHtcbiAgICAgICAgICAgIC8vIGBwYW4teCBwYW4teWAgbWVhbnMgYnJvd3NlciBoYW5kbGVzIGFsbCBzY3JvbGxpbmcvcGFubmluZywgZG8gbm90IHByZXZlbnRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChoYXNOb25lIHx8XG4gICAgICAgICAgICAoaGFzUGFuWSAmJiBkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkgfHxcbiAgICAgICAgICAgIChoYXNQYW5YICYmIGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnByZXZlbnRTcmMoc3JjRXZlbnQpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGNhbGwgcHJldmVudERlZmF1bHQgdG8gcHJldmVudCB0aGUgYnJvd3NlcidzIGRlZmF1bHQgYmVoYXZpb3IgKHNjcm9sbGluZyBpbiBtb3N0IGNhc2VzKVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBzcmNFdmVudFxuICAgICAqL1xuICAgIHByZXZlbnRTcmM6IGZ1bmN0aW9uKHNyY0V2ZW50KSB7XG4gICAgICAgIHRoaXMubWFuYWdlci5zZXNzaW9uLnByZXZlbnRlZCA9IHRydWU7XG4gICAgICAgIHNyY0V2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxufTtcblxuLyoqXG4gKiB3aGVuIHRoZSB0b3VjaEFjdGlvbnMgYXJlIGNvbGxlY3RlZCB0aGV5IGFyZSBub3QgYSB2YWxpZCB2YWx1ZSwgc28gd2UgbmVlZCB0byBjbGVhbiB0aGluZ3MgdXAuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhY3Rpb25zXG4gKiBAcmV0dXJucyB7Kn1cbiAqL1xuZnVuY3Rpb24gY2xlYW5Ub3VjaEFjdGlvbnMoYWN0aW9ucykge1xuICAgIC8vIG5vbmVcbiAgICBpZiAoaW5TdHIoYWN0aW9ucywgVE9VQ0hfQUNUSU9OX05PTkUpKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICB2YXIgaGFzUGFuWCA9IGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgdmFyIGhhc1BhblkgPSBpblN0cihhY3Rpb25zLCBUT1VDSF9BQ1RJT05fUEFOX1kpO1xuXG4gICAgLy8gaWYgYm90aCBwYW4teCBhbmQgcGFuLXkgYXJlIHNldCAoZGlmZmVyZW50IHJlY29nbml6ZXJzXG4gICAgLy8gZm9yIGRpZmZlcmVudCBkaXJlY3Rpb25zLCBlLmcuIGhvcml6b250YWwgcGFuIGJ1dCB2ZXJ0aWNhbCBzd2lwZT8pXG4gICAgLy8gd2UgbmVlZCBub25lIChhcyBvdGhlcndpc2Ugd2l0aCBwYW4teCBwYW4teSBjb21iaW5lZCBub25lIG9mIHRoZXNlXG4gICAgLy8gcmVjb2duaXplcnMgd2lsbCB3b3JrLCBzaW5jZSB0aGUgYnJvd3NlciB3b3VsZCBoYW5kbGUgYWxsIHBhbm5pbmdcbiAgICBpZiAoaGFzUGFuWCAmJiBoYXNQYW5ZKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTk9ORTtcbiAgICB9XG5cbiAgICAvLyBwYW4teCBPUiBwYW4teVxuICAgIGlmIChoYXNQYW5YIHx8IGhhc1BhblkpIHtcbiAgICAgICAgcmV0dXJuIGhhc1BhblggPyBUT1VDSF9BQ1RJT05fUEFOX1ggOiBUT1VDSF9BQ1RJT05fUEFOX1k7XG4gICAgfVxuXG4gICAgLy8gbWFuaXB1bGF0aW9uXG4gICAgaWYgKGluU3RyKGFjdGlvbnMsIFRPVUNIX0FDVElPTl9NQU5JUFVMQVRJT04pKSB7XG4gICAgICAgIHJldHVybiBUT1VDSF9BQ1RJT05fTUFOSVBVTEFUSU9OO1xuICAgIH1cblxuICAgIHJldHVybiBUT1VDSF9BQ1RJT05fQVVUTztcbn1cblxuZnVuY3Rpb24gZ2V0VG91Y2hBY3Rpb25Qcm9wcygpIHtcbiAgICBpZiAoIU5BVElWRV9UT1VDSF9BQ1RJT04pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgdG91Y2hNYXAgPSB7fTtcbiAgICB2YXIgY3NzU3VwcG9ydHMgPSB3aW5kb3cuQ1NTICYmIHdpbmRvdy5DU1Muc3VwcG9ydHM7XG4gICAgWydhdXRvJywgJ21hbmlwdWxhdGlvbicsICdwYW4teScsICdwYW4teCcsICdwYW4teCBwYW4teScsICdub25lJ10uZm9yRWFjaChmdW5jdGlvbih2YWwpIHtcblxuICAgICAgICAvLyBJZiBjc3Muc3VwcG9ydHMgaXMgbm90IHN1cHBvcnRlZCBidXQgdGhlcmUgaXMgbmF0aXZlIHRvdWNoLWFjdGlvbiBhc3N1bWUgaXQgc3VwcG9ydHNcbiAgICAgICAgLy8gYWxsIHZhbHVlcy4gVGhpcyBpcyB0aGUgY2FzZSBmb3IgSUUgMTAgYW5kIDExLlxuICAgICAgICB0b3VjaE1hcFt2YWxdID0gY3NzU3VwcG9ydHMgPyB3aW5kb3cuQ1NTLnN1cHBvcnRzKCd0b3VjaC1hY3Rpb24nLCB2YWwpIDogdHJ1ZTtcbiAgICB9KTtcbiAgICByZXR1cm4gdG91Y2hNYXA7XG59XG5cbi8qKlxuICogUmVjb2duaXplciBmbG93IGV4cGxhaW5lZDsgKlxuICogQWxsIHJlY29nbml6ZXJzIGhhdmUgdGhlIGluaXRpYWwgc3RhdGUgb2YgUE9TU0lCTEUgd2hlbiBhIGlucHV0IHNlc3Npb24gc3RhcnRzLlxuICogVGhlIGRlZmluaXRpb24gb2YgYSBpbnB1dCBzZXNzaW9uIGlzIGZyb20gdGhlIGZpcnN0IGlucHV0IHVudGlsIHRoZSBsYXN0IGlucHV0LCB3aXRoIGFsbCBpdCdzIG1vdmVtZW50IGluIGl0LiAqXG4gKiBFeGFtcGxlIHNlc3Npb24gZm9yIG1vdXNlLWlucHV0OiBtb3VzZWRvd24gLT4gbW91c2Vtb3ZlIC0+IG1vdXNldXBcbiAqXG4gKiBPbiBlYWNoIHJlY29nbml6aW5nIGN5Y2xlIChzZWUgTWFuYWdlci5yZWNvZ25pemUpIHRoZSAucmVjb2duaXplKCkgbWV0aG9kIGlzIGV4ZWN1dGVkXG4gKiB3aGljaCBkZXRlcm1pbmVzIHdpdGggc3RhdGUgaXQgc2hvdWxkIGJlLlxuICpcbiAqIElmIHRoZSByZWNvZ25pemVyIGhhcyB0aGUgc3RhdGUgRkFJTEVELCBDQU5DRUxMRUQgb3IgUkVDT0dOSVpFRCAoZXF1YWxzIEVOREVEKSwgaXQgaXMgcmVzZXQgdG9cbiAqIFBPU1NJQkxFIHRvIGdpdmUgaXQgYW5vdGhlciBjaGFuZ2Ugb24gdGhlIG5leHQgY3ljbGUuXG4gKlxuICogICAgICAgICAgICAgICBQb3NzaWJsZVxuICogICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICstLS0tLSstLS0tLS0tLS0tLS0tLS0rXG4gKiAgICAgICAgICAgIHwgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICstLS0tLSstLS0tLSsgICAgICAgICAgICAgICB8XG4gKiAgICAgIHwgICAgICAgICAgIHwgICAgICAgICAgICAgICB8XG4gKiAgIEZhaWxlZCAgICAgIENhbmNlbGxlZCAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgKy0tLS0tLS0rLS0tLS0tK1xuICogICAgICAgICAgICAgICAgICAgICAgICAgIHwgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgIFJlY29nbml6ZWQgICAgICAgQmVnYW5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2hhbmdlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHxcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVuZGVkL1JlY29nbml6ZWRcbiAqL1xudmFyIFNUQVRFX1BPU1NJQkxFID0gMTtcbnZhciBTVEFURV9CRUdBTiA9IDI7XG52YXIgU1RBVEVfQ0hBTkdFRCA9IDQ7XG52YXIgU1RBVEVfRU5ERUQgPSA4O1xudmFyIFNUQVRFX1JFQ09HTklaRUQgPSBTVEFURV9FTkRFRDtcbnZhciBTVEFURV9DQU5DRUxMRUQgPSAxNjtcbnZhciBTVEFURV9GQUlMRUQgPSAzMjtcblxuLyoqXG4gKiBSZWNvZ25pemVyXG4gKiBFdmVyeSByZWNvZ25pemVyIG5lZWRzIHRvIGV4dGVuZCBmcm9tIHRoaXMgY2xhc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gKi9cbmZ1bmN0aW9uIFJlY29nbml6ZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IGFzc2lnbih7fSwgdGhpcy5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLmlkID0gdW5pcXVlSWQoKTtcblxuICAgIHRoaXMubWFuYWdlciA9IG51bGw7XG5cbiAgICAvLyBkZWZhdWx0IGlzIGVuYWJsZSB0cnVlXG4gICAgdGhpcy5vcHRpb25zLmVuYWJsZSA9IGlmVW5kZWZpbmVkKHRoaXMub3B0aW9ucy5lbmFibGUsIHRydWUpO1xuXG4gICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuXG4gICAgdGhpcy5zaW11bHRhbmVvdXMgPSB7fTtcbiAgICB0aGlzLnJlcXVpcmVGYWlsID0gW107XG59XG5cblJlY29nbml6ZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIEB2aXJ0dWFsXG4gICAgICogQHR5cGUge09iamVjdH1cbiAgICAgKi9cbiAgICBkZWZhdWx0czoge30sXG5cbiAgICAvKipcbiAgICAgKiBzZXQgb3B0aW9uc1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAgICogQHJldHVybiB7UmVjb2duaXplcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gYWxzbyB1cGRhdGUgdGhlIHRvdWNoQWN0aW9uLCBpbiBjYXNlIHNvbWV0aGluZyBjaGFuZ2VkIGFib3V0IHRoZSBkaXJlY3Rpb25zL2VuYWJsZWQgc3RhdGVcbiAgICAgICAgdGhpcy5tYW5hZ2VyICYmIHRoaXMubWFuYWdlci50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyLlxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ3JlY29nbml6ZVdpdGgnLCB0aGlzKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2ltdWx0YW5lb3VzID0gdGhpcy5zaW11bHRhbmVvdXM7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKCFzaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXSkge1xuICAgICAgICAgICAgc2ltdWx0YW5lb3VzW290aGVyUmVjb2duaXplci5pZF0gPSBvdGhlclJlY29nbml6ZXI7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVjb2duaXplV2l0aCh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogZHJvcCB0aGUgc2ltdWx0YW5lb3VzIGxpbmsuIGl0IGRvZXNudCByZW1vdmUgdGhlIGxpbmsgb24gdGhlIG90aGVyIHJlY29nbml6ZXIuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7UmVjb2duaXplcn0gdGhpc1xuICAgICAqL1xuICAgIGRyb3BSZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZWNvZ25pemVXaXRoJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgb3RoZXJSZWNvZ25pemVyID0gZ2V0UmVjb2duaXplckJ5TmFtZUlmTWFuYWdlcihvdGhlclJlY29nbml6ZXIsIHRoaXMpO1xuICAgICAgICBkZWxldGUgdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJlY29nbml6ZXIgY2FuIG9ubHkgcnVuIHdoZW4gYW4gb3RoZXIgaXMgZmFpbGluZ1xuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gb3RoZXJSZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge1JlY29nbml6ZXJ9IHRoaXNcbiAgICAgKi9cbiAgICByZXF1aXJlRmFpbHVyZTogZnVuY3Rpb24ob3RoZXJSZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhvdGhlclJlY29nbml6ZXIsICdyZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciByZXF1aXJlRmFpbCA9IHRoaXMucmVxdWlyZUZhaWw7XG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgaWYgKGluQXJyYXkocmVxdWlyZUZhaWwsIG90aGVyUmVjb2duaXplcikgPT09IC0xKSB7XG4gICAgICAgICAgICByZXF1aXJlRmFpbC5wdXNoKG90aGVyUmVjb2duaXplcik7XG4gICAgICAgICAgICBvdGhlclJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUodGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRyb3AgdGhlIHJlcXVpcmVGYWlsdXJlIGxpbmsuIGl0IGRvZXMgbm90IHJlbW92ZSB0aGUgbGluayBvbiB0aGUgb3RoZXIgcmVjb2duaXplci5cbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ9IG90aGVyUmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfSB0aGlzXG4gICAgICovXG4gICAgZHJvcFJlcXVpcmVGYWlsdXJlOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgaWYgKGludm9rZUFycmF5QXJnKG90aGVyUmVjb2duaXplciwgJ2Ryb3BSZXF1aXJlRmFpbHVyZScsIHRoaXMpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIG90aGVyUmVjb2duaXplciA9IGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCB0aGlzKTtcbiAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheSh0aGlzLnJlcXVpcmVGYWlsLCBvdGhlclJlY29nbml6ZXIpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5yZXF1aXJlRmFpbC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBoYXMgcmVxdWlyZSBmYWlsdXJlcyBib29sZWFuXG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgaGFzUmVxdWlyZUZhaWx1cmVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoID4gMDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogaWYgdGhlIHJlY29nbml6ZXIgY2FuIHJlY29nbml6ZSBzaW11bHRhbmVvdXMgd2l0aCBhbiBvdGhlciByZWNvZ25pemVyXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfSBvdGhlclJlY29nbml6ZXJcbiAgICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5SZWNvZ25pemVXaXRoOiBmdW5jdGlvbihvdGhlclJlY29nbml6ZXIpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zaW11bHRhbmVvdXNbb3RoZXJSZWNvZ25pemVyLmlkXTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogWW91IHNob3VsZCB1c2UgYHRyeUVtaXRgIGluc3RlYWQgb2YgYGVtaXRgIGRpcmVjdGx5IHRvIGNoZWNrXG4gICAgICogdGhhdCBhbGwgdGhlIG5lZWRlZCByZWNvZ25pemVycyBoYXMgZmFpbGVkIGJlZm9yZSBlbWl0dGluZy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gaW5wdXRcbiAgICAgKi9cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG5cbiAgICAgICAgZnVuY3Rpb24gZW1pdChldmVudCkge1xuICAgICAgICAgICAgc2VsZi5tYW5hZ2VyLmVtaXQoZXZlbnQsIGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vICdwYW5zdGFydCcgYW5kICdwYW5tb3ZlJ1xuICAgICAgICBpZiAoc3RhdGUgPCBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQpOyAvLyBzaW1wbGUgJ2V2ZW50TmFtZScgZXZlbnRzXG5cbiAgICAgICAgaWYgKGlucHV0LmFkZGl0aW9uYWxFdmVudCkgeyAvLyBhZGRpdGlvbmFsIGV2ZW50KHBhbmxlZnQsIHBhbnJpZ2h0LCBwaW5jaGluLCBwaW5jaG91dC4uLilcbiAgICAgICAgICAgIGVtaXQoaW5wdXQuYWRkaXRpb25hbEV2ZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHBhbmVuZCBhbmQgcGFuY2FuY2VsXG4gICAgICAgIGlmIChzdGF0ZSA+PSBTVEFURV9FTkRFRCkge1xuICAgICAgICAgICAgZW1pdChzZWxmLm9wdGlvbnMuZXZlbnQgKyBzdGF0ZVN0cihzdGF0ZSkpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENoZWNrIHRoYXQgYWxsIHRoZSByZXF1aXJlIGZhaWx1cmUgcmVjb2duaXplcnMgaGFzIGZhaWxlZCxcbiAgICAgKiBpZiB0cnVlLCBpdCBlbWl0cyBhIGdlc3R1cmUgZXZlbnQsXG4gICAgICogb3RoZXJ3aXNlLCBzZXR1cCB0aGUgc3RhdGUgdG8gRkFJTEVELlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqL1xuICAgIHRyeUVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmICh0aGlzLmNhbkVtaXQoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW1pdChpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaXQncyBmYWlsaW5nIGFueXdheVxuICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBjYW4gd2UgZW1pdD9cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5FbWl0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMucmVxdWlyZUZhaWwubGVuZ3RoKSB7XG4gICAgICAgICAgICBpZiAoISh0aGlzLnJlcXVpcmVGYWlsW2ldLnN0YXRlICYgKFNUQVRFX0ZBSUxFRCB8IFNUQVRFX1BPU1NJQkxFKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHVwZGF0ZSB0aGUgcmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICAvLyBtYWtlIGEgbmV3IGNvcHkgb2YgdGhlIGlucHV0RGF0YVxuICAgICAgICAvLyBzbyB3ZSBjYW4gY2hhbmdlIHRoZSBpbnB1dERhdGEgd2l0aG91dCBtZXNzaW5nIHVwIHRoZSBvdGhlciByZWNvZ25pemVyc1xuICAgICAgICB2YXIgaW5wdXREYXRhQ2xvbmUgPSBhc3NpZ24oe30sIGlucHV0RGF0YSk7XG5cbiAgICAgICAgLy8gaXMgaXMgZW5hYmxlZCBhbmQgYWxsb3cgcmVjb2duaXppbmc/XG4gICAgICAgIGlmICghYm9vbE9yRm4odGhpcy5vcHRpb25zLmVuYWJsZSwgW3RoaXMsIGlucHV0RGF0YUNsb25lXSkpIHtcbiAgICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9GQUlMRUQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXNldCB3aGVuIHdlJ3ZlIHJlYWNoZWQgdGhlIGVuZFxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAmIChTVEFURV9SRUNPR05JWkVEIHwgU1RBVEVfQ0FOQ0VMTEVEIHwgU1RBVEVfRkFJTEVEKSkge1xuICAgICAgICAgICAgdGhpcy5zdGF0ZSA9IFNUQVRFX1BPU1NJQkxFO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0ZSA9IHRoaXMucHJvY2VzcyhpbnB1dERhdGFDbG9uZSk7XG5cbiAgICAgICAgLy8gdGhlIHJlY29nbml6ZXIgaGFzIHJlY29nbml6ZWQgYSBnZXN0dXJlXG4gICAgICAgIC8vIHNvIHRyaWdnZXIgYW4gZXZlbnRcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgJiAoU1RBVEVfQkVHQU4gfCBTVEFURV9DSEFOR0VEIHwgU1RBVEVfRU5ERUQgfCBTVEFURV9DQU5DRUxMRUQpKSB7XG4gICAgICAgICAgICB0aGlzLnRyeUVtaXQoaW5wdXREYXRhQ2xvbmUpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJldHVybiB0aGUgc3RhdGUgb2YgdGhlIHJlY29nbml6ZXJcbiAgICAgKiB0aGUgYWN0dWFsIHJlY29nbml6aW5nIGhhcHBlbnMgaW4gdGhpcyBtZXRob2RcbiAgICAgKiBAdmlydHVhbFxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKiBAcmV0dXJucyB7Q29uc3R9IFNUQVRFXG4gICAgICovXG4gICAgcHJvY2VzczogZnVuY3Rpb24oaW5wdXREYXRhKSB7IH0sIC8vIGpzaGludCBpZ25vcmU6bGluZVxuXG4gICAgLyoqXG4gICAgICogcmV0dXJuIHRoZSBwcmVmZXJyZWQgdG91Y2gtYWN0aW9uXG4gICAgICogQHZpcnR1YWxcbiAgICAgKiBAcmV0dXJucyB7QXJyYXl9XG4gICAgICovXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkgeyB9LFxuXG4gICAgLyoqXG4gICAgICogY2FsbGVkIHdoZW4gdGhlIGdlc3R1cmUgaXNuJ3QgYWxsb3dlZCB0byByZWNvZ25pemVcbiAgICAgKiBsaWtlIHdoZW4gYW5vdGhlciBpcyBiZWluZyByZWNvZ25pemVkIG9yIGl0IGlzIGRpc2FibGVkXG4gICAgICogQHZpcnR1YWxcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24oKSB7IH1cbn07XG5cbi8qKlxuICogZ2V0IGEgdXNhYmxlIHN0cmluZywgdXNlZCBhcyBldmVudCBwb3N0Zml4XG4gKiBAcGFyYW0ge0NvbnN0fSBzdGF0ZVxuICogQHJldHVybnMge1N0cmluZ30gc3RhdGVcbiAqL1xuZnVuY3Rpb24gc3RhdGVTdHIoc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUgJiBTVEFURV9DQU5DRUxMRUQpIHtcbiAgICAgICAgcmV0dXJuICdjYW5jZWwnO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUgJiBTVEFURV9FTkRFRCkge1xuICAgICAgICByZXR1cm4gJ2VuZCc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAmIFNUQVRFX0NIQU5HRUQpIHtcbiAgICAgICAgcmV0dXJuICdtb3ZlJztcbiAgICB9IGVsc2UgaWYgKHN0YXRlICYgU1RBVEVfQkVHQU4pIHtcbiAgICAgICAgcmV0dXJuICdzdGFydCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBkaXJlY3Rpb24gY29ucyB0byBzdHJpbmdcbiAqIEBwYXJhbSB7Q29uc3R9IGRpcmVjdGlvblxuICogQHJldHVybnMge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZGlyZWN0aW9uU3RyKGRpcmVjdGlvbikge1xuICAgIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0RPV04pIHtcbiAgICAgICAgcmV0dXJuICdkb3duJztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fVVApIHtcbiAgICAgICAgcmV0dXJuICd1cCc7XG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT0gRElSRUNUSU9OX0xFRlQpIHtcbiAgICAgICAgcmV0dXJuICdsZWZ0JztcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PSBESVJFQ1RJT05fUklHSFQpIHtcbiAgICAgICAgcmV0dXJuICdyaWdodCc7XG4gICAgfVxuICAgIHJldHVybiAnJztcbn1cblxuLyoqXG4gKiBnZXQgYSByZWNvZ25pemVyIGJ5IG5hbWUgaWYgaXQgaXMgYm91bmQgdG8gYSBtYW5hZ2VyXG4gKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSBvdGhlclJlY29nbml6ZXJcbiAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICogQHJldHVybnMge1JlY29nbml6ZXJ9XG4gKi9cbmZ1bmN0aW9uIGdldFJlY29nbml6ZXJCeU5hbWVJZk1hbmFnZXIob3RoZXJSZWNvZ25pemVyLCByZWNvZ25pemVyKSB7XG4gICAgdmFyIG1hbmFnZXIgPSByZWNvZ25pemVyLm1hbmFnZXI7XG4gICAgaWYgKG1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIuZ2V0KG90aGVyUmVjb2duaXplcik7XG4gICAgfVxuICAgIHJldHVybiBvdGhlclJlY29nbml6ZXI7XG59XG5cbi8qKlxuICogVGhpcyByZWNvZ25pemVyIGlzIGp1c3QgdXNlZCBhcyBhIGJhc2UgZm9yIHRoZSBzaW1wbGUgYXR0cmlidXRlIHJlY29nbml6ZXJzLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIEF0dHJSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdChBdHRyUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgQXR0clJlY29nbml6ZXJcbiAgICAgKi9cbiAgICBkZWZhdWx0czoge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge051bWJlcn1cbiAgICAgICAgICogQGRlZmF1bHQgMVxuICAgICAgICAgKi9cbiAgICAgICAgcG9pbnRlcnM6IDFcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBjaGVjayBpZiBpdCB0aGUgcmVjb2duaXplciByZWNlaXZlcyB2YWxpZCBpbnB1dCwgbGlrZSBpbnB1dC5kaXN0YW5jZSA+IDEwLlxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHtCb29sZWFufSByZWNvZ25pemVkXG4gICAgICovXG4gICAgYXR0clRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25Qb2ludGVycyA9IHRoaXMub3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgcmV0dXJuIG9wdGlvblBvaW50ZXJzID09PSAwIHx8IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9uUG9pbnRlcnM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFByb2Nlc3MgdGhlIGlucHV0IGFuZCByZXR1cm4gdGhlIHN0YXRlIGZvciB0aGUgcmVjb2duaXplclxuICAgICAqIEBtZW1iZXJvZiBBdHRyUmVjb2duaXplclxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dFxuICAgICAqIEByZXR1cm5zIHsqfSBTdGF0ZVxuICAgICAqL1xuICAgIHByb2Nlc3M6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBpbnB1dC5ldmVudFR5cGU7XG5cbiAgICAgICAgdmFyIGlzUmVjb2duaXplZCA9IHN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCk7XG4gICAgICAgIHZhciBpc1ZhbGlkID0gdGhpcy5hdHRyVGVzdChpbnB1dCk7XG5cbiAgICAgICAgLy8gb24gY2FuY2VsIGlucHV0IGFuZCB3ZSd2ZSByZWNvZ25pemVkIGJlZm9yZSwgcmV0dXJuIFNUQVRFX0NBTkNFTExFRFxuICAgICAgICBpZiAoaXNSZWNvZ25pemVkICYmIChldmVudFR5cGUgJiBJTlBVVF9DQU5DRUwgfHwgIWlzVmFsaWQpKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9DQU5DRUxMRUQ7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNSZWNvZ25pemVkIHx8IGlzVmFsaWQpIHtcbiAgICAgICAgICAgIGlmIChldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUgfCBTVEFURV9FTkRFRDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIShzdGF0ZSAmIFNUQVRFX0JFR0FOKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9CRUdBTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBzdGF0ZSB8IFNUQVRFX0NIQU5HRUQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFNUQVRFX0ZBSUxFRDtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBQYW5cbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGFuZCBtb3ZlZCBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBhblJlY29nbml6ZXIoKSB7XG4gICAgQXR0clJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIHRoaXMucFggPSBudWxsO1xuICAgIHRoaXMucFkgPSBudWxsO1xufVxuXG5pbmhlcml0KFBhblJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBQYW5SZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwYW4nLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICBwb2ludGVyczogMSxcbiAgICAgICAgZGlyZWN0aW9uOiBESVJFQ1RJT05fQUxMXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciBhY3Rpb25zID0gW107XG4gICAgICAgIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRpcmVjdGlvbiAmIERJUkVDVElPTl9WRVJUSUNBTCkge1xuICAgICAgICAgICAgYWN0aW9ucy5wdXNoKFRPVUNIX0FDVElPTl9QQU5fWCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjdGlvbnM7XG4gICAgfSxcblxuICAgIGRpcmVjdGlvblRlc3Q6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICB2YXIgaGFzTW92ZWQgPSB0cnVlO1xuICAgICAgICB2YXIgZGlzdGFuY2UgPSBpbnB1dC5kaXN0YW5jZTtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGlucHV0LmRpcmVjdGlvbjtcbiAgICAgICAgdmFyIHggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHZhciB5ID0gaW5wdXQuZGVsdGFZO1xuXG4gICAgICAgIC8vIGxvY2sgdG8gYXhpcz9cbiAgICAgICAgaWYgKCEoZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb24pKSB7XG4gICAgICAgICAgICBpZiAob3B0aW9ucy5kaXJlY3Rpb24gJiBESVJFQ1RJT05fSE9SSVpPTlRBTCkge1xuICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9ICh4ID09PSAwKSA/IERJUkVDVElPTl9OT05FIDogKHggPCAwKSA/IERJUkVDVElPTl9MRUZUIDogRElSRUNUSU9OX1JJR0hUO1xuICAgICAgICAgICAgICAgIGhhc01vdmVkID0geCAhPSB0aGlzLnBYO1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlID0gTWF0aC5hYnMoaW5wdXQuZGVsdGFYKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gKHkgPT09IDApID8gRElSRUNUSU9OX05PTkUgOiAoeSA8IDApID8gRElSRUNUSU9OX1VQIDogRElSRUNUSU9OX0RPV047XG4gICAgICAgICAgICAgICAgaGFzTW92ZWQgPSB5ICE9IHRoaXMucFk7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2UgPSBNYXRoLmFicyhpbnB1dC5kZWx0YVkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlucHV0LmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgICAgICAgcmV0dXJuIGhhc01vdmVkICYmIGRpc3RhbmNlID4gb3B0aW9ucy50aHJlc2hvbGQgJiYgZGlyZWN0aW9uICYgb3B0aW9ucy5kaXJlY3Rpb247XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gQXR0clJlY29nbml6ZXIucHJvdG90eXBlLmF0dHJUZXN0LmNhbGwodGhpcywgaW5wdXQpICYmXG4gICAgICAgICAgICAodGhpcy5zdGF0ZSAmIFNUQVRFX0JFR0FOIHx8ICghKHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTikgJiYgdGhpcy5kaXJlY3Rpb25UZXN0KGlucHV0KSkpO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuXG4gICAgICAgIHRoaXMucFggPSBpbnB1dC5kZWx0YVg7XG4gICAgICAgIHRoaXMucFkgPSBpbnB1dC5kZWx0YVk7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IGRpcmVjdGlvblN0cihpbnB1dC5kaXJlY3Rpb24pO1xuXG4gICAgICAgIGlmIChkaXJlY3Rpb24pIHtcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGRpcmVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9zdXBlci5lbWl0LmNhbGwodGhpcywgaW5wdXQpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFBpbmNoXG4gKiBSZWNvZ25pemVkIHdoZW4gdHdvIG9yIG1vcmUgcG9pbnRlcnMgYXJlIG1vdmluZyB0b3dhcmQgKHpvb20taW4pIG9yIGF3YXkgZnJvbSBlYWNoIG90aGVyICh6b29tLW91dCkuXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFBpbmNoUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFBpbmNoUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAncGluY2gnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5zY2FsZSAtIDEpID4gdGhpcy5vcHRpb25zLnRocmVzaG9sZCB8fCB0aGlzLnN0YXRlICYgU1RBVEVfQkVHQU4pO1xuICAgIH0sXG5cbiAgICBlbWl0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZiAoaW5wdXQuc2NhbGUgIT09IDEpIHtcbiAgICAgICAgICAgIHZhciBpbk91dCA9IGlucHV0LnNjYWxlIDwgMSA/ICdpbicgOiAnb3V0JztcbiAgICAgICAgICAgIGlucHV0LmFkZGl0aW9uYWxFdmVudCA9IHRoaXMub3B0aW9ucy5ldmVudCArIGluT3V0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3N1cGVyLmVtaXQuY2FsbCh0aGlzLCBpbnB1dCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUHJlc3NcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb3duIGZvciB4IG1zIHdpdGhvdXQgYW55IG1vdmVtZW50LlxuICogQGNvbnN0cnVjdG9yXG4gKiBAZXh0ZW5kcyBSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFByZXNzUmVjb2duaXplcigpIHtcbiAgICBSZWNvZ25pemVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xufVxuXG5pbmhlcml0KFByZXNzUmVjb2duaXplciwgUmVjb2duaXplciwge1xuICAgIC8qKlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKiBAbWVtYmVyb2YgUHJlc3NSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdwcmVzcycsXG4gICAgICAgIHBvaW50ZXJzOiAxLFxuICAgICAgICB0aW1lOiAyNTEsIC8vIG1pbmltYWwgdGltZSBvZiB0aGUgcG9pbnRlciB0byBiZSBwcmVzc2VkXG4gICAgICAgIHRocmVzaG9sZDogOSAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBbVE9VQ0hfQUNUSU9OX0FVVE9dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgdmFyIHZhbGlkUG9pbnRlcnMgPSBpbnB1dC5wb2ludGVycy5sZW5ndGggPT09IG9wdGlvbnMucG9pbnRlcnM7XG4gICAgICAgIHZhciB2YWxpZE1vdmVtZW50ID0gaW5wdXQuZGlzdGFuY2UgPCBvcHRpb25zLnRocmVzaG9sZDtcbiAgICAgICAgdmFyIHZhbGlkVGltZSA9IGlucHV0LmRlbHRhVGltZSA+IG9wdGlvbnMudGltZTtcblxuICAgICAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKCF2YWxpZE1vdmVtZW50IHx8ICF2YWxpZFBvaW50ZXJzIHx8IChpbnB1dC5ldmVudFR5cGUgJiAoSU5QVVRfRU5EIHwgSU5QVVRfQ0FOQ0VMKSAmJiAhdmFsaWRUaW1lKSkge1xuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9IGVsc2UgaWYgKGlucHV0LmV2ZW50VHlwZSAmIElOUFVUX1NUQVJUKSB7XG4gICAgICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICAgICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXRDb250ZXh0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdGUgPSBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgfSwgb3B0aW9ucy50aW1lLCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBTVEFURV9GQUlMRUQ7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICB9LFxuXG4gICAgZW1pdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT09IFNUQVRFX1JFQ09HTklaRUQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbnB1dCAmJiAoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfRU5EKSkge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgJ3VwJywgaW5wdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5faW5wdXQudGltZVN0YW1wID0gbm93KCk7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFJvdGF0ZVxuICogUmVjb2duaXplZCB3aGVuIHR3byBvciBtb3JlIHBvaW50ZXIgYXJlIG1vdmluZyBpbiBhIGNpcmN1bGFyIG1vdGlvbi5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgQXR0clJlY29nbml6ZXJcbiAqL1xuZnVuY3Rpb24gUm90YXRlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFJvdGF0ZVJlY29nbml6ZXIsIEF0dHJSZWNvZ25pemVyLCB7XG4gICAgLyoqXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBtZW1iZXJvZiBSb3RhdGVSZWNvZ25pemVyXG4gICAgICovXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgZXZlbnQ6ICdyb3RhdGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAsXG4gICAgICAgIHBvaW50ZXJzOiAyXG4gICAgfSxcblxuICAgIGdldFRvdWNoQWN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFtUT1VDSF9BQ1RJT05fTk9ORV07XG4gICAgfSxcblxuICAgIGF0dHJUZXN0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc3VwZXIuYXR0clRlc3QuY2FsbCh0aGlzLCBpbnB1dCkgJiZcbiAgICAgICAgICAgIChNYXRoLmFicyhpbnB1dC5yb3RhdGlvbikgPiB0aGlzLm9wdGlvbnMudGhyZXNob2xkIHx8IHRoaXMuc3RhdGUgJiBTVEFURV9CRUdBTik7XG4gICAgfVxufSk7XG5cbi8qKlxuICogU3dpcGVcbiAqIFJlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBtb3ZpbmcgZmFzdCAodmVsb2NpdHkpLCB3aXRoIGVub3VnaCBkaXN0YW5jZSBpbiB0aGUgYWxsb3dlZCBkaXJlY3Rpb24uXG4gKiBAY29uc3RydWN0b3JcbiAqIEBleHRlbmRzIEF0dHJSZWNvZ25pemVyXG4gKi9cbmZ1bmN0aW9uIFN3aXBlUmVjb2duaXplcigpIHtcbiAgICBBdHRyUmVjb2duaXplci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuXG5pbmhlcml0KFN3aXBlUmVjb2duaXplciwgQXR0clJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFN3aXBlUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAnc3dpcGUnLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLFxuICAgICAgICB2ZWxvY2l0eTogMC4zLFxuICAgICAgICBkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgICAgICBwb2ludGVyczogMVxuICAgIH0sXG5cbiAgICBnZXRUb3VjaEFjdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBQYW5SZWNvZ25pemVyLnByb3RvdHlwZS5nZXRUb3VjaEFjdGlvbi5jYWxsKHRoaXMpO1xuICAgIH0sXG5cbiAgICBhdHRyVGVzdDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgdmFyIGRpcmVjdGlvbiA9IHRoaXMub3B0aW9ucy5kaXJlY3Rpb247XG4gICAgICAgIHZhciB2ZWxvY2l0eTtcblxuICAgICAgICBpZiAoZGlyZWN0aW9uICYgKERJUkVDVElPTl9IT1JJWk9OVEFMIHwgRElSRUNUSU9OX1ZFUlRJQ0FMKSkge1xuICAgICAgICAgICAgdmVsb2NpdHkgPSBpbnB1dC5vdmVyYWxsVmVsb2NpdHk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uICYgRElSRUNUSU9OX0hPUklaT05UQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WDtcbiAgICAgICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gJiBESVJFQ1RJT05fVkVSVElDQUwpIHtcbiAgICAgICAgICAgIHZlbG9jaXR5ID0gaW5wdXQub3ZlcmFsbFZlbG9jaXR5WTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9zdXBlci5hdHRyVGVzdC5jYWxsKHRoaXMsIGlucHV0KSAmJlxuICAgICAgICAgICAgZGlyZWN0aW9uICYgaW5wdXQub2Zmc2V0RGlyZWN0aW9uICYmXG4gICAgICAgICAgICBpbnB1dC5kaXN0YW5jZSA+IHRoaXMub3B0aW9ucy50aHJlc2hvbGQgJiZcbiAgICAgICAgICAgIGlucHV0Lm1heFBvaW50ZXJzID09IHRoaXMub3B0aW9ucy5wb2ludGVycyAmJlxuICAgICAgICAgICAgYWJzKHZlbG9jaXR5KSA+IHRoaXMub3B0aW9ucy52ZWxvY2l0eSAmJiBpbnB1dC5ldmVudFR5cGUgJiBJTlBVVF9FTkQ7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBkaXJlY3Rpb24gPSBkaXJlY3Rpb25TdHIoaW5wdXQub2Zmc2V0RGlyZWN0aW9uKTtcbiAgICAgICAgaWYgKGRpcmVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmVtaXQodGhpcy5vcHRpb25zLmV2ZW50ICsgZGlyZWN0aW9uLCBpbnB1dCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIGlucHV0KTtcbiAgICB9XG59KTtcblxuLyoqXG4gKiBBIHRhcCBpcyBlY29nbml6ZWQgd2hlbiB0aGUgcG9pbnRlciBpcyBkb2luZyBhIHNtYWxsIHRhcC9jbGljay4gTXVsdGlwbGUgdGFwcyBhcmUgcmVjb2duaXplZCBpZiB0aGV5IG9jY3VyXG4gKiBiZXR3ZWVuIHRoZSBnaXZlbiBpbnRlcnZhbCBhbmQgcG9zaXRpb24uIFRoZSBkZWxheSBvcHRpb24gY2FuIGJlIHVzZWQgdG8gcmVjb2duaXplIG11bHRpLXRhcHMgd2l0aG91dCBmaXJpbmdcbiAqIGEgc2luZ2xlIHRhcC5cbiAqXG4gKiBUaGUgZXZlbnREYXRhIGZyb20gdGhlIGVtaXR0ZWQgZXZlbnQgY29udGFpbnMgdGhlIHByb3BlcnR5IGB0YXBDb3VudGAsIHdoaWNoIGNvbnRhaW5zIHRoZSBhbW91bnQgb2ZcbiAqIG11bHRpLXRhcHMgYmVpbmcgcmVjb2duaXplZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQGV4dGVuZHMgUmVjb2duaXplclxuICovXG5mdW5jdGlvbiBUYXBSZWNvZ25pemVyKCkge1xuICAgIFJlY29nbml6ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIC8vIHByZXZpb3VzIHRpbWUgYW5kIGNlbnRlcixcbiAgICAvLyB1c2VkIGZvciB0YXAgY291bnRpbmdcbiAgICB0aGlzLnBUaW1lID0gZmFsc2U7XG4gICAgdGhpcy5wQ2VudGVyID0gZmFsc2U7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gICAgdGhpcy5faW5wdXQgPSBudWxsO1xuICAgIHRoaXMuY291bnQgPSAwO1xufVxuXG5pbmhlcml0KFRhcFJlY29nbml6ZXIsIFJlY29nbml6ZXIsIHtcbiAgICAvKipcbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICogQG1lbWJlcm9mIFBpbmNoUmVjb2duaXplclxuICAgICAqL1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIGV2ZW50OiAndGFwJyxcbiAgICAgICAgcG9pbnRlcnM6IDEsXG4gICAgICAgIHRhcHM6IDEsXG4gICAgICAgIGludGVydmFsOiAzMDAsIC8vIG1heCB0aW1lIGJldHdlZW4gdGhlIG11bHRpLXRhcCB0YXBzXG4gICAgICAgIHRpbWU6IDI1MCwgLy8gbWF4IHRpbWUgb2YgdGhlIHBvaW50ZXIgdG8gYmUgZG93biAobGlrZSBmaW5nZXIgb24gdGhlIHNjcmVlbilcbiAgICAgICAgdGhyZXNob2xkOiA5LCAvLyBhIG1pbmltYWwgbW92ZW1lbnQgaXMgb2ssIGJ1dCBrZWVwIGl0IGxvd1xuICAgICAgICBwb3NUaHJlc2hvbGQ6IDEwIC8vIGEgbXVsdGktdGFwIGNhbiBiZSBhIGJpdCBvZmYgdGhlIGluaXRpYWwgcG9zaXRpb25cbiAgICB9LFxuXG4gICAgZ2V0VG91Y2hBY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gW1RPVUNIX0FDVElPTl9NQU5JUFVMQVRJT05dO1xuICAgIH0sXG5cbiAgICBwcm9jZXNzOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgICAgICB2YXIgdmFsaWRQb2ludGVycyA9IGlucHV0LnBvaW50ZXJzLmxlbmd0aCA9PT0gb3B0aW9ucy5wb2ludGVycztcbiAgICAgICAgdmFyIHZhbGlkTW92ZW1lbnQgPSBpbnB1dC5kaXN0YW5jZSA8IG9wdGlvbnMudGhyZXNob2xkO1xuICAgICAgICB2YXIgdmFsaWRUb3VjaFRpbWUgPSBpbnB1dC5kZWx0YVRpbWUgPCBvcHRpb25zLnRpbWU7XG5cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuXG4gICAgICAgIGlmICgoaW5wdXQuZXZlbnRUeXBlICYgSU5QVVRfU1RBUlQpICYmICh0aGlzLmNvdW50ID09PSAwKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmFpbFRpbWVvdXQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdlIG9ubHkgYWxsb3cgbGl0dGxlIG1vdmVtZW50XG4gICAgICAgIC8vIGFuZCB3ZSd2ZSByZWFjaGVkIGFuIGVuZCBldmVudCwgc28gYSB0YXAgaXMgcG9zc2libGVcbiAgICAgICAgaWYgKHZhbGlkTW92ZW1lbnQgJiYgdmFsaWRUb3VjaFRpbWUgJiYgdmFsaWRQb2ludGVycykge1xuICAgICAgICAgICAgaWYgKGlucHV0LmV2ZW50VHlwZSAhPSBJTlBVVF9FTkQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5mYWlsVGltZW91dCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdmFsaWRJbnRlcnZhbCA9IHRoaXMucFRpbWUgPyAoaW5wdXQudGltZVN0YW1wIC0gdGhpcy5wVGltZSA8IG9wdGlvbnMuaW50ZXJ2YWwpIDogdHJ1ZTtcbiAgICAgICAgICAgIHZhciB2YWxpZE11bHRpVGFwID0gIXRoaXMucENlbnRlciB8fCBnZXREaXN0YW5jZSh0aGlzLnBDZW50ZXIsIGlucHV0LmNlbnRlcikgPCBvcHRpb25zLnBvc1RocmVzaG9sZDtcblxuICAgICAgICAgICAgdGhpcy5wVGltZSA9IGlucHV0LnRpbWVTdGFtcDtcbiAgICAgICAgICAgIHRoaXMucENlbnRlciA9IGlucHV0LmNlbnRlcjtcblxuICAgICAgICAgICAgaWYgKCF2YWxpZE11bHRpVGFwIHx8ICF2YWxpZEludGVydmFsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb3VudCA9IDE7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnQgKz0gMTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcblxuICAgICAgICAgICAgLy8gaWYgdGFwIGNvdW50IG1hdGNoZXMgd2UgaGF2ZSByZWNvZ25pemVkIGl0LFxuICAgICAgICAgICAgLy8gZWxzZSBpdCBoYXMgYmVnYW4gcmVjb2duaXppbmcuLi5cbiAgICAgICAgICAgIHZhciB0YXBDb3VudCA9IHRoaXMuY291bnQgJSBvcHRpb25zLnRhcHM7XG4gICAgICAgICAgICBpZiAodGFwQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAvLyBubyBmYWlsaW5nIHJlcXVpcmVtZW50cywgaW1tZWRpYXRlbHkgdHJpZ2dlciB0aGUgdGFwIGV2ZW50XG4gICAgICAgICAgICAgICAgLy8gb3Igd2FpdCBhcyBsb25nIGFzIHRoZSBtdWx0aXRhcCBpbnRlcnZhbCB0byB0cmlnZ2VyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc1JlcXVpcmVGYWlsdXJlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBTVEFURV9SRUNPR05JWkVEO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfUkVDT0dOSVpFRDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJ5RW1pdCgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBvcHRpb25zLmludGVydmFsLCB0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFNUQVRFX0JFR0FOO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICBmYWlsVGltZW91dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dENvbnRleHQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXRlID0gU1RBVEVfRkFJTEVEO1xuICAgICAgICB9LCB0aGlzLm9wdGlvbnMuaW50ZXJ2YWwsIHRoaXMpO1xuICAgICAgICByZXR1cm4gU1RBVEVfRkFJTEVEO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgfSxcblxuICAgIGVtaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBTVEFURV9SRUNPR05JWkVEKSB7XG4gICAgICAgICAgICB0aGlzLl9pbnB1dC50YXBDb3VudCA9IHRoaXMuY291bnQ7XG4gICAgICAgICAgICB0aGlzLm1hbmFnZXIuZW1pdCh0aGlzLm9wdGlvbnMuZXZlbnQsIHRoaXMuX2lucHV0KTtcbiAgICAgICAgfVxuICAgIH1cbn0pO1xuXG4vKipcbiAqIFNpbXBsZSB3YXkgdG8gY3JlYXRlIGEgbWFuYWdlciB3aXRoIGEgZGVmYXVsdCBzZXQgb2YgcmVjb2duaXplcnMuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gSGFtbWVyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBvcHRpb25zLnJlY29nbml6ZXJzID0gaWZVbmRlZmluZWQob3B0aW9ucy5yZWNvZ25pemVycywgSGFtbWVyLmRlZmF1bHRzLnByZXNldCk7XG4gICAgcmV0dXJuIG5ldyBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpO1xufVxuXG4vKipcbiAqIEBjb25zdCB7c3RyaW5nfVxuICovXG5IYW1tZXIuVkVSU0lPTiA9ICcyLjAuNyc7XG5cbi8qKlxuICogZGVmYXVsdCBzZXR0aW5nc1xuICogQG5hbWVzcGFjZVxuICovXG5IYW1tZXIuZGVmYXVsdHMgPSB7XG4gICAgLyoqXG4gICAgICogc2V0IGlmIERPTSBldmVudHMgYXJlIGJlaW5nIHRyaWdnZXJlZC5cbiAgICAgKiBCdXQgdGhpcyBpcyBzbG93ZXIgYW5kIHVudXNlZCBieSBzaW1wbGUgaW1wbGVtZW50YXRpb25zLCBzbyBkaXNhYmxlZCBieSBkZWZhdWx0LlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IGZhbHNlXG4gICAgICovXG4gICAgZG9tRXZlbnRzOiBmYWxzZSxcblxuICAgIC8qKlxuICAgICAqIFRoZSB2YWx1ZSBmb3IgdGhlIHRvdWNoQWN0aW9uIHByb3BlcnR5L2ZhbGxiYWNrLlxuICAgICAqIFdoZW4gc2V0IHRvIGBjb21wdXRlYCBpdCB3aWxsIG1hZ2ljYWxseSBzZXQgdGhlIGNvcnJlY3QgdmFsdWUgYmFzZWQgb24gdGhlIGFkZGVkIHJlY29nbml6ZXJzLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICogQGRlZmF1bHQgY29tcHV0ZVxuICAgICAqL1xuICAgIHRvdWNoQWN0aW9uOiBUT1VDSF9BQ1RJT05fQ09NUFVURSxcblxuICAgIC8qKlxuICAgICAqIEB0eXBlIHtCb29sZWFufVxuICAgICAqIEBkZWZhdWx0IHRydWVcbiAgICAgKi9cbiAgICBlbmFibGU6IHRydWUsXG5cbiAgICAvKipcbiAgICAgKiBFWFBFUklNRU5UQUwgRkVBVFVSRSAtLSBjYW4gYmUgcmVtb3ZlZC9jaGFuZ2VkXG4gICAgICogQ2hhbmdlIHRoZSBwYXJlbnQgaW5wdXQgdGFyZ2V0IGVsZW1lbnQuXG4gICAgICogSWYgTnVsbCwgdGhlbiBpdCBpcyBiZWluZyBzZXQgdGhlIHRvIG1haW4gZWxlbWVudC5cbiAgICAgKiBAdHlwZSB7TnVsbHxFdmVudFRhcmdldH1cbiAgICAgKiBAZGVmYXVsdCBudWxsXG4gICAgICovXG4gICAgaW5wdXRUYXJnZXQ6IG51bGwsXG5cbiAgICAvKipcbiAgICAgKiBmb3JjZSBhbiBpbnB1dCBjbGFzc1xuICAgICAqIEB0eXBlIHtOdWxsfEZ1bmN0aW9ufVxuICAgICAqIEBkZWZhdWx0IG51bGxcbiAgICAgKi9cbiAgICBpbnB1dENsYXNzOiBudWxsLFxuXG4gICAgLyoqXG4gICAgICogRGVmYXVsdCByZWNvZ25pemVyIHNldHVwIHdoZW4gY2FsbGluZyBgSGFtbWVyKClgXG4gICAgICogV2hlbiBjcmVhdGluZyBhIG5ldyBNYW5hZ2VyIHRoZXNlIHdpbGwgYmUgc2tpcHBlZC5cbiAgICAgKiBAdHlwZSB7QXJyYXl9XG4gICAgICovXG4gICAgcHJlc2V0OiBbXG4gICAgICAgIC8vIFJlY29nbml6ZXJDbGFzcywgb3B0aW9ucywgW3JlY29nbml6ZVdpdGgsIC4uLl0sIFtyZXF1aXJlRmFpbHVyZSwgLi4uXVxuICAgICAgICBbUm90YXRlUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9XSxcbiAgICAgICAgW1BpbmNoUmVjb2duaXplciwge2VuYWJsZTogZmFsc2V9LCBbJ3JvdGF0ZSddXSxcbiAgICAgICAgW1N3aXBlUmVjb2duaXplciwge2RpcmVjdGlvbjogRElSRUNUSU9OX0hPUklaT05UQUx9XSxcbiAgICAgICAgW1BhblJlY29nbml6ZXIsIHtkaXJlY3Rpb246IERJUkVDVElPTl9IT1JJWk9OVEFMfSwgWydzd2lwZSddXSxcbiAgICAgICAgW1RhcFJlY29nbml6ZXJdLFxuICAgICAgICBbVGFwUmVjb2duaXplciwge2V2ZW50OiAnZG91YmxldGFwJywgdGFwczogMn0sIFsndGFwJ11dLFxuICAgICAgICBbUHJlc3NSZWNvZ25pemVyXVxuICAgIF0sXG5cbiAgICAvKipcbiAgICAgKiBTb21lIENTUyBwcm9wZXJ0aWVzIGNhbiBiZSB1c2VkIHRvIGltcHJvdmUgdGhlIHdvcmtpbmcgb2YgSGFtbWVyLlxuICAgICAqIEFkZCB0aGVtIHRvIHRoaXMgbWV0aG9kIGFuZCB0aGV5IHdpbGwgYmUgc2V0IHdoZW4gY3JlYXRpbmcgYSBuZXcgTWFuYWdlci5cbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICovXG4gICAgY3NzUHJvcHM6IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRleHQgc2VsZWN0aW9uIHRvIGltcHJvdmUgdGhlIGRyYWdnaW5nIGdlc3R1cmUuIE1haW5seSBmb3IgZGVza3RvcCBicm93c2Vycy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICB1c2VyU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGUgdGhlIFdpbmRvd3MgUGhvbmUgZ3JpcHBlcnMgd2hlbiBwcmVzc2luZyBhbiBlbGVtZW50LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoU2VsZWN0OiAnbm9uZScsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc2FibGVzIHRoZSBkZWZhdWx0IGNhbGxvdXQgc2hvd24gd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQuXG4gICAgICAgICAqIE9uIGlPUywgd2hlbiB5b3UgdG91Y2ggYW5kIGhvbGQgYSB0b3VjaCB0YXJnZXQgc3VjaCBhcyBhIGxpbmssIFNhZmFyaSBkaXNwbGF5c1xuICAgICAgICAgKiBhIGNhbGxvdXQgY29udGFpbmluZyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbGluay4gVGhpcyBwcm9wZXJ0eSBhbGxvd3MgeW91IHRvIGRpc2FibGUgdGhhdCBjYWxsb3V0LlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAnbm9uZSdcbiAgICAgICAgICovXG4gICAgICAgIHRvdWNoQ2FsbG91dDogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgd2hldGhlciB6b29taW5nIGlzIGVuYWJsZWQuIFVzZWQgYnkgSUUxMD5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICogQGRlZmF1bHQgJ25vbmUnXG4gICAgICAgICAqL1xuICAgICAgICBjb250ZW50Wm9vbWluZzogJ25vbmUnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTcGVjaWZpZXMgdGhhdCBhbiBlbnRpcmUgZWxlbWVudCBzaG91bGQgYmUgZHJhZ2dhYmxlIGluc3RlYWQgb2YgaXRzIGNvbnRlbnRzLiBNYWlubHkgZm9yIGRlc2t0b3AgYnJvd3NlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqIEBkZWZhdWx0ICdub25lJ1xuICAgICAgICAgKi9cbiAgICAgICAgdXNlckRyYWc6ICdub25lJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3ZlcnJpZGVzIHRoZSBoaWdobGlnaHQgY29sb3Igc2hvd24gd2hlbiB0aGUgdXNlciB0YXBzIGEgbGluayBvciBhIEphdmFTY3JpcHRcbiAgICAgICAgICogY2xpY2thYmxlIGVsZW1lbnQgaW4gaU9TLiBUaGlzIHByb3BlcnR5IG9iZXlzIHRoZSBhbHBoYSB2YWx1ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKiBAZGVmYXVsdCAncmdiYSgwLDAsMCwwKSdcbiAgICAgICAgICovXG4gICAgICAgIHRhcEhpZ2hsaWdodENvbG9yOiAncmdiYSgwLDAsMCwwKSdcbiAgICB9XG59O1xuXG52YXIgU1RPUCA9IDE7XG52YXIgRk9SQ0VEX1NUT1AgPSAyO1xuXG4vKipcbiAqIE1hbmFnZXJcbiAqIEBwYXJhbSB7SFRNTEVsZW1lbnR9IGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNYW5hZ2VyKGVsZW1lbnQsIG9wdGlvbnMpIHtcbiAgICB0aGlzLm9wdGlvbnMgPSBhc3NpZ24oe30sIEhhbW1lci5kZWZhdWx0cywgb3B0aW9ucyB8fCB7fSk7XG5cbiAgICB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgPSB0aGlzLm9wdGlvbnMuaW5wdXRUYXJnZXQgfHwgZWxlbWVudDtcblxuICAgIHRoaXMuaGFuZGxlcnMgPSB7fTtcbiAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICB0aGlzLnJlY29nbml6ZXJzID0gW107XG4gICAgdGhpcy5vbGRDc3NQcm9wcyA9IHt9O1xuXG4gICAgdGhpcy5lbGVtZW50ID0gZWxlbWVudDtcbiAgICB0aGlzLmlucHV0ID0gY3JlYXRlSW5wdXRJbnN0YW5jZSh0aGlzKTtcbiAgICB0aGlzLnRvdWNoQWN0aW9uID0gbmV3IFRvdWNoQWN0aW9uKHRoaXMsIHRoaXMub3B0aW9ucy50b3VjaEFjdGlvbik7XG5cbiAgICB0b2dnbGVDc3NQcm9wcyh0aGlzLCB0cnVlKTtcblxuICAgIGVhY2godGhpcy5vcHRpb25zLnJlY29nbml6ZXJzLCBmdW5jdGlvbihpdGVtKSB7XG4gICAgICAgIHZhciByZWNvZ25pemVyID0gdGhpcy5hZGQobmV3IChpdGVtWzBdKShpdGVtWzFdKSk7XG4gICAgICAgIGl0ZW1bMl0gJiYgcmVjb2duaXplci5yZWNvZ25pemVXaXRoKGl0ZW1bMl0pO1xuICAgICAgICBpdGVtWzNdICYmIHJlY29nbml6ZXIucmVxdWlyZUZhaWx1cmUoaXRlbVszXSk7XG4gICAgfSwgdGhpcyk7XG59XG5cbk1hbmFnZXIucHJvdG90eXBlID0ge1xuICAgIC8qKlxuICAgICAqIHNldCBvcHRpb25zXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICAgKiBAcmV0dXJucyB7TWFuYWdlcn1cbiAgICAgKi9cbiAgICBzZXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgYXNzaWduKHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgLy8gT3B0aW9ucyB0aGF0IG5lZWQgYSBsaXR0bGUgbW9yZSBzZXR1cFxuICAgICAgICBpZiAob3B0aW9ucy50b3VjaEFjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50b3VjaEFjdGlvbi51cGRhdGUoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5pbnB1dFRhcmdldCkge1xuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgZXhpc3RpbmcgZXZlbnQgbGlzdGVuZXJzIGFuZCByZWluaXRpYWxpemVcbiAgICAgICAgICAgIHRoaXMuaW5wdXQuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5pbnB1dC50YXJnZXQgPSBvcHRpb25zLmlucHV0VGFyZ2V0O1xuICAgICAgICAgICAgdGhpcy5pbnB1dC5pbml0KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHN0b3AgcmVjb2duaXppbmcgZm9yIHRoaXMgc2Vzc2lvbi5cbiAgICAgKiBUaGlzIHNlc3Npb24gd2lsbCBiZSBkaXNjYXJkZWQsIHdoZW4gYSBuZXcgW2lucHV0XXN0YXJ0IGV2ZW50IGlzIGZpcmVkLlxuICAgICAqIFdoZW4gZm9yY2VkLCB0aGUgcmVjb2duaXplciBjeWNsZSBpcyBzdG9wcGVkIGltbWVkaWF0ZWx5LlxuICAgICAqIEBwYXJhbSB7Qm9vbGVhbn0gW2ZvcmNlXVxuICAgICAqL1xuICAgIHN0b3A6IGZ1bmN0aW9uKGZvcmNlKSB7XG4gICAgICAgIHRoaXMuc2Vzc2lvbi5zdG9wcGVkID0gZm9yY2UgPyBGT1JDRURfU1RPUCA6IFNUT1A7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIHJ1biB0aGUgcmVjb2duaXplcnMhXG4gICAgICogY2FsbGVkIGJ5IHRoZSBpbnB1dEhhbmRsZXIgZnVuY3Rpb24gb24gZXZlcnkgbW92ZW1lbnQgb2YgdGhlIHBvaW50ZXJzICh0b3VjaGVzKVxuICAgICAqIGl0IHdhbGtzIHRocm91Z2ggYWxsIHRoZSByZWNvZ25pemVycyBhbmQgdHJpZXMgdG8gZGV0ZWN0IHRoZSBnZXN0dXJlIHRoYXQgaXMgYmVpbmcgbWFkZVxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBpbnB1dERhdGFcbiAgICAgKi9cbiAgICByZWNvZ25pemU6IGZ1bmN0aW9uKGlucHV0RGF0YSkge1xuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbjtcbiAgICAgICAgaWYgKHNlc3Npb24uc3RvcHBlZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcnVuIHRoZSB0b3VjaC1hY3Rpb24gcG9seWZpbGxcbiAgICAgICAgdGhpcy50b3VjaEFjdGlvbi5wcmV2ZW50RGVmYXVsdHMoaW5wdXREYXRhKTtcblxuICAgICAgICB2YXIgcmVjb2duaXplcjtcbiAgICAgICAgdmFyIHJlY29nbml6ZXJzID0gdGhpcy5yZWNvZ25pemVycztcblxuICAgICAgICAvLyB0aGlzIGhvbGRzIHRoZSByZWNvZ25pemVyIHRoYXQgaXMgYmVpbmcgcmVjb2duaXplZC5cbiAgICAgICAgLy8gc28gdGhlIHJlY29nbml6ZXIncyBzdGF0ZSBuZWVkcyB0byBiZSBCRUdBTiwgQ0hBTkdFRCwgRU5ERUQgb3IgUkVDT0dOSVpFRFxuICAgICAgICAvLyBpZiBubyByZWNvZ25pemVyIGlzIGRldGVjdGluZyBhIHRoaW5nLCBpdCBpcyBzZXQgdG8gYG51bGxgXG4gICAgICAgIHZhciBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyO1xuXG4gICAgICAgIC8vIHJlc2V0IHdoZW4gdGhlIGxhc3QgcmVjb2duaXplciBpcyByZWNvZ25pemVkXG4gICAgICAgIC8vIG9yIHdoZW4gd2UncmUgaW4gYSBuZXcgc2Vzc2lvblxuICAgICAgICBpZiAoIWN1clJlY29nbml6ZXIgfHwgKGN1clJlY29nbml6ZXIgJiYgY3VyUmVjb2duaXplci5zdGF0ZSAmIFNUQVRFX1JFQ09HTklaRUQpKSB7XG4gICAgICAgICAgICBjdXJSZWNvZ25pemVyID0gc2Vzc2lvbi5jdXJSZWNvZ25pemVyID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCByZWNvZ25pemVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJlY29nbml6ZXIgPSByZWNvZ25pemVyc1tpXTtcblxuICAgICAgICAgICAgLy8gZmluZCBvdXQgaWYgd2UgYXJlIGFsbG93ZWQgdHJ5IHRvIHJlY29nbml6ZSB0aGUgaW5wdXQgZm9yIHRoaXMgb25lLlxuICAgICAgICAgICAgLy8gMS4gICBhbGxvdyBpZiB0aGUgc2Vzc2lvbiBpcyBOT1QgZm9yY2VkIHN0b3BwZWQgKHNlZSB0aGUgLnN0b3AoKSBtZXRob2QpXG4gICAgICAgICAgICAvLyAyLiAgIGFsbG93IGlmIHdlIHN0aWxsIGhhdmVuJ3QgcmVjb2duaXplZCBhIGdlc3R1cmUgaW4gdGhpcyBzZXNzaW9uLCBvciB0aGUgdGhpcyByZWNvZ25pemVyIGlzIHRoZSBvbmVcbiAgICAgICAgICAgIC8vICAgICAgdGhhdCBpcyBiZWluZyByZWNvZ25pemVkLlxuICAgICAgICAgICAgLy8gMy4gICBhbGxvdyBpZiB0aGUgcmVjb2duaXplciBpcyBhbGxvd2VkIHRvIHJ1biBzaW11bHRhbmVvdXMgd2l0aCB0aGUgY3VycmVudCByZWNvZ25pemVkIHJlY29nbml6ZXIuXG4gICAgICAgICAgICAvLyAgICAgIHRoaXMgY2FuIGJlIHNldHVwIHdpdGggdGhlIGByZWNvZ25pemVXaXRoKClgIG1ldGhvZCBvbiB0aGUgcmVjb2duaXplci5cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLnN0b3BwZWQgIT09IEZPUkNFRF9TVE9QICYmICggLy8gMVxuICAgICAgICAgICAgICAgICAgICAhY3VyUmVjb2duaXplciB8fCByZWNvZ25pemVyID09IGN1clJlY29nbml6ZXIgfHwgLy8gMlxuICAgICAgICAgICAgICAgICAgICByZWNvZ25pemVyLmNhblJlY29nbml6ZVdpdGgoY3VyUmVjb2duaXplcikpKSB7IC8vIDNcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlY29nbml6ZShpbnB1dERhdGEpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVyLnJlc2V0KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSByZWNvZ25pemVyIGhhcyBiZWVuIHJlY29nbml6aW5nIHRoZSBpbnB1dCBhcyBhIHZhbGlkIGdlc3R1cmUsIHdlIHdhbnQgdG8gc3RvcmUgdGhpcyBvbmUgYXMgdGhlXG4gICAgICAgICAgICAvLyBjdXJyZW50IGFjdGl2ZSByZWNvZ25pemVyLiBidXQgb25seSBpZiB3ZSBkb24ndCBhbHJlYWR5IGhhdmUgYW4gYWN0aXZlIHJlY29nbml6ZXJcbiAgICAgICAgICAgIGlmICghY3VyUmVjb2duaXplciAmJiByZWNvZ25pemVyLnN0YXRlICYgKFNUQVRFX0JFR0FOIHwgU1RBVEVfQ0hBTkdFRCB8IFNUQVRFX0VOREVEKSkge1xuICAgICAgICAgICAgICAgIGN1clJlY29nbml6ZXIgPSBzZXNzaW9uLmN1clJlY29nbml6ZXIgPSByZWNvZ25pemVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGdldCBhIHJlY29nbml6ZXIgYnkgaXRzIGV2ZW50IG5hbWUuXG4gICAgICogQHBhcmFtIHtSZWNvZ25pemVyfFN0cmluZ30gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE51bGx9XG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChyZWNvZ25pemVyIGluc3RhbmNlb2YgUmVjb2duaXplcikge1xuICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXI7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlY29nbml6ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocmVjb2duaXplcnNbaV0ub3B0aW9ucy5ldmVudCA9PSByZWNvZ25pemVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlY29nbml6ZXJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBhZGQgYSByZWNvZ25pemVyIHRvIHRoZSBtYW5hZ2VyXG4gICAgICogZXhpc3RpbmcgcmVjb2duaXplcnMgd2l0aCB0aGUgc2FtZSBldmVudCBuYW1lIHdpbGwgYmUgcmVtb3ZlZFxuICAgICAqIEBwYXJhbSB7UmVjb2duaXplcn0gcmVjb2duaXplclxuICAgICAqIEByZXR1cm5zIHtSZWNvZ25pemVyfE1hbmFnZXJ9XG4gICAgICovXG4gICAgYWRkOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAnYWRkJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVtb3ZlIGV4aXN0aW5nXG4gICAgICAgIHZhciBleGlzdGluZyA9IHRoaXMuZ2V0KHJlY29nbml6ZXIub3B0aW9ucy5ldmVudCk7XG4gICAgICAgIGlmIChleGlzdGluZykge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmUoZXhpc3RpbmcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWNvZ25pemVycy5wdXNoKHJlY29nbml6ZXIpO1xuICAgICAgICByZWNvZ25pemVyLm1hbmFnZXIgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgIHJldHVybiByZWNvZ25pemVyO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiByZW1vdmUgYSByZWNvZ25pemVyIGJ5IG5hbWUgb3IgaW5zdGFuY2VcbiAgICAgKiBAcGFyYW0ge1JlY29nbml6ZXJ8U3RyaW5nfSByZWNvZ25pemVyXG4gICAgICogQHJldHVybnMge01hbmFnZXJ9XG4gICAgICovXG4gICAgcmVtb3ZlOiBmdW5jdGlvbihyZWNvZ25pemVyKSB7XG4gICAgICAgIGlmIChpbnZva2VBcnJheUFyZyhyZWNvZ25pemVyLCAncmVtb3ZlJywgdGhpcykpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVjb2duaXplciA9IHRoaXMuZ2V0KHJlY29nbml6ZXIpO1xuXG4gICAgICAgIC8vIGxldCdzIG1ha2Ugc3VyZSB0aGlzIHJlY29nbml6ZXIgZXhpc3RzXG4gICAgICAgIGlmIChyZWNvZ25pemVyKSB7XG4gICAgICAgICAgICB2YXIgcmVjb2duaXplcnMgPSB0aGlzLnJlY29nbml6ZXJzO1xuICAgICAgICAgICAgdmFyIGluZGV4ID0gaW5BcnJheShyZWNvZ25pemVycywgcmVjb2duaXplcik7XG5cbiAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZWNvZ25pemVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMudG91Y2hBY3Rpb24udXBkYXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogYmluZCBldmVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudHNcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbihldmVudHMsIGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGV2ZW50cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhhbmRsZXIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdID0gaGFuZGxlcnNbZXZlbnRdIHx8IFtdO1xuICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogdW5iaW5kIGV2ZW50LCBsZWF2ZSBlbWl0IGJsYW5rIHRvIHJlbW92ZSBhbGwgaGFuZGxlcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRzXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gW2hhbmRsZXJdXG4gICAgICogQHJldHVybnMge0V2ZW50RW1pdHRlcn0gdGhpc1xuICAgICAqL1xuICAgIG9mZjogZnVuY3Rpb24oZXZlbnRzLCBoYW5kbGVyKSB7XG4gICAgICAgIGlmIChldmVudHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVycztcbiAgICAgICAgZWFjaChzcGxpdFN0cihldmVudHMpLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGhhbmRsZXJzW2V2ZW50XTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlcnNbZXZlbnRdICYmIGhhbmRsZXJzW2V2ZW50XS5zcGxpY2UoaW5BcnJheShoYW5kbGVyc1tldmVudF0sIGhhbmRsZXIpLCAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBlbWl0IGV2ZW50IHRvIHRoZSBsaXN0ZW5lcnNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICAgICAqL1xuICAgIGVtaXQ6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhKSB7XG4gICAgICAgIC8vIHdlIGFsc28gd2FudCB0byB0cmlnZ2VyIGRvbSBldmVudHNcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5kb21FdmVudHMpIHtcbiAgICAgICAgICAgIHRyaWdnZXJEb21FdmVudChldmVudCwgZGF0YSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBubyBoYW5kbGVycywgc28gc2tpcCBpdCBhbGxcbiAgICAgICAgdmFyIGhhbmRsZXJzID0gdGhpcy5oYW5kbGVyc1tldmVudF0gJiYgdGhpcy5oYW5kbGVyc1tldmVudF0uc2xpY2UoKTtcbiAgICAgICAgaWYgKCFoYW5kbGVycyB8fCAhaGFuZGxlcnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBkYXRhLnR5cGUgPSBldmVudDtcbiAgICAgICAgZGF0YS5wcmV2ZW50RGVmYXVsdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGF0YS5zcmNFdmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpID0gMDtcbiAgICAgICAgd2hpbGUgKGkgPCBoYW5kbGVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGhhbmRsZXJzW2ldKGRhdGEpO1xuICAgICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIGRlc3Ryb3kgdGhlIG1hbmFnZXIgYW5kIHVuYmluZHMgYWxsIGV2ZW50c1xuICAgICAqIGl0IGRvZXNuJ3QgdW5iaW5kIGRvbSBldmVudHMsIHRoYXQgaXMgdGhlIHVzZXIgb3duIHJlc3BvbnNpYmlsaXR5XG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWxlbWVudCAmJiB0b2dnbGVDc3NQcm9wcyh0aGlzLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IHt9O1xuICAgICAgICB0aGlzLnNlc3Npb24gPSB7fTtcbiAgICAgICAgdGhpcy5pbnB1dC5kZXN0cm95KCk7XG4gICAgICAgIHRoaXMuZWxlbWVudCA9IG51bGw7XG4gICAgfVxufTtcblxuLyoqXG4gKiBhZGQvcmVtb3ZlIHRoZSBjc3MgcHJvcGVydGllcyBhcyBkZWZpbmVkIGluIG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wc1xuICogQHBhcmFtIHtNYW5hZ2VyfSBtYW5hZ2VyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGFkZFxuICovXG5mdW5jdGlvbiB0b2dnbGVDc3NQcm9wcyhtYW5hZ2VyLCBhZGQpIHtcbiAgICB2YXIgZWxlbWVudCA9IG1hbmFnZXIuZWxlbWVudDtcbiAgICBpZiAoIWVsZW1lbnQuc3R5bGUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgcHJvcDtcbiAgICBlYWNoKG1hbmFnZXIub3B0aW9ucy5jc3NQcm9wcywgZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgcHJvcCA9IHByZWZpeGVkKGVsZW1lbnQuc3R5bGUsIG5hbWUpO1xuICAgICAgICBpZiAoYWRkKSB7XG4gICAgICAgICAgICBtYW5hZ2VyLm9sZENzc1Byb3BzW3Byb3BdID0gZWxlbWVudC5zdHlsZVtwcm9wXTtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcF0gPSB2YWx1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc3R5bGVbcHJvcF0gPSBtYW5hZ2VyLm9sZENzc1Byb3BzW3Byb3BdIHx8ICcnO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgaWYgKCFhZGQpIHtcbiAgICAgICAgbWFuYWdlci5vbGRDc3NQcm9wcyA9IHt9O1xuICAgIH1cbn1cblxuLyoqXG4gKiB0cmlnZ2VyIGRvbSBldmVudFxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge09iamVjdH0gZGF0YVxuICovXG5mdW5jdGlvbiB0cmlnZ2VyRG9tRXZlbnQoZXZlbnQsIGRhdGEpIHtcbiAgICB2YXIgZ2VzdHVyZUV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XG4gICAgZ2VzdHVyZUV2ZW50LmluaXRFdmVudChldmVudCwgdHJ1ZSwgdHJ1ZSk7XG4gICAgZ2VzdHVyZUV2ZW50Lmdlc3R1cmUgPSBkYXRhO1xuICAgIGRhdGEudGFyZ2V0LmRpc3BhdGNoRXZlbnQoZ2VzdHVyZUV2ZW50KTtcbn1cblxuYXNzaWduKEhhbW1lciwge1xuICAgIElOUFVUX1NUQVJUOiBJTlBVVF9TVEFSVCxcbiAgICBJTlBVVF9NT1ZFOiBJTlBVVF9NT1ZFLFxuICAgIElOUFVUX0VORDogSU5QVVRfRU5ELFxuICAgIElOUFVUX0NBTkNFTDogSU5QVVRfQ0FOQ0VMLFxuXG4gICAgU1RBVEVfUE9TU0lCTEU6IFNUQVRFX1BPU1NJQkxFLFxuICAgIFNUQVRFX0JFR0FOOiBTVEFURV9CRUdBTixcbiAgICBTVEFURV9DSEFOR0VEOiBTVEFURV9DSEFOR0VELFxuICAgIFNUQVRFX0VOREVEOiBTVEFURV9FTkRFRCxcbiAgICBTVEFURV9SRUNPR05JWkVEOiBTVEFURV9SRUNPR05JWkVELFxuICAgIFNUQVRFX0NBTkNFTExFRDogU1RBVEVfQ0FOQ0VMTEVELFxuICAgIFNUQVRFX0ZBSUxFRDogU1RBVEVfRkFJTEVELFxuXG4gICAgRElSRUNUSU9OX05PTkU6IERJUkVDVElPTl9OT05FLFxuICAgIERJUkVDVElPTl9MRUZUOiBESVJFQ1RJT05fTEVGVCxcbiAgICBESVJFQ1RJT05fUklHSFQ6IERJUkVDVElPTl9SSUdIVCxcbiAgICBESVJFQ1RJT05fVVA6IERJUkVDVElPTl9VUCxcbiAgICBESVJFQ1RJT05fRE9XTjogRElSRUNUSU9OX0RPV04sXG4gICAgRElSRUNUSU9OX0hPUklaT05UQUw6IERJUkVDVElPTl9IT1JJWk9OVEFMLFxuICAgIERJUkVDVElPTl9WRVJUSUNBTDogRElSRUNUSU9OX1ZFUlRJQ0FMLFxuICAgIERJUkVDVElPTl9BTEw6IERJUkVDVElPTl9BTEwsXG5cbiAgICBNYW5hZ2VyOiBNYW5hZ2VyLFxuICAgIElucHV0OiBJbnB1dCxcbiAgICBUb3VjaEFjdGlvbjogVG91Y2hBY3Rpb24sXG5cbiAgICBUb3VjaElucHV0OiBUb3VjaElucHV0LFxuICAgIE1vdXNlSW5wdXQ6IE1vdXNlSW5wdXQsXG4gICAgUG9pbnRlckV2ZW50SW5wdXQ6IFBvaW50ZXJFdmVudElucHV0LFxuICAgIFRvdWNoTW91c2VJbnB1dDogVG91Y2hNb3VzZUlucHV0LFxuICAgIFNpbmdsZVRvdWNoSW5wdXQ6IFNpbmdsZVRvdWNoSW5wdXQsXG5cbiAgICBSZWNvZ25pemVyOiBSZWNvZ25pemVyLFxuICAgIEF0dHJSZWNvZ25pemVyOiBBdHRyUmVjb2duaXplcixcbiAgICBUYXA6IFRhcFJlY29nbml6ZXIsXG4gICAgUGFuOiBQYW5SZWNvZ25pemVyLFxuICAgIFN3aXBlOiBTd2lwZVJlY29nbml6ZXIsXG4gICAgUGluY2g6IFBpbmNoUmVjb2duaXplcixcbiAgICBSb3RhdGU6IFJvdGF0ZVJlY29nbml6ZXIsXG4gICAgUHJlc3M6IFByZXNzUmVjb2duaXplcixcblxuICAgIG9uOiBhZGRFdmVudExpc3RlbmVycyxcbiAgICBvZmY6IHJlbW92ZUV2ZW50TGlzdGVuZXJzLFxuICAgIGVhY2g6IGVhY2gsXG4gICAgbWVyZ2U6IG1lcmdlLFxuICAgIGV4dGVuZDogZXh0ZW5kLFxuICAgIGFzc2lnbjogYXNzaWduLFxuICAgIGluaGVyaXQ6IGluaGVyaXQsXG4gICAgYmluZEZuOiBiaW5kRm4sXG4gICAgcHJlZml4ZWQ6IHByZWZpeGVkXG59KTtcblxuLy8gdGhpcyBwcmV2ZW50cyBlcnJvcnMgd2hlbiBIYW1tZXIgaXMgbG9hZGVkIGluIHRoZSBwcmVzZW5jZSBvZiBhbiBBTURcbi8vICBzdHlsZSBsb2FkZXIgYnV0IGJ5IHNjcmlwdCB0YWcsIG5vdCBieSB0aGUgbG9hZGVyLlxudmFyIGZyZWVHbG9iYWwgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9KSk7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuZnJlZUdsb2JhbC5IYW1tZXIgPSBIYW1tZXI7XG5cbmlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBIYW1tZXI7XG4gICAgfSk7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEhhbW1lcjtcbn0gZWxzZSB7XG4gICAgd2luZG93W2V4cG9ydE5hbWVdID0gSGFtbWVyO1xufVxuXG59KSh3aW5kb3csIGRvY3VtZW50LCAnSGFtbWVyJyk7XG4iXX0=
