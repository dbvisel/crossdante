// localdata.js
//
// This module controls saving data locally

"use strict";

var data = require("./appdata");
var helpers = require("./helpers"); // getUrlVars, .gettranslationindex,

var localdata =  {
	save: function() {	// this should store appdate on localstorage

		let tostore = JSON.stringify({
			currentcanto: 			data.canto,
			currenttransright: 	data.lens.right.translation,
			currenttransleft: 	data.lens.left.translation,
			translationset: 		data.currenttranslationlist,
			twinmode: 					data.watch.twinmode,
			nightmode: 					data.watch.nightmode,
			shownotes: 					data.watch.shownotes
		});

		let storage = window.localStorage;
		storage.setItem(data.bookname, tostore);

		// save current location as hash

		if (history.pushState) {
			let newurl = window.location.origin + window.location.pathname + `?canto=${data.canto}&trans=${data.lens.right.translation}`;
			if(data.watch.twinmode) {
				newurl += `&lefttrans=${data.lens.left.translation}`;
			}
			if (window.location.protocol !== "file:") {
				window.history.pushState({path:newurl},'',newurl);
			} else {
				console.log(newurl);
			}
		}
	},
	read: function() {

		if(helpers.getUrlVars().reset) {
			console.log("Resetting local storage!");
			let storage = window.localStorage;
			storage.removeItem(data.bookname);
		}

		let gotocanto = 0;
		let gototrans = "";
		let gotolefttrans = "";
		let gototwinmode = false;
		let cantoflag = false;
		let transflag = false;

		// this should take localstorage and replace the values in data with it

		// first, read local storage

		let storage = window.localStorage;
		let toread = storage.getItem(data.bookname);

		if(toread !== null) {
			console.log("What's in local storage: "+ toread);
			let storedvalues = JSON.parse(toread);
			data.canto = storedvalues.currentcanto;
			data.lens.right.translation = storedvalues.currenttransright;
			data.lens.left.translation = storedvalues.currenttransleft;
			data.watch.twinmode = storedvalues.twinmode;
			data.watch.nightmode = storedvalues.nightmode;
			data.watch.shownotes = storedvalues.shownotes;
			data.currenttranslationlist = storedvalues.translationset;
		} else {

			// if we are here, we have no saved data!

			data.canto = 0;
			data.lens.right.translation = data.currenttranslationlist[0];
			data.lens.left.translation = helpers.netxtrans(data.currenttranslationlist[0]);
			data.watch.twinmode = false;
			data.watch.nightmode = false;
			data.watch.shownotes = true;
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

		if(helpers.getUrlVars().canto) {
			gotocanto = helpers.getUrlVars().canto;
			cantoflag = true;
		}
		if(helpers.getUrlVars().trans) {
			gototrans = helpers.getUrlVars().trans;
			transflag = true;
		}
		if(helpers.getUrlVars().lefttrans) {
			gotolefttrans = helpers.getUrlVars().lefttrans;
			gototwinmode = true;
		}

		if(cantoflag && transflag) {
			console.log("We have canto & trans from URL!");
			if(gototwinmode) {
				console.log("We have left trans from URL!");
				data.watch.twinmode = true;
				data.lens.left.translation = gotolefttrans;
			}
			data.watch.setlens = {
				translation: data.currenttranslationlist[helpers.gettranslationindex(gototrans)],
				canto: gotocanto,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
		} else {
			console.log("No canto/translation found in URL.");
		}
	},
};

module.exports = localdata;
