// twinmode.js

"use strict";

const dom = require("./dom");
const helpers = require("./helpers");
var data = require("./appdata");
const fixpadding = require("./fixpadding");

const twinmode = {
	turnon: function() {

		// this should be fired when twin mode is turned on
		console.log("Twin mode!");

		dom.addclass("body","twinmode");
		let titlewidth = (document.getElementById("navbar").clientWidth / 2) - (5 * 40) - 1;
		if(data.lens.left.translation === "") {
			data.lens.left.translation = helpers.nexttrans(data.lens.right.translation);
		}
		if(document.getElementById("newtextleft")) {
			document.getElementById("newtextleft").id = `${data.lens.left.translation}-left`;
		}

		let thistrans = helpers.gettranslationindex(data.lens.left.translation);

		dom.addclass("#sliderleft .textframe", data.translationdata[thistrans].translationclass);
		let insert = dom.create(data.textdata[thistrans].text[data.canto]);
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
		data.lens.left.titlebar.style.width = `${titlewidth}px`;
		data.lens.left.titlebar.setAttribute("style",`width:${titlewidth}px`);
		data.lens.right.titlebar.style.width = `${titlewidth}px`;
		data.lens.right.titlebar.setAttribute("style",`width:${titlewidth}px`);

		data.lens.left.width =  data.windowwidth / 2;
		data.lens.right.width =  data.windowwidth / 2;
	},
	turnoff: function() {

		console.log("Single mode!");

		// this should be fired when twin mode is turned off

		dom.removeclass("body","twinmode");


		data.lens.left.slider.style.width = "0";
		data.lens.right.slider.style.width = "100%";

		data.lens.left.width = 0;
		data.lens.right.width = data.windowwidth;

		let titlewidth = document.getElementById("navbar").clientWidth - (5 * 40) - 1;
		data.lens.right.titlebar.style.width = `${titlewidth}px`;
		data.lens.right.titlebar.setAttribute("style",`width:${titlewidth}px`);

		fixpadding.responsive(data.lens.right);

	}
};

module.exports = twinmode;
