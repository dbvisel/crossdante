// version 4: now going to ES6 & Babel

"use strict";

var Hammer = require("hammerjs");
var Fastclick = require("fastclick");	// why is this not working?

var dom = require("./dom");
var appdata = require("./appdata");

var app = {
	initialize: function() { // could set this to choose translations?
		console.log("initializing!");
		this.bindEvents();

		// basic doc setup

		appdata.textdata[0] = require("./translations/italian.js");
		appdata.textdata[1] = require("./translations/longfellow.js");
		appdata.textdata[2] = require("./translations/norton.js");
		appdata.textdata[3] = require("./translations/wright.js");
		appdata.textdata[4] = require("./translations/carlyle.js");

		appdata.elements.lens = document.getElementById("lens");
		appdata.elements.main = document.getElementById("main");
		appdata.elements.content = document.getElementById("content");
		appdata.elements.text = document.getElementById("text");

		// set up current translation list (initially use all of them)

		for(var i in appdata.translationdata) {
			appdata.currenttranslationlist.push(appdata.translationdata[i].translationid);
		}

		// check to see if there are saved localstorage, if so, take those values

	},
	bindEvents: function() {
		console.log("binding events!");
		document.addEventListener('deviceready', this.onDeviceReady, false);
		window.addEventListener("resize", this.resize, false);

		// start fastclick

		if ('addEventListener' in document) {
			document.addEventListener('DOMContentLoaded', function() {
				Fastclick.attach(document.body);
			}, false);
		}
	},
	helpers: {
		gosettings: function(element) {
			element.onclick = function() {
				app.setpage("settings");
			};
		},
		setupnote: function(el) {
			el.onclick = function(e) {
				e.stopPropagation();
				var thisnote = this.getAttribute("data-notenumber");
				var notetext = document.querySelector(`.notetext[data-notenumber="${thisnote}"]`).innerHTML;
				app.hidenotes();
				var insert = dom.create(`<div class="notewindow" id="notewindow">${notetext}</div>`);
				appdata.elements.main.appendChild(insert);
				document.getElementById("notewindow").onclick = function() {
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
		var hammertime;

		// button controls
		document.getElementById("navprev").onclick = function () {
			app.setlens(appdata.currenttranslation-1,appdata.currentcanto);
		};
		document.getElementById("navnext").onclick = function () {
			app.setlens(appdata.currenttranslation+1,appdata.currentcanto);
		};
		document.getElementById("navup").onclick = function () {
			app.setlens(appdata.currenttranslation,appdata.currentcanto-1,0);
		};
		document.getElementById("navdown").onclick = function () {
			app.setlens(appdata.currenttranslation,appdata.currentcanto+1,0);
		};
		// initial settings

		document.getElementById("aboutlink").onclick = function() {
			app.setpage("about");
		};
		document.getElementById("helplink").onclick = function() {
			app.setpage("help");
		};
		document.getElementById("daymode").onclick = function() {
			dom.removeclass("body","nightmode");
			dom.addclass("#nightmode","off");
			dom.removeclass("#daymode","off");
			appdata.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = function() {
			dom.addclass("body","nightmode");
			dom.removeclass("#nightmode","off");
			dom.addclass("#daymode","off");
			appdata.nightmode = true;
		};

		document.querySelectorAll(".backtosettings").forEach(app.helpers.gosettings);
// ES6: can we changed this to a for ... in loop?

	// swipe controls

		hammertime = new Hammer(appdata.elements.lens);
		hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		hammertime.on('swipeleft',function() {
			app.setlens(appdata.currenttranslation+1,appdata.currentcanto);
		}).on('swiperight',function() {
			app.setlens(appdata.currenttranslation-1,appdata.currentcanto);
		});

		hammertime.on('swipedown',function() {
			if(appdata.elements.text.scollTop === 0) {
				app.setlens(appdata.currenttranslation,appdata.currentcanto-1,1);  // this needs to be at the bottom!
			}
		}).on('swipeup',function() {
// if difference between current scroll position + height of frame & complete height
// of column is less than 8, go to the next one

			if(Math.abs(appdata.elements.text.scrollTop + appdata.elements.text.clientHeight - appdata.elements.text.scrollHeight) < 8) {
				app.setlens(appdata.currenttranslation,appdata.currentcanto+1);
			}
		});

	// key controls

		document.body.onkeydown = function(e) {
			e.preventDefault();
			if((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev","on");
				app.setlens(appdata.currenttranslation-1,appdata.currentcanto);
			}
			if((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext","on");
				app.setlens(appdata.currenttranslation+1,appdata.currentcanto);
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
		document.body.onkeyup = function(e) {
			e.preventDefault();
			dom.removeclass(".button","on");
		};

	// page controls

		document.querySelector("#navtitle").onclick = function () {
			app.setpage("lens");
		};
		document.querySelector("#navsettings").onclick = function () {
			if(appdata.currentpage == "settings") {
//      if(appdata.currenttranslationlist.indexOf(appdata.translationdata[appdata.currenttranslation].translationid) > -1 ) {}
				app.setpage("lens");
			} else {
				app.updatesettings();
				app.setpage("settings");
			}
		};
		appdata.elements.main.onclick = function () {
			app.hidenotes();
		};
	},
	setupnotes: function() {
		var count = 0;
		var notes = document.querySelectorAll(".note");

		for(var i = 0; i < notes.length; i++) {
			var children = notes[i].children;
			for(var j=0; j < children.length; j++) {
				if(dom.hasclass(children[j],"notetext")) {
					console.log("notetext "+count);
					children[j].setAttribute("data-notenumber", count);
				}
				if(dom.hasclass(children[j],"noteno")) {
					console.log("noteno "+count);
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
	setlens: function(newtrans, newcanto, percentage) {
		console.log(`Setlens called for ${newtrans}, canto ${newcanto}`);
		var changetrans = false;

	// if page isn't set to "lens" this doesn't do anything

		if(appdata.currentpage == "lens") {
			if(newtrans - appdata.currenttranslation !== 0) {
				changetrans = true;
				percentage = (appdata.elements.text.scrollTop /*+ appdata.elements.text.clientHeight*/)/appdata.elements.text.scrollHeight;
				console.log(percentage);
			}

			if(newtrans >= appdata.translationcount) {
				newtrans = 0;
			}
			if(newtrans < 0) {
				newtrans = appdata.translationcount-1;
			}
			if(newcanto >= appdata.cantocount) {
				newcanto = 0;
			}
			if(newcanto < 0) {
				newcanto = appdata.cantocount-1;
			}

	// figure out which translation is the current translation

			for(var i=0; i < appdata.translationdata.length; i++) {
				if(appdata.currenttranslationlist[newtrans] == appdata.translationdata[i].translationid) {
					newtrans = i;
				}
			}
			appdata.elements.text.innerHTML = app.textdata[newtrans][newcanto];
			dom.removeclass("#text",appdata.translationdata[appdata.currenttranslation].translationclass);
			dom.addclass("#text",appdata.translationdata[newtrans].translationclass);
			app.setupnotes();
			appdata.currenttranslation = newtrans;
			appdata.currentcanto = newcanto;

			if(appdata.currentcanto > 0) {
				document.getElementById("navtitle").innerHTML = appdata.translationdata[appdata.currenttranslation].translationshortname+` · <strong>Canto ${appdata.currentcanto}</strong>`;
			} else {
				document.getElementById("navtitle").innerHTML = "&nbsp;";
			}

			app.fixpadding();

// set percentage: this is terrible! fix this!
// first: try to figure out how many lines we have? Can we do that?

			if(changetrans) {

		// this method still isn't great! it tries to round to current lineheight
		// to avoid cutting off lines

				var scrollto = app.rounded(percentage * appdata.elements.text.scrollHeight);
				appdata.elements.text.scrollTop = scrollto;
			} else {
				if(percentage > 0) {
					appdata.elements.text.scrollTop = appdata.elements.text.scrollHeight;
				} else {
					appdata.elements.text.scrollTop = 0;
				}
			}
		}
		app.savecurrentdata();
	},
	rounded: function(pixels) {

		// this is still a mess, fix this

		return appdata.lineheight * Math.floor(pixels / appdata.lineheight);

	},
	fixpadding: function() {
		var divs = document.querySelectorAll("#text p");
		var i, div, padding, desiredwidth;
		var maxwidth = 0;

		if(dom.hasclass(appdata.elements.text,"poetry")) {

// this is poetry, figure out longest line

			appdata.elements.text.style.paddingLeft = 0;
			for(i=0; i<divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";
				if(div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			console.log("text width: " + appdata.textwidth);
			console.log("max width: " + maxwidth);

			appdata.elements.text.style.paddingLeft = (appdata.textwidth - maxwidth)/2+"px";
			appdata.elements.text.style.paddingRight = (appdata.textwidth - maxwidth)/2+"px";
		} else {

	// this is prose, standardized padding

			desiredwidth = 75; // this is in vw

			console.log("text width: " + appdata.textwidth);
			console.log("desired width: " + desiredwidth);
			console.log("lineheight: " + appdata.lineheight);

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
		var insert, i, j, translatorlist;

	// add in translation chooser

		dom.removebyselector("#translatorlist");
		insert = dom.create('<ul id="translatorlist"></ul>');
		document.getElementById("translationchoose").appendChild(insert);
		translatorlist = document.querySelector("#translatorlist");
		for(i in appdata.translationdata) {
			insert = dom.create(`<li><input type="checkbox" id="check-${appdata.translationdata[i].translationid}" /><span id="${appdata.translationdata[i].translationid}" >${appdata.translationdata[i].translationfullname}</span></li>`);
			translatorlist.appendChild(insert);
			document.getElementById("check-"+appdata.translationdata[i].translationid).checked = (appdata.currenttranslationlist.indexOf(appdata.translationdata[i].translationid) > -1);
		}

		document.querySelectorAll("#translatorlist input[type=checkbox]").forEach(app.helpers.checkboxgo);
		// ES6: can we changed this to a for ... in loop?
		document.querySelectorAll("#translatorlist span").forEach(app.helpers.checkboxspango);
		// ES6: can we changed this to a for ... in loop?

	// add in toc

		dom.removebyselector("#selectors");
		insert = dom.create('<div id="selectors"><p>Canto: <select id="selectcanto"></select></p><p>Translation: <select id="selecttranslator"></select></p><p><span id="selectgo">Go</span></p></div>');
		document.getElementById("translationgo").appendChild(insert);
		for(i = 0; i < appdata.cantocount; i++) {
			insert = dom.create(`<option id="canto${i}" ${((appdata.currentcanto == i) ? "selected" : "")}>${appdata.cantotitles[i]}</option>`);
			document.getElementById("selectcanto").appendChild(insert);
		}
		for(i in appdata.currenttranslationlist) {
			for(j = 0; j < appdata.translationdata.length; j++) {
				if(appdata.translationdata[j].translationid == appdata.currenttranslationlist[i]) {
					insert = dom.create(`<option id="tr_${appdata.translationdata[j].translationid}" ${((appdata.currenttranslation == i) ? "selected" : "")}>${appdata.translationdata[j].translationfullname}</option>`);
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = function () {
			var selected = document.getElementById("selecttranslator");
			var thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			var thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for(j = 0; j < appdata.translationdata.length; j++) {
				if(appdata.currenttranslationlist[j] == thistrans) {
					app.setpage("lens");
					app.setlens(j,thiscanto,0);
				}
			}
		};
	},
	savecurrentdata: function() {
// this should store appdate on localstorage (does that work for mobile?)
		console.log("Storing preferences! TK");
	},
	changetranslation: function(thisid, isset) {
		console.log("changetranslation fired!");
		for(var i in appdata.translationdata) {
			if(thisid == appdata.translationdata[i].translationid) {
				if(isset) {
					appdata.currenttranslationlist.push(thisid);
					appdata.translationcount++;
				} else {
					if(appdata.translationcount > 1) {
						var j = appdata.currenttranslationlist.indexOf(thisid);
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

		var newlist = [];
		for(i in appdata.translationdata) {
			if(appdata.currenttranslationlist.indexOf(appdata.translationdata[i].translationid) > -1) {
				newlist.push(appdata.translationdata[i].translationid);
			}
		}
		appdata.currenttranslationlist = newlist.slice();
		// also what do we do when one is deleted?
		app.updatesettings();
	},
	setpage: function(newpage) {
		dom.removeclass(".page","on");
		dom.addclass(".page#"+newpage,"on");
		appdata.currentpage = newpage;
		app.resize();
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

app.initialize();
if (!('onDeviceReady' in document)) {
	console.log("Running non-Cordova code!");
	app.setup(); // (hopefully this doesn't fire in real version?)
}
