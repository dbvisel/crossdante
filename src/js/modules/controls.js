// controls.js
//
// this module sets up controls for the app as a whole

"use strict";

const Hammer = require("hammerjs");
const settings = require("./settings");
const helpers = require("./helpers"); // .nextrans, .prevtrans
const dom = require("./dom");
const notes = require("./notes");
var data = require("./appdata");

const controls = {
	start: function() {
		// console.log("Starting controls...");
		controls.navbar();
		controls.settings();
		controls.swiping();
		controls.notes();
		controls.keys();
	},
	lefttransplus: function() {
		data.watch.setlens = {
			translation: helpers.nexttrans(data.lens.left.translation),
			canto: data.canto,
			side: "left",
			trigger: !data.watch.setlens.trigger
		};
	},
	lefttransminus: function() {
		data.watch.setlens = {
			translation: helpers.prevtrans(data.lens.left.translation),
			canto: data.canto,
			side: "left",
			trigger: !data.watch.setlens.trigger
		};
	},
	leftcantominus: function() {
		data.watch.setlens = {
			translation: data.lens.right.translation,
			canto: parseInt(data.canto) - 1,
			side: "left",
			percentage: 0,
			trigger: !data.watch.setlens.trigger
		};
	},
	leftcantoplus: function() {
		data.watch.setlens = {
			translation: data.lens.right.translation,
			canto: parseInt(data.canto) + 1,
			side: "left",
			percentage: 0,
			trigger: !data.watch.setlens.trigger
		};
	},
	righttransminus: function() {
		data.watch.setlens = {
			translation: helpers.prevtrans(data.lens.right.translation),
			canto: data.canto,
			side: "right",
			trigger: !data.watch.setlens.trigger
		};
	},
	righttransplus: function() {
		data.watch.setlens = {
			translation: helpers.nexttrans(data.lens.right.translation),
			canto: data.canto,
			side: "right",
			trigger: !data.watch.setlens.trigger
		};
	},
	rightcantominus: function() {
		data.watch.setlens = {
			translation: data.lens.right.translation,
			canto: parseInt(data.canto) - 1,
			side: "right",
			percentage: 0,
			trigger: !data.watch.setlens.trigger
		};
	},
	rightcantoplus: function() {
		data.watch.setlens = {
			translation: data.lens.right.translation,
			canto: parseInt(data.canto) + 1,
			side: "right",
			percentage: 0,
			trigger: !data.watch.setlens.trigger
		};
	},
	navbar: function() {
		// button controls
		document.querySelector("#navbarleft .navprev").onclick = controls.lefttransminus;
		document.querySelector("#navbarleft .navnext").onclick = controls.lefttransplus;
		document.querySelector("#navbarleft .navup").onclick = controls.leftcantominus;
		document.querySelector("#navbarleft .navdown").onclick = controls.leftcantoplus;
		document.querySelector("#navbarright .navprev").onclick = controls.righttransminus;
		document.querySelector("#navbarright .navnext").onclick = controls.righttransplus;
		document.querySelector("#navbarright .navup").onclick = controls.rightcantominus;
		document.querySelector("#navbarright .navdown").onclick = controls.rightcantoplus;

		document.querySelector("#navbarleft .navclose").onclick = function() {
			data.watch.twinmode = false;
		};
		data.elements.titlebar.onclick = function() {
			data.watch.setpage = "lens";
		};
		document.querySelector("#navbarright .navsettings").onclick = function() {
			settings.update();
			data.watch.setpage = "settings";
		};

		document.body.onkeyup = function(e) {	// maybe this is screwing us on mobile?
			e.preventDefault();
			dom.removeclass(".button","on");
		};
	},
	settings: function() {
		document.getElementById("aboutlink").onclick = function() {
			data.watch.setpage = "about";
		};
		document.getElementById("helplink").onclick = function() {
			data.watch.setpage = "help";
		};

		document.getElementById("daymode").onclick = function() {
			data.watch.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = function() {
			data.watch.nightmode = true;
		};
		if(document.getElementById("singlemode") !== null) {
			document.getElementById("singlemode").onclick = function() {
				data.watch.twinmode = false;
			};
			document.querySelector("#twinmode").onclick = function() {
				data.watch.twinmode = true;
			};
		}

		// show/hide notes

		document.querySelector("#hidenotes").onclick = function() {
			data.watch.shownotes = false;
		};
		document.querySelector("#shownotes").onclick = function() {
			data.watch.shownotes = true;
		};

		document.getElementById("backbutton").onclick = function() {
			if(data.currentpage == "help" || data.currentpage == "about") {
				data.watch.setpage = "settings";
			} else {
				data.watch.setpage = "lens";
			}
		};

		// set up about page

		document.getElementById("abouttext").innerHTML = data.description; 		// set up about page

		for(let i = 0; i < data.versionhistory.length; i++) {
			document.getElementById("versionhistory").innerHTML += `<li>${data.versionhistory[i]}</li>`;
		}
		document.getElementById("comingsoon").innerHTML = data.comingsoon;

	},
	notes: function() {
		data.elements.main.onclick = function() {
			notes.hide();
		};

		for(let i = 0; i < data.textdata.length; i++) {
			let thisnotes = data.textdata[i].notes;
			if(typeof thisnotes !== "undefined") {
				console.log("Inserting notes for " + data.textdata[i].translationid);
				for(let j = 0; j < thisnotes.length; j++) {
					for(let k = 0; k < thisnotes[j].length; k++) {
						let thisnote = thisnotes[j][k];
						if(data.textdata[i].text[j].indexOf("{{"+thisnote.noteno+"}}") > 0) {
							let copy = data.textdata[i].text[j].replace("{{"+thisnote.noteno+"}}", `<span class="note"><span class="noteno">${k+1}</span><span class="notetext">${thisnote.notetext}</span></span>`);
							data.textdata[i].text[j] = copy;
						} else {
							console.log("Not found in canto "+j+": "+thisnote.noteno+": "+thisnote.notetext);
						}
					}
				}
			}
		}

	},
	swiping: function() {			// swipe controls
		data.elements.hammerright = new Hammer(data.lens.right.slider, {
			touchAction : 'auto'
		});
		data.elements.hammerleft = new Hammer(data.lens.left.slider, {
			touchAction : 'auto'
		});
		data.elements.hammerright.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		data.elements.hammerright.on('swipeleft',function(e) {
			e.preventDefault();
			controls.righttransplus();
		}).on('swiperight',function(e) {
			e.preventDefault();
			controls.righttranminus();
		});

		data.elements.hammerright.on('swipedown',function() {
			// e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if(data.lens.right.text.scrollTop === 0) {
				controls.rightcantominus();
			}
		}).on('swipeup',(e) => {
			e.preventDefault();
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one
			if(Math.abs(data.lens.right.text.scrollTop + data.lens.right.text.clientHeight - data.lens.right.text.scrollHeight) < 4) {
				controls.rightcantoplus();
			}
		});
		data.elements.hammerleft.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		data.elements.hammerleft.on('swipeleft',function(e) {
			e.preventDefault();
			controls.lefttransplus();
		}).on('swiperight',(e) => {
			e.preventDefault();
			controls.lefttransminus();
		});

		data.elements.hammerleft.on('swipedown',function() {
			// e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if(data.lens.left.text.scrollTop === 0) {
				controls.rightcantominus();
			}
		}).on('swipeup',function(e) {
			e.preventDefault();
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one
			if(Math.abs(data.lens.left.text.scrollTop + data.lens.left.text.clientHeight - data.lens.left.text.scrollHeight) < 4) {
				controls.rightcantoplus();
			}
		});
	},
	keys: function() {
		// key controls

		document.body.onkeydown = (e) => {
			e.preventDefault();
			if((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev","on");
				controls.righttransminus();
			}
			if((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext","on");
				controls.righttransplus();
			}
			if((e.keyCode || e.which) === 38) {
				dom.addclass("#navup","on");
				controls.rightcantominus();
			}
			if((e.keyCode || e.which) === 40) {
				dom.addclass("#navdown","on");
				controls.rightcantoplus();
			}

			if((e.keyCode || e.which) === 33) {	// pageup: right now this goes to the previous canto
				dom.addclass("#navup","on");
				controls.rightcantominus();
			}
			if((e.keyCode || e.which) === 34) {	// pagedown: right now this goes to the next canto
				dom.addclass("#navdown","on");
				controls.rightcantoplus();
			}

			if((e.keyCode || e.which) === 36) {	// home: right now this goes to the first canto
				dom.addclass("#navup","on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: 0,
					side: "right",
					percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
			}
			if((e.keyCode || e.which) === 35) {	// end: right now this goes to the last canto
				dom.addclass("#navdown","on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.cantocount - 1,
					side: "right",
					percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
			}
		};
	}
};

module.exports = controls;
