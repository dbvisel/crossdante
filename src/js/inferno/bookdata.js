// the spine for the book

module.exports = {

	bookname: 'inferno',
	booktitle: "Inferno",
	bookauthor: "Dante Alighieri",
	description: `<p>What can one say about Dante’s <em>Inferno</em> that hasn’t already been said? Not very much. Obviously, there are better places to learn about Dante than the about page of an app; and you are probably smart enough to find them. Please note that the translations here aren’t being presented as the best translations of the <em>Inferno</em> available: rather, they’re here by virtue of being in the public domain.</p>`,
	versionhistory: [ // this is the version history for a particular book, a list
		"0.0.1: first release",
		"0.0.2: support for twin mode, remembers location",
		"0.0.3: added notes to the Cary translation"
	],

	comingsoon:  // this is what goes in the coming soon section, a single chunk of HTML
		"<p>More translations!</p>",


	cantotitles: [	// this is canto sequence
		"Title page","Canto 1","Canto 2","Canto 3","Canto 4","Canto 5","Canto 6","Canto 7","Canto 8","Canto 9",
		"Canto 10","Canto 11","Canto 12","Canto 13","Canto 14","Canto 15","Canto 16","Canto 17","Canto 18","Canto 19",
		"Canto 20","Canto 21","Canto 22","Canto 23","Canto 24","Canto 25","Canto 26","Canto 27","Canto 28","Canto 29",
		"Canto 30","Canto 31","Canto 32","Canto 33","Canto 34"
	],

	translationdata: [	// this is translation sequence
		{"translationid":"dante",
			"order":0},
		{"translationid":"longfellow",
			"order":1},
		{"translationid":"norton",
			"order":2},
		{"translationid":"cary",
			"order":3},
			/*,
		{"translationid":"wright",
			"order":3},
		{"translationid":"carlyle",
			"order":4}*/
	],

	textdata: [	// set up translations
		require("./translations/dante"),
		require("./translations/longfellow"),
		require("./translations/norton"),
		require("./translations/cary")/*,
		require("./translations/wright"),
		require("./translations/carlyle")*/
	]

};
