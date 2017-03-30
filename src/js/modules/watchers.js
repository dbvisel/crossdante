// watchers.js

"use strict";

const WatchJS = require("melanke-watchjs");

const setlens = require("./setlens");
const setpage = require("./setpage");
const dom = require("./dom");
const localdata = require("./localdata");
const resize = require("./resize");
const twinmode = require("./twinmode");
const dictionary = require("./dictionary");

let data = require("./appdata");

let watch = WatchJS.watch;
// var unwatch = WatchJS.unwatch;
let callWatchers = WatchJS.callWatchers;


const watchers = {
	setup: function() {

		// get localdata in place

		localdata.read();

		// attach watchers

		watch(data.settings, "page", function(){
			setpage(data.settings.page);
		});

		watch(data.settings, "lens", function(){
			setlens.go(data.settings.lens.translation, data.settings.lens.canto, data.settings.lens.side, data.settings.lens.percentage);
		});

		watch(data.settings, "localsave", function() {
			// this is called by inverting the value of data.settings.localsave
			localdata.save();
		});

		watch(data.settings, "nightmode", function() {
			console.log(`Night mode: ${data.settings.nightmode}`);
			if(data.settings.nightmode) {
				dom.addclass("body","nightmode");
				dom.removeclass("#nightmode","off");
				dom.addclass("#daymode","off");
			} else {
				dom.removeclass("body","nightmode");
				dom.addclass("#nightmode","off");
				dom.removeclass("#daymode","off");
			}
			data.settings.localsave = !data.settings.localsave;
		});

		watch(data.settings, "twinmode", function() {
			console.log(`Twin mode: ${data.settings.twinmode}`);
			if(data.settings.twinmode) {
				twinmode.turnon();
				dom.addclass("body","twinmode");
				dom.removeclass("#twinmode","off");
				dom.addclass("#singlemode","off");
			} else {
				twinmode.turnoff();
				dom.addclass("#twinmode","off");
				dom.removeclass("#singlemode","off");
			}
			resize.check();
			data.settings.localsave = !data.settings.localsave;
		});

		watch(data.settings, "shownotes", function() {
			console.log(`Show notes: ${data.settings.shownotes}`);
			if(data.settings.shownotes) {
				dom.removeclass("body","hidenotes");
				dom.removeclass("#shownotes","off");
				dom.addclass("#hidenotes","off");
			} else {
				dom.addclass("body","hidenotes");
				dom.addclass("#shownotes","off");
				dom.removeclass("#hidenotes","off");
			}
			data.settings.localsave = !data.settings.localsave;
		});

		watch(data.settings, "dictionary", function() {
			if(data.settings.dictionary) {
				// dictionary support is turned on, set up dictionary
				dictionary.initialize();
			} else {
				// dictionary support is turned off.
			}
		});

		watchers.call();
	},
	call: function() {
		callWatchers(data.settings, "nightmode");
		callWatchers(data.settings, "shownotes");
		callWatchers(data.settings, "twinmode");
		callWatchers(data.settings, "dictionary");
	}
};

module.exports = watchers;
