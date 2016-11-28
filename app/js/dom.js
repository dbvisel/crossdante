// dom.js

"use strict";

const dom = {
	create: function(htmlStr) {
		var frag = document.createDocumentFragment();
		var temp = document.createElement('div');
		temp.innerHTML = htmlStr;
		while (temp.firstChild) {
			frag.appendChild(temp.firstChild);
		}
		return frag;
	},
	removebyselector: function(selectorstring) {
		var selector = document.querySelector(selectorstring);
		if(selector !== null) {
			selector.parentNode.removeChild(selector);
		}
	},
	addclass: function(selectorstring, myclass) {
		var myelement = document.querySelectorAll(selectorstring);
		if(myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for(var j = 0; j < classes.length; j++) {
				dom.addclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelement.length; i++) {
				myelement[i].classList.add(myclass);
			}
		}
	},
	removeclass: function(selectorstring, myclass) {
		var myelement = document.querySelectorAll(selectorstring);
		if(myclass.indexOf(" ") > -1) {
			var classes = myclass.split(" ");
			for(var j = 0; j < classes.length; j++) {
				dom.removeclass(selectorstring, classes[j]);
			}
		} else {
			for (var i = 0; i < myelement.length; i++) {
				myelement[i].classList.remove(myclass);
			}
		}
	},
	hasclass: function(element, cls) {
		return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
	}
};

module.exports = dom;
