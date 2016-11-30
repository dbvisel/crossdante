// version 4: now going to ES6 & Babel

"use strict";

const Hammer = require("hammerjs");
const Fastclick = require("fastclick");
const Velocity = require("velocity-animate");

const dom = require("./dom");
let appdata = require("./appdata");

var app = {
	initialize: function() {
		console.log("initializing!");
		this.bindEvents();

		// basic doc setup

		appdata.elements.lens = document.getElementById("lens");
		appdata.elements.main = document.getElementById("main");
		appdata.elements.content = document.getElementById("content");
		appdata.elements.text = document.getElementById("text");
		appdata.elements.slider = document.getElementById("slider");


		// set up about page

		document.title = "Cross Dante " + appdata.booktitle;
		document.getElementById("abouttext").innerHTML = appdata.description;

		// set up current translation list (initially use all of them)

		for(let i in appdata.translationdata) {
			appdata.currenttranslationlist.push(appdata.translationdata[i].translationid);
			document.getElementById("textsources").innerHTML += `<li>${appdata.translationdata[i].translationfullname}, <em>${appdata.translationdata[i].title}:</em> ${appdata.translationdata[i].source}</li>`;
		}

		appdata.currenttranslation = appdata.currenttranslationlist[0];

		// check to see if there are saved localstorage, if so, take those values

	},
	bindEvents: function() {
		console.log("binding events!");
		document.addEventListener('deviceready', this.onDeviceReady, false);
		window.addEventListener("resize", this.resize, false);

		// start fastclick

		if ('addEventListener' in document) {
			document.addEventListener('DOMContentLoaded', () => {
				Fastclick(document.body);
			}, false);
		}

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

						if(appdata.currentpage == "lens" && appdata.elements.text.scrollTop === 0) {
							app.setlens(appdata.currenttranslation, appdata.currentcanto-1,1);
						}
						return;
					}
				}
			};

			document.addEventListener('touchstart', touchstartHandler, false);
			document.addEventListener('touchmove', touchmoveHandler, false);
		});

	},
	helpers: {

		// this wouldn't work as a real module! refactor?

		gosettings: function(element) {
			element.onclick = () => {
				app.setpage("settings");
			};
		},
		setupnote: function(el) {
			el.onclick = function(e) {
				e.stopPropagation();

				let thisnote = this.getAttribute("data-notenumber");
				let notetext = document.querySelector(`.notetext[data-notenumber="${thisnote}"]`).innerHTML;
				app.hidenotes();
				let insert = dom.create(`<div class="notewindow" id="notewindow">
						${notetext}
					</div>`);
				appdata.elements.main.appendChild(insert);
				document.getElementById("notewindow").onclick = () => {
					app.hidenotes();
				};
			};
		},
		checkboxgo: function(el) {
			el.onclick = function() {
				app.changetranslation(this.id.replace("check-",""),document.getElementById(this.id).checked);
			};
		},
		checkboxspango: function(el) {
			el.onclick = function() {
				document.getElementById(`check-${this.id}`).checked = !document.getElementById(`check-${this.id}`).checked;
				app.changetranslation(this.id,document.getElementById(`check-${this.id}`).checked);
			};
		}
	},
	setupcontrols: function() {

		// button controls
		document.getElementById("navprev").onclick = () => {
			app.setlens(app.nexttrans(appdata.currenttranslation),appdata.currentcanto);
		};
		document.getElementById("navnext").onclick = () => {
			app.setlens(app.prevtrans(appdata.currenttranslation),appdata.currentcanto);
		};
		document.getElementById("navup").onclick = () => {
			app.setlens(appdata.currenttranslation,appdata.currentcanto-1,0);
		};
		document.getElementById("navdown").onclick = () => {
			app.setlens(appdata.currenttranslation,appdata.currentcanto+1,0);
		};
		// initial settings

		document.getElementById("aboutlink").onclick = () => {
			app.setpage("about");
		};
		document.getElementById("helplink").onclick = () => {
			app.setpage("help");
		};
		document.getElementById("daymode").onclick = () => {
			dom.removeclass("body","nightmode");
			dom.addclass("#nightmode","off");
			dom.removeclass("#daymode","off");
			appdata.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = () => {
			dom.addclass("body","nightmode");
			dom.removeclass("#nightmode","off");
			dom.addclass("#daymode","off");
			appdata.nightmode = true;
		};

		// document.querySelectorAll(".backtosettings").forEach(app.helpers.gosettings);
		for(let i of document.querySelectorAll(".backtosettings")) {
			app.helpers.gosettings(i);
		}

		// swipe controls

		let hammertime = new Hammer(appdata.elements.lens); // does this need to be a global?
		hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		hammertime.on('swipeleft',() => {
			app.setlens(app.nexttrans(appdata.currenttranslation),appdata.currentcanto);
		}).on('swiperight',() => {
			app.setlens(app.prevtrans(appdata.currenttranslation),appdata.currentcanto);
		});

		hammertime.on('swipedown',(e) => {
			e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if(appdata.elements.text.scollTop === 0) {
				app.setlens(appdata.currenttranslation,appdata.currentcanto-1,1);  // this needs to be at the bottom!
			}
		}).on('swipeup',() => {
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one


			if(Math.abs(appdata.elements.text.scrollTop + appdata.elements.text.clientHeight - appdata.elements.text.scrollHeight) < 8) {
				app.setlens(appdata.currenttranslation,appdata.currentcanto+1);
			}
		});

		// key controls

		document.body.onkeydown = (e) => {
			e.preventDefault();
			if((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev","on");
				app.setlens(app.prevtrans(appdata.currenttranslation),appdata.currentcanto);
			}
			if((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext","on");
				app.setlens(app.nexttrans(appdata.currenttranslation),appdata.currentcanto);
			}
			if((e.keyCode || e.which) === 38) {
				dom.addclass("#navup","on");
				app.setlens(appdata.currenttranslation,appdata.currentcanto-1);
			}
			if((e.keyCode || e.which) === 40) {
				dom.addclass("#navdown","on");
				app.setlens(appdata.currenttranslation,appdata.currentcanto+1,0);
			}
		};
		document.body.onkeyup = (e) => {
			e.preventDefault();
			dom.removeclass(".button","on");
		};

		// page controls

		document.querySelector("#navtitle").onclick = () => {
			app.setpage("lens");
		};
		document.querySelector("#navsettings").onclick = () => {
			if(appdata.currentpage == "settings") {
				//      if(appdata.currenttranslationlist.indexOf(appdata.translationdata[appdata.currenttranslation].translationid) > -1 ) {}
				app.setpage("lens");
			} else {
				app.updatesettings();
				app.setpage("settings");
			}
		};
		appdata.elements.main.onclick = () => {
			app.hidenotes();
		};
	},
	setupnotes: function() {
		let count = 0;
		let notes = document.querySelectorAll(".note");

		for(let i = 0; i < notes.length; i++) {
			let children = notes[i].children;
			for(let j=0; j < children.length; j++) {
				if(dom.hasclass(children[j],"notetext")) {
					children[j].setAttribute("data-notenumber", count);
				}
				if(dom.hasclass(children[j],"noteno")) {
					children[j].setAttribute("data-notenumber", count);
					app.helpers.setupnote(children[j]);
				}
			}
			count++;
		}
	},
	resize: function() {
		appdata.windowwidth = window.innerWidth;
		appdata.windowheight = window.innerHeight;
		console.log(`The window has been resized! New width: ${appdata.windowwidth},${appdata.windowheight}`);
		appdata.lenswidth = appdata.windowwidth;
		appdata.lensheight = appdata.windowheight - document.getElementById("navbar").clientHeight;

		dom.addclass(".page",appdata.lenswidth > appdata.lensheight ? "landscape" : "portrait");
		dom.removeclass(".page",appdata.lenswidth > appdata.lensheight ? "portrait" : "landscape");

		appdata.elements.main.style.width = appdata.lenswidth+"px";
		appdata.elements.main.style.height = appdata.windowheight+"px";
		appdata.elements.content.style.width = appdata.lenswidth+"px";
		appdata.elements.content.style.height = appdata.lensheight+"px";

		appdata.lineheight = appdata.windowwidth/25;
		appdata.textwidth = appdata.windowwidth;
		app.setlens(appdata.currenttranslation,appdata.currentcanto);
	},
	nexttrans: function(giventranslation) {
		if(appdata.currenttranslationlist.length > 1) {
			if((appdata.currenttranslationlist.indexOf(giventranslation) + 1) == appdata.currenttranslationlist.length ) {
				return appdata.currenttranslationlist[0];
			} else {
				return appdata.currenttranslationlist[(appdata.currenttranslationlist.indexOf(giventranslation) + 1)];
			}
		} else {
			return giventranslation;
		}
	},
	prevtrans: function(giventranslation) {
		if(appdata.currenttranslationlist.length > 1) {
			if(appdata.currenttranslationlist.indexOf(giventranslation) == 0) {
				return appdata.currenttranslationlist[appdata.currenttranslationlist.length - 1];
			} else {
				return appdata.currenttranslationlist[(appdata.currenttranslationlist.indexOf(giventranslation) - 1)];
			}
		} else {
			return giventranslation;
		}
	},
	setlens: function(newtrans, newcanto, percentage) {
		console.log(`\nSetlens called for ${newtrans}, canto ${newcanto}`);
		dom.removebyselector("#oldtext"); // attempt to fix flickering if too fast change

		let changetrans = false;
		let oldindex = appdata.currenttranslationlist.indexOf(appdata.currenttranslation); // the number of the old translation
		let newindex = appdata.currenttranslationlist.indexOf(newtrans); // the number of the trans we're going to

		if(appdata.currentpage == "lens") {

			// if page isn't set to "lens" this doesn't do anything

			if((newindex - oldindex) !== 0) {
				changetrans = true;
				percentage = (appdata.elements.text.scrollTop /*+ appdata.elements.text.clientHeight*/)/appdata.elements.text.scrollHeight;
				console.log(`—>Current percentage: ${percentage}`);
			}

			if(newcanto >= appdata.cantocount) {
				newcanto = 0;
			} else {
				if(newcanto < 0) {
					newcanto = appdata.cantocount-1;
				}
			}

			// need to figure which translationdata we need

			let newdata = 0;
			let olddata = 0;

			for(var j in appdata.translationdata) {
				if(newtrans == appdata.translationdata[j].translationid) {
					newdata = j;
				}
				if(appdata.currenttranslation == appdata.translationdata[j].translationid) {
					olddata = j;
				}
			}

			if(newindex !== oldindex) {

				// console.log("Change in translation!");

				appdata.elements.text.id = "oldtext";

				// if new is bigger than old AND ( old is not 0 OR new is not the last one )
				// OR if new is 0 and old is the last one

				if( ((newindex > oldindex) && (oldindex > 0 || newindex !== (appdata.currenttranslationlist.length - 1 ))) || (newindex == 0 && oldindex == (appdata.currenttranslationlist.length-1)) ) {

					// console.log("Going right");  // we are inserting to the right

					let insert = dom.create(`<div id="text" class="textframe ${ appdata.translationdata[newdata].translationclass }" style="left:100%;">${ appdata.textdata[newdata].text[newcanto] }</div>`);
					appdata.elements.slider.appendChild(insert);
					Velocity(appdata.elements.slider, {'left':"-100%"}, {
						duration: appdata.delay,
						mobileHA: false,
						complete: function() {
							dom.removebyselector("#oldtext");
							appdata.elements.slider.style.left = "0";
							appdata.elements.text.style.left = "0";
						}
					});
				} else {

					// console.log("Going left"); // we are inserting to the left

					let insert = dom.create(`<div id="text" class="textframe ${ appdata.translationdata[newdata].translationclass }" style="left:-100%;">${ appdata.textdata[newdata].text[newcanto] }</div>`);
					appdata.elements.slider.insertBefore(insert, appdata.elements.slider.childNodes[0]);
					Velocity(appdata.elements.slider, {'left':"100%"}, {
						duration: appdata.delay,
						mobileHA: false,
						complete: function() {
							dom.removebyselector("#oldtext");
							appdata.elements.slider.style.left = "0";
							appdata.elements.text.style.left = "0";
						}
					});
				}
				appdata.elements.text = document.getElementById("text");
			} else {

				// console.log("No change in translation!"); // not shift left/shift right – do normal thing

				appdata.elements.text.innerHTML = appdata.textdata[newdata].text[newcanto];
				dom.removeclass("#text",appdata.translationdata[olddata].translationclass);
				dom.addclass("#text",appdata.translationdata[newdata].translationclass);
			}

			app.setupnotes();
			appdata.currenttranslation = newtrans;
			appdata.currentcanto = newcanto;


			app.fixpadding();

			// set percentage: this is terrible! fix this!
			// first: try to figure out how many lines we have? Can we do that?

			if(changetrans) {

				// this method still isn't great! it tries to round to current lineheight
				// to avoid cutting off lines

				let scrollto = app.rounded(percentage * appdata.elements.text.scrollHeight);
				appdata.elements.text.scrollTop = scrollto;
			} else {
				if(percentage > 0) {
					appdata.elements.text.scrollTop = appdata.elements.text.scrollHeight;
				} else {
					appdata.elements.text.scrollTop = 0;
				}
			}

			if(appdata.currentcanto > 0) {
				document.getElementById("navtitle").innerHTML = `${appdata.translationdata[newdata].translationshortname} · <strong>Canto ${appdata.currentcanto}</strong>`;
			} else {
				document.getElementById("navtitle").innerHTML = "&nbsp;";
			}
		}
		app.savecurrentdata();
	},
	rounded: function(pixels) {

		// this is still a mess, fix this

		return appdata.lineheight * Math.floor(pixels / appdata.lineheight);

	},
	fixpadding: function() {
		const divs = document.querySelectorAll("#text p");
		var div, padding, desiredwidth;
		let maxwidth = 0;

		if(dom.hasclass(appdata.elements.text,"poetry")) {

			// this is poetry, figure out longest line

			appdata.elements.text.style.paddingLeft = 0;
			for(let i=0; i<divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";
				if(div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			console.log("—>text width: " + appdata.textwidth);
			console.log("—>max width: " + maxwidth);

			appdata.elements.text.style.paddingLeft = (appdata.textwidth - maxwidth)/2+"px";
			appdata.elements.text.style.paddingRight = (appdata.textwidth - maxwidth)/2+"px";
		} else {

			// this is prose, standardized padding

			desiredwidth = 75; // this is in vw

			console.log("—>text width: " + appdata.textwidth);
			console.log("—>desired width: " + desiredwidth);
			console.log("—>lineheight: " + appdata.lineheight);

			//		console.log(lenswidth + " "+desiredwidth);
			//		var padding = (lenswidth - desiredwidth)/2;

			padding = (100 - desiredwidth)/2;
			/*
			if((desiredwidth + 2) > lenswidth) {
				appdata.elements.text.style.paddingLeft = "1vw";
				appdata.elements.text.style.paddingRight = "1vw";
			} else {
				*/
			appdata.elements.text.style.paddingLeft = padding+"vw";
			appdata.elements.text.style.paddingRight = padding+"vw";
			//		}
		}

	},
	hidenotes: function() {
		dom.removebyselector(".notewindow");
	},
	updatesettings: function() {

		// add in translation chooser

		dom.removebyselector("#translatorlist");
		let insert = dom.create('<ul id="translatorlist"></ul>');
		document.getElementById("translationchoose").appendChild(insert);
		const translatorlist = document.querySelector("#translatorlist");
		for(let i in appdata.translationdata) {
			insert = dom.create(`<li>
					<input type="checkbox" id="check-${appdata.translationdata[i].translationid}" />
					<span id="${appdata.translationdata[i].translationid}" >${appdata.translationdata[i].translationfullname}</span>
				</li>`);
			translatorlist.appendChild(insert);
			document.getElementById("check-"+appdata.translationdata[i].translationid).checked = (appdata.currenttranslationlist.indexOf(appdata.translationdata[i].translationid) > -1);
		}

		// document.querySelectorAll("#translatorlist input[type=checkbox]").forEach(app.helpers.checkboxgo);
		for(let i of document.querySelectorAll("#translatorlist input[type=checkbox]")) {
			app.helpers.checkboxgo(i);
		}
		// document.querySelectorAll("#translatorlist span").forEach(app.helpers.checkboxspango);
		for(let i of document.querySelectorAll("#translatorlist span")) {
			app.helpers.checkboxspango(i);
		}

		// add in toc

		dom.removebyselector("#selectors");
		insert = dom.create(`<div id="selectors">
				<p>Canto: <select id="selectcanto"></select></p>
				<p>Translation: <select id="selecttranslator"></select></p>
				<p><span id="selectgo">Go</span></p>
			</div>`);
		document.getElementById("translationgo").appendChild(insert);
		for(let i = 0; i < appdata.cantocount; i++) {
			insert = dom.create(`<option id="canto${i}" ${((appdata.currentcanto == i) ? "selected" : "")}>${appdata.cantotitles[i]}</option>`);
			document.getElementById("selectcanto").appendChild(insert);
		}
		for(let i in appdata.currenttranslationlist) {
			for(let j = 0; j < appdata.translationdata.length; j++) {
				if(appdata.translationdata[j].translationid == appdata.currenttranslationlist[i]) {
					insert = dom.create(`<option id="tr_${appdata.translationdata[j].translationid}" ${((appdata.currenttranslationlist.indexOf(appdata.currenttranslation) == i) ? "selected" : "")}>${appdata.translationdata[j].translationfullname}</option>`);
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = () => {
			let selected = document.getElementById("selecttranslator");
			let thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			let thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for(let j = 0; j < appdata.translationdata.length; j++) {
				if(appdata.currenttranslationlist[j] == thistrans) {
					app.setpage("lens");
					app.setlens(appdata.currenttranslationlist[j],thiscanto,0);
				}
			}
		};
	},
	savecurrentdata: function() {

		// this should store appdate on localstorage (does that work for mobile?)
		// also if we're not on mobile, set canto/translation in hash


	},
	changetranslation: function(thisid, isset) {
		for(let i in appdata.translationdata) {
			if(thisid == appdata.translationdata[i].translationid) {
				if(isset) {
					appdata.currenttranslationlist.push(thisid);
					appdata.translationcount++;
				} else {
					if(appdata.translationcount > 1) {
						let j = appdata.currenttranslationlist.indexOf(thisid);
						if (j > -1) {
							appdata.currenttranslationlist.splice(j, 1);
						}
						appdata.translationcount--;
					} else {
						// there's only one translation in the list, do not delete last
						document.getElementById("check-"+thisid.toLowerCase()).checked = true;
					}
				}
			}
			app.savecurrentdata();
		}

		let newlist = [];
		for(let i in appdata.translationdata) {
			if(appdata.currenttranslationlist.indexOf(appdata.translationdata[i].translationid) > -1) {
				newlist.push(appdata.translationdata[i].translationid);
			}
		}
		appdata.currenttranslationlist = newlist.slice();

		if(appdata.currenttranslationlist.indexOf(appdata.currenttranslation) < 0) {
			appdata.currenttranslation = appdata.currenttranslationlist[0];
		}

		app.updatesettings();
	},
	setpage: function(newpage) {
		dom.removeclass(".page","on");
		dom.addclass(".page#"+newpage,"on");
		appdata.currentpage = newpage;
		if(newpage !== "lens") {
			// set title to be whatever the h1 is

			let newtitle = document.querySelector("#" + newpage + " h1").innerHTML;
			document.getElementById("navtitle").innerHTML = newtitle;
		} else {
			app.resize();
		}
	},
	onDeviceReady: function() {
		console.log("device ready!");
		app.setup();
	},
	setup: function() {
		app.setupnotes();
		app.setupcontrols();
		app.setpage("lens");
	}
};

module.exports = app;
