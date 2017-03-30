// settings.js
//
// this controls everything that happens on the settings page

"use strict";

let data = require("./appdata");
const dom = require("./dom");

const settings = {
	checkboxgo: function(el) {
		el.onclick = function() {
			settings.changetranslation(this.id.replace("check-",""),document.getElementById(this.id).checked);
		};
	},
	checkboxspango: function(el) {
		el.onclick = function() {
			document.getElementById(`check-${this.id}`).checked = !document.getElementById(`check-${this.id}`).checked;
			settings.changetranslation(this.id,document.getElementById(`check-${this.id}`).checked);
		};
	},
	changetranslation: function(thisid: string, isset: boolean) {
		for(let i of data.translationdata) {
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
			data.settings.localsave = !data.settings.localsave;
			// app.localdata.save();
		}

		let newlist = [];
		for(let i of data.translationdata) {
			if(data.currenttranslationlist.indexOf(data.translationdata[i].translationid) > -1) {
				newlist.push(data.translationdata[i].translationid);
			}
		}
		data.currenttranslationlist = newlist.slice();

		if(data.currenttranslationlist.indexOf(data.lens.right.translation) < 0) {
			data.lens.right.translation = data.currenttranslationlist[0];
		}

		settings.update();
	},
	update: function() {	// fired whenever we go to settings page

		// add in translation chooser

		dom.removebyselector("#translatorlist");
		let insert = dom.create('<ul id="translatorlist"></ul>');
		document.getElementById("translationchoose").appendChild(insert);
		let translatorlist = document.querySelector("#translatorlist");
		for(let i = 0; i < data.translationdata.length; i++) {
			insert = dom.create(`<li>
					<input type="checkbox" id="check-${data.translationdata[i].translationid}" />
					<label for="${data.translationdata[i].translationid}" id="${data.translationdata[i].translationid}" ><span><span></span></span>${data.translationdata[i].translationfullname}</label>
				</li>`);
			translatorlist.appendChild(insert);
			document.getElementById("check-"+data.translationdata[i].translationid).checked = (data.currenttranslationlist.indexOf(data.translationdata[i].translationid) > -1);
		}

		let inputcheckbox = document.querySelectorAll("#translatorlist input[type=checkbox]");
		for(let i = 0; i < inputcheckbox.length; i++) {
			settings.checkboxgo(inputcheckbox[i]);
		}
		let translatorlistlabel = document.querySelectorAll("#translatorlist label");
		for(let i = 0; i < translatorlistlabel.length; i++) {
			settings.checkboxspango(translatorlistlabel[i]);
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
		for(let i = 0; i < data.currenttranslationlist.length; i++) {
			for(let j = 0; j < data.translationdata.length; j++) {
				if(data.translationdata[j].translationid === data.currenttranslationlist[i]) {
					insert = dom.create(`<option id="tr_${data.translationdata[j].translationid}" ${((data.currenttranslationlist.indexOf(data.lens.right.translation) == i) ? "selected" : "")}>${data.translationdata[j].translationfullname}</option>`);
					document.getElementById("selecttranslator").appendChild(insert);
				}
			}
		}

		document.querySelector("#selectgo").onclick = function() {
			let selected = document.getElementById("selecttranslator");
			let thistrans = selected.options[selected.selectedIndex].id.substr(3);
			selected = document.getElementById("selectcanto");
			let thiscanto = selected.options[selected.selectedIndex].id.substr(5);
			for(let j = 0; j < data.translationdata.length; j++) {
				if(data.currenttranslationlist[j] == thistrans) {
					data.settings.lens = {
						translation: data.currenttranslationlist[j],thiscanto,
						canto: thiscanto,
						side: "right",
						percentage: 0,
						trigger: !data.settings.lens.trigger
					};
				}
			}
		};
	}
};

module.exports = settings;
