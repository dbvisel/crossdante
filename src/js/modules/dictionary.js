//dictionary.js
//
// maybe useful: https://www.programmableweb.com/category/dictionary/api


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
			let match = "";
			if(data.translationdata[i].language) {
				for(let j in dictionary.languages) {
					if(data.translationdata[i].language.toUpperCase() === dictionary.languages[j].toUpperCase()) {
						console.log(`${data.translationdata[i].translationid} matches on language ${dictionary.languages[j]}`);
						match = dictionary.languages[j];
						break;
					}
				}
			}
			if(match === "") {
				console.log(`No dictionary support for ${data.translationdata[i].translationid}`);
			}
			data.translationdata[i].dictionarysupport = match;
		}

	},

	setup: function(side) {

		// setup dictonary halo on a particular text in a lens

		console.log(`Dictionary setup called for ${side.translation}`);
		let textnodes = dictionary.textNodesUnder(side.textinside);
		for(let textnode of textnodes) {
			console.log(textnode.data);
			textnode.data = dictionary.wrapwords(textnode.data, '<a class="dictionarylink" href="http://www.google.com/search?q=$&" target="_blank">$&</a>');
		}
		let paragraphs = side.textinside.querySelectorAll("p");
		for(let paragraph of paragraphs) {
			paragraph.innerHTML = decodeURI(paragraph.innerHTML);
			console.log(paragraph.innerHTML);
		}
	},
	textNodesUnder: function(el) {
		// from http://stackoverflow.com/questions/10730309/find-all-text-nodes-in-html-page
		var n, a=[], walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
		while(n = walk.nextNode()) a.push(n);
		return a;
	},
	wrapwords: function(str, tmpl) {
		// http://stackoverflow.com/questions/8609170/how-to-wrap-each-word-of-an-element-in-a-span-tag
		// this chokes on "&nbsp;" and presumably on all HTML
		// maybe this: http://stackoverflow.com/questions/17767251/how-to-ignore-escaped-character-in-regex
		console.log(str);
		return str.replace(/[A-zÀ-ÿ]+/g, tmpl || "<span>$&</span>");
	},

	call: function(wordtodefine) {
		console.log(wordtodefine);
	}
};

module.exports = dictionary;
