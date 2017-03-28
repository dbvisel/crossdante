//setpage.js
//
// this module changes page in the app

"use strict";

const dom = require("./dom");
const resize = require("./resize");
let data = require("./appdata");

const setpage = function(newpage) {
	// console.log("Setpage called for: "+newpage);
	dom.removeclass(".page","on");
	dom.addclass(".page#"+newpage,"on");
	data.currentpage = newpage;
	if(newpage !== "lens") {
		// set title to be whatever the h1 is

		let newtitle = document.querySelector("#" + newpage + " h1").innerHTML;
		data.elements.titlebar.innerHTML = newtitle;
		dom.addclass("nav#navbarleft","off");
		dom.addclass("nav#navbarright","off");

		dom.addclass("#navbarother","on");

		// make back button on left of nav bar visible!

	} else {
		dom.removeclass("nav#navbarleft","off");
		dom.removeclass("nav#navbarright","off");
		dom.removeclass("#navbarother","on");

		// hide back button on left of nav bar!

		resize.check(); // this might be running too often!
	}
};

module.exports = setpage;
