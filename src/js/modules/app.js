// version 4: now going to ES6 & Babel
// @//flow

"use strict";

const Fastclick = require("fastclick");
const Velocity = require("velocity-animate");
const WatchJS = require("melanke-watchjs");

const dom = require("./dom");
const fixpadding = require("./fixpadding");
const notes = require("./notes");
const localdata = require("./localdata");
const helpers = require("./helpers");
const resize = require("./resize");
const controls = require("./controls");

let data = require("./appdata");
let device = {};
let watch = WatchJS.watch;
// var unwatch = WatchJS.unwatch;
// var callWatchers = WatchJS.callWatchers;

var app = {
	setlens: function(newtrans: string, newcanto: number, side: string, percentage: number) {

		// potential problem: when this is called without percentage. Right now I'm doing this by setting percentage to 999
		// maybe percentage should be set to NaN?

		console.log(`\nSetlens called for ${newtrans}, canto ${newcanto}, ${side}`);

		// if page isn't set to "lens" this doesn't do anything

		if(data.currentpage == "lens") {

			let changetrans, changecanto = false;
			let thisside = data.lens[side];
			let otherside = (side == "right") ? data.lens.left : data.lens.right;
			let other = (side == "right") ? "left" : "right";
			//		dom.removebyselector("#oldtextleft"); // attempt to fix flickering if too fast change
			//		dom.removebyselector("#oldtextright"); // attempt to fix flickering if too fast change

			let oldtransindex = data.currenttranslationlist.indexOf(thisside.translation); // the number of the old translation in current list
			let newtransindex = data.currenttranslationlist.indexOf(newtrans); // the number of the trans we're going to in currentlist

			if(newcanto !== data.canto) {
				changecanto = true;
				if(newcanto >= data.cantocount) {
					newcanto = 0;
				} else {
					if(newcanto < 0) {
						newcanto = data.cantocount-1;
					}
				}
			}

			if((newtransindex - oldtransindex) !== 0) {
				changetrans = true;
				percentage = (thisside.text.scrollTop /*+ thisside.text.clientHeight*/)/thisside.text.scrollHeight;
				console.log(`—>Current percentage: ${percentage}`);
			}

			// need to figure which translationdata we need from master list of translations

			let othertranslationindex = 0;
			let newtranslationindex = helpers.gettranslationindex(newtrans);
			let oldtranslationindex = helpers.gettranslationindex(thisside.translation);
			if(data.usersettings.twinmode) {
				othertranslationindex = helpers.gettranslationindex(otherside.translation);
			}


			if(changetrans) {

				console.log("Changing translation!");

				// changing translation

				thisside.text.id = `oldtext${side}`;
				let direction = 0;

				// if new is bigger than old AND ( old is not 0 OR new is not the last one )
				// OR if new is 0 and old is the last one

				if( ((newtransindex > oldtransindex) && (oldtransindex > 0 || newtransindex !== (data.currenttranslationlist.length - 1 ))) || (newtransindex == 0 && oldtransindex == (data.currenttranslationlist.length-1)) ) {

					// we are inserting to the right

					let insert = dom.create(`<div id="newtext${side}" class="textframe ${ data.translationdata[newtranslationindex].translationclass }" style="left:100%;"><div class="textinsideframe">${ data.textdata[newtranslationindex].text[newcanto] }</div></div>`);
					thisside.slider.appendChild(insert);
					if(data.usersettings.twinmode) {
						direction = "-50%";
					} else {
						direction = "-100%";
					}
				} else {

					// we are inserting to the left

					let insert = dom.create(`<div id="newtext${side}" class="textframe ${ data.translationdata[newtranslationindex].translationclass }" style="left:-100%;"><div class="textinsideframe">${ data.textdata[newtranslationindex].text[newcanto] }</div></div>`);
					thisside.slider.insertBefore(insert, thisside.slider.childNodes[0]);
					if(data.usersettings.twinmode) {
						direction = "50%";
					} else {
						direction = "100%";
					}
				}

				otherside.slider.style.zIndex = 500;
				Velocity(thisside.slider, {'left':direction}, {
					duration: data.system.delay,
					mobileHA: false,
					complete: function() {
						dom.removebyselector(`#oldtext${side}`);
						otherside.slider.style.zIndex = 1;
						thisside.slider.style.left = "0";
						thisside.text.style.left = "0";
						dom.addclass(`#slider${side} .textframe`, "makescroll");
					}
				});
				thisside.text = document.querySelector(`#newtext${side}`);
				thisside.textinside = document.querySelector(`#newtext${side} .textinsideframe`);
				thisside.translation = newtrans;

				// this method still isn't great! it tries to round to current lineheight
				// to avoid cutting off lines

				let scrollto = helpers.rounded(percentage * document.querySelector(`#newtext${side}`).scrollHeight);
				document.querySelector(`#newtext${side}`).scrollTop = scrollto;
				if(data.usersettings.twinmode) {
					let scrollto = helpers.rounded(percentage * document.querySelector(`#newtext${other}`).scrollHeight);
					document.querySelector(`#newtext${other}`).scrollTop = scrollto;
				}
				console.log("Scrolling to:" + scrollto);
				if(data.usersettings.twinmode) {
					helpers.turnonsynchscrolling();
				}
			}

			if(changecanto || !changetrans) {

				// we are either changing canto OR this is the first run

				if(data.usersettings.twinmode) {
					document.querySelector(`#slider${other} .textinsideframe`).innerHTML = data.textdata[othertranslationindex].text[newcanto];
					dom.removeclass(`#slider${other} .textframe`,data.translationdata[othertranslationindex].translationclass);
					dom.addclass(`#slider${other} .textframe`,data.translationdata[othertranslationindex].translationclass);
					document.querySelector(`#slider${side} .textinsideframe`).innerHTML = data.textdata[newtranslationindex].text[newcanto];
					dom.removeclass(`#slider${side} .textframe`,data.translationdata[oldtranslationindex].translationclass);
					dom.addclass(`#slider${side} .textframe`,data.translationdata[newtranslationindex].translationclass);
				} else {
					document.querySelector(`#slider${side} .textinsideframe`).innerHTML = data.textdata[newtranslationindex].text[newcanto];
					dom.removeclass(`#slider${side} .textframe`,data.translationdata[oldtranslationindex].translationclass); // is this not working for multiple classes?
					dom.addclass(`#slider${side} .textframe`,data.translationdata[newtranslationindex].translationclass); // is this not working for multiple classes?
				}
				data.canto = newcanto;

				if(percentage > 0 && percentage !== 999) {
					document.querySelector(`#newtext${side}`).scrollTop = document.querySelector(`#newtext${side}`).scrollHeight;
					if(data.usersettings.twinmode) {
						document.querySelector(`#newtext${other}`).scrollTop = document.querySelector(`#newtext${other}`).scrollHeight;
					}
				} else {
					document.querySelector(`#newtext${side}`).scrollTop = 0;
					if(data.usersettings.twinmode) {
						document.querySelector(`#newtext${other}`).scrollTop = 0;
					}
				}
			}

			if(data.system.responsive) {
				// helpers.fixpaddingresponsive(thisside);
				fixpadding.responsive(thisside);
				if(data.usersettings.twinmode) {
					// helpers.fixpaddingresponsive(otherside);
					fixpadding.responsive(otherside);
				}
			} else {
				//helpers.fixpadding(thisside);
				fixpadding.regular(thisside);
				if(data.usersettings.twinmode) {
					//helpers.fixpadding(otherside);
					fixpadding.regular(otherside);
				}
			}

			// deal with title bar

			if(data.canto > 0) {
				thisside.titlebar.innerHTML = `${data.translationdata[newtranslationindex].translationshortname} · <strong>Canto ${data.canto}</strong>`;
				if(data.usersettings.twinmode) {
					if(data.usersettings.twinmode) {
						otherside.titlebar.innerHTML = `${data.translationdata[othertranslationindex].translationshortname} · <strong>Canto ${data.canto}</strong>`;
					}
				}
			} else {
				thisside.titlebar.innerHTML = "&nbsp;";
				if(data.usersettings.twinmode) {
					otherside.titlebar.innerHTML = "&nbsp;";
				}
			}

			// set up notes

			notes.setup();

			// turn on synch scrolling

			if(data.usersettings.twinmode) {
				helpers.turnonsynchscrolling();
			}

			// record changes

			localdata.save();
		}
	},
	setpage: function(newpage) {
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

			resize.check();
		}
	},
	initialize: function() {
		console.log("initializing!");
		this.bindEvents();

		// check to see if there are saved localstorage, if so, take those values

	},
	bindEvents: function() {
		console.log("binding events!");
		var testapp = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1;
		var testcordova = !(window.cordova === undefined); // need this as well for dev
		if(testapp && testcordova) {
			document.addEventListener('deviceready', app.onDeviceReady, false);
		} else {
			app.setup();
		}

		window.addEventListener("resize", resize.check, false);

		// start fastclick

		if ('addEventListener' in document) {

			// This is firing for non-Cordova – should it?

			document.addEventListener('DOMContentLoaded', () => {
				Fastclick.attach(document.body);
			}, false);
		}
	},
	onDeviceReady: function() {
		data.system.oncordova = true; 					// we're running on cordova
		data.system.platform = device.plaform;	// should be either "iOS" or "Android"
		console.log(device.cordova);
		console.log("Cordova running. Platform: " + data.system.platform);
		app.setup();
	},
	setup: function() {
		console.log("In setup");

		// basic doc setup

		data.setup();

		// attach watchers to data.watch.setpage and data.watch.setlens

		watch(data.watch, "setpage", function(){
			// console.log("data.watch.setpage changed!");
			app.setpage(data.watch.setpage);
		});

		watch(data.watch, "setlens", function(){
			// console.log(data.watch.setlens);
			app.setlens(data.watch.setlens.translation, data.watch.setlens.canto, data.watch.setlens.side, data.watch.setlens.percentage);
		});

		watch(data.watch, "localsave", function() {
			// this is called by inverting the value of data.watch.localsave
			localdata.save();
		});


		document.title = "Cross Dante " + data.booktitle;

		if(data.usersettings.nightmode) {
			dom.addclass("body","nightmode");
		} else {
			dom.removeclass("body","nightmode");
		}

		// set up current translation list (initially use all of them)

		for(let i =0; i < data.translationdata.length; i++) {
			data.currenttranslationlist.push(data.translationdata[i].translationid);
			document.getElementById("textsources").innerHTML += `<li>${data.translationdata[i].translationfullname}, <em>${data.translationdata[i].title}:</em> ${data.translationdata[i].source}</li>`;
		}

		data.lens.right.translation = data.currenttranslationlist[0];
		if(!data.system.oncordova) {
			// attempt to fix android pull down to refresh
			// code from http://stackoverflow.com/questions/29008194/disabling-androids-chrome-pull-down-to-refresh-feature
			window.addEventListener('load', function() {
				var maybePreventPullToRefresh = false;
				var lastTouchY = 0;
				var touchstartHandler = function(e) {
					if (e.touches.length != 1) return;
					lastTouchY = e.touches[0].clientY;
					// Pull-to-refresh will only trigger if the scroll begins when the
					// document's Y offset is zero.
					maybePreventPullToRefresh = window.pageYOffset == 0;
				};

				var touchmoveHandler = function(e) {
					var touchY = e.touches[0].clientY;
					var touchYDelta = touchY - lastTouchY;
					lastTouchY = touchY;

					if (maybePreventPullToRefresh) {
						// To suppress pull-to-refresh it is sufficient to preventDefault the
						// first overscrolling touchmove.
						maybePreventPullToRefresh = false;
						if (touchYDelta > 0) {
							e.preventDefault();

							if(data.currentpage == "lens" && data.lens.right.text.scrollTop < 1) {
								data.watch.setlens = {
									translation: data.lens.right.translation,
									canto: data.canto - 1,
									side: "right",
									percentage: 1,
									trigger: !data.watch.setlens.trigger
								};
								// app.setlens(data.lens.right.translation, data.canto-1,"right",1);
							}
							return;
						}
					}
				};
				document.addEventListener('touchstart', touchstartHandler, false);
				document.addEventListener('touchmove', touchmoveHandler, false);
			});
		}

		fixpadding.preprocess();

		controls.start();		// this sets up controls
		localdata.read();

		dom.addclass("body",data.bookname);
		dom.addclass("body",data.system.oncordova ? "cordova" : "web");
		dom.removebyselector("#loadingscrim");
		data.watch.setpage = "lens";
	}
};

module.exports = app;
