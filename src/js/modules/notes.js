// notes.js
//
// This module contains code for dealing with notes if the translation uses them.

"use strict";

const dom = require("./dom");
var data = require("./appdata");

var notes = {
	setup: function() {
		let count = 0;
		let notes = document.querySelectorAll(".note");

		for(let i = 0; i < notes.length; i++) {
			let children = notes[i].children;
			for(let j=0; j < children.length; j++) {
				if(dom.hasclass(children[j],"notetext")) {
					children[j].setAttribute("data-notenumber", String(count));
				}
				if(dom.hasclass(children[j],"noteno")) {
					children[j].setAttribute("data-notenumber", String(count));
					notes.createclick(children[j]);
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
			notes.hide();
			let insert = dom.create(`<div class="notewindow" id="notewindow">
					${notetext}
				</div>`);
			data.elements.main.appendChild(insert);
			document.getElementById("notewindow").onclick = function() {
				notes.hide();
			};
		};
	},
	hide: function() {
		dom.removebyselector(".notewindow");
	},
};

module.exports = notes;
