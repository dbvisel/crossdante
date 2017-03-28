// version 4: now going to ES6 & Babel
// @//flow

"use strict";

const Fastclick = require("fastclick");

const dom = require("./dom");
// const fixpadding = require("./fixpadding");
const resize = require("./resize");
const controls = require("./controls");
const watchers = require("./watchers");

let data = require("./appdata");
let device = {};

var app = {
	initialize: function() {

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

		document.title = "Cross Dante " + data.booktitle;

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
								controls.rightcantominus();
							}
							return;
						}
					}
				};
				document.addEventListener('touchstart', touchstartHandler, false);
				document.addEventListener('touchmove', touchmoveHandler, false);
			});
		}

		// fixpadding.preprocess();

		controls.start();		// this sets up controls
		watchers.setup();

		dom.addclass("body",data.bookname);
		dom.addclass("body",data.system.oncordova ? "cordova" : "web");
		dom.removebyselector("#loadingscrim");
		data.watch.setpage = "lens";
	}
};

module.exports = app;
