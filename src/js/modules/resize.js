//resize.js
//
// this is invoked when the screen is resized.

"use strict";

var data = require("./appdata");
const dom = require("./dom");
const twinmode = require("./twinmode");

const resize = {
	check: function(keeppage) {

		// if this is invoked with keeppage = true, it won't call setlens

		// this needs to be debounced!

		//console.log("Navbar: " + document.getElementById("navbar").clientWidth);
		//console.log("Navtitle: " + data.lens.right.titlebar.clientWidth);
		//console.log("button width: " + document.querySelector(".navprev").clientWidth);

		if(data.windowwidth !== window.innerWidth || data.windowheight !== window.innerHeight) {

			data.windowwidth = window.innerWidth;
			data.windowheight = window.innerHeight;

			if(data.settings.twinmode && data.windowwidth > 768) {
				twinmode.turnon();
			} else {
				twinmode.turnoff();
			}


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

				let actualwidth = data.settings.twinmode ? (data.windowwidth / 2) : data.windowwidth;

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

			if(!keeppage) {
				data.settings.lens = {
					translation: data.lens.right.translation,
					canto: data.canto,
					side: "right",
					percentage: 999, // is this wrong?
					trigger: !data.settings.lens.trigger
				};
			}
		}

	}
};

module.exports = resize;
