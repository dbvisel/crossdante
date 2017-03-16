// localdata.js

"use strict";

const dom = require("./dom");
var data = require("./appdata");
var helpers = require("./helpers");

var localdata =  {
	save: function() {	// this should store appdate on localstorage

		let tostore = JSON.stringify({
			currentcanto: 			data.canto,
			currenttransright: 	data.lens.right.translation,
			currenttransleft: 	data.lens.left.translation,
			translationset: 		data.currenttranslationlist,
			twinmode: 					data.usersettings.twinmode,
			nightmode: 					data.usersettings.nightmode,
			shownotes: 					data.usersettings.shownotes
		});

		let storage = window.localStorage;
		storage.setItem(data.bookname, tostore);

		// save current location as hash

		if (history.pushState) {
			let newurl = window.location.origin + window.location.pathname + `?canto=${data.canto}&trans=${data.lens.right.translation}`;
			if(data.usersettings.twinmode) {
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
			// console.log("What's in local storage: "+ toread);
			let storedvalues = JSON.parse(toread);
			data.canto = storedvalues.currentcanto;
			data.lens.right.translation = storedvalues.currenttransright;
			data.lens.left.translation = storedvalues.currenttransleft;
			data.usersettings.twinmode = storedvalues.twinmode;
			data.usersettings.nightmode = storedvalues.nightmode;
			data.usersettings.shownotes = storedvalues.shownotes;
			data.currenttranslationlist = storedvalues.translationset;
			if(data.usersettings.twinmode) {
				dom.addclass("body","twinmode");
				dom.removeclass("#twinmode","off");
				dom.addclass("#singlemode","off");
			} else {
				dom.removeclass("body","twinmode");
				dom.addclass("#twinmode","off");
				dom.removeclass("#singlemode","off");
			}
			if(data.usersettings.nightmode) {
				dom.addclass("body","nightmode");
				dom.removeclass("#nightmode","off");
				dom.addclass("#daymode","off");
			} else {
				dom.removeclass("body","nightmode");
				dom.addclass("#nightmode","off");
				dom.removeclass("#daymode","off");
			}
			if(data.usersettings.shownotes) {
				dom.removeclass("body","hidenotes");
				dom.removeclass("#shownotes","off");
				dom.addclass("#hidenotes","off");
			} else {
				dom.addclass("body","hidenotes");
				dom.addclass("#shownotes","off");
				dom.removeclass("#hidenotes","off");
			}
			data.watch.setlens = {
				translation: data.currenttranslationlist[helpers.gettranslationindex(data.lens.right.translation)],
				canto: data.canto,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
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
				data.usersettings.twinmode = true;
				dom.addclass("body","twinmode");
				dom.removeclass("#twinmode","off");
				dom.addclass("#singlemode","off");
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
	},
};

module.exports = localdata;
