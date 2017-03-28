/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 75);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// appdata.js
// @//flow
//
// This module sets up the data model for the text and the app.



var appdata = {
	currenttranslationlist: [], // list of ids of translations we're currently using
	windowwidth: window.innerWidth, // the window width
	windowheight: window.innerHeight, // the window height
	currentpage: "lens", // the page that we're currently viewing
	canto: 0, // the current canto
	elements: {
		lens: document.querySelector("html"),
		main: document.querySelector("html"),
		content: document.querySelector("html"),
		titlebar: document.querySelector("html"),
		hammerleft: document.querySelector("html"),
		hammerright: document.querySelector("html")
	},
	lens: {
		width: window.innerWidth, // is this actually needed? same as windowwidth
		height: window.innerHeight - 40, // this is assuming navbar is always 40px
		left: {
			translation: "", // this was an index, changing it to a member of currenttranslationlist
			lineheight: 24, // this is the base lineheight; changed at different sizes
			percentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
			lines: 0, // this is the number of lines calculated to be on the page
			width: 0, // this is the width of the left lens (0 if not in twin mode)
			titlebar: document.querySelector("#navbarleft .navtitle"),
			slider: document.getElementById("#sliderleft"),
			textinside: document.querySelector("#sliderleft .textinsideframe"),
			text: document.getElementById("#sliderleft .textframe")
		},
		right: {
			translation: "", // this is an id found in currenttranslationlist
			lineheight: 24, // this is the base lineheight; changed at different sizes
			percentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
			lines: 0, // this is the number of lines calculated to be on the page
			width: window.innerWidth, // this is the width of the right lens (same as window if not in twin mode)
			titlebar: document.querySelector("#navbarright .navtitle"),
			slider: document.getElementById("#sliderright"),
			textinside: document.querySelector("#sliderright .textinsideframe"),
			text: document.getElementById("#sliderright .textframe")
		}
	},
	system: {
		responsive: true, // if false, attempts to use viewport units (doesn't work right now)
		oncordova: false, // this is true if running as an app
		platform: "", // if on cordova, this is the platform for the book
		delay: 600 // this is the amount of time swiping takes, in ms
	},
	usersettings: { // these can be overridden by previously saved user settings
		twinmode: false, // whether or not twin mode is turned on
		nightmode: false, // whether or not night mode is turned on
		shownotes: true // whether or not notes are shown
	},

	// things that come from the bookfile (all of these are overwritten:)

	bookname: "", // the work's individual code (lowercase, no punctuation, no spaces), e.g. "inferno"
	booktitle: "", // the work's title
	bookauthor: "", // the work's author (distinct from translator)
	description: "", // the work's description (in bookdata)
	versionhistory: [], // the version history, an array of texts
	comingsoon: "", // the book's coming soon information, a chunk of HTML
	translationcount: 0, // this is the number of different translations in the book
	cantocount: 0, // this is the number of cantos in the book
	textdata: [],
	translationdata: [],
	cantotitles: [], // the canonical titles for cantos, used in navbar and in selection
	watch: {
		setpage: "", // this is a string (id of page)
		setlens: {
			trigger: false, // when this changes, the thing is called
			canto: 0, // what's fed to app.setlens
			translation: "",
			percentage: 0,
			side: ""
		},
		localsave: false // when this is flipped, localsave happens
	},
	setup: function setup() {
		appdata.elements.lens = document.getElementById("lens");
		appdata.elements.main = document.getElementById("main");
		appdata.elements.content = document.getElementById("content");
		appdata.elements.titlebar = document.querySelector("#navbarother .navtitle");

		appdata.lens.left.slider = document.getElementById("sliderleft");
		appdata.lens.left.text = document.querySelector("#sliderleft .textframe");
		appdata.lens.left.textinside = document.querySelector("#sliderleft .textinsideframe");
		appdata.lens.left.titlebar = document.querySelector("#navbarleft .navtitle");

		appdata.lens.right.slider = document.getElementById("sliderright");
		appdata.lens.right.text = document.querySelector("#sliderright .textframe");
		appdata.lens.right.textinside = document.querySelector("#sliderright .textinsideframe");
		appdata.lens.right.titlebar = document.querySelector("#navbarright .navtitle");
	}
};

module.exports = appdata;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// dom.js

//
// this module is basic dom manipulation



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
			if (selector.parentNode && selector.parentNode !== null) {
				selector.parentNode.removeChild(selector);
			}
		}
	},
	addclass: function addclass(selectorstring, myclass) {
		var myelementlist = document.querySelectorAll(selectorstring);
		if (myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for (var j = 0; j < classes.length; j++) {
				dom.addclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelementlist.length; i++) {
				myelementlist[i].classList.add(myclass);
			}
		}
	},
	removeclass: function removeclass(selectorstring, myclass) {
		var myelementlist = document.querySelectorAll(selectorstring);
		if (myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for (var j = 0; j < classes.length; j++) {
				dom.removeclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelementlist.length; i++) {
				myelementlist[i].classList.remove(myclass);
			}
		}
	},
	hasclass: function hasclass(element, classname) {
		return (' ' + element.className + ' ').indexOf(' ' + classname + ' ') > -1;
	}
};

module.exports = dom;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var store      = __webpack_require__(28)('wks')
  , uid        = __webpack_require__(29)
  , Symbol     = __webpack_require__(2).Symbol
  , USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function(name){
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

var dP         = __webpack_require__(14)
  , createDesc = __webpack_require__(26);
module.exports = __webpack_require__(8) ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// helpers.js
//
// These are helper functions used by different modules.



var data = __webpack_require__(0);

var helpers = {
	getUrlVars: function getUrlVars() {
		var vars = {};
		/*eslint-disable no-unused-vars*/
		var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
			vars[key] = value;
		});
		/*eslint-endable no-unused-vars*/
		return vars;
	},
	gettranslationindex: function gettranslationindex(transid) {
		for (var j = 0; j < data.translationdata.length; j++) {
			if (transid == data.translationdata[j].translationid) {
				return j;
			}
		}
	},
	nexttrans: function nexttrans(giventranslation) {
		if (data.currenttranslationlist.length > 1) {
			if (data.currenttranslationlist.indexOf(giventranslation) + 1 == data.currenttranslationlist.length) {
				return data.currenttranslationlist[0];
			} else {
				return data.currenttranslationlist[data.currenttranslationlist.indexOf(giventranslation) + 1];
			}
		} else {
			return giventranslation;
		}
	},
	prevtrans: function prevtrans(giventranslation) {
		if (data.currenttranslationlist.length > 1) {
			if (data.currenttranslationlist.indexOf(giventranslation) == 0) {
				return data.currenttranslationlist[data.currenttranslationlist.length - 1];
			} else {
				return data.currenttranslationlist[data.currenttranslationlist.indexOf(giventranslation) - 1];
			}
		} else {
			return giventranslation;
		}
	}
};

module.exports = helpers;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(13);
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};

/***/ }),
/* 7 */
/***/ (function(module, exports) {

var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

// Thank's IE8 for his funny defineProperty
module.exports = !__webpack_require__(24)(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});

/***/ }),
/* 9 */
/***/ (function(module, exports) {

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};

/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = {};

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
//resize.js
//
// this is invoked when the screen is resized.



var data = __webpack_require__(0);
var dom = __webpack_require__(1);
var helpers = __webpack_require__(5); // .nexttrans, .gettranslationindex

var resize = {
	check: function check(keeppage) {

		// if this is invoked with keeppage = true, it won't call setlens

		// this needs to be debounced!

		//console.log("Navbar: " + document.getElementById("navbar").clientWidth);
		//console.log("Navtitle: " + data.lens.right.titlebar.clientWidth);
		//console.log("button width: " + document.querySelector(".navprev").clientWidth);

		data.windowwidth = window.innerWidth;
		data.windowheight = window.innerHeight;
		var titlewidth = document.getElementById("navbar").clientWidth - 5 * 40 - 1;

		if (data.usersettings.twinmode && data.windowwidth > 768) {
			dom.addclass("body", "twinmode");
			titlewidth = document.getElementById("navbar").clientWidth / 2 - 5 * 40 - 1;
			console.log("Twin mode!");
			if (data.lens.left.translation === "") {
				data.lens.left.translation = helpers.nexttrans(data.lens.right.translation);
			}

			var thistrans = helpers.gettranslationindex(data.lens.left.translation);

			dom.addclass("#sliderleft .textframe", data.translationdata[thistrans].translationclass);
			var insert = dom.create(data.textdata[thistrans].text[data.canto]);
			data.lens.left.textinside.appendChild(insert);

			data.lens.left.slider.style.width = "50%";
			data.lens.right.slider.style.width = "50%";
			data.watch.setlens = {
				translation: data.lens.left.translation,
				canto: data.canto,
				side: "left",
				percentage: 999, // is this wrong?
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.left.translation,data.canto,"left");
		} else {
			console.log("Single mode!");
			dom.removeclass("body", "twinmode");

			data.lens.left.slider.style.width = "0";
			data.lens.right.slider.style.width = "100%";
		}

		data.lens.left.titlebar.style.width = titlewidth + "px";
		data.lens.left.titlebar.setAttribute("style", "width:" + titlewidth + "px");
		data.lens.right.titlebar.style.width = titlewidth + "px";
		data.lens.right.titlebar.setAttribute("style", "width:" + titlewidth + "px");

		console.log("The window has been resized! New width: " + data.windowwidth + "," + data.windowheight);
		data.lens.width = data.windowwidth;
		data.lens.height = data.windowheight - document.getElementById("navbar").clientHeight; // is this accurate on iOS?

		dom.addclass(".page", data.lens.width > data.lens.height ? "landscape" : "portrait");
		dom.removeclass(".page", data.lens.width > data.lens.height ? "portrait" : "landscape");
		/*
  data.elements.main.style.width = data.lens.width+"px";
  data.elements.content.style.width = data.lens.width+"px";
  */
		data.elements.main.style.height = data.windowheight + "px";
		data.elements.content.style.height = data.lens.height + "px";

		if (data.system.responsive) {
			// are these numbers actually synched to what's in the CSS? check!

			var actualwidth = data.usersettings.twinmode ? data.windowwidth / 2 : data.windowwidth;

			if (actualwidth < 640) {
				data.lens.left.lineheight = 20;
				data.lens.right.lineheight = 20;
			} else {
				if (actualwidth < 768) {
					data.lens.left.lineheight = 24;
					data.lens.right.lineheight = 24;
				} else {
					if (actualwidth < 1024) {
						data.lens.left.lineheight = 28;
						data.lens.right.lineheight = 28;
					} else {
						data.lens.left.lineheight = 32;
						data.lens.right.lineheight = 32;
					}
				}
			}
		} else {
			data.lens.left.lineheight = data.windowwidth / 25;
			data.lens.right.lineheight = data.windowwidth / 25;
		}

		data.lens.left.width = data.usersettings.twinmode ? data.windowwidth / 2 : 0;
		data.lens.right.width = data.usersettings.twinmode ? data.windowwidth / 2 : data.windowwidth;

		if (!keeppage) {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto,
				side: "right",
				percentage: 999, // is this wrong?
				trigger: !data.watch.setlens.trigger
			};
		}
	}
};

module.exports = resize;

/***/ }),
/* 12 */
/***/ (function(module, exports) {

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};

/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

var anObject       = __webpack_require__(6)
  , IE8_DOM_DEFINE = __webpack_require__(50)
  , toPrimitive    = __webpack_require__(65)
  , dP             = Object.defineProperty;

exports.f = __webpack_require__(8) ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

var shared = __webpack_require__(28)('keys')
  , uid    = __webpack_require__(29);
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};

/***/ }),
/* 16 */
/***/ (function(module, exports) {

// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = __webpack_require__(51)
  , defined = __webpack_require__(12);
module.exports = function(it){
  return IObject(defined(it));
};

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// fixpadding.js
//
// this fixes the padding. Could probably be worked into setlens?
// setlens.regular has not been looked at in a long time.



var dom = __webpack_require__(1);
var data = __webpack_require__(0);

var fixpadding = {
	preprocess: function preprocess() {
		// this should calc line lengths before anything else

		var dummynode = document.createElement("div");
		dummynode.className = "textinsideframe textpage";
		dummynode.id = "dummynode";
		dummynode.style.visibility = "hidden";
		document.body.appendChild(dummynode);

		for (var currenttrans = 0; currenttrans < data.textdata.length; currenttrans++) {
			var transmaxwidth = 0;
			var transmaxline = "";
			var transmaxcanto = 0;
			if (data.textdata[currenttrans].translationclass == "poetry") {

				console.log("\nRunning preprocess for " + data.textdata[currenttrans].translationid + ":");

				for (var currentcanto = 0; currentcanto < data.textdata[currenttrans].text.length; currentcanto++) {
					var workingcanto = data.textdata[currenttrans].text[currentcanto];
					dummynode.innerHTML = workingcanto;
					var paragraphs = dummynode.querySelectorAll("p");
					var maxwidth = 0;
					var maxline = "";
					for (var i = 0; i < paragraphs.length; i++) {
						var paragraph = paragraphs[i];
						paragraph.style.display = "inline-block";

						// this is not picking up indents, I think – maybe div.clientWidth + (div.style.marginLeft + div.style.textIndent)
						// also notes are throwing this off: {{[0-9]*}}

						if (paragraph.clientWidth > maxwidth) {
							maxwidth = paragraph.clientWidth;
							maxline = paragraph.innerHTML;
							if (maxwidth > transmaxwidth) {
								transmaxwidth = maxwidth;
								transmaxcanto = currentcanto;
								transmaxline = maxline;
							}
						}
					}
					// console.log(`${currenttrans}, ${currentcanto}: ${maxwidth}: ${maxline}`);
				}
				console.log("Max width: " + transmaxwidth + " in canto " + transmaxcanto + ": \"" + transmaxline + "\"");
			} else {
				console.log("\nNot poetry: " + data.textdata[currenttrans].translationid);
			}
		}
		dummynode.parentNode.removeChild(dummynode); // get rid of our dummy
	},
	responsive: function responsive(thisside) {
		var divs = document.querySelectorAll("#" + thisside.slider.id + " .textframe p");
		var div;
		var maxwidth = 0;

		if (dom.hasclass(thisside.text, "poetry")) {

			// this is poetry, figure out longest line

			thisside.text.style.paddingLeft = "0";
			thisside.text.style.paddingRight = "0";
			thisside.textinside.style.marginLeft = "0";
			thisside.textinside.style.marginRight = "0";
			thisside.textinside.style.paddingLeft = "0";
			thisside.textinside.style.paddingRight = "0";
			for (var i = 0; i < divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";

				// this is not picking up indents, I think – maybe div.clientWidth + (div.style.marginLeft + div.style.textIndent)

				if (div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			if (thisside.width - 16 > maxwidth) {
				console.log("Text width: " + thisside.width + "; max line width: " + maxwidth + "; calculated padding: " + (thisside.width - maxwidth - 16 - 16) / 2 + "px");
				thisside.text.style.paddingLeft = "0";
				thisside.text.style.paddingRight = "0";
				thisside.textinside.style.paddingLeft = "0";
				thisside.textinside.style.paddingRight = "0";
				thisside.textinside.style.marginLeft = (thisside.width - maxwidth - 16 - 16) / 2 + "px";
				thisside.textinside.style.marginRight = (thisside.width - maxwidth - 16 - 16) / 2 + "px";
			} else {
				console.log("Too wide! Text width: " + thisside.width + "; max line width: " + maxwidth + ".");
				thisside.text.style.paddingLeft = 8 + "px";
				thisside.text.style.paddingRight = 8 + "px";
				thisside.textinside.style.marginLeft = "0";
				thisside.textinside.style.marginRight = "0";
			}
		} else {
			console.log("Prose, not doing anything.");
		}
	},
	regular: function regular(thisside) {
		var divs = document.querySelectorAll("#" + thisside.slider.id + " .textframe p");
		if (dom.hasclass(thisside.text, "poetry")) {

			var maxwidth = 0;

			// this is poetry, figure out longest line

			thisside.text.style.paddingLeft = "0";
			for (var i = 0; i < divs.length; i++) {
				var div = divs[i];
				div.style.display = "inline-block";
				if (div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			console.log("—>text width: " + thisside.width);
			console.log("—>max width: " + maxwidth);

			thisside.text.style.paddingLeft = (thisside.width - maxwidth) / 2 + "px";
			thisside.text.style.paddingRight = (thisside.width - maxwidth) / 2 + "px";
		} else {

			// this is prose, standardized padding

			var desiredwidth = 75; // this is in vw

			console.log("—>text width: " + thisside.width);
			console.log("—>desired width: " + desiredwidth);
			console.log("—>lineheight: " + thisside.lineheight);

			//		console.log(lens.width + " "+desiredwidth);
			//		var padding = (lens.width - desiredwidth)/2;

			var padding = (100 - desiredwidth) / 2;
			/*
   if((desiredwidth + 2) > lens.width) {
   	thisside.text.style.paddingLeft = "1vw";
   	thisside.text.style.paddingRight = "1vw";
   } else {
   	*/
			thisside.text.style.paddingLeft = padding + "vw";
			thisside.text.style.paddingRight = padding + "vw";
			//		}
		}
	}
};

module.exports = fixpadding;

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// localdata.js
//
// This module controls saving data locally



var _stringify = __webpack_require__(40);

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dom = __webpack_require__(1);
var data = __webpack_require__(0);
var helpers = __webpack_require__(5); // getUrlVars, .gettranslationindex,

var localdata = {
	save: function save() {
		// this should store appdate on localstorage

		var tostore = (0, _stringify2.default)({
			currentcanto: data.canto,
			currenttransright: data.lens.right.translation,
			currenttransleft: data.lens.left.translation,
			translationset: data.currenttranslationlist,
			twinmode: data.usersettings.twinmode,
			nightmode: data.usersettings.nightmode,
			shownotes: data.usersettings.shownotes
		});

		var storage = window.localStorage;
		storage.setItem(data.bookname, tostore);

		// save current location as hash

		if (history.pushState) {
			var newurl = window.location.origin + window.location.pathname + ("?canto=" + data.canto + "&trans=" + data.lens.right.translation);
			if (data.usersettings.twinmode) {
				newurl += "&lefttrans=" + data.lens.left.translation;
			}
			if (window.location.protocol !== "file:") {
				window.history.pushState({ path: newurl }, '', newurl);
			} else {
				console.log(newurl);
			}
		}
	},
	read: function read() {

		if (helpers.getUrlVars().reset) {
			console.log("Resetting local storage!");
			var _storage = window.localStorage;
			_storage.removeItem(data.bookname);
		}

		var gotocanto = 0;
		var gototrans = "";
		var gotolefttrans = "";
		var gototwinmode = false;
		var cantoflag = false;
		var transflag = false;

		// this should take localstorage and replace the values in data with it

		// first, read local storage

		var storage = window.localStorage;
		var toread = storage.getItem(data.bookname);

		if (toread !== null) {
			// console.log("What's in local storage: "+ toread);
			var storedvalues = JSON.parse(toread);
			data.canto = storedvalues.currentcanto;
			data.lens.right.translation = storedvalues.currenttransright;
			data.lens.left.translation = storedvalues.currenttransleft;
			data.usersettings.twinmode = storedvalues.twinmode;
			data.usersettings.nightmode = storedvalues.nightmode;
			data.usersettings.shownotes = storedvalues.shownotes;
			data.currenttranslationlist = storedvalues.translationset;
			if (data.usersettings.twinmode) {
				dom.addclass("body", "twinmode");
				dom.removeclass("#twinmode", "off");
				dom.addclass("#singlemode", "off");
			} else {
				dom.removeclass("body", "twinmode");
				dom.addclass("#twinmode", "off");
				dom.removeclass("#singlemode", "off");
			}
			if (data.usersettings.nightmode) {
				dom.addclass("body", "nightmode");
				dom.removeclass("#nightmode", "off");
				dom.addclass("#daymode", "off");
			} else {
				dom.removeclass("body", "nightmode");
				dom.addclass("#nightmode", "off");
				dom.removeclass("#daymode", "off");
			}
			if (data.usersettings.shownotes) {
				dom.removeclass("body", "hidenotes");
				dom.removeclass("#shownotes", "off");
				dom.addclass("#hidenotes", "off");
			} else {
				dom.addclass("body", "hidenotes");
				dom.addclass("#shownotes", "off");
				dom.removeclass("#hidenotes", "off");
			}
			/*
   
   // not going to fire this yet.
   
   			data.watch.setlens = {
   				translation: data.currenttranslationlist[helpers.gettranslationindex(data.lens.right.translation)],
   				canto: data.canto,
   				side: "right",
   				percentage: 0,
   				trigger: !data.watch.setlens.trigger
   			};
   */
			// app.setlens(data.currenttranslationlist[helpers.gettranslationindex(data.lens.right.translation)],data.canto,"right",0);
		} else {

			// if we are here, we have no saved data!

			data.canto = 0;
			data.lens.right.translation = data.currenttranslationlist[0];
			data.lens.left.translation = data.currenttranslationlist[0];
			data.usersettings.twinmode = false;
			data.usersettings.nightmode = false;
			data.usersettings.shownotes = true;
			data.watch.setlens = {
				translation: data.currenttranslationlist[0],
				canto: 0,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.currenttranslationlist[0],0,"right",0);
		}

		// second, read any variables in url

		if (helpers.getUrlVars().canto) {
			gotocanto = helpers.getUrlVars().canto;
			cantoflag = true;
		}
		if (helpers.getUrlVars().trans) {
			gototrans = helpers.getUrlVars().trans;
			transflag = true;
		}
		if (helpers.getUrlVars().lefttrans) {
			gotolefttrans = helpers.getUrlVars().lefttrans;
			gototwinmode = true;
		}

		if (cantoflag && transflag) {
			console.log("We have canto & trans from URL!");
			if (gototwinmode) {
				console.log("We have left trans from URL!");
				data.usersettings.twinmode = true;
				dom.addclass("body", "twinmode");
				dom.removeclass("#twinmode", "off");
				dom.addclass("#singlemode", "off");
				data.lens.left.translation = gotolefttrans;
			}
			data.watch.setlens = {
				translation: data.currenttranslationlist[helpers.gettranslationindex(gototrans)],
				canto: gotocanto,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			//			app.setlens(data.currenttranslationlist[helpers.gettranslationindex(gototrans)],gotocanto,"right",0);
		} else {
			console.log("No canto/translation found in URL.");
		}
	}
};

module.exports = localdata;

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// notes.js
//
// This module contains code for dealing with notes if the translation uses them.



var dom = __webpack_require__(1);
var data = __webpack_require__(0);

var notes = {
	setup: function setup() {
		var count = 0;
		var notes = document.querySelectorAll(".note");

		for (var i = 0; i < notes.length; i++) {
			var children = notes[i].children;
			for (var j = 0; j < children.length; j++) {
				if (dom.hasclass(children[j], "notetext")) {
					children[j].setAttribute("data-notenumber", String(count));
				}
				if (dom.hasclass(children[j], "noteno")) {
					children[j].setAttribute("data-notenumber", String(count));
					notes.createclick(children[j]);
				}
			}
			count++;
		}
	},
	createclick: function createclick(el) {
		el.onclick = function (e) {
			e.stopPropagation();

			var thisnote = this.getAttribute("data-notenumber");
			var notetext = document.querySelector(".notetext[data-notenumber=\"" + thisnote + "\"]").innerHTML;
			notes.hide();
			var insert = dom.create("<div class=\"notewindow\" id=\"notewindow\">\n\t\t\t\t\t" + notetext + "\n\t\t\t\t</div>");
			data.elements.main.appendChild(insert);
			document.getElementById("notewindow").onclick = function () {
				notes.hide();
			};
		};
	},
	hide: function hide() {
		dom.removebyselector(".notewindow");
	}
};

module.exports = notes;

/***/ }),
/* 21 */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(13)
  , document = __webpack_require__(2).document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};

/***/ }),
/* 23 */
/***/ (function(module, exports) {

// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

/***/ }),
/* 24 */
/***/ (function(module, exports) {

module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var LIBRARY        = __webpack_require__(54)
  , $export        = __webpack_require__(48)
  , redefine       = __webpack_require__(60)
  , hide           = __webpack_require__(4)
  , has            = __webpack_require__(9)
  , Iterators      = __webpack_require__(10)
  , $iterCreate    = __webpack_require__(52)
  , setToStringTag = __webpack_require__(27)
  , getPrototypeOf = __webpack_require__(57)
  , ITERATOR       = __webpack_require__(3)('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
    , methods, key, IteratorPrototype;
  // Fix native
  if($anyNative){
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
    if(IteratorPrototype !== Object.prototype){
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if(DEF_VALUES && $native && $native.name !== VALUES){
    VALUES_BUG = true;
    $default = function values(){ return $native.call(this); };
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES ? $default : getMethod(VALUES),
      keys:    IS_SET     ? $default : getMethod(KEYS),
      entries: $entries
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

/***/ }),
/* 26 */
/***/ (function(module, exports) {

module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

var def = __webpack_require__(14).f
  , has = __webpack_require__(9)
  , TAG = __webpack_require__(3)('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(2)
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};

/***/ }),
/* 29 */
/***/ (function(module, exports) {

var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// the spine for the book

module.exports = {

	bookname: 'catulluscarmina',
	booktitle: "The Carmina",
	bookauthor: "Caius Valerius Catullus",
	description: "<p>A version of Catullus.</p>",
	versionhistory: [// this is the version history for a particular book, a list
	"0.0.1: first release"],
	comingsoon: // this is what goes in the coming soon section, a single chunk of HTML
	"<p>More translations!</p>",

	cantotitles: [// this is canto sequence
	"Title page", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "VIIII", "X", "XI", "XII", "XIII", "XIIII", "XV", "XVI", "XVII", "XVIII", "XVIIII", "XX", "XXI", "XXII", "XXIII", "XXIIII", "XXV", "XXVI", "XXVII", "XXVIII", "XXVIIII", "XXX", "XXXI", "XXXII", "XXXIII", "XXXIIII", "XXXV", "XXXVI", "XXXVII", "XXXVIII", "XXXVIIII", "XXXX", "XXXXI", "XXXXII", "XXXXIII", "XXXXIIII", "XXXXV", "XXXXVI", "XXXXVII", "XXXXVIII", "XXXXVIIII", "L", "LI", "LII", "LIII", "LIIII", "LV", "LVI", "LVII", "LVIII", "LVIIII", "LX", "LXI", "LXII", "LXIII", "LXIIII", "LXV", "LXVI", "LXVII", "LXVIII", "LXVIIII", "LXX", "LXXI", "LXXII", "LXXIII", "LXXIIII", "LXXV", "LXXVI", "LXXVII", "LXXVIII", "LXXVIIII", "LXXX", "LXXXI", "LXXXII", "LXXXIII", "LXXXIIII", "LXXXV", "LXXXVI", "LXXXVII", "LXXXVIII", "LXXXVIIII", "LXXXX", "LXXXXI", "LXXXXII", "LXXXXIII", "LXXXXIIII", "LXXXXV", "LXXXXVI", "LXXXXVII", "LXXXXVIII", "LXXXXVIIII", "C", "CI", "CII", "CIII", "CIIII", "CV", "CVI", "CVII", "CVIII", "CVIIII", "CX", "CXI", "CXII", "CXIII", "CXIIII", "CXV", "CXVI"],

	translationdata: [// this is translation sequence
	{ "translationid": "catullus",
		"order": 0 }, { "translationid": "burtonsmitherspoetry",
		"order": 1 }, { "translationid": "burtonsmithersprose",
		"order": 2 }],

	textdata: [// set up translations
	__webpack_require__(34), __webpack_require__(32), __webpack_require__(33)]
};

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// version 4: now going to ES6 & Babel
// @//flow



var Fastclick = __webpack_require__(71);
var WatchJS = __webpack_require__(73);

var dom = __webpack_require__(1);
var localdata = __webpack_require__(19);
var fixpadding = __webpack_require__(18);
var resize = __webpack_require__(11);
var controls = __webpack_require__(35);
var setlens = __webpack_require__(36);
var setpage = __webpack_require__(37);

var data = __webpack_require__(0);
var device = {};
var watch = WatchJS.watch;
// var unwatch = WatchJS.unwatch;
// var callWatchers = WatchJS.callWatchers;

var app = {
	initialize: function initialize() {
		// console.log("initializing!");
		this.bindEvents();

		// check to see if there are saved localstorage, if so, take those values
	},
	bindEvents: function bindEvents() {
		// console.log("binding events!");
		var testapp = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;
		var testcordova = !(window.cordova === undefined); // need this as well for dev
		if (testapp && testcordova) {

			// we are on cordova

			document.addEventListener('deviceready', app.onDeviceReady, false);
		} else {

			// evidently we are not on cordova!

			app.setup();
		}

		window.addEventListener("resize", resize.check, false);

		// start fastclick

		if ('addEventListener' in document) {

			// This is firing for non-Cordova – should it?

			document.addEventListener('DOMContentLoaded', function () {
				Fastclick.attach(document.body);
			}, false);
		}
	},
	onDeviceReady: function onDeviceReady() {
		data.system.oncordova = true; // we're running on cordova
		data.system.platform = device.plaform; // should be either "iOS" or "Android"
		console.log(device.cordova);
		console.log("Cordova running. Platform: " + data.system.platform);
		app.setup();
	},
	setup: function setup() {
		// console.log("In setup");

		// basic doc setup

		data.setup();

		// attach watchers to data.watch.setpage and data.watch.setlens

		watch(data.watch, "setpage", function () {
			setpage(data.watch.setpage);
		});

		watch(data.watch, "setlens", function () {
			setlens.go(data.watch.setlens.translation, data.watch.setlens.canto, data.watch.setlens.side, data.watch.setlens.percentage);
		});

		watch(data.watch, "localsave", function () {
			// this is called by inverting the value of data.watch.localsave
			localdata.save();
		});

		document.title = "Cross Dante " + data.booktitle;

		if (data.usersettings.nightmode) {
			dom.addclass("body", "nightmode");
		} else {
			dom.removeclass("body", "nightmode");
		}

		// set up current translation list (initially use all of them)

		for (var i = 0; i < data.translationdata.length; i++) {
			data.currenttranslationlist.push(data.translationdata[i].translationid);
			document.getElementById("textsources").innerHTML += "<li>" + data.translationdata[i].translationfullname + ", <em>" + data.translationdata[i].title + ":</em> " + data.translationdata[i].source + "</li>";
		}

		data.lens.right.translation = data.currenttranslationlist[0];
		if (!data.system.oncordova) {
			// attempt to fix android pull down to refresh
			// code from http://stackoverflow.com/questions/29008194/disabling-androids-chrome-pull-down-to-refresh-feature
			window.addEventListener('load', function () {
				var maybePreventPullToRefresh = false;
				var lastTouchY = 0;
				var touchstartHandler = function touchstartHandler(e) {
					if (e.touches.length != 1) return;
					lastTouchY = e.touches[0].clientY;
					// Pull-to-refresh will only trigger if the scroll begins when the
					// document's Y offset is zero.
					maybePreventPullToRefresh = window.pageYOffset == 0;
				};

				var touchmoveHandler = function touchmoveHandler(e) {
					var touchY = e.touches[0].clientY;
					var touchYDelta = touchY - lastTouchY;
					lastTouchY = touchY;

					if (maybePreventPullToRefresh) {
						// To suppress pull-to-refresh it is sufficient to preventDefault the
						// first overscrolling touchmove.
						maybePreventPullToRefresh = false;
						if (touchYDelta > 0) {
							e.preventDefault();

							if (data.currentpage == "lens" && data.lens.right.text.scrollTop < 1) {
								data.watch.setlens = {
									translation: data.lens.right.translation,
									canto: data.canto - 1,
									side: "right",
									percentage: 1,
									trigger: !data.watch.setlens.trigger
								};
								// app.setlens(data.lens.right.translation, data.canto-1,"right",1);
							}
							return;
						}
					}
				};
				document.addEventListener('touchstart', touchstartHandler, false);
				document.addEventListener('touchmove', touchmoveHandler, false);
			});
		}

		fixpadding.preprocess();

		controls.start(); // this sets up controls
		localdata.read();

		dom.addclass("body", data.bookname);
		dom.addclass("body", data.system.oncordova ? "cordova" : "web");
		dom.removebyselector("#loadingscrim");
		data.watch.setpage = "lens";
	}
};

module.exports = app;

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// catulluscarmina/burtonsmitherspoetry.js
//
// add in notes
module.exports={bookname:'catulluscarmina',author:'Caius Valerius Catullus',translationid:"burtonsmitherspoetry",title:'The Carmina',translation:true,source:'<a href="http://www.gutenberg.org/files/20732/20732-h/20732-h.htm">Project Gutenberg</a>',translationshortname:"Burton/Smithers verse",translationfullname:"Richard Burton & Leonard C. Smithers verse",translationclass:"poetry",text:['<p class="title">The Carmina</p>\n\t<p class="author">Richard Burton &amp; Leonard C. Smithers</p>\n\t<p class="subtitle">(verse translation)</p>','<p class="cantohead">I.</p>\n\t\t<p class="cantosubhead">Dedication to Cornelius Nepos.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Now smooth\u2019d to polish due with pumice dry</p>\n\t\t\t<p>Whereto this lively booklet new give I?</p>\n\t\t\t<p>To thee (Cornelius!); for wast ever fain</p>\n\t\t\t<p>To deem my trifles somewhat boon contain;</p>\n\t\t\t<p>E\u2019en when thou single \u2019mongst Italians found</p>\n\t\t\t<p>Daredst all periods in three Scripts expound</p>\n\t\t\t<p>Learned (by Jupiter!) elaborately.</p>\n\t\t\t<p>Then take thee whatso in this booklet be,</p>\n\t\t\t<p>Such as it is, whereto O Patron Maid</p>\n\t\t\t<p>To live down Ages lend thou lasting aid!</p>\n\t\t</div>','<p class="cantohead">II.</p>\n\t\t<p class="cantosubhead">Lesbia\u2019s Sparrow.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Sparrow! my pet\u2019s delicious joy,</p>\n\t    <p>Wherewith in bosom nurst to toy</p>\n\t    <p>She loves, and gives her finger-tip</p>\n\t    <p>For sharp-nib\u2019d greeding neb to nip,</p>\n\t    <p>Were she who my desire withstood</p>\n\t    <p>To seek some pet of merry mood,</p>\n\t    <p>As crumb o\u2019 comfort for her grief,</p>\n\t    <p>Methinks her burning lowe\u2019s relief:</p>\n\t    <p>Could I, as plays she, play with thee,</p>\n\t    <p>That mind might win from misery free!</p>\n\t    <p class="divider">* * * * *</p>\n\t    <p>To me t\u2019were grateful (as they say),</p>\n\t    <p>Gold codling was to fleet-foot May,</p>\n\t    <p>Whose long-bound zone it loosed for aye.</p>\n\t\t</div>','<p class="cantohead">III.</p>\n\t\t<p class="cantosubhead">On the Death of Lesbia\u2019s Sparrow.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Weep every Venus, and all Cupids wail,</p>\n\t\t\t<p>And men whose gentler spirits still prevail.</p>\n\t\t\t<p>Dead is the Sparrow of my girl, the joy,</p>\n\t\t\t<p>Sparrow, my sweeting\u2019s most delicious toy,</p>\n\t\t\t<p>Whom loved she dearer than her very eyes;</p>\n\t\t\t<p>For he was honeyed-pet and anywise</p>\n\t\t\t<p>Knew her, as even she her mother knew;</p>\n\t\t\t<p>Ne\u2019er from her bosom\u2019s harbourage he flew</p>\n\t\t\t<p>But \u2019round her hopping here, there, everywhere,</p>\n\t\t\t<p>Piped he to none but her his lady fair.</p>\n\t\t\t<p>Now must he wander o\u2019er the darkling way</p>\n\t\t\t<p>Thither, whence life-return the Fates denay.</p>\n\t\t\t<p>But ah! beshrew you, evil Shadows low\u2019ring</p>\n\t\t\t<p>In Orcus ever loveliest things devouring:</p>\n\t\t\t<p>Who bore so pretty a Sparrow fro\u2019 her ta\u2019en.</p>\n\t\t\t<p>(Oh hapless birdie and Oh deed of bane!)</p>\n\t\t\t<p>Now by your wanton work my girl appears</p>\n\t\t\t<p>With turgid eyelids tinted rose by tears.</p>\n\t\t</div>','<p class="cantohead">IIII.</p>\n\t\t<p class="cantosubhead">On his Pinnace.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Yonder Pinnace ye (my guests!) behold</p>\n\t\t\t<p>Saith she was erstwhile fleetest-fleet of crafts,</p>\n\t\t\t<p>Nor could by swiftness of aught plank that swims,</p>\n\t\t\t<p>Be she outstripped, whether paddle plied,</p>\n\t\t\t<p>Or fared she scudding under canvas-sail.</p>\n\t\t\t<p>Eke she defieth threat\u2019ning Adrian shore,</p>\n\t\t\t<p>Dare not denay her, insular Cyclades,</p>\n\t\t\t<p>And noble Rhodos and ferocious Thrace,</p>\n\t\t\t<p>Propontis too and blustering Pontic bight.</p>\n\t\t\t<p>Where she (my Pinnace now) in times before,</p>\n\t\t\t<p>Was leafy woodling on Cyt\xF3rean Chine</p>\n\t\t\t<p>For ever loquent lisping with her leaves.</p>\n\t\t\t<p>Pontic Amastris! Box-tree-clad Cyt\xF3rus!</p>\n\t\t\t<p>Cognisant were ye, and you weet full well</p>\n\t\t\t<p>(So saith my Pinnace) how from earliest age</p>\n\t\t\t<p>Upon your highmost-spiring peak she stood,</p>\n\t\t\t<p>How in your waters first her sculls were dipt,</p>\n\t\t\t<p>And thence thro\u2019 many and many an important strait</p>\n\t\t\t<p>She bore her owner whether left or right,</p>\n\t\t\t<p>Where breezes bade her fare, or Jupiter deigned</p>\n\t\t\t<p>At once propitious strike the sail full square;</p>\n\t\t\t<p>Nor to the sea-shore gods was aught of vow</p>\n\t\t\t<p>By her deemed needful, when from Ocean\u2019s bourne</p>\n\t\t\t<p>Extreme she voyaged for this limpid lake.</p>\n\t\t\t<p>Yet were such things whilome: now she retired</p>\n\t\t\t<p>In quiet age devotes herself to thee</p>\n\t\t\t<p>(O twin-born Castor) twain with Castor\u2019s twin.</p>\n\t\t</div>','<p class="cantohead">V.</p>\n\t\t<p class="cantosubhead">To Lesbia, (of Lesbos&mdash;Clodia?)</p>\n\t\t<div class="stanza">\n\t\t\t<p>Love we (my Lesbia!) and live we our day,</p>\n\t\t\t<p>While all stern sayings crabbed sages say,</p>\n\t\t\t<p>At one doit\u2019s value let us price and prize!</p>\n\t\t\t<p>The Suns can westward sink again to rise</p>\n\t\t\t<p>But we, extinguished once our tiny light,</p>\n\t\t\t<p>Perforce shall slumber through one lasting night!</p>\n\t\t\t<p>Kiss me a thousand times, then hundred more,</p>\n\t\t\t<p>Then thousand others, then a new five-score,</p>\n\t\t\t<p>Still other thousand other hundred store.</p>\n\t\t\t<p>Last when the sums to many thousands grow,</p>\n\t\t\t<p>The tale let\u2019s trouble till no more we know,</p>\n\t\t\t<p>Nor envious wight despiteful shall misween us</p>\n\t\t\t<p>Knowing how many kisses have been kissed between us.</p>\n\t\t</div>','<p class="cantohead">VI.</p>\n\t\t<p class="cantosubhead">To Flavius: Mis-speaking his Mistress.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Thy Charmer (Flavius!) to Catullus\u2019 ear</p>\n\t\t\t<p>Were she not manner\u2019d mean and worst in wit</p>\n\t\t\t<p>Perforce thou hadst praised nor couldst silence keep.</p>\n\t\t\t<p>But some enfevered jade, I wot-not-what,</p>\n\t\t\t<p>Some piece thou lovest, blushing this to own.</p>\n\t\t\t<p>For, nowise \u2019customed widower nights to lie</p>\n\t\t\t<p>Thou \u2019rt ever summoned by no silent bed</p>\n\t\t\t<p>With flow\u2019r-wreaths fragrant and with Syrian oil,</p>\n\t\t\t<p>By mattress, bolsters, here, there, everywhere</p>\n\t\t\t<p>Deep-dinted, and by quaking, shaking couch</p>\n\t\t\t<p>All crepitation and mobility.</p>\n\t\t\t<p>Explain! none whoredoms (no!) shall close my lips.</p>\n\t\t\t<p>Why? such outfuttered flank thou ne\u2019er wouldst show</p>\n\t\t\t<p>Had not some fulsome work by thee been wrought.</p>\n\t\t\t<p>Then what thou holdest, boon or bane be pleased</p>\n\t\t\t<p>Disclose! For thee and thy beloved fain would I</p>\n\t\t\t<p>Upraise to Heaven with my liveliest lay.</p>\n\t\t</div>','<p class="cantohead">VII.</p>\n\t\t<p class="cantosubhead">To Lesbia still Beloved.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Thou ask\u2019st How many kissing bouts I bore</p>\n\t\t\t<p>From thee (my Lesbia!) or be enough or more?</p>\n\t\t\t<p>I say what mighty sum of Lybian-sands</p>\n\t\t\t<p>Confine Cyrene\u2019s Laserpitium-lands</p>\n\t\t\t<p>\u2019Twixt Oracle of Jove the Swelterer</p>\n\t\t\t<p>And olden Battus\u2019 holy Sepulchre,</p>\n\t\t\t<p>Or stars innumerate through night-stillness ken</p>\n\t\t\t<p>The stolen Love-delights of mortal men,</p>\n\t\t\t<p>For that to kiss thee with unending kisses</p>\n\t\t\t<p>For mad Catullus enough and more be this,</p>\n\t\t\t<p>Kisses nor curious wight shall count their tale,</p>\n\t\t\t<p>Nor to bewitch us evil tongue avail.</p>\n\t\t</div>','<p class="cantohead">VIII.</p>\n\t\t<p class="cantosubhead">To Himself recounting Lesbia\u2019s Inconstancy.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Woe-full Catullus! cease to play the fool</p>\n\t\t\t<p>And what thou seest dead as dead regard!</p>\n\t\t\t<p>Whil\xF2me the sheeniest suns for thee did shine</p>\n\t\t\t<p>When oft-a-tripping whither led the girl</p>\n\t\t\t<p>By us belov\xE8d, as shall none be loved.</p>\n\t\t\t<p>There all so merry doings then were done</p>\n\t\t\t<p>After thy liking, nor the girl was loath.</p>\n\t\t\t<p>Then cert\xE8s sheeniest suns for thee did shine.</p>\n\t\t\t<p>Now she\u2019s unwilling: thou too (hapless!) will</p>\n\t\t\t<p>Her flight to follow, and sad life to live:</p>\n\t\t\t<p>Endure with stubborn soul and still obdure.</p>\n\t\t\t<p>Damsel, adieu! Catullus obdurate grown</p>\n\t\t\t<p>Nor seeks thee, neither asks of thine unwill;</p>\n\t\t\t<p>Yet shalt thou sorrow when none woos thee more;</p>\n\t\t\t<p>Reprobate! Woe to thee! What life remains?</p>\n\t\t\t<p>Who now shall love thee? Who\u2019ll think thee fair?</p>\n\t\t\t<p>Whom now shalt ever love? Whose wilt be called?</p>\n\t\t\t<p>To whom shalt kisses give? whose liplets nip?</p>\n\t\t\t<p>But thou (Catullus!) destiny-doomed obdure.</p>\n\t\t</div>','<p class="cantohead">VIIII.</p>\n\t\t<p class="cantosubhead">To Veranius returned from Travel.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Veranius! over every friend of me</p>\n\t\t\t<p>Forestanding, owned I hundred thousands three,</p>\n\t\t\t<p>Home to Penates and to single-soul\u2019d</p>\n\t\t\t<p>Brethren, returned art thou and mother old?</p>\n\t\t\t<p>Yes, thou art come. Oh, winsome news come well!</p>\n\t\t\t<p>Now shall I see thee, safely hear thee tell</p>\n\t\t\t<p>Of sites Iberian, deeds and nations \u2019spied,</p>\n\t\t\t<p>(As be thy wont) and neck-a-neck applied</p>\n\t\t\t<p>I\u2019ll greet with kisses thy glad lips and eyne.</p>\n\t\t\t<p>Oh! Of all mortal men beatified</p>\n\t\t\t<p>Whose joy and gladness greater be than mine?</p>\n\t\t</div>','<p class="cantohead">X.</p>\n\t\t<p class="cantosubhead">He meets Varus and Mistress.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Led me my Varus to his flame,</p>\n\t\t\t<p>As I from Forum idling came.</p>\n\t\t\t<p>Forthright some whorelet judged I it</p>\n\t\t\t<p>Nor lacking looks nor wanting wit,</p>\n\t\t\t<p>When hied we thither, mid us three</p>\n\t\t\t<p>Fell various talk, as how might be</p>\n\t\t\t<p>Bithynia now, and how it fared,</p>\n\t\t\t<p>And if some coin I made or spared.</p>\n\t\t\t<p>\u201CThere was no cause\u201D (I soothly said)</p>\n\t\t\t<p>\u201CThe Pr\xE6tors or the Cohort made</p>\n\t\t\t<p>Thence to return with oilier head;</p>\n\t\t\t<p>The more when ruled by &mdash;&mdash;</p>\n\t\t\t<p>Pr\xE6tor, as pile the Cohort rating.\u201D</p>\n\t\t\t<p>Quoth they, \u201CBut cert\xE8s as \u2019twas there</p>\n\t\t\t<p>The custom rose, some men to bear</p>\n\t\t\t<p>Litter thou boughtest?\u201D I to her</p>\n\t\t\t<p>To seem but richer, wealthier,</p>\n\t\t\t<p>Cry, \u201CNay, with me \u2019twas not so ill</p>\n\t\t\t<p>That, given the Province suffered, still</p>\n\t\t\t<p>Eight stiff-backed loons I could not buy.\u201D</p>\n\t\t\t<p>(Withal none here nor there owned I</p>\n\t\t\t<p>Who broken leg of Couch outworn</p>\n\t\t\t<p>On nape of neck had ever borne!)</p>\n\t\t\t<p>Then she, as pathic piece became,</p>\n\t\t\t<p>\u201CPrithee Catullus mine, those same</p>\n\t\t\t<p>Lend me, Serapis-wards I\u2019d hie.\u201D</p>\n\t\t\t<p class="divider">* * * * *</p>\n\t\t\t<p>\u201CEasy, on no-wise, no,\u201D quoth I,</p>\n\t\t\t<p>\u201CWhate\u2019er was mine, I lately said</p>\n\t\t\t<p>Is some mistake, my camarade</p>\n\t\t\tOne Cinna&mdash;Gaius&mdash;bought the lot,</p>\n\t\t\t<p>But his or mine, it matters what?</p>\n\t\t\t<p>I use it freely as though bought,</p>\n\t\t\t<p>Yet thou, pert troubler, most absurd,</p>\n\t\t\t<p>None suffer\u2019st speak an idle word.\u201D</p>\n\t\t</div>','<p class="cantohead">XI.</p>\n\t\t<p class="cantosubhead">A Parting Insult to Lesbia.</p>\n\t\t<div class="stanza">\n\t\t\t<p>Furius and Aurelius, Catullus\u2019 friends,</p>\n\t\t\t<p class="slindent">Whether extremest Indian shore he brave,</p>\n\t\t\t<p>Strands where far-resounding billow rends</p>\n\t\t\t<p class="slindent8em">The shattered wave,</p>\n\t\t\t<p>Or \u2019mid Hyrcanians dwell he, Arabs soft and wild,</p>\n\t\t\t<p class="slindent">Sac\xE6 and Parthians of the arrow fain,</p>\n\t\t\t<p>Or where the Seven-mouth\u2019d Nilus mud-defiled</p>\n\t\t\t<p class="slindent8em">Tinges the Main,</p>\n\t\t\t<p>Or climb he lofty Alpine Crest and note</p>\n\t\t\t<p class="slindent">Works monumental, C\xE6sar\u2019s grandeur telling,</p>\n\t\t\t<p>Rhine Gallic, horrid Ocean and remote</p>\n\t\t\t<p class="slindent8em">Britons low-dwelling;</p>\n\t\t\t<p>All these (whatever shall the will design</p>\n\t\t\t<p class="slindent">Of Heaven-homed Gods) Oh ye prepared to tempt;</p>\n\t\t\t<p>Announce your briefest to that damsel mine</p>\n\t\t\t<p class="slindent8em">In words unkempt:&mdash;</p>\n\t\t\t<p>Live she and love she wenchers several,</p>\n\t\t\t<p class="slindent">Embrace three hundred wi\u2019 the like requitals,</p>\n\t\t\t<p>None truly loving and withal of all</p>\n\t\t\t<p class="slindent8em">Bursting the vitals:</p>\n\t\t\t<p>My love regard she not, my love of yore,</p>\n\t\t\t<p class="slindent">Which fell through fault of her, as falls the fair</p>\n\t\t\t<p>Last meadow-floret whenas passed it o\u2019er</p>\n\t\t\t<p class="slindent8em">Touch of the share.</p>\n\t\t</div>','<p class="cantohead">XII.</p>\n\t\t<p class="cantosubhead">To M. Asinius who Stole Napery.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Marr\xFAcinus Asinius! ill thou usest</p>\n\t\t      <p>That hand sinistral in thy wit and wine</p>\n\t\t      <p>Filching the napkins of more heedless hosts.</p>\n\t\t      <p>Dost find this funny? Fool it passeth thee</p>\n\t\t      <p>How \u2019tis a sordid deed, a sorry jest.</p>\n\t\t      <p>Dost misbelieve me? Trust to Pollio,</p>\n\t\t      <p>Thy brother, ready to compound such thefts</p>\n\t\t      <p>E\u2019en at a talent\u2019s cost; for he\u2019s a youth</p>\n\t\t      <p>In speech past master and in fair pleasantries.</p>\n\t\t      <p>Of hendecasyllabics hundreds three</p>\n\t\t      <p>Therefore expect thou, or return forthright</p>\n\t\t      <p>Linens whose loss affects me not for worth</p>\n\t\t      <p>But as mementoes of a comrade mine.</p>\n\t\t      <p>For napkins S\xE6taban from Ebro-land</p>\n\t\t      <p>Fab\xFAllus sent me a free-giftie given</p>\n\t\t      <p>Also Ver\xE1nius: these perforce I love</p>\n\t\t      <p>E\u2019en as my Verani\xF3lus and Fab\xFAllus.</p>\n\t\t    </div>','<p class="cantohead">XIII.</p>\n\t\t<p class="cantosubhead">Fabullus is Invited to a Poet\u2019s Supper.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Thou\u2019lt sup right well with me, Fab\xFAllus mine,</p>\n\t\t      <p>In days few-numbered an the Gods design,</p>\n\t\t      <p>An great and goodly meal thou bring wi\u2019 thee</p>\n\t\t      <p>Nowise forgetting damsel bright o\u2019 blee,</p>\n\t\t      <p>With wine, and salty wit and laughs all-gay.</p>\n\t\t      <p>An these my bonny man, thou bring, I say</p>\n\t\t      <p>Thou\u2019lt sup right well, for thy Catullus\u2019 purse</p>\n\t\t      <p>Save web of spider nothing does imburse.</p>\n\t\t      <p>But thou in countergift mere loves shalt take</p>\n\t\t      <p>Or aught of sweeter taste or fairer make:</p>\n\t\t      <p>I\u2019ll give thee unguent lent my girl to scent</p>\n\t\t      <p>By every Venus and all Cupids sent,</p>\n\t\t      <p>Which, as thou savour, pray Gods interpose</p>\n\t\t      <p>And thee, Fab\xFAllus, make a Naught-but-nose.</p>\n\t\t    </div>','<p class="cantohead">XIIII.</p>\n\t\t<p class="cantosubhead">To Calvus, acknowledging his Poems.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Did I not liefer love thee than my eyes</p>\n\t\t      <p>(Winsomest Calvus!), for that gift of thine</p>\n\t\t      <p>Cert\xE8s I\u2019d hate thee with Vatinian hate.</p>\n\t\t      <p>Say me, how came I, or by word or deed,</p>\n\t\t      <p>To cause thee plague me with so many a bard?</p>\n\t\t      <p>The Gods deal many an ill to such a client,</p>\n\t\t      <p>Who sent of impious wights to thee such crowd.</p>\n\t\t      <p>But if (as guess I) this choice boon new-found</p>\n\t\t      <p>To thee from \u201CCommentator\u201D Sulla come,</p>\n\t\t      <p>None ill I hold it&mdash;well and welcome \u2019tis,</p>\n\t\t      <p>For that thy labours ne\u2019er to death be doom\u2019d.</p>\n\t\t      <p>Great Gods! What horrid booklet damnable</p>\n\t\t      <p>Unto thine own Catullus thou (perdie!)</p>\n\t\t      <p>Did send, that ever day by day die he</p>\n\t\t      <p>In Saturnalia, first of festivals.</p>\n\t\t      <p>No! No! thus shall\u2019t not pass wi\u2019 thee, sweet wag,</p>\n\t\t      <p>For I at dawning day will scour the booths</p>\n\t\t      <p>Of bibliopoles, Aquinii, C\xE6sii and</p>\n\t\t      <p>Suffenus, gather all their poison-trash</p>\n\t\t      <p>And with such torments pay thee for thy pains.</p>\n\t\t      <p>Now for the present hence, adieu! begone</p>\n\t\t      <p>Thither, whence came ye, brought by luckless feet,</p>\n\t\t      <p>Pests of the Century, ye pernicious Poets.</p>\n\t\t    </div>\n\t\t<p class="cantohead">XIIII <em>b</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>An of my trifles peradventure chance</p>\n\t\t      <p>You to be readers, and the hands of you</p>\n\t\t      <p>Without a shudder unto us be offer\u2019d</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t    </div>','<p class="cantohead">XV.</p>\n\t\t<p class="cantosubhead">To Aurelius&mdash;Hands off the Boy!</p>\n\t\t    <div class="stanza">\n\t\t      <p>To thee I trust my loves and me,</p>\n\t\t      <p>(Aurelius!) craving modesty.</p>\n\t\t      <p>That (if in mind didst ever long</p>\n\t\t      <p>To win aught chaste unknowing wrong)</p>\n\t\t      <p>Then guard my boy in purest way.</p>\n\t\t      <p>From folk I say not: naught affray</p>\n\t\t      <p>The crowds wont here and there to run</p>\n\t\t      <p>Through street-squares, busied every one;</p>\n\t\t      <p>But thee I dread nor less thy penis</p>\n\t\t      <p>Fair or foul, younglings\u2019 foe I ween is!</p>\n\t\t      <p>Wag it as wish thou, at its will,</p>\n\t\t      <p>When out of doors its hope fulfil;</p>\n\t\t      <p>Him bar I, modestly, methinks.</p>\n\t\t      <p>But should ill-mind or lust\u2019s high jinks</p>\n\t\t      <p>Thee (Sinner!), drive to sin so dread,</p>\n\t\t      <p>That durst ensnare our dearling\u2019s head,</p>\n\t\t      <p>Ah! woe\u2019s thee (wretch!) and evil fate,</p>\n\t\t      <p>Mullet and radish shall pierce and grate,</p>\n\t\t      <p>When feet-bound, haled through yawning gate.</p>\n\t\t    </div>','<p class="cantohead">XVI.</p>\n\t\t<p class="cantosubhead">To Aurelius and Furius in Defence of His Muse\u2019s Honesty.</p>\n\t\t    <div class="stanza">\n\t\t      <p>I\u2019ll &mdash;&mdash; you twain and &mdash;&mdash;</p>\n\t\t      <p>Pathic Aur\xE9lius! F\xFArius, libertines!</p>\n\t\t      <p>Who durst determine from my versicles</p>\n\t\t      <p>Which seem o\u2019er softy, that I\u2019m scant of shame.</p>\n\t\t      <p>For pious poet it behoves be chaste</p>\n\t\t      <p>Himself; no chastity his verses need;</p>\n\t\t      <p>Nay, gain they finally more salt of wit</p>\n\t\t      <p>When over softy and of scanty shame,</p>\n\t\t      <p>Apt for exciting somewhat prurient,</p>\n\t\t      <p>In boys, I say not, but in bearded men</p>\n\t\t      <p>Who fail of movements in their hardened loins.</p>\n\t\t      <p>Ye who so many thousand kisses sung</p>\n\t\t      <p>Have read, deny male masculant I be?</p>\n\t\t      <p>You twain I\u2019ll &mdash;&mdash; and &mdash;&mdash;</p>\n\t\t    </div>','<p class="cantohead">XVII.</p>\n\t\t<p class="cantosubhead">Of a \u201CPredestined\u201D Husband.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Colony! fain to display thy games on length of thy town-bridge!</p>\n\t\t      <p>There, too, ready to dance, though fearing the shaking of crazy</p>\n\t\t      <p>Logs of the Bridgelet propt on pier-piles newly renew\xE8d,</p>\n\t\t      <p>Lest supine all sink deep-merged in the marish\u2019s hollow,</p>\n\t\t      <p>So may the bridge hold good when builded after thy pleasure</p>\n\t\t      <p>Where Salis\xFAbulus\u2019 rites with solemn function are sacred,</p>\n\t\t      <p>As thou (Colony!) grant me boon of mightiest laughter.</p>\n\t\t      <p>Certain a townsman mine I\u2019d lief see thrown from thy gangway</p>\n\t\t      <p>Hurl\xE8d head over heels precipitous whelmed in the quagmire,</p>\n\t\t      <p>Where the lake and the boglands are most rotten and stinking,</p>\n\t\t      <p>Deepest and lividest lie, the swallow of hollow voracious.</p>\n\t\t      <p>Witless surely the wight whose sense is less than of boy-babe</p>\n\t\t      <p>Two-year-old and a-sleep on trembling forearm of father.</p>\n\t\t      <p>He though wedded to girl in greenest bloom of her youth-tide,</p>\n\t\t      <p>(Bride-wife daintier bred than ever was delicate kidlet,</p>\n\t\t      <p>Worthier diligent watch than grape-bunch blackest and ripest)</p>\n\t\t      <p>Suffers her sport as she please nor rates her even at hair\u2019s worth,</p>\n\t\t      <p>Nowise \u2019stirring himself, but lying log-like as alder</p>\n\t\t      <p>Felled and o\u2019er floating the fosse of safe Ligurian woodsman,</p>\n\t\t      <p>Feeling withal, as though such spouse he never had own\u2019d;</p>\n\t\t      <p>So this marvel o\u2019 mine sees naught, and nothing can hear he,</p>\n\t\t      <p>What he himself, an he be or not be, wholly unknowing.</p>\n\t\t      <p>Now would I willingly pitch such wight head first fro\u2019 thy bridge,</p>\n\t\t      <p>Better a-sudden t\u2019arouse that numskull\u2019s stolid old senses,</p>\n\t\t      <p>Or in the sluggish mud his soul supine to deposit</p>\n\t\t      <p>Even as she-mule casts iron shoe where quagmire is stiffest.</p>\n\t\t    </div>','<p class="cantohead">XVIII.</p>\n\t\t<p class="cantosubhead">To Priapus, the Garden-God.</p>\n\t\t    <div class="stanza">\n\t\t      <p>This grove to thee devote I give, Priapus!</p>\n\t\t      <p>Who home be Lampsacus and holt, Priapus!</p>\n\t\t      <p>For thee in cities worship most the shores</p>\n\t\t      <p>Of Hellespont the richest oystery strand.</p>\n\t\t    </div>','<p class="cantohead">XVIIII.</p>\n\t\t<p class="cantosubhead">To Priapus.</p>\n\t\t    <div class="stanza">\n\t\t      <p>This place, O youths, I protect, nor less this turf-builded cottage,</p>\n\t\t      <p>Roofed with its osier-twigs and thatched with its bundles of sedges;</p>\n\t\t      <p>I from the dried oak hewn and fashioned with rustical hatchet,</p>\n\t\t      <p>Guarding them year by year while more are they evermore thriving.</p>\n\t\t      <p>For here be owners twain who greet and worship my Godship,</p>\n\t\t      <p>He of the poor hut lord and his son, the pair of them peasants:</p>\n\t\t      <p>This with assiduous toil aye works the thicketty herbage</p>\n\t\t      <p>And the coarse water-grass to clear afar from my chapel:</p>\n\t\t      <p>That with his open hand ever brings me offerings humble.</p>\n\t\t      <p>Hung up in honour mine are flowery firstlings of spring-tide,</p>\n\t\t      <p>Wreaths with their ears still soft the tender stalklets a-crowning;</p>\n\t\t      <p>Violets pale are mine by side of the poppy-head pallid;</p>\n\t\t      <p>With the dull yellow gourd and apples sweetest of savour;</p>\n\t\t      <p>Lastly the blushing grape disposed in shade of the vine-tree.</p>\n\t\t      <p>Anon mine altar (this same) with blood (but you will be silent!)</p>\n\t\t      <p>Bearded kid and anon some horny-hoofed nanny shall sprinkle.</p>\n\t\t      <p>Wherefore Priapus is bound to requite such honours by service,</p>\n\t\t      <p>Doing his duty to guard both vineyard and garth of his lordling.</p>\n\t\t      <p>Here then, O lads, refrain from ill-mannered picking and stealing:</p>\n\t\t      <p>Rich be the neighbour-hind and negligent eke his Priapus:</p>\n\t\t      <p>Take what be his: this path hence leadeth straight to his ownings.</p>\n\t\t    </div>','<p class="cantohead">XX.</p>\n\t\t<p class="cantosubhead">To Priapus.</p>\n\t\t    <div class="stanza">\n\t\t      <p>I thuswise fashion\xE8d by rustic art</p>\n\t\t      <p>And from dried poplar-trunk (O traveller!) hewn,</p>\n\t\t      <p>This fieldlet, leftwards as thy glances fall,</p>\n\t\t      <p>And my lord\u2019s cottage with his pauper garth</p>\n\t\t      <p>Protect, repelling thieves\u2019 rapacious hands.</p>\n\t\t      <p>In spring with vari-coloured wreaths I\u2019m crown\u2019d,</p>\n\t\t      <p>In fervid summer with the glowing grain,</p>\n\t\t      <p>Then with green vine-shoot and the luscious bunch,</p>\n\t\t      <p>And glaucous olive-tree in bitter cold.</p>\n\t\t      <p>The dainty she-goat from my pasture bears</p>\n\t\t      <p>Her milk-distended udders to the town:</p>\n\t\t      <p>Out of my sheep-cotes ta\u2019en the fatted lamb</p>\n\t\t      <p>Sends home with silver right-hand heavily charged;</p>\n\t\t      <p>And, while its mother lows, the tender calf</p>\n\t\t      <p>Before the temples of the Gods must bleed.</p>\n\t\t      <p>Hence of such Godhead, (traveller!) stand in awe,</p>\n\t\t      <p>Best it befits thee off to keep thy hands.</p>\n\t\t      <p>Thy cross is ready, shaped as artless yard;</p>\n\t\t      <p>\u201CI\u2019m willing, \u2019faith\u201D (thou say\u2019st) but \u2019faith here comes</p>\n\t\t      <p>The boor, and plucking forth with bended arm</p>\n\t\t      <p>Makes of this tool a club for doughty hand.</p>\n\t\t    </div>','<p class="cantohead">XXI.</p>\n\t\t<p class="cantosubhead">To Aurelius the Skinflint.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Aurelius, father of the famisht crew,</p>\n\t\t      <p>Not sole of starvelings now, but wretches who</p>\n\t\t      <p>Were, are, or shall be in the years to come,</p>\n\t\t      <p>My love, my dearling, fain art thou to strum.</p>\n\t\t      <p>Nor privately; for nigh thou com\u2019st and jestest</p>\n\t\t      <p>And to his side close-sticking all things questest.</p>\n\t\t      <p>\u2019Tis vain: while lay\u2019st thou snares for me the worst,</p>\n\t\t      <p>By &mdash;&mdash; I will teach thee first.</p>\n\t\t      <p>An food-full thus do thou, my peace I\u2019d keep:</p>\n\t\t      <p>But what (ah me! ah me!) compels me weep</p>\n\t\t      <p>Are thirst and famine to my dearling fated.</p>\n\t\t      <p>Cease thou so doing while as modest rated,</p>\n\t\t      <p>Lest to thy will thou win&mdash;but &mdash;&mdash;</p>\n\t\t    </div>','<p class="cantohead">XXII.</p>\n\t\t<p class="cantosubhead">To Varus abusing Suffenus.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Varus, yon wight Suffenus known to thee</p>\n\t\t      <p>Fairly for wit, free talk, urbanity,</p>\n\t\t      <p>The same who scribbles verse in amplest store&mdash;</p>\n\t\t      <p>Methinks he fathers thousands ten or more</p>\n\t\t      <p>Indited not as wont on palimpsest,</p>\n\t\t      <p>But paper-royal, brand-new boards, and best</p>\n\t\t      <p>Fresh bosses, crimson ribbands, sheets with lead</p>\n\t\t      <p>Ruled, and with pumice-powder all well polished.</p>\n\t\t      <p>These as thou readest, seem that fine, urbane</p>\n\t\t      <p>Suffenus, goat-herd mere, or ditcher-swain</p>\n\t\t      <p>Once more, such horrid change is there, so vile.</p>\n\t\t      <p>What must we wot thereof? a Droll erst while,</p>\n\t\t      <p>Or (if aught) cleverer, he with converse meets,</p>\n\t\t      <p>He now in dullness, dullest villain beats</p>\n\t\t      <p>Forthright on handling verse, nor is the wight</p>\n\t\t      <p>Ever so happy as when verse he write:</p>\n\t\t      <p>So self admires he with so full delight.</p>\n\t\t      <p>In sooth, we all thus err, nor man there be</p>\n\t\t      <p>But in some matter a Suffenus see</p>\n\t\t      <p>Thou canst: his lache allotted none shall lack</p>\n\t\t      <p>Yet spy we nothing of our back-borne pack.</p>\n\t\t    </div>','<p class="cantohead">XXIII.</p>\n\t\t<p class="cantosubhead">To Furius satirically praising his Poverty.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Furius! Nor chest, nor slaves can claim,</p>\n\t\t      <p>Bug, Spider, nor e\u2019en hearth aflame,</p>\n\t\t      <p>Yet thine a sire and step-dame who</p>\n\t\t      <p>Wi\u2019 tooth can ever flint-food chew!</p>\n\t\t      <p>So thou, and pleasant happy life</p>\n\t\t      <p>Lead wi\u2019 thy parent\u2019s wooden wife.</p>\n\t\t      <p>Nor this be marvel: hale are all,</p>\n\t\t      <p>Well ye digest; no fears appal</p>\n\t\t      <p>For household-arsons, heavy ruin,</p>\n\t\t      <p>Plunderings impious, poison-brewin\u2019</p>\n\t\t      <p>Or other parlous case forlorn.</p>\n\t\t      <p>Your frames are hard and dried like horn,</p>\n\t\t      <p>Or if more arid aught ye know,</p>\n\t\t      <p>By suns and frosts and hunger-throe.</p>\n\t\t      <p>Then why not happy as thou\u2019rt hale?</p>\n\t\t      <p>Sweat\u2019s strange to thee, spit fails, and fail</p>\n\t\t      <p>Phlegm and foul snivel from the nose.</p>\n\t\t      <p>Add cleanness that aye cleanlier shows</p>\n\t\t      <p>A bum than salt-pot cleanlier,</p>\n\t\t      <p>Nor ten times cack\u2019st in total year,</p>\n\t\t      <p>And harder \u2019tis than pebble or bean</p>\n\t\t      <p>Which rubbed in hand or crumbled, e\u2019en</p>\n\t\t      <p>On finger ne\u2019er shall make unclean.</p>\n\t\t      <p>Such blessings (Furius!) such a prize</p>\n\t\t      <p>Never belittle nor despise;</p>\n\t\t      <p>Hundred sesterces seek no more</p>\n\t\t      <p>With wonted prayer&mdash;enow\u2019s thy store!</p>\n\t\t    </div>','<p class="cantohead">XXIIII.</p>\n\t\t<p class="cantosubhead">To Juventius concerning the Choice of a Friend.</p>\n\t\t    <div class="stanza">\n\t\t      <p>O of Juventian youths the flowret fair</p>\n\t\t      <p>Not of these only, but of all that were</p>\n\t\t      <p>Or shall be, coming in the coming years,</p>\n\t\t      <p>Better waste Midas\u2019 wealth (to me appears)</p>\n\t\t      <p>On him that owns nor slave nor money-chest</p>\n\t\t      <p>Than thou shouldst suffer by his love possest.</p>\n\t\t      <p>\u201CWhat! is he vile or not fair?\u201D \u201CYes!\u201D I attest,</p>\n\t\t      <p>\u201CYet owns this man so comely neither slaves nor chest</p>\n\t\t      <p>My words disdain thou or accept at best</p>\n\t\t      <p>Yet neither slave he owns nor money-chest.\u201D</p>\n\t\t    </div>','<p class="cantohead">XXV.</p>\n\t\t<p class="cantosubhead">Address to Thallus the Napery-Thief.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Thou bardache Thallus! more than Coney\u2019s robe</p>\n\t\t      <p>Soft, or goose-marrow or ear\u2019s lowmost lobe,</p>\n\t\t      <p>Or Age\u2019s languid yard and cobweb\u2019d part,</p>\n\t\t      <p>Same Thallus greedier than the gale thou art,</p>\n\t\t      <p>When the Kite-goddess shows thee Gulls agape,</p>\n\t\t      <p>Return my muffler thou hast dared to rape,</p>\n\t\t      <p>Saetaban napkins, tablets of Thynos, all</p>\n\t\t      <p>Which (Fool!) ancestral heirlooms thou didst call.</p>\n\t\t      <p>These now unglue-ing from thy claws restore,</p>\n\t\t      <p>Lest thy soft hands, and floss-like flanklets score</p>\n\t\t      <p>The burning scourges, basely signed and lined,</p>\n\t\t      <p>And thou unwonted toss like wee barque tyned</p>\n\t\t      <p>\u2019Mid vasty Ocean vexed by madding wind!</p>\n\t\t    </div>','<p class="cantohead">XXVI.</p>\n\t\t<p class="cantosubhead">Catullus concerning his Villa.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Furius! our Villa never Austral force</p>\n\t\t      <p>Broke, neither set thereon Favonius\u2019 course,</p>\n\t\t      <p>Nor savage Boreas, nor Epeliot\u2019s strain,</p>\n\t\t      <p>But fifteen thousand crowns and hundreds twain</p>\n\t\t      <p>Wreckt it,&mdash;Oh ruinous by-wind, breezy bane!</p>\n\t\t    </div>','<p class="cantohead">XXVII.</p>\n\t\t<p class="cantosubhead">To his Cup-Boy.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Thou youngling drawer of Falernian old</p>\n\t\t      <p>Crown me the goblets with a bitterer wine</p>\n\t\t      <p>As was Postumia\u2019s law that rules the feast</p>\n\t\t      <p>Than ebriate grape-stone more inebriate.</p>\n\t\t      <p>But ye fare whither please ye (water-nymphs!)</p>\n\t\t      <p>To wine pernicious, and to sober folk</p>\n\t\t      <p>Migrate ye: mere Thyonian juice be here!</p>\n\t\t    </div>','<p class="cantohead">XXVIII.</p>\n\t\t<p class="cantosubhead">To Friends on Return from Travel.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Followers of Piso, empty band</p>\n\t\t      <p>With your light budgets packt to hand,</p>\n\t\t      <p>Ver\xE1nius best! Fab\xFAllus mine!</p>\n\t\t      <p>What do ye? Bore ye enough, in fine</p>\n\t\t      <p>Of frost and famine with yon sot?</p>\n\t\t      <p>What loss or gain have haply got</p>\n\t\t      <p>Your tablets? so, whenas I ranged</p>\n\t\t      <p>With Praetor, gains for loss were changed.</p>\n\t\t      <p>\u201CO Memmius! thou did\u2019st long and late</p>\n\t\t      <p>&mdash;&mdash; me supine slow and &mdash;&mdash;\u201D</p>\n\t\t      <p>But (truly see I) in such case</p>\n\t\t      <p>Diddled you were by wight as base</p>\n\t\t      <p>Sans mercy. Noble friends go claim!</p>\n\t\t      <p>Now god and goddess give you grame</p>\n\t\t      <p>Disgrace of Romulus! Remus\u2019 shame!</p>\n\t\t    </div>','<p class="cantohead">XXVIIII.</p>\n\t\t<p class="cantosubhead">To C\xE6sar of Mamurra, called Mentula.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Who e\u2019er could witness this (who could endure</p>\n\t\t      <p>Except the lewdling, dicer, greedy-gut)</p>\n\t\t      <p>That should Mamurra get what hairy Gaul</p>\n\t\t      <p>And all that farthest Britons held whil\xF2me?</p>\n\t\t      <p>(Thou bardache Romulus!) this wilt see and bear?</p>\n\t\t      <p>Then art a lewdling, dicer, greedy-gut!</p>\n\t\t      <p>He now superb with pride superfluous</p>\n\t\t      <p>Shall go perambulate the bedrooms all</p>\n\t\t      <p>Like white-robed dovelet or Adonis-love.</p>\n\t\t      <p>Romulus thou bardache! this wilt see and bear?</p>\n\t\t      <p>Then art a lewdling, dicer, greedy-gut!</p>\n\t\t      <p>Is\u2019t for such like name, sole Emperor thou!</p>\n\t\t      <p>Thou soughtest extreme Occidental Isle?</p>\n\t\t      <p>That this your &mdash;&mdash; Mentula</p>\n\t\t      <p>Millions and Milliards might at will absorb?</p>\n\t\t      <p>What is\u2019t but Liberality misplaced?</p>\n\t\t      <p>What trifles wasted he, small heirlooms spent?</p>\n\t\t      <p>First his paternal goods were clean dispersed;</p>\n\t\t      <p>Second went Pontus\u2019 spoils and for the third,&mdash;</p>\n\t\t      <p>Ebro-land,&mdash;weets it well gold-rolling Tage.</p>\n\t\t      <p>Fear him the Gallias? Him the Britons\u2019 fear?</p>\n\t\t      <p>Why cherish this ill-wight? what \u2019vails he do?</p>\n\t\t      <p>Save fat paternal heritage devour?</p>\n\t\t      <p>Lost ye for such a name, O puissant pair</p>\n\t\t      <p>(Father and Son-in-law), our all-in-all?</p>\n\t\t    </div>','<p class="cantohead">XXX.</p>\n\t\t<p class="cantosubhead">To Alfenus the Perjuror.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Alf\xE9nus! short of memory, false to comrades dearest-dear,</p>\n\t\t      <p>Now hast no pity (hardened Soul!) for friend and loving fere?</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Now to betray me, now to guile thou (traitor!) ne\u2019er dost pause?</p>\n\t\t      <p>Yet impious feats of fraudful men ne\u2019er force the Gods\u2019 applause:</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>When heed\u2019st thou not deserting me (Sad me!) in sorest scathe,</p>\n\t\t      <p>Ah say whate\u2019er shall humans do? in whom shall man show faith?</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>For sure thou bad\u2019st me safely yield my spirit (wretch!) to thee,</p>\n\t\t      <p>Lulling my love as though my life were all security.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>The same now dost withdraw thyself and every word and deed</p>\n\t\t      <p>Thou suffer\u2019st winds and airy clouds to sweep from out thy head.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>But an forget thou, mindful be the Gods, and Faith in mind</p>\n\t\t      <p>Bears thee, and soon shall gar thee rue the deeds by thee design\u2019d.</p>\n\t\t    </div>','<p class="cantohead">XXXI.</p>\n\t\t<p class="cantosubhead">On Return to Sirmio and his Villa.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Sirmio! of Islands and Peninsulas</p>\n\t\t      <p>Eyelet, and whatsoe\u2019er in limpid meres</p>\n\t\t      <p>And vasty Ocean either Neptune owns,</p>\n\t\t      <p>Thy scenes how willing-glad once more I see,</p>\n\t\t      <p>At pain believing Thynia and the Fields</p>\n\t\t      <p>Bithynian left, I\u2019m safe to sight thy Site.</p>\n\t\t      <p>Oh what more bless\xE8d be than cares resolved,</p>\n\t\t      <p>When mind casts burthen and by peregrine</p>\n\t\t      <p>Work over wearied, lief we hie us home</p>\n\t\t      <p>To lie reposing in the longed-for bed!</p>\n\t\t      <p>This be the single meed for toils so triste.</p>\n\t\t      <p>Hail, O fair Sirmio, in thy lord rejoice:</p>\n\t\t      <p>And ye, O waves of Lybian Lake be glad,</p>\n\t\t      <p>And laugh what laughter pealeth in my home.</p>\n\t\t    </div>','<p class="cantohead">XXXII.</p>\n\t\t<p class="cantosubhead">Craving Ipsithilla\u2019s Last Favours.</p>\n\t\t    <div class="stanza">\n\t\t      <p>I\u2019ll love my Ipsithilla sweetest,</p>\n\t\t      <p>My desires and my wit the meetest,</p>\n\t\t      <p>So bid me join thy nap o\u2019 noon!</p>\n\t\t      <p>Then (after bidding) add the boon</p>\n\t\t      <p>Undraw thy threshold-bolt none dare,</p>\n\t\t      <p>Lest thou be led afar to fare;</p>\n\t\t      <p>Nay bide at home, for us prepare</p>\n\t\t      <p>Nine-fold continuous love-delights.</p>\n\t\t      <p>But aught do thou to hurry things,</p>\n\t\t      <p>For dinner-full I lie aback,</p>\n\t\t      <p>And gown and tunic through I crack.</p>\n\t\t    </div>','<p class="cantohead">XXXIII.</p>\n\t\t<p class="cantosubhead">On the Vibenii&mdash;Bath-Thieves.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Oh, best of robbers who in Baths delight,</p>\n\t\t      <p>Vibennius, sire and son, the Ingle hight,</p>\n\t\t      <p>(For that the father\u2019s hand be fouler one</p>\n\t\t      <p>And with his anus greedier is the Son)</p>\n\t\t      <p>Why not to banishment and evil hours</p>\n\t\t      <p>Haste ye, when all the parent\u2019s plundering powers</p>\n\t\t      <p>Are public knowledge, nor canst gain a Cent</p>\n\t\t      <p>Son! by the vending of thy pil\xE8d vent.</p>\n\t\t    </div>','<p class="cantohead">XXXIIII.</p>\n\t\t<p class="cantosubhead">Hymn to Diana.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Diana\u2019s faith inbred we bear</p>\n\t\t      <p>Youths whole of heart and maidens fair,</p>\n\t\t      <p>Let boys no blemishes impair,</p>\n\t\t      <p class="slindent6em">And girls of Dian sing!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>O great Latonian progeny,</p>\n\t\t      <p>Of greatest Jove descendancy,</p>\n\t\t      <p>Whom mother bare \u2019neath olive-tree,</p>\n\t\t      <p class="slindent6em">Deep in the Delian dell;</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>That of the mountains reign thou Queen</p>\n\t\t      <p>And forest ranges ever green,</p>\n\t\t      <p>And coppices by man unseen,</p>\n\t\t      <p class="slindent6em">And rivers resonant.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Thou art Luc\xEDna, Juno hight</p>\n\t\t      <p>By mothers lien in painful plight,</p>\n\t\t      <p>Thou puissant Trivia and the Light</p>\n\t\t      <p class="slindent6em">Bastard, yclept the Lune.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Thou goddess with thy monthly stage,</p>\n\t\t      <p>The yearly march doth mete and guage</p>\n\t\t      <p>And rustic peasant\u2019s messuage,</p>\n\t\t      <p class="slindent6em">Dost brim with best o\u2019 crops,</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Be hailed by whatso name of grace,</p>\n\t\t      <p>Please thee and olden Romulus\u2019 race,</p>\n\t\t      <p>Thy wonted favour deign embrace,</p>\n\t\t      <p class="slindent6em">And save with choicest aid.</p>\n\t\t    </div>','<p class="cantohead">XXXV.</p>\n\t\t<p class="cantosubhead">An Invitation to Poet Cecilius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Now to that tender bard, my Comrade fair,</p>\n\t\t      <p>(Cecilius) say I, \u201CPaper go, declare,</p>\n\t\t      <p>Verona must we make and bid to New</p>\n\t\t      <p>Comum\u2019s town-walls and Larian Shores adieu;\u201D</p>\n\t\t      <p>For I determined certain fancies he</p>\n\t\t      <p>Accept from mutual friend to him and me.</p>\n\t\t      <p>Wherefore he will, if wise, devour the way,</p>\n\t\t      <p>Though the blonde damsel thousand times essay</p>\n\t\t      <p>Recall his going and with arms a-neck</p>\n\t\t      <p>A-winding would e\u2019er seek his course to check;</p>\n\t\t      <p>A girl who (if the truth be truly told)</p>\n\t\t      <p>Dies of a hopeless passion uncontroul\u2019d;</p>\n\t\t      <p>For since the doings of the D\xEDndymus-dame,</p>\n\t\t      <p>By himself storied, she hath read, a flame</p>\n\t\t      <p>Wasting her inmost marrow-core hath burned.</p>\n\t\t      <p>I pardon thee, than Sapphic Muse more learn\u2019d,</p>\n\t\t      <p>Damsel: for truly sung in sweetest lays</p>\n\t\t      <p>Was by Cecilius Magna Mater\u2019s praise.</p>\n\t\t    </div>','<p class="cantohead">XXXVI.</p>\n\t\t<p class="cantosubhead">On \u201CThe Annals\u201D&mdash;A so-called Poem of Volusius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Volusius\u2019 Annals, paper scum-bewrayed!</p>\n\t\t      <p>Fulfil that promise erst my damsel made;</p>\n\t\t      <p>Who vowed to Holy Venus and her son,</p>\n\t\t      <p>Cupid, should I return to her anon</p>\n\t\t      <p>And cease to brandish iamb-lines accurst,</p>\n\t\t      <p>The writ selected erst of bards the worst</p>\n\t\t      <p>She to the limping Godhead would devote</p>\n\t\t      <p>With slowly-burning wood of illest note.</p>\n\t\t      <p>This was the vilest which my girl could find</p>\n\t\t      <p>With vow facetious to the Gods assigned.</p>\n\t\t      <p>Now, O Creation of the azure sea,</p>\n\t\t      <p>Holy Idalium, Urian havenry</p>\n\t\t      <p>Haunting, Ancona, Cnidos\u2019 reedy site,</p>\n\t\t      <p>Amathus, Golgos, and the tavern hight</p>\n\t\t      <p>Durrachium&mdash;thine Adrian abode&mdash;</p>\n\t\t      <p>The vow accepting, recognize the vowed</p>\n\t\t      <p>As not unworthy and unhandsome naught.</p>\n\t\t      <p>But do ye meanwhile to the fire be brought,</p>\n\t\t      <p>That teem with boorish jest of sorry blade,</p>\n\t\t      <p>Volusius\u2019 Annals, paper scum-bewrayed.</p>\n\t\t    </div>','<p class="cantohead">XXXVII.</p>\n\t\t<p class="cantosubhead">To the Frequenters of a low Tavern.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Salacious Tavern and ye taverner-host,</p>\n\t\t      <p>From Pileate Brothers the ninth pile-post,</p>\n\t\t      <p>D\u2019ye claim, you only of the mentule boast,</p>\n\t\t      <p>D\u2019ye claim alone what damsels be the best</p>\n\t\t      <p>To swive: as he-goats holding all the rest?</p>\n\t\t      <p>Is\u2019t when like boobies sit ye incontinent here,</p>\n\t\t      <p>One or two hundred, deem ye that I fear</p>\n\t\t      <p>Two hundred &mdash;&mdash; at one brunt?</p>\n\t\t      <p>Ay, think so, natheless all your tavern-front</p>\n\t\t      <p>With many a scorpion I will over-write.</p>\n\t\t      <p>For that my damsel, fro\u2019 my breast took flight,</p>\n\t\t      <p>By me so lov\xE8d, as shall loved be none,</p>\n\t\t      <p>Wherefor so mighty wars were waged and won,</p>\n\t\t      <p>Does sit in public here. Ye fain, rich wights,</p>\n\t\t      <p>All woo her: thither too (the chief of slights!)</p>\n\t\t      <p>All pitiful knaves and by-street wenchers fare,</p>\n\t\t      <p>And thou, (than any worse), with hanging hair,</p>\n\t\t      <p>In coney-breeding Celtiberia bred,</p>\n\t\t      <p>Egnatius! bonnified by beard full-fed,</p>\n\t\t      <p>And teeth with Spanish urine polish\xE8d.</p>\n\t\t    </div>','<p class="cantohead">XXXVIII.</p>\n\t\t<p class="cantosubhead">A Complaint to Cornificius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Cornificius! \u2019Tis ill with thy Catullus,</p>\n\t\t      <p>\u2019Tis ill (by Hercules) distressfully:</p>\n\t\t      <p>Iller and iller every day and hour.</p>\n\t\t      <p>Whose soul (as smallest boon and easiest)</p>\n\t\t      <p>With what of comfort hast thou deign\u2019d console?</p>\n\t\t      <p>Wi\u2019 thee I\u2019m angered! Dost so prize my love?</p>\n\t\t      <p>Yet some consoling utterance had been well</p>\n\t\t      <p>Though sadder \u2019twere than Simon\xEDdean tears.</p>\n\t\t    </div>','<p class="cantohead">XXXVIIII.</p>\n\t\t<p class="cantosubhead">On Egnatius of the White Teeth.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Egnatius for that owns he teeth snow-white,</p>\n\t\t      <p>Grins ever, everywhere. When placed a wight</p>\n\t\t      <p>In dock, when pleader would draw tears, the while</p>\n\t\t      <p>He grins. When pious son at funeral pile</p>\n\t\t      <p>Mourns, or lone mother sobs for sole lost son,</p>\n\t\t      <p>He grins. Whate\u2019er, whene\u2019er, howe\u2019er is done,</p>\n\t\t      <p>Of deed he grins. Such be his malady,</p>\n\t\t      <p>Nor kind, nor courteous&mdash;so beseemeth me&mdash;</p>\n\t\t      <p>Then take thou good Egnatius, rede of mine!</p>\n\t\t      <p>Wert thou corrupt Sabine or a Tiburtine,</p>\n\t\t      <p>Stuffed Umbrian or Tuscan overgrown</p>\n\t\t      <p>Swarthy Lanuvian with his teeth-rows shown,</p>\n\t\t      <p>Transp\xE1dan also, that mine own I touch,</p>\n\t\t      <p>Or any washing teeth to shine o\u2019er much,</p>\n\t\t      <p>Yet thy incessant grin I would not see,</p>\n\t\t      <p>For naught than laughter silly sillier be.</p>\n\t\t      <p>Thou Celtiber art, in Celtiberia born,</p>\n\t\t      <p>Where man who\u2019s urined therewith loves a-morn</p>\n\t\t      <p>His teeth and ruddy gums to scour and score;</p>\n\t\t      <p>So the more polisht are your teeth, the more</p>\n\t\t      <p>Argue they sipping stale in ampler store.</p>\n\t\t    </div>','<p class="cantohead">XXXX.</p>\n\t\t<p class="cantosubhead">Threatening Ravidus who stole his Mistress.</p>\n\t\t    <div class="stanza">\n\t\t      <p>What thought of folly R\xE1vidus (poor churl!)</p>\n\t\t      <p>Upon my iambs thus would headlong hurl?</p>\n\t\t      <p>What good or cunning counsellor would fain</p>\n\t\t      <p>Urge thee to struggle in such strife insane?</p>\n\t\t      <p>Is\u2019t that the vulgar mouth thy name by rote?</p>\n\t\t      <p>What will\u2019st thou? Wishest on any wise such note?</p>\n\t\t      <p>Then <em>shalt</em> be noted since my love so lief</p>\n\t\t      <p>For love thou sued\u2019st to thy lasting grief.</p>\n\t\t    </div>','<p class="cantohead">XXXXI.</p>\n\t\t<p class="cantosubhead">On Mamurra\u2019s Mistress.</p>\n\t\t    <div class="stanza">\n\t\t      <p>That Ametina, worn-out whore,</p>\n\t\t      <p>Me for a myriad oft would bore,</p>\n\t\t      <p>That strumpet of th\u2019 ignoble nose,</p>\n\t\t      <p>To leman, rakehell Formian chose.</p>\n\t\t      <p>An ye would guard her (kinsmen folk)</p>\n\t\t      <p>Your friends and leaches d\u2019ye convoke:</p>\n\t\t      <p>The girl\u2019s not sound-sens\u2019d; ask ye naught</p>\n\t\t      <p>Of her complaint: she\u2019s love-distraught.</p>\n\t\t    </div>','<p class="cantohead">XXXXII.</p>\n\t\t<p class="cantosubhead">On a Strumpet who stole his Tablets.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Come, Hendecasyllabics, many as may</p>\n\t\t      <p>All hither, every one that of you be!</p>\n\t\t      <p>That fulsome harlot makes me laughing-stock</p>\n\t\t      <p>And she refuses at our prayer restore</p>\n\t\t      <p>Our stolen Note-books, an such slights ye bear.</p>\n\t\t      <p>Let us pursue her clamouring our demands.</p>\n\t\t      <p>\u201CWho\u2019s she?\u201D ye question: yonder one ye sight</p>\n\t\t      <p>Mincingly pacing mime-like, perfect pest,</p>\n\t\t      <p>With jaws wide grinning like a Gallic pup.</p>\n\t\t      <p>Stand all round her dunning with demands,</p>\n\t\t      <p>\u201CReturn (O rotten whore!) our noting books.</p>\n\t\t      <p>Our noting books (O rotten whore!) return!\u201D</p>\n\t\t      <p>No doit thou car\u2019st? O Mire! O Stuff o\u2019 stews!</p>\n\t\t      <p>Or if aught fouler filthier dirt there be.</p>\n\t\t      <p>Yet must we never think these words suffice.</p>\n\t\t      <p>But if naught else avail, at least a blush</p>\n\t\t      <p>Forth of that bitch-like brazen brow we\u2019ll squeeze.</p>\n\t\t      <p>Cry all together in a higher key</p>\n\t\t      <p>\u201CRestore (O rotten whore!) our noting books,</p>\n\t\t      <p>Our noting books (O rotten whore!) restore!\u201D</p>\n\t\t      <p>Still naught avails us, nothing is she moved.</p>\n\t\t      <p>Now must our measures and our modes be changed</p>\n\t\t      <p>An we would anywise our cause advance.</p>\n\t\t      <p>\u201CRestore (chaste, honest Maid!) our noting books!\u201D</p>\n\t\t    </div>','<p class="cantohead">XXXXIII.</p>\n\t\t<p class="cantosubhead">To Mamurra\u2019s Mistress.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Hail, girl who neither nose of minim size</p>\n\t\t      <p>Owns, nor a pretty foot, nor jetty eyes,</p>\n\t\t      <p>Nor thin long fingers, nor mouth dry of slaver</p>\n\t\t      <p>Nor yet too graceful tongue of pleasant flavour,</p>\n\t\t      <p>Leman to Formian that rake-a-hell.</p>\n\t\t      <p>What, can the Province boast of thee as belle?</p>\n\t\t      <p>Thee with my Lesbia durst it make compare?</p>\n\t\t      <p>O Age insipid, of all humour bare!</p>\n\t\t    </div>','<p class="cantohead">XXXXIIII.</p>\n\t\t<p class="cantosubhead">Catullus to his own Farm.</p>\n\t\t    <div class="stanza">\n\t\t      <p>O Farm our own, Sabine or Tiburtine,</p>\n\t\t      <p>(For style thee \u201CTiburs\u201D who have not at heart</p>\n\t\t      <p>To hurt Catullus, whereas all that have</p>\n\t\t      <p>Wage any wager thou be Sabine classed)</p>\n\t\t      <p>But whether Sabine or of Tiburs truer</p>\n\t\t      <p>To thy suburban Cottage fared I fain</p>\n\t\t      <p>And fro\u2019 my bronchials drave that curs\xE8d cough</p>\n\t\t      <p>Which not unmerited on me my maw,</p>\n\t\t      <p>A-seeking sumptuous banquetings, bestowed.</p>\n\t\t      <p>For I requesting to be Sestius\u2019 guest</p>\n\t\t      <p>Read against claimant Antius a speech,</p>\n\t\t      <p>Full-filled with poisonous pestilential trash.</p>\n\t\t      <p>Hence a grave frigid rheum and frequent cough</p>\n\t\t      <p>Shook me till fled I to thy bosom, where</p>\n\t\t      <p>Repose and nettle-broth healed all my ills.</p>\n\t\t      <p>Wherefore recruited now best thanks I give</p>\n\t\t      <p>To thee for nowise punishing my sins:</p>\n\t\t      <p>Nor do I now object if noisome writs</p>\n\t\t      <p>Of Sestius hear I, but that cold and cough</p>\n\t\t      <p>And rheum may plague, not me, but Sestius\u2019 self</p>\n\t\t      <p>Who asks me only his ill writs to read.</p>\n\t\t    </div>','<p class="cantohead">XXXXV.</p>\n\t\t<p class="cantosubhead">On Acme and Septumius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>To Acm\xE9 quoth Septumius who his fere</p>\n\t\t      <p>Held on his bosom&mdash;\u201CAcm\xE9, mine! next year,</p>\n\t\t      <p>Unless I love thee fondlier than before,</p>\n\t\t      <p>And with each twelve month love thee more and more,</p>\n\t\t      <p>As much as lover\u2019s life can slay with yearning,</p>\n\t\t      <p>Alone in Lybia, or Hind\u2019s clime a-burning,</p>\n\t\t      <p>Be mine to encounter Lion grisly-eyed!\u201D</p>\n\t\t      <p>While he was speaking Love on leftward side</p>\n\t\t      <p>(As wont) approving sneeze from dextral sped.</p>\n\t\t      <p>But Acm\xE9 backwards gently bending head,</p>\n\t\t      <p>And the love-drunken eyes of her sweet boy</p>\n\t\t      <p>Kissing with yonder rosy mouth, \u201CMy joy,\u201D</p>\n\t\t      <p>She murmured, \u201Cmy life-love Septumillus mine!</p>\n\t\t      <p>Unto one master\u2019s hest let\u2019s aye incline,</p>\n\t\t      <p>As burns with fuller and with fiercer fire</p>\n\t\t      <p>In my soft marrow set, this love-desire!\u201D</p>\n\t\t      <p>While she was speaking, Love from leftward side</p>\n\t\t      <p>(As wont) with sneeze approving rightwards hied.</p>\n\t\t      <p>Now with boon omens wafted on their way,</p>\n\t\t      <p>In mutual fondness, love and loved are they.</p>\n\t\t      <p>Love-sick Septumius holds one Acm\xE9\u2019s love,</p>\n\t\t      <p>Of Syrias or either Britains high above,</p>\n\t\t      <p>Acm\xE9 to one Septumius full of faith</p>\n\t\t      <p>Her love and love-liesse surrendereth.</p>\n\t\t      <p>Who e\u2019er saw mortals happier than these two?</p>\n\t\t      <p>Who e\u2019er a better omened Venus knew?</p>\n\t\t    </div>','<p class="cantohead">XXXXVI.</p>\n\t\t<p class="cantosubhead">His Adieux to Bithynia.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Now Spring his cooly mildness brings us back,</p>\n\t\t      <p>Now th\u2019 equinoctial heaven\u2019s rage and wrack</p>\n\t\t      <p>Hushes at hest of Zephyr\u2019s bonny breeze.</p>\n\t\t      <p>Far left (Catullus!) be the Phrygian leas</p>\n\t\t      <p>And summery Nic\xE6a\u2019s fertile downs:</p>\n\t\t      <p>Fly we to Asia\u2019s fame-illumined towns.</p>\n\t\t      <p>Now lust my fluttering thoughts for wayfare long,</p>\n\t\t      <p>Now my glad eager feet grow steady, strong.</p>\n\t\t      <p>O fare ye well, my comrades, pleasant throng,</p>\n\t\t      <p>Ye who together far from homesteads flying,</p>\n\t\t      <p>By many various ways come homewards hieing.</p>\n\t\t    </div>','<p class="cantohead">XXXXVII.</p>\n\t\t<p class="cantosubhead">To Porcius and Socration.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Porcius and Socration, pair sinister</p>\n\t\t      <p>Of Piso, scabs and starvelings of the world,</p>\n\t\t      <p>You to Fab\xFAllus and my Verian\xF3lus,</p>\n\t\t      <p>Hath dared yon snipt Priapus to prefer?</p>\n\t\t      <p>Upon rich banquets sumptuously spread</p>\n\t\t      <p>Still gorge you daily while my comrades must</p>\n\t\t      <p>Go seek invitals where the three roads fork?</p>\n\t\t    </div>','<p class="cantohead">XXXXVIII.</p>\n\t\t<p class="cantosubhead">To Juventius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Those honied eyes of thine (Juventius!)</p>\n\t\t      <p>If any suffer me sans stint to buss,</p>\n\t\t      <p>I\u2019d kiss of kisses hundred thousands three,</p>\n\t\t      <p>Nor ever deem I\u2019d reach satiety,</p>\n\t\t      <p>Not albe denser than dried wheat-ears show</p>\n\t\t      <p>The kissing harvests our embraces grow.</p>\n\t\t    </div>','<p class="cantohead">XXXXVIIII.</p>\n\t\t<p class="cantosubhead">To Marcus Tullius Cicero.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Most eloquent \u2019mid race of Romulus</p>\n\t\t      <p>That is or ever was (Marc Tullius!)</p>\n\t\t      <p>Or in the coming years the light shall see,</p>\n\t\t      <p>His thanks, the warmest, offers unto thee</p>\n\t\t      <p>Catullus, poet sorriest that be,</p>\n\t\t      <p>And by such measure poet sorriest,</p>\n\t\t      <p>As thou of pleaders art the bestest best.</p>\n\t\t    </div>','<p class="cantohead">L.</p>\n\t\t<p class="cantosubhead">To his friend Licinius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Idly (Licinius!) we our yesterday,</p>\n\t\t      <p>Played with my tablets much as pleased us play,</p>\n\t\t      <p>In mode becoming souls of dainty strain.</p>\n\t\t      <p>Inditing verses either of us twain</p>\n\t\t      <p>Now in one measure then in other line</p>\n\t\t      <p>We rang the changes amid wit and wine.</p>\n\t\t      <p>Then fared I homewards by thy fun so fired</p>\n\t\t      <p>And by thy jests (Licinius!) so inspired,</p>\n\t\t      <p>Nor food my hapless appetite availed</p>\n\t\t      <p>Nor sleep in quiet rest my eyelids veiled,</p>\n\t\t      <p>But o\u2019er the bedstead wild in furious plight</p>\n\t\t      <p>I tossed a-longing to behold the light,</p>\n\t\t      <p>So I might talk wi\u2019 thee, and be wi\u2019 thee.</p>\n\t\t      <p>But when these wearied limbs from labour free</p>\n\t\t      <p>Were on my couchlet strewn half-dead to lie,</p>\n\t\t      <p>For thee (sweet wag!) this poem for thee wrote I,</p>\n\t\t      <p>Whereby thou mete and weet my cark and care.</p>\n\t\t      <p>Now be not over-bold, nor this our prayer</p>\n\t\t      <p>Outspit thou (apple of mine eyes!): we pray</p>\n\t\t      <p>Lest doom thee Nemesis hard pain repay:&mdash;</p>\n\t\t      <p>She\u2019s a dire Goddess, \u2019ware thou cross her way.</p>\n\t\t    </div>','<p class="cantohead">LI.</p>\n\t\t<p class="cantosubhead">To Lesbia.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Peer of a God meseemeth he,</p>\n\t\t      <p>Nay passing Gods (and that can be!)</p>\n\t\t      <p>Who all the while sits facing thee</p>\n\t\t      <p class="slindent2em">Sees thee and hears</p>\n\t\t      <p>Thy low sweet laughs which (ah me!) daze</p>\n\t\t      <p>Mine every sense, and as I gaze</p>\n\t\t      <p>Upon thee (Lesbia!) o\u2019er me strays</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>My tongue is dulled, my limbs adown</p>\n\t\t      <p>Flows subtle flame; with sound its own</p>\n\t\t      <p>Rings either ear, and o\u2019er are strown</p>\n\t\t      <p class="slindent2em">Mine eyes with night.</p>\n\t\t    </div>\n\t\t<p class="cantohead">LI <em>b</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Ease has thy lot, Catullus, crost,</p>\n\t\t      <p>Ease gladdens thee at heaviest cost,</p>\n\t\t      <p>Ease killed the Kings ere this and lost</p>\n\t\t      <p class="slindent2em">The tallest towns.</p>\n\t\t    </div>','<p class="cantohead">LII.</p>\n\t\t<p class="cantosubhead">Catullus to Himself.</p>\n\t\t    <div class="stanza">\n\t\t      <p>What is\u2019t, Catullus? Why delay to out die?</p>\n\t\t      <p>That Wen hight Nonius sits in curule chair,</p>\n\t\t      <p>For Consulship Vatinius false doth swear;</p>\n\t\t      <p>What is\u2019t, Catullus? Why delay to out die?</p>\n\t\t    </div>','<p class="cantohead">LIII.</p>\n\t\t<p class="cantosubhead">A Jest concerning Calvus.</p>\n\t\t    <div class="stanza">\n\t\t      <p>I laughed at one \u2019mid Forum-crowd unknown</p>\n\t\t      <p>Who, when Vatinius\u2019 crimes in wondrous way</p>\n\t\t      <p>Had by my Calvus been explained, exposed,</p>\n\t\t      <p>His hand upraising high admiring cried</p>\n\t\t      <p>\u201CGreat Gods! the loquent little Doodle-diddle!\u201D</p>\n\t\t    </div>','<p class="cantohead">LIIII.</p>\n\t\t<p class="cantosubhead">To Julius C\xE6sar. (?)</p>\n\t\t    <div class="stanza">\n\t\t      <p>The head of Otho, puniest of pates</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>The rustic half-washt shanks of Nerius</p>\n\t\t      <p>And Libo\u2019s subtle silent fizzling-farts.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>I wish that leastwise these should breed disgust</p>\n\t\t      <p>In thee and old Fuficius, rogue twice-cookt.</p>\n\t\t    </div>\n\t\t<p class="cantohead">LIIII <em>b</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Again at these mine innocent iamb-lines</p>\n\t\t      <p>Wi\u2019 wrath be wrothest; unique Emperor!</p>\n\t\t    </div>','<p class="cantohead">LV.</p>\n\t\t<p class="cantosubhead">Of his friend Camerius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>We pray, an\u2019 haply irk it not when prayed,</p>\n\t\t      <p>Show us where shadowed hidest thou in shade!</p>\n\t\t      <p>Thee throughout Campus Minor sought we all,</p>\n\t\t      <p>Thee in the Circus, thee in each bookstall,</p>\n\t\t      <p>Thee in Almighty Jove\u2019s fane consecrate.</p>\n\t\t      <p>Nor less in promenade titled from The Great</p>\n\t\t      <p>(Friend!) I accosted each and every quean,</p>\n\t\t      <p>But mostly madams showing mien serene,</p>\n\t\t      <p>For thee I pestered all with many pleas&mdash;</p>\n\t\t      <p>\u201CGive me Cam\xE9rius, wanton baggages!\u201D</p>\n\t\t      <p>Till answered certain one a-baring breasts</p>\n\t\t      <p>\u201CLo, \u2019twixt these rosy paps he haply rests!\u201D</p>\n\t\t      <p>But now to find thee were Herculean feat.</p>\n\t\t      <p>Not if I feign\xE8d me that guard of Crete,</p>\n\t\t      <p>Not if with Pegas\xE8an wing I sped,</p>\n\t\t      <p>Or Ladas I or Perseus plumiped,</p>\n\t\t      <p>Or Rhesus borne in swifty car snow-white:</p>\n\t\t      <p>Add the twain foot-bewing\u2019d and fast of flight,</p>\n\t\t      <p>And of the cursive winds require the blow:</p>\n\t\t      <p>All these (Cam\xE9rius!) couldst on me bestow.</p>\n\t\t      <p>Tho\u2019 were I wearied to each marrow bone</p>\n\t\t      <p>And by many o\u2019 languors clean forgone</p>\n\t\t      <p>Yet I to seek thee (friend!) would still assay.</p>\n\t\t      <p>In such proud lodging (friend) wouldst self denay?</p>\n\t\t      <p>Tell us where haply dwell\u2019st thou, speak outright,</p>\n\t\t      <p>Be bold and risk it, trusting truth to light,</p>\n\t\t      <p>Say do these milk-white girls thy steps detain?</p>\n\t\t      <p>If aye in tight-sealed lips thy tongue remain,</p>\n\t\t      <p>All Amor\u2019s fruitage thou shalt cast away:</p>\n\t\t      <p>Verbose is Venus, loving verbal play!</p>\n\t\t      <p>But, an it please thee, padlockt palate bear,</p>\n\t\t      <p>So in your friendship I have partner-share.</p>\n\t\t    </div>','<p class="cantohead">LVI.</p>\n\t\t<p class="cantosubhead">To Cato, describing a \u201CBlack Joker.\u201D</p>\n\t\t    <div class="stanza">\n\t\t      <p>O risible matter (Cato!) and jocose,</p>\n\t\t      <p>Digne of thy hearing, of thy sneering digne.</p>\n\t\t      <p>Laugh (Cato!) an thou love Catullus thine;</p>\n\t\t      <p>The thing is risible, nay, too jocose.</p>\n\t\t      <p>Erstwhile I came upon a lad who a lass</p>\n\t\t      <p>Was &mdash;&mdash; and (so please it Dion!) I</p>\n\t\t      <p>Pierced him with stiffest staff and did him die.</p>\n\t\t    </div>','<p class="cantohead">LVII.</p>\n\t\t<p class="cantosubhead">On Mamurra and Julius C\xE6sar.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Right well are paired these Cinaedes sans shame</p>\n\t\t      <p>Mamurra and C\xE6sar, both of pathic fame.</p>\n\t\t      <p>No wonder! Both are fouled with foulest blight,</p>\n\t\t      <p>One urban being, Formian t\u2019other wight,</p>\n\t\t      <p>And deeply printed with indelible stain:</p>\n\t\t      <p>Morbose is either, and the twin-like twain</p>\n\t\t      <p>Share single Couchlet; peers in shallow lore,</p>\n\t\t      <p>Nor this nor that for lechery hungers more,</p>\n\t\t      <p>As rival wenchers who the maidens claim</p>\n\t\t      <p>Right well are paired these Cinaedes sans shame.</p>\n\t\t    </div>','<p class="cantohead">LVIII.</p>\n\t\t<p class="cantosubhead">On Lesbia who Ended Badly.</p>\n\t\t    <div class="stanza">\n\t\t      <p>C\xE6lius! That Lesbia of ours, that Lesbia,</p>\n\t\t      <p>That only Lesbia by Catullus loved,</p>\n\t\t      <p>Than self, far fondlier, than all his friends,</p>\n\t\t      <p>She now where four roads fork, and wind the wynds</p>\n\t\t      <p>Husks the high-minded scions Remus-sprung.</p>\n\t\t    </div>','<p class="cantohead">LVIIII.</p>\n\t\t<p class="cantosubhead">On Rufa.</p>\n\t\t    <div class="stanza">\n\t\t      <p>R\xFAfa the Bolognese drains Rufule dry,</p>\n\t\t      <p>(Wife to Menenius) she \u2019mid tombs you\u2019ll spy,</p>\n\t\t      <p>The same a-snatching supper from the pyre</p>\n\t\t      <p>Following the bread-loaves rolling forth the fire</p>\n\t\t      <p>Till frapped by half-shaved body-burner\u2019s ire.</p>\n\t\t    </div>','<p class="cantohead">LX.</p>\n\t\t<p class="cantosubhead">To a Cruel Charmer.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Bare thee some lioness wild in Lybian wold?</p>\n\t\t      <p>Or Scylla barking from low\u2019st inguinal fold?</p>\n\t\t      <p>With so black spirit, of so dure a mould,</p>\n\t\t      <p>E\u2019en voice of suppliant must thou disregard</p>\n\t\t      <p>In latest circumstance ah, heart o\u2019er hard?</p>\n\t\t    </div>','<p class="cantohead">LXI.</p>\n\t\t<p class="cantosubhead">Epithalamium on Vinia and Manlius.</p>\n\t\t<p class="inthead">1.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Of Helicon-hill, O Thou that be</p>\n\t\t      <p>Haunter, Urania\u2019s progeny,</p>\n\t\t      <p>Who hurriest soft virginity</p>\n\t\t      <p class="slindent">To man, O Hymen\xE6us Hymen,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t\t\t<p class="inthead">2.</p>\n\t\t    <div class="stanza">\n\t\t      <p>About thy temples bind the bloom,</p>\n\t\t      <p class="slindent">Of Marjoram flow\u2019ret scented sweet;</p>\n\t\t      <p>Take flamey veil: glad hither come</p>\n\t\t      <p class="slindent">Come hither borne by snow-hue\u2019d feet</p>\n\t\t      <p class="slindent2em">Wearing the saffron\u2019d sock.</p>\n\t\t    </div>\n\t\t\t\t<p class="inthead">3.</p>\n\t\t    <div class="stanza">\n\t\t      <p>And, roused by day of joyful cheer,</p>\n\t\t      <p class="slindent">Carolling nuptial lays and chaunts</p>\n\t\t      <p>With voice as silver-ringing clear,</p>\n\t\t      <p class="slindent">Beat ground with feet, while brandisht flaunts</p>\n\t\t      <p class="slindent2em">Thy hand the piney torch.</p>\n\t\t\t\t</div>\n\t\t\t\t<p class="inthead">4.</p>\n\t\t    <div class="stanza">\n\t\t      <p>For Vinia comes by Manlius woo\u2019d,</p>\n\t\t      <p class="slindent">As Venus on th\u2019 Idalian crest,</p>\n\t\t      <p>Before the Phrygian judge she stood</p>\n\t\t      <p class="slindent">And now with bless\xE8d omens blest,</p>\n\t\t      <p class="slindent2em">The maid is here to wed.</p>\n\t\t\t\t</div>\n\t\t\t\t<p class="inthead">5.</p>\n\t\t    <div class="stanza">\n\t\t      <p>A maiden shining bright of blee,</p>\n\t\t      <p class="slindent">As Myrtle branchlet Asia bred,</p>\n\t\t      <p>Which Hamadryad deity</p>\n\t\t      <p class="slindent">As toy for joyance aye befed</p>\n\t\t      <p class="slindent2em">With humour of the dew.</p>\n\t\t\t\t</div>\n\t\t\t\t<p class="inthead">6.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Then hither come thou, hieing lief,</p>\n\t\t      <p class="slindent">Awhile to leave th\u2019 Aonian cave,</p>\n\t\t      <p>Where \u2019neath the rocky Thespian cliff</p>\n\t\t      <p class="slindent">Nymph Aganippe loves to lave</p>\n\t\t      <p class="slindent2em">In cooly waves outpoured.</p>\n\t\t    </div>\n\t\t<p class="inthead">7.</p>\n\t\t    <div class="stanza">\n\t\t      <p>And call the house-bride, homewards bring</p>\n\t\t      <p class="slindent">Maid yearning for new married fere,</p>\n\t\t      <p>Her mind with fondness manacling,</p>\n\t\t      <p class="slindent">As the tough ivy here and there</p>\n\t\t      <p class="slindent2em">Errant the tree enwinds.</p>\n\t\t    </div>\n\t\t<p class="inthead">8.</p>\n\t\t    <div class="stanza">\n\t\t      <p>And likewise ye, clean virginal</p>\n\t\t      <p>Maidens, to whom shall haps befall</p>\n\t\t      <p>Like day, in measure join ye all</p>\n\t\t      <p class="slindent">Singing, O Hymen\xE6us Hymen,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">9.</p>\n\t\t    <div class="stanza">\n\t\t      <p>That with more will-full will a-hearing</p>\n\t\t      <p class="slindent">The call to office due, he would</p>\n\t\t      <p>Turn footsteps hither, here appearing,</p>\n\t\t      <p class="slindent">Guide to good Venus, and the good</p>\n\t\t      <p class="slindent2em">Lover conjoining strait.</p>\n\t\t    </div>\n\t\t<p class="inthead">10.</p>\n\t\t    <div class="stanza">\n\t\t      <p>What God than other Godheads more</p>\n\t\t      <p>Must love-sick wights for aid implore?</p>\n\t\t      <p>Whose Godhead foremost shall adore</p>\n\t\t      <p class="slindent">Mankind? O Hymen\xE6us Hymen,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">11.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Thee for his own the trembling sire</p>\n\t\t      <p class="slindent">Invokes, thee Virgins ever sue</p>\n\t\t      <p>Who laps of zone to loose aspire,</p>\n\t\t      <p class="slindent">And thee the bashful bridegrooms woo</p>\n\t\t      <p class="slindent2em">With ears that long to hear.</p>\n\t\t    </div>\n\t\t<p class="inthead">12.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Thou to the hand of love-fierce swain</p>\n\t\t      <p>Deliverest maiden fair and fain,</p>\n\t\t      <p>From mother\u2019s fondling bosom ta\u2019en</p>\n\t\t      <p class="slindent">Perforce, O Hymen\xE6us Hymen</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">13.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Thou lacking, Venus ne\u2019er avails&mdash;</p>\n\t\t      <p class="slindent">While Fame approves for honesty&mdash;</p>\n\t\t      <p>Love-joys to lavish: ne\u2019er she fails</p>\n\t\t      <p class="slindent">Thou willing:&mdash;with such Deity</p>\n\t\t      <p class="slindent2em">Whoe\u2019er shall dare compare?</p>\n\t\t    </div>\n\t\t<p class="inthead">14.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Thou wanting, never son and heir</p>\n\t\t      <p class="slindent">The Hearth can bear, nor parents be</p>\n\t\t      <p>By issue girt, yet can it bear,</p>\n\t\t      <p class="slindent">Thou willing:&mdash;with such Deity,</p>\n\t\t      <p class="slindent2em">Whoe\u2019er shall dare compare?</p>\n\t\t    </div>\n\t\t<p class="inthead">15.</p>\n\t\t    <div class="stanza">\n\t\t      <p>An lack a land thy sacring rite,</p>\n\t\t      <p class="slindent">The perfect rule we ne\u2019er shall see</p>\n\t\t      <p>Reach Earth\u2019s far bourne; yet such we sight,</p>\n\t\t      <p class="slindent">Thou willing:&mdash;with such Deity</p>\n\t\t      <p class="slindent2em">Whoe\u2019er shall dare compare?</p>\n\t\t    </div>\n\t\t<p class="inthead">16.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Your folds ye gateways wide-ope swing!</p>\n\t\t      <p class="slindent">The maiden comes. Seest not the sheen</p>\n\t\t      <p>Of links their splendent tresses fling?</p>\n\t\t      <p class="slindent">Let shame retard the modest mien.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t    </div>\n\t\t<p class="inthead">17.</p>\n\t\t    <div class="stanza">\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p class="slindent">Who more she hears us weeps the more,</p>\n\t\t      <p class="slindent2em">That needs she must advance.</p>\n\t\t    </div>\n\t\t<p class="inthead">18.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Cease raining tear-drops! not for thee,</p>\n\t\t      <p class="slindent">Aurunculeia, risk we deem,</p>\n\t\t      <p>That fairer femininety</p>\n\t\t      <p class="slindent">Clear day outdawned from Ocean stream</p>\n\t\t      <p class="slindent2em">Shall ever more behold.</p>\n\t\t    </div>\n\t\t<p class="inthead">19.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Such in the many-tinted bower</p>\n\t\t      <p class="slindent">Of rich man\u2019s garden passing gay</p>\n\t\t      <p>Upstands the hyacinthine flower.</p>\n\t\t      <p class="slindent">But thou delayest, wanes the day:</p>\n\t\t      <p class="slindent2em"><em>Prithee, come forth new Bride.</em></p>\n\t\t    </div>\n\t\t<p class="inthead">20.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Prithee, come forth new Bride! methinks,</p>\n\t\t      <p class="slindent">Drawing in sight, the talk we hold</p>\n\t\t      <p>Thou haply hearest. See the Links!</p>\n\t\t      <p class="slindent">How shake their locks begilt with gold:</p>\n\t\t      <p class="slindent2em">Prithee, new Bride come forth.</p>\n\t\t    </div>\n\t\t<p class="inthead">21.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Not lightly given thy mate to ill</p>\n\t\t      <p class="slindent">Joys and adulterous delights</p>\n\t\t      <p>Foul fleshly pleasures seeking still</p>\n\t\t      <p class="slindent">Shall ever choose he lie o\u2019 nights</p>\n\t\t      <p class="slindent2em">Far from thy tender paps.</p>\n\t\t    </div>\n\t\t<p class="inthead">22.</p>\n\t\t    <div class="stanza">\n\t\t      <p>But as with pliant shoots the vine</p>\n\t\t      <p class="slindent">Round nearest tree-trunk winds her way,</p>\n\t\t      <p>He shall be ever twined in thine</p>\n\t\t      <p class="slindent">Embraces:&mdash;yet, lo! wanes the day:</p>\n\t\t      <p class="slindent2em">Prithee, come forth new Bride!</p>\n\t\t    </div>\n\t\t<p class="inthead">23.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Couchlet which to me and all</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p class="slindent2em">With bright white bedstead foot.</p>\n\t\t    </div>\n\t\t<p class="inthead">24.</p>\n\t\t    <div class="stanza">\n\t\t      <p>What joys the lord of thee betide!</p>\n\t\t      <p class="slindent">What love-liesse on vaguing way</p>\n\t\t      <p>O\u2019 nights! What sweets in morning tide</p>\n\t\t      <p class="slindent">For thee be stored! Yet wanes the day:</p>\n\t\t      <p class="slindent2em">Prithee, come forth fresh Bride!</p>\n\t\t    </div>\n\t\t<p class="inthead">25.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Your lighted links, O boys, wave high:</p>\n\t\t      <p>I see the flamey veil draw nigh:</p>\n\t\t      <p>Hie, sing in merry mode and cry</p>\n\t\t      <p class="slindent">\u201CO Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us!\u201D</p>\n\t\t    </div>\n\t\t<p class="inthead">26.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Lest longer mute tongue stays that joys</p>\n\t\t      <p class="slindent">In festal jest, from Fescennine,</p>\n\t\t      <p>Nor yet denay their nuts to boys,</p>\n\t\t      <p class="slindent">He-Concubine! who learns in fine</p>\n\t\t      <p class="slindent2em">His lordling\u2019s love is fled.</p>\n\t\t    </div>\n\t\t<p class="inthead">27.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Throw nuts to boys thou idle all</p>\n\t\t      <p class="slindent">He-Concubine! wast fain full long</p>\n\t\t      <p>With nuts to play: now pleased as thrall</p>\n\t\t      <p class="slindent">Be thou to swell Talasios\u2019 throng:</p>\n\t\t      <p class="slindent2em">He-Concubine throw nuts.</p>\n\t\t    </div>\n\t\t<p class="inthead">28.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Wont thou at peasant-girls to jape</p>\n\t\t      <p class="slindent">He-whore! Thy Lord\u2019s delight the while:</p>\n\t\t      <p>Now shall hair-curling chattel scrape</p>\n\t\t      <p class="slindent">Thy cheeks: poor wretch, ah! poor and vile:&mdash;</p>\n\t\t      <p class="slindent2em">He-Concubine, throw nuts.</p>\n\t\t    </div>\n\t\t<p class="inthead">29.</p>\n\t\t    <div class="stanza">\n\t\t      <p>\u2019Tis said from smooth-faced ingle train</p>\n\t\t      <p>(Anointed bridegroom!) hardly fain</p>\n\t\t      <p>Hast e\u2019er refrained; now do refrain!</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead">30.</p>\n\t\t    <div class="stanza">\n\t\t      <p>We know that naught save licit rites</p>\n\t\t      <p>Be known to thee, but wedded wights</p>\n\t\t      <p>No more deem lawful such delights.</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">31.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Thou too, O Bride, whatever dare</p>\n\t\t      <p>Thy groom, of coy rebuff beware,</p>\n\t\t      <p>Lest he to find elsewhither fare.</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">32.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Lo! here the house of high degree</p>\n\t\t      <p>Thy husband\u2019s puissant home to be,</p>\n\t\t      <p>Which ever shall obey thy gree.</p>\n\t\t      <p>O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead">33.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Till Time betide when eld the hoar</p>\n\t\t      <p>Thy head and temples trembling o\u2019er</p>\n\t\t      <p>Make nod to all things evermore.</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">34.</p>\n\t\t    <div class="stanza">\n\t\t      <p>O\u2019erstep with omen meetest meet</p>\n\t\t      <p>The threshold-stone thy golden feet</p>\n\t\t      <p>Up, past the polisht panels fleet.</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">35.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Within bestrewn thy bridegroom see</p>\n\t\t      <p>On couch of Tyrian cramoisy</p>\n\t\t      <p>All imminent awaiting thee.</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">36.</p>\n\t\t    <div class="stanza">\n\t\t      <p>For in his breast not less than thine</p>\n\t\t      <p>Burn high the flames that deepest shrine,</p>\n\t\t      <p>Yet his the lowe far deeper lien.</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">37.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Let fall the maid\u2019s soft arms, thou fair</p>\n\t\t      <p>Boy purple-hem\u2019d: now be thy care</p>\n\t\t      <p>Her bridegroom\u2019s couch she seek and share.</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">38.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Ye wives time-tried to husbands wed,</p>\n\t\t      <p>Well-known for chastity inbred,</p>\n\t\t      <p>Dispose the virginette a-bed.</p>\n\t\t      <p class="slindent">O Hymen Hymen\xE6us io,</p>\n\t\t      <p class="slindent2em">O Hymen Hymen\xE6us.</p>\n\t\t    </div>\n\t\t<p class="inthead">39.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Groom, now \u2019tis meet thou hither pace,</p>\n\t\t      <p class="slindent">With bride in genial bed to blend,</p>\n\t\t      <p>For sheenly shines her flowery face</p>\n\t\t      <p class="slindent">Where the white chamomiles contend</p>\n\t\t      <p class="slindent2em">With poppies blushing red.</p>\n\t\t    </div>\n\t\t<p class="inthead">40.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Yet bridegroom (So may Godhead deign</p>\n\t\t      <p class="slindent">Help me!) nowise in humbler way</p>\n\t\t      <p>Art fair, nor Venus shall disdain</p>\n\t\t      <p class="slindent">Thy charms, but look! how wanes the day:</p>\n\t\t      <p class="slindent2em">Forward, nor loiter more!</p>\n\t\t    </div>\n\t\t<p class="inthead">41.</p>\n\t\t    <div class="stanza">\n\t\t      <p>No longer loitering makest thou,</p>\n\t\t      <p class="slindent">Now comest thou. May Venus good</p>\n\t\t      <p>Aid thee when frankly takest thou</p>\n\t\t      <p class="slindent">Thy wishes won, nor true Love woo\u2019d</p>\n\t\t      <p class="slindent2em">Thou carest to conceal.</p>\n\t\t    </div>\n\t\t<p class="inthead">42.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Of Afric\u2019s wolds and wilds each grain,</p>\n\t\t      <p class="slindent">Or constellations glistening,</p>\n\t\t      <p>First reckon he that of the twain</p>\n\t\t      <p class="slindent">To count alone were fain to bring</p>\n\t\t      <p class="slindent2em">The many thousand joys.</p>\n\t\t    </div>\n\t\t<p class="inthead">43.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Play as ye please: soon prove ye deft</p>\n\t\t      <p class="slindent">At babying babes,&mdash;\u2019twere ill design\u2019d</p>\n\t\t      <p>A name thus ancient should be left</p>\n\t\t      <p class="slindent">Heirless, but issue like of kind</p>\n\t\t      <p class="slindent2em">Engendered aye should be.</p>\n\t\t    </div>\n\t\t<p class="inthead">44.</p>\n\t\t    <div class="stanza">\n\t\t      <p>A wee Torqu\xE1tus fain I\u2019d see</p>\n\t\t      <p class="slindent">Encradled on his mother\u2019s breast</p>\n\t\t      <p>Put forth his tender puds while he</p>\n\t\t      <p class="slindent">Smiles to his sire with sweetest gest</p>\n\t\t      <p class="slindent2em">And liplets half apart.</p>\n\t\t    </div>\n\t\t<p class="inthead">45.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Let son like father\u2019s semblance show</p>\n\t\t      <p class="slindent">(Manlius!) so with easy guess</p>\n\t\t      <p>All know him where his sire they know,</p>\n\t\t      <p class="slindent">And still his face and form express</p>\n\t\t      <p class="slindent2em">His mother\u2019s honest love.</p>\n\t\t\t\t</div>\n\t\t\t\t<p class="inthead">46.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Approve shall fair approof his birth</p>\n\t\t      <p class="slindent">From mother\u2019s seed-stock generous,</p>\n\t\t      <p>As rarest fame of mother\u2019s worth</p>\n\t\t      <p class="slindent">Unique exalts Telemachus</p>\n\t\t      <p class="slindent2em">Penelope\u2019s own son.</p>\n\t\t\t\t</div>\n\t\t\t\t<p class="inthead">47.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Fast close the door-leaves, virgin band:</p>\n\t\t      <p class="slindent">Enow we\u2019ve played. But ye the fair</p>\n\t\t      <p>New-wedded twain live happy, and</p>\n\t\t      <p class="slindent">Functions of lusty married pair</p>\n\t\t      <p class="slindent2em">Exercise sans surcease.</p>\n\t\t    </div>','<p class="cantohead">LXII.</p>\n\t\t<p class="cantosubhead">Nuptial Song by Youth And Damsels<br />\n\t\t\t(Epithalamium.)</p>\n\t\t<p class="inthead"><em>Youths.</em></p>\n\t\t    <div class="stanza">\n\t\t      <p>Vesper is here, O youths, rise all; for Vesper Olympus</p>\n\t\t      <p>Scales and in fine enfires what lights so long were expected!</p>\n\t\t      <p>Time \u2019tis now to arise, now leave we tables rich laden,</p>\n\t\t      <p>Now shall the Virgin come; now chaunt we the Hymen\xE6us.</p>\n\t\t      <p class="slindent">Hymen O Hymen\xE6us: Hymen here, O Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Damsels.</em></p>\n\t\t    <div class="stanza">\n\t\t      <p>View ye the Youths, O Maids unwed? Then rise to withstand them:</p>\n\t\t      <p>Doubtless the night-fraught Star displays his splendour \u0152t\xE9\xE4n.</p>\n\t\t      <p>Sooth \u2019tis so; d\u2019ye sight how speedily sprang they to warfare?</p>\n\t\t      <p>Nor for a naught up-sprang: they\u2019ll sing what need we to conquer.</p>\n\t\t      <p class="slindent">Hymen O Hymen\xE6us: Hymen here, O Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Youths.</em></p>\n\t\t    <div class="stanza">\n\t\t      <p>Nowise easy the palm for us (Companions!) be proffer\u2019d,</p>\n\t\t      <p>Lo! now the maidens muse and meditate matter of forethought</p>\n\t\t      <p>Nor meditate they in vain; they muse a humorous something.</p>\n\t\t      <p>Yet naught wonder it is, their sprites be wholly in labour.</p>\n\t\t      <p>We bear divided thought one way and hearing in other:</p>\n\t\t      <p>Vanquish\u2019t by right we must be, since Victory loveth the heedful.</p>\n\t\t      <p>Therefore at least d\u2019ye turn your minds the task to consider,</p>\n\t\t      <p>Soon shall begin their say whose countersay shall befit you.</p>\n\t\t      <p class="slindent">Hymen O Hymen\xE6us: Hymen here, O Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Damsels.</em></p>\n\t\t    <div class="stanza">\n\t\t      <p>Hesperus! say what flame more cruel in Heaven be fanned?</p>\n\t\t      <p>Thou who the girl perforce canst tear from a mother\u2019s embraces,</p>\n\t\t      <p>Tear from a parent\u2019s clasp her child despite of her clinging</p>\n\t\t      <p>And upon love-hot youth bestowest her chastest of maidenhoods!</p>\n\t\t      <p>What shall the foeman deal more cruel to city becaptured?</p>\n\t\t      <p class="slindent">Hymen O Hymen\xE6us, Hymen here, O Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Youths.</em></p>\n\t\t    <div class="stanza">\n\t\t      <p>Hesperus! say what flame more gladsome in Heavens be shining?</p>\n\t\t      <p>Thou whose light makes sure long-pledged connubial promise</p>\n\t\t      <p>Plighted erewhile by men and erstwhile plighted by parents.</p>\n\t\t      <p>Yet to be ne\u2019er fulfilled before thy fire\u2019s ardours have risen!</p>\n\t\t      <p>What better boon can the gods bestow than hour so desir\xE8d?</p>\n\t\t      <p class="slindent">Hymen O Hymen\xE6us, Hymen here, O Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Damsels.</em></p>\n\t\t    <div class="stanza">\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Hesperus! one of ourselves (Companions!) carried elsewhither</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p class="slindent"><em>Hymen O Hymen\xE6us, Hymen here, O Hymen\xE6us!</em></p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Youths.</em></p>\n\t\t    <div class="stanza">\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>For at thy coming in sight a guard is constantly watching.</p>\n\t\t      <p>Hidden o\u2019nights lurk thieves and these as oft as returnest,</p>\n\t\t      <p>Hesper! thou seizest them with title changed to E\xF6us.</p>\n\t\t      <p>Pleases the bevy unwed with feigned complaints to accuse thee.</p>\n\t\t      <p>What if assail they whom their souls in secrecy cherish?</p>\n\t\t      <p class="slindent">Hymen O Hymen\xE6us, Hymen here, O Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Damsels.</em></p>\n\t\t    <div class="stanza">\n\t\t      <p>E\u2019en as a flow\u2019ret born secluded in garden enclos\xE8d,</p>\n\t\t      <p>Unto the flock unknown and ne\u2019er uptorn by the ploughshare,</p>\n\t\t      <p>Soothed by the zephyrs and strengthened by suns and nourish\u2019t by showers</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Loves her many a youth and longs for her many a maiden:</p>\n\t\t      <p>Yet from her lissome stalk when cropt that flower deflowered,</p>\n\t\t      <p>Loves her never a youth nor longs for her ever a maiden:</p>\n\t\t      <p>Thus while the virgin be whole, such while she\u2019s the dearling of kinsfolk;</p>\n\t\t      <p>Yet no sooner is lost her bloom from body polluted,</p>\n\t\t      <p>Neither to youths she is joy, nor a dearling she to the maidens.</p>\n\t\t      <p class="slindent">Hymen O Hymen\xE6us, Hymen here, O Hymen\xE6us!</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Youths</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>E\u2019en as an unmated vine which born in field of the barest</p>\n\t\t      <p>Never upraises head nor breeds the mellowy grape-bunch,</p>\n\t\t      <p>But under weight prone-bowed that tender body a-bending</p>\n\t\t      <p>Makes she her root anon to touch her topmost of tendrils;</p>\n\t\t      <p>Tends her never a hind nor tends her ever a herdsman:</p>\n\t\t      <p>Yet if haply conjoin\xE8d the same with elm as a husband,</p>\n\t\t      <p>Tends her many a hind and tends her many a herdsman:</p>\n\t\t      <p>Thus is the maid when whole, uncultured waxes she aged;</p>\n\t\t      <p>But whenas union meet she wins her at ripest of seasons,</p>\n\t\t      <p>More to her spouse she is dear and less she\u2019s irk to her parents.</p>\n\t\t      <p class="slindent"><em>Hymen O Hymen\xE6us, Hymen here, O Hymen\xE6us!</em></p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Youths and Damsels</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>But do thou cease to resist (O Maid!) such bridegroom opposing,</p>\n\t\t      <p>Right it is not to resist whereto consigned thee a father,</p>\n\t\t      <p>Father and mother of thee unto whom obedience is owing.</p>\n\t\t      <p>Not is that maidenhood all thine own, but partly thy parents!</p>\n\t\t      <p>Owneth thy sire one third, one third is right of thy mother,</p>\n\t\t      <p>Only the third is thine: stint thee to strive with the others,</p>\n\t\t      <p>Who to the stranger son have yielded their dues with a dower!</p>\n\t\t      <p class="slindent">Hymen O Hymen\xE6us: Hymen here, O Hymen\xE6us!</p>\n\t\t    </div>','<p class="cantohead">LXIII.</p>\n\t\t<p class="cantosubhead">The Adventures of Atys.</p>\n\t\t    <div class="stanza">\n\t\t      <p>O\u2019er high deep seas in speedy ship his voyage Atys sped</p>\n\t\t      <p>Until he trod the Phrygian grove with hurried eager tread</p>\n\t\t      <p>And as the gloomy tree-shorn stead, the she-god\u2019s home, he sought</p>\n\t\t      <p>There sorely stung with fiery ire and madman\u2019s vaguing thought,</p>\n\t\t      <p>Share he with sharpened flint the freight wherewith his form was fraught.</p>\n\t\t      <p>Then as the she-he sens\xE8d limbs were void of manly strain</p>\n\t\t      <p>And sighted freshly shed a-ground spot of ensanguined stain,</p>\n\t\t      <p>Snatched she the timbrel\u2019s legier load with hands as snowdrops white,</p>\n\t\t      <p>Thy timbrel, Mother Cybeb\xE9, the firstings of thy rite,</p>\n\t\t      <p>And as her tender finger-tips on bull-back hollow rang</p>\n\t\t      <p>She rose a-grieving and her song to listening comrades sang.</p>\n\t\t      <p>\u201CUp Gall\xE6, hie together, haste for Cybebe\u2019s deep grove,</p>\n\t\t      <p>Hie to the Dindym\xE9nean dame, ye flocks that love to rove;</p>\n\t\t      <p>The which affecting stranger steads as bound in exile\u2019s brunt</p>\n\t\t      <p>My sect pursuing led by me have nerved you to confront</p>\n\t\t      <p>The raging surge of salty sea and ocean\u2019s tyrant hand</p>\n\t\t      <p>As your hate of Venus\u2019 hest your manly forms unmann\u2019d,</p>\n\t\t      <p>Gladden your souls, ye mistresses, with sense of error bann\u2019d.</p>\n\t\t      <p>Drive from your spirits dull delay, together follow ye</p>\n\t\t      <p>To hold of Phrygian goddess, home of Phrygian Cybebe,</p>\n\t\t      <p>Where loud the cymbal\u2019s voice resounds with timbrel-echoes blending,</p>\n\t\t      <p>And where the Phrygian piper drones grave bass from reed a-bending,</p>\n\t\t      <p>Where toss their ivy-circled heads with might the M\xE6nades</p>\n\t\t      <p>Where ply mid shrilly lullilooes the holiest mysteries,</p>\n\t\t      <p>Where to fly here and there be wont the she-god\u2019s vaguing train,</p>\n\t\t      <p>Thither behoves us lead the dance in quick-step hasty strain.\u201D</p>\n\t\t      <p>Soon as had Atys (bastard-she) this lay to comrades sung</p>\n\t\t      <p>The Chorus sudden lulliloos with quivering, quavering tongue,</p>\n\t\t      <p>Again the nimble timbrel groans, the scooped-out cymbals clash,</p>\n\t\t      <p>And up green Ida flits the Choir, with footsteps hurrying rash.</p>\n\t\t      <p>Then Atys frantic, panting, raves, a-wandering, lost, insane,</p>\n\t\t      <p>And leads with timbrel hent and treads the shades where shadows rain,</p>\n\t\t      <p>Like heifer spurning load of yoke in yet unbroken pride;</p>\n\t\t      <p>And the swift Gall\xE6 follow fain their first and fleetfoot guide.</p>\n\t\t      <p>But when the home of Cybebe they make with toil out-worn</p>\n\t\t      <p>O\u2019er much, they lay them down to sleep and gifts of Ceres scorn;</p>\n\t\t      <p>Till heavy slumbers seal their eyelids langourous, drooping lowly,</p>\n\t\t      <p>And raving phrenzy flies each brain departing softly, slowly.</p>\n\t\t      <p>But when Dan Sol with radiant eyes that fire his face of gold</p>\n\t\t      <p>Surveyed white aether and solid soil and waters uncontrol\u2019d,</p>\n\t\t      <p>And chased with steeds sonorous-hooved the shades of lingering night,</p>\n\t\t      <p>Then sleep from waking Atys fled fleeting with sudden flight,</p>\n\t\t      <p>By Nymph P\xE1sithae welcom\xE8d to palpitating breast.</p>\n\t\t      <p>Thus when his phrenzy raging rash was soothed to gentlest rest,</p>\n\t\t      <p>Atys revolved deeds lately done, as thought from breast unfolding,</p>\n\t\t      <p>And what he\u2019d lost and what he was with lucid sprite beholding,</p>\n\t\t      <p>To shallows led by surging soul again the way \u2019gan take.</p>\n\t\t      <p>There casting glance of weeping eyes where vasty billows brake,</p>\n\t\t      <p>Sad-voiced in pitifullest lay his native land bespake.</p>\n\t\t      <p>\u201CCountry of me, Creatress mine, O born to thee and bred,</p>\n\t\t      <p>By hapless me abandoned as by thrall from lordling fled,</p>\n\t\t      <p>When me to Ida\u2019s groves and glades these vaguing footsteps bore</p>\n\t\t      <p>To tarry \u2019mid the snows and where lurk beasts in antres frore</p>\n\t\t      <p>And seek the deeply hidden lairs where furious ferals meet!</p>\n\t\t      <p>Where, Country! whither placed must I now hold thy site and seat?</p>\n\t\t      <p>Lief would these balls of eyes direct to thee their line of sight,</p>\n\t\t      <p>Which for a while, a little while, would free me from despite.</p>\n\t\t      <p>Must I for ever roam these groves from house and home afar?</p>\n\t\t      <p>Of country, parents, kith and kin (life\u2019s boon) myself debar?</p>\n\t\t      <p>Fly Forum, fly Palestra, fly the Stadium, the Gymnase?</p>\n\t\t      <p>Wretch, ah poor wretch, I\u2019m doomed (my soul!) to mourn throughout my days,</p>\n\t\t      <p>For what of form or figure is, which I failed to enjoy?</p>\n\t\t      <p>I full-grown man, I blooming youth, I stripling, I a boy,</p>\n\t\t      <p>I of Gymnasium erst the bloom, I too of oil the pride:</p>\n\t\t      <p>Warm was my threshold, ever stood my gateways opening wide,</p>\n\t\t      <p>My house was ever garlanded and hung with flowery freight,</p>\n\t\t      <p>And couch to quit with rising sun, has ever been my fate:</p>\n\t\t      <p>Now must I Cybebe\u2019s she-slave, priestess of gods, be hight?</p>\n\t\t      <p>I M\xE6nad I, mere bit of self, I neutral barren wight?</p>\n\t\t      <p>I spend my life-tide couch\u2019t beneath high-towering Phrygian peaks?</p>\n\t\t      <p>I dwell on Ida\u2019s verdant slopes mottled with snowy streaks,</p>\n\t\t      <p>Where homes the forest-haunting doe, where roams the wildling boar?</p>\n\t\t      <p>Now, now I rue my deed foredone, now, now it irks me sore!\u201D</p>\n\t\t      <p>Whenas from out those roseate lips these accents rapid flew,</p>\n\t\t      <p>Bore them to ears divine consigned a Nuncio true and new;</p>\n\t\t      <p>Then Cybebe her lions twain disjoining from their yoke</p>\n\t\t      <p>The left-hand enemy of the herds a-goading thus bespoke:&mdash;</p>\n\t\t      <p>\u201CUp feral fell! up, hie with him, see rage his footsteps urge,</p>\n\t\t      <p>See that his fury smite him till he seek the forest verge,</p>\n\t\t      <p>He who with over-freedom fain would fly mine empery.</p>\n\t\t      <p>Go, slash thy flank with lashing tail and sense the strokes of thee,</p>\n\t\t      <p>Make the whole mountain to thy roar sound and resound again,</p>\n\t\t      <p>And fiercely toss thy brawny neck that bears the tawny mane!\u201D</p>\n\t\t      <p>So quoth an-angered Cybebe, and yoke with hand untied:</p>\n\t\t      <p>The feral rose in fiery wrath and self-inciting hied,</p>\n\t\t      <p>A-charging, roaring through the brake with breaking paws he tore.</p>\n\t\t      <p>But when he reached the humid sands where surges cream the shore,</p>\n\t\t      <p>Spying soft Atys lingering near the marbled pave of sea</p>\n\t\t      <p>He springs: the terror-madded wretch back to the wood doth flee,</p>\n\t\t      <p>Where for the remnant of her days a bondmaid\u2019s life led she.</p>\n\t\t      <p>Great Goddess, Goddess Cybebe, Dindymus dame divine,</p>\n\t\t      <p>Far from my house and home thy wrath and wrack, dread mistress mine:</p>\n\t\t      <p>Goad others on with Fury\u2019s goad, others to Ire consign!</p>\n\t\t    </div>','<p class="cantohead">LXIIII.</p>\n\t\t<p class="cantosubhead">Marriage of Peleus and Thetis.<br />\n\t\t\t(Fragment of an Epos.)</p>\n\t\t    <div class="stanza">\n\t\t      <p>Pine-trees gendered whil\xF2me upon soaring Peliac summit</p>\n\t\t      <p>Swam (as the tale is told) through liquid surges of Neptune</p>\n\t\t      <p>Far as the Phasis-flood and frontier-land \xC6\xEBt\xE9an;</p>\n\t\t      <p>Whenas the youths elect, of Argive vigour the oak-heart,</p>\n\t\t      <p>Longing the Golden Fleece of the Colchis-region to harry,</p>\n\t\t      <p>Dared in a poop swift-paced to span salt seas and their shallows,</p>\n\t\t      <p>Sweeping the deep blue seas with sweeps a-carven of fir-wood.</p>\n\t\t      <p>She, that governing Goddess of citadels crowning the cities,</p>\n\t\t      <p>Builded herself their car fast-flitting with lightest of breezes,</p>\n\t\t      <p>Weaving plants of the pine conjoined in curve of the kelson;</p>\n\t\t      <p>Foremost of all to imbue rude Amphitrit\xE9 with ship-lore.</p>\n\t\t      <p>Soon as her beak had burst through wind-rackt spaces of ocean,</p>\n\t\t      <p>While th\u2019oar-tortured wave with spumy whiteness was blanching,</p>\n\t\t      <p>Surged from the deep abyss and hoar-capped billows the faces</p>\n\t\t      <p>Seaborn, Nereids eyeing the prodigy wonder-smitten.</p>\n\t\t      <p>There too mortal orbs through softened spendours regarded</p>\n\t\t      <p>Ocean-nymphs who exposed bodies denuded of raiment</p>\n\t\t      <p>Bare to the breast upthrust from hoar froth capping the sea-depths.</p>\n\t\t      <p>Then Thetis P\xE9leus fired (men say) a-sudden with love-lowe,</p>\n\t\t      <p>Then Thetis nowise spurned to mate and marry wi\u2019 mortal,</p>\n\t\t      <p>Then Thetis\u2019 Sire himself her yoke with Peleus sanctioned.</p>\n\t\t      <p>Oh, in those happier days now fondly yearned-for, ye heroes</p>\n\t\t      <p>Born; (all hail!) of the Gods begotten, and excellent issue</p>\n\t\t      <p>Bred by your mothers, all hail! and placid deal me your favour.</p>\n\t\t      <p>Oft wi\u2019 the sound of me, in strains and spells I\u2019ll invoke you;</p>\n\t\t      <p>Thee too by wedding-torch so happily, highly augmented,</p>\n\t\t      <p>Peleus, Thessaly\u2019s ward, whomunto Jupiter\u2019s self deigned</p>\n\t\t      <p>Yield of the freest gree his loves though gotten of Godheads.</p>\n\t\t      <p>Thee Thetis, fairest of maids Nereian, vouchsafed to marry?</p>\n\t\t      <p>Thee did Tethys empower to woo and wed with her grandchild;</p>\n\t\t      <p>Nor less Oceanus, with water compassing th\u2019 Earth-globe?</p>\n\t\t      <p>But when ended the term, and wisht-for light of the day-tide</p>\n\t\t      <p>Uprose, flocks to the house in concourse mighty conven\xE8d,</p>\n\t\t      <p>Thessaly all, with glad assembly the Palace fulfilling:</p>\n\t\t      <p>Presents afore they bring, and joy in faces declare they.</p>\n\t\t      <p>Scyros desert abides: they quit Phthiotican Tempe,</p>\n\t\t      <p>Homesteads of Crannon-town, eke bulwarkt walls of Larissa;</p>\n\t\t      <p>Meeting at Phars\xE1lus, and roof Phars\xE1lian seeking.</p>\n\t\t      <p>None will the fields now till; soft wax all necks of the oxen,</p>\n\t\t      <p>Never the humble vine is purged by curve of the rake-tooth,</p>\n\t\t      <p>Never a pruner\u2019s hook thins out the shade of the tree-tufts,</p>\n\t\t      <p>Never a bull up-plows broad glebe with bend of the coulter,</p>\n\t\t      <p>Over whose point unuse displays the squalor of rust-stain.</p>\n\t\t      <p>But in the homestead\u2019s heart, where\u2019er that opulent palace</p>\n\t\t      <p>Hides a retreat, all shines with splendour of gold and of silver.</p>\n\t\t      <p>Ivory blanches the seats, bright gleam the flagons a-table,</p>\n\t\t      <p>All of the mansion joys in royal riches and grandeur.</p>\n\t\t      <p>But for the Diva\u2019s use bestrewn is the genial bedstead,</p>\n\t\t      <p>Hidden in midmost stead, and its polisht framework of Indian</p>\n\t\t      <p>Tusk underlies its cloth empurpled by juice of the dye-shell.</p>\n\t\t      <p class="slindent">This be a figured cloth with forms of manhood primeval</p>\n\t\t      <p>Showing by marvel-art the gifts and graces of heroes.</p>\n\t\t      <p>Here upon Dia\u2019s strand wave-resonant, ever-regarding</p>\n\t\t      <p>Theseus borne from sight outside by fleet of the fleetest,</p>\n\t\t      <p>Stands Ariadne with heart full-filled with furies unbated,</p>\n\t\t      <p>Nor can her sense as yet believe she \u2019spies the espied,</p>\n\t\t      <p>When like one that awakes new roused from slumber deceptive,</p>\n\t\t      <p>Sees she her hapless self lone left on loneliest sandbank:</p>\n\t\t      <p>While as the mindless youth with oars disturbeth the shallows,</p>\n\t\t      <p>Casts to the windy storms what vows he vainly had vow\xE8d.</p>\n\t\t      <p>Him through the sedges afar the sad-eyed maiden of Minos,</p>\n\t\t      <p>Likest a Bacchant-girl stone-carven, (O her sorrow!)</p>\n\t\t      <p>\u2019Spies, a-tossing the while on sorest billows of love-care.</p>\n\t\t      <p>Now no more on her blood-hued hair fine fillets retains she,</p>\n\t\t      <p>No more now light veil conceals her bosom erst hidden,</p>\n\t\t      <p>Now no more smooth zone contains her milky-hued paplets:</p>\n\t\t      <p>All gear dropping adown from every part of her person</p>\n\t\t      <p>Thrown, lie fronting her feet to the briny wavelets a sea-toy.</p>\n\t\t      <p>But at such now no more of her veil or her fillet a-floating</p>\n\t\t      <p>Had she regard: on thee, O Theseus! all of her heart-strength,</p>\n\t\t      <p>All of her sprite, her mind, forlorn, were evermore hanging.</p>\n\t\t      <p>Ah, sad soul, by grief and grievance driven beside thee,</p>\n\t\t      <p>Sowed Eryc\xEDna first those brambly cares in thy bosom,</p>\n\t\t      <p>What while issuing fierce with will enstarken\xE8d, Theseus</p>\n\t\t      <p>Forth from the bow-bent shore Pir\xE6an putting a-seawards</p>\n\t\t      <p>Reacht the Gortynian roofs where dwelt th\u2019 injurious Monarch.</p>\n\t\t      <p>For \u2019twas told of yore how forced by pestilence cruel,</p>\n\t\t      <p>Eke as a blood rite due for th\u2019 Androg\xE9onian murthur,</p>\n\t\t      <p>Many a chosen youth and the bloom of damsels unmarried</p>\n\t\t      <p>Food for the Minotaur, Cecropia was wont to befurnish.</p>\n\t\t      <p>Seeing his narrow walls in such wise vexed with evils,</p>\n\t\t      <p>Theseus of freest will for dear-loved Athens his body</p>\n\t\t      <p>Offered a victim so that no more to Crete be deported</p>\n\t\t      <p>Lives by Cecropia doomed to burials burying nowise;</p>\n\t\t      <p>Then with a swifty ship and soft breathed breezes a-stirring,</p>\n\t\t      <p>Sought he Minos the Haughty where homed in proudest of Mansions.</p>\n\t\t      <p>Him as with yearning glance forthright espi\xE8d the royal</p>\n\t\t      <p>Maiden, whom pure chaste couch aspiring delicate odours</p>\n\t\t      <p>Cherisht, in soft embrace of a mother comforted all-whiles,</p>\n\t\t      <p>(E\u2019en as the myrtles begot by the flowing floods of Eurotas,</p>\n\t\t      <p>Or as the tincts distinct brought forth by breath of the springtide)</p>\n\t\t      <p>Never the burning lights of her eyes from gazing upon him</p>\n\t\t      <p>Turned she, before fierce flame in all her body conceived she</p>\n\t\t      <p>Down in its deepest depths and burning amiddle her marrow.</p>\n\t\t      <p>Ah, with unmitigate heart exciting wretchedmost furies,</p>\n\t\t      <p>Thou, Boy sacrosanct! man\u2019s grief and gladness commingling,</p>\n\t\t      <p>Thou too of Golgos Queen and Lady of leafy Idalium,</p>\n\t\t      <p>Whelm\u2019d ye in what manner waves that maiden phantasy-fir\xE8d,</p>\n\t\t      <p>All for a blond-haired youth suspiring many a singulf!</p>\n\t\t      <p>Whiles how dire was the dread she dreed in languishing heart-strings;</p>\n\t\t      <p>How yet more, ever more, with golden splendour she pal\xE8d!</p>\n\t\t      <p>Whenas yearning to mate his might wi\u2019 the furious monster</p>\n\t\t      <p>Theseus braved his death or sought the prizes of praises.</p>\n\t\t      <p>Then of her gifts to gods not ingrate, nor profiting naught,</p>\n\t\t      <p>Promise with silent lip, addressed she timidly vowing.</p>\n\t\t      <p>For as an oak that shakes on topmost summit of Taurus</p>\n\t\t      <p>Its boughs, or cone-growing pine from bole bark resin exuding,</p>\n\t\t      <p>Whirlwind of passing might that twists the stems with its storm-blasts,</p>\n\t\t      <p>Uproots, deracinates, forthright its trunk to the farthest,</p>\n\t\t      <p>Prone falls, shattering wide what lies in line of its downfall,&mdash;</p>\n\t\t      <p>Thus was that wildling flung by Theseus and vanquisht of body,</p>\n\t\t      <p>Vainly tossing its horns and goring the wind to no purpose.</p>\n\t\t      <p>Thence with abounding praise returned he, guiding his footsteps,</p>\n\t\t      <p>Whiles did a fine drawn thread check steps in wander abounding,</p>\n\t\t      <p>Lest when issuing forth of the winding maze labyrinthine</p>\n\t\t      <p>Baffled become his track by inobservable error.</p>\n\t\t      <p>But for what cause should I, from early subject digressing,</p>\n\t\t      <p>Tell of the daughter who the face of her sire unseeing,</p>\n\t\t      <p>Eke her sister\u2019s embrace nor less her mother\u2019s endearments,</p>\n\t\t      <p>Who in despair bewept her hapless child that so gladly</p>\n\t\t      <p>Chose before every and each the lively wooing of Theseus?</p>\n\t\t      <p>Or how borne by the ship to the yeasting shore-line of Dia</p>\n\t\t      <p>Came she? or how when bound her eyes in bondage of slumber</p>\n\t\t      <p>Left her that chosen mate with mind unmindful departing?</p>\n\t\t      <p>Often (they tell) with heart inflamed by fiery fury</p>\n\t\t      <p>Poured she shrilling of shrieks from deepest depths of her bosom;</p>\n\t\t      <p>Now she would sadly scale the broken faces of mountains,</p>\n\t\t      <p>Whence she might overglance the boundless boiling of billows,</p>\n\t\t      <p>Then she would rush to bestem the salt-plain\u2019s quivering wavelet</p>\n\t\t      <p>And from her ankles bare the dainty garment uplifting,</p>\n\t\t      <p>Spake she these words (\u2019tis said) from sorrow\u2019s deepest abysses,</p>\n\t\t      <p>Whiles from her tear-drencht face outburst cold shivering singulfs.</p>\n\t\t      <p class="slindent">\u201CThus fro\u2019 my patrial shore, O traitor, hurried to exile,</p>\n\t\t      <p>Me on a lonely strand hast left, perfidious Theseus?</p>\n\t\t      <p>Thus wise farest, despite the godhead of Deities spurned,</p>\n\t\t      <p>(Reckless, alas!) to thy home convoying perjury-curses?</p>\n\t\t      <p>Naught, then, ever availed that mind of cruelest counsel</p>\n\t\t      <p>Alter? No saving grace in thee was evermore ready,</p>\n\t\t      <p>That to have pity on me vouchsafed thy pitiless bosom?</p>\n\t\t      <p>Natheless not in past time such were the promises wordy</p>\n\t\t      <p>Lavish\xE8d; nor such hopes to me the hapless were bidden;</p>\n\t\t      <p>But the glad married joys, the longed-for pleasures of wedlock.</p>\n\t\t      <p>All now empty and vain, by breath of the breezes bescattered!</p>\n\t\t      <p>Now, let woman no more trust her to man when he sweareth,</p>\n\t\t      <p>Ne\u2019er let her hope to find or truth or faith in his pleadings,</p>\n\t\t      <p>Who whenas lustful thought forelooks to somewhat attaining,</p>\n\t\t      <p>Never an oath they fear, shall spare no promise to promise.</p>\n\t\t      <p>Yet no sooner they sate all lewdness and lecherous fancy,</p>\n\t\t      <p>Nothing remember of words and reck they naught of fore-swearing.</p>\n\t\t      <p>Cert\xE8s, thee did I snatch from midmost whirlpool of ruin</p>\n\t\t      <p>Deadly, and held it cheap loss of a brother to suffer</p>\n\t\t      <p>Rather than fail thy need (O false!) at hour the supremest.</p>\n\t\t      <p>Therefor my limbs are doomed to be torn of birds, and of ferals</p>\n\t\t      <p>Prey, nor shall upheapt Earth afford a grave to my body.</p>\n\t\t      <p>Say me, what lioness bare thee \u2019neath lone rock of the desert?</p>\n\t\t      <p>What sea spued thee conceived from out the spume of his surges!</p>\n\t\t      <p>What manner Syrt, what ravening Scylla, what vasty Charybdis?</p>\n\t\t      <p>Thou who for sweet life saved such meeds art lief of returning!</p>\n\t\t      <p>If never willed thy breast with me to mate thee in marriage,</p>\n\t\t      <p>Hating the savage law decreed by primitive parent,</p>\n\t\t      <p>Still of your competence \u2019twas within your household to home me,</p>\n\t\t      <p>Where I might serve as slave in gladsome service familiar,</p>\n\t\t      <p>Laving thy snow-white feet in clearest chrystalline waters</p>\n\t\t      <p>Or with its purpling gear thy couch in company strewing.</p>\n\t\t      <p>Yet for what cause should I \u2019plain in vain to the winds that unknow me,</p>\n\t\t      <p>(I so beside me with grief!) which ne\u2019er of senses endu\xE8d</p>\n\t\t      <p>Hear not the words sent forth nor aught avail they to answer?</p>\n\t\t      <p>Now be his course well-nigh engaged in midway of ocean,</p>\n\t\t      <p>Nor any mortal shape appears in barrens of seawrack.</p>\n\t\t      <p>Thus at the latest hour with insults over-sufficient</p>\n\t\t      <p>E\u2019en to my plaints fere Fate begrudges ears that would hear me.</p>\n\t\t      <p>Jupiter! Lord of All-might, Oh would in days that are bygone</p>\n\t\t      <p>Ne\u2019er had Cecropian poops toucht ground at Gnossian foreshore,</p>\n\t\t      <p>Nor to th\u2019 unconquered Bull that tribute direful conveying</p>\n\t\t      <p>Had the false Seaman bound to Cretan island his hawser,</p>\n\t\t      <p>Nor had yon evil wight, \u2019neath shape the softest hard purpose</p>\n\t\t      <p>Hiding, enjoyed repose within our mansion beguested!</p>\n\t\t      <p>Whither can wend I now? What hope lends help to the lost one?</p>\n\t\t      <p>Idomen\xE9an mounts shall I scale? Ah, parted by whirlpools</p>\n\t\t      <p>Widest, yon truculent main where yields it power of passage?</p>\n\t\t      <p>Aid of my sire can I crave? Whom I willing abandoned,</p>\n\t\t      <p>Treading in tracks of a youth bewrayed with blood of a brother!</p>\n\t\t      <p>Can I console my soul wi\u2019 the helpful love of a helpmate</p>\n\t\t      <p>Who flies me with pliant oars, flies overbounding the sea-depths?</p>\n\t\t      <p>Nay, an this Coast I quit, this lone isle lends me no roof-tree,</p>\n\t\t      <p>Nor aught issue allows begirt by billows of Ocean:</p>\n\t\t      <p>Nowhere is path for flight: none hope shows: all things are silent:</p>\n\t\t      <p>All be a desolate waste: all makes display of destruction.</p>\n\t\t      <p>Yet never close these eyne in latest languor of dying,</p>\n\t\t      <p>Ne\u2019er from my wearied frame go forth slow-ebbing my senses,</p>\n\t\t      <p>Ere from the Gods just doom implore I, treason-betrayed,</p>\n\t\t      <p>And with my breath supreme firm faith of Celestials invoke I.</p>\n\t\t      <p>Therefore, O ye who \u2019venge man\u2019s deed with penalties direful,</p>\n\t\t      <p>Eumenides! aye wont to bind with viperous hair-locks</p>\n\t\t      <p>Foreheads,&mdash;Oh, deign outspeak fierce wrath from bosom outbreathing,</p>\n\t\t      <p>Hither, Oh hither, speed, and lend ye all ear to my grievance,</p>\n\t\t      <p>Which now sad I (alas!) outpour from innermost vitals</p>\n\t\t      <p>Maugre my will, sans help, blind, fired with furious madness.</p>\n\t\t      <p>And, as indeed all spring from veriest core of my bosom,</p>\n\t\t      <p>Suffer ye not the cause of grief and woe to evanish;</p>\n\t\t      <p>But wi\u2019 the Will wherewith could Theseus leave me in loneness,</p>\n\t\t      <p>Goddesses! bid that Will lead him, lead his, to destruction.\u201D</p>\n\t\t      <p class="slindent">E\u2019en as she thus poured forth these words from anguish of bosom,</p>\n\t\t      <p>And for this cruel deed, distracted, sued she for vengeance,</p>\n\t\t      <p>Nodded the Ruler of Gods Celestial, matchless of All-might,</p>\n\t\t      <p>When at the gest earth-plain and horrid spaces of ocean</p>\n\t\t      <p>Trembled, and every sphere rockt stars and planets resplendent.</p>\n\t\t      <p>Meanwhile Theseus himself, obscured in blindness of darkness</p>\n\t\t      <p>As to his mind, dismiss\u2019d from breast oblivious all things</p>\n\t\t      <p>Erewhile enjoined and held hereto in memory constant,</p>\n\t\t      <p>Nor for his saddened sire the gladness-signals uphoisting</p>\n\t\t      <p>Heralded safe return within sight of the Erechthean harbour.</p>\n\t\t      <p>For \u2019twas told of yore, when from walls of the Virginal De\xEBss</p>\n\t\t      <p>\xC6geus speeding his son, to the care of breezes committed,</p>\n\t\t      <p>Thus with a last embrace to the youth spake words of commandment:</p>\n\t\t      <p class="slindent">\u201CSon! far nearer my heart (sole thou) than life of the longest,</p>\n\t\t      <p>Son, I perforce dismiss to doubtful, dangerous chances,</p>\n\t\t      <p>Lately restored to me when eld draws nearest his ending,</p>\n\t\t      <p>Sithence such fortune in me, and in thee such boiling of valour</p>\n\t\t      <p>Tear thee away from me so loath, whose eyne in their languor</p>\n\t\t      <p>Never are sated with sight of my son, all-dearest of figures.</p>\n\t\t      <p>Nor will I send thee forth with joy that gladdens my bosom,</p>\n\t\t      <p>Nor will I suffer thee show boon signs of favouring Fortune,</p>\n\t\t      <p>But fro\u2019 my soul I\u2019ll first express an issue of sorrow,</p>\n\t\t      <p>Soiling my hoary hairs with dust and ashes commingled;</p>\n\t\t      <p>Then will I hang stained sails fast-made to the wavering yard-arms,</p>\n\t\t      <p>So shall our mourning thought and burning torture of spirit</p>\n\t\t      <p>Show by the dark sombre-dye of Iberian canvas spread.</p>\n\t\t      <p>But, an grant me the grace Who dwells in Sacred Itone,</p>\n\t\t      <p>(And our issue to guard and ward the seats of Erechtheus</p>\n\t\t      <p>Sware She) that be thy right besprent with blood of the Man-Bull,</p>\n\t\t      <p>Then do thou so-wise act, and stor\xE8d in memory\u2019s heart-core</p>\n\t\t      <p>Dwell these mandates of me, no time their traces untracing.</p>\n\t\t      <p>Dip, when first shall arise our hills to gladden thy eye-glance,</p>\n\t\t      <p>Down from thine every mast th\u2019ill-omened vestments of mourning,</p>\n\t\t      <p>Then let the twisten ropes upheave the whitest of canvas,</p>\n\t\t      <p>Wherewith splendid shall gleam the tallest spars of the top-mast,</p>\n\t\t      <p>These seeing sans delay with joy exalting my spirit</p>\n\t\t      <p>Well shall I wot boon Time sets thee returning before me.\u201D</p>\n\t\t      <p class="slindent">Such were the mandates which stored at first in memory constant</p>\n\t\t      <p>Faded from Theseus\u2019 mind like mists, compelled by the whirlwind,</p>\n\t\t      <p>Fleet from \xE4erial crests of mountains hoary with snow-drifts.</p>\n\t\t      <p>But as the sire had sought the citadel\u2019s summit for outlook,</p>\n\t\t      <p>Wasting his anxious eyes with tear-floods evermore flowing,</p>\n\t\t      <p>Forthright e\u2019en as he saw the sail-gear darkened with dye-stain,</p>\n\t\t      <p>Headlong himself flung he from the sea-cliff\u2019s pinnacled summit</p>\n\t\t      <p>Holding his Theseus lost by doom of pitiless Fortune.</p>\n\t\t      <p>Thus as he came to the home funest, his roof-tree paternal,</p>\n\t\t      <p>Theseus (vaunting the death), what dule to the maiden of Minos</p>\n\t\t      <p>Dealt with unminding mind so dree\u2019d he similar dolour.</p>\n\t\t      <p>She too gazing in grief at the kelson vanishing slowly,</p>\n\t\t      <p>Self-wrapt, manifold cares revolved, in spirit perturb\xE8d.</p>\n\t\t    </div>\n\t\t\t\t<p class="cantohead">On Another Part of the Coverlet.</p>\n\t\t    <div class="stanza">\n\t\t      <p class="slindent">But fro\u2019 the further side came flitting bright-faced Iacchus</p>\n\t\t      <p>Girded by Satyr-crew and Nysa-rear\xE8d Sileni</p>\n\t\t      <p>Burning wi\u2019 love unto thee (Ariadne!) and greeting thy presence.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Who flocking eager to fray did rave with infuriate spirit,</p>\n\t\t      <p>\u201CEvo\xEB\u201D phrensying loud, with heads at \u201CEvo\xEB\u201D rolling.</p>\n\t\t      <p>Brandisht some of the maids their thyrsi sheath\xE8d of spear-point,</p>\n\t\t      <p>Some snatcht limbs and joints of sturlings rended to pieces,</p>\n\t\t      <p>These girt necks and waists with writhing bodies of vipers,</p>\n\t\t      <p>Those wi\u2019 the gear enwombed in crates dark orgies ordain\xE8d&mdash;</p>\n\t\t      <p>Orgies that ears prophane must vainly lust for o\u2019er hearing&mdash;</p>\n\t\t      <p>Others with palms on high smote hurried strokes on the cymbal,</p>\n\t\t      <p>Or from the polisht brass woke thin-toned tinkling music,</p>\n\t\t      <p>While from the many there boomed and blared hoarse blast of the horn-trump,</p>\n\t\t      <p>And with its horrid skirl loud shrilled the barbarous bag-pipe,</p>\n\t\t      <p class="slindent">Showing such varied forms, that richly-decorate couch-cloth</p>\n\t\t      <p>Folded in strait embrace the bedding drapery-veil\xE8d.</p>\n\t\t      <p>This when the Th\xE9ssalan youths had eyed with eager inspection</p>\n\t\t      <p>Fulfilled, place they began to provide for venerate Godheads,</p>\n\t\t      <p>Even as Zephyrus\u2019 breath, seas couching placid at dawn-tide,</p>\n\t\t      <p>Roughens, then stings and spurs the wavelets slantingly fretted&mdash;</p>\n\t\t      <p>Rising Aurora the while \u2019neath Sol the wanderer\u2019s threshold&mdash;</p>\n\t\t      <p>Tardy at first they flow by the clement breathing of breezes</p>\n\t\t      <p>Urg\xE8d, and echo the shores with soft-toned ripples of laughter,</p>\n\t\t      <p>But as the winds wax high so waves wax higher and higher,</p>\n\t\t      <p>Flashing and floating afar to outswim morn\u2019s purpurine splendours,&mdash;</p>\n\t\t      <p>So did the crowd fare forth, the royal vestibule leaving,</p>\n\t\t      <p>And to their house each wight with vaguing paces departed.</p>\n\t\t      <p class="slindent">After their wending, the first, foremost from Pelion\u2019s summit,</p>\n\t\t      <p>Chiron came to the front with woodland presents surcharg\xE8d:</p>\n\t\t      <p>Whatso of blooms and flowers bring forth Thessalian uplands</p>\n\t\t      <p>Mighty with mountain crests, whate\u2019er of riverine lea flowers</p>\n\t\t      <p>Reareth Favonius\u2019 air, bud-breeding, tepidly breathing,</p>\n\t\t      <p>All in his hands brought he, unseparate in woven garlands,</p>\n\t\t      <p>Whereat laugh\xE8d the house as soothed by pleasure of perfume.</p>\n\t\t      <p class="slindent">Presently P\xE9neus appears, deserting verdurous Tempe&mdash;</p>\n\t\t      <p>Tempe girt by her belts of greenwood ever impending,</p>\n\t\t      <p>Left for the Mamonides with frequent dances to worship&mdash;</p>\n\t\t      <p>Nor is he empty of hand, for bears he tallest of beeches</p>\n\t\t      <p>Deracinate, and bays with straight boles lofty and stately,</p>\n\t\t      <p>Not without nodding plane-tree nor less the flexible sister</p>\n\t\t      <p>Fire-slain Pha\xEBton left, and not without cypresses airy.</p>\n\t\t      <p>These in a line wide-broke set he, the Mansion surrounding,</p>\n\t\t      <p>So by the soft leaves screened, the porch might flourish in verdure.</p>\n\t\t      <p class="slindent">Follows hard on his track with active spirit Prometheus,</p>\n\t\t      <p>Bearing extenuate sign of penalties suffer\u2019d in bygones.</p>\n\t\t      <p>Paid erewhiles what time fast-bound as to every member,</p>\n\t\t      <p>Hung he in carkanet slung from the Scythian rock-tor.</p>\n\t\t      <p class="slindent">Last did the Father of Gods with his sacred spouse and his offspring,</p>\n\t\t      <p>Proud from the Heavens proceed, thee leaving (Ph&oelig;bus) in loneness,</p>\n\t\t      <p>Lone wi\u2019 thy sister twin who haunteth mountains of Idrus:</p>\n\t\t      <p>For that the Virgin spurned as thou the person of Peleus,</p>\n\t\t      <p>Nor Thetis\u2019 nuptial torch would greet by act of her presence.</p>\n\t\t      <p class="slindent">When they had leaned their limbs upon snowy benches reposing,</p>\n\t\t      <p>Tables largely arranged with various viands were garnisht.</p>\n\t\t      <p>But, ere opened the feast, with infirm gesture their semblance</p>\n\t\t      <p>Shaking, the Parcae fell to chaunting veridique verses.</p>\n\t\t      <p>Robed were their tremulous frames all o\u2019er in muffle of garments</p>\n\t\t      <p>Bright-white, purple of hem enfolding heels in its edges;</p>\n\t\t      <p>Snowy the fillets that bound heads ag\xE8d by many a year-tide,</p>\n\t\t      <p>And, as their wont aye was, their hands plied labour unceasing.</p>\n\t\t      <p>Each in her left upheld with soft fleece cloth\xE8d a distaff,</p>\n\t\t      <p>Then did the right that drew forth thread with upturn of fingers</p>\n\t\t      <p>Gently fashion the yarn which deftly twisted by thumb-ball</p>\n\t\t      <p>Speeded the spindle poised by thread-whorl perfect of polish;</p>\n\t\t      <p>Thus as the work was wrought, the lengths were trimmed wi\u2019 the fore-teeth,</p>\n\t\t      <p>While to their thin, dry lips stuck wool-flecks severed by biting,</p>\n\t\t      <p>Which at the first outstood from yarn-hanks evenly fine-drawn.</p>\n\t\t      <p>Still at their feet in front soft fleece-flecks white as the snow-flake</p>\n\t\t      <p>Lay in the trusty guard of wickers woven in withies.</p>\n\t\t      <p>Always a-carding the wool, with clear-toned voices resounding</p>\n\t\t      <p>Told they such lots as these in song divinely directed,</p>\n\t\t      <p>Chaunts which none after-time shall \u2019stablish falsehood-convicted.</p>\n\t\t    </div>\n\t\t<p class="inthead">1.</p>\n\t\t    <div class="stanza">\n\t\t      <p>O who by virtues great all highmost honours enhancest,</p>\n\t\t      <p>Guard of Em\xE1thia-land, most famous made by thine offspring,</p>\n\t\t      <p>Take what the Sisters deign this gladsome day to disclose thee,</p>\n\t\t      <p>Oracles soothfast told,&mdash;And ye, by Destiny followed,</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">2.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Soon to thy sight shall rise, their fond hopes bringing to bridegrooms,</p>\n\t\t      <p>Hesperus: soon shall come thy spouse with planet auspicious,</p>\n\t\t      <p>Who shall thy mind enbathe with a love that softens the spirit,</p>\n\t\t      <p>And as thyself shall prepare for sinking in languorous slumber,</p>\n\t\t      <p>Under thy neck robust, soft arms dispreading as pillow.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">3.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Never a house like this such loves as these hath united,</p>\n\t\t      <p>Never did love conjoin by such-like covenant lovers,</p>\n\t\t      <p>As th\u2019according tie Thetis deigned in concert wi\u2019 Peleus.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">4.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Born of yon twain shall come Achilles guiltless of fear-sense,</p>\n\t\t      <p>Known by his forceful breast and ne\u2019er by back to the foeman,</p>\n\t\t      <p>Who shall at times full oft in doubtful contest of race-course</p>\n\t\t      <p>Conquer the fleet-foot doe with slot-tracks smoking and burning.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">5.</p>\n\t\t    <div class="stanza">\n\t\t      <p>None shall with him compare, howe\u2019er war-doughty a hero,</p>\n\t\t      <p>Whenas the Phrygian rills flow deep with bloodshed of Teucer,</p>\n\t\t      <p>And beleaguering the walls of Troy with longest of warfare</p>\n\t\t      <p>He shall the works lay low, third heir of Pelops the perjured.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">6.</p>\n\t\t    <div class="stanza">\n\t\t      <p>His be the derring-do and deeds of valour egregious,</p>\n\t\t      <p>Often mothers shall own at funeral-rites of their children,</p>\n\t\t      <p>What time their hoary hairs from head in ashes are loosened,</p>\n\t\t      <p>And wi\u2019 their hands infirm they smite their bosoms loose dugg\xE8d.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">7.</p>\n\t\t    <div class="stanza">\n\t\t      <p>For as the toiling hind bestrewing denseness of corn-stalks</p>\n\t\t      <p>Under the broiling sun mows grain-fields yellow to harvest,</p>\n\t\t      <p>So shall his baneful brand strew earth with corpses of Troy-born.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">8.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Aye to his valorous worth attest shall wave of Scamander</p>\n\t\t      <p>Which unto Hell\xE9-Sea fast flowing ever dischargeth,</p>\n\t\t      <p>Straiter whose course shall grow by up-heaped barrage of corpses,</p>\n\t\t      <p>While in his depths runs warm his stream with slaughter commingled.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">9.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Witness in fine shall be the victim rendered to death-stroke,</p>\n\t\t      <p>Whenas the earthern tomb on lofty tumulus builded</p>\n\t\t      <p>Shall of the stricken maid receive limbs white as the snow-flake.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">10.</p>\n\t\t    <div class="stanza">\n\t\t      <p>For when at last shall Fors to weary Achaians her fiat</p>\n\t\t      <p>Deal, of Dardanus-town to burst Neptunian fetters,</p>\n\t\t      <p>Then shall the high-reared tomb stand bathed with Polyxena\u2019s life-blood,</p>\n\t\t      <p>Who, as the victim doomed to fall by the double-edged falchion,</p>\n\t\t      <p>Forward wi\u2019 hams relaxt shall smite a body beheaded.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">11.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Wherefore arise, ye pair, conjoin loves ardently longed-for,</p>\n\t\t      <p>Now doth the groom receive with happiest omen his goddess,</p>\n\t\t      <p>Now let the bride at length to her yearning spouse be delivered.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\t\t<p class="inthead">12.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Neither the nurse who comes at dawn to visit her nursling</p>\n\t\t      <p>E\u2019er shall avail her neck to begird with yesterday\u2019s ribband.</p>\n\t\t      <p class="slindent">[Speed ye, the well-spun woof out-drawing, speed ye, O spindles.]</p>\n\t\t      <p>Nor shall the mother\u2019s soul for ill-matcht daughter a-grieving</p>\n\t\t      <p>Lose by a parted couch all hopes of favourite grandsons.</p>\n\t\t      <p class="slindent">Speed ye, the well-spun woof out-drawing, speed ye, O Spindles.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Thus in the bygone day Peleus\u2019 fate foretelling</p>\n\t\t      <p>Chaunted from breasts divine prophetic verse the Parcae.</p>\n\t\t      <p>For that the pure chaste homes of heroes to visit in person</p>\n\t\t      <p>Oft-tide the Gods, and themselves to display where mortals were gathered,</p>\n\t\t      <p>Wont were the Heavenlies while none human piety spurned.</p>\n\t\t      <p>Often the Deities\u2019 Sire, in fulgent temple a-dwelling,</p>\n\t\t      <p>Whenas in festal days received he his annual worship,</p>\n\t\t      <p>Looked upon hundreds of bulls felled prone on pavement before him.</p>\n\t\t      <p>Full oft Liber who roamed from topmost peak of Parnassus</p>\n\t\t      <p>Hunted his howling host, his Thyiads with tresses dishevelled.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Then with contending troops from all their city outflocking</p>\n\t\t      <p>Gladly the Delphians hailed their God with smoking of altars.</p>\n\t\t      <p>Often in death-full war and bravest of battle, or Mavors</p>\n\t\t      <p>Or rapid Triton\u2019s Queen or eke the Virgin Rhamnusian,</p>\n\t\t      <p>Bevies of weaponed men exhorting, prov\xE8d their presence.</p>\n\t\t      <p>But from the time when earth was stained with unspeakable scandals</p>\n\t\t      <p>And forth fro\u2019 greeding breasts of all men justice departed,</p>\n\t\t      <p>Then did the brother drench his hands in brotherly bloodshed,</p>\n\t\t      <p>Stinted the son in heart to mourn decease of his parents,</p>\n\t\t      <p>Long\xE8d the sire to sight his first-born\u2019s funeral convoy</p>\n\t\t      <p>So more freely the flower of step-dame-maiden to rifle;</p>\n\t\t      <p>After that impious Queen her guiltless son underlying,</p>\n\t\t      <p>Impious, the household gods with crime ne\u2019er dreading to sully&mdash;</p>\n\t\t      <p>All things fair and nefand being mixt in fury of evil</p>\n\t\t      <p>Turned from ourselves avert the great goodwill of the Godheads.</p>\n\t\t      <p>Wherefor they nowise deign our human assemblies to visit,</p>\n\t\t      <p>Nor do they suffer themselves be met in light of the day-tide.</p>\n\t\t    </div>','<p class="cantohead">LXV.</p>\n\t\t<p class="cantosubhead">To Hortalus Lamenting a Lost Brother.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Albeit care that consumes, with dule assiduous grieving,</p>\n\t\t      <p class="slindent">Me from the Learn\xE8d Maids (Hortalus!) ever seclude,</p>\n\t\t      <p>Nor can avail sweet births of the Muses thou to deliver</p>\n\t\t      <p class="slindent">Thought o\u2019 my mind; (so much floats it on flooding of ills:</p>\n\t\t      <p>For that the Lethe-wave upsurging of late from abysses,</p>\n\t\t      <p class="slindent">Lav\xE8d my brother\u2019s foot, paling with pallor of death,</p>\n\t\t      <p>He whom the Trojan soil, Rhoetean shore underlying,</p>\n\t\t      <p class="slindent">Buries for ever and aye, forcibly snatched from our sight.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>I can address; no more shall I hear thee tell of thy doings,</p>\n\t\t      <p class="slindent">Say, shall I never again, brother all liefer than life,</p>\n\t\t      <p>Sight thee henceforth? But I will surely love thee for ever</p>\n\t\t      <p class="slindent">Ever what songs I sing saddened shall be by thy death;</p>\n\t\t      <p>Such as the Daulian bird \u2019neath gloom of shadowy frondage</p>\n\t\t      <p class="slindent">Warbles, of Itys lost ever bemoaning the lot.)</p>\n\t\t      <p>Yet amid grief so great to thee, my Hortalus, send I</p>\n\t\t      <p class="slindent">These strains sung to a mode borrowed from Battiades;</p>\n\t\t      <p>Lest shouldest weet of me thy words, to wandering wind-gusts</p>\n\t\t      <p class="slindent">Vainly committed, perchance forth of my memory flowed&mdash;</p>\n\t\t      <p>As did that apple sent for a furtive giftie by wooer,</p>\n\t\t      <p class="slindent">In the chaste breast of the Maid hidden a-sudden out-sprang;</p>\n\t\t      <p>For did the hapless forget when in loose-girt garment it lurk\xE8d,</p>\n\t\t      <p class="slindent">Forth would it leap as she rose, scared by her mother\u2019s approach,</p>\n\t\t      <p>And while coursing headlong, it rolls far out of her keeping,</p>\n\t\t      <p class="slindent">O\u2019er the triste virgin\u2019s brow flushes the conscious blush.</p>\n\t\t    </div>','<p class="cantohead">LXVI.</p>\n\t\t<p class="cantosubhead">(Loquitur) Berenice\u2019s Lock.</p>\n\t\t    <div class="stanza">\n\t\t      <p>He who every light of the sky world\u2019s vastness inspected,</p>\n\t\t      <p class="slindent">He who mastered in mind risings and settings of stars,</p>\n\t\t      <p>How of the fast rising sun obscured be the fiery splendours,</p>\n\t\t      <p class="slindent">How at the seasons assured vanish the planets from view,</p>\n\t\t      <p>How Diana to lurk thief-like \u2019neath Latmian stonefields,</p>\n\t\t      <p class="slindent">Summoned by sweetness of Love, comes from her a\xEBry gyre;</p>\n\t\t      <p>That same C\xF3non espied among lights Celestial shining</p>\n\t\t      <p class="slindent">Me, Berenice\u2019s Hair, which, from her glorious head,</p>\n\t\t      <p>Fulgent in brightness afar, to many a host of the Godheads</p>\n\t\t      <p class="slindent">Stretching her soft smooth arms she vowed to devoutly bestow,</p>\n\t\t      <p>What time strengthened by joy of new-made wedlock the monarch</p>\n\t\t      <p class="slindent">Bounds of Assyrian land hurried to plunder and pill;</p>\n\t\t      <p>Bearing of nightly strife new signs and traces delicious,</p>\n\t\t      <p class="slindent">Won in the war he waged virginal trophies to win.</p>\n\t\t      <p>Loathsome is Venus to all new-paired? Else why be the parents\u2019</p>\n\t\t      <p class="slindent">Pleasure frustrated aye by the false flow of tears</p>\n\t\t      <p>Poured in profusion amid illuminate genial chamber?</p>\n\t\t      <p class="slindent">Nay not real the groans; ever so help me the Gods!</p>\n\t\t      <p>This truth taught me my Queen by force of manifold \u2019plainings</p>\n\t\t      <p class="slindent">After her new groom hied facing the fierceness of fight.</p>\n\t\t      <p>Yet so thou mournedst not for a bed deserted of husband,</p>\n\t\t      <p class="slindent">As for a brother beloved wending on woefullest way?</p>\n\t\t      <p>How was the marrow of thee consumedly wasted by sorrow!</p>\n\t\t      <p class="slindent">So clean forth of thy breast, rackt with solicitous care,</p>\n\t\t      <p>Mind fled, sense being reft! But I have known thee for certain</p>\n\t\t      <p class="slindent">E\u2019en from young virginal years lofty of spirit to be.</p>\n\t\t      <p>Hast thou forgotten the feat whose greatness won thee a royal</p>\n\t\t      <p class="slindent">Marriage&mdash;a deed so prow, never a prower was dared?</p>\n\t\t      <p>Yet how sad was the speech thou spakest, thy husband farewelling!</p>\n\t\t      <p class="slindent">(Jupiter!) Often thine eyes wiping with sorrowful hand!</p>\n\t\t      <p>What manner God so great thus changed thee? Is it that lovers</p>\n\t\t      <p class="slindent">Never will tarry afar parted from person beloved?</p>\n\t\t      <p>Then unto every God on behalf of thy helpmate, thy sweeting,</p>\n\t\t      <p class="slindent">Me thou gavest in vow, not without bloodshed of bulls,</p>\n\t\t      <p>If he be granted return, and long while nowise delaying,</p>\n\t\t      <p class="slindent">Captive Asia he add unto Egyptian bounds.</p>\n\t\t      <p>Now for such causes I, enrolled in host of the Heavens,</p>\n\t\t      <p class="slindent">By a new present, discharge promise thou madest of old:</p>\n\t\t      <p>Maugr\xE8 my will, O Queen, my place on thy head I relinquished,</p>\n\t\t      <p class="slindent">Maugr\xE8 my will, I attest, swearing by thee and thy head;</p>\n\t\t      <p>Penalty due shall befall whoso makes oath to no purpose.</p>\n\t\t      <p class="slindent">Yet who assumes the vaunt forceful as iron to be?</p>\n\t\t      <p>E\u2019en was that mount o\u2019erthrown, though greatest in universe, where through</p>\n\t\t      <p class="slindent">Th\xEDa\u2019s illustrious race speeded its voyage to end,</p>\n\t\t      <p>Whenas the Medes brought forth new sea, and barbarous youth-hood</p>\n\t\t      <p class="slindent">Urged an Armada to swim traversing middle-Athos.</p>\n\t\t      <p>What can be done by Hair when such things yield them to Iron?</p>\n\t\t      <p class="slindent">Jupiter! Grant Chalybon perish the whole of the race,</p>\n\t\t      <p>Eke who in primal times ore seeking under the surface</p>\n\t\t      <p class="slindent">Showed th\u2019 example, and spalled iron however so hard.</p>\n\t\t      <p>Shortly before I was shorn my sister tresses bewail\xE8d</p>\n\t\t      <p class="slindent">Lot of me, e\u2019en as the sole brother to Memnon the Black,</p>\n\t\t      <p>Winnowing upper air wi\u2019 feathers flashing and quiv\u2019ring,</p>\n\t\t      <p class="slindent">Chloris\u2019 wing-borne steed, came before Arsino\xEB,</p>\n\t\t      <p>Whence upraising myself he flies through a\xEBry shadows,</p>\n\t\t      <p class="slindent">And in chaste Venus\u2019 breast drops he the present he bears.</p>\n\t\t      <p>Eke Zephyritis had sent, for the purpose trusted, her bondsman,</p>\n\t\t      <p class="slindent">Settler of Grecian strain on the Canopian strand.</p>\n\t\t      <p>So will\xE8d various Gods, lest sole \u2019mid lights of the Heavens</p>\n\t\t      <p class="slindent">Should Ariadne\u2019s crown taken from temples of her</p>\n\t\t      <p>Glitter in gold, but we not less shine fulgent in splendour,</p>\n\t\t      <p class="slindent">We the consecrate spoils shed by a blond-hued head,</p>\n\t\t      <p>Even as weeping-wet sought I the fanes of Celestials,</p>\n\t\t      <p class="slindent">Placed me the Goddess a new light amid starlights of old:</p>\n\t\t      <p>For with Virgo in touch and joining the furious Lion\u2019s</p>\n\t\t      <p class="slindent">Radiance with Callisto, maid of Lyc\xE1on beloved,</p>\n\t\t      <p>Wind I still to the west, conducting tardy Bo\xF6tes,</p>\n\t\t      <p class="slindent">Who unwilling and slow must into Ocean merge.</p>\n\t\t      <p>Yet though press me o\u2019night the pacing footprints of Godheads,</p>\n\t\t      <p class="slindent">Tethys, hoary of hair, ever regains me by day.</p>\n\t\t      <p>(Lend me thy leave to speak such words, Rhamnusian Virgin,</p>\n\t\t      <p class="slindent">Verities like unto these never in fear will I veil;</p>\n\t\t      <p>Albeit every star asperse me with enemy\u2019s censure,</p>\n\t\t      <p class="slindent">Secrets in soothfast heart hoarded perforce I reveal.)</p>\n\t\t      <p>Nowise gladdens me so this state as absence torments me,</p>\n\t\t      <p class="slindent">Absence doom\xE8d for aye ta\u2019en fro\u2019 my mistress\u2019s head,</p>\n\t\t      <p>Where I was wont (though she such cares unknew in her girlhood)</p>\n\t\t      <p class="slindent">Many a thousand scents, Syrian unguents, to sip.</p>\n\t\t      <p>Now do you pair conjoined by the longed-for light of the torches,</p>\n\t\t      <p class="slindent">Earlier yield not selves unto unanimous wills</p>\n\t\t      <p>Nor wi\u2019 the dresses doft your bar\xE8d nipples encounter,</p>\n\t\t      <p class="slindent">Ere shall yon onyx-vase pour me libations glad,</p>\n\t\t      <p>Onyx yours, ye that seek only rights of virtuous bed-rite.</p>\n\t\t      <p class="slindent">But who yieldeth herself unto advowtry impure,</p>\n\t\t      <p>Ah! may her loath\xE8d gifts in light dust uselessly soak,</p>\n\t\t      <p class="slindent">For of unworthy sprite never a gift I desire.</p>\n\t\t      <p>Rather, O new-mated brides, be concord aye your companion,</p>\n\t\t      <p class="slindent">Ever let constant love dwell in the dwellings of you.</p>\n\t\t      <p>Yet when thou sightest, O Queen, the Constellations, I pray thee,</p>\n\t\t      <p class="slindent">Every festal day Venus the Goddess appease;</p>\n\t\t      <p>Nor of thy unguent-gifts allow myself to be lacking,</p>\n\t\t      <p class="slindent">Nay, do thou rather add largeliest increase to boons.</p>\n\t\t      <p>Would but the stars down fall! Could I of my Queen be the hair-lock,</p>\n\t\t      <p class="slindent">Neighbour to Hydrochois e\u2019en let Oarion shine.</p>\n\t\t    </div>','<p class="cantohead">LXVII.</p>\n\t\t<p class="cantosubhead">Dialogue concerning Catullus at a Harlot\u2019s Door.</p>\n\t\t<p class="inthead"><em>Quintus</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>O to the gentle spouse right dear, right dear to his parent,</p>\n\t\t      <p class="slindent">Hail, and with increase fair Jupiter lend thee his aid,</p>\n\t\t      <p>Door, \u2019tis said wast fain kind service render to Balbus</p>\n\t\t      <p class="slindent">Erst while, long as the house by her old owner was held;</p>\n\t\t      <p>Yet wast rumoured again to serve a purpose malignant,</p>\n\t\t      <p class="slindent">After the elder was stretched, thou being oped for a bride.</p>\n\t\t      <p>Come, then, tell us the why in thee such change be reported</p>\n\t\t      <p class="slindent">That to thy lord hast abjured faithfulness ow\xE8d of old?</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Never (so chance I to please C\xE6cilius owning me now-a-days!)</p>\n\t\t      <p class="slindent">Is it my own default, how so they say it be mine;</p>\n\t\t      <p>Nor can any declare aught sin by me was committed.</p>\n\t\t      <p class="slindent">Yet it is so declared (Quintus!) by fable of folk;</p>\n\t\t      <p>Who, whenever they find things done no better than should be,</p>\n\t\t      <p class="slindent">Come to me outcrying all:&mdash;\u201CDoor, the default is thine own!\u201D</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Quintus</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>This be never enough for thee one-worded to utter,</p>\n\t\t      <p class="slindent">But in such way to deal, each and all sense it and see.</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>What shall I do? None asks, while nobody troubles to know.</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Quintus</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p class="slindent">Willing are we? unto us stay not thy saying to say.</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>First let me note that the maid to us committed (assert they)</p>\n\t\t      <p class="slindent">Was but a fraud: her mate never a touch of her had,</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>But that a father durst dishonour the bed of his firstborn,</p>\n\t\t      <p class="slindent">Folk all swear, and the house hapless with incest bewray;</p>\n\t\t      <p>Or that his impious mind was blunt with fiery passion</p>\n\t\t      <p class="slindent">Or that his impotent son sprang from incapable seed.</p>\n\t\t      <p>And to be sought was one with nerve more nervous endow\xE8d,</p>\n\t\t      <p class="slindent">Who could better avail zone of the virgin to loose.</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Quintus</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>\u2019Sooth, of egregious sire for piety wondrous, thou tellest,</p>\n\t\t      <p class="slindent">Who in the heart of his son lief was &mdash;&mdash;!</p>\n\t\t      <p>Yet professed herself not only this to be knowing,</p>\n\t\t      <p class="slindent">Brixia-town that lies under the Cycnean cliff,</p>\n\t\t      <p>Traversed by Mella-stream\u2019s soft-flowing yellow-hued current,</p>\n\t\t      <p class="slindent">Brixia, V\xE9rona\u2019s mother, I love for my home.</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Eke of Posthumius\u2019 loves and Cornelius too there be tattle,</p>\n\t\t      <p class="slindent">With whom dar\xE8d the dame evil advowtry commit.</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Quintus</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Here might somebody ask:&mdash;\u201CHow, Door, hast mastered such matter?</p>\n\t\t      <p class="slindent">Thou that canst never avail threshold of owner to quit,</p>\n\t\t      <p>Neither canst listen to folk since here fast fixt to the side-posts</p>\n\t\t      <p class="slindent">Only one office thou hast, shutting or opening the house.\u201D</p>\n\t\t    </div>\n\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Oft have I heard our dame in furtive murmurs o\u2019er telling,</p>\n\t\t      <p class="slindent">When with her handmaids alone, these her flagitious deeds,</p>\n\t\t      <p>Citing fore-cited names for that she never could fancy</p>\n\t\t      <p class="slindent">Ever a Door was endow\u2019d either with earlet or tongue.</p>\n\t\t      <p>Further she noted a wight whose name in public to mention</p>\n\t\t      <p class="slindent">Nill I, lest he upraise eyebrows of carroty hue;</p>\n\t\t      <p>Long is the loon and large the law-suit brought they against him</p>\n\t\t      <p class="slindent">Touching a child-bed false, claim of a belly that lied.</p>\n\t\t    </div>','<p class="cantohead">LXVIII.</p>\n\t\t<p class="cantosubhead">To Manius on Various Matters.</p>\n\t\t    <div class="stanza">\n\t\t      <p>When to me sore opprest by bitter chance of misfortune</p>\n\t\t      <p class="slindent">This thy letter thou send\u2019st written wi\u2019 blotting of tears,</p>\n\t\t      <p>So might I save thee flung by spuming billows of ocean,</p>\n\t\t      <p class="slindent">Shipwreckt, rescuing life snatcht from the threshold of death;</p>\n\t\t      <p>Eke neither Venus the Holy to rest in slumber\u2019s refreshment</p>\n\t\t      <p class="slindent">Grants thee her grace on couch lying deserted and lone,</p>\n\t\t      <p>Nor can the Muses avail with dulcet song of old writers</p>\n\t\t      <p class="slindent">Ever delight thy mind sleepless in anxious care;</p>\n\t\t      <p>Grateful be this to my thought since thus thy friend I\u2019m entitled,</p>\n\t\t      <p class="slindent">Hence of me seekest thou gifts Muses and Venus can give:</p>\n\t\t      <p>But that bide not unknown to thee my sorrows (O Manius!)</p>\n\t\t      <p class="slindent">And lest office of host I should be holden to hate,</p>\n\t\t      <p>Learn how in Fortune\u2019s deeps I chance myself to be drown\xE8d,</p>\n\t\t      <p class="slindent">Nor fro\u2019 the poor rich boons furthermore prithee require.</p>\n\t\t      <p>What while first to myself the pure-white garment was given,</p>\n\t\t      <p class="slindent">Whenas my flowery years flowed in fruition of spring,</p>\n\t\t      <p>Much I disported enow, nor \u2019bode I a stranger to Goddess</p>\n\t\t      <p class="slindent">Who with our cares is lief sweetness of bitter to mix:</p>\n\t\t      <p>Yet did a brother\u2019s death pursuits like these to my sorrow</p>\n\t\t      <p class="slindent">Bid for me cease: Oh, snatcht brother! from wretchedest me.</p>\n\t\t      <p>Then, yea, thou by thy dying hast broke my comfort, O brother;</p>\n\t\t      <p class="slindent">Buried together wi\u2019 thee lieth the whole of our house;</p>\n\t\t      <p>Perisht along wi\u2019 thyself all gauds and joys of our life-tide,</p>\n\t\t      <p class="slindent">Douce love fostered by thee during the term of our days.</p>\n\t\t      <p>After thy doom of death fro\u2019 mind I banish\xE8d wholly</p>\n\t\t      <p class="slindent">Studies like these, and all lending a solace to soul;</p>\n\t\t      <p>Wherefore as to thy writ:&mdash;\u201CVerona\u2019s home for Catullus</p>\n\t\t      <p class="slindent">Bringeth him shame, for there men of superior mark</p>\n\t\t      <p>Must on a deserted couch fain chafe their refrigerate limbs:\u201D</p>\n\t\t      <p class="slindent">Such be no shame (Manius!): rather \u2019tis matter of ruth.</p>\n\t\t      <p>Pardon me, then, wilt thou an gifts bereft me by grieving</p>\n\t\t      <p class="slindent">These I send not to thee since I avail not pres\xE8nt.</p>\n\t\t      <p>For, that I own not here abundant treasure of writings</p>\n\t\t      <p class="slindent">Has for its cause, in Rome dwell I; and there am I homed,</p>\n\t\t      <p>There be my seat, and there my years are gathered to harvest;</p>\n\t\t      <p class="slindent">Out of book-cases galore here am I followed by one.</p>\n\t\t      <p>This being thus, nill I thou deem \u2019tis spirit malignant</p>\n\t\t      <p class="slindent">Acts in such wise or mind lacking of liberal mood</p>\n\t\t      <p>That to thy prayer both gifts be not in plenty suppli\xE8d:</p>\n\t\t      <p class="slindent">Willingly both had I sent, had I the needed supply.</p>\n\t\t      <p>Nor can I (Goddesses!) hide in what things Allius sent me</p>\n\t\t      <p class="slindent">Aid, forbear to declare what was the aidance he deigned:</p>\n\t\t      <p>Neither shall fugitive Time from centuries ever oblivious</p>\n\t\t      <p class="slindent">Veil in the blinds of night friendship he lavisht on me.</p>\n\t\t      <p>But will I say unto you what you shall say to the many</p>\n\t\t      <p class="slindent">Thousands in turn, and make paper, old crone, to proclaim</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p class="slindent">And in his death become noted the more and the more,</p>\n\t\t      <p>Nor let spider on high that weaves her delicate webbing</p>\n\t\t      <p class="slindent">Practise such labours o\u2019er Allius\u2019 obsolete name.</p>\n\t\t      <p>For that ye weet right well what care Amath\xFAsia two-faced</p>\n\t\t      <p class="slindent">Gave me, and how she dasht every hope to the ground,</p>\n\t\t      <p>Whenas I burnt so hot as burn Trinacria\u2019s rocks or</p>\n\t\t      <p class="slindent">Mallia stream that feeds \u0152t\xE9an Thermopyl\xE6;</p>\n\t\t      <p>Nor did these saddened eyes to be dimmed by assiduous weeping</p>\n\t\t      <p class="slindent">Cease, and my cheeks with showers ever in sadness be wet.</p>\n\t\t      <p>E\u2019en as from a\xEBry heights of mountain springeth a springlet</p>\n\t\t      <p class="slindent">Limpidest leaping forth from rocking felted with moss,</p>\n\t\t      <p>Then having headlong rolled the prone-laid valley downpouring,</p>\n\t\t      <p class="slindent">Populous region amid wendeth his gradual way,</p>\n\t\t      <p>Sweetest solace of all to the sweltering traveller wayworn,</p>\n\t\t      <p class="slindent">Whenas the heavy heat fissures the fiery fields;</p>\n\t\t      <p>Or, as to seamen lost in night of whirlwind a-glooming</p>\n\t\t      <p class="slindent">Gentle of breath there comes fairest and favouring breeze,</p>\n\t\t      <p>Pollux anon being prayed, nor less vows offered to Castor:&mdash;</p>\n\t\t      <p class="slindent">Such was the aidance to us Manius pleased to afford.</p>\n\t\t      <p>He to my narrow domains far wider limits laid open,</p>\n\t\t      <p class="slindent">He too gave me the house, also he gave me the dame,</p>\n\t\t      <p>She upon whom both might exert them, partners in love deeds.</p>\n\t\t      <p class="slindent">Thither graceful of gait pacing my goddess white-hued</p>\n\t\t      <p>Came and with gleaming foot on the worn sole of the threshold</p>\n\t\t      <p class="slindent">Stood she and prest its slab creaking her sandals the while;</p>\n\t\t      <p>E\u2019en so with love enflamed in olden days to her helpmate,</p>\n\t\t      <p class="slindent">Laodam\xEDa the home Protesil\xE9an besought,</p>\n\t\t      <p>Sought, but in vain, for ne\u2019er wi\u2019 sacrificial bloodshed</p>\n\t\t      <p class="slindent">Victims appeas\xE8d the Lords ruling Celestial seats:</p>\n\t\t      <p>Never may I so joy in aught (Rhamnusian Virgin!)</p>\n\t\t      <p class="slindent">That I engage in deed maugr\xE8 the will of the Lords.</p>\n\t\t      <p>How starved altar can crave for gore in piety pour\xE8d,</p>\n\t\t      <p class="slindent">Laodamia learnt taught by the loss of her man,</p>\n\t\t      <p>Driven perforce to loose the neck of new-wedded help-mate,</p>\n\t\t      <p class="slindent">Whenas a winter had gone, nor other winter had come,</p>\n\t\t      <p>Ere in the long dark nights her greeding love was so sated</p>\n\t\t      <p class="slindent">That she had power to live maugr\xE8 a marriage broke off,</p>\n\t\t      <p>Which, as the Parc\xE6 knew, too soon was fated to happen</p>\n\t\t      <p class="slindent">Should he a soldier sail bound for those Ilian walls.</p>\n\t\t      <p>For that by Helena\u2019s rape, the Champion-leaders of Argives</p>\n\t\t      <p class="slindent">Unto herself to incite Troy had already begun,</p>\n\t\t      <p>Troy (ah, curst be the name) common tomb of Asia and Europe,</p>\n\t\t      <p class="slindent">Troy to sad ashes that turned valour and valorous men!</p>\n\t\t      <p>Eke to our brother beloved, destruction ever lamented</p>\n\t\t      <p class="slindent">Brought she: O Brother for aye lost unto wretchedmost me,</p>\n\t\t      <p>Oh, to thy wretchedmost brother lost the light of his life-tide,</p>\n\t\t      <p class="slindent">Buried together wi\u2019 thee lieth the whole of our house:</p>\n\t\t      <p>Perisht along wi\u2019 thyself forthright all joys we enjoy\xE8d,</p>\n\t\t      <p class="slindent">Douce joys fed by thy love during the term of our days;</p>\n\t\t      <p>Whom now art tombed so far nor \u2019mid familiar pavestones</p>\n\t\t      <p class="slindent">Nor wi\u2019 thine ashes stored near to thy kith and thy kin,</p>\n\t\t      <p>But in that Troy obscene, that Troy of ill-omen, entomb\xE8d</p>\n\t\t      <p class="slindent">Holds thee, an alien earth-buried in uttermost bourne.</p>\n\t\t      <p>Thither in haste so hot (\u2019tis said) from allwhere the Youth-hood</p>\n\t\t      <p class="slindent">Grecian, far\xE8d in hosts forth of their hearths and their homes,</p>\n\t\t      <p>Lest with a stolen punk with fullest of pleasure should Paris</p>\n\t\t      <p class="slindent">Fairly at leisure and ease sleep in the pacific bed.</p>\n\t\t      <p>Such was the hapless chance, most beautiful Laodamia,</p>\n\t\t      <p class="slindent">Tare fro\u2019 thee dearer than life, dearer than spirit itself,</p>\n\t\t      <p>Him, that husband, whose love in so mighty a whirlpool of passion</p>\n\t\t      <p class="slindent">Whelmed thee absorb\xE8d and plunged deep in its gulfy abyss,</p>\n\t\t      <p>E\u2019en as the Grecians tell hard by Phen\xE9us of Cyll\xE9ne</p>\n\t\t      <p class="slindent">Drained was the marish and dried, forming the fattest of soils,</p>\n\t\t      <p>Whenas in days long done to delve through marrow of mountains</p>\n\t\t      <p class="slindent">Dar\xE8d, falsing his sire, Amphtry\xF3niades;</p>\n\t\t      <p>What time sure of his shafts he smote Stymphalian monsters</p>\n\t\t      <p class="slindent">Slaying their host at the hest dealt by a lord of less worth,</p>\n\t\t      <p>So might the gateway of Heaven be trodden by more of the godheads,</p>\n\t\t      <p class="slindent">Nor might H\xE9b\xE9 abide longer to maidenhood doomed.</p>\n\t\t      <p>Yet was the depth of thy love far deeper than deepest of marish</p>\n\t\t      <p class="slindent">Which the hard mistress\u2019s yoke taught him so tamely to bear;</p>\n\t\t      <p>Never was head so dear to a grandsire wasted by life-tide</p>\n\t\t      <p class="slindent">Whenas one daughter alone a grandson so tardy had reared,</p>\n\t\t      <p>Who being found against hope to inherit riches of forbears</p>\n\t\t      <p class="slindent">In the well-witnessed Will haply by name did appear,</p>\n\t\t      <p>And \u2019spite impious hopes of baffled claimant to kinship</p>\n\t\t      <p class="slindent">Startles the Vulturine grip clutching the frost-bitten poll.</p>\n\t\t      <p>Nor with such rapture e\u2019er joyed his mate of snowy-hued plumage</p>\n\t\t      <p class="slindent">Dove-mate, albeit aye wont in her immoderate heat</p>\n\t\t      <p>Said be the bird to snatch hot kisses with beak ever billing,</p>\n\t\t      <p class="slindent">As diddest thou:&mdash;yet is Woman multivolent still.</p>\n\t\t      <p>But thou \u2019vailedest alone all these to conquer in love-lowe,</p>\n\t\t      <p class="slindent">When conjoin\xE8d once more unto thy yellow-haired spouse.</p>\n\t\t      <p>Worthy of yielding to her in naught or ever so little</p>\n\t\t      <p class="slindent">Came to the bosom of us she, the fair light of my life,</p>\n\t\t      <p>Round whom fluttering oft the Love-God hither and thither</p>\n\t\t      <p class="slindent">Shone with a candid sheen robed in his safflower dress.</p>\n\t\t      <p>She though never she bide with one Catullus contented,</p>\n\t\t      <p class="slindent">Yet will I bear with the rare thefts of my dame the discreet,</p>\n\t\t      <p>Lest over-irk I give which still of fools is the fashion.</p>\n\t\t      <p class="slindent">Often did Juno eke Queen of the Heavenly host</p>\n\t\t      <p>Boil wi\u2019 the rabidest rage at dire default of a husband</p>\n\t\t      <p class="slindent">Learning the manifold thefts of her omnivolent Jove,</p>\n\t\t      <p>Yet with the Gods mankind \u2019tis nowise righteous to liken,</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * < *</p>\n\t\t      <p class="slindent">Rid me of graceless task fit for a tremulous sire.</p>\n\t\t      <p>Yet was she never to me by hand paternal committed</p>\n\t\t      <p class="slindent">Whenas she came to my house reeking Assyrian scents;</p>\n\t\t      <p>Nay, in the darkness of night her furtive favours she deigned me,</p>\n\t\t      <p class="slindent">Self-willed taking herself from very mate\u2019s very breast.</p>\n\t\t      <p>Wherefore I hold it enough since given to us and us only</p>\n\t\t      <p class="slindent">Boon of that day with Stone whiter than wont she denotes.</p>\n\t\t      <p>This to thee&mdash;all that I can&mdash;this offering couched in verses</p>\n\t\t      <p class="slindent">(Allius!) as my return give I for service galore;</p>\n\t\t      <p>So wi\u2019 the seabriny rust your name may never be sullied</p>\n\t\t      <p class="slindent">This day and that nor yet other and other again.</p>\n\t\t      <p>Hereto add may the Gods all good gifts, which Themis erewhiles</p>\n\t\t      <p class="slindent">Wont on the pious of old from her full store to bestow:</p>\n\t\t      <p>Blest be the times of the twain, thyself and she who thy life is,</p>\n\t\t      <p class="slindent">Also the home wherein dallied we, no less the Dame,</p>\n\t\t      <p>Anser to boot who first of mortals brought us together,</p>\n\t\t      <p class="slindent">Whence from beginning all good Fortunes that blest us were born.</p>\n\t\t      <p>Lastly than every else one dearer than self and far dearer,</p>\n\t\t      <p class="slindent">Light of my life who alive living to me can endear.</p>\n\t\t    </div>','<p class="cantohead">LXVIIII.</p>\n\t\t<p class="cantosubhead">To Rufus the Fetid.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Wonder not blatantly why no woman shall ever be willing</p>\n\t\t      <p class="slindent">(Rufus!) her tender thigh under thyself to bestow,</p>\n\t\t      <p>Not an thou tempt her full by bribes of the rarest garments,</p>\n\t\t      <p class="slindent">Or by the dear delights gems the pellucidest deal.</p>\n\t\t      <p>Harms thee an ugly tale wherein of thee is recorded</p>\n\t\t      <p class="slindent">Horrible stench of the goat under thine arm-pits be lodged.</p>\n\t\t      <p>All are in dread thereof; nor wonder this, for \u2019tis evil</p>\n\t\t      <p class="slindent">Beastie, nor damsel fair ever thereto shall succumb.</p>\n\t\t      <p>So do thou either kill that cruel pest o\u2019 their noses,</p>\n\t\t      <p class="slindent">Or at their reason of flight blatantly wondering cease.</p>\n\t\t    </div>','<p class="cantohead">LXX.</p>\n\t\t<p class="cantosubhead">On Woman\u2019s Inconstancy.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Never, my woman oft says, with any of men will she mate be,</p>\n\t\t      <p class="slindent">Save wi\u2019 my own very self, ask her though Jupiter deign!</p>\n\t\t      <p>Says she: but womanly words that are spoken to desireful lover</p>\n\t\t      <p class="slindent">Ought to be written on wind or upon water that runs.</p>\n\t\t    </div>','<p class="cantohead">LXXI.</p>\n\t\t<p class="cantosubhead">To Verro.</p>\n\t\t    <div class="stanza">\n\t\t      <p>An of a goat-stink damned from armpits fusty one suffer,</p>\n\t\t      <p class="slindent">Or if a crippling gout worthily any one rack,</p>\n\t\t      <p>\u2019Tis that rival o\u2019 thine who lief in loves of you meddles,</p>\n\t\t      <p class="slindent">And, by a wondrous fate, gains him the twain of such ills.</p>\n\t\t      <p>For that, oft as he &mdash;&mdash;, so oft that penance be two-fold;</p>\n\t\t      <p class="slindent">Stifles her stench of goat, he too is kilt by his gout.</p>\n\t\t    </div>','<p class="cantohead">LXXII.</p>\n\t\t<p class="cantosubhead">To Lesbia the False.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Wont thou to vaunt whil\xF2me of knowing only Catullus</p>\n\t\t      <p class="slindent">(Lesbia!) nor to prefer Jupiter\u2019s self to myself.</p>\n\t\t      <p>Then, too, I loved thee well, not as vulgar wretch his mistress</p>\n\t\t      <p class="slindent">But as a father his sons loves and his sons by the law.</p>\n\t\t      <p>Now have I learnt thee aright; wherefor though burn I the hotter,</p>\n\t\t      <p class="slindent">Lighter and viler by far thou unto me hast become.</p>\n\t\t      <p>\u201CHow can this be?\u201D dost ask: \u2019tis that such injury ever</p>\n\t\t      <p class="slindent">Forces the hotter to love, also the less well to will.</p>\n\t\t    </div>','<p class="cantohead">LXXIII.</p>\n\t\t<p class="cantosubhead">Of an Ingrate.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Cease thou of any to hope desir\xE8d boon of well-willing,</p>\n\t\t      <p class="slindent">Or deem any shall prove pious and true to his dues.</p>\n\t\t      <p>Waxes the world ingrate, no deed benevolent profits,</p>\n\t\t      <p class="slindent">Nay full oft it irks even offending the more:</p>\n\t\t      <p>Such is my case whom none maltreats more grievously bitter,</p>\n\t\t      <p class="slindent">Than does the man that me held one and only to friend.</p>\n\t\t    </div>','<p class="cantohead">LXXIIII.</p>\n\t\t<p class="cantosubhead">Of Gellius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Wont was Gellius hear his uncle rich in reproaches,</p>\n\t\t      <p class="slindent">When any ventured aught wanton in word or in deed.</p>\n\t\t      <p>Lest to him chance such befall, his uncle\u2019s consort seduced he,</p>\n\t\t      <p class="slindent">And of his uncle himself fashioned an Harpocrates.</p>\n\t\t      <p>Whatso he willed did he; and nowdays albe his uncle</p>\n\t\t      <p class="slindent">&mdash;&mdash; he, no word ever that uncle shall speak.</p>\n\t\t    </div>','<p class="cantohead">LXXV,</p>\n\t\t<p class="cantosubhead">To Lesbia.</p>\n\t\t<div class="stanza">\n\t\t\t<p>So in devotion to thee lost is the duty self due,<p>\n\t\t\t<p>Nor can I will thee well if best of women thou prove thee,</p>\n\t\t\t<p>Nor can I cease to love, do thou what doings thou wilt.</p>\n\t\t</div>','<p class="cantohead">LXXVI.</p>\n\t\t<p class="cantosubhead">In Self-Gratulation.</p>\n\t\t    <div class="stanza">\n\t\t      <p>If to remember deeds whil\xF2me well done be a pleasure</p>\n\t\t      <p class="slindent">Meet for a man who deems all of his dealings be just,</p>\n\t\t      <p>Nor Holy Faith ever broke nor in whatever his compact</p>\n\t\t      <p class="slindent">Sanction of Gods abused better to swindle mankind,</p>\n\t\t      <p>Much there remains for thee during length of living, Catullus,</p>\n\t\t      <p class="slindent">Out of that Love ingrate further to solace thy soul;</p>\n\t\t      <p>For whatever of good can mortal declare of another</p>\n\t\t      <p class="slindent">Or can avail he do, such thou hast said and hast done;</p>\n\t\t      <p>While to a thankless mind entrusted all of them perisht.</p>\n\t\t      <p class="slindent">Why, then, crucify self now with a furthering pain?</p>\n\t\t      <p>Why not steady thy thoughts and draw thee back from such purpose,</p>\n\t\t      <p class="slindent">Ceasing wretched to be maugr\xE8 the will of the Gods?</p>\n\t\t      <p>Difficult \u2019tis indeed long Love to depose of a sudden,</p>\n\t\t      <p class="slindent">Difficult \u2019tis, yet do e\u2019en as thou deem to be best.</p>\n\t\t      <p>This be thy safe-guard sole; this conquest needs to be conquered;</p>\n\t\t      <p class="slindent">This thou must do, thus act, whether thou cannot or can.</p>\n\t\t      <p>If an ye have (O Gods!) aught ruth, or if you for any</p>\n\t\t      <p class="slindent">Bring at the moment of death latest assistance to man,</p>\n\t\t      <p>Look upon me (poor me!) and, should I be cleanly of living,</p>\n\t\t      <p class="slindent">Out of my life deign pluck this my so pestilent plague,</p>\n\t\t      <p>Which as a lethargy o\u2019er mine inmost vitals a-creeping,</p>\n\t\t      <p class="slindent">Hath from my bosom expelled all of what joyance it joyed,</p>\n\t\t      <p>Now will I crave no more she love me e\u2019en as I love her,</p>\n\t\t      <p class="slindent">Nor (impossible chance!) ever she prove herself chaste:</p>\n\t\t      <p>Would I were only healed and shed this fulsome disorder.</p>\n\t\t      <p class="slindent">Oh Gods, grant me this boon unto my piety due!</p>\n\t\t    </div>','<p class="cantohead">LXXVII.</p>\n\t\t<p class="cantosubhead">To Rufus, the Traitor Friend.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Rufus, trusted as friend by me, so fruitlessly, vainly,</p>\n\t\t      <p class="slindent">(Vainly? nay to my bane and at a ruinous price!)</p>\n\t\t      <p>Hast thou cajoled me thus, and enfiring innermost vitals,</p>\n\t\t      <p class="slindent">Ravished the whole of our good own\u2019d by wretchedest me?</p>\n\t\t      <p>Ravished; (alas and alas!) of our life thou cruellest cruel</p>\n\t\t      <p class="slindent">Venom, (alas and alas!) plague of our friendship and pest.</p>\n\t\t      <p>Yet must I now lament that lips so pure of the purest</p>\n\t\t      <p class="slindent">Damsel, thy slaver foul soil\xE8d with filthiest kiss.</p>\n\t\t      <p>But ne\u2019er hope to escape scot free; for thee shall all ages</p>\n\t\t      <p class="slindent">Know, and what thing thou be, Fame, the old crone, shall declare.</p>\n\t\t    </div>','<p class="cantohead">LXXVIII.</p>\n\t\t<p class="cantosubhead">Of Gallus.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Gallus hath brothers in pair, this owning most beautiful consort,</p>\n\t\t      <p class="slindent">While unto that is given also a beautiful son.</p>\n\t\t      <p>Gallus is charming as man; for sweet loves ever conjoins he,</p>\n\t\t      <p class="slindent">So that the charming lad sleep wi\u2019 the charmer his lass.</p>\n\t\t      <p>Gallus is foolish wight, nor self regards he as husband,</p>\n\t\t      <p class="slindent">When being uncle how nuncle to cuckold he show.</p>\n\t\t    </div>','<p class="cantohead">LXXVIIII.</p>\n\t\t<p class="cantosubhead">Of Lesbius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Lesbius is beauty-man: why not? when Lesbia wills him</p>\n\t\t      <p class="slindent">Better, Catullus, than thee backed by the whole of thy clan.</p>\n\t\t      <p>Yet may that beauty-man sell all his clan with Catullus,</p>\n\t\t      <p class="slindent">An of three noted names greeting salute he can gain.</p>\n\t\t    </div>','<p class="cantohead">LXXX.</p>\n\t\t<p class="cantosubhead">To Gellius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>How shall I (Gellius!) tell what way lips rosy as thine are</p>\n\t\t      <p class="slindent">Come to be bleached and blanched whiter than wintry snow,</p>\n\t\t      <p>Whenas thou quittest the house a-morn, and at two after noon-tide</p>\n\t\t      <p class="slindent">Rous\xE8d from quiet repose, wakest for length of the day?</p>\n\t\t      <p>Cert\xE8s sure am I not an Rumour rightfully whisper</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t    </div>','<p class="cantohead">LXXXI.</p>\n\t\t<p class="cantosubhead">To Juventius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Could there never be found in folk so thronging (Juventius!)</p>\n\t\t      <p class="slindent">Any one charming thee whom thou couldst fancy to love,</p>\n\t\t      <p>Save and except that host from deadliest site of Pisaurum,</p>\n\t\t      <p class="slindent">Wight than a statue gilt wanner and yellower-hued,</p>\n\t\t      <p>Whom to thy heart thou takest and whom thou darest before us</p>\n\t\t      <p class="slindent">Choose? But villain what deed doest thou little canst wot!</p>\n\t\t    </div>','<p class="cantohead">LXXXII.</p>\n\t\t<p class="cantosubhead">To Quintius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quintius! an thou wish that Catullus should owe thee his eyes</p>\n\t\t      <p class="slindent">Or aught further if aught dearer can be than his eyes,</p>\n\t\t      <p>Thou wilt not ravish from him what deems he dearer and nearer</p>\n\t\t      <p class="slindent">E\u2019en than his eyes if aught dearer there be than his eyes.</p>\n\t\t    </div>','<p class="cantohead">LXXXIII.</p>\n\t\t<p class="cantosubhead">Of Lesbia\u2019s Husband.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Lesbia heaps upon me foul words her mate being present;</p>\n\t\t      <p class="slindent">Which to that simple soul causes the fullest delight.</p>\n\t\t      <p>Mule! naught sensest thou: did she forget us in silence,</p>\n\t\t      <p class="slindent">Whole she had been; but now whatso she rails and she snarls,</p>\n\t\t      <p>Not only dwells in her thought, but worse and even more risky,</p>\n\t\t      <p class="slindent">Wrathful she bides. Which means, she is afire and she fumes.</p>\n\t\t    </div>','<p class="cantohead">LXXXIIII.</p>\n\t\t<p class="cantosubhead">On Arrius, a Roman \u2019Arry.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Wont is Arrius say \u201CChommodious\u201D whenas \u201Ccommodious\u201D</p>\n\t\t      <p class="slindent">Means he, and \u201CInsidious\u201D aspirate \u201CHinsidious,\u201D</p>\n\t\t      <p>What time flattering self he speaks with marvellous purity,</p>\n\t\t      <p class="slindent">Clamouring \u201CHinsidious\u201D loudly as ever he can.</p>\n\t\t      <p>Deem I thus did his dame and thus-wise Liber his uncle</p>\n\t\t      <p class="slindent">Speak, and on spindle-side grandsire and grandmother too.</p>\n\t\t      <p>Restful reposed all ears when he was sent into Syria,</p>\n\t\t      <p class="slindent">Hearing the self-same words softly and smoothly pronounc\xE8d,</p>\n\t\t      <p>Nor any feared to hear such harshness uttered thereafter,</p>\n\t\t      <p class="slindent">Whenas a sudden came message of horrible news,</p>\n\t\t      <p>Namely th\u2019 Ionian waves when Arrius thither had wended,</p>\n\t\t      <p class="slindent">Were \u201CIonian\u201D no more&mdash;they had \u201CHionian\u201D become.</p>\n\t\t    </div>','<p class="cantohead">LXXXV.</p>\n\t\t<p class="cantosubhead">How the Poet Loves.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Hate I, and love I. Haps thou\u2019lt ask me wherefore I do so.</p>\n\t\t      <p class="slindent">Wot I not, yet so I do feeling a torture of pain.</p>\n\t\t    </div>','<p class="cantohead">LXXXVI.</p>\n\t\t<p class="cantosubhead">Of Quintia.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quintia beautiful seems to the crowd; to me, fair, and tall,</p>\n\t\t      <p class="slindent">Straight; and merits as these readily thus I confess,</p>\n\t\t      <p>But that she is beauteous all I deny, for nothing of lovesome,</p>\n\t\t      <p class="slindent">Never a grain of salt, shows in her person so large.</p>\n\t\t      <p>Lesbia beautiful seems, and when all over she\u2019s fairest,</p>\n\t\t      <p class="slindent">Any Venus-gift stole she from every one.</p>\n\t\t    </div>','<p class="cantohead">LXXXVII.</p>\n\t\t<p class="cantosubhead">To Lesbia.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Never a woman could call herself so fondly belov\xE8d</p>\n\t\t      <p class="slindent">Truly as Lesbia mine has been beloved of myself.</p>\n\t\t      <p>Never were Truth and Faith so firm in any one compact</p>\n\t\t      <p class="slindent">As on the part of me kept I my love to thyself.</p>\n\t\t      <p>Now is my mind to a pass, my Lesbia, brought by thy treason,</p>\n\t\t      <p class="slindent">So in devotion to thee lost is the duty self due,</p>\n\t\t      <p>Nor can I will thee well if best of women thou prove thee,</p>\n\t\t      <p class="slindent">Nor can I cease to love, do thou what doings thou wilt.</p>\n\t\t    </div>','<p class="cantohead">LXXXVIII.</p>\n\t\t<p class="cantosubhead">To Gellius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>What may he (Gellius!) do that ever for mother and sister</p>\n\t\t      <p class="slindent">Itches and wakes thro\u2019 the nights, working wi\u2019 tunic bedoffed?</p>\n\t\t      <p>What may he do who nills his uncle ever be husband?</p>\n\t\t      <p class="slindent">Wottest thou how much he ventures of sacrilege-sin?</p>\n\t\t      <p>Ventures he (O Gellius!) what ne\u2019er can ultimate Tethys</p>\n\t\t      <p class="slindent">Wash from his soul, nor yet Ocean, watery sire.</p>\n\t\t      <p>For that of sin there\u2019s naught wherewith this sin can exceed he</p>\n\t\t      <p class="slindent">&mdash;&mdash; his head on himself.</p>\n\t\t    </div>','<p class="cantohead">LXXXVIIII.</p>\n\t\t<p class="cantosubhead">On Gellius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Gellius is lean: Why not? For him so easy a mother</p>\n\t\t      <p class="slindent">Lives, and a sister so boon, bonny and buxom to boot,</p>\n\t\t      <p>Uncle so kindly good and all things full of his lady-</p>\n\t\t      <p class="slindent">Cousins, how can he cease leanest of lankies to be?</p>\n\t\t      <p>Albeit, touch he naught save that whose touch is a scandal,</p>\n\t\t      <p class="slindent">Soon shall thou find wherefor he be as lean as thou like.</p>\n\t\t    </div>','<p class="cantohead">LXXXX.</p>\n\t\t<p class="cantosubhead">On Gellius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Born be a Magus, got by Gellius out of his mother</p>\n\t\t      <p class="slindent">(Marriage nefand!) who shall Persian augury learn.</p>\n\t\t      <p>Needs it a Magus begot of son upon mother who bare him,</p>\n\t\t      <p class="slindent">If that impious faith, Persian religion be fact,</p>\n\t\t      <p>So may their issue adore busy gods with recognised verses</p>\n\t\t      <p class="slindent">Melting in altar-flame fatness contained by the caul.</p>\n\t\t    </div>','<p class="cantohead">LXXXXI.</p>\n\t\t<p class="cantosubhead">To Gellius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Not for due cause I hoped to find thee (Gellius!) faithful</p>\n\t\t      <p class="slindent">In this saddest our love, love that is lost and forlore,</p>\n\t\t      <p>Or fro\u2019 my wotting thee well or ever believing thee constant,</p>\n\t\t      <p class="slindent">Or that thy mind could reject villany ever so vile,</p>\n\t\t      <p>But that because was she to thyself nor mother nor sister,</p>\n\t\t      <p class="slindent">This same damsel whose Love me in its greatness devoured.</p>\n\t\t      <p>Yet though I had been joined wi\u2019 thee by amplest of usance,</p>\n\t\t      <p class="slindent">Still could I never believe this was sufficient of cause.</p>\n\t\t      <p>Thou diddest deem it suffice: so great is thy pleasure in every</p>\n\t\t      <p class="slindent">Crime wherein may be found somewhat enormous of guilt.</p>\n\t\t    </div>','<p class="cantohead">LXXXXII.</p>\n\t\t<p class="cantosubhead">On Lesbia.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Lesbia naggeth at me evermore and ne\u2019er is she silent</p>\n\t\t      <p class="slindent">Touching myself: May I die but that by Lesbia I\u2019m loved.</p>\n\t\t      <p>What be the proof? I rail and retort like her and revile her</p>\n\t\t      <p class="slindent">Carefully, yet may I die but that I love her with love.</p>\n\t\t    </div>','<p class="cantohead">LXXXXIII.</p>\n\t\t<p class="cantosubhead">On Julius C\xE6sar.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Study I not o\u2019ermuch to please thee (C\xE6sar!) and court thee,</p>\n\t\t      <p class="slindent">Nor do I care e\u2019en to know an thou be white or be black.</p>\n\t\t    </div>','<p class="cantohead">LXXXXIIII.</p>\n\t\t<p class="cantosubhead">Against Mentula (Mamurra).</p>\n\t\t    <div class="stanza">\n\t\t      <p>Mentula wooeth much: much wooeth he, be assured.</p>\n\t\t      <p class="slindent">That is, e\u2019en as they say, the Pot gathers leeks for the pot.</p>\n\t\t    </div>','<p class="cantohead">LXXXXV.</p>\n\t\t<p class="cantosubhead">On the \u201CZmyrna\u201D of the Poet Cinna.</p>\n\t\t    <div class="stanza">\n\t\t      <p>\u201CZmyrna\u201D begun erstwhile nine harvests past by my Cinna</p>\n\t\t      <p class="slindent">Publisht appears when now nine of his winters be gone;</p>\n\t\t      <p>Thousands fifty of lines meanwhile Hortensius in single</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>\u201CZmyrna\u201D shall travel afar as the hollow breakers of Satrax,</p>\n\t\t      <p class="slindent">\u201CZmyrna\u201D by ages grey lastingly shall be perused.</p>\n\t\t      <p>But upon Padus\u2019 brink shall die Volusius his annals</p>\n\t\t      <p class="slindent">And to the mackerel oft loose-fitting jacket afford.</p>\n\t\t      <p>Dear to my heart are aye the lightest works of my comrade,</p>\n\t\t      <p class="slindent">Leave I the mob to enjoy tumidest Antimachus.</p>\n\t\t    </div>','<p class="cantohead">LXXXXVI.</p>\n\t\t<p class="cantosubhead">To Calvus anent Dead Quintilia.</p>\n\t\t    <div class="stanza">\n\t\t      <p>If to the dumb deaf tomb can aught or grateful or pleasing</p>\n\t\t      <p class="slindent">(Calvus!) ever accrue rising from out of our dule,</p>\n\t\t      <p>Wherewith yearning desire renews our loves in the bygone,</p>\n\t\t      <p class="slindent">And for long friendships lost many a tear must be shed;</p>\n\t\t      <p>Cert\xE8s, never so much for doom of premature death-day</p>\n\t\t      <p class="slindent">Must thy Quintilia mourn as she is joyed by thy love.</p>\n\t\t    </div>','<p class="cantohead">LXXXXVII.</p>\n\t\t<p class="cantosubhead">On \xC6milius the Foul.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Never (so love me the Gods!) deemed I \u2019twas preference matter</p>\n\t\t      <p class="slindent">Or \xC6milius\u2019 mouth choose I to smell or his &mdash;&mdash;</p>\n\t\t      <p>Nothing is this more clean, uncleaner nothing that other,</p>\n\t\t      <p class="slindent">Yet I ajudge &mdash;&mdash; cleaner and nicer to be;</p>\n\t\t      <p>For while this one lacks teeth, that one has cubit-long tushes,</p>\n\t\t      <p class="slindent">Set in their battered gums favouring a muddy old box,</p>\n\t\t      <p>Not to say aught of gape like wide-cleft gap of a she-mule</p>\n\t\t      <p class="slindent">Whenas in summer-heat wont peradventure to stale.</p>\n\t\t      <p>Yet has he many a motte and holds himself to be handsome&mdash;</p>\n\t\t      <p class="slindent">Why wi\u2019 the baker\u2019s ass is he not bound to the mill?</p>\n\t\t      <p>Him if a damsel kiss we fain must think she be ready</p>\n\t\t      <p class="slindent">With her fair lips &mdash;&mdash;</p>\n\t\t    </div>','<p class="cantohead">LXXXXVIII.</p>\n\t\t<p class="cantosubhead">To Victius the Stinkard.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Rightly of thee may be said, an of any, (thou stinkingest Victius!)</p>\n\t\t      <p class="slindent">Whatso wont we to say touching the praters and prigs.</p>\n\t\t      <p>Thou wi\u2019 that tongue o\u2019 thine own, if granted occasion availest</p>\n\t\t      <p class="slindent">Brogues of the cowherds to kiss, also their &mdash;&mdash;</p>\n\t\t      <p>Wouldst thou undo us all with a thorough undoing (O Victius!)</p>\n\t\t      <p class="slindent">Open thy gape:&mdash;thereby all shall be wholly undone.</p>\n\t\t    </div>','<p class="cantohead">LXXXXVIIII.</p>\n\t\t<p class="cantosubhead">To Juventius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>E\u2019en as thou played\u2019st, from thee snatched I (O honied Juventius!)</p>\n\t\t      <p class="slindent">Kisslet of savour so sweet sweetest Ambrosia unknows.</p>\n\t\t      <p>Yet was the theft nowise scot-free, for more than an hour I</p>\n\t\t      <p class="slindent">Clearly remember me fixt hanging from crest of the Cross,</p>\n\t\t      <p>Whatwhile I purged my sin unto thee nor with any weeping</p>\n\t\t      <p class="slindent">Tittle of cruel despite such as be thine could I \u2019bate.</p>\n\t\t      <p>For that no sooner done thou washed thy liplets with many</p>\n\t\t      <p class="slindent">Drops which thy fingers did wipe, using their every joint,</p>\n\t\t      <p>Lest of our mouths conjoined remain there aught by the contact</p>\n\t\t      <p class="slindent">Like unto slaver foul shed by the butter\xE8d bun.</p>\n\t\t      <p>Further, wretchedmost me betrayed to unfriendliest Love-god</p>\n\t\t      <p class="slindent">Never thou ceased\u2019st to pain hurting with every harm,</p>\n\t\t      <p>So that my taste be turned and kisses ambrosial erstwhile</p>\n\t\t      <p class="slindent">Even than hellebore-juice bitterest bitterer grow.</p>\n\t\t      <p>Seeing such pangs as these prepared for unfortunate lover,</p>\n\t\t      <p class="slindent">After this never again kiss will I venture to snatch.</p>\n\t\t    </div>','<p class="cantohead">C.</p>\n\t\t<p class="cantosubhead">On C\xE6lius and Quintius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>C\xE6lius Aufil\xE9nus and Quintius Aufil\xE9na,</p>\n\t\t      <p class="slindent">Love to the death, both swains bloom of the youth Veronese,</p>\n\t\t      <p>This woo\u2019d brother and that sue\u2019d sister: so might the matter</p>\n\t\t      <p class="slindent">Claim to be titled wi\u2019 sooth fairest fraternalest tie.</p>\n\t\t      <p>Whom shall I favour the first? Thee (C\xE6lius!) for thou hast prov\xE8d</p>\n\t\t      <p class="slindent">Singular friendship to us shown by the deeds it has done,</p>\n\t\t      <p>Whenas the flames insane had madded me, firing my marrow:</p>\n\t\t      <p class="slindent">C\xE6lius! happy be thou; ever be lusty in love.</p>\n\t\t    </div>','<p class="cantohead">CI.</p>\n\t\t<p class="cantosubhead">On the Burial of his Brother.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Faring thro\u2019 many a folk and plowing many a sea-plain</p>\n\t\t      <p class="slindent">These sad funeral-rites (Brother!) to deal thee I come,</p>\n\t\t      <p>So wi\u2019 the latest boons to the dead bestowed I may gift thee,</p>\n\t\t      <p class="slindent">And I may vainly address ashes that answer have none,</p>\n\t\t      <p>Sithence of thee, very thee, to deprive me Fortune behested,</p>\n\t\t      <p class="slindent">Woe for thee, Brother forlore! Cruelly severed fro\u2019 me.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Yet in the meanwhile now what olden usage of forbears</p>\n\t\t      <p class="slindent">Brings as the boons that befit mournfullest funeral rites,</p>\n\t\t      <p>Thine be these gifts which flow with tear-flood shed by thy brother,</p>\n\t\t      <p class="slindent">And, for ever and aye (Brother!) all hail and farewell.</p>\n\t\t    </div>','<p class="cantohead">CII.</p>\n\t\t<p class="cantosubhead">To Cornelius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>If by confiding friend aught e\u2019er be trusted in silence,</p>\n\t\t      <p class="slindent">Unto a man whose mind known is for worthiest trust,</p>\n\t\t      <p>Me shalt thou find no less than such to secrecy oathbound,</p>\n\t\t      <p class="slindent">(Cornelius!) and now hold me an Harpocrates.</p>\n\t\t    </div>','<p class="cantohead">CIII.</p>\n\t\t<p class="cantosubhead">To Silo.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Or, d\u2019ye hear, refund those ten sestertia (Silo!)</p>\n\t\t      <p class="slindent">Then be thou e\u2019en at thy will surly and savage o\u2019 mood:</p>\n\t\t      <p>Or, an thou love o\u2019er-well those moneys, prithee no longer</p>\n\t\t      <p class="slindent">Prove thee a pimp and withal surly and savage o\u2019 mood.</p>\n\t\t    </div>','<p class="cantohead">CIIII.</p>\n\t\t<p class="cantosubhead">Concerning Lesbia.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Canst thou credit that I could avail to revile my life-love,</p>\n\t\t      <p class="slindent">She who be dearer to me even than either my eyes?</p>\n\t\t      <p>Ne\u2019er could I, nor an I could, should I so losingly love her:</p>\n\t\t      <p class="slindent">But with Tappo thou dost design every monstrous deed.</p>\n\t\t    </div>','<p class="cantohead">CV.</p>\n\t\t<p class="cantosubhead">On Mamurra.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Mentula fain would ascend Pipl\xE9an mountain up-mounting:</p>\n\t\t      <p class="slindent">Pitch him the Muses down headlong wi\u2019 forklets a-hurled.</p>\n\t\t    </div>','<p class="cantohead">CVI.</p>\n\t\t<p class="cantosubhead">The Auctioneer and the Fair Boy.</p>\n\t\t    <div class="stanza">\n\t\t      <p>When with a pretty-faced boy we see one playing the Crier,</p>\n\t\t      <p class="slindent">What can we wot except longs he for selling the same?</p>\n\t\t    </div>','<p class="cantohead">CVII.</p>\n\t\t<p class="cantosubhead">To Lesbia Reconciled.</p>\n\t\t    <div class="stanza">\n\t\t      <p>An to one ever accrue any boon he lusted and longed for</p>\n\t\t      <p class="slindent">Any time after despair, grateful it comes to his soul.</p>\n\t\t      <p>Thus \u2019tis grateful to us nor gold was ever so goodly,</p>\n\t\t      <p class="slindent">When thou restorest thyself (Lesbia!) to lovingmost me,</p>\n\t\t      <p>Self thou restorest unhoped, and after despair thou returnest.</p>\n\t\t      <p class="slindent">Oh the fair light of a Day noted with notabler white!</p>\n\t\t      <p>Where lives a happier man than myself or&mdash;this being won me&mdash;</p>\n\t\t      <p class="slindent">Who shall e\u2019er boast that his life brought him more coveted lot?</p>\n\t\t    </div>','<p class="cantohead">CVIII.</p>\n\t\t<p class="cantosubhead">On Cominius.</p>\n\t\t    <div class="stanza">\n\t\t      <p>If by the verdict o\u2019 folk thy hoary old age (O Cominius!)</p>\n\t\t      <p class="slindent">Filthy with fulsomest lust ever be doomed to the death,</p>\n\t\t      <p>Make I no manner of doubt but first thy tongue to the worthy</p>\n\t\t      <p class="slindent">Ever a foe, cut out, ravening Vulture shall feed;</p>\n\t\t      <p>Gulp shall the Crow\u2019s black gorge those eye-balls dug from their sockets,</p>\n\t\t      <p class="slindent">Guts of thee go to the dogs, all that remains to the wolves.</p>\n\t\t    </div>','<p class="cantohead">CVIIII.</p>\n\t\t<p class="cantosubhead">To Lesbia on Her Vow of Constancy.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Gladsome to me, O my life, this love whose offer thou deignest</p>\n\t\t      <p class="slindent">Between us twain lively and lusty to last soothfast.</p>\n\t\t      <p>(Great Gods!) grant ye the boon that prove her promises loyal,</p>\n\t\t      <p class="slindent">Saying her say in truth spoken with spirit sincere;</p>\n\t\t      <p>So be it lawful for us to protract through length of our life-tide</p>\n\t\t      <p class="slindent">Mutual pact of our love, pledges of holy good will!</p>\n\t\t    </div>','<p class="cantohead">CX.</p>\n\t\t<p class="cantosubhead">To Aufilena.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Aufil\xE9na! for aye good lasses are lauded as loyal:</p>\n\t\t      <p class="slindent">Price of themselves they accept when they intend to perform.</p>\n\t\t      <p>All thou promised\u2019st me in belying proves thee unfriendly,</p>\n\t\t      <p class="slindent">For never giving and oft taking is deed illy done.</p>\n\t\t      <p>Either as honest to grant, or modest as never to promise,</p>\n\t\t      <p class="slindent">Aufil\xE9na! were fair, but at the gifties to clutch</p>\n\t\t      <p>Fraudfully, viler seems than greed of greediest harlot</p>\n\t\t      <p class="slindent">Who with her every limb maketh a whore of herself.</p>\n\t\t    </div>','<p class="cantohead">CXI.</p>\n\t\t<p class="cantosubhead">To the Same.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Aufil\xE9na! to live content with only one husband,</p>\n\t\t      <p class="slindent">Praise is and truest of praise ever bestowed upon wife.</p>\n\t\t      <p>Yet were it liefer to lie any wise with any for lover,</p>\n\t\t      <p class="slindent">Than to be breeder of boys uncle as cousins begat.</p>\n\t\t    </div>','<p class="cantohead">CXII.</p>\n\t\t<p class="cantosubhead">On Naso.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Great th\u2019art (Naso!) as man, nor like thee many in greatness</p>\n\t\t      <p class="slindent">Lower themselves (Naso!): great be thou, pathic to boot.</p>\n\t\t    </div>','<p class="cantohead">CXIII.</p>\n\t\t<p class="cantosubhead">To Cinna.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Pompey first being chosen to Consul, twofold (O Cinna!)</p>\n\t\t      <p class="slindent">Men for amours were famed: also when chosen again</p>\n\t\t      <p>Two they remained; but now is each one grown to a thousand</p>\n\t\t      <p class="slindent">Gallants:&mdash;fecundate aye springeth adultery\u2019s seed.</p>\n\t\t    </div>','<p class="cantohead">CXIIII.</p>\n\t\t<p class="cantosubhead">On Mamurra\u2019s Squandering.</p>\n\t\t    <div class="stanza">\n\t\t      <p>For yon Firmian domain not falsely Mentula hight is</p>\n\t\t      <p class="slindent">Richard, owning for self so many excellent things&mdash;</p>\n\t\t      <p>Fish, fur, feather, all kinds, with prairie, corn-land, and ferals.</p>\n\t\t      <p class="slindent">All no good: for th\u2019 outgoing, income immensely exceeds.</p>\n\t\t      <p>Therefore his grounds be rich own I, while he\u2019s but a pauper.</p>\n\t\t      <p class="slindent">Laud we thy land while thou lackest joyance thereof.</p>\n\t\t    </div>','<p class="cantohead">CXV.</p>\n\t\t<p class="cantosubhead">Of the Same.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Mentula! masterest thou some thirty acres of grass-land</p>\n\t\t      <p class="slindent">Full told, forty of field soil; others are sized as the sea.</p>\n\t\t      <p>Why may he not surpass in his riches any a Cr&oelig;sus</p>\n\t\t      <p class="slindent">Who in his one domain owns such abundance of good,</p>\n\t\t      <p>Grass-lands, arable fields, vast woods and forest and marish</p>\n\t\t      <p class="slindent">Yonder to Boreal-bounds trenching on Ocean tide?</p>\n\t\t      <p>Great are indeed all these, but thou by far be the greatest,</p>\n\t\t      <p class="slindent">Never a man, but a great Mentula of menacing might.</p>\n\t\t    </div>','<p class="cantohead">CXVI.</p>\n\t\t<p class="cantosubhead">To Gellius the Critic.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Seeking often in mind with spirit eager of study</p>\n\t\t      <p class="slindent">How I could send thee songs chaunted of Battiad\xE9s,</p>\n\t\t      <p>So thou be softened to us, nor any attempting thou venture</p>\n\t\t      <p class="slindent">Shot of thy hostile shaft piercing me high as its head,&mdash;</p>\n\t\t      <p>Now do I ken this toil with vainest purpose was taken,</p>\n\t\t      <p class="slindent">(Gellius!) nor herein aught have our prayers avail\xE8d.</p>\n\t\t      <p>Therefore we\u2019ll parry with cloak what shafts thou shootest against us;</p>\n\t\t      <p class="slindent">And by our bolts transfixt, penalty due thou shalt pay.</p>\n\t\t    </div>']};

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// catulluscarmina/burtonsmithersprose.js
module.exports={bookname:'catulluscarmina',author:'Caius Valerius Catullus',translationid:"burtonsmithersprose",title:'The Carmina',translation:true,source:'<a href="http://www.gutenberg.org/files/20732/20732-h/20732-h.htm">Project Gutenberg</a>',translationshortname:"Burton/Smithers prose",translationfullname:"Richard Burton & Leonard C. Smithers prose",translationclass:"prose",text:['<p class="title">The Carmina</p>\n\t<p class="author">Richard Burton &amp; Leonard C. Smithers</p>\n\t<p class="subtitle">(prose translation)</p>','<p class="cantohead">I.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>To whom inscribe my dainty tome\u2014just out and with ashen pumice polished? Cornelius, to thee! for thou wert wont to deem my triflings of account, and at a time when thou alone of Italians didst dare unfold the ages\u2019 abstract in three chronicles\u2014learned, by Jupiter!\u2014and most laboriously writ. Wherefore take thou this booklet, such as \u2019tis, and O Virgin Patroness, may it outlive generations more than one.</p>','<p class="cantohead">II.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Sparrow, petling of my girl, with which she wantons, which she presses to her bosom, and whose eager peckings is accustomed to incite by stretching forth her forefinger, when my bright-hued beautiful one is pleased to jest in manner light as (perchance) a solace for her heart ache, thus methinks she allays love\u2019s pressing heats! Would that in manner like, I were able with thee to sport and sad cares of mind to lighten!</p>','<p class="cantohead">III.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Mourn ye, O ye Loves and Cupids and all men of gracious mind. Dead is the sparrow of my girl, sparrow, sweetling of my girl. Which more than her eyes she loved; for sweet as honey was it and its mistress knew, as well as damsel knoweth her own mother nor from her bosom did it rove, but hopping round first one side then the other, to its mistress alone it evermore did chirp. Now does it fare along that path of shadows whence naught may e\u2019er return. Ill be to ye, savage glooms of Orcus, which swallow up all things of fairness: which have snatched away from me the comely sparrow. O deed of bale! O sparrow sad of plight! Now on thy account my girl\u2019s sweet eyes, swollen, do redden with tear-drops.</p>','<p class="cantohead">IIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>That pinnace which ye see, my friends, says that it was the speediest of boats, nor any craft the surface skimming but it could gain the lead, whether the course were gone o\u2019er with plashing oars or bended sail. And this the menacing Adriatic shores may not deny, nor may the Island Cyclades, nor noble Rhodes and bristling Thrace, Propontis nor the gusty Pontic gulf, where itself (afterwards a pinnace to become) erstwhile was a foliaged clump; and oft on Cytorus\u2019 ridge hath this foliage announced itself in vocal rustling. And to thee, Pontic Amastris, and to box-screened Cytorus, the pinnace vows that this was alway and yet is of common knowledge most notorious; states that from its primal being it stood upon thy topmost peak, dipped its oars in thy waters, and bore its master thence through surly seas of number frequent, whether the wind whistled \u2019gainst the starboard quarter or the lee or whether Jove propitious fell on both the sheets at once; nor any vows [from stress of storm] to shore-gods were ever made by it when coming from the uttermost seas unto this glassy lake. But these things were of time gone by: now laid away, it rusts in peace and dedicates its age to thee, twin Castor, and to Castor\u2019s twin.</p>','<p class="cantohead">V.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Let us live, my Lesbia, and let us love, and count all the mumblings of sour age at a penny\u2019s fee. Suns set can rise again: we when once our brief light has set must sleep through a perpetual night. Give me of kisses a thousand, and then a hundred, then another thousand, then a second hundred, then another thousand without resting, then a hundred. Then, when we have made many thousands, we will confuse the count lest we know the numbering, so that no wretch may be able to envy us through knowledge of our kisses\u2019 number.</p>','<p class="cantohead">VI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>O Flavius, of thy sweetheart to Catullus thou would\u2019st speak, nor could\u2019st thou keep silent, were she not both ill-mannered and ungraceful. In truth thou affectest I know not what hot-blooded whore: this thou art ashamed to own. For that thou dost not lie alone a-nights thy couch, fragrant with garlands and Syrian unguent, in no way mute cries out, and eke the pillow and bolsters indented here and there, and the creakings and joggings of the quivering bed: unless thou canst silence these, nothing and again nothing avails thee to hide thy whoredoms. And why? Thou wouldst not display such drain\xE8d flanks unless occupied in some tomfoolery. Wherefore, whatsoever thou hast, be it good or ill, tell us! I wish to laud thee and thy loves to the sky in joyous verse.</p>','<p class="cantohead">VII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Thou askest, how many kisses of thine, Lesbia, may be enough and to spare for me. As the countless Libyan sands which strew the spicy strand of Cyrene \u2019twixt the oracle of swelt\u2019ring Jove and the sacred sepulchre of ancient Battus, or as the thronging stars which in the hush of darkness witness the furtive loves of mortals, to kiss thee with kisses of so great a number is enough and to spare for passion-driven Catullus: so many that prying eyes may not avail to number, nor ill tongues to ensorcel.</p>','<p class="cantohead">VIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Unhappy Catullus, cease thy trifling and what thou seest lost know to be lost. Once bright days used to shine on thee when thou wert wont to haste whither thy girl didst lead thee, loved by us as never girl will e\u2019er be loved. There those many joys were joyed which thou didst wish, nor was the girl unwilling. In truth bright days used once to shine on thee. Now she no longer wishes: thou too, powerless to avail, must be unwilling, nor pursue the retreating one, nor live unhappy, but with firm-set mind endure, steel thyself. Farewell, girl, now Catullus steels himself, seeks thee not, nor entreats thy acquiescence. But thou wilt pine, when thou hast no entreaty proffered. Faithless, go thy way! what manner of life remaineth to thee? who now will visit thee? who find thee beautiful? whom wilt thou love now? whose girl wilt thou be called? whom wilt thou kiss? whose lips wilt thou bite? But thou, Catullus, remain hardened as steel.</p>','<p class="cantohead">VIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Veranius, of all my friends standing in the front, owned I three hundred thousands of them, hast thou come home to thy Penates, thy longing brothers and thine aged mother? Thou hast come back. O joyful news to me! I may see thee safe and sound, and may hear thee speak of regions, deeds, and peoples Iberian, as is thy manner; and reclining o\u2019er thy neck shall kiss thy jocund mouth and eyes. O all ye blissfullest of men, who more gladsome or more blissful is than I am?</p>','<p class="cantohead">X.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Varus drew me off to see his mistress as I was strolling from the Forum: a little whore, as it seemed to me at the first glance, neither inelegant nor lacking good looks. When we came in, we fell to discussing various subjects, amongst which, how was Bithynia now, how things had gone there, and whether I had made any money there. I replied, what was true, that neither ourselves nor the pr&aelig;tors nor their suite had brought away anything whereby to flaunt a better-scented poll, especially as our pr&aelig;tor, the irrumating beast, cared not a single hair for his suite. \u201CBut surely,\u201D she said, \u201Cyou got some men to bear your litter, for they are said to grow there?\u201D I, to make myself appear to the girl as one of the fortunate, \u201CNay,\u201D I say, \u201Cit did not go that badly with me, ill as the province turned out, that I could not procure eight strapping knaves to bear me.\u201D (But not a single one was mine either here or there who the fractured foot of my old bedstead could hoist on his neck.) And she, like a pathic girl, \u201CI pray thee,\u201D says she, \u201Clend me, my Catullus, those bearers for a short time, for I wish to be borne to the shrine of Serapis.\u201D \u201CStay,\u201D quoth I to the girl, \u201Cwhen I said I had this, my tongue slipped; my friend, Cinna Gaius, he provided himself with these. In truth, whether his or mine&mdash;what do I trouble? I use them as though I had paid for them. But thou, in ill manner with foolish teasing dost not allow me to be heedless.\u201D</p','<p class="cantohead">XI.</p>\n\t\t<p class="cantosubhead">A Parting Insult to Lesbia.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Furius and Aurelius, comrades of Catullus, whether he penetrate to furthest Ind where the strand is lashed by the far-echoing Eoan surge, or whether \u2019midst the Hyrcans or soft Arabs, or whether the Sacians or quiver-bearing Parthians, or where the seven-mouthed Nile encolours the sea, or whether he traverse the lofty Alps, gazing at the monuments of mighty Caesar, the gallic Rhine, the dismal and remotest Britons, all these, whatever the Heavens\u2019 Will may bear, prepared at once to attempt,&mdash;bear ye to my girl this brief message of no fair speech. May she live and flourish with her swivers, of whom may she hold at once embraced the full three hundred, loving not one in real truth, but bursting again and again the flanks of all: nor may she look upon my love as before, she whose own guile slew it, e\u2019en as a flower on the greensward\u2019s verge, after the touch of the passing plough.</p>','<p class="cantohead">XII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Marrucinius Asinius, thou dost use thy left hand in no fair fashion \u2019midst the jests and wine: thou dost filch away the napkins of the heedless. Dost thou think this a joke? it flies thee, stupid fool, how coarse a thing and unbecoming \u2019tis! Dost not credit me? credit thy brother Pollio who would willingly give a talent to divert thee from thy thefts: for he is a lad skilled in pleasantries and facetiousness. Wherefore, either expect hendecasyllables three hundred, or return me my napkin which I esteem, not for its value but as a pledge of remembrance from my comrade. For Fabullus and Veranius sent me as a gift handkerchiefs from Iberian Saetabis; these must I prize e\u2019en as I do Veraniolus and Fabullus.</p>','<p class="cantohead">XIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Thou shalt feast well with me, my Fabullus, in a few days, if the gods favour thee, provided thou dost bear hither with thee a good and great feast, not forgetting a fair damsel and wine and wit and all kinds of laughter. Provided, I say, thou dost bear hither these, our charming one, thou wilt feast well: for thy Catullus\u2019 purse is brimful of cobwebs. But in return thou may\u2019st receive a perfect love, or whatever is sweeter or more elegant: for I will give thee an unguent which the Loves and Cupids gave unto my girl, which when thou dost smell it, thou wilt entreat the gods to make thee, O Fabullus, one total Nose!</p>','<p class="cantohead">XIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Did I not love thee more than mine eyes, O most jocund Calvus, for thy gift I should abhor thee with Vatinian abhorrence. For what have I done or what have I said that thou shouldst torment me so vilely with these poets? May the gods give that client of thine ills enow, who sent thee so much trash! Yet if, as I suspect, this new and care-picked gift, Sulla, the litterateur, gives thee, it is not ill to me, but well and beatific, that thy labours [in his cause] are not made light of. Great gods, what a horrible and accurst book which, forsooth, thou hast sent to thy Catullus that he might die of boredom the livelong day in the Saturnalia, choicest of days! No, no, my joker, this shall not leave thee so: for at daydawn I will haste to the booksellers\u2019 cases; the Caesii, the Aquini, Suffenus, every poisonous rubbish will I collect that I may repay thee with these tortures. Meantime (farewell ye) hence depart ye from here, whither an ill foot brought ye, pests of the period, puniest of poetasters.</p>\n\t\t\t<p>If by chance ye ever be readers of my triflings and ye will not quake to lay your hands upon us,</p>\n\t\t\t<p>&nbsp; &nbsp; &nbsp; * &nbsp; &nbsp; &nbsp; * &nbsp; &nbsp; &nbsp; * &nbsp; &nbsp; &nbsp; *</p>','<p class="cantohead">XV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>I commend me to thee with my charmer, Aurelius. I come for modest boon that,&mdash;didst thine heart long for aught, which thou desiredst chaste and untouched,&mdash;thou \u2019lt preserve for me the chastity of my boy. I do not say from the public: I fear those naught who hurry along the thoroughfares hither thither occupied on their own business: truth my fear is from thee and thy penis, pestilent eke to fair and to foul. Set it in motion where thou dost please, whenever thou biddest, as much as thou wishest, wherever thou findest the opportunity out of doors: this one object I except, to my thought a reasonable boon. But if thy evil mind and senseless rutting push thee forward, scoundrel, to so great a crime as to assail our head with thy snares, O wretch, calamitous mishap shall happen thee, when with feet taut bound, through the open entrance radishes and mullets shall pierce.</p>','<p class="cantohead">XVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>I will paedicate and irrumate you, Aurelius the bardache and Furius the cinaede, who judge me from my verses rich in love-liesse, to be their equal in modesty. For it behoves your devout poet to be chaste himself; his verses&mdash;not of necessity. Which verses, in a word, may have a spice and volupty, may have passion\u2019s cling and such like decency, so that they can incite with ticklings, I do not say boys, but bearded ones whose stiffened limbs amort lack pliancy in movement. You, because of many thousand kisses you have read, think me womanish. I will paedicate and irrumate you!</p>','<p class="cantohead">XVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O Colonia, that longest to disport thyself on a long bridge and art prepared for the dance, but that fearest the trembling legs of the bridgelet builded on re-used shavings, lest supine it may lie stretched in the hollow swamp; may a good bridge take its place designed to thy fancy, on which e\u2019en the Salian dances may be sustained: for the which grant to me, Colonia, greatest of gifts glee-exciting. Such an one, townsman of mine, I want from thy bridge to be pitched in the sludge head over heels, right where the lake of all its stinking slime is dankest and most superfluent&mdash;a deep-sunk abyss. The man is a gaping gaby! lacking the sense of a two-years-old baby dozing on its father\u2019s cradling arm. Although to him is wedded a girl flushed with springtide\u2019s bloom (and a girl more dainty than a tender kid, meet to be watched with keener diligence than the lush-black grape-bunch), he leaves her to sport at her list, cares not a single hair, nor bestirs himself with marital office, but lies as an alder felled by Ligurian hatchet in a ditch, as sentient of everything as though no woman were at his side. Such is my booby! he sees not, he hears naught. Who himself is, or whether he be or be not, he also knows not. Now I wish to chuck him head first from thy bridge, so as to suddenly rouse (if possible) this droning dullard and to leave behind in the sticky slush his sluggish spirit, as a mule casts its iron shoe in the tenacious slough.</p>','<p class="cantohead">XVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>This grove I dedicate and consecrate to thee, Priapus, who hast thy home at Lampsacus, and eke thy woodlands, Priapus; for thee especially in its cities worships the coast of the Hellespont, richer in oysters than all other shores.</p>','<p class="cantohead">XVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>This place, youths, and the marshland cot thatched with rushes, osier-twigs and bundles of sedge, I, carved from a dry oak by a rustic axe, now protect, so that they thrive more and more every year. For its owners, the father of the poor hut and his son,&mdash;both husbandmen,&mdash;revere me and salute me as a god; the one labouring with assiduous diligence that the harsh weeds and brambles may be kept away from my sanctuary, the other often bringing me small offerings with open hand. On me is placed a many-tinted wreath of early spring flowers and the soft green blade and ear of the tender corn. Saffron-coloured violets, the orange-hued poppy, wan gourds, sweet-scented apples, and the purpling grape trained in the shade of the vine, [are offered] to me. Sometimes, (but keep silent as to this) even the bearded he-goat, and the horny-footed nanny sprinkle my altar with blood; for which honours Priapus is bound in return to do everything [which lies in his duty], and to keep strict guard over the little garden and vineyard of his master. Wherefore, abstain, O lads, from your evil pilfering here. Our next neighbour is rich and his Priapus is negligent. Take from him; this path then will lead you to his grounds.</p>','<p class="cantohead">XX.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>I, O traveller, shaped with rustic art from a dry poplar, guard this little field which thou seest on the left, and the cottage and small garden of its indigent owner, and keep off the greedy hands of the robber. In spring a many-tinted wreath is placed upon me; in summer\u2019s heat ruddy grain; [in autumn] a luscious grape cluster with vine-shoots, and in the bitter cold the pale-green olive. The tender she-goat bears from my pasture to the town milk-distended udders; the well-fattened lamb from my sheepfolds sends back [its owner] with a heavy handful of money; and the tender calf, \u2019midst its mother\u2019s lowings, sheds its blood before the temple of the Gods. Hence, wayfarer, thou shalt be in awe of this God, and it will be profitable to thee to keep thy hands off. For a punishment is prepared&mdash;a roughly-shaped mentule. \u201CTruly, I am willing,\u201D thou sayest; then, truly, behold the farmer comes, and that same mentule plucked from my groin will become an apt cudgel in his strong right hand.</p>','<p class="cantohead">XXI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Aurelius, father of the famished, in ages past in time now present and in future years yet to come, thou art longing to paedicate my love. Nor is\u2019t done secretly: for thou art with him jesting, closely sticking at his side, trying every means. In vain: for, instructed in thy artifice, I\u2019ll strike home beforehand by irrumating thee. Now if thou didst this to work off the results of full-living I would say naught: but what irks me is that my boy must learn to starve and thirst with thee. Wherefore, desist, whilst thou mayst with modesty, lest thou reach the end,&mdash;but by being irrumated.</p>','<p class="cantohead">XXII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>That Suffenus, Varus, whom thou know\u2019st right well, is a man fair spoken, witty and urbane, and one who makes of verses lengthy store. I think he has writ at full length ten thousand or more, nor are they set down, as of custom, on palimpsest: regal paper, new boards, unused bosses, red ribands, lead-ruled parchment, and all most evenly pumiced. But when thou readest these, that refined and urbane Suffenus is seen on the contrary to be a mere goatherd or ditcher-lout, so great and shocking is the change. What can we think of this? he who just now was seen a professed droll, or e\u2019en shrewder than such in gay speech, this same becomes more boorish than a country boor immediately he touches poesy, nor is the dolt e\u2019er as self-content as when he writes in verse,&mdash;so greatly is he pleased with himself, so much does he himself admire. Natheless, we all thus go astray, nor is there any man in whom thou canst not see a Suffenus in some one point. Each of us has his assigned delusion: but we see not what\u2019s in the wallet on our back.</p>','<p class="cantohead">XXIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O Furius, who neither slaves, nor coffer, nor bug, nor spider, nor fire hast, but hast both father and step-dame whose teeth can munch up even flints,&mdash;thou livest finely with thy sire, and with thy sire\u2019s wood-carved spouse. Nor need\u2019s amaze! for in good health are ye all, grandly ye digest, naught fear ye, nor arson nor house-fall, thefts impious nor poison\u2019s furtive cunning, nor aught of perilous happenings whatsoe\u2019er. And ye have bodies drier than horn (or than aught more arid still, if aught there be), parched by sun, frost, and famine. Wherefore shouldst thou not be happy with such weal. Sweat is a stranger to thee, absent also are saliva, phlegm, and evil nose-snivel. Add to this cleanliness the thing that\u2019s still more cleanly, that thy backside is purer than a salt-cellar, nor cackst thou ten times in the total year, and then \u2019tis harder than beans and pebbles; nay, \u2019tis such that if thou dost rub and crumble it in thy hands, not a finger canst thou ever dirty. These goodly gifts and favours, O Furius, spurn not nor think lightly of; and cease thy \u2019customed begging for an hundred sesterces: for thou\u2019rt blest enough!</p>','<p class="cantohead">XXIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O thou who art the floweret of Juventian race, not only of these now living, but of those that were of yore and eke of those that will be in the coming years, rather would I that thou hadst given the wealth e\u2019en of Midas to that fellow who owns neither slave nor store, than that thou shouldst suffer thyself to be loved by such an one. \u201CWhat! isn\u2019t he a fine-looking man?\u201D thou askest. He is; but this fine-looking man has neither slaves nor store. Contemn and slight this as it please thee: nevertheless, he has neither slave nor store.</p>','<p class="cantohead">XXV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O Thallus the catamite, softer than rabbit\u2019s fur, or goose\u2019s marrow, or lowmost ear-lobe, limper than the drooping penis of an oldster, in its cobwebbed must, greedier than the driving storm, such time as the Kite-Goddess shews us the gaping Gulls, give me back my mantle which thou hast pilfered, and the Saetaban napkin and Thynian tablets which, idiot, thou dost openly parade as though they were heirlooms. These now unglue from thy nails and return, lest the stinging scourge shall shamefully score thy downy flanks and delicate hands, and thou unwonted heave and toss like a tiny boat surprised on the vasty sea by a raging storm.</p>','<p class="cantohead">XXVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Furius, our villa not \u2019gainst the southern breeze is pitted nor the western wind nor cruel Boreas nor sunny east, but sesterces fifteen thousand two hundred oppose it. O horrible and baleful draught.</p>','<p class="cantohead">XXVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Boy cupbearer of old Falernian, pour me fiercer cups as bids the laws of Postumia, mistress of the feast, drunker than a drunken grape. But ye, hence, as far as ye please, crystal waters, bane of wine, hie ye to the sober: here the Thyonian juice is pure.</p>','<p class="cantohead">XXVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Piso\u2019s Company, a starveling band, with lightweight knapsacks, scantly packed, most dear Veranius thou, and my Fabullus eke, how fortunes it with you? have ye borne frost and famine enow with that sot? Which in your tablets appear&mdash;the profits or expenses? So with me, who when I followed a praetor, inscribed more gifts than gains. \u201CO Memmius, well and slowly didst thou irrumate me, supine, day by day, with the whole of that beam.\u201D But, from what I see, in like case ye have been; for ye have been crammed with no smaller a poker. Courting friends of high rank! But may the gods and goddesses heap ill upon ye, reproach to Romulus and Remus.</p>','<p class="cantohead">XXVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Who can witness this, who can brook it, save a whore-monger, a guzzler, and a gamester, that Mamurra should possess what long-haired Gaul and remotest Britain erstwhile had. Thou catamite Romulus, this thou\u2019lt see and bear? Then thou\u2019rt a whore-monger, a guzzler, and a gamester. And shall he now, superb and o\u2019er replete, saunter o\u2019er each one\u2019s bed, as though he were a snow-plumed dove or an Adonis? Thou catamite Romulus, this thou\u2019lt see and hear? Then thou\u2019rt a whore-monger, a guzzler, and a gamester. For such a name, O general unique, hast thou been to the furthest island of the west, that this thy futtered-out Mentula should squander hundreds of hundreds? What is\u2019t but ill-placed munificence? What trifles has he squandered, or what petty store washed away? First his patrimony was mangled; secondly the Pontic spoils; then thirdly the Iberian, which the golden Tagus-stream knoweth. Do not the Gauls fear this man, do not the Britons quake? Why dost thou foster this scoundrel? What use is he save to devour well-fattened inheritances? Wast for such a name, O most puissant father-in-law and son-in-law, that ye have spoiled the entire world.</p>','<p class="cantohead">XXX.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Alfenus, unmemoried and unfaithful to thy comrades true, is there now no pity in thee, O hard of heart, for thine sweet loving friend? Dost thou betray me now, and scruplest not to play me false now, dishonourable one? Yet the irreverent deeds of traitorous men please not the dwellers in heaven: this thou takest no heed of, leaving me wretched amongst my ills. Alas, what may men do, I pray you, in whom put trust? In truth thou didst bid me entrust my soul to thee, sans love returned, lulling me to love, as though all [love-returns] were safely mine. Yet now thou dost withdraw thyself, and all thy purposeless words and deeds thou sufferest to be wafted away into winds and nebulous clouds. If thou hast forgotten, yet the gods remember, and in time to come will make thee rue thy doing.</p>','<p class="cantohead">XXXI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Sirmio! Eyebabe of Islands and Peninsulas, which Neptune holds whether in limpid lakes or on mighty mains, how gladly and how gladsomely do I re-see thee, scarce crediting that I\u2019ve left behind Thynia and the Bithynian champaign, and that safe and sound I gaze on thee. O what\u2019s more blissful than cares released, when the mind casts down its burden, and when wearied with travel-toils we reach our hearth, and sink on the craved-for couch. This and only this repays our labours numerous. Hail, lovely Sirmio, and gladly greet thy lord; and joy ye, wavelets of the Lybian lake; laugh ye the laughters echoing from my home.</p>','<p class="cantohead">XXXII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>I\u2019ll love thee, my sweet Ipsithilla, my delight, my pleasure: an thou bid me come to thee at noontide. And an thou thus biddest, I adjure thee that none makes fast the outer door [against me], nor be thou minded to gad forth, but do thou stay at home and prepare for us nine continuous conjoinings. In truth if thou art minded, give instant summons: for breakfast o\u2019er, I lie supine and ripe, thrusting through both tunic and cloak.</p>','<p class="cantohead">XXXIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O, chiefest of pilferers, baths frequenting, Vibennius the father and his pathic son (for with the right hand is the sire more in guilt, and with his backside is the son the greedier), why go ye not to exile and ill hours, seeing that the father\u2019s plunderings are known to all folk, and that, son, thou can\u2019st not sell thine hairy buttocks for a doit?</p>','<p class="cantohead">XXXIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>We, maids and upright youths, are in Diana\u2019s care: upright youths and maids, we sing Diana.</p>\n\t\t\t<p>O Latonia, progeny great of greatest Jove, whom thy mother bare \u2019neath Delian olive,</p>\n\t\t\t<p>That thou mightst be Queen of lofty mounts, of foliaged groves, of remote glens, and of winding streams.</p>\n\t\t\t<p>Thou art called Juno Lucina by the mother in her travail-pangs, thou art named potent Trivia and Luna with an ill-got light.</p>\n\t\t\t<p>Thou, Goddess, with monthly march measuring the yearly course, dost glut with produce the rustic roofs of the farmer.</p>\n\t\t\t<p>Be thou hallowed by whatsoe\u2019er name thou dost prefer; and cherish, with thine good aid, as thou art wont, the ancient race of Romulus.</p>','<p class="cantohead">XXXV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>To that sweet poet, my comrade, Caecilius, I bid thee, paper, say: that he hie him here to Verona, quitting New Comum\u2019s city-walls and Larius\u2019 shore; for I wish him to give ear to certain counsels from a friend of his and mine. Wherefore, an he be wise, he\u2019ll devour the way, although a milk-white maid doth thousand times retard his going, and flinging both arms around his neck doth supplicate delay&mdash;a damsel who now, if truth be brought me, is undone with immoderate love of him. For, since what time she first read of the Dindymus Queen, flames devour the innermost marrow of the wretched one. I grant thee pardon, damsel, more learned than the Sapphic muse: for charmingly has the Mighty Mother been sung by Caecilius.</p>','<p class="cantohead">XXXVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Volusius\u2019 Annals, merdous paper, fulfil ye a vow for my girl: for she vowed to sacred Venus and to Cupid that if I were re-united to her and I desisted hurling savage iambics, she would give the most elect writings of the pettiest poet to the tardy-footed God to be burned with ill-omened wood. And <em>this</em> the saucy minx chose, jocosely and drolly to vow to the gods. Now, O Creation of the cerulean main, who art in sacred Idalium, and in Urian haven, and who doth foster Ancona and reedy Cnidos, Amathus and Golgos, and Dyrrhachium, Adriatic tavern, accept and acknowledge this vow if it lack not grace nor charm. But meantime, hence with ye to the flames, crammed with boorish speech and vapid, Annals of Volusius, merdous paper.</p>','<p class="cantohead">XXXVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Tavern of lust and you its tippling crowd, (at ninth pile sign-post from the Cap-donned Brothers) think ye that ye alone have mentules, that \u2019tis allowed to you alone to touzle whatever may be feminine, and to deem all other men mere goats? But, because ye sit, a row of fools numbering one hundred or haply two hundred, do ye think I dare not irrumate your entire two hundred&mdash;loungers!&mdash;at once! Think it! but I\u2019ll scrawl all over the front of your tavern with scorpion-words. For my girl, who has fled from my embrace (she whom I loved as ne\u2019er a maid shall be beloved&mdash;for whom I fought fierce fights) has seated herself here. All ye, both honest men and rich, and also, (O cursed shame) all ye paltry back-slum fornicators, are making hot love to her; and thou above all, one of the hairy-visaged sons of coney-caverned Celtiberia, Egnatius, whose quality is stamped by dense-grown beard, and teeth with Spanish urine scrubbed.</p>','<p class="cantohead">XXXVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>\u2019Tis ill, Cornificius, with thy Catullus, \u2019tis ill, by Hercules, and most untoward; and greater, greater ill, each day and hour! And thou, what solace givest thou, e\u2019en the tiniest, the lightest, by thy words? I\u2019m wroth with thee. Is my love but worth this? Yet one little message would cheer me, though more full of sadness than Simonidean tears.</p>','<p class="cantohead">XXXVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Egnatius, who has milk-white teeth, grins for ever and aye. An he be in court, when counsel excites tears, he grins. An he be at funeral pyre where one mourns a son devoted, where a bereft mother\u2019s tears stream for her only one, he grins. Whatever it may be, wherever he is, whate\u2019er may happen, he grins. Such ill habit has he&mdash;neither in good taste, well assumed, nor refined. Wherefore do thou take note from me, my good Egnatius. Be thou refined Sabine or Tiburtine, paunch-full Umbrian or obese Tuscan, Lanuvian dusky and large-tusked, or Transpadine (to touch upon mine own folk also), or whom thou wilt of those who cleanly wash their teeth, still I\u2019d wish thee not to grin for ever and aye; for than senseless giggling nothing is more senseless. Now thou\u2019rt a Celtiberian! and in the Celtiberian land each wight who has urined is wont each morn to scrub with it his teeth and pinky gums, so that the higher the polish on thy teeth, the greater fund it notes that thou hast drunk of urine.</p>','<p class="cantohead">XXXX.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>What mind ill set, O sorry Ravidus, doth thrust thee rashly on to my iambics? What god, none advocate of good for thee, doth stir thee to a senseless contest? That thou may\u2019st be in the people\u2019s mouth? What would\u2019st thou? Dost wish to be famed, no matter in what way? So thou shalt be, since thou hast aspired to our loved one\u2019s love, but by our long-drawn vengeance.</p>','<p class="cantohead">XXXXI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Ametina, out-drain\xE8d maiden, worries me for a whole ten thousand, that damsel with an outspread nose, <span class="french">ch\xE8re amie</span> of Formianus the wildling. Ye near of kin in whose care the maiden is, summon ye both friends and medicals: for the girl\u2019s not sane. Nor ask ye, in what way: she is subject to delusions.</p>','<p class="cantohead">XXXXII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Hither, all ye hendecasyllables, as many as may be, from every part, all of ye, as many soever as there be! A shameless prostitute deems me fair sport, and denies return to me of our writing tablets, if ye are able to endure this. Let\u2019s after her, and claim them back. \u201CWho may she be,\u201D ye ask? That one, whom ye see strutting awkwardly, stagily, and stiffly, and with a laugh on her mouth like a Gallic whelp. Throng round her, and claim them back. \u201CO putrid punk, hand back our writing tablets; hand back, O putrid punk, our writing tablets.\u201D Not a jot dost heed? O Muck, Brothel-Spawn, or e\u2019en loathsomer if it is possible so to be! Yet think not yet that this is enough. For if naught else we can extort a blush on thy brazened bitch\u2019s face. We\u2019ll yell again in heightened tones, \u201CO putrid punk, hand back our writing tablets, hand back, O putrid punk, our writing tablets.\u201D But naught we profit, naught she budges. Changed must your measure and your manner be, an you would further progress make&mdash;\u201CO Virgin pure and spotless, hand back our writing tablets.\u201D</p>','<p class="cantohead">XXXXIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Hail, O maiden with nose not of the tiniest, with foot lacking shape and eyes lacking darkness, with fingers scant of length, and mouth not dry and tongue scant enough of elegance, <em>ch\xE8re amie</em> of Formianus the wildling. And thee the province declares to be lovely? With thee our Lesbia is to be compared? O generation witless and unmannerly!</p>','<p class="cantohead">XXXXIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O, Homestead of ours, whether Sabine or Tiburtine (for that thou\u2019rt Tiburtine folk concur, in whose heart \u2019tis not to wound Catullus; but those in whose heart \u2019tis, will wager anything thou\u2019rt Sabine) but whether Sabine or more truly Tiburtine, o\u2019erjoyed was I to be within thy rural country-home, and to cast off an ill cough from my chest, which&mdash;not unearned&mdash;my belly granted me, for grasping after sumptuous feeds. For, in my wish to be Sestius\u2019 guest, his defence against the plaintiff Antius, crammed with venom and pestilent dulness, did I read through. Hence a chill heavy rheum and fitful cough shattered me continually until I fled to thine asylum, and brought me back to health with rest and nettle-broth. Wherefore, re-manned, I give thee utmost thanks, that thou hast not avenged my fault. Nor do I pray now for aught but that, should I re-take Sestius\u2019 nefarious script, its frigid vapidness may bring a cold and cough to Sestius\u2019 self; for he but invites me when I read dull stuff.</p>','<p class="cantohead">XXXXV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Septumius clasping Acme his adored to his bosom, \u201CAcme mine,\u201D quoth he, \u201Cif thee I love not to perdition, nor am prepared to love through all the future years moreover without cease, as greatly and distractedly as man may,&mdash;alone in Libya or in torrid India may I oppose a steel-eyed lion.\u201D As thus he said, Love, leftwards as before, with approbation rightwards sneezed. Then Acme slightly bending back her head, and the swimming eyes of her sweet boy with rose-red lips a-kissing, \u201CSo,\u201D quoth she, \u201Cmy life, Septumillus, this Lord unique let us serve for aye, as more forceful in me burns the fire greater and keener \u2019midst my soft marrow.\u201D As thus she said, Love, leftwards as before, with approbation rightwards sneezed. Now with good auspice urged along, with mutual minds they love and are beloved. The thrall o\u2019 love Septumius his only Acme far would choose, than Tyrian or Britannian realms: the faithful Acme with Septumius unique doth work her love delights and wantonings. Whoe\u2019er has seen folk blissfuller, whoe\u2019er a more propitious union?</p>','<p class="cantohead">XXXXVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Now springtide brings back its mild and tepid airs, now the heaven\u2019s fury equinoctial is calmed by Zephyr\u2019s benign breath. The Phrygian meadows are left behind, O Catullus, and the teeming fields of sun-scorched Nicaea: to the glorious Asian cities let us haste. Now my palpitating soul craves wander, now my feet grow vigorous with glad zeal. O charming circlet of comrades, fare ye well, who are together met from distant homes to which divers sundered ways lead back.</p>','<p class="cantohead">XXXXVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Porcius and Socration, twins in rascality of Piso, scurf and famisht of the earth, you before my Veraniolus and Fabullus has that prepuce-lacking Priapus placed? Shall you betimes each day in luxurious opulence banquet? And must my cronies quest for dinner invitations, [lounging] where the three cross-roads meet?</p>','<p class="cantohead">XXXXVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Thine honey-sweet eyes, O Juventius, had I the leave to kiss for aye, for aye I\u2019d kiss e\u2019en to three hundred thousand kisses, nor ever should I reach to future plenity, not even if thicker than dried wheat sheaves be the harvest of our kisses.</p>','<p class="cantohead">XXXXVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Most eloquent of Romulus\u2019 descendancy, who are, who have been, O Marcus Tullius, and who shall later be in after time, to thee doth give his greatest gratitude Catullus, pettiest of all the poets,&mdash;and so much pettiest of all the poets as thou art peerless \u2019mongst all pleaders.</p>','<p class="cantohead">L.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Yestreen, Licinius, in restful day, much mirthful verse we flashed upon my tablets, as became us, men of fancy. Each jotting versicles in turn sported first in this metre then in that, exchanging mutual epigrams \u2019midst jokes and wine. But I departed thence, afire, Licinius, with thy wit and drolleries, so that food was useless to my wretched self; nor could sleep close mine eyes in quiet, but all o\u2019er the bed in restless fury did I toss, longing to behold daylight that with thee I might speak, and again we might be together. But afterwards, when my limbs, weakened by my restless labours, lay stretched in semi-death upon the bed, this poem, O jocund one, I made for thee, from which thou mayst perceive my dolour. Now \u2019ware thee of presumptuousness, and our pleadings \u2019ware thee of rejecting, we pray thee, eye-babe of ours, lest Nemesis exact her dues from thee. She is a forceful Goddess; \u2019ware her wrath.</p>','<p class="cantohead">LI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>He to me to be peer to a god doth seem, he, if such were lawful, to o\u2019er-top the gods, who sitting oft a-front of thee doth gaze on thee, and doth listen to thine laughter lovely, which doth snatch away from sombre me mine every sense: for instant falls my glance on thee, Lesbia, naught is left to me [of voice], but my tongue is numbed, a keen-edged flame spreads through my limbs, with sound self-caused my twin ears sing, and mine eyes are enwrapped with night.</p>\n\t\t\t<p>Sloth, O Catullus, to thee is hurtful: in sloth beyond measure dost thou exult and pass thy life. Sloth hath erewhile ruined rulers and gladsome cities.</p>','<p class="cantohead">LII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Prithee Catullus, why delay thine death? Nonius the tumour is seated in the curule chair, Vatinius forswears himself for consul\u2019s rank: prithee Catullus, why delay thine death?</p>','<p class="cantohead">LIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>I laughed at I know not whom in the crowded court who, when with admirable art Vatinius\u2019 crimes my Calvus had set forth, with hands uplifted and admiring mien thus quoth \u201CGreat Gods, the fluent little Larydoodle!\u201D</p>','<p class="cantohead">LIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Otho\u2019s head is paltry past all phrase * * * the uncouth semi-soaped shanks of Nerius, the slender soundless fizzlings of Libo * * * if not all things I wish would displease thee and Fuficius, the white-headed and green-tailed.</p>\n\t\t\t<p>Anew thou shalt be enraged at my harmless iambics, emperor unique.</p>','<p class="cantohead">LV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>We beg, if maybe \u2019tis not untoward, thou\u2019lt shew us where may be thine haunt sequestered. Thee did we quest within the Lesser Fields, thee in the Circus, thee in every bookshop, thee in holy fane of highmost Jove. In promenade yclept \u201CThe Great,\u201D the crowd of cocottes straightway did I stop, O friend, accosting those whose looks I noted were unruffled. And for thee loudly did I clamour, \u201CRestore to me Camerius, most giddy girls.\u201D Quoth such-an-one, her bosom bare a-shewing, \u201CLook! \u2019twixt rose-red paps he shelters him.\u201D But labour \u2019tis of Hercules thee now to find. Not were I framed the Cretan guard, nor did I move with Pegasean wing, nor were I Ladas, or Persius with the flying foot, or Rhesus with swift and snowy team: to these add thou the feathery-footed and winged ones, ask likewise fleetness of the winds: which all united, O Camerius, couldst thou me grant, yet exhausted in mine every marrow and with many a faintness consumed should I be in my quest for thee, O friend. Why withdraw thyself in so much pride, O friend? Tell us where thou wilt be found, declare it boldly, give up the secret, trust it to the light. What, do the milk-white maidens hold thee? If thou dost hold thy tongue closed up in mouth, thou squanderest Love\u2019s every fruit: for Venus joys in many-worded babblings. Yet if thou wishest, thou mayst bar thy palate, if I may be a sharer in thy love.</p>','<p class="cantohead">LVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O thing ridiculous, Cato, and facetious, and worthy of thine ears and of thy laughter. Laugh, Cato, the more thou lovest Catullus: the thing is ridiculous, and beyond measure facetious. Just now I caught a boy a-thrusting in a girl: and on him (so please you, Dione) with rigid spear of mine I fell.</p>','<p class="cantohead">LVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>A comely couple of shameless catamites, Mamurra and Caesar, pathics both. Nor needs amaze: they share like stains&mdash;this, Urban, the other, Formian,&mdash;which stay deep-marked nor can they be got rid of. Both morbidly diseased through pathic vice, the pair of twins lie in one bed, alike in erudition, one not more than other the greater greedier adulterer, allied rivals of the girls. A comely couple of shameless catamites.</p>','<p class="cantohead">LVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O Caelius, our Lesbia, that Lesbia, the self-same Lesbia whom Catullus more than himself and all his own did worship, now at cross-roads and in alleys husks off the mettlesome descendants of Remus.</p>','<p class="cantohead">LVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Rufa of Bononia lends her lips to Rufulus, she the wife of Menenius, whom oft among the sepulchres ye have seen clutching her meal from the funeral pile, when pursuing the bread which has rolled from the fire, whilst she was being buffeted by a semi-shorn corpse-burner.</p>','<p class="cantohead">LX.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Did a lioness of the Libyan Hills, or Scylla yelping from her lowmost groin, thee procreate, with mind so hard and horrid, that thou hast contempt upon a suppliant\u2019s voice in calamity\u2019s newest stress? O heart o\u2019ergreatly cruel.</p>','<p class="cantohead">LXI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O Fosterer of the Helicon Hill, sprung from Urania, who beareth the gentle virgin to her mate, O Hymenaeus Hymen, O Hymen Hymenaeus!</p>\n\t\t\t<p>Twine round thy temples sweet-smelling flowerets of marjoram; put on thy gold-tinted veil; light-hearted, hither, hither haste, bearing on snowy foot the golden-yellow sandal:</p>\n\t\t\t<p>And a-fire with the joyous day, chanting wedding melodies with ringing voice, strike the ground with thy feet, with thine hand swing aloft the pine-link.</p>\n\t\t\t<p>For Vinia&mdash;fair as Idalian Venus, when stood before the Phrygian judge&mdash;a virgin fair, weds Manlius \u2019midst happy auspices.</p>\n\t\t\t<p>She, bright-shining as the Asian myrtle florid in branchlets, which the Hamadryads nurture for their pleasure with besprinkled dew.</p>\n\t\t\t<p>Wherefore, hither! leaving the Aonian grot in the Thespian Rock, o\u2019er which flows the chilling stream of Aganippe.</p>\n\t\t\t<p>And summon homewards the mistress, eager for her new yoke, firm-prisoning her soul in love; as tight-clasping ivy, wandering hither, thither, enwraps the tree around.</p>\n\t\t\t<p>And also ye, upright virgins, for whom a like day is nearing, chant ye in cadence, singing \u201CO Hymenaeus Hymen, O Hymen Hymenaeus!\u201D</p>\n\t\t\t<p>That more freely, hearing himself to his duty called, will he bear hither his presence, Lord of true Venus, uniter of true lovers.</p>\n\t\t\t<p>What god is worthier of solicitation by anxious amourists? Whom of the celestials do men worship more greatly? O Hymenaeus Hymen, O Hymen Hymenaeus!</p>\n\t\t\t<p>Thee for his young the trembling father beseeches, for thee virgins unclasp the zone from their breasts, for thee the fear-full bridegroom harkeneth with eager ear.</p>\n\t\t\t<p>Thou bearest to the youngster\u2019s arms that flower-like damsel, taken from her mother\u2019s bosom, O Hymenaeus Hymen, O Hymen Hymenaeus!</p>\n\t\t\t<p>Nor lacking thee may Venus take her will with fair Fame\u2019s approbation; but she may, with thy sanction. With such a God who dares compare?</p>\n\t\t\t<p>Lacking thee, no house can yield heirs, nor parent be surrounded by offspring; but they may, with thy sanction. With such a God who dares compare?</p>\n\t\t\t<p>Nor lacking thy rites may our land be protected e\u2019en to its boundaries; but it may, with thy sanction. With such a God who dares compare?</p>\n\t\t\t<p>Gates open wide: the virgin is here. See how the torch-flakes shake their gleaming locks? Let shame retard the modest:</p>\n\t\t\t<p class="divider">* * * * *</p>\n\t\t\t<p>Yet hearing, greater does she weep, that she must onwards go.</p>\n\t\t\t<p>Cease thy tears. For thee there is no peril, Aurunculeia, that any woman more beauteous from Ocean springing shall ever see the light of day.</p>\n\t\t\t<p>Thou art like the hyacinthine flower, wont to stand aloft \u2019midst varied riches of its lordling\u2019s garden. But thou delayest, day slips by: advance, new mated one.</p>\n\t\t\t<p>Advance, new mated, now in sight, and listen to our speech. Note how the torch-flakes shake their glittering tresses: advance, new mated one.</p>\n\t\t\t<p>Nor given to ill adulteries, nor seeking lawless shames, shall thy husband ever wish to lie away from thy soft breasts,</p>\n\t\t\t<p>But as the lithe vine amongst neighbouring trees doth cling, so shall he be enclasped in thine encircled arms. But day slips by: advance, new mated one.</p>\n\t\t\t<p>O nuptial couch * * * * with feet of ivory white.</p>\n\t\t\t<p>What joys are coming to thy lord, in gloom o\u2019 night, in noon of day. Let him rejoice! but day slips by: advance, new mated one.</p>\n\t\t\t<p>High raise, O boys, the torches: I see the gleaming veil approach. Come, chant in cadence, \u201CO Hymen Hymenaeus io, O Hymen Hymenaeus.\u201D</p>\n\t\t\t<p>Nor longer silent is lewd Fescinnine jest, nor to the boys the nuts deny, ingle, hearing thy master\u2019s love has flown.</p>\n\t\t\t<p>Give nuts to the boys, O listless ingle; enough of days thou hast played with nuts: now \u2019tis meet to serve Talassius. O ingle, give the nuts!</p>\n\t\t\t<p>The country lasses slighted were by thee, O ingle, till to-day: now the bride\u2019s tiresman shaves thy face. Wretched, wretched ingle, give the nuts.</p>\n\t\t\t<p>They say that from thy hairless ingles, O sweet-scented bridegroom, thou canst scarce abstain: but abstain thou! O Hymen Hymenaeus io, O Hymen Hymenaeus.</p>\n\t\t\t<p>We know that these delights were known to thee only when lawful: but to the wedded these same no more are lawful. O Hymen Hymenaeus io, O Hymen Hymenaeus!</p>\n\t\t\t<p>Thou also, bride, what thy husband seekest beware of denying, lest he go elsewhere in its search. O Hymen Hymenaeus io, O Hymen Hymenaeus!</p>\n\t\t\t<p>Look, thy husband\u2019s home is thine, potent and goodly, and shall be thine for ever more. O Hymen Hymenaeus io, O Hymen Hymenaeus!</p>\n\t\t\t<p>Until with trembling movement thine hoary brow nods ever to everything. O Hymen Hymenaeus io, O Hymen Hymenaeus!</p>\n\t\t\t<p>Lift o\u2019er the threshold with good omen thy glistening feet, and go through the polished gates. O Hymen Hymenaeus io, O Hymen Hymenaeus!</p>\n\t\t\t<p>Look! thy lord within, lying on Tyrian couch, all-expectant waits for thee. O Hymen Hymenaeus io, O Hymen Hymenaeus!</p>\n\t\t\t<p>Not less than in thine, in his breast burns an inmost flame, but more deeply inward. O Hymen Hymenaeus io, O Hymen Hymenaeus!</p>\n\t\t\t<p>Unloose the damsel\u2019s slender arm, O purple-bordered youth: now let her approach her husband\u2019s couch. O Hymen Hymenaeus io, O Hymen Hymenaeus.</p>\n\t\t\t<p>Ye good dames of fair renown to aged spouses, put ye the damsel a-bed. O Hymen Hymenaeus io, O Hymen Hymenaeus.</p>\n\t\t\t<p>Now thou mayst come, O bridegroom: thy wife is in the bridal-bed, with face brightly blushing as white parthenice \u2019midst ruddy poppies.</p>\n\t\t\t<p>But, O bridegroom (so help me the heaven-dwellers) in no way less beautiful art thou, nor doth Venus slight thee. But the day slips by: on! nor more delay.</p>\n\t\t\t<p>Nor long hast thou delayed, thou comest now. May kindly Venus help thee, since what thou dost desire thou takest publicly, and dost not conceal true love.</p>\n\t\t\t<p>Of Afric\u2019s sands and glittering stars the number first let him tell, who wishes to keep count of your many-thousand sports.</p>\n\t\t\t<p>Sport as ye like, and speedily give heirs. It does not become so old a name to be sans heirs, but for similar stock always to be generated.</p>\n\t\t\t<p>A little Torquatus I wish, from his mother\u2019s bosom reaching out his dainty hands, and smiling sweetly at his father with lips apart.</p>\n\t\t\t<p>May he be like his sire Manlius, and easily acknowledged by every stranger, and by his face point out his mother\u2019s faithfulness.</p>\n\t\t\t<p>May such praise confirm his birth from true mother, such fame unique as rests with Telemachus from best of mothers, Penelope.</p>\n\t\t\t<p>Close ye the doors, virgins: enough we\u2019ve sported. But, fair bride and groom, live ye well, and diligently fulfil the office of vigorous youth.</p>','<p class="cantohead">LXII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p class="inthead"><em>Youths.</em></p>\n\t\t\t<p>Vesper is here, arise ye youths: Vesper at last has just borne aloft in the heavens his long-looked-for light. Now \u2019tis time to arise, now to leave the fattened tables, now comes the virgin, now is said the Hymenaeus. Hymen O Hymenaeus, Hymen hither O Hymenaeus!</p>\n\t\t\t<p class="inthead"><em>Maidens</em>.</p>\n\t\t\t<p>Discern ye, O unwedded girls, the youths? Arise in response: forsooth the Star of Eve displays its Oetaean fires. Thus \u2019tis; see how fleetly have they leapt forth? Nor without intent have they leapt forth, they will sing what \u2019tis meet we surpass. Hymen O Hymenaeus, Hymen hither O Hymenaeus!</p>\n\t\t\t<p class="inthead"><em>Youths</em>.</p>\n\t\t\t<p>Nor easily is for us, O comrades, the palm prepared; see ye how they talk together in deep thought. Nor in vain do they muse, they have what may be worthy of memory. Nor be wonder: for inwardly toil they with whole of their minds. Our minds one way, our ears another, we have divided: wherefore by right are we conquered, for victory loveth solicitude. So now your minds at the least turn ye hither, now their chant they begin, anon ye will have to respond. Hymen O Hymenaeus, Hymen hither O Hymenaeus!</p>\n\t\t\t<p class="inthead"><em>Maidens</em>.</p>\n\t\t\t<p>Hesperus! what crueler light is borne aloft in the heavens? Thou who canst pluck the maid from her mother\u2019s enfolding, pluck from her mother\u2019s enfolding the firm-clinging maid, and canst give the chaste girl to the burning youngster. What more cruel could victors in vanquished city contrive? Hymen O Hymenaeus, Hymen hither O Hymenaeus!</p>\n\t\t\t<p class="inthead"><em>Youths</em>.</p>\n\t\t\t<p>Hesperus! what more jocund light is borne aloft in the heavens? Thou who dost confirm with thy flame the marriage betrothals which the men had pledged, the parents had pledged of aforetime, nor may they be joined in completion before thy flame is borne aloft. What can the gods give more gladsome than that happy hour? Hymen O Hymenaeus, Hymen hither O Hymenaeus!</p>\n\t\t\t<p class="inthead"><em>Maidens</em>.</p>\n\t\t\t<p>* * * * Hesperus from us, O comrades, has stolen one away * * * * <em>Hymen O Hymenaeus, Hymen hither O Hymenaeus!</em></p>\n\t\t\t<p class="inthead"><em>Youths</em>.</p>\n\t\t\t<p>* * * * For at thy advent a guard always keeps watch. Thieves lie in wait by night, whom often on thy return, O Hesperus, thou hap\u2019st upon, when with thy changed name Eous. Yet it doth please the unwedded girls to carp at thee with plaints fictitious. But what if they carp at that which in close-shut mind they long for? Hymen O Hymenaeus, Hymen hither O Hymenaeus!</p>\n\t\t\t<p class="inthead"><em>Maidens</em>.</p>\n\t\t\t<p>As grows the hidden flower in garden closed, to kine unknown, uprooted by no ploughshare, whilst the winds caress it, the sun makes it sturdy, and the shower gives it growth * * * * many a boy and many a girl longs for it: this same when pluckt, deflowered from slender stalklet, never a boy and never a girl doth long for it: so the virgin, while she stays untouched, so long is she dear to her folk; when she hath lost her chaste flower from her body profaned, nor to the boys stays she beauteous, nor is she dear to the girls. Hymen O Hymenaeus, Hymen hither O Hymenaeus!</p>\n\t\t\t<p class="inthead"><em>Youths</em>.</p>\n\t\t\t<p>As the widowed vine which grows in naked field ne\u2019er uplifts itself, ne\u2019er ripens a mellow grape, but bending prone \u2019neath the weight of its tender body now and again its highmost bough touches with its root; this no husbandmen, no herdsmen will foster: but if this same chance to be joined with marital elm, it many husbandmen, many herdsmen will foster: so the virgin, whilst she stays untouched, so long does she age, unfostered; but when fitting union she obtain in meet time, dearer is she to her lord and less of a trouble to parent. <em>Hymen O Hymenaeus, Hymen hither O Hymenaeus!</em></p>\n\t\t\t<p class="inthead"><em>Youths and Maidens</em>.</p>\n\t\t\t<p>But struggle not \u2019gainst such a mate, O virgin. \u2019Tis improper to struggle, thou whose father hath handed thee o\u2019er, that father together with thy mother to whom obedience is needed. Thy maidenhead is not wholly thine, in part \u2019tis thy parents\u2019: a third part is thy father\u2019s, a third part is given to thy mother, a third alone is thine: be unwilling to struggle against two, who to their son-in-law their rights together with dowry have given. Hymen O Hymenaeus, Hymen hither O Hymenaeus!</p>','<p class="cantohead">LXIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Over the vast main borne by swift-sailing ship, Attis, as with hasty hurried foot he reached the Phrygian wood and gained the tree-girt gloomy sanctuary of the Goddess, there roused by rabid rage and mind astray, with sharp-edged flint downwards wards dashed his burden of virility. Then as he felt his limbs were left without their manhood, and the fresh-spilt blood staining the soil, with bloodless hand she hastily hent a tambour light to hold, taborine thine, O Cybebe, thine initiate rite, and with feeble fingers beating the hollowed bullock\u2019s back, she rose up quivering thus to chant to her companions.</p>\n\t\t\t<p>\u201CHaste ye together, she-priests, to Cybebe\u2019s dense woods, together haste, ye vagrant herd of the dame Dindymene, ye who inclining towards strange places as exiles, following in my footsteps, led by me, comrades, ye who have faced the ravening sea and truculent main, and have castrated your bodies in your utmost hate of Venus, make glad our mistress speedily with your minds\u2019 mad wanderings. Let dull delay depart from your thoughts, together haste ye, follow to the Phrygian home of Cybebe, to the Phrygian woods of the Goddess, where sounds the cymbal\u2019s voice, where the tambour resounds, where the Phrygian flautist pipes deep notes on the curved reed, where the ivy-clad Maenades furiously toss their heads, where they enact their sacred orgies with shrill-sounding ululations, where that wandering band of the Goddess is wont to flit about: thither \u2019tis meet to hasten with hurried mystic dance.\u201D</p>\n\t\t\t<p>When Attis, spurious woman, had thus chanted to her comity, the chorus straightway shrills with trembling tongues, the light tambour booms, the concave cymbals clang, and the troop swiftly hastes with rapid feet to verdurous Ida. Then raging wildly, breathless, wandering, with brain distraught, hurrieth Attis with her tambour, their leader through dense woods, like an untamed heifer shunning the burden of the yoke: and the swift Gallae press behind their speedy-footed leader. So when the home of Cybebe they reach, wearied out with excess of toil and lack of food they fall in slumber. Sluggish sleep shrouds their eyes drooping with faintness, and raging fury leaves their minds to quiet ease.</p>\n\t\t\t<p>But when the sun with radiant eyes from face of gold glanced o\u2019er the white heavens, the firm soil, and the savage sea, and drave away the glooms of night with his brisk and clamorous team, then sleep fast-flying quickly sped away from wakening Attis, and goddess Pasithea received Somnus in her panting bosom. Then when from quiet rest torn, her delirium over, Attis at once recalled to mind her deed, and with lucid thought saw what she had lost, and where she stood, with heaving heart she backwards traced her steps to the landing-place. There, gazing o\u2019er the vast main with tear-filled eyes, with saddened voice in tristful soliloquy thus did she lament her land:</p>\n\t\t\t<p>\u201CMother-land, O my creatress, mother-land, O my begetter, which full sadly I\u2019m forsaking, as runaway serfs are wont from their lords, to the woods of Ida I have hasted on foot, to stay \u2019mongst snow and icy dens of ferals, and to wander through the hidden lurking-places of ferocious beasts. Where, or in what part, O mother-land, may I imagine that thou art? My very eyeball craves to fix its glance towards thee, whilst for a brief space my mind is freed from wild ravings. And must I wander o\u2019er these woods far from mine home? From country, goods, friends, and parents, must I be parted? Leave the forum, the palaestra, the race-course, and gymnasium? Wretched, wretched soul, \u2019tis thine to grieve for ever and for aye. For whatso shape is there, whose kind I have not worn? I (now a woman), I a man, a stripling, and a lad; I was the gymnasium\u2019s flower, I was the pride of the oiled wrestlers: my gates, my friendly threshold, were crowded, my home was decked with floral coronals, when I was wont to leave my couch at sunrise. Now shall I live a ministrant of gods and slave to Cybebe? I a Maenad, I a part of me, I a sterile trunk! Must I range o\u2019er the snow-clad spots of verdurous Ida, and wear out my life \u2019neath lofty Phrygian peaks, where stay the sylvan-seeking stag and woodland-wandering boar? Now, now, I grieve the deed I\u2019ve done; now, now, do I repent!\u201D</p>\n\t\t\t<p>As the swift sound left those rosy lips, borne by new messenger to gods\u2019 twinned ears, Cybebe, unloosing her lions from their joined yoke, and goading the left-hand foe of the herd, thus doth speak: \u201CCome,\u201D she says, \u201Cto work, thou fierce one, cause a madness urge him on, let a fury prick him onwards till he return through our woods, he who over-rashly seeks to fly from my empire. On! thrash thy flanks with thy tail, endure thy strokes; make the whole place re-echo with roar of thy bellowings; wildly toss thy tawny mane about thy nervous neck.\u201D Thus ireful Cybebe spoke and loosed the yoke with her hand. The monster, self-exciting, to rapid wrath his heart doth spur, he rushes, he roars, he bursts through the brake with heedless tread. But when he gained the humid verge of the foam-flecked shore, and spied the womanish Attis near the opal sea, he made a bound: the witless wretch fled into the wild wold: there throughout the space of her whole life a bondsmaid did she stay. Great Goddess, Goddess Cybebe, Goddess Dame of Dindymus, far from my home may all thine anger be, O mistress: urge others to such actions, to madness others hound.</p>','<p class="cantohead">LXIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Pines aforetimes sprung from Pelion peak floated, so \u2019tis said, through liquid billows of Neptune to the flowing Phasis and the confines Aeetaean, when the picked youth, the vigour of Argive manhood seeking to carry away the Golden Fleece from Colchis, dared to skim o\u2019er salt seas in a swift-sailing ship, sweeping caerulean ocean with paddles shapen from fir-wood. That Goddess who guards the castles in topmost parts of the towns herself fashioned the car, scudding with lightest of winds, uniting the interweaved pines unto the curving keel. That same first instructed untaught Amphitrite with sailing. Scarce had it split with its stem the windy waves, and the billow vext with oars had whitened into foam, when arose from the abyss of the hoary eddies the faces of sea-dwelling Nereids wondering at the marvel. And then on that propitious day mortal eyes gazed on sea-nymphs with naked bodies bare to the breasts outstanding from the foamy abyss. Then \u2019tis said Peleus burned with desire for Thetis, then Thetis contemned not mortal hymenaeals, then Thetis\u2019 sire himself sanctioned her joining to Peleus. O born in the time of joyfuller ages, heroes, hail! sprung from the gods, good progeny of mothers, hail! and favourably be ye inclined. You oft in my song I\u2019ll address, thee too I\u2019ll approach, Peleus, pillar of Thessaly, so increased in importance by thy fortunate wedding-torches, to whom Jupiter himself, the sire of the gods himself, yielded up his beloved. Did not Thetis embrace thee, she most winsome of Nereids born? Did not Tethys consent that thou should\u2019st lead home her grandchild, and Oceanus eke, whose waters girdle the total globe? When in full course of time the longed-for day had dawned, all Thessaly assembled throngs his home, a gladsome company o\u2019erspreading the halls: they bear gifts to the fore, and their joy in their faces they shew. Scyros desert remains, they leave Phthiotic Tempe, Crannon\u2019s homes, and the fortressed walls of Larissa; to Pharsalia they hie, \u2019neath Pharsalian roofs they gather. None tills the soil, the heifers\u2019 necks grow softened, the trailing vine is not cleansed by the curved rake-prongs, nor does the sickle prune the shade of the spreading tree-branches, nor does the bullock up-tear the glebe with the prone-bending ploughshare; squalid rust steals o\u2019er the neglected ploughs.</p>\n\t\t\t<p>But this mansion, throughout its innermost recesses of opulent royalty, glitters with gleaming gold and with silver. Ivory makes white the seats; goblets glint on the boards; the whole house delights in the splendour of royal treasure. Placed in the midst of the mansion is the bridal bed of the goddess, made glossy with Indian tusks and covered with purple, tinted with the shell-fish\u2019s rosy dye. This tapestry embroidered with figures of men of ancient time pourtrays with admirable art the heroes\u2019 valour. For looking forth from Dia\u2019s beach, resounding with crashing of breakers, Theseus hasting from sight with swiftest of fleets, Ariadne watches, her heart swelling with raging passion, nor scarce yet credits she sees what she sees, as, newly-awakened from her deceptive sleep, she perceives herself, deserted and woeful, on the lonely shore. But the heedless youth, flying away, beats the waves with his oars, leaving his perjured vows to the gusty gales. In the dim distance from amidst the sea-weed, the daughter of Minos with sorrowful eyes, like a stone-carved Bacchante, gazes afar, alas! gazes after him, heaving with great waves of grief. No longer does the fragile fillet bind her yellow locks, no more with light veil is her hidden bosom covered, no more with rounded zone the milky breasts are clasped; down fallen from her body everything is scattered, hither, thither, and the salt waves toy with them in front of her very feet. But neither on fillet nor floating veil, but on thee, Theseus, in their stead, was she musing: on thee she bent her heart, her thoughts, her love-lorn mind. Ah, woeful one, with sorrows unending distraught, Erycina sows thorny cares deep in thy bosom, since that time when Theseus fierce in his vigour set out from the curved bay of Piraeus, and gained the Gortynian roofs of the iniquitous ruler.</p>\n\t\t\t<p>For of old \u2019tis narrated, that constrained by plague of the cruelest to expiate the slaughter of Androgeos, both chosen youths and the pick of the unmarried maidens Cecropia was wont to give as a feast to the Minotaur. When thus his strait walls with ills were vexed, Theseus with free will preferred to yield up his body for adored Athens rather than such Cecropian corpses be carried to Crete unobsequied. And therefore borne in a speedy craft by favouring breezes, he came to the imperious Minos and his superb seat. Instant the royal virgin him saw with longing glance, she whom the chaste couch out-breathing sweetest of scents cradled in her mother\u2019s tender enfoldings, like to the myrtle which the rivers of Eurotas produce, or the many-tinted blooms opening with the springtide\u2019s breezes, she bent not down away from him her kindling glance, until the flame spread through her whole body, and burned into her innermost marrow. Ah, hard of heart, urging with misery to madness, O holy boy, who mingles men\u2019s cares and their joyings, and thou queen of Golgos and of foliaged Idalium, on what waves did you heave the mind-kindled maid, sighing full oft for the golden-haired guest! What dreads she bore in her swooning soul! How often did she grow sallower in sheen than gold! When craving to contend against the savage monster Theseus faced death or the palm of praise. Then gifts to the gods not unmeet not idly given, with promise from tight-closed lips did she address her vows. For as an oak waving its boughs on Taurus\u2019 top, or a coniferous pine with sweating stem, is uprooted by savage storm, twisting its trunk with its blast (dragged from its roots prone it falleth afar, breaking all in the line of its fall) so did Theseus fling down the conquered body of the brute, tossing its horns in vain towards the skies. Thence backwards he retraced his steps \u2019midst great laud, guiding his errant footsteps by means of a tenuous thread, lest when outcoming from tortuous labyrinthines his efforts be frustrated by unobservant wandering. But why, turned aside from my first story, should I recount more, how the daughter fleeing her father\u2019s face, her sister\u2019s embrace, and e\u2019en her mother\u2019s, who despairingly bemoaned her lost daughter, preferred to all these the sweet love of Theseus; or how borne by their boat to the spumy shores of Dia she came; or how her yokeman with unmemoried breast forsaking her, left her bound in the shadows of sleep? And oft, so \u2019tis said, with her heart burning with fury she outpoured clarion cries from depths of her bosom, then sadly scaled the rugged mounts, whence she could cast her glance o\u2019er the vasty seething ocean, then ran into the opposing billows of the heaving sea, raising from her bared legs her clinging raiment, and in uttermost plight of woe with tear-stained face and chilly sobs spake she thus:&mdash;</p>\n\t\t\t<p>\u201CIs it thus, O perfidious, when dragged from my motherland\u2019s shores, is it thus, O false Theseus, that thou leavest me on this desolate strand? thus dost depart unmindful of slighted godheads, bearing home thy perjured vows? Was no thought able to bend the intent of thy ruthless mind? hadst thou no clemency there, that thy pitiless bowels might compassionate me? But these were not the promises thou gavest me idly of old, this was not what thou didst bid me hope for, but the blithe bride-bed, hymenaeal happiness: all empty air, blown away by the breezes. Now, now, let no woman give credence to man\u2019s oath, let none hope for faithful vows from mankind; for whilst their eager desire strives for its end, nothing fear they to swear, nothing of promises stint they: but instant their lusting thoughts are satiate with lewdness, nothing of speech they remember, nothing of perjuries reck. In truth I snatched thee from the midst of the whirlpool of death, preferring to suffer the loss of a brother rather than fail thy need in the supreme hour, O ingrate. For the which I shall be a gift as prey to be rent by wild beasts and the carrion-fowl, nor dead shall I be placed in the earth, covered with funeral mound. What lioness bare thee \u2019neath lonely crag? What sea conceived and spued thee from its foamy crest? What Syrtis, what grasping Scylla, what vast Charybdis? O thou repayer with such guerdon for thy sweet life! If \u2019twas not thy heart\u2019s wish to yoke with me, through holding in horror the dread decrees of my stern sire, yet thou couldst have led me to thy home, where as thine handmaid I might have served thee with cheerful service, laving thy snowy feet with clear water, or spreading the purple coverlet o\u2019er thy couch. Yet why, distraught with woe, do I vainly lament to the unknowing winds, which unfurnished with sense, can neither hear uttered complaints nor can return them? For now he has sped away into the midst of the seas, nor doth any mortal appear along this desolate seaboard. Thus with o\u2019erweening scorn doth bitter Fate in my extreme hour even grudge ears to my plaints. All-powerful Jupiter! would that in old time the Cecropian poops had not touched at the Gnossian shores, nor that bearing to the unquelled bull the direful ransom had the false mariner moored his hawser to Crete, nor that yon wretch hiding ruthless designs beneath sweet seemings had reposed as a guest in our halls! For whither may I flee? in what hope, O lost one, take refuge? Shall I climb the Idomenean crags? but the truculent sea stretching amain with its whirlings of waters separates us. Can I quest help from my father, whom I deserted to follow a youth besprinkled with my brother\u2019s blood? Can I crave comfort from the care of a faithful yokeman, who is fleeing with yielding oars, encurving \u2019midst whirling waters. If I turn from the beach there is no roof in this tenantless island, no way sheweth a passage, circled by waves of the sea; no way of flight, no hope; all denotes dumbness, desolation, and death. Natheless mine eyes shall not be dimmed in death, nor my senses secede from my spent frame, until I have besought from the gods a meet mulct for my betrayal, and implored the faith of the celestials with my latest breath. Wherefore ye requiters of men\u2019s deeds with avenging pains, O Eumenides, whose front enwreathed with serpent-locks blazons the wrath exhaled from your bosom, hither, hither haste, hear ye my plainings, which I, sad wretch, am urged to outpour from mine innermost marrow, helpless, burning, and blind with frenzied fury. And since in truth they spring from the veriest depths of my heart, be ye unwilling to allow my agony to pass unheeded, but with such mind as Theseus forsook me, with like mind, O goddesses, may he bring evil on himself and on his kin.\u201D</p>\n\t\t\t<p>After she had poured forth these words from her grief-laden bosom, distractedly clamouring for requital against his heartless deeds, the celestial ruler assented with almighty nod, at whose motion the earth and the awe-full waters quaked, and the world of glittering stars did quiver. But Theseus, self-blinded with mental mist, let slip from forgetful breast all those injunctions which until then he had held firmly in mind, nor bore aloft sweet signals to his sad sire, shewing himself safe when in sight of Erectheus\u2019 haven. For \u2019tis said that aforetime, when Aegeus entrusted his son to the winds, on leaving the walls of the chaste goddess\u2019s city, these commands he gave to the youth with his parting embrace.</p>\n\t\t\t<p>\u201CO mine only son, far dearer to me than long life, lately restored to me at extreme end of my years, O son whom I must perforce dismiss to a doubtful hazard, since my ill fate and thine ardent valour snatch thee from unwilling me, whose dim eyes are not yet sated with my son\u2019s dear form: nor gladly and with joyous breast do I send thee, nor will I suffer thee to bear signs of helpful fortune, but first from my breast many a plaint will I express, sullying my grey hairs with dust and ashes, and then will I hang dusky sails to the swaying mast, so that our sorrow and burning lowe are shewn by Iberian canvas, rustily darkened. Yet if the dweller on holy Itone, who deigns defend our race and Erectheus\u2019 dwellings, grant thee to besprinkle thy right hand in the bull\u2019s blood, then see that in very truth these commandments deep-stored in thine heart\u2019s memory do flourish, nor any time deface them. Instant thine eyes shall see our cliffs, lower their gloomy clothing from every yard, and let the twisted cordage bear aloft snowy sails, where splendent shall shine bright topmast spars, so that, instant discerned, I may know with gladness and lightness of heart that in prosperous hour thou art returned to my face.\u201D</p>\n\t\t\t<p>These charges, at first held in constant mind, from Theseus slipped away as clouds are impelled by the breath of the winds from the ethereal peak of a snow-clad mount. But his father as he betook himself to the castle\u2019s turrets as watchplace, dimming his anxious eyes with continual weeping, when first he spied the discoloured canvas, flung himself headlong from the top of the crags, deeming Theseus lost by harsh fate. Thus as he entered the grief-stricken house, his paternal roof, Theseus savage with slaughter met with like grief as that which with unmemoried mind he had dealt to Minos\u2019 daughter: while she with grieving gaze at his disappearing keel, turned over a tumult of cares in her wounded spirit.</p>\n\t\t\t<p>But on another part [of the tapestry] swift hastened the flushed Iacchus with his train of Satyrs and Nisa-begot Sileni, thee questing, Ariadne, and aflame with love for thee. * * * * These scattered all around, an inspired band, rushed madly with mind all distraught, ranting \u201CEuhoe,\u201D with tossing of heads \u201CEuhoe.\u201D Some with womanish hands shook thyrsi with wreath-covered points; some tossed limbs of a rended steer; some engirt themselves with writhed snakes; some enacted obscure orgies with deep chests, orgies of which the profane vainly crave a hearing; others beat the tambours with outstretched palms, or from the burnished brass provoked shrill tinklings, blew raucous-sounding blasts from many horns, and the barbarous pipe droned forth horrible song.</p>\n\t\t\t<p>With luxury of such figures was the coverlet adorned, enwrapping the bed with its mantling embrace. After the Thessalian youthhood with eager engazing were sated they began to give way to the sacred gods. Hence, as with his morning\u2019s breath brushing the still sea Zephyrus makes the sloping billows uprise, when Aurora mounts \u2019neath the threshold of the wandering sun, which waves heave slowly at first with the breeze\u2019s gentle motion (plashing with the sound as of low laughter) but after, as swells the wind, more and more frequent they crowd and gleam in the purple light as they float away,&mdash;so quitting the royal vestibule did the folk hie them away each to his home with steps wandering hither and thither.</p>\n\t\t\t<p>After they had wended their way, chief from the Pelion vertex Chiron came, the bearer of sylvan spoil: for whatsoever the fields bear, whatso the Thessalian land on its high hills breeds, and what flowers the fecund air of warm Favonius begets near the running streams, these did he bear enwreathed into blended garlands wherewith the house rippled with laughter, caressed by the grateful odour.</p>\n\t\t\t<p>Speedily stands present Penios, for a time his verdant Tempe, Tempe whose overhanging trees encircle, leaving to the Dorian choirs, damsels Magnesian, to frequent; nor empty-handed,&mdash;for he has borne hither lofty beeches uprooted and the tall laurel with straight stem, nor lacks he the nodding plane and the lithe sister of flame-wrapt Phaethon and the aerial cypress. These wreathed in line did he place around the palace so that the vestibule might grow green sheltered with soft fronds.</p>\n\t\t\t<p>After him follows Prometheus of inventive mind, bearing diminishing traces of his punishment of aforetime, which of old he had suffered, with his limbs confined by chains hanging from the rugged Scythian crags. Then came the sire of gods from heaven with his holy consort and offspring, leaving thee alone, Phoebus, with thy twin-sister the fosterer of the mountains of Idrus: for equally with thyself did thy sister disdain Peleus nor was she willing to honour the wedding torches of Thetis. After they had reclined their snow-white forms along the seats, tables were loaded on high with food of various kinds.</p>\n\t\t\t<p>In the meantime with shaking bodies and infirm gesture the Parcae began to intone their veridical chant. Their trembling frames were enwrapped around with white garments, encircled with a purple border at their heels, snowy fillets bound each aged brow, and their hands pursued their never-ending toil, as of custom. The left hand bore the distaff enwrapped in soft wool, the right hand lightly withdrawing the threads with upturned fingers did shape them, then twisting them with the prone thumb it turned the balanced spindle with well-polished whirl. And then with a pluck of their tooth the work was always made even, and the bitten wool-shreds adhered to their dried lips, which shreds at first had stood out from the fine thread. And in front of their feet wicker baskets of osier twigs took charge of the soft white woolly fleece. These, with clear-sounding voice, as they combed out the wool, outpoured fates of such kind in sacred song, in song which none age yet to come could tax with untruth.</p>\n\t\t\t<p>\u201CO with great virtues thine exceeding honour augmenting, stay of Emathia-land, most famous in thine issue, receive what the sisters make known to thee on this gladsome day, a weird veridical! But ye whom the fates do follow:&mdash;Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CNow Hesperus shall come unto thee bearing what is longed for by bridegrooms, with that fortunate star shall thy bride come, who ensteeps thy soul with the sway of softening love, and prepares with thee to conjoin in languorous slumber, making her smooth arms thy pillow round \u2019neath thy sinewy neck. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CNo house ever yet enclosed such loves, no love bound lovers with such pact, as abideth with Thetis, as is the concord of Peleus. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CTo ye shall Achilles be born, a stranger to fear, to his foemen not by his back, but by his broad breast known, who, oft-times the victor in the uncertain struggle of the foot-race, shall outrun the fire-fleet footsteps of the speedy doe. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CNone in war with him may compare as a hero, when the Phrygian streams shall trickle with Trojan blood, and when besieging the walls of Troy with a long-drawn-out warfare perjured Pelops\u2019 third heir shall lay that city waste. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CHis glorious acts and illustrious deeds often shall mothers attest o\u2019er funeral-rites of their sons, when the white locks from their heads are unloosed amid ashes, and they bruise their discoloured breasts with feeble fists. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CFor as the husbandman bestrewing the dense wheat-ears mows the harvest yellowed \u2019neath ardent sun, so shall he cast prostrate the corpses of Troy\u2019s sons with grim swords. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CHis great valour shall be attested by Scamander\u2019s wave, which ever pours itself into the swift Hellespont, narrowing whose course with slaughtered heaps of corpses he shall make tepid its deep stream by mingling warm blood with the water. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CAnd she a witness in fine shall be the captive-maid handed to death, when the heaped-up tomb of earth built in lofty mound shall receive the snowy limbs of the stricken virgin. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CFor instant fortune shall give the means to the war-worn Greeks to break Neptune\u2019s stone bonds of the Dardanian city, the tall tomb shall be made dank with Polyxena\u2019s blood, who as the victim succumbing \u2019neath two-edged sword, with yielding hams shall fall forward a headless corpse. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CWherefore haste ye to conjoin in the longed-for delights of your love. Bridegroom thy goddess receive in felicitous compact; let the bride be given to her eager husband. Haste ye, a-weaving the woof, O hasten, ye spindles.</p>\n\t\t\t<p>\u201CNor shall the nurse at orient light returning, with yester-e\u2019en\u2019s thread succeed in circling her neck. [Haste ye, a-weaving the woof, O hasten, ye spindles.] Not need her solicitous mother fear sad discord  shall cause a parted bed for her daughter, nor need she cease to hope for dear grandchildren. Haste ye, a-weaving the woof, O hasten, ye spindles.\u201D</p>\n\t\t\t<p>With such soothsaying songs of yore did the Parcae chant from divine breast the felicitous fate of Peleus. For of aforetime the heaven-dwellers were wont to visit the chaste homes of heroes and to shew themselves in mortal assembly ere yet their worship was scorned. Often the father of the gods, a-resting in his glorious temple, when on the festal days his annual rites appeared, gazed on an hundred bulls strewn prone on the earth. Often wandering Liber on topmost summit of Parnassus led his yelling Thyiads with loosely tossed locks. * * * * When the Delphians tumultuously trooping from the whole of their city joyously acclaimed the god with smoking altars. Often in lethal strife of war Mavors, or swift Triton\u2019s queen, or the Rhamnusian virgin, in person did exhort armed bodies of men. But after the earth was infected with heinous crime, and each one banished justice from their grasping mind, and brothers steeped their hands in fraternal blood, the son ceased grieving o\u2019er departed parents, the sire craved for the funeral rites of his first-born that freely he might take of the flower of unwedded step-dame, the unholy mother, lying under her unknowing son, did not fear to sully her household gods with dishonour: everything licit and lawless commingled with mad infamy turned away from us the just-seeing mind of the gods. Wherefore nor do they deign to appear at such-like assemblies, nor will they permit themselves to be met in the day-light.</p>','<p class="cantohead">LXV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Though outspent with care and unceasing grief, I am withdrawn, Ortalus, from the learned Virgins, nor is my soul\u2019s mind able to bring forth sweet babes of the Muses (so much does it waver \u2019midst ills: for but lately the wave of the Lethean stream doth lave with its flow the pallid foot of my brother, whom \u2019neath the Rhoetean seaboard the Trojan soil doth crush, thrust from our eyesight. * * * Never again may I salute thee, nor hear thy converse; never again, O brother, more loved than life, may I see thee in aftertime. But for all time in truth will I love thee, always will I sing elegies made gloomy by thy death, such as the Daulian bird pipes \u2019neath densest shades of foliage, lamenting the lot of slain Itys.) Yet \u2019midst sorrows so deep, O Ortalus, I send thee these verses re-cast from Battiades, lest thou shouldst credit thy words by chance have slipt from my mind, given o\u2019er to the wandering winds, as \u2019twas with that apple, sent as furtive love-token by the wooer, which outleapt from the virgin\u2019s chaste bosom; for, placed by the hapless girl \u2019neath her soft vestment, and forgotten,&mdash;when she starts at her mother\u2019s approach, out \u2019tis shaken: and down it rolls headlong to the ground, whilst a tell-tale flush mantles the face of the distressed girl.</p>','<p class="cantohead">LXVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>He who scanned all the lights of the great firmament, who ascertained the rising and the setting of the stars, how the flaming splendour of the swift sun was endarkened, how the planets disappear at certain seasons, how sweet love with stealth detaining Trivia beneath the Latmian crags, draws her away from her airy circuit, that same Conon saw me amongst celestial light, the hair from Berenice\u2019s head, gleaming with brightness, which she outstretching graceful arms did devote to the whole of the gods, when the king flushed with the season of new wedlock had gone to lay waste the Assyrian borders, bearing the sweet traces of nightly contests, in which he had borne away her virginal spoils. Is Venus abhorred by new-made brides? Why be the parents\u2019 joys turned aside by feigned tears, which they shed copiously amid the lights of the nuptial chamber? Untrue are their groans, by the gods I swear! This did my queen teach me by her many lamentings, when her bridegroom set out for stern warfare. Yet thou didst not mourn the widowhood of desolate couch, but the tearful separation from a dear brother? How care made sad inroads in thy very marrow! In so much that thine whole bosom being agitated, and thy senses being snatched from thee, thy mind wandered! But in truth I have known thee great of heart ever since thou wast a little maiden. Hast thou forgotten that noble deed, by which thou didst gain a regal wedlock, than which none dared other deeds bolder? Yet what grieving words didst thou speak when bidding thy bridegroom farewell! Jupiter! as with sad hand often thine eyes thou didst dry! What mighty god changed thee? Was it that lovers are unwilling to be long absent from their dear one\u2019s body? Then didst thou devote me to the whole of the gods on thy sweet consort\u2019s behalf, not without blood of bullocks, should he be granted safe return. In no long time he added captive Asia to the Egyptian boundaries. Wherefore for these reasons I, bestowed \u2019midst the celestial host, by a new gift fulfil thine ancient promise. With grief, O queen, did I quit thy brow, with grief: I swear to thee and to thine head; fit ill befall whosoever shall swear lightly: but who may bear himself peer with steel? Even that mountain was swept away, the greatest on earth, over which Thia\u2019s illustrious progeny passed, when the Medes created a new sea, and the barbarian youth sailed its fleet through the middle of Athos. What can locks of hair do, when such things yield to iron? Jupiter! may the whole race of the Chalybes perish, and whoever first questing the veins \u2019neath the earth harassed its hardness, breaking it through with iron. Just before severance my sister locks were mourning my fate, when Ethiop Memnon\u2019s brother, the winged steed, beating the air with fluttering pennons, appeared before Locrian Arsinoe, and this one bearing me up, flies through aethereal shadows and lays me in the chaste bosom of Venus. Him Zephyritis herself had dispatched as her servant, a Grecian settler on the Canopian shores. For \u2019twas the wish of many gods that not alone in heaven\u2019s light should the golden coronet from Ariadne\u2019s temples stay fixed, but that we also should gleam, the spoils devote from thy golden-yellow head; when humid with weeping I entered the temples of the gods, the Goddess placed me, a new star, amongst the ancient ones. For a-touching the Virgin\u2019s and the fierce Lion\u2019s gleams, hard by Callisto of Lycaon, I turn westwards fore-guiding the slow-moving Bootes who sinks unwillingly and late into the vasty ocean. But although the footsteps of the gods o\u2019erpress me in the night-tide, and the daytime restoreth me to the white-haired Tethys, (grant me thy grace to speak thus, O Rhamnusian virgin, for I will not hide the truth through any fear, even if the stars revile me with ill words yet I will unfold the pent-up feelings from truthful breast) I am not so much rejoiced at these things as I am tortured by being for ever parted, parted from my lady\u2019s head, with whom I (though whilst a virgin she was free from all such cares) drank many a thousand of Syrian scents.</p>\n\t\t\t<p>Now do you, whom the gladsome light of the wedding torches hath joined, yield not your bodies to your desiring husbands nor throw aside your vestments and bare your bosom\u2019s nipples, before your onyx cup brings me jocund gifts, your onyx, ye who seek the dues of chaste marriage-bed. But she who giveth herself to foul adultery, may the light-lying dust responselessly drink her vile gifts, for I seek no offerings from folk that do ill. But rather, O brides, may concord always be yours, and constant love ever dwell in your homes. But when thou, O queen, whilst gazing at the stars, shalt propitiate the goddess Venus with festal torch-lights, let not me, thine own, be left lacking of unguent, but rather gladden me with large gifts. Stars fall in confusion! So that I become a royal tress, Orion might gleam in Aquarius\u2019 company.</p>','<p class="cantohead">LXVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p class="inthead"><em>Catullus</em>.</p>\n\t\t\t<p>O dear in thought to the sweet husband, dear in thought to his sire, hail! and may Jove augment his good grace to thee, Door! which of old, men say, didst serve Balbus benignly, whilst the oldster held his home here; and which contrariwise, so \u2019tis said, didst serve with grudging service after the old man was stretched stark, thou doing service to the bride. Come, tell us why thou art reported to be changed and to have renounced thine ancient faithfulness to thy lord?</p>\n\t\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t\t<p>No, (so may I please Caecilius to whom I am now made over!) it is not my fault, although \u2019tis said so to be, nor may anyone impute any crime to me; albeit the fabling tongues of folk make it so, who, whene\u2019er aught is found not well done, all clamour at me: \u201CDoor, thine is the blame!\u201D</p>\n\t\t\t<p class="inthead"><em>Catullus</em>.</p>\n\t\t\t<p>It is not enough for thee to say this by words merely, but so to act that everyone may feel it and see it.</p>\n\t\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t\t<p>In what way can I? No one questions or troubles to know.</p>\n\t\t\t<p class="inthead"><em>Catullus</em>.</p>\n\t\t\t<p>We are wishful: be not doubtful to tell us.</p>\n\t\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t\t<p>First then, the virgin (so they called her!) who was handed to us was spurious. Her husband was not the first to touch her, he whose little dagger, hanging more limply than the tender beet, never raised itself to the middle of his tunic: but his father is said to have violated his son\u2019s bed and to have polluted the unhappy house, either because his lewd mind blazed with blind lust, or because his impotent son was sprung from sterile seed, and therefore one greater of nerve than he was needed, who could unloose the virgin\u2019s zone.</p>\n\t\t\t<p class="inthead"><em>Catullus</em>.</p>\n\t\t\t<p>Thou tellest of an excellent parent marvellous in piety, who himself urined in the womb of his son!</p>\n\t\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t\t<p>But not this alone is Brixia said to have knowledge of, placed \u2019neath the Cycnean peak, through which the golden-hued Mella flows with its gentle current, Brixia, beloved mother of my Verona. For it talks of the loves of Postumius and of Cornelius, with whom she committed foul adultery.</p>\n\t\t\t<p class="inthead"><em>Catullus</em>.</p>\n\t\t\t<p>Folk might say here: \u201CHow knowest thou these things, O door? thou who art never allowed absence from thy lord\u2019s threshold, nor mayst hear the folk\u2019s gossip, but fixed to this beam art wont only to open or to shut the house!\u201D</p>\n\t\t\t<p class="inthead"><em>Door</em>.</p>\n\t\t\t<p>Often have I heard her talking with hushed voice, when alone with her handmaids, about her iniquities, quoting by name those whom we have spoken of, for she did not expect me to be gifted with either tongue or ear. Moreover she added a certain one whose name I\u2019m unwilling to speak, lest he uplift his red eyebrows. A lanky fellow, against whom some time ago was brought a grave law-suit anent the spurious child-birth of a lying belly.</p>','<p class="cantohead">LXVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>That when, opprest by fortune and in grievous case, thou didst send me this epistle o\u2019erwrit with tears, that I might bear up shipwrecked thee tossed by the foaming waves of the sea, and restore thee from the threshold of death; thou whom neither sacred Venus suffers to repose in soft slumber, desolate on a a lonely couch, nor do the Muses divert with the sweet song of ancient poets, whilst thy anxious mind keeps vigil:&mdash;this is grateful to me, since thou dost call me thy friend, and dost seek hither the gifts of the Muses and of Venus. But that my troubles may not be unknown to thee, O Manius, nor thou deem I shun the office of host, hear how I am whelmed in the waves of that same fortune, nor further seek joyful gifts from a wretched one. In that time when the white vestment was first handed to me, and my florid age was passing in jocund spring, much did I sport enow: nor was the goddess unknown to us who mixes bitter-sweet with our cares. But my brother\u2019s death plunged all this pursuit into mourning. O brother, taken from my unhappy self; thou by thy dying hast broken my ease, O brother; all our house is buried with thee; with thee have perished the whole of our joys, which thy sweet love nourished in thy lifetime. Thou lost, I have dismissed wholly from mind these studies and every delight of mind. Wherefore, as to what thou writest, \u201C\u2019Tis shameful for Catullus to be at Verona, for there anyone of utmost note must chafe his frigid limbs on a desolate couch;\u201D that, Manius, is not shameful; rather \u2019tis a pity. Therefore, do thou forgive, if what grief has snatched from me, these gifts, I do not bestow on thee, because I am unable. For, that there is no great store of writings with me arises from this, that we live at Rome: there is my home, there is my hall, thither my time is passed; hither but one of my book-cases follows me. As \u2019tis thus, I would not that thou deem we act so from ill-will or from a mind not sufficiently ingenuous, that ample store is not forthcoming to either of thy desires: both would I grant, had I the wherewithal. Nor can I conceal, goddesses, in what way Allius has aided me, or with how many good offices he has assisted me; nor shall fleeting time with its forgetful centuries cover with night\u2019s blindness this care of his. But I tell it to you, and do ye declare it to many thousands, and make this paper, grown old, speak of it * * * * And let him be more and more noted when dead, nor let the spider aloft, weaving her thin-drawn web, carry on her work over the neglected name of Allius. For you know what anxiety of mind wily Amathusia gave me, and in what manner she overthrew me, when I was burning like the Trinacrian rocks, or the Malian fount in Oetaean Thermopylae; nor did my piteous eyes cease to dissolve with continual weeping, nor my cheeks with sad showers to be bedewed. As the pellucid stream gushes forth from the moss-grown rock on the aerial crest of the mountain, which when it has rolled headlong prone down the valley, softly wends its way through the midst of the populous parts, sweet solace to the wayfarer sweating with weariness, when the oppressive heat cracks the burnt-up fields agape: or, as to sailors tempest-tossed in black whirlpool, there cometh a favourable and a gently-moving breeze, Pollux having been prayed anon, and Castor alike implored: of such kind was Manius\u2019 help to us. He with a wider limit laid open my closed field; he gave us a home and its mistress, on whom we both might exercise our loves in common. Thither with gracious gait my bright-hued goddess betook herself, and pressed her shining sole on the worn threshold with creaking of sandal; as once came Laodamia, flaming with love for her consort, to the home of Protesilaus,&mdash;a beginning of naught! for not yet with sacred blood had a victim made propitiate the lords of the heavens. May nothing please me so greatly, Rhamnusian virgin, that I should act thus heedlessly against the will of those lords! How the thirsty altar craves for sacrificial blood Laodamia was taught by the loss of her husband, being compelled to abandon the neck of her new spouse when one winter was past, before another winter had come, in whose long nights she might so glut her greedy love, that she could have lived despite her broken marriage-yoke, which the Parcae knew would not be long distant, if her husband as soldier should fare to the Ilian walls. For by Helena\u2019s rape Troy had begun to put the Argive Chiefs in the field; Troy accurst, the common grave of Asia and of Europe, Troy, the sad ashes of heroes and of every noble deed, that also lamentably brought death to our brother. O brother taken from unhappy me! O jocund light taken from thy unhappy brother! in thy one grave lies all our house, in thy one grave have perished all our joys, which thy sweet love did nurture during life. Whom now is laid so far away, not amongst familiar tombs nor near the ashes of his kindred, but obscene Troy, malign Troy, an alien earth, holds thee entombed in its remote soil. Thither, \u2019tis said, hastening together from all parts, the Grecian manhood forsook their hearths and homes, lest Paris enjoy his abducted trollop with freedom and leisure in a peaceful bed. Such then was thy case, loveliest Laodamia, to be bereft of husband sweeter than life, and than soul; thou being sucked in so great a whirlpool of love, its eddy submerged thee in its steep abyss, like (so folk say) to the Graian gulph near Pheneus of Cyllene with its fat swamp\u2019s soil drained and dried, which aforetime the falsely-born Amphitryoniades dared to hew through the marrow of cleft mountains, at the time when he smote down the Stymphalian monsters with sure shafts by the command of his inferior lord, so that the heavenly portal might be pressed by a greater number of deities, nor Hebe longer remain in her virginity. But deeper than that abyss was thy deep love which taught [thy husband] to bear his lady\u2019s forceful yoke. For not so dear to the spent age of the grandsire is the late born grandchild an only daughter rears, who, long-wished-for, at length inherits the ancestral wealth, his name duly set down in the attested tablets; and casting afar the impious hopes of the baffled next-of-kin, scares away the vulture from the whitened head; nor so much does any dove-mate rejoice in her snow-white consort (though, \u2019tis averred, more shameless than most in continually plucking kisses with nibbling beak) as thou dost, though woman is especially inconstant. But thou alone didst surpass the great frenzies of these, when thou wast once united to thy yellow-haired husband. Worthy to yield to whom in naught or in little, my light brought herself to my bosom, round whom Cupid, often running hither thither, gleamed lustrous-white in saffron-tinted tunic. Still although she is not content with Catullus alone, we will suffer the rare frailties of our coy lady, lest we may be too greatly unbearable, after the manner of fools. Often even Juno, greatest of heaven-dwellers, boiled with flaring wrath at her husband\u2019s default, wotting the host of frailties of all-wishful Jove. Yet \u2019tis not meet to match men with the gods, * * * * bear up the ungrateful burden of a tremulous parent. Yet she was not handed to me by a father\u2019s right hand when she came to my house fragrant with Assyrian odour, but she gave me her stealthy favours in the mute night, withdrawing of her own will from the bosom of her spouse. Wherefore that is enough if to us alone she gives that day which she marks with a whiter stone. This gift to thee, all that I can, of verse completed, is requital, Allius, for many offices, so that this day and that, and other and other of days may not tarnish your name with scabrous rust. Hither may the gods add gifts full many, which Themis aforetimes was wont to bear to the pious of old. May ye be happy, both thou and thy life\u2019s-love together, and thy home in which we have sported, and its mistress, and Anser who in the beginning brought thee to us, from whom all my good fortunes were first born, and lastly she whose very self is dearer to me than all these,&mdash;my light, whom living, \u2019tis sweet to me to live.</p>','<p class="cantohead">LXVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Be unwilling to wonder wherefore no woman, O Rufus, is wishful to place her tender thigh \u2019neath thee, not even if thou dost tempt her by the gift of a rare robe or by the delights of a crystal-clear gem. A certain ill tale injures thee, that thou bearest housed in the valley of thine armpits a grim goat. Hence everyone\u2019s fear. Nor be marvel: for \u2019tis an exceeding ill beast, with whom no fair girl will sleep. Wherefore, either murder that cruel plague of their noses, or cease to marvel why they fly?</p>','<p class="cantohead">LXX.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>No one, saith my lady, would she rather wed than myself, not even if Jupiter\u2019s self crave her. Thus she saith! but what a woman tells an ardent amourist ought fitly to be graven on the breezes and in running waters.</p>','<p class="cantohead">LXXI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>If ever anyone was deservedly cursed with an atrocious goat-stench from armpits, or if limping gout did justly gnaw one, \u2019tis thy rival, who occupies himself with your love, and who has stumbled by the marvel of fate on both these ills. For as oft as he swives, so oft is he taken vengeance on by both; she he prostrates by his stink, he is slain by his gout.</p>','<p class="cantohead">LXXII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Once thou didst profess to know but Catullus, Lesbia, nor wouldst hold Jove before me. I loved thee then, not only as a churl his mistress, but as a father loves his own sons and sons-in-law. Now I do know thee: wherefore if more strongly I burn, thou art nevertheless to me far viler and of lighter thought. How may this be? thou askest. Because such wrongs drive a lover to greater passion, but to less wishes of welfare.</p>','<p class="cantohead">LXXIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Cease thou to wish to merit well from anyone in aught, or to think any can become honourable. All are ingrate, naught benign doth avail to aught, but rather it doth irk and prove the greater ill: so with me, whom none doth o\u2019erpress more heavily nor more bitterly than he who a little while ago held me his one and only friend.</p>','<p class="cantohead">LXXIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Gellius had heard that his uncle was wont to be wroth, if any spake of or practised love-sportings. That this should not happen to him, he kneaded up his uncle\u2019s wife herself, and made of his uncle a god of silence. Whatever he wished, he did; for now, even if he irrumate his uncle\u2019s self, not a word will that uncle murmur.</p>','<p class="cantohead">LXXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<p>Now is my mind brought down to this point, my Lesbia, by your fault, and has so lost itself by its devotion, that now it cannot wish you well, were you to become most perfect, nor can it cease to love you, whatever you do.</p>','<p class="cantohead">LXXVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>If to recall good deeds erewhiles performed be pleasure to a man, when he knows himself to be of probity, nor has violated sacred faith, nor has abused the holy assent of the gods in any pact, to work ill to men; great store of joys awaits thee during thy length of years, O Catullus, sprung from this ingrate love of thine. For whatever of benefit men can say or can do for anyone, such have been thy sayings and thy doings, and all thy confidences have been squandered on an ingrate mind. Wherefore now dost torture thyself further? Why not make firm thy heart and withdraw thyself from that [wretchedness], and cease to be unhappy despite the gods\u2019 will? \u2019Tis difficult quickly to depose a love of long growth; \u2019tis difficult, yet it behoves thee to do this. This is thine only salvation, this is thy great victory; this thou must do, whether it be possible or impossible. O gods, if \u2019tis in you to have mercy, or if ever ye held forth help to men in death\u2019s very extremity, look ye on pitiful me, and if I have acted my life with purity, snatch hence from me this canker and pest, which as a lethargy creeping through my veins and vitals, has cast out every gladness from my breast. Now I no longer pray that she may love me in return, or (what is not possible) that she should become chaste: I wish but for health and to cast aside this shameful complaint. O ye gods, vouchsafe me this in return for my probity.</p>','<p class="cantohead">LXXVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>O Rufus, credited by me as a friend, wrongly and for naught, (wrongly? nay, at an ill and grievous price) hast thou thus stolen upon me, and a-burning my innermost bowels, snatched from wretched me all our good? Thou hast snatched it, alas, alas, thou cruel venom of our life! alas, alas, thou plague of our amity. But now \u2019tis grief, that thy swinish slaver has soiled the pure love-kisses of our pure girl. But in truth thou shalt not come off with impunity; for every age shall know thee, and Fame the aged, shall denounce what thou art.</p>','<p class="cantohead">LXXVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Gallus has brothers, one of whom has a most charming spouse, the other a charming son. Gallus is a nice fellow! for pandering to their sweet loves, he beds together the nice lad and the nice aunt. Gallus is a foolish fellow not to see that he is himself a husband who as an uncle shews how to cuckold an uncle.</p>','<p class="cantohead">LXXVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Lesbius is handsome: why not so? when Lesbia prefers him to thee, Catullus, and to thy whole tribe. Yet this handsome one may sell Catullus and his tribe if from three men of note he can gain kisses of salute.</p>','<p class="cantohead">LXXX.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>What shall I say, Gellius, wherefore those lips, erstwhile rosy-red, have become whiter than wintery snow, thou leaving home at morn and when the noontide hour arouses thee from soothing slumber to face the longsome day? I know not forsure! but is Rumour gone astray with her whisper that thou devourest the well-grown tenseness of a man\u2019s middle? So forsure it must be! the ruptured guts of wretched Virro cry it aloud, and thy lips marked with lately-drained <span class="greek">&sigma;&epsilon;&mu;&epsilon;&nu;</span> publish the fact.</p>','<p class="cantohead">LXXXI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Could there be no one in so great a crowd, Juventius, no gallant whom thou couldst fall to admiring, beyond him, the guest of thy hearth from moribund Pisaurum, wanner than a gilded statue? Who now is in thine heart, whom thou darest to place above us, and knowest not what crime thou dost commit.</p>','<p class="cantohead">LXXXII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Quintius, if thou dost wish Catullus to owe his eyes to thee, or aught, if such may be, dearer than his eyes, be unwilling to snatch from him what is much dearer to him than his eyes, or than aught which itself may be dearer to him than his eyes.</p>','<p class="cantohead">LXXXIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Lesbia in her lord\u2019s presence says the utmost ill about me: this gives the greatest pleasure to that ninny. Ass, thou hast no sense! if through forgetfulness she were silent about us, it would be well: now that she snarls and scolds, not only does she remember, but what is a far bitterer thing, she is enraged. That is, she inflames herself and ripens her passion.</p>','<p class="cantohead">LXXXIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p><em>Chommodious</em> did Arrius say, whenever he had need to say commodious, and for insidious <em>hinsidious</em>, and felt confident he spoke with accent wondrous fine, when aspirating <em>hinsidious</em> to the full of his lungs. I understand that his mother, his uncle Liber, his maternal grand-parents all spoke thus. He being sent into Syria, everyone\u2019s ears were rested, hearing these words spoken smoothly and slightly, nor after that did folk fear such words from him, when on a sudden is brought the nauseous news that th\u2019 Ionian waves, after Arrius\u2019 arrival thither, no longer are Ionian hight, but are now the <em>Hionian Hocean</em>.</p>','<p class="cantohead">LXXXV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>I hate and I love. Wherefore do I so, peradventure thou askest. I know not, but I feel it to be thus and I suffer.</p>','<p class="cantohead">LXXXVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Quintia is lovely to many; to me she is fair, tall, and shapely. Each of these qualities I grant. But that all these make loveliness I deny: for nothing of beauty nor scintilla of sprightliness is in her body so massive. Lesbia is lovely, for whilst the whole of her is most beautiful, she has stolen for herself every love-charm from all her sex.</p>','<p class="cantohead">LXXXVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>No woman can say with truth that she has been loved as much as thou, Lesbia, hast been loved by me: no love-troth was ever so greatly observed as in love of thee on my part has been found.</p>\n\t\t\t<p>Now is my mind so led apart, my Lesbia, by thy fault, and has so lost itself by its very worship, that now it can not wish well to thee, wert thou to become most perfect, nor cease to love thee, do what thou wilt!</p>','<p class="cantohead">LXXXVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>What does he, Gellius, who with mother and sister itches and keeps vigils with tunics cast aside? What does he, who suffers not his uncle to be a husband? Dost thou know the weight of crime he takes upon himself? He takes, O Gellius, such store as not furthest Tethys nor Oceanus, progenitor of waters, can cleanse: for there is nothing of any crime which can go further, not though with lowered head he swallow himself.</p>','<p class="cantohead">LXXXVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Gellius is meagre: why not? He who lives with so good a mother, so healthy and so beauteous a sister, and who has such a good uncle, and a world-*full of girl cousins, wherefore should he leave off being lean? Though he touch naught save what is banned, thou canst find ample reason wherefore he may stay lean.</p>','<p class="cantohead">LXXXX.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Let there be born a Magian from the infamous conjoining of Gellius and his mother, and he shall learn the Persian aruspicy. For a Magian from a mother and son must needs be begotten, if there be truth in Persia\u2019s vile creed that one may worship with acceptable hymn the assiduous gods, whilst the caul\u2019s fat in the sacred flame is melting.</p>','<p class="cantohead">LXXXXI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Not for other reason, Gellius, did I hope for thy faith to me in this our unhappy, this our desperate love (because I knew thee well nor thought thee constant or able to restrain thy mind from shameless act), but that I saw this girl was neither thy mother nor thy sister, for whom my ardent love ate me. And although I have had many mutual dealings with thee, I did not credit this case to be enough cause for thee. Thou didst find it enough: so great is thy joy in every kind of guilt in which is something infamous.</p>','<p class="cantohead">LXXXXII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Lesbia forever speaks ill of me nor is ever silent anent me: may I perish if Lesbia do not love me! By what sign? because I am just the same: I malign her without cease, yet may I die if I do not love her in sober truth.</p>','<p class="cantohead">LXXXXIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>I am not over anxious, Caesar, to please thee greatly, nor to know whether thou art white or black man.</p>','<p class="cantohead">LXXXXIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Mentula whores. By the mentule he is be-whored: certes. This is as though they say the oil pot itself gathers the olives.</p>','<p class="cantohead">LXXXXV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>My Cinna\u2019s \u201CZmyrna\u201D at length, after nine harvests from its inception, is published when nine winters have gone by, whilst in the meantime Hortensius thousands upon thousands in one * * * * \u201CZmyrna\u201D shall wander abroad e\u2019en to the curving surf of Satrachus, hoary ages shall turn the leaves of \u201CZmyrna\u201D in distant days. But Volusius\u2019 Annals shall perish at Padua itself, and shall often furnish loose wrappings for mackerel. The short writings of my comrade are gladsome to my heart; let the populace rejoice in bombastic Antimachus.</p>','<p class="cantohead">LXXXXVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>If aught grateful or acceptable can penetrate the silent graves from our dolour, Calvus, when with sweet regret we renew old loves and beweep the lost friendships of yore, of a surety not so much doth Quintilia mourn her untimely death as she doth rejoice o\u2019er thy constant love.</p>','<p class="cantohead">LXXXXVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Nay (may the Gods thus love me) have I thought there to be aught of choice whether I might smell thy mouth or thy buttocks, O Aemilius. Nothing could the one be cleaner, nothing the other more filthy; nay in truth thy backside is the cleaner and better,&mdash;for it is toothless. Thy mouth hath teeth full half a yard in length, gums of a verity like to an old waggon-box, behind which its gape is such as hath the vulva of a she-mule cleft apart by the summer\u2019s heat, always a-staling. This object swives girls enow, and fancies himself a handsome fellow, and is not condemned to the mill as an ass? Whatso girl would touch thee, we think her capable of licking the breech of a leprous hangman.</p>','<p class="cantohead">LXXXXVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>To thee, if to anyone, may I say, foul-mouthed Victius, that which is said to wind bags and fatuities. For with that tongue, if need arrive, thou couldst lick clodhoppers\u2019 shoes, clogs, and buttocks. If thou wishest to destroy us all entirely, Victius, thou need\u2019st but gape: thou wilt accomplish what thou wishest entirely.</p>','<p class="cantohead">LXXXXVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>I snatched from thee, whilst thou wast sporting, O honied Juventius, a kiss sweeter than sweet ambrosia. But I bore it off not unpunished; for more than an hour do I remember myself hung on the summit of the cross, whilst I purged myself [for my crime] to thee, nor could any tears in the least remove your anger. For instantly it was done, thou didst bathe thy lips with many drops, and didst cleanse them with every finger-joint, lest anything remained from the conjoining of our mouths, as though it were the obscene slaver of a fetid fricatrice. Nay, more, thou hast handed wretched me over to despiteful Love, nor hast thou ceased to agonize me in every way, so that for me that kiss is now changed from ambrosia to be harsher than harsh hellebore. Since thou dost award such punishment to wretched amourist, never more after this will I steal kisses.</p>','<p class="cantohead">C.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Caelius, Aufilenus; and Quintius, Aufilena;&mdash;flower of the Veronese youth,&mdash;love desperately: this, the brother; that, the sister. This is, as one would say, true brotherhood and sweet friendship. To whom shall I incline the more? Caelius, to thee; for thy single devotion to us was shewn by its deeds, when the raging flame scorched my marrow. Be happy, O Caelius, be potent in love.</p>','<p class="cantohead">CI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Through many a folk and through many waters borne, I am come, brother, to thy sad grave, that I may give the last gifts to the dead, and may vainly speak to thy mute ashes, since fortune hath borne from me thyself. Ah, hapless brother, heavily snatched from me. * * * But now these gifts, which of yore, in manner ancestral handed down, are the sad gifts to the grave, accept thou, drenched with a brother\u2019s tears, and for ever, brother, hail! for ever, adieu!</p>','<p class="cantohead">CII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>If aught be committed to secret faith from a friend to one whose inner faith of soul is known, thou wilt find me to be of that sacred faith, O Cornelius, and may\u2019st deem me become an Harpocrates.</p>','<p class="cantohead">CIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Prithee, either return me my ten thousand sesterces, Silo; then be to thy content surly and boorish: or, if the money allure thee, desist I pray thee from being a pander and likewise surly and boorish.</p>','<p class="cantohead">CIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Dost deem me capable of speaking ill of my life, she who is dearer to me than are both mine eyes? I could not, nor if I could, would my love be so desperate: but thou with Tappo dost frame everything heinous.</p>','<p class="cantohead">CV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Mentula presumes the Pimplean mount to scale: the Muses with their pitchforks chuck him headlong down.</p>','<p class="cantohead">CVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>When with a comely lad a crier is seen to be, what may be thought save that he longs to sell himself.</p>','<p class="cantohead">CVII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>If what one desires and covets is ever obtained unhoped for, this is specially grateful to the soul. Wherefore is it grateful to us and far dearer than gold, that thou com\u2019st again, Lesbia, to longing me; com\u2019st yet again, long-looked for and unhoped, thou restorest thyself. O day of whiter note for us! who lives more happily than I, sole I, or who can say what greater thing than this could be hoped for in life?</p>','<p class="cantohead">CVIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>If, O Cominius, by the people\u2019s vote thy hoary age made filthy by unclean practices shall perish, forsure I doubt not but that first thy tongue, hostile to goodness, cut out, shall be given to the greedy vulture-brood, thine eyes, gouged out, shall the crows gorge down with sable maw, thine entrails [shall be flung] to the dogs, the members still remaining to the wolf.</p>','<p class="cantohead">CVIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>My joy, my life, thou declarest to me that this love of ours shall last ever between us. Great Gods! grant that she may promise truly, and say this in sincerity and from her soul, and that through all our lives we may be allowed to prolong together this bond of holy friendship.</p>','<p class="cantohead">CX.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Aufilena, honest harlots are always praised: they accept the price of what they intend to do. Thou didst promise that to me, which, being a feigned promise, proves thee unfriendly; not giving that, and often accepting, thou dost wrongfully. Either to do it frankly, or not to promise from modesty, Aufilena, was becoming thee: but to snatch the gift and bilk, proves thee worse than the greedy strumpet who prostitutes herself with every part of her body.</p>','<p class="cantohead">CXI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Aufilena, to be content to live with single mate, in married dame is praise of praises most excelling: but \u2019tis preferable to lie beneath any lover thou mayest choose, rather than to make thyself mother to thy cousins out of thy uncle.</p>','<p class="cantohead">CXII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>A mighty man thou art, Naso, yet is a man not mighty who doth stoop like thee: Naso thou art mighty&mdash;and pathic.</p>','<p class="cantohead">CXIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>In the first consulate of Pompey, two, Cinna, were wont to frequent Mucilla: now again made consul, the two remain, but thousands may be added to each unit. The seed of adultery is fecund.</p>','<p class="cantohead">CXIIII.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>With Firmian demesne not falsely is Mentula deemed rich, who has everything in it of such excellence, game preserves of every kind, fish, meadows, arable land and ferals. In vain: the yield is o\u2019ercome by the expense. Wherefore I admit the wealth, whilst everything is wanting. We may praise the demesne, but its owner is a needy man.</p>','<p class="cantohead">CXV.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Mentula has something like thirty acres of meadow land, forty under cultivation: the rest are as the sea. Why might he not o\u2019erpass Croesus in wealth, he who in one demesne possesses so much? Meadow, arable land, immense woods, and demesnes, and morasses, e\u2019en to the uttermost north and to the ocean\u2019s tide! All things great are here, yet is the owner most great beyond all; not a man, but in truth a Mentule mighty, menacing!</p>','<p class="cantohead">CXVI.</p>\n\t\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t\t<p>Oft with studious mind brought close, enquiring how I might send thee the poems of Battiades for use, that I might soften thee towards us, nor thou continually attempt to sting my head with troublesome barbs&mdash;this I see now to have been trouble and labour in vain, O Gellius, nor were our prayers to this end of any avail. Thy weapons against us we will ward off with our cloak; but, transfixed with ours, thou shalt suffer punishment.</p>']};

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// catulluscarmina/catullus.js
module.exports={bookname:'catulluscarmina',author:'Caius Valerius Catullus',translationid:"catullus",title:'The Carmina',translation:false,source:'<a href="http://www.gutenberg.org/files/20732/20732-h/20732-h.htm">Project Gutenberg</a>',translationshortname:"Catullus",translationfullname:"Caius Valerius Catullus",translationclass:"poetry",text:['<p class="title">The Carmina</p>\n\t<p class="author">Caius Valerius Catullus</p>','<p class="cantohead">I.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza">\n\t\t<p>Quoi dono lepidum novom libellum</p>\n\t\t<p>Arida modo pumice expolitum?</p>\n\t\t<p>Corneli, tibi: namque tu solebas</p>\n\t\t<p>Meas esse aliquid putare nugas,</p>\n\t\t<p>Iam tum cum ausus es unus Italorum</p>\n\t\t<p>Omne &aelig;vum tribus explicare chartis</p>\n\t\t<p>Doctis, Iuppiter, et laboriosis.</p>\n\t\t<p>Quare habe tibi quidquid hoc libelli,</p>\n\t\t<p>Qualecumque, quod o patrona virgo,</p>\n\t\t<p>Plus uno maneat perenne s&aelig;clo.</p>\n\t</div>','<p class="cantohead">II.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza">\n\t\t<p>Passer, delici&aelig; me&aelig; puell&aelig;,</p>\n\t\t<p>Quicum ludere, quem in sinu tenere,</p>\n\t\t<p>Quoi primum digitum dare adpetenti</p>\n\t\t<p>Et acris solet incitare morsus,</p>\n\t\t<p>Cum desiderio meo nitenti</p>\n\t\t<p>Carum nescioquid libet iocari</p>\n\t\t<p>Vt solaciolum sui doloris,</p>\n\t\t<p>Credo ut iam gravis acquiescat ardor:</p>\n\t\t<p>Tecum ludere sicut ipsa possem</p>\n\t\t<p>Et tristis animi levare curas!</p>\n\t\t<p class="divider">* * * * *</p>\n\t\t<p>Tam gratumst mihi quam ferunt puell&aelig;</p>\n\t\t<p>Pernici aureolum fuisse malum,</p>\n\t\t<p>Quod zonam soluit diu ligatam.</p>\n\t\t</div>','<p class="cantohead">III.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza">\n    <p>Lugete, o Veneres Cupidinesque,</p>\n    <p>Et quantumst hominum venustiorum.</p>\n    <p>Passer mortuus est me&aelig; puell&aelig;,</p>\n    <p>Passer, delici&aelig; me&aelig; puell&aelig;,</p>\n    <p>Quem plus illa oculis suis amabat:</p>\n    <p>Nam mellitus erat suamque norat</p>\n    <p>Ipsa tam bene quam puella matrem</p>\n    <p>Nec sese a gremio illius movebat,</p>\n    <p>Sed circumsiliens modo huc modo illuc</p>\n    <p>Ad solam dominam usque pipiabat.</p>\n    <p>Qui nunc it per iter tenebricosum</p>\n    <p>Illuc, unde negant redire quemquam.</p>\n    <p>At vobis male sit, mal&aelig; tenebr&aelig;</p>\n    <p>Orci, qu&aelig; omnia bella devoratis:</p>\n    <p>Tam bellum mihi passerem abstulistis.</p>\n    <p>O factum male! io miselle passer!</p>\n    <p>Tua nunc opera me&aelig; puell&aelig;</p>\n    <p>Flendo turgiduli rubent ocelli.</p>\n  </div>','<p class="cantohead">IIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Phaselus ille, quem videtis, hospites,</p>\n    <p>Ait fuisse navium celerrimus,</p>\n    <p>Neque ullius natantis impetum trabis</p>\n    <p>Nequisse pr&aelig;ter ire, sive palmulis</p>\n    <p>Opus foret volare sive linteo.</p>\n    <p>Et hoc negat minacis Adriatici</p>\n    <p>Negare litus insulasve Cycladas</p>\n    <p>Rhodumque nobilem horridamque Thraciam</p>\n    <p>Propontida trucemve Ponticum sinum,</p>\n    <p>Vbi iste post phaselus antea fuit</p>\n    <p>Comata silva: nam Cytorio in iugo</p>\n    <p>Loquente s&aelig;pe sibilum edidit coma.</p>\n    <p>Amastri Pontica et Cytore buxifer,</p>\n    <p>Tibi h&aelig;c fuisse et esse cognitissima</p>\n    <p>Ait phaselus: ultima ex origine</p>\n    <p>Tuo stetisse dicit in cacumine,</p>\n    <p>Tuo imbuisse palmulas in &aelig;quore,</p>\n    <p>Et inde tot per inpotentia freta</p>\n    <p>Erum tulisse, l&aelig;va sive dextera</p>\n    <p>Vocaret aura, sive utrumque Iuppiter</p>\n    <p>Simul secundus incidisset in pedem;</p>\n    <p>Neque ulla vota litoralibus deis</p>\n    <p>Sibi esse facta, cum veniret a marei</p>\n    <p>Novissime hunc ad usque limpidum lacum.</p>\n    <p>Sed h&aelig;c prius fuere: nunc recondita</p>\n    <p>Senet quiete seque dedicat tibi,</p>\n    <p>Gemelle Castor et gemelle Castoris.</p>\n\t</div>','<p class="cantohead">V.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Vivamus, mea Lesbia, atque amemus,</p>\n    <p>Rumoresque senum severiorum</p>\n    <p>Omnes unius &aelig;stimemus assis.</p>\n    <p>Soles occidere et redire possunt:</p>\n  \t<p>Nobis cum semel occidit brevis lux,</p>\n    <p>Nox est perpetua una dormienda.</p>\n    <p>Da mi basia mille, deinde centum,</p>\n    <p>Dein mille altera, dein secunda centum,</p>\n    <p>Deinde usque altera mille, deinde centum.</p>\n    <p>Dein, cum milia multa fecerimus,</p>\n    <p>Conturbabimus illa, ne sciamus,</p>\n    <p>Aut nequis malus invidere possit,</p>\n    <p>Cum tantum sciet esse basiorum.</p>\n\t</div>','<p class="cantohead">VI.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Flavi, delicias tuas Catullo,</p>\n    <p>Nei sint inlepid&aelig; atque inelegantes,</p>\n    <p>Velles dicere, nec tacere posses.</p>\n    <p>Verum nescioquid febriculosi</p>\n    <p>Scorti diligis: hoc pudet fateri.</p>\n    <p>Nam te non viduas iacere noctes</p>\n    <p>Nequiquam tacitum cubile clamat</p>\n    <p>Sertis ac Syrio fragrans olivo,</p>\n    <p>Pulvinusque per&aelig;que et hic et ille</p>\n    <p>Attritus, tremulique quassa lecti</p>\n    <p>Argutatio inambulatioque.</p>\n    <p>Nam nil stupra valet, nihil, tacere.</p>\n    <p>Cur? non tam latera ecfututa pandas,</p>\n    <p>Nei tu quid facias ineptiarum.</p>\n    <p>Quare quidquid habes boni malique,</p>\n    <p>Dic nobis. volo te ac tuos amores</p>\n    <p>Ad c&aelig;lum lepido vocare versu.</p>\n\t</div>','<p class="cantohead">VII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Qu&aelig;ris, quot mihi basiationes</p>\n    <p>Tu&aelig;, Lesbia, sint satis superque.</p>\n    <p>Quam magnus numerus Libyss&aelig; aren&aelig;</p>\n    <p>Lasarpiciferis iacet Cyrenis,</p>\n    <p>Oraclum Iovis inter &aelig;stuosi</p>\n    <p>Et Batti veteris sacrum sepulcrum,</p>\n    <p>Aut quam sidera multa, cum tacet nox,</p>\n    <p>Furtivos hominum vident amores,</p>\n    <p>Tam te basia multa basiare</p>\n    <p>Vesano satis et super Catullost,</p>\n    <p>Qu&aelig; nec pernumerare curiosi</p>\n    <p>Possint nec mala fascinare lingua.</p>\n\t</div>','<p class="cantohead">VIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Miser Catulle, desinas ineptire,</p>\n    <p>Et quod vides perisse perditum ducas.</p>\n    <p>Fulsere quondam candidi tibi soles,</p>\n    <p>Cum ventitabas quo puella ducebat</p>\n  \t<p>Amata nobis quantum amabitur nulla.</p>\n    <p>Ibi illa multa tum iocosa fiebant,</p>\n    <p>Qu&aelig; tu volebas nec puella nolebat.</p>\n    <p>Fulsere vere candidi tibi soles.</p>\n    <p>Nunc iam illa non vult: tu quoque, inpotens, noli</p>\n  \t<p>Nec qu&aelig; fugit sectare, nec miser vive,</p>\n    <p>Sed obstinata mente perfer, obdura.</p>\n    <p>Vale, puella. iam Catullus obdurat,</p>\n    <p>Nec te requiret nec rogabit invitam:</p>\n    <p>At tu dolebis, cum rogaberis nulla.</p>\n  \t<p>Scelesta, v&aelig; te! qu&aelig; tibi manet vita!</p>\n    <p>Quis nunc te adibit? cui videberis bella?</p>\n    <p>Quem nunc amabis? cuius esse diceris?</p>\n    <p>Quem basiabis? cui labella mordebis?</p>\n    <p>At tu, Catulle, destinatus obdura.</p>\n\t</div>','<p class="cantohead">VIIII.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Verani, omnibus e meis amicis</p>\n    <p>Antistans mihi milibus trecentis,</p>\n    <p>Venistine domum ad tuos Penates</p>\n    <p>Fratresque unanimos anumque matrem?</p>\n    <p>Venisti. o mihi nuntii beati!</p>\n    <p>Visam te incolumem audiamque Hiberum</p>\n    <p>Narrantem loca, facta, nationes,</p>\n    <p>Vt mos est tuus, adplicansque collum</p>\n    <p>Iocundum os oculosque suaviabor.</p>\n    <p>O quantumst hominum beatiorum,</p>\n    <p>Quid me l&aelig;tius est beatiusve?</p>\n\t</div>','<p class="cantohead">X.</p>\n\t<p class="cantosubhead">&nbsp;</p>\n\t<div class="stanza"><p>Varus me meus ad suos amores</p>\n    <p>Visum duxerat e foro otiosum,</p>\n    <p>Scortillum, ut mihi tum repente visumst,</p>\n    <p>Non sane inlepidum neque invenustum.</p>\n    <p>Huc ut venimus, incidere nobis</p>\n    <p>Sermones varii, in quibus, quid esset</p>\n    <p>Iam Bithynia, quo modo se haberet,</p>\n    <p>Ecquonam mihi profuisset &aelig;re.</p>\n    <p>Respondi id quod erat, nihil neque ipsis</p>\n    <p>Nec pr&aelig;toribus esse nec cohorti,</p>\n    <p>Cur quisquam caput unctius referret,</p>\n    <p>Pr&aelig;sertim quibus esset inrumator</p>\n    <p>Pr&aelig;tor, non faciens pili cohortem.</p>\n    <p>\u2018At certe tamen, inquiunt, quod illic</p>\n    <p>Natum dicitur esse, conparasti</p>\n    <p>Ad lecticam homines.\u2019 ego, ut puell&aelig;</p>\n    <p>Vnum me facerem beatiorem,</p>\n    <p>\u2018Non\u2019 inquam \u2018mihi tam fuit maligne,</p>\n    <p>Vt, provincia quod mala incidisset,</p>\n    <p>Non possem octo homines parare rectos.\u2019</p>\n    <p>At mi nullus erat nec hic neque illic,</p>\n    <p>Fractum qui veteris pedem grabati</p>\n    <p>In collo sibi collocare posset.</p>\n    <p>Hic illa, ut decuit cin&aelig;diorem,</p>\n    <p>\u2018Qu&aelig;so\u2019 inquit \u2018mihi, mi Catulle, paulum</p>\n    <p>Istos. commode enim volo ad Sarapim</p>\n    <p>Deferri.\u2019 \u2018minime\u2019 inquii puell&aelig;;</p>\n    <p class="divider">* * * * *</p>\n    <p>\u2018Istud quod modo dixeram me habere,</p>\n    <p>Fugit me ratio: meus sodalis</p>\n    <p>Cinnast Gaius, is sibi paravit.</p>\n    <p>Verum, utrum illius an mei, quid ad me?</p>\n    <p>Vtor tam bene quam mihi pararim.</p>\n    <p>Sed tu insulsa male ac molesta vivis,</p>\n    <p>Per quam non licet esse negligentem.\u2019</p>\n\t</div>','<p class="cantohead">XI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<div class="stanza">\n      <p>Furi et Aureli, comites Catulli,</p>\n      <p>Sive in extremos penetrabit Indos,</p>\n      <p>Litus ut longe resonante Eoa</p>\n      <p class="slindent4em">Tunditur unda,</p>\n      <p>Sive in Hyrcanos Arabesve molles,</p>\n      <p>Seu Sacas sagittiferosve Parthos,</p>\n      <p>Sive qua septemgeminus colorat</p>\n      <p class="slindent4em">Aequora Nilus,</p>\n      <p>Sive trans altas gradietur Alpes,</p>\n      <p>Caesaris visens monimenta magni,</p>\n      <p>Gallicum Rhenum, horribile aequor ulti-</p>\n      <p class="slindent4em">mosque Britannos,</p>\n      <p>Omnia haec, quaecumque feret voluntas</p>\n      <p>Caelitum, temptare simul parati,</p>\n      <p>Pauca nuntiate meae puellae</p>\n      <p class="slindent4em">Non bona dicta.</p>\n      <p>Cum suis vivat valeatque moechis,</p>\n      <p>Quos simul conplexa tenet trecentos,</p>\n      <p>Nullum amans vere, sed identidem omnium</p>\n      <p class="slindent4em">Ilia rumpens:</p>\n      <p>Nec meum respectet, ut ante, amorem,</p>\n      <p>Qui illius culpa cecidit velut prati</p>\n      <p>Vltimi flos, praeter eunte postquam</p>\n      <p class="slindent4em">Tactus aratrost.</p>\n    </div>','<p class="cantohead">XII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Marrucine Asini, manu sinistra</p>\n\t\t      <p>Non belle uteris in ioco atque vino:</p>\n\t\t      <p>Tollis lintea neglegentiorum.</p>\n\t\t      <p>Hoc salsum esse putas? fugit te, inepte:</p>\n\t\t      <p>Quamvis sordida res et invenustast.</p>\n\t\t      <p>Non credis mihi? crede Polioni</p>\n\t\t      <p>Fratri, qui tua furta vel talento</p>\n\t\t      <p>Mutari velit: est enim leporum</p>\n\t\t      <p>Disertus puer ac facetiarum.</p>\n\t\t      <p>Quare aut hendecasyllabos trecentos</p>\n\t\t      <p>Expecta aut mihi linteum remitte,</p>\n\t\t      <p>Quod me non movet aestimatione,</p>\n\t\t      <p>Verumst mnemosynum mei sodalis.</p>\n\t\t      <p>Nam sudaria Saetaba ex Hibereis</p>\n\t\t      <p>Miserunt mihi muneri Fabullus</p>\n\t\t      <p>Et Veranius: haec amem necessest</p>\n\t\t      <p>Vt Veraniolum meum et Fabullum.</p>\n\t\t    </div>','<p class="cantohead">XIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Cenabis bene, mi Fabulle, apud me</p>\n\t\t      <p>Paucis, si tibi di favent, diebus,</p>\n\t\t      <p>Si tecum attuleris bonam atque magnam</p>\n\t\t      <p>Cenam, non sine candida puella</p>\n\t\t      <p>Et vino et sale et omnibus cachinnis.</p>\n\t\t      <p>Haec si, inquam, attuleris, venuste noster,</p>\n\t\t      <p>Cenabis bene: nam tui Catulli</p>\n\t\t      <p>Plenus sacculus est aranearum.</p>\n\t\t      <p>Sed contra accipies meros amores</p>\n\t\t      <p>Seu quid suavius elegantiusvest:</p>\n\t\t      <p>Nam unguentum dabo, quod meae puellae</p>\n\t\t      <p>Donarunt Veneres Cupidinesque,</p>\n\t\t      <p>Quod tu cum olfacies, deos rogabis,</p>\n\t\t      <p>Totum ut te faciant, Fabulle, nasum.</p>\n\t\t    </div>','<p class="cantohead">XIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Ni te plus oculis meis amarem,</p>\n\t\t      <p>Iocundissime Calve, munere isto</p>\n\t\t      <p>Odissem te odio Vatiniano:</p>\n\t\t      <p>Nam quid feci ego quidve sum locutus,</p>\n\t\t      <p>Cur me tot male perderes poetis?</p>\n\t\t      <p>Isti di mala multa dent clienti,</p>\n\t\t      <p>Qui tantum tibi misit inpiorum.</p>\n\t\t      <p>Quod si, ut suspicor, hoc novum ac repertum</p>\n\t\t      <p>Munus dat tibi Sulla litterator,</p>\n\t\t      <p>Non est mi male, sed bene ac beate,</p>\n\t\t      <p>Quod non dispereunt tui labores.</p>\n\t\t      <p>Di magni, horribilem et sacrum libellum</p>\n\t\t      <p>Quem tu scilicet ad tuum Catullum</p>\n\t\t      <p>Misti, continuo ut die periret,</p>\n\t\t      <p>Saturnalibus, optimo dierum!</p>\n\t\t      <p>Non non hoc tibi, salse, sic abibit:</p>\n\t\t      <p>Nam, si luxerit, ad librariorum</p>\n\t\t      <p>Curram scrinia, Caesios, Aquinos,</p>\n\t\t      <p>Suffenum, omnia colligam venena,</p>\n\t\t      <p>Ac te his suppliciis remunerabor.</p>\n\t\t      <p>Vos hinc interea (valete) abite</p>\n\t\t      <p>Illuc, unde malum pedem attulistis,</p>\n\t\t      <p>Saecli incommoda, pessimi poetae.</p>\n\t\t    </div>\n\t\t\t\t<p class="cantohead">XIIII <em>b</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Siqui forte mearum ineptiarum</p>\n\t\t      <p>Lectores eritis manusque vestras</p>\n\t\t      <p>Non horrebitis admovere nobis,</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t    </div>','<p class="cantohead">XV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Commendo tibi me ac meos amores,</p>\n\t\t      <p>Aureli. veniam peto pudentem,</p>\n\t\t      <p>Vt, si quicquam animo tuo cupisti,</p>\n\t\t      <p>Quod castum expeteres et integellum,</p>\n\t\t      <p>Conserves puerum mihi pudice,</p>\n\t\t      <p>Non dico a populo: nihil veremur</p>\n\t\t      <p>Istos, qui in platea modo huc modo illuc</p>\n\t\t      <p>In re praetereunt sua occupati:</p>\n\t\t      <p>Verum a te metuo tuoque pene</p>\n\t\t      <p>Infesto pueris bonis malisque.</p>\n\t\t      <p>Quem tu qua lubet, ut iubet, moveto,</p>\n\t\t      <p>Quantum vis, ubi erit foris, paratum:</p>\n\t\t      <p>Hunc unum excipio, ut puto, pudenter.</p>\n\t\t      <p>Quod si te mala mens furorque vecors</p>\n\t\t      <p>In tantam inpulerit, sceleste, culpam,</p>\n\t\t      <p>Vt nostrum insidiis caput lacessas,</p>\n\t\t      <p>A tum te miserum malique fati,</p>\n\t\t      <p>Quem attractis pedibus patente porta</p>\n\t\t      <p>Percurrent raphanique mugilesque.</p>\n\t\t    </div>','<p class="cantohead">XVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Pedicabo ego vos et inrumabo,</p>\n\t\t      <p>Aureli pathice et cinaede Furi,</p>\n\t\t      <p>Qui me ex versiculis meis putastis,</p>\n\t\t      <p>Quod sunt molliculi, parum pudicum.</p>\n\t\t      <p>Nam castum esse decet pium poetam</p>\n\t\t      <p>Ipsum, versiculos nihil necessest,</p>\n\t\t      <p>Qui tum denique habent salem ac leporem,</p>\n\t\t      <p>Si sunt molliculi ac parum pudici</p>\n\t\t      <p>Et quod pruriat incitare possunt,</p>\n\t\t      <p>Non dico pueris, sed his pilosis,</p>\n\t\t      <p>Qui duros nequeunt movere lumbos.</p>\n\t\t      <p>Vos, quom milia multa basiorum</p>\n\t\t      <p>Legistis, male me marem putatis?</p>\n\t\t      <p>Pedicabo ego vos et inrumabo.</p>\n\t\t    </div>','<p class="cantohead">XVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>O Colonia, quae cupis ponte ludere longo,</p>\n\t\t      <p>Et salire paratum habes, sed vereris inepta</p>\n\t\t      <p>Crura ponticuli assulis stantis in redivivis,</p>\n\t\t      <p>Ne supinus eat cavaque in palude recumbat;</p>\n\t\t      <p>Sic tibi bonus ex tua pons libidine fiat,</p>\n\t\t      <p>In quo vel Salisubsili sacra suscipiantur:</p>\n\t\t      <p>Munus hoc mihi maximi da, Colonia, risus.</p>\n\t\t      <p>Quendam municipem meum de tuo volo ponte</p>\n\t\t      <p>Ire praecipitem in lutum per caputque pedesque,</p>\n\t\t      <p>Verum totius ut lacus putidaeque paludis</p>\n\t\t      <p>Lividissima maximeque est profunda vorago.</p>\n\t\t      <p>Insulsissimus est homo, nec sapit pueri instar</p>\n\t\t      <p>Bimuli tremula patris dormientis in ulna.</p>\n\t\t      <p>Quoi cum sit viridissimo nupta flore puella</p>\n\t\t      <p>(Et puella tenellulo delicatior haedo,</p>\n\t\t      <p>Adservanda nigerrimis diligentius uvis),</p>\n\t\t      <p>Ludere hanc sinit ut lubet, nec pili facit uni,</p>\n\t\t      <p>Nec se sublevat ex sua parte, sed velut alnus</p>\n\t\t      <p>In fossa Liguri iacet suppernata securi,</p>\n\t\t      <p>Tantundem omnia sentiens quam si nulla sit usquam,</p>\n\t\t      <p>Talis iste meus stupor nil videt, nihil audit,</p>\n\t\t      <p>Ipse qui sit, utrum sit an non sit, id quoque nescit.</p>\n\t\t      <p>Nunc eum volo de tuo ponte mittere pronum,</p>\n\t\t      <p>Si pote stolidum repente excitare veternum</p>\n\t\t      <p>Et supinum animum in gravi derelinquere caeno,</p>\n\t\t      <p>Ferream ut soleam tenaci in voragine mula.</p>\n\t\t    </div>','<p class="cantohead">XVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Hunc lucum tibi dedico, consecroque, Priape,</p>\n\t\t      <p>Qua domus tua Lampsaci est, quaque silva, Priape,</p>\n\t\t      <p>Nam te praecipue in suis urbibus colit ora</p>\n\t\t      <p>Hellespontia, caeteris ostreosior oris.</p>\n\t\t    </div>','<p class="cantohead">XVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Hunc ego, juvenes, locum, villulamque palustrem,</p>\n\t\t      <p>Tectam vimine junceo, caricisque maniplis,</p>\n\t\t      <p>Quercus arida, rustica conformata securi,</p>\n\t\t      <p>Nunc tuor: magis, et magis ut beata quotannis.</p>\n\t\t      <p>Hujus nam Domini colunt me, Deumque salutant,</p>\n\t\t      <p>Pauperis tugurii pater, filiusque coloni:</p>\n\t\t      <p>Alter, assidua colens diligentia, ut herba</p>\n\t\t      <p>Dumosa, asperaque a meo sit remota sacello:</p>\n\t\t      <p>Alter, parva ferens manu semper munera larga.</p>\n\t\t      <p>Florido mihi ponitur picta vere corolla</p>\n\t\t      <p>Primitu\u2019, et tenera virens spica mollis arista:</p>\n\t\t      <p>Luteae violae mihi, luteumque papaver,</p>\n\t\t      <p>Pallentesque cucurbitae, et suaveolentia mala,</p>\n\t\t      <p>Vva pampinea rubens educata sub umbra.</p>\n\t\t      <p>Sanguine hanc etiam mihi (sed tacebitis) aram</p>\n\t\t      <p>Barbatus linit hirculus, cornipesque capella:</p>\n\t\t      <p>Pro queis omnia honoribus haec necesse Priapo</p>\n\t\t      <p>Praestare, et domini hortulum, vineamque tueri.</p>\n\t\t      <p>Quare hinc, o pueri, malas abstinete rapinas.</p>\n\t\t      <p>Vicinus prope dives est, negligensque Priapus.</p>\n\t\t      <p>Inde sumite: semita haec deinde vos feret ipsa.</p>\n\t\t    </div>','<p class="cantohead">XX.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Ego haec ego arte fabricata rustica,</p>\n\t\t      <p>Ego arida, o viator, ecce populus</p>\n\t\t      <p>Agellulum hunc, sinistra, tute quem vides,</p>\n\t\t      <p>Herique villulam, hortulumque pauperis</p>\n\t\t      <p>Tuor, malasque furis arceo manus.</p>\n\t\t      <p>Mihi corolla picta vero ponitur:</p>\n\t\t      <p>Mihi rubens arista sole fervido:</p>\n\t\t      <p>Mihi virente dulcis uva pampino:</p>\n\t\t      <p>Mihique glauca duro oliva frigore.</p>\n\t\t      <p>Meis capella delicata pascuis</p>\n\t\t      <p>In urbem adulta lacte portat ubera:</p>\n\t\t      <p>Meisque pinguis agnus ex ovilibus</p>\n\t\t      <p>Gravem domum remittit aere dexteram:</p>\n\t\t      <p>Tenerque, matre mugiente, vaccula</p>\n\t\t      <p>Deum profundit ante templa sanguinem.</p>\n\t\t      <p>Proin\u2019, viator, hunc Deum vereberis,</p>\n\t\t      <p>Manumque sorsum habebis hoc tibi expedit.</p>\n\t\t      <p>Parata namque crux, sine arte mentula.</p>\n\t\t      <p>Velim pol, inquis: at pol ecce, villicus</p>\n\t\t      <p>Venit: valente cui revulsa brachio</p>\n\t\t      <p>Fit ista mentula apta clava dexterae.</p>\n\t\t    </div>','<p class="cantohead">XXI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Aureli, pater essuritionum,</p>\n\t\t      <p>Non harum modo, sed quot aut fuerunt</p>\n\t\t      <p>Aut sunt aut aliis erunt in annis,</p>\n\t\t      <p>Pedicare cupis meos amores.</p>\n\t\t      <p>Nec clam: nam simul es, iocaris una,</p>\n\t\t      <p>Haeres ad latus omnia experiris.</p>\n\t\t      <p>Frustra: nam insidias mihi instruentem</p>\n\t\t      <p>Tangem te prior inrumatione.</p>\n\t\t      <p>Atque id si faceres satur, tacerem:</p>\n\t\t      <p>Nunc ipsum id doleo, quod essurire,</p>\n\t\t      <p>A me me, puer et sitire discet.</p>\n\t\t      <p>Quare desine, dum licet pudico,</p>\n\t\t      <p>Ne finem facias, sed inrumatus.</p>\n\t\t    </div>','<p class="cantohead">XXII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Suffenus iste, Vare, quem probe nosti,</p>\n\t\t      <p>Homost venustus et dicax et urbanus,</p>\n\t\t      <p>Idemque longe plurimos facit versus.</p>\n\t\t      <p>Puto esse ego illi milia aut decem aut plura</p>\n\t\t      <p>Perscripta, nec sic ut fit in palimpseston</p>\n\t\t      <p>Relata: chartae regiae, novei libri,</p>\n\t\t      <p>Novei umbilici, lora rubra, membrana</p>\n\t\t      <p>Derecta plumbo, et pumice omnia aequata.</p>\n\t\t      <p>Haec cum legas tu, bellus ille et urbanus</p>\n\t\t      <p>Suffenus unus caprimulgus aut fossor</p>\n\t\t      <p>Rursus videtur; tantum abhorret ac mutat.</p>\n\t\t      <p>Hoc quid putemus esse? qui modo scurra</p>\n\t\t      <p>Aut siquid hac re scitius videbatur,</p>\n\t\t      <p>Idem infacetost infacetior rure,</p>\n\t\t      <p>Simul poemata attigit, neque idem umquam</p>\n\t\t      <p>Aequest beatus ac poema cum scribit:</p>\n\t\t      <p>Tam gaudet in se tamque se ipse miratur.</p>\n\t\t      <p>Nimirum idem omnes fallimur, nequest quisquam,</p>\n\t\t      <p>Quem non in aliqua re videre Suffenum</p>\n\t\t      <p>Possis. suus cuique attributus est error:</p>\n\t\t      <p>Sed non videmus, manticae quod in tergost.</p>\n\t\t    </div>','<p class="cantohead">XXIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Furei, quoi neque servos est neque arca</p>\n\t\t      <p>Nec cimex neque araneus neque ignis,</p>\n\t\t      <p>Verumst et pater et noverca, quorum</p>\n\t\t      <p>Dentes vel silicem comesse possunt,</p>\n\t\t      <p>Est pulchre tibi cum tuo parente</p>\n\t\t      <p>Et cum coniuge lignea parentis.</p>\n\t\t      <p>Nec mirum: bene nam valetis omnes,</p>\n\t\t      <p>Pulchre concoquitis, nihil timetis,</p>\n\t\t      <p>Non incendia, non graves ruinas,</p>\n\t\t      <p>Non furta inpia, non dolos veneni,</p>\n\t\t      <p>Non casus alios periculorum.</p>\n\t\t      <p>Atqui corpora sicciora cornu</p>\n\t\t      <p>Aut siquid magis aridumst habetis</p>\n\t\t      <p>Sole et frigore et essuritione.</p>\n\t\t      <p>Quare non tibi sit bene ac beate?</p>\n\t\t      <p>A te sudor abest, abest saliva,</p>\n\t\t      <p>Mucusque et mala pituita nasi.</p>\n\t\t      <p>Hanc ad munditiem adde mundiorem,</p>\n\t\t      <p>Quod culus tibi purior salillost,</p>\n\t\t      <p>Nec toto decies cacas in anno,</p>\n\t\t      <p>Atque id durius est faba et lapillis;</p>\n\t\t      <p>Quod tu si manibus teras fricesque,</p>\n\t\t      <p>Non umquam digitum inquinare possis.</p>\n\t\t      <p>Haec tu commoda tam beata, Furi,</p>\n\t\t      <p>Noli spernere nec putare parvi,</p>\n\t\t      <p>Et sestertia quae soles precari</p>\n\t\t      <p>Centum desine: nam sat es beatus.</p>\n\t\t    </div>','<p class="cantohead">XXIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>O qui flosculus es Iuventiorum,</p>\n\t\t      <p>Non horum modo, sed quot aut fuerunt</p>\n\t\t      <p>Aut posthac aliis erunt in annis,</p>\n\t\t      <p>Mallem divitias Midae dedisses</p>\n\t\t      <p>Isti, quoi neque servus est neque arca,</p>\n\t\t      <p>Quam sic te sineres ab illo amari.</p>\n\t\t      <p>\u2018Qui? non est homo bellus?\u2019 inquies. est:</p>\n\t\t      <p>Sed bello huic neque servos est neque arca.</p>\n\t\t      <p>Hoc tu quam lubet abice elevaque:</p>\n\t\t      <p>Nec servom tamen ille habet neque arcam.</p>\n\t\t    </div>','<p class="cantohead">XXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Cinaede Thalle, mollior cuniculi capillo</p>\n\t\t      <p>Vel anseris medullula vel imula oricilla</p>\n\t\t      <p>Vel pene languido senis situque araneoso,</p>\n\t\t      <p>Idemque Thalle turbida rapacior procella,</p>\n\t\t      <p>Cum diva munerarios ostendit oscitantes,</p>\n\t\t      <p>Remitte pallium mihi meum, quod involasti,</p>\n\t\t      <p>Sudariumque Saetabum catagraphosque Thynos,</p>\n\t\t      <p>Inepte, quae palam soles habere tamquam avita.</p>\n\t\t      <p>Quae nunc tuis ab unguibus reglutina et remitte,</p>\n\t\t      <p>Ne laneum latusculum manusque mollicellas</p>\n\t\t      <p>Inusta turpiter tibi flagella conscribillent,</p>\n\t\t      <p>Et insolenter aestues velut minuta magno</p>\n\t\t      <p>Deprensa navis in mari vesaniente vento.</p>\n\t\t    </div>','<p class="cantohead">XXVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Furi, villula nostra non ad Austri</p>\n\t\t      <p>Flatus oppositast neque ad Favoni</p>\n\t\t      <p>Nec saevi Boreae aut Apeliotae,</p>\n\t\t      <p>Verum ad milia quindecim et ducentos.</p>\n\t\t      <p>O ventum horribilem atque pestilentem!</p>\n\t\t    </div>','<p class="cantohead">XXVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Minister vetuli puer Falerni</p>\n\t\t      <p>Inger mi calices amariores,</p>\n\t\t      <p>Vt lex Postumiae iubet magistrae,</p>\n\t\t      <p>Ebriosa acina ebriosioris.</p>\n\t\t      <p>At vos quo lubet hinc abite, lymphae</p>\n\t\t      <p>Vini pernicies, et ad severos</p>\n\t\t      <p>Migrate: hic merus est Thyonianus.</p>\n\t\t    </div>','<p class="cantohead">XXVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Pisonis comites, cohors inanis</p>\n\t\t      <p>Aptis sarcinulis et expeditis,</p>\n\t\t      <p>Verani optime tuque mi Fabulle,</p>\n\t\t      <p>Quid rerum geritis? satisne cum isto</p>\n\t\t      <p>Vappa frigoraque et famem tulistis?</p>\n\t\t      <p>Ecquidnam in tabulis patet lucelli</p>\n\t\t      <p>Expensum, ut mihi, qui meum secutus</p>\n\t\t      <p>Praetorem refero datum lucello</p>\n\t\t      <p>\u2018O Memmi, bene me ac diu supinum</p>\n\t\t      <p>Tota ista trabe lentus inrumasti.\u2019</p>\n\t\t      <p>Sed, quantum video, pari fuistis</p>\n\t\t      <p>Casu: nam nihilo minore verpa</p>\n\t\t      <p>Farti estis. pete nobiles amicos.</p>\n\t\t      <p>At vobis mala multa di deaeque</p>\n\t\t      <p>Dent, opprobria Romulei Remique.</p>\n\t\t    </div>','<p class="cantohead">XXVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quis hoc potest videre, quis potest pati,</p>\n\t\t      <p>Nisi inpudicus et vorax et aleo,</p>\n\t\t      <p>Mamurram habere quod Comata Gallia</p>\n\t\t      <p>Habebat ante et ultima Britannia?</p>\n\t\t      <p>Cinaede Romule, haec videbis et feres?</p>\n\t\t      <p><em>Es inpudicus et vorax et aleo.</em></p>\n\t\t      <p>Et ille nunc superbus et superfluens</p>\n\t\t      <p>Perambulabit omnium cubilia</p>\n\t\t      <p>Vt albulus columbus aut Adoneus?</p>\n\t\t      <p>Cinaede Romule, haec videbis et feres?</p>\n\t\t      <p>Es inpudicus et vorax et aleo.</p>\n\t\t      <p>Eone nomine, imperator unice,</p>\n\t\t      <p>Fuisti in ultima occidentis insula,</p>\n\t\t      <p>Vt ista vostra defututa Mentula</p>\n\t\t      <p>Ducenties comesset aut trecenties?</p>\n\t\t      <p>Quid est alid sinistra liberalitas?</p>\n\t\t      <p>Parum expatravit an parum eluatus est?</p>\n\t\t      <p>Paterna prima lancinata sunt bona:</p>\n\t\t      <p>Secunda praeda Pontica: inde tertia</p>\n\t\t      <p>Hibera, quam scit amnis aurifer Tagus.</p>\n\t\t      <p>Timentne Galliae hunc, timent Britanniae?</p>\n\t\t      <p>Quid hunc malum fovetis? aut quid hic potest,</p>\n\t\t      <p>Nisi uncta devorare patrimonia?</p>\n\t\t      <p>Eone nomine urbis, o potissimei</p>\n\t\t      <p>Socer generque, perdidistis omnia?</p>\n\t\t    </div>','<p class="cantohead">XXX.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Alfene inmemor atque unanimis false sodalibus</p>\n\t\t      <p>Iam te nil miseret, dure, tui dulcis amiculi?</p>\n\t\t    </div>\n\t\t    <div class="stanza">\n\t\t      <p>Iam me prodere, iam non dubitas fallere, perfide?</p>\n\t\t      <p>Nec facta inpia fallacum hominum caelicolis placent:</p>\n\t\t    </div>\n\t\t    <div class="stanza">\n\t\t      <p>Quod tu neglegis, ac me miserum deseris in malis.</p>\n\t\t      <p>Eheu quid faciant, dic, homines, cuive habeant fidem?</p>\n\t\t    </div>\n\t\t    <div class="stanza">\n\t\t      <p>Certe tute iubebas animam tradere, inique, me</p>\n\t\t      <p>Inducens in amorem, quasi tuta omnia mi forent.</p>\n\t\t    </div>\n\t\t    <div class="stanza">\n\t\t      <p>Idem nunc retrahis te ac tua dicta omnia factaque</p>\n\t\t      <p>Ventos inrita ferre ac nebulas aerias sinis.</p>\n\t\t    </div>\n\t\t    <div class="stanza">\n\t\t      <p>Si tu oblitus es, at di meminerunt, meminit Fides,</p>\n\t\t      <p>Quae te ut paeniteat postmodo facti faciet tui.</p>\n\t\t    </div>','<p class="cantohead">XXXI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Paeninsularum, Sirmio, insularumque</p>\n\t\t      <p>Ocelle, quascumque in liquentibus stagnis</p>\n\t\t      <p>Marique vasto fert uterque Neptunus,</p>\n\t\t      <p>Quam te libenter quamque laetus inviso,</p>\n\t\t      <p>Vix mi ipse credens Thyniam atque Bithynos</p>\n\t\t      <p>Liquisse campos et videre te in tuto.</p>\n\t\t      <p>O quid solutis est beatius curis,</p>\n\t\t      <p>Cum mens onus reponit, ac peregrino</p>\n\t\t      <p>Labore fessi venimus larem ad nostrum</p>\n\t\t      <p>Desideratoque acquiescimus lecto.</p>\n\t\t      <p>Hoc est, quod unumst pro laboribus tantis.</p>\n\t\t      <p>Salve, o venusta Sirmio, atque ero gaude:</p>\n\t\t      <p>Gaudete vosque, o Libuae lacus undae:</p>\n\t\t      <p>Ridete, quidquid est domi cachinnorum.</p>\n\t\t    </div>','<p class="cantohead">XXXII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Amabo, mea dulcis Ipsithilla,</p>\n\t\t      <p>Meae deliciae, mei lepores,</p>\n\t\t      <p>Iube ad te veniam meridiatum.</p>\n\t\t      <p>Et si iusseris illud, adiuvato,</p>\n\t\t      <p>Nequis liminis obseret tabellam,</p>\n\t\t      <p>Neu tibi lubeat foras abire,</p>\n\t\t      <p>Sed domi maneas paresque nobis</p>\n\t\t      <p>Novem continuas fututiones.</p>\n\t\t      <p>Verum, siquid ages, statim iubeto:</p>\n\t\t      <p>Nam pransus iaceo et satur supinus</p>\n\t\t      <p>Pertundo tunicamque palliumque.</p>\n\t\t    </div>','<p class="cantohead">XXXIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>O furum optime balneariorum</p>\n\t\t      <p>Vibenni pater, et cinaede fili,</p>\n\t\t      <p>(Nam dextra pater inquinatiore,</p>\n\t\t      <p>Culo filius est voraciore)</p>\n\t\t      <p>Cur non exilium malasque in oras</p>\n\t\t      <p>Itis, quandoquidem patris rapinae</p>\n\t\t      <p>Notae sunt populo, et natis pilosas,</p>\n\t\t      <p>Fili, non potes asse venditare.</p>\n\t\t    </div>','<p class="cantohead">XXXIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Dianae sumus in fide</p>\n\t\t      <p>Puellae et pueri integri:</p>\n\t\t      <p><em>Dianam pueri integri</em></p>\n\t\t      <p class="slindent">Puellaeque canamus.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>O Latonia, maximi</p>\n\t\t      <p>Magna progenies Iovis,</p>\n\t\t      <p>Quam mater prope Deliam</p>\n\t\t      <p class="slindent">Deposivit olivam,</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Montium domina ut fores</p>\n\t\t      <p>Silvarumque virentium</p>\n\t\t      <p>Saltuumque reconditorum</p>\n\t\t      <p class="slindent">Amniumque sonantum.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Tu Lucina dolentibus</p>\n\t\t      <p>Iuno dicta puerperis,</p>\n\t\t      <p>Tu potens Trivia et notho\u2019s</p>\n\t\t      <p class="slindent">Dicta lumine Luna.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Tu cursu, dea, menstruo</p>\n\t\t      <p>Metiens iter annuom</p>\n\t\t      <p>Rustica agricolae bonis</p>\n\t\t      <p class="slindent">Tecta frugibus exples.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Sis quocumque tibi placet</p>\n\t\t      <p>Sancta nomine, Romulique,</p>\n\t\t      <p>Antique ut solita\u2019s, bona</p>\n\t\t      <p class="slindent">Sospites ope gentem.</p>\n\t\t    </div>','<p class="cantohead">XXXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Poetae tenero, meo sodali</p>\n\t\t      <p>Velim Caecilio, papyre, dicas,</p>\n\t\t      <p>Veronam veniat, Novi relinquens</p>\n\t\t      <p>Comi moenia Lariumque litus:</p>\n\t\t      <p>Nam quasdam volo cogitationes</p>\n\t\t      <p>Amici accipiat sui meique.</p>\n\t\t      <p>Quare, si sapiet, viam vorabit,</p>\n\t\t      <p>Quamvis candida milies puella</p>\n\t\t      <p>Euntem revocet manusque collo</p>\n\t\t      <p>Ambas iniciens roget morari,</p>\n\t\t      <p>Quae nunc, si mihi vera nuntiantur,</p>\n\t\t      <p>Illum deperit inpotente amore:</p>\n\t\t      <p>Nam quo tempore legit incohatam</p>\n\t\t      <p>Dindymi dominam, ex eo misellae</p>\n\t\t      <p>Ignes interiorem edunt medullam.</p>\n\t\t      <p>Ignosco tibi, Sapphica puella</p>\n\t\t      <p>Musa doctior: est enim venuste</p>\n\t\t      <p>Magna Caecilio incohata mater.</p>\n\t\t    </div>','<p class="cantohead">XXXVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Annales Volusi, cacata charta,</p>\n\t\t      <p>Votum solvite pro mea puella:</p>\n\t\t      <p>Nam sanctae Veneri Cupidinique</p>\n\t\t      <p>Vovit, si sibi restitutus essem</p>\n\t\t      <p>Desissemque truces vibrare iambos,</p>\n\t\t      <p>Electissima pessimi poetae</p>\n\t\t      <p>Scripta tardipedi deo daturam</p>\n\t\t      <p>Infelicibus ustulanda lignis.</p>\n\t\t      <p>Et haec pessima se puella vidit</p>\n\t\t      <p>Iocose lepide vovere divis.</p>\n\t\t      <p>Nunc, o caeruleo creata ponto,</p>\n\t\t      <p>Quae sanctum Idalium Vriosque portus</p>\n\t\t      <p>Quaeque Ancona Cnidumque harundinosam</p>\n\t\t      <p>Colis quaeque Amathunta quaeque Golgos</p>\n\t\t      <p>Quaeque Durrachium Adriae tabernam,</p>\n\t\t      <p>Acceptum face redditumque votum,</p>\n\t\t      <p>Si non inlepidum neque invenustumst.</p>\n\t\t      <p>At vos interea venite in ignem,</p>\n\t\t      <p>Pleni ruris et inficetiarum</p>\n\t\t      <p>Annales Volusi, cacata charta.</p>\n\t\t    </div>','<p class="cantohead">XXXVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Salax taberna vosque contubernales,</p>\n\t\t      <p>A pileatis nona fratribus pila,</p>\n\t\t      <p>Solis putatis esse mentulas vobis,</p>\n\t\t      <p>Solis licere, quidquid est puellarum,</p>\n\t\t      <p>Confutuere et putare ceteros hircos?</p>\n\t\t      <p>An, continenter quod sedetis insulsi</p>\n\t\t      <p>Centum an ducenti, non putatis ausurum</p>\n\t\t      <p>Me una ducentos inrumare sessores?</p>\n\t\t      <p>Atqui putate: namque totius vobis</p>\n\t\t      <p>Frontem tabernae scorpionibus scribam.</p>\n\t\t      <p>Puella nam mi, quae meo sinu fugit,</p>\n\t\t      <p>Amata tantum quantum amabitur nulla,</p>\n\t\t      <p>Pro qua mihi sunt magna bella pugnata,</p>\n\t\t      <p>Consedit istic. hanc boni beatique</p>\n\t\t      <p>Omnes amatis, et quidem, quod indignumst,</p>\n\t\t      <p>Omnes pusilli et semitarii moechi;</p>\n\t\t      <p>Tu praeter omnes une de capillatis,</p>\n\t\t      <p>Cuniculosae Celtiberiae fili</p>\n\t\t      <p>Egnati, opaca quem bonum facit barba</p>\n\t\t      <p>Et dens Hibera defricatus urina.</p>\n\t\t    </div>','<p class="cantohead">XXXVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Malest, Cornifici, tuo Catullo,</p>\n\t\t      <p>Malest, me hercule, et est laboriose,</p>\n\t\t      <p>Et magis magis in dies et horas.</p>\n\t\t      <p>Quem tu, quod minimum facillimumquest,</p>\n\t\t      <p>Qua solatus es adlocutione?</p>\n\t\t      <p>Irascor tibi. sic meos amores?</p>\n\t\t      <p>Paulum quid lubet adlocutionis,</p>\n\t\t      <p>Maestius lacrimis Simonideis.</p>\n\t\t    </div>','<p class="cantohead">XXXVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Egnatius, quod candidos habet dentes,</p>\n\t\t      <p>Renidet usque quaque. sei ad rei ventumst</p>\n\t\t      <p>Subsellium, cum orator excitat fletum,</p>\n\t\t      <p>Renidet ille. sei ad pii rogum fili</p>\n\t\t      <p>Lugetur, orba cum flet unicum mater,</p>\n\t\t      <p>Renidet ille. quidquid est, ubicumquest,</p>\n\t\t      <p>Quodcumque agit, renidet. hunc habet morbum,</p>\n\t\t      <p>Neque elegantem, ut arbitror, neque urbanum.</p>\n\t\t      <p>Quare monendum test mihi, bone Egnati.</p>\n\t\t      <p>Si urbanus esses aut Sabinus aut Tiburs</p>\n\t\t      <p>Aut fartus Vmber aut obesus Etruscus</p>\n\t\t      <p>Aut Lanuinus ater atque dentatus</p>\n\t\t      <p>Aut Transpadanus, ut meos quoque attingam,</p>\n\t\t      <p>Aut quilubet, qui puriter lavit dentes,</p>\n\t\t      <p>Tamen renidere usque quaque te nollem:</p>\n\t\t      <p>Nam risu inepto res ineptior nullast.</p>\n\t\t      <p>Nunc Celtiber es: Celtiberia in terra,</p>\n\t\t      <p>Quod quisque minxit, hoc sibi solet mane</p>\n\t\t      <p>Dentem atque russam defricare gingivam,</p>\n\t\t      <p>Vt quo iste vester expolitior dens est,</p>\n\t\t      <p>Hoc te amplius bibisse praedicet loti.</p>\n\t\t    </div>','<p class="cantohead">XXXX.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quaenam te mala mens, miselle Ravide,</p>\n\t\t      <p>Agit praecipitem in meos iambos?</p>\n\t\t      <p>Quis deus tibi non bene advocatus</p>\n\t\t      <p>Vecordem parat excitare rixam?</p>\n\t\t      <p>An ut pervenias in ora vulgi?</p>\n\t\t      <p>Quid vis? qua lubet esse notus optas?</p>\n\t\t      <p>Eris, quandoquidem meos amores</p>\n\t\t      <p>Cum longa voluisti amare poena.</p>\n\t\t    </div>','<p class="cantohead">XXXXI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Ametina puella defututa</p>\n\t\t      <p>Tota milia me decem poposcit,</p>\n\t\t      <p>Ista turpiculo puella naso,</p>\n\t\t      <p>Decoctoris amica Formiani.</p>\n\t\t      <p>Propinqui, quibus est puella curae,</p>\n\t\t      <p>Amicos medicosque convocate:</p>\n\t\t      <p>Non est sana puella. nec rogate,</p>\n\t\t      <p>Qualis sit: solet esse imaginosa.</p>\n\t\t    </div>','<p class="cantohead">XXXXII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Adeste, hendecasyllabi, quot estis</p>\n\t\t      <p>Omnes undique, quotquot estis omnes.</p>\n\t\t      <p>Iocum me putat esse moecha turpis</p>\n\t\t      <p>Et negat mihi nostra reddituram</p>\n\t\t      <p>Pugillaria, si pati potestis.</p>\n\t\t      <p>Persequamur eam, et reflagitemus.</p>\n\t\t      <p>Quae sit, quaeritis. illa, quam videtis</p>\n\t\t      <p>Turpe incedere, mimice ac moleste</p>\n\t\t      <p>Ridentem catuli ore Gallicani.</p>\n\t\t      <p>Circumsistite eam, et reflagitate,</p>\n\t\t      <p>\u2018Moecha putida, redde codicillos,</p>\n\t\t      <p>Redde, putida moecha, codicillos.\u2019</p>\n\t\t      <p>Non assis facis? o lutum, lupanar,</p>\n\t\t      <p>Aut si perditius potest quid esse.</p>\n\t\t      <p>Sed non est tamen hoc satis putandum.</p>\n\t\t      <p>Quod si non aliud potest, ruborem</p>\n\t\t      <p>Ferreo canis exprimamus ore.</p>\n\t\t      <p>Conclamate iterum altiore voce</p>\n\t\t      <p>\u2018Moecha putida, redde codicillos,</p>\n\t\t      <p>Redde, putida moecha, codicillos.\u2019</p>\n\t\t      <p>Sed nil proficimus, nihil movetur.</p>\n\t\t      <p>Mutandast ratio modusque vobis,</p>\n\t\t      <p>Siquid proficere amplius potestis,</p>\n\t\t      <p>\u2018Pudica et proba, redde codicillos.\u2019</p>\n\t\t    </div>','<p class="cantohead">XXXXIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Salve, nec minimo puella naso</p>\n\t\t      <p>Nec bello pede nec nigris ocellis</p>\n\t\t      <p>Nec longis digitis nec ore sicco</p>\n\t\t      <p>Nec sane nimis elegante lingua,</p>\n\t\t      <p>Decoctoris amica Formiani.</p>\n\t\t      <p>Ten provincia narrat esse bellam?</p>\n\t\t      <p>Tecum Lesbia nostra conparatur?</p>\n\t\t      <p>O saeclum insapiens et infacetum!</p>\n\t\t    </div>','<p class="cantohead">XXXXIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>O funde noster seu Sabine seu Tiburs,</p>\n\t\t      <p>(Nam te esse Tiburtem autumant, quibus non est</p>\n\t\t      <p>Cordi Catullum laedere: at quibus cordist,</p>\n\t\t      <p>Quovis Sabinum pignore esse contendunt)</p>\n\t\t      <p>Sed seu Sabine sive verius Tiburs,</p>\n\t\t      <p>Fui libenter in tua suburbana</p>\n\t\t      <p>Villa malamque pectore expuli tussim,</p>\n\t\t      <p>Non inmerenti quam mihi meus venter,</p>\n\t\t      <p>Dum sumptuosas adpeto, dedit, cenas.</p>\n\t\t      <p>Nam, Sestianus dum volo esse conviva,</p>\n\t\t      <p>Orationem in Antium petitorem</p>\n\t\t      <p>Plenam veneni et pestilentiae legi.</p>\n\t\t      <p>Hic me gravido frigida et frequens tussis</p>\n\t\t      <p>Quassavit usque dum in tuum sinum fugi</p>\n\t\t      <p>Et me recuravi otioque et urtica.</p>\n\t\t      <p>Quare refectus maximas tibi grates</p>\n\t\t      <p>Ago, meum quod non es ulta peccatum.</p>\n\t\t      <p>Nec deprecor iam, si nefaria scripta</p>\n\t\t      <p>Sesti recepso, quin gravidinem et tussim</p>\n\t\t      <p>Non mi, sed ipsi Sestio ferat frigus,</p>\n\t\t      <p>Qui tum vocat me, cum malum librum legi.</p>\n\t\t    </div>','<p class="cantohead">XXXXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Acmen Septumius suos amores</p>\n\t\t      <p>Tenens in gremio \u2018mea\u2019 inquit \u2018Acme,</p>\n\t\t      <p>Ni te perdite amo atque amare porro</p>\n\t\t      <p>Omnes sum adsidue paratus annos</p>\n\t\t      <p>Quantum qui pote plurimum perire,</p>\n\t\t      <p>Solus in Libya Indiave tosta</p>\n\t\t      <p>Caesio veniam obvius leoni.\u2019</p>\n\t\t      <p>Hoc ut dixit, Amor, sinistra ut ante,</p>\n\t\t      <p>Dextra sternuit adprobationem.</p>\n\t\t      <p>At Acme leviter caput reflectens</p>\n\t\t      <p>Et dulcis pueri ebrios ocellos</p>\n\t\t      <p>Illo purpureo ore saviata</p>\n\t\t      <p>\u2018Sic\u2019 inquit \u2018mea vita Septumille,</p>\n\t\t      <p>Huic uni domino usque serviamus,</p>\n\t\t      <p>Vt multo mihi maior acriorque</p>\n\t\t      <p>Ignis mollibus ardet in medullis.\u2019</p>\n\t\t      <p>Hoc ut dixit, Amor, sinistra ut ante,</p>\n\t\t      <p>Dextra sternuit adprobationem.</p>\n\t\t      <p>Nunc ab auspicio bono profecti</p>\n\t\t      <p>Mutuis animis amant amantur.</p>\n\t\t      <p>Vnam Septumius misellus Acmen</p>\n\t\t      <p>Mavolt quam Syrias Britanniasque:</p>\n\t\t      <p>Vno in Septumio fidelis Acme</p>\n\t\t      <p>Facit delicias libidinesque.</p>\n\t\t      <p>Quis ullos homines beatiores</p>\n\t\t      <p>Vidit, quis Venerem auspicatiorem?</p>\n\t\t    </div>','<p class="cantohead">XXXXVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Iam ver egelidos refert tepores,</p>\n\t\t      <p>Iam caeli furor aequinoctialis</p>\n\t\t      <p>Iocundis Zephyri silescit aureis.</p>\n\t\t      <p>Linquantur Phrygii, Catulle, campi</p>\n\t\t      <p>Nicaeaeque ager uber aestuosae:</p>\n\t\t      <p>Ad claras Asiae volemus urbes.</p>\n\t\t      <p>Iam mens praetrepidans avet vagari,</p>\n\t\t      <p>Iam laeti studio pedes vigescunt.</p>\n\t\t      <p>O dulces comitum valete coetus,</p>\n\t\t      <p>Longe quos simul a domo profectos</p>\n\t\t      <p>Diversae variae viae reportant.</p>\n\t\t    </div>','<p class="cantohead">XXXXVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Porci et Socration, duae sinistrae</p>\n\t\t      <p>Pisonis, scabies famesque mundi</p>\n\t\t      <p>Vos Veraniolo meo et Fabullo</p>\n\t\t      <p>Verpus praeposuit Priapus ille?</p>\n\t\t      <p>Vos convivia lauta sumptuose</p>\n\t\t      <p>De die facitis? mei sodales</p>\n\t\t      <p>Quaerunt in trivio vocationes?</p>\n\t\t    </div>','<p class="cantohead">XXXXVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Mellitos oculos tuos, Iuventi,</p>\n\t\t      <p>Siquis me sinat usque basiare,</p>\n\t\t      <p>Vsque ad milia basiem trecenta,</p>\n\t\t      <p>Nec umquam videar satur futurus,</p>\n\t\t      <p>Non si densior aridis aristis</p>\n\t\t      <p>Sit nostrae seges osculationis.</p>\n\t\t    </div>','<p class="cantohead">XXXXVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Disertissime Romuli nepotum,</p>\n\t\t      <p>Quot sunt quotque fuere, Marce Tulli,</p>\n\t\t      <p>Quotque post aliis erunt in annis,</p>\n\t\t      <p>Gratias tibi maximas Catullus</p>\n\t\t      <p>Agit pessimus omnium poeta,</p>\n\t\t      <p>Tanto pessimus omnium poeta</p>\n\t\t      <p>Quanto tu optimus omnium patronus.</p>\n\t\t    </div>','<p class="cantohead">L.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Hesterno, Licini, die otiosi</p>\n\t\t      <p>Multum lusimus in meis tabellis,</p>\n\t\t      <p>Vt convenerat esse delicatos.</p>\n\t\t      <p>Scribens versiculos uterque nostrum</p>\n\t\t      <p>Ludebat numero modo hoc modo illoc,</p>\n\t\t      <p>Reddens mutua per iocum atque vinum.</p>\n\t\t      <p>Atque illinc abii tuo lepore</p>\n\t\t      <p>Incensus, Licini, facetiisque,</p>\n\t\t      <p>Vt nec me miserum cibus iuvaret,</p>\n\t\t      <p>Nec somnus tegeret quiete ocellos,</p>\n\t\t      <p>Sed toto indomitus furore lecto</p>\n\t\t      <p>Versarer cupiens videre lucem,</p>\n\t\t      <p>Vt tecum loquerer, simulque ut essem.</p>\n\t\t      <p>At defessa labore membra postquam</p>\n\t\t      <p>Semimortua lectulo iacebant,</p>\n\t\t      <p>Hoc, iocunde, tibi poema feci,</p>\n\t\t      <p>Ex quo perspiceres meum dolorem.</p>\n\t\t      <p>Nunc audax cave sis, precesque nostras,</p>\n\t\t      <p>Oramus, cave despuas, ocelle,</p>\n\t\t      <p>Ne poenas Nemesis reposcat a te.</p>\n\t\t      <p>Est vemens dea: laedere hanc caveto.</p>\n\t\t    </div>','<p class="cantohead">LI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Ille mi par esse deo videtur,</p>\n\t\t      <p>Ille, si fas est, superare divos,</p>\n\t\t      <p>Qui sedens adversus identidem te</p>\n\t\t      <p class="slindent4em">Spectat et audit</p>\n\t\t      <p>Dulce ridentem, misero quod omnis</p>\n\t\t      <p>Eripit sensus mihi: nam simul te,</p>\n\t\t      <p>Lesbia, aspexi, nihil est super mi</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Lingua sed torpet, tenuis sub artus</p>\n\t\t      <p>Flamma demanat, sonitu suopte</p>\n\t\t      <p>Tintinant aures geminae, teguntur</p>\n\t\t      <p class="slindent4em">Lumina nocte.</p>\n\t\t    </div>\n\t\t    <p class="cantohead">LI <em>b</em>.</p>\n\t\t    <div class="stanza">\n\t\t      <p>Otium, Catulle, tibi molestumst:</p>\n\t\t      <p>Otio exultas nimiumque gestis.</p>\n\t\t      <p>Otium et reges prius et beatas</p>\n\t\t      <p class="slindent">Perdidit urbes.</p>\n\t\t    </div>','<p class="cantohead">LII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quid est, Catulle? quid moraris emori?</p>\n\t\t      <p>Sella in curuli struma Nonius sedet,</p>\n\t\t      <p>Per consulatum peierat Vatinius:</p>\n\t\t      <p>Quid est, Catulle? quid moraris emori?</p>\n\t\t    </div>','<p class="cantohead">LIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Risi nescioquem modo e corona,</p>\n\t\t      <p>Qui, cum mirifice Vatiniana</p>\n\t\t      <p>Meus crimina Calvos explicasset,</p>\n\t\t      <p>Admirans ait haec manusque tollens,</p>\n\t\t      <p>\u2018Di magni, salaputium disertum!\u2019</p>\n\t\t    </div>','<p class="cantohead">LIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Othonis caput oppidost pusillum</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Neri rustica semilauta crura,</p>\n\t\t      <p>Subtile et leve peditum Libonis.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Si non omnia displicere vellem</p>\n\t\t      <p>Tibi et Fuficio seni recocte</p>\n\t\t    </div>\n\t\t\t\t<p class="cantohead">LIIII <em>b</em>.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Irascere iterum meis iambis</p>\n\t\t      <p>Inmerentibus, unice imperator.</p>\n\t\t    </div>','<p class="cantohead">LV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Oramus, si forte non molestumst,</p>\n\t\t      <p>Demostres, ubi sint tuae tenebrae.</p>\n\t\t      <p>Te campo quaesivimus minore,</p>\n\t\t      <p>Te in circo, te in omnibus libellis,</p>\n\t\t      <p>Te in templo summi Iovis sacrato.</p>\n\t\t      <p>In Magni simul ambulatione</p>\n\t\t      <p>Femellas omnes, amice, prendi,</p>\n\t\t      <p>Quas vultu vidi tamen serenas.</p>\n\t\t      <p>A, vel te sic ipse flagitabam,</p>\n\t\t      <p>\u2018Camerium mihi, pessimae puellae.\u2019</p>\n\t\t      <p>Quaedam inquit, nudum sinum reducens,</p>\n\t\t      <p>\u2018En heic in roseis latet papillis.\u2019</p>\n\t\t      <p>Sed te iam ferre Herculei labos est.</p>\n\t\t      <p>Non custos si fingar ille Cretum,</p>\n\t\t      <p>Non si Pegaseo ferar volatu,</p>\n\t\t      <p>Non Ladas ego pinnipesve Perseus,</p>\n\t\t      <p>Non Rhesi nivea citaque biga:</p>\n\t\t      <p>Adde huc plumipedes volatilesque,</p>\n\t\t      <p>Ventorumque simul require cursum:</p>\n\t\t      <p>Quos cunctos, Cameri, mihi dicares,</p>\n\t\t      <p>Defessus tamen omnibus medullis</p>\n\t\t      <p>Et multis langoribus peresus</p>\n\t\t      <p>Essem te mihi, amice, quaeritando.</p>\n\t\t      <p>Tanto ten fastu negas, amice?</p>\n\t\t      <p>Dic nobis ubi sis futurus, ede</p>\n\t\t      <p>Audacter, conmitte, crede lucei.</p>\n\t\t      <p>Num te lacteolae tenent puellae?</p>\n\t\t      <p>Si linguam clauso tenes in ore,</p>\n\t\t      <p>Fructus proicies amoris omnes:</p>\n\t\t      <p>Verbosa gaudet Venus loquella.</p>\n\t\t      <p>Vel si vis, licet obseres palatum,</p>\n\t\t      <p>Dum vostri sim particeps amoris.</p>\n\t\t    </div>','<p class="cantohead">LVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Orem ridiculam, Cato, et iocosam</p>\n\t\t      <p>Dignamque auribus et tuo cachinno.</p>\n\t\t      <p>Ride, quidquid amas, Cato, Catullum:</p>\n\t\t      <p>Res est ridicula et nimis iocosa.</p>\n\t\t      <p>Deprendi modo pupulum puellae</p>\n\t\t      <p>Trusantem: hunc ego, si placet Dionae,</p>\n\t\t      <p>Protelo rigida mea cecidi.</p>\n\t\t    </div>','<p class="cantohead">LVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Pulcre convenit inprobis cinaedis,</p>\n\t\t      <p>Mamurrae pathicoque Caesarique.</p>\n\t\t      <p>Nec mirum: maculae pares utrisque,</p>\n\t\t      <p>Vrbana altera et illa Formiana,</p>\n\t\t      <p>Inpressae resident nec eluentur:</p>\n\t\t      <p>Morbosi pariter, gemelli utrique</p>\n\t\t      <p>Vno in lectulo, erudituli ambo,</p>\n\t\t      <p>Non hic quam ille magis vorax adulter,</p>\n\t\t      <p>Rivales sociei puellularum.</p>\n\t\t      <p>Pulcre convenit inprobis cinaedis.</p>\n\t\t    </div>','<p class="cantohead">LVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Caeli, Lesbia nostra, Lesbia illa,</p>\n\t\t      <p>Illa Lesbia, quam Catullus unam</p>\n\t\t      <p>Plus quam se atque suos amavit omnes,</p>\n\t\t      <p>Nunc in quadriviis et angiportis</p>\n\t\t      <p>Glubit magnanimos Remi nepotes.</p>\n\t\t    </div>','<p class="cantohead">LVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Bononiensis Rufa Rufulum fellat,</p>\n\t\t      <p>Vxor Meneni, saepe quam in sepulcretis</p>\n\t\t      <p>Vidistis ipso rapere de rogo cenam,</p>\n\t\t      <p>Cum devolutum ex igne prosequens panem</p>\n\t\t      <p>Ab semiraso tunderetur ustore.</p>\n\t\t    </div>','<p class="cantohead">LX.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Num te leaena montibus Libystinis</p>\n\t\t      <p>Aut Scylla latrans infima inguinum parte</p>\n\t\t      <p>Tam mente dura procreavit ac taetra,</p>\n\t\t      <p>Vt supplicis vocem in novissimo casu</p>\n\t\t      <p>Contemptam haberes a! nimis fero corde?</p>\n\t\t    </div>','<p class="cantohead">LXI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Collis o Heliconii</p>\n\t\t      <p class="slindent">Cultor, Vraniae genus,</p>\n\t\t      <p class="slindent">Qui rapis teneram ad virum</p>\n\t\t      <p>Virginem, o Hymenaee Hymen,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee,</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Cinge tempora floribus</p>\n\t\t      <p class="slindent">Suave olentis amaraci,</p>\n\t\t      <p class="slindent">Flammeum cape, laetus huc</p>\n\t\t      <p>Huc veni niveo gerens</p>\n\t\t      <p class="slindent">Luteum pede soccum,</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Excitusque hilari die</p>\n\t\t      <p class="slindent">Nuptialia concinens</p>\n\t\t      <p class="slindent">Voce carmina tinnula</p>\n\t\t      <p>Pelle humum pedibus, manu</p>\n\t\t      <p class="slindent">Pineam quate taedam.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Namque Vinia Manlio,</p>\n\t\t      <p class="slindent">Qualis Idalium colens</p>\n\t\t      <p class="slindent">Venit ad Phrygium Venus</p>\n\t\t      <p>Iudicem, bona cum bona</p>\n\t\t      <p class="slindent">Nubet alite virgo,</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Floridis velut enitens</p>\n\t\t      <p class="slindent">Myrtus Asia ramulis,</p>\n\t\t      <p class="slindent">Quos Hamadryades deae</p>\n\t\t      <p>Ludicrum sibi rosido</p>\n\t\t      <p class="slindent">Nutriunt umore.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Quare age huc aditum ferens</p>\n\t\t      <p class="slindent">Perge linquere Thespiae</p>\n\t\t      <p class="slindent">Rupis Aonios specus,</p>\n\t\t      <p>Nympha quos super inrigat</p>\n\t\t      <p class="slindent">Frigerans Aganippe,</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Ac domum dominam voca</p>\n\t\t      <p class="slindent">Coniugis cupidam novi,</p>\n\t\t      <p class="slindent">Mentem amore revinciens,</p>\n\t\t      <p>Vt tenax hedera huc et huc</p>\n\t\t      <p class="slindent">Arborem inplicat errans.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Vosque item simul, integrae</p>\n\t\t      <p class="slindent">Virgines, quibus advenit</p>\n\t\t      <p class="slindent">Par dies, agite in modum</p>\n\t\t      <p>Dicite \u2018o Hymenaee Hymen,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee,\u2019</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Vt lubentius, audiens</p>\n\t\t      <p class="slindent">Se citarier ad suom</p>\n\t\t      <p class="slindent">Munus, huc aditum ferat</p>\n\t\t      <p>Dux bonae Veneris, boni</p>\n\t\t      <p class="slindent">Coniugator amoris.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Quis deus magis anxiis</p>\n\t\t      <p class="slindent">Est petendus amantibus?</p>\n\t\t      <p class="slindent">Quem colent homines magis</p>\n\t\t      <p>Caelitum? o Hymenaee Hymen,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Te suis tremulus parens</p>\n\t\t      <p class="slindent">Invocat, tibi virgines</p>\n\t\t      <p class="slindent">Zonula soluunt sinus,</p>\n\t\t      <p>Te timens cupida novos</p>\n\t\t      <p class="slindent">Captat aure maritus.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Tu fero iuveni in manus</p>\n\t\t      <p class="slindent">Floridam ipse puellulam</p>\n\t\t      <p class="slindent">Dedis a gremio suae</p>\n\t\t      <p>Matris, o Hymenaee Hymen,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Nil potest sine te Venus,</p>\n\t\t      <p class="slindent">Fama quod bona conprobet,</p>\n\t\t      <p class="slindent">Commodi capere: at potest</p>\n\t\t      <p>Te volente. quis huic deo</p>\n\t\t      <p class="slindent">Conpararier ausit?</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Nulla quit sine te domus</p>\n\t\t      <p class="slindent">Liberos dare, nec parens</p>\n\t\t      <p class="slindent">Stirpe cingier: at potest</p>\n\t\t      <p>Te volente. quis huic deo</p>\n\t\t      <p class="slindent">Conpararier ausit?</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Quae tuis careat sacris,</p>\n\t\t      <p class="slindent">Non queat dare praesides</p>\n\t\t      <p class="slindent">Terra finibus: at queat</p>\n\t\t      <p>Te volente. quis huic deo</p>\n\t\t      <p class="slindent">Conpararier ausit?</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Claustra pandite ianuae,</p>\n\t\t      <p class="slindent">Virgo ades. viden ut faces</p>\n\t\t      <p class="slindent">Splendidas quatiunt comas?</p>\n\t\t      <p>Tardet ingenuos pudor:</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Quem tamen magis audiens</p>\n\t\t      <p class="slindent">Flet, quod ire necesse est.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Flere desine. non tibi, A-</p>\n\t\t      <p class="slindent">runculeia, periculumst,</p>\n\t\t      <p class="slindent">Nequa femina pulchrior</p>\n\t\t      <p>Clarum ab Oceano diem</p>\n\t\t      <p class="slindent">Viderit venientem.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Talis in vario solet</p>\n\t\t      <p class="slindent">Divitis domini hortulo</p>\n\t\t      <p class="slindent">Stare flos hyacinthinus.</p>\n\t\t      <p>Sed moraris, abit dies:</p>\n\t\t      <p class="slindent"><em>Prodeas, nova nupta.</em></p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Prodeas, nova nupta, si</p>\n\t\t      <p class="slindent">Iam videtur, et audias</p>\n\t\t      <p class="slindent">Nostra verba. vide ut faces</p>\n\t\t      <p>Aureas quatiunt comas:</p>\n\t\t      <p class="slindent">Prodeas, nova nupta.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Non tuos levis in mala</p>\n\t\t      <p class="slindent">Deditus vir adultera</p>\n\t\t      <p class="slindent">Probra turpia persequens</p>\n\t\t      <p>A tuis teneris volet</p>\n\t\t      <p class="slindent">Secubare papillis,</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Lenta quin velut adsitas</p>\n\t\t      <p class="slindent">Vitis inplicat arbores,</p>\n\t\t      <p class="slindent">Inplicabitur in tuom</p>\n\t\t      <p>Conplexum. sed abit dies:</p>\n\t\t      <p class="slindent">Prodeas, nova nupta.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>O cubile, quod omnibus</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p class="slindent">Candido pede lecti,</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Quae tuo veniunt ero,</p>\n\t\t      <p class="slindent">Quanta gaudia, quae vaga</p>\n\t\t      <p class="slindent">Nocte, quae medio die</p>\n\t\t      <p>Gaudeat! sed abit dies:</p>\n\t\t      <p class="slindent">Prodeas, nova nupta.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Tollite, o pueri, faces:</p>\n\t\t      <p class="slindent">Flammeum video venire.</p>\n\t\t      <p class="slindent">Ite, concinite in modum</p>\n\t\t      <p>\u2018O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.\u2019</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Ne diu taceat procax</p>\n\t\t      <p class="slindent">Fescennina iocatio,</p>\n\t\t      <p class="slindent">Nec nuces pueris neget</p>\n\t\t      <p>Desertum domini audiens</p>\n\t\t      <p class="slindent">Concubinus amorem.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Da nuces pueris, iners</p>\n\t\t      <p class="slindent">Concubine: satis diu</p>\n\t\t      <p class="slindent">Lusisti nucibus: lubet</p>\n\t\t      <p>Iam servire Talasio.</p>\n\t\t      <p class="slindent">Concubine, nuces da.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Sordebant tibi vilicae,</p>\n\t\t      <p class="slindent">Concubine, hodie atque heri:</p>\n\t\t      <p class="slindent">Nunc tuom cinerarius</p>\n\t\t      <p>Tondet os. miser a miser</p>\n\t\t      <p class="slindent">Concubine, nuces da.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Diceris male te a tuis</p>\n\t\t      <p class="slindent">Vnguentate glabris marite</p>\n\t\t      <p class="slindent">Abstinere: sed abstine.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Scimus haec tibi quae licent</p>\n\t\t      <p class="slindent">Sola cognita: sed marito</p>\n\t\t      <p class="slindent">Ista non eadem licent.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Nupta, tu quoque, quae tuos</p>\n\t\t      <p class="slindent">Vir petet, cave ne neges,</p>\n\t\t      <p class="slindent">Ni petitum aliunde eat.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>En tibi domus ut potens</p>\n\t\t      <p class="slindent">Et beata viri tui,</p>\n\t\t      <p class="slindent">Quae tibi sine fine erit</p>\n\t\t      <p>(O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee),</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Vsque dum tremulum movens</p>\n\t\t      <p class="slindent">Cana tempus anilitas</p>\n\t\t      <p class="slindent">Omnia omnibus adnuit.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Transfer omine cum bono</p>\n\t\t      <p class="slindent">Limen aureolos pedes,</p>\n\t\t      <p class="slindent">Rasilemque subi forem.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Aspice, intus ut accubans</p>\n\t\t      <p class="slindent">Vir tuos Tyrio in toro</p>\n\t\t      <p class="slindent">Totus inmineat tibi.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Illi non minus ac tibi</p>\n\t\t      <p class="slindent">Pectore uritur intimo</p>\n\t\t      <p class="slindent">Flamma, sed penite magis.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Mitte brachiolum teres,</p>\n\t\t      <p class="slindent">Praetextate, puellulae:</p>\n\t\t      <p class="slindent">Iam cubile adeat viri.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Vos bonae senibus viris</p>\n\t\t      <p class="slindent">Cognitae bene feminae,</p>\n\t\t      <p class="slindent">Collocate puellulam.</p>\n\t\t      <p>O Hymen Hymenaee io,</p>\n\t\t      <p class="slindent">O Hymen Hymenaee.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Iam licet venias, marite:</p>\n\t\t      <p class="slindent">Vxor in thalamo tibist</p>\n\t\t      <p class="slindent">Ore floridulo nitens,</p>\n\t\t      <p>Alba parthenice velut</p>\n\t\t      <p class="slindent">Luteumve papaver.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>At, marite, (ita me iuvent</p>\n\t\t      <p class="slindent">Caelites) nihilo minus</p>\n\t\t      <p class="slindent">Pulcher es, neque te Venus</p>\n\t\t      <p>Neglegit. sed abit dies:</p>\n\t\t      <p class="slindent">Perge, ne remorare.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Non diu remoratus es,</p>\n\t\t      <p class="slindent">Iam venis. bona te Venus</p>\n\t\t      <p class="slindent">Iuverit, quoniam palam</p>\n\t\t      <p>Quod cupis capis et bonum</p>\n\t\t      <p class="slindent">Non abscondis amorem.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Ille pulveris Africei</p>\n\t\t      <p class="slindent">Siderumque micantium</p>\n\t\t      <p class="slindent">Subducat numerum prius,</p>\n\t\t      <p>Qui vostri numerare volt</p>\n\t\t      <p class="slindent">Multa milia ludei.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Ludite ut lubet, et brevi</p>\n\t\t      <p class="slindent">Liberos date. non decet</p>\n\t\t      <p class="slindent">Tam vetus sine liberis</p>\n\t\t      <p>Nomen esse, sed indidem</p>\n\t\t      <p class="slindent">Semper ingenerari.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Torquatus volo parvolus</p>\n\t\t      <p class="slindent">Matris e gremio suae</p>\n\t\t      <p class="slindent">Porrigens teneras manus</p>\n\t\t      <p>Dulce rideat ad patrem</p>\n\t\t      <p class="slindent">Semhiante labello.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Sit suo similis patri</p>\n\t\t      <p class="slindent">Manlio et facile inscieis</p>\n\t\t      <p class="slindent">Noscitetur ab omnibus</p>\n\t\t      <p>Et pudicitiam suae</p>\n\t\t      <p class="slindent">Matris indicet ore.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Talis illius a bona</p>\n\t\t      <p class="slindent">Matre laus genus adprobet,</p>\n\t\t      <p class="slindent">Qualis unica ab optima</p>\n\t\t      <p>Matre Telemacho manet</p>\n\t\t      <p class="slindent">Fama Penelopeo.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Claudite ostia, virgines:</p>\n\t\t      <p class="slindent">Lusimus satis. at, bonei</p>\n\t\t      <p class="slindent">Coniuges, bene vivite et</p>\n\t\t      <p>Munere adsiduo valentem</p>\n\t\t      <p class="slindent">Exercete inventam.</p>\n\t\t    </div>','<p class="cantohead">LXII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Vesper adest, iuvenes, consurgite: Vesper Olympo</p>\n\t\t      <p>Expectata diu vix tandem lumina tollit.</p>\n\t\t      <p>Surgere iam tempus, iam pingues linquere mensas,</p>\n\t\t      <p>Iam veniet virgo, iam dicetur Hymenaeus.</p>\n\t\t      <p class="slindent">Hymen o Hymenaee, Hymen ades o Hymenaee!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Cernitis, innuptae, iuvenes? consurgite contra:</p>\n\t\t      <p>Nimirum Oetaeos ostendit noctifer ignes.</p>\n\t\t      <p>Sic certest; viden ut perniciter exiluere?</p>\n\t\t      <p>Non temere exiluere, canent quod vincere par est.</p>\n\t\t      <p class="slindent">Hymen o Hymenaee, Hymen ades o Hymenaee!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Non facilis nobis, aequales, palma paratast,</p>\n\t\t      <p>Adspicite, innuptae secum ut meditata requirunt.</p>\n\t\t      <p>Non frustra meditantur, habent memorabile quod sit.</p>\n\t\t      <p>Nec mirum, penitus quae tota mente laborent.</p>\n\t\t      <p>Nos alio mentes, alio divisimus aures:</p>\n\t\t      <p>Iure igitur vincemur, amat victoria curam.</p>\n\t\t      <p>Quare nunc animos saltem convertite vestros,</p>\n\t\t      <p>Dicere iam incipient, iam respondere decebit.</p>\n\t\t      <p class="slindent">Hymen o Hymenaee, Hymen ades o Hymenaee!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Hespere, qui caelo fertur crudelior ignis?</p>\n\t\t      <p>Qui natam possis conplexu avellere matris,</p>\n\t\t      <p>Conplexu matris retinentem avellere natam</p>\n\t\t      <p>Et iuveni ardenti castam donare puellam.</p>\n\t\t      <p>Quid faciunt hostes capta crudelius urbe?</p>\n\t\t      <p class="slindent">Hymen o Hymenaee, Hymen ades o Hymenaee!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Hespere, qui caelo lucet iocundior ignis?</p>\n\t\t      <p>Qui desponsa tua firmes conubia flamma,</p>\n\t\t      <p>Quae pepigere viri, pepigerunt ante parentes</p>\n\t\t      <p>Nec iunxere prius quam se tuus extulit ardor.</p>\n\t\t      <p>Quid datur a divis felici optatius hora?</p>\n\t\t      <p class="slindent">Hymen o Hymenaee, Hymen ades o Hymenaee!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Hesperus e nobis, aequales, abstulit unam</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p class="slindent"><em>Hymen o Hymenaee, Hymen ades o Hymenaee</em>!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Namque tuo adventu vigilat custodia semper.</p>\n\t\t      <p>Nocte latent fures, quos idem saepe revertens,</p>\n\t\t      <p>Hespere, mutato conprendis nomine Eous.</p>\n\t\t      <p>At libet innuptis ficto te carpere questu.</p>\n\t\t      <p>Quid tum, si carpunt, tacita quem mente requirunt?</p>\n\t\t      <p class="slindent">Hymen o Hymenaee, Hymen ades o Hymenaee!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Vt flos in saeptis secretus nascitur hortis,</p>\n\t\t      <p>Ignotus pecori, nullo convolsus aratro,</p>\n\t\t      <p>Quem mulcent aurae, firmat sol, educat imber</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Multi illum pueri, multae optavere puellae:</p>\n\t\t      <p>Idem cum tenui carptus defloruit ungui,</p>\n\t\t      <p>Nulli illum pueri, nullae optavere puellae:</p>\n\t\t      <p>Sic virgo, dum intacta manet, dum cara suis est;</p>\n\t\t      <p>Cum castum amisit polluto corpore florem,</p>\n\t\t      <p>Nec pueris iocunda manet, nec cara puellis.</p>\n\t\t      <p class="slindent">Hymen o Hymenaee, Hymen ades o Hymenaee!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Vt vidua in nudo vitis quae nascitur arvo</p>\n\t\t      <p>Numquam se extollit, numquam mitem educat uvam,</p>\n\t\t      <p>Sed tenerum prono deflectens pondere corpus</p>\n\t\t      <p>Iam iam contingit summum radice flagellum;</p>\n\t\t      <p>Hanc nulli agricolae, nulli coluere bubulci:</p>\n\t\t      <p>At si forte eademst ulmo coniuncta marito,</p>\n\t\t      <p>Multi illam agricolae, multi coluere bubulci:</p>\n\t\t      <p>Sic virgo dum intacta manet, dum inculta senescit;</p>\n\t\t      <p>Cum par conubium maturo tempore adeptast,</p>\n\t\t      <p>Cara viro magis et minus est invisa parenti.</p>\n\t\t      <p class="slindent"><em>Hymen o Hymenaee, Hymen ades o Hymenaee</em>!</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>At tu ne pugna cum tali coniuge virgo.</p>\n\t\t      <p>Non aequomst pugnare, pater cui tradidit ipse,</p>\n\t\t      <p>Ipse pater cum matre, quibus parere necessest.</p>\n\t\t      <p>Virginitas non tota tuast, ex parte parentumst,</p>\n\t\t      <p>Tertia pars patrist, pars est data tertia matri,</p>\n\t\t      <p>Tertia sola tuast: noli pugnare duobus,</p>\n\t\t      <p>Qui genero sua iura simul cum dote dederunt.</p>\n\t\t      <p class="slindent">Hymen o Hymenaee, Hymen ades o Hymenaee!</p>\n\t\t    </div>','<p class="cantohead">LXIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Super alta vectus Attis celeri rate maria</p>\n\t\t      <p>Phrygium ut nemus citato cupide pede tetigit</p>\n\t\t      <p>Adiitque opaca, silvis redimita loca deae,</p>\n\t\t      <p>Stimulatus ibi furenti rabie, vagus animis,</p>\n\t\t      <p>Devolsit ilei acuto sibi pondera silice.</p>\n\t\t      <p>Itaque ut relicta sensit sibi membra sine viro,</p>\n\t\t      <p>Etiam recente terrae sola sanguine maculans</p>\n\t\t      <p>Niveis citata cepit manibus leve typanum,</p>\n\t\t      <p>Typanum, tuom Cybebe, tua, mater, initia,</p>\n\t\t      <p>Quatiensque terga taurei teneris cava digitis</p>\n\t\t      <p>Canere haec suis adortast tremebunda comitibus.</p>\n\t\t      <p>\u2018Agite ite ad alta, Gallae, Cybeles nemora simul,</p>\n\t\t      <p>Simul ite, Dindymenae dominae vaga pecora,</p>\n\t\t      <p>Aliena quae petentes velut exules loca</p>\n\t\t      <p>Sectam meam executae duce me mihi comites</p>\n\t\t      <p>Rabidum salum tulistis truculentaque pelage</p>\n\t\t      <p>Et corpus evirastis Veneris nimio odio,</p>\n\t\t      <p>Hilarate erae citatis erroribus animum.</p>\n\t\t      <p>Mora tarda mente cedat: simul ite, sequimini</p>\n\t\t      <p>Phrygiam ad domum Cybebes, Phrygia ad nemora deae,</p>\n\t\t      <p>Vbi cymbalum sonat vox, ubi tympana reboant,</p>\n\t\t      <p>Tibicen ubi canit Phryx curvo grave calamo,</p>\n\t\t      <p>Vbi capita Maenades vi iaciunt ederigerae,</p>\n\t\t      <p>Vbi sacra sancta acutis ululatibus agitant,</p>\n\t\t      <p>Vbi suevit illa divae volitare vaga cohors:</p>\n\t\t      <p>Quo nos decet citatis celerare tripudiis.\u2019</p>\n\t\t      <p>Simul haec comitibus Attis cecinit notha mulier,</p>\n\t\t      <p>Thiasus repente linguis trepidantibus ululat,</p>\n\t\t      <p>Leve tympanum remugit, cava cymbala recrepant,</p>\n\t\t      <p>Viridem citus adit Idam properante pede chorus.</p>\n\t\t      <p>Furibunda simul anhelans vaga vadit, animam agens,</p>\n\t\t      <p>Comitata tympano Attis per opaca nemora dux,</p>\n\t\t      <p>Veluti iuvenca vitans onus indomita iugi:</p>\n\t\t      <p>Rapidae ducem sequuntur Gallae properipedem.</p>\n\t\t      <p>Itaque ut domum Cybebes tetigere lassulae,</p>\n\t\t      <p>Nimio e labore somnum capiunt sine Cerere.</p>\n\t\t      <p>Piger his labante langore oculos sopor operit:</p>\n\t\t      <p>Abit in quiete molli rabidus furor animi.</p>\n\t\t      <p>Sed ubi oris aurei Sol radiantibus oculis</p>\n\t\t      <p>Lustravit aethera album, sola dura, mare ferum,</p>\n\t\t      <p>Pepulitque noctis umbras vegetis sonipedibus,</p>\n\t\t      <p>Ibi Somnus excitam Attin fugiens citus abiit:</p>\n\t\t      <p>Trepidante eum recepit dea Pasithea sinu.</p>\n\t\t      <p>Ita de quiete molli rapida sine rabie</p>\n\t\t      <p>Simul ipsa pectore Attis sua facta recoluit,</p>\n\t\t      <p>Liquidaque mente vidit sine queis ubique foret,</p>\n\t\t      <p>Animo aestuante rusum reditum ad vada tetulit.</p>\n\t\t      <p>Ibi maria vasta visens lacrimantibus oculis,</p>\n\t\t      <p>Patriam allocuta maestast ita voce miseriter.</p>\n\t\t      <p>\u2018Patria o mei creatrix, patria o mea genetrix,</p>\n\t\t      <p>Ego quam miser relinquens, dominos ut erifugae</p>\n\t\t      <p>Famuli solent, ad Idae tetuli nemora pedem,</p>\n\t\t      <p>Vt aput nivem et ferarum gelida stabula forem</p>\n\t\t      <p>Et earum operta adirem furibunda latibula?</p>\n\t\t      <p>Vbinam aut quibus locis te positam, patria, reor?</p>\n\t\t      <p>Cupit ipsa pupula ad te sibi dirigere aciem,</p>\n\t\t      <p>Rabie fera carens dum breve tempus animus est.</p>\n\t\t      <p>Egone a mea remota haec ferar in nemora domo?</p>\n\t\t      <p>Patria, bonis, amicis, genitoribus abero?</p>\n\t\t      <p>Abero foro, palaestra, stadio et guminasiis?</p>\n\t\t      <p>Miser a miser, querendumst etiam atque etiam, anime.</p>\n\t\t      <p>Quod enim genus figuraest, ego non quod habuerim?</p>\n\t\t      <p>Ego mulier, ego adolescens, ego ephebus, ego puer,</p>\n\t\t      <p>Ego guminasi fui flos, ego eram decus olei:</p>\n\t\t      <p>Mihi ianuae frequentes, mihi limina tepida,</p>\n\t\t      <p>Mihi floridis corollis redimita domus erat,</p>\n\t\t      <p>Linquendum ubi esset orto mihi sole cubiculum.</p>\n\t\t      <p>Ego nunc deum ministra et Cybeles famula ferar?</p>\n\t\t      <p>Ego Maenas, ego mei pars, ego vir sterilis ero?</p>\n\t\t      <p>Ego viridis algida Idae nive amicta loca colam?</p>\n\t\t      <p>Ego vitam agam sub altis Phrygiae columinibus,</p>\n\t\t      <p>Vbi cerva silvicultrix, ubi aper nemorivagus?</p>\n\t\t      <p>Iam iam dolet quod egi, iam iamque paenitet.\u2019</p>\n\t\t      <p>Roseis ut huic labellis sonitus celer abiit,</p>\n\t\t      <p>Geminas deorum ad aures nova nuntia referens,</p>\n\t\t      <p>Ibi iuncta iuga resolvens Cybele leonibus</p>\n\t\t      <p>Laevumque pecoris hostem stimulans ita loquitur.</p>\n\t\t      <p>\u2018Agedum\u2019 inquit \u2018age ferox i, fac ut hunc furor <em>agitet</em>,</p>\n\t\t      <p>Fac uti furoris ictu reditum in nemora ferat,</p>\n\t\t      <p>Mea libere nimis qui fugere imperia cupit.</p>\n\t\t      <p>Age caede terga cauda, tua verbera patere,</p>\n\t\t      <p>Fac cuncta mugienti fremitu loca retonent,</p>\n\t\t      <p>Rutilam ferox torosa cervice quate iubam.\u2019</p>\n\t\t      <p>Ait haec minax Cybebe religatque iuga manu.</p>\n\t\t      <p>Ferus ipse sese adhortans rapidum incitat animo,</p>\n\t\t      <p>Vadit, fremit, refringit virgulta pede vago.</p>\n\t\t      <p>At ubi umida albicantis loca litoris adiit,</p>\n\t\t      <p>Teneramque vidit Attin prope marmora pelagi,</p>\n\t\t      <p>Facit impetum: illa demens fugit in nemora fera:</p>\n\t\t      <p>Ibi semper omne vitae spatium famula fuit.</p>\n\t\t      <p>Dea magna, dea Cybebe, Didymei dea domina,</p>\n\t\t      <p>Procul a mea tuos sit furor omnis, era, domo:</p>\n\t\t      <p>Alios age incitatos, alios age rabidos.</p>\n\t\t    </div>','<p class="cantohead">LXIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Peliaco quondam prognatae vertice pinus</p>\n\t\t      <p>Dicuntur liquidas Neptuni nasse per undas</p>\n\t\t      <p>Phasidos ad fluctus et fines Aeetaeos,</p>\n\t\t      <p>Cum lecti iuvenes, Argivae robora pubis,</p>\n\t\t      <p>Auratam optantes Colchis avertere pellem</p>\n\t\t      <p>Ausi sunt vada salsa cita decurrere puppi,</p>\n\t\t      <p>Caerula verrentes abiegnis aequora palmis.</p>\n\t\t      <p>Diva quibus retinens in summis urbibus arces</p>\n\t\t      <p>Ipsa levi fecit volitantem flamine currum,</p>\n\t\t      <p>Pinea coniungens inflexae texta carinae.</p>\n\t\t      <p>Illa rudem cursu prima imbuit Amphitriten.</p>\n\t\t      <p>Quae simulac rostro ventosum proscidit aequor,</p>\n\t\t      <p>Tortaque remigio spumis incanduit unda,</p>\n\t\t      <p>Emersere freti canenti e gurgite vultus</p>\n\t\t      <p>Aequoreae monstrum Nereides admirantes.</p>\n\t\t      <p>Atque illic alma viderunt luce marinas</p>\n\t\t      <p>Mortales oculi nudato corpore Nymphas</p>\n\t\t      <p>Nutricum tenus extantes e gurgite cano.</p>\n\t\t      <p>Tum Thetidis Peleus incensus fertur amore,</p>\n\t\t      <p>Tum Thetis humanos non despexit hymenaeos,</p>\n\t\t      <p>Tum Thetidi pater ipse iugandum Pelea sanxit.</p>\n\t\t      <p>O nimis optato saeclorum tempore nati</p>\n\t\t      <p>Heroes, salvete, deum genus, o bona matrum</p>\n\t\t      <p>Progenies, salvete iterum <em>placidique favete</em>.</p>\n\t\t      <p>Vos ego saepe meo, vos carmine conpellabo,</p>\n\t\t      <p>Teque adeo eximie taedis felicibus aucte</p>\n\t\t      <p>Thessaliae columen Peleu, cui Iuppiter ipse,</p>\n\t\t      <p>Ipse suos divom genitor concessit amores.</p>\n\t\t      <p>Tene Thetis tenuit pulcherrima Nereine?</p>\n\t\t      <p>Tene suam Tethys concessit ducere neptem,</p>\n\t\t      <p>Oceanusque, mari totum qui amplectitur orbem?</p>\n\t\t      <p>Quoi simul optatae finito tempore luces</p>\n\t\t      <p>Advenere, domum conventu tota frequentat</p>\n\t\t      <p>Thessalia, oppletur laetanti regia coetu:</p>\n\t\t      <p>Dona ferunt prae se, declarant gaudia voltu.</p>\n\t\t      <p>Deseritur Cieros, linquunt Phthiotica tempe,</p>\n\t\t      <p>Crannonisque domos ac moenia Larisaea,</p>\n\t\t      <p>Pharsalum coeunt, Pharsalia tecta frequentant.</p>\n\t\t      <p>Rura colit nemo, mollescunt colla iuvencis,</p>\n\t\t      <p>Non humilis curvis purgatur vinea rastris,</p>\n\t\t      <p>Non falx attenuat frondatorum arboris umbram,</p>\n\t\t      <p>Non glaebam prono convellit vomere taurus,</p>\n\t\t      <p>Squalida desertis rubigo infertur aratris.</p>\n\t\t      <p>Ipsius at sedes, quacumque opulenta recessit</p>\n\t\t      <p>Regia, fulgenti splendent auro atque argento.</p>\n\t\t      <p>Candet ebur soliis, collucent pocula mensae,</p>\n\t\t      <p>Tota domus gaudet regali splendida gaza.</p>\n\t\t      <p>Pulvinar vero divae geniale locatur</p>\n\t\t      <p>Sedibus in mediis, Indo quod dente politum</p>\n\t\t      <p>Tincta tegit roseo conchyli purpura fuco.</p>\n\t\t      <p class="slindent">Haec vestis priscis hominum variata figuris</p>\n\t\t      <p>Heroum mira virtutes indicat arte.</p>\n\t\t      <p>Namque fluentisono prospectans litore Diae</p>\n\t\t      <p>Thesea cedentem celeri cum classe tuetur</p>\n\t\t      <p>Indomitos in corde gerens Ariadna furores,</p>\n\t\t      <p>Necdum etiam sese quae visit visere credit,</p>\n\t\t      <p>Vt pote fallaci quae tum primum excita somno</p>\n\t\t      <p>Desertam in sola miseram se cernat arena.</p>\n\t\t      <p>Inmemor at iuvenis fugiens pellit vada remis,</p>\n\t\t      <p>Inrita ventosae linquens promissa procellae.</p>\n\t\t      <p>Quem procul ex alga maestis Minois ocellis,</p>\n\t\t      <p>Saxea ut effigies bacchantis, prospicit, eheu,</p>\n\t\t      <p>Prospicit et magnis curarum fluctuat undis,</p>\n\t\t      <p>Non flavo retinens subtilem vertice mitram,</p>\n\t\t      <p>Non contecta levi{{1}} velatum pectus amictu,</p>\n\t\t      <p>Non tereti strophio lactantes vincta papillas,</p>\n\t\t      <p>Omnia quae toto delapsa e corpore passim</p>\n\t\t      <p>Ipsius ante pedes fluctus salis adludebant.</p>\n\t\t      <p>Set neque tum mitrae neque tum fluitantis amictus</p>\n\t\t      <p>Illa vicem curans toto ex te pectore, Theseu,</p>\n\t\t      <p>Toto animo, tota pendebat perdita mente.</p>\n\t\t      <p>A misera, adsiduis quam luctibus externavit</p>\n\t\t      <p>Spinosas Erycina serens in pectore curas</p>\n\t\t      <p>Illa tempestate, ferox quom robore Theseus</p>\n\t\t      <p>Egressus curvis e litoribus Piraei</p>\n\t\t      <p>Attigit iniusti regis Gortynia tecta.</p>\n\t\t      <p>Nam perhibent olim crudeli peste coactam</p>\n\t\t      <p>Androgeoneae poenas exolvere caedis</p>\n\t\t      <p>Electos iuvenes simul et decus innuptarum</p>\n\t\t      <p>Cecropiam solitam esse dapem dare Minotauro.</p>\n\t\t      <p>Quis angusta malis cum moenia vexarentur,</p>\n\t\t      <p>Ipse suom Theseus pro caris corpus Athenis</p>\n\t\t      <p>Proicere optavit potius quam talia Cretam</p>\n\t\t      <p>Funera Cecropiae nec funera portarentur,</p>\n\t\t      <p>Atque ita nave levi nitens ac lenibus auris</p>\n\t\t      <p>Magnanimum ad Minoa venit sedesque superbas.</p>\n\t\t      <p>Hunc simulac cupido conspexit lumine virgo</p>\n\t\t      <p>Regia, quam suavis expirans castus odores</p>\n\t\t      <p>Lectulus in molli conplexu matris alebat,</p>\n\t\t      <p>Quales Eurotae progignunt flumina myrtus</p>\n\t\t      <p>Aurave distinctos educit verna colores,</p>\n\t\t      <p>Non prius ex illo flagrantia declinavit</p>\n\t\t      <p>Lumina, quam cuncto concepit corpore flammam</p>\n\t\t      <p>Funditus atque imis exarsit tota medullis.</p>\n\t\t      <p>Heu misere exagitans inmiti corde furores</p>\n\t\t      <p>Sancte puer, curis hominum qui gaudia misces,</p>\n\t\t      <p>Quaeque regis Golgos quaeque Idalium frondosum,</p>\n\t\t      <p>Qualibus incensam iactastis mente puellam</p>\n\t\t      <p>Fluctibus in flavo saepe hospite suspirantem!</p>\n\t\t      <p>Quantos illa tulit languenti corde timores!</p>\n\t\t      <p>Quam tum saepe magis{{2}} fulgore expalluit auri!</p>\n\t\t      <p>Cum saevom cupiens contra contendere monstrum</p>\n\t\t      <p>Aut mortem oppeteret Theseus aut praemia laudis.</p>\n\t\t      <p>Non ingrata tamen frustra munuscula divis</p>\n\t\t      <p>Promittens tacito succepit vota labello.</p>\n\t\t      <p>Nam velut in summo quatientem brachia Tauro</p>\n\t\t      <p>Quercum aut conigeram sudanti cortice pinum</p>\n\t\t      <p>Indomitum turben contorquens flamine robur</p>\n\t\t      <p>Eruit (illa procul radicitus exturbata</p>\n\t\t      <p>Prona cadit, late quast impetus obvia frangens),</p>\n\t\t      <p>Sic domito saevom prostravit corpore Theseus</p>\n\t\t      <p>Nequiquam vanis iactantem cornua ventis.</p>\n\t\t      <p>Inde pedem sospes multa cum laude reflexit</p>\n\t\t      <p>Errabunda regens tenui vestigia filo,</p>\n\t\t      <p>Ne labyrintheis e flexibus egredientem</p>\n\t\t      <p>Tecti frustraretur inobservabilis error.</p>\n\t\t      <p>Sed quid ego a primo digressus carmine plura</p>\n\t\t      <p>Conmemorem, ut linquens genitoris filia voltum,</p>\n\t\t      <p>Vt consanguineae conplexum, ut denique matris,</p>\n\t\t      <p>Quae misera in gnata deperdita laetabatur,</p>\n\t\t      <p>Omnibus his Thesei dulcem praeoptarit amorem,</p>\n\t\t      <p>Aut ut vecta rati spumosa ad litora Diae</p>\n\t\t      <p><em>Venerit</em>, aut ut eam devinctam lumina somno</p>\n\t\t      <p>Liquerit inmemori discedens pectore coniunx?</p>\n\t\t      <p>Saepe illam perhibent ardenti corde furentem</p>\n\t\t      <p>Clarisonas imo fudisse e pectore voces,</p>\n\t\t      <p>Ac tum praeruptos tristem conscendere montes,</p>\n\t\t      <p>Vnde aciem in pelagi vastos protenderet aestus,</p>\n\t\t      <p>Tum tremuli salis adversas procurrere in undas</p>\n\t\t      <p>Mollia nudatae tollentem tegmina surae,</p>\n\t\t      <p>Atque haec extremis maestam dixisse querellis,</p>\n\t\t      <p>Frigidulos udo singultus ore cientem.</p>\n\t\t      <p class="slindent">\u2018Sicine me patriis avectam, perfide, ab oris,</p>\n\t\t      <p>Perfide, deserto liquisti in litore, Theseu?</p>\n\t\t      <p>Sicine discedens neglecto numine divom</p>\n\t\t      <p>Inmemor a, devota domum periuria portas?</p>\n\t\t      <p>Nullane res potuit crudelis flectere mentis</p>\n\t\t      <p>Consilium? tibi nulla fuit clementia praesto,</p>\n\t\t      <p>Inmite ut nostri vellet miserescere pectus?</p>\n\t\t      <p>At non haec quondam nobis promissa dedisti,</p>\n\t\t      <p>Vane: mihi non haec miserae sperare iubebas,</p>\n\t\t      <p>Sed conubia laeta, sed optatos hymenaeos:</p>\n\t\t      <p>Quae cuncta aerii discerpunt irrita venti.</p>\n\t\t      <p>Iam iam nulla viro iuranti femina credat,</p>\n\t\t      <p>Nulla viri speret sermones esse fideles;</p>\n\t\t      <p>Quis dum aliquid cupiens animus praegestit apisci,</p>\n\t\t      <p>Nil metuunt iurare, nihil promittere parcunt:</p>\n\t\t      <p>Sed simulac cupidae mentis satiata libidost,</p>\n\t\t      <p>Dicta nihil meminere, nihil periuria curant.</p>\n\t\t      <p>Certe ego te in medio versantem turbine leti</p>\n\t\t      <p>Eripui, et potius germanum amittere crevi,</p>\n\t\t      <p>Quam tibi fallaci supremo in tempore dessem.</p>\n\t\t      <p>Pro quo dilaceranda feris dabor alitibusque</p>\n\t\t      <p>Praeda, neque iniecta tumulabor mortua terra.</p>\n\t\t      <p>Quaenam te genuit sola sub rupe leaena?</p>\n\t\t      <p>Quod mare conceptum spumantibus expuit undis?</p>\n\t\t      <p>Quae Syrtis, quae Scylla rapax, quae vasta Charybdis?</p>\n\t\t      <p>Talia qui reddis pro dulci praemia vita.</p>\n\t\t      <p>Si tibi non cordi fuerant conubia nostra,</p>\n\t\t      <p>Saeva quod horrebas prisci praecepta parentis,</p>\n\t\t      <p>At tamen in vostras potuisti ducere sedes,</p>\n\t\t      <p>Quae tibi iocundo famularer serva labore,</p>\n\t\t      <p>Candida permulcens liquidis vestigia lymphis</p>\n\t\t      <p>Purpureave tuum consternens veste cubile.</p>\n\t\t      <p>Sed quid ego ignaris nequiquam conqueror auris,</p>\n\t\t      <p>Externata malo, quae nullis sensibus auctae</p>\n\t\t      <p>Nec missas audire queunt nec reddere voces?</p>\n\t\t      <p>Ille autem prope iam mediis versatur in undis,</p>\n\t\t      <p>Nec quisquam adparet vacua mortalis in alga.</p>\n\t\t      <p>Sic nimis insultans extremo tempore saeva</p>\n\t\t      <p>Fors etiam nostris invidit questibus aures.</p>\n\t\t      <p>Iuppiter omnipotens, utinam ne tempore primo</p>\n\t\t      <p>Gnosia Cecropiae tetigissent litora puppes,</p>\n\t\t      <p>Indomito nec dira ferens stipendia tauro</p>\n\t\t      <p>Perfidus in Creta religasset navita funem,</p>\n\t\t      <p>Nec malus hic celans dulci crudelia forma</p>\n\t\t      <p>Consilia in nostris requiesset sedibus hospes!</p>\n\t\t      <p>Nam quo me referam? quali spe perdita nitar?</p>\n\t\t      <p>Idomeneosne petam montes? a, gurgite lato</p>\n\t\t      <p>Discernens ponti truculentum ubi dividit aequor?</p>\n\t\t      <p>An patris auxilium sperem? quemne ipsa reliqui,</p>\n\t\t      <p>Respersum iuvenem fraterna caede secuta?</p>\n\t\t      <p>Coniugis an fido consoler memet amore,</p>\n\t\t      <p>Quine fugit lentos incurvans gurgite remos?</p>\n\t\t      <p>Praeterea nullo litus, sola insula, tecto,</p>\n\t\t      <p>Nec patet egressus pelagi cingentibus undis:</p>\n\t\t      <p>Nulla fugae ratio, nulla spes: omnia muta,</p>\n\t\t      <p>Omnia sunt deserta, ostentant omnia letum.</p>\n\t\t      <p>Non tamen ante mihi languescent lumina morte,</p>\n\t\t      <p>Nec prius a fesso secedent corpore sensus,</p>\n\t\t      <p>Quam iustam a divis exposcam prodita multam,</p>\n\t\t      <p>Caelestumque fidem postrema conprecer hora.</p>\n\t\t      <p>Quare facta virum multantes vindice poena,</p>\n\t\t      <p>Eumenides, quibus anguino redimita capillo</p>\n\t\t      <p>Frons expirantis praeportat pectoris iras,</p>\n\t\t      <p>Huc huc adventate, meas audite querellas,</p>\n\t\t      <p>Quas ego vae! misera extremis proferre medullis</p>\n\t\t      <p>Cogor inops, ardens, amenti caeca furore.</p>\n\t\t      <p>Quae quoniam verae nascuntur pectore ab imo,</p>\n\t\t      <p>Vos nolite pati nostrum vanescere luctum,</p>\n\t\t      <p>Sed quali solam Theseus me mente reliquit,</p>\n\t\t      <p>Tali mente, deae, funestet seque suosque.\u2019</p>\n\t\t      <p class="slindent">Has postquam maesto profudit pectore voces,</p>\n\t\t      <p>Supplicium saevis exposcens anxia factis,</p>\n\t\t      <p>Adnuit invicto caelestum numine rector,</p>\n\t\t      <p>Quo motu tellus atque horrida contremuerunt</p>\n\t\t      <p>Aequora concussitque micantia sidera mundus.</p>\n\t\t      <p>Ipse autem caeca mentem caligine Theseus</p>\n\t\t      <p>Consitus oblito dimisit pectore cuncta,</p>\n\t\t      <p>Quae mandata prius constanti mente tenebat,</p>\n\t\t      <p>Dulcia nec maesto sustollens signa parenti</p>\n\t\t      <p>Sospitem Erechtheum se ostendit visere portum.</p>\n\t\t      <p>Namque ferunt olim, castae cum moenia divae</p>\n\t\t      <p>Linquentem gnatum ventis concrederet Aegeus,</p>\n\t\t      <p>Talia conplexum iuveni mandata dedisse.</p>\n\t\t      <p>\u2018Gnate, mihi longa iocundior unice vita,</p>\n\t\t      <p>Reddite in extrema nuper mihi fine senectae,</p>\n\t\t      <p>Gnate, ego quem in dubios cogor dimittere casus,</p>\n\t\t      <p>Quandoquidem fortuna mea ac tua fervida virtus</p>\n\t\t      <p>Eripit invito mihi te, cui languida nondum</p>\n\t\t      <p>Lumina sunt gnati cara saturata figura:</p>\n\t\t      <p>Non ego te gaudens laetanti pectore mittam,</p>\n\t\t      <p>Nec te ferre sinam fortunae signa secundae,</p>\n\t\t      <p>Sed primum multas expromam mente querellas,</p>\n\t\t      <p>Canitiem terra atque infuso pulvere foedans,</p>\n\t\t      <p>Inde infecta vago suspendam lintea malo,</p>\n\t\t      <p>Nostros ut luctus nostraeque incendia mentis</p>\n\t\t      <p>Carbasus obscurata decet ferrugine Hibera.</p>\n\t\t      <p>Quod tibi si sancti concesserit incola Itoni,</p>\n\t\t      <p>Quae nostrum genus ac sedes defendere Erechthei</p>\n\t\t      <p>Adnuit, ut tauri respergas sanguine dextram,</p>\n\t\t      <p>Tum vero facito ut memori tibi condita corde</p>\n\t\t      <p>Haec vigeant mandata, nec ulla oblitteret aetas,</p>\n\t\t      <p>Vt simulac nostros invisent lumina colles,</p>\n\t\t      <p>Funestam antennae deponant undique vestem,</p>\n\t\t      <p>Candidaque intorti sustollant vela rudentes,</p>\n\t\t      <p>Lucida qua splendent summi carchesia mali,</p>\n\t\t      <p>Quam primum cernens ut laeta gaudia mente</p>\n\t\t      <p>Agnoscam, cum te reducem aetas prospera sistet.\u2019</p>\n\t\t      <p>Haec mandata prius constanti mente tenentem</p>\n\t\t      <p>Thesea ceu pulsae ventorum flamine nubes</p>\n\t\t      <p>Aerium nivei montis liquere cacumen.</p>\n\t\t      <p>At pater, ut summa prospectum ex arce petebat,</p>\n\t\t      <p>Anxia in adsiduos absumens lumina fletus,</p>\n\t\t      <p>Cum primum infecti conspexit lintea veli,</p>\n\t\t      <p>Praecipitem sese scopulorum e vertice iecit,</p>\n\t\t      <p>Amissum credens inmiti Thesea fato.</p>\n\t\t      <p>Sic funesta domus ingressus tecta paterna</p>\n\t\t      <p>Morte ferox Theseus qualem Minoidi luctum</p>\n\t\t      <p>Obtulerat mente inmemori talem ipse recepit.</p>\n\t\t      <p>Quae tamen aspectans cedentem maesta carinam</p>\n\t\t      <p>Multiplices animo volvebat saucia curas.</p>\n\t\t      <p>At parte ex alia florens volitabat Iacchus</p>\n\t\t      <p>Cum thiaso Satyrorum et Nysigenis Silenis,</p>\n\t\t      <p>Te quaerens, Ariadna, tuoque incensus amore.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Quae tum alacres passim lymphata mente furebant</p>\n\t\t      <p>Euhoe bacchantes, euhoe capita inflectentes.</p>\n\t\t      <p>Harum pars tecta quatiebant cuspide thyrsos,</p>\n\t\t      <p>Pars e divolso iactabant membra iuvenco,</p>\n\t\t      <p>Pars sese tortis serpentibus incingebant,</p>\n\t\t      <p>Pars obscura cavis celebrabant orgia cistis,</p>\n\t\t      <p>Orgia, quae frustra cupiunt audire profani,</p>\n\t\t      <p>Plangebant aliae proceris tympana palmis</p>\n\t\t      <p>Aut tereti tenues tinnitus aere ciebant,</p>\n\t\t      <p>Multis raucisonos efflabant cornua bombos</p>\n\t\t      <p>Barbaraque horribili stridebat tibia cantu.</p>\n\t\t      <p class="slindent">Talibus amplifice vestis decorata figuris</p>\n\t\t      <p>Pulvinar conplexa suo velabat amictu.</p>\n\t\t      <p>Quae postquam cupide spectando Thessala pubes</p>\n\t\t      <p>Expletast, sanctis coepit decedere divis.</p>\n\t\t      <p>Hic, qualis flatu placidum mare matutino</p>\n\t\t      <p>Horrificans Zephyrus proclivas incitat undas</p>\n\t\t      <p>Aurora exoriente vagi sub limina Solis,</p>\n\t\t      <p>Quae tarde primum clementi flamine pulsae</p>\n\t\t      <p>Procedunt (leni resonant plangore cachinni),</p>\n\t\t      <p>Post vento crescente magis magis increbescunt</p>\n\t\t      <p>Purpureaque procul nantes a luce refulgent,</p>\n\t\t      <p>Sic ibi vestibuli linquentes regia tecta</p>\n\t\t      <p>Ad se quisque vago passim pede discedebant.</p>\n\t\t      <p>Quorum post abitum princeps e vertice Pelei</p>\n\t\t      <p>Advenit Chiron portans silvestria dona:</p>\n\t\t      <p>Nam quoscumque ferunt campi, quos Thessala magnis</p>\n\t\t      <p>Montibus ora creat, quos propter fluminis undas</p>\n\t\t      <p>Aura parit flores tepidi fecunda Favoni,</p>\n\t\t      <p>Hos indistinctis plexos tulit ipse corollis,</p>\n\t\t      <p>Quo permulsa domus iocundo risit odore.</p>\n\t\t      <p>Confestim Penios adest, viridantia Tempe,</p>\n\t\t      <p>Tempe, quae silvae cingunt super inpendentes,</p>\n\t\t      <p>{{3}}Minosim linquens crebris celebranda choreis,</p>\n\t\t      <p>Non vacuos: namque ille tulit radicitus altas</p>\n\t\t      <p>Fagos ac recto proceras stipite laurus,</p>\n\t\t      <p>Non sine nutanti platano lentaque sorore</p>\n\t\t      <p>Flammati Phaethontis et aeria cupressu.</p>\n\t\t      <p>Haec circum sedes late contexta locavit,</p>\n\t\t      <p>Vestibulum ut molli velatum fronde vireret.</p>\n\t\t      <p>Post hunc consequitur sollerti corde Prometheus,</p>\n\t\t      <p>Extenuata gerens veteris vestigia poenae,</p>\n\t\t      <p>Quam quondam scythicis restrictus membra catena</p>\n\t\t      <p>Persolvit pendens e verticibus praeruptis.</p>\n\t\t      <p>Inde pater divom sancta cum coniuge natisque</p>\n\t\t      <p>Advenit caelo, te solum, Phoebe, relinquens</p>\n\t\t      <p>Vnigenamque simul cultricem montibus Idri:</p>\n\t\t      <p>Pelea nam tecum pariter soror aspernatast</p>\n\t\t      <p>Nec Thetidis taedas voluit celebrare iugalis,</p>\n\t\t      <p>Qui postquam niveis flexerunt sedibus artus,</p>\n\t\t      <p>Large multiplici constructae sunt dape mensae,</p>\n\t\t      <p>Cum interea infirmo quatientes corpora motu</p>\n\t\t      <p>Veridicos Parcae coeperunt edere cantus.</p>\n\t\t      <p>His corpus tremulum conplectens undique vestis</p>\n\t\t      <p>Candida purpurea talos incinxerat ora,</p>\n\t\t      <p>Annoso niveae residebant vertice vittae,</p>\n\t\t      <p>Aeternumque manus carpebant rite laborem.</p>\n\t\t      <p>Laeva colum molli lana retinebat amictum,</p>\n\t\t      <p>Dextera tum leviter deducens fila supinis</p>\n\t\t      <p>Formabat digitis, tum prono in pollice torquens</p>\n\t\t      <p>Libratum tereti versabat turbine fusum,</p>\n\t\t      <p>Atque ita decerpens aequabat semper opus dens,</p>\n\t\t      <p>Laneaque aridulis haerebant morsa labellis,</p>\n\t\t      <p>Quae prius in levi fuerant extantia filo:</p>\n\t\t      <p>Ante pedes autem candentis mollia lanae</p>\n\t\t      <p>Vellera virgati custodibant calathisci.</p>\n\t\t      <p>Haec tum clarisona pectentes vellera voce</p>\n\t\t      <p>Talia divino fuderunt carmine fata,</p>\n\t\t      <p>Carmine, perfidiae quod post nulla arguet aetas.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>O decus eximium magnis virtutibus augens,</p>\n\t\t      <p>Emathiae tutamen opis, clarissime nato,</p>\n\t\t      <p>Accipe, quod laeta tibi pandunt luce sorores,</p>\n\t\t      <p>Veridicum oraclum. sed vos, quae fata sequuntur,</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Adveniet tibi iam portans optata maritis</p>\n\t\t      <p>Hesperus, adveniet fausto cum sidere coniunx,</p>\n\t\t      <p>Quae tibi flexanimo mentem perfundat amore</p>\n\t\t      <p>Languidulosque paret tecum coniungere somnos,</p>\n\t\t      <p>Levia substernens robusto brachia collo.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Nulla domus tales umquam conexit amores,</p>\n\t\t      <p>Nullus amor tali coniunxit foedere amantes,</p>\n\t\t      <p>Qualis adest Thetidi, qualis concordia Peleo.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Nascetur vobis expers terroris Achilles,</p>\n\t\t      <p>Hostibus haud tergo, sed forti pectore notus,</p>\n\t\t      <p>Quae persaepe vago victor certamine cursus</p>\n\t\t      <p>Flammea praevertet celeris vestigia cervae.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Non illi quisquam bello se conferet heros,</p>\n\t\t      <p>Cum Phrygii Teucro manabunt sanguine{{4}} tenen,</p>\n\t\t      <p>Troicaque obsidens longinquo moenia bello</p>\n\t\t      <p>Periuri Pelopis vastabit tertius heres.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Illius egregias virtutes claraque facta</p>\n\t\t      <p>Saepe fatebuntur gnatorum in funere matres,</p>\n\t\t      <p>Cum in cinerem canos solvent a vertice crines</p>\n\t\t      <p>Putridaque infirmis variabunt pectora palmis.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Namque velut densas praecerpens cultor aristas</p>\n\t\t      <p>Sole sub ardenti flaventia demetit arva,</p>\n\t\t      <p>Troiugenum infesto prosternet corpora ferro.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Testis erit magnis virtutibus unda Scamandri,</p>\n\t\t      <p>Quae passim rapido diffunditur Hellesponto,</p>\n\t\t      <p>Cuius iter caesis angustans corporum acervis</p>\n\t\t      <p>Alta tepefaciet permixta flumina caede.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Denique testis erit morti quoque reddita praeda,</p>\n\t\t      <p>Cum terrae ex celso coacervatum aggere bustum</p>\n\t\t      <p>Excipiet niveos percussae virginis artus.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Nam simul ac fessis dederit fors copiam Achivis</p>\n\t\t      <p>Vrbis Dardaniae Neptunia solvere vincla,</p>\n\t\t      <p>Alta Polyxenia madefient caede sepulcra,</p>\n\t\t      <p>Quae, velut ancipiti succumbens victima ferro,</p>\n\t\t      <p>Proiciet truncum submisso poplite corpus.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Quare agite optatos animi coniungite amores.</p>\n\t\t      <p>Accipiat coniunx felici foedere divam,</p>\n\t\t      <p>Dedatur cupido iandudum nupta marito.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Non illam nutrix orienti luce revisens</p>\n\t\t      <p>Hesterno collum poterit circumdare filo,</p>\n\t\t      <p>[Currite ducentes subtegmina, currite, fusi]</p>\n\t\t      <p>Anxia nec mater discordis maesta puellae</p>\n\t\t      <p>Secubitu caros mittet sperare nepotes.</p>\n\t\t      <p class="slindent">Currite ducentes subtegmina, currite, fusi.</p>\n\t\t    </div>\n\n\t\t    <div class="stanza">\n\t\t      <p>Talia praefantes quondam felicia Pelei</p>\n\t\t      <p>Carmina divino cecinerunt pectore Parcae.</p>\n\t\t      <p>Praesentes namque ante domos invisere castas</p>\n\t\t      <p>Heroum et sese mortali ostendere coetu</p>\n\t\t      <p>Caelicolae nondum spreta pietate solebant.</p>\n\t\t      <p>Saepe pater divom templo in fulgente residens,</p>\n\t\t      <p>Annua cum festis venissent sacra diebus,</p>\n\t\t      <p>Conspexit terra centum procumbere tauros.</p>\n\t\t      <p>Saepe vagus Liber Parnasi vertice summo</p>\n\t\t      <p>Thyiadas effusis euhantes crinibus egit.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Cum Delphi tota certatim ex urbe ruentes</p>\n\t\t      <p>Acciperent laeti divom fumantibus aris.</p>\n\t\t      <p>Saepe in letifero belli certamine Mavors</p>\n\t\t      <p>Aut rapidi Tritonis era aut Rhamnusia virgo</p>\n\t\t      <p>Armatas hominumst praesens hortata catervas.</p>\n\t\t      <p>Sed postquam tellus scelerest imbuta nefando,</p>\n\t\t      <p>Iustitiamque omnes cupida de mente fugarunt,</p>\n\t\t      <p>Perfudere manus fraterno sanguine fratres,</p>\n\t\t      <p>Destitit extinctos natus lugere parentes,</p>\n\t\t      <p>Optavit genitor primaevi funera nati,</p>\n\t\t      <p>Liber ut innuptae poteretur flore novercae,</p>\n\t\t      <p>Ignaro mater substernens se inpia nato</p>\n\t\t      <p>Inpia non veritast divos scelerare penates:</p>\n\t\t      <p>Omnia fanda nefanda malo permixta furore</p>\n\t\t      <p>Iustificam nobis mentem avertere deorum.</p>\n\t\t      <p>Quare nec tales dignantur visere coetus,</p>\n\t\t      <p>Nec se contingi patiuntur lumine claro.</p>\n\t\t    </div>','<p class="cantohead">LXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Esti me adsiduo confectum cura dolore</p>\n\t\t      <p class="slindent">Sevocat a doctis, Ortale, virginibus,</p>\n\t\t      <p>Nec potisest dulces Musarum expromere fetus</p>\n\t\t      <p class="slindent">Mens animi, (tantis fluctuat ipsa malis:</p>\n\t\t      <p>Namque mei nuper Lethaeo gurgite fratris</p>\n\t\t      <p class="slindent">Pallidulum manans adluit unda pedem,</p>\n\t\t      <p>Troia Rhoeteo quem subter littore tellus</p>\n\t\t      <p class="slindent">Ereptum nostris obterit ex oculis.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Adloquar, audiero numquam tua <em>facta</em> loquentem,</p>\n\t\t      <p class="slindent">Numquam ego te, vita frater amabilior,</p>\n\t\t      <p>Aspiciam posthac. at certe semper amabo,</p>\n\t\t      <p class="slindent">Semper maesta tua carmina morte canam,</p>\n\t\t      <p>Qualia sub densis ramorum concinit umbris</p>\n\t\t      <p class="slindent">Daulias absumpti fata gemens Itylei)&mdash;</p>\n\t\t      <p>Sed tamen in tantis maeroribus, Ortale, mitto</p>\n\t\t      <p class="slindent">Haec expressa tibi carmina Battiadae,</p>\n\t\t      <p>Ne tua dicta vagis nequiquam credita ventis</p>\n\t\t      <p class="slindent">Effluxisse meo forte putes animo,</p>\n\t\t      <p>Vt missum sponsi furtivo munere malum</p>\n\t\t      <p class="slindent">Procurrit casto virginis e gremio,</p>\n\t\t      <p>Quod miserae oblitae molli sub veste locatum,</p>\n\t\t      <p class="slindent">Dum adventu matris prosilit, excutitur:</p>\n\t\t      <p>Atque illud prono praeceps agitur decursu,</p>\n\t\t      <p class="slindent">Huic manat tristi conscius ore rubor.</p>\n\t\t    </div>','<p class="cantohead">LXVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Omnia qui magni dispexit lumina mundi,</p>\n\t\t      <p class="slindent">Qui stellarum ortus comperit atque obitus,</p>\n\t\t      <p>Flammeus ut rapidi solis nitor obscuretur,</p>\n\t\t      <p class="slindent">Vt cedant certis sidera temporibus,</p>\n\t\t      <p>Vt Triviam furtim sub Latmia saxa relegans</p>\n\t\t      <p class="slindent">Dulcis amor gyro devocet aerio,</p>\n\t\t      <p>Idem me ille Conon caelesti in lumine vidit</p>\n\t\t      <p class="slindent">E Beroniceo vertice caesariem</p>\n\t\t      <p>Fulgentem clare, quam cunctis illa deorum</p>\n\t\t      <p class="slindent">Levia protendens brachia pollicitast,</p>\n\t\t      <p>Qua rex tempestate novo auctus hymenaeo</p>\n\t\t      <p class="slindent">Vastatum finis iverat Assyrios,</p>\n\t\t      <p>Dulcia nocturnae portans vestigia rixae,</p>\n\t\t      <p class="slindent">Quam de virgineis gesserat exuviis.</p>\n\t\t      <p>Estne novis nuptis odio venus? anne parentum</p>\n\t\t      <p class="slindent">Frustrantur falsis gaudia lacrimulis,</p>\n\t\t      <p>Vbertim thalami quas intra lumina fundunt?</p>\n\t\t      <p class="slindent">Non, ita me divi, vera gemunt, iuerint.</p>\n\t\t      <p>Id mea me multis docuit regina querellis</p>\n\t\t      <p class="slindent">Invisente novo praelia torva viro.</p>\n\t\t      <p>An tu non orbum luxti deserta cubile,</p>\n\t\t      <p class="slindent">Sed fratris cari flebile discidium?</p>\n\t\t      <p>Quam penitus maestas excedit cura medullas!</p>\n\t\t      <p class="slindent">Vt tibi tum toto pectore sollicitae</p>\n\t\t      <p>Sensibus ereptis mens excidit! at te ego certe</p>\n\t\t      <p class="slindent">Cognoram a parva virgine magnanimam.</p>\n\t\t      <p>Anne bonum oblita\u2019s facinus, quo regium adepta\u2019s</p>\n\t\t      <p class="slindent">Coniugium, quo non fortius ausit alis?</p>\n\t\t      <p>Sed tum maesta virum mittens quae verba locuta\u2019s!</p>\n\t\t      <p class="slindent">Iuppiter, ut tristi lumina saepe manu!</p>\n\t\t      <p>Quis te mutavit tantus deus? an quod amantes</p>\n\t\t      <p class="slindent">Non longe a caro corpore abesse volunt?</p>\n\t\t      <p>Atque ibi me cunctis pro dulci coniuge divis</p>\n\t\t      <p class="slindent">Non sine taurino sanguine pollicita\u2019s</p>\n\t\t      <p>Sei reditum tetullisset. is haut in tempore longo</p>\n\t\t      <p class="slindent">Captam Asiam Aegypti finibus addiderat.</p>\n\t\t      <p>Quis ego pro factis caelesti reddita coetu</p>\n\t\t      <p class="slindent">Pristina vota novo munere dissoluo.</p>\n\t\t      <p>Invita, o regina, tuo de vertice cessi,</p>\n\t\t      <p class="slindent">Invita: adiuro teque tuomque caput,</p>\n\t\t      <p>Digna ferat quod siquis inaniter adiurarit:</p>\n\t\t      <p class="slindent">Sed qui se ferro postulet esse parem?</p>\n\t\t      <p>Ille quoque eversus mons est, quem maximum in orbi</p>\n\t\t      <p class="slindent">Progenies Thiae clara supervehitur,</p>\n\t\t      <p>Cum Medi peperere novom mare, cumque inventus</p>\n\t\t      <p class="slindent">Per medium classi barbara navit Athon.</p>\n\t\t      <p>Quid facient crines, cum ferro talia cedant?</p>\n\t\t      <p class="slindent">Iuppiter, ut Chalybon omne genus pereat,</p>\n\t\t      <p>Et qui principio sub terra quaerere venas</p>\n\t\t      <p class="slindent">Institit ac ferri frangere duritiem!</p>\n\t\t      <p>Abiunctae paulo ante comae mea fata sorores</p>\n\t\t      <p class="slindent">Lugebant, cum se Memnonis Aethiopis</p>\n\t\t      <p>Vnigena inpellens nictantibus aera pennis</p>\n\t\t      <p class="slindent">Obtulit Arsinoes Locridos ales equos,</p>\n\t\t      <p>Isque per aetherias me tollens avolat umbras</p>\n\t\t      <p class="slindent">Et Veneris casto collocat in gremio.</p>\n\t\t      <p>Ipsa suum Zephyritis eo famulum legarat,</p>\n\t\t      <p class="slindent">Graia Canopieis incola litoribus.</p>\n\t\t      <p>{{5}}Hi dii ven ibi vario ne solum in lumine caeli</p>\n\t\t      <p class="slindent">Ex Ariadneis aurea temporibus</p>\n\t\t      <p>Fixa corona foret, sed nos quoque fulgeremus</p>\n\t\t      <p class="slindent">Devotae flavi verticis exuviae,</p>\n\t\t      <p>Vvidulam a fletu cedentem ad templa deum me</p>\n\t\t      <p class="slindent">Sidus in antiquis diva novom posuit:</p>\n\t\t      <p>Virginis et saevi contingens namque Leonis</p>\n\t\t      <p class="slindent">Lumina, Callisto iuncta Lycaoniae,</p>\n\t\t      <p>Vertor in occasum, tardum dux ante Booten,</p>\n\t\t      <p class="slindent">Qui vix sero alto mergitur Oceano.</p>\n\t\t      <p>Sed quamquam me nocte premunt vestigia divom,</p>\n\t\t      <p class="slindent">Lux autem canae Tethyi restituit,</p>\n\t\t      <p>(Pace tua fari hic liceat, Rhamnusia virgo,</p>\n\t\t      <p class="slindent">Namque ego non ullo vera timore tegam,</p>\n\t\t      <p>Nec si me infestis discerpent sidera dictis,</p>\n\t\t      <p class="slindent">Condita quin verei pectoris evoluam):</p>\n\t\t      <p>Non his tam laetor rebus, quam me afore semper,</p>\n\t\t      <p class="slindent">Afore me a dominae vertice discrucior,</p>\n\t\t      <p>Quicum ego, dum virgo curis fuit omnibus expers,</p>\n\t\t      <p class="slindent">Vnguenti Suriei milia multa bibi.</p>\n\t\t      <p>Nunc vos, optato quom iunxit lumine taeda,</p>\n\t\t      <p class="slindent">Non prius unanimis corpora coniugibus</p>\n\t\t      <p>Tradite nudantes reiecta veste papillas,</p>\n\t\t      <p class="slindent">Quam iocunda mihi munera libet onyx,</p>\n\t\t      <p>Voster onyx, casto petitis quae iura cubili.</p>\n\t\t      <p class="slindent">Sed quae se inpuro dedit adulterio,</p>\n\t\t      <p>Illius a mala dona levis bibat irrita pulvis:</p>\n\t\t      <p class="slindent">Namque ego ab indignis praemia nulla peto.</p>\n\t\t      <p>Sed magis, o nuptae, semper concordia vostras</p>\n\t\t      <p class="slindent">Semper amor sedes incolat adsiduos.</p>\n\t\t      <p>Tu vero, regina, tuens cum sidera divam</p>\n\t\t      <p class="slindent">Placabis festis luminibus Venerem,</p>\n\t\t      <p>Vnguinis expertem non siris esse tuam me,</p>\n\t\t      <p class="slindent">Sed potius largis adfice muneribus.</p>\n\t\t      <p>Sidera corruerent utinam! coma regia fiam:</p>\n\t\t      <p class="slindent">Proximus Hydrochoi fulgeret Oarion!</p>\n\t\t    </div>','<p class="cantohead">LXVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>O dulci iocunda viro, iocunda parenti,</p>\n\t\t      <p class="slindent">Salve, teque bona Iuppiter auctet ope,</p>\n\t\t      <p>Ianua, quam Balbo dicunt servisse benigne</p>\n\t\t      <p class="slindent">Olim, cum sedes ipse senex tenuit,</p>\n\t\t      <p>Quamque ferunt rursus voto servisse maligno,</p>\n\t\t      <p class="slindent">Postquam es porrecto facta marita sene.</p>\n\t\t      <p>Dic agedum nobis, quare mutata feraris</p>\n\t\t      <p class="slindent">In dominum veterem deseruisse fidem.</p>\n\t\t      <p>\u2018Non (ita Caecilio placeam, cui tradita nunc sum)</p>\n\t\t      <p class="slindent">Culpa meast, quamquam dicitur esse mea,</p>\n\t\t      <p>Nec peccatum a me quisquam pote dicere quicquam:</p>\n\t\t      <p class="slindent">Verum istud populi fabula, Quinte, facit,</p>\n\t\t      <p>Qui, quacumque aliquid reperitur non bene factum,</p>\n\t\t      <p class="slindent">Ad me omnes clamant: ianua, culpa tuast.\u2019</p>\n\t\t      <p>Non istuc satis est uno te dicere verbo,</p>\n\t\t      <p class="slindent">Sed facere ut quivis sentiat et videat.</p>\n\t\t      <p>\u2018Qui possum? nemo quaerit nec scire laborat.\u2019</p>\n\t\t      <p class="slindent">Nos volumus: nobis dicere ne dubita.</p>\n\t\t      <p>\u2018Primum igitur, virgo quod fertur tradita nobis,</p>\n\t\t      <p class="slindent">Falsumst. non illam vir prior attigerit,</p>\n\t\t      <p>Languidior tenera cui pendens sicula beta</p>\n\t\t      <p class="slindent">Numquam se mediam sustulit ad tunicam:</p>\n\t\t      <p>Sed pater illius gnati violasse cubile</p>\n\t\t      <p class="slindent">Dicitur et miseram conscelerasse domum,</p>\n\t\t      <p>Sive quod inpia mens caeco flagrabat amore,</p>\n\t\t      <p class="slindent">Seu quod iners sterili semine natus erat,</p>\n\t\t      <p>Et quaerendus is unde foret nervosius illud,</p>\n\t\t      <p class="slindent">Quod posset zonam solvere virgineam.\u2019</p>\n\t\t      <p>Egregium narras mira pietate parentem,</p>\n\t\t      <p class="slindent">Qui ipse sui gnati minxerit in gremium.</p>\n\t\t      <p>Atqui non solum hoc se dicit cognitum habere</p>\n\t\t      <p class="slindent">Brixia Cycneae supposita speculae,</p>\n\t\t      <p>Flavos quam molli percurrit flumine Mella,</p>\n\t\t      <p class="slindent">Brixia Veronae mater amata meae.</p>\n\t\t      <p>\u2018Et de Postumio et Corneli narrat amore,</p>\n\t\t      <p class="slindent">Cum quibus illa malum fecit adulterium.\u2019</p>\n\t\t      <p>Dixerit hic aliquis: qui tu isthaec, ianua, nosti?</p>\n\t\t      <p class="slindent">Cui numquam domini limine abesse licet,</p>\n\t\t      <p>Nec populum auscultare, sed heic suffixa tigillo</p>\n\t\t      <p class="slindent">Tantum operire soles aut aperire domum?</p>\n\t\t      <p>\u2018Saepe illam audivi furtiva voce loquentem</p>\n\t\t      <p class="slindent">Solam cum ancillis haec sua flagitia,</p>\n\t\t      <p>Nomine dicentem quos diximus, ut pote quae mi</p>\n\t\t      <p class="slindent">Speraret nec linguam esse nec auriculam.</p>\n\t\t      <p>Praeterea addebat quendam, quem dicere nolo</p>\n\t\t      <p class="slindent">Nomine, ne tollat rubra supercilia.</p>\n\t\t      <p>Longus homost, magnas quoi lites intulit olim</p>\n\t\t      <p class="slindent">Falsum mendaci ventre puerperium.\u2019</p>\n\t\t    </div>','<p class="cantohead">LXVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quod mihi fortuna casuque oppressus acerbo</p>\n\t\t      <p class="slindent">Conscriptum hoc lacrimis mittis epistolium,</p>\n\t\t      <p>Naufragum ut eiectum spumantibus aequoris undis</p>\n\t\t      <p class="slindent">Sublevem et a mortis limine restituam,</p>\n\t\t      <p>Quem neque sancta Venus molli requiescere somno</p>\n\t\t      <p class="slindent">Desertum in lecto caelibe perpetitur,</p>\n\t\t      <p>Nec veterum dulci scriptorum carmine Musae</p>\n\t\t      <p class="slindent">Oblectant, cum mens anxia pervigilat,</p>\n\t\t      <p>Id gratumst mihi, me quoniam tibi dicis amicum,</p>\n\t\t      <p class="slindent">Muneraque et Musarum hinc petis et Veneris:</p>\n\t\t      <p>Sed tibi ne mea sint ignota incommoda, Mani,</p>\n\t\t      <p class="slindent">Neu me odisse putes hospitis officium,</p>\n\t\t      <p>Accipe, quis merser fortunae fluctibus ipse,</p>\n\t\t      <p class="slindent">Ne amplius a misero dona beata petas.</p>\n\t\t      <p>Tempore quo primum vestis mihi tradita purast,</p>\n\t\t      <p class="slindent">Iocundum cum aetas florida ver ageret,</p>\n\t\t      <p>Multa satis lusi: non est dea nescia nostri,</p>\n\t\t      <p class="slindent">Quae dulcem curis miscet amaritiem:</p>\n\t\t      <p>Sed totum hoc studium luctu fraterna mihi mors</p>\n\t\t      <p class="slindent">Abstulit. o misero frater adempte mihi,</p>\n\t\t      <p>Tu mea tu moriens fregisti commoda, frater,</p>\n\t\t      <p class="slindent">Tecum una totast nostra sepulta domus,</p>\n\t\t      <p>Omnia tecum una perierunt gaudia nostra,</p>\n\t\t      <p class="slindent">Quae tuos in vita dulcis alebat amor.</p>\n\t\t      <p>Cuius ego interitu tota de mente fugavi</p>\n\t\t      <p class="slindent">Haec studia atque omnis delicias animi.</p>\n\t\t      <p>Quare, quod scribis Veronae turpe Catullo</p>\n\t\t      <p class="slindent">Esse, quod hic quivis de meliore nota</p>\n\t\t      <p>Frigida deserto tepefactet membra cubili,</p>\n\t\t      <p class="slindent">Id, Mani, non est turpe, magis miserumst.</p>\n\t\t      <p>Ignosces igitur, si, quae mihi luctus ademit,</p>\n\t\t      <p class="slindent">Haec tibi non tribuo munera, cum nequeo.</p>\n\t\t      <p>Nam, quod scriptorum non magnast copia apud me,</p>\n\t\t      <p class="slindent">Hoc fit, quod Romae vivimus: illa domus,</p>\n\t\t      <p>Illa mihi sedes, illic mea carpitur aetas:</p>\n\t\t      <p class="slindent">Huc una ex multis capsula me sequitur.</p>\n\t\t      <p>Quod cum ita sit, nolim statuas nos mente maligna</p>\n\t\t      <p class="slindent">Id facere aut animo non satis ingenuo,</p>\n\t\t      <p>Quod tibi non utriusque petenti copia factast:</p>\n\t\t      <p class="slindent">Vltro ego deferrem, copia siqua foret.</p>\n\t\t      <p>Non possum reticere, deae, qua me Allius in re</p>\n\t\t      <p class="slindent">Iuverit aut quantis iuverit officiis:</p>\n\t\t      <p>Nec fugiens saeclis obliviscentibus aetas</p>\n\t\t      <p class="slindent">Illius hoc caeca nocte tegat studium:</p>\n\t\t      <p>Sed dicam vobis, vos porro dicite multis</p>\n\t\t      <p class="slindent">Milibus et facite haec charta loquatur anus</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p class="slindent">Notescatque magis mortuos atque magis,</p>\n\t\t      <p>Nec tenuem texens sublimis aranea telam</p>\n\t\t      <p class="slindent">In deserto Alli nomine opus faciat.</p>\n\t\t      <p>Nam, mihi quam dederit duplex Amathusia curam,</p>\n\t\t      <p class="slindent">Scitis, et in quo me corruerit genere,</p>\n\t\t      <p>Cum tantum arderem quantum Trinacria rupes</p>\n\t\t      <p class="slindent">Lymphaque in Oetaeis Malia Thermopylis,</p>\n\t\t      <p>Maesta neque adsiduo tabescere lumina fletu</p>\n\t\t      <p class="slindent">Cessarent tristique imbre madere genae.</p>\n\t\t      <p>Qualis in aerii perlucens vertice montis</p>\n\t\t      <p class="slindent">Rivos muscoso prosilit e lapide,</p>\n\t\t      <p>Qui cum de prona praeceps est valle volutus,</p>\n\t\t      <p class="slindent">Per medium sensim transit iter populi,</p>\n\t\t      <p>Dulci viatori lasso in sudore levamen,</p>\n\t\t      <p class="slindent">Cum gravis exustos aestus hiulcat agros:</p>\n\t\t      <p>Hic, velut in nigro iactatis turbine nautis</p>\n\t\t      <p class="slindent">Lenius aspirans aura secunda venit</p>\n\t\t      <p>Iam prece Pollucis, iam Castoris inplorata,</p>\n\t\t      <p class="slindent">Tale fuit nobis Manius auxilium.</p>\n\t\t      <p>Is clusum lato patefecit limite campum,</p>\n\t\t      <p class="slindent">Isque domum nobis isque dedit dominam,</p>\n\t\t      <p>Ad quam communes exerceremus amores.</p>\n\t\t      <p class="slindent">Quo mea se molli candida diva pede</p>\n\t\t      <p>Intulit et trito fulgentem in limine plantam</p>\n\t\t      <p class="slindent">Innixa arguta constituit solea,</p>\n\t\t      <p>Coniugis ut quondam flagrans advenit amore</p>\n\t\t      <p class="slindent">Protesilaeam Laudamia domum</p>\n\t\t      <p>Inceptam frustra, nondum cum sanguine sacro</p>\n\t\t      <p class="slindent">Hostia caelestis pacificasset eros.</p>\n\t\t      <p>Nil mihi tam valde placeat, Rhamnusia virgo,</p>\n\t\t      <p class="slindent">Quod temere invitis suscipiatur eris.</p>\n\t\t      <p>Quam ieiuna pium desideret ara cruorem,</p>\n\t\t      <p class="slindent">Doctast amisso Laudamia viro,</p>\n\t\t      <p>Coniugis ante coacta novi dimittere collum,</p>\n\t\t      <p class="slindent">Quam veniens una atque altera rursus hiemps</p>\n\t\t      <p>Noctibus in longis avidum saturasset amorem,</p>\n\t\t      <p class="slindent">Posset ut abrupto vivere coniugio,</p>\n\t\t      <p>Quod scirant Parcae non longo tempore adesse,</p>\n\t\t      <p class="slindent">Si miles muros isset ad Iliacos:</p>\n\t\t      <p>Nam tum Helenae raptu primores Argivorum</p>\n\t\t      <p class="slindent">Coeperat ad sese Troia ciere viros,</p>\n\t\t      <p>Troia (nefas) commune sepulcrum Asiae Europaeque,</p>\n\t\t      <p class="slindent">Troia virum et virtutum omnium acerba cinis,</p>\n\t\t      <p>Quaene etiam nostro letum miserabile fratri</p>\n\t\t      <p class="slindent">Attulit. ei misero frater adempte mihi,</p>\n\t\t      <p>Ei misero fratri iocundum lumen ademptum,</p>\n\t\t      <p class="slindent">Tecum una totast nostra sepulta domus,</p>\n\t\t      <p>Omnia tecum una perierunt gaudia nostra,</p>\n\t\t      <p class="slindent">Quae tuos in vita dulcis alebat amor.</p>\n\t\t      <p>Quem nunc tam longe non inter nota sepulcra</p>\n\t\t      <p class="slindent">Nec prope cognatos conpositum cineres,</p>\n\t\t      <p>Sed Troia obscaena, Troia infelice sepultum</p>\n\t\t      <p class="slindent">Detinet extremo terra aliena solo.</p>\n\t\t      <p>Ad quam tum properans fertur <em>simul</em> undique pubes</p>\n\t\t      <p class="slindent">Graeca penetrales deseruisse focos,</p>\n\t\t      <p>Ne Paris abducta gavisus libera moecha</p>\n\t\t      <p class="slindent">Otia pacato degeret in thalamo.</p>\n\t\t      <p>Quo tibi tum casu, pulcherrima Laudamia,</p>\n\t\t      <p class="slindent">Ereptumst vita dulcius atque anima</p>\n\t\t      <p>Coniugium: tanto te absorbens vertice amoris</p>\n\t\t      <p class="slindent">Aestus in abruptum detulerat barathrum,</p>\n\t\t      <p>Quale ferunt Grai Pheneum prope Cylleneum</p>\n\t\t      <p class="slindent">Siccare emulsa pingue palude solum,</p>\n\t\t      <p>Quod quondam caesis montis fodisse medullis</p>\n\t\t      <p class="slindent">Audit falsiparens Amphitryoniades,</p>\n\t\t      <p>Tempore quo certa Stymphalia monstra sagitta</p>\n\t\t      <p class="slindent">Perculit imperio deterioris eri,</p>\n\t\t      <p>Pluribus ut caeli tereretur ianua divis,</p>\n\t\t      <p class="slindent">Hebe nec longa virginitate foret.</p>\n\t\t      <p>Sed tuos altus amor barathro fuit altior illo,</p>\n\t\t      <p class="slindent">Qui durum domitam ferre iugum docuit:</p>\n\t\t      <p>Nam nec tam carum confecto aetate parenti</p>\n\t\t      <p class="slindent">Vna caput seri nata nepotis alit,</p>\n\t\t      <p>Qui, cum divitiis vix tandem inventus avitis</p>\n\t\t      <p class="slindent">Nomen testatas intulit in tabulas,</p>\n\t\t      <p>Inpia derisi gentilis gaudia tollens</p>\n\t\t      <p class="slindent">Suscitat a cano volturium capiti:</p>\n\t\t      <p>Nec tantum niveo gavisast ulla columbo</p>\n\t\t      <p class="slindent">Conpar, quae multo dicitur inprobius</p>\n\t\t      <p>Oscula mordenti semper decerpere rostro,</p>\n\t\t      <p class="slindent">Quam quae praecipue multivolast mulier.</p>\n\t\t      <p>Sed tu horum magnos vicisti sola furores,</p>\n\t\t      <p class="slindent">Vt semel es flavo conciliata viro.</p>\n\t\t      <p>Aut nihil aut paulo cui tum concedere digna</p>\n\t\t      <p class="slindent">Lux mea se nostrum contulit in gremium,</p>\n\t\t      <p>Quam circumcursans hinc illinc saepe Cupido</p>\n\t\t      <p class="slindent">Fulgebat crocina candidus in tunica.</p>\n\t\t      <p>Quae tamen etsi uno non est contenta Catullo,</p>\n\t\t      <p class="slindent">Rara verecundae furta feremus erae,</p>\n\t\t      <p>Ne nimium simus stultorum more molesti.</p>\n\t\t      <p class="slindent">Saepe etiam Iuno, maxima caelicolum,</p>\n\t\t      <p>Coniugis in culpa flagrantem conquoquit iram,</p>\n\t\t      <p class="slindent">Noscens omnivoli plurima furta Iovis.</p>\n\t\t      <p>Atquei nec divis homines conponier aequomst,</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p class="slindent">Ingratum tremuli tolle parentis onus.</p>\n\t\t      <p>Nec tamen illa mihi dextra deducta paterna</p>\n\t\t      <p class="slindent">Fragrantem Assyrio venit odore domum,</p>\n\t\t      <p>Sed furtiva dedit muta munuscula nocte,</p>\n\t\t      <p class="slindent">Ipsius ex ipso dempta viri gremio.</p>\n\t\t      <p>Quare illud satis est, si nobis is datur unis,</p>\n\t\t      <p class="slindent">Quem lapide illa diem candidiore notat.</p>\n\t\t      <p>Hoc tibi, qua potui, confectum carmine munus</p>\n\t\t      <p class="slindent">Pro multis, Alli, redditur officiis,</p>\n\t\t      <p>Ne vostrum scabra tangat rubigine nomen</p>\n\t\t      <p class="slindent">Haec atque illa dies atque alia atque alia.</p>\n\t\t      <p>Huc addent divi quam plurima, quae Themis olim</p>\n\t\t      <p class="slindent">Antiquis solitast munera ferre piis:</p>\n\t\t      <p>Sitis felices et tu simul et tua vita</p>\n\t\t      <p class="slindent">Et domus, ipsi in qua lusimus et domina,</p>\n\t\t      <p>Et qui principio nobis te tradidit Anser,</p>\n\t\t      <p class="slindent">A quo sunt primo mi omnia nata bona.</p>\n\t\t      <p>Et longe ante omnes mihi quae me carior ipsost,</p>\n\t\t      <p class="slindent">Lux mea, qua viva vivere dulce mihist.</p>\n\t\t    </div>','<p class="cantohead">LXVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Noli admirari, quare tibi femina nulla,</p>\n\t\t      <p class="slindent">Rufe, velit tenerum supposuisse femur,</p>\n\t\t      <p>Non si illam rarae labefactes munere vestis</p>\n\t\t      <p class="slindent">Aut perluciduli deliciis lapidis.</p>\n\t\t      <p>Laedit te quaedam mala fabula, qua tibi fertur</p>\n\t\t      <p class="slindent">Valle sub alarum trux habitare caper.</p>\n\t\t      <p>Hunc metuunt omnes. neque mirum: nam mala valdest</p>\n\t\t      <p class="slindent">Bestia, nec quicum bella puella cubet.</p>\n\t\t      <p>Quare aut crudelem nasorum interfice pestem,</p>\n\t\t      <p class="slindent">Aut admirari desine cur fugiunt.</p>\n\t\t    </div>','<p class="cantohead">LXX.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Nulli se dicit mulier mea nubere malle</p>\n\t\t      <p class="slindent">Quam mihi, non si se Iuppiter ipse petat.</p>\n\t\t      <p>Dicit: sed mulier cupido quod dicit amanti,</p>\n\t\t      <p class="slindent">In vento et rapida scribere oportet aqua.</p>\n\t\t    </div>','<p class="cantohead">LXXI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Siquoi iure bono sacer alarum obstitit hircus,</p>\n\t\t      <p class="slindent">Aut siquem merito tarda podagra secat,</p>\n\t\t      <p>Aemulus iste tuos, qui vostrum exercet amorem,</p>\n\t\t      <p class="slindent">Mirificost fato nactus utrumque malum,</p>\n\t\t      <p>Nam quotiens futuit, totiens ulciscitur ambos:</p>\n\t\t      <p class="slindent">Illam adfligit odore, ipse perit podagra.</p>\n\t\t    </div>','<p class="cantohead">LXXII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Dicebas quondam solum te nosse Catullum,</p>\n\t\t      <p class="slindent">Lesbia, nec prae me velle tenere Iovem.</p>\n\t\t      <p>Dilexi tum te non tantum ut volgus amicam,</p>\n\t\t      <p class="slindent">Sed pater ut gnatos diligit et generos.</p>\n\t\t      <p>Nunc te cognovi: quare etsi inpensius uror,</p>\n\t\t      <p class="slindent">Multo mi tamen es vilior et levior.</p>\n\t\t      <p>Qui potisest? inquis. quod amantem iniuria talis</p>\n\t\t      <p class="slindent">Cogit amare magis, sed bene velle minus.</p>\n\t\t    </div>','<p class="cantohead">LXXIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Desine de quoquam quicquam bene velle mereri</p>\n\t\t      <p class="slindent">Aut aliquem fieri posse putare pium.</p>\n\t\t      <p>Omnia sunt ingrata, nihil fecisse benigne</p>\n\t\t      <p class="slindent"><em>Prodest</em>, immo etiam taedet obestque magis</p>\n\t\t      <p>Vt mihi, quem nemo gravius nec acerbius urget,</p>\n\t\t      <p class="slindent">Quam modo qui me unum atque unicum amicum habuit.</p>\n\t\t    </div>','<p class="cantohead">LXXIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Gellius audierat patruom obiurgare solere,</p>\n\t\t      <p class="slindent">Siquis delicias diceret aut faceret.</p>\n\t\t      <p>Hoc ne ipsi accideret, patrui perdepsuit ipsam</p>\n\t\t      <p class="slindent">Vxorem et patruom reddidit Harpocratem.</p>\n\t\t      <p>Quod voluit fecit: nam, quamvis inrumet ipsum</p>\n\t\t      <p class="slindent">Nunc patruom, verbum non faciet patruos.</p>\n\t\t    </div>','<p class="cantohead">LXXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t<div class="stanza">\n\t\t<p>Huc est mens deducta tua, mea Lesbia, culpa,</p>\n\t\t<p>atque ita se officio perdidit ipsa suo,</p>\n\t\t<p>ut iam nec bene velle queat tibi, si optuma fias,</p>\n\t\t<p>nec desistere amare, omnia si facias.</p>\n\t\t</div>','<p class="cantohead">LXXVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Siqua recordanti benefacta priora voluptas</p>\n\t\t      <p class="slindent">Est homini, cum se cogitat esse pium,</p>\n\t\t      <p>Nec sanctam violasse fidem, nec foedere in ullo</p>\n\t\t      <p class="slindent">Divom ad fallendos numine abusum homines,</p>\n\t\t      <p>Multa parata manent in longa aetate, Catulle,</p>\n\t\t      <p class="slindent">Ex hoc ingrato gaudia amore tibi.</p>\n\t\t      <p>Nam quaecumque homines bene cuiquam aut dicere possunt</p>\n\t\t      <p class="slindent">Aut facere, haec a te dictaque factaque sunt;</p>\n\t\t      <p>Omniaque ingratae perierunt credita menti.</p>\n\t\t      <p class="slindent">Quare iam te cur amplius excrucies?</p>\n\t\t      <p>Quin tu animo offirmas atque istinc teque reducis</p>\n\t\t      <p class="slindent">Et dis invitis desinis esse miser?</p>\n\t\t      <p>Difficilest longum subito deponere amorem.</p>\n\t\t      <p class="slindent">Difficilest, verum hoc quae lubet efficias.</p>\n\t\t      <p>Vna salus haec est, hoc est tibi pervincendum:</p>\n\t\t      <p class="slindent">Hoc facias, sive id non pote sive pote.</p>\n\t\t      <p>O di, si vestrumst misereri, aut si quibus umquam</p>\n\t\t      <p class="slindent">Extremam iam ipsa morte tulistis opem,</p>\n\t\t      <p>Me miserum aspicite (et, si vitam puriter egi,</p>\n\t\t      <p class="slindent">Eripite hanc pestem perniciemque mihi),</p>\n\t\t      <p>Ei mihi surrepens imos ut torpor in artus</p>\n\t\t      <p class="slindent">Expulit ex omni pectore laetitias.</p>\n\t\t      <p>Non iam illud quaero, contra me ut diligat illa,</p>\n\t\t      <p class="slindent">Aut, quod non potisest, esse pudica velit:</p>\n\t\t      <p>Ipse valere opto et taetrum hunc deponere morbum.</p>\n\t\t      <p class="slindent">O di, reddite mi hoc pro pietate mea.</p>\n\t\t    </div>','<p class="cantohead">LXXVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Rufe mihi frustra ac nequiquam credite amico</p>\n\t\t      <p class="slindent">(Frustra? immo magno cum pretio atque malo),</p>\n\t\t      <p>Sicine subrepsti mei, atque intestina perurens</p>\n\t\t      <p class="slindent">Ei misero eripuisti omnia nostra bona?</p>\n\t\t      <p>Eripuisti, heu heu nostrae crudele venenum</p>\n\t\t      <p class="slindent">Vitae, heu heu nostrae pestis amicitiae.</p>\n\t\t      <p>Sed nunc id doleo, quod purae pura puellae</p>\n\t\t      <p class="slindent">Savia conminxit spurca saliva tua.</p>\n\t\t      <p>Verum id non inpune feres: nam te omnia saecla</p>\n\t\t      <p class="slindent">Noscent, et qui sis fama loquetur anus.</p>\n\t\t    </div>','<p class="cantohead">LXXVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Gallus habet fratres, quorumst lepidissima coniunx</p>\n\t\t      <p class="slindent">Alterius, lepidus filius alterius.</p>\n\t\t      <p>Gallus homost bellus: nam dulces iungit amores,</p>\n\t\t      <p class="slindent">Cum puero ut bello bella puella cubet.</p>\n\t\t      <p>Gallus homost stultus nec se videt esse maritum,</p>\n\t\t      <p class="slindent">Qui patruos patrui monstret adulterium.</p>\n\t\t    </div>','<p class="cantohead">LXXVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Lesbius est pulcher: quid ni? quem Lesbia malit</p>\n\t\t      <p class="slindent">Quam te cum tota gente, Catulle, tua.</p>\n\t\t      <p>Sed tamen hic pulcher vendat cum gente Catullum,</p>\n\t\t      <p class="slindent">Si tria notorum savia reppererit.</p>\n\t\t    </div>','<p class="cantohead">LXXX.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quid dicam, Gelli, quare rosea ista labella</p>\n\t\t      <p class="slindent">Hiberna fiant candidiora nive,</p>\n\t\t      <p>Mane domo cum exis et cum te octava quiete</p>\n\t\t      <p class="slindent">E molli longo suscitat hora die?</p>\n\t\t      <p>Nescioquid certest: an vere fama susurrat</p>\n\t\t      <p class="slindent">Grandia te medii tenta vorare viri?</p>\n\t\t      <p>Sic certest: clamant Victoris rupta miselli</p>\n\t\t      <p class="slindent">Ilia, et emulso labra notata sero.</p>\n\t\t    </div>','<p class="cantohead">LXXXI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Nemone in tanto potuit populo esse, Iuventi,</p>\n\t\t      <p class="slindent">Bellus homo, quem tu diligere inciperes,</p>\n\t\t      <p>Praeterquam iste tuus moribunda a sede Pisauri</p>\n\t\t      <p class="slindent">Hospes inaurata pallidior statua,</p>\n\t\t      <p>Qui tibi nunc cordist, quem tu praeponere nobis</p>\n\t\t      <p class="slindent">Audes, et nescis quod facinus facias.</p>\n\t\t    </div>','<p class="cantohead">LXXXII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quinti, si tibi vis oculos debere Catullum</p>\n\t\t      <p class="slindent">Aut aliud siquid carius est oculis,</p>\n\t\t      <p>Eripere ei noli, multo quod carius illi</p>\n\t\t      <p class="slindent">Est oculis seu quid carius est oculis.</p>\n\t\t    </div>','<p class="cantohead">LXXXIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Lesbia mi praesente viro mala plurima dicit:</p>\n\t\t      <p class="slindent">Haec illi fatuo maxima laetitiast.</p>\n\t\t      <p>Mule, nihil sentis. si nostri oblita taceret,</p>\n\t\t      <p class="slindent">Sana esset: nunc quod gannit et obloquitur,</p>\n\t\t      <p>Non solum meminit, sed quae multo acrior est res</p>\n\t\t      <p class="slindent">Iratast. Hoc est, uritur et coquitur.</p>\n\t\t    </div>','<p class="cantohead">LXXXIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Chommoda dicebat, si quando commoda vellet</p>\n\t\t      <p class="slindent">Dicere, et insidias Arrius hinsidias,</p>\n\t\t      <p>Et tum mirifice sperabat se esse locutum,</p>\n\t\t      <p class="slindent">Cum quantum poterat dixerat hinsidias.</p>\n\t\t      <p>Credo, sic mater, sic Liber avonculus eius,</p>\n\t\t      <p class="slindent">Sic maternus avos dixerat atque avia.</p>\n\t\t      <p>Hoc misso in Syriam requierant omnibus aures:</p>\n\t\t      <p class="slindent">Audibant eadem haec leniter et leviter,</p>\n\t\t      <p>Nec sibi postilla metuebant talia verba,</p>\n\t\t      <p class="slindent">Cum subito adfertur nuntius horribilis,</p>\n\t\t      <p>Ionios fluctus, postquam illuc Arrius isset,</p>\n\t\t      <p class="slindent">Iam non Ionios esse, sed Hionios.</p>\n\t\t    </div>','<p class="cantohead">LXXXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Odi et amo. quare id faciam, fortasse requiris.</p>\n\t\t      <p class="slindent">Nescio, sed fieri sentio et excrucior.</p>\n\t\t    </div>','<p class="cantohead">LXXXVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quintia formosast multis, mihi candida, longa,</p>\n\t\t      <p class="slindent">Rectast. haec ego sic singula confiteor,</p>\n\t\t      <p>Totum illud formosa nego: nam nulla venustas,</p>\n\t\t      <p class="slindent">Nulla in tam magnost corpore mica salis.</p>\n\t\t      <p>Lesbia formosast, quae cum pulcherrima totast,</p>\n\t\t      <p class="slindent">Tum omnibus una omnes surripuit Veneres.</p>\n\t\t    </div>','<p class="cantohead">LXXXVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Nulla potest mulier tantum se dicere amatam</p>\n\t\t      <p class="slindent">Vere, quantum a me Lesbia amata mea\u2019s.</p>\n\t\t      <p>Nulla fides ullo fuit umquam foedere tanta,</p>\n\t\t      <p class="slindent">Quanta in amore tuo ex parte reperta meast.</p>\n\t\t      <p>Nunc est mens diducta tua, mea Lesbia, culpa,</p>\n\t\t      <p class="slindent">Atque ita se officio perdidit ipsa suo,</p>\n\t\t      <p>Vt iam nec bene velle queat tibi, si optima fias,</p>\n\t\t      <p class="slindent">Nec desistere amare, omnia si facias.</p>\n\t\t    </div>','<p class="cantohead">LXXXVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Quid facit is, Gelli, qui cum matre atque sorore</p>\n\t\t      <p class="slindent">Prurit et abiectis pervigilat tunicis?</p>\n\t\t      <p>Quid facit is, patruom qui non sinit esse maritum?</p>\n\t\t      <p class="slindent">Ecqui scis quantum suscipiat sceleris?</p>\n\t\t      <p>Suscipit, o Gelli, quantum non ultima Tethys</p>\n\t\t      <p class="slindent">Nec genitor lympharum abluit Oceanus:</p>\n\t\t      <p>Nam nihil est quicquam sceleris, quo prodeat ultra,</p>\n\t\t      <p class="slindent">Non si demisso se ipse voret capite.</p>\n\t\t    </div>','<p class="cantohead">LXXXVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Gellius est tenuis: quid ni? cui tam bona mater</p>\n\t\t      <p class="slindent">Tamque valens vivat tamque venusta soror</p>\n\t\t      <p>Tamque bonus patruos tamque omnia plena puellis</p>\n\t\t      <p class="slindent">Cognatis, quare is desinat esse macer?</p>\n\t\t      <p>Qui ut nihil attingit, nisi quod fas tangere non est,</p>\n\t\t      <p class="slindent">Quantumvis quare sit macer invenies.</p>\n\t\t    </div>','<p class="cantohead">LXXXX.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Nascatur magus ex Gelli matrisque nefando</p>\n\t\t      <p class="slindent">Coniugio et discat Persicum aruspicium:</p>\n\t\t      <p>Nam magus ex matre et gnato gignatur oportet,</p>\n\t\t      <p class="slindent">Si verast Persarum inpia relligio,</p>\n\t\t      <p>Navos ut accepto veneretur carmine divos</p>\n\t\t      <p class="slindent">Omentum in flamma pingue liquefaciens.</p>\n\t\t    </div>','<p class="cantohead">LXXXXI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Non ideo, Gelli, sperabam te mihi fidum</p>\n\t\t      <p class="slindent">In misero hoc nostro, hoc perdito amore fore,</p>\n\t\t      <p>Quod te cognossem bene constantemve putarem</p>\n\t\t      <p class="slindent">Aut posse a turpi mentem inhibere probro,</p>\n\t\t      <p>Sed neque quod matrem nec germanam esse videbam</p>\n\t\t      <p class="slindent">Hanc tibi, cuius me magnus edebat amor.</p>\n\t\t      <p>Et quamvis tecum multo coniungerer usu,</p>\n\t\t      <p class="slindent">Non satis id causae credideram esse tibi.</p>\n\t\t      <p>Tu satis id duxti: tantum tibi gaudium in omni</p>\n\t\t      <p class="slindent">Culpast, in quacumque est aliquid sceleris.</p>\n\t\t    </div>','<p class="cantohead">LXXXXII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Lesbia mi dicit semper male nec tacet umquam</p>\n\t\t      <p class="slindent">De me: Lesbia me dispeream nisi amat.</p>\n\t\t      <p>Quo signo? quia sunt{{6}} totidem mea: deprecor illam</p>\n\t\t      <p class="slindent">Absidue, verum dispeream nisi amo.</p>\n\t\t    </div>','<p class="cantohead">LXXXXIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Nil nimium studeo Caesar tibi belle placere,</p>\n\t\t      <p class="slindent">Nec scire utrum sis albus an ater homo.</p>\n\t\t    </div>','<p class="cantohead">LXXXXIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Mentula moechatur.  moechatur mentula: certe.</p>\n\t\t      <p class="slindent">Hoc est, quod dicunt, ipsa olera olla legit.</p>\n\t\t    </div>','<p class="cantohead">LXXXXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Zmyrna mei Cinnae nonam post denique messem</p>\n\t\t      <p class="slindent">Quam coeptast nonamque edita post hiemem,</p>\n\t\t      <p>Milia cum interea quingenta Hortensius uno</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Zmyrna cavas Satrachi penitus mittetur ad undas,</p>\n\t\t      <p class="slindent">Zmyrnam cana diu saecula pervoluent.</p>\n\t\t      <p>At Volusi annales Paduam morientur ad ipsam</p>\n\t\t      <p class="slindent">Et laxas scombris saepe dabunt tunicas.</p>\n\t\t      <p>Parva mei mihi sint cordi monumenta <em>sodalis</em>,</p>\n\t\t      <p class="slindent">At populus tumido gaudeat Antimacho.</p>\n\t\t    </div>','<p class="cantohead">LXXXXVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Si quicquam mutis gratum acceptumve sepulcris</p>\n\t\t      <p class="slindent">Accidere a nostro, Calve, dolore potest,</p>\n\t\t      <p>Quo desiderio veteres renovamus amores</p>\n\t\t      <p class="slindent">Atque olim missas flemus amicitias,</p>\n\t\t      <p>Certe non tanto mors inmatura dolorist</p>\n\t\t      <p class="slindent">Quintiliae, quantum gaudet amore tuo.</p>\n\t\t    </div>','<p class="cantohead">LXXXXVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Non (ita me di ament) quicquam referre putavi,</p>\n\t\t      <p class="slindent">Vtrumne os an culum olfacerem Aemilio.</p>\n\t\t      <p>Nilo mundius hoc, niloque immundior ille,</p>\n\t\t      <p class="slindent">Verum etiam culus mundior et melior:</p>\n\t\t      <p>Nam sine dentibus est: dentes os sesquipedales,</p>\n\t\t      <p class="slindent">Gingivas vero ploxeni habet veteris,</p>\n\t\t      <p>Praeterea rictum qualem diffissus in aestu</p>\n\t\t      <p class="slindent">Meientis mulae cunnus habere solet.</p>\n\t\t      <p>Hic futuit multas et se facit esse venustum,</p>\n\t\t      <p class="slindent">Et non pistrino traditur atque asino?</p>\n\t\t      <p>Quem siqua attingit, non illam posse putemus</p>\n\t\t      <p class="slindent">Aegroti culum lingere carnificis?</p>\n\t\t    </div>','<p class="cantohead">LXXXXVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>In te, si in quemquam, dici pote, putide Victi,</p>\n\t\t      <p class="slindent">Id quod verbosis dicitur et fatuis.</p>\n\t\t      <p>Ista cum lingua, si usus veniat tibi, possis</p>\n\t\t      <p class="slindent">Culos et crepidas lingere carpatinas.</p>\n\t\t      <p>Si nos omnino vis omnes perdere, Victi,</p>\n\t\t      <p class="slindent">Hiscas: omnino quod cupis efficies.</p>\n\t\t    </div>','<p class="cantohead">LXXXXVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Surripui tibi, dum ludis, mellite Iuventi,</p>\n\t\t      <p class="slindent">Suaviolum dulci dulcius ambrosia.</p>\n\t\t      <p>Verum id non inpune tuli: namque amplius horam</p>\n\t\t      <p class="slindent">Suffixum in summa me memini esse cruce,</p>\n\t\t      <p>Dum tibi me purgo nec possum fletibus ullis</p>\n\t\t      <p class="slindent">Tantillum vostrae demere saevitiae.</p>\n\t\t      <p>Nam simul id factumst, multis diluta labella</p>\n\t\t      <p class="slindent">Abstersti guttis omnibus articulis,</p>\n\t\t      <p>Ne quicquam nostro contractum ex ore maneret,</p>\n\t\t      <p class="slindent">Tamquam conmictae spurca saliva lupae.</p>\n\t\t      <p>Praeterea infesto miserum me tradere Amori</p>\n\t\t      <p class="slindent">Non cessasti omnique excruciare modo,</p>\n\t\t      <p>Vt mi ex ambrosia mutatum iam foret illud</p>\n\t\t      <p class="slindent">Suaviolum tristi tristius helleboro.</p>\n\t\t      <p>Quam quoniam poenam misero proponis amori,</p>\n\t\t      <p class="slindent">Numquam iam posthac basia surripiam.</p>\n\t\t    </div>','<p class="cantohead">C.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Caelius Aufilenum et Quintius Aufilenam</p>\n\t\t      <p class="slindent">Flos Veronensum depereunt iuvenum,</p>\n\t\t      <p>Hic fratrem, ille sororem. hoc est, quod dicitur, illud</p>\n\t\t      <p class="slindent">Fraternum vere dulce sodalitium.</p>\n\t\t      <p>Cui faveam potius? Caeli, tibi: nam tua nobis</p>\n\t\t      <p class="slindent">Per facta exhibitast unica amicitia,</p>\n\t\t      <p>Cum vesana meas torreret flamma medullas.</p>\n\t\t      <p class="slindent">Sis felix, Caeli, sis in amore potens.</p>\n\t\t    </div>','<p class="cantohead">CI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Multas per gentes et multa per aequora vectus</p>\n\t\t      <p class="slindent">Advenio has miseras, frater, ad inferias,</p>\n\t\t      <p>Vt te postremo donarem munere mortis</p>\n\t\t      <p class="slindent">Et mutam nequiquam adloquerer cinerem,</p>\n\t\t      <p>Quandoquidem fortuna mihi tete abstulit ipsum,</p>\n\t\t      <p class="slindent">Heu miser indigne frater adempte mihi.</p>\n\t\t\t\t\t<p class="divider">* * * * *</p>\n\t\t      <p>Nunc tamen interea haec prisco quae more parentum</p>\n\t\t      <p class="slindent">Tradita sunt tristes munera ad inferias,</p>\n\t\t      <p>Accipe fraterno multum manantia fletu,</p>\n\t\t      <p class="slindent">Atque in perpetuom, frater, ave atque vale.</p>\n\t\t    </div>','<p class="cantohead">CII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Si quicquam tacito conmissumst fido ab amico,</p>\n\t\t      <p class="slindent">Cuius sit penitus nota fides animi,</p>\n\t\t      <p>Meque esse invenies illorum iure sacratum,</p>\n\t\t      <p class="slindent">Corneli, et factum me esse puta Harpocratem.</p>\n\t\t    </div>','<p class="cantohead">CIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Aut, sodes, mihi redde decem sestertia, Silo,</p>\n\t\t      <p class="slindent">Deinde esto quamvis saevus et indomitus:</p>\n\t\t      <p>Aut, si te nummi delectant, desine quaeso</p>\n\t\t      <p class="slindent">Leno esse atque idem saevus et indomitus.</p>\n\t\t    </div>','<p class="cantohead">CIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Credis me potuisse meae maledicere vitae,</p>\n\t\t      <p class="slindent">Ambobus mihi quae carior est oculis?</p>\n\t\t      <p>Non potui, nec si possem tam perdite amarem:</p>\n\t\t      <p class="slindent">Sed tu cum Tappone omnia monstra facis.</p>\n\t\t    </div>','<p class="cantohead">CV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Mentula conatur Pipleum scandere montem:</p>\n\t\t      <p class="slindent">Musae furcillis praecipitem eiciunt.</p>\n\t\t    </div>','<p class="cantohead">CVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Cum puero bello praeconem qui videt esse,</p>\n\t\t      <p class="slindent">Quid credat, nisi se vendere discupere?</p>\n\t\t    </div>','<p class="cantohead">CVII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Siquoi quid cupido optantique obtigit umquam</p>\n\t\t      <p class="slindent">Insperanti, hoc est gratum animo proprie.</p>\n\t\t      <p>Quare hoc est gratum nobisque est carius auro,</p>\n\t\t      <p class="slindent">Quod te restituis, Lesbia, mi cupido,</p>\n\t\t      <p>Restituis cupido atque insperanti ipsa refers te.</p>\n\t\t      <p class="slindent">Nobis o lucem candidiore nota!</p>\n\t\t      <p>Quis me uno vivit felicior, aut magis hac res</p>\n\t\t      <p class="slindent">Optandas vita dicere quis poterit?</p>\n\t\t    </div>','<p class="cantohead">CVIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Si, Comini, populi arbitrio tua cana senectus</p>\n\t\t      <p class="slindent">Spurcata inpuris moribus intereat,</p>\n\t\t      <p>Non equidem dubito quin primum inimica bonorum</p>\n\t\t      <p class="slindent">Lingua execta avido sit data volturio,</p>\n\t\t      <p>Effossos oculos voret atro gutture corvos,</p>\n\t\t      <p class="slindent">Intestina canes, cetera membra lupi.</p>\n\t\t    </div>','<p class="cantohead">CVIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Iocundum, mea vita, mihi proponis amorem</p>\n\t\t      <p class="slindent">Hunc nostrum internos perpetuomque fore.</p>\n\t\t      <p>Di magni, facite ut vere promittere possit,</p>\n\t\t      <p class="slindent">Atque id sincere dicat et ex animo,</p>\n\t\t      <p>Vt liceat nobis tota producere vita</p>\n\t\t      <p class="slindent">Alternum hoc sanctae foedus amicitae.</p>\n\t\t    </div>','<p class="cantohead">CX.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Aufilena, bonae semper laudantur amicae:</p>\n\t\t      <p class="slindent">Accipiunt pretium, quae facere instituunt.</p>\n\t\t      <p>Tu quod promisti, mihi quod mentita inimica\u2019s,</p>\n\t\t      <p class="slindent">Quod nec das et fers saepe, facis facinus.</p>\n\t\t      <p>Aut facere ingenuaest, aut non promisse pudicae,</p>\n\t\t      <p class="slindent">Aufilena, fuit: sed data corripere</p>\n\t\t      <p>Fraudando{{7}} efficit plus quom meretricis avarae,</p>\n\t\t      <p class="slindent">Quae sese tota corpore prostituit.</p>\n\t\t    </div>','<p class="cantohead">CXI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Aufilena, viro contentam vivere solo,</p>\n\t\t      <p class="slindent">Nuptarum laus e laudibus eximiis:</p>\n\t\t      <p>Sed cuivis quamvis potius succumbere par est,</p>\n\t\t      <p class="slindent">Quam matrem fratres <em>efficere</em> ex patruo.</p>\n\t\t    </div>','<p class="cantohead">CXII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Multus homo es Naso, neque tecum multus homost qui</p>\n\t\t      <p class="slindent">Descendit: Naso, multus es et pathicus.</p>\n\t\t    </div>','<p class="cantohead">CXIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Consule Pompeio primum duo, Cinna, solebant</p>\n\t\t      <p class="slindent">Mucillam: facto consule nunc iterum</p>\n\t\t      <p>Manserunt duo, sed creverunt milia in unum</p>\n\t\t      <p class="slindent">Singula. fecundum semen adulterio.</p>\n\t\t    </div>','<p class="cantohead">CXIIII.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Firmano saltu non falso Mentula dives</p>\n\t\t      <p class="slindent">Fertur, qui tot res in se habet egregias,</p>\n\t\t      <p>Aucupium, omne genus piscis, prata, arva ferasque.</p>\n\t\t      <p class="slindent">Nequiquam: fructibus sumptibus exuperat.</p>\n\t\t      <p>Quare concedo sit dives, dum omnia desint.</p>\n\t\t      <p class="slindent">Saltum laudemus, dum modo <em>eo</em> ipse egeat.</p>\n\t\t    </div>','<p class="cantohead">CXV.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Mentula habes instar triginta iugera prati,</p>\n\t\t      <p class="slindent">Quadraginta arvi: cetera sunt maria.</p>\n\t\t      <p>Cur non divitiis Croesum superare potissit</p>\n\t\t      <p class="slindent">Vno qui in saltu totmoda possideat,</p>\n\t\t      <p>Prata, arva, ingentes silvas saltusque paludesque</p>\n\t\t      <p class="slindent">Vsque ad Hyperboreos et mare ad Oceanum?</p>\n\t\t      <p>Omnia magna haec sunt, tamen ipse\u2019s maximus ultro,</p>\n\t\t      <p class="slindent">Non homo, sed vero mentula magna minax.</p>\n\t\t    </div>','<p class="cantohead">CXVI.</p>\n\t\t<p class="cantosubhead">&nbsp;</p>\n\t\t    <div class="stanza">\n\t\t      <p>Saepe tibi studioso animo venante requirens</p>\n\t\t      <p class="slindent">Carmina uti possem mittere Battiadae,</p>\n\t\t      <p>Qui te lenirem nobis, neu conarere</p>\n\t\t      <p class="slindent">Telis infestis icere mi usque caput,</p>\n\t\t      <p>Hunc video mihi nunc frustra sumptus esse laborem,</p>\n\t\t      <p class="slindent">Gelli, nec nostras his valuisse preces.</p>\n\t\t      <p>Contra nos tela ista tua evitamus amictu:</p>\n\t\t      <p class="slindent">At fixus nostris tu dabi\u2019 supplicium.</p>\n\t\t    </div>']};

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// controls.js
//
// this module sets up controls for the app as a whole



var Hammer = __webpack_require__(72);
var settings = __webpack_require__(38);
var helpers = __webpack_require__(5); // .nextrans, .prevtrans
var resize = __webpack_require__(11);
var dom = __webpack_require__(1);
var _notes = __webpack_require__(20);
var data = __webpack_require__(0);

var controls = {
	start: function start() {
		// console.log("Starting controls...");
		controls.navbar();
		controls.settings();
		controls.swiping();
		controls.notes();
		controls.keys();
	},
	navbar: function navbar() {
		// button controls
		document.querySelector("#navbarleft .navprev").onclick = function () {
			data.watch.setlens = {
				translation: helpers.nexttrans(data.lens.left.translation),
				canto: data.canto,
				side: "left",
				percentage: 999, // is this okay?
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.nexttrans(data.lens.left.translation),data.canto,"left");
		};
		document.querySelector("#navbarleft .navnext").onclick = function () {
			data.watch.setlens = {
				translation: helpers.prevtrans(data.lens.left.translation),
				canto: data.canto,
				side: "left",
				percentage: 999, // is this okay?
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.prevtrans(data.lens.left.translation),data.canto,"left");
		};
		document.querySelector("#navbarleft .navup").onclick = function () {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto - 1,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.right.translation,data.canto-1,"right",0);
		};
		document.querySelector("#navbarleft .navdown").onclick = function () {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto + 1,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.right.translation,data.canto+1,"right",0);
		};
		document.querySelector("#navbarright .navprev").onclick = function () {
			data.watch.setlens = {
				translation: helpers.nexttrans(data.lens.right.translation),
				canto: data.canto,
				side: "right",
				percentage: 999, // is this okay?
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.nexttrans(data.lens.right.translation),data.canto,"right");
		};
		document.querySelector("#navbarright .navnext").onclick = function () {
			data.watch.setlens = {
				translation: helpers.prevtrans(data.lens.right.translation),
				canto: data.canto,
				side: "right",
				percentage: 999, // is this okay?
				trigger: !data.watch.setlens.trigger
			};
			//app.setlens(helpers.prevtrans(data.lens.right.translation),data.canto,"right");
		};
		document.querySelector("#navbarright .navup").onclick = function () {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto - 1,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.right.translation,data.canto-1,"right",0);
		};
		document.querySelector("#navbarright .navdown").onclick = function () {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto + 1,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.right.translation,data.canto+1,"right",0);
		};
		document.querySelector("#navbarleft .navclose").onclick = function () {
			dom.removeclass("body", "twinmode");
			dom.addclass("#twinmode", "off");
			dom.removeclass("#singlemode", "off");
			data.usersettings.twinmode = false;
			resize.check();
		};
		data.elements.titlebar.onclick = function () {
			data.watch.setpage = "lens";
		};
		document.querySelector("#navbarright .navsettings").onclick = function () {
			settings.update();
			data.watch.setpage = "settings";
		};

		document.body.onkeyup = function (e) {
			// maybe this is screwing us on mobile?
			e.preventDefault();
			dom.removeclass(".button", "on");
		};
	},
	settings: function settings() {
		document.getElementById("aboutlink").onclick = function () {
			data.watch.setpage = "about";
		};
		document.getElementById("helplink").onclick = function () {
			data.watch.setpage = "help";
		};

		if (data.usersettings.twinmode) {
			dom.removeclass("#twinmode", "off");
			dom.addclass("#singlemode", "off");
		} else {
			dom.addclass("#twinmode", "off");
			dom.removeclass("#singlemode", "off");
		}

		if (data.usersettings.nightmode) {
			dom.removeclass("#nightmode", "off");
			dom.addclass("#daymode", "off");
		} else {
			dom.addclass("#nightmode", "off");
			dom.removeclass("#daymode", "off");
		}

		if (data.usersettings.shownotes) {
			dom.removeclass("#shownotes", "off");
			dom.addclass("#hidenotes", "off");
		} else {
			dom.addclass("#shownotes", "off");
			dom.removeclass("#hidenotes", "off");
		}

		document.getElementById("daymode").onclick = function () {
			dom.removeclass("body", "nightmode");
			dom.addclass("#nightmode", "off");
			dom.removeclass("#daymode", "off");
			data.usersettings.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = function () {
			dom.addclass("body", "nightmode");
			dom.removeclass("#nightmode", "off");
			dom.addclass("#daymode", "off");
			data.usersettings.nightmode = true;
		};
		if (document.getElementById("singlemode") !== null) {
			document.getElementById("singlemode").onclick = function () {
				dom.removeclass("body", "twinmode");
				dom.addclass("#twinmode", "off");
				dom.removeclass("#singlemode", "off");
				data.usersettings.twinmode = false;
			};
			document.querySelector("#twinmode").onclick = function () {
				dom.addclass("body", "twinmode");
				dom.removeclass("#twinmode", "off");
				dom.addclass("#singlemode", "off");
				data.usersettings.twinmode = true;
			};
		}

		// show/hide notes

		document.querySelector("#hidenotes").onclick = function () {
			dom.addclass("body", "hidenotes");
			dom.addclass("#shownotes", "off");
			dom.removeclass("#hidenotes", "off");
		};
		document.querySelector("#shownotes").onclick = function () {
			dom.removeclass("body", "hidenotes");
			dom.addclass("#hidenotes", "off");
			dom.removeclass("#shownotes", "off");
		};

		document.getElementById("backbutton").onclick = function () {
			if (data.currentpage == "help" || data.currentpage == "about") {
				data.watch.setpage = "settings";
			} else {
				data.watch.setpage = "lens";
			}
		};

		// set up about page

		document.getElementById("abouttext").innerHTML = data.description; // set up about page

		for (var i = 0; i < data.versionhistory.length; i++) {
			document.getElementById("versionhistory").innerHTML += "<li>" + data.versionhistory[i] + "</li>";
		}
		document.getElementById("comingsoon").innerHTML = data.comingsoon;
	},
	notes: function notes() {
		data.elements.main.onclick = function () {
			_notes.hide();
		};

		for (var i = 0; i < data.textdata.length; i++) {
			var thisnotes = data.textdata[i].notes;
			if (typeof thisnotes !== "undefined") {
				console.log("Inserting notes for " + data.textdata[i].translationid);
				for (var j = 0; j < thisnotes.length; j++) {
					for (var k = 0; k < thisnotes[j].length; k++) {
						var thisnote = thisnotes[j][k];
						if (data.textdata[i].text[j].indexOf("{{" + thisnote.noteno + "}}") > 0) {
							var copy = data.textdata[i].text[j].replace("{{" + thisnote.noteno + "}}", "<span class=\"note\"><span class=\"noteno\">" + (k + 1) + "</span><span class=\"notetext\">" + thisnote.notetext + "</span></span>");
							data.textdata[i].text[j] = copy;
						} else {
							console.log("Not found in canto " + j + ": " + thisnote.noteno + ": " + thisnote.notetext);
						}
					}
				}
			}
		}
	},
	swiping: function swiping() {
		// swipe controls
		data.elements.hammerright = new Hammer(data.lens.right.slider, {
			touchAction: 'auto'
		});
		data.elements.hammerleft = new Hammer(data.lens.left.slider, {
			touchAction: 'auto'
		});
		data.elements.hammerright.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		data.elements.hammerright.on('swipeleft', function (e) {
			e.preventDefault();
			data.watch.setlens = {
				translation: helpers.nexttrans(data.lens.right.translation),
				canto: data.canto,
				side: "right",
				percentage: 999,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.nexttrans(data.lens.right.translation),data.canto,"right");
		}).on('swiperight', function (e) {
			e.preventDefault();
			data.watch.setlens = {
				translation: helpers.prevtrans(data.lens.right.translation),
				canto: data.canto,
				side: "right",
				percentage: 999,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.prevtrans(data.lens.right.translation),data.canto,"right");
		});

		data.elements.hammerright.on('swipedown', function () {
			// e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if (data.lens.right.text.scrollTop === 0) {
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					percentage: 1, // this needs to be at the bottom
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto-1,"right",1);  // this needs to be at the bottom!
			}
		}).on('swipeup', function (e) {
			e.preventDefault();
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one
			if (Math.abs(data.lens.right.text.scrollTop + data.lens.right.text.clientHeight - data.lens.right.text.scrollHeight) < 4) {
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto + 1,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto+1,"right");
			}
		});
		data.elements.hammerleft.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		data.elements.hammerleft.on('swipeleft', function (e) {
			e.preventDefault();
			data.watch.setlens = {
				translation: helpers.nexttrans(data.lens.left.translation),
				canto: data.canto,
				side: "left",
				percentage: 999,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.nexttrans(data.lens.left.translation),data.canto,"left");
		}).on('swiperight', function (e) {
			e.preventDefault();
			data.watch.setlens = {
				translation: helpers.prevtrans(data.lens.left.translation),
				canto: data.canto,
				side: "left",
				percentage: 999,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.prevtrans(data.lens.left.translation),data.canto,"left");
		});

		data.elements.hammerleft.on('swipedown', function () {
			// e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if (data.lens.left.text.scrollTop === 0) {
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					percentage: 1, // this needs to be at the bottom
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto-1,"right",1);  // this needs to be at the bottom!
			}
		}).on('swipeup', function (e) {
			e.preventDefault();
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one
			if (Math.abs(data.lens.left.text.scrollTop + data.lens.left.text.clientHeight - data.lens.left.text.scrollHeight) < 4) {
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto + 1,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto+1,"right");
			}
		});
	},
	keys: function keys() {
		// key controls

		document.body.onkeydown = function (e) {
			e.preventDefault();
			if ((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev", "on");
				data.watch.setlens = {
					translation: helpers.prevtrans(data.lens.right.translation),
					canto: data.canto,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(helpers.prevtrans(data.lens.right.translation),data.canto,"right");
			}
			if ((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext", "on");
				data.watch.setlens = {
					translation: helpers.nexttrans(data.lens.right.translation),
					canto: data.canto,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(helpers.nexttrans(data.lens.right.translation),data.canto,"right");
			}
			if ((e.keyCode || e.which) === 38) {
				dom.addclass("#navup", "on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					// percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto-1,"right");
			}
			if ((e.keyCode || e.which) === 40) {
				dom.addclass("#navdown", "on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto + 1,
					side: "right",
					percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto+1,"right",0);
			}

			if ((e.keyCode || e.which) === 33) {
				// pageup: right now this goes to the previous canto
				dom.addclass("#navup", "on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto-1,"right");
			}
			if ((e.keyCode || e.which) === 34) {
				// pagedown: right now this goes to the next canto
				dom.addclass("#navdown", "on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto + 1,
					side: "right",
					percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto+1,"right",0);
			}

			if ((e.keyCode || e.which) === 36) {
				// home: right now this goes to the first canto
				dom.addclass("#navup", "on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: 0,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,0,"right");
			}
			if ((e.keyCode || e.which) === 35) {
				// end: right now this goes to the last canto
				dom.addclass("#navdown", "on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.cantocount-1,"right",0);
			}
		};
	}
};

module.exports = controls;

/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// setlens.js
//
// This module switches to a different translation/canto



var Velocity = __webpack_require__(74);

var helpers = __webpack_require__(5); // .gettranslationindex
var dom = __webpack_require__(1);
var fixpadding = __webpack_require__(18);
var notes = __webpack_require__(20);
var localdata = __webpack_require__(19);

var data = __webpack_require__(0);

var setlens = {
	go: function go(newtrans, newcanto, side, percentage) {

		// potential problem: when this is called without percentage. Right now I'm doing this by setting percentage to 999
		// maybe percentage should be set to NaN?

		console.log("\nSetlens called for " + newtrans + ", canto " + newcanto + ", " + side);

		// if page isn't set to "lens" this doesn't do anything

		if (data.currentpage == "lens") {
			(function () {

				var changetrans = void 0,
				    changecanto = false;
				var thisside = data.lens[side];
				var otherside = side == "right" ? data.lens.left : data.lens.right;
				var other = side == "right" ? "left" : "right";
				//		dom.removebyselector("#oldtextleft"); // attempt to fix flickering if too fast change
				//		dom.removebyselector("#oldtextright"); // attempt to fix flickering if too fast change

				var oldtransindex = data.currenttranslationlist.indexOf(thisside.translation); // the number of the old translation in current list
				var newtransindex = data.currenttranslationlist.indexOf(newtrans); // the number of the trans we're going to in currentlist

				if (newcanto !== data.canto) {
					changecanto = true;
					if (newcanto >= data.cantocount) {
						newcanto = 0;
					} else {
						if (newcanto < 0) {
							newcanto = data.cantocount - 1;
						}
					}
				}

				if (newtransindex - oldtransindex !== 0) {
					changetrans = true;
					percentage = thisside.text.scrollTop /*+ thisside.text.clientHeight*/ / thisside.text.scrollHeight;
					console.log("\u2014>Current percentage: " + percentage);
				}

				// need to figure which translationdata we need from master list of translations

				var othertranslationindex = 0;
				var newtranslationindex = helpers.gettranslationindex(newtrans);
				var oldtranslationindex = helpers.gettranslationindex(thisside.translation);
				if (data.usersettings.twinmode) {
					othertranslationindex = helpers.gettranslationindex(otherside.translation);
				}

				if (changetrans) {

					console.log("Changing translation!");

					// changing translation

					thisside.text.id = "oldtext" + side;
					var direction = 0;

					// if new is bigger than old AND ( old is not 0 OR new is not the last one )
					// OR if new is 0 and old is the last one

					if (newtransindex > oldtransindex && (oldtransindex > 0 || newtransindex !== data.currenttranslationlist.length - 1) || newtransindex == 0 && oldtransindex == data.currenttranslationlist.length - 1) {

						// we are inserting to the right

						var insert = dom.create("<div id=\"newtext" + side + "\" class=\"textframe " + data.translationdata[newtranslationindex].translationclass + "\" style=\"left:100%;\"><div class=\"textinsideframe\">" + data.textdata[newtranslationindex].text[newcanto] + "</div></div>");
						thisside.slider.appendChild(insert);
						if (data.usersettings.twinmode) {
							direction = "-50%";
						} else {
							direction = "-100%";
						}
					} else {

						// we are inserting to the left

						var _insert = dom.create("<div id=\"newtext" + side + "\" class=\"textframe " + data.translationdata[newtranslationindex].translationclass + "\" style=\"left:-100%;\"><div class=\"textinsideframe\">" + data.textdata[newtranslationindex].text[newcanto] + "</div></div>");
						thisside.slider.insertBefore(_insert, thisside.slider.childNodes[0]);
						if (data.usersettings.twinmode) {
							direction = "50%";
						} else {
							direction = "100%";
						}
					}

					otherside.slider.style.zIndex = 500;
					Velocity(thisside.slider, { 'left': direction }, {
						duration: data.system.delay,
						mobileHA: false,
						complete: function complete() {
							dom.removebyselector("#oldtext" + side);
							otherside.slider.style.zIndex = 1;
							thisside.slider.style.left = "0";
							thisside.text.style.left = "0";
							dom.addclass("#slider" + side + " .textframe", "makescroll");
						}
					});
					thisside.text = document.querySelector("#newtext" + side);
					thisside.textinside = document.querySelector("#newtext" + side + " .textinsideframe");
					thisside.translation = newtrans;

					// this method still isn't great! it tries to round to current lineheight
					// to avoid cutting off lines

					var scrollto = setlens.rounded(percentage * document.querySelector("#newtext" + side).scrollHeight);
					document.querySelector("#newtext" + side).scrollTop = scrollto;
					if (data.usersettings.twinmode) {
						var _scrollto = setlens.rounded(percentage * document.querySelector("#newtext" + other).scrollHeight);
						document.querySelector("#newtext" + other).scrollTop = _scrollto;
					}
					console.log("Scrolling to:" + scrollto);
					if (data.usersettings.twinmode) {
						setlens.turnonsynchscrolling();
					}
				}

				if (changecanto || !changetrans) {

					// we are either changing canto OR this is the first run

					if (data.usersettings.twinmode) {
						document.querySelector("#slider" + other + " .textinsideframe").innerHTML = data.textdata[othertranslationindex].text[newcanto];
						dom.removeclass("#slider" + other + " .textframe", data.translationdata[othertranslationindex].translationclass);
						dom.addclass("#slider" + other + " .textframe", data.translationdata[othertranslationindex].translationclass);
						document.querySelector("#slider" + side + " .textinsideframe").innerHTML = data.textdata[newtranslationindex].text[newcanto];
						dom.removeclass("#slider" + side + " .textframe", data.translationdata[oldtranslationindex].translationclass);
						dom.addclass("#slider" + side + " .textframe", data.translationdata[newtranslationindex].translationclass);
					} else {
						document.querySelector("#slider" + side + " .textinsideframe").innerHTML = data.textdata[newtranslationindex].text[newcanto];
						dom.removeclass("#slider" + side + " .textframe", data.translationdata[oldtranslationindex].translationclass); // is this not working for multiple classes?
						dom.addclass("#slider" + side + " .textframe", data.translationdata[newtranslationindex].translationclass); // is this not working for multiple classes?
					}
					data.canto = newcanto;

					if (percentage > 0 && percentage !== 999) {
						document.querySelector("#newtext" + side).scrollTop = document.querySelector("#newtext" + side).scrollHeight;
						if (data.usersettings.twinmode) {
							document.querySelector("#newtext" + other).scrollTop = document.querySelector("#newtext" + other).scrollHeight;
						}
					} else {
						document.querySelector("#newtext" + side).scrollTop = 0;
						if (data.usersettings.twinmode) {
							document.querySelector("#newtext" + other).scrollTop = 0;
						}
					}
				}

				if (data.system.responsive) {
					fixpadding.responsive(thisside);
					if (data.usersettings.twinmode) {
						fixpadding.responsive(otherside);
					}
				} else {
					fixpadding.regular(thisside);
					if (data.usersettings.twinmode) {
						fixpadding.regular(otherside);
					}
				}

				// deal with title bar

				if (data.canto > 0) {
					thisside.titlebar.innerHTML = data.translationdata[newtranslationindex].translationshortname + " \xB7 <strong>Canto " + data.canto + "</strong>";
					if (data.usersettings.twinmode) {
						if (data.usersettings.twinmode) {
							otherside.titlebar.innerHTML = data.translationdata[othertranslationindex].translationshortname + " \xB7 <strong>Canto " + data.canto + "</strong>";
						}
					}
				} else {
					thisside.titlebar.innerHTML = "&nbsp;";
					if (data.usersettings.twinmode) {
						otherside.titlebar.innerHTML = "&nbsp;";
					}
				}

				// set up notes

				notes.setup();

				// turn on synch scrolling

				if (data.usersettings.twinmode) {
					setlens.turnonsynchscrolling();
				}

				// record changes

				localdata.save();
			})();
		}
	},
	rounded: function rounded(pixels) {

		// this is still a mess, fix this

		return data.lens.right.lineheight * Math.floor(pixels / data.lens.right.lineheight);
	},
	turnonsynchscrolling: function turnonsynchscrolling() {
		document.querySelector("#sliderleft .textframe").onscroll = function () {
			var percentage = this.scrollTop / this.scrollHeight * document.querySelector("#sliderright .textframe").scrollHeight;
			document.querySelector("#sliderright .textframe").scrollTop = percentage;
		};
		document.querySelector("#sliderright .textframe").onscroll = function () {
			var percentage = this.scrollTop / this.scrollHeight * document.querySelector("#sliderleft .textframe").scrollHeight;
			document.querySelector("#sliderleft .textframe").scrollTop = percentage;
		};
	}

};

module.exports = setlens;

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
//setpage.js
//
// this module changes page in the app



var dom = __webpack_require__(1);
var resize = __webpack_require__(11);
var data = __webpack_require__(0);

var setpage = function setpage(newpage) {
	// console.log("Setpage called for: "+newpage);
	dom.removeclass(".page", "on");
	dom.addclass(".page#" + newpage, "on");
	data.currentpage = newpage;
	if (newpage !== "lens") {
		// set title to be whatever the h1 is

		var newtitle = document.querySelector("#" + newpage + " h1").innerHTML;
		data.elements.titlebar.innerHTML = newtitle;
		dom.addclass("nav#navbarleft", "off");
		dom.addclass("nav#navbarright", "off");

		dom.addclass("#navbarother", "on");

		// make back button on left of nav bar visible!
	} else {
		dom.removeclass("nav#navbarleft", "off");
		dom.removeclass("nav#navbarright", "off");

		dom.removeclass("#navbarother", "on");

		// hide back button on left of nav bar!

		resize.check();
	}
};

module.exports = setpage;

/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// settings.js
//
// this controls everything that happens on the settings page



var _getIterator2 = __webpack_require__(39);

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var data = __webpack_require__(0);
var dom = __webpack_require__(1);

var settings = {
	checkboxgo: function checkboxgo(el) {
		el.onclick = function () {
			settings.changetranslation(this.id.replace("check-", ""), document.getElementById(this.id).checked);
		};
	},
	checkboxspango: function checkboxspango(el) {
		el.onclick = function () {
			document.getElementById("check-" + this.id).checked = !document.getElementById("check-" + this.id).checked;
			settings.changetranslation(this.id, document.getElementById("check-" + this.id).checked);
		};
	},
	changetranslation: function changetranslation(thisid, isset) {
		var _iteratorNormalCompletion = true;
		var _didIteratorError = false;
		var _iteratorError = undefined;

		try {
			for (var _iterator = (0, _getIterator3.default)(data.translationdata), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
				var i = _step.value;

				if (thisid == data.translationdata[i].translationid) {
					if (isset) {
						data.currenttranslationlist.push(thisid);
						data.translationcount++;
					} else {
						if (data.translationcount > 1) {
							var j = data.currenttranslationlist.indexOf(thisid);
							if (j > -1) {
								data.currenttranslationlist.splice(j, 1);
							}
							data.translationcount--;
						} else {
							// there's only one translation in the list, do not delete last
							document.getElementById("check-" + thisid.toLowerCase()).checked = true;
						}
					}
				}
				data.watch.localsave = !data.watch.localsave;
				// app.localdata.save();
			}
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

		var newlist = [];
		var _iteratorNormalCompletion2 = true;
		var _didIteratorError2 = false;
		var _iteratorError2 = undefined;

		try {
			for (var _iterator2 = (0, _getIterator3.default)(data.translationdata), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
				var _i = _step2.value;

				if (data.currenttranslationlist.indexOf(data.translationdata[_i].translationid) > -1) {
					newlist.push(data.translationdata[_i].translationid);
				}
			}
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

		data.currenttranslationlist = newlist.slice();

		if (data.currenttranslationlist.indexOf(data.lens.right.translation) < 0) {
			data.lens.right.translation = data.currenttranslationlist[0];
		}

		settings.update();
	},
	update: function update() {
		// fired whenever we go to settings page

		// add in translation chooser

		dom.removebyselector("#translatorlist");
		var insert = dom.create('<ul id="translatorlist"></ul>');
		document.getElementById("translationchoose").appendChild(insert);
		var translatorlist = document.querySelector("#translatorlist");
		for (var i = 0; i < data.translationdata.length; i++) {
			insert = dom.create("<li>\n\t\t\t\t\t<input type=\"checkbox\" id=\"check-" + data.translationdata[i].translationid + "\" />\n\t\t\t\t\t<label for=\"" + data.translationdata[i].translationid + "\" id=\"" + data.translationdata[i].translationid + "\" ><span><span></span></span>" + data.translationdata[i].translationfullname + "</label>\n\t\t\t\t</li>");
			translatorlist.appendChild(insert);
			document.getElementById("check-" + data.translationdata[i].translationid).checked = data.currenttranslationlist.indexOf(data.translationdata[i].translationid) > -1;
		}

		var inputcheckbox = document.querySelectorAll("#translatorlist input[type=checkbox]");
		for (var _i2 = 0; _i2 < inputcheckbox.length; _i2++) {
			settings.checkboxgo(inputcheckbox[_i2]);
		}
		var translatorlistlabel = document.querySelectorAll("#translatorlist label");
		for (var _i3 = 0; _i3 < translatorlistlabel.length; _i3++) {
			settings.checkboxspango(translatorlistlabel[_i3]);
		}

		// add in toc

		dom.removebyselector("#selectors");
		insert = dom.create("<div id=\"selectors\">\n\t\t\t\t<p>Canto: <select id=\"selectcanto\"></select></p>\n\t\t\t\t<p>Translation: <select id=\"selecttranslator\"></select></p>\n\t\t\t\t<p><span id=\"selectgo\">Go</span></p>\n\t\t\t</div>");
		document.getElementById("translationgo").appendChild(insert);
		for (var _i4 = 0; _i4 < data.cantocount; _i4++) {
			insert = dom.create("<option id=\"canto" + _i4 + "\" " + (data.canto == _i4 ? "selected" : "") + ">" + data.cantotitles[_i4] + "</option>");
			document.getElementById("selectcanto").appendChild(insert);
		}
		for (var _i5 = 0; _i5 < data.currenttranslationlist.length; _i5++) {
			for (var j = 0; j < data.translationdata.length; j++) {
				if (data.translationdata[j].translationid === data.currenttranslationlist[_i5]) {
					insert = dom.create("<option id=\"tr_" + data.translationdata[j].translationid + "\" " + (data.currenttranslationlist.indexOf(data.lens.right.translation) == _i5 ? "selected" : "") + ">" + data.translationdata[j].translationfullname + "</option>");
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = function () {
			var selected = document.getElementById("selecttranslator");
			var thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			var thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for (var _j = 0; _j < data.translationdata.length; _j++) {
				if (data.currenttranslationlist[_j] == thistrans) {
					data.watch.setpage = "lens";
					data.watch.setlens = {
						translation: data.currenttranslationlist[_j], thiscanto: thiscanto,
						canto: thiscanto,
						side: "right",
						percentage: 0,
						trigger: !data.watch.setlens.trigger
					};
					// app.setlens(data.currenttranslationlist[j],thiscanto,"right",0);
				}
			}
		};
	}
};

module.exports = settings;

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = { "default": __webpack_require__(41), __esModule: true };

/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = { "default": __webpack_require__(42), __esModule: true };

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(70);
__webpack_require__(69);
module.exports = __webpack_require__(67);

/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

var core  = __webpack_require__(7)
  , $JSON = core.JSON || (core.JSON = {stringify: JSON.stringify});
module.exports = function stringify(it){ // eslint-disable-line no-unused-vars
  return $JSON.stringify.apply($JSON, arguments);
};

/***/ }),
/* 43 */
/***/ (function(module, exports) {

module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};

/***/ }),
/* 44 */
/***/ (function(module, exports) {

module.exports = function(){ /* empty */ };

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = __webpack_require__(17)
  , toLength  = __webpack_require__(63)
  , toIndex   = __webpack_require__(62);
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = __webpack_require__(21)
  , TAG = __webpack_require__(3)('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function(it, key){
  try {
    return it[key];
  } catch(e){ /* empty */ }
};

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

// optional / simple context binding
var aFunction = __webpack_require__(43);
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

var global    = __webpack_require__(2)
  , core      = __webpack_require__(7)
  , ctx       = __webpack_require__(47)
  , hide      = __webpack_require__(4)
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE]
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(a, b, c){
        if(this instanceof C){
          switch(arguments.length){
            case 0: return new C;
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if(IS_PROTO){
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;

/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(2).document && document.documentElement;

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = !__webpack_require__(8) && !__webpack_require__(24)(function(){
  return Object.defineProperty(__webpack_require__(22)('div'), 'a', {get: function(){ return 7; }}).a != 7;
});

/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = __webpack_require__(21);
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};

/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var create         = __webpack_require__(55)
  , descriptor     = __webpack_require__(26)
  , setToStringTag = __webpack_require__(27)
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
__webpack_require__(4)(IteratorPrototype, __webpack_require__(3)('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};

/***/ }),
/* 53 */
/***/ (function(module, exports) {

module.exports = function(done, value){
  return {value: value, done: !!done};
};

/***/ }),
/* 54 */
/***/ (function(module, exports) {

module.exports = true;

/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject    = __webpack_require__(6)
  , dPs         = __webpack_require__(56)
  , enumBugKeys = __webpack_require__(23)
  , IE_PROTO    = __webpack_require__(15)('IE_PROTO')
  , Empty       = function(){ /* empty */ }
  , PROTOTYPE   = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = __webpack_require__(22)('iframe')
    , i      = enumBugKeys.length
    , lt     = '<'
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  __webpack_require__(49).appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties){
  var result;
  if(O !== null){
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty;
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

var dP       = __webpack_require__(14)
  , anObject = __webpack_require__(6)
  , getKeys  = __webpack_require__(59);

module.exports = __webpack_require__(8) ? Object.defineProperties : function defineProperties(O, Properties){
  anObject(O);
  var keys   = getKeys(Properties)
    , length = keys.length
    , i = 0
    , P;
  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has         = __webpack_require__(9)
  , toObject    = __webpack_require__(64)
  , IE_PROTO    = __webpack_require__(15)('IE_PROTO')
  , ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function(O){
  O = toObject(O);
  if(has(O, IE_PROTO))return O[IE_PROTO];
  if(typeof O.constructor == 'function' && O instanceof O.constructor){
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

var has          = __webpack_require__(9)
  , toIObject    = __webpack_require__(17)
  , arrayIndexOf = __webpack_require__(45)(false)
  , IE_PROTO     = __webpack_require__(15)('IE_PROTO');

module.exports = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = __webpack_require__(58)
  , enumBugKeys = __webpack_require__(23);

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};

/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(4);

/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(16)
  , defined   = __webpack_require__(12);
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(16)
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.15 ToLength
var toInteger = __webpack_require__(16)
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.13 ToObject(argument)
var defined = __webpack_require__(12);
module.exports = function(it){
  return Object(defined(it));
};

/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = __webpack_require__(13);
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};

/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

var classof   = __webpack_require__(46)
  , ITERATOR  = __webpack_require__(3)('iterator')
  , Iterators = __webpack_require__(10);
module.exports = __webpack_require__(7).getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__(6)
  , get      = __webpack_require__(66);
module.exports = __webpack_require__(7).getIterator = function(it){
  var iterFn = get(it);
  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
  return anObject(iterFn.call(it));
};

/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var addToUnscopables = __webpack_require__(44)
  , step             = __webpack_require__(53)
  , Iterators        = __webpack_require__(10)
  , toIObject        = __webpack_require__(17);

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = __webpack_require__(25)(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $at  = __webpack_require__(61)(true);

// 21.1.3.27 String.prototype[@@iterator]()
__webpack_require__(25)(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});

/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(68);
var global        = __webpack_require__(2)
  , hide          = __webpack_require__(4)
  , Iterators     = __webpack_require__(10)
  , TO_STRING_TAG = __webpack_require__(3)('toStringTag');

for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
  var NAME       = collections[i]
    , Collection = global[NAME]
    , proto      = Collection && Collection.prototype;
  if(proto && !proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
  Iterators[NAME] = Iterators.Array;
}

/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;;(function () {
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


	if (true) {

		// AMD. Register as an anonymous module.
		!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
			return FastClick;
		}.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());


/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/*! Hammer.JS - v2.0.7 - 2016-04-22
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

if (true) {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
        return Hammer;
    }.call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
} else if (typeof module != 'undefined' && module.exports) {
    module.exports = Hammer;
} else {
    window[exportName] = Hammer;
}

})(window, document, 'Hammer');


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/**
 * DEVELOPED BY
 * GIL LOPES BUENO
 * gilbueno.mail@gmail.com
 *
 * WORKS WITH:
 * IE8*, IE 9+, FF 4+, SF 5+, WebKit, CH 7+, OP 12+, BESEN, Rhino 1.7+
 * For IE8 (and other legacy browsers) WatchJS will use dirty checking  
 *
 * FORK:
 * https://github.com/melanke/Watch.JS
 */


(function (factory) {
    if (true) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        window.WatchJS = factory();
        window.watch = window.WatchJS.watch;
        window.unwatch = window.WatchJS.unwatch;
        window.callWatchers = window.WatchJS.callWatchers;
    }
}(function () {

    var WatchJS = {
        noMore: false,        // use WatchJS.suspend(obj) instead
        useDirtyCheck: false // use only dirty checking to track changes.
    },
    lengthsubjects = [];
    
    var dirtyChecklist = [];
    var pendingChanges = []; // used coalesce changes from defineProperty and __defineSetter__
    
    var supportDefineProperty = false;
    try {
        supportDefineProperty = Object.defineProperty && Object.defineProperty({},'x', {});
    } catch(ex) {  /* not supported */  }

    var isFunction = function (functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) == '[object Function]';
    };

    var isInt = function (x) {
        return x % 1 === 0;
    };

    var isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    var isObject = function(obj) {
        return {}.toString.apply(obj) === '[object Object]';
    };
    
    var getObjDiff = function(a, b){
        var aplus = [],
        bplus = [];

        if(!(typeof a == "string") && !(typeof b == "string")){

            if (isArray(a)) {
                for (var i=0; i<a.length; i++) {
                    if (b[i] === undefined) aplus.push(i);
                }
            } else {
                for(var i in a){
                    if (a.hasOwnProperty(i)) {
                        if(b[i] === undefined) {
                            aplus.push(i);
                        }
                    }
                }
            }

            if (isArray(b)) {
                for (var j=0; j<b.length; j++) {
                    if (a[j] === undefined) bplus.push(j);
                }
            } else {
                for(var j in b){
                    if (b.hasOwnProperty(j)) {
                        if(a[j] === undefined) {
                            bplus.push(j);
                        }
                    }
                }
            }
        }

        return {
            added: aplus,
            removed: bplus
        }
    };

    var clone = function(obj){

        if (null == obj || "object" != typeof obj) {
            return obj;
        }

        var copy = obj.constructor();

        for (var attr in obj) {
            copy[attr] = obj[attr];
        }

        return copy;        

    }

    var defineGetAndSet = function (obj, propName, getter, setter) {
        try {
            Object.observe(obj, function(changes) {
                changes.forEach(function(change) {
                    if (change.name === propName) {
                        setter(change.object[change.name]);
                    }
                });
            });            
        } 
        catch(e) {
            try {
                Object.defineProperty(obj, propName, {
                    get: getter,
                    set: function(value) {        
                        setter.call(this,value,true); // coalesce changes
                    },
                    enumerable: true,
                    configurable: true
                });
            } 
            catch(e2) {
                try{
                    Object.prototype.__defineGetter__.call(obj, propName, getter);
                    Object.prototype.__defineSetter__.call(obj, propName, function(value) {
                        setter.call(this,value,true); // coalesce changes
                    });
                } 
                catch(e3) {
                    observeDirtyChanges(obj,propName,setter);
                    //throw new Error("watchJS error: browser not supported :/")
                }
            }
        }
    };

    var defineProp = function (obj, propName, value) {
        try {
            Object.defineProperty(obj, propName, {
                enumerable: false,
                configurable: true,
                writable: false,
                value: value
            });
        } catch(error) {
            obj[propName] = value;
        }
    };

    var observeDirtyChanges = function(obj,propName,setter) {
        dirtyChecklist[dirtyChecklist.length] = {
            prop:       propName,
            object:     obj,
            orig:       clone(obj[propName]),
            callback:   setter
        }        
    }
    
    var watch = function () {

        if (isFunction(arguments[1])) {
            watchAll.apply(this, arguments);
        } else if (isArray(arguments[1])) {
            watchMany.apply(this, arguments);
        } else {
            watchOne.apply(this, arguments);
        }

    };


    var watchAll = function (obj, watcher, level, addNRemove) {

        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        if(isArray(obj)) {
            defineWatcher(obj, "__watchall__", watcher, level); // watch all changes on the array
            if (level===undefined||level > 0) {
                for (var prop = 0; prop < obj.length; prop++) { // watch objects in array
                   watchAll(obj[prop],watcher,level, addNRemove);
                }
            }
        } 
        else {
            var prop,props = [];
            for (prop in obj) { //for each attribute if obj is an object
                if (prop == "$val" || (!supportDefineProperty && prop === 'watchers')) {
                    continue;
                }

                if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                    props.push(prop); //put in the props
                }
            }
            watchMany(obj, props, watcher, level, addNRemove); //watch all items of the props
        }


        if (addNRemove) {
            pushToLengthSubjects(obj, "$$watchlengthsubjectroot", watcher, level);
        }
    };


    var watchMany = function (obj, props, watcher, level, addNRemove) {

        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        for (var i=0; i<props.length; i++) { //watch each property
            var prop = props[i];
            watchOne(obj, prop, watcher, level, addNRemove);
        }

    };

    var watchOne = function (obj, prop, watcher, level, addNRemove) {
        if ((typeof obj == "string") || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        if(isFunction(obj[prop])) { //dont watch if it is a function
            return;
        }
        if(obj[prop] != null && (level === undefined || level > 0)){
            watchAll(obj[prop], watcher, level!==undefined? level-1 : level); //recursively watch all attributes of this
        }

        defineWatcher(obj, prop, watcher, level);

        if(addNRemove && (level === undefined || level > 0)){
            pushToLengthSubjects(obj, prop, watcher, level);
        }

    };

    var unwatch = function () {

        if (isFunction(arguments[1])) {
            unwatchAll.apply(this, arguments);
        } else if (isArray(arguments[1])) {
            unwatchMany.apply(this, arguments);
        } else {
            unwatchOne.apply(this, arguments);
        }

    };

    var unwatchAll = function (obj, watcher) {

        if (obj instanceof String || (!(obj instanceof Object) && !isArray(obj))) { //accepts only objects and array (not string)
            return;
        }

        if (isArray(obj)) {
            var props = ['__watchall__'];
            for (var prop = 0; prop < obj.length; prop++) { //for each item if obj is an array
                props.push(prop); //put in the props
            }
            unwatchMany(obj, props, watcher); //watch all itens of the props
        } else {
            var unwatchPropsInObject = function (obj2) {
                var props = [];
                for (var prop2 in obj2) { //for each attribute if obj is an object
                    if (obj2.hasOwnProperty(prop2)) {
                        if (obj2[prop2] instanceof Object) {
                            unwatchPropsInObject(obj2[prop2]); //recurs into object props
                        } else {
                            props.push(prop2); //put in the props
                        }
                    }
                }
                unwatchMany(obj2, props, watcher); //unwatch all of the props
            };
            unwatchPropsInObject(obj);
        }
    };


    var unwatchMany = function (obj, props, watcher) {

        for (var prop2 in props) { //watch each attribute of "props" if is an object
            if (props.hasOwnProperty(prop2)) {
                unwatchOne(obj, props[prop2], watcher);
            }
        }
    };

    var timeouts = [],
        timerID = null;
    function clearTimerID() {
        timerID = null;
        for(var i=0; i< timeouts.length; i++) {
            timeouts[i]();
        }
        timeouts.length = 0;
    }
    var getTimerID= function () {
        if (!timerID)  {
            timerID = setTimeout(clearTimerID);
        }
        return timerID;
    }
    var registerTimeout = function(fn) { // register function to be called on timeout
        if (timerID==null) getTimerID();
        timeouts[timeouts.length] = fn;
    }
    
    // Track changes made to an array, object or an object's property 
    // and invoke callback with a single change object containing type, value, oldvalue and array splices
    // Syntax: 
    //      trackChange(obj, callback, recursive, addNRemove)
    //      trackChange(obj, prop, callback, recursive, addNRemove)
    var trackChange = function() {
        var fn = (isFunction(arguments[2])) ? trackProperty : trackObject ;
        fn.apply(this,arguments);
    }

    // track changes made to an object and invoke callback with a single change object containing type, value and array splices
    var trackObject= function(obj, callback, recursive, addNRemove) {
        var change = null,lastTimerID = -1;
        var isArr = isArray(obj);
        var level,fn = function(prop, action, newValue, oldValue) {
            var timerID = getTimerID();
            if (lastTimerID!==timerID) { // check if timer has changed since last update
                lastTimerID = timerID;
                change = {
                    type: 'update'
                }
                change['value'] = obj;
                change['splices'] = null;
                registerTimeout(function() {
                    callback.call(this,change);
                    change = null;
                });
            }
            // create splices for array changes
            if (isArr && obj === this && change !== null)  {                
                if (action==='pop'||action==='shift') {
                    newValue = [];
                    oldValue = [oldValue];
                }
                else if (action==='push'||action==='unshift') {
                    newValue = [newValue];
                    oldValue = [];
                }
                else if (action!=='splice') { 
                    return; // return here - for reverse and sort operations we don't need to return splices. a simple update will do
                }
                if (!change.splices) change.splices = [];
                change.splices[change.splices.length] = {
                    index: prop,
                    deleteCount: oldValue ? oldValue.length : 0,
                    addedCount: newValue ? newValue.length : 0,
                    added: newValue,
                    deleted: oldValue
                };
            }

        }  
        level = (recursive==true) ? undefined : 0;        
        watchAll(obj,fn, level, addNRemove);
    }
    
    // track changes made to the property of an object and invoke callback with a single change object containing type, value, oldvalue and splices
    var trackProperty = function(obj,prop,callback,recursive, addNRemove) { 
        if (obj && prop) {
            watchOne(obj,prop,function(prop, action, newvalue, oldvalue) {
                var change = {
                    type: 'update'
                }
                change['value'] = newvalue;
                change['oldvalue'] = oldvalue;
                if (recursive && isObject(newvalue)||isArray(newvalue)) {
                    trackObject(newvalue,callback,recursive, addNRemove);
                }               
                callback.call(this,change);
            },0)
            
            if (recursive && isObject(obj[prop])||isArray(obj[prop])) {
                trackObject(obj[prop],callback,recursive, addNRemove);
            }                           
        }
    }
    
    
    var defineWatcher = function (obj, prop, watcher, level) {
        var newWatcher = false;
        var isArr = isArray(obj);
        
        if (!obj.watchers) {
            defineProp(obj, "watchers", {});
            if (isArr) {
                // watch array functions
                watchFunctions(obj, function(index,action,newValue, oldValue) {
                    addPendingChange(obj, index, action,newValue, oldValue);
                    if (level !== 0 && newValue && (isObject(newValue) || isArray(newValue))) {
                        var i,n, ln, wAll, watchList = obj.watchers[prop];
                        if ((wAll = obj.watchers['__watchall__'])) {
                            watchList = watchList ? watchList.concat(wAll) : wAll;
                        }
                        ln = watchList ?  watchList.length : 0;
                        for (i = 0; i<ln; i++) {
                            if (action!=='splice') {
                                watchAll(newValue, watchList[i], (level===undefined)?level:level-1);
                            }
                            else {
                                // watch spliced values
                                for(n=0; n < newValue.length; n++) {
                                    watchAll(newValue[n], watchList[i], (level===undefined)?level:level-1);
                                }
                            }
                        }
                    }
                });
            }
        }

        if (!obj.watchers[prop]) {
            obj.watchers[prop] = [];
            if (!isArr) newWatcher = true;
        }

        for (var i=0; i<obj.watchers[prop].length; i++) {
            if(obj.watchers[prop][i] === watcher){
                return;
            }
        }

        obj.watchers[prop].push(watcher); //add the new watcher to the watchers array

        if (newWatcher) {
            var val = obj[prop];            
            var getter = function () {
                return val;                        
            };

            var setter = function (newval, delayWatcher) {
                var oldval = val;
                val = newval;                
                if (level !== 0 
                    && obj[prop] && (isObject(obj[prop]) || isArray(obj[prop]))
                    && !obj[prop].watchers) {
                    // watch sub properties
                    var i,ln = obj.watchers[prop].length; 
                    for(i=0; i<ln; i++) {
                        watchAll(obj[prop], obj.watchers[prop][i], (level===undefined)?level:level-1);
                    }
                }

                //watchFunctions(obj, prop);
                
                if (isSuspended(obj, prop)) {
                    resume(obj, prop);
                    return;
                }

                if (!WatchJS.noMore){ // this does not work with Object.observe
                    //if (JSON.stringify(oldval) !== JSON.stringify(newval)) {
                    if (oldval !== newval) {
                        if (!delayWatcher) {
                            callWatchers(obj, prop, "set", newval, oldval);
                        }
                        else {
                            addPendingChange(obj, prop, "set", newval, oldval);
                        }
                        WatchJS.noMore = false;
                    }
                }
            };

            if (WatchJS.useDirtyCheck) {
                observeDirtyChanges(obj,prop,setter);
            }
            else {
                defineGetAndSet(obj, prop, getter, setter);
            }
        }

    };

    var callWatchers = function (obj, prop, action, newval, oldval) {
        if (prop !== undefined) {
            var ln, wl, watchList = obj.watchers[prop];
            if ((wl = obj.watchers['__watchall__'])) {
                watchList = watchList ? watchList.concat(wl) : wl;
            }
            ln = watchList ? watchList.length : 0;
            for (var wr=0; wr< ln; wr++) {
                watchList[wr].call(obj, prop, action, newval, oldval);
            }
        } else {
            for (var prop in obj) {//call all
                if (obj.hasOwnProperty(prop)) {
                    callWatchers(obj, prop, action, newval, oldval);
                }
            }
        }
    };

    var methodNames = ['pop', 'push', 'reverse', 'shift', 'sort', 'slice', 'unshift', 'splice'];
    var defineArrayMethodWatcher = function (obj, original, methodName, callback) {
        defineProp(obj, methodName, function () {
            var index = 0;
            var i,newValue, oldValue, response;                        
            // get values before splicing array 
            if (methodName === 'splice') {
               var start = arguments[0];
               var end = start + arguments[1];
               oldValue = obj.slice(start,end);
               newValue = [];
               for(i=2;i<arguments.length;i++) {
                   newValue[i-2] = arguments[i];
               }
               index = start;
            } 
            else {
                newValue = arguments.length > 0 ? arguments[0] : undefined;
            } 

            response = original.apply(obj, arguments);
            if (methodName !== 'slice') {
                if (methodName === 'pop') {
                    oldValue = response;
                    index = obj.length;
                }
                else if (methodName === 'push') {
                    index = obj.length-1;
                }
                else if (methodName === 'shift') {
                    oldValue = response;
                }
                else if (methodName !== 'unshift' && newValue===undefined) {
                    newValue = response;
                }
                callback.call(obj, index, methodName,newValue, oldValue)
            }
            return response;
        });
    };

    var watchFunctions = function(obj, callback) {

        if (!isFunction(callback) || !obj || (obj instanceof String) || (!isArray(obj))) {
            return;
        }

        for (var i = methodNames.length, methodName; i--;) {
            methodName = methodNames[i];
            defineArrayMethodWatcher(obj, obj[methodName], methodName, callback);
        }

    };

    var unwatchOne = function (obj, prop, watcher) {
        if (prop) {
            if (obj.watchers[prop]) {
                if (watcher===undefined) {
                    delete obj.watchers[prop]; // remove all property watchers
                }
                else {
                    for (var i=0; i<obj.watchers[prop].length; i++) {
                        var w = obj.watchers[prop][i];
                        if (w == watcher) {
                            obj.watchers[prop].splice(i, 1);
                        }
                    }
                }
            }
        }
        else
        {
            delete obj.watchers;
        }
        removeFromLengthSubjects(obj, prop, watcher);
        removeFromDirtyChecklist(obj, prop);
    };
    
    // suspend watchers until next update cycle
    var suspend = function(obj, prop) {
        if (obj.watchers) {
            var name = '__wjs_suspend__'+(prop!==undefined ? prop : '');
            obj.watchers[name] = true;
        }
    }
    
    var isSuspended = function(obj, prop) {
        return obj.watchers 
               && (obj.watchers['__wjs_suspend__'] || 
                   obj.watchers['__wjs_suspend__'+prop]);
    }
    
    // resumes preivously suspended watchers
    var resume = function(obj, prop) {
        registerTimeout(function() {
            delete obj.watchers['__wjs_suspend__'];
            delete obj.watchers['__wjs_suspend__'+prop];
        })
    }

    var pendingTimerID = null;
    var addPendingChange = function(obj,prop, mode, newval, oldval) {
        pendingChanges[pendingChanges.length] = {
            obj:obj,
            prop: prop,
            mode: mode,
            newval: newval,
            oldval: oldval
        };
        if (pendingTimerID===null) {
            pendingTimerID = setTimeout(applyPendingChanges);
        }
    };
    
    
    var applyPendingChanges = function()  {
        // apply pending changes
        var change = null;
        pendingTimerID = null;
        for(var i=0;i < pendingChanges.length;i++) {
            change = pendingChanges[i];
            callWatchers(change.obj, change.prop, change.mode, change.newval, change.oldval);
        }
        if (change) {
            pendingChanges = [];
            change = null;
        }        
    }

    var loop = function(){

        // check for new or deleted props
        for(var i=0; i<lengthsubjects.length; i++) {

            var subj = lengthsubjects[i];

            if (subj.prop === "$$watchlengthsubjectroot") {

                var difference = getObjDiff(subj.obj, subj.actual);

                if(difference.added.length || difference.removed.length){
                    if(difference.added.length){
                        watchMany(subj.obj, difference.added, subj.watcher, subj.level - 1, true);
                    }

                    subj.watcher.call(subj.obj, "root", "differentattr", difference, subj.actual);
                }
                subj.actual = clone(subj.obj);


            } else {

                var difference = getObjDiff(subj.obj[subj.prop], subj.actual);

                if(difference.added.length || difference.removed.length){
                    if(difference.added.length){
                        for (var j=0; j<subj.obj.watchers[subj.prop].length; j++) {
                            watchMany(subj.obj[subj.prop], difference.added, subj.obj.watchers[subj.prop][j], subj.level - 1, true);
                        }
                    }

                    callWatchers(subj.obj, subj.prop, "differentattr", difference, subj.actual);
                }

                subj.actual = clone(subj.obj[subj.prop]);

            }

        }
        
        // start dirty check
        var n, value;
        if (dirtyChecklist.length > 0) {
            for (var i = 0; i < dirtyChecklist.length; i++) {
                n = dirtyChecklist[i];
                value = n.object[n.prop];
                if (!compareValues(n.orig, value)) {
                    n.orig = clone(value);
                    n.callback(value);
                }
            }
        }

    };

    var compareValues =  function(a,b) {
        var i, state = true;
        if (a!==b)  {
            if (isObject(a)) {
                for(i in a) {
                    if (!supportDefineProperty && i==='watchers') continue;
                    if (a[i]!==b[i]) {
                        state = false;
                        break;
                    };
                }
            }
            else {
                state = false;
            }
        }
        return state;
    }
    
    var pushToLengthSubjects = function(obj, prop, watcher, level){

        var actual;

        if (prop === "$$watchlengthsubjectroot") {
            actual =  clone(obj);
        } else {
            actual = clone(obj[prop]);
        }

        lengthsubjects.push({
            obj: obj,
            prop: prop,
            actual: actual,
            watcher: watcher,
            level: level
        });
    };

    var removeFromLengthSubjects = function(obj, prop, watcher){
        for (var i=0; i<lengthsubjects.length; i++) {
            var subj = lengthsubjects[i];

            if (subj.obj == obj) {
                if (!prop || subj.prop == prop) {
                    if (!watcher || subj.watcher == watcher) {
                        // if we splice off one item at position i
                        // we need to decrement i as the array is one item shorter
                        // so when we increment i in the loop statement we
                        // will land at the correct index.
                        // if it's not decremented, you won't delete all length subjects
                        lengthsubjects.splice(i--, 1);
                    }
                }
            }
        }

    };
    
    var removeFromDirtyChecklist = function(obj, prop){
        var notInUse;
        for (var i=0; i<dirtyChecklist.length; i++) {
            var n = dirtyChecklist[i];
            var watchers = n.object.watchers;
            notInUse = (
                n.object == obj 
                && (!prop || n.prop == prop)
                && watchers
                && (!prop || !watchers[prop] || watchers[prop].length == 0 )
            );
            if (notInUse)  {
                // we use the same syntax as in removeFromLengthSubjects
                dirtyChecklist.splice(i--, 1);
            }
        }

    };    

    setInterval(loop, 50);

    WatchJS.watch = watch;
    WatchJS.unwatch = unwatch;
    WatchJS.callWatchers = callWatchers;
    WatchJS.suspend = suspend; // suspend watchers    
    WatchJS.onChange = trackChange;  // track changes made to object or  it's property and return a single change object

    return WatchJS;

}));


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;/*! VelocityJS.org (1.4.3). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */

/*************************
 Velocity jQuery Shim
 *************************/

/*! VelocityJS.org jQuery Shim (1.0.1). (C) 2014 The jQuery Foundation. MIT @license: en.wikipedia.org/wiki/MIT_License. */

/* This file contains the jQuery functions that Velocity relies on, thereby removing Velocity's dependency on a full copy of jQuery, and allowing it to work in any environment. */
/* These shimmed functions are only used if jQuery isn't present. If both this shim and jQuery are loaded, Velocity defaults to jQuery proper. */
/* Browser support: Using this shim instead of jQuery proper removes support for IE8. */

(function(window) {
	"use strict";
	/***************
	 Setup
	 ***************/

	/* If jQuery is already loaded, there's no point in loading this shim. */
	if (window.jQuery) {
		return;
	}

	/* jQuery base. */
	var $ = function(selector, context) {
		return new $.fn.init(selector, context);
	};

	/********************
	 Private Methods
	 ********************/

	/* jQuery */
	$.isWindow = function(obj) {
		/* jshint eqeqeq: false */
		return obj && obj === obj.window;
	};

	/* jQuery */
	$.type = function(obj) {
		if (!obj) {
			return obj + "";
		}

		return typeof obj === "object" || typeof obj === "function" ?
				class2type[toString.call(obj)] || "object" :
				typeof obj;
	};

	/* jQuery */
	$.isArray = Array.isArray || function(obj) {
		return $.type(obj) === "array";
	};

	/* jQuery */
	function isArraylike(obj) {
		var length = obj.length,
				type = $.type(obj);

		if (type === "function" || $.isWindow(obj)) {
			return false;
		}

		if (obj.nodeType === 1 && length) {
			return true;
		}

		return type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj;
	}

	/***************
	 $ Methods
	 ***************/

	/* jQuery: Support removed for IE<9. */
	$.isPlainObject = function(obj) {
		var key;

		if (!obj || $.type(obj) !== "object" || obj.nodeType || $.isWindow(obj)) {
			return false;
		}

		try {
			if (obj.constructor &&
					!hasOwn.call(obj, "constructor") &&
					!hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
				return false;
			}
		} catch (e) {
			return false;
		}

		for (key in obj) {
		}

		return key === undefined || hasOwn.call(obj, key);
	};

	/* jQuery */
	$.each = function(obj, callback, args) {
		var value,
				i = 0,
				length = obj.length,
				isArray = isArraylike(obj);

		if (args) {
			if (isArray) {
				for (; i < length; i++) {
					value = callback.apply(obj[i], args);

					if (value === false) {
						break;
					}
				}
			} else {
				for (i in obj) {
					if (!obj.hasOwnProperty(i)) {
						continue;
					}
					value = callback.apply(obj[i], args);

					if (value === false) {
						break;
					}
				}
			}

		} else {
			if (isArray) {
				for (; i < length; i++) {
					value = callback.call(obj[i], i, obj[i]);

					if (value === false) {
						break;
					}
				}
			} else {
				for (i in obj) {
					if (!obj.hasOwnProperty(i)) {
						continue;
					}
					value = callback.call(obj[i], i, obj[i]);

					if (value === false) {
						break;
					}
				}
			}
		}

		return obj;
	};

	/* Custom */
	$.data = function(node, key, value) {
		/* $.getData() */
		if (value === undefined) {
			var getId = node[$.expando],
					store = getId && cache[getId];

			if (key === undefined) {
				return store;
			} else if (store) {
				if (key in store) {
					return store[key];
				}
			}
			/* $.setData() */
		} else if (key !== undefined) {
			var setId = node[$.expando] || (node[$.expando] = ++$.uuid);

			cache[setId] = cache[setId] || {};
			cache[setId][key] = value;

			return value;
		}
	};

	/* Custom */
	$.removeData = function(node, keys) {
		var id = node[$.expando],
				store = id && cache[id];

		if (store) {
			// Cleanup the entire store if no keys are provided.
			if (!keys) {
				delete cache[id];
			} else {
				$.each(keys, function(_, key) {
					delete store[key];
				});
			}
		}
	};

	/* jQuery */
	$.extend = function() {
		var src, copyIsArray, copy, name, options, clone,
				target = arguments[0] || {},
				i = 1,
				length = arguments.length,
				deep = false;

		if (typeof target === "boolean") {
			deep = target;

			target = arguments[i] || {};
			i++;
		}

		if (typeof target !== "object" && $.type(target) !== "function") {
			target = {};
		}

		if (i === length) {
			target = this;
			i--;
		}

		for (; i < length; i++) {
			if ((options = arguments[i])) {
				for (name in options) {
					if (!options.hasOwnProperty(name)) {
						continue;
					}
					src = target[name];
					copy = options[name];

					if (target === copy) {
						continue;
					}

					if (deep && copy && ($.isPlainObject(copy) || (copyIsArray = $.isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && $.isArray(src) ? src : [];

						} else {
							clone = src && $.isPlainObject(src) ? src : {};
						}

						target[name] = $.extend(deep, clone, copy);

					} else if (copy !== undefined) {
						target[name] = copy;
					}
				}
			}
		}

		return target;
	};

	/* jQuery 1.4.3 */
	$.queue = function(elem, type, data) {
		function $makeArray(arr, results) {
			var ret = results || [];

			if (arr) {
				if (isArraylike(Object(arr))) {
					/* $.merge */
					(function(first, second) {
						var len = +second.length,
								j = 0,
								i = first.length;

						while (j < len) {
							first[i++] = second[j++];
						}

						if (len !== len) {
							while (second[j] !== undefined) {
								first[i++] = second[j++];
							}
						}

						first.length = i;

						return first;
					})(ret, typeof arr === "string" ? [arr] : arr);
				} else {
					[].push.call(ret, arr);
				}
			}

			return ret;
		}

		if (!elem) {
			return;
		}

		type = (type || "fx") + "queue";

		var q = $.data(elem, type);

		if (!data) {
			return q || [];
		}

		if (!q || $.isArray(data)) {
			q = $.data(elem, type, $makeArray(data));
		} else {
			q.push(data);
		}

		return q;
	};

	/* jQuery 1.4.3 */
	$.dequeue = function(elems, type) {
		/* Custom: Embed element iteration. */
		$.each(elems.nodeType ? [elems] : elems, function(i, elem) {
			type = type || "fx";

			var queue = $.queue(elem, type),
					fn = queue.shift();

			if (fn === "inprogress") {
				fn = queue.shift();
			}

			if (fn) {
				if (type === "fx") {
					queue.unshift("inprogress");
				}

				fn.call(elem, function() {
					$.dequeue(elem, type);
				});
			}
		});
	};

	/******************
	 $.fn Methods
	 ******************/

	/* jQuery */
	$.fn = $.prototype = {
		init: function(selector) {
			/* Just return the element wrapped inside an array; don't proceed with the actual jQuery node wrapping process. */
			if (selector.nodeType) {
				this[0] = selector;

				return this;
			} else {
				throw new Error("Not a DOM node.");
			}
		},
		offset: function() {
			/* jQuery altered code: Dropped disconnected DOM node checking. */
			var box = this[0].getBoundingClientRect ? this[0].getBoundingClientRect() : {top: 0, left: 0};

			return {
				top: box.top + (window.pageYOffset || document.scrollTop || 0) - (document.clientTop || 0),
				left: box.left + (window.pageXOffset || document.scrollLeft || 0) - (document.clientLeft || 0)
			};
		},
		position: function() {
			/* jQuery */
			function offsetParentFn(elem) {
				var offsetParent = elem.offsetParent;

				while (offsetParent && offsetParent.nodeName.toLowerCase() !== "html" && offsetParent.style && offsetParent.style.position === "static") {
					offsetParent = offsetParent.offsetParent;
				}

				return offsetParent || document;
			}

			/* Zepto */
			var elem = this[0],
					offsetParent = offsetParentFn(elem),
					offset = this.offset(),
					parentOffset = /^(?:body|html)$/i.test(offsetParent.nodeName) ? {top: 0, left: 0} : $(offsetParent).offset();

			offset.top -= parseFloat(elem.style.marginTop) || 0;
			offset.left -= parseFloat(elem.style.marginLeft) || 0;

			if (offsetParent.style) {
				parentOffset.top += parseFloat(offsetParent.style.borderTopWidth) || 0;
				parentOffset.left += parseFloat(offsetParent.style.borderLeftWidth) || 0;
			}

			return {
				top: offset.top - parentOffset.top,
				left: offset.left - parentOffset.left
			};
		}
	};

	/**********************
	 Private Variables
	 **********************/

	/* For $.data() */
	var cache = {};
	$.expando = "velocity" + (new Date().getTime());
	$.uuid = 0;

	/* For $.queue() */
	var class2type = {},
			hasOwn = class2type.hasOwnProperty,
			toString = class2type.toString;

	var types = "Boolean Number String Function Array Date RegExp Object Error".split(" ");
	for (var i = 0; i < types.length; i++) {
		class2type["[object " + types[i] + "]"] = types[i].toLowerCase();
	}

	/* Makes $(node) possible, without having to call init. */
	$.fn.init.prototype = $.fn;

	/* Globalize Velocity onto the window, and assign its Utilities property. */
	window.Velocity = {Utilities: $};
})(window);

/******************
 Velocity.js
 ******************/

(function(factory) {
	"use strict";
	/* CommonJS module. */
	if (typeof module === "object" && typeof module.exports === "object") {
		module.exports = factory();
		/* AMD module. */
	} else if (true) {
		!(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
				__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
				(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
				__WEBPACK_AMD_DEFINE_FACTORY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
		/* Browser globals. */
	} else {
		factory();
	}
}(function() {
	"use strict";
	return function(global, window, document, undefined) {

		/***************
		 Summary
		 ***************/

		/*
		 - CSS: CSS stack that works independently from the rest of Velocity.
		 - animate(): Core animation method that iterates over the targeted elements and queues the incoming call onto each element individually.
		 - Pre-Queueing: Prepare the element for animation by instantiating its data cache and processing the call's options.
		 - Queueing: The logic that runs once the call has reached its point of execution in the element's $.queue() stack.
		 Most logic is placed here to avoid risking it becoming stale (if the element's properties have changed).
		 - Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
		 - tick(): The single requestAnimationFrame loop responsible for tweening all in-progress calls.
		 - completeCall(): Handles the cleanup process for each Velocity call.
		 */

		/*********************
		 Helper Functions
		 *********************/

		/* IE detection. Gist: https://gist.github.com/julianshapiro/9098609 */
		var IE = (function() {
			if (document.documentMode) {
				return document.documentMode;
			} else {
				for (var i = 7; i > 4; i--) {
					var div = document.createElement("div");

					div.innerHTML = "<!--[if IE " + i + "]><span></span><![endif]-->";

					if (div.getElementsByTagName("span").length) {
						div = null;

						return i;
					}
				}
			}

			return undefined;
		})();

		/* rAF shim. Gist: https://gist.github.com/julianshapiro/9497513 */
		var rAFShim = (function() {
			var timeLast = 0;

			return window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
				var timeCurrent = (new Date()).getTime(),
						timeDelta;

				/* Dynamically set delay on a per-tick basis to match 60fps. */
				/* Technique by Erik Moller. MIT license: https://gist.github.com/paulirish/1579671 */
				timeDelta = Math.max(0, 16 - (timeCurrent - timeLast));
				timeLast = timeCurrent + timeDelta;

				return setTimeout(function() {
					callback(timeCurrent + timeDelta);
				}, timeDelta);
			};
		})();

		var performance = (function() {
			var perf = window.performance || {};

			if (!Object.prototype.hasOwnProperty.call(perf, "now")) {
				var nowOffset = perf.timing && perf.timing.domComplete ? perf.timing.domComplete : (new Date()).getTime();

				perf.now = function() {
					return (new Date()).getTime() - nowOffset;
				};
			}
			return perf;
		})();

		/* Array compacting. Copyright Lo-Dash. MIT License: https://github.com/lodash/lodash/blob/master/LICENSE.txt */
		function compactSparseArray(array) {
			var index = -1,
					length = array ? array.length : 0,
					result = [];

			while (++index < length) {
				var value = array[index];

				if (value) {
					result.push(value);
				}
			}

			return result;
		}

		var _slice = (function() {
			var slice = Array.prototype.slice;

			try {
				// Can't be used with DOM elements in IE < 9
				slice.call(document.documentElement);
			} catch (e) { // Fails in IE < 9
				// This will work for genuine arrays, array-like objects, 
				// NamedNodeMap (attributes, entities, notations),
				// NodeList (e.g., getElementsByTagName), HTMLCollection (e.g., childNodes),
				// and will not fail on other DOM objects (as do DOM elements in IE < 9)
				slice = function() {
					var i = this.length,
							clone = [];

					while (--i > 0) {
						clone[i] = this[i];
					}
					return clone;
				};
			}
			return slice;
		})(); // TODO: IE8, Cache of Array.prototype.slice that works on IE8

		function sanitizeElements(elements) {
			/* Unwrap jQuery/Zepto objects. */
			if (Type.isWrapped(elements)) {
				elements = _slice.call(elements);
				/* Wrap a single element in an array so that $.each() can iterate with the element instead of its node's children. */
			} else if (Type.isNode(elements)) {
				elements = [elements];
			}

			return elements;
		}

		var Type = {
			isNumber: function(variable) {
				return (typeof variable === "number");
			},
			isString: function(variable) {
				return (typeof variable === "string");
			},
			isArray: Array.isArray || function(variable) {
				return Object.prototype.toString.call(variable) === "[object Array]";
			},
			isFunction: function(variable) {
				return Object.prototype.toString.call(variable) === "[object Function]";
			},
			isNode: function(variable) {
				return variable && variable.nodeType;
			},
			/* Determine if variable is an array-like wrapped jQuery, Zepto or similar element, or even a NodeList etc. */
			/* NOTE: HTMLFormElements also have a length. */
			isWrapped: function(variable) {
				return variable
						&& Type.isNumber(variable.length)
						&& !Type.isString(variable)
						&& !Type.isFunction(variable)
						&& !Type.isNode(variable)
						&& (variable.length === 0 || Type.isNode(variable[0]));
			},
			isSVG: function(variable) {
				return window.SVGElement && (variable instanceof window.SVGElement);
			},
			isEmptyObject: function(variable) {
				for (var name in variable) {
					if (variable.hasOwnProperty(name)) {
						return false;
					}
				}

				return true;
			}
		};

		/*****************
		 Dependencies
		 *****************/

		var $,
				isJQuery = false;

		if (global.fn && global.fn.jquery) {
			$ = global;
			isJQuery = true;
		} else {
			$ = window.Velocity.Utilities;
		}

		if (IE <= 8 && !isJQuery) {
			throw new Error("Velocity: IE8 and below require jQuery to be loaded before Velocity.");
		} else if (IE <= 7) {
			/* Revert to jQuery's $.animate(), and lose Velocity's extra features. */
			jQuery.fn.velocity = jQuery.fn.animate;

			/* Now that $.fn.velocity is aliased, abort this Velocity declaration. */
			return;
		}

		/*****************
		 Constants
		 *****************/

		var DURATION_DEFAULT = 400,
				EASING_DEFAULT = "swing";

		/*************
		 State
		 *************/

		var Velocity = {
			/* Container for page-wide Velocity state data. */
			State: {
				/* Detect mobile devices to determine if mobileHA should be turned on. */
				isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
				/* The mobileHA option's behavior changes on older Android devices (Gingerbread, versions 2.3.3-2.3.7). */
				isAndroid: /Android/i.test(navigator.userAgent),
				isGingerbread: /Android 2\.3\.[3-7]/i.test(navigator.userAgent),
				isChrome: window.chrome,
				isFirefox: /Firefox/i.test(navigator.userAgent),
				/* Create a cached element for re-use when checking for CSS property prefixes. */
				prefixElement: document.createElement("div"),
				/* Cache every prefix match to avoid repeating lookups. */
				prefixMatches: {},
				/* Cache the anchor used for animating window scrolling. */
				scrollAnchor: null,
				/* Cache the browser-specific property names associated with the scroll anchor. */
				scrollPropertyLeft: null,
				scrollPropertyTop: null,
				/* Keep track of whether our RAF tick is running. */
				isTicking: false,
				/* Container for every in-progress call to Velocity. */
				calls: [],
				delayedElements: {
					count: 0
				}
			},
			/* Velocity's custom CSS stack. Made global for unit testing. */
			CSS: {/* Defined below. */},
			/* A shim of the jQuery utility functions used by Velocity -- provided by Velocity's optional jQuery shim. */
			Utilities: $,
			/* Container for the user's custom animation redirects that are referenced by name in place of the properties map argument. */
			Redirects: {/* Manually registered by the user. */},
			Easings: {/* Defined below. */},
			/* Attempt to use ES6 Promises by default. Users can override this with a third-party promises library. */
			Promise: window.Promise,
			/* Velocity option defaults, which can be overriden by the user. */
			defaults: {
				queue: "",
				duration: DURATION_DEFAULT,
				easing: EASING_DEFAULT,
				begin: undefined,
				complete: undefined,
				progress: undefined,
				display: undefined,
				visibility: undefined,
				loop: false,
				delay: false,
				mobileHA: true,
				/* Advanced: Set to false to prevent property values from being cached between consecutive Velocity-initiated chain calls. */
				_cacheValues: true,
				/* Advanced: Set to false if the promise should always resolve on empty element lists. */
				promiseRejectEmpty: true
			},
			/* A design goal of Velocity is to cache data wherever possible in order to avoid DOM requerying. Accordingly, each element has a data cache. */
			init: function(element) {
				$.data(element, "velocity", {
					/* Store whether this is an SVG element, since its properties are retrieved and updated differently than standard HTML elements. */
					isSVG: Type.isSVG(element),
					/* Keep track of whether the element is currently being animated by Velocity.
					 This is used to ensure that property values are not transferred between non-consecutive (stale) calls. */
					isAnimating: false,
					/* A reference to the element's live computedStyle object. Learn more here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
					computedStyle: null,
					/* Tween data is cached for each animation on the element so that data can be passed across calls --
					 in particular, end values are used as subsequent start values in consecutive Velocity calls. */
					tweensContainer: null,
					/* The full root property values of each CSS hook being animated on this element are cached so that:
					 1) Concurrently-animating hooks sharing the same root can have their root values' merged into one while tweening.
					 2) Post-hook-injection root values can be transferred over to consecutively chained Velocity calls as starting root values. */
					rootPropertyValueCache: {},
					/* A cache for transform updates, which must be manually flushed via CSS.flushTransformCache(). */
					transformCache: {}
				});
			},
			/* A parallel to jQuery's $.css(), used for getting/setting Velocity's hooked CSS properties. */
			hook: null, /* Defined below. */
			/* Velocity-wide animation time remapping for testing purposes. */
			mock: false,
			version: {major: 1, minor: 4, patch: 3},
			/* Set to 1 or 2 (most verbose) to output debug info to console. */
			debug: false,
			/* Use rAF high resolution timestamp when available */
			timestamp: true,
			/* Pause all animations */
			pauseAll: function(queueName) {
				var currentTime = (new Date()).getTime();

				$.each(Velocity.State.calls, function(i, activeCall) {

					if (activeCall) {

						/* If we have a queueName and this call is not on that queue, skip */
						if (queueName !== undefined && ((activeCall[2].queue !== queueName) || (activeCall[2].queue === false))) {
							return true;
						}

						/* Set call to paused */
						activeCall[5] = {
							resume: false
						};
					}
				});

				/* Pause timers on any currently delayed calls */
				$.each(Velocity.State.delayedElements, function(k, element) {
					if (!element) {
						return;
					}
					pauseDelayOnElement(element, currentTime);
				});
			},
			/* Resume all animations */
			resumeAll: function(queueName) {
				var currentTime = (new Date()).getTime();

				$.each(Velocity.State.calls, function(i, activeCall) {

					if (activeCall) {

						/* If we have a queueName and this call is not on that queue, skip */
						if (queueName !== undefined && ((activeCall[2].queue !== queueName) || (activeCall[2].queue === false))) {
							return true;
						}

						/* Set call to resumed if it was paused */
						if (activeCall[5]) {
							activeCall[5].resume = true;
						}
					}
				});
				/* Resume timers on any currently delayed calls */
				$.each(Velocity.State.delayedElements, function(k, element) {
					if (!element) {
						return;
					}
					resumeDelayOnElement(element, currentTime);
				});
			}
		};

		/* Retrieve the appropriate scroll anchor and property name for the browser: https://developer.mozilla.org/en-US/docs/Web/API/Window.scrollY */
		if (window.pageYOffset !== undefined) {
			Velocity.State.scrollAnchor = window;
			Velocity.State.scrollPropertyLeft = "pageXOffset";
			Velocity.State.scrollPropertyTop = "pageYOffset";
		} else {
			Velocity.State.scrollAnchor = document.documentElement || document.body.parentNode || document.body;
			Velocity.State.scrollPropertyLeft = "scrollLeft";
			Velocity.State.scrollPropertyTop = "scrollTop";
		}

		/* Shorthand alias for jQuery's $.data() utility. */
		function Data(element) {
			/* Hardcode a reference to the plugin name. */
			var response = $.data(element, "velocity");

			/* jQuery <=1.4.2 returns null instead of undefined when no match is found. We normalize this behavior. */
			return response === null ? undefined : response;
		}

		/**************
		 Delay Timer
		 **************/

		function pauseDelayOnElement(element, currentTime) {
			/* Check for any delay timers, and pause the set timeouts (while preserving time data)
			 to be resumed when the "resume" command is issued */
			var data = Data(element);
			if (data && data.delayTimer && !data.delayPaused) {
				data.delayRemaining = data.delay - currentTime + data.delayBegin;
				data.delayPaused = true;
				clearTimeout(data.delayTimer.setTimeout);
			}
		}

		function resumeDelayOnElement(element, currentTime) {
			/* Check for any paused timers and resume */
			var data = Data(element);
			if (data && data.delayTimer && data.delayPaused) {
				/* If the element was mid-delay, re initiate the timeout with the remaining delay */
				data.delayPaused = false;
				data.delayTimer.setTimeout = setTimeout(data.delayTimer.next, data.delayRemaining);
			}
		}



		/**************
		 Easing
		 **************/

		/* Step easing generator. */
		function generateStep(steps) {
			return function(p) {
				return Math.round(p * steps) * (1 / steps);
			};
		}

		/* Bezier curve function generator. Copyright Gaetan Renaudeau. MIT License: http://en.wikipedia.org/wiki/MIT_License */
		function generateBezier(mX1, mY1, mX2, mY2) {
			var NEWTON_ITERATIONS = 4,
					NEWTON_MIN_SLOPE = 0.001,
					SUBDIVISION_PRECISION = 0.0000001,
					SUBDIVISION_MAX_ITERATIONS = 10,
					kSplineTableSize = 11,
					kSampleStepSize = 1.0 / (kSplineTableSize - 1.0),
					float32ArraySupported = "Float32Array" in window;

			/* Must contain four arguments. */
			if (arguments.length !== 4) {
				return false;
			}

			/* Arguments must be numbers. */
			for (var i = 0; i < 4; ++i) {
				if (typeof arguments[i] !== "number" || isNaN(arguments[i]) || !isFinite(arguments[i])) {
					return false;
				}
			}

			/* X values must be in the [0, 1] range. */
			mX1 = Math.min(mX1, 1);
			mX2 = Math.min(mX2, 1);
			mX1 = Math.max(mX1, 0);
			mX2 = Math.max(mX2, 0);

			var mSampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);

			function A(aA1, aA2) {
				return 1.0 - 3.0 * aA2 + 3.0 * aA1;
			}
			function B(aA1, aA2) {
				return 3.0 * aA2 - 6.0 * aA1;
			}
			function C(aA1) {
				return 3.0 * aA1;
			}

			function calcBezier(aT, aA1, aA2) {
				return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT;
			}

			function getSlope(aT, aA1, aA2) {
				return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1);
			}

			function newtonRaphsonIterate(aX, aGuessT) {
				for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
					var currentSlope = getSlope(aGuessT, mX1, mX2);

					if (currentSlope === 0.0) {
						return aGuessT;
					}

					var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
					aGuessT -= currentX / currentSlope;
				}

				return aGuessT;
			}

			function calcSampleValues() {
				for (var i = 0; i < kSplineTableSize; ++i) {
					mSampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
				}
			}

			function binarySubdivide(aX, aA, aB) {
				var currentX, currentT, i = 0;

				do {
					currentT = aA + (aB - aA) / 2.0;
					currentX = calcBezier(currentT, mX1, mX2) - aX;
					if (currentX > 0.0) {
						aB = currentT;
					} else {
						aA = currentT;
					}
				} while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);

				return currentT;
			}

			function getTForX(aX) {
				var intervalStart = 0.0,
						currentSample = 1,
						lastSample = kSplineTableSize - 1;

				for (; currentSample !== lastSample && mSampleValues[currentSample] <= aX; ++currentSample) {
					intervalStart += kSampleStepSize;
				}

				--currentSample;

				var dist = (aX - mSampleValues[currentSample]) / (mSampleValues[currentSample + 1] - mSampleValues[currentSample]),
						guessForT = intervalStart + dist * kSampleStepSize,
						initialSlope = getSlope(guessForT, mX1, mX2);

				if (initialSlope >= NEWTON_MIN_SLOPE) {
					return newtonRaphsonIterate(aX, guessForT);
				} else if (initialSlope === 0.0) {
					return guessForT;
				} else {
					return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize);
				}
			}

			var _precomputed = false;

			function precompute() {
				_precomputed = true;
				if (mX1 !== mY1 || mX2 !== mY2) {
					calcSampleValues();
				}
			}

			var f = function(aX) {
				if (!_precomputed) {
					precompute();
				}
				if (mX1 === mY1 && mX2 === mY2) {
					return aX;
				}
				if (aX === 0) {
					return 0;
				}
				if (aX === 1) {
					return 1;
				}

				return calcBezier(getTForX(aX), mY1, mY2);
			};

			f.getControlPoints = function() {
				return [{x: mX1, y: mY1}, {x: mX2, y: mY2}];
			};

			var str = "generateBezier(" + [mX1, mY1, mX2, mY2] + ")";
			f.toString = function() {
				return str;
			};

			return f;
		}

		/* Runge-Kutta spring physics function generator. Adapted from Framer.js, copyright Koen Bok. MIT License: http://en.wikipedia.org/wiki/MIT_License */
		/* Given a tension, friction, and duration, a simulation at 60FPS will first run without a defined duration in order to calculate the full path. A second pass
		 then adjusts the time delta -- using the relation between actual time and duration -- to calculate the path for the duration-constrained animation. */
		var generateSpringRK4 = (function() {
			function springAccelerationForState(state) {
				return (-state.tension * state.x) - (state.friction * state.v);
			}

			function springEvaluateStateWithDerivative(initialState, dt, derivative) {
				var state = {
					x: initialState.x + derivative.dx * dt,
					v: initialState.v + derivative.dv * dt,
					tension: initialState.tension,
					friction: initialState.friction
				};

				return {dx: state.v, dv: springAccelerationForState(state)};
			}

			function springIntegrateState(state, dt) {
				var a = {
					dx: state.v,
					dv: springAccelerationForState(state)
				},
						b = springEvaluateStateWithDerivative(state, dt * 0.5, a),
						c = springEvaluateStateWithDerivative(state, dt * 0.5, b),
						d = springEvaluateStateWithDerivative(state, dt, c),
						dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx),
						dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);

				state.x = state.x + dxdt * dt;
				state.v = state.v + dvdt * dt;

				return state;
			}

			return function springRK4Factory(tension, friction, duration) {

				var initState = {
					x: -1,
					v: 0,
					tension: null,
					friction: null
				},
						path = [0],
						time_lapsed = 0,
						tolerance = 1 / 10000,
						DT = 16 / 1000,
						have_duration, dt, last_state;

				tension = parseFloat(tension) || 500;
				friction = parseFloat(friction) || 20;
				duration = duration || null;

				initState.tension = tension;
				initState.friction = friction;

				have_duration = duration !== null;

				/* Calculate the actual time it takes for this animation to complete with the provided conditions. */
				if (have_duration) {
					/* Run the simulation without a duration. */
					time_lapsed = springRK4Factory(tension, friction);
					/* Compute the adjusted time delta. */
					dt = time_lapsed / duration * DT;
				} else {
					dt = DT;
				}

				while (true) {
					/* Next/step function .*/
					last_state = springIntegrateState(last_state || initState, dt);
					/* Store the position. */
					path.push(1 + last_state.x);
					time_lapsed += 16;
					/* If the change threshold is reached, break. */
					if (!(Math.abs(last_state.x) > tolerance && Math.abs(last_state.v) > tolerance)) {
						break;
					}
				}

				/* If duration is not defined, return the actual time required for completing this animation. Otherwise, return a closure that holds the
				 computed path and returns a snapshot of the position according to a given percentComplete. */
				return !have_duration ? time_lapsed : function(percentComplete) {
					return path[ (percentComplete * (path.length - 1)) | 0 ];
				};
			};
		}());

		/* jQuery easings. */
		Velocity.Easings = {
			linear: function(p) {
				return p;
			},
			swing: function(p) {
				return 0.5 - Math.cos(p * Math.PI) / 2;
			},
			/* Bonus "spring" easing, which is a less exaggerated version of easeInOutElastic. */
			spring: function(p) {
				return 1 - (Math.cos(p * 4.5 * Math.PI) * Math.exp(-p * 6));
			}
		};

		/* CSS3 and Robert Penner easings. */
		$.each(
				[
					["ease", [0.25, 0.1, 0.25, 1.0]],
					["ease-in", [0.42, 0.0, 1.00, 1.0]],
					["ease-out", [0.00, 0.0, 0.58, 1.0]],
					["ease-in-out", [0.42, 0.0, 0.58, 1.0]],
					["easeInSine", [0.47, 0, 0.745, 0.715]],
					["easeOutSine", [0.39, 0.575, 0.565, 1]],
					["easeInOutSine", [0.445, 0.05, 0.55, 0.95]],
					["easeInQuad", [0.55, 0.085, 0.68, 0.53]],
					["easeOutQuad", [0.25, 0.46, 0.45, 0.94]],
					["easeInOutQuad", [0.455, 0.03, 0.515, 0.955]],
					["easeInCubic", [0.55, 0.055, 0.675, 0.19]],
					["easeOutCubic", [0.215, 0.61, 0.355, 1]],
					["easeInOutCubic", [0.645, 0.045, 0.355, 1]],
					["easeInQuart", [0.895, 0.03, 0.685, 0.22]],
					["easeOutQuart", [0.165, 0.84, 0.44, 1]],
					["easeInOutQuart", [0.77, 0, 0.175, 1]],
					["easeInQuint", [0.755, 0.05, 0.855, 0.06]],
					["easeOutQuint", [0.23, 1, 0.32, 1]],
					["easeInOutQuint", [0.86, 0, 0.07, 1]],
					["easeInExpo", [0.95, 0.05, 0.795, 0.035]],
					["easeOutExpo", [0.19, 1, 0.22, 1]],
					["easeInOutExpo", [1, 0, 0, 1]],
					["easeInCirc", [0.6, 0.04, 0.98, 0.335]],
					["easeOutCirc", [0.075, 0.82, 0.165, 1]],
					["easeInOutCirc", [0.785, 0.135, 0.15, 0.86]]
				], function(i, easingArray) {
			Velocity.Easings[easingArray[0]] = generateBezier.apply(null, easingArray[1]);
		});

		/* Determine the appropriate easing type given an easing input. */
		function getEasing(value, duration) {
			var easing = value;

			/* The easing option can either be a string that references a pre-registered easing,
			 or it can be a two-/four-item array of integers to be converted into a bezier/spring function. */
			if (Type.isString(value)) {
				/* Ensure that the easing has been assigned to jQuery's Velocity.Easings object. */
				if (!Velocity.Easings[value]) {
					easing = false;
				}
			} else if (Type.isArray(value) && value.length === 1) {
				easing = generateStep.apply(null, value);
			} else if (Type.isArray(value) && value.length === 2) {
				/* springRK4 must be passed the animation's duration. */
				/* Note: If the springRK4 array contains non-numbers, generateSpringRK4() returns an easing
				 function generated with default tension and friction values. */
				easing = generateSpringRK4.apply(null, value.concat([duration]));
			} else if (Type.isArray(value) && value.length === 4) {
				/* Note: If the bezier array contains non-numbers, generateBezier() returns false. */
				easing = generateBezier.apply(null, value);
			} else {
				easing = false;
			}

			/* Revert to the Velocity-wide default easing type, or fall back to "swing" (which is also jQuery's default)
			 if the Velocity-wide default has been incorrectly modified. */
			if (easing === false) {
				if (Velocity.Easings[Velocity.defaults.easing]) {
					easing = Velocity.defaults.easing;
				} else {
					easing = EASING_DEFAULT;
				}
			}

			return easing;
		}

		/*****************
		 CSS Stack
		 *****************/

		/* The CSS object is a highly condensed and performant CSS stack that fully replaces jQuery's.
		 It handles the validation, getting, and setting of both standard CSS properties and CSS property hooks. */
		/* Note: A "CSS" shorthand is aliased so that our code is easier to read. */
		var CSS = Velocity.CSS = {
			/*************
			 RegEx
			 *************/

			RegEx: {
				isHex: /^#([A-f\d]{3}){1,2}$/i,
				/* Unwrap a property value's surrounding text, e.g. "rgba(4, 3, 2, 1)" ==> "4, 3, 2, 1" and "rect(4px 3px 2px 1px)" ==> "4px 3px 2px 1px". */
				valueUnwrap: /^[A-z]+\((.*)\)$/i,
				wrappedValueAlreadyExtracted: /[0-9.]+ [0-9.]+ [0-9.]+( [0-9.]+)?/,
				/* Split a multi-value property into an array of subvalues, e.g. "rgba(4, 3, 2, 1) 4px 3px 2px 1px" ==> [ "rgba(4, 3, 2, 1)", "4px", "3px", "2px", "1px" ]. */
				valueSplit: /([A-z]+\(.+\))|(([A-z0-9#-.]+?)(?=\s|$))/ig
			},
			/************
			 Lists
			 ************/

			Lists: {
				colors: ["fill", "stroke", "stopColor", "color", "backgroundColor", "borderColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor"],
				transformsBase: ["translateX", "translateY", "scale", "scaleX", "scaleY", "skewX", "skewY", "rotateZ"],
				transforms3D: ["transformPerspective", "translateZ", "scaleZ", "rotateX", "rotateY"],
				units: [
					"%", // relative
					"em", "ex", "ch", "rem", // font relative
					"vw", "vh", "vmin", "vmax", // viewport relative
					"cm", "mm", "Q", "in", "pc", "pt", "px", // absolute lengths
					"deg", "grad", "rad", "turn", // angles
					"s", "ms" // time
				],
				colorNames: {
					"aliceblue": "240,248,255",
					"antiquewhite": "250,235,215",
					"aquamarine": "127,255,212",
					"aqua": "0,255,255",
					"azure": "240,255,255",
					"beige": "245,245,220",
					"bisque": "255,228,196",
					"black": "0,0,0",
					"blanchedalmond": "255,235,205",
					"blueviolet": "138,43,226",
					"blue": "0,0,255",
					"brown": "165,42,42",
					"burlywood": "222,184,135",
					"cadetblue": "95,158,160",
					"chartreuse": "127,255,0",
					"chocolate": "210,105,30",
					"coral": "255,127,80",
					"cornflowerblue": "100,149,237",
					"cornsilk": "255,248,220",
					"crimson": "220,20,60",
					"cyan": "0,255,255",
					"darkblue": "0,0,139",
					"darkcyan": "0,139,139",
					"darkgoldenrod": "184,134,11",
					"darkgray": "169,169,169",
					"darkgrey": "169,169,169",
					"darkgreen": "0,100,0",
					"darkkhaki": "189,183,107",
					"darkmagenta": "139,0,139",
					"darkolivegreen": "85,107,47",
					"darkorange": "255,140,0",
					"darkorchid": "153,50,204",
					"darkred": "139,0,0",
					"darksalmon": "233,150,122",
					"darkseagreen": "143,188,143",
					"darkslateblue": "72,61,139",
					"darkslategray": "47,79,79",
					"darkturquoise": "0,206,209",
					"darkviolet": "148,0,211",
					"deeppink": "255,20,147",
					"deepskyblue": "0,191,255",
					"dimgray": "105,105,105",
					"dimgrey": "105,105,105",
					"dodgerblue": "30,144,255",
					"firebrick": "178,34,34",
					"floralwhite": "255,250,240",
					"forestgreen": "34,139,34",
					"fuchsia": "255,0,255",
					"gainsboro": "220,220,220",
					"ghostwhite": "248,248,255",
					"gold": "255,215,0",
					"goldenrod": "218,165,32",
					"gray": "128,128,128",
					"grey": "128,128,128",
					"greenyellow": "173,255,47",
					"green": "0,128,0",
					"honeydew": "240,255,240",
					"hotpink": "255,105,180",
					"indianred": "205,92,92",
					"indigo": "75,0,130",
					"ivory": "255,255,240",
					"khaki": "240,230,140",
					"lavenderblush": "255,240,245",
					"lavender": "230,230,250",
					"lawngreen": "124,252,0",
					"lemonchiffon": "255,250,205",
					"lightblue": "173,216,230",
					"lightcoral": "240,128,128",
					"lightcyan": "224,255,255",
					"lightgoldenrodyellow": "250,250,210",
					"lightgray": "211,211,211",
					"lightgrey": "211,211,211",
					"lightgreen": "144,238,144",
					"lightpink": "255,182,193",
					"lightsalmon": "255,160,122",
					"lightseagreen": "32,178,170",
					"lightskyblue": "135,206,250",
					"lightslategray": "119,136,153",
					"lightsteelblue": "176,196,222",
					"lightyellow": "255,255,224",
					"limegreen": "50,205,50",
					"lime": "0,255,0",
					"linen": "250,240,230",
					"magenta": "255,0,255",
					"maroon": "128,0,0",
					"mediumaquamarine": "102,205,170",
					"mediumblue": "0,0,205",
					"mediumorchid": "186,85,211",
					"mediumpurple": "147,112,219",
					"mediumseagreen": "60,179,113",
					"mediumslateblue": "123,104,238",
					"mediumspringgreen": "0,250,154",
					"mediumturquoise": "72,209,204",
					"mediumvioletred": "199,21,133",
					"midnightblue": "25,25,112",
					"mintcream": "245,255,250",
					"mistyrose": "255,228,225",
					"moccasin": "255,228,181",
					"navajowhite": "255,222,173",
					"navy": "0,0,128",
					"oldlace": "253,245,230",
					"olivedrab": "107,142,35",
					"olive": "128,128,0",
					"orangered": "255,69,0",
					"orange": "255,165,0",
					"orchid": "218,112,214",
					"palegoldenrod": "238,232,170",
					"palegreen": "152,251,152",
					"paleturquoise": "175,238,238",
					"palevioletred": "219,112,147",
					"papayawhip": "255,239,213",
					"peachpuff": "255,218,185",
					"peru": "205,133,63",
					"pink": "255,192,203",
					"plum": "221,160,221",
					"powderblue": "176,224,230",
					"purple": "128,0,128",
					"red": "255,0,0",
					"rosybrown": "188,143,143",
					"royalblue": "65,105,225",
					"saddlebrown": "139,69,19",
					"salmon": "250,128,114",
					"sandybrown": "244,164,96",
					"seagreen": "46,139,87",
					"seashell": "255,245,238",
					"sienna": "160,82,45",
					"silver": "192,192,192",
					"skyblue": "135,206,235",
					"slateblue": "106,90,205",
					"slategray": "112,128,144",
					"snow": "255,250,250",
					"springgreen": "0,255,127",
					"steelblue": "70,130,180",
					"tan": "210,180,140",
					"teal": "0,128,128",
					"thistle": "216,191,216",
					"tomato": "255,99,71",
					"turquoise": "64,224,208",
					"violet": "238,130,238",
					"wheat": "245,222,179",
					"whitesmoke": "245,245,245",
					"white": "255,255,255",
					"yellowgreen": "154,205,50",
					"yellow": "255,255,0"
				}
			},
			/************
			 Hooks
			 ************/

			/* Hooks allow a subproperty (e.g. "boxShadowBlur") of a compound-value CSS property
			 (e.g. "boxShadow: X Y Blur Spread Color") to be animated as if it were a discrete property. */
			/* Note: Beyond enabling fine-grained property animation, hooking is necessary since Velocity only
			 tweens properties with single numeric values; unlike CSS transitions, Velocity does not interpolate compound-values. */
			Hooks: {
				/********************
				 Registration
				 ********************/

				/* Templates are a concise way of indicating which subproperties must be individually registered for each compound-value CSS property. */
				/* Each template consists of the compound-value's base name, its constituent subproperty names, and those subproperties' default values. */
				templates: {
					"textShadow": ["Color X Y Blur", "black 0px 0px 0px"],
					"boxShadow": ["Color X Y Blur Spread", "black 0px 0px 0px 0px"],
					"clip": ["Top Right Bottom Left", "0px 0px 0px 0px"],
					"backgroundPosition": ["X Y", "0% 0%"],
					"transformOrigin": ["X Y Z", "50% 50% 0px"],
					"perspectiveOrigin": ["X Y", "50% 50%"]
				},
				/* A "registered" hook is one that has been converted from its template form into a live,
				 tweenable property. It contains data to associate it with its root property. */
				registered: {
					/* Note: A registered hook looks like this ==> textShadowBlur: [ "textShadow", 3 ],
					 which consists of the subproperty's name, the associated root property's name,
					 and the subproperty's position in the root's value. */
				},
				/* Convert the templates into individual hooks then append them to the registered object above. */
				register: function() {
					/* Color hooks registration: Colors are defaulted to white -- as opposed to black -- since colors that are
					 currently set to "transparent" default to their respective template below when color-animated,
					 and white is typically a closer match to transparent than black is. An exception is made for text ("color"),
					 which is almost always set closer to black than white. */
					for (var i = 0; i < CSS.Lists.colors.length; i++) {
						var rgbComponents = (CSS.Lists.colors[i] === "color") ? "0 0 0 1" : "255 255 255 1";
						CSS.Hooks.templates[CSS.Lists.colors[i]] = ["Red Green Blue Alpha", rgbComponents];
					}

					var rootProperty,
							hookTemplate,
							hookNames;

					/* In IE, color values inside compound-value properties are positioned at the end the value instead of at the beginning.
					 Thus, we re-arrange the templates accordingly. */
					if (IE) {
						for (rootProperty in CSS.Hooks.templates) {
							if (!CSS.Hooks.templates.hasOwnProperty(rootProperty)) {
								continue;
							}
							hookTemplate = CSS.Hooks.templates[rootProperty];
							hookNames = hookTemplate[0].split(" ");

							var defaultValues = hookTemplate[1].match(CSS.RegEx.valueSplit);

							if (hookNames[0] === "Color") {
								/* Reposition both the hook's name and its default value to the end of their respective strings. */
								hookNames.push(hookNames.shift());
								defaultValues.push(defaultValues.shift());

								/* Replace the existing template for the hook's root property. */
								CSS.Hooks.templates[rootProperty] = [hookNames.join(" "), defaultValues.join(" ")];
							}
						}
					}

					/* Hook registration. */
					for (rootProperty in CSS.Hooks.templates) {
						if (!CSS.Hooks.templates.hasOwnProperty(rootProperty)) {
							continue;
						}
						hookTemplate = CSS.Hooks.templates[rootProperty];
						hookNames = hookTemplate[0].split(" ");

						for (var j in hookNames) {
							if (!hookNames.hasOwnProperty(j)) {
								continue;
							}
							var fullHookName = rootProperty + hookNames[j],
									hookPosition = j;

							/* For each hook, register its full name (e.g. textShadowBlur) with its root property (e.g. textShadow)
							 and the hook's position in its template's default value string. */
							CSS.Hooks.registered[fullHookName] = [rootProperty, hookPosition];
						}
					}
				},
				/*****************************
				 Injection and Extraction
				 *****************************/

				/* Look up the root property associated with the hook (e.g. return "textShadow" for "textShadowBlur"). */
				/* Since a hook cannot be set directly (the browser won't recognize it), style updating for hooks is routed through the hook's root property. */
				getRoot: function(property) {
					var hookData = CSS.Hooks.registered[property];

					if (hookData) {
						return hookData[0];
					} else {
						/* If there was no hook match, return the property name untouched. */
						return property;
					}
				},
				getUnit: function(str, start) {
					var unit = (str.substr(start || 0, 5).match(/^[a-z%]+/) || [])[0] || "";

					if (unit && CSS.Lists.units.indexOf(unit) >= 0) {
						return unit;
					}
					return "";
				},
				fixColors: function(str) {
					return str.replace(/(rgba?\(\s*)?(\b[a-z]+\b)/g, function($0, $1, $2) {
						if (CSS.Lists.colorNames.hasOwnProperty($2)) {
							return ($1 ? $1 : "rgba(") + CSS.Lists.colorNames[$2] + ($1 ? "" : ",1)");
						}
						return $1 + $2;
					});
				},
				/* Convert any rootPropertyValue, null or otherwise, into a space-delimited list of hook values so that
				 the targeted hook can be injected or extracted at its standard position. */
				cleanRootPropertyValue: function(rootProperty, rootPropertyValue) {
					/* If the rootPropertyValue is wrapped with "rgb()", "clip()", etc., remove the wrapping to normalize the value before manipulation. */
					if (CSS.RegEx.valueUnwrap.test(rootPropertyValue)) {
						rootPropertyValue = rootPropertyValue.match(CSS.RegEx.valueUnwrap)[1];
					}

					/* If rootPropertyValue is a CSS null-value (from which there's inherently no hook value to extract),
					 default to the root's default value as defined in CSS.Hooks.templates. */
					/* Note: CSS null-values include "none", "auto", and "transparent". They must be converted into their
					 zero-values (e.g. textShadow: "none" ==> textShadow: "0px 0px 0px black") for hook manipulation to proceed. */
					if (CSS.Values.isCSSNullValue(rootPropertyValue)) {
						rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
					}

					return rootPropertyValue;
				},
				/* Extracted the hook's value from its root property's value. This is used to get the starting value of an animating hook. */
				extractValue: function(fullHookName, rootPropertyValue) {
					var hookData = CSS.Hooks.registered[fullHookName];

					if (hookData) {
						var hookRoot = hookData[0],
								hookPosition = hookData[1];

						rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

						/* Split rootPropertyValue into its constituent hook values then grab the desired hook at its standard position. */
						return rootPropertyValue.toString().match(CSS.RegEx.valueSplit)[hookPosition];
					} else {
						/* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
						return rootPropertyValue;
					}
				},
				/* Inject the hook's value into its root property's value. This is used to piece back together the root property
				 once Velocity has updated one of its individually hooked values through tweening. */
				injectValue: function(fullHookName, hookValue, rootPropertyValue) {
					var hookData = CSS.Hooks.registered[fullHookName];

					if (hookData) {
						var hookRoot = hookData[0],
								hookPosition = hookData[1],
								rootPropertyValueParts,
								rootPropertyValueUpdated;

						rootPropertyValue = CSS.Hooks.cleanRootPropertyValue(hookRoot, rootPropertyValue);

						/* Split rootPropertyValue into its individual hook values, replace the targeted value with hookValue,
						 then reconstruct the rootPropertyValue string. */
						rootPropertyValueParts = rootPropertyValue.toString().match(CSS.RegEx.valueSplit);
						rootPropertyValueParts[hookPosition] = hookValue;
						rootPropertyValueUpdated = rootPropertyValueParts.join(" ");

						return rootPropertyValueUpdated;
					} else {
						/* If the provided fullHookName isn't a registered hook, return the rootPropertyValue that was passed in. */
						return rootPropertyValue;
					}
				}
			},
			/*******************
			 Normalizations
			 *******************/

			/* Normalizations standardize CSS property manipulation by pollyfilling browser-specific implementations (e.g. opacity)
			 and reformatting special properties (e.g. clip, rgba) to look like standard ones. */
			Normalizations: {
				/* Normalizations are passed a normalization target (either the property's name, its extracted value, or its injected value),
				 the targeted element (which may need to be queried), and the targeted property value. */
				registered: {
					clip: function(type, element, propertyValue) {
						switch (type) {
							case "name":
								return "clip";
								/* Clip needs to be unwrapped and stripped of its commas during extraction. */
							case "extract":
								var extracted;

								/* If Velocity also extracted this value, skip extraction. */
								if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
									extracted = propertyValue;
								} else {
									/* Remove the "rect()" wrapper. */
									extracted = propertyValue.toString().match(CSS.RegEx.valueUnwrap);

									/* Strip off commas. */
									extracted = extracted ? extracted[1].replace(/,(\s+)?/g, " ") : propertyValue;
								}

								return extracted;
								/* Clip needs to be re-wrapped during injection. */
							case "inject":
								return "rect(" + propertyValue + ")";
						}
					},
					blur: function(type, element, propertyValue) {
						switch (type) {
							case "name":
								return Velocity.State.isFirefox ? "filter" : "-webkit-filter";
							case "extract":
								var extracted = parseFloat(propertyValue);

								/* If extracted is NaN, meaning the value isn't already extracted. */
								if (!(extracted || extracted === 0)) {
									var blurComponent = propertyValue.toString().match(/blur\(([0-9]+[A-z]+)\)/i);

									/* If the filter string had a blur component, return just the blur value and unit type. */
									if (blurComponent) {
										extracted = blurComponent[1];
										/* If the component doesn't exist, default blur to 0. */
									} else {
										extracted = 0;
									}
								}

								return extracted;
								/* Blur needs to be re-wrapped during injection. */
							case "inject":
								/* For the blur effect to be fully de-applied, it needs to be set to "none" instead of 0. */
								if (!parseFloat(propertyValue)) {
									return "none";
								} else {
									return "blur(" + propertyValue + ")";
								}
						}
					},
					/* <=IE8 do not support the standard opacity property. They use filter:alpha(opacity=INT) instead. */
					opacity: function(type, element, propertyValue) {
						if (IE <= 8) {
							switch (type) {
								case "name":
									return "filter";
								case "extract":
									/* <=IE8 return a "filter" value of "alpha(opacity=\d{1,3})".
									 Extract the value and convert it to a decimal value to match the standard CSS opacity property's formatting. */
									var extracted = propertyValue.toString().match(/alpha\(opacity=(.*)\)/i);

									if (extracted) {
										/* Convert to decimal value. */
										propertyValue = extracted[1] / 100;
									} else {
										/* When extracting opacity, default to 1 since a null value means opacity hasn't been set. */
										propertyValue = 1;
									}

									return propertyValue;
								case "inject":
									/* Opacified elements are required to have their zoom property set to a non-zero value. */
									element.style.zoom = 1;

									/* Setting the filter property on elements with certain font property combinations can result in a
									 highly unappealing ultra-bolding effect. There's no way to remedy this throughout a tween, but dropping the
									 value altogether (when opacity hits 1) at leasts ensures that the glitch is gone post-tweening. */
									if (parseFloat(propertyValue) >= 1) {
										return "";
									} else {
										/* As per the filter property's spec, convert the decimal value to a whole number and wrap the value. */
										return "alpha(opacity=" + parseInt(parseFloat(propertyValue) * 100, 10) + ")";
									}
							}
							/* With all other browsers, normalization is not required; return the same values that were passed in. */
						} else {
							switch (type) {
								case "name":
									return "opacity";
								case "extract":
									return propertyValue;
								case "inject":
									return propertyValue;
							}
						}
					}
				},
				/*****************************
				 Batched Registrations
				 *****************************/

				/* Note: Batched normalizations extend the CSS.Normalizations.registered object. */
				register: function() {

					/*****************
					 Transforms
					 *****************/

					/* Transforms are the subproperties contained by the CSS "transform" property. Transforms must undergo normalization
					 so that they can be referenced in a properties map by their individual names. */
					/* Note: When transforms are "set", they are actually assigned to a per-element transformCache. When all transform
					 setting is complete complete, CSS.flushTransformCache() must be manually called to flush the values to the DOM.
					 Transform setting is batched in this way to improve performance: the transform style only needs to be updated
					 once when multiple transform subproperties are being animated simultaneously. */
					/* Note: IE9 and Android Gingerbread have support for 2D -- but not 3D -- transforms. Since animating unsupported
					 transform properties results in the browser ignoring the *entire* transform string, we prevent these 3D values
					 from being normalized for these browsers so that tweening skips these properties altogether
					 (since it will ignore them as being unsupported by the browser.) */
					if ((!IE || IE > 9) && !Velocity.State.isGingerbread) {
						/* Note: Since the standalone CSS "perspective" property and the CSS transform "perspective" subproperty
						 share the same name, the latter is given a unique token within Velocity: "transformPerspective". */
						CSS.Lists.transformsBase = CSS.Lists.transformsBase.concat(CSS.Lists.transforms3D);
					}

					for (var i = 0; i < CSS.Lists.transformsBase.length; i++) {
						/* Wrap the dynamically generated normalization function in a new scope so that transformName's value is
						 paired with its respective function. (Otherwise, all functions would take the final for loop's transformName.) */
						(function() {
							var transformName = CSS.Lists.transformsBase[i];

							CSS.Normalizations.registered[transformName] = function(type, element, propertyValue) {
								switch (type) {
									/* The normalized property name is the parent "transform" property -- the property that is actually set in CSS. */
									case "name":
										return "transform";
										/* Transform values are cached onto a per-element transformCache object. */
									case "extract":
										/* If this transform has yet to be assigned a value, return its null value. */
										if (Data(element) === undefined || Data(element).transformCache[transformName] === undefined) {
											/* Scale CSS.Lists.transformsBase default to 1 whereas all other transform properties default to 0. */
											return /^scale/i.test(transformName) ? 1 : 0;
											/* When transform values are set, they are wrapped in parentheses as per the CSS spec.
											 Thus, when extracting their values (for tween calculations), we strip off the parentheses. */
										}
										return Data(element).transformCache[transformName].replace(/[()]/g, "");
									case "inject":
										var invalid = false;

										/* If an individual transform property contains an unsupported unit type, the browser ignores the *entire* transform property.
										 Thus, protect users from themselves by skipping setting for transform values supplied with invalid unit types. */
										/* Switch on the base transform type; ignore the axis by removing the last letter from the transform's name. */
										switch (transformName.substr(0, transformName.length - 1)) {
											/* Whitelist unit types for each transform. */
											case "translate":
												invalid = !/(%|px|em|rem|vw|vh|\d)$/i.test(propertyValue);
												break;
												/* Since an axis-free "scale" property is supported as well, a little hack is used here to detect it by chopping off its last letter. */
											case "scal":
											case "scale":
												/* Chrome on Android has a bug in which scaled elements blur if their initial scale
												 value is below 1 (which can happen with forcefeeding). Thus, we detect a yet-unset scale property
												 and ensure that its first value is always 1. More info: http://stackoverflow.com/questions/10417890/css3-animations-with-transform-causes-blurred-elements-on-webkit/10417962#10417962 */
												if (Velocity.State.isAndroid && Data(element).transformCache[transformName] === undefined && propertyValue < 1) {
													propertyValue = 1;
												}

												invalid = !/(\d)$/i.test(propertyValue);
												break;
											case "skew":
												invalid = !/(deg|\d)$/i.test(propertyValue);
												break;
											case "rotate":
												invalid = !/(deg|\d)$/i.test(propertyValue);
												break;
										}

										if (!invalid) {
											/* As per the CSS spec, wrap the value in parentheses. */
											Data(element).transformCache[transformName] = "(" + propertyValue + ")";
										}

										/* Although the value is set on the transformCache object, return the newly-updated value for the calling code to process as normal. */
										return Data(element).transformCache[transformName];
								}
							};
						})();
					}

					/*************
					 Colors
					 *************/

					/* Since Velocity only animates a single numeric value per property, color animation is achieved by hooking the individual RGBA components of CSS color properties.
					 Accordingly, color values must be normalized (e.g. "#ff0000", "red", and "rgb(255, 0, 0)" ==> "255 0 0 1") so that their components can be injected/extracted by CSS.Hooks logic. */
					for (var j = 0; j < CSS.Lists.colors.length; j++) {
						/* Wrap the dynamically generated normalization function in a new scope so that colorName's value is paired with its respective function.
						 (Otherwise, all functions would take the final for loop's colorName.) */
						(function() {
							var colorName = CSS.Lists.colors[j];

							/* Note: In IE<=8, which support rgb but not rgba, color properties are reverted to rgb by stripping off the alpha component. */
							CSS.Normalizations.registered[colorName] = function(type, element, propertyValue) {
								switch (type) {
									case "name":
										return colorName;
										/* Convert all color values into the rgb format. (Old IE can return hex values and color names instead of rgb/rgba.) */
									case "extract":
										var extracted;

										/* If the color is already in its hookable form (e.g. "255 255 255 1") due to having been previously extracted, skip extraction. */
										if (CSS.RegEx.wrappedValueAlreadyExtracted.test(propertyValue)) {
											extracted = propertyValue;
										} else {
											var converted,
													colorNames = {
														black: "rgb(0, 0, 0)",
														blue: "rgb(0, 0, 255)",
														gray: "rgb(128, 128, 128)",
														green: "rgb(0, 128, 0)",
														red: "rgb(255, 0, 0)",
														white: "rgb(255, 255, 255)"
													};

											/* Convert color names to rgb. */
											if (/^[A-z]+$/i.test(propertyValue)) {
												if (colorNames[propertyValue] !== undefined) {
													converted = colorNames[propertyValue];
												} else {
													/* If an unmatched color name is provided, default to black. */
													converted = colorNames.black;
												}
												/* Convert hex values to rgb. */
											} else if (CSS.RegEx.isHex.test(propertyValue)) {
												converted = "rgb(" + CSS.Values.hexToRgb(propertyValue).join(" ") + ")";
												/* If the provided color doesn't match any of the accepted color formats, default to black. */
											} else if (!(/^rgba?\(/i.test(propertyValue))) {
												converted = colorNames.black;
											}

											/* Remove the surrounding "rgb/rgba()" string then replace commas with spaces and strip
											 repeated spaces (in case the value included spaces to begin with). */
											extracted = (converted || propertyValue).toString().match(CSS.RegEx.valueUnwrap)[1].replace(/,(\s+)?/g, " ");
										}

										/* So long as this isn't <=IE8, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
										if ((!IE || IE > 8) && extracted.split(" ").length === 3) {
											extracted += " 1";
										}

										return extracted;
									case "inject":
										/* If we have a pattern then it might already have the right values */
										if (/^rgb/.test(propertyValue)) {
											return propertyValue;
										}

										/* If this is IE<=8 and an alpha component exists, strip it off. */
										if (IE <= 8) {
											if (propertyValue.split(" ").length === 4) {
												propertyValue = propertyValue.split(/\s+/).slice(0, 3).join(" ");
											}
											/* Otherwise, add a fourth (alpha) component if it's missing and default it to 1 (visible). */
										} else if (propertyValue.split(" ").length === 3) {
											propertyValue += " 1";
										}

										/* Re-insert the browser-appropriate wrapper("rgb/rgba()"), insert commas, and strip off decimal units
										 on all values but the fourth (R, G, and B only accept whole numbers). */
										return (IE <= 8 ? "rgb" : "rgba") + "(" + propertyValue.replace(/\s+/g, ",").replace(/\.(\d)+(?=,)/g, "") + ")";
								}
							};
						})();
					}

					/**************
					 Dimensions
					 **************/
					function augmentDimension(name, element, wantInner) {
						var isBorderBox = CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() === "border-box";

						if (isBorderBox === (wantInner || false)) {
							/* in box-sizing mode, the CSS width / height accessors already give the outerWidth / outerHeight. */
							var i,
									value,
									augment = 0,
									sides = name === "width" ? ["Left", "Right"] : ["Top", "Bottom"],
									fields = ["padding" + sides[0], "padding" + sides[1], "border" + sides[0] + "Width", "border" + sides[1] + "Width"];

							for (i = 0; i < fields.length; i++) {
								value = parseFloat(CSS.getPropertyValue(element, fields[i]));
								if (!isNaN(value)) {
									augment += value;
								}
							}
							return wantInner ? -augment : augment;
						}
						return 0;
					}
					function getDimension(name, wantInner) {
						return function(type, element, propertyValue) {
							switch (type) {
								case "name":
									return name;
								case "extract":
									return parseFloat(propertyValue) + augmentDimension(name, element, wantInner);
								case "inject":
									return (parseFloat(propertyValue) - augmentDimension(name, element, wantInner)) + "px";
							}
						};
					}
					CSS.Normalizations.registered.innerWidth = getDimension("width", true);
					CSS.Normalizations.registered.innerHeight = getDimension("height", true);
					CSS.Normalizations.registered.outerWidth = getDimension("width");
					CSS.Normalizations.registered.outerHeight = getDimension("height");
				}
			},
			/************************
			 CSS Property Names
			 ************************/

			Names: {
				/* Camelcase a property name into its JavaScript notation (e.g. "background-color" ==> "backgroundColor").
				 Camelcasing is used to normalize property names between and across calls. */
				camelCase: function(property) {
					return property.replace(/-(\w)/g, function(match, subMatch) {
						return subMatch.toUpperCase();
					});
				},
				/* For SVG elements, some properties (namely, dimensional ones) are GET/SET via the element's HTML attributes (instead of via CSS styles). */
				SVGAttribute: function(property) {
					var SVGAttributes = "width|height|x|y|cx|cy|r|rx|ry|x1|x2|y1|y2";

					/* Certain browsers require an SVG transform to be applied as an attribute. (Otherwise, application via CSS is preferable due to 3D support.) */
					if (IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) {
						SVGAttributes += "|transform";
					}

					return new RegExp("^(" + SVGAttributes + ")$", "i").test(property);
				},
				/* Determine whether a property should be set with a vendor prefix. */
				/* If a prefixed version of the property exists, return it. Otherwise, return the original property name.
				 If the property is not at all supported by the browser, return a false flag. */
				prefixCheck: function(property) {
					/* If this property has already been checked, return the cached value. */
					if (Velocity.State.prefixMatches[property]) {
						return [Velocity.State.prefixMatches[property], true];
					} else {
						var vendors = ["", "Webkit", "Moz", "ms", "O"];

						for (var i = 0, vendorsLength = vendors.length; i < vendorsLength; i++) {
							var propertyPrefixed;

							if (i === 0) {
								propertyPrefixed = property;
							} else {
								/* Capitalize the first letter of the property to conform to JavaScript vendor prefix notation (e.g. webkitFilter). */
								propertyPrefixed = vendors[i] + property.replace(/^\w/, function(match) {
									return match.toUpperCase();
								});
							}

							/* Check if the browser supports this property as prefixed. */
							if (Type.isString(Velocity.State.prefixElement.style[propertyPrefixed])) {
								/* Cache the match. */
								Velocity.State.prefixMatches[property] = propertyPrefixed;

								return [propertyPrefixed, true];
							}
						}

						/* If the browser doesn't support this property in any form, include a false flag so that the caller can decide how to proceed. */
						return [property, false];
					}
				}
			},
			/************************
			 CSS Property Values
			 ************************/

			Values: {
				/* Hex to RGB conversion. Copyright Tim Down: http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb */
				hexToRgb: function(hex) {
					var shortformRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
							longformRegex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i,
							rgbParts;

					hex = hex.replace(shortformRegex, function(m, r, g, b) {
						return r + r + g + g + b + b;
					});

					rgbParts = longformRegex.exec(hex);

					return rgbParts ? [parseInt(rgbParts[1], 16), parseInt(rgbParts[2], 16), parseInt(rgbParts[3], 16)] : [0, 0, 0];
				},
				isCSSNullValue: function(value) {
					/* The browser defaults CSS values that have not been set to either 0 or one of several possible null-value strings.
					 Thus, we check for both falsiness and these special strings. */
					/* Null-value checking is performed to default the special strings to 0 (for the sake of tweening) or their hook
					 templates as defined as CSS.Hooks (for the sake of hook injection/extraction). */
					/* Note: Chrome returns "rgba(0, 0, 0, 0)" for an undefined color whereas IE returns "transparent". */
					return (!value || /^(none|auto|transparent|(rgba\(0, ?0, ?0, ?0\)))$/i.test(value));
				},
				/* Retrieve a property's default unit type. Used for assigning a unit type when one is not supplied by the user. */
				getUnitType: function(property) {
					if (/^(rotate|skew)/i.test(property)) {
						return "deg";
					} else if (/(^(scale|scaleX|scaleY|scaleZ|alpha|flexGrow|flexHeight|zIndex|fontWeight)$)|((opacity|red|green|blue|alpha)$)/i.test(property)) {
						/* The above properties are unitless. */
						return "";
					} else {
						/* Default to px for all other properties. */
						return "px";
					}
				},
				/* HTML elements default to an associated display type when they're not set to display:none. */
				/* Note: This function is used for correctly setting the non-"none" display value in certain Velocity redirects, such as fadeIn/Out. */
				getDisplayType: function(element) {
					var tagName = element && element.tagName.toString().toLowerCase();

					if (/^(b|big|i|small|tt|abbr|acronym|cite|code|dfn|em|kbd|strong|samp|var|a|bdo|br|img|map|object|q|script|span|sub|sup|button|input|label|select|textarea)$/i.test(tagName)) {
						return "inline";
					} else if (/^(li)$/i.test(tagName)) {
						return "list-item";
					} else if (/^(tr)$/i.test(tagName)) {
						return "table-row";
					} else if (/^(table)$/i.test(tagName)) {
						return "table";
					} else if (/^(tbody)$/i.test(tagName)) {
						return "table-row-group";
						/* Default to "block" when no match is found. */
					} else {
						return "block";
					}
				},
				/* The class add/remove functions are used to temporarily apply a "velocity-animating" class to elements while they're animating. */
				addClass: function(element, className) {
					if (element) {
						if (element.classList) {
							element.classList.add(className);
						} else if (Type.isString(element.className)) {
							// Element.className is around 15% faster then set/getAttribute
							element.className += (element.className.length ? " " : "") + className;
						} else {
							// Work around for IE strict mode animating SVG - and anything else that doesn't behave correctly - the same way jQuery does it
							var currentClass = element.getAttribute(IE <= 7 ? "className" : "class") || "";

							element.setAttribute("class", currentClass + (currentClass ? " " : "") + className);
						}
					}
				},
				removeClass: function(element, className) {
					if (element) {
						if (element.classList) {
							element.classList.remove(className);
						} else if (Type.isString(element.className)) {
							// Element.className is around 15% faster then set/getAttribute
							// TODO: Need some jsperf tests on performance - can we get rid of the regex and maybe use split / array manipulation?
							element.className = element.className.toString().replace(new RegExp("(^|\\s)" + className.split(" ").join("|") + "(\\s|$)", "gi"), " ");
						} else {
							// Work around for IE strict mode animating SVG - and anything else that doesn't behave correctly - the same way jQuery does it
							var currentClass = element.getAttribute(IE <= 7 ? "className" : "class") || "";

							element.setAttribute("class", currentClass.replace(new RegExp("(^|\s)" + className.split(" ").join("|") + "(\s|$)", "gi"), " "));
						}
					}
				}
			},
			/****************************
			 Style Getting & Setting
			 ****************************/

			/* The singular getPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
			getPropertyValue: function(element, property, rootPropertyValue, forceStyleLookup) {
				/* Get an element's computed property value. */
				/* Note: Retrieving the value of a CSS property cannot simply be performed by checking an element's
				 style attribute (which only reflects user-defined values). Instead, the browser must be queried for a property's
				 *computed* value. You can read more about getComputedStyle here: https://developer.mozilla.org/en/docs/Web/API/window.getComputedStyle */
				function computePropertyValue(element, property) {
					/* When box-sizing isn't set to border-box, height and width style values are incorrectly computed when an
					 element's scrollbars are visible (which expands the element's dimensions). Thus, we defer to the more accurate
					 offsetHeight/Width property, which includes the total dimensions for interior, border, padding, and scrollbar.
					 We subtract border and padding to get the sum of interior + scrollbar. */
					var computedValue = 0;

					/* IE<=8 doesn't support window.getComputedStyle, thus we defer to jQuery, which has an extensive array
					 of hacks to accurately retrieve IE8 property values. Re-implementing that logic here is not worth bloating the
					 codebase for a dying browser. The performance repercussions of using jQuery here are minimal since
					 Velocity is optimized to rarely (and sometimes never) query the DOM. Further, the $.css() codepath isn't that slow. */
					if (IE <= 8) {
						computedValue = $.css(element, property); /* GET */
						/* All other browsers support getComputedStyle. The returned live object reference is cached onto its
						 associated element so that it does not need to be refetched upon every GET. */
					} else {
						/* Browsers do not return height and width values for elements that are set to display:"none". Thus, we temporarily
						 toggle display to the element type's default value. */
						var toggleDisplay = false;

						if (/^(width|height)$/.test(property) && CSS.getPropertyValue(element, "display") === 0) {
							toggleDisplay = true;
							CSS.setPropertyValue(element, "display", CSS.Values.getDisplayType(element));
						}

						var revertDisplay = function() {
							if (toggleDisplay) {
								CSS.setPropertyValue(element, "display", "none");
							}
						};

						if (!forceStyleLookup) {
							if (property === "height" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
								var contentBoxHeight = element.offsetHeight - (parseFloat(CSS.getPropertyValue(element, "borderTopWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderBottomWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingTop")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingBottom")) || 0);
								revertDisplay();

								return contentBoxHeight;
							} else if (property === "width" && CSS.getPropertyValue(element, "boxSizing").toString().toLowerCase() !== "border-box") {
								var contentBoxWidth = element.offsetWidth - (parseFloat(CSS.getPropertyValue(element, "borderLeftWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "borderRightWidth")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingLeft")) || 0) - (parseFloat(CSS.getPropertyValue(element, "paddingRight")) || 0);
								revertDisplay();

								return contentBoxWidth;
							}
						}

						var computedStyle;

						/* For elements that Velocity hasn't been called on directly (e.g. when Velocity queries the DOM on behalf
						 of a parent of an element its animating), perform a direct getComputedStyle lookup since the object isn't cached. */
						if (Data(element) === undefined) {
							computedStyle = window.getComputedStyle(element, null); /* GET */
							/* If the computedStyle object has yet to be cached, do so now. */
						} else if (!Data(element).computedStyle) {
							computedStyle = Data(element).computedStyle = window.getComputedStyle(element, null); /* GET */
							/* If computedStyle is cached, use it. */
						} else {
							computedStyle = Data(element).computedStyle;
						}

						/* IE and Firefox do not return a value for the generic borderColor -- they only return individual values for each border side's color.
						 Also, in all browsers, when border colors aren't all the same, a compound value is returned that Velocity isn't setup to parse.
						 So, as a polyfill for querying individual border side colors, we just return the top border's color and animate all borders from that value. */
						if (property === "borderColor") {
							property = "borderTopColor";
						}

						/* IE9 has a bug in which the "filter" property must be accessed from computedStyle using the getPropertyValue method
						 instead of a direct property lookup. The getPropertyValue method is slower than a direct lookup, which is why we avoid it by default. */
						if (IE === 9 && property === "filter") {
							computedValue = computedStyle.getPropertyValue(property); /* GET */
						} else {
							computedValue = computedStyle[property];
						}

						/* Fall back to the property's style value (if defined) when computedValue returns nothing,
						 which can happen when the element hasn't been painted. */
						if (computedValue === "" || computedValue === null) {
							computedValue = element.style[property];
						}

						revertDisplay();
					}

					/* For top, right, bottom, and left (TRBL) values that are set to "auto" on elements of "fixed" or "absolute" position,
					 defer to jQuery for converting "auto" to a numeric value. (For elements with a "static" or "relative" position, "auto" has the same
					 effect as being set to 0, so no conversion is necessary.) */
					/* An example of why numeric conversion is necessary: When an element with "position:absolute" has an untouched "left"
					 property, which reverts to "auto", left's value is 0 relative to its parent element, but is often non-zero relative
					 to its *containing* (not parent) element, which is the nearest "position:relative" ancestor or the viewport (and always the viewport in the case of "position:fixed"). */
					if (computedValue === "auto" && /^(top|right|bottom|left)$/i.test(property)) {
						var position = computePropertyValue(element, "position"); /* GET */

						/* For absolute positioning, jQuery's $.position() only returns values for top and left;
						 right and bottom will have their "auto" value reverted to 0. */
						/* Note: A jQuery object must be created here since jQuery doesn't have a low-level alias for $.position().
						 Not a big deal since we're currently in a GET batch anyway. */
						if (position === "fixed" || (position === "absolute" && /top|left/i.test(property))) {
							/* Note: jQuery strips the pixel unit from its returned values; we re-add it here to conform with computePropertyValue's behavior. */
							computedValue = $(element).position()[property] + "px"; /* GET */
						}
					}

					return computedValue;
				}

				var propertyValue;

				/* If this is a hooked property (e.g. "clipLeft" instead of the root property of "clip"),
				 extract the hook's value from a normalized rootPropertyValue using CSS.Hooks.extractValue(). */
				if (CSS.Hooks.registered[property]) {
					var hook = property,
							hookRoot = CSS.Hooks.getRoot(hook);

					/* If a cached rootPropertyValue wasn't passed in (which Velocity always attempts to do in order to avoid requerying the DOM),
					 query the DOM for the root property's value. */
					if (rootPropertyValue === undefined) {
						/* Since the browser is now being directly queried, use the official post-prefixing property name for this lookup. */
						rootPropertyValue = CSS.getPropertyValue(element, CSS.Names.prefixCheck(hookRoot)[0]); /* GET */
					}

					/* If this root has a normalization registered, peform the associated normalization extraction. */
					if (CSS.Normalizations.registered[hookRoot]) {
						rootPropertyValue = CSS.Normalizations.registered[hookRoot]("extract", element, rootPropertyValue);
					}

					/* Extract the hook's value. */
					propertyValue = CSS.Hooks.extractValue(hook, rootPropertyValue);

					/* If this is a normalized property (e.g. "opacity" becomes "filter" in <=IE8) or "translateX" becomes "transform"),
					 normalize the property's name and value, and handle the special case of transforms. */
					/* Note: Normalizing a property is mutually exclusive from hooking a property since hook-extracted values are strictly
					 numerical and therefore do not require normalization extraction. */
				} else if (CSS.Normalizations.registered[property]) {
					var normalizedPropertyName,
							normalizedPropertyValue;

					normalizedPropertyName = CSS.Normalizations.registered[property]("name", element);

					/* Transform values are calculated via normalization extraction (see below), which checks against the element's transformCache.
					 At no point do transform GETs ever actually query the DOM; initial stylesheet values are never processed.
					 This is because parsing 3D transform matrices is not always accurate and would bloat our codebase;
					 thus, normalization extraction defaults initial transform values to their zero-values (e.g. 1 for scaleX and 0 for translateX). */
					if (normalizedPropertyName !== "transform") {
						normalizedPropertyValue = computePropertyValue(element, CSS.Names.prefixCheck(normalizedPropertyName)[0]); /* GET */

						/* If the value is a CSS null-value and this property has a hook template, use that zero-value template so that hooks can be extracted from it. */
						if (CSS.Values.isCSSNullValue(normalizedPropertyValue) && CSS.Hooks.templates[property]) {
							normalizedPropertyValue = CSS.Hooks.templates[property][1];
						}
					}

					propertyValue = CSS.Normalizations.registered[property]("extract", element, normalizedPropertyValue);
				}

				/* If a (numeric) value wasn't produced via hook extraction or normalization, query the DOM. */
				if (!/^[\d-]/.test(propertyValue)) {
					/* For SVG elements, dimensional properties (which SVGAttribute() detects) are tweened via
					 their HTML attribute values instead of their CSS style values. */
					var data = Data(element);

					if (data && data.isSVG && CSS.Names.SVGAttribute(property)) {
						/* Since the height/width attribute values must be set manually, they don't reflect computed values.
						 Thus, we use use getBBox() to ensure we always get values for elements with undefined height/width attributes. */
						if (/^(height|width)$/i.test(property)) {
							/* Firefox throws an error if .getBBox() is called on an SVG that isn't attached to the DOM. */
							try {
								propertyValue = element.getBBox()[property];
							} catch (error) {
								propertyValue = 0;
							}
							/* Otherwise, access the attribute value directly. */
						} else {
							propertyValue = element.getAttribute(property);
						}
					} else {
						propertyValue = computePropertyValue(element, CSS.Names.prefixCheck(property)[0]); /* GET */
					}
				}

				/* Since property lookups are for animation purposes (which entails computing the numeric delta between start and end values),
				 convert CSS null-values to an integer of value 0. */
				if (CSS.Values.isCSSNullValue(propertyValue)) {
					propertyValue = 0;
				}

				if (Velocity.debug >= 2) {
					console.log("Get " + property + ": " + propertyValue);
				}

				return propertyValue;
			},
			/* The singular setPropertyValue, which routes the logic for all normalizations, hooks, and standard CSS properties. */
			setPropertyValue: function(element, property, propertyValue, rootPropertyValue, scrollData) {
				var propertyName = property;

				/* In order to be subjected to call options and element queueing, scroll animation is routed through Velocity as if it were a standard CSS property. */
				if (property === "scroll") {
					/* If a container option is present, scroll the container instead of the browser window. */
					if (scrollData.container) {
						scrollData.container["scroll" + scrollData.direction] = propertyValue;
						/* Otherwise, Velocity defaults to scrolling the browser window. */
					} else {
						if (scrollData.direction === "Left") {
							window.scrollTo(propertyValue, scrollData.alternateValue);
						} else {
							window.scrollTo(scrollData.alternateValue, propertyValue);
						}
					}
				} else {
					/* Transforms (translateX, rotateZ, etc.) are applied to a per-element transformCache object, which is manually flushed via flushTransformCache().
					 Thus, for now, we merely cache transforms being SET. */
					if (CSS.Normalizations.registered[property] && CSS.Normalizations.registered[property]("name", element) === "transform") {
						/* Perform a normalization injection. */
						/* Note: The normalization logic handles the transformCache updating. */
						CSS.Normalizations.registered[property]("inject", element, propertyValue);

						propertyName = "transform";
						propertyValue = Data(element).transformCache[property];
					} else {
						/* Inject hooks. */
						if (CSS.Hooks.registered[property]) {
							var hookName = property,
									hookRoot = CSS.Hooks.getRoot(property);

							/* If a cached rootPropertyValue was not provided, query the DOM for the hookRoot's current value. */
							rootPropertyValue = rootPropertyValue || CSS.getPropertyValue(element, hookRoot); /* GET */

							propertyValue = CSS.Hooks.injectValue(hookName, propertyValue, rootPropertyValue);
							property = hookRoot;
						}

						/* Normalize names and values. */
						if (CSS.Normalizations.registered[property]) {
							propertyValue = CSS.Normalizations.registered[property]("inject", element, propertyValue);
							property = CSS.Normalizations.registered[property]("name", element);
						}

						/* Assign the appropriate vendor prefix before performing an official style update. */
						propertyName = CSS.Names.prefixCheck(property)[0];

						/* A try/catch is used for IE<=8, which throws an error when "invalid" CSS values are set, e.g. a negative width.
						 Try/catch is avoided for other browsers since it incurs a performance overhead. */
						if (IE <= 8) {
							try {
								element.style[propertyName] = propertyValue;
							} catch (error) {
								if (Velocity.debug) {
									console.log("Browser does not support [" + propertyValue + "] for [" + propertyName + "]");
								}
							}
							/* SVG elements have their dimensional properties (width, height, x, y, cx, etc.) applied directly as attributes instead of as styles. */
							/* Note: IE8 does not support SVG elements, so it's okay that we skip it for SVG animation. */
						} else {
							var data = Data(element);

							if (data && data.isSVG && CSS.Names.SVGAttribute(property)) {
								/* Note: For SVG attributes, vendor-prefixed property names are never used. */
								/* Note: Not all CSS properties can be animated via attributes, but the browser won't throw an error for unsupported properties. */
								element.setAttribute(property, propertyValue);
							} else {
								element.style[propertyName] = propertyValue;
							}
						}

						if (Velocity.debug >= 2) {
							console.log("Set " + property + " (" + propertyName + "): " + propertyValue);
						}
					}
				}

				/* Return the normalized property name and value in case the caller wants to know how these values were modified before being applied to the DOM. */
				return [propertyName, propertyValue];
			},
			/* To increase performance by batching transform updates into a single SET, transforms are not directly applied to an element until flushTransformCache() is called. */
			/* Note: Velocity applies transform properties in the same order that they are chronogically introduced to the element's CSS styles. */
			flushTransformCache: function(element) {
				var transformString = "",
						data = Data(element);

				/* Certain browsers require that SVG transforms be applied as an attribute. However, the SVG transform attribute takes a modified version of CSS's transform string
				 (units are dropped and, except for skewX/Y, subproperties are merged into their master property -- e.g. scaleX and scaleY are merged into scale(X Y). */
				if ((IE || (Velocity.State.isAndroid && !Velocity.State.isChrome)) && data && data.isSVG) {
					/* Since transform values are stored in their parentheses-wrapped form, we use a helper function to strip out their numeric values.
					 Further, SVG transform properties only take unitless (representing pixels) values, so it's okay that parseFloat() strips the unit suffixed to the float value. */
					var getTransformFloat = function(transformProperty) {
						return parseFloat(CSS.getPropertyValue(element, transformProperty));
					};

					/* Create an object to organize all the transforms that we'll apply to the SVG element. To keep the logic simple,
					 we process *all* transform properties -- even those that may not be explicitly applied (since they default to their zero-values anyway). */
					var SVGTransforms = {
						translate: [getTransformFloat("translateX"), getTransformFloat("translateY")],
						skewX: [getTransformFloat("skewX")], skewY: [getTransformFloat("skewY")],
						/* If the scale property is set (non-1), use that value for the scaleX and scaleY values
						 (this behavior mimics the result of animating all these properties at once on HTML elements). */
						scale: getTransformFloat("scale") !== 1 ? [getTransformFloat("scale"), getTransformFloat("scale")] : [getTransformFloat("scaleX"), getTransformFloat("scaleY")],
						/* Note: SVG's rotate transform takes three values: rotation degrees followed by the X and Y values
						 defining the rotation's origin point. We ignore the origin values (default them to 0). */
						rotate: [getTransformFloat("rotateZ"), 0, 0]
					};

					/* Iterate through the transform properties in the user-defined property map order.
					 (This mimics the behavior of non-SVG transform animation.) */
					$.each(Data(element).transformCache, function(transformName) {
						/* Except for with skewX/Y, revert the axis-specific transform subproperties to their axis-free master
						 properties so that they match up with SVG's accepted transform properties. */
						if (/^translate/i.test(transformName)) {
							transformName = "translate";
						} else if (/^scale/i.test(transformName)) {
							transformName = "scale";
						} else if (/^rotate/i.test(transformName)) {
							transformName = "rotate";
						}

						/* Check that we haven't yet deleted the property from the SVGTransforms container. */
						if (SVGTransforms[transformName]) {
							/* Append the transform property in the SVG-supported transform format. As per the spec, surround the space-delimited values in parentheses. */
							transformString += transformName + "(" + SVGTransforms[transformName].join(" ") + ")" + " ";

							/* After processing an SVG transform property, delete it from the SVGTransforms container so we don't
							 re-insert the same master property if we encounter another one of its axis-specific properties. */
							delete SVGTransforms[transformName];
						}
					});
				} else {
					var transformValue,
							perspective;

					/* Transform properties are stored as members of the transformCache object. Concatenate all the members into a string. */
					$.each(Data(element).transformCache, function(transformName) {
						transformValue = Data(element).transformCache[transformName];

						/* Transform's perspective subproperty must be set first in order to take effect. Store it temporarily. */
						if (transformName === "transformPerspective") {
							perspective = transformValue;
							return true;
						}

						/* IE9 only supports one rotation type, rotateZ, which it refers to as "rotate". */
						if (IE === 9 && transformName === "rotateZ") {
							transformName = "rotate";
						}

						transformString += transformName + transformValue + " ";
					});

					/* If present, set the perspective subproperty first. */
					if (perspective) {
						transformString = "perspective" + perspective + " " + transformString;
					}
				}

				CSS.setPropertyValue(element, "transform", transformString);
			}
		};

		/* Register hooks and normalizations. */
		CSS.Hooks.register();
		CSS.Normalizations.register();

		/* Allow hook setting in the same fashion as jQuery's $.css(). */
		Velocity.hook = function(elements, arg2, arg3) {
			var value;

			elements = sanitizeElements(elements);

			$.each(elements, function(i, element) {
				/* Initialize Velocity's per-element data cache if this element hasn't previously been animated. */
				if (Data(element) === undefined) {
					Velocity.init(element);
				}

				/* Get property value. If an element set was passed in, only return the value for the first element. */
				if (arg3 === undefined) {
					if (value === undefined) {
						value = CSS.getPropertyValue(element, arg2);
					}
					/* Set property value. */
				} else {
					/* sPV returns an array of the normalized propertyName/propertyValue pair used to update the DOM. */
					var adjustedSet = CSS.setPropertyValue(element, arg2, arg3);

					/* Transform properties don't automatically set. They have to be flushed to the DOM. */
					if (adjustedSet[0] === "transform") {
						Velocity.CSS.flushTransformCache(element);
					}

					value = adjustedSet;
				}
			});

			return value;
		};

		/*****************
		 Animation
		 *****************/

		var animate = function() {
			var opts;

			/******************
			 Call Chain
			 ******************/

			/* Logic for determining what to return to the call stack when exiting out of Velocity. */
			function getChain() {
				/* If we are using the utility function, attempt to return this call's promise. If no promise library was detected,
				 default to null instead of returning the targeted elements so that utility function's return value is standardized. */
				if (isUtility) {
					return promiseData.promise || null;
					/* Otherwise, if we're using $.fn, return the jQuery-/Zepto-wrapped element set. */
				} else {
					return elementsWrapped;
				}
			}

			/*************************
			 Arguments Assignment
			 *************************/

			/* To allow for expressive CoffeeScript code, Velocity supports an alternative syntax in which "elements" (or "e"), "properties" (or "p"), and "options" (or "o")
			 objects are defined on a container object that's passed in as Velocity's sole argument. */
			/* Note: Some browsers automatically populate arguments with a "properties" object. We detect it by checking for its default "names" property. */
			var syntacticSugar = (arguments[0] && (arguments[0].p || (($.isPlainObject(arguments[0].properties) && !arguments[0].properties.names) || Type.isString(arguments[0].properties)))),
					/* Whether Velocity was called via the utility function (as opposed to on a jQuery/Zepto object). */
					isUtility,
					/* When Velocity is called via the utility function ($.Velocity()/Velocity()), elements are explicitly
					 passed in as the first parameter. Thus, argument positioning varies. We normalize them here. */
					elementsWrapped,
					argumentIndex;

			var elements,
					propertiesMap,
					options;

			/* Detect jQuery/Zepto elements being animated via the $.fn method. */
			if (Type.isWrapped(this)) {
				isUtility = false;

				argumentIndex = 0;
				elements = this;
				elementsWrapped = this;
				/* Otherwise, raw elements are being animated via the utility function. */
			} else {
				isUtility = true;

				argumentIndex = 1;
				elements = syntacticSugar ? (arguments[0].elements || arguments[0].e) : arguments[0];
			}

			/***************
			 Promises
			 ***************/

			var promiseData = {
				promise: null,
				resolver: null,
				rejecter: null
			};

			/* If this call was made via the utility function (which is the default method of invocation when jQuery/Zepto are not being used), and if
			 promise support was detected, create a promise object for this call and store references to its resolver and rejecter methods. The resolve
			 method is used when a call completes naturally or is prematurely stopped by the user. In both cases, completeCall() handles the associated
			 call cleanup and promise resolving logic. The reject method is used when an invalid set of arguments is passed into a Velocity call. */
			/* Note: Velocity employs a call-based queueing architecture, which means that stopping an animating element actually stops the full call that
			 triggered it -- not that one element exclusively. Similarly, there is one promise per call, and all elements targeted by a Velocity call are
			 grouped together for the purposes of resolving and rejecting a promise. */
			if (isUtility && Velocity.Promise) {
				promiseData.promise = new Velocity.Promise(function(resolve, reject) {
					promiseData.resolver = resolve;
					promiseData.rejecter = reject;
				});
			}

			if (syntacticSugar) {
				propertiesMap = arguments[0].properties || arguments[0].p;
				options = arguments[0].options || arguments[0].o;
			} else {
				propertiesMap = arguments[argumentIndex];
				options = arguments[argumentIndex + 1];
			}

			elements = sanitizeElements(elements);

			if (!elements) {
				if (promiseData.promise) {
					if (!propertiesMap || !options || options.promiseRejectEmpty !== false) {
						promiseData.rejecter();
					} else {
						promiseData.resolver();
					}
				}
				return;
			}

			/* The length of the element set (in the form of a nodeList or an array of elements) is defaulted to 1 in case a
			 single raw DOM element is passed in (which doesn't contain a length property). */
			var elementsLength = elements.length,
					elementsIndex = 0;

			/***************************
			 Argument Overloading
			 ***************************/

			/* Support is included for jQuery's argument overloading: $.animate(propertyMap [, duration] [, easing] [, complete]).
			 Overloading is detected by checking for the absence of an object being passed into options. */
			/* Note: The stop/finish/pause/resume actions do not accept animation options, and are therefore excluded from this check. */
			if (!/^(stop|finish|finishAll|pause|resume)$/i.test(propertiesMap) && !$.isPlainObject(options)) {
				/* The utility function shifts all arguments one position to the right, so we adjust for that offset. */
				var startingArgumentPosition = argumentIndex + 1;

				options = {};

				/* Iterate through all options arguments */
				for (var i = startingArgumentPosition; i < arguments.length; i++) {
					/* Treat a number as a duration. Parse it out. */
					/* Note: The following RegEx will return true if passed an array with a number as its first item.
					 Thus, arrays are skipped from this check. */
					if (!Type.isArray(arguments[i]) && (/^(fast|normal|slow)$/i.test(arguments[i]) || /^\d/.test(arguments[i]))) {
						options.duration = arguments[i];
						/* Treat strings and arrays as easings. */
					} else if (Type.isString(arguments[i]) || Type.isArray(arguments[i])) {
						options.easing = arguments[i];
						/* Treat a function as a complete callback. */
					} else if (Type.isFunction(arguments[i])) {
						options.complete = arguments[i];
					}
				}
			}

			/*********************
			 Action Detection
			 *********************/

			/* Velocity's behavior is categorized into "actions": Elements can either be specially scrolled into view,
			 or they can be started, stopped, paused, resumed, or reversed . If a literal or referenced properties map is passed in as Velocity's
			 first argument, the associated action is "start". Alternatively, "scroll", "reverse", "pause", "resume" or "stop" can be passed in 
			 instead of a properties map. */
			var action;

			switch (propertiesMap) {
				case "scroll":
					action = "scroll";
					break;

				case "reverse":
					action = "reverse";
					break;

				case "pause":

					/*******************
					 Action: Pause
					 *******************/

					var currentTime = (new Date()).getTime();

					/* Handle delay timers */
					$.each(elements, function(i, element) {
						pauseDelayOnElement(element, currentTime);
					});

					/* Pause and Resume are call-wide (not on a per element basis). Thus, calling pause or resume on a 
					 single element will cause any calls that containt tweens for that element to be paused/resumed
					 as well. */

					/* Iterate through all calls and pause any that contain any of our elements */
					$.each(Velocity.State.calls, function(i, activeCall) {

						var found = false;
						/* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
						if (activeCall) {
							/* Iterate through the active call's targeted elements. */
							$.each(activeCall[1], function(k, activeElement) {
								var queueName = (options === undefined) ? "" : options;

								if (queueName !== true && (activeCall[2].queue !== queueName) && !(options === undefined && activeCall[2].queue === false)) {
									return true;
								}

								/* Iterate through the calls targeted by the stop command. */
								$.each(elements, function(l, element) {
									/* Check that this call was applied to the target element. */
									if (element === activeElement) {

										/* Set call to paused */
										activeCall[5] = {
											resume: false
										};

										/* Once we match an element, we can bounce out to the next call entirely */
										found = true;
										return false;
									}
								});

								/* Proceed to check next call if we have already matched */
								if (found) {
									return false;
								}
							});
						}

					});

					/* Since pause creates no new tweens, exit out of Velocity. */
					return getChain();

				case "resume":

					/*******************
					 Action: Resume
					 *******************/

					/* Handle delay timers */
					$.each(elements, function(i, element) {
						resumeDelayOnElement(element, currentTime);
					});

					/* Pause and Resume are call-wide (not on a per elemnt basis). Thus, calling pause or resume on a 
					 single element will cause any calls that containt tweens for that element to be paused/resumed
					 as well. */

					/* Iterate through all calls and pause any that contain any of our elements */
					$.each(Velocity.State.calls, function(i, activeCall) {
						var found = false;
						/* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
						if (activeCall) {
							/* Iterate through the active call's targeted elements. */
							$.each(activeCall[1], function(k, activeElement) {
								var queueName = (options === undefined) ? "" : options;

								if (queueName !== true && (activeCall[2].queue !== queueName) && !(options === undefined && activeCall[2].queue === false)) {
									return true;
								}

								/* Skip any calls that have never been paused */
								if (!activeCall[5]) {
									return true;
								}

								/* Iterate through the calls targeted by the stop command. */
								$.each(elements, function(l, element) {
									/* Check that this call was applied to the target element. */
									if (element === activeElement) {

										/* Flag a pause object to be resumed, which will occur during the next tick. In
										 addition, the pause object will at that time be deleted */
										activeCall[5].resume = true;

										/* Once we match an element, we can bounce out to the next call entirely */
										found = true;
										return false;
									}
								});

								/* Proceed to check next call if we have already matched */
								if (found) {
									return false;
								}
							});
						}

					});

					/* Since resume creates no new tweens, exit out of Velocity. */
					return getChain();

				case "finish":
				case "finishAll":
				case "stop":
					/*******************
					 Action: Stop
					 *******************/

					/* Clear the currently-active delay on each targeted element. */
					$.each(elements, function(i, element) {
						if (Data(element) && Data(element).delayTimer) {
							/* Stop the timer from triggering its cached next() function. */
							clearTimeout(Data(element).delayTimer.setTimeout);

							/* Manually call the next() function so that the subsequent queue items can progress. */
							if (Data(element).delayTimer.next) {
								Data(element).delayTimer.next();
							}

							delete Data(element).delayTimer;
						}

						/* If we want to finish everything in the queue, we have to iterate through it
						 and call each function. This will make them active calls below, which will
						 cause them to be applied via the duration setting. */
						if (propertiesMap === "finishAll" && (options === true || Type.isString(options))) {
							/* Iterate through the items in the element's queue. */
							$.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
								/* The queue array can contain an "inprogress" string, which we skip. */
								if (Type.isFunction(item)) {
									item();
								}
							});

							/* Clearing the $.queue() array is achieved by resetting it to []. */
							$.queue(element, Type.isString(options) ? options : "", []);
						}
					});

					var callsToStop = [];

					/* When the stop action is triggered, the elements' currently active call is immediately stopped. The active call might have
					 been applied to multiple elements, in which case all of the call's elements will be stopped. When an element
					 is stopped, the next item in its animation queue is immediately triggered. */
					/* An additional argument may be passed in to clear an element's remaining queued calls. Either true (which defaults to the "fx" queue)
					 or a custom queue string can be passed in. */
					/* Note: The stop command runs prior to Velocity's Queueing phase since its behavior is intended to take effect *immediately*,
					 regardless of the element's current queue state. */

					/* Iterate through every active call. */
					$.each(Velocity.State.calls, function(i, activeCall) {
						/* Inactive calls are set to false by the logic inside completeCall(). Skip them. */
						if (activeCall) {
							/* Iterate through the active call's targeted elements. */
							$.each(activeCall[1], function(k, activeElement) {
								/* If true was passed in as a secondary argument, clear absolutely all calls on this element. Otherwise, only
								 clear calls associated with the relevant queue. */
								/* Call stopping logic works as follows:
								 - options === true --> stop current default queue calls (and queue:false calls), including remaining queued ones.
								 - options === undefined --> stop current queue:"" call and all queue:false calls.
								 - options === false --> stop only queue:false calls.
								 - options === "custom" --> stop current queue:"custom" call, including remaining queued ones (there is no functionality to only clear the currently-running queue:"custom" call). */
								var queueName = (options === undefined) ? "" : options;

								if (queueName !== true && (activeCall[2].queue !== queueName) && !(options === undefined && activeCall[2].queue === false)) {
									return true;
								}

								/* Iterate through the calls targeted by the stop command. */
								$.each(elements, function(l, element) {
									/* Check that this call was applied to the target element. */
									if (element === activeElement) {
										/* Optionally clear the remaining queued calls. If we're doing "finishAll" this won't find anything,
										 due to the queue-clearing above. */
										if (options === true || Type.isString(options)) {
											/* Iterate through the items in the element's queue. */
											$.each($.queue(element, Type.isString(options) ? options : ""), function(_, item) {
												/* The queue array can contain an "inprogress" string, which we skip. */
												if (Type.isFunction(item)) {
													/* Pass the item's callback a flag indicating that we want to abort from the queue call.
													 (Specifically, the queue will resolve the call's associated promise then abort.)  */
													item(null, true);
												}
											});

											/* Clearing the $.queue() array is achieved by resetting it to []. */
											$.queue(element, Type.isString(options) ? options : "", []);
										}

										if (propertiesMap === "stop") {
											/* Since "reverse" uses cached start values (the previous call's endValues), these values must be
											 changed to reflect the final value that the elements were actually tweened to. */
											/* Note: If only queue:false animations are currently running on an element, it won't have a tweensContainer
											 object. Also, queue:false animations can't be reversed. */
											var data = Data(element);
											if (data && data.tweensContainer && queueName !== false) {
												$.each(data.tweensContainer, function(m, activeTween) {
													activeTween.endValue = activeTween.currentValue;
												});
											}

											callsToStop.push(i);
										} else if (propertiesMap === "finish" || propertiesMap === "finishAll") {
											/* To get active tweens to finish immediately, we forcefully shorten their durations to 1ms so that
											 they finish upon the next rAf tick then proceed with normal call completion logic. */
											activeCall[2].duration = 1;
										}
									}
								});
							});
						}
					});

					/* Prematurely call completeCall() on each matched active call. Pass an additional flag for "stop" to indicate
					 that the complete callback and display:none setting should be skipped since we're completing prematurely. */
					if (propertiesMap === "stop") {
						$.each(callsToStop, function(i, j) {
							completeCall(j, true);
						});

						if (promiseData.promise) {
							/* Immediately resolve the promise associated with this stop call since stop runs synchronously. */
							promiseData.resolver(elements);
						}
					}

					/* Since we're stopping, and not proceeding with queueing, exit out of Velocity. */
					return getChain();

				default:
					/* Treat a non-empty plain object as a literal properties map. */
					if ($.isPlainObject(propertiesMap) && !Type.isEmptyObject(propertiesMap)) {
						action = "start";

						/****************
						 Redirects
						 ****************/

						/* Check if a string matches a registered redirect (see Redirects above). */
					} else if (Type.isString(propertiesMap) && Velocity.Redirects[propertiesMap]) {
						opts = $.extend({}, options);

						var durationOriginal = opts.duration,
								delayOriginal = opts.delay || 0;

						/* If the backwards option was passed in, reverse the element set so that elements animate from the last to the first. */
						if (opts.backwards === true) {
							elements = $.extend(true, [], elements).reverse();
						}

						/* Individually trigger the redirect for each element in the set to prevent users from having to handle iteration logic in their redirect. */
						$.each(elements, function(elementIndex, element) {
							/* If the stagger option was passed in, successively delay each element by the stagger value (in ms). Retain the original delay value. */
							if (parseFloat(opts.stagger)) {
								opts.delay = delayOriginal + (parseFloat(opts.stagger) * elementIndex);
							} else if (Type.isFunction(opts.stagger)) {
								opts.delay = delayOriginal + opts.stagger.call(element, elementIndex, elementsLength);
							}

							/* If the drag option was passed in, successively increase/decrease (depending on the presense of opts.backwards)
							 the duration of each element's animation, using floors to prevent producing very short durations. */
							if (opts.drag) {
								/* Default the duration of UI pack effects (callouts and transitions) to 1000ms instead of the usual default duration of 400ms. */
								opts.duration = parseFloat(durationOriginal) || (/^(callout|transition)/.test(propertiesMap) ? 1000 : DURATION_DEFAULT);

								/* For each element, take the greater duration of: A) animation completion percentage relative to the original duration,
								 B) 75% of the original duration, or C) a 200ms fallback (in case duration is already set to a low value).
								 The end result is a baseline of 75% of the redirect's duration that increases/decreases as the end of the element set is approached. */
								opts.duration = Math.max(opts.duration * (opts.backwards ? 1 - elementIndex / elementsLength : (elementIndex + 1) / elementsLength), opts.duration * 0.75, 200);
							}

							/* Pass in the call's opts object so that the redirect can optionally extend it. It defaults to an empty object instead of null to
							 reduce the opts checking logic required inside the redirect. */
							Velocity.Redirects[propertiesMap].call(element, element, opts || {}, elementIndex, elementsLength, elements, promiseData.promise ? promiseData : undefined);
						});

						/* Since the animation logic resides within the redirect's own code, abort the remainder of this call.
						 (The performance overhead up to this point is virtually non-existant.) */
						/* Note: The jQuery call chain is kept intact by returning the complete element set. */
						return getChain();
					} else {
						var abortError = "Velocity: First argument (" + propertiesMap + ") was not a property map, a known action, or a registered redirect. Aborting.";

						if (promiseData.promise) {
							promiseData.rejecter(new Error(abortError));
						} else {
							console.log(abortError);
						}

						return getChain();
					}
			}

			/**************************
			 Call-Wide Variables
			 **************************/

			/* A container for CSS unit conversion ratios (e.g. %, rem, and em ==> px) that is used to cache ratios across all elements
			 being animated in a single Velocity call. Calculating unit ratios necessitates DOM querying and updating, and is therefore
			 avoided (via caching) wherever possible. This container is call-wide instead of page-wide to avoid the risk of using stale
			 conversion metrics across Velocity animations that are not immediately consecutively chained. */
			var callUnitConversionData = {
				lastParent: null,
				lastPosition: null,
				lastFontSize: null,
				lastPercentToPxWidth: null,
				lastPercentToPxHeight: null,
				lastEmToPx: null,
				remToPx: null,
				vwToPx: null,
				vhToPx: null
			};

			/* A container for all the ensuing tween data and metadata associated with this call. This container gets pushed to the page-wide
			 Velocity.State.calls array that is processed during animation ticking. */
			var call = [];

			/************************
			 Element Processing
			 ************************/

			/* Element processing consists of three parts -- data processing that cannot go stale and data processing that *can* go stale (i.e. third-party style modifications):
			 1) Pre-Queueing: Element-wide variables, including the element's data storage, are instantiated. Call options are prepared. If triggered, the Stop action is executed.
			 2) Queueing: The logic that runs once this call has reached its point of execution in the element's $.queue() stack. Most logic is placed here to avoid risking it becoming stale.
			 3) Pushing: Consolidation of the tween data followed by its push onto the global in-progress calls container.
			 `elementArrayIndex` allows passing index of the element in the original array to value functions.
			 If `elementsIndex` were used instead the index would be determined by the elements' per-element queue.
			 */
			function processElement(element, elementArrayIndex) {

				/*************************
				 Part I: Pre-Queueing
				 *************************/

				/***************************
				 Element-Wide Variables
				 ***************************/

				var /* The runtime opts object is the extension of the current call's options and Velocity's page-wide option defaults. */
						opts = $.extend({}, Velocity.defaults, options),
						/* A container for the processed data associated with each property in the propertyMap.
						 (Each property in the map produces its own "tween".) */
						tweensContainer = {},
						elementUnitConversionData;

				/******************
				 Element Init
				 ******************/

				if (Data(element) === undefined) {
					Velocity.init(element);
				}

				/******************
				 Option: Delay
				 ******************/

				/* Since queue:false doesn't respect the item's existing queue, we avoid injecting its delay here (it's set later on). */
				/* Note: Velocity rolls its own delay function since jQuery doesn't have a utility alias for $.fn.delay()
				 (and thus requires jQuery element creation, which we avoid since its overhead includes DOM querying). */
				if (parseFloat(opts.delay) && opts.queue !== false) {
					$.queue(element, opts.queue, function(next) {
						/* This is a flag used to indicate to the upcoming completeCall() function that this queue entry was initiated by Velocity. See completeCall() for further details. */
						Velocity.velocityQueueEntryFlag = true;

						/* The ensuing queue item (which is assigned to the "next" argument that $.queue() automatically passes in) will be triggered after a setTimeout delay.
						 The setTimeout is stored so that it can be subjected to clearTimeout() if this animation is prematurely stopped via Velocity's "stop" command, and
						 delayBegin/delayTime is used to ensure we can "pause" and "resume" a tween that is still mid-delay. */

						/* Temporarily store delayed elements to facilite access for global pause/resume */
						var callIndex = Velocity.State.delayedElements.count++;
						Velocity.State.delayedElements[callIndex] = element;

						var delayComplete = (function(index) {
							return function() {
								/* Clear the temporary element */
								Velocity.State.delayedElements[index] = false;

								/* Finally, issue the call */
								next();
							};
						})(callIndex);


						Data(element).delayBegin = (new Date()).getTime();
						Data(element).delay = parseFloat(opts.delay);
						Data(element).delayTimer = {
							setTimeout: setTimeout(next, parseFloat(opts.delay)),
							next: delayComplete
						};
					});
				}

				/*********************
				 Option: Duration
				 *********************/

				/* Support for jQuery's named durations. */
				switch (opts.duration.toString().toLowerCase()) {
					case "fast":
						opts.duration = 200;
						break;

					case "normal":
						opts.duration = DURATION_DEFAULT;
						break;

					case "slow":
						opts.duration = 600;
						break;

					default:
						/* Remove the potential "ms" suffix and default to 1 if the user is attempting to set a duration of 0 (in order to produce an immediate style change). */
						opts.duration = parseFloat(opts.duration) || 1;
				}

				/************************
				 Global Option: Mock
				 ************************/

				if (Velocity.mock !== false) {
					/* In mock mode, all animations are forced to 1ms so that they occur immediately upon the next rAF tick.
					 Alternatively, a multiplier can be passed in to time remap all delays and durations. */
					if (Velocity.mock === true) {
						opts.duration = opts.delay = 1;
					} else {
						opts.duration *= parseFloat(Velocity.mock) || 1;
						opts.delay *= parseFloat(Velocity.mock) || 1;
					}
				}

				/*******************
				 Option: Easing
				 *******************/

				opts.easing = getEasing(opts.easing, opts.duration);

				/**********************
				 Option: Callbacks
				 **********************/

				/* Callbacks must functions. Otherwise, default to null. */
				if (opts.begin && !Type.isFunction(opts.begin)) {
					opts.begin = null;
				}

				if (opts.progress && !Type.isFunction(opts.progress)) {
					opts.progress = null;
				}

				if (opts.complete && !Type.isFunction(opts.complete)) {
					opts.complete = null;
				}

				/*********************************
				 Option: Display & Visibility
				 *********************************/

				/* Refer to Velocity's documentation (VelocityJS.org/#displayAndVisibility) for a description of the display and visibility options' behavior. */
				/* Note: We strictly check for undefined instead of falsiness because display accepts an empty string value. */
				if (opts.display !== undefined && opts.display !== null) {
					opts.display = opts.display.toString().toLowerCase();

					/* Users can pass in a special "auto" value to instruct Velocity to set the element to its default display value. */
					if (opts.display === "auto") {
						opts.display = Velocity.CSS.Values.getDisplayType(element);
					}
				}

				if (opts.visibility !== undefined && opts.visibility !== null) {
					opts.visibility = opts.visibility.toString().toLowerCase();
				}

				/**********************
				 Option: mobileHA
				 **********************/

				/* When set to true, and if this is a mobile device, mobileHA automatically enables hardware acceleration (via a null transform hack)
				 on animating elements. HA is removed from the element at the completion of its animation. */
				/* Note: Android Gingerbread doesn't support HA. If a null transform hack (mobileHA) is in fact set, it will prevent other tranform subproperties from taking effect. */
				/* Note: You can read more about the use of mobileHA in Velocity's documentation: VelocityJS.org/#mobileHA. */
				opts.mobileHA = (opts.mobileHA && Velocity.State.isMobile && !Velocity.State.isGingerbread);

				/***********************
				 Part II: Queueing
				 ***********************/

				/* When a set of elements is targeted by a Velocity call, the set is broken up and each element has the current Velocity call individually queued onto it.
				 In this way, each element's existing queue is respected; some elements may already be animating and accordingly should not have this current Velocity call triggered immediately. */
				/* In each queue, tween data is processed for each animating property then pushed onto the call-wide calls array. When the last element in the set has had its tweens processed,
				 the call array is pushed to Velocity.State.calls for live processing by the requestAnimationFrame tick. */
				function buildQueue(next) {
					var data, lastTweensContainer;

					/*******************
					 Option: Begin
					 *******************/

					/* The begin callback is fired once per call -- not once per elemenet -- and is passed the full raw DOM element set as both its context and its first argument. */
					if (opts.begin && elementsIndex === 0) {
						/* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
						try {
							opts.begin.call(elements, elements);
						} catch (error) {
							setTimeout(function() {
								throw error;
							}, 1);
						}
					}

					/*****************************************
					 Tween Data Construction (for Scroll)
					 *****************************************/

					/* Note: In order to be subjected to chaining and animation options, scroll's tweening is routed through Velocity as if it were a standard CSS property animation. */
					if (action === "scroll") {
						/* The scroll action uniquely takes an optional "offset" option -- specified in pixels -- that offsets the targeted scroll position. */
						var scrollDirection = (/^x$/i.test(opts.axis) ? "Left" : "Top"),
								scrollOffset = parseFloat(opts.offset) || 0,
								scrollPositionCurrent,
								scrollPositionCurrentAlternate,
								scrollPositionEnd;

						/* Scroll also uniquely takes an optional "container" option, which indicates the parent element that should be scrolled --
						 as opposed to the browser window itself. This is useful for scrolling toward an element that's inside an overflowing parent element. */
						if (opts.container) {
							/* Ensure that either a jQuery object or a raw DOM element was passed in. */
							if (Type.isWrapped(opts.container) || Type.isNode(opts.container)) {
								/* Extract the raw DOM element from the jQuery wrapper. */
								opts.container = opts.container[0] || opts.container;
								/* Note: Unlike other properties in Velocity, the browser's scroll position is never cached since it so frequently changes
								 (due to the user's natural interaction with the page). */
								scrollPositionCurrent = opts.container["scroll" + scrollDirection]; /* GET */

								/* $.position() values are relative to the container's currently viewable area (without taking into account the container's true dimensions
								 -- say, for example, if the container was not overflowing). Thus, the scroll end value is the sum of the child element's position *and*
								 the scroll container's current scroll position. */
								scrollPositionEnd = (scrollPositionCurrent + $(element).position()[scrollDirection.toLowerCase()]) + scrollOffset; /* GET */
								/* If a value other than a jQuery object or a raw DOM element was passed in, default to null so that this option is ignored. */
							} else {
								opts.container = null;
							}
						} else {
							/* If the window itself is being scrolled -- not a containing element -- perform a live scroll position lookup using
							 the appropriate cached property names (which differ based on browser type). */
							scrollPositionCurrent = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + scrollDirection]]; /* GET */
							/* When scrolling the browser window, cache the alternate axis's current value since window.scrollTo() doesn't let us change only one value at a time. */
							scrollPositionCurrentAlternate = Velocity.State.scrollAnchor[Velocity.State["scrollProperty" + (scrollDirection === "Left" ? "Top" : "Left")]]; /* GET */

							/* Unlike $.position(), $.offset() values are relative to the browser window's true dimensions -- not merely its currently viewable area --
							 and therefore end values do not need to be compounded onto current values. */
							scrollPositionEnd = $(element).offset()[scrollDirection.toLowerCase()] + scrollOffset; /* GET */
						}

						/* Since there's only one format that scroll's associated tweensContainer can take, we create it manually. */
						tweensContainer = {
							scroll: {
								rootPropertyValue: false,
								startValue: scrollPositionCurrent,
								currentValue: scrollPositionCurrent,
								endValue: scrollPositionEnd,
								unitType: "",
								easing: opts.easing,
								scrollData: {
									container: opts.container,
									direction: scrollDirection,
									alternateValue: scrollPositionCurrentAlternate
								}
							},
							element: element
						};

						if (Velocity.debug) {
							console.log("tweensContainer (scroll): ", tweensContainer.scroll, element);
						}

						/******************************************
						 Tween Data Construction (for Reverse)
						 ******************************************/

						/* Reverse acts like a "start" action in that a property map is animated toward. The only difference is
						 that the property map used for reverse is the inverse of the map used in the previous call. Thus, we manipulate
						 the previous call to construct our new map: use the previous map's end values as our new map's start values. Copy over all other data. */
						/* Note: Reverse can be directly called via the "reverse" parameter, or it can be indirectly triggered via the loop option. (Loops are composed of multiple reverses.) */
						/* Note: Reverse calls do not need to be consecutively chained onto a currently-animating element in order to operate on cached values;
						 there is no harm to reverse being called on a potentially stale data cache since reverse's behavior is simply defined
						 as reverting to the element's values as they were prior to the previous *Velocity* call. */
					} else if (action === "reverse") {
						data = Data(element);

						/* Abort if there is no prior animation data to reverse to. */
						if (!data) {
							return;
						}

						if (!data.tweensContainer) {
							/* Dequeue the element so that this queue entry releases itself immediately, allowing subsequent queue entries to run. */
							$.dequeue(element, opts.queue);

							return;
						} else {
							/*********************
							 Options Parsing
							 *********************/

							/* If the element was hidden via the display option in the previous call,
							 revert display to "auto" prior to reversal so that the element is visible again. */
							if (data.opts.display === "none") {
								data.opts.display = "auto";
							}

							if (data.opts.visibility === "hidden") {
								data.opts.visibility = "visible";
							}

							/* If the loop option was set in the previous call, disable it so that "reverse" calls aren't recursively generated.
							 Further, remove the previous call's callback options; typically, users do not want these to be refired. */
							data.opts.loop = false;
							data.opts.begin = null;
							data.opts.complete = null;

							/* Since we're extending an opts object that has already been extended with the defaults options object,
							 we remove non-explicitly-defined properties that are auto-assigned values. */
							if (!options.easing) {
								delete opts.easing;
							}

							if (!options.duration) {
								delete opts.duration;
							}

							/* The opts object used for reversal is an extension of the options object optionally passed into this
							 reverse call plus the options used in the previous Velocity call. */
							opts = $.extend({}, data.opts, opts);

							/*************************************
							 Tweens Container Reconstruction
							 *************************************/

							/* Create a deepy copy (indicated via the true flag) of the previous call's tweensContainer. */
							lastTweensContainer = $.extend(true, {}, data ? data.tweensContainer : null);

							/* Manipulate the previous tweensContainer by replacing its end values and currentValues with its start values. */
							for (var lastTween in lastTweensContainer) {
								/* In addition to tween data, tweensContainers contain an element property that we ignore here. */
								if (lastTweensContainer.hasOwnProperty(lastTween) && lastTween !== "element") {
									var lastStartValue = lastTweensContainer[lastTween].startValue;

									lastTweensContainer[lastTween].startValue = lastTweensContainer[lastTween].currentValue = lastTweensContainer[lastTween].endValue;
									lastTweensContainer[lastTween].endValue = lastStartValue;

									/* Easing is the only option that embeds into the individual tween data (since it can be defined on a per-property basis).
									 Accordingly, every property's easing value must be updated when an options object is passed in with a reverse call.
									 The side effect of this extensibility is that all per-property easing values are forcefully reset to the new value. */
									if (!Type.isEmptyObject(options)) {
										lastTweensContainer[lastTween].easing = opts.easing;
									}

									if (Velocity.debug) {
										console.log("reverse tweensContainer (" + lastTween + "): " + JSON.stringify(lastTweensContainer[lastTween]), element);
									}
								}
							}

							tweensContainer = lastTweensContainer;
						}

						/*****************************************
						 Tween Data Construction (for Start)
						 *****************************************/

					} else if (action === "start") {

						/*************************
						 Value Transferring
						 *************************/

						/* If this queue entry follows a previous Velocity-initiated queue entry *and* if this entry was created
						 while the element was in the process of being animated by Velocity, then this current call is safe to use
						 the end values from the prior call as its start values. Velocity attempts to perform this value transfer
						 process whenever possible in order to avoid requerying the DOM. */
						/* If values aren't transferred from a prior call and start values were not forcefed by the user (more on this below),
						 then the DOM is queried for the element's current values as a last resort. */
						/* Note: Conversely, animation reversal (and looping) *always* perform inter-call value transfers; they never requery the DOM. */

						data = Data(element);

						/* The per-element isAnimating flag is used to indicate whether it's safe (i.e. the data isn't stale)
						 to transfer over end values to use as start values. If it's set to true and there is a previous
						 Velocity call to pull values from, do so. */
						if (data && data.tweensContainer && data.isAnimating === true) {
							lastTweensContainer = data.tweensContainer;
						}

						/***************************
						 Tween Data Calculation
						 ***************************/

						/* This function parses property data and defaults endValue, easing, and startValue as appropriate. */
						/* Property map values can either take the form of 1) a single value representing the end value,
						 or 2) an array in the form of [ endValue, [, easing] [, startValue] ].
						 The optional third parameter is a forcefed startValue to be used instead of querying the DOM for
						 the element's current value. Read Velocity's docmentation to learn more about forcefeeding: VelocityJS.org/#forcefeeding */
						var parsePropertyValue = function(valueData, skipResolvingEasing) {
							var endValue, easing, startValue;

							/* If we have a function as the main argument then resolve it first, in case it returns an array that needs to be split */
							if (Type.isFunction(valueData)) {
								valueData = valueData.call(element, elementArrayIndex, elementsLength);
							}

							/* Handle the array format, which can be structured as one of three potential overloads:
							 A) [ endValue, easing, startValue ], B) [ endValue, easing ], or C) [ endValue, startValue ] */
							if (Type.isArray(valueData)) {
								/* endValue is always the first item in the array. Don't bother validating endValue's value now
								 since the ensuing property cycling logic does that. */
								endValue = valueData[0];

								/* Two-item array format: If the second item is a number, function, or hex string, treat it as a
								 start value since easings can only be non-hex strings or arrays. */
								if ((!Type.isArray(valueData[1]) && /^[\d-]/.test(valueData[1])) || Type.isFunction(valueData[1]) || CSS.RegEx.isHex.test(valueData[1])) {
									startValue = valueData[1];
									/* Two or three-item array: If the second item is a non-hex string easing name or an array, treat it as an easing. */
								} else if ((Type.isString(valueData[1]) && !CSS.RegEx.isHex.test(valueData[1]) && Velocity.Easings[valueData[1]]) || Type.isArray(valueData[1])) {
									easing = skipResolvingEasing ? valueData[1] : getEasing(valueData[1], opts.duration);

									/* Don't bother validating startValue's value now since the ensuing property cycling logic inherently does that. */
									startValue = valueData[2];
								} else {
									startValue = valueData[1] || valueData[2];
								}
								/* Handle the single-value format. */
							} else {
								endValue = valueData;
							}

							/* Default to the call's easing if a per-property easing type was not defined. */
							if (!skipResolvingEasing) {
								easing = easing || opts.easing;
							}

							/* If functions were passed in as values, pass the function the current element as its context,
							 plus the element's index and the element set's size as arguments. Then, assign the returned value. */
							if (Type.isFunction(endValue)) {
								endValue = endValue.call(element, elementArrayIndex, elementsLength);
							}

							if (Type.isFunction(startValue)) {
								startValue = startValue.call(element, elementArrayIndex, elementsLength);
							}

							/* Allow startValue to be left as undefined to indicate to the ensuing code that its value was not forcefed. */
							return [endValue || 0, easing, startValue];
						};

						var fixPropertyValue = function(property, valueData) {
							/* In case this property is a hook, there are circumstances where we will intend to work on the hook's root property and not the hooked subproperty. */
							var rootProperty = CSS.Hooks.getRoot(property),
									rootPropertyValue = false,
									/* Parse out endValue, easing, and startValue from the property's data. */
									endValue = valueData[0],
									easing = valueData[1],
									startValue = valueData[2],
									pattern;

							/**************************
							 Start Value Sourcing
							 **************************/

							/* Other than for the dummy tween property, properties that are not supported by the browser (and do not have an associated normalization) will
							 inherently produce no style changes when set, so they are skipped in order to decrease animation tick overhead.
							 Property support is determined via prefixCheck(), which returns a false flag when no supported is detected. */
							/* Note: Since SVG elements have some of their properties directly applied as HTML attributes,
							 there is no way to check for their explicit browser support, and so we skip skip this check for them. */
							if ((!data || !data.isSVG) && rootProperty !== "tween" && CSS.Names.prefixCheck(rootProperty)[1] === false && CSS.Normalizations.registered[rootProperty] === undefined) {
								if (Velocity.debug) {
									console.log("Skipping [" + rootProperty + "] due to a lack of browser support.");
								}
								return;
							}

							/* If the display option is being set to a non-"none" (e.g. "block") and opacity (filter on IE<=8) is being
							 animated to an endValue of non-zero, the user's intention is to fade in from invisible, thus we forcefeed opacity
							 a startValue of 0 if its startValue hasn't already been sourced by value transferring or prior forcefeeding. */
							if (((opts.display !== undefined && opts.display !== null && opts.display !== "none") || (opts.visibility !== undefined && opts.visibility !== "hidden")) && /opacity|filter/.test(property) && !startValue && endValue !== 0) {
								startValue = 0;
							}

							/* If values have been transferred from the previous Velocity call, extract the endValue and rootPropertyValue
							 for all of the current call's properties that were *also* animated in the previous call. */
							/* Note: Value transferring can optionally be disabled by the user via the _cacheValues option. */
							if (opts._cacheValues && lastTweensContainer && lastTweensContainer[property]) {
								if (startValue === undefined) {
									startValue = lastTweensContainer[property].endValue + lastTweensContainer[property].unitType;
								}

								/* The previous call's rootPropertyValue is extracted from the element's data cache since that's the
								 instance of rootPropertyValue that gets freshly updated by the tweening process, whereas the rootPropertyValue
								 attached to the incoming lastTweensContainer is equal to the root property's value prior to any tweening. */
								rootPropertyValue = data.rootPropertyValueCache[rootProperty];
								/* If values were not transferred from a previous Velocity call, query the DOM as needed. */
							} else {
								/* Handle hooked properties. */
								if (CSS.Hooks.registered[property]) {
									if (startValue === undefined) {
										rootPropertyValue = CSS.getPropertyValue(element, rootProperty); /* GET */
										/* Note: The following getPropertyValue() call does not actually trigger a DOM query;
										 getPropertyValue() will extract the hook from rootPropertyValue. */
										startValue = CSS.getPropertyValue(element, property, rootPropertyValue);
										/* If startValue is already defined via forcefeeding, do not query the DOM for the root property's value;
										 just grab rootProperty's zero-value template from CSS.Hooks. This overwrites the element's actual
										 root property value (if one is set), but this is acceptable since the primary reason users forcefeed is
										 to avoid DOM queries, and thus we likewise avoid querying the DOM for the root property's value. */
									} else {
										/* Grab this hook's zero-value template, e.g. "0px 0px 0px black". */
										rootPropertyValue = CSS.Hooks.templates[rootProperty][1];
									}
									/* Handle non-hooked properties that haven't already been defined via forcefeeding. */
								} else if (startValue === undefined) {
									startValue = CSS.getPropertyValue(element, property); /* GET */
								}
							}

							/**************************
							 Value Data Extraction
							 **************************/

							var separatedValue,
									endValueUnitType,
									startValueUnitType,
									operator = false;

							/* Separates a property value into its numeric value and its unit type. */
							var separateValue = function(property, value) {
								var unitType,
										numericValue;

								numericValue = (value || "0")
										.toString()
										.toLowerCase()
										/* Match the unit type at the end of the value. */
										.replace(/[%A-z]+$/, function(match) {
											/* Grab the unit type. */
											unitType = match;

											/* Strip the unit type off of value. */
											return "";
										});

								/* If no unit type was supplied, assign one that is appropriate for this property (e.g. "deg" for rotateZ or "px" for width). */
								if (!unitType) {
									unitType = CSS.Values.getUnitType(property);
								}

								return [numericValue, unitType];
							};

							if (startValue !== endValue && Type.isString(startValue) && Type.isString(endValue)) {
								pattern = "";
								var iStart = 0, // index in startValue
										iEnd = 0, // index in endValue
										aStart = [], // array of startValue numbers
										aEnd = [], // array of endValue numbers
										inCalc = 0, // Keep track of being inside a "calc()" so we don't duplicate it
										inRGB = 0, // Keep track of being inside an RGB as we can't use fractional values
										inRGBA = 0; // Keep track of being inside an RGBA as we must pass fractional for the alpha channel

								startValue = CSS.Hooks.fixColors(startValue);
								endValue = CSS.Hooks.fixColors(endValue);
								while (iStart < startValue.length && iEnd < endValue.length) {
									var cStart = startValue[iStart],
											cEnd = endValue[iEnd];

									if (/[\d\.-]/.test(cStart) && /[\d\.-]/.test(cEnd)) {
										var tStart = cStart, // temporary character buffer
												tEnd = cEnd, // temporary character buffer
												dotStart = ".", // Make sure we can only ever match a single dot in a decimal
												dotEnd = "."; // Make sure we can only ever match a single dot in a decimal

										while (++iStart < startValue.length) {
											cStart = startValue[iStart];
											if (cStart === dotStart) {
												dotStart = ".."; // Can never match two characters
											} else if (!/\d/.test(cStart)) {
												break;
											}
											tStart += cStart;
										}
										while (++iEnd < endValue.length) {
											cEnd = endValue[iEnd];
											if (cEnd === dotEnd) {
												dotEnd = ".."; // Can never match two characters
											} else if (!/\d/.test(cEnd)) {
												break;
											}
											tEnd += cEnd;
										}
										var uStart = CSS.Hooks.getUnit(startValue, iStart), // temporary unit type
												uEnd = CSS.Hooks.getUnit(endValue, iEnd); // temporary unit type

										iStart += uStart.length;
										iEnd += uEnd.length;
										if (uStart === uEnd) {
											// Same units
											if (tStart === tEnd) {
												// Same numbers, so just copy over
												pattern += tStart + uStart;
											} else {
												// Different numbers, so store them
												pattern += "{" + aStart.length + (inRGB ? "!" : "") + "}" + uStart;
												aStart.push(parseFloat(tStart));
												aEnd.push(parseFloat(tEnd));
											}
										} else {
											// Different units, so put into a "calc(from + to)" and animate each side to/from zero
											var nStart = parseFloat(tStart),
													nEnd = parseFloat(tEnd);

											pattern += (inCalc < 5 ? "calc" : "") + "("
													+ (nStart ? "{" + aStart.length + (inRGB ? "!" : "") + "}" : "0") + uStart
													+ " + "
													+ (nEnd ? "{" + (aStart.length + (nStart ? 1 : 0)) + (inRGB ? "!" : "") + "}" : "0") + uEnd
													+ ")";
											if (nStart) {
												aStart.push(nStart);
												aEnd.push(0);
											}
											if (nEnd) {
												aStart.push(0);
												aEnd.push(nEnd);
											}
										}
									} else if (cStart === cEnd) {
										pattern += cStart;
										iStart++;
										iEnd++;
										// Keep track of being inside a calc()
										if (inCalc === 0 && cStart === "c"
												|| inCalc === 1 && cStart === "a"
												|| inCalc === 2 && cStart === "l"
												|| inCalc === 3 && cStart === "c"
												|| inCalc >= 4 && cStart === "("
												) {
											inCalc++;
										} else if ((inCalc && inCalc < 5)
												|| inCalc >= 4 && cStart === ")" && --inCalc < 5) {
											inCalc = 0;
										}
										// Keep track of being inside an rgb() / rgba()
										if (inRGB === 0 && cStart === "r"
												|| inRGB === 1 && cStart === "g"
												|| inRGB === 2 && cStart === "b"
												|| inRGB === 3 && cStart === "a"
												|| inRGB >= 3 && cStart === "("
												) {
											if (inRGB === 3 && cStart === "a") {
												inRGBA = 1;
											}
											inRGB++;
										} else if (inRGBA && cStart === ",") {
											if (++inRGBA > 3) {
												inRGB = inRGBA = 0;
											}
										} else if ((inRGBA && inRGB < (inRGBA ? 5 : 4))
												|| inRGB >= (inRGBA ? 4 : 3) && cStart === ")" && --inRGB < (inRGBA ? 5 : 4)) {
											inRGB = inRGBA = 0;
										}
									} else {
										inCalc = 0;
										// TODO: changing units, fixing colours
										break;
									}
								}
								if (iStart !== startValue.length || iEnd !== endValue.length) {
									if (Velocity.debug) {
										console.error("Trying to pattern match mis-matched strings [\"" + endValue + "\", \"" + startValue + "\"]");
									}
									pattern = undefined;
								}
								if (pattern) {
									if (aStart.length) {
										if (Velocity.debug) {
											console.log("Pattern found \"" + pattern + "\" -> ", aStart, aEnd, "[" + startValue + "," + endValue + "]");
										}
										startValue = aStart;
										endValue = aEnd;
										endValueUnitType = startValueUnitType = "";
									} else {
										pattern = undefined;
									}
								}
							}

							if (!pattern) {
								/* Separate startValue. */
								separatedValue = separateValue(property, startValue);
								startValue = separatedValue[0];
								startValueUnitType = separatedValue[1];

								/* Separate endValue, and extract a value operator (e.g. "+=", "-=") if one exists. */
								separatedValue = separateValue(property, endValue);
								endValue = separatedValue[0].replace(/^([+-\/*])=/, function(match, subMatch) {
									operator = subMatch;

									/* Strip the operator off of the value. */
									return "";
								});
								endValueUnitType = separatedValue[1];

								/* Parse float values from endValue and startValue. Default to 0 if NaN is returned. */
								startValue = parseFloat(startValue) || 0;
								endValue = parseFloat(endValue) || 0;

								/***************************************
								 Property-Specific Value Conversion
								 ***************************************/

								/* Custom support for properties that don't actually accept the % unit type, but where pollyfilling is trivial and relatively foolproof. */
								if (endValueUnitType === "%") {
									/* A %-value fontSize/lineHeight is relative to the parent's fontSize (as opposed to the parent's dimensions),
									 which is identical to the em unit's behavior, so we piggyback off of that. */
									if (/^(fontSize|lineHeight)$/.test(property)) {
										/* Convert % into an em decimal value. */
										endValue = endValue / 100;
										endValueUnitType = "em";
										/* For scaleX and scaleY, convert the value into its decimal format and strip off the unit type. */
									} else if (/^scale/.test(property)) {
										endValue = endValue / 100;
										endValueUnitType = "";
										/* For RGB components, take the defined percentage of 255 and strip off the unit type. */
									} else if (/(Red|Green|Blue)$/i.test(property)) {
										endValue = (endValue / 100) * 255;
										endValueUnitType = "";
									}
								}
							}

							/***************************
							 Unit Ratio Calculation
							 ***************************/

							/* When queried, the browser returns (most) CSS property values in pixels. Therefore, if an endValue with a unit type of
							 %, em, or rem is animated toward, startValue must be converted from pixels into the same unit type as endValue in order
							 for value manipulation logic (increment/decrement) to proceed. Further, if the startValue was forcefed or transferred
							 from a previous call, startValue may also not be in pixels. Unit conversion logic therefore consists of two steps:
							 1) Calculating the ratio of %/em/rem/vh/vw relative to pixels
							 2) Converting startValue into the same unit of measurement as endValue based on these ratios. */
							/* Unit conversion ratios are calculated by inserting a sibling node next to the target node, copying over its position property,
							 setting values with the target unit type then comparing the returned pixel value. */
							/* Note: Even if only one of these unit types is being animated, all unit ratios are calculated at once since the overhead
							 of batching the SETs and GETs together upfront outweights the potential overhead
							 of layout thrashing caused by re-querying for uncalculated ratios for subsequently-processed properties. */
							/* Todo: Shift this logic into the calls' first tick instance so that it's synced with RAF. */
							var calculateUnitRatios = function() {

								/************************
								 Same Ratio Checks
								 ************************/

								/* The properties below are used to determine whether the element differs sufficiently from this call's
								 previously iterated element to also differ in its unit conversion ratios. If the properties match up with those
								 of the prior element, the prior element's conversion ratios are used. Like most optimizations in Velocity,
								 this is done to minimize DOM querying. */
								var sameRatioIndicators = {
									myParent: element.parentNode || document.body, /* GET */
									position: CSS.getPropertyValue(element, "position"), /* GET */
									fontSize: CSS.getPropertyValue(element, "fontSize") /* GET */
								},
										/* Determine if the same % ratio can be used. % is based on the element's position value and its parent's width and height dimensions. */
										samePercentRatio = ((sameRatioIndicators.position === callUnitConversionData.lastPosition) && (sameRatioIndicators.myParent === callUnitConversionData.lastParent)),
										/* Determine if the same em ratio can be used. em is relative to the element's fontSize. */
										sameEmRatio = (sameRatioIndicators.fontSize === callUnitConversionData.lastFontSize);

								/* Store these ratio indicators call-wide for the next element to compare against. */
								callUnitConversionData.lastParent = sameRatioIndicators.myParent;
								callUnitConversionData.lastPosition = sameRatioIndicators.position;
								callUnitConversionData.lastFontSize = sameRatioIndicators.fontSize;

								/***************************
								 Element-Specific Units
								 ***************************/

								/* Note: IE8 rounds to the nearest pixel when returning CSS values, thus we perform conversions using a measurement
								 of 100 (instead of 1) to give our ratios a precision of at least 2 decimal values. */
								var measurement = 100,
										unitRatios = {};

								if (!sameEmRatio || !samePercentRatio) {
									var dummy = data && data.isSVG ? document.createElementNS("http://www.w3.org/2000/svg", "rect") : document.createElement("div");

									Velocity.init(dummy);
									sameRatioIndicators.myParent.appendChild(dummy);

									/* To accurately and consistently calculate conversion ratios, the element's cascaded overflow and box-sizing are stripped.
									 Similarly, since width/height can be artificially constrained by their min-/max- equivalents, these are controlled for as well. */
									/* Note: Overflow must be also be controlled for per-axis since the overflow property overwrites its per-axis values. */
									$.each(["overflow", "overflowX", "overflowY"], function(i, property) {
										Velocity.CSS.setPropertyValue(dummy, property, "hidden");
									});
									Velocity.CSS.setPropertyValue(dummy, "position", sameRatioIndicators.position);
									Velocity.CSS.setPropertyValue(dummy, "fontSize", sameRatioIndicators.fontSize);
									Velocity.CSS.setPropertyValue(dummy, "boxSizing", "content-box");

									/* width and height act as our proxy properties for measuring the horizontal and vertical % ratios. */
									$.each(["minWidth", "maxWidth", "width", "minHeight", "maxHeight", "height"], function(i, property) {
										Velocity.CSS.setPropertyValue(dummy, property, measurement + "%");
									});
									/* paddingLeft arbitrarily acts as our proxy property for the em ratio. */
									Velocity.CSS.setPropertyValue(dummy, "paddingLeft", measurement + "em");

									/* Divide the returned value by the measurement to get the ratio between 1% and 1px. Default to 1 since working with 0 can produce Infinite. */
									unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth = (parseFloat(CSS.getPropertyValue(dummy, "width", null, true)) || 1) / measurement; /* GET */
									unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight = (parseFloat(CSS.getPropertyValue(dummy, "height", null, true)) || 1) / measurement; /* GET */
									unitRatios.emToPx = callUnitConversionData.lastEmToPx = (parseFloat(CSS.getPropertyValue(dummy, "paddingLeft")) || 1) / measurement; /* GET */

									sameRatioIndicators.myParent.removeChild(dummy);
								} else {
									unitRatios.emToPx = callUnitConversionData.lastEmToPx;
									unitRatios.percentToPxWidth = callUnitConversionData.lastPercentToPxWidth;
									unitRatios.percentToPxHeight = callUnitConversionData.lastPercentToPxHeight;
								}

								/***************************
								 Element-Agnostic Units
								 ***************************/

								/* Whereas % and em ratios are determined on a per-element basis, the rem unit only needs to be checked
								 once per call since it's exclusively dependant upon document.body's fontSize. If this is the first time
								 that calculateUnitRatios() is being run during this call, remToPx will still be set to its default value of null,
								 so we calculate it now. */
								if (callUnitConversionData.remToPx === null) {
									/* Default to browsers' default fontSize of 16px in the case of 0. */
									callUnitConversionData.remToPx = parseFloat(CSS.getPropertyValue(document.body, "fontSize")) || 16; /* GET */
								}

								/* Similarly, viewport units are %-relative to the window's inner dimensions. */
								if (callUnitConversionData.vwToPx === null) {
									callUnitConversionData.vwToPx = parseFloat(window.innerWidth) / 100; /* GET */
									callUnitConversionData.vhToPx = parseFloat(window.innerHeight) / 100; /* GET */
								}

								unitRatios.remToPx = callUnitConversionData.remToPx;
								unitRatios.vwToPx = callUnitConversionData.vwToPx;
								unitRatios.vhToPx = callUnitConversionData.vhToPx;

								if (Velocity.debug >= 1) {
									console.log("Unit ratios: " + JSON.stringify(unitRatios), element);
								}
								return unitRatios;
							};

							/********************
							 Unit Conversion
							 ********************/

							/* The * and / operators, which are not passed in with an associated unit, inherently use startValue's unit. Skip value and unit conversion. */
							if (/[\/*]/.test(operator)) {
								endValueUnitType = startValueUnitType;
								/* If startValue and endValue differ in unit type, convert startValue into the same unit type as endValue so that if endValueUnitType
								 is a relative unit (%, em, rem), the values set during tweening will continue to be accurately relative even if the metrics they depend
								 on are dynamically changing during the course of the animation. Conversely, if we always normalized into px and used px for setting values, the px ratio
								 would become stale if the original unit being animated toward was relative and the underlying metrics change during the animation. */
								/* Since 0 is 0 in any unit type, no conversion is necessary when startValue is 0 -- we just start at 0 with endValueUnitType. */
							} else if ((startValueUnitType !== endValueUnitType) && startValue !== 0) {
								/* Unit conversion is also skipped when endValue is 0, but *startValueUnitType* must be used for tween values to remain accurate. */
								/* Note: Skipping unit conversion here means that if endValueUnitType was originally a relative unit, the animation won't relatively
								 match the underlying metrics if they change, but this is acceptable since we're animating toward invisibility instead of toward visibility,
								 which remains past the point of the animation's completion. */
								if (endValue === 0) {
									endValueUnitType = startValueUnitType;
								} else {
									/* By this point, we cannot avoid unit conversion (it's undesirable since it causes layout thrashing).
									 If we haven't already, we trigger calculateUnitRatios(), which runs once per element per call. */
									elementUnitConversionData = elementUnitConversionData || calculateUnitRatios();

									/* The following RegEx matches CSS properties that have their % values measured relative to the x-axis. */
									/* Note: W3C spec mandates that all of margin and padding's properties (even top and bottom) are %-relative to the *width* of the parent element. */
									var axis = (/margin|padding|left|right|width|text|word|letter/i.test(property) || /X$/.test(property) || property === "x") ? "x" : "y";

									/* In order to avoid generating n^2 bespoke conversion functions, unit conversion is a two-step process:
									 1) Convert startValue into pixels. 2) Convert this new pixel value into endValue's unit type. */
									switch (startValueUnitType) {
										case "%":
											/* Note: translateX and translateY are the only properties that are %-relative to an element's own dimensions -- not its parent's dimensions.
											 Velocity does not include a special conversion process to account for this behavior. Therefore, animating translateX/Y from a % value
											 to a non-% value will produce an incorrect start value. Fortunately, this sort of cross-unit conversion is rarely done by users in practice. */
											startValue *= (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
											break;

										case "px":
											/* px acts as our midpoint in the unit conversion process; do nothing. */
											break;

										default:
											startValue *= elementUnitConversionData[startValueUnitType + "ToPx"];
									}

									/* Invert the px ratios to convert into to the target unit. */
									switch (endValueUnitType) {
										case "%":
											startValue *= 1 / (axis === "x" ? elementUnitConversionData.percentToPxWidth : elementUnitConversionData.percentToPxHeight);
											break;

										case "px":
											/* startValue is already in px, do nothing; we're done. */
											break;

										default:
											startValue *= 1 / elementUnitConversionData[endValueUnitType + "ToPx"];
									}
								}
							}

							/*********************
							 Relative Values
							 *********************/

							/* Operator logic must be performed last since it requires unit-normalized start and end values. */
							/* Note: Relative *percent values* do not behave how most people think; while one would expect "+=50%"
							 to increase the property 1.5x its current value, it in fact increases the percent units in absolute terms:
							 50 points is added on top of the current % value. */
							switch (operator) {
								case "+":
									endValue = startValue + endValue;
									break;

								case "-":
									endValue = startValue - endValue;
									break;

								case "*":
									endValue = startValue * endValue;
									break;

								case "/":
									endValue = startValue / endValue;
									break;
							}

							/**************************
							 tweensContainer Push
							 **************************/

							/* Construct the per-property tween object, and push it to the element's tweensContainer. */
							tweensContainer[property] = {
								rootPropertyValue: rootPropertyValue,
								startValue: startValue,
								currentValue: startValue,
								endValue: endValue,
								unitType: endValueUnitType,
								easing: easing
							};
							if (pattern) {
								tweensContainer[property].pattern = pattern;
							}

							if (Velocity.debug) {
								console.log("tweensContainer (" + property + "): " + JSON.stringify(tweensContainer[property]), element);
							}
						};

						/* Create a tween out of each property, and append its associated data to tweensContainer. */
						for (var property in propertiesMap) {

							if (!propertiesMap.hasOwnProperty(property)) {
								continue;
							}
							/* The original property name's format must be used for the parsePropertyValue() lookup,
							 but we then use its camelCase styling to normalize it for manipulation. */
							var propertyName = CSS.Names.camelCase(property),
									valueData = parsePropertyValue(propertiesMap[property]);

							/* Find shorthand color properties that have been passed a hex string. */
							/* Would be quicker to use CSS.Lists.colors.includes() if possible */
							if (CSS.Lists.colors.indexOf(propertyName) >= 0) {
								/* Parse the value data for each shorthand. */
								var endValue = valueData[0],
										easing = valueData[1],
										startValue = valueData[2];

								if (CSS.RegEx.isHex.test(endValue)) {
									/* Convert the hex strings into their RGB component arrays. */
									var colorComponents = ["Red", "Green", "Blue"],
											endValueRGB = CSS.Values.hexToRgb(endValue),
											startValueRGB = startValue ? CSS.Values.hexToRgb(startValue) : undefined;

									/* Inject the RGB component tweens into propertiesMap. */
									for (var i = 0; i < colorComponents.length; i++) {
										var dataArray = [endValueRGB[i]];

										if (easing) {
											dataArray.push(easing);
										}

										if (startValueRGB !== undefined) {
											dataArray.push(startValueRGB[i]);
										}

										fixPropertyValue(propertyName + colorComponents[i], dataArray);
									}
									/* If we have replaced a shortcut color value then don't update the standard property name */
									continue;
								}
							}
							fixPropertyValue(propertyName, valueData);
						}

						/* Along with its property data, store a reference to the element itself onto tweensContainer. */
						tweensContainer.element = element;
					}

					/*****************
					 Call Push
					 *****************/

					/* Note: tweensContainer can be empty if all of the properties in this call's property map were skipped due to not
					 being supported by the browser. The element property is used for checking that the tweensContainer has been appended to. */
					if (tweensContainer.element) {
						/* Apply the "velocity-animating" indicator class. */
						CSS.Values.addClass(element, "velocity-animating");

						/* The call array houses the tweensContainers for each element being animated in the current call. */
						call.push(tweensContainer);

						data = Data(element);

						if (data) {
							/* Store the tweensContainer and options if we're working on the default effects queue, so that they can be used by the reverse command. */
							if (opts.queue === "") {

								data.tweensContainer = tweensContainer;
								data.opts = opts;
							}

							/* Switch on the element's animating flag. */
							data.isAnimating = true;
						}

						/* Once the final element in this call's element set has been processed, push the call array onto
						 Velocity.State.calls for the animation tick to immediately begin processing. */
						if (elementsIndex === elementsLength - 1) {
							/* Add the current call plus its associated metadata (the element set and the call's options) onto the global call container.
							 Anything on this call container is subjected to tick() processing. */
							Velocity.State.calls.push([call, elements, opts, null, promiseData.resolver, null, 0]);

							/* If the animation tick isn't running, start it. (Velocity shuts it off when there are no active calls to process.) */
							if (Velocity.State.isTicking === false) {
								Velocity.State.isTicking = true;

								/* Start the tick loop. */
								tick();
							}
						} else {
							elementsIndex++;
						}
					}
				}

				/* When the queue option is set to false, the call skips the element's queue and fires immediately. */
				if (opts.queue === false) {
					/* Since this buildQueue call doesn't respect the element's existing queue (which is where a delay option would have been appended),
					 we manually inject the delay property here with an explicit setTimeout. */
					if (opts.delay) {

						/* Temporarily store delayed elements to facilitate access for global pause/resume */
						var callIndex = Velocity.State.delayedElements.count++;
						Velocity.State.delayedElements[callIndex] = element;

						var delayComplete = (function(index) {
							return function() {
								/* Clear the temporary element */
								Velocity.State.delayedElements[index] = false;

								/* Finally, issue the call */
								buildQueue();
							};
						})(callIndex);

						Data(element).delayBegin = (new Date()).getTime();
						Data(element).delay = parseFloat(opts.delay);
						Data(element).delayTimer = {
							setTimeout: setTimeout(buildQueue, parseFloat(opts.delay)),
							next: delayComplete
						};
					} else {
						buildQueue();
					}
					/* Otherwise, the call undergoes element queueing as normal. */
					/* Note: To interoperate with jQuery, Velocity uses jQuery's own $.queue() stack for queuing logic. */
				} else {
					$.queue(element, opts.queue, function(next, clearQueue) {
						/* If the clearQueue flag was passed in by the stop command, resolve this call's promise. (Promises can only be resolved once,
						 so it's fine if this is repeatedly triggered for each element in the associated call.) */
						if (clearQueue === true) {
							if (promiseData.promise) {
								promiseData.resolver(elements);
							}

							/* Do not continue with animation queueing. */
							return true;
						}

						/* This flag indicates to the upcoming completeCall() function that this queue entry was initiated by Velocity.
						 See completeCall() for further details. */
						Velocity.velocityQueueEntryFlag = true;

						buildQueue(next);
					});
				}

				/*********************
				 Auto-Dequeuing
				 *********************/

				/* As per jQuery's $.queue() behavior, to fire the first non-custom-queue entry on an element, the element
				 must be dequeued if its queue stack consists *solely* of the current call. (This can be determined by checking
				 for the "inprogress" item that jQuery prepends to active queue stack arrays.) Regardless, whenever the element's
				 queue is further appended with additional items -- including $.delay()'s or even $.animate() calls, the queue's
				 first entry is automatically fired. This behavior contrasts that of custom queues, which never auto-fire. */
				/* Note: When an element set is being subjected to a non-parallel Velocity call, the animation will not begin until
				 each one of the elements in the set has reached the end of its individually pre-existing queue chain. */
				/* Note: Unfortunately, most people don't fully grasp jQuery's powerful, yet quirky, $.queue() function.
				 Lean more here: http://stackoverflow.com/questions/1058158/can-somebody-explain-jquery-queue-to-me */
				if ((opts.queue === "" || opts.queue === "fx") && $.queue(element)[0] !== "inprogress") {
					$.dequeue(element);
				}
			}

			/**************************
			 Element Set Iteration
			 **************************/

			/* If the "nodeType" property exists on the elements variable, we're animating a single element.
			 Place it in an array so that $.each() can iterate over it. */
			$.each(elements, function(i, element) {
				/* Ensure each element in a set has a nodeType (is a real element) to avoid throwing errors. */
				if (Type.isNode(element)) {
					processElement(element, i);
				}
			});

			/******************
			 Option: Loop
			 ******************/

			/* The loop option accepts an integer indicating how many times the element should loop between the values in the
			 current call's properties map and the element's property values prior to this call. */
			/* Note: The loop option's logic is performed here -- after element processing -- because the current call needs
			 to undergo its queue insertion prior to the loop option generating its series of constituent "reverse" calls,
			 which chain after the current call. Two reverse calls (two "alternations") constitute one loop. */
			opts = $.extend({}, Velocity.defaults, options);
			opts.loop = parseInt(opts.loop, 10);
			var reverseCallsCount = (opts.loop * 2) - 1;

			if (opts.loop) {
				/* Double the loop count to convert it into its appropriate number of "reverse" calls.
				 Subtract 1 from the resulting value since the current call is included in the total alternation count. */
				for (var x = 0; x < reverseCallsCount; x++) {
					/* Since the logic for the reverse action occurs inside Queueing and therefore this call's options object
					 isn't parsed until then as well, the current call's delay option must be explicitly passed into the reverse
					 call so that the delay logic that occurs inside *Pre-Queueing* can process it. */
					var reverseOptions = {
						delay: opts.delay,
						progress: opts.progress
					};

					/* If a complete callback was passed into this call, transfer it to the loop redirect's final "reverse" call
					 so that it's triggered when the entire redirect is complete (and not when the very first animation is complete). */
					if (x === reverseCallsCount - 1) {
						reverseOptions.display = opts.display;
						reverseOptions.visibility = opts.visibility;
						reverseOptions.complete = opts.complete;
					}

					animate(elements, "reverse", reverseOptions);
				}
			}

			/***************
			 Chaining
			 ***************/

			/* Return the elements back to the call chain, with wrapped elements taking precedence in case Velocity was called via the $.fn. extension. */
			return getChain();
		};

		/* Turn Velocity into the animation function, extended with the pre-existing Velocity object. */
		Velocity = $.extend(animate, Velocity);
		/* For legacy support, also expose the literal animate method. */
		Velocity.animate = animate;

		/**************
		 Timing
		 **************/

		/* Ticker function. */
		var ticker = window.requestAnimationFrame || rAFShim;

		/* Inactive browser tabs pause rAF, which results in all active animations immediately sprinting to their completion states when the tab refocuses.
		 To get around this, we dynamically switch rAF to setTimeout (which the browser *doesn't* pause) when the tab loses focus. We skip this for mobile
		 devices to avoid wasting battery power on inactive tabs. */
		/* Note: Tab focus detection doesn't work on older versions of IE, but that's okay since they don't support rAF to begin with. */
		if (!Velocity.State.isMobile && document.hidden !== undefined) {
			var updateTicker = function() {
				/* Reassign the rAF function (which the global tick() function uses) based on the tab's focus state. */
				if (document.hidden) {
					ticker = function(callback) {
						/* The tick function needs a truthy first argument in order to pass its internal timestamp check. */
						return setTimeout(function() {
							callback(true);
						}, 16);
					};

					/* The rAF loop has been paused by the browser, so we manually restart the tick. */
					tick();
				} else {
					ticker = window.requestAnimationFrame || rAFShim;
				}
			};

			/* Page could be sitting in the background at this time (i.e. opened as new tab) so making sure we use correct ticker from the start */
			updateTicker();

			/* And then run check again every time visibility changes */
			document.addEventListener("visibilitychange", updateTicker);
		}

		/************
		 Tick
		 ************/

		/* Note: All calls to Velocity are pushed to the Velocity.State.calls array, which is fully iterated through upon each tick. */
		function tick(timestamp) {
			/* An empty timestamp argument indicates that this is the first tick occurence since ticking was turned on.
			 We leverage this metadata to fully ignore the first tick pass since RAF's initial pass is fired whenever
			 the browser's next tick sync time occurs, which results in the first elements subjected to Velocity
			 calls being animated out of sync with any elements animated immediately thereafter. In short, we ignore
			 the first RAF tick pass so that elements being immediately consecutively animated -- instead of simultaneously animated
			 by the same Velocity call -- are properly batched into the same initial RAF tick and consequently remain in sync thereafter. */
			if (timestamp) {
				/* We normally use RAF's high resolution timestamp but as it can be significantly offset when the browser is
				 under high stress we give the option for choppiness over allowing the browser to drop huge chunks of frames.
				 We use performance.now() and shim it if it doesn't exist for when the tab is hidden. */
				var timeCurrent = Velocity.timestamp && timestamp !== true ? timestamp : performance.now();

				/********************
				 Call Iteration
				 ********************/

				var callsLength = Velocity.State.calls.length;

				/* To speed up iterating over this array, it is compacted (falsey items -- calls that have completed -- are removed)
				 when its length has ballooned to a point that can impact tick performance. This only becomes necessary when animation
				 has been continuous with many elements over a long period of time; whenever all active calls are completed, completeCall() clears Velocity.State.calls. */
				if (callsLength > 10000) {
					Velocity.State.calls = compactSparseArray(Velocity.State.calls);
					callsLength = Velocity.State.calls.length;
				}

				/* Iterate through each active call. */
				for (var i = 0; i < callsLength; i++) {
					/* When a Velocity call is completed, its Velocity.State.calls entry is set to false. Continue on to the next call. */
					if (!Velocity.State.calls[i]) {
						continue;
					}

					/************************
					 Call-Wide Variables
					 ************************/

					var callContainer = Velocity.State.calls[i],
							call = callContainer[0],
							opts = callContainer[2],
							timeStart = callContainer[3],
							firstTick = !!timeStart,
							tweenDummyValue = null,
							pauseObject = callContainer[5],
							millisecondsEllapsed = callContainer[6];



					/* If timeStart is undefined, then this is the first time that this call has been processed by tick().
					 We assign timeStart now so that its value is as close to the real animation start time as possible.
					 (Conversely, had timeStart been defined when this call was added to Velocity.State.calls, the delay
					 between that time and now would cause the first few frames of the tween to be skipped since
					 percentComplete is calculated relative to timeStart.) */
					/* Further, subtract 16ms (the approximate resolution of RAF) from the current time value so that the
					 first tick iteration isn't wasted by animating at 0% tween completion, which would produce the
					 same style value as the element's current value. */
					if (!timeStart) {
						timeStart = Velocity.State.calls[i][3] = timeCurrent - 16;
					}

					/* If a pause object is present, skip processing unless it has been set to resume */
					if (pauseObject) {
						if (pauseObject.resume === true) {
							/* Update the time start to accomodate the paused completion amount */
							timeStart = callContainer[3] = Math.round(timeCurrent - millisecondsEllapsed - 16);

							/* Remove pause object after processing */
							callContainer[5] = null;
						} else {
							continue;
						}
					}

					millisecondsEllapsed = callContainer[6] = timeCurrent - timeStart;

					/* The tween's completion percentage is relative to the tween's start time, not the tween's start value
					 (which would result in unpredictable tween durations since JavaScript's timers are not particularly accurate).
					 Accordingly, we ensure that percentComplete does not exceed 1. */
					var percentComplete = Math.min((millisecondsEllapsed) / opts.duration, 1);

					/**********************
					 Element Iteration
					 **********************/

					/* For every call, iterate through each of the elements in its set. */
					for (var j = 0, callLength = call.length; j < callLength; j++) {
						var tweensContainer = call[j],
								element = tweensContainer.element;

						/* Check to see if this element has been deleted midway through the animation by checking for the
						 continued existence of its data cache. If it's gone, or the element is currently paused, skip animating this element. */
						if (!Data(element)) {
							continue;
						}

						var transformPropertyExists = false;

						/**********************************
						 Display & Visibility Toggling
						 **********************************/

						/* If the display option is set to non-"none", set it upfront so that the element can become visible before tweening begins.
						 (Otherwise, display's "none" value is set in completeCall() once the animation has completed.) */
						if (opts.display !== undefined && opts.display !== null && opts.display !== "none") {
							if (opts.display === "flex") {
								var flexValues = ["-webkit-box", "-moz-box", "-ms-flexbox", "-webkit-flex"];

								$.each(flexValues, function(i, flexValue) {
									CSS.setPropertyValue(element, "display", flexValue);
								});
							}

							CSS.setPropertyValue(element, "display", opts.display);
						}

						/* Same goes with the visibility option, but its "none" equivalent is "hidden". */
						if (opts.visibility !== undefined && opts.visibility !== "hidden") {
							CSS.setPropertyValue(element, "visibility", opts.visibility);
						}

						/************************
						 Property Iteration
						 ************************/

						/* For every element, iterate through each property. */
						for (var property in tweensContainer) {
							/* Note: In addition to property tween data, tweensContainer contains a reference to its associated element. */
							if (tweensContainer.hasOwnProperty(property) && property !== "element") {
								var tween = tweensContainer[property],
										currentValue,
										/* Easing can either be a pre-genereated function or a string that references a pre-registered easing
										 on the Velocity.Easings object. In either case, return the appropriate easing *function*. */
										easing = Type.isString(tween.easing) ? Velocity.Easings[tween.easing] : tween.easing;

								/******************************
								 Current Value Calculation
								 ******************************/

								if (Type.isString(tween.pattern)) {
									var patternReplace = percentComplete === 1 ?
											function($0, index, round) {
												var result = tween.endValue[index];

												return round ? Math.round(result) : result;
											} :
											function($0, index, round) {
												var startValue = tween.startValue[index],
														tweenDelta = tween.endValue[index] - startValue,
														result = startValue + (tweenDelta * easing(percentComplete, opts, tweenDelta));

												return round ? Math.round(result) : result;
											};

									currentValue = tween.pattern.replace(/{(\d+)(!)?}/g, patternReplace);
								} else if (percentComplete === 1) {
									/* If this is the last tick pass (if we've reached 100% completion for this tween),
									 ensure that currentValue is explicitly set to its target endValue so that it's not subjected to any rounding. */
									currentValue = tween.endValue;
								} else {
									/* Otherwise, calculate currentValue based on the current delta from startValue. */
									var tweenDelta = tween.endValue - tween.startValue;

									currentValue = tween.startValue + (tweenDelta * easing(percentComplete, opts, tweenDelta));
									/* If no value change is occurring, don't proceed with DOM updating. */
								}
								if (!firstTick && (currentValue === tween.currentValue)) {
									continue;
								}

								tween.currentValue = currentValue;

								/* If we're tweening a fake 'tween' property in order to log transition values, update the one-per-call variable so that
								 it can be passed into the progress callback. */
								if (property === "tween") {
									tweenDummyValue = currentValue;
								} else {
									/******************
									 Hooks: Part I
									 ******************/
									var hookRoot;

									/* For hooked properties, the newly-updated rootPropertyValueCache is cached onto the element so that it can be used
									 for subsequent hooks in this call that are associated with the same root property. If we didn't cache the updated
									 rootPropertyValue, each subsequent update to the root property in this tick pass would reset the previous hook's
									 updates to rootPropertyValue prior to injection. A nice performance byproduct of rootPropertyValue caching is that
									 subsequently chained animations using the same hookRoot but a different hook can use this cached rootPropertyValue. */
									if (CSS.Hooks.registered[property]) {
										hookRoot = CSS.Hooks.getRoot(property);

										var rootPropertyValueCache = Data(element).rootPropertyValueCache[hookRoot];

										if (rootPropertyValueCache) {
											tween.rootPropertyValue = rootPropertyValueCache;
										}
									}

									/*****************
									 DOM Update
									 *****************/

									/* setPropertyValue() returns an array of the property name and property value post any normalization that may have been performed. */
									/* Note: To solve an IE<=8 positioning bug, the unit type is dropped when setting a property value of 0. */
									var adjustedSetData = CSS.setPropertyValue(element, /* SET */
											property,
											tween.currentValue + (IE < 9 && parseFloat(currentValue) === 0 ? "" : tween.unitType),
											tween.rootPropertyValue,
											tween.scrollData);

									/*******************
									 Hooks: Part II
									 *******************/

									/* Now that we have the hook's updated rootPropertyValue (the post-processed value provided by adjustedSetData), cache it onto the element. */
									if (CSS.Hooks.registered[property]) {
										/* Since adjustedSetData contains normalized data ready for DOM updating, the rootPropertyValue needs to be re-extracted from its normalized form. ?? */
										if (CSS.Normalizations.registered[hookRoot]) {
											Data(element).rootPropertyValueCache[hookRoot] = CSS.Normalizations.registered[hookRoot]("extract", null, adjustedSetData[1]);
										} else {
											Data(element).rootPropertyValueCache[hookRoot] = adjustedSetData[1];
										}
									}

									/***************
									 Transforms
									 ***************/

									/* Flag whether a transform property is being animated so that flushTransformCache() can be triggered once this tick pass is complete. */
									if (adjustedSetData[0] === "transform") {
										transformPropertyExists = true;
									}

								}
							}
						}

						/****************
						 mobileHA
						 ****************/

						/* If mobileHA is enabled, set the translate3d transform to null to force hardware acceleration.
						 It's safe to override this property since Velocity doesn't actually support its animation (hooks are used in its place). */
						if (opts.mobileHA) {
							/* Don't set the null transform hack if we've already done so. */
							if (Data(element).transformCache.translate3d === undefined) {
								/* All entries on the transformCache object are later concatenated into a single transform string via flushTransformCache(). */
								Data(element).transformCache.translate3d = "(0px, 0px, 0px)";

								transformPropertyExists = true;
							}
						}

						if (transformPropertyExists) {
							CSS.flushTransformCache(element);
						}
					}

					/* The non-"none" display value is only applied to an element once -- when its associated call is first ticked through.
					 Accordingly, it's set to false so that it isn't re-processed by this call in the next tick. */
					if (opts.display !== undefined && opts.display !== "none") {
						Velocity.State.calls[i][2].display = false;
					}
					if (opts.visibility !== undefined && opts.visibility !== "hidden") {
						Velocity.State.calls[i][2].visibility = false;
					}

					/* Pass the elements and the timing data (percentComplete, msRemaining, timeStart, tweenDummyValue) into the progress callback. */
					if (opts.progress) {
						opts.progress.call(callContainer[1],
								callContainer[1],
								percentComplete,
								Math.max(0, (timeStart + opts.duration) - timeCurrent),
								timeStart,
								tweenDummyValue);
					}

					/* If this call has finished tweening, pass its index to completeCall() to handle call cleanup. */
					if (percentComplete === 1) {
						completeCall(i);
					}
				}
			}

			/* Note: completeCall() sets the isTicking flag to false when the last call on Velocity.State.calls has completed. */
			if (Velocity.State.isTicking) {
				ticker(tick);
			}
		}

		/**********************
		 Call Completion
		 **********************/

		/* Note: Unlike tick(), which processes all active calls at once, call completion is handled on a per-call basis. */
		function completeCall(callIndex, isStopped) {
			/* Ensure the call exists. */
			if (!Velocity.State.calls[callIndex]) {
				return false;
			}

			/* Pull the metadata from the call. */
			var call = Velocity.State.calls[callIndex][0],
					elements = Velocity.State.calls[callIndex][1],
					opts = Velocity.State.calls[callIndex][2],
					resolver = Velocity.State.calls[callIndex][4];

			var remainingCallsExist = false;

			/*************************
			 Element Finalization
			 *************************/

			for (var i = 0, callLength = call.length; i < callLength; i++) {
				var element = call[i].element;

				/* If the user set display to "none" (intending to hide the element), set it now that the animation has completed. */
				/* Note: display:none isn't set when calls are manually stopped (via Velocity("stop"). */
				/* Note: Display gets ignored with "reverse" calls and infinite loops, since this behavior would be undesirable. */
				if (!isStopped && !opts.loop) {
					if (opts.display === "none") {
						CSS.setPropertyValue(element, "display", opts.display);
					}

					if (opts.visibility === "hidden") {
						CSS.setPropertyValue(element, "visibility", opts.visibility);
					}
				}

				/* If the element's queue is empty (if only the "inprogress" item is left at position 0) or if its queue is about to run
				 a non-Velocity-initiated entry, turn off the isAnimating flag. A non-Velocity-initiatied queue entry's logic might alter
				 an element's CSS values and thereby cause Velocity's cached value data to go stale. To detect if a queue entry was initiated by Velocity,
				 we check for the existence of our special Velocity.queueEntryFlag declaration, which minifiers won't rename since the flag
				 is assigned to jQuery's global $ object and thus exists out of Velocity's own scope. */
				var data = Data(element);

				if (opts.loop !== true && ($.queue(element)[1] === undefined || !/\.velocityQueueEntryFlag/i.test($.queue(element)[1]))) {
					/* The element may have been deleted. Ensure that its data cache still exists before acting on it. */
					if (data) {
						data.isAnimating = false;
						/* Clear the element's rootPropertyValueCache, which will become stale. */
						data.rootPropertyValueCache = {};

						var transformHAPropertyExists = false;
						/* If any 3D transform subproperty is at its default value (regardless of unit type), remove it. */
						$.each(CSS.Lists.transforms3D, function(i, transformName) {
							var defaultValue = /^scale/.test(transformName) ? 1 : 0,
									currentValue = data.transformCache[transformName];

							if (data.transformCache[transformName] !== undefined && new RegExp("^\\(" + defaultValue + "[^.]").test(currentValue)) {
								transformHAPropertyExists = true;

								delete data.transformCache[transformName];
							}
						});

						/* Mobile devices have hardware acceleration removed at the end of the animation in order to avoid hogging the GPU's memory. */
						if (opts.mobileHA) {
							transformHAPropertyExists = true;
							delete data.transformCache.translate3d;
						}

						/* Flush the subproperty removals to the DOM. */
						if (transformHAPropertyExists) {
							CSS.flushTransformCache(element);
						}

						/* Remove the "velocity-animating" indicator class. */
						CSS.Values.removeClass(element, "velocity-animating");
					}
				}

				/*********************
				 Option: Complete
				 *********************/

				/* Complete is fired once per call (not once per element) and is passed the full raw DOM element set as both its context and its first argument. */
				/* Note: Callbacks aren't fired when calls are manually stopped (via Velocity("stop"). */
				if (!isStopped && opts.complete && !opts.loop && (i === callLength - 1)) {
					/* We throw callbacks in a setTimeout so that thrown errors don't halt the execution of Velocity itself. */
					try {
						opts.complete.call(elements, elements);
					} catch (error) {
						setTimeout(function() {
							throw error;
						}, 1);
					}
				}

				/**********************
				 Promise Resolving
				 **********************/

				/* Note: Infinite loops don't return promises. */
				if (resolver && opts.loop !== true) {
					resolver(elements);
				}

				/****************************
				 Option: Loop (Infinite)
				 ****************************/

				if (data && opts.loop === true && !isStopped) {
					/* If a rotateX/Y/Z property is being animated by 360 deg with loop:true, swap tween start/end values to enable
					 continuous iterative rotation looping. (Otherise, the element would just rotate back and forth.) */
					$.each(data.tweensContainer, function(propertyName, tweenContainer) {
						if (/^rotate/.test(propertyName) && ((parseFloat(tweenContainer.startValue) - parseFloat(tweenContainer.endValue)) % 360 === 0)) {
							var oldStartValue = tweenContainer.startValue;

							tweenContainer.startValue = tweenContainer.endValue;
							tweenContainer.endValue = oldStartValue;
						}

						if (/^backgroundPosition/.test(propertyName) && parseFloat(tweenContainer.endValue) === 100 && tweenContainer.unitType === "%") {
							tweenContainer.endValue = 0;
							tweenContainer.startValue = 100;
						}
					});

					Velocity(element, "reverse", {loop: true, delay: opts.delay});
				}

				/***************
				 Dequeueing
				 ***************/

				/* Fire the next call in the queue so long as this call's queue wasn't set to false (to trigger a parallel animation),
				 which would have already caused the next call to fire. Note: Even if the end of the animation queue has been reached,
				 $.dequeue() must still be called in order to completely clear jQuery's animation queue. */
				if (opts.queue !== false) {
					$.dequeue(element, opts.queue);
				}
			}

			/************************
			 Calls Array Cleanup
			 ************************/

			/* Since this call is complete, set it to false so that the rAF tick skips it. This array is later compacted via compactSparseArray().
			 (For performance reasons, the call is set to false instead of being deleted from the array: http://www.html5rocks.com/en/tutorials/speed/v8/) */
			Velocity.State.calls[callIndex] = false;

			/* Iterate through the calls array to determine if this was the final in-progress animation.
			 If so, set a flag to end ticking and clear the calls array. */
			for (var j = 0, callsLength = Velocity.State.calls.length; j < callsLength; j++) {
				if (Velocity.State.calls[j] !== false) {
					remainingCallsExist = true;

					break;
				}
			}

			if (remainingCallsExist === false) {
				/* tick() will detect this flag upon its next iteration and subsequently turn itself off. */
				Velocity.State.isTicking = false;

				/* Clear the calls array so that its length is reset. */
				delete Velocity.State.calls;
				Velocity.State.calls = [];
			}
		}

		/******************
		 Frameworks
		 ******************/

		/* Both jQuery and Zepto allow their $.fn object to be extended to allow wrapped elements to be subjected to plugin calls.
		 If either framework is loaded, register a "velocity" extension pointing to Velocity's core animate() method.  Velocity
		 also registers itself onto a global container (window.jQuery || window.Zepto || window) so that certain features are
		 accessible beyond just a per-element scope. This master object contains an .animate() method, which is later assigned to $.fn
		 (if jQuery or Zepto are present). Accordingly, Velocity can both act on wrapped DOM elements and stand alone for targeting raw DOM elements. */
		global.Velocity = Velocity;

		if (global !== window) {
			/* Assign the element function to Velocity's core animate() method. */
			global.fn.velocity = animate;
			/* Assign the object function's defaults to Velocity's global defaults object. */
			global.fn.velocity.defaults = Velocity.defaults;
		}

		/***********************
		 Packaged Redirects
		 ***********************/

		/* slideUp, slideDown */
		$.each(["Down", "Up"], function(i, direction) {
			Velocity.Redirects["slide" + direction] = function(element, options, elementsIndex, elementsSize, elements, promiseData) {
				var opts = $.extend({}, options),
						begin = opts.begin,
						complete = opts.complete,
						inlineValues = {},
						computedValues = {height: "", marginTop: "", marginBottom: "", paddingTop: "", paddingBottom: ""};

				if (opts.display === undefined) {
					/* Show the element before slideDown begins and hide the element after slideUp completes. */
					/* Note: Inline elements cannot have dimensions animated, so they're reverted to inline-block. */
					opts.display = (direction === "Down" ? (Velocity.CSS.Values.getDisplayType(element) === "inline" ? "inline-block" : "block") : "none");
				}

				opts.begin = function() {
					/* If the user passed in a begin callback, fire it now. */
					if (elementsIndex === 0 && begin) {
						begin.call(elements, elements);
					}

					/* Cache the elements' original vertical dimensional property values so that we can animate back to them. */
					for (var property in computedValues) {
						if (!computedValues.hasOwnProperty(property)) {
							continue;
						}
						inlineValues[property] = element.style[property];

						/* For slideDown, use forcefeeding to animate all vertical properties from 0. For slideUp,
						 use forcefeeding to start from computed values and animate down to 0. */
						var propertyValue = CSS.getPropertyValue(element, property);
						computedValues[property] = (direction === "Down") ? [propertyValue, 0] : [0, propertyValue];
					}

					/* Force vertical overflow content to clip so that sliding works as expected. */
					inlineValues.overflow = element.style.overflow;
					element.style.overflow = "hidden";
				};

				opts.complete = function() {
					/* Reset element to its pre-slide inline values once its slide animation is complete. */
					for (var property in inlineValues) {
						if (inlineValues.hasOwnProperty(property)) {
							element.style[property] = inlineValues[property];
						}
					}

					/* If the user passed in a complete callback, fire it now. */
					if (elementsIndex === elementsSize - 1) {
						if (complete) {
							complete.call(elements, elements);
						}
						if (promiseData) {
							promiseData.resolver(elements);
						}
					}
				};

				Velocity(element, computedValues, opts);
			};
		});

		/* fadeIn, fadeOut */
		$.each(["In", "Out"], function(i, direction) {
			Velocity.Redirects["fade" + direction] = function(element, options, elementsIndex, elementsSize, elements, promiseData) {
				var opts = $.extend({}, options),
						complete = opts.complete,
						propertiesMap = {opacity: (direction === "In") ? 1 : 0};

				/* Since redirects are triggered individually for each element in the animated set, avoid repeatedly triggering
				 callbacks by firing them only when the final element has been reached. */
				if (elementsIndex !== 0) {
					opts.begin = null;
				}
				if (elementsIndex !== elementsSize - 1) {
					opts.complete = null;
				} else {
					opts.complete = function() {
						if (complete) {
							complete.call(elements, elements);
						}
						if (promiseData) {
							promiseData.resolver(elements);
						}
					};
				}

				/* If a display was passed in, use it. Otherwise, default to "none" for fadeOut or the element-specific default for fadeIn. */
				/* Note: We allow users to pass in "null" to skip display setting altogether. */
				if (opts.display === undefined) {
					opts.display = (direction === "In" ? "auto" : "none");
				}

				Velocity(this, propertiesMap, opts);
			};
		});

		return Velocity;
	}((window.jQuery || window.Zepto || window), window, (window ? window.document : undefined));
}));

/******************
 Known Issues
 ******************/

/* The CSS spec mandates that the translateX/Y/Z transforms are %-relative to the element itself -- not its parent.
 Velocity, however, doesn't make this distinction. Thus, converting to or from the % unit with these subproperties
 will produce an inaccurate conversion value. The same issue exists with the cx/cy attributes of SVG circles and ellipses. */


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var app = __webpack_require__(31);
var bookdata = __webpack_require__(30);
var appdata = __webpack_require__(0);

appdata.textdata = bookdata.textdata;
appdata.translationdata = bookdata.translationdata;
appdata.cantotitles = bookdata.cantotitles;
appdata.translationcount = bookdata.translationdata.length;
appdata.cantocount = bookdata.cantotitles.length;
appdata.description = bookdata.description;
appdata.bookname = bookdata.bookname;
appdata.booktitle = bookdata.booktitle;
appdata.bookauthor = bookdata.bookauthor;
appdata.versionhistory = bookdata.versionhistory;
appdata.comingsoon = bookdata.comingsoon;

for (var i in appdata.textdata) {
	for (var j in appdata.translationdata) {
		if (appdata.translationdata[j].translationid == appdata.textdata[i].translationid) {
			appdata.translationdata[j].bookname = appdata.textdata[i].bookname;
			appdata.translationdata[j].author = appdata.textdata[i].author;
			appdata.translationdata[j].title = appdata.textdata[i].title;
			appdata.translationdata[j].translation = appdata.textdata[i].translation;
			appdata.translationdata[j].translationshortname = appdata.textdata[i].translationshortname;
			appdata.translationdata[j].translationfullname = appdata.textdata[i].translationfullname;
			appdata.translationdata[j].translationclass = appdata.textdata[i].translationclass;
			appdata.translationdata[j].source = appdata.textdata[i].source;
		}
	}
}

app.initialize();

/***/ })
/******/ ]);
//# sourceMappingURL=catulluscarmina.js.map