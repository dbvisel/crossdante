// controls.js

"use strict";

const Hammer = require("hammerjs");
const settings = require("./settings");
const helpers = require("./helpers");
const resize = require("./resize");
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
	navbar: function() {
		// button controls
		document.querySelector("#navbarleft .navprev").onclick = function() {
			data.watch.setlens = {
				translation: helpers.nexttrans(data.lens.left.translation),
				canto: data.canto,
				side: "left",
				percentage: 999, // is this okay?
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.nexttrans(data.lens.left.translation),data.canto,"left");
		};
		document.querySelector("#navbarleft .navnext").onclick = function() {
			data.watch.setlens = {
				translation: helpers.prevtrans(data.lens.left.translation),
				canto: data.canto,
				side: "left",
				percentage: 999, // is this okay?
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.prevtrans(data.lens.left.translation),data.canto,"left");
		};
		document.querySelector("#navbarleft .navup").onclick = function() {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto-1,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.right.translation,data.canto-1,"right",0);
		};
		document.querySelector("#navbarleft .navdown").onclick = function() {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto+1,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.right.translation,data.canto+1,"right",0);
		};
		document.querySelector("#navbarright .navprev").onclick = function() {
			data.watch.setlens = {
				translation: helpers.nexttrans(data.lens.right.translation),
				canto: data.canto,
				side: "right",
				percentage: 999, // is this okay?
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.nexttrans(data.lens.right.translation),data.canto,"right");
		};
		document.querySelector("#navbarright .navnext").onclick = function() {
			data.watch.setlens = {
				translation: helpers.prevtrans(data.lens.right.translation),
				canto: data.canto,
				side: "right",
				percentage: 999, // is this okay?
				trigger: !data.watch.setlens.trigger
			};
			//app.setlens(helpers.prevtrans(data.lens.right.translation),data.canto,"right");
		};
		document.querySelector("#navbarright .navup").onclick = function() {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto - 1,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.right.translation,data.canto-1,"right",0);
		};
		document.querySelector("#navbarright .navdown").onclick = function() {
			data.watch.setlens = {
				translation: data.lens.right.translation,
				canto: data.canto + 1,
				side: "right",
				percentage: 0,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(data.lens.right.translation,data.canto+1,"right",0);
		};
		document.querySelector("#navbarleft .navclose").onclick = function() {
			dom.removeclass("body","twinmode");
			dom.addclass("#twinmode","off");
			dom.removeclass("#singlemode","off");
			data.usersettings.twinmode = false;
			resize.check();
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

		if(data.usersettings.twinmode) {
			dom.removeclass("#twinmode","off");
			dom.addclass("#singlemode","off");
		} else {
			dom.addclass("#twinmode","off");
			dom.removeclass("#singlemode","off");
		}

		if(data.usersettings.nightmode) {
			dom.removeclass("#nightmode","off");
			dom.addclass("#daymode","off");
		} else {
			dom.addclass("#nightmode","off");
			dom.removeclass("#daymode","off");
		}

		if(data.usersettings.shownotes) {
			dom.removeclass("#shownotes","off");
			dom.addclass("#hidenotes","off");
		} else {
			dom.addclass("#shownotes","off");
			dom.removeclass("#hidenotes","off");
		}

		document.getElementById("daymode").onclick = function() {
			dom.removeclass("body","nightmode");
			dom.addclass("#nightmode","off");
			dom.removeclass("#daymode","off");
			data.usersettings.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = function() {
			dom.addclass("body","nightmode");
			dom.removeclass("#nightmode","off");
			dom.addclass("#daymode","off");
			data.usersettings.nightmode = true;
		};
		if(document.getElementById("singlemode") !== null) {
			document.getElementById("singlemode").onclick = function() {
				dom.removeclass("body","twinmode");
				dom.addclass("#twinmode","off");
				dom.removeclass("#singlemode","off");
				data.usersettings.twinmode = false;
			};
			document.querySelector("#twinmode").onclick = function() {
				dom.addclass("body","twinmode");
				dom.removeclass("#twinmode","off");
				dom.addclass("#singlemode","off");
				data.usersettings.twinmode = true;
			};
		}

		// show/hide notes

		document.querySelector("#hidenotes").onclick = function() {
			dom.addclass("body","hidenotes");
			dom.addclass("#shownotes","off");
			dom.removeclass("#hidenotes","off");
		};
		document.querySelector("#shownotes").onclick = function() {
			dom.removeclass("body","hidenotes");
			dom.addclass("#hidenotes","off");
			dom.removeclass("#shownotes","off");
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
			data.watch.setlens = {
				translation: helpers.nexttrans(data.lens.right.translation),
				canto: data.canto,
				side: "right",
				percentage: 999,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.nexttrans(data.lens.right.translation),data.canto,"right");
		}).on('swiperight',function(e) {
			e.preventDefault();
			data.watch.setlens = {
				translation: helpers.prevtrans(data.lens.right.translation),
				canto: data.canto,
				side: "right",
				percentage: 999,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.prevtrans(data.lens.right.translation),data.canto,"right");
		});

		data.elements.hammerright.on('swipedown',function() {
			// e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if(data.lens.right.text.scrollTop === 0) {
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					percentage: 1, // this needs to be at the bottom
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto-1,"right",1);  // this needs to be at the bottom!
			}
		}).on('swipeup',(e) => {
			e.preventDefault();
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one
			if(Math.abs(data.lens.right.text.scrollTop + data.lens.right.text.clientHeight - data.lens.right.text.scrollHeight) < 4) {
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto + 1,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto+1,"right");
			}
		});
		data.elements.hammerleft.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		data.elements.hammerleft.on('swipeleft',function(e) {
			e.preventDefault();
			data.watch.setlens = {
				translation: helpers.nexttrans(data.lens.left.translation),
				canto: data.canto,
				side: "left",
				percentage: 999,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.nexttrans(data.lens.left.translation),data.canto,"left");
		}).on('swiperight',(e) => {
			e.preventDefault();
			data.watch.setlens = {
				translation: helpers.prevtrans(data.lens.left.translation),
				canto: data.canto,
				side: "left",
				percentage: 999,
				trigger: !data.watch.setlens.trigger
			};
			// app.setlens(helpers.prevtrans(data.lens.left.translation),data.canto,"left");
		});

		data.elements.hammerleft.on('swipedown',function() {
			// e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if(data.lens.left.text.scrollTop === 0) {
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					percentage: 1, // this needs to be at the bottom
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto-1,"right",1);  // this needs to be at the bottom!
			}
		}).on('swipeup',function(e) {
			e.preventDefault();
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one
			if(Math.abs(data.lens.left.text.scrollTop + data.lens.left.text.clientHeight - data.lens.left.text.scrollHeight) < 4) {
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto + 1,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto+1,"right");
			}
		});
	},
	keys: function() {
		// key controls

		document.body.onkeydown = (e) => {
			e.preventDefault();
			if((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev","on");
				data.watch.setlens = {
					translation: helpers.prevtrans(data.lens.right.translation),
					canto: data.canto,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(helpers.prevtrans(data.lens.right.translation),data.canto,"right");
			}
			if((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext","on");
				data.watch.setlens = {
					translation: helpers.nexttrans(data.lens.right.translation),
					canto: data.canto,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(helpers.nexttrans(data.lens.right.translation),data.canto,"right");
			}
			if((e.keyCode || e.which) === 38) {
				dom.addclass("#navup","on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					// percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto-1,"right");
			}
			if((e.keyCode || e.which) === 40) {
				dom.addclass("#navdown","on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto + 1,
					side: "right",
					percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto+1,"right",0);
			}

			if((e.keyCode || e.which) === 33) {	// pageup: right now this goes to the previous canto
				dom.addclass("#navup","on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto-1,"right");
			}
			if((e.keyCode || e.which) === 34) {	// pagedown: right now this goes to the next canto
				dom.addclass("#navdown","on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto + 1,
					side: "right",
					percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.canto+1,"right",0);
			}

			if((e.keyCode || e.which) === 36) {	// home: right now this goes to the first canto
				dom.addclass("#navup","on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: 0,
					side: "right",
					percentage: 999,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,0,"right");
			}
			if((e.keyCode || e.which) === 35) {	// end: right now this goes to the last canto
				dom.addclass("#navdown","on");
				data.watch.setlens = {
					translation: data.lens.right.translation,
					canto: data.canto - 1,
					side: "right",
					percentage: 0,
					trigger: !data.watch.setlens.trigger
				};
				// app.setlens(data.lens.right.translation,data.cantocount-1,"right",0);
			}
		};
	}
};

module.exports = controls;
