// appdata.js
// @//flow
//
// This module sets up the data model for the text and the app.

"use strict";

let appdata: {
	currenttranslationlist: Array<string>,
	windowwidth: number,
	windowheight: number,
	currentpage: string,
	canto: number,
	elements: {
		lens: HTMLElement,
		main: HTMLElement,
		content: HTMLElement,
		hammerleft: HTMLElement,
		hammerright: HTMLElement,
		titlebar: HTMLElement
	},
	lens: {
		width: number,
		height: number,
		left:  {
			translation: string,
			lineheight: number,
			percentage: number,
			lines: number,
			width: number,
			titlebar: HTMLElement,
			slider: HTMLElement,
			textinside: HTMLElement,
			text: HTMLElement
		},
		right:  {
			translation: string,
			lineheight: number,
			percentage: number,
			lines: number,
			width: number,
			titlebar: HTMLElement,
			slider: HTMLElement,
			textinside: HTMLElement,
			text: HTMLElement
		}
	},
	system: {
		responsive: boolean,
		oncordova: boolean,
		platform: string,
		delay: number
	},
	bookname: string,
	booktitle: string,
	bookauthor: string,
	description: string,
	versionhistory: Array<string>,
	comingsoon: string,
	translationcount: number,
	cantocount: number,
	textdata: Array<*>,
	translationdata: Array<*>,
	cantotitles: Array<string>
} = {
	currenttranslationlist: [],   // list of ids of translations we're currently using
	windowwidth: 0,								// window.innerWidth, initially 0 so that resize runs
	windowheight: 0,							// window.innerHeight, initially 0 so that resize runs
	currentpage: "lens",					// the page that we're currently viewing
	canto: 0,											// the current canto
	elements: {
		lens: document.querySelector("html"),
		main: document.querySelector("html"),
		content: document.querySelector("html"),
		titlebar: document.querySelector("html"),
		hammerleft: document.querySelector("html"),
		hammerright: document.querySelector("html")
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

	// things that come from the bookfile (all of these are overwritten:)

	bookname: "",					// the work's individual code (lowercase, no punctuation, no spaces), e.g. "inferno"
	booktitle: "",				// the work's title
	bookauthor: "",				// the work's author (distinct from translator)
	description: "",			// the work's description (in bookdata)
	versionhistory: [],		// the version history, an array of texts
	comingsoon: "",				// the book's coming soon information, a chunk of HTML
	translationcount: 0,	// this is the number of different translations in the book
	cantocount: 0,				// this is the number of cantos in the book
	textdata: [],
	translationdata: [],
	cantotitles: [],			// the canonical titles for cantos, used in navbar and in selection
	watch: {
		setpage: "",				// this is a string (id of page)
		setlens: {
			trigger: false,		// when this changes, the thing is called
			canto: 0,					// what's fed to app.setlens
			translation: "",
			percentage: 0,
			side: "",
		},
		twinmode: false,		// whether or not twin mode is turned on
		nightmode: false,		// whether or not night mode is turned on
		shownotes: true,		// whether or not notes are shown
		localsave: false		// when this is flipped, localsave happens
	},
	setup: function() {
		appdata.elements.lens = document.getElementById("lens");
		appdata.elements.main = document.getElementById("main");
		appdata.elements.content = document.getElementById("content");
		appdata.elements.titlebar = document.querySelector("#navbarother .navtitle");

		appdata.lens.left.slider = document.getElementById("sliderleft");
		appdata.lens.left.text = document.querySelector("#sliderleft .textframe");
		appdata.lens.left.textinside = document.querySelector("#sliderleft .textinsideframe");
		appdata.lens.left.titlebar = document.querySelector("#navbarleft .navtitle");

		appdata.lens.right.slider = document.getElementById("sliderright");
		appdata.lens.right.text = document.querySelector("#sliderright .textframe");
		appdata.lens.right.textinside = document.querySelector("#sliderright .textinsideframe");
		appdata.lens.right.titlebar = document.querySelector("#navbarright .navtitle");
	}
};

module.exports = appdata;
