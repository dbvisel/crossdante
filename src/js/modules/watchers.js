// watchers.js

"use strict";

const WatchJS = require("melanke-watchjs");

const setlens = require("./setlens");
const setpage = require("./setpage");
const dom = require("./dom");
const localdata = require("./localdata");
const resize = require("./resize");

let data = require("./appdata");

let watch = WatchJS.watch;
// var unwatch = WatchJS.unwatch;
let callWatchers = WatchJS.callWatchers;


const watchers = {
	setup: function() {

		// get localdata in place

		localdata.read();

		// attach watchers

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

		watch(data.watch, "nightmode", function() {
			console.log(`Night mode: ${data.watch.nightmode}`);
			if(data.watch.nightmode) {
				dom.addclass("body","nightmode");
				dom.removeclass("#nightmode","off");
				dom.addclass("#daymode","off");
			} else {
				dom.removeclass("body","nightmode");
				dom.addclass("#nightmode","off");
				dom.removeclass("#daymode","off");
			}
			data.watch.localsave = !data.watch.localsave;
		});

		watch(data.watch, "twinmode", function() {
			console.log(`Twin mode: ${data.watch.twinmode}`);
			if(data.watch.twinmode) {
				dom.addclass("body","twinmode");
				dom.removeclass("#twinmode","off");
				dom.addclass("#singlemode","off");
			} else {
				dom.removeclass("body","twinmode");
				dom.addclass("#twinmode","off");
				dom.removeclass("#singlemode","off");
			}
			resize.check();
			data.watch.localsave = !data.watch.localsave;
		});

		watch(data.watch, "shownotes", function() {
			console.log(`Show notes: ${data.watch.shownotes}`);
			if(data.watch.shownotes) {
				dom.removeclass("body","hidenotes");
				dom.removeclass("#shownotes","off");
				dom.addclass("#hidenotes","off");
			} else {
				dom.addclass("body","hidenotes");
				dom.addclass("#shownotes","off");
				dom.removeclass("#hidenotes","off");
			}
			data.watch.localsave = !data.watch.localsave;
		});

		watchers.call();
	},
	call: function() {
		callWatchers(data.watch, "nightmode");
		callWatchers(data.watch, "shownotes");
		callWatchers(data.watch, "twinmode");
	}
};

module.exports = watchers;
