// appdata.js
//
// basic appdata – there's also a translationdata array (metadata) and textdata (texts)
// is it worth folding this into app? Is there a value in keeping this separate?
//
// this probably needs some reworking?

const bookdata = require("./bookdata");

var appdata = {
	currenttranslationlist: [],    // list of ids of translations we're currently using
	currenttranslation: 0,
	translationcount: bookdata.translationdata.length,
	currentcanto: 0,
	cantocount: bookdata.cantotitles.length,
	lineheight: 24,
	lenswidth: window.innerWidth,
	lensheight: window.innerHeight - 40,
	windowwidth: window.innerWidth,
	windowheight: window.innerHeight,
	textwidth: window.innerWidth,
	currentpage: "lens",
	nightmode: false,
	currentpercentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
	currentlines: 0,       // this is the number of lines calculated to be on the page
	elements: {},
	textdata: {},
	translationdata: bookdata.translationdata,
	cantotitles: bookdata.cantotitles,
	delay: 500
};

module.exports = appdata;
