// helpers.js
//
// These are helper functions used by different modules.

"use strict";

var data = require("./appdata");

const helpers = {
	getUrlVars: function() {
		let vars = {};
		/*eslint-disable no-unused-vars*/
		let parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			vars[key] = value;
		});
		/*eslint-endable no-unused-vars*/
		return vars;
	},
	gettranslationindex: function(transid: string) {
		for(let j = 0; j < data.translationdata.length; j++) {
			if(transid == data.translationdata[j].translationid) {
				return j;
			}
		}
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
	}
};

module.exports = helpers;
