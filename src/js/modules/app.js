// version 4: now going to ES6 & Babel
// @//flow

"use strict";

const Fastclick = require("fastclick");
const WatchJS = require("melanke-watchjs");

const dom = require("./dom");
const localdata = require("./localdata");
const fixpadding = require("./fixpadding");
const resize = require("./resize");
const controls = require("./controls");
const setlens = require("./setlens");
const setpage = require("./setpage");

let data = require("./appdata");
let device = {};
let watch = WatchJS.watch;
// var unwatch = WatchJS.unwatch;
// var callWatchers = WatchJS.callWatchers;

var app = {
	initialize: function() {
		// console.log("initializing!");
		this.bindEvents();

		// check to see if there are saved localstorage, if so, take those values

	},
	bindEvents: function() {
		// console.log("binding events!");
		var testapp = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
		var testcordova = !(window.cordova === undefined); // need this as well for dev
		if(testapp && testcordova) {

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

			document.addEventListener('DOMContentLoaded', () => {
				Fastclick.attach(document.body);
			}, false);
		}
	},
	onDeviceReady: function() {
		data.system.oncordova = true; 					// we're running on cordova
		data.system.platform = device.plaform;	// should be either "iOS" or "Android"
		console.log(device.cordova);
		console.log("Cordova running. Platform: " + data.system.platform);
		app.setup();
	},
	setup: function() {
		// console.log("In setup");

		// basic doc setup

		data.setup();

		// attach watchers to data.watch.setpage and data.watch.setlens

		watch(data.watch, "setpage", function(){
			setpage(data.watch.setpage);
		});

		watch(data.watch, "setlens", function(){
			setlens.go(data.watch.setlens.translation, data.watch.setlens.canto, data.watch.setlens.side, data.watch.setlens.percentage);
		});

		watch(data.watch, "localsave", function() {
			// this is called by inverting the value of data.watch.localsave
			localdata.save();
		});


		document.title = "Cross Dante " + data.booktitle;

		if(data.usersettings.nightmode) {
			dom.addclass("body","nightmode");
		} else {
			dom.removeclass("body","nightmode");
		}

		// set up current translation list (initially use all of them)

		for(let i =0; i < data.translationdata.length; i++) {
			data.currenttranslationlist.push(data.translationdata[i].translationid);
			document.getElementById("textsources").innerHTML += `<li>${data.translationdata[i].translationfullname}, <em>${data.translationdata[i].title}:</em> ${data.translationdata[i].source}</li>`;
		}

		data.lens.right.translation = data.currenttranslationlist[0];
		if(!data.system.oncordova) {
			// attempt to fix android pull down to refresh
			// code from http://stackoverflow.com/questions/29008194/disabling-androids-chrome-pull-down-to-refresh-feature
			window.addEventListener('load', function() {
				var maybePreventPullToRefresh = false;
				var lastTouchY = 0;
				var touchstartHandler = function(e) {
					if (e.touches.length != 1) return;
					lastTouchY = e.touches[0].clientY;
					// Pull-to-refresh will only trigger if the scroll begins when the
					// document's Y offset is zero.
					maybePreventPullToRefresh = window.pageYOffset == 0;
				};

				var touchmoveHandler = function(e) {
					var touchY = e.touches[0].clientY;
					var touchYDelta = touchY - lastTouchY;
					lastTouchY = touchY;

					if (maybePreventPullToRefresh) {
						// To suppress pull-to-refresh it is sufficient to preventDefault the
						// first overscrolling touchmove.
						maybePreventPullToRefresh = false;
						if (touchYDelta > 0) {
							e.preventDefault();

							if(data.currentpage == "lens" && data.lens.right.text.scrollTop < 1) {
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

		controls.start();		// this sets up controls
		localdata.read();

		dom.addclass("body",data.bookname);
		dom.addclass("body",data.system.oncordova ? "cordova" : "web");
		dom.removebyselector("#loadingscrim");
		data.watch.setpage = "lens";
	}
};

module.exports = app;
