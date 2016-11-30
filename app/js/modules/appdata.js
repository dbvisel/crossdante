// appdata.js

module.exports = {
	currenttranslationlist: [],    // list of ids of translations we're currently using
	currenttranslation: "", // this was an index, changing it to a member of currenttranslationlist
	currentcanto: 0,
	lineheight: 24,
	lenswidth: window.innerWidth,		// do these numbers dynamically update? This could be screwing us up.
	lensheight: window.innerHeight - 40,
	windowwidth: window.innerWidth,
	windowheight: window.innerHeight,
	textwidth: window.innerWidth,
	currentpage: "lens",
	nightmode: false,
	currentpercentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
	currentlines: 0,       // this is the number of lines calculated to be on the page
	elements: {},
	delay: 300,
};
