// appdata.js

module.exports = {
	currenttranslationlist: [],    // list of ids of translations we're currently using
	windowwidth: window.innerWidth,
	windowheight: window.innerHeight,
	currentpage: "lens",
	canto: 0,	// the current canto
	elements: {
		lens: document.getElementById("lens"),
		main: document.getElementById("main"),
		content: document.getElementById("content"),
		hammerleft: "",
		hammerright: ""
	},
	lens: {
		width: window.innerWidth,		// do these numbers dynamically update? This could be screwing us up.
		height: window.innerHeight - 40,
		left: {
			translation: "", // this was an index, changing it to a member of currenttranslationlist
			lineheight: 24,
			percentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
			lines: 0,       // this is the number of lines calculated to be on the page
			titlebar: document.querySelector("#navbarleft .navtitle"),
			slider: document.getElementById("#sliderleft"),
			textinside: document.querySelector("#sliderleft .textinsideframe"),
			text: document.getElementById("#sliderleft .textframe"),
			width: 0
		},
		right: {
			translation: "", // this was an index, changing it to a member of currenttranslationlist
			lineheight: 24,
			percentage: 0, // this is current percentage of page (maybe this should be in terms of lines on page?)
			lines: 0,       // this is the number of lines calculated to be on the page
			titlebar: document.querySelector("#navbarright .navtitle"),
			slider: document.getElementById("#sliderright"),
			textinside: document.querySelector("#sliderright .textinsideframe"),
			text: document.getElementById("#sliderright .textframe"),
			width: window.innerWidth,
		}
	},
	system: {
		responsive: true,
		oncordova: false,
		platform: "",
		delay: 600  	// this is the amount of time swiping takes, in ms
	},
	usersettings: {	// these can be overridden by previously saved user settings
		twinmode: false,
		nightmode: false
	}
};
