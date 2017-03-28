//resize.js
//
// this is invoked when the screen is resized.

"use strict";

var data = require("./appdata");
const dom = require("./dom");
const helpers = require("./helpers"); // .nexttrans, .gettranslationindex

const resize = {
	check: function(keeppage) {

		// if this is invoked with keeppage = true, it won't call setlens

		// this needs to be debounced!

		//console.log("Navbar: " + document.getElementById("navbar").clientWidth);
		//console.log("Navtitle: " + data.lens.right.titlebar.clientWidth);
		//console.log("button width: " + document.querySelector(".navprev").clientWidth);

		data.windowwidth = window.innerWidth;
		data.windowheight = window.innerHeight;
		let titlewidth = document.getElementById("navbar").clientWidth - (5 * 40) - 1;

		if(data.usersettings.twinmode && data.windowwidth > 768) {
			dom.addclass("body","twinmode");
			titlewidth = (document.getElementById("navbar").clientWidth / 2) - (5 * 40) - 1;
			console.log("Twin mode!");
			if(data.lens.left.translation === "") {
				data.lens.left.translation = helpers.nexttrans(data.lens.right.translation);
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
			// app.setlens(data.lens.left.translation,data.canto,"left");
		} else {
			console.log("Single mode!");
			dom.removeclass("body","twinmode");

			data.lens.left.slider.style.width = "0";
			data.lens.right.slider.style.width = "100%";
		}

		data.lens.left.titlebar.style.width = `${titlewidth}px`;
		data.lens.left.titlebar.setAttribute("style",`width:${titlewidth}px`);
		data.lens.right.titlebar.style.width = `${titlewidth}px`;
		data.lens.right.titlebar.setAttribute("style",`width:${titlewidth}px`);

		console.log(`The window has been resized! New width: ${data.windowwidth},${data.windowheight}`);
		data.lens.width = data.windowwidth;
		data.lens.height = data.windowheight - document.getElementById("navbar").clientHeight; // is this accurate on iOS?

		dom.addclass(".page",data.lens.width > data.lens.height ? "landscape" : "portrait");
		dom.removeclass(".page",data.lens.width > data.lens.height ? "portrait" : "landscape");
		/*
		data.elements.main.style.width = data.lens.width+"px";
		data.elements.content.style.width = data.lens.width+"px";
		*/
		data.elements.main.style.height = data.windowheight+"px";
		data.elements.content.style.height = data.lens.height+"px";

		if(data.system.responsive) {
			// are these numbers actually synched to what's in the CSS? check!

			let actualwidth = data.usersettings.twinmode ? (data.windowwidth / 2) : data.windowwidth;

			if(actualwidth < 640) {
				data.lens.left.lineheight = 20;
				data.lens.right.lineheight = 20;
			} else {
				if(actualwidth < 768) {
					data.lens.left.lineheight = 24;
					data.lens.right.lineheight = 24;
				} else {
					if(actualwidth < 1024) {
						data.lens.left.lineheight = 28;
						data.lens.right.lineheight = 28;
					} else {
						data.lens.left.lineheight = 32;
						data.lens.right.lineheight = 32;
					}
				}
			}
		} else {
			data.lens.left.lineheight = data.windowwidth/25;
			data.lens.right.lineheight = data.windowwidth/25;
		}

		data.lens.left.width = data.usersettings.twinmode ? data.windowwidth / 2 : 0;
		data.lens.right.width = data.usersettings.twinmode ? data.windowwidth / 2 : data.windowwidth;

		if(!keeppage) {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto,
				side: "right",
				percentage: 999, // is this wrong?
				trigger: !data.watch.setlens.trigger
			};
		}
	}
};

module.exports = resize;
