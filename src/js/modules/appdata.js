// appdata.js

module.exports = {
	currenttranslationlist: [],    			// list of ids of translations we're currently using
	windowwidth: window.innerWidth,			// the window width
	windowheight: window.innerHeight,		// the window height
	currentpage: "lens",								// the page that we're currently viewing
	canto: 0,														// the current canto
	elements: {
		lens: document.getElementById("lens"),
		main: document.getElementById("main"),
		content: document.getElementById("content"),
		hammerleft: "",
		hammerright: ""
	},
	lens: {
		width: window.innerWidth,					// is this actually needed? same as windowwidth
		height: window.innerHeight - 40,	// this is assuming navbar is always 40px
		left: {
			translation: "", 		// this was an index, changing it to a member of currenttranslationlist
			lineheight: 24,			// this is the base lineheight; changed at different sizes
			percentage: 0, 			// this is current percentage of page (maybe this should be in terms of lines on page?)
			lines: 0,       		// this is the number of lines calculated to be on the page
			width: 0,						// this is the width of the left lens (0 if not in twin mode)
			titlebar: document.querySelector("#navbarleft .navtitle"),
			slider: document.getElementById("#sliderleft"),
			textinside: document.querySelector("#sliderleft .textinsideframe"),
			text: document.getElementById("#sliderleft .textframe"),
		},
		right: {
			translation: "", 						// this is an id found in currenttranslationlist
			lineheight: 24,							// this is the base lineheight; changed at different sizes
			percentage: 0, 							// this is current percentage of page (maybe this should be in terms of lines on page?)
			lines: 0,     		 					// this is the number of lines calculated to be on the page
			width: window.innerWidth,		// this is the width of the right lens (same as window if not in twin mode)
			titlebar: document.querySelector("#navbarright .navtitle"),
			slider: document.getElementById("#sliderright"),
			textinside: document.querySelector("#sliderright .textinsideframe"),
			text: document.getElementById("#sliderright .textframe")
		}
	},
	system: {
		responsive: true,	// if false, attempts to use viewport units (doesn't work right now)
		oncordova: false,	// this is true if running as an app
		platform: "",			// if on cordova, this is the platform for the book
		delay: 600				// this is the amount of time swiping takes, in ms
	},
	usersettings: {			// these can be overridden by previously saved user settings
		twinmode: false,	// whether or not twin mode is turned on
		nightmode: false,	// whether or not night mode is turned on
		shownotes: true		// whether or not notes are shown
	},

	// things that come from the bookfile (all of these are overwritten:)

	bookname: "",					// the work's individual code (lowercase, no punctuation, no spaces), e.g. "inferno"
	booktitle: "",				// the work's title
	bookauthor: "",				// the work's author (distinct from translator)
	versionhistory: [],		// the version history, an array of texts
	comingsoon: "",				// the book's coming soon information, a chunk of HTML
	translationcount: 0,	// this is the number of different translations in the book
	cantocount: 0,				// this is the number of cantos in the book
	textdata: [],
	translationdata: [],
	cantotitles: []				// the canonical titles for cantos, used in navbar and in selection
};
