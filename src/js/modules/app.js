// version 4: now going to ES6 & Babel

"use strict";

const Hammer = require("hammerjs");
const Fastclick = require("fastclick");
const Velocity = require("velocity-animate");

const dom = require("./dom");
let data = require("./appdata");

var app = {
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

		window.addEventListener("resize", this.resize, false);

		// start fastclick

		if ('addEventListener' in document) {
			document.addEventListener('DOMContentLoaded', () => {
				Fastclick(document.body);
			}, false);
		}
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
				data.elements.main.appendChild(insert);
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
			app.setlens(app.nexttrans(data.lens.right.translation),data.canto,"right");
		};
		document.getElementById("navnext").onclick = () => {
			app.setlens(app.prevtrans(data.lens.right.translation),data.canto,"right");
		};
		document.getElementById("navup").onclick = () => {
			app.setlens(data.lens.right.translation,data.canto-1,"right",0);
		};
		document.getElementById("navdown").onclick = () => {
			app.setlens(data.lens.right.translation,data.canto+1,"right",0);
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
			data.usersettings.nightmode = false;
		};
		document.querySelector("#nightmode").onclick = () => {
			dom.addclass("body","nightmode");
			dom.removeclass("#nightmode","off");
			dom.addclass("#daymode","off");
			data.usersettings.nightmode = true;
		};
		if(document.getElementById("singlemode") !== null) {
			document.getElementById("singlemode").onclick = () => {
				dom.removeclass("body","twinmode");
				dom.addclass("#twinmode","off");
				dom.removeclass("#singlemode","off");
				data.usersettings.nightmode = false;
			};
			document.querySelector("#twinmode").onclick = () => {
				dom.addclass("body","twinmode");
				dom.removeclass("#twinmode","off");
				dom.addclass("#singlemode","off");
				data.usersettings.nightmode = true;
			};
		}

		// document.querySelectorAll(".backtosettings").forEach(app.helpers.gosettings);

		// or try something like this: Array.from(querySelectorAll('img')).forEach(img => doStuff);


		let backtosettings = document.querySelectorAll(".backtosettings");
		for (let i = 0; i < backtosettings.length; ++i) {
			app.helpers.gosettings(backtosettings[i]);
		}

		// swipe controls
		// should this actually be on the slider?

		let hammertime = new Hammer(data.elements.lens, {
		    touchAction : 'auto'
		}); // does this need to be a global?
		hammertime.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
		hammertime.on('swipeleft',(e) => {
			e.preventDefault();
			app.setlens(app.nexttrans(data.lens.right.translation),data.canto,"right");
		}).on('swiperight',(e) => {
			e.preventDefault();
			app.setlens(app.prevtrans(data.lens.right.translation),data.canto,"right");
		});

		hammertime.on('swipedown',(e) => {
//			e.preventDefault(); // attempt to fix android swipe down = reload behavior
			if(data.lens.right.text.scrollTop === 0) {
				app.setlens(data.lens.right.translation,data.canto-1,"right",1);  // this needs to be at the bottom!
			}
		}).on('swipeup',(e) => {
			e.preventDefault();
			// if difference between current scroll position + height of frame & complete height
			// of column is less than 8, go to the next one
			if(Math.abs(data.lens.right.text.scrollTop + data.lens.right.text.clientHeight - data.lens.right.text.scrollHeight) < 4) {
				app.setlens(data.lens.right.translation,data.canto+1,"right");
			}
		});

		// key controls

		document.body.onkeydown = (e) => {
			e.preventDefault();
			if((e.keyCode || e.which) === 37) {
				dom.addclass("#navprev","on");
				app.setlens(app.prevtrans(data.lens.right.translation),data.canto,"right");
			}
			if((e.keyCode || e.which) === 39) {
				dom.addclass("#navnext","on");
				app.setlens(app.nexttrans(data.lens.right.translation),data.canto,"right");
			}
			if((e.keyCode || e.which) === 38) {
				dom.addclass("#navup","on");
				app.setlens(data.lens.right.translation,data.canto-1,"right");
			}
			if((e.keyCode || e.which) === 40) {
				dom.addclass("#navdown","on");
				app.setlens(data.lens.right.translation,data.canto+1,"right",0);
			}
		};
		document.body.onkeyup = (e) => {
			e.preventDefault();
			dom.removeclass(".button","on");
		};

		// page controls

		data.lens.right.titlebar.onclick = () => {
			app.setpage("lens");
		};
		document.querySelector("#navsettings").onclick = () => {
			if(data.currentpage == "settings") {
				//      if(data.currenttranslationlist.indexOf(data.translationdata[data.lens.right.translation].translationid) > -1 ) {}
				app.setpage("lens");
			} else {
				app.updatesettings();
				app.setpage("settings");
			}
		};
		data.elements.main.onclick = () => {
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

console.log("Navbar: " + document.getElementById("navbar").clientWidth);
console.log("Navtitle: " + data.lens.right.titlebar.clientWidth);
console.log("button width: " + document.getElementById("navprev").clientWidth);

		data.windowwidth = window.innerWidth;
		data.windowheight = window.innerHeight;
		let titlewidth = document.getElementById("navbar").clientWidth - (5 * 40) - 1;
		if(data.usersettings.twinmode) {
			titlewidth = (document.getElementById("navbar").clientWidth / 2) - (5 * 40) - 1;
			console.log("In twin mode! width will be: "+ titlewidth);
		} else {
			console.log("Not twin mode!");
		}

console.log("titlewidth: " + titlewidth);

		data.lens.right.titlebar.style.width = `${titlewidth}px`;
		data.lens.right.titlebar.setAttribute("style",`width:${titlewidth}px`);

		console.log(`The window has been resized! New width: ${data.windowwidth},${data.windowheight}`);
		data.lens.width = data.windowwidth;
		data.lens.height = data.windowheight - document.getElementById("navbar").clientHeight;

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
			if(data.windowwidth < 640) {
				data.lens.right.lineheight = 20;
			} else {
				if(data.windowwidth < 768) {
					data.lens.right.lineheight = 24;
				} else {
					if(data.windowwidth < 1024) {
						data.lens.right.lineheight = 28;
					} else {
						data.lens.right.lineheight = 32;
					}
				}
			}
		} else {
			data.lens.right.lineheight = data.windowwidth/25;
		}

		data.lens.right.width = data.windowwidth;
		app.setlens(data.lens.right.translation,data.canto,"right");
	},
	nexttrans: function(giventranslation) {
		if(data.currenttranslationlist.length > 1) {
			if((data.currenttranslationlist.indexOf(giventranslation) + 1) == data.currenttranslationlist.length ) {
				return data.currenttranslationlist[0];
			} else {
				return data.currenttranslationlist[(data.currenttranslationlist.indexOf(giventranslation) + 1)];
			}
		} else {
			return giventranslation;
		}
	},
	prevtrans: function(giventranslation) {
		if(data.currenttranslationlist.length > 1) {
			if(data.currenttranslationlist.indexOf(giventranslation) == 0) {
				return data.currenttranslationlist[data.currenttranslationlist.length - 1];
			} else {
				return data.currenttranslationlist[(data.currenttranslationlist.indexOf(giventranslation) - 1)];
			}
		} else {
			return giventranslation;
		}
	},
	setlens: function(newtrans, newcanto, side, percentage) {
		console.log(`\nSetlens called for ${newtrans}, canto ${newcanto}, ${side}`);
		let thisside = data.lens[side];
		dom.removebyselector("#oldtext"); // attempt to fix flickering if too fast change

		let changetrans = false;
		let oldindex = data.currenttranslationlist.indexOf(thisside.translation); // the number of the old translation
		let newindex = data.currenttranslationlist.indexOf(newtrans); // the number of the trans we're going to

		if(data.currentpage == "lens") {

			// if page isn't set to "lens" this doesn't do anything

			if((newindex - oldindex) !== 0) {
				changetrans = true;
				percentage = (thisside.text.scrollTop /*+ thisside.text.clientHeight*/)/thisside.text.scrollHeight;
				console.log(`—>Current percentage: ${percentage}`);
			}

			if(newcanto >= data.cantocount) {
				newcanto = 0;
			} else {
				if(newcanto < 0) {
					newcanto = data.cantocount-1;
				}
			}

			// need to figure which translationdata we need

			let newdata = 0;
			let olddata = 0;

			for(let j in data.translationdata) {
				if(newtrans == data.translationdata[j].translationid) {
					newdata = j;
				}
				if(thisside.translation == data.translationdata[j].translationid) {
					olddata = j;
				}
			}

			if(newindex !== oldindex) {

				// console.log("Change in translation!");

				thisside.text.id = "oldtext";
				thisside.textinside.id = "oldtextinsideframe";

				// if new is bigger than old AND ( old is not 0 OR new is not the last one )
				// OR if new is 0 and old is the last one

				if( ((newindex > oldindex) && (oldindex > 0 || newindex !== (data.currenttranslationlist.length - 1 ))) || (newindex == 0 && oldindex == (data.currenttranslationlist.length-1)) ) {

					// console.log("Going right");  // we are inserting to the right

					let insert = dom.create(`<div id="text" class="textframe ${ data.translationdata[newdata].translationclass }" style="left:100%;"><div class="textinsideframe" id="textinsideframe">${ data.textdata[newdata].text[newcanto] }</div></div>`);
					thisside.slider.appendChild(insert);
					Velocity(thisside.slider, {'left':"-100%"}, {
						duration: data.system.delay,
						mobileHA: false,
						complete: function() {
							dom.removebyselector("#oldtext");
							thisside.slider.style.left = "0";
							thisside.text.style.left = "0";
						}
					});
				} else {

					// console.log("Going left"); // we are inserting to the left

					let insert = dom.create(`<div id="text" class="textframe ${ data.translationdata[newdata].translationclass }" style="left:-100%;"><div class="textinsideframe" id="textinsideframe">${ data.textdata[newdata].text[newcanto] }</div></div>`);
					thisside.slider.insertBefore(insert, thisside.slider.childNodes[0]);
					Velocity(thisside.slider, {'left':"100%"}, {
						duration: data.system.delay,
						mobileHA: false,
						complete: function() {
							dom.removebyselector("#oldtext");
							thisside.slider.style.left = "0";
							thisside.text.style.left = "0";
						}
					});
				}
				thisside.text = document.getElementById("text");
				dom.addclass("#text", "makescroll");
				thisside.textinside = document.getElementById("textinsideframe");
			} else {

				// console.log("No change in translation!"); // not shift left/shift right – do normal thing

				for(let j in data.translationdata) {
					if(newtrans == data.translationdata[j].translationid) {
						newdata = j;
					}
					if(thisside.translation == data.translationdata[j].translationid) {
						olddata = j;
					}
				}


				thisside.textinside.innerHTML = data.textdata[newdata].text[newcanto];
				dom.removeclass("#text",data.translationdata[olddata].translationclass); // is this not working for multiple classes?
				dom.addclass("#text",data.translationdata[newdata].translationclass); // is this not working for multiple classes?
			}

			app.setupnotes();
			thisside.translation = newtrans;
			data.canto = newcanto;


			if(data.system.responsive) {
				app.fixpaddingresponsive(thisside);
			} else {
				app.fixpadding(thisside);
			}

			// set percentage: this is terrible! fix this!
			// first: try to figure out how many lines we have? Can we do that?

			if(changetrans) {

				// this method still isn't great! it tries to round to current lineheight
				// to avoid cutting off lines

				let scrollto = app.rounded(percentage * thisside.text.scrollHeight);
				thisside.text.scrollTop = scrollto;
			} else {
				if(percentage > 0) {
					thisside.text.scrollTop = thisside.text.scrollHeight;
				} else {
					thisside.text.scrollTop = 0;
				}
			}

			if(data.canto > 0) {
				thisside.titlebar.innerHTML = `${data.translationdata[newdata].translationshortname} · <strong>Canto ${data.canto}</strong>`;
			} else {
				thisside.titlebar.innerHTML = "&nbsp;";
			}
		}
		app.savecurrentdata();
	},
	rounded: function(pixels) {

		// this is still a mess, fix this

		return data.lens.right.lineheight * Math.floor(pixels / data.lens.right.lineheight);

	},
	fixpadding: function(thisside) {
		const divs = document.querySelectorAll("#text p");
		var div, padding, desiredwidth;
		let maxwidth = 0;

		if(dom.hasclass(thisside.text,"poetry")) {

			// this is poetry, figure out longest line

			thisside.text.style.paddingLeft = 0;
			for(let i=0; i<divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";
				if(div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}

			console.log("—>text width: " + thisside.width);
			console.log("—>max width: " + maxwidth);

			thisside.text.style.paddingLeft = (thisside.width - maxwidth)/2+"px";
			thisside.text.style.paddingRight = (thisside.width - maxwidth)/2+"px";
		} else {

			// this is prose, standardized padding

			desiredwidth = 75; // this is in vw

			console.log("—>text width: " + thisside.width);
			console.log("—>desired width: " + desiredwidth);
			console.log("—>lineheight: " + thisside.lineheight);

			//		console.log(lens.width + " "+desiredwidth);
			//		var padding = (lens.width - desiredwidth)/2;

			padding = (100 - desiredwidth)/2;
			/*
			if((desiredwidth + 2) > lens.width) {
				thisside.text.style.paddingLeft = "1vw";
				thisside.text.style.paddingRight = "1vw";
			} else {
				*/
			thisside.text.style.paddingLeft = padding+"vw";
			thisside.text.style.paddingRight = padding+"vw";
			//		}
		}

	},
	fixpaddingresponsive: function(thisside) {
		const divs = document.querySelectorAll("#text p");
		var div;
		let maxwidth = 0;

		if(dom.hasclass(thisside.text,"poetry")) {

			// this is poetry, figure out longest line

			thisside.text.style.paddingLeft = 0;
			thisside.text.style.paddingRight = 0;
			thisside.textinside.style.marginLeft = 0;
			thisside.textinside.style.marginRight = 0;
			thisside.textinside.style.paddingLeft = 0;
			thisside.textinside.style.paddingRight = 0;
			for(let i=0; i<divs.length; i++) {
				div = divs[i];
				div.style.display = "inline-block";

				// this is not picking up indents, I think – maybe div.clientWidth + (div.style.marginLeft + div.style.textIndent)

				if(div.clientWidth > maxwidth) {
					maxwidth = div.clientWidth + 90;
				}
				div.style.display = "block";
			}


			if((thisside.width -16 ) > maxwidth) {
				console.log(`Text width: ${thisside.width}; max line width: ${maxwidth}; calculated padding: ${(thisside.width - maxwidth-16-16)/2}px`);
				thisside.text.style.paddingLeft = 0;
				thisside.text.style.paddingRight = 0;
				thisside.textinside.style.paddingLeft = 0;
				thisside.textinside.style.paddingRight = 0;
				thisside.textinside.style.marginLeft = (thisside.width - maxwidth - 16 - 16)/2+"px";
				thisside.textinside.style.marginRight = (thisside.width - maxwidth-16 - 16)/2+"px";
			} else {
				console.log(`Too wide! Text width: ${thisside.width}; max line width: ${maxwidth}.`);
				thisside.text.style.paddingLeft = 8+"px";
				thisside.text.style.paddingRight = 8+"px";
				thisside.textinside.style.marginLeft = 0;
				thisside.textinside.style.marginRight = 0;
			}
		} else {
			console.log("Prose, not doing anything.");
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
		for(let i in data.translationdata) {
				insert = dom.create(`<li>
						<input type="checkbox" id="check-${data.translationdata[i].translationid}" />
						<label for="${data.translationdata[i].translationid}" id="${data.translationdata[i].translationid}" ><span><span></span></span>${data.translationdata[i].translationfullname}</label>
					</li>`);
			translatorlist.appendChild(insert);
			document.getElementById("check-"+data.translationdata[i].translationid).checked = (data.currenttranslationlist.indexOf(data.translationdata[i].translationid) > -1);
		}

//		for(let i of document.querySelectorAll("#translatorlist input[type=checkbox]")) {
		let inputcheckbox = document.querySelectorAll("#translatorlist input[type=checkbox]");
		for(let i = 0; i < inputcheckbox.length; i++) {
			app.helpers.checkboxgo(inputcheckbox[i]);
		}
		let translatorlistlabel = document.querySelectorAll("#translatorlist label");
//		for(let i of document.querySelectorAll("#translatorlist label")) {
		for(let i = 0; i < translatorlistlabel.length; i++) {
			app.helpers.checkboxspango(translatorlistlabel[i]);
		}

		// add in toc

		dom.removebyselector("#selectors");
		insert = dom.create(`<div id="selectors">
				<p>Canto: <select id="selectcanto"></select></p>
				<p>Translation: <select id="selecttranslator"></select></p>
				<p><span id="selectgo">Go</span></p>
			</div>`);
		document.getElementById("translationgo").appendChild(insert);
		for(let i = 0; i < data.cantocount; i++) {
			insert = dom.create(`<option id="canto${i}" ${((data.canto == i) ? "selected" : "")}>${data.cantotitles[i]}</option>`);
			document.getElementById("selectcanto").appendChild(insert);
		}
		for(let i in data.currenttranslationlist) {
			for(let j = 0; j < data.translationdata.length; j++) {
				if(data.translationdata[j].translationid == data.currenttranslationlist[i]) {
					insert = dom.create(`<option id="tr_${data.translationdata[j].translationid}" ${((data.currenttranslationlist.indexOf(data.lens.right.translation) == i) ? "selected" : "")}>${data.translationdata[j].translationfullname}</option>`);
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = () => {
			let selected = document.getElementById("selecttranslator");
			let thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			let thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for(let j = 0; j < data.translationdata.length; j++) {
				if(data.currenttranslationlist[j] == thistrans) {
					app.setpage("lens");
					app.setlens(data.currenttranslationlist[j],thiscanto,"right",0);
				}
			}
		};
	},
	savecurrentdata: function() {

		// this should store appdate on localstorage (does that work for mobile?)
		// also if we're not on mobile, set canto/translation in hash


	},
	changetranslation: function(thisid, isset) {
		for(let i in data.translationdata) {
			if(thisid == data.translationdata[i].translationid) {
				if(isset) {
					data.currenttranslationlist.push(thisid);
					data.translationcount++;
				} else {
					if(data.translationcount > 1) {
						let j = data.currenttranslationlist.indexOf(thisid);
						if (j > -1) {
							data.currenttranslationlist.splice(j, 1);
						}
						data.translationcount--;
					} else {
						// there's only one translation in the list, do not delete last
						document.getElementById("check-"+thisid.toLowerCase()).checked = true;
					}
				}
			}
			app.savecurrentdata();
		}

		let newlist = [];
		for(let i in data.translationdata) {
			if(data.currenttranslationlist.indexOf(data.translationdata[i].translationid) > -1) {
				newlist.push(data.translationdata[i].translationid);
			}
		}
		data.currenttranslationlist = newlist.slice();

		if(data.currenttranslationlist.indexOf(data.lens.right.translation) < 0) {
			data.lens.right.translation = data.currenttranslationlist[0];
		}

		app.updatesettings();
	},
	setpage: function(newpage) {
		dom.removeclass(".page","on");
		dom.addclass(".page#"+newpage,"on");
		data.currentpage = newpage;
		if(newpage !== "lens") {
			// set title to be whatever the h1 is

			let newtitle = document.querySelector("#" + newpage + " h1").innerHTML;
			data.lens.right.titlebar.innerHTML = newtitle;
		} else {
			app.resize();
		}
	},
	onDeviceReady: function() {
		data.system.oncordova = true; // we're running on cordova
		data.system.platform = device.plaform; // should be either "iOS" or "Android"
		console.log(device.cordova);
		console.log("Cordova running. Platform: "+data.system.platform);
		app.setup();
	},
	setup: function() {
		console.log("In setup");

		// basic doc setup

		data.elements.lens = document.getElementById("lens");
		data.elements.main = document.getElementById("main");
		data.elements.content = document.getElementById("content");
		data.lens.left.slider = document.getElementById("sliderleft");
		data.lens.right.slider = document.getElementById("sliderright");
		data.lens.right.text = document.querySelector("#sliderright .textframe");
		data.lens.right.textinside = document.querySelector("#sliderright .textinsideframe");
		data.lens.right.titlebar = document.querySelector("#navbarright .navtitle");

		// set up about page

		document.title = "Cross Dante " + data.booktitle;
		document.getElementById("abouttext").innerHTML = data.description;

		// set up current translation list (initially use all of them)

		for(let i in data.translationdata) {
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
								app.setlens(data.lens.right.translation, data.canto-1,"right",1);
							}
							return;
						}
					}
				};
				document.addEventListener('touchstart', touchstartHandler, false);
				document.addEventListener('touchmove', touchmoveHandler, false);
			});
		}

		app.setupnotes();
		app.setupcontrols();
		dom.addclass("body",data.bookname);
		dom.addclass("body",data.system.oncordova ? "cordova" : "web");
		dom.removebyselector("#loadingscrim");
		app.setpage("lens");
	}
};

module.exports = app;
