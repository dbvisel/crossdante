// dom.js
// @flow
//
// this module is basic dom manipulation

"use strict";

const dom = {
	create: function(htmlStr: string) {
		let frag: DocumentFragment = document.createDocumentFragment();
		let temp: Element = document.createElement('div');
		temp.innerHTML = htmlStr;
		while (temp.firstChild) {
			frag.appendChild(temp.firstChild);
		}
		return frag;
	},
	removebyselector: function(selectorstring: string) {
		const selector = document.querySelector(selectorstring);
		if(selector !== null) {
			if(selector.parentNode && selector.parentNode !== null) {
				selector.parentNode.removeChild(selector);
			}
		}
	},
	addclass: function(selectorstring: string, myclass: string) {
		const myelementlist: NodeList<*> = document.querySelectorAll(selectorstring);
		if(myclass.indexOf(" ") > -1) {
			var classes: Array<string>  = myclass.split(" ");
			for(var j = 0; j < classes.length; j++) {
				dom.addclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelementlist.length; i++) {
				myelementlist[i].classList.add(myclass);
			}
		}
	},
	removeclass: function(selectorstring: string, myclass: string) {
		const myelementlist: NodeList<*> = document.querySelectorAll(selectorstring);
		if(myclass.indexOf(" ") > -1) {
			let classes: Array<string> = myclass.split(" ");
			for(let j = 0; j < classes.length; j++) {
				dom.removeclass(selectorstring, classes[j]);
			}
		} else {
			for (let i = 0; i < myelementlist.length; i++) {
				myelementlist[i].classList.remove(myclass);
			}
		}
	},
	hasclass: function(element: Element, classname: string) {
		return (' ' + element.className + ' ').indexOf(' ' + classname + ' ') > -1;
	}
};

module.exports = dom;
