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
var bookdata = require("./purgatorio/bookdata");
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

},{"./modules/app":1,"./modules/appdata":2,"./purgatorio/bookdata":5}],5:[function(require,module,exports){
"use strict";

// the spine for the book

module.exports = {

	bookname: 'purgatorio',
	booktitle: "Purgatorio",
	bookauthor: "Dante Alighieri",
	description: "<p>The adventure-packed sequel to <em>Inferno</em>.",

	cantotitles: [// this is canto sequence
	"Title page", "Canto 1", "Canto 2", "Canto 3", "Canto 4", "Canto 5", "Canto 6", "Canto 7", "Canto 8", "Canto 9", "Canto 10", "Canto 11", "Canto 12", "Canto 13", "Canto 14", "Canto 15", "Canto 16", "Canto 17", "Canto 18", "Canto 19", "Canto 20", "Canto 21", "Canto 22", "Canto 23", "Canto 24", "Canto 25", "Canto 26", "Canto 27", "Canto 28", "Canto 29", "Canto 30", "Canto 31", "Canto 32", "Canto 33"],

	translationdata: [// this is translation sequence
	{ "translationid": "dante",
		"order": 0 }, { "translationid": "longfellow",
		"order": 1 } /*,
               /*,
               {"translationid":"wright",
               "order":3},
               {"translationid":"carlyle",
               "order":4}*/
	],

	textdata: [// set up translations
	require("./translations/dante"), require("./translations/longfellow") /*,
                                                                       require("./translations/norton"),
                                                                       require("./translations/cary"),
                                                                       require("./translations/wright"),
                                                                       require("./translations/carlyle")*/
	]
};

},{"./translations/dante":6,"./translations/longfellow":7}],6:[function(require,module,exports){
// purgatorio/italian.js
"use strict";module.exports={bookname:'purgatorio',author:'Dante Alighieri',translationid:"dante",title:'Purgatorio',translation:false,source:'<a href="http://www.gutenberg.org/ebooks/1010">Project Gutenberg</a>',translationshortname:"Dante",translationfullname:"Dante Alighieri",translationclass:"poetry",text:['<p class="title">Purgatorio</p>\n\t<p class="author">Dante Alighieri</p>','<p class="cantohead">Canto I</p>\n\n<div class="stanza"><p>Per correr miglior acque alza le vele</p>\n<p>omai la navicella del mio ingegno,</p>\n<p>che lascia dietro a s&eacute; mar s&igrave; crudele;</p></div>\n\n<div class="stanza"><p>e canter&ograve; di quel secondo regno</p>\n<p>dove l&rsquo;umano spirito si purga</p>\n<p>e di salire al ciel diventa degno.</p></div>\n\n<div class="stanza"><p>Ma qui la morta poes&igrave; resurga,</p>\n<p>o sante Muse, poi che vostro sono;</p>\n<p>e qui Cal&iuml;op&egrave; alquanto surga,</p></div>\n\n<div class="stanza"><p>seguitando il mio canto con quel suono</p>\n<p>di cui le Piche misere sentiro</p>\n<p>lo colpo tal, che disperar perdono.</p></div>\n\n<div class="stanza"><p>Dolce color d&rsquo;or&iuml;ental zaffiro,</p>\n<p>che s&rsquo;accoglieva nel sereno aspetto</p>\n<p>del mezzo, puro infino al primo giro,</p></div>\n\n<div class="stanza"><p>a li occhi miei ricominci&ograve; diletto,</p>\n<p>tosto ch&rsquo;io usci&rsquo; fuor de l&rsquo;aura morta</p>\n<p>che m&rsquo;avea contristati li occhi e &rsquo;l petto.</p></div>\n\n<div class="stanza"><p>Lo bel pianeto che d&rsquo;amar conforta</p>\n<p>faceva tutto rider l&rsquo;or&iuml;ente,</p>\n<p>velando i Pesci ch&rsquo;erano in sua scorta.</p></div>\n\n<div class="stanza"><p>I&rsquo; mi volsi a man destra, e puosi mente</p>\n<p>a l&rsquo;altro polo, e vidi quattro stelle</p>\n<p>non viste mai fuor ch&rsquo;a la prima gente.</p></div>\n\n<div class="stanza"><p>Goder pareva &rsquo;l ciel di lor fiammelle:</p>\n<p>oh settentr&iuml;onal vedovo sito,</p>\n<p>poi che privato se&rsquo; di mirar quelle!</p></div>\n\n<div class="stanza"><p>Com&rsquo; io da loro sguardo fui partito,</p>\n<p>un poco me volgendo a l &rsquo;altro polo,</p>\n<p>l&agrave; onde &rsquo;l Carro gi&agrave; era sparito,</p></div>\n\n<div class="stanza"><p>vidi presso di me un veglio solo,</p>\n<p>degno di tanta reverenza in vista,</p>\n<p>che pi&ugrave; non dee a padre alcun figliuolo.</p></div>\n\n<div class="stanza"><p>Lunga la barba e di pel bianco mista</p>\n<p>portava, a&rsquo; suoi capelli simigliante,</p>\n<p>de&rsquo; quai cadeva al petto doppia lista.</p></div>\n\n<div class="stanza"><p>Li raggi de le quattro luci sante</p>\n<p>fregiavan s&igrave; la sua faccia di lume,</p>\n<p>ch&rsquo;i&rsquo; &rsquo;l vedea come &rsquo;l sol fosse davante.</p></div>\n\n<div class="stanza"><p>&laquo;Chi siete voi che contro al cieco fiume</p>\n<p>fuggita avete la pregione etterna?&raquo;,</p>\n<p>diss&rsquo; el, movendo quelle oneste piume.</p></div>\n\n<div class="stanza"><p>&laquo;Chi v&rsquo;ha guidati, o che vi fu lucerna,</p>\n<p>uscendo fuor de la profonda notte</p>\n<p>che sempre nera fa la valle inferna?</p></div>\n\n<div class="stanza"><p>Son le leggi d&rsquo;abisso cos&igrave; rotte?</p>\n<p>o &egrave; mutato in ciel novo consiglio,</p>\n<p>che, dannati, venite a le mie grotte?&raquo;.</p></div>\n\n<div class="stanza"><p>Lo duca mio allor mi di&egrave; di piglio,</p>\n<p>e con parole e con mani e con cenni</p>\n<p>reverenti mi f&eacute; le gambe e &rsquo;l ciglio.</p></div>\n\n<div class="stanza"><p>Poscia rispuose lui: &laquo;Da me non venni:</p>\n<p>donna scese del ciel, per li cui prieghi</p>\n<p>de la mia compagnia costui sovvenni.</p></div>\n\n<div class="stanza"><p>Ma da ch&rsquo;&egrave; tuo voler che pi&ugrave; si spieghi</p>\n<p>di nostra condizion com&rsquo; ell&rsquo; &egrave; vera,</p>\n<p>esser non puote il mio che a te si nieghi.</p></div>\n\n<div class="stanza"><p>Questi non vide mai l&rsquo;ultima sera;</p>\n<p>ma per la sua follia le fu s&igrave; presso,</p>\n<p>che molto poco tempo a volger era.</p></div>\n\n<div class="stanza"><p>S&igrave; com&rsquo; io dissi, fui mandato ad esso</p>\n<p>per lui campare; e non l&igrave; era altra via</p>\n<p>che questa per la quale i&rsquo; mi son messo.</p></div>\n\n<div class="stanza"><p>Mostrata ho lui tutta la gente ria;</p>\n<p>e ora intendo mostrar quelli spirti</p>\n<p>che purgan s&eacute; sotto la tua bal&igrave;a.</p></div>\n\n<div class="stanza"><p>Com&rsquo; io l&rsquo;ho tratto, saria lungo a dirti;</p>\n<p>de l&rsquo;alto scende virt&ugrave; che m&rsquo;aiuta</p>\n<p>conducerlo a vederti e a udirti.</p></div>\n\n<div class="stanza"><p>Or ti piaccia gradir la sua venuta:</p>\n<p>libert&agrave; va cercando, ch&rsquo;&egrave; s&igrave; cara,</p>\n<p>come sa chi per lei vita rifiuta.</p></div>\n\n<div class="stanza"><p>Tu &rsquo;l sai, ch&eacute; non ti fu per lei amara</p>\n<p>in Utica la morte, ove lasciasti</p>\n<p>la vesta ch&rsquo;al gran d&igrave; sar&agrave; s&igrave; chiara.</p></div>\n\n<div class="stanza"><p>Non son li editti etterni per noi guasti,</p>\n<p>ch&eacute; questi vive e Min&ograve;s me non lega;</p>\n<p>ma son del cerchio ove son li occhi casti</p></div>\n\n<div class="stanza"><p>di Marzia tua, che &rsquo;n vista ancor ti priega,</p>\n<p>o santo petto, che per tua la tegni:</p>\n<p>per lo suo amore adunque a noi ti piega.</p></div>\n\n<div class="stanza"><p>Lasciane andar per li tuoi sette regni;</p>\n<p>grazie riporter&ograve; di te a lei,</p>\n<p>se d&rsquo;esser mentovato l&agrave; gi&ugrave; degni&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Marz&iuml;a piacque tanto a li occhi miei</p>\n<p>mentre ch&rsquo;i&rsquo; fu&rsquo; di l&agrave;&raquo;, diss&rsquo; elli allora,</p>\n<p>&laquo;che quante grazie volse da me, fei.</p></div>\n\n<div class="stanza"><p>Or che di l&agrave; dal mal fiume dimora,</p>\n<p>pi&ugrave; muover non mi pu&ograve;, per quella legge</p>\n<p>che fatta fu quando me n&rsquo;usci&rsquo; fora.</p></div>\n\n<div class="stanza"><p>Ma se donna del ciel ti move e regge,</p>\n<p>come tu di&rsquo;, non c&rsquo;&egrave; mestier lusinghe:</p>\n<p>bastisi ben che per lei mi richegge.</p></div>\n\n<div class="stanza"><p>Va dunque, e fa che tu costui ricinghe</p>\n<p>d&rsquo;un giunco schietto e che li lavi &rsquo;l viso,</p>\n<p>s&igrave; ch&rsquo;ogne sucidume quindi stinghe;</p></div>\n\n<div class="stanza"><p>ch&eacute; non si converria, l&rsquo;occhio sorpriso</p>\n<p>d&rsquo;alcuna nebbia, andar dinanzi al primo</p>\n<p>ministro, ch&rsquo;&egrave; di quei di paradiso.</p></div>\n\n<div class="stanza"><p>Questa isoletta intorno ad imo ad imo,</p>\n<p>l&agrave; gi&ugrave; col&agrave; dove la batte l&rsquo;onda,</p>\n<p>porta di giunchi sovra &rsquo;l molle limo:</p></div>\n\n<div class="stanza"><p>null&rsquo; altra pianta che facesse fronda</p>\n<p>o indurasse, vi puote aver vita,</p>\n<p>per&ograve; ch&rsquo;a le percosse non seconda.</p></div>\n\n<div class="stanza"><p>Poscia non sia di qua vostra reddita;</p>\n<p>lo sol vi mosterr&agrave;, che surge omai,</p>\n<p>prendere il monte a pi&ugrave; lieve salita&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; spar&igrave;; e io s&ugrave; mi levai</p>\n<p>sanza parlare, e tutto mi ritrassi</p>\n<p>al duca mio, e li occhi a lui drizzai.</p></div>\n\n<div class="stanza"><p>El cominci&ograve;: &laquo;Figliuol, segui i miei passi:</p>\n<p>volgianci in dietro, ch&eacute; di qua dichina</p>\n<p>questa pianura a&rsquo; suoi termini bassi&raquo;.</p></div>\n\n<div class="stanza"><p>L&rsquo;alba vinceva l&rsquo;ora mattutina</p>\n<p>che fuggia innanzi, s&igrave; che di lontano</p>\n<p>conobbi il tremolar de la marina.</p></div>\n\n<div class="stanza"><p>Noi andavam per lo solingo piano</p>\n<p>com&rsquo; om che torna a la perduta strada,</p>\n<p>che &rsquo;nfino ad essa li pare ire in vano.</p></div>\n\n<div class="stanza"><p>Quando noi fummo l&agrave; &rsquo;ve la rugiada</p>\n<p>pugna col sole, per essere in parte</p>\n<p>dove, ad orezza, poco si dirada,</p></div>\n\n<div class="stanza"><p>ambo le mani in su l&rsquo;erbetta sparte</p>\n<p>soavemente &rsquo;l mio maestro pose:</p>\n<p>ond&rsquo; io, che fui accorto di sua arte,</p></div>\n\n<div class="stanza"><p>porsi ver&rsquo; lui le guance lagrimose;</p>\n<p>ivi mi fece tutto discoverto</p>\n<p>quel color che l&rsquo;inferno mi nascose.</p></div>\n\n<div class="stanza"><p>Venimmo poi in sul lito diserto,</p>\n<p>che mai non vide navicar sue acque</p>\n<p>omo, che di tornar sia poscia esperto.</p></div>\n\n<div class="stanza"><p>Quivi mi cinse s&igrave; com&rsquo; altrui piacque:</p>\n<p>oh maraviglia! ch&eacute; qual elli scelse</p>\n<p>l&rsquo;umile pianta, cotal si rinacque</p></div>\n\n<div class="stanza"><p>subitamente l&agrave; onde l&rsquo;avelse.</p></div>','<p class="cantohead">Canto II</p>\n\n<div class="stanza"><p>Gi&agrave; era &rsquo;l sole a l&rsquo;orizzonte giunto</p>\n<p>lo cui merid&iuml;an cerchio coverchia</p>\n<p>Ierusal&egrave;m col suo pi&ugrave; alto punto;</p></div>\n\n<div class="stanza"><p>e la notte, che opposita a lui cerchia,</p>\n<p>uscia di Gange fuor con le Bilance,</p>\n<p>che le caggion di man quando soverchia;</p></div>\n\n<div class="stanza"><p>s&igrave; che le bianche e le vermiglie guance,</p>\n<p>l&agrave; dov&rsquo; i&rsquo; era, de la bella Aurora</p>\n<p>per troppa etate divenivan rance.</p></div>\n\n<div class="stanza"><p>Noi eravam lunghesso mare ancora,</p>\n<p>come gente che pensa a suo cammino,</p>\n<p>che va col cuore e col corpo dimora.</p></div>\n\n<div class="stanza"><p>Ed ecco, qual, sorpreso dal mattino,</p>\n<p>per li grossi vapor Marte rosseggia</p>\n<p>gi&ugrave; nel ponente sovra &rsquo;l suol marino,</p></div>\n\n<div class="stanza"><p>cotal m&rsquo;apparve, s&rsquo;io ancor lo veggia,</p>\n<p>un lume per lo mar venir s&igrave; ratto,</p>\n<p>che &rsquo;l muover suo nessun volar pareggia.</p></div>\n\n<div class="stanza"><p>Dal qual com&rsquo; io un poco ebbi ritratto</p>\n<p>l&rsquo;occhio per domandar lo duca mio,</p>\n<p>rividil pi&ugrave; lucente e maggior fatto.</p></div>\n\n<div class="stanza"><p>Poi d&rsquo;ogne lato ad esso m&rsquo;appario</p>\n<p>un non sapeva che bianco, e di sotto</p>\n<p>a poco a poco un altro a lui usc&igrave;o.</p></div>\n\n<div class="stanza"><p>Lo mio maestro ancor non facea motto,</p>\n<p>mentre che i primi bianchi apparver ali;</p>\n<p>allor che ben conobbe il galeotto,</p></div>\n\n<div class="stanza"><p>grid&ograve;: &laquo;Fa, fa che le ginocchia cali.</p>\n<p>Ecco l&rsquo;angel di Dio: piega le mani;</p>\n<p>omai vedrai di s&igrave; fatti officiali.</p></div>\n\n<div class="stanza"><p>Vedi che sdegna li argomenti umani,</p>\n<p>s&igrave; che remo non vuol, n&eacute; altro velo</p>\n<p>che l&rsquo;ali sue, tra liti s&igrave; lontani.</p></div>\n\n<div class="stanza"><p>Vedi come l&rsquo;ha dritte verso &rsquo;l cielo,</p>\n<p>trattando l&rsquo;aere con l&rsquo;etterne penne,</p>\n<p>che non si mutan come mortal pelo&raquo;.</p></div>\n\n<div class="stanza"><p>Poi, come pi&ugrave; e pi&ugrave; verso noi venne</p>\n<p>l&rsquo;uccel divino, pi&ugrave; chiaro appariva:</p>\n<p>per che l&rsquo;occhio da presso nol sostenne,</p></div>\n\n<div class="stanza"><p>ma chinail giuso; e quei sen venne a riva</p>\n<p>con un vasello snelletto e leggero,</p>\n<p>tanto che l&rsquo;acqua nulla ne &rsquo;nghiottiva.</p></div>\n\n<div class="stanza"><p>Da poppa stava il celestial nocchiero,</p>\n<p>tal che faria beato pur descripto;</p>\n<p>e pi&ugrave; di cento spirti entro sediero.</p></div>\n\n<div class="stanza"><p>&lsquo;In exitu Isr&auml;el de Aegypto&rsquo;</p>\n<p>cantavan tutti insieme ad una voce</p>\n<p>con quanto di quel salmo &egrave; poscia scripto.</p></div>\n\n<div class="stanza"><p>Poi fece il segno lor di santa croce;</p>\n<p>ond&rsquo; ei si gittar tutti in su la piaggia:</p>\n<p>ed el sen g&igrave;, come venne, veloce.</p></div>\n\n<div class="stanza"><p>La turba che rimase l&igrave;, selvaggia</p>\n<p>parea del loco, rimirando intorno</p>\n<p>come colui che nove cose assaggia.</p></div>\n\n<div class="stanza"><p>Da tutte parti saettava il giorno</p>\n<p>lo sol, ch&rsquo;avea con le saette conte</p>\n<p>di mezzo &rsquo;l ciel cacciato Capricorno,</p></div>\n\n<div class="stanza"><p>quando la nova gente alz&ograve; la fronte</p>\n<p>ver&rsquo; noi, dicendo a noi: &laquo;Se voi sapete,</p>\n<p>mostratene la via di gire al monte&raquo;.</p></div>\n\n<div class="stanza"><p>E Virgilio rispuose: &laquo;Voi credete</p>\n<p>forse che siamo esperti d&rsquo;esto loco;</p>\n<p>ma noi siam peregrin come voi siete.</p></div>\n\n<div class="stanza"><p>Dianzi venimmo, innanzi a voi un poco,</p>\n<p>per altra via, che fu s&igrave; aspra e forte,</p>\n<p>che lo salire omai ne parr&agrave; gioco&raquo;.</p></div>\n\n<div class="stanza"><p>L&rsquo;anime, che si fuor di me accorte,</p>\n<p>per lo spirare, ch&rsquo;i&rsquo; era ancor vivo,</p>\n<p>maravigliando diventaro smorte.</p></div>\n\n<div class="stanza"><p>E come a messagger che porta ulivo</p>\n<p>tragge la gente per udir novelle,</p>\n<p>e di calcar nessun si mostra schivo,</p></div>\n\n<div class="stanza"><p>cos&igrave; al viso mio s&rsquo;affisar quelle</p>\n<p>anime fortunate tutte quante,</p>\n<p>quasi obl&iuml;ando d&rsquo;ire a farsi belle.</p></div>\n\n<div class="stanza"><p>Io vidi una di lor trarresi avante</p>\n<p>per abbracciarmi con s&igrave; grande affetto,</p>\n<p>che mosse me a far lo somigliante.</p></div>\n\n<div class="stanza"><p>Ohi ombre vane, fuor che ne l&rsquo;aspetto!</p>\n<p>tre volte dietro a lei le mani avvinsi,</p>\n<p>e tante mi tornai con esse al petto.</p></div>\n\n<div class="stanza"><p>Di maraviglia, credo, mi dipinsi;</p>\n<p>per che l&rsquo;ombra sorrise e si ritrasse,</p>\n<p>e io, seguendo lei, oltre mi pinsi.</p></div>\n\n<div class="stanza"><p>Soavemente disse ch&rsquo;io posasse;</p>\n<p>allor conobbi chi era, e pregai</p>\n<p>che, per parlarmi, un poco s&rsquo;arrestasse.</p></div>\n\n<div class="stanza"><p>Rispuosemi: &laquo;Cos&igrave; com&rsquo; io t&rsquo;amai</p>\n<p>nel mortal corpo, cos&igrave; t&rsquo;amo sciolta:</p>\n<p>per&ograve; m&rsquo;arresto; ma tu perch&eacute; vai?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Casella mio, per tornar altra volta</p>\n<p>l&agrave; dov&rsquo; io son, fo io questo v&iuml;aggio&raquo;,</p>\n<p>diss&rsquo; io; &laquo;ma a te com&rsquo; &egrave; tanta ora tolta?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Nessun m&rsquo;&egrave; fatto oltraggio,</p>\n<p>se quei che leva quando e cui li piace,</p>\n<p>pi&ugrave; volte m&rsquo;ha negato esto passaggio;</p></div>\n\n<div class="stanza"><p>ch&eacute; di giusto voler lo suo si face:</p>\n<p>veramente da tre mesi elli ha tolto</p>\n<p>chi ha voluto intrar, con tutta pace.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io, ch&rsquo;era ora a la marina v&ograve;lto</p>\n<p>dove l&rsquo;acqua di Tevero s&rsquo;insala,</p>\n<p>benignamente fu&rsquo; da lui ricolto.</p></div>\n\n<div class="stanza"><p>A quella foce ha elli or dritta l&rsquo;ala,</p>\n<p>per&ograve; che sempre quivi si ricoglie</p>\n<p>qual verso Acheronte non si cala&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Se nuova legge non ti toglie</p>\n<p>memoria o uso a l&rsquo;amoroso canto</p>\n<p>che mi solea quetar tutte mie doglie,</p></div>\n\n<div class="stanza"><p>di ci&ograve; ti piaccia consolare alquanto</p>\n<p>l&rsquo;anima mia, che, con la sua persona</p>\n<p>venendo qui, &egrave; affannata tanto!&raquo;.</p></div>\n\n<div class="stanza"><p>&lsquo;Amor che ne la mente mi ragiona&rsquo;</p>\n<p>cominci&ograve; elli allor s&igrave; dolcemente,</p>\n<p>che la dolcezza ancor dentro mi suona.</p></div>\n\n<div class="stanza"><p>Lo mio maestro e io e quella gente</p>\n<p>ch&rsquo;eran con lui parevan s&igrave; contenti,</p>\n<p>come a nessun toccasse altro la mente.</p></div>\n\n<div class="stanza"><p>Noi eravam tutti fissi e attenti</p>\n<p>a le sue note; ed ecco il veglio onesto</p>\n<p>gridando: &laquo;Che &egrave; ci&ograve;, spiriti lenti?</p></div>\n\n<div class="stanza"><p>qual negligenza, quale stare &egrave; questo?</p>\n<p>Correte al monte a spogliarvi lo scoglio</p>\n<p>ch&rsquo;esser non lascia a voi Dio manifesto&raquo;.</p></div>\n\n<div class="stanza"><p>Come quando, cogliendo biado o loglio,</p>\n<p>li colombi adunati a la pastura,</p>\n<p>queti, sanza mostrar l&rsquo;usato orgoglio,</p></div>\n\n<div class="stanza"><p>se cosa appare ond&rsquo; elli abbian paura,</p>\n<p>subitamente lasciano star l&rsquo;esca,</p>\n<p>perch&rsquo; assaliti son da maggior cura;</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; io quella masnada fresca</p>\n<p>lasciar lo canto, e fuggir ver&rsquo; la costa,</p>\n<p>com&rsquo; om che va, n&eacute; sa dove r&iuml;esca;</p></div>\n\n<div class="stanza"><p>n&eacute; la nostra partita fu men tosta.</p></div>','<p class="cantohead">Canto III</p>\n\n<div class="stanza"><p>Avvegna che la subitana fuga</p>\n<p>dispergesse color per la campagna,</p>\n<p>rivolti al monte ove ragion ne fruga,</p></div>\n\n<div class="stanza"><p>i&rsquo; mi ristrinsi a la fida compagna:</p>\n<p>e come sare&rsquo; io sanza lui corso?</p>\n<p>chi m&rsquo;avria tratto su per la montagna?</p></div>\n\n<div class="stanza"><p>El mi parea da s&eacute; stesso rimorso:</p>\n<p>o dignitosa cosc&iuml;enza e netta,</p>\n<p>come t&rsquo;&egrave; picciol fallo amaro morso!</p></div>\n\n<div class="stanza"><p>Quando li piedi suoi lasciar la fretta,</p>\n<p>che l&rsquo;onestade ad ogn&rsquo; atto dismaga,</p>\n<p>la mente mia, che prima era ristretta,</p></div>\n\n<div class="stanza"><p>lo &rsquo;ntento rallarg&ograve;, s&igrave; come vaga,</p>\n<p>e diedi &rsquo;l viso mio incontr&rsquo; al poggio</p>\n<p>che &rsquo;nverso &rsquo;l ciel pi&ugrave; alto si dislaga.</p></div>\n\n<div class="stanza"><p>Lo sol, che dietro fiammeggiava roggio,</p>\n<p>rotto m&rsquo;era dinanzi a la figura,</p>\n<p>ch&rsquo;av&euml;a in me de&rsquo; suoi raggi l&rsquo;appoggio.</p></div>\n\n<div class="stanza"><p>Io mi volsi dallato con paura</p>\n<p>d&rsquo;essere abbandonato, quand&rsquo; io vidi</p>\n<p>solo dinanzi a me la terra oscura;</p></div>\n\n<div class="stanza"><p>e &rsquo;l mio conforto: &laquo;Perch&eacute; pur diffidi?&raquo;,</p>\n<p>a dir mi cominci&ograve; tutto rivolto;</p>\n<p>&laquo;non credi tu me teco e ch&rsquo;io ti guidi?</p></div>\n\n<div class="stanza"><p>Vespero &egrave; gi&agrave; col&agrave; dov&rsquo; &egrave; sepolto</p>\n<p>lo corpo dentro al quale io facea ombra;</p>\n<p>Napoli l&rsquo;ha, e da Brandizio &egrave; tolto.</p></div>\n\n<div class="stanza"><p>Ora, se innanzi a me nulla s&rsquo;aombra,</p>\n<p>non ti maravigliar pi&ugrave; che d&rsquo;i cieli</p>\n<p>che l&rsquo;uno a l&rsquo;altro raggio non ingombra.</p></div>\n\n<div class="stanza"><p>A sofferir tormenti, caldi e geli</p>\n<p>simili corpi la Virt&ugrave; dispone</p>\n<p>che, come fa, non vuol ch&rsquo;a noi si sveli.</p></div>\n\n<div class="stanza"><p>Matto &egrave; chi spera che nostra ragione</p>\n<p>possa trascorrer la infinita via</p>\n<p>che tiene una sustanza in tre persone.</p></div>\n\n<div class="stanza"><p>State contenti, umana gente, al quia;</p>\n<p>ch&eacute;, se potuto aveste veder tutto,</p>\n<p>mestier non era parturir Maria;</p></div>\n\n<div class="stanza"><p>e dis&iuml;ar vedeste sanza frutto</p>\n<p>tai che sarebbe lor disio quetato,</p>\n<p>ch&rsquo;etternalmente &egrave; dato lor per lutto:</p></div>\n\n<div class="stanza"><p>io dico d&rsquo;Aristotile e di Plato</p>\n<p>e di molt&rsquo; altri&raquo;; e qui chin&ograve; la fronte,</p>\n<p>e pi&ugrave; non disse, e rimase turbato.</p></div>\n\n<div class="stanza"><p>Noi divenimmo intanto a pi&egrave; del monte;</p>\n<p>quivi trovammo la roccia s&igrave; erta,</p>\n<p>che &rsquo;ndarno vi sarien le gambe pronte.</p></div>\n\n<div class="stanza"><p>Tra Lerice e Turb&igrave;a la pi&ugrave; diserta,</p>\n<p>la pi&ugrave; rotta ruina &egrave; una scala,</p>\n<p>verso di quella, agevole e aperta.</p></div>\n\n<div class="stanza"><p>&laquo;Or chi sa da qual man la costa cala&raquo;,</p>\n<p>disse &rsquo;l maestro mio fermando &rsquo;l passo,</p>\n<p>&laquo;s&igrave; che possa salir chi va sanz&rsquo; ala?&raquo;.</p></div>\n\n<div class="stanza"><p>E mentre ch&rsquo;e&rsquo; tenendo &rsquo;l viso basso</p>\n<p>essaminava del cammin la mente,</p>\n<p>e io mirava suso intorno al sasso,</p></div>\n\n<div class="stanza"><p>da man sinistra m&rsquo;appar&igrave; una gente</p>\n<p>d&rsquo;anime, che movieno i pi&egrave; ver&rsquo; noi,</p>\n<p>e non pareva, s&igrave; ven&iuml;an lente.</p></div>\n\n<div class="stanza"><p>&laquo;Leva&raquo;, diss&rsquo; io, &laquo;maestro, li occhi tuoi:</p>\n<p>ecco di qua chi ne dar&agrave; consiglio,</p>\n<p>se tu da te medesmo aver nol puoi&raquo;.</p></div>\n\n<div class="stanza"><p>Guard&ograve; allora, e con libero piglio</p>\n<p>rispuose: &laquo;Andiamo in l&agrave;, ch&rsquo;ei vegnon piano;</p>\n<p>e tu ferma la spene, dolce figlio&raquo;.</p></div>\n\n<div class="stanza"><p>Ancora era quel popol di lontano,</p>\n<p>i&rsquo; dico dopo i nostri mille passi,</p>\n<p>quanto un buon gittator trarria con mano,</p></div>\n\n<div class="stanza"><p>quando si strinser tutti ai duri massi</p>\n<p>de l&rsquo;alta ripa, e stetter fermi e stretti</p>\n<p>com&rsquo; a guardar, chi va dubbiando, stassi.</p></div>\n\n<div class="stanza"><p>&laquo;O ben finiti, o gi&agrave; spiriti eletti&raquo;,</p>\n<p>Virgilio incominci&ograve;, &laquo;per quella pace</p>\n<p>ch&rsquo;i&rsquo; credo che per voi tutti s&rsquo;aspetti,</p></div>\n\n<div class="stanza"><p>ditene dove la montagna giace,</p>\n<p>s&igrave; che possibil sia l&rsquo;andare in suso;</p>\n<p>ch&eacute; perder tempo a chi pi&ugrave; sa pi&ugrave; spiace&raquo;.</p></div>\n\n<div class="stanza"><p>Come le pecorelle escon del chiuso</p>\n<p>a una, a due, a tre, e l&rsquo;altre stanno</p>\n<p>timidette atterrando l&rsquo;occhio e &rsquo;l muso;</p></div>\n\n<div class="stanza"><p>e ci&ograve; che fa la prima, e l&rsquo;altre fanno,</p>\n<p>addossandosi a lei, s&rsquo;ella s&rsquo;arresta,</p>\n<p>semplici e quete, e lo &rsquo;mperch&eacute; non sanno;</p></div>\n\n<div class="stanza"><p>s&igrave; vid&rsquo; io muovere a venir la testa</p>\n<p>di quella mandra fortunata allotta,</p>\n<p>pudica in faccia e ne l&rsquo;andare onesta.</p></div>\n\n<div class="stanza"><p>Come color dinanzi vider rotta</p>\n<p>la luce in terra dal mio destro canto,</p>\n<p>s&igrave; che l&rsquo;ombra era da me a la grotta,</p></div>\n\n<div class="stanza"><p>restaro, e trasser s&eacute; in dietro alquanto,</p>\n<p>e tutti li altri che venieno appresso,</p>\n<p>non sappiendo &rsquo;l perch&eacute;, fenno altrettanto.</p></div>\n\n<div class="stanza"><p>&laquo;Sanza vostra domanda io vi confesso</p>\n<p>che questo &egrave; corpo uman che voi vedete;</p>\n<p>per che &rsquo;l lume del sole in terra &egrave; fesso.</p></div>\n\n<div class="stanza"><p>Non vi maravigliate, ma credete</p>\n<p>che non sanza virt&ugrave; che da ciel vegna</p>\n<p>cerchi di soverchiar questa parete&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; &rsquo;l maestro; e quella gente degna</p>\n<p>&laquo;Tornate&raquo;, disse, &laquo;intrate innanzi dunque&raquo;,</p>\n<p>coi dossi de le man faccendo insegna.</p></div>\n\n<div class="stanza"><p>E un di loro incominci&ograve;: &laquo;Chiunque</p>\n<p>tu se&rsquo;, cos&igrave; andando, volgi &rsquo;l viso:</p>\n<p>pon mente se di l&agrave; mi vedesti unque&raquo;.</p></div>\n\n<div class="stanza"><p>Io mi volsi ver&rsquo; lui e guardail fiso:</p>\n<p>biondo era e bello e di gentile aspetto,</p>\n<p>ma l&rsquo;un de&rsquo; cigli un colpo avea diviso.</p></div>\n\n<div class="stanza"><p>Quand&rsquo; io mi fui umilmente disdetto</p>\n<p>d&rsquo;averlo visto mai, el disse: &laquo;Or vedi&raquo;;</p>\n<p>e mostrommi una piaga a sommo &rsquo;l petto.</p></div>\n\n<div class="stanza"><p>Poi sorridendo disse: &laquo;Io son Manfredi,</p>\n<p>nepote di Costanza imperadrice;</p>\n<p>ond&rsquo; io ti priego che, quando tu riedi,</p></div>\n\n<div class="stanza"><p>vadi a mia bella figlia, genitrice</p>\n<p>de l&rsquo;onor di Cicilia e d&rsquo;Aragona,</p>\n<p>e dichi &rsquo;l vero a lei, s&rsquo;altro si dice.</p></div>\n\n<div class="stanza"><p>Poscia ch&rsquo;io ebbi rotta la persona</p>\n<p>di due punte mortali, io mi rendei,</p>\n<p>piangendo, a quei che volontier perdona.</p></div>\n\n<div class="stanza"><p>Orribil furon li peccati miei;</p>\n<p>ma la bont&agrave; infinita ha s&igrave; gran braccia,</p>\n<p>che prende ci&ograve; che si rivolge a lei.</p></div>\n\n<div class="stanza"><p>Se &rsquo;l pastor di Cosenza, che a la caccia</p>\n<p>di me fu messo per Clemente allora,</p>\n<p>avesse in Dio ben letta questa faccia,</p></div>\n\n<div class="stanza"><p>l&rsquo;ossa del corpo mio sarieno ancora</p>\n<p>in co del ponte presso a Benevento,</p>\n<p>sotto la guardia de la grave mora.</p></div>\n\n<div class="stanza"><p>Or le bagna la pioggia e move il vento</p>\n<p>di fuor dal regno, quasi lungo &rsquo;l Verde,</p>\n<p>dov&rsquo; e&rsquo; le trasmut&ograve; a lume spento.</p></div>\n\n<div class="stanza"><p>Per lor maladizion s&igrave; non si perde,</p>\n<p>che non possa tornar, l&rsquo;etterno amore,</p>\n<p>mentre che la speranza ha fior del verde.</p></div>\n\n<div class="stanza"><p>Vero &egrave; che quale in contumacia more</p>\n<p>di Santa Chiesa, ancor ch&rsquo;al fin si penta,</p>\n<p>star li convien da questa ripa in fore,</p></div>\n\n<div class="stanza"><p>per ognun tempo ch&rsquo;elli &egrave; stato, trenta,</p>\n<p>in sua presunz&iuml;on, se tal decreto</p>\n<p>pi&ugrave; corto per buon prieghi non diventa.</p></div>\n\n<div class="stanza"><p>Vedi oggimai se tu mi puoi far lieto,</p>\n<p>revelando a la mia buona Costanza</p>\n<p>come m&rsquo;hai visto, e anco esto divieto;</p></div>\n\n<div class="stanza"><p>ch&eacute; qui per quei di l&agrave; molto s&rsquo;avanza&raquo;.</p></div>','<p class="cantohead">Canto IV</p>\n\n<div class="stanza"><p>Quando per dilettanze o ver per doglie,</p>\n<p>che alcuna virt&ugrave; nostra comprenda,</p>\n<p>l&rsquo;anima bene ad essa si raccoglie,</p></div>\n\n<div class="stanza"><p>par ch&rsquo;a nulla potenza pi&ugrave; intenda;</p>\n<p>e questo &egrave; contra quello error che crede</p>\n<p>ch&rsquo;un&rsquo;anima sovr&rsquo; altra in noi s&rsquo;accenda.</p></div>\n\n<div class="stanza"><p>E per&ograve;, quando s&rsquo;ode cosa o vede</p>\n<p>che tegna forte a s&eacute; l&rsquo;anima volta,</p>\n<p>vassene &rsquo;l tempo e l&rsquo;uom non se n&rsquo;avvede;</p></div>\n\n<div class="stanza"><p>ch&rsquo;altra potenza &egrave; quella che l&rsquo;ascolta,</p>\n<p>e altra &egrave; quella c&rsquo;ha l&rsquo;anima intera:</p>\n<p>questa &egrave; quasi legata e quella &egrave; sciolta.</p></div>\n\n<div class="stanza"><p>Di ci&ograve; ebb&rsquo; io esper&iuml;enza vera,</p>\n<p>udendo quello spirto e ammirando;</p>\n<p>ch&eacute; ben cinquanta gradi salito era</p></div>\n\n<div class="stanza"><p>lo sole, e io non m&rsquo;era accorto, quando</p>\n<p>venimmo ove quell&rsquo; anime ad una</p>\n<p>gridaro a noi: &laquo;Qui &egrave; vostro dimando&raquo;.</p></div>\n\n<div class="stanza"><p>Maggiore aperta molte volte impruna</p>\n<p>con una forcatella di sue spine</p>\n<p>l&rsquo;uom de la villa quando l&rsquo;uva imbruna,</p></div>\n\n<div class="stanza"><p>che non era la calla onde sal&igrave;ne</p>\n<p>lo duca mio, e io appresso, soli,</p>\n<p>come da noi la schiera si part&igrave;ne.</p></div>\n\n<div class="stanza"><p>Vassi in Sanleo e discendesi in Noli,</p>\n<p>montasi su in Bismantova e &rsquo;n Cacume</p>\n<p>con esso i pi&egrave;; ma qui convien ch&rsquo;om voli;</p></div>\n\n<div class="stanza"><p>dico con l&rsquo;ale snelle e con le piume</p>\n<p>del gran disio, di retro a quel condotto</p>\n<p>che speranza mi dava e facea lume.</p></div>\n\n<div class="stanza"><p>Noi salavam per entro &rsquo;l sasso rotto,</p>\n<p>e d&rsquo;ogne lato ne stringea lo stremo,</p>\n<p>e piedi e man volea il suol di sotto.</p></div>\n\n<div class="stanza"><p>Poi che noi fummo in su l&rsquo;orlo suppremo</p>\n<p>de l&rsquo;alta ripa, a la scoperta piaggia,</p>\n<p>&laquo;Maestro mio&raquo;, diss&rsquo; io, &laquo;che via faremo?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Nessun tuo passo caggia;</p>\n<p>pur su al monte dietro a me acquista,</p>\n<p>fin che n&rsquo;appaia alcuna scorta saggia&raquo;.</p></div>\n\n<div class="stanza"><p>Lo sommo er&rsquo; alto che vincea la vista,</p>\n<p>e la costa superba pi&ugrave; assai</p>\n<p>che da mezzo quadrante a centro lista.</p></div>\n\n<div class="stanza"><p>Io era lasso, quando cominciai:</p>\n<p>&laquo;O dolce padre, volgiti, e rimira</p>\n<p>com&rsquo; io rimango sol, se non restai&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Figliuol mio&raquo;, disse, &laquo;infin quivi ti tira&raquo;,</p>\n<p>additandomi un balzo poco in s&ugrave;e</p>\n<p>che da quel lato il poggio tutto gira.</p></div>\n\n<div class="stanza"><p>S&igrave; mi spronaron le parole sue,</p>\n<p>ch&rsquo;i&rsquo; mi sforzai carpando appresso lui,</p>\n<p>tanto che &rsquo;l cinghio sotto i pi&egrave; mi fue.</p></div>\n\n<div class="stanza"><p>A seder ci ponemmo ivi ambedui</p>\n<p>v&ograve;lti a levante ond&rsquo; eravam saliti,</p>\n<p>che suole a riguardar giovare altrui.</p></div>\n\n<div class="stanza"><p>Li occhi prima drizzai ai bassi liti;</p>\n<p>poscia li alzai al sole, e ammirava</p>\n<p>che da sinistra n&rsquo;eravam feriti.</p></div>\n\n<div class="stanza"><p>Ben s&rsquo;avvide il poeta ch&rsquo;&iuml;o stava</p>\n<p>stupido tutto al carro de la luce,</p>\n<p>ove tra noi e Aquilone intrava.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli a me: &laquo;Se Castore e Poluce</p>\n<p>fossero in compagnia di quello specchio</p>\n<p>che s&ugrave; e gi&ugrave; del suo lume conduce,</p></div>\n\n<div class="stanza"><p>tu vedresti il Zod&iuml;aco rubecchio</p>\n<p>ancora a l&rsquo;Orse pi&ugrave; stretto rotare,</p>\n<p>se non uscisse fuor del cammin vecchio.</p></div>\n\n<div class="stanza"><p>Come ci&ograve; sia, se &rsquo;l vuoi poter pensare,</p>\n<p>dentro raccolto, imagina S&iuml;&ograve;n</p>\n<p>con questo monte in su la terra stare</p></div>\n\n<div class="stanza"><p>s&igrave;, ch&rsquo;amendue hanno un solo orizz&ograve;n</p>\n<p>e diversi emisperi; onde la strada</p>\n<p>che mal non seppe carreggiar Fet&ograve;n,</p></div>\n\n<div class="stanza"><p>vedrai come a costui convien che vada</p>\n<p>da l&rsquo;un, quando a colui da l&rsquo;altro fianco,</p>\n<p>se lo &rsquo;ntelletto tuo ben chiaro bada&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Certo, maestro mio,&raquo; diss&rsquo; io, &laquo;unquanco</p>\n<p>non vid&rsquo; io chiaro s&igrave; com&rsquo; io discerno</p>\n<p>l&agrave; dove mio ingegno parea manco,</p></div>\n\n<div class="stanza"><p>che &rsquo;l mezzo cerchio del moto superno,</p>\n<p>che si chiama Equatore in alcun&rsquo; arte,</p>\n<p>e che sempre riman tra &rsquo;l sole e &rsquo;l verno,</p></div>\n\n<div class="stanza"><p>per la ragion che di&rsquo;, quinci si parte</p>\n<p>verso settentr&iuml;on, quanto li Ebrei</p>\n<p>vedevan lui verso la calda parte.</p></div>\n\n<div class="stanza"><p>Ma se a te piace, volontier saprei</p>\n<p>quanto avemo ad andar; ch&eacute; &rsquo;l poggio sale</p>\n<p>pi&ugrave; che salir non posson li occhi miei&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Questa montagna &egrave; tale,</p>\n<p>che sempre al cominciar di sotto &egrave; grave;</p>\n<p>e quant&rsquo; om pi&ugrave; va s&ugrave;, e men fa male.</p></div>\n\n<div class="stanza"><p>Per&ograve;, quand&rsquo; ella ti parr&agrave; soave</p>\n<p>tanto, che s&ugrave; andar ti fia leggero</p>\n<p>com&rsquo; a seconda gi&ugrave; andar per nave,</p></div>\n\n<div class="stanza"><p>allor sarai al fin d&rsquo;esto sentiero;</p>\n<p>quivi di riposar l&rsquo;affanno aspetta.</p>\n<p>Pi&ugrave; non rispondo, e questo so per vero&raquo;.</p></div>\n\n<div class="stanza"><p>E com&rsquo; elli ebbe sua parola detta,</p>\n<p>una voce di presso son&ograve;: &laquo;Forse</p>\n<p>che di sedere in pria avrai distretta!&raquo;.</p></div>\n\n<div class="stanza"><p>Al suon di lei ciascun di noi si torse,</p>\n<p>e vedemmo a mancina un gran petrone,</p>\n<p>del qual n&eacute; io n&eacute; ei prima s&rsquo;accorse.</p></div>\n\n<div class="stanza"><p>L&agrave; ci traemmo; e ivi eran persone</p>\n<p>che si stavano a l&rsquo;ombra dietro al sasso</p>\n<p>come l&rsquo;uom per negghienza a star si pone.</p></div>\n\n<div class="stanza"><p>E un di lor, che mi sembiava lasso,</p>\n<p>sedeva e abbracciava le ginocchia,</p>\n<p>tenendo &rsquo;l viso gi&ugrave; tra esse basso.</p></div>\n\n<div class="stanza"><p>&laquo;O dolce segnor mio&raquo;, diss&rsquo; io, &laquo;adocchia</p>\n<p>colui che mostra s&eacute; pi&ugrave; negligente</p>\n<p>che se pigrizia fosse sua serocchia&raquo;.</p></div>\n\n<div class="stanza"><p>Allor si volse a noi e puose mente,</p>\n<p>movendo &rsquo;l viso pur su per la coscia,</p>\n<p>e disse: &laquo;Or va tu s&ugrave;, che se&rsquo; valente!&raquo;.</p></div>\n\n<div class="stanza"><p>Conobbi allor chi era, e quella angoscia</p>\n<p>che m&rsquo;avacciava un poco ancor la lena,</p>\n<p>non m&rsquo;imped&igrave; l&rsquo;andare a lui; e poscia</p></div>\n\n<div class="stanza"><p>ch&rsquo;a lui fu&rsquo; giunto, alz&ograve; la testa a pena,</p>\n<p>dicendo: &laquo;Hai ben veduto come &rsquo;l sole</p>\n<p>da l&rsquo;omero sinistro il carro mena?&raquo;.</p></div>\n\n<div class="stanza"><p>Li atti suoi pigri e le corte parole</p>\n<p>mosser le labbra mie un poco a riso;</p>\n<p>poi cominciai: &laquo;Belacqua, a me non dole</p></div>\n\n<div class="stanza"><p>di te omai; ma dimmi: perch&eacute; assiso</p>\n<p>quiritto se&rsquo;? attendi tu iscorta,</p>\n<p>o pur lo modo usato t&rsquo;ha&rsquo; ripriso?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli: &laquo;O frate, andar in s&ugrave; che porta?</p>\n<p>ch&eacute; non mi lascerebbe ire a&rsquo; mart&igrave;ri</p>\n<p>l&rsquo;angel di Dio che siede in su la porta.</p></div>\n\n<div class="stanza"><p>Prima convien che tanto il ciel m&rsquo;aggiri</p>\n<p>di fuor da essa, quanto fece in vita,</p>\n<p>per ch&rsquo;io &rsquo;ndugiai al fine i buon sospiri,</p></div>\n\n<div class="stanza"><p>se oraz&iuml;one in prima non m&rsquo;aita</p>\n<p>che surga s&ugrave; di cuor che in grazia viva;</p>\n<p>l&rsquo;altra che val, che &rsquo;n ciel non &egrave; udita?&raquo;.</p></div>\n\n<div class="stanza"><p>E gi&agrave; il poeta innanzi mi saliva,</p>\n<p>e dicea: &laquo;Vienne omai; vedi ch&rsquo;&egrave; tocco</p>\n<p>merid&iuml;an dal sole e a la riva</p></div>\n\n<div class="stanza"><p>cuopre la notte gi&agrave; col pi&egrave; Morrocco&raquo;.</p></div>','<p class="cantohead">Canto V</p>\n\n<div class="stanza"><p>Io era gi&agrave; da quell&rsquo; ombre partito,</p>\n<p>e seguitava l&rsquo;orme del mio duca,</p>\n<p>quando di retro a me, drizzando &rsquo;l dito,</p></div>\n\n<div class="stanza"><p>una grid&ograve;: &laquo;Ve&rsquo; che non par che luca</p>\n<p>lo raggio da sinistra a quel di sotto,</p>\n<p>e come vivo par che si conduca!&raquo;.</p></div>\n\n<div class="stanza"><p>Li occhi rivolsi al suon di questo motto,</p>\n<p>e vidile guardar per maraviglia</p>\n<p>pur me, pur me, e &rsquo;l lume ch&rsquo;era rotto.</p></div>\n\n<div class="stanza"><p>&laquo;Perch&eacute; l&rsquo;animo tuo tanto s&rsquo;impiglia&raquo;,</p>\n<p>disse &rsquo;l maestro, &laquo;che l&rsquo;andare allenti?</p>\n<p>che ti fa ci&ograve; che quivi si pispiglia?</p></div>\n\n<div class="stanza"><p>Vien dietro a me, e lascia dir le genti:</p>\n<p>sta come torre ferma, che non crolla</p>\n<p>gi&agrave; mai la cima per soffiar di venti;</p></div>\n\n<div class="stanza"><p>ch&eacute; sempre l&rsquo;omo in cui pensier rampolla</p>\n<p>sovra pensier, da s&eacute; dilunga il segno,</p>\n<p>perch&eacute; la foga l&rsquo;un de l&rsquo;altro insolla&raquo;.</p></div>\n\n<div class="stanza"><p>Che potea io ridir, se non &laquo;Io vegno&raquo;?</p>\n<p>Dissilo, alquanto del color consperso</p>\n<p>che fa l&rsquo;uom di perdon talvolta degno.</p></div>\n\n<div class="stanza"><p>E &rsquo;ntanto per la costa di traverso</p>\n<p>venivan genti innanzi a noi un poco,</p>\n<p>cantando &lsquo;Miserere&rsquo; a verso a verso.</p></div>\n\n<div class="stanza"><p>Quando s&rsquo;accorser ch&rsquo;i&rsquo; non dava loco</p>\n<p>per lo mio corpo al trapassar d&rsquo;i raggi,</p>\n<p>mutar lor canto in un &laquo;oh!&raquo; lungo e roco;</p></div>\n\n<div class="stanza"><p>e due di loro, in forma di messaggi,</p>\n<p>corsero incontr&rsquo; a noi e dimandarne:</p>\n<p>&laquo;Di vostra condizion fatene saggi&raquo;.</p></div>\n\n<div class="stanza"><p>E &rsquo;l mio maestro: &laquo;Voi potete andarne</p>\n<p>e ritrarre a color che vi mandaro</p>\n<p>che &rsquo;l corpo di costui &egrave; vera carne.</p></div>\n\n<div class="stanza"><p>Se per veder la sua ombra restaro,</p>\n<p>com&rsquo; io avviso, assai &egrave; lor risposto:</p>\n<p>f&agrave;ccianli onore, ed esser pu&ograve; lor caro&raquo;.</p></div>\n\n<div class="stanza"><p>Vapori accesi non vid&rsquo; io s&igrave; tosto</p>\n<p>di prima notte mai fender sereno,</p>\n<p>n&eacute;, sol calando, nuvole d&rsquo;agosto,</p></div>\n\n<div class="stanza"><p>che color non tornasser suso in meno;</p>\n<p>e, giunti l&agrave;, con li altri a noi dier volta,</p>\n<p>come schiera che scorre sanza freno.</p></div>\n\n<div class="stanza"><p>&laquo;Questa gente che preme a noi &egrave; molta,</p>\n<p>e vegnonti a pregar&raquo;, disse &rsquo;l poeta:</p>\n<p>&laquo;per&ograve; pur va, e in andando ascolta&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O anima che vai per esser lieta</p>\n<p>con quelle membra con le quai nascesti&raquo;,</p>\n<p>venian gridando, &laquo;un poco il passo queta.</p></div>\n\n<div class="stanza"><p>Guarda s&rsquo;alcun di noi unqua vedesti,</p>\n<p>s&igrave; che di lui di l&agrave; novella porti:</p>\n<p>deh, perch&eacute; vai? deh, perch&eacute; non t&rsquo;arresti?</p></div>\n\n<div class="stanza"><p>Noi fummo tutti gi&agrave; per forza morti,</p>\n<p>e peccatori infino a l&rsquo;ultima ora;</p>\n<p>quivi lume del ciel ne fece accorti,</p></div>\n\n<div class="stanza"><p>s&igrave; che, pentendo e perdonando, fora</p>\n<p>di vita uscimmo a Dio pacificati,</p>\n<p>che del disio di s&eacute; veder n&rsquo;accora&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Perch&eacute; ne&rsquo; vostri visi guati,</p>\n<p>non riconosco alcun; ma s&rsquo;a voi piace</p>\n<p>cosa ch&rsquo;io possa, spiriti ben nati,</p></div>\n\n<div class="stanza"><p>voi dite, e io far&ograve; per quella pace</p>\n<p>che, dietro a&rsquo; piedi di s&igrave; fatta guida,</p>\n<p>di mondo in mondo cercar mi si face&raquo;.</p></div>\n\n<div class="stanza"><p>E uno incominci&ograve;: &laquo;Ciascun si fida</p>\n<p>del beneficio tuo sanza giurarlo,</p>\n<p>pur che &rsquo;l voler nonpossa non ricida.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io, che solo innanzi a li altri parlo,</p>\n<p>ti priego, se mai vedi quel paese</p>\n<p>che siede tra Romagna e quel di Carlo,</p></div>\n\n<div class="stanza"><p>che tu mi sie di tuoi prieghi cortese</p>\n<p>in Fano, s&igrave; che ben per me s&rsquo;adori</p>\n<p>pur ch&rsquo;i&rsquo; possa purgar le gravi offese.</p></div>\n\n<div class="stanza"><p>Quindi fu&rsquo; io; ma li profondi f&oacute;ri</p>\n<p>ond&rsquo; usc&igrave; &rsquo;l sangue in sul quale io sedea,</p>\n<p>fatti mi fuoro in grembo a li Antenori,</p></div>\n\n<div class="stanza"><p>l&agrave; dov&rsquo; io pi&ugrave; sicuro esser credea:</p>\n<p>quel da Esti il f&eacute; far, che m&rsquo;avea in ira</p>\n<p>assai pi&ugrave; l&agrave; che dritto non volea.</p></div>\n\n<div class="stanza"><p>Ma s&rsquo;io fosse fuggito inver&rsquo; la Mira,</p>\n<p>quando fu&rsquo; sovragiunto ad Or&iuml;aco,</p>\n<p>ancor sarei di l&agrave; dove si spira.</p></div>\n\n<div class="stanza"><p>Corsi al palude, e le cannucce e &rsquo;l braco</p>\n<p>m&rsquo;impigliar s&igrave; ch&rsquo;i&rsquo; caddi; e l&igrave; vid&rsquo; io</p>\n<p>de le mie vene farsi in terra laco&raquo;.</p></div>\n\n<div class="stanza"><p>Poi disse un altro: &laquo;Deh, se quel disio</p>\n<p>si compia che ti tragge a l&rsquo;alto monte,</p>\n<p>con buona p&iuml;etate aiuta il mio!</p></div>\n\n<div class="stanza"><p>Io fui di Montefeltro, io son Bonconte;</p>\n<p>Giovanna o altri non ha di me cura;</p>\n<p>per ch&rsquo;io vo tra costor con bassa fronte&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Qual forza o qual ventura</p>\n<p>ti trav&iuml;&ograve; s&igrave; fuor di Campaldino,</p>\n<p>che non si seppe mai tua sepultura?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, rispuos&rsquo; elli, &laquo;a pi&egrave; del Casentino</p>\n<p>traversa un&rsquo;acqua c&rsquo;ha nome l&rsquo;Archiano,</p>\n<p>che sovra l&rsquo;Ermo nasce in Apennino.</p></div>\n\n<div class="stanza"><p>L&agrave; &rsquo;ve &rsquo;l vocabol suo diventa vano,</p>\n<p>arriva&rsquo; io forato ne la gola,</p>\n<p>fuggendo a piede e sanguinando il piano.</p></div>\n\n<div class="stanza"><p>Quivi perdei la vista e la parola;</p>\n<p>nel nome di Maria fini&rsquo;, e quivi</p>\n<p>caddi, e rimase la mia carne sola.</p></div>\n\n<div class="stanza"><p>Io dir&ograve; vero, e tu &rsquo;l rid&igrave; tra &rsquo; vivi:</p>\n<p>l&rsquo;angel di Dio mi prese, e quel d&rsquo;inferno</p>\n<p>gridava: &ldquo;O tu del ciel, perch&eacute; mi privi?</p></div>\n\n<div class="stanza"><p>Tu te ne porti di costui l&rsquo;etterno</p>\n<p>per una lagrimetta che &rsquo;l mi toglie;</p>\n<p>ma io far&ograve; de l&rsquo;altro altro governo!&rdquo;.</p></div>\n\n<div class="stanza"><p>Ben sai come ne l&rsquo;aere si raccoglie</p>\n<p>quell&rsquo; umido vapor che in acqua riede,</p>\n<p>tosto che sale dove &rsquo;l freddo il coglie.</p></div>\n\n<div class="stanza"><p>Giunse quel mal voler che pur mal chiede</p>\n<p>con lo &rsquo;ntelletto, e mosse il fummo e &rsquo;l vento</p>\n<p>per la virt&ugrave; che sua natura diede.</p></div>\n\n<div class="stanza"><p>Indi la valle, come &rsquo;l d&igrave; fu spento,</p>\n<p>da Pratomagno al gran giogo coperse</p>\n<p>di nebbia; e &rsquo;l ciel di sopra fece intento,</p></div>\n\n<div class="stanza"><p>s&igrave; che &rsquo;l pregno aere in acqua si converse;</p>\n<p>la pioggia cadde, e a&rsquo; fossati venne</p>\n<p>di lei ci&ograve; che la terra non sofferse;</p></div>\n\n<div class="stanza"><p>e come ai rivi grandi si convenne,</p>\n<p>ver&rsquo; lo fiume real tanto veloce</p>\n<p>si ruin&ograve;, che nulla la ritenne.</p></div>\n\n<div class="stanza"><p>Lo corpo mio gelato in su la foce</p>\n<p>trov&ograve; l&rsquo;Archian rubesto; e quel sospinse</p>\n<p>ne l&rsquo;Arno, e sciolse al mio petto la croce</p></div>\n\n<div class="stanza"><p>ch&rsquo;i&rsquo; fe&rsquo; di me quando &rsquo;l dolor mi vinse;</p>\n<p>volt&ograve;mmi per le ripe e per lo fondo,</p>\n<p>poi di sua preda mi coperse e cinse&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, quando tu sarai tornato al mondo</p>\n<p>e riposato de la lunga via&raquo;,</p>\n<p>seguit&ograve; &rsquo;l terzo spirito al secondo,</p></div>\n\n<div class="stanza"><p>&laquo;ricorditi di me, che son la Pia;</p>\n<p>Siena mi f&eacute;, disfecemi Maremma:</p>\n<p>salsi colui che &rsquo;nnanellata pria</p></div>\n\n<div class="stanza"><p>disposando m&rsquo;avea con la sua gemma&raquo;.</p></div>','<p class="cantohead">Canto VI</p>\n\n<div class="stanza"><p>Quando si parte il gioco de la zara,</p>\n<p>colui che perde si riman dolente,</p>\n<p>repetendo le volte, e tristo impara;</p></div>\n\n<div class="stanza"><p>con l&rsquo;altro se ne va tutta la gente;</p>\n<p>qual va dinanzi, e qual di dietro il prende,</p>\n<p>e qual dallato li si reca a mente;</p></div>\n\n<div class="stanza"><p>el non s&rsquo;arresta, e questo e quello intende;</p>\n<p>a cui porge la man, pi&ugrave; non fa pressa;</p>\n<p>e cos&igrave; da la calca si difende.</p></div>\n\n<div class="stanza"><p>Tal era io in quella turba spessa,</p>\n<p>volgendo a loro, e qua e l&agrave;, la faccia,</p>\n<p>e promettendo mi sciogliea da essa.</p></div>\n\n<div class="stanza"><p>Quiv&rsquo; era l&rsquo;Aretin che da le braccia</p>\n<p>fiere di Ghin di Tacco ebbe la morte,</p>\n<p>e l&rsquo;altro ch&rsquo;anneg&ograve; correndo in caccia.</p></div>\n\n<div class="stanza"><p>Quivi pregava con le mani sporte</p>\n<p>Federigo Novello, e quel da Pisa</p>\n<p>che f&eacute; parer lo buon Marzucco forte.</p></div>\n\n<div class="stanza"><p>Vidi conte Orso e l&rsquo;anima divisa</p>\n<p>dal corpo suo per astio e per inveggia,</p>\n<p>com&rsquo; e&rsquo; dicea, non per colpa commisa;</p></div>\n\n<div class="stanza"><p>Pier da la Broccia dico; e qui proveggia,</p>\n<p>mentr&rsquo; &egrave; di qua, la donna di Brabante,</p>\n<p>s&igrave; che per&ograve; non sia di peggior greggia.</p></div>\n\n<div class="stanza"><p>Come libero fui da tutte quante</p>\n<p>quell&rsquo; ombre che pregar pur ch&rsquo;altri prieghi,</p>\n<p>s&igrave; che s&rsquo;avacci lor divenir sante,</p></div>\n\n<div class="stanza"><p>io cominciai: &laquo;El par che tu mi nieghi,</p>\n<p>o luce mia, espresso in alcun testo</p>\n<p>che decreto del cielo orazion pieghi;</p></div>\n\n<div class="stanza"><p>e questa gente prega pur di questo:</p>\n<p>sarebbe dunque loro speme vana,</p>\n<p>o non m&rsquo;&egrave; &rsquo;l detto tuo ben manifesto?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;La mia scrittura &egrave; piana;</p>\n<p>e la speranza di costor non falla,</p>\n<p>se ben si guarda con la mente sana;</p></div>\n\n<div class="stanza"><p>ch&eacute; cima di giudicio non s&rsquo;avvalla</p>\n<p>perch&eacute; foco d&rsquo;amor compia in un punto</p>\n<p>ci&ograve; che de&rsquo; sodisfar chi qui s&rsquo;astalla;</p></div>\n\n<div class="stanza"><p>e l&agrave; dov&rsquo; io fermai cotesto punto,</p>\n<p>non s&rsquo;ammendava, per pregar, difetto,</p>\n<p>perch&eacute; &rsquo;l priego da Dio era disgiunto.</p></div>\n\n<div class="stanza"><p>Veramente a cos&igrave; alto sospetto</p>\n<p>non ti fermar, se quella nol ti dice</p>\n<p>che lume fia tra &rsquo;l vero e lo &rsquo;ntelletto.</p></div>\n\n<div class="stanza"><p>Non so se &rsquo;ntendi: io dico di Beatrice;</p>\n<p>tu la vedrai di sopra, in su la vetta</p>\n<p>di questo monte, ridere e felice&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Segnore, andiamo a maggior fretta,</p>\n<p>ch&eacute; gi&agrave; non m&rsquo;affatico come dianzi,</p>\n<p>e vedi omai che &rsquo;l poggio l&rsquo;ombra getta&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Noi anderem con questo giorno innanzi&raquo;,</p>\n<p>rispuose, &laquo;quanto pi&ugrave; potremo omai;</p>\n<p>ma &rsquo;l fatto &egrave; d&rsquo;altra forma che non stanzi.</p></div>\n\n<div class="stanza"><p>Prima che sie l&agrave; s&ugrave;, tornar vedrai</p>\n<p>colui che gi&agrave; si cuopre de la costa,</p>\n<p>s&igrave; che &rsquo; suoi raggi tu romper non fai.</p></div>\n\n<div class="stanza"><p>Ma vedi l&agrave; un&rsquo;anima che, posta</p>\n<p>sola soletta, inverso noi riguarda:</p>\n<p>quella ne &rsquo;nsegner&agrave; la via pi&ugrave; tosta&raquo;.</p></div>\n\n<div class="stanza"><p>Venimmo a lei: o anima lombarda,</p>\n<p>come ti stavi altera e disdegnosa</p>\n<p>e nel mover de li occhi onesta e tarda!</p></div>\n\n<div class="stanza"><p>Ella non ci dic&euml;a alcuna cosa,</p>\n<p>ma lasciavane gir, solo sguardando</p>\n<p>a guisa di leon quando si posa.</p></div>\n\n<div class="stanza"><p>Pur Virgilio si trasse a lei, pregando</p>\n<p>che ne mostrasse la miglior salita;</p>\n<p>e quella non rispuose al suo dimando,</p></div>\n\n<div class="stanza"><p>ma di nostro paese e de la vita</p>\n<p>ci &rsquo;nchiese; e &rsquo;l dolce duca incominciava</p>\n<p>&laquo;Mant&uuml;a . . . &raquo;, e l&rsquo;ombra, tutta in s&eacute; romita,</p></div>\n\n<div class="stanza"><p>surse ver&rsquo; lui del loco ove pria stava,</p>\n<p>dicendo: &laquo;O Mantoano, io son Sordello</p>\n<p>de la tua terra!&raquo;; e l&rsquo;un l&rsquo;altro abbracciava.</p></div>\n\n<div class="stanza"><p>Ahi serva Italia, di dolore ostello,</p>\n<p>nave sanza nocchiere in gran tempesta,</p>\n<p>non donna di province, ma bordello!</p></div>\n\n<div class="stanza"><p>Quell&rsquo; anima gentil fu cos&igrave; presta,</p>\n<p>sol per lo dolce suon de la sua terra,</p>\n<p>di fare al cittadin suo quivi festa;</p></div>\n\n<div class="stanza"><p>e ora in te non stanno sanza guerra</p>\n<p>li vivi tuoi, e l&rsquo;un l&rsquo;altro si rode</p>\n<p>di quei ch&rsquo;un muro e una fossa serra.</p></div>\n\n<div class="stanza"><p>Cerca, misera, intorno da le prode</p>\n<p>le tue marine, e poi ti guarda in seno,</p>\n<p>s&rsquo;alcuna parte in te di pace gode.</p></div>\n\n<div class="stanza"><p>Che val perch&eacute; ti racconciasse il freno</p>\n<p>Iustin&iuml;ano, se la sella &egrave; v&ograve;ta?</p>\n<p>Sanz&rsquo; esso fora la vergogna meno.</p></div>\n\n<div class="stanza"><p>Ahi gente che dovresti esser devota,</p>\n<p>e lasciar seder Cesare in la sella,</p>\n<p>se bene intendi ci&ograve; che Dio ti nota,</p></div>\n\n<div class="stanza"><p>guarda come esta fiera &egrave; fatta fella</p>\n<p>per non esser corretta da li sproni,</p>\n<p>poi che ponesti mano a la predella.</p></div>\n\n<div class="stanza"><p>O Alberto tedesco ch&rsquo;abbandoni</p>\n<p>costei ch&rsquo;&egrave; fatta indomita e selvaggia,</p>\n<p>e dovresti inforcar li suoi arcioni,</p></div>\n\n<div class="stanza"><p>giusto giudicio da le stelle caggia</p>\n<p>sovra &rsquo;l tuo sangue, e sia novo e aperto,</p>\n<p>tal che &rsquo;l tuo successor temenza n&rsquo;aggia!</p></div>\n\n<div class="stanza"><p>Ch&rsquo;avete tu e &rsquo;l tuo padre sofferto,</p>\n<p>per cupidigia di cost&agrave; distretti,</p>\n<p>che &rsquo;l giardin de lo &rsquo;mperio sia diserto.</p></div>\n\n<div class="stanza"><p>Vieni a veder Montecchi e Cappelletti,</p>\n<p>Monaldi e Filippeschi, uom sanza cura:</p>\n<p>color gi&agrave; tristi, e questi con sospetti!</p></div>\n\n<div class="stanza"><p>Vien, crudel, vieni, e vedi la pressura</p>\n<p>d&rsquo;i tuoi gentili, e cura lor magagne;</p>\n<p>e vedrai Santafior com&rsquo; &egrave; oscura!</p></div>\n\n<div class="stanza"><p>Vieni a veder la tua Roma che piagne</p>\n<p>vedova e sola, e d&igrave; e notte chiama:</p>\n<p>&laquo;Cesare mio, perch&eacute; non m&rsquo;accompagne?&raquo;.</p></div>\n\n<div class="stanza"><p>Vieni a veder la gente quanto s&rsquo;ama!</p>\n<p>e se nulla di noi piet&agrave; ti move,</p>\n<p>a vergognar ti vien de la tua fama.</p></div>\n\n<div class="stanza"><p>E se licito m&rsquo;&egrave;, o sommo Giove</p>\n<p>che fosti in terra per noi crucifisso,</p>\n<p>son li giusti occhi tuoi rivolti altrove?</p></div>\n\n<div class="stanza"><p>O &egrave; preparazion che ne l&rsquo;abisso</p>\n<p>del tuo consiglio fai per alcun bene</p>\n<p>in tutto de l&rsquo;accorger nostro scisso?</p></div>\n\n<div class="stanza"><p>Ch&eacute; le citt&agrave; d&rsquo;Italia tutte piene</p>\n<p>son di tiranni, e un Marcel diventa</p>\n<p>ogne villan che parteggiando viene.</p></div>\n\n<div class="stanza"><p>Fiorenza mia, ben puoi esser contenta</p>\n<p>di questa digression che non ti tocca,</p>\n<p>merc&eacute; del popol tuo che si argomenta.</p></div>\n\n<div class="stanza"><p>Molti han giustizia in cuore, e tardi scocca</p>\n<p>per non venir sanza consiglio a l&rsquo;arco;</p>\n<p>ma il popol tuo l&rsquo;ha in sommo de la bocca.</p></div>\n\n<div class="stanza"><p>Molti rifiutan lo comune incarco;</p>\n<p>ma il popol tuo solicito risponde</p>\n<p>sanza chiamare, e grida: &laquo;I&rsquo; mi sobbarco!&raquo;.</p></div>\n\n<div class="stanza"><p>Or ti fa lieta, ch&eacute; tu hai ben onde:</p>\n<p>tu ricca, tu con pace e tu con senno!</p>\n<p>S&rsquo;io dico &rsquo;l ver, l&rsquo;effetto nol nasconde.</p></div>\n\n<div class="stanza"><p>Atene e Lacedemona, che fenno</p>\n<p>l&rsquo;antiche leggi e furon s&igrave; civili,</p>\n<p>fecero al viver bene un picciol cenno</p></div>\n\n<div class="stanza"><p>verso di te, che fai tanto sottili</p>\n<p>provedimenti, ch&rsquo;a mezzo novembre</p>\n<p>non giugne quel che tu d&rsquo;ottobre fili.</p></div>\n\n<div class="stanza"><p>Quante volte, del tempo che rimembre,</p>\n<p>legge, moneta, officio e costume</p>\n<p>hai tu mutato, e rinovate membre!</p></div>\n\n<div class="stanza"><p>E se ben ti ricordi e vedi lume,</p>\n<p>vedrai te somigliante a quella inferma</p>\n<p>che non pu&ograve; trovar posa in su le piume,</p></div>\n\n<div class="stanza"><p>ma con dar volta suo dolore scherma.</p></div>','<p class="cantohead">Canto VII</p>\n\n<div class="stanza"><p>Poscia che l&rsquo;accoglienze oneste e liete</p>\n<p>furo iterate tre e quattro volte,</p>\n<p>Sordel si trasse, e disse: &laquo;Voi, chi siete?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Anzi che a questo monte fosser volte</p>\n<p>l&rsquo;anime degne di salire a Dio,</p>\n<p>fur l&rsquo;ossa mie per Ottavian sepolte.</p></div>\n\n<div class="stanza"><p>Io son Virgilio; e per null&rsquo; altro rio</p>\n<p>lo ciel perdei che per non aver f&eacute;&raquo;.</p>\n<p>Cos&igrave; rispuose allora il duca mio.</p></div>\n\n<div class="stanza"><p>Qual &egrave; colui che cosa innanzi s&eacute;</p>\n<p>s&ugrave;bita vede ond&rsquo; e&rsquo; si maraviglia,</p>\n<p>che crede e non, dicendo &laquo;Ella &egrave; . . . non &egrave; . . . &raquo;,</p></div>\n\n<div class="stanza"><p>tal parve quelli; e poi chin&ograve; le ciglia,</p>\n<p>e umilmente ritorn&ograve; ver&rsquo; lui,</p>\n<p>e abbracci&ograve;l l&agrave; &rsquo;ve &rsquo;l minor s&rsquo;appiglia.</p></div>\n\n<div class="stanza"><p>&laquo;O gloria di Latin&raquo;, disse, &laquo;per cui</p>\n<p>mostr&ograve; ci&ograve; che potea la lingua nostra,</p>\n<p>o pregio etterno del loco ond&rsquo; io fui,</p></div>\n\n<div class="stanza"><p>qual merito o qual grazia mi ti mostra?</p>\n<p>S&rsquo;io son d&rsquo;udir le tue parole degno,</p>\n<p>dimmi se vien d&rsquo;inferno, e di qual chiostra&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Per tutt&rsquo; i cerchi del dolente regno&raquo;,</p>\n<p>rispuose lui, &laquo;son io di qua venuto;</p>\n<p>virt&ugrave; del ciel mi mosse, e con lei vegno.</p></div>\n\n<div class="stanza"><p>Non per far, ma per non fare ho perduto</p>\n<p>a veder l&rsquo;alto Sol che tu disiri</p>\n<p>e che fu tardi per me conosciuto.</p></div>\n\n<div class="stanza"><p>Luogo &egrave; l&agrave; gi&ugrave; non tristo di mart&igrave;ri,</p>\n<p>ma di tenebre solo, ove i lamenti</p>\n<p>non suonan come guai, ma son sospiri.</p></div>\n\n<div class="stanza"><p>Quivi sto io coi pargoli innocenti</p>\n<p>dai denti morsi de la morte avante</p>\n<p>che fosser da l&rsquo;umana colpa essenti;</p></div>\n\n<div class="stanza"><p>quivi sto io con quei che le tre sante</p>\n<p>virt&ugrave; non si vestiro, e sanza vizio</p>\n<p>conobber l&rsquo;altre e seguir tutte quante.</p></div>\n\n<div class="stanza"><p>Ma se tu sai e puoi, alcuno indizio</p>\n<p>d&agrave; noi per che venir possiam pi&ugrave; tosto</p>\n<p>l&agrave; dove purgatorio ha dritto inizio&raquo;.</p></div>\n\n<div class="stanza"><p>Rispuose: &laquo;Loco certo non c&rsquo;&egrave; posto;</p>\n<p>licito m&rsquo;&egrave; andar suso e intorno;</p>\n<p>per quanto ir posso, a guida mi t&rsquo;accosto.</p></div>\n\n<div class="stanza"><p>Ma vedi gi&agrave; come dichina il giorno,</p>\n<p>e andar s&ugrave; di notte non si puote;</p>\n<p>per&ograve; &egrave; buon pensar di bel soggiorno.</p></div>\n\n<div class="stanza"><p>Anime sono a destra qua remote;</p>\n<p>se mi consenti, io ti merr&ograve; ad esse,</p>\n<p>e non sanza diletto ti fier note&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Com&rsquo; &egrave; ci&ograve;?&raquo;, fu risposto. &laquo;Chi volesse</p>\n<p>salir di notte, fora elli impedito</p>\n<p>d&rsquo;altrui, o non sarria ch&eacute; non potesse?&raquo;.</p></div>\n\n<div class="stanza"><p>E &rsquo;l buon Sordello in terra freg&ograve; &rsquo;l dito,</p>\n<p>dicendo: &laquo;Vedi? sola questa riga</p>\n<p>non varcheresti dopo &rsquo;l sol partito:</p></div>\n\n<div class="stanza"><p>non per&ograve; ch&rsquo;altra cosa desse briga,</p>\n<p>che la notturna tenebra, ad ir suso;</p>\n<p>quella col nonpoder la voglia intriga.</p></div>\n\n<div class="stanza"><p>Ben si poria con lei tornare in giuso</p>\n<p>e passeggiar la costa intorno errando,</p>\n<p>mentre che l&rsquo;orizzonte il d&igrave; tien chiuso&raquo;.</p></div>\n\n<div class="stanza"><p>Allora il mio segnor, quasi ammirando,</p>\n<p>&laquo;Menane&raquo;, disse, &laquo;dunque l&agrave; &rsquo;ve dici</p>\n<p>ch&rsquo;aver si pu&ograve; diletto dimorando&raquo;.</p></div>\n\n<div class="stanza"><p>Poco allungati c&rsquo;eravam di lici,</p>\n<p>quand&rsquo; io m&rsquo;accorsi che &rsquo;l monte era scemo,</p>\n<p>a guisa che i vallon li sceman quici.</p></div>\n\n<div class="stanza"><p>&laquo;Col&agrave;&raquo;, disse quell&rsquo; ombra, &laquo;n&rsquo;anderemo</p>\n<p>dove la costa face di s&eacute; grembo;</p>\n<p>e l&agrave; il novo giorno attenderemo&raquo;.</p></div>\n\n<div class="stanza"><p>Tra erto e piano era un sentiero schembo,</p>\n<p>che ne condusse in fianco de la lacca,</p>\n<p>l&agrave; dove pi&ugrave; ch&rsquo;a mezzo muore il lembo.</p></div>\n\n<div class="stanza"><p>Oro e argento fine, cocco e biacca,</p>\n<p>indaco, legno lucido e sereno,</p>\n<p>fresco smeraldo in l&rsquo;ora che si fiacca,</p></div>\n\n<div class="stanza"><p>da l&rsquo;erba e da li fior, dentr&rsquo; a quel seno</p>\n<p>posti, ciascun saria di color vinto,</p>\n<p>come dal suo maggiore &egrave; vinto il meno.</p></div>\n\n<div class="stanza"><p>Non avea pur natura ivi dipinto,</p>\n<p>ma di soavit&agrave; di mille odori</p>\n<p>vi facea uno incognito e indistinto.</p></div>\n\n<div class="stanza"><p>&lsquo;Salve, Regina&rsquo; in sul verde e &rsquo;n su&rsquo; fiori</p>\n<p>quindi seder cantando anime vidi,</p>\n<p>che per la valle non parean di fuori.</p></div>\n\n<div class="stanza"><p>&laquo;Prima che &rsquo;l poco sole omai s&rsquo;annidi&raquo;,</p>\n<p>cominci&ograve; &rsquo;l Mantoan che ci avea v&ograve;lti,</p>\n<p>&laquo;tra color non vogliate ch&rsquo;io vi guidi.</p></div>\n\n<div class="stanza"><p>Di questo balzo meglio li atti e &rsquo; volti</p>\n<p>conoscerete voi di tutti quanti,</p>\n<p>che ne la lama gi&ugrave; tra essi accolti.</p></div>\n\n<div class="stanza"><p>Colui che pi&ugrave; siede alto e fa sembianti</p>\n<p>d&rsquo;aver negletto ci&ograve; che far dovea,</p>\n<p>e che non move bocca a li altrui canti,</p></div>\n\n<div class="stanza"><p>Rodolfo imperador fu, che potea</p>\n<p>sanar le piaghe c&rsquo;hanno Italia morta,</p>\n<p>s&igrave; che tardi per altri si ricrea.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro che ne la vista lui conforta,</p>\n<p>resse la terra dove l&rsquo;acqua nasce</p>\n<p>che Molta in Albia, e Albia in mar ne porta:</p></div>\n\n<div class="stanza"><p>Ottacchero ebbe nome, e ne le fasce</p>\n<p>fu meglio assai che Vincislao suo figlio</p>\n<p>barbuto, cui lussuria e ozio pasce.</p></div>\n\n<div class="stanza"><p>E quel nasetto che stretto a consiglio</p>\n<p>par con colui c&rsquo;ha s&igrave; benigno aspetto,</p>\n<p>mor&igrave; fuggendo e disfiorando il giglio:</p></div>\n\n<div class="stanza"><p>guardate l&agrave; come si batte il petto!</p>\n<p>L&rsquo;altro vedete c&rsquo;ha fatto a la guancia</p>\n<p>de la sua palma, sospirando, letto.</p></div>\n\n<div class="stanza"><p>Padre e suocero son del mal di Francia:</p>\n<p>sanno la vita sua viziata e lorda,</p>\n<p>e quindi viene il duol che s&igrave; li lancia.</p></div>\n\n<div class="stanza"><p>Quel che par s&igrave; membruto e che s&rsquo;accorda,</p>\n<p>cantando, con colui dal maschio naso,</p>\n<p>d&rsquo;ogne valor port&ograve; cinta la corda;</p></div>\n\n<div class="stanza"><p>e se re dopo lui fosse rimaso</p>\n<p>lo giovanetto che retro a lui siede,</p>\n<p>ben andava il valor di vaso in vaso,</p></div>\n\n<div class="stanza"><p>che non si puote dir de l&rsquo;altre rede;</p>\n<p>Iacomo e Federigo hanno i reami;</p>\n<p>del retaggio miglior nessun possiede.</p></div>\n\n<div class="stanza"><p>Rade volte risurge per li rami</p>\n<p>l&rsquo;umana probitate; e questo vole</p>\n<p>quei che la d&agrave;, perch&eacute; da lui si chiami.</p></div>\n\n<div class="stanza"><p>Anche al nasuto vanno mie parole</p>\n<p>non men ch&rsquo;a l&rsquo;altro, Pier, che con lui canta,</p>\n<p>onde Puglia e Proenza gi&agrave; si dole.</p></div>\n\n<div class="stanza"><p>Tant&rsquo; &egrave; del seme suo minor la pianta,</p>\n<p>quanto, pi&ugrave; che Beatrice e Margherita,</p>\n<p>Costanza di marito ancor si vanta.</p></div>\n\n<div class="stanza"><p>Vedete il re de la semplice vita</p>\n<p>seder l&agrave; solo, Arrigo d&rsquo;Inghilterra:</p>\n<p>questi ha ne&rsquo; rami suoi migliore uscita.</p></div>\n\n<div class="stanza"><p>Quel che pi&ugrave; basso tra costor s&rsquo;atterra,</p>\n<p>guardando in suso, &egrave; Guiglielmo marchese,</p>\n<p>per cui e Alessandria e la sua guerra</p></div>\n\n<div class="stanza"><p>fa pianger Monferrato e Canavese&raquo;.</p></div>','<p class="cantohead">Canto VIII</p>\n\n<div class="stanza"><p>Era gi&agrave; l&rsquo;ora che volge il disio</p>\n<p>ai navicanti e &rsquo;ntenerisce il core</p>\n<p>lo d&igrave; c&rsquo;han detto ai dolci amici addio;</p></div>\n\n<div class="stanza"><p>e che lo novo peregrin d&rsquo;amore</p>\n<p>punge, se ode squilla di lontano</p>\n<p>che paia il giorno pianger che si more;</p></div>\n\n<div class="stanza"><p>quand&rsquo; io incominciai a render vano</p>\n<p>l&rsquo;udire e a mirare una de l&rsquo;alme</p>\n<p>surta, che l&rsquo;ascoltar chiedea con mano.</p></div>\n\n<div class="stanza"><p>Ella giunse e lev&ograve; ambo le palme,</p>\n<p>ficcando li occhi verso l&rsquo;or&iuml;ente,</p>\n<p>come dicesse a Dio: &lsquo;D&rsquo;altro non calme&rsquo;.</p></div>\n\n<div class="stanza"><p>&lsquo;Te lucis ante&rsquo; s&igrave; devotamente</p>\n<p>le usc&igrave;o di bocca e con s&igrave; dolci note,</p>\n<p>che fece me a me uscir di mente;</p></div>\n\n<div class="stanza"><p>e l&rsquo;altre poi dolcemente e devote</p>\n<p>seguitar lei per tutto l&rsquo;inno intero,</p>\n<p>avendo li occhi a le superne rote.</p></div>\n\n<div class="stanza"><p>Aguzza qui, lettor, ben li occhi al vero,</p>\n<p>ch&eacute; &rsquo;l velo &egrave; ora ben tanto sottile,</p>\n<p>certo che &rsquo;l trapassar dentro &egrave; leggero.</p></div>\n\n<div class="stanza"><p>Io vidi quello essercito gentile</p>\n<p>tacito poscia riguardare in s&ugrave;e,</p>\n<p>quasi aspettando, palido e um&igrave;le;</p></div>\n\n<div class="stanza"><p>e vidi uscir de l&rsquo;alto e scender gi&ugrave;e</p>\n<p>due angeli con due spade affocate,</p>\n<p>tronche e private de le punte sue.</p></div>\n\n<div class="stanza"><p>Verdi come fogliette pur mo nate</p>\n<p>erano in veste, che da verdi penne</p>\n<p>percosse traean dietro e ventilate.</p></div>\n\n<div class="stanza"><p>L&rsquo;un poco sovra noi a star si venne,</p>\n<p>e l&rsquo;altro scese in l&rsquo;opposita sponda,</p>\n<p>s&igrave; che la gente in mezzo si contenne.</p></div>\n\n<div class="stanza"><p>Ben discern&euml;a in lor la testa bionda;</p>\n<p>ma ne la faccia l&rsquo;occhio si smarria,</p>\n<p>come virt&ugrave; ch&rsquo;a troppo si confonda.</p></div>\n\n<div class="stanza"><p>&laquo;Ambo vegnon del grembo di Maria&raquo;,</p>\n<p>disse Sordello, &laquo;a guardia de la valle,</p>\n<p>per lo serpente che verr&agrave; vie via&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io, che non sapeva per qual calle,</p>\n<p>mi volsi intorno, e stretto m&rsquo;accostai,</p>\n<p>tutto gelato, a le fidate spalle.</p></div>\n\n<div class="stanza"><p>E Sordello anco: &laquo;Or avvalliamo omai</p>\n<p>tra le grandi ombre, e parleremo ad esse;</p>\n<p>graz&iuml;oso fia lor vedervi assai&raquo;.</p></div>\n\n<div class="stanza"><p>Solo tre passi credo ch&rsquo;i&rsquo; scendesse,</p>\n<p>e fui di sotto, e vidi un che mirava</p>\n<p>pur me, come conoscer mi volesse.</p></div>\n\n<div class="stanza"><p>Temp&rsquo; era gi&agrave; che l&rsquo;aere s&rsquo;annerava,</p>\n<p>ma non s&igrave; che tra li occhi suoi e &rsquo; miei</p>\n<p>non dichiarisse ci&ograve; che pria serrava.</p></div>\n\n<div class="stanza"><p>Ver&rsquo; me si fece, e io ver&rsquo; lui mi fei:</p>\n<p>giudice Nin gentil, quanto mi piacque</p>\n<p>quando ti vidi non esser tra &rsquo; rei!</p></div>\n\n<div class="stanza"><p>Nullo bel salutar tra noi si tacque;</p>\n<p>poi dimand&ograve;: &laquo;Quant&rsquo; &egrave; che tu venisti</p>\n<p>a pi&egrave; del monte per le lontane acque?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, diss&rsquo; io lui, &laquo;per entro i luoghi tristi</p>\n<p>venni stamane, e sono in prima vita,</p>\n<p>ancor che l&rsquo;altra, s&igrave; andando, acquisti&raquo;.</p></div>\n\n<div class="stanza"><p>E come fu la mia risposta udita,</p>\n<p>Sordello ed elli in dietro si raccolse</p>\n<p>come gente di s&ugrave;bito smarrita.</p></div>\n\n<div class="stanza"><p>L&rsquo;uno a Virgilio e l&rsquo;altro a un si volse</p>\n<p>che sedea l&igrave;, gridando: &laquo;S&ugrave;, Currado!</p>\n<p>vieni a veder che Dio per grazia volse&raquo;.</p></div>\n\n<div class="stanza"><p>Poi, v&ograve;lto a me: &laquo;Per quel singular grado</p>\n<p>che tu dei a colui che s&igrave; nasconde</p>\n<p>lo suo primo perch&eacute;, che non l&igrave; &egrave; guado,</p></div>\n\n<div class="stanza"><p>quando sarai di l&agrave; da le larghe onde,</p>\n<p>d&igrave; a Giovanna mia che per me chiami</p>\n<p>l&agrave; dove a li &rsquo;nnocenti si risponde.</p></div>\n\n<div class="stanza"><p>Non credo che la sua madre pi&ugrave; m&rsquo;ami,</p>\n<p>poscia che trasmut&ograve; le bianche bende,</p>\n<p>le quai convien che, misera!, ancor brami.</p></div>\n\n<div class="stanza"><p>Per lei assai di lieve si comprende</p>\n<p>quanto in femmina foco d&rsquo;amor dura,</p>\n<p>se l&rsquo;occhio o &rsquo;l tatto spesso non l&rsquo;accende.</p></div>\n\n<div class="stanza"><p>Non le far&agrave; s&igrave; bella sepultura</p>\n<p>la vipera che Melanesi accampa,</p>\n<p>com&rsquo; avria fatto il gallo di Gallura&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; dicea, segnato de la stampa,</p>\n<p>nel suo aspetto, di quel dritto zelo</p>\n<p>che misuratamente in core avvampa.</p></div>\n\n<div class="stanza"><p>Li occhi miei ghiotti andavan pur al cielo,</p>\n<p>pur l&agrave; dove le stelle son pi&ugrave; tarde,</p>\n<p>s&igrave; come rota pi&ugrave; presso a lo stelo.</p></div>\n\n<div class="stanza"><p>E &rsquo;l duca mio: &laquo;Figliuol, che l&agrave; s&ugrave; guarde?&raquo;.</p>\n<p>E io a lui: &laquo;A quelle tre facelle</p>\n<p>di che &rsquo;l polo di qua tutto quanto arde&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli a me: &laquo;Le quattro chiare stelle</p>\n<p>che vedevi staman, son di l&agrave; basse,</p>\n<p>e queste son salite ov&rsquo; eran quelle&raquo;.</p></div>\n\n<div class="stanza"><p>Com&rsquo; ei parlava, e Sordello a s&eacute; il trasse</p>\n<p>dicendo: &laquo;Vedi l&agrave; &rsquo;l nostro avversaro&raquo;;</p>\n<p>e drizz&ograve; il dito perch&eacute; &rsquo;n l&agrave; guardasse.</p></div>\n\n<div class="stanza"><p>Da quella parte onde non ha riparo</p>\n<p>la picciola vallea, era una biscia,</p>\n<p>forse qual diede ad Eva il cibo amaro.</p></div>\n\n<div class="stanza"><p>Tra l&rsquo;erba e &rsquo; fior ven&igrave;a la mala striscia,</p>\n<p>volgendo ad ora ad or la testa, e &rsquo;l dosso</p>\n<p>leccando come bestia che si liscia.</p></div>\n\n<div class="stanza"><p>Io non vidi, e per&ograve; dicer non posso,</p>\n<p>come mosser li astor celest&iuml;ali;</p>\n<p>ma vidi bene e l&rsquo;uno e l&rsquo;altro mosso.</p></div>\n\n<div class="stanza"><p>Sentendo fender l&rsquo;aere a le verdi ali,</p>\n<p>fugg&igrave; &rsquo;l serpente, e li angeli dier volta,</p>\n<p>suso a le poste rivolando iguali.</p></div>\n\n<div class="stanza"><p>L&rsquo;ombra che s&rsquo;era al giudice raccolta</p>\n<p>quando chiam&ograve;, per tutto quello assalto</p>\n<p>punto non fu da me guardare sciolta.</p></div>\n\n<div class="stanza"><p>&laquo;Se la lucerna che ti mena in alto</p>\n<p>truovi nel tuo arbitrio tanta cera</p>\n<p>quant&rsquo; &egrave; mestiere infino al sommo smalto&raquo;,</p></div>\n\n<div class="stanza"><p>cominci&ograve; ella, &laquo;se novella vera</p>\n<p>di Val di Magra o di parte vicina</p>\n<p>sai, dillo a me, che gi&agrave; grande l&agrave; era.</p></div>\n\n<div class="stanza"><p>Fui chiamato Currado Malaspina;</p>\n<p>non son l&rsquo;antico, ma di lui discesi;</p>\n<p>a&rsquo; miei portai l&rsquo;amor che qui raffina&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, diss&rsquo; io lui, &laquo;per li vostri paesi</p>\n<p>gi&agrave; mai non fui; ma dove si dimora</p>\n<p>per tutta Europa ch&rsquo;ei non sien palesi?</p></div>\n\n<div class="stanza"><p>La fama che la vostra casa onora,</p>\n<p>grida i segnori e grida la contrada,</p>\n<p>s&igrave; che ne sa chi non vi fu ancora;</p></div>\n\n<div class="stanza"><p>e io vi giuro, s&rsquo;io di sopra vada,</p>\n<p>che vostra gente onrata non si sfregia</p>\n<p>del pregio de la borsa e de la spada.</p></div>\n\n<div class="stanza"><p>Uso e natura s&igrave; la privilegia,</p>\n<p>che, perch&eacute; il capo reo il mondo torca,</p>\n<p>sola va dritta e &rsquo;l mal cammin dispregia&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli: &laquo;Or va; che &rsquo;l sol non si ricorca</p>\n<p>sette volte nel letto che &rsquo;l Montone</p>\n<p>con tutti e quattro i pi&egrave; cuopre e inforca,</p></div>\n\n<div class="stanza"><p>che cotesta cortese oppin&iuml;one</p>\n<p>ti fia chiavata in mezzo de la testa</p>\n<p>con maggior chiovi che d&rsquo;altrui sermone,</p></div>\n\n<div class="stanza"><p>se corso di giudicio non s&rsquo;arresta&raquo;.</p></div>','<p class="cantohead">Canto IX</p>\n\n<div class="stanza"><p>La concubina di Titone antico</p>\n<p>gi&agrave; s&rsquo;imbiancava al balco d&rsquo;or&iuml;ente,</p>\n<p>fuor de le braccia del suo dolce amico;</p></div>\n\n<div class="stanza"><p>di gemme la sua fronte era lucente,</p>\n<p>poste in figura del freddo animale</p>\n<p>che con la coda percuote la gente;</p></div>\n\n<div class="stanza"><p>e la notte, de&rsquo; passi con che sale,</p>\n<p>fatti avea due nel loco ov&rsquo; eravamo,</p>\n<p>e &rsquo;l terzo gi&agrave; chinava in giuso l&rsquo;ale;</p></div>\n\n<div class="stanza"><p>quand&rsquo; io, che meco avea di quel d&rsquo;Adamo,</p>\n<p>vinto dal sonno, in su l&rsquo;erba inchinai</p>\n<p>l&agrave; &rsquo;ve gi&agrave; tutti e cinque sedavamo.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;ora che comincia i tristi lai</p>\n<p>la rondinella presso a la mattina,</p>\n<p>forse a memoria de&rsquo; suo&rsquo; primi guai,</p></div>\n\n<div class="stanza"><p>e che la mente nostra, peregrina</p>\n<p>pi&ugrave; da la carne e men da&rsquo; pensier presa,</p>\n<p>a le sue vis&iuml;on quasi &egrave; divina,</p></div>\n\n<div class="stanza"><p>in sogno mi parea veder sospesa</p>\n<p>un&rsquo;aguglia nel ciel con penne d&rsquo;oro,</p>\n<p>con l&rsquo;ali aperte e a calare intesa;</p></div>\n\n<div class="stanza"><p>ed esser mi parea l&agrave; dove fuoro</p>\n<p>abbandonati i suoi da Ganimede,</p>\n<p>quando fu ratto al sommo consistoro.</p></div>\n\n<div class="stanza"><p>Fra me pensava: &lsquo;Forse questa fiede</p>\n<p>pur qui per uso, e forse d&rsquo;altro loco</p>\n<p>disdegna di portarne suso in piede&rsquo;.</p></div>\n\n<div class="stanza"><p>Poi mi parea che, poi rotata un poco,</p>\n<p>terribil come folgor discendesse,</p>\n<p>e me rapisse suso infino al foco.</p></div>\n\n<div class="stanza"><p>Ivi parea che ella e io ardesse;</p>\n<p>e s&igrave; lo &rsquo;ncendio imaginato cosse,</p>\n<p>che convenne che &rsquo;l sonno si rompesse.</p></div>\n\n<div class="stanza"><p>Non altrimenti Achille si riscosse,</p>\n<p>li occhi svegliati rivolgendo in giro</p>\n<p>e non sappiendo l&agrave; dove si fosse,</p></div>\n\n<div class="stanza"><p>quando la madre da Chir&oacute;n a Schiro</p>\n<p>trafugg&ograve; lui dormendo in le sue braccia,</p>\n<p>l&agrave; onde poi li Greci il dipartiro;</p></div>\n\n<div class="stanza"><p>che mi scoss&rsquo; io, s&igrave; come da la faccia</p>\n<p>mi fugg&igrave; &rsquo;l sonno, e diventa&rsquo; ismorto,</p>\n<p>come fa l&rsquo;uom che, spaventato, agghiaccia.</p></div>\n\n<div class="stanza"><p>Dallato m&rsquo;era solo il mio conforto,</p>\n<p>e &rsquo;l sole er&rsquo; alto gi&agrave; pi&ugrave; che due ore,</p>\n<p>e &rsquo;l viso m&rsquo;era a la marina torto.</p></div>\n\n<div class="stanza"><p>&laquo;Non aver tema&raquo;, disse il mio segnore;</p>\n<p>&laquo;fatti sicur, ch&eacute; noi semo a buon punto;</p>\n<p>non stringer, ma rallarga ogne vigore.</p></div>\n\n<div class="stanza"><p>Tu se&rsquo; omai al purgatorio giunto:</p>\n<p>vedi l&agrave; il balzo che &rsquo;l chiude dintorno;</p>\n<p>vedi l&rsquo;entrata l&agrave; &rsquo;ve par digiunto.</p></div>\n\n<div class="stanza"><p>Dianzi, ne l&rsquo;alba che procede al giorno,</p>\n<p>quando l&rsquo;anima tua dentro dormia,</p>\n<p>sovra li fiori ond&rsquo; &egrave; l&agrave; gi&ugrave; addorno</p></div>\n\n<div class="stanza"><p>venne una donna, e disse: &ldquo;I&rsquo; son Lucia;</p>\n<p>lasciatemi pigliar costui che dorme;</p>\n<p>s&igrave; l&rsquo;agevoler&ograve; per la sua via&rdquo;.</p></div>\n\n<div class="stanza"><p>Sordel rimase e l&rsquo;altre genti forme;</p>\n<p>ella ti tolse, e come &rsquo;l d&igrave; fu chiaro,</p>\n<p>sen venne suso; e io per le sue orme.</p></div>\n\n<div class="stanza"><p>Qui ti pos&ograve;, ma pria mi dimostraro</p>\n<p>li occhi suoi belli quella intrata aperta;</p>\n<p>poi ella e &rsquo;l sonno ad una se n&rsquo;andaro&raquo;.</p></div>\n\n<div class="stanza"><p>A guisa d&rsquo;uom che &rsquo;n dubbio si raccerta</p>\n<p>e che muta in conforto sua paura,</p>\n<p>poi che la verit&agrave; li &egrave; discoperta,</p></div>\n\n<div class="stanza"><p>mi cambia&rsquo; io; e come sanza cura</p>\n<p>vide me &rsquo;l duca mio, su per lo balzo</p>\n<p>si mosse, e io di rietro inver&rsquo; l&rsquo;altura.</p></div>\n\n<div class="stanza"><p>Lettor, tu vedi ben com&rsquo; io innalzo</p>\n<p>la mia matera, e per&ograve; con pi&ugrave; arte</p>\n<p>non ti maravigliar s&rsquo;io la rincalzo.</p></div>\n\n<div class="stanza"><p>Noi ci appressammo, ed eravamo in parte</p>\n<p>che l&agrave; dove pareami prima rotto,</p>\n<p>pur come un fesso che muro diparte,</p></div>\n\n<div class="stanza"><p>vidi una porta, e tre gradi di sotto</p>\n<p>per gire ad essa, di color diversi,</p>\n<p>e un portier ch&rsquo;ancor non facea motto.</p></div>\n\n<div class="stanza"><p>E come l&rsquo;occhio pi&ugrave; e pi&ugrave; v&rsquo;apersi,</p>\n<p>vidil seder sovra &rsquo;l grado sovrano,</p>\n<p>tal ne la faccia ch&rsquo;io non lo soffersi;</p></div>\n\n<div class="stanza"><p>e una spada nuda av&euml;a in mano,</p>\n<p>che reflett&euml;a i raggi s&igrave; ver&rsquo; noi,</p>\n<p>ch&rsquo;io drizzava spesso il viso in vano.</p></div>\n\n<div class="stanza"><p>&laquo;Dite costinci: che volete voi?&raquo;,</p>\n<p>cominci&ograve; elli a dire, &laquo;ov&rsquo; &egrave; la scorta?</p>\n<p>Guardate che &rsquo;l venir s&ugrave; non vi n&ograve;i&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Donna del ciel, di queste cose accorta&raquo;,</p>\n<p>rispuose &rsquo;l mio maestro a lui, &laquo;pur dianzi</p>\n<p>ne disse: &ldquo;Andate l&agrave;: quivi &egrave; la porta&rdquo;&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Ed ella i passi vostri in bene avanzi&raquo;,</p>\n<p>ricominci&ograve; il cortese portinaio:</p>\n<p>&laquo;Venite dunque a&rsquo; nostri gradi innanzi&raquo;.</p></div>\n\n<div class="stanza"><p>L&agrave; ne venimmo; e lo scaglion primaio</p>\n<p>bianco marmo era s&igrave; pulito e terso,</p>\n<p>ch&rsquo;io mi specchiai in esso qual io paio.</p></div>\n\n<div class="stanza"><p>Era il secondo tinto pi&ugrave; che perso,</p>\n<p>d&rsquo;una petrina ruvida e arsiccia,</p>\n<p>crepata per lo lungo e per traverso.</p></div>\n\n<div class="stanza"><p>Lo terzo, che di sopra s&rsquo;ammassiccia,</p>\n<p>porfido mi parea, s&igrave; fiammeggiante</p>\n<p>come sangue che fuor di vena spiccia.</p></div>\n\n<div class="stanza"><p>Sovra questo ten&euml;a ambo le piante</p>\n<p>l&rsquo;angel di Dio sedendo in su la soglia</p>\n<p>che mi sembiava pietra di diamante.</p></div>\n\n<div class="stanza"><p>Per li tre gradi s&ugrave; di buona voglia</p>\n<p>mi trasse il duca mio, dicendo: &laquo;Chiedi</p>\n<p>umilemente che &rsquo;l serrame scioglia&raquo;.</p></div>\n\n<div class="stanza"><p>Divoto mi gittai a&rsquo; santi piedi;</p>\n<p>misericordia chiesi e ch&rsquo;el m&rsquo;aprisse,</p>\n<p>ma tre volte nel petto pria mi diedi.</p></div>\n\n<div class="stanza"><p>Sette P ne la fronte mi descrisse</p>\n<p>col punton de la spada, e &laquo;Fa che lavi,</p>\n<p>quando se&rsquo; dentro, queste piaghe&raquo; disse.</p></div>\n\n<div class="stanza"><p>Cenere, o terra che secca si cavi,</p>\n<p>d&rsquo;un color fora col suo vestimento;</p>\n<p>e di sotto da quel trasse due chiavi.</p></div>\n\n<div class="stanza"><p>L&rsquo;una era d&rsquo;oro e l&rsquo;altra era d&rsquo;argento;</p>\n<p>pria con la bianca e poscia con la gialla</p>\n<p>fece a la porta s&igrave;, ch&rsquo;i&rsquo; fu&rsquo; contento.</p></div>\n\n<div class="stanza"><p>&laquo;Quandunque l&rsquo;una d&rsquo;este chiavi falla,</p>\n<p>che non si volga dritta per la toppa&raquo;,</p>\n<p>diss&rsquo; elli a noi, &laquo;non s&rsquo;apre questa calla.</p></div>\n\n<div class="stanza"><p>Pi&ugrave; cara &egrave; l&rsquo;una; ma l&rsquo;altra vuol troppa</p>\n<p>d&rsquo;arte e d&rsquo;ingegno avanti che diserri,</p>\n<p>perch&rsquo; ella &egrave; quella che &rsquo;l nodo digroppa.</p></div>\n\n<div class="stanza"><p>Da Pier le tegno; e dissemi ch&rsquo;i&rsquo; erri</p>\n<p>anzi ad aprir ch&rsquo;a tenerla serrata,</p>\n<p>pur che la gente a&rsquo; piedi mi s&rsquo;atterri&raquo;.</p></div>\n\n<div class="stanza"><p>Poi pinse l&rsquo;uscio a la porta sacrata,</p>\n<p>dicendo: &laquo;Intrate; ma facciovi accorti</p>\n<p>che di fuor torna chi &rsquo;n dietro si guata&raquo;.</p></div>\n\n<div class="stanza"><p>E quando fuor ne&rsquo; cardini distorti</p>\n<p>li spigoli di quella regge sacra,</p>\n<p>che di metallo son sonanti e forti,</p></div>\n\n<div class="stanza"><p>non rugghi&ograve; s&igrave; n&eacute; si mostr&ograve; s&igrave; acra</p>\n<p>Tarp&euml;a, come tolto le fu il buono</p>\n<p>Metello, per che poi rimase macra.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi attento al primo tuono,</p>\n<p>e &lsquo;Te Deum laudamus&rsquo; mi parea</p>\n<p>udire in voce mista al dolce suono.</p></div>\n\n<div class="stanza"><p>Tale imagine a punto mi rendea</p>\n<p>ci&ograve; ch&rsquo;io udiva, qual prender si suole</p>\n<p>quando a cantar con organi si stea;</p></div>\n\n<div class="stanza"><p>ch&rsquo;or s&igrave; or no s&rsquo;intendon le parole.</p></div>','<p class="cantohead">Canto X</p>\n\n<div class="stanza"><p>Poi fummo dentro al soglio de la porta</p>\n<p>che &rsquo;l mal amor de l&rsquo;anime disusa,</p>\n<p>perch&eacute; fa parer dritta la via torta,</p></div>\n\n<div class="stanza"><p>sonando la senti&rsquo; esser richiusa;</p>\n<p>e s&rsquo;io avesse li occhi v&ograve;lti ad essa,</p>\n<p>qual fora stata al fallo degna scusa?</p></div>\n\n<div class="stanza"><p>Noi salavam per una pietra fessa,</p>\n<p>che si moveva e d&rsquo;una e d&rsquo;altra parte,</p>\n<p>s&igrave; come l&rsquo;onda che fugge e s&rsquo;appressa.</p></div>\n\n<div class="stanza"><p>&laquo;Qui si conviene usare un poco d&rsquo;arte&raquo;,</p>\n<p>cominci&ograve; &rsquo;l duca mio, &laquo;in accostarsi</p>\n<p>or quinci, or quindi al lato che si parte&raquo;.</p></div>\n\n<div class="stanza"><p>E questo fece i nostri passi scarsi,</p>\n<p>tanto che pria lo scemo de la luna</p>\n<p>rigiunse al letto suo per ricorcarsi,</p></div>\n\n<div class="stanza"><p>che noi fossimo fuor di quella cruna;</p>\n<p>ma quando fummo liberi e aperti</p>\n<p>s&ugrave; dove il monte in dietro si rauna,</p></div>\n\n<div class="stanza"><p>&iuml;o stancato e amendue incerti</p>\n<p>di nostra via, restammo in su un piano</p>\n<p>solingo pi&ugrave; che strade per diserti.</p></div>\n\n<div class="stanza"><p>Da la sua sponda, ove confina il vano,</p>\n<p>al pi&egrave; de l&rsquo;alta ripa che pur sale,</p>\n<p>misurrebbe in tre volte un corpo umano;</p></div>\n\n<div class="stanza"><p>e quanto l&rsquo;occhio mio potea trar d&rsquo;ale,</p>\n<p>or dal sinistro e or dal destro fianco,</p>\n<p>questa cornice mi parea cotale.</p></div>\n\n<div class="stanza"><p>L&agrave; s&ugrave; non eran mossi i pi&egrave; nostri anco,</p>\n<p>quand&rsquo; io conobbi quella ripa intorno</p>\n<p>che dritto di salita aveva manco,</p></div>\n\n<div class="stanza"><p>esser di marmo candido e addorno</p>\n<p>d&rsquo;intagli s&igrave;, che non pur Policleto,</p>\n<p>ma la natura l&igrave; avrebbe scorno.</p></div>\n\n<div class="stanza"><p>L&rsquo;angel che venne in terra col decreto</p>\n<p>de la molt&rsquo; anni lagrimata pace,</p>\n<p>ch&rsquo;aperse il ciel del suo lungo divieto,</p></div>\n\n<div class="stanza"><p>dinanzi a noi pareva s&igrave; verace</p>\n<p>quivi intagliato in un atto soave,</p>\n<p>che non sembiava imagine che tace.</p></div>\n\n<div class="stanza"><p>Giurato si saria ch&rsquo;el dicesse &lsquo;Ave!&rsquo;;</p>\n<p>perch&eacute; iv&rsquo; era imaginata quella</p>\n<p>ch&rsquo;ad aprir l&rsquo;alto amor volse la chiave;</p></div>\n\n<div class="stanza"><p>e avea in atto impressa esta favella</p>\n<p>&lsquo;Ecce ancilla De&iuml;&rsquo;, propriamente</p>\n<p>come figura in cera si suggella.</p></div>\n\n<div class="stanza"><p>&laquo;Non tener pur ad un loco la mente&raquo;,</p>\n<p>disse &rsquo;l dolce maestro, che m&rsquo;avea</p>\n<p>da quella parte onde &rsquo;l cuore ha la gente.</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;i&rsquo; mi mossi col viso, e vedea</p>\n<p>di retro da Maria, da quella costa</p>\n<p>onde m&rsquo;era colui che mi movea,</p></div>\n\n<div class="stanza"><p>un&rsquo;altra storia ne la roccia imposta;</p>\n<p>per ch&rsquo;io varcai Virgilio, e fe&rsquo;mi presso,</p>\n<p>acci&ograve; che fosse a li occhi miei disposta.</p></div>\n\n<div class="stanza"><p>Era intagliato l&igrave; nel marmo stesso</p>\n<p>lo carro e &rsquo; buoi, traendo l&rsquo;arca santa,</p>\n<p>per che si teme officio non commesso.</p></div>\n\n<div class="stanza"><p>Dinanzi parea gente; e tutta quanta,</p>\n<p>partita in sette cori, a&rsquo; due mie&rsquo; sensi</p>\n<p>faceva dir l&rsquo;un &lsquo;No&rsquo;, l&rsquo;altro &lsquo;S&igrave;, canta&rsquo;.</p></div>\n\n<div class="stanza"><p>Similemente al fummo de li &rsquo;ncensi</p>\n<p>che v&rsquo;era imaginato, li occhi e &rsquo;l naso</p>\n<p>e al s&igrave; e al no discordi fensi.</p></div>\n\n<div class="stanza"><p>L&igrave; precedeva al benedetto vaso,</p>\n<p>trescando alzato, l&rsquo;umile salmista,</p>\n<p>e pi&ugrave; e men che re era in quel caso.</p></div>\n\n<div class="stanza"><p>Di contra, effig&iuml;ata ad una vista</p>\n<p>d&rsquo;un gran palazzo, Mic&ograve;l ammirava</p>\n<p>s&igrave; come donna dispettosa e trista.</p></div>\n\n<div class="stanza"><p>I&rsquo; mossi i pi&egrave; del loco dov&rsquo; io stava,</p>\n<p>per avvisar da presso un&rsquo;altra istoria,</p>\n<p>che di dietro a Mic&ograve;l mi biancheggiava.</p></div>\n\n<div class="stanza"><p>Quiv&rsquo; era stor&iuml;ata l&rsquo;alta gloria</p>\n<p>del roman principato, il cui valore</p>\n<p>mosse Gregorio a la sua gran vittoria;</p></div>\n\n<div class="stanza"><p>i&rsquo; dico di Traiano imperadore;</p>\n<p>e una vedovella li era al freno,</p>\n<p>di lagrime atteggiata e di dolore.</p></div>\n\n<div class="stanza"><p>Intorno a lui parea calcato e pieno</p>\n<p>di cavalieri, e l&rsquo;aguglie ne l&rsquo;oro</p>\n<p>sovr&rsquo; essi in vista al vento si movieno.</p></div>\n\n<div class="stanza"><p>La miserella intra tutti costoro</p>\n<p>pareva dir: &laquo;Segnor, fammi vendetta</p>\n<p>di mio figliuol ch&rsquo;&egrave; morto, ond&rsquo; io m&rsquo;accoro&raquo;;</p></div>\n\n<div class="stanza"><p>ed elli a lei rispondere: &laquo;Or aspetta</p>\n<p>tanto ch&rsquo;i&rsquo; torni&raquo;; e quella: &laquo;Segnor mio&raquo;,</p>\n<p>come persona in cui dolor s&rsquo;affretta,</p></div>\n\n<div class="stanza"><p>&laquo;se tu non torni?&raquo;; ed ei: &laquo;Chi fia dov&rsquo; io,</p>\n<p>la ti far&agrave;&raquo;; ed ella: &laquo;L&rsquo;altrui bene</p>\n<p>a te che fia, se &rsquo;l tuo metti in oblio?&raquo;;</p></div>\n\n<div class="stanza"><p>ond&rsquo; elli: &laquo;Or ti conforta; ch&rsquo;ei convene</p>\n<p>ch&rsquo;i&rsquo; solva il mio dovere anzi ch&rsquo;i&rsquo; mova:</p>\n<p>giustizia vuole e piet&agrave; mi ritene&raquo;.</p></div>\n\n<div class="stanza"><p>Colui che mai non vide cosa nova</p>\n<p>produsse esto visibile parlare,</p>\n<p>novello a noi perch&eacute; qui non si trova.</p></div>\n\n<div class="stanza"><p>Mentr&rsquo; io mi dilettava di guardare</p>\n<p>l&rsquo;imagini di tante umilitadi,</p>\n<p>e per lo fabbro loro a veder care,</p></div>\n\n<div class="stanza"><p>&laquo;Ecco di qua, ma fanno i passi radi&raquo;,</p>\n<p>mormorava il poeta, &laquo;molte genti:</p>\n<p>questi ne &rsquo;nv&iuml;eranno a li alti gradi&raquo;.</p></div>\n\n<div class="stanza"><p>Li occhi miei, ch&rsquo;a mirare eran contenti</p>\n<p>per veder novitadi ond&rsquo; e&rsquo; son vaghi,</p>\n<p>volgendosi ver&rsquo; lui non furon lenti.</p></div>\n\n<div class="stanza"><p>Non vo&rsquo; per&ograve;, lettor, che tu ti smaghi</p>\n<p>di buon proponimento per udire</p>\n<p>come Dio vuol che &rsquo;l debito si paghi.</p></div>\n\n<div class="stanza"><p>Non attender la forma del mart&igrave;re:</p>\n<p>pensa la succession; pensa ch&rsquo;al peggio</p>\n<p>oltre la gran sentenza non pu&ograve; ire.</p></div>\n\n<div class="stanza"><p>Io cominciai: &laquo;Maestro, quel ch&rsquo;io veggio</p>\n<p>muovere a noi, non mi sembian persone,</p>\n<p>e non so che, s&igrave; nel veder vaneggio&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;La grave condizione</p>\n<p>di lor tormento a terra li rannicchia,</p>\n<p>s&igrave; che &rsquo; miei occhi pria n&rsquo;ebber tencione.</p></div>\n\n<div class="stanza"><p>Ma guarda fiso l&agrave;, e disviticchia</p>\n<p>col viso quel che vien sotto a quei sassi:</p>\n<p>gi&agrave; scorger puoi come ciascun si picchia&raquo;.</p></div>\n\n<div class="stanza"><p>O superbi cristian, miseri lassi,</p>\n<p>che, de la vista de la mente infermi,</p>\n<p>fidanza avete ne&rsquo; retrosi passi,</p></div>\n\n<div class="stanza"><p>non v&rsquo;accorgete voi che noi siam vermi</p>\n<p>nati a formar l&rsquo;angelica farfalla,</p>\n<p>che vola a la giustizia sanza schermi?</p></div>\n\n<div class="stanza"><p>Di che l&rsquo;animo vostro in alto galla,</p>\n<p>poi siete quasi antomata in difetto,</p>\n<p>s&igrave; come vermo in cui formazion falla?</p></div>\n\n<div class="stanza"><p>Come per sostentar solaio o tetto,</p>\n<p>per mensola talvolta una figura</p>\n<p>si vede giugner le ginocchia al petto,</p></div>\n\n<div class="stanza"><p>la qual fa del non ver vera rancura</p>\n<p>nascere &rsquo;n chi la vede; cos&igrave; fatti</p>\n<p>vid&rsquo; io color, quando puosi ben cura.</p></div>\n\n<div class="stanza"><p>Vero &egrave; che pi&ugrave; e meno eran contratti</p>\n<p>secondo ch&rsquo;avien pi&ugrave; e meno a dosso;</p>\n<p>e qual pi&ugrave; paz&iuml;enza avea ne li atti,</p></div>\n\n<div class="stanza"><p>piangendo parea dicer: &lsquo;Pi&ugrave; non posso&rsquo;.</p></div>','<p class="cantohead">Canto XI</p>\n\n<div class="stanza"><p>&laquo;O Padre nostro, che ne&rsquo; cieli stai,</p>\n<p>non circunscritto, ma per pi&ugrave; amore</p>\n<p>ch&rsquo;ai primi effetti di l&agrave; s&ugrave; tu hai,</p></div>\n\n<div class="stanza"><p>laudato sia &rsquo;l tuo nome e &rsquo;l tuo valore</p>\n<p>da ogne creatura, com&rsquo; &egrave; degno</p>\n<p>di render grazie al tuo dolce vapore.</p></div>\n\n<div class="stanza"><p>Vegna ver&rsquo; noi la pace del tuo regno,</p>\n<p>ch&eacute; noi ad essa non potem da noi,</p>\n<p>s&rsquo;ella non vien, con tutto nostro ingegno.</p></div>\n\n<div class="stanza"><p>Come del suo voler li angeli tuoi</p>\n<p>fan sacrificio a te, cantando osanna,</p>\n<p>cos&igrave; facciano li uomini de&rsquo; suoi.</p></div>\n\n<div class="stanza"><p>D&agrave; oggi a noi la cotidiana manna,</p>\n<p>sanza la qual per questo aspro diserto</p>\n<p>a retro va chi pi&ugrave; di gir s&rsquo;affanna.</p></div>\n\n<div class="stanza"><p>E come noi lo mal ch&rsquo;avem sofferto</p>\n<p>perdoniamo a ciascuno, e tu perdona</p>\n<p>benigno, e non guardar lo nostro merto.</p></div>\n\n<div class="stanza"><p>Nostra virt&ugrave; che di legger s&rsquo;adona,</p>\n<p>non spermentar con l&rsquo;antico avversaro,</p>\n<p>ma libera da lui che s&igrave; la sprona.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; ultima preghiera, segnor caro,</p>\n<p>gi&agrave; non si fa per noi, ch&eacute; non bisogna,</p>\n<p>ma per color che dietro a noi restaro&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; a s&eacute; e noi buona ramogna</p>\n<p>quell&rsquo; ombre orando, andavan sotto &rsquo;l pondo,</p>\n<p>simile a quel che talvolta si sogna,</p></div>\n\n<div class="stanza"><p>disparmente angosciate tutte a tondo</p>\n<p>e lasse su per la prima cornice,</p>\n<p>purgando la caligine del mondo.</p></div>\n\n<div class="stanza"><p>Se di l&agrave; sempre ben per noi si dice,</p>\n<p>di qua che dire e far per lor si puote</p>\n<p>da quei c&rsquo;hanno al voler buona radice?</p></div>\n\n<div class="stanza"><p>Ben si de&rsquo; loro atar lavar le note</p>\n<p>che portar quinci, s&igrave; che, mondi e lievi,</p>\n<p>possano uscire a le stellate ruote.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, se giustizia e piet&agrave; vi disgrievi</p>\n<p>tosto, s&igrave; che possiate muover l&rsquo;ala,</p>\n<p>che secondo il disio vostro vi lievi,</p></div>\n\n<div class="stanza"><p>mostrate da qual mano inver&rsquo; la scala</p>\n<p>si va pi&ugrave; corto; e se c&rsquo;&egrave; pi&ugrave; d&rsquo;un varco,</p>\n<p>quel ne &rsquo;nsegnate che men erto cala;</p></div>\n\n<div class="stanza"><p>ch&eacute; questi che vien meco, per lo &rsquo;ncarco</p>\n<p>de la carne d&rsquo;Adamo onde si veste,</p>\n<p>al montar s&ugrave;, contra sua voglia, &egrave; parco&raquo;.</p></div>\n\n<div class="stanza"><p>Le lor parole, che rendero a queste</p>\n<p>che dette avea colui cu&rsquo; io seguiva,</p>\n<p>non fur da cui venisser manifeste;</p></div>\n\n<div class="stanza"><p>ma fu detto: &laquo;A man destra per la riva</p>\n<p>con noi venite, e troverete il passo</p>\n<p>possibile a salir persona viva.</p></div>\n\n<div class="stanza"><p>E s&rsquo;io non fossi impedito dal sasso</p>\n<p>che la cervice mia superba doma,</p>\n<p>onde portar convienmi il viso basso,</p></div>\n\n<div class="stanza"><p>cotesti, ch&rsquo;ancor vive e non si noma,</p>\n<p>guardere&rsquo; io, per veder s&rsquo;i&rsquo; &rsquo;l conosco,</p>\n<p>e per farlo pietoso a questa soma.</p></div>\n\n<div class="stanza"><p>Io fui latino e nato d&rsquo;un gran Tosco:</p>\n<p>Guiglielmo Aldobrandesco fu mio padre;</p>\n<p>non so se &rsquo;l nome suo gi&agrave; mai fu vosco.</p></div>\n\n<div class="stanza"><p>L&rsquo;antico sangue e l&rsquo;opere leggiadre</p>\n<p>d&rsquo;i miei maggior mi fer s&igrave; arrogante,</p>\n<p>che, non pensando a la comune madre,</p></div>\n\n<div class="stanza"><p>ogn&rsquo; uomo ebbi in despetto tanto avante,</p>\n<p>ch&rsquo;io ne mori&rsquo;, come i Sanesi sanno,</p>\n<p>e sallo in Campagnatico ogne fante.</p></div>\n\n<div class="stanza"><p>Io sono Omberto; e non pur a me danno</p>\n<p>superbia fa, ch&eacute; tutti miei consorti</p>\n<p>ha ella tratti seco nel malanno.</p></div>\n\n<div class="stanza"><p>E qui convien ch&rsquo;io questo peso porti</p>\n<p>per lei, tanto che a Dio si sodisfaccia,</p>\n<p>poi ch&rsquo;io nol fe&rsquo; tra &rsquo; vivi, qui tra &rsquo; morti&raquo;.</p></div>\n\n<div class="stanza"><p>Ascoltando chinai in gi&ugrave; la faccia;</p>\n<p>e un di lor, non questi che parlava,</p>\n<p>si torse sotto il peso che li &rsquo;mpaccia,</p></div>\n\n<div class="stanza"><p>e videmi e conobbemi e chiamava,</p>\n<p>tenendo li occhi con fatica fisi</p>\n<p>a me che tutto chin con loro andava.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, diss&rsquo; io lui, &laquo;non se&rsquo; tu Oderisi,</p>\n<p>l&rsquo;onor d&rsquo;Agobbio e l&rsquo;onor di quell&rsquo; arte</p>\n<p>ch&rsquo;alluminar chiamata &egrave; in Parisi?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Frate&raquo;, diss&rsquo; elli, &laquo;pi&ugrave; ridon le carte</p>\n<p>che pennelleggia Franco Bolognese;</p>\n<p>l&rsquo;onore &egrave; tutto or suo, e mio in parte.</p></div>\n\n<div class="stanza"><p>Ben non sare&rsquo; io stato s&igrave; cortese</p>\n<p>mentre ch&rsquo;io vissi, per lo gran disio</p>\n<p>de l&rsquo;eccellenza ove mio core intese.</p></div>\n\n<div class="stanza"><p>Di tal superbia qui si paga il fio;</p>\n<p>e ancor non sarei qui, se non fosse</p>\n<p>che, possendo peccar, mi volsi a Dio.</p></div>\n\n<div class="stanza"><p>Oh vana gloria de l&rsquo;umane posse!</p>\n<p>com&rsquo; poco verde in su la cima dura,</p>\n<p>se non &egrave; giunta da l&rsquo;etati grosse!</p></div>\n\n<div class="stanza"><p>Credette Cimabue ne la pittura</p>\n<p>tener lo campo, e ora ha Giotto il grido,</p>\n<p>s&igrave; che la fama di colui &egrave; scura.</p></div>\n\n<div class="stanza"><p>Cos&igrave; ha tolto l&rsquo;uno a l&rsquo;altro Guido</p>\n<p>la gloria de la lingua; e forse &egrave; nato</p>\n<p>chi l&rsquo;uno e l&rsquo;altro caccer&agrave; del nido.</p></div>\n\n<div class="stanza"><p>Non &egrave; il mondan romore altro ch&rsquo;un fiato</p>\n<p>di vento, ch&rsquo;or vien quinci e or vien quindi,</p>\n<p>e muta nome perch&eacute; muta lato.</p></div>\n\n<div class="stanza"><p>Che voce avrai tu pi&ugrave;, se vecchia scindi</p>\n<p>da te la carne, che se fossi morto</p>\n<p>anzi che tu lasciassi il &lsquo;pappo&rsquo; e &rsquo;l &lsquo;dindi&rsquo;,</p></div>\n\n<div class="stanza"><p>pria che passin mill&rsquo; anni? ch&rsquo;&egrave; pi&ugrave; corto</p>\n<p>spazio a l&rsquo;etterno, ch&rsquo;un muover di ciglia</p>\n<p>al cerchio che pi&ugrave; tardi in cielo &egrave; torto.</p></div>\n\n<div class="stanza"><p>Colui che del cammin s&igrave; poco piglia</p>\n<p>dinanzi a me, Toscana son&ograve; tutta;</p>\n<p>e ora a pena in Siena sen pispiglia,</p></div>\n\n<div class="stanza"><p>ond&rsquo; era sire quando fu distrutta</p>\n<p>la rabbia fiorentina, che superba</p>\n<p>fu a quel tempo s&igrave; com&rsquo; ora &egrave; putta.</p></div>\n\n<div class="stanza"><p>La vostra nominanza &egrave; color d&rsquo;erba,</p>\n<p>che viene e va, e quei la discolora</p>\n<p>per cui ella esce de la terra acerba&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Tuo vero dir m&rsquo;incora</p>\n<p>bona umilt&agrave;, e gran tumor m&rsquo;appiani;</p>\n<p>ma chi &egrave; quei di cui tu parlavi ora?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Quelli &egrave;&raquo;, rispuose, &laquo;Provenzan Salvani;</p>\n<p>ed &egrave; qui perch&eacute; fu presunt&uuml;oso</p>\n<p>a recar Siena tutta a le sue mani.</p></div>\n\n<div class="stanza"><p>Ito &egrave; cos&igrave; e va, sanza riposo,</p>\n<p>poi che mor&igrave;; cotal moneta rende</p>\n<p>a sodisfar chi &egrave; di l&agrave; troppo oso&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Se quello spirito ch&rsquo;attende,</p>\n<p>pria che si penta, l&rsquo;orlo de la vita,</p>\n<p>qua gi&ugrave; dimora e qua s&ugrave; non ascende,</p></div>\n\n<div class="stanza"><p>se buona oraz&iuml;on lui non aita,</p>\n<p>prima che passi tempo quanto visse,</p>\n<p>come fu la venuta lui largita?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Quando vivea pi&ugrave; glor&iuml;oso&raquo;, disse,</p>\n<p>&laquo;liberamente nel Campo di Siena,</p>\n<p>ogne vergogna diposta, s&rsquo;affisse;</p></div>\n\n<div class="stanza"><p>e l&igrave;, per trar l&rsquo;amico suo di pena,</p>\n<p>ch&rsquo;e&rsquo; sostenea ne la prigion di Carlo,</p>\n<p>si condusse a tremar per ogne vena.</p></div>\n\n<div class="stanza"><p>Pi&ugrave; non dir&ograve;, e scuro so che parlo;</p>\n<p>ma poco tempo andr&agrave;, che &rsquo; tuoi vicini</p>\n<p>faranno s&igrave; che tu potrai chiosarlo.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; opera li tolse quei confini&raquo;.</p></div>','<p class="cantohead">Canto XII</p>\n\n<div class="stanza"><p>Di pari, come buoi che vanno a giogo,</p>\n<p>m&rsquo;andava io con quell&rsquo; anima carca,</p>\n<p>fin che &rsquo;l sofferse il dolce pedagogo.</p></div>\n\n<div class="stanza"><p>Ma quando disse: &laquo;Lascia lui e varca;</p>\n<p>ch&eacute; qui &egrave; buono con l&rsquo;ali e coi remi,</p>\n<p>quantunque pu&ograve;, ciascun pinger sua barca&raquo;;</p></div>\n\n<div class="stanza"><p>dritto s&igrave; come andar vuolsi rife&rsquo;mi</p>\n<p>con la persona, avvegna che i pensieri</p>\n<p>mi rimanessero e chinati e scemi.</p></div>\n\n<div class="stanza"><p>Io m&rsquo;era mosso, e seguia volontieri</p>\n<p>del mio maestro i passi, e amendue</p>\n<p>gi&agrave; mostravam com&rsquo; eravam leggeri;</p></div>\n\n<div class="stanza"><p>ed el mi disse: &laquo;Volgi li occhi in gi&ugrave;e:</p>\n<p>buon ti sar&agrave;, per tranquillar la via,</p>\n<p>veder lo letto de le piante tue&raquo;.</p></div>\n\n<div class="stanza"><p>Come, perch&eacute; di lor memoria sia,</p>\n<p>sovra i sepolti le tombe terragne</p>\n<p>portan segnato quel ch&rsquo;elli eran pria,</p></div>\n\n<div class="stanza"><p>onde l&igrave; molte volte si ripiagne</p>\n<p>per la puntura de la rimembranza,</p>\n<p>che solo a&rsquo; p&iuml;i d&agrave; de le calcagne;</p></div>\n\n<div class="stanza"><p>s&igrave; vid&rsquo; io l&igrave;, ma di miglior sembianza</p>\n<p>secondo l&rsquo;artificio, figurato</p>\n<p>quanto per via di fuor del monte avanza.</p></div>\n\n<div class="stanza"><p>Vedea colui che fu nobil creato</p>\n<p>pi&ugrave; ch&rsquo;altra creatura, gi&ugrave; dal cielo</p>\n<p>folgoreggiando scender, da l&rsquo;un lato.</p></div>\n\n<div class="stanza"><p>Ved&euml;a Br&iuml;areo fitto dal telo</p>\n<p>celest&iuml;al giacer, da l&rsquo;altra parte,</p>\n<p>grave a la terra per lo mortal gelo.</p></div>\n\n<div class="stanza"><p>Vedea Timbreo, vedea Pallade e Marte,</p>\n<p>armati ancora, intorno al padre loro,</p>\n<p>mirar le membra d&rsquo;i Giganti sparte.</p></div>\n\n<div class="stanza"><p>Vedea Nembr&ograve;t a pi&egrave; del gran lavoro</p>\n<p>quasi smarrito, e riguardar le genti</p>\n<p>che &rsquo;n Senna&agrave;r con lui superbi fuoro.</p></div>\n\n<div class="stanza"><p>O N&iuml;ob&egrave;, con che occhi dolenti</p>\n<p>vedea io te segnata in su la strada,</p>\n<p>tra sette e sette tuoi figliuoli spenti!</p></div>\n\n<div class="stanza"><p>O Sa&ugrave;l, come in su la propria spada</p>\n<p>quivi parevi morto in Gelbo&egrave;,</p>\n<p>che poi non sent&igrave; pioggia n&eacute; rugiada!</p></div>\n\n<div class="stanza"><p>O folle Aragne, s&igrave; vedea io te</p>\n<p>gi&agrave; mezza ragna, trista in su li stracci</p>\n<p>de l&rsquo;opera che mal per te si f&eacute;.</p></div>\n\n<div class="stanza"><p>O Robo&agrave;m, gi&agrave; non par che minacci</p>\n<p>quivi &rsquo;l tuo segno; ma pien di spavento</p>\n<p>nel porta un carro, sanza ch&rsquo;altri il cacci.</p></div>\n\n<div class="stanza"><p>Mostrava ancor lo duro pavimento</p>\n<p>come Almeon a sua madre f&eacute; caro</p>\n<p>parer lo sventurato addornamento.</p></div>\n\n<div class="stanza"><p>Mostrava come i figli si gittaro</p>\n<p>sovra Sennacher&igrave;b dentro dal tempio,</p>\n<p>e come, morto lui, quivi il lasciaro.</p></div>\n\n<div class="stanza"><p>Mostrava la ruina e &rsquo;l crudo scempio</p>\n<p>che f&eacute; Tamiri, quando disse a Ciro:</p>\n<p>&laquo;Sangue sitisti, e io di sangue t&rsquo;empio&raquo;.</p></div>\n\n<div class="stanza"><p>Mostrava come in rotta si fuggiro</p>\n<p>li Assiri, poi che fu morto Oloferne,</p>\n<p>e anche le reliquie del martiro.</p></div>\n\n<div class="stanza"><p>Vedeva Troia in cenere e in caverne;</p>\n<p>o Il&iuml;&oacute;n, come te basso e vile</p>\n<p>mostrava il segno che l&igrave; si discerne!</p></div>\n\n<div class="stanza"><p>Qual di pennel fu maestro o di stile</p>\n<p>che ritraesse l&rsquo;ombre e &rsquo; tratti ch&rsquo;ivi</p>\n<p>mirar farieno uno ingegno sottile?</p></div>\n\n<div class="stanza"><p>Morti li morti e i vivi parean vivi:</p>\n<p>non vide mei di me chi vide il vero,</p>\n<p>quant&rsquo; io calcai, fin che chinato givi.</p></div>\n\n<div class="stanza"><p>Or superbite, e via col viso altero,</p>\n<p>figliuoli d&rsquo;Eva, e non chinate il volto</p>\n<p>s&igrave; che veggiate il vostro mal sentero!</p></div>\n\n<div class="stanza"><p>Pi&ugrave; era gi&agrave; per noi del monte v&ograve;lto</p>\n<p>e del cammin del sole assai pi&ugrave; speso</p>\n<p>che non stimava l&rsquo;animo non sciolto,</p></div>\n\n<div class="stanza"><p>quando colui che sempre innanzi atteso</p>\n<p>andava, cominci&ograve;: &laquo;Drizza la testa;</p>\n<p>non &egrave; pi&ugrave; tempo di gir s&igrave; sospeso.</p></div>\n\n<div class="stanza"><p>Vedi col&agrave; un angel che s&rsquo;appresta</p>\n<p>per venir verso noi; vedi che torna</p>\n<p>dal servigio del d&igrave; l&rsquo;ancella sesta.</p></div>\n\n<div class="stanza"><p>Di reverenza il viso e li atti addorna,</p>\n<p>s&igrave; che i diletti lo &rsquo;nv&iuml;arci in suso;</p>\n<p>pensa che questo d&igrave; mai non raggiorna!&raquo;.</p></div>\n\n<div class="stanza"><p>Io era ben del suo ammonir uso</p>\n<p>pur di non perder tempo, s&igrave; che &rsquo;n quella</p>\n<p>materia non potea parlarmi chiuso.</p></div>\n\n<div class="stanza"><p>A noi ven&igrave;a la creatura bella,</p>\n<p>biancovestito e ne la faccia quale</p>\n<p>par tremolando mattutina stella.</p></div>\n\n<div class="stanza"><p>Le braccia aperse, e indi aperse l&rsquo;ale;</p>\n<p>disse: &laquo;Venite: qui son presso i gradi,</p>\n<p>e agevolemente omai si sale.</p></div>\n\n<div class="stanza"><p>A questo invito vegnon molto radi:</p>\n<p>o gente umana, per volar s&ugrave; nata,</p>\n<p>perch&eacute; a poco vento cos&igrave; cadi?&raquo;.</p></div>\n\n<div class="stanza"><p>Menocci ove la roccia era tagliata;</p>\n<p>quivi mi batt&eacute; l&rsquo;ali per la fronte;</p>\n<p>poi mi promise sicura l&rsquo;andata.</p></div>\n\n<div class="stanza"><p>Come a man destra, per salire al monte</p>\n<p>dove siede la chiesa che soggioga</p>\n<p>la ben guidata sopra Rubaconte,</p></div>\n\n<div class="stanza"><p>si rompe del montar l&rsquo;ardita foga</p>\n<p>per le scalee che si fero ad etade</p>\n<p>ch&rsquo;era sicuro il quaderno e la doga;</p></div>\n\n<div class="stanza"><p>cos&igrave; s&rsquo;allenta la ripa che cade</p>\n<p>quivi ben ratta da l&rsquo;altro girone;</p>\n<p>ma quinci e quindi l&rsquo;alta pietra rade.</p></div>\n\n<div class="stanza"><p>Noi volgendo ivi le nostre persone,</p>\n<p>&lsquo;Beati pauperes spiritu!&rsquo; voci</p>\n<p>cantaron s&igrave;, che nol diria sermone.</p></div>\n\n<div class="stanza"><p>Ahi quanto son diverse quelle foci</p>\n<p>da l&rsquo;infernali! ch&eacute; quivi per canti</p>\n<p>s&rsquo;entra, e l&agrave; gi&ugrave; per lamenti feroci.</p></div>\n\n<div class="stanza"><p>Gi&agrave; montavam su per li scaglion santi,</p>\n<p>ed esser mi parea troppo pi&ugrave; lieve</p>\n<p>che per lo pian non mi parea davanti.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io: &laquo;Maestro, d&igrave;, qual cosa greve</p>\n<p>levata s&rsquo;&egrave; da me, che nulla quasi</p>\n<p>per me fatica, andando, si riceve?&raquo;.</p></div>\n\n<div class="stanza"><p>Rispuose: &laquo;Quando i P che son rimasi</p>\n<p>ancor nel volto tuo presso che stinti,</p>\n<p>saranno, com&rsquo; &egrave; l&rsquo;un, del tutto rasi,</p></div>\n\n<div class="stanza"><p>fier li tuoi pi&egrave; dal buon voler s&igrave; vinti,</p>\n<p>che non pur non fatica sentiranno,</p>\n<p>ma fia diletto loro esser s&ugrave; pinti&raquo;.</p></div>\n\n<div class="stanza"><p>Allor fec&rsquo; io come color che vanno</p>\n<p>con cosa in capo non da lor saputa,</p>\n<p>se non che &rsquo; cenni altrui sospecciar fanno;</p></div>\n\n<div class="stanza"><p>per che la mano ad accertar s&rsquo;aiuta,</p>\n<p>e cerca e truova e quello officio adempie</p>\n<p>che non si pu&ograve; fornir per la veduta;</p></div>\n\n<div class="stanza"><p>e con le dita de la destra scempie</p>\n<p>trovai pur sei le lettere che &rsquo;ncise</p>\n<p>quel da le chiavi a me sovra le tempie:</p></div>\n\n<div class="stanza"><p>a che guardando, il mio duca sorrise.</p></div>','<p class="cantohead">Canto XIII</p>\n\n<div class="stanza"><p>Noi eravamo al sommo de la scala,</p>\n<p>dove secondamente si risega</p>\n<p>lo monte che salendo altrui dismala.</p></div>\n\n<div class="stanza"><p>Ivi cos&igrave; una cornice lega</p>\n<p>dintorno il poggio, come la primaia;</p>\n<p>se non che l&rsquo;arco suo pi&ugrave; tosto piega.</p></div>\n\n<div class="stanza"><p>Ombra non l&igrave; &egrave; n&eacute; segno che si paia:</p>\n<p>parsi la ripa e parsi la via schietta</p>\n<p>col livido color de la petraia.</p></div>\n\n<div class="stanza"><p>&laquo;Se qui per dimandar gente s&rsquo;aspetta&raquo;,</p>\n<p>ragionava il poeta, &laquo;io temo forse</p>\n<p>che troppo avr&agrave; d&rsquo;indugio nostra eletta&raquo;.</p></div>\n\n<div class="stanza"><p>Poi fisamente al sole li occhi porse;</p>\n<p>fece del destro lato a muover centro,</p>\n<p>e la sinistra parte di s&eacute; torse.</p></div>\n\n<div class="stanza"><p>&laquo;O dolce lume a cui fidanza i&rsquo; entro</p>\n<p>per lo novo cammin, tu ne conduci&raquo;,</p>\n<p>dicea, &laquo;come condur si vuol quinc&rsquo; entro.</p></div>\n\n<div class="stanza"><p>Tu scaldi il mondo, tu sovr&rsquo; esso luci;</p>\n<p>s&rsquo;altra ragione in contrario non ponta,</p>\n<p>esser dien sempre li tuoi raggi duci&raquo;.</p></div>\n\n<div class="stanza"><p>Quanto di qua per un migliaio si conta,</p>\n<p>tanto di l&agrave; eravam noi gi&agrave; iti,</p>\n<p>con poco tempo, per la voglia pronta;</p></div>\n\n<div class="stanza"><p>e verso noi volar furon sentiti,</p>\n<p>non per&ograve; visti, spiriti parlando</p>\n<p>a la mensa d&rsquo;amor cortesi inviti.</p></div>\n\n<div class="stanza"><p>La prima voce che pass&ograve; volando</p>\n<p>&lsquo;Vinum non habent&rsquo; altamente disse,</p>\n<p>e dietro a noi l&rsquo;and&ograve; re&iuml;terando.</p></div>\n\n<div class="stanza"><p>E prima che del tutto non si udisse</p>\n<p>per allungarsi, un&rsquo;altra &lsquo;I&rsquo; sono Oreste&rsquo;</p>\n<p>pass&ograve; gridando, e anco non s&rsquo;affisse.</p></div>\n\n<div class="stanza"><p>&laquo;Oh!&raquo;, diss&rsquo; io, &laquo;padre, che voci son queste?&raquo;.</p>\n<p>E com&rsquo; io domandai, ecco la terza</p>\n<p>dicendo: &lsquo;Amate da cui male aveste&rsquo;.</p></div>\n\n<div class="stanza"><p>E &rsquo;l buon maestro: &laquo;Questo cinghio sferza</p>\n<p>la colpa de la invidia, e per&ograve; sono</p>\n<p>tratte d&rsquo;amor le corde de la ferza.</p></div>\n\n<div class="stanza"><p>Lo fren vuol esser del contrario suono;</p>\n<p>credo che l&rsquo;udirai, per mio avviso,</p>\n<p>prima che giunghi al passo del perdono.</p></div>\n\n<div class="stanza"><p>Ma ficca li occhi per l&rsquo;aere ben fiso,</p>\n<p>e vedrai gente innanzi a noi sedersi,</p>\n<p>e ciascun &egrave; lungo la grotta assiso&raquo;.</p></div>\n\n<div class="stanza"><p>Allora pi&ugrave; che prima li occhi apersi;</p>\n<p>guarda&rsquo;mi innanzi, e vidi ombre con manti</p>\n<p>al color de la pietra non diversi.</p></div>\n\n<div class="stanza"><p>E poi che fummo un poco pi&ugrave; avanti,</p>\n<p>udia gridar: &lsquo;Maria, &ograve;ra per noi&rsquo;:</p>\n<p>gridar &lsquo;Michele&rsquo; e &lsquo;Pietro&rsquo; e &lsquo;Tutti santi&rsquo;.</p></div>\n\n<div class="stanza"><p>Non credo che per terra vada ancoi</p>\n<p>omo s&igrave; duro, che non fosse punto</p>\n<p>per compassion di quel ch&rsquo;i&rsquo; vidi poi;</p></div>\n\n<div class="stanza"><p>ch&eacute;, quando fui s&igrave; presso di lor giunto,</p>\n<p>che li atti loro a me venivan certi,</p>\n<p>per li occhi fui di grave dolor munto.</p></div>\n\n<div class="stanza"><p>Di vil ciliccio mi parean coperti,</p>\n<p>e l&rsquo;un sofferia l&rsquo;altro con la spalla,</p>\n<p>e tutti da la ripa eran sofferti.</p></div>\n\n<div class="stanza"><p>Cos&igrave; li ciechi a cui la roba falla,</p>\n<p>stanno a&rsquo; perdoni a chieder lor bisogna,</p>\n<p>e l&rsquo;uno il capo sopra l&rsquo;altro avvalla,</p></div>\n\n<div class="stanza"><p>perch&eacute; &rsquo;n altrui piet&agrave; tosto si pogna,</p>\n<p>non pur per lo sonar de le parole,</p>\n<p>ma per la vista che non meno agogna.</p></div>\n\n<div class="stanza"><p>E come a li orbi non approda il sole,</p>\n<p>cos&igrave; a l&rsquo;ombre quivi, ond&rsquo; io parlo ora,</p>\n<p>luce del ciel di s&eacute; largir non vole;</p></div>\n\n<div class="stanza"><p>ch&eacute; a tutti un fil di ferro i cigli f&oacute;ra</p>\n<p>e cusce s&igrave;, come a sparvier selvaggio</p>\n<p>si fa per&ograve; che queto non dimora.</p></div>\n\n<div class="stanza"><p>A me pareva, andando, fare oltraggio,</p>\n<p>veggendo altrui, non essendo veduto:</p>\n<p>per ch&rsquo;io mi volsi al mio consiglio saggio.</p></div>\n\n<div class="stanza"><p>Ben sapev&rsquo; ei che volea dir lo muto;</p>\n<p>e per&ograve; non attese mia dimanda,</p>\n<p>ma disse: &laquo;Parla, e sie breve e arguto&raquo;.</p></div>\n\n<div class="stanza"><p>Virgilio mi ven&igrave;a da quella banda</p>\n<p>de la cornice onde cader si puote,</p>\n<p>perch&eacute; da nulla sponda s&rsquo;inghirlanda;</p></div>\n\n<div class="stanza"><p>da l&rsquo;altra parte m&rsquo;eran le divote</p>\n<p>ombre, che per l&rsquo;orribile costura</p>\n<p>premevan s&igrave;, che bagnavan le gote.</p></div>\n\n<div class="stanza"><p>Volsimi a loro e: &laquo;O gente sicura&raquo;,</p>\n<p>incominciai, &laquo;di veder l&rsquo;alto lume</p>\n<p>che &rsquo;l disio vostro solo ha in sua cura,</p></div>\n\n<div class="stanza"><p>se tosto grazia resolva le schiume</p>\n<p>di vostra cosc&iuml;enza s&igrave; che chiaro</p>\n<p>per essa scenda de la mente il fiume,</p></div>\n\n<div class="stanza"><p>ditemi, ch&eacute; mi fia grazioso e caro,</p>\n<p>s&rsquo;anima &egrave; qui tra voi che sia latina;</p>\n<p>e forse lei sar&agrave; buon s&rsquo;i&rsquo; l&rsquo;apparo&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O frate mio, ciascuna &egrave; cittadina</p>\n<p>d&rsquo;una vera citt&agrave;; ma tu vuo&rsquo; dire</p>\n<p>che vivesse in Italia peregrina&raquo;.</p></div>\n\n<div class="stanza"><p>Questo mi parve per risposta udire</p>\n<p>pi&ugrave; innanzi alquanto che l&agrave; dov&rsquo; io stava,</p>\n<p>ond&rsquo; io mi feci ancor pi&ugrave; l&agrave; sentire.</p></div>\n\n<div class="stanza"><p>Tra l&rsquo;altre vidi un&rsquo;ombra ch&rsquo;aspettava</p>\n<p>in vista; e se volesse alcun dir &lsquo;Come?&rsquo;,</p>\n<p>lo mento a guisa d&rsquo;orbo in s&ugrave; levava.</p></div>\n\n<div class="stanza"><p>&laquo;Spirto&raquo;, diss&rsquo; io, &laquo;che per salir ti dome,</p>\n<p>se tu se&rsquo; quelli che mi rispondesti,</p>\n<p>fammiti conto o per luogo o per nome&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io fui sanese&raquo;, rispuose, &laquo;e con questi</p>\n<p>altri rimendo qui la vita ria,</p>\n<p>lagrimando a colui che s&eacute; ne presti.</p></div>\n\n<div class="stanza"><p>Savia non fui, avvegna che Sap&igrave;a</p>\n<p>fossi chiamata, e fui de li altrui danni</p>\n<p>pi&ugrave; lieta assai che di ventura mia.</p></div>\n\n<div class="stanza"><p>E perch&eacute; tu non creda ch&rsquo;io t&rsquo;inganni,</p>\n<p>odi s&rsquo;i&rsquo; fui, com&rsquo; io ti dico, folle,</p>\n<p>gi&agrave; discendendo l&rsquo;arco d&rsquo;i miei anni.</p></div>\n\n<div class="stanza"><p>Eran li cittadin miei presso a Colle</p>\n<p>in campo giunti co&rsquo; loro avversari,</p>\n<p>e io pregava Iddio di quel ch&rsquo;e&rsquo; volle.</p></div>\n\n<div class="stanza"><p>Rotti fuor quivi e v&ograve;lti ne li amari</p>\n<p>passi di fuga; e veggendo la caccia,</p>\n<p>letizia presi a tutte altre dispari,</p></div>\n\n<div class="stanza"><p>tanto ch&rsquo;io volsi in s&ugrave; l&rsquo;ardita faccia,</p>\n<p>gridando a Dio: &ldquo;Omai pi&ugrave; non ti temo!&rdquo;,</p>\n<p>come f&eacute; &rsquo;l merlo per poca bonaccia.</p></div>\n\n<div class="stanza"><p>Pace volli con Dio in su lo stremo</p>\n<p>de la mia vita; e ancor non sarebbe</p>\n<p>lo mio dover per penitenza scemo,</p></div>\n\n<div class="stanza"><p>se ci&ograve; non fosse, ch&rsquo;a memoria m&rsquo;ebbe</p>\n<p>Pier Pettinaio in sue sante orazioni,</p>\n<p>a cui di me per caritate increbbe.</p></div>\n\n<div class="stanza"><p>Ma tu chi se&rsquo;, che nostre condizioni</p>\n<p>vai dimandando, e porti li occhi sciolti,</p>\n<p>s&igrave; com&rsquo; io credo, e spirando ragioni?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Li occhi&raquo;, diss&rsquo; io, &laquo;mi fieno ancor qui tolti,</p>\n<p>ma picciol tempo, ch&eacute; poca &egrave; l&rsquo;offesa</p>\n<p>fatta per esser con invidia v&ograve;lti.</p></div>\n\n<div class="stanza"><p>Troppa &egrave; pi&ugrave; la paura ond&rsquo; &egrave; sospesa</p>\n<p>l&rsquo;anima mia del tormento di sotto,</p>\n<p>che gi&agrave; lo &rsquo;ncarco di l&agrave; gi&ugrave; mi pesa&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ella a me: &laquo;Chi t&rsquo;ha dunque condotto</p>\n<p>qua s&ugrave; tra noi, se gi&ugrave; ritornar credi?&raquo;.</p>\n<p>E io: &laquo;Costui ch&rsquo;&egrave; meco e non fa motto.</p></div>\n\n<div class="stanza"><p>E vivo sono; e per&ograve; mi richiedi,</p>\n<p>spirito eletto, se tu vuo&rsquo; ch&rsquo;i&rsquo; mova</p>\n<p>di l&agrave; per te ancor li mortai piedi&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Oh, questa &egrave; a udir s&igrave; cosa nuova&raquo;,</p>\n<p>rispuose, &laquo;che gran segno &egrave; che Dio t&rsquo;ami;</p>\n<p>per&ograve; col priego tuo talor mi giova.</p></div>\n\n<div class="stanza"><p>E cheggioti, per quel che tu pi&ugrave; brami,</p>\n<p>se mai calchi la terra di Toscana,</p>\n<p>che a&rsquo; miei propinqui tu ben mi rinfami.</p></div>\n\n<div class="stanza"><p>Tu li vedrai tra quella gente vana</p>\n<p>che spera in Talamone, e perderagli</p>\n<p>pi&ugrave; di speranza ch&rsquo;a trovar la Diana;</p></div>\n\n<div class="stanza"><p>ma pi&ugrave; vi perderanno li ammiragli&raquo;.</p></div>','<p class="cantohead">Canto XIV</p>\n\n<div class="stanza"><p>&laquo;Chi &egrave; costui che &rsquo;l nostro monte cerchia</p>\n<p>prima che morte li abbia dato il volo,</p>\n<p>e apre li occhi a sua voglia e coverchia?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Non so chi sia, ma so ch&rsquo;e&rsquo; non &egrave; solo;</p>\n<p>domandal tu che pi&ugrave; li t&rsquo;avvicini,</p>\n<p>e dolcemente, s&igrave; che parli, acco&rsquo;lo&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; due spirti, l&rsquo;uno a l&rsquo;altro chini,</p>\n<p>ragionavan di me ivi a man dritta;</p>\n<p>poi fer li visi, per dirmi, supini;</p></div>\n\n<div class="stanza"><p>e disse l&rsquo;uno: &laquo;O anima che fitta</p>\n<p>nel corpo ancora inver&rsquo; lo ciel ten vai,</p>\n<p>per carit&agrave; ne consola e ne ditta</p></div>\n\n<div class="stanza"><p>onde vieni e chi se&rsquo;; ch&eacute; tu ne fai</p>\n<p>tanto maravigliar de la tua grazia,</p>\n<p>quanto vuol cosa che non fu pi&ugrave; mai&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Per mezza Toscana si spazia</p>\n<p>un fiumicel che nasce in Falterona,</p>\n<p>e cento miglia di corso nol sazia.</p></div>\n\n<div class="stanza"><p>Di sovr&rsquo; esso rech&rsquo; io questa persona:</p>\n<p>dirvi ch&rsquo;i&rsquo; sia, saria parlare indarno,</p>\n<p>ch&eacute; &rsquo;l nome mio ancor molto non suona&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se ben lo &rsquo;ntendimento tuo accarno</p>\n<p>con lo &rsquo;ntelletto&raquo;, allora mi rispuose</p>\n<p>quei che diceva pria, &laquo;tu parli d&rsquo;Arno&raquo;.</p></div>\n\n<div class="stanza"><p>E l&rsquo;altro disse lui: &laquo;Perch&eacute; nascose</p>\n<p>questi il vocabol di quella riviera,</p>\n<p>pur com&rsquo; om fa de l&rsquo;orribili cose?&raquo;.</p></div>\n\n<div class="stanza"><p>E l&rsquo;ombra che di ci&ograve; domandata era,</p>\n<p>si sdebit&ograve; cos&igrave;: &laquo;Non so; ma degno</p>\n<p>ben &egrave; che &rsquo;l nome di tal valle p&egrave;ra;</p></div>\n\n<div class="stanza"><p>ch&eacute; dal principio suo, ov&rsquo; &egrave; s&igrave; pregno</p>\n<p>l&rsquo;alpestro monte ond&rsquo; &egrave; tronco Peloro,</p>\n<p>che &rsquo;n pochi luoghi passa oltra quel segno,</p></div>\n\n<div class="stanza"><p>infin l&agrave; &rsquo;ve si rende per ristoro</p>\n<p>di quel che &rsquo;l ciel de la marina asciuga,</p>\n<p>ond&rsquo; hanno i fiumi ci&ograve; che va con loro,</p></div>\n\n<div class="stanza"><p>vert&ugrave; cos&igrave; per nimica si fuga</p>\n<p>da tutti come biscia, o per sventura</p>\n<p>del luogo, o per mal uso che li fruga:</p></div>\n\n<div class="stanza"><p>ond&rsquo; hanno s&igrave; mutata lor natura</p>\n<p>li abitator de la misera valle,</p>\n<p>che par che Circe li avesse in pastura.</p></div>\n\n<div class="stanza"><p>Tra brutti porci, pi&ugrave; degni di galle</p>\n<p>che d&rsquo;altro cibo fatto in uman uso,</p>\n<p>dirizza prima il suo povero calle.</p></div>\n\n<div class="stanza"><p>Botoli trova poi, venendo giuso,</p>\n<p>ringhiosi pi&ugrave; che non chiede lor possa,</p>\n<p>e da lor disdegnosa torce il muso.</p></div>\n\n<div class="stanza"><p>Vassi caggendo; e quant&rsquo; ella pi&ugrave; &rsquo;ngrossa,</p>\n<p>tanto pi&ugrave; trova di can farsi lupi</p>\n<p>la maladetta e sventurata fossa.</p></div>\n\n<div class="stanza"><p>Discesa poi per pi&ugrave; pelaghi cupi,</p>\n<p>trova le volpi s&igrave; piene di froda,</p>\n<p>che non temono ingegno che le occ&ugrave;pi.</p></div>\n\n<div class="stanza"><p>N&eacute; lascer&ograve; di dir perch&rsquo; altri m&rsquo;oda;</p>\n<p>e buon sar&agrave; costui, s&rsquo;ancor s&rsquo;ammenta</p>\n<p>di ci&ograve; che vero spirto mi disnoda.</p></div>\n\n<div class="stanza"><p>Io veggio tuo nepote che diventa</p>\n<p>cacciator di quei lupi in su la riva</p>\n<p>del fiero fiume, e tutti li sgomenta.</p></div>\n\n<div class="stanza"><p>Vende la carne loro essendo viva;</p>\n<p>poscia li ancide come antica belva;</p>\n<p>molti di vita e s&eacute; di pregio priva.</p></div>\n\n<div class="stanza"><p>Sanguinoso esce de la trista selva;</p>\n<p>lasciala tal, che di qui a mille anni</p>\n<p>ne lo stato primaio non si rinselva&raquo;.</p></div>\n\n<div class="stanza"><p>Com&rsquo; a l&rsquo;annunzio di dogliosi danni</p>\n<p>si turba il viso di colui ch&rsquo;ascolta,</p>\n<p>da qual che parte il periglio l&rsquo;assanni,</p></div>\n\n<div class="stanza"><p>cos&igrave; vid&rsquo; io l&rsquo;altr&rsquo; anima, che volta</p>\n<p>stava a udir, turbarsi e farsi trista,</p>\n<p>poi ch&rsquo;ebbe la parola a s&eacute; raccolta.</p></div>\n\n<div class="stanza"><p>Lo dir de l&rsquo;una e de l&rsquo;altra la vista</p>\n<p>mi fer voglioso di saper lor nomi,</p>\n<p>e dimanda ne fei con prieghi mista;</p></div>\n\n<div class="stanza"><p>per che lo spirto che di pria parl&ograve;mi</p>\n<p>ricominci&ograve;: &laquo;Tu vuo&rsquo; ch&rsquo;io mi deduca</p>\n<p>nel fare a te ci&ograve; che tu far non vuo&rsquo;mi.</p></div>\n\n<div class="stanza"><p>Ma da che Dio in te vuol che traluca</p>\n<p>tanto sua grazia, non ti sar&ograve; scarso;</p>\n<p>per&ograve; sappi ch&rsquo;io fui Guido del Duca.</p></div>\n\n<div class="stanza"><p>Fu il sangue mio d&rsquo;invidia s&igrave; r&iuml;arso,</p>\n<p>che se veduto avesse uom farsi lieto,</p>\n<p>visto m&rsquo;avresti di livore sparso.</p></div>\n\n<div class="stanza"><p>Di mia semente cotal paglia mieto;</p>\n<p>o gente umana, perch&eacute; poni &rsquo;l core</p>\n<p>l&agrave; &rsquo;v&rsquo; &egrave; mestier di consorte divieto?</p></div>\n\n<div class="stanza"><p>Questi &egrave; Rinier; questi &egrave; &rsquo;l pregio e l&rsquo;onore</p>\n<p>de la casa da Calboli, ove nullo</p>\n<p>fatto s&rsquo;&egrave; reda poi del suo valore.</p></div>\n\n<div class="stanza"><p>E non pur lo suo sangue &egrave; fatto brullo,</p>\n<p>tra &rsquo;l Po e &rsquo;l monte e la marina e &rsquo;l Reno,</p>\n<p>del ben richesto al vero e al trastullo;</p></div>\n\n<div class="stanza"><p>ch&eacute; dentro a questi termini &egrave; ripieno</p>\n<p>di venenosi sterpi, s&igrave; che tardi</p>\n<p>per coltivare omai verrebber meno.</p></div>\n\n<div class="stanza"><p>Ov&rsquo; &egrave; &rsquo;l buon Lizio e Arrigo Mainardi?</p>\n<p>Pier Traversaro e Guido di Carpigna?</p>\n<p>Oh Romagnuoli tornati in bastardi!</p></div>\n\n<div class="stanza"><p>Quando in Bologna un Fabbro si ralligna?</p>\n<p>quando in Faenza un Bernardin di Fosco,</p>\n<p>verga gentil di picciola gramigna?</p></div>\n\n<div class="stanza"><p>Non ti maravigliar s&rsquo;io piango, Tosco,</p>\n<p>quando rimembro, con Guido da Prata,</p>\n<p>Ugolin d&rsquo;Azzo che vivette nosco,</p></div>\n\n<div class="stanza"><p>Federigo Tignoso e sua brigata,</p>\n<p>la casa Traversara e li Anastagi</p>\n<p>(e l&rsquo;una gente e l&rsquo;altra &egrave; diretata),</p></div>\n\n<div class="stanza"><p>le donne e &rsquo; cavalier, li affanni e li agi</p>\n<p>che ne &rsquo;nvogliava amore e cortesia</p>\n<p>l&agrave; dove i cuor son fatti s&igrave; malvagi.</p></div>\n\n<div class="stanza"><p>O Bretinoro, ch&eacute; non fuggi via,</p>\n<p>poi che gita se n&rsquo;&egrave; la tua famiglia</p>\n<p>e molta gente per non esser ria?</p></div>\n\n<div class="stanza"><p>Ben fa Bagnacaval, che non rifiglia;</p>\n<p>e mal fa Castrocaro, e peggio Conio,</p>\n<p>che di figliar tai conti pi&ugrave; s&rsquo;impiglia.</p></div>\n\n<div class="stanza"><p>Ben faranno i Pagan, da che &rsquo;l demonio</p>\n<p>lor sen gir&agrave;; ma non per&ograve; che puro</p>\n<p>gi&agrave; mai rimagna d&rsquo;essi testimonio.</p></div>\n\n<div class="stanza"><p>O Ugolin de&rsquo; Fantolin, sicuro</p>\n<p>&egrave; &rsquo;l nome tuo, da che pi&ugrave; non s&rsquo;aspetta</p>\n<p>chi far lo possa, tralignando, scuro.</p></div>\n\n<div class="stanza"><p>Ma va via, Tosco, omai; ch&rsquo;or mi diletta</p>\n<p>troppo di pianger pi&ugrave; che di parlare,</p>\n<p>s&igrave; m&rsquo;ha nostra ragion la mente stretta&raquo;.</p></div>\n\n<div class="stanza"><p>Noi sapavam che quell&rsquo; anime care</p>\n<p>ci sentivano andar; per&ograve;, tacendo,</p>\n<p>fac&euml;an noi del cammin confidare.</p></div>\n\n<div class="stanza"><p>Poi fummo fatti soli procedendo,</p>\n<p>folgore parve quando l&rsquo;aere fende,</p>\n<p>voce che giunse di contra dicendo:</p></div>\n\n<div class="stanza"><p>&lsquo;Anciderammi qualunque m&rsquo;apprende&rsquo;;</p>\n<p>e fugg&igrave; come tuon che si dilegua,</p>\n<p>se s&ugrave;bito la nuvola scoscende.</p></div>\n\n<div class="stanza"><p>Come da lei l&rsquo;udir nostro ebbe triegua,</p>\n<p>ed ecco l&rsquo;altra con s&igrave; gran fracasso,</p>\n<p>che somigli&ograve; tonar che tosto segua:</p></div>\n\n<div class="stanza"><p>&laquo;Io sono Aglauro che divenni sasso&raquo;;</p>\n<p>e allor, per ristrignermi al poeta,</p>\n<p>in destro feci, e non innanzi, il passo.</p></div>\n\n<div class="stanza"><p>Gi&agrave; era l&rsquo;aura d&rsquo;ogne parte queta;</p>\n<p>ed el mi disse: &laquo;Quel fu &rsquo;l duro camo</p>\n<p>che dovria l&rsquo;uom tener dentro a sua meta.</p></div>\n\n<div class="stanza"><p>Ma voi prendete l&rsquo;esca, s&igrave; che l&rsquo;amo</p>\n<p>de l&rsquo;antico avversaro a s&eacute; vi tira;</p>\n<p>e per&ograve; poco val freno o richiamo.</p></div>\n\n<div class="stanza"><p>Chiamavi &rsquo;l cielo e &rsquo;ntorno vi si gira,</p>\n<p>mostrandovi le sue bellezze etterne,</p>\n<p>e l&rsquo;occhio vostro pur a terra mira;</p></div>\n\n<div class="stanza"><p>onde vi batte chi tutto discerne&raquo;.</p></div>','<p class="cantohead">Canto XV</p>\n\n<div class="stanza"><p>Quanto tra l&rsquo;ultimar de l&rsquo;ora terza</p>\n<p>e &rsquo;l principio del d&igrave; par de la spera</p>\n<p>che sempre a guisa di fanciullo scherza,</p></div>\n\n<div class="stanza"><p>tanto pareva gi&agrave; inver&rsquo; la sera</p>\n<p>essere al sol del suo corso rimaso;</p>\n<p>vespero l&agrave;, e qui mezza notte era.</p></div>\n\n<div class="stanza"><p>E i raggi ne ferien per mezzo &rsquo;l naso,</p>\n<p>perch&eacute; per noi girato era s&igrave; &rsquo;l monte,</p>\n<p>che gi&agrave; dritti andavamo inver&rsquo; l&rsquo;occaso,</p></div>\n\n<div class="stanza"><p>quand&rsquo; io senti&rsquo; a me gravar la fronte</p>\n<p>a lo splendore assai pi&ugrave; che di prima,</p>\n<p>e stupor m&rsquo;eran le cose non conte;</p></div>\n\n<div class="stanza"><p>ond&rsquo; io levai le mani inver&rsquo; la cima</p>\n<p>de le mie ciglia, e fecimi &rsquo;l solecchio,</p>\n<p>che del soverchio visibile lima.</p></div>\n\n<div class="stanza"><p>Come quando da l&rsquo;acqua o da lo specchio</p>\n<p>salta lo raggio a l&rsquo;opposita parte,</p>\n<p>salendo su per lo modo parecchio</p></div>\n\n<div class="stanza"><p>a quel che scende, e tanto si diparte</p>\n<p>dal cader de la pietra in igual tratta,</p>\n<p>s&igrave; come mostra esper&iuml;enza e arte;</p></div>\n\n<div class="stanza"><p>cos&igrave; mi parve da luce rifratta</p>\n<p>quivi dinanzi a me esser percosso;</p>\n<p>per che a fuggir la mia vista fu ratta.</p></div>\n\n<div class="stanza"><p>&laquo;Che &egrave; quel, dolce padre, a che non posso</p>\n<p>schermar lo viso tanto che mi vaglia&raquo;,</p>\n<p>diss&rsquo; io, &laquo;e pare inver&rsquo; noi esser mosso?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Non ti maravigliar s&rsquo;ancor t&rsquo;abbaglia</p>\n<p>la famiglia del cielo&raquo;, a me rispuose:</p>\n<p>&laquo;messo &egrave; che viene ad invitar ch&rsquo;om saglia.</p></div>\n\n<div class="stanza"><p>Tosto sar&agrave; ch&rsquo;a veder queste cose</p>\n<p>non ti fia grave, ma fieti diletto</p>\n<p>quanto natura a sentir ti dispuose&raquo;.</p></div>\n\n<div class="stanza"><p>Poi giunti fummo a l&rsquo;angel benedetto,</p>\n<p>con lieta voce disse: &laquo;Intrate quinci</p>\n<p>ad un scaleo vie men che li altri eretto&raquo;.</p></div>\n\n<div class="stanza"><p>Noi montavam, gi&agrave; partiti di linci,</p>\n<p>e &lsquo;Beati misericordes!&rsquo; fue</p>\n<p>cantato retro, e &lsquo;Godi tu che vinci!&rsquo;.</p></div>\n\n<div class="stanza"><p>Lo mio maestro e io soli amendue</p>\n<p>suso andavamo; e io pensai, andando,</p>\n<p>prode acquistar ne le parole sue;</p></div>\n\n<div class="stanza"><p>e dirizza&rsquo;mi a lui s&igrave; dimandando:</p>\n<p>&laquo;Che volse dir lo spirto di Romagna,</p>\n<p>e &lsquo;divieto&rsquo; e &lsquo;consorte&rsquo; menzionando?&raquo;.</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;elli a me: &laquo;Di sua maggior magagna</p>\n<p>conosce il danno; e per&ograve; non s&rsquo;ammiri</p>\n<p>se ne riprende perch&eacute; men si piagna.</p></div>\n\n<div class="stanza"><p>Perch&eacute; s&rsquo;appuntano i vostri disiri</p>\n<p>dove per compagnia parte si scema,</p>\n<p>invidia move il mantaco a&rsquo; sospiri.</p></div>\n\n<div class="stanza"><p>Ma se l&rsquo;amor de la spera supprema</p>\n<p>torcesse in suso il disiderio vostro,</p>\n<p>non vi sarebbe al petto quella tema;</p></div>\n\n<div class="stanza"><p>ch&eacute;, per quanti si dice pi&ugrave; l&igrave; &lsquo;nostro&rsquo;,</p>\n<p>tanto possiede pi&ugrave; di ben ciascuno,</p>\n<p>e pi&ugrave; di caritate arde in quel chiostro&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io son d&rsquo;esser contento pi&ugrave; digiuno&raquo;,</p>\n<p>diss&rsquo; io, &laquo;che se mi fosse pria taciuto,</p>\n<p>e pi&ugrave; di dubbio ne la mente aduno.</p></div>\n\n<div class="stanza"><p>Com&rsquo; esser puote ch&rsquo;un ben, distributo</p>\n<p>in pi&ugrave; posseditor, faccia pi&ugrave; ricchi</p>\n<p>di s&eacute; che se da pochi &egrave; posseduto?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Per&ograve; che tu rificchi</p>\n<p>la mente pur a le cose terrene,</p>\n<p>di vera luce tenebre dispicchi.</p></div>\n\n<div class="stanza"><p>Quello infinito e ineffabil bene</p>\n<p>che l&agrave; s&ugrave; &egrave;, cos&igrave; corre ad amore</p>\n<p>com&rsquo; a lucido corpo raggio vene.</p></div>\n\n<div class="stanza"><p>Tanto si d&agrave; quanto trova d&rsquo;ardore;</p>\n<p>s&igrave; che, quantunque carit&agrave; si stende,</p>\n<p>cresce sovr&rsquo; essa l&rsquo;etterno valore.</p></div>\n\n<div class="stanza"><p>E quanta gente pi&ugrave; l&agrave; s&ugrave; s&rsquo;intende,</p>\n<p>pi&ugrave; v&rsquo;&egrave; da bene amare, e pi&ugrave; vi s&rsquo;ama,</p>\n<p>e come specchio l&rsquo;uno a l&rsquo;altro rende.</p></div>\n\n<div class="stanza"><p>E se la mia ragion non ti disfama,</p>\n<p>vedrai Beatrice, ed ella pienamente</p>\n<p>ti torr&agrave; questa e ciascun&rsquo; altra brama.</p></div>\n\n<div class="stanza"><p>Procaccia pur che tosto sieno spente,</p>\n<p>come son gi&agrave; le due, le cinque piaghe,</p>\n<p>che si richiudon per esser dolente&raquo;.</p></div>\n\n<div class="stanza"><p>Com&rsquo; io voleva dicer &lsquo;Tu m&rsquo;appaghe&rsquo;,</p>\n<p>vidimi giunto in su l&rsquo;altro girone,</p>\n<p>s&igrave; che tacer mi fer le luci vaghe.</p></div>\n\n<div class="stanza"><p>Ivi mi parve in una vis&iuml;one</p>\n<p>estatica di s&ugrave;bito esser tratto,</p>\n<p>e vedere in un tempio pi&ugrave; persone;</p></div>\n\n<div class="stanza"><p>e una donna, in su l&rsquo;entrar, con atto</p>\n<p>dolce di madre dicer: &laquo;Figliuol mio,</p>\n<p>perch&eacute; hai tu cos&igrave; verso noi fatto?</p></div>\n\n<div class="stanza"><p>Ecco, dolenti, lo tuo padre e io</p>\n<p>ti cercavamo&raquo;. E come qui si tacque,</p>\n<p>ci&ograve; che pareva prima, dispario.</p></div>\n\n<div class="stanza"><p>Indi m&rsquo;apparve un&rsquo;altra con quell&rsquo; acque</p>\n<p>gi&ugrave; per le gote che &rsquo;l dolor distilla</p>\n<p>quando di gran dispetto in altrui nacque,</p></div>\n\n<div class="stanza"><p>e dir: &laquo;Se tu se&rsquo; sire de la villa</p>\n<p>del cui nome ne&rsquo; d&egrave;i fu tanta lite,</p>\n<p>e onde ogne sc&iuml;enza disfavilla,</p></div>\n\n<div class="stanza"><p>vendica te di quelle braccia ardite</p>\n<p>ch&rsquo;abbracciar nostra figlia, o Pisistr&agrave;to&raquo;.</p>\n<p>E &rsquo;l segnor mi parea, benigno e mite,</p></div>\n\n<div class="stanza"><p>risponder lei con viso temperato:</p>\n<p>&laquo;Che farem noi a chi mal ne disira,</p>\n<p>se quei che ci ama &egrave; per noi condannato?&raquo;,</p></div>\n\n<div class="stanza"><p>Poi vidi genti accese in foco d&rsquo;ira</p>\n<p>con pietre un giovinetto ancider, forte</p>\n<p>gridando a s&eacute; pur: &laquo;Martira, martira!&raquo;.</p></div>\n\n<div class="stanza"><p>E lui vedea chinarsi, per la morte</p>\n<p>che l&rsquo;aggravava gi&agrave;, inver&rsquo; la terra,</p>\n<p>ma de li occhi facea sempre al ciel porte,</p></div>\n\n<div class="stanza"><p>orando a l&rsquo;alto Sire, in tanta guerra,</p>\n<p>che perdonasse a&rsquo; suoi persecutori,</p>\n<p>con quello aspetto che piet&agrave; diserra.</p></div>\n\n<div class="stanza"><p>Quando l&rsquo;anima mia torn&ograve; di fori</p>\n<p>a le cose che son fuor di lei vere,</p>\n<p>io riconobbi i miei non falsi errori.</p></div>\n\n<div class="stanza"><p>Lo duca mio, che mi potea vedere</p>\n<p>far s&igrave; com&rsquo; om che dal sonno si slega,</p>\n<p>disse: &laquo;Che hai che non ti puoi tenere,</p></div>\n\n<div class="stanza"><p>ma se&rsquo; venuto pi&ugrave; che mezza lega</p>\n<p>velando li occhi e con le gambe avvolte,</p>\n<p>a guisa di cui vino o sonno piega?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O dolce padre mio, se tu m&rsquo;ascolte,</p>\n<p>io ti dir&ograve;&raquo;, diss&rsquo; io, &laquo;ci&ograve; che m&rsquo;apparve</p>\n<p>quando le gambe mi furon s&igrave; tolte&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ei: &laquo;Se tu avessi cento larve</p>\n<p>sovra la faccia, non mi sarian chiuse</p>\n<p>le tue cogitazion, quantunque parve.</p></div>\n\n<div class="stanza"><p>Ci&ograve; che vedesti fu perch&eacute; non scuse</p>\n<p>d&rsquo;aprir lo core a l&rsquo;acque de la pace</p>\n<p>che da l&rsquo;etterno fonte son diffuse.</p></div>\n\n<div class="stanza"><p>Non dimandai &ldquo;Che hai?&rdquo; per quel che face</p>\n<p>chi guarda pur con l&rsquo;occhio che non vede,</p>\n<p>quando disanimato il corpo giace;</p></div>\n\n<div class="stanza"><p>ma dimandai per darti forza al piede:</p>\n<p>cos&igrave; frugar conviensi i pigri, lenti</p>\n<p>ad usar lor vigilia quando riede&raquo;.</p></div>\n\n<div class="stanza"><p>Noi andavam per lo vespero, attenti</p>\n<p>oltre quanto potean li occhi allungarsi</p>\n<p>contra i raggi serotini e lucenti.</p></div>\n\n<div class="stanza"><p>Ed ecco a poco a poco un fummo farsi</p>\n<p>verso di noi come la notte oscuro;</p>\n<p>n&eacute; da quello era loco da cansarsi.</p></div>\n\n<div class="stanza"><p>Questo ne tolse li occhi e l&rsquo;aere puro.</p></div>','<p class="cantohead">Canto XVI</p>\n\n<div class="stanza"><p>Buio d&rsquo;inferno e di notte privata</p>\n<p>d&rsquo;ogne pianeto, sotto pover cielo,</p>\n<p>quant&rsquo; esser pu&ograve; di nuvol tenebrata,</p></div>\n\n<div class="stanza"><p>non fece al viso mio s&igrave; grosso velo</p>\n<p>come quel fummo ch&rsquo;ivi ci coperse,</p>\n<p>n&eacute; a sentir di cos&igrave; aspro pelo,</p></div>\n\n<div class="stanza"><p>che l&rsquo;occhio stare aperto non sofferse;</p>\n<p>onde la scorta mia saputa e fida</p>\n<p>mi s&rsquo;accost&ograve; e l&rsquo;omero m&rsquo;offerse.</p></div>\n\n<div class="stanza"><p>S&igrave; come cieco va dietro a sua guida</p>\n<p>per non smarrirsi e per non dar di cozzo</p>\n<p>in cosa che &rsquo;l molesti, o forse ancida,</p></div>\n\n<div class="stanza"><p>m&rsquo;andava io per l&rsquo;aere amaro e sozzo,</p>\n<p>ascoltando il mio duca che diceva</p>\n<p>pur: &laquo;Guarda che da me tu non sia mozzo&raquo;.</p></div>\n\n<div class="stanza"><p>Io sentia voci, e ciascuna pareva</p>\n<p>pregar per pace e per misericordia</p>\n<p>l&rsquo;Agnel di Dio che le peccata leva.</p></div>\n\n<div class="stanza"><p>Pur &lsquo;Agnus Dei&rsquo; eran le loro essordia;</p>\n<p>una parola in tutte era e un modo,</p>\n<p>s&igrave; che parea tra esse ogne concordia.</p></div>\n\n<div class="stanza"><p>&laquo;Quei sono spirti, maestro, ch&rsquo;i&rsquo; odo?&raquo;,</p>\n<p>diss&rsquo; io. Ed elli a me: &laquo;Tu vero apprendi,</p>\n<p>e d&rsquo;iracundia van solvendo il nodo&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Or tu chi se&rsquo; che &rsquo;l nostro fummo fendi,</p>\n<p>e di noi parli pur come se tue</p>\n<p>partissi ancor lo tempo per calendi?&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; per una voce detto fue;</p>\n<p>onde &rsquo;l maestro mio disse: &laquo;Rispondi,</p>\n<p>e domanda se quinci si va s&ugrave;e&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;O creatura che ti mondi</p>\n<p>per tornar bella a colui che ti fece,</p>\n<p>maraviglia udirai, se mi secondi&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Io ti seguiter&ograve; quanto mi lece&raquo;,</p>\n<p>rispuose; &laquo;e se veder fummo non lascia,</p>\n<p>l&rsquo;udir ci terr&agrave; giunti in quella vece&raquo;.</p></div>\n\n<div class="stanza"><p>Allora incominciai: &laquo;Con quella fascia</p>\n<p>che la morte dissolve men vo suso,</p>\n<p>e venni qui per l&rsquo;infernale ambascia.</p></div>\n\n<div class="stanza"><p>E se Dio m&rsquo;ha in sua grazia rinchiuso,</p>\n<p>tanto che vuol ch&rsquo;i&rsquo; veggia la sua corte</p>\n<p>per modo tutto fuor del moderno uso,</p></div>\n\n<div class="stanza"><p>non mi celar chi fosti anzi la morte,</p>\n<p>ma dilmi, e dimmi s&rsquo;i&rsquo; vo bene al varco;</p>\n<p>e tue parole fier le nostre scorte&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Lombardo fui, e fu&rsquo; chiamato Marco;</p>\n<p>del mondo seppi, e quel valore amai</p>\n<p>al quale ha or ciascun disteso l&rsquo;arco.</p></div>\n\n<div class="stanza"><p>Per montar s&ugrave; dirittamente vai&raquo;.</p>\n<p>Cos&igrave; rispuose, e soggiunse: &laquo;I&rsquo; ti prego</p>\n<p>che per me prieghi quando s&ugrave; sarai&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Per fede mi ti lego</p>\n<p>di far ci&ograve; che mi chiedi; ma io scoppio</p>\n<p>dentro ad un dubbio, s&rsquo;io non me ne spiego.</p></div>\n\n<div class="stanza"><p>Prima era scempio, e ora &egrave; fatto doppio</p>\n<p>ne la sentenza tua, che mi fa certo</p>\n<p>qui, e altrove, quello ov&rsquo; io l&rsquo;accoppio.</p></div>\n\n<div class="stanza"><p>Lo mondo &egrave; ben cos&igrave; tutto diserto</p>\n<p>d&rsquo;ogne virtute, come tu mi sone,</p>\n<p>e di malizia gravido e coverto;</p></div>\n\n<div class="stanza"><p>ma priego che m&rsquo;addite la cagione,</p>\n<p>s&igrave; ch&rsquo;i&rsquo; la veggia e ch&rsquo;i&rsquo; la mostri altrui;</p>\n<p>ch&eacute; nel cielo uno, e un qua gi&ugrave; la pone&raquo;.</p></div>\n\n<div class="stanza"><p>Alto sospir, che duolo strinse in &laquo;uhi!&raquo;,</p>\n<p>mise fuor prima; e poi cominci&ograve;: &laquo;Frate,</p>\n<p>lo mondo &egrave; cieco, e tu vien ben da lui.</p></div>\n\n<div class="stanza"><p>Voi che vivete ogne cagion recate</p>\n<p>pur suso al cielo, pur come se tutto</p>\n<p>movesse seco di necessitate.</p></div>\n\n<div class="stanza"><p>Se cos&igrave; fosse, in voi fora distrutto</p>\n<p>libero arbitrio, e non fora giustizia</p>\n<p>per ben letizia, e per male aver lutto.</p></div>\n\n<div class="stanza"><p>Lo cielo i vostri movimenti inizia;</p>\n<p>non dico tutti, ma, posto ch&rsquo;i&rsquo; &rsquo;l dica,</p>\n<p>lume v&rsquo;&egrave; dato a bene e a malizia,</p></div>\n\n<div class="stanza"><p>e libero voler; che, se fatica</p>\n<p>ne le prime battaglie col ciel dura,</p>\n<p>poi vince tutto, se ben si notrica.</p></div>\n\n<div class="stanza"><p>A maggior forza e a miglior natura</p>\n<p>liberi soggiacete; e quella cria</p>\n<p>la mente in voi, che &rsquo;l ciel non ha in sua cura.</p></div>\n\n<div class="stanza"><p>Per&ograve;, se &rsquo;l mondo presente disvia,</p>\n<p>in voi &egrave; la cagione, in voi si cheggia;</p>\n<p>e io te ne sar&ograve; or vera spia.</p></div>\n\n<div class="stanza"><p>Esce di mano a lui che la vagheggia</p>\n<p>prima che sia, a guisa di fanciulla</p>\n<p>che piangendo e ridendo pargoleggia,</p></div>\n\n<div class="stanza"><p>l&rsquo;anima semplicetta che sa nulla,</p>\n<p>salvo che, mossa da lieto fattore,</p>\n<p>volontier torna a ci&ograve; che la trastulla.</p></div>\n\n<div class="stanza"><p>Di picciol bene in pria sente sapore;</p>\n<p>quivi s&rsquo;inganna, e dietro ad esso corre,</p>\n<p>se guida o fren non torce suo amore.</p></div>\n\n<div class="stanza"><p>Onde convenne legge per fren porre;</p>\n<p>convenne rege aver, che discernesse</p>\n<p>de la vera cittade almen la torre.</p></div>\n\n<div class="stanza"><p>Le leggi son, ma chi pon mano ad esse?</p>\n<p>Nullo, per&ograve; che &rsquo;l pastor che procede,</p>\n<p>rugumar pu&ograve;, ma non ha l&rsquo;unghie fesse;</p></div>\n\n<div class="stanza"><p>per che la gente, che sua guida vede</p>\n<p>pur a quel ben fedire ond&rsquo; ella &egrave; ghiotta,</p>\n<p>di quel si pasce, e pi&ugrave; oltre non chiede.</p></div>\n\n<div class="stanza"><p>Ben puoi veder che la mala condotta</p>\n<p>&egrave; la cagion che &rsquo;l mondo ha fatto reo,</p>\n<p>e non natura che &rsquo;n voi sia corrotta.</p></div>\n\n<div class="stanza"><p>Soleva Roma, che &rsquo;l buon mondo feo,</p>\n<p>due soli aver, che l&rsquo;una e l&rsquo;altra strada</p>\n<p>facean vedere, e del mondo e di Deo.</p></div>\n\n<div class="stanza"><p>L&rsquo;un l&rsquo;altro ha spento; ed &egrave; giunta la spada</p>\n<p>col pasturale, e l&rsquo;un con l&rsquo;altro insieme</p>\n<p>per viva forza mal convien che vada;</p></div>\n\n<div class="stanza"><p>per&ograve; che, giunti, l&rsquo;un l&rsquo;altro non teme:</p>\n<p>se non mi credi, pon mente a la spiga,</p>\n<p>ch&rsquo;ogn&rsquo; erba si conosce per lo seme.</p></div>\n\n<div class="stanza"><p>In sul paese ch&rsquo;Adice e Po riga,</p>\n<p>solea valore e cortesia trovarsi,</p>\n<p>prima che Federigo avesse briga;</p></div>\n\n<div class="stanza"><p>or pu&ograve; sicuramente indi passarsi</p>\n<p>per qualunque lasciasse, per vergogna</p>\n<p>di ragionar coi buoni o d&rsquo;appressarsi.</p></div>\n\n<div class="stanza"><p>Ben v&rsquo;&egrave;n tre vecchi ancora in cui rampogna</p>\n<p>l&rsquo;antica et&agrave; la nova, e par lor tardo</p>\n<p>che Dio a miglior vita li ripogna:</p></div>\n\n<div class="stanza"><p>Currado da Palazzo e &rsquo;l buon Gherardo</p>\n<p>e Guido da Castel, che mei si noma,</p>\n<p>francescamente, il semplice Lombardo.</p></div>\n\n<div class="stanza"><p>D&igrave; oggimai che la Chiesa di Roma,</p>\n<p>per confondere in s&eacute; due reggimenti,</p>\n<p>cade nel fango, e s&eacute; brutta e la soma&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O Marco mio&raquo;, diss&rsquo; io, &laquo;bene argomenti;</p>\n<p>e or discerno perch&eacute; dal retaggio</p>\n<p>li figli di Lev&igrave; furono essenti.</p></div>\n\n<div class="stanza"><p>Ma qual Gherardo &egrave; quel che tu per saggio</p>\n<p>di&rsquo; ch&rsquo;&egrave; rimaso de la gente spenta,</p>\n<p>in rimprov&egrave;ro del secol selvaggio?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O tuo parlar m&rsquo;inganna, o el mi tenta&raquo;,</p>\n<p>rispuose a me; &laquo;ch&eacute;, parlandomi tosco,</p>\n<p>par che del buon Gherardo nulla senta.</p></div>\n\n<div class="stanza"><p>Per altro sopranome io nol conosco,</p>\n<p>s&rsquo;io nol togliessi da sua figlia Gaia.</p>\n<p>Dio sia con voi, ch&eacute; pi&ugrave; non vegno vosco.</p></div>\n\n<div class="stanza"><p>Vedi l&rsquo;albor che per lo fummo raia</p>\n<p>gi&agrave; biancheggiare, e me convien partirmi</p>\n<p>(l&rsquo;angelo &egrave; ivi) prima ch&rsquo;io li paia&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; torn&ograve;, e pi&ugrave; non volle udirmi.</p></div>','<p class="cantohead">Canto XVII</p>\n\n<div class="stanza"><p>Ricorditi, lettor, se mai ne l&rsquo;alpe</p>\n<p>ti colse nebbia per la qual vedessi</p>\n<p>non altrimenti che per pelle talpe,</p></div>\n\n<div class="stanza"><p>come, quando i vapori umidi e spessi</p>\n<p>a diradar cominciansi, la spera</p>\n<p>del sol debilemente entra per essi;</p></div>\n\n<div class="stanza"><p>e fia la tua imagine leggera</p>\n<p>in giugnere a veder com&rsquo; io rividi</p>\n<p>lo sole in pria, che gi&agrave; nel corcar era.</p></div>\n\n<div class="stanza"><p>S&igrave;, pareggiando i miei co&rsquo; passi fidi</p>\n<p>del mio maestro, usci&rsquo; fuor di tal nube</p>\n<p>ai raggi morti gi&agrave; ne&rsquo; bassi lidi.</p></div>\n\n<div class="stanza"><p>O imaginativa che ne rube</p>\n<p>talvolta s&igrave; di fuor, ch&rsquo;om non s&rsquo;accorge</p>\n<p>perch&eacute; dintorno suonin mille tube,</p></div>\n\n<div class="stanza"><p>chi move te, se &rsquo;l senso non ti porge?</p>\n<p>Moveti lume che nel ciel s&rsquo;informa,</p>\n<p>per s&eacute; o per voler che gi&ugrave; lo scorge.</p></div>\n\n<div class="stanza"><p>De l&rsquo;empiezza di lei che mut&ograve; forma</p>\n<p>ne l&rsquo;uccel ch&rsquo;a cantar pi&ugrave; si diletta,</p>\n<p>ne l&rsquo;imagine mia apparve l&rsquo;orma;</p></div>\n\n<div class="stanza"><p>e qui fu la mia mente s&igrave; ristretta</p>\n<p>dentro da s&eacute;, che di fuor non ven&igrave;a</p>\n<p>cosa che fosse allor da lei ricetta.</p></div>\n\n<div class="stanza"><p>Poi piovve dentro a l&rsquo;alta fantasia</p>\n<p>un crucifisso, dispettoso e fero</p>\n<p>ne la sua vista, e cotal si moria;</p></div>\n\n<div class="stanza"><p>intorno ad esso era il grande Ass&uuml;ero,</p>\n<p>Est&egrave;r sua sposa e &rsquo;l giusto Mardoceo,</p>\n<p>che fu al dire e al far cos&igrave; intero.</p></div>\n\n<div class="stanza"><p>E come questa imagine rompeo</p>\n<p>s&eacute; per s&eacute; stessa, a guisa d&rsquo;una bulla</p>\n<p>cui manca l&rsquo;acqua sotto qual si feo,</p></div>\n\n<div class="stanza"><p>surse in mia vis&iuml;one una fanciulla</p>\n<p>piangendo forte, e dicea: &laquo;O regina,</p>\n<p>perch&eacute; per ira hai voluto esser nulla?</p></div>\n\n<div class="stanza"><p>Ancisa t&rsquo;hai per non perder Lavina;</p>\n<p>or m&rsquo;hai perduta! Io son essa che lutto,</p>\n<p>madre, a la tua pria ch&rsquo;a l&rsquo;altrui ruina&raquo;.</p></div>\n\n<div class="stanza"><p>Come si frange il sonno ove di butto</p>\n<p>nova luce percuote il viso chiuso,</p>\n<p>che fratto guizza pria che muoia tutto;</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;imaginar mio cadde giuso</p>\n<p>tosto che lume il volto mi percosse,</p>\n<p>maggior assai che quel ch&rsquo;&egrave; in nostro uso.</p></div>\n\n<div class="stanza"><p>I&rsquo; mi volgea per veder ov&rsquo; io fosse,</p>\n<p>quando una voce disse &laquo;Qui si monta&raquo;,</p>\n<p>che da ogne altro intento mi rimosse;</p></div>\n\n<div class="stanza"><p>e fece la mia voglia tanto pronta</p>\n<p>di riguardar chi era che parlava,</p>\n<p>che mai non posa, se non si raffronta.</p></div>\n\n<div class="stanza"><p>Ma come al sol che nostra vista grava</p>\n<p>e per soverchio sua figura vela,</p>\n<p>cos&igrave; la mia virt&ugrave; quivi mancava.</p></div>\n\n<div class="stanza"><p>&laquo;Questo &egrave; divino spirito, che ne la</p>\n<p>via da ir s&ugrave; ne drizza sanza prego,</p>\n<p>e col suo lume s&eacute; medesmo cela.</p></div>\n\n<div class="stanza"><p>S&igrave; fa con noi, come l&rsquo;uom si fa sego;</p>\n<p>ch&eacute; quale aspetta prego e l&rsquo;uopo vede,</p>\n<p>malignamente gi&agrave; si mette al nego.</p></div>\n\n<div class="stanza"><p>Or accordiamo a tanto invito il piede;</p>\n<p>procacciam di salir pria che s&rsquo;abbui,</p>\n<p>ch&eacute; poi non si poria, se &rsquo;l d&igrave; non riede&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; disse il mio duca, e io con lui</p>\n<p>volgemmo i nostri passi ad una scala;</p>\n<p>e tosto ch&rsquo;io al primo grado fui,</p></div>\n\n<div class="stanza"><p>senti&rsquo;mi presso quasi un muover d&rsquo;ala</p>\n<p>e ventarmi nel viso e dir: &lsquo;Beati</p>\n<p>pacifici, che son sanz&rsquo; ira mala!&rsquo;.</p></div>\n\n<div class="stanza"><p>Gi&agrave; eran sovra noi tanto levati</p>\n<p>li ultimi raggi che la notte segue,</p>\n<p>che le stelle apparivan da pi&ugrave; lati.</p></div>\n\n<div class="stanza"><p>&lsquo;O virt&ugrave; mia, perch&eacute; s&igrave; ti dilegue?&rsquo;,</p>\n<p>fra me stesso dicea, ch&eacute; mi sentiva</p>\n<p>la possa de le gambe posta in triegue.</p></div>\n\n<div class="stanza"><p>Noi eravam dove pi&ugrave; non saliva</p>\n<p>la scala s&ugrave;, ed eravamo affissi,</p>\n<p>pur come nave ch&rsquo;a la piaggia arriva.</p></div>\n\n<div class="stanza"><p>E io attesi un poco, s&rsquo;io udissi</p>\n<p>alcuna cosa nel novo girone;</p>\n<p>poi mi volsi al maestro mio, e dissi:</p></div>\n\n<div class="stanza"><p>&laquo;Dolce mio padre, d&igrave;, quale offensione</p>\n<p>si purga qui nel giro dove semo?</p>\n<p>Se i pi&egrave; si stanno, non stea tuo sermone&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;L&rsquo;amor del bene, scemo</p>\n<p>del suo dover, quiritta si ristora;</p>\n<p>qui si ribatte il mal tardato remo.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; pi&ugrave; aperto intendi ancora,</p>\n<p>volgi la mente a me, e prenderai</p>\n<p>alcun buon frutto di nostra dimora&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;N&eacute; creator n&eacute; creatura mai&raquo;,</p>\n<p>cominci&ograve; el, &laquo;figliuol, fu sanza amore,</p>\n<p>o naturale o d&rsquo;animo; e tu &rsquo;l sai.</p></div>\n\n<div class="stanza"><p>Lo naturale &egrave; sempre sanza errore,</p>\n<p>ma l&rsquo;altro puote errar per malo obietto</p>\n<p>o per troppo o per poco di vigore.</p></div>\n\n<div class="stanza"><p>Mentre ch&rsquo;elli &egrave; nel primo ben diretto,</p>\n<p>e ne&rsquo; secondi s&eacute; stesso misura,</p>\n<p>esser non pu&ograve; cagion di mal diletto;</p></div>\n\n<div class="stanza"><p>ma quando al mal si torce, o con pi&ugrave; cura</p>\n<p>o con men che non dee corre nel bene,</p>\n<p>contra &rsquo;l fattore adovra sua fattura.</p></div>\n\n<div class="stanza"><p>Quinci comprender puoi ch&rsquo;esser convene</p>\n<p>amor sementa in voi d&rsquo;ogne virtute</p>\n<p>e d&rsquo;ogne operazion che merta pene.</p></div>\n\n<div class="stanza"><p>Or, perch&eacute; mai non pu&ograve; da la salute</p>\n<p>amor del suo subietto volger viso,</p>\n<p>da l&rsquo;odio proprio son le cose tute;</p></div>\n\n<div class="stanza"><p>e perch&eacute; intender non si pu&ograve; diviso,</p>\n<p>e per s&eacute; stante, alcuno esser dal primo,</p>\n<p>da quello odiare ogne effetto &egrave; deciso.</p></div>\n\n<div class="stanza"><p>Resta, se dividendo bene stimo,</p>\n<p>che &rsquo;l mal che s&rsquo;ama &egrave; del prossimo; ed esso</p>\n<p>amor nasce in tre modi in vostro limo.</p></div>\n\n<div class="stanza"><p>&egrave; chi, per esser suo vicin soppresso,</p>\n<p>spera eccellenza, e sol per questo brama</p>\n<p>ch&rsquo;el sia di sua grandezza in basso messo;</p></div>\n\n<div class="stanza"><p>&egrave; chi podere, grazia, onore e fama</p>\n<p>teme di perder perch&rsquo; altri sormonti,</p>\n<p>onde s&rsquo;attrista s&igrave; che &rsquo;l contrario ama;</p></div>\n\n<div class="stanza"><p>ed &egrave; chi per ingiuria par ch&rsquo;aonti,</p>\n<p>s&igrave; che si fa de la vendetta ghiotto,</p>\n<p>e tal convien che &rsquo;l male altrui impronti.</p></div>\n\n<div class="stanza"><p>Questo triforme amor qua gi&ugrave; di sotto</p>\n<p>si piange: or vo&rsquo; che tu de l&rsquo;altro intende,</p>\n<p>che corre al ben con ordine corrotto.</p></div>\n\n<div class="stanza"><p>Ciascun confusamente un bene apprende</p>\n<p>nel qual si queti l&rsquo;animo, e disira;</p>\n<p>per che di giugner lui ciascun contende.</p></div>\n\n<div class="stanza"><p>Se lento amore a lui veder vi tira</p>\n<p>o a lui acquistar, questa cornice,</p>\n<p>dopo giusto penter, ve ne martira.</p></div>\n\n<div class="stanza"><p>Altro ben &egrave; che non fa l&rsquo;uom felice;</p>\n<p>non &egrave; felicit&agrave;, non &egrave; la buona</p>\n<p>essenza, d&rsquo;ogne ben frutto e radice.</p></div>\n\n<div class="stanza"><p>L&rsquo;amor ch&rsquo;ad esso troppo s&rsquo;abbandona,</p>\n<p>di sovr&rsquo; a noi si piange per tre cerchi;</p>\n<p>ma come tripartito si ragiona,</p></div>\n\n<div class="stanza"><p>tacciolo, acci&ograve; che tu per te ne cerchi&raquo;.</p></div>','<p class="cantohead">Canto XVIII</p>\n\n<div class="stanza"><p>Posto avea fine al suo ragionamento</p>\n<p>l&rsquo;alto dottore, e attento guardava</p>\n<p>ne la mia vista s&rsquo;io parea contento;</p></div>\n\n<div class="stanza"><p>e io, cui nova sete ancor frugava,</p>\n<p>di fuor tacea, e dentro dicea: &lsquo;Forse</p>\n<p>lo troppo dimandar ch&rsquo;io fo li grava&rsquo;.</p></div>\n\n<div class="stanza"><p>Ma quel padre verace, che s&rsquo;accorse</p>\n<p>del timido voler che non s&rsquo;apriva,</p>\n<p>parlando, di parlare ardir mi porse.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io: &laquo;Maestro, il mio veder s&rsquo;avviva</p>\n<p>s&igrave; nel tuo lume, ch&rsquo;io discerno chiaro</p>\n<p>quanto la tua ragion parta o descriva.</p></div>\n\n<div class="stanza"><p>Per&ograve; ti prego, dolce padre caro,</p>\n<p>che mi dimostri amore, a cui reduci</p>\n<p>ogne buono operare e &rsquo;l suo contraro&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Drizza&raquo;, disse, &laquo;ver&rsquo; me l&rsquo;agute luci</p>\n<p>de lo &rsquo;ntelletto, e fieti manifesto</p>\n<p>l&rsquo;error de&rsquo; ciechi che si fanno duci.</p></div>\n\n<div class="stanza"><p>L&rsquo;animo, ch&rsquo;&egrave; creato ad amar presto,</p>\n<p>ad ogne cosa &egrave; mobile che piace,</p>\n<p>tosto che dal piacere in atto &egrave; desto.</p></div>\n\n<div class="stanza"><p>Vostra apprensiva da esser verace</p>\n<p>tragge intenzione, e dentro a voi la spiega,</p>\n<p>s&igrave; che l&rsquo;animo ad essa volger face;</p></div>\n\n<div class="stanza"><p>e se, rivolto, inver&rsquo; di lei si piega,</p>\n<p>quel piegare &egrave; amor, quell&rsquo; &egrave; natura</p>\n<p>che per piacer di novo in voi si lega.</p></div>\n\n<div class="stanza"><p>Poi, come &rsquo;l foco movesi in altura</p>\n<p>per la sua forma ch&rsquo;&egrave; nata a salire</p>\n<p>l&agrave; dove pi&ugrave; in sua matera dura,</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;animo preso entra in disire,</p>\n<p>ch&rsquo;&egrave; moto spiritale, e mai non posa</p>\n<p>fin che la cosa amata il fa gioire.</p></div>\n\n<div class="stanza"><p>Or ti puote apparer quant&rsquo; &egrave; nascosa</p>\n<p>la veritate a la gente ch&rsquo;avvera</p>\n<p>ciascun amore in s&eacute; laudabil cosa;</p></div>\n\n<div class="stanza"><p>per&ograve; che forse appar la sua matera</p>\n<p>sempre esser buona, ma non ciascun segno</p>\n<p>&egrave; buono, ancor che buona sia la cera&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Le tue parole e &rsquo;l mio seguace ingegno&raquo;,</p>\n<p>rispuos&rsquo; io lui, &laquo;m&rsquo;hanno amor discoverto,</p>\n<p>ma ci&ograve; m&rsquo;ha fatto di dubbiar pi&ugrave; pregno;</p></div>\n\n<div class="stanza"><p>ch&eacute;, s&rsquo;amore &egrave; di fuori a noi offerto</p>\n<p>e l&rsquo;anima non va con altro piede,</p>\n<p>se dritta o torta va, non &egrave; suo merto&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Quanto ragion qui vede,</p>\n<p>dir ti poss&rsquo; io; da indi in l&agrave; t&rsquo;aspetta</p>\n<p>pur a Beatrice, ch&rsquo;&egrave; opra di fede.</p></div>\n\n<div class="stanza"><p>Ogne forma sustanz&iuml;al, che setta</p>\n<p>&egrave; da matera ed &egrave; con lei unita,</p>\n<p>specifica vertute ha in s&eacute; colletta,</p></div>\n\n<div class="stanza"><p>la qual sanza operar non &egrave; sentita,</p>\n<p>n&eacute; si dimostra mai che per effetto,</p>\n<p>come per verdi fronde in pianta vita.</p></div>\n\n<div class="stanza"><p>Per&ograve;, l&agrave; onde vegna lo &rsquo;ntelletto</p>\n<p>de le prime notizie, omo non sape,</p>\n<p>e de&rsquo; primi appetibili l&rsquo;affetto,</p></div>\n\n<div class="stanza"><p>che sono in voi s&igrave; come studio in ape</p>\n<p>di far lo mele; e questa prima voglia</p>\n<p>merto di lode o di biasmo non cape.</p></div>\n\n<div class="stanza"><p>Or perch&eacute; a questa ogn&rsquo; altra si raccoglia,</p>\n<p>innata v&rsquo;&egrave; la virt&ugrave; che consiglia,</p>\n<p>e de l&rsquo;assenso de&rsquo; tener la soglia.</p></div>\n\n<div class="stanza"><p>Quest&rsquo; &egrave; &rsquo;l principio l&agrave; onde si piglia</p>\n<p>ragion di meritare in voi, secondo</p>\n<p>che buoni e rei amori accoglie e viglia.</p></div>\n\n<div class="stanza"><p>Color che ragionando andaro al fondo,</p>\n<p>s&rsquo;accorser d&rsquo;esta innata libertate;</p>\n<p>per&ograve; moralit&agrave; lasciaro al mondo.</p></div>\n\n<div class="stanza"><p>Onde, poniam che di necessitate</p>\n<p>surga ogne amor che dentro a voi s&rsquo;accende,</p>\n<p>di ritenerlo &egrave; in voi la podestate.</p></div>\n\n<div class="stanza"><p>La nobile virt&ugrave; Beatrice intende</p>\n<p>per lo libero arbitrio, e per&ograve; guarda</p>\n<p>che l&rsquo;abbi a mente, s&rsquo;a parlar ten prende&raquo;.</p></div>\n\n<div class="stanza"><p>La luna, quasi a mezza notte tarda,</p>\n<p>facea le stelle a noi parer pi&ugrave; rade,</p>\n<p>fatta com&rsquo; un secchion che tuttor arda;</p></div>\n\n<div class="stanza"><p>e correa contro &rsquo;l ciel per quelle strade</p>\n<p>che &rsquo;l sole infiamma allor che quel da Roma</p>\n<p>tra &rsquo; Sardi e &rsquo; Corsi il vede quando cade.</p></div>\n\n<div class="stanza"><p>E quell&rsquo; ombra gentil per cui si noma</p>\n<p>Pietola pi&ugrave; che villa mantoana,</p>\n<p>del mio carcar diposta avea la soma;</p></div>\n\n<div class="stanza"><p>per ch&rsquo;io, che la ragione aperta e piana</p>\n<p>sovra le mie quistioni avea ricolta,</p>\n<p>stava com&rsquo; om che sonnolento vana.</p></div>\n\n<div class="stanza"><p>Ma questa sonnolenza mi fu tolta</p>\n<p>subitamente da gente che dopo</p>\n<p>le nostre spalle a noi era gi&agrave; volta.</p></div>\n\n<div class="stanza"><p>E quale Ismeno gi&agrave; vide e Asopo</p>\n<p>lungo di s&egrave; di notte furia e calca,</p>\n<p>pur che i Teban di Bacco avesser uopo,</p></div>\n\n<div class="stanza"><p>cotal per quel giron suo passo falca,</p>\n<p>per quel ch&rsquo;io vidi di color, venendo,</p>\n<p>cui buon volere e giusto amor cavalca.</p></div>\n\n<div class="stanza"><p>Tosto fur sovr&rsquo; a noi, perch&eacute; correndo</p>\n<p>si movea tutta quella turba magna;</p>\n<p>e due dinanzi gridavan piangendo:</p></div>\n\n<div class="stanza"><p>&laquo;Maria corse con fretta a la montagna;</p>\n<p>e Cesare, per soggiogare Ilerda,</p>\n<p>punse Marsilia e poi corse in Ispagna&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Ratto, ratto, che &rsquo;l tempo non si perda</p>\n<p>per poco amor&raquo;, gridavan li altri appresso,</p>\n<p>&laquo;che studio di ben far grazia rinverda&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O gente in cui fervore aguto adesso</p>\n<p>ricompie forse negligenza e indugio</p>\n<p>da voi per tepidezza in ben far messo,</p></div>\n\n<div class="stanza"><p>questi che vive, e certo i&rsquo; non vi bugio,</p>\n<p>vuole andar s&ugrave;, pur che &rsquo;l sol ne riluca;</p>\n<p>per&ograve; ne dite ond&rsquo; &egrave; presso il pertugio&raquo;.</p></div>\n\n<div class="stanza"><p>Parole furon queste del mio duca;</p>\n<p>e un di quelli spirti disse: &laquo;Vieni</p>\n<p>di retro a noi, e troverai la buca.</p></div>\n\n<div class="stanza"><p>Noi siam di voglia a muoverci s&igrave; pieni,</p>\n<p>che restar non potem; per&ograve; perdona,</p>\n<p>se villania nostra giustizia tieni.</p></div>\n\n<div class="stanza"><p>Io fui abate in San Zeno a Verona</p>\n<p>sotto lo &rsquo;mperio del buon Barbarossa,</p>\n<p>di cui dolente ancor Milan ragiona.</p></div>\n\n<div class="stanza"><p>E tale ha gi&agrave; l&rsquo;un pi&egrave; dentro la fossa,</p>\n<p>che tosto pianger&agrave; quel monastero,</p>\n<p>e tristo fia d&rsquo;avere avuta possa;</p></div>\n\n<div class="stanza"><p>perch&eacute; suo figlio, mal del corpo intero,</p>\n<p>e de la mente peggio, e che mal nacque,</p>\n<p>ha posto in loco di suo pastor vero&raquo;.</p></div>\n\n<div class="stanza"><p>Io non so se pi&ugrave; disse o s&rsquo;ei si tacque,</p>\n<p>tant&rsquo; era gi&agrave; di l&agrave; da noi trascorso;</p>\n<p>ma questo intesi, e ritener mi piacque.</p></div>\n\n<div class="stanza"><p>E quei che m&rsquo;era ad ogne uopo soccorso</p>\n<p>disse: &laquo;Volgiti qua: vedine due</p>\n<p>venir dando a l&rsquo;accid&iuml;a di morso&raquo;.</p></div>\n\n<div class="stanza"><p>Di retro a tutti dicean: &laquo;Prima fue</p>\n<p>morta la gente a cui il mar s&rsquo;aperse,</p>\n<p>che vedesse Iordan le rede sue.</p></div>\n\n<div class="stanza"><p>E quella che l&rsquo;affanno non sofferse</p>\n<p>fino a la fine col figlio d&rsquo;Anchise,</p>\n<p>s&eacute; stessa a vita sanza gloria offerse&raquo;.</p></div>\n\n<div class="stanza"><p>Poi quando fuor da noi tanto divise</p>\n<p>quell&rsquo; ombre, che veder pi&ugrave; non potiersi,</p>\n<p>novo pensiero dentro a me si mise,</p></div>\n\n<div class="stanza"><p>del qual pi&ugrave; altri nacquero e diversi;</p>\n<p>e tanto d&rsquo;uno in altro vaneggiai,</p>\n<p>che li occhi per vaghezza ricopersi,</p></div>\n\n<div class="stanza"><p>e &rsquo;l pensamento in sogno trasmutai.</p></div>','<p class="cantohead">Canto XIX</p>\n\n<div class="stanza"><p>Ne l&rsquo;ora che non pu&ograve; &rsquo;l calor d&iuml;urno</p>\n<p>intepidar pi&ugrave; &rsquo;l freddo de la luna,</p>\n<p>vinto da terra, e talor da Saturno</p></div>\n\n<div class="stanza"><p>&mdash;quando i geomanti lor Maggior Fortuna</p>\n<p>veggiono in or&iuml;ente, innanzi a l&rsquo;alba,</p>\n<p>surger per via che poco le sta bruna&mdash;,</p></div>\n\n<div class="stanza"><p>mi venne in sogno una femmina balba,</p>\n<p>ne li occhi guercia, e sovra i pi&egrave; distorta,</p>\n<p>con le man monche, e di colore scialba.</p></div>\n\n<div class="stanza"><p>Io la mirava; e come &rsquo;l sol conforta</p>\n<p>le fredde membra che la notte aggrava,</p>\n<p>cos&igrave; lo sguardo mio le facea scorta</p></div>\n\n<div class="stanza"><p>la lingua, e poscia tutta la drizzava</p>\n<p>in poco d&rsquo;ora, e lo smarrito volto,</p>\n<p>com&rsquo; amor vuol, cos&igrave; le colorava.</p></div>\n\n<div class="stanza"><p>Poi ch&rsquo;ell&rsquo; avea &rsquo;l parlar cos&igrave; disciolto,</p>\n<p>cominciava a cantar s&igrave;, che con pena</p>\n<p>da lei avrei mio intento rivolto.</p></div>\n\n<div class="stanza"><p>&laquo;Io son&raquo;, cantava, &laquo;io son dolce serena,</p>\n<p>che &rsquo; marinari in mezzo mar dismago;</p>\n<p>tanto son di piacere a sentir piena!</p></div>\n\n<div class="stanza"><p>Io volsi Ulisse del suo cammin vago</p>\n<p>al canto mio; e qual meco s&rsquo;ausa,</p>\n<p>rado sen parte; s&igrave; tutto l&rsquo;appago!&raquo;.</p></div>\n\n<div class="stanza"><p>Ancor non era sua bocca richiusa,</p>\n<p>quand&rsquo; una donna apparve santa e presta</p>\n<p>lunghesso me per far colei confusa.</p></div>\n\n<div class="stanza"><p>&laquo;O Virgilio, Virgilio, chi &egrave; questa?&raquo;,</p>\n<p>fieramente dicea; ed el ven&igrave;a</p>\n<p>con li occhi fitti pur in quella onesta.</p></div>\n\n<div class="stanza"><p>L&rsquo;altra prendea, e dinanzi l&rsquo;apria</p>\n<p>fendendo i drappi, e mostravami &rsquo;l ventre;</p>\n<p>quel mi svegli&ograve; col puzzo che n&rsquo;uscia.</p></div>\n\n<div class="stanza"><p>Io mossi li occhi, e &rsquo;l buon maestro: &laquo;Almen tre</p>\n<p>voci t&rsquo;ho messe!&raquo;, dicea, &laquo;Surgi e vieni;</p>\n<p>troviam l&rsquo;aperta per la qual tu entre&raquo;.</p></div>\n\n<div class="stanza"><p>S&ugrave; mi levai, e tutti eran gi&agrave; pieni</p>\n<p>de l&rsquo;alto d&igrave; i giron del sacro monte,</p>\n<p>e andavam col sol novo a le reni.</p></div>\n\n<div class="stanza"><p>Seguendo lui, portava la mia fronte</p>\n<p>come colui che l&rsquo;ha di pensier carca,</p>\n<p>che fa di s&eacute; un mezzo arco di ponte;</p></div>\n\n<div class="stanza"><p>quand&rsquo; io udi&rsquo; &laquo;Venite; qui si varca&raquo;</p>\n<p>parlare in modo soave e benigno,</p>\n<p>qual non si sente in questa mortal marca.</p></div>\n\n<div class="stanza"><p>Con l&rsquo;ali aperte, che parean di cigno,</p>\n<p>volseci in s&ugrave; colui che s&igrave; parlonne</p>\n<p>tra due pareti del duro macigno.</p></div>\n\n<div class="stanza"><p>Mosse le penne poi e ventilonne,</p>\n<p>&lsquo;Qui lugent&rsquo; affermando esser beati,</p>\n<p>ch&rsquo;avran di consolar l&rsquo;anime donne.</p></div>\n\n<div class="stanza"><p>&laquo;Che hai che pur inver&rsquo; la terra guati?&raquo;,</p>\n<p>la guida mia incominci&ograve; a dirmi,</p>\n<p>poco amendue da l&rsquo;angel sormontati.</p></div>\n\n<div class="stanza"><p>E io: &laquo;Con tanta sospeccion fa irmi</p>\n<p>novella vis&iuml;on ch&rsquo;a s&eacute; mi piega,</p>\n<p>s&igrave; ch&rsquo;io non posso dal pensar partirmi&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Vedesti&raquo;, disse, &laquo;quell&rsquo;antica strega</p>\n<p>che sola sovr&rsquo; a noi omai si piagne;</p>\n<p>vedesti come l&rsquo;uom da lei si slega.</p></div>\n\n<div class="stanza"><p>Bastiti, e batti a terra le calcagne;</p>\n<p>li occhi rivolgi al logoro che gira</p>\n<p>lo rege etterno con le rote magne&raquo;.</p></div>\n\n<div class="stanza"><p>Quale &rsquo;l falcon, che prima a&rsquo; pi&eacute; si mira,</p>\n<p>indi si volge al grido e si protende</p>\n<p>per lo disio del pasto che l&agrave; il tira,</p></div>\n\n<div class="stanza"><p>tal mi fec&rsquo; io; e tal, quanto si fende</p>\n<p>la roccia per dar via a chi va suso,</p>\n<p>n&rsquo;andai infin dove &rsquo;l cerchiar si prende.</p></div>\n\n<div class="stanza"><p>Com&rsquo; io nel quinto giro fui dischiuso,</p>\n<p>vidi gente per esso che piangea,</p>\n<p>giacendo a terra tutta volta in giuso.</p></div>\n\n<div class="stanza"><p>&lsquo;Adhaesit pavimento anima mea&rsquo;</p>\n<p>sentia dir lor con s&igrave; alti sospiri,</p>\n<p>che la parola a pena s&rsquo;intendea.</p></div>\n\n<div class="stanza"><p>&laquo;O eletti di Dio, li cui soffriri</p>\n<p>e giustizia e speranza fa men duri,</p>\n<p>drizzate noi verso li alti saliri&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se voi venite dal giacer sicuri,</p>\n<p>e volete trovar la via pi&ugrave; tosto,</p>\n<p>le vostre destre sien sempre di fori&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; preg&ograve; &rsquo;l poeta, e s&igrave; risposto</p>\n<p>poco dinanzi a noi ne fu; per ch&rsquo;io</p>\n<p>nel parlare avvisai l&rsquo;altro nascosto,</p></div>\n\n<div class="stanza"><p>e volsi li occhi a li occhi al segnor mio:</p>\n<p>ond&rsquo; elli m&rsquo;assent&igrave; con lieto cenno</p>\n<p>ci&ograve; che chiedea la vista del disio.</p></div>\n\n<div class="stanza"><p>Poi ch&rsquo;io potei di me fare a mio senno,</p>\n<p>trassimi sovra quella creatura</p>\n<p>le cui parole pria notar mi fenno,</p></div>\n\n<div class="stanza"><p>dicendo: &laquo;Spirto in cui pianger matura</p>\n<p>quel sanza &rsquo;l quale a Dio tornar non p&ograve;ssi,</p>\n<p>sosta un poco per me tua maggior cura.</p></div>\n\n<div class="stanza"><p>Chi fosti e perch&eacute; v&ograve;lti avete i dossi</p>\n<p>al s&ugrave;, mi d&igrave;, e se vuo&rsquo; ch&rsquo;io t&rsquo;impetri</p>\n<p>cosa di l&agrave; ond&rsquo; io vivendo mossi&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Perch&eacute; i nostri diretri</p>\n<p>rivolga il cielo a s&eacute;, saprai; ma prima</p>\n<p>scias quod ego fui successor Petri.</p></div>\n\n<div class="stanza"><p>Intra S&iuml;estri e Chiaveri s&rsquo;adima</p>\n<p>una fiumana bella, e del suo nome</p>\n<p>lo titol del mio sangue fa sua cima.</p></div>\n\n<div class="stanza"><p>Un mese e poco pi&ugrave; prova&rsquo; io come</p>\n<p>pesa il gran manto a chi dal fango il guarda,</p>\n<p>che piuma sembran tutte l&rsquo;altre some.</p></div>\n\n<div class="stanza"><p>La mia convers&iuml;one, om&egrave;!, fu tarda;</p>\n<p>ma, come fatto fui roman pastore,</p>\n<p>cos&igrave; scopersi la vita bugiarda.</p></div>\n\n<div class="stanza"><p>Vidi che l&igrave; non s&rsquo;acquetava il core,</p>\n<p>n&eacute; pi&ugrave; salir potiesi in quella vita;</p>\n<p>per che di questa in me s&rsquo;accese amore.</p></div>\n\n<div class="stanza"><p>Fino a quel punto misera e partita</p>\n<p>da Dio anima fui, del tutto avara;</p>\n<p>or, come vedi, qui ne son punita.</p></div>\n\n<div class="stanza"><p>Quel ch&rsquo;avarizia fa, qui si dichiara</p>\n<p>in purgazion de l&rsquo;anime converse;</p>\n<p>e nulla pena il monte ha pi&ugrave; amara.</p></div>\n\n<div class="stanza"><p>S&igrave; come l&rsquo;occhio nostro non s&rsquo;aderse</p>\n<p>in alto, fisso a le cose terrene,</p>\n<p>cos&igrave; giustizia qui a terra il merse.</p></div>\n\n<div class="stanza"><p>Come avarizia spense a ciascun bene</p>\n<p>lo nostro amore, onde operar perd&eacute;si,</p>\n<p>cos&igrave; giustizia qui stretti ne tene,</p></div>\n\n<div class="stanza"><p>ne&rsquo; piedi e ne le man legati e presi;</p>\n<p>e quanto fia piacer del giusto Sire,</p>\n<p>tanto staremo immobili e distesi&raquo;.</p></div>\n\n<div class="stanza"><p>Io m&rsquo;era inginocchiato e volea dire;</p>\n<p>ma com&rsquo; io cominciai ed el s&rsquo;accorse,</p>\n<p>solo ascoltando, del mio reverire,</p></div>\n\n<div class="stanza"><p>&laquo;Qual cagion&raquo;, disse, &laquo;in gi&ugrave; cos&igrave; ti torse?&raquo;.</p>\n<p>E io a lui: &laquo;Per vostra dignitate</p>\n<p>mia cosc&iuml;enza dritto mi rimorse&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Drizza le gambe, l&egrave;vati s&ugrave;, frate!&raquo;,</p>\n<p>rispuose; &laquo;non errar: conservo sono</p>\n<p>teco e con li altri ad una podestate.</p></div>\n\n<div class="stanza"><p>Se mai quel santo evangelico suono</p>\n<p>che dice &lsquo;Neque nubent&rsquo; intendesti,</p>\n<p>ben puoi veder perch&rsquo; io cos&igrave; ragiono.</p></div>\n\n<div class="stanza"><p>Vattene omai: non vo&rsquo; che pi&ugrave; t&rsquo;arresti;</p>\n<p>ch&eacute; la tua stanza mio pianger disagia,</p>\n<p>col qual maturo ci&ograve; che tu dicesti.</p></div>\n\n<div class="stanza"><p>Nepote ho io di l&agrave; c&rsquo;ha nome Alagia,</p>\n<p>buona da s&eacute;, pur che la nostra casa</p>\n<p>non faccia lei per essempro malvagia;</p></div>\n\n<div class="stanza"><p>e questa sola di l&agrave; m&rsquo;&egrave; rimasa&raquo;.</p></div>','<p class="cantohead">Canto XX</p>\n\n<div class="stanza"><p>Contra miglior voler voler mal pugna;</p>\n<p>onde contra &rsquo;l piacer mio, per piacerli,</p>\n<p>trassi de l&rsquo;acqua non sazia la spugna.</p></div>\n\n<div class="stanza"><p>Mossimi; e &rsquo;l duca mio si mosse per li</p>\n<p>luoghi spediti pur lungo la roccia,</p>\n<p>come si va per muro stretto a&rsquo; merli;</p></div>\n\n<div class="stanza"><p>ch&eacute; la gente che fonde a goccia a goccia</p>\n<p>per li occhi il mal che tutto &rsquo;l mondo occupa,</p>\n<p>da l&rsquo;altra parte in fuor troppo s&rsquo;approccia.</p></div>\n\n<div class="stanza"><p>Maladetta sie tu, antica lupa,</p>\n<p>che pi&ugrave; che tutte l&rsquo;altre bestie hai preda</p>\n<p>per la tua fame sanza fine cupa!</p></div>\n\n<div class="stanza"><p>O ciel, nel cui girar par che si creda</p>\n<p>le condizion di qua gi&ugrave; trasmutarsi,</p>\n<p>quando verr&agrave; per cui questa disceda?</p></div>\n\n<div class="stanza"><p>Noi andavam con passi lenti e scarsi,</p>\n<p>e io attento a l&rsquo;ombre, ch&rsquo;i&rsquo; sentia</p>\n<p>pietosamente piangere e lagnarsi;</p></div>\n\n<div class="stanza"><p>e per ventura udi&rsquo; &laquo;Dolce Maria!&raquo;</p>\n<p>dinanzi a noi chiamar cos&igrave; nel pianto</p>\n<p>come fa donna che in parturir sia;</p></div>\n\n<div class="stanza"><p>e seguitar: &laquo;Povera fosti tanto,</p>\n<p>quanto veder si pu&ograve; per quello ospizio</p>\n<p>dove sponesti il tuo portato santo&raquo;.</p></div>\n\n<div class="stanza"><p>Seguentemente intesi: &laquo;O buon Fabrizio,</p>\n<p>con povert&agrave; volesti anzi virtute</p>\n<p>che gran ricchezza posseder con vizio&raquo;.</p></div>\n\n<div class="stanza"><p>Queste parole m&rsquo;eran s&igrave; piaciute,</p>\n<p>ch&rsquo;io mi trassi oltre per aver contezza</p>\n<p>di quello spirto onde parean venute.</p></div>\n\n<div class="stanza"><p>Esso parlava ancor de la larghezza</p>\n<p>che fece Niccol&ograve; a le pulcelle,</p>\n<p>per condurre ad onor lor giovinezza.</p></div>\n\n<div class="stanza"><p>&laquo;O anima che tanto ben favelle,</p>\n<p>dimmi chi fosti&raquo;, dissi, &laquo;e perch&eacute; sola</p>\n<p>tu queste degne lode rinovelle.</p></div>\n\n<div class="stanza"><p>Non fia sanza merc&eacute; la tua parola,</p>\n<p>s&rsquo;io ritorno a compi&eacute;r lo cammin corto</p>\n<p>di quella vita ch&rsquo;al termine vola&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli: &laquo;Io ti dir&ograve;, non per conforto</p>\n<p>ch&rsquo;io attenda di l&agrave;, ma perch&eacute; tanta</p>\n<p>grazia in te luce prima che sie morto.</p></div>\n\n<div class="stanza"><p>Io fui radice de la mala pianta</p>\n<p>che la terra cristiana tutta aduggia,</p>\n<p>s&igrave; che buon frutto rado se ne schianta.</p></div>\n\n<div class="stanza"><p>Ma se Doagio, Lilla, Guanto e Bruggia</p>\n<p>potesser, tosto ne saria vendetta;</p>\n<p>e io la cheggio a lui che tutto giuggia.</p></div>\n\n<div class="stanza"><p>Chiamato fui di l&agrave; Ugo Ciappetta;</p>\n<p>di me son nati i Filippi e i Luigi</p>\n<p>per cui novellamente &egrave; Francia retta.</p></div>\n\n<div class="stanza"><p>Figliuol fu&rsquo; io d&rsquo;un beccaio di Parigi:</p>\n<p>quando li regi antichi venner meno</p>\n<p>tutti, fuor ch&rsquo;un renduto in panni bigi,</p></div>\n\n<div class="stanza"><p>trova&rsquo;mi stretto ne le mani il freno</p>\n<p>del governo del regno, e tanta possa</p>\n<p>di nuovo acquisto, e s&igrave; d&rsquo;amici pieno,</p></div>\n\n<div class="stanza"><p>ch&rsquo;a la corona vedova promossa</p>\n<p>la testa di mio figlio fu, dal quale</p>\n<p>cominciar di costor le sacrate ossa.</p></div>\n\n<div class="stanza"><p>Mentre che la gran dota provenzale</p>\n<p>al sangue mio non tolse la vergogna,</p>\n<p>poco valea, ma pur non facea male.</p></div>\n\n<div class="stanza"><p>L&igrave; cominci&ograve; con forza e con menzogna</p>\n<p>la sua rapina; e poscia, per ammenda,</p>\n<p>Pont&igrave; e Normandia prese e Guascogna.</p></div>\n\n<div class="stanza"><p>Carlo venne in Italia e, per ammenda,</p>\n<p>vittima f&eacute; di Curradino; e poi</p>\n<p>ripinse al ciel Tommaso, per ammenda.</p></div>\n\n<div class="stanza"><p>Tempo vegg&rsquo; io, non molto dopo ancoi,</p>\n<p>che tragge un altro Carlo fuor di Francia,</p>\n<p>per far conoscer meglio e s&eacute; e &rsquo; suoi.</p></div>\n\n<div class="stanza"><p>Sanz&rsquo; arme n&rsquo;esce e solo con la lancia</p>\n<p>con la qual giostr&ograve; Giuda, e quella ponta</p>\n<p>s&igrave;, ch&rsquo;a Fiorenza fa scoppiar la pancia.</p></div>\n\n<div class="stanza"><p>Quindi non terra, ma peccato e onta</p>\n<p>guadagner&agrave;, per s&eacute; tanto pi&ugrave; grave,</p>\n<p>quanto pi&ugrave; lieve simil danno conta.</p></div>\n\n<div class="stanza"><p>L&rsquo;altro, che gi&agrave; usc&igrave; preso di nave,</p>\n<p>veggio vender sua figlia e patteggiarne</p>\n<p>come fanno i corsar de l&rsquo;altre schiave.</p></div>\n\n<div class="stanza"><p>O avarizia, che puoi tu pi&ugrave; farne,</p>\n<p>poscia c&rsquo;ha&rsquo; il mio sangue a te s&igrave; tratto,</p>\n<p>che non si cura de la propria carne?</p></div>\n\n<div class="stanza"><p>Perch&eacute; men paia il mal futuro e &rsquo;l fatto,</p>\n<p>veggio in Alagna intrar lo fiordaliso,</p>\n<p>e nel vicario suo Cristo esser catto.</p></div>\n\n<div class="stanza"><p>Veggiolo un&rsquo;altra volta esser deriso;</p>\n<p>veggio rinovellar l&rsquo;aceto e &rsquo;l fiele,</p>\n<p>e tra vivi ladroni esser anciso.</p></div>\n\n<div class="stanza"><p>Veggio il novo Pilato s&igrave; crudele,</p>\n<p>che ci&ograve; nol sazia, ma sanza decreto</p>\n<p>portar nel Tempio le cupide vele.</p></div>\n\n<div class="stanza"><p>O Segnor mio, quando sar&ograve; io lieto</p>\n<p>a veder la vendetta che, nascosa,</p>\n<p>fa dolce l&rsquo;ira tua nel tuo secreto?</p></div>\n\n<div class="stanza"><p>Ci&ograve; ch&rsquo;io dicea di quell&rsquo; unica sposa</p>\n<p>de lo Spirito Santo e che ti fece</p>\n<p>verso me volger per alcuna chiosa,</p></div>\n\n<div class="stanza"><p>tanto &egrave; risposto a tutte nostre prece</p>\n<p>quanto &rsquo;l d&igrave; dura; ma com&rsquo; el s&rsquo;annotta,</p>\n<p>contrario suon prendemo in quella vece.</p></div>\n\n<div class="stanza"><p>Noi repetiam Pigmal&iuml;on allotta,</p>\n<p>cui traditore e ladro e paricida</p>\n<p>fece la voglia sua de l&rsquo;oro ghiotta;</p></div>\n\n<div class="stanza"><p>e la miseria de l&rsquo;avaro Mida,</p>\n<p>che segu&igrave; a la sua dimanda gorda,</p>\n<p>per la qual sempre convien che si rida.</p></div>\n\n<div class="stanza"><p>Del folle Ac&agrave;n ciascun poi si ricorda,</p>\n<p>come fur&ograve; le spoglie, s&igrave; che l&rsquo;ira</p>\n<p>di Ios&uuml;&egrave; qui par ch&rsquo;ancor lo morda.</p></div>\n\n<div class="stanza"><p>Indi accusiam col marito Saffira;</p>\n<p>lodiam i calci ch&rsquo;ebbe El&iuml;odoro;</p>\n<p>e in infamia tutto &rsquo;l monte gira</p></div>\n\n<div class="stanza"><p>Polinest&ograve;r ch&rsquo;ancise Polidoro;</p>\n<p>ultimamente ci si grida: &ldquo;Crasso,</p>\n<p>dilci, che &rsquo;l sai: di che sapore &egrave; l&rsquo;oro?&rdquo;.</p></div>\n\n<div class="stanza"><p>Talor parla l&rsquo;uno alto e l&rsquo;altro basso,</p>\n<p>secondo l&rsquo;affezion ch&rsquo;ad ir ci sprona</p>\n<p>ora a maggiore e ora a minor passo:</p></div>\n\n<div class="stanza"><p>per&ograve; al ben che &rsquo;l d&igrave; ci si ragiona,</p>\n<p>dianzi non era io sol; ma qui da presso</p>\n<p>non alzava la voce altra persona&raquo;.</p></div>\n\n<div class="stanza"><p>Noi eravam partiti gi&agrave; da esso,</p>\n<p>e brigavam di soverchiar la strada</p>\n<p>tanto quanto al poder n&rsquo;era permesso,</p></div>\n\n<div class="stanza"><p>quand&rsquo; io senti&rsquo;, come cosa che cada,</p>\n<p>tremar lo monte; onde mi prese un gelo</p>\n<p>qual prender suol colui ch&rsquo;a morte vada.</p></div>\n\n<div class="stanza"><p>Certo non si scoteo s&igrave; forte Delo,</p>\n<p>pria che Latona in lei facesse &rsquo;l nido</p>\n<p>a parturir li due occhi del cielo.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve; da tutte parti un grido</p>\n<p>tal, che &rsquo;l maestro inverso me si feo,</p>\n<p>dicendo: &laquo;Non dubbiar, mentr&rsquo; io ti guido&raquo;.</p></div>\n\n<div class="stanza"><p>&lsquo;Glor&iuml;a in excelsis&rsquo; tutti &lsquo;Deo&rsquo;</p>\n<p>dicean, per quel ch&rsquo;io da&rsquo; vicin compresi,</p>\n<p>onde intender lo grido si poteo.</p></div>\n\n<div class="stanza"><p>No&rsquo; istavamo immobili e sospesi</p>\n<p>come i pastor che prima udir quel canto,</p>\n<p>fin che &rsquo;l tremar cess&ograve; ed el compi&eacute;si.</p></div>\n\n<div class="stanza"><p>Poi ripigliammo nostro cammin santo,</p>\n<p>guardando l&rsquo;ombre che giacean per terra,</p>\n<p>tornate gi&agrave; in su l&rsquo;usato pianto.</p></div>\n\n<div class="stanza"><p>Nulla ignoranza mai con tanta guerra</p>\n<p>mi f&eacute; desideroso di sapere,</p>\n<p>se la memoria mia in ci&ograve; non erra,</p></div>\n\n<div class="stanza"><p>quanta pareami allor, pensando, avere;</p>\n<p>n&eacute; per la fretta dimandare er&rsquo; oso,</p>\n<p>n&eacute; per me l&igrave; potea cosa vedere:</p></div>\n\n<div class="stanza"><p>cos&igrave; m&rsquo;andava timido e pensoso.</p></div>','<p class="cantohead">Canto XXI</p>\n\n<div class="stanza"><p>La sete natural che mai non sazia</p>\n<p>se non con l&rsquo;acqua onde la femminetta</p>\n<p>samaritana domand&ograve; la grazia,</p></div>\n\n<div class="stanza"><p>mi travagliava, e pungeami la fretta</p>\n<p>per la &rsquo;mpacciata via dietro al mio duca,</p>\n<p>e condoleami a la giusta vendetta.</p></div>\n\n<div class="stanza"><p>Ed ecco, s&igrave; come ne scrive Luca</p>\n<p>che Cristo apparve a&rsquo; due ch&rsquo;erano in via,</p>\n<p>gi&agrave; surto fuor de la sepulcral buca,</p></div>\n\n<div class="stanza"><p>ci apparve un&rsquo;ombra, e dietro a noi ven&igrave;a,</p>\n<p>dal pi&egrave; guardando la turba che giace;</p>\n<p>n&eacute; ci addemmo di lei, s&igrave; parl&ograve; pria,</p></div>\n\n<div class="stanza"><p>dicendo: &laquo;O frati miei, Dio vi dea pace&raquo;.</p>\n<p>Noi ci volgemmo s&ugrave;biti, e Virgilio</p>\n<p>rend&eacute;li &rsquo;l cenno ch&rsquo;a ci&ograve; si conface.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve;: &laquo;Nel beato concilio</p>\n<p>ti ponga in pace la verace corte</p>\n<p>che me rilega ne l&rsquo;etterno essilio&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Come!&raquo;, diss&rsquo; elli, e parte andavam forte:</p>\n<p>&laquo;se voi siete ombre che Dio s&ugrave; non degni,</p>\n<p>chi v&rsquo;ha per la sua scala tanto scorte?&raquo;.</p></div>\n\n<div class="stanza"><p>E &rsquo;l dottor mio: &laquo;Se tu riguardi a&rsquo; segni</p>\n<p>che questi porta e che l&rsquo;angel profila,</p>\n<p>ben vedrai che coi buon convien ch&rsquo;e&rsquo; regni.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; lei che d&igrave; e notte fila</p>\n<p>non li avea tratta ancora la conocchia</p>\n<p>che Cloto impone a ciascuno e compila,</p></div>\n\n<div class="stanza"><p>l&rsquo;anima sua, ch&rsquo;&egrave; tua e mia serocchia,</p>\n<p>venendo s&ugrave;, non potea venir sola,</p>\n<p>per&ograve; ch&rsquo;al nostro modo non adocchia.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io fui tratto fuor de l&rsquo;ampia gola</p>\n<p>d&rsquo;inferno per mostrarli, e mosterrolli</p>\n<p>oltre, quanto &rsquo;l potr&agrave; menar mia scola.</p></div>\n\n<div class="stanza"><p>Ma dimmi, se tu sai, perch&eacute; tai crolli</p>\n<p>di&egrave; dianzi &rsquo;l monte, e perch&eacute; tutto ad una</p>\n<p>parve gridare infino a&rsquo; suoi pi&egrave; molli&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; mi di&egrave;, dimandando, per la cruna</p>\n<p>del mio disio, che pur con la speranza</p>\n<p>si fece la mia sete men digiuna.</p></div>\n\n<div class="stanza"><p>Quei cominci&ograve;: &laquo;Cosa non &egrave; che sanza</p>\n<p>ordine senta la relig&iuml;one</p>\n<p>de la montagna, o che sia fuor d&rsquo;usanza.</p></div>\n\n<div class="stanza"><p>Libero &egrave; qui da ogne alterazione:</p>\n<p>di quel che &rsquo;l ciel da s&eacute; in s&eacute; riceve</p>\n<p>esser ci puote, e non d&rsquo;altro, cagione.</p></div>\n\n<div class="stanza"><p>Per che non pioggia, non grando, non neve,</p>\n<p>non rugiada, non brina pi&ugrave; s&ugrave; cade</p>\n<p>che la scaletta di tre gradi breve;</p></div>\n\n<div class="stanza"><p>nuvole spesse non paion n&eacute; rade,</p>\n<p>n&eacute; coruscar, n&eacute; figlia di Taumante,</p>\n<p>che di l&agrave; cangia sovente contrade;</p></div>\n\n<div class="stanza"><p>secco vapor non surge pi&ugrave; avante</p>\n<p>ch&rsquo;al sommo d&rsquo;i tre gradi ch&rsquo;io parlai,</p>\n<p>dov&rsquo; ha &rsquo;l vicario di Pietro le piante.</p></div>\n\n<div class="stanza"><p>Trema forse pi&ugrave; gi&ugrave; poco o assai;</p>\n<p>ma per vento che &rsquo;n terra si nasconda,</p>\n<p>non so come, qua s&ugrave; non trem&ograve; mai.</p></div>\n\n<div class="stanza"><p>Tremaci quando alcuna anima monda</p>\n<p>sentesi, s&igrave; che surga o che si mova</p>\n<p>per salir s&ugrave;; e tal grido seconda.</p></div>\n\n<div class="stanza"><p>De la mondizia sol voler fa prova,</p>\n<p>che, tutto libero a mutar convento,</p>\n<p>l&rsquo;alma sorprende, e di voler le giova.</p></div>\n\n<div class="stanza"><p>Prima vuol ben, ma non lascia il talento</p>\n<p>che divina giustizia, contra voglia,</p>\n<p>come fu al peccar, pone al tormento.</p></div>\n\n<div class="stanza"><p>E io, che son giaciuto a questa doglia</p>\n<p>cinquecent&rsquo; anni e pi&ugrave;, pur mo sentii</p>\n<p>libera volont&agrave; di miglior soglia:</p></div>\n\n<div class="stanza"><p>per&ograve; sentisti il tremoto e li pii</p>\n<p>spiriti per lo monte render lode</p>\n<p>a quel Segnor, che tosto s&ugrave; li &rsquo;nvii&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; ne disse; e per&ograve; ch&rsquo;el si gode</p>\n<p>tanto del ber quant&rsquo; &egrave; grande la sete,</p>\n<p>non saprei dir quant&rsquo; el mi fece prode.</p></div>\n\n<div class="stanza"><p>E &rsquo;l savio duca: &laquo;Omai veggio la rete</p>\n<p>che qui vi &rsquo;mpiglia e come si scalappia,</p>\n<p>perch&eacute; ci trema e di che congaudete.</p></div>\n\n<div class="stanza"><p>Ora chi fosti, piacciati ch&rsquo;io sappia,</p>\n<p>e perch&eacute; tanti secoli giaciuto</p>\n<p>qui se&rsquo;, ne le parole tue mi cappia&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Nel tempo che &rsquo;l buon Tito, con l&rsquo;aiuto</p>\n<p>del sommo rege, vendic&ograve; le f&oacute;ra</p>\n<p>ond&rsquo; usc&igrave; &rsquo;l sangue per Giuda venduto,</p></div>\n\n<div class="stanza"><p>col nome che pi&ugrave; dura e pi&ugrave; onora</p>\n<p>era io di l&agrave;&raquo;, rispuose quello spirto,</p>\n<p>&laquo;famoso assai, ma non con fede ancora.</p></div>\n\n<div class="stanza"><p>Tanto fu dolce mio vocale spirto,</p>\n<p>che, tolosano, a s&eacute; mi trasse Roma,</p>\n<p>dove mertai le tempie ornar di mirto.</p></div>\n\n<div class="stanza"><p>Stazio la gente ancor di l&agrave; mi noma:</p>\n<p>cantai di Tebe, e poi del grande Achille;</p>\n<p>ma caddi in via con la seconda soma.</p></div>\n\n<div class="stanza"><p>Al mio ardor fuor seme le faville,</p>\n<p>che mi scaldar, de la divina fiamma</p>\n<p>onde sono allumati pi&ugrave; di mille;</p></div>\n\n<div class="stanza"><p>de l&rsquo;Ene&iuml;da dico, la qual mamma</p>\n<p>fummi, e fummi nutrice, poetando:</p>\n<p>sanz&rsquo; essa non fermai peso di dramma.</p></div>\n\n<div class="stanza"><p>E per esser vivuto di l&agrave; quando</p>\n<p>visse Virgilio, assentirei un sole</p>\n<p>pi&ugrave; che non deggio al mio uscir di bando&raquo;.</p></div>\n\n<div class="stanza"><p>Volser Virgilio a me queste parole</p>\n<p>con viso che, tacendo, disse &lsquo;Taci&rsquo;;</p>\n<p>ma non pu&ograve; tutto la virt&ugrave; che vuole;</p></div>\n\n<div class="stanza"><p>ch&eacute; riso e pianto son tanto seguaci</p>\n<p>a la passion di che ciascun si spicca,</p>\n<p>che men seguon voler ne&rsquo; pi&ugrave; veraci.</p></div>\n\n<div class="stanza"><p>Io pur sorrisi come l&rsquo;uom ch&rsquo;ammicca;</p>\n<p>per che l&rsquo;ombra si tacque, e riguardommi</p>\n<p>ne li occhi ove &rsquo;l sembiante pi&ugrave; si ficca;</p></div>\n\n<div class="stanza"><p>e &laquo;Se tanto labore in bene assommi&raquo;,</p>\n<p>disse, &laquo;perch&eacute; la tua faccia testeso</p>\n<p>un lampeggiar di riso dimostrommi?&raquo;.</p></div>\n\n<div class="stanza"><p>Or son io d&rsquo;una parte e d&rsquo;altra preso:</p>\n<p>l&rsquo;una mi fa tacer, l&rsquo;altra scongiura</p>\n<p>ch&rsquo;io dica; ond&rsquo; io sospiro, e sono inteso</p></div>\n\n<div class="stanza"><p>dal mio maestro, e &laquo;Non aver paura&raquo;,</p>\n<p>mi dice, &laquo;di parlar; ma parla e digli</p>\n<p>quel ch&rsquo;e&rsquo; dimanda con cotanta cura&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io: &laquo;Forse che tu ti maravigli,</p>\n<p>antico spirto, del rider ch&rsquo;io fei;</p>\n<p>ma pi&ugrave; d&rsquo;ammirazion vo&rsquo; che ti pigli.</p></div>\n\n<div class="stanza"><p>Questi che guida in alto li occhi miei,</p>\n<p>&egrave; quel Virgilio dal qual tu togliesti</p>\n<p>forte a cantar de li uomini e d&rsquo;i d&egrave;i.</p></div>\n\n<div class="stanza"><p>Se cagion altra al mio rider credesti,</p>\n<p>lasciala per non vera, ed esser credi</p>\n<p>quelle parole che di lui dicesti&raquo;.</p></div>\n\n<div class="stanza"><p>Gi&agrave; s&rsquo;inchinava ad abbracciar li piedi</p>\n<p>al mio dottor, ma el li disse: &laquo;Frate,</p>\n<p>non far, ch&eacute; tu se&rsquo; ombra e ombra vedi&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ei surgendo: &laquo;Or puoi la quantitate</p>\n<p>comprender de l&rsquo;amor ch&rsquo;a te mi scalda,</p>\n<p>quand&rsquo; io dismento nostra vanitate,</p></div>\n\n<div class="stanza"><p>trattando l&rsquo;ombre come cosa salda&raquo;.</p></div>','<p class="cantohead">Canto XXII</p>\n\n<div class="stanza"><p>Gi&agrave; era l&rsquo;angel dietro a noi rimaso,</p>\n<p>l&rsquo;angel che n&rsquo;avea v&ograve;lti al sesto giro,</p>\n<p>avendomi dal viso un colpo raso;</p></div>\n\n<div class="stanza"><p>e quei c&rsquo;hanno a giustizia lor disiro</p>\n<p>detto n&rsquo;avea beati, e le sue voci</p>\n<p>con &lsquo;sitiunt&rsquo;, sanz&rsquo; altro, ci&ograve; forniro.</p></div>\n\n<div class="stanza"><p>E io pi&ugrave; lieve che per l&rsquo;altre foci</p>\n<p>m&rsquo;andava, s&igrave; che sanz&rsquo; alcun labore</p>\n<p>seguiva in s&ugrave; li spiriti veloci;</p></div>\n\n<div class="stanza"><p>quando Virgilio incominci&ograve;: &laquo;Amore,</p>\n<p>acceso di virt&ugrave;, sempre altro accese,</p>\n<p>pur che la fiamma sua paresse fore;</p></div>\n\n<div class="stanza"><p>onde da l&rsquo;ora che tra noi discese</p>\n<p>nel limbo de lo &rsquo;nferno Giovenale,</p>\n<p>che la tua affezion mi f&eacute; palese,</p></div>\n\n<div class="stanza"><p>mia benvoglienza inverso te fu quale</p>\n<p>pi&ugrave; strinse mai di non vista persona,</p>\n<p>s&igrave; ch&rsquo;or mi parran corte queste scale.</p></div>\n\n<div class="stanza"><p>Ma dimmi, e come amico mi perdona</p>\n<p>se troppa sicurt&agrave; m&rsquo;allarga il freno,</p>\n<p>e come amico omai meco ragiona:</p></div>\n\n<div class="stanza"><p>come pot&eacute; trovar dentro al tuo seno</p>\n<p>loco avarizia, tra cotanto senno</p>\n<p>di quanto per tua cura fosti pieno?&raquo;.</p></div>\n\n<div class="stanza"><p>Queste parole Stazio mover fenno</p>\n<p>un poco a riso pria; poscia rispuose:</p>\n<p>&laquo;Ogne tuo dir d&rsquo;amor m&rsquo;&egrave; caro cenno.</p></div>\n\n<div class="stanza"><p>Veramente pi&ugrave; volte appaion cose</p>\n<p>che danno a dubitar falsa matera</p>\n<p>per le vere ragion che son nascose.</p></div>\n\n<div class="stanza"><p>La tua dimanda tuo creder m&rsquo;avvera</p>\n<p>esser ch&rsquo;i&rsquo; fossi avaro in l&rsquo;altra vita,</p>\n<p>forse per quella cerchia dov&rsquo; io era.</p></div>\n\n<div class="stanza"><p>Or sappi ch&rsquo;avarizia fu partita</p>\n<p>troppo da me, e questa dismisura</p>\n<p>migliaia di lunari hanno punita.</p></div>\n\n<div class="stanza"><p>E se non fosse ch&rsquo;io drizzai mia cura,</p>\n<p>quand&rsquo; io intesi l&agrave; dove tu chiame,</p>\n<p>crucciato quasi a l&rsquo;umana natura:</p></div>\n\n<div class="stanza"><p>&lsquo;Per che non reggi tu, o sacra fame</p>\n<p>de l&rsquo;oro, l&rsquo;appetito de&rsquo; mortali?&rsquo;,</p>\n<p>voltando sentirei le giostre grame.</p></div>\n\n<div class="stanza"><p>Allor m&rsquo;accorsi che troppo aprir l&rsquo;ali</p>\n<p>potean le mani a spendere, e pente&rsquo;mi</p>\n<p>cos&igrave; di quel come de li altri mali.</p></div>\n\n<div class="stanza"><p>Quanti risurgeran coi crini scemi</p>\n<p>per ignoranza, che di questa pecca</p>\n<p>toglie &rsquo;l penter vivendo e ne li stremi!</p></div>\n\n<div class="stanza"><p>E sappie che la colpa che rimbecca</p>\n<p>per dritta opposizione alcun peccato,</p>\n<p>con esso insieme qui suo verde secca;</p></div>\n\n<div class="stanza"><p>per&ograve;, s&rsquo;io son tra quella gente stato</p>\n<p>che piange l&rsquo;avarizia, per purgarmi,</p>\n<p>per lo contrario suo m&rsquo;&egrave; incontrato&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Or quando tu cantasti le crude armi</p>\n<p>de la doppia trestizia di Giocasta&raquo;,</p>\n<p>disse &rsquo;l cantor de&rsquo; buccolici carmi,</p></div>\n\n<div class="stanza"><p>&laquo;per quello che Cl&iuml;&ograve; teco l&igrave; tasta,</p>\n<p>non par che ti facesse ancor fedele</p>\n<p>la fede, sanza qual ben far non basta.</p></div>\n\n<div class="stanza"><p>Se cos&igrave; &egrave;, qual sole o quai candele</p>\n<p>ti stenebraron s&igrave;, che tu drizzasti</p>\n<p>poscia di retro al pescator le vele?&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a lui: &laquo;Tu prima m&rsquo;inv&iuml;asti</p>\n<p>verso Parnaso a ber ne le sue grotte,</p>\n<p>e prima appresso Dio m&rsquo;alluminasti.</p></div>\n\n<div class="stanza"><p>Facesti come quei che va di notte,</p>\n<p>che porta il lume dietro e s&eacute; non giova,</p>\n<p>ma dopo s&eacute; fa le persone dotte,</p></div>\n\n<div class="stanza"><p>quando dicesti: &lsquo;Secol si rinova;</p>\n<p>torna giustizia e primo tempo umano,</p>\n<p>e progen&iuml;e scende da ciel nova&rsquo;.</p></div>\n\n<div class="stanza"><p>Per te poeta fui, per te cristiano:</p>\n<p>ma perch&eacute; veggi mei ci&ograve; ch&rsquo;io disegno,</p>\n<p>a colorare stender&ograve; la mano.</p></div>\n\n<div class="stanza"><p>Gi&agrave; era &rsquo;l mondo tutto quanto pregno</p>\n<p>de la vera credenza, seminata</p>\n<p>per li messaggi de l&rsquo;etterno regno;</p></div>\n\n<div class="stanza"><p>e la parola tua sopra toccata</p>\n<p>si consonava a&rsquo; nuovi predicanti;</p>\n<p>ond&rsquo; io a visitarli presi usata.</p></div>\n\n<div class="stanza"><p>Vennermi poi parendo tanto santi,</p>\n<p>che, quando Domizian li perseguette,</p>\n<p>sanza mio lagrimar non fur lor pianti;</p></div>\n\n<div class="stanza"><p>e mentre che di l&agrave; per me si stette,</p>\n<p>io li sovvenni, e i lor dritti costumi</p>\n<p>fer dispregiare a me tutte altre sette.</p></div>\n\n<div class="stanza"><p>E pria ch&rsquo;io conducessi i Greci a&rsquo; fiumi</p>\n<p>di Tebe poetando, ebb&rsquo; io battesmo;</p>\n<p>ma per paura chiuso cristian fu&rsquo;mi,</p></div>\n\n<div class="stanza"><p>lungamente mostrando paganesmo;</p>\n<p>e questa tepidezza il quarto cerchio</p>\n<p>cerchiar mi f&eacute; pi&ugrave; che &rsquo;l quarto centesmo.</p></div>\n\n<div class="stanza"><p>Tu dunque, che levato hai il coperchio</p>\n<p>che m&rsquo;ascondeva quanto bene io dico,</p>\n<p>mentre che del salire avem soverchio,</p></div>\n\n<div class="stanza"><p>dimmi dov&rsquo; &egrave; Terrenzio nostro antico,</p>\n<p>Cecilio e Plauto e Varro, se lo sai:</p>\n<p>dimmi se son dannati, e in qual vico&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Costoro e Persio e io e altri assai&raquo;,</p>\n<p>rispuose il duca mio, &laquo;siam con quel Greco</p>\n<p>che le Muse lattar pi&ugrave; ch&rsquo;altri mai,</p></div>\n\n<div class="stanza"><p>nel primo cinghio del carcere cieco;</p>\n<p>spesse f&iuml;ate ragioniam del monte</p>\n<p>che sempre ha le nutrice nostre seco.</p></div>\n\n<div class="stanza"><p>Euripide v&rsquo;&egrave; nosco e Antifonte,</p>\n<p>Simonide, Agatone e altri pi&ugrave;e</p>\n<p>Greci che gi&agrave; di lauro ornar la fronte.</p></div>\n\n<div class="stanza"><p>Quivi si veggion de le genti tue</p>\n<p>Antigone, De&iuml;file e Argia,</p>\n<p>e Ismene s&igrave; trista come fue.</p></div>\n\n<div class="stanza"><p>V&eacute;deisi quella che mostr&ograve; Langia;</p>\n<p>&egrave;vvi la figlia di Tiresia, e Teti,</p>\n<p>e con le suore sue De&iuml;damia&raquo;.</p></div>\n\n<div class="stanza"><p>Tacevansi ambedue gi&agrave; li poeti,</p>\n<p>di novo attenti a riguardar dintorno,</p>\n<p>liberi da saliri e da pareti;</p></div>\n\n<div class="stanza"><p>e gi&agrave; le quattro ancelle eran del giorno</p>\n<p>rimase a dietro, e la quinta era al temo,</p>\n<p>drizzando pur in s&ugrave; l&rsquo;ardente corno,</p></div>\n\n<div class="stanza"><p>quando il mio duca: &laquo;Io credo ch&rsquo;a lo stremo</p>\n<p>le destre spalle volger ne convegna,</p>\n<p>girando il monte come far solemo&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; l&rsquo;usanza fu l&igrave; nostra insegna,</p>\n<p>e prendemmo la via con men sospetto</p>\n<p>per l&rsquo;assentir di quell&rsquo; anima degna.</p></div>\n\n<div class="stanza"><p>Elli givan dinanzi, e io soletto</p>\n<p>di retro, e ascoltava i lor sermoni,</p>\n<p>ch&rsquo;a poetar mi davano intelletto.</p></div>\n\n<div class="stanza"><p>Ma tosto ruppe le dolci ragioni</p>\n<p>un alber che trovammo in mezza strada,</p>\n<p>con pomi a odorar soavi e buoni;</p></div>\n\n<div class="stanza"><p>e come abete in alto si digrada</p>\n<p>di ramo in ramo, cos&igrave; quello in giuso,</p>\n<p>cred&rsquo; io, perch&eacute; persona s&ugrave; non vada.</p></div>\n\n<div class="stanza"><p>Dal lato onde &rsquo;l cammin nostro era chiuso,</p>\n<p>cadea de l&rsquo;alta roccia un liquor chiaro</p>\n<p>e si spandeva per le foglie suso.</p></div>\n\n<div class="stanza"><p>Li due poeti a l&rsquo;alber s&rsquo;appressaro;</p>\n<p>e una voce per entro le fronde</p>\n<p>grid&ograve;: &laquo;Di questo cibo avrete caro&raquo;.</p></div>\n\n<div class="stanza"><p>Poi disse: &laquo;Pi&ugrave; pensava Maria onde</p>\n<p>fosser le nozze orrevoli e intere,</p>\n<p>ch&rsquo;a la sua bocca, ch&rsquo;or per voi risponde.</p></div>\n\n<div class="stanza"><p>E le Romane antiche, per lor bere,</p>\n<p>contente furon d&rsquo;acqua; e Dan&iuml;ello</p>\n<p>dispregi&ograve; cibo e acquist&ograve; savere.</p></div>\n\n<div class="stanza"><p>Lo secol primo, quant&rsquo; oro fu bello,</p>\n<p>f&eacute; savorose con fame le ghiande,</p>\n<p>e nettare con sete ogne ruscello.</p></div>\n\n<div class="stanza"><p>Mele e locuste furon le vivande</p>\n<p>che nodriro il Batista nel diserto;</p>\n<p>per ch&rsquo;elli &egrave; glor&iuml;oso e tanto grande</p></div>\n\n<div class="stanza"><p>quanto per lo Vangelio v&rsquo;&egrave; aperto&raquo;.</p></div>','<p class="cantohead">Canto XXIII</p>\n\n<div class="stanza"><p>Mentre che li occhi per la fronda verde</p>\n<p>ficcava &iuml;o s&igrave; come far suole</p>\n<p>chi dietro a li uccellin sua vita perde,</p></div>\n\n<div class="stanza"><p>lo pi&ugrave; che padre mi dicea: &laquo;Figliuole,</p>\n<p>vienne oramai, ch&eacute; &rsquo;l tempo che n&rsquo;&egrave; imposto</p>\n<p>pi&ugrave; utilmente compartir si vuole&raquo;.</p></div>\n\n<div class="stanza"><p>Io volsi &rsquo;l viso, e &rsquo;l passo non men tosto,</p>\n<p>appresso i savi, che parlavan s&igrave;e,</p>\n<p>che l&rsquo;andar mi facean di nullo costo.</p></div>\n\n<div class="stanza"><p>Ed ecco piangere e cantar s&rsquo;ud&igrave;e</p>\n<p>&lsquo;Lab&iuml;a m&euml;a, Domine&rsquo; per modo</p>\n<p>tal, che diletto e doglia partur&igrave;e.</p></div>\n\n<div class="stanza"><p>&laquo;O dolce padre, che &egrave; quel ch&rsquo;i&rsquo; odo?&raquo;,</p>\n<p>comincia&rsquo; io; ed elli: &laquo;Ombre che vanno</p>\n<p>forse di lor dover solvendo il nodo&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; come i peregrin pensosi fanno,</p>\n<p>giugnendo per cammin gente non nota,</p>\n<p>che si volgono ad essa e non restanno,</p></div>\n\n<div class="stanza"><p>cos&igrave; di retro a noi, pi&ugrave; tosto mota,</p>\n<p>venendo e trapassando ci ammirava</p>\n<p>d&rsquo;anime turba tacita e devota.</p></div>\n\n<div class="stanza"><p>Ne li occhi era ciascuna oscura e cava,</p>\n<p>palida ne la faccia, e tanto scema</p>\n<p>che da l&rsquo;ossa la pelle s&rsquo;informava.</p></div>\n\n<div class="stanza"><p>Non credo che cos&igrave; a buccia strema</p>\n<p>Erisittone fosse fatto secco,</p>\n<p>per digiunar, quando pi&ugrave; n&rsquo;ebbe tema.</p></div>\n\n<div class="stanza"><p>Io dicea fra me stesso pensando: &lsquo;Ecco</p>\n<p>la gente che perd&eacute; Ierusalemme,</p>\n<p>quando Maria nel figlio di&egrave; di becco!&rsquo;</p></div>\n\n<div class="stanza"><p>Parean l&rsquo;occhiaie anella sanza gemme:</p>\n<p>chi nel viso de li uomini legge &lsquo;omo&rsquo;</p>\n<p>ben avria quivi conosciuta l&rsquo;emme.</p></div>\n\n<div class="stanza"><p>Chi crederebbe che l&rsquo;odor d&rsquo;un pomo</p>\n<p>s&igrave; governasse, generando brama,</p>\n<p>e quel d&rsquo;un&rsquo;acqua, non sappiendo como?</p></div>\n\n<div class="stanza"><p>Gi&agrave; era in ammirar che s&igrave; li affama,</p>\n<p>per la cagione ancor non manifesta</p>\n<p>di lor magrezza e di lor trista squama,</p></div>\n\n<div class="stanza"><p>ed ecco del profondo de la testa</p>\n<p>volse a me li occhi un&rsquo;ombra e guard&ograve; fiso;</p>\n<p>poi grid&ograve; forte: &laquo;Qual grazia m&rsquo;&egrave; questa?&raquo;.</p></div>\n\n<div class="stanza"><p>Mai non l&rsquo;avrei riconosciuto al viso;</p>\n<p>ma ne la voce sua mi fu palese</p>\n<p>ci&ograve; che l&rsquo;aspetto in s&eacute; avea conquiso.</p></div>\n\n<div class="stanza"><p>Questa favilla tutta mi raccese</p>\n<p>mia conoscenza a la cangiata labbia,</p>\n<p>e ravvisai la faccia di Forese.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, non contendere a l&rsquo;asciutta scabbia</p>\n<p>che mi scolora&raquo;, pregava, &laquo;la pelle,</p>\n<p>n&eacute; a difetto di carne ch&rsquo;io abbia;</p></div>\n\n<div class="stanza"><p>ma dimmi il ver di te, d&igrave; chi son quelle</p>\n<p>due anime che l&agrave; ti fanno scorta;</p>\n<p>non rimaner che tu non mi favelle!&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;La faccia tua, ch&rsquo;io lagrimai gi&agrave; morta,</p>\n<p>mi d&agrave; di pianger mo non minor doglia&raquo;,</p>\n<p>rispuos&rsquo; io lui, &laquo;veggendola s&igrave; torta.</p></div>\n\n<div class="stanza"><p>Per&ograve; mi d&igrave;, per Dio, che s&igrave; vi sfoglia;</p>\n<p>non mi far dir mentr&rsquo; io mi maraviglio,</p>\n<p>ch&eacute; mal pu&ograve; dir chi &egrave; pien d&rsquo;altra voglia&raquo;.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;De l&rsquo;etterno consiglio</p>\n<p>cade vert&ugrave; ne l&rsquo;acqua e ne la pianta</p>\n<p>rimasa dietro ond&rsquo; io s&igrave; m&rsquo;assottiglio.</p></div>\n\n<div class="stanza"><p>Tutta esta gente che piangendo canta</p>\n<p>per seguitar la gola oltra misura,</p>\n<p>in fame e &rsquo;n sete qui si rif&agrave; santa.</p></div>\n\n<div class="stanza"><p>Di bere e di mangiar n&rsquo;accende cura</p>\n<p>l&rsquo;odor ch&rsquo;esce del pomo e de lo sprazzo</p>\n<p>che si distende su per sua verdura.</p></div>\n\n<div class="stanza"><p>E non pur una volta, questo spazzo</p>\n<p>girando, si rinfresca nostra pena:</p>\n<p>io dico pena, e dovria dir sollazzo,</p></div>\n\n<div class="stanza"><p>ch&eacute; quella voglia a li alberi ci mena</p>\n<p>che men&ograve; Cristo lieto a dire &lsquo;El&igrave;&rsquo;,</p>\n<p>quando ne liber&ograve; con la sua vena&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Forese, da quel d&igrave;</p>\n<p>nel qual mutasti mondo a miglior vita,</p>\n<p>cinqu&rsquo; anni non son v&ograve;lti infino a qui.</p></div>\n\n<div class="stanza"><p>Se prima fu la possa in te finita</p>\n<p>di peccar pi&ugrave;, che sovvenisse l&rsquo;ora</p>\n<p>del buon dolor ch&rsquo;a Dio ne rimarita,</p></div>\n\n<div class="stanza"><p>come se&rsquo; tu qua s&ugrave; venuto ancora?</p>\n<p>Io ti credea trovar l&agrave; gi&ugrave; di sotto,</p>\n<p>dove tempo per tempo si ristora&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; elli a me: &laquo;S&igrave; tosto m&rsquo;ha condotto</p>\n<p>a ber lo dolce assenzo d&rsquo;i mart&igrave;ri</p>\n<p>la Nella mia con suo pianger dirotto.</p></div>\n\n<div class="stanza"><p>Con suoi prieghi devoti e con sospiri</p>\n<p>tratto m&rsquo;ha de la costa ove s&rsquo;aspetta,</p>\n<p>e liberato m&rsquo;ha de li altri giri.</p></div>\n\n<div class="stanza"><p>Tanto &egrave; a Dio pi&ugrave; cara e pi&ugrave; diletta</p>\n<p>la vedovella mia, che molto amai,</p>\n<p>quanto in bene operare &egrave; pi&ugrave; soletta;</p></div>\n\n<div class="stanza"><p>ch&eacute; la Barbagia di Sardigna assai</p>\n<p>ne le femmine sue pi&ugrave; &egrave; pudica</p>\n<p>che la Barbagia dov&rsquo; io la lasciai.</p></div>\n\n<div class="stanza"><p>O dolce frate, che vuo&rsquo; tu ch&rsquo;io dica?</p>\n<p>Tempo futuro m&rsquo;&egrave; gi&agrave; nel cospetto,</p>\n<p>cui non sar&agrave; quest&rsquo; ora molto antica,</p></div>\n\n<div class="stanza"><p>nel qual sar&agrave; in pergamo interdetto</p>\n<p>a le sfacciate donne fiorentine</p>\n<p>l&rsquo;andar mostrando con le poppe il petto.</p></div>\n\n<div class="stanza"><p>Quai barbare fuor mai, quai saracine,</p>\n<p>cui bisognasse, per farle ir coperte,</p>\n<p>o spiritali o altre discipline?</p></div>\n\n<div class="stanza"><p>Ma se le svergognate fosser certe</p>\n<p>di quel che &rsquo;l ciel veloce loro ammanna,</p>\n<p>gi&agrave; per urlare avrian le bocche aperte;</p></div>\n\n<div class="stanza"><p>ch&eacute;, se l&rsquo;antiveder qui non m&rsquo;inganna,</p>\n<p>prima fien triste che le guance impeli</p>\n<p>colui che mo si consola con nanna.</p></div>\n\n<div class="stanza"><p>Deh, frate, or fa che pi&ugrave; non mi ti celi!</p>\n<p>vedi che non pur io, ma questa gente</p>\n<p>tutta rimira l&agrave; dove &rsquo;l sol veli&raquo;.</p></div>\n\n<div class="stanza"><p>Per ch&rsquo;io a lui: &laquo;Se tu riduci a mente</p>\n<p>qual fosti meco, e qual io teco fui,</p>\n<p>ancor fia grave il memorar presente.</p></div>\n\n<div class="stanza"><p>Di quella vita mi volse costui</p>\n<p>che mi va innanzi, l&rsquo;altr&rsquo; ier, quando tonda</p>\n<p>vi si mostr&ograve; la suora di colui&raquo;,</p></div>\n\n<div class="stanza"><p>e &rsquo;l sol mostrai; &laquo;costui per la profonda</p>\n<p>notte menato m&rsquo;ha d&rsquo;i veri morti</p>\n<p>con questa vera carne che &rsquo;l seconda.</p></div>\n\n<div class="stanza"><p>Indi m&rsquo;han tratto s&ugrave; li suoi conforti,</p>\n<p>salendo e rigirando la montagna</p>\n<p>che drizza voi che &rsquo;l mondo fece torti.</p></div>\n\n<div class="stanza"><p>Tanto dice di farmi sua compagna</p>\n<p>che io sar&ograve; l&agrave; dove fia Beatrice;</p>\n<p>quivi convien che sanza lui rimagna.</p></div>\n\n<div class="stanza"><p>Virgilio &egrave; questi che cos&igrave; mi dice&raquo;,</p>\n<p>e addita&rsquo;lo; &laquo;e quest&rsquo; altro &egrave; quell&rsquo; ombra</p>\n<p>per cu&iuml; scosse dianzi ogne pendice</p></div>\n\n<div class="stanza"><p>lo vostro regno, che da s&eacute; lo sgombra&raquo;.</p></div>','<p class="cantohead">Canto XXIV</p>\n\n<div class="stanza"><p>N&eacute; &rsquo;l dir l&rsquo;andar, n&eacute; l&rsquo;andar lui pi&ugrave; lento</p>\n<p>facea, ma ragionando andavam forte,</p>\n<p>s&igrave; come nave pinta da buon vento;</p></div>\n\n<div class="stanza"><p>e l&rsquo;ombre, che parean cose rimorte,</p>\n<p>per le fosse de li occhi ammirazione</p>\n<p>traean di me, di mio vivere accorte.</p></div>\n\n<div class="stanza"><p>E io, contin&uuml;ando al mio sermone,</p>\n<p>dissi: &laquo;Ella sen va s&ugrave; forse pi&ugrave; tarda</p>\n<p>che non farebbe, per altrui cagione.</p></div>\n\n<div class="stanza"><p>Ma dimmi, se tu sai, dov&rsquo; &egrave; Piccarda;</p>\n<p>dimmi s&rsquo;io veggio da notar persona</p>\n<p>tra questa gente che s&igrave; mi riguarda&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;La mia sorella, che tra bella e buona</p>\n<p>non so qual fosse pi&ugrave;, tr&iuml;unfa lieta</p>\n<p>ne l&rsquo;alto Olimpo gi&agrave; di sua corona&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; disse prima; e poi: &laquo;Qui non si vieta</p>\n<p>di nominar ciascun, da ch&rsquo;&egrave; s&igrave; munta</p>\n<p>nostra sembianza via per la d&iuml;eta.</p></div>\n\n<div class="stanza"><p>Questi&raquo;, e mostr&ograve; col dito, &laquo;&egrave; Bonagiunta,</p>\n<p>Bonagiunta da Lucca; e quella faccia</p>\n<p>di l&agrave; da lui pi&ugrave; che l&rsquo;altre trapunta</p></div>\n\n<div class="stanza"><p>ebbe la Santa Chiesa in le sue braccia:</p>\n<p>dal Torso fu, e purga per digiuno</p>\n<p>l&rsquo;anguille di Bolsena e la vernaccia&raquo;.</p></div>\n\n<div class="stanza"><p>Molti altri mi nom&ograve; ad uno ad uno;</p>\n<p>e del nomar parean tutti contenti,</p>\n<p>s&igrave; ch&rsquo;io per&ograve; non vidi un atto bruno.</p></div>\n\n<div class="stanza"><p>Vidi per fame a v&ograve;to usar li denti</p>\n<p>Ubaldin da la Pila e Bonifazio</p>\n<p>che pastur&ograve; col rocco molte genti.</p></div>\n\n<div class="stanza"><p>Vidi messer Marchese, ch&rsquo;ebbe spazio</p>\n<p>gi&agrave; di bere a Forl&igrave; con men secchezza,</p>\n<p>e s&igrave; fu tal, che non si sent&igrave; sazio.</p></div>\n\n<div class="stanza"><p>Ma come fa chi guarda e poi s&rsquo;apprezza</p>\n<p>pi&ugrave; d&rsquo;un che d&rsquo;altro, fei a quel da Lucca,</p>\n<p>che pi&ugrave; parea di me aver contezza.</p></div>\n\n<div class="stanza"><p>El mormorava; e non so che &laquo;Gentucca&raquo;</p>\n<p>sentiv&rsquo; io l&agrave;, ov&rsquo; el sentia la piaga</p>\n<p>de la giustizia che s&igrave; li pilucca.</p></div>\n\n<div class="stanza"><p>&laquo;O anima&raquo;, diss&rsquo; io, &laquo;che par s&igrave; vaga</p>\n<p>di parlar meco, fa s&igrave; ch&rsquo;io t&rsquo;intenda,</p>\n<p>e te e me col tuo parlare appaga&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Femmina &egrave; nata, e non porta ancor benda&raquo;,</p>\n<p>cominci&ograve; el, &laquo;che ti far&agrave; piacere</p>\n<p>la mia citt&agrave;, come ch&rsquo;om la riprenda.</p></div>\n\n<div class="stanza"><p>Tu te n&rsquo;andrai con questo antivedere:</p>\n<p>se nel mio mormorar prendesti errore,</p>\n<p>dichiareranti ancor le cose vere.</p></div>\n\n<div class="stanza"><p>Ma d&igrave; s&rsquo;i&rsquo; veggio qui colui che fore</p>\n<p>trasse le nove rime, cominciando</p>\n<p>&lsquo;Donne ch&rsquo;avete intelletto d&rsquo;amore&rsquo;&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;I&rsquo; mi son un che, quando</p>\n<p>Amor mi spira, noto, e a quel modo</p>\n<p>ch&rsquo;e&rsquo; ditta dentro vo significando&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O frate, issa vegg&rsquo; io&raquo;, diss&rsquo; elli, &laquo;il nodo</p>\n<p>che &rsquo;l Notaro e Guittone e me ritenne</p>\n<p>di qua dal dolce stil novo ch&rsquo;i&rsquo; odo!</p></div>\n\n<div class="stanza"><p>Io veggio ben come le vostre penne</p>\n<p>di retro al dittator sen vanno strette,</p>\n<p>che de le nostre certo non avvenne;</p></div>\n\n<div class="stanza"><p>e qual pi&ugrave; a gradire oltre si mette,</p>\n<p>non vede pi&ugrave; da l&rsquo;uno a l&rsquo;altro stilo&raquo;;</p>\n<p>e, quasi contentato, si tacette.</p></div>\n\n<div class="stanza"><p>Come li augei che vernan lungo &rsquo;l Nilo,</p>\n<p>alcuna volta in aere fanno schiera,</p>\n<p>poi volan pi&ugrave; a fretta e vanno in filo,</p></div>\n\n<div class="stanza"><p>cos&igrave; tutta la gente che l&igrave; era,</p>\n<p>volgendo &rsquo;l viso, raffrett&ograve; suo passo,</p>\n<p>e per magrezza e per voler leggera.</p></div>\n\n<div class="stanza"><p>E come l&rsquo;uom che di trottare &egrave; lasso,</p>\n<p>lascia andar li compagni, e s&igrave; passeggia</p>\n<p>fin che si sfoghi l&rsquo;affollar del casso,</p></div>\n\n<div class="stanza"><p>s&igrave; lasci&ograve; trapassar la santa greggia</p>\n<p>Forese, e dietro meco sen veniva,</p>\n<p>dicendo: &laquo;Quando fia ch&rsquo;io ti riveggia?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Non so&raquo;, rispuos&rsquo; io lui, &laquo;quant&rsquo; io mi viva;</p>\n<p>ma gi&agrave; non f&iuml;a il tornar mio tantosto,</p>\n<p>ch&rsquo;io non sia col voler prima a la riva;</p></div>\n\n<div class="stanza"><p>per&ograve; che &rsquo;l loco u&rsquo; fui a viver posto,</p>\n<p>di giorno in giorno pi&ugrave; di ben si spolpa,</p>\n<p>e a trista ruina par disposto&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Or va&raquo;, diss&rsquo; el; &laquo;che quei che pi&ugrave; n&rsquo;ha colpa,</p>\n<p>vegg&rsquo; &iuml;o a coda d&rsquo;una bestia tratto</p>\n<p>inver&rsquo; la valle ove mai non si scolpa.</p></div>\n\n<div class="stanza"><p>La bestia ad ogne passo va pi&ugrave; ratto,</p>\n<p>crescendo sempre, fin ch&rsquo;ella il percuote,</p>\n<p>e lascia il corpo vilmente disfatto.</p></div>\n\n<div class="stanza"><p>Non hanno molto a volger quelle ruote&raquo;,</p>\n<p>e drizz&ograve; li occhi al ciel, &laquo;che ti fia chiaro</p>\n<p>ci&ograve; che &rsquo;l mio dir pi&ugrave; dichiarar non puote.</p></div>\n\n<div class="stanza"><p>Tu ti rimani omai; ch&eacute; &rsquo;l tempo &egrave; caro</p>\n<p>in questo regno, s&igrave; ch&rsquo;io perdo troppo</p>\n<p>venendo teco s&igrave; a paro a paro&raquo;.</p></div>\n\n<div class="stanza"><p>Qual esce alcuna volta di gualoppo</p>\n<p>lo cavalier di schiera che cavalchi,</p>\n<p>e va per farsi onor del primo intoppo,</p></div>\n\n<div class="stanza"><p>tal si part&igrave; da noi con maggior valchi;</p>\n<p>e io rimasi in via con esso i due</p>\n<p>che fuor del mondo s&igrave; gran marescalchi.</p></div>\n\n<div class="stanza"><p>E quando innanzi a noi intrato fue,</p>\n<p>che li occhi miei si fero a lui seguaci,</p>\n<p>come la mente a le parole sue,</p></div>\n\n<div class="stanza"><p>parvermi i rami gravidi e vivaci</p>\n<p>d&rsquo;un altro pomo, e non molto lontani</p>\n<p>per esser pur allora v&ograve;lto in laci.</p></div>\n\n<div class="stanza"><p>Vidi gente sott&rsquo; esso alzar le mani</p>\n<p>e gridar non so che verso le fronde,</p>\n<p>quasi bramosi fantolini e vani</p></div>\n\n<div class="stanza"><p>che pregano, e &rsquo;l pregato non risponde,</p>\n<p>ma, per fare esser ben la voglia acuta,</p>\n<p>tien alto lor disio e nol nasconde.</p></div>\n\n<div class="stanza"><p>Poi si part&igrave; s&igrave; come ricreduta;</p>\n<p>e noi venimmo al grande arbore adesso,</p>\n<p>che tanti prieghi e lagrime rifiuta.</p></div>\n\n<div class="stanza"><p>&laquo;Trapassate oltre sanza farvi presso:</p>\n<p>legno &egrave; pi&ugrave; s&ugrave; che fu morso da Eva,</p>\n<p>e questa pianta si lev&ograve; da esso&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; tra le frasche non so chi diceva;</p>\n<p>per che Virgilio e Stazio e io, ristretti,</p>\n<p>oltre andavam dal lato che si leva.</p></div>\n\n<div class="stanza"><p>&laquo;Ricordivi&raquo;, dicea, &laquo;d&rsquo;i maladetti</p>\n<p>nei nuvoli formati, che, satolli,</p>\n<p>Tes&euml;o combatter co&rsquo; doppi petti;</p></div>\n\n<div class="stanza"><p>e de li Ebrei ch&rsquo;al ber si mostrar molli,</p>\n<p>per che no i volle Gedeon compagni,</p>\n<p>quando inver&rsquo; Mad&iuml;an discese i colli&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; accostati a l&rsquo;un d&rsquo;i due vivagni</p>\n<p>passammo, udendo colpe de la gola</p>\n<p>seguite gi&agrave; da miseri guadagni.</p></div>\n\n<div class="stanza"><p>Poi, rallargati per la strada sola,</p>\n<p>ben mille passi e pi&ugrave; ci portar oltre,</p>\n<p>contemplando ciascun sanza parola.</p></div>\n\n<div class="stanza"><p>&laquo;Che andate pensando s&igrave; voi sol tre?&raquo;.</p>\n<p>s&ugrave;bita voce disse; ond&rsquo; io mi scossi</p>\n<p>come fan bestie spaventate e poltre.</p></div>\n\n<div class="stanza"><p>Drizzai la testa per veder chi fossi;</p>\n<p>e gi&agrave; mai non si videro in fornace</p>\n<p>vetri o metalli s&igrave; lucenti e rossi,</p></div>\n\n<div class="stanza"><p>com&rsquo; io vidi un che dicea: &laquo;S&rsquo;a voi piace</p>\n<p>montare in s&ugrave;, qui si convien dar volta;</p>\n<p>quinci si va chi vuole andar per pace&raquo;.</p></div>\n\n<div class="stanza"><p>L&rsquo;aspetto suo m&rsquo;avea la vista tolta;</p>\n<p>per ch&rsquo;io mi volsi dietro a&rsquo; miei dottori,</p>\n<p>com&rsquo; om che va secondo ch&rsquo;elli ascolta.</p></div>\n\n<div class="stanza"><p>E quale, annunziatrice de li albori,</p>\n<p>l&rsquo;aura di maggio movesi e olezza,</p>\n<p>tutta impregnata da l&rsquo;erba e da&rsquo; fiori;</p></div>\n\n<div class="stanza"><p>tal mi senti&rsquo; un vento dar per mezza</p>\n<p>la fronte, e ben senti&rsquo; mover la piuma,</p>\n<p>che f&eacute; sentir d&rsquo;ambros&iuml;a l&rsquo;orezza.</p></div>\n\n<div class="stanza"><p>E senti&rsquo; dir: &laquo;Beati cui alluma</p>\n<p>tanto di grazia, che l&rsquo;amor del gusto</p>\n<p>nel petto lor troppo disir non fuma,</p></div>\n\n<div class="stanza"><p>esur&iuml;endo sempre quanto &egrave; giusto!&raquo;.</p></div>','<p class="cantohead">Canto XXV</p>\n\n<div class="stanza"><p>Ora era onde &rsquo;l salir non volea storpio;</p>\n<p>ch&eacute; &rsquo;l sole av&euml;a il cerchio di merigge</p>\n<p>lasciato al Tauro e la notte a lo Scorpio:</p></div>\n\n<div class="stanza"><p>per che, come fa l&rsquo;uom che non s&rsquo;affigge</p>\n<p>ma vassi a la via sua, che che li appaia,</p>\n<p>se di bisogno stimolo il trafigge,</p></div>\n\n<div class="stanza"><p>cos&igrave; intrammo noi per la callaia,</p>\n<p>uno innanzi altro prendendo la scala</p>\n<p>che per artezza i salitor dispaia.</p></div>\n\n<div class="stanza"><p>E quale il cicognin che leva l&rsquo;ala</p>\n<p>per voglia di volare, e non s&rsquo;attenta</p>\n<p>d&rsquo;abbandonar lo nido, e gi&ugrave; la cala;</p></div>\n\n<div class="stanza"><p>tal era io con voglia accesa e spenta</p>\n<p>di dimandar, venendo infino a l&rsquo;atto</p>\n<p>che fa colui ch&rsquo;a dicer s&rsquo;argomenta.</p></div>\n\n<div class="stanza"><p>Non lasci&ograve;, per l&rsquo;andar che fosse ratto,</p>\n<p>lo dolce padre mio, ma disse: &laquo;Scocca</p>\n<p>l&rsquo;arco del dir, che &rsquo;nfino al ferro hai tratto&raquo;.</p></div>\n\n<div class="stanza"><p>Allor sicuramente apri&rsquo; la bocca</p>\n<p>e cominciai: &laquo;Come si pu&ograve; far magro</p>\n<p>l&agrave; dove l&rsquo;uopo di nodrir non tocca?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se t&rsquo;ammentassi come Meleagro</p>\n<p>si consum&ograve; al consumar d&rsquo;un stizzo,</p>\n<p>non fora&raquo;, disse, &laquo;a te questo s&igrave; agro;</p></div>\n\n<div class="stanza"><p>e se pensassi come, al vostro guizzo,</p>\n<p>guizza dentro a lo specchio vostra image,</p>\n<p>ci&ograve; che par duro ti parrebbe vizzo.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; dentro a tuo voler t&rsquo;adage,</p>\n<p>ecco qui Stazio; e io lui chiamo e prego</p>\n<p>che sia or sanator de le tue piage&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Se la veduta etterna li dislego&raquo;,</p>\n<p>rispuose Stazio, &laquo;l&agrave; dove tu sie,</p>\n<p>discolpi me non potert&rsquo; io far nego&raquo;.</p></div>\n\n<div class="stanza"><p>Poi cominci&ograve;: &laquo;Se le parole mie,</p>\n<p>figlio, la mente tua guarda e riceve,</p>\n<p>lume ti fiero al come che tu die.</p></div>\n\n<div class="stanza"><p>Sangue perfetto, che poi non si beve</p>\n<p>da l&rsquo;assetate vene, e si rimane</p>\n<p>quasi alimento che di mensa leve,</p></div>\n\n<div class="stanza"><p>prende nel core a tutte membra umane</p>\n<p>virtute informativa, come quello</p>\n<p>ch&rsquo;a farsi quelle per le vene vane.</p></div>\n\n<div class="stanza"><p>Ancor digesto, scende ov&rsquo; &egrave; pi&ugrave; bello</p>\n<p>tacer che dire; e quindi poscia geme</p>\n<p>sovr&rsquo; altrui sangue in natural vasello.</p></div>\n\n<div class="stanza"><p>Ivi s&rsquo;accoglie l&rsquo;uno e l&rsquo;altro insieme,</p>\n<p>l&rsquo;un disposto a patire, e l&rsquo;altro a fare</p>\n<p>per lo perfetto loco onde si preme;</p></div>\n\n<div class="stanza"><p>e, giunto lui, comincia ad operare</p>\n<p>coagulando prima, e poi avviva</p>\n<p>ci&ograve; che per sua matera f&eacute; constare.</p></div>\n\n<div class="stanza"><p>Anima fatta la virtute attiva</p>\n<p>qual d&rsquo;una pianta, in tanto differente,</p>\n<p>che questa &egrave; in via e quella &egrave; gi&agrave; a riva,</p></div>\n\n<div class="stanza"><p>tanto ovra poi, che gi&agrave; si move e sente,</p>\n<p>come spungo marino; e indi imprende</p>\n<p>ad organar le posse ond&rsquo; &egrave; semente.</p></div>\n\n<div class="stanza"><p>Or si spiega, figliuolo, or si distende</p>\n<p>la virt&ugrave; ch&rsquo;&egrave; dal cor del generante,</p>\n<p>dove natura a tutte membra intende.</p></div>\n\n<div class="stanza"><p>Ma come d&rsquo;animal divegna fante,</p>\n<p>non vedi tu ancor: quest&rsquo; &egrave; tal punto,</p>\n<p>che pi&ugrave; savio di te f&eacute; gi&agrave; errante,</p></div>\n\n<div class="stanza"><p>s&igrave; che per sua dottrina f&eacute; disgiunto</p>\n<p>da l&rsquo;anima il possibile intelletto,</p>\n<p>perch&eacute; da lui non vide organo assunto.</p></div>\n\n<div class="stanza"><p>Apri a la verit&agrave; che viene il petto;</p>\n<p>e sappi che, s&igrave; tosto come al feto</p>\n<p>l&rsquo;articular del cerebro &egrave; perfetto,</p></div>\n\n<div class="stanza"><p>lo motor primo a lui si volge lieto</p>\n<p>sovra tant&rsquo; arte di natura, e spira</p>\n<p>spirito novo, di vert&ugrave; repleto,</p></div>\n\n<div class="stanza"><p>che ci&ograve; che trova attivo quivi, tira</p>\n<p>in sua sustanzia, e fassi un&rsquo;alma sola,</p>\n<p>che vive e sente e s&eacute; in s&eacute; rigira.</p></div>\n\n<div class="stanza"><p>E perch&eacute; meno ammiri la parola,</p>\n<p>guarda il calor del sole che si fa vino,</p>\n<p>giunto a l&rsquo;omor che de la vite cola.</p></div>\n\n<div class="stanza"><p>Quando L&agrave;chesis non ha pi&ugrave; del lino,</p>\n<p>solvesi da la carne, e in virtute</p>\n<p>ne porta seco e l&rsquo;umano e &rsquo;l divino:</p></div>\n\n<div class="stanza"><p>l&rsquo;altre potenze tutte quante mute;</p>\n<p>memoria, intelligenza e volontade</p>\n<p>in atto molto pi&ugrave; che prima agute.</p></div>\n\n<div class="stanza"><p>Sanza restarsi, per s&eacute; stessa cade</p>\n<p>mirabilmente a l&rsquo;una de le rive;</p>\n<p>quivi conosce prima le sue strade.</p></div>\n\n<div class="stanza"><p>Tosto che loco l&igrave; la circunscrive,</p>\n<p>la virt&ugrave; formativa raggia intorno</p>\n<p>cos&igrave; e quanto ne le membra vive.</p></div>\n\n<div class="stanza"><p>E come l&rsquo;aere, quand&rsquo; &egrave; ben p&iuml;orno,</p>\n<p>per l&rsquo;altrui raggio che &rsquo;n s&eacute; si reflette,</p>\n<p>di diversi color diventa addorno;</p></div>\n\n<div class="stanza"><p>cos&igrave; l&rsquo;aere vicin quivi si mette</p>\n<p>e in quella forma ch&rsquo;&egrave; in lui suggella</p>\n<p>virt&uuml;almente l&rsquo;alma che ristette;</p></div>\n\n<div class="stanza"><p>e simigliante poi a la fiammella</p>\n<p>che segue il foco l&agrave; &rsquo;vunque si muta,</p>\n<p>segue lo spirto sua forma novella.</p></div>\n\n<div class="stanza"><p>Per&ograve; che quindi ha poscia sua paruta,</p>\n<p>&egrave; chiamata ombra; e quindi organa poi</p>\n<p>ciascun sentire infino a la veduta.</p></div>\n\n<div class="stanza"><p>Quindi parliamo e quindi ridiam noi;</p>\n<p>quindi facciam le lagrime e &rsquo; sospiri</p>\n<p>che per lo monte aver sentiti puoi.</p></div>\n\n<div class="stanza"><p>Secondo che ci affliggono i disiri</p>\n<p>e li altri affetti, l&rsquo;ombra si figura;</p>\n<p>e quest&rsquo; &egrave; la cagion di che tu miri&raquo;.</p></div>\n\n<div class="stanza"><p>E gi&agrave; venuto a l&rsquo;ultima tortura</p>\n<p>s&rsquo;era per noi, e v&ograve;lto a la man destra,</p>\n<p>ed eravamo attenti ad altra cura.</p></div>\n\n<div class="stanza"><p>Quivi la ripa fiamma in fuor balestra,</p>\n<p>e la cornice spira fiato in suso</p>\n<p>che la reflette e via da lei sequestra;</p></div>\n\n<div class="stanza"><p>ond&rsquo; ir ne convenia dal lato schiuso</p>\n<p>ad uno ad uno; e io tem&euml;a &rsquo;l foco</p>\n<p>quinci, e quindi temeva cader giuso.</p></div>\n\n<div class="stanza"><p>Lo duca mio dicea: &laquo;Per questo loco</p>\n<p>si vuol tenere a li occhi stretto il freno,</p>\n<p>per&ograve; ch&rsquo;errar potrebbesi per poco&raquo;.</p></div>\n\n<div class="stanza"><p>&lsquo;Summae Deus clement&iuml;ae&rsquo; nel seno</p>\n<p>al grande ardore allora udi&rsquo; cantando,</p>\n<p>che di volger mi f&eacute; caler non meno;</p></div>\n\n<div class="stanza"><p>e vidi spirti per la fiamma andando;</p>\n<p>per ch&rsquo;io guardava a loro e a&rsquo; miei passi</p>\n<p>compartendo la vista a quando a quando.</p></div>\n\n<div class="stanza"><p>Appresso il fine ch&rsquo;a quell&rsquo; inno fassi,</p>\n<p>gridavano alto: &lsquo;Virum non cognosco&rsquo;;</p>\n<p>indi ricominciavan l&rsquo;inno bassi.</p></div>\n\n<div class="stanza"><p>Finitolo, anco gridavano: &laquo;Al bosco</p>\n<p>si tenne Diana, ed Elice caccionne</p>\n<p>che di Venere avea sentito il t&ograve;sco&raquo;.</p></div>\n\n<div class="stanza"><p>Indi al cantar tornavano; indi donne</p>\n<p>gridavano e mariti che fuor casti</p>\n<p>come virtute e matrimonio imponne.</p></div>\n\n<div class="stanza"><p>E questo modo credo che lor basti</p>\n<p>per tutto il tempo che &rsquo;l foco li abbruscia:</p>\n<p>con tal cura conviene e con tai pasti</p></div>\n\n<div class="stanza"><p>che la piaga da sezzo si ricuscia.</p></div>','<p class="cantohead">Canto XXVI</p>\n\n<div class="stanza"><p>Mentre che s&igrave; per l&rsquo;orlo, uno innanzi altro,</p>\n<p>ce n&rsquo;andavamo, e spesso il buon maestro</p>\n<p>diceami: &laquo;Guarda: giovi ch&rsquo;io ti scaltro&raquo;;</p></div>\n\n<div class="stanza"><p>feriami il sole in su l&rsquo;omero destro,</p>\n<p>che gi&agrave;, raggiando, tutto l&rsquo;occidente</p>\n<p>mutava in bianco aspetto di cilestro;</p></div>\n\n<div class="stanza"><p>e io facea con l&rsquo;ombra pi&ugrave; rovente</p>\n<p>parer la fiamma; e pur a tanto indizio</p>\n<p>vidi molt&rsquo; ombre, andando, poner mente.</p></div>\n\n<div class="stanza"><p>Questa fu la cagion che diede inizio</p>\n<p>loro a parlar di me; e cominciarsi</p>\n<p>a dir: &laquo;Colui non par corpo fittizio&raquo;;</p></div>\n\n<div class="stanza"><p>poi verso me, quanto pot&euml;an farsi,</p>\n<p>certi si fero, sempre con riguardo</p>\n<p>di non uscir dove non fosser arsi.</p></div>\n\n<div class="stanza"><p>&laquo;O tu che vai, non per esser pi&ugrave; tardo,</p>\n<p>ma forse reverente, a li altri dopo,</p>\n<p>rispondi a me che &rsquo;n sete e &rsquo;n foco ardo.</p></div>\n\n<div class="stanza"><p>N&eacute; solo a me la tua risposta &egrave; uopo;</p>\n<p>ch&eacute; tutti questi n&rsquo;hanno maggior sete</p>\n<p>che d&rsquo;acqua fredda Indo o Et&iuml;opo.</p></div>\n\n<div class="stanza"><p>Dinne com&rsquo; &egrave; che fai di te parete</p>\n<p>al sol, pur come tu non fossi ancora</p>\n<p>di morte intrato dentro da la rete&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; mi parlava un d&rsquo;essi; e io mi fora</p>\n<p>gi&agrave; manifesto, s&rsquo;io non fossi atteso</p>\n<p>ad altra novit&agrave; ch&rsquo;apparve allora;</p></div>\n\n<div class="stanza"><p>ch&eacute; per lo mezzo del cammino acceso</p>\n<p>venne gente col viso incontro a questa,</p>\n<p>la qual mi fece a rimirar sospeso.</p></div>\n\n<div class="stanza"><p>L&igrave; veggio d&rsquo;ogne parte farsi presta</p>\n<p>ciascun&rsquo; ombra e basciarsi una con una</p>\n<p>sanza restar, contente a brieve festa;</p></div>\n\n<div class="stanza"><p>cos&igrave; per entro loro schiera bruna</p>\n<p>s&rsquo;ammusa l&rsquo;una con l&rsquo;altra formica,</p>\n<p>forse a sp&iuml;ar lor via e lor fortuna.</p></div>\n\n<div class="stanza"><p>Tosto che parton l&rsquo;accoglienza amica,</p>\n<p>prima che &rsquo;l primo passo l&igrave; trascorra,</p>\n<p>sopragridar ciascuna s&rsquo;affatica:</p></div>\n\n<div class="stanza"><p>la nova gente: &laquo;Soddoma e Gomorra&raquo;;</p>\n<p>e l&rsquo;altra: &laquo;Ne la vacca entra Pasife,</p>\n<p>perch&eacute; &rsquo;l torello a sua lussuria corra&raquo;.</p></div>\n\n<div class="stanza"><p>Poi, come grue ch&rsquo;a le montagne Rife</p>\n<p>volasser parte, e parte inver&rsquo; l&rsquo;arene,</p>\n<p>queste del gel, quelle del sole schife,</p></div>\n\n<div class="stanza"><p>l&rsquo;una gente sen va, l&rsquo;altra sen vene;</p>\n<p>e tornan, lagrimando, a&rsquo; primi canti</p>\n<p>e al gridar che pi&ugrave; lor si convene;</p></div>\n\n<div class="stanza"><p>e raccostansi a me, come davanti,</p>\n<p>essi medesmi che m&rsquo;avean pregato,</p>\n<p>attenti ad ascoltar ne&rsquo; lor sembianti.</p></div>\n\n<div class="stanza"><p>Io, che due volte avea visto lor grato,</p>\n<p>incominciai: &laquo;O anime sicure</p>\n<p>d&rsquo;aver, quando che sia, di pace stato,</p></div>\n\n<div class="stanza"><p>non son rimase acerbe n&eacute; mature</p>\n<p>le membra mie di l&agrave;, ma son qui meco</p>\n<p>col sangue suo e con le sue giunture.</p></div>\n\n<div class="stanza"><p>Quinci s&ugrave; vo per non esser pi&ugrave; cieco;</p>\n<p>donna &egrave; di sopra che m&rsquo;acquista grazia,</p>\n<p>per che &rsquo;l mortal per vostro mondo reco.</p></div>\n\n<div class="stanza"><p>Ma se la vostra maggior voglia sazia</p>\n<p>tosto divegna, s&igrave; che &rsquo;l ciel v&rsquo;alberghi</p>\n<p>ch&rsquo;&egrave; pien d&rsquo;amore e pi&ugrave; ampio si spazia,</p></div>\n\n<div class="stanza"><p>ditemi, acci&ograve; ch&rsquo;ancor carte ne verghi,</p>\n<p>chi siete voi, e chi &egrave; quella turba</p>\n<p>che se ne va di retro a&rsquo; vostri terghi&raquo;.</p></div>\n\n<div class="stanza"><p>Non altrimenti stupido si turba</p>\n<p>lo montanaro, e rimirando ammuta,</p>\n<p>quando rozzo e salvatico s&rsquo;inurba,</p></div>\n\n<div class="stanza"><p>che ciascun&rsquo; ombra fece in sua paruta;</p>\n<p>ma poi che furon di stupore scarche,</p>\n<p>lo qual ne li alti cuor tosto s&rsquo;attuta,</p></div>\n\n<div class="stanza"><p>&laquo;Beato te, che de le nostre marche&raquo;,</p>\n<p>ricominci&ograve; colei che pria m&rsquo;inchiese,</p>\n<p>&laquo;per morir meglio, esper&iuml;enza imbarche!</p></div>\n\n<div class="stanza"><p>La gente che non vien con noi, offese</p>\n<p>di ci&ograve; per che gi&agrave; Cesar, tr&iuml;unfando,</p>\n<p>&ldquo;Regina&rdquo; contra s&eacute; chiamar s&rsquo;intese:</p></div>\n\n<div class="stanza"><p>per&ograve; si parton &ldquo;Soddoma&rdquo; gridando,</p>\n<p>rimproverando a s&eacute; com&rsquo; hai udito,</p>\n<p>e aiutan l&rsquo;arsura vergognando.</p></div>\n\n<div class="stanza"><p>Nostro peccato fu ermafrodito;</p>\n<p>ma perch&eacute; non servammo umana legge,</p>\n<p>seguendo come bestie l&rsquo;appetito,</p></div>\n\n<div class="stanza"><p>in obbrobrio di noi, per noi si legge,</p>\n<p>quando partinci, il nome di colei</p>\n<p>che s&rsquo;imbesti&ograve; ne le &rsquo;mbestiate schegge.</p></div>\n\n<div class="stanza"><p>Or sai nostri atti e di che fummo rei:</p>\n<p>se forse a nome vuo&rsquo; saper chi semo,</p>\n<p>tempo non &egrave; di dire, e non saprei.</p></div>\n\n<div class="stanza"><p>Farotti ben di me volere scemo:</p>\n<p>son Guido Guinizzelli, e gi&agrave; mi purgo</p>\n<p>per ben dolermi prima ch&rsquo;a lo stremo&raquo;.</p></div>\n\n<div class="stanza"><p>Quali ne la tristizia di Ligurgo</p>\n<p>si fer due figli a riveder la madre,</p>\n<p>tal mi fec&rsquo; io, ma non a tanto insurgo,</p></div>\n\n<div class="stanza"><p>quand&rsquo; io odo nomar s&eacute; stesso il padre</p>\n<p>mio e de li altri miei miglior che mai</p>\n<p>rime d&rsquo;amore usar dolci e leggiadre;</p></div>\n\n<div class="stanza"><p>e sanza udire e dir pensoso andai</p>\n<p>lunga f&iuml;ata rimirando lui,</p>\n<p>n&eacute;, per lo foco, in l&agrave; pi&ugrave; m&rsquo;appressai.</p></div>\n\n<div class="stanza"><p>Poi che di riguardar pasciuto fui,</p>\n<p>tutto m&rsquo;offersi pronto al suo servigio</p>\n<p>con l&rsquo;affermar che fa credere altrui.</p></div>\n\n<div class="stanza"><p>Ed elli a me: &laquo;Tu lasci tal vestigio,</p>\n<p>per quel ch&rsquo;i&rsquo; odo, in me, e tanto chiaro,</p>\n<p>che Let&egrave; nol pu&ograve; t&ograve;rre n&eacute; far bigio.</p></div>\n\n<div class="stanza"><p>Ma se le tue parole or ver giuraro,</p>\n<p>dimmi che &egrave; cagion per che dimostri</p>\n<p>nel dire e nel guardar d&rsquo;avermi caro&raquo;.</p></div>\n\n<div class="stanza"><p>E io a lui: &laquo;Li dolci detti vostri,</p>\n<p>che, quanto durer&agrave; l&rsquo;uso moderno,</p>\n<p>faranno cari ancora i loro incostri&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;O frate&raquo;, disse, &laquo;questi ch&rsquo;io ti cerno</p>\n<p>col dito&raquo;, e addit&ograve; un spirto innanzi,</p>\n<p>&laquo;fu miglior fabbro del parlar materno.</p></div>\n\n<div class="stanza"><p>Versi d&rsquo;amore e prose di romanzi</p>\n<p>soverchi&ograve; tutti; e lascia dir li stolti</p>\n<p>che quel di Lemos&igrave; credon ch&rsquo;avanzi.</p></div>\n\n<div class="stanza"><p>A voce pi&ugrave; ch&rsquo;al ver drizzan li volti,</p>\n<p>e cos&igrave; ferman sua oppin&iuml;one</p>\n<p>prima ch&rsquo;arte o ragion per lor s&rsquo;ascolti.</p></div>\n\n<div class="stanza"><p>Cos&igrave; fer molti antichi di Guittone,</p>\n<p>di grido in grido pur lui dando pregio,</p>\n<p>fin che l&rsquo;ha vinto il ver con pi&ugrave; persone.</p></div>\n\n<div class="stanza"><p>Or se tu hai s&igrave; ampio privilegio,</p>\n<p>che licito ti sia l&rsquo;andare al chiostro</p>\n<p>nel quale &egrave; Cristo abate del collegio,</p></div>\n\n<div class="stanza"><p>falli per me un dir d&rsquo;un paternostro,</p>\n<p>quanto bisogna a noi di questo mondo,</p>\n<p>dove poter peccar non &egrave; pi&ugrave; nostro&raquo;.</p></div>\n\n<div class="stanza"><p>Poi, forse per dar luogo altrui secondo</p>\n<p>che presso avea, disparve per lo foco,</p>\n<p>come per l&rsquo;acqua il pesce andando al fondo.</p></div>\n\n<div class="stanza"><p>Io mi fei al mostrato innanzi un poco,</p>\n<p>e dissi ch&rsquo;al suo nome il mio disire</p>\n<p>apparecchiava graz&iuml;oso loco.</p></div>\n\n<div class="stanza"><p>El cominci&ograve; liberamente a dire:</p>\n<p>&laquo;Tan m&rsquo;abellis vostre cortes deman,</p>\n<p>qu&rsquo;ieu no me puesc ni voill a vos cobrire.</p></div>\n\n<div class="stanza"><p>Ieu sui Arnaut, que plor e vau cantan;</p>\n<p>consiros vei la passada folor,</p>\n<p>e vei jausen lo joi qu&rsquo;esper, denan.</p></div>\n\n<div class="stanza"><p>Ara vos prec, per aquella valor</p>\n<p>que vos guida al som de l&rsquo;escalina,</p>\n<p>sovenha vos a temps de ma dolor!&raquo;.</p></div>\n\n<div class="stanza"><p>Poi s&rsquo;ascose nel foco che li affina.</p></div>','<p class="cantohead">Canto XXVII</p>\n\n<div class="stanza"><p>S&igrave; come quando i primi raggi vibra</p>\n<p>l&agrave; dove il suo fattor lo sangue sparse,</p>\n<p>cadendo Ibero sotto l&rsquo;alta Libra,</p></div>\n\n<div class="stanza"><p>e l&rsquo;onde in Gange da nona r&iuml;arse,</p>\n<p>s&igrave; stava il sole; onde &rsquo;l giorno sen giva,</p>\n<p>come l&rsquo;angel di Dio lieto ci apparse.</p></div>\n\n<div class="stanza"><p>Fuor de la fiamma stava in su la riva,</p>\n<p>e cantava &lsquo;Beati mundo corde!&rsquo;</p>\n<p>in voce assai pi&ugrave; che la nostra viva.</p></div>\n\n<div class="stanza"><p>Poscia &laquo;Pi&ugrave; non si va, se pria non morde,</p>\n<p>anime sante, il foco: intrate in esso,</p>\n<p>e al cantar di l&agrave; non siate sorde&raquo;,</p></div>\n\n<div class="stanza"><p>ci disse come noi li fummo presso;</p>\n<p>per ch&rsquo;io divenni tal, quando lo &rsquo;ntesi,</p>\n<p>qual &egrave; colui che ne la fossa &egrave; messo.</p></div>\n\n<div class="stanza"><p>In su le man commesse mi protesi,</p>\n<p>guardando il foco e imaginando forte</p>\n<p>umani corpi gi&agrave; veduti accesi.</p></div>\n\n<div class="stanza"><p>Volsersi verso me le buone scorte;</p>\n<p>e Virgilio mi disse: &laquo;Figliuol mio,</p>\n<p>qui pu&ograve; esser tormento, ma non morte.</p></div>\n\n<div class="stanza"><p>Ricorditi, ricorditi! E se io</p>\n<p>sovresso Ger&iuml;on ti guidai salvo,</p>\n<p>che far&ograve; ora presso pi&ugrave; a Dio?</p></div>\n\n<div class="stanza"><p>Credi per certo che se dentro a l&rsquo;alvo</p>\n<p>di questa fiamma stessi ben mille anni,</p>\n<p>non ti potrebbe far d&rsquo;un capel calvo.</p></div>\n\n<div class="stanza"><p>E se tu forse credi ch&rsquo;io t&rsquo;inganni,</p>\n<p>fatti ver&rsquo; lei, e fatti far credenza</p>\n<p>con le tue mani al lembo d&rsquo;i tuoi panni.</p></div>\n\n<div class="stanza"><p>Pon gi&ugrave; omai, pon gi&ugrave; ogne temenza;</p>\n<p>volgiti in qua e vieni: entra sicuro!&raquo;.</p>\n<p>E io pur fermo e contra cosc&iuml;enza.</p></div>\n\n<div class="stanza"><p>Quando mi vide star pur fermo e duro,</p>\n<p>turbato un poco disse: &laquo;Or vedi, figlio:</p>\n<p>tra B&euml;atrice e te &egrave; questo muro&raquo;.</p></div>\n\n<div class="stanza"><p>Come al nome di Tisbe aperse il ciglio</p>\n<p>Piramo in su la morte, e riguardolla,</p>\n<p>allor che &rsquo;l gelso divent&ograve; vermiglio;</p></div>\n\n<div class="stanza"><p>cos&igrave;, la mia durezza fatta solla,</p>\n<p>mi volsi al savio duca, udendo il nome</p>\n<p>che ne la mente sempre mi rampolla.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ei croll&ograve; la fronte e disse: &laquo;Come!</p>\n<p>volenci star di qua?&raquo;; indi sorrise</p>\n<p>come al fanciul si fa ch&rsquo;&egrave; vinto al pome.</p></div>\n\n<div class="stanza"><p>Poi dentro al foco innanzi mi si mise,</p>\n<p>pregando Stazio che venisse retro,</p>\n<p>che pria per lunga strada ci divise.</p></div>\n\n<div class="stanza"><p>S&igrave; com&rsquo; fui dentro, in un bogliente vetro</p>\n<p>gittato mi sarei per rinfrescarmi,</p>\n<p>tant&rsquo; era ivi lo &rsquo;ncendio sanza metro.</p></div>\n\n<div class="stanza"><p>Lo dolce padre mio, per confortarmi,</p>\n<p>pur di Beatrice ragionando andava,</p>\n<p>dicendo: &laquo;Li occhi suoi gi&agrave; veder parmi&raquo;.</p></div>\n\n<div class="stanza"><p>Guidavaci una voce che cantava</p>\n<p>di l&agrave;; e noi, attenti pur a lei,</p>\n<p>venimmo fuor l&agrave; ove si montava.</p></div>\n\n<div class="stanza"><p>&lsquo;Venite, benedicti Patris mei&rsquo;,</p>\n<p>son&ograve; dentro a un lume che l&igrave; era,</p>\n<p>tal che mi vinse e guardar nol potei.</p></div>\n\n<div class="stanza"><p>&laquo;Lo sol sen va&raquo;, soggiunse, &laquo;e vien la sera;</p>\n<p>non v&rsquo;arrestate, ma studiate il passo,</p>\n<p>mentre che l&rsquo;occidente non si annera&raquo;.</p></div>\n\n<div class="stanza"><p>Dritta salia la via per entro &rsquo;l sasso</p>\n<p>verso tal parte ch&rsquo;io toglieva i raggi</p>\n<p>dinanzi a me del sol ch&rsquo;era gi&agrave; basso.</p></div>\n\n<div class="stanza"><p>E di pochi scaglion levammo i saggi,</p>\n<p>che &rsquo;l sol corcar, per l&rsquo;ombra che si spense,</p>\n<p>sentimmo dietro e io e li miei saggi.</p></div>\n\n<div class="stanza"><p>E pria che &rsquo;n tutte le sue parti immense</p>\n<p>fosse orizzonte fatto d&rsquo;uno aspetto,</p>\n<p>e notte avesse tutte sue dispense,</p></div>\n\n<div class="stanza"><p>ciascun di noi d&rsquo;un grado fece letto;</p>\n<p>ch&eacute; la natura del monte ci affranse</p>\n<p>la possa del salir pi&ugrave; e &rsquo;l diletto.</p></div>\n\n<div class="stanza"><p>Quali si stanno ruminando manse</p>\n<p>le capre, state rapide e proterve</p>\n<p>sovra le cime avante che sien pranse,</p></div>\n\n<div class="stanza"><p>tacite a l&rsquo;ombra, mentre che &rsquo;l sol ferve,</p>\n<p>guardate dal pastor, che &rsquo;n su la verga</p>\n<p>poggiato s&rsquo;&egrave; e lor di posa serve;</p></div>\n\n<div class="stanza"><p>e quale il mandr&iuml;an che fori alberga,</p>\n<p>lungo il pecuglio suo queto pernotta,</p>\n<p>guardando perch&eacute; fiera non lo sperga;</p></div>\n\n<div class="stanza"><p>tali eravamo tutti e tre allotta,</p>\n<p>io come capra, ed ei come pastori,</p>\n<p>fasciati quinci e quindi d&rsquo;alta grotta.</p></div>\n\n<div class="stanza"><p>Poco parer potea l&igrave; del di fori;</p>\n<p>ma, per quel poco, vedea io le stelle</p>\n<p>di lor solere e pi&ugrave; chiare e maggiori.</p></div>\n\n<div class="stanza"><p>S&igrave; ruminando e s&igrave; mirando in quelle,</p>\n<p>mi prese il sonno; il sonno che sovente,</p>\n<p>anzi che &rsquo;l fatto sia, sa le novelle.</p></div>\n\n<div class="stanza"><p>Ne l&rsquo;ora, credo, che de l&rsquo;or&iuml;ente</p>\n<p>prima raggi&ograve; nel monte Citerea,</p>\n<p>che di foco d&rsquo;amor par sempre ardente,</p></div>\n\n<div class="stanza"><p>giovane e bella in sogno mi parea</p>\n<p>donna vedere andar per una landa</p>\n<p>cogliendo fiori; e cantando dicea:</p></div>\n\n<div class="stanza"><p>&laquo;Sappia qualunque il mio nome dimanda</p>\n<p>ch&rsquo;i&rsquo; mi son Lia, e vo movendo intorno</p>\n<p>le belle mani a farmi una ghirlanda.</p></div>\n\n<div class="stanza"><p>Per piacermi a lo specchio, qui m&rsquo;addorno;</p>\n<p>ma mia suora Rachel mai non si smaga</p>\n<p>dal suo miraglio, e siede tutto giorno.</p></div>\n\n<div class="stanza"><p>Ell&rsquo; &egrave; d&rsquo;i suoi belli occhi veder vaga</p>\n<p>com&rsquo; io de l&rsquo;addornarmi con le mani;</p>\n<p>lei lo vedere, e me l&rsquo;ovrare appaga&raquo;.</p></div>\n\n<div class="stanza"><p>E gi&agrave; per li splendori antelucani,</p>\n<p>che tanto a&rsquo; pellegrin surgon pi&ugrave; grati,</p>\n<p>quanto, tornando, albergan men lontani,</p></div>\n\n<div class="stanza"><p>le tenebre fuggian da tutti lati,</p>\n<p>e &rsquo;l sonno mio con esse; ond&rsquo; io leva&rsquo;mi,</p>\n<p>veggendo i gran maestri gi&agrave; levati.</p></div>\n\n<div class="stanza"><p>&laquo;Quel dolce pome che per tanti rami</p>\n<p>cercando va la cura de&rsquo; mortali,</p>\n<p>oggi porr&agrave; in pace le tue fami&raquo;.</p></div>\n\n<div class="stanza"><p>Virgilio inverso me queste cotali</p>\n<p>parole us&ograve;; e mai non furo strenne</p>\n<p>che fosser di piacere a queste iguali.</p></div>\n\n<div class="stanza"><p>Tanto voler sopra voler mi venne</p>\n<p>de l&rsquo;esser s&ugrave;, ch&rsquo;ad ogne passo poi</p>\n<p>al volo mi sentia crescer le penne.</p></div>\n\n<div class="stanza"><p>Come la scala tutta sotto noi</p>\n<p>fu corsa e fummo in su &rsquo;l grado superno,</p>\n<p>in me ficc&ograve; Virgilio li occhi suoi,</p></div>\n\n<div class="stanza"><p>e disse: &laquo;Il temporal foco e l&rsquo;etterno</p>\n<p>veduto hai, figlio; e se&rsquo; venuto in parte</p>\n<p>dov&rsquo; io per me pi&ugrave; oltre non discerno.</p></div>\n\n<div class="stanza"><p>Tratto t&rsquo;ho qui con ingegno e con arte;</p>\n<p>lo tuo piacere omai prendi per duce;</p>\n<p>fuor se&rsquo; de l&rsquo;erte vie, fuor se&rsquo; de l&rsquo;arte.</p></div>\n\n<div class="stanza"><p>Vedi lo sol che &rsquo;n fronte ti riluce;</p>\n<p>vedi l&rsquo;erbette, i fiori e li arbuscelli</p>\n<p>che qui la terra sol da s&eacute; produce.</p></div>\n\n<div class="stanza"><p>Mentre che vegnan lieti li occhi belli</p>\n<p>che, lagrimando, a te venir mi fenno,</p>\n<p>seder ti puoi e puoi andar tra elli.</p></div>\n\n<div class="stanza"><p>Non aspettar mio dir pi&ugrave; n&eacute; mio cenno;</p>\n<p>libero, dritto e sano &egrave; tuo arbitrio,</p>\n<p>e fallo fora non fare a suo senno:</p></div>\n\n<div class="stanza"><p>per ch&rsquo;io te sovra te corono e mitrio&raquo;.</p></div>','<p class="cantohead">Canto XXVIII</p>\n\n<div class="stanza"><p>Vago gi&agrave; di cercar dentro e dintorno</p>\n<p>la divina foresta spessa e viva,</p>\n<p>ch&rsquo;a li occhi temperava il novo giorno,</p></div>\n\n<div class="stanza"><p>sanza pi&ugrave; aspettar, lasciai la riva,</p>\n<p>prendendo la campagna lento lento</p>\n<p>su per lo suol che d&rsquo;ogne parte auliva.</p></div>\n\n<div class="stanza"><p>Un&rsquo;aura dolce, sanza mutamento</p>\n<p>avere in s&eacute;, mi feria per la fronte</p>\n<p>non di pi&ugrave; colpo che soave vento;</p></div>\n\n<div class="stanza"><p>per cui le fronde, tremolando, pronte</p>\n<p>tutte quante piegavano a la parte</p>\n<p>u&rsquo; la prim&rsquo; ombra gitta il santo monte;</p></div>\n\n<div class="stanza"><p>non per&ograve; dal loro esser dritto sparte</p>\n<p>tanto, che li augelletti per le cime</p>\n<p>lasciasser d&rsquo;operare ogne lor arte;</p></div>\n\n<div class="stanza"><p>ma con piena letizia l&rsquo;ore prime,</p>\n<p>cantando, ricevieno intra le foglie,</p>\n<p>che tenevan bordone a le sue rime,</p></div>\n\n<div class="stanza"><p>tal qual di ramo in ramo si raccoglie</p>\n<p>per la pineta in su &rsquo;l lito di Chiassi,</p>\n<p>quand&rsquo; &euml;olo scilocco fuor discioglie.</p></div>\n\n<div class="stanza"><p>Gi&agrave; m&rsquo;avean trasportato i lenti passi</p>\n<p>dentro a la selva antica tanto, ch&rsquo;io</p>\n<p>non potea rivedere ond&rsquo; io mi &rsquo;ntrassi;</p></div>\n\n<div class="stanza"><p>ed ecco pi&ugrave; andar mi tolse un rio,</p>\n<p>che &rsquo;nver&rsquo; sinistra con sue picciole onde</p>\n<p>piegava l&rsquo;erba che &rsquo;n sua ripa usc&igrave;o.</p></div>\n\n<div class="stanza"><p>Tutte l&rsquo;acque che son di qua pi&ugrave; monde,</p>\n<p>parrieno avere in s&eacute; mistura alcuna</p>\n<p>verso di quella, che nulla nasconde,</p></div>\n\n<div class="stanza"><p>avvegna che si mova bruna bruna</p>\n<p>sotto l&rsquo;ombra perpet&uuml;a, che mai</p>\n<p>raggiar non lascia sole ivi n&eacute; luna.</p></div>\n\n<div class="stanza"><p>Coi pi&egrave; ristetti e con li occhi passai</p>\n<p>di l&agrave; dal fiumicello, per mirare</p>\n<p>la gran var&iuml;azion d&rsquo;i freschi mai;</p></div>\n\n<div class="stanza"><p>e l&agrave; m&rsquo;apparve, s&igrave; com&rsquo; elli appare</p>\n<p>subitamente cosa che disvia</p>\n<p>per maraviglia tutto altro pensare,</p></div>\n\n<div class="stanza"><p>una donna soletta che si gia</p>\n<p>e cantando e scegliendo fior da fiore</p>\n<p>ond&rsquo; era pinta tutta la sua via.</p></div>\n\n<div class="stanza"><p>&laquo;Deh, bella donna, che a&rsquo; raggi d&rsquo;amore</p>\n<p>ti scaldi, s&rsquo;i&rsquo; vo&rsquo; credere a&rsquo; sembianti</p>\n<p>che soglion esser testimon del core,</p></div>\n\n<div class="stanza"><p>vegnati in voglia di trarreti avanti&raquo;,</p>\n<p>diss&rsquo; io a lei, &laquo;verso questa rivera,</p>\n<p>tanto ch&rsquo;io possa intender che tu canti.</p></div>\n\n<div class="stanza"><p>Tu mi fai rimembrar dove e qual era</p>\n<p>Proserpina nel tempo che perdette</p>\n<p>la madre lei, ed ella primavera&raquo;.</p></div>\n\n<div class="stanza"><p>Come si volge, con le piante strette</p>\n<p>a terra e intra s&eacute;, donna che balli,</p>\n<p>e piede innanzi piede a pena mette,</p></div>\n\n<div class="stanza"><p>volsesi in su i vermigli e in su i gialli</p>\n<p>fioretti verso me, non altrimenti</p>\n<p>che vergine che li occhi onesti avvalli;</p></div>\n\n<div class="stanza"><p>e fece i prieghi miei esser contenti,</p>\n<p>s&igrave; appressando s&eacute;, che &rsquo;l dolce suono</p>\n<p>veniva a me co&rsquo; suoi intendimenti.</p></div>\n\n<div class="stanza"><p>Tosto che fu l&agrave; dove l&rsquo;erbe sono</p>\n<p>bagnate gi&agrave; da l&rsquo;onde del bel fiume,</p>\n<p>di levar li occhi suoi mi fece dono.</p></div>\n\n<div class="stanza"><p>Non credo che splendesse tanto lume</p>\n<p>sotto le ciglia a Venere, trafitta</p>\n<p>dal figlio fuor di tutto suo costume.</p></div>\n\n<div class="stanza"><p>Ella ridea da l&rsquo;altra riva dritta,</p>\n<p>trattando pi&ugrave; color con le sue mani,</p>\n<p>che l&rsquo;alta terra sanza seme gitta.</p></div>\n\n<div class="stanza"><p>Tre passi ci facea il fiume lontani;</p>\n<p>ma Elesponto, l&agrave; &rsquo;ve pass&ograve; Serse,</p>\n<p>ancora freno a tutti orgogli umani,</p></div>\n\n<div class="stanza"><p>pi&ugrave; odio da Leandro non sofferse</p>\n<p>per mareggiare intra Sesto e Abido,</p>\n<p>che quel da me perch&rsquo; allor non s&rsquo;aperse.</p></div>\n\n<div class="stanza"><p>&laquo;Voi siete nuovi, e forse perch&rsquo; io rido&raquo;,</p>\n<p>cominci&ograve; ella, &laquo;in questo luogo eletto</p>\n<p>a l&rsquo;umana natura per suo nido,</p></div>\n\n<div class="stanza"><p>maravigliando tienvi alcun sospetto;</p>\n<p>ma luce rende il salmo Delectasti,</p>\n<p>che puote disnebbiar vostro intelletto.</p></div>\n\n<div class="stanza"><p>E tu che se&rsquo; dinanzi e mi pregasti,</p>\n<p>d&igrave; s&rsquo;altro vuoli udir; ch&rsquo;i&rsquo; venni presta</p>\n<p>ad ogne tua question tanto che basti&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;L&rsquo;acqua&raquo;, diss&rsquo; io, &laquo;e &rsquo;l suon de la foresta</p>\n<p>impugnan dentro a me novella fede</p>\n<p>di cosa ch&rsquo;io udi&rsquo; contraria a questa&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ella: &laquo;Io dicer&ograve; come procede</p>\n<p>per sua cagion ci&ograve; ch&rsquo;ammirar ti face,</p>\n<p>e purgher&ograve; la nebbia che ti fiede.</p></div>\n\n<div class="stanza"><p>Lo sommo Ben, che solo esso a s&eacute; piace,</p>\n<p>f&eacute; l&rsquo;uom buono e a bene, e questo loco</p>\n<p>diede per arr&rsquo; a lui d&rsquo;etterna pace.</p></div>\n\n<div class="stanza"><p>Per sua difalta qui dimor&ograve; poco;</p>\n<p>per sua difalta in pianto e in affanno</p>\n<p>cambi&ograve; onesto riso e dolce gioco.</p></div>\n\n<div class="stanza"><p>Perch&eacute; &rsquo;l turbar che sotto da s&eacute; fanno</p>\n<p>l&rsquo;essalazion de l&rsquo;acqua e de la terra,</p>\n<p>che quanto posson dietro al calor vanno,</p></div>\n\n<div class="stanza"><p>a l&rsquo;uomo non facesse alcuna guerra,</p>\n<p>questo monte sal&igrave;o verso &rsquo;l ciel tanto,</p>\n<p>e libero n&rsquo;&egrave; d&rsquo;indi ove si serra.</p></div>\n\n<div class="stanza"><p>Or perch&eacute; in circuito tutto quanto</p>\n<p>l&rsquo;aere si volge con la prima volta,</p>\n<p>se non li &egrave; rotto il cerchio d&rsquo;alcun canto,</p></div>\n\n<div class="stanza"><p>in questa altezza ch&rsquo;&egrave; tutta disciolta</p>\n<p>ne l&rsquo;aere vivo, tal moto percuote,</p>\n<p>e fa sonar la selva perch&rsquo; &egrave; folta;</p></div>\n\n<div class="stanza"><p>e la percossa pianta tanto puote,</p>\n<p>che de la sua virtute l&rsquo;aura impregna</p>\n<p>e quella poi, girando, intorno scuote;</p></div>\n\n<div class="stanza"><p>e l&rsquo;altra terra, secondo ch&rsquo;&egrave; degna</p>\n<p>per s&eacute; e per suo ciel, concepe e figlia</p>\n<p>di diverse virt&ugrave; diverse legna.</p></div>\n\n<div class="stanza"><p>Non parrebbe di l&agrave; poi maraviglia,</p>\n<p>udito questo, quando alcuna pianta</p>\n<p>sanza seme palese vi s&rsquo;appiglia.</p></div>\n\n<div class="stanza"><p>E saper dei che la campagna santa</p>\n<p>dove tu se&rsquo;, d&rsquo;ogne semenza &egrave; piena,</p>\n<p>e frutto ha in s&eacute; che di l&agrave; non si schianta.</p></div>\n\n<div class="stanza"><p>L&rsquo;acqua che vedi non surge di vena</p>\n<p>che ristori vapor che gel converta,</p>\n<p>come fiume ch&rsquo;acquista e perde lena;</p></div>\n\n<div class="stanza"><p>ma esce di fontana salda e certa,</p>\n<p>che tanto dal voler di Dio riprende,</p>\n<p>quant&rsquo; ella versa da due parti aperta.</p></div>\n\n<div class="stanza"><p>Da questa parte con virt&ugrave; discende</p>\n<p>che toglie altrui memoria del peccato;</p>\n<p>da l&rsquo;altra d&rsquo;ogne ben fatto la rende.</p></div>\n\n<div class="stanza"><p>Quinci Let&egrave;; cos&igrave; da l&rsquo;altro lato</p>\n<p>E&uuml;no&egrave; si chiama, e non adopra</p>\n<p>se quinci e quindi pria non &egrave; gustato:</p></div>\n\n<div class="stanza"><p>a tutti altri sapori esto &egrave; di sopra.</p>\n<p>E avvegna ch&rsquo;assai possa esser sazia</p>\n<p>la sete tua perch&rsquo; io pi&ugrave; non ti scuopra,</p></div>\n\n<div class="stanza"><p>darotti un corollario ancor per grazia;</p>\n<p>n&eacute; credo che &rsquo;l mio dir ti sia men caro,</p>\n<p>se oltre promession teco si spazia.</p></div>\n\n<div class="stanza"><p>Quelli ch&rsquo;anticamente poetaro</p>\n<p>l&rsquo;et&agrave; de l&rsquo;oro e suo stato felice,</p>\n<p>forse in Parnaso esto loco sognaro.</p></div>\n\n<div class="stanza"><p>Qui fu innocente l&rsquo;umana radice;</p>\n<p>qui primavera sempre e ogne frutto;</p>\n<p>nettare &egrave; questo di che ciascun dice&raquo;.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi &rsquo;n dietro allora tutto</p>\n<p>a&rsquo; miei poeti, e vidi che con riso</p>\n<p>udito av&euml;an l&rsquo;ultimo costrutto;</p></div>\n\n<div class="stanza"><p>poi a la bella donna torna&rsquo; il viso.</p></div>','<p class="cantohead">Canto XXIX</p>\n\n<div class="stanza"><p>Cantando come donna innamorata,</p>\n<p>contin&uuml;&ograve; col fin di sue parole:</p>\n<p>&lsquo;Beati quorum tecta sunt peccata!&rsquo;.</p></div>\n\n<div class="stanza"><p>E come ninfe che si givan sole</p>\n<p>per le salvatiche ombre, dis&iuml;ando</p>\n<p>qual di veder, qual di fuggir lo sole,</p></div>\n\n<div class="stanza"><p>allor si mosse contra &rsquo;l fiume, andando</p>\n<p>su per la riva; e io pari di lei,</p>\n<p>picciol passo con picciol seguitando.</p></div>\n\n<div class="stanza"><p>Non eran cento tra &rsquo; suoi passi e &rsquo; miei,</p>\n<p>quando le ripe igualmente dier volta,</p>\n<p>per modo ch&rsquo;a levante mi rendei.</p></div>\n\n<div class="stanza"><p>N&eacute; ancor fu cos&igrave; nostra via molta,</p>\n<p>quando la donna tutta a me si torse,</p>\n<p>dicendo: &laquo;Frate mio, guarda e ascolta&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ecco un lustro s&ugrave;bito trascorse</p>\n<p>da tutte parti per la gran foresta,</p>\n<p>tal che di balenar mi mise in forse.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; &rsquo;l balenar, come vien, resta,</p>\n<p>e quel, durando, pi&ugrave; e pi&ugrave; splendeva,</p>\n<p>nel mio pensier dicea: &lsquo;Che cosa &egrave; questa?&rsquo;.</p></div>\n\n<div class="stanza"><p>E una melodia dolce correva</p>\n<p>per l&rsquo;aere luminoso; onde buon zelo</p>\n<p>mi f&eacute; riprender l&rsquo;ardimento d&rsquo;Eva,</p></div>\n\n<div class="stanza"><p>che l&agrave; dove ubidia la terra e &rsquo;l cielo,</p>\n<p>femmina, sola e pur test&eacute; formata,</p>\n<p>non sofferse di star sotto alcun velo;</p></div>\n\n<div class="stanza"><p>sotto &rsquo;l qual se divota fosse stata,</p>\n<p>avrei quelle ineffabili delizie</p>\n<p>sentite prima e pi&ugrave; lunga f&iuml;ata.</p></div>\n\n<div class="stanza"><p>Mentr&rsquo; io m&rsquo;andava tra tante primizie</p>\n<p>de l&rsquo;etterno piacer tutto sospeso,</p>\n<p>e dis&iuml;oso ancora a pi&ugrave; letizie,</p></div>\n\n<div class="stanza"><p>dinanzi a noi, tal quale un foco acceso,</p>\n<p>ci si f&eacute; l&rsquo;aere sotto i verdi rami;</p>\n<p>e &rsquo;l dolce suon per canti era gi&agrave; inteso.</p></div>\n\n<div class="stanza"><p>O sacrosante Vergini, se fami,</p>\n<p>freddi o vigilie mai per voi soffersi,</p>\n<p>cagion mi sprona ch&rsquo;io merc&eacute; vi chiami.</p></div>\n\n<div class="stanza"><p>Or convien che Elicona per me versi,</p>\n<p>e Uran&igrave;e m&rsquo;aiuti col suo coro</p>\n<p>forti cose a pensar mettere in versi.</p></div>\n\n<div class="stanza"><p>Poco pi&ugrave; oltre, sette alberi d&rsquo;oro</p>\n<p>falsava nel parere il lungo tratto</p>\n<p>del mezzo ch&rsquo;era ancor tra noi e loro;</p></div>\n\n<div class="stanza"><p>ma quand&rsquo; i&rsquo; fui s&igrave; presso di lor fatto,</p>\n<p>che l&rsquo;obietto comun, che &rsquo;l senso inganna,</p>\n<p>non perdea per distanza alcun suo atto,</p></div>\n\n<div class="stanza"><p>la virt&ugrave; ch&rsquo;a ragion discorso ammanna,</p>\n<p>s&igrave; com&rsquo; elli eran candelabri apprese,</p>\n<p>e ne le voci del cantare &lsquo;Osanna&rsquo;.</p></div>\n\n<div class="stanza"><p>Di sopra fiammeggiava il bello arnese</p>\n<p>pi&ugrave; chiaro assai che luna per sereno</p>\n<p>di mezza notte nel suo mezzo mese.</p></div>\n\n<div class="stanza"><p>Io mi rivolsi d&rsquo;ammirazion pieno</p>\n<p>al buon Virgilio, ed esso mi rispuose</p>\n<p>con vista carca di stupor non meno.</p></div>\n\n<div class="stanza"><p>Indi rendei l&rsquo;aspetto a l&rsquo;alte cose</p>\n<p>che si movieno incontr&rsquo; a noi s&igrave; tardi,</p>\n<p>che foran vinte da novelle spose.</p></div>\n\n<div class="stanza"><p>La donna mi sgrid&ograve;: &laquo;Perch&eacute; pur ardi</p>\n<p>s&igrave; ne l&rsquo;affetto de le vive luci,</p>\n<p>e ci&ograve; che vien di retro a lor non guardi?&raquo;.</p></div>\n\n<div class="stanza"><p>Genti vid&rsquo; io allor, come a lor duci,</p>\n<p>venire appresso, vestite di bianco;</p>\n<p>e tal candor di qua gi&agrave; mai non fuci.</p></div>\n\n<div class="stanza"><p>L&rsquo;acqua imprend&euml;a dal sinistro fianco,</p>\n<p>e rendea me la mia sinistra costa,</p>\n<p>s&rsquo;io riguardava in lei, come specchio anco.</p></div>\n\n<div class="stanza"><p>Quand&rsquo; io da la mia riva ebbi tal posta,</p>\n<p>che solo il fiume mi facea distante,</p>\n<p>per veder meglio ai passi diedi sosta,</p></div>\n\n<div class="stanza"><p>e vidi le fiammelle andar davante,</p>\n<p>lasciando dietro a s&eacute; l&rsquo;aere dipinto,</p>\n<p>e di tratti pennelli avean sembiante;</p></div>\n\n<div class="stanza"><p>s&igrave; che l&igrave; sopra rimanea distinto</p>\n<p>di sette liste, tutte in quei colori</p>\n<p>onde fa l&rsquo;arco il Sole e Delia il cinto.</p></div>\n\n<div class="stanza"><p>Questi ostendali in dietro eran maggiori</p>\n<p>che la mia vista; e, quanto a mio avviso,</p>\n<p>diece passi distavan quei di fori.</p></div>\n\n<div class="stanza"><p>Sotto cos&igrave; bel ciel com&rsquo; io diviso,</p>\n<p>ventiquattro seniori, a due a due,</p>\n<p>coronati venien di fiordaliso.</p></div>\n\n<div class="stanza"><p>Tutti cantavan: &laquo;Benedicta tue</p>\n<p>ne le figlie d&rsquo;Adamo, e benedette</p>\n<p>sieno in etterno le bellezze tue!&raquo;.</p></div>\n\n<div class="stanza"><p>Poscia che i fiori e l&rsquo;altre fresche erbette</p>\n<p>a rimpetto di me da l&rsquo;altra sponda</p>\n<p>libere fuor da quelle genti elette,</p></div>\n\n<div class="stanza"><p>s&igrave; come luce luce in ciel seconda,</p>\n<p>vennero appresso lor quattro animali,</p>\n<p>coronati ciascun di verde fronda.</p></div>\n\n<div class="stanza"><p>Ognuno era pennuto di sei ali;</p>\n<p>le penne piene d&rsquo;occhi; e li occhi d&rsquo;Argo,</p>\n<p>se fosser vivi, sarebber cotali.</p></div>\n\n<div class="stanza"><p>A descriver lor forme pi&ugrave; non spargo</p>\n<p>rime, lettor; ch&rsquo;altra spesa mi strigne,</p>\n<p>tanto ch&rsquo;a questa non posso esser largo;</p></div>\n\n<div class="stanza"><p>ma leggi Ezech&iuml;el, che li dipigne</p>\n<p>come li vide da la fredda parte</p>\n<p>venir con vento e con nube e con igne;</p></div>\n\n<div class="stanza"><p>e quali i troverai ne le sue carte,</p>\n<p>tali eran quivi, salvo ch&rsquo;a le penne</p>\n<p>Giovanni &egrave; meco e da lui si diparte.</p></div>\n\n<div class="stanza"><p>Lo spazio dentro a lor quattro contenne</p>\n<p>un carro, in su due rote, tr&iuml;unfale,</p>\n<p>ch&rsquo;al collo d&rsquo;un grifon tirato venne.</p></div>\n\n<div class="stanza"><p>Esso tendeva in s&ugrave; l&rsquo;una e l&rsquo;altra ale</p>\n<p>tra la mezzana e le tre e tre liste,</p>\n<p>s&igrave; ch&rsquo;a nulla, fendendo, facea male.</p></div>\n\n<div class="stanza"><p>Tanto salivan che non eran viste;</p>\n<p>le membra d&rsquo;oro avea quant&rsquo; era uccello,</p>\n<p>e bianche l&rsquo;altre, di vermiglio miste.</p></div>\n\n<div class="stanza"><p>Non che Roma di carro cos&igrave; bello</p>\n<p>rallegrasse Affricano, o vero Augusto,</p>\n<p>ma quel del Sol saria pover con ello;</p></div>\n\n<div class="stanza"><p>quel del Sol che, sv&iuml;ando, fu combusto</p>\n<p>per l&rsquo;orazion de la Terra devota,</p>\n<p>quando fu Giove arcanamente giusto.</p></div>\n\n<div class="stanza"><p>Tre donne in giro da la destra rota</p>\n<p>venian danzando; l&rsquo;una tanto rossa</p>\n<p>ch&rsquo;a pena fora dentro al foco nota;</p></div>\n\n<div class="stanza"><p>l&rsquo;altr&rsquo; era come se le carni e l&rsquo;ossa</p>\n<p>fossero state di smeraldo fatte;</p>\n<p>la terza parea neve test&eacute; mossa;</p></div>\n\n<div class="stanza"><p>e or par&euml;an da la bianca tratte,</p>\n<p>or da la rossa; e dal canto di questa</p>\n<p>l&rsquo;altre toglien l&rsquo;andare e tarde e ratte.</p></div>\n\n<div class="stanza"><p>Da la sinistra quattro facean festa,</p>\n<p>in porpore vestite, dietro al modo</p>\n<p>d&rsquo;una di lor ch&rsquo;avea tre occhi in testa.</p></div>\n\n<div class="stanza"><p>Appresso tutto il pertrattato nodo</p>\n<p>vidi due vecchi in abito dispari,</p>\n<p>ma pari in atto e onesto e sodo.</p></div>\n\n<div class="stanza"><p>L&rsquo;un si mostrava alcun de&rsquo; famigliari</p>\n<p>di quel sommo Ipocr&agrave;te che natura</p>\n<p>a li animali f&eacute; ch&rsquo;ell&rsquo; ha pi&ugrave; cari;</p></div>\n\n<div class="stanza"><p>mostrava l&rsquo;altro la contraria cura</p>\n<p>con una spada lucida e aguta,</p>\n<p>tal che di qua dal rio mi f&eacute; paura.</p></div>\n\n<div class="stanza"><p>Poi vidi quattro in umile paruta;</p>\n<p>e di retro da tutti un vecchio solo</p>\n<p>venir, dormendo, con la faccia arguta.</p></div>\n\n<div class="stanza"><p>E questi sette col primaio stuolo</p>\n<p>erano abit&uuml;ati, ma di gigli</p>\n<p>dintorno al capo non fac&euml;an brolo,</p></div>\n\n<div class="stanza"><p>anzi di rose e d&rsquo;altri fior vermigli;</p>\n<p>giurato avria poco lontano aspetto</p>\n<p>che tutti ardesser di sopra da&rsquo; cigli.</p></div>\n\n<div class="stanza"><p>E quando il carro a me fu a rimpetto,</p>\n<p>un tuon s&rsquo;ud&igrave;, e quelle genti degne</p>\n<p>parvero aver l&rsquo;andar pi&ugrave; interdetto,</p></div>\n\n<div class="stanza"><p>fermandosi ivi con le prime insegne.</p></div>','<p class="cantohead">Canto XXX</p>\n\n<div class="stanza"><p>Quando il settentr&iuml;on del primo cielo,</p>\n<p>che n&eacute; occaso mai seppe n&eacute; orto</p>\n<p>n&eacute; d&rsquo;altra nebbia che di colpa velo,</p></div>\n\n<div class="stanza"><p>e che faceva l&igrave; ciascun accorto</p>\n<p>di suo dover, come &rsquo;l pi&ugrave; basso face</p>\n<p>qual temon gira per venire a porto,</p></div>\n\n<div class="stanza"><p>fermo s&rsquo;affisse: la gente verace,</p>\n<p>venuta prima tra &rsquo;l grifone ed esso,</p>\n<p>al carro volse s&eacute; come a sua pace;</p></div>\n\n<div class="stanza"><p>e un di loro, quasi da ciel messo,</p>\n<p>&lsquo;Veni, sponsa, de Libano&rsquo; cantando</p>\n<p>grid&ograve; tre volte, e tutti li altri appresso.</p></div>\n\n<div class="stanza"><p>Quali i beati al novissimo bando</p>\n<p>surgeran presti ognun di sua caverna,</p>\n<p>la revestita voce alleluiando,</p></div>\n\n<div class="stanza"><p>cotali in su la divina basterna</p>\n<p>si levar cento, ad vocem tanti senis,</p>\n<p>ministri e messaggier di vita etterna.</p></div>\n\n<div class="stanza"><p>Tutti dicean: &lsquo;Benedictus qui venis!&rsquo;,</p>\n<p>e fior gittando e di sopra e dintorno,</p>\n<p>&lsquo;Manibus, oh, date lil&iuml;a plenis!&rsquo;.</p></div>\n\n<div class="stanza"><p>Io vidi gi&agrave; nel cominciar del giorno</p>\n<p>la parte or&iuml;ental tutta rosata,</p>\n<p>e l&rsquo;altro ciel di bel sereno addorno;</p></div>\n\n<div class="stanza"><p>e la faccia del sol nascere ombrata,</p>\n<p>s&igrave; che per temperanza di vapori</p>\n<p>l&rsquo;occhio la sostenea lunga f&iuml;ata:</p></div>\n\n<div class="stanza"><p>cos&igrave; dentro una nuvola di fiori</p>\n<p>che da le mani angeliche saliva</p>\n<p>e ricadeva in gi&ugrave; dentro e di fori,</p></div>\n\n<div class="stanza"><p>sovra candido vel cinta d&rsquo;uliva</p>\n<p>donna m&rsquo;apparve, sotto verde manto</p>\n<p>vestita di color di fiamma viva.</p></div>\n\n<div class="stanza"><p>E lo spirito mio, che gi&agrave; cotanto</p>\n<p>tempo era stato ch&rsquo;a la sua presenza</p>\n<p>non era di stupor, tremando, affranto,</p></div>\n\n<div class="stanza"><p>sanza de li occhi aver pi&ugrave; conoscenza,</p>\n<p>per occulta virt&ugrave; che da lei mosse,</p>\n<p>d&rsquo;antico amor sent&igrave; la gran potenza.</p></div>\n\n<div class="stanza"><p>Tosto che ne la vista mi percosse</p>\n<p>l&rsquo;alta virt&ugrave; che gi&agrave; m&rsquo;avea trafitto</p>\n<p>prima ch&rsquo;io fuor di p&uuml;erizia fosse,</p></div>\n\n<div class="stanza"><p>volsimi a la sinistra col respitto</p>\n<p>col quale il fantolin corre a la mamma</p>\n<p>quando ha paura o quando elli &egrave; afflitto,</p></div>\n\n<div class="stanza"><p>per dicere a Virgilio: &lsquo;Men che dramma</p>\n<p>di sangue m&rsquo;&egrave; rimaso che non tremi:</p>\n<p>conosco i segni de l&rsquo;antica fiamma&rsquo;.</p></div>\n\n<div class="stanza"><p>Ma Virgilio n&rsquo;avea lasciati scemi</p>\n<p>di s&eacute;, Virgilio dolcissimo patre,</p>\n<p>Virgilio a cui per mia salute die&rsquo;mi;</p></div>\n\n<div class="stanza"><p>n&eacute; quantunque perdeo l&rsquo;antica matre,</p>\n<p>valse a le guance nette di rugiada,</p>\n<p>che, lagrimando, non tornasser atre.</p></div>\n\n<div class="stanza"><p>&laquo;Dante, perch&eacute; Virgilio se ne vada,</p>\n<p>non pianger anco, non piangere ancora;</p>\n<p>ch&eacute; pianger ti conven per altra spada&raquo;.</p></div>\n\n<div class="stanza"><p>Quasi ammiraglio che in poppa e in prora</p>\n<p>viene a veder la gente che ministra</p>\n<p>per li altri legni, e a ben far l&rsquo;incora;</p></div>\n\n<div class="stanza"><p>in su la sponda del carro sinistra,</p>\n<p>quando mi volsi al suon del nome mio,</p>\n<p>che di necessit&agrave; qui si registra,</p></div>\n\n<div class="stanza"><p>vidi la donna che pria m&rsquo;appario</p>\n<p>velata sotto l&rsquo;angelica festa,</p>\n<p>drizzar li occhi ver&rsquo; me di qua dal rio.</p></div>\n\n<div class="stanza"><p>Tutto che &rsquo;l vel che le scendea di testa,</p>\n<p>cerchiato de le fronde di Minerva,</p>\n<p>non la lasciasse parer manifesta,</p></div>\n\n<div class="stanza"><p>regalmente ne l&rsquo;atto ancor proterva</p>\n<p>contin&uuml;&ograve; come colui che dice</p>\n<p>e &rsquo;l pi&ugrave; caldo parlar dietro reserva:</p></div>\n\n<div class="stanza"><p>&laquo;Guardaci ben! Ben son, ben son Beatrice.</p>\n<p>Come degnasti d&rsquo;accedere al monte?</p>\n<p>non sapei tu che qui &egrave; l&rsquo;uom felice?&raquo;.</p></div>\n\n<div class="stanza"><p>Li occhi mi cadder gi&ugrave; nel chiaro fonte;</p>\n<p>ma veggendomi in esso, i trassi a l&rsquo;erba,</p>\n<p>tanta vergogna mi grav&ograve; la fronte.</p></div>\n\n<div class="stanza"><p>Cos&igrave; la madre al figlio par superba,</p>\n<p>com&rsquo; ella parve a me; perch&eacute; d&rsquo;amaro</p>\n<p>sente il sapor de la pietade acerba.</p></div>\n\n<div class="stanza"><p>Ella si tacque; e li angeli cantaro</p>\n<p>di s&ugrave;bito &lsquo;In te, Domine, speravi&rsquo;;</p>\n<p>ma oltre &lsquo;pedes meos&rsquo; non passaro.</p></div>\n\n<div class="stanza"><p>S&igrave; come neve tra le vive travi</p>\n<p>per lo dosso d&rsquo;Italia si congela,</p>\n<p>soffiata e stretta da li venti schiavi,</p></div>\n\n<div class="stanza"><p>poi, liquefatta, in s&eacute; stessa trapela,</p>\n<p>pur che la terra che perde ombra spiri,</p>\n<p>s&igrave; che par foco fonder la candela;</p></div>\n\n<div class="stanza"><p>cos&igrave; fui sanza lagrime e sospiri</p>\n<p>anzi &rsquo;l cantar di quei che notan sempre</p>\n<p>dietro a le note de li etterni giri;</p></div>\n\n<div class="stanza"><p>ma poi che &rsquo;ntesi ne le dolci tempre</p>\n<p>lor compatire a me, par che se detto</p>\n<p>avesser: &lsquo;Donna, perch&eacute; s&igrave; lo stempre?&rsquo;,</p></div>\n\n<div class="stanza"><p>lo gel che m&rsquo;era intorno al cor ristretto,</p>\n<p>spirito e acqua fessi, e con angoscia</p>\n<p>de la bocca e de li occhi usc&igrave; del petto.</p></div>\n\n<div class="stanza"><p>Ella, pur ferma in su la detta coscia</p>\n<p>del carro stando, a le sustanze pie</p>\n<p>volse le sue parole cos&igrave; poscia:</p></div>\n\n<div class="stanza"><p>&laquo;Voi vigilate ne l&rsquo;etterno die,</p>\n<p>s&igrave; che notte n&eacute; sonno a voi non fura</p>\n<p>passo che faccia il secol per sue vie;</p></div>\n\n<div class="stanza"><p>onde la mia risposta &egrave; con pi&ugrave; cura</p>\n<p>che m&rsquo;intenda colui che di l&agrave; piagne,</p>\n<p>perch&eacute; sia colpa e duol d&rsquo;una misura.</p></div>\n\n<div class="stanza"><p>Non pur per ovra de le rote magne,</p>\n<p>che drizzan ciascun seme ad alcun fine</p>\n<p>secondo che le stelle son compagne,</p></div>\n\n<div class="stanza"><p>ma per larghezza di grazie divine,</p>\n<p>che s&igrave; alti vapori hanno a lor piova,</p>\n<p>che nostre viste l&agrave; non van vicine,</p></div>\n\n<div class="stanza"><p>questi fu tal ne la sua vita nova</p>\n<p>virt&uuml;almente, ch&rsquo;ogne abito destro</p>\n<p>fatto averebbe in lui mirabil prova.</p></div>\n\n<div class="stanza"><p>Ma tanto pi&ugrave; maligno e pi&ugrave; silvestro</p>\n<p>si fa &rsquo;l terren col mal seme e non c&oacute;lto,</p>\n<p>quant&rsquo; elli ha pi&ugrave; di buon vigor terrestro.</p></div>\n\n<div class="stanza"><p>Alcun tempo il sostenni col mio volto:</p>\n<p>mostrando li occhi giovanetti a lui,</p>\n<p>meco il menava in dritta parte v&ograve;lto.</p></div>\n\n<div class="stanza"><p>S&igrave; tosto come in su la soglia fui</p>\n<p>di mia seconda etade e mutai vita,</p>\n<p>questi si tolse a me, e diessi altrui.</p></div>\n\n<div class="stanza"><p>Quando di carne a spirto era salita,</p>\n<p>e bellezza e virt&ugrave; cresciuta m&rsquo;era,</p>\n<p>fu&rsquo; io a lui men cara e men gradita;</p></div>\n\n<div class="stanza"><p>e volse i passi suoi per via non vera,</p>\n<p>imagini di ben seguendo false,</p>\n<p>che nulla promession rendono intera.</p></div>\n\n<div class="stanza"><p>N&eacute; l&rsquo;impetrare ispirazion mi valse,</p>\n<p>con le quali e in sogno e altrimenti</p>\n<p>lo rivocai: s&igrave; poco a lui ne calse!</p></div>\n\n<div class="stanza"><p>Tanto gi&ugrave; cadde, che tutti argomenti</p>\n<p>a la salute sua eran gi&agrave; corti,</p>\n<p>fuor che mostrarli le perdute genti.</p></div>\n\n<div class="stanza"><p>Per questo visitai l&rsquo;uscio d&rsquo;i morti,</p>\n<p>e a colui che l&rsquo;ha qua s&ugrave; condotto,</p>\n<p>li prieghi miei, piangendo, furon porti.</p></div>\n\n<div class="stanza"><p>Alto fato di Dio sarebbe rotto,</p>\n<p>se Let&egrave; si passasse e tal vivanda</p>\n<p>fosse gustata sanza alcuno scotto</p></div>\n\n<div class="stanza"><p>di pentimento che lagrime spanda&raquo;.</p></div>','<p class="cantohead">Canto XXXI</p>\n\n<div class="stanza"><p>&laquo;O tu che se&rsquo; di l&agrave; dal fiume sacro&raquo;,</p>\n<p>volgendo suo parlare a me per punta,</p>\n<p>che pur per taglio m&rsquo;era paruto acro,</p></div>\n\n<div class="stanza"><p>ricominci&ograve;, seguendo sanza cunta,</p>\n<p>&laquo;d&igrave;, d&igrave; se questo &egrave; vero: a tanta accusa</p>\n<p>tua confession conviene esser congiunta&raquo;.</p></div>\n\n<div class="stanza"><p>Era la mia virt&ugrave; tanto confusa,</p>\n<p>che la voce si mosse, e pria si spense</p>\n<p>che da li organi suoi fosse dischiusa.</p></div>\n\n<div class="stanza"><p>Poco sofferse; poi disse: &laquo;Che pense?</p>\n<p>Rispondi a me; ch&eacute; le memorie triste</p>\n<p>in te non sono ancor da l&rsquo;acqua offense&raquo;.</p></div>\n\n<div class="stanza"><p>Confusione e paura insieme miste</p>\n<p>mi pinsero un tal &laquo;s&igrave;&raquo; fuor de la bocca,</p>\n<p>al quale intender fuor mestier le viste.</p></div>\n\n<div class="stanza"><p>Come balestro frange, quando scocca</p>\n<p>da troppa tesa, la sua corda e l&rsquo;arco,</p>\n<p>e con men foga l&rsquo;asta il segno tocca,</p></div>\n\n<div class="stanza"><p>s&igrave; scoppia&rsquo; io sottesso grave carco,</p>\n<p>fuori sgorgando lagrime e sospiri,</p>\n<p>e la voce allent&ograve; per lo suo varco.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; ella a me: &laquo;Per entro i mie&rsquo; disiri,</p>\n<p>che ti menavano ad amar lo bene</p>\n<p>di l&agrave; dal qual non &egrave; a che s&rsquo;aspiri,</p></div>\n\n<div class="stanza"><p>quai fossi attraversati o quai catene</p>\n<p>trovasti, per che del passare innanzi</p>\n<p>dovessiti cos&igrave; spogliar la spene?</p></div>\n\n<div class="stanza"><p>E quali agevolezze o quali avanzi</p>\n<p>ne la fronte de li altri si mostraro,</p>\n<p>per che dovessi lor passeggiare anzi?&raquo;.</p></div>\n\n<div class="stanza"><p>Dopo la tratta d&rsquo;un sospiro amaro,</p>\n<p>a pena ebbi la voce che rispuose,</p>\n<p>e le labbra a fatica la formaro.</p></div>\n\n<div class="stanza"><p>Piangendo dissi: &laquo;Le presenti cose</p>\n<p>col falso lor piacer volser miei passi,</p>\n<p>tosto che &rsquo;l vostro viso si nascose&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ella: &laquo;Se tacessi o se negassi</p>\n<p>ci&ograve; che confessi, non fora men nota</p>\n<p>la colpa tua: da tal giudice sassi!</p></div>\n\n<div class="stanza"><p>Ma quando scoppia de la propria gota</p>\n<p>l&rsquo;accusa del peccato, in nostra corte</p>\n<p>rivolge s&eacute; contra &rsquo;l taglio la rota.</p></div>\n\n<div class="stanza"><p>Tuttavia, perch&eacute; mo vergogna porte</p>\n<p>del tuo errore, e perch&eacute; altra volta,</p>\n<p>udendo le serene, sie pi&ugrave; forte,</p></div>\n\n<div class="stanza"><p>pon gi&ugrave; il seme del piangere e ascolta:</p>\n<p>s&igrave; udirai come in contraria parte</p>\n<p>mover dovieti mia carne sepolta.</p></div>\n\n<div class="stanza"><p>Mai non t&rsquo;appresent&ograve; natura o arte</p>\n<p>piacer, quanto le belle membra in ch&rsquo;io</p>\n<p>rinchiusa fui, e che so&rsquo; &rsquo;n terra sparte;</p></div>\n\n<div class="stanza"><p>e se &rsquo;l sommo piacer s&igrave; ti fallio</p>\n<p>per la mia morte, qual cosa mortale</p>\n<p>dovea poi trarre te nel suo disio?</p></div>\n\n<div class="stanza"><p>Ben ti dovevi, per lo primo strale</p>\n<p>de le cose fallaci, levar suso</p>\n<p>di retro a me che non era pi&ugrave; tale.</p></div>\n\n<div class="stanza"><p>Non ti dovea gravar le penne in giuso,</p>\n<p>ad aspettar pi&ugrave; colpo, o pargoletta</p>\n<p>o altra novit&agrave; con s&igrave; breve uso.</p></div>\n\n<div class="stanza"><p>Novo augelletto due o tre aspetta;</p>\n<p>ma dinanzi da li occhi d&rsquo;i pennuti</p>\n<p>rete si spiega indarno o si saetta&raquo;.</p></div>\n\n<div class="stanza"><p>Quali fanciulli, vergognando, muti</p>\n<p>con li occhi a terra stannosi, ascoltando</p>\n<p>e s&eacute; riconoscendo e ripentuti,</p></div>\n\n<div class="stanza"><p>tal mi stav&rsquo; io; ed ella disse: &laquo;Quando</p>\n<p>per udir se&rsquo; dolente, alza la barba,</p>\n<p>e prenderai pi&ugrave; doglia riguardando&raquo;.</p></div>\n\n<div class="stanza"><p>Con men di resistenza si dibarba</p>\n<p>robusto cerro, o vero al nostral vento</p>\n<p>o vero a quel de la terra di Iarba,</p></div>\n\n<div class="stanza"><p>ch&rsquo;io non levai al suo comando il mento;</p>\n<p>e quando per la barba il viso chiese,</p>\n<p>ben conobbi il velen de l&rsquo;argomento.</p></div>\n\n<div class="stanza"><p>E come la mia faccia si distese,</p>\n<p>posarsi quelle prime creature</p>\n<p>da loro aspers&iuml;on l&rsquo;occhio comprese;</p></div>\n\n<div class="stanza"><p>e le mie luci, ancor poco sicure,</p>\n<p>vider Beatrice volta in su la fiera</p>\n<p>ch&rsquo;&egrave; sola una persona in due nature.</p></div>\n\n<div class="stanza"><p>Sotto &rsquo;l suo velo e oltre la rivera</p>\n<p>vincer pariemi pi&ugrave; s&eacute; stessa antica,</p>\n<p>vincer che l&rsquo;altre qui, quand&rsquo; ella c&rsquo;era.</p></div>\n\n<div class="stanza"><p>Di penter s&igrave; mi punse ivi l&rsquo;ortica,</p>\n<p>che di tutte altre cose qual mi torse</p>\n<p>pi&ugrave; nel suo amor, pi&ugrave; mi si f&eacute; nemica.</p></div>\n\n<div class="stanza"><p>Tanta riconoscenza il cor mi morse,</p>\n<p>ch&rsquo;io caddi vinto; e quale allora femmi,</p>\n<p>salsi colei che la cagion mi porse.</p></div>\n\n<div class="stanza"><p>Poi, quando il cor virt&ugrave; di fuor rendemmi,</p>\n<p>la donna ch&rsquo;io avea trovata sola</p>\n<p>sopra me vidi, e dicea: &laquo;Tiemmi, tiemmi!&raquo;.</p></div>\n\n<div class="stanza"><p>Tratto m&rsquo;avea nel fiume infin la gola,</p>\n<p>e tirandosi me dietro sen giva</p>\n<p>sovresso l&rsquo;acqua lieve come scola.</p></div>\n\n<div class="stanza"><p>Quando fui presso a la beata riva,</p>\n<p>&lsquo;Asperges me&rsquo; s&igrave; dolcemente udissi,</p>\n<p>che nol so rimembrar, non ch&rsquo;io lo scriva.</p></div>\n\n<div class="stanza"><p>La bella donna ne le braccia aprissi;</p>\n<p>abbracciommi la testa e mi sommerse</p>\n<p>ove convenne ch&rsquo;io l&rsquo;acqua inghiottissi.</p></div>\n\n<div class="stanza"><p>Indi mi tolse, e bagnato m&rsquo;offerse</p>\n<p>dentro a la danza de le quattro belle;</p>\n<p>e ciascuna del braccio mi coperse.</p></div>\n\n<div class="stanza"><p>&laquo;Noi siam qui ninfe e nel ciel siamo stelle;</p>\n<p>pria che Beatrice discendesse al mondo,</p>\n<p>fummo ordinate a lei per sue ancelle.</p></div>\n\n<div class="stanza"><p>Merrenti a li occhi suoi; ma nel giocondo</p>\n<p>lume ch&rsquo;&egrave; dentro aguzzeranno i tuoi</p>\n<p>le tre di l&agrave;, che miran pi&ugrave; profondo&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; cantando cominciaro; e poi</p>\n<p>al petto del grifon seco menarmi,</p>\n<p>ove Beatrice stava volta a noi.</p></div>\n\n<div class="stanza"><p>Disser: &laquo;Fa che le viste non risparmi;</p>\n<p>posto t&rsquo;avem dinanzi a li smeraldi</p>\n<p>ond&rsquo; Amor gi&agrave; ti trasse le sue armi&raquo;.</p></div>\n\n<div class="stanza"><p>Mille disiri pi&ugrave; che fiamma caldi</p>\n<p>strinsermi li occhi a li occhi rilucenti,</p>\n<p>che pur sopra &rsquo;l grifone stavan saldi.</p></div>\n\n<div class="stanza"><p>Come in lo specchio il sol, non altrimenti</p>\n<p>la doppia fiera dentro vi raggiava,</p>\n<p>or con altri, or con altri reggimenti.</p></div>\n\n<div class="stanza"><p>Pensa, lettor, s&rsquo;io mi maravigliava,</p>\n<p>quando vedea la cosa in s&eacute; star queta,</p>\n<p>e ne l&rsquo;idolo suo si trasmutava.</p></div>\n\n<div class="stanza"><p>Mentre che piena di stupore e lieta</p>\n<p>l&rsquo;anima mia gustava di quel cibo</p>\n<p>che, saziando di s&eacute;, di s&eacute; asseta,</p></div>\n\n<div class="stanza"><p>s&eacute; dimostrando di pi&ugrave; alto tribo</p>\n<p>ne li atti, l&rsquo;altre tre si fero avanti,</p>\n<p>danzando al loro angelico caribo.</p></div>\n\n<div class="stanza"><p>&laquo;Volgi, Beatrice, volgi li occhi santi&raquo;,</p>\n<p>era la sua canzone, &laquo;al tuo fedele</p>\n<p>che, per vederti, ha mossi passi tanti!</p></div>\n\n<div class="stanza"><p>Per grazia fa noi grazia che disvele</p>\n<p>a lui la bocca tua, s&igrave; che discerna</p>\n<p>la seconda bellezza che tu cele&raquo;.</p></div>\n\n<div class="stanza"><p>O isplendor di viva luce etterna,</p>\n<p>chi palido si fece sotto l&rsquo;ombra</p>\n<p>s&igrave; di Parnaso, o bevve in sua cisterna,</p></div>\n\n<div class="stanza"><p>che non paresse aver la mente ingombra,</p>\n<p>tentando a render te qual tu paresti</p>\n<p>l&agrave; dove armonizzando il ciel t&rsquo;adombra,</p></div>\n\n<div class="stanza"><p>quando ne l&rsquo;aere aperto ti solvesti?</p></div>','<p class="cantohead">Canto XXXII</p>\n\n<div class="stanza"><p>Tant&rsquo; eran li occhi miei fissi e attenti</p>\n<p>a disbramarsi la decenne sete,</p>\n<p>che li altri sensi m&rsquo;eran tutti spenti.</p></div>\n\n<div class="stanza"><p>Ed essi quinci e quindi avien parete</p>\n<p>di non caler&mdash;cos&igrave; lo santo riso</p>\n<p>a s&eacute; tra&eacute;li con l&rsquo;antica rete!&mdash;;</p></div>\n\n<div class="stanza"><p>quando per forza mi fu v&ograve;lto il viso</p>\n<p>ver&rsquo; la sinistra mia da quelle dee,</p>\n<p>perch&rsquo; io udi&rsquo; da loro un &laquo;Troppo fiso!&raquo;;</p></div>\n\n<div class="stanza"><p>e la disposizion ch&rsquo;a veder &egrave;e</p>\n<p>ne li occhi pur test&eacute; dal sol percossi,</p>\n<p>sanza la vista alquanto esser mi f&eacute;e.</p></div>\n\n<div class="stanza"><p>Ma poi ch&rsquo;al poco il viso riformossi</p>\n<p>(e dico &lsquo;al poco&rsquo; per rispetto al molto</p>\n<p>sensibile onde a forza mi rimossi),</p></div>\n\n<div class="stanza"><p>vidi &rsquo;n sul braccio destro esser rivolto</p>\n<p>lo glor&iuml;oso essercito, e tornarsi</p>\n<p>col sole e con le sette fiamme al volto.</p></div>\n\n<div class="stanza"><p>Come sotto li scudi per salvarsi</p>\n<p>volgesi schiera, e s&eacute; gira col segno,</p>\n<p>prima che possa tutta in s&eacute; mutarsi;</p></div>\n\n<div class="stanza"><p>quella milizia del celeste regno</p>\n<p>che procedeva, tutta trapassonne</p>\n<p>pria che piegasse il carro il primo legno.</p></div>\n\n<div class="stanza"><p>Indi a le rote si tornar le donne,</p>\n<p>e &rsquo;l grifon mosse il benedetto carco</p>\n<p>s&igrave;, che per&ograve; nulla penna crollonne.</p></div>\n\n<div class="stanza"><p>La bella donna che mi trasse al varco</p>\n<p>e Stazio e io seguitavam la rota</p>\n<p>che f&eacute; l&rsquo;orbita sua con minore arco.</p></div>\n\n<div class="stanza"><p>S&igrave; passeggiando l&rsquo;alta selva v&ograve;ta,</p>\n<p>colpa di quella ch&rsquo;al serpente crese,</p>\n<p>temprava i passi un&rsquo;angelica nota.</p></div>\n\n<div class="stanza"><p>Forse in tre voli tanto spazio prese</p>\n<p>disfrenata saetta, quanto eramo</p>\n<p>rimossi, quando B&euml;atrice scese.</p></div>\n\n<div class="stanza"><p>Io senti&rsquo; mormorare a tutti &laquo;Adamo&raquo;;</p>\n<p>poi cerchiaro una pianta dispogliata</p>\n<p>di foglie e d&rsquo;altra fronda in ciascun ramo.</p></div>\n\n<div class="stanza"><p>La coma sua, che tanto si dilata</p>\n<p>pi&ugrave; quanto pi&ugrave; &egrave; s&ugrave;, fora da l&rsquo;Indi</p>\n<p>ne&rsquo; boschi lor per altezza ammirata.</p></div>\n\n<div class="stanza"><p>&laquo;Beato se&rsquo;, grifon, che non discindi</p>\n<p>col becco d&rsquo;esto legno dolce al gusto,</p>\n<p>poscia che mal si torce il ventre quindi&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; dintorno a l&rsquo;albero robusto</p>\n<p>gridaron li altri; e l&rsquo;animal binato:</p>\n<p>&laquo;S&igrave; si conserva il seme d&rsquo;ogne giusto&raquo;.</p></div>\n\n<div class="stanza"><p>E v&ograve;lto al temo ch&rsquo;elli avea tirato,</p>\n<p>trasselo al pi&egrave; de la vedova frasca,</p>\n<p>e quel di lei a lei lasci&ograve; legato.</p></div>\n\n<div class="stanza"><p>Come le nostre piante, quando casca</p>\n<p>gi&ugrave; la gran luce mischiata con quella</p>\n<p>che raggia dietro a la celeste lasca,</p></div>\n\n<div class="stanza"><p>turgide fansi, e poi si rinovella</p>\n<p>di suo color ciascuna, pria che &rsquo;l sole</p>\n<p>giunga li suoi corsier sotto altra stella;</p></div>\n\n<div class="stanza"><p>men che di rose e pi&ugrave; che di v&iuml;ole</p>\n<p>colore aprendo, s&rsquo;innov&ograve; la pianta,</p>\n<p>che prima avea le ramora s&igrave; sole.</p></div>\n\n<div class="stanza"><p>Io non lo &rsquo;ntesi, n&eacute; qui non si canta</p>\n<p>l&rsquo;inno che quella gente allor cantaro,</p>\n<p>n&eacute; la nota soffersi tutta quanta.</p></div>\n\n<div class="stanza"><p>S&rsquo;io potessi ritrar come assonnaro</p>\n<p>li occhi spietati udendo di Siringa,</p>\n<p>li occhi a cui pur vegghiar cost&ograve; s&igrave; caro;</p></div>\n\n<div class="stanza"><p>come pintor che con essempro pinga,</p>\n<p>disegnerei com&rsquo; io m&rsquo;addormentai;</p>\n<p>ma qual vuol sia che l&rsquo;assonnar ben finga.</p></div>\n\n<div class="stanza"><p>Per&ograve; trascorro a quando mi svegliai,</p>\n<p>e dico ch&rsquo;un splendor mi squarci&ograve; &rsquo;l velo</p>\n<p>del sonno, e un chiamar: &laquo;Surgi: che fai?&raquo;.</p></div>\n\n<div class="stanza"><p>Quali a veder de&rsquo; fioretti del melo</p>\n<p>che del suo pome li angeli fa ghiotti</p>\n<p>e perpet&uuml;e nozze fa nel cielo,</p></div>\n\n<div class="stanza"><p>Pietro e Giovanni e Iacopo condotti</p>\n<p>e vinti, ritornaro a la parola</p>\n<p>da la qual furon maggior sonni rotti,</p></div>\n\n<div class="stanza"><p>e videro scemata loro scuola</p>\n<p>cos&igrave; di Mo&iuml;s&egrave; come d&rsquo;Elia,</p>\n<p>e al maestro suo cangiata stola;</p></div>\n\n<div class="stanza"><p>tal torna&rsquo; io, e vidi quella pia</p>\n<p>sovra me starsi che conducitrice</p>\n<p>fu de&rsquo; miei passi lungo &rsquo;l fiume pria.</p></div>\n\n<div class="stanza"><p>E tutto in dubbio dissi: &laquo;Ov&rsquo; &egrave; Beatrice?&raquo;.</p>\n<p>Ond&rsquo; ella: &laquo;Vedi lei sotto la fronda</p>\n<p>nova sedere in su la sua radice.</p></div>\n\n<div class="stanza"><p>Vedi la compagnia che la circonda:</p>\n<p>li altri dopo &rsquo;l grifon sen vanno suso</p>\n<p>con pi&ugrave; dolce canzone e pi&ugrave; profonda&raquo;.</p></div>\n\n<div class="stanza"><p>E se pi&ugrave; fu lo suo parlar diffuso,</p>\n<p>non so, per&ograve; che gi&agrave; ne li occhi m&rsquo;era</p>\n<p>quella ch&rsquo;ad altro intender m&rsquo;avea chiuso.</p></div>\n\n<div class="stanza"><p>Sola sedeasi in su la terra vera,</p>\n<p>come guardia lasciata l&igrave; del plaustro</p>\n<p>che legar vidi a la biforme fera.</p></div>\n\n<div class="stanza"><p>In cerchio le facevan di s&eacute; claustro</p>\n<p>le sette ninfe, con quei lumi in mano</p>\n<p>che son sicuri d&rsquo;Aquilone e d&rsquo;Austro.</p></div>\n\n<div class="stanza"><p>&laquo;Qui sarai tu poco tempo silvano;</p>\n<p>e sarai meco sanza fine cive</p>\n<p>di quella Roma onde Cristo &egrave; romano.</p></div>\n\n<div class="stanza"><p>Per&ograve;, in pro del mondo che mal vive,</p>\n<p>al carro tieni or li occhi, e quel che vedi,</p>\n<p>ritornato di l&agrave;, fa che tu scrive&raquo;.</p></div>\n\n<div class="stanza"><p>Cos&igrave; Beatrice; e io, che tutto ai piedi</p>\n<p>d&rsquo;i suoi comandamenti era divoto,</p>\n<p>la mente e li occhi ov&rsquo; ella volle diedi.</p></div>\n\n<div class="stanza"><p>Non scese mai con s&igrave; veloce moto</p>\n<p>foco di spessa nube, quando piove</p>\n<p>da quel confine che pi&ugrave; va remoto,</p></div>\n\n<div class="stanza"><p>com&rsquo; io vidi calar l&rsquo;uccel di Giove</p>\n<p>per l&rsquo;alber gi&ugrave;, rompendo de la scorza,</p>\n<p>non che d&rsquo;i fiori e de le foglie nove;</p></div>\n\n<div class="stanza"><p>e fer&igrave; &rsquo;l carro di tutta sua forza;</p>\n<p>ond&rsquo; el pieg&ograve; come nave in fortuna,</p>\n<p>vinta da l&rsquo;onda, or da poggia, or da orza.</p></div>\n\n<div class="stanza"><p>Poscia vidi avventarsi ne la cuna</p>\n<p>del tr&iuml;unfal veiculo una volpe</p>\n<p>che d&rsquo;ogne pasto buon parea digiuna;</p></div>\n\n<div class="stanza"><p>ma, riprendendo lei di laide colpe,</p>\n<p>la donna mia la volse in tanta futa</p>\n<p>quanto sofferser l&rsquo;ossa sanza polpe.</p></div>\n\n<div class="stanza"><p>Poscia per indi ond&rsquo; era pria venuta,</p>\n<p>l&rsquo;aguglia vidi scender gi&ugrave; ne l&rsquo;arca</p>\n<p>del carro e lasciar lei di s&eacute; pennuta;</p></div>\n\n<div class="stanza"><p>e qual esce di cuor che si rammarca,</p>\n<p>tal voce usc&igrave; del cielo e cotal disse:</p>\n<p>&laquo;O navicella mia, com&rsquo; mal se&rsquo; carca!&raquo;.</p></div>\n\n<div class="stanza"><p>Poi parve a me che la terra s&rsquo;aprisse</p>\n<p>tr&rsquo;ambo le ruote, e vidi uscirne un drago</p>\n<p>che per lo carro s&ugrave; la coda fisse;</p></div>\n\n<div class="stanza"><p>e come vespa che ritragge l&rsquo;ago,</p>\n<p>a s&eacute; traendo la coda maligna,</p>\n<p>trasse del fondo, e gissen vago vago.</p></div>\n\n<div class="stanza"><p>Quel che rimase, come da gramigna</p>\n<p>vivace terra, da la piuma, offerta</p>\n<p>forse con intenzion sana e benigna,</p></div>\n\n<div class="stanza"><p>si ricoperse, e funne ricoperta</p>\n<p>e l&rsquo;una e l&rsquo;altra rota e &rsquo;l temo, in tanto</p>\n<p>che pi&ugrave; tiene un sospir la bocca aperta.</p></div>\n\n<div class="stanza"><p>Trasformato cos&igrave; &rsquo;l dificio santo</p>\n<p>mise fuor teste per le parti sue,</p>\n<p>tre sovra &rsquo;l temo e una in ciascun canto.</p></div>\n\n<div class="stanza"><p>Le prime eran cornute come bue,</p>\n<p>ma le quattro un sol corno avean per fronte:</p>\n<p>simile mostro visto ancor non fue.</p></div>\n\n<div class="stanza"><p>Sicura, quasi rocca in alto monte,</p>\n<p>seder sovresso una puttana sciolta</p>\n<p>m&rsquo;apparve con le ciglia intorno pronte;</p></div>\n\n<div class="stanza"><p>e come perch&eacute; non li fosse tolta,</p>\n<p>vidi di costa a lei dritto un gigante;</p>\n<p>e basciavansi insieme alcuna volta.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; l&rsquo;occhio cupido e vagante</p>\n<p>a me rivolse, quel feroce drudo</p>\n<p>la flagell&ograve; dal capo infin le piante;</p></div>\n\n<div class="stanza"><p>poi, di sospetto pieno e d&rsquo;ira crudo,</p>\n<p>disciolse il mostro, e trassel per la selva,</p>\n<p>tanto che sol di lei mi fece scudo</p></div>\n\n<div class="stanza"><p>a la puttana e a la nova belva.</p></div>','<p class="cantohead">Canto XXXIII</p>\n\n<div class="stanza"><p>&lsquo;Deus, venerunt gentes&rsquo;, alternando</p>\n<p>or tre or quattro dolce salmodia,</p>\n<p>le donne incominciaro, e lagrimando;</p></div>\n\n<div class="stanza"><p>e B&euml;atrice, sospirosa e pia,</p>\n<p>quelle ascoltava s&igrave; fatta, che poco</p>\n<p>pi&ugrave; a la croce si cambi&ograve; Maria.</p></div>\n\n<div class="stanza"><p>Ma poi che l&rsquo;altre vergini dier loco</p>\n<p>a lei di dir, levata dritta in p&egrave;,</p>\n<p>rispuose, colorata come foco:</p></div>\n\n<div class="stanza"><p>&lsquo;Modicum, et non videbitis me;</p>\n<p>et iterum, sorelle mie dilette,</p>\n<p>modicum, et vos videbitis me&rsquo;.</p></div>\n\n<div class="stanza"><p>Poi le si mise innanzi tutte e sette,</p>\n<p>e dopo s&eacute;, solo accennando, mosse</p>\n<p>me e la donna e &rsquo;l savio che ristette.</p></div>\n\n<div class="stanza"><p>Cos&igrave; sen giva; e non credo che fosse</p>\n<p>lo decimo suo passo in terra posto,</p>\n<p>quando con li occhi li occhi mi percosse;</p></div>\n\n<div class="stanza"><p>e con tranquillo aspetto &laquo;Vien pi&ugrave; tosto&raquo;,</p>\n<p>mi disse, &laquo;tanto che, s&rsquo;io parlo teco,</p>\n<p>ad ascoltarmi tu sie ben disposto&raquo;.</p></div>\n\n<div class="stanza"><p>S&igrave; com&rsquo; io fui, com&rsquo; io dov&euml;a, seco,</p>\n<p>dissemi: &laquo;Frate, perch&eacute; non t&rsquo;attenti</p>\n<p>a domandarmi omai venendo meco?&raquo;.</p></div>\n\n<div class="stanza"><p>Come a color che troppo reverenti</p>\n<p>dinanzi a suo maggior parlando sono,</p>\n<p>che non traggon la voce viva ai denti,</p></div>\n\n<div class="stanza"><p>avvenne a me, che sanza intero suono</p>\n<p>incominciai: &laquo;Madonna, mia bisogna</p>\n<p>voi conoscete, e ci&ograve; ch&rsquo;ad essa &egrave; buono&raquo;.</p></div>\n\n<div class="stanza"><p>Ed ella a me: &laquo;Da tema e da vergogna</p>\n<p>voglio che tu omai ti disviluppe,</p>\n<p>s&igrave; che non parli pi&ugrave; com&rsquo; om che sogna.</p></div>\n\n<div class="stanza"><p>Sappi che &rsquo;l vaso che &rsquo;l serpente ruppe,</p>\n<p>fu e non &egrave;; ma chi n&rsquo;ha colpa, creda</p>\n<p>che vendetta di Dio non teme suppe.</p></div>\n\n<div class="stanza"><p>Non sar&agrave; tutto tempo sanza reda</p>\n<p>l&rsquo;aguglia che lasci&ograve; le penne al carro,</p>\n<p>per che divenne mostro e poscia preda;</p></div>\n\n<div class="stanza"><p>ch&rsquo;io veggio certamente, e per&ograve; il narro,</p>\n<p>a darne tempo gi&agrave; stelle propinque,</p>\n<p>secure d&rsquo;ogn&rsquo; intoppo e d&rsquo;ogne sbarro,</p></div>\n\n<div class="stanza"><p>nel quale un cinquecento diece e cinque,</p>\n<p>messo di Dio, ancider&agrave; la fuia</p>\n<p>con quel gigante che con lei delinque.</p></div>\n\n<div class="stanza"><p>E forse che la mia narrazion buia,</p>\n<p>qual Temi e Sfinge, men ti persuade,</p>\n<p>perch&rsquo; a lor modo lo &rsquo;ntelletto attuia;</p></div>\n\n<div class="stanza"><p>ma tosto fier li fatti le Naiade,</p>\n<p>che solveranno questo enigma forte</p>\n<p>sanza danno di pecore o di biade.</p></div>\n\n<div class="stanza"><p>Tu nota; e s&igrave; come da me son porte,</p>\n<p>cos&igrave; queste parole segna a&rsquo; vivi</p>\n<p>del viver ch&rsquo;&egrave; un correre a la morte.</p></div>\n\n<div class="stanza"><p>E aggi a mente, quando tu le scrivi,</p>\n<p>di non celar qual hai vista la pianta</p>\n<p>ch&rsquo;&egrave; or due volte dirubata quivi.</p></div>\n\n<div class="stanza"><p>Qualunque ruba quella o quella schianta,</p>\n<p>con bestemmia di fatto offende a Dio,</p>\n<p>che solo a l&rsquo;uso suo la cre&ograve; santa.</p></div>\n\n<div class="stanza"><p>Per morder quella, in pena e in disio</p>\n<p>cinquemilia anni e pi&ugrave; l&rsquo;anima prima</p>\n<p>bram&ograve; colui che &rsquo;l morso in s&eacute; punio.</p></div>\n\n<div class="stanza"><p>Dorme lo &rsquo;ngegno tuo, se non estima</p>\n<p>per singular cagione esser eccelsa</p>\n<p>lei tanto e s&igrave; travolta ne la cima.</p></div>\n\n<div class="stanza"><p>E se stati non fossero acqua d&rsquo;Elsa</p>\n<p>li pensier vani intorno a la tua mente,</p>\n<p>e &rsquo;l piacer loro un Piramo a la gelsa,</p></div>\n\n<div class="stanza"><p>per tante circostanze solamente</p>\n<p>la giustizia di Dio, ne l&rsquo;interdetto,</p>\n<p>conosceresti a l&rsquo;arbor moralmente.</p></div>\n\n<div class="stanza"><p>Ma perch&rsquo; io veggio te ne lo &rsquo;ntelletto</p>\n<p>fatto di pietra e, impetrato, tinto,</p>\n<p>s&igrave; che t&rsquo;abbaglia il lume del mio detto,</p></div>\n\n<div class="stanza"><p>voglio anco, e se non scritto, almen dipinto,</p>\n<p>che &rsquo;l te ne porti dentro a te per quello</p>\n<p>che si reca il bordon di palma cinto&raquo;.</p></div>\n\n<div class="stanza"><p>E io: &laquo;S&igrave; come cera da suggello,</p>\n<p>che la figura impressa non trasmuta,</p>\n<p>segnato &egrave; or da voi lo mio cervello.</p></div>\n\n<div class="stanza"><p>Ma perch&eacute; tanto sovra mia veduta</p>\n<p>vostra parola dis&iuml;ata vola,</p>\n<p>che pi&ugrave; la perde quanto pi&ugrave; s&rsquo;aiuta?&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;Perch&eacute; conoschi&raquo;, disse, &laquo;quella scuola</p>\n<p>c&rsquo;hai seguitata, e veggi sua dottrina</p>\n<p>come pu&ograve; seguitar la mia parola;</p></div>\n\n<div class="stanza"><p>e veggi vostra via da la divina</p>\n<p>distar cotanto, quanto si discorda</p>\n<p>da terra il ciel che pi&ugrave; alto festina&raquo;.</p></div>\n\n<div class="stanza"><p>Ond&rsquo; io rispuosi lei: &laquo;Non mi ricorda</p>\n<p>ch&rsquo;i&rsquo; stran&iuml;asse me gi&agrave; mai da voi,</p>\n<p>n&eacute; honne cosc&iuml;enza che rimorda&raquo;.</p></div>\n\n<div class="stanza"><p>&laquo;E se tu ricordar non te ne puoi&raquo;,</p>\n<p>sorridendo rispuose, &laquo;or ti rammenta</p>\n<p>come bevesti di Let&egrave; ancoi;</p></div>\n\n<div class="stanza"><p>e se dal fummo foco s&rsquo;argomenta,</p>\n  <p>cotesta obliv&iuml;on chiaro conchiude</p>\n<p>colpa ne la tua voglia altrove attenta.</p></div>\n\n<div class="stanza"><p>Veramente oramai saranno nude</p>\n<p>le mie parole, quanto converrassi</p>\n<p>quelle scovrire a la tua vista rude&raquo;.</p></div>\n\n<div class="stanza"><p>E pi&ugrave; corusco e con pi&ugrave; lenti passi</p>\n<p>teneva il sole il cerchio di merigge,</p>\n<p>che qua e l&agrave;, come li aspetti, fassi,</p></div>\n\n<div class="stanza"><p>quando s&rsquo;affisser, s&igrave; come s&rsquo;affigge</p>\n<p>chi va dinanzi a gente per iscorta</p>\n<p>se trova novitate o sue vestigge,</p></div>\n\n<div class="stanza"><p>le sette donne al fin d&rsquo;un&rsquo;ombra smorta,</p>\n<p>qual sotto foglie verdi e rami nigri</p>\n<p>sovra suoi freddi rivi l&rsquo;alpe porta.</p></div>\n\n<div class="stanza"><p>Dinanzi ad esse &euml;ufrat&egrave;s e Tigri</p>\n<p>veder mi parve uscir d&rsquo;una fontana,</p>\n<p>e, quasi amici, dipartirsi pigri.</p></div>\n\n<div class="stanza"><p>&laquo;O luce, o gloria de la gente umana,</p>\n<p>che acqua &egrave; questa che qui si dispiega</p>\n<p>da un principio e s&eacute; da s&eacute; lontana?&raquo;.</p></div>\n\n<div class="stanza"><p>Per cotal priego detto mi fu: &laquo;Priega</p>\n<p>Matelda che &rsquo;l ti dica&raquo;. E qui rispuose,</p>\n<p>come fa chi da colpa si dislega,</p></div>\n\n<div class="stanza"><p>la bella donna: &laquo;Questo e altre cose</p>\n<p>dette li son per me; e son sicura</p>\n<p>che l&rsquo;acqua di Let&egrave; non gliel nascose&raquo;.</p></div>\n\n<div class="stanza"><p>E B&euml;atrice: &laquo;Forse maggior cura,</p>\n<p>che spesse volte la memoria priva,</p>\n<p>fatt&rsquo; ha la mente sua ne li occhi oscura.</p></div>\n\n<div class="stanza"><p>Ma vedi E&uuml;no&egrave; che l&agrave; diriva:</p>\n<p>menalo ad esso, e come tu se&rsquo; usa,</p>\n<p>la tramortita sua virt&ugrave; ravviva&raquo;.</p></div>\n\n<div class="stanza"><p>Come anima gentil, che non fa scusa,</p>\n<p>ma fa sua voglia de la voglia altrui</p>\n<p>tosto che &egrave; per segno fuor dischiusa;</p></div>\n\n<div class="stanza"><p>cos&igrave;, poi che da essa preso fui,</p>\n<p>la bella donna mossesi, e a Stazio</p>\n<p>donnescamente disse: &laquo;Vien con lui&raquo;.</p></div>\n\n<div class="stanza"><p>S&rsquo;io avessi, lettor, pi&ugrave; lungo spazio</p>\n<p>da scrivere, i&rsquo; pur cantere&rsquo; in parte</p>\n<p>lo dolce ber che mai non m&rsquo;avria sazio;</p></div>\n\n<div class="stanza"><p>ma perch&eacute; piene son tutte le carte</p>\n<p>ordite a questa cantica seconda,</p>\n<p>non mi lascia pi&ugrave; ir lo fren de l&rsquo;arte.</p></div>\n\n<div class="stanza"><p>Io ritornai da la santissima onda</p>\n<p>rifatto s&igrave; come piante novelle</p>\n<p>rinovellate di novella fronda,</p></div>\n\n<div class="stanza"><p>puro e disposto a salire a le stelle.</p></div>']};

},{}],7:[function(require,module,exports){
// purgatorio/longfellow.js
"use strict";module.exports={bookname:'purgatorio',author:'Dante Alighieri',translationid:"longfellow",title:'Purgatory',translation:true,source:'<a href="http://www.gutenberg.org/ebooks/1002">Project Gutenberg</a>',translationshortname:"Longfellow",translationfullname:"Henry Wadsworth Longfellow",translationclass:"poetry longfellow",text:['<p class="title">Purgatory</p>\n\t<p class="author">Henry Wadsworth Longfellow</p>','\n\n<p class="cantohead">Purgatorio: Canto I</p>\n\n<div class="stanza"><p>To run o&rsquo;et better waters hoists its sail</p>\n<p class="slindent">The little vessel of my genius now,</p>\n<p class="slindent">That leaves behind itself a sea so cruel;</p></div>\n\n<div class="stanza"><p>And of that second kingdom will I sing</p>\n<p class="slindent">Wherein the human spirit doth purge itself,</p>\n<p class="slindent">And to ascend to heaven becometh worthy.</p></div>\n\n<div class="stanza"><p>But let dead Poesy here rise again,</p>\n<p class="slindent">O holy Muses, since that I am yours,</p>\n<p class="slindent">And here Calliope somewhat ascend,</p></div>\n\n<div class="stanza"><p>My song accompanying with that sound,</p>\n<p class="slindent">Of which the miserable magpies felt</p>\n<p class="slindent">The blow so great, that they despaired of pardon.</p></div>\n\n<div class="stanza"><p>Sweet colour of the oriental sapphire,</p>\n<p class="slindent">That was upgathered in the cloudless aspect</p>\n<p class="slindent">Of the pure air, as far as the first circle,</p></div>\n\n<div class="stanza"><p>Unto mine eyes did recommence delight</p>\n<p class="slindent">Soon as I issued forth from the dead air,</p>\n<p class="slindent">Which had with sadness filled mine eyes and breast.</p></div>\n\n<div class="stanza"><p>The beauteous planet, that to love incites,</p>\n<p class="slindent">Was making all the orient to laugh,</p>\n<p class="slindent">Veiling the Fishes that were in her escort.</p></div>\n\n<div class="stanza"><p>To the right hand I turned, and fixed my mind</p>\n<p class="slindent">Upon the other pole, and saw four stars</p>\n<p class="slindent">Ne&rsquo;et seen before save by the primal people.</p></div>\n\n<div class="stanza"><p>Rejoicing in their flamelets seemed the heaven.</p>\n<p class="slindent">O thou septentrional and widowed site,</p>\n<p class="slindent">Because thou art deprived of seeing these!</p></div>\n\n<div class="stanza"><p>When from regarding them I had withdrawn,</p>\n<p class="slindent">Turning a little to the other pole,</p>\n<p class="slindent">There where the Wain had disappeared already,</p></div>\n\n<div class="stanza"><p>I saw beside me an old man alone,</p>\n<p class="slindent">Worthy of so much reverence in his look,</p>\n<p class="slindent">That more owes not to father any son.</p></div>\n\n<div class="stanza"><p>A long beard and with white hair intermingled</p>\n<p class="slindent">He wore, in semblance like unto the tresses,</p>\n<p class="slindent">Of which a double list fell on his breast.</p></div>\n\n<div class="stanza"><p>The rays of the four consecrated stars</p>\n<p class="slindent">Did so adorn his countenance with light,</p>\n<p class="slindent">That him I saw as were the sun before him.</p></div>\n\n<div class="stanza"><p>&ldquo;Who are you? ye who, counter the blind river,</p>\n<p class="slindent">Have fled away from the eternal prison?&rdquo;</p>\n<p class="slindent">Moving those venerable plumes, he said:</p></div>\n\n<div class="stanza"><p>&ldquo;Who guided you? or who has been your lamp</p>\n<p class="slindent">In issuing forth out of the night profound,</p>\n<p class="slindent">That ever black makes the infernal valley?</p></div>\n\n<div class="stanza"><p>The laws of the abyss, are they thus broken?</p>\n<p class="slindent">Or is there changed in heaven some council new,</p>\n<p class="slindent">That being damned ye come unto my crags?&rdquo;</p></div>\n\n<div class="stanza"><p>Then did my Leader lay his grasp upon me,</p>\n<p class="slindent">And with his words, and with his hands and signs,</p>\n<p class="slindent">Reverent he made in me my knees and brow;</p></div>\n\n<div class="stanza"><p>Then answered him: &ldquo;I came not of myself;</p>\n<p class="slindent">A Lady from Heaven descended, at whose prayers</p>\n<p class="slindent">I aided this one with my company.</p></div>\n\n<div class="stanza"><p>But since it is thy will more be unfolded</p>\n<p class="slindent">Of our condition, how it truly is,</p>\n<p class="slindent">Mine cannot be that this should be denied thee.</p></div>\n\n<div class="stanza"><p>This one has never his last evening seen,</p>\n<p class="slindent">But by his folly was so near to it</p>\n<p class="slindent">That very little time was there to turn.</p></div>\n\n<div class="stanza"><p>As I have said, I unto him was sent</p>\n<p class="slindent">To rescue him, and other way was none</p>\n<p class="slindent">Than this to which I have myself betaken.</p></div>\n\n<div class="stanza"><p>I&rsquo;ve shown him all the people of perdition,</p>\n<p class="slindent">And now those spirits I intend to show</p>\n<p class="slindent">Who purge themselves beneath thy guardianship.</p></div>\n\n<div class="stanza"><p>How I have brought him would be long to tell thee.</p>\n<p class="slindent">Virtue descendeth from on high that aids me</p>\n<p class="slindent">To lead him to behold thee and to hear thee.</p></div>\n\n<div class="stanza"><p>Now may it please thee to vouchsafe his coming;</p>\n<p class="slindent">He seeketh Liberty, which is so dear,</p>\n<p class="slindent">As knoweth he who life for her refuses.</p></div>\n\n<div class="stanza"><p>Thou know&rsquo;st it; since, for her, to thee not bitter</p>\n<p class="slindent">Was death in Utica, where thou didst leave</p>\n<p class="slindent">The vesture, that will shine so, the great day.</p></div>\n\n<div class="stanza"><p>By us the eternal edicts are not broken;</p>\n<p class="slindent">Since this one lives, and Minos binds not me;</p>\n<p class="slindent">But of that circle I, where are the chaste</p></div>\n\n<div class="stanza"><p>Eyes of thy Marcia, who in looks still prays thee,</p>\n<p class="slindent">O holy breast, to hold her as thine own;</p>\n<p class="slindent">For her love, then, incline thyself to us.</p></div>\n\n<div class="stanza"><p>Permit us through thy sevenfold realm to go;</p>\n<p class="slindent">I will take back this grace from thee to her,</p>\n<p class="slindent">If to be mentioned there below thou deignest.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Marcia so pleasing was unto mine eyes</p>\n<p class="slindent">While I was on the other side,&rdquo; then said he,</p>\n<p class="slindent">&ldquo;That every grace she wished of me I granted;</p></div>\n\n<div class="stanza"><p>Now that she dwells beyond the evil river,</p>\n<p class="slindent">She can no longer move me, by that law</p>\n<p class="slindent">Which, when I issued forth from there, was made.</p></div>\n\n<div class="stanza"><p>But if a Lady of Heaven do move and rule thee,</p>\n<p class="slindent">As thou dost say, no flattery is needful;</p>\n<p class="slindent">Let it suffice thee that for her thou ask me.</p></div>\n\n<div class="stanza"><p>Go, then, and see thou gird this one about</p>\n<p class="slindent">With a smooth rush, and that thou wash his face,</p>\n<p class="slindent">So that thou cleanse away all stain therefrom,</p></div>\n\n<div class="stanza"><p>For &rsquo;twere not fitting that the eye o&rsquo;etcast</p>\n<p class="slindent">By any mist should go before the first</p>\n<p class="slindent">Angel, who is of those of Paradise.</p></div>\n\n<div class="stanza"><p>This little island round about its base</p>\n<p class="slindent">Below there, yonder, where the billow beats it,</p>\n<p class="slindent">Doth rushes bear upon its washy ooze;</p></div>\n\n<div class="stanza"><p>No other plant that putteth forth the leaf,</p>\n<p class="slindent">Or that doth indurate, can there have life,</p>\n<p class="slindent">Because it yieldeth not unto the shocks.</p></div>\n\n<div class="stanza"><p>Thereafter be not this way your return;</p>\n<p class="slindent">The sun, which now is rising, will direct you</p>\n<p class="slindent">To take the mount by easier ascent.&rdquo;</p></div>\n\n<div class="stanza"><p>With this he vanished; and I raised me up</p>\n<p class="slindent">Without a word, and wholly drew myself</p>\n<p class="slindent">Unto my Guide, and turned mine eyes to him.</p></div>\n\n<div class="stanza"><p>And he began: &ldquo;Son, follow thou my steps;</p>\n<p class="slindent">Let us turn back, for on this side declines</p>\n<p class="slindent">The plain unto its lower boundaries.&rdquo;</p></div>\n\n<div class="stanza"><p>The dawn was vanquishing the matin hour</p>\n<p class="slindent">Which fled before it, so that from afar</p>\n<p class="slindent">I recognised the trembling of the sea.</p></div>\n\n<div class="stanza"><p>Along the solitary plain we went</p>\n<p class="slindent">As one who unto the lost road returns,</p>\n<p class="slindent">And till he finds it seems to go in vain.</p></div>\n\n<div class="stanza"><p>As soon as we were come to where the dew</p>\n<p class="slindent">Fights with the sun, and, being in a part</p>\n<p class="slindent">Where shadow falls, little evaporates,</p></div>\n\n<div class="stanza"><p>Both of his hands upon the grass outspread</p>\n<p class="slindent">In gentle manner did my Master place;</p>\n<p class="slindent">Whence I, who of his action was aware,</p></div>\n\n<div class="stanza"><p>Extended unto him my tearful cheeks;</p>\n<p class="slindent">There did he make in me uncovered wholly</p>\n<p class="slindent">That hue which Hell had covered up in me.</p></div>\n\n<div class="stanza"><p>Then came we down upon the desert shore</p>\n<p class="slindent">Which never yet saw navigate its waters</p>\n<p class="slindent">Any that afterward had known return.</p></div>\n\n<div class="stanza"><p>There he begirt me as the other pleased;</p>\n<p class="slindent">O marvellous! for even as he culled</p>\n<p class="slindent">The humble plant, such it sprang up again</p></div>\n\n<div class="stanza"><p>Suddenly there where he uprooted it.</p></div>','<p class="cantohead">Purgatorio: Canto II</p>\n<div class="stanza"><p>Already had the sun the horizon reached</p>\n<p class="slindent">Whose circle of meridian covers o&rsquo;et</p>\n<p class="slindent">Jerusalem with its most lofty point,</p></div>\n\n<div class="stanza"><p>And night that opposite to him revolves</p>\n<p class="slindent">Was issuing forth from Ganges with the Scales</p>\n<p class="slindent">That fall from out her hand when she exceedeth;</p></div>\n\n<div class="stanza"><p>So that the white and the vermilion cheeks</p>\n<p class="slindent">Of beautiful Aurora, where I was,</p>\n<p class="slindent">By too great age were changing into orange.</p></div>\n\n<div class="stanza"><p>We still were on the border of the sea,</p>\n<p class="slindent">Like people who are thinking of their road,</p>\n<p class="slindent">Who go in heart and with the body stay;</p></div>\n\n<div class="stanza"><p>And lo! as when, upon the approach of morning,</p>\n<p class="slindent">Through the gross vapours Mars grows fiery red</p>\n<p class="slindent">Down in the West upon the ocean floor,</p></div>\n\n<div class="stanza"><p>Appeared to me\u2014may I again behold it!\u2014</p>\n<p class="slindent">A light along the sea so swiftly coming,</p>\n<p class="slindent">Its motion by no flight of wing is equalled;</p></div>\n\n<div class="stanza"><p>From which when I a little had withdrawn</p>\n<p class="slindent">Mine eyes, that I might question my Conductor,</p>\n<p class="slindent">Again I saw it brighter grown and larger.</p></div>\n\n<div class="stanza"><p>Then on each side of it appeared to me</p>\n<p class="slindent">I knew not what of white, and underneath it</p>\n<p class="slindent">Little by little there came forth another.</p></div>\n\n<div class="stanza"><p>My Master yet had uttered not a word</p>\n<p class="slindent">While the first whiteness into wings unfolded;</p>\n<p class="slindent">But when he clearly recognised the pilot,</p></div>\n\n<div class="stanza"><p>He cried: &ldquo;Make haste, make haste to bow the knee!</p>\n<p class="slindent">Behold the Angel of God! fold thou thy hands!</p>\n<p class="slindent">Henceforward shalt thou see such officers!</p></div>\n\n<div class="stanza"><p>See how he scorneth human arguments,</p>\n<p class="slindent">So that nor oar he wants, nor other sail</p>\n<p class="slindent">Than his own wings, between so distant shores.</p></div>\n\n<div class="stanza"><p>See how he holds them pointed up to heaven,</p>\n<p class="slindent">Fanning the air with the eternal pinions,</p>\n<p class="slindent">That do not moult themselves like mortal hair!&rdquo;</p></div>\n\n<div class="stanza"><p>Then as still nearer and more near us came</p>\n<p class="slindent">The Bird Divine, more radiant he appeared,</p>\n<p class="slindent">So that near by the eye could not endure him,</p></div>\n\n<div class="stanza"><p>But down I cast it; and he came to shore</p>\n<p class="slindent">With a small vessel, very swift and light,</p>\n<p class="slindent">So that the water swallowed naught thereof.</p></div>\n\n<div class="stanza"><p>Upon the stern stood the Celestial Pilot;</p>\n<p class="slindent">Beatitude seemed written in his face,</p>\n<p class="slindent">And more than a hundred spirits sat within.</p></div>\n\n<div class="stanza"><p>&ldquo;In exitu Israel de Aegypto!&rdquo;</p>\n<p class="slindent">They chanted all together in one voice,</p>\n<p class="slindent">With whatso in that psalm is after written.</p></div>\n\n<div class="stanza"><p>Then made he sign of holy rood upon them,</p>\n<p class="slindent">Whereat all cast themselves upon the shore,</p>\n<p class="slindent">And he departed swiftly as he came.</p></div>\n\n<div class="stanza"><p>The throng which still remained there unfamiliar</p>\n<p class="slindent">Seemed with the place, all round about them gazing,</p>\n<p class="slindent">As one who in new matters makes essay.</p></div>\n\n<div class="stanza"><p>On every side was darting forth the day.</p>\n<p class="slindent">The sun, who had with his resplendent shafts</p>\n<p class="slindent">From the mid-heaven chased forth the Capricorn,</p></div>\n\n<div class="stanza"><p>When the new people lifted up their faces</p>\n<p class="slindent">Towards us, saying to us: &ldquo;If ye know,</p>\n<p class="slindent">Show us the way to go unto the mountain.&rdquo;</p></div>\n\n<div class="stanza"><p>And answer made Virgilius: &ldquo;Ye believe</p>\n<p class="slindent">Perchance that we have knowledge of this place,</p>\n<p class="slindent">But we are strangers even as yourselves.</p></div>\n\n<div class="stanza"><p>Just now we came, a little while before you,</p>\n<p class="slindent">Another way, which was so rough and steep,</p>\n<p class="slindent">That mounting will henceforth seem sport to us.&rdquo;</p></div>\n\n<div class="stanza"><p>The souls who had, from seeing me draw breath,</p>\n<p class="slindent">Become aware that I was still alive,</p>\n<p class="slindent">Pallid in their astonishment became;</p></div>\n\n<div class="stanza"><p>And as to messenger who bears the olive</p>\n<p class="slindent">The people throng to listen to the news,</p>\n<p class="slindent">And no one shows himself afraid of crowding,</p></div>\n\n<div class="stanza"><p>So at the sight of me stood motionless</p>\n<p class="slindent">Those fortunate spirits, all of them, as if</p>\n<p class="slindent">Oblivious to go and make them fair.</p></div>\n\n<div class="stanza"><p>One from among them saw I coming forward,</p>\n<p class="slindent">As to embrace me, with such great affection,</p>\n<p class="slindent">That it incited me to do the like.</p></div>\n\n<div class="stanza"><p>O empty shadows, save in aspect only!</p>\n<p class="slindent">Three times behind it did I clasp my hands,</p>\n<p class="slindent">As oft returned with them to my own breast!</p></div>\n\n<div class="stanza"><p>I think with wonder I depicted me;</p>\n<p class="slindent">Whereat the shadow smiled and backward drew;</p>\n<p class="slindent">And I, pursuing it, pressed farther forward.</p></div>\n\n<div class="stanza"><p>Gently it said that I should stay my steps;</p>\n<p class="slindent">Then knew I who it was, and I entreated</p>\n<p class="slindent">That it would stop awhile to speak with me.</p></div>\n\n<div class="stanza"><p>It made reply to me: &ldquo;Even as I loved thee</p>\n<p class="slindent">In mortal body, so I love thee free;</p>\n<p class="slindent">Therefore I stop; but wherefore goest thou?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;My own Casella! to return once more</p>\n<p class="slindent">There where I am, I make this journey,&rdquo; said I;</p>\n<p class="slindent">&ldquo;But how from thee has so much time be taken?&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;No outrage has been done me,</p>\n<p class="slindent">If he who takes both when and whom he pleases</p>\n<p class="slindent">Has many times denied to me this passage,</p></div>\n\n<div class="stanza"><p>For of a righteous will his own is made.</p>\n<p class="slindent">He, sooth to say, for three months past has taken</p>\n<p class="slindent">Whoever wished to enter with all peace;</p></div>\n\n<div class="stanza"><p>Whence I, who now had turned unto that shore</p>\n<p class="slindent">Where salt the waters of the Tiber grow,</p>\n<p class="slindent">Benignantly by him have been received.</p></div>\n\n<div class="stanza"><p>Unto that outlet now his wing is pointed,</p>\n<p class="slindent">Because for evermore assemble there</p>\n<p class="slindent">Those who tow&rsquo;rds Acheron do not descend.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;If some new law take not from thee</p>\n<p class="slindent">Memory or practice of the song of love,</p>\n<p class="slindent">Which used to quiet in me all my longings,</p></div>\n\n<div class="stanza"><p>Thee may it please to comfort therewithal</p>\n<p class="slindent">Somewhat this soul of mine, that with its body</p>\n<p class="slindent">Hitherward coming is so much distressed.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Love, that within my mind discourses with me,&rdquo;</p>\n<p class="slindent">Forthwith began he so melodiously,</p>\n<p class="slindent">The melody within me still is sounding.</p></div>\n\n<div class="stanza"><p>My Master, and myself, and all that people</p>\n<p class="slindent">Which with him were, appeared as satisfied</p>\n<p class="slindent">As if naught else might touch the mind of any.</p></div>\n\n<div class="stanza"><p>We all of us were moveless and attentive</p>\n<p class="slindent">Unto his notes; and lo! the grave old man,</p>\n<p class="slindent">Exclaiming: &ldquo;What is this, ye laggard spirits?</p></div>\n\n<div class="stanza"><p>What negligence, what standing still is this?</p>\n<p class="slindent">Run to the mountain to strip off the slough,</p>\n<p class="slindent">That lets not God be manifest to you.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as when, collecting grain or tares,</p>\n<p class="slindent">The doves, together at their pasture met,</p>\n<p class="slindent">Quiet, nor showing their accustomed pride,</p></div>\n\n<div class="stanza"><p>If aught appear of which they are afraid,</p>\n<p class="slindent">Upon a sudden leave their food alone,</p>\n<p class="slindent">Because they are assailed by greater care;</p></div>\n\n<div class="stanza"><p>So that fresh company did I behold</p>\n<p class="slindent">The song relinquish, and go tow&rsquo;rds the hill,</p>\n<p class="slindent">As one who goes, and knows not whitherward;</p></div>\n\n<div class="stanza"><p>Nor was our own departure less in haste.</p></div>','<p class="cantohead">Purgatorio: Canto III</p>\n<div class="stanza"><p>Inasmuch as the instantaneous flight</p>\n<p class="slindent">Had scattered them asunder o&rsquo;et the plain,</p>\n<p class="slindent">Turned to the mountain whither reason spurs us,</p></div>\n\n<div class="stanza"><p>I pressed me close unto my faithful comrade,</p>\n<p class="slindent">And how without him had I kept my course?</p>\n<p class="slindent">Who would have led me up along the mountain?</p></div>\n\n<div class="stanza"><p>He seemed to me within himself remorseful;</p>\n<p class="slindent">O noble conscience, and without a stain,</p>\n<p class="slindent">How sharp a sting is trivial fault to thee!</p></div>\n\n<div class="stanza"><p>After his feet had laid aside the haste</p>\n<p class="slindent">Which mars the dignity of every act,</p>\n<p class="slindent">My mind, that hitherto had been restrained,</p></div>\n\n<div class="stanza"><p>Let loose its faculties as if delighted,</p>\n<p class="slindent">And I my sight directed to the hill</p>\n<p class="slindent">That highest tow&rsquo;rds the heaven uplifts itself.</p></div>\n\n<div class="stanza"><p>The sun, that in our rear was flaming red,</p>\n<p class="slindent">Was broken in front of me into the figure</p>\n<p class="slindent">Which had in me the stoppage of its rays;</p></div>\n\n<div class="stanza"><p>Unto one side I turned me, with the fear</p>\n<p class="slindent">Of being left alone, when I beheld</p>\n<p class="slindent">Only in front of me the ground obscured.</p></div>\n\n<div class="stanza"><p>&ldquo;Why dost thou still mistrust?&rdquo; my Comforter</p>\n<p class="slindent">Began to say to me turned wholly round;</p>\n<p class="slindent">&ldquo;Dost thou not think me with thee, and that I guide thee?</p></div>\n\n<div class="stanza"><p>&rsquo;Tis evening there already where is buried</p>\n<p class="slindent">The body within which I cast a shadow;</p>\n<p class="slindent">&rsquo;Tis from Brundusium ta&rsquo;en, and Naples has it.</p></div>\n\n<div class="stanza"><p>Now if in front of me no shadow fall,</p>\n<p class="slindent">Marvel not at it more than at the heavens,</p>\n<p class="slindent">Because one ray impedeth not another</p></div>\n\n<div class="stanza"><p>To suffer torments, both of cold and heat,</p>\n<p class="slindent">Bodies like this that Power provides, which wills</p>\n<p class="slindent">That how it works be not unveiled to us.</p></div>\n\n<div class="stanza"><p>Insane is he who hopeth that our reason</p>\n<p class="slindent">Can traverse the illimitable way,</p>\n<p class="slindent">Which the one Substance in three Persons follows!</p></div>\n\n<div class="stanza"><p>Mortals, remain contented at the &lsquo;Quia;&rsquo;</p>\n<p class="slindent">For if ye had been able to see all,</p>\n<p class="slindent">No need there were for Mary to give birth;</p></div>\n\n<div class="stanza"><p>And ye have seen desiring without fruit,</p>\n<p class="slindent">Those whose desire would have been quieted,</p>\n<p class="slindent">Which evermore is given them for a grief.</p></div>\n\n<div class="stanza"><p>I speak of Aristotle and of Plato,</p>\n<p class="slindent">And many others;&rdquo;&mdash;and here bowed his head,</p>\n<p class="slindent">And more he said not, and remained disturbed.</p></div>\n\n<div class="stanza"><p>We came meanwhile unto the mountain&rsquo;s foot;</p>\n<p class="slindent">There so precipitate we found the rock,</p>\n<p class="slindent">That nimble legs would there have been in vain.</p></div>\n\n<div class="stanza"><p>&rsquo;Twixt Lerici and Turbia, the most desert,</p>\n<p class="slindent">The most secluded pathway is a stair</p>\n<p class="slindent">Easy and open, if compared with that.</p></div>\n\n<div class="stanza"><p>&ldquo;Who knoweth now upon which hand the hill</p>\n<p class="slindent">Slopes down,&rdquo; my Master said, his footsteps staying,</p>\n<p class="slindent">&ldquo;So that who goeth without wings may mount?&rdquo;</p></div>\n\n<div class="stanza"><p>And while he held his eyes upon the ground</p>\n<p class="slindent">Examining the nature of the path,</p>\n<p class="slindent">And I was looking up around the rock,</p></div>\n\n<div class="stanza"><p>On the left hand appeared to me a throng</p>\n<p class="slindent">Of souls, that moved their feet in our direction,</p>\n<p class="slindent">And did not seem to move, they came so slowly.</p></div>\n\n<div class="stanza"><p>&ldquo;Lift up thine eyes,&rdquo; I to the Master said;</p>\n<p class="slindent">&ldquo;Behold, on this side, who will give us counsel,</p>\n<p class="slindent">If thou of thine own self can have it not.&rdquo;</p></div>\n\n<div class="stanza"><p>Then he looked at me, and with frank expression</p>\n<p class="slindent">Replied: &ldquo;Let us go there, for they come slowly,</p>\n<p class="slindent">And thou be steadfast in thy hope, sweet son.&rdquo;</p></div>\n\n<div class="stanza"><p>Still was that people as far off from us,</p>\n<p class="slindent">After a thousand steps of ours I say,</p>\n<p class="slindent">As a good thrower with his hand would reach,</p></div>\n\n<div class="stanza"><p>When they all crowded unto the hard masses</p>\n<p class="slindent">Of the high bank, and motionless stood and close,</p>\n<p class="slindent">As he stands still to look who goes in doubt.</p></div>\n\n<div class="stanza"><p>&ldquo;O happy dead!  O spirits elect already!&rdquo;</p>\n<p class="slindent">Virgilius made beginning, &ldquo;by that peace</p>\n<p class="slindent">Which I believe is waiting for you all,</p></div>\n\n<div class="stanza"><p>Tell us upon what side the mountain slopes,</p>\n<p class="slindent">So that the going up be possible,</p>\n<p class="slindent">For to lose time irks him most who most knows.&rdquo;</p></div>\n\n<div class="stanza"><p>As sheep come issuing forth from out the fold</p>\n<p class="slindent">By ones and twos and threes, and the others stand</p>\n<p class="slindent">Timidly, holding down their eyes and nostrils,</p></div>\n\n<div class="stanza"><p>And what the foremost does the others do,</p>\n<p class="slindent">Huddling themselves against her, if she stop,</p>\n<p class="slindent">Simple and quiet and the wherefore know not;</p></div>\n\n<div class="stanza"><p>So moving to approach us thereupon</p>\n<p class="slindent">I saw the leader of that fortunate flock,</p>\n<p class="slindent">Modest in face and dignified in gait.</p></div>\n\n<div class="stanza"><p>As soon as those in the advance saw broken</p>\n<p class="slindent">The light upon the ground at my right side,</p>\n<p class="slindent">So that from me the shadow reached the rock,</p></div>\n\n<div class="stanza"><p>They stopped, and backward drew themselves somewhat;</p>\n<p class="slindent">And all the others, who came after them,</p>\n<p class="slindent">Not knowing why nor wherefore, did the same.</p></div>\n\n<div class="stanza"><p>&ldquo;Without your asking, I confess to you</p>\n<p class="slindent">This is a human body which you see,</p>\n<p class="slindent">Whereby the sunshine on the ground is cleft.</p></div>\n\n<div class="stanza"><p>Marvel ye not thereat, but be persuaded</p>\n<p class="slindent">That not without a power which comes from Heaven</p>\n<p class="slindent">Doth he endeavour to surmount this wall.&rdquo;</p></div>\n\n<div class="stanza"><p>The Master thus; and said those worthy people:</p>\n<p class="slindent">&ldquo;Return ye then, and enter in before us,&rdquo;</p>\n<p class="slindent">Making a signal with the back o&rsquo; the hand</p></div>\n\n<div class="stanza"><p>And one of them began: &ldquo;Whoe&rsquo;et thou art,</p>\n<p class="slindent">Thus going turn thine eyes, consider well</p>\n<p class="slindent">If e&rsquo;et thou saw me in the other world.&rdquo;</p></div>\n\n<div class="stanza"><p>I turned me tow&rsquo;rds him, and looked at him closely;</p>\n<p class="slindent">Blond was he, beautiful, and of noble aspect,</p>\n<p class="slindent">But one of his eyebrows had a blow divided.</p></div>\n\n<div class="stanza"><p>When with humility I had disclaimed</p>\n<p class="slindent">E&rsquo;et having seen him, &ldquo;Now behold!&rdquo; he said,</p>\n<p class="slindent">And showed me high upon his breast a wound.</p></div>\n\n<div class="stanza"><p>Then said he with a smile: &ldquo;I am Manfredi,</p>\n<p class="slindent">The grandson of the Empress Costanza;</p>\n<p class="slindent">Therefore, when thou returnest, I beseech thee</p></div>\n\n<div class="stanza"><p>Go to my daughter beautiful, the mother</p>\n<p class="slindent">Of Sicily&rsquo;s honour and of Aragon&rsquo;s,</p>\n<p class="slindent">And the truth tell her, if aught else be told.</p></div>\n\n<div class="stanza"><p>After I had my body lacerated</p>\n<p class="slindent">By these two mortal stabs, I gave myself</p>\n<p class="slindent">Weeping to Him, who willingly doth pardon.</p></div>\n\n<div class="stanza"><p>Horrible my iniquities had been;</p>\n<p class="slindent">But Infinite Goodness hath such ample arms,</p>\n<p class="slindent">That it receives whatever turns to it.</p></div>\n\n<div class="stanza"><p>Had but Cosenza&rsquo;s pastor, who in chase</p>\n<p class="slindent">Of me was sent by Clement at that time,</p>\n<p class="slindent">In God read understandingly this page,</p></div>\n\n<div class="stanza"><p>The bones of my dead body still would be</p>\n<p class="slindent">At the bridge-head, near unto Benevento,</p>\n<p class="slindent">Under the safeguard of the heavy cairn.</p></div>\n\n<div class="stanza"><p>Now the rain bathes and moveth them the wind,</p>\n<p class="slindent">Beyond the realm, almost beside the Verde,</p>\n<p class="slindent">Where he transported them with tapers quenched.</p></div>\n\n<div class="stanza"><p>By malison of theirs is not so lost</p>\n<p class="slindent">Eternal Love, that it cannot return,</p>\n<p class="slindent">So long as hope has anything of green.</p></div>\n\n<div class="stanza"><p>True is it, who in contumacy dies</p>\n<p class="slindent">Of Holy Church, though penitent at last,</p>\n<p class="slindent">Must wait upon the outside this bank</p></div>\n\n<div class="stanza"><p>Thirty times told the time that he has been</p>\n<p class="slindent">In his presumption, unless such decree</p>\n<p class="slindent">Shorter by means of righteous prayers become.</p></div>\n\n<div class="stanza"><p>See now if thou hast power to make me happy,</p>\n<p class="slindent">By making known unto my good Costanza</p>\n<p class="slindent">How thou hast seen me, and this ban beside,</p></div>\n\n<div class="stanza"><p>For those on earth can much advance us here.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto IV</p>\n<div class="stanza"><p>Whenever by delight or else by pain,</p>\n<p class="slindent">That seizes any faculty of ours,</p>\n<p class="slindent">Wholly to that the soul collects itself,</p></div>\n\n<div class="stanza"><p>It seemeth that no other power it heeds;</p>\n<p class="slindent">And this against that error is which thinks</p>\n<p class="slindent">One soul above another kindles in us.</p></div>\n\n<div class="stanza"><p>And hence, whenever aught is heard or seen</p>\n<p class="slindent">Which keeps the soul intently bent upon it,</p>\n<p class="slindent">Time passes on, and we perceive it not,</p></div>\n\n<div class="stanza"><p>Because one faculty is that which listens,</p>\n<p class="slindent">And other that which the soul keeps entire;</p>\n<p class="slindent">This is as if in bonds, and that is free.</p></div>\n\n<div class="stanza"><p>Of this I had experience positive</p>\n<p class="slindent">In hearing and in gazing at that spirit;</p>\n<p class="slindent">For fifty full degrees uprisen was</p></div>\n\n<div class="stanza"><p>The sun, and I had not perceived it, when</p>\n<p class="slindent">We came to where those souls with one accord</p>\n<p class="slindent">Cried out unto us: &ldquo;Here is what you ask.&rdquo;</p></div>\n\n<div class="stanza"><p>A greater opening ofttimes hedges up</p>\n<p class="slindent">With but a little forkful of his thorns</p>\n<p class="slindent">The villager, what time the grape imbrowns,</p></div>\n\n<div class="stanza"><p>Than was the passage-way through which ascended</p>\n<p class="slindent">Only my Leader and myself behind him,</p>\n<p class="slindent">After that company departed from us.</p></div>\n\n<div class="stanza"><p>One climbs Sanleo and descends in Noli,</p>\n<p class="slindent">And mounts the summit of Bismantova,</p>\n<p class="slindent">With feet alone; but here one needs must fly;</p></div>\n\n<div class="stanza"><p>With the swift pinions and the plumes I say</p>\n<p class="slindent">Of great desire, conducted after him</p>\n<p class="slindent">Who gave me hope, and made a light for me.</p></div>\n\n<div class="stanza"><p>We mounted upward through the rifted rock,</p>\n<p class="slindent">And on each side the border pressed upon us,</p>\n<p class="slindent">And feet and hands the ground beneath required.</p></div>\n\n<div class="stanza"><p>When we were come upon the upper rim</p>\n<p class="slindent">Of the high bank, out on the open slope,</p>\n<p class="slindent">&ldquo;My Master,&rdquo; said I, &ldquo;what way shall we take?&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;No step of thine descend;</p>\n<p class="slindent">Still up the mount behind me win thy way,</p>\n<p class="slindent">Till some sage escort shall appear to us.&rdquo;</p></div>\n\n<div class="stanza"><p>The summit was so high it vanquished sight,</p>\n<p class="slindent">And the hillside precipitous far more</p>\n<p class="slindent">Than line from middle quadrant to the centre.</p></div>\n\n<div class="stanza"><p>Spent with fatigue was I, when I began:</p>\n<p class="slindent">&ldquo;O my sweet Father! turn thee and behold</p>\n<p class="slindent">How I remain alone, unless thou stay!&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O son,&rdquo; he said, &ldquo;up yonder drag thyself,&rdquo;</p>\n<p class="slindent">Pointing me to a terrace somewhat higher,</p>\n<p class="slindent">Which on that side encircles all the hill.</p></div>\n\n<div class="stanza"><p>These words of his so spurred me on, that I</p>\n<p class="slindent">Strained every nerve, behind him scrambling up,</p>\n<p class="slindent">Until the circle was beneath my feet.</p></div>\n\n<div class="stanza"><p>Thereon ourselves we seated both of us</p>\n<p class="slindent">Turned to the East, from which we had ascended,</p>\n<p class="slindent">For all men are delighted to look back.</p></div>\n\n<div class="stanza"><p>To the low shores mine eyes I first directed,</p>\n<p class="slindent">Then to the sun uplifted them, and wondered</p>\n<p class="slindent">That on the left hand we were smitten by it.</p></div>\n\n<div class="stanza"><p>The Poet well perceived that I was wholly</p>\n<p class="slindent">Bewildered at the chariot of the light,</p>\n<p class="slindent">Where &rsquo;twixt us and the Aquilon it entered.</p></div>\n\n<div class="stanza"><p>Whereon he said to me: &ldquo;If Castor and Pollux</p>\n<p class="slindent">Were in the company of yonder mirror,</p>\n<p class="slindent">That up and down conducteth with its light,</p></div>\n\n<div class="stanza"><p>Thou wouldst behold the zodiac&rsquo;s jagged wheel</p>\n<p class="slindent">Revolving still more near unto the Bears,</p>\n<p class="slindent">Unless it swerved aside from its old track.</p></div>\n\n<div class="stanza"><p>How that may be wouldst thou have power to think,</p>\n<p class="slindent">Collected in thyself, imagine Zion</p>\n<p class="slindent">Together with this mount on earth to stand,</p></div>\n\n<div class="stanza"><p>So that they both one sole horizon have,</p>\n<p class="slindent">And hemispheres diverse; whereby the road</p>\n<p class="slindent">Which Phaeton, alas! knew not to drive,</p></div>\n\n<div class="stanza"><p>Thou&rsquo;lt see how of necessity must pass</p>\n<p class="slindent">This on one side, when that upon the other,</p>\n<p class="slindent">If thine intelligence right clearly heed.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Truly, my Master,&rdquo; said I, &ldquo;never yet</p>\n<p class="slindent">Saw I so clearly as I now discern,</p>\n<p class="slindent">There where my wit appeared incompetent,</p></div>\n\n<div class="stanza"><p>That the mid-circle of supernal motion,</p>\n<p class="slindent">Which in some art is the Equator called,</p>\n<p class="slindent">And aye remains between the Sun and Winter,</p></div>\n\n<div class="stanza"><p>For reason which thou sayest, departeth hence</p>\n<p class="slindent">Tow&rsquo;rds the Septentrion, what time the Hebrews</p>\n<p class="slindent">Beheld it tow&rsquo;rds the region of the heat.</p></div>\n\n<div class="stanza"><p>But, if it pleaseth thee, I fain would learn</p>\n<p class="slindent">How far we have to go; for the hill rises</p>\n<p class="slindent">Higher than eyes of mine have power to rise.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;This mount is such, that ever</p>\n<p class="slindent">At the beginning down below &rsquo;tis tiresome,</p>\n<p class="slindent">And aye the more one climbs, the less it hurts.</p></div>\n\n<div class="stanza"><p>Therefore, when it shall seem so pleasant to thee,</p>\n<p class="slindent">That going up shall be to thee as easy</p>\n<p class="slindent">As going down the current in a boat,</p></div>\n\n<div class="stanza"><p>Then at this pathway&rsquo;s ending thou wilt be;</p>\n<p class="slindent">There to repose thy panting breath expect;</p>\n<p class="slindent">No more I answer; and this I know for true.&rdquo;</p></div>\n\n<div class="stanza"><p>And as he finished uttering these words,</p>\n<p class="slindent">A voice close by us sounded: &ldquo;Peradventure</p>\n<p class="slindent">Thou wilt have need of sitting down ere that.&rdquo;</p></div>\n\n<div class="stanza"><p>At sound thereof each one of us turned round,</p>\n<p class="slindent">And saw upon the left hand a great rock,</p>\n<p class="slindent">Which neither I nor he before had noticed.</p></div>\n\n<div class="stanza"><p>Thither we drew; and there were persons there</p>\n<p class="slindent">Who in the shadow stood behind the rock,</p>\n<p class="slindent">As one through indolence is wont to stand.</p></div>\n\n<div class="stanza"><p>And one of them, who seemed to me fatigued,</p>\n<p class="slindent">Was sitting down, and both his knees embraced,</p>\n<p class="slindent">Holding his face low down between them bowed.</p></div>\n\n<div class="stanza"><p>&ldquo;O my sweet Lord,&rdquo; I said, &ldquo;do turn thine eye</p>\n<p class="slindent">On him who shows himself more negligent</p>\n<p class="slindent">Then even Sloth herself his sister were.&rdquo;</p></div>\n\n<div class="stanza"><p>Then he turned round to us, and he gave heed,</p>\n<p class="slindent">Just lifting up his eyes above his thigh,</p>\n<p class="slindent">And said: &ldquo;Now go thou up, for thou art valiant.&rdquo;</p></div>\n\n<div class="stanza"><p>Then knew I who he was; and the distress,</p>\n<p class="slindent">That still a little did my breathing quicken,</p>\n<p class="slindent">My going to him hindered not; and after</p></div>\n\n<div class="stanza"><p>I came to him he hardly raised his head,</p>\n<p class="slindent">Saying: &ldquo;Hast thou seen clearly how the sun</p>\n<p class="slindent">O&rsquo;et thy left shoulder drives his chariot?&rdquo;</p></div>\n\n<div class="stanza"><p>His sluggish attitude and his curt words</p>\n<p class="slindent">A little unto laughter moved my lips;</p>\n<p class="slindent">Then I began: &ldquo;Belacqua, I grieve not</p></div>\n\n<div class="stanza"><p>For thee henceforth; but tell me, wherefore seated</p>\n<p class="slindent">In this place art thou?  Waitest thou an escort?</p>\n<p class="slindent">Or has thy usual habit seized upon thee?&rdquo;</p></div>\n\n<div class="stanza"><p>And he: &ldquo;O brother, what&rsquo;s the use of climbing?</p>\n<p class="slindent">Since to my torment would not let me go</p>\n<p class="slindent">The Angel of God, who sitteth at the gate.</p></div>\n\n<div class="stanza"><p>First heaven must needs so long revolve me round</p>\n<p class="slindent">Outside thereof, as in my life it did,</p>\n<p class="slindent">Since the good sighs I to the end postponed,</p></div>\n\n<div class="stanza"><p>Unless, e&rsquo;et that, some prayer may bring me aid</p>\n<p class="slindent">Which rises from a heart that lives in grace;</p>\n<p class="slindent">What profit others that in heaven are heard not?&rdquo;</p></div>\n\n<div class="stanza"><p>Meanwhile the Poet was before me mounting,</p>\n<p class="slindent">And saying: &ldquo;Come now; see the sun has touched</p>\n<p class="slindent">Meridian, and from the shore the night</p></div>\n\n<div class="stanza"><p>Covers already with her foot Morocco.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto V</p>\n<div class="stanza"><p>I had already from those shades departed,</p>\n<p class="slindent">And followed in the footsteps of my Guide,</p>\n<p class="slindent">When from behind, pointing his finger at me,</p></div>\n\n<div class="stanza"><p>One shouted: &ldquo;See, it seems as if shone not</p>\n<p class="slindent">The sunshine on the left of him below,</p>\n<p class="slindent">And like one living seems he to conduct him.&rdquo;</p></div>\n\n<div class="stanza"><p>Mine eyes I turned at utterance of these words,</p>\n<p class="slindent">And saw them watching with astonishment</p>\n<p class="slindent">But me, but me, and the light which was broken!</p></div>\n\n<div class="stanza"><p>&ldquo;Why doth thy mind so occupy itself,&rdquo;</p>\n<p class="slindent">The Master said, &ldquo;that thou thy pace dost slacken?</p>\n<p class="slindent">What matters it to thee what here is whispered?</p></div>\n\n<div class="stanza"><p>Come after me, and let the people talk;</p>\n<p class="slindent">Stand like a steadfast tower, that never wags</p>\n<p class="slindent">Its top for all the blowing of the winds;</p></div>\n\n<div class="stanza"><p>For evermore the man in whom is springing</p>\n<p class="slindent">Thought upon thought, removes from him the mark,</p>\n<p class="slindent">Because the force of one the other weakens.&rdquo;</p></div>\n\n<div class="stanza"><p>What could I say in answer but &ldquo;I come&rdquo;?</p>\n<p class="slindent">I said it somewhat with that colour tinged</p>\n<p class="slindent">Which makes a man of pardon sometimes worthy.</p></div>\n\n<div class="stanza"><p>Meanwhile along the mountain-side across</p>\n<p class="slindent">Came people in advance of us a little,</p>\n<p class="slindent">Singing the Miserere verse by verse.</p></div>\n\n<div class="stanza"><p>When they became aware I gave no place</p>\n<p class="slindent">For passage of the sunshine through my body,</p>\n<p class="slindent">They changed their song into a long, hoarse &ldquo;Oh!&rdquo;</p></div>\n\n<div class="stanza"><p>And two of them, in form of messengers,</p>\n<p class="slindent">Ran forth to meet us, and demanded of us,</p>\n<p class="slindent">&ldquo;Of your condition make us cognisant.&rdquo;</p></div>\n\n<div class="stanza"><p>And said my Master: &ldquo;Ye can go your way</p>\n<p class="slindent">And carry back again to those who sent you,</p>\n<p class="slindent">That this one&rsquo;s body is of very flesh.</p></div>\n\n<div class="stanza"><p>If they stood still because they saw his shadow,</p>\n<p class="slindent">As I suppose, enough is answered them;</p>\n<p class="slindent">Him let them honour, it may profit them.&rdquo;</p></div>\n\n<div class="stanza"><p>Vapours enkindled saw I ne&rsquo;et so swiftly</p>\n<p class="slindent">At early nightfall cleave the air serene,</p>\n<p class="slindent">Nor, at the set of sun, the clouds of August,</p></div>\n\n<div class="stanza"><p>But upward they returned in briefer time,</p>\n<p class="slindent">And, on arriving, with the others wheeled</p>\n<p class="slindent">Tow&rsquo;rds us, like troops that run without a rein.</p></div>\n\n<div class="stanza"><p>&ldquo;This folk that presses unto us is great,</p>\n<p class="slindent">And cometh to implore thee,&rdquo; said the Poet;</p>\n<p class="slindent">&ldquo;So still go onward, and in going listen.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O soul that goest to beatitude</p>\n<p class="slindent">With the same members wherewith thou wast born,&rdquo;</p>\n<p class="slindent">Shouting they came, &ldquo;a little stay thy steps,</p></div>\n\n<div class="stanza"><p>Look, if thou e&rsquo;et hast any of us seen,</p>\n<p class="slindent">So that o&rsquo;et yonder thou bear news of him;</p>\n<p class="slindent">Ah, why dost thou go on?  Ah, why not stay?</p></div>\n\n<div class="stanza"><p>Long since we all were slain by violence,</p>\n<p class="slindent">And sinners even to the latest hour;</p>\n<p class="slindent">Then did a light from heaven admonish us,</p></div>\n\n<div class="stanza"><p>So that, both penitent and pardoning, forth</p>\n<p class="slindent">From life we issued reconciled to God,</p>\n<p class="slindent">Who with desire to see Him stirs our hearts.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;Although I gaze into your faces,</p>\n<p class="slindent">No one I recognize; but if may please you</p>\n<p class="slindent">Aught I have power to do, ye well-born spirits,</p></div>\n\n<div class="stanza"><p>Speak ye, and I will do it, by that peace</p>\n<p class="slindent">Which, following the feet of such a Guide,</p>\n<p class="slindent">From world to world makes itself sought by me.&rdquo;</p></div>\n\n<div class="stanza"><p>And one began: &ldquo;Each one has confidence</p>\n<p class="slindent">In thy good offices without an oath,</p>\n<p class="slindent">Unless the I cannot cut off the I will;</p></div>\n\n<div class="stanza"><p>Whence I, who speak alone before the others,</p>\n<p class="slindent">Pray thee, if ever thou dost see the land</p>\n<p class="slindent">That &rsquo;twixt Romagna lies and that of Charles,</p></div>\n\n<div class="stanza"><p>Thou be so courteous to me of thy prayers</p>\n<p class="slindent">In Fano, that they pray for me devoutly,</p>\n<p class="slindent">That I may purge away my grave offences.</p></div>\n\n<div class="stanza"><p>From thence was I; but the deep wounds, through which</p>\n<p class="slindent">Issued the blood wherein I had my seat,</p>\n<p class="slindent">Were dealt me in bosom of the Antenori,</p></div>\n\n<div class="stanza"><p>There where I thought to be the most secure;</p>\n<p class="slindent">&rsquo;Twas he of Este had it done, who held me</p>\n<p class="slindent">In hatred far beyond what justice willed.</p></div>\n\n<div class="stanza"><p>But if towards the Mira I had fled,</p>\n<p class="slindent">When I was overtaken at Oriaco,</p>\n<p class="slindent">I still should be o&rsquo;et yonder where men breathe.</p></div>\n\n<div class="stanza"><p>I ran to the lagoon, and reeds and mire</p>\n<p class="slindent">Did so entangle me I fell, and saw there</p>\n<p class="slindent">A lake made from my veins upon the ground.&rdquo;</p></div>\n\n<div class="stanza"><p>Then said another: &ldquo;Ah, be that desire</p>\n<p class="slindent">Fulfilled that draws thee to the lofty mountain,</p>\n<p class="slindent">As thou with pious pity aidest mine.</p></div>\n\n<div class="stanza"><p>I was of Montefeltro, and am Buonconte;</p>\n<p class="slindent">Giovanna, nor none other cares for me;</p>\n<p class="slindent">Hence among these I go with downcast front.&rdquo;</p></div>\n\n<div class="stanza"><p>And I to him: &ldquo;What violence or what chance</p>\n<p class="slindent">Led thee astray so far from Campaldino,</p>\n<p class="slindent">That never has thy sepulture been known?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Oh,&rdquo; he replied, &ldquo;at Casentino&rsquo;s foot</p>\n<p class="slindent">A river crosses named Archiano, born</p>\n<p class="slindent">Above the Hermitage in Apennine.</p></div>\n\n<div class="stanza"><p>There where the name thereof becometh void</p>\n<p class="slindent">Did I arrive, pierced through and through the throat,</p>\n<p class="slindent">Fleeing on foot, and bloodying the plain;</p></div>\n\n<div class="stanza"><p>There my sight lost I, and my utterance</p>\n<p class="slindent">Ceased in the name of Mary, and thereat</p>\n<p class="slindent">I fell, and tenantless my flesh remained.</p></div>\n\n<div class="stanza"><p>Truth will I speak, repeat it to the living;</p>\n<p class="slindent">God&rsquo;s Angel took me up, and he of hell</p>\n<p class="slindent">Shouted: &lsquo;O thou from heaven, why dost thou rob me?</p></div>\n\n<div class="stanza"><p>Thou bearest away the eternal part of him,</p>\n<p class="slindent">For one poor little tear, that takes him from me;</p>\n<p class="slindent">But with the rest I&rsquo;ll deal in other fashion!&rsquo;</p></div>\n\n<div class="stanza"><p>Well knowest thou how in the air is gathered</p>\n<p class="slindent">That humid vapour which to water turns,</p>\n<p class="slindent">Soon as it rises where the cold doth grasp it.</p></div>\n\n<div class="stanza"><p>He joined that evil will, which aye seeks evil,</p>\n<p class="slindent">To intellect, and moved the mist and wind</p>\n<p class="slindent">By means of power, which his own nature gave;</p></div>\n\n<div class="stanza"><p>Thereafter, when the day was spent, the valley</p>\n<p class="slindent">From Pratomagno to the great yoke covered</p>\n<p class="slindent">With fog, and made the heaven above intent,</p></div>\n\n<div class="stanza"><p>So that the pregnant air to water changed;</p>\n<p class="slindent">Down fell the rain, and to the gullies came</p>\n<p class="slindent">Whate&rsquo;et of it earth tolerated not;</p></div>\n\n<div class="stanza"><p>And as it mingled with the mighty torrents,</p>\n<p class="slindent">Towards the royal river with such speed</p>\n<p class="slindent">It headlong rushed, that nothing held it back.</p></div>\n\n<div class="stanza"><p>My frozen body near unto its outlet</p>\n<p class="slindent">The robust Archian found, and into Arno</p>\n<p class="slindent">Thrust it, and loosened from my breast the cross</p></div>\n\n<div class="stanza"><p>I made of me, when agony o&rsquo;etcame me;</p>\n<p class="slindent">It rolled me on the banks and on the bottom,</p>\n<p class="slindent">Then with its booty covered and begirt me.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Ah, when thou hast returned unto the world,</p>\n<p class="slindent">And rested thee from thy long journeying,&rdquo;</p>\n<p class="slindent">After the second followed the third spirit,</p></div>\n\n<div class="stanza"><p>&ldquo;Do thou remember me who am the Pia;</p>\n<p class="slindent">Siena made me, unmade me Maremma;</p>\n<p class="slindent">He knoweth it, who had encircled first,</p></div>\n\n<div class="stanza"><p>Espousing me, my finger with his gem.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto VI</p>\n<div class="stanza"><p>Whene&rsquo;et is broken up the game of Zara,</p>\n<p class="slindent">He who has lost remains behind despondent,</p>\n<p class="slindent">The throws repeating, and in sadness learns;</p></div>\n\n<div class="stanza"><p>The people with the other all depart;</p>\n<p class="slindent">One goes in front, and one behind doth pluck him,</p>\n<p class="slindent">And at his side one brings himself to mind;</p></div>\n\n<div class="stanza"><p>He pauses not, and this and that one hears;</p>\n<p class="slindent">They crowd no more to whom his hand he stretches,</p>\n<p class="slindent">And from the throng he thus defends himself.</p></div>\n\n<div class="stanza"><p>Even such was I in that dense multitude,</p>\n<p class="slindent">Turning to them this way and that my face,</p>\n<p class="slindent">And, promising, I freed myself therefrom.</p></div>\n\n<div class="stanza"><p>There was the Aretine, who from the arms</p>\n<p class="slindent">Untamed of Ghin di Tacco had his death,</p>\n<p class="slindent">And he who fleeing from pursuit was drowned.</p></div>\n\n<div class="stanza"><p>There was imploring with his hands outstretched</p>\n<p class="slindent">Frederick Novello, and that one of Pisa</p>\n<p class="slindent">Who made the good Marzucco seem so strong.</p></div>\n\n<div class="stanza"><p>I saw Count Orso; and the soul divided</p>\n<p class="slindent">By hatred and by envy from its body,</p>\n<p class="slindent">As it declared, and not for crime committed,</p></div>\n\n<div class="stanza"><p>Pierre de la Brosse I say; and here provide</p>\n<p class="slindent">While still on earth the Lady of Brabant,</p>\n<p class="slindent">So that for this she be of no worse flock!</p></div>\n\n<div class="stanza"><p>As soon as I was free from all those shades</p>\n<p class="slindent">Who only prayed that some one else may pray,</p>\n<p class="slindent">So as to hasten their becoming holy,</p></div>\n\n<div class="stanza"><p>Began I: &ldquo;It appears that thou deniest,</p>\n<p class="slindent">O light of mine, expressly in some text,</p>\n<p class="slindent">That orison can bend decree of Heaven;</p></div>\n\n<div class="stanza"><p>And ne&rsquo;ettheless these people pray for this.</p>\n<p class="slindent">Might then their expectation bootless be?</p>\n<p class="slindent">Or is to me thy saying not quite clear?&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;My writing is explicit,</p>\n<p class="slindent">And not fallacious is the hope of these,</p>\n<p class="slindent">If with sane intellect &rsquo;tis well regarded;</p></div>\n\n<div class="stanza"><p>For top of judgment doth not vail itself,</p>\n<p class="slindent">Because the fire of love fulfils at once</p>\n<p class="slindent">What he must satisfy who here installs him.</p></div>\n\n<div class="stanza"><p>And there, where I affirmed that proposition,</p>\n<p class="slindent">Defect was not amended by a prayer,</p>\n<p class="slindent">Because the prayer from God was separate.</p></div>\n\n<div class="stanza"><p>Verily, in so deep a questioning</p>\n<p class="slindent">Do not decide, unless she tell it thee,</p>\n<p class="slindent">Who light &rsquo;twixt truth and intellect shall be.</p></div>\n\n<div class="stanza"><p>I know not if thou understand; I speak</p>\n<p class="slindent">Of Beatrice; her shalt thou see above,</p>\n<p class="slindent">Smiling and happy, on this mountain&rsquo;s top.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;Good Leader, let us make more haste,</p>\n<p class="slindent">For I no longer tire me as before;</p>\n<p class="slindent">And see, e&rsquo;en now the hill a shadow casts.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;We will go forward with this day&rdquo; he answered,</p>\n<p class="slindent">&ldquo;As far as now is possible for us;</p>\n<p class="slindent">But otherwise the fact is than thou thinkest.</p></div>\n\n<div class="stanza"><p>Ere thou art up there, thou shalt see return</p>\n<p class="slindent">Him, who now hides himself behind the hill,</p>\n<p class="slindent">So that thou dost not interrupt his rays.</p></div>\n\n<div class="stanza"><p>But yonder there behold! a soul that stationed</p>\n<p class="slindent">All, all alone is looking hitherward;</p>\n<p class="slindent">It will point out to us the quickest way.&rdquo;</p></div>\n\n<div class="stanza"><p>We came up unto it; O Lombard soul,</p>\n<p class="slindent">How lofty and disdainful thou didst bear thee,</p>\n<p class="slindent">And grand and slow in moving of thine eyes!</p></div>\n\n<div class="stanza"><p>Nothing whatever did it say to us,</p>\n<p class="slindent">But let us go our way, eying us only</p>\n<p class="slindent">After the manner of a couchant lion;</p></div>\n\n<div class="stanza"><p>Still near to it Virgilius drew, entreating</p>\n<p class="slindent">That it would point us out the best ascent;</p>\n<p class="slindent">And it replied not unto his demand,</p></div>\n\n<div class="stanza"><p>But of our native land and of our life</p>\n<p class="slindent">It questioned us; and the sweet Guide began:</p>\n<p class="slindent">&ldquo;Mantua,&rdquo;&mdash;and the shade, all in itself recluse,</p></div>\n\n<div class="stanza"><p>Rose tow&rsquo;rds him from the place where first it was,</p>\n<p class="slindent">Saying: &ldquo;O Mantuan, I am Sordello</p>\n<p class="slindent">Of thine own land!&rdquo; and one embraced the other.</p></div>\n\n<div class="stanza"><p>Ah! servile Italy, grief&rsquo;s hostelry!</p>\n<p class="slindent">A ship without a pilot in great tempest!</p>\n<p class="slindent">No Lady thou of Provinces, but brothel!</p></div>\n\n<div class="stanza"><p>That noble soul was so impatient, only</p>\n<p class="slindent">At the sweet sound of his own native land,</p>\n<p class="slindent">To make its citizen glad welcome there;</p></div>\n\n<div class="stanza"><p>And now within thee are not without war</p>\n<p class="slindent">Thy living ones, and one doth gnaw the other</p>\n<p class="slindent">Of those whom one wall and one fosse shut in!</p></div>\n\n<div class="stanza"><p>Search, wretched one, all round about the shores</p>\n<p class="slindent">Thy seaboard, and then look within thy bosom,</p>\n<p class="slindent">If any part of thee enjoyeth peace!</p></div>\n\n<div class="stanza"><p>What boots it, that for thee Justinian</p>\n<p class="slindent">The bridle mend, if empty be the saddle?</p>\n<p class="slindent">Withouten this the shame would be the less.</p></div>\n\n<div class="stanza"><p>Ah! people, thou that oughtest to be devout,</p>\n<p class="slindent">And to let Caesar sit upon the saddle,</p>\n<p class="slindent">If well thou hearest what God teacheth thee,</p></div>\n\n<div class="stanza"><p>Behold how fell this wild beast has become,</p>\n<p class="slindent">Being no longer by the spur corrected,</p>\n<p class="slindent">Since thou hast laid thy hand upon the bridle.</p></div>\n\n<div class="stanza"><p>O German Albert! who abandonest</p>\n<p class="slindent">Her that has grown recalcitrant and savage,</p>\n<p class="slindent">And oughtest to bestride her saddle-bow,</p></div>\n\n<div class="stanza"><p>May a just judgment from the stars down fall</p>\n<p class="slindent">Upon thy blood, and be it new and open,</p>\n<p class="slindent">That thy successor may have fear thereof;</p></div>\n\n<div class="stanza"><p>Because thy father and thyself have suffered,</p>\n<p class="slindent">By greed of those transalpine lands distrained,</p>\n<p class="slindent">The garden of the empire to be waste.</p></div>\n\n<div class="stanza"><p>Come and behold Montecchi and Cappelletti,</p>\n<p class="slindent">Monaldi and Fillippeschi, careless man!</p>\n<p class="slindent">Those sad already, and these doubt-depressed!</p></div>\n\n<div class="stanza"><p>Come, cruel one! come and behold the oppression</p>\n<p class="slindent">Of thy nobility, and cure their wounds,</p>\n<p class="slindent">And thou shalt see how safe is Santafiore!</p></div>\n\n<div class="stanza"><p>Come and behold thy Rome, that is lamenting,</p>\n<p class="slindent">Widowed, alone, and day and night exclaims,</p>\n<p class="slindent">&ldquo;My Caesar, why hast thou forsaken me?&rdquo;</p></div>\n\n<div class="stanza"><p>Come and behold how loving are the people;</p>\n<p class="slindent">And if for us no pity moveth thee,</p>\n<p class="slindent">Come and be made ashamed of thy renown!</p></div>\n\n<div class="stanza"><p>And if it lawful be, O Jove Supreme!</p>\n<p class="slindent">Who upon earth for us wast crucified,</p>\n<p class="slindent">Are thy just eyes averted otherwhere?</p></div>\n\n<div class="stanza"><p>Or preparation is &rsquo;t, that, in the abyss</p>\n<p class="slindent">Of thine own counsel, for some good thou makest</p>\n<p class="slindent">From our perception utterly cut off?</p></div>\n\n<div class="stanza"><p>For all the towns of Italy are full</p>\n<p class="slindent">Of tyrants, and becometh a Marcellus</p>\n<p class="slindent">Each peasant churl who plays the partisan!</p></div>\n\n<div class="stanza"><p>My Florence! well mayst thou contented be</p>\n<p class="slindent">With this digression, which concerns thee not,</p>\n<p class="slindent">Thanks to thy people who such forethought take!</p></div>\n\n<div class="stanza"><p>Many at heart have justice, but shoot slowly,</p>\n<p class="slindent">That unadvised they come not to the bow,</p>\n<p class="slindent">But on their very lips thy people have it!</p></div>\n\n<div class="stanza"><p>Many refuse to bear the common burden;</p>\n<p class="slindent">But thy solicitous people answereth</p>\n<p class="slindent">Without being asked, and crieth: &ldquo;I submit.&rdquo;</p></div>\n\n<div class="stanza"><p>Now be thou joyful, for thou hast good reason;</p>\n<p class="slindent">Thou affluent, thou in peace, thou full of wisdom!</p>\n<p class="slindent">If I speak true, the event conceals it not.</p></div>\n\n<div class="stanza"><p>Athens and Lacedaemon, they who made</p>\n<p class="slindent">The ancient laws, and were so civilized,</p>\n<p class="slindent">Made towards living well a little sign</p></div>\n\n<div class="stanza"><p>Compared with thee, who makest such fine-spun</p>\n<p class="slindent">Provisions, that to middle of November</p>\n<p class="slindent">Reaches not what thou in October spinnest.</p></div>\n\n<div class="stanza"><p>How oft, within the time of thy remembrance,</p>\n<p class="slindent">Laws, money, offices, and usages</p>\n<p class="slindent">Hast thou remodelled, and renewed thy members?</p></div>\n\n<div class="stanza"><p>And if thou mind thee well, and see the light,</p>\n<p class="slindent">Thou shalt behold thyself like a sick woman,</p>\n<p class="slindent">Who cannot find repose upon her down,</p></div>\n\n<div class="stanza"><p>But by her tossing wardeth off her pain.</p></div>','<p class="cantohead">Purgatorio: Canto VII</p>\n<div class="stanza"><p>After the gracious and glad salutations</p>\n<p class="slindent">Had three and four times been reiterated,</p>\n<p class="slindent">Sordello backward drew and said, &ldquo;Who are you?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Or ever to this mountain were directed</p>\n<p class="slindent">The souls deserving to ascend to God,</p>\n<p class="slindent">My bones were buried by Octavian.</p></div>\n\n<div class="stanza"><p>I am Virgilius; and for no crime else</p>\n<p class="slindent">Did I lose heaven, than for not having faith;&rdquo;</p>\n<p class="slindent">In this wise then my Leader made reply.</p></div>\n\n<div class="stanza"><p>As one who suddenly before him sees</p>\n<p class="slindent">Something whereat he marvels, who believes</p>\n<p class="slindent">And yet does not, saying, &ldquo;It is! it is not!&rdquo;</p></div>\n\n<div class="stanza"><p>So he appeared; and then bowed down his brow,</p>\n<p class="slindent">And with humility returned towards him,</p>\n<p class="slindent">And, where inferiors embrace, embraced him.</p></div>\n\n<div class="stanza"><p>&ldquo;O glory of the Latians, thou,&rdquo; he said,</p>\n<p class="slindent">&ldquo;Through whom our language showed what it could do</p>\n<p class="slindent">O pride eternal of the place I came from,</p></div>\n\n<div class="stanza"><p>What merit or what grace to me reveals thee?</p>\n<p class="slindent">If I to hear thy words be worthy, tell me</p>\n<p class="slindent">If thou dost come from Hell, and from what cloister.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Through all the circles of the doleful realm,&rdquo;</p>\n<p class="slindent">Responded he, &ldquo;have I come hitherward;</p>\n<p class="slindent">Heaven&rsquo;s power impelled me, and with that I come.</p></div>\n\n<div class="stanza"><p>I by not doing, not by doing, lost</p>\n<p class="slindent">The sight of that high sun which thou desirest,</p>\n<p class="slindent">And which too late by me was recognized.</p></div>\n\n<div class="stanza"><p>A place there is below not sad with torments,</p>\n<p class="slindent">But darkness only, where the lamentations</p>\n<p class="slindent">Have not the sound of wailing, but are sighs.</p></div>\n\n<div class="stanza"><p>There dwell I with the little innocents</p>\n<p class="slindent">Snatched by the teeth of Death, or ever they</p>\n<p class="slindent">Were from our human sinfulness exempt.</p></div>\n\n<div class="stanza"><p>There dwell I among those who the three saintly</p>\n<p class="slindent">Virtues did not put on, and without vice</p>\n<p class="slindent">The others knew and followed all of them.</p></div>\n\n<div class="stanza"><p>But if thou know and can, some indication</p>\n<p class="slindent">Give us by which we may the sooner come</p>\n<p class="slindent">Where Purgatory has its right beginning.&rdquo;</p></div>\n\n<div class="stanza"><p>He answered: &ldquo;No fixed place has been assigned us;</p>\n<p class="slindent">&rsquo;Tis lawful for me to go up and round;</p>\n<p class="slindent">So far as I can go, as guide I join thee.</p></div>\n\n<div class="stanza"><p>But see already how the day declines,</p>\n<p class="slindent">And to go up by night we are not able;</p>\n<p class="slindent">Therefore &rsquo;tis well to think of some fair sojourn.</p></div>\n\n<div class="stanza"><p>Souls are there on the right hand here withdrawn;</p>\n<p class="slindent">If thou permit me I will lead thee to them,</p>\n<p class="slindent">And thou shalt know them not without delight.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;How is this?&rdquo; was the answer; &ldquo;should one wish</p>\n<p class="slindent">To mount by night would he prevented be</p>\n<p class="slindent">By others? or mayhap would not have power?&rdquo;</p></div>\n\n<div class="stanza"><p>And on the ground the good Sordello drew</p>\n<p class="slindent">His finger, saying, &ldquo;See, this line alone</p>\n<p class="slindent">Thou couldst not pass after the sun is gone;</p></div>\n\n<div class="stanza"><p>Not that aught else would hindrance give, however,</p>\n<p class="slindent">To going up, save the nocturnal darkness;</p>\n<p class="slindent">This with the want of power the will perplexes.</p></div>\n\n<div class="stanza"><p>We might indeed therewith return below,</p>\n<p class="slindent">And, wandering, walk the hill-side round about,</p>\n<p class="slindent">While the horizon holds the day imprisoned.&rdquo;</p></div>\n\n<div class="stanza"><p>Thereon my Lord, as if in wonder, said:</p>\n<p class="slindent">&ldquo;Do thou conduct us thither, where thou sayest</p>\n<p class="slindent">That we can take delight in tarrying.&rdquo;</p></div>\n\n<div class="stanza"><p>Little had we withdrawn us from that place,</p>\n<p class="slindent">When I perceived the mount was hollowed out</p>\n<p class="slindent">In fashion as the valleys here are hollowed.</p></div>\n\n<div class="stanza"><p>&ldquo;Thitherward,&rdquo; said that shade, &ldquo;will we repair,</p>\n<p class="slindent">Where of itself the hill-side makes a lap,</p>\n<p class="slindent">And there for the new day will we await.&rdquo;</p></div>\n\n<div class="stanza"><p>&rsquo;Twixt hill and plain there was a winding path</p>\n<p class="slindent">Which led us to the margin of that dell,</p>\n<p class="slindent">Where dies the border more than half away.</p></div>\n\n<div class="stanza"><p>Gold and fine silver, and scarlet and pearl-white,</p>\n<p class="slindent">The Indian wood resplendent and serene,</p>\n<p class="slindent">Fresh emerald the moment it is broken,</p></div>\n\n<div class="stanza"><p>By herbage and by flowers within that hollow</p>\n<p class="slindent">Planted, each one in colour would be vanquished,</p>\n<p class="slindent">As by its greater vanquished is the less.</p></div>\n\n<div class="stanza"><p>Nor in that place had nature painted only,</p>\n<p class="slindent">But of the sweetness of a thousand odours</p>\n<p class="slindent">Made there a mingled fragrance and unknown.</p></div>\n\n<div class="stanza"><p>&ldquo;Salve Regina,&rdquo; on the green and flowers</p>\n<p class="slindent">There seated, singing, spirits I beheld,</p>\n<p class="slindent">Which were not visible outside the valley.</p></div>\n\n<div class="stanza"><p>&ldquo;Before the scanty sun now seeks his nest,&rdquo;</p>\n<p class="slindent">Began the Mantuan who had led us thither,</p>\n<p class="slindent">&ldquo;Among them do not wish me to conduct you.</p></div>\n\n<div class="stanza"><p>Better from off this ledge the acts and faces</p>\n<p class="slindent">Of all of them will you discriminate,</p>\n<p class="slindent">Than in the plain below received among them.</p></div>\n\n<div class="stanza"><p>He who sits highest, and the semblance bears</p>\n<p class="slindent">Of having what he should have done neglected,</p>\n<p class="slindent">And to the others&rsquo; song moves not his lips,</p></div>\n\n<div class="stanza"><p>Rudolph the Emperor was, who had the power</p>\n<p class="slindent">To heal the wounds that Italy have slain,</p>\n<p class="slindent">So that through others slowly she revives.</p></div>\n\n<div class="stanza"><p>The other, who in look doth comfort him,</p>\n<p class="slindent">Governed the region where the water springs,</p>\n<p class="slindent">The Moldau bears the Elbe, and Elbe the sea.</p></div>\n\n<div class="stanza"><p>His name was Ottocar; and in swaddling-clothes</p>\n<p class="slindent">Far better he than bearded Winceslaus</p>\n<p class="slindent">His son, who feeds in luxury and ease.</p></div>\n\n<div class="stanza"><p>And the small-nosed, who close in council seems</p>\n<p class="slindent">With him that has an aspect so benign,</p>\n<p class="slindent">Died fleeing and disflowering the lily;</p></div>\n\n<div class="stanza"><p>Look there, how he is beating at his breast!</p>\n<p class="slindent">Behold the other one, who for his cheek</p>\n<p class="slindent">Sighing has made of his own palm a bed;</p></div>\n\n<div class="stanza"><p>Father and father-in-law of France&rsquo;s Pest</p>\n<p class="slindent">Are they, and know his vicious life and lewd,</p>\n<p class="slindent">And hence proceeds the grief that so doth pierce them.</p></div>\n\n<div class="stanza"><p>He who appears so stalwart, and chimes in,</p>\n<p class="slindent">Singing, with that one of the manly nose,</p>\n<p class="slindent">The cord of every valour wore begirt;</p></div>\n\n<div class="stanza"><p>And if as King had after him remained</p>\n<p class="slindent">The stripling who in rear of him is sitting,</p>\n<p class="slindent">Well had the valour passed from vase to vase,</p></div>\n\n<div class="stanza"><p>Which cannot of the other heirs be said.</p>\n<p class="slindent">Frederick and Jacomo possess the realms,</p>\n<p class="slindent">But none the better heritage possesses.</p></div>\n\n<div class="stanza"><p>Not oftentimes upriseth through the branches</p>\n<p class="slindent">The probity of man; and this He wills</p>\n<p class="slindent">Who gives it, so that we may ask of Him.</p></div>\n\n<div class="stanza"><p>Eke to the large-nosed reach my words, no less</p>\n<p class="slindent">Than to the other, Pier, who with him sings;</p>\n<p class="slindent">Whence Provence and Apulia grieve already</p></div>\n\n<div class="stanza"><p>The plant is as inferior to its seed,</p>\n<p class="slindent">As more than Beatrice and Margaret</p>\n<p class="slindent">Costanza boasteth of her husband still.</p></div>\n\n<div class="stanza"><p>Behold the monarch of the simple life,</p>\n<p class="slindent">Harry of England, sitting there alone;</p>\n<p class="slindent">He in his branches has a better issue.</p></div>\n\n<div class="stanza"><p>He who the lowest on the ground among them</p>\n<p class="slindent">Sits looking upward, is the Marquis William,</p>\n<p class="slindent">For whose sake Alessandria and her war</p></div>\n\n<div class="stanza"><p>Make Monferrat and Canavese weep.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto VIII</p>\n<div class="stanza"><p>&rsquo;Twas now the hour that turneth back desire</p>\n<p class="slindent">In those who sail the sea, and melts the heart,</p>\n<p class="slindent">The day they&rsquo;ve said to their sweet friends farewell,</p></div>\n\n<div class="stanza"><p>And the new pilgrim penetrates with love,</p>\n<p class="slindent">If he doth hear from far away a bell</p>\n<p class="slindent">That seemeth to deplore the dying day,</p></div>\n\n<div class="stanza"><p>When I began to make of no avail</p>\n<p class="slindent">My hearing, and to watch one of the souls</p>\n<p class="slindent">Uprisen, that begged attention with its hand.</p></div>\n\n<div class="stanza"><p>It joined and lifted upward both its palms,</p>\n<p class="slindent">Fixing its eyes upon the orient,</p>\n<p class="slindent">As if it said to God, &ldquo;Naught else I care for.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Te lucis ante&rdquo; so devoutly issued</p>\n<p class="slindent">Forth from its mouth, and with such dulcet notes,</p>\n<p class="slindent">It made me issue forth from my own mind.</p></div>\n\n<div class="stanza"><p>And then the others, sweetly and devoutly,</p>\n<p class="slindent">Accompanied it through all the hymn entire,</p>\n<p class="slindent">Having their eyes on the supernal wheels.</p></div>\n\n<div class="stanza"><p>Here, Reader, fix thine eyes well on the truth,</p>\n<p class="slindent">For now indeed so subtile is the veil,</p>\n<p class="slindent">Surely to penetrate within is easy.</p></div>\n\n<div class="stanza"><p>I saw that army of the gentle-born</p>\n<p class="slindent">Thereafterward in silence upward gaze,</p>\n<p class="slindent">As if in expectation, pale and humble;</p></div>\n\n<div class="stanza"><p>And from on high come forth and down descend,</p>\n<p class="slindent">I saw two Angels with two flaming swords,</p>\n<p class="slindent">Truncated and deprived of their points.</p></div>\n\n<div class="stanza"><p>Green as the little leaflets just now born</p>\n<p class="slindent">Their garments were, which, by their verdant pinions</p>\n<p class="slindent">Beaten and blown abroad, they trailed behind.</p></div>\n\n<div class="stanza"><p>One just above us came to take his station,</p>\n<p class="slindent">And one descended to the opposite bank,</p>\n<p class="slindent">So that the people were contained between them.</p></div>\n\n<div class="stanza"><p>Clearly in them discerned I the blond head;</p>\n<p class="slindent">But in their faces was the eye bewildered,</p>\n<p class="slindent">As faculty confounded by excess.</p></div>\n\n<div class="stanza"><p>&ldquo;From Mary&rsquo;s bosom both of them have come,&rdquo;</p>\n<p class="slindent">Sordello said, &ldquo;as guardians of the valley</p>\n<p class="slindent">Against the serpent, that will come anon.&rdquo;</p></div>\n\n<div class="stanza"><p>Whereupon I, who knew not by what road,</p>\n<p class="slindent">Turned round about, and closely drew myself,</p>\n<p class="slindent">Utterly frozen, to the faithful shoulders.</p></div>\n\n<div class="stanza"><p>And once again Sordello: &ldquo;Now descend we</p>\n<p class="slindent">&rsquo;Mid the grand shades, and we will speak to them;</p>\n<p class="slindent">Right pleasant will it be for them to see you.&rdquo;</p></div>\n\n<div class="stanza"><p>Only three steps I think that I descended,</p>\n<p class="slindent">And was below, and saw one who was looking</p>\n<p class="slindent">Only at me, as if he fain would know me.</p></div>\n\n<div class="stanza"><p>Already now the air was growing dark,</p>\n<p class="slindent">But not so that between his eyes and mine</p>\n<p class="slindent">It did not show what it before locked up.</p></div>\n\n<div class="stanza"><p>Tow&rsquo;rds me he moved, and I tow&rsquo;rds him did move;</p>\n<p class="slindent">Noble Judge Nino! how it me delighted,</p>\n<p class="slindent">When I beheld thee not among the damned!</p></div>\n\n<div class="stanza"><p>No greeting fair was left unsaid between us;</p>\n<p class="slindent">Then asked he: &ldquo;How long is it since thou camest</p>\n<p class="slindent">O&rsquo;et the far waters to the mountain&rsquo;s foot?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Oh!&rdquo; said I to him, &ldquo;through the dismal places</p>\n<p class="slindent">I came this morn; and am in the first life,</p>\n<p class="slindent">Albeit the other, going thus, I gain.&rdquo;</p></div>\n\n<div class="stanza"><p>And on the instant my reply was heard,</p>\n<p class="slindent">He and Sordello both shrank back from me,</p>\n<p class="slindent">Like people who are suddenly bewildered.</p></div>\n\n<div class="stanza"><p>One to Virgilius, and the other turned</p>\n<p class="slindent">To one who sat there, crying, &ldquo;Up, Currado!</p>\n<p class="slindent">Come and behold what God in grace has willed!&rdquo;</p></div>\n\n<div class="stanza"><p>Then, turned to me: &ldquo;By that especial grace</p>\n<p class="slindent">Thou owest unto Him, who so conceals</p>\n<p class="slindent">His own first wherefore, that it has no ford,</p></div>\n\n<div class="stanza"><p>When thou shalt be beyond the waters wide,</p>\n<p class="slindent">Tell my Giovanna that she pray for me,</p>\n<p class="slindent">Where answer to the innocent is made.</p></div>\n\n<div class="stanza"><p>I do not think her mother loves me more,</p>\n<p class="slindent">Since she has laid aside her wimple white,</p>\n<p class="slindent">Which she, unhappy, needs must wish again.</p></div>\n\n<div class="stanza"><p>Through her full easily is comprehended</p>\n<p class="slindent">How long in woman lasts the fire of love,</p>\n<p class="slindent">If eye or touch do not relight it often.</p></div>\n\n<div class="stanza"><p>So fair a hatchment will not make for her</p>\n<p class="slindent">The Viper marshalling the Milanese</p>\n<p class="slindent">A-field, as would have made Gallura&rsquo;s Cock.&rdquo;</p></div>\n\n<div class="stanza"><p>In this wise spake he, with the stamp impressed</p>\n<p class="slindent">Upon his aspect of that righteous zeal</p>\n<p class="slindent">Which measurably burneth in the heart.</p></div>\n\n<div class="stanza"><p>My greedy eyes still wandered up to heaven,</p>\n<p class="slindent">Still to that point where slowest are the stars,</p>\n<p class="slindent">Even as a wheel the nearest to its axle.</p></div>\n\n<div class="stanza"><p>And my Conductor: &ldquo;Son, what dost thou gaze at</p>\n<p class="slindent">Up there?&rdquo;  And I to him: &ldquo;At those three torches</p>\n<p class="slindent">With which this hither pole is all on fire.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;The four resplendent stars</p>\n<p class="slindent">Thou sawest this morning are down yonder low,</p>\n<p class="slindent">And these have mounted up to where those were.&rdquo;</p></div>\n\n<div class="stanza"><p>As he was speaking, to himself Sordello</p>\n<p class="slindent">Drew him, and said, &ldquo;Lo there our Adversary!&rdquo;</p>\n<p class="slindent">And pointed with his finger to look thither.</p></div>\n\n<div class="stanza"><p>Upon the side on which the little valley</p>\n<p class="slindent">No barrier hath, a serpent was; perchance</p>\n<p class="slindent">The same which gave to Eve the bitter food.</p></div>\n\n<div class="stanza"><p>&rsquo;Twixt grass and flowers came on the evil streak,</p>\n<p class="slindent">Turning at times its head about, and licking</p>\n<p class="slindent">Its back like to a beast that smoothes itself.</p></div>\n\n<div class="stanza"><p>I did not see, and therefore cannot say</p>\n<p class="slindent">How the celestial falcons &rsquo;gan to move,</p>\n<p class="slindent">But well I saw that they were both in motion.</p></div>\n\n<div class="stanza"><p>Hearing the air cleft by their verdant wings,</p>\n<p class="slindent">The serpent fled, and round the Angels wheeled,</p>\n<p class="slindent">Up to their stations flying back alike.</p></div>\n\n<div class="stanza"><p>The shade that to the Judge had near approached</p>\n<p class="slindent">When he had called, throughout that whole assault</p>\n<p class="slindent">Had not a moment loosed its gaze on me.</p></div>\n\n<div class="stanza"><p>&ldquo;So may the light that leadeth thee on high</p>\n<p class="slindent">Find in thine own free-will as much of wax</p>\n<p class="slindent">As needful is up to the highest azure,&rdquo;</p></div>\n\n<div class="stanza"><p>Began it, &ldquo;if some true intelligence</p>\n<p class="slindent">Of Valdimagra or its neighbourhood</p>\n<p class="slindent">Thou knowest, tell it me, who once was great there.</p></div>\n\n<div class="stanza"><p>Currado Malaspina was I called;</p>\n<p class="slindent">I&rsquo;m not the elder, but from him descended;</p>\n<p class="slindent">To mine I bore the love which here refineth.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O,&rdquo; said I unto him, &ldquo;through your domains</p>\n<p class="slindent">I never passed, but where is there a dwelling</p>\n<p class="slindent">Throughout all Europe, where they are not known?</p></div>\n\n<div class="stanza"><p>That fame, which doeth honour to your house,</p>\n<p class="slindent">Proclaims its Signors and proclaims its land,</p>\n<p class="slindent">So that he knows of them who ne&rsquo;et was there.</p></div>\n\n<div class="stanza"><p>And, as I hope for heaven, I swear to you</p>\n<p class="slindent">Your honoured family in naught abates</p>\n<p class="slindent">The glory of the purse and of the sword.</p></div>\n\n<div class="stanza"><p>It is so privileged by use and nature,</p>\n<p class="slindent">That though a guilty head misguide the world,</p>\n<p class="slindent">Sole it goes right, and scorns the evil way.&rdquo;</p></div>\n\n<div class="stanza"><p>And he: &ldquo;Now go; for the sun shall not lie</p>\n<p class="slindent">Seven times upon the pillow which the Ram</p>\n<p class="slindent">With all his four feet covers and bestrides,</p></div>\n\n<div class="stanza"><p>Before that such a courteous opinion</p>\n<p class="slindent">Shall in the middle of thy head be nailed</p>\n<p class="slindent">With greater nails than of another&rsquo;s speech,</p></div>\n\n<div class="stanza"><p>Unless the course of justice standeth still.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto IX</p>\n<div class="stanza"><p>The concubine of old Tithonus now</p>\n<p class="slindent">Gleamed white upon the eastern balcony,</p>\n<p class="slindent">Forth from the arms of her sweet paramour;</p></div>\n\n<div class="stanza"><p>With gems her forehead all relucent was,</p>\n<p class="slindent">Set in the shape of that cold animal</p>\n<p class="slindent">Which with its tail doth smite amain the nations,</p></div>\n\n<div class="stanza"><p>And of the steps, with which she mounts, the Night</p>\n<p class="slindent">Had taken two in that place where we were,</p>\n<p class="slindent">And now the third was bending down its wings;</p></div>\n\n<div class="stanza"><p>When I, who something had of Adam in me,</p>\n<p class="slindent">Vanquished by sleep, upon the grass reclined,</p>\n<p class="slindent">There were all five of us already sat.</p></div>\n\n<div class="stanza"><p>Just at the hour when her sad lay begins</p>\n<p class="slindent">The little swallow, near unto the morning,</p>\n<p class="slindent">Perchance in memory of her former woes,</p></div>\n\n<div class="stanza"><p>And when the mind of man, a wanderer</p>\n<p class="slindent">More from the flesh, and less by thought imprisoned,</p>\n<p class="slindent">Almost prophetic in its visions is,</p></div>\n\n<div class="stanza"><p>In dreams it seemed to me I saw suspended</p>\n<p class="slindent">An eagle in the sky, with plumes of gold,</p>\n<p class="slindent">With wings wide open, and intent to stoop,</p></div>\n\n<div class="stanza"><p>And this, it seemed to me, was where had been</p>\n<p class="slindent">By Ganymede his kith and kin abandoned,</p>\n<p class="slindent">When to the high consistory he was rapt.</p></div>\n\n<div class="stanza"><p>I thought within myself, perchance he strikes</p>\n<p class="slindent">From habit only here, and from elsewhere</p>\n<p class="slindent">Disdains to bear up any in his feet.</p></div>\n\n<div class="stanza"><p>Then wheeling somewhat more, it seemed to me,</p>\n<p class="slindent">Terrible as the lightning he descended,</p>\n<p class="slindent">And snatched me upward even to the fire.</p></div>\n\n<div class="stanza"><p>Therein it seemed that he and I were burning,</p>\n<p class="slindent">And the imagined fire did scorch me so,</p>\n<p class="slindent">That of necessity my sleep was broken.</p></div>\n\n<div class="stanza"><p>Not otherwise Achilles started up,</p>\n<p class="slindent">Around him turning his awakened eyes,</p>\n<p class="slindent">And knowing not the place in which he was,</p></div>\n\n<div class="stanza"><p>What time from Chiron stealthily his mother</p>\n<p class="slindent">Carried him sleeping in her arms to Scyros,</p>\n<p class="slindent">Wherefrom the Greeks withdrew him afterwards,</p></div>\n\n<div class="stanza"><p>Than I upstarted, when from off my face</p>\n<p class="slindent">Sleep fled away; and pallid I became,</p>\n<p class="slindent">As doth the man who freezes with affright.</p></div>\n\n<div class="stanza"><p>Only my Comforter was at my side,</p>\n<p class="slindent">And now the sun was more than two hours high,</p>\n<p class="slindent">And turned towards the sea-shore was my face.</p></div>\n\n<div class="stanza"><p>&ldquo;Be not intimidated,&rdquo; said my Lord,</p>\n<p class="slindent">&ldquo;Be reassured, for all is well with us;</p>\n<p class="slindent">Do not restrain, but put forth all thy strength.</p></div>\n\n<div class="stanza"><p>Thou hast at length arrived at Purgatory;</p>\n<p class="slindent">See there the cliff that closes it around;</p>\n<p class="slindent">See there the entrance, where it seems disjoined.</p></div>\n\n<div class="stanza"><p>Whilom at dawn, which doth precede the day,</p>\n<p class="slindent">When inwardly thy spirit was asleep</p>\n<p class="slindent">Upon the flowers that deck the land below,</p></div>\n\n<div class="stanza"><p>There came a Lady and said: &lsquo;I am Lucia;</p>\n<p class="slindent">Let me take this one up, who is asleep;</p>\n<p class="slindent">So will I make his journey easier for him.&rsquo;</p></div>\n\n<div class="stanza"><p>Sordello and the other noble shapes</p>\n<p class="slindent">Remained; she took thee, and, as day grew bright,</p>\n<p class="slindent">Upward she came, and I upon her footsteps.</p></div>\n\n<div class="stanza"><p>She laid thee here; and first her beauteous eyes</p>\n<p class="slindent">That open entrance pointed out to me;</p>\n<p class="slindent">Then she and sleep together went away.&rdquo;</p></div>\n\n<div class="stanza"><p>In guise of one whose doubts are reassured,</p>\n<p class="slindent">And who to confidence his fear doth change,</p>\n<p class="slindent">After the truth has been discovered to him,</p></div>\n\n<div class="stanza"><p>So did I change; and when without disquiet</p>\n<p class="slindent">My Leader saw me, up along the cliff</p>\n<p class="slindent">He moved, and I behind him, tow&rsquo;rd the height.</p></div>\n\n<div class="stanza"><p>Reader, thou seest well how I exalt</p>\n<p class="slindent">My theme, and therefore if with greater art</p>\n<p class="slindent">I fortify it, marvel not thereat.</p></div>\n\n<div class="stanza"><p>Nearer approached we, and were in such place,</p>\n<p class="slindent">That there, where first appeared to me a rift</p>\n<p class="slindent">Like to a crevice that disparts a wall,</p></div>\n\n<div class="stanza"><p>I saw a portal, and three stairs beneath,</p>\n<p class="slindent">Diverse in colour, to go up to it,</p>\n<p class="slindent">And a gate-keeper, who yet spake no word.</p></div>\n\n<div class="stanza"><p>And as I opened more and more mine eyes,</p>\n<p class="slindent">I saw him seated on the highest stair,</p>\n<p class="slindent">Such in the face that I endured it not.</p></div>\n\n<div class="stanza"><p>And in his hand he had a naked sword,</p>\n<p class="slindent">Which so reflected back the sunbeams tow&rsquo;rds us,</p>\n<p class="slindent">That oft in vain I lifted up mine eyes.</p></div>\n\n<div class="stanza"><p>&ldquo;Tell it from where you are, what is&rsquo;t you wish?&rdquo;</p>\n<p class="slindent">Began he to exclaim; &ldquo;where is the escort?</p>\n<p class="slindent">Take heed your coming hither harm you not!&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;A Lady of Heaven, with these things conversant,&rdquo;</p>\n<p class="slindent">My Master answered him, &ldquo;but even now</p>\n<p class="slindent">Said to us, &lsquo;Thither go; there is the portal.&rsquo;&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;And may she speed your footsteps in all good,&rdquo;</p>\n<p class="slindent">Again began the courteous janitor;</p>\n<p class="slindent">&ldquo;Come forward then unto these stairs of ours.&rdquo;</p></div>\n\n<div class="stanza"><p>Thither did we approach; and the first stair</p>\n<p class="slindent">Was marble white, so polished and so smooth,</p>\n<p class="slindent">I mirrored myself therein as I appear.</p></div>\n\n<div class="stanza"><p>The second, tinct of deeper hue than perse,</p>\n<p class="slindent">Was of a calcined and uneven stone,</p>\n<p class="slindent">Cracked all asunder lengthwise and across.</p></div>\n\n<div class="stanza"><p>The third, that uppermost rests massively,</p>\n<p class="slindent">Porphyry seemed to me, as flaming red</p>\n<p class="slindent">As blood that from a vein is spirting forth.</p></div>\n\n<div class="stanza"><p>Both of his feet was holding upon this</p>\n<p class="slindent">The Angel of God, upon the threshold seated,</p>\n<p class="slindent">Which seemed to me a stone of diamond.</p></div>\n\n<div class="stanza"><p>Along the three stairs upward with good will</p>\n<p class="slindent">Did my Conductor draw me, saying: &ldquo;Ask</p>\n<p class="slindent">Humbly that he the fastening may undo.&rdquo;</p></div>\n\n<div class="stanza"><p>Devoutly at the holy feet I cast me,</p>\n<p class="slindent">For mercy&rsquo;s sake besought that he would open,</p>\n<p class="slindent">But first upon my breast three times I smote.</p></div>\n\n<div class="stanza"><p>Seven P&rsquo;s upon my forehead he described</p>\n<p class="slindent">With the sword&rsquo;s point, and, &ldquo;Take heed that thou wash</p>\n<p class="slindent">These wounds, when thou shalt be within,&rdquo; he said.</p></div>\n\n<div class="stanza"><p>Ashes, or earth that dry is excavated,</p>\n<p class="slindent">Of the same colour were with his attire,</p>\n<p class="slindent">And from beneath it he drew forth two keys.</p></div>\n\n<div class="stanza"><p>One was of gold, and the other was of silver;</p>\n<p class="slindent">First with the white, and after with the yellow,</p>\n<p class="slindent">Plied he the door, so that I was content.</p></div>\n\n<div class="stanza"><p>&ldquo;Whenever faileth either of these keys</p>\n<p class="slindent">So that it turn not rightly in the lock,&rdquo;</p>\n<p class="slindent">He said to us, &ldquo;this entrance doth not open.</p></div>\n\n<div class="stanza"><p>More precious one is, but the other needs</p>\n<p class="slindent">More art and intellect ere it unlock,</p>\n<p class="slindent">For it is that which doth the knot unloose.</p></div>\n\n<div class="stanza"><p>From Peter I have them; and he bade me err</p>\n<p class="slindent">Rather in opening than in keeping shut,</p>\n<p class="slindent">If people but fall down before my feet.&rdquo;</p></div>\n\n<div class="stanza"><p>Then pushed the portals of the sacred door,</p>\n<p class="slindent">Exclaiming: &ldquo;Enter; but I give you warning</p>\n<p class="slindent">That forth returns whoever looks behind.&rdquo;</p></div>\n\n<div class="stanza"><p>And when upon their hinges were turned round</p>\n<p class="slindent">The swivels of that consecrated gate,</p>\n<p class="slindent">Which are of metal, massive and sonorous,</p></div>\n\n<div class="stanza"><p>Roared not so loud, nor so discordant seemed</p>\n<p class="slindent">Tarpeia, when was ta&rsquo;en from it the good</p>\n<p class="slindent">Metellus, wherefore meagre it remained.</p></div>\n\n<div class="stanza"><p>At the first thunder-peal I turned attentive,</p>\n<p class="slindent">And &ldquo;Te Deum laudamus&rdquo; seemed to hear</p>\n<p class="slindent">In voices mingled with sweet melody.</p></div>\n\n<div class="stanza"><p>Exactly such an image rendered me</p>\n<p class="slindent">That which I heard, as we are wont to catch,</p>\n<p class="slindent">When people singing with the organ stand;</p></div>\n\n<div class="stanza"><p>For now we hear, and now hear not, the words.</p></div>','<p class="cantohead">Purgatorio: Canto X</p>\n<div class="stanza"><p>When we had crossed the threshold of the door</p>\n<p class="slindent">Which the perverted love of souls disuses,</p>\n<p class="slindent">Because it makes the crooked way seem straight,</p></div>\n\n<div class="stanza"><p>Re-echoing I heard it closed again;</p>\n<p class="slindent">And if I had turned back mine eyes upon it,</p>\n<p class="slindent">What for my failing had been fit excuse?</p></div>\n\n<div class="stanza"><p>We mounted upward through a rifted rock,</p>\n<p class="slindent">Which undulated to this side and that,</p>\n<p class="slindent">Even as a wave receding and advancing.</p></div>\n\n<div class="stanza"><p>&ldquo;Here it behoves us use a little art,&rdquo;</p>\n<p class="slindent">Began my Leader, &ldquo;to adapt ourselves</p>\n<p class="slindent">Now here, now there, to the receding side.&rdquo;</p></div>\n\n<div class="stanza"><p>And this our footsteps so infrequent made,</p>\n<p class="slindent">That sooner had the moon&rsquo;s decreasing disk</p>\n<p class="slindent">Regained its bed to sink again to rest,</p></div>\n\n<div class="stanza"><p>Than we were forth from out that needle&rsquo;s eye;</p>\n<p class="slindent">But when we free and in the open were,</p>\n<p class="slindent">There where the mountain backward piles itself,</p></div>\n\n<div class="stanza"><p>I wearied out, and both of us uncertain</p>\n<p class="slindent">About our way, we stopped upon a plain</p>\n<p class="slindent">More desolate than roads across the deserts.</p></div>\n\n<div class="stanza"><p>From where its margin borders on the void,</p>\n<p class="slindent">To foot of the high bank that ever rises,</p>\n<p class="slindent">A human body three times told would measure;</p></div>\n\n<div class="stanza"><p>And far as eye of mine could wing its flight,</p>\n<p class="slindent">Now on the left, and on the right flank now,</p>\n<p class="slindent">The same this cornice did appear to me.</p></div>\n\n<div class="stanza"><p>Thereon our feet had not been moved as yet,</p>\n<p class="slindent">When I perceived the embankment round about,</p>\n<p class="slindent">Which all right of ascent had interdicted,</p></div>\n\n<div class="stanza"><p>To be of marble white, and so adorned</p>\n<p class="slindent">With sculptures, that not only Polycletus,</p>\n<p class="slindent">But Nature&rsquo;s self, had there been put to shame.</p></div>\n\n<div class="stanza"><p>The Angel, who came down to earth with tidings</p>\n<p class="slindent">Of peace, that had been wept for many a year,</p>\n<p class="slindent">And opened Heaven from its long interdict,</p></div>\n\n<div class="stanza"><p>In front of us appeared so truthfully</p>\n<p class="slindent">There sculptured in a gracious attitude,</p>\n<p class="slindent">He did not seem an image that is silent.</p></div>\n\n<div class="stanza"><p>One would have sworn that he was saying, &ldquo;Ave;&rdquo;</p>\n<p class="slindent">For she was there in effigy portrayed</p>\n<p class="slindent">Who turned the key to ope the exalted love,</p></div>\n\n<div class="stanza"><p>And in her mien this language had impressed,</p>\n<p class="slindent">&ldquo;Ecce ancilla Dei,&rdquo; as distinctly</p>\n<p class="slindent">As any figure stamps itself in wax.</p></div>\n\n<div class="stanza"><p>&ldquo;Keep not thy mind upon one place alone,&rdquo;</p>\n<p class="slindent">The gentle Master said, who had me standing</p>\n<p class="slindent">Upon that side where people have their hearts;</p></div>\n\n<div class="stanza"><p>Whereat I moved mine eyes, and I beheld</p>\n<p class="slindent">In rear of Mary, and upon that side</p>\n<p class="slindent">Where he was standing who conducted me,</p></div>\n\n<div class="stanza"><p>Another story on the rock imposed;</p>\n<p class="slindent">Wherefore I passed Virgilius and drew near,</p>\n<p class="slindent">So that before mine eyes it might be set.</p></div>\n\n<div class="stanza"><p>There sculptured in the self-same marble were</p>\n<p class="slindent">The cart and oxen, drawing the holy ark,</p>\n<p class="slindent">Wherefore one dreads an office not appointed.</p></div>\n\n<div class="stanza"><p>People appeared in front, and all of them</p>\n<p class="slindent">In seven choirs divided, of two senses</p>\n<p class="slindent">Made one say &ldquo;No,&rdquo; the other, &ldquo;Yes, they sing.&rdquo;</p></div>\n\n<div class="stanza"><p>Likewise unto the smoke of the frankincense,</p>\n<p class="slindent">Which there was imaged forth, the eyes and nose</p>\n<p class="slindent">Were in the yes and no discordant made.</p></div>\n\n<div class="stanza"><p>Preceded there the vessel benedight,</p>\n<p class="slindent">Dancing with girded loins, the humble Psalmist,</p>\n<p class="slindent">And more and less than King was he in this.</p></div>\n\n<div class="stanza"><p>Opposite, represented at the window</p>\n<p class="slindent">Of a great palace, Michal looked upon him,</p>\n<p class="slindent">Even as a woman scornful and afflicted.</p></div>\n\n<div class="stanza"><p>I moved my feet from where I had been standing,</p>\n<p class="slindent">To examine near at hand another story,</p>\n<p class="slindent">Which after Michal glimmered white upon me.</p></div>\n\n<div class="stanza"><p>There the high glory of the Roman Prince</p>\n<p class="slindent">Was chronicled, whose great beneficence</p>\n<p class="slindent">Moved Gregory to his great victory;</p></div>\n\n<div class="stanza"><p>&rsquo;Tis of the Emperor Trajan I am speaking;</p>\n<p class="slindent">And a poor widow at his bridle stood,</p>\n<p class="slindent">In attitude of weeping and of grief.</p></div>\n\n<div class="stanza"><p>Around about him seemed it thronged and full</p>\n<p class="slindent">Of cavaliers, and the eagles in the gold</p>\n<p class="slindent">Above them visibly in the wind were moving.</p></div>\n\n<div class="stanza"><p>The wretched woman in the midst of these</p>\n<p class="slindent">Seemed to be saying: &ldquo;Give me vengeance, Lord,</p>\n<p class="slindent">For my dead son, for whom my heart is breaking.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to answer her: &ldquo;Now wait until</p>\n<p class="slindent">I shall return.&rdquo;  And she: &ldquo;My Lord,&rdquo; like one</p>\n<p class="slindent">In whom grief is impatient, &ldquo;shouldst thou not</p></div>\n\n<div class="stanza"><p>Return?&rdquo;  And he: &ldquo;Who shall be where I am</p>\n<p class="slindent">Will give it thee.&rdquo;  And she: &ldquo;Good deed of others</p>\n<p class="slindent">What boots it thee, if thou neglect thine own?&rdquo;</p></div>\n\n<div class="stanza"><p>Whence he: &ldquo;Now comfort thee, for it behoves me</p>\n<p class="slindent">That I discharge my duty ere I move;</p>\n<p class="slindent">Justice so wills, and pity doth retain me.&rdquo;</p></div>\n\n<div class="stanza"><p>He who on no new thing has ever looked</p>\n<p class="slindent">Was the creator of this visible language,</p>\n<p class="slindent">Novel to us, for here it is not found.</p></div>\n\n<div class="stanza"><p>While I delighted me in contemplating</p>\n<p class="slindent">The images of such humility,</p>\n<p class="slindent">And dear to look on for their Maker&rsquo;s sake,</p></div>\n\n<div class="stanza"><p>&ldquo;Behold, upon this side, but rare they make</p>\n<p class="slindent">Their steps,&rdquo; the Poet murmured, &ldquo;many people;</p>\n<p class="slindent">These will direct us to the lofty stairs.&rdquo;</p></div>\n\n<div class="stanza"><p>Mine eyes, that in beholding were intent</p>\n<p class="slindent">To see new things, of which they curious are,</p>\n<p class="slindent">In turning round towards him were not slow.</p></div>\n\n<div class="stanza"><p>But still I wish not, Reader, thou shouldst swerve</p>\n<p class="slindent">From thy good purposes, because thou hearest</p>\n<p class="slindent">How God ordaineth that the debt be paid;</p></div>\n\n<div class="stanza"><p>Attend not to the fashion of the torment,</p>\n<p class="slindent">Think of what follows; think that at the worst</p>\n<p class="slindent">It cannot reach beyond the mighty sentence.</p></div>\n\n<div class="stanza"><p>&ldquo;Master,&rdquo; began I, &ldquo;that which I behold</p>\n<p class="slindent">Moving towards us seems to me not persons,</p>\n<p class="slindent">And what I know not, so in sight I waver.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;The grievous quality</p>\n<p class="slindent">Of this their torment bows them so to earth,</p>\n<p class="slindent">That my own eyes at first contended with it;</p></div>\n\n<div class="stanza"><p>But look there fixedly, and disentangle</p>\n<p class="slindent">By sight what cometh underneath those stones;</p>\n<p class="slindent">Already canst thou see how each is stricken.&rdquo;</p></div>\n\n<div class="stanza"><p>O ye proud Christians! wretched, weary ones!</p>\n<p class="slindent">Who, in the vision of the mind infirm</p>\n<p class="slindent">Confidence have in your backsliding steps,</p></div>\n\n<div class="stanza"><p>Do ye not comprehend that we are worms,</p>\n<p class="slindent">Born to bring forth the angelic butterfly</p>\n<p class="slindent">That flieth unto judgment without screen?</p></div>\n\n<div class="stanza"><p>Why floats aloft your spirit high in air?</p>\n<p class="slindent">Like are ye unto insects undeveloped,</p>\n<p class="slindent">Even as the worm in whom formation fails!</p></div>\n\n<div class="stanza"><p>As to sustain a ceiling or a roof,</p>\n<p class="slindent">In place of corbel, oftentimes a figure</p>\n<p class="slindent">Is seen to join its knees unto its breast,</p></div>\n\n<div class="stanza"><p>Which makes of the unreal real anguish</p>\n<p class="slindent">Arise in him who sees it, fashioned thus</p>\n<p class="slindent">Beheld I those, when I had ta&rsquo;en good heed.</p></div>\n\n<div class="stanza"><p>True is it, they were more or less bent down,</p>\n<p class="slindent">According as they more or less were laden;</p>\n<p class="slindent">And he who had most patience in his looks</p></div>\n\n<div class="stanza"><p>Weeping did seem to say, &ldquo;I can no more!&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XI</p>\n<div class="stanza"><p>&ldquo;Our Father, thou who dwellest in the heavens,</p>\n<p class="slindent">Not circumscribed, but from the greater love</p>\n<p class="slindent">Thou bearest to the first effects on high,</p></div>\n\n<div class="stanza"><p>Praised be thy name and thine omnipotence</p>\n<p class="slindent">By every creature, as befitting is</p>\n<p class="slindent">To render thanks to thy sweet effluence.</p></div>\n\n<div class="stanza"><p>Come unto us the peace of thy dominion,</p>\n<p class="slindent">For unto it we cannot of ourselves,</p>\n<p class="slindent">If it come not, with all our intellect.</p></div>\n\n<div class="stanza"><p>Even as thine own Angels of their will</p>\n<p class="slindent">Make sacrifice to thee, Hosanna singing,</p>\n<p class="slindent">So may all men make sacrifice of theirs.</p></div>\n\n<div class="stanza"><p>Give unto us this day our daily manna,</p>\n<p class="slindent">Withouten which in this rough wilderness</p>\n<p class="slindent">Backward goes he who toils most to advance.</p></div>\n\n<div class="stanza"><p>And even as we the trespass we have suffered</p>\n<p class="slindent">Pardon in one another, pardon thou</p>\n<p class="slindent">Benignly, and regard not our desert.</p></div>\n\n<div class="stanza"><p>Our virtue, which is easily o&rsquo;etcome,</p>\n<p class="slindent">Put not to proof with the old Adversary,</p>\n<p class="slindent">But thou from him who spurs it so, deliver.</p></div>\n\n<div class="stanza"><p>This last petition verily, dear Lord,</p>\n<p class="slindent">Not for ourselves is made, who need it not,</p>\n<p class="slindent">But for their sake who have remained behind us.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus for themselves and us good furtherance</p>\n<p class="slindent">Those shades imploring, went beneath a weight</p>\n<p class="slindent">Like unto that of which we sometimes dream,</p></div>\n\n<div class="stanza"><p>Unequally in anguish round and round</p>\n<p class="slindent">And weary all, upon that foremost cornice,</p>\n<p class="slindent">Purging away the smoke-stains of the world.</p></div>\n\n<div class="stanza"><p>If there good words are always said for us,</p>\n<p class="slindent">What may not here be said and done for them,</p>\n<p class="slindent">By those who have a good root to their will?</p></div>\n\n<div class="stanza"><p>Well may we help them wash away the marks</p>\n<p class="slindent">That hence they carried, so that clean and light</p>\n<p class="slindent">They may ascend unto the starry wheels!</p></div>\n\n<div class="stanza"><p>&ldquo;Ah! so may pity and justice you disburden</p>\n<p class="slindent">Soon, that ye may have power to move the wing,</p>\n<p class="slindent">That shall uplift you after your desire,</p></div>\n\n<div class="stanza"><p>Show us on which hand tow&rsquo;rd the stairs the way</p>\n<p class="slindent">Is shortest, and if more than one the passes,</p>\n<p class="slindent">Point us out that which least abruptly falls;</p></div>\n\n<div class="stanza"><p>For he who cometh with me, through the burden</p>\n<p class="slindent">Of Adam&rsquo;s flesh wherewith he is invested,</p>\n<p class="slindent">Against his will is chary of his climbing.&rdquo;</p></div>\n\n<div class="stanza"><p>The words of theirs which they returned to those</p>\n<p class="slindent">That he whom I was following had spoken,</p>\n<p class="slindent">It was not manifest from whom they came,</p></div>\n\n<div class="stanza"><p>But it was said: &ldquo;To the right hand come with us</p>\n<p class="slindent">Along the bank, and ye shall find a pass</p>\n<p class="slindent">Possible for living person to ascend.</p></div>\n\n<div class="stanza"><p>And were I not impeded by the stone,</p>\n<p class="slindent">Which this proud neck of mine doth subjugate,</p>\n<p class="slindent">Whence I am forced to hold my visage down,</p></div>\n\n<div class="stanza"><p>Him, who still lives and does not name himself,</p>\n<p class="slindent">Would I regard, to see if I may know him</p>\n<p class="slindent">And make him piteous unto this burden.</p></div>\n\n<div class="stanza"><p>A Latian was I, and born of a great Tuscan;</p>\n<p class="slindent">Guglielmo Aldobrandeschi was my father;</p>\n<p class="slindent">I know not if his name were ever with you.</p></div>\n\n<div class="stanza"><p>The ancient blood and deeds of gallantry</p>\n<p class="slindent">Of my progenitors so arrogant made me</p>\n<p class="slindent">That, thinking not upon the common mother,</p></div>\n\n<div class="stanza"><p>All men I held in scorn to such extent</p>\n<p class="slindent">I died therefor, as know the Sienese,</p>\n<p class="slindent">And every child in Campagnatico.</p></div>\n\n<div class="stanza"><p>I am Omberto; and not to me alone</p>\n<p class="slindent">Has pride done harm, but all my kith and kin</p>\n<p class="slindent">Has with it dragged into adversity.</p></div>\n\n<div class="stanza"><p>And here must I this burden bear for it</p>\n<p class="slindent">Till God be satisfied, since I did not</p>\n<p class="slindent">Among the living, here among the dead.&rdquo;</p></div>\n\n<div class="stanza"><p>Listening I downward bent my countenance;</p>\n<p class="slindent">And one of them, not this one who was speaking,</p>\n<p class="slindent">Twisted himself beneath the weight that cramps him,</p></div>\n\n<div class="stanza"><p>And looked at me, and knew me, and called out,</p>\n<p class="slindent">Keeping his eyes laboriously fixed</p>\n<p class="slindent">On me, who all bowed down was going with them.</p></div>\n\n<div class="stanza"><p>&ldquo;O,&rdquo; asked I him, &ldquo;art thou not Oderisi,</p>\n<p class="slindent">Agobbio&rsquo;s honour, and honour of that art</p>\n<p class="slindent">Which is in Paris called illuminating?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Brother,&rdquo; said he, &ldquo;more laughing are the leaves</p>\n<p class="slindent">Touched by the brush of Franco Bolognese;</p>\n<p class="slindent">All his the honour now, and mine in part.</p></div>\n\n<div class="stanza"><p>In sooth I had not been so courteous</p>\n<p class="slindent">While I was living, for the great desire</p>\n<p class="slindent">Of excellence, on which my heart was bent.</p></div>\n\n<div class="stanza"><p>Here of such pride is paid the forfeiture;</p>\n<p class="slindent">And yet I should not be here, were it not</p>\n<p class="slindent">That, having power to sin, I turned to God.</p></div>\n\n<div class="stanza"><p>O thou vain glory of the human powers,</p>\n<p class="slindent">How little green upon thy summit lingers,</p>\n<p class="slindent">If&rsquo;t be not followed by an age of grossness!</p></div>\n\n<div class="stanza"><p>In painting Cimabue thought that he</p>\n<p class="slindent">Should hold the field, now Giotto has the cry,</p>\n<p class="slindent">So that the other&rsquo;s fame is growing dim.</p></div>\n\n<div class="stanza"><p>So has one Guido from the other taken</p>\n<p class="slindent">The glory of our tongue, and he perchance</p>\n<p class="slindent">Is born, who from the nest shall chase them both.</p></div>\n\n<div class="stanza"><p>Naught is this mundane rumour but a breath</p>\n<p class="slindent">Of wind, that comes now this way and now that,</p>\n<p class="slindent">And changes name, because it changes side.</p></div>\n\n<div class="stanza"><p>What fame shalt thou have more, if old peel off</p>\n<p class="slindent">From thee thy flesh, than if thou hadst been dead</p>\n<p class="slindent">Before thou left the &lsquo;pappo&rsquo; and the &lsquo;dindi,&rsquo;</p></div>\n\n<div class="stanza"><p>Ere pass a thousand years? which is a shorter</p>\n<p class="slindent">Space to the eterne, than twinkling of an eye</p>\n<p class="slindent">Unto the circle that in heaven wheels slowest.</p></div>\n\n<div class="stanza"><p>With him, who takes so little of the road</p>\n<p class="slindent">In front of me, all Tuscany resounded;</p>\n<p class="slindent">And now he scarce is lisped of in Siena,</p></div>\n\n<div class="stanza"><p>Where he was lord, what time was overthrown</p>\n<p class="slindent">The Florentine delirium, that superb</p>\n<p class="slindent">Was at that day as now &rsquo;tis prostitute.</p></div>\n\n<div class="stanza"><p>Your reputation is the colour of grass</p>\n<p class="slindent">Which comes and goes, and that discolours it</p>\n<p class="slindent">By which it issues green from out the earth.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;Thy true speech fills my heart with good</p>\n<p class="slindent">Humility, and great tumour thou assuagest;</p>\n<p class="slindent">But who is he, of whom just now thou spakest?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;That,&rdquo; he replied, &ldquo;is Provenzan Salvani,</p>\n<p class="slindent">And he is here because he had presumed</p>\n<p class="slindent">To bring Siena all into his hands.</p></div>\n\n<div class="stanza"><p>He has gone thus, and goeth without rest</p>\n<p class="slindent">E&rsquo;et since he died; such money renders back</p>\n<p class="slindent">In payment he who is on earth too daring.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;If every spirit who awaits</p>\n<p class="slindent">The verge of life before that he repent,</p>\n<p class="slindent">Remains below there and ascends not hither,</p></div>\n\n<div class="stanza"><p>(Unless good orison shall him bestead,)</p>\n<p class="slindent">Until as much time as he lived be passed,</p>\n<p class="slindent">How was the coming granted him in largess?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;When he in greatest splendour lived,&rdquo; said he,</p>\n<p class="slindent">&ldquo;Freely upon the Campo of Siena,</p>\n<p class="slindent">All shame being laid aside, he placed himself;</p></div>\n\n<div class="stanza"><p>And there to draw his friend from the duress</p>\n<p class="slindent">Which in the prison-house of Charles he suffered,</p>\n<p class="slindent">He brought himself to tremble in each vein.</p></div>\n\n<div class="stanza"><p>I say no more, and know that I speak darkly;</p>\n<p class="slindent">Yet little time shall pass before thy neighbours</p>\n<p class="slindent">Will so demean themselves that thou canst gloss it.</p></div>\n\n<div class="stanza"><p>This action has released him from those confines.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XII</p>\n<div class="stanza"><p>Abreast, like oxen going in a yoke,</p>\n<p class="slindent">I with that heavy-laden soul went on,</p>\n<p class="slindent">As long as the sweet pedagogue permitted;</p></div>\n\n<div class="stanza"><p>But when he said, &ldquo;Leave him, and onward pass,</p>\n<p class="slindent">For here &rsquo;tis good that with the sail and oars,</p>\n<p class="slindent">As much as may be, each push on his barque;&rdquo;</p></div>\n\n<div class="stanza"><p>Upright, as walking wills it, I redressed</p>\n<p class="slindent">My person, notwithstanding that my thoughts</p>\n<p class="slindent">Remained within me downcast and abashed.</p></div>\n\n<div class="stanza"><p>I had moved on, and followed willingly</p>\n<p class="slindent">The footsteps of my Master, and we both</p>\n<p class="slindent">Already showed how light of foot we were,</p></div>\n\n<div class="stanza"><p>When unto me he said: &ldquo;Cast down thine eyes;</p>\n<p class="slindent">&rsquo;Twere well for thee, to alleviate the way,</p>\n<p class="slindent">To look upon the bed beneath thy feet.&rdquo;</p></div>\n\n<div class="stanza"><p>As, that some memory may exist of them,</p>\n<p class="slindent">Above the buried dead their tombs in earth</p>\n<p class="slindent">Bear sculptured on them what they were before;</p></div>\n\n<div class="stanza"><p>Whence often there we weep for them afresh,</p>\n<p class="slindent">From pricking of remembrance, which alone</p>\n<p class="slindent">To the compassionate doth set its spur;</p></div>\n\n<div class="stanza"><p>So saw I there, but of a better semblance</p>\n<p class="slindent">In point of artifice, with figures covered</p>\n<p class="slindent">Whate&rsquo;et as pathway from the mount projects.</p></div>\n\n<div class="stanza"><p>I saw that one who was created noble</p>\n<p class="slindent">More than all other creatures, down from heaven</p>\n<p class="slindent">Flaming with lightnings fall upon one side.</p></div>\n\n<div class="stanza"><p>I saw Briareus smitten by the dart</p>\n<p class="slindent">Celestial, lying on the other side,</p>\n<p class="slindent">Heavy upon the earth by mortal frost.</p></div>\n\n<div class="stanza"><p>I saw Thymbraeus, Pallas saw, and Mars,</p>\n<p class="slindent">Still clad in armour round about their father,</p>\n<p class="slindent">Gaze at the scattered members of the giants.</p></div>\n\n<div class="stanza"><p>I saw, at foot of his great labour, Nimrod,</p>\n<p class="slindent">As if bewildered, looking at the people</p>\n<p class="slindent">Who had been proud with him in Sennaar.</p></div>\n\n<div class="stanza"><p>O Niobe! with what afflicted eyes</p>\n<p class="slindent">Thee I beheld upon the pathway traced,</p>\n<p class="slindent">Between thy seven and seven children slain!</p></div>\n\n<div class="stanza"><p>O Saul! how fallen upon thy proper sword</p>\n<p class="slindent">Didst thou appear there lifeless in Gilboa,</p>\n<p class="slindent">That felt thereafter neither rain nor dew!</p></div>\n\n<div class="stanza"><p>O mad Arachne! so I thee beheld</p>\n<p class="slindent">E&rsquo;en then half spider, sad upon the shreds</p>\n<p class="slindent">Of fabric wrought in evil hour for thee!</p></div>\n\n<div class="stanza"><p>O Rehoboam! no more seems to threaten</p>\n<p class="slindent">Thine image there; but full of consternation</p>\n<p class="slindent">A chariot bears it off, when none pursues!</p></div>\n\n<div class="stanza"><p>Displayed moreo&rsquo;et the adamantine pavement</p>\n<p class="slindent">How unto his own mother made Alcmaeon</p>\n<p class="slindent">Costly appear the luckless ornament;</p></div>\n\n<div class="stanza"><p>Displayed how his own sons did throw themselves</p>\n<p class="slindent">Upon Sennacherib within the temple,</p>\n<p class="slindent">And how, he being dead, they left him there;</p></div>\n\n<div class="stanza"><p>Displayed the ruin and the cruel carnage</p>\n<p class="slindent">That Tomyris wrought, when she to Cyrus said,</p>\n<p class="slindent">&ldquo;Blood didst thou thirst for, and with blood I glut thee!&rdquo;</p></div>\n\n<div class="stanza"><p>Displayed how routed fled the Assyrians</p>\n<p class="slindent">After that Holofernes had been slain,</p>\n<p class="slindent">And likewise the remainder of that slaughter.</p></div>\n\n<div class="stanza"><p>I saw there Troy in ashes and in caverns;</p>\n<p class="slindent">O Ilion! thee, how abject and debased,</p>\n<p class="slindent">Displayed the image that is there discerned!</p></div>\n\n<div class="stanza"><p>Whoe&rsquo;et of pencil master was or stile,</p>\n<p class="slindent">That could portray the shades and traits which there</p>\n<p class="slindent">Would cause each subtile genius to admire?</p></div>\n\n<div class="stanza"><p>Dead seemed the dead, the living seemed alive;</p>\n<p class="slindent">Better than I saw not who saw the truth,</p>\n<p class="slindent">All that I trod upon while bowed I went.</p></div>\n\n<div class="stanza"><p>Now wax ye proud, and on with looks uplifted,</p>\n<p class="slindent">Ye sons of Eve, and bow not down your faces</p>\n<p class="slindent">So that ye may behold your evil ways!</p></div>\n\n<div class="stanza"><p>More of the mount by us was now encompassed,</p>\n<p class="slindent">And far more spent the circuit of the sun,</p>\n<p class="slindent">Than had the mind preoccupied imagined,</p></div>\n\n<div class="stanza"><p>When he, who ever watchful in advance</p>\n<p class="slindent">Was going on, began: &ldquo;Lift up thy head,</p>\n<p class="slindent">&rsquo;Tis no more time to go thus meditating.</p></div>\n\n<div class="stanza"><p>Lo there an Angel who is making haste</p>\n<p class="slindent">To come towards us; lo, returning is</p>\n<p class="slindent">From service of the day the sixth handmaiden.</p></div>\n\n<div class="stanza"><p>With reverence thine acts and looks adorn,</p>\n<p class="slindent">So that he may delight to speed us upward;</p>\n<p class="slindent">Think that this day will never dawn again.&rdquo;</p></div>\n\n<div class="stanza"><p>I was familiar with his admonition</p>\n<p class="slindent">Ever to lose no time; so on this theme</p>\n<p class="slindent">He could not unto me speak covertly.</p></div>\n\n<div class="stanza"><p>Towards us came the being beautiful</p>\n<p class="slindent">Vested in white, and in his countenance</p>\n<p class="slindent">Such as appears the tremulous morning star.</p></div>\n\n<div class="stanza"><p>His arms he opened, and opened then his wings;</p>\n<p class="slindent">&ldquo;Come,&rdquo; said he, &ldquo;near at hand here are the steps,</p>\n<p class="slindent">And easy from henceforth is the ascent.&rdquo;</p></div>\n\n<div class="stanza"><p>At this announcement few are they who come!</p>\n<p class="slindent">O human creatures, born to soar aloft,</p>\n<p class="slindent">Why fall ye thus before a little wind?</p></div>\n\n<div class="stanza"><p>He led us on to where the rock was cleft;</p>\n<p class="slindent">There smote upon my forehead with his wings,</p>\n<p class="slindent">Then a safe passage promised unto me.</p></div>\n\n<div class="stanza"><p>As on the right hand, to ascend the mount</p>\n<p class="slindent">Where seated is the church that lordeth it</p>\n<p class="slindent">O&rsquo;et the well-guided, above Rubaconte,</p></div>\n\n<div class="stanza"><p>The bold abruptness of the ascent is broken</p>\n<p class="slindent">By stairways that were made there in the age</p>\n<p class="slindent">When still were safe the ledger and the stave,</p></div>\n\n<div class="stanza"><p>E&rsquo;en thus attempered is the bank which falls</p>\n<p class="slindent">Sheer downward from the second circle there;</p>\n<p class="slindent">But on this, side and that the high rock graze.</p></div>\n\n<div class="stanza"><p>As we were turning thitherward our persons,</p>\n<p class="slindent">&ldquo;Beati pauperes spiritu,&rdquo; voices</p>\n<p class="slindent">Sang in such wise that speech could tell it not.</p></div>\n\n<div class="stanza"><p>Ah me! how different are these entrances</p>\n<p class="slindent">From the Infernal! for with anthems here</p>\n<p class="slindent">One enters, and below with wild laments.</p></div>\n\n<div class="stanza"><p>We now were hunting up the sacred stairs,</p>\n<p class="slindent">And it appeared to me by far more easy</p>\n<p class="slindent">Than on the plain it had appeared before.</p></div>\n\n<div class="stanza"><p>Whence I: &ldquo;My Master, say, what heavy thing</p>\n<p class="slindent">Has been uplifted from me, so that hardly</p>\n<p class="slindent">Aught of fatigue is felt by me in walking?&rdquo;</p></div>\n\n<div class="stanza"><p>He answered: &ldquo;When the P&rsquo;s which have remained</p>\n<p class="slindent">Still on thy face almost obliterate</p>\n<p class="slindent">Shall wholly, as the first is, be erased,</p></div>\n\n<div class="stanza"><p>Thy feet will be so vanquished by good will,</p>\n<p class="slindent">That not alone they shall not feel fatigue,</p>\n<p class="slindent">But urging up will be to them delight.&rdquo;</p></div>\n\n<div class="stanza"><p>Then did I even as they do who are going</p>\n<p class="slindent">With something on the head to them unknown,</p>\n<p class="slindent">Unless the signs of others make them doubt,</p></div>\n\n<div class="stanza"><p>Wherefore the hand to ascertain is helpful,</p>\n<p class="slindent">And seeks and finds, and doth fulfill the office</p>\n<p class="slindent">Which cannot be accomplished by the sight;</p></div>\n\n<div class="stanza"><p>And with the fingers of the right hand spread</p>\n<p class="slindent">I found but six the letters, that had carved</p>\n<p class="slindent">Upon my temples he who bore the keys;</p></div>\n\n<div class="stanza"><p>Upon beholding which my Leader smiled.</p></div>','<p class="cantohead">Purgatorio: Canto XIII</p>\n<div class="stanza"><p>We were upon the summit of the stairs,</p>\n<p class="slindent">Where for the second time is cut away</p>\n<p class="slindent">The mountain, which ascending shriveth all.</p></div>\n\n<div class="stanza"><p>There in like manner doth a cornice bind</p>\n<p class="slindent">The hill all round about, as does the first,</p>\n<p class="slindent">Save that its arc more suddenly is curved.</p></div>\n\n<div class="stanza"><p>Shade is there none, nor sculpture that appears;</p>\n<p class="slindent">So seems the bank, and so the road seems smooth,</p>\n<p class="slindent">With but the livid colour of the stone.</p></div>\n\n<div class="stanza"><p>&ldquo;If to inquire we wait for people here,&rdquo;</p>\n<p class="slindent">The Poet said, &ldquo;I fear that peradventure</p>\n<p class="slindent">Too much delay will our election have.&rdquo;</p></div>\n\n<div class="stanza"><p>Then steadfast on the sun his eyes he fixed,</p>\n<p class="slindent">Made his right side the centre of his motion,</p>\n<p class="slindent">And turned the left part of himself about.</p></div>\n\n<div class="stanza"><p>&ldquo;O thou sweet light! with trust in whom I enter</p>\n<p class="slindent">Upon this novel journey, do thou lead us,&rdquo;</p>\n<p class="slindent">Said he, &ldquo;as one within here should be led.</p></div>\n\n<div class="stanza"><p>Thou warmest the world, thou shinest over it;</p>\n<p class="slindent">If other reason prompt not otherwise,</p>\n<p class="slindent">Thy rays should evermore our leaders be!&rdquo;</p></div>\n\n<div class="stanza"><p>As much as here is counted for a mile,</p>\n<p class="slindent">So much already there had we advanced</p>\n<p class="slindent">In little time, by dint of ready will;</p></div>\n\n<div class="stanza"><p>And tow&rsquo;rds us there were heard to fly, albeit</p>\n<p class="slindent">They were not visible, spirits uttering</p>\n<p class="slindent">Unto Love&rsquo;s table courteous invitations,</p></div>\n\n<div class="stanza"><p>The first voice that passed onward in its flight,</p>\n<p class="slindent">&ldquo;Vinum non habent,&rdquo; said in accents loud,</p>\n<p class="slindent">And went reiterating it behind us.</p></div>\n\n<div class="stanza"><p>And ere it wholly grew inaudible</p>\n<p class="slindent">Because of distance, passed another, crying,</p>\n<p class="slindent">&ldquo;I am Orestes!&rdquo; and it also stayed not.</p></div>\n\n<div class="stanza"><p>&ldquo;O,&rdquo; said I, &ldquo;Father, these, what voices are they?&rdquo;</p>\n<p class="slindent">And even as I asked, behold the third,</p>\n<p class="slindent">Saying: &ldquo;Love those from whom ye have had evil!&rdquo;</p></div>\n\n<div class="stanza"><p>And the good Master said: &ldquo;This circle scourges</p>\n<p class="slindent">The sin of envy, and on that account</p>\n<p class="slindent">Are drawn from love the lashes of the scourge.</p></div>\n\n<div class="stanza"><p>The bridle of another sound shall be;</p>\n<p class="slindent">I think that thou wilt hear it, as I judge,</p>\n<p class="slindent">Before thou comest to the Pass of Pardon.</p></div>\n\n<div class="stanza"><p>But fix thine eyes athwart the air right steadfast,</p>\n<p class="slindent">And people thou wilt see before us sitting,</p>\n<p class="slindent">And each one close against the cliff is seated.&rdquo;</p></div>\n\n<div class="stanza"><p>Then wider than at first mine eyes I opened;</p>\n<p class="slindent">I looked before me, and saw shades with mantles</p>\n<p class="slindent">Not from the colour of the stone diverse.</p></div>\n\n<div class="stanza"><p>And when we were a little farther onward,</p>\n<p class="slindent">I heard a cry of, &ldquo;Mary, pray for us!&rdquo;</p>\n<p class="slindent">A cry of, &ldquo;Michael, Peter, and all Saints!&rdquo;</p></div>\n\n<div class="stanza"><p>I do not think there walketh still on earth</p>\n<p class="slindent">A man so hard, that he would not be pierced</p>\n<p class="slindent">With pity at what afterward I saw.</p></div>\n\n<div class="stanza"><p>For when I had approached so near to them</p>\n<p class="slindent">That manifest to me their acts became,</p>\n<p class="slindent">Drained was I at the eyes by heavy grief.</p></div>\n\n<div class="stanza"><p>Covered with sackcloth vile they seemed to me,</p>\n<p class="slindent">And one sustained the other with his shoulder,</p>\n<p class="slindent">And all of them were by the bank sustained.</p></div>\n\n<div class="stanza"><p>Thus do the blind, in want of livelihood,</p>\n<p class="slindent">Stand at the doors of churches asking alms,</p>\n<p class="slindent">And one upon another leans his head,</p></div>\n\n<div class="stanza"><p>So that in others pity soon may rise,</p>\n<p class="slindent">Not only at the accent of their words,</p>\n<p class="slindent">But at their aspect, which no less implores.</p></div>\n\n<div class="stanza"><p>And as unto the blind the sun comes not,</p>\n<p class="slindent">So to the shades, of whom just now I spake,</p>\n<p class="slindent">Heaven&rsquo;s light will not be bounteous of itself;</p></div>\n\n<div class="stanza"><p>For all their lids an iron wire transpierces,</p>\n<p class="slindent">And sews them up, as to a sparhawk wild</p>\n<p class="slindent">Is done, because it will not quiet stay.</p></div>\n\n<div class="stanza"><p>To me it seemed, in passing, to do outrage,</p>\n<p class="slindent">Seeing the others without being seen;</p>\n<p class="slindent">Wherefore I turned me to my counsel sage.</p></div>\n\n<div class="stanza"><p>Well knew he what the mute one wished to say,</p>\n<p class="slindent">And therefore waited not for my demand,</p>\n<p class="slindent">But said: &ldquo;Speak, and be brief, and to the point.&rdquo;</p></div>\n\n<div class="stanza"><p>I had Virgilius upon that side</p>\n<p class="slindent">Of the embankment from which one may fall,</p>\n<p class="slindent">Since by no border &rsquo;tis engarlanded;</p></div>\n\n<div class="stanza"><p>Upon the other side of me I had</p>\n<p class="slindent">The shades devout, who through the horrible seam</p>\n<p class="slindent">Pressed out the tears so that they bathed their cheeks.</p></div>\n\n<div class="stanza"><p>To them I turned me, and, &ldquo;O people, certain,&rdquo;</p>\n<p class="slindent">Began I, &ldquo;of beholding the high light,</p>\n<p class="slindent">Which your desire has solely in its care,</p></div>\n\n<div class="stanza"><p>So may grace speedily dissolve the scum</p>\n<p class="slindent">Upon your consciences, that limpidly</p>\n<p class="slindent">Through them descend the river of the mind,</p></div>\n\n<div class="stanza"><p>Tell me, for dear &rsquo;twill be to me and gracious,</p>\n<p class="slindent">If any soul among you here is Latian,</p>\n<p class="slindent">And &rsquo;twill perchance be good for him I learn it.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O brother mine, each one is citizen</p>\n<p class="slindent">Of one true city; but thy meaning is,</p>\n<p class="slindent">Who may have lived in Italy a pilgrim.&rdquo;</p></div>\n\n<div class="stanza"><p>By way of answer this I seemed to hear</p>\n<p class="slindent">A little farther on than where I stood,</p>\n<p class="slindent">Whereat I made myself still nearer heard.</p></div>\n\n<div class="stanza"><p>Among the rest I saw a shade that waited</p>\n<p class="slindent">In aspect, and should any one ask how,</p>\n<p class="slindent">Its chin it lifted upward like a blind man.</p></div>\n\n<div class="stanza"><p>&ldquo;Spirit,&rdquo; I said, &ldquo;who stoopest to ascend,</p>\n<p class="slindent">If thou art he who did reply to me,</p>\n<p class="slindent">Make thyself known to me by place or name.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Sienese was I,&rdquo; it replied, &ldquo;and with</p>\n<p class="slindent">The others here recleanse my guilty life,</p>\n<p class="slindent">Weeping to Him to lend himself to us.</p></div>\n\n<div class="stanza"><p>Sapient I was not, although I Sapia</p>\n<p class="slindent">Was called, and I was at another&rsquo;s harm</p>\n<p class="slindent">More happy far than at my own good fortune.</p></div>\n\n<div class="stanza"><p>And that thou mayst not think that I deceive thee,</p>\n<p class="slindent">Hear if I was as foolish as I tell thee.</p>\n<p class="slindent">The arc already of my years descending,</p></div>\n\n<div class="stanza"><p>My fellow-citizens near unto Colle</p>\n<p class="slindent">Were joined in battle with their adversaries,</p>\n<p class="slindent">And I was praying God for what he willed.</p></div>\n\n<div class="stanza"><p>Routed were they, and turned into the bitter</p>\n<p class="slindent">Passes of flight; and I, the chase beholding,</p>\n<p class="slindent">A joy received unequalled by all others;</p></div>\n\n<div class="stanza"><p>So that I lifted upward my bold face</p>\n<p class="slindent">Crying to God, &lsquo;Henceforth I fear thee not,&rsquo;</p>\n<p class="slindent">As did the blackbird at the little sunshine.</p></div>\n\n<div class="stanza"><p>Peace I desired with God at the extreme</p>\n<p class="slindent">Of my existence, and as yet would not</p>\n<p class="slindent">My debt have been by penitence discharged,</p></div>\n\n<div class="stanza"><p>Had it not been that in remembrance held me</p>\n<p class="slindent">Pier Pettignano in his holy prayers,</p>\n<p class="slindent">Who out of charity was grieved for me.</p></div>\n\n<div class="stanza"><p>But who art thou, that into our conditions</p>\n<p class="slindent">Questioning goest, and hast thine eyes unbound</p>\n<p class="slindent">As I believe, and breathing dost discourse?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Mine eyes,&rdquo; I said, &ldquo;will yet be here ta&rsquo;en from me,</p>\n<p class="slindent">But for short space; for small is the offence</p>\n<p class="slindent">Committed by their being turned with envy.</p></div>\n\n<div class="stanza"><p>Far greater is the fear, wherein suspended</p>\n<p class="slindent">My soul is, of the torment underneath,</p>\n<p class="slindent">For even now the load down there weighs on me.&rdquo;</p></div>\n\n<div class="stanza"><p>And she to me: &ldquo;Who led thee, then, among us</p>\n<p class="slindent">Up here, if to return below thou thinkest?&rdquo;</p>\n<p class="slindent">And I: &ldquo;He who is with me, and speaks not;</p></div>\n\n<div class="stanza"><p>And living am I; therefore ask of me,</p>\n<p class="slindent">Spirit elect, if thou wouldst have me move</p>\n<p class="slindent">O&rsquo;et yonder yet my mortal feet for thee.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O, this is such a novel thing to hear,&rdquo;</p>\n<p class="slindent">She answered, &ldquo;that great sign it is God loves thee;</p>\n<p class="slindent">Therefore with prayer of thine sometimes assist me.</p></div>\n\n<div class="stanza"><p>And I implore, by what thou most desirest,</p>\n<p class="slindent">If e&rsquo;et thou treadest the soil of Tuscany,</p>\n<p class="slindent">Well with my kindred reinstate my fame.</p></div>\n\n<div class="stanza"><p>Them wilt thou see among that people vain</p>\n<p class="slindent">Who hope in Talamone, and will lose there</p>\n<p class="slindent">More hope than in discovering the Diana;</p></div>\n\n<div class="stanza"><p>But there still more the admirals will lose.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XIV</p>\n<div class="stanza"><p>&ldquo;Who is this one that goes about our mountain,</p>\n<p class="slindent">Or ever Death has given him power of flight,</p>\n<p class="slindent">And opes his eyes and shuts them at his will?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;I know not who, but know he&rsquo;s not alone;</p>\n<p class="slindent">Ask him thyself, for thou art nearer to him,</p>\n<p class="slindent">And gently, so that he may speak, accost him.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus did two spirits, leaning tow&rsquo;rds each other,</p>\n<p class="slindent">Discourse about me there on the right hand;</p>\n<p class="slindent">Then held supine their faces to address me.</p></div>\n\n<div class="stanza"><p>And said the one: &ldquo;O soul, that, fastened still</p>\n<p class="slindent">Within the body, tow&rsquo;rds the heaven art going,</p>\n<p class="slindent">For charity console us, and declare</p></div>\n\n<div class="stanza"><p>Whence comest and who art thou; for thou mak&rsquo;st us</p>\n<p class="slindent">As much to marvel at this grace of thine</p>\n<p class="slindent">As must a thing that never yet has been.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;Through midst of Tuscany there wanders</p>\n<p class="slindent">A streamlet that is born in Falterona,</p>\n<p class="slindent">And not a hundred miles of course suffice it;</p></div>\n\n<div class="stanza"><p>From thereupon do I this body bring.</p>\n<p class="slindent">To tell you who I am were speech in vain,</p>\n<p class="slindent">Because my name as yet makes no great noise.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;If well thy meaning I can penetrate</p>\n<p class="slindent">With intellect of mine,&rdquo; then answered me</p>\n<p class="slindent">He who first spake, &ldquo;thou speakest of the Arno.&rdquo;</p></div>\n\n<div class="stanza"><p>And said the other to him: &ldquo;Why concealed</p>\n<p class="slindent">This one the appellation of that river,</p>\n<p class="slindent">Even as a man doth of things horrible?&rdquo;</p></div>\n\n<div class="stanza"><p>And thus the shade that questioned was of this</p>\n<p class="slindent">Himself acquitted: &ldquo;I know not; but truly</p>\n<p class="slindent">&rsquo;Tis fit the name of such a valley perish;</p></div>\n\n<div class="stanza"><p>For from its fountain-head (where is so pregnant</p>\n<p class="slindent">The Alpine mountain whence is cleft Peloro</p>\n<p class="slindent">That in few places it that mark surpasses)</p></div>\n\n<div class="stanza"><p>To where it yields itself in restoration</p>\n<p class="slindent">Of what the heaven doth of the sea dry up,</p>\n<p class="slindent">Whence have the rivers that which goes with them,</p></div>\n\n<div class="stanza"><p>Virtue is like an enemy avoided</p>\n<p class="slindent">By all, as is a serpent, through misfortune</p>\n<p class="slindent">Of place, or through bad habit that impels them;</p></div>\n\n<div class="stanza"><p>On which account have so transformed their nature</p>\n<p class="slindent">The dwellers in that miserable valley,</p>\n<p class="slindent">It seems that Circe had them in her pasture.</p></div>\n\n<div class="stanza"><p>&rsquo;Mid ugly swine, of acorns worthier</p>\n<p class="slindent">Than other food for human use created,</p>\n<p class="slindent">It first directeth its impoverished way.</p></div>\n\n<div class="stanza"><p>Curs findeth it thereafter, coming downward,</p>\n<p class="slindent">More snarling than their puissance demands,</p>\n<p class="slindent">And turns from them disdainfully its muzzle.</p></div>\n\n<div class="stanza"><p>It goes on falling, and the more it grows,</p>\n<p class="slindent">The more it finds the dogs becoming wolves,</p>\n<p class="slindent">This maledict and misadventurous ditch.</p></div>\n\n<div class="stanza"><p>Descended then through many a hollow gulf,</p>\n<p class="slindent">It finds the foxes so replete with fraud,</p>\n<p class="slindent">They fear no cunning that may master them.</p></div>\n\n<div class="stanza"><p>Nor will I cease because another hears me;</p>\n<p class="slindent">And well &rsquo;twill be for him, if still he mind him</p>\n<p class="slindent">Of what a truthful spirit to me unravels.</p></div>\n\n<div class="stanza"><p>Thy grandson I behold, who doth become</p>\n<p class="slindent">A hunter of those wolves upon the bank</p>\n<p class="slindent">Of the wild stream, and terrifies them all.</p></div>\n\n<div class="stanza"><p>He sells their flesh, it being yet alive;</p>\n<p class="slindent">Thereafter slaughters them like ancient beeves;</p>\n<p class="slindent">Many of life, himself of praise, deprives.</p></div>\n\n<div class="stanza"><p>Blood-stained he issues from the dismal forest;</p>\n<p class="slindent">He leaves it such, a thousand years from now</p>\n<p class="slindent">In its primeval state &rsquo;tis not re-wooded.&rdquo;</p></div>\n\n<div class="stanza"><p>As at the announcement of impending ills</p>\n<p class="slindent">The face of him who listens is disturbed,</p>\n<p class="slindent">From whate&rsquo;et side the peril seize upon him;</p></div>\n\n<div class="stanza"><p>So I beheld that other soul, which stood</p>\n<p class="slindent">Turned round to listen, grow disturbed and sad,</p>\n<p class="slindent">When it had gathered to itself the word.</p></div>\n\n<div class="stanza"><p>The speech of one and aspect of the other</p>\n<p class="slindent">Had me desirous made to know their names,</p>\n<p class="slindent">And question mixed with prayers I made thereof,</p></div>\n\n<div class="stanza"><p>Whereat the spirit which first spake to me</p>\n<p class="slindent">Began again: &ldquo;Thou wishest I should bring me</p>\n<p class="slindent">To do for thee what thou&rsquo;lt not do for me;</p></div>\n\n<div class="stanza"><p>But since God willeth that in thee shine forth</p>\n<p class="slindent">Such grace of his, I&rsquo;ll not be chary with thee;</p>\n<p class="slindent">Know, then, that I Guido del Duca am.</p></div>\n\n<div class="stanza"><p>My blood was so with envy set on fire,</p>\n<p class="slindent">That if I had beheld a man make merry,</p>\n<p class="slindent">Thou wouldst have seen me sprinkled o&rsquo;et with pallor.</p></div>\n\n<div class="stanza"><p>From my own sowing such the straw I reap!</p>\n<p class="slindent">O human race! why dost thou set thy heart</p>\n<p class="slindent">Where interdict of partnership must be?</p></div>\n\n<div class="stanza"><p>This is Renier; this is the boast and honour</p>\n<p class="slindent">Of the house of Calboli, where no one since</p>\n<p class="slindent">Has made himself the heir of his desert.</p></div>\n\n<div class="stanza"><p>And not alone his blood is made devoid,</p>\n<p class="slindent">&rsquo;Twixt Po and mount, and sea-shore and the Reno,</p>\n<p class="slindent">Of good required for truth and for diversion;</p></div>\n\n<div class="stanza"><p>For all within these boundaries is full</p>\n<p class="slindent">Of venomous roots, so that too tardily</p>\n<p class="slindent">By cultivation now would they diminish.</p></div>\n\n<div class="stanza"><p>Where is good Lizio, and Arrigo Manardi,</p>\n<p class="slindent">Pier Traversaro, and Guido di Carpigna,</p>\n<p class="slindent">O Romagnuoli into bastards turned?</p></div>\n\n<div class="stanza"><p>When in Bologna will a Fabbro rise?</p>\n<p class="slindent">When in Faenza a Bernardin di Fosco,</p>\n<p class="slindent">The noble scion of ignoble seed?</p></div>\n\n<div class="stanza"><p>Be not astonished, Tuscan, if I weep,</p>\n<p class="slindent">When I remember, with Guido da Prata,</p>\n<p class="slindent">Ugolin d&rsquo; Azzo, who was living with us,</p></div>\n\n<div class="stanza"><p>Frederick Tignoso and his company,</p>\n<p class="slindent">The house of Traversara, and th&rsquo; Anastagi,</p>\n<p class="slindent">And one race and the other is extinct;</p></div>\n\n<div class="stanza"><p>The dames and cavaliers, the toils and ease</p>\n<p class="slindent">That filled our souls with love and courtesy,</p>\n<p class="slindent">There where the hearts have so malicious grown!</p></div>\n\n<div class="stanza"><p>O Brettinoro! why dost thou not flee,</p>\n<p class="slindent">Seeing that all thy family is gone,</p>\n<p class="slindent">And many people, not to be corrupted?</p></div>\n\n<div class="stanza"><p>Bagnacaval does well in not begetting</p>\n<p class="slindent">And ill does Castrocaro, and Conio worse,</p>\n<p class="slindent">In taking trouble to beget such Counts.</p></div>\n\n<div class="stanza"><p>Will do well the Pagani, when their Devil</p>\n<p class="slindent">Shall have departed; but not therefore pure</p>\n<p class="slindent">Will testimony of them e&rsquo;et remain.</p></div>\n\n<div class="stanza"><p>O Ugolin de&rsquo; Fantoli, secure</p>\n<p class="slindent">Thy name is, since no longer is awaited</p>\n<p class="slindent">One who, degenerating, can obscure it!</p></div>\n\n<div class="stanza"><p>But go now, Tuscan, for it now delights me</p>\n<p class="slindent">To weep far better than it does to speak,</p>\n<p class="slindent">So much has our discourse my mind distressed.&rdquo;</p></div>\n\n<div class="stanza"><p>We were aware that those beloved souls</p>\n<p class="slindent">Heard us depart; therefore, by keeping silent,</p>\n<p class="slindent">They made us of our pathway confident.</p></div>\n\n<div class="stanza"><p>When we became alone by going onward,</p>\n<p class="slindent">Thunder, when it doth cleave the air, appeared</p>\n<p class="slindent">A voice, that counter to us came, exclaiming:</p></div>\n\n<div class="stanza"><p>&ldquo;Shall slay me whosoever findeth me!&rdquo;</p>\n<p class="slindent">And fled as the reverberation dies</p>\n<p class="slindent">If suddenly the cloud asunder bursts.</p></div>\n\n<div class="stanza"><p>As soon as hearing had a truce from this,</p>\n<p class="slindent">Behold another, with so great a crash,</p>\n<p class="slindent">That it resembled thunderings following fast:</p></div>\n\n<div class="stanza"><p>&ldquo;I am Aglaurus, who became a stone!&rdquo;</p>\n<p class="slindent">And then, to press myself close to the Poet,</p>\n<p class="slindent">I backward, and not forward, took a step.</p></div>\n\n<div class="stanza"><p>Already on all sides the air was quiet;</p>\n<p class="slindent">And said he to me: &ldquo;That was the hard curb</p>\n<p class="slindent">That ought to hold a man within his bounds;</p></div>\n\n<div class="stanza"><p>But you take in the bait so that the hook</p>\n<p class="slindent">Of the old Adversary draws you to him,</p>\n<p class="slindent">And hence availeth little curb or call.</p></div>\n\n<div class="stanza"><p>The heavens are calling you, and wheel around you,</p>\n<p class="slindent">Displaying to you their eternal beauties,</p>\n<p class="slindent">And still your eye is looking on the ground;</p></div>\n\n<div class="stanza"><p>Whence He, who all discerns, chastises you.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XV</p>\n<div class="stanza"><p>As much as &rsquo;twixt the close of the third hour</p>\n<p class="slindent">And dawn of day appeareth of that sphere</p>\n<p class="slindent">Which aye in fashion of a child is playing,</p></div>\n\n<div class="stanza"><p>So much it now appeared, towards the night,</p>\n<p class="slindent">Was of his course remaining to the sun;</p>\n<p class="slindent">There it was evening, and &rsquo;twas midnight here;</p></div>\n\n<div class="stanza"><p>And the rays smote the middle of our faces,</p>\n<p class="slindent">Because by us the mount was so encircled,</p>\n<p class="slindent">That straight towards the west we now were going</p></div>\n\n<div class="stanza"><p>When I perceived my forehead overpowered</p>\n<p class="slindent">Beneath the splendour far more than at first,</p>\n<p class="slindent">And stupor were to me the things unknown,</p></div>\n\n<div class="stanza"><p>Whereat towards the summit of my brow</p>\n<p class="slindent">I raised my hands, and made myself the visor</p>\n<p class="slindent">Which the excessive glare diminishes.</p></div>\n\n<div class="stanza"><p>As when from off the water, or a mirror,</p>\n<p class="slindent">The sunbeam leaps unto the opposite side,</p>\n<p class="slindent">Ascending upward in the selfsame measure</p></div>\n\n<div class="stanza"><p>That it descends, and deviates as far</p>\n<p class="slindent">From falling of a stone in line direct,</p>\n<p class="slindent">(As demonstrate experiment and art,)</p></div>\n\n<div class="stanza"><p>So it appeared to me that by a light</p>\n<p class="slindent">Refracted there before me I was smitten;</p>\n<p class="slindent">On which account my sight was swift to flee.</p></div>\n\n<div class="stanza"><p>&ldquo;What is that, Father sweet, from which I cannot</p>\n<p class="slindent">So fully screen my sight that it avail me,&rdquo;</p>\n<p class="slindent">Said I, &ldquo;and seems towards us to be moving?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Marvel thou not, if dazzle thee as yet</p>\n<p class="slindent">The family of heaven,&rdquo; he answered me;</p>\n<p class="slindent">&ldquo;An angel &rsquo;tis, who comes to invite us upward.</p></div>\n\n<div class="stanza"><p>Soon will it be, that to behold these things</p>\n<p class="slindent">Shall not be grievous, but delightful to thee</p>\n<p class="slindent">As much as nature fashioned thee to feel.&rdquo;</p></div>\n\n<div class="stanza"><p>When we had reached the Angel benedight,</p>\n<p class="slindent">With joyful voice he said: &ldquo;Here enter in</p>\n<p class="slindent">To stairway far less steep than are the others.&rdquo;</p></div>\n\n<div class="stanza"><p>We mounting were, already thence departed,</p>\n<p class="slindent">And &ldquo;Beati misericordes&rdquo; was</p>\n<p class="slindent">Behind us sung, &ldquo;Rejoice, thou that o&rsquo;etcomest!&rdquo;</p></div>\n\n<div class="stanza"><p>My Master and myself, we two alone</p>\n<p class="slindent">Were going upward, and I thought, in going,</p>\n<p class="slindent">Some profit to acquire from words of his;</p></div>\n\n<div class="stanza"><p>And I to him directed me, thus asking:</p>\n<p class="slindent">&ldquo;What did the spirit of Romagna mean,</p>\n<p class="slindent">Mentioning interdict and partnership?&rdquo;</p></div>\n\n<div class="stanza"><p>Whence he to me: &ldquo;Of his own greatest failing</p>\n<p class="slindent">He knows the harm; and therefore wonder not</p>\n<p class="slindent">If he reprove us, that we less may rue it.</p></div>\n\n<div class="stanza"><p>Because are thither pointed your desires</p>\n<p class="slindent">Where by companionship each share is lessened,</p>\n<p class="slindent">Envy doth ply the bellows to your sighs.</p></div>\n\n<div class="stanza"><p>But if the love of the supernal sphere</p>\n<p class="slindent">Should upwardly direct your aspiration,</p>\n<p class="slindent">There would not be that fear within your breast;</p></div>\n\n<div class="stanza"><p>For there, as much the more as one says &lsquo;Our,&rsquo;</p>\n<p class="slindent">So much the more of good each one possesses,</p>\n<p class="slindent">And more of charity in that cloister burns.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;I am more hungering to be satisfied,&rdquo;</p>\n<p class="slindent">I said, &ldquo;than if I had before been silent,</p>\n<p class="slindent">And more of doubt within my mind I gather.</p></div>\n\n<div class="stanza"><p>How can it be, that boon distributed</p>\n<p class="slindent">The more possessors can more wealthy make</p>\n<p class="slindent">Therein, than if by few it be possessed?&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;Because thou fixest still</p>\n<p class="slindent">Thy mind entirely upon earthly things,</p>\n<p class="slindent">Thou pluckest darkness from the very light.</p></div>\n\n<div class="stanza"><p>That goodness infinite and ineffable</p>\n<p class="slindent">Which is above there, runneth unto love,</p>\n<p class="slindent">As to a lucid body comes the sunbeam.</p></div>\n\n<div class="stanza"><p>So much it gives itself as it finds ardour,</p>\n<p class="slindent">So that as far as charity extends,</p>\n<p class="slindent">O&rsquo;et it increases the eternal valour.</p></div>\n\n<div class="stanza"><p>And the more people thitherward aspire,</p>\n<p class="slindent">More are there to love well, and more they love there,</p>\n<p class="slindent">And, as a mirror, one reflects the other.</p></div>\n\n<div class="stanza"><p>And if my reasoning appease thee not,</p>\n<p class="slindent">Thou shalt see Beatrice; and she will fully</p>\n<p class="slindent">Take from thee this and every other longing.</p></div>\n\n<div class="stanza"><p>Endeavour, then, that soon may be extinct,</p>\n<p class="slindent">As are the two already, the five wounds</p>\n<p class="slindent">That close themselves again by being painful.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as I wished to say, &ldquo;Thou dost appease me,&rdquo;</p>\n<p class="slindent">I saw that I had reached another circle,</p>\n<p class="slindent">So that my eager eyes made me keep silence.</p></div>\n\n<div class="stanza"><p>There it appeared to me that in a vision</p>\n<p class="slindent">Ecstatic on a sudden I was rapt,</p>\n<p class="slindent">And in a temple many persons saw;</p></div>\n\n<div class="stanza"><p>And at the door a woman, with the sweet</p>\n<p class="slindent">Behaviour of a mother, saying: &ldquo;Son,</p>\n<p class="slindent">Why in this manner hast thou dealt with us?</p></div>\n\n<div class="stanza"><p>Lo, sorrowing, thy father and myself</p>\n<p class="slindent">Were seeking for thee;&rdquo;&mdash;and as here she ceased,</p>\n<p class="slindent">That which appeared at first had disappeared.</p></div>\n\n<div class="stanza"><p>Then I beheld another with those waters</p>\n<p class="slindent">Adown her cheeks which grief distils whenever</p>\n<p class="slindent">From great disdain of others it is born,</p></div>\n\n<div class="stanza"><p>And saying: &ldquo;If of that city thou art lord,</p>\n<p class="slindent">For whose name was such strife among the gods,</p>\n<p class="slindent">And whence doth every science scintillate,</p></div>\n\n<div class="stanza"><p>Avenge thyself on those audacious arms</p>\n<p class="slindent">That clasped our daughter, O Pisistratus;&rdquo;</p>\n<p class="slindent">And the lord seemed to me benign and mild</p></div>\n\n<div class="stanza"><p>To answer her with aspect temperate:</p>\n<p class="slindent">&ldquo;What shall we do to those who wish us ill,</p>\n<p class="slindent">If he who loves us be by us condemned?&rdquo;</p></div>\n\n<div class="stanza"><p>Then saw I people hot in fire of wrath,</p>\n<p class="slindent">With stones a young man slaying, clamorously</p>\n<p class="slindent">Still crying to each other, &ldquo;Kill him! kill him!&rdquo;</p></div>\n\n<div class="stanza"><p>And him I saw bow down, because of death</p>\n<p class="slindent">That weighed already on him, to the earth,</p>\n<p class="slindent">But of his eyes made ever gates to heaven,</p></div>\n\n<div class="stanza"><p>Imploring the high Lord, in so great strife,</p>\n<p class="slindent">That he would pardon those his persecutors,</p>\n<p class="slindent">With such an aspect as unlocks compassion.</p></div>\n\n<div class="stanza"><p>Soon as my soul had outwardly returned</p>\n<p class="slindent">To things external to it which are true,</p>\n<p class="slindent">Did I my not false errors recognize.</p></div>\n\n<div class="stanza"><p>My Leader, who could see me bear myself</p>\n<p class="slindent">Like to a man that rouses him from sleep,</p>\n<p class="slindent">Exclaimed: &ldquo;What ails thee, that thou canst not stand?</p></div>\n\n<div class="stanza"><p>But hast been coming more than half a league</p>\n<p class="slindent">Veiling thine eyes, and with thy legs entangled,</p>\n<p class="slindent">In guise of one whom wine or sleep subdues?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O my sweet Father, if thou listen to me,</p>\n<p class="slindent">I&rsquo;ll tell thee,&rdquo; said I, &ldquo;what appeared to me,</p>\n<p class="slindent">When thus from me my legs were ta&rsquo;en away.&rdquo;</p></div>\n\n<div class="stanza"><p>And he: &ldquo;If thou shouldst have a hundred masks</p>\n<p class="slindent">Upon thy face, from me would not be shut</p>\n<p class="slindent">Thy cogitations, howsoever small.</p></div>\n\n<div class="stanza"><p>What thou hast seen was that thou mayst not fail</p>\n<p class="slindent">To ope thy heart unto the waters of peace,</p>\n<p class="slindent">Which from the eternal fountain are diffused.</p></div>\n\n<div class="stanza"><p>I did not ask, &lsquo;What ails thee?&rsquo; as he does</p>\n<p class="slindent">Who only looketh with the eyes that see not</p>\n<p class="slindent">When of the soul bereft the body lies,</p></div>\n\n<div class="stanza"><p>But asked it to give vigour to thy feet;</p>\n<p class="slindent">Thus must we needs urge on the sluggards, slow</p>\n<p class="slindent">To use their wakefulness when it returns.&rdquo;</p></div>\n\n<div class="stanza"><p>We passed along, athwart the twilight peering</p>\n<p class="slindent">Forward as far as ever eye could stretch</p>\n<p class="slindent">Against the sunbeams serotine and lucent;</p></div>\n\n<div class="stanza"><p>And lo! by slow degrees a smoke approached</p>\n<p class="slindent">In our direction, sombre as the night,</p>\n<p class="slindent">Nor was there place to hide one&rsquo;s self therefrom.</p></div>\n\n<div class="stanza"><p>This of our eyes and the pure air bereft us.</p></div>','<p class="cantohead">Purgatorio: Canto XVI</p>\n<div class="stanza"><p>Darkness of hell, and of a night deprived</p>\n<p class="slindent">Of every planet under a poor sky,</p>\n<p class="slindent">As much as may be tenebrous with cloud,</p></div>\n\n<div class="stanza"><p>Ne&rsquo;et made unto my sight so thick a veil,</p>\n<p class="slindent">As did that smoke which there enveloped us,</p>\n<p class="slindent">Nor to the feeling of so rough a texture;</p></div>\n\n<div class="stanza"><p>For not an eye it suffered to stay open;</p>\n<p class="slindent">Whereat mine escort, faithful and sagacious,</p>\n<p class="slindent">Drew near to me and offered me his shoulder.</p></div>\n\n<div class="stanza"><p>E&rsquo;en as a blind man goes behind his guide,</p>\n<p class="slindent">Lest he should wander, or should strike against</p>\n<p class="slindent">Aught that may harm or peradventure kill him,</p></div>\n\n<div class="stanza"><p>So went I through the bitter and foul air,</p>\n<p class="slindent">Listening unto my Leader, who said only,</p>\n<p class="slindent">&ldquo;Look that from me thou be not separated.&rdquo;</p></div>\n\n<div class="stanza"><p>Voices I heard, and every one appeared</p>\n<p class="slindent">To supplicate for peace and misericord</p>\n<p class="slindent">The Lamb of God who takes away our sins.</p></div>\n\n<div class="stanza"><p>Still &ldquo;Agnus Dei&rdquo; their exordium was;</p>\n<p class="slindent">One word there was in all, and metre one,</p>\n<p class="slindent">So that all harmony appeared among them.</p></div>\n\n<div class="stanza"><p>&ldquo;Master,&rdquo; I said, &ldquo;are spirits those I hear?&rdquo;</p>\n<p class="slindent">And he to me: &ldquo;Thou apprehendest truly,</p>\n<p class="slindent">And they the knot of anger go unloosing.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Now who art thou, that cleavest through our smoke</p>\n<p class="slindent">And art discoursing of us even as though</p>\n<p class="slindent">Thou didst by calends still divide the time?&rdquo;</p></div>\n\n<div class="stanza"><p>After this manner by a voice was spoken;</p>\n<p class="slindent">Whereon my Master said: &ldquo;Do thou reply,</p>\n<p class="slindent">And ask if on this side the way go upward.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;O creature that dost cleanse thyself</p>\n<p class="slindent">To return beautiful to Him who made thee,</p>\n<p class="slindent">Thou shalt hear marvels if thou follow me.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Thee will I follow far as is allowed me,&rdquo;</p>\n<p class="slindent">He answered; &ldquo;and if smoke prevent our seeing,</p>\n<p class="slindent">Hearing shall keep us joined instead thereof.&rdquo;</p></div>\n\n<div class="stanza"><p>Thereon began I: &ldquo;With that swathing band</p>\n<p class="slindent">Which death unwindeth am I going upward,</p>\n<p class="slindent">And hither came I through the infernal anguish.</p></div>\n\n<div class="stanza"><p>And if God in his grace has me infolded,</p>\n<p class="slindent">So that he wills that I behold his court</p>\n<p class="slindent">By method wholly out of modern usage,</p></div>\n\n<div class="stanza"><p>Conceal not from me who ere death thou wast,</p>\n<p class="slindent">But tell it me, and tell me if I go</p>\n<p class="slindent">Right for the pass, and be thy words our escort.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Lombard was I, and I was Marco called;</p>\n<p class="slindent">The world I knew, and loved that excellence,</p>\n<p class="slindent">At which has each one now unbent his bow.</p></div>\n\n<div class="stanza"><p>For mounting upward, thou art going right.&rdquo;</p>\n<p class="slindent">Thus he made answer, and subjoined: &ldquo;I pray thee</p>\n<p class="slindent">To pray for me when thou shalt be above.&rdquo;</p></div>\n\n<div class="stanza"><p>And I to him: &ldquo;My faith I pledge to thee</p>\n<p class="slindent">To do what thou dost ask me; but am bursting</p>\n<p class="slindent">Inly with doubt, unless I rid me of it.</p></div>\n\n<div class="stanza"><p>First it was simple, and is now made double</p>\n<p class="slindent">By thy opinion, which makes certain to me,</p>\n<p class="slindent">Here and elsewhere, that which I couple with it.</p></div>\n\n<div class="stanza"><p>The world forsooth is utterly deserted</p>\n<p class="slindent">By every virtue, as thou tellest me,</p>\n<p class="slindent">And with iniquity is big and covered;</p></div>\n\n<div class="stanza"><p>But I beseech thee point me out the cause,</p>\n<p class="slindent">That I may see it, and to others show it;</p>\n<p class="slindent">For one in the heavens, and here below one puts it.&rdquo;</p></div>\n\n<div class="stanza"><p>A sigh profound, that grief forced into Ai!</p>\n<p class="slindent">He first sent forth, and then began he: &ldquo;Brother,</p>\n<p class="slindent">The world is blind, and sooth thou comest from it!</p></div>\n\n<div class="stanza"><p>Ye who are living every cause refer</p>\n<p class="slindent">Still upward to the heavens, as if all things</p>\n<p class="slindent">They of necessity moved with themselves.</p></div>\n\n<div class="stanza"><p>If this were so, in you would be destroyed</p>\n<p class="slindent">Free will, nor any justice would there be</p>\n<p class="slindent">In having joy for good, or grief for evil.</p></div>\n\n<div class="stanza"><p>The heavens your movements do initiate,</p>\n<p class="slindent">I say not all; but granting that I say it,</p>\n<p class="slindent">Light has been given you for good and evil,</p></div>\n\n<div class="stanza"><p>And free volition; which, if some fatigue</p>\n<p class="slindent">In the first battles with the heavens it suffers,</p>\n<p class="slindent">Afterwards conquers all, if well &rsquo;tis nurtured.</p></div>\n\n<div class="stanza"><p>To greater force and to a better nature,</p>\n<p class="slindent">Though free, ye subject are, and that creates</p>\n<p class="slindent">The mind in you the heavens have not in charge.</p></div>\n\n<div class="stanza"><p>Hence, if the present world doth go astray,</p>\n<p class="slindent">In you the cause is, be it sought in you;</p>\n<p class="slindent">And I therein will now be thy true spy.</p></div>\n\n<div class="stanza"><p>Forth from the hand of Him, who fondles it</p>\n<p class="slindent">Before it is, like to a little girl</p>\n<p class="slindent">Weeping and laughing in her childish sport,</p></div>\n\n<div class="stanza"><p>Issues the simple soul, that nothing knows,</p>\n<p class="slindent">Save that, proceeding from a joyous Maker,</p>\n<p class="slindent">Gladly it turns to that which gives it pleasure.</p></div>\n\n<div class="stanza"><p>Of trivial good at first it tastes the savour;</p>\n<p class="slindent">Is cheated by it, and runs after it,</p>\n<p class="slindent">If guide or rein turn not aside its love.</p></div>\n\n<div class="stanza"><p>Hence it behoved laws for a rein to place,</p>\n<p class="slindent">Behoved a king to have, who at the least</p>\n<p class="slindent">Of the true city should discern the tower.</p></div>\n\n<div class="stanza"><p>The laws exist, but who sets hand to them?</p>\n<p class="slindent">No one; because the shepherd who precedes</p>\n<p class="slindent">Can ruminate, but cleaveth not the hoof;</p></div>\n\n<div class="stanza"><p>Wherefore the people that perceives its guide</p>\n<p class="slindent">Strike only at the good for which it hankers,</p>\n<p class="slindent">Feeds upon that, and farther seeketh not.</p></div>\n\n<div class="stanza"><p>Clearly canst thou perceive that evil guidance</p>\n<p class="slindent">The cause is that has made the world depraved,</p>\n<p class="slindent">And not that nature is corrupt in you.</p></div>\n\n<div class="stanza"><p>Rome, that reformed the world, accustomed was</p>\n<p class="slindent">Two suns to have, which one road and the other,</p>\n<p class="slindent">Of God and of the world, made manifest.</p></div>\n\n<div class="stanza"><p>One has the other quenched, and to the crosier</p>\n<p class="slindent">The sword is joined, and ill beseemeth it</p>\n<p class="slindent">That by main force one with the other go,</p></div>\n\n<div class="stanza"><p>Because, being joined, one feareth not the other;</p>\n<p class="slindent">If thou believe not, think upon the grain,</p>\n<p class="slindent">For by its seed each herb is recognized.</p></div>\n\n<div class="stanza"><p>In the land laved by Po and Adige,</p>\n<p class="slindent">Valour and courtesy used to be found,</p>\n<p class="slindent">Before that Frederick had his controversy;</p></div>\n\n<div class="stanza"><p>Now in security can pass that way</p>\n<p class="slindent">Whoever will abstain, through sense of shame,</p>\n<p class="slindent">From speaking with the good, or drawing near them.</p></div>\n\n<div class="stanza"><p>True, three old men are left, in whom upbraids</p>\n<p class="slindent">The ancient age the new, and late they deem it</p>\n<p class="slindent">That God restore them to the better life:</p></div>\n\n<div class="stanza"><p>Currado da Palazzo, and good Gherardo,</p>\n<p class="slindent">And Guido da Castel, who better named is,</p>\n<p class="slindent">In fashion of the French, the simple Lombard:</p></div>\n\n<div class="stanza"><p>Say thou henceforward that the Church of Rome,</p>\n<p class="slindent">Confounding in itself two governments,</p>\n<p class="slindent">Falls in the mire, and soils itself and burden.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O Marco mine,&rdquo; I said, &ldquo;thou reasonest well;</p>\n<p class="slindent">And now discern I why the sons of Levi</p>\n<p class="slindent">Have been excluded from the heritage.</p></div>\n\n<div class="stanza"><p>But what Gherardo is it, who, as sample</p>\n<p class="slindent">Of a lost race, thou sayest has remained</p>\n<p class="slindent">In reprobation of the barbarous age?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Either thy speech deceives me, or it tempts me,&rdquo;</p>\n<p class="slindent">He answered me; &ldquo;for speaking Tuscan to me,</p>\n<p class="slindent">It seems of good Gherardo naught thou knowest.</p></div>\n\n<div class="stanza"><p>By other surname do I know him not,</p>\n<p class="slindent">Unless I take it from his daughter Gaia.</p>\n<p class="slindent">May God be with you, for I come no farther.</p></div>\n\n<div class="stanza"><p>Behold the dawn, that through the smoke rays out,</p>\n<p class="slindent">Already whitening; and I must depart\u2014</p>\n<p class="slindent">Yonder the Angel is\u2014ere he appear.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus did he speak, and would no farther hear me.</p></div>','<p class="cantohead">Purgatorio: Canto XVII</p>\n<div class="stanza"><p>Remember, Reader, if e&rsquo;et in the Alps</p>\n<p class="slindent">A mist o&rsquo;ettook thee, through which thou couldst see</p>\n<p class="slindent">Not otherwise than through its membrane mole,</p></div>\n\n<div class="stanza"><p>How, when the vapours humid and condensed</p>\n<p class="slindent">Begin to dissipate themselves, the sphere</p>\n<p class="slindent">Of the sun feebly enters in among them,</p></div>\n\n<div class="stanza"><p>And thy imagination will be swift</p>\n<p class="slindent">In coming to perceive how I re-saw</p>\n<p class="slindent">The sun at first, that was already setting.</p></div>\n\n<div class="stanza"><p>Thus, to the faithful footsteps of my Master</p>\n<p class="slindent">Mating mine own, I issued from that cloud</p>\n<p class="slindent">To rays already dead on the low shores.</p></div>\n\n<div class="stanza"><p>O thou, Imagination, that dost steal us</p>\n<p class="slindent">So from without sometimes, that man perceives not,</p>\n<p class="slindent">Although around may sound a thousand trumpets,</p></div>\n\n<div class="stanza"><p>Who moveth thee, if sense impel thee not?</p>\n<p class="slindent">Moves thee a light, which in the heaven takes form,</p>\n<p class="slindent">By self, or by a will that downward guides it.</p></div>\n\n<div class="stanza"><p>Of her impiety, who changed her form</p>\n<p class="slindent">Into the bird that most delights in singing,</p>\n<p class="slindent">In my imagining appeared the trace;</p></div>\n\n<div class="stanza"><p>And hereupon my mind was so withdrawn</p>\n<p class="slindent">Within itself, that from without there came</p>\n<p class="slindent">Nothing that then might be received by it.</p></div>\n\n<div class="stanza"><p>Then reigned within my lofty fantasy</p>\n<p class="slindent">One crucified, disdainful and ferocious</p>\n<p class="slindent">In countenance, and even thus was dying.</p></div>\n\n<div class="stanza"><p>Around him were the great Ahasuerus,</p>\n<p class="slindent">Esther his wife, and the just Mordecai,</p>\n<p class="slindent">Who was in word and action so entire.</p></div>\n\n<div class="stanza"><p>And even as this image burst asunder</p>\n<p class="slindent">Of its own self, in fashion of a bubble</p>\n<p class="slindent">In which the water it was made of fails,</p></div>\n\n<div class="stanza"><p>There rose up in my vision a young maiden</p>\n<p class="slindent">Bitterly weeping, and she said: &ldquo;O queen,</p>\n<p class="slindent">Why hast thou wished in anger to be naught?</p></div>\n\n<div class="stanza"><p>Thou&rsquo;st slain thyself, Lavinia not to lose;</p>\n<p class="slindent">Now hast thou lost me; I am she who mourns,</p>\n<p class="slindent">Mother, at thine ere at another&rsquo;s ruin.&rdquo;</p></div>\n\n<div class="stanza"><p>As sleep is broken, when upon a sudden</p>\n<p class="slindent">New light strikes in upon the eyelids closed,</p>\n<p class="slindent">And broken quivers ere it dieth wholly,</p></div>\n\n<div class="stanza"><p>So this imagining of mine fell down</p>\n<p class="slindent">As soon as the effulgence smote my face,</p>\n<p class="slindent">Greater by far than what is in our wont.</p></div>\n\n<div class="stanza"><p>I turned me round to see where I might be,</p>\n<p class="slindent">When said a voice, &ldquo;Here is the passage up;&rdquo;</p>\n<p class="slindent">Which from all other purposes removed me,</p></div>\n\n<div class="stanza"><p>And made my wish so full of eagerness</p>\n<p class="slindent">To look and see who was it that was speaking,</p>\n<p class="slindent">It never rests till meeting face to face;</p></div>\n\n<div class="stanza"><p>But as before the sun, which quells the sight,</p>\n<p class="slindent">And in its own excess its figure veils,</p>\n<p class="slindent">Even so my power was insufficient here.</p></div>\n\n<div class="stanza"><p>&ldquo;This is a spirit divine, who in the way</p>\n<p class="slindent">Of going up directs us without asking,</p>\n<p class="slindent">And who with his own light himself conceals.</p></div>\n\n<div class="stanza"><p>He does with us as man doth with himself;</p>\n<p class="slindent">For he who sees the need, and waits the asking,</p>\n<p class="slindent">Malignly leans already tow&rsquo;rds denial.</p></div>\n\n<div class="stanza"><p>Accord we now our feet to such inviting,</p>\n<p class="slindent">Let us make haste to mount ere it grow dark;</p>\n<p class="slindent">For then we could not till the day return.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus my Conductor said; and I and he</p>\n<p class="slindent">Together turned our footsteps to a stairway;</p>\n<p class="slindent">And I, as soon as the first step I reached,</p></div>\n\n<div class="stanza"><p>Near me perceived a motion as of wings,</p>\n<p class="slindent">And fanning in the face, and saying, &ldquo;&nbsp;&lsquo;Beati</p>\n<p class="slindent">Pacifici,&rsquo; who are without ill anger.&rdquo;</p></div>\n\n<div class="stanza"><p>Already over us were so uplifted</p>\n<p class="slindent">The latest sunbeams, which the night pursues,</p>\n<p class="slindent">That upon many sides the stars appeared.</p></div>\n\n<div class="stanza"><p>&ldquo;O manhood mine, why dost thou vanish so?&rdquo;</p>\n<p class="slindent">I said within myself; for I perceived</p>\n<p class="slindent">The vigour of my legs was put in truce.</p></div>\n\n<div class="stanza"><p>We at the point were where no more ascends</p>\n<p class="slindent">The stairway upward, and were motionless,</p>\n<p class="slindent">Even as a ship, which at the shore arrives;</p></div>\n\n<div class="stanza"><p>And I gave heed a little, if I might hear</p>\n<p class="slindent">Aught whatsoever in the circle new;</p>\n<p class="slindent">Then to my Master turned me round and said:</p></div>\n\n<div class="stanza"><p>&ldquo;Say, my sweet Father, what delinquency</p>\n<p class="slindent">Is purged here in the circle where we are?</p>\n<p class="slindent">Although our feet may pause, pause not thy speech.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;The love of good, remiss</p>\n<p class="slindent">In what it should have done, is here restored;</p>\n<p class="slindent">Here plied again the ill-belated oar;</p></div>\n\n<div class="stanza"><p>But still more openly to understand,</p>\n<p class="slindent">Turn unto me thy mind, and thou shalt gather</p>\n<p class="slindent">Some profitable fruit from our delay.</p></div>\n\n<div class="stanza"><p>Neither Creator nor a creature ever,</p>\n<p class="slindent">Son,&rdquo; he began, &ldquo;was destitute of love</p>\n<p class="slindent">Natural or spiritual; and thou knowest it.</p></div>\n\n<div class="stanza"><p>The natural was ever without error;</p>\n<p class="slindent">But err the other may by evil object,</p>\n<p class="slindent">Or by too much, or by too little vigour.</p></div>\n\n<div class="stanza"><p>While in the first it well directed is,</p>\n<p class="slindent">And in the second moderates itself,</p>\n<p class="slindent">It cannot be the cause of sinful pleasure;</p></div>\n\n<div class="stanza"><p>But when to ill it turns, and, with more care</p>\n<p class="slindent">Or lesser than it ought, runs after good,</p>\n<p class="slindent">&rsquo;Gainst the Creator works his own creation.</p></div>\n\n<div class="stanza"><p>Hence thou mayst comprehend that love must be</p>\n<p class="slindent">The seed within yourselves of every virtue,</p>\n<p class="slindent">And every act that merits punishment.</p></div>\n\n<div class="stanza"><p>Now inasmuch as never from the welfare</p>\n<p class="slindent">Of its own subject can love turn its sight,</p>\n<p class="slindent">From their own hatred all things are secure;</p></div>\n\n<div class="stanza"><p>And since we cannot think of any being</p>\n<p class="slindent">Standing alone, nor from the First divided,</p>\n<p class="slindent">Of hating Him is all desire cut off.</p></div>\n\n<div class="stanza"><p>Hence if, discriminating, I judge well,</p>\n<p class="slindent">The evil that one loves is of one&rsquo;s neighbour,</p>\n<p class="slindent">And this is born in three modes in your clay.</p></div>\n\n<div class="stanza"><p>There are, who, by abasement of their neighbour,</p>\n<p class="slindent">Hope to excel, and therefore only long</p>\n<p class="slindent">That from his greatness he may be cast down;</p></div>\n\n<div class="stanza"><p>There are, who power, grace, honour, and renown</p>\n<p class="slindent">Fear they may lose because another rises,</p>\n<p class="slindent">Thence are so sad that the reverse they love;</p></div>\n\n<div class="stanza"><p>And there are those whom injury seems to chafe,</p>\n<p class="slindent">So that it makes them greedy for revenge,</p>\n<p class="slindent">And such must needs shape out another&rsquo;s harm.</p></div>\n\n<div class="stanza"><p>This threefold love is wept for down below;</p>\n<p class="slindent">Now of the other will I have thee hear,</p>\n<p class="slindent">That runneth after good with measure faulty.</p></div>\n\n<div class="stanza"><p>Each one confusedly a good conceives</p>\n<p class="slindent">Wherein the mind may rest, and longeth for it;</p>\n<p class="slindent">Therefore to overtake it each one strives.</p></div>\n\n<div class="stanza"><p>If languid love to look on this attract you,</p>\n<p class="slindent">Or in attaining unto it, this cornice,</p>\n<p class="slindent">After just penitence, torments you for it.</p></div>\n\n<div class="stanza"><p>There&rsquo;s other good that does not make man happy;</p>\n<p class="slindent">&rsquo;Tis not felicity, &rsquo;tis not the good</p>\n<p class="slindent">Essence, of every good the fruit and root.</p></div>\n\n<div class="stanza"><p>The love that yields itself too much to this</p>\n<p class="slindent">Above us is lamented in three circles;</p>\n<p class="slindent">But how tripartite it may be described,</p></div>\n\n<div class="stanza"><p>I say not, that thou seek it for thyself.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XVIII</p>\n<div class="stanza"><p>An end had put unto his reasoning</p>\n<p class="slindent">The lofty Teacher, and attent was looking</p>\n<p class="slindent">Into my face, if I appeared content;</p></div>\n\n<div class="stanza"><p>And I, whom a new thirst still goaded on,</p>\n<p class="slindent">Without was mute, and said within: &ldquo;Perchance</p>\n<p class="slindent">The too much questioning I make annoys him.&rdquo;</p></div>\n\n<div class="stanza"><p>But that true Father, who had comprehended</p>\n<p class="slindent">The timid wish, that opened not itself,</p>\n<p class="slindent">By speaking gave me hardihood to speak.</p></div>\n\n<div class="stanza"><p>Whence I: &ldquo;My sight is, Master, vivified</p>\n<p class="slindent">So in thy light, that clearly I discern</p>\n<p class="slindent">Whate&rsquo;et thy speech importeth or describes.</p></div>\n\n<div class="stanza"><p>Therefore I thee entreat, sweet Father dear,</p>\n<p class="slindent">To teach me love, to which thou dost refer</p>\n<p class="slindent">Every good action and its contrary.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Direct,&rdquo; he said, &ldquo;towards me the keen eyes</p>\n<p class="slindent">Of intellect, and clear will be to thee</p>\n<p class="slindent">The error of the blind, who would be leaders.</p></div>\n\n<div class="stanza"><p>The soul, which is created apt to love,</p>\n<p class="slindent">Is mobile unto everything that pleases,</p>\n<p class="slindent">Soon as by pleasure she is waked to action.</p></div>\n\n<div class="stanza"><p>Your apprehension from some real thing</p>\n<p class="slindent">An image draws, and in yourselves displays it</p>\n<p class="slindent">So that it makes the soul turn unto it.</p></div>\n\n<div class="stanza"><p>And if, when turned, towards it she incline,</p>\n<p class="slindent">Love is that inclination; it is nature,</p>\n<p class="slindent">Which is by pleasure bound in you anew</p></div>\n\n<div class="stanza"><p>Then even as the fire doth upward move</p>\n<p class="slindent">By its own form, which to ascend is born,</p>\n<p class="slindent">Where longest in its matter it endures,</p></div>\n\n<div class="stanza"><p>So comes the captive soul into desire,</p>\n<p class="slindent">Which is a motion spiritual, and ne&rsquo;et rests</p>\n<p class="slindent">Until she doth enjoy the thing beloved.</p></div>\n\n<div class="stanza"><p>Now may apparent be to thee how hidden</p>\n<p class="slindent">The truth is from those people, who aver</p>\n<p class="slindent">All love is in itself a laudable thing;</p></div>\n\n<div class="stanza"><p>Because its matter may perchance appear</p>\n<p class="slindent">Aye to be good; but yet not each impression</p>\n<p class="slindent">Is good, albeit good may be the wax.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Thy words, and my sequacious intellect,&rdquo;</p>\n<p class="slindent">I answered him, &ldquo;have love revealed to me;</p>\n<p class="slindent">But that has made me more impregned with doubt;</p></div>\n\n<div class="stanza"><p>For if love from without be offered us,</p>\n<p class="slindent">And with another foot the soul go not,</p>\n<p class="slindent">If right or wrong she go, &rsquo;tis not her merit.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;What reason seeth here,</p>\n<p class="slindent">Myself can tell thee; beyond that await</p>\n<p class="slindent">For Beatrice, since &rsquo;tis a work of faith.</p></div>\n\n<div class="stanza"><p>Every substantial form, that segregate</p>\n<p class="slindent">From matter is, and with it is united,</p>\n<p class="slindent">Specific power has in itself collected,</p></div>\n\n<div class="stanza"><p>Which without act is not perceptible,</p>\n<p class="slindent">Nor shows itself except by its effect,</p>\n<p class="slindent">As life does in a plant by the green leaves.</p></div>\n\n<div class="stanza"><p>But still, whence cometh the intelligence</p>\n<p class="slindent">Of the first notions, man is ignorant,</p>\n<p class="slindent">And the affection for the first allurements,</p></div>\n\n<div class="stanza"><p>Which are in you as instinct in the bee</p>\n<p class="slindent">To make its honey; and this first desire</p>\n<p class="slindent">Merit of praise or blame containeth not.</p></div>\n\n<div class="stanza"><p>Now, that to this all others may be gathered,</p>\n<p class="slindent">Innate within you is the power that counsels,</p>\n<p class="slindent">And it should keep the threshold of assent.</p></div>\n\n<div class="stanza"><p>This is the principle, from which is taken</p>\n<p class="slindent">Occasion of desert in you, according</p>\n<p class="slindent">As good and guilty loves it takes and winnows.</p></div>\n\n<div class="stanza"><p>Those who, in reasoning, to the bottom went,</p>\n<p class="slindent">Were of this innate liberty aware,</p>\n<p class="slindent">Therefore bequeathed they Ethics to the world.</p></div>\n\n<div class="stanza"><p>Supposing, then, that from necessity</p>\n<p class="slindent">Springs every love that is within you kindled,</p>\n<p class="slindent">Within yourselves the power is to restrain it.</p></div>\n\n<div class="stanza"><p>The noble virtue Beatrice understands</p>\n<p class="slindent">By the free will; and therefore see that thou</p>\n<p class="slindent">Bear it in mind, if she should speak of it.&rdquo;</p></div>\n\n<div class="stanza"><p>The moon, belated almost unto midnight,</p>\n<p class="slindent">Now made the stars appear to us more rare,</p>\n<p class="slindent">Formed like a bucket, that is all ablaze,</p></div>\n\n<div class="stanza"><p>And counter to the heavens ran through those paths</p>\n<p class="slindent">Which the sun sets aflame, when he of Rome</p>\n<p class="slindent">Sees it &rsquo;twixt Sardes and Corsicans go down;</p></div>\n\n<div class="stanza"><p>And that patrician shade, for whom is named</p>\n<p class="slindent">Pietola more than any Mantuan town,</p>\n<p class="slindent">Had laid aside the burden of my lading;</p></div>\n\n<div class="stanza"><p>Whence I, who reason manifest and plain</p>\n<p class="slindent">In answer to my questions had received,</p>\n<p class="slindent">Stood like a man in drowsy reverie.</p></div>\n\n<div class="stanza"><p>But taken from me was this drowsiness</p>\n<p class="slindent">Suddenly by a people, that behind</p>\n<p class="slindent">Our backs already had come round to us.</p></div>\n\n<div class="stanza"><p>And as, of old, Ismenus and Asopus</p>\n<p class="slindent">Beside them saw at night the rush and throng,</p>\n<p class="slindent">If but the Thebans were in need of Bacchus,</p></div>\n\n<div class="stanza"><p>So they along that circle curve their step,</p>\n<p class="slindent">From what I saw of those approaching us,</p>\n<p class="slindent">Who by good-will and righteous love are ridden.</p></div>\n\n<div class="stanza"><p>Full soon they were upon us, because running</p>\n<p class="slindent">Moved onward all that mighty multitude,</p>\n<p class="slindent">And two in the advance cried out, lamenting,</p></div>\n\n<div class="stanza"><p>&ldquo;Mary in haste unto the mountain ran,</p>\n<p class="slindent">And Caesar, that he might subdue Ilerda,</p>\n<p class="slindent">Thrust at Marseilles, and then ran into Spain.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Quick! quick! so that the time may not be lost</p>\n<p class="slindent">By little love!&rdquo; forthwith the others cried,</p>\n<p class="slindent">&ldquo;For ardour in well-doing freshens grace!&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O folk, in whom an eager fervour now</p>\n<p class="slindent">Supplies perhaps delay and negligence,</p>\n<p class="slindent">Put by you in well-doing, through lukewarmness,</p></div>\n\n<div class="stanza"><p>This one who lives, and truly I lie not,</p>\n<p class="slindent">Would fain go up, if but the sun relight us;</p>\n<p class="slindent">So tell us where the passage nearest is.&rdquo;</p></div>\n\n<div class="stanza"><p>These were the words of him who was my Guide;</p>\n<p class="slindent">And some one of those spirits said: &ldquo;Come on</p>\n<p class="slindent">Behind us, and the opening shalt thou find;</p></div>\n\n<div class="stanza"><p>So full of longing are we to move onward,</p>\n<p class="slindent">That stay we cannot; therefore pardon us,</p>\n<p class="slindent">If thou for churlishness our justice take.</p></div>\n\n<div class="stanza"><p>I was San Zeno&rsquo;s Abbot at Verona,</p>\n<p class="slindent">Under the empire of good Barbarossa,</p>\n<p class="slindent">Of whom still sorrowing Milan holds discourse;</p></div>\n\n<div class="stanza"><p>And he has one foot in the grave already,</p>\n<p class="slindent">Who shall erelong lament that monastery,</p>\n<p class="slindent">And sorry be of having there had power,</p></div>\n\n<div class="stanza"><p>Because his son, in his whole body sick,</p>\n<p class="slindent">And worse in mind, and who was evil-born,</p>\n<p class="slindent">He put into the place of its true pastor.&rdquo;</p></div>\n\n<div class="stanza"><p>If more he said, or silent was, I know not,</p>\n<p class="slindent">He had already passed so far beyond us;</p>\n<p class="slindent">But this I heard, and to retain it pleased me.</p></div>\n\n<div class="stanza"><p>And he who was in every need my succour</p>\n<p class="slindent">Said: &ldquo;Turn thee hitherward; see two of them</p>\n<p class="slindent">Come fastening upon slothfulness their teeth.&rdquo;</p></div>\n\n<div class="stanza"><p>In rear of all they shouted: &ldquo;Sooner were</p>\n<p class="slindent">The people dead to whom the sea was opened,</p>\n<p class="slindent">Than their inheritors the Jordan saw;</p></div>\n\n<div class="stanza"><p>And those who the fatigue did not endure</p>\n<p class="slindent">Unto the issue, with Anchises&rsquo; son,</p>\n<p class="slindent">Themselves to life withouten glory offered.&rdquo;</p></div>\n\n<div class="stanza"><p>Then when from us so separated were</p>\n<p class="slindent">Those shades, that they no longer could be seen,</p>\n<p class="slindent">Within me a new thought did entrance find,</p></div>\n\n<div class="stanza"><p>Whence others many and diverse were born;</p>\n<p class="slindent">And so I lapsed from one into another,</p>\n<p class="slindent">That in a reverie mine eyes I closed,</p></div>\n\n<div class="stanza"><p>And meditation into dream transmuted.</p></div>','<p class="cantohead">Purgatorio: Canto XIX</p>\n<div class="stanza"><p>It was the hour when the diurnal heat</p>\n<p class="slindent">No more can warm the coldness of the moon,</p>\n<p class="slindent">Vanquished by earth, or peradventure Saturn,</p></div>\n\n<div class="stanza"><p>When geomancers their Fortuna Major</p>\n<p class="slindent">See in the orient before the dawn</p>\n<p class="slindent">Rise by a path that long remains not dim,</p></div>\n\n<div class="stanza"><p>There came to me in dreams a stammering woman,</p>\n<p class="slindent">Squint in her eyes, and in her feet distorted,</p>\n<p class="slindent">With hands dissevered and of sallow hue.</p></div>\n\n<div class="stanza"><p>I looked at her; and as the sun restores</p>\n<p class="slindent">The frigid members which the night benumbs,</p>\n<p class="slindent">Even thus my gaze did render voluble</p></div>\n\n<div class="stanza"><p>Her tongue, and made her all erect thereafter</p>\n<p class="slindent">In little while, and the lost countenance</p>\n<p class="slindent">As love desires it so in her did colour.</p></div>\n\n<div class="stanza"><p>When in this wise she had her speech unloosed,</p>\n<p class="slindent">She &rsquo;gan to sing so, that with difficulty</p>\n<p class="slindent">Could I have turned my thoughts away from her.</p></div>\n\n<div class="stanza"><p>&ldquo;I am,&rdquo; she sang, &ldquo;I am the Siren sweet</p>\n<p class="slindent">Who mariners amid the main unman,</p>\n<p class="slindent">So full am I of pleasantness to hear.</p></div>\n\n<div class="stanza"><p>I drew Ulysses from his wandering way</p>\n<p class="slindent">Unto my song, and he who dwells with me</p>\n<p class="slindent">Seldom departs so wholly I content him.&rdquo;</p></div>\n\n<div class="stanza"><p>Her mouth was not yet closed again, before</p>\n<p class="slindent">Appeared a Lady saintly and alert</p>\n<p class="slindent">Close at my side to put her to confusion.</p></div>\n\n<div class="stanza"><p>&ldquo;Virgilius, O Virgilius! who is this?&rdquo;</p>\n<p class="slindent">Sternly she said; and he was drawing near</p>\n<p class="slindent">With eyes still fixed upon that modest one.</p></div>\n\n<div class="stanza"><p>She seized the other and in front laid open,</p>\n<p class="slindent">Rending her garments, and her belly showed me;</p>\n<p class="slindent">This waked me with the stench that issued from it.</p></div>\n\n<div class="stanza"><p>I turned mine eyes, and good Virgilius said:</p>\n<p class="slindent">&ldquo;At least thrice have I called thee; rise and come;</p>\n<p class="slindent">Find we the opening by which thou mayst enter.&rdquo;</p></div>\n\n<div class="stanza"><p>I rose; and full already of high day</p>\n<p class="slindent">Were all the circles of the Sacred Mountain,</p>\n<p class="slindent">And with the new sun at our back we went.</p></div>\n\n<div class="stanza"><p>Following behind him, I my forehead bore</p>\n<p class="slindent">Like unto one who has it laden with thought,</p>\n<p class="slindent">Who makes himself the half arch of a bridge,</p></div>\n\n<div class="stanza"><p>When I heard say, &ldquo;Come, here the passage is,&rdquo;</p>\n<p class="slindent">Spoken in a manner gentle and benign,</p>\n<p class="slindent">Such as we hear not in this mortal region.</p></div>\n\n<div class="stanza"><p>With open wings, which of a swan appeared,</p>\n<p class="slindent">Upward he turned us who thus spake to us,</p>\n<p class="slindent">Between the two walls of the solid granite.</p></div>\n\n<div class="stanza"><p>He moved his pinions afterwards and fanned us,</p>\n<p class="slindent">Affirming those &lsquo;qui lugent&rsquo; to be blessed,</p>\n<p class="slindent">For they shall have their souls with comfort filled.</p></div>\n\n<div class="stanza"><p>&ldquo;What aileth thee, that aye to earth thou gazest?&rdquo;</p>\n<p class="slindent">To me my Guide began to say, we both</p>\n<p class="slindent">Somewhat beyond the Angel having mounted.</p></div>\n\n<div class="stanza"><p>And I: &ldquo;With such misgiving makes me go</p>\n<p class="slindent">A vision new, which bends me to itself,</p>\n<p class="slindent">So that I cannot from the thought withdraw me.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Didst thou behold,&rdquo; he said, &ldquo;that old enchantress,</p>\n<p class="slindent">Who sole above us henceforth is lamented?</p>\n<p class="slindent">Didst thou behold how man is freed from her?</p></div>\n\n<div class="stanza"><p>Suffice it thee, and smite earth with thy heels,</p>\n<p class="slindent">Thine eyes lift upward to the lure, that whirls</p>\n<p class="slindent">The Eternal King with revolutions vast.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as the hawk, that first his feet surveys,</p>\n<p class="slindent">Then turns him to the call and stretches forward,</p>\n<p class="slindent">Through the desire of food that draws him thither,</p></div>\n\n<div class="stanza"><p>Such I became, and such, as far as cleaves</p>\n<p class="slindent">The rock to give a way to him who mounts,</p>\n<p class="slindent">Went on to where the circling doth begin.</p></div>\n\n<div class="stanza"><p>On the fifth circle when I had come forth,</p>\n<p class="slindent">People I saw upon it who were weeping,</p>\n<p class="slindent">Stretched prone upon the ground, all downward turned.</p></div>\n\n<div class="stanza"><p>&ldquo;Adhaesit pavimento anima mea,&rdquo;</p>\n<p class="slindent">I heard them say with sighings so profound,</p>\n<p class="slindent">That hardly could the words be understood.</p></div>\n\n<div class="stanza"><p>&ldquo;O ye elect of God, whose sufferings</p>\n<p class="slindent">Justice and Hope both render less severe,</p>\n<p class="slindent">Direct ye us towards the high ascents.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;If ye are come secure from this prostration,</p>\n<p class="slindent">And wish to find the way most speedily,</p>\n<p class="slindent">Let your right hands be evermore outside.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus did the Poet ask, and thus was answered</p>\n<p class="slindent">By them somewhat in front of us; whence I</p>\n<p class="slindent">In what was spoken divined the rest concealed,</p></div>\n\n<div class="stanza"><p>And unto my Lord&rsquo;s eyes mine eyes I turned;</p>\n<p class="slindent">Whence he assented with a cheerful sign</p>\n<p class="slindent">To what the sight of my desire implored.</p></div>\n\n<div class="stanza"><p>When of myself I could dispose at will,</p>\n<p class="slindent">Above that creature did I draw myself,</p>\n<p class="slindent">Whose words before had caused me to take note,</p></div>\n\n<div class="stanza"><p>Saying: &ldquo;O Spirit, in whom weeping ripens</p>\n<p class="slindent">That without which to God we cannot turn,</p>\n<p class="slindent">Suspend awhile for me thy greater care.</p></div>\n\n<div class="stanza"><p>Who wast thou, and why are your backs turned upwards,</p>\n<p class="slindent">Tell me, and if thou wouldst that I procure thee</p>\n<p class="slindent">Anything there whence living I departed.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;Wherefore our backs the heaven</p>\n<p class="slindent">Turns to itself, know shalt thou; but beforehand</p>\n<p class="slindent">&lsquo;Scias quod ego fui successor Petri.&rsquo;</p></div>\n\n<div class="stanza"><p>Between Siestri and Chiaveri descends</p>\n<p class="slindent">A river beautiful, and of its name</p>\n<p class="slindent">The title of my blood its summit makes.</p></div>\n\n<div class="stanza"><p>A month and little more essayed I how</p>\n<p class="slindent">Weighs the great cloak on him from mire who keeps it,</p>\n<p class="slindent">For all the other burdens seem a feather.</p></div>\n\n<div class="stanza"><p>Tardy, ah woe is me! was my conversion;</p>\n<p class="slindent">But when the Roman Shepherd I was made,</p>\n<p class="slindent">Then I discovered life to be a lie.</p></div>\n\n<div class="stanza"><p>I saw that there the heart was not at rest,</p>\n<p class="slindent">Nor farther in that life could one ascend;</p>\n<p class="slindent">Whereby the love of this was kindled in me.</p></div>\n\n<div class="stanza"><p>Until that time a wretched soul and parted</p>\n<p class="slindent">From God was I, and wholly avaricious;</p>\n<p class="slindent">Now, as thou seest, I here am punished for it.</p></div>\n\n<div class="stanza"><p>What avarice does is here made manifest</p>\n<p class="slindent">In the purgation of these souls converted,</p>\n<p class="slindent">And no more bitter pain the Mountain has.</p></div>\n\n<div class="stanza"><p>Even as our eye did not uplift itself</p>\n<p class="slindent">Aloft, being fastened upon earthly things,</p>\n<p class="slindent">So justice here has merged it in the earth.</p></div>\n\n<div class="stanza"><p>As avarice had extinguished our affection</p>\n<p class="slindent">For every good, whereby was action lost,</p>\n<p class="slindent">So justice here doth hold us in restraint,</p></div>\n\n<div class="stanza"><p>Bound and imprisoned by the feet and hands;</p>\n<p class="slindent">And so long as it pleases the just Lord</p>\n<p class="slindent">Shall we remain immovable and prostrate.&rdquo;</p></div>\n\n<div class="stanza"><p>I on my knees had fallen, and wished to speak;</p>\n<p class="slindent">But even as I began, and he was &rsquo;ware,</p>\n<p class="slindent">Only by listening, of my reverence,</p></div>\n\n<div class="stanza"><p>&ldquo;What cause,&rdquo; he said, &ldquo;has downward bent thee thus?&rdquo;</p>\n<p class="slindent">And I to him: &ldquo;For your own dignity,</p>\n<p class="slindent">Standing, my conscience stung me with remorse.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Straighten thy legs, and upward raise thee, brother,&rdquo;</p>\n<p class="slindent">He answered: &ldquo;Err not, fellow-servant am I</p>\n<p class="slindent">With thee and with the others to one power.</p></div>\n\n<div class="stanza"><p>If e&rsquo;et that holy, evangelic sound,</p>\n<p class="slindent">Which sayeth &lsquo;neque nubent,&rsquo; thou hast heard,</p>\n<p class="slindent">Well canst thou see why in this wise I speak.</p></div>\n\n<div class="stanza"><p>Now go; no longer will I have thee linger,</p>\n<p class="slindent">Because thy stay doth incommode my weeping,</p>\n<p class="slindent">With which I ripen that which thou hast said.</p></div>\n\n<div class="stanza"><p>On earth I have a grandchild named Alagia,</p>\n<p class="slindent">Good in herself, unless indeed our house</p>\n<p class="slindent">Malevolent may make her by example,</p></div>\n\n<div class="stanza"><p>And she alone remains to me on earth.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XX</p>\n<div class="stanza"><p>Ill strives the will against a better will;</p>\n<p class="slindent">Therefore, to pleasure him, against my pleasure</p>\n<p class="slindent">I drew the sponge not saturate from the water.</p></div>\n\n<div class="stanza"><p>Onward I moved, and onward moved my Leader,</p>\n<p class="slindent">Through vacant places, skirting still the rock,</p>\n<p class="slindent">As on a wall close to the battlements;</p></div>\n\n<div class="stanza"><p>For they that through their eyes pour drop by drop</p>\n<p class="slindent">The malady which all the world pervades,</p>\n<p class="slindent">On the other side too near the verge approach.</p></div>\n\n<div class="stanza"><p>Accursed mayst thou be, thou old she-wolf,</p>\n<p class="slindent">That more than all the other beasts hast prey,</p>\n<p class="slindent">Because of hunger infinitely hollow!</p></div>\n\n<div class="stanza"><p>O heaven, in whose gyrations some appear</p>\n<p class="slindent">To think conditions here below are changed,</p>\n<p class="slindent">When will he come through whom she shall depart?</p></div>\n\n<div class="stanza"><p>Onward we went with footsteps slow and scarce,</p>\n<p class="slindent">And I attentive to the shades I heard</p>\n<p class="slindent">Piteously weeping and bemoaning them;</p></div>\n\n<div class="stanza"><p>And I by peradventure heard &ldquo;Sweet Mary!&rdquo;</p>\n<p class="slindent">Uttered in front of us amid the weeping</p>\n<p class="slindent">Even as a woman does who is in child-birth;</p></div>\n\n<div class="stanza"><p>And in continuance: &ldquo;How poor thou wast</p>\n<p class="slindent">Is manifested by that hostelry</p>\n<p class="slindent">Where thou didst lay thy sacred burden down.&rdquo;</p></div>\n\n<div class="stanza"><p>Thereafterward I heard: &ldquo;O good Fabricius,</p>\n<p class="slindent">Virtue with poverty didst thou prefer</p>\n<p class="slindent">To the possession of great wealth with vice.&rdquo;</p></div>\n\n<div class="stanza"><p>So pleasurable were these words to me</p>\n<p class="slindent">That I drew farther onward to have knowledge</p>\n<p class="slindent">Touching that spirit whence they seemed to come.</p></div>\n\n<div class="stanza"><p>He furthermore was speaking of the largess</p>\n<p class="slindent">Which Nicholas unto the maidens gave,</p>\n<p class="slindent">In order to conduct their youth to honour.</p></div>\n\n<div class="stanza"><p>&ldquo;O soul that dost so excellently speak,</p>\n<p class="slindent">Tell me who wast thou,&rdquo; said I, &ldquo;and why only</p>\n<p class="slindent">Thou dost renew these praises well deserved?</p></div>\n\n<div class="stanza"><p>Not without recompense shall be thy word,</p>\n<p class="slindent">If I return to finish the short journey</p>\n<p class="slindent">Of that life which is flying to its end.&rdquo;</p></div>\n\n<div class="stanza"><p>And he: &ldquo;I&rsquo;ll tell thee, not for any comfort</p>\n<p class="slindent">I may expect from earth, but that so much</p>\n<p class="slindent">Grace shines in thee or ever thou art dead.</p></div>\n\n<div class="stanza"><p>I was the root of that malignant plant</p>\n<p class="slindent">Which overshadows all the Christian world,</p>\n<p class="slindent">So that good fruit is seldom gathered from it;</p></div>\n\n<div class="stanza"><p>But if Douay and Ghent, and Lille and Bruges</p>\n<p class="slindent">Had Power, soon vengeance would be taken on it;</p>\n<p class="slindent">And this I pray of Him who judges all.</p></div>\n\n<div class="stanza"><p>Hugh Capet was I called upon the earth;</p>\n<p class="slindent">From me were born the Louises and Philips,</p>\n<p class="slindent">By whom in later days has France been governed.</p></div>\n\n<div class="stanza"><p>I was the son of a Parisian butcher,</p>\n<p class="slindent">What time the ancient kings had perished all,</p>\n<p class="slindent">Excepting one, contrite in cloth of gray.</p></div>\n\n<div class="stanza"><p>I found me grasping in my hands the rein</p>\n<p class="slindent">Of the realm&rsquo;s government, and so great power</p>\n<p class="slindent">Of new acquest, and so with friends abounding,</p></div>\n\n<div class="stanza"><p>That to the widowed diadem promoted</p>\n<p class="slindent">The head of mine own offspring was, from whom</p>\n<p class="slindent">The consecrated bones of these began.</p></div>\n\n<div class="stanza"><p>So long as the great dowry of Provence</p>\n<p class="slindent">Out of my blood took not the sense of shame,</p>\n<p class="slindent">&rsquo;Twas little worth, but still it did no harm.</p></div>\n\n<div class="stanza"><p>Then it began with falsehood and with force</p>\n<p class="slindent">Its rapine; and thereafter, for amends,</p>\n<p class="slindent">Took Ponthieu, Normandy, and Gascony.</p></div>\n\n<div class="stanza"><p>Charles came to Italy, and for amends</p>\n<p class="slindent">A victim made of Conradin, and then</p>\n<p class="slindent">Thrust Thomas back to heaven, for amends.</p></div>\n\n<div class="stanza"><p>A time I see, not very distant now,</p>\n<p class="slindent">Which draweth forth another Charles from France,</p>\n<p class="slindent">The better to make known both him and his.</p></div>\n\n<div class="stanza"><p>Unarmed he goes, and only with the lance</p>\n<p class="slindent">That Judas jousted with; and that he thrusts</p>\n<p class="slindent">So that he makes the paunch of Florence burst.</p></div>\n\n<div class="stanza"><p>He thence not land, but sin and infamy,</p>\n<p class="slindent">Shall gain, so much more grievous to himself</p>\n<p class="slindent">As the more light such damage he accounts.</p></div>\n\n<div class="stanza"><p>The other, now gone forth, ta&rsquo;en in his ship,</p>\n<p class="slindent">See I his daughter sell, and chaffer for her</p>\n<p class="slindent">As corsairs do with other female slaves.</p></div>\n\n<div class="stanza"><p>What more, O Avarice, canst thou do to us,</p>\n<p class="slindent">Since thou my blood so to thyself hast drawn,</p>\n<p class="slindent">It careth not for its own proper flesh?</p></div>\n\n<div class="stanza"><p>That less may seem the future ill and past,</p>\n<p class="slindent">I see the flower-de-luce Alagna enter,</p>\n<p class="slindent">And Christ in his own Vicar captive made.</p></div>\n\n<div class="stanza"><p>I see him yet another time derided;</p>\n<p class="slindent">I see renewed the vinegar and gall,</p>\n<p class="slindent">And between living thieves I see him slain.</p></div>\n\n<div class="stanza"><p>I see the modern Pilate so relentless,</p>\n<p class="slindent">This does not sate him, but without decretal</p>\n<p class="slindent">He to the temple bears his sordid sails!</p></div>\n\n<div class="stanza"><p>When, O my Lord! shall I be joyful made</p>\n<p class="slindent">By looking on the vengeance which, concealed,</p>\n<p class="slindent">Makes sweet thine anger in thy secrecy?</p></div>\n\n<div class="stanza"><p>What I was saying of that only bride</p>\n<p class="slindent">Of the Holy Ghost, and which occasioned thee</p>\n<p class="slindent">To turn towards me for some commentary,</p></div>\n\n<div class="stanza"><p>So long has been ordained to all our prayers</p>\n<p class="slindent">As the day lasts; but when the night comes on,</p>\n<p class="slindent">Contrary sound we take instead thereof.</p></div>\n\n<div class="stanza"><p>At that time we repeat Pygmalion,</p>\n<p class="slindent">Of whom a traitor, thief, and parricide</p>\n<p class="slindent">Made his insatiable desire of gold;</p></div>\n\n<div class="stanza"><p>And the misery of avaricious Midas,</p>\n<p class="slindent">That followed his inordinate demand,</p>\n<p class="slindent">At which forevermore one needs but laugh.</p></div>\n\n<div class="stanza"><p>The foolish Achan each one then records,</p>\n<p class="slindent">And how he stole the spoils; so that the wrath</p>\n<p class="slindent">Of Joshua still appears to sting him here.</p></div>\n\n<div class="stanza"><p>Then we accuse Sapphira with her husband,</p>\n<p class="slindent">We laud the hoof-beats Heliodorus had,</p>\n<p class="slindent">And the whole mount in infamy encircles</p></div>\n\n<div class="stanza"><p>Polymnestor who murdered Polydorus.</p>\n<p class="slindent">Here finally is cried: &lsquo;O Crassus, tell us,</p>\n<p class="slindent">For thou dost know, what is the taste of gold?&rsquo;</p></div>\n\n<div class="stanza"><p>Sometimes we speak, one loud, another low,</p>\n<p class="slindent">According to desire of speech, that spurs us</p>\n<p class="slindent">To greater now and now to lesser pace.</p></div>\n\n<div class="stanza"><p>But in the good that here by day is talked of,</p>\n<p class="slindent">Erewhile alone I was not; yet near by</p>\n<p class="slindent">No other person lifted up his voice.&rdquo;</p></div>\n\n<div class="stanza"><p>From him already we departed were,</p>\n<p class="slindent">And made endeavour to o&rsquo;etcome the road</p>\n<p class="slindent">As much as was permitted to our power,</p></div>\n\n<div class="stanza"><p>When I perceived, like something that is falling,</p>\n<p class="slindent">The mountain tremble, whence a chill seized on me,</p>\n<p class="slindent">As seizes him who to his death is going.</p></div>\n\n<div class="stanza"><p>Certes so violently shook not Delos,</p>\n<p class="slindent">Before Latona made her nest therein</p>\n<p class="slindent">To give birth to the two eyes of the heaven.</p></div>\n\n<div class="stanza"><p>Then upon all sides there began a cry,</p>\n<p class="slindent">Such that the Master drew himself towards me,</p>\n<p class="slindent">Saying, &ldquo;Fear not, while I am guiding thee.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Gloria in excelsis Deo,&rdquo; all</p>\n<p class="slindent">Were saying, from what near I comprehended,</p>\n<p class="slindent">Where it was possible to hear the cry.</p></div>\n\n<div class="stanza"><p>We paused immovable and in suspense,</p>\n<p class="slindent">Even as the shepherds who first heard that song,</p>\n<p class="slindent">Until the trembling ceased, and it was finished.</p></div>\n\n<div class="stanza"><p>Then we resumed again our holy path,</p>\n<p class="slindent">Watching the shades that lay upon the ground,</p>\n<p class="slindent">Already turned to their accustomed plaint.</p></div>\n\n<div class="stanza"><p>No ignorance ever with so great a strife</p>\n<p class="slindent">Had rendered me importunate to know,</p>\n<p class="slindent">If erreth not in this my memory,</p></div>\n\n<div class="stanza"><p>As meditating then I seemed to have;</p>\n<p class="slindent">Nor out of haste to question did I dare,</p>\n<p class="slindent">Nor of myself I there could aught perceive;</p></div>\n\n<div class="stanza"><p>So I went onward timorous and thoughtful.</p></div>','<p class="cantohead">Purgatorio: Canto XXI</p>\n<div class="stanza"><p>The natural thirst, that ne&rsquo;et is satisfied</p>\n<p class="slindent">Excepting with the water for whose grace</p>\n<p class="slindent">The woman of Samaria besought,</p></div>\n\n<div class="stanza"><p>Put me in travail, and haste goaded me</p>\n<p class="slindent">Along the encumbered path behind my Leader</p>\n<p class="slindent">And I was pitying that righteous vengeance;</p></div>\n\n<div class="stanza"><p>And lo! in the same manner as Luke writeth</p>\n<p class="slindent">That Christ appeared to two upon the way</p>\n<p class="slindent">From the sepulchral cave already risen,</p></div>\n\n<div class="stanza"><p>A shade appeared to us, and came behind us,</p>\n<p class="slindent">Down gazing on the prostrate multitude,</p>\n<p class="slindent">Nor were we ware of it, until it spake,</p></div>\n\n<div class="stanza"><p>Saying, &ldquo;My brothers, may God give you peace!&rdquo;</p>\n<p class="slindent">We turned us suddenly, and Virgilius rendered</p>\n<p class="slindent">To him the countersign thereto conforming.</p></div>\n\n<div class="stanza"><p>Thereon began he: &ldquo;In the blessed council,</p>\n<p class="slindent">Thee may the court veracious place in peace,</p>\n<p class="slindent">That me doth banish in eternal exile!&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;How,&rdquo; said he, and the while we went with speed,</p>\n<p class="slindent">&ldquo;If ye are shades whom God deigns not on high,</p>\n<p class="slindent">Who up his stairs so far has guided you?&rdquo;</p></div>\n\n<div class="stanza"><p>And said my Teacher: &ldquo;If thou note the marks</p>\n<p class="slindent">Which this one bears, and which the Angel traces</p>\n<p class="slindent">Well shalt thou see he with the good must reign.</p></div>\n\n<div class="stanza"><p>But because she who spinneth day and night</p>\n<p class="slindent">For him had not yet drawn the distaff off,</p>\n<p class="slindent">Which Clotho lays for each one and compacts,</p></div>\n\n<div class="stanza"><p>His soul, which is thy sister and my own,</p>\n<p class="slindent">In coming upwards could not come alone,</p>\n<p class="slindent">By reason that it sees not in our fashion.</p></div>\n\n<div class="stanza"><p>Whence I was drawn from out the ample throat</p>\n<p class="slindent">Of Hell to be his guide, and I shall guide him</p>\n<p class="slindent">As far on as my school has power to lead.</p></div>\n\n<div class="stanza"><p>But tell us, if thou knowest, why such a shudder</p>\n<p class="slindent">Erewhile the mountain gave, and why together</p>\n<p class="slindent">All seemed to cry, as far as its moist feet?&rdquo;</p></div>\n\n<div class="stanza"><p>In asking he so hit the very eye</p>\n<p class="slindent">Of my desire, that merely with the hope</p>\n<p class="slindent">My thirst became the less unsatisfied.</p></div>\n\n<div class="stanza"><p>&ldquo;Naught is there,&rdquo; he began, &ldquo;that without order</p>\n<p class="slindent">May the religion of the mountain feel,</p>\n<p class="slindent">Nor aught that may be foreign to its custom.</p></div>\n\n<div class="stanza"><p>Free is it here from every permutation;</p>\n<p class="slindent">What from itself heaven in itself receiveth</p>\n<p class="slindent">Can be of this the cause, and naught beside;</p></div>\n\n<div class="stanza"><p>Because that neither rain, nor hail, nor snow,</p>\n<p class="slindent">Nor dew, nor hoar-frost any higher falls</p>\n<p class="slindent">Than the short, little stairway of three steps.</p></div>\n\n<div class="stanza"><p>Dense clouds do not appear, nor rarefied,</p>\n<p class="slindent">Nor coruscation, nor the daughter of Thaumas,</p>\n<p class="slindent">That often upon earth her region shifts;</p></div>\n\n<div class="stanza"><p>No arid vapour any farther rises</p>\n<p class="slindent">Than to the top of the three steps I spake of,</p>\n<p class="slindent">Whereon the Vicar of Peter has his feet.</p></div>\n\n<div class="stanza"><p>Lower down perchance it trembles less or more,</p>\n<p class="slindent">But, for the wind that in the earth is hidden</p>\n<p class="slindent">I know not how, up here it never trembled.</p></div>\n\n<div class="stanza"><p>It trembles here, whenever any soul</p>\n<p class="slindent">Feels itself pure, so that it soars, or moves</p>\n<p class="slindent">To mount aloft, and such a cry attends it.</p></div>\n\n<div class="stanza"><p>Of purity the will alone gives proof,</p>\n<p class="slindent">Which, being wholly free to change its convent,</p>\n<p class="slindent">Takes by surprise the soul, and helps it fly.</p></div>\n\n<div class="stanza"><p>First it wills well; but the desire permits not,</p>\n<p class="slindent">Which divine justice with the self-same will</p>\n<p class="slindent">There was to sin, upon the torment sets.</p></div>\n\n<div class="stanza"><p>And I, who have been lying in this pain</p>\n<p class="slindent">Five hundred years and more, but just now felt</p>\n<p class="slindent">A free volition for a better seat.</p></div>\n\n<div class="stanza"><p>Therefore thou heardst the earthquake, and the pious</p>\n<p class="slindent">Spirits along the mountain rendering praise</p>\n<p class="slindent">Unto the Lord, that soon he speed them upwards.&rdquo;</p></div>\n\n<div class="stanza"><p>So said he to him; and since we enjoy</p>\n<p class="slindent">As much in drinking as the thirst is great,</p>\n<p class="slindent">I could not say how much it did me good.</p></div>\n\n<div class="stanza"><p>And the wise Leader: &ldquo;Now I see the net</p>\n<p class="slindent">That snares you here, and how ye are set free,</p>\n<p class="slindent">Why the earth quakes, and wherefore ye rejoice.</p></div>\n\n<div class="stanza"><p>Now who thou wast be pleased that I may know;</p>\n<p class="slindent">And why so many centuries thou hast here</p>\n<p class="slindent">Been lying, let me gather from thy words.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;In days when the good Titus, with the aid</p>\n<p class="slindent">Of the supremest King, avenged the wounds</p>\n<p class="slindent">Whence issued forth the blood by Judas sold,</p></div>\n\n<div class="stanza"><p>Under the name that most endures and honours,</p>\n<p class="slindent">Was I on earth,&rdquo; that spirit made reply,</p>\n<p class="slindent">&ldquo;Greatly renowned, but not with faith as yet.</p></div>\n\n<div class="stanza"><p>My vocal spirit was so sweet, that Rome</p>\n<p class="slindent">Me, a Thoulousian, drew unto herself,</p>\n<p class="slindent">Where I deserved to deck my brows with myrtle.</p></div>\n\n<div class="stanza"><p>Statius the people name me still on earth;</p>\n<p class="slindent">I sang of Thebes, and then of great Achilles;</p>\n<p class="slindent">But on the way fell with my second burden.</p></div>\n\n<div class="stanza"><p>The seeds unto my ardour were the sparks</p>\n<p class="slindent">Of that celestial flame which heated me,</p>\n<p class="slindent">Whereby more than a thousand have been fired;</p></div>\n\n<div class="stanza"><p>Of the Aeneid speak I, which to me</p>\n<p class="slindent">A mother was, and was my nurse in song;</p>\n<p class="slindent">Without this weighed I not a drachma&rsquo;s weight.</p></div>\n\n<div class="stanza"><p>And to have lived upon the earth what time</p>\n<p class="slindent">Virgilius lived, I would accept one sun</p>\n<p class="slindent">More than I must ere issuing from my ban.&rdquo;</p></div>\n\n<div class="stanza"><p>These words towards me made Virgilius turn</p>\n<p class="slindent">With looks that in their silence said, &ldquo;Be silent!&rdquo;</p>\n<p class="slindent">But yet the power that wills cannot do all things;</p></div>\n\n<div class="stanza"><p>For tears and laughter are such pursuivants</p>\n<p class="slindent">Unto the passion from which each springs forth,</p>\n<p class="slindent">In the most truthful least the will they follow.</p></div>\n\n<div class="stanza"><p>I only smiled, as one who gives the wink;</p>\n<p class="slindent">Whereat the shade was silent, and it gazed</p>\n<p class="slindent">Into mine eyes, where most expression dwells;</p></div>\n\n<div class="stanza"><p>And, &ldquo;As thou well mayst consummate a labour</p>\n<p class="slindent">So great,&rdquo; it said, &ldquo;why did thy face just now</p>\n<p class="slindent">Display to me the lightning of a smile?&rdquo;</p></div>\n\n<div class="stanza"><p>Now am I caught on this side and on that;</p>\n<p class="slindent">One keeps me silent, one to speak conjures me,</p>\n<p class="slindent">Wherefore I sigh, and I am understood.</p></div>\n\n<div class="stanza"><p>&ldquo;Speak,&rdquo; said my Master, &ldquo;and be not afraid</p>\n<p class="slindent">Of speaking, but speak out, and say to him</p>\n<p class="slindent">What he demands with such solicitude.&rdquo;</p></div>\n\n<div class="stanza"><p>Whence I: &ldquo;Thou peradventure marvellest,</p>\n<p class="slindent">O antique spirit, at the smile I gave;</p>\n<p class="slindent">But I will have more wonder seize upon thee.</p></div>\n\n<div class="stanza"><p>This one, who guides on high these eyes of mine,</p>\n<p class="slindent">Is that Virgilius, from whom thou didst learn</p>\n<p class="slindent">To sing aloud of men and of the Gods.</p></div>\n\n<div class="stanza"><p>If other cause thou to my smile imputedst,</p>\n<p class="slindent">Abandon it as false, and trust it was</p>\n<p class="slindent">Those words which thou hast spoken concerning him.&rdquo;</p></div>\n\n<div class="stanza"><p>Already he was stooping to embrace</p>\n<p class="slindent">My Teacher&rsquo;s feet; but he said to him: &ldquo;Brother,</p>\n<p class="slindent">Do not; for shade thou art, and shade beholdest.&rdquo;</p></div>\n\n<div class="stanza"><p>And he uprising: &ldquo;Now canst thou the sum</p>\n<p class="slindent">Of love which warms me to thee comprehend,</p>\n<p class="slindent">When this our vanity I disremember,</p></div>\n\n<div class="stanza"><p>Treating a shadow as substantial thing.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XXII</p>\n<div class="stanza"><p>Already was the Angel left behind us,</p>\n<p class="slindent">The Angel who to the sixth round had turned us,</p>\n<p class="slindent">Having erased one mark from off my face;</p></div>\n\n<div class="stanza"><p>And those who have in justice their desire</p>\n<p class="slindent">Had said to us, &ldquo;Beati,&rdquo; in their voices,</p>\n<p class="slindent">With &ldquo;sitio,&rdquo; and without more ended it.</p></div>\n\n<div class="stanza"><p>And I, more light than through the other passes,</p>\n<p class="slindent">Went onward so, that without any labour</p>\n<p class="slindent">I followed upward the swift-footed spirits;</p></div>\n\n<div class="stanza"><p>When thus Virgilius began: &ldquo;The love</p>\n<p class="slindent">Kindled by virtue aye another kindles,</p>\n<p class="slindent">Provided outwardly its flame appear.</p></div>\n\n<div class="stanza"><p>Hence from the hour that Juvenal descended</p>\n<p class="slindent">Among us into the infernal Limbo,</p>\n<p class="slindent">Who made apparent to me thy affection,</p></div>\n\n<div class="stanza"><p>My kindliness towards thee was as great</p>\n<p class="slindent">As ever bound one to an unseen person,</p>\n<p class="slindent">So that these stairs will now seem short to me.</p></div>\n\n<div class="stanza"><p>But tell me, and forgive me as a friend,</p>\n<p class="slindent">If too great confidence let loose the rein,</p>\n<p class="slindent">And as a friend now hold discourse with me;</p></div>\n\n<div class="stanza"><p>How was it possible within thy breast</p>\n<p class="slindent">For avarice to find place, &rsquo;mid so much wisdom</p>\n<p class="slindent">As thou wast filled with by thy diligence?&rdquo;</p></div>\n\n<div class="stanza"><p>These words excited Statius at first</p>\n<p class="slindent">Somewhat to laughter; afterward he answered:</p>\n<p class="slindent">&ldquo;Each word of thine is love&rsquo;s dear sign to me.</p></div>\n\n<div class="stanza"><p>Verily oftentimes do things appear</p>\n<p class="slindent">Which give fallacious matter to our doubts,</p>\n<p class="slindent">Instead of the true causes which are hidden!</p></div>\n\n<div class="stanza"><p>Thy question shows me thy belief to be</p>\n<p class="slindent">That I was niggard in the other life,</p>\n<p class="slindent">It may be from the circle where I was;</p></div>\n\n<div class="stanza"><p>Therefore know thou, that avarice was removed</p>\n<p class="slindent">Too far from me; and this extravagance</p>\n<p class="slindent">Thousands of lunar periods have punished.</p></div>\n\n<div class="stanza"><p>And were it not that I my thoughts uplifted,</p>\n<p class="slindent">When I the passage heard where thou exclaimest,</p>\n<p class="slindent">As if indignant, unto human nature,</p></div>\n\n<div class="stanza"><p>&lsquo;To what impellest thou not, O cursed hunger</p>\n<p class="slindent">Of gold, the appetite of mortal men?&rsquo;</p>\n<p class="slindent">Revolving I should feel the dismal joustings.</p></div>\n\n<div class="stanza"><p>Then I perceived the hands could spread too wide</p>\n<p class="slindent">Their wings in spending, and repented me</p>\n<p class="slindent">As well of that as of my other sins;</p></div>\n\n<div class="stanza"><p>How many with shorn hair shall rise again</p>\n<p class="slindent">Because of ignorance, which from this sin</p>\n<p class="slindent">Cuts off repentance living and in death!</p></div>\n\n<div class="stanza"><p>And know that the transgression which rebuts</p>\n<p class="slindent">By direct opposition any sin</p>\n<p class="slindent">Together with it here its verdure dries.</p></div>\n\n<div class="stanza"><p>Therefore if I have been among that folk</p>\n<p class="slindent">Which mourns its avarice, to purify me,</p>\n<p class="slindent">For its opposite has this befallen me.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Now when thou sangest the relentless weapons</p>\n<p class="slindent">Of the twofold affliction of Jocasta,&rdquo;</p>\n<p class="slindent">The singer of the Songs Bucolic said,</p></div>\n\n<div class="stanza"><p>&ldquo;From that which Clio there with thee preludes,</p>\n<p class="slindent">It does not seem that yet had made thee faithful</p>\n<p class="slindent">That faith without which no good works suffice.</p></div>\n\n<div class="stanza"><p>If this be so, what candles or what sun</p>\n<p class="slindent">Scattered thy darkness so that thou didst trim</p>\n<p class="slindent">Thy sails behind the Fisherman thereafter?&rdquo;</p></div>\n\n<div class="stanza"><p>And he to him: &ldquo;Thou first directedst me</p>\n<p class="slindent">Towards Parnassus, in its grots to drink,</p>\n<p class="slindent">And first concerning God didst me enlighten.</p></div>\n\n<div class="stanza"><p>Thou didst as he who walketh in the night,</p>\n<p class="slindent">Who bears his light behind, which helps him not,</p>\n<p class="slindent">But wary makes the persons after him,</p></div>\n\n<div class="stanza"><p>When thou didst say: &lsquo;The age renews itself,</p>\n<p class="slindent">Justice returns, and man&rsquo;s primeval time,</p>\n<p class="slindent">And a new progeny descends from heaven.&rsquo;</p></div>\n\n<div class="stanza"><p>Through thee I Poet was, through thee a Christian;</p>\n<p class="slindent">But that thou better see what I design,</p>\n<p class="slindent">To colour it will I extend my hand.</p></div>\n\n<div class="stanza"><p>Already was the world in every part</p>\n<p class="slindent">Pregnant with the true creed, disseminated</p>\n<p class="slindent">By messengers of the eternal kingdom;</p></div>\n\n<div class="stanza"><p>And thy assertion, spoken of above,</p>\n<p class="slindent">With the new preachers was in unison;</p>\n<p class="slindent">Whence I to visit them the custom took.</p></div>\n\n<div class="stanza"><p>Then they became so holy in my sight,</p>\n<p class="slindent">That, when Domitian persecuted them,</p>\n<p class="slindent">Not without tears of mine were their laments;</p></div>\n\n<div class="stanza"><p>And all the while that I on earth remained,</p>\n<p class="slindent">Them I befriended, and their upright customs</p>\n<p class="slindent">Made me disparage all the other sects.</p></div>\n\n<div class="stanza"><p>And ere I led the Greeks unto the rivers</p>\n<p class="slindent">Of Thebes, in poetry, I was baptized,</p>\n<p class="slindent">But out of fear was covertly a Christian,</p></div>\n\n<div class="stanza"><p>For a long time professing paganism;</p>\n<p class="slindent">And this lukewarmness caused me the fourth circle</p>\n<p class="slindent">To circuit round more than four centuries.</p></div>\n\n<div class="stanza"><p>Thou, therefore, who hast raised the covering</p>\n<p class="slindent">That hid from me whatever good I speak of,</p>\n<p class="slindent">While in ascending we have time to spare,</p></div>\n\n<div class="stanza"><p>Tell me, in what place is our friend Terentius,</p>\n<p class="slindent">Caecilius, Plautus, Varro, if thou knowest;</p>\n<p class="slindent">Tell me if they are damned, and in what alley.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;These, Persius and myself, and others many,&rdquo;</p>\n<p class="slindent">Replied my Leader, &ldquo;with that Grecian are</p>\n<p class="slindent">Whom more than all the rest the Muses suckled,</p></div>\n\n<div class="stanza"><p>In the first circle of the prison blind;</p>\n<p class="slindent">Ofttimes we of the mountain hold discourse</p>\n<p class="slindent">Which has our nurses ever with itself.</p></div>\n\n<div class="stanza"><p>Euripides is with us, Antiphon,</p>\n<p class="slindent">Simonides, Agatho, and many other</p>\n<p class="slindent">Greeks who of old their brows with laurel decked.</p></div>\n\n<div class="stanza"><p>There some of thine own people may be seen,</p>\n<p class="slindent">Antigone, Deiphile and Argia,</p>\n<p class="slindent">And there Ismene mournful as of old.</p></div>\n\n<div class="stanza"><p>There she is seen who pointed out Langia;</p>\n<p class="slindent">There is Tiresias&rsquo; daughter, and there Thetis,</p>\n<p class="slindent">And there Deidamia with her sisters.&rdquo;</p></div>\n\n<div class="stanza"><p>Silent already were the poets both,</p>\n<p class="slindent">Attent once more in looking round about,</p>\n<p class="slindent">From the ascent and from the walls released;</p></div>\n\n<div class="stanza"><p>And four handmaidens of the day already</p>\n<p class="slindent">Were left behind, and at the pole the fifth</p>\n<p class="slindent">Was pointing upward still its burning horn,</p></div>\n\n<div class="stanza"><p>What time my Guide: &ldquo;I think that tow&rsquo;rds the edge</p>\n<p class="slindent">Our dexter shoulders it behoves us turn,</p>\n<p class="slindent">Circling the mount as we are wont to do.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus in that region custom was our ensign;</p>\n<p class="slindent">And we resumed our way with less suspicion</p>\n<p class="slindent">For the assenting of that worthy soul</p></div>\n\n<div class="stanza"><p>They in advance went on, and I alone</p>\n<p class="slindent">Behind them, and I listened to their speech,</p>\n<p class="slindent">Which gave me lessons in the art of song.</p></div>\n\n<div class="stanza"><p>But soon their sweet discourses interrupted</p>\n<p class="slindent">A tree which midway in the road we found,</p>\n<p class="slindent">With apples sweet and grateful to the smell.</p></div>\n\n<div class="stanza"><p>And even as a fir-tree tapers upward</p>\n<p class="slindent">From bough to bough, so downwardly did that;</p>\n<p class="slindent">I think in order that no one might climb it.</p></div>\n\n<div class="stanza"><p>On that side where our pathway was enclosed</p>\n<p class="slindent">Fell from the lofty rock a limpid water,</p>\n<p class="slindent">And spread itself abroad upon the leaves.</p></div>\n\n<div class="stanza"><p>The Poets twain unto the tree drew near,</p>\n<p class="slindent">And from among the foliage a voice</p>\n<p class="slindent">Cried: &ldquo;Of this food ye shall have scarcity.&rdquo;</p></div>\n\n<div class="stanza"><p>Then said: &ldquo;More thoughtful Mary was of making</p>\n<p class="slindent">The marriage feast complete and honourable,</p>\n<p class="slindent">Than of her mouth which now for you responds;</p></div>\n\n<div class="stanza"><p>And for their drink the ancient Roman women</p>\n<p class="slindent">With water were content; and Daniel</p>\n<p class="slindent">Disparaged food, and understanding won.</p></div>\n\n<div class="stanza"><p>The primal age was beautiful as gold;</p>\n<p class="slindent">Acorns it made with hunger savorous,</p>\n<p class="slindent">And nectar every rivulet with thirst.</p></div>\n\n<div class="stanza"><p>Honey and locusts were the aliments</p>\n<p class="slindent">That fed the Baptist in the wilderness;</p>\n<p class="slindent">Whence he is glorious, and so magnified</p></div>\n\n<div class="stanza"><p>As by the Evangel is revealed to you.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XXIII</p>\n<div class="stanza"><p>The while among the verdant leaves mine eyes</p>\n<p class="slindent">I riveted, as he is wont to do</p>\n<p class="slindent">Who wastes his life pursuing little birds,</p></div>\n\n<div class="stanza"><p>My more than Father said unto me: &ldquo;Son,</p>\n<p class="slindent">Come now; because the time that is ordained us</p>\n<p class="slindent">More usefully should be apportioned out.&rdquo;</p></div>\n\n<div class="stanza"><p>I turned my face and no less soon my steps</p>\n<p class="slindent">Unto the Sages, who were speaking so</p>\n<p class="slindent">They made the going of no cost to me;</p></div>\n\n<div class="stanza"><p>And lo! were heard a song and a lament,</p>\n<p class="slindent">&ldquo;Labia mea, Domine,&rdquo; in fashion</p>\n<p class="slindent">Such that delight and dolence it brought forth.</p></div>\n\n<div class="stanza"><p>&ldquo;O my sweet Father, what is this I hear?&rdquo;</p>\n<p class="slindent">Began I; and he answered: &ldquo;Shades that go</p>\n<p class="slindent">Perhaps the knot unloosing of their debt.&rdquo;</p></div>\n\n<div class="stanza"><p>In the same way that thoughtful pilgrims do,</p>\n<p class="slindent">Who, unknown people on the road o&rsquo;ettaking,</p>\n<p class="slindent">Turn themselves round to them, and do not stop,</p></div>\n\n<div class="stanza"><p>Even thus, behind us with a swifter motion</p>\n<p class="slindent">Coming and passing onward, gazed upon us</p>\n<p class="slindent">A crowd of spirits silent and devout.</p></div>\n\n<div class="stanza"><p>Each in his eyes was dark and cavernous,</p>\n<p class="slindent">Pallid in face, and so emaciate</p>\n<p class="slindent">That from the bones the skin did shape itself.</p></div>\n\n<div class="stanza"><p>I do not think that so to merest rind</p>\n<p class="slindent">Could Erisichthon have been withered up</p>\n<p class="slindent">By famine, when most fear he had of it.</p></div>\n\n<div class="stanza"><p>Thinking within myself I said: &ldquo;Behold,</p>\n<p class="slindent">This is the folk who lost Jerusalem,</p>\n<p class="slindent">When Mary made a prey of her own son.&rdquo;</p></div>\n\n<div class="stanza"><p>Their sockets were like rings without the gems;</p>\n<p class="slindent">Whoever in the face of men reads &lsquo;omo&rsquo;</p>\n<p class="slindent">Might well in these have recognised the &lsquo;m.&rsquo;</p></div>\n\n<div class="stanza"><p>Who would believe the odour of an apple,</p>\n<p class="slindent">Begetting longing, could consume them so,</p>\n<p class="slindent">And that of water, without knowing how?</p></div>\n\n<div class="stanza"><p>I still was wondering what so famished them,</p>\n<p class="slindent">For the occasion not yet manifest</p>\n<p class="slindent">Of their emaciation and sad squalor;</p></div>\n\n<div class="stanza"><p>And lo! from out the hollow of his head</p>\n<p class="slindent">His eyes a shade turned on me, and looked keenly;</p>\n<p class="slindent">Then cried aloud: &ldquo;What grace to me is this?&rdquo;</p></div>\n\n<div class="stanza"><p>Never should I have known him by his look;</p>\n<p class="slindent">But in his voice was evident to me</p>\n<p class="slindent">That which his aspect had suppressed within it.</p></div>\n\n<div class="stanza"><p>This spark within me wholly re-enkindled</p>\n<p class="slindent">My recognition of his altered face,</p>\n<p class="slindent">And I recalled the features of Forese.</p></div>\n\n<div class="stanza"><p>&ldquo;Ah, do not look at this dry leprosy,&rdquo;</p>\n<p class="slindent">Entreated he, &ldquo;which doth my skin discolour,</p>\n<p class="slindent">Nor at default of flesh that I may have;</p></div>\n\n<div class="stanza"><p>But tell me truth of thee, and who are those</p>\n<p class="slindent">Two souls, that yonder make for thee an escort;</p>\n<p class="slindent">Do not delay in speaking unto me.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;That face of thine, which dead I once bewept,</p>\n<p class="slindent">Gives me for weeping now no lesser grief,&rdquo;</p>\n<p class="slindent">I answered him, &ldquo;beholding it so changed!</p></div>\n\n<div class="stanza"><p>But tell me, for God&rsquo;s sake, what thus denudes you?</p>\n<p class="slindent">Make me not speak while I am marvelling,</p>\n<p class="slindent">For ill speaks he who&rsquo;s full of other longings.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;From the eternal council</p>\n<p class="slindent">Falls power into the water and the tree</p>\n<p class="slindent">Behind us left, whereby I grow so thin.</p></div>\n\n<div class="stanza"><p>All of this people who lamenting sing,</p>\n<p class="slindent">For following beyond measure appetite</p>\n<p class="slindent">In hunger and thirst are here re-sanctified.</p></div>\n\n<div class="stanza"><p>Desire to eat and drink enkindles in us</p>\n<p class="slindent">The scent that issues from the apple-tree,</p>\n<p class="slindent">And from the spray that sprinkles o&rsquo;et the verdure;</p></div>\n\n<div class="stanza"><p>And not a single time alone, this ground</p>\n<p class="slindent">Encompassing, is refreshed our pain,\u2014</p>\n<p class="slindent">I say our pain, and ought to say our solace,\u2014</p></div>\n\n<div class="stanza"><p>For the same wish doth lead us to the tree</p>\n<p class="slindent">Which led the Christ rejoicing to say &lsquo;Eli,&rsquo;</p>\n<p class="slindent">When with his veins he liberated us.&rdquo;</p></div>\n\n<div class="stanza"><p>And I to him: &ldquo;Forese, from that day</p>\n<p class="slindent">When for a better life thou changedst worlds,</p>\n<p class="slindent">Up to this time five years have not rolled round.</p></div>\n\n<div class="stanza"><p>If sooner were the power exhausted in thee</p>\n<p class="slindent">Of sinning more, than thee the hour surprised</p>\n<p class="slindent">Of that good sorrow which to God reweds us,</p></div>\n\n<div class="stanza"><p>How hast thou come up hitherward already?</p>\n<p class="slindent">I thought to find thee down there underneath,</p>\n<p class="slindent">Where time for time doth restitution make.&rdquo;</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;Thus speedily has led me</p>\n<p class="slindent">To drink of the sweet wormwood of these torments,</p>\n<p class="slindent">My Nella with her overflowing tears;</p></div>\n\n<div class="stanza"><p>She with her prayers devout and with her sighs</p>\n<p class="slindent">Has drawn me from the coast where one where one awaits,</p>\n<p class="slindent">And from the other circles set me free.</p></div>\n\n<div class="stanza"><p>So much more dear and pleasing is to God</p>\n<p class="slindent">My little widow, whom so much I loved,</p>\n<p class="slindent">As in good works she is the more alone;</p></div>\n\n<div class="stanza"><p>For the Barbagia of Sardinia</p>\n<p class="slindent">By far more modest in its women is</p>\n<p class="slindent">Than the Barbagia I have left her in.</p></div>\n\n<div class="stanza"><p>O brother sweet, what wilt thou have me say?</p>\n<p class="slindent">A future time is in my sight already,</p>\n<p class="slindent">To which this hour will not be very old,</p></div>\n\n<div class="stanza"><p>When from the pulpit shall be interdicted</p>\n<p class="slindent">To the unblushing womankind of Florence</p>\n<p class="slindent">To go about displaying breast and paps.</p></div>\n\n<div class="stanza"><p>What savages were e&rsquo;et, what Saracens,</p>\n<p class="slindent">Who stood in need, to make them covered go,</p>\n<p class="slindent">Of spiritual or other discipline?</p></div>\n\n<div class="stanza"><p>But if the shameless women were assured</p>\n<p class="slindent">Of what swift Heaven prepares for them, already</p>\n<p class="slindent">Wide open would they have their mouths to howl;</p></div>\n\n<div class="stanza"><p>For if my foresight here deceive me not,</p>\n<p class="slindent">They shall be sad ere he has bearded cheeks</p>\n<p class="slindent">Who now is hushed to sleep with lullaby.</p></div>\n\n<div class="stanza"><p>O brother, now no longer hide thee from me;</p>\n<p class="slindent">See that not only I, but all these people</p>\n<p class="slindent">Are gazing there, where thou dost veil the sun.&rdquo;</p></div>\n\n<div class="stanza"><p>Whence I to him: &ldquo;If thou bring back to mind</p>\n<p class="slindent">What thou with me hast been and I with thee,</p>\n<p class="slindent">The present memory will be grievous still.</p></div>\n\n<div class="stanza"><p>Out of that life he turned me back who goes</p>\n<p class="slindent">In front of me, two days agone when round</p>\n<p class="slindent">The sister of him yonder showed herself,&rdquo;</p></div>\n\n<div class="stanza"><p>And to the sun I pointed.  &ldquo;Through the deep</p>\n<p class="slindent">Night of the truly dead has this one led me,</p>\n<p class="slindent">With this true flesh, that follows after him.</p></div>\n\n<div class="stanza"><p>Thence his encouragements have led me up,</p>\n<p class="slindent">Ascending and still circling round the mount</p>\n<p class="slindent">That you doth straighten, whom the world made crooked.</p></div>\n\n<div class="stanza"><p>He says that he will bear me company,</p>\n<p class="slindent">Till I shall be where Beatrice will be;</p>\n<p class="slindent">There it behoves me to remain without him.</p></div>\n\n<div class="stanza"><p>This is Virgilius, who thus says to me,&rdquo;</p>\n<p class="slindent">And him I pointed at; &ldquo;the other is</p>\n<p class="slindent">That shade for whom just now shook every slope</p></div>\n\n<div class="stanza"><p>Your realm, that from itself discharges him.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XXIV</p>\n<div class="stanza"><p>Nor speech the going, nor the going that</p>\n<p class="slindent">Slackened; but talking we went bravely on,</p>\n<p class="slindent">Even as a vessel urged by a good wind.</p></div>\n\n<div class="stanza"><p>And shadows, that appeared things doubly dead,</p>\n<p class="slindent">From out the sepulchres of their eyes betrayed</p>\n<p class="slindent">Wonder at me, aware that I was living.</p></div>\n\n<div class="stanza"><p>And I, continuing my colloquy,</p>\n<p class="slindent">Said: &ldquo;Peradventure he goes up more slowly</p>\n<p class="slindent">Than he would do, for other people&rsquo;s sake.</p></div>\n\n<div class="stanza"><p>But tell me, if thou knowest, where is Piccarda;</p>\n<p class="slindent">Tell me if any one of note I see</p>\n<p class="slindent">Among this folk that gazes at me so.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;My sister, who, &rsquo;twixt beautiful and good,</p>\n<p class="slindent">I know not which was more, triumphs rejoicing</p>\n<p class="slindent">Already in her crown on high Olympus.&rdquo;</p></div>\n\n<div class="stanza"><p>So said he first, and then: &ldquo;&rsquo;Tis not forbidden</p>\n<p class="slindent">To name each other here, so milked away</p>\n<p class="slindent">Is our resemblance by our dieting.</p></div>\n\n<div class="stanza"><p>This,&rdquo; pointing with his finger, &ldquo;is Buonagiunta,</p>\n<p class="slindent">Buonagiunta, of Lucca; and that face</p>\n<p class="slindent">Beyond him there, more peaked than the others,</p></div>\n\n<div class="stanza"><p>Has held the holy Church within his arms;</p>\n<p class="slindent">From Tours was he, and purges by his fasting</p>\n<p class="slindent">Bolsena&rsquo;s eels and the Vernaccia wine.&rdquo;</p></div>\n\n<div class="stanza"><p>He named me many others one by one;</p>\n<p class="slindent">And all contented seemed at being named,</p>\n<p class="slindent">So that for this I saw not one dark look.</p></div>\n\n<div class="stanza"><p>I saw for hunger bite the empty air</p>\n<p class="slindent">Ubaldin dalla Pila, and Boniface,</p>\n<p class="slindent">Who with his crook had pastured many people.</p></div>\n\n<div class="stanza"><p>I saw Messer Marchese, who had leisure</p>\n<p class="slindent">Once at Forli for drinking with less dryness,</p>\n<p class="slindent">And he was one who ne&rsquo;et felt satisfied.</p></div>\n\n<div class="stanza"><p>But as he does who scans, and then doth prize</p>\n<p class="slindent">One more than others, did I him of Lucca,</p>\n<p class="slindent">Who seemed to take most cognizance of me.</p></div>\n\n<div class="stanza"><p>He murmured, and I know not what Gentucca</p>\n<p class="slindent">From that place heard I, where he felt the wound</p>\n<p class="slindent">Of justice, that doth macerate them so.</p></div>\n\n<div class="stanza"><p>&ldquo;O soul,&rdquo; I said, &ldquo;that seemest so desirous</p>\n<p class="slindent">To speak with me, do so that I may hear thee,</p>\n<p class="slindent">And with thy speech appease thyself and me.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;A maid is born, and wears not yet the veil,&rdquo;</p>\n<p class="slindent">Began he, &ldquo;who to thee shall pleasant make</p>\n<p class="slindent">My city, howsoever men may blame it.</p></div>\n\n<div class="stanza"><p>Thou shalt go on thy way with this prevision;</p>\n<p class="slindent">If by my murmuring thou hast been deceived,</p>\n<p class="slindent">True things hereafter will declare it to thee.</p></div>\n\n<div class="stanza"><p>But say if him I here behold, who forth</p>\n<p class="slindent">Evoked the new-invented rhymes, beginning,</p>\n<p class="slindent">&lsquo;Ladies, that have intelligence of love?&rsquo;&nbsp;&rdquo;</p></div>\n\n<div class="stanza"><p>And I to him: &ldquo;One am I, who, whenever</p>\n<p class="slindent">Love doth inspire me, note, and in that measure</p>\n<p class="slindent">Which he within me dictates, singing go.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O brother, now I see,&rdquo; he said, &ldquo;the knot</p>\n<p class="slindent">Which me, the Notary, and Guittone held</p>\n<p class="slindent">Short of the sweet new style that now I hear.</p></div>\n\n<div class="stanza"><p>I do perceive full clearly how your pens</p>\n<p class="slindent">Go closely following after him who dictates,</p>\n<p class="slindent">Which with our own forsooth came not to pass;</p></div>\n\n<div class="stanza"><p>And he who sets himself to go beyond,</p>\n<p class="slindent">No difference sees from one style to another;&rdquo;</p>\n<p class="slindent">And as if satisfied, he held his peace.</p></div>\n\n<div class="stanza"><p>Even as the birds, that winter tow&rsquo;rds the Nile,</p>\n<p class="slindent">Sometimes into a phalanx form themselves,</p>\n<p class="slindent">Then fly in greater haste, and go in file;</p></div>\n\n<div class="stanza"><p>In such wise all the people who were there,</p>\n<p class="slindent">Turning their faces, hurried on their steps,</p>\n<p class="slindent">Both by their leanness and their wishes light.</p></div>\n\n<div class="stanza"><p>And as a man, who weary is with trotting,</p>\n<p class="slindent">Lets his companions onward go, and walks,</p>\n<p class="slindent">Until he vents the panting of his chest;</p></div>\n\n<div class="stanza"><p>So did Forese let the holy flock</p>\n<p class="slindent">Pass by, and came with me behind it, saying,</p>\n<p class="slindent">&ldquo;When will it be that I again shall see thee?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;How long,&rdquo; I answered, &ldquo;I may live, I know not;</p>\n<p class="slindent">Yet my return will not so speedy be,</p>\n<p class="slindent">But I shall sooner in desire arrive;</p></div>\n\n<div class="stanza"><p>Because the place where I was set to live</p>\n<p class="slindent">From day to day of good is more depleted,</p>\n<p class="slindent">And unto dismal ruin seems ordained.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Now go,&rdquo; he said, &ldquo;for him most guilty of it</p>\n<p class="slindent">At a beast&rsquo;s tail behold I dragged along</p>\n<p class="slindent">Towards the valley where is no repentance.</p></div>\n\n<div class="stanza"><p>Faster at every step the beast is going,</p>\n<p class="slindent">Increasing evermore until it smites him,</p>\n<p class="slindent">And leaves the body vilely mutilated.</p></div>\n\n<div class="stanza"><p>Not long those wheels shall turn,&rdquo; and he uplifted</p>\n<p class="slindent">His eyes to heaven, &ldquo;ere shall be clear to thee</p>\n<p class="slindent">That which my speech no farther can declare.</p></div>\n\n<div class="stanza"><p>Now stay behind; because the time so precious</p>\n<p class="slindent">Is in this kingdom, that I lose too much</p>\n<p class="slindent">By coming onward thus abreast with thee.&rdquo;</p></div>\n\n<div class="stanza"><p>As sometimes issues forth upon a gallop</p>\n<p class="slindent">A cavalier from out a troop that ride,</p>\n<p class="slindent">And seeks the honour of the first encounter,</p></div>\n\n<div class="stanza"><p>So he with greater strides departed from us;</p>\n<p class="slindent">And on the road remained I with those two,</p>\n<p class="slindent">Who were such mighty marshals of the world.</p></div>\n\n<div class="stanza"><p>And when before us he had gone so far</p>\n<p class="slindent">Mine eyes became to him such pursuivants</p>\n<p class="slindent">As was my understanding to his words,</p></div>\n\n<div class="stanza"><p>Appeared to me with laden and living boughs</p>\n<p class="slindent">Another apple-tree, and not far distant,</p>\n<p class="slindent">From having but just then turned thitherward.</p></div>\n\n<div class="stanza"><p>People I saw beneath it lift their hands,</p>\n<p class="slindent">And cry I know not what towards the leaves,</p>\n<p class="slindent">Like little children eager and deluded,</p></div>\n\n<div class="stanza"><p>Who pray, and he they pray to doth not answer,</p>\n<p class="slindent">But, to make very keen their appetite,</p>\n<p class="slindent">Holds their desire aloft, and hides it not.</p></div>\n\n<div class="stanza"><p>Then they departed as if undeceived;</p>\n<p class="slindent">And now we came unto the mighty tree</p>\n<p class="slindent">Which prayers and tears so manifold refuses.</p></div>\n\n<div class="stanza"><p>&ldquo;Pass farther onward without drawing near;</p>\n<p class="slindent">The tree of which Eve ate is higher up,</p>\n<p class="slindent">And out of that one has this tree been raised.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus said I know not who among the branches;</p>\n<p class="slindent">Whereat Virgilius, Statius, and myself</p>\n<p class="slindent">Went crowding forward on the side that rises.</p></div>\n\n<div class="stanza"><p>&ldquo;Be mindful,&rdquo; said he, &ldquo;of the accursed ones</p>\n<p class="slindent">Formed of the cloud-rack, who inebriate</p>\n<p class="slindent">Combated Theseus with their double breasts;</p></div>\n\n<div class="stanza"><p>And of the Jews who showed them soft in drinking,</p>\n<p class="slindent">Whence Gideon would not have them for companions</p>\n<p class="slindent">When he tow&rsquo;rds Midian the hills descended.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus, closely pressed to one of the two borders,</p>\n<p class="slindent">On passed we, hearing sins of gluttony,</p>\n<p class="slindent">Followed forsooth by miserable gains;</p></div>\n\n<div class="stanza"><p>Then set at large upon the lonely road,</p>\n<p class="slindent">A thousand steps and more we onward went,</p>\n<p class="slindent">In contemplation, each without a word.</p></div>\n\n<div class="stanza"><p>&ldquo;What go ye thinking thus, ye three alone?&rdquo;</p>\n<p class="slindent">Said suddenly a voice, whereat I started</p>\n<p class="slindent">As terrified and timid beasts are wont.</p></div>\n\n<div class="stanza"><p>I raised my head to see who this might be,</p>\n<p class="slindent">And never in a furnace was there seen</p>\n<p class="slindent">Metals or glass so lucent and so red</p></div>\n\n<div class="stanza"><p>As one I saw who said: &ldquo;If it may please you</p>\n<p class="slindent">To mount aloft, here it behoves you turn;</p>\n<p class="slindent">This way goes he who goeth after peace.&rdquo;</p></div>\n\n<div class="stanza"><p>His aspect had bereft me of my sight,</p>\n<p class="slindent">So that I turned me back unto my Teachers,</p>\n<p class="slindent">Like one who goeth as his hearing guides him.</p></div>\n\n<div class="stanza"><p>And as, the harbinger of early dawn,</p>\n<p class="slindent">The air of May doth move and breathe out fragrance,</p>\n<p class="slindent">Impregnate all with herbage and with flowers,</p></div>\n\n<div class="stanza"><p>So did I feel a breeze strike in the midst</p>\n<p class="slindent">My front, and felt the moving of the plumes</p>\n<p class="slindent">That breathed around an odour of ambrosia;</p></div>\n\n<div class="stanza"><p>And heard it said: &ldquo;Blessed are they whom grace</p>\n<p class="slindent">So much illumines, that the love of taste</p>\n<p class="slindent">Excites not in their breasts too great desire,</p></div>\n\n<div class="stanza"><p>Hungering at all times so far as is just.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XXV</p>\n<div class="stanza"><p>Now was it the ascent no hindrance brooked,</p>\n<p class="slindent">Because the sun had his meridian circle</p>\n<p class="slindent">To Taurus left, and night to Scorpio;</p></div>\n\n<div class="stanza"><p>Wherefore as doth a man who tarries not,</p>\n<p class="slindent">But goes his way, whate&rsquo;et to him appear,</p>\n<p class="slindent">If of necessity the sting transfix him,</p></div>\n\n<div class="stanza"><p>In this wise did we enter through the gap,</p>\n<p class="slindent">Taking the stairway, one before the other,</p>\n<p class="slindent">Which by its narrowness divides the climbers.</p></div>\n\n<div class="stanza"><p>And as the little stork that lifts its wing</p>\n<p class="slindent">With a desire to fly, and does not venture</p>\n<p class="slindent">To leave the nest, and lets it downward droop,</p></div>\n\n<div class="stanza"><p>Even such was I, with the desire of asking</p>\n<p class="slindent">Kindled and quenched, unto the motion coming</p>\n<p class="slindent">He makes who doth address himself to speak.</p></div>\n\n<div class="stanza"><p>Not for our pace, though rapid it might be,</p>\n<p class="slindent">My father sweet forbore, but said: &ldquo;Let fly</p>\n<p class="slindent">The bow of speech thou to the barb hast drawn.&rdquo;</p></div>\n\n<div class="stanza"><p>With confidence I opened then my mouth,</p>\n<p class="slindent">And I began: &ldquo;How can one meagre grow</p>\n<p class="slindent">There where the need of nutriment applies not?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;If thou wouldst call to mind how Meleager</p>\n<p class="slindent">Was wasted by the wasting of a brand,</p>\n<p class="slindent">This would not,&rdquo; said he, &ldquo;be to thee so sour;</p></div>\n\n<div class="stanza"><p>And wouldst thou think how at each tremulous motion</p>\n<p class="slindent">Trembles within a mirror your own image;</p>\n<p class="slindent">That which seems hard would mellow seem to thee.</p></div>\n\n<div class="stanza"><p>But that thou mayst content thee in thy wish</p>\n<p class="slindent">Lo Statius here; and him I call and pray</p>\n<p class="slindent">He now will be the healer of thy wounds.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;If I unfold to him the eternal vengeance,&rdquo;</p>\n<p class="slindent">Responded Statius, &ldquo;where thou present art,</p>\n<p class="slindent">Be my excuse that I can naught deny thee.&rdquo;</p></div>\n\n<div class="stanza"><p>Then he began: &ldquo;Son, if these words of mine</p>\n<p class="slindent">Thy mind doth contemplate and doth receive,</p>\n<p class="slindent">They&rsquo;ll be thy light unto the How thou sayest.</p></div>\n\n<div class="stanza"><p>The perfect blood, which never is drunk up</p>\n<p class="slindent">Into the thirsty veins, and which remaineth</p>\n<p class="slindent">Like food that from the table thou removest,</p></div>\n\n<div class="stanza"><p>Takes in the heart for all the human members</p>\n<p class="slindent">Virtue informative, as being that</p>\n<p class="slindent">Which to be changed to them goes through the veins</p></div>\n\n<div class="stanza"><p>Again digest, descends it where &rsquo;tis better</p>\n<p class="slindent">Silent to be than say; and then drops thence</p>\n<p class="slindent">Upon another&rsquo;s blood in natural vase.</p></div>\n\n<div class="stanza"><p>There one together with the other mingles,</p>\n<p class="slindent">One to be passive meant, the other active</p>\n<p class="slindent">By reason of the perfect place it springs from;</p></div>\n\n<div class="stanza"><p>And being conjoined, begins to operate,</p>\n<p class="slindent">Coagulating first, then vivifying</p>\n<p class="slindent">What for its matter it had made consistent.</p></div>\n\n<div class="stanza"><p>The active virtue, being made a soul</p>\n<p class="slindent">As of a plant, (in so far different,</p>\n<p class="slindent">This on the way is, that arrived already,)</p></div>\n\n<div class="stanza"><p>Then works so much, that now it moves and feels</p>\n<p class="slindent">Like a sea-fungus, and then undertakes</p>\n<p class="slindent">To organize the powers whose seed it is.</p></div>\n\n<div class="stanza"><p>Now, Son, dilates and now distends itself</p>\n<p class="slindent">The virtue from the generator&rsquo;s heart,</p>\n<p class="slindent">Where nature is intent on all the members.</p></div>\n\n<div class="stanza"><p>But how from animal it man becomes</p>\n<p class="slindent">Thou dost not see as yet; this is a point</p>\n<p class="slindent">Which made a wiser man than thou once err</p></div>\n\n<div class="stanza"><p>So far, that in his doctrine separate</p>\n<p class="slindent">He made the soul from possible intellect,</p>\n<p class="slindent">For he no organ saw by this assumed.</p></div>\n\n<div class="stanza"><p>Open thy breast unto the truth that&rsquo;s coming,</p>\n<p class="slindent">And know that, just as soon as in the foetus</p>\n<p class="slindent">The articulation of the brain is perfect,</p></div>\n\n<div class="stanza"><p>The primal Motor turns to it well pleased</p>\n<p class="slindent">At so great art of nature, and inspires</p>\n<p class="slindent">A spirit new with virtue all replete,</p></div>\n\n<div class="stanza"><p>Which what it finds there active doth attract</p>\n<p class="slindent">Into its substance, and becomes one soul,</p>\n<p class="slindent">Which lives, and feels, and on itself revolves.</p></div>\n\n<div class="stanza"><p>And that thou less may wonder at my word,</p>\n<p class="slindent">Behold the sun&rsquo;s heat, which becometh wine,</p>\n<p class="slindent">Joined to the juice that from the vine distils.</p></div>\n\n<div class="stanza"><p>Whenever Lachesis has no more thread,</p>\n<p class="slindent">It separates from the flesh, and virtually</p>\n<p class="slindent">Bears with itself the human and divine;</p></div>\n\n<div class="stanza"><p>The other faculties are voiceless all;</p>\n<p class="slindent">The memory, the intelligence, and the will</p>\n<p class="slindent">In action far more vigorous than before.</p></div>\n\n<div class="stanza"><p>Without a pause it falleth of itself</p>\n<p class="slindent">In marvellous way on one shore or the other;</p>\n<p class="slindent">There of its roads it first is cognizant.</p></div>\n\n<div class="stanza"><p>Soon as the place there circumscribeth it,</p>\n<p class="slindent">The virtue informative rays round about,</p>\n<p class="slindent">As, and as much as, in the living members.</p></div>\n\n<div class="stanza"><p>And even as the air, when full of rain,</p>\n<p class="slindent">By alien rays that are therein reflected,</p>\n<p class="slindent">With divers colours shows itself adorned,</p></div>\n\n<div class="stanza"><p>So there the neighbouring air doth shape itself</p>\n<p class="slindent">Into that form which doth impress upon it</p>\n<p class="slindent">Virtually the soul that has stood still.</p></div>\n\n<div class="stanza"><p>And then in manner of the little flame,</p>\n<p class="slindent">Which followeth the fire where&rsquo;et it shifts,</p>\n<p class="slindent">After the spirit followeth its new form.</p></div>\n\n<div class="stanza"><p>Since afterwards it takes from this its semblance,</p>\n<p class="slindent">It is called shade; and thence it organizes</p>\n<p class="slindent">Thereafter every sense, even to the sight.</p></div>\n\n<div class="stanza"><p>Thence is it that we speak, and thence we laugh;</p>\n<p class="slindent">Thence is it that we form the tears and sighs,</p>\n<p class="slindent">That on the mountain thou mayhap hast heard.</p></div>\n\n<div class="stanza"><p>According as impress us our desires</p>\n<p class="slindent">And other affections, so the shade is shaped,</p>\n<p class="slindent">And this is cause of what thou wonderest at.&rdquo;</p></div>\n\n<div class="stanza"><p>And now unto the last of all the circles</p>\n<p class="slindent">Had we arrived, and to the right hand turned,</p>\n<p class="slindent">And were attentive to another care.</p></div>\n\n<div class="stanza"><p>There the embankment shoots forth flames of fire,</p>\n<p class="slindent">And upward doth the cornice breathe a blast</p>\n<p class="slindent">That drives them back, and from itself sequesters.</p></div>\n\n<div class="stanza"><p>Hence we must needs go on the open side,</p>\n<p class="slindent">And one by one; and I did fear the fire</p>\n<p class="slindent">On this side, and on that the falling down.</p></div>\n\n<div class="stanza"><p>My Leader said: &ldquo;Along this place one ought</p>\n<p class="slindent">To keep upon the eyes a tightened rein,</p>\n<p class="slindent">Seeing that one so easily might err.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;Summae Deus clementiae,&rdquo; in the bosom</p>\n<p class="slindent">Of the great burning chanted then I heard,</p>\n<p class="slindent">Which made me no less eager to turn round;</p></div>\n\n<div class="stanza"><p>And spirits saw I walking through the flame;</p>\n<p class="slindent">Wherefore I looked, to my own steps and theirs</p>\n<p class="slindent">Apportioning my sight from time to time.</p></div>\n\n<div class="stanza"><p>After the close which to that hymn is made,</p>\n<p class="slindent">Aloud they shouted, &ldquo;Virum non cognosco;&rdquo;</p>\n<p class="slindent">Then recommenced the hymn with voices low.</p></div>\n\n<div class="stanza"><p>This also ended, cried they: &ldquo;To the wood</p>\n<p class="slindent">Diana ran, and drove forth Helice</p>\n<p class="slindent">Therefrom, who had of Venus felt the poison.&rdquo;</p></div>\n\n<div class="stanza"><p>Then to their song returned they; then the wives</p>\n<p class="slindent">They shouted, and the husbands who were chaste.</p>\n<p class="slindent">As virtue and the marriage vow imposes.</p></div>\n\n<div class="stanza"><p>And I believe that them this mode suffices,</p>\n<p class="slindent">For all the time the fire is burning them;</p>\n<p class="slindent">With such care is it needful, and such food,</p></div>\n\n<div class="stanza"><p>That the last wound of all should be closed up.</p></div>','<p class="cantohead">Purgatorio: Canto XXVI</p>\n<div class="stanza"><p>While on the brink thus one before the other</p>\n<p class="slindent">We went upon our way, oft the good Master</p>\n<p class="slindent">Said: &ldquo;Take thou heed! suffice it that I warn thee.&rdquo;</p></div>\n\n<div class="stanza"><p>On the right shoulder smote me now the sun,</p>\n<p class="slindent">That, raying out, already the whole west</p>\n<p class="slindent">Changed from its azure aspect into white.</p></div>\n\n<div class="stanza"><p>And with my shadow did I make the flame</p>\n<p class="slindent">Appear more red; and even to such a sign</p>\n<p class="slindent">Shades saw I many, as they went, give heed.</p></div>\n\n<div class="stanza"><p>This was the cause that gave them a beginning</p>\n<p class="slindent">To speak of me; and to themselves began they</p>\n<p class="slindent">To say: &ldquo;That seems not a factitious body!&rdquo;</p></div>\n\n<div class="stanza"><p>Then towards me, as far as they could come,</p>\n<p class="slindent">Came certain of them, always with regard</p>\n<p class="slindent">Not to step forth where they would not be burned.</p></div>\n\n<div class="stanza"><p>&ldquo;O thou who goest, not from being slower</p>\n<p class="slindent">But reverent perhaps, behind the others,</p>\n<p class="slindent">Answer me, who in thirst and fire am burning.</p></div>\n\n<div class="stanza"><p>Nor to me only is thine answer needful;</p>\n<p class="slindent">For all of these have greater thirst for it</p>\n<p class="slindent">Than for cold water Ethiop or Indian.</p></div>\n\n<div class="stanza"><p>Tell us how is it that thou makest thyself</p>\n<p class="slindent">A wall unto the sun, as if thou hadst not</p>\n<p class="slindent">Entered as yet into the net of death.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus one of them addressed me, and I straight</p>\n<p class="slindent">Should have revealed myself, were I not bent</p>\n<p class="slindent">On other novelty that then appeared.</p></div>\n\n<div class="stanza"><p>For through the middle of the burning road</p>\n<p class="slindent">There came a people face to face with these,</p>\n<p class="slindent">Which held me in suspense with gazing at them.</p></div>\n\n<div class="stanza"><p>There see I hastening upon either side</p>\n<p class="slindent">Each of the shades, and kissing one another</p>\n<p class="slindent">Without a pause, content with brief salute.</p></div>\n\n<div class="stanza"><p>Thus in the middle of their brown battalions</p>\n<p class="slindent">Muzzle to muzzle one ant meets another</p>\n<p class="slindent">Perchance to spy their journey or their fortune.</p></div>\n\n<div class="stanza"><p>No sooner is the friendly greeting ended,</p>\n<p class="slindent">Or ever the first footstep passes onward,</p>\n<p class="slindent">Each one endeavours to outcry the other;</p></div>\n\n<div class="stanza"><p>The new-come people: &ldquo;Sodom and Gomorrah!&rdquo;</p>\n<p class="slindent">The rest: &ldquo;Into the cow Pasiphae enters,</p>\n<p class="slindent">So that the bull unto her lust may run!&rdquo;</p></div>\n\n<div class="stanza"><p>Then as the cranes, that to Riphaean mountains</p>\n<p class="slindent">Might fly in part, and part towards the sands,</p>\n<p class="slindent">These of the frost, those of the sun avoidant,</p></div>\n\n<div class="stanza"><p>One folk is going, and the other coming,</p>\n<p class="slindent">And weeping they return to their first songs,</p>\n<p class="slindent">And to the cry that most befitteth them;</p></div>\n\n<div class="stanza"><p>And close to me approached, even as before,</p>\n<p class="slindent">The very same who had entreated me,</p>\n<p class="slindent">Attent to listen in their countenance.</p></div>\n\n<div class="stanza"><p>I, who their inclination twice had seen,</p>\n<p class="slindent">Began: &ldquo;O souls secure in the possession,</p>\n<p class="slindent">Whene&rsquo;et it may be, of a state of peace,</p></div>\n\n<div class="stanza"><p>Neither unripe nor ripened have remained</p>\n<p class="slindent">My members upon earth, but here are with me</p>\n<p class="slindent">With their own blood and their articulations.</p></div>\n\n<div class="stanza"><p>I go up here to be no longer blind;</p>\n<p class="slindent">A Lady is above, who wins this grace,</p>\n<p class="slindent">Whereby the mortal through your world I bring.</p></div>\n\n<div class="stanza"><p>But as your greatest longing satisfied</p>\n<p class="slindent">May soon become, so that the Heaven may house you</p>\n<p class="slindent">Which full of love is, and most amply spreads,</p></div>\n\n<div class="stanza"><p>Tell me, that I again in books may write it,</p>\n<p class="slindent">Who are you, and what is that multitude</p>\n<p class="slindent">Which goes upon its way behind your backs?&rdquo;</p></div>\n\n<div class="stanza"><p>Not otherwise with wonder is bewildered</p>\n<p class="slindent">The mountaineer, and staring round is dumb,</p>\n<p class="slindent">When rough and rustic to the town he goes,</p></div>\n\n<div class="stanza"><p>Than every shade became in its appearance;</p>\n<p class="slindent">But when they of their stupor were disburdened,</p>\n<p class="slindent">Which in high hearts is quickly quieted,</p></div>\n\n<div class="stanza"><p>&ldquo;Blessed be thou, who of our border-lands,&rdquo;</p>\n<p class="slindent">He recommenced who first had questioned us,</p>\n<p class="slindent">&ldquo;Experience freightest for a better life.</p></div>\n\n<div class="stanza"><p>The folk that comes not with us have offended</p>\n<p class="slindent">In that for which once Caesar, triumphing,</p>\n<p class="slindent">Heard himself called in contumely, &lsquo;Queen.&rsquo;</p></div>\n\n<div class="stanza"><p>Therefore they separate, exclaiming, &lsquo;Sodom!&rsquo;</p>\n<p class="slindent">Themselves reproving, even as thou hast heard,</p>\n<p class="slindent">And add unto their burning by their shame.</p></div>\n\n<div class="stanza"><p>Our own transgression was hermaphrodite;</p>\n<p class="slindent">But because we observed not human law,</p>\n<p class="slindent">Following like unto beasts our appetite,</p></div>\n\n<div class="stanza"><p>In our opprobrium by us is read,</p>\n<p class="slindent">When we part company, the name of her</p>\n<p class="slindent">Who bestialized herself in bestial wood.</p></div>\n\n<div class="stanza"><p>Now knowest thou our acts, and what our crime was;</p>\n<p class="slindent">Wouldst thou perchance by name know who we are,</p>\n<p class="slindent">There is not time to tell, nor could I do it.</p></div>\n\n<div class="stanza"><p>Thy wish to know me shall in sooth be granted;</p>\n<p class="slindent">I&rsquo;m Guido Guinicelli, and now purge me,</p>\n<p class="slindent">Having repented ere the hour extreme.&rdquo;</p></div>\n\n<div class="stanza"><p>The same that in the sadness of Lycurgus</p>\n<p class="slindent">Two sons became, their mother re-beholding,</p>\n<p class="slindent">Such I became, but rise not to such height,</p></div>\n\n<div class="stanza"><p>The moment I heard name himself the father</p>\n<p class="slindent">Of me and of my betters, who had ever</p>\n<p class="slindent">Practised the sweet and gracious rhymes of love;</p></div>\n\n<div class="stanza"><p>And without speech and hearing thoughtfully</p>\n<p class="slindent">For a long time I went, beholding him,</p>\n<p class="slindent">Nor for the fire did I approach him nearer.</p></div>\n\n<div class="stanza"><p>When I was fed with looking, utterly</p>\n<p class="slindent">Myself I offered ready for his service,</p>\n<p class="slindent">With affirmation that compels belief.</p></div>\n\n<div class="stanza"><p>And he to me: &ldquo;Thou leavest footprints such</p>\n<p class="slindent">In me, from what I hear, and so distinct,</p>\n<p class="slindent">Lethe cannot efface them, nor make dim.</p></div>\n\n<div class="stanza"><p>But if thy words just now the truth have sworn,</p>\n<p class="slindent">Tell me what is the cause why thou displayest</p>\n<p class="slindent">In word and look that dear thou holdest me?&rdquo;</p></div>\n\n<div class="stanza"><p>And I to him: &ldquo;Those dulcet lays of yours</p>\n<p class="slindent">Which, long as shall endure our modern fashion,</p>\n<p class="slindent">Shall make for ever dear their very ink!&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;O brother,&rdquo; said he, &ldquo;he whom I point out,&rdquo;</p>\n<p class="slindent">And here he pointed at a spirit in front,</p>\n<p class="slindent">&ldquo;Was of the mother tongue a better smith.</p></div>\n\n<div class="stanza"><p>Verses of love and proses of romance,</p>\n<p class="slindent">He mastered all; and let the idiots talk,</p>\n<p class="slindent">Who think the Lemosin surpasses him.</p></div>\n\n<div class="stanza"><p>To clamour more than truth they turn their faces,</p>\n<p class="slindent">And in this way establish their opinion,</p>\n<p class="slindent">Ere art or reason has by them been heard.</p></div>\n\n<div class="stanza"><p>Thus many ancients with Guittone did,</p>\n<p class="slindent">From cry to cry still giving him applause,</p>\n<p class="slindent">Until the truth has conquered with most persons.</p></div>\n\n<div class="stanza"><p>Now, if thou hast such ample privilege</p>\n<p class="slindent">&rsquo;Tis granted thee to go unto the cloister</p>\n<p class="slindent">Wherein is Christ the abbot of the college,</p></div>\n\n<div class="stanza"><p>To him repeat for me a Paternoster,</p>\n<p class="slindent">So far as needful to us of this world,</p>\n<p class="slindent">Where power of sinning is no longer ours.&rdquo;</p></div>\n\n<div class="stanza"><p>Then, to give place perchance to one behind,</p>\n<p class="slindent">Whom he had near, he vanished in the fire</p>\n<p class="slindent">As fish in water going to the bottom.</p></div>\n\n<div class="stanza"><p>I moved a little tow&rsquo;rds him pointed out,</p>\n<p class="slindent">And said that to his name my own desire</p>\n<p class="slindent">An honourable place was making ready.</p></div>\n\n<div class="stanza"><p>He of his own free will began to say:</p>\n<p class="slindent">&lsquo;Tan m&rsquo; abellis vostre cortes deman,</p>\n<p class="slindent">Que jeu nom&rsquo; puesc ni vueill a vos cobrire;</p></div>\n\n<div class="stanza"><p>Jeu sui Arnaut, que plor e vai chantan;</p>\n<p class="slindent">Consiros vei la passada folor,</p>\n<p class="slindent">E vei jauzen lo jorn qu&rsquo; esper denan.</p></div>\n\n<div class="stanza"><p>Ara vus prec per aquella valor,</p>\n<p class="slindent">Que vus condus al som de la scalina,</p>\n<p class="slindent">Sovenga vus a temprar ma dolor.&rsquo;<span class="note">\n\t<span class="noteno">*</span>\n\t<span class="notetext">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;So pleases me your courteous demand,<br />\n\t&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;I cannot and I will not hide me from you.<br />\n\tI am Arnaut, who weep and singing go;<br />\n\t&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Contrite I see the folly of the past,<br />\n\t&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;And joyous see the hoped-for day before me.<br/>\n\tTherefore do I implore you, by that power<br />\n\t&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Which guides you to the summit of the stairs,<br />\n\t&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Be mindful to assuage my suffering!</span>\n</span></p></div>\n\n<div class="stanza"><p>Then hid him in the fire that purifies them.</p></div>','<p class="cantohead">Purgatorio: Canto XXVII</p>\n<div class="stanza"><p>As when he vibrates forth his earliest rays,</p>\n<p class="slindent">In regions where his Maker shed his blood,</p>\n<p class="slindent">(The Ebro falling under lofty Libra,</p></div>\n\n<div class="stanza"><p>And waters in the Ganges burnt with noon,)</p>\n<p class="slindent">So stood the Sun; hence was the day departing,</p>\n<p class="slindent">When the glad Angel of God appeared to us.</p></div>\n\n<div class="stanza"><p>Outside the flame he stood upon the verge,</p>\n<p class="slindent">And chanted forth, &ldquo;Beati mundo corde,&rdquo;</p>\n<p class="slindent">In voice by far more living than our own.</p></div>\n\n<div class="stanza"><p>Then: &ldquo;No one farther goes, souls sanctified,</p>\n<p class="slindent">If first the fire bite not; within it enter,</p>\n<p class="slindent">And be not deaf unto the song beyond.&rdquo;</p></div>\n\n<div class="stanza"><p>When we were close beside him thus he said;</p>\n<p class="slindent">Wherefore e&rsquo;en such became I, when I heard him,</p>\n<p class="slindent">As he is who is put into the grave.</p></div>\n\n<div class="stanza"><p>Upon my clasped hands I straightened me,</p>\n<p class="slindent">Scanning the fire, and vividly recalling</p>\n<p class="slindent">The human bodies I had once seen burned.</p></div>\n\n<div class="stanza"><p>Towards me turned themselves my good Conductors,</p>\n<p class="slindent">And unto me Virgilius said: &ldquo;My son,</p>\n<p class="slindent">Here may indeed be torment, but not death.</p></div>\n\n<div class="stanza"><p>Remember thee, remember! and if I</p>\n<p class="slindent">On Geryon have safely guided thee,</p>\n<p class="slindent">What shall I do now I am nearer God?</p></div>\n\n<div class="stanza"><p>Believe for certain, shouldst thou stand a full</p>\n<p class="slindent">Millennium in the bosom of this flame,</p>\n<p class="slindent">It could not make thee bald a single hair.</p></div>\n\n<div class="stanza"><p>And if perchance thou think that I deceive thee,</p>\n<p class="slindent">Draw near to it, and put it to the proof</p>\n<p class="slindent">With thine own hands upon thy garment&rsquo;s hem.</p></div>\n\n<div class="stanza"><p>Now lay aside, now lay aside all fear,</p>\n<p class="slindent">Turn hitherward, and onward come securely;&rdquo;</p>\n<p class="slindent">And I still motionless, and &rsquo;gainst my conscience!</p></div>\n\n<div class="stanza"><p>Seeing me stand still motionless and stubborn,</p>\n<p class="slindent">Somewhat disturbed he said: &ldquo;Now look thou, Son,</p>\n<p class="slindent">&rsquo;Twixt Beatrice and thee there is this wall.&rdquo;</p></div>\n\n<div class="stanza"><p>As at the name of Thisbe oped his lids</p>\n<p class="slindent">The dying Pyramus, and gazed upon her,</p>\n<p class="slindent">What time the mulberry became vermilion,</p></div>\n\n<div class="stanza"><p>Even thus, my obduracy being softened,</p>\n<p class="slindent">I turned to my wise Guide, hearing the name</p>\n<p class="slindent">That in my memory evermore is welling.</p></div>\n\n<div class="stanza"><p>Whereat he wagged his head, and said: &ldquo;How now?</p>\n<p class="slindent">Shall we stay on this side?&rdquo; then smiled as one</p>\n<p class="slindent">Does at a child who&rsquo;s vanquished by an apple.</p></div>\n\n<div class="stanza"><p>Then into the fire in front of me he entered,</p>\n<p class="slindent">Beseeching Statius to come after me,</p>\n<p class="slindent">Who a long way before divided us.</p></div>\n\n<div class="stanza"><p>When I was in it, into molten glass</p>\n<p class="slindent">I would have cast me to refresh myself,</p>\n<p class="slindent">So without measure was the burning there!</p></div>\n\n<div class="stanza"><p>And my sweet Father, to encourage me,</p>\n<p class="slindent">Discoursing still of Beatrice went on,</p>\n<p class="slindent">Saying: &ldquo;Her eyes I seem to see already!&rdquo;</p></div>\n\n<div class="stanza"><p>A voice, that on the other side was singing,</p>\n<p class="slindent">Directed us, and we, attent alone</p>\n<p class="slindent">On that, came forth where the ascent began.</p></div>\n\n<div class="stanza"><p>&ldquo;Venite, benedicti Patris mei,&rdquo;</p>\n<p class="slindent">Sounded within a splendour, which was there</p>\n<p class="slindent">Such it o&rsquo;etcame me, and I could not look.</p></div>\n\n<div class="stanza"><p>&ldquo;The sun departs,&rdquo; it added, &ldquo;and night cometh;</p>\n<p class="slindent">Tarry ye not, but onward urge your steps,</p>\n<p class="slindent">So long as yet the west becomes not dark.&rdquo;</p></div>\n\n<div class="stanza"><p>Straight forward through the rock the path ascended</p>\n<p class="slindent">In such a way that I cut off the rays</p>\n<p class="slindent">Before me of the sun, that now was low.</p></div>\n\n<div class="stanza"><p>And of few stairs we yet had made assay,</p>\n<p class="slindent">Ere by the vanished shadow the sun&rsquo;s setting</p>\n<p class="slindent">Behind us we perceived, I and my Sages.</p></div>\n\n<div class="stanza"><p>And ere in all its parts immeasurable</p>\n<p class="slindent">The horizon of one aspect had become,</p>\n<p class="slindent">And Night her boundless dispensation held,</p></div>\n\n<div class="stanza"><p>Each of us of a stair had made his bed;</p>\n<p class="slindent">Because the nature of the mount took from us</p>\n<p class="slindent">The power of climbing, more than the delight.</p></div>\n\n<div class="stanza"><p>Even as in ruminating passive grow</p>\n<p class="slindent">The goats, who have been swift and venturesome</p>\n<p class="slindent">Upon the mountain-tops ere they were fed,</p></div>\n\n<div class="stanza"><p>Hushed in the shadow, while the sun is hot,</p>\n<p class="slindent">Watched by the herdsman, who upon his staff</p>\n<p class="slindent">Is leaning, and in leaning tendeth them;</p></div>\n\n<div class="stanza"><p>And as the shepherd, lodging out of doors,</p>\n<p class="slindent">Passes the night beside his quiet flock,</p>\n<p class="slindent">Watching that no wild beast may scatter it,</p></div>\n\n<div class="stanza"><p>Such at that hour were we, all three of us,</p>\n<p class="slindent">I like the goat, and like the herdsmen they,</p>\n<p class="slindent">Begirt on this side and on that by rocks.</p></div>\n\n<div class="stanza"><p>Little could there be seen of things without;</p>\n<p class="slindent">But through that little I beheld the stars</p>\n<p class="slindent">More luminous and larger than their wont.</p></div>\n\n<div class="stanza"><p>Thus ruminating, and beholding these,</p>\n<p class="slindent">Sleep seized upon me,\u2014sleep, that oftentimes</p>\n<p class="slindent">Before a deed is done has tidings of it.</p></div>\n\n<div class="stanza"><p>It was the hour, I think, when from the East</p>\n<p class="slindent">First on the mountain Citherea beamed,</p>\n<p class="slindent">Who with the fire of love seems always burning;</p></div>\n\n<div class="stanza"><p>Youthful and beautiful in dreams methought</p>\n<p class="slindent">I saw a lady walking in a meadow,</p>\n<p class="slindent">Gathering flowers; and singing she was saying:</p></div>\n\n<div class="stanza"><p>&ldquo;Know whosoever may my name demand</p>\n<p class="slindent">That I am Leah, and go moving round</p>\n<p class="slindent">My beauteous hands to make myself a garland.</p></div>\n\n<div class="stanza"><p>To please me at the mirror, here I deck me,</p>\n<p class="slindent">But never does my sister Rachel leave</p>\n<p class="slindent">Her looking-glass, and sitteth all day long.</p></div>\n\n<div class="stanza"><p>To see her beauteous eyes as eager is she,</p>\n<p class="slindent">As I am to adorn me with my hands;</p>\n<p class="slindent">Her, seeing, and me, doing satisfies.&rdquo;</p></div>\n\n<div class="stanza"><p>And now before the antelucan splendours</p>\n<p class="slindent">That unto pilgrims the more grateful rise,</p>\n<p class="slindent">As, home-returning, less remote they lodge,</p></div>\n\n<div class="stanza"><p>The darkness fled away on every side,</p>\n<p class="slindent">And slumber with it; whereupon I rose,</p>\n<p class="slindent">Seeing already the great Masters risen.</p></div>\n\n<div class="stanza"><p>&ldquo;That apple sweet, which through so many branches</p>\n<p class="slindent">The care of mortals goeth in pursuit of,</p>\n<p class="slindent">To-day shall put in peace thy hungerings.&rdquo;</p></div>\n\n<div class="stanza"><p>Speaking to me, Virgilius of such words</p>\n<p class="slindent">As these made use; and never were there guerdons</p>\n<p class="slindent">That could in pleasantness compare with these.</p></div>\n\n<div class="stanza"><p>Such longing upon longing came upon me</p>\n<p class="slindent">To be above, that at each step thereafter</p>\n<p class="slindent">For flight I felt in me the pinions growing.</p></div>\n\n<div class="stanza"><p>When underneath us was the stairway all</p>\n<p class="slindent">Run o&rsquo;et, and we were on the highest step,</p>\n<p class="slindent">Virgilius fastened upon me his eyes,</p></div>\n\n<div class="stanza"><p>And said: &ldquo;The temporal fire and the eternal,</p>\n<p class="slindent">Son, thou hast seen, and to a place art come</p>\n<p class="slindent">Where of myself no farther I discern.</p></div>\n\n<div class="stanza"><p>By intellect and art I here have brought thee;</p>\n<p class="slindent">Take thine own pleasure for thy guide henceforth;</p>\n<p class="slindent">Beyond the steep ways and the narrow art thou.</p></div>\n\n<div class="stanza"><p>Behold the sun, that shines upon thy forehead;</p>\n<p class="slindent">Behold the grass, the flowerets, and the shrubs</p>\n<p class="slindent">Which of itself alone this land produces.</p></div>\n\n<div class="stanza"><p>Until rejoicing come the beauteous eyes</p>\n<p class="slindent">Which weeping caused me to come unto thee,</p>\n<p class="slindent">Thou canst sit down, and thou canst walk among them.</p></div>\n\n<div class="stanza"><p>Expect no more or word or sign from me;</p>\n<p class="slindent">Free and upright and sound is thy free-will,</p>\n<p class="slindent">And error were it not to do its bidding;</p></div>\n\n<div class="stanza"><p>Thee o&rsquo;et thyself I therefore crown and mitre!&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XXVIII</p>\n<div class="stanza"><p>Eager already to search in and round</p>\n<p class="slindent">The heavenly forest, dense and living-green,</p>\n<p class="slindent">Which tempered to the eyes the new-born day,</p></div>\n\n<div class="stanza"><p>Withouten more delay I left the bank,</p>\n<p class="slindent">Taking the level country slowly, slowly</p>\n<p class="slindent">Over the soil that everywhere breathes fragrance.</p></div>\n\n<div class="stanza"><p>A softly-breathing air, that no mutation</p>\n<p class="slindent">Had in itself, upon the forehead smote me</p>\n<p class="slindent">No heavier blow than of a gentle wind,</p></div>\n\n<div class="stanza"><p>Whereat the branches, lightly tremulous,</p>\n<p class="slindent">Did all of them bow downward toward that side</p>\n<p class="slindent">Where its first shadow casts the Holy Mountain;</p></div>\n\n<div class="stanza"><p>Yet not from their upright direction swayed,</p>\n<p class="slindent">So that the little birds upon their tops</p>\n<p class="slindent">Should leave the practice of each art of theirs;</p></div>\n\n<div class="stanza"><p>But with full ravishment the hours of prime,</p>\n<p class="slindent">Singing, received they in the midst of leaves,</p>\n<p class="slindent">That ever bore a burden to their rhymes,</p></div>\n\n<div class="stanza"><p>Such as from branch to branch goes gathering on</p>\n<p class="slindent">Through the pine forest on the shore of Chiassi,</p>\n<p class="slindent">When Eolus unlooses the Sirocco.</p></div>\n\n<div class="stanza"><p>Already my slow steps had carried me</p>\n<p class="slindent">Into the ancient wood so far, that I</p>\n<p class="slindent">Could not perceive where I had entered it.</p></div>\n\n<div class="stanza"><p>And lo! my further course a stream cut off,</p>\n<p class="slindent">Which tow&rsquo;rd the left hand with its little waves</p>\n<p class="slindent">Bent down the grass that on its margin sprang.</p></div>\n\n<div class="stanza"><p>All waters that on earth most limpid are</p>\n<p class="slindent">Would seem to have within themselves some mixture</p>\n<p class="slindent">Compared with that which nothing doth conceal,</p></div>\n\n<div class="stanza"><p>Although it moves on with a brown, brown current</p>\n<p class="slindent">Under the shade perpetual, that never</p>\n<p class="slindent">Ray of the sun lets in, nor of the moon.</p></div>\n\n<div class="stanza"><p>With feet I stayed, and with mine eyes I passed</p>\n<p class="slindent">Beyond the rivulet, to look upon</p>\n<p class="slindent">The great variety of the fresh may.</p></div>\n\n<div class="stanza"><p>And there appeared to me (even as appears</p>\n<p class="slindent">Suddenly something that doth turn aside</p>\n<p class="slindent">Through very wonder every other thought)</p></div>\n\n<div class="stanza"><p>A lady all alone, who went along</p>\n<p class="slindent">Singing and culling floweret after floweret,</p>\n<p class="slindent">With which her pathway was all painted over.</p></div>\n\n<div class="stanza"><p>&ldquo;Ah, beauteous lady, who in rays of love</p>\n<p class="slindent">Dost warm thyself, if I may trust to looks,</p>\n<p class="slindent">Which the heart&rsquo;s witnesses are wont to be,</p></div>\n\n<div class="stanza"><p>May the desire come unto thee to draw</p>\n<p class="slindent">Near to this river&rsquo;s bank,&rdquo; I said to her,</p>\n<p class="slindent">&ldquo;So much that I might hear what thou art singing.</p></div>\n\n<div class="stanza"><p>Thou makest me remember where and what</p>\n<p class="slindent">Proserpina that moment was when lost</p>\n<p class="slindent">Her mother her, and she herself the Spring.&rdquo;</p></div>\n\n<div class="stanza"><p>As turns herself, with feet together pressed</p>\n<p class="slindent">And to the ground, a lady who is dancing,</p>\n<p class="slindent">And hardly puts one foot before the other,</p></div>\n\n<div class="stanza"><p>On the vermilion and the yellow flowerets</p>\n<p class="slindent">She turned towards me, not in other wise</p>\n<p class="slindent">Than maiden who her modest eyes casts down;</p></div>\n\n<div class="stanza"><p>And my entreaties made to be content,</p>\n<p class="slindent">So near approaching, that the dulcet sound</p>\n<p class="slindent">Came unto me together with its meaning</p></div>\n\n<div class="stanza"><p>As soon as she was where the grasses are.</p>\n<p class="slindent">Bathed by the waters of the beauteous river,</p>\n<p class="slindent">To lift her eyes she granted me the boon.</p></div>\n\n<div class="stanza"><p>I do not think there shone so great a light</p>\n<p class="slindent">Under the lids of Venus, when transfixed</p>\n<p class="slindent">By her own son, beyond his usual custom!</p></div>\n\n<div class="stanza"><p>Erect upon the other bank she smiled,</p>\n<p class="slindent">Bearing full many colours in her hands,</p>\n<p class="slindent">Which that high land produces without seed.</p></div>\n\n<div class="stanza"><p>Apart three paces did the river make us;</p>\n<p class="slindent">But Hellespont, where Xerxes passed across,</p>\n<p class="slindent">(A curb still to all human arrogance,)</p></div>\n\n<div class="stanza"><p>More hatred from Leander did not suffer</p>\n<p class="slindent">For rolling between Sestos and Abydos,</p>\n<p class="slindent">Than that from me, because it oped not then.</p></div>\n\n<div class="stanza"><p>&ldquo;Ye are new-comers; and because I smile,&rdquo;</p>\n<p class="slindent">Began she, &ldquo;peradventure, in this place</p>\n<p class="slindent">Elect to human nature for its nest,</p></div>\n\n<div class="stanza"><p>Some apprehension keeps you marvelling;</p>\n<p class="slindent">But the psalm &lsquo;Delectasti&rsquo; giveth light</p>\n<p class="slindent">Which has the power to uncloud your intellect.</p></div>\n\n<div class="stanza"><p>And thou who foremost art, and didst entreat me,</p>\n<p class="slindent">Speak, if thou wouldst hear more; for I came ready</p>\n<p class="slindent">To all thy questionings, as far as needful.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;The water,&rdquo; said I, &ldquo;and the forest&rsquo;s sound,</p>\n<p class="slindent">Are combating within me my new faith</p>\n<p class="slindent">In something which I heard opposed to this.&rdquo;</p></div>\n\n<div class="stanza"><p>Whence she: &ldquo;I will relate how from its cause</p>\n<p class="slindent">Proceedeth that which maketh thee to wonder,</p>\n<p class="slindent">And purge away the cloud that smites upon thee.</p></div>\n\n<div class="stanza"><p>The Good Supreme, sole in itself delighting,</p>\n<p class="slindent">Created man good, and this goodly place</p>\n<p class="slindent">Gave him as hansel of eternal peace.</p></div>\n\n<div class="stanza"><p>By his default short while he sojourned here;</p>\n<p class="slindent">By his default to weeping and to toil</p>\n<p class="slindent">He changed his innocent laughter and sweet play.</p></div>\n\n<div class="stanza"><p>That the disturbance which below is made</p>\n<p class="slindent">By exhalations of the land and water,</p>\n<p class="slindent">(Which far as may be follow after heat,)</p></div>\n\n<div class="stanza"><p>Might not upon mankind wage any war,</p>\n<p class="slindent">This mount ascended tow&rsquo;rds the heaven so high,</p>\n<p class="slindent">And is exempt, from there where it is locked.</p></div>\n\n<div class="stanza"><p>Now since the universal atmosphere</p>\n<p class="slindent">Turns in a circuit with the primal motion</p>\n<p class="slindent">Unless the circle is broken on some side,</p></div>\n\n<div class="stanza"><p>Upon this height, that all is disengaged</p>\n<p class="slindent">In living ether, doth this motion strike</p>\n<p class="slindent">And make the forest sound, for it is dense;</p></div>\n\n<div class="stanza"><p>And so much power the stricken plant possesses</p>\n<p class="slindent">That with its virtue it impregns the air,</p>\n<p class="slindent">And this, revolving, scatters it around;</p></div>\n\n<div class="stanza"><p>And yonder earth, according as &rsquo;tis worthy</p>\n<p class="slindent">In self or in its clime, conceives and bears</p>\n<p class="slindent">Of divers qualities the divers trees;</p></div>\n\n<div class="stanza"><p>It should not seem a marvel then on earth,</p>\n<p class="slindent">This being heard, whenever any plant</p>\n<p class="slindent">Without seed manifest there taketh root.</p></div>\n\n<div class="stanza"><p>And thou must know, this holy table-land</p>\n<p class="slindent">In which thou art is full of every seed,</p>\n<p class="slindent">And fruit has in it never gathered there.</p></div>\n\n<div class="stanza"><p>The water which thou seest springs not from vein</p>\n<p class="slindent">Restored by vapour that the cold condenses,</p>\n<p class="slindent">Like to a stream that gains or loses breath;</p></div>\n\n<div class="stanza"><p>But issues from a fountain safe and certain,</p>\n<p class="slindent">Which by the will of God as much regains</p>\n<p class="slindent">As it discharges, open on two sides.</p></div>\n\n<div class="stanza"><p>Upon this side with virtue it descends,</p>\n<p class="slindent">Which takes away all memory of sin;</p>\n<p class="slindent">On that, of every good deed done restores it.</p></div>\n\n<div class="stanza"><p>Here Lethe, as upon the other side</p>\n<p class="slindent">Eunoe, it is called; and worketh not</p>\n<p class="slindent">If first on either side it be not tasted.</p></div>\n\n<div class="stanza"><p>This every other savour doth transcend;</p>\n<p class="slindent">And notwithstanding slaked so far may be</p>\n<p class="slindent">Thy thirst, that I reveal to thee no more,</p></div>\n\n<div class="stanza"><p>I&rsquo;ll give thee a corollary still in grace,</p>\n<p class="slindent">Nor think my speech will be to thee less dear</p>\n<p class="slindent">If it spread out beyond my promise to thee.</p></div>\n\n<div class="stanza"><p>Those who in ancient times have feigned in song</p>\n<p class="slindent">The Age of Gold and its felicity,</p>\n<p class="slindent">Dreamed of this place perhaps upon Parnassus.</p></div>\n\n<div class="stanza"><p>Here was the human race in innocence;</p>\n<p class="slindent">Here evermore was Spring, and every fruit;</p>\n<p class="slindent">This is the nectar of which each one speaks.&rdquo;</p></div>\n\n<div class="stanza"><p>Then backward did I turn me wholly round</p>\n<p class="slindent">Unto my Poets, and saw that with a smile</p>\n<p class="slindent">They had been listening to these closing words;</p></div>\n\n<div class="stanza"><p>Then to the beautiful lady turned mine eyes.</p></div>','<p class="cantohead">Purgatorio: Canto XXIX</p>\n<div class="stanza"><p>Singing like unto an enamoured lady</p>\n<p class="slindent">She, with the ending of her words, continued:</p>\n<p class="slindent">&ldquo;Beati quorum tecta sunt peccata.&rdquo;</p></div>\n\n<div class="stanza"><p>And even as Nymphs, that wandered all alone</p>\n<p class="slindent">Among the sylvan shadows, sedulous</p>\n<p class="slindent">One to avoid and one to see the sun,</p></div>\n\n<div class="stanza"><p>She then against the stream moved onward, going</p>\n<p class="slindent">Along the bank, and I abreast of her,</p>\n<p class="slindent">Her little steps with little steps attending.</p></div>\n\n<div class="stanza"><p>Between her steps and mine were not a hundred,</p>\n<p class="slindent">When equally the margins gave a turn,</p>\n<p class="slindent">In such a way, that to the East I faced.</p></div>\n\n<div class="stanza"><p>Nor even thus our way continued far</p>\n<p class="slindent">Before the lady wholly turned herself</p>\n<p class="slindent">Unto me, saying, &ldquo;Brother, look and listen!&rdquo;</p></div>\n\n<div class="stanza"><p>And lo! a sudden lustre ran across</p>\n<p class="slindent">On every side athwart the spacious forest,</p>\n<p class="slindent">Such that it made me doubt if it were lightning.</p></div>\n\n<div class="stanza"><p>But since the lightning ceases as it comes,</p>\n<p class="slindent">And that continuing brightened more and more,</p>\n<p class="slindent">Within my thought I said, &ldquo;What thing is this?&rdquo;</p></div>\n\n<div class="stanza"><p>And a delicious melody there ran</p>\n<p class="slindent">Along the luminous air, whence holy zeal</p>\n<p class="slindent">Made me rebuke the hardihood of Eve;</p></div>\n\n<div class="stanza"><p>For there where earth and heaven obedient were,</p>\n<p class="slindent">The woman only, and but just created,</p>\n<p class="slindent">Could not endure to stay &rsquo;neath any veil;</p></div>\n\n<div class="stanza"><p>Underneath which had she devoutly stayed,</p>\n<p class="slindent">I sooner should have tasted those delights</p>\n<p class="slindent">Ineffable, and for a longer time.</p></div>\n\n<div class="stanza"><p>While &rsquo;mid such manifold first-fruits I walked</p>\n<p class="slindent">Of the eternal pleasure all enrapt,</p>\n<p class="slindent">And still solicitous of more delights,</p></div>\n\n<div class="stanza"><p>In front of us like an enkindled fire</p>\n<p class="slindent">Became the air beneath the verdant boughs,</p>\n<p class="slindent">And the sweet sound as singing now was heard.</p></div>\n\n<div class="stanza"><p>O Virgins sacrosanct! if ever hunger,</p>\n<p class="slindent">Vigils, or cold for you I have endured,</p>\n<p class="slindent">The occasion spurs me their reward to claim!</p></div>\n\n<div class="stanza"><p>Now Helicon must needs pour forth for me,</p>\n<p class="slindent">And with her choir Urania must assist me,</p>\n<p class="slindent">To put in verse things difficult to think.</p></div>\n\n<div class="stanza"><p>A little farther on, seven trees of gold</p>\n<p class="slindent">In semblance the long space still intervening</p>\n<p class="slindent">Between ourselves and them did counterfeit;</p></div>\n\n<div class="stanza"><p>But when I had approached so near to them</p>\n<p class="slindent">The common object, which the sense deceives,</p>\n<p class="slindent">Lost not by distance any of its marks,</p></div>\n\n<div class="stanza"><p>The faculty that lends discourse to reason</p>\n<p class="slindent">Did apprehend that they were candlesticks,</p>\n<p class="slindent">And in the voices of the song &ldquo;Hosanna!&rdquo;</p></div>\n\n<div class="stanza"><p>Above them flamed the harness beautiful,</p>\n<p class="slindent">Far brighter than the moon in the serene</p>\n<p class="slindent">Of midnight, at the middle of her month.</p></div>\n\n<div class="stanza"><p>I turned me round, with admiration filled,</p>\n<p class="slindent">To good Virgilius, and he answered me</p>\n<p class="slindent">With visage no less full of wonderment.</p></div>\n\n<div class="stanza"><p>Then back I turned my face to those high things,</p>\n<p class="slindent">Which moved themselves towards us so sedately,</p>\n<p class="slindent">They had been distanced by new-wedded brides.</p></div>\n\n<div class="stanza"><p>The lady chid me: &ldquo;Why dost thou burn only</p>\n<p class="slindent">So with affection for the living lights,</p>\n<p class="slindent">And dost not look at what comes after them?&rdquo;</p></div>\n\n<div class="stanza"><p>Then saw I people, as behind their leaders,</p>\n<p class="slindent">Coming behind them, garmented in white,</p>\n<p class="slindent">And such a whiteness never was on earth.</p></div>\n\n<div class="stanza"><p>The water on my left flank was resplendent,</p>\n<p class="slindent">And back to me reflected my left side,</p>\n<p class="slindent">E&rsquo;en as a mirror, if I looked therein.</p></div>\n\n<div class="stanza"><p>When I upon my margin had such post</p>\n<p class="slindent">That nothing but the stream divided us,</p>\n<p class="slindent">Better to see I gave my steps repose;</p></div>\n\n<div class="stanza"><p>And I beheld the flamelets onward go,</p>\n<p class="slindent">Leaving behind themselves the air depicted,</p>\n<p class="slindent">And they of trailing pennons had the semblance,</p></div>\n\n<div class="stanza"><p>So that it overhead remained distinct</p>\n<p class="slindent">With sevenfold lists, all of them of the colours</p>\n<p class="slindent">Whence the sun&rsquo;s bow is made, and Delia&rsquo;s girdle.</p></div>\n\n<div class="stanza"><p>These standards to the rearward longer were</p>\n<p class="slindent">Than was my sight; and, as it seemed to me,</p>\n<p class="slindent">Ten paces were the outermost apart.</p></div>\n\n<div class="stanza"><p>Under so fair a heaven as I describe</p>\n<p class="slindent">The four and twenty Elders, two by two,</p>\n<p class="slindent">Came on incoronate with flower-de-luce.</p></div>\n\n<div class="stanza"><p>They all of them were singing: &ldquo;Blessed thou</p>\n<p class="slindent">Among the daughters of Adam art, and blessed</p>\n<p class="slindent">For evermore shall be thy loveliness.&rdquo;</p></div>\n\n<div class="stanza"><p>After the flowers and other tender grasses</p>\n<p class="slindent">In front of me upon the other margin</p>\n<p class="slindent">Were disencumbered of that race elect,</p></div>\n\n<div class="stanza"><p>Even as in heaven star followeth after star,</p>\n<p class="slindent">There came close after them four animals,</p>\n<p class="slindent">Incoronate each one with verdant leaf.</p></div>\n\n<div class="stanza"><p>Plumed with six wings was every one of them,</p>\n<p class="slindent">The plumage full of eyes; the eyes of Argus</p>\n<p class="slindent">If they were living would be such as these.</p></div>\n\n<div class="stanza"><p>Reader! to trace their forms no more I waste</p>\n<p class="slindent">My rhymes; for other spendings press me so,</p>\n<p class="slindent">That I in this cannot be prodigal.</p></div>\n\n<div class="stanza"><p>But read Ezekiel, who depicteth them</p>\n<p class="slindent">As he beheld them from the region cold</p>\n<p class="slindent">Coming with cloud, with whirlwind, and with fire;</p></div>\n\n<div class="stanza"><p>And such as thou shalt find them in his pages,</p>\n<p class="slindent">Such were they here; saving that in their plumage</p>\n<p class="slindent">John is with me, and differeth from him.</p></div>\n\n<div class="stanza"><p>The interval between these four contained</p>\n<p class="slindent">A chariot triumphal on two wheels,</p>\n<p class="slindent">Which by a Griffin&rsquo;s neck came drawn along;</p></div>\n\n<div class="stanza"><p>And upward he extended both his wings</p>\n<p class="slindent">Between the middle list and three and three,</p>\n<p class="slindent">So that he injured none by cleaving it.</p></div>\n\n<div class="stanza"><p>So high they rose that they were lost to sight;</p>\n<p class="slindent">His limbs were gold, so far as he was bird,</p>\n<p class="slindent">And white the others with vermilion mingled.</p></div>\n\n<div class="stanza"><p>Not only Rome with no such splendid car</p>\n<p class="slindent">E&rsquo;et gladdened Africanus, or Augustus,</p>\n<p class="slindent">But poor to it that of the Sun would be,\u2014</p></div>\n\n<div class="stanza"><p>That of the Sun, which swerving was burnt up</p>\n<p class="slindent">At the importunate orison of Earth,</p>\n<p class="slindent">When Jove was so mysteriously just.</p></div>\n\n<div class="stanza"><p>Three maidens at the right wheel in a circle</p>\n<p class="slindent">Came onward dancing; one so very red</p>\n<p class="slindent">That in the fire she hardly had been noted.</p></div>\n\n<div class="stanza"><p>The second was as if her flesh and bones</p>\n<p class="slindent">Had all been fashioned out of emerald;</p>\n<p class="slindent">The third appeared as snow but newly fallen.</p></div>\n\n<div class="stanza"><p>And now they seemed conducted by the white,</p>\n<p class="slindent">Now by the red, and from the song of her</p>\n<p class="slindent">The others took their step, or slow or swift.</p></div>\n\n<div class="stanza"><p>Upon the left hand four made holiday</p>\n<p class="slindent">Vested in purple, following the measure</p>\n<p class="slindent">Of one of them with three eyes m her head.</p></div>\n\n<div class="stanza"><p>In rear of all the group here treated of</p>\n<p class="slindent">Two old men I beheld, unlike in habit,</p>\n<p class="slindent">But like in gait, each dignified and grave.</p></div>\n\n<div class="stanza"><p>One showed himself as one of the disciples</p>\n<p class="slindent">Of that supreme Hippocrates, whom nature</p>\n<p class="slindent">Made for the animals she holds most dear;</p></div>\n\n<div class="stanza"><p>Contrary care the other manifested,</p>\n<p class="slindent">With sword so shining and so sharp, it caused</p>\n<p class="slindent">Terror to me on this side of the river.</p></div>\n\n<div class="stanza"><p>Thereafter four I saw of humble aspect,</p>\n<p class="slindent">And behind all an aged man alone</p>\n<p class="slindent">Walking in sleep with countenance acute.</p></div>\n\n<div class="stanza"><p>And like the foremost company these seven</p>\n<p class="slindent">Were habited; yet of the flower-de-luce</p>\n<p class="slindent">No garland round about the head they wore,</p></div>\n\n<div class="stanza"><p>But of the rose, and other flowers vermilion;</p>\n<p class="slindent">At little distance would the sight have sworn</p>\n<p class="slindent">That all were in a flame above their brows.</p></div>\n\n<div class="stanza"><p>And when the car was opposite to me</p>\n<p class="slindent">Thunder was heard; and all that folk august</p>\n<p class="slindent">Seemed to have further progress interdicted,</p></div>\n\n<div class="stanza"><p>There with the vanward ensigns standing still.</p></div>','<p class="cantohead">Purgatorio: Canto XXX</p>\n<div class="stanza"><p>When the Septentrion of the highest heaven</p>\n<p class="slindent">(Which never either setting knew or rising,</p>\n<p class="slindent">Nor veil of other cloud than that of sin,</p></div>\n\n<div class="stanza"><p>And which made every one therein aware</p>\n<p class="slindent">Of his own duty, as the lower makes</p>\n<p class="slindent">Whoever turns the helm to come to port)</p></div>\n\n<div class="stanza"><p>Motionless halted, the veracious people,</p>\n<p class="slindent">That came at first between it and the Griffin,</p>\n<p class="slindent">Turned themselves to the car, as to their peace.</p></div>\n\n<div class="stanza"><p>And one of them, as if by Heaven commissioned,</p>\n<p class="slindent">Singing, &ldquo;Veni, sponsa, de Libano&rdquo;</p>\n<p class="slindent">Shouted three times, and all the others after.</p></div>\n\n<div class="stanza"><p>Even as the Blessed at the final summons</p>\n<p class="slindent">Shall rise up quickened each one from his cavern,</p>\n<p class="slindent">Uplifting light the reinvested flesh,</p></div>\n\n<div class="stanza"><p>So upon that celestial chariot</p>\n<p class="slindent">A hundred rose &lsquo;ad vocem tanti senis,&rsquo;</p>\n<p class="slindent">Ministers and messengers of life eternal.</p></div>\n\n<div class="stanza"><p>They all were saying, &ldquo;Benedictus qui venis,&rdquo;</p>\n<p class="slindent">And, scattering flowers above and round about,</p>\n<p class="slindent">&ldquo;Manibus o date lilia plenis.&rdquo;</p></div>\n\n<div class="stanza"><p>Ere now have I beheld, as day began,</p>\n<p class="slindent">The eastern hemisphere all tinged with rose,</p>\n<p class="slindent">And the other heaven with fair serene adorned;</p></div>\n\n<div class="stanza"><p>And the sun&rsquo;s face, uprising, overshadowed</p>\n<p class="slindent">So that by tempering influence of vapours</p>\n<p class="slindent">For a long interval the eye sustained it;</p></div>\n\n<div class="stanza"><p>Thus in the bosom of a cloud of flowers</p>\n<p class="slindent">Which from those hands angelical ascended,</p>\n<p class="slindent">And downward fell again inside and out,</p></div>\n\n<div class="stanza"><p>Over her snow-white veil with olive cinct</p>\n<p class="slindent">Appeared a lady under a green mantle,</p>\n<p class="slindent">Vested in colour of the living flame.</p></div>\n\n<div class="stanza"><p>And my own spirit, that already now</p>\n<p class="slindent">So long a time had been, that in her presence</p>\n<p class="slindent">Trembling with awe it had not stood abashed,</p></div>\n\n<div class="stanza"><p>Without more knowledge having by mine eyes,</p>\n<p class="slindent">Through occult virtue that from her proceeded</p>\n<p class="slindent">Of ancient love the mighty influence felt.</p></div>\n\n<div class="stanza"><p>As soon as on my vision smote the power</p>\n<p class="slindent">Sublime, that had already pierced me through</p>\n<p class="slindent">Ere from my boyhood I had yet come forth,</p></div>\n\n<div class="stanza"><p>To the left hand I turned with that reliance</p>\n<p class="slindent">With which the little child runs to his mother,</p>\n<p class="slindent">When he has fear, or when he is afflicted,</p></div>\n\n<div class="stanza"><p>To say unto Virgilius: &ldquo;Not a drachm</p>\n<p class="slindent">Of blood remains in me, that does not tremble;</p>\n<p class="slindent">I know the traces of the ancient flame.&rdquo;</p></div>\n\n<div class="stanza"><p>But us Virgilius of himself deprived</p>\n<p class="slindent">Had left, Virgilius, sweetest of all fathers,</p>\n<p class="slindent">Virgilius, to whom I for safety gave me:</p></div>\n\n<div class="stanza"><p>Nor whatsoever lost the ancient mother</p>\n<p class="slindent">Availed my cheeks now purified from dew,</p>\n<p class="slindent">That weeping they should not again be darkened.</p></div>\n\n<div class="stanza"><p>&ldquo;Dante, because Virgilius has departed</p>\n<p class="slindent">Do not weep yet, do not weep yet awhile;</p>\n<p class="slindent">For by another sword thou need&rsquo;st must weep.&rdquo;</p></div>\n\n<div class="stanza"><p>E&rsquo;en as an admiral, who on poop and prow</p>\n<p class="slindent">Comes to behold the people that are working</p>\n<p class="slindent">In other ships, and cheers them to well-doing,</p></div>\n\n<div class="stanza"><p>Upon the left hand border of the car,</p>\n<p class="slindent">When at the sound I turned of my own name,</p>\n<p class="slindent">Which of necessity is here recorded,</p></div>\n\n<div class="stanza"><p>I saw the Lady, who erewhile appeared</p>\n<p class="slindent">Veiled underneath the angelic festival,</p>\n<p class="slindent">Direct her eyes to me across the river.</p></div>\n\n<div class="stanza"><p>Although the veil, that from her head descended,</p>\n<p class="slindent">Encircled with the foliage of Minerva,</p>\n<p class="slindent">Did not permit her to appear distinctly,</p></div>\n\n<div class="stanza"><p>In attitude still royally majestic</p>\n<p class="slindent">Continued she, like unto one who speaks,</p>\n<p class="slindent">And keeps his warmest utterance in reserve:</p></div>\n\n<div class="stanza"><p>&ldquo;Look at me well; in sooth I&rsquo;m Beatrice!</p>\n<p class="slindent">How didst thou deign to come unto the Mountain?</p>\n<p class="slindent">Didst thou not know that man is happy here?&rdquo;</p></div>\n\n<div class="stanza"><p>Mine eyes fell downward into the clear fountain,</p>\n<p class="slindent">But, seeing myself therein, I sought the grass,</p>\n<p class="slindent">So great a shame did weigh my forehead down.</p></div>\n\n<div class="stanza"><p>As to the son the mother seems superb,</p>\n<p class="slindent">So she appeared to me; for somewhat bitter</p>\n<p class="slindent">Tasteth the savour of severe compassion.</p></div>\n\n<div class="stanza"><p>Silent became she, and the Angels sang</p>\n<p class="slindent">Suddenly, &ldquo;In te, Domine, speravi:&rdquo;</p>\n<p class="slindent">But beyond &lsquo;pedes meos&rsquo; did not pass.</p></div>\n\n<div class="stanza"><p>Even as the snow among the living rafters</p>\n<p class="slindent">Upon the back of Italy congeals,</p>\n<p class="slindent">Blown on and drifted by Sclavonian winds,</p></div>\n\n<div class="stanza"><p>And then, dissolving, trickles through itself</p>\n<p class="slindent">Whene&rsquo;et the land that loses shadow breathes,</p>\n<p class="slindent">So that it seems a fire that melts a taper;</p></div>\n\n<div class="stanza"><p>E&rsquo;en thus was I without a tear or sigh,</p>\n<p class="slindent">Before the song of those who sing for ever</p>\n<p class="slindent">After the music of the eternal spheres.</p></div>\n\n<div class="stanza"><p>But when I heard in their sweet melodies</p>\n<p class="slindent">Compassion for me, more than had they said,</p>\n<p class="slindent">&ldquo;O wherefore, lady, dost thou thus upbraid him?&rdquo;</p></div>\n\n<div class="stanza"><p>The ice, that was about my heart congealed,</p>\n<p class="slindent">To air and water changed, and in my anguish</p>\n<p class="slindent">Through mouth and eyes came gushing from my breast.</p></div>\n\n<div class="stanza"><p>She, on the right-hand border of the car</p>\n<p class="slindent">Still firmly standing, to those holy beings</p>\n<p class="slindent">Thus her discourse directed afterwards:</p></div>\n\n<div class="stanza"><p>&ldquo;Ye keep your watch in the eternal day,</p>\n<p class="slindent">So that nor night nor sleep can steal from you</p>\n<p class="slindent">One step the ages make upon their path;</p></div>\n\n<div class="stanza"><p>Therefore my answer is with greater care,</p>\n<p class="slindent">That he may hear me who is weeping yonder,</p>\n<p class="slindent">So that the sin and dole be of one measure.</p></div>\n\n<div class="stanza"><p>Not only by the work of those great wheels,</p>\n<p class="slindent">That destine every seed unto some end,</p>\n<p class="slindent">According as the stars are in conjunction,</p></div>\n\n<div class="stanza"><p>But by the largess of celestial graces,</p>\n<p class="slindent">Which have such lofty vapours for their rain</p>\n<p class="slindent">That near to them our sight approaches not,</p></div>\n\n<div class="stanza"><p>Such had this man become in his new life</p>\n<p class="slindent">Potentially, that every righteous habit</p>\n<p class="slindent">Would have made admirable proof in him;</p></div>\n\n<div class="stanza"><p>But so much more malignant and more savage</p>\n<p class="slindent">Becomes the land untilled and with bad seed,</p>\n<p class="slindent">The more good earthly vigour it possesses.</p></div>\n\n<div class="stanza"><p>Some time did I sustain him with my look;</p>\n<p class="slindent">Revealing unto him my youthful eyes,</p>\n<p class="slindent">I led him with me turned in the right way.</p></div>\n\n<div class="stanza"><p>As soon as ever of my second age</p>\n<p class="slindent">I was upon the threshold and changed life,</p>\n<p class="slindent">Himself from me he took and gave to others.</p></div>\n\n<div class="stanza"><p>When from the flesh to spirit I ascended,</p>\n<p class="slindent">And beauty and virtue were in me increased,</p>\n<p class="slindent">I was to him less dear and less delightful;</p></div>\n\n<div class="stanza"><p>And into ways untrue he turned his steps,</p>\n<p class="slindent">Pursuing the false images of good,</p>\n<p class="slindent">That never any promises fulfil;</p></div>\n\n<div class="stanza"><p>Nor prayer for inspiration me availed,</p>\n<p class="slindent">By means of which in dreams and otherwise</p>\n<p class="slindent">I called him back, so little did he heed them.</p></div>\n\n<div class="stanza"><p>So low he fell, that all appliances</p>\n<p class="slindent">For his salvation were already short,</p>\n<p class="slindent">Save showing him the people of perdition.</p></div>\n\n<div class="stanza"><p>For this I visited the gates of death,</p>\n<p class="slindent">And unto him, who so far up has led him,</p>\n<p class="slindent">My intercessions were with weeping borne.</p></div>\n\n<div class="stanza"><p>God&rsquo;s lofty fiat would be violated,</p>\n<p class="slindent">If Lethe should be passed, and if such viands</p>\n<p class="slindent">Should tasted be, withouten any scot</p></div>\n\n<div class="stanza"><p>Of penitence, that gushes forth in tears.&rdquo;</p></div>','<p class="cantohead">Purgatorio: Canto XXXI</p>\n<div class="stanza"><p>&ldquo;O thou who art beyond the sacred river,&rdquo;</p>\n<p class="slindent">Turning to me the point of her discourse,</p>\n<p class="slindent">That edgewise even had seemed to me so keen,</p></div>\n\n<div class="stanza"><p>She recommenced, continuing without pause,</p>\n<p class="slindent">&ldquo;Say, say if this be true; to such a charge,</p>\n<p class="slindent">Thy own confession needs must be conjoined.&rdquo;</p></div>\n\n<div class="stanza"><p>My faculties were in so great confusion,</p>\n<p class="slindent">That the voice moved, but sooner was extinct</p>\n<p class="slindent">Than by its organs it was set at large.</p></div>\n\n<div class="stanza"><p>Awhile she waited; then she said: &ldquo;What thinkest?</p>\n<p class="slindent">Answer me; for the mournful memories</p>\n<p class="slindent">In thee not yet are by the waters injured.&rdquo;</p></div>\n\n<div class="stanza"><p>Confusion and dismay together mingled</p>\n<p class="slindent">Forced such a Yes! from out my mouth, that sight</p>\n<p class="slindent">Was needful to the understanding of it.</p></div>\n\n<div class="stanza"><p>Even as a cross-bow breaks, when &rsquo;tis discharged</p>\n<p class="slindent">Too tensely drawn the bowstring and the bow,</p>\n<p class="slindent">And with less force the arrow hits the mark,</p></div>\n\n<div class="stanza"><p>So I gave way beneath that heavy burden,</p>\n<p class="slindent">Outpouring in a torrent tears and sighs,</p>\n<p class="slindent">And the voice flagged upon its passage forth.</p></div>\n\n<div class="stanza"><p>Whence she to me: &ldquo;In those desires of mine</p>\n<p class="slindent">Which led thee to the loving of that good,</p>\n<p class="slindent">Beyond which there is nothing to aspire to,</p></div>\n\n<div class="stanza"><p>What trenches lying traverse or what chains</p>\n<p class="slindent">Didst thou discover, that of passing onward</p>\n<p class="slindent">Thou shouldst have thus despoiled thee of the hope?</p></div>\n\n<div class="stanza"><p>And what allurements or what vantages</p>\n<p class="slindent">Upon the forehead of the others showed,</p>\n<p class="slindent">That thou shouldst turn thy footsteps unto them?&rdquo;</p></div>\n\n<div class="stanza"><p>After the heaving of a bitter sigh,</p>\n<p class="slindent">Hardly had I the voice to make response,</p>\n<p class="slindent">And with fatigue my lips did fashion it.</p></div>\n\n<div class="stanza"><p>Weeping I said: &ldquo;The things that present were</p>\n<p class="slindent">With their false pleasure turned aside my steps,</p>\n<p class="slindent">Soon as your countenance concealed itself.&rdquo;</p></div>\n\n<div class="stanza"><p>And she: &ldquo;Shouldst thou be silent, or deny</p>\n<p class="slindent">What thou confessest, not less manifest</p>\n<p class="slindent">Would be thy fault, by such a Judge &rsquo;tis known.</p></div>\n\n<div class="stanza"><p>But when from one&rsquo;s own cheeks comes bursting forth</p>\n<p class="slindent">The accusal of the sin, in our tribunal</p>\n<p class="slindent">Against the edge the wheel doth turn itself.</p></div>\n\n<div class="stanza"><p>But still, that thou mayst feel a greater shame</p>\n<p class="slindent">For thy transgression, and another time</p>\n<p class="slindent">Hearing the Sirens thou mayst be more strong,</p></div>\n\n<div class="stanza"><p>Cast down the seed of weeping and attend;</p>\n<p class="slindent">So shalt thou hear, how in an opposite way</p>\n<p class="slindent">My buried flesh should have directed thee.</p></div>\n\n<div class="stanza"><p>Never to thee presented art or nature</p>\n<p class="slindent">Pleasure so great as the fair limbs wherein</p>\n<p class="slindent">I was enclosed, which scattered are in earth.</p></div>\n\n<div class="stanza"><p>And if the highest pleasure thus did fail thee</p>\n<p class="slindent">By reason of my death, what mortal thing</p>\n<p class="slindent">Should then have drawn thee into its desire?</p></div>\n\n<div class="stanza"><p>Thou oughtest verily at the first shaft</p>\n<p class="slindent">Of things fallacious to have risen up</p>\n<p class="slindent">To follow me, who was no longer such.</p></div>\n\n<div class="stanza"><p>Thou oughtest not to have stooped thy pinions downward</p>\n<p class="slindent">To wait for further blows, or little girl,</p>\n<p class="slindent">Or other vanity of such brief use.</p></div>\n\n<div class="stanza"><p>The callow birdlet waits for two or three,</p>\n<p class="slindent">But to the eyes of those already fledged,</p>\n<p class="slindent">In vain the net is spread or shaft is shot.&rdquo;</p></div>\n\n<div class="stanza"><p>Even as children silent in their shame</p>\n<p class="slindent">Stand listening with their eyes upon the ground,</p>\n<p class="slindent">And conscious of their fault, and penitent;</p></div>\n\n<div class="stanza"><p>So was I standing; and she said: &ldquo;If thou</p>\n<p class="slindent">In hearing sufferest pain, lift up thy beard</p>\n<p class="slindent">And thou shalt feel a greater pain in seeing.&rdquo;</p></div>\n\n<div class="stanza"><p>With less resistance is a robust holm</p>\n<p class="slindent">Uprooted, either by a native wind</p>\n<p class="slindent">Or else by that from regions of Iarbas,</p></div>\n\n<div class="stanza"><p>Than I upraised at her command my chin;</p>\n<p class="slindent">And when she by the beard the face demanded,</p>\n<p class="slindent">Well I perceived the venom of her meaning.</p></div>\n\n<div class="stanza"><p>And as my countenance was lifted up,</p>\n<p class="slindent">Mine eye perceived those creatures beautiful</p>\n<p class="slindent">Had rested from the strewing of the flowers;</p></div>\n\n<div class="stanza"><p>And, still but little reassured, mine eyes</p>\n<p class="slindent">Saw Beatrice turned round towards the monster,</p>\n<p class="slindent">That is one person only in two natures.</p></div>\n\n<div class="stanza"><p>Beneath her veil, beyond the margent green,</p>\n<p class="slindent">She seemed to me far more her ancient self</p>\n<p class="slindent">To excel, than others here, when she was here.</p></div>\n\n<div class="stanza"><p>So pricked me then the thorn of penitence,</p>\n<p class="slindent">That of all other things the one which turned me</p>\n<p class="slindent">Most to its love became the most my foe.</p></div>\n\n<div class="stanza"><p>Such self-conviction stung me at the heart</p>\n<p class="slindent">O&rsquo;etpowered I fell, and what I then became</p>\n<p class="slindent">She knoweth who had furnished me the cause.</p></div>\n\n<div class="stanza"><p>Then, when the heart restored my outward sense,</p>\n<p class="slindent">The lady I had found alone, above me</p>\n<p class="slindent">I saw, and she was saying, &ldquo;Hold me, hold me.&rdquo;</p></div>\n\n<div class="stanza"><p>Up to my throat she in the stream had drawn me,</p>\n<p class="slindent">And, dragging me behind her, she was moving</p>\n<p class="slindent">Upon the water lightly as a shuttle.</p></div>\n\n<div class="stanza"><p>When I was near unto the blessed shore,</p>\n<p class="slindent">&ldquo;Asperges me,&rdquo; I heard so sweetly sung,</p>\n<p class="slindent">Remember it I cannot, much less write it.</p></div>\n\n<div class="stanza"><p>The beautiful lady opened wide her arms,</p>\n<p class="slindent">Embraced my head, and plunged me underneath,</p>\n<p class="slindent">Where I was forced to swallow of the water.</p></div>\n\n<div class="stanza"><p>Then forth she drew me, and all dripping brought</p>\n<p class="slindent">Into the dance of the four beautiful,</p>\n<p class="slindent">And each one with her arm did cover me.</p></div>\n\n<div class="stanza"><p>&rsquo;We here are Nymphs, and in the Heaven are stars;</p>\n<p class="slindent">Ere Beatrice descended to the world,</p>\n<p class="slindent">We as her handmaids were appointed her.</p></div>\n\n<div class="stanza"><p>We&rsquo;ll lead thee to her eyes; but for the pleasant</p>\n<p class="slindent">Light that within them is, shall sharpen thine</p>\n<p class="slindent">The three beyond, who more profoundly look.&rsquo;</p></div>\n\n<div class="stanza"><p>Thus singing they began; and afterwards</p>\n<p class="slindent">Unto the Griffin&rsquo;s breast they led me with them,</p>\n<p class="slindent">Where Beatrice was standing, turned towards us.</p></div>\n\n<div class="stanza"><p>&ldquo;See that thou dost not spare thine eyes,&rdquo; they said;</p>\n<p class="slindent">&ldquo;Before the emeralds have we stationed thee,</p>\n<p class="slindent">Whence Love aforetime drew for thee his weapons.&rdquo;</p></div>\n\n<div class="stanza"><p>A thousand longings, hotter than the flame,</p>\n<p class="slindent">Fastened mine eyes upon those eyes relucent,</p>\n<p class="slindent">That still upon the Griffin steadfast stayed.</p></div>\n\n<div class="stanza"><p>As in a glass the sun, not otherwise</p>\n<p class="slindent">Within them was the twofold monster shining,</p>\n<p class="slindent">Now with the one, now with the other nature.</p></div>\n\n<div class="stanza"><p>Think, Reader, if within myself I marvelled,</p>\n<p class="slindent">When I beheld the thing itself stand still,</p>\n<p class="slindent">And in its image it transformed itself.</p></div>\n\n<div class="stanza"><p>While with amazement filled and jubilant,</p>\n<p class="slindent">My soul was tasting of the food, that while</p>\n<p class="slindent">It satisfies us makes us hunger for it,</p></div>\n\n<div class="stanza"><p>Themselves revealing of the highest rank</p>\n<p class="slindent">In bearing, did the other three advance,</p>\n<p class="slindent">Singing to their angelic saraband.</p></div>\n\n<div class="stanza"><p>&ldquo;Turn, Beatrice, O turn thy holy eyes,&rdquo;</p>\n<p class="slindent">Such was their song, &ldquo;unto thy faithful one,</p>\n<p class="slindent">Who has to see thee ta&rsquo;en so many steps.</p></div>\n\n<div class="stanza"><p>In grace do us the grace that thou unveil</p>\n<p class="slindent">Thy face to him, so that he may discern</p>\n<p class="slindent">The second beauty which thou dost conceal.&rdquo;</p></div>\n\n<div class="stanza"><p>O splendour of the living light eternal!</p>\n<p class="slindent">Who underneath the shadow of Parnassus</p>\n<p class="slindent">Has grown so pale, or drunk so at its cistern,</p></div>\n\n<div class="stanza"><p>He would not seem to have his mind encumbered</p>\n<p class="slindent">Striving to paint thee as thou didst appear,</p>\n<p class="slindent">Where the harmonious heaven o&rsquo;etshadowed thee,</p></div>\n\n<div class="stanza"><p>When in the open air thou didst unveil?</p></div>','<p class="cantohead">Purgatorio: Canto XXXII</p>\n<div class="stanza"><p>So steadfast and attentive were mine eyes</p>\n<p class="slindent">In satisfying their decennial thirst,</p>\n<p class="slindent">That all my other senses were extinct,</p></div>\n\n<div class="stanza"><p>And upon this side and on that they had</p>\n<p class="slindent">Walls of indifference, so the holy smile</p>\n<p class="slindent">Drew them unto itself with the old net</p></div>\n\n<div class="stanza"><p>When forcibly my sight was turned away</p>\n<p class="slindent">Towards my left hand by those goddesses,</p>\n<p class="slindent">Because I heard from them a &ldquo;Too intently!&rdquo;</p></div>\n\n<div class="stanza"><p>And that condition of the sight which is</p>\n<p class="slindent">In eyes but lately smitten by the sun</p>\n<p class="slindent">Bereft me of my vision some short while;</p></div>\n\n<div class="stanza"><p>But to the less when sight re-shaped itself,</p>\n<p class="slindent">I say the less in reference to the greater</p>\n<p class="slindent">Splendour from which perforce I had withdrawn,</p></div>\n\n<div class="stanza"><p>I saw upon its right wing wheeled about</p>\n<p class="slindent">The glorious host returning with the sun</p>\n<p class="slindent">And with the sevenfold flames upon their faces.</p></div>\n\n<div class="stanza"><p>As underneath its shields, to save itself,</p>\n<p class="slindent">A squadron turns, and with its banner wheels,</p>\n<p class="slindent">Before the whole thereof can change its front,</p></div>\n\n<div class="stanza"><p>That soldiery of the celestial kingdom</p>\n<p class="slindent">Which marched in the advance had wholly passed us</p>\n<p class="slindent">Before the chariot had turned its pole.</p></div>\n\n<div class="stanza"><p>Then to the wheels the maidens turned themselves,</p>\n<p class="slindent">And the Griffin moved his burden benedight,</p>\n<p class="slindent">But so that not a feather of him fluttered.</p></div>\n\n<div class="stanza"><p>The lady fair who drew me through the ford</p>\n<p class="slindent">Followed with Statius and myself the wheel</p>\n<p class="slindent">Which made its orbit with the lesser arc.</p></div>\n\n<div class="stanza"><p>So passing through the lofty forest, vacant</p>\n<p class="slindent">By fault of her who in the serpent trusted,</p>\n<p class="slindent">Angelic music made our steps keep time.</p></div>\n\n<div class="stanza"><p>Perchance as great a space had in three flights</p>\n<p class="slindent">An arrow loosened from the string o&rsquo;etpassed,</p>\n<p class="slindent">As we had moved when Beatrice descended.</p></div>\n\n<div class="stanza"><p>I heard them murmur altogether, &ldquo;Adam!&rdquo;</p>\n<p class="slindent">Then circled they about a tree despoiled</p>\n<p class="slindent">Of blooms and other leafage on each bough.</p></div>\n\n<div class="stanza"><p>Its tresses, which so much the more dilate</p>\n<p class="slindent">As higher they ascend, had been by Indians</p>\n<p class="slindent">Among their forests marvelled at for height.</p></div>\n\n<div class="stanza"><p>&ldquo;Blessed art thou, O Griffin, who dost not</p>\n<p class="slindent">Pluck with thy beak these branches sweet to taste,</p>\n<p class="slindent">Since appetite by this was turned to evil.&rdquo;</p></div>\n\n<div class="stanza"><p>After this fashion round the tree robust</p>\n<p class="slindent">The others shouted; and the twofold creature:</p>\n<p class="slindent">&ldquo;Thus is preserved the seed of all the just.&rdquo;</p></div>\n\n<div class="stanza"><p>And turning to the pole which he had dragged,</p>\n<p class="slindent">He drew it close beneath the widowed bough,</p>\n<p class="slindent">And what was of it unto it left bound.</p></div>\n\n<div class="stanza"><p>In the same manner as our trees (when downward</p>\n<p class="slindent">Falls the great light, with that together mingled</p>\n<p class="slindent">Which after the celestial Lasca shines)</p></div>\n\n<div class="stanza"><p>Begin to swell, and then renew themselves,</p>\n<p class="slindent">Each one with its own colour, ere the Sun</p>\n<p class="slindent">Harness his steeds beneath another star:</p></div>\n\n<div class="stanza"><p>Less than of rose and more than violet</p>\n<p class="slindent">A hue disclosing, was renewed the tree</p>\n<p class="slindent">That had erewhile its boughs so desolate.</p></div>\n\n<div class="stanza"><p>I never heard, nor here below is sung,</p>\n<p class="slindent">The hymn which afterward that people sang,</p>\n<p class="slindent">Nor did I bear the melody throughout.</p></div>\n\n<div class="stanza"><p>Had I the power to paint how fell asleep</p>\n<p class="slindent">Those eyes compassionless, of Syrinx hearing,</p>\n<p class="slindent">Those eyes to which more watching cost so dear,</p></div>\n\n<div class="stanza"><p>Even as a painter who from model paints</p>\n<p class="slindent">I would portray how I was lulled asleep;</p>\n<p class="slindent">He may, who well can picture drowsihood.</p></div>\n\n<div class="stanza"><p>Therefore I pass to what time I awoke,</p>\n<p class="slindent">And say a splendour rent from me the veil</p>\n<p class="slindent">Of slumber, and a calling: &ldquo;Rise, what dost thou?&rdquo;</p></div>\n\n<div class="stanza"><p>As to behold the apple-tree in blossom</p>\n<p class="slindent">Which makes the Angels greedy for its fruit,</p>\n<p class="slindent">And keeps perpetual bridals in the Heaven,</p></div>\n\n<div class="stanza"><p>Peter and John and James conducted were,</p>\n<p class="slindent">And, overcome, recovered at the word</p>\n<p class="slindent">By which still greater slumbers have been broken,</p></div>\n\n<div class="stanza"><p>And saw their school diminished by the loss</p>\n<p class="slindent">Not only of Elias, but of Moses,</p>\n<p class="slindent">And the apparel of their Master changed;</p></div>\n\n<div class="stanza"><p>So I revived, and saw that piteous one</p>\n<p class="slindent">Above me standing, who had been conductress</p>\n<p class="slindent">Aforetime of my steps beside the river,</p></div>\n\n<div class="stanza"><p>And all in doubt I said, &ldquo;Where&rsquo;s Beatrice?&rdquo;</p>\n<p class="slindent">And she: &ldquo;Behold her seated underneath</p>\n<p class="slindent">The leafage new, upon the root of it.</p></div>\n\n<div class="stanza"><p>Behold the company that circles her;</p>\n<p class="slindent">The rest behind the Griffin are ascending</p>\n<p class="slindent">With more melodious song, and more profound.&rdquo;</p></div>\n\n<div class="stanza"><p>And if her speech were more diffuse I know not,</p>\n<p class="slindent">Because already in my sight was she</p>\n<p class="slindent">Who from the hearing of aught else had shut me.</p></div>\n\n<div class="stanza"><p>Alone she sat upon the very earth,</p>\n<p class="slindent">Left there as guardian of the chariot</p>\n<p class="slindent">Which I had seen the biform monster fasten.</p></div>\n\n<div class="stanza"><p>Encircling her, a cloister made themselves</p>\n<p class="slindent">The seven Nymphs, with those lights in their hands</p>\n<p class="slindent">Which are secure from Aquilon and Auster.</p></div>\n\n<div class="stanza"><p>&ldquo;Short while shalt thou be here a forester,</p>\n<p class="slindent">And thou shalt be with me for evermore</p>\n<p class="slindent">A citizen of that Rome where Christ is Roman.</p></div>\n\n<div class="stanza"><p>Therefore, for that world&rsquo;s good which liveth ill,</p>\n<p class="slindent">Fix on the car thine eyes, and what thou seest,</p>\n<p class="slindent">Having returned to earth, take heed thou write.&rdquo;</p></div>\n\n<div class="stanza"><p>Thus Beatrice; and I, who at the feet</p>\n<p class="slindent">Of her commandments all devoted was,</p>\n<p class="slindent">My mind and eyes directed where she willed.</p></div>\n\n<div class="stanza"><p>Never descended with so swift a motion</p>\n<p class="slindent">Fire from a heavy cloud, when it is raining</p>\n<p class="slindent">From out the region which is most remote,</p></div>\n\n<div class="stanza"><p>As I beheld the bird of Jove descend</p>\n<p class="slindent">Down through the tree, rending away the bark,</p>\n<p class="slindent">As well as blossoms and the foliage new,</p></div>\n\n<div class="stanza"><p>And he with all his might the chariot smote,</p>\n<p class="slindent">Whereat it reeled, like vessel in a tempest</p>\n<p class="slindent">Tossed by the waves, now starboard and now larboard.</p></div>\n\n<div class="stanza"><p>Thereafter saw I leap into the body</p>\n<p class="slindent">Of the triumphal vehicle a Fox,</p>\n<p class="slindent">That seemed unfed with any wholesome food.</p></div>\n\n<div class="stanza"><p>But for his hideous sins upbraiding him,</p>\n<p class="slindent">My Lady put him to as swift a flight</p>\n<p class="slindent">As such a fleshless skeleton could bear.</p></div>\n\n<div class="stanza"><p>Then by the way that it before had come,</p>\n<p class="slindent">Into the chariot&rsquo;s chest I saw the Eagle</p>\n<p class="slindent">Descend, and leave it feathered with his plumes.</p></div>\n\n<div class="stanza"><p>And such as issues from a heart that mourns,</p>\n<p class="slindent">A voice from Heaven there issued, and it said:</p>\n<p class="slindent">&ldquo;My little bark, how badly art thou freighted!&rdquo;</p></div>\n\n<div class="stanza"><p>Methought, then, that the earth did yawn between</p>\n<p class="slindent">Both wheels, and I saw rise from it a Dragon,</p>\n<p class="slindent">Who through the chariot upward fixed his tail,</p></div>\n\n<div class="stanza"><p>And as a wasp that draweth back its sting,</p>\n<p class="slindent">Drawing unto himself his tail malign,</p>\n<p class="slindent">Drew out the floor, and went his way rejoicing.</p></div>\n\n<div class="stanza"><p>That which remained behind, even as with grass</p>\n<p class="slindent">A fertile region, with the feathers, offered</p>\n<p class="slindent">Perhaps with pure intention and benign,</p></div>\n\n<div class="stanza"><p>Reclothed itself, and with them were reclothed</p>\n<p class="slindent">The pole and both the wheels so speedily,</p>\n<p class="slindent">A sigh doth longer keep the lips apart.</p></div>\n\n<div class="stanza"><p>Transfigured thus the holy edifice</p>\n<p class="slindent">Thrust forward heads upon the parts of it,</p>\n<p class="slindent">Three on the pole and one at either corner.</p></div>\n\n<div class="stanza"><p>The first were horned like oxen; but the four</p>\n<p class="slindent">Had but a single horn upon the forehead;</p>\n<p class="slindent">A monster such had never yet been seen!</p></div>\n\n<div class="stanza"><p>Firm as a rock upon a mountain high,</p>\n<p class="slindent">Seated upon it, there appeared to me</p>\n<p class="slindent">A shameless whore, with eyes swift glancing round,</p></div>\n\n<div class="stanza"><p>And, as if not to have her taken from him,</p>\n<p class="slindent">Upright beside her I beheld a giant;</p>\n<p class="slindent">And ever and anon they kissed each other.</p></div>\n\n<div class="stanza"><p>But because she her wanton, roving eye</p>\n<p class="slindent">Turned upon me, her angry paramour</p>\n<p class="slindent">Did scourge her from her head unto her feet.</p></div>\n\n<div class="stanza"><p>Then full of jealousy, and fierce with wrath,</p>\n<p class="slindent">He loosed the monster, and across the forest</p>\n<p class="slindent">Dragged it so far, he made of that alone</p></div>\n\n<div class="stanza"><p>A shield unto the whore and the strange beast.</p></div>','<p class="cantohead">Purgatorio: Canto XXXIII</p>\n<div class="stanza"><p>&ldquo;Deus venerunt gentes,&rdquo; alternating</p>\n<p class="slindent">Now three, now four, melodious psalmody</p>\n<p class="slindent">The maidens in the midst of tears began;</p></div>\n\n<div class="stanza"><p>And Beatrice, compassionate and sighing,</p>\n<p class="slindent">Listened to them with such a countenance,</p>\n<p class="slindent">That scarce more changed was Mary at the cross.</p></div>\n\n<div class="stanza"><p>But when the other virgins place had given</p>\n<p class="slindent">For her to speak, uprisen to her feet</p>\n<p class="slindent">With colour as of fire, she made response:</p></div>\n\n<div class="stanza"><p>&ldquo;&lsquo;Modicum, et non videbitis me;</p>\n<p class="slindent">Et iterum,&rsquo; my sisters predilect,</p>\n<p class="slindent">&lsquo;Modicum, et vos videbitis me.&rsquo;&nbsp;&rdquo;</p></div>\n\n<div class="stanza"><p>Then all the seven in front of her she placed;</p>\n<p class="slindent">And after her, by beckoning only, moved</p>\n<p class="slindent">Me and the lady and the sage who stayed.</p></div>\n\n<div class="stanza"><p>So she moved onward; and I do not think</p>\n<p class="slindent">That her tenth step was placed upon the ground,</p>\n<p class="slindent">When with her eyes upon mine eyes she smote,</p></div>\n\n<div class="stanza"><p>And with a tranquil aspect, &ldquo;Come more quickly,&rdquo;</p>\n<p class="slindent">To me she said, &ldquo;that, if I speak with thee,</p>\n<p class="slindent">To listen to me thou mayst be well placed.&rdquo;</p></div>\n\n<div class="stanza"><p>As soon as I was with her as I should be,</p>\n<p class="slindent">She said to me: &ldquo;Why, brother, dost thou not</p>\n<p class="slindent">Venture to question now, in coming with me?&rdquo;</p></div>\n\n<div class="stanza"><p>As unto those who are too reverential,</p>\n<p class="slindent">Speaking in presence of superiors,</p>\n<p class="slindent">Who drag no living utterance to their teeth,</p></div>\n\n<div class="stanza"><p>It me befell, that without perfect sound</p>\n<p class="slindent">Began I: &ldquo;My necessity, Madonna,</p>\n<p class="slindent">You know, and that which thereunto is good.&rdquo;</p></div>\n\n<div class="stanza"><p>And she to me: &ldquo;Of fear and bashfulness</p>\n<p class="slindent">Henceforward I will have thee strip thyself,</p>\n<p class="slindent">So that thou speak no more as one who dreams.</p></div>\n\n<div class="stanza"><p>Know that the vessel which the serpent broke</p>\n<p class="slindent">Was, and is not; but let him who is guilty</p>\n<p class="slindent">Think that God&rsquo;s vengeance does not fear a sop.</p></div>\n\n<div class="stanza"><p>Without an heir shall not for ever be</p>\n<p class="slindent">The Eagle that left his plumes upon the car,</p>\n<p class="slindent">Whence it became a monster, then a prey;</p></div>\n\n<div class="stanza"><p>For verily I see, and hence narrate it,</p>\n<p class="slindent">The stars already near to bring the time,</p>\n<p class="slindent">From every hindrance safe, and every bar,</p></div>\n\n<div class="stanza"><p>Within which a Five-hundred, Ten, and Five,</p>\n<p class="slindent">One sent from God, shall slay the thievish woman</p>\n<p class="slindent">And that same giant who is sinning with her.</p></div>\n\n<div class="stanza"><p>And peradventure my dark utterance,</p>\n<p class="slindent">Like Themis and the Sphinx, may less persuade thee,</p>\n<p class="slindent">Since, in their mode, it clouds the intellect;</p></div>\n\n<div class="stanza"><p>But soon the facts shall be the Naiades</p>\n<p class="slindent">Who shall this difficult enigma solve,</p>\n<p class="slindent">Without destruction of the flocks and harvests.</p></div>\n\n<div class="stanza"><p>Note thou; and even as by me are uttered</p>\n<p class="slindent">These words, so teach them unto those who live</p>\n<p class="slindent">That life which is a running unto death;</p></div>\n\n<div class="stanza"><p>And bear in mind, whene&rsquo;et thou writest them,</p>\n<p class="slindent">Not to conceal what thou hast seen the plant,</p>\n<p class="slindent">That twice already has been pillaged here.</p></div>\n\n<div class="stanza"><p>Whoever pillages or shatters it,</p>\n<p class="slindent">With blasphemy of deed offendeth God,</p>\n<p class="slindent">Who made it holy for his use alone.</p></div>\n\n<div class="stanza"><p>For biting that, in pain and in desire</p>\n<p class="slindent">Five thousand years and more the first-born soul</p>\n<p class="slindent">Craved Him, who punished in himself the bite.</p></div>\n\n<div class="stanza"><p>Thy genius slumbers, if it deem it not</p>\n<p class="slindent">For special reason so pre-eminent</p>\n<p class="slindent">In height, and so inverted in its summit.</p></div>\n\n<div class="stanza"><p>And if thy vain imaginings had not been</p>\n<p class="slindent">Water of Elsa round about thy mind,</p>\n<p class="slindent">And Pyramus to the mulberry, their pleasure,</p></div>\n\n<div class="stanza"><p>Thou by so many circumstances only</p>\n<p class="slindent">The justice of the interdict of God</p>\n<p class="slindent">Morally in the tree wouldst recognize.</p></div>\n\n<div class="stanza"><p>But since I see thee in thine intellect</p>\n<p class="slindent">Converted into stone and stained with sin,</p>\n<p class="slindent">So that the light of my discourse doth daze thee,</p></div>\n\n<div class="stanza"><p>I will too, if not written, at least painted,</p>\n<p class="slindent">Thou bear it back within thee, for the reason</p>\n<p class="slindent">That cinct with palm the pilgrim&rsquo;s staff is borne.&rdquo;</p></div>\n\n<div class="stanza"><p>And I: &ldquo;As by a signet is the wax</p>\n<p class="slindent">Which does not change the figure stamped upon it,</p>\n<p class="slindent">My brain is now imprinted by yourself.</p></div>\n\n<div class="stanza"><p>But wherefore so beyond my power of sight</p>\n<p class="slindent">Soars your desirable discourse, that aye</p>\n<p class="slindent">The more I strive, so much the more I lose it?&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;That thou mayst recognize,&rdquo; she said, &ldquo;the school</p>\n<p class="slindent">Which thou hast followed, and mayst see how far</p>\n<p class="slindent">Its doctrine follows after my discourse,</p></div>\n\n<div class="stanza"><p>And mayst behold your path from the divine</p>\n<p class="slindent">Distant as far as separated is</p>\n<p class="slindent">From earth the heaven that highest hastens on.&rdquo;</p></div>\n\n<div class="stanza"><p>Whence her I answered: &ldquo;I do not remember</p>\n<p class="slindent">That ever I estranged myself from you,</p>\n<p class="slindent">Nor have I conscience of it that reproves me.&rdquo;</p></div>\n\n<div class="stanza"><p>&ldquo;And if thou art not able to remember,&rdquo;</p>\n<p class="slindent">Smiling she answered, &ldquo;recollect thee now</p>\n<p class="slindent">That thou this very day hast drunk of Lethe;</p></div>\n\n<div class="stanza"><p>And if from smoke a fire may be inferred,</p>\n<p class="slindent">Such an oblivion clearly demonstrates</p>\n<p class="slindent">Some error in thy will elsewhere intent.</p></div>\n\n<div class="stanza"><p>Truly from this time forward shall my words</p>\n<p class="slindent">Be naked, so far as it is befitting</p>\n<p class="slindent">To lay them open unto thy rude gaze.&rdquo;</p></div>\n\n<div class="stanza"><p>And more coruscant and with slower steps</p>\n<p class="slindent">The sun was holding the meridian circle,</p>\n<p class="slindent">Which, with the point of view, shifts here and there</p></div>\n\n<div class="stanza"><p>When halted (as he cometh to a halt,</p>\n<p class="slindent">Who goes before a squadron as its escort,</p>\n<p class="slindent">If something new he find upon his way)</p></div>\n\n<div class="stanza"><p>The ladies seven at a dark shadow&rsquo;s edge,</p>\n<p class="slindent">Such as, beneath green leaves and branches black,</p>\n<p class="slindent">The Alp upon its frigid border wears.</p></div>\n\n<div class="stanza"><p>In front of them the Tigris and Euphrates</p>\n<p class="slindent">Methought I saw forth issue from one fountain,</p>\n<p class="slindent">And slowly part, like friends, from one another.</p></div>\n\n<div class="stanza"><p>&ldquo;O light, O glory of the human race!</p>\n<p class="slindent">What stream is this which here unfolds itself</p>\n<p class="slindent">From out one source, and from itself withdraws?&rdquo;</p></div>\n\n<div class="stanza"><p>For such a prayer, &rsquo;twas said unto me, &ldquo;Pray</p>\n<p class="slindent">Matilda that she tell thee;&rdquo; and here answered,</p>\n<p class="slindent">As one does who doth free himself from blame,</p></div>\n\n<div class="stanza"><p>The beautiful lady: &ldquo;This and other things</p>\n<p class="slindent">Were told to him by me; and sure I am</p>\n<p class="slindent">The water of Lethe has not hid them from him.&rdquo;</p></div>\n\n<div class="stanza"><p>And Beatrice: &ldquo;Perhaps a greater care,</p>\n<p class="slindent">Which oftentimes our memory takes away,</p>\n<p class="slindent">Has made the vision of his mind obscure.</p></div>\n\n<div class="stanza"><p>But Eunoe behold, that yonder rises;</p>\n<p class="slindent">Lead him to it, and, as thou art accustomed,</p>\n<p class="slindent">Revive again the half-dead virtue in him.&rdquo;</p></div>\n\n<div class="stanza"><p>Like gentle soul, that maketh no excuse,</p>\n<p class="slindent">But makes its own will of another&rsquo;s will</p>\n<p class="slindent">As soon as by a sign it is disclosed,</p></div>\n\n<div class="stanza"><p>Even so, when she had taken hold of me,</p>\n<p class="slindent">The beautiful lady moved, and unto Statius</p>\n<p class="slindent">Said, in her womanly manner, &ldquo;Come with him.&rdquo;</p></div>\n\n<div class="stanza"><p>If, Reader, I possessed a longer space</p>\n<p class="slindent">For writing it, I yet would sing in part</p>\n<p class="slindent">Of the sweet draught that ne&rsquo;et would satiate me;</p></div>\n\n<div class="stanza"><p>But inasmuch as full are all the leaves</p>\n<p class="slindent">Made ready for this second canticle,</p>\n<p class="slindent">The curb of art no farther lets me go.</p></div>\n\n<div class="stanza"><p>From the most holy water I returned</p>\n<p class="slindent">Regenerate, in the manner of new trees</p>\n<p class="slindent">That are renewed with a new foliage,</p></div>\n\n<div class="stanza"><p>Pure and disposed to mount unto the stars.</p></div>']};

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