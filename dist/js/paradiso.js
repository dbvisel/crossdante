(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// version 4: now going to ES6 & Babel

"use strict";

var Hammer = require("hammerjs");
var Fastclick = require("fastclick");
var Velocity = require("velocity-animate");

var dom = require("./dom");
var appdata = require("./appdata");

var app = {
	initialize: function initialize() {
		console.log("initializing!");
		this.bindEvents();

		// basic doc setup

		appdata.elements.lens = document.getElementById("lens");
		appdata.elements.main = document.getElementById("main");
		appdata.elements.content = document.getElementById("content");
		appdata.elements.text = document.getElementById("text");
		appdata.elements.slider = document.getElementById("slider");

		// set up about page

		document.title = "Cross Dante " + appdata.booktitle;
		document.getElementById("abouttext").innerHTML = appdata.description;

		// set up current translation list (initially use all of them)

		for (var i in appdata.translationdata) {
			appdata.currenttranslationlist.push(appdata.translationdata[i].translationid);
			document.getElementById("textsources").innerHTML += "<li>" + appdata.translationdata[i].translationfullname + ", <em>" + appdata.translationdata[i].title + ":</em> " + appdata.translationdata[i].source + "</li>";
		}

		appdata.currenttranslation = appdata.currenttranslationlist[0];

		// check to see if there are saved localstorage, if so, take those values
	},
	bindEvents: function bindEvents() {
		console.log("binding events!");
		document.addEventListener('deviceready', this.onDeviceReady, false);
		window.addEventListener("resize", this.resize, false);

		// start fastclick

		if ('addEventListener' in document) {
			document.addEventListener('DOMContentLoaded', function () {
				Fastclick(document.body);
			}, false);
		}

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

						if (appdata.currentpage == "lens" && appdata.elements.text.scrollTop === 0) {
							app.setlens(appdata.currenttranslation, appdata.currentcanto - 1, 1);
						}
						return;
					}
				}
			};

			document.addEventListener('touchstart', touchstartHandler, false);
			document.addEventListener('touchmove', touchmoveHandler, false);
		});
	},
	helpers: {

		// this wouldn't work as a real module! refactor?

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
				var insert = dom.create("<div class=\"notewindow\" id=\"notewindow\">\n\t\t\t\t\t\t" + notetext + "\n\t\t\t\t\t</div>");
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

		// button controls
		document.getElementById("navprev").onclick = function () {
			app.setlens(app.nexttrans(appdata.currenttranslation), appdata.currentcanto);
		};
		document.getElementById("navnext").onclick = function () {
			app.setlens(app.prevtrans(appdata.currenttranslation), appdata.currentcanto);
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
			app.setlens(app.nexttrans(appdata.currenttranslation), appdata.currentcanto);
		}).on('swiperight', function () {
			app.setlens(app.prevtrans(appdata.currenttranslation), appdata.currentcanto);
		});

		hammertime.on('swipedown', function (e) {
			e.preventDefault(); // attempt to fix android swipe down = reload behavior
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
				app.setlens(app.prevtrans(appdata.currenttranslation), appdata.currentcanto);
			}
			if ((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext", "on");
				app.setlens(app.nexttrans(appdata.currenttranslation), appdata.currentcanto);
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
					children[j].setAttribute("data-notenumber", count);
				}
				if (dom.hasclass(children[j], "noteno")) {
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
	nexttrans: function nexttrans(giventranslation) {
		if (appdata.currenttranslationlist.length > 1) {
			if (appdata.currenttranslationlist.indexOf(giventranslation) + 1 == appdata.currenttranslationlist.length) {
				return appdata.currenttranslationlist[0];
			} else {
				return appdata.currenttranslationlist[appdata.currenttranslationlist.indexOf(giventranslation) + 1];
			}
		} else {
			return giventranslation;
		}
	},
	prevtrans: function prevtrans(giventranslation) {
		if (appdata.currenttranslationlist.length > 1) {
			if (appdata.currenttranslationlist.indexOf(giventranslation) == 0) {
				return appdata.currenttranslationlist[appdata.currenttranslationlist.length - 1];
			} else {
				return appdata.currenttranslationlist[appdata.currenttranslationlist.indexOf(giventranslation) - 1];
			}
		} else {
			return giventranslation;
		}
	},
	setlens: function setlens(newtrans, newcanto, percentage) {
		console.log("\nSetlens called for " + newtrans + ", canto " + newcanto);
		dom.removebyselector("#oldtext"); // attempt to fix flickering if too fast change

		var changetrans = false;
		var oldindex = appdata.currenttranslationlist.indexOf(appdata.currenttranslation); // the number of the old translation
		var newindex = appdata.currenttranslationlist.indexOf(newtrans); // the number of the trans we're going to

		if (appdata.currentpage == "lens") {

			// if page isn't set to "lens" this doesn't do anything

			if (newindex - oldindex !== 0) {
				changetrans = true;
				percentage = appdata.elements.text.scrollTop /*+ appdata.elements.text.clientHeight*/ / appdata.elements.text.scrollHeight;
				console.log("\u2014>Current percentage: " + percentage);
			}

			if (newcanto >= appdata.cantocount) {
				newcanto = 0;
			} else {
				if (newcanto < 0) {
					newcanto = appdata.cantocount - 1;
				}
			}

			// need to figure which translationdata we need

			var newdata = 0;
			var olddata = 0;

			for (var j in appdata.translationdata) {
				if (newtrans == appdata.translationdata[j].translationid) {
					newdata = j;
				}
				if (appdata.currenttranslation == appdata.translationdata[j].translationid) {
					olddata = j;
				}
			}

			if (newindex !== oldindex) {

				// console.log("Change in translation!");

				appdata.elements.text.id = "oldtext";

				// if new is bigger than old AND ( old is not 0 OR new is not the last one )
				// OR if new is 0 and old is the last one

				if (newindex > oldindex && (oldindex > 0 || newindex !== appdata.currenttranslationlist.length - 1) || newindex == 0 && oldindex == appdata.currenttranslationlist.length - 1) {

					// console.log("Going right");  // we are inserting to the right

					var insert = dom.create("<div id=\"text\" class=\"textframe " + appdata.translationdata[newdata].translationclass + "\" style=\"left:100%;\">" + appdata.textdata[newdata].text[newcanto] + "</div>");
					appdata.elements.slider.appendChild(insert);
					Velocity(appdata.elements.slider, { 'left': "-100%" }, {
						duration: appdata.delay,
						mobileHA: false,
						complete: function complete() {
							dom.removebyselector("#oldtext");
							appdata.elements.slider.style.left = "0";
							appdata.elements.text.style.left = "0";
						}
					});
				} else {

					// console.log("Going left"); // we are inserting to the left

					var _insert = dom.create("<div id=\"text\" class=\"textframe " + appdata.translationdata[newdata].translationclass + "\" style=\"left:-100%;\">" + appdata.textdata[newdata].text[newcanto] + "</div>");
					appdata.elements.slider.insertBefore(_insert, appdata.elements.slider.childNodes[0]);
					Velocity(appdata.elements.slider, { 'left': "100%" }, {
						duration: appdata.delay,
						mobileHA: false,
						complete: function complete() {
							dom.removebyselector("#oldtext");
							appdata.elements.slider.style.left = "0";
							appdata.elements.text.style.left = "0";
						}
					});
				}
				appdata.elements.text = document.getElementById("text");
			} else {

				// console.log("No change in translation!"); // not shift left/shift right – do normal thing

				for (var j in appdata.translationdata) {
					if (newtrans == appdata.translationdata[j].translationid) {
						newdata = j;
					}
					if (appdata.currenttranslation == appdata.translationdata[j].translationid) {
						olddata = j;
					}
				}

				appdata.elements.text.innerHTML = appdata.textdata[newdata].text[newcanto];
				dom.removeclass("#text", appdata.translationdata[olddata].translationclass); // is this not working for multiple classes?
				dom.addclass("#text", appdata.translationdata[newdata].translationclass); // is this not working for multiple classes?
			}

			app.setupnotes();
			appdata.currenttranslation = newtrans;
			appdata.currentcanto = newcanto;

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

			if (appdata.currentcanto > 0) {
				document.getElementById("navtitle").innerHTML = appdata.translationdata[newdata].translationshortname + " \xB7 <strong>Canto " + appdata.currentcanto + "</strong>";
			} else {
				document.getElementById("navtitle").innerHTML = "&nbsp;";
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

			console.log("—>text width: " + appdata.textwidth);
			console.log("—>max width: " + maxwidth);

			appdata.elements.text.style.paddingLeft = (appdata.textwidth - maxwidth) / 2 + "px";
			appdata.elements.text.style.paddingRight = (appdata.textwidth - maxwidth) / 2 + "px";
		} else {

			// this is prose, standardized padding

			desiredwidth = 75; // this is in vw

			console.log("—>text width: " + appdata.textwidth);
			console.log("—>desired width: " + desiredwidth);
			console.log("—>lineheight: " + appdata.lineheight);

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
					insert = dom.create("<option id=\"tr_" + appdata.translationdata[j].translationid + "\" " + (appdata.currenttranslationlist.indexOf(appdata.currenttranslation) == _i2 ? "selected" : "") + ">" + appdata.translationdata[j].translationfullname + "</option>");
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
					app.setlens(appdata.currenttranslationlist[_j], thiscanto, 0);
				}
			}
		};
	},
	savecurrentdata: function savecurrentdata() {

		// this should store appdate on localstorage (does that work for mobile?)
		// also if we're not on mobile, set canto/translation in hash


	},
	changetranslation: function changetranslation(thisid, isset) {
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

		if (appdata.currenttranslationlist.indexOf(appdata.currenttranslation) < 0) {
			appdata.currenttranslation = appdata.currenttranslationlist[0];
		}

		app.updatesettings();
	},
	setpage: function setpage(newpage) {
		dom.removeclass(".page", "on");
		dom.addclass(".page#" + newpage, "on");
		appdata.currentpage = newpage;
		if (newpage !== "lens") {
			// set title to be whatever the h1 is

			var newtitle = document.querySelector("#" + newpage + " h1").innerHTML;
			document.getElementById("navtitle").innerHTML = newtitle;
		} else {
			app.resize();
		}
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

module.exports = app;

},{"./appdata":2,"./dom":3,"fastclick":8,"hammerjs":9,"velocity-animate":10}],2:[function(require,module,exports){
"use strict";

// appdata.js

module.exports = {
	currenttranslationlist: [], // list of ids of translations we're currently using
	currenttranslation: "", // this was an index, changing it to a member of currenttranslationlist
	currentcanto: 0,
	lineheight: 24,
	lenswidth: window.innerWidth, // do these numbers dynamically update? This could be screwing us up.
	lensheight: window.innerHeight - 40,
	windowwidth: window.innerWidth,
	windowheight: window.innerHeight,
	textwidth: window.innerWidth,
	currentpage: "lens",
	nightmode: false,
	currentpercentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
	currentlines: 0, // this is the number of lines calculated to be on the page
	elements: {},
	delay: 300
};

},{}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
"use strict";

var app = require("./modules/app");
var bookdata = require("./paradiso/bookdata");
var appdata = require("./modules/appdata");

appdata.textdata = bookdata.textdata;
appdata.translationdata = bookdata.translationdata;
appdata.cantotitles = bookdata.cantotitles;
appdata.translationcount = bookdata.translationdata.length;
appdata.cantocount = bookdata.cantotitles.length;
appdata.description = bookdata.description;
appdata.bookname = bookdata.bookname;
appdata.booktitle = bookdata.booktitle;
appdata.bookauthor = bookdata.bookauthor;

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
if (!('onDeviceReady' in document)) {
	console.log("Running non-Cordova code!");
	app.setup(); // (hopefully this doesn't fire in real version?)
}

},{"./modules/app":1,"./modules/appdata":2,"./paradiso/bookdata":5}],5:[function(require,module,exports){
"use strict";

// the spine for the book

module.exports = {

	bookname: 'paradiso',
	booktitle: "Paradiso",
	bookauthor: "Dante Alighieri",
	description: "<p>The thrilling conclusion to <em>The Divine Comedy</em>.",

	cantotitles: [// this is canto sequence
	"Title page", "Canto 1", "Canto 2", "Canto 3", "Canto 4", "Canto 5", "Canto 6", "Canto 7", "Canto 8", "Canto 9", "Canto 10", "Canto 11", "Canto 12", "Canto 13", "Canto 14", "Canto 15", "Canto 16", "Canto 17", "Canto 18", "Canto 19", "Canto 20", "Canto 21", "Canto 22", "Canto 23", "Canto 24", "Canto 25", "Canto 26", "Canto 27", "Canto 28", "Canto 29", "Canto 30", "Canto 31", "Canto 32", "Canto 33"],

	translationdata: [// this is translation sequence
	{ "translationid": "dante",
		"order": 0 }, { "translationid": "longfellow",
		"order": 1 } /*,
               {"translationid":"wright",
               "order":3},
               {"translationid":"carlyle",
               "order":4}*/
	],

	textdata: [// set up translations
	require("./translations/dante"), require("./translations/longfellow")]
};

},{"./translations/dante":6,"./translations/longfellow":7}],6:[function(require,module,exports){
// paradiso/italian.js
"use strict";module.exports={bookname:'paradiso',author:'Dante Alighieri',translationid:"dante",title:'Paradiso',translation:false,source:'<a href="http://www.gutenberg.org/ebooks/1011">Project Gutenberg</a>',translationshortname:"Dante",translationfullname:"Dante Alighieri",translationclass:"poetry",text:['<p class="title">Paradiso</p>\n\t<p class="author">Dante Alighieri</p>','<p class="cantohead">Canto I</p>\n\n<div class="stanza"><p>La gloria di colui che tutto move</p>\n<p>per l&rsquo;universo penetra, e risplende</p>\n<p>in una parte pi&ugrave; e meno altrove.</p></div>\n\n<div class="stanza"><p>Nel ciel che pi&ugrave; de la sua luce prende</p>\n<p>fu&rsquo; io, e vidi cose che ridire</p>\n<p>n&eacute; sa n&eacute; pu&ograve; chi di l&agrave; s&ugrave; discende;</p></div>\n\n<div class="stanza"><p>perch&eacute; appressando s&eacute; al suo disire,</p>\n<p>nostro intelletto si profonda tanto,</p>\n<p>che dietro la memoria non pu&ograve; ire.</p></div>\n\n<div class="stanza"><p>Veramente quant&rsquo; io del regno santo</p>\n<p>ne la mia mente potei far tesoro,</p>\n<p>sar&agrave; ora materia del mio canto.</p></div>\n\n<div class="stanza"><p>O buono Appollo, a l&rsquo;ultimo lavoro</p>\n<p>fammi del tuo valor s&igrave; fatto vaso,</p>\n<p>come dimandi a dar l&rsquo;amato alloro.</p></div>\n\n<div class="stanza"><p>Infino a qui l&rsquo;un giogo di Parnaso</p>\n<p>assai mi fu; ma or con amendue</p>\n<p>m&rsquo;&egrave; uopo intrar ne l&rsquo;aringo rimaso.</p></div>\n\n<div class="stanza"><p>Entra nel petto mio, e spira tue</p>\n<p>s&igrave; come quando Mars&iuml;a traesti</p>\n<p>de la vagina de le membra sue.</p></div>\n\n<div class="stanza"><p>O divina virt&ugrave;, se mi ti presti</p>\n<p>tanto che l&rsquo;ombra del beato regno</p>\n<p>segnata nel mio capo io manifesti,</p></div>\n\n<div class="stanza"><p>vedra&rsquo;mi al pi&egrave; del tuo diletto legno</p>\n<p>venire, e coronarmi de le foglie</p>\n<p>che la materia e tu mi farai degno.</p></div>\n\n<div class="stanza"><p>S&igrave; rade volte, padre, se ne coglie</p>\n<p>per tr&iuml;unfare o cesare o poeta,</p>\n<p>colpa e vergogna de l&rsquo;umane voglie,</p></div>\n\n<div class="stanza"><p>che parturir letizia in su la lieta</p>\n<p>delfica de&iuml;t&agrave; dovria la fronda</p>\n<p>peneia, quando alcun di s&eacute; asseta.</p></div>\n\n<div class="stanza"><p>Poca favilla gran fiamma seconda:</p>\n<p>forse di retro a me con miglior voci</p>\n<p>si pregher&agrave; perch&eacute; Cirra risponda.</p></div>\n\n<div class="stanza"><p>Surge ai mortali per diverse foci</p>\n<p>la lucerna del mondo; ma da quella</p>\n<p>che quattro cerchi giugne con tre croci,</p></div>\n\n<div class="stanza"><p>con miglior corso e con migliore stella</p>\n<p>esce congiunta, e la mondana cera</p>\n<p>pi&ugrave; a suo modo tempera e suggella.</p></div>\n\n<div class="stanza"><p>Fatto avea di l&agrave; mane e di qua sera</p>\n<p>tal foce, e quasi tutto era l&agrave; bianco</p>\n<p>quello emisperio, e l&rsquo;altra parte nera,</p></div>\n\n<div class="stanza"><p>quando Beatrice in sul sinistro fianco</p>\n<p>vidi rivolta e riguardar nel sole:</p>\n<p>aguglia s&igrave; non li s&rsquo;affisse unquanco.</p></div>\n\n<div class="stanza"><p>E s&igrave; come secondo raggio suole</p>\n<p>uscir del primo e risalire in suso,</p>\n<p>pur come pelegrin che tornar vuole,</p></div>\n\n<div class="stanza"><p>cos&igrave; de l&rsquo;atto suo, per li occhi infuso</p>\n<p>ne l&rsquo;imagine mia, il mio si fece,</p>\n<p>e fissi li occhi al sole oltre nostr&rsquo; uso.</p></div>\n\n<div class="stanza"><p>Molto &egrave; licito l&agrave;, che qui non lece</p>\n<p>a le nostre virt&ugrave;, merc&eacute; del loco</p>\n<p>fatto per proprio de l&rsquo;umana spece.</p></div>\n\n<div class="stanza"><p>Io nol soffersi molto, n&eacute; s&igrave; poco,</p>\n<p>ch&rsquo;io nol vedessi sfavillar dintorno,</p>\n<p>com&rsquo; ferro che bogliente esce del foco;</p></div>\n\n<div class="stanza"><p>e di s&ugrave;bito parve giorno a giorno</p>\n<p>essere aggiunto, come quei che puote</p>\n<p>avesse il ciel d&rsquo;un altro sole addorno.</p></div>\n\n<div class="stanza"><p>Beatrice tutta ne l&rsquo;etterne rote</p>\n<p>fissa con li occhi stava; e io in lei</p>\n<p>le luci fissi, di l&agrave; s&ugrave; rimote.</p></div>\n\n<div class="stanza"><p>Nel suo aspetto tal dentro mi fei,</p>\n<p>qual si f&eacute; Glauco nel gustar de l&rsquo;erba</p>\n<p>che &rsquo;l f&eacute; consorto in mar de li altri d&egrave;i.</p></div>\n\n<div class="stanza"><p>Trasumanar significar per verba</p>\n<p>non si poria; per&ograve; l&rsquo;essemplo basti</p>\n<p>a cui esper&iuml;enza grazia serba.</p></div>\n\n<div class="stanza"><p>S&rsquo;i&rsquo; era sol di me quel che creasti</p>\n<p>novellamente, amor che &rsquo;l ciel governi,</p>\n<p>tu &rsquo;l sai, che col tuo lume mi levasti.</p></div>\n\n<div class="stanza"><p>Quando la rota che tu sempiterni</p>\n<p>desiderato, a s&eacute; mi fece atteso</p>\n<p>con l&rsquo;armonia che temperi e discerni,</p></div>\n\n<div class="stanza"><p>parvemi tanto allor del cielo acceso</p>\n<p>de la fiamma del sol, che pioggia o fiume</p>\n<p>lago non fece alcun tanto disteso.</p></div>\n\n<div class="stanza"><p>La novit&agrave; del suono e &rsquo;l grande lume</p>\n<p>di lor cagion m&rsquo;accesero un disio</p>\n<p>mai non sentito di cotanto acume.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ella, che vedea me s&igrave; com&rsquo; io,</p>\n<p>a qu&iuml;etarmi l&rsquo;animo commosso,</p>\n<p>pria ch&rsquo;io a dimandar, la bocca aprio</p></div>\n\n<div class="stanza"><p>e cominci&ograve;: &laquo;Tu stesso ti fai grosso</p>\n<p>col falso imaginar, s&igrave; che non vedi</p>\n<p>ci&ograve; che vedresti se l&rsquo;avessi scosso.</p></div>\n\n<div class="stanza"><p>Tu non se&rsquo; in terra, s&igrave; come tu credi;</p>\n<p>ma folgore, fuggendo il proprio sito,</p>\n<p>non corse come tu ch&rsquo;ad esso riedi&raquo;.</p></div>\n\n<div class="stanza"><p>S&rsquo;io fui del primo dubbio disvestito</p>\n<p>per le sorrise parolette brevi,</p>\n<p>dentro ad un nuovo pi&ugrave; fu&rsquo; inretito</p></div>\n\n<div class="stanza"><p>e dissi: &laquo;Gi&agrave; contento requ&iuml;evi</p>\n<p>di grande ammirazion; ma ora ammiro</p>\n<p>com&rsquo; io trascenda questi corpi levi&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ella, appresso d&rsquo;un p&iuml;o sospiro,</p>\n<p>li occhi drizz&ograve; ver&rsquo; me con quel sembiante</p>\n<p>che madre fa sovra figlio deliro,</p></div>\n\n<div class="stanza"><p>e cominci&ograve;: &laquo;Le cose tutte quante</p>\n<p>hanno ordine tra loro, e questo &egrave; forma</p>\n<p>che l&rsquo;universo a Dio fa simigliante.</p></div>\n\n<div class="stanza"><p>Qui veggion l&rsquo;alte creature l&rsquo;orma</p>\n<p>de l&rsquo;etterno valore, il qual &egrave; fine</p>\n<p>al quale &egrave; fatta la toccata norma.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;ordine ch&rsquo;io dico sono accline</p>\n<p>tutte nature, per diverse sorti,</p>\n<p>pi&ugrave; al principio loro e men vicine;</p></div>\n\n<div class="stanza"><p>onde si muovono a diversi porti</p>\n<p>per lo gran mar de l&rsquo;essere, e ciascuna</p>\n<p>con istinto a lei dato che la porti.</p></div>\n\n<div class="stanza"><p>Questi ne porta il foco inver&rsquo; la luna;</p>\n<p>questi ne&rsquo; cor mortali &egrave; permotore;</p>\n<p>questi la terra in s&eacute; stringe e aduna;</p></div>\n\n<div class="stanza"><p>n&eacute; pur le creature che son fore</p>\n<p>d&rsquo;intelligenza quest&rsquo; arco saetta,</p>\n<p>ma quelle c&rsquo;hanno intelletto e amore.</p></div>\n\n<div class="stanza"><p>La provedenza, che cotanto assetta,</p>\n<p>del suo lume fa &rsquo;l ciel sempre qu&iuml;eto</p>\n<p>nel qual si volge quel c&rsquo;ha maggior fretta;</p></div>\n\n<div class="stanza"><p>e ora l&igrave;, come a sito decreto,</p>\n<p>cen porta la virt&ugrave; di quella corda</p>\n<p>che ci&ograve; che scocca drizza in segno lieto.</p></div>\n\n<div class="stanza"><p>Vero &egrave; che, come forma non s&rsquo;accorda</p>\n<p>molte f&iuml;ate a l&rsquo;intenzion de l&rsquo;arte,</p>\n<p>perch&rsquo; a risponder la materia &egrave; sorda,</p></div>\n\n<div class="stanza"><p>cos&igrave; da questo corso si diparte</p>\n<p>talor la creatura, c&rsquo;ha podere</p>\n<p>di piegar, cos&igrave; pinta, in altra parte;</p></div>\n\n<div class="stanza"><p>e s&igrave; come veder si pu&ograve; cadere</p>\n<p>foco di nube, s&igrave; l&rsquo;impeto primo</p>\n<p>l&rsquo;atterra torto da falso piacere.</p></div>\n\n<div class="stanza"><p>Non dei pi&ugrave; ammirar, se bene stimo,</p>\n<p>lo tuo salir, se non come d&rsquo;un rivo</p>\n<p>se d&rsquo;alto monte scende giuso ad imo.</p></div>\n\n<div class="stanza"><p>Maraviglia sarebbe in te se, privo</p>\n<p>d&rsquo;impedimento, gi&ugrave; ti fossi assiso,</p>\n<p>com&rsquo; a terra qu&iuml;ete in foco vivo&raquo;.</p></div>\n\n<div class="stanza"><p>Quinci rivolse inver&rsquo; lo cielo il viso.</p></div>','<p class="cantohead">Canto II</p>\n\n<div class="stanza"><p>O voi che siete in piccioletta barca,</p>\n<p>desiderosi d&rsquo;ascoltar, seguiti</p>\n<p>dietro al mio legno che cantando varca,</p></div>\n\n<div class="stanza"><p>tornate a riveder li vostri liti:</p>\n<p>non vi mettete in pelago, ch&eacute; forse,</p>\n<p>perdendo me, rimarreste smarriti.</p></div>\n\n<div class="stanza"><p>L&rsquo;acqua ch&rsquo;io prendo gi&agrave; mai non si corse;</p>\n<p>Minerva spira, e conducemi Appollo,</p>\n<p>e nove Muse mi dimostran l&rsquo;Orse.</p></div>\n\n<div class="stanza"><p>Voialtri pochi che drizzaste il collo</p>\n<p>per tempo al pan de li angeli, del quale</p>\n<p>vivesi qui ma non sen vien satollo,</p></div>\n\n<div class="stanza"><p>metter potete ben per l&rsquo;alto sale</p>\n<p>vostro navigio, servando mio solco</p>\n<p>dinanzi a l&rsquo;acqua che ritorna equale.</p></div>\n\n<div class="stanza"><p>Que&rsquo; glor&iuml;osi che passaro al Colco</p>\n<p>non s&rsquo;ammiraron come voi farete,</p>\n<p>quando Ias&oacute;n vider fatto bifolco.</p></div>\n\n<div class="stanza"><p>La concreata e perpet&uuml;a sete</p>\n<p>del de&iuml;forme regno cen portava</p>\n<p>veloci quasi come &rsquo;l ciel vedete.</p></div>\n\n<div class="stanza"><p>Beatrice in suso, e io in lei guardava;</p>\n<p>e forse in tanto in quanto un quadrel posa</p>\n<p>e vola e da la noce si dischiava,</p></div>\n\n<div class="stanza"><p>giunto mi vidi ove mirabil cosa</p>\n<p>mi torse il viso a s&eacute;; e per&ograve; quella</p>\n<p>cui non potea mia cura essere ascosa,</p></div>\n\n<div class="stanza"><p>volta ver&rsquo; me, s&igrave; lieta come bella,</p>\n<p>&laquo;Drizza la mente in Dio grata&raquo;, mi disse,</p>\n<p>&laquo;che n&rsquo;ha congiunti con la prima stella&raquo;.</p></div>\n\n<div class="stanza"><p>Parev&rsquo; a me che nube ne coprisse</p>\n<p>lucida, spessa, solida e pulita,</p>\n<p>quasi adamante che lo sol ferisse.</p></div>\n\n<div class="stanza"><p>Per entro s&eacute; l&rsquo;etterna margarita</p>\n<p>ne ricevette, com&rsquo; acqua recepe</p>\n<p>raggio di luce permanendo unita.</p></div>\n\n<div class="stanza"><p>S&rsquo;io era corpo, e qui non si concepe</p>\n<p>com&rsquo; una dimensione altra patio,</p>\n<p>ch&rsquo;esser convien se corpo in corpo repe,</p></div>\n\n<div class="stanza"><p>accender ne dovria pi&ugrave; il disio</p>\n<p>di veder quella essenza in che si vede</p>\n<p>come nostra natura e Dio s&rsquo;unio.</p></div>\n\n<div class="stanza"><p>L&igrave; si vedr&agrave; ci&ograve; che tenem per fede,</p>\n<p>non dimostrato, ma fia per s&eacute; noto</p>\n<p>a guisa del ver primo che l&rsquo;uom crede.</p></div>\n\n<div class="stanza"><p>Io rispuosi: &laquo;Madonna, s&igrave; devoto</p>\n<p>com&rsquo; esser posso pi&ugrave;, ringrazio lui</p>\n<p>lo qual dal mortal mondo m&rsquo;ha remoto.</p></div>\n\n<div class="stanza"><p>Ma ditemi: che son li segni bui</p>\n<p>di questo corpo, che l&agrave; giuso in terra</p>\n<p>fan di Cain favoleggiare altrui?&raquo;.</p></div>\n\n<div class="stanza"><p>Ella sorrise alquanto, e poi &laquo;S&rsquo;elli erra</p>\n<p>l&rsquo;oppin&iuml;on&raquo;, mi disse, &laquo;d&rsquo;i mortali</p>\n<p>dove chiave di senso non diserra,</p></div>\n\n<div class="stanza"><p>certo non ti dovrien punger li strali</p>\n<p>d&rsquo;ammirazione omai, poi dietro ai sensi</p>\n<p>vedi che la ragione ha corte l&rsquo;ali.</p></div>\n\n<div class="stanza"><p>Ma dimmi quel che tu da te ne pensi&raquo;.</p>\n<p>E io: &laquo;Ci&ograve; che n&rsquo;appar qua s&ugrave; diverso</p>\n<p>credo che fanno i corpi rari e densi&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ella: &laquo;Certo assai vedrai sommerso</p>\n<p>nel falso il creder tuo, se bene ascolti</p>\n<p>l&rsquo;argomentar ch&rsquo;io li far&ograve; avverso.</p></div>\n\n<div class="stanza"><p>La spera ottava vi dimostra molti</p>\n<p>lumi, li quali e nel quale e nel quanto</p>\n<p>notar si posson di diversi volti.</p></div>\n\n<div class="stanza"><p>Se raro e denso ci&ograve; facesser tanto,</p>\n<p>una sola virt&ugrave; sarebbe in tutti,</p>\n<p>pi&ugrave; e men distributa e altrettanto.</p></div>\n\n<div class="stanza"><p>Virt&ugrave; diverse esser convegnon frutti</p>\n<p>di princ&igrave;pi formali, e quei, for ch&rsquo;uno,</p>\n<p>seguiterieno a tua ragion distrutti.</p></div>\n\n<div class="stanza"><p>Ancor, se raro fosse di quel bruno</p>\n<p>cagion che tu dimandi, o d&rsquo;oltre in parte</p>\n<p>fora di sua materia s&igrave; digiuno</p></div>\n\n<div class="stanza"><p>esto pianeto, o, s&igrave; come comparte</p>\n<p>lo grasso e &rsquo;l magro un corpo, cos&igrave; questo</p>\n<p>nel suo volume cangerebbe carte.</p></div>\n\n<div class="stanza"><p>Se &rsquo;l primo fosse, fora manifesto</p>\n<p>ne l&rsquo;eclissi del sol, per trasparere</p>\n<p>lo lume come in altro raro ingesto.</p></div>\n\n<div class="stanza"><p>Questo non &egrave;: per&ograve; &egrave; da vedere</p>\n<p>de l&rsquo;altro; e s&rsquo;elli avvien ch&rsquo;io l&rsquo;altro cassi,</p>\n<p>falsificato fia lo tuo parere.</p></div>\n\n<div class="stanza"><p>S&rsquo;elli &egrave; che questo raro non trapassi,</p>\n<p>esser conviene un termine da onde</p>\n<p>lo suo contrario pi&ugrave; passar non lassi;</p></div>\n\n<div class="stanza"><p>e indi l&rsquo;altrui raggio si rifonde</p>\n<p>cos&igrave; come color torna per vetro</p>\n<p>lo qual di retro a s&eacute; piombo nasconde.</p></div>\n\n<div class="stanza"><p>Or dirai tu ch&rsquo;el si dimostra tetro</p>\n<p>ivi lo raggio pi&ugrave; che in altre parti,</p>\n<p>per esser l&igrave; refratto pi&ugrave; a retro.</p></div>\n\n<div class="stanza"><p>Da questa instanza pu&ograve; deliberarti</p>\n<p>esper&iuml;enza, se gi&agrave; mai la provi,</p>\n<p>ch&rsquo;esser suol fonte ai rivi di vostr&rsquo; arti.</p></div>\n\n<div class="stanza"><p>Tre specchi prenderai; e i due rimovi</p>\n<p>da te d&rsquo;un modo, e l&rsquo;altro, pi&ugrave; rimosso,</p>\n<p>tr&rsquo;ambo li primi li occhi tuoi ritrovi.</p></div>\n\n<div class="stanza"><p>Rivolto ad essi, fa che dopo il dosso</p>\n<p>ti stea un lume che i tre specchi accenda</p>\n<p>e torni a te da tutti ripercosso.</p></div>\n\n<div class="stanza"><p>Ben che nel quanto tanto non si stenda</p>\n<p>la vista pi&ugrave; lontana, l&igrave; vedrai</p>\n<p>come convien ch&rsquo;igualmente risplenda.</p></div>\n\n<div class="stanza"><p>Or, come ai colpi de li caldi rai</p>\n<p>de la neve riman nudo il suggetto</p>\n<p>e dal colore e dal freddo primai,</p></div>\n\n<div class="stanza"><p>cos&igrave; rimaso te ne l&rsquo;intelletto</p>\n<p>voglio informar di luce s&igrave; vivace,</p>\n<p>che ti tremoler&agrave; nel suo aspetto.</p></div>\n\n<div class="stanza"><p>Dentro dal ciel de la divina pace</p>\n<p>si gira un corpo ne la cui virtute</p>\n<p>l&rsquo;esser di tutto suo contento giace.</p></div>\n\n<div class="stanza"><p>Lo ciel seguente, c&rsquo;ha tante vedute,</p>\n<p>quell&rsquo; esser parte per diverse essenze,</p>\n<p>da lui distratte e da lui contenute.</p></div>\n\n<div class="stanza"><p>Li altri giron per varie differenze</p>\n<p>le distinzion che dentro da s&eacute; hanno</p>\n<p>dispongono a lor fini e lor semenze.</p></div>\n\n<div class="stanza"><p>Questi organi del mondo cos&igrave; vanno,</p>\n<p>come tu vedi omai, di grado in grado,</p>\n<p>che di s&ugrave; prendono e di sotto fanno.</p></div>\n\n<div class="stanza"><p>Riguarda bene omai s&igrave; com&rsquo; io vado</p>\n<p>per questo loco al vero che disiri,</p>\n<p>s&igrave; che poi sappi sol tener lo guado.</p></div>\n\n<div class="stanza"><p>Lo moto e la virt&ugrave; d&rsquo;i santi giri,</p>\n<p>come dal fabbro l&rsquo;arte del martello,</p>\n<p>da&rsquo; beati motor convien che spiri;</p></div>\n\n<div class="stanza"><p>e &rsquo;l ciel cui tanti lumi fanno bello,</p>\n<p>de la mente profonda che lui volve</p>\n<p>prende l&rsquo;image e fassene suggello.</p></div>\n\n<div class="stanza"><p>E come l&rsquo;alma dentro a vostra polve</p>\n<p>per differenti membra e conformate</p>\n<p>a diverse potenze si risolve,</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;intelligenza sua bontate</p>\n<p>multiplicata per le stelle spiega,</p>\n<p>girando s&eacute; sovra sua unitate.</p></div>\n\n<div class="stanza"><p>Virt&ugrave; diversa fa diversa lega</p>\n<p>col prez&iuml;oso corpo ch&rsquo;ella avviva,</p>\n<p>nel qual, s&igrave; come vita in voi, si lega.</p></div>\n\n<div class="stanza"><p>Per la natura lieta onde deriva,</p>\n<p>la virt&ugrave; mista per lo corpo luce</p>\n<p>come letizia per pupilla viva.</p></div>\n\n<div class="stanza"><p>Da essa vien ci&ograve; che da luce a luce</p>\n<p>par differente, non da denso e raro;</p>\n<p>essa &egrave; formal principio che produce,</p></div>\n\n<div class="stanza"><p>conforme a sua bont&agrave;, lo turbo e &rsquo;l chiaro&raquo;.</p></div>','<p class="cantohead">Canto III</p>\n\n<div class="stanza"><p>Quel sol che pria d&rsquo;amor mi scald&ograve; &rsquo;l petto,</p>\n<p>di bella verit&agrave; m&rsquo;avea scoverto,</p>\n<p>provando e riprovando, il dolce aspetto;</p></div>\n\n<div class="stanza"><p>e io, per confessar corretto e certo</p>\n<p>me stesso, tanto quanto si convenne</p>\n<p>leva&rsquo; il capo a proferer pi&ugrave; erto;</p></div>\n\n<div class="stanza"><p>ma vis&iuml;one apparve che ritenne</p>\n<p>a s&eacute; me tanto stretto, per vedersi,</p>\n<p>che di mia confession non mi sovvenne.</p></div>\n\n<div class="stanza"><p>Quali per vetri trasparenti e tersi,</p>\n<p>o ver per acque nitide e tranquille,</p>\n<p>non s&igrave; profonde che i fondi sien persi,</p></div>\n\n<div class="stanza"><p>tornan d&rsquo;i nostri visi le postille</p>\n<p>debili s&igrave;, che perla in bianca fronte</p>\n<p>non vien men forte a le nostre pupille;</p></div>\n\n<div class="stanza"><p>tali vid&rsquo; io pi&ugrave; facce a parlar pronte;</p>\n<p>per ch&rsquo;io dentro a l&rsquo;error contrario corsi</p>\n<p>a quel ch&rsquo;accese amor tra l&rsquo;omo e &rsquo;l fonte.</p></div>\n\n<div class="stanza"><p>S&ugrave;bito s&igrave; com&rsquo; io di lor m&rsquo;accorsi,</p>\n<p>quelle stimando specchiati sembianti,</p>\n<p>per veder di cui fosser, li occhi torsi;</p></div>\n\n<div class="stanza"><p>e nulla vidi, e ritorsili avanti</p>\n<p>dritti nel lume de la dolce guida,</p>\n<p>che, sorridendo, ardea ne li occhi santi.</p></div>\n\n<div class="stanza"><p>&laquo;Non ti maravigliar perch&rsquo; io sorrida&raquo;,</p>\n<p>mi disse, &laquo;appresso il tuo p&uuml;eril coto,</p>\n<p>poi sopra &rsquo;l vero ancor lo pi&egrave; non fida,</p></div>\n\n<div class="stanza"><p>ma te rivolve, come suole, a v&ograve;to:</p>\n<p>vere sustanze son ci&ograve; che tu vedi,</p>\n<p>qui rilegate per manco di voto.</p></div>\n\n<div class="stanza"><p>Per&ograve; parla con esse e odi e credi;</p>\n<p>ch&eacute; la verace luce che le appaga</p>\n<p>da s&eacute; non lascia lor torcer li piedi&raquo;.</p></div>\n\n<div class="stanza"><p>E io a l&rsquo;ombra che parea pi&ugrave; vaga</p>\n<p>di ragionar, drizza&rsquo;mi, e cominciai,</p>\n<p>quasi com&rsquo; uom cui troppa voglia smaga:</p></div>\n\n<div class="stanza"><p>&laquo;O ben creato spirito, che a&rsquo; rai</p>\n<p>di vita etterna la dolcezza senti</p>\n<p>che, non gustata, non s&rsquo;intende mai,</p></div>\n\n<div class="stanza"><p>graz&iuml;oso mi fia se mi contenti</p>\n<p>del nome tuo e de la vostra sorte&raquo;.</p>\n<p>Ond&rsquo; ella, pronta e con occhi ridenti:</p></div>\n\n<div class="stanza"><p>&laquo;La nostra carit&agrave; non serra porte</p>\n<p>a giusta voglia, se non come quella</p>\n<p>che vuol simile a s&eacute; tutta sua corte.</p></div>\n\n<div class="stanza"><p>I&rsquo; fui nel mondo vergine sorella;</p>\n<p>e se la mente tua ben s&eacute; riguarda,</p>\n<p>non mi ti celer&agrave; l&rsquo;esser pi&ugrave; bella,</p></div>\n\n<div class="stanza"><p>ma riconoscerai ch&rsquo;i&rsquo; son Piccarda,</p>\n<p>che, posta qui con questi altri beati,</p>\n<p>beata sono in la spera pi&ugrave; tarda.</p></div>\n\n<div class="stanza"><p>Li nostri affetti, che solo infiammati</p>\n<p>son nel piacer de lo Spirito Santo,</p>\n<p>letizian del suo ordine formati.</p></div>\n\n<div class="stanza"><p>E questa sorte che par gi&ugrave; cotanto,</p>\n<p>per&ograve; n&rsquo;&egrave; data, perch&eacute; fuor negletti</p>\n<p>li nostri voti, e v&ograve;ti in alcun canto&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io a lei: &laquo;Ne&rsquo; mirabili aspetti</p>\n<p>vostri risplende non so che divino</p>\n<p>che vi trasmuta da&rsquo; primi concetti:</p></div>\n\n<div class="stanza"><p>per&ograve; non fui a rimembrar festino;</p>\n<p>ma or m&rsquo;aiuta ci&ograve; che tu mi dici,</p>\n<p>s&igrave; che raffigurar m&rsquo;&egrave; pi&ugrave; latino.</p></div>\n\n<div class="stanza"><p>Ma dimmi: voi che siete qui felici,</p>\n<p>disiderate voi pi&ugrave; alto loco</p>\n<p>per pi&ugrave; vedere e per pi&ugrave; farvi amici?&raquo;.</p></div>\n\n<div class="stanza"><p>Con quelle altr&rsquo; ombre pria sorrise un poco;</p>\n<p>da indi mi rispuose tanto lieta,</p>\n<p>ch&rsquo;arder parea d&rsquo;amor nel primo foco:</p></div>\n\n<div class="stanza"><p>&laquo;Frate, la nostra volont&agrave; qu&iuml;eta</p>\n<p>virt&ugrave; di carit&agrave;, che fa volerne</p>\n<p>sol quel ch&rsquo;avemo, e d&rsquo;altro non ci asseta.</p></div>\n\n<div class="stanza"><p>Se dis&iuml;assimo esser pi&ugrave; superne,</p>\n<p>foran discordi li nostri disiri</p>\n<p>dal voler di colui che qui ne cerne;</p></div>\n\n<div class="stanza"><p>che vedrai non capere in questi giri,</p>\n<p>s&rsquo;essere in carit&agrave; &egrave; qui necesse,</p>\n<p>e se la sua natura ben rimiri.</p></div>\n\n<div class="stanza"><p>Anzi &egrave; formale ad esto beato esse</p>\n<p>tenersi dentro a la divina voglia,</p>\n<p>per ch&rsquo;una fansi nostre voglie stesse;</p></div>\n\n<div class="stanza"><p>s&igrave; che, come noi sem di soglia in soglia</p>\n<p>per questo regno, a tutto il regno piace</p>\n<p>com&rsquo; a lo re che &rsquo;n suo voler ne &rsquo;nvoglia.</p></div>\n\n<div class="stanza"><p>E &rsquo;n la sua volontade &egrave; nostra pace:</p>\n<p>ell&rsquo; &egrave; quel mare al qual tutto si move</p>\n<p>ci&ograve; ch&rsquo;ella cr&iuml;a o che natura face&raquo;.</p></div>\n\n<div class="stanza"><p>Chiaro mi fu allor come ogne dove</p>\n<p>in cielo &egrave; paradiso, etsi la grazia</p>\n<p>del sommo ben d&rsquo;un modo non vi piove.</p></div>\n\n<div class="stanza"><p>Ma s&igrave; com&rsquo; elli avvien, s&rsquo;un cibo sazia</p>\n<p>e d&rsquo;un altro rimane ancor la gola,</p>\n<p>che quel si chere e di quel si ringrazia,</p></div>\n\n<div class="stanza"><p>cos&igrave; fec&rsquo; io con atto e con parola,</p>\n<p>per apprender da lei qual fu la tela</p>\n<p>onde non trasse infino a co la spuola.</p></div>\n\n<div class="stanza"><p>&laquo;Perfetta vita e alto merto inciela</p>\n<p>donna pi&ugrave; s&ugrave;&raquo;, mi disse, &laquo;a la cui norma</p>\n<p>nel vostro mondo gi&ugrave; si veste e vela,</p></div>\n\n<div class="stanza"><p>perch&eacute; fino al morir si vegghi e dorma</p>\n<p>con quello sposo ch&rsquo;ogne voto accetta</p>\n<p>che caritate a suo piacer conforma.</p></div>\n\n<div class="stanza"><p>Dal mondo, per seguirla, giovinetta</p>\n<p>fuggi&rsquo;mi, e nel suo abito mi chiusi</p>\n<p>e promisi la via de la sua setta.</p></div>\n\n<div class="stanza"><p>Uomini poi, a mal pi&ugrave; ch&rsquo;a bene usi,</p>\n<p>fuor mi rapiron de la dolce chiostra:</p>\n<p>Iddio si sa qual poi mia vita fusi.</p></div>\n\n<div class="stanza"><p>E quest&rsquo; altro splendor che ti si mostra</p>\n<p>da la mia destra parte e che s&rsquo;accende</p>\n<p>di tutto il lume de la spera nostra,</p></div>\n\n<div class="stanza"><p>ci&ograve; ch&rsquo;io dico di me, di s&eacute; intende;</p>\n<p>sorella fu, e cos&igrave; le fu tolta</p>\n<p>di capo l&rsquo;ombra de le sacre bende.</p></div>\n\n<div class="stanza"><p>Ma poi che pur al mondo fu rivolta</p>\n<p>contra suo grado e contra buona usanza,</p>\n<p>non fu dal vel del cor gi&agrave; mai disciolta.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; &egrave; la luce de la gran Costanza</p>\n<p>che del secondo vento di Soave</p>\n<p>gener&ograve; &rsquo;l terzo e l&rsquo;ultima possanza&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; parlommi, e poi cominci&ograve; &lsquo;Ave,</p>\n<p>Maria&rsquo; cantando, e cantando vanio</p>\n<p>come per acqua cupa cosa grave.</p></div>\n\n<div class="stanza"><p>La vista mia, che tanto lei seguio</p>\n<p>quanto possibil fu, poi che la perse,</p>\n<p>volsesi al segno di maggior disio,</p></div>\n\n<div class="stanza"><p>e a Beatrice tutta si converse;</p>\n<p>ma quella folgor&ograve; nel m&iuml;o sguardo</p>\n<p>s&igrave; che da prima il viso non sofferse;</p></div>\n\n<div class="stanza"><p>e ci&ograve; mi fece a dimandar pi&ugrave; tardo.</p></div>','<p class="cantohead">Canto IV</p>\n\n<div class="stanza"><p>Intra due cibi, distanti e moventi</p>\n<p>d&rsquo;un modo, prima si morria di fame,</p>\n<p>che liber&rsquo; omo l&rsquo;un recasse ai denti;</p></div>\n\n<div class="stanza"><p>s&igrave; si starebbe un agno intra due brame</p>\n<p>di fieri lupi, igualmente temendo;</p>\n<p>s&igrave; si starebbe un cane intra due dame:</p></div>\n\n<div class="stanza"><p>per che, s&rsquo;i&rsquo; mi tacea, me non riprendo,</p>\n<p>da li miei dubbi d&rsquo;un modo sospinto,</p>\n<p>poi ch&rsquo;era necessario, n&eacute; commendo.</p></div>\n\n<div class="stanza"><p>Io mi tacea, ma &rsquo;l mio disir dipinto</p>\n<p>m&rsquo;era nel viso, e &rsquo;l dimandar con ello,</p>\n<p>pi&ugrave; caldo assai che per parlar distinto.</p></div>\n\n<div class="stanza"><p>F&eacute; s&igrave; Beatrice qual f&eacute; Dan&iuml;ello,</p>\n<p>Nabuccodonosor levando d&rsquo;ira,</p>\n<p>che l&rsquo;avea fatto ingiustamente fello;</p></div>\n\n<div class="stanza"><p>e disse: &laquo;Io veggio ben come ti tira</p>\n<p>uno e altro disio, s&igrave; che tua cura</p>\n<p>s&eacute; stessa lega s&igrave; che fuor non spira.</p></div>\n\n<div class="stanza"><p>Tu argomenti: &ldquo;Se &rsquo;l buon voler dura,</p>\n<p>la v&iuml;olenza altrui per qual ragione</p>\n<p>di meritar mi scema la misura?&rdquo;.</p></div>\n\n<div class="stanza"><p>Ancor di dubitar ti d&agrave; cagione</p>\n<p>parer tornarsi l&rsquo;anime a le stelle,</p>\n<p>secondo la sentenza di Platone.</p></div>\n\n<div class="stanza"><p>Queste son le question che nel tuo velle</p>\n<p>pontano igualmente; e per&ograve; pria</p>\n<p>tratter&ograve; quella che pi&ugrave; ha di felle.</p></div>\n\n<div class="stanza"><p>D&rsquo;i Serafin colui che pi&ugrave; s&rsquo;india,</p>\n<p>Mo&iuml;s&egrave;, Samuel, e quel Giovanni</p>\n<p>che prender vuoli, io dico, non Maria,</p></div>\n\n<div class="stanza"><p>non hanno in altro cielo i loro scanni</p>\n<p>che questi spirti che mo t&rsquo;appariro,</p>\n<p>n&eacute; hanno a l&rsquo;esser lor pi&ugrave; o meno anni;</p></div>\n\n<div class="stanza"><p>ma tutti fanno bello il primo giro,</p>\n<p>e differentemente han dolce vita</p>\n<p>per sentir pi&ugrave; e men l&rsquo;etterno spiro.</p></div>\n\n<div class="stanza"><p>Qui si mostraro, non perch&eacute; sortita</p>\n<p>sia questa spera lor, ma per far segno</p>\n<p>de la celest&iuml;al c&rsquo;ha men salita.</p></div>\n\n<div class="stanza"><p>Cos&igrave; parlar conviensi al vostro ingegno,</p>\n<p>per&ograve; che solo da sensato apprende</p>\n<p>ci&ograve; che fa poscia d&rsquo;intelletto degno.</p></div>\n\n<div class="stanza"><p>Per questo la Scrittura condescende</p>\n<p>a vostra facultate, e piedi e mano</p>\n<p>attribuisce a Dio e altro intende;</p></div>\n\n<div class="stanza"><p>e Santa Chiesa con aspetto umano</p>\n<p>Gabr&iuml;el e Michel vi rappresenta,</p>\n<p>e l&rsquo;altro che Tobia rifece sano.</p></div>\n\n<div class="stanza"><p>Quel che Timeo de l&rsquo;anime argomenta</p>\n<p>non &egrave; simile a ci&ograve; che qui si vede,</p>\n<p>per&ograve; che, come dice, par che senta.</p></div>\n\n<div class="stanza"><p>Dice che l&rsquo;alma a la sua stella riede,</p>\n<p>credendo quella quindi esser decisa</p>\n<p>quando natura per forma la diede;</p></div>\n\n<div class="stanza"><p>e forse sua sentenza &egrave; d&rsquo;altra guisa</p>\n<p>che la voce non suona, ed esser puote</p>\n<p>con intenzion da non esser derisa.</p></div>\n\n<div class="stanza"><p>S&rsquo;elli intende tornare a queste ruote</p>\n<p>l&rsquo;onor de la influenza e &rsquo;l biasmo, forse</p>\n<p>in alcun vero suo arco percuote.</p></div>\n\n<div class="stanza"><p>Questo principio, male inteso, torse</p>\n<p>gi&agrave; tutto il mondo quasi, s&igrave; che Giove,</p>\n<p>Mercurio e Marte a nominar trascorse.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra dubitazion che ti commove</p>\n<p>ha men velen, per&ograve; che sua malizia</p>\n<p>non ti poria menar da me altrove.</p></div>\n\n<div class="stanza"><p>Parere ingiusta la nostra giustizia</p>\n<p>ne li occhi d&rsquo;i mortali, &egrave; argomento</p>\n<p>di fede e non d&rsquo;eretica nequizia.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; puote vostro accorgimento</p>\n<p>ben penetrare a questa veritate,</p>\n<p>come disiri, ti far&ograve; contento.</p></div>\n\n<div class="stanza"><p>Se v&iuml;olenza &egrave; quando quel che pate</p>\n<p>n&iuml;ente conferisce a quel che sforza,</p>\n<p>non fuor quest&rsquo; alme per essa scusate:</p></div>\n\n<div class="stanza"><p>ch&eacute; volont&agrave;, se non vuol, non s&rsquo;ammorza,</p>\n<p>ma fa come natura face in foco,</p>\n<p>se mille volte v&iuml;olenza il torza.</p></div>\n\n<div class="stanza"><p>Per che, s&rsquo;ella si piega assai o poco,</p>\n<p>segue la forza; e cos&igrave; queste fero</p>\n<p>possendo rifuggir nel santo loco.</p></div>\n\n<div class="stanza"><p>Se fosse stato lor volere intero,</p>\n<p>come tenne Lorenzo in su la grada,</p>\n<p>e fece Muzio a la sua man severo,</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;avria ripinte per la strada</p>\n<p>ond&rsquo; eran tratte, come fuoro sciolte;</p>\n<p>ma cos&igrave; salda voglia &egrave; troppo rada.</p></div>\n\n<div class="stanza"><p>E per queste parole, se ricolte</p>\n<p>l&rsquo;hai come dei, &egrave; l&rsquo;argomento casso</p>\n<p>che t&rsquo;avria fatto noia ancor pi&ugrave; volte.</p></div>\n\n<div class="stanza"><p>Ma or ti s&rsquo;attraversa un altro passo</p>\n<p>dinanzi a li occhi, tal che per te stesso</p>\n<p>non usciresti: pria saresti lasso.</p></div>\n\n<div class="stanza"><p>Io t&rsquo;ho per certo ne la mente messo</p>\n<p>ch&rsquo;alma beata non poria mentire,</p>\n<p>per&ograve; ch&rsquo;&egrave; sempre al primo vero appresso;</p></div>\n\n<div class="stanza"><p>e poi potesti da Piccarda udire</p>\n<p>che l&rsquo;affezion del vel Costanza tenne;</p>\n<p>s&igrave; ch&rsquo;ella par qui meco contradire.</p></div>\n\n<div class="stanza"><p>Molte f&iuml;ate gi&agrave;, frate, addivenne</p>\n<p>che, per fuggir periglio, contra grato</p>\n<p>si f&eacute; di quel che far non si convenne;</p></div>\n\n<div class="stanza"><p>come Almeone, che, di ci&ograve; pregato</p>\n<p>dal padre suo, la propria madre spense,</p>\n<p>per non perder piet&agrave; si f&eacute; spietato.</p></div>\n\n<div class="stanza"><p>A questo punto voglio che tu pense</p>\n<p>che la forza al voler si mischia, e fanno</p>\n<p>s&igrave; che scusar non si posson l&rsquo;offense.</p></div>\n\n<div class="stanza"><p>Voglia assoluta non consente al danno;</p>\n<p>ma consentevi in tanto in quanto teme,</p>\n<p>se si ritrae, cadere in pi&ugrave; affanno.</p></div>\n\n<div class="stanza"><p>Per&ograve;, quando Piccarda quello spreme,</p>\n<p>de la voglia assoluta intende, e io</p>\n<p>de l&rsquo;altra; s&igrave; che ver diciamo insieme&raquo;.</p></div>\n\n<div class="stanza"><p>Cotal fu l&rsquo;ondeggiar del santo rio</p>\n<p>ch&rsquo;usc&igrave; del fonte ond&rsquo; ogne ver deriva;</p>\n<p>tal puose in pace uno e altro disio.</p></div>\n\n<div class="stanza"><p>&laquo;O amanza del primo amante, o diva&raquo;,</p>\n<p>diss&rsquo; io appresso, &laquo;il cui parlar m&rsquo;inonda</p>\n<p>e scalda s&igrave;, che pi&ugrave; e pi&ugrave; m&rsquo;avviva,</p></div>\n\n<div class="stanza"><p>non &egrave; l&rsquo;affezion mia tanto profonda,</p>\n<p>che basti a render voi grazia per grazia;</p>\n<p>ma quei che vede e puote a ci&ograve; risponda.</p></div>\n\n<div class="stanza"><p>Io veggio ben che gi&agrave; mai non si sazia</p>\n<p>nostro intelletto, se &rsquo;l ver non lo illustra</p>\n<p>di fuor dal qual nessun vero si spazia.</p></div>\n\n<div class="stanza"><p>Posasi in esso, come fera in lustra,</p>\n<p>tosto che giunto l&rsquo;ha; e giugner puollo:</p>\n<p>se non, ciascun disio sarebbe frustra.</p></div>\n\n<div class="stanza"><p>Nasce per quello, a guisa di rampollo,</p>\n<p>a pi&egrave; del vero il dubbio; ed &egrave; natura</p>\n<p>ch&rsquo;al sommo pinge noi di collo in collo.</p></div>\n\n<div class="stanza"><p>Questo m&rsquo;invita, questo m&rsquo;assicura</p>\n<p>con reverenza, donna, a dimandarvi</p>\n<p>d&rsquo;un&rsquo;altra verit&agrave; che m&rsquo;&egrave; oscura.</p></div>\n\n<div class="stanza"><p>Io vo&rsquo; saper se l&rsquo;uom pu&ograve; sodisfarvi</p>\n<p>ai voti manchi s&igrave; con altri beni,</p>\n<p>ch&rsquo;a la vostra statera non sien parvi&raquo;.</p></div>\n\n<div class="stanza"><p>Beatrice mi guard&ograve; con li occhi pieni</p>\n<p>di faville d&rsquo;amor cos&igrave; divini,</p>\n<p>che, vinta, mia virtute di&egrave; le reni,</p></div>\n\n<div class="stanza"><p>e quasi mi perdei con li occhi chini.</p></div>','<p class="cantohead">Canto V</p>\n\n<div class="stanza"><p>&laquo;S&rsquo;io ti fiammeggio nel caldo d&rsquo;amore</p>\n<p>di l&agrave; dal modo che &rsquo;n terra si vede,</p>\n<p>s&igrave; che del viso tuo vinco il valore,</p></div>\n\n<div class="stanza"><p>non ti maravigliar, ch&eacute; ci&ograve; procede</p>\n<p>da perfetto veder, che, come apprende,</p>\n<p>cos&igrave; nel bene appreso move il piede.</p></div>\n\n<div class="stanza"><p>Io veggio ben s&igrave; come gi&agrave; resplende</p>\n<p>ne l&rsquo;intelletto tuo l&rsquo;etterna luce,</p>\n<p>che, vista, sola e sempre amore accende;</p></div>\n\n<div class="stanza"><p>e s&rsquo;altra cosa vostro amor seduce,</p>\n<p>non &egrave; se non di quella alcun vestigio,</p>\n<p>mal conosciuto, che quivi traluce.</p></div>\n\n<div class="stanza"><p>Tu vuo&rsquo; saper se con altro servigio,</p>\n<p>per manco voto, si pu&ograve; render tanto</p>\n<p>che l&rsquo;anima sicuri di letigio&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; cominci&ograve; Beatrice questo canto;</p>\n<p>e s&igrave; com&rsquo; uom che suo parlar non spezza,</p>\n<p>contin&uuml;&ograve; cos&igrave; &rsquo;l processo santo:</p></div>\n\n<div class="stanza"><p>&laquo;Lo maggior don che Dio per sua larghezza</p>\n<p>fesse creando, e a la sua bontate</p>\n<p>pi&ugrave; conformato, e quel ch&rsquo;e&rsquo; pi&ugrave; apprezza,</p></div>\n\n<div class="stanza"><p>fu de la volont&agrave; la libertate;</p>\n<p>di che le creature intelligenti,</p>\n<p>e tutte e sole, fuoro e son dotate.</p></div>\n\n<div class="stanza"><p>Or ti parr&agrave;, se tu quinci argomenti,</p>\n<p>l&rsquo;alto valor del voto, s&rsquo;&egrave; s&igrave; fatto</p>\n<p>che Dio consenta quando tu consenti;</p></div>\n\n<div class="stanza"><p>ch&eacute;, nel fermar tra Dio e l&rsquo;omo il patto,</p>\n<p>vittima fassi di questo tesoro,</p>\n<p>tal quale io dico; e fassi col suo atto.</p></div>\n\n<div class="stanza"><p>Dunque che render puossi per ristoro?</p>\n<p>Se credi bene usar quel c&rsquo;hai offerto,</p>\n<p>di maltolletto vuo&rsquo; far buon lavoro.</p></div>\n\n<div class="stanza"><p>Tu se&rsquo; omai del maggior punto certo;</p>\n<p>ma perch&eacute; Santa Chiesa in ci&ograve; dispensa,</p>\n<p>che par contra lo ver ch&rsquo;i&rsquo; t&rsquo;ho scoverto,</p></div>\n\n<div class="stanza"><p>convienti ancor sedere un poco a mensa,</p>\n<p>per&ograve; che &rsquo;l cibo rigido c&rsquo;hai preso,</p>\n<p>richiede ancora aiuto a tua dispensa.</p></div>\n\n<div class="stanza"><p>Apri la mente a quel ch&rsquo;io ti paleso</p>\n<p>e fermalvi entro; ch&eacute; non fa sc&iuml;enza,</p>\n<p>sanza lo ritenere, avere inteso.</p></div>\n\n<div class="stanza"><p>Due cose si convegnono a l&rsquo;essenza</p>\n<p>di questo sacrificio: l&rsquo;una &egrave; quella</p>\n<p>di che si fa; l&rsquo;altr&rsquo; &egrave; la convenenza.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; ultima gi&agrave; mai non si cancella</p>\n<p>se non servata; e intorno di lei</p>\n<p>s&igrave; preciso di sopra si favella:</p></div>\n\n<div class="stanza"><p>per&ograve; necessitato fu a li Ebrei</p>\n<p>pur l&rsquo;offerere, ancor ch&rsquo;alcuna offerta</p>\n<p>s&igrave; permutasse, come saver dei.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra, che per materia t&rsquo;&egrave; aperta,</p>\n<p>puote ben esser tal, che non si falla</p>\n<p>se con altra materia si converta.</p></div>\n\n<div class="stanza"><p>Ma non trasmuti carco a la sua spalla</p>\n<p>per suo arbitrio alcun, sanza la volta</p>\n<p>e de la chiave bianca e de la gialla;</p></div>\n\n<div class="stanza"><p>e ogne permutanza credi stolta,</p>\n<p>se la cosa dimessa in la sorpresa</p>\n<p>come &rsquo;l quattro nel sei non &egrave; raccolta.</p></div>\n\n<div class="stanza"><p>Per&ograve; qualunque cosa tanto pesa</p>\n<p>per suo valor che tragga ogne bilancia,</p>\n<p>sodisfar non si pu&ograve; con altra spesa.</p></div>\n\n<div class="stanza"><p>Non prendan li mortali il voto a ciancia;</p>\n<p>siate fedeli, e a ci&ograve; far non bieci,</p>\n<p>come Iept&egrave; a la sua prima mancia;</p></div>\n\n<div class="stanza"><p>cui pi&ugrave; si convenia dicer &lsquo;Mal feci&rsquo;,</p>\n<p>che, servando, far peggio; e cos&igrave; stolto</p>\n<p>ritrovar puoi il gran duca de&rsquo; Greci,</p></div>\n\n<div class="stanza"><p>onde pianse Efig&egrave;nia il suo bel volto,</p>\n<p>e f&eacute; pianger di s&eacute; i folli e i savi</p>\n<p>ch&rsquo;udir parlar di cos&igrave; fatto c&oacute;lto.</p></div>\n\n<div class="stanza"><p>Siate, Cristiani, a muovervi pi&ugrave; gravi:</p>\n<p>non siate come penna ad ogne vento,</p>\n<p>e non crediate ch&rsquo;ogne acqua vi lavi.</p></div>\n\n<div class="stanza"><p>Avete il novo e &rsquo;l vecchio Testamento,</p>\n<p>e &rsquo;l pastor de la Chiesa che vi guida;</p>\n<p>questo vi basti a vostro salvamento.</p></div>\n\n<div class="stanza"><p>Se mala cupidigia altro vi grida,</p>\n<p>uomini siate, e non pecore matte,</p>\n<p>s&igrave; che &rsquo;l Giudeo di voi tra voi non rida!</p></div>\n\n<div class="stanza"><p>Non fate com&rsquo; agnel che lascia il latte</p>\n<p>de la sua madre, e semplice e lascivo</p>\n<p>seco medesmo a suo piacer combatte!&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; Beatrice a me com&rsquo; &iuml;o scrivo;</p>\n<p>poi si rivolse tutta dis&iuml;ante</p>\n<p>a quella parte ove &rsquo;l mondo &egrave; pi&ugrave; vivo.</p></div>\n\n<div class="stanza"><p>Lo suo tacere e &rsquo;l trasmutar sembiante</p>\n<p>puoser silenzio al mio cupido ingegno,</p>\n<p>che gi&agrave; nuove questioni avea davante;</p></div>\n\n<div class="stanza"><p>e s&igrave; come saetta che nel segno</p>\n<p>percuote pria che sia la corda queta,</p>\n<p>cos&igrave; corremmo nel secondo regno.</p></div>\n\n<div class="stanza"><p>Quivi la donna mia vid&rsquo; io s&igrave; lieta,</p>\n<p>come nel lume di quel ciel si mise,</p>\n<p>che pi&ugrave; lucente se ne f&eacute; &rsquo;l pianeta.</p></div>\n\n<div class="stanza"><p>E se la stella si cambi&ograve; e rise,</p>\n<p>qual mi fec&rsquo; io che pur da mia natura</p>\n<p>trasmutabile son per tutte guise!</p></div>\n\n<div class="stanza"><p>Come &rsquo;n peschiera ch&rsquo;&egrave; tranquilla e pura</p>\n<p>traggonsi i pesci a ci&ograve; che vien di fori</p>\n<p>per modo che lo stimin lor pastura,</p></div>\n\n<div class="stanza"><p>s&igrave; vid&rsquo; io ben pi&ugrave; di mille splendori</p>\n<p>trarsi ver&rsquo; noi, e in ciascun s&rsquo;udia:</p>\n<p>&laquo;Ecco chi crescer&agrave; li nostri amori&raquo;.</p></div>\n\n<div class="stanza"><p>E s&igrave; come ciascuno a noi ven&igrave;a,</p>\n<p>vedeasi l&rsquo;ombra piena di letizia</p>\n<p>nel folg&oacute;r chiaro che di lei uscia.</p></div>\n\n<div class="stanza"><p>Pensa, lettor, se quel che qui s&rsquo;inizia</p>\n<p>non procedesse, come tu avresti</p>\n<p>di pi&ugrave; savere angosciosa carizia;</p></div>\n\n<div class="stanza"><p>e per te vederai come da questi</p>\n<p>m&rsquo;era in disio d&rsquo;udir lor condizioni,</p>\n<p>s&igrave; come a li occhi mi fur manifesti.</p></div>\n\n<div class="stanza"><p>&laquo;O bene nato a cui veder li troni</p>\n<p>del tr&iuml;unfo etternal concede grazia</p>\n<p>prima che la milizia s&rsquo;abbandoni,</p></div>\n\n<div class="stanza"><p>del lume che per tutto il ciel si spazia</p>\n<p>noi semo accesi; e per&ograve;, se disii</p>\n<p>di noi chiarirti, a tuo piacer ti sazia&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; da un di quelli spirti pii</p>\n<p>detto mi fu; e da Beatrice: &laquo;D&igrave;, d&igrave;</p>\n<p>sicuramente, e credi come a dii&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io veggio ben s&igrave; come tu t&rsquo;annidi</p>\n<p>nel proprio lume, e che de li occhi il traggi,</p>\n<p>perch&rsquo; e&rsquo; corusca s&igrave; come tu ridi;</p></div>\n\n<div class="stanza"><p>ma non so chi tu se&rsquo;, n&eacute; perch&eacute; aggi,</p>\n<p>anima degna, il grado de la spera</p>\n<p>che si vela a&rsquo; mortai con altrui raggi&raquo;.</p></div>\n\n<div class="stanza"><p>Questo diss&rsquo; io diritto a la lumera</p>\n<p>che pria m&rsquo;avea parlato; ond&rsquo; ella fessi</p>\n<p>lucente pi&ugrave; assai di quel ch&rsquo;ell&rsquo; era.</p></div>\n\n<div class="stanza"><p>S&igrave; come il sol che si cela elli stessi</p>\n<p>per troppa luce, come &rsquo;l caldo ha r&oacute;se</p>\n<p>le temperanze d&rsquo;i vapori spessi,</p></div>\n\n<div class="stanza"><p>per pi&ugrave; letizia s&igrave; mi si nascose</p>\n<p>dentro al suo raggio la figura santa;</p>\n<p>e cos&igrave; chiusa chiusa mi rispuose</p></div>\n\n<div class="stanza"><p>nel modo che &rsquo;l seguente canto canta.</p></div>','<p class="cantohead">Canto VI</p>\n\n<div class="stanza"><p>&laquo;Poscia che Costantin l&rsquo;aquila volse</p>\n<p>contr&rsquo; al corso del ciel, ch&rsquo;ella seguio</p>\n<p>dietro a l&rsquo;antico che Lavina tolse,</p></div>\n\n<div class="stanza"><p>cento e cent&rsquo; anni e pi&ugrave; l&rsquo;uccel di Dio</p>\n<p>ne lo stremo d&rsquo;Europa si ritenne,</p>\n<p>vicino a&rsquo; monti de&rsquo; quai prima usc&igrave;o;</p></div>\n\n<div class="stanza"><p>e sotto l&rsquo;ombra de le sacre penne</p>\n<p>govern&ograve; &rsquo;l mondo l&igrave; di mano in mano,</p>\n<p>e, s&igrave; cangiando, in su la mia pervenne.</p></div>\n\n<div class="stanza"><p>Cesare fui e son Iustin&iuml;ano,</p>\n<p>che, per voler del primo amor ch&rsquo;i&rsquo; sento,</p>\n<p>d&rsquo;entro le leggi trassi il troppo e &rsquo;l vano.</p></div>\n\n<div class="stanza"><p>E prima ch&rsquo;io a l&rsquo;ovra fossi attento,</p>\n<p>una natura in Cristo esser, non pi&ugrave;e,</p>\n<p>credea, e di tal fede era contento;</p></div>\n\n<div class="stanza"><p>ma &rsquo;l benedetto Agapito, che fue</p>\n<p>sommo pastore, a la fede sincera</p>\n<p>mi dirizz&ograve; con le parole sue.</p></div>\n\n<div class="stanza"><p>Io li credetti; e ci&ograve; che &rsquo;n sua fede era,</p>\n<p>vegg&rsquo; io or chiaro s&igrave;, come tu vedi</p>\n<p>ogni contradizione e falsa e vera.</p></div>\n\n<div class="stanza"><p>Tosto che con la Chiesa mossi i piedi,</p>\n<p>a Dio per grazia piacque di spirarmi</p>\n<p>l&rsquo;alto lavoro, e tutto &rsquo;n lui mi diedi;</p></div>\n\n<div class="stanza"><p>e al mio Belisar commendai l&rsquo;armi,</p>\n<p>cui la destra del ciel fu s&igrave; congiunta,</p>\n<p>che segno fu ch&rsquo;i&rsquo; dovessi posarmi.</p></div>\n\n<div class="stanza"><p>Or qui a la question prima s&rsquo;appunta</p>\n<p>la mia risposta; ma sua condizione</p>\n<p>mi stringe a seguitare alcuna giunta,</p></div>\n\n<div class="stanza"><p>perch&eacute; tu veggi con quanta ragione</p>\n<p>si move contr&rsquo; al sacrosanto segno</p>\n<p>e chi &rsquo;l s&rsquo;appropria e chi a lui s&rsquo;oppone.</p></div>\n\n<div class="stanza"><p>Vedi quanta virt&ugrave; l&rsquo;ha fatto degno</p>\n<p>di reverenza; e cominci&ograve; da l&rsquo;ora</p>\n<p>che Pallante mor&igrave; per darli regno.</p></div>\n\n<div class="stanza"><p>Tu sai ch&rsquo;el fece in Alba sua dimora</p>\n<p>per trecento anni e oltre, infino al fine</p>\n<p>che i tre a&rsquo; tre pugnar per lui ancora.</p></div>\n\n<div class="stanza"><p>E sai ch&rsquo;el f&eacute; dal mal de le Sabine</p>\n<p>al dolor di Lucrezia in sette regi,</p>\n<p>vincendo intorno le genti vicine.</p></div>\n\n<div class="stanza"><p>Sai quel ch&rsquo;el f&eacute; portato da li egregi</p>\n<p>Romani incontro a Brenno, incontro a Pirro,</p>\n<p>incontro a li altri principi e collegi;</p></div>\n\n<div class="stanza"><p>onde Torquato e Quinzio, che dal cirro</p>\n<p>negletto fu nomato, i Deci e &rsquo; Fabi</p>\n<p>ebber la fama che volontier mirro.</p></div>\n\n<div class="stanza"><p>Esso atterr&ograve; l&rsquo;orgoglio de li Ar&agrave;bi</p>\n<p>che di retro ad Anibale passaro</p>\n<p>l&rsquo;alpestre rocce, Po, di che tu labi.</p></div>\n\n<div class="stanza"><p>Sott&rsquo; esso giovanetti tr&iuml;unfaro</p>\n<p>Scip&iuml;one e Pompeo; e a quel colle</p>\n<p>sotto &rsquo;l qual tu nascesti parve amaro.</p></div>\n\n<div class="stanza"><p>Poi, presso al tempo che tutto &rsquo;l ciel volle</p>\n<p>redur lo mondo a suo modo sereno,</p>\n<p>Cesare per voler di Roma il tolle.</p></div>\n\n<div class="stanza"><p>E quel che f&eacute; da Varo infino a Reno,</p>\n<p>Isara vide ed Era e vide Senna</p>\n<p>e ogne valle onde Rodano &egrave; pieno.</p></div>\n\n<div class="stanza"><p>Quel che f&eacute; poi ch&rsquo;elli usc&igrave; di Ravenna</p>\n<p>e salt&ograve; Rubicon, fu di tal volo,</p>\n<p>che nol seguiteria lingua n&eacute; penna.</p></div>\n\n<div class="stanza"><p>Inver&rsquo; la Spagna rivolse lo stuolo,</p>\n<p>poi ver&rsquo; Durazzo, e Farsalia percosse</p>\n<p>s&igrave; ch&rsquo;al Nil caldo si sent&igrave; del duolo.</p></div>\n\n<div class="stanza"><p>Antandro e Simeonta, onde si mosse,</p>\n<p>rivide e l&agrave; dov&rsquo; Ettore si cuba;</p>\n<p>e mal per Tolomeo poscia si scosse.</p></div>\n\n<div class="stanza"><p>Da indi scese folgorando a Iuba;</p>\n<p>onde si volse nel vostro occidente,</p>\n<p>ove sentia la pompeana tuba.</p></div>\n\n<div class="stanza"><p>Di quel che f&eacute; col baiulo seguente,</p>\n<p>Bruto con Cassio ne l&rsquo;inferno latra,</p>\n<p>e Modena e Perugia fu dolente.</p></div>\n\n<div class="stanza"><p>Piangene ancor la trista Cleopatra,</p>\n<p>che, fuggendoli innanzi, dal colubro</p>\n<p>la morte prese subitana e atra.</p></div>\n\n<div class="stanza"><p>Con costui corse infino al lito rubro;</p>\n<p>con costui puose il mondo in tanta pace,</p>\n<p>che fu serrato a Giano il suo delubro.</p></div>\n\n<div class="stanza"><p>Ma ci&ograve; che &rsquo;l segno che parlar mi face</p>\n<p>fatto avea prima e poi era fatturo</p>\n<p>per lo regno mortal ch&rsquo;a lui soggiace,</p></div>\n\n<div class="stanza"><p>diventa in apparenza poco e scuro,</p>\n<p>se in mano al terzo Cesare si mira</p>\n<p>con occhio chiaro e con affetto puro;</p></div>\n\n<div class="stanza"><p>ch&eacute; la viva giustizia che mi spira,</p>\n<p>li concedette, in mano a quel ch&rsquo;i&rsquo; dico,</p>\n<p>gloria di far vendetta a la sua ira.</p></div>\n\n<div class="stanza"><p>Or qui t&rsquo;ammira in ci&ograve; ch&rsquo;io ti repl&igrave;co:</p>\n<p>poscia con Tito a far vendetta corse</p>\n<p>de la vendetta del peccato antico.</p></div>\n\n<div class="stanza"><p>E quando il dente longobardo morse</p>\n<p>la Santa Chiesa, sotto le sue ali</p>\n<p>Carlo Magno, vincendo, la soccorse.</p></div>\n\n<div class="stanza"><p>Omai puoi giudicar di quei cotali</p>\n<p>ch&rsquo;io accusai di sopra e di lor falli,</p>\n<p>che son cagion di tutti vostri mali.</p></div>\n\n<div class="stanza"><p>L&rsquo;uno al pubblico segno i gigli gialli</p>\n<p>oppone, e l&rsquo;altro appropria quello a parte,</p>\n<p>s&igrave; ch&rsquo;&egrave; forte a veder chi pi&ugrave; si falli.</p></div>\n\n<div class="stanza"><p>Faccian li Ghibellin, faccian lor arte</p>\n<p>sott&rsquo; altro segno, ch&eacute; mal segue quello</p>\n<p>sempre chi la giustizia e lui diparte;</p></div>\n\n<div class="stanza"><p>e non l&rsquo;abbatta esto Carlo novello</p>\n<p>coi Guelfi suoi, ma tema de li artigli</p>\n<p>ch&rsquo;a pi&ugrave; alto leon trasser lo vello.</p></div>\n\n<div class="stanza"><p>Molte f&iuml;ate gi&agrave; pianser li figli</p>\n<p>per la colpa del padre, e non si creda</p>\n<p>che Dio trasmuti l&rsquo;armi per suoi gigli!</p></div>\n\n<div class="stanza"><p>Questa picciola stella si correda</p>\n<p>d&rsquo;i buoni spirti che son stati attivi</p>\n<p>perch&eacute; onore e fama li succeda:</p></div>\n\n<div class="stanza"><p>e quando li disiri poggian quivi,</p>\n<p>s&igrave; disv&iuml;ando, pur convien che i raggi</p>\n<p>del vero amore in s&ugrave; poggin men vivi.</p></div>\n\n<div class="stanza"><p>Ma nel commensurar d&rsquo;i nostri gaggi</p>\n<p>col merto &egrave; parte di nostra letizia,</p>\n<p>perch&eacute; non li vedem minor n&eacute; maggi.</p></div>\n\n<div class="stanza"><p>Quindi addolcisce la viva giustizia</p>\n<p>in noi l&rsquo;affetto s&igrave;, che non si puote</p>\n<p>torcer gi&agrave; mai ad alcuna nequizia.</p></div>\n\n<div class="stanza"><p>Diverse voci fanno dolci note;</p>\n<p>cos&igrave; diversi scanni in nostra vita</p>\n<p>rendon dolce armonia tra queste rote.</p></div>\n\n<div class="stanza"><p>E dentro a la presente margarita</p>\n<p>luce la luce di Romeo, di cui</p>\n<p>fu l&rsquo;ovra grande e bella mal gradita.</p></div>\n\n<div class="stanza"><p>Ma i Provenzai che fecer contra lui</p>\n<p>non hanno riso; e per&ograve; mal cammina</p>\n<p>qual si fa danno del ben fare altrui.</p></div>\n\n<div class="stanza"><p>Quattro figlie ebbe, e ciascuna reina,</p>\n<p>Ramondo Beringhiere, e ci&ograve; li fece</p>\n<p>Romeo, persona um&igrave;le e peregrina.</p></div>\n\n<div class="stanza"><p>E poi il mosser le parole biece</p>\n<p>a dimandar ragione a questo giusto,</p>\n<p>che li assegn&ograve; sette e cinque per diece,</p></div>\n\n<div class="stanza"><p>indi partissi povero e vetusto;</p>\n<p>e se &rsquo;l mondo sapesse il cor ch&rsquo;elli ebbe</p>\n<p>mendicando sua vita a frusto a frusto,</p></div>\n\n<div class="stanza"><p>assai lo loda, e pi&ugrave; lo loderebbe&raquo;.</p></div>','<p class="cantohead">Canto VII</p>\n\n<div class="stanza"><p>&laquo;Osanna, sanctus Deus saba&ograve;th,</p>\n<p>superillustrans claritate tua</p>\n<p>felices ignes horum malac&ograve;th!&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave;, volgendosi a la nota sua,</p>\n<p>fu viso a me cantare essa sustanza,</p>\n<p>sopra la qual doppio lume s&rsquo;addua;</p></div>\n\n<div class="stanza"><p>ed essa e l&rsquo;altre mossero a sua danza,</p>\n<p>e quasi velocissime faville</p>\n<p>mi si velar di s&ugrave;bita distanza.</p></div>\n\n<div class="stanza"><p>Io dubitava e dicea &lsquo;Dille, dille!&rsquo;</p>\n<p>fra me, &lsquo;dille&rsquo; dicea, &lsquo;a la mia donna</p>\n<p>che mi diseta con le dolci stille&rsquo;.</p></div>\n\n<div class="stanza"><p>Ma quella reverenza che s&rsquo;indonna</p>\n<p>di tutto me, pur per Be e per ice,</p>\n<p>mi richinava come l&rsquo;uom ch&rsquo;assonna.</p></div>\n\n<div class="stanza"><p>Poco sofferse me cotal Beatrice</p>\n<p>e cominci&ograve;, raggiandomi d&rsquo;un riso</p>\n<p>tal, che nel foco faria l&rsquo;uom felice:</p></div>\n\n<div class="stanza"><p>&laquo;Secondo mio infallibile avviso,</p>\n<p>come giusta vendetta giustamente</p>\n<p>punita fosse, t&rsquo;ha in pensier miso;</p></div>\n\n<div class="stanza"><p>ma io ti solver&ograve; tosto la mente;</p>\n<p>e tu ascolta, ch&eacute; le mie parole</p>\n<p>di gran sentenza ti faran presente.</p></div>\n\n<div class="stanza"><p>Per non soffrire a la virt&ugrave; che vole</p>\n<p>freno a suo prode, quell&rsquo; uom che non nacque,</p>\n<p>dannando s&eacute;, dann&ograve; tutta sua prole;</p></div>\n\n<div class="stanza"><p>onde l&rsquo;umana specie inferma giacque</p>\n<p>gi&ugrave; per secoli molti in grande errore,</p>\n<p>fin ch&rsquo;al Verbo di Dio discender piacque</p></div>\n\n<div class="stanza"><p>u&rsquo; la natura, che dal suo fattore</p>\n<p>s&rsquo;era allungata, un&igrave; a s&eacute; in persona</p>\n<p>con l&rsquo;atto sol del suo etterno amore.</p></div>\n\n<div class="stanza"><p>Or drizza il viso a quel ch&rsquo;or si ragiona:</p>\n<p>questa natura al suo fattore unita,</p>\n<p>qual fu creata, fu sincera e buona;</p></div>\n\n<div class="stanza"><p>ma per s&eacute; stessa pur fu ella sbandita</p>\n<p>di paradiso, per&ograve; che si torse</p>\n<p>da via di verit&agrave; e da sua vita.</p></div>\n\n<div class="stanza"><p>La pena dunque che la croce porse</p>\n<p>s&rsquo;a la natura assunta si misura,</p>\n<p>nulla gi&agrave; mai s&igrave; giustamente morse;</p></div>\n\n<div class="stanza"><p>e cos&igrave; nulla fu di tanta ingiura,</p>\n<p>guardando a la persona che sofferse,</p>\n<p>in che era contratta tal natura.</p></div>\n\n<div class="stanza"><p>Per&ograve; d&rsquo;un atto uscir cose diverse:</p>\n<p>ch&rsquo;a Dio e a&rsquo; Giudei piacque una morte;</p>\n<p>per lei trem&ograve; la terra e &rsquo;l ciel s&rsquo;aperse.</p></div>\n\n<div class="stanza"><p>Non ti dee oramai parer pi&ugrave; forte,</p>\n<p>quando si dice che giusta vendetta</p>\n<p>poscia vengiata fu da giusta corte.</p></div>\n\n<div class="stanza"><p>Ma io veggi&rsquo; or la tua mente ristretta</p>\n<p>di pensiero in pensier dentro ad un nodo,</p>\n<p>del qual con gran disio solver s&rsquo;aspetta.</p></div>\n\n<div class="stanza"><p>Tu dici: &ldquo;Ben discerno ci&ograve; ch&rsquo;i&rsquo; odo;</p>\n<p>ma perch&eacute; Dio volesse, m&rsquo;&egrave; occulto,</p>\n<p>a nostra redenzion pur questo modo&rdquo;.</p></div>\n\n<div class="stanza"><p>Questo decreto, frate, sta sepulto</p>\n<p>a li occhi di ciascuno il cui ingegno</p>\n<p>ne la fiamma d&rsquo;amor non &egrave; adulto.</p></div>\n\n<div class="stanza"><p>Veramente, per&ograve; ch&rsquo;a questo segno</p>\n<p>molto si mira e poco si discerne,</p>\n<p>dir&ograve; perch&eacute; tal modo fu pi&ugrave; degno.</p></div>\n\n<div class="stanza"><p>La divina bont&agrave;, che da s&eacute; sperne</p>\n<p>ogne livore, ardendo in s&eacute;, sfavilla</p>\n<p>s&igrave; che dispiega le bellezze etterne.</p></div>\n\n<div class="stanza"><p>Ci&ograve; che da lei sanza mezzo distilla</p>\n<p>non ha poi fine, perch&eacute; non si move</p>\n<p>la sua imprenta quand&rsquo; ella sigilla.</p></div>\n\n<div class="stanza"><p>Ci&ograve; che da essa sanza mezzo piove</p>\n<p>libero &egrave; tutto, perch&eacute; non soggiace</p>\n<p>a la virtute de le cose nove.</p></div>\n\n<div class="stanza"><p>Pi&ugrave; l&rsquo;&egrave; conforme, e per&ograve; pi&ugrave; le piace;</p>\n<p>ch&eacute; l&rsquo;ardor santo ch&rsquo;ogne cosa raggia,</p>\n<p>ne la pi&ugrave; somigliante &egrave; pi&ugrave; vivace.</p></div>\n\n<div class="stanza"><p>Di tutte queste dote s&rsquo;avvantaggia</p>\n<p>l&rsquo;umana creatura, e s&rsquo;una manca,</p>\n<p>di sua nobilit&agrave; convien che caggia.</p></div>\n\n<div class="stanza"><p>Solo il peccato &egrave; quel che la disfranca</p>\n<p>e falla dissim&igrave;le al sommo bene,</p>\n<p>per che del lume suo poco s&rsquo;imbianca;</p></div>\n\n<div class="stanza"><p>e in sua dignit&agrave; mai non rivene,</p>\n<p>se non r&iuml;empie, dove colpa v&ograve;ta,</p>\n<p>contra mal dilettar con giuste pene.</p></div>\n\n<div class="stanza"><p>Vostra natura, quando pecc&ograve; tota</p>\n<p>nel seme suo, da queste dignitadi,</p>\n<p>come di paradiso, fu remota;</p></div>\n\n<div class="stanza"><p>n&eacute; ricovrar potiensi, se tu badi</p>\n<p>ben sottilmente, per alcuna via,</p>\n<p>sanza passar per un di questi guadi:</p></div>\n\n<div class="stanza"><p>o che Dio solo per sua cortesia</p>\n<p>dimesso avesse, o che l&rsquo;uom per s&eacute; isso</p>\n<p>avesse sodisfatto a sua follia.</p></div>\n\n<div class="stanza"><p>Ficca mo l&rsquo;occhio per entro l&rsquo;abisso</p>\n<p>de l&rsquo;etterno consiglio, quanto puoi</p>\n<p>al mio parlar distrettamente fisso.</p></div>\n\n<div class="stanza"><p>Non potea l&rsquo;uomo ne&rsquo; termini suoi</p>\n<p>mai sodisfar, per non potere ir giuso</p>\n<p>con umiltate obed&iuml;endo poi,</p></div>\n\n<div class="stanza"><p>quanto disobediendo intese ir suso;</p>\n<p>e questa &egrave; la cagion per che l&rsquo;uom fue</p>\n<p>da poter sodisfar per s&eacute; dischiuso.</p></div>\n\n<div class="stanza"><p>Dunque a Dio convenia con le vie sue</p>\n<p>riparar l&rsquo;omo a sua intera vita,</p>\n<p>dico con l&rsquo;una, o ver con amendue.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; l&rsquo;ovra tanto &egrave; pi&ugrave; gradita</p>\n<p>da l&rsquo;operante, quanto pi&ugrave; appresenta</p>\n<p>de la bont&agrave; del core ond&rsquo; ell&rsquo; &egrave; uscita,</p></div>\n\n<div class="stanza"><p>la divina bont&agrave; che &rsquo;l mondo imprenta,</p>\n<p>di proceder per tutte le sue vie,</p>\n<p>a rilevarvi suso, fu contenta.</p></div>\n\n<div class="stanza"><p>N&eacute; tra l&rsquo;ultima notte e &rsquo;l primo die</p>\n<p>s&igrave; alto o s&igrave; magnifico processo,</p>\n<p>o per l&rsquo;una o per l&rsquo;altra, fu o fie:</p></div>\n\n<div class="stanza"><p>ch&eacute; pi&ugrave; largo fu Dio a dar s&eacute; stesso</p>\n<p>per far l&rsquo;uom sufficiente a rilevarsi,</p>\n<p>che s&rsquo;elli avesse sol da s&eacute; dimesso;</p></div>\n\n<div class="stanza"><p>e tutti li altri modi erano scarsi</p>\n<p>a la giustizia, se &rsquo;l Figliuol di Dio</p>\n<p>non fosse umil&iuml;ato ad incarnarsi.</p></div>\n\n<div class="stanza"><p>Or per empierti bene ogne disio,</p>\n<p>ritorno a dichiararti in alcun loco,</p>\n<p>perch&eacute; tu veggi l&igrave; cos&igrave; com&rsquo; io.</p></div>\n\n<div class="stanza"><p>Tu dici: &ldquo;Io veggio l&rsquo;acqua, io veggio il foco,</p>\n<p>l&rsquo;aere e la terra e tutte lor misture</p>\n<p>venire a corruzione, e durar poco;</p></div>\n\n<div class="stanza"><p>e queste cose pur furon creature;</p>\n<p>per che, se ci&ograve; ch&rsquo;&egrave; detto &egrave; stato vero,</p>\n<p>esser dovrien da corruzion sicure&rdquo;.</p></div>\n\n<div class="stanza"><p>Li angeli, frate, e &rsquo;l paese sincero</p>\n<p>nel qual tu se&rsquo;, dir si posson creati,</p>\n<p>s&igrave; come sono, in loro essere intero;</p></div>\n\n<div class="stanza"><p>ma li alimenti che tu hai nomati</p>\n<p>e quelle cose che di lor si fanno</p>\n<p>da creata virt&ugrave; sono informati.</p></div>\n\n<div class="stanza"><p>Creata fu la materia ch&rsquo;elli hanno;</p>\n<p>creata fu la virt&ugrave; informante</p>\n<p>in queste stelle che &rsquo;ntorno a lor vanno.</p></div>\n\n<div class="stanza"><p>L&rsquo;anima d&rsquo;ogne bruto e de le piante</p>\n<p>di complession potenz&iuml;ata tira</p>\n<p>lo raggio e &rsquo;l moto de le luci sante;</p></div>\n\n<div class="stanza"><p>ma vostra vita sanza mezzo spira</p>\n<p>la somma beninanza, e la innamora</p>\n<p>di s&eacute; s&igrave; che poi sempre la disira.</p></div>\n\n<div class="stanza"><p>E quinci puoi argomentare ancora</p>\n<p>vostra resurrezion, se tu ripensi</p>\n<p>come l&rsquo;umana carne fessi allora</p></div>\n\n<div class="stanza"><p>che li primi parenti intrambo fensi&raquo;.</p></div>','<p class="cantohead">Canto VIII</p>\n\n<div class="stanza"><p>Solea creder lo mondo in suo periclo</p>\n<p>che la bella Ciprigna il folle amore</p>\n<p>raggiasse, volta nel terzo epiciclo;</p></div>\n\n<div class="stanza"><p>per che non pur a lei faceano onore</p>\n<p>di sacrificio e di votivo grido</p>\n<p>le genti antiche ne l&rsquo;antico errore;</p></div>\n\n<div class="stanza"><p>ma D&iuml;one onoravano e Cupido,</p>\n<p>quella per madre sua, questo per figlio,</p>\n<p>e dicean ch&rsquo;el sedette in grembo a Dido;</p></div>\n\n<div class="stanza"><p>e da costei ond&rsquo; io principio piglio</p>\n<p>pigliavano il vocabol de la stella</p>\n<p>che &rsquo;l sol vagheggia or da coppa or da ciglio.</p></div>\n\n<div class="stanza"><p>Io non m&rsquo;accorsi del salire in ella;</p>\n<p>ma d&rsquo;esservi entro mi f&eacute; assai fede</p>\n<p>la donna mia ch&rsquo;i&rsquo; vidi far pi&ugrave; bella.</p></div>\n\n<div class="stanza"><p>E come in fiamma favilla si vede,</p>\n<p>e come in voce voce si discerne,</p>\n<p>quand&rsquo; una &egrave; ferma e altra va e riede,</p></div>\n\n<div class="stanza"><p>vid&rsquo; io in essa luce altre lucerne</p>\n<p>muoversi in giro pi&ugrave; e men correnti,</p>\n<p>al modo, credo, di lor viste interne.</p></div>\n\n<div class="stanza"><p>Di fredda nube non disceser venti,</p>\n<p>o visibili o no, tanto festini,</p>\n<p>che non paressero impediti e lenti</p></div>\n\n<div class="stanza"><p>a chi avesse quei lumi divini</p>\n<p>veduti a noi venir, lasciando il giro</p>\n<p>pria cominciato in li alti Serafini;</p></div>\n\n<div class="stanza"><p>e dentro a quei che pi&ugrave; innanzi appariro</p>\n<p>sonava &lsquo;Osanna&rsquo; s&igrave;, che unque poi</p>\n<p>di r&iuml;udir non fui sanza disiro.</p></div>\n\n<div class="stanza"><p>Indi si fece l&rsquo;un pi&ugrave; presso a noi</p>\n<p>e solo incominci&ograve;: &laquo;Tutti sem presti</p>\n<p>al tuo piacer, perch&eacute; di noi ti gioi.</p></div>\n\n<div class="stanza"><p>Noi ci volgiam coi principi celesti</p>\n<p>d&rsquo;un giro e d&rsquo;un girare e d&rsquo;una sete,</p>\n<p>ai quali tu del mondo gi&agrave; dicesti:</p></div>\n\n<div class="stanza"><p>&lsquo;Voi che &rsquo;ntendendo il terzo ciel movete&rsquo;;</p>\n<p>e sem s&igrave; pien d&rsquo;amor, che, per piacerti,</p>\n<p>non fia men dolce un poco di qu&iuml;ete&raquo;.</p></div>\n\n<div class="stanza"><p>Poscia che li occhi miei si fuoro offerti</p>\n<p>a la mia donna reverenti, ed essa</p>\n<p>fatti li avea di s&eacute; contenti e certi,</p></div>\n\n<div class="stanza"><p>rivolsersi a la luce che promessa</p>\n<p>tanto s&rsquo;avea, e &laquo;Deh, chi siete?&raquo; fue</p>\n<p>la voce mia di grande affetto impressa.</p></div>\n\n<div class="stanza"><p>E quanta e quale vid&rsquo; io lei far pi&ugrave;e</p>\n<p>per allegrezza nova che s&rsquo;accrebbe,</p>\n<p>quando parlai, a l&rsquo;allegrezze sue!</p></div>\n\n<div class="stanza"><p>Cos&igrave; fatta, mi disse: &laquo;Il mondo m&rsquo;ebbe</p>\n<p>gi&ugrave; poco tempo; e se pi&ugrave; fosse stato,</p>\n<p>molto sar&agrave; di mal, che non sarebbe.</p></div>\n\n<div class="stanza"><p>La mia letizia mi ti tien celato</p>\n<p>che mi raggia dintorno e mi nasconde</p>\n<p>quasi animal di sua seta fasciato.</p></div>\n\n<div class="stanza"><p>Assai m&rsquo;amasti, e avesti ben onde;</p>\n<p>che s&rsquo;io fossi gi&ugrave; stato, io ti mostrava</p>\n<p>di mio amor pi&ugrave; oltre che le fronde.</p></div>\n\n<div class="stanza"><p>Quella sinistra riva che si lava</p>\n<p>di Rodano poi ch&rsquo;&egrave; misto con Sorga,</p>\n<p>per suo segnore a tempo m&rsquo;aspettava,</p></div>\n\n<div class="stanza"><p>e quel corno d&rsquo;Ausonia che s&rsquo;imborga</p>\n<p>di Bari e di Gaeta e di Catona,</p>\n<p>da ove Tronto e Verde in mare sgorga.</p></div>\n\n<div class="stanza"><p>Fulgeami gi&agrave; in fronte la corona</p>\n<p>di quella terra che &rsquo;l Danubio riga</p>\n<p>poi che le ripe tedesche abbandona.</p></div>\n\n<div class="stanza"><p>E la bella Trinacria, che caliga</p>\n<p>tra Pachino e Peloro, sopra &rsquo;l golfo</p>\n<p>che riceve da Euro maggior briga,</p></div>\n\n<div class="stanza"><p>non per Tifeo ma per nascente solfo,</p>\n<p>attesi avrebbe li suoi regi ancora,</p>\n<p>nati per me di Carlo e di Ridolfo,</p></div>\n\n<div class="stanza"><p>se mala segnoria, che sempre accora</p>\n<p>li popoli suggetti, non avesse</p>\n<p>mosso Palermo a gridar: &ldquo;Mora, mora!&rdquo;.</p></div>\n\n<div class="stanza"><p>E se mio frate questo antivedesse,</p>\n<p>l&rsquo;avara povert&agrave; di Catalogna</p>\n<p>gi&agrave; fuggeria, perch&eacute; non li offendesse;</p></div>\n\n<div class="stanza"><p>ch&eacute; veramente proveder bisogna</p>\n<p>per lui, o per altrui, s&igrave; ch&rsquo;a sua barca</p>\n<p>carcata pi&ugrave; d&rsquo;incarco non si pogna.</p></div>\n\n<div class="stanza"><p>La sua natura, che di larga parca</p>\n<p>discese, avria mestier di tal milizia</p>\n<p>che non curasse di mettere in arca&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Per&ograve; ch&rsquo;i&rsquo; credo che l&rsquo;alta letizia</p>\n<p>che &rsquo;l tuo parlar m&rsquo;infonde, segnor mio,</p>\n<p>l&agrave; &rsquo;ve ogne ben si termina e s&rsquo;inizia,</p></div>\n\n<div class="stanza"><p>per te si veggia come la vegg&rsquo; io,</p>\n<p>grata m&rsquo;&egrave; pi&ugrave;; e anco quest&rsquo; ho caro</p>\n<p>perch&eacute; &rsquo;l discerni rimirando in Dio.</p></div>\n\n<div class="stanza"><p>Fatto m&rsquo;hai lieto, e cos&igrave; mi fa chiaro,</p>\n<p>poi che, parlando, a dubitar m&rsquo;hai mosso</p>\n<p>com&rsquo; esser pu&ograve;, di dolce seme, amaro&raquo;.</p></div>\n\n<div class="stanza"><p>Questo io a lui; ed elli a me: &laquo;S&rsquo;io posso</p>\n<p>mostrarti un vero, a quel che tu dimandi</p>\n<p>terrai lo viso come tien lo dosso.</p></div>\n\n<div class="stanza"><p>Lo ben che tutto il regno che tu scandi</p>\n<p>volge e contenta, fa esser virtute</p>\n<p>sua provedenza in questi corpi grandi.</p></div>\n\n<div class="stanza"><p>E non pur le nature provedute</p>\n<p>sono in la mente ch&rsquo;&egrave; da s&eacute; perfetta,</p>\n<p>ma esse insieme con la lor salute:</p></div>\n\n<div class="stanza"><p>per che quantunque quest&rsquo; arco saetta</p>\n<p>disposto cade a proveduto fine,</p>\n<p>s&igrave; come cosa in suo segno diretta.</p></div>\n\n<div class="stanza"><p>Se ci&ograve; non fosse, il ciel che tu cammine</p>\n<p>producerebbe s&igrave; li suoi effetti,</p>\n<p>che non sarebbero arti, ma ruine;</p></div>\n\n<div class="stanza"><p>e ci&ograve; esser non pu&ograve;, se li &rsquo;ntelletti</p>\n<p>che muovon queste stelle non son manchi,</p>\n<p>e manco il primo, che non li ha perfetti.</p></div>\n\n<div class="stanza"><p>Vuo&rsquo; tu che questo ver pi&ugrave; ti s&rsquo;imbianchi?&raquo;.</p>\n<p>E io: &laquo;Non gi&agrave;; ch&eacute; impossibil veggio</p>\n<p>che la natura, in quel ch&rsquo;&egrave; uopo, stanchi&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli ancora: &laquo;Or d&igrave;: sarebbe il peggio</p>\n<p>per l&rsquo;omo in terra, se non fosse cive?&raquo;.</p>\n<p>&laquo;S&igrave;&raquo;, rispuos&rsquo; io; &laquo;e qui ragion non cheggio&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;E puot&rsquo; elli esser, se gi&ugrave; non si vive</p>\n<p>diversamente per diversi offici?</p>\n<p>Non, se &rsquo;l maestro vostro ben vi scrive&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; venne deducendo infino a quici;</p>\n<p>poscia conchiuse: &laquo;Dunque esser diverse</p>\n<p>convien di vostri effetti le radici:</p></div>\n\n<div class="stanza"><p>per ch&rsquo;un nasce Solone e altro Serse,</p>\n<p>altro Melchised&egrave;ch e altro quello</p>\n<p>che, volando per l&rsquo;aere, il figlio perse.</p></div>\n\n<div class="stanza"><p>La circular natura, ch&rsquo;&egrave; suggello</p>\n<p>a la cera mortal, fa ben sua arte,</p>\n<p>ma non distingue l&rsquo;un da l&rsquo;altro ostello.</p></div>\n\n<div class="stanza"><p>Quinci addivien ch&rsquo;Esa&ugrave; si diparte</p>\n<p>per seme da Iac&ograve;b; e vien Quirino</p>\n<p>da s&igrave; vil padre, che si rende a Marte.</p></div>\n\n<div class="stanza"><p>Natura generata il suo cammino</p>\n<p>simil farebbe sempre a&rsquo; generanti,</p>\n<p>se non vincesse il proveder divino.</p></div>\n\n<div class="stanza"><p>Or quel che t&rsquo;era dietro t&rsquo;&egrave; davanti:</p>\n<p>ma perch&eacute; sappi che di te mi giova,</p>\n<p>un corollario voglio che t&rsquo;ammanti.</p></div>\n\n<div class="stanza"><p>Sempre natura, se fortuna trova</p>\n<p>discorde a s&eacute;, com&rsquo; ogne altra semente</p>\n<p>fuor di sua reg&iuml;on, fa mala prova.</p></div>\n\n<div class="stanza"><p>E se &rsquo;l mondo l&agrave; gi&ugrave; ponesse mente</p>\n<p>al fondamento che natura pone,</p>\n<p>seguendo lui, avria buona la gente.</p></div>\n\n<div class="stanza"><p>Ma voi torcete a la relig&iuml;one</p>\n<p>tal che fia nato a cignersi la spada,</p>\n<p>e fate re di tal ch&rsquo;&egrave; da sermone;</p></div>\n\n<div class="stanza"><p>onde la traccia vostra &egrave; fuor di strada&raquo;.</p></div>','<p class="cantohead">Canto IX</p>\n\n<div class="stanza"><p>Da poi che Carlo tuo, bella Clemenza,</p>\n<p>m&rsquo;ebbe chiarito, mi narr&ograve; li &rsquo;nganni</p>\n<p>che ricever dovea la sua semenza;</p></div>\n\n<div class="stanza"><p>ma disse: &laquo;Taci e lascia muover li anni&raquo;;</p>\n<p>s&igrave; ch&rsquo;io non posso dir se non che pianto</p>\n<p>giusto verr&agrave; di retro ai vostri danni.</p></div>\n\n<div class="stanza"><p>E gi&agrave; la vita di quel lume santo</p>\n<p>rivolta s&rsquo;era al Sol che la r&iuml;empie</p>\n<p>come quel ben ch&rsquo;a ogne cosa &egrave; tanto.</p></div>\n\n<div class="stanza"><p>Ahi anime ingannate e fatture empie,</p>\n<p>che da s&igrave; fatto ben torcete i cuori,</p>\n<p>drizzando in vanit&agrave; le vostre tempie!</p></div>\n\n<div class="stanza"><p>Ed ecco un altro di quelli splendori</p>\n<p>ver&rsquo; me si fece, e &rsquo;l suo voler piacermi</p>\n<p>significava nel chiarir di fori.</p></div>\n\n<div class="stanza"><p>Li occhi di B&euml;atrice, ch&rsquo;eran fermi</p>\n<p>sovra me, come pria, di caro assenso</p>\n<p>al mio disio certificato fermi.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, metti al mio voler tosto compenso,</p>\n<p>beato spirto&raquo;, dissi, &laquo;e fammi prova</p>\n<p>ch&rsquo;i&rsquo; possa in te refletter quel ch&rsquo;io penso!&raquo;.</p></div>\n\n<div class="stanza"><p>Onde la luce che m&rsquo;era ancor nova,</p>\n<p>del suo profondo, ond&rsquo; ella pria cantava,</p>\n<p>seguette come a cui di ben far giova:</p></div>\n\n<div class="stanza"><p>&laquo;In quella parte de la terra prava</p>\n<p>italica che siede tra R&iuml;alto</p>\n<p>e le fontane di Brenta e di Piava,</p></div>\n\n<div class="stanza"><p>si leva un colle, e non surge molt&rsquo; alto,</p>\n<p>l&agrave; onde scese gi&agrave; una facella</p>\n<p>che fece a la contrada un grande assalto.</p></div>\n\n<div class="stanza"><p>D&rsquo;una radice nacqui e io ed ella:</p>\n<p>Cunizza fui chiamata, e qui refulgo</p>\n<p>perch&eacute; mi vinse il lume d&rsquo;esta stella;</p></div>\n\n<div class="stanza"><p>ma lietamente a me medesma indulgo</p>\n<p>la cagion di mia sorte, e non mi noia;</p>\n<p>che parria forse forte al vostro vulgo.</p></div>\n\n<div class="stanza"><p>Di questa luculenta e cara gioia</p>\n<p>del nostro cielo che pi&ugrave; m&rsquo;&egrave; propinqua,</p>\n<p>grande fama rimase; e pria che moia,</p></div>\n\n<div class="stanza"><p>questo centesimo anno ancor s&rsquo;incinqua:</p>\n<p>vedi se far si dee l&rsquo;omo eccellente,</p>\n<p>s&igrave; ch&rsquo;altra vita la prima relinqua.</p></div>\n\n<div class="stanza"><p>E ci&ograve; non pensa la turba presente</p>\n<p>che Tagliamento e Adice richiude,</p>\n<p>n&eacute; per esser battuta ancor si pente;</p></div>\n\n<div class="stanza"><p>ma tosto fia che Padova al palude</p>\n<p>canger&agrave; l&rsquo;acqua che Vincenza bagna,</p>\n<p>per essere al dover le genti crude;</p></div>\n\n<div class="stanza"><p>e dove Sile e Cagnan s&rsquo;accompagna,</p>\n<p>tal signoreggia e va con la testa alta,</p>\n<p>che gi&agrave; per lui carpir si fa la ragna.</p></div>\n\n<div class="stanza"><p>Pianger&agrave; Feltro ancora la difalta</p>\n<p>de l&rsquo;empio suo pastor, che sar&agrave; sconcia</p>\n<p>s&igrave;, che per simil non s&rsquo;entr&ograve; in malta.</p></div>\n\n<div class="stanza"><p>Troppo sarebbe larga la bigoncia</p>\n<p>che ricevesse il sangue ferrarese,</p>\n<p>e stanco chi &rsquo;l pesasse a oncia a oncia,</p></div>\n\n<div class="stanza"><p>che doner&agrave; questo prete cortese</p>\n<p>per mostrarsi di parte; e cotai doni</p>\n<p>conformi fieno al viver del paese.</p></div>\n\n<div class="stanza"><p>S&ugrave; sono specchi, voi dicete Troni,</p>\n<p>onde refulge a noi Dio giudicante;</p>\n<p>s&igrave; che questi parlar ne paion buoni&raquo;.</p></div>\n\n<div class="stanza"><p>Qui si tacette; e fecemi sembiante</p>\n<p>che fosse ad altro volta, per la rota</p>\n<p>in che si mise com&rsquo; era davante.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra letizia, che m&rsquo;era gi&agrave; nota</p>\n<p>per cara cosa, mi si fece in vista</p>\n<p>qual fin balasso in che lo sol percuota.</p></div>\n\n<div class="stanza"><p>Per letiziar l&agrave; s&ugrave; fulgor s&rsquo;acquista,</p>\n<p>s&igrave; come riso qui; ma gi&ugrave; s&rsquo;abbuia</p>\n<p>l&rsquo;ombra di fuor, come la mente &egrave; trista.</p></div>\n\n<div class="stanza"><p>&laquo;Dio vede tutto, e tuo veder s&rsquo;inluia&raquo;,</p>\n<p>diss&rsquo; io, &laquo;beato spirto, s&igrave; che nulla</p>\n<p>voglia di s&eacute; a te puot&rsquo; esser fuia.</p></div>\n\n<div class="stanza"><p>Dunque la voce tua, che &rsquo;l ciel trastulla</p>\n<p>sempre col canto di quei fuochi pii</p>\n<p>che di sei ali facen la coculla,</p></div>\n\n<div class="stanza"><p>perch&eacute; non satisface a&rsquo; miei disii?</p>\n<p>Gi&agrave; non attendere&rsquo; io tua dimanda,</p>\n<p>s&rsquo;io m&rsquo;intuassi, come tu t&rsquo;inmii&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;La maggior valle in che l&rsquo;acqua si spanda&raquo;,</p>\n<p>incominciaro allor le sue parole,</p>\n<p>&laquo;fuor di quel mar che la terra inghirlanda,</p></div>\n\n<div class="stanza"><p>tra &rsquo; discordanti liti contra &rsquo;l sole</p>\n<p>tanto sen va, che fa merid&iuml;ano</p>\n<p>l&agrave; dove l&rsquo;orizzonte pria far suole.</p></div>\n\n<div class="stanza"><p>Di quella valle fu&rsquo; io litorano</p>\n<p>tra Ebro e Macra, che per cammin corto</p>\n<p>parte lo Genovese dal Toscano.</p></div>\n\n<div class="stanza"><p>Ad un occaso quasi e ad un orto</p>\n<p>Buggea siede e la terra ond&rsquo; io fui,</p>\n<p>che f&eacute; del sangue suo gi&agrave; caldo il porto.</p></div>\n\n<div class="stanza"><p>Folco mi disse quella gente a cui</p>\n<p>fu noto il nome mio; e questo cielo</p>\n<p>di me s&rsquo;imprenta, com&rsquo; io fe&rsquo; di lui;</p></div>\n\n<div class="stanza"><p>ch&eacute; pi&ugrave; non arse la figlia di Belo,</p>\n<p>noiando e a Sicheo e a Creusa,</p>\n<p>di me, infin che si convenne al pelo;</p></div>\n\n<div class="stanza"><p>n&eacute; quella Rodop&euml;a che delusa</p>\n<p>fu da Demofoonte, n&eacute; Alcide</p>\n<p>quando Iole nel core ebbe rinchiusa.</p></div>\n\n<div class="stanza"><p>Non per&ograve; qui si pente, ma si ride,</p>\n<p>non de la colpa, ch&rsquo;a mente non torna,</p>\n<p>ma del valor ch&rsquo;ordin&ograve; e provide.</p></div>\n\n<div class="stanza"><p>Qui si rimira ne l&rsquo;arte ch&rsquo;addorna</p>\n<p>cotanto affetto, e discernesi &rsquo;l bene</p>\n<p>per che &rsquo;l mondo di s&ugrave; quel di gi&ugrave; torna.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; tutte le tue voglie piene</p>\n<p>ten porti che son nate in questa spera,</p>\n<p>proceder ancor oltre mi convene.</p></div>\n\n<div class="stanza"><p>Tu vuo&rsquo; saper chi &egrave; in questa lumera</p>\n<p>che qui appresso me cos&igrave; scintilla</p>\n<p>come raggio di sole in acqua mera.</p></div>\n\n<div class="stanza"><p>Or sappi che l&agrave; entro si tranquilla</p>\n<p>Raab; e a nostr&rsquo; ordine congiunta,</p>\n<p>di lei nel sommo grado si sigilla.</p></div>\n\n<div class="stanza"><p>Da questo cielo, in cui l&rsquo;ombra s&rsquo;appunta</p>\n<p>che &rsquo;l vostro mondo face, pria ch&rsquo;altr&rsquo; alma</p>\n<p>del tr&iuml;unfo di Cristo fu assunta.</p></div>\n\n<div class="stanza"><p>Ben si convenne lei lasciar per palma</p>\n<p>in alcun cielo de l&rsquo;alta vittoria</p>\n<p>che s&rsquo;acquist&ograve; con l&rsquo;una e l&rsquo;altra palma,</p></div>\n\n<div class="stanza"><p>perch&rsquo; ella favor&ograve; la prima gloria</p>\n<p>di Ios&uuml;&egrave; in su la Terra Santa,</p>\n<p>che poco tocca al papa la memoria.</p></div>\n\n<div class="stanza"><p>La tua citt&agrave;, che di colui &egrave; pianta</p>\n<p>che pria volse le spalle al suo fattore</p>\n<p>e di cui &egrave; la &rsquo;nvidia tanto pianta,</p></div>\n\n<div class="stanza"><p>produce e spande il maladetto fiore</p>\n<p>c&rsquo;ha disv&iuml;ate le pecore e li agni,</p>\n<p>per&ograve; che fatto ha lupo del pastore.</p></div>\n\n<div class="stanza"><p>Per questo l&rsquo;Evangelio e i dottor magni</p>\n<p>son derelitti, e solo ai Decretali</p>\n<p>si studia, s&igrave; che pare a&rsquo; lor vivagni.</p></div>\n\n<div class="stanza"><p>A questo intende il papa e &rsquo; cardinali;</p>\n<p>non vanno i lor pensieri a Nazarette,</p>\n<p>l&agrave; dove Gabr&iuml;ello aperse l&rsquo;ali.</p></div>\n\n<div class="stanza"><p>Ma Vaticano e l&rsquo;altre parti elette</p>\n<p>di Roma che son state cimitero</p>\n<p>a la milizia che Pietro seguette,</p></div>\n\n<div class="stanza"><p>tosto libere fien de l&rsquo;avoltero&raquo;.</p></div>','<p class="cantohead">Canto X</p>\n\n<div class="stanza"><p>Guardando nel suo Figlio con l&rsquo;Amore</p>\n<p>che l&rsquo;uno e l&rsquo;altro etternalmente spira,</p>\n<p>lo primo e ineffabile Valore</p></div>\n\n<div class="stanza"><p>quanto per mente e per loco si gira</p>\n<p>con tant&rsquo; ordine f&eacute;, ch&rsquo;esser non puote</p>\n<p>sanza gustar di lui chi ci&ograve; rimira.</p></div>\n\n<div class="stanza"><p>Leva dunque, lettore, a l&rsquo;alte rote</p>\n<p>meco la vista, dritto a quella parte</p>\n<p>dove l&rsquo;un moto e l&rsquo;altro si percuote;</p></div>\n\n<div class="stanza"><p>e l&igrave; comincia a vagheggiar ne l&rsquo;arte</p>\n<p>di quel maestro che dentro a s&eacute; l&rsquo;ama,</p>\n<p>tanto che mai da lei l&rsquo;occhio non parte.</p></div>\n\n<div class="stanza"><p>Vedi come da indi si dirama</p>\n<p>l&rsquo;oblico cerchio che i pianeti porta,</p>\n<p>per sodisfare al mondo che li chiama.</p></div>\n\n<div class="stanza"><p>Che se la strada lor non fosse torta,</p>\n<p>molta virt&ugrave; nel ciel sarebbe in vano,</p>\n<p>e quasi ogne potenza qua gi&ugrave; morta;</p></div>\n\n<div class="stanza"><p>e se dal dritto pi&ugrave; o men lontano</p>\n<p>fosse &rsquo;l partire, assai sarebbe manco</p>\n<p>e gi&ugrave; e s&ugrave; de l&rsquo;ordine mondano.</p></div>\n\n<div class="stanza"><p>Or ti riman, lettor, sovra &rsquo;l tuo banco,</p>\n<p>dietro pensando a ci&ograve; che si preliba,</p>\n<p>s&rsquo;esser vuoi lieto assai prima che stanco.</p></div>\n\n<div class="stanza"><p>Messo t&rsquo;ho innanzi: omai per te ti ciba;</p>\n<p>ch&eacute; a s&eacute; torce tutta la mia cura</p>\n<p>quella materia ond&rsquo; io son fatto scriba.</p></div>\n\n<div class="stanza"><p>Lo ministro maggior de la natura,</p>\n<p>che del valor del ciel lo mondo imprenta</p>\n<p>e col suo lume il tempo ne misura,</p></div>\n\n<div class="stanza"><p>con quella parte che s&ugrave; si rammenta</p>\n<p>congiunto, si girava per le spire</p>\n<p>in che pi&ugrave; tosto ognora s&rsquo;appresenta;</p></div>\n\n<div class="stanza"><p>e io era con lui; ma del salire</p>\n<p>non m&rsquo;accors&rsquo; io, se non com&rsquo; uom s&rsquo;accorge,</p>\n<p>anzi &rsquo;l primo pensier, del suo venire.</p></div>\n\n<div class="stanza"><p>&Egrave; B&euml;atrice quella che s&igrave; scorge</p>\n<p>di bene in meglio, s&igrave; subitamente</p>\n<p>che l&rsquo;atto suo per tempo non si sporge.</p></div>\n\n<div class="stanza"><p>Quant&rsquo; esser convenia da s&eacute; lucente</p>\n<p>quel ch&rsquo;era dentro al sol dov&rsquo; io entra&rsquo;mi,</p>\n<p>non per color, ma per lume parvente!</p></div>\n\n<div class="stanza"><p>Perch&rsquo; io lo &rsquo;ngegno e l&rsquo;arte e l&rsquo;uso chiami,</p>\n<p>s&igrave; nol direi che mai s&rsquo;imaginasse;</p>\n<p>ma creder puossi e di veder si brami.</p></div>\n\n<div class="stanza"><p>E se le fantasie nostre son basse</p>\n<p>a tanta altezza, non &egrave; maraviglia;</p>\n<p>ch&eacute; sopra &rsquo;l sol non fu occhio ch&rsquo;andasse.</p></div>\n\n<div class="stanza"><p>Tal era quivi la quarta famiglia</p>\n<p>de l&rsquo;alto Padre, che sempre la sazia,</p>\n<p>mostrando come spira e come figlia.</p></div>\n\n<div class="stanza"><p>E B&euml;atrice cominci&ograve;: &laquo;Ringrazia,</p>\n<p>ringrazia il Sol de li angeli, ch&rsquo;a questo</p>\n<p>sensibil t&rsquo;ha levato per sua grazia&raquo;.</p></div>\n\n<div class="stanza"><p>Cor di mortal non fu mai s&igrave; digesto</p>\n<p>a divozione e a rendersi a Dio</p>\n<p>con tutto &rsquo;l suo gradir cotanto presto,</p></div>\n\n<div class="stanza"><p>come a quelle parole mi fec&rsquo; io;</p>\n<p>e s&igrave; tutto &rsquo;l mio amore in lui si mise,</p>\n<p>che B&euml;atrice ecliss&ograve; ne l&rsquo;oblio.</p></div>\n\n<div class="stanza"><p>Non le dispiacque; ma s&igrave; se ne rise,</p>\n<p>che lo splendor de li occhi suoi ridenti</p>\n<p>mia mente unita in pi&ugrave; cose divise.</p></div>\n\n<div class="stanza"><p>Io vidi pi&ugrave; folg&oacute;r vivi e vincenti</p>\n<p>far di noi centro e di s&eacute; far corona,</p>\n<p>pi&ugrave; dolci in voce che in vista lucenti:</p></div>\n\n<div class="stanza"><p>cos&igrave; cinger la figlia di Latona</p>\n<p>vedem talvolta, quando l&rsquo;aere &egrave; pregno,</p>\n<p>s&igrave; che ritenga il fil che fa la zona.</p></div>\n\n<div class="stanza"><p>Ne la corte del cielo, ond&rsquo; io rivegno,</p>\n<p>si trovan molte gioie care e belle</p>\n<p>tanto che non si posson trar del regno;</p></div>\n\n<div class="stanza"><p>e &rsquo;l canto di quei lumi era di quelle;</p>\n<p>chi non s&rsquo;impenna s&igrave; che l&agrave; s&ugrave; voli,</p>\n<p>dal muto aspetti quindi le novelle.</p></div>\n\n<div class="stanza"><p>Poi, s&igrave; cantando, quelli ardenti soli</p>\n<p>si fuor girati intorno a noi tre volte,</p>\n<p>come stelle vicine a&rsquo; fermi poli,</p></div>\n\n<div class="stanza"><p>donne mi parver, non da ballo sciolte,</p>\n<p>ma che s&rsquo;arrestin tacite, ascoltando</p>\n<p>fin che le nove note hanno ricolte.</p></div>\n\n<div class="stanza"><p>E dentro a l&rsquo;un senti&rsquo; cominciar: &laquo;Quando</p>\n<p>lo raggio de la grazia, onde s&rsquo;accende</p>\n<p>verace amore e che poi cresce amando,</p></div>\n\n<div class="stanza"><p>multiplicato in te tanto resplende,</p>\n<p>che ti conduce su per quella scala</p>\n<p>u&rsquo; sanza risalir nessun discende;</p></div>\n\n<div class="stanza"><p>qual ti negasse il vin de la sua fiala</p>\n<p>per la tua sete, in libert&agrave; non fora</p>\n<p>se non com&rsquo; acqua ch&rsquo;al mar non si cala.</p></div>\n\n<div class="stanza"><p>Tu vuo&rsquo; saper di quai piante s&rsquo;infiora</p>\n<p>questa ghirlanda che &rsquo;ntorno vagheggia</p>\n<p>la bella donna ch&rsquo;al ciel t&rsquo;avvalora.</p></div>\n\n<div class="stanza"><p>Io fui de li agni de la santa greggia</p>\n<p>che Domenico mena per cammino</p>\n<p>u&rsquo; ben s&rsquo;impingua se non si vaneggia.</p></div>\n\n<div class="stanza"><p>Questi che m&rsquo;&egrave; a destra pi&ugrave; vicino,</p>\n<p>frate e maestro fummi, ed esso Alberto</p>\n<p>&egrave; di Cologna, e io Thomas d&rsquo;Aquino.</p></div>\n\n<div class="stanza"><p>Se s&igrave; di tutti li altri esser vuo&rsquo; certo,</p>\n<p>di retro al mio parlar ten vien col viso</p>\n<p>girando su per lo beato serto.</p></div>\n\n<div class="stanza"><p>Quell&rsquo; altro fiammeggiare esce del riso</p>\n<p>di Graz&iuml;an, che l&rsquo;uno e l&rsquo;altro foro</p>\n<p>aiut&ograve; s&igrave; che piace in paradiso.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro ch&rsquo;appresso addorna il nostro coro,</p>\n<p>quel Pietro fu che con la poverella</p>\n<p>offerse a Santa Chiesa suo tesoro.</p></div>\n\n<div class="stanza"><p>La quinta luce, ch&rsquo;&egrave; tra noi pi&ugrave; bella,</p>\n<p>spira di tale amor, che tutto &rsquo;l mondo</p>\n<p>l&agrave; gi&ugrave; ne gola di saper novella:</p></div>\n\n<div class="stanza"><p>entro v&rsquo;&egrave; l&rsquo;alta mente u&rsquo; s&igrave; profondo</p>\n<p>saver fu messo, che, se &rsquo;l vero &egrave; vero,</p>\n<p>a veder tanto non surse il secondo.</p></div>\n\n<div class="stanza"><p>Appresso vedi il lume di quel cero</p>\n<p>che gi&ugrave; in carne pi&ugrave; a dentro vide</p>\n<p>l&rsquo;angelica natura e &rsquo;l ministero.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;altra piccioletta luce ride</p>\n<p>quello avvocato de&rsquo; tempi cristiani</p>\n<p>del cui latino Augustin si provide.</p></div>\n\n<div class="stanza"><p>Or se tu l&rsquo;occhio de la mente trani</p>\n<p>di luce in luce dietro a le mie lode,</p>\n<p>gi&agrave; de l&rsquo;ottava con sete rimani.</p></div>\n\n<div class="stanza"><p>Per vedere ogne ben dentro vi gode</p>\n<p>l&rsquo;anima santa che &rsquo;l mondo fallace</p>\n<p>fa manifesto a chi di lei ben ode.</p></div>\n\n<div class="stanza"><p>Lo corpo ond&rsquo; ella fu cacciata giace</p>\n<p>giuso in Cieldauro; ed essa da martiro</p>\n<p>e da essilio venne a questa pace.</p></div>\n\n<div class="stanza"><p>Vedi oltre fiammeggiar l&rsquo;ardente spiro</p>\n<p>d&rsquo;Isidoro, di Beda e di Riccardo,</p>\n<p>che a considerar fu pi&ugrave; che viro.</p></div>\n\n<div class="stanza"><p>Questi onde a me ritorna il tuo riguardo,</p>\n<p>&egrave; &rsquo;l lume d&rsquo;uno spirto che &rsquo;n pensieri</p>\n<p>gravi a morir li parve venir tardo:</p></div>\n\n<div class="stanza"><p>essa &egrave; la luce etterna di Sigieri,</p>\n<p>che, leggendo nel Vico de li Strami,</p>\n<p>silogizz&ograve; invid&iuml;osi veri&raquo;.</p></div>\n\n<div class="stanza"><p>Indi, come orologio che ne chiami</p>\n<p>ne l&rsquo;ora che la sposa di Dio surge</p>\n<p>a mattinar lo sposo perch&eacute; l&rsquo;ami,</p></div>\n\n<div class="stanza"><p>che l&rsquo;una parte e l&rsquo;altra tira e urge,</p>\n<p>tin tin sonando con s&igrave; dolce nota,</p>\n<p>che &rsquo;l ben disposto spirto d&rsquo;amor turge;</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; &iuml;o la gloriosa rota</p>\n<p>muoversi e render voce a voce in tempra</p>\n<p>e in dolcezza ch&rsquo;esser non p&ograve; nota</p></div>\n\n<div class="stanza"><p>se non col&agrave; dove gioir s&rsquo;insempra.</p></div>','<p class="cantohead">Canto XI</p>\n\n<div class="stanza"><p>O insensata cura de&rsquo; mortali,</p>\n<p>quanto son difettivi silogismi</p>\n<p>quei che ti fanno in basso batter l&rsquo;ali!</p></div>\n\n<div class="stanza"><p>Chi dietro a iura e chi ad amforismi</p>\n<p>sen giva, e chi seguendo sacerdozio,</p>\n<p>e chi regnar per forza o per sofismi,</p></div>\n\n<div class="stanza"><p>e chi rubare e chi civil negozio,</p>\n<p>chi nel diletto de la carne involto</p>\n<p>s&rsquo;affaticava e chi si dava a l&rsquo;ozio,</p></div>\n\n<div class="stanza"><p>quando, da tutte queste cose sciolto,</p>\n<p>con B&euml;atrice m&rsquo;era suso in cielo</p>\n<p>cotanto glor&iuml;osamente accolto.</p></div>\n\n<div class="stanza"><p>Poi che ciascuno fu tornato ne lo</p>\n<p>punto del cerchio in che avanti s&rsquo;era,</p>\n<p>fermossi, come a candellier candelo.</p></div>\n\n<div class="stanza"><p>E io senti&rsquo; dentro a quella lumera</p>\n<p>che pria m&rsquo;avea parlato, sorridendo</p>\n<p>incominciar, faccendosi pi&ugrave; mera:</p></div>\n\n<div class="stanza"><p>&laquo;Cos&igrave; com&rsquo; io del suo raggio resplendo,</p>\n<p>s&igrave;, riguardando ne la luce etterna,</p>\n<p>li tuoi pensieri onde cagioni apprendo.</p></div>\n\n<div class="stanza"><p>Tu dubbi, e hai voler che si ricerna</p>\n<p>in s&igrave; aperta e &rsquo;n s&igrave; distesa lingua</p>\n<p>lo dicer mio, ch&rsquo;al tuo sentir si sterna,</p></div>\n\n<div class="stanza"><p>ove dinanzi dissi: &ldquo;U&rsquo; ben s&rsquo;impingua&rdquo;,</p>\n<p>e l&agrave; u&rsquo; dissi: &ldquo;Non nacque il secondo&rdquo;;</p>\n<p>e qui &egrave; uopo che ben si distingua.</p></div>\n\n<div class="stanza"><p>La provedenza, che governa il mondo</p>\n<p>con quel consiglio nel quale ogne aspetto</p>\n<p>creato &egrave; vinto pria che vada al fondo,</p></div>\n\n<div class="stanza"><p>per&ograve; che andasse ver&rsquo; lo suo diletto</p>\n<p>la sposa di colui ch&rsquo;ad alte grida</p>\n<p>dispos&ograve; lei col sangue benedetto,</p></div>\n\n<div class="stanza"><p>in s&eacute; sicura e anche a lui pi&ugrave; fida,</p>\n<p>due principi ordin&ograve; in suo favore,</p>\n<p>che quinci e quindi le fosser per guida.</p></div>\n\n<div class="stanza"><p>L&rsquo;un fu tutto serafico in ardore;</p>\n<p>l&rsquo;altro per sap&iuml;enza in terra fue</p>\n<p>di cherubica luce uno splendore.</p></div>\n\n<div class="stanza"><p>De l&rsquo;un dir&ograve;, per&ograve; che d&rsquo;amendue</p>\n<p>si dice l&rsquo;un pregiando, qual ch&rsquo;om prende,</p>\n<p>perch&rsquo; ad un fine fur l&rsquo;opere sue.</p></div>\n\n<div class="stanza"><p>Intra Tupino e l&rsquo;acqua che discende</p>\n<p>del colle eletto dal beato Ubaldo,</p>\n<p>fertile costa d&rsquo;alto monte pende,</p></div>\n\n<div class="stanza"><p>onde Perugia sente freddo e caldo</p>\n<p>da Porta Sole; e di rietro le piange</p>\n<p>per grave giogo Nocera con Gualdo.</p></div>\n\n<div class="stanza"><p>Di questa costa, l&agrave; dov&rsquo; ella frange</p>\n<p>pi&ugrave; sua rattezza, nacque al mondo un sole,</p>\n<p>come fa questo talvolta di Gange.</p></div>\n\n<div class="stanza"><p>Per&ograve; chi d&rsquo;esso loco fa parole,</p>\n<p>non dica Ascesi, ch&eacute; direbbe corto,</p>\n<p>ma Or&iuml;ente, se proprio dir vuole.</p></div>\n\n<div class="stanza"><p>Non era ancor molto lontan da l&rsquo;orto,</p>\n<p>ch&rsquo;el cominci&ograve; a far sentir la terra</p>\n<p>de la sua gran virtute alcun conforto;</p></div>\n\n<div class="stanza"><p>ch&eacute; per tal donna, giovinetto, in guerra</p>\n<p>del padre corse, a cui, come a la morte,</p>\n<p>la porta del piacer nessun diserra;</p></div>\n\n<div class="stanza"><p>e dinanzi a la sua spirital corte</p>\n<p>et coram patre le si fece unito;</p>\n<p>poscia di d&igrave; in d&igrave; l&rsquo;am&ograve; pi&ugrave; forte.</p></div>\n\n<div class="stanza"><p>Questa, privata del primo marito,</p>\n<p>millecent&rsquo; anni e pi&ugrave; dispetta e scura</p>\n<p>fino a costui si stette sanza invito;</p></div>\n\n<div class="stanza"><p>n&eacute; valse udir che la trov&ograve; sicura</p>\n<p>con Amiclate, al suon de la sua voce,</p>\n<p>colui ch&rsquo;a tutto &rsquo;l mondo f&eacute; paura;</p></div>\n\n<div class="stanza"><p>n&eacute; valse esser costante n&eacute; feroce,</p>\n<p>s&igrave; che, dove Maria rimase giuso,</p>\n<p>ella con Cristo pianse in su la croce.</p></div>\n\n<div class="stanza"><p>Ma perch&rsquo; io non proceda troppo chiuso,</p>\n<p>Francesco e Povert&agrave; per questi amanti</p>\n<p>prendi oramai nel mio parlar diffuso.</p></div>\n\n<div class="stanza"><p>La lor concordia e i lor lieti sembianti,</p>\n<p>amore e maraviglia e dolce sguardo</p>\n<p>facieno esser cagion di pensier santi;</p></div>\n\n<div class="stanza"><p>tanto che &rsquo;l venerabile Bernardo</p>\n<p>si scalz&ograve; prima, e dietro a tanta pace</p>\n<p>corse e, correndo, li parve esser tardo.</p></div>\n\n<div class="stanza"><p>Oh ignota ricchezza! oh ben ferace!</p>\n<p>Scalzasi Egidio, scalzasi Silvestro</p>\n<p>dietro a lo sposo, s&igrave; la sposa piace.</p></div>\n\n<div class="stanza"><p>Indi sen va quel padre e quel maestro</p>\n<p>con la sua donna e con quella famiglia</p>\n<p>che gi&agrave; legava l&rsquo;umile capestro.</p></div>\n\n<div class="stanza"><p>N&eacute; li grav&ograve; vilt&agrave; di cuor le ciglia</p>\n<p>per esser fi&rsquo; di Pietro Bernardone,</p>\n<p>n&eacute; per parer dispetto a maraviglia;</p></div>\n\n<div class="stanza"><p>ma regalmente sua dura intenzione</p>\n<p>ad Innocenzio aperse, e da lui ebbe</p>\n<p>primo sigillo a sua relig&iuml;one.</p></div>\n\n<div class="stanza"><p>Poi che la gente poverella crebbe</p>\n<p>dietro a costui, la cui mirabil vita</p>\n<p>meglio in gloria del ciel si canterebbe,</p></div>\n\n<div class="stanza"><p>di seconda corona redimita</p>\n<p>fu per Onorio da l&rsquo;Etterno Spiro</p>\n<p>la santa voglia d&rsquo;esto archimandrita.</p></div>\n\n<div class="stanza"><p>E poi che, per la sete del martiro,</p>\n<p>ne la presenza del Soldan superba</p>\n<p>predic&ograve; Cristo e li altri che &rsquo;l seguiro,</p></div>\n\n<div class="stanza"><p>e per trovare a conversione acerba</p>\n<p>troppo la gente e per non stare indarno,</p>\n<p>redissi al frutto de l&rsquo;italica erba,</p></div>\n\n<div class="stanza"><p>nel crudo sasso intra Tevero e Arno</p>\n<p>da Cristo prese l&rsquo;ultimo sigillo,</p>\n<p>che le sue membra due anni portarno.</p></div>\n\n<div class="stanza"><p>Quando a colui ch&rsquo;a tanto ben sortillo</p>\n<p>piacque di trarlo suso a la mercede</p>\n<p>ch&rsquo;el merit&ograve; nel suo farsi pusillo,</p></div>\n\n<div class="stanza"><p>a&rsquo; frati suoi, s&igrave; com&rsquo; a giuste rede,</p>\n<p>raccomand&ograve; la donna sua pi&ugrave; cara,</p>\n<p>e comand&ograve; che l&rsquo;amassero a fede;</p></div>\n\n<div class="stanza"><p>e del suo grembo l&rsquo;anima preclara</p>\n<p>mover si volle, tornando al suo regno,</p>\n<p>e al suo corpo non volle altra bara.</p></div>\n\n<div class="stanza"><p>Pensa oramai qual fu colui che degno</p>\n<p>collega fu a mantener la barca</p>\n<p>di Pietro in alto mar per dritto segno;</p></div>\n\n<div class="stanza"><p>e questo fu il nostro patr&iuml;arca;</p>\n<p>per che qual segue lui, com&rsquo; el comanda,</p>\n<p>discerner puoi che buone merce carca.</p></div>\n\n<div class="stanza"><p>Ma &rsquo;l suo pecuglio di nova vivanda</p>\n<p>&egrave; fatto ghiotto, s&igrave; ch&rsquo;esser non puote</p>\n<p>che per diversi salti non si spanda;</p></div>\n\n<div class="stanza"><p>e quanto le sue pecore remote</p>\n<p>e vagabunde pi&ugrave; da esso vanno,</p>\n<p>pi&ugrave; tornano a l&rsquo;ovil di latte v&ograve;te.</p></div>\n\n<div class="stanza"><p>Ben son di quelle che temono &rsquo;l danno</p>\n<p>e stringonsi al pastor; ma son s&igrave; poche,</p>\n<p>che le cappe fornisce poco panno.</p></div>\n\n<div class="stanza"><p>Or, se le mie parole non son fioche,</p>\n<p>se la tua aud&iuml;enza &egrave; stata attenta,</p>\n<p>se ci&ograve; ch&rsquo;&egrave; detto a la mente revoche,</p></div>\n\n<div class="stanza"><p>in parte fia la tua voglia contenta,</p>\n<p>perch&eacute; vedrai la pianta onde si scheggia,</p>\n<p>e vedra&rsquo; il corr&egrave;gger che argomenta</p></div>\n\n<div class="stanza"><p>&ldquo;U&rsquo; ben s&rsquo;impingua, se non si vaneggia&rdquo;&raquo;.</p></div>','<p class="cantohead">Canto XII</p>\n\n<div class="stanza"><p>S&igrave; tosto come l&rsquo;ultima parola</p>\n<p>la benedetta fiamma per dir tolse,</p>\n<p>a rotar cominci&ograve; la santa mola;</p></div>\n\n<div class="stanza"><p>e nel suo giro tutta non si volse</p>\n<p>prima ch&rsquo;un&rsquo;altra di cerchio la chiuse,</p>\n<p>e moto a moto e canto a canto colse;</p></div>\n\n<div class="stanza"><p>canto che tanto vince nostre muse,</p>\n<p>nostre serene in quelle dolci tube,</p>\n<p>quanto primo splendor quel ch&rsquo;e&rsquo; refuse.</p></div>\n\n<div class="stanza"><p>Come si volgon per tenera nube</p>\n<p>due archi paralelli e concolori,</p>\n<p>quando Iunone a sua ancella iube,</p></div>\n\n<div class="stanza"><p>nascendo di quel d&rsquo;entro quel di fori,</p>\n<p>a guisa del parlar di quella vaga</p>\n<p>ch&rsquo;amor consunse come sol vapori,</p></div>\n\n<div class="stanza"><p>e fanno qui la gente esser presaga,</p>\n<p>per lo patto che Dio con No&egrave; puose,</p>\n<p>del mondo che gi&agrave; mai pi&ugrave; non s&rsquo;allaga:</p></div>\n\n<div class="stanza"><p>cos&igrave; di quelle sempiterne rose</p>\n<p>volgiensi circa noi le due ghirlande,</p>\n<p>e s&igrave; l&rsquo;estrema a l&rsquo;intima rispuose.</p></div>\n\n<div class="stanza"><p>Poi che &rsquo;l tripudio e l&rsquo;altra festa grande,</p>\n<p>s&igrave; del cantare e s&igrave; del fiammeggiarsi</p>\n<p>luce con luce gaud&iuml;ose e blande,</p></div>\n\n<div class="stanza"><p>insieme a punto e a voler quetarsi,</p>\n<p>pur come li occhi ch&rsquo;al piacer che i move</p>\n<p>conviene insieme chiudere e levarsi;</p></div>\n\n<div class="stanza"><p>del cor de l&rsquo;una de le luci nove</p>\n<p>si mosse voce, che l&rsquo;ago a la stella</p>\n<p>parer mi fece in volgermi al suo dove;</p></div>\n\n<div class="stanza"><p>e cominci&ograve;: &laquo;L&rsquo;amor che mi fa bella</p>\n<p>mi tragge a ragionar de l&rsquo;altro duca</p>\n<p>per cui del mio s&igrave; ben ci si favella.</p></div>\n\n<div class="stanza"><p>Degno &egrave; che, dov&rsquo; &egrave; l&rsquo;un, l&rsquo;altro s&rsquo;induca:</p>\n<p>s&igrave; che, com&rsquo; elli ad una militaro,</p>\n<p>cos&igrave; la gloria loro insieme luca.</p></div>\n\n<div class="stanza"><p>L&rsquo;essercito di Cristo, che s&igrave; caro</p>\n<p>cost&ograve; a r&iuml;armar, dietro a la &rsquo;nsegna</p>\n<p>si movea tardo, sospeccioso e raro,</p></div>\n\n<div class="stanza"><p>quando lo &rsquo;mperador che sempre regna</p>\n<p>provide a la milizia, ch&rsquo;era in forse,</p>\n<p>per sola grazia, non per esser degna;</p></div>\n\n<div class="stanza"><p>e, come &egrave; detto, a sua sposa soccorse</p>\n<p>con due campioni, al cui fare, al cui dire</p>\n<p>lo popol disv&iuml;ato si raccorse.</p></div>\n\n<div class="stanza"><p>In quella parte ove surge ad aprire</p>\n<p>Zefiro dolce le novelle fronde</p>\n<p>di che si vede Europa rivestire,</p></div>\n\n<div class="stanza"><p>non molto lungi al percuoter de l&rsquo;onde</p>\n<p>dietro a le quali, per la lunga foga,</p>\n<p>lo sol talvolta ad ogne uom si nasconde,</p></div>\n\n<div class="stanza"><p>siede la fortunata Calaroga</p>\n<p>sotto la protezion del grande scudo</p>\n<p>in che soggiace il leone e soggioga:</p></div>\n\n<div class="stanza"><p>dentro vi nacque l&rsquo;amoroso drudo</p>\n<p>de la fede cristiana, il santo atleta</p>\n<p>benigno a&rsquo; suoi e a&rsquo; nemici crudo;</p></div>\n\n<div class="stanza"><p>e come fu creata, fu repleta</p>\n<p>s&igrave; la sua mente di viva vertute</p>\n<p>che, ne la madre, lei fece profeta.</p></div>\n\n<div class="stanza"><p>Poi che le sponsalizie fuor compiute</p>\n<p>al sacro fonte intra lui e la Fede,</p>\n<p>u&rsquo; si dotar di mut&uuml;a salute,</p></div>\n\n<div class="stanza"><p>la donna che per lui l&rsquo;assenso diede,</p>\n<p>vide nel sonno il mirabile frutto</p>\n<p>ch&rsquo;uscir dovea di lui e de le rede;</p></div>\n\n<div class="stanza"><p>e perch&eacute; fosse qual era in costrutto,</p>\n<p>quinci si mosse spirito a nomarlo</p>\n<p>del possessivo di cui era tutto.</p></div>\n\n<div class="stanza"><p>Domenico fu detto; e io ne parlo</p>\n<p>s&igrave; come de l&rsquo;agricola che Cristo</p>\n<p>elesse a l&rsquo;orto suo per aiutarlo.</p></div>\n\n<div class="stanza"><p>Ben parve messo e famigliar di Cristo:</p>\n<p>che &rsquo;l primo amor che &rsquo;n lui fu manifesto,</p>\n<p>fu al primo consiglio che di&egrave; Cristo.</p></div>\n\n<div class="stanza"><p>Spesse f&iuml;ate fu tacito e desto</p>\n<p>trovato in terra da la sua nutrice,</p>\n<p>come dicesse: &lsquo;Io son venuto a questo&rsquo;.</p></div>\n\n<div class="stanza"><p>Oh padre suo veramente Felice!</p>\n<p>oh madre sua veramente Giovanna,</p>\n<p>se, interpretata, val come si dice!</p></div>\n\n<div class="stanza"><p>Non per lo mondo, per cui mo s&rsquo;affanna</p>\n<p>di retro ad Ost&iuml;ense e a Taddeo,</p>\n<p>ma per amor de la verace manna</p></div>\n\n<div class="stanza"><p>in picciol tempo gran dottor si feo;</p>\n<p>tal che si mise a circ&uuml;ir la vigna</p>\n<p>che tosto imbianca, se &rsquo;l vignaio &egrave; reo.</p></div>\n\n<div class="stanza"><p>E a la sedia che fu gi&agrave; benigna</p>\n<p>pi&ugrave; a&rsquo; poveri giusti, non per lei,</p>\n<p>ma per colui che siede, che traligna,</p></div>\n\n<div class="stanza"><p>non dispensare o due o tre per sei,</p>\n<p>non la fortuna di prima vacante,</p>\n<p>non decimas, quae sunt pauperum Dei,</p></div>\n\n<div class="stanza"><p>addimand&ograve;, ma contro al mondo errante</p>\n<p>licenza di combatter per lo seme</p>\n<p>del qual ti fascian ventiquattro piante.</p></div>\n\n<div class="stanza"><p>Poi, con dottrina e con volere insieme,</p>\n<p>con l&rsquo;officio appostolico si mosse</p>\n<p>quasi torrente ch&rsquo;alta vena preme;</p></div>\n\n<div class="stanza"><p>e ne li sterpi eretici percosse</p>\n<p>l&rsquo;impeto suo, pi&ugrave; vivamente quivi</p>\n<p>dove le resistenze eran pi&ugrave; grosse.</p></div>\n\n<div class="stanza"><p>Di lui si fecer poi diversi rivi</p>\n<p>onde l&rsquo;orto catolico si riga,</p>\n<p>s&igrave; che i suoi arbuscelli stan pi&ugrave; vivi.</p></div>\n\n<div class="stanza"><p>Se tal fu l&rsquo;una rota de la biga</p>\n<p>in che la Santa Chiesa si difese</p>\n<p>e vinse in campo la sua civil briga,</p></div>\n\n<div class="stanza"><p>ben ti dovrebbe assai esser palese</p>\n<p>l&rsquo;eccellenza de l&rsquo;altra, di cui Tomma</p>\n<p>dinanzi al mio venir fu s&igrave; cortese.</p></div>\n\n<div class="stanza"><p>Ma l&rsquo;orbita che f&eacute; la parte somma</p>\n<p>di sua circunferenza, &egrave; derelitta,</p>\n<p>s&igrave; ch&rsquo;&egrave; la muffa dov&rsquo; era la gromma.</p></div>\n\n<div class="stanza"><p>La sua famiglia, che si mosse dritta</p>\n<p>coi piedi a le sue orme, &egrave; tanto volta,</p>\n<p>che quel dinanzi a quel di retro gitta;</p></div>\n\n<div class="stanza"><p>e tosto si vedr&agrave; de la ricolta</p>\n<p>de la mala coltura, quando il loglio</p>\n<p>si lagner&agrave; che l&rsquo;arca li sia tolta.</p></div>\n\n<div class="stanza"><p>Ben dico, chi cercasse a foglio a foglio</p>\n<p>nostro volume, ancor troveria carta</p>\n<p>u&rsquo; leggerebbe &ldquo;I&rsquo; mi son quel ch&rsquo;i&rsquo; soglio&rdquo;;</p></div>\n\n<div class="stanza"><p>ma non fia da Casal n&eacute; d&rsquo;Acquasparta,</p>\n<p>l&agrave; onde vegnon tali a la scrittura,</p>\n<p>ch&rsquo;uno la fugge e altro la coarta.</p></div>\n\n<div class="stanza"><p>Io son la vita di Bonaventura</p>\n<p>da Bagnoregio, che ne&rsquo; grandi offici</p>\n<p>sempre pospuosi la sinistra cura.</p></div>\n\n<div class="stanza"><p>Illuminato e Augustin son quici,</p>\n<p>che fuor de&rsquo; primi scalzi poverelli</p>\n<p>che nel capestro a Dio si fero amici.</p></div>\n\n<div class="stanza"><p>Ugo da San Vittore &egrave; qui con elli,</p>\n<p>e Pietro Mangiadore e Pietro Spano,</p>\n<p>lo qual gi&ugrave; luce in dodici libelli;</p></div>\n\n<div class="stanza"><p>Nat&agrave;n profeta e &rsquo;l metropolitano</p>\n<p>Crisostomo e Anselmo e quel Donato</p>\n<p>ch&rsquo;a la prim&rsquo; arte degn&ograve; porre mano.</p></div>\n\n<div class="stanza"><p>Rabano &egrave; qui, e lucemi dallato</p>\n<p>il calavrese abate Giovacchino</p>\n<p>di spirito profetico dotato.</p></div>\n\n<div class="stanza"><p>Ad inveggiar cotanto paladino</p>\n<p>mi mosse l&rsquo;infiammata cortesia</p>\n<p>di fra Tommaso e &rsquo;l discreto latino;</p></div>\n\n<div class="stanza"><p>e mosse meco questa compagnia&raquo;.</p></div>','<p class="cantohead">Canto XIII</p>\n\n<div class="stanza"><p>Imagini, chi bene intender cupe</p>\n<p>quel ch&rsquo;i&rsquo; or vidi&mdash;e ritegna l&rsquo;image,</p>\n<p>mentre ch&rsquo;io dico, come ferma rupe&mdash;,</p></div>\n\n<div class="stanza"><p>quindici stelle che &rsquo;n diverse plage</p>\n<p>lo ciel avvivan di tanto sereno</p>\n<p>che soperchia de l&rsquo;aere ogne compage;</p></div>\n\n<div class="stanza"><p>imagini quel carro a cu&rsquo; il seno</p>\n<p>basta del nostro cielo e notte e giorno,</p>\n<p>s&igrave; ch&rsquo;al volger del temo non vien meno;</p></div>\n\n<div class="stanza"><p>imagini la bocca di quel corno</p>\n<p>che si comincia in punta de lo stelo</p>\n<p>a cui la prima rota va dintorno,</p></div>\n\n<div class="stanza"><p>aver fatto di s&eacute; due segni in cielo,</p>\n<p>qual fece la figliuola di Minoi</p>\n<p>allora che sent&igrave; di morte il gelo;</p></div>\n\n<div class="stanza"><p>e l&rsquo;un ne l&rsquo;altro aver li raggi suoi,</p>\n<p>e amendue girarsi per maniera</p>\n<p>che l&rsquo;uno andasse al primo e l&rsquo;altro al poi;</p></div>\n\n<div class="stanza"><p>e avr&agrave; quasi l&rsquo;ombra de la vera</p>\n<p>costellazione e de la doppia danza</p>\n<p>che circulava il punto dov&rsquo; io era:</p></div>\n\n<div class="stanza"><p>poi ch&rsquo;&egrave; tanto di l&agrave; da nostra usanza,</p>\n<p>quanto di l&agrave; dal mover de la Chiana</p>\n<p>si move il ciel che tutti li altri avanza.</p></div>\n\n<div class="stanza"><p>L&igrave; si cant&ograve; non Bacco, non Peana,</p>\n<p>ma tre persone in divina natura,</p>\n<p>e in una persona essa e l&rsquo;umana.</p></div>\n\n<div class="stanza"><p>Compi&eacute; &rsquo;l cantare e &rsquo;l volger sua misura;</p>\n<p>e attesersi a noi quei santi lumi,</p>\n<p>felicitando s&eacute; di cura in cura.</p></div>\n\n<div class="stanza"><p>Ruppe il silenzio ne&rsquo; concordi numi</p>\n<p>poscia la luce in che mirabil vita</p>\n<p>del poverel di Dio narrata fumi,</p></div>\n\n<div class="stanza"><p>e disse: &laquo;Quando l&rsquo;una paglia &egrave; trita,</p>\n<p>quando la sua semenza &egrave; gi&agrave; riposta,</p>\n<p>a batter l&rsquo;altra dolce amor m&rsquo;invita.</p></div>\n\n<div class="stanza"><p>Tu credi che nel petto onde la costa</p>\n<p>si trasse per formar la bella guancia</p>\n<p>il cui palato a tutto &rsquo;l mondo costa,</p></div>\n\n<div class="stanza"><p>e in quel che, forato da la lancia,</p>\n<p>e prima e poscia tanto sodisfece,</p>\n<p>che d&rsquo;ogne colpa vince la bilancia,</p></div>\n\n<div class="stanza"><p>quantunque a la natura umana lece</p>\n<p>aver di lume, tutto fosse infuso</p>\n<p>da quel valor che l&rsquo;uno e l&rsquo;altro fece;</p></div>\n\n<div class="stanza"><p>e per&ograve; miri a ci&ograve; ch&rsquo;io dissi suso,</p>\n<p>quando narrai che non ebbe &rsquo;l secondo</p>\n<p>lo ben che ne la quinta luce &egrave; chiuso.</p></div>\n\n<div class="stanza"><p>Or apri li occhi a quel ch&rsquo;io ti rispondo,</p>\n<p>e vedr&auml;i il tuo credere e &rsquo;l mio dire</p>\n<p>nel vero farsi come centro in tondo.</p></div>\n\n<div class="stanza"><p>Ci&ograve; che non more e ci&ograve; che pu&ograve; morire</p>\n<p>non &egrave; se non splendor di quella idea</p>\n<p>che partorisce, amando, il nostro Sire;</p></div>\n\n<div class="stanza"><p>ch&eacute; quella viva luce che s&igrave; mea</p>\n<p>dal suo lucente, che non si disuna</p>\n<p>da lui n&eacute; da l&rsquo;amor ch&rsquo;a lor s&rsquo;intrea,</p></div>\n\n<div class="stanza"><p>per sua bontate il suo raggiare aduna,</p>\n<p>quasi specchiato, in nove sussistenze,</p>\n<p>etternalmente rimanendosi una.</p></div>\n\n<div class="stanza"><p>Quindi discende a l&rsquo;ultime potenze</p>\n<p>gi&ugrave; d&rsquo;atto in atto, tanto divenendo,</p>\n<p>che pi&ugrave; non fa che brevi contingenze;</p></div>\n\n<div class="stanza"><p>e queste contingenze essere intendo</p>\n<p>le cose generate, che produce</p>\n<p>con seme e sanza seme il ciel movendo.</p></div>\n\n<div class="stanza"><p>La cera di costoro e chi la duce</p>\n<p>non sta d&rsquo;un modo; e per&ograve; sotto &rsquo;l segno</p>\n<p>id&euml;ale poi pi&ugrave; e men traluce.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli avvien ch&rsquo;un medesimo legno,</p>\n<p>secondo specie, meglio e peggio frutta;</p>\n<p>e voi nascete con diverso ingegno.</p></div>\n\n<div class="stanza"><p>Se fosse a punto la cera dedutta</p>\n<p>e fosse il cielo in sua virt&ugrave; supprema,</p>\n<p>la luce del suggel parrebbe tutta;</p></div>\n\n<div class="stanza"><p>ma la natura la d&agrave; sempre scema,</p>\n<p>similemente operando a l&rsquo;artista</p>\n<p>ch&rsquo;a l&rsquo;abito de l&rsquo;arte ha man che trema.</p></div>\n\n<div class="stanza"><p>Per&ograve; se &rsquo;l caldo amor la chiara vista</p>\n<p>de la prima virt&ugrave; dispone e segna,</p>\n<p>tutta la perfezion quivi s&rsquo;acquista.</p></div>\n\n<div class="stanza"><p>Cos&igrave; fu fatta gi&agrave; la terra degna</p>\n<p>di tutta l&rsquo;animal perfez&iuml;one;</p>\n<p>cos&igrave; fu fatta la Vergine pregna;</p></div>\n\n<div class="stanza"><p>s&igrave; ch&rsquo;io commendo tua oppin&iuml;one,</p>\n<p>che l&rsquo;umana natura mai non fue</p>\n<p>n&eacute; fia qual fu in quelle due persone.</p></div>\n\n<div class="stanza"><p>Or s&rsquo;i&rsquo; non procedesse avanti pi&ugrave;e,</p>\n<p>&lsquo;Dunque, come costui fu sanza pare?&rsquo;</p>\n<p>comincerebber le parole tue.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; paia ben ci&ograve; che non pare,</p>\n<p>pensa chi era, e la cagion che &rsquo;l mosse,</p>\n<p>quando fu detto &ldquo;Chiedi&rdquo;, a dimandare.</p></div>\n\n<div class="stanza"><p>Non ho parlato s&igrave;, che tu non posse</p>\n<p>ben veder ch&rsquo;el fu re, che chiese senno</p>\n<p>acci&ograve; che re suffic&iuml;ente fosse;</p></div>\n\n<div class="stanza"><p>non per sapere il numero in che enno</p>\n<p>li motor di qua s&ugrave;, o se necesse</p>\n<p>con contingente mai necesse fenno;</p></div>\n\n<div class="stanza"><p>non si est dare primum motum esse,</p>\n<p>o se del mezzo cerchio far si puote</p>\n<p>tr&iuml;angol s&igrave; ch&rsquo;un retto non avesse.</p></div>\n\n<div class="stanza"><p>Onde, se ci&ograve; ch&rsquo;io dissi e questo note,</p>\n<p>regal prudenza &egrave; quel vedere impari</p>\n<p>in che lo stral di mia intenzion percuote;</p></div>\n\n<div class="stanza"><p>e se al &ldquo;surse&rdquo; drizzi li occhi chiari,</p>\n<p>vedrai aver solamente respetto</p>\n<p>ai regi, che son molti, e &rsquo; buon son rari.</p></div>\n\n<div class="stanza"><p>Con questa distinzion prendi &rsquo;l mio detto;</p>\n<p>e cos&igrave; puote star con quel che credi</p>\n<p>del primo padre e del nostro Diletto.</p></div>\n\n<div class="stanza"><p>E questo ti sia sempre piombo a&rsquo; piedi,</p>\n<p>per farti mover lento com&rsquo; uom lasso</p>\n<p>e al s&igrave; e al no che tu non vedi:</p></div>\n\n<div class="stanza"><p>ch&eacute; quelli &egrave; tra li stolti bene a basso,</p>\n<p>che sanza distinzione afferma e nega</p>\n<p>ne l&rsquo;un cos&igrave; come ne l&rsquo;altro passo;</p></div>\n\n<div class="stanza"><p>perch&rsquo; elli &rsquo;ncontra che pi&ugrave; volte piega</p>\n<p>l&rsquo;oppin&iuml;on corrente in falsa parte,</p>\n<p>e poi l&rsquo;affetto l&rsquo;intelletto lega.</p></div>\n\n<div class="stanza"><p>Vie pi&ugrave; che &rsquo;ndarno da riva si parte,</p>\n<p>perch&eacute; non torna tal qual e&rsquo; si move,</p>\n<p>chi pesca per lo vero e non ha l&rsquo;arte.</p></div>\n\n<div class="stanza"><p>E di ci&ograve; sono al mondo aperte prove</p>\n<p>Parmenide, Melisso e Brisso e molti,</p>\n<p>li quali andaro e non sap&euml;an dove;</p></div>\n\n<div class="stanza"><p>s&igrave; f&eacute; Sabellio e Arrio e quelli stolti</p>\n<p>che furon come spade a le Scritture</p>\n<p>in render torti li diritti volti.</p></div>\n\n<div class="stanza"><p>Non sien le genti, ancor, troppo sicure</p>\n<p>a giudicar, s&igrave; come quei che stima</p>\n<p>le biade in campo pria che sien mature;</p></div>\n\n<div class="stanza"><p>ch&rsquo;i&rsquo; ho veduto tutto &rsquo;l verno prima</p>\n<p>lo prun mostrarsi rigido e feroce,</p>\n<p>poscia portar la rosa in su la cima;</p></div>\n\n<div class="stanza"><p>e legno vidi gi&agrave; dritto e veloce</p>\n<p>correr lo mar per tutto suo cammino,</p>\n<p>perire al fine a l&rsquo;intrar de la foce.</p></div>\n\n<div class="stanza"><p>Non creda donna Berta e ser Martino,</p>\n<p>per vedere un furare, altro offerere,</p>\n<p>vederli dentro al consiglio divino;</p></div>\n\n<div class="stanza"><p>ch&eacute; quel pu&ograve; surgere, e quel pu&ograve; cadere&raquo;.</p></div>','<p class="cantohead">Canto XIV</p>\n\n<div class="stanza"><p>Dal centro al cerchio, e s&igrave; dal cerchio al centro</p>\n<p>movesi l&rsquo;acqua in un ritondo vaso,</p>\n<p>secondo ch&rsquo;&egrave; percosso fuori o dentro:</p></div>\n\n<div class="stanza"><p>ne la mia mente f&eacute; s&ugrave;bito caso</p>\n<p>questo ch&rsquo;io dico, s&igrave; come si tacque</p>\n<p>la glor&iuml;osa vita di Tommaso,</p></div>\n\n<div class="stanza"><p>per la similitudine che nacque</p>\n<p>del suo parlare e di quel di Beatrice,</p>\n<p>a cui s&igrave; cominciar, dopo lui, piacque:</p></div>\n\n<div class="stanza"><p>&laquo;A costui fa mestieri, e nol vi dice</p>\n<p>n&eacute; con la voce n&eacute; pensando ancora,</p>\n<p>d&rsquo;un altro vero andare a la radice.</p></div>\n\n<div class="stanza"><p>Diteli se la luce onde s&rsquo;infiora</p>\n<p>vostra sustanza, rimarr&agrave; con voi</p>\n<p>etternalmente s&igrave; com&rsquo; ell&rsquo; &egrave; ora;</p></div>\n\n<div class="stanza"><p>e se rimane, dite come, poi</p>\n<p>che sarete visibili rifatti,</p>\n<p>esser por&agrave; ch&rsquo;al veder non vi n&ograve;i&raquo;.</p></div>\n\n<div class="stanza"><p>Come, da pi&ugrave; letizia pinti e tratti,</p>\n<p>a la f&iuml;ata quei che vanno a rota</p>\n<p>levan la voce e rallegrano li atti,</p></div>\n\n<div class="stanza"><p>cos&igrave;, a l&rsquo;orazion pronta e divota,</p>\n<p>li santi cerchi mostrar nova gioia</p>\n<p>nel torneare e ne la mira nota.</p></div>\n\n<div class="stanza"><p>Qual si lamenta perch&eacute; qui si moia</p>\n<p>per viver col&agrave; s&ugrave;, non vide quive</p>\n<p>lo refrigerio de l&rsquo;etterna ploia.</p></div>\n\n<div class="stanza"><p>Quell&rsquo; uno e due e tre che sempre vive</p>\n<p>e regna sempre in tre e &rsquo;n due e &rsquo;n uno,</p>\n<p>non circunscritto, e tutto circunscrive,</p></div>\n\n<div class="stanza"><p>tre volte era cantato da ciascuno</p>\n<p>di quelli spirti con tal melodia,</p>\n<p>ch&rsquo;ad ogne merto saria giusto muno.</p></div>\n\n<div class="stanza"><p>E io udi&rsquo; ne la luce pi&ugrave; dia</p>\n<p>del minor cerchio una voce modesta,</p>\n<p>forse qual fu da l&rsquo;angelo a Maria,</p></div>\n\n<div class="stanza"><p>risponder: &laquo;Quanto fia lunga la festa</p>\n<p>di paradiso, tanto il nostro amore</p>\n<p>si ragger&agrave; dintorno cotal vesta.</p></div>\n\n<div class="stanza"><p>La sua chiarezza s&eacute;guita l&rsquo;ardore;</p>\n<p>l&rsquo;ardor la vis&iuml;one, e quella &egrave; tanta,</p>\n<p>quant&rsquo; ha di grazia sovra suo valore.</p></div>\n\n<div class="stanza"><p>Come la carne glor&iuml;osa e santa</p>\n<p>fia rivestita, la nostra persona</p>\n<p>pi&ugrave; grata fia per esser tutta quanta;</p></div>\n\n<div class="stanza"><p>per che s&rsquo;accrescer&agrave; ci&ograve; che ne dona</p>\n<p>di grat&uuml;ito lume il sommo bene,</p>\n<p>lume ch&rsquo;a lui veder ne condiziona;</p></div>\n\n<div class="stanza"><p>onde la vis&iuml;on crescer convene,</p>\n<p>crescer l&rsquo;ardor che di quella s&rsquo;accende,</p>\n<p>crescer lo raggio che da esso vene.</p></div>\n\n<div class="stanza"><p>Ma s&igrave; come carbon che fiamma rende,</p>\n<p>e per vivo candor quella soverchia,</p>\n<p>s&igrave; che la sua parvenza si difende;</p></div>\n\n<div class="stanza"><p>cos&igrave; questo folg&oacute;r che gi&agrave; ne cerchia</p>\n<p>fia vinto in apparenza da la carne</p>\n<p>che tutto d&igrave; la terra ricoperchia;</p></div>\n\n<div class="stanza"><p>n&eacute; potr&agrave; tanta luce affaticarne:</p>\n<p>ch&eacute; li organi del corpo saran forti</p>\n<p>a tutto ci&ograve; che potr&agrave; dilettarne&raquo;.</p></div>\n\n<div class="stanza"><p>Tanto mi parver s&ugrave;biti e accorti</p>\n<p>e l&rsquo;uno e l&rsquo;altro coro a dicer &laquo;Amme!&raquo;,</p>\n<p>che ben mostrar disio d&rsquo;i corpi morti:</p></div>\n\n<div class="stanza"><p>forse non pur per lor, ma per le mamme,</p>\n<p>per li padri e per li altri che fuor cari</p>\n<p>anzi che fosser sempiterne fiamme.</p></div>\n\n<div class="stanza"><p>Ed ecco intorno, di chiarezza pari,</p>\n<p>nascere un lustro sopra quel che v&rsquo;era,</p>\n<p>per guisa d&rsquo;orizzonte che rischiari.</p></div>\n\n<div class="stanza"><p>E s&igrave; come al salir di prima sera</p>\n<p>comincian per lo ciel nove parvenze,</p>\n<p>s&igrave; che la vista pare e non par vera,</p></div>\n\n<div class="stanza"><p>parvemi l&igrave; novelle sussistenze</p>\n<p>cominciare a vedere, e fare un giro</p>\n<p>di fuor da l&rsquo;altre due circunferenze.</p></div>\n\n<div class="stanza"><p>Oh vero sfavillar del Santo Spiro!</p>\n<p>come si fece s&ugrave;bito e candente</p>\n<p>a li occhi miei che, vinti, nol soffriro!</p></div>\n\n<div class="stanza"><p>Ma B&euml;atrice s&igrave; bella e ridente</p>\n<p>mi si mostr&ograve;, che tra quelle vedute</p>\n<p>si vuol lasciar che non seguir la mente.</p></div>\n\n<div class="stanza"><p>Quindi ripreser li occhi miei virtute</p>\n<p>a rilevarsi; e vidimi translato</p>\n<p>sol con mia donna in pi&ugrave; alta salute.</p></div>\n\n<div class="stanza"><p>Ben m&rsquo;accors&rsquo; io ch&rsquo;io era pi&ugrave; levato,</p>\n<p>per l&rsquo;affocato riso de la stella,</p>\n<p>che mi parea pi&ugrave; roggio che l&rsquo;usato.</p></div>\n\n<div class="stanza"><p>Con tutto &rsquo;l core e con quella favella</p>\n<p>ch&rsquo;&egrave; una in tutti, a Dio feci olocausto,</p>\n<p>qual conveniesi a la grazia novella.</p></div>\n\n<div class="stanza"><p>E non er&rsquo; anco del mio petto essausto</p>\n<p>l&rsquo;ardor del sacrificio, ch&rsquo;io conobbi</p>\n<p>esso litare stato accetto e fausto;</p></div>\n\n<div class="stanza"><p>ch&eacute; con tanto lucore e tanto robbi</p>\n<p>m&rsquo;apparvero splendor dentro a due raggi,</p>\n<p>ch&rsquo;io dissi: &laquo;O El&iuml;&ograve;s che s&igrave; li addobbi!&raquo;.</p></div>\n\n<div class="stanza"><p>Come distinta da minori e maggi</p>\n<p>lumi biancheggia tra &rsquo; poli del mondo</p>\n<p>Galassia s&igrave;, che fa dubbiar ben saggi;</p></div>\n\n<div class="stanza"><p>s&igrave; costellati facean nel profondo</p>\n<p>Marte quei raggi il venerabil segno</p>\n<p>che fan giunture di quadranti in tondo.</p></div>\n\n<div class="stanza"><p>Qui vince la memoria mia lo &rsquo;ngegno;</p>\n<p>ch&eacute; quella croce lampeggiava Cristo,</p>\n<p>s&igrave; ch&rsquo;io non so trovare essempro degno;</p></div>\n\n<div class="stanza"><p>ma chi prende sua croce e segue Cristo,</p>\n<p>ancor mi scuser&agrave; di quel ch&rsquo;io lasso,</p>\n<p>vedendo in quell&rsquo; albor balenar Cristo.</p></div>\n\n<div class="stanza"><p>Di corno in corno e tra la cima e &rsquo;l basso</p>\n<p>si movien lumi, scintillando forte</p>\n<p>nel congiugnersi insieme e nel trapasso:</p></div>\n\n<div class="stanza"><p>cos&igrave; si veggion qui diritte e torte,</p>\n<p>veloci e tarde, rinovando vista,</p>\n<p>le minuzie d&rsquo;i corpi, lunghe e corte,</p></div>\n\n<div class="stanza"><p>moversi per lo raggio onde si lista</p>\n<p>talvolta l&rsquo;ombra che, per sua difesa,</p>\n<p>la gente con ingegno e arte acquista.</p></div>\n\n<div class="stanza"><p>E come giga e arpa, in tempra tesa</p>\n<p>di molte corde, fa dolce tintinno</p>\n<p>a tal da cui la nota non &egrave; intesa,</p></div>\n\n<div class="stanza"><p>cos&igrave; da&rsquo; lumi che l&igrave; m&rsquo;apparinno</p>\n<p>s&rsquo;accogliea per la croce una melode</p>\n<p>che mi rapiva, sanza intender l&rsquo;inno.</p></div>\n\n<div class="stanza"><p>Ben m&rsquo;accors&rsquo; io ch&rsquo;elli era d&rsquo;alte lode,</p>\n<p>per&ograve; ch&rsquo;a me ven&igrave;a &laquo;Resurgi&raquo; e &laquo;Vinci&raquo;</p>\n<p>come a colui che non intende e ode.</p></div>\n\n<div class="stanza"><p>&Iuml;o m&rsquo;innamorava tanto quinci,</p>\n<p>che &rsquo;nfino a l&igrave; non fu alcuna cosa</p>\n<p>che mi legasse con s&igrave; dolci vinci.</p></div>\n\n<div class="stanza"><p>Forse la mia parola par troppo osa,</p>\n<p>posponendo il piacer de li occhi belli,</p>\n<p>ne&rsquo; quai mirando mio disio ha posa;</p></div>\n\n<div class="stanza"><p>ma chi s&rsquo;avvede che i vivi suggelli</p>\n<p>d&rsquo;ogne bellezza pi&ugrave; fanno pi&ugrave; suso,</p>\n<p>e ch&rsquo;io non m&rsquo;era l&igrave; rivolto a quelli,</p></div>\n\n<div class="stanza"><p>escusar puommi di quel ch&rsquo;io m&rsquo;accuso</p>\n<p>per escusarmi, e vedermi dir vero:</p>\n<p>ch&eacute; &rsquo;l piacer santo non &egrave; qui dischiuso,</p></div>\n\n<div class="stanza"><p>perch&eacute; si fa, montando, pi&ugrave; sincero.</p></div>','<p class="cantohead">Canto XV</p>\n\n<div class="stanza"><p>Benigna volontade in che si liqua</p>\n<p>sempre l&rsquo;amor che drittamente spira,</p>\n<p>come cupidit&agrave; fa ne la iniqua,</p></div>\n\n<div class="stanza"><p>silenzio puose a quella dolce lira,</p>\n<p>e fece qu&iuml;etar le sante corde</p>\n<p>che la destra del cielo allenta e tira.</p></div>\n\n<div class="stanza"><p>Come saranno a&rsquo; giusti preghi sorde</p>\n<p>quelle sustanze che, per darmi voglia</p>\n<p>ch&rsquo;io le pregassi, a tacer fur concorde?</p></div>\n\n<div class="stanza"><p>Bene &egrave; che sanza termine si doglia</p>\n<p>chi, per amor di cosa che non duri</p>\n<p>etternalmente, quello amor si spoglia.</p></div>\n\n<div class="stanza"><p>Quale per li seren tranquilli e puri</p>\n<p>discorre ad ora ad or s&ugrave;bito foco,</p>\n<p>movendo li occhi che stavan sicuri,</p></div>\n\n<div class="stanza"><p>e pare stella che tramuti loco,</p>\n<p>se non che da la parte ond&rsquo; e&rsquo; s&rsquo;accende</p>\n<p>nulla sen perde, ed esso dura poco:</p></div>\n\n<div class="stanza"><p>tale dal corno che &rsquo;n destro si stende</p>\n<p>a pi&egrave; di quella croce corse un astro</p>\n<p>de la costellazion che l&igrave; resplende;</p></div>\n\n<div class="stanza"><p>n&eacute; si part&igrave; la gemma dal suo nastro,</p>\n<p>ma per la lista rad&iuml;al trascorse,</p>\n<p>che parve foco dietro ad alabastro.</p></div>\n\n<div class="stanza"><p>S&igrave; p&iuml;a l&rsquo;ombra d&rsquo;Anchise si porse,</p>\n<p>se fede merta nostra maggior musa,</p>\n<p>quando in Eliso del figlio s&rsquo;accorse.</p></div>\n\n<div class="stanza"><p>&laquo;O sanguis meus, o superinfusa</p>\n<p>grat&iuml;a De&iuml;, sicut tibi cui</p>\n<p>bis unquam celi ian&uuml;a reclusa?&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; quel lume: ond&rsquo; io m&rsquo;attesi a lui;</p>\n<p>poscia rivolsi a la mia donna il viso,</p>\n<p>e quinci e quindi stupefatto fui;</p></div>\n\n<div class="stanza"><p>ch&eacute; dentro a li occhi suoi ardeva un riso</p>\n<p>tal, ch&rsquo;io pensai co&rsquo; miei toccar lo fondo</p>\n<p>de la mia gloria e del mio paradiso.</p></div>\n\n<div class="stanza"><p>Indi, a udire e a veder giocondo,</p>\n<p>giunse lo spirto al suo principio cose,</p>\n<p>ch&rsquo;io non lo &rsquo;ntesi, s&igrave; parl&ograve; profondo;</p></div>\n\n<div class="stanza"><p>n&eacute; per elez&iuml;on mi si nascose,</p>\n<p>ma per necessit&agrave;, ch&eacute; &rsquo;l suo concetto</p>\n<p>al segno d&rsquo;i mortal si soprapuose.</p></div>\n\n<div class="stanza"><p>E quando l&rsquo;arco de l&rsquo;ardente affetto</p>\n<p>fu s&igrave; sfogato, che &rsquo;l parlar discese</p>\n<p>inver&rsquo; lo segno del nostro intelletto,</p></div>\n\n<div class="stanza"><p>la prima cosa che per me s&rsquo;intese,</p>\n<p>&laquo;Benedetto sia tu&raquo;, fu, &laquo;trino e uno,</p>\n<p>che nel mio seme se&rsquo; tanto cortese!&raquo;.</p></div>\n\n<div class="stanza"><p>E segu&igrave;: &laquo;Grato e lontano digiuno,</p>\n<p>tratto leggendo del magno volume</p>\n<p>du&rsquo; non si muta mai bianco n&eacute; bruno,</p></div>\n\n<div class="stanza"><p>solvuto hai, figlio, dentro a questo lume</p>\n<p>in ch&rsquo;io ti parlo, merc&egrave; di colei</p>\n<p>ch&rsquo;a l&rsquo;alto volo ti vest&igrave; le piume.</p></div>\n\n<div class="stanza"><p>Tu credi che a me tuo pensier mei</p>\n<p>da quel ch&rsquo;&egrave; primo, cos&igrave; come raia</p>\n<p>da l&rsquo;un, se si conosce, il cinque e &rsquo;l sei;</p></div>\n\n<div class="stanza"><p>e per&ograve; ch&rsquo;io mi sia e perch&rsquo; io paia</p>\n<p>pi&ugrave; gaud&iuml;oso a te, non mi domandi,</p>\n<p>che alcun altro in questa turba gaia.</p></div>\n\n<div class="stanza"><p>Tu credi &rsquo;l vero; ch&eacute; i minori e &rsquo; grandi</p>\n<p>di questa vita miran ne lo speglio</p>\n<p>in che, prima che pensi, il pensier pandi;</p></div>\n\n<div class="stanza"><p>ma perch&eacute; &rsquo;l sacro amore in che io veglio</p>\n<p>con perpet&uuml;a vista e che m&rsquo;asseta</p>\n<p>di dolce dis&iuml;ar, s&rsquo;adempia meglio,</p></div>\n\n<div class="stanza"><p>la voce tua sicura, balda e lieta</p>\n<p>suoni la volont&agrave;, suoni &rsquo;l disio,</p>\n<p>a che la mia risposta &egrave; gi&agrave; decreta!&raquo;.</p></div>\n\n<div class="stanza"><p>Io mi volsi a Beatrice, e quella udio</p>\n<p>pria ch&rsquo;io parlassi, e arrisemi un cenno</p>\n<p>che fece crescer l&rsquo;ali al voler mio.</p></div>\n\n<div class="stanza"><p>Poi cominciai cos&igrave;: &laquo;L&rsquo;affetto e &rsquo;l senno,</p>\n<p>come la prima equalit&agrave; v&rsquo;apparse,</p>\n<p>d&rsquo;un peso per ciascun di voi si fenno,</p></div>\n\n<div class="stanza"><p>per&ograve; che &rsquo;l sol che v&rsquo;allum&ograve; e arse,</p>\n<p>col caldo e con la luce &egrave; s&igrave; iguali,</p>\n<p>che tutte simiglianze sono scarse.</p></div>\n\n<div class="stanza"><p>Ma voglia e argomento ne&rsquo; mortali,</p>\n<p>per la cagion ch&rsquo;a voi &egrave; manifesta,</p>\n<p>diversamente son pennuti in ali;</p></div>\n\n<div class="stanza"><p>ond&rsquo; io, che son mortal, mi sento in questa</p>\n<p>disagguaglianza, e per&ograve; non ringrazio</p>\n<p>se non col core a la paterna festa.</p></div>\n\n<div class="stanza"><p>Ben supplico io a te, vivo topazio</p>\n<p>che questa gioia prez&iuml;osa ingemmi,</p>\n<p>perch&eacute; mi facci del tuo nome sazio&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O fronda mia in che io compiacemmi</p>\n<p>pur aspettando, io fui la tua radice&raquo;:</p>\n<p>cotal principio, rispondendo, femmi.</p></div>\n\n<div class="stanza"><p>Poscia mi disse: &laquo;Quel da cui si dice</p>\n<p>tua cognazione e che cent&rsquo; anni e pi&ugrave;e</p>\n<p>girato ha &rsquo;l monte in la prima cornice,</p></div>\n\n<div class="stanza"><p>mio figlio fu e tuo bisavol fue:</p>\n<p>ben si convien che la lunga fatica</p>\n<p>tu li raccorci con l&rsquo;opere tue.</p></div>\n\n<div class="stanza"><p>Fiorenza dentro da la cerchia antica,</p>\n<p>ond&rsquo; ella toglie ancora e terza e nona,</p>\n<p>si stava in pace, sobria e pudica.</p></div>\n\n<div class="stanza"><p>Non avea catenella, non corona,</p>\n<p>non gonne contigiate, non cintura</p>\n<p>che fosse a veder pi&ugrave; che la persona.</p></div>\n\n<div class="stanza"><p>Non faceva, nascendo, ancor paura</p>\n<p>la figlia al padre, che &rsquo;l tempo e la dote</p>\n<p>non fuggien quinci e quindi la misura.</p></div>\n\n<div class="stanza"><p>Non avea case di famiglia v&ograve;te;</p>\n<p>non v&rsquo;era giunto ancor Sardanapalo</p>\n<p>a mostrar ci&ograve; che &rsquo;n camera si puote.</p></div>\n\n<div class="stanza"><p>Non era vinto ancora Montemalo</p>\n<p>dal vostro Uccellatoio, che, com&rsquo; &egrave; vinto</p>\n<p>nel montar s&ugrave;, cos&igrave; sar&agrave; nel calo.</p></div>\n\n<div class="stanza"><p>Bellincion Berti vid&rsquo; io andar cinto</p>\n<p>di cuoio e d&rsquo;osso, e venir da lo specchio</p>\n<p>la donna sua sanza &rsquo;l viso dipinto;</p></div>\n\n<div class="stanza"><p>e vidi quel d&rsquo;i Nerli e quel del Vecchio</p>\n<p>esser contenti a la pelle scoperta,</p>\n<p>e le sue donne al fuso e al pennecchio.</p></div>\n\n<div class="stanza"><p>Oh fortunate! ciascuna era certa</p>\n<p>de la sua sepultura, e ancor nulla</p>\n<p>era per Francia nel letto diserta.</p></div>\n\n<div class="stanza"><p>L&rsquo;una vegghiava a studio de la culla,</p>\n<p>e, consolando, usava l&rsquo;id&iuml;oma</p>\n<p>che prima i padri e le madri trastulla;</p></div>\n\n<div class="stanza"><p>l&rsquo;altra, traendo a la rocca la chioma,</p>\n<p>favoleggiava con la sua famiglia</p>\n<p>d&rsquo;i Troiani, di Fiesole e di Roma.</p></div>\n\n<div class="stanza"><p>Saria tenuta allor tal maraviglia</p>\n<p>una Cianghella, un Lapo Salterello,</p>\n<p>qual or saria Cincinnato e Corniglia.</p></div>\n\n<div class="stanza"><p>A cos&igrave; riposato, a cos&igrave; bello</p>\n<p>viver di cittadini, a cos&igrave; fida</p>\n<p>cittadinanza, a cos&igrave; dolce ostello,</p></div>\n\n<div class="stanza"><p>Maria mi di&egrave;, chiamata in alte grida;</p>\n<p>e ne l&rsquo;antico vostro Batisteo</p>\n<p>insieme fui cristiano e Cacciaguida.</p></div>\n\n<div class="stanza"><p>Moronto fu mio frate ed Eliseo;</p>\n<p>mia donna venne a me di val di Pado,</p>\n<p>e quindi il sopranome tuo si feo.</p></div>\n\n<div class="stanza"><p>Poi seguitai lo &rsquo;mperador Currado;</p>\n<p>ed el mi cinse de la sua milizia,</p>\n<p>tanto per bene ovrar li venni in grado.</p></div>\n\n<div class="stanza"><p>Dietro li andai incontro a la nequizia</p>\n<p>di quella legge il cui popolo usurpa,</p>\n<p>per colpa d&rsquo;i pastor, vostra giustizia.</p></div>\n\n<div class="stanza"><p>Quivi fu&rsquo; io da quella gente turpa</p>\n<p>disviluppato dal mondo fallace,</p>\n<p>lo cui amor molt&rsquo; anime deturpa;</p></div>\n\n<div class="stanza"><p>e venni dal martiro a questa pace&raquo;.</p></div>','<p class="cantohead">Canto XVI</p>\n\n<div class="stanza"><p>O poca nostra nobilt&agrave; di sangue,</p>\n<p>se glor&iuml;ar di te la gente fai</p>\n<p>qua gi&ugrave; dove l&rsquo;affetto nostro langue,</p></div>\n\n<div class="stanza"><p>mirabil cosa non mi sar&agrave; mai:</p>\n<p>ch&eacute; l&agrave; dove appetito non si torce,</p>\n<p>dico nel cielo, io me ne gloriai.</p></div>\n\n<div class="stanza"><p>Ben se&rsquo; tu manto che tosto raccorce:</p>\n<p>s&igrave; che, se non s&rsquo;appon di d&igrave; in die,</p>\n<p>lo tempo va dintorno con le force.</p></div>\n\n<div class="stanza"><p>Dal &lsquo;voi&rsquo; che prima a Roma s&rsquo;offerie,</p>\n<p>in che la sua famiglia men persevra,</p>\n<p>ricominciaron le parole mie;</p></div>\n\n<div class="stanza"><p>onde Beatrice, ch&rsquo;era un poco scevra,</p>\n<p>ridendo, parve quella che tossio</p>\n<p>al primo fallo scritto di Ginevra.</p></div>\n\n<div class="stanza"><p>Io cominciai: &laquo;Voi siete il padre mio;</p>\n<p>voi mi date a parlar tutta baldezza;</p>\n<p>voi mi levate s&igrave;, ch&rsquo;i&rsquo; son pi&ugrave; ch&rsquo;io.</p></div>\n\n<div class="stanza"><p>Per tanti rivi s&rsquo;empie d&rsquo;allegrezza</p>\n<p>la mente mia, che di s&eacute; fa letizia</p>\n<p>perch&eacute; pu&ograve; sostener che non si spezza.</p></div>\n\n<div class="stanza"><p>Ditemi dunque, cara mia primizia,</p>\n<p>quai fuor li vostri antichi e quai fuor li anni</p>\n<p>che si segnaro in vostra p&uuml;erizia;</p></div>\n\n<div class="stanza"><p>ditemi de l&rsquo;ovil di San Giovanni</p>\n<p>quanto era allora, e chi eran le genti</p>\n<p>tra esso degne di pi&ugrave; alti scanni&raquo;.</p></div>\n\n<div class="stanza"><p>Come s&rsquo;avviva a lo spirar d&rsquo;i venti</p>\n<p>carbone in fiamma, cos&igrave; vid&rsquo; io quella</p>\n<p>luce risplendere a&rsquo; miei blandimenti;</p></div>\n\n<div class="stanza"><p>e come a li occhi miei si f&eacute; pi&ugrave; bella,</p>\n<p>cos&igrave; con voce pi&ugrave; dolce e soave,</p>\n<p>ma non con questa moderna favella,</p></div>\n\n<div class="stanza"><p>dissemi: &laquo;Da quel d&igrave; che fu detto &lsquo;Ave&rsquo;</p>\n<p>al parto in che mia madre, ch&rsquo;&egrave; or santa,</p>\n<p>s&rsquo;allev&iuml;&ograve; di me ond&rsquo; era grave,</p></div>\n\n<div class="stanza"><p>al suo Leon cinquecento cinquanta</p>\n<p>e trenta fiate venne questo foco</p>\n<p>a rinfiammarsi sotto la sua pianta.</p></div>\n\n<div class="stanza"><p>Li antichi miei e io nacqui nel loco</p>\n<p>dove si truova pria l&rsquo;ultimo sesto</p>\n<p>da quei che corre il vostro ann&uuml;al gioco.</p></div>\n\n<div class="stanza"><p>Basti d&rsquo;i miei maggiori udirne questo:</p>\n<p>chi ei si fosser e onde venner quivi,</p>\n<p>pi&ugrave; &egrave; tacer che ragionare onesto.</p></div>\n\n<div class="stanza"><p>Tutti color ch&rsquo;a quel tempo eran ivi</p>\n<p>da poter arme tra Marte e &rsquo;l Batista,</p>\n<p>eran il quinto di quei ch&rsquo;or son vivi.</p></div>\n\n<div class="stanza"><p>Ma la cittadinanza, ch&rsquo;&egrave; or mista</p>\n<p>di Campi, di Certaldo e di Fegghine,</p>\n<p>pura vediesi ne l&rsquo;ultimo artista.</p></div>\n\n<div class="stanza"><p>Oh quanto fora meglio esser vicine</p>\n<p>quelle genti ch&rsquo;io dico, e al Galluzzo</p>\n<p>e a Trespiano aver vostro confine,</p></div>\n\n<div class="stanza"><p>che averle dentro e sostener lo puzzo</p>\n<p>del villan d&rsquo;Aguglion, di quel da Signa,</p>\n<p>che gi&agrave; per barattare ha l&rsquo;occhio aguzzo!</p></div>\n\n<div class="stanza"><p>Se la gente ch&rsquo;al mondo pi&ugrave; traligna</p>\n<p>non fosse stata a Cesare noverca,</p>\n<p>ma come madre a suo figlio benigna,</p></div>\n\n<div class="stanza"><p>tal fatto &egrave; fiorentino e cambia e merca,</p>\n<p>che si sarebbe v&ograve;lto a Simifonti,</p>\n<p>l&agrave; dove andava l&rsquo;avolo a la cerca;</p></div>\n\n<div class="stanza"><p>sariesi Montemurlo ancor de&rsquo; Conti;</p>\n<p>sarieno i Cerchi nel piovier d&rsquo;Acone,</p>\n<p>e forse in Valdigrieve i Buondelmonti.</p></div>\n\n<div class="stanza"><p>Sempre la confusion de le persone</p>\n<p>principio fu del mal de la cittade,</p>\n<p>come del vostro il cibo che s&rsquo;appone;</p></div>\n\n<div class="stanza"><p>e cieco toro pi&ugrave; avaccio cade</p>\n<p>che cieco agnello; e molte volte taglia</p>\n<p>pi&ugrave; e meglio una che le cinque spade.</p></div>\n\n<div class="stanza"><p>Se tu riguardi Luni e Orbisaglia</p>\n<p>come sono ite, e come se ne vanno</p>\n<p>di retro ad esse Chiusi e Sinigaglia,</p></div>\n\n<div class="stanza"><p>udir come le schiatte si disfanno</p>\n<p>non ti parr&agrave; nova cosa n&eacute; forte,</p>\n<p>poscia che le cittadi termine hanno.</p></div>\n\n<div class="stanza"><p>Le vostre cose tutte hanno lor morte,</p>\n<p>s&igrave; come voi; ma celasi in alcuna</p>\n<p>che dura molto, e le vite son corte.</p></div>\n\n<div class="stanza"><p>E come &rsquo;l volger del ciel de la luna</p>\n<p>cuopre e discuopre i liti sanza posa,</p>\n<p>cos&igrave; fa di Fiorenza la Fortuna:</p></div>\n\n<div class="stanza"><p>per che non dee parer mirabil cosa</p>\n<p>ci&ograve; ch&rsquo;io dir&ograve; de li alti Fiorentini</p>\n<p>onde &egrave; la fama nel tempo nascosa.</p></div>\n\n<div class="stanza"><p>Io vidi li Ughi e vidi i Catellini,</p>\n<p>Filippi, Greci, Ormanni e Alberichi,</p>\n<p>gi&agrave; nel calare, illustri cittadini;</p></div>\n\n<div class="stanza"><p>e vidi cos&igrave; grandi come antichi,</p>\n<p>con quel de la Sannella, quel de l&rsquo;Arca,</p>\n<p>e Soldanieri e Ardinghi e Bostichi.</p></div>\n\n<div class="stanza"><p>Sovra la porta ch&rsquo;al presente &egrave; carca</p>\n<p>di nova fellonia di tanto peso</p>\n<p>che tosto fia iattura de la barca,</p></div>\n\n<div class="stanza"><p>erano i Ravignani, ond&rsquo; &egrave; disceso</p>\n<p>il conte Guido e qualunque del nome</p>\n<p>de l&rsquo;alto Bellincione ha poscia preso.</p></div>\n\n<div class="stanza"><p>Quel de la Pressa sapeva gi&agrave; come</p>\n<p>regger si vuole, e avea Galigaio</p>\n<p>dorata in casa sua gi&agrave; l&rsquo;elsa e &rsquo;l pome.</p></div>\n\n<div class="stanza"><p>Grand&rsquo; era gi&agrave; la colonna del Vaio,</p>\n<p>Sacchetti, Giuochi, Fifanti e Barucci</p>\n<p>e Galli e quei ch&rsquo;arrossan per lo staio.</p></div>\n\n<div class="stanza"><p>Lo ceppo di che nacquero i Calfucci</p>\n<p>era gi&agrave; grande, e gi&agrave; eran tratti</p>\n<p>a le curule Sizii e Arrigucci.</p></div>\n\n<div class="stanza"><p>Oh quali io vidi quei che son disfatti</p>\n<p>per lor superbia! e le palle de l&rsquo;oro</p>\n<p>fiorian Fiorenza in tutt&rsquo; i suoi gran fatti.</p></div>\n\n<div class="stanza"><p>Cos&igrave; facieno i padri di coloro</p>\n<p>che, sempre che la vostra chiesa vaca,</p>\n<p>si fanno grassi stando a consistoro.</p></div>\n\n<div class="stanza"><p>L&rsquo;oltracotata schiatta che s&rsquo;indraca</p>\n<p>dietro a chi fugge, e a chi mostra &rsquo;l dente</p>\n<p>o ver la borsa, com&rsquo; agnel si placa,</p></div>\n\n<div class="stanza"><p>gi&agrave; ven&igrave;a s&ugrave;, ma di picciola gente;</p>\n<p>s&igrave; che non piacque ad Ubertin Donato</p>\n<p>che po&iuml; il suocero il f&eacute; lor parente.</p></div>\n\n<div class="stanza"><p>Gi&agrave; era &rsquo;l Caponsacco nel mercato</p>\n<p>disceso gi&ugrave; da Fiesole, e gi&agrave; era</p>\n<p>buon cittadino Giuda e Infangato.</p></div>\n\n<div class="stanza"><p>Io dir&ograve; cosa incredibile e vera:</p>\n<p>nel picciol cerchio s&rsquo;entrava per porta</p>\n<p>che si nomava da quei de la Pera.</p></div>\n\n<div class="stanza"><p>Ciascun che de la bella insegna porta</p>\n<p>del gran barone il cui nome e &rsquo;l cui pregio</p>\n<p>la festa di Tommaso riconforta,</p></div>\n\n<div class="stanza"><p>da esso ebbe milizia e privilegio;</p>\n<p>avvegna che con popol si rauni</p>\n<p>oggi colui che la fascia col fregio.</p></div>\n\n<div class="stanza"><p>Gi&agrave; eran Gualterotti e Importuni;</p>\n<p>e ancor saria Borgo pi&ugrave; qu&iuml;eto,</p>\n<p>se di novi vicin fosser digiuni.</p></div>\n\n<div class="stanza"><p>La casa di che nacque il vostro fleto,</p>\n<p>per lo giusto disdegno che v&rsquo;ha morti</p>\n<p>e puose fine al vostro viver lieto,</p></div>\n\n<div class="stanza"><p>era onorata, essa e suoi consorti:</p>\n<p>o Buondelmonte, quanto mal fuggisti</p>\n<p>le nozze s&uuml;e per li altrui conforti!</p></div>\n\n<div class="stanza"><p>Molti sarebber lieti, che son tristi,</p>\n<p>se Dio t&rsquo;avesse conceduto ad Ema</p>\n<p>la prima volta ch&rsquo;a citt&agrave; venisti.</p></div>\n\n<div class="stanza"><p>Ma conveniesi a quella pietra scema</p>\n<p>che guarda &rsquo;l ponte, che Fiorenza fesse</p>\n<p>vittima ne la sua pace postrema.</p></div>\n\n<div class="stanza"><p>Con queste genti, e con altre con esse,</p>\n<p>vid&rsquo; io Fiorenza in s&igrave; fatto riposo,</p>\n<p>che non avea cagione onde piangesse.</p></div>\n\n<div class="stanza"><p>Con queste genti vid&rsquo;io glor&iuml;oso</p>\n<p>e giusto il popol suo, tanto che &rsquo;l giglio</p>\n<p>non era ad asta mai posto a ritroso,</p></div>\n\n<div class="stanza"><p>n&eacute; per divis&iuml;on fatto vermiglio&raquo;.</p></div>','<p class="cantohead">Canto XVII</p>\n\n<div class="stanza"><p>Qual venne a Climen&egrave;, per accertarsi</p>\n<p>di ci&ograve; ch&rsquo;av&euml;a incontro a s&eacute; udito,</p>\n<p>quei ch&rsquo;ancor fa li padri ai figli scarsi;</p></div>\n\n<div class="stanza"><p>tal era io, e tal era sentito</p>\n<p>e da Beatrice e da la santa lampa</p>\n<p>che pria per me avea mutato sito.</p></div>\n\n<div class="stanza"><p>Per che mia donna &laquo;Manda fuor la vampa</p>\n<p>del tuo disio&raquo;, mi disse, &laquo;s&igrave; ch&rsquo;ella esca</p>\n<p>segnata bene de la interna stampa:</p></div>\n\n<div class="stanza"><p>non perch&eacute; nostra conoscenza cresca</p>\n<p>per tuo parlare, ma perch&eacute; t&rsquo;ausi</p>\n<p>a dir la sete, s&igrave; che l&rsquo;uom ti mesca&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O cara piota mia che s&igrave; t&rsquo;insusi,</p>\n<p>che, come veggion le terrene menti</p>\n<p>non capere in tr&iuml;angol due ottusi,</p></div>\n\n<div class="stanza"><p>cos&igrave; vedi le cose contingenti</p>\n<p>anzi che sieno in s&eacute;, mirando il punto</p>\n<p>a cui tutti li tempi son presenti;</p></div>\n\n<div class="stanza"><p>mentre ch&rsquo;io era a Virgilio congiunto</p>\n<p>su per lo monte che l&rsquo;anime cura</p>\n<p>e discendendo nel mondo defunto,</p></div>\n\n<div class="stanza"><p>dette mi fuor di mia vita futura</p>\n<p>parole gravi, avvegna ch&rsquo;io mi senta</p>\n<p>ben tetragono ai colpi di ventura;</p></div>\n\n<div class="stanza"><p>per che la voglia mia saria contenta</p>\n<p>d&rsquo;intender qual fortuna mi s&rsquo;appressa:</p>\n<p>ch&eacute; saetta previsa vien pi&ugrave; lenta&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; diss&rsquo; io a quella luce stessa</p>\n<p>che pria m&rsquo;avea parlato; e come volle</p>\n<p>Beatrice, fu la mia voglia confessa.</p></div>\n\n<div class="stanza"><p>N&eacute; per ambage, in che la gente folle</p>\n<p>gi&agrave; s&rsquo;inviscava pria che fosse anciso</p>\n<p>l&rsquo;Agnel di Dio che le peccata tolle,</p></div>\n\n<div class="stanza"><p>ma per chiare parole e con preciso</p>\n<p>latin rispuose quello amor paterno,</p>\n<p>chiuso e parvente del suo proprio riso:</p></div>\n\n<div class="stanza"><p>&laquo;La contingenza, che fuor del quaderno</p>\n<p>de la vostra matera non si stende,</p>\n<p>tutta &egrave; dipinta nel cospetto etterno;</p></div>\n\n<div class="stanza"><p>necessit&agrave; per&ograve; quindi non prende</p>\n<p>se non come dal viso in che si specchia</p>\n<p>nave che per torrente gi&ugrave; discende.</p></div>\n\n<div class="stanza"><p>Da indi, s&igrave; come viene ad orecchia</p>\n<p>dolce armonia da organo, mi viene</p>\n<p>a vista il tempo che ti s&rsquo;apparecchia.</p></div>\n\n<div class="stanza"><p>Qual si partio Ipolito d&rsquo;Atene</p>\n<p>per la spietata e perfida noverca,</p>\n<p>tal di Fiorenza partir ti convene.</p></div>\n\n<div class="stanza"><p>Questo si vuole e questo gi&agrave; si cerca,</p>\n<p>e tosto verr&agrave; fatto a chi ci&ograve; pensa</p>\n<p>l&agrave; dove Cristo tutto d&igrave; si merca.</p></div>\n\n<div class="stanza"><p>La colpa seguir&agrave; la parte offensa</p>\n<p>in grido, come suol; ma la vendetta</p>\n<p>fia testimonio al ver che la dispensa.</p></div>\n\n<div class="stanza"><p>Tu lascerai ogne cosa diletta</p>\n<p>pi&ugrave; caramente; e questo &egrave; quello strale</p>\n<p>che l&rsquo;arco de lo essilio pria saetta.</p></div>\n\n<div class="stanza"><p>Tu proverai s&igrave; come sa di sale</p>\n<p>lo pane altrui, e come &egrave; duro calle</p>\n<p>lo scendere e &rsquo;l salir per l&rsquo;altrui scale.</p></div>\n\n<div class="stanza"><p>E quel che pi&ugrave; ti graver&agrave; le spalle,</p>\n<p>sar&agrave; la compagnia malvagia e scempia</p>\n<p>con la qual tu cadrai in questa valle;</p></div>\n\n<div class="stanza"><p>che tutta ingrata, tutta matta ed empia</p>\n<p>si far&agrave; contr&rsquo; a te; ma, poco appresso,</p>\n<p>ella, non tu, n&rsquo;avr&agrave; rossa la tempia.</p></div>\n\n<div class="stanza"><p>Di sua bestialitate il suo processo</p>\n<p>far&agrave; la prova; s&igrave; ch&rsquo;a te fia bello</p>\n<p>averti fatta parte per te stesso.</p></div>\n\n<div class="stanza"><p>Lo primo tuo refugio e &rsquo;l primo ostello</p>\n<p>sar&agrave; la cortesia del gran Lombardo</p>\n<p>che &rsquo;n su la scala porta il santo uccello;</p></div>\n\n<div class="stanza"><p>ch&rsquo;in te avr&agrave; s&igrave; benigno riguardo,</p>\n<p>che del fare e del chieder, tra voi due,</p>\n<p>fia primo quel che tra li altri &egrave; pi&ugrave; tardo.</p></div>\n\n<div class="stanza"><p>Con lui vedrai colui che &rsquo;mpresso fue,</p>\n<p>nascendo, s&igrave; da questa stella forte,</p>\n<p>che notabili fier l&rsquo;opere sue.</p></div>\n\n<div class="stanza"><p>Non se ne son le genti ancora accorte</p>\n<p>per la novella et&agrave;, ch&eacute; pur nove anni</p>\n<p>son queste rote intorno di lui torte;</p></div>\n\n<div class="stanza"><p>ma pria che &rsquo;l Guasco l&rsquo;alto Arrigo inganni,</p>\n<p>parran faville de la sua virtute</p>\n<p>in non curar d&rsquo;argento n&eacute; d&rsquo;affanni.</p></div>\n\n<div class="stanza"><p>Le sue magnificenze conosciute</p>\n<p>saranno ancora, s&igrave; che &rsquo; suoi nemici</p>\n<p>non ne potran tener le lingue mute.</p></div>\n\n<div class="stanza"><p>A lui t&rsquo;aspetta e a&rsquo; suoi benefici;</p>\n<p>per lui fia trasmutata molta gente,</p>\n<p>cambiando condizion ricchi e mendici;</p></div>\n\n<div class="stanza"><p>e portera&rsquo;ne scritto ne la mente</p>\n<p>di lui, e nol dirai&raquo;; e disse cose</p>\n<p>incredibili a quei che fier presente.</p></div>\n\n<div class="stanza"><p>Poi giunse: &laquo;Figlio, queste son le chiose</p>\n<p>di quel che ti fu detto; ecco le &rsquo;nsidie</p>\n<p>che dietro a pochi giri son nascose.</p></div>\n\n<div class="stanza"><p>Non vo&rsquo; per&ograve; ch&rsquo;a&rsquo; tuoi vicini invidie,</p>\n<p>poscia che s&rsquo;infutura la tua vita</p>\n<p>vie pi&ugrave; l&agrave; che &rsquo;l punir di lor perfidie&raquo;.</p></div>\n\n<div class="stanza"><p>Poi che, tacendo, si mostr&ograve; spedita</p>\n<p>l&rsquo;anima santa di metter la trama</p>\n<p>in quella tela ch&rsquo;io le porsi ordita,</p></div>\n\n<div class="stanza"><p>io cominciai, come colui che brama,</p>\n<p>dubitando, consiglio da persona</p>\n<p>che vede e vuol dirittamente e ama:</p></div>\n\n<div class="stanza"><p>&laquo;Ben veggio, padre mio, s&igrave; come sprona</p>\n<p>lo tempo verso me, per colpo darmi</p>\n<p>tal, ch&rsquo;&egrave; pi&ugrave; grave a chi pi&ugrave; s&rsquo;abbandona;</p></div>\n\n<div class="stanza"><p>per che di provedenza &egrave; buon ch&rsquo;io m&rsquo;armi,</p>\n<p>s&igrave; che, se loco m&rsquo;&egrave; tolto pi&ugrave; caro,</p>\n<p>io non perdessi li altri per miei carmi.</p></div>\n\n<div class="stanza"><p>Gi&ugrave; per lo mondo sanza fine amaro,</p>\n<p>e per lo monte del cui bel cacume</p>\n<p>li occhi de la mia donna mi levaro,</p></div>\n\n<div class="stanza"><p>e poscia per lo ciel, di lume in lume,</p>\n<p>ho io appreso quel che s&rsquo;io ridico,</p>\n<p>a molti fia sapor di forte agrume;</p></div>\n\n<div class="stanza"><p>e s&rsquo;io al vero son timido amico,</p>\n<p>temo di perder viver tra coloro</p>\n<p>che questo tempo chiameranno antico&raquo;.</p></div>\n\n<div class="stanza"><p>La luce in che rideva il mio tesoro</p>\n<p>ch&rsquo;io trovai l&igrave;, si f&eacute; prima corusca,</p>\n<p>quale a raggio di sole specchio d&rsquo;oro;</p></div>\n\n<div class="stanza"><p>indi rispuose: &laquo;Cosc&iuml;enza fusca</p>\n<p>o de la propria o de l&rsquo;altrui vergogna</p>\n<p>pur sentir&agrave; la tua parola brusca.</p></div>\n\n<div class="stanza"><p>Ma nondimen, rimossa ogne menzogna,</p>\n<p>tutta tua vis&iuml;on fa manifesta;</p>\n<p>e lascia pur grattar dov&rsquo; &egrave; la rogna.</p></div>\n\n<div class="stanza"><p>Ch&eacute; se la voce tua sar&agrave; molesta</p>\n<p>nel primo gusto, vital nodrimento</p>\n<p>lascer&agrave; poi, quando sar&agrave; digesta.</p></div>\n\n<div class="stanza"><p>Questo tuo grido far&agrave; come vento,</p>\n<p>che le pi&ugrave; alte cime pi&ugrave; percuote;</p>\n<p>e ci&ograve; non fa d&rsquo;onor poco argomento.</p></div>\n\n<div class="stanza"><p>Per&ograve; ti son mostrate in queste rote,</p>\n<p>nel monte e ne la valle dolorosa</p>\n<p>pur l&rsquo;anime che son di fama note,</p></div>\n\n<div class="stanza"><p>che l&rsquo;animo di quel ch&rsquo;ode, non posa</p>\n<p>n&eacute; ferma fede per essempro ch&rsquo;aia</p>\n<p>la sua radice incognita e ascosa,</p></div>\n\n<div class="stanza"><p>n&eacute; per altro argomento che non paia&raquo;.</p></div>','<p class="cantohead">Canto XVIII</p>\n\n<div class="stanza"><p>Gi&agrave; si godeva solo del suo verbo</p>\n<p>quello specchio beato, e io gustava</p>\n<p>lo mio, temprando col dolce l&rsquo;acerbo;</p></div>\n\n<div class="stanza"><p>e quella donna ch&rsquo;a Dio mi menava</p>\n<p>disse: &laquo;Muta pensier; pensa ch&rsquo;i&rsquo; sono</p>\n<p>presso a colui ch&rsquo;ogne torto disgrava&raquo;.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi a l&rsquo;amoroso suono</p>\n<p>del mio conforto; e qual io allor vidi</p>\n<p>ne li occhi santi amor, qui l&rsquo;abbandono:</p></div>\n\n<div class="stanza"><p>non perch&rsquo; io pur del mio parlar diffidi,</p>\n<p>ma per la mente che non pu&ograve; redire</p>\n<p>sovra s&eacute; tanto, s&rsquo;altri non la guidi.</p></div>\n\n<div class="stanza"><p>Tanto poss&rsquo; io di quel punto ridire,</p>\n<p>che, rimirando lei, lo mio affetto</p>\n<p>libero fu da ogne altro disire,</p></div>\n\n<div class="stanza"><p>fin che &rsquo;l piacere etterno, che diretto</p>\n<p>raggiava in B&euml;atrice, dal bel viso</p>\n<p>mi contentava col secondo aspetto.</p></div>\n\n<div class="stanza"><p>Vincendo me col lume d&rsquo;un sorriso,</p>\n<p>ella mi disse: &laquo;Volgiti e ascolta;</p>\n<p>ch&eacute; non pur ne&rsquo; miei occhi &egrave; paradiso&raquo;.</p></div>\n\n<div class="stanza"><p>Come si vede qui alcuna volta</p>\n<p>l&rsquo;affetto ne la vista, s&rsquo;elli &egrave; tanto,</p>\n<p>che da lui sia tutta l&rsquo;anima tolta,</p></div>\n\n<div class="stanza"><p>cos&igrave; nel fiammeggiar del folg&oacute;r santo,</p>\n<p>a ch&rsquo;io mi volsi, conobbi la voglia</p>\n<p>in lui di ragionarmi ancora alquanto.</p></div>\n\n<div class="stanza"><p>El cominci&ograve;: &laquo;In questa quinta soglia</p>\n<p>de l&rsquo;albero che vive de la cima</p>\n<p>e frutta sempre e mai non perde foglia,</p></div>\n\n<div class="stanza"><p>spiriti son beati, che gi&ugrave;, prima</p>\n<p>che venissero al ciel, fuor di gran voce,</p>\n<p>s&igrave; ch&rsquo;ogne musa ne sarebbe opima.</p></div>\n\n<div class="stanza"><p>Per&ograve; mira ne&rsquo; corni de la croce:</p>\n<p>quello ch&rsquo;io nomer&ograve;, l&igrave; far&agrave; l&rsquo;atto</p>\n<p>che fa in nube il suo foco veloce&raquo;.</p></div>\n\n<div class="stanza"><p>Io vidi per la croce un lume tratto</p>\n<p>dal nomar Iosu&egrave;, com&rsquo; el si feo;</p>\n<p>n&eacute; mi fu noto il dir prima che &rsquo;l fatto.</p></div>\n\n<div class="stanza"><p>E al nome de l&rsquo;alto Macabeo</p>\n<p>vidi moversi un altro roteando,</p>\n<p>e letizia era ferza del paleo.</p></div>\n\n<div class="stanza"><p>Cos&igrave; per Carlo Magno e per Orlando</p>\n<p>due ne segu&igrave; lo mio attento sguardo,</p>\n<p>com&rsquo; occhio segue suo falcon volando.</p></div>\n\n<div class="stanza"><p>Poscia trasse Guiglielmo e Rinoardo</p>\n<p>e &rsquo;l duca Gottifredi la mia vista</p>\n<p>per quella croce, e Ruberto Guiscardo.</p></div>\n\n<div class="stanza"><p>Indi, tra l&rsquo;altre luci mota e mista,</p>\n<p>mostrommi l&rsquo;alma che m&rsquo;avea parlato</p>\n<p>qual era tra i cantor del cielo artista.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi dal mio destro lato</p>\n<p>per vedere in Beatrice il mio dovere,</p>\n<p>o per parlare o per atto, segnato;</p></div>\n\n<div class="stanza"><p>e vidi le sue luci tanto mere,</p>\n<p>tanto gioconde, che la sua sembianza</p>\n<p>vinceva li altri e l&rsquo;ultimo solere.</p></div>\n\n<div class="stanza"><p>E come, per sentir pi&ugrave; dilettanza</p>\n<p>bene operando, l&rsquo;uom di giorno in giorno</p>\n<p>s&rsquo;accorge che la sua virtute avanza,</p></div>\n\n<div class="stanza"><p>s&igrave; m&rsquo;accors&rsquo; io che &rsquo;l mio girare intorno</p>\n<p>col cielo insieme avea cresciuto l&rsquo;arco,</p>\n<p>veggendo quel miracol pi&ugrave; addorno.</p></div>\n\n<div class="stanza"><p>E qual &egrave; &rsquo;l trasmutare in picciol varco</p>\n<p>di tempo in bianca donna, quando &rsquo;l volto</p>\n<p>suo si discarchi di vergogna il carco,</p></div>\n\n<div class="stanza"><p>tal fu ne li occhi miei, quando fui v&ograve;lto,</p>\n<p>per lo candor de la temprata stella</p>\n<p>sesta, che dentro a s&eacute; m&rsquo;avea ricolto.</p></div>\n\n<div class="stanza"><p>Io vidi in quella giov&iuml;al facella</p>\n<p>lo sfavillar de l&rsquo;amor che l&igrave; era</p>\n<p>segnare a li occhi miei nostra favella.</p></div>\n\n<div class="stanza"><p>E come augelli surti di rivera,</p>\n<p>quasi congratulando a lor pasture,</p>\n<p>fanno di s&eacute; or tonda or altra schiera,</p></div>\n\n<div class="stanza"><p>s&igrave; dentro ai lumi sante creature</p>\n<p>volitando cantavano, e faciensi</p>\n<p>or D, or I, or L in sue figure.</p></div>\n\n<div class="stanza"><p>Prima, cantando, a sua nota moviensi;</p>\n<p>poi, diventando l&rsquo;un di questi segni,</p>\n<p>un poco s&rsquo;arrestavano e taciensi.</p></div>\n\n<div class="stanza"><p>O diva Pegas&euml;a che li &rsquo;ngegni</p>\n<p>fai glor&iuml;osi e rendili longevi,</p>\n<p>ed essi teco le cittadi e &rsquo; regni,</p></div>\n\n<div class="stanza"><p>illustrami di te, s&igrave; ch&rsquo;io rilevi</p>\n<p>le lor figure com&rsquo; io l&rsquo;ho concette:</p>\n<p>paia tua possa in questi versi brevi!</p></div>\n\n<div class="stanza"><p>Mostrarsi dunque in cinque volte sette</p>\n<p>vocali e consonanti; e io notai</p>\n<p>le parti s&igrave;, come mi parver dette.</p></div>\n\n<div class="stanza"><p>&lsquo;DILIGITE IUSTITIAM&rsquo;, primai</p>\n<p>fur verbo e nome di tutto &rsquo;l dipinto;</p>\n<p>&lsquo;QUI IUDICATIS TERRAM&rsquo;, fur sezzai.</p></div>\n\n<div class="stanza"><p>Poscia ne l&rsquo;emme del vocabol quinto</p>\n<p>rimasero ordinate; s&igrave; che Giove</p>\n<p>pareva argento l&igrave; d&rsquo;oro distinto.</p></div>\n\n<div class="stanza"><p>E vidi scendere altre luci dove</p>\n<p>era il colmo de l&rsquo;emme, e l&igrave; quetarsi</p>\n<p>cantando, credo, il ben ch&rsquo;a s&eacute; le move.</p></div>\n\n<div class="stanza"><p>Poi, come nel percuoter d&rsquo;i ciocchi arsi</p>\n<p>surgono innumerabili faville,</p>\n<p>onde li stolti sogliono agurarsi,</p></div>\n\n<div class="stanza"><p>resurger parver quindi pi&ugrave; di mille</p>\n<p>luci e salir, qual assai e qual poco,</p>\n<p>s&igrave; come &rsquo;l sol che l&rsquo;accende sortille;</p></div>\n\n<div class="stanza"><p>e qu&iuml;etata ciascuna in suo loco,</p>\n<p>la testa e &rsquo;l collo d&rsquo;un&rsquo;aguglia vidi</p>\n<p>rappresentare a quel distinto foco.</p></div>\n\n<div class="stanza"><p>Quei che dipinge l&igrave;, non ha chi &rsquo;l guidi;</p>\n<p>ma esso guida, e da lui si rammenta</p>\n<p>quella virt&ugrave; ch&rsquo;&egrave; forma per li nidi.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra b&euml;atitudo, che contenta</p>\n<p>pareva prima d&rsquo;ingigliarsi a l&rsquo;emme,</p>\n<p>con poco moto seguit&ograve; la &rsquo;mprenta.</p></div>\n\n<div class="stanza"><p>O dolce stella, quali e quante gemme</p>\n<p>mi dimostraro che nostra giustizia</p>\n<p>effetto sia del ciel che tu ingemme!</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;io prego la mente in che s&rsquo;inizia</p>\n<p>tuo moto e tua virtute, che rimiri</p>\n<p>ond&rsquo; esce il fummo che &rsquo;l tuo raggio vizia;</p></div>\n\n<div class="stanza"><p>s&igrave; ch&rsquo;un&rsquo;altra f&iuml;ata omai s&rsquo;adiri</p>\n<p>del comperare e vender dentro al templo</p>\n<p>che si mur&ograve; di segni e di mart&igrave;ri.</p></div>\n\n<div class="stanza"><p>O milizia del ciel cu&rsquo; io contemplo,</p>\n<p>adora per color che sono in terra</p>\n<p>tutti sv&iuml;ati dietro al malo essemplo!</p></div>\n\n<div class="stanza"><p>Gi&agrave; si solea con le spade far guerra;</p>\n<p>ma or si fa togliendo or qui or quivi</p>\n<p>lo pan che &rsquo;l p&iuml;o Padre a nessun serra.</p></div>\n\n<div class="stanza"><p>Ma tu che sol per cancellare scrivi,</p>\n<p>pensa che Pietro e Paulo, che moriro</p>\n<p>per la vigna che guasti, ancor son vivi.</p></div>\n\n<div class="stanza"><p>Ben puoi tu dire: &laquo;I&rsquo; ho fermo &rsquo;l disiro</p>\n<p>s&igrave; a colui che volle viver solo</p>\n<p>e che per salti fu tratto al martiro,</p></div>\n\n<div class="stanza"><p>ch&rsquo;io non conosco il pescator n&eacute; Polo&raquo;.</p></div>','<p class="cantohead">Canto XIX</p>\n\n<div class="stanza"><p>Parea dinanzi a me con l&rsquo;ali aperte</p>\n<p>la bella image che nel dolce frui</p>\n<p>liete facevan l&rsquo;anime conserte;</p></div>\n\n<div class="stanza"><p>parea ciascuna rubinetto in cui</p>\n<p>raggio di sole ardesse s&igrave; acceso,</p>\n<p>che ne&rsquo; miei occhi rifrangesse lui.</p></div>\n\n<div class="stanza"><p>E quel che mi convien ritrar testeso,</p>\n<p>non port&ograve; voce mai, n&eacute; scrisse incostro,</p>\n<p>n&eacute; fu per fantasia gi&agrave; mai compreso;</p></div>\n\n<div class="stanza"><p>ch&rsquo;io vidi e anche udi&rsquo; parlar lo rostro,</p>\n<p>e sonar ne la voce e &laquo;io&raquo; e &laquo;mio&raquo;,</p>\n<p>quand&rsquo; era nel concetto e &lsquo;noi&rsquo; e &lsquo;nostro&rsquo;.</p></div>\n\n<div class="stanza"><p>E cominci&ograve;: &laquo;Per esser giusto e pio</p>\n<p>son io qui essaltato a quella gloria</p>\n<p>che non si lascia vincere a disio;</p></div>\n\n<div class="stanza"><p>e in terra lasciai la mia memoria</p>\n<p>s&igrave; fatta, che le genti l&igrave; malvage</p>\n<p>commendan lei, ma non seguon la storia&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; un sol calor di molte brage</p>\n<p>si fa sentir, come di molti amori</p>\n<p>usciva solo un suon di quella image.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io appresso: &laquo;O perpet&uuml;i fiori</p>\n<p>de l&rsquo;etterna letizia, che pur uno</p>\n<p>parer mi fate tutti vostri odori,</p></div>\n\n<div class="stanza"><p>solvetemi, spirando, il gran digiuno</p>\n<p>che lungamente m&rsquo;ha tenuto in fame,</p>\n<p>non trovandoli in terra cibo alcuno.</p></div>\n\n<div class="stanza"><p>Ben so io che, se &rsquo;n cielo altro reame</p>\n<p>la divina giustizia fa suo specchio,</p>\n<p>che &rsquo;l vostro non l&rsquo;apprende con velame.</p></div>\n\n<div class="stanza"><p>Sapete come attento io m&rsquo;apparecchio</p>\n<p>ad ascoltar; sapete qual &egrave; quello</p>\n<p>dubbio che m&rsquo;&egrave; digiun cotanto vecchio&raquo;.</p></div>\n\n<div class="stanza"><p>Quasi falcone ch&rsquo;esce del cappello,</p>\n<p>move la testa e con l&rsquo;ali si plaude,</p>\n<p>voglia mostrando e faccendosi bello,</p></div>\n\n<div class="stanza"><p>vid&rsquo; io farsi quel segno, che di laude</p>\n<p>de la divina grazia era contesto,</p>\n<p>con canti quai si sa chi l&agrave; s&ugrave; gaude.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve;: &laquo;Colui che volse il sesto</p>\n<p>a lo stremo del mondo, e dentro ad esso</p>\n<p>distinse tanto occulto e manifesto,</p></div>\n\n<div class="stanza"><p>non pot&eacute; suo valor s&igrave; fare impresso</p>\n<p>in tutto l&rsquo;universo, che &rsquo;l suo verbo</p>\n<p>non rimanesse in infinito eccesso.</p></div>\n\n<div class="stanza"><p>E ci&ograve; fa certo che &rsquo;l primo superbo,</p>\n<p>che fu la somma d&rsquo;ogne creatura,</p>\n<p>per non aspettar lume, cadde acerbo;</p></div>\n\n<div class="stanza"><p>e quinci appar ch&rsquo;ogne minor natura</p>\n<p>&egrave; corto recettacolo a quel bene</p>\n<p>che non ha fine e s&eacute; con s&eacute; misura.</p></div>\n\n<div class="stanza"><p>Dunque vostra veduta, che convene</p>\n<p>esser alcun de&rsquo; raggi de la mente</p>\n<p>di che tutte le cose son ripiene,</p></div>\n\n<div class="stanza"><p>non p&ograve; da sua natura esser possente</p>\n<p>tanto, che suo principio discerna</p>\n<p>molto di l&agrave; da quel che l&rsquo;&egrave; parvente.</p></div>\n\n<div class="stanza"><p>Per&ograve; ne la giustizia sempiterna</p>\n<p>la vista che riceve il vostro mondo,</p>\n<p>com&rsquo; occhio per lo mare, entro s&rsquo;interna;</p></div>\n\n<div class="stanza"><p>che, ben che da la proda veggia il fondo,</p>\n<p>in pelago nol vede; e nondimeno</p>\n<p>&egrave;li, ma cela lui l&rsquo;esser profondo.</p></div>\n\n<div class="stanza"><p>Lume non &egrave;, se non vien dal sereno</p>\n<p>che non si turba mai; anzi &egrave; ten&egrave;bra</p>\n<p>od ombra de la carne o suo veleno.</p></div>\n\n<div class="stanza"><p>Assai t&rsquo;&egrave; mo aperta la latebra</p>\n<p>che t&rsquo;ascondeva la giustizia viva,</p>\n<p>di che facei question cotanto crebra;</p></div>\n\n<div class="stanza"><p>ch&eacute; tu dicevi: &ldquo;Un uom nasce a la riva</p>\n<p>de l&rsquo;Indo, e quivi non &egrave; chi ragioni</p>\n<p>di Cristo n&eacute; chi legga n&eacute; chi scriva;</p></div>\n\n<div class="stanza"><p>e tutti suoi voleri e atti buoni</p>\n<p>sono, quanto ragione umana vede,</p>\n<p>sanza peccato in vita o in sermoni.</p></div>\n\n<div class="stanza"><p>Muore non battezzato e sanza fede:</p>\n<p>ov&rsquo; &egrave; questa giustizia che &rsquo;l condanna?</p>\n<p>ov&rsquo; &egrave; la colpa sua, se ei non crede?&rdquo;.</p></div>\n\n<div class="stanza"><p>Or tu chi se&rsquo;, che vuo&rsquo; sedere a scranna,</p>\n<p>per giudicar di lungi mille miglia</p>\n<p>con la veduta corta d&rsquo;una spanna?</p></div>\n\n<div class="stanza"><p>Certo a colui che meco s&rsquo;assottiglia,</p>\n<p>se la Scrittura sovra voi non fosse,</p>\n<p>da dubitar sarebbe a maraviglia.</p></div>\n\n<div class="stanza"><p>Oh terreni animali! oh menti grosse!</p>\n<p>La prima volont&agrave;, ch&rsquo;&egrave; da s&eacute; buona,</p>\n<p>da s&eacute;, ch&rsquo;&egrave; sommo ben, mai non si mosse.</p></div>\n\n<div class="stanza"><p>Cotanto &egrave; giusto quanto a lei consuona:</p>\n<p>nullo creato bene a s&eacute; la tira,</p>\n<p>ma essa, rad&iuml;ando, lui cagiona&raquo;.</p></div>\n\n<div class="stanza"><p>Quale sovresso il nido si rigira</p>\n<p>poi c&rsquo;ha pasciuti la cicogna i figli,</p>\n<p>e come quel ch&rsquo;&egrave; pasto la rimira;</p></div>\n\n<div class="stanza"><p>cotal si fece, e s&igrave; lev&auml;i i cigli,</p>\n<p>la benedetta imagine, che l&rsquo;ali</p>\n<p>movea sospinte da tanti consigli.</p></div>\n\n<div class="stanza"><p>Roteando cantava, e dicea: &laquo;Quali</p>\n<p>son le mie note a te, che non le &rsquo;ntendi,</p>\n<p>tal &egrave; il giudicio etterno a voi mortali&raquo;.</p></div>\n\n<div class="stanza"><p>Poi si quetaro quei lucenti incendi</p>\n<p>de lo Spirito Santo ancor nel segno</p>\n<p>che f&eacute; i Romani al mondo reverendi,</p></div>\n\n<div class="stanza"><p>esso ricominci&ograve;: &laquo;A questo regno</p>\n<p>non sal&igrave; mai chi non credette &rsquo;n Cristo,</p>\n<p>n&eacute; pria n&eacute; poi ch&rsquo;el si chiavasse al legno.</p></div>\n\n<div class="stanza"><p>Ma vedi: molti gridan &ldquo;Cristo, Cristo!&rdquo;,</p>\n<p>che saranno in giudicio assai men prope</p>\n<p>a lui, che tal che non conosce Cristo;</p></div>\n\n<div class="stanza"><p>e tai Cristian danner&agrave; l&rsquo;Et&iuml;&ograve;pe,</p>\n<p>quando si partiranno i due collegi,</p>\n<p>l&rsquo;uno in etterno ricco e l&rsquo;altro in&ograve;pe.</p></div>\n\n<div class="stanza"><p>Che poran dir li Perse a&rsquo; vostri regi,</p>\n<p>come vedranno quel volume aperto</p>\n<p>nel qual si scrivon tutti suoi dispregi?</p></div>\n\n<div class="stanza"><p>L&igrave; si vedr&agrave;, tra l&rsquo;opere d&rsquo;Alberto,</p>\n<p>quella che tosto mover&agrave; la penna,</p>\n<p>per che &rsquo;l regno di Praga fia diserto.</p></div>\n\n<div class="stanza"><p>L&igrave; si vedr&agrave; il duol che sovra Senna</p>\n<p>induce, falseggiando la moneta,</p>\n<p>quel che morr&agrave; di colpo di cotenna.</p></div>\n\n<div class="stanza"><p>L&igrave; si vedr&agrave; la superbia ch&rsquo;asseta,</p>\n<p>che fa lo Scotto e l&rsquo;Inghilese folle,</p>\n<p>s&igrave; che non pu&ograve; soffrir dentro a sua meta.</p></div>\n\n<div class="stanza"><p>Vedrassi la lussuria e &rsquo;l viver molle</p>\n<p>di quel di Spagna e di quel di Boemme,</p>\n<p>che mai valor non conobbe n&eacute; volle.</p></div>\n\n<div class="stanza"><p>Vedrassi al Ciotto di Ierusalemme</p>\n<p>segnata con un i la sua bontate,</p>\n<p>quando &rsquo;l contrario segner&agrave; un emme.</p></div>\n\n<div class="stanza"><p>Vedrassi l&rsquo;avarizia e la viltate</p>\n<p>di quei che guarda l&rsquo;isola del foco,</p>\n<p>ove Anchise fin&igrave; la lunga etate;</p></div>\n\n<div class="stanza"><p>e a dare ad intender quanto &egrave; poco,</p>\n<p>la sua scrittura fian lettere mozze,</p>\n<p>che noteranno molto in parvo loco.</p></div>\n\n<div class="stanza"><p>E parranno a ciascun l&rsquo;opere sozze</p>\n<p>del barba e del fratel, che tanto egregia</p>\n<p>nazione e due corone han fatte bozze.</p></div>\n\n<div class="stanza"><p>E quel di Portogallo e di Norvegia</p>\n<p>l&igrave; si conosceranno, e quel di Rascia</p>\n<p>che male ha visto il conio di Vinegia.</p></div>\n\n<div class="stanza"><p>Oh beata Ungheria, se non si lascia</p>\n<p>pi&ugrave; malmenare! e beata Navarra,</p>\n<p>se s&rsquo;armasse del monte che la fascia!</p></div>\n\n<div class="stanza"><p>E creder de&rsquo; ciascun che gi&agrave;, per arra</p>\n<p>di questo, Niccos&iuml;a e Famagosta</p>\n<p>per la lor bestia si lamenti e garra,</p></div>\n\n<div class="stanza"><p>che dal fianco de l&rsquo;altre non si scosta&raquo;.</p></div>','<p class="cantohead">Canto XX</p>\n\n<div class="stanza"><p>Quando colui che tutto &rsquo;l mondo alluma</p>\n<p>de l&rsquo;emisperio nostro s&igrave; discende,</p>\n<p>che &rsquo;l giorno d&rsquo;ogne parte si consuma,</p></div>\n\n<div class="stanza"><p>lo ciel, che sol di lui prima s&rsquo;accende,</p>\n<p>subitamente si rif&agrave; parvente</p>\n<p>per molte luci, in che una risplende;</p></div>\n\n<div class="stanza"><p>e questo atto del ciel mi venne a mente,</p>\n<p>come &rsquo;l segno del mondo e de&rsquo; suoi duci</p>\n<p>nel benedetto rostro fu tacente;</p></div>\n\n<div class="stanza"><p>per&ograve; che tutte quelle vive luci,</p>\n<p>vie pi&ugrave; lucendo, cominciaron canti</p>\n<p>da mia memoria labili e caduci.</p></div>\n\n<div class="stanza"><p>O dolce amor che di riso t&rsquo;ammanti,</p>\n<p>quanto parevi ardente in que&rsquo; flailli,</p>\n<p>ch&rsquo;avieno spirto sol di pensier santi!</p></div>\n\n<div class="stanza"><p>Poscia che i cari e lucidi lapilli</p>\n<p>ond&rsquo; io vidi ingemmato il sesto lume</p>\n<p>puoser silenzio a li angelici squilli,</p></div>\n\n<div class="stanza"><p>udir mi parve un mormorar di fiume</p>\n<p>che scende chiaro gi&ugrave; di pietra in pietra,</p>\n<p>mostrando l&rsquo;ubert&agrave; del suo cacume.</p></div>\n\n<div class="stanza"><p>E come suono al collo de la cetra</p>\n<p>prende sua forma, e s&igrave; com&rsquo; al pertugio</p>\n<p>de la sampogna vento che pen&egrave;tra,</p></div>\n\n<div class="stanza"><p>cos&igrave;, rimosso d&rsquo;aspettare indugio,</p>\n<p>quel mormorar de l&rsquo;aguglia salissi</p>\n<p>su per lo collo, come fosse bugio.</p></div>\n\n<div class="stanza"><p>Fecesi voce quivi, e quindi uscissi</p>\n<p>per lo suo becco in forma di parole,</p>\n<p>quali aspettava il core ov&rsquo; io le scrissi.</p></div>\n\n<div class="stanza"><p>&laquo;La parte in me che vede e pate il sole</p>\n<p>ne l&rsquo;aguglie mortali&raquo;, incominciommi,</p>\n<p>&laquo;or fisamente riguardar si vole,</p></div>\n\n<div class="stanza"><p>perch&eacute; d&rsquo;i fuochi ond&rsquo; io figura fommi,</p>\n<p>quelli onde l&rsquo;occhio in testa mi scintilla,</p>\n<p>e&rsquo; di tutti lor gradi son li sommi.</p></div>\n\n<div class="stanza"><p>Colui che luce in mezzo per pupilla,</p>\n<p>fu il cantor de lo Spirito Santo,</p>\n<p>che l&rsquo;arca traslat&ograve; di villa in villa:</p></div>\n\n<div class="stanza"><p>ora conosce il merto del suo canto,</p>\n<p>in quanto effetto fu del suo consiglio,</p>\n<p>per lo remunerar ch&rsquo;&egrave; altrettanto.</p></div>\n\n<div class="stanza"><p>Dei cinque che mi fan cerchio per ciglio,</p>\n<p>colui che pi&ugrave; al becco mi s&rsquo;accosta,</p>\n<p>la vedovella consol&ograve; del figlio:</p></div>\n\n<div class="stanza"><p>ora conosce quanto caro costa</p>\n<p>non seguir Cristo, per l&rsquo;esper&iuml;enza</p>\n<p>di questa dolce vita e de l&rsquo;opposta.</p></div>\n\n<div class="stanza"><p>E quel che segue in la circunferenza</p>\n<p>di che ragiono, per l&rsquo;arco superno,</p>\n<p>morte indugi&ograve; per vera penitenza:</p></div>\n\n<div class="stanza"><p>ora conosce che &rsquo;l giudicio etterno</p>\n<p>non si trasmuta, quando degno preco</p>\n<p>fa crastino l&agrave; gi&ugrave; de l&rsquo;od&iuml;erno.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro che segue, con le leggi e meco,</p>\n<p>sotto buona intenzion che f&eacute; mal frutto,</p>\n<p>per cedere al pastor si fece greco:</p></div>\n\n<div class="stanza"><p>ora conosce come il mal dedutto</p>\n<p>dal suo bene operar non li &egrave; nocivo,</p>\n<p>avvegna che sia &rsquo;l mondo indi distrutto.</p></div>\n\n<div class="stanza"><p>E quel che vedi ne l&rsquo;arco declivo,</p>\n<p>Guiglielmo fu, cui quella terra plora</p>\n<p>che piagne Carlo e Federigo vivo:</p></div>\n\n<div class="stanza"><p>ora conosce come s&rsquo;innamora</p>\n<p>lo ciel del giusto rege, e al sembiante</p>\n<p>del suo fulgore il fa vedere ancora.</p></div>\n\n<div class="stanza"><p>Chi crederebbe gi&ugrave; nel mondo errante</p>\n<p>che Rif&euml;o Troiano in questo tondo</p>\n<p>fosse la quinta de le luci sante?</p></div>\n\n<div class="stanza"><p>Ora conosce assai di quel che &rsquo;l mondo</p>\n<p>veder non pu&ograve; de la divina grazia,</p>\n<p>ben che sua vista non discerna il fondo&raquo;.</p></div>\n\n<div class="stanza"><p>Quale allodetta che &rsquo;n aere si spazia</p>\n<p>prima cantando, e poi tace contenta</p>\n<p>de l&rsquo;ultima dolcezza che la sazia,</p></div>\n\n<div class="stanza"><p>tal mi sembi&ograve; l&rsquo;imago de la &rsquo;mprenta</p>\n<p>de l&rsquo;etterno piacere, al cui disio</p>\n<p>ciascuna cosa qual ell&rsquo; &egrave; diventa.</p></div>\n\n<div class="stanza"><p>E avvegna ch&rsquo;io fossi al dubbiar mio</p>\n<p>l&igrave; quasi vetro a lo color ch&rsquo;el veste,</p>\n<p>tempo aspettar tacendo non patio,</p></div>\n\n<div class="stanza"><p>ma de la bocca, &laquo;Che cose son queste?&raquo;,</p>\n<p>mi pinse con la forza del suo peso:</p>\n<p>per ch&rsquo;io di coruscar vidi gran feste.</p></div>\n\n<div class="stanza"><p>Poi appresso, con l&rsquo;occhio pi&ugrave; acceso,</p>\n<p>lo benedetto segno mi rispuose</p>\n<p>per non tenermi in ammirar sospeso:</p></div>\n\n<div class="stanza"><p>&laquo;Io veggio che tu credi queste cose</p>\n<p>perch&rsquo; io le dico, ma non vedi come;</p>\n<p>s&igrave; che, se son credute, sono ascose.</p></div>\n\n<div class="stanza"><p>Fai come quei che la cosa per nome</p>\n<p>apprende ben, ma la sua quiditate</p>\n<p>veder non pu&ograve; se altri non la prome.</p></div>\n\n<div class="stanza"><p>Regnum celorum v&iuml;olenza pate</p>\n<p>da caldo amore e da viva speranza,</p>\n<p>che vince la divina volontate:</p></div>\n\n<div class="stanza"><p>non a guisa che l&rsquo;omo a l&rsquo;om sobranza,</p>\n<p>ma vince lei perch&eacute; vuole esser vinta,</p>\n<p>e, vinta, vince con sua beninanza.</p></div>\n\n<div class="stanza"><p>La prima vita del ciglio e la quinta</p>\n<p>ti fa maravigliar, perch&eacute; ne vedi</p>\n<p>la reg&iuml;on de li angeli dipinta.</p></div>\n\n<div class="stanza"><p>D&rsquo;i corpi suoi non uscir, come credi,</p>\n<p>Gentili, ma Cristiani, in ferma fede</p>\n<p>quel d&rsquo;i passuri e quel d&rsquo;i passi piedi.</p></div>\n\n<div class="stanza"><p>Ch&eacute; l&rsquo;una de lo &rsquo;nferno, u&rsquo; non si riede</p>\n<p>gi&agrave; mai a buon voler, torn&ograve; a l&rsquo;ossa;</p>\n<p>e ci&ograve; di viva spene fu mercede:</p></div>\n\n<div class="stanza"><p>di viva spene, che mise la possa</p>\n<p>ne&rsquo; prieghi fatti a Dio per suscitarla,</p>\n<p>s&igrave; che potesse sua voglia esser mossa.</p></div>\n\n<div class="stanza"><p>L&rsquo;anima glor&iuml;osa onde si parla,</p>\n<p>tornata ne la carne, in che fu poco,</p>\n<p>credette in lui che pot&euml;a aiutarla;</p></div>\n\n<div class="stanza"><p>e credendo s&rsquo;accese in tanto foco</p>\n<p>di vero amor, ch&rsquo;a la morte seconda</p>\n<p>fu degna di venire a questo gioco.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra, per grazia che da s&igrave; profonda</p>\n<p>fontana stilla, che mai creatura</p>\n<p>non pinse l&rsquo;occhio infino a la prima onda,</p></div>\n\n<div class="stanza"><p>tutto suo amor l&agrave; gi&ugrave; pose a drittura:</p>\n<p>per che, di grazia in grazia, Dio li aperse</p>\n<p>l&rsquo;occhio a la nostra redenzion futura;</p></div>\n\n<div class="stanza"><p>ond&rsquo; ei credette in quella, e non sofferse</p>\n<p>da indi il puzzo pi&ugrave; del paganesmo;</p>\n<p>e riprendiene le genti perverse.</p></div>\n\n<div class="stanza"><p>Quelle tre donne li fur per battesmo</p>\n<p>che tu vedesti da la destra rota,</p>\n<p>dinanzi al battezzar pi&ugrave; d&rsquo;un millesmo.</p></div>\n\n<div class="stanza"><p>O predestinazion, quanto remota</p>\n<p>&egrave; la radice tua da quelli aspetti</p>\n<p>che la prima cagion non veggion tota!</p></div>\n\n<div class="stanza"><p>E voi, mortali, tenetevi stretti</p>\n<p>a giudicar: ch&eacute; noi, che Dio vedemo,</p>\n<p>non conosciamo ancor tutti li eletti;</p></div>\n\n<div class="stanza"><p>ed &egrave;nne dolce cos&igrave; fatto scemo,</p>\n<p>perch&eacute; il ben nostro in questo ben s&rsquo;affina,</p>\n<p>che quel che vole Iddio, e noi volemo&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; da quella imagine divina,</p>\n<p>per farmi chiara la mia corta vista,</p>\n<p>data mi fu soave medicina.</p></div>\n\n<div class="stanza"><p>E come a buon cantor buon citarista</p>\n<p>fa seguitar lo guizzo de la corda,</p>\n<p>in che pi&ugrave; di piacer lo canto acquista,</p></div>\n\n<div class="stanza"><p>s&igrave;, mentre ch&rsquo;e&rsquo; parl&ograve;, s&igrave; mi ricorda</p>\n<p>ch&rsquo;io vidi le due luci benedette,</p>\n<p>pur come batter d&rsquo;occhi si concorda,</p></div>\n\n<div class="stanza"><p>con le parole mover le fiammette.</p></div>','<p class="cantohead">Canto XXI</p>\n\n<div class="stanza"><p>Gi&agrave; eran li occhi miei rifissi al volto</p>\n<p>de la mia donna, e l&rsquo;animo con essi,</p>\n<p>e da ogne altro intento s&rsquo;era tolto.</p></div>\n\n<div class="stanza"><p>E quella non ridea; ma &laquo;S&rsquo;io ridessi&raquo;,</p>\n<p>mi cominci&ograve;, &laquo;tu ti faresti quale</p>\n<p>fu Semel&egrave; quando di cener fessi:</p></div>\n\n<div class="stanza"><p>ch&eacute; la bellezza mia, che per le scale</p>\n<p>de l&rsquo;etterno palazzo pi&ugrave; s&rsquo;accende,</p>\n<p>com&rsquo; hai veduto, quanto pi&ugrave; si sale,</p></div>\n\n<div class="stanza"><p>se non si temperasse, tanto splende,</p>\n<p>che &rsquo;l tuo mortal podere, al suo fulgore,</p>\n<p>sarebbe fronda che trono scoscende.</p></div>\n\n<div class="stanza"><p>Noi sem levati al settimo splendore,</p>\n<p>che sotto &rsquo;l petto del Leone ardente</p>\n<p>raggia mo misto gi&ugrave; del suo valore.</p></div>\n\n<div class="stanza"><p>Ficca di retro a li occhi tuoi la mente,</p>\n<p>e fa di quelli specchi a la figura</p>\n<p>che &rsquo;n questo specchio ti sar&agrave; parvente&raquo;.</p></div>\n\n<div class="stanza"><p>Qual savesse qual era la pastura</p>\n<p>del viso mio ne l&rsquo;aspetto beato</p>\n<p>quand&rsquo; io mi trasmutai ad altra cura,</p></div>\n\n<div class="stanza"><p>conoscerebbe quanto m&rsquo;era a grato</p>\n<p>ubidire a la mia celeste scorta,</p>\n<p>contrapesando l&rsquo;un con l&rsquo;altro lato.</p></div>\n\n<div class="stanza"><p>Dentro al cristallo che &rsquo;l vocabol porta,</p>\n<p>cerchiando il mondo, del suo caro duce</p>\n<p>sotto cui giacque ogne malizia morta,</p></div>\n\n<div class="stanza"><p>di color d&rsquo;oro in che raggio traluce</p>\n<p>vid&rsquo; io uno scaleo eretto in suso</p>\n<p>tanto, che nol seguiva la mia luce.</p></div>\n\n<div class="stanza"><p>Vidi anche per li gradi scender giuso</p>\n<p>tanti splendor, ch&rsquo;io pensai ch&rsquo;ogne lume</p>\n<p>che par nel ciel, quindi fosse diffuso.</p></div>\n\n<div class="stanza"><p>E come, per lo natural costume,</p>\n<p>le pole insieme, al cominciar del giorno,</p>\n<p>si movono a scaldar le fredde piume;</p></div>\n\n<div class="stanza"><p>poi altre vanno via sanza ritorno,</p>\n<p>altre rivolgon s&eacute; onde son mosse,</p>\n<p>e altre roteando fan soggiorno;</p></div>\n\n<div class="stanza"><p>tal modo parve me che quivi fosse</p>\n<p>in quello sfavillar che &rsquo;nsieme venne,</p>\n<p>s&igrave; come in certo grado si percosse.</p></div>\n\n<div class="stanza"><p>E quel che presso pi&ugrave; ci si ritenne,</p>\n<p>si f&eacute; s&igrave; chiaro, ch&rsquo;io dicea pensando:</p>\n<p>&lsquo;Io veggio ben l&rsquo;amor che tu m&rsquo;accenne.</p></div>\n\n<div class="stanza"><p>Ma quella ond&rsquo; io aspetto il come e &rsquo;l quando</p>\n<p>del dire e del tacer, si sta; ond&rsquo; io,</p>\n<p>contra &rsquo;l disio, fo ben ch&rsquo;io non dimando&rsquo;.</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;ella, che ved&euml;a il tacer mio</p>\n<p>nel veder di colui che tutto vede,</p>\n<p>mi disse: &laquo;Solvi il tuo caldo disio&raquo;.</p></div>\n\n<div class="stanza"><p>E io incominciai: &laquo;La mia mercede</p>\n<p>non mi fa degno de la tua risposta;</p>\n<p>ma per colei che &rsquo;l chieder mi concede,</p></div>\n\n<div class="stanza"><p>vita beata che ti stai nascosta</p>\n<p>dentro a la tua letizia, fammi nota</p>\n<p>la cagion che s&igrave; presso mi t&rsquo;ha posta;</p></div>\n\n<div class="stanza"><p>e d&igrave; perch&eacute; si tace in questa rota</p>\n<p>la dolce sinfonia di paradiso,</p>\n<p>che gi&ugrave; per l&rsquo;altre suona s&igrave; divota&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Tu hai l&rsquo;udir mortal s&igrave; come il viso&raquo;,</p>\n<p>rispuose a me; &laquo;onde qui non si canta</p>\n<p>per quel che B&euml;atrice non ha riso.</p></div>\n\n<div class="stanza"><p>Gi&ugrave; per li gradi de la scala santa</p>\n<p>discesi tanto sol per farti festa</p>\n<p>col dire e con la luce che mi ammanta;</p></div>\n\n<div class="stanza"><p>n&eacute; pi&ugrave; amor mi fece esser pi&ugrave; presta,</p>\n<p>ch&eacute; pi&ugrave; e tanto amor quinci s&ugrave; ferve,</p>\n<p>s&igrave; come il fiammeggiar ti manifesta.</p></div>\n\n<div class="stanza"><p>Ma l&rsquo;alta carit&agrave;, che ci fa serve</p>\n<p>pronte al consiglio che &rsquo;l mondo governa,</p>\n<p>sorteggia qui s&igrave; come tu osserve&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io veggio ben&raquo;, diss&rsquo; io, &laquo;sacra lucerna,</p>\n<p>come libero amore in questa corte</p>\n<p>basta a seguir la provedenza etterna;</p></div>\n\n<div class="stanza"><p>ma questo &egrave; quel ch&rsquo;a cerner mi par forte,</p>\n<p>perch&eacute; predestinata fosti sola</p>\n<p>a questo officio tra le tue consorte&raquo;.</p></div>\n\n<div class="stanza"><p>N&eacute; venni prima a l&rsquo;ultima parola,</p>\n<p>che del suo mezzo fece il lume centro,</p>\n<p>girando s&eacute; come veloce mola;</p></div>\n\n<div class="stanza"><p>poi rispuose l&rsquo;amor che v&rsquo;era dentro:</p>\n<p>&laquo;Luce divina sopra me s&rsquo;appunta,</p>\n<p>penetrando per questa in ch&rsquo;io m&rsquo;inventro,</p></div>\n\n<div class="stanza"><p>la cui virt&ugrave;, col mio veder congiunta,</p>\n<p>mi leva sopra me tanto, ch&rsquo;i&rsquo; veggio</p>\n<p>la somma essenza de la quale &egrave; munta.</p></div>\n\n<div class="stanza"><p>Quinci vien l&rsquo;allegrezza ond&rsquo; io fiammeggio;</p>\n<p>per ch&rsquo;a la vista mia, quant&rsquo; ella &egrave; chiara,</p>\n<p>la chiarit&agrave; de la fiamma pareggio.</p></div>\n\n<div class="stanza"><p>Ma quell&rsquo; alma nel ciel che pi&ugrave; si schiara,</p>\n<p>quel serafin che &rsquo;n Dio pi&ugrave; l&rsquo;occhio ha fisso,</p>\n<p>a la dimanda tua non satisfara,</p></div>\n\n<div class="stanza"><p>per&ograve; che s&igrave; s&rsquo;innoltra ne lo abisso</p>\n<p>de l&rsquo;etterno statuto quel che chiedi,</p>\n<p>che da ogne creata vista &egrave; scisso.</p></div>\n\n<div class="stanza"><p>E al mondo mortal, quando tu riedi,</p>\n<p>questo rapporta, s&igrave; che non presumma</p>\n<p>a tanto segno pi&ugrave; mover li piedi.</p></div>\n\n<div class="stanza"><p>La mente, che qui luce, in terra fumma;</p>\n<p>onde riguarda come pu&ograve; l&agrave; gi&ugrave;e</p>\n<p>quel che non pote perch&eacute; &rsquo;l ciel l&rsquo;assumma&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; mi prescrisser le parole sue,</p>\n<p>ch&rsquo;io lasciai la quistione e mi ritrassi</p>\n<p>a dimandarla umilmente chi fue.</p></div>\n\n<div class="stanza"><p>&laquo;Tra &rsquo; due liti d&rsquo;Italia surgon sassi,</p>\n<p>e non molto distanti a la tua patria,</p>\n<p>tanto che &rsquo; troni assai suonan pi&ugrave; bassi,</p></div>\n\n<div class="stanza"><p>e fanno un gibbo che si chiama Catria,</p>\n<p>di sotto al quale &egrave; consecrato un ermo,</p>\n<p>che suole esser disposto a sola latria&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; ricominciommi il terzo sermo;</p>\n<p>e poi, contin&uuml;ando, disse: &laquo;Quivi</p>\n<p>al servigio di Dio mi fe&rsquo; s&igrave; fermo,</p></div>\n\n<div class="stanza"><p>che pur con cibi di liquor d&rsquo;ulivi</p>\n<p>lievemente passava caldi e geli,</p>\n<p>contento ne&rsquo; pensier contemplativi.</p></div>\n\n<div class="stanza"><p>Render solea quel chiostro a questi cieli</p>\n<p>fertilemente; e ora &egrave; fatto vano,</p>\n<p>s&igrave; che tosto convien che si riveli.</p></div>\n\n<div class="stanza"><p>In quel loco fu&rsquo; io Pietro Damiano,</p>\n<p>e Pietro Peccator fu&rsquo; ne la casa</p>\n<p>di Nostra Donna in sul lito adriano.</p></div>\n\n<div class="stanza"><p>Poca vita mortal m&rsquo;era rimasa,</p>\n<p>quando fui chiesto e tratto a quel cappello,</p>\n<p>che pur di male in peggio si travasa.</p></div>\n\n<div class="stanza"><p>Venne Cef&agrave;s e venne il gran vasello</p>\n<p>de lo Spirito Santo, magri e scalzi,</p>\n<p>prendendo il cibo da qualunque ostello.</p></div>\n\n<div class="stanza"><p>Or voglion quinci e quindi chi rincalzi</p>\n<p>li moderni pastori e chi li meni,</p>\n<p>tanto son gravi, e chi di rietro li alzi.</p></div>\n\n<div class="stanza"><p>Cuopron d&rsquo;i manti loro i palafreni,</p>\n<p>s&igrave; che due bestie van sott&rsquo; una pelle:</p>\n<p>oh paz&iuml;enza che tanto sostieni!&raquo;.</p></div>\n\n<div class="stanza"><p>A questa voce vid&rsquo; io pi&ugrave; fiammelle</p>\n<p>di grado in grado scendere e girarsi,</p>\n<p>e ogne giro le facea pi&ugrave; belle.</p></div>\n\n<div class="stanza"><p>Dintorno a questa vennero e fermarsi,</p>\n<p>e fero un grido di s&igrave; alto suono,</p>\n<p>che non potrebbe qui assomigliarsi;</p></div>\n\n<div class="stanza"><p>n&eacute; io lo &rsquo;ntesi, s&igrave; mi vinse il tuono.</p></div>','<p class="cantohead">Canto XXII</p>\n\n<div class="stanza"><p>Oppresso di stupore, a la mia guida</p>\n<p>mi volsi, come parvol che ricorre</p>\n<p>sempre col&agrave; dove pi&ugrave; si confida;</p></div>\n\n<div class="stanza"><p>e quella, come madre che soccorre</p>\n<p>s&ugrave;bito al figlio palido e anelo</p>\n<p>con la sua voce, che &rsquo;l suol ben disporre,</p></div>\n\n<div class="stanza"><p>mi disse: &laquo;Non sai tu che tu se&rsquo; in cielo?</p>\n<p>e non sai tu che &rsquo;l cielo &egrave; tutto santo,</p>\n<p>e ci&ograve; che ci si fa vien da buon zelo?</p></div>\n\n<div class="stanza"><p>Come t&rsquo;avrebbe trasmutato il canto,</p>\n<p>e io ridendo, mo pensar lo puoi,</p>\n<p>poscia che &rsquo;l grido t&rsquo;ha mosso cotanto;</p></div>\n\n<div class="stanza"><p>nel qual, se &rsquo;nteso avessi i prieghi suoi,</p>\n<p>gi&agrave; ti sarebbe nota la vendetta</p>\n<p>che tu vedrai innanzi che tu muoi.</p></div>\n\n<div class="stanza"><p>La spada di qua s&ugrave; non taglia in fretta</p>\n<p>n&eacute; tardo, ma&rsquo; ch&rsquo;al parer di colui</p>\n<p>che dis&iuml;ando o temendo l&rsquo;aspetta.</p></div>\n\n<div class="stanza"><p>Ma rivolgiti omai inverso altrui;</p>\n<p>ch&rsquo;assai illustri spiriti vedrai,</p>\n<p>se com&rsquo; io dico l&rsquo;aspetto redui&raquo;.</p></div>\n\n<div class="stanza"><p>Come a lei piacque, li occhi ritornai,</p>\n<p>e vidi cento sperule che &rsquo;nsieme</p>\n<p>pi&ugrave; s&rsquo;abbellivan con mut&uuml;i rai.</p></div>\n\n<div class="stanza"><p>Io stava come quei che &rsquo;n s&eacute; repreme</p>\n<p>la punta del disio, e non s&rsquo;attenta</p>\n<p>di domandar, s&igrave; del troppo si teme;</p></div>\n\n<div class="stanza"><p>e la maggiore e la pi&ugrave; luculenta</p>\n<p>di quelle margherite innanzi fessi,</p>\n<p>per far di s&eacute; la mia voglia contenta.</p></div>\n\n<div class="stanza"><p>Poi dentro a lei udi&rsquo;: &laquo;Se tu vedessi</p>\n<p>com&rsquo; io la carit&agrave; che tra noi arde,</p>\n<p>li tuoi concetti sarebbero espressi.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; tu, aspettando, non tarde</p>\n<p>a l&rsquo;alto fine, io ti far&ograve; risposta</p>\n<p>pur al pensier, da che s&igrave; ti riguarde.</p></div>\n\n<div class="stanza"><p>Quel monte a cui Cassino &egrave; ne la costa</p>\n<p>fu frequentato gi&agrave; in su la cima</p>\n<p>da la gente ingannata e mal disposta;</p></div>\n\n<div class="stanza"><p>e quel son io che s&ugrave; vi portai prima</p>\n<p>lo nome di colui che &rsquo;n terra addusse</p>\n<p>la verit&agrave; che tanto ci soblima;</p></div>\n\n<div class="stanza"><p>e tanta grazia sopra me relusse,</p>\n<p>ch&rsquo;io ritrassi le ville circunstanti</p>\n<p>da l&rsquo;empio c&oacute;lto che &rsquo;l mondo sedusse.</p></div>\n\n<div class="stanza"><p>Questi altri fuochi tutti contemplanti</p>\n<p>uomini fuoro, accesi di quel caldo</p>\n<p>che fa nascere i fiori e &rsquo; frutti santi.</p></div>\n\n<div class="stanza"><p>Qui &egrave; Maccario, qui &egrave; Romoaldo,</p>\n<p>qui son li frati miei che dentro ai chiostri</p>\n<p>fermar li piedi e tennero il cor saldo&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;L&rsquo;affetto che dimostri</p>\n<p>meco parlando, e la buona sembianza</p>\n<p>ch&rsquo;io veggio e noto in tutti li ardor vostri,</p></div>\n\n<div class="stanza"><p>cos&igrave; m&rsquo;ha dilatata mia fidanza,</p>\n<p>come &rsquo;l sol fa la rosa quando aperta</p>\n<p>tanto divien quant&rsquo; ell&rsquo; ha di possanza.</p></div>\n\n<div class="stanza"><p>Per&ograve; ti priego, e tu, padre, m&rsquo;accerta</p>\n<p>s&rsquo;io posso prender tanta grazia, ch&rsquo;io</p>\n<p>ti veggia con imagine scoverta&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli: &laquo;Frate, il tuo alto disio</p>\n<p>s&rsquo;adempier&agrave; in su l&rsquo;ultima spera,</p>\n<p>ove s&rsquo;adempion tutti li altri e &rsquo;l mio.</p></div>\n\n<div class="stanza"><p>Ivi &egrave; perfetta, matura e intera</p>\n<p>ciascuna dis&iuml;anza; in quella sola</p>\n<p>&egrave; ogne parte l&agrave; ove sempr&rsquo; era,</p></div>\n\n<div class="stanza"><p>perch&eacute; non &egrave; in loco e non s&rsquo;impola;</p>\n<p>e nostra scala infino ad essa varca,</p>\n<p>onde cos&igrave; dal viso ti s&rsquo;invola.</p></div>\n\n<div class="stanza"><p>Infin l&agrave; s&ugrave; la vide il patriarca</p>\n<p>Iacobbe porger la superna parte,</p>\n<p>quando li apparve d&rsquo;angeli s&igrave; carca.</p></div>\n\n<div class="stanza"><p>Ma, per salirla, mo nessun diparte</p>\n<p>da terra i piedi, e la regola mia</p>\n<p>rimasa &egrave; per danno de le carte.</p></div>\n\n<div class="stanza"><p>Le mura che solieno esser badia</p>\n<p>fatte sono spelonche, e le cocolle</p>\n<p>sacca son piene di farina ria.</p></div>\n\n<div class="stanza"><p>Ma grave usura tanto non si tolle</p>\n<p>contra &rsquo;l piacer di Dio, quanto quel frutto</p>\n<p>che fa il cor de&rsquo; monaci s&igrave; folle;</p></div>\n\n<div class="stanza"><p>ch&eacute; quantunque la Chiesa guarda, tutto</p>\n<p>&egrave; de la gente che per Dio dimanda;</p>\n<p>non di parenti n&eacute; d&rsquo;altro pi&ugrave; brutto.</p></div>\n\n<div class="stanza"><p>La carne d&rsquo;i mortali &egrave; tanto blanda,</p>\n<p>che gi&ugrave; non basta buon cominciamento</p>\n<p>dal nascer de la quercia al far la ghianda.</p></div>\n\n<div class="stanza"><p>Pier cominci&ograve; sanz&rsquo; oro e sanz&rsquo; argento,</p>\n<p>e io con orazione e con digiuno,</p>\n<p>e Francesco umilmente il suo convento;</p></div>\n\n<div class="stanza"><p>e se guardi &rsquo;l principio di ciascuno,</p>\n<p>poscia riguardi l&agrave; dov&rsquo; &egrave; trascorso,</p>\n<p>tu vederai del bianco fatto bruno.</p></div>\n\n<div class="stanza"><p>Veramente Iordan v&ograve;lto retrorso</p>\n<p>pi&ugrave; fu, e &rsquo;l mar fuggir, quando Dio volse,</p>\n<p>mirabile a veder che qui &rsquo;l soccorso&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; mi disse, e indi si raccolse</p>\n<p>al suo collegio, e &rsquo;l collegio si strinse;</p>\n<p>poi, come turbo, in s&ugrave; tutto s&rsquo;avvolse.</p></div>\n\n<div class="stanza"><p>La dolce donna dietro a lor mi pinse</p>\n<p>con un sol cenno su per quella scala,</p>\n<p>s&igrave; sua virt&ugrave; la mia natura vinse;</p></div>\n\n<div class="stanza"><p>n&eacute; mai qua gi&ugrave; dove si monta e cala</p>\n<p>naturalmente, fu s&igrave; ratto moto</p>\n<p>ch&rsquo;agguagliar si potesse a la mia ala.</p></div>\n\n<div class="stanza"><p>S&rsquo;io torni mai, lettore, a quel divoto</p>\n<p>tr&iuml;unfo per lo quale io piango spesso</p>\n<p>le mie peccata e &rsquo;l petto mi percuoto,</p></div>\n\n<div class="stanza"><p>tu non avresti in tanto tratto e messo</p>\n<p>nel foco il dito, in quant&rsquo; io vidi &rsquo;l segno</p>\n<p>che segue il Tauro e fui dentro da esso.</p></div>\n\n<div class="stanza"><p>O glor&iuml;ose stelle, o lume pregno</p>\n<p>di gran virt&ugrave;, dal quale io riconosco</p>\n<p>tutto, qual che si sia, il mio ingegno,</p></div>\n\n<div class="stanza"><p>con voi nasceva e s&rsquo;ascondeva vosco</p>\n<p>quelli ch&rsquo;&egrave; padre d&rsquo;ogne mortal vita,</p>\n<p>quand&rsquo; io senti&rsquo; di prima l&rsquo;aere tosco;</p></div>\n\n<div class="stanza"><p>e poi, quando mi fu grazia largita</p>\n<p>d&rsquo;entrar ne l&rsquo;alta rota che vi gira,</p>\n<p>la vostra reg&iuml;on mi fu sortita.</p></div>\n\n<div class="stanza"><p>A voi divotamente ora sospira</p>\n<p>l&rsquo;anima mia, per acquistar virtute</p>\n<p>al passo forte che a s&eacute; la tira.</p></div>\n\n<div class="stanza"><p>&laquo;Tu se&rsquo; s&igrave; presso a l&rsquo;ultima salute&raquo;,</p>\n<p>cominci&ograve; B&euml;atrice, &laquo;che tu dei</p>\n<p>aver le luci tue chiare e acute;</p></div>\n\n<div class="stanza"><p>e per&ograve;, prima che tu pi&ugrave; t&rsquo;inlei,</p>\n<p>rimira in gi&ugrave;, e vedi quanto mondo</p>\n<p>sotto li piedi gi&agrave; esser ti fei;</p></div>\n\n<div class="stanza"><p>s&igrave; che &rsquo;l tuo cor, quantunque pu&ograve;, giocondo</p>\n<p>s&rsquo;appresenti a la turba tr&iuml;unfante</p>\n<p>che lieta vien per questo etera tondo&raquo;.</p></div>\n\n<div class="stanza"><p>Col viso ritornai per tutte quante</p>\n<p>le sette spere, e vidi questo globo</p>\n<p>tal, ch&rsquo;io sorrisi del suo vil sembiante;</p></div>\n\n<div class="stanza"><p>e quel consiglio per migliore approbo</p>\n<p>che l&rsquo;ha per meno; e chi ad altro pensa</p>\n<p>chiamar si puote veramente probo.</p></div>\n\n<div class="stanza"><p>Vidi la figlia di Latona incensa</p>\n<p>sanza quell&rsquo; ombra che mi fu cagione</p>\n<p>per che gi&agrave; la credetti rara e densa.</p></div>\n\n<div class="stanza"><p>L&rsquo;aspetto del tuo nato, Iper&iuml;one,</p>\n<p>quivi sostenni, e vidi com&rsquo; si move</p>\n<p>circa e vicino a lui Maia e D&iuml;one.</p></div>\n\n<div class="stanza"><p>Quindi m&rsquo;apparve il temperar di Giove</p>\n<p>tra &rsquo;l padre e &rsquo;l figlio; e quindi mi fu chiaro</p>\n<p>il var&iuml;ar che fanno di lor dove;</p></div>\n\n<div class="stanza"><p>e tutti e sette mi si dimostraro</p>\n<p>quanto son grandi e quanto son veloci</p>\n<p>e come sono in distante riparo.</p></div>\n\n<div class="stanza"><p>L&rsquo;aiuola che ci fa tanto feroci,</p>\n<p>volgendom&rsquo; io con li etterni Gemelli,</p>\n<p>tutta m&rsquo;apparve da&rsquo; colli a le foci;</p></div>\n\n<div class="stanza"><p>poscia rivolsi li occhi a li occhi belli.</p></div>','<p class="cantohead">Canto XXIII</p>\n\n<div class="stanza"><p>Come l&rsquo;augello, intra l&rsquo;amate fronde,</p>\n<p>posato al nido de&rsquo; suoi dolci nati</p>\n<p>la notte che le cose ci nasconde,</p></div>\n\n<div class="stanza"><p>che, per veder li aspetti dis&iuml;ati</p>\n<p>e per trovar lo cibo onde li pasca,</p>\n<p>in che gravi labor li sono aggrati,</p></div>\n\n<div class="stanza"><p>previene il tempo in su aperta frasca,</p>\n<p>e con ardente affetto il sole aspetta,</p>\n<p>fiso guardando pur che l&rsquo;alba nasca;</p></div>\n\n<div class="stanza"><p>cos&igrave; la donna m&iuml;a stava eretta</p>\n<p>e attenta, rivolta inver&rsquo; la plaga</p>\n<p>sotto la quale il sol mostra men fretta:</p></div>\n\n<div class="stanza"><p>s&igrave; che, veggendola io sospesa e vaga,</p>\n<p>fecimi qual &egrave; quei che dis&iuml;ando</p>\n<p>altro vorria, e sperando s&rsquo;appaga.</p></div>\n\n<div class="stanza"><p>Ma poco fu tra uno e altro quando,</p>\n<p>del mio attender, dico, e del vedere</p>\n<p>lo ciel venir pi&ugrave; e pi&ugrave; rischiarando;</p></div>\n\n<div class="stanza"><p>e B&euml;atrice disse: &laquo;Ecco le schiere</p>\n<p>del tr&iuml;unfo di Cristo e tutto &rsquo;l frutto</p>\n<p>ricolto del girar di queste spere!&raquo;.</p></div>\n\n<div class="stanza"><p>Pariemi che &rsquo;l suo viso ardesse tutto,</p>\n<p>e li occhi avea di letizia s&igrave; pieni,</p>\n<p>che passarmen convien sanza costrutto.</p></div>\n\n<div class="stanza"><p>Quale ne&rsquo; plenilun&iuml;i sereni</p>\n<p>Triv&iuml;a ride tra le ninfe etterne</p>\n<p>che dipingon lo ciel per tutti i seni,</p></div>\n\n<div class="stanza"><p>vid&rsquo; i&rsquo; sopra migliaia di lucerne</p>\n<p>un sol che tutte quante l&rsquo;accendea,</p>\n<p>come fa &rsquo;l nostro le viste superne;</p></div>\n\n<div class="stanza"><p>e per la viva luce trasparea</p>\n<p>la lucente sustanza tanto chiara</p>\n<p>nel viso mio, che non la sostenea.</p></div>\n\n<div class="stanza"><p>Oh B&euml;atrice, dolce guida e cara!</p>\n<p>Ella mi disse: &laquo;Quel che ti sobranza</p>\n<p>&egrave; virt&ugrave; da cui nulla si ripara.</p></div>\n\n<div class="stanza"><p>Quivi &egrave; la sap&iuml;enza e la possanza</p>\n<p>ch&rsquo;apr&igrave; le strade tra &rsquo;l cielo e la terra,</p>\n<p>onde fu gi&agrave; s&igrave; lunga dis&iuml;anza&raquo;.</p></div>\n\n<div class="stanza"><p>Come foco di nube si diserra</p>\n<p>per dilatarsi s&igrave; che non vi cape,</p>\n<p>e fuor di sua natura in gi&ugrave; s&rsquo;atterra,</p></div>\n\n<div class="stanza"><p>la mente mia cos&igrave;, tra quelle dape</p>\n<p>fatta pi&ugrave; grande, di s&eacute; stessa usc&igrave;o,</p>\n<p>e che si fesse rimembrar non sape.</p></div>\n\n<div class="stanza"><p>&laquo;Apri li occhi e riguarda qual son io;</p>\n<p>tu hai vedute cose, che possente</p>\n<p>se&rsquo; fatto a sostener lo riso mio&raquo;.</p></div>\n\n<div class="stanza"><p>Io era come quei che si risente</p>\n<p>di vis&iuml;one oblita e che s&rsquo;ingegna</p>\n<p>indarno di ridurlasi a la mente,</p></div>\n\n<div class="stanza"><p>quand&rsquo; io udi&rsquo; questa proferta, degna</p>\n<p>di tanto grato, che mai non si stingue</p>\n<p>del libro che &rsquo;l preterito rassegna.</p></div>\n\n<div class="stanza"><p>Se mo sonasser tutte quelle lingue</p>\n<p>che Polimn&iuml;a con le suore fero</p>\n<p>del latte lor dolcissimo pi&ugrave; pingue,</p></div>\n\n<div class="stanza"><p>per aiutarmi, al millesmo del vero</p>\n<p>non si verria, cantando il santo riso</p>\n<p>e quanto il santo aspetto facea mero;</p></div>\n\n<div class="stanza"><p>e cos&igrave;, figurando il paradiso,</p>\n<p>convien saltar lo sacrato poema,</p>\n<p>come chi trova suo cammin riciso.</p></div>\n\n<div class="stanza"><p>Ma chi pensasse il ponderoso tema</p>\n<p>e l&rsquo;omero mortal che se ne carca,</p>\n<p>nol biasmerebbe se sott&rsquo; esso trema:</p></div>\n\n<div class="stanza"><p>non &egrave; pareggio da picciola barca</p>\n<p>quel che fendendo va l&rsquo;ardita prora,</p>\n<p>n&eacute; da nocchier ch&rsquo;a s&eacute; medesmo parca.</p></div>\n\n<div class="stanza"><p>&laquo;Perch&eacute; la faccia mia s&igrave; t&rsquo;innamora,</p>\n<p>che tu non ti rivolgi al bel giardino</p>\n<p>che sotto i raggi di Cristo s&rsquo;infiora?</p></div>\n\n<div class="stanza"><p>Quivi &egrave; la rosa in che &rsquo;l verbo divino</p>\n<p>carne si fece; quivi son li gigli</p>\n<p>al cui odor si prese il buon cammino&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; Beatrice; e io, che a&rsquo; suoi consigli</p>\n<p>tutto era pronto, ancora mi rendei</p>\n<p>a la battaglia de&rsquo; debili cigli.</p></div>\n\n<div class="stanza"><p>Come a raggio di sol, che puro mei</p>\n<p>per fratta nube, gi&agrave; prato di fiori</p>\n<p>vider, coverti d&rsquo;ombra, li occhi miei;</p></div>\n\n<div class="stanza"><p>vid&rsquo; io cos&igrave; pi&ugrave; turbe di splendori,</p>\n<p>folgorate di s&ugrave; da raggi ardenti,</p>\n<p>sanza veder principio di folg&oacute;ri.</p></div>\n\n<div class="stanza"><p>O benigna vert&ugrave; che s&igrave; li &rsquo;mprenti,</p>\n<p>s&ugrave; t&rsquo;essaltasti, per largirmi loco</p>\n<p>a li occhi l&igrave; che non t&rsquo;eran possenti.</p></div>\n\n<div class="stanza"><p>Il nome del bel fior ch&rsquo;io sempre invoco</p>\n<p>e mane e sera, tutto mi ristrinse</p>\n<p>l&rsquo;animo ad avvisar lo maggior foco;</p></div>\n\n<div class="stanza"><p>e come ambo le luci mi dipinse</p>\n<p>il quale e il quanto de la viva stella</p>\n<p>che l&agrave; s&ugrave; vince come qua gi&ugrave; vinse,</p></div>\n\n<div class="stanza"><p>per entro il cielo scese una facella,</p>\n<p>formata in cerchio a guisa di corona,</p>\n<p>e cinsela e girossi intorno ad ella.</p></div>\n\n<div class="stanza"><p>Qualunque melodia pi&ugrave; dolce suona</p>\n<p>qua gi&ugrave; e pi&ugrave; a s&eacute; l&rsquo;anima tira,</p>\n<p>parrebbe nube che squarciata tona,</p></div>\n\n<div class="stanza"><p>comparata al sonar di quella lira</p>\n<p>onde si coronava il bel zaffiro</p>\n<p>del quale il ciel pi&ugrave; chiaro s&rsquo;inzaffira.</p></div>\n\n<div class="stanza"><p>&laquo;Io sono amore angelico, che giro</p>\n<p>l&rsquo;alta letizia che spira del ventre</p>\n<p>che fu albergo del nostro disiro;</p></div>\n\n<div class="stanza"><p>e girerommi, donna del ciel, mentre</p>\n<p>che seguirai tuo figlio, e farai dia</p>\n<p>pi&ugrave; la spera suprema perch&eacute; l&igrave; entre&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la circulata melodia</p>\n<p>si sigillava, e tutti li altri lumi</p>\n<p>facean sonare il nome di Maria.</p></div>\n\n<div class="stanza"><p>Lo real manto di tutti i volumi</p>\n<p>del mondo, che pi&ugrave; ferve e pi&ugrave; s&rsquo;avviva</p>\n<p>ne l&rsquo;alito di Dio e nei costumi,</p></div>\n\n<div class="stanza"><p>avea sopra di noi l&rsquo;interna riva</p>\n<p>tanto distante, che la sua parvenza,</p>\n<p>l&agrave; dov&rsquo; io era, ancor non appariva:</p></div>\n\n<div class="stanza"><p>per&ograve; non ebber li occhi miei potenza</p>\n<p>di seguitar la coronata fiamma</p>\n<p>che si lev&ograve; appresso sua semenza.</p></div>\n\n<div class="stanza"><p>E come fantolin che &rsquo;nver&rsquo; la mamma</p>\n<p>tende le braccia, poi che &rsquo;l latte prese,</p>\n<p>per l&rsquo;animo che &rsquo;nfin di fuor s&rsquo;infiamma;</p></div>\n\n<div class="stanza"><p>ciascun di quei candori in s&ugrave; si stese</p>\n<p>con la sua cima, s&igrave; che l&rsquo;alto affetto</p>\n<p>ch&rsquo;elli avieno a Maria mi fu palese.</p></div>\n\n<div class="stanza"><p>Indi rimaser l&igrave; nel mio cospetto,</p>\n<p>&lsquo;Regina celi&rsquo; cantando s&igrave; dolce,</p>\n<p>che mai da me non si part&igrave; &rsquo;l diletto.</p></div>\n\n<div class="stanza"><p>Oh quanta &egrave; l&rsquo;ubert&agrave; che si soffolce</p>\n<p>in quelle arche ricchissime che fuoro</p>\n<p>a seminar qua gi&ugrave; buone bobolce!</p></div>\n\n<div class="stanza"><p>Quivi si vive e gode del tesoro</p>\n<p>che s&rsquo;acquist&ograve; piangendo ne lo essilio</p>\n<p>di Babill&ograve;n, ove si lasci&ograve; l&rsquo;oro.</p></div>\n\n<div class="stanza"><p>Quivi tr&iuml;unfa, sotto l&rsquo;alto Filio</p>\n<p>di Dio e di Maria, di sua vittoria,</p>\n<p>e con l&rsquo;antico e col novo concilio,</p></div>\n\n<div class="stanza"><p>colui che tien le chiavi di tal gloria.</p></div>','<p class="cantohead">Canto XXIV</p>\n\n<div class="stanza"><p>&laquo;O sodalizio eletto a la gran cena</p>\n<p>del benedetto Agnello, il qual vi ciba</p>\n<p>s&igrave;, che la vostra voglia &egrave; sempre piena,</p></div>\n\n<div class="stanza"><p>se per grazia di Dio questi preliba</p>\n<p>di quel che cade de la vostra mensa,</p>\n<p>prima che morte tempo li prescriba,</p></div>\n\n<div class="stanza"><p>ponete mente a l&rsquo;affezione immensa</p>\n<p>e roratelo alquanto: voi bevete</p>\n<p>sempre del fonte onde vien quel ch&rsquo;ei pensa&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; Beatrice; e quelle anime liete</p>\n<p>si fero spere sopra fissi poli,</p>\n<p>fiammando, a volte, a guisa di comete.</p></div>\n\n<div class="stanza"><p>E come cerchi in tempra d&rsquo;or&iuml;uoli</p>\n<p>si giran s&igrave;, che &rsquo;l primo a chi pon mente</p>\n<p>qu&iuml;eto pare, e l&rsquo;ultimo che voli;</p></div>\n\n<div class="stanza"><p>cos&igrave; quelle carole, differente-</p>\n<p>mente danzando, de la sua ricchezza</p>\n<p>mi facieno stimar, veloci e lente.</p></div>\n\n<div class="stanza"><p>Di quella ch&rsquo;io notai di pi&ugrave; carezza</p>\n<p>vid&rsquo; &iuml;o uscire un foco s&igrave; felice,</p>\n<p>che nullo vi lasci&ograve; di pi&ugrave; chiarezza;</p></div>\n\n<div class="stanza"><p>e tre f&iuml;ate intorno di Beatrice</p>\n<p>si volse con un canto tanto divo,</p>\n<p>che la mia fantasia nol mi ridice.</p></div>\n\n<div class="stanza"><p>Per&ograve; salta la penna e non lo scrivo:</p>\n<p>ch&eacute; l&rsquo;imagine nostra a cotai pieghe,</p>\n<p>non che &rsquo;l parlare, &egrave; troppo color vivo.</p></div>\n\n<div class="stanza"><p>&laquo;O santa suora mia che s&igrave; ne prieghe</p>\n<p>divota, per lo tuo ardente affetto</p>\n<p>da quella bella spera mi disleghe&raquo;.</p></div>\n\n<div class="stanza"><p>Poscia fermato, il foco benedetto</p>\n<p>a la mia donna dirizz&ograve; lo spiro,</p>\n<p>che favell&ograve; cos&igrave; com&rsquo; i&rsquo; ho detto.</p></div>\n\n<div class="stanza"><p>Ed ella: &laquo;O luce etterna del gran viro</p>\n<p>a cui Nostro Segnor lasci&ograve; le chiavi,</p>\n<p>ch&rsquo;ei port&ograve; gi&ugrave;, di questo gaudio miro,</p></div>\n\n<div class="stanza"><p>tenta costui di punti lievi e gravi,</p>\n<p>come ti piace, intorno de la fede,</p>\n<p>per la qual tu su per lo mare andavi.</p></div>\n\n<div class="stanza"><p>S&rsquo;elli ama bene e bene spera e crede,</p>\n<p>non t&rsquo;&egrave; occulto, perch&eacute; &rsquo;l viso hai quivi</p>\n<p>dov&rsquo; ogne cosa dipinta si vede;</p></div>\n\n<div class="stanza"><p>ma perch&eacute; questo regno ha fatto civi</p>\n<p>per la verace fede, a glor&iuml;arla,</p>\n<p>di lei parlare &egrave; ben ch&rsquo;a lui arrivi&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; come il baccialier s&rsquo;arma e non parla</p>\n<p>fin che &rsquo;l maestro la question propone,</p>\n<p>per approvarla, non per terminarla,</p></div>\n\n<div class="stanza"><p>cos&igrave; m&rsquo;armava io d&rsquo;ogne ragione</p>\n<p>mentre ch&rsquo;ella dicea, per esser presto</p>\n<p>a tal querente e a tal professione.</p></div>\n\n<div class="stanza"><p>&laquo;D&igrave;, buon Cristiano, fatti manifesto:</p>\n<p>fede che &egrave;?&raquo;. Ond&rsquo; io levai la fronte</p>\n<p>in quella luce onde spirava questo;</p></div>\n\n<div class="stanza"><p>poi mi volsi a Beatrice, ed essa pronte</p>\n<p>sembianze femmi perch&rsquo; &iuml;o spandessi</p>\n<p>l&rsquo;acqua di fuor del mio interno fonte.</p></div>\n\n<div class="stanza"><p>&laquo;La Grazia che mi d&agrave; ch&rsquo;io mi confessi&raquo;,</p>\n<p>comincia&rsquo; io, &laquo;da l&rsquo;alto primipilo,</p>\n<p>faccia li miei concetti bene espressi&raquo;.</p></div>\n\n<div class="stanza"><p>E seguitai: &laquo;Come &rsquo;l verace stilo</p>\n<p>ne scrisse, padre, del tuo caro frate</p>\n<p>che mise teco Roma nel buon filo,</p></div>\n\n<div class="stanza"><p>fede &egrave; sustanza di cose sperate</p>\n<p>e argomento de le non parventi;</p>\n<p>e questa pare a me sua quiditate&raquo;.</p></div>\n\n<div class="stanza"><p>Allora udi&rsquo;: &laquo;Dirittamente senti,</p>\n<p>se bene intendi perch&eacute; la ripuose</p>\n<p>tra le sustanze, e poi tra li argomenti&raquo;.</p></div>\n\n<div class="stanza"><p>E io appresso: &laquo;Le profonde cose</p>\n<p>che mi largiscon qui la lor parvenza,</p>\n<p>a li occhi di l&agrave; gi&ugrave; son s&igrave; ascose,</p></div>\n\n<div class="stanza"><p>che l&rsquo;esser loro v&rsquo;&egrave; in sola credenza,</p>\n<p>sopra la qual si fonda l&rsquo;alta spene;</p>\n<p>e per&ograve; di sustanza prende intenza.</p></div>\n\n<div class="stanza"><p>E da questa credenza ci convene</p>\n<p>silogizzar, sanz&rsquo; avere altra vista:</p>\n<p>per&ograve; intenza d&rsquo;argomento tene&raquo;.</p></div>\n\n<div class="stanza"><p>Allora udi&rsquo;: &laquo;Se quantunque s&rsquo;acquista</p>\n<p>gi&ugrave; per dottrina, fosse cos&igrave; &rsquo;nteso,</p>\n<p>non l&igrave; avria loco ingegno di sofista&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; spir&ograve; di quello amore acceso;</p>\n<p>indi soggiunse: &laquo;Assai bene &egrave; trascorsa</p>\n<p>d&rsquo;esta moneta gi&agrave; la lega e &rsquo;l peso;</p></div>\n\n<div class="stanza"><p>ma dimmi se tu l&rsquo;hai ne la tua borsa&raquo;.</p>\n<p>Ond&rsquo; io: &laquo;S&igrave; ho, s&igrave; lucida e s&igrave; tonda,</p>\n<p>che nel suo conio nulla mi s&rsquo;inforsa&raquo;.</p></div>\n\n<div class="stanza"><p>Appresso usc&igrave; de la luce profonda</p>\n<p>che l&igrave; splendeva: &laquo;Questa cara gioia</p>\n<p>sopra la quale ogne virt&ugrave; si fonda,</p></div>\n\n<div class="stanza"><p>onde ti venne?&raquo;. E io: &laquo;La larga ploia</p>\n<p>de lo Spirito Santo, ch&rsquo;&egrave; diffusa</p>\n<p>in su le vecchie e &rsquo;n su le nuove cuoia,</p></div>\n\n<div class="stanza"><p>&egrave; silogismo che la m&rsquo;ha conchiusa</p>\n<p>acutamente s&igrave;, che &rsquo;nverso d&rsquo;ella</p>\n<p>ogne dimostrazion mi pare ottusa&raquo;.</p></div>\n\n<div class="stanza"><p>Io udi&rsquo; poi: &laquo;L&rsquo;antica e la novella</p>\n<p>proposizion che cos&igrave; ti conchiude,</p>\n<p>perch&eacute; l&rsquo;hai tu per divina favella?&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;La prova che &rsquo;l ver mi dischiude,</p>\n<p>son l&rsquo;opere seguite, a che natura</p>\n<p>non scalda ferro mai n&eacute; batte incude&raquo;.</p></div>\n\n<div class="stanza"><p>Risposto fummi: &laquo;D&igrave;, chi t&rsquo;assicura</p>\n<p>che quell&rsquo; opere fosser? Quel medesmo</p>\n<p>che vuol provarsi, non altri, il ti giura&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se &rsquo;l mondo si rivolse al cristianesmo&raquo;,</p>\n<p>diss&rsquo; io, &laquo;sanza miracoli, quest&rsquo; uno</p>\n<p>&egrave; tal, che li altri non sono il centesmo:</p></div>\n\n<div class="stanza"><p>ch&eacute; tu intrasti povero e digiuno</p>\n<p>in campo, a seminar la buona pianta</p>\n<p>che fu gi&agrave; vite e ora &egrave; fatta pruno&raquo;.</p></div>\n\n<div class="stanza"><p>Finito questo, l&rsquo;alta corte santa</p>\n<p>rison&ograve; per le spere un &lsquo;Dio laudamo&rsquo;</p>\n<p>ne la melode che l&agrave; s&ugrave; si canta.</p></div>\n\n<div class="stanza"><p>E quel baron che s&igrave; di ramo in ramo,</p>\n<p>essaminando, gi&agrave; tratto m&rsquo;avea,</p>\n<p>che a l&rsquo;ultime fronde appressavamo,</p></div>\n\n<div class="stanza"><p>ricominci&ograve;: &laquo;La Grazia, che donnea</p>\n<p>con la tua mente, la bocca t&rsquo;aperse</p>\n<p>infino a qui come aprir si dovea,</p></div>\n\n<div class="stanza"><p>s&igrave; ch&rsquo;io approvo ci&ograve; che fuori emerse;</p>\n<p>ma or convien espremer quel che credi,</p>\n<p>e onde a la credenza tua s&rsquo;offerse&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O santo padre, e spirito che vedi</p>\n<p>ci&ograve; che credesti s&igrave;, che tu vincesti</p>\n<p>ver&rsquo; lo sepulcro pi&ugrave; giovani piedi&raquo;,</p></div>\n\n<div class="stanza"><p>comincia&rsquo; io, &laquo;tu vuo&rsquo; ch&rsquo;io manifesti</p>\n<p>la forma qui del pronto creder mio,</p>\n<p>e anche la cagion di lui chiedesti.</p></div>\n\n<div class="stanza"><p>E io rispondo: Io credo in uno Dio</p>\n<p>solo ed etterno, che tutto &rsquo;l ciel move,</p>\n<p>non moto, con amore e con disio;</p></div>\n\n<div class="stanza"><p>e a tal creder non ho io pur prove</p>\n<p>fisice e metafisice, ma dalmi</p>\n<p>anche la verit&agrave; che quinci piove</p></div>\n\n<div class="stanza"><p>per Mo&iuml;s&egrave;, per profeti e per salmi,</p>\n<p>per l&rsquo;Evangelio e per voi che scriveste</p>\n<p>poi che l&rsquo;ardente Spirto vi f&eacute; almi;</p></div>\n\n<div class="stanza"><p>e credo in tre persone etterne, e queste</p>\n<p>credo una essenza s&igrave; una e s&igrave; trina,</p>\n<p>che soffera congiunto &lsquo;sono&rsquo; ed &lsquo;este&rsquo;.</p></div>\n\n<div class="stanza"><p>De la profonda condizion divina</p>\n<p>ch&rsquo;io tocco mo, la mente mi sigilla</p>\n<p>pi&ugrave; volte l&rsquo;evangelica dottrina.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; &egrave; &rsquo;l principio, quest&rsquo; &egrave; la favilla</p>\n<p>che si dilata in fiamma poi vivace,</p>\n<p>e come stella in cielo in me scintilla&raquo;.</p></div>\n\n<div class="stanza"><p>Come &rsquo;l segnor ch&rsquo;ascolta quel che i piace,</p>\n<p>da indi abbraccia il servo, gratulando</p>\n<p>per la novella, tosto ch&rsquo;el si tace;</p></div>\n\n<div class="stanza"><p>cos&igrave;, benedicendomi cantando,</p>\n<p>tre volte cinse me, s&igrave; com&rsquo; io tacqui,</p>\n<p>l&rsquo;appostolico lume al cui comando</p></div>\n\n<div class="stanza"><p>io avea detto: s&igrave; nel dir li piacqui!</p></div>','<p class="cantohead">Canto XXV</p>\n\n<div class="stanza"><p>Se mai continga che &rsquo;l poema sacro</p>\n<p>al quale ha posto mano e cielo e terra,</p>\n<p>s&igrave; che m&rsquo;ha fatto per molti anni macro,</p></div>\n\n<div class="stanza"><p>vinca la crudelt&agrave; che fuor mi serra</p>\n<p>del bello ovile ov&rsquo; io dormi&rsquo; agnello,</p>\n<p>nimico ai lupi che li danno guerra;</p></div>\n\n<div class="stanza"><p>con altra voce omai, con altro vello</p>\n<p>ritorner&ograve; poeta, e in sul fonte</p>\n<p>del mio battesmo prender&ograve; &rsquo;l cappello;</p></div>\n\n<div class="stanza"><p>per&ograve; che ne la fede, che fa conte</p>\n<p>l&rsquo;anime a Dio, quivi intra&rsquo; io, e poi</p>\n<p>Pietro per lei s&igrave; mi gir&ograve; la fronte.</p></div>\n\n<div class="stanza"><p>Indi si mosse un lume verso noi</p>\n<p>di quella spera ond&rsquo; usc&igrave; la primizia</p>\n<p>che lasci&ograve; Cristo d&rsquo;i vicari suoi;</p></div>\n\n<div class="stanza"><p>e la mia donna, piena di letizia,</p>\n<p>mi disse: &laquo;Mira, mira: ecco il barone</p>\n<p>per cui l&agrave; gi&ugrave; si vicita Galizia&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; come quando il colombo si pone</p>\n<p>presso al compagno, l&rsquo;uno a l&rsquo;altro pande,</p>\n<p>girando e mormorando, l&rsquo;affezione;</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; &iuml;o l&rsquo;un da l&rsquo;altro grande</p>\n<p>principe glor&iuml;oso essere accolto,</p>\n<p>laudando il cibo che l&agrave; s&ugrave; li prande.</p></div>\n\n<div class="stanza"><p>Ma poi che &rsquo;l gratular si fu assolto,</p>\n<p>tacito coram me ciascun s&rsquo;affisse,</p>\n<p>ignito s&igrave; che vinc&euml;a &rsquo;l mio volto.</p></div>\n\n<div class="stanza"><p>Ridendo allora B&euml;atrice disse:</p>\n<p>&laquo;Inclita vita per cui la larghezza</p>\n<p>de la nostra basilica si scrisse,</p></div>\n\n<div class="stanza"><p>fa risonar la spene in questa altezza:</p>\n<p>tu sai, che tante fiate la figuri,</p>\n<p>quante Ies&ugrave; ai tre f&eacute; pi&ugrave; carezza&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Leva la testa e fa che t&rsquo;assicuri:</p>\n<p>che ci&ograve; che vien qua s&ugrave; del mortal mondo,</p>\n<p>convien ch&rsquo;ai nostri raggi si maturi&raquo;.</p></div>\n\n<div class="stanza"><p>Questo conforto del foco secondo</p>\n<p>mi venne; ond&rsquo; io lev&auml;i li occhi a&rsquo; monti</p>\n<p>che li &rsquo;ncurvaron pria col troppo pondo.</p></div>\n\n<div class="stanza"><p>&laquo;Poi che per grazia vuol che tu t&rsquo;affronti</p>\n<p>lo nostro Imperadore, anzi la morte,</p>\n<p>ne l&rsquo;aula pi&ugrave; secreta co&rsquo; suoi conti,</p></div>\n\n<div class="stanza"><p>s&igrave; che, veduto il ver di questa corte,</p>\n<p>la spene, che l&agrave; gi&ugrave; bene innamora,</p>\n<p>in te e in altrui di ci&ograve; conforte,</p></div>\n\n<div class="stanza"><p>di&rsquo; quel ch&rsquo;ell&rsquo; &egrave;, di&rsquo; come se ne &rsquo;nfiora</p>\n<p>la mente tua, e d&igrave; onde a te venne&raquo;.</p>\n<p>Cos&igrave; segu&igrave; &rsquo;l secondo lume ancora.</p></div>\n\n<div class="stanza"><p>E quella p&iuml;a che guid&ograve; le penne</p>\n<p>de le mie ali a cos&igrave; alto volo,</p>\n<p>a la risposta cos&igrave; mi prevenne:</p></div>\n\n<div class="stanza"><p>&laquo;La Chiesa militante alcun figliuolo</p>\n<p>non ha con pi&ugrave; speranza, com&rsquo; &egrave; scritto</p>\n<p>nel Sol che raggia tutto nostro stuolo:</p></div>\n\n<div class="stanza"><p>per&ograve; li &egrave; conceduto che d&rsquo;Egitto</p>\n<p>vegna in Ierusalemme per vedere,</p>\n<p>anzi che &rsquo;l militar li sia prescritto.</p></div>\n\n<div class="stanza"><p>Li altri due punti, che non per sapere</p>\n<p>son dimandati, ma perch&rsquo; ei rapporti</p>\n<p>quanto questa virt&ugrave; t&rsquo;&egrave; in piacere,</p></div>\n\n<div class="stanza"><p>a lui lasc&rsquo; io, ch&eacute; non li saran forti</p>\n<p>n&eacute; di iattanza; ed elli a ci&ograve; risponda,</p>\n<p>e la grazia di Dio ci&ograve; li comporti&raquo;.</p></div>\n\n<div class="stanza"><p>Come discente ch&rsquo;a dottor seconda</p>\n<p>pronto e libente in quel ch&rsquo;elli &egrave; esperto,</p>\n<p>perch&eacute; la sua bont&agrave; si disasconda,</p></div>\n\n<div class="stanza"><p>&laquo;Spene&raquo;, diss&rsquo; io, &laquo;&egrave; uno attender certo</p>\n<p>de la gloria futura, il qual produce</p>\n<p>grazia divina e precedente merto.</p></div>\n\n<div class="stanza"><p>Da molte stelle mi vien questa luce;</p>\n<p>ma quei la distill&ograve; nel mio cor pria</p>\n<p>che fu sommo cantor del sommo duce.</p></div>\n\n<div class="stanza"><p>&lsquo;Sperino in te&rsquo;, ne la sua t&euml;odia</p>\n<p>dice, &lsquo;color che sanno il nome tuo&rsquo;:</p>\n<p>e chi nol sa, s&rsquo;elli ha la fede mia?</p></div>\n\n<div class="stanza"><p>Tu mi stillasti, con lo stillar suo,</p>\n<p>ne la pistola poi; s&igrave; ch&rsquo;io son pieno,</p>\n<p>e in altrui vostra pioggia repluo&raquo;.</p></div>\n\n<div class="stanza"><p>Mentr&rsquo; io diceva, dentro al vivo seno</p>\n<p>di quello incendio tremolava un lampo</p>\n<p>s&ugrave;bito e spesso a guisa di baleno.</p></div>\n\n<div class="stanza"><p>Indi spir&ograve;: &laquo;L&rsquo;amore ond&rsquo; &iuml;o avvampo</p>\n<p>ancor ver&rsquo; la virt&ugrave; che mi seguette</p>\n<p>infin la palma e a l&rsquo;uscir del campo,</p></div>\n\n<div class="stanza"><p>vuol ch&rsquo;io respiri a te che ti dilette</p>\n<p>di lei; ed emmi a grato che tu diche</p>\n<p>quello che la speranza ti &rsquo;mpromette&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Le nove e le scritture antiche</p>\n<p>pongon lo segno, ed esso lo mi addita,</p>\n<p>de l&rsquo;anime che Dio s&rsquo;ha fatte amiche.</p></div>\n\n<div class="stanza"><p>Dice Isaia che ciascuna vestita</p>\n<p>ne la sua terra fia di doppia vesta:</p>\n<p>e la sua terra &egrave; questa dolce vita;</p></div>\n\n<div class="stanza"><p>e &rsquo;l tuo fratello assai vie pi&ugrave; digesta,</p>\n<p>l&agrave; dove tratta de le bianche stole,</p>\n<p>questa revelazion ci manifesta&raquo;.</p></div>\n\n<div class="stanza"><p>E prima, appresso al fin d&rsquo;este parole,</p>\n<p>&lsquo;Sperent in te&rsquo; di sopr&rsquo; a noi s&rsquo;ud&igrave;;</p>\n<p>a che rispuoser tutte le carole.</p></div>\n\n<div class="stanza"><p>Poscia tra esse un lume si schiar&igrave;</p>\n<p>s&igrave; che, se &rsquo;l Cancro avesse un tal cristallo,</p>\n<p>l&rsquo;inverno avrebbe un mese d&rsquo;un sol d&igrave;.</p></div>\n\n<div class="stanza"><p>E come surge e va ed entra in ballo</p>\n<p>vergine lieta, sol per fare onore</p>\n<p>a la novizia, non per alcun fallo,</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; io lo schiarato splendore</p>\n<p>venire a&rsquo; due che si volgieno a nota</p>\n<p>qual conveniesi al loro ardente amore.</p></div>\n\n<div class="stanza"><p>Misesi l&igrave; nel canto e ne la rota;</p>\n<p>e la mia donna in lor tenea l&rsquo;aspetto,</p>\n<p>pur come sposa tacita e immota.</p></div>\n\n<div class="stanza"><p>&laquo;Questi &egrave; colui che giacque sopra &rsquo;l petto</p>\n<p>del nostro pellicano, e questi fue</p>\n<p>di su la croce al grande officio eletto&raquo;.</p></div>\n\n<div class="stanza"><p>La donna mia cos&igrave;; n&eacute; per&ograve; pi&ugrave;e</p>\n<p>mosser la vista sua di stare attenta</p>\n<p>poscia che prima le parole sue.</p></div>\n\n<div class="stanza"><p>Qual &egrave; colui ch&rsquo;adocchia e s&rsquo;argomenta</p>\n<p>di vedere eclissar lo sole un poco,</p>\n<p>che, per veder, non vedente diventa;</p></div>\n\n<div class="stanza"><p>tal mi fec&rsquo; &iuml;o a quell&rsquo; ultimo foco</p>\n<p>mentre che detto fu: &laquo;Perch&eacute; t&rsquo;abbagli</p>\n<p>per veder cosa che qui non ha loco?</p></div>\n\n<div class="stanza"><p>In terra &egrave; terra il mio corpo, e saragli</p>\n<p>tanto con li altri, che &rsquo;l numero nostro</p>\n<p>con l&rsquo;etterno proposito s&rsquo;agguagli.</p></div>\n\n<div class="stanza"><p>Con le due stole nel beato chiostro</p>\n<p>son le due luci sole che saliro;</p>\n<p>e questo apporterai nel mondo vostro&raquo;.</p></div>\n\n<div class="stanza"><p>A questa voce l&rsquo;infiammato giro</p>\n<p>si qu&iuml;et&ograve; con esso il dolce mischio</p>\n<p>che si facea nel suon del trino spiro,</p></div>\n\n<div class="stanza"><p>s&igrave; come, per cessar fatica o rischio,</p>\n<p>li remi, pria ne l&rsquo;acqua ripercossi,</p>\n<p>tutti si posano al sonar d&rsquo;un fischio.</p></div>\n\n<div class="stanza"><p>Ahi quanto ne la mente mi commossi,</p>\n<p>quando mi volsi per veder Beatrice,</p>\n<p>per non poter veder, bench&eacute; io fossi</p></div>\n\n<div class="stanza"><p>presso di lei, e nel mondo felice!</p></div>','<p class="cantohead">Canto XXVI</p>\n\n<div class="stanza"><p>Mentr&rsquo; io dubbiava per lo viso spento,</p>\n<p>de la fulgida fiamma che lo spense</p>\n<p>usc&igrave; un spiro che mi fece attento,</p></div>\n\n<div class="stanza"><p>dicendo: &laquo;Intanto che tu ti risense</p>\n<p>de la vista che ha&iuml; in me consunta,</p>\n<p>ben &egrave; che ragionando la compense.</p></div>\n\n<div class="stanza"><p>Comincia dunque; e d&igrave; ove s&rsquo;appunta</p>\n<p>l&rsquo;anima tua, e fa ragion che sia</p>\n<p>la vista in te smarrita e non defunta:</p></div>\n\n<div class="stanza"><p>perch&eacute; la donna che per questa dia</p>\n<p>reg&iuml;on ti conduce, ha ne lo sguardo</p>\n<p>la virt&ugrave; ch&rsquo;ebbe la man d&rsquo;Anania&raquo;.</p></div>\n\n<div class="stanza"><p>Io dissi: &laquo;Al suo piacere e tosto e tardo</p>\n<p>vegna remedio a li occhi, che fuor porte</p>\n<p>quand&rsquo; ella entr&ograve; col foco ond&rsquo; io sempr&rsquo; ardo.</p></div>\n\n<div class="stanza"><p>Lo ben che fa contenta questa corte,</p>\n<p>Alfa e O &egrave; di quanta scrittura</p>\n<p>mi legge Amore o lievemente o forte&raquo;.</p></div>\n\n<div class="stanza"><p>Quella medesma voce che paura</p>\n<p>tolta m&rsquo;avea del s&ugrave;bito abbarbaglio,</p>\n<p>di ragionare ancor mi mise in cura;</p></div>\n\n<div class="stanza"><p>e disse: &laquo;Certo a pi&ugrave; angusto vaglio</p>\n<p>ti conviene schiarar: dicer convienti</p>\n<p>chi drizz&ograve; l&rsquo;arco tuo a tal berzaglio&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Per filosofici argomenti</p>\n<p>e per autorit&agrave; che quinci scende</p>\n<p>cotale amor convien che in me si &rsquo;mprenti:</p></div>\n\n<div class="stanza"><p>ch&eacute; &rsquo;l bene, in quanto ben, come s&rsquo;intende,</p>\n<p>cos&igrave; accende amore, e tanto maggio</p>\n<p>quanto pi&ugrave; di bontate in s&eacute; comprende.</p></div>\n\n<div class="stanza"><p>Dunque a l&rsquo;essenza ov&rsquo; &egrave; tanto avvantaggio,</p>\n<p>che ciascun ben che fuor di lei si trova</p>\n<p>altro non &egrave; ch&rsquo;un lume di suo raggio,</p></div>\n\n<div class="stanza"><p>pi&ugrave; che in altra convien che si mova</p>\n<p>la mente, amando, di ciascun che cerne</p>\n<p>il vero in che si fonda questa prova.</p></div>\n\n<div class="stanza"><p>Tal vero a l&rsquo;intelletto m&iuml;o sterne</p>\n<p>colui che mi dimostra il primo amore</p>\n<p>di tutte le sustanze sempiterne.</p></div>\n\n<div class="stanza"><p>Sternel la voce del verace autore,</p>\n<p>che dice a Mo&iuml;s&egrave;, di s&eacute; parlando:</p>\n<p>&lsquo;Io ti far&ograve; vedere ogne valore&rsquo;.</p></div>\n\n<div class="stanza"><p>Sternilmi tu ancora, incominciando</p>\n<p>l&rsquo;alto preconio che grida l&rsquo;arcano</p>\n<p>di qui l&agrave; gi&ugrave; sovra ogne altro bando&raquo;.</p></div>\n\n<div class="stanza"><p>E io udi&rsquo;: &laquo;Per intelletto umano</p>\n<p>e per autoritadi a lui concorde</p>\n<p>d&rsquo;i tuoi amori a Dio guarda il sovrano.</p></div>\n\n<div class="stanza"><p>Ma d&igrave; ancor se tu senti altre corde</p>\n<p>tirarti verso lui, s&igrave; che tu suone</p>\n<p>con quanti denti questo amor ti morde&raquo;.</p></div>\n\n<div class="stanza"><p>Non fu latente la santa intenzione</p>\n<p>de l&rsquo;aguglia di Cristo, anzi m&rsquo;accorsi</p>\n<p>dove volea menar mia professione.</p></div>\n\n<div class="stanza"><p>Per&ograve; ricominciai: &laquo;Tutti quei morsi</p>\n<p>che posson far lo cor volgere a Dio,</p>\n<p>a la mia caritate son concorsi:</p></div>\n\n<div class="stanza"><p>ch&eacute; l&rsquo;essere del mondo e l&rsquo;esser mio,</p>\n<p>la morte ch&rsquo;el sostenne perch&rsquo; io viva,</p>\n<p>e quel che spera ogne fedel com&rsquo; io,</p></div>\n\n<div class="stanza"><p>con la predetta conoscenza viva,</p>\n<p>tratto m&rsquo;hanno del mar de l&rsquo;amor torto,</p>\n<p>e del diritto m&rsquo;han posto a la riva.</p></div>\n\n<div class="stanza"><p>Le fronde onde s&rsquo;infronda tutto l&rsquo;orto</p>\n<p>de l&rsquo;ortolano etterno, am&rsquo; io cotanto</p>\n<p>quanto da lui a lor di bene &egrave; porto&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; com&rsquo; io tacqui, un dolcissimo canto</p>\n<p>rison&ograve; per lo cielo, e la mia donna</p>\n<p>dicea con li altri: &laquo;Santo, santo, santo!&raquo;.</p></div>\n\n<div class="stanza"><p>E come a lume acuto si disonna</p>\n<p>per lo spirto visivo che ricorre</p>\n<p>a lo splendor che va di gonna in gonna,</p></div>\n\n<div class="stanza"><p>e lo svegliato ci&ograve; che vede aborre,</p>\n<p>s&igrave; nesc&iuml;a &egrave; la s&ugrave;bita vigilia</p>\n<p>fin che la stimativa non soccorre;</p></div>\n\n<div class="stanza"><p>cos&igrave; de li occhi miei ogne quisquilia</p>\n<p>fug&ograve; Beatrice col raggio d&rsquo;i suoi,</p>\n<p>che rifulgea da pi&ugrave; di mille milia:</p></div>\n\n<div class="stanza"><p>onde mei che dinanzi vidi poi;</p>\n<p>e quasi stupefatto domandai</p>\n<p>d&rsquo;un quarto lume ch&rsquo;io vidi tra noi.</p></div>\n\n<div class="stanza"><p>E la mia donna: &laquo;Dentro da quei rai</p>\n<p>vagheggia il suo fattor l&rsquo;anima prima</p>\n<p>che la prima virt&ugrave; creasse mai&raquo;.</p></div>\n\n<div class="stanza"><p>Come la fronda che flette la cima</p>\n<p>nel transito del vento, e poi si leva</p>\n<p>per la propria virt&ugrave; che la soblima,</p></div>\n\n<div class="stanza"><p>fec&rsquo; io in tanto in quant&rsquo; ella diceva,</p>\n<p>stupendo, e poi mi rifece sicuro</p>\n<p>un disio di parlare ond&rsquo; &iuml;o ardeva.</p></div>\n\n<div class="stanza"><p>E cominciai: &laquo;O pomo che maturo</p>\n<p>solo prodotto fosti, o padre antico</p>\n<p>a cui ciascuna sposa &egrave; figlia e nuro,</p></div>\n\n<div class="stanza"><p>divoto quanto posso a te suppl&igrave;co</p>\n<p>perch&eacute; mi parli: tu vedi mia voglia,</p>\n<p>e per udirti tosto non la dico&raquo;.</p></div>\n\n<div class="stanza"><p>Talvolta un animal coverto broglia,</p>\n<p>s&igrave; che l&rsquo;affetto convien che si paia</p>\n<p>per lo seguir che face a lui la &rsquo;nvoglia;</p></div>\n\n<div class="stanza"><p>e similmente l&rsquo;anima primaia</p>\n<p>mi facea trasparer per la coverta</p>\n<p>quant&rsquo; ella a compiacermi ven&igrave;a gaia.</p></div>\n\n<div class="stanza"><p>Indi spir&ograve;: &laquo;Sanz&rsquo; essermi proferta</p>\n<p>da te, la voglia tua discerno meglio</p>\n<p>che tu qualunque cosa t&rsquo;&egrave; pi&ugrave; certa;</p></div>\n\n<div class="stanza"><p>perch&rsquo; io la veggio nel verace speglio</p>\n<p>che fa di s&eacute; pareglio a l&rsquo;altre cose,</p>\n<p>e nulla face lui di s&eacute; pareglio.</p></div>\n\n<div class="stanza"><p>Tu vuogli udir quant&rsquo; &egrave; che Dio mi puose</p>\n<p>ne l&rsquo;eccelso giardino, ove costei</p>\n<p>a cos&igrave; lunga scala ti dispuose,</p></div>\n\n<div class="stanza"><p>e quanto fu diletto a li occhi miei,</p>\n<p>e la propria cagion del gran disdegno,</p>\n<p>e l&rsquo;id&iuml;oma ch&rsquo;usai e che fei.</p></div>\n\n<div class="stanza"><p>Or, figluol mio, non il gustar del legno</p>\n<p>fu per s&eacute; la cagion di tanto essilio,</p>\n<p>ma solamente il trapassar del segno.</p></div>\n\n<div class="stanza"><p>Quindi onde mosse tua donna Virgilio,</p>\n<p>quattromilia trecento e due volumi</p>\n<p>di sol desiderai questo concilio;</p></div>\n\n<div class="stanza"><p>e vidi lui tornare a tutt&rsquo; i lumi</p>\n<p>de la sua strada novecento trenta</p>\n<p>f&iuml;ate, mentre ch&rsquo;&iuml;o in terra fu&rsquo;mi.</p></div>\n\n<div class="stanza"><p>La lingua ch&rsquo;io parlai fu tutta spenta</p>\n<p>innanzi che a l&rsquo;ovra inconsummabile</p>\n<p>fosse la gente di Nembr&ograve;t attenta:</p></div>\n\n<div class="stanza"><p>ch&eacute; nullo effetto mai raz&iuml;onabile,</p>\n<p>per lo piacere uman che rinovella</p>\n<p>seguendo il cielo, sempre fu durabile.</p></div>\n\n<div class="stanza"><p>Opera naturale &egrave; ch&rsquo;uom favella;</p>\n<p>ma cos&igrave; o cos&igrave;, natura lascia</p>\n<p>poi fare a voi secondo che v&rsquo;abbella.</p></div>\n\n<div class="stanza"><p>Pria ch&rsquo;i&rsquo; scendessi a l&rsquo;infernale ambascia,</p>\n<p>I s&rsquo;appellava in terra il sommo bene</p>\n<p>onde vien la letizia che mi fascia;</p></div>\n\n<div class="stanza"><p>e El si chiam&ograve; poi: e ci&ograve; convene,</p>\n<p>ch&eacute; l&rsquo;uso d&rsquo;i mortali &egrave; come fronda</p>\n<p>in ramo, che sen va e altra vene.</p></div>\n\n<div class="stanza"><p>Nel monte che si leva pi&ugrave; da l&rsquo;onda,</p>\n<p>fu&rsquo; io, con vita pura e disonesta,</p>\n<p>da la prim&rsquo; ora a quella che seconda,</p></div>\n\n<div class="stanza"><p>come &rsquo;l sol muta quadra, l&rsquo;ora sesta&raquo;.</p></div>','<p class="cantohead">Canto XXVII</p>\n\n<div class="stanza"><p>&lsquo;Al Padre, al Figlio, a lo Spirito Santo&rsquo;,</p>\n<p>cominci&ograve;, &lsquo;gloria!&rsquo;, tutto &rsquo;l paradiso,</p>\n<p>s&igrave; che m&rsquo;inebr&iuml;ava il dolce canto.</p></div>\n\n<div class="stanza"><p>Ci&ograve; ch&rsquo;io vedeva mi sembiava un riso</p>\n<p>de l&rsquo;universo; per che mia ebbrezza</p>\n<p>intrava per l&rsquo;udire e per lo viso.</p></div>\n\n<div class="stanza"><p>Oh gioia! oh ineffabile allegrezza!</p>\n<p>oh vita int&egrave;gra d&rsquo;amore e di pace!</p>\n<p>oh sanza brama sicura ricchezza!</p></div>\n\n<div class="stanza"><p>Dinanzi a li occhi miei le quattro face</p>\n<p>stavano accese, e quella che pria venne</p>\n<p>incominci&ograve; a farsi pi&ugrave; vivace,</p></div>\n\n<div class="stanza"><p>e tal ne la sembianza sua divenne,</p>\n<p>qual diverrebbe Iove, s&rsquo;elli e Marte</p>\n<p>fossero augelli e cambiassersi penne.</p></div>\n\n<div class="stanza"><p>La provedenza, che quivi comparte</p>\n<p>vice e officio, nel beato coro</p>\n<p>silenzio posto avea da ogne parte,</p></div>\n\n<div class="stanza"><p>quand&rsquo; &iuml;o udi&rsquo;: &laquo;Se io mi trascoloro,</p>\n<p>non ti maravigliar, ch&eacute;, dicend&rsquo; io,</p>\n<p>vedrai trascolorar tutti costoro.</p></div>\n\n<div class="stanza"><p>Quelli ch&rsquo;usurpa in terra il luogo mio,</p>\n<p>il luogo mio, il luogo mio, che vaca</p>\n<p>ne la presenza del Figliuol di Dio,</p></div>\n\n<div class="stanza"><p>fatt&rsquo; ha del cimitero mio cloaca</p>\n<p>del sangue e de la puzza; onde &rsquo;l perverso</p>\n<p>che cadde di qua s&ugrave;, l&agrave; gi&ugrave; si placa&raquo;.</p></div>\n\n<div class="stanza"><p>Di quel color che per lo sole avverso</p>\n<p>nube dipigne da sera e da mane,</p>\n<p>vid&rsquo; &iuml;o allora tutto &rsquo;l ciel cosperso.</p></div>\n\n<div class="stanza"><p>E come donna onesta che permane</p>\n<p>di s&eacute; sicura, e per l&rsquo;altrui fallanza,</p>\n<p>pur ascoltando, timida si fane,</p></div>\n\n<div class="stanza"><p>cos&igrave; Beatrice trasmut&ograve; sembianza;</p>\n<p>e tale eclissi credo che &rsquo;n ciel fue</p>\n<p>quando pat&igrave; la supprema possanza.</p></div>\n\n<div class="stanza"><p>Poi procedetter le parole sue</p>\n<p>con voce tanto da s&eacute; trasmutata,</p>\n<p>che la sembianza non si mut&ograve; pi&ugrave;e:</p></div>\n\n<div class="stanza"><p>&laquo;Non fu la sposa di Cristo allevata</p>\n<p>del sangue mio, di Lin, di quel di Cleto,</p>\n<p>per essere ad acquisto d&rsquo;oro usata;</p></div>\n\n<div class="stanza"><p>ma per acquisto d&rsquo;esto viver lieto</p>\n<p>e Sisto e P&iuml;o e Calisto e Urbano</p>\n<p>sparser lo sangue dopo molto fleto.</p></div>\n\n<div class="stanza"><p>Non fu nostra intenzion ch&rsquo;a destra mano</p>\n<p>d&rsquo;i nostri successor parte sedesse,</p>\n<p>parte da l&rsquo;altra del popol cristiano;</p></div>\n\n<div class="stanza"><p>n&eacute; che le chiavi che mi fuor concesse,</p>\n<p>divenisser signaculo in vessillo</p>\n<p>che contra battezzati combattesse;</p></div>\n\n<div class="stanza"><p>n&eacute; ch&rsquo;io fossi figura di sigillo</p>\n<p>a privilegi venduti e mendaci,</p>\n<p>ond&rsquo; io sovente arrosso e disfavillo.</p></div>\n\n<div class="stanza"><p>In vesta di pastor lupi rapaci</p>\n<p>si veggion di qua s&ugrave; per tutti i paschi:</p>\n<p>o difesa di Dio, perch&eacute; pur giaci?</p></div>\n\n<div class="stanza"><p>Del sangue nostro Caorsini e Guaschi</p>\n<p>s&rsquo;apparecchian di bere: o buon principio,</p>\n<p>a che vil fine convien che tu caschi!</p></div>\n\n<div class="stanza"><p>Ma l&rsquo;alta provedenza, che con Scipio</p>\n<p>difese a Roma la gloria del mondo,</p>\n<p>soccorr&agrave; tosto, s&igrave; com&rsquo; io concipio;</p></div>\n\n<div class="stanza"><p>e tu, figliuol, che per lo mortal pondo</p>\n<p>ancor gi&ugrave; tornerai, apri la bocca,</p>\n<p>e non asconder quel ch&rsquo;io non ascondo&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; come di vapor gelati fiocca</p>\n<p>in giuso l&rsquo;aere nostro, quando &rsquo;l corno</p>\n<p>de la capra del ciel col sol si tocca,</p></div>\n\n<div class="stanza"><p>in s&ugrave; vid&rsquo; io cos&igrave; l&rsquo;etera addorno</p>\n<p>farsi e fioccar di vapor tr&iuml;unfanti</p>\n<p>che fatto avien con noi quivi soggiorno.</p></div>\n\n<div class="stanza"><p>Lo viso mio seguiva i suoi sembianti,</p>\n<p>e segu&igrave; fin che &rsquo;l mezzo, per lo molto,</p>\n<p>li tolse il trapassar del pi&ugrave; avanti.</p></div>\n\n<div class="stanza"><p>Onde la donna, che mi vide assolto</p>\n<p>de l&rsquo;attendere in s&ugrave;, mi disse: &laquo;Adima</p>\n<p>il viso e guarda come tu se&rsquo; v&ograve;lto&raquo;.</p></div>\n\n<div class="stanza"><p>Da l&rsquo;ora ch&rsquo;&iuml;o avea guardato prima</p>\n<p>i&rsquo; vidi mosso me per tutto l&rsquo;arco</p>\n<p>che fa dal mezzo al fine il primo clima;</p></div>\n\n<div class="stanza"><p>s&igrave; ch&rsquo;io vedea di l&agrave; da Gade il varco</p>\n<p>folle d&rsquo;Ulisse, e di qua presso il lito</p>\n<p>nel qual si fece Europa dolce carco.</p></div>\n\n<div class="stanza"><p>E pi&ugrave; mi fora discoverto il sito</p>\n<p>di questa aiuola; ma &rsquo;l sol procedea</p>\n<p>sotto i mie&rsquo; piedi un segno e pi&ugrave; partito.</p></div>\n\n<div class="stanza"><p>La mente innamorata, che donnea</p>\n<p>con la mia donna sempre, di ridure</p>\n<p>ad essa li occhi pi&ugrave; che mai ardea;</p></div>\n\n<div class="stanza"><p>e se natura o arte f&eacute; pasture</p>\n<p>da pigliare occhi, per aver la mente,</p>\n<p>in carne umana o ne le sue pitture,</p></div>\n\n<div class="stanza"><p>tutte adunate, parrebber n&iuml;ente</p>\n<p>ver&rsquo; lo piacer divin che mi refulse,</p>\n<p>quando mi volsi al suo viso ridente.</p></div>\n\n<div class="stanza"><p>E la virt&ugrave; che lo sguardo m&rsquo;indulse,</p>\n<p>del bel nido di Leda mi divelse,</p>\n<p>e nel ciel velocissimo m&rsquo;impulse.</p></div>\n\n<div class="stanza"><p>Le parti sue vivissime ed eccelse</p>\n<p>s&igrave; uniforme son, ch&rsquo;i&rsquo; non so dire</p>\n<p>qual B&euml;atrice per loco mi scelse.</p></div>\n\n<div class="stanza"><p>Ma ella, che ved&euml;a &rsquo;l mio disire,</p>\n<p>incominci&ograve;, ridendo tanto lieta,</p>\n<p>che Dio parea nel suo volto gioire:</p></div>\n\n<div class="stanza"><p>&laquo;La natura del mondo, che qu&iuml;eta</p>\n<p>il mezzo e tutto l&rsquo;altro intorno move,</p>\n<p>quinci comincia come da sua meta;</p></div>\n\n<div class="stanza"><p>e questo cielo non ha altro dove</p>\n<p>che la mente divina, in che s&rsquo;accende</p>\n<p>l&rsquo;amor che &rsquo;l volge e la virt&ugrave; ch&rsquo;ei piove.</p></div>\n\n<div class="stanza"><p>Luce e amor d&rsquo;un cerchio lui comprende,</p>\n<p>s&igrave; come questo li altri; e quel precinto</p>\n<p>colui che &rsquo;l cinge solamente intende.</p></div>\n\n<div class="stanza"><p>Non &egrave; suo moto per altro distinto,</p>\n<p>ma li altri son mensurati da questo,</p>\n<p>s&igrave; come diece da mezzo e da quinto;</p></div>\n\n<div class="stanza"><p>e come il tempo tegna in cotal testo</p>\n<p>le sue radici e ne li altri le fronde,</p>\n<p>omai a te pu&ograve; esser manifesto.</p></div>\n\n<div class="stanza"><p>Oh cupidigia che i mortali affonde</p>\n<p>s&igrave; sotto te, che nessuno ha podere</p>\n<p>di trarre li occhi fuor de le tue onde!</p></div>\n\n<div class="stanza"><p>Ben fiorisce ne li uomini il volere;</p>\n<p>ma la pioggia contin&uuml;a converte</p>\n<p>in bozzacchioni le sosine vere.</p></div>\n\n<div class="stanza"><p>Fede e innocenza son reperte</p>\n<p>solo ne&rsquo; parvoletti; poi ciascuna</p>\n<p>pria fugge che le guance sian coperte.</p></div>\n\n<div class="stanza"><p>Tale, balbuz&iuml;endo ancor, digiuna,</p>\n<p>che poi divora, con la lingua sciolta,</p>\n<p>qualunque cibo per qualunque luna;</p></div>\n\n<div class="stanza"><p>e tal, balbuz&iuml;endo, ama e ascolta</p>\n<p>la madre sua, che, con loquela intera,</p>\n<p>dis&iuml;a poi di vederla sepolta.</p></div>\n\n<div class="stanza"><p>Cos&igrave; si fa la pelle bianca nera</p>\n<p>nel primo aspetto de la bella figlia</p>\n<p>di quel ch&rsquo;apporta mane e lascia sera.</p></div>\n\n<div class="stanza"><p>Tu, perch&eacute; non ti facci maraviglia,</p>\n<p>pensa che &rsquo;n terra non &egrave; chi governi;</p>\n<p>onde s&igrave; sv&iuml;a l&rsquo;umana famiglia.</p></div>\n\n<div class="stanza"><p>Ma prima che gennaio tutto si sverni</p>\n<p>per la centesma ch&rsquo;&egrave; l&agrave; gi&ugrave; negletta,</p>\n<p>raggeran s&igrave; questi cerchi superni,</p></div>\n\n<div class="stanza"><p>che la fortuna che tanto s&rsquo;aspetta,</p>\n<p>le poppe volger&agrave; u&rsquo; son le prore,</p>\n<p>s&igrave; che la classe correr&agrave; diretta;</p></div>\n\n<div class="stanza"><p>e vero frutto verr&agrave; dopo &rsquo;l fiore&raquo;.</p></div>','<p class="cantohead">Canto XXVIII</p>\n\n<div class="stanza"><p>Poscia che &rsquo;ncontro a la vita presente</p>\n<p>d&rsquo;i miseri mortali aperse &rsquo;l vero</p>\n<p>quella che &rsquo;mparadisa la mia mente,</p></div>\n\n<div class="stanza"><p>come in lo specchio fiamma di doppiero</p>\n<p>vede colui che se n&rsquo;alluma retro,</p>\n<p>prima che l&rsquo;abbia in vista o in pensiero,</p></div>\n\n<div class="stanza"><p>e s&eacute; rivolge per veder se &rsquo;l vetro</p>\n<p>li dice il vero, e vede ch&rsquo;el s&rsquo;accorda</p>\n<p>con esso come nota con suo metro;</p></div>\n\n<div class="stanza"><p>cos&igrave; la mia memoria si ricorda</p>\n<p>ch&rsquo;io feci riguardando ne&rsquo; belli occhi</p>\n<p>onde a pigliarmi fece Amor la corda.</p></div>\n\n<div class="stanza"><p>E com&rsquo; io mi rivolsi e furon tocchi</p>\n<p>li miei da ci&ograve; che pare in quel volume,</p>\n<p>quandunque nel suo giro ben s&rsquo;adocchi,</p></div>\n\n<div class="stanza"><p>un punto vidi che raggiava lume</p>\n<p>acuto s&igrave;, che &rsquo;l viso ch&rsquo;elli affoca</p>\n<p>chiuder conviensi per lo forte acume;</p></div>\n\n<div class="stanza"><p>e quale stella par quinci pi&ugrave; poca,</p>\n<p>parrebbe luna, locata con esso</p>\n<p>come stella con stella si coll&ograve;ca.</p></div>\n\n<div class="stanza"><p>Forse cotanto quanto pare appresso</p>\n<p>alo cigner la luce che &rsquo;l dipigne</p>\n<p>quando &rsquo;l vapor che &rsquo;l porta pi&ugrave; &egrave; spesso,</p></div>\n\n<div class="stanza"><p>distante intorno al punto un cerchio d&rsquo;igne</p>\n<p>si girava s&igrave; ratto, ch&rsquo;avria vinto</p>\n<p>quel moto che pi&ugrave; tosto il mondo cigne;</p></div>\n\n<div class="stanza"><p>e questo era d&rsquo;un altro circumcinto,</p>\n<p>e quel dal terzo, e &rsquo;l terzo poi dal quarto,</p>\n<p>dal quinto il quarto, e poi dal sesto il quinto.</p></div>\n\n<div class="stanza"><p>Sopra seguiva il settimo s&igrave; sparto</p>\n<p>gi&agrave; di larghezza, che &rsquo;l messo di Iuno</p>\n<p>intero a contenerlo sarebbe arto.</p></div>\n\n<div class="stanza"><p>Cos&igrave; l&rsquo;ottavo e &rsquo;l nono; e chiascheduno</p>\n<p>pi&ugrave; tardo si movea, secondo ch&rsquo;era</p>\n<p>in numero distante pi&ugrave; da l&rsquo;uno;</p></div>\n\n<div class="stanza"><p>e quello avea la fiamma pi&ugrave; sincera</p>\n<p>cui men distava la favilla pura,</p>\n<p>credo, per&ograve; che pi&ugrave; di lei s&rsquo;invera.</p></div>\n\n<div class="stanza"><p>La donna mia, che mi ved&euml;a in cura</p>\n<p>forte sospeso, disse: &laquo;Da quel punto</p>\n<p>depende il cielo e tutta la natura.</p></div>\n\n<div class="stanza"><p>Mira quel cerchio che pi&ugrave; li &egrave; congiunto;</p>\n<p>e sappi che &rsquo;l suo muovere &egrave; s&igrave; tosto</p>\n<p>per l&rsquo;affocato amore ond&rsquo; elli &egrave; punto&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lei: &laquo;Se &rsquo;l mondo fosse posto</p>\n<p>con l&rsquo;ordine ch&rsquo;io veggio in quelle rote,</p>\n<p>sazio m&rsquo;avrebbe ci&ograve; che m&rsquo;&egrave; proposto;</p></div>\n\n<div class="stanza"><p>ma nel mondo sensibile si puote</p>\n<p>veder le volte tanto pi&ugrave; divine,</p>\n<p>quant&rsquo; elle son dal centro pi&ugrave; remote.</p></div>\n\n<div class="stanza"><p>Onde, se &rsquo;l mio disir dee aver fine</p>\n<p>in questo miro e angelico templo</p>\n<p>che solo amore e luce ha per confine,</p></div>\n\n<div class="stanza"><p>udir convienmi ancor come l&rsquo;essemplo</p>\n<p>e l&rsquo;essemplare non vanno d&rsquo;un modo,</p>\n<p>ch&eacute; io per me indarno a ci&ograve; contemplo&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se li tuoi diti non sono a tal nodo</p>\n<p>suffic&iuml;enti, non &egrave; maraviglia:</p>\n<p>tanto, per non tentare, &egrave; fatto sodo!&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la donna mia; poi disse: &laquo;Piglia</p>\n<p>quel ch&rsquo;io ti dicer&ograve;, se vuo&rsquo; saziarti;</p>\n<p>e intorno da esso t&rsquo;assottiglia.</p></div>\n\n<div class="stanza"><p>Li cerchi corporai sono ampi e arti</p>\n<p>secondo il pi&ugrave; e &rsquo;l men de la virtute</p>\n<p>che si distende per tutte lor parti.</p></div>\n\n<div class="stanza"><p>Maggior bont&agrave; vuol far maggior salute;</p>\n<p>maggior salute maggior corpo cape,</p>\n<p>s&rsquo;elli ha le parti igualmente compiute.</p></div>\n\n<div class="stanza"><p>Dunque costui che tutto quanto rape</p>\n<p>l&rsquo;altro universo seco, corrisponde</p>\n<p>al cerchio che pi&ugrave; ama e che pi&ugrave; sape:</p></div>\n\n<div class="stanza"><p>per che, se tu a la virt&ugrave; circonde</p>\n<p>la tua misura, non a la parvenza</p>\n<p>de le sustanze che t&rsquo;appaion tonde,</p></div>\n\n<div class="stanza"><p>tu vederai mirabil consequenza</p>\n<p>di maggio a pi&ugrave; e di minore a meno,</p>\n<p>in ciascun cielo, a s&uuml;a intelligenza&raquo;.</p></div>\n\n<div class="stanza"><p>Come rimane splendido e sereno</p>\n<p>l&rsquo;emisperio de l&rsquo;aere, quando soffia</p>\n<p>Borea da quella guancia ond&rsquo; &egrave; pi&ugrave; leno,</p></div>\n\n<div class="stanza"><p>per che si purga e risolve la roffia</p>\n<p>che pria turbava, s&igrave; che &rsquo;l ciel ne ride</p>\n<p>con le bellezze d&rsquo;ogne sua paroffia;</p></div>\n\n<div class="stanza"><p>cos&igrave; fec&rsquo;&iuml;o, poi che mi provide</p>\n<p>la donna mia del suo risponder chiaro,</p>\n<p>e come stella in cielo il ver si vide.</p></div>\n\n<div class="stanza"><p>E poi che le parole sue restaro,</p>\n<p>non altrimenti ferro disfavilla</p>\n<p>che bolle, come i cerchi sfavillaro.</p></div>\n\n<div class="stanza"><p>L&rsquo;incendio suo seguiva ogne scintilla;</p>\n<p>ed eran tante, che &rsquo;l numero loro</p>\n<p>pi&ugrave; che &rsquo;l doppiar de li scacchi s&rsquo;inmilla.</p></div>\n\n<div class="stanza"><p>Io sentiva osannar di coro in coro</p>\n<p>al punto fisso che li tiene a li ubi,</p>\n<p>e terr&agrave; sempre, ne&rsquo; quai sempre fuoro.</p></div>\n\n<div class="stanza"><p>E quella che ved&euml;a i pensier dubi</p>\n<p>ne la mia mente, disse: &laquo;I cerchi primi</p>\n<p>t&rsquo;hanno mostrato Serafi e Cherubi.</p></div>\n\n<div class="stanza"><p>Cos&igrave; veloci seguono i suoi vimi,</p>\n<p>per somigliarsi al punto quanto ponno;</p>\n<p>e posson quanto a veder son soblimi.</p></div>\n\n<div class="stanza"><p>Quelli altri amori che &rsquo;ntorno li vonno,</p>\n<p>si chiaman Troni del divino aspetto,</p>\n<p>per che &rsquo;l primo ternaro terminonno;</p></div>\n\n<div class="stanza"><p>e dei saper che tutti hanno diletto</p>\n<p>quanto la sua veduta si profonda</p>\n<p>nel vero in che si queta ogne intelletto.</p></div>\n\n<div class="stanza"><p>Quinci si pu&ograve; veder come si fonda</p>\n<p>l&rsquo;esser beato ne l&rsquo;atto che vede,</p>\n<p>non in quel ch&rsquo;ama, che poscia seconda;</p></div>\n\n<div class="stanza"><p>e del vedere &egrave; misura mercede,</p>\n<p>che grazia partorisce e buona voglia:</p>\n<p>cos&igrave; di grado in grado si procede.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro ternaro, che cos&igrave; germoglia</p>\n<p>in questa primavera sempiterna</p>\n<p>che notturno Ar&iuml;ete non dispoglia,</p></div>\n\n<div class="stanza"><p>perpet&uuml;alemente &lsquo;Osanna&rsquo; sberna</p>\n<p>con tre melode, che suonano in tree</p>\n<p>ordini di letizia onde s&rsquo;interna.</p></div>\n\n<div class="stanza"><p>In essa gerarcia son l&rsquo;altre dee:</p>\n<p>prima Dominazioni, e poi Virtudi;</p>\n<p>l&rsquo;ordine terzo di Podestadi &egrave;e.</p></div>\n\n<div class="stanza"><p>Poscia ne&rsquo; due penultimi tripudi</p>\n<p>Principati e Arcangeli si girano;</p>\n<p>l&rsquo;ultimo &egrave; tutto d&rsquo;Angelici ludi.</p></div>\n\n<div class="stanza"><p>Questi ordini di s&ugrave; tutti s&rsquo;ammirano,</p>\n<p>e di gi&ugrave; vincon s&igrave;, che verso Dio</p>\n<p>tutti tirati sono e tutti tirano.</p></div>\n\n<div class="stanza"><p>E D&iuml;onisio con tanto disio</p>\n<p>a contemplar questi ordini si mise,</p>\n<p>che li nom&ograve; e distinse com&rsquo; io.</p></div>\n\n<div class="stanza"><p>Ma Gregorio da lui poi si divise;</p>\n<p>onde, s&igrave; tosto come li occhi aperse</p>\n<p>in questo ciel, di s&eacute; medesmo rise.</p></div>\n\n<div class="stanza"><p>E se tanto secreto ver proferse</p>\n<p>mortale in terra, non voglio ch&rsquo;ammiri:</p>\n<p>ch&eacute; chi &rsquo;l vide qua s&ugrave; gliel discoperse</p></div>\n\n<div class="stanza"><p>con altro assai del ver di questi giri&raquo;.</p></div>','<p class="cantohead">Canto XXIX</p>\n\n<div class="stanza"><p>Quando ambedue li figli di Latona,</p>\n<p>coperti del Montone e de la Libra,</p>\n<p>fanno de l&rsquo;orizzonte insieme zona,</p></div>\n\n<div class="stanza"><p>quant&rsquo; &egrave; dal punto che &rsquo;l cen&igrave;t inlibra</p>\n<p>infin che l&rsquo;uno e l&rsquo;altro da quel cinto,</p>\n<p>cambiando l&rsquo;emisperio, si dilibra,</p></div>\n\n<div class="stanza"><p>tanto, col volto di riso dipinto,</p>\n<p>si tacque B&euml;atrice, riguardando</p>\n<p>fiso nel punto che m&rsquo;av&euml;a vinto.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve;: &laquo;Io dico, e non dimando,</p>\n<p>quel che tu vuoli udir, perch&rsquo; io l&rsquo;ho visto</p>\n<p>l&agrave; &rsquo;ve s&rsquo;appunta ogne ubi e ogne quando.</p></div>\n\n<div class="stanza"><p>Non per aver a s&eacute; di bene acquisto,</p>\n<p>ch&rsquo;esser non pu&ograve;, ma perch&eacute; suo splendore</p>\n<p>potesse, risplendendo, dir &ldquo;Subsisto&rdquo;,</p></div>\n\n<div class="stanza"><p>in sua etternit&agrave; di tempo fore,</p>\n<p>fuor d&rsquo;ogne altro comprender, come i piacque,</p>\n<p>s&rsquo;aperse in nuovi amor l&rsquo;etterno amore.</p></div>\n\n<div class="stanza"><p>N&eacute; prima quasi torpente si giacque;</p>\n<p>ch&eacute; n&eacute; prima n&eacute; poscia procedette</p>\n<p>lo discorrer di Dio sovra quest&rsquo; acque.</p></div>\n\n<div class="stanza"><p>Forma e materia, congiunte e purette,</p>\n<p>usciro ad esser che non avia fallo,</p>\n<p>come d&rsquo;arco tricordo tre saette.</p></div>\n\n<div class="stanza"><p>E come in vetro, in ambra o in cristallo</p>\n<p>raggio resplende s&igrave;, che dal venire</p>\n<p>a l&rsquo;esser tutto non &egrave; intervallo,</p></div>\n\n<div class="stanza"><p>cos&igrave; &rsquo;l triforme effetto del suo sire</p>\n<p>ne l&rsquo;esser suo raggi&ograve; insieme tutto</p>\n<p>sanza distinz&iuml;one in essordire.</p></div>\n\n<div class="stanza"><p>Concreato fu ordine e costrutto</p>\n<p>a le sustanze; e quelle furon cima</p>\n<p>nel mondo in che puro atto fu produtto;</p></div>\n\n<div class="stanza"><p>pura potenza tenne la parte ima;</p>\n<p>nel mezzo strinse potenza con atto</p>\n<p>tal vime, che gi&agrave; mai non si divima.</p></div>\n\n<div class="stanza"><p>Ieronimo vi scrisse lungo tratto</p>\n<p>di secoli de li angeli creati</p>\n<p>anzi che l&rsquo;altro mondo fosse fatto;</p></div>\n\n<div class="stanza"><p>ma questo vero &egrave; scritto in molti lati</p>\n<p>da li scrittor de lo Spirito Santo,</p>\n<p>e tu te n&rsquo;avvedrai se bene agguati;</p></div>\n\n<div class="stanza"><p>e anche la ragione il vede alquanto,</p>\n<p>che non concederebbe che &rsquo; motori</p>\n<p>sanza sua perfezion fosser cotanto.</p></div>\n\n<div class="stanza"><p>Or sai tu dove e quando questi amori</p>\n<p>furon creati e come: s&igrave; che spenti</p>\n<p>nel tuo dis&iuml;o gi&agrave; son tre ardori.</p></div>\n\n<div class="stanza"><p>N&eacute; giugneriesi, numerando, al venti</p>\n<p>s&igrave; tosto, come de li angeli parte</p>\n<p>turb&ograve; il suggetto d&rsquo;i vostri alimenti.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra rimase, e cominci&ograve; quest&rsquo; arte</p>\n<p>che tu discerni, con tanto diletto,</p>\n<p>che mai da circ&uuml;ir non si diparte.</p></div>\n\n<div class="stanza"><p>Principio del cader fu il maladetto</p>\n<p>superbir di colui che tu vedesti</p>\n<p>da tutti i pesi del mondo costretto.</p></div>\n\n<div class="stanza"><p>Quelli che vedi qui furon modesti</p>\n<p>a riconoscer s&eacute; da la bontate</p>\n<p>che li avea fatti a tanto intender presti:</p></div>\n\n<div class="stanza"><p>per che le viste lor furo essaltate</p>\n<p>con grazia illuminante e con lor merto,</p>\n<p>si c&rsquo;hanno ferma e piena volontate;</p></div>\n\n<div class="stanza"><p>e non voglio che dubbi, ma sia certo,</p>\n<p>che ricever la grazia &egrave; meritorio</p>\n<p>secondo che l&rsquo;affetto l&rsquo;&egrave; aperto.</p></div>\n\n<div class="stanza"><p>Omai dintorno a questo consistorio</p>\n<p>puoi contemplare assai, se le parole</p>\n<p>mie son ricolte, sanz&rsquo; altro aiutorio.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; &rsquo;n terra per le vostre scole</p>\n<p>si legge che l&rsquo;angelica natura</p>\n<p>&egrave; tal, che &rsquo;ntende e si ricorda e vole,</p></div>\n\n<div class="stanza"><p>ancor dir&ograve;, perch&eacute; tu veggi pura</p>\n<p>la verit&agrave; che l&agrave; gi&ugrave; si confonde,</p>\n<p>equivocando in s&igrave; fatta lettura.</p></div>\n\n<div class="stanza"><p>Queste sustanze, poi che fur gioconde</p>\n<p>de la faccia di Dio, non volser viso</p>\n<p>da essa, da cui nulla si nasconde:</p></div>\n\n<div class="stanza"><p>per&ograve; non hanno vedere interciso</p>\n<p>da novo obietto, e per&ograve; non bisogna</p>\n<p>rememorar per concetto diviso;</p></div>\n\n<div class="stanza"><p>s&igrave; che l&agrave; gi&ugrave;, non dormendo, si sogna,</p>\n<p>credendo e non credendo dicer vero;</p>\n<p>ma ne l&rsquo;uno &egrave; pi&ugrave; colpa e pi&ugrave; vergogna.</p></div>\n\n<div class="stanza"><p>Voi non andate gi&ugrave; per un sentiero</p>\n<p>filosofando: tanto vi trasporta</p>\n<p>l&rsquo;amor de l&rsquo;apparenza e &rsquo;l suo pensiero!</p></div>\n\n<div class="stanza"><p>E ancor questo qua s&ugrave; si comporta</p>\n<p>con men disdegno che quando &egrave; posposta</p>\n<p>la divina Scrittura o quando &egrave; torta.</p></div>\n\n<div class="stanza"><p>Non vi si pensa quanto sangue costa</p>\n<p>seminarla nel mondo e quanto piace</p>\n<p>chi umilmente con essa s&rsquo;accosta.</p></div>\n\n<div class="stanza"><p>Per apparer ciascun s&rsquo;ingegna e face</p>\n<p>sue invenzioni; e quelle son trascorse</p>\n<p>da&rsquo; predicanti e &rsquo;l Vangelio si tace.</p></div>\n\n<div class="stanza"><p>Un dice che la luna si ritorse</p>\n<p>ne la passion di Cristo e s&rsquo;interpuose,</p>\n<p>per che &rsquo;l lume del sol gi&ugrave; non si porse;</p></div>\n\n<div class="stanza"><p>e mente, ch&eacute; la luce si nascose</p>\n<p>da s&eacute;: per&ograve; a li Spani e a l&rsquo;Indi</p>\n<p>come a&rsquo; Giudei tale eclissi rispuose.</p></div>\n\n<div class="stanza"><p>Non ha Fiorenza tanti Lapi e Bindi</p>\n<p>quante s&igrave; fatte favole per anno</p>\n<p>in pergamo si gridan quinci e quindi:</p></div>\n\n<div class="stanza"><p>s&igrave; che le pecorelle, che non sanno,</p>\n<p>tornan del pasco pasciute di vento,</p>\n<p>e non le scusa non veder lo danno.</p></div>\n\n<div class="stanza"><p>Non disse Cristo al suo primo convento:</p>\n<p>&lsquo;Andate, e predicate al mondo ciance&rsquo;;</p>\n<p>ma diede lor verace fondamento;</p></div>\n\n<div class="stanza"><p>e quel tanto son&ograve; ne le sue guance,</p>\n<p>s&igrave; ch&rsquo;a pugnar per accender la fede</p>\n<p>de l&rsquo;Evangelio fero scudo e lance.</p></div>\n\n<div class="stanza"><p>Ora si va con motti e con iscede</p>\n<p>a predicare, e pur che ben si rida,</p>\n<p>gonfia il cappuccio e pi&ugrave; non si richiede.</p></div>\n\n<div class="stanza"><p>Ma tale uccel nel becchetto s&rsquo;annida,</p>\n<p>che se &rsquo;l vulgo il vedesse, vederebbe</p>\n<p>la perdonanza di ch&rsquo;el si confida:</p></div>\n\n<div class="stanza"><p>per cui tanta stoltezza in terra crebbe,</p>\n<p>che, sanza prova d&rsquo;alcun testimonio,</p>\n<p>ad ogne promession si correrebbe.</p></div>\n\n<div class="stanza"><p>Di questo ingrassa il porco sant&rsquo; Antonio,</p>\n<p>e altri assai che sono ancor pi&ugrave; porci,</p>\n<p>pagando di moneta sanza conio.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; siam digressi assai, ritorci</p>\n<p>li occhi oramai verso la dritta strada,</p>\n<p>s&igrave; che la via col tempo si raccorci.</p></div>\n\n<div class="stanza"><p>Questa natura s&igrave; oltre s&rsquo;ingrada</p>\n<p>in numero, che mai non fu loquela</p>\n<p>n&eacute; concetto mortal che tanto vada;</p></div>\n\n<div class="stanza"><p>e se tu guardi quel che si revela</p>\n<p>per Dan&iuml;el, vedrai che &rsquo;n sue migliaia</p>\n<p>determinato numero si cela.</p></div>\n\n<div class="stanza"><p>La prima luce, che tutta la raia,</p>\n<p>per tanti modi in essa si recepe,</p>\n<p>quanti son li splendori a chi s&rsquo;appaia.</p></div>\n\n<div class="stanza"><p>Onde, per&ograve; che a l&rsquo;atto che concepe</p>\n<p>segue l&rsquo;affetto, d&rsquo;amar la dolcezza</p>\n<p>diversamente in essa ferve e tepe.</p></div>\n\n<div class="stanza"><p>Vedi l&rsquo;eccelso omai e la larghezza</p>\n<p>de l&rsquo;etterno valor, poscia che tanti</p>\n<p>speculi fatti s&rsquo;ha in che si spezza,</p></div>\n\n<div class="stanza"><p>uno manendo in s&eacute; come davanti&raquo;.</p></div>','<p class="cantohead">Canto XXX</p>\n\n<div class="stanza"><p>Forse semilia miglia di lontano</p>\n<p>ci ferve l&rsquo;ora sesta, e questo mondo</p>\n<p>china gi&agrave; l&rsquo;ombra quasi al letto piano,</p></div>\n\n<div class="stanza"><p>quando &rsquo;l mezzo del cielo, a noi profondo,</p>\n<p>comincia a farsi tal, ch&rsquo;alcuna stella</p>\n<p>perde il parere infino a questo fondo;</p></div>\n\n<div class="stanza"><p>e come vien la chiarissima ancella</p>\n<p>del sol pi&ugrave; oltre, cos&igrave; &rsquo;l ciel si chiude</p>\n<p>di vista in vista infino a la pi&ugrave; bella.</p></div>\n\n<div class="stanza"><p>Non altrimenti il tr&iuml;unfo che lude</p>\n<p>sempre dintorno al punto che mi vinse,</p>\n<p>parendo inchiuso da quel ch&rsquo;elli &rsquo;nchiude,</p></div>\n\n<div class="stanza"><p>a poco a poco al mio veder si stinse:</p>\n<p>per che tornar con li occhi a B&euml;atrice</p>\n<p>nulla vedere e amor mi costrinse.</p></div>\n\n<div class="stanza"><p>Se quanto infino a qui di lei si dice</p>\n<p>fosse conchiuso tutto in una loda,</p>\n<p>poca sarebbe a fornir questa vice.</p></div>\n\n<div class="stanza"><p>La bellezza ch&rsquo;io vidi si trasmoda</p>\n<p>non pur di l&agrave; da noi, ma certo io credo</p>\n<p>che solo il suo fattor tutta la goda.</p></div>\n\n<div class="stanza"><p>Da questo passo vinto mi concedo</p>\n<p>pi&ugrave; che gi&agrave; mai da punto di suo tema</p>\n<p>soprato fosse comico o tragedo:</p></div>\n\n<div class="stanza"><p>ch&eacute;, come sole in viso che pi&ugrave; trema,</p>\n<p>cos&igrave; lo rimembrar del dolce riso</p>\n<p>la mente mia da me medesmo scema.</p></div>\n\n<div class="stanza"><p>Dal primo giorno ch&rsquo;i&rsquo; vidi il suo viso</p>\n<p>in questa vita, infino a questa vista,</p>\n<p>non m&rsquo;&egrave; il seguire al mio cantar preciso;</p></div>\n\n<div class="stanza"><p>ma or convien che mio seguir desista</p>\n<p>pi&ugrave; dietro a sua bellezza, poetando,</p>\n<p>come a l&rsquo;ultimo suo ciascuno artista.</p></div>\n\n<div class="stanza"><p>Cotal qual io lascio a maggior bando</p>\n<p>che quel de la mia tuba, che deduce</p>\n<p>l&rsquo;ard&uuml;a sua matera terminando,</p></div>\n\n<div class="stanza"><p>con atto e voce di spedito duce</p>\n<p>ricominci&ograve;: &laquo;Noi siamo usciti fore</p>\n<p>del maggior corpo al ciel ch&rsquo;&egrave; pura luce:</p></div>\n\n<div class="stanza"><p>luce intellett&uuml;al, piena d&rsquo;amore;</p>\n<p>amor di vero ben, pien di letizia;</p>\n<p>letizia che trascende ogne dolzore.</p></div>\n\n<div class="stanza"><p>Qui vederai l&rsquo;una e l&rsquo;altra milizia</p>\n<p>di paradiso, e l&rsquo;una in quelli aspetti</p>\n<p>che tu vedrai a l&rsquo;ultima giustizia&raquo;.</p></div>\n\n<div class="stanza"><p>Come s&ugrave;bito lampo che discetti</p>\n<p>li spiriti visivi, s&igrave; che priva</p>\n<p>da l&rsquo;atto l&rsquo;occhio di pi&ugrave; forti obietti,</p></div>\n\n<div class="stanza"><p>cos&igrave; mi circunfulse luce viva,</p>\n<p>e lasciommi fasciato di tal velo</p>\n<p>del suo fulgor, che nulla m&rsquo;appariva.</p></div>\n\n<div class="stanza"><p>&laquo;Sempre l&rsquo;amor che queta questo cielo</p>\n<p>accoglie in s&eacute; con s&igrave; fatta salute,</p>\n<p>per far disposto a sua fiamma il candelo&raquo;.</p></div>\n\n<div class="stanza"><p>Non fur pi&ugrave; tosto dentro a me venute</p>\n<p>queste parole brievi, ch&rsquo;io compresi</p>\n<p>me sormontar di sopr&rsquo; a mia virtute;</p></div>\n\n<div class="stanza"><p>e di novella vista mi raccesi</p>\n<p>tale, che nulla luce &egrave; tanto mera,</p>\n<p>che li occhi miei non si fosser difesi;</p></div>\n\n<div class="stanza"><p>e vidi lume in forma di rivera</p>\n<p>fulvido di fulgore, intra due rive</p>\n<p>dipinte di mirabil primavera.</p></div>\n\n<div class="stanza"><p>Di tal fiumana uscian faville vive,</p>\n<p>e d&rsquo;ogne parte si mettien ne&rsquo; fiori,</p>\n<p>quasi rubin che oro circunscrive;</p></div>\n\n<div class="stanza"><p>poi, come inebr&iuml;ate da li odori,</p>\n<p>riprofondavan s&eacute; nel miro gurge,</p>\n<p>e s&rsquo;una intrava, un&rsquo;altra n&rsquo;uscia fori.</p></div>\n\n<div class="stanza"><p>&laquo;L&rsquo;alto disio che mo t&rsquo;infiamma e urge,</p>\n<p>d&rsquo;aver notizia di ci&ograve; che tu vei,</p>\n<p>tanto mi piace pi&ugrave; quanto pi&ugrave; turge;</p></div>\n\n<div class="stanza"><p>ma di quest&rsquo; acqua convien che tu bei</p>\n<p>prima che tanta sete in te si sazi&raquo;:</p>\n<p>cos&igrave; mi disse il sol de li occhi miei.</p></div>\n\n<div class="stanza"><p>Anche soggiunse: &laquo;Il fiume e li topazi</p>\n<p>ch&rsquo;entrano ed escono e &rsquo;l rider de l&rsquo;erbe</p>\n<p>son di lor vero umbriferi prefazi.</p></div>\n\n<div class="stanza"><p>Non che da s&eacute; sian queste cose acerbe;</p>\n<p>ma &egrave; difetto da la parte tua,</p>\n<p>che non hai viste ancor tanto superbe&raquo;.</p></div>\n\n<div class="stanza"><p>Non &egrave; fantin che s&igrave; s&ugrave;bito rua</p>\n<p>col volto verso il latte, se si svegli</p>\n<p>molto tardato da l&rsquo;usanza sua,</p></div>\n\n<div class="stanza"><p>come fec&rsquo; io, per far migliori spegli</p>\n<p>ancor de li occhi, chinandomi a l&rsquo;onda</p>\n<p>che si deriva perch&eacute; vi s&rsquo;immegli;</p></div>\n\n<div class="stanza"><p>e s&igrave; come di lei bevve la gronda</p>\n<p>de le palpebre mie, cos&igrave; mi parve</p>\n<p>di sua lunghezza divenuta tonda.</p></div>\n\n<div class="stanza"><p>Poi, come gente stata sotto larve,</p>\n<p>che pare altro che prima, se si sveste</p>\n<p>la sembianza non s&uuml;a in che disparve,</p></div>\n\n<div class="stanza"><p>cos&igrave; mi si cambiaro in maggior feste</p>\n<p>li fiori e le faville, s&igrave; ch&rsquo;io vidi</p>\n<p>ambo le corti del ciel manifeste.</p></div>\n\n<div class="stanza"><p>O isplendor di Dio, per cu&rsquo; io vidi</p>\n<p>l&rsquo;alto tr&iuml;unfo del regno verace,</p>\n<p>dammi virt&ugrave; a dir com&rsquo; &iuml;o il vidi!</p></div>\n\n<div class="stanza"><p>Lume &egrave; l&agrave; s&ugrave; che visibile face</p>\n<p>lo creatore a quella creatura</p>\n<p>che solo in lui vedere ha la sua pace.</p></div>\n\n<div class="stanza"><p>E&rsquo; si distende in circular figura,</p>\n<p>in tanto che la sua circunferenza</p>\n<p>sarebbe al sol troppo larga cintura.</p></div>\n\n<div class="stanza"><p>Fassi di raggio tutta sua parvenza</p>\n<p>reflesso al sommo del mobile primo,</p>\n<p>che prende quindi vivere e potenza.</p></div>\n\n<div class="stanza"><p>E come clivo in acqua di suo imo</p>\n<p>si specchia, quasi per vedersi addorno,</p>\n<p>quando &egrave; nel verde e ne&rsquo; fioretti opimo,</p></div>\n\n<div class="stanza"><p>s&igrave;, soprastando al lume intorno intorno,</p>\n<p>vidi specchiarsi in pi&ugrave; di mille soglie</p>\n<p>quanto di noi l&agrave; s&ugrave; fatto ha ritorno.</p></div>\n\n<div class="stanza"><p>E se l&rsquo;infimo grado in s&eacute; raccoglie</p>\n<p>s&igrave; grande lume, quanta &egrave; la larghezza</p>\n<p>di questa rosa ne l&rsquo;estreme foglie!</p></div>\n\n<div class="stanza"><p>La vista mia ne l&rsquo;ampio e ne l&rsquo;altezza</p>\n<p>non si smarriva, ma tutto prendeva</p>\n<p>il quanto e &rsquo;l quale di quella allegrezza.</p></div>\n\n<div class="stanza"><p>Presso e lontano, l&igrave;, n&eacute; pon n&eacute; leva:</p>\n<p>ch&eacute; dove Dio sanza mezzo governa,</p>\n<p>la legge natural nulla rileva.</p></div>\n\n<div class="stanza"><p>Nel giallo de la rosa sempiterna,</p>\n<p>che si digrada e dilata e redole</p>\n<p>odor di lode al sol che sempre verna,</p></div>\n\n<div class="stanza"><p>qual &egrave; colui che tace e dicer vole,</p>\n<p>mi trasse B&euml;atrice, e disse: &laquo;Mira</p>\n<p>quanto &egrave; &rsquo;l convento de le bianche stole!</p></div>\n\n<div class="stanza"><p>Vedi nostra citt&agrave; quant&rsquo; ella gira;</p>\n<p>vedi li nostri scanni s&igrave; ripieni,</p>\n<p>che poca gente pi&ugrave; ci si disira.</p></div>\n\n<div class="stanza"><p>E &rsquo;n quel gran seggio a che tu li occhi tieni</p>\n<p>per la corona che gi&agrave; v&rsquo;&egrave; s&ugrave; posta,</p>\n<p>prima che tu a queste nozze ceni,</p></div>\n\n<div class="stanza"><p>seder&agrave; l&rsquo;alma, che fia gi&ugrave; agosta,</p>\n<p>de l&rsquo;alto Arrigo, ch&rsquo;a drizzare Italia</p>\n<p>verr&agrave; in prima ch&rsquo;ella sia disposta.</p></div>\n\n<div class="stanza"><p>La cieca cupidigia che v&rsquo;ammalia</p>\n<p>simili fatti v&rsquo;ha al fantolino</p>\n<p>che muor per fame e caccia via la balia.</p></div>\n\n<div class="stanza"><p>E fia prefetto nel foro divino</p>\n<p>allora tal, che palese e coverto</p>\n<p>non ander&agrave; con lui per un cammino.</p></div>\n\n<div class="stanza"><p>Ma poco poi sar&agrave; da Dio sofferto</p>\n<p>nel santo officio; ch&rsquo;el sar&agrave; detruso</p>\n<p>l&agrave; dove Simon mago &egrave; per suo merto,</p></div>\n\n<div class="stanza"><p>e far&agrave; quel d&rsquo;Alagna intrar pi&ugrave; giuso&raquo;.</p></div>','<p class="cantohead">Canto XXXI</p>\n\n<div class="stanza"><p>In forma dunque di candida rosa</p>\n<p>mi si mostrava la milizia santa</p>\n<p>che nel suo sangue Cristo fece sposa;</p></div>\n\n<div class="stanza"><p>ma l&rsquo;altra, che volando vede e canta</p>\n<p>la gloria di colui che la &rsquo;nnamora</p>\n<p>e la bont&agrave; che la fece cotanta,</p></div>\n\n<div class="stanza"><p>s&igrave; come schiera d&rsquo;ape che s&rsquo;infiora</p>\n<p>una f&iuml;ata e una si ritorna</p>\n<p>l&agrave; dove suo laboro s&rsquo;insapora,</p></div>\n\n<div class="stanza"><p>nel gran fior discendeva che s&rsquo;addorna</p>\n<p>di tante foglie, e quindi risaliva</p>\n<p>l&agrave; dove &rsquo;l s&uuml;o amor sempre soggiorna.</p></div>\n\n<div class="stanza"><p>Le facce tutte avean di fiamma viva</p>\n<p>e l&rsquo;ali d&rsquo;oro, e l&rsquo;altro tanto bianco,</p>\n<p>che nulla neve a quel termine arriva.</p></div>\n\n<div class="stanza"><p>Quando scendean nel fior, di banco in banco</p>\n<p>porgevan de la pace e de l&rsquo;ardore</p>\n<p>ch&rsquo;elli acquistavan ventilando il fianco.</p></div>\n\n<div class="stanza"><p>N&eacute; l&rsquo;interporsi tra &rsquo;l disopra e &rsquo;l fiore</p>\n<p>di tanta moltitudine volante</p>\n<p>impediva la vista e lo splendore:</p></div>\n\n<div class="stanza"><p>ch&eacute; la luce divina &egrave; penetrante</p>\n<p>per l&rsquo;universo secondo ch&rsquo;&egrave; degno,</p>\n<p>s&igrave; che nulla le puote essere ostante.</p></div>\n\n<div class="stanza"><p>Questo sicuro e gaud&iuml;oso regno,</p>\n<p>frequente in gente antica e in novella,</p>\n<p>viso e amore avea tutto ad un segno.</p></div>\n\n<div class="stanza"><p>O trina luce che &rsquo;n unica stella</p>\n<p>scintillando a lor vista, s&igrave; li appaga!</p>\n<p>guarda qua giuso a la nostra procella!</p></div>\n\n<div class="stanza"><p>Se i barbari, venendo da tal plaga</p>\n<p>che ciascun giorno d&rsquo;Elice si cuopra,</p>\n<p>rotante col suo figlio ond&rsquo; ella &egrave; vaga,</p></div>\n\n<div class="stanza"><p>veggendo Roma e l&rsquo;ard&uuml;a sua opra,</p>\n<p>stupefaciensi, quando Laterano</p>\n<p>a le cose mortali and&ograve; di sopra;</p></div>\n\n<div class="stanza"><p>&iuml;o, che al divino da l&rsquo;umano,</p>\n<p>a l&rsquo;etterno dal tempo era venuto,</p>\n<p>e di Fiorenza in popol giusto e sano,</p></div>\n\n<div class="stanza"><p>di che stupor dovea esser compiuto!</p>\n<p>Certo tra esso e &rsquo;l gaudio mi facea</p>\n<p>libito non udire e starmi muto.</p></div>\n\n<div class="stanza"><p>E quasi peregrin che si ricrea</p>\n<p>nel tempio del suo voto riguardando,</p>\n<p>e spera gi&agrave; ridir com&rsquo; ello stea,</p></div>\n\n<div class="stanza"><p>su per la viva luce passeggiando,</p>\n<p>menava &iuml;o li occhi per li gradi,</p>\n<p>mo s&ugrave;, mo gi&ugrave; e mo recirculando.</p></div>\n\n<div class="stanza"><p>Ved&euml;a visi a carit&agrave; s&uuml;adi,</p>\n<p>d&rsquo;altrui lume fregiati e di suo riso,</p>\n<p>e atti ornati di tutte onestadi.</p></div>\n\n<div class="stanza"><p>La forma general di paradiso</p>\n<p>gi&agrave; tutta m&iuml;o sguardo avea compresa,</p>\n<p>in nulla parte ancor fermato fiso;</p></div>\n\n<div class="stanza"><p>e volgeami con voglia r&iuml;accesa</p>\n<p>per domandar la mia donna di cose</p>\n<p>di che la mente mia era sospesa.</p></div>\n\n<div class="stanza"><p>Uno intend&euml;a, e altro mi rispuose:</p>\n<p>credea veder Beatrice e vidi un sene</p>\n<p>vestito con le genti glor&iuml;ose.</p></div>\n\n<div class="stanza"><p>Diffuso era per li occhi e per le gene</p>\n<p>di benigna letizia, in atto pio</p>\n<p>quale a tenero padre si convene.</p></div>\n\n<div class="stanza"><p>E &laquo;Ov&rsquo; &egrave; ella?&raquo;, s&ugrave;bito diss&rsquo; io.</p>\n<p>Ond&rsquo; elli: &laquo;A terminar lo tuo disiro</p>\n<p>mosse Beatrice me del loco mio;</p></div>\n\n<div class="stanza"><p>e se riguardi s&ugrave; nel terzo giro</p>\n<p>dal sommo grado, tu la rivedrai</p>\n<p>nel trono che suoi merti le sortiro&raquo;.</p></div>\n\n<div class="stanza"><p>Sanza risponder, li occhi s&ugrave; levai,</p>\n<p>e vidi lei che si facea corona</p>\n<p>reflettendo da s&eacute; li etterni rai.</p></div>\n\n<div class="stanza"><p>Da quella reg&iuml;on che pi&ugrave; s&ugrave; tona</p>\n<p>occhio mortale alcun tanto non dista,</p>\n<p>qualunque in mare pi&ugrave; gi&ugrave; s&rsquo;abbandona,</p></div>\n\n<div class="stanza"><p>quanto l&igrave; da Beatrice la mia vista;</p>\n<p>ma nulla mi facea, ch&eacute; s&uuml;a effige</p>\n<p>non discend&euml;a a me per mezzo mista.</p></div>\n\n<div class="stanza"><p>&laquo;O donna in cui la mia speranza vige,</p>\n<p>e che soffristi per la mia salute</p>\n<p>in inferno lasciar le tue vestige,</p></div>\n\n<div class="stanza"><p>di tante cose quant&rsquo; i&rsquo; ho vedute,</p>\n<p>dal tuo podere e da la tua bontate</p>\n<p>riconosco la grazia e la virtute.</p></div>\n\n<div class="stanza"><p>Tu m&rsquo;hai di servo tratto a libertate</p>\n<p>per tutte quelle vie, per tutt&rsquo; i modi</p>\n<p>che di ci&ograve; fare avei la potestate.</p></div>\n\n<div class="stanza"><p>La tua magnificenza in me custodi,</p>\n<p>s&igrave; che l&rsquo;anima mia, che fatt&rsquo; hai sana,</p>\n<p>piacente a te dal corpo si disnodi&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; orai; e quella, s&igrave; lontana</p>\n<p>come parea, sorrise e riguardommi;</p>\n<p>poi si torn&ograve; a l&rsquo;etterna fontana.</p></div>\n\n<div class="stanza"><p>E &rsquo;l santo sene: &laquo;Acci&ograve; che tu assommi</p>\n<p>perfettamente&raquo;, disse, &laquo;il tuo cammino,</p>\n<p>a che priego e amor santo mandommi,</p></div>\n\n<div class="stanza"><p>vola con li occhi per questo giardino;</p>\n<p>ch&eacute; veder lui t&rsquo;acconcer&agrave; lo sguardo</p>\n<p>pi&ugrave; al montar per lo raggio divino.</p></div>\n\n<div class="stanza"><p>E la regina del cielo, ond&rsquo; &iuml;o ardo</p>\n<p>tutto d&rsquo;amor, ne far&agrave; ogne grazia,</p>\n<p>per&ograve; ch&rsquo;i&rsquo; sono il suo fedel Bernardo&raquo;.</p></div>\n\n<div class="stanza"><p>Qual &egrave; colui che forse di Croazia</p>\n<p>viene a veder la Veronica nostra,</p>\n<p>che per l&rsquo;antica fame non sen sazia,</p></div>\n\n<div class="stanza"><p>ma dice nel pensier, fin che si mostra:</p>\n<p>&lsquo;Segnor mio Ies&ugrave; Cristo, Dio verace,</p>\n<p>or fu s&igrave; fatta la sembianza vostra?&rsquo;;</p></div>\n\n<div class="stanza"><p>tal era io mirando la vivace</p>\n<p>carit&agrave; di colui che &rsquo;n questo mondo,</p>\n<p>contemplando, gust&ograve; di quella pace.</p></div>\n\n<div class="stanza"><p>&laquo;Figliuol di grazia, quest&rsquo; esser giocondo&raquo;,</p>\n<p>cominci&ograve; elli, &laquo;non ti sar&agrave; noto,</p>\n<p>tenendo li occhi pur qua gi&ugrave; al fondo;</p></div>\n\n<div class="stanza"><p>ma guarda i cerchi infino al pi&ugrave; remoto,</p>\n<p>tanto che veggi seder la regina</p>\n<p>cui questo regno &egrave; suddito e devoto&raquo;.</p></div>\n\n<div class="stanza"><p>Io levai li occhi; e come da mattina</p>\n<p>la parte or&iuml;ental de l&rsquo;orizzonte</p>\n<p>soverchia quella dove &rsquo;l sol declina,</p></div>\n\n<div class="stanza"><p>cos&igrave;, quasi di valle andando a monte</p>\n<p>con li occhi, vidi parte ne lo stremo</p>\n<p>vincer di lume tutta l&rsquo;altra fronte.</p></div>\n\n<div class="stanza"><p>E come quivi ove s&rsquo;aspetta il temo</p>\n<p>che mal guid&ograve; Fetonte, pi&ugrave; s&rsquo;infiamma,</p>\n<p>e quinci e quindi il lume si fa scemo,</p></div>\n\n<div class="stanza"><p>cos&igrave; quella pacifica oriafiamma</p>\n<p>nel mezzo s&rsquo;avvivava, e d&rsquo;ogne parte</p>\n<p>per igual modo allentava la fiamma;</p></div>\n\n<div class="stanza"><p>e a quel mezzo, con le penne sparte,</p>\n<p>vid&rsquo; io pi&ugrave; di mille angeli festanti,</p>\n<p>ciascun distinto di fulgore e d&rsquo;arte.</p></div>\n\n<div class="stanza"><p>Vidi a lor giochi quivi e a lor canti</p>\n<p>ridere una bellezza, che letizia</p>\n<p>era ne li occhi a tutti li altri santi;</p></div>\n\n<div class="stanza"><p>e s&rsquo;io avessi in dir tanta divizia</p>\n<p>quanta ad imaginar, non ardirei</p>\n<p>lo minimo tentar di sua delizia.</p></div>\n\n<div class="stanza"><p>Bernardo, come vide li occhi miei</p>\n<p>nel caldo suo caler fissi e attenti,</p>\n<p>li suoi con tanto affetto volse a lei,</p></div>\n\n<div class="stanza"><p>che &rsquo; miei di rimirar f&eacute; pi&ugrave; ardenti.</p></div>','<p class="cantohead">Canto XXXII</p>\n\n<div class="stanza"><p>Affetto al suo piacer, quel contemplante</p>\n<p>libero officio di dottore assunse,</p>\n<p>e cominci&ograve; queste parole sante:</p></div>\n\n<div class="stanza"><p>&laquo;La piaga che Maria richiuse e unse,</p>\n<p>quella ch&rsquo;&egrave; tanto bella da&rsquo; suoi piedi</p>\n<p>&egrave; colei che l&rsquo;aperse e che la punse.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;ordine che fanno i terzi sedi,</p>\n<p>siede Rachel di sotto da costei</p>\n<p>con B&euml;atrice, s&igrave; come tu vedi.</p></div>\n\n<div class="stanza"><p>Sarra e Rebecca, Iud&igrave;t e colei</p>\n<p>che fu bisava al cantor che per doglia</p>\n<p>del fallo disse &lsquo;Miserere mei&rsquo;,</p></div>\n\n<div class="stanza"><p>puoi tu veder cos&igrave; di soglia in soglia</p>\n<p>gi&ugrave; digradar, com&rsquo; io ch&rsquo;a proprio nome</p>\n<p>vo per la rosa gi&ugrave; di foglia in foglia.</p></div>\n\n<div class="stanza"><p>E dal settimo grado in gi&ugrave;, s&igrave; come</p>\n<p>infino ad esso, succedono Ebree,</p>\n<p>dirimendo del fior tutte le chiome;</p></div>\n\n<div class="stanza"><p>perch&eacute;, secondo lo sguardo che f&eacute;e</p>\n<p>la fede in Cristo, queste sono il muro</p>\n<p>a che si parton le sacre scalee.</p></div>\n\n<div class="stanza"><p>Da questa parte onde &rsquo;l fiore &egrave; maturo</p>\n<p>di tutte le sue foglie, sono assisi</p>\n<p>quei che credettero in Cristo venturo;</p></div>\n\n<div class="stanza"><p>da l&rsquo;altra parte onde sono intercisi</p>\n<p>di v&ograve;ti i semicirculi, si stanno</p>\n<p>quei ch&rsquo;a Cristo venuto ebber li visi.</p></div>\n\n<div class="stanza"><p>E come quinci il glor&iuml;oso scanno</p>\n<p>de la donna del cielo e li altri scanni</p>\n<p>di sotto lui cotanta cerna fanno,</p></div>\n\n<div class="stanza"><p>cos&igrave; di contra quel del gran Giovanni,</p>\n<p>che sempre santo &rsquo;l diserto e &rsquo;l martiro</p>\n<p>sofferse, e poi l&rsquo;inferno da due anni;</p></div>\n\n<div class="stanza"><p>e sotto lui cos&igrave; cerner sortiro</p>\n<p>Francesco, Benedetto e Augustino</p>\n<p>e altri fin qua gi&ugrave; di giro in giro.</p></div>\n\n<div class="stanza"><p>Or mira l&rsquo;alto proveder divino:</p>\n<p>ch&eacute; l&rsquo;uno e l&rsquo;altro aspetto de la fede</p>\n<p>igualmente empier&agrave; questo giardino.</p></div>\n\n<div class="stanza"><p>E sappi che dal grado in gi&ugrave; che fiede</p>\n<p>a mezzo il tratto le due discrezioni,</p>\n<p>per nullo proprio merito si siede,</p></div>\n\n<div class="stanza"><p>ma per l&rsquo;altrui, con certe condizioni:</p>\n<p>ch&eacute; tutti questi son spiriti ascolti</p>\n<p>prima ch&rsquo;avesser vere elez&iuml;oni.</p></div>\n\n<div class="stanza"><p>Ben te ne puoi accorger per li volti</p>\n<p>e anche per le voci p&uuml;erili,</p>\n<p>se tu li guardi bene e se li ascolti.</p></div>\n\n<div class="stanza"><p>Or dubbi tu e dubitando sili;</p>\n<p>ma io discioglier&ograve; &rsquo;l forte legame</p>\n<p>in che ti stringon li pensier sottili.</p></div>\n\n<div class="stanza"><p>Dentro a l&rsquo;ampiezza di questo reame</p>\n<p>cas&uuml;al punto non puote aver sito,</p>\n<p>se non come tristizia o sete o fame:</p></div>\n\n<div class="stanza"><p>ch&eacute; per etterna legge &egrave; stabilito</p>\n<p>quantunque vedi, s&igrave; che giustamente</p>\n<p>ci si risponde da l&rsquo;anello al dito;</p></div>\n\n<div class="stanza"><p>e per&ograve; questa festinata gente</p>\n<p>a vera vita non &egrave; sine causa</p>\n<p>intra s&eacute; qui pi&ugrave; e meno eccellente.</p></div>\n\n<div class="stanza"><p>Lo rege per cui questo regno pausa</p>\n<p>in tanto amore e in tanto diletto,</p>\n<p>che nulla volont&agrave; &egrave; di pi&ugrave; ausa,</p></div>\n\n<div class="stanza"><p>le menti tutte nel suo lieto aspetto</p>\n<p>creando, a suo piacer di grazia dota</p>\n<p>diversamente; e qui basti l&rsquo;effetto.</p></div>\n\n<div class="stanza"><p>E ci&ograve; espresso e chiaro vi si nota</p>\n<p>ne la Scrittura santa in quei gemelli</p>\n<p>che ne la madre ebber l&rsquo;ira commota.</p></div>\n\n<div class="stanza"><p>Per&ograve;, secondo il color d&rsquo;i capelli,</p>\n<p>di cotal grazia l&rsquo;altissimo lume</p>\n<p>degnamente convien che s&rsquo;incappelli.</p></div>\n\n<div class="stanza"><p>Dunque, sanza merc&eacute; di lor costume,</p>\n<p>locati son per gradi differenti,</p>\n<p>sol differendo nel primiero acume.</p></div>\n\n<div class="stanza"><p>Bastavasi ne&rsquo; secoli recenti</p>\n<p>con l&rsquo;innocenza, per aver salute,</p>\n<p>solamente la fede d&rsquo;i parenti;</p></div>\n\n<div class="stanza"><p>poi che le prime etadi fuor compiute,</p>\n<p>convenne ai maschi a l&rsquo;innocenti penne</p>\n<p>per circuncidere acquistar virtute;</p></div>\n\n<div class="stanza"><p>ma poi che &rsquo;l tempo de la grazia venne,</p>\n<p>sanza battesmo perfetto di Cristo</p>\n<p>tale innocenza l&agrave; gi&ugrave; si ritenne.</p></div>\n\n<div class="stanza"><p>Riguarda omai ne la faccia che a Cristo</p>\n<p>pi&ugrave; si somiglia, ch&eacute; la sua chiarezza</p>\n<p>sola ti pu&ograve; disporre a veder Cristo&raquo;.</p></div>\n\n<div class="stanza"><p>Io vidi sopra lei tanta allegrezza</p>\n<p>piover, portata ne le menti sante</p>\n<p>create a trasvolar per quella altezza,</p></div>\n\n<div class="stanza"><p>che quantunque io avea visto davante,</p>\n<p>di tanta ammirazion non mi sospese,</p>\n<p>n&eacute; mi mostr&ograve; di Dio tanto sembiante;</p></div>\n\n<div class="stanza"><p>e quello amor che primo l&igrave; discese,</p>\n<p>cantando &lsquo;Ave, Maria, grat&iuml;a plena&rsquo;,</p>\n<p>dinanzi a lei le sue ali distese.</p></div>\n\n<div class="stanza"><p>Rispuose a la divina cantilena</p>\n<p>da tutte parti la beata corte,</p>\n<p>s&igrave; ch&rsquo;ogne vista sen f&eacute; pi&ugrave; serena.</p></div>\n\n<div class="stanza"><p>&laquo;O santo padre, che per me comporte</p>\n<p>l&rsquo;esser qua gi&ugrave;, lasciando il dolce loco</p>\n<p>nel qual tu siedi per etterna sorte,</p></div>\n\n<div class="stanza"><p>qual &egrave; quell&rsquo; angel che con tanto gioco</p>\n<p>guarda ne li occhi la nostra regina,</p>\n<p>innamorato s&igrave; che par di foco?&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; ricorsi ancora a la dottrina</p>\n<p>di colui ch&rsquo;abbelliva di Maria,</p>\n<p>come del sole stella mattutina.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Baldezza e leggiadria</p>\n<p>quant&rsquo; esser puote in angelo e in alma,</p>\n<p>tutta &egrave; in lui; e s&igrave; volem che sia,</p></div>\n\n<div class="stanza"><p>perch&rsquo; elli &egrave; quelli che port&ograve; la palma</p>\n<p>giuso a Maria, quando &rsquo;l Figliuol di Dio</p>\n<p>carcar si volse de la nostra salma.</p></div>\n\n<div class="stanza"><p>Ma vieni omai con li occhi s&igrave; com&rsquo; io</p>\n<p>andr&ograve; parlando, e nota i gran patrici</p>\n<p>di questo imperio giustissimo e pio.</p></div>\n\n<div class="stanza"><p>Quei due che seggon l&agrave; s&ugrave; pi&ugrave; felici</p>\n<p>per esser propinquissimi ad Agusta,</p>\n<p>son d&rsquo;esta rosa quasi due radici:</p></div>\n\n<div class="stanza"><p>colui che da sinistra le s&rsquo;aggiusta</p>\n<p>&egrave; il padre per lo cui ardito gusto</p>\n<p>l&rsquo;umana specie tanto amaro gusta;</p></div>\n\n<div class="stanza"><p>dal destro vedi quel padre vetusto</p>\n<p>di Santa Chiesa a cui Cristo le chiavi</p>\n<p>raccomand&ograve; di questo fior venusto.</p></div>\n\n<div class="stanza"><p>E quei che vide tutti i tempi gravi,</p>\n<p>pria che morisse, de la bella sposa</p>\n<p>che s&rsquo;acquist&ograve; con la lancia e coi clavi,</p></div>\n\n<div class="stanza"><p>siede lungh&rsquo; esso, e lungo l&rsquo;altro posa</p>\n<p>quel duca sotto cui visse di manna</p>\n<p>la gente ingrata, mobile e retrosa.</p></div>\n\n<div class="stanza"><p>Di contr&rsquo; a Pietro vedi sedere Anna,</p>\n<p>tanto contenta di mirar sua figlia,</p>\n<p>che non move occhio per cantare osanna;</p></div>\n\n<div class="stanza"><p>e contro al maggior padre di famiglia</p>\n<p>siede Lucia, che mosse la tua donna</p>\n<p>quando chinavi, a rovinar, le ciglia.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; &rsquo;l tempo fugge che t&rsquo;assonna,</p>\n<p>qui farem punto, come buon sartore</p>\n<p>che com&rsquo; elli ha del panno fa la gonna;</p></div>\n\n<div class="stanza"><p>e drizzeremo li occhi al primo amore,</p>\n<p>s&igrave; che, guardando verso lui, pen&egrave;tri</p>\n<p>quant&rsquo; &egrave; possibil per lo suo fulgore.</p></div>\n\n<div class="stanza"><p>Veramente, ne forse tu t&rsquo;arretri</p>\n<p>movendo l&rsquo;ali tue, credendo oltrarti,</p>\n<p>orando grazia conven che s&rsquo;impetri</p></div>\n\n<div class="stanza"><p>grazia da quella che puote aiutarti;</p>\n<p>e tu mi seguirai con l&rsquo;affezione,</p>\n<p>s&igrave; che dal dicer mio lo cor non parti&raquo;.</p></div>\n\n<div class="stanza"><p>E cominci&ograve; questa santa orazione:</p></div>','<p class="cantohead">Canto XXXIII</p>\n\n<div class="stanza"><p>&laquo;Vergine Madre, figlia del tuo figlio,</p>\n<p>umile e alta pi&ugrave; che creatura,</p>\n<p>termine fisso d&rsquo;etterno consiglio,</p></div>\n\n<div class="stanza"><p>tu se&rsquo; colei che l&rsquo;umana natura</p>\n<p>nobilitasti s&igrave;, che &rsquo;l suo fattore</p>\n<p>non disdegn&ograve; di farsi sua fattura.</p></div>\n\n<div class="stanza"><p>Nel ventre tuo si raccese l&rsquo;amore,</p>\n<p>per lo cui caldo ne l&rsquo;etterna pace</p>\n<p>cos&igrave; &egrave; germinato questo fiore.</p></div>\n\n<div class="stanza"><p>Qui se&rsquo; a noi merid&iuml;ana face</p>\n<p>di caritate, e giuso, intra &rsquo; mortali,</p>\n<p>se&rsquo; di speranza fontana vivace.</p></div>\n\n<div class="stanza"><p>Donna, se&rsquo; tanto grande e tanto vali,</p>\n<p>che qual vuol grazia e a te non ricorre,</p>\n<p>sua dis&iuml;anza vuol volar sanz&rsquo; ali.</p></div>\n\n<div class="stanza"><p>La tua benignit&agrave; non pur soccorre</p>\n<p>a chi domanda, ma molte f&iuml;ate</p>\n<p>liberamente al dimandar precorre.</p></div>\n\n<div class="stanza"><p>In te misericordia, in te pietate,</p>\n<p>in te magnificenza, in te s&rsquo;aduna</p>\n<p>quantunque in creatura &egrave; di bontate.</p></div>\n\n<div class="stanza"><p>Or questi, che da l&rsquo;infima lacuna</p>\n<p>de l&rsquo;universo infin qui ha vedute</p>\n<p>le vite spiritali ad una ad una,</p></div>\n\n<div class="stanza"><p>supplica a te, per grazia, di virtute</p>\n<p>tanto, che possa con li occhi levarsi</p>\n<p>pi&ugrave; alto verso l&rsquo;ultima salute.</p></div>\n\n<div class="stanza"><p>E io, che mai per mio veder non arsi</p>\n<p>pi&ugrave; ch&rsquo;i&rsquo; fo per lo suo, tutti miei prieghi</p>\n<p>ti porgo, e priego che non sieno scarsi,</p></div>\n\n<div class="stanza"><p>perch&eacute; tu ogne nube li disleghi</p>\n<p>di sua mortalit&agrave; co&rsquo; prieghi tuoi,</p>\n<p>s&igrave; che &rsquo;l sommo piacer li si dispieghi.</p></div>\n\n<div class="stanza"><p>Ancor ti priego, regina, che puoi</p>\n<p>ci&ograve; che tu vuoli, che conservi sani,</p>\n<p>dopo tanto veder, li affetti suoi.</p></div>\n\n<div class="stanza"><p>Vinca tua guardia i movimenti umani:</p>\n<p>vedi Beatrice con quanti beati</p>\n<p>per li miei prieghi ti chiudon le mani!&raquo;.</p></div>\n\n<div class="stanza"><p>Li occhi da Dio diletti e venerati,</p>\n<p>fissi ne l&rsquo;orator, ne dimostraro</p>\n<p>quanto i devoti prieghi le son grati;</p></div>\n\n<div class="stanza"><p>indi a l&rsquo;etterno lume s&rsquo;addrizzaro,</p>\n<p>nel qual non si dee creder che s&rsquo;invii</p>\n<p>per creatura l&rsquo;occhio tanto chiaro.</p></div>\n\n<div class="stanza"><p>E io ch&rsquo;al fine di tutt&rsquo; i disii</p>\n<p>appropinquava, s&igrave; com&rsquo; io dovea,</p>\n<p>l&rsquo;ardor del desiderio in me finii.</p></div>\n\n<div class="stanza"><p>Bernardo m&rsquo;accennava, e sorridea,</p>\n<p>perch&rsquo; io guardassi suso; ma io era</p>\n<p>gi&agrave; per me stesso tal qual ei volea:</p></div>\n\n<div class="stanza"><p>ch&eacute; la mia vista, venendo sincera,</p>\n<p>e pi&ugrave; e pi&ugrave; intrava per lo raggio</p>\n<p>de l&rsquo;alta luce che da s&eacute; &egrave; vera.</p></div>\n\n<div class="stanza"><p>Da quinci innanzi il mio veder fu maggio</p>\n<p>che &rsquo;l parlar mostra, ch&rsquo;a tal vista cede,</p>\n<p>e cede la memoria a tanto oltraggio.</p></div>\n\n<div class="stanza"><p>Qual &egrave; col&uuml;i che sognando vede,</p>\n<p>che dopo &rsquo;l sogno la passione impressa</p>\n<p>rimane, e l&rsquo;altro a la mente non riede,</p></div>\n\n<div class="stanza"><p>cotal son io, ch&eacute; quasi tutta cessa</p>\n<p>mia vis&iuml;one, e ancor mi distilla</p>\n<p>nel core il dolce che nacque da essa.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la neve al sol si disigilla;</p>\n<p>cos&igrave; al vento ne le foglie levi</p>\n<p>si perdea la sentenza di Sibilla.</p></div>\n\n<div class="stanza"><p>O somma luce che tanto ti levi</p>\n<p>da&rsquo; concetti mortali, a la mia mente</p>\n<p>ripresta un poco di quel che parevi,</p></div>\n\n<div class="stanza"><p>e fa la lingua mia tanto possente,</p>\n<p>ch&rsquo;una favilla sol de la tua gloria</p>\n<p>possa lasciare a la futura gente;</p></div>\n\n<div class="stanza"><p>ch&eacute;, per tornare alquanto a mia memoria</p>\n<p>e per sonare un poco in questi versi,</p>\n<p>pi&ugrave; si conceper&agrave; di tua vittoria.</p></div>\n\n<div class="stanza"><p>Io credo, per l&rsquo;acume ch&rsquo;io soffersi</p>\n<p>del vivo raggio, ch&rsquo;i&rsquo; sarei smarrito,</p>\n<p>se li occhi miei da lui fossero aversi.</p></div>\n\n<div class="stanza"><p>E&rsquo; mi ricorda ch&rsquo;io fui pi&ugrave; ardito</p>\n<p>per questo a sostener, tanto ch&rsquo;i&rsquo; giunsi</p>\n<p>l&rsquo;aspetto mio col valore infinito.</p></div>\n\n<div class="stanza"><p>Oh abbondante grazia ond&rsquo; io presunsi</p>\n<p>ficcar lo viso per la luce etterna,</p>\n<p>tanto che la veduta vi consunsi!</p></div>\n\n<div class="stanza"><p>Nel suo profondo vidi che s&rsquo;interna,</p>\n<p>legato con amore in un volume,</p>\n<p>ci&ograve; che per l&rsquo;universo si squaderna:</p></div>\n\n<div class="stanza"><p>sustanze e accidenti e lor costume</p>\n<p>quasi conflati insieme, per tal modo</p>\n<p>che ci&ograve; ch&rsquo;i&rsquo; dico &egrave; un semplice lume.</p></div>\n\n<div class="stanza"><p>La forma universal di questo nodo</p>\n<p>credo ch&rsquo;i&rsquo; vidi, perch&eacute; pi&ugrave; di largo,</p>\n<p>dicendo questo, mi sento ch&rsquo;i&rsquo; godo.</p></div>\n\n<div class="stanza"><p>Un punto solo m&rsquo;&egrave; maggior letargo</p>\n<p>che venticinque secoli a la &rsquo;mpresa</p>\n<p>che f&eacute; Nettuno ammirar l&rsquo;ombra d&rsquo;Argo.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la mente mia, tutta sospesa,</p>\n<p>mirava fissa, immobile e attenta,</p>\n<p>e sempre di mirar faceasi accesa.</p></div>\n\n<div class="stanza"><p>A quella luce cotal si diventa,</p>\n<p>che volgersi da lei per altro aspetto</p>\n<p>&egrave; impossibil che mai si consenta;</p></div>\n\n<div class="stanza"><p>per&ograve; che &rsquo;l ben, ch&rsquo;&egrave; del volere obietto,</p>\n<p>tutto s&rsquo;accoglie in lei, e fuor di quella</p>\n<p>&egrave; defettivo ci&ograve; ch&rsquo;&egrave; l&igrave; perfetto.</p></div>\n\n<div class="stanza"><p>Omai sar&agrave; pi&ugrave; corta mia favella,</p>\n<p>pur a quel ch&rsquo;io ricordo, che d&rsquo;un fante</p>\n<p>che bagni ancor la lingua a la mammella.</p></div>\n\n<div class="stanza"><p>Non perch&eacute; pi&ugrave; ch&rsquo;un semplice sembiante</p>\n<p>fosse nel vivo lume ch&rsquo;io mirava,</p>\n<p>che tal &egrave; sempre qual s&rsquo;era davante;</p></div>\n\n<div class="stanza"><p>ma per la vista che s&rsquo;avvalorava</p>\n<p>in me guardando, una sola parvenza,</p>\n<p>mutandom&rsquo; io, a me si travagliava.</p></div>\n\n<div class="stanza"><p>Ne la profonda e chiara sussistenza</p>\n<p>de l&rsquo;alto lume parvermi tre giri</p>\n<p>di tre colori e d&rsquo;una contenenza;</p></div>\n\n<div class="stanza"><p>e l&rsquo;un da l&rsquo;altro come iri da iri</p>\n<p>parea reflesso, e &rsquo;l terzo parea foco</p>\n<p>che quinci e quindi igualmente si spiri.</p></div>\n\n<div class="stanza"><p>Oh quanto &egrave; corto il dire e come fioco</p>\n<p>al mio concetto! e questo, a quel ch&rsquo;i&rsquo; vidi,</p>\n<p>&egrave; tanto, che non basta a dicer &lsquo;poco&rsquo;.</p></div>\n\n<div class="stanza"><p>O luce etterna che sola in te sidi,</p>\n<p>sola t&rsquo;intendi, e da te intelletta</p>\n<p>e intendente te ami e arridi!</p></div>\n\n<div class="stanza"><p>Quella circulazion che s&igrave; concetta</p>\n<p>pareva in te come lume reflesso,</p>\n<p>da li occhi miei alquanto circunspetta,</p></div>\n\n<div class="stanza"><p>dentro da s&eacute;, del suo colore stesso,</p>\n<p>mi parve pinta de la nostra effige:</p>\n<p>per che &rsquo;l mio viso in lei tutto era messo.</p></div>\n\n<div class="stanza"><p>Qual &egrave; &rsquo;l geom&egrave;tra che tutto s&rsquo;affige</p>\n<p>per misurar lo cerchio, e non ritrova,</p>\n<p>pensando, quel principio ond&rsquo; elli indige,</p></div>\n\n<div class="stanza"><p>tal era io a quella vista nova:</p>\n<p>veder voleva come si convenne</p>\n<p>l&rsquo;imago al cerchio e come vi s&rsquo;indova;</p></div>\n\n<div class="stanza"><p>ma non eran da ci&ograve; le proprie penne:</p>\n<p>se non che la mia mente fu percossa</p>\n<p>da un fulgore in che sua voglia venne.</p></div>\n\n<div class="stanza"><p>A l&rsquo;alta fantasia qui manc&ograve; possa;</p>\n<p>ma gi&agrave; volgeva il mio disio e &rsquo;l velle,</p>\n<p>s&igrave; come rota ch&rsquo;igualmente &egrave; mossa,</p></div>\n\n<div class="stanza"><p>l&rsquo;amor che move il sole e l&rsquo;altre stelle.</p></div>']};

},{}],7:[function(require,module,exports){
// paradiso/longfellow.js
"use strict";module.exports={bookname:'paradiso',author:'Dante Alighieri',translationid:"longfellow",title:'Paradise',translation:true,source:'<a href="http://www.gutenberg.org/ebooks/1003">Project Gutenberg</a>',translationshortname:"Longfellow",translationfullname:"Henry Wadsworth Longfellow",translationclass:"poetry longfellow",text:['<p class="title">Paradise</p>\n\t<p class="author">Henry Wadsworth Longfellow</p>','<p class="cantohead">Paradise: Canto I</p>\n\n<div class="stanza"><p>The glory of Him who moveth everything</p>\n<p class="slindent">Doth penetrate the universe, and shine</p>\n<p class="slindent">In one part more and in another less.</p></div>\n\n<div class="stanza"><p>Within that heaven which most his light receives</p>\n<p class="slindent">Was I, and things beheld which to repeat</p>\n<p class="slindent">Nor knows, nor can, who from above descends;</p></div>\n\n<div class="stanza"><p>Because in drawing near to its desire</p>\n<p class="slindent">Our intellect ingulphs itself so far,</p>\n<p class="slindent">That after it the memory cannot go.</p></div>\n\n<div class="stanza"><p>Truly whatever of the holy realm</p>\n<p class="slindent">I had the power to treasure in my mind</p>\n<p class="slindent">Shall now become the subject of my song.</p></div>\n\n<div class="stanza"><p>O good Apollo, for this last emprise</p>\n<p class="slindent">Make of me such a vessel of thy power</p>\n<p class="slindent">As giving the beloved laurel asks!</p></div>\n\n<div class="stanza"><p>One summit of Parnassus hitherto</p>\n<p class="slindent">Has been enough for me, but now with both</p>\n<p class="slindent">I needs must enter the arena left.</p></div>\n\n<div class="stanza"><p>Enter into my bosom, thou, and breathe</p>\n<p class="slindent">As at the time when Marsyas thou didst draw</p>\n<p class="slindent">Out of the scabbard of those limbs of his.</p></div>\n\n<div class="stanza"><p>O power divine, lend&rsquo;st thou thyself to me</p>\n<p class="slindent">So that the shadow of the blessed realm</p>\n<p class="slindent">Stamped in my brain I can make manifest,</p></div>\n\n<div class="stanza"><p>Thou&rsquo;lt see me come unto thy darling tree,</p>\n<p class="slindent">And crown myself thereafter with those leaves</p>\n<p class="slindent">Of which the theme and thou shall make me worthy.</p></div>\n\n<div class="stanza"><p>So seldom, Father, do we gather them</p>\n<p class="slindent">For triumph or of Caesar or of Poet,</p>\n<p class="slindent">(The fault and shame of human inclinations,)</p></div>\n\n<div class="stanza"><p>That the Peneian foliage should bring forth</p>\n<p class="slindent">Joy to the joyous Delphic deity,</p>\n<p class="slindent">When any one it makes to thirst for it.</p></div>\n\n<div class="stanza"><p>A little spark is followed by great flame;</p>\n<p class="slindent">Perchance with better voices after me</p>\n<p class="slindent">Shall prayer be made that Cyrrha may respond!</p></div>\n\n<div class="stanza"><p>To mortal men by passages diverse</p>\n<p class="slindent">Uprises the world&rsquo;s lamp; but by that one</p>\n<p class="slindent">Which circles four uniteth with three crosses,</p></div>\n\n<div class="stanza"><p>With better course and with a better star</p>\n<p class="slindent">Conjoined it issues, and the mundane wax</p>\n<p class="slindent">Tempers and stamps more after its own fashion.</p></div>\n\n<div class="stanza"><p>Almost that passage had made morning there</p>\n<p class="slindent">And evening here, and there was wholly white</p>\n<p class="slindent">That hemisphere, and black the other part,</p></div>\n\n<div class="stanza"><p>When Beatrice towards the left-hand side</p>\n<p class="slindent">I saw turned round, and gazing at the sun;</p>\n<p class="slindent">Never did eagle fasten so upon it!</p></div>\n\n<div class="stanza"><p>And even as a second ray is wont</p>\n<p class="slindent">To issue from the first and reascend,</p>\n<p class="slindent">Like to a pilgrim who would fain return,</p></div>\n\n<div class="stanza"><p>Thus of her action, through the eyes infused</p>\n<p class="slindent">In my imagination, mine I made,</p>\n<p class="slindent">And sunward fixed mine eyes beyond our wont.</p></div>\n\n<div class="stanza"><p>There much is lawful which is here unlawful</p>\n<p class="slindent">Unto our powers, by virtue of the place</p>\n<p class="slindent">Made for the human species as its own.</p></div>\n\n<div class="stanza"><p>Not long I bore it, nor so little while</p>\n<p class="slindent">But I beheld it sparkle round about</p>\n<p class="slindent">Like iron that comes molten from the fire;</p></div>\n\n<div class="stanza"><p>And suddenly it seemed that day to day</p>\n<p class="slindent">Was added, as if He who has the power</p>\n<p class="slindent">Had with another sun the heaven adorned.</p></div>\n\n<div class="stanza"><p>With eyes upon the everlasting wheels</p>\n<p class="slindent">Stood Beatrice all intent, and I, on her</p>\n<p class="slindent">Fixing my vision from above removed,</p></div>\n\n<div class="stanza"><p>Such at her aspect inwardly became</p>\n<p class="slindent">As Glaucus, tasting of the herb that made him</p>\n<p class="slindent">Peer of the other gods beneath the sea.</p></div>\n\n<div class="stanza"><p>To represent transhumanise in words</p>\n<p class="slindent">Impossible were; the example, then, suffice</p>\n<p class="slindent">Him for whom Grace the experience reserves.</p></div>\n\n<div class="stanza"><p>If I was merely what of me thou newly</p>\n<p class="slindent">Createdst, Love who governest the heaven,</p>\n<p class="slindent">Thou knowest, who didst lift me with thy light!</p></div>\n\n<div class="stanza"><p>When now the wheel, which thou dost make eternal</p>\n<p class="slindent">Desiring thee, made me attentive to it</p>\n<p class="slindent">By harmony thou dost modulate and measure,</p></div>\n\n<div class="stanza"><p>Then seemed to me so much of heaven enkindled</p>\n<p class="slindent">By the sun&rsquo;s flame, that neither rain nor river</p>\n<p class="slindent">E&rsquo;er made a lake so widely spread abroad.</p></div>\n\n<div class="stanza"><p>The newness of the sound and the great light</p>\n<p class="slindent">Kindled in me a longing for their cause,</p>\n<p class="slindent">Never before with such acuteness felt;</p></div>\n\n<div class="stanza"><p>Whence she, who saw me as I saw myself,</p>\n<p class="slindent">To quiet in me my perturbed mind,</p>\n<p class="slindent">Opened her mouth, ere I did mine to ask,</p></div>\n\n<div class="stanza"><p>And she began: &ldquo;Thou makest thyself so dull</p>\n<p class="slindent">With false imagining, that thou seest not</p>\n<p class="slindent">What thou wouldst see if thou hadst shaken it off.</p></div>\n\n<div class="stanza"><p>Thou art not upon earth, as thou believest;</p>\n<p class="slindent">But lightning, fleeing its appropriate site,</p>\n<p class="slindent">Ne&rsquo;er ran as thou, who thitherward returnest.&rdquo;</p></div>\n\n<div class="stanza"><p>If of my former doubt I was divested</p>\n<p class="slindent">By these brief little words more smiled than spoken,</p>\n<p class="slindent">I in a new one was the more ensnared;</p></div>\n\n<div class="stanza"><p>And said: &ldquo;Already did I rest content</p>\n<p class="slindent">From great amazement; but am now amazed</p>\n<p class="slindent">In what way I transcend these bodies light.&rdquo;</p></div>\n\n<div class="stanza"><p>Whereupon she, after a pitying sigh,</p>\n<p class="slindent">Her eyes directed tow&rsquo;rds me with that look</p>\n<p class="slindent">A mother casts on a delirious child;</p></div>\n\n<div class="stanza"><p>And she began: &ldquo;All things whate&rsquo;er they be</p>\n<p class="slindent">Have order among themselves, and this is form,</p>\n<p class="slindent">That makes the universe resemble God.</p></div>\n\n<div class="stanza"><p>Here do the higher creatures see the footprints</p>\n<p class="slindent">Of the Eternal Power, which is the end</p>\n<p class="slindent">Whereto is made the law already mentioned.</p></div>\n\n<div class="stanza"><p>In the order that I speak of are inclined</p>\n<p class="slindent">All natures, by their destinies diverse,</p>\n<p class="slindent">More or less near unto their origin;</p></div>\n\n<div class="stanza"><p>Hence they move onward unto ports diverse</p>\n<p class="slindent">O&rsquo;er the great sea of being; and each one</p>\n<p class="slindent">With instinct given it which bears it on.</p></div>\n\n<div class="stanza"><p>This bears away the fire towards the moon;</p>\n<p class="slindent">This is in mortal hearts the motive power</p>\n<p class="slindent">This binds together and unites the earth.</p></div>\n\n<div class="stanza"><p>Nor only the created things that are</p>\n<p class="slindent">Without intelligence this bow shoots forth,</p>\n<p class="slindent">But those that have both intellect and love.</p></div>\n\n<div class="stanza"><p>The Providence that regulates all this</p>\n<p class="slindent">Makes with its light the heaven forever quiet,</p>\n<p class="slindent">Wherein that turns which has the greatest haste.</p></div>\n\n<div class="stanza"><p>And thither now, as to a site decreed,</p>\n<p class="slindent">Bears us away the virtue of that cord</p>\n<p class="slindent">Which aims its arrows at a joyous mark.</p></div>\n\n<div class="stanza"><p>True is it, that as oftentimes the form</p>\n<p class="slindent">Accords not with the intention of the art,</p>\n<p class="slindent">Because in answering is matter deaf,</p></div>\n\n<div class="stanza"><p>So likewise from this course doth deviate</p>\n<p class="slindent">Sometimes the creature, who the power possesses,</p>\n<p class="slindent">Though thus impelled, to swerve some other way,</p></div>\n\n<div class="stanza"><p>(In the same wise as one may see the fire</p>\n<p class="slindent">Fall from a cloud,) if the first impetus</p>\n<p class="slindent">Earthward is wrested by some false delight.</p></div>\n\n<div class="stanza"><p>Thou shouldst not wonder more, if well I judge,</p>\n<p class="slindent">At thine ascent, than at a rivulet</p>\n<p class="slindent">From some high mount descending to the lowland.</p></div>\n\n<div class="stanza"><p>Marvel it would be in thee, if deprived</p>\n<p class="slindent">Of hindrance, thou wert seated down below,</p>\n<p class="slindent">As if on earth the living fire were quiet.&rdquo;</p></div>\n\n<div class="stanza"><p>Thereat she heavenward turned again her face.</p></div>','<p class="cantohead">Paradiso: Canto II</p>\n<div class="stanza"><p>O Ye, who in some pretty little boat,</p>\n<p class="slindent">Eager to listen, have been following</p>\n<p class="slindent">Behind my ship, that singing sails along,</p></div>\n\n<div class="stanza"><p>Turn back to look again upon your shores;</p>\n<p class="slindent">Do not put out to sea, lest peradventure,</p>\n<p class="slindent">In losing me, you might yourselves be lost.</p></div>\n\n<div class="stanza"><p>The sea I sail has never yet been passed;</p>\n<p class="slindent">Minerva breathes, and pilots me Apollo,</p>\n<p class="slindent">And Muses nine point out to me the Bears.</p></div>\n\n<div class="stanza"><p>Ye other few who have the neck uplifted</p>\n<p class="slindent">Betimes to th&rsquo; bread of Angels upon which</p>\n<p class="slindent">One liveth here and grows not sated by it,</p></div>\n\n<div class="stanza"><p>Well may you launch upon the deep salt-sea</p>\n<p class="slindent">Your vessel, keeping still my wake before you</p>\n<p class="slindent">Upon the water that grows smooth again.</p></div>\n\n<div class="stanza"><p>Those glorious ones who unto Colchos passed</p>\n<p class="slindent">Were not so wonder-struck as you shall be,</p>\n<p class="slindent">When Jason they beheld a ploughman made!</p></div>\n\n<div class="stanza"><p>The con-created and perpetual thirst</p>\n<p class="slindent">For the realm deiform did bear us on,</p>\n<p class="slindent">As swift almost as ye the heavens behold.</p></div>\n\n<div class="stanza"><p>Upward gazed Beatrice, and I at her;</p>\n<p class="slindent">And in such space perchance as strikes a bolt</p>\n<p class="slindent">And flies, and from the notch unlocks itself,</p></div>\n\n<div class="stanza"><p>Arrived I saw me where a wondrous thing</p>\n<p class="slindent">Drew to itself my sight; and therefore she</p>\n<p class="slindent">From whom no care of mine could be concealed,</p></div>\n\n<div class="stanza"><p>Towards me turning, blithe as beautiful,</p>\n<p class="slindent">Said unto me: &ldquo;Fix gratefully thy mind</p>\n<p class="slindent">On God, who unto the first star has brought us.&rdquo;</p></div>\n\n<div class="stanza"><p>It seemed to me a cloud encompassed us,</p>\n<p class="slindent">Luminous, dense, consolidate and bright</p>\n<p class="slindent">As adamant on which the sun is striking.</p></div>\n\n<div class="stanza"><p>Into itself did the eternal pearl</p>\n<p class="slindent">Receive us, even as water doth receive</p>\n<p class="slindent">A ray of light, remaining still unbroken.</p></div>\n\n<div class="stanza"><p>If I was body, (and we here conceive not</p>\n<p class="slindent">How one dimension tolerates another,</p>\n<p class="slindent">Which needs must be if body enter body,)</p></div>\n\n<div class="stanza"><p>More the desire should be enkindled in us</p>\n<p class="slindent">That essence to behold, wherein is seen</p>\n<p class="slindent">How God and our own nature were united.</p></div>\n\n<div class="stanza"><p>There will be seen what we receive by faith,</p>\n<p class="slindent">Not demonstrated, but self-evident</p>\n<p class="slindent">In guise of the first truth that man believes.</p></div>\n\n<div class="stanza"><p>I made reply: &ldquo;Madonna, as devoutly</p>\n<p class="slindent">As most I can do I give thanks to Him</p>\n<p class="slindent">Who has removed me from the mortal world.</p></div>\n\n<div class="stanza"><p>But tell me what the dusky spots may be</p>\n<p class="slindent">Upon this body, which below on earth</p>\n<p class="slindent">Make people tell that fabulous tale of Cain?&rdquo;</p></div>\n\n<div class="stanza"><p>Somewhat she smiled; and then, &ldquo;If the opinion</p>\n<p class="slindent">Of mortals be erroneous,&rdquo; she said,</p>\n<p class="slindent">&ldquo;Where&rsquo;er the key of sense doth not unlock,</p></div>\n\n<div class="stanza"><p>Certes, the shafts of wonder should not pierce thee</p>\n<p class="slindent">Now, forasmuch as, following the senses,</p>\n<p class="slindent">Thou seest that the reason has short wings.</p></div>\n\n<div class="stanza"><p>But tell me what thou think&rsquo;st of it thyself.&rdquo;</p>\n<p class="slindent">And I: &ldquo;What seems to us up here diverse,</p>\n<p class="slindent">Is caused, I think, by bodies rare and dense.&rdquo;</p></div>\n\n<div class="stanza"><p>And she: &ldquo;Right truly shalt thou see immersed</p>\n<p class="slindent">In error thy belief, if well thou hearest</p>\n<p class="slindent">The argument that I shall make against it.</p></div>\n\n<div class="stanza"><p>Lights many the eighth sphere displays to you</p>\n<p class="slindent">Which in their quality and quantity</p>\n<p class="slindent">May noted be of aspects different.</p></div>\n\n<div class="stanza"><p>If this were caused by rare and dense alone,</p>\n<p class="slindent">One only virtue would there be in all</p>\n<p class="slindent">Or more or less diffused, or equally.</p></div>\n\n<div class="stanza"><p>Virtues diverse must be perforce the fruits</p>\n<p class="slindent">Of formal principles; and these, save one,</p>\n<p class="slindent">Of course would by thy reasoning be destroyed.</p></div>\n\n<div class="stanza"><p>Besides, if rarity were of this dimness</p>\n<p class="slindent">The cause thou askest, either through and through</p>\n<p class="slindent">This planet thus attenuate were of matter,</p></div>\n\n<div class="stanza"><p>Or else, as in a body is apportioned</p>\n<p class="slindent">The fat and lean, so in like manner this</p>\n<p class="slindent">Would in its volume interchange the leaves.</p></div>\n\n<div class="stanza"><p>Were it the former, in the sun&rsquo;s eclipse</p>\n<p class="slindent">It would be manifest by the shining through</p>\n<p class="slindent">Of light, as through aught tenuous interfused.</p></div>\n\n<div class="stanza"><p>This is not so; hence we must scan the other,</p>\n<p class="slindent">And if it chance the other I demolish,</p>\n<p class="slindent">Then falsified will thy opinion be.</p></div>\n\n<div class="stanza"><p>But if this rarity go not through and through,</p>\n<p class="slindent">There needs must be a limit, beyond which</p>\n<p class="slindent">Its contrary prevents the further passing,</p></div>\n\n<div class="stanza"><p>And thence the foreign radiance is reflected,</p>\n<p class="slindent">Even as a colour cometh back from glass,</p>\n<p class="slindent">The which behind itself concealeth lead.</p></div>\n\n<div class="stanza"><p>Now thou wilt say the sunbeam shows itself</p>\n<p class="slindent">More dimly there than in the other parts,</p>\n<p class="slindent">By being there reflected farther back.</p></div>\n\n<div class="stanza"><p>From this reply experiment will free thee</p>\n<p class="slindent">If e&rsquo;er thou try it, which is wont to be</p>\n<p class="slindent">The fountain to the rivers of your arts.</p></div>\n\n<div class="stanza"><p>Three mirrors shalt thou take, and two remove</p>\n<p class="slindent">Alike from thee, the other more remote</p>\n<p class="slindent">Between the former two shall meet thine eyes.</p></div>\n\n<div class="stanza"><p>Turned towards these, cause that behind thy back</p>\n<p class="slindent">Be placed a light, illuming the three mirrors</p>\n<p class="slindent">And coming back to thee by all reflected.</p></div>\n\n<div class="stanza"><p>Though in its quantity be not so ample</p>\n<p class="slindent">The image most remote, there shalt thou see</p>\n<p class="slindent">How it perforce is equally resplendent.</p></div>\n\n<div class="stanza"><p>Now, as beneath the touches of warm rays</p>\n<p class="slindent">Naked the subject of the snow remains</p>\n<p class="slindent">Both of its former colour and its cold,</p></div>\n\n<div class="stanza"><p>Thee thus remaining in thy intellect,</p>\n<p class="slindent">Will I inform with such a living light,</p>\n<p class="slindent">That it shall tremble in its aspect to thee.</p></div>\n\n<div class="stanza"><p>Within the heaven of the divine repose</p>\n<p class="slindent">Revolves a body, in whose virtue lies</p>\n<p class="slindent">The being of whatever it contains.</p></div>\n\n<div class="stanza"><p>The following heaven, that has so many eyes,</p>\n<p class="slindent">Divides this being by essences diverse,</p>\n<p class="slindent">Distinguished from it, and by it contained.</p></div>\n\n<div class="stanza"><p>The other spheres, by various differences,</p>\n<p class="slindent">All the distinctions which they have within them</p>\n<p class="slindent">Dispose unto their ends and their effects.</p></div>\n\n<div class="stanza"><p>Thus do these organs of the world proceed,</p>\n<p class="slindent">As thou perceivest now, from grade to grade;</p>\n<p class="slindent">Since from above they take, and act beneath.</p></div>\n\n<div class="stanza"><p>Observe me well, how through this place I come</p>\n<p class="slindent">Unto the truth thou wishest, that hereafter</p>\n<p class="slindent">Thou mayst alone know how to keep the ford</p></div>\n\n<div class="stanza"><p>The power and motion of the holy spheres,</p>\n<p class="slindent">As from the artisan the hammer&rsquo;s craft,</p>\n<p class="slindent">Forth from the blessed motors must proceed.</p></div>\n\n<div class="stanza"><p>The heaven, which lights so manifold make fair,</p>\n<p class="slindent">From the Intelligence profound, which turns it,</p>\n<p class="slindent">The image takes, and makes of it a seal.</p></div>\n\n<div class="stanza"><p>And even as the soul within your dust</p>\n<p class="slindent">Through members different and accommodated</p>\n<p class="slindent">To faculties diverse expands itself,</p></div>\n\n<div class="stanza"><p>So likewise this Intelligence diffuses</p>\n<p class="slindent">Its virtue multiplied among the stars.</p>\n<p class="slindent">Itself revolving on its unity.</p></div>\n\n<div class="stanza"><p>Virtue diverse doth a diverse alloyage</p>\n<p class="slindent">Make with the precious body that it quickens,</p>\n<p class="slindent">In which, as life in you, it is combined.</p></div>\n\n<div class="stanza"><p>From the glad nature whence it is derived,</p>\n<p class="slindent">The mingled virtue through the body shines,</p>\n<p class="slindent">Even as gladness through the living pupil.</p></div>\n\n<div class="stanza"><p>From this proceeds whate&rsquo;er from light to light</p>\n<p class="slindent">Appeareth different, not from dense and rare:</p>\n<p class="slindent">This is the formal principle that produces,</p></div>\n\n<div class="stanza"><p>According to its goodness, dark and bright.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto III</p>\n<div class="stanza"><p>That Sun, which erst with love my bosom warmed,</p>\n<p class="slindent">Of beauteous truth had unto me discovered,</p>\n<p class="slindent">By proving and reproving, the sweet aspect.</p></div>\n\n<div class="stanza"><p>And, that I might confess myself convinced</p>\n<p class="slindent">And confident, so far as was befitting,</p>\n<p class="slindent">I lifted more erect my head to speak.</p></div>\n\n<div class="stanza"><p>But there appeared a vision, which withdrew me</p>\n<p class="slindent">So close to it, in order to be seen,</p>\n<p class="slindent">That my confession I remembered not.</p></div>\n\n<div class="stanza"><p>Such as through polished and transparent glass,</p>\n<p class="slindent">Or waters crystalline and undisturbed,</p>\n<p class="slindent">But not so deep as that their bed be lost,</p></div>\n\n<div class="stanza"><p>Come back again the outlines of our faces</p>\n<p class="slindent">So feeble, that a pearl on forehead white</p>\n<p class="slindent">Comes not less speedily unto our eyes;</p></div>\n\n<div class="stanza"><p>Such saw I many faces prompt to speak,</p>\n<p class="slindent">So that I ran in error opposite</p>\n<p class="slindent">To that which kindled love &rsquo;twixt man and fountain.</p></div>\n\n<div class="stanza"><p>As soon as I became aware of them,</p>\n<p class="slindent">Esteeming them as mirrored semblances,</p>\n<p class="slindent">To see of whom they were, mine eyes I turned,</p></div>\n\n<div class="stanza"><p>And nothing saw, and once more turned them forward</p>\n<p class="slindent">Direct into the light of my sweet Guide,</p>\n<p class="slindent">Who smiling kindled in her holy eyes.</p></div>\n\n<div class="stanza"><p>&ldquo;Marvel thou not,&rdquo; she said to me, &ldquo;because</p>\n<p class="slindent">I smile at this thy puerile conceit,</p>\n<p class="slindent">Since on the truth it trusts not yet its foot,</p></div>\n\n<div class="stanza"><p>But turns thee, as &rsquo;tis wont, on emptiness.</p>\n<p class="slindent">True substances are these which thou beholdest,</p>\n<p class="slindent">Here relegate for breaking of some vow.</p></div>\n\n<div class="stanza"><p>Therefore speak with them, listen and believe;</p>\n<p class="slindent">For the true light, which giveth peace to them,</p>\n<p class="slindent">Permits them not to turn from it their feet.&rdquo;</p></div>\n\n<div class="stanza"><p>And I unto the shade that seemed most wishful</p>\n<p class="slindent">To speak directed me, and I began,</p>\n<p class="slindent">As one whom too great eagerness bewilders:</p></div>\n\n<div class="stanza"><p>&ldquo;O well-created spirit, who in the rays</p>\n<p class="slindent">Of life eternal dost the sweetness taste</p>\n<p class="slindent">Which being untasted ne&rsquo;er is comprehended,</p></div>\n\n<div class="stanza"><p>Grateful &rsquo;twill be to me, if thou content me</p>\n<p class="slindent">Both with thy name and with your destiny.&rdquo;</p>\n<p class="slindent">Whereat she promptly and with laughing eyes:</p></div>\n\n<div class="stanza"><p>&ldquo;Our charity doth never shut the doors</p>\n<p class="slindent">Against a just desire, except as one</p>\n<p class="slindent">Who wills that all her court be like herself.</p></div>\n\n<div class="stanza"><p>I was a virgin sister in the world;</p>\n<p class="slindent">And if thy mind doth contemplate me well,</p>\n<p class="slindent">The being more fair will not conceal me from thee,</p></div>\n\n<div class="stanza"><p>But thou shalt recognise I am Piccarda,</p>\n<p class="slindent">Who, stationed here among these other blessed,</p>\n<p class="slindent">Myself am blessed in the slowest sphere.</p></div>\n\n<div class="stanza"><p>All our affections, that alone inflamed</p>\n<p class="slindent">Are in the pleasure of the Holy Ghost,</p>\n<p class="slindent">Rejoice at being of his order formed;</p></div>\n\n<div class="stanza"><p>And this allotment, which appears so low,</p>\n<p class="slindent">Therefore is given us, because our vows</p>\n<p class="slindent">Have been neglected and in some part void.&rdquo;</p></div>\n\n<div class="stanza"><p>Whence I to her: &ldquo;In your miraculous aspects</p>\n<p class="slindent">There shines I know not what of the divine,</p>\n<p class="slindent">Which doth transform you from our first conceptions.</p></div>\n\n<div class="stanza"><p>Therefore I was not swift in my remembrance;</p>\n<p class="slindent">But what thou tellest me now aids me so,</p>\n<p class="slindent">That the refiguring is easier to me.</p></div>\n\n<div class="stanza"><p>But tell me, ye who in this place are happy,</p>\n<p class="slindent">Are you desirous of a higher place,</p>\n<p class="slindent">To see more or to make yourselves more friends?&rdquo;</p></div>\n\n<div class="stanza"><p>First with those other shades she smiled a little;</p>\n<p class="slindent">Thereafter answered me so full of gladness,</p>\n<p class="slindent">She seemed to burn in the first fire of love:</p></div>\n\n<div class="stanza"><p>&ldquo;Brother, our will is quieted by virtue</p>\n<p class="slindent">Of charity, that makes us wish alone</p>\n<p class="slindent">For what we have, nor gives us thirst for more.</p></div>\n\n<div class="stanza"><p>If to be more exalted we aspired,</p>\n<p class="slindent">Discordant would our aspirations be</p>\n<p class="slindent">Unto the will of Him who here secludes us;</p></div>\n\n<div class="stanza"><p>Which thou shalt see finds no place in these circles,</p>\n<p class="slindent">If being in charity is needful here,</p>\n<p class="slindent">And if thou lookest well into its nature;</p></div>\n\n<div class="stanza"><p>Nay, &rsquo;tis essential to this blest existence</p>\n<p class="slindent">To keep itself within the will divine,</p>\n<p class="slindent">Whereby our very wishes are made one;</p></div>\n\n<div class="stanza"><p>So that, as we are station above station</p>\n<p class="slindent">Throughout this realm, to all the realm &rsquo;tis pleasing,</p>\n<p class="slindent">As to the King, who makes his will our will.</p></div>\n\n<div class="stanza"><p>And his will is our peace; this is the sea</p>\n<p class="slindent">To which is moving onward whatsoever</p>\n<p class="slindent">It doth create, and all that nature makes.&rdquo;</p></div>\n\n<div class="stanza"><p>Then it was clear to me how everywhere</p>\n<p class="slindent">In heaven is Paradise, although the grace</p>\n<p class="slindent">Of good supreme there rain not in one measure.</p></div>\n\n<div class="stanza"><p>But as it comes to pass, if one food sates,</p>\n<p class="slindent">And for another still remains the longing,</p>\n<p class="slindent">We ask for this, and that decline with thanks,</p></div>\n\n<div class="stanza"><p>E&rsquo;en thus did I; with gesture and with word,</p>\n<p class="slindent">To learn from her what was the web wherein</p>\n<p class="slindent">She did not ply the shuttle to the end.</p></div>\n\n<div class="stanza"><p>&ldquo;A perfect life and merit high in-heaven</p>\n<p class="slindent">A lady o&rsquo;er us,&rdquo; said she, &ldquo;by whose rule</p>\n<p class="slindent">Down in your world they vest and veil themselves,</p></div>\n\n<div class="stanza"><p>That until death they may both watch and sleep</p>\n<p class="slindent">Beside that Spouse who every vow accepts</p>\n<p class="slindent">Which charity conformeth to his pleasure.</p></div>\n\n<div class="stanza"><p>To follow her, in girlhood from the world</p>\n<p class="slindent">I fled, and in her habit shut myself,</p>\n<p class="slindent">And pledged me to the pathway of her sect.</p></div>\n\n<div class="stanza"><p>Then men accustomed unto evil more</p>\n<p class="slindent">Than unto good, from the sweet cloister tore me;</p>\n<p class="slindent">God knows what afterward my life became.</p></div>\n\n<div class="stanza"><p>This other splendour, which to thee reveals</p>\n<p class="slindent">Itself on my right side, and is enkindled</p>\n<p class="slindent">With all the illumination of our sphere,</p></div>\n\n<div class="stanza"><p>What of myself I say applies to her;</p>\n<p class="slindent">A nun was she, and likewise from her head</p>\n<p class="slindent">Was ta&rsquo;en the shadow of the sacred wimple.</p></div>\n\n<div class="stanza"><p>But when she too was to the world returned</p>\n<p class="slindent">Against her wishes and against good usage,</p>\n<p class="slindent">Of the heart&rsquo;s veil she never was divested.</p></div>\n\n<div class="stanza"><p>Of great Costanza this is the effulgence,</p>\n<p class="slindent">Who from the second wind of Suabia</p>\n<p class="slindent">Brought forth the third and latest puissance.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus unto me she spake, and then began</p>\n<p class="slindent">&ldquo;Ave Maria&rdquo; singing, and in singing</p>\n<p class="slindent">Vanished, as through deep water something heavy.</p></div>\n\n<div class="stanza"><p>My sight, that followed her as long a time</p>\n<p class="slindent">As it was possible, when it had lost her</p>\n<p class="slindent">Turned round unto the mark of more desire,</p></div>\n\n<div class="stanza"><p>And wholly unto Beatrice reverted;</p>\n<p class="slindent">But she such lightnings flashed into mine eyes,</p>\n<p class="slindent">That at the first my sight endured it not;</p></div>\n\n<div class="stanza"><p>And this in questioning more backward made me.</p></div>','<p class="cantohead">Paradiso: Canto IV</p>\n<div class="stanza"><p>Between two viands, equally removed</p>\n<p class="slindent">And tempting, a free man would die of hunger</p>\n<p class="slindent">Ere either he could bring unto his teeth.</p></div>\n\n<div class="stanza"><p>So would a lamb between the ravenings</p>\n<p class="slindent">Of two fierce wolves stand fearing both alike;</p>\n<p class="slindent">And so would stand a dog between two does.</p></div>\n\n<div class="stanza"><p>Hence, if I held my peace, myself I blame not,</p>\n<p class="slindent">Impelled in equal measure by my doubts,</p>\n<p class="slindent">Since it must be so, nor do I commend.</p></div>\n\n<div class="stanza"><p>I held my peace; but my desire was painted</p>\n<p class="slindent">Upon my face, and questioning with that</p>\n<p class="slindent">More fervent far than by articulate speech.</p></div>\n\n<div class="stanza"><p>Beatrice did as Daniel had done</p>\n<p class="slindent">Relieving Nebuchadnezzar from the wrath</p>\n<p class="slindent">Which rendered him unjustly merciless,</p></div>\n\n<div class="stanza"><p>And said: &ldquo;Well see I how attracteth thee</p>\n<p class="slindent">One and the other wish, so that thy care</p>\n<p class="slindent">Binds itself so that forth it does not breathe.</p></div>\n\n<div class="stanza"><p>Thou arguest, if good will be permanent,</p>\n<p class="slindent">The violence of others, for what reason</p>\n<p class="slindent">Doth it decrease the measure of my merit?</p></div>\n\n<div class="stanza"><p>Again for doubting furnish thee occasion</p>\n<p class="slindent">Souls seeming to return unto the stars,</p>\n<p class="slindent">According to the sentiment of Plato.</p></div>\n\n<div class="stanza"><p>These are the questions which upon thy wish</p>\n<p class="slindent">Are thrusting equally; and therefore first</p>\n<p class="slindent">Will I treat that which hath the most of gall.</p></div>\n\n<div class="stanza"><p>He of the Seraphim most absorbed in God,</p>\n<p class="slindent">Moses, and Samuel, and whichever John</p>\n<p class="slindent">Thou mayst select, I say, and even Mary,</p></div>\n\n<div class="stanza"><p>Have not in any other heaven their seats,</p>\n<p class="slindent">Than have those spirits that just appeared to thee,</p>\n<p class="slindent">Nor of existence more or fewer years;</p></div>\n\n<div class="stanza"><p>But all make beautiful the primal circle,</p>\n<p class="slindent">And have sweet life in different degrees,</p>\n<p class="slindent">By feeling more or less the eternal breath.</p></div>\n\n<div class="stanza"><p>They showed themselves here, not because allotted</p>\n<p class="slindent">This sphere has been to them, but to give sign</p>\n<p class="slindent">Of the celestial which is least exalted.</p></div>\n\n<div class="stanza"><p>To speak thus is adapted to your mind,</p>\n<p class="slindent">Since only through the sense it apprehendeth</p>\n<p class="slindent">What then it worthy makes of intellect.</p></div>\n\n<div class="stanza"><p>On this account the Scripture condescends</p>\n<p class="slindent">Unto your faculties, and feet and hands</p>\n<p class="slindent">To God attributes, and means something else;</p></div>\n\n<div class="stanza"><p>And Holy Church under an aspect human</p>\n<p class="slindent">Gabriel and Michael represent to you,</p>\n<p class="slindent">And him who made Tobias whole again.</p></div>\n\n<div class="stanza"><p>That which Timaeus argues of the soul</p>\n<p class="slindent">Doth not resemble that which here is seen,</p>\n<p class="slindent">Because it seems that as he speaks he thinks.</p></div>\n\n<div class="stanza"><p>He says the soul unto its star returns,</p>\n<p class="slindent">Believing it to have been severed thence</p>\n<p class="slindent">Whenever nature gave it as a form.</p></div>\n\n<div class="stanza"><p>Perhaps his doctrine is of other guise</p>\n<p class="slindent">Than the words sound, and possibly may be</p>\n<p class="slindent">With meaning that is not to be derided.</p></div>\n\n<div class="stanza"><p>If he doth mean that to these wheels return</p>\n<p class="slindent">The honour of their influence and the blame,</p>\n<p class="slindent">Perhaps his bow doth hit upon some truth.</p></div>\n\n<div class="stanza"><p>This principle ill understood once warped</p>\n<p class="slindent">The whole world nearly, till it went astray</p>\n<p class="slindent">Invoking Jove and Mercury and Mars.</p></div>\n\n<div class="stanza"><p>The other doubt which doth disquiet thee</p>\n<p class="slindent">Less venom has, for its malevolence</p>\n<p class="slindent">Could never lead thee otherwhere from me.</p></div>\n\n<div class="stanza"><p>That as unjust our justice should appear</p>\n<p class="slindent">In eyes of mortals, is an argument</p>\n<p class="slindent">Of faith, and not of sin heretical.</p></div>\n\n<div class="stanza"><p>But still, that your perception may be able</p>\n<p class="slindent">To thoroughly penetrate this verity,</p>\n<p class="slindent">As thou desirest, I will satisfy thee.</p></div>\n\n<div class="stanza"><p>If it be violence when he who suffers</p>\n<p class="slindent">Co-operates not with him who uses force,</p>\n<p class="slindent">These souls were not on that account excused;</p></div>\n\n<div class="stanza"><p>For will is never quenched unless it will,</p>\n<p class="slindent">But operates as nature doth in fire</p>\n<p class="slindent">If violence a thousand times distort it.</p></div>\n\n<div class="stanza"><p>Hence, if it yieldeth more or less, it seconds</p>\n<p class="slindent">The force; and these have done so, having power</p>\n<p class="slindent">Of turning back unto the holy place.</p></div>\n\n<div class="stanza"><p>If their will had been perfect, like to that</p>\n<p class="slindent">Which Lawrence fast upon his gridiron held,</p>\n<p class="slindent">And Mutius made severe to his own hand,</p></div>\n\n<div class="stanza"><p>It would have urged them back along the road</p>\n<p class="slindent">Whence they were dragged, as soon as they were free;</p>\n<p class="slindent">But such a solid will is all too rare.</p></div>\n\n<div class="stanza"><p>And by these words, if thou hast gathered them</p>\n<p class="slindent">As thou shouldst do, the argument is refuted</p>\n<p class="slindent">That would have still annoyed thee many times.</p></div>\n\n<div class="stanza"><p>But now another passage runs across</p>\n<p class="slindent">Before thine eyes, and such that by thyself</p>\n<p class="slindent">Thou couldst not thread it ere thou wouldst be weary.</p></div>\n\n<div class="stanza"><p>I have for certain put into thy mind</p>\n<p class="slindent">That soul beatified could never lie,</p>\n<p class="slindent">For it is near the primal Truth,</p></div>\n\n<div class="stanza"><p>And then thou from Piccarda might&rsquo;st have heard</p>\n<p class="slindent">Costanza kept affection for the veil,</p>\n<p class="slindent">So that she seemeth here to contradict me.</p></div>\n\n<div class="stanza"><p>Many times, brother, has it come to pass,</p>\n<p class="slindent">That, to escape from peril, with reluctance</p>\n<p class="slindent">That has been done it was not right to do,</p></div>\n\n<div class="stanza"><p>E&rsquo;en as Alcmaeon (who, being by his father</p>\n<p class="slindent">Thereto entreated, his own mother slew)</p>\n<p class="slindent">Not to lose pity pitiless became.</p></div>\n\n<div class="stanza"><p>At this point I desire thee to remember</p>\n<p class="slindent">That force with will commingles, and they cause</p>\n<p class="slindent">That the offences cannot be excused.</p></div>\n\n<div class="stanza"><p>Will absolute consenteth not to evil;</p>\n<p class="slindent">But in so far consenteth as it fears,</p>\n<p class="slindent">If it refrain, to fall into more harm.</p></div>\n\n<div class="stanza"><p>Hence when Piccarda uses this expression,</p>\n<p class="slindent">She meaneth the will absolute, and I</p>\n<p class="slindent">The other, so that both of us speak truth.&rdquo;</p></div>\n\n<div class="stanza"><p>Such was the flowing of the holy river</p>\n<p class="slindent">That issued from the fount whence springs all truth;</p>\n<p class="slindent">This put to rest my wishes one and all.</p></div>\n\n<div class="stanza"><p>&ldquo;O love of the first lover, O divine,&rdquo;</p>\n<p class="slindent">Said I forthwith, &ldquo;whose speech inundates me</p>\n<p class="slindent">And warms me so, it more and more revives me,</p></div>\n\n<div class="stanza"><p>My own affection is not so profound</p>\n<p class="slindent">As to suffice in rendering grace for grace;</p>\n<p class="slindent">Let Him, who sees and can, thereto respond.</p></div>\n\n<div class="stanza"><p>Well I perceive that never sated is</p>\n<p class="slindent">Our intellect unless the Truth illume it,</p>\n<p class="slindent">Beyond which nothing true expands itself.</p></div>\n\n<div class="stanza"><p>It rests therein, as wild beast in his lair,</p>\n<p class="slindent">When it attains it; and it can attain it;</p>\n<p class="slindent">If not, then each desire would frustrate be.</p></div>\n\n<div class="stanza"><p>Therefore springs up, in fashion of a shoot,</p>\n<p class="slindent">Doubt at the foot of truth; and this is nature,</p>\n<p class="slindent">Which to the top from height to height impels us.</p></div>\n\n<div class="stanza"><p>This doth invite me, this assurance give me</p>\n<p class="slindent">With reverence, Lady, to inquire of you</p>\n<p class="slindent">Another truth, which is obscure to me.</p></div>\n\n<div class="stanza"><p>I wish to know if man can satisfy you</p>\n<p class="slindent">For broken vows with other good deeds, so</p>\n<p class="slindent">That in your balance they will not be light.&rdquo;</p></div>\n\n<div class="stanza"><p>Beatrice gazed upon me with her eyes</p>\n<p class="slindent">Full of the sparks of love, and so divine,</p>\n<p class="slindent">That, overcome my power, I turned my back</p></div>\n\n<div class="stanza"><p>And almost lost myself with eyes downcast.</p></div>','<p class="cantohead">Paradiso: Canto V</p>\n<div class="stanza"><p>&ldquo;If in the heat of love I flame upon thee</p>\n<p class="slindent">Beyond the measure that on earth is seen,</p>\n<p class="slindent">So that the valour of thine eyes I vanquish,</p></div>\n\n<div class="stanza"><p>Marvel thou not thereat; for this proceeds</p>\n<p class="slindent">From perfect sight, which as it apprehends</p>\n<p class="slindent">To the good apprehended moves its feet.</p></div>\n\n<div class="stanza"><p>Well I perceive how is already shining</p>\n<p class="slindent">Into thine intellect the eternal light,</p>\n<p class="slindent">That only seen enkindles always love;</p></div>\n\n<div class="stanza"><p>And if some other thing your love seduce,</p>\n<p class="slindent">&rsquo;Tis nothing but a vestige of the same,</p>\n<p class="slindent">Ill understood, which there is shining through.</p></div>\n\n<div class="stanza"><p>Thou fain wouldst know if with another service</p>\n<p class="slindent">For broken vow can such return be made</p>\n<p class="slindent">As to secure the soul from further claim.&rdquo;</p></div>\n\n<div class="stanza"><p>This Canto thus did Beatrice begin;</p>\n<p class="slindent">And, as a man who breaks not off his speech,</p>\n<p class="slindent">Continued thus her holy argument:</p></div>\n\n<div class="stanza"><p>&ldquo;The greatest gift that in his largess God</p>\n<p class="slindent">Creating made, and unto his own goodness</p>\n<p class="slindent">Nearest conformed, and that which he doth prize</p></div>\n\n<div class="stanza"><p>Most highly, is the freedom of the will,</p>\n<p class="slindent">Wherewith the creatures of intelligence</p>\n<p class="slindent">Both all and only were and are endowed.</p></div>\n\n<div class="stanza"><p>Now wilt thou see, if thence thou reasonest,</p>\n<p class="slindent">The high worth of a vow, if it he made</p>\n<p class="slindent">So that when thou consentest God consents:</p></div>\n\n<div class="stanza"><p>For, closing between God and man the compact,</p>\n<p class="slindent">A sacrifice is of this treasure made,</p>\n<p class="slindent">Such as I say, and made by its own act.</p></div>\n\n<div class="stanza"><p>What can be rendered then as compensation?</p>\n<p class="slindent">Think&rsquo;st thou to make good use of what thou&rsquo;st offered,</p>\n<p class="slindent">With gains ill gotten thou wouldst do good deed.</p></div>\n\n<div class="stanza"><p>Now art thou certain of the greater point;</p>\n<p class="slindent">But because Holy Church in this dispenses,</p>\n<p class="slindent">Which seems against the truth which I have shown thee,</p></div>\n\n<div class="stanza"><p>Behoves thee still to sit awhile at table,</p>\n<p class="slindent">Because the solid food which thou hast taken</p>\n<p class="slindent">Requireth further aid for thy digestion.</p></div>\n\n<div class="stanza"><p>Open thy mind to that which I reveal,</p>\n<p class="slindent">And fix it there within; for &rsquo;tis not knowledge,</p>\n<p class="slindent">The having heard without retaining it.</p></div>\n\n<div class="stanza"><p>In the essence of this sacrifice two things</p>\n<p class="slindent">Convene together; and the one is that</p>\n<p class="slindent">Of which &rsquo;tis made, the other is the agreement.</p></div>\n\n<div class="stanza"><p>This last for evermore is cancelled not</p>\n<p class="slindent">Unless complied with, and concerning this</p>\n<p class="slindent">With such precision has above been spoken.</p></div>\n\n<div class="stanza"><p>Therefore it was enjoined upon the Hebrews</p>\n<p class="slindent">To offer still, though sometimes what was offered</p>\n<p class="slindent">Might be commuted, as thou ought&rsquo;st to know.</p></div>\n\n<div class="stanza"><p>The other, which is known to thee as matter,</p>\n<p class="slindent">May well indeed be such that one errs not</p>\n<p class="slindent">If it for other matter be exchanged.</p></div>\n\n<div class="stanza"><p>But let none shift the burden on his shoulder</p>\n<p class="slindent">At his arbitrament, without the turning</p>\n<p class="slindent">Both of the white and of the yellow key;</p></div>\n\n<div class="stanza"><p>And every permutation deem as foolish,</p>\n<p class="slindent">If in the substitute the thing relinquished,</p>\n<p class="slindent">As the four is in six, be not contained.</p></div>\n\n<div class="stanza"><p>Therefore whatever thing has so great weight</p>\n<p class="slindent">In value that it drags down every balance,</p>\n<p class="slindent">Cannot be satisfied with other spending.</p></div>\n\n<div class="stanza"><p>Let mortals never take a vow in jest;</p>\n<p class="slindent">Be faithful and not blind in doing that,</p>\n<p class="slindent">As Jephthah was in his first offering,</p></div>\n\n<div class="stanza"><p>Whom more beseemed to say, &lsquo;I have done wrong,</p>\n<p class="slindent">Than to do worse by keeping; and as foolish</p>\n<p class="slindent">Thou the great leader of the Greeks wilt find,</p></div>\n\n<div class="stanza"><p>Whence wept Iphigenia her fair face,</p>\n<p class="slindent">And made for her both wise and simple weep,</p>\n<p class="slindent">Who heard such kind of worship spoken of.&rsquo;</p></div>\n\n<div class="stanza"><p>Christians, be ye more serious in your movements;</p>\n<p class="slindent">Be ye not like a feather at each wind,</p>\n<p class="slindent">And think not every water washes you.</p></div>\n\n<div class="stanza"><p>Ye have the Old and the New Testament,</p>\n<p class="slindent">And the Pastor of the Church who guideth you</p>\n<p class="slindent">Let this suffice you unto your salvation.</p></div>\n\n<div class="stanza"><p>If evil appetite cry aught else to you,</p>\n<p class="slindent">Be ye as men, and not as silly sheep,</p>\n<p class="slindent">So that the Jew among you may not mock you.</p></div>\n\n<div class="stanza"><p>Be ye not as the lamb that doth abandon</p>\n<p class="slindent">Its mother&rsquo;s milk, and frolicsome and simple</p>\n<p class="slindent">Combats at its own pleasure with itself.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus Beatrice to me even as I write it;</p>\n<p class="slindent">Then all desireful turned herself again</p>\n<p class="slindent">To that part where the world is most alive.</p></div>\n\n<div class="stanza"><p>Her silence and her change of countenance</p>\n<p class="slindent">Silence imposed upon my eager mind,</p>\n<p class="slindent">That had already in advance new questions;</p></div>\n\n<div class="stanza"><p>And as an arrow that upon the mark</p>\n<p class="slindent">Strikes ere the bowstring quiet hath become,</p>\n<p class="slindent">So did we speed into the second realm.</p></div>\n\n<div class="stanza"><p>My Lady there so joyful I beheld,</p>\n<p class="slindent">As into the brightness of that heaven she entered,</p>\n<p class="slindent">More luminous thereat the planet grew;</p></div>\n\n<div class="stanza"><p>And if the star itself was changed and smiled,</p>\n<p class="slindent">What became I, who by my nature am</p>\n<p class="slindent">Exceeding mutable in every guise!</p></div>\n\n<div class="stanza"><p>As, in a fish-pond which is pure and tranquil,</p>\n<p class="slindent">The fishes draw to that which from without</p>\n<p class="slindent">Comes in such fashion that their food they deem it;</p></div>\n\n<div class="stanza"><p>So I beheld more than a thousand splendours</p>\n<p class="slindent">Drawing towards us, and in each was heard:</p>\n<p class="slindent">&ldquo;Lo, this is she who shall increase our love.&rdquo;</p></div>\n\n<div class="stanza"><p>And as each one was coming unto us,</p>\n<p class="slindent">Full of beatitude the shade was seen,</p>\n<p class="slindent">By the effulgence clear that issued from it.</p></div>\n\n<div class="stanza"><p>Think, Reader, if what here is just beginning</p>\n<p class="slindent">No farther should proceed, how thou wouldst have</p>\n<p class="slindent">An agonizing need of knowing more;</p></div>\n\n<div class="stanza"><p>And of thyself thou&rsquo;lt see how I from these</p>\n<p class="slindent">Was in desire of hearing their conditions,</p>\n<p class="slindent">As they unto mine eyes were manifest.</p></div>\n\n<div class="stanza"><p>&ldquo;O thou well-born, unto whom Grace concedes</p>\n<p class="slindent">To see the thrones of the eternal triumph,</p>\n<p class="slindent">Or ever yet the warfare be abandoned</p></div>\n\n<div class="stanza"><p>With light that through the whole of heaven is spread</p>\n<p class="slindent">Kindled are we, and hence if thou desirest</p>\n<p class="slindent">To know of us, at thine own pleasure sate thee.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus by some one among those holy spirits</p>\n<p class="slindent">Was spoken, and by Beatrice: &ldquo;Speak, speak</p>\n<p class="slindent">Securely, and believe them even as Gods.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Well I perceive how thou dost nest thyself</p>\n<p class="slindent">In thine own light, and drawest it from thine eyes,</p>\n<p class="slindent">Because they coruscate when thou dost smile,</p></div>\n\n<div class="stanza"><p>But know not who thou art, nor why thou hast,</p>\n<p class="slindent">Spirit august, thy station in the sphere</p>\n<p class="slindent">That veils itself to men in alien rays.&rdquo;</p></div>\n\n<div class="stanza"><p>This said I in direction of the light</p>\n<p class="slindent">Which first had spoken to me; whence it became</p>\n<p class="slindent">By far more lucent than it was before.</p></div>\n\n<div class="stanza"><p>Even as the sun, that doth conceal himself</p>\n<p class="slindent">By too much light, when heat has worn away</p>\n<p class="slindent">The tempering influence of the vapours dense,</p></div>\n\n<div class="stanza"><p>By greater rapture thus concealed itself</p>\n<p class="slindent">In its own radiance the figure saintly,</p>\n<p class="slindent">And thus close, close enfolded answered me</p></div>\n\n<div class="stanza"><p>In fashion as the following Canto sings.</p></div>','<p class="cantohead">Paradiso: Canto VI</p>\n<div class="stanza"><p>&ldquo;After that Constantine the eagle turned</p>\n<p class="slindent">Against the course of heaven, which it had followed</p>\n<p class="slindent">Behind the ancient who Lavinia took,</p></div>\n\n<div class="stanza"><p>Two hundred years and more the bird of God</p>\n<p class="slindent">In the extreme of Europe held itself,</p>\n<p class="slindent">Near to the mountains whence it issued first;</p></div>\n\n<div class="stanza"><p>And under shadow of the sacred plumes</p>\n<p class="slindent">It governed there the world from hand to hand,</p>\n<p class="slindent">And, changing thus, upon mine own alighted.</p></div>\n\n<div class="stanza"><p>Caesar I was, and am Justinian,</p>\n<p class="slindent">Who, by the will of primal Love I feel,</p>\n<p class="slindent">Took from the laws the useless and redundant;</p></div>\n\n<div class="stanza"><p>And ere unto the work I was attent,</p>\n<p class="slindent">One nature to exist in Christ, not more,</p>\n<p class="slindent">Believed, and with such faith was I contented.</p></div>\n\n<div class="stanza"><p>But blessed Agapetus, he who was</p>\n<p class="slindent">The supreme pastor, to the faith sincere</p>\n<p class="slindent">Pointed me out the way by words of his.</p></div>\n\n<div class="stanza"><p>Him I believed, and what was his assertion</p>\n<p class="slindent">I now see clearly, even as thou seest</p>\n<p class="slindent">Each contradiction to be false and true.</p></div>\n\n<div class="stanza"><p>As soon as with the Church I moved my feet,</p>\n<p class="slindent">God in his grace it pleased with this high task</p>\n<p class="slindent">To inspire me, and I gave me wholly to it,</p></div>\n\n<div class="stanza"><p>And to my Belisarius I commended</p>\n<p class="slindent">The arms, to which was heaven&rsquo;s right hand so joined</p>\n<p class="slindent">It was a signal that I should repose.</p></div>\n\n<div class="stanza"><p>Now here to the first question terminates</p>\n<p class="slindent">My answer; but the character thereof</p>\n<p class="slindent">Constrains me to continue with a sequel,</p></div>\n\n<div class="stanza"><p>In order that thou see with how great reason</p>\n<p class="slindent">Men move against the standard sacrosanct,</p>\n<p class="slindent">Both who appropriate and who oppose it.</p></div>\n\n<div class="stanza"><p>Behold how great a power has made it worthy</p>\n<p class="slindent">Of reverence, beginning from the hour</p>\n<p class="slindent">When Pallas died to give it sovereignty.</p></div>\n\n<div class="stanza"><p>Thou knowest it made in Alba its abode</p>\n<p class="slindent">Three hundred years and upward, till at last</p>\n<p class="slindent">The three to three fought for it yet again.</p></div>\n\n<div class="stanza"><p>Thou knowest what it achieved from Sabine wrong</p>\n<p class="slindent">Down to Lucretia&rsquo;s sorrow, in seven kings</p>\n<p class="slindent">O&rsquo;ercoming round about the neighboring nations;</p></div>\n\n<div class="stanza"><p>Thou knowest what it achieved, borne by the Romans</p>\n<p class="slindent">Illustrious against Brennus, against Pyrrhus,</p>\n<p class="slindent">Against the other princes and confederates.</p></div>\n\n<div class="stanza"><p>Torquatus thence and Quinctius, who from locks</p>\n<p class="slindent">Unkempt was named, Decii and Fabii,</p>\n<p class="slindent">Received the fame I willingly embalm;</p></div>\n\n<div class="stanza"><p>It struck to earth the pride of the Arabians,</p>\n<p class="slindent">Who, following Hannibal, had passed across</p>\n<p class="slindent">The Alpine ridges, Po, from which thou glidest;</p></div>\n\n<div class="stanza"><p>Beneath it triumphed while they yet were young</p>\n<p class="slindent">Pompey and Scipio, and to the hill</p>\n<p class="slindent">Beneath which thou wast born it bitter seemed;</p></div>\n\n<div class="stanza"><p>Then, near unto the time when heaven had willed</p>\n<p class="slindent">To bring the whole world to its mood serene,</p>\n<p class="slindent">Did Caesar by the will of Rome assume it.</p></div>\n\n<div class="stanza"><p>What it achieved from Var unto the Rhine,</p>\n<p class="slindent">Isere beheld and Saone, beheld the Seine,</p>\n<p class="slindent">And every valley whence the Rhone is filled;</p></div>\n\n<div class="stanza"><p>What it achieved when it had left Ravenna,</p>\n<p class="slindent">And leaped the Rubicon, was such a flight</p>\n<p class="slindent">That neither tongue nor pen could follow it.</p></div>\n\n<div class="stanza"><p>Round towards Spain it wheeled its legions; then</p>\n<p class="slindent">Towards Durazzo, and Pharsalia smote</p>\n<p class="slindent">That to the calid Nile was felt the pain.</p></div>\n\n<div class="stanza"><p>Antandros and the Simois, whence it started,</p>\n<p class="slindent">It saw again, and there where Hector lies,</p>\n<p class="slindent">And ill for Ptolemy then roused itself.</p></div>\n\n<div class="stanza"><p>From thence it came like lightning upon Juba;</p>\n<p class="slindent">Then wheeled itself again into your West,</p>\n<p class="slindent">Where the Pompeian clarion it heard.</p></div>\n\n<div class="stanza"><p>From what it wrought with the next standard-bearer</p>\n<p class="slindent">Brutus and Cassius howl in Hell together,</p>\n<p class="slindent">And Modena and Perugia dolent were;</p></div>\n\n<div class="stanza"><p>Still doth the mournful Cleopatra weep</p>\n<p class="slindent">Because thereof, who, fleeing from before it,</p>\n<p class="slindent">Took from the adder sudden and black death.</p></div>\n\n<div class="stanza"><p>With him it ran even to the Red Sea shore;</p>\n<p class="slindent">With him it placed the world in so great peace,</p>\n<p class="slindent">That unto Janus was his temple closed.</p></div>\n\n<div class="stanza"><p>But what the standard that has made me speak</p>\n<p class="slindent">Achieved before, and after should achieve</p>\n<p class="slindent">Throughout the mortal realm that lies beneath it,</p></div>\n\n<div class="stanza"><p>Becometh in appearance mean and dim,</p>\n<p class="slindent">If in the hand of the third Caesar seen</p>\n<p class="slindent">With eye unclouded and affection pure,</p></div>\n\n<div class="stanza"><p>Because the living Justice that inspires me</p>\n<p class="slindent">Granted it, in the hand of him I speak of,</p>\n<p class="slindent">The glory of doing vengeance for its wrath.</p></div>\n\n<div class="stanza"><p>Now here attend to what I answer thee;</p>\n<p class="slindent">Later it ran with Titus to do vengeance</p>\n<p class="slindent">Upon the vengeance of the ancient sin.</p></div>\n\n<div class="stanza"><p>And when the tooth of Lombardy had bitten</p>\n<p class="slindent">The Holy Church, then underneath its wings</p>\n<p class="slindent">Did Charlemagne victorious succor her.</p></div>\n\n<div class="stanza"><p>Now hast thou power to judge of such as those</p>\n<p class="slindent">Whom I accused above, and of their crimes,</p>\n<p class="slindent">Which are the cause of all your miseries.</p></div>\n\n<div class="stanza"><p>To the public standard one the yellow lilies</p>\n<p class="slindent">Opposes, the other claims it for a party,</p>\n<p class="slindent">So that &rsquo;tis hard to see which sins the most.</p></div>\n\n<div class="stanza"><p>Let, let the Ghibellines ply their handicraft</p>\n<p class="slindent">Beneath some other standard; for this ever</p>\n<p class="slindent">Ill follows he who it and justice parts.</p></div>\n\n<div class="stanza"><p>And let not this new Charles e&rsquo;er strike it down,</p>\n<p class="slindent">He and his Guelfs, but let him fear the talons</p>\n<p class="slindent">That from a nobler lion stripped the fell.</p></div>\n\n<div class="stanza"><p>Already oftentimes the sons have wept</p>\n<p class="slindent">The father&rsquo;s crime; and let him not believe</p>\n<p class="slindent">That God will change His scutcheon for the lilies.</p></div>\n\n<div class="stanza"><p>This little planet doth adorn itself</p>\n<p class="slindent">With the good spirits that have active been,</p>\n<p class="slindent">That fame and honour might come after them;</p></div>\n\n<div class="stanza"><p>And whensoever the desires mount thither,</p>\n<p class="slindent">Thus deviating, must perforce the rays</p>\n<p class="slindent">Of the true love less vividly mount upward.</p></div>\n\n<div class="stanza"><p>But in commensuration of our wages</p>\n<p class="slindent">With our desert is portion of our joy,</p>\n<p class="slindent">Because we see them neither less nor greater.</p></div>\n\n<div class="stanza"><p>Herein doth living Justice sweeten so</p>\n<p class="slindent">Affection in us, that for evermore</p>\n<p class="slindent">It cannot warp to any iniquity.</p></div>\n\n<div class="stanza"><p>Voices diverse make up sweet melodies;</p>\n<p class="slindent">So in this life of ours the seats diverse</p>\n<p class="slindent">Render sweet harmony among these spheres;</p></div>\n\n<div class="stanza"><p>And in the compass of this present pearl</p>\n<p class="slindent">Shineth the sheen of Romeo, of whom</p>\n<p class="slindent">The grand and beauteous work was ill rewarded.</p></div>\n\n<div class="stanza"><p>But the Provencals who against him wrought,</p>\n<p class="slindent">They have not laughed, and therefore ill goes he</p>\n<p class="slindent">Who makes his hurt of the good deeds of others.</p></div>\n\n<div class="stanza"><p>Four daughters, and each one of them a queen,</p>\n<p class="slindent">Had Raymond Berenger, and this for him</p>\n<p class="slindent">Did Romeo, a poor man and a pilgrim;</p></div>\n\n<div class="stanza"><p>And then malicious words incited him</p>\n<p class="slindent">To summon to a reckoning this just man,</p>\n<p class="slindent">Who rendered to him seven and five for ten.</p></div>\n\n<div class="stanza"><p>Then he departed poor and stricken in years,</p>\n<p class="slindent">And if the world could know the heart he had,</p>\n<p class="slindent">In begging bit by bit his livelihood,</p></div>\n\n<div class="stanza"><p>Though much it laud him, it would laud him more.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto VII</p>\n<div class="stanza"><p>&ldquo;Osanna sanctus Deus Sabaoth,</p>\n<p class="slindent">Superillustrans claritate tua</p>\n<p class="slindent">Felices ignes horum malahoth!&rdquo;</p></div>\n\n<div class="stanza"><p>In this wise, to his melody returning,</p>\n<p class="slindent">This substance, upon which a double light</p>\n<p class="slindent">Doubles itself, was seen by me to sing,</p></div>\n\n<div class="stanza"><p>And to their dance this and the others moved,</p>\n<p class="slindent">And in the manner of swift-hurrying sparks</p>\n<p class="slindent">Veiled themselves from me with a sudden distance.</p></div>\n\n<div class="stanza"><p>Doubting was I, and saying, &ldquo;Tell her, tell her,&rdquo;</p>\n<p class="slindent">Within me, &ldquo;tell her,&rdquo; saying, &ldquo;tell my Lady,&rdquo;</p>\n<p class="slindent">Who slakes my thirst with her sweet effluences;</p></div>\n\n<div class="stanza"><p>And yet that reverence which doth lord it over</p>\n<p class="slindent">The whole of me only by B and ICE,</p>\n<p class="slindent">Bowed me again like unto one who drowses.</p></div>\n\n<div class="stanza"><p>Short while did Beatrice endure me thus;</p>\n<p class="slindent">And she began, lighting me with a smile</p>\n<p class="slindent">Such as would make one happy in the fire:</p></div>\n\n<div class="stanza"><p>&ldquo;According to infallible advisement,</p>\n<p class="slindent">After what manner a just vengeance justly</p>\n<p class="slindent">Could be avenged has put thee upon thinking,</p></div>\n\n<div class="stanza"><p>But I will speedily thy mind unloose;</p>\n<p class="slindent">And do thou listen, for these words of mine</p>\n<p class="slindent">Of a great doctrine will a present make thee.</p></div>\n\n<div class="stanza"><p>By not enduring on the power that wills</p>\n<p class="slindent">Curb for his good, that man who ne&rsquo;er was born,</p>\n<p class="slindent">Damning himself damned all his progeny;</p></div>\n\n<div class="stanza"><p>Whereby the human species down below</p>\n<p class="slindent">Lay sick for many centuries in great error,</p>\n<p class="slindent">Till to descend it pleased the Word of God</p></div>\n\n<div class="stanza"><p>To where the nature, which from its own Maker</p>\n<p class="slindent">Estranged itself, he joined to him in person</p>\n<p class="slindent">By the sole act of his eternal love.</p></div>\n\n<div class="stanza"><p>Now unto what is said direct thy sight;</p>\n<p class="slindent">This nature when united to its Maker,</p>\n<p class="slindent">Such as created, was sincere and good;</p></div>\n\n<div class="stanza"><p>But by itself alone was banished forth</p>\n<p class="slindent">From Paradise, because it turned aside</p>\n<p class="slindent">Out of the way of truth and of its life.</p></div>\n\n<div class="stanza"><p>Therefore the penalty the cross held out,</p>\n<p class="slindent">If measured by the nature thus assumed,</p>\n<p class="slindent">None ever yet with so great justice stung,</p></div>\n\n<div class="stanza"><p>And none was ever of so great injustice,</p>\n<p class="slindent">Considering who the Person was that suffered,</p>\n<p class="slindent">Within whom such a nature was contracted.</p></div>\n\n<div class="stanza"><p>From one act therefore issued things diverse;</p>\n<p class="slindent">To God and to the Jews one death was pleasing;</p>\n<p class="slindent">Earth trembled at it and the Heaven was opened.</p></div>\n\n<div class="stanza"><p>It should no longer now seem difficult</p>\n<p class="slindent">To thee, when it is said that a just vengeance</p>\n<p class="slindent">By a just court was afterward avenged.</p></div>\n\n<div class="stanza"><p>But now do I behold thy mind entangled</p>\n<p class="slindent">From thought to thought within a knot, from which</p>\n<p class="slindent">With great desire it waits to free itself.</p></div>\n\n<div class="stanza"><p>Thou sayest, &lsquo;Well discern I what I hear;</p>\n<p class="slindent">But it is hidden from me why God willed</p>\n<p class="slindent">For our redemption only this one mode.&rsquo;</p></div>\n\n<div class="stanza"><p>Buried remaineth, brother, this decree</p>\n<p class="slindent">Unto the eyes of every one whose nature</p>\n<p class="slindent">Is in the flame of love not yet adult.</p></div>\n\n<div class="stanza"><p>Verily, inasmuch as at this mark</p>\n<p class="slindent">One gazes long and little is discerned,</p>\n<p class="slindent">Wherefore this mode was worthiest will I say.</p></div>\n\n<div class="stanza"><p>Goodness Divine, which from itself doth spurn</p>\n<p class="slindent">All envy, burning in itself so sparkles</p>\n<p class="slindent">That the eternal beauties it unfolds.</p></div>\n\n<div class="stanza"><p>Whate&rsquo;er from this immediately distils</p>\n<p class="slindent">Has afterwards no end, for ne&rsquo;er removed</p>\n<p class="slindent">Is its impression when it sets its seal.</p></div>\n\n<div class="stanza"><p>Whate&rsquo;er from this immediately rains down</p>\n<p class="slindent">Is wholly free, because it is not subject</p>\n<p class="slindent">Unto the influences of novel things.</p></div>\n\n<div class="stanza"><p>The more conformed thereto, the more it pleases;</p>\n<p class="slindent">For the blest ardour that irradiates all things</p>\n<p class="slindent">In that most like itself is most vivacious.</p></div>\n\n<div class="stanza"><p>With all of these things has advantaged been</p>\n<p class="slindent">The human creature; and if one be wanting,</p>\n<p class="slindent">From his nobility he needs must fall.</p></div>\n\n<div class="stanza"><p>&rsquo;Tis sin alone which doth disfranchise him,</p>\n<p class="slindent">And render him unlike the Good Supreme,</p>\n<p class="slindent">So that he little with its light is blanched,</p></div>\n\n<div class="stanza"><p>And to his dignity no more returns,</p>\n<p class="slindent">Unless he fill up where transgression empties</p>\n<p class="slindent">With righteous pains for criminal delights.</p></div>\n\n<div class="stanza"><p>Your nature when it sinned so utterly</p>\n<p class="slindent">In its own seed, out of these dignities</p>\n<p class="slindent">Even as out of Paradise was driven,</p></div>\n\n<div class="stanza"><p>Nor could itself recover, if thou notest</p>\n<p class="slindent">With nicest subtilty, by any way,</p>\n<p class="slindent">Except by passing one of these two fords:</p></div>\n\n<div class="stanza"><p>Either that God through clemency alone</p>\n<p class="slindent">Had pardon granted, or that man himself</p>\n<p class="slindent">Had satisfaction for his folly made.</p></div>\n\n<div class="stanza"><p>Fix now thine eye deep into the abyss</p>\n<p class="slindent">Of the eternal counsel, to my speech</p>\n<p class="slindent">As far as may be fastened steadfastly!</p></div>\n\n<div class="stanza"><p>Man in his limitations had not power</p>\n<p class="slindent">To satisfy, not having power to sink</p>\n<p class="slindent">In his humility obeying then,</p></div>\n\n<div class="stanza"><p>Far as he disobeying thought to rise;</p>\n<p class="slindent">And for this reason man has been from power</p>\n<p class="slindent">Of satisfying by himself excluded.</p></div>\n\n<div class="stanza"><p>Therefore it God behoved in his own ways</p>\n<p class="slindent">Man to restore unto his perfect life,</p>\n<p class="slindent">I say in one, or else in both of them.</p></div>\n\n<div class="stanza"><p>But since the action of the doer is</p>\n<p class="slindent">So much more grateful, as it more presents</p>\n<p class="slindent">The goodness of the heart from which it issues,</p></div>\n\n<div class="stanza"><p>Goodness Divine, that doth imprint the world,</p>\n<p class="slindent">Has been contented to proceed by each</p>\n<p class="slindent">And all its ways to lift you up again;</p></div>\n\n<div class="stanza"><p>Nor &rsquo;twixt the first day and the final night</p>\n<p class="slindent">Such high and such magnificent proceeding</p>\n<p class="slindent">By one or by the other was or shall be;</p></div>\n\n<div class="stanza"><p>For God more bounteous was himself to give</p>\n<p class="slindent">To make man able to uplift himself,</p>\n<p class="slindent">Than if he only of himself had pardoned;</p></div>\n\n<div class="stanza"><p>And all the other modes were insufficient</p>\n<p class="slindent">For justice, were it not the Son of God</p>\n<p class="slindent">Himself had humbled to become incarnate.</p></div>\n\n<div class="stanza"><p>Now, to fill fully each desire of thine,</p>\n<p class="slindent">Return I to elucidate one place,</p>\n<p class="slindent">In order that thou there mayst see as I do.</p></div>\n\n<div class="stanza"><p>Thou sayst: &lsquo;I see the air, I see the fire,</p>\n<p class="slindent">The water, and the earth, and all their mixtures</p>\n<p class="slindent">Come to corruption, and short while endure;</p></div>\n\n<div class="stanza"><p>And these things notwithstanding were created;&rsquo;</p>\n<p class="slindent">Therefore if that which I have said were true,</p>\n<p class="slindent">They should have been secure against corruption.</p></div>\n\n<div class="stanza"><p>The Angels, brother, and the land sincere</p>\n<p class="slindent">In which thou art, created may be called</p>\n<p class="slindent">Just as they are in their entire existence;</p></div>\n\n<div class="stanza"><p>But all the elements which thou hast named,</p>\n<p class="slindent">And all those things which out of them are made,</p>\n<p class="slindent">By a created virtue are informed.</p></div>\n\n<div class="stanza"><p>Created was the matter which they have;</p>\n<p class="slindent">Created was the informing influence</p>\n<p class="slindent">Within these stars that round about them go.</p></div>\n\n<div class="stanza"><p>The soul of every brute and of the plants</p>\n<p class="slindent">By its potential temperament attracts</p>\n<p class="slindent">The ray and motion of the holy lights;</p></div>\n\n<div class="stanza"><p>But your own life immediately inspires</p>\n<p class="slindent">Supreme Beneficence, and enamours it</p>\n<p class="slindent">So with herself, it evermore desires her.</p></div>\n\n<div class="stanza"><p>And thou from this mayst argue furthermore</p>\n<p class="slindent">Your resurrection, if thou think again</p>\n<p class="slindent">How human flesh was fashioned at that time</p></div>\n\n<div class="stanza"><p>When the first parents both of them were made.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto VIII</p>\n<div class="stanza"><p>The world used in its peril to believe</p>\n<p class="slindent">That the fair Cypria delirious love</p>\n<p class="slindent">Rayed out, in the third epicycle turning;</p></div>\n\n<div class="stanza"><p>Wherefore not only unto her paid honour</p>\n<p class="slindent">Of sacrifices and of votive cry</p>\n<p class="slindent">The ancient nations in the ancient error,</p></div>\n\n<div class="stanza"><p>But both Dione honoured they and Cupid,</p>\n<p class="slindent">That as her mother, this one as her son,</p>\n<p class="slindent">And said that he had sat in Dido&rsquo;s lap;</p></div>\n\n<div class="stanza"><p>And they from her, whence I beginning take,</p>\n<p class="slindent">Took the denomination of the star</p>\n<p class="slindent">That woos the sun, now following, now in front.</p></div>\n\n<div class="stanza"><p>I was not ware of our ascending to it;</p>\n<p class="slindent">But of our being in it gave full faith</p>\n<p class="slindent">My Lady whom I saw more beauteous grow.</p></div>\n\n<div class="stanza"><p>And as within a flame a spark is seen,</p>\n<p class="slindent">And as within a voice a voice discerned,</p>\n<p class="slindent">When one is steadfast, and one comes and goes,</p></div>\n\n<div class="stanza"><p>Within that light beheld I other lamps</p>\n<p class="slindent">Move in a circle, speeding more and less,</p>\n<p class="slindent">Methinks in measure of their inward vision.</p></div>\n\n<div class="stanza"><p>From a cold cloud descended never winds,</p>\n<p class="slindent">Or visible or not, so rapidly</p>\n<p class="slindent">They would not laggard and impeded seem</p></div>\n\n<div class="stanza"><p>To any one who had those lights divine</p>\n<p class="slindent">Seen come towards us, leaving the gyration</p>\n<p class="slindent">Begun at first in the high Seraphim.</p></div>\n\n<div class="stanza"><p>And behind those that most in front appeared</p>\n<p class="slindent">Sounded &ldquo;Osanna!&rdquo; so that never since</p>\n<p class="slindent">To hear again was I without desire.</p></div>\n\n<div class="stanza"><p>Then unto us more nearly one approached,</p>\n<p class="slindent">And it alone began: &ldquo;We all are ready</p>\n<p class="slindent">Unto thy pleasure, that thou joy in us.</p></div>\n\n<div class="stanza"><p>We turn around with the celestial Princes,</p>\n<p class="slindent">One gyre and one gyration and one thirst,</p>\n<p class="slindent">To whom thou in the world of old didst say,</p></div>\n\n<div class="stanza"><p>&lsquo;Ye who, intelligent, the third heaven are moving;&rsquo;</p>\n<p class="slindent">And are so full of love, to pleasure thee</p>\n<p class="slindent">A little quiet will not be less sweet.&rdquo;</p></div>\n\n<div class="stanza"><p>After these eyes of mine themselves had offered</p>\n<p class="slindent">Unto my Lady reverently, and she</p>\n<p class="slindent">Content and certain of herself had made them,</p></div>\n\n<div class="stanza"><p>Back to the light they turned, which so great promise</p>\n<p class="slindent">Made of itself, and &ldquo;Say, who art thou?&rdquo; was</p>\n<p class="slindent">My voice, imprinted with a great affection.</p></div>\n\n<div class="stanza"><p>O how and how much I beheld it grow</p>\n<p class="slindent">With the new joy that superadded was</p>\n<p class="slindent">Unto its joys, as soon as I had spoken!</p></div>\n\n<div class="stanza"><p>Thus changed, it said to me: &ldquo;The world possessed me</p>\n<p class="slindent">Short time below; and, if it had been more,</p>\n<p class="slindent">Much evil will be which would not have been.</p></div>\n\n<div class="stanza"><p>My gladness keepeth me concealed from thee,</p>\n<p class="slindent">Which rayeth round about me, and doth hide me</p>\n<p class="slindent">Like as a creature swathed in its own silk.</p></div>\n\n<div class="stanza"><p>Much didst thou love me, and thou hadst good reason;</p>\n<p class="slindent">For had I been below, I should have shown thee</p>\n<p class="slindent">Somewhat beyond the foliage of my love.</p></div>\n\n<div class="stanza"><p>That left-hand margin, which doth bathe itself</p>\n<p class="slindent">In Rhone, when it is mingled with the Sorgue,</p>\n<p class="slindent">Me for its lord awaited in due time,</p></div>\n\n<div class="stanza"><p>And that horn of Ausonia, which is towned</p>\n<p class="slindent">With Bari, with Gaeta and Catona,</p>\n<p class="slindent">Whence Tronto and Verde in the sea disgorge.</p></div>\n\n<div class="stanza"><p>Already flashed upon my brow the crown</p>\n<p class="slindent">Of that dominion which the Danube waters</p>\n<p class="slindent">After the German borders it abandons;</p></div>\n\n<div class="stanza"><p>And beautiful Trinacria, that is murky</p>\n<p class="slindent">&rsquo;Twixt Pachino and Peloro, (on the gulf</p>\n<p class="slindent">Which greatest scath from Eurus doth receive,)</p></div>\n\n<div class="stanza"><p>Not through Typhoeus, but through nascent sulphur,</p>\n<p class="slindent">Would have awaited her own monarchs still,</p>\n<p class="slindent">Through me from Charles descended and from Rudolph,</p></div>\n\n<div class="stanza"><p>If evil lordship, that exasperates ever</p>\n<p class="slindent">The subject populations, had not moved</p>\n<p class="slindent">Palermo to the outcry of &lsquo;Death! death!&rsquo;</p></div>\n\n<div class="stanza"><p>And if my brother could but this foresee,</p>\n<p class="slindent">The greedy poverty of Catalonia</p>\n<p class="slindent">Straight would he flee, that it might not molest him;</p></div>\n\n<div class="stanza"><p>For verily &rsquo;tis needful to provide,</p>\n<p class="slindent">Through him or other, so that on his bark</p>\n<p class="slindent">Already freighted no more freight be placed.</p></div>\n\n<div class="stanza"><p>His nature, which from liberal covetous</p>\n<p class="slindent">Descended, such a soldiery would need</p>\n<p class="slindent">As should not care for hoarding in a chest.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Because I do believe the lofty joy</p>\n<p class="slindent">Thy speech infuses into me, my Lord,</p>\n<p class="slindent">Where every good thing doth begin and end</p></div>\n\n<div class="stanza"><p>Thou seest as I see it, the more grateful</p>\n<p class="slindent">Is it to me; and this too hold I dear,</p>\n<p class="slindent">That gazing upon God thou dost discern it.</p></div>\n\n<div class="stanza"><p>Glad hast thou made me; so make clear to me,</p>\n<p class="slindent">Since speaking thou hast stirred me up to doubt,</p>\n<p class="slindent">How from sweet seed can bitter issue forth.&rdquo;</p></div>\n\n<div class="stanza"><p>This I to him; and he to me: &ldquo;If I</p>\n<p class="slindent">Can show to thee a truth, to what thou askest</p>\n<p class="slindent">Thy face thou&rsquo;lt hold as thou dost hold thy back.</p></div>\n\n<div class="stanza"><p>The Good which all the realm thou art ascending</p>\n<p class="slindent">Turns and contents, maketh its providence</p>\n<p class="slindent">To be a power within these bodies vast;</p></div>\n\n<div class="stanza"><p>And not alone the natures are foreseen</p>\n<p class="slindent">Within the mind that in itself is perfect,</p>\n<p class="slindent">But they together with their preservation.</p></div>\n\n<div class="stanza"><p>For whatsoever thing this bow shoots forth</p>\n<p class="slindent">Falls foreordained unto an end foreseen,</p>\n<p class="slindent">Even as a shaft directed to its mark.</p></div>\n\n<div class="stanza"><p>If that were not, the heaven which thou dost walk</p>\n<p class="slindent">Would in such manner its effects produce,</p>\n<p class="slindent">That they no longer would be arts, but ruins.</p></div>\n\n<div class="stanza"><p>This cannot be, if the Intelligences</p>\n<p class="slindent">That keep these stars in motion are not maimed,</p>\n<p class="slindent">And maimed the First that has not made them perfect.</p></div>\n\n<div class="stanza"><p>Wilt thou this truth have clearer made to thee?&rdquo;</p>\n<p class="slindent">And I: &ldquo;Not so; for &rsquo;tis impossible</p>\n<p class="slindent">That nature tire, I see, in what is needful.&rdquo;</p></div>\n\n<div class="stanza"><p>Whence he again: &ldquo;Now say, would it be worse</p>\n<p class="slindent">For men on earth were they not citizens?&rdquo;</p>\n<p class="slindent">&ldquo;Yes,&rdquo; I replied; &ldquo;and here I ask no reason.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;And can they be so, if below they live not</p>\n<p class="slindent">Diversely unto offices diverse?</p>\n<p class="slindent">No, if your master writeth well for you.&rdquo;</p></div>\n\n<div class="stanza"><p>So came he with deductions to this point;</p>\n<p class="slindent">Then he concluded: &ldquo;Therefore it behoves</p>\n<p class="slindent">The roots of your effects to be diverse.</p></div>\n\n<div class="stanza"><p>Hence one is Solon born, another Xerxes,</p>\n<p class="slindent">Another Melchisedec, and another he</p>\n<p class="slindent">Who, flying through the air, his son did lose.</p></div>\n\n<div class="stanza"><p>Revolving Nature, which a signet is</p>\n<p class="slindent">To mortal wax, doth practise well her art,</p>\n<p class="slindent">But not one inn distinguish from another;</p></div>\n\n<div class="stanza"><p>Thence happens it that Esau differeth</p>\n<p class="slindent">In seed from Jacob; and Quirinus comes</p>\n<p class="slindent">From sire so vile that he is given to Mars.</p></div>\n\n<div class="stanza"><p>A generated nature its own way</p>\n<p class="slindent">Would always make like its progenitors,</p>\n<p class="slindent">If Providence divine were not triumphant.</p></div>\n\n<div class="stanza"><p>Now that which was behind thee is before thee;</p>\n<p class="slindent">But that thou know that I with thee am pleased,</p>\n<p class="slindent">With a corollary will I mantle thee.</p></div>\n\n<div class="stanza"><p>Evermore nature, if it fortune find</p>\n<p class="slindent">Discordant to it, like each other seed</p>\n<p class="slindent">Out of its region, maketh evil thrift;</p></div>\n\n<div class="stanza"><p>And if the world below would fix its mind</p>\n<p class="slindent">On the foundation which is laid by nature,</p>\n<p class="slindent">Pursuing that, &rsquo;twould have the people good.</p></div>\n\n<div class="stanza"><p>But you unto religion wrench aside</p>\n<p class="slindent">Him who was born to gird him with the sword,</p>\n<p class="slindent">And make a king of him who is for sermons;</p></div>\n\n<div class="stanza"><p>Therefore your footsteps wander from the road.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto IX</p>\n<div class="stanza"><p>Beautiful Clemence, after that thy Charles</p>\n<p class="slindent">Had me enlightened, he narrated to me</p>\n<p class="slindent">The treacheries his seed should undergo;</p></div>\n\n<div class="stanza"><p>But said: &ldquo;Be still and let the years roll round;&rdquo;</p>\n<p class="slindent">So I can only say, that lamentation</p>\n<p class="slindent">Legitimate shall follow on your wrongs.</p></div>\n\n<div class="stanza"><p>And of that holy light the life already</p>\n<p class="slindent">Had to the Sun which fills it turned again,</p>\n<p class="slindent">As to that good which for each thing sufficeth.</p></div>\n\n<div class="stanza"><p>Ah, souls deceived, and creatures impious,</p>\n<p class="slindent">Who from such good do turn away your hearts,</p>\n<p class="slindent">Directing upon vanity your foreheads!</p></div>\n\n<div class="stanza"><p>And now, behold, another of those splendours</p>\n<p class="slindent">Approached me, and its will to pleasure me</p>\n<p class="slindent">It signified by brightening outwardly.</p></div>\n\n<div class="stanza"><p>The eyes of Beatrice, that fastened were</p>\n<p class="slindent">Upon me, as before, of dear assent</p>\n<p class="slindent">To my desire assurance gave to me.</p></div>\n\n<div class="stanza"><p>&ldquo;Ah, bring swift compensation to my wish,</p>\n<p class="slindent">Thou blessed spirit,&rdquo; I said, &ldquo;and give me proof</p>\n<p class="slindent">That what I think in thee I can reflect!&rdquo;</p></div>\n\n<div class="stanza"><p>Whereat the light, that still was new to me,</p>\n<p class="slindent">Out of its depths, whence it before was singing,</p>\n<p class="slindent">As one delighted to do good, continued:</p></div>\n\n<div class="stanza"><p>&ldquo;Within that region of the land depraved</p>\n<p class="slindent">Of Italy, that lies between Rialto</p>\n<p class="slindent">And fountain-heads of Brenta and of Piava,</p></div>\n\n<div class="stanza"><p>Rises a hill, and mounts not very high,</p>\n<p class="slindent">Wherefrom descended formerly a torch</p>\n<p class="slindent">That made upon that region great assault.</p></div>\n\n<div class="stanza"><p>Out of one root were born both I and it;</p>\n<p class="slindent">Cunizza was I called, and here I shine</p>\n<p class="slindent">Because the splendour of this star o&rsquo;ercame me.</p></div>\n\n<div class="stanza"><p>But gladly to myself the cause I pardon</p>\n<p class="slindent">Of my allotment, and it does not grieve me;</p>\n<p class="slindent">Which would perhaps seem strong unto your vulgar.</p></div>\n\n<div class="stanza"><p>Of this so luculent and precious jewel,</p>\n<p class="slindent">Which of our heaven is nearest unto me,</p>\n<p class="slindent">Great fame remained; and ere it die away</p></div>\n\n<div class="stanza"><p>This hundredth year shall yet quintupled be.</p>\n<p class="slindent">See if man ought to make him excellent,</p>\n<p class="slindent">So that another life the first may leave!</p></div>\n\n<div class="stanza"><p>And thus thinks not the present multitude</p>\n<p class="slindent">Shut in by Adige and Tagliamento,</p>\n<p class="slindent">Nor yet for being scourged is penitent.</p></div>\n\n<div class="stanza"><p>But soon &rsquo;twill be that Padua in the marsh</p>\n<p class="slindent">Will change the water that Vicenza bathes,</p>\n<p class="slindent">Because the folk are stubborn against duty;</p></div>\n\n<div class="stanza"><p>And where the Sile and Cagnano join</p>\n<p class="slindent">One lordeth it, and goes with lofty head,</p>\n<p class="slindent">For catching whom e&rsquo;en now the net is making.</p></div>\n\n<div class="stanza"><p>Feltro moreover of her impious pastor</p>\n<p class="slindent">Shall weep the crime, which shall so monstrous be</p>\n<p class="slindent">That for the like none ever entered Malta.</p></div>\n\n<div class="stanza"><p>Ample exceedingly would be the vat</p>\n<p class="slindent">That of the Ferrarese could hold the blood,</p>\n<p class="slindent">And weary who should weigh it ounce by ounce,</p></div>\n\n<div class="stanza"><p>Of which this courteous priest shall make a gift</p>\n<p class="slindent">To show himself a partisan; and such gifts</p>\n<p class="slindent">Will to the living of the land conform.</p></div>\n\n<div class="stanza"><p>Above us there are mirrors, Thrones you call them,</p>\n<p class="slindent">From which shines out on us God Judicant,</p>\n<p class="slindent">So that this utterance seems good to us.&rdquo;</p></div>\n\n<div class="stanza"><p>Here it was silent, and it had the semblance</p>\n<p class="slindent">Of being turned elsewhither, by the wheel</p>\n<p class="slindent">On which it entered as it was before.</p></div>\n\n<div class="stanza"><p>The other joy, already known to me,</p>\n<p class="slindent">Became a thing transplendent in my sight,</p>\n<p class="slindent">As a fine ruby smitten by the sun.</p></div>\n\n<div class="stanza"><p>Through joy effulgence is acquired above,</p>\n<p class="slindent">As here a smile; but down below, the shade</p>\n<p class="slindent">Outwardly darkens, as the mind is sad.</p></div>\n\n<div class="stanza"><p>&ldquo;God seeth all things, and in Him, blest spirit,</p>\n<p class="slindent">Thy sight is,&rdquo; said I, &ldquo;so that never will</p>\n<p class="slindent">Of his can possibly from thee be hidden;</p></div>\n\n<div class="stanza"><p>Thy voice, then, that for ever makes the heavens</p>\n<p class="slindent">Glad, with the singing of those holy fires</p>\n<p class="slindent">Which of their six wings make themselves a cowl,</p></div>\n\n<div class="stanza"><p>Wherefore does it not satisfy my longings?</p>\n<p class="slindent">Indeed, I would not wait thy questioning</p>\n<p class="slindent">If I in thee were as thou art in me.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;The greatest of the valleys where the water</p>\n<p class="slindent">Expands itself,&rdquo; forthwith its words began,</p>\n<p class="slindent">&ldquo;That sea excepted which the earth engarlands,</p></div>\n\n<div class="stanza"><p>Between discordant shores against the sun</p>\n<p class="slindent">Extends so far, that it meridian makes</p>\n<p class="slindent">Where it was wont before to make the horizon.</p></div>\n\n<div class="stanza"><p>I was a dweller on that valley&rsquo;s shore</p>\n<p class="slindent">&rsquo;Twixt Ebro and Magra that with journey short</p>\n<p class="slindent">Doth from the Tuscan part the Genoese.</p></div>\n\n<div class="stanza"><p>With the same sunset and same sunrise nearly</p>\n<p class="slindent">Sit Buggia and the city whence I was,</p>\n<p class="slindent">That with its blood once made the harbour hot.</p></div>\n\n<div class="stanza"><p>Folco that people called me unto whom</p>\n<p class="slindent">My name was known; and now with me this heaven</p>\n<p class="slindent">Imprints itself, as I did once with it;</p></div>\n\n<div class="stanza"><p>For more the daughter of Belus never burned,</p>\n<p class="slindent">Offending both Sichaeus and Creusa,</p>\n<p class="slindent">Than I, so long as it became my locks,</p></div>\n\n<div class="stanza"><p>Nor yet that Rodophean, who deluded</p>\n<p class="slindent">was by Demophoon, nor yet Alcides,</p>\n<p class="slindent">When Iole he in his heart had locked.</p></div>\n\n<div class="stanza"><p>Yet here is no repenting, but we smile,</p>\n<p class="slindent">Not at the fault, which comes not back to mind,</p>\n<p class="slindent">But at the power which ordered and foresaw.</p></div>\n\n<div class="stanza"><p>Here we behold the art that doth adorn</p>\n<p class="slindent">With such affection, and the good discover</p>\n<p class="slindent">Whereby the world above turns that below.</p></div>\n\n<div class="stanza"><p>But that thou wholly satisfied mayst bear</p>\n<p class="slindent">Thy wishes hence which in this sphere are born,</p>\n<p class="slindent">Still farther to proceed behoveth me.</p></div>\n\n<div class="stanza"><p>Thou fain wouldst know who is within this light</p>\n<p class="slindent">That here beside me thus is scintillating,</p>\n<p class="slindent">Even as a sunbeam in the limpid water.</p></div>\n\n<div class="stanza"><p>Then know thou, that within there is at rest</p>\n<p class="slindent">Rahab, and being to our order joined,</p>\n<p class="slindent">With her in its supremest grade &rsquo;tis sealed.</p></div>\n\n<div class="stanza"><p>Into this heaven, where ends the shadowy cone</p>\n<p class="slindent">Cast by your world, before all other souls</p>\n<p class="slindent">First of Christ&rsquo;s triumph was she taken up.</p></div>\n\n<div class="stanza"><p>Full meet it was to leave her in some heaven,</p>\n<p class="slindent">Even as a palm of the high victory</p>\n<p class="slindent">Which he acquired with one palm and the other,</p></div>\n\n<div class="stanza"><p>Because she favoured the first glorious deed</p>\n<p class="slindent">Of Joshua upon the Holy Land,</p>\n<p class="slindent">That little stirs the memory of the Pope.</p></div>\n\n<div class="stanza"><p>Thy city, which an offshoot is of him</p>\n<p class="slindent">Who first upon his Maker turned his back,</p>\n<p class="slindent">And whose ambition is so sorely wept,</p></div>\n\n<div class="stanza"><p>Brings forth and scatters the accursed flower</p>\n<p class="slindent">Which both the sheep and lambs hath led astray</p>\n<p class="slindent">Since it has turned the shepherd to a wolf.</p></div>\n\n<div class="stanza"><p>For this the Evangel and the mighty Doctors</p>\n<p class="slindent">Are derelict, and only the Decretals</p>\n<p class="slindent">So studied that it shows upon their margins.</p></div>\n\n<div class="stanza"><p>On this are Pope and Cardinals intent;</p>\n<p class="slindent">Their meditations reach not Nazareth,</p>\n<p class="slindent">There where his pinions Gabriel unfolded;</p></div>\n\n<div class="stanza"><p>But Vatican and the other parts elect</p>\n<p class="slindent">Of Rome, which have a cemetery been</p>\n<p class="slindent">Unto the soldiery that followed Peter</p></div>\n\n<div class="stanza"><p>Shall soon be free from this adultery.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto X</p>\n<div class="stanza"><p>Looking into his Son with all the Love</p>\n<p class="slindent">Which each of them eternally breathes forth,</p>\n<p class="slindent">The Primal and unutterable Power</p></div>\n\n<div class="stanza"><p>Whate&rsquo;er before the mind or eye revolves</p>\n<p class="slindent">With so much order made, there can be none</p>\n<p class="slindent">Who this beholds without enjoying Him.</p></div>\n\n<div class="stanza"><p>Lift up then, Reader, to the lofty wheels</p>\n<p class="slindent">With me thy vision straight unto that part</p>\n<p class="slindent">Where the one motion on the other strikes,</p></div>\n\n<div class="stanza"><p>And there begin to contemplate with joy</p>\n<p class="slindent">That Master&rsquo;s art, who in himself so loves it</p>\n<p class="slindent">That never doth his eye depart therefrom.</p></div>\n\n<div class="stanza"><p>Behold how from that point goes branching off</p>\n<p class="slindent">The oblique circle, which conveys the planets,</p>\n<p class="slindent">To satisfy the world that calls upon them;</p></div>\n\n<div class="stanza"><p>And if their pathway were not thus inflected,</p>\n<p class="slindent">Much virtue in the heavens would be in vain,</p>\n<p class="slindent">And almost every power below here dead.</p></div>\n\n<div class="stanza"><p>If from the straight line distant more or less</p>\n<p class="slindent">Were the departure, much would wanting be</p>\n<p class="slindent">Above and underneath of mundane order.</p></div>\n\n<div class="stanza"><p>Remain now, Reader, still upon thy bench,</p>\n<p class="slindent">In thought pursuing that which is foretasted,</p>\n<p class="slindent">If thou wouldst jocund be instead of weary.</p></div>\n\n<div class="stanza"><p>I&rsquo;ve set before thee; henceforth feed thyself,</p>\n<p class="slindent">For to itself diverteth all my care</p>\n<p class="slindent">That theme whereof I have been made the scribe.</p></div>\n\n<div class="stanza"><p>The greatest of the ministers of nature,</p>\n<p class="slindent">Who with the power of heaven the world imprints</p>\n<p class="slindent">And measures with his light the time for us,</p></div>\n\n<div class="stanza"><p>With that part which above is called to mind</p>\n<p class="slindent">Conjoined, along the spirals was revolving,</p>\n<p class="slindent">Where each time earlier he presents himself;</p></div>\n\n<div class="stanza"><p>And I was with him; but of the ascending</p>\n<p class="slindent">I was not conscious, saving as a man</p>\n<p class="slindent">Of a first thought is conscious ere it come;</p></div>\n\n<div class="stanza"><p>And Beatrice, she who is seen to pass</p>\n<p class="slindent">From good to better, and so suddenly</p>\n<p class="slindent">That not by time her action is expressed,</p></div>\n\n<div class="stanza"><p>How lucent in herself must she have been!</p>\n<p class="slindent">And what was in the sun, wherein I entered,</p>\n<p class="slindent">Apparent not by colour but by light,</p></div>\n\n<div class="stanza"><p>I, though I call on genius, art, and practice,</p>\n<p class="slindent">Cannot so tell that it could be imagined;</p>\n<p class="slindent">Believe one can, and let him long to see it.</p></div>\n\n<div class="stanza"><p>And if our fantasies too lowly are</p>\n<p class="slindent">For altitude so great, it is no marvel,</p>\n<p class="slindent">Since o&rsquo;er the sun was never eye could go.</p></div>\n\n<div class="stanza"><p>Such in this place was the fourth family</p>\n<p class="slindent">Of the high Father, who forever sates it,</p>\n<p class="slindent">Showing how he breathes forth and how begets.</p></div>\n\n<div class="stanza"><p>And Beatrice began: &ldquo;Give thanks, give thanks</p>\n<p class="slindent">Unto the Sun of Angels, who to this</p>\n<p class="slindent">Sensible one has raised thee by his grace!&rdquo;</p></div>\n\n<div class="stanza"><p>Never was heart of mortal so disposed</p>\n<p class="slindent">To worship, nor to give itself to God</p>\n<p class="slindent">With all its gratitude was it so ready,</p></div>\n\n<div class="stanza"><p>As at those words did I myself become;</p>\n<p class="slindent">And all my love was so absorbed in Him,</p>\n<p class="slindent">That in oblivion Beatrice was eclipsed.</p></div>\n\n<div class="stanza"><p>Nor this displeased her; but she smiled at it</p>\n<p class="slindent">So that the splendour of her laughing eyes</p>\n<p class="slindent">My single mind on many things divided.</p></div>\n\n<div class="stanza"><p>Lights many saw I, vivid and triumphant,</p>\n<p class="slindent">Make us a centre and themselves a circle,</p>\n<p class="slindent">More sweet in voice than luminous in aspect.</p></div>\n\n<div class="stanza"><p>Thus girt about the daughter of Latona</p>\n<p class="slindent">We sometimes see, when pregnant is the air,</p>\n<p class="slindent">So that it holds the thread which makes her zone.</p></div>\n\n<div class="stanza"><p>Within the court of Heaven, whence I return,</p>\n<p class="slindent">Are many jewels found, so fair and precious</p>\n<p class="slindent">They cannot be transported from the realm;</p></div>\n\n<div class="stanza"><p>And of them was the singing of those lights.</p>\n<p class="slindent">Who takes not wings that he may fly up thither,</p>\n<p class="slindent">The tidings thence may from the dumb await!</p></div>\n\n<div class="stanza"><p>As soon as singing thus those burning suns</p>\n<p class="slindent">Had round about us whirled themselves three times,</p>\n<p class="slindent">Like unto stars neighbouring the steadfast poles,</p></div>\n\n<div class="stanza"><p>Ladies they seemed, not from the dance released,</p>\n<p class="slindent">But who stop short, in silence listening</p>\n<p class="slindent">Till they have gathered the new melody.</p></div>\n\n<div class="stanza"><p>And within one I heard beginning: &ldquo;When</p>\n<p class="slindent">The radiance of grace, by which is kindled</p>\n<p class="slindent">True love, and which thereafter grows by loving,</p></div>\n\n<div class="stanza"><p>Within thee multiplied is so resplendent</p>\n<p class="slindent">That it conducts thee upward by that stair,</p>\n<p class="slindent">Where without reascending none descends,</p></div>\n\n<div class="stanza"><p>Who should deny the wine out of his vial</p>\n<p class="slindent">Unto thy thirst, in liberty were not</p>\n<p class="slindent">Except as water which descends not seaward.</p></div>\n\n<div class="stanza"><p>Fain wouldst thou know with what plants is enflowered</p>\n<p class="slindent">This garland that encircles with delight</p>\n<p class="slindent">The Lady fair who makes thee strong for heaven.</p></div>\n\n<div class="stanza"><p>Of the lambs was I of the holy flock</p>\n<p class="slindent">Which Dominic conducteth by a road</p>\n<p class="slindent">Where well one fattens if he strayeth not.</p></div>\n\n<div class="stanza"><p>He who is nearest to me on the right</p>\n<p class="slindent">My brother and master was; and he Albertus</p>\n<p class="slindent">Is of Cologne, I Thomas of Aquinum.</p></div>\n\n<div class="stanza"><p>If thou of all the others wouldst be certain,</p>\n<p class="slindent">Follow behind my speaking with thy sight</p>\n<p class="slindent">Upward along the blessed garland turning.</p></div>\n\n<div class="stanza"><p>That next effulgence issues from the smile</p>\n<p class="slindent">Of Gratian, who assisted both the courts</p>\n<p class="slindent">In such wise that it pleased in Paradise.</p></div>\n\n<div class="stanza"><p>The other which near by adorns our choir</p>\n<p class="slindent">That Peter was who, e&rsquo;en as the poor widow,</p>\n<p class="slindent">Offered his treasure unto Holy Church.</p></div>\n\n<div class="stanza"><p>The fifth light, that among us is the fairest,</p>\n<p class="slindent">Breathes forth from such a love, that all the world</p>\n<p class="slindent">Below is greedy to learn tidings of it.</p></div>\n\n<div class="stanza"><p>Within it is the lofty mind, where knowledge</p>\n<p class="slindent">So deep was put, that, if the true be true,</p>\n<p class="slindent">To see so much there never rose a second.</p></div>\n\n<div class="stanza"><p>Thou seest next the lustre of that taper,</p>\n<p class="slindent">Which in the flesh below looked most within</p>\n<p class="slindent">The angelic nature and its ministry.</p></div>\n\n<div class="stanza"><p>Within that other little light is smiling</p>\n<p class="slindent">The advocate of the Christian centuries,</p>\n<p class="slindent">Out of whose rhetoric Augustine was furnished.</p></div>\n\n<div class="stanza"><p>Now if thou trainest thy mind&rsquo;s eye along</p>\n<p class="slindent">From light to light pursuant of my praise,</p>\n<p class="slindent">With thirst already of the eighth thou waitest.</p></div>\n\n<div class="stanza"><p>By seeing every good therein exults</p>\n<p class="slindent">The sainted soul, which the fallacious world</p>\n<p class="slindent">Makes manifest to him who listeneth well;</p></div>\n\n<div class="stanza"><p>The body whence &rsquo;twas hunted forth is lying</p>\n<p class="slindent">Down in Cieldauro, and from martyrdom</p>\n<p class="slindent">And banishment it came unto this peace.</p></div>\n\n<div class="stanza"><p>See farther onward flame the burning breath</p>\n<p class="slindent">Of Isidore, of Beda, and of Richard</p>\n<p class="slindent">Who was in contemplation more than man.</p></div>\n\n<div class="stanza"><p>This, whence to me returneth thy regard,</p>\n<p class="slindent">The light is of a spirit unto whom</p>\n<p class="slindent">In his grave meditations death seemed slow.</p></div>\n\n<div class="stanza"><p>It is the light eternal of Sigier,</p>\n<p class="slindent">Who, reading lectures in the Street of Straw,</p>\n<p class="slindent">Did syllogize invidious verities.&rdquo;</p></div>\n\n<div class="stanza"><p>Then, as a horologe that calleth us</p>\n<p class="slindent">What time the Bride of God is rising up</p>\n<p class="slindent">With matins to her Spouse that he may love her,</p></div>\n\n<div class="stanza"><p>Wherein one part the other draws and urges,</p>\n<p class="slindent">Ting! ting! resounding with so sweet a note,</p>\n<p class="slindent">That swells with love the spirit well disposed,</p></div>\n\n<div class="stanza"><p>Thus I beheld the glorious wheel move round,</p>\n<p class="slindent">And render voice to voice, in modulation</p>\n<p class="slindent">And sweetness that can not be comprehended,</p></div>\n\n<div class="stanza"><p>Excepting there where joy is made eternal.</p></div>','<p class="cantohead">Paradiso: Canto XI</p>\n<div class="stanza"><p>O Thou insensate care of mortal men,</p>\n<p class="slindent">How inconclusive are the syllogisms</p>\n<p class="slindent">That make thee beat thy wings in downward flight!</p></div>\n\n<div class="stanza"><p>One after laws and one to aphorisms</p>\n<p class="slindent">Was going, and one following the priesthood,</p>\n<p class="slindent">And one to reign by force or sophistry,</p></div>\n\n<div class="stanza"><p>And one in theft, and one in state affairs,</p>\n<p class="slindent">One in the pleasures of the flesh involved</p>\n<p class="slindent">Wearied himself, one gave himself to ease;</p></div>\n\n<div class="stanza"><p>When I, from all these things emancipate,</p>\n<p class="slindent">With Beatrice above there in the Heavens</p>\n<p class="slindent">With such exceeding glory was received!</p></div>\n\n<div class="stanza"><p>When each one had returned unto that point</p>\n<p class="slindent">Within the circle where it was before,</p>\n<p class="slindent">It stood as in a candlestick a candle;</p></div>\n\n<div class="stanza"><p>And from within the effulgence which at first</p>\n<p class="slindent">Had spoken unto me, I heard begin</p>\n<p class="slindent">Smiling while it more luminous became:</p></div>\n\n<div class="stanza"><p>&ldquo;Even as I am kindled in its ray,</p>\n<p class="slindent">So, looking into the Eternal Light,</p>\n<p class="slindent">The occasion of thy thoughts I apprehend.</p></div>\n\n<div class="stanza"><p>Thou doubtest, and wouldst have me to resift</p>\n<p class="slindent">In language so extended and so open</p>\n<p class="slindent">My speech, that to thy sense it may be plain,</p></div>\n\n<div class="stanza"><p>Where just before I said, &lsquo;where well one fattens,&rsquo;</p>\n<p class="slindent">And where I said, &rsquo;there never rose a second;&rsquo;</p>\n<p class="slindent">And here &rsquo;tis needful we distinguish well.</p></div>\n\n<div class="stanza"><p>The Providence, which governeth the world</p>\n<p class="slindent">With counsel, wherein all created vision</p>\n<p class="slindent">Is vanquished ere it reach unto the bottom,</p></div>\n\n<div class="stanza"><p>(So that towards her own Beloved might go</p>\n<p class="slindent">The bride of Him who, uttering a loud cry,</p>\n<p class="slindent">Espoused her with his consecrated blood,</p></div>\n\n<div class="stanza"><p>Self-confident and unto Him more faithful,)</p>\n<p class="slindent">Two Princes did ordain in her behoof,</p>\n<p class="slindent">Which on this side and that might be her guide.</p></div>\n\n<div class="stanza"><p>The one was all seraphical in ardour;</p>\n<p class="slindent">The other by his wisdom upon earth</p>\n<p class="slindent">A splendour was of light cherubical.</p></div>\n\n<div class="stanza"><p>One will I speak of, for of both is spoken</p>\n<p class="slindent">In praising one, whichever may be taken,</p>\n<p class="slindent">Because unto one end their labours were.</p></div>\n\n<div class="stanza"><p>Between Tupino and the stream that falls</p>\n<p class="slindent">Down from the hill elect of blessed Ubald,</p>\n<p class="slindent">A fertile slope of lofty mountain hangs,</p></div>\n\n<div class="stanza"><p>From which Perugia feels the cold and heat</p>\n<p class="slindent">Through Porta Sole, and behind it weep</p>\n<p class="slindent">Gualdo and Nocera their grievous yoke.</p></div>\n\n<div class="stanza"><p>From out that slope, there where it breaketh most</p>\n<p class="slindent">Its steepness, rose upon the world a sun</p>\n<p class="slindent">As this one does sometimes from out the Ganges;</p></div>\n\n<div class="stanza"><p>Therefore let him who speaketh of that place,</p>\n<p class="slindent">Say not Ascesi, for he would say little,</p>\n<p class="slindent">But Orient, if he properly would speak.</p></div>\n\n<div class="stanza"><p>He was not yet far distant from his rising</p>\n<p class="slindent">Before he had begun to make the earth</p>\n<p class="slindent">Some comfort from his mighty virtue feel.</p></div>\n\n<div class="stanza"><p>For he in youth his father&rsquo;s wrath incurred</p>\n<p class="slindent">For certain Dame, to whom, as unto death,</p>\n<p class="slindent">The gate of pleasure no one doth unlock;</p></div>\n\n<div class="stanza"><p>And was before his spiritual court</p>\n<p class="slindent">&lsquo;Et coram patre&rsquo; unto her united;</p>\n<p class="slindent">Then day by day more fervently he loved her.</p></div>\n\n<div class="stanza"><p>She, reft of her first husband, scorned, obscure,</p>\n<p class="slindent">One thousand and one hundred years and more,</p>\n<p class="slindent">Waited without a suitor till he came.</p></div>\n\n<div class="stanza"><p>Naught it availed to hear, that with Amyclas</p>\n<p class="slindent">Found her unmoved at sounding of his voice</p>\n<p class="slindent">He who struck terror into all the world;</p></div>\n\n<div class="stanza"><p>Naught it availed being constant and undaunted,</p>\n<p class="slindent">So that, when Mary still remained below,</p>\n<p class="slindent">She mounted up with Christ upon the cross.</p></div>\n\n<div class="stanza"><p>But that too darkly I may not proceed,</p>\n<p class="slindent">Francis and Poverty for these two lovers</p>\n<p class="slindent">Take thou henceforward in my speech diffuse.</p></div>\n\n<div class="stanza"><p>Their concord and their joyous semblances,</p>\n<p class="slindent">The love, the wonder, and the sweet regard,</p>\n<p class="slindent">They made to be the cause of holy thoughts;</p></div>\n\n<div class="stanza"><p>So much so that the venerable Bernard</p>\n<p class="slindent">First bared his feet, and after so great peace</p>\n<p class="slindent">Ran, and, in running, thought himself too slow.</p></div>\n\n<div class="stanza"><p>O wealth unknown!  O veritable good!</p>\n<p class="slindent">Giles bares his feet, and bares his feet Sylvester</p>\n<p class="slindent">Behind the bridegroom, so doth please the bride!</p></div>\n\n<div class="stanza"><p>Then goes his way that father and that master,</p>\n<p class="slindent">He and his Lady and that family</p>\n<p class="slindent">Which now was girding on the humble cord;</p></div>\n\n<div class="stanza"><p>Nor cowardice of heart weighed down his brow</p>\n<p class="slindent">At being son of Peter Bernardone,</p>\n<p class="slindent">Nor for appearing marvellously scorned;</p></div>\n\n<div class="stanza"><p>But regally his hard determination</p>\n<p class="slindent">To Innocent he opened, and from him</p>\n<p class="slindent">Received the primal seal upon his Order.</p></div>\n\n<div class="stanza"><p>After the people mendicant increased</p>\n<p class="slindent">Behind this man, whose admirable life</p>\n<p class="slindent">Better in glory of the heavens were sung,</p></div>\n\n<div class="stanza"><p>Incoronated with a second crown</p>\n<p class="slindent">Was through Honorius by the Eternal Spirit</p>\n<p class="slindent">The holy purpose of this Archimandrite.</p></div>\n\n<div class="stanza"><p>And when he had, through thirst of martyrdom,</p>\n<p class="slindent">In the proud presence of the Sultan preached</p>\n<p class="slindent">Christ and the others who came after him,</p></div>\n\n<div class="stanza"><p>And, finding for conversion too unripe</p>\n<p class="slindent">The folk, and not to tarry there in vain,</p>\n<p class="slindent">Returned to fruit of the Italic grass,</p></div>\n\n<div class="stanza"><p>On the rude rock &rsquo;twixt Tiber and the Arno</p>\n<p class="slindent">From Christ did he receive the final seal,</p>\n<p class="slindent">Which during two whole years his members bore.</p></div>\n\n<div class="stanza"><p>When He, who chose him unto so much good,</p>\n<p class="slindent">Was pleased to draw him up to the reward</p>\n<p class="slindent">That he had merited by being lowly,</p></div>\n\n<div class="stanza"><p>Unto his friars, as to the rightful heirs,</p>\n<p class="slindent">His most dear Lady did he recommend,</p>\n<p class="slindent">And bade that they should love her faithfully;</p></div>\n\n<div class="stanza"><p>And from her bosom the illustrious soul</p>\n<p class="slindent">Wished to depart, returning to its realm,</p>\n<p class="slindent">And for its body wished no other bier.</p></div>\n\n<div class="stanza"><p>Think now what man was he, who was a fit</p>\n<p class="slindent">Companion over the high seas to keep</p>\n<p class="slindent">The bark of Peter to its proper bearings.</p></div>\n\n<div class="stanza"><p>And this man was our Patriarch; hence whoever</p>\n<p class="slindent">Doth follow him as he commands can see</p>\n<p class="slindent">That he is laden with good merchandise.</p></div>\n\n<div class="stanza"><p>But for new pasturage his flock has grown</p>\n<p class="slindent">So greedy, that it is impossible</p>\n<p class="slindent">They be not scattered over fields diverse;</p></div>\n\n<div class="stanza"><p>And in proportion as his sheep remote</p>\n<p class="slindent">And vagabond go farther off from him,</p>\n<p class="slindent">More void of milk return they to the fold.</p></div>\n\n<div class="stanza"><p>Verily some there are that fear a hurt,</p>\n<p class="slindent">And keep close to the shepherd; but so few,</p>\n<p class="slindent">That little cloth doth furnish forth their hoods.</p></div>\n\n<div class="stanza"><p>Now if my utterance be not indistinct,</p>\n<p class="slindent">If thine own hearing hath attentive been,</p>\n<p class="slindent">If thou recall to mind what I have said,</p></div>\n\n<div class="stanza"><p>In part contented shall thy wishes be;</p>\n<p class="slindent">For thou shalt see the plant that&rsquo;s chipped away,</p>\n<p class="slindent">And the rebuke that lieth in the words,</p></div>\n\n<div class="stanza"><p>&lsquo;Where well one fattens, if he strayeth not.&rsquo;&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XII</p>\n<div class="stanza"><p>Soon as the blessed flame had taken up</p>\n<p class="slindent">The final word to give it utterance,</p>\n<p class="slindent">Began the holy millstone to revolve,</p></div>\n\n<div class="stanza"><p>And in its gyre had not turned wholly round,</p>\n<p class="slindent">Before another in a ring enclosed it,</p>\n<p class="slindent">And motion joined to motion, song to song;</p></div>\n\n<div class="stanza"><p>Song that as greatly doth transcend our Muses,</p>\n<p class="slindent">Our Sirens, in those dulcet clarions,</p>\n<p class="slindent">As primal splendour that which is reflected.</p></div>\n\n<div class="stanza"><p>And as are spanned athwart a tender cloud</p>\n<p class="slindent">Two rainbows parallel and like in colour,</p>\n<p class="slindent">When Juno to her handmaid gives command,</p></div>\n\n<div class="stanza"><p>(The one without born of the one within,</p>\n<p class="slindent">Like to the speaking of that vagrant one</p>\n<p class="slindent">Whom love consumed as doth the sun the vapours,)</p></div>\n\n<div class="stanza"><p>And make the people here, through covenant</p>\n<p class="slindent">God set with Noah, presageful of the world</p>\n<p class="slindent">That shall no more be covered with a flood,</p></div>\n\n<div class="stanza"><p>In such wise of those sempiternal roses</p>\n<p class="slindent">The garlands twain encompassed us about,</p>\n<p class="slindent">And thus the outer to the inner answered.</p></div>\n\n<div class="stanza"><p>After the dance, and other grand rejoicings,</p>\n<p class="slindent">Both of the singing, and the flaming forth</p>\n<p class="slindent">Effulgence with effulgence blithe and tender,</p></div>\n\n<div class="stanza"><p>Together, at once, with one accord had stopped,</p>\n<p class="slindent">(Even as the eyes, that, as volition moves them,</p>\n<p class="slindent">Must needs together shut and lift themselves,)</p></div>\n\n<div class="stanza"><p>Out of the heart of one of the new lights</p>\n<p class="slindent">There came a voice, that needle to the star</p>\n<p class="slindent">Made me appear in turning thitherward.</p></div>\n\n<div class="stanza"><p>And it began: &ldquo;The love that makes me fair</p>\n<p class="slindent">Draws me to speak about the other leader,</p>\n<p class="slindent">By whom so well is spoken here of mine.</p></div>\n\n<div class="stanza"><p>&rsquo;Tis right, where one is, to bring in the other,</p>\n<p class="slindent">That, as they were united in their warfare,</p>\n<p class="slindent">Together likewise may their glory shine.</p></div>\n\n<div class="stanza"><p>The soldiery of Christ, which it had cost</p>\n<p class="slindent">So dear to arm again, behind the standard</p>\n<p class="slindent">Moved slow and doubtful and in numbers few,</p></div>\n\n<div class="stanza"><p>When the Emperor who reigneth evermore</p>\n<p class="slindent">Provided for the host that was in peril,</p>\n<p class="slindent">Through grace alone and not that it was worthy;</p></div>\n\n<div class="stanza"><p>And, as was said, he to his Bride brought succour</p>\n<p class="slindent">With champions twain, at whose deed, at whose word</p>\n<p class="slindent">The straggling people were together drawn.</p></div>\n\n<div class="stanza"><p>Within that region where the sweet west wind</p>\n<p class="slindent">Rises to open the new leaves, wherewith</p>\n<p class="slindent">Europe is seen to clothe herself afresh,</p></div>\n\n<div class="stanza"><p>Not far off from the beating of the waves,</p>\n<p class="slindent">Behind which in his long career the sun</p>\n<p class="slindent">Sometimes conceals himself from every man,</p></div>\n\n<div class="stanza"><p>Is situate the fortunate Calahorra,</p>\n<p class="slindent">Under protection of the mighty shield</p>\n<p class="slindent">In which the Lion subject is and sovereign.</p></div>\n\n<div class="stanza"><p>Therein was born the amorous paramour</p>\n<p class="slindent">Of Christian Faith, the athlete consecrate,</p>\n<p class="slindent">Kind to his own and cruel to his foes;</p></div>\n\n<div class="stanza"><p>And when it was created was his mind</p>\n<p class="slindent">Replete with such a living energy,</p>\n<p class="slindent">That in his mother her it made prophetic.</p></div>\n\n<div class="stanza"><p>As soon as the espousals were complete</p>\n<p class="slindent">Between him and the Faith at holy font,</p>\n<p class="slindent">Where they with mutual safety dowered each other,</p></div>\n\n<div class="stanza"><p>The woman, who for him had given assent,</p>\n<p class="slindent">Saw in a dream the admirable fruit</p>\n<p class="slindent">That issue would from him and from his heirs;</p></div>\n\n<div class="stanza"><p>And that he might be construed as he was,</p>\n<p class="slindent">A spirit from this place went forth to name him</p>\n<p class="slindent">With His possessive whose he wholly was.</p></div>\n\n<div class="stanza"><p>Dominic was he called; and him I speak of</p>\n<p class="slindent">Even as of the husbandman whom Christ</p>\n<p class="slindent">Elected to his garden to assist him.</p></div>\n\n<div class="stanza"><p>Envoy and servant sooth he seemed of Christ,</p>\n<p class="slindent">For the first love made manifest in him</p>\n<p class="slindent">Was the first counsel that was given by Christ.</p></div>\n\n<div class="stanza"><p>Silent and wakeful many a time was he</p>\n<p class="slindent">Discovered by his nurse upon the ground,</p>\n<p class="slindent">As if he would have said, &lsquo;For this I came.&rsquo;</p></div>\n\n<div class="stanza"><p>O thou his father, Felix verily!</p>\n<p class="slindent">O thou his mother, verily Joanna,</p>\n<p class="slindent">If this, interpreted, means as is said!</p></div>\n\n<div class="stanza"><p>Not for the world which people toil for now</p>\n<p class="slindent">In following Ostiense and Taddeo,</p>\n<p class="slindent">But through his longing after the true manna,</p></div>\n\n<div class="stanza"><p>He in short time became so great a teacher,</p>\n<p class="slindent">That he began to go about the vineyard,</p>\n<p class="slindent">Which fadeth soon, if faithless be the dresser;</p></div>\n\n<div class="stanza"><p>And of the See, (that once was more benignant</p>\n<p class="slindent">Unto the righteous poor, not through itself,</p>\n<p class="slindent">But him who sits there and degenerates,)</p></div>\n\n<div class="stanza"><p>Not to dispense or two or three for six,</p>\n<p class="slindent">Not any fortune of first vacancy,</p>\n<p class="slindent">&lsquo;Non decimas quae sunt pauperum Dei,&rsquo;</p></div>\n\n<div class="stanza"><p>He asked for, but against the errant world</p>\n<p class="slindent">Permission to do battle for the seed,</p>\n<p class="slindent">Of which these four and twenty plants surround thee.</p></div>\n\n<div class="stanza"><p>Then with the doctrine and the will together,</p>\n<p class="slindent">With office apostolical he moved,</p>\n<p class="slindent">Like torrent which some lofty vein out-presses;</p></div>\n\n<div class="stanza"><p>And in among the shoots heretical</p>\n<p class="slindent">His impetus with greater fury smote,</p>\n<p class="slindent">Wherever the resistance was the greatest.</p></div>\n\n<div class="stanza"><p>Of him were made thereafter divers runnels,</p>\n<p class="slindent">Whereby the garden catholic is watered,</p>\n<p class="slindent">So that more living its plantations stand.</p></div>\n\n<div class="stanza"><p>If such the one wheel of the Biga was,</p>\n<p class="slindent">In which the Holy Church itself defended</p>\n<p class="slindent">And in the field its civic battle won,</p></div>\n\n<div class="stanza"><p>Truly full manifest should be to thee</p>\n<p class="slindent">The excellence of the other, unto whom</p>\n<p class="slindent">Thomas so courteous was before my coming.</p></div>\n\n<div class="stanza"><p>But still the orbit, which the highest part</p>\n<p class="slindent">Of its circumference made, is derelict,</p>\n<p class="slindent">So that the mould is where was once the crust.</p></div>\n\n<div class="stanza"><p>His family, that had straight forward moved</p>\n<p class="slindent">With feet upon his footprints, are turned round</p>\n<p class="slindent">So that they set the point upon the heel.</p></div>\n\n<div class="stanza"><p>And soon aware they will be of the harvest</p>\n<p class="slindent">Of this bad husbandry, when shall the tares</p>\n<p class="slindent">Complain the granary is taken from them.</p></div>\n\n<div class="stanza"><p>Yet say I, he who searcheth leaf by leaf</p>\n<p class="slindent">Our volume through, would still some page discover</p>\n<p class="slindent">Where he could read, &lsquo;I am as I am wont.&rsquo;</p></div>\n\n<div class="stanza"><p>&rsquo;Twill not be from Casal nor Acquasparta,</p>\n<p class="slindent">From whence come such unto the written word</p>\n<p class="slindent">That one avoids it, and the other narrows.</p></div>\n\n<div class="stanza"><p>Bonaventura of Bagnoregio&rsquo;s life</p>\n<p class="slindent">Am I, who always in great offices</p>\n<p class="slindent">Postponed considerations sinister.</p></div>\n\n<div class="stanza"><p>Here are Illuminato and Agostino,</p>\n<p class="slindent">Who of the first barefooted beggars were</p>\n<p class="slindent">That with the cord the friends of God became.</p></div>\n\n<div class="stanza"><p>Hugh of Saint Victor is among them here,</p>\n<p class="slindent">And Peter Mangiador, and Peter of Spain,</p>\n<p class="slindent">Who down below in volumes twelve is shining;</p></div>\n\n<div class="stanza"><p>Nathan the seer, and metropolitan</p>\n<p class="slindent">Chrysostom, and Anselmus, and Donatus</p>\n<p class="slindent">Who deigned to lay his hand to the first art;</p></div>\n\n<div class="stanza"><p>Here is Rabanus, and beside me here</p>\n<p class="slindent">Shines the Calabrian Abbot Joachim,</p>\n<p class="slindent">He with the spirit of prophecy endowed.</p></div>\n\n<div class="stanza"><p>To celebrate so great a paladin</p>\n<p class="slindent">Have moved me the impassioned courtesy</p>\n<p class="slindent">And the discreet discourses of Friar Thomas,</p></div>\n\n<div class="stanza"><p>And with me they have moved this company.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XIII</p>\n<div class="stanza"><p>Let him imagine, who would well conceive</p>\n<p class="slindent">What now I saw, and let him while I speak</p>\n<p class="slindent">Retain the image as a steadfast rock,</p></div>\n\n<div class="stanza"><p>The fifteen stars, that in their divers regions</p>\n<p class="slindent">The sky enliven with a light so great</p>\n<p class="slindent">That it transcends all clusters of the air;</p></div>\n\n<div class="stanza"><p>Let him the Wain imagine unto which</p>\n<p class="slindent">Our vault of heaven sufficeth night and day,</p>\n<p class="slindent">So that in turning of its pole it fails not;</p></div>\n\n<div class="stanza"><p>Let him the mouth imagine of the horn</p>\n<p class="slindent">That in the point beginneth of the axis</p>\n<p class="slindent">Round about which the primal wheel revolves,\u2014</p></div>\n\n<div class="stanza"><p>To have fashioned of themselves two signs in heaven,</p>\n<p class="slindent">Like unto that which Minos&rsquo; daughter made,</p>\n<p class="slindent">The moment when she felt the frost of death;</p></div>\n\n<div class="stanza"><p>And one to have its rays within the other,</p>\n<p class="slindent">And both to whirl themselves in such a manner</p>\n<p class="slindent">That one should forward go, the other backward;</p></div>\n\n<div class="stanza"><p>And he will have some shadowing forth of that</p>\n<p class="slindent">True constellation and the double dance</p>\n<p class="slindent">That circled round the point at which I was;</p></div>\n\n<div class="stanza"><p>Because it is as much beyond our wont,</p>\n<p class="slindent">As swifter than the motion of the Chiana</p>\n<p class="slindent">Moveth the heaven that all the rest outspeeds.</p></div>\n\n<div class="stanza"><p>There sang they neither Bacchus, nor Apollo,</p>\n<p class="slindent">But in the divine nature Persons three,</p>\n<p class="slindent">And in one person the divine and human.</p></div>\n\n<div class="stanza"><p>The singing and the dance fulfilled their measure,</p>\n<p class="slindent">And unto us those holy lights gave need,</p>\n<p class="slindent">Growing in happiness from care to care.</p></div>\n\n<div class="stanza"><p>Then broke the silence of those saints concordant</p>\n<p class="slindent">The light in which the admirable life</p>\n<p class="slindent">Of God&rsquo;s own mendicant was told to me,</p></div>\n\n<div class="stanza"><p>And said: &ldquo;Now that one straw is trodden out</p>\n<p class="slindent">Now that its seed is garnered up already,</p>\n<p class="slindent">Sweet love invites me to thresh out the other.</p></div>\n\n<div class="stanza"><p>Into that bosom, thou believest, whence</p>\n<p class="slindent">Was drawn the rib to form the beauteous cheek</p>\n<p class="slindent">Whose taste to all the world is costing dear,</p></div>\n\n<div class="stanza"><p>And into that which, by the lance transfixed,</p>\n<p class="slindent">Before and since, such satisfaction made</p>\n<p class="slindent">That it weighs down the balance of all sin,</p></div>\n\n<div class="stanza"><p>Whate&rsquo;er of light it has to human nature</p>\n<p class="slindent">Been lawful to possess was all infused</p>\n<p class="slindent">By the same power that both of them created;</p></div>\n\n<div class="stanza"><p>And hence at what I said above dost wonder,</p>\n<p class="slindent">When I narrated that no second had</p>\n<p class="slindent">The good which in the fifth light is enclosed.</p></div>\n\n<div class="stanza"><p>Now ope thine eyes to what I answer thee,</p>\n<p class="slindent">And thou shalt see thy creed and my discourse</p>\n<p class="slindent">Fit in the truth as centre in a circle.</p></div>\n\n<div class="stanza"><p>That which can die, and that which dieth not,</p>\n<p class="slindent">Are nothing but the splendour of the idea</p>\n<p class="slindent">Which by his love our Lord brings into being;</p></div>\n\n<div class="stanza"><p>Because that living Light, which from its fount</p>\n<p class="slindent">Effulgent flows, so that it disunites not</p>\n<p class="slindent">From Him nor from the Love in them intrined,</p></div>\n\n<div class="stanza"><p>Through its own goodness reunites its rays</p>\n<p class="slindent">In nine subsistences, as in a mirror,</p>\n<p class="slindent">Itself eternally remaining One.</p></div>\n\n<div class="stanza"><p>Thence it descends to the last potencies,</p>\n<p class="slindent">Downward from act to act becoming such</p>\n<p class="slindent">That only brief contingencies it makes;</p></div>\n\n<div class="stanza"><p>And these contingencies I hold to be</p>\n<p class="slindent">Things generated, which the heaven produces</p>\n<p class="slindent">By its own motion, with seed and without.</p></div>\n\n<div class="stanza"><p>Neither their wax, nor that which tempers it,</p>\n<p class="slindent">Remains immutable, and hence beneath</p>\n<p class="slindent">The ideal signet more and less shines through;</p></div>\n\n<div class="stanza"><p>Therefore it happens, that the selfsame tree</p>\n<p class="slindent">After its kind bears worse and better fruit,</p>\n<p class="slindent">And ye are born with characters diverse.</p></div>\n\n<div class="stanza"><p>If in perfection tempered were the wax,</p>\n<p class="slindent">And were the heaven in its supremest virtue,</p>\n<p class="slindent">The brilliance of the seal would all appear;</p></div>\n\n<div class="stanza"><p>But nature gives it evermore deficient,</p>\n<p class="slindent">In the like manner working as the artist,</p>\n<p class="slindent">Who has the skill of art and hand that trembles.</p></div>\n\n<div class="stanza"><p>If then the fervent Love, the Vision clear,</p>\n<p class="slindent">Of primal Virtue do dispose and seal,</p>\n<p class="slindent">Perfection absolute is there acquired.</p></div>\n\n<div class="stanza"><p>Thus was of old the earth created worthy</p>\n<p class="slindent">Of all and every animal perfection;</p>\n<p class="slindent">And thus the Virgin was impregnate made;</p></div>\n\n<div class="stanza"><p>So that thine own opinion I commend,</p>\n<p class="slindent">That human nature never yet has been,</p>\n<p class="slindent">Nor will be, what it was in those two persons.</p></div>\n\n<div class="stanza"><p>Now if no farther forth I should proceed,</p>\n<p class="slindent">&lsquo;Then in what way was he without a peer?&rsquo;</p>\n<p class="slindent">Would be the first beginning of thy words.</p></div>\n\n<div class="stanza"><p>But, that may well appear what now appears not,</p>\n<p class="slindent">Think who he was, and what occasion moved him</p>\n<p class="slindent">To make request, when it was told him, &lsquo;Ask.&rsquo;</p></div>\n\n<div class="stanza"><p>I&rsquo;ve not so spoken that thou canst not see</p>\n<p class="slindent">Clearly he was a king who asked for wisdom,</p>\n<p class="slindent">That he might be sufficiently a king;</p></div>\n\n<div class="stanza"><p>&rsquo;Twas not to know the number in which are</p>\n<p class="slindent">The motors here above, or if &lsquo;necesse&rsquo;</p>\n<p class="slindent">With a contingent e&rsquo;er &lsquo;necesse&rsquo; make,</p></div>\n\n<div class="stanza"><p>&lsquo;Non si est dare primum motum esse,&rsquo;</p>\n<p class="slindent">Or if in semicircle can be made</p>\n<p class="slindent">Triangle so that it have no right angle.</p></div>\n\n<div class="stanza"><p>Whence, if thou notest this and what I said,</p>\n<p class="slindent">A regal prudence is that peerless seeing</p>\n<p class="slindent">In which the shaft of my intention strikes.</p></div>\n\n<div class="stanza"><p>And if on &lsquo;rose&rsquo; thou turnest thy clear eyes,</p>\n<p class="slindent">Thou&rsquo;lt see that it has reference alone</p>\n<p class="slindent">To kings who&rsquo;re many, and the good are rare.</p></div>\n\n<div class="stanza"><p>With this distinction take thou what I said,</p>\n<p class="slindent">And thus it can consist with thy belief</p>\n<p class="slindent">Of the first father and of our Delight.</p></div>\n\n<div class="stanza"><p>And lead shall this be always to thy feet,</p>\n<p class="slindent">To make thee, like a weary man, move slowly</p>\n<p class="slindent">Both to the Yes and No thou seest not;</p></div>\n\n<div class="stanza"><p>For very low among the fools is he</p>\n<p class="slindent">Who affirms without distinction, or denies,</p>\n<p class="slindent">As well in one as in the other case;</p></div>\n\n<div class="stanza"><p>Because it happens that full often bends</p>\n<p class="slindent">Current opinion in the false direction,</p>\n<p class="slindent">And then the feelings bind the intellect.</p></div>\n\n<div class="stanza"><p>Far more than uselessly he leaves the shore,</p>\n<p class="slindent">(Since he returneth not the same he went,)</p>\n<p class="slindent">Who fishes for the truth, and has no skill;</p></div>\n\n<div class="stanza"><p>And in the world proofs manifest thereof</p>\n<p class="slindent">Parmenides, Melissus, Brissus are,</p>\n<p class="slindent">And many who went on and knew not whither;</p></div>\n\n<div class="stanza"><p>Thus did Sabellius, Arius, and those fools</p>\n<p class="slindent">Who have been even as swords unto the Scriptures</p>\n<p class="slindent">In rendering distorted their straight faces.</p></div>\n\n<div class="stanza"><p>Nor yet shall people be too confident</p>\n<p class="slindent">In judging, even as he is who doth count</p>\n<p class="slindent">The corn in field or ever it be ripe.</p></div>\n\n<div class="stanza"><p>For I have seen all winter long the thorn</p>\n<p class="slindent">First show itself intractable and fierce,</p>\n<p class="slindent">And after bear the rose upon its top;</p></div>\n\n<div class="stanza"><p>And I have seen a ship direct and swift</p>\n<p class="slindent">Run o&rsquo;er the sea throughout its course entire,</p>\n<p class="slindent">To perish at the harbour&rsquo;s mouth at last.</p></div>\n\n<div class="stanza"><p>Let not Dame Bertha nor Ser Martin think,</p>\n<p class="slindent">Seeing one steal, another offering make,</p>\n<p class="slindent">To see them in the arbitrament divine;</p></div>\n\n<div class="stanza"><p>For one may rise, and fall the other may.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XIV</p>\n<div class="stanza"><p>From centre unto rim, from rim to centre,</p>\n<p class="slindent">In a round vase the water moves itself,</p>\n<p class="slindent">As from without &rsquo;tis struck or from within.</p></div>\n\n<div class="stanza"><p>Into my mind upon a sudden dropped</p>\n<p class="slindent">What I am saying, at the moment when</p>\n<p class="slindent">Silent became the glorious life of Thomas,</p></div>\n\n<div class="stanza"><p>Because of the resemblance that was born</p>\n<p class="slindent">Of his discourse and that of Beatrice,</p>\n<p class="slindent">Whom, after him, it pleased thus to begin:</p></div>\n\n<div class="stanza"><p>&ldquo;This man has need (and does not tell you so,</p>\n<p class="slindent">Nor with the voice, nor even in his thought)</p>\n<p class="slindent">Of going to the root of one truth more.</p></div>\n\n<div class="stanza"><p>Declare unto him if the light wherewith</p>\n<p class="slindent">Blossoms your substance shall remain with you</p>\n<p class="slindent">Eternally the same that it is now;</p></div>\n\n<div class="stanza"><p>And if it do remain, say in what manner,</p>\n<p class="slindent">After ye are again made visible,</p>\n<p class="slindent">It can be that it injure not your sight.&rdquo;</p></div>\n\n<div class="stanza"><p>As by a greater gladness urged and drawn</p>\n<p class="slindent">They who are dancing in a ring sometimes</p>\n<p class="slindent">Uplift their voices and their motions quicken;</p></div>\n\n<div class="stanza"><p>So, at that orison devout and prompt,</p>\n<p class="slindent">The holy circles a new joy displayed</p>\n<p class="slindent">In their revolving and their wondrous song.</p></div>\n\n<div class="stanza"><p>Whoso lamenteth him that here we die</p>\n<p class="slindent">That we may live above, has never there</p>\n<p class="slindent">Seen the refreshment of the eternal rain.</p></div>\n\n<div class="stanza"><p>The One and Two and Three who ever liveth,</p>\n<p class="slindent">And reigneth ever in Three and Two and One,</p>\n<p class="slindent">Not circumscribed and all things circumscribing,</p></div>\n\n<div class="stanza"><p>Three several times was chanted by each one</p>\n<p class="slindent">Among those spirits, with such melody</p>\n<p class="slindent">That for all merit it were just reward;</p></div>\n\n<div class="stanza"><p>And, in the lustre most divine of all</p>\n<p class="slindent">The lesser ring, I heard a modest voice,</p>\n<p class="slindent">Such as perhaps the Angel&rsquo;s was to Mary,</p></div>\n\n<div class="stanza"><p>Answer: &ldquo;As long as the festivity</p>\n<p class="slindent">Of Paradise shall be, so long our love</p>\n<p class="slindent">Shall radiate round about us such a vesture.</p></div>\n\n<div class="stanza"><p>Its brightness is proportioned to the ardour,</p>\n<p class="slindent">The ardour to the vision; and the vision</p>\n<p class="slindent">Equals what grace it has above its worth.</p></div>\n\n<div class="stanza"><p>When, glorious and sanctified, our flesh</p>\n<p class="slindent">Is reassumed, then shall our persons be</p>\n<p class="slindent">More pleasing by their being all complete;</p></div>\n\n<div class="stanza"><p>For will increase whate&rsquo;er bestows on us</p>\n<p class="slindent">Of light gratuitous the Good Supreme,</p>\n<p class="slindent">Light which enables us to look on Him;</p></div>\n\n<div class="stanza"><p>Therefore the vision must perforce increase,</p>\n<p class="slindent">Increase the ardour which from that is kindled,</p>\n<p class="slindent">Increase the radiance which from this proceeds.</p></div>\n\n<div class="stanza"><p>But even as a coal that sends forth flame,</p>\n<p class="slindent">And by its vivid whiteness overpowers it</p>\n<p class="slindent">So that its own appearance it maintains,</p></div>\n\n<div class="stanza"><p>Thus the effulgence that surrounds us now</p>\n<p class="slindent">Shall be o&rsquo;erpowered in aspect by the flesh,</p>\n<p class="slindent">Which still to-day the earth doth cover up;</p></div>\n\n<div class="stanza"><p>Nor can so great a splendour weary us,</p>\n<p class="slindent">For strong will be the organs of the body</p>\n<p class="slindent">To everything which hath the power to please us.&rdquo;</p></div>\n\n<div class="stanza"><p>So sudden and alert appeared to me</p>\n<p class="slindent">Both one and the other choir to say Amen,</p>\n<p class="slindent">That well they showed desire for their dead bodies;</p></div>\n\n<div class="stanza"><p>Nor sole for them perhaps, but for the mothers,</p>\n<p class="slindent">The fathers, and the rest who had been dear</p>\n<p class="slindent">Or ever they became eternal flames.</p></div>\n\n<div class="stanza"><p>And lo! all round about of equal brightness</p>\n<p class="slindent">Arose a lustre over what was there,</p>\n<p class="slindent">Like an horizon that is clearing up.</p></div>\n\n<div class="stanza"><p>And as at rise of early eve begin</p>\n<p class="slindent">Along the welkin new appearances,</p>\n<p class="slindent">So that the sight seems real and unreal,</p></div>\n\n<div class="stanza"><p>It seemed to me that new subsistences</p>\n<p class="slindent">Began there to be seen, and make a circle</p>\n<p class="slindent">Outside the other two circumferences.</p></div>\n\n<div class="stanza"><p>O very sparkling of the Holy Spirit,</p>\n<p class="slindent">How sudden and incandescent it became</p>\n<p class="slindent">Unto mine eyes, that vanquished bore it not!</p></div>\n\n<div class="stanza"><p>But Beatrice so beautiful and smiling</p>\n<p class="slindent">Appeared to me, that with the other sights</p>\n<p class="slindent">That followed not my memory I must leave her.</p></div>\n\n<div class="stanza"><p>Then to uplift themselves mine eyes resumed</p>\n<p class="slindent">The power, and I beheld myself translated</p>\n<p class="slindent">To higher salvation with my Lady only.</p></div>\n\n<div class="stanza"><p>Well was I ware that I was more uplifted</p>\n<p class="slindent">By the enkindled smiling of the star,</p>\n<p class="slindent">That seemed to me more ruddy than its wont.</p></div>\n\n<div class="stanza"><p>With all my heart, and in that dialect</p>\n<p class="slindent">Which is the same in all, such holocaust</p>\n<p class="slindent">To God I made as the new grace beseemed;</p></div>\n\n<div class="stanza"><p>And not yet from my bosom was exhausted</p>\n<p class="slindent">The ardour of sacrifice, before I knew</p>\n<p class="slindent">This offering was accepted and auspicious;</p></div>\n\n<div class="stanza"><p>For with so great a lustre and so red</p>\n<p class="slindent">Splendours appeared to me in twofold rays,</p>\n<p class="slindent">I said: &ldquo;O Helios who dost so adorn them!&rdquo;</p></div>\n\n<div class="stanza"><p>Even as distinct with less and greater lights</p>\n<p class="slindent">Glimmers between the two poles of the world</p>\n<p class="slindent">The Galaxy that maketh wise men doubt,</p></div>\n\n<div class="stanza"><p>Thus constellated in the depths of Mars,</p>\n<p class="slindent">Those rays described the venerable sign</p>\n<p class="slindent">That quadrants joining in a circle make.</p></div>\n\n<div class="stanza"><p>Here doth my memory overcome my genius;</p>\n<p class="slindent">For on that cross as levin gleamed forth Christ,</p>\n<p class="slindent">So that I cannot find ensample worthy;</p></div>\n\n<div class="stanza"><p>But he who takes his cross and follows Christ</p>\n<p class="slindent">Again will pardon me what I omit,</p>\n<p class="slindent">Seeing in that aurora lighten Christ.</p></div>\n\n<div class="stanza"><p>From horn to horn, and &rsquo;twixt the top and base,</p>\n<p class="slindent">Lights were in motion, brightly scintillating</p>\n<p class="slindent">As they together met and passed each other;</p></div>\n\n<div class="stanza"><p>Thus level and aslant and swift and slow</p>\n<p class="slindent">We here behold, renewing still the sight,</p>\n<p class="slindent">The particles of bodies long and short,</p></div>\n\n<div class="stanza"><p>Across the sunbeam move, wherewith is listed</p>\n<p class="slindent">Sometimes the shade, which for their own defence</p>\n<p class="slindent">People with cunning and with art contrive.</p></div>\n\n<div class="stanza"><p>And as a lute and harp, accordant strung</p>\n<p class="slindent">With many strings, a dulcet tinkling make</p>\n<p class="slindent">To him by whom the notes are not distinguished,</p></div>\n\n<div class="stanza"><p>So from the lights that there to me appeared</p>\n<p class="slindent">Upgathered through the cross a melody,</p>\n<p class="slindent">Which rapt me, not distinguishing the hymn.</p></div>\n\n<div class="stanza"><p>Well was I ware it was of lofty laud,</p>\n<p class="slindent">Because there came to me, &ldquo;Arise and conquer!&rdquo;</p>\n<p class="slindent">As unto him who hears and comprehends not.</p></div>\n\n<div class="stanza"><p>So much enamoured I became therewith,</p>\n<p class="slindent">That until then there was not anything</p>\n<p class="slindent">That e&rsquo;er had fettered me with such sweet bonds.</p></div>\n\n<div class="stanza"><p>Perhaps my word appears somewhat too bold,</p>\n<p class="slindent">Postponing the delight of those fair eyes,</p>\n<p class="slindent">Into which gazing my desire has rest;</p></div>\n\n<div class="stanza"><p>But who bethinks him that the living seals</p>\n<p class="slindent">Of every beauty grow in power ascending,</p>\n<p class="slindent">And that I there had not turned round to those,</p></div>\n\n<div class="stanza"><p>Can me excuse, if I myself accuse</p>\n<p class="slindent">To excuse myself, and see that I speak truly:</p>\n<p class="slindent">For here the holy joy is not disclosed,</p></div>\n\n<div class="stanza"><p>Because ascending it becomes more pure.</p></div>','<p class="cantohead">Paradiso: Canto XV</p>\n<div class="stanza"><p>A will benign, in which reveals itself</p>\n<p class="slindent">Ever the love that righteously inspires,</p>\n<p class="slindent">As in the iniquitous, cupidity,</p></div>\n\n<div class="stanza"><p>Silence imposed upon that dulcet lyre,</p>\n<p class="slindent">And quieted the consecrated chords,</p>\n<p class="slindent">That Heaven&rsquo;s right hand doth tighten and relax.</p></div>\n\n<div class="stanza"><p>How unto just entreaties shall be deaf</p>\n<p class="slindent">Those substances, which, to give me desire</p>\n<p class="slindent">Of praying them, with one accord grew silent?</p></div>\n\n<div class="stanza"><p>&rsquo;Tis well that without end he should lament,</p>\n<p class="slindent">Who for the love of thing that doth not last</p>\n<p class="slindent">Eternally despoils him of that love!</p></div>\n\n<div class="stanza"><p>As through the pure and tranquil evening air</p>\n<p class="slindent">There shoots from time to time a sudden fire,</p>\n<p class="slindent">Moving the eyes that steadfast were before,</p></div>\n\n<div class="stanza"><p>And seems to be a star that changeth place,</p>\n<p class="slindent">Except that in the part where it is kindled</p>\n<p class="slindent">Nothing is missed, and this endureth little;</p></div>\n\n<div class="stanza"><p>So from the horn that to the right extends</p>\n<p class="slindent">Unto that cross&rsquo;s foot there ran a star</p>\n<p class="slindent">Out of the constellation shining there;</p></div>\n\n<div class="stanza"><p>Nor was the gem dissevered from its ribbon,</p>\n<p class="slindent">But down the radiant fillet ran along,</p>\n<p class="slindent">So that fire seemed it behind alabaster.</p></div>\n\n<div class="stanza"><p>Thus piteous did Anchises&rsquo; shade reach forward,</p>\n<p class="slindent">If any faith our greatest Muse deserve,</p>\n<p class="slindent">When in Elysium he his son perceived.</p></div>\n\n<div class="stanza"><p>&ldquo;O sanguis meus, O superinfusa</p>\n<p class="slindent">Gratia Dei, sicut tibi, cui</p>\n<p class="slindent">Bis unquam Coeli janua reclusa?&rdquo;</p></div>\n\n<div class="stanza"><p>Thus that effulgence; whence I gave it heed;</p>\n<p class="slindent">Then round unto my Lady turned my sight,</p>\n<p class="slindent">And on this side and that was stupefied;</p></div>\n\n<div class="stanza"><p>For in her eyes was burning such a smile</p>\n<p class="slindent">That with mine own methought I touched the bottom</p>\n<p class="slindent">Both of my grace and of my Paradise!</p></div>\n\n<div class="stanza"><p>Then, pleasant to the hearing and the sight,</p>\n<p class="slindent">The spirit joined to its beginning things</p>\n<p class="slindent">I understood not, so profound it spake;</p></div>\n\n<div class="stanza"><p>Nor did it hide itself from me by choice,</p>\n<p class="slindent">But by necessity; for its conception</p>\n<p class="slindent">Above the mark of mortals set itself.</p></div>\n\n<div class="stanza"><p>And when the bow of burning sympathy</p>\n<p class="slindent">Was so far slackened, that its speech descended</p>\n<p class="slindent">Towards the mark of our intelligence,</p></div>\n\n<div class="stanza"><p>The first thing that was understood by me</p>\n<p class="slindent">Was &ldquo;Benedight be Thou, O Trine and One,</p>\n<p class="slindent">Who hast unto my seed so courteous been!&rdquo;</p></div>\n\n<div class="stanza"><p>And it continued: &ldquo;Hunger long and grateful,</p>\n<p class="slindent">Drawn from the reading of the mighty volume</p>\n<p class="slindent">Wherein is never changed the white nor dark,</p></div>\n\n<div class="stanza"><p>Thou hast appeased, my son, within this light</p>\n<p class="slindent">In which I speak to thee, by grace of her</p>\n<p class="slindent">Who to this lofty flight with plumage clothed thee.</p></div>\n\n<div class="stanza"><p>Thou thinkest that to me thy thought doth pass</p>\n<p class="slindent">From Him who is the first, as from the unit,</p>\n<p class="slindent">If that be known, ray out the five and six;</p></div>\n\n<div class="stanza"><p>And therefore who I am thou askest not,</p>\n<p class="slindent">And why I seem more joyous unto thee</p>\n<p class="slindent">Than any other of this gladsome crowd.</p></div>\n\n<div class="stanza"><p>Thou think&rsquo;st the truth; because the small and great</p>\n<p class="slindent">Of this existence look into the mirror</p>\n<p class="slindent">Wherein, before thou think&rsquo;st, thy thought thou showest.</p></div>\n\n<div class="stanza"><p>But that the sacred love, in which I watch</p>\n<p class="slindent">With sight perpetual, and which makes me thirst</p>\n<p class="slindent">With sweet desire, may better be fulfilled,</p></div>\n\n<div class="stanza"><p>Now let thy voice secure and frank and glad</p>\n<p class="slindent">Proclaim the wishes, the desire proclaim,</p>\n<p class="slindent">To which my answer is decreed already.&rdquo;</p></div>\n\n<div class="stanza"><p>To Beatrice I turned me, and she heard</p>\n<p class="slindent">Before I spake, and smiled to me a sign,</p>\n<p class="slindent">That made the wings of my desire increase;</p></div>\n\n<div class="stanza"><p>Then in this wise began I: &ldquo;Love and knowledge,</p>\n<p class="slindent">When on you dawned the first Equality,</p>\n<p class="slindent">Of the same weight for each of you became;</p></div>\n\n<div class="stanza"><p>For in the Sun, which lighted you and burned</p>\n<p class="slindent">With heat and radiance, they so equal are,</p>\n<p class="slindent">That all similitudes are insufficient.</p></div>\n\n<div class="stanza"><p>But among mortals will and argument,</p>\n<p class="slindent">For reason that to you is manifest,</p>\n<p class="slindent">Diversely feathered in their pinions are.</p></div>\n\n<div class="stanza"><p>Whence I, who mortal am, feel in myself</p>\n<p class="slindent">This inequality; so give not thanks,</p>\n<p class="slindent">Save in my heart, for this paternal welcome.</p></div>\n\n<div class="stanza"><p>Truly do I entreat thee, living topaz!</p>\n<p class="slindent">Set in this precious jewel as a gem,</p>\n<p class="slindent">That thou wilt satisfy me with thy name.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O leaf of mine, in whom I pleasure took</p>\n<p class="slindent">E&rsquo;en while awaiting, I was thine own root!&rdquo;</p>\n<p class="slindent">Such a beginning he in answer made me.</p></div>\n\n<div class="stanza"><p>Then said to me: &ldquo;That one from whom is named</p>\n<p class="slindent">Thy race, and who a hundred years and more</p>\n<p class="slindent">Has circled round the mount on the first cornice,</p></div>\n\n<div class="stanza"><p>A son of mine and thy great-grandsire was;</p>\n<p class="slindent">Well it behoves thee that the long fatigue</p>\n<p class="slindent">Thou shouldst for him make shorter with thy works.</p></div>\n\n<div class="stanza"><p>Florence, within the ancient boundary</p>\n<p class="slindent">From which she taketh still her tierce and nones,</p>\n<p class="slindent">Abode in quiet, temperate and chaste.</p></div>\n\n<div class="stanza"><p>No golden chain she had, nor coronal,</p>\n<p class="slindent">Nor ladies shod with sandal shoon, nor girdle</p>\n<p class="slindent">That caught the eye more than the person did.</p></div>\n\n<div class="stanza"><p>Not yet the daughter at her birth struck fear</p>\n<p class="slindent">Into the father, for the time and dower</p>\n<p class="slindent">Did not o&rsquo;errun this side or that the measure.</p></div>\n\n<div class="stanza"><p>No houses had she void of families,</p>\n<p class="slindent">Not yet had thither come Sardanapalus</p>\n<p class="slindent">To show what in a chamber can be done;</p></div>\n\n<div class="stanza"><p>Not yet surpassed had Montemalo been</p>\n<p class="slindent">By your Uccellatojo, which surpassed</p>\n<p class="slindent">Shall in its downfall be as in its rise.</p></div>\n\n<div class="stanza"><p>Bellincion Berti saw I go begirt</p>\n<p class="slindent">With leather and with bone, and from the mirror</p>\n<p class="slindent">His dame depart without a painted face;</p></div>\n\n<div class="stanza"><p>And him of Nerli saw, and him of Vecchio,</p>\n<p class="slindent">Contented with their simple suits of buff</p>\n<p class="slindent">And with the spindle and the flax their dames.</p></div>\n\n<div class="stanza"><p>O fortunate women! and each one was certain</p>\n<p class="slindent">Of her own burial-place, and none as yet</p>\n<p class="slindent">For sake of France was in her bed deserted.</p></div>\n\n<div class="stanza"><p>One o&rsquo;er the cradle kept her studious watch,</p>\n<p class="slindent">And in her lullaby the language used</p>\n<p class="slindent">That first delights the fathers and the mothers;</p></div>\n\n<div class="stanza"><p>Another, drawing tresses from her distaff,</p>\n<p class="slindent">Told o&rsquo;er among her family the tales</p>\n<p class="slindent">Of Trojans and of Fesole and Rome.</p></div>\n\n<div class="stanza"><p>As great a marvel then would have been held</p>\n<p class="slindent">A Lapo Salterello, a Cianghella,</p>\n<p class="slindent">As Cincinnatus or Cornelia now.</p></div>\n\n<div class="stanza"><p>To such a quiet, such a beautiful</p>\n<p class="slindent">Life of the citizen, to such a safe</p>\n<p class="slindent">Community, and to so sweet an inn,</p></div>\n\n<div class="stanza"><p>Did Mary give me, with loud cries invoked,</p>\n<p class="slindent">And in your ancient Baptistery at once</p>\n<p class="slindent">Christian and Cacciaguida I became.</p></div>\n\n<div class="stanza"><p>Moronto was my brother, and Eliseo;</p>\n<p class="slindent">From Val di Pado came to me my wife,</p>\n<p class="slindent">And from that place thy surname was derived.</p></div>\n\n<div class="stanza"><p>I followed afterward the Emperor Conrad,</p>\n<p class="slindent">And he begirt me of his chivalry,</p>\n<p class="slindent">So much I pleased him with my noble deeds.</p></div>\n\n<div class="stanza"><p>I followed in his train against that law&rsquo;s</p>\n<p class="slindent">Iniquity, whose people doth usurp</p>\n<p class="slindent">Your just possession, through your Pastor&rsquo;s fault.</p></div>\n\n<div class="stanza"><p>There by that execrable race was I</p>\n<p class="slindent">Released from bonds of the fallacious world,</p>\n<p class="slindent">The love of which defileth many souls,</p></div>\n\n<div class="stanza"><p>And came from martyrdom unto this peace.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XVI</p>\n<div class="stanza"><p>O thou our poor nobility of blood,</p>\n<p class="slindent">If thou dost make the people glory in thee</p>\n<p class="slindent">Down here where our affection languishes,</p></div>\n\n<div class="stanza"><p>A marvellous thing it ne&rsquo;er will be to me;</p>\n<p class="slindent">For there where appetite is not perverted,</p>\n<p class="slindent">I say in Heaven, of thee I made a boast!</p></div>\n\n<div class="stanza"><p>Truly thou art a cloak that quickly shortens,</p>\n<p class="slindent">So that unless we piece thee day by day</p>\n<p class="slindent">Time goeth round about thee with his shears!</p></div>\n\n<div class="stanza"><p>With &lsquo;You,&rsquo; which Rome was first to tolerate,</p>\n<p class="slindent">(Wherein her family less perseveres,)</p>\n<p class="slindent">Yet once again my words beginning made;</p></div>\n\n<div class="stanza"><p>Whence Beatrice, who stood somewhat apart,</p>\n<p class="slindent">Smiling, appeared like unto her who coughed</p>\n<p class="slindent">At the first failing writ of Guenever.</p></div>\n\n<div class="stanza"><p>And I began: &ldquo;You are my ancestor,</p>\n<p class="slindent">You give to me all hardihood to speak,</p>\n<p class="slindent">You lift me so that I am more than I.</p></div>\n\n<div class="stanza"><p>So many rivulets with gladness fill</p>\n<p class="slindent">My mind, that of itself it makes a joy</p>\n<p class="slindent">Because it can endure this and not burst.</p></div>\n\n<div class="stanza"><p>Then tell me, my beloved root ancestral,</p>\n<p class="slindent">Who were your ancestors, and what the years</p>\n<p class="slindent">That in your boyhood chronicled themselves?</p></div>\n\n<div class="stanza"><p>Tell me about the sheepfold of Saint John,</p>\n<p class="slindent">How large it was, and who the people were</p>\n<p class="slindent">Within it worthy of the highest seats.&rdquo;</p></div>\n\n<div class="stanza"><p>As at the blowing of the winds a coal</p>\n<p class="slindent">Quickens to flame, so I beheld that light</p>\n<p class="slindent">Become resplendent at my blandishments.</p></div>\n\n<div class="stanza"><p>And as unto mine eyes it grew more fair,</p>\n<p class="slindent">With voice more sweet and tender, but not in</p>\n<p class="slindent">This modern dialect, it said to me:</p></div>\n\n<div class="stanza"><p>&ldquo;From uttering of the &lsquo;Ave,&rsquo; till the birth</p>\n<p class="slindent">In which my mother, who is now a saint,</p>\n<p class="slindent">Of me was lightened who had been her burden,</p></div>\n\n<div class="stanza"><p>Unto its Lion had this fire returned</p>\n<p class="slindent">Five hundred fifty times and thirty more,</p>\n<p class="slindent">To reinflame itself beneath his paw.</p></div>\n\n<div class="stanza"><p>My ancestors and I our birthplace had</p>\n<p class="slindent">Where first is found the last ward of the city</p>\n<p class="slindent">By him who runneth in your annual game.</p></div>\n\n<div class="stanza"><p>Suffice it of my elders to hear this;</p>\n<p class="slindent">But who they were, and whence they thither came,</p>\n<p class="slindent">Silence is more considerate than speech.</p></div>\n\n<div class="stanza"><p>All those who at that time were there between</p>\n<p class="slindent">Mars and the Baptist, fit for bearing arms,</p>\n<p class="slindent">Were a fifth part of those who now are living;</p></div>\n\n<div class="stanza"><p>But the community, that now is mixed</p>\n<p class="slindent">With Campi and Certaldo and Figghine,</p>\n<p class="slindent">Pure in the lowest artisan was seen.</p></div>\n\n<div class="stanza"><p>O how much better &rsquo;twere to have as neighbours</p>\n<p class="slindent">The folk of whom I speak, and at Galluzzo</p>\n<p class="slindent">And at Trespiano have your boundary,</p></div>\n\n<div class="stanza"><p>Than have them in the town, and bear the stench</p>\n<p class="slindent">Of Aguglione&rsquo;s churl, and him of Signa</p>\n<p class="slindent">Who has sharp eyes for trickery already.</p></div>\n\n<div class="stanza"><p>Had not the folk, which most of all the world</p>\n<p class="slindent">Degenerates, been a step-dame unto Caesar,</p>\n<p class="slindent">But as a mother to her son benignant,</p></div>\n\n<div class="stanza"><p>Some who turn Florentines, and trade and discount,</p>\n<p class="slindent">Would have gone back again to Simifonte</p>\n<p class="slindent">There where their grandsires went about as beggars.</p></div>\n\n<div class="stanza"><p>At Montemurlo still would be the Counts,</p>\n<p class="slindent">The Cerchi in the parish of Acone,</p>\n<p class="slindent">Perhaps in Valdigrieve the Buondelmonti.</p></div>\n\n<div class="stanza"><p>Ever the intermingling of the people</p>\n<p class="slindent">Has been the source of malady in cities,</p>\n<p class="slindent">As in the body food it surfeits on;</p></div>\n\n<div class="stanza"><p>And a blind bull more headlong plunges down</p>\n<p class="slindent">Than a blind lamb; and very often cuts</p>\n<p class="slindent">Better and more a single sword than five.</p></div>\n\n<div class="stanza"><p>If Luni thou regard, and Urbisaglia,</p>\n<p class="slindent">How they have passed away, and how are passing</p>\n<p class="slindent">Chiusi and Sinigaglia after them,</p></div>\n\n<div class="stanza"><p>To hear how races waste themselves away,</p>\n<p class="slindent">Will seem to thee no novel thing nor hard,</p>\n<p class="slindent">Seeing that even cities have an end.</p></div>\n\n<div class="stanza"><p>All things of yours have their mortality,</p>\n<p class="slindent">Even as yourselves; but it is hidden in some</p>\n<p class="slindent">That a long while endure, and lives are short;</p></div>\n\n<div class="stanza"><p>And as the turning of the lunar heaven</p>\n<p class="slindent">Covers and bares the shores without a pause,</p>\n<p class="slindent">In the like manner fortune does with Florence.</p></div>\n\n<div class="stanza"><p>Therefore should not appear a marvellous thing</p>\n<p class="slindent">What I shall say of the great Florentines</p>\n<p class="slindent">Of whom the fame is hidden in the Past.</p></div>\n\n<div class="stanza"><p>I saw the Ughi, saw the Catellini,</p>\n<p class="slindent">Filippi, Greci, Ormanni, and Alberichi,</p>\n<p class="slindent">Even in their fall illustrious citizens;</p></div>\n\n<div class="stanza"><p>And saw, as mighty as they ancient were,</p>\n<p class="slindent">With him of La Sannella him of Arca,</p>\n<p class="slindent">And Soldanier, Ardinghi, and Bostichi.</p></div>\n\n<div class="stanza"><p>Near to the gate that is at present laden</p>\n<p class="slindent">With a new felony of so much weight</p>\n<p class="slindent">That soon it shall be jetsam from the bark,</p></div>\n\n<div class="stanza"><p>The Ravignani were, from whom descended</p>\n<p class="slindent">The County Guido, and whoe&rsquo;er the name</p>\n<p class="slindent">Of the great Bellincione since hath taken.</p></div>\n\n<div class="stanza"><p>He of La Pressa knew the art of ruling</p>\n<p class="slindent">Already, and already Galigajo</p>\n<p class="slindent">Had hilt and pommel gilded in his house.</p></div>\n\n<div class="stanza"><p>Mighty already was the Column Vair,</p>\n<p class="slindent">Sacchetti, Giuochi, Fifant, and Barucci,</p>\n<p class="slindent">And Galli, and they who for the bushel blush.</p></div>\n\n<div class="stanza"><p>The stock from which were the Calfucci born</p>\n<p class="slindent">Was great already, and already chosen</p>\n<p class="slindent">To curule chairs the Sizii and Arrigucci.</p></div>\n\n<div class="stanza"><p>O how beheld I those who are undone</p>\n<p class="slindent">By their own pride! and how the Balls of Gold</p>\n<p class="slindent">Florence enflowered in all their mighty deeds!</p></div>\n\n<div class="stanza"><p>So likewise did the ancestors of those</p>\n<p class="slindent">Who evermore, when vacant is your church,</p>\n<p class="slindent">Fatten by staying in consistory.</p></div>\n\n<div class="stanza"><p>The insolent race, that like a dragon follows</p>\n<p class="slindent">Whoever flees, and unto him that shows</p>\n<p class="slindent">His teeth or purse is gentle as a lamb,</p></div>\n\n<div class="stanza"><p>Already rising was, but from low people;</p>\n<p class="slindent">So that it pleased not Ubertin Donato</p>\n<p class="slindent">That his wife&rsquo;s father should make him their kin.</p></div>\n\n<div class="stanza"><p>Already had Caponsacco to the Market</p>\n<p class="slindent">From Fesole descended, and already</p>\n<p class="slindent">Giuda and Infangato were good burghers.</p></div>\n\n<div class="stanza"><p>I&rsquo;ll tell a thing incredible, but true;</p>\n<p class="slindent">One entered the small circuit by a gate</p>\n<p class="slindent">Which from the Della Pera took its name!</p></div>\n\n<div class="stanza"><p>Each one that bears the beautiful escutcheon</p>\n<p class="slindent">Of the great baron whose renown and name</p>\n<p class="slindent">The festival of Thomas keepeth fresh,</p></div>\n\n<div class="stanza"><p>Knighthood and privilege from him received;</p>\n<p class="slindent">Though with the populace unites himself</p>\n<p class="slindent">To-day the man who binds it with a border.</p></div>\n\n<div class="stanza"><p>Already were Gualterotti and Importuni;</p>\n<p class="slindent">And still more quiet would the Borgo be</p>\n<p class="slindent">If with new neighbours it remained unfed.</p></div>\n\n<div class="stanza"><p>The house from which is born your lamentation,</p>\n<p class="slindent">Through just disdain that death among you brought</p>\n<p class="slindent">And put an end unto your joyous life,</p></div>\n\n<div class="stanza"><p>Was honoured in itself and its companions.</p>\n<p class="slindent">O Buondelmonte, how in evil hour</p>\n<p class="slindent">Thou fled&rsquo;st the bridal at another&rsquo;s promptings!</p></div>\n\n<div class="stanza"><p>Many would be rejoicing who are sad,</p>\n<p class="slindent">If God had thee surrendered to the Ema</p>\n<p class="slindent">The first time that thou camest to the city.</p></div>\n\n<div class="stanza"><p>But it behoved the mutilated stone</p>\n<p class="slindent">Which guards the bridge, that Florence should provide</p>\n<p class="slindent">A victim in her latest hour of peace.</p></div>\n\n<div class="stanza"><p>With all these families, and others with them,</p>\n<p class="slindent">Florence beheld I in so great repose,</p>\n<p class="slindent">That no occasion had she whence to weep;</p></div>\n\n<div class="stanza"><p>With all these families beheld so just</p>\n<p class="slindent">And glorious her people, that the lily</p>\n<p class="slindent">Never upon the spear was placed reversed,</p></div>\n\n<div class="stanza"><p>Nor by division was vermilion made.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XVII</p>\n<div class="stanza"><p>As came to Clymene, to be made certain</p>\n<p class="slindent">Of that which he had heard against himself,</p>\n<p class="slindent">He who makes fathers chary still to children,</p></div>\n\n<div class="stanza"><p>Even such was I, and such was I perceived</p>\n<p class="slindent">By Beatrice and by the holy light</p>\n<p class="slindent">That first on my account had changed its place.</p></div>\n\n<div class="stanza"><p>Therefore my Lady said to me: &ldquo;Send forth</p>\n<p class="slindent">The flame of thy desire, so that it issue</p>\n<p class="slindent">Imprinted well with the internal stamp;</p></div>\n\n<div class="stanza"><p>Not that our knowledge may be greater made</p>\n<p class="slindent">By speech of thine, but to accustom thee</p>\n<p class="slindent">To tell thy thirst, that we may give thee drink.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O my beloved tree, (that so dost lift thee,</p>\n<p class="slindent">That even as minds terrestrial perceive</p>\n<p class="slindent">No triangle containeth two obtuse,</p></div>\n\n<div class="stanza"><p>So thou beholdest the contingent things</p>\n<p class="slindent">Ere in themselves they are, fixing thine eyes</p>\n<p class="slindent">Upon the point in which all times are present,)</p></div>\n\n<div class="stanza"><p>While I was with Virgilius conjoined</p>\n<p class="slindent">Upon the mountain that the souls doth heal,</p>\n<p class="slindent">And when descending into the dead world,</p></div>\n\n<div class="stanza"><p>Were spoken to me of my future life</p>\n<p class="slindent">Some grievous words; although I feel myself</p>\n<p class="slindent">In sooth foursquare against the blows of chance.</p></div>\n\n<div class="stanza"><p>On this account my wish would be content</p>\n<p class="slindent">To hear what fortune is approaching me,</p>\n<p class="slindent">Because foreseen an arrow comes more slowly.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus did I say unto that selfsame light</p>\n<p class="slindent">That unto me had spoken before; and even</p>\n<p class="slindent">As Beatrice willed was my own will confessed.</p></div>\n\n<div class="stanza"><p>Not in vague phrase, in which the foolish folk</p>\n<p class="slindent">Ensnared themselves of old, ere yet was slain</p>\n<p class="slindent">The Lamb of God who taketh sins away,</p></div>\n\n<div class="stanza"><p>But with clear words and unambiguous</p>\n<p class="slindent">Language responded that paternal love,</p>\n<p class="slindent">Hid and revealed by its own proper smile:</p></div>\n\n<div class="stanza"><p>&ldquo;Contingency, that outside of the volume</p>\n<p class="slindent">Of your materiality extends not,</p>\n<p class="slindent">Is all depicted in the eternal aspect.</p></div>\n\n<div class="stanza"><p>Necessity however thence it takes not,</p>\n<p class="slindent">Except as from the eye, in which &rsquo;tis mirrored,</p>\n<p class="slindent">A ship that with the current down descends.</p></div>\n\n<div class="stanza"><p>From thence, e&rsquo;en as there cometh to the ear</p>\n<p class="slindent">Sweet harmony from an organ, comes in sight</p>\n<p class="slindent">To me the time that is preparing for thee.</p></div>\n\n<div class="stanza"><p>As forth from Athens went Hippolytus,</p>\n<p class="slindent">By reason of his step-dame false and cruel,</p>\n<p class="slindent">So thou from Florence must perforce depart.</p></div>\n\n<div class="stanza"><p>Already this is willed, and this is sought for;</p>\n<p class="slindent">And soon it shall be done by him who thinks it,</p>\n<p class="slindent">Where every day the Christ is bought and sold.</p></div>\n\n<div class="stanza"><p>The blame shall follow the offended party</p>\n<p class="slindent">In outcry as is usual; but the vengeance</p>\n<p class="slindent">Shall witness to the truth that doth dispense it.</p></div>\n\n<div class="stanza"><p>Thou shalt abandon everything beloved</p>\n<p class="slindent">Most tenderly, and this the arrow is</p>\n<p class="slindent">Which first the bow of banishment shoots forth.</p></div>\n\n<div class="stanza"><p>Thou shalt have proof how savoureth of salt</p>\n<p class="slindent">The bread of others, and how hard a road</p>\n<p class="slindent">The going down and up another&rsquo;s stairs.</p></div>\n\n<div class="stanza"><p>And that which most shall weigh upon thy shoulders</p>\n<p class="slindent">Will be the bad and foolish company</p>\n<p class="slindent">With which into this valley thou shalt fall;</p></div>\n\n<div class="stanza"><p>For all ingrate, all mad and impious</p>\n<p class="slindent">Will they become against thee; but soon after</p>\n<p class="slindent">They, and not thou, shall have the forehead scarlet.</p></div>\n\n<div class="stanza"><p>Of their bestiality their own proceedings</p>\n<p class="slindent">Shall furnish proof; so &rsquo;twill be well for thee</p>\n<p class="slindent">A party to have made thee by thyself.</p></div>\n\n<div class="stanza"><p>Thine earliest refuge and thine earliest inn</p>\n<p class="slindent">Shall be the mighty Lombard&rsquo;s courtesy,</p>\n<p class="slindent">Who on the Ladder bears the holy bird,</p></div>\n\n<div class="stanza"><p>Who such benign regard shall have for thee</p>\n<p class="slindent">That &rsquo;twixt you twain, in doing and in asking,</p>\n<p class="slindent">That shall be first which is with others last.</p></div>\n\n<div class="stanza"><p>With him shalt thou see one who at his birth</p>\n<p class="slindent">Has by this star of strength been so impressed,</p>\n<p class="slindent">That notable shall his achievements be.</p></div>\n\n<div class="stanza"><p>Not yet the people are aware of him</p>\n<p class="slindent">Through his young age, since only nine years yet</p>\n<p class="slindent">Around about him have these wheels revolved.</p></div>\n\n<div class="stanza"><p>But ere the Gascon cheat the noble Henry,</p>\n<p class="slindent">Some sparkles of his virtue shall appear</p>\n<p class="slindent">In caring not for silver nor for toil.</p></div>\n\n<div class="stanza"><p>So recognized shall his magnificence</p>\n<p class="slindent">Become hereafter, that his enemies</p>\n<p class="slindent">Will not have power to keep mute tongues about it.</p></div>\n\n<div class="stanza"><p>On him rely, and on his benefits;</p>\n<p class="slindent">By him shall many people be transformed,</p>\n<p class="slindent">Changing condition rich and mendicant;</p></div>\n\n<div class="stanza"><p>And written in thy mind thou hence shalt bear</p>\n<p class="slindent">Of him, but shalt not say it&rdquo;&mdash;and things said he</p>\n<p class="slindent">Incredible to those who shall be present.</p></div>\n\n<div class="stanza"><p>Then added: &ldquo;Son, these are the commentaries</p>\n<p class="slindent">On what was said to thee; behold the snares</p>\n<p class="slindent">That are concealed behind few revolutions;</p></div>\n\n<div class="stanza"><p>Yet would I not thy neighbours thou shouldst envy,</p>\n<p class="slindent">Because thy life into the future reaches</p>\n<p class="slindent">Beyond the punishment of their perfidies.&rdquo;</p></div>\n\n<div class="stanza"><p>When by its silence showed that sainted soul</p>\n<p class="slindent">That it had finished putting in the woof</p>\n<p class="slindent">Into that web which I had given it warped,</p></div>\n\n<div class="stanza"><p>Began I, even as he who yearneth after,</p>\n<p class="slindent">Being in doubt, some counsel from a person</p>\n<p class="slindent">Who seeth, and uprightly wills, and loves:</p></div>\n\n<div class="stanza"><p>&ldquo;Well see I, father mine, how spurreth on</p>\n<p class="slindent">The time towards me such a blow to deal me</p>\n<p class="slindent">As heaviest is to him who most gives way.</p></div>\n\n<div class="stanza"><p>Therefore with foresight it is well I arm me,</p>\n<p class="slindent">That, if the dearest place be taken from me,</p>\n<p class="slindent">I may not lose the others by my songs.</p></div>\n\n<div class="stanza"><p>Down through the world of infinite bitterness,</p>\n<p class="slindent">And o&rsquo;er the mountain, from whose beauteous summit</p>\n<p class="slindent">The eyes of my own Lady lifted me,</p></div>\n\n<div class="stanza"><p>And afterward through heaven from light to light,</p>\n<p class="slindent">I have learned that which, if I tell again,</p>\n<p class="slindent">Will be a savour of strong herbs to many.</p></div>\n\n<div class="stanza"><p>And if I am a timid friend to truth,</p>\n<p class="slindent">I fear lest I may lose my life with those</p>\n<p class="slindent">Who will hereafter call this time the olden.&rdquo;</p></div>\n\n<div class="stanza"><p>The light in which was smiling my own treasure</p>\n<p class="slindent">Which there I had discovered, flashed at first</p>\n<p class="slindent">As in the sunshine doth a golden mirror;</p></div>\n\n<div class="stanza"><p>Then made reply: &ldquo;A conscience overcast</p>\n<p class="slindent">Or with its own or with another&rsquo;s shame,</p>\n<p class="slindent">Will taste forsooth the tartness of thy word;</p></div>\n\n<div class="stanza"><p>But ne&rsquo;ertheless, all falsehood laid aside,</p>\n<p class="slindent">Make manifest thy vision utterly,</p>\n<p class="slindent">And let them scratch wherever is the itch;</p></div>\n\n<div class="stanza"><p>For if thine utterance shall offensive be</p>\n<p class="slindent">At the first taste, a vital nutriment</p>\n<p class="slindent">&rsquo;Twill leave thereafter, when it is digested.</p></div>\n\n<div class="stanza"><p>This cry of thine shall do as doth the wind,</p>\n<p class="slindent">Which smiteth most the most exalted summits,</p>\n<p class="slindent">And that is no slight argument of honour.</p></div>\n\n<div class="stanza"><p>Therefore are shown to thee within these wheels,</p>\n<p class="slindent">Upon the mount and in the dolorous valley,</p>\n<p class="slindent">Only the souls that unto fame are known;</p></div>\n\n<div class="stanza"><p>Because the spirit of the hearer rests not,</p>\n<p class="slindent">Nor doth confirm its faith by an example</p>\n<p class="slindent">Which has the root of it unknown and hidden,</p></div>\n\n<div class="stanza"><p>Or other reason that is not apparent.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XVIII</p>\n<div class="stanza"><p>Now was alone rejoicing in its word</p>\n<p class="slindent">That soul beatified, and I was tasting</p>\n<p class="slindent">My own, the bitter tempering with the sweet,</p></div>\n\n<div class="stanza"><p>And the Lady who to God was leading me</p>\n<p class="slindent">Said: &ldquo;Change thy thought; consider that I am</p>\n<p class="slindent">Near unto Him who every wrong disburdens.&rdquo;</p></div>\n\n<div class="stanza"><p>Unto the loving accents of my comfort</p>\n<p class="slindent">I turned me round, and then what love I saw</p>\n<p class="slindent">Within those holy eyes I here relinquish;</p></div>\n\n<div class="stanza"><p>Not only that my language I distrust,</p>\n<p class="slindent">But that my mind cannot return so far</p>\n<p class="slindent">Above itself, unless another guide it.</p></div>\n\n<div class="stanza"><p>Thus much upon that point can I repeat,</p>\n<p class="slindent">That, her again beholding, my affection</p>\n<p class="slindent">From every other longing was released.</p></div>\n\n<div class="stanza"><p>While the eternal pleasure, which direct</p>\n<p class="slindent">Rayed upon Beatrice, from her fair face</p>\n<p class="slindent">Contented me with its reflected aspect,</p></div>\n\n<div class="stanza"><p>Conquering me with the radiance of a smile,</p>\n<p class="slindent">She said to me, &ldquo;Turn thee about and listen;</p>\n<p class="slindent">Not in mine eyes alone is Paradise.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as sometimes here do we behold</p>\n<p class="slindent">The affection in the look, if it be such</p>\n<p class="slindent">That all the soul is wrapt away by it,</p></div>\n\n<div class="stanza"><p>So, by the flaming of the effulgence holy</p>\n<p class="slindent">To which I turned, I recognized therein</p>\n<p class="slindent">The wish of speaking to me somewhat farther.</p></div>\n\n<div class="stanza"><p>And it began: &ldquo;In this fifth resting-place</p>\n<p class="slindent">Upon the tree that liveth by its summit,</p>\n<p class="slindent">And aye bears fruit, and never loses leaf,</p></div>\n\n<div class="stanza"><p>Are blessed spirits that below, ere yet</p>\n<p class="slindent">They came to Heaven, were of such great renown</p>\n<p class="slindent">That every Muse therewith would affluent be.</p></div>\n\n<div class="stanza"><p>Therefore look thou upon the cross&rsquo;s horns;</p>\n<p class="slindent">He whom I now shall name will there enact</p>\n<p class="slindent">What doth within a cloud its own swift fire.&rdquo;</p></div>\n\n<div class="stanza"><p>I saw athwart the Cross a splendour drawn</p>\n<p class="slindent">By naming Joshua, (even as he did it,)</p>\n<p class="slindent">Nor noted I the word before the deed;</p></div>\n\n<div class="stanza"><p>And at the name of the great Maccabee</p>\n<p class="slindent">I saw another move itself revolving,</p>\n<p class="slindent">And gladness was the whip unto that top.</p></div>\n\n<div class="stanza"><p>Likewise for Charlemagne and for Orlando,</p>\n<p class="slindent">Two of them my regard attentive followed</p>\n<p class="slindent">As followeth the eye its falcon flying.</p></div>\n\n<div class="stanza"><p>William thereafterward, and Renouard,</p>\n<p class="slindent">And the Duke Godfrey, did attract my sight</p>\n<p class="slindent">Along upon that Cross, and Robert Guiscard.</p></div>\n\n<div class="stanza"><p>Then, moved and mingled with the other lights,</p>\n<p class="slindent">The soul that had addressed me showed how great</p>\n<p class="slindent">An artist &rsquo;twas among the heavenly singers.</p></div>\n\n<div class="stanza"><p>To my right side I turned myself around,</p>\n<p class="slindent">My duty to behold in Beatrice</p>\n<p class="slindent">Either by words or gesture signified;</p></div>\n\n<div class="stanza"><p>And so translucent I beheld her eyes,</p>\n<p class="slindent">So full of pleasure, that her countenance</p>\n<p class="slindent">Surpassed its other and its latest wont.</p></div>\n\n<div class="stanza"><p>And as, by feeling greater delectation,</p>\n<p class="slindent">A man in doing good from day to day</p>\n<p class="slindent">Becomes aware his virtue is increasing,</p></div>\n\n<div class="stanza"><p>So I became aware that my gyration</p>\n<p class="slindent">With heaven together had increased its arc,</p>\n<p class="slindent">That miracle beholding more adorned.</p></div>\n\n<div class="stanza"><p>And such as is the change, in little lapse</p>\n<p class="slindent">Of time, in a pale woman, when her face</p>\n<p class="slindent">Is from the load of bashfulness unladen,</p></div>\n\n<div class="stanza"><p>Such was it in mine eyes, when I had turned,</p>\n<p class="slindent">Caused by the whiteness of the temperate star,</p>\n<p class="slindent">The sixth, which to itself had gathered me.</p></div>\n\n<div class="stanza"><p>Within that Jovial torch did I behold</p>\n<p class="slindent">The sparkling of the love which was therein</p>\n<p class="slindent">Delineate our language to mine eyes.</p></div>\n\n<div class="stanza"><p>And even as birds uprisen from the shore,</p>\n<p class="slindent">As in congratulation o&rsquo;er their food,</p>\n<p class="slindent">Make squadrons of themselves, now round, now long,</p></div>\n\n<div class="stanza"><p>So from within those lights the holy creatures</p>\n<p class="slindent">Sang flying to and fro, and in their figures</p>\n<p class="slindent">Made of themselves now D, now I, now L.</p></div>\n\n<div class="stanza"><p>First singing they to their own music moved;</p>\n<p class="slindent">Then one becoming of these characters,</p>\n<p class="slindent">A little while they rested and were silent.</p></div>\n\n<div class="stanza"><p>O divine Pegasea, thou who genius</p>\n<p class="slindent">Dost glorious make, and render it long-lived,</p>\n<p class="slindent">And this through thee the cities and the kingdoms,</p></div>\n\n<div class="stanza"><p>Illume me with thyself, that I may bring</p>\n<p class="slindent">Their figures out as I have them conceived!</p>\n<p class="slindent">Apparent be thy power in these brief verses!</p></div>\n\n<div class="stanza"><p>Themselves then they displayed in five times seven</p>\n<p class="slindent">Vowels and consonants; and I observed</p>\n<p class="slindent">The parts as they seemed spoken unto me.</p></div>\n\n<div class="stanza"><p>&lsquo;Diligite justitiam,&rsquo; these were</p>\n<p class="slindent">First verb and noun of all that was depicted;</p>\n<p class="slindent">&lsquo;Qui judicatis terram&rsquo; were the last.</p></div>\n\n<div class="stanza"><p>Thereafter in the M of the fifth word</p>\n<p class="slindent">Remained they so arranged, that Jupiter</p>\n<p class="slindent">Seemed to be silver there with gold inlaid.</p></div>\n\n<div class="stanza"><p>And other lights I saw descend where was</p>\n<p class="slindent">The summit of the M, and pause there singing</p>\n<p class="slindent">The good, I think, that draws them to itself.</p></div>\n\n<div class="stanza"><p>Then, as in striking upon burning logs</p>\n<p class="slindent">Upward there fly innumerable sparks,</p>\n<p class="slindent">Whence fools are wont to look for auguries,</p></div>\n\n<div class="stanza"><p>More than a thousand lights seemed thence to rise,</p>\n<p class="slindent">And to ascend, some more, and others less,</p>\n<p class="slindent">Even as the Sun that lights them had allotted;</p></div>\n\n<div class="stanza"><p>And, each one being quiet in its place,</p>\n<p class="slindent">The head and neck beheld I of an eagle</p>\n<p class="slindent">Delineated by that inlaid fire.</p></div>\n\n<div class="stanza"><p>He who there paints has none to be his guide;</p>\n<p class="slindent">But Himself guides; and is from Him remembered</p>\n<p class="slindent">That virtue which is form unto the nest.</p></div>\n\n<div class="stanza"><p>The other beatitude, that contented seemed</p>\n<p class="slindent">At first to bloom a lily on the M,</p>\n<p class="slindent">By a slight motion followed out the imprint.</p></div>\n\n<div class="stanza"><p>O gentle star! what and how many gems</p>\n<p class="slindent">Did demonstrate to me, that all our justice</p>\n<p class="slindent">Effect is of that heaven which thou ingemmest!</p></div>\n\n<div class="stanza"><p>Wherefore I pray the Mind, in which begin</p>\n<p class="slindent">Thy motion and thy virtue, to regard</p>\n<p class="slindent">Whence comes the smoke that vitiates thy rays;</p></div>\n\n<div class="stanza"><p>So that a second time it now be wroth</p>\n<p class="slindent">With buying and with selling in the temple</p>\n<p class="slindent">Whose walls were built with signs and martyrdoms!</p></div>\n\n<div class="stanza"><p>O soldiery of heaven, whom I contemplate,</p>\n<p class="slindent">Implore for those who are upon the earth</p>\n<p class="slindent">All gone astray after the bad example!</p></div>\n\n<div class="stanza"><p>Once &rsquo;twas the custom to make war with swords;</p>\n<p class="slindent">But now &rsquo;tis made by taking here and there</p>\n<p class="slindent">The bread the pitying Father shuts from none.</p></div>\n\n<div class="stanza"><p>Yet thou, who writest but to cancel, think</p>\n<p class="slindent">That Peter and that Paul, who for this vineyard</p>\n<p class="slindent">Which thou art spoiling died, are still alive!</p></div>\n\n<div class="stanza"><p>Well canst thou say: &ldquo;So steadfast my desire</p>\n<p class="slindent">Is unto him who willed to live alone,</p>\n<p class="slindent">And for a dance was led to martyrdom,</p></div>\n\n<div class="stanza"><p>That I know not the Fisherman nor Paul.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XIX</p>\n<div class="stanza"><p>Appeared before me with its wings outspread</p>\n<p class="slindent">The beautiful image that in sweet fruition</p>\n<p class="slindent">Made jubilant the interwoven souls;</p></div>\n\n<div class="stanza"><p>Appeared a little ruby each, wherein</p>\n<p class="slindent">Ray of the sun was burning so enkindled</p>\n<p class="slindent">That each into mine eyes refracted it.</p></div>\n\n<div class="stanza"><p>And what it now behoves me to retrace</p>\n<p class="slindent">Nor voice has e&rsquo;er reported, nor ink written,</p>\n<p class="slindent">Nor was by fantasy e&rsquo;er comprehended;</p></div>\n\n<div class="stanza"><p>For speak I saw, and likewise heard, the beak,</p>\n<p class="slindent">And utter with its voice both &lsquo;I&rsquo; and &lsquo;My,&rsquo;</p>\n<p class="slindent">When in conception it was &lsquo;We&rsquo; and &lsquo;Our.&rsquo;</p></div>\n\n<div class="stanza"><p>And it began: &ldquo;Being just and merciful</p>\n<p class="slindent">Am I exalted here unto that glory</p>\n<p class="slindent">Which cannot be exceeded by desire;</p></div>\n\n<div class="stanza"><p>And upon earth I left my memory</p>\n<p class="slindent">Such, that the evil-minded people there</p>\n<p class="slindent">Commend it, but continue not the story.&rdquo;</p></div>\n\n<div class="stanza"><p>So doth a single heat from many embers</p>\n<p class="slindent">Make itself felt, even as from many loves</p>\n<p class="slindent">Issued a single sound from out that image.</p></div>\n\n<div class="stanza"><p>Whence I thereafter: &ldquo;O perpetual flowers</p>\n<p class="slindent">Of the eternal joy, that only one</p>\n<p class="slindent">Make me perceive your odours manifold,</p></div>\n\n<div class="stanza"><p>Exhaling, break within me the great fast</p>\n<p class="slindent">Which a long season has in hunger held me,</p>\n<p class="slindent">Not finding for it any food on earth.</p></div>\n\n<div class="stanza"><p>Well do I know, that if in heaven its mirror</p>\n<p class="slindent">Justice Divine another realm doth make,</p>\n<p class="slindent">Yours apprehends it not through any veil.</p></div>\n\n<div class="stanza"><p>You know how I attentively address me</p>\n<p class="slindent">To listen; and you know what is the doubt</p>\n<p class="slindent">That is in me so very old a fast.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as a falcon, issuing from his hood,</p>\n<p class="slindent">Doth move his head, and with his wings applaud him,</p>\n<p class="slindent">Showing desire, and making himself fine,</p></div>\n\n<div class="stanza"><p>Saw I become that standard, which of lauds</p>\n<p class="slindent">Was interwoven of the grace divine,</p>\n<p class="slindent">With such songs as he knows who there rejoices.</p></div>\n\n<div class="stanza"><p>Then it began: &ldquo;He who a compass turned</p>\n<p class="slindent">On the world&rsquo;s outer verge, and who within it</p>\n<p class="slindent">Devised so much occult and manifest,</p></div>\n\n<div class="stanza"><p>Could not the impress of his power so make</p>\n<p class="slindent">On all the universe, as that his Word</p>\n<p class="slindent">Should not remain in infinite excess.</p></div>\n\n<div class="stanza"><p>And this makes certain that the first proud being,</p>\n<p class="slindent">Who was the paragon of every creature,</p>\n<p class="slindent">By not awaiting light fell immature.</p></div>\n\n<div class="stanza"><p>And hence appears it, that each minor nature</p>\n<p class="slindent">Is scant receptacle unto that good</p>\n<p class="slindent">Which has no end, and by itself is measured.</p></div>\n\n<div class="stanza"><p>In consequence our vision, which perforce</p>\n<p class="slindent">Must be some ray of that intelligence</p>\n<p class="slindent">With which all things whatever are replete,</p></div>\n\n<div class="stanza"><p>Cannot in its own nature be so potent,</p>\n<p class="slindent">That it shall not its origin discern</p>\n<p class="slindent">Far beyond that which is apparent to it.</p></div>\n\n<div class="stanza"><p>Therefore into the justice sempiternal</p>\n<p class="slindent">The power of vision that your world receives,</p>\n<p class="slindent">As eye into the ocean, penetrates;</p></div>\n\n<div class="stanza"><p>Which, though it see the bottom near the shore,</p>\n<p class="slindent">Upon the deep perceives it not, and yet</p>\n<p class="slindent">&rsquo;Tis there, but it is hidden by the depth.</p></div>\n\n<div class="stanza"><p>There is no light but comes from the serene</p>\n<p class="slindent">That never is o&rsquo;ercast, nay, it is darkness</p>\n<p class="slindent">Or shadow of the flesh, or else its poison.</p></div>\n\n<div class="stanza"><p>Amply to thee is opened now the cavern</p>\n<p class="slindent">Which has concealed from thee the living justice</p>\n<p class="slindent">Of which thou mad&rsquo;st such frequent questioning.</p></div>\n\n<div class="stanza"><p>For saidst thou: &lsquo;Born a man is on the shore</p>\n<p class="slindent">Of Indus, and is none who there can speak</p>\n<p class="slindent">Of Christ, nor who can read, nor who can write;</p></div>\n\n<div class="stanza"><p>And all his inclinations and his actions</p>\n<p class="slindent">Are good, so far as human reason sees,</p>\n<p class="slindent">Without a sin in life or in discourse:</p></div>\n\n<div class="stanza"><p>He dieth unbaptised and without faith;</p>\n<p class="slindent">Where is this justice that condemneth him?</p>\n<p class="slindent">Where is his fault, if he do not believe?&rsquo;</p></div>\n\n<div class="stanza"><p>Now who art thou, that on the bench wouldst sit</p>\n<p class="slindent">In judgment at a thousand miles away,</p>\n<p class="slindent">With the short vision of a single span?</p></div>\n\n<div class="stanza"><p>Truly to him who with me subtilizes,</p>\n<p class="slindent">If so the Scripture were not over you,</p>\n<p class="slindent">For doubting there were marvellous occasion.</p></div>\n\n<div class="stanza"><p>O animals terrene, O stolid minds,</p>\n<p class="slindent">The primal will, that in itself is good,</p>\n<p class="slindent">Ne&rsquo;er from itself, the Good Supreme, has moved.</p></div>\n\n<div class="stanza"><p>So much is just as is accordant with it;</p>\n<p class="slindent">No good created draws it to itself,</p>\n<p class="slindent">But it, by raying forth, occasions that.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as above her nest goes circling round</p>\n<p class="slindent">The stork when she has fed her little ones,</p>\n<p class="slindent">And he who has been fed looks up at her,</p></div>\n\n<div class="stanza"><p>So lifted I my brows, and even such</p>\n<p class="slindent">Became the blessed image, which its wings</p>\n<p class="slindent">Was moving, by so many counsels urged.</p></div>\n\n<div class="stanza"><p>Circling around it sang, and said: &ldquo;As are</p>\n<p class="slindent">My notes to thee, who dost not comprehend them,</p>\n<p class="slindent">Such is the eternal judgment to you mortals.&rdquo;</p></div>\n\n<div class="stanza"><p>Those lucent splendours of the Holy Spirit</p>\n<p class="slindent">Grew quiet then, but still within the standard</p>\n<p class="slindent">That made the Romans reverend to the world.</p></div>\n\n<div class="stanza"><p>It recommenced: &ldquo;Unto this kingdom never</p>\n<p class="slindent">Ascended one who had not faith in Christ,</p>\n<p class="slindent">Before or since he to the tree was nailed.</p></div>\n\n<div class="stanza"><p>But look thou, many crying are, &lsquo;Christ, Christ!&rsquo;</p>\n<p class="slindent">Who at the judgment shall be far less near</p>\n<p class="slindent">To him than some shall be who knew not Christ.</p></div>\n\n<div class="stanza"><p>Such Christians shall the Ethiop condemn,</p>\n<p class="slindent">When the two companies shall be divided,</p>\n<p class="slindent">The one for ever rich, the other poor.</p></div>\n\n<div class="stanza"><p>What to your kings may not the Persians say,</p>\n<p class="slindent">When they that volume opened shall behold</p>\n<p class="slindent">In which are written down all their dispraises?</p></div>\n\n<div class="stanza"><p>There shall be seen, among the deeds of Albert,</p>\n<p class="slindent">That which ere long shall set the pen in motion,</p>\n<p class="slindent">For which the realm of Prague shall be deserted.</p></div>\n\n<div class="stanza"><p>There shall be seen the woe that on the Seine</p>\n<p class="slindent">He brings by falsifying of the coin,</p>\n<p class="slindent">Who by the blow of a wild boar shall die.</p></div>\n\n<div class="stanza"><p>There shall be seen the pride that causes thirst,</p>\n<p class="slindent">Which makes the Scot and Englishman so mad</p>\n<p class="slindent">That they within their boundaries cannot rest;</p></div>\n\n<div class="stanza"><p>Be seen the luxury and effeminate life</p>\n<p class="slindent">Of him of Spain, and the Bohemian,</p>\n<p class="slindent">Who valour never knew and never wished;</p></div>\n\n<div class="stanza"><p>Be seen the Cripple of Jerusalem,</p>\n<p class="slindent">His goodness represented by an I,</p>\n<p class="slindent">While the reverse an M shall represent;</p></div>\n\n<div class="stanza"><p>Be seen the avarice and poltroonery</p>\n<p class="slindent">Of him who guards the Island of the Fire,</p>\n<p class="slindent">Wherein Anchises finished his long life;</p></div>\n\n<div class="stanza"><p>And to declare how pitiful he is</p>\n<p class="slindent">Shall be his record in contracted letters</p>\n<p class="slindent">Which shall make note of much in little space.</p></div>\n\n<div class="stanza"><p>And shall appear to each one the foul deeds</p>\n<p class="slindent">Of uncle and of brother who a nation</p>\n<p class="slindent">So famous have dishonoured, and two crowns.</p></div>\n\n<div class="stanza"><p>And he of Portugal and he of Norway</p>\n<p class="slindent">Shall there be known, and he of Rascia too,</p>\n<p class="slindent">Who saw in evil hour the coin of Venice.</p></div>\n\n<div class="stanza"><p>O happy Hungary, if she let herself</p>\n<p class="slindent">Be wronged no farther! and Navarre the happy,</p>\n<p class="slindent">If with the hills that gird her she be armed!</p></div>\n\n<div class="stanza"><p>And each one may believe that now, as hansel</p>\n<p class="slindent">Thereof, do Nicosia and Famagosta</p>\n<p class="slindent">Lament and rage because of their own beast,</p></div>\n\n<div class="stanza"><p>Who from the others&rsquo; flank departeth not.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XX</p>\n<div class="stanza"><p>When he who all the world illuminates</p>\n<p class="slindent">Out of our hemisphere so far descends</p>\n<p class="slindent">That on all sides the daylight is consumed,</p></div>\n\n<div class="stanza"><p>The heaven, that erst by him alone was kindled,</p>\n<p class="slindent">Doth suddenly reveal itself again</p>\n<p class="slindent">By many lights, wherein is one resplendent.</p></div>\n\n<div class="stanza"><p>And came into my mind this act of heaven,</p>\n<p class="slindent">When the ensign of the world and of its leaders</p>\n<p class="slindent">Had silent in the blessed beak become;</p></div>\n\n<div class="stanza"><p>Because those living luminaries all,</p>\n<p class="slindent">By far more luminous, did songs begin</p>\n<p class="slindent">Lapsing and falling from my memory.</p></div>\n\n<div class="stanza"><p>O gentle Love, that with a smile dost cloak thee,</p>\n<p class="slindent">How ardent in those sparks didst thou appear,</p>\n<p class="slindent">That had the breath alone of holy thoughts!</p></div>\n\n<div class="stanza"><p>After the precious and pellucid crystals,</p>\n<p class="slindent">With which begemmed the sixth light I beheld,</p>\n<p class="slindent">Silence imposed on the angelic bells,</p></div>\n\n<div class="stanza"><p>I seemed to hear the murmuring of a river</p>\n<p class="slindent">That clear descendeth down from rock to rock,</p>\n<p class="slindent">Showing the affluence of its mountain-top.</p></div>\n\n<div class="stanza"><p>And as the sound upon the cithern&rsquo;s neck</p>\n<p class="slindent">Taketh its form, and as upon the vent</p>\n<p class="slindent">Of rustic pipe the wind that enters it,</p></div>\n\n<div class="stanza"><p>Even thus, relieved from the delay of waiting,</p>\n<p class="slindent">That murmuring of the eagle mounted up</p>\n<p class="slindent">Along its neck, as if it had been hollow.</p></div>\n\n<div class="stanza"><p>There it became a voice, and issued thence</p>\n<p class="slindent">From out its beak, in such a form of words</p>\n<p class="slindent">As the heart waited for wherein I wrote them.</p></div>\n\n<div class="stanza"><p>&ldquo;The part in me which sees and bears the sun</p>\n<p class="slindent">In mortal eagles,&rdquo; it began to me,</p>\n<p class="slindent">&ldquo;Now fixedly must needs be looked upon;</p></div>\n\n<div class="stanza"><p>For of the fires of which I make my figure,</p>\n<p class="slindent">Those whence the eye doth sparkle in my head</p>\n<p class="slindent">Of all their orders the supremest are.</p></div>\n\n<div class="stanza"><p>He who is shining in the midst as pupil</p>\n<p class="slindent">Was once the singer of the Holy Spirit,</p>\n<p class="slindent">Who bore the ark from city unto city;</p></div>\n\n<div class="stanza"><p>Now knoweth he the merit of his song,</p>\n<p class="slindent">In so far as effect of his own counsel,</p>\n<p class="slindent">By the reward which is commensurate.</p></div>\n\n<div class="stanza"><p>Of five, that make a circle for my brow,</p>\n<p class="slindent">He that approacheth nearest to my beak</p>\n<p class="slindent">Did the poor widow for her son console;</p></div>\n\n<div class="stanza"><p>Now knoweth he how dearly it doth cost</p>\n<p class="slindent">Not following Christ, by the experience</p>\n<p class="slindent">Of this sweet life and of its opposite.</p></div>\n\n<div class="stanza"><p>He who comes next in the circumference</p>\n<p class="slindent">Of which I speak, upon its highest arc,</p>\n<p class="slindent">Did death postpone by penitence sincere;</p></div>\n\n<div class="stanza"><p>Now knoweth he that the eternal judgment</p>\n<p class="slindent">Suffers no change, albeit worthy prayer</p>\n<p class="slindent">Maketh below to-morrow of to-day.</p></div>\n\n<div class="stanza"><p>The next who follows, with the laws and me,</p>\n<p class="slindent">Under the good intent that bore bad fruit</p>\n<p class="slindent">Became a Greek by ceding to the pastor;</p></div>\n\n<div class="stanza"><p>Now knoweth he how all the ill deduced</p>\n<p class="slindent">From his good action is not harmful to him,</p>\n<p class="slindent">Although the world thereby may be destroyed.</p></div>\n\n<div class="stanza"><p>And he, whom in the downward arc thou seest,</p>\n<p class="slindent">Guglielmo was, whom the same land deplores</p>\n<p class="slindent">That weepeth Charles and Frederick yet alive;</p></div>\n\n<div class="stanza"><p>Now knoweth he how heaven enamoured is</p>\n<p class="slindent">With a just king; and in the outward show</p>\n<p class="slindent">Of his effulgence he reveals it still.</p></div>\n\n<div class="stanza"><p>Who would believe, down in the errant world,</p>\n<p class="slindent">That e&rsquo;er the Trojan Ripheus in this round</p>\n<p class="slindent">Could be the fifth one of the holy lights?</p></div>\n\n<div class="stanza"><p>Now knoweth he enough of what the world</p>\n<p class="slindent">Has not the power to see of grace divine,</p>\n<p class="slindent">Although his sight may not discern the bottom.&rdquo;</p></div>\n\n<div class="stanza"><p>Like as a lark that in the air expatiates,</p>\n<p class="slindent">First singing and then silent with content</p>\n<p class="slindent">Of the last sweetness that doth satisfy her,</p></div>\n\n<div class="stanza"><p>Such seemed to me the image of the imprint</p>\n<p class="slindent">Of the eternal pleasure, by whose will</p>\n<p class="slindent">Doth everything become the thing it is.</p></div>\n\n<div class="stanza"><p>And notwithstanding to my doubt I was</p>\n<p class="slindent">As glass is to the colour that invests it,</p>\n<p class="slindent">To wait the time in silence it endured not,</p></div>\n\n<div class="stanza"><p>But forth from out my mouth, &ldquo;What things are these?&rdquo;</p>\n<p class="slindent">Extorted with the force of its own weight;</p>\n<p class="slindent">Whereat I saw great joy of coruscation.</p></div>\n\n<div class="stanza"><p>Thereafterward with eye still more enkindled</p>\n<p class="slindent">The blessed standard made to me reply,</p>\n<p class="slindent">To keep me not in wonderment suspended:</p></div>\n\n<div class="stanza"><p>&ldquo;I see that thou believest in these things</p>\n<p class="slindent">Because I say them, but thou seest not how;</p>\n<p class="slindent">So that, although believed in, they are hidden.</p></div>\n\n<div class="stanza"><p>Thou doest as he doth who a thing by name</p>\n<p class="slindent">Well apprehendeth, but its quiddity</p>\n<p class="slindent">Cannot perceive, unless another show it.</p></div>\n\n<div class="stanza"><p>&lsquo;Regnum coelorum&rsquo; suffereth violence</p>\n<p class="slindent">From fervent love, and from that living hope</p>\n<p class="slindent">That overcometh the Divine volition;</p></div>\n\n<div class="stanza"><p>Not in the guise that man o&rsquo;ercometh man,</p>\n<p class="slindent">But conquers it because it will be conquered,</p>\n<p class="slindent">And conquered conquers by benignity.</p></div>\n\n<div class="stanza"><p>The first life of the eyebrow and the fifth</p>\n<p class="slindent">Cause thee astonishment, because with them</p>\n<p class="slindent">Thou seest the region of the angels painted.</p></div>\n\n<div class="stanza"><p>They passed not from their bodies, as thou thinkest,</p>\n<p class="slindent">Gentiles, but Christians in the steadfast faith</p>\n<p class="slindent">Of feet that were to suffer and had suffered.</p></div>\n\n<div class="stanza"><p>For one from Hell, where no one e&rsquo;er turns back</p>\n<p class="slindent">Unto good will, returned unto his bones,</p>\n<p class="slindent">And that of living hope was the reward,\u2014</p></div>\n\n<div class="stanza"><p>Of living hope, that placed its efficacy</p>\n<p class="slindent">In prayers to God made to resuscitate him,</p>\n<p class="slindent">So that &rsquo;twere possible to move his will.</p></div>\n\n<div class="stanza"><p>The glorious soul concerning which I speak,</p>\n<p class="slindent">Returning to the flesh, where brief its stay,</p>\n<p class="slindent">Believed in Him who had the power to aid it;</p></div>\n\n<div class="stanza"><p>And, in believing, kindled to such fire</p>\n<p class="slindent">Of genuine love, that at the second death</p>\n<p class="slindent">Worthy it was to come unto this joy.</p></div>\n\n<div class="stanza"><p>The other one, through grace, that from so deep</p>\n<p class="slindent">A fountain wells that never hath the eye</p>\n<p class="slindent">Of any creature reached its primal wave,</p></div>\n\n<div class="stanza"><p>Set all his love below on righteousness;</p>\n<p class="slindent">Wherefore from grace to grace did God unclose</p>\n<p class="slindent">His eye to our redemption yet to be,</p></div>\n\n<div class="stanza"><p>Whence he believed therein, and suffered not</p>\n<p class="slindent">From that day forth the stench of paganism,</p>\n<p class="slindent">And he reproved therefor the folk perverse.</p></div>\n\n<div class="stanza"><p>Those Maidens three, whom at the right-hand wheel</p>\n<p class="slindent">Thou didst behold, were unto him for baptism</p>\n<p class="slindent">More than a thousand years before baptizing.</p></div>\n\n<div class="stanza"><p>O thou predestination, how remote</p>\n<p class="slindent">Thy root is from the aspect of all those</p>\n<p class="slindent">Who the First Cause do not behold entire!</p></div>\n\n<div class="stanza"><p>And you, O mortals! hold yourselves restrained</p>\n<p class="slindent">In judging; for ourselves, who look on God,</p>\n<p class="slindent">We do not know as yet all the elect;</p></div>\n\n<div class="stanza"><p>And sweet to us is such a deprivation,</p>\n<p class="slindent">Because our good in this good is made perfect,</p>\n<p class="slindent">That whatsoe&rsquo;er God wills, we also will.&rdquo;</p></div>\n\n<div class="stanza"><p>After this manner by that shape divine,</p>\n<p class="slindent">To make clear in me my short-sightedness,</p>\n<p class="slindent">Was given to me a pleasant medicine;</p></div>\n\n<div class="stanza"><p>And as good singer a good lutanist</p>\n<p class="slindent">Accompanies with vibrations of the chords,</p>\n<p class="slindent">Whereby more pleasantness the song acquires,</p></div>\n\n<div class="stanza"><p>So, while it spake, do I remember me</p>\n<p class="slindent">That I beheld both of those blessed lights,</p>\n<p class="slindent">Even as the winking of the eyes concords,</p></div>\n\n<div class="stanza"><p>Moving unto the words their little flames.</p></div>','<p class="cantohead">Paradiso: Canto XXI</p>\n<div class="stanza"><p>Already on my Lady&rsquo;s face mine eyes</p>\n<p class="slindent">Again were fastened, and with these my mind,</p>\n<p class="slindent">And from all other purpose was withdrawn;</p></div>\n\n<div class="stanza"><p>And she smiled not; but &ldquo;If I were to smile,&rdquo;</p>\n<p class="slindent">She unto me began, &ldquo;thou wouldst become</p>\n<p class="slindent">Like Semele, when she was turned to ashes.</p></div>\n\n<div class="stanza"><p>Because my beauty, that along the stairs</p>\n<p class="slindent">Of the eternal palace more enkindles,</p>\n<p class="slindent">As thou hast seen, the farther we ascend,</p></div>\n\n<div class="stanza"><p>If it were tempered not, is so resplendent</p>\n<p class="slindent">That all thy mortal power in its effulgence</p>\n<p class="slindent">Would seem a leaflet that the thunder crushes.</p></div>\n\n<div class="stanza"><p>We are uplifted to the seventh splendour,</p>\n<p class="slindent">That underneath the burning Lion&rsquo;s breast</p>\n<p class="slindent">Now radiates downward mingled with his power.</p></div>\n\n<div class="stanza"><p>Fix in direction of thine eyes the mind,</p>\n<p class="slindent">And make of them a mirror for the figure</p>\n<p class="slindent">That in this mirror shall appear to thee.&rdquo;</p></div>\n\n<div class="stanza"><p>He who could know what was the pasturage</p>\n<p class="slindent">My sight had in that blessed countenance,</p>\n<p class="slindent">When I transferred me to another care,</p></div>\n\n<div class="stanza"><p>Would recognize how grateful was to me</p>\n<p class="slindent">Obedience unto my celestial escort,</p>\n<p class="slindent">By counterpoising one side with the other.</p></div>\n\n<div class="stanza"><p>Within the crystal which, around the world</p>\n<p class="slindent">Revolving, bears the name of its dear leader,</p>\n<p class="slindent">Under whom every wickedness lay dead,</p></div>\n\n<div class="stanza"><p>Coloured like gold, on which the sunshine gleams,</p>\n<p class="slindent">A stairway I beheld to such a height</p>\n<p class="slindent">Uplifted, that mine eye pursued it not.</p></div>\n\n<div class="stanza"><p>Likewise beheld I down the steps descending</p>\n<p class="slindent">So many splendours, that I thought each light</p>\n<p class="slindent">That in the heaven appears was there diffused.</p></div>\n\n<div class="stanza"><p>And as accordant with their natural custom</p>\n<p class="slindent">The rooks together at the break of day</p>\n<p class="slindent">Bestir themselves to warm their feathers cold;</p></div>\n\n<div class="stanza"><p>Then some of them fly off without return,</p>\n<p class="slindent">Others come back to where they started from,</p>\n<p class="slindent">And others, wheeling round, still keep at home;</p></div>\n\n<div class="stanza"><p>Such fashion it appeared to me was there</p>\n<p class="slindent">Within the sparkling that together came,</p>\n<p class="slindent">As soon as on a certain step it struck,</p></div>\n\n<div class="stanza"><p>And that which nearest unto us remained</p>\n<p class="slindent">Became so clear, that in my thought I said,</p>\n<p class="slindent">&ldquo;Well I perceive the love thou showest me;</p></div>\n\n<div class="stanza"><p>But she, from whom I wait the how and when</p>\n<p class="slindent">Of speech and silence, standeth still; whence I</p>\n<p class="slindent">Against desire do well if I ask not.&rdquo;</p></div>\n\n<div class="stanza"><p>She thereupon, who saw my silentness</p>\n<p class="slindent">In the sight of Him who seeth everything,</p>\n<p class="slindent">Said unto me, &ldquo;Let loose thy warm desire.&rdquo;</p></div>\n\n<div class="stanza"><p>And I began: &ldquo;No merit of my own</p>\n<p class="slindent">Renders me worthy of response from thee;</p>\n<p class="slindent">But for her sake who granteth me the asking,</p></div>\n\n<div class="stanza"><p>Thou blessed life that dost remain concealed</p>\n<p class="slindent">In thy beatitude, make known to me</p>\n<p class="slindent">The cause which draweth thee so near my side;</p></div>\n\n<div class="stanza"><p>And tell me why is silent in this wheel</p>\n<p class="slindent">The dulcet symphony of Paradise,</p>\n<p class="slindent">That through the rest below sounds so devoutly.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Thou hast thy hearing mortal as thy sight,&rdquo;</p>\n<p class="slindent">It answer made to me; &ldquo;they sing not here,</p>\n<p class="slindent">For the same cause that Beatrice has not smiled.</p></div>\n\n<div class="stanza"><p>Thus far adown the holy stairway&rsquo;s steps</p>\n<p class="slindent">Have I descended but to give thee welcome</p>\n<p class="slindent">With words, and with the light that mantles me;</p></div>\n\n<div class="stanza"><p>Nor did more love cause me to be more ready,</p>\n<p class="slindent">For love as much and more up there is burning,</p>\n<p class="slindent">As doth the flaming manifest to thee.</p></div>\n\n<div class="stanza"><p>But the high charity, that makes us servants</p>\n<p class="slindent">Prompt to the counsel which controls the world,</p>\n<p class="slindent">Allotteth here, even as thou dost observe.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;I see full well,&rdquo; said I, &ldquo;O sacred lamp!</p>\n<p class="slindent">How love unfettered in this court sufficeth</p>\n<p class="slindent">To follow the eternal Providence;</p></div>\n\n<div class="stanza"><p>But this is what seems hard for me to see,</p>\n<p class="slindent">Wherefore predestinate wast thou alone</p>\n<p class="slindent">Unto this office from among thy consorts.&rdquo;</p></div>\n\n<div class="stanza"><p>No sooner had I come to the last word,</p>\n<p class="slindent">Than of its middle made the light a centre,</p>\n<p class="slindent">Whirling itself about like a swift millstone.</p></div>\n\n<div class="stanza"><p>When answer made the love that was therein:</p>\n<p class="slindent">&ldquo;On me directed is a light divine,</p>\n<p class="slindent">Piercing through this in which I am embosomed,</p></div>\n\n<div class="stanza"><p>Of which the virtue with my sight conjoined</p>\n<p class="slindent">Lifts me above myself so far, I see</p>\n<p class="slindent">The supreme essence from which this is drawn.</p></div>\n\n<div class="stanza"><p>Hence comes the joyfulness with which I flame,</p>\n<p class="slindent">For to my sight, as far as it is clear,</p>\n<p class="slindent">The clearness of the flame I equal make.</p></div>\n\n<div class="stanza"><p>But that soul in the heaven which is most pure,</p>\n<p class="slindent">That seraph which his eye on God most fixes,</p>\n<p class="slindent">Could this demand of thine not satisfy;</p></div>\n\n<div class="stanza"><p>Because so deeply sinks in the abyss</p>\n<p class="slindent">Of the eternal statute what thou askest,</p>\n<p class="slindent">From all created sight it is cut off.</p></div>\n\n<div class="stanza"><p>And to the mortal world, when thou returnest,</p>\n<p class="slindent">This carry back, that it may not presume</p>\n<p class="slindent">Longer tow&rsquo;rd such a goal to move its feet.</p></div>\n\n<div class="stanza"><p>The mind, that shineth here, on earth doth smoke;</p>\n<p class="slindent">From this observe how can it do below</p>\n<p class="slindent">That which it cannot though the heaven assume it?&rdquo;</p></div>\n\n<div class="stanza"><p>Such limit did its words prescribe to me,</p>\n<p class="slindent">The question I relinquished, and restricted</p>\n<p class="slindent">Myself to ask it humbly who it was.</p></div>\n\n<div class="stanza"><p>&ldquo;Between two shores of Italy rise cliffs,</p>\n<p class="slindent">And not far distant from thy native place,</p>\n<p class="slindent">So high, the thunders far below them sound,</p></div>\n\n<div class="stanza"><p>And form a ridge that Catria is called,</p>\n<p class="slindent">&rsquo;Neath which is consecrate a hermitage</p>\n<p class="slindent">Wont to be dedicate to worship only.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus unto me the third speech recommenced,</p>\n<p class="slindent">And then, continuing, it said: &ldquo;Therein</p>\n<p class="slindent">Unto God&rsquo;s service I became so steadfast,</p></div>\n\n<div class="stanza"><p>That feeding only on the juice of olives</p>\n<p class="slindent">Lightly I passed away the heats and frosts,</p>\n<p class="slindent">Contented in my thoughts contemplative.</p></div>\n\n<div class="stanza"><p>That cloister used to render to these heavens</p>\n<p class="slindent">Abundantly, and now is empty grown,</p>\n<p class="slindent">So that perforce it soon must be revealed.</p></div>\n\n<div class="stanza"><p>I in that place was Peter Damiano;</p>\n<p class="slindent">And Peter the Sinner was I in the house</p>\n<p class="slindent">Of Our Lady on the Adriatic shore.</p></div>\n\n<div class="stanza"><p>Little of mortal life remained to me,</p>\n<p class="slindent">When I was called and dragged forth to the hat</p>\n<p class="slindent">Which shifteth evermore from bad to worse.</p></div>\n\n<div class="stanza"><p>Came Cephas, and the mighty Vessel came</p>\n<p class="slindent">Of the Holy Spirit, meagre and barefooted,</p>\n<p class="slindent">Taking the food of any hostelry.</p></div>\n\n<div class="stanza"><p>Now some one to support them on each side</p>\n<p class="slindent">The modern shepherds need, and some to lead them,</p>\n<p class="slindent">So heavy are they, and to hold their trains.</p></div>\n\n<div class="stanza"><p>They cover up their palfreys with their cloaks,</p>\n<p class="slindent">So that two beasts go underneath one skin;</p>\n<p class="slindent">O Patience, that dost tolerate so much!&rdquo;</p></div>\n\n<div class="stanza"><p>At this voice saw I many little flames</p>\n<p class="slindent">From step to step descending and revolving,</p>\n<p class="slindent">And every revolution made them fairer.</p></div>\n\n<div class="stanza"><p>Round about this one came they and stood still,</p>\n<p class="slindent">And a cry uttered of so loud a sound,</p>\n<p class="slindent">It here could find no parallel, nor I</p></div>\n\n<div class="stanza"><p>Distinguished it, the thunder so o&rsquo;ercame me.</p></div>','<p class="cantohead">Paradiso: Canto XXII</p>\n<div class="stanza"><p>Oppressed with stupor, I unto my guide</p>\n<p class="slindent">Turned like a little child who always runs</p>\n<p class="slindent">For refuge there where he confideth most;</p></div>\n\n<div class="stanza"><p>And she, even as a mother who straightway</p>\n<p class="slindent">Gives comfort to her pale and breathless boy</p>\n<p class="slindent">With voice whose wont it is to reassure him,</p></div>\n\n<div class="stanza"><p>Said to me: &ldquo;Knowest thou not thou art in heaven,</p>\n<p class="slindent">And knowest thou not that heaven is holy all</p>\n<p class="slindent">And what is done here cometh from good zeal?</p></div>\n\n<div class="stanza"><p>After what wise the singing would have changed thee</p>\n<p class="slindent">And I by smiling, thou canst now imagine,</p>\n<p class="slindent">Since that the cry has startled thee so much,</p></div>\n\n<div class="stanza"><p>In which if thou hadst understood its prayers</p>\n<p class="slindent">Already would be known to thee the vengeance</p>\n<p class="slindent">Which thou shalt look upon before thou diest.</p></div>\n\n<div class="stanza"><p>The sword above here smiteth not in haste</p>\n<p class="slindent">Nor tardily, howe&rsquo;er it seem to him</p>\n<p class="slindent">Who fearing or desiring waits for it.</p></div>\n\n<div class="stanza"><p>But turn thee round towards the others now,</p>\n<p class="slindent">For very illustrious spirits shalt thou see,</p>\n<p class="slindent">If thou thy sight directest as I say.&rdquo;</p></div>\n\n<div class="stanza"><p>As it seemed good to her mine eyes I turned,</p>\n<p class="slindent">And saw a hundred spherules that together</p>\n<p class="slindent">With mutual rays each other more embellished.</p></div>\n\n<div class="stanza"><p>I stood as one who in himself represses</p>\n<p class="slindent">The point of his desire, and ventures not</p>\n<p class="slindent">To question, he so feareth the too much.</p></div>\n\n<div class="stanza"><p>And now the largest and most luculent</p>\n<p class="slindent">Among those pearls came forward, that it might</p>\n<p class="slindent">Make my desire concerning it content.</p></div>\n\n<div class="stanza"><p>Within it then I heard: &ldquo;If thou couldst see</p>\n<p class="slindent">Even as myself the charity that burns</p>\n<p class="slindent">Among us, thy conceits would be expressed;</p></div>\n\n<div class="stanza"><p>But, that by waiting thou mayst not come late</p>\n<p class="slindent">To the high end, I will make answer even</p>\n<p class="slindent">Unto the thought of which thou art so chary.</p></div>\n\n<div class="stanza"><p>That mountain on whose slope Cassino stands</p>\n<p class="slindent">Was frequented of old upon its summit</p>\n<p class="slindent">By a deluded folk and ill-disposed;</p></div>\n\n<div class="stanza"><p>And I am he who first up thither bore</p>\n<p class="slindent">The name of Him who brought upon the earth</p>\n<p class="slindent">The truth that so much sublimateth us.</p></div>\n\n<div class="stanza"><p>And such abundant grace upon me shone</p>\n<p class="slindent">That all the neighbouring towns I drew away</p>\n<p class="slindent">From the impious worship that seduced the world.</p></div>\n\n<div class="stanza"><p>These other fires, each one of them, were men</p>\n<p class="slindent">Contemplative, enkindled by that heat</p>\n<p class="slindent">Which maketh holy flowers and fruits spring up.</p></div>\n\n<div class="stanza"><p>Here is Macarius, here is Romualdus,</p>\n<p class="slindent">Here are my brethren, who within the cloisters</p>\n<p class="slindent">Their footsteps stayed and kept a steadfast heart.&rdquo;</p></div>\n\n<div class="stanza"><p>And I to him: &ldquo;The affection which thou showest</p>\n<p class="slindent">Speaking with me, and the good countenance</p>\n<p class="slindent">Which I behold and note in all your ardours,</p></div>\n\n<div class="stanza"><p>In me have so my confidence dilated</p>\n<p class="slindent">As the sun doth the rose, when it becomes</p>\n<p class="slindent">As far unfolded as it hath the power.</p></div>\n\n<div class="stanza"><p>Therefore I pray, and thou assure me, father,</p>\n<p class="slindent">If I may so much grace receive, that I</p>\n<p class="slindent">May thee behold with countenance unveiled.&rdquo;</p></div>\n\n<div class="stanza"><p>He thereupon: &ldquo;Brother, thy high desire</p>\n<p class="slindent">In the remotest sphere shall be fulfilled,</p>\n<p class="slindent">Where are fulfilled all others and my own.</p></div>\n\n<div class="stanza"><p>There perfect is, and ripened, and complete,</p>\n<p class="slindent">Every desire; within that one alone</p>\n<p class="slindent">Is every part where it has always been;</p></div>\n\n<div class="stanza"><p>For it is not in space, nor turns on poles,</p>\n<p class="slindent">And unto it our stairway reaches up,</p>\n<p class="slindent">Whence thus from out thy sight it steals away.</p></div>\n\n<div class="stanza"><p>Up to that height the Patriarch Jacob saw it</p>\n<p class="slindent">Extending its supernal part, what time</p>\n<p class="slindent">So thronged with angels it appeared to him.</p></div>\n\n<div class="stanza"><p>But to ascend it now no one uplifts</p>\n<p class="slindent">His feet from off the earth, and now my Rule</p>\n<p class="slindent">Below remaineth for mere waste of paper.</p></div>\n\n<div class="stanza"><p>The walls that used of old to be an Abbey</p>\n<p class="slindent">Are changed to dens of robbers, and the cowls</p>\n<p class="slindent">Are sacks filled full of miserable flour.</p></div>\n\n<div class="stanza"><p>But heavy usury is not taken up</p>\n<p class="slindent">So much against God&rsquo;s pleasure as that fruit</p>\n<p class="slindent">Which maketh so insane the heart of monks;</p></div>\n\n<div class="stanza"><p>For whatsoever hath the Church in keeping</p>\n<p class="slindent">Is for the folk that ask it in God&rsquo;s name,</p>\n<p class="slindent">Not for one&rsquo;s kindred or for something worse.</p></div>\n\n<div class="stanza"><p>The flesh of mortals is so very soft,</p>\n<p class="slindent">That good beginnings down below suffice not</p>\n<p class="slindent">From springing of the oak to bearing acorns.</p></div>\n\n<div class="stanza"><p>Peter began with neither gold nor silver,</p>\n<p class="slindent">And I with orison and abstinence,</p>\n<p class="slindent">And Francis with humility his convent.</p></div>\n\n<div class="stanza"><p>And if thou lookest at each one&rsquo;s beginning,</p>\n<p class="slindent">And then regardest whither he has run,</p>\n<p class="slindent">Thou shalt behold the white changed into brown.</p></div>\n\n<div class="stanza"><p>In verity the Jordan backward turned,</p>\n<p class="slindent">And the sea&rsquo;s fleeing, when God willed were more</p>\n<p class="slindent">A wonder to behold, than succour here.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus unto me he said; and then withdrew</p>\n<p class="slindent">To his own band, and the band closed together;</p>\n<p class="slindent">Then like a whirlwind all was upward rapt.</p></div>\n\n<div class="stanza"><p>The gentle Lady urged me on behind them</p>\n<p class="slindent">Up o&rsquo;er that stairway by a single sign,</p>\n<p class="slindent">So did her virtue overcome my nature;</p></div>\n\n<div class="stanza"><p>Nor here below, where one goes up and down</p>\n<p class="slindent">By natural law, was motion e&rsquo;er so swift</p>\n<p class="slindent">That it could be compared unto my wing.</p></div>\n\n<div class="stanza"><p>Reader, as I may unto that devout</p>\n<p class="slindent">Triumph return, on whose account I often</p>\n<p class="slindent">For my transgressions weep and beat my breast,\u2014</p></div>\n\n<div class="stanza"><p>Thou hadst not thrust thy finger in the fire</p>\n<p class="slindent">And drawn it out again, before I saw</p>\n<p class="slindent">The sign that follows Taurus, and was in it.</p></div>\n\n<div class="stanza"><p>O glorious stars, O light impregnated</p>\n<p class="slindent">With mighty virtue, from which I acknowledge</p>\n<p class="slindent">All of my genius, whatsoe&rsquo;er it be,</p></div>\n\n<div class="stanza"><p>With you was born, and hid himself with you,</p>\n<p class="slindent">He who is father of all mortal life,</p>\n<p class="slindent">When first I tasted of the Tuscan air;</p></div>\n\n<div class="stanza"><p>And then when grace was freely given to me</p>\n<p class="slindent">To enter the high wheel which turns you round,</p>\n<p class="slindent">Your region was allotted unto me.</p></div>\n\n<div class="stanza"><p>To you devoutly at this hour my soul</p>\n<p class="slindent">Is sighing, that it virtue may acquire</p>\n<p class="slindent">For the stern pass that draws it to itself.</p></div>\n\n<div class="stanza"><p>&ldquo;Thou art so near unto the last salvation,&rdquo;</p>\n<p class="slindent">Thus Beatrice began, &ldquo;thou oughtest now</p>\n<p class="slindent">To have thine eves unclouded and acute;</p></div>\n\n<div class="stanza"><p>And therefore, ere thou enter farther in,</p>\n<p class="slindent">Look down once more, and see how vast a world</p>\n<p class="slindent">Thou hast already put beneath thy feet;</p></div>\n\n<div class="stanza"><p>So that thy heart, as jocund as it may,</p>\n<p class="slindent">Present itself to the triumphant throng</p>\n<p class="slindent">That comes rejoicing through this rounded ether.&rdquo;</p></div>\n\n<div class="stanza"><p>I with my sight returned through one and all</p>\n<p class="slindent">The sevenfold spheres, and I beheld this globe</p>\n<p class="slindent">Such that I smiled at its ignoble semblance;</p></div>\n\n<div class="stanza"><p>And that opinion I approve as best</p>\n<p class="slindent">Which doth account it least; and he who thinks</p>\n<p class="slindent">Of something else may truly be called just.</p></div>\n\n<div class="stanza"><p>I saw the daughter of Latona shining</p>\n<p class="slindent">Without that shadow, which to me was cause</p>\n<p class="slindent">That once I had believed her rare and dense.</p></div>\n\n<div class="stanza"><p>The aspect of thy son, Hyperion,</p>\n<p class="slindent">Here I sustained, and saw how move themselves</p>\n<p class="slindent">Around and near him Maia and Dione.</p></div>\n\n<div class="stanza"><p>Thence there appeared the temperateness of Jove</p>\n<p class="slindent">&rsquo;Twixt son and father, and to me was clear</p>\n<p class="slindent">The change that of their whereabout they make;</p></div>\n\n<div class="stanza"><p>And all the seven made manifest to me</p>\n<p class="slindent">How great they are, and eke how swift they are,</p>\n<p class="slindent">And how they are in distant habitations.</p></div>\n\n<div class="stanza"><p>The threshing-floor that maketh us so proud,</p>\n<p class="slindent">To me revolving with the eternal Twins,</p>\n<p class="slindent">Was all apparent made from hill to harbour!</p></div>\n\n<div class="stanza"><p>Then to the beauteous eyes mine eyes I turned.</p></div>','<p class="cantohead">Paradiso: Canto XXIII</p>\n<div class="stanza"><p>Even as a bird, &rsquo;mid the beloved leaves,</p>\n<p class="slindent">Quiet upon the nest of her sweet brood</p>\n<p class="slindent">Throughout the night, that hideth all things from us,</p></div>\n\n<div class="stanza"><p>Who, that she may behold their longed-for looks</p>\n<p class="slindent">And find the food wherewith to nourish them,</p>\n<p class="slindent">In which, to her, grave labours grateful are,</p></div>\n\n<div class="stanza"><p>Anticipates the time on open spray</p>\n<p class="slindent">And with an ardent longing waits the sun,</p>\n<p class="slindent">Gazing intent as soon as breaks the dawn:</p></div>\n\n<div class="stanza"><p>Even thus my Lady standing was, erect</p>\n<p class="slindent">And vigilant, turned round towards the zone</p>\n<p class="slindent">Underneath which the sun displays less haste;</p></div>\n\n<div class="stanza"><p>So that beholding her distraught and wistful,</p>\n<p class="slindent">Such I became as he is who desiring</p>\n<p class="slindent">For something yearns, and hoping is appeased.</p></div>\n\n<div class="stanza"><p>But brief the space from one When to the other;</p>\n<p class="slindent">Of my awaiting, say I, and the seeing</p>\n<p class="slindent">The welkin grow resplendent more and more.</p></div>\n\n<div class="stanza"><p>And Beatrice exclaimed: &ldquo;Behold the hosts</p>\n<p class="slindent">Of Christ&rsquo;s triumphal march, and all the fruit</p>\n<p class="slindent">Harvested by the rolling of these spheres!&rdquo;</p></div>\n\n<div class="stanza"><p>It seemed to me her face was all aflame;</p>\n<p class="slindent">And eyes she had so full of ecstasy</p>\n<p class="slindent">That I must needs pass on without describing.</p></div>\n\n<div class="stanza"><p>As when in nights serene of the full moon</p>\n<p class="slindent">Smiles Trivia among the nymphs eternal</p>\n<p class="slindent">Who paint the firmament through all its gulfs,</p></div>\n\n<div class="stanza"><p>Saw I, above the myriads of lamps,</p>\n<p class="slindent">A Sun that one and all of them enkindled,</p>\n<p class="slindent">E&rsquo;en as our own doth the supernal sights,</p></div>\n\n<div class="stanza"><p>And through the living light transparent shone</p>\n<p class="slindent">The lucent substance so intensely clear</p>\n<p class="slindent">Into my sight, that I sustained it not.</p></div>\n\n<div class="stanza"><p>O Beatrice, thou gentle guide and dear!</p>\n<p class="slindent">To me she said: &ldquo;What overmasters thee</p>\n<p class="slindent">A virtue is from which naught shields itself.</p></div>\n\n<div class="stanza"><p>There are the wisdom and the omnipotence</p>\n<p class="slindent">That oped the thoroughfares &rsquo;twixt heaven and earth,</p>\n<p class="slindent">For which there erst had been so long a yearning.&rdquo;</p></div>\n\n<div class="stanza"><p>As fire from out a cloud unlocks itself,</p>\n<p class="slindent">Dilating so it finds not room therein,</p>\n<p class="slindent">And down, against its nature, falls to earth,</p></div>\n\n<div class="stanza"><p>So did my mind, among those aliments</p>\n<p class="slindent">Becoming larger, issue from itself,</p>\n<p class="slindent">And that which it became cannot remember.</p></div>\n\n<div class="stanza"><p>&ldquo;Open thine eyes, and look at what I am:</p>\n<p class="slindent">Thou hast beheld such things, that strong enough</p>\n<p class="slindent">Hast thou become to tolerate my smile.&rdquo;</p></div>\n\n<div class="stanza"><p>I was as one who still retains the feeling</p>\n<p class="slindent">Of a forgotten vision, and endeavours</p>\n<p class="slindent">In vain to bring it back into his mind,</p></div>\n\n<div class="stanza"><p>When I this invitation heard, deserving</p>\n<p class="slindent">Of so much gratitude, it never fades</p>\n<p class="slindent">Out of the book that chronicles the past.</p></div>\n\n<div class="stanza"><p>If at this moment sounded all the tongues</p>\n<p class="slindent">That Polyhymnia and her sisters made</p>\n<p class="slindent">Most lubrical with their delicious milk,</p></div>\n\n<div class="stanza"><p>To aid me, to a thousandth of the truth</p>\n<p class="slindent">It would not reach, singing the holy smile</p>\n<p class="slindent">And how the holy aspect it illumed.</p></div>\n\n<div class="stanza"><p>And therefore, representing Paradise,</p>\n<p class="slindent">The sacred poem must perforce leap over,</p>\n<p class="slindent">Even as a man who finds his way cut off;</p></div>\n\n<div class="stanza"><p>But whoso thinketh of the ponderous theme,</p>\n<p class="slindent">And of the mortal shoulder laden with it,</p>\n<p class="slindent">Should blame it not, if under this it tremble.</p></div>\n\n<div class="stanza"><p>It is no passage for a little boat</p>\n<p class="slindent">This which goes cleaving the audacious prow,</p>\n<p class="slindent">Nor for a pilot who would spare himself.</p></div>\n\n<div class="stanza"><p>&ldquo;Why doth my face so much enamour thee,</p>\n<p class="slindent">That to the garden fair thou turnest not,</p>\n<p class="slindent">Which under the rays of Christ is blossoming?</p></div>\n\n<div class="stanza"><p>There is the Rose in which the Word Divine</p>\n<p class="slindent">Became incarnate; there the lilies are</p>\n<p class="slindent">By whose perfume the good way was discovered.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus Beatrice; and I, who to her counsels</p>\n<p class="slindent">Was wholly ready, once again betook me</p>\n<p class="slindent">Unto the battle of the feeble brows.</p></div>\n\n<div class="stanza"><p>As in the sunshine, that unsullied streams</p>\n<p class="slindent">Through fractured cloud, ere now a meadow of flowers</p>\n<p class="slindent">Mine eyes with shadow covered o&rsquo;er have seen,</p></div>\n\n<div class="stanza"><p>So troops of splendours manifold I saw</p>\n<p class="slindent">Illumined from above with burning rays,</p>\n<p class="slindent">Beholding not the source of the effulgence.</p></div>\n\n<div class="stanza"><p>O power benignant that dost so imprint them!</p>\n<p class="slindent">Thou didst exalt thyself to give more scope</p>\n<p class="slindent">There to mine eyes, that were not strong enough.</p></div>\n\n<div class="stanza"><p>The name of that fair flower I e&rsquo;er invoke</p>\n<p class="slindent">Morning and evening utterly enthralled</p>\n<p class="slindent">My soul to gaze upon the greater fire.</p></div>\n\n<div class="stanza"><p>And when in both mine eyes depicted were</p>\n<p class="slindent">The glory and greatness of the living star</p>\n<p class="slindent">Which there excelleth, as it here excelled,</p></div>\n\n<div class="stanza"><p>Athwart the heavens a little torch descended</p>\n<p class="slindent">Formed in a circle like a coronal,</p>\n<p class="slindent">And cinctured it, and whirled itself about it.</p></div>\n\n<div class="stanza"><p>Whatever melody most sweetly soundeth</p>\n<p class="slindent">On earth, and to itself most draws the soul,</p>\n<p class="slindent">Would seem a cloud that, rent asunder, thunders,</p></div>\n\n<div class="stanza"><p>Compared unto the sounding of that lyre</p>\n<p class="slindent">Wherewith was crowned the sapphire beautiful,</p>\n<p class="slindent">Which gives the clearest heaven its sapphire hue.</p></div>\n\n<div class="stanza"><p>&ldquo;I am Angelic Love, that circle round</p>\n<p class="slindent">The joy sublime which breathes from out the womb</p>\n<p class="slindent">That was the hostelry of our Desire;</p></div>\n\n<div class="stanza"><p>And I shall circle, Lady of Heaven, while</p>\n<p class="slindent">Thou followest thy Son, and mak&rsquo;st diviner</p>\n<p class="slindent">The sphere supreme, because thou enterest there.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus did the circulated melody</p>\n<p class="slindent">Seal itself up; and all the other lights</p>\n<p class="slindent">Were making to resound the name of Mary.</p></div>\n\n<div class="stanza"><p>The regal mantle of the volumes all</p>\n<p class="slindent">Of that world, which most fervid is and living</p>\n<p class="slindent">With breath of God and with his works and ways,</p></div>\n\n<div class="stanza"><p>Extended over us its inner border,</p>\n<p class="slindent">So very distant, that the semblance of it</p>\n<p class="slindent">There where I was not yet appeared to me.</p></div>\n\n<div class="stanza"><p>Therefore mine eyes did not possess the power</p>\n<p class="slindent">Of following the incoronated flame,</p>\n<p class="slindent">Which mounted upward near to its own seed.</p></div>\n\n<div class="stanza"><p>And as a little child, that towards its mother</p>\n<p class="slindent">Stretches its arms, when it the milk has taken,</p>\n<p class="slindent">Through impulse kindled into outward flame,</p></div>\n\n<div class="stanza"><p>Each of those gleams of whiteness upward reached</p>\n<p class="slindent">So with its summit, that the deep affection</p>\n<p class="slindent">They had for Mary was revealed to me.</p></div>\n\n<div class="stanza"><p>Thereafter they remained there in my sight,</p>\n<p class="slindent">&lsquo;Regina coeli&rsquo; singing with such sweetness,</p>\n<p class="slindent">That ne&rsquo;er from me has the delight departed.</p></div>\n\n<div class="stanza"><p>O, what exuberance is garnered up</p>\n<p class="slindent">Within those richest coffers, which had been</p>\n<p class="slindent">Good husbandmen for sowing here below!</p></div>\n\n<div class="stanza"><p>There they enjoy and live upon the treasure</p>\n<p class="slindent">Which was acquired while weeping in the exile</p>\n<p class="slindent">Of Babylon, wherein the gold was left.</p></div>\n\n<div class="stanza"><p>There triumpheth, beneath the exalted Son</p>\n<p class="slindent">Of God and Mary, in his victory,</p>\n<p class="slindent">Both with the ancient council and the new,</p></div>\n\n<div class="stanza"><p>He who doth keep the keys of such a glory.</p></div>','<p class="cantohead">Paradiso: Canto XXIV</p>\n<div class="stanza"><p>&ldquo;O company elect to the great supper</p>\n<p class="slindent">Of the Lamb benedight, who feedeth you</p>\n<p class="slindent">So that for ever full is your desire,</p></div>\n\n<div class="stanza"><p>If by the grace of God this man foretaste</p>\n<p class="slindent">Something of that which falleth from your table,</p>\n<p class="slindent">Or ever death prescribe to him the time,</p></div>\n\n<div class="stanza"><p>Direct your mind to his immense desire,</p>\n<p class="slindent">And him somewhat bedew; ye drinking are</p>\n<p class="slindent">For ever at the fount whence comes his thought.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus Beatrice; and those souls beatified</p>\n<p class="slindent">Transformed themselves to spheres on steadfast poles,</p>\n<p class="slindent">Flaming intensely in the guise of comets.</p></div>\n\n<div class="stanza"><p>And as the wheels in works of horologes</p>\n<p class="slindent">Revolve so that the first to the beholder</p>\n<p class="slindent">Motionless seems, and the last one to fly,</p></div>\n\n<div class="stanza"><p>So in like manner did those carols, dancing</p>\n<p class="slindent">In different measure, of their affluence</p>\n<p class="slindent">Give me the gauge, as they were swift or slow.</p></div>\n\n<div class="stanza"><p>From that one which I noted of most beauty</p>\n<p class="slindent">Beheld I issue forth a fire so happy</p>\n<p class="slindent">That none it left there of a greater brightness;</p></div>\n\n<div class="stanza"><p>And around Beatrice three several times</p>\n<p class="slindent">It whirled itself with so divine a song,</p>\n<p class="slindent">My fantasy repeats it not to me;</p></div>\n\n<div class="stanza"><p>Therefore the pen skips, and I write it not,</p>\n<p class="slindent">Since our imagination for such folds,</p>\n<p class="slindent">Much more our speech, is of a tint too glaring.</p></div>\n\n<div class="stanza"><p>&ldquo;O holy sister mine, who us implorest</p>\n<p class="slindent">With such devotion, by thine ardent love</p>\n<p class="slindent">Thou dost unbind me from that beautiful sphere!&rdquo;</p></div>\n\n<div class="stanza"><p>Thereafter, having stopped, the blessed fire</p>\n<p class="slindent">Unto my Lady did direct its breath,</p>\n<p class="slindent">Which spake in fashion as I here have said.</p></div>\n\n<div class="stanza"><p>And she: &ldquo;O light eterne of the great man</p>\n<p class="slindent">To whom our Lord delivered up the keys</p>\n<p class="slindent">He carried down of this miraculous joy,</p></div>\n\n<div class="stanza"><p>This one examine on points light and grave,</p>\n<p class="slindent">As good beseemeth thee, about the Faith</p>\n<p class="slindent">By means of which thou on the sea didst walk.</p></div>\n\n<div class="stanza"><p>If he love well, and hope well, and believe,</p>\n<p class="slindent">From thee &rsquo;tis hid not; for thou hast thy sight</p>\n<p class="slindent">There where depicted everything is seen.</p></div>\n\n<div class="stanza"><p>But since this kingdom has made citizens</p>\n<p class="slindent">By means of the true Faith, to glorify it</p>\n<p class="slindent">&rsquo;Tis well he have the chance to speak thereof.&rdquo;</p></div>\n\n<div class="stanza"><p>As baccalaureate arms himself, and speaks not</p>\n<p class="slindent">Until the master doth propose the question,</p>\n<p class="slindent">To argue it, and not to terminate it,</p></div>\n\n<div class="stanza"><p>So did I arm myself with every reason,</p>\n<p class="slindent">While she was speaking, that I might be ready</p>\n<p class="slindent">For such a questioner and such profession.</p></div>\n\n<div class="stanza"><p>&ldquo;Say, thou good Christian; manifest thyself;</p>\n<p class="slindent">What is the Faith?&rdquo;  Whereat I raised my brow</p>\n<p class="slindent">Unto that light wherefrom was this breathed forth.</p></div>\n\n<div class="stanza"><p>Then turned I round to Beatrice, and she</p>\n<p class="slindent">Prompt signals made to me that I should pour</p>\n<p class="slindent">The water forth from my internal fountain.</p></div>\n\n<div class="stanza"><p>&ldquo;May grace, that suffers me to make confession,&rdquo;</p>\n<p class="slindent">Began I, &ldquo;to the great centurion,</p>\n<p class="slindent">Cause my conceptions all to be explicit!&rdquo;</p></div>\n\n<div class="stanza"><p>And I continued: &ldquo;As the truthful pen,</p>\n<p class="slindent">Father, of thy dear brother wrote of it,</p>\n<p class="slindent">Who put with thee Rome into the good way,</p></div>\n\n<div class="stanza"><p>Faith is the substance of the things we hope for,</p>\n<p class="slindent">And evidence of those that are not seen;</p>\n<p class="slindent">And this appears to me its quiddity.&rdquo;</p></div>\n\n<div class="stanza"><p>Then heard I: &ldquo;Very rightly thou perceivest,</p>\n<p class="slindent">If well thou understandest why he placed it</p>\n<p class="slindent">With substances and then with evidences.&rdquo;</p></div>\n\n<div class="stanza"><p>And I thereafterward: &ldquo;The things profound,</p>\n<p class="slindent">That here vouchsafe to me their apparition,</p>\n<p class="slindent">Unto all eyes below are so concealed,</p></div>\n\n<div class="stanza"><p>That they exist there only in belief,</p>\n<p class="slindent">Upon the which is founded the high hope,</p>\n<p class="slindent">And hence it takes the nature of a substance.</p></div>\n\n<div class="stanza"><p>And it behoveth us from this belief</p>\n<p class="slindent">To reason without having other sight,</p>\n<p class="slindent">And hence it has the nature of evidence.&rdquo;</p></div>\n\n<div class="stanza"><p>Then heard I: &ldquo;If whatever is acquired</p>\n<p class="slindent">Below by doctrine were thus understood,</p>\n<p class="slindent">No sophist&rsquo;s subtlety would there find place.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus was breathed forth from that enkindled love;</p>\n<p class="slindent">Then added: &ldquo;Very well has been gone over</p>\n<p class="slindent">Already of this coin the alloy and weight;</p></div>\n\n<div class="stanza"><p>But tell me if thou hast it in thy purse?&rdquo;</p>\n<p class="slindent">And I: &ldquo;Yes, both so shining and so round</p>\n<p class="slindent">That in its stamp there is no peradventure.&rdquo;</p></div>\n\n<div class="stanza"><p>Thereafter issued from the light profound</p>\n<p class="slindent">That there resplendent was: &ldquo;This precious jewel,</p>\n<p class="slindent">Upon the which is every virtue founded,</p></div>\n\n<div class="stanza"><p>Whence hadst thou it?&rdquo;  And I: &ldquo;The large outpouring</p>\n<p class="slindent">Of Holy Spirit, which has been diffused</p>\n<p class="slindent">Upon the ancient parchments and the new,</p></div>\n\n<div class="stanza"><p>A syllogism is, which proved it to me</p>\n<p class="slindent">With such acuteness, that, compared therewith,</p>\n<p class="slindent">All demonstration seems to me obtuse.&rdquo;</p></div>\n\n<div class="stanza"><p>And then I heard: &ldquo;The ancient and the new</p>\n<p class="slindent">Postulates, that to thee are so conclusive,</p>\n<p class="slindent">Why dost thou take them for the word divine?&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;The proofs, which show the truth to me,</p>\n<p class="slindent">Are the works subsequent, whereunto Nature</p>\n<p class="slindent">Ne&rsquo;er heated iron yet, nor anvil beat.&rdquo;</p></div>\n\n<div class="stanza"><p>&rsquo;Twas answered me: &ldquo;Say, who assureth thee</p>\n<p class="slindent">That those works ever were? the thing itself</p>\n<p class="slindent">That must be proved, nought else to thee affirms it.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Were the world to Christianity converted,&rdquo;</p>\n<p class="slindent">I said, &ldquo;withouten miracles, this one</p>\n<p class="slindent">Is such, the rest are not its hundredth part;</p></div>\n\n<div class="stanza"><p>Because that poor and fasting thou didst enter</p>\n<p class="slindent">Into the field to sow there the good plant,</p>\n<p class="slindent">Which was a vine and has become a thorn!&rdquo;</p></div>\n\n<div class="stanza"><p>This being finished, the high, holy Court</p>\n<p class="slindent">Resounded through the spheres, &ldquo;One God we praise!&rdquo;</p>\n<p class="slindent">In melody that there above is chanted.</p></div>\n\n<div class="stanza"><p>And then that Baron, who from branch to branch,</p>\n<p class="slindent">Examining, had thus conducted me,</p>\n<p class="slindent">Till the extremest leaves we were approaching,</p></div>\n\n<div class="stanza"><p>Again began: &ldquo;The Grace that dallying</p>\n<p class="slindent">Plays with thine intellect thy mouth has opened,</p>\n<p class="slindent">Up to this point, as it should opened be,</p></div>\n\n<div class="stanza"><p>So that I do approve what forth emerged;</p>\n<p class="slindent">But now thou must express what thou believest,</p>\n<p class="slindent">And whence to thy belief it was presented.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O holy father, spirit who beholdest</p>\n<p class="slindent">What thou believedst so that thou o&rsquo;ercamest,</p>\n<p class="slindent">Towards the sepulchre, more youthful feet,&rdquo;</p></div>\n\n<div class="stanza"><p>Began I, &ldquo;thou dost wish me in this place</p>\n<p class="slindent">The form to manifest of my prompt belief,</p>\n<p class="slindent">And likewise thou the cause thereof demandest.</p></div>\n\n<div class="stanza"><p>And I respond: In one God I believe,</p>\n<p class="slindent">Sole and eterne, who moveth all the heavens</p>\n<p class="slindent">With love and with desire, himself unmoved;</p></div>\n\n<div class="stanza"><p>And of such faith not only have I proofs</p>\n<p class="slindent">Physical and metaphysical, but gives them</p>\n<p class="slindent">Likewise the truth that from this place rains down</p></div>\n\n<div class="stanza"><p>Through Moses, through the Prophets and the Psalms,</p>\n<p class="slindent">Through the Evangel, and through you, who wrote</p>\n<p class="slindent">After the fiery Spirit sanctified you;</p></div>\n\n<div class="stanza"><p>In Persons three eterne believe, and these</p>\n<p class="slindent">One essence I believe, so one and trine</p>\n<p class="slindent">They bear conjunction both with &lsquo;sunt&rsquo; and &lsquo;est.&rsquo;</p></div>\n\n<div class="stanza"><p>With the profound condition and divine</p>\n<p class="slindent">Which now I touch upon, doth stamp my mind</p>\n<p class="slindent">Ofttimes the doctrine evangelical.</p></div>\n\n<div class="stanza"><p>This the beginning is, this is the spark</p>\n<p class="slindent">Which afterwards dilates to vivid flame,</p>\n<p class="slindent">And, like a star in heaven, is sparkling in me.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as a lord who hears what pleaseth him</p>\n<p class="slindent">His servant straight embraces, gratulating</p>\n<p class="slindent">For the good news as soon as he is silent;</p></div>\n\n<div class="stanza"><p>So, giving me its benediction, singing,</p>\n<p class="slindent">Three times encircled me, when I was silent,</p>\n<p class="slindent">The apostolic light, at whose command</p></div>\n\n<div class="stanza"><p>I spoken had, in speaking I so pleased him.</p></div>','<p class="cantohead">Paradiso: Canto XXV</p>\n<div class="stanza"><p>If e&rsquo;er it happen that the Poem Sacred,</p>\n<p class="slindent">To which both heaven and earth have set their hand,</p>\n<p class="slindent">So that it many a year hath made me lean,</p></div>\n\n<div class="stanza"><p>O&rsquo;ercome the cruelty that bars me out</p>\n<p class="slindent">From the fair sheepfold, where a lamb I slumbered,</p>\n<p class="slindent">An enemy to the wolves that war upon it,</p></div>\n\n<div class="stanza"><p>With other voice forthwith, with other fleece</p>\n<p class="slindent">Poet will I return, and at my font</p>\n<p class="slindent">Baptismal will I take the laurel crown;</p></div>\n\n<div class="stanza"><p>Because into the Faith that maketh known</p>\n<p class="slindent">All souls to God there entered I, and then</p>\n<p class="slindent">Peter for her sake thus my brow encircled.</p></div>\n\n<div class="stanza"><p>Thereafterward towards us moved a light</p>\n<p class="slindent">Out of that band whence issued the first-fruits</p>\n<p class="slindent">Which of his vicars Christ behind him left,</p></div>\n\n<div class="stanza"><p>And then my Lady, full of ecstasy,</p>\n<p class="slindent">Said unto me: &ldquo;Look, look! behold the Baron</p>\n<p class="slindent">For whom below Galicia is frequented.&rdquo;</p></div>\n\n<div class="stanza"><p>In the same way as, when a dove alights</p>\n<p class="slindent">Near his companion, both of them pour forth,</p>\n<p class="slindent">Circling about and murmuring, their affection,</p></div>\n\n<div class="stanza"><p>So one beheld I by the other grand</p>\n<p class="slindent">Prince glorified to be with welcome greeted,</p>\n<p class="slindent">Lauding the food that there above is eaten.</p></div>\n\n<div class="stanza"><p>But when their gratulations were complete,</p>\n<p class="slindent">Silently &lsquo;coram me&rsquo; each one stood still,</p>\n<p class="slindent">So incandescent it o&rsquo;ercame my sight.</p></div>\n\n<div class="stanza"><p>Smiling thereafterwards, said Beatrice:</p>\n<p class="slindent">&ldquo;Illustrious life, by whom the benefactions</p>\n<p class="slindent">Of our Basilica have been described,</p></div>\n\n<div class="stanza"><p>Make Hope resound within this altitude;</p>\n<p class="slindent">Thou knowest as oft thou dost personify it</p>\n<p class="slindent">As Jesus to the three gave greater clearness.&rdquo;&mdash;</p></div>\n\n<div class="stanza"><p>&ldquo;Lift up thy head, and make thyself assured;</p>\n<p class="slindent">For what comes hither from the mortal world</p>\n<p class="slindent">Must needs be ripened in our radiance.&rdquo;</p></div>\n\n<div class="stanza"><p>This comfort came to me from the second fire;</p>\n<p class="slindent">Wherefore mine eyes I lifted to the hills,</p>\n<p class="slindent">Which bent them down before with too great weight.</p></div>\n\n<div class="stanza"><p>&ldquo;Since, through his grace, our Emperor wills that thou</p>\n<p class="slindent">Shouldst find thee face to face, before thy death,</p>\n<p class="slindent">In the most secret chamber, with his Counts,</p></div>\n\n<div class="stanza"><p>So that, the truth beholden of this court,</p>\n<p class="slindent">Hope, which below there rightfully enamours,</p>\n<p class="slindent">Thereby thou strengthen in thyself and others,</p></div>\n\n<div class="stanza"><p>Say what it is, and how is flowering with it</p>\n<p class="slindent">Thy mind, and say from whence it came to thee.&rdquo;</p>\n<p class="slindent">Thus did the second light again continue.</p></div>\n\n<div class="stanza"><p>And the Compassionate, who piloted</p>\n<p class="slindent">The plumage of my wings in such high flight,</p>\n<p class="slindent">Did in reply anticipate me thus:</p></div>\n\n<div class="stanza"><p>&ldquo;No child whatever the Church Militant</p>\n<p class="slindent">Of greater hope possesses, as is written</p>\n<p class="slindent">In that Sun which irradiates all our band;</p></div>\n\n<div class="stanza"><p>Therefore it is conceded him from Egypt</p>\n<p class="slindent">To come into Jerusalem to see,</p>\n<p class="slindent">Or ever yet his warfare be completed.</p></div>\n\n<div class="stanza"><p>The two remaining points, that not for knowledge</p>\n<p class="slindent">Have been demanded, but that he report</p>\n<p class="slindent">How much this virtue unto thee is pleasing,</p></div>\n\n<div class="stanza"><p>To him I leave; for hard he will not find them,</p>\n<p class="slindent">Nor of self-praise; and let him answer them;</p>\n<p class="slindent">And may the grace of God in this assist him!&rdquo;</p></div>\n\n<div class="stanza"><p>As a disciple, who his teacher follows,</p>\n<p class="slindent">Ready and willing, where he is expert,</p>\n<p class="slindent">That his proficiency may be displayed,</p></div>\n\n<div class="stanza"><p>&ldquo;Hope,&rdquo; said I, &ldquo;is the certain expectation</p>\n<p class="slindent">Of future glory, which is the effect</p>\n<p class="slindent">Of grace divine and merit precedent.</p></div>\n\n<div class="stanza"><p>From many stars this light comes unto me;</p>\n<p class="slindent">But he instilled it first into my heart</p>\n<p class="slindent">Who was chief singer unto the chief captain.</p></div>\n\n<div class="stanza"><p>&lsquo;Sperent in te,&rsquo; in the high Theody</p>\n<p class="slindent">He sayeth, &rsquo;those who know thy name;&rsquo; and who</p>\n<p class="slindent">Knoweth it not, if he my faith possess?</p></div>\n\n<div class="stanza"><p>Thou didst instil me, then, with his instilling</p>\n<p class="slindent">In the Epistle, so that I am full,</p>\n<p class="slindent">And upon others rain again your rain.&rdquo;</p></div>\n\n<div class="stanza"><p>While I was speaking, in the living bosom</p>\n<p class="slindent">Of that combustion quivered an effulgence,</p>\n<p class="slindent">Sudden and frequent, in the guise of lightning;</p></div>\n\n<div class="stanza"><p>Then breathed: &ldquo;The love wherewith I am inflamed</p>\n<p class="slindent">Towards the virtue still which followed me</p>\n<p class="slindent">Unto the palm and issue of the field,</p></div>\n\n<div class="stanza"><p>Wills that I breathe to thee that thou delight</p>\n<p class="slindent">In her; and grateful to me is thy telling</p>\n<p class="slindent">Whatever things Hope promises to thee.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;The ancient Scriptures and the new</p>\n<p class="slindent">The mark establish, and this shows it me,</p>\n<p class="slindent">Of all the souls whom God hath made his friends.</p></div>\n\n<div class="stanza"><p>Isaiah saith, that each one garmented</p>\n<p class="slindent">In his own land shall be with twofold garments,</p>\n<p class="slindent">And his own land is this delightful life.</p></div>\n\n<div class="stanza"><p>Thy brother, too, far more explicitly,</p>\n<p class="slindent">There where he treateth of the robes of white,</p>\n<p class="slindent">This revelation manifests to us.&rdquo;</p></div>\n\n<div class="stanza"><p>And first, and near the ending of these words,</p>\n<p class="slindent">&ldquo;Sperent in te&rdquo; from over us was heard,</p>\n<p class="slindent">To which responsive answered all the carols.</p></div>\n\n<div class="stanza"><p>Thereafterward a light among them brightened,</p>\n<p class="slindent">So that, if Cancer one such crystal had,</p>\n<p class="slindent">Winter would have a month of one sole day.</p></div>\n\n<div class="stanza"><p>And as uprises, goes, and enters the dance</p>\n<p class="slindent">A winsome maiden, only to do honour</p>\n<p class="slindent">To the new bride, and not from any failing,</p></div>\n\n<div class="stanza"><p>Even thus did I behold the brightened splendour</p>\n<p class="slindent">Approach the two, who in a wheel revolved</p>\n<p class="slindent">As was beseeming to their ardent love.</p></div>\n\n<div class="stanza"><p>Into the song and music there it entered;</p>\n<p class="slindent">And fixed on them my Lady kept her look,</p>\n<p class="slindent">Even as a bride silent and motionless.</p></div>\n\n<div class="stanza"><p>&ldquo;This is the one who lay upon the breast</p>\n<p class="slindent">Of him our Pelican; and this is he</p>\n<p class="slindent">To the great office from the cross elected.&rdquo;</p></div>\n\n<div class="stanza"><p>My Lady thus; but therefore none the more</p>\n<p class="slindent">Did move her sight from its attentive gaze</p>\n<p class="slindent">Before or afterward these words of hers.</p></div>\n\n<div class="stanza"><p>Even as a man who gazes, and endeavours</p>\n<p class="slindent">To see the eclipsing of the sun a little,</p>\n<p class="slindent">And who, by seeing, sightless doth become,</p></div>\n\n<div class="stanza"><p>So I became before that latest fire,</p>\n<p class="slindent">While it was said, &ldquo;Why dost thou daze thyself</p>\n<p class="slindent">To see a thing which here hath no existence?</p></div>\n\n<div class="stanza"><p>Earth in the earth my body is, and shall be</p>\n<p class="slindent">With all the others there, until our number</p>\n<p class="slindent">With the eternal proposition tallies.</p></div>\n\n<div class="stanza"><p>With the two garments in the blessed cloister</p>\n<p class="slindent">Are the two lights alone that have ascended:</p>\n<p class="slindent">And this shalt thou take back into your world.&rdquo;</p></div>\n\n<div class="stanza"><p>And at this utterance the flaming circle</p>\n<p class="slindent">Grew quiet, with the dulcet intermingling</p>\n<p class="slindent">Of sound that by the trinal breath was made,</p></div>\n\n<div class="stanza"><p>As to escape from danger or fatigue</p>\n<p class="slindent">The oars that erst were in the water beaten</p>\n<p class="slindent">Are all suspended at a whistle&rsquo;s sound.</p></div>\n\n<div class="stanza"><p>Ah, how much in my mind was I disturbed,</p>\n<p class="slindent">When I turned round to look on Beatrice,</p>\n<p class="slindent">That her I could not see, although I was</p></div>\n\n<div class="stanza"><p>Close at her side and in the Happy World!</p></div>','<p class="cantohead">Paradiso: Canto XXVI</p>\n<div class="stanza"><p>While I was doubting for my vision quenched,</p>\n<p class="slindent">Out of the flame refulgent that had quenched it</p>\n<p class="slindent">Issued a breathing, that attentive made me,</p></div>\n\n<div class="stanza"><p>Saying: &ldquo;While thou recoverest the sense</p>\n<p class="slindent">Of seeing which in me thou hast consumed,</p>\n<p class="slindent">&rsquo;Tis well that speaking thou shouldst compensate it.</p></div>\n\n<div class="stanza"><p>Begin then, and declare to what thy soul</p>\n<p class="slindent">Is aimed, and count it for a certainty,</p>\n<p class="slindent">Sight is in thee bewildered and not dead;</p></div>\n\n<div class="stanza"><p>Because the Lady, who through this divine</p>\n<p class="slindent">Region conducteth thee, has in her look</p>\n<p class="slindent">The power the hand of Ananias had.&rdquo;</p></div>\n\n<div class="stanza"><p>I said: &ldquo;As pleaseth her, or soon or late</p>\n<p class="slindent">Let the cure come to eyes that portals were</p>\n<p class="slindent">When she with fire I ever burn with entered.</p></div>\n\n<div class="stanza"><p>The Good, that gives contentment to this Court,</p>\n<p class="slindent">The Alpha and Omega is of all</p>\n<p class="slindent">The writing that love reads me low or loud.&rdquo;</p></div>\n\n<div class="stanza"><p>The selfsame voice, that taken had from me</p>\n<p class="slindent">The terror of the sudden dazzlement,</p>\n<p class="slindent">To speak still farther put it in my thought;</p></div>\n\n<div class="stanza"><p>And said: &ldquo;In verity with finer sieve</p>\n<p class="slindent">Behoveth thee to sift; thee it behoveth</p>\n<p class="slindent">To say who aimed thy bow at such a target.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;By philosophic arguments,</p>\n<p class="slindent">And by authority that hence descends,</p>\n<p class="slindent">Such love must needs imprint itself in me;</p></div>\n\n<div class="stanza"><p>For Good, so far as good, when comprehended</p>\n<p class="slindent">Doth straight enkindle love, and so much greater</p>\n<p class="slindent">As more of goodness in itself it holds;</p></div>\n\n<div class="stanza"><p>Then to that Essence (whose is such advantage</p>\n<p class="slindent">That every good which out of it is found</p>\n<p class="slindent">Is nothing but a ray of its own light)</p></div>\n\n<div class="stanza"><p>More than elsewhither must the mind be moved</p>\n<p class="slindent">Of every one, in loving, who discerns</p>\n<p class="slindent">The truth in which this evidence is founded.</p></div>\n\n<div class="stanza"><p>Such truth he to my intellect reveals</p>\n<p class="slindent">Who demonstrates to me the primal love</p>\n<p class="slindent">Of all the sempiternal substances.</p></div>\n\n<div class="stanza"><p>The voice reveals it of the truthful Author,</p>\n<p class="slindent">Who says to Moses, speaking of Himself,</p>\n<p class="slindent">&lsquo;I will make all my goodness pass before thee.&rsquo;</p></div>\n\n<div class="stanza"><p>Thou too revealest it to me, beginning</p>\n<p class="slindent">The loud Evangel, that proclaims the secret</p>\n<p class="slindent">Of heaven to earth above all other edict.&rdquo;</p></div>\n\n<div class="stanza"><p>And I heard say: &ldquo;By human intellect</p>\n<p class="slindent">And by authority concordant with it,</p>\n<p class="slindent">Of all thy loves reserve for God the highest.</p></div>\n\n<div class="stanza"><p>But say again if other cords thou feelest,</p>\n<p class="slindent">Draw thee towards Him, that thou mayst proclaim</p>\n<p class="slindent">With how many teeth this love is biting thee.&rdquo;</p></div>\n\n<div class="stanza"><p>The holy purpose of the Eagle of Christ</p>\n<p class="slindent">Not latent was, nay, rather I perceived</p>\n<p class="slindent">Whither he fain would my profession lead.</p></div>\n\n<div class="stanza"><p>Therefore I recommenced: &ldquo;All of those bites</p>\n<p class="slindent">Which have the power to turn the heart to God</p>\n<p class="slindent">Unto my charity have been concurrent.</p></div>\n\n<div class="stanza"><p>The being of the world, and my own being,</p>\n<p class="slindent">The death which He endured that I may live,</p>\n<p class="slindent">And that which all the faithful hope, as I do,</p></div>\n\n<div class="stanza"><p>With the forementioned vivid consciousness</p>\n<p class="slindent">Have drawn me from the sea of love perverse,</p>\n<p class="slindent">And of the right have placed me on the shore.</p></div>\n\n<div class="stanza"><p>The leaves, wherewith embowered is all the garden</p>\n<p class="slindent">Of the Eternal Gardener, do I love</p>\n<p class="slindent">As much as he has granted them of good.&rdquo;</p></div>\n\n<div class="stanza"><p>As soon as I had ceased, a song most sweet</p>\n<p class="slindent">Throughout the heaven resounded, and my Lady</p>\n<p class="slindent">Said with the others, &ldquo;Holy, holy, holy!&rdquo;</p></div>\n\n<div class="stanza"><p>And as at some keen light one wakes from sleep</p>\n<p class="slindent">By reason of the visual spirit that runs</p>\n<p class="slindent">Unto the splendour passed from coat to coat,</p></div>\n\n<div class="stanza"><p>And he who wakes abhorreth what he sees,</p>\n<p class="slindent">So all unconscious is his sudden waking,</p>\n<p class="slindent">Until the judgment cometh to his aid,</p></div>\n\n<div class="stanza"><p>So from before mine eyes did Beatrice</p>\n<p class="slindent">Chase every mote with radiance of her own,</p>\n<p class="slindent">That cast its light a thousand miles and more.</p></div>\n\n<div class="stanza"><p>Whence better after than before I saw,</p>\n<p class="slindent">And in a kind of wonderment I asked</p>\n<p class="slindent">About a fourth light that I saw with us.</p></div>\n\n<div class="stanza"><p>And said my Lady: &ldquo;There within those rays</p>\n<p class="slindent">Gazes upon its Maker the first soul</p>\n<p class="slindent">That ever the first virtue did create.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as the bough that downward bends its top</p>\n<p class="slindent">At transit of the wind, and then is lifted</p>\n<p class="slindent">By its own virtue, which inclines it upward,</p></div>\n\n<div class="stanza"><p>Likewise did I, the while that she was speaking,</p>\n<p class="slindent">Being amazed, and then I was made bold</p>\n<p class="slindent">By a desire to speak wherewith I burned.</p></div>\n\n<div class="stanza"><p>And I began: &ldquo;O apple, that mature</p>\n<p class="slindent">Alone hast been produced, O ancient father,</p>\n<p class="slindent">To whom each wife is daughter and daughter-in-law,</p></div>\n\n<div class="stanza"><p>Devoutly as I can I supplicate thee</p>\n<p class="slindent">That thou wouldst speak to me; thou seest my wish;</p>\n<p class="slindent">And I, to hear thee quickly, speak it not.&rdquo;</p></div>\n\n<div class="stanza"><p>Sometimes an animal, when covered, struggles</p>\n<p class="slindent">So that his impulse needs must be apparent,</p>\n<p class="slindent">By reason of the wrappage following it;</p></div>\n\n<div class="stanza"><p>And in like manner the primeval soul</p>\n<p class="slindent">Made clear to me athwart its covering</p>\n<p class="slindent">How jubilant it was to give me pleasure.</p></div>\n\n<div class="stanza"><p>Then breathed: &ldquo;Without thy uttering it to me,</p>\n<p class="slindent">Thine inclination better I discern</p>\n<p class="slindent">Than thou whatever thing is surest to thee;</p></div>\n\n<div class="stanza"><p>For I behold it in the truthful mirror,</p>\n<p class="slindent">That of Himself all things parhelion makes,</p>\n<p class="slindent">And none makes Him parhelion of itself.</p></div>\n\n<div class="stanza"><p>Thou fain wouldst hear how long ago God placed me</p>\n<p class="slindent">Within the lofty garden, where this Lady</p>\n<p class="slindent">Unto so long a stairway thee disposed.</p></div>\n\n<div class="stanza"><p>And how long to mine eyes it was a pleasure,</p>\n<p class="slindent">And of the great disdain the proper cause,</p>\n<p class="slindent">And the language that I used and that I made.</p></div>\n\n<div class="stanza"><p>Now, son of mine, the tasting of the tree</p>\n<p class="slindent">Not in itself was cause of so great exile,</p>\n<p class="slindent">But solely the o&rsquo;erstepping of the bounds.</p></div>\n\n<div class="stanza"><p>There, whence thy Lady moved Virgilius,</p>\n<p class="slindent">Four thousand and three hundred and two circuits</p>\n<p class="slindent">Made by the sun, this Council I desired;</p></div>\n\n<div class="stanza"><p>And him I saw return to all the lights</p>\n<p class="slindent">Of his highway nine hundred times and thirty,</p>\n<p class="slindent">Whilst I upon the earth was tarrying.</p></div>\n\n<div class="stanza"><p>The language that I spake was quite extinct</p>\n<p class="slindent">Before that in the work interminable</p>\n<p class="slindent">The people under Nimrod were employed;</p></div>\n\n<div class="stanza"><p>For nevermore result of reasoning</p>\n<p class="slindent">(Because of human pleasure that doth change,</p>\n<p class="slindent">Obedient to the heavens) was durable.</p></div>\n\n<div class="stanza"><p>A natural action is it that man speaks;</p>\n<p class="slindent">But whether thus or thus, doth nature leave</p>\n<p class="slindent">To your own art, as seemeth best to you.</p></div>\n\n<div class="stanza"><p>Ere I descended to the infernal anguish,</p>\n<p class="slindent">&lsquo;El&rsquo; was on earth the name of the Chief Good,</p>\n<p class="slindent">From whom comes all the joy that wraps me round</p></div>\n\n<div class="stanza"><p>&lsquo;Eli&rsquo; he then was called, and that is proper,</p>\n<p class="slindent">Because the use of men is like a leaf</p>\n<p class="slindent">On bough, which goeth and another cometh.</p></div>\n\n<div class="stanza"><p>Upon the mount that highest o&rsquo;er the wave</p>\n<p class="slindent">Rises was I, in life or pure or sinful,</p>\n<p class="slindent">From the first hour to that which is the second,</p></div>\n\n<div class="stanza"><p>As the sun changes quadrant, to the sixth.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XXVII</p>\n<div class="stanza"><p>&ldquo;Glory be to the Father, to the Son,</p>\n<p class="slindent">And Holy Ghost!&rdquo; all Paradise began,</p>\n<p class="slindent">So that the melody inebriate made me.</p></div>\n\n<div class="stanza"><p>What I beheld seemed unto me a smile</p>\n<p class="slindent">Of the universe; for my inebriation</p>\n<p class="slindent">Found entrance through the hearing and the sight.</p></div>\n\n<div class="stanza"><p>O joy!  O gladness inexpressible!</p>\n<p class="slindent">O perfect life of love and peacefulness!</p>\n<p class="slindent">O riches without hankering secure!</p></div>\n\n<div class="stanza"><p>Before mine eyes were standing the four torches</p>\n<p class="slindent">Enkindled, and the one that first had come</p>\n<p class="slindent">Began to make itself more luminous;</p></div>\n\n<div class="stanza"><p>And even such in semblance it became</p>\n<p class="slindent">As Jupiter would become, if he and Mars</p>\n<p class="slindent">Were birds, and they should interchange their feathers.</p></div>\n\n<div class="stanza"><p>That Providence, which here distributeth</p>\n<p class="slindent">Season and service, in the blessed choir</p>\n<p class="slindent">Had silence upon every side imposed.</p></div>\n\n<div class="stanza"><p>When I heard say: &ldquo;If I my colour change,</p>\n<p class="slindent">Marvel not at it; for while I am speaking</p>\n<p class="slindent">Thou shalt behold all these their colour change.</p></div>\n\n<div class="stanza"><p>He who usurps upon the earth my place,</p>\n<p class="slindent">My place, my place, which vacant has become</p>\n<p class="slindent">Before the presence of the Son of God,</p></div>\n\n<div class="stanza"><p>Has of my cemetery made a sewer</p>\n<p class="slindent">Of blood and stench, whereby the Perverse One,</p>\n<p class="slindent">Who fell from here, below there is appeased!&rdquo;</p></div>\n\n<div class="stanza"><p>With the same colour which, through sun adverse,</p>\n<p class="slindent">Painteth the clouds at evening or at morn,</p>\n<p class="slindent">Beheld I then the whole of heaven suffused.</p></div>\n\n<div class="stanza"><p>And as a modest woman, who abides</p>\n<p class="slindent">Sure of herself, and at another&rsquo;s failing,</p>\n<p class="slindent">From listening only, timorous becomes,</p></div>\n\n<div class="stanza"><p>Even thus did Beatrice change countenance;</p>\n<p class="slindent">And I believe in heaven was such eclipse,</p>\n<p class="slindent">When suffered the supreme Omnipotence;</p></div>\n\n<div class="stanza"><p>Thereafterward proceeded forth his words</p>\n<p class="slindent">With voice so much transmuted from itself,</p>\n<p class="slindent">The very countenance was not more changed.</p></div>\n\n<div class="stanza"><p>&ldquo;The spouse of Christ has never nurtured been</p>\n<p class="slindent">On blood of mine, of Linus and of Cletus,</p>\n<p class="slindent">To be made use of in acquest of gold;</p></div>\n\n<div class="stanza"><p>But in acquest of this delightful life</p>\n<p class="slindent">Sixtus and Pius, Urban and Calixtus,</p>\n<p class="slindent">After much lamentation, shed their blood.</p></div>\n\n<div class="stanza"><p>Our purpose was not, that on the right hand</p>\n<p class="slindent">Of our successors should in part be seated</p>\n<p class="slindent">The Christian folk, in part upon the other;</p></div>\n\n<div class="stanza"><p>Nor that the keys which were to me confided</p>\n<p class="slindent">Should e&rsquo;er become the escutcheon on a banner,</p>\n<p class="slindent">That should wage war on those who are baptized;</p></div>\n\n<div class="stanza"><p>Nor I be made the figure of a seal</p>\n<p class="slindent">To privileges venal and mendacious,</p>\n<p class="slindent">Whereat I often redden and flash with fire.</p></div>\n\n<div class="stanza"><p>In garb of shepherds the rapacious wolves</p>\n<p class="slindent">Are seen from here above o&rsquo;er all the pastures!</p>\n<p class="slindent">O wrath of God, why dost thou slumber still?</p></div>\n\n<div class="stanza"><p>To drink our blood the Caorsines and Gascons</p>\n<p class="slindent">Are making ready.  O thou good beginning,</p>\n<p class="slindent">Unto how vile an end must thou needs fall!</p></div>\n\n<div class="stanza"><p>But the high Providence, that with Scipio</p>\n<p class="slindent">At Rome the glory of the world defended,</p>\n<p class="slindent">Will speedily bring aid, as I conceive;</p></div>\n\n<div class="stanza"><p>And thou, my son, who by thy mortal weight</p>\n<p class="slindent">Shalt down return again, open thy mouth;</p>\n<p class="slindent">What I conceal not, do not thou conceal.&rdquo;</p></div>\n\n<div class="stanza"><p>As with its frozen vapours downward falls</p>\n<p class="slindent">In flakes our atmosphere, what time the horn</p>\n<p class="slindent">Of the celestial Goat doth touch the sun,</p></div>\n\n<div class="stanza"><p>Upward in such array saw I the ether</p>\n<p class="slindent">Become, and flaked with the triumphant vapours,</p>\n<p class="slindent">Which there together with us had remained.</p></div>\n\n<div class="stanza"><p>My sight was following up their semblances,</p>\n<p class="slindent">And followed till the medium, by excess,</p>\n<p class="slindent">The passing farther onward took from it;</p></div>\n\n<div class="stanza"><p>Whereat the Lady, who beheld me freed</p>\n<p class="slindent">From gazing upward, said to me: &ldquo;Cast down</p>\n<p class="slindent">Thy sight, and see how far thou art turned round.&rdquo;</p></div>\n\n<div class="stanza"><p>Since the first time that I had downward looked,</p>\n<p class="slindent">I saw that I had moved through the whole arc</p>\n<p class="slindent">Which the first climate makes from midst to end;</p></div>\n\n<div class="stanza"><p>So that I saw the mad track of Ulysses</p>\n<p class="slindent">Past Gades, and this side, well nigh the shore</p>\n<p class="slindent">Whereon became Europa a sweet burden.</p></div>\n\n<div class="stanza"><p>And of this threshing-floor the site to me</p>\n<p class="slindent">Were more unveiled, but the sun was proceeding</p>\n<p class="slindent">Under my feet, a sign and more removed.</p></div>\n\n<div class="stanza"><p>My mind enamoured, which is dallying</p>\n<p class="slindent">At all times with my Lady, to bring back</p>\n<p class="slindent">To her mine eyes was more than ever ardent.</p></div>\n\n<div class="stanza"><p>And if or Art or Nature has made bait</p>\n<p class="slindent">To catch the eyes and so possess the mind,</p>\n<p class="slindent">In human flesh or in its portraiture,</p></div>\n\n<div class="stanza"><p>All joined together would appear as nought</p>\n<p class="slindent">To the divine delight which shone upon me</p>\n<p class="slindent">When to her smiling face I turned me round.</p></div>\n\n<div class="stanza"><p>The virtue that her look endowed me with</p>\n<p class="slindent">From the fair nest of Leda tore me forth,</p>\n<p class="slindent">And up into the swiftest heaven impelled me.</p></div>\n\n<div class="stanza"><p>Its parts exceeding full of life and lofty</p>\n<p class="slindent">Are all so uniform, I cannot say</p>\n<p class="slindent">Which Beatrice selected for my place.</p></div>\n\n<div class="stanza"><p>But she, who was aware of my desire,</p>\n<p class="slindent">Began, the while she smiled so joyously</p>\n<p class="slindent">That God seemed in her countenance to rejoice:</p></div>\n\n<div class="stanza"><p>&ldquo;The nature of that motion, which keeps quiet</p>\n<p class="slindent">The centre and all the rest about it moves,</p>\n<p class="slindent">From hence begins as from its starting point.</p></div>\n\n<div class="stanza"><p>And in this heaven there is no other Where</p>\n<p class="slindent">Than in the Mind Divine, wherein is kindled</p>\n<p class="slindent">The love that turns it, and the power it rains.</p></div>\n\n<div class="stanza"><p>Within a circle light and love embrace it,</p>\n<p class="slindent">Even as this doth the others, and that precinct</p>\n<p class="slindent">He who encircles it alone controls.</p></div>\n\n<div class="stanza"><p>Its motion is not by another meted,</p>\n<p class="slindent">But all the others measured are by this,</p>\n<p class="slindent">As ten is by the half and by the fifth.</p></div>\n\n<div class="stanza"><p>And in what manner time in such a pot</p>\n<p class="slindent">May have its roots, and in the rest its leaves,</p>\n<p class="slindent">Now unto thee can manifest be made.</p></div>\n\n<div class="stanza"><p>O Covetousness, that mortals dost ingulf</p>\n<p class="slindent">Beneath thee so, that no one hath the power</p>\n<p class="slindent">Of drawing back his eyes from out thy waves!</p></div>\n\n<div class="stanza"><p>Full fairly blossoms in mankind the will;</p>\n<p class="slindent">But the uninterrupted rain converts</p>\n<p class="slindent">Into abortive wildings the true plums.</p></div>\n\n<div class="stanza"><p>Fidelity and innocence are found</p>\n<p class="slindent">Only in children; afterwards they both</p>\n<p class="slindent">Take flight or e&rsquo;er the cheeks with down are covered.</p></div>\n\n<div class="stanza"><p>One, while he prattles still, observes the fasts,</p>\n<p class="slindent">Who, when his tongue is loosed, forthwith devours</p>\n<p class="slindent">Whatever food under whatever moon;</p></div>\n\n<div class="stanza"><p>Another, while he prattles, loves and listens</p>\n<p class="slindent">Unto his mother, who when speech is perfect</p>\n<p class="slindent">Forthwith desires to see her in her grave.</p></div>\n\n<div class="stanza"><p>Even thus is swarthy made the skin so white</p>\n<p class="slindent">In its first aspect of the daughter fair</p>\n<p class="slindent">Of him who brings the morn, and leaves the night.</p></div>\n\n<div class="stanza"><p>Thou, that it may not be a marvel to thee,</p>\n<p class="slindent">Think that on earth there is no one who governs;</p>\n<p class="slindent">Whence goes astray the human family.</p></div>\n\n<div class="stanza"><p>Ere January be unwintered wholly</p>\n<p class="slindent">By the centesimal on earth neglected,</p>\n<p class="slindent">Shall these supernal circles roar so loud</p></div>\n\n<div class="stanza"><p>The tempest that has been so long awaited</p>\n<p class="slindent">Shall whirl the poops about where are the prows;</p>\n<p class="slindent">So that the fleet shall run its course direct,</p></div>\n\n<div class="stanza"><p>And the true fruit shall follow on the flower.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XXVIII</p>\n<div class="stanza"><p>After the truth against the present life</p>\n<p class="slindent">Of miserable mortals was unfolded</p>\n<p class="slindent">By her who doth imparadise my mind,</p></div>\n\n<div class="stanza"><p>As in a looking-glass a taper&rsquo;s flame</p>\n<p class="slindent">He sees who from behind is lighted by it,</p>\n<p class="slindent">Before he has it in his sight or thought,</p></div>\n\n<div class="stanza"><p>And turns him round to see if so the glass</p>\n<p class="slindent">Tell him the truth, and sees that it accords</p>\n<p class="slindent">Therewith as doth a music with its metre,</p></div>\n\n<div class="stanza"><p>In similar wise my memory recollecteth</p>\n<p class="slindent">That I did, looking into those fair eyes,</p>\n<p class="slindent">Of which Love made the springes to ensnare me.</p></div>\n\n<div class="stanza"><p>And as I turned me round, and mine were touched</p>\n<p class="slindent">By that which is apparent in that volume,</p>\n<p class="slindent">Whenever on its gyre we gaze intent,</p></div>\n\n<div class="stanza"><p>A point beheld I, that was raying out</p>\n<p class="slindent">Light so acute, the sight which it enkindles</p>\n<p class="slindent">Must close perforce before such great acuteness.</p></div>\n\n<div class="stanza"><p>And whatsoever star seems smallest here</p>\n<p class="slindent">Would seem to be a moon, if placed beside it.</p>\n<p class="slindent">As one star with another star is placed.</p></div>\n\n<div class="stanza"><p>Perhaps at such a distance as appears</p>\n<p class="slindent">A halo cincturing the light that paints it,</p>\n<p class="slindent">When densest is the vapour that sustains it,</p></div>\n\n<div class="stanza"><p>Thus distant round the point a circle of fire</p>\n<p class="slindent">So swiftly whirled, that it would have surpassed</p>\n<p class="slindent">Whatever motion soonest girds the world;</p></div>\n\n<div class="stanza"><p>And this was by another circumcinct,</p>\n<p class="slindent">That by a third, the third then by a fourth,</p>\n<p class="slindent">By a fifth the fourth, and then by a sixth the fifth;</p></div>\n\n<div class="stanza"><p>The seventh followed thereupon in width</p>\n<p class="slindent">So ample now, that Juno&rsquo;s messenger</p>\n<p class="slindent">Entire would be too narrow to contain it.</p></div>\n\n<div class="stanza"><p>Even so the eighth and ninth; and every one</p>\n<p class="slindent">More slowly moved, according as it was</p>\n<p class="slindent">In number distant farther from the first.</p></div>\n\n<div class="stanza"><p>And that one had its flame most crystalline</p>\n<p class="slindent">From which less distant was the stainless spark,</p>\n<p class="slindent">I think because more with its truth imbued.</p></div>\n\n<div class="stanza"><p>My Lady, who in my anxiety</p>\n<p class="slindent">Beheld me much perplexed, said: &ldquo;From that point</p>\n<p class="slindent">Dependent is the heaven and nature all.</p></div>\n\n<div class="stanza"><p>Behold that circle most conjoined to it,</p>\n<p class="slindent">And know thou, that its motion is so swift</p>\n<p class="slindent">Through burning love whereby it is spurred on.&rdquo;</p></div>\n\n<div class="stanza"><p>And I to her: &ldquo;If the world were arranged</p>\n<p class="slindent">In the order which I see in yonder wheels,</p>\n<p class="slindent">What&rsquo;s set before me would have satisfied me;</p></div>\n\n<div class="stanza"><p>But in the world of sense we can perceive</p>\n<p class="slindent">That evermore the circles are diviner</p>\n<p class="slindent">As they are from the centre more remote</p></div>\n\n<div class="stanza"><p>Wherefore if my desire is to be ended</p>\n<p class="slindent">In this miraculous and angelic temple,</p>\n<p class="slindent">That has for confines only love and light,</p></div>\n\n<div class="stanza"><p>To hear behoves me still how the example</p>\n<p class="slindent">And the exemplar go not in one fashion,</p>\n<p class="slindent">Since for myself in vain I contemplate it.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;If thine own fingers unto such a knot</p>\n<p class="slindent">Be insufficient, it is no great wonder,</p>\n<p class="slindent">So hard hath it become for want of trying.&rdquo;</p></div>\n\n<div class="stanza"><p>My Lady thus; then said she: &ldquo;Do thou take</p>\n<p class="slindent">What I shall tell thee, if thou wouldst be sated,</p>\n<p class="slindent">And exercise on that thy subtlety.</p></div>\n\n<div class="stanza"><p>The circles corporal are wide and narrow</p>\n<p class="slindent">According to the more or less of virtue</p>\n<p class="slindent">Which is distributed through all their parts.</p></div>\n\n<div class="stanza"><p>The greater goodness works the greater weal,</p>\n<p class="slindent">The greater weal the greater body holds,</p>\n<p class="slindent">If perfect equally are all its parts.</p></div>\n\n<div class="stanza"><p>Therefore this one which sweeps along with it</p>\n<p class="slindent">The universe sublime, doth correspond</p>\n<p class="slindent">Unto the circle which most loves and knows.</p></div>\n\n<div class="stanza"><p>On which account, if thou unto the virtue</p>\n<p class="slindent">Apply thy measure, not to the appearance</p>\n<p class="slindent">Of substances that unto thee seem round,</p></div>\n\n<div class="stanza"><p>Thou wilt behold a marvellous agreement,</p>\n<p class="slindent">Of more to greater, and of less to smaller,</p>\n<p class="slindent">In every heaven, with its Intelligence.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as remaineth splendid and serene</p>\n<p class="slindent">The hemisphere of air, when Boreas</p>\n<p class="slindent">Is blowing from that cheek where he is mildest,</p></div>\n\n<div class="stanza"><p>Because is purified and resolved the rack</p>\n<p class="slindent">That erst disturbed it, till the welkin laughs</p>\n<p class="slindent">With all the beauties of its pageantry;</p></div>\n\n<div class="stanza"><p>Thus did I likewise, after that my Lady</p>\n<p class="slindent">Had me provided with her clear response,</p>\n<p class="slindent">And like a star in heaven the truth was seen.</p></div>\n\n<div class="stanza"><p>And soon as to a stop her words had come,</p>\n<p class="slindent">Not otherwise does iron scintillate</p>\n<p class="slindent">When molten, than those circles scintillated.</p></div>\n\n<div class="stanza"><p>Their coruscation all the sparks repeated,</p>\n<p class="slindent">And they so many were, their number makes</p>\n<p class="slindent">More millions than the doubling of the chess.</p></div>\n\n<div class="stanza"><p>I heard them sing hosanna choir by choir</p>\n<p class="slindent">To the fixed point which holds them at the &lsquo;Ubi,&rsquo;</p>\n<p class="slindent">And ever will, where they have ever been.</p></div>\n\n<div class="stanza"><p>And she, who saw the dubious meditations</p>\n<p class="slindent">Within my mind, &ldquo;The primal circles,&rdquo; said,</p>\n<p class="slindent">&ldquo;Have shown thee Seraphim and Cherubim.</p></div>\n\n<div class="stanza"><p>Thus rapidly they follow their own bonds,</p>\n<p class="slindent">To be as like the point as most they can,</p>\n<p class="slindent">And can as far as they are high in vision.</p></div>\n\n<div class="stanza"><p>Those other Loves, that round about them go,</p>\n<p class="slindent">Thrones of the countenance divine are called,</p>\n<p class="slindent">Because they terminate the primal Triad.</p></div>\n\n<div class="stanza"><p>And thou shouldst know that they all have delight</p>\n<p class="slindent">As much as their own vision penetrates</p>\n<p class="slindent">The Truth, in which all intellect finds rest.</p></div>\n\n<div class="stanza"><p>From this it may be seen how blessedness</p>\n<p class="slindent">Is founded in the faculty which sees,</p>\n<p class="slindent">And not in that which loves, and follows next;</p></div>\n\n<div class="stanza"><p>And of this seeing merit is the measure,</p>\n<p class="slindent">Which is brought forth by grace, and by good will;</p>\n<p class="slindent">Thus on from grade to grade doth it proceed.</p></div>\n\n<div class="stanza"><p>The second Triad, which is germinating</p>\n<p class="slindent">In such wise in this sempiternal spring,</p>\n<p class="slindent">That no nocturnal Aries despoils,</p></div>\n\n<div class="stanza"><p>Perpetually hosanna warbles forth</p>\n<p class="slindent">With threefold melody, that sounds in three</p>\n<p class="slindent">Orders of joy, with which it is intrined.</p></div>\n\n<div class="stanza"><p>The three Divine are in this hierarchy,</p>\n<p class="slindent">First the Dominions, and the Virtues next;</p>\n<p class="slindent">And the third order is that of the Powers.</p></div>\n\n<div class="stanza"><p>Then in the dances twain penultimate</p>\n<p class="slindent">The Principalities and Archangels wheel;</p>\n<p class="slindent">The last is wholly of angelic sports.</p></div>\n\n<div class="stanza"><p>These orders upward all of them are gazing,</p>\n<p class="slindent">And downward so prevail, that unto God</p>\n<p class="slindent">They all attracted are and all attract.</p></div>\n\n<div class="stanza"><p>And Dionysius with so great desire</p>\n<p class="slindent">To contemplate these Orders set himself,</p>\n<p class="slindent">He named them and distinguished them as I do.</p></div>\n\n<div class="stanza"><p>But Gregory afterwards dissented from him;</p>\n<p class="slindent">Wherefore, as soon as he unclosed his eyes</p>\n<p class="slindent">Within this heaven, he at himself did smile.</p></div>\n\n<div class="stanza"><p>And if so much of secret truth a mortal</p>\n<p class="slindent">Proffered on earth, I would not have thee marvel,</p>\n<p class="slindent">For he who saw it here revealed it to him,</p></div>\n\n<div class="stanza"><p>With much more of the truth about these circles.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XXIX</p>\n<div class="stanza"><p>At what time both the children of Latona,</p>\n<p class="slindent">Surmounted by the Ram and by the Scales,</p>\n<p class="slindent">Together make a zone of the horizon,</p></div>\n\n<div class="stanza"><p>As long as from the time the zenith holds them</p>\n<p class="slindent">In equipoise, till from that girdle both</p>\n<p class="slindent">Changing their hemisphere disturb the balance,</p></div>\n\n<div class="stanza"><p>So long, her face depicted with a smile,</p>\n<p class="slindent">Did Beatrice keep silence while she gazed</p>\n<p class="slindent">Fixedly at the point which had o&rsquo;ercome me.</p></div>\n\n<div class="stanza"><p>Then she began: &ldquo;I say, and I ask not</p>\n<p class="slindent">What thou dost wish to hear, for I have seen it</p>\n<p class="slindent">Where centres every When and every &lsquo;Ubi.&rsquo;</p></div>\n\n<div class="stanza"><p>Not to acquire some good unto himself,</p>\n<p class="slindent">Which is impossible, but that his splendour</p>\n<p class="slindent">In its resplendency may say, &lsquo;Subsisto,&rsquo;</p></div>\n\n<div class="stanza"><p>In his eternity outside of time,</p>\n<p class="slindent">Outside all other limits, as it pleased him,</p>\n<p class="slindent">Into new Loves the Eternal Love unfolded.</p></div>\n\n<div class="stanza"><p>Nor as if torpid did he lie before;</p>\n<p class="slindent">For neither after nor before proceeded</p>\n<p class="slindent">The going forth of God upon these waters.</p></div>\n\n<div class="stanza"><p>Matter and Form unmingled and conjoined</p>\n<p class="slindent">Came into being that had no defect,</p>\n<p class="slindent">E&rsquo;en as three arrows from a three-stringed bow.</p></div>\n\n<div class="stanza"><p>And as in glass, in amber, or in crystal</p>\n<p class="slindent">A sunbeam flashes so, that from its coming</p>\n<p class="slindent">To its full being is no interval,</p></div>\n\n<div class="stanza"><p>So from its Lord did the triform effect</p>\n<p class="slindent">Ray forth into its being all together,</p>\n<p class="slindent">Without discrimination of beginning.</p></div>\n\n<div class="stanza"><p>Order was con-created and constructed</p>\n<p class="slindent">In substances, and summit of the world</p>\n<p class="slindent">Were those wherein the pure act was produced.</p></div>\n\n<div class="stanza"><p>Pure potentiality held the lowest part;</p>\n<p class="slindent">Midway bound potentiality with act</p>\n<p class="slindent">Such bond that it shall never be unbound.</p></div>\n\n<div class="stanza"><p>Jerome has written unto you of angels</p>\n<p class="slindent">Created a long lapse of centuries</p>\n<p class="slindent">Or ever yet the other world was made;</p></div>\n\n<div class="stanza"><p>But written is this truth in many places</p>\n<p class="slindent">By writers of the Holy Ghost, and thou</p>\n<p class="slindent">Shalt see it, if thou lookest well thereat.</p></div>\n\n<div class="stanza"><p>And even reason seeth it somewhat,</p>\n<p class="slindent">For it would not concede that for so long</p>\n<p class="slindent">Could be the motors without their perfection.</p></div>\n\n<div class="stanza"><p>Now dost thou know both where and when these Loves</p>\n<p class="slindent">Created were, and how; so that extinct</p>\n<p class="slindent">In thy desire already are three fires.</p></div>\n\n<div class="stanza"><p>Nor could one reach, in counting, unto twenty</p>\n<p class="slindent">So swiftly, as a portion of these angels</p>\n<p class="slindent">Disturbed the subject of your elements.</p></div>\n\n<div class="stanza"><p>The rest remained, and they began this art</p>\n<p class="slindent">Which thou discernest, with so great delight</p>\n<p class="slindent">That never from their circling do they cease.</p></div>\n\n<div class="stanza"><p>The occasion of the fall was the accursed</p>\n<p class="slindent">Presumption of that One, whom thou hast seen</p>\n<p class="slindent">By all the burden of the world constrained.</p></div>\n\n<div class="stanza"><p>Those whom thou here beholdest modest were</p>\n<p class="slindent">To recognise themselves as of that goodness</p>\n<p class="slindent">Which made them apt for so much understanding;</p></div>\n\n<div class="stanza"><p>On which account their vision was exalted</p>\n<p class="slindent">By the enlightening grace and their own merit,</p>\n<p class="slindent">So that they have a full and steadfast will.</p></div>\n\n<div class="stanza"><p>I would not have thee doubt, but certain be,</p>\n<p class="slindent">&rsquo;Tis meritorious to receive this grace,</p>\n<p class="slindent">According as the affection opens to it.</p></div>\n\n<div class="stanza"><p>Now round about in this consistory</p>\n<p class="slindent">Much mayst thou contemplate, if these my words</p>\n<p class="slindent">Be gathered up, without all further aid.</p></div>\n\n<div class="stanza"><p>But since upon the earth, throughout your schools,</p>\n<p class="slindent">They teach that such is the angelic nature</p>\n<p class="slindent">That it doth hear, and recollect, and will,</p></div>\n\n<div class="stanza"><p>More will I say, that thou mayst see unmixed</p>\n<p class="slindent">The truth that is confounded there below,</p>\n<p class="slindent">Equivocating in such like prelections.</p></div>\n\n<div class="stanza"><p>These substances, since in God&rsquo;s countenance</p>\n<p class="slindent">They jocund were, turned not away their sight</p>\n<p class="slindent">From that wherefrom not anything is hidden;</p></div>\n\n<div class="stanza"><p>Hence they have not their vision intercepted</p>\n<p class="slindent">By object new, and hence they do not need</p>\n<p class="slindent">To recollect, through interrupted thought.</p></div>\n\n<div class="stanza"><p>So that below, not sleeping, people dream,</p>\n<p class="slindent">Believing they speak truth, and not believing;</p>\n<p class="slindent">And in the last is greater sin and shame.</p></div>\n\n<div class="stanza"><p>Below you do not journey by one path</p>\n<p class="slindent">Philosophising; so transporteth you</p>\n<p class="slindent">Love of appearance and the thought thereof.</p></div>\n\n<div class="stanza"><p>And even this above here is endured</p>\n<p class="slindent">With less disdain, than when is set aside</p>\n<p class="slindent">The Holy Writ, or when it is distorted.</p></div>\n\n<div class="stanza"><p>They think not there how much of blood it costs</p>\n<p class="slindent">To sow it in the world, and how he pleases</p>\n<p class="slindent">Who in humility keeps close to it.</p></div>\n\n<div class="stanza"><p>Each striveth for appearance, and doth make</p>\n<p class="slindent">His own inventions; and these treated are</p>\n<p class="slindent">By preachers, and the Evangel holds its peace.</p></div>\n\n<div class="stanza"><p>One sayeth that the moon did backward turn,</p>\n<p class="slindent">In the Passion of Christ, and interpose herself</p>\n<p class="slindent">So that the sunlight reached not down below;</p></div>\n\n<div class="stanza"><p>And lies; for of its own accord the light</p>\n<p class="slindent">Hid itself; whence to Spaniards and to Indians,</p>\n<p class="slindent">As to the Jews, did such eclipse respond.</p></div>\n\n<div class="stanza"><p>Florence has not so many Lapi and Bindi</p>\n<p class="slindent">As fables such as these, that every year</p>\n<p class="slindent">Are shouted from the pulpit back and forth,</p></div>\n\n<div class="stanza"><p>In such wise that the lambs, who do not know,</p>\n<p class="slindent">Come back from pasture fed upon the wind,</p>\n<p class="slindent">And not to see the harm doth not excuse them.</p></div>\n\n<div class="stanza"><p>Christ did not to his first disciples say,</p>\n<p class="slindent">&lsquo;Go forth, and to the world preach idle tales,&rsquo;</p>\n<p class="slindent">But unto them a true foundation gave;</p></div>\n\n<div class="stanza"><p>And this so loudly sounded from their lips,</p>\n<p class="slindent">That, in the warfare to enkindle Faith,</p>\n<p class="slindent">They made of the Evangel shields and lances.</p></div>\n\n<div class="stanza"><p>Now men go forth with jests and drolleries</p>\n<p class="slindent">To preach, and if but well the people laugh,</p>\n<p class="slindent">The hood puffs out, and nothing more is asked.</p></div>\n\n<div class="stanza"><p>But in the cowl there nestles such a bird,</p>\n<p class="slindent">That, if the common people were to see it,</p>\n<p class="slindent">They would perceive what pardons they confide in,</p></div>\n\n<div class="stanza"><p>For which so great on earth has grown the folly,</p>\n<p class="slindent">That, without proof of any testimony,</p>\n<p class="slindent">To each indulgence they would flock together.</p></div>\n\n<div class="stanza"><p>By this Saint Anthony his pig doth fatten,</p>\n<p class="slindent">And many others, who are worse than pigs,</p>\n<p class="slindent">Paying in money without mark of coinage.</p></div>\n\n<div class="stanza"><p>But since we have digressed abundantly,</p>\n<p class="slindent">Turn back thine eyes forthwith to the right path,</p>\n<p class="slindent">So that the way be shortened with the time.</p></div>\n\n<div class="stanza"><p>This nature doth so multiply itself</p>\n<p class="slindent">In numbers, that there never yet was speech</p>\n<p class="slindent">Nor mortal fancy that can go so far.</p></div>\n\n<div class="stanza"><p>And if thou notest that which is revealed</p>\n<p class="slindent">By Daniel, thou wilt see that in his thousands</p>\n<p class="slindent">Number determinate is kept concealed.</p></div>\n\n<div class="stanza"><p>The primal light, that all irradiates it,</p>\n<p class="slindent">By modes as many is received therein,</p>\n<p class="slindent">As are the splendours wherewith it is mated.</p></div>\n\n<div class="stanza"><p>Hence, inasmuch as on the act conceptive</p>\n<p class="slindent">The affection followeth, of love the sweetness</p>\n<p class="slindent">Therein diversely fervid is or tepid.</p></div>\n\n<div class="stanza"><p>The height behold now and the amplitude</p>\n<p class="slindent">Of the eternal power, since it hath made</p>\n<p class="slindent">Itself so many mirrors, where &rsquo;tis broken,</p></div>\n\n<div class="stanza"><p>One in itself remaining as before.&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XXX</p>\n<div class="stanza"><p>Perchance six thousand miles remote from us</p>\n<p class="slindent">Is glowing the sixth hour, and now this world</p>\n<p class="slindent">Inclines its shadow almost to a level,</p></div>\n\n<div class="stanza"><p>When the mid-heaven begins to make itself</p>\n<p class="slindent">So deep to us, that here and there a star</p>\n<p class="slindent">Ceases to shine so far down as this depth,</p></div>\n\n<div class="stanza"><p>And as advances bright exceedingly</p>\n<p class="slindent">The handmaid of the sun, the heaven is closed</p>\n<p class="slindent">Light after light to the most beautiful;</p></div>\n\n<div class="stanza"><p>Not otherwise the Triumph, which for ever</p>\n<p class="slindent">Plays round about the point that vanquished me,</p>\n<p class="slindent">Seeming enclosed by what itself encloses,</p></div>\n\n<div class="stanza"><p>Little by little from my vision faded;</p>\n<p class="slindent">Whereat to turn mine eyes on Beatrice</p>\n<p class="slindent">My seeing nothing and my love constrained me.</p></div>\n\n<div class="stanza"><p>If what has hitherto been said of her</p>\n<p class="slindent">Were all concluded in a single praise,</p>\n<p class="slindent">Scant would it be to serve the present turn.</p></div>\n\n<div class="stanza"><p>Not only does the beauty I beheld</p>\n<p class="slindent">Transcend ourselves, but truly I believe</p>\n<p class="slindent">Its Maker only may enjoy it all.</p></div>\n\n<div class="stanza"><p>Vanquished do I confess me by this passage</p>\n<p class="slindent">More than by problem of his theme was ever</p>\n<p class="slindent">O&rsquo;ercome the comic or the tragic poet;</p></div>\n\n<div class="stanza"><p>For as the sun the sight that trembles most,</p>\n<p class="slindent">Even so the memory of that sweet smile</p>\n<p class="slindent">My mind depriveth of its very self.</p></div>\n\n<div class="stanza"><p>From the first day that I beheld her face</p>\n<p class="slindent">In this life, to the moment of this look,</p>\n<p class="slindent">The sequence of my song has ne&rsquo;er been severed;</p></div>\n\n<div class="stanza"><p>But now perforce this sequence must desist</p>\n<p class="slindent">From following her beauty with my verse,</p>\n<p class="slindent">As every artist at his uttermost.</p></div>\n\n<div class="stanza"><p>Such as I leave her to a greater fame</p>\n<p class="slindent">Than any of my trumpet, which is bringing</p>\n<p class="slindent">Its arduous matter to a final close,</p></div>\n\n<div class="stanza"><p>With voice and gesture of a perfect leader</p>\n<p class="slindent">She recommenced: &ldquo;We from the greatest body</p>\n<p class="slindent">Have issued to the heaven that is pure light;</p></div>\n\n<div class="stanza"><p>Light intellectual replete with love,</p>\n<p class="slindent">Love of true good replete with ecstasy,</p>\n<p class="slindent">Ecstasy that transcendeth every sweetness.</p></div>\n\n<div class="stanza"><p>Here shalt thou see the one host and the other</p>\n<p class="slindent">Of Paradise, and one in the same aspects</p>\n<p class="slindent">Which at the final judgment thou shalt see.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as a sudden lightning that disperses</p>\n<p class="slindent">The visual spirits, so that it deprives</p>\n<p class="slindent">The eye of impress from the strongest objects,</p></div>\n\n<div class="stanza"><p>Thus round about me flashed a living light,</p>\n<p class="slindent">And left me swathed around with such a veil</p>\n<p class="slindent">Of its effulgence, that I nothing saw.</p></div>\n\n<div class="stanza"><p>&ldquo;Ever the Love which quieteth this heaven</p>\n<p class="slindent">Welcomes into itself with such salute,</p>\n<p class="slindent">To make the candle ready for its flame.&rdquo;</p></div>\n\n<div class="stanza"><p>No sooner had within me these brief words</p>\n<p class="slindent">An entrance found, than I perceived myself</p>\n<p class="slindent">To be uplifted over my own power,</p></div>\n\n<div class="stanza"><p>And I with vision new rekindled me,</p>\n<p class="slindent">Such that no light whatever is so pure</p>\n<p class="slindent">But that mine eyes were fortified against it.</p></div>\n\n<div class="stanza"><p>And light I saw in fashion of a river</p>\n<p class="slindent">Fulvid with its effulgence, &rsquo;twixt two banks</p>\n<p class="slindent">Depicted with an admirable Spring.</p></div>\n\n<div class="stanza"><p>Out of this river issued living sparks,</p>\n<p class="slindent">And on all sides sank down into the flowers,</p>\n<p class="slindent">Like unto rubies that are set in gold;</p></div>\n\n<div class="stanza"><p>And then, as if inebriate with the odours,</p>\n<p class="slindent">They plunged again into the wondrous torrent,</p>\n<p class="slindent">And as one entered issued forth another.</p></div>\n\n<div class="stanza"><p>&ldquo;The high desire, that now inflames and moves thee</p>\n<p class="slindent">To have intelligence of what thou seest,</p>\n<p class="slindent">Pleaseth me all the more, the more it swells.</p></div>\n\n<div class="stanza"><p>But of this water it behoves thee drink</p>\n<p class="slindent">Before so great a thirst in thee be slaked.&rdquo;</p>\n<p class="slindent">Thus said to me the sunshine of mine eyes;</p></div>\n\n<div class="stanza"><p>And added: &ldquo;The river and the topazes</p>\n<p class="slindent">Going in and out, and the laughing of the herbage,</p>\n<p class="slindent">Are of their truth foreshadowing prefaces;</p></div>\n\n<div class="stanza"><p>Not that these things are difficult in themselves,</p>\n<p class="slindent">But the deficiency is on thy side,</p>\n<p class="slindent">For yet thou hast not vision so exalted.&rdquo;</p></div>\n\n<div class="stanza"><p>There is no babe that leaps so suddenly</p>\n<p class="slindent">With face towards the milk, if he awake</p>\n<p class="slindent">Much later than his usual custom is,</p></div>\n\n<div class="stanza"><p>As I did, that I might make better mirrors</p>\n<p class="slindent">Still of mine eyes, down stooping to the wave</p>\n<p class="slindent">Which flows that we therein be better made.</p></div>\n\n<div class="stanza"><p>And even as the penthouse of mine eyelids</p>\n<p class="slindent">Drank of it, it forthwith appeared to me</p>\n<p class="slindent">Out of its length to be transformed to round.</p></div>\n\n<div class="stanza"><p>Then as a folk who have been under masks</p>\n<p class="slindent">Seem other than before, if they divest</p>\n<p class="slindent">The semblance not their own they disappeared in,</p></div>\n\n<div class="stanza"><p>Thus into greater pomp were changed for me</p>\n<p class="slindent">The flowerets and the sparks, so that I saw</p>\n<p class="slindent">Both of the Courts of Heaven made manifest.</p></div>\n\n<div class="stanza"><p>O splendour of God! by means of which I saw</p>\n<p class="slindent">The lofty triumph of the realm veracious,</p>\n<p class="slindent">Give me the power to say how it I saw!</p></div>\n\n<div class="stanza"><p>There is a light above, which visible</p>\n<p class="slindent">Makes the Creator unto every creature,</p>\n<p class="slindent">Who only in beholding Him has peace,</p></div>\n\n<div class="stanza"><p>And it expands itself in circular form</p>\n<p class="slindent">To such extent, that its circumference</p>\n<p class="slindent">Would be too large a girdle for the sun.</p></div>\n\n<div class="stanza"><p>The semblance of it is all made of rays</p>\n<p class="slindent">Reflected from the top of Primal Motion,</p>\n<p class="slindent">Which takes therefrom vitality and power.</p></div>\n\n<div class="stanza"><p>And as a hill in water at its base</p>\n<p class="slindent">Mirrors itself, as if to see its beauty</p>\n<p class="slindent">When affluent most in verdure and in flowers,</p></div>\n\n<div class="stanza"><p>So, ranged aloft all round about the light,</p>\n<p class="slindent">Mirrored I saw in more ranks than a thousand</p>\n<p class="slindent">All who above there have from us returned.</p></div>\n\n<div class="stanza"><p>And if the lowest row collect within it</p>\n<p class="slindent">So great a light, how vast the amplitude</p>\n<p class="slindent">Is of this Rose in its extremest leaves!</p></div>\n\n<div class="stanza"><p>My vision in the vastness and the height</p>\n<p class="slindent">Lost not itself, but comprehended all</p>\n<p class="slindent">The quantity and quality of that gladness.</p></div>\n\n<div class="stanza"><p>There near and far nor add nor take away;</p>\n<p class="slindent">For there where God immediately doth govern,</p>\n<p class="slindent">The natural law in naught is relevant.</p></div>\n\n<div class="stanza"><p>Into the yellow of the Rose Eternal</p>\n<p class="slindent">That spreads, and multiplies, and breathes an odour</p>\n<p class="slindent">Of praise unto the ever-vernal Sun,</p></div>\n\n<div class="stanza"><p>As one who silent is and fain would speak,</p>\n<p class="slindent">Me Beatrice drew on, and said: &ldquo;Behold</p>\n<p class="slindent">Of the white stoles how vast the convent is!</p></div>\n\n<div class="stanza"><p>Behold how vast the circuit of our city!</p>\n<p class="slindent">Behold our seats so filled to overflowing,</p>\n<p class="slindent">That here henceforward are few people wanting!</p></div>\n\n<div class="stanza"><p>On that great throne whereon thine eyes are fixed</p>\n<p class="slindent">For the crown&rsquo;s sake already placed upon it,</p>\n<p class="slindent">Before thou suppest at this wedding feast</p></div>\n\n<div class="stanza"><p>Shall sit the soul (that is to be Augustus</p>\n<p class="slindent">On earth) of noble Henry, who shall come</p>\n<p class="slindent">To redress Italy ere she be ready.</p></div>\n\n<div class="stanza"><p>Blind covetousness, that casts its spell upon you,</p>\n<p class="slindent">Has made you like unto the little child,</p>\n<p class="slindent">Who dies of hunger and drives off the nurse.</p></div>\n\n<div class="stanza"><p>And in the sacred forum then shall be</p>\n<p class="slindent">A Prefect such, that openly or covert</p>\n<p class="slindent">On the same road he will not walk with him.</p></div>\n\n<div class="stanza"><p>But long of God he will not be endured</p>\n<p class="slindent">In holy office; he shall be thrust down</p>\n<p class="slindent">Where Simon Magus is for his deserts,</p></div>\n\n<div class="stanza"><p>And make him of Alagna lower go!&rdquo;</p></div>','<p class="cantohead">Paradiso: Canto XXXI</p>\n<div class="stanza"><p>In fashion then as of a snow-white rose</p>\n<p class="slindent">Displayed itself to me the saintly host,</p>\n<p class="slindent">Whom Christ in his own blood had made his bride,</p></div>\n\n<div class="stanza"><p>But the other host, that flying sees and sings</p>\n<p class="slindent">The glory of Him who doth enamour it,</p>\n<p class="slindent">And the goodness that created it so noble,</p></div>\n\n<div class="stanza"><p>Even as a swarm of bees, that sinks in flowers</p>\n<p class="slindent">One moment, and the next returns again</p>\n<p class="slindent">To where its labour is to sweetness turned,</p></div>\n\n<div class="stanza"><p>Sank into the great flower, that is adorned</p>\n<p class="slindent">With leaves so many, and thence reascended</p>\n<p class="slindent">To where its love abideth evermore.</p></div>\n\n<div class="stanza"><p>Their faces had they all of living flame,</p>\n<p class="slindent">And wings of gold, and all the rest so white</p>\n<p class="slindent">No snow unto that limit doth attain.</p></div>\n\n<div class="stanza"><p>From bench to bench, into the flower descending,</p>\n<p class="slindent">They carried something of the peace and ardour</p>\n<p class="slindent">Which by the fanning of their flanks they won.</p></div>\n\n<div class="stanza"><p>Nor did the interposing &rsquo;twixt the flower</p>\n<p class="slindent">And what was o&rsquo;er it of such plenitude</p>\n<p class="slindent">Of flying shapes impede the sight and splendour;</p></div>\n\n<div class="stanza"><p>Because the light divine so penetrates</p>\n<p class="slindent">The universe, according to its merit,</p>\n<p class="slindent">That naught can be an obstacle against it.</p></div>\n\n<div class="stanza"><p>This realm secure and full of gladsomeness,</p>\n<p class="slindent">Crowded with ancient people and with modern,</p>\n<p class="slindent">Unto one mark had all its look and love.</p></div>\n\n<div class="stanza"><p>O Trinal Light, that in a single star</p>\n<p class="slindent">Sparkling upon their sight so satisfies them,</p>\n<p class="slindent">Look down upon our tempest here below!</p></div>\n\n<div class="stanza"><p>If the barbarians, coming from some region</p>\n<p class="slindent">That every day by Helice is covered,</p>\n<p class="slindent">Revolving with her son whom she delights in,</p></div>\n\n<div class="stanza"><p>Beholding Rome and all her noble works,</p>\n<p class="slindent">Were wonder-struck, what time the Lateran</p>\n<p class="slindent">Above all mortal things was eminent,\u2014</p></div>\n\n<div class="stanza"><p>I who to the divine had from the human,</p>\n<p class="slindent">From time unto eternity, had come,</p>\n<p class="slindent">From Florence to a people just and sane,</p></div>\n\n<div class="stanza"><p>With what amazement must I have been filled!</p>\n<p class="slindent">Truly between this and the joy, it was</p>\n<p class="slindent">My pleasure not to hear, and to be mute.</p></div>\n\n<div class="stanza"><p>And as a pilgrim who delighteth him</p>\n<p class="slindent">In gazing round the temple of his vow,</p>\n<p class="slindent">And hopes some day to retell how it was,</p></div>\n\n<div class="stanza"><p>So through the living light my way pursuing</p>\n<p class="slindent">Directed I mine eyes o&rsquo;er all the ranks,</p>\n<p class="slindent">Now up, now down, and now all round about.</p></div>\n\n<div class="stanza"><p>Faces I saw of charity persuasive,</p>\n<p class="slindent">Embellished by His light and their own smile,</p>\n<p class="slindent">And attitudes adorned with every grace.</p></div>\n\n<div class="stanza"><p>The general form of Paradise already</p>\n<p class="slindent">My glance had comprehended as a whole,</p>\n<p class="slindent">In no part hitherto remaining fixed,</p></div>\n\n<div class="stanza"><p>And round I turned me with rekindled wish</p>\n<p class="slindent">My Lady to interrogate of things</p>\n<p class="slindent">Concerning which my mind was in suspense.</p></div>\n\n<div class="stanza"><p>One thing I meant, another answered me;</p>\n<p class="slindent">I thought I should see Beatrice, and saw</p>\n<p class="slindent">An Old Man habited like the glorious people.</p></div>\n\n<div class="stanza"><p>O&rsquo;erflowing was he in his eyes and cheeks</p>\n<p class="slindent">With joy benign, in attitude of pity</p>\n<p class="slindent">As to a tender father is becoming.</p></div>\n\n<div class="stanza"><p>And &ldquo;She, where is she?&rdquo; instantly I said;</p>\n<p class="slindent">Whence he: &ldquo;To put an end to thy desire,</p>\n<p class="slindent">Me Beatrice hath sent from mine own place.</p></div>\n\n<div class="stanza"><p>And if thou lookest up to the third round</p>\n<p class="slindent">Of the first rank, again shalt thou behold her</p>\n<p class="slindent">Upon the throne her merits have assigned her.&rdquo;</p></div>\n\n<div class="stanza"><p>Without reply I lifted up mine eyes,</p>\n<p class="slindent">And saw her, as she made herself a crown</p>\n<p class="slindent">Reflecting from herself the eternal rays.</p></div>\n\n<div class="stanza"><p>Not from that region which the highest thunders</p>\n<p class="slindent">Is any mortal eye so far removed,</p>\n<p class="slindent">In whatsoever sea it deepest sinks,</p></div>\n\n<div class="stanza"><p>As there from Beatrice my sight; but this</p>\n<p class="slindent">Was nothing unto me; because her image</p>\n<p class="slindent">Descended not to me by medium blurred.</p></div>\n\n<div class="stanza"><p>&ldquo;O Lady, thou in whom my hope is strong,</p>\n<p class="slindent">And who for my salvation didst endure</p>\n<p class="slindent">In Hell to leave the imprint of thy feet,</p></div>\n\n<div class="stanza"><p>Of whatsoever things I have beheld,</p>\n<p class="slindent">As coming from thy power and from thy goodness</p>\n<p class="slindent">I recognise the virtue and the grace.</p></div>\n\n<div class="stanza"><p>Thou from a slave hast brought me unto freedom,</p>\n<p class="slindent">By all those ways, by all the expedients,</p>\n<p class="slindent">Whereby thou hadst the power of doing it.</p></div>\n\n<div class="stanza"><p>Preserve towards me thy magnificence,</p>\n<p class="slindent">So that this soul of mine, which thou hast healed,</p>\n<p class="slindent">Pleasing to thee be loosened from the body.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus I implored; and she, so far away,</p>\n<p class="slindent">Smiled, as it seemed, and looked once more at me;</p>\n<p class="slindent">Then unto the eternal fountain turned.</p></div>\n\n<div class="stanza"><p>And said the Old Man holy: &ldquo;That thou mayst</p>\n<p class="slindent">Accomplish perfectly thy journeying,</p>\n<p class="slindent">Whereunto prayer and holy love have sent me,</p></div>\n\n<div class="stanza"><p>Fly with thine eyes all round about this garden;</p>\n<p class="slindent">For seeing it will discipline thy sight</p>\n<p class="slindent">Farther to mount along the ray divine.</p></div>\n\n<div class="stanza"><p>And she, the Queen of Heaven, for whom I burn</p>\n<p class="slindent">Wholly with love, will grant us every grace,</p>\n<p class="slindent">Because that I her faithful Bernard am.&rdquo;</p></div>\n\n<div class="stanza"><p>As he who peradventure from Croatia</p>\n<p class="slindent">Cometh to gaze at our Veronica,</p>\n<p class="slindent">Who through its ancient fame is never sated,</p></div>\n\n<div class="stanza"><p>But says in thought, the while it is displayed,</p>\n<p class="slindent">&ldquo;My Lord, Christ Jesus, God of very God,</p>\n<p class="slindent">Now was your semblance made like unto this?&rdquo;</p></div>\n\n<div class="stanza"><p>Even such was I while gazing at the living</p>\n<p class="slindent">Charity of the man, who in this world</p>\n<p class="slindent">By contemplation tasted of that peace.</p></div>\n\n<div class="stanza"><p>&ldquo;Thou son of grace, this jocund life,&rdquo; began he,</p>\n<p class="slindent">&ldquo;Will not be known to thee by keeping ever</p>\n<p class="slindent">Thine eyes below here on the lowest place;</p></div>\n\n<div class="stanza"><p>But mark the circles to the most remote,</p>\n<p class="slindent">Until thou shalt behold enthroned the Queen</p>\n<p class="slindent">To whom this realm is subject and devoted.&rdquo;</p></div>\n\n<div class="stanza"><p>I lifted up mine eyes, and as at morn</p>\n<p class="slindent">The oriental part of the horizon</p>\n<p class="slindent">Surpasses that wherein the sun goes down,</p></div>\n\n<div class="stanza"><p>Thus, as if going with mine eyes from vale</p>\n<p class="slindent">To mount, I saw a part in the remoteness</p>\n<p class="slindent">Surpass in splendour all the other front.</p></div>\n\n<div class="stanza"><p>And even as there where we await the pole</p>\n<p class="slindent">That Phaeton drove badly, blazes more</p>\n<p class="slindent">The light, and is on either side diminished,</p></div>\n\n<div class="stanza"><p>So likewise that pacific oriflamme</p>\n<p class="slindent">Gleamed brightest in the centre, and each side</p>\n<p class="slindent">In equal measure did the flame abate.</p></div>\n\n<div class="stanza"><p>And at that centre, with their wings expanded,</p>\n<p class="slindent">More than a thousand jubilant Angels saw I,</p>\n<p class="slindent">Each differing in effulgence and in kind.</p></div>\n\n<div class="stanza"><p>I saw there at their sports and at their songs</p>\n<p class="slindent">A beauty smiling, which the gladness was</p>\n<p class="slindent">Within the eyes of all the other saints;</p></div>\n\n<div class="stanza"><p>And if I had in speaking as much wealth</p>\n<p class="slindent">As in imagining, I should not dare</p>\n<p class="slindent">To attempt the smallest part of its delight.</p></div>\n\n<div class="stanza"><p>Bernard, as soon as he beheld mine eyes</p>\n<p class="slindent">Fixed and intent upon its fervid fervour,</p>\n<p class="slindent">His own with such affection turned to her</p></div>\n\n<div class="stanza"><p>That it made mine more ardent to behold.</p></div>','<p class="cantohead">Paradiso: Canto XXXII</p>\n<div class="stanza"><p>Absorbed in his delight, that contemplator</p>\n<p class="slindent">Assumed the willing office of a teacher,</p>\n<p class="slindent">And gave beginning to these holy words:</p></div>\n\n<div class="stanza"><p>&ldquo;The wound that Mary closed up and anointed,</p>\n<p class="slindent">She at her feet who is so beautiful,</p>\n<p class="slindent">She is the one who opened it and pierced it.</p></div>\n\n<div class="stanza"><p>Within that order which the third seats make</p>\n<p class="slindent">Is seated Rachel, lower than the other,</p>\n<p class="slindent">With Beatrice, in manner as thou seest.</p></div>\n\n<div class="stanza"><p>Sarah, Rebecca, Judith, and her who was</p>\n<p class="slindent">Ancestress of the Singer, who for dole</p>\n<p class="slindent">Of the misdeed said, &lsquo;Miserere mei,&rsquo;</p></div>\n\n<div class="stanza"><p>Canst thou behold from seat to seat descending</p>\n<p class="slindent">Down in gradation, as with each one&rsquo;s name</p>\n<p class="slindent">I through the Rose go down from leaf to leaf.</p></div>\n\n<div class="stanza"><p>And downward from the seventh row, even as</p>\n<p class="slindent">Above the same, succeed the Hebrew women,</p>\n<p class="slindent">Dividing all the tresses of the flower;</p></div>\n\n<div class="stanza"><p>Because, according to the view which Faith</p>\n<p class="slindent">In Christ had taken, these are the partition</p>\n<p class="slindent">By which the sacred stairways are divided.</p></div>\n\n<div class="stanza"><p>Upon this side, where perfect is the flower</p>\n<p class="slindent">With each one of its petals, seated are</p>\n<p class="slindent">Those who believed in Christ who was to come.</p></div>\n\n<div class="stanza"><p>Upon the other side, where intersected</p>\n<p class="slindent">With vacant spaces are the semicircles,</p>\n<p class="slindent">Are those who looked to Christ already come.</p></div>\n\n<div class="stanza"><p>And as, upon this side, the glorious seat</p>\n<p class="slindent">Of the Lady of Heaven, and the other seats</p>\n<p class="slindent">Below it, such a great division make,</p></div>\n\n<div class="stanza"><p>So opposite doth that of the great John,</p>\n<p class="slindent">Who, ever holy, desert and martyrdom</p>\n<p class="slindent">Endured, and afterwards two years in Hell.</p></div>\n\n<div class="stanza"><p>And under him thus to divide were chosen</p>\n<p class="slindent">Francis, and Benedict, and Augustine,</p>\n<p class="slindent">And down to us the rest from round to round.</p></div>\n\n<div class="stanza"><p>Behold now the high providence divine;</p>\n<p class="slindent">For one and other aspect of the Faith</p>\n<p class="slindent">In equal measure shall this garden fill.</p></div>\n\n<div class="stanza"><p>And know that downward from that rank which cleaves</p>\n<p class="slindent">Midway the sequence of the two divisions,</p>\n<p class="slindent">Not by their proper merit are they seated;</p></div>\n\n<div class="stanza"><p>But by another&rsquo;s under fixed conditions;</p>\n<p class="slindent">For these are spirits one and all assoiled</p>\n<p class="slindent">Before they any true election had.</p></div>\n\n<div class="stanza"><p>Well canst thou recognise it in their faces,</p>\n<p class="slindent">And also in their voices puerile,</p>\n<p class="slindent">If thou regard them well and hearken to them.</p></div>\n\n<div class="stanza"><p>Now doubtest thou, and doubting thou art silent;</p>\n<p class="slindent">But I will loosen for thee the strong bond</p>\n<p class="slindent">In which thy subtile fancies hold thee fast.</p></div>\n\n<div class="stanza"><p>Within the amplitude of this domain</p>\n<p class="slindent">No casual point can possibly find place,</p>\n<p class="slindent">No more than sadness can, or thirst, or hunger;</p></div>\n\n<div class="stanza"><p>For by eternal law has been established</p>\n<p class="slindent">Whatever thou beholdest, so that closely</p>\n<p class="slindent">The ring is fitted to the finger here.</p></div>\n\n<div class="stanza"><p>And therefore are these people, festinate</p>\n<p class="slindent">Unto true life, not &lsquo;sine causa&rsquo; here</p>\n<p class="slindent">More and less excellent among themselves.</p></div>\n\n<div class="stanza"><p>The King, by means of whom this realm reposes</p>\n<p class="slindent">In so great love and in so great delight</p>\n<p class="slindent">That no will ventureth to ask for more,</p></div>\n\n<div class="stanza"><p>In his own joyous aspect every mind</p>\n<p class="slindent">Creating, at his pleasure dowers with grace</p>\n<p class="slindent">Diversely; and let here the effect suffice.</p></div>\n\n<div class="stanza"><p>And this is clearly and expressly noted</p>\n<p class="slindent">For you in Holy Scripture, in those twins</p>\n<p class="slindent">Who in their mother had their anger roused.</p></div>\n\n<div class="stanza"><p>According to the colour of the hair,</p>\n<p class="slindent">Therefore, with such a grace the light supreme</p>\n<p class="slindent">Consenteth that they worthily be crowned.</p></div>\n\n<div class="stanza"><p>Without, then, any merit of their deeds,</p>\n<p class="slindent">Stationed are they in different gradations,</p>\n<p class="slindent">Differing only in their first acuteness.</p></div>\n\n<div class="stanza"><p>&rsquo;Tis true that in the early centuries,</p>\n<p class="slindent">With innocence, to work out their salvation</p>\n<p class="slindent">Sufficient was the faith of parents only.</p></div>\n\n<div class="stanza"><p>After the earlier ages were completed,</p>\n<p class="slindent">Behoved it that the males by circumcision</p>\n<p class="slindent">Unto their innocent wings should virtue add;</p></div>\n\n<div class="stanza"><p>But after that the time of grace had come</p>\n<p class="slindent">Without the baptism absolute of Christ,</p>\n<p class="slindent">Such innocence below there was retained.</p></div>\n\n<div class="stanza"><p>Look now into the face that unto Christ</p>\n<p class="slindent">Hath most resemblance; for its brightness only</p>\n<p class="slindent">Is able to prepare thee to see Christ.&rdquo;</p></div>\n\n<div class="stanza"><p>On her did I behold so great a gladness</p>\n<p class="slindent">Rain down, borne onward in the holy minds</p>\n<p class="slindent">Created through that altitude to fly,</p></div>\n\n<div class="stanza"><p>That whatsoever I had seen before</p>\n<p class="slindent">Did not suspend me in such admiration,</p>\n<p class="slindent">Nor show me such similitude of God.</p></div>\n\n<div class="stanza"><p>And the same Love that first descended there,</p>\n<p class="slindent">&ldquo;Ave Maria, gratia plena,&rdquo; singing,</p>\n<p class="slindent">In front of her his wings expanded wide.</p></div>\n\n<div class="stanza"><p>Unto the canticle divine responded</p>\n<p class="slindent">From every part the court beatified,</p>\n<p class="slindent">So that each sight became serener for it.</p></div>\n\n<div class="stanza"><p>&ldquo;O holy father, who for me endurest</p>\n<p class="slindent">To be below here, leaving the sweet place</p>\n<p class="slindent">In which thou sittest by eternal lot,</p></div>\n\n<div class="stanza"><p>Who is the Angel that with so much joy</p>\n<p class="slindent">Into the eyes is looking of our Queen,</p>\n<p class="slindent">Enamoured so that he seems made of fire?&rdquo;</p></div>\n\n<div class="stanza"><p>Thus I again recourse had to the teaching</p>\n<p class="slindent">Of that one who delighted him in Mary</p>\n<p class="slindent">As doth the star of morning in the sun.</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;Such gallantry and grace</p>\n<p class="slindent">As there can be in Angel and in soul,</p>\n<p class="slindent">All is in him; and thus we fain would have it;</p></div>\n\n<div class="stanza"><p>Because he is the one who bore the palm</p>\n<p class="slindent">Down unto Mary, when the Son of God</p>\n<p class="slindent">To take our burden on himself decreed.</p></div>\n\n<div class="stanza"><p>But now come onward with thine eyes, as I</p>\n<p class="slindent">Speaking shall go, and note the great patricians</p>\n<p class="slindent">Of this most just and merciful of empires.</p></div>\n\n<div class="stanza"><p>Those two that sit above there most enrapture</p>\n<p class="slindent">As being very near unto Augusta,</p>\n<p class="slindent">Are as it were the two roots of this Rose.</p></div>\n\n<div class="stanza"><p>He who upon the left is near her placed</p>\n<p class="slindent">The father is, by whose audacious taste</p>\n<p class="slindent">The human species so much bitter tastes.</p></div>\n\n<div class="stanza"><p>Upon the right thou seest that ancient father</p>\n<p class="slindent">Of Holy Church, into whose keeping Christ</p>\n<p class="slindent">The keys committed of this lovely flower.</p></div>\n\n<div class="stanza"><p>And he who all the evil days beheld,</p>\n<p class="slindent">Before his death, of her the beauteous bride</p>\n<p class="slindent">Who with the spear and with the nails was won,</p></div>\n\n<div class="stanza"><p>Beside him sits, and by the other rests</p>\n<p class="slindent">That leader under whom on manna lived</p>\n<p class="slindent">The people ingrate, fickle, and stiff-necked.</p></div>\n\n<div class="stanza"><p>Opposite Peter seest thou Anna seated,</p>\n<p class="slindent">So well content to look upon her daughter,</p>\n<p class="slindent">Her eyes she moves not while she sings Hosanna.</p></div>\n\n<div class="stanza"><p>And opposite the eldest household father</p>\n<p class="slindent">Lucia sits, she who thy Lady moved</p>\n<p class="slindent">When to rush downward thou didst bend thy brows.</p></div>\n\n<div class="stanza"><p>But since the moments of thy vision fly,</p>\n<p class="slindent">Here will we make full stop, as a good tailor</p>\n<p class="slindent">Who makes the gown according to his cloth,</p></div>\n\n<div class="stanza"><p>And unto the first Love will turn our eyes,</p>\n<p class="slindent">That looking upon Him thou penetrate</p>\n<p class="slindent">As far as possible through his effulgence.</p></div>\n\n<div class="stanza"><p>Truly, lest peradventure thou recede,</p>\n<p class="slindent">Moving thy wings believing to advance,</p>\n<p class="slindent">By prayer behoves it that grace be obtained;</p></div>\n\n<div class="stanza"><p>Grace from that one who has the power to aid thee;</p>\n<p class="slindent">And thou shalt follow me with thy affection</p>\n<p class="slindent">That from my words thy heart turn not aside.&rdquo;</p></div>\n\n<div class="stanza"><p>And he began this holy orison.</p></div>','<p class="cantohead">Paradiso: Canto XXXIII</p>\n<div class="stanza"><p>&ldquo;Thou Virgin Mother, daughter of thy Son,</p>\n<p class="slindent">Humble and high beyond all other creature,</p>\n<p class="slindent">The limit fixed of the eternal counsel,</p></div>\n\n<div class="stanza"><p>Thou art the one who such nobility</p>\n<p class="slindent">To human nature gave, that its Creator</p>\n<p class="slindent">Did not disdain to make himself its creature.</p></div>\n\n<div class="stanza"><p>Within thy womb rekindled was the love,</p>\n<p class="slindent">By heat of which in the eternal peace</p>\n<p class="slindent">After such wise this flower has germinated.</p></div>\n\n<div class="stanza"><p>Here unto us thou art a noonday torch</p>\n<p class="slindent">Of charity, and below there among mortals</p>\n<p class="slindent">Thou art the living fountain-head of hope.</p></div>\n\n<div class="stanza"><p>Lady, thou art so great, and so prevailing,</p>\n<p class="slindent">That he who wishes grace, nor runs to thee,</p>\n<p class="slindent">His aspirations without wings would fly.</p></div>\n\n<div class="stanza"><p>Not only thy benignity gives succour</p>\n<p class="slindent">To him who asketh it, but oftentimes</p>\n<p class="slindent">Forerunneth of its own accord the asking.</p></div>\n\n<div class="stanza"><p>In thee compassion is, in thee is pity,</p>\n<p class="slindent">In thee magnificence; in thee unites</p>\n<p class="slindent">Whate&rsquo;er of goodness is in any creature.</p></div>\n\n<div class="stanza"><p>Now doth this man, who from the lowest depth</p>\n<p class="slindent">Of the universe as far as here has seen</p>\n<p class="slindent">One after one the spiritual lives,</p></div>\n\n<div class="stanza"><p>Supplicate thee through grace for so much power</p>\n<p class="slindent">That with his eyes he may uplift himself</p>\n<p class="slindent">Higher towards the uttermost salvation.</p></div>\n\n<div class="stanza"><p>And I, who never burned for my own seeing</p>\n<p class="slindent">More than I do for his, all of my prayers</p>\n<p class="slindent">Proffer to thee, and pray they come not short,</p></div>\n\n<div class="stanza"><p>That thou wouldst scatter from him every cloud</p>\n<p class="slindent">Of his mortality so with thy prayers,</p>\n<p class="slindent">That the Chief Pleasure be to him displayed.</p></div>\n\n<div class="stanza"><p>Still farther do I pray thee, Queen, who canst</p>\n<p class="slindent">Whate&rsquo;er thou wilt, that sound thou mayst preserve</p>\n<p class="slindent">After so great a vision his affections.</p></div>\n\n<div class="stanza"><p>Let thy protection conquer human movements;</p>\n<p class="slindent">See Beatrice and all the blessed ones</p>\n<p class="slindent">My prayers to second clasp their hands to thee!&rdquo;</p></div>\n\n<div class="stanza"><p>The eyes beloved and revered of God,</p>\n<p class="slindent">Fastened upon the speaker, showed to us</p>\n<p class="slindent">How grateful unto her are prayers devout;</p></div>\n\n<div class="stanza"><p>Then unto the Eternal Light they turned,</p>\n<p class="slindent">On which it is not credible could be</p>\n<p class="slindent">By any creature bent an eye so clear.</p></div>\n\n<div class="stanza"><p>And I, who to the end of all desires</p>\n<p class="slindent">Was now approaching, even as I ought</p>\n<p class="slindent">The ardour of desire within me ended.</p></div>\n\n<div class="stanza"><p>Bernard was beckoning unto me, and smiling,</p>\n<p class="slindent">That I should upward look; but I already</p>\n<p class="slindent">Was of my own accord such as he wished;</p></div>\n\n<div class="stanza"><p>Because my sight, becoming purified,</p>\n<p class="slindent">Was entering more and more into the ray</p>\n<p class="slindent">Of the High Light which of itself is true.</p></div>\n\n<div class="stanza"><p>From that time forward what I saw was greater</p>\n<p class="slindent">Than our discourse, that to such vision yields,</p>\n<p class="slindent">And yields the memory unto such excess.</p></div>\n\n<div class="stanza"><p>Even as he is who seeth in a dream,</p>\n<p class="slindent">And after dreaming the imprinted passion</p>\n<p class="slindent">Remains, and to his mind the rest returns not,</p></div>\n\n<div class="stanza"><p>Even such am I, for almost utterly</p>\n<p class="slindent">Ceases my vision, and distilleth yet</p>\n<p class="slindent">Within my heart the sweetness born of it;</p></div>\n\n<div class="stanza"><p>Even thus the snow is in the sun unsealed,</p>\n<p class="slindent">Even thus upon the wind in the light leaves</p>\n<p class="slindent">Were the soothsayings of the Sibyl lost.</p></div>\n\n<div class="stanza"><p>O Light Supreme, that dost so far uplift thee</p>\n<p class="slindent">From the conceits of mortals, to my mind</p>\n<p class="slindent">Of what thou didst appear re-lend a little,</p></div>\n\n<div class="stanza"><p>And make my tongue of so great puissance,</p>\n<p class="slindent">That but a single sparkle of thy glory</p>\n<p class="slindent">It may bequeath unto the future people;</p></div>\n\n<div class="stanza"><p>For by returning to my memory somewhat,</p>\n<p class="slindent">And by a little sounding in these verses,</p>\n<p class="slindent">More of thy victory shall be conceived!</p></div>\n\n<div class="stanza"><p>I think the keenness of the living ray</p>\n<p class="slindent">Which I endured would have bewildered me,</p>\n<p class="slindent">If but mine eyes had been averted from it;</p></div>\n\n<div class="stanza"><p>And I remember that I was more bold</p>\n<p class="slindent">On this account to bear, so that I joined</p>\n<p class="slindent">My aspect with the Glory Infinite.</p></div>\n\n<div class="stanza"><p>O grace abundant, by which I presumed</p>\n<p class="slindent">To fix my sight upon the Light Eternal,</p>\n<p class="slindent">So that the seeing I consumed therein!</p></div>\n\n<div class="stanza"><p>I saw that in its depth far down is lying</p>\n<p class="slindent">Bound up with love together in one volume,</p>\n<p class="slindent">What through the universe in leaves is scattered;</p></div>\n\n<div class="stanza"><p>Substance, and accident, and their operations,</p>\n<p class="slindent">All interfused together in such wise</p>\n<p class="slindent">That what I speak of is one simple light.</p></div>\n\n<div class="stanza"><p>The universal fashion of this knot</p>\n<p class="slindent">Methinks I saw, since more abundantly</p>\n<p class="slindent">In saying this I feel that I rejoice.</p></div>\n\n<div class="stanza"><p>One moment is more lethargy to me,</p>\n<p class="slindent">Than five and twenty centuries to the emprise</p>\n<p class="slindent">That startled Neptune with the shade of Argo!</p></div>\n\n<div class="stanza"><p>My mind in this wise wholly in suspense,</p>\n<p class="slindent">Steadfast, immovable, attentive gazed,</p>\n<p class="slindent">And evermore with gazing grew enkindled.</p></div>\n\n<div class="stanza"><p>In presence of that light one such becomes,</p>\n<p class="slindent">That to withdraw therefrom for other prospect</p>\n<p class="slindent">It is impossible he e&rsquo;er consent;</p></div>\n\n<div class="stanza"><p>Because the good, which object is of will,</p>\n<p class="slindent">Is gathered all in this, and out of it</p>\n<p class="slindent">That is defective which is perfect there.</p></div>\n\n<div class="stanza"><p>Shorter henceforward will my language fall</p>\n<p class="slindent">Of what I yet remember, than an infant&rsquo;s</p>\n<p class="slindent">Who still his tongue doth moisten at the breast.</p></div>\n\n<div class="stanza"><p>Not because more than one unmingled semblance</p>\n<p class="slindent">Was in the living light on which I looked,</p>\n<p class="slindent">For it is always what it was before;</p></div>\n\n<div class="stanza"><p>But through the sight, that fortified itself</p>\n<p class="slindent">In me by looking, one appearance only</p>\n<p class="slindent">To me was ever changing as I changed.</p></div>\n\n<div class="stanza"><p>Within the deep and luminous subsistence</p>\n<p class="slindent">Of the High Light appeared to me three circles,</p>\n<p class="slindent">Of threefold colour and of one dimension,</p></div>\n\n<div class="stanza"><p>And by the second seemed the first reflected</p>\n<p class="slindent">As Iris is by Iris, and the third</p>\n<p class="slindent">Seemed fire that equally from both is breathed.</p></div>\n\n<div class="stanza"><p>O how all speech is feeble and falls short</p>\n<p class="slindent">Of my conceit, and this to what I saw</p>\n<p class="slindent">Is such, &rsquo;tis not enough to call it little!</p></div>\n\n<div class="stanza"><p>O Light Eterne, sole in thyself that dwellest,</p>\n<p class="slindent">Sole knowest thyself, and, known unto thyself</p>\n<p class="slindent">And knowing, lovest and smilest on thyself!</p></div>\n\n<div class="stanza"><p>That circulation, which being thus conceived</p>\n<p class="slindent">Appeared in thee as a reflected light,</p>\n<p class="slindent">When somewhat contemplated by mine eyes,</p></div>\n\n<div class="stanza"><p>Within itself, of its own very colour</p>\n<p class="slindent">Seemed to me painted with our effigy,</p>\n<p class="slindent">Wherefore my sight was all absorbed therein.</p></div>\n\n<div class="stanza"><p>As the geometrician, who endeavours</p>\n<p class="slindent">To square the circle, and discovers not,</p>\n<p class="slindent">By taking thought, the principle he wants,</p></div>\n\n<div class="stanza"><p>Even such was I at that new apparition;</p>\n<p class="slindent">I wished to see how the image to the circle</p>\n<p class="slindent">Conformed itself, and how it there finds place;</p></div>\n\n<div class="stanza"><p>But my own wings were not enough for this,</p>\n<p class="slindent">Had it not been that then my mind there smote</p>\n<p class="slindent">A flash of lightning, wherein came its wish.</p></div>\n\n<div class="stanza"><p>Here vigour failed the lofty fantasy:</p>\n<p class="slindent">But now was turning my desire and will,</p>\n<p class="slindent">Even as a wheel that equally is moved,</p></div>\n\n<div class="stanza"><p>The Love which moves the sun and the other stars.</p></div>']};

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
/*! VelocityJS.org (1.3.1). (C) 2014 Julian Shapiro. MIT @license: en.wikipedia.org/wiki/MIT_License */

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
				var offsetParent = elem.offsetParent || document;

				while (offsetParent && (offsetParent.nodeType.toLowerCase !== "html" && offsetParent.style.position === "static")) {
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
	} else if (typeof define === "function" && define.amd) {
		define(factory);
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

		function sanitizeElements(elements) {
			/* Unwrap jQuery/Zepto objects. */
			if (Type.isWrapped(elements)) {
				elements = [].slice.call(elements);
				/* Wrap a single element in an array so that $.each() can iterate with the element instead of its node's children. */
			} else if (Type.isNode(elements)) {
				elements = [elements];
			}

			return elements;
		}

		var Type = {
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
			/* Copyright Martin Bohm. MIT License: https://gist.github.com/Tomalak/818a78a226a0738eaade */
			isNodeList: function(variable) {
				return typeof variable === "object" &&
						/^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(variable)) &&
						variable.length !== undefined &&
						(variable.length === 0 || (typeof variable[0] === "object" && variable[0].nodeType > 0));
			},
			/* Determine if variable is a wrapped jQuery or Zepto element. */
			isWrapped: function(variable) {
				return variable && (variable.jquery || (window.Zepto && window.Zepto.zepto.isZ(variable)));
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
				calls: []
			},
			/* Velocity's custom CSS stack. Made global for unit testing. */
			CSS: { /* Defined below. */},
			/* A shim of the jQuery utility functions used by Velocity -- provided by Velocity's optional jQuery shim. */
			Utilities: $,
			/* Container for the user's custom animation redirects that are referenced by name in place of the properties map argument. */
			Redirects: { /* Manually registered by the user. */},
			Easings: { /* Defined below. */},
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
				_cacheValues: true
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
			version: {major: 1, minor: 3, patch: 1},
			/* Set to 1 or 2 (most verbose) to output debug info to console. */
			debug: false
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
				transforms3D: ["transformPerspective", "translateZ", "scaleZ", "rotateX", "rotateY"]
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
					if (element.classList) {
						element.classList.add(className);
					} else {
						element.className += (element.className.length ? " " : "") + className;
					}
				},
				removeClass: function(element, className) {
					if (element.classList) {
						element.classList.remove(className);
					} else {
						element.className = element.className.toString().replace(new RegExp("(^|\\s)" + className.split(" ").join("|") + "(\\s|$)", "gi"), " ");
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
						value = Velocity.CSS.getPropertyValue(element, arg2);
					}
					/* Set property value. */
				} else {
					/* sPV returns an array of the normalized propertyName/propertyValue pair used to update the DOM. */
					var adjustedSet = Velocity.CSS.setPropertyValue(element, arg2, arg3);

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

			elements = sanitizeElements(elements);

			if (!elements) {
				return;
			}

			if (syntacticSugar) {
				propertiesMap = arguments[0].properties || arguments[0].p;
				options = arguments[0].options || arguments[0].o;
			} else {
				propertiesMap = arguments[argumentIndex];
				options = arguments[argumentIndex + 1];
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
			/* Note: The stop and finish actions do not accept animation options, and are therefore excluded from this check. */
			if (!/^(stop|finish|finishAll)$/i.test(propertiesMap) && !$.isPlainObject(options)) {
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

			/*********************
			 Action Detection
			 *********************/

			/* Velocity's behavior is categorized into "actions": Elements can either be specially scrolled into view,
			 or they can be started, stopped, or reversed. If a literal or referenced properties map is passed in as Velocity's
			 first argument, the associated action is "start". Alternatively, "scroll", "reverse", or "stop" can be passed in instead of a properties map. */
			var action;

			switch (propertiesMap) {
				case "scroll":
					action = "scroll";
					break;

				case "reverse":
					action = "reverse";
					break;

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
						 The setTimeout is stored so that it can be subjected to clearTimeout() if this animation is prematurely stopped via Velocity's "stop" command. */
						Data(element).delayTimer = {
							setTimeout: setTimeout(next, parseFloat(opts.delay)),
							next: next
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
									/* Two or three-item array: If the second item is a non-hex string or an array, treat it as an easing. */
								} else if ((Type.isString(valueData[1]) && !CSS.RegEx.isHex.test(valueData[1])) || Type.isArray(valueData[1])) {
									easing = skipResolvingEasing ? valueData[1] : getEasing(valueData[1], opts.duration);

									/* Don't bother validating startValue's value now since the ensuing property cycling logic inherently does that. */
									if (valueData[2] !== undefined) {
										startValue = valueData[2];
									}
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

						/* Cycle through each property in the map, looking for shorthand color properties (e.g. "color" as opposed to "colorRed"). Inject the corresponding
						 colorRed, colorGreen, and colorBlue RGB component tweens into the propertiesMap (which Velocity understands) and remove the shorthand property. */
						$.each(propertiesMap, function(property, value) {
							/* Find shorthand color properties that have been passed a hex string. */
							if (RegExp("^" + CSS.Lists.colors.join("$|^") + "$").test(CSS.Names.camelCase(property))) {
								/* Parse the value data for each shorthand. */
								var valueData = parsePropertyValue(value, true),
										endValue = valueData[0],
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

										propertiesMap[CSS.Names.camelCase(property) + colorComponents[i]] = dataArray;
									}

									/* Remove the intermediary shorthand property entry now that we've processed it. */
									delete propertiesMap[property];
								}
							}
						});

						/* Create a tween out of each property, and append its associated data to tweensContainer. */
						for (var property in propertiesMap) {

							if (!propertiesMap.hasOwnProperty(property)) {
								continue;
							}
							/**************************
							 Start Value Sourcing
							 **************************/

							/* Parse out endValue, easing, and startValue from the property's data. */
							var valueData = parsePropertyValue(propertiesMap[property]),
									endValue = valueData[0],
									easing = valueData[1],
									startValue = valueData[2];

							/* Now that the original property name's format has been used for the parsePropertyValue() lookup above,
							 we force the property to its camelCase styling to normalize it for manipulation. */
							property = CSS.Names.camelCase(property);

							/* In case this property is a hook, there are circumstances where we will intend to work on the hook's root property and not the hooked subproperty. */
							var rootProperty = CSS.Hooks.getRoot(property),
									rootPropertyValue = false;

							/* Other than for the dummy tween property, properties that are not supported by the browser (and do not have an associated normalization) will
							 inherently produce no style changes when set, so they are skipped in order to decrease animation tick overhead.
							 Property support is determined via prefixCheck(), which returns a false flag when no supported is detected. */
							/* Note: Since SVG elements have some of their properties directly applied as HTML attributes,
							 there is no way to check for their explicit browser support, and so we skip skip this check for them. */
							if ((!data || !data.isSVG) && rootProperty !== "tween" && CSS.Names.prefixCheck(rootProperty)[1] === false && CSS.Normalizations.registered[rootProperty] === undefined) {
								if (Velocity.debug) {
									console.log("Skipping [" + rootProperty + "] due to a lack of browser support.");
								}
								continue;
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

							if (Velocity.debug) {
								console.log("tweensContainer (" + property + "): " + JSON.stringify(tweensContainer[property]), element);
							}
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
							Velocity.State.calls.push([call, elements, opts, null, promiseData.resolver]);

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
						setTimeout(buildQueue, opts.delay);
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
			document.addEventListener("visibilitychange", function() {
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
			});
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
				/* We ignore RAF's high resolution timestamp since it can be significantly offset when the browser is
				 under high stress; we opt for choppiness over allowing the browser to drop huge chunks of frames. */
				var timeCurrent = (new Date()).getTime();

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
							tweenDummyValue = null;

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

					/* The tween's completion percentage is relative to the tween's start time, not the tween's start value
					 (which would result in unpredictable tween durations since JavaScript's timers are not particularly accurate).
					 Accordingly, we ensure that percentComplete does not exceed 1. */
					var percentComplete = Math.min((timeCurrent - timeStart) / opts.duration, 1);

					/**********************
					 Element Iteration
					 **********************/

					/* For every call, iterate through each of the elements in its set. */
					for (var j = 0, callLength = call.length; j < callLength; j++) {
						var tweensContainer = call[j],
								element = tweensContainer.element;

						/* Check to see if this element has been deleted midway through the animation by checking for the
						 continued existence of its data cache. If it's gone, skip animating this element. */
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

								/* If this is the last tick pass (if we've reached 100% completion for this tween),
								 ensure that currentValue is explicitly set to its target endValue so that it's not subjected to any rounding. */
								if (percentComplete === 1) {
									currentValue = tween.endValue;
									/* Otherwise, calculate currentValue based on the current delta from startValue. */
								} else {
									var tweenDelta = tween.endValue - tween.startValue;
									currentValue = tween.startValue + (tweenDelta * easing(percentComplete, opts, tweenDelta));

									/* If no value change is occurring, don't proceed with DOM updating. */
									if (!firstTick && (currentValue === tween.currentValue)) {
										continue;
									}
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
											tween.currentValue + (parseFloat(currentValue) === 0 ? "" : tween.unitType),
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
						computedValues = {height: "", marginTop: "", marginBottom: "", paddingTop: "", paddingBottom: ""},
				inlineValues = {};

				if (opts.display === undefined) {
					/* Show the element before slideDown begins and hide the element after slideUp completes. */
					/* Note: Inline elements cannot have dimensions animated, so they're reverted to inline-block. */
					opts.display = (direction === "Down" ? (Velocity.CSS.Values.getDisplayType(element) === "inline" ? "inline-block" : "block") : "none");
				}

				opts.begin = function() {
					/* If the user passed in a begin callback, fire it now. */
					if (begin) {
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
						var propertyValue = Velocity.CSS.getPropertyValue(element, property);
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
					if (complete) {
						complete.call(elements, elements);
					}
					if (promiseData) {
						promiseData.resolver(elements);
					}
				};

				Velocity(element, computedValues, opts);
			};
		});

		/* fadeIn, fadeOut */
		$.each(["In", "Out"], function(i, direction) {
			Velocity.Redirects["fade" + direction] = function(element, options, elementsIndex, elementsSize, elements, promiseData) {
				var opts = $.extend({}, options),
						originalComplete = opts.complete,
						propertiesMap = {opacity: (direction === "In") ? 1 : 0};

				/* Since redirects are triggered individually for each element in the animated set, avoid repeatedly triggering
				 callbacks by firing them only when the final element has been reached. */
				if (elementsIndex !== elementsSize - 1) {
					opts.complete = opts.begin = null;
				} else {
					opts.complete = function() {
						if (originalComplete) {
							originalComplete.call(elements, elements);
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
	}((window.jQuery || window.Zepto || window), window, document);
}));

/******************
 Known Issues
 ******************/

/* The CSS spec mandates that the translateX/Y/Z transforms are %-relative to the element itself -- not its parent.
 Velocity, however, doesn't make this distinction. Thus, converting to or from the % unit with these subproperties
 will produce an inaccurate conversion value. The same issue exists with the cx/cy attributes of SVG circles and ellipses. */

},{}]},{},[4])