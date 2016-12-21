// version 4: now going to ES6 & Babel

"use strict";

const Hammer = require("hammerjs");
const Fastclick = require("fastclick");
const Velocity = require("velocity-animate");

const dom = require("./dom");
let data = require("./appdata");

var app = {
	helpers: {
		gettranslationindex: function(transid) {
			for(let j = 0; j < data.translationdata.length; j++) {
				if(transid == data.translationdata[j].translationid) {
					return j;
				}
			}
		},
		rounded: function(pixels) {

			// this is still a mess, fix this

			return data.lens.right.lineheight * Math.floor(pixels / data.lens.right.lineheight);

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
			const divs = document.querySelectorAll(`#${thisside.slider.id} .textframe p`);
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
		turnonsynchscrolling: function() {
			document.querySelector("#sliderleft .textframe").onscroll = function() {
				let percentage = this.scrollTop / this.scrollHeight * document.querySelector("#sliderright .textframe").scrollHeight;
				document.querySelector("#sliderright .textframe").scrollTop = percentage;
			};
			document.querySelector("#sliderright .textframe").onscroll = function() {
				let percentage = this.scrollTop / this.scrollHeight * document.querySelector("#sliderleft .textframe").scrollHeight;
				document.querySelector("#sliderleft .textframe").scrollTop = percentage;
			};
		},
		getUrlVars: function() {
			let vars = {};
			/*eslint-disable no-unused-vars*/
			let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
				vars[key] = value;
			});
			/*eslint-endable no-unused-vars*/
			return vars;
		},
	},
	notes: {
		setup: function() {
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
						app.notes.createclick(children[j]);
					}
				}
				count++;
			}
		},
		createclick: function(el) {
			el.onclick = function(e) {
				e.stopPropagation();

				let thisnote = this.getAttribute("data-notenumber");
				let notetext = document.querySelector(`.notetext[data-notenumber="${thisnote}"]`).innerHTML;
				app.notes.hide();
				let insert = dom.create(`<div class="notewindow" id="notewindow">
						${notetext}
					</div>`);
				data.elements.main.appendChild(insert);
				document.getElementById("notewindow").onclick = () => {
					app.notes.hide();
				};
			};
		},
		hide: function() {
			dom.removebyselector(".notewindow");
		},
	},
	settings: {
		gosettings: function(element) {

			// this is never actually used!

			element.onclick = () => {
				app.setpage("settings");
			};
		},
		checkboxgo: function(el) {
			el.onclick = function() {
				app.settings.changetranslation(this.id.replace("check-",""),document.getElementById(this.id).checked);
			};
		},
		checkboxspango: function(el) {
			el.onclick = function() {
				document.getElementById(`check-${this.id}`).checked = !document.getElementById(`check-${this.id}`).checked;
				app.settings.changetranslation(this.id,document.getElementById(`check-${this.id}`).checked);
			};
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
				app.localdata.save();
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

			app.settings.update();
		},
		update: function() {	// fired whenever we go to settings page

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

			let inputcheckbox = document.querySelectorAll("#translatorlist input[type=checkbox]");
			for(let i = 0; i < inputcheckbox.length; i++) {
				app.settings.checkboxgo(inputcheckbox[i]);
			}
			let translatorlistlabel = document.querySelectorAll("#translatorlist label");
			for(let i = 0; i < translatorlistlabel.length; i++) {
				app.settings.checkboxspango(translatorlistlabel[i]);
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
		}
	},
	localdata: {
		save: function() {

			// this should store appdate on localstorage (does that work for mobile?)
			// also if we're not on mobile, set canto/translation in hash

			/*

			bookname:
			currentcanto:
			currenttranslation:
			translationset:
			twinmode
			nightmode

			*/

			// save current location as hash

			if (history.pushState) {
				let newurl = window.location.origin + window.location.pathname + `?canto=${data.canto}&trans=${data.lens.right.translation}`;
				if(data.usersettings.twinmode) {
					newurl += `&lefttrans=${data.lens.left.translation}`;
				}
				if (window.location.protocol !== "file:") {
					window.history.pushState({path:newurl},'',newurl);
				} else {
					console.log(newurl);
				}
			}
		},
		read: function() {

			let gotocanto = 0;
			let gototrans = "";
			let gotolefttrans = "";
			let gototwinmode = false;
			let cantoflag = false;
			let transflag = false;

			// this should take localstorage and replace the values in data with it

			// first, read local storage



			// second, read hash

			if(app.helpers.getUrlVars().canto) {
				gotocanto = app.helpers.getUrlVars().canto;
				cantoflag = true;
			}
			if(app.helpers.getUrlVars().trans) {
				gototrans = app.helpers.getUrlVars().trans;
				transflag = true;
			}
			if(app.helpers.getUrlVars().lefttrans) {
				gotolefttrans = app.helpers.getUrlVars().lefttrans;
				gototwinmode = true;
			}

			if(cantoflag && transflag) {
				console.log("We have canto & trans from URL!");
				if(gototwinmode) {
					console.log("We have left trans from URL!");
					data.usersettings.twinmode = true;
					dom.addclass("body","twinmode");
					dom.removeclass("#twinmode","off");
					dom.addclass("#singlemode","off");
					data.lens.left.translation = gotolefttrans;
				}
				app.setlens(data.currenttranslationlist[app.helpers.gettranslationindex(gototrans)],gotocanto,"right",0);
			} else {
				console.log("No canto/translation found in URL.");
			}
		},
	},
	controls: {
		start: function() {
			app.controls.navbar();
			app.controls.settings();
			app.controls.swiping();
			app.controls.notes();
			app.controls.keys();
		},
		navbar: function() {
			// button controls
			document.querySelector("#navbarleft .navprev").onclick = () => {
				app.setlens(app.helpers.nexttrans(data.lens.left.translation),data.canto,"left");
			};
			document.querySelector("#navbarleft .navnext").onclick = () => {
				app.setlens(app.helpers.prevtrans(data.lens.left.translation),data.canto,"left");
			};
			document.querySelector("#navbarleft .navup").onclick = () => {
				app.setlens(data.lens.right.translation,data.canto-1,"right",0);
			};
			document.querySelector("#navbarleft .navdown").onclick = () => {
				app.setlens(data.lens.right.translation,data.canto+1,"right",0);
			};
			document.querySelector("#navbarright .navprev").onclick = () => {
				app.setlens(app.helpers.nexttrans(data.lens.right.translation),data.canto,"right");
			};
			document.querySelector("#navbarright .navnext").onclick = () => {
				app.setlens(app.helpers.prevtrans(data.lens.right.translation),data.canto,"right");
			};
			document.querySelector("#navbarright .navup").onclick = () => {
				app.setlens(data.lens.right.translation,data.canto-1,"right",0);
			};
			document.querySelector("#navbarright .navdown").onclick = () => {
				app.setlens(data.lens.right.translation,data.canto+1,"right",0);
			};
			document.querySelector("#navbarleft .navclose").onclick = () => {
				dom.removeclass("body","twinmode");
				dom.addclass("#twinmode","off");
				dom.removeclass("#singlemode","off");
				data.usersettings.twinmode = false;
				app.resize();
			};
			data.elements.titlebar.onclick = () => {
				app.setpage("lens");
			};
			document.querySelector("#navbarright .navsettings").onclick = () => {
				app.settings.update();
				app.setpage("settings");
			};

			document.body.onkeyup = (e) => {	// maybe this is screwing us on mobile?
				e.preventDefault();
				dom.removeclass(".button","on");
			};
		},
		settings: function() {
			document.getElementById("aboutlink").onclick = () => {
				app.setpage("about");
			};
			document.getElementById("helplink").onclick = () => {
				app.setpage("help");
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
					data.usersettings.twinmode = false;
				};
				document.querySelector("#twinmode").onclick = () => {
					dom.addclass("body","twinmode");
					dom.removeclass("#twinmode","off");
					dom.addclass("#singlemode","off");
					data.usersettings.twinmode = true;
				};
			}
			document.getElementById("backbutton").onclick = () => {
				if(data.currentpage == "help" || data.currentpage == "about") {
					app.setpage("settings");
				} else {
					app.setpage("lens");
				}
			};

			// set up about page

			document.getElementById("abouttext").innerHTML = data.description; 		// set up about page

			for(let i in data.versionhistory) {
				document.getElementById("versionhistory").innerHTML += `<li>${data.versionhistory[i]}</li>`;
			}
			document.getElementById("comingsoon").innerHTML = data.comingsoon;

		},
		notes: function() {
			data.elements.main.onclick = () => {
				app.notes.hide();
			};

			console.log("Inserting notes . . .");
			for(let i = 0; i < data.textdata.length; i++) {
				let thisnotes = data.textdata[i].notes;
				if(typeof thisnotes !== "undefined") {
					console.log(data.textdata[i].translationid);
					for(let j = 0; j < thisnotes.length; j++) {
						for(let k = 0; k < thisnotes[j].length; k++) {
							let thisnote = thisnotes[j][k];
							if(data.textdata[i].text[j].indexOf("{{"+thisnote.noteno+"}}") > 0) {
								let copy = data.textdata[i].text[j].replace("{{"+thisnote.noteno+"}}", `<span class="note"><span class="noteno">${thisnote.noteno}</span><span class="notetext">${thisnote.notetext}</span></span>`);
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
			data.elements.hammerright.on('swipeleft',(e) => {
				e.preventDefault();
				app.setlens(app.helpers.nexttrans(data.lens.right.translation),data.canto,"right");
			}).on('swiperight',(e) => {
				e.preventDefault();
				app.setlens(app.helpers.prevtrans(data.lens.right.translation),data.canto,"right");
			});

			data.elements.hammerright.on('swipedown',(e) => {
				// e.preventDefault(); // attempt to fix android swipe down = reload behavior
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
			data.elements.hammerleft.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
			data.elements.hammerleft.on('swipeleft',(e) => {
				e.preventDefault();
				app.setlens(app.helpers.nexttrans(data.lens.left.translation),data.canto,"left");
			}).on('swiperight',(e) => {
				e.preventDefault();
				app.setlens(app.helpers.prevtrans(data.lens.left.translation),data.canto,"left");
			});

			data.elements.hammerleft.on('swipedown',(e) => {
				// e.preventDefault(); // attempt to fix android swipe down = reload behavior
				if(data.lens.left.text.scrollTop === 0) {
					app.setlens(data.lens.right.translation,data.canto-1,"right",1);  // this needs to be at the bottom!
				}
			}).on('swipeup',(e) => {
				e.preventDefault();
				// if difference between current scroll position + height of frame & complete height
				// of column is less than 8, go to the next one
				if(Math.abs(data.lens.left.text.scrollTop + data.lens.left.text.clientHeight - data.lens.left.text.scrollHeight) < 4) {
					app.setlens(data.lens.right.translation,data.canto+1,"right");
				}
			});
		},
		keys: function() {
			// key controls

			document.body.onkeydown = (e) => {
				e.preventDefault();
				if((e.keyCode || e.which) === 37) {
					dom.addclass("#navprev","on");
					app.setlens(app.helpers.prevtrans(data.lens.right.translation),data.canto,"right");
				}
				if((e.keyCode || e.which) === 39) {
					dom.addclass("#navnext","on");
					app.setlens(app.helpers.nexttrans(data.lens.right.translation),data.canto,"right");
				}
				if((e.keyCode || e.which) === 38) {
					dom.addclass("#navup","on");
					app.setlens(data.lens.right.translation,data.canto-1,"right");
				}
				if((e.keyCode || e.which) === 40) {
					dom.addclass("#navdown","on");
					app.setlens(data.lens.right.translation,data.canto+1,"right",0);
				}

				if((e.keyCode || e.which) === 33) {	// pageup: right now this goes to the previous canto
					dom.addclass("#navup","on");
					app.setlens(data.lens.right.translation,data.canto-1,"right");
				}
				if((e.keyCode || e.which) === 34) {	// pagedown: right now this goes to the next canto
					dom.addclass("#navdown","on");
					app.setlens(data.lens.right.translation,data.canto+1,"right",0);
				}

				if((e.keyCode || e.which) === 36) {	// home: right now this goes to the first canto
					dom.addclass("#navup","on");
					app.setlens(data.lens.right.translation,0,"right");
				}
				if((e.keyCode || e.which) === 35) {	// end: right now this goes to the last canto
					dom.addclass("#navdown","on");
					app.setlens(data.lens.right.translation,data.cantocount-1,"right",0);
				}
			};
		}
	},
	resize: function() {

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
				data.lens.left.translation = app.helpers.nexttrans(data.lens.right.translation);
			}

			let thistrans = app.helpers.gettranslationindex(data.lens.left.translation);

			dom.addclass("#sliderleft .textframe", data.translationdata[thistrans].translationclass);
			let insert = dom.create(data.textdata[thistrans].text[data.canto]);
			data.lens.left.textinside.appendChild(insert);

			data.lens.left.slider.style.width = "50%";
			data.lens.right.slider.style.width = "50%";
			app.setlens(data.lens.left.translation,data.canto,"left");
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

		app.setlens(data.lens.right.translation,data.canto,"right");
	},
	setlens: function(newtrans, newcanto, side, percentage) {
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
			let newtranslationindex = app.helpers.gettranslationindex(newtrans);
			let oldtranslationindex = app.helpers.gettranslationindex(thisside.translation);
			if(data.usersettings.twinmode) {
				othertranslationindex = app.helpers.gettranslationindex(otherside.translation);
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

				let scrollto = app.helpers.rounded(percentage * document.querySelector(`#newtext${side}`).scrollHeight);
				document.querySelector(`#newtext${side}`).scrollTop = scrollto;
				if(data.usersettings.twinmode) {
					let scrollto = app.helpers.rounded(percentage * document.querySelector(`#newtext${other}`).scrollHeight);
					document.querySelector(`#newtext${other}`).scrollTop = scrollto;
				}
				console.log("Scrolling to:" + scrollto);
				if(data.usersettings.twinmode) {
					app.helpers.turnonsynchscrolling();
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

				if(percentage > 0) {
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
				app.helpers.fixpaddingresponsive(thisside);
				if(data.usersettings.twinmode) {
					app.helpers.fixpaddingresponsive(otherside);
				}
			} else {
				app.helpers.fixpadding(thisside);
				if(data.usersettings.twinmode) {
					app.helpers.fixpadding(otherside);
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

			app.notes.setup();

			// turn on synch scrolling

			if(data.usersettings.twinmode) {
				app.helpers.turnonsynchscrolling();
			}

			// record changes

			app.localdata.save();
		}
	},
	setpage: function(newpage) {
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

			app.resize();
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

		window.addEventListener("resize", this.resize, false);

		// start fastclick

		if ('addEventListener' in document) {
			document.addEventListener('DOMContentLoaded', () => {
				Fastclick(document.body);
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

		data.elements.lens = document.getElementById("lens");
		data.elements.main = document.getElementById("main");
		data.elements.content = document.getElementById("content");
		data.elements.titlebar = document.querySelector("#navbarother .navtitle");

		data.lens.left.slider = document.getElementById("sliderleft");
		data.lens.left.text = document.querySelector("#sliderleft .textframe");
		data.lens.left.textinside = document.querySelector("#sliderleft .textinsideframe");
		data.lens.left.titlebar = document.querySelector("#navbarleft .navtitle");

		data.lens.right.slider = document.getElementById("sliderright");
		data.lens.right.text = document.querySelector("#sliderright .textframe");
		data.lens.right.textinside = document.querySelector("#sliderright .textinsideframe");
		data.lens.right.titlebar = document.querySelector("#navbarright .navtitle");


		document.title = "Cross Dante " + data.booktitle;

		if(data.usersettings.nightmode) {
			dom.addclass("body","nightmode");
		} else {
			dom.removeclass("body","nightmode");
		}

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

		app.controls.start();		// this sets up controls
		app.localdata.read();		// this reads in locally saved data
		dom.addclass("body",data.bookname);
		dom.addclass("body",data.system.oncordova ? "cordova" : "web");
		dom.removebyselector("#loadingscrim");
		app.setpage("lens"); // this could feasibly be set to what's in data.currentpage if we wanted to save that locally?

console.log(data);

	}
};

module.exports = app;
