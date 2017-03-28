// setlens.js
//
// This module switches to a different translation/canto

"use strict";

const Velocity = require("velocity-animate");

const helpers = require("./helpers");  // .gettranslationindex
const dom = require("./dom");
const fixpadding = require("./fixpadding");
const notes = require("./notes");
const localdata = require("./localdata");

let data = require("./appdata");

const setlens = {
	go: function(newtrans: string, newcanto: number, side: string, percentage: number) {

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

				let scrollto = setlens.rounded(percentage * document.querySelector(`#newtext${side}`).scrollHeight);
				document.querySelector(`#newtext${side}`).scrollTop = scrollto;
				if(data.usersettings.twinmode) {
					let scrollto = setlens.rounded(percentage * document.querySelector(`#newtext${other}`).scrollHeight);
					document.querySelector(`#newtext${other}`).scrollTop = scrollto;
				}
				console.log("Scrolling to:" + scrollto);
				if(data.usersettings.twinmode) {
					setlens.turnonsynchscrolling();
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
				fixpadding.responsive(thisside);
				if(data.usersettings.twinmode) {
					fixpadding.responsive(otherside);
				}
			} else {
				fixpadding.regular(thisside);
				if(data.usersettings.twinmode) {
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
				setlens.turnonsynchscrolling();
			}

			// record changes

			localdata.save();
		}
	},
	rounded: function(pixels: number) {

		// this is still a mess, fix this

		return data.lens.right.lineheight * Math.floor(pixels / data.lens.right.lineheight);

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
	}

};

module.exports = setlens;
