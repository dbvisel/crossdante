//dictionary.js

"use strict";

let data = require("./appdata");

const dictionary = {
	// languages is the list of languages we can support
	// master list here: https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry

	languages: ["en", "es", "ms", "sw", "tn", "nso", "lv", "id", "ur", "zu", "ro", "hi"],

	initialize: function() {

		// set up dictionary support

		console.log("Initializing dictionary support!");

		// loop through existing translations, see which ones we can support

		for(let i in data.translationdata) {
			let match = false;
			if(data.translationdata[i].language) {
				for(let j in dictionary.languages) {
					if(data.translationdata[i].language.toUpperCase() === dictionary.languages[j].toUpperCase()) {
						console.log(`${data.translationdata[i].translationid} matches on language ${dictionary.languages[j]}`);
						match = true;

						// do something! set a flag for this translation in data.translationdata[i]

					}
				}
			}
			if(!match) {
				console.log(`No dictionary support for ${data.translationdata[i].translationid}`);
			}
		}
	},

	setup: function(side) {

		// setup dictonary halo on a particular text in a lens

		console.log(`Setup called for ${side}`);
	}
};

module.exports = dictionary;
